"use client";

/**
 * Minimal, non-blocking consent notice for the Tier-2 (enhanced) analytics layer
 * — session replay, surveys and cross-session identity. The cookieless baseline
 * runs regardless, so declining costs the visitor nothing in core analytics and
 * there is no full-screen interstitial.
 */
import { useState, useSyncExternalStore } from "react";

import { isAnalyticsEnabled } from "@/lib/analytics/config";
import {
  denyEnhancedConsent,
  getConsentDecision,
  grantEnhancedConsent,
} from "@/lib/analytics/posthog";

const noopSubscribe = () => () => {};

export function ConsentNotice() {
  // Render nothing during SSR/hydration, then flip to true on the client. This
  // avoids both a hydration mismatch and reading localStorage on the server.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);

  if (!mounted || dismissed || !isAnalyticsEnabled) return null;
  if (getConsentDecision() !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Optional analytics consent"
      className="fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border border-black/10 bg-white/95 p-4 text-sm shadow-lg backdrop-blur dark:border-white/15 dark:bg-neutral-900/95"
    >
      <p className="text-neutral-700 dark:text-neutral-200">
        We measure anonymous, cookieless usage by default. May we also enable
        session replay and short surveys to improve the catalog?
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            grantEnhancedConsent();
            setDismissed(true);
          }}
          className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => {
            denyEnhancedConsent();
            setDismissed(true);
          }}
          className="rounded-md px-3 py-1.5 font-medium text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
