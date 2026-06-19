/**
 * Automated analytics digest.
 *
 * Pulls the week's behavioral data from PostHog (HogQL via the Query API) and
 * product-gap signals from Supabase, hands them to Claude with a fixed report
 * template, and writes a markdown digest to reports/analytics/.
 *
 * Run locally:  npx tsx scripts/analytics-digest.ts
 * In CI:        see .github/workflows/analytics-digest.yml (weekly)
 *
 * Required env (the script skips gracefully if any are missing):
 *   POSTHOG_PERSONAL_API_KEY   Personal API key (read access to the project)
 *   POSTHOG_PROJECT_ID         Numeric project id
 *   ANTHROPIC_API_KEY          For report generation
 * Optional env:
 *   POSTHOG_HOST               Default https://us.i.posthog.com
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  Adds product-gap data
 *   ANALYTICS_DIGEST_MODEL     Anthropic model id (default: a current Opus model)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY ?? "";
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "";
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const DIGEST_MODEL = process.env.ANALYTICS_DIGEST_MODEL ?? "claude-opus-4-8";

function isoWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Run a HogQL query against the PostHog Query API. */
async function hogql(query: string): Promise<unknown> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    },
  );
  if (!res.ok) {
    throw new Error(`PostHog query failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { results?: unknown };
  return json.results ?? [];
}

async function gatherPostHog() {
  // Event volumes this period vs the prior period (week over week).
  const eventTrends = await hogql(`
    select event,
           countIf(timestamp >= now() - interval 7 day) as this_week,
           countIf(timestamp >= now() - interval 14 day
                   and timestamp < now() - interval 7 day) as prior_week
    from events
    where timestamp >= now() - interval 14 day
    group by event
    order by this_week desc
    limit 40
  `);

  // Where inbound traffic came from (last 7 days).
  const acquisition = await hogql(`
    select coalesce(nullIf(properties.utm_source, ''),
                    properties.entry_referrer, '$direct') as source,
           count() as events,
           count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 7 day
    group by source
    order by visitors desc
    limit 25
  `);

  // Top entry pages (last 7 days).
  const entryPages = await hogql(`
    select properties.entry_pathname as entry, count(distinct distinct_id) as visitors
    from events
    where timestamp >= now() - interval 7 day and isNotNull(properties.entry_pathname)
    group by entry
    order by visitors desc
    limit 25
  `);

  return { eventTrends, acquisition, entryPages };
}

async function gatherSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const [searches, feedback] = await Promise.all([
    supabase
      .from("searched_not_found")
      .select("search_query, result_count, date")
      .gte("date", since)
      .eq("resolved", false)
      .order("date", { ascending: false })
      .limit(100),
    supabase
      .from("user_feedback")
      .select("record_type, feedback_type, user_note, date")
      .eq("resolved", false)
      .order("date", { ascending: false })
      .limit(100),
  ]);

  return {
    searchedNotFound: searches.data ?? [],
    openFeedback: feedback.data ?? [],
  };
}

const REPORT_TEMPLATE = `Produce a weekly analytics digest as GitHub-flavored markdown with EXACTLY these sections:

## Scorecard
Core-flow conversion rates vs prior period, traffic by channel, and the strongest value proxy this week.

## Flow performance & drop-offs
The biggest leak in the discovery / depth / intent funnels this week and the most likely cause.

## Inbound
Where traffic came from and where it went.

## Emerging segments
New or shifting user types inferred from behavior, each with a recommended strategy to serve them.

## Monetization signals
Rank the value-proxy events (inquiry, outbound resale, save, premium interest) and what they imply about what to monetize.

## Experiment readouts
Any running A/B tests, the directional Bayesian leader, whether traffic is sufficient to call it, and the next test to run.

## Optimization recommendations
A short, prioritized list. Each item names the metric it should move.

## Instrumentation health
High-frequency autocaptured interactions that should be promoted to named events.

Rules: be concrete and quantitative, cite the numbers from the data, and when data is thin say so plainly rather than inventing trends.`;

async function main(): Promise<void> {
  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID || !ANTHROPIC_API_KEY) {
    console.log(
      "[analytics-digest] Skipping: set POSTHOG_PERSONAL_API_KEY, " +
        "POSTHOG_PROJECT_ID and ANTHROPIC_API_KEY to enable.",
    );
    return;
  }

  console.log("[analytics-digest] Gathering PostHog data...");
  const posthogData = await gatherPostHog();
  console.log("[analytics-digest] Gathering Supabase data...");
  const supabaseData = await gatherSupabase();

  const period = isoWeek(new Date());
  const payload = JSON.stringify(
    { period, posthog: posthogData, supabase: supabaseData },
    null,
    2,
  );

  console.log("[analytics-digest] Generating report with Claude...");
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: DIGEST_MODEL,
    max_tokens: 4000,
    system:
      "You are the analytics lead for a pre-launch luxury handbag reference/authentication catalog whose monetization model is not yet decided. Your job is to find what users value, what they would pay for, and which user types are emerging.",
    messages: [
      {
        role: "user",
        content: `${REPORT_TEMPLATE}\n\nHere is this week's data as JSON:\n\n\`\`\`json\n${payload}\n\`\`\``,
      },
    ],
  });

  const body = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const outDir = path.join(process.cwd(), "reports", "analytics");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${period}.md`);
  await writeFile(
    outPath,
    `# Analytics digest — ${period}\n\n_Generated ${new Date().toISOString()}_\n\n${body}\n`,
  );
  console.log(`[analytics-digest] Wrote ${outPath}`);
}

main().catch((err) => {
  console.error("[analytics-digest] Failed:", err);
  process.exit(1);
});
