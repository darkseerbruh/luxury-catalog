"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * "Deal alerts Pro" fake-door for the M9 premium-tools stream (deeper alerts +
 * saved searches, weighed at ~$40/yr per docs/monetization-moments-audit.md).
 *
 * Follows the owner's locked fake-door pattern: keep the entry point, frame it
 * as "Coming soon", capture demand, flip to the real flow later. v1 is
 * EVENT-ONLY — every click fires `monetization_interest` with a `source`
 * property, so PostHog IS the interest list (no DB writes, no migration).
 * Nothing is charged, no price is shown, and the done-state promises nothing
 * we can't deliver to a logged-out visitor.
 *
 * Two variants:
 *  - "card"   — the full door (watchlist / alerts surfaces).
 *  - "inline" — a quiet one-line mention (near the price-alert bell flow).
 */
export default function PremiumInterest({
  source,
  feature = "deal_alerts_pro",
  variant = "card",
}: {
  source: string;
  feature?: string;
  variant?: "card" | "inline";
}) {
  const [done, setDone] = useState(false);

  function raiseHand() {
    track(EVENTS.monetizationInterest, { source, feature });
    setDone(true);
  }

  if (variant === "inline") {
    return (
      <p className="text-sm text-muted">
        {done ? (
          <>Noted. You&rsquo;ll see it here first when it opens.</>
        ) : (
          <>
            Deal alerts Pro is coming: Alerts across every colorway you&rsquo;d take, plus
            saved searches.{" "}
            <button type="button" onClick={raiseHand} className="text-gold hover:underline">
              Want first access?
            </button>
          </>
        )}
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
      {done ? (
        <div>
          <p className="font-serif text-lg text-foreground">Noted, thank you.</p>
          <p className="mt-1 text-sm text-muted">
            That is the signal we build from. Nothing to pay, nothing live yet. You&rsquo;ll
            see it here first when it opens.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-serif text-lg text-foreground">Deal alerts Pro</p>
              <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs uppercase tracking-wide text-gold/90">
                Coming soon
              </span>
            </div>
            <p className="mt-1 max-w-prose text-sm text-muted">
              One watchlist, sharper hunting: Alerts across every colorway you&rsquo;d take,
              plus saved searches that watch the market for you.
            </p>
          </div>
          <button
            type="button"
            onClick={raiseHand}
            className="shrink-0 self-start rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft sm:self-auto"
          >
            Notify me
          </button>
        </div>
      )}
    </section>
  );
}
