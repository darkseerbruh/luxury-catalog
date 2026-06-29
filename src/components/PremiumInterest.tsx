"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Fake-door for the M9 "premium tools" stream (deeper alerts + advanced filters,
 * weighed at ~$40/yr per docs/monetization-moments-audit.md). It captures a
 * willingness-to-pay signal (monetization_interest) before any of it is built, so
 * the decision to build is made on real demand, not a guess. Nothing is charged
 * and nothing is promised — the price is shown as an exploratory figure so the
 * click also tests price sensitivity.
 */
export default function PremiumInterest({
  surface,
  feature = "premium_tools",
  priceYear = 40,
}: {
  surface: string;
  feature?: string;
  priceYear?: number;
}) {
  const [done, setDone] = useState(false);

  function raiseHand() {
    track(EVENTS.monetizationInterest, {
      surface,
      feature,
      price_year: priceYear,
    });
    setDone(true);
  }

  return (
    <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
      {done ? (
        <div>
          <p className="font-serif text-lg text-foreground">Noted, thank you.</p>
          <p className="mt-1 text-sm text-muted">
            That is the signal we build from. Nothing to pay, nothing live yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-lg text-foreground">A sharper set of tools</p>
            <p className="mt-1 max-w-prose text-sm text-muted">
              Deeper price alerts, advanced filters, and collection tools, as a small
              yearly plan we are weighing at around ${priceYear}. Would you use it?
            </p>
          </div>
          <button
            type="button"
            onClick={raiseHand}
            className="shrink-0 self-start rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft sm:self-auto"
          >
            I&rsquo;d use this
          </button>
        </div>
      )}
    </section>
  );
}
