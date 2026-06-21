"use client";

import { buildResaleLinks } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * "Where to buy" resale links. Client component so outbound clicks fire the
 * outbound_resale_clicked event (the affiliate-revenue proxy).
 */
export default function WhereToBuy({
  variantId,
  brand,
  style,
}: {
  variantId: number;
  brand: string;
  style: string;
}) {
  const links = buildResaleLinks(brand, style);
  if (links.length === 0) return null;

  return (
    <section id="where-to-buy" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="mb-2 font-serif text-xl text-foreground">Where to buy</h2>
      <p className="mb-4 text-sm text-muted">
        Pre-filled searches on the major resale platforms. Listings and prices
        are set by each reseller.
      </p>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            onClick={() =>
              track(EVENTS.outboundResaleClicked, {
                variant_id: variantId,
                platform: l.key,
                brand,
                style,
              })
            }
            className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            Search on {l.name} →
          </a>
        ))}
      </div>
    </section>
  );
}
