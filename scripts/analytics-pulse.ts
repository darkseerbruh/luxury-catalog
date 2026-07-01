/**
 * Live analytics pulse — the "how's my site doing?" command.
 *
 * Pulls the current numbers from PostHog (HogQL via the Query API) and prints
 * them as one compact JSON object on stdout. The point is that ANY Claude chat
 * can run `npm run analytics:pulse` and render the result as a dashboard inline,
 * so the owner reads her analytics inside Claude and never opens PostHog.
 *
 * Run:  npm run analytics:pulse
 *
 * Required (read from the environment, or auto-loaded from .env.local):
 *   POSTHOG_PERSONAL_API_KEY   Personal API key, scope: query:read  (phx_…)
 *   POSTHOG_PROJECT_ID         The number in your PostHog URL (/project/<ID>/…)
 * Optional:
 *   POSTHOG_HOST               Default https://us.i.posthog.com
 *
 * The personal key is a SECRET and is never printed. If it is missing, the
 * script prints a one-screen setup guide and exits 0 (so it never looks broken).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

// --- Load .env.local for local runs (no dependency on dotenv) ---
function loadDotEnvLocal(): void {
  try {
    const file = path.join(process.cwd(), ".env.local");
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // No .env.local — rely on the real environment.
  }
}
loadDotEnvLocal();

const KEY = process.env.POSTHOG_PERSONAL_API_KEY ?? "";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "";
const HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

// --- Launch-awareness + real-traffic config (non-secret, defaults in code) ---
// The production host. Anything else ($host = localhost:*, the Vercel preview,
// null) is INTERNAL traffic — you, dev, and previews — and is reported
// separately so it never inflates the "real visitors" number.
const PROD_HOST = process.env.ANALYTICS_PROD_HOST ?? "www.luxurycatalog.com";

// Launch date (ISO, e.g. "2026-07-15"). Null/unset/future => the site is
// pre-launch: the pulse leads with INSTRUMENTATION READINESS ("is every event
// firing?") instead of pretending the handful of real visitors is performance.
// On launch day, set ANALYTICS_LAUNCH_DATE (or edit this line) to flip into the
// performance view. No secret, so it lives in code.
const LAUNCH_DATE = process.env.ANALYTICS_LAUNCH_DATE ?? null;

function launchMode(): "pre_launch" | "live" {
  if (!LAUNCH_DATE) return "pre_launch";
  const d = new Date(LAUNCH_DATE);
  if (Number.isNaN(d.getTime())) return "pre_launch";
  return d.getTime() <= Date.now() ? "live" : "pre_launch";
}

// SQL predicate: this event came from the real production site (not dev/preview).
const PROD = `properties.$host = '${PROD_HOST}'`;

/**
 * Read the canonical event taxonomy straight from the app source so the
 * readiness view always matches the code (and flags events the code defines but
 * never fires). We parse the string literals out of events.ts rather than import
 * it, because that module pulls in browser-only posthog-js.
 */
function definedEventNames(): string[] {
  try {
    const src = readFileSync(
      path.join(process.cwd(), "src/lib/analytics/events.ts"),
      "utf8",
    );
    const block = src.slice(src.indexOf("EVENTS = {"), src.indexOf("} as const"));
    const names = new Set<string>();
    for (const m of block.matchAll(/:\s*"([a-z0-9_]+)"/g)) names.add(m[1]);
    return [...names].sort();
  } catch {
    return [];
  }
}

