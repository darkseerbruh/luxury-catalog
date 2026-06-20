/**
 * One-shot PostHog setup for the Luxury Catalog.
 *
 * Creates a "Core Flows" dashboard and pins the funnels, trend insights and
 * behavioral cohorts from the analytics plan, using the PostHog API. Safe to
 * re-run — it appends; delete duplicates in the UI if you run it twice.
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

const event = (name, label) => ({
  kind: "EventsNode",
  event: name,
  name: label ?? name,
  math: "total",
});

function trends({ series, days = 14, breakdown, display }) {
  return {
    kind: "InsightVizNode",
    source: {
      kind: "TrendsQuery",
      series,
      interval: "day",
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

// ---- The insights to create ----

const INSIGHTS = [
  {
    name: "Core journey funnel",
    description: "Land → view a bag → engage authentication → click out to resale.",
    query: funnel({
      steps: ["$pageview", "variant_viewed", "auth_section_engaged", "outbound_resale_clicked"],
      days: 14,
    }),
  },
  {
    name: "Discovery funnel",
    description: "Land → apply a filter → open a product. Can people find things?",
    query: funnel({
      steps: ["$pageview", "catalog_filtered", "variant_viewed"],
      days: 14,
    }),
  },
  {
    name: "Value events (daily)",
    description: "Volume of each Tier-1 value event over time.",
    query: trends({
      days: 14,
      series: [
        event("catalog_filtered"),
        event("variant_viewed"),
        event("auth_section_engaged"),
        event("price_history_viewed"),
        event("outbound_resale_clicked"),
        event("inquiry_submitted"),
      ],
    }),
  },
  {
    name: "Top brands viewed",
    description: "variant_viewed broken down by brand — what demand concentrates on.",
    query: trends({
      days: 30,
      series: [event("variant_viewed")],
      breakdown: "brand",
      display: "ActionsBarValue",
    }),
  },
  {
    name: "Intent outcomes (monetization proxies)",
    description: "Compare the candidate value actions side by side while the model is undecided.",
    query: trends({
      days: 30,
      series: [
        event("outbound_resale_clicked", "Outbound resale (affiliate proxy)"),
        event("inquiry_submitted", "Inquiry (lead proxy)"),
        event("item_saved", "Saved"),
        event("feedback_submitted", "Feedback"),
        event("monetization_interest", "Fake-door interest"),
      ],
    }),
  },
  {
    name: "Acquisition by referrer",
    description: "Pageviews broken down by entry referrer — where inbound traffic comes from.",
    query: trends({
      days: 30,
      series: [event("$pageview")],
      breakdown: "entry_referrer",
      display: "ActionsBarValue",
    }),
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
];

// ---- Run ----

async function main() {
  console.log(`Setting up PostHog project ${PROJECT_ID} at ${HOST}\n`);

  const dashboard = await api("/dashboards/", {
    name: "Core Flows — Luxury Catalog",
    description:
      "Auto-generated from the analytics plan: discovery & core-journey funnels, value-event trends, demand by brand, monetization proxies, and acquisition source.",
  });
  console.log(`✓ Dashboard created: ${dashboard.name} (id ${dashboard.id})`);

  for (const insight of INSIGHTS) {
    try {
      const created = await api("/insights/", {
        name: insight.name,
        description: insight.description,
        query: insight.query,
        dashboards: [dashboard.id],
      });
      console.log(`  ✓ Insight: ${created.name}`);
    } catch (err) {
      console.warn(`  ✗ Insight "${insight.name}" failed: ${err.message}`);
    }
  }

  for (const cohort of COHORTS) {
    try {
      const created = await api("/cohorts/", { ...cohort, is_static: false });
      console.log(`  ✓ Cohort: ${created.name}`);
    } catch (err) {
      console.warn(`  ✗ Cohort "${cohort.name}" failed (make it in the UI instead): ${err.message}`);
    }
  }

  console.log(
    `\nDone. Open your dashboard:\n  ${HOST}/project/${PROJECT_ID}/dashboard/${dashboard.id}`,
  );
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
