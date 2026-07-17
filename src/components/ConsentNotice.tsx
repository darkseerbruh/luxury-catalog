"use client";

/**
 * Minimal, non-blocking analytics consent notice. "Decline" is a genuine
 * opt-out of ALL analytics (baseline included), and a Global Privacy Control
 * (GPC) signal auto-declines with no notice shown. Until a visitor decides, only
 * a cookieless, memory-only baseline runs (legitimate interest); nothing is
 * written to the device and no cross-session identity is built.
 */
import { useState, useSyncExternalStore } from "react";

import { isAnalyticsEnabled } from "@/lib/analytics/config";
import {
  denyEnhancedConsent,
  getEffectiveConsent,
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
  // Decided already, or the browser is sending a GPC opt-out: no notice.
  if (getEffectiveConsent() !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Optional analytics consent"
      className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border border-border bg-surface/95 p-4 text-sm shadow-lg backdrop-blur"
    >
      <p className="text-muted">
        We use privacy-first, cookieless analytics to make the catalog better.
        Allow it, plus optional session replay and short surveys? You can decline
        and we will turn analytics off for you.
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
