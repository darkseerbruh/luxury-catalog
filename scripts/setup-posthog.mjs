/**
 * One-shot PostHog setup for the Luxury Catalog.
 *
 * Creates THREE plainly-named dashboards that answer the two owner questions —
 * "is anyone visiting?" and "are they doing the journeys I want?" — and pins the
 * funnels / trends behind them, using the PostHog API. Safe to re-run: it
 * appends, so delete duplicates in the UI if you run it twice.
 *
 *   1. "1 · Is anyone here?"     — visitors, sessions, where they come from.
 *   2. "2 · Are they exploring?" — discovery → depth: search/filter → bag → deep.
 *   3. "3 · Doing what I want?"  — intent journeys: value reads, outbound clicks,
 *                                  the Style-read quiz, saves, newsletter.
 *
 * Usage:
 *   POSTHOG_PERSONAL_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 \
 *     node scripts/setup-posthog.mjs
 *
 * The personal API key needs scopes: dashboard:write, insight:write,
 * cohort:write (create it in PostHog -> Settings -> Personal API keys).
 */

const HOST = process.env.POSTHOG_HOST ?? "https://us.posthog.com";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

if (!KEY || !PROJECT_ID) {
  console.error(
    "Missing env. Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID.\n" +
      "  - Personal API key: PostHog -> Settings -> Personal API keys (scopes: dashboard:write, insight:write, cohort:write)\n" +
      "  - Project ID: the number in your PostHog URL (/project/<ID>/...)",
  );
  process.exit(1);
}

const base = `${HOST}/api/projects/${PROJECT_ID}`;

