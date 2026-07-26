"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics/events";
import { readState, recordView, writeState } from "@/lib/signup-prompt";

/**
 * Fires the variant_viewed (and, when present, price_history_viewed) value
 * events on mount. Kept as a tiny client island so the bag page itself stays a
 * Server Component.
 *
 * Also ticks the device-local distinct-bag counter that decides when to offer a
 * signed-out reader an account (see `@/lib/signup-prompt`). It lives here
 * because this is already the one place that knows a bag page was actually
 * read, and keeping it client-side means the server output stays identical for
 * crawlers.
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
  brandTier: string | null;
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
    // Tick the distinct-bag counter, then let SignupPrompt decide whether this
    // view crossed a threshold. Repeat views of the same bag don't count.
    const before = readState();
    const after = recordView(before, variantId);
    if (after !== before) {
      writeState(after);
      window.dispatchEvent(new CustomEvent("lc:bag-viewed"));
    }
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
