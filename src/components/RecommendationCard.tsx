"use client";

import Link from "next/link";
import { useState } from "react";
import type { Recommendation } from "@/lib/recommendations";
import { track, EVENTS } from "@/lib/analytics/events";
import { BagImage } from "./BagImage";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

/** A single "bag you might like" card with the deterministic "why" string. */
export function RecommendationCard({
  rec,
  source,
  imageUrl,
}: {
  rec: Recommendation;
  source: string;
  imageUrl?: string | null;
}) {
  const price = formatPrice(rec.retailPrice, rec.currency);
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="relative flex min-w-[200px] max-w-[220px] flex-shrink-0 flex-col sm:min-w-0">
      <Link
        href={`/bag/${rec.variantId}`}
        onClick={() => track(EVENTS.recommendationClicked, { variant_id: rec.variantId, source })}
        className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
      >
        <BagImage imageUrl={imageUrl} brand={rec.brandName} className="mb-3 aspect-square w-full rounded-xl" />
        <p className="text-sm uppercase tracking-wide text-muted">{rec.brandName}</p>
        <p className="mt-1 line-clamp-2 break-words font-serif text-lg text-foreground">{rec.styleName}</p>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{rec.label}</p>
        {price && <p className="mt-2 text-sm text-gold">From {price}</p>}
      </Link>

      {rec.why && (
        <div className="mt-1.5 px-1">
          <button
            onClick={() => setShowWhy((v) => !v)}
            className="text-xs text-muted/70 underline-offset-2 transition-colors hover:text-muted hover:underline"
            aria-expanded={showWhy}
          >
            Why am I seeing this?
          </button>
          {showWhy && (
            <div className="mt-1.5 rounded-xl border border-border bg-surface/80 px-3 py-2.5 text-xs leading-relaxed text-muted">
              {rec.why}
              <Link
                href="/taste"
                className="mt-1.5 block text-gold hover:underline"
              >
                See your taste profile →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
