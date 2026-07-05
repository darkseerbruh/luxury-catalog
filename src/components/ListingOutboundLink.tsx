"use client";

import { track, EVENTS } from "@/lib/analytics/events";

/**
 * A tracked outbound link to a live listing. The "For sale right now" rail is
 * the highest-intent hand-off on the site and its clicks were invisible
 * (plain <a> in a server component fired nothing) — this fires
 * outbound_resale_clicked with the listing context wherever it's used
 * (bag-page listings, the compare table's live row).
 */
export function ListingOutboundLink({
  href,
  variantId,
  platform,
  price,
  dealBand,
  source,
  className = "",
  children,
}: {
  href: string;
  variantId: number;
  platform: string | null;
  price?: number | null;
  dealBand?: string | null;
  /** Where the click happened, e.g. "listings" | "compare". */
  source: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={className}
      onClick={() =>
        track(EVENTS.outboundResaleClicked, {
          variant_id: variantId,
          platform: platform ?? undefined,
          price: price ?? undefined,
          deal_band: dealBand ?? undefined,
          source,
        })
      }
    >
      {children}
    </a>
  );
}
