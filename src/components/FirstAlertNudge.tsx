"use client";

import { useEffect, useState, useTransition } from "react";
import { addToWatchlist } from "@/lib/collection-actions";

const SEEN_KEY = "lc:first-alert-nudge";

/**
 * Shown ONCE, ever: the first time someone saves a bag, a quiet toast offers a
 * price-drop alert so they learn the feature exists, then never nags again. Fired
 * by a window event from QuickSaveHeart; gated by a localStorage flag. Mounted
 * once globally (layout). The alert is the existing percent-below-median rule.
 */
export function FirstAlertNudge() {
  const [variantId, setVariantId] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    function onFirstSave(e: Event) {
      try {
        if (localStorage.getItem(SEEN_KEY)) return;
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // localStorage blocked: just don't show it rather than risk repeating.
        return;
      }
      const id = (e as CustomEvent<{ variantId: number }>).detail?.variantId;
      if (typeof id === "number") setVariantId(id);
    }
    window.addEventListener("lc:first-save", onFirstSave);
    return () => window.removeEventListener("lc:first-save", onFirstSave);
  }, []);

  if (variantId == null) return null;

  function turnOn() {
    start(async () => {
      if (variantId != null) await addToWatchlist(variantId);
      setDone(true);
      setTimeout(() => setVariantId(null), 1800);
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-lg">
        {done ? (
          <p className="text-foreground">Alerts on. We&rsquo;ll tell you when it dips.</p>
        ) : (
          <>
            <p className="flex-1 text-muted">
              <span className="text-foreground">Saved.</span> Want a price alert too? We&rsquo;ll tell you when it
              dips below the typical resale price.
            </p>
            <button
              type="button"
              onClick={turnOn}
              disabled={pending}
              className="shrink-0 rounded-full bg-gold px-4 py-1.5 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-50"
            >
              Turn on alerts
            </button>
            <button
              type="button"
              onClick={() => setVariantId(null)}
              className="shrink-0 text-muted/80 hover:text-foreground"
              aria-label="Dismiss"
            >
              Not now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