async function api(path, body, method = "POST") {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

// ---- Query builders (modern HogQL-backed insight queries) ----

const DATE = (days) => ({ date_from: `-${days}d` });

// math: "total" = raw count; "dau" = unique people per interval; "unique_session" = sessions.
const event = (name, label, math = "total") => ({
  kind: "EventsNode",
  event: name,
  name: label ?? name,
  math,
});

function trends({ series, days = 14, breakdown, display, interval = "day" }) {
  return {
    kind: "InsightVizNode",
    source: {
      kind: "TrendsQuery",
      series,
      interval,
      dateRange: DATE(days),
      trendsFilter: display ? { display } : {},
      ...(breakdown
        ? { breakdownFilter: { breakdowns: [{ type: "event", property: breakdown }] } }
        : {}),
    },
  };
}

function funnel({ steps, days = 14 }) {
  return {
    kind: "InsightVizNode",
    source: {
      kind: "FunnelsQuery",
      series: steps.map((s) => event(s)),
      dateRange: DATE(days),
      funnelsFilter: { funnelVizType: "steps" },
    },
  };
}

// ---- The three dashboards, each with its readable insights ----

const DASHBOARDS = [
  {
    name: "1 · Is anyone here? — Luxury Catalog",
    description:
      "The first question: are people showing up, how many, and where from. Visitors, sessions and traffic source.",
    insights: [
      {
        name: "Visitors per day",
        description: "Unique people per day. The headline 'is anyone visiting' number.",
        query: trends({ days: 30, series: [event("$pageview", "Visitors", "dau")] }),
      },
      {
        name: "Pageviews per day",
        description: "Total pages viewed per day — overall activity volume.",
        query: trends({ days: 30, series: [event("$pageview", "Pageviews", "total")] }),
      },
      {
        name: "Where visitors come from",
        description: "Visitors broken down by referring site — your traffic sources.",
        query: trends({
          days: 30,
          series: [event("$pageview", "Visitors", "dau")],
          breakdown: "entry_referrer",
          display: "ActionsBarValue",
        }),
      },
      {
        name: "Campaign source (utm_source)",
        description: "Visitors by tagged campaign source — measures any links you share.",
        query: trends({
          days: 30,
          series: [event("$pageview", "Visitors", "dau")],
          breakdown: "utm_source",
          display: "ActionsBarValue",
        }),
      },
      {
        name: "Top entry pages",
        description: "The pages people land on first — where attention starts.",
        query: trends({
          days: 30,
          series: [event("$pageview", "Visitors", "dau")],
          breakdown: "entry_pathname",
          display: "ActionsBarValue",
        }),
      },
    ],
  },
  {
    name: "2 · Are they exploring? — Luxury Catalog",
    description:
      "Discovery → depth. Do visitors search or filter, open a bag, and go deep (price history, authentication, value read)?",
    insights: [
      {
        name: "Discovery funnel: land → search/filter → open a bag",
        description: "Can people actually find a bag once they arrive?",
        query: funnel({
          steps: ["$pageview", "catalog_filtered", "variant_viewed"],
          days: 30,
        }),
      },
      {
        name: "Depth funnel: open a bag → read its value",
        description: "Of people who open a bag, how many reach the value module / price history.",
        query: funnel({
          steps: ["variant_viewed", "value_module_viewed", "price_history_viewed"],
          days: 30,
        }),
      },
      {
        name: "Depth actions (daily)",
        description: "Volume of the deep-engagement events that signal a real read of a bag.",
        query: trends({
          days: 30,
          series: [
            event("style_viewed", "Style viewed"),
            event("variant_viewed", "Bag viewed"),
            event("price_history_viewed", "Price history"),
            event("auth_section_engaged", "Authentication opened"),
            event("value_module_viewed", "Value read"),
          ],
        }),
      },
      {
        name: "Top brands viewed",
        description: "Bag views broken down by brand — where demand concentrates.",
        query: trends({
          days: 30,
          series: [event("variant_viewed", "Bag viewed")],
          breakdown: "brand",
          display: "ActionsBarValue",
        }),
      },
      {
        name: "Searches vs dead-end searches",
        description: "search_performed against search_not_found — the product-gap signal.",
        query: trends({
          days: 30,
          series: [
            event("search_performed", "Searches"),
            event("search_not_found", "No results (gap)"),
          ],
        }),
      },
    ],
  },
  {
    name: "3 · Doing what I want? — Luxury Catalog",
    description:
      "The intent journeys you're steering toward: value reads → outbound buy/sell clicks, the Style-read quiz, saves and newsletter sign-ups. The candidate monetization signals.",
    insights: [
      {
        name: "Intent funnel: open a bag → read value → click out to resale",
        description: "The core monetization journey — does a value read convert to an outbound click?",
        query: funnel({
          steps: ["variant_viewed", "value_module_viewed", "outbound_resale_clicked"],
          days: 30,
        }),
      },
      {
        name: "Style-read quiz funnel: start → finish → save a bag",
        description: "Your new taste journey — do people complete the quiz and act on the result?",
        query: funnel({
          steps: ["quiz_started", "quiz_completed", "item_saved"],
          days: 30,
        }),
      },
      {
        name: "Intent outcomes (monetization proxies)",
        description: "The candidate value actions side by side while the model is undecided.",
        query: trends({
          days: 30,
          series: [
            event("outbound_resale_clicked", "Outbound buy (affiliate proxy)"),
            event("outbound_consign_clicked", "Outbound sell (consign proxy)"),
            event("inquiry_submitted", "Inquiry (lead proxy)"),
            event("item_saved", "Saved"),
            event("newsletter_subscribed", "Newsletter"),
            event("monetization_interest", "Premium / fake-door interest"),
            event("authentication_interest", "Authentication interest"),
          ],
        }),
      },
      {
        name: "Saves & newsletter per week",
        description: "The two lightest commitment signals, weekly — early retention proxies.",
        query: trends({
          days: 60,
          interval: "week",
          series: [
            event("item_saved", "Saved a bag"),
            event("newsletter_subscribed", "Newsletter sign-up"),
          ],
        }),
      },
    ],
  },
];

// ---- Behavioral cohorts (best-effort; optional) ----

const behavioral = (key) => ({
  type: "behavioral",
  value: "performed_event",
  key,
  event_type: "events",
  time_value: 30,
  time_interval: "day",
  negation: false,
});

const COHORTS = [
  {
    name: "Authenticators",
    filters: {
      properties: {
        type: "OR",
        values: [behavioral("auth_section_engaged")],
      },
    },
  },
  {
    name: "Resellers / investors",
    filters: {
      properties: {
        type: "OR",
        values: [behavioral("price_history_viewed"), behavioral("outbound_resale_clicked")],
      },
    },
  },
  {
    name: "Taste-quiz finishers",
    filters: {
      properties: {
        type: "OR",
        values: [behavioral("quiz_completed")],
      },
    },
  },
];

// ---- Run ----

async function main() {
  console.log(`Setting up PostHog project ${PROJECT_ID} at ${HOST}\n`);

  const links = [];
  for (const board of DASHBOARDS) {
    const dashboard = await api("/dashboards/", {
      name: board.name,
      description: board.description,
    });
    console.log(`✓ Dashboard: ${dashboard.name} (id ${dashboard.id})`);
    for (const insight of board.insights) {
      try {
        const created = await api("/insights/", {
          name: insight.name,
          description: insight.description,
          query: insight.query,
          dashboards: [dashboard.id],
        });
        console.log(`    ✓ ${created.name}`);
      } catch (err) {
        console.warn(`    ✗ "${insight.name}" failed: ${err.message}`);
      }
    }
    links.push(`${HOST}/project/${PROJECT_ID}/dashboard/${dashboard.id}`);
  }

  for (const cohort of COHORTS) {
    try {
      const created = await api("/cohorts/", { ...cohort, is_static: false });
      console.log(`✓ Cohort: ${created.name}`);
    } catch (err) {
      console.warn(`✗ Cohort "${cohort.name}" failed (make it in the UI instead): ${err.message}`);
    }
  }

  console.log(`\nDone. Open your dashboards:\n${links.map((l) => "  " + l).join("\n")}`);
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
