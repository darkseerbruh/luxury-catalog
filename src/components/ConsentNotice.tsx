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
      className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border border-border bg-surface/95 p-4 text-sm shadow-lg backdrop-blur"
    >
      <p className="text-muted">
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
          className="rounded-full bg-gold px-4 py-1.5 font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => {
            denyEnhancedConsent();
            setDismissed(true);
          }}
          className="rounded-full px-4 py-1.5 font-medium text-muted transition-colors hover:text-foreground"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
