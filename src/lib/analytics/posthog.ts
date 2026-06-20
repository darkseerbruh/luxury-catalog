/**
 * Browser-side PostHog setup and consent management.
 *
 * Initialization runs from `src/instrumentation-client.ts` (before hydration) so
 * the SDK is ready as early as possible. Everything here is browser-only and
 * guards against being called during SSR.
 */
import posthog, { type PostHog } from "posthog-js";

import {
  CONSENT_STORAGE_KEY,
  POSTHOG_INGEST_PATH,
  POSTHOG_KEY,
  POSTHOG_UI_HOST,
  isAnalyticsEnabled,
  type ConsentDecision,
} from "./config";

let initialized = false;

/** Read the stored Tier-2 consent decision, if any. */
export function getConsentDecision(): ConsentDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function persistConsentDecision(decision: ConsentDecision): void {
  try {
    // The consent decision itself is functional/strictly-necessary storage.
    window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    /* storage unavailable (private mode) — fall back to per-session memory */
  }
}

/**
 * Capture campaign + referrer context once per session as super-properties so
 * every event in the visit is attributed to its acquisition source. This is
 * cookieless: the values come from the URL/referrer, not device storage.
 */
function registerSessionAttribution(client: PostHog): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }

  client.register({
    ...utm,
    entry_referrer: document.referrer || "$direct",
    entry_pathname: window.location.pathname,
  });
}

/** Upgrade an already-initialized client to the Tier-2 (consented) layer. */
function enableEnhancedLayer(client: PostHog): void {
  // Persist identity across sessions and unlock replay. Surveys run by default
  // once recording/persistence is active.
  client.set_config({ persistence: "localStorage+cookie" });
  client.startSessionRecording();
}

/**
 * Initialize PostHog in the cookieless baseline configuration. Safe to call more
 * than once; only the first call has an effect.
 */
export function initAnalytics(): PostHog | null {
  if (typeof window === "undefined" || !isAnalyticsEnabled || initialized) {
    return isAnalyticsEnabled && initialized ? posthog : null;
  }
  initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_INGEST_PATH,
    ui_host: POSTHOG_UI_HOST,
    // Cookieless baseline: nothing is written to the device until consent.
    persistence: "memory",
    person_profiles: "identified_only",
    // We capture pageviews manually (App Router does not auto-fire on
    // client-side navigation). See PostHogPageView in providers.tsx.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    // Tier-2 features stay off until the visitor opts in.
    disable_session_recording: true,
    loaded: () => {
      // `posthog` is the same singleton, typed as the full PostHog class.
      registerSessionAttribution(posthog);
      if (getConsentDecision() === "granted") {
        enableEnhancedLayer(posthog);
      }
    },
  });

  return posthog;
}

/** Record opt-in and turn on the enhanced (Tier-2) layer immediately. */
export function grantEnhancedConsent(): void {
  persistConsentDecision("granted");
  if (isAnalyticsEnabled && initialized) {
    enableEnhancedLayer(posthog);
  }
}

/** Record opt-out. The cookieless baseline keeps working unchanged. */
export function denyEnhancedConsent(): void {
  persistConsentDecision("denied");
}

export { posthog };