if (!KEY || !PROJECT_ID) {
  console.log(
    JSON.stringify(
      {
        status: "not_configured",
        message:
          "Live analytics need a PostHog personal API key + project id. " +
          "Only the public site key is set, which cannot read data back.",
        how_to_enable: [
          "1. Go to PostHog → Settings → Personal API keys → Create.",
          "2. Give it the 'query:read' scope (insight/dashboard/cohort:write too if you also want the dashboards script).",
          "3. Copy the key (phx_…) and your project id (the number in the URL /project/<id>/).",
          "4. Add POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to .env.local, then rerun.",
        ],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

async function hogql(query: string): Promise<unknown[]> {
  const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!res.ok) {
    throw new Error(`PostHog query failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { results?: unknown[] };
  return json.results ?? [];
}

async function main(): Promise<void> {
  const mode = launchMode();

  // --- Real (production) visitors + week-over-week, dev/preview stripped out ---
  const visitors = await hogql(`
    select
      count(distinct if(timestamp >= now() - interval 7 day and ${PROD}, distinct_id, null)) as real_visitors_7d,
      count(distinct if(timestamp >= now() - interval 14 day and timestamp < now() - interval 7 day and ${PROD}, distinct_id, null)) as real_visitors_prior_7d,
      count(distinct if(timestamp >= now() - interval 30 day and ${PROD}, distinct_id, null)) as real_visitors_30d,
      countIf(event = '$pageview' and timestamp >= now() - interval 7 day and ${PROD}) as real_pageviews_7d,
      count(distinct if(timestamp >= now() - interval 7 day and not (${PROD}), distinct_id, null)) as internal_visitors_7d
    from events
    where timestamp >= now() - interval 30 day
  `);
  const v = (visitors[0] ?? []) as number[];
  const real7 = Number(v[0] ?? 0);
  const realPrior7 = Number(v[1] ?? 0);
  const wowPct =
    realPrior7 > 0 ? Math.round(((real7 - realPrior7) / realPrior7) * 100) : null;

  // --- Real visitors per day (30d, production only) ---
  const visitorsByDay = await hogql(`
    select toDate(timestamp) as day, count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 30 day and ${PROD}
    group by day order by day
  `);

  // --- Acquisition (7d, production only) ---
  const sources = await hogql(`
    select coalesce(nullIf(properties.utm_source, ''), properties.entry_referrer, '$direct') as source,
           count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 7 day and ${PROD}
    group by source order by visitors desc limit 12
  `);

  // --- Top entry pages (7d, production only) ---
  const entryPages = await hogql(`
    select properties.entry_pathname as page, count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 7 day and ${PROD} and isNotNull(properties.entry_pathname)
    group by page order by visitors desc limit 12
  `);

  // --- Instrumentation readiness: every DEFINED event, has it ever fired? ---
  // The pre-launch question is "is the pipe working end to end", so we check the
  // whole taxonomy from events.ts against real fires (all-time), not a window.
  const defined = definedEventNames();
  const firedRows = (await hogql(`
    select event, count() as n, max(timestamp) as last_seen
    from events
    where event not like '$%'
    group by event
  `)) as [string, number, string][];
  const firedMap = new Map(firedRows.map((r) => [r[0], { n: Number(r[1]), last_seen: r[2] }]));
  const readiness = defined.map((event) => {
    const hit = firedMap.get(event);
    return {
      event,
      fired_ever: Boolean(hit),
      count_all_time: hit?.n ?? 0,
      last_seen: hit?.last_seen ?? null,
    };
  });
  const neverFired = readiness.filter((r) => !r.fired_ever).map((r) => r.event);

  // --- Journey funnel (30d, production only) — real taxonomy, in visit order.
  // Only the events that actually exist in the taxonomy, so no phantom zeros.
  const journeyEvents = [
    "$pageview",
    "search_performed",
    "catalog_filtered",
    "variant_viewed",
    "price_history_viewed",
    "value_module_viewed",
    "auth_section_engaged",
    "item_saved",
    "quiz_started",
    "quiz_completed",
    "outbound_resale_clicked",
    "outbound_consign_clicked",
    "authentication_interest",
    "monetization_interest",
    "newsletter_subscribed",
  ].filter((e) => e.startsWith("$") || defined.includes(e));
  const journeyCases = journeyEvents
    .map((e) => `count(distinct if(event = '${e}', distinct_id, null)) as \`${e}\``)
    .join(",\n      ");
  const journey = await hogql(`
    select
      ${journeyCases}
    from events
    where timestamp >= now() - interval 30 day and ${PROD}
  `);

  // --- Top brands viewed (30d, production only) ---
  const brands = await hogql(`
    select properties.brand as brand, count() as views
    from events
    where event = 'variant_viewed' and timestamp >= now() - interval 30 day and ${PROD}
      and isNotNull(properties.brand)
    group by brand order by views desc limit 10
  `);

  const out = {
    status: "ok",
    mode,
    generated_at: new Date().toISOString(),
    prod_host: PROD_HOST,
    launch_date: LAUNCH_DATE,
    note:
      mode === "pre_launch"
        ? "PRE-LAUNCH: real-visitor counts are you + previews, not an audience. Read the readiness block — it proves every event fires before launch day. Set ANALYTICS_LAUNCH_DATE to switch to the performance view."
        : "LIVE: counts are production only (dev/preview excluded); last 7 / 30 days as labelled; distinct people unless noted.",
    traffic: {
      real_visitors_7d: real7,
      real_visitors_prior_7d: realPrior7,
      wow_change_pct: wowPct,
      real_visitors_30d: Number(v[2] ?? 0),
      real_pageviews_7d: Number(v[3] ?? 0),
      internal_visitors_7d_excluded: Number(v[4] ?? 0),
      by_day: visitorsByDay,
    },
    acquisition_7d: sources,
    entry_pages_7d: entryPages,
    instrumentation_readiness: {
      defined: defined.length,
      firing_ever: defined.length - neverFired.length,
      never_fired_count: neverFired.length,
      never_fired: neverFired,
      never_fired_meaning:
        "Not yet fired = either not wired in code, or wired but no one has done it yet (likely pre-launch). Cross-check against src/lib/analytics/events.ts call sites.",
      events: readiness,
    },
    journey_30d_prod: journey[0] ?? null,
    journey_step_order: journeyEvents,
    top_brands_30d_prod: brands,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("[analytics-pulse] Failed:", err.message ?? err);
  process.exit(1);
});
