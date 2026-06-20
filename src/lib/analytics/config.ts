/**
 * Central analytics configuration.
 *
 * The catalog runs a cookieless-first measurement model:
 *  - Tier 1 (baseline): every visitor, no consent banner, nothing written to the
 *    device. Requires "Cookieless server hash mode" enabled in PostHog project
 *    settings (Project settings -> Web analytics).
 *  - Tier 2 (enhanced): session replay, surveys and cross-session identity, only
 *    after the visitor opts in via the consent notice.
 *
 * Public (NEXT_PUBLIC_*) values are safe to expose to the browser. The personal
 * API key and Supabase service role key are server-only and never imported here.
 */

/** PostHog project "Project API Key" (public, write-only ingestion key). */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

/**
 * Path requests are sent to in the browser. We proxy through our own origin
 * (see `rewrites` in next.config.ts) so events are not blocked by ad blockers
 * and so no third-party host appears in the network tab.
 */
export const POSTHOG_INGEST_PATH = "/ingest";

/** Host the PostHog toolbar/links should point at (US cloud by default). */
export const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com";

/** True when an ingestion key is configured. Lets the app no-op safely pre-setup. */
export const isAnalyticsEnabled = POSTHOG_KEY.length > 0;

/** localStorage key recording the visitor's Tier-2 (enhanced) consent decision. */
export const CONSENT_STORAGE_KEY = "lc_enhanced_consent";

export type ConsentDecision = "granted" | "denied";
