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
  // --- Visitors & activity ---
  const visitors = await hogql(`
    select
      count(distinct if(timestamp >= now() - interval 7 day, distinct_id, null)) as visitors_7d,
      count(distinct if(timestamp >= now() - interval 14 day and timestamp < now() - interval 7 day, distinct_id, null)) as visitors_prior_7d,
      count(distinct if(timestamp >= now() - interval 30 day, distinct_id, null)) as visitors_30d,
      countIf(event = '$pageview' and timestamp >= now() - interval 7 day) as pageviews_7d
    from events
    where timestamp >= now() - interval 30 day
  `);

  // --- Visitors per day (last 30d), for a sparkline/line ---
  const visitorsByDay = await hogql(`
    select toDate(timestamp) as day, count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 30 day
    group by day order by day
  `);

  // --- Where traffic comes from (7d) ---
  const sources = await hogql(`
    select coalesce(nullIf(properties.utm_source, ''), properties.entry_referrer, '$direct') as source,
           count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 7 day
    group by source order by visitors desc limit 12
  `);

  // --- Top entry pages (7d) ---
  const entryPages = await hogql(`
    select properties.entry_pathname as page, count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 7 day and isNotNull(properties.entry_pathname)
    group by page order by visitors desc limit 12
  `);

  // --- Journey step counts (people who did each, 30d) ---
  const journeyEvents = [
    "$pageview",
    "search_performed",
    "search_not_found",
    "catalog_filtered",
    "style_viewed",
    "variant_viewed",
    "price_history_viewed",
    "auth_section_engaged",
    "value_module_viewed",
    "quiz_started",
    "quiz_completed",
    "item_saved",
    "outbound_resale_clicked",
    "outbound_consign_clicked",
    "inquiry_submitted",
    "newsletter_subscribed",
    "monetization_interest",
    "authentication_interest",
  ];
  const journeyCases = journeyEvents
    .map(
      (e) =>
        `count(distinct if(event = '${e}', distinct_id, null)) as \`${e}\``,
    )
    .join(",\n      ");
  const journey = await hogql(`
    select
      ${journeyCases}
    from events
    where timestamp >= now() - interval 30 day
  `);

  // --- Top brands viewed (30d) ---
  const brands = await hogql(`
    select properties.brand as brand, count() as views
    from events
    where event = 'variant_viewed' and timestamp >= now() - interval 30 day
      and isNotNull(properties.brand)
    group by brand order by views desc limit 10
  `);

  const out = {
    status: "ok",
    generated_at: new Date().toISOString(),
    window: "Counts are last 7 / 30 days as labelled; distinct people unless noted.",
    visitors: visitors[0] ?? null,
    visitors_by_day: visitorsByDay,
    sources,
    entry_pages: entryPages,
    journey_30d: journey[0] ?? null,
    journey_step_order: journeyEvents,
    top_brands_30d: brands,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("[analytics-pulse] Failed:", err.message ?? err);
  process.exit(1);
});
