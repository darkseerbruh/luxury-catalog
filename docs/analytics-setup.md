# Analytics setup

This app ships instrumented with PostHog in a **cookieless-first** model. The core
measurement (pageviews, autocapture, funnels, traffic/attribution, value events)
runs for every visitor with no consent banner; session replay, surveys and
cross-session identity are an optional Tier-2 layer the visitor opts into.

See `/.claude/plans/create-a-plan-for-sunny-candle.md` (or the approved plan) for
the full strategy.

## 1. One-time PostHog configuration

1. Create a free PostHog project (US cloud by default).
2. **Project settings → Web analytics → enable "Cookieless server hash mode".**
   This is what lets the cookieless baseline identify visitors via a
   server-side hash with nothing stored on the device.
3. Copy the **Project API Key** into `NEXT_PUBLIC_POSTHOG_KEY` (see `.env.example`).

If you are on EU cloud, update the hosts in `next.config.ts` (`eu-assets.i` /
`eu.i`) and set `NEXT_PUBLIC_POSTHOG_UI_HOST=https://eu.posthog.com`.

## 2. How it fits together

| File | Role |
| --- | --- |
| `src/lib/analytics/config.ts` | Env + constants |
| `src/lib/analytics/posthog.ts` | Browser init (cookieless) + consent upgrade |
| `src/instrumentation-client.ts` | Initializes analytics before hydration |
| `src/app/providers.tsx` | React provider + manual pageview capture |
| `src/components/ConsentNotice.tsx` | Non-blocking Tier-2 opt-in |
| `src/lib/analytics/events.ts` | `track()` + the Tier-1 event taxonomy |
| `src/lib/analytics/server.ts` | Server-side capture for Route Handlers |
| `next.config.ts` | `/ingest` reverse proxy |

## 3. Instrumenting new UI (as you build it)

Autocapture records clicks/inputs automatically — you only add code for events
that carry business meaning. From any client component:

```tsx
import { track, EVENTS } from "@/lib/analytics/events";

track(EVENTS.variantViewed, {
  brand: "Hermès",
  brand_tier: "ultra-luxury",
  style: "Birkin",
  confidence_level: "verified",
});
```

From a Route Handler, emit the same event server-side next to the Supabase write:

```ts
import { captureServer } from "@/lib/analytics/server";

await captureServer({
  distinctId: userId,
  event: EVENTS.searchNotFound, // "search_not_found"
  properties: { search_query: q, result_count: 0 },
});
```

Keep the taxonomy in `events.ts` small. When autocapture shows a recurring,
meaningful interaction, promote it to a named event there.

## 4. Weekly digest

`scripts/analytics-digest.ts` builds a written report from PostHog + Supabase via
Claude. Run it locally with `npm run analytics:digest`, or let
`.github/workflows/analytics-digest.yml` run it weekly. Configure these repo
secrets: `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `ANTHROPIC_API_KEY`,
and optionally `POSTHOG_HOST`, `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`.
