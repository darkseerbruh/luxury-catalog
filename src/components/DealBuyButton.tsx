"use client";

import { affiliateListingUrl } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * The "View on <platform>" button in the Priced-well-today rail. Opens the recorded
 * listing (affiliate-attributed when codes are configured — purely additive) and fires
 * outbound_resale_clicked, the affiliate-revenue proxy. Client component so the click
 * lands; renders nothing if we never recorded a source URL (no dead button).
 */

/** Tidy a recorded platform string into display copy that names the destination. */
function platformLabel(platform: string | null): string {
  if (!platform) return "View listing";
  const key = platform.toLowerCase().replace(/[^a-z]/g, "");
  if (key.includes("ebay")) return "View on eBay";
  if (key.includes("fashionphile")) return "View on Fashionphile";
  if (key.includes("therealreal") || key.includes("realreal")) return "View on The RealReal";
  if (key.includes("vestiaire")) return "View on Vestiaire";
  if (key.includes("poshmark")) return "View on Poshmark";
  return `View on ${platform}`;
}

export function DealBuyButton({
  variantId,
  brand,
  style,
  platform,
  url,
}: {
  variantId: number;
  brand: string;
  style: string;
  platform: string | null;
  url: string | null;
}) {
  if (!url) return null;
  const href = affiliateListingUrl(url, platform);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      onClick={() =>
        track(EVENTS.outboundResaleClicked, { variant_id: variantId, platform, brand, style })
      }
      className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg border border-gold/40 px-3 py-2 text-sm text-gold-soft transition-colors hover:border-gold hover:bg-gold/5"
    >
      {platformLabel(platform)}
      <span aria-hidden>↗</span>
    </a>
  );
}
