/**
 * Browser-side PostHog setup and consent management.
 *
 * The posthog-js SDK is ~200KB, so it is NOT in the initial bundle: it is
 * dynamically imported and initialized at idle (or on the first tracked event,
 * whichever comes first) so it never blocks first paint or interactivity. Calls
 * made before the SDK finishes loading are buffered and flushed on load, so no
 * deliberate event is dropped — they are only delayed by the idle load.
 *
 * Trade-off: autocapture and pageleave only begin once the SDK is live (a beat
 * after load), so a visitor who bounces in the first moment may not be recorded.
 * Everything here is browser-only and guards against being called during SSR.
 */
import type { PostHog } from "posthog-js";

import {
  CONSENT_STORAGE_KEY,
  POSTHOG_INGEST_PATH,
  POSTHOG_KEY,
  POSTHOG_UI_HOST,
  isAnalyticsEnabled,
  type ConsentDecision,
} from "./config";

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

/** Calls made before the SDK loads; flushed in order once it is live. */
const queue: Array<(ph: PostHog) => void> = [];

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
function registerSessionAttribution(ph: PostHog): void {
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

  ph.register({
    ...utm,
    entry_referrer: document.referrer || "$direct",
    entry_pathname: window.location.pathname,
  });
}

/** Upgrade an already-initialized client to the Tier-2 (consented) layer. */
function enableEnhancedLayer(ph: PostHog): void {
  // Persist identity across sessions and unlock replay. Surveys run by default
  // once recording/persistence is active.
  ph.set_config({ persistence: "localStorage+cookie" });
  ph.startSessionRecording();
}

/** Dynamically import + initialize posthog-js (cookieless baseline). Once. */
function loadAndInit(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  if (loading) return loading;

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
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
          registerSessionAttribution(posthog);
          if (getConsentDecision() === "granted") enableEnhancedLayer(posthog);
        },
      });
      client = posthog;
      // Flush anything captured before the SDK was ready, in order.
      for (const fn of queue.splice(0)) {
        try {
          fn(posthog);
        } catch {
          /* one bad event never blocks the rest */
        }
      }
      return posthog;
    })
    .catch(() => null);

  return loading;
}

/** Run `fn` against the live client, or queue it and kick off the load. */
function withClient(fn: (ph: PostHog) => void): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return;
  if (client) {
    try {
      fn(client);
    } catch {
      /* swallow — analytics must never break the app */
    }
    return;
  }
  queue.push(fn);
  void loadAndInit();
}

/**
 * Schedule the SDK load for idle so it stays out of the critical path. Safe to
 * call more than once; only the first load has an effect.
 */
export function initAnalytics(): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled) return;
  const start = () => void loadAndInit();
  const w = window as typeof window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(start, { timeout: 2000 });
  } else {
    setTimeout(start, 1200);
  }
}

/** Capture an event (buffered until the SDK loads). */
export function capture(event: string, properties?: Record<string, unknown>): void {
  withClient((ph) => ph.capture(event, properties));
}

/** Capture a manual $pageview for the given URL. */
export function capturePageview(url: string): void {
  withClient((ph) => ph.capture("$pageview", { $current_url: url }));
}

/** Associate the current visitor with a known user id. */
export function identify(distinctId: string, properties?: Record<string, unknown>): void {
  withClient((ph) => ph.identify(distinctId, properties));
}

/** Clear identity on sign-out. */
export function reset(): void {
  withClient((ph) => ph.reset());
}

/** Record opt-in and turn on the enhanced (Tier-2) layer immediately. */
export function grantEnhancedConsent(): void {
  persistConsentDecision("granted");
  // If already live, upgrade now; otherwise the `loaded` callback reads the
  // persisted decision and upgrades on load.
  if (client) enableEnhancedLayer(client);
  else void loadAndInit();
}

/** Record opt-out. The cookieless baseline keeps working unchanged. */
export function denyEnhancedConsent(): void {
  persistConsentDecision("denied");
}
