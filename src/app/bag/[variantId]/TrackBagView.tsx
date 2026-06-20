"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Fires the variant_viewed (and, when present, price_history_viewed) value
 * events on mount. Kept as a tiny client island so the bag page itself stays a
 * Server Component.
 */
export default function TrackBagView({
  variantId,
  brand,
  brandTier,
  style,
  silhouette,
  hasPriceHistory,
}: {
  variantId: number;
  brand: string;
  brandTier: "thrift" | "mid" | "ultra-luxury" | null;
  style: string;
  silhouette: string | null;
  hasPriceHistory: boolean;
}) {
  useEffect(() => {
    track(EVENTS.variantViewed, {
      variant_id: variantId,
      brand,
      brand_tier: brandTier ?? undefined,
      style,
      silhouette: silhouette ?? undefined,
    });
    if (hasPriceHistory) {
      track(EVENTS.priceHistoryViewed, { variant_id: variantId, brand, style });
    }
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
