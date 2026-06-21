"use client";

import Link from "next/link";
import type { Recommendation } from "@/lib/recommendations";
import { track, EVENTS } from "@/lib/analytics/events";

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

/** A single "bag you might like" card with the deterministic "why" string. */
export function RecommendationCard({
  rec,
  source,
}: {
  rec: Recommendation;
  source: string;
}) {
  const price = formatPrice(rec.retailPrice, rec.currency);
  return (
    <Link
      href={`/bag/${rec.variantId}`}
      onClick={() => track(EVENTS.recommendationClicked, { variant_id: rec.variantId, source })}
      className="flex min-w-[200px] flex-shrink-0 flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold sm:min-w-0"
    >
      <p className="text-sm uppercase tracking-wide text-muted">{rec.brandName}</p>
      <p className="mt-1 font-serif text-lg text-foreground">{rec.styleName}</p>
      <p className="mt-1 text-sm text-muted">{rec.label}</p>
      {price && <p className="mt-2 text-sm text-gold">From {price}</p>}
      {rec.why && <p className="mt-3 text-xs leading-relaxed text-muted">{rec.why}</p>}
    </Link>
  );
}
