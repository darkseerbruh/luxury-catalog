"use client";

import { buildResaleLinks } from "@/lib/affiliate";
import { PLATFORMS } from "@/lib/platforms";
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
      <p className="mb-1 text-sm text-muted">
        Pre-filled searches on the major resale platforms. Listings and prices
        are set by each reseller.
      </p>
      <p className="mb-4 text-xs text-muted/70">
        Affiliate links — we may earn a commission if you buy, at no extra cost to you.{" "}
        <a href="/disclosure" className="underline hover:text-foreground">Learn more</a>.
      </p>
      <div className="flex flex-col gap-3">
        {links.map((l) => {
          const p = PLATFORMS[l.key];
          return (
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
              className="group rounded-xl border border-border px-5 py-3 transition-colors hover:border-gold"
            >
              <span className="flex items-center justify-between text-sm text-foreground group-hover:text-gold">
                Search on {l.name}
                <span aria-hidden>→</span>
              </span>
              {p && (
                <span className="mt-1 block text-xs text-muted/80">
                  {p.authenticates === "all"
                    ? "✓ Authenticates every item"
                    : p.authenticates === "auction-house"
                    ? "✓ Specialist-vetted"
                    : p.authenticates === "optional"
                    ? "Authentication available"
                    : "Authenticity Guarantee on eligible items"}{" "}
                  · {p.returns}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
