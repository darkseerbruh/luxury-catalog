"use client";

import { buildConsignmentLinks } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * "Where to sell" fork — the consignor-referral revenue stream (highest upside).
 * Mirrors WhereToBuy, but frames the decision as buyout (sell fast for cash) vs.
 * consignment (list for more, paid on sale). Client component so outbound clicks
 * fire the outbound_consign_clicked event.
 */
export default function WhereToSell({
  variantId,
  brand,
  style,
}: {
  variantId: number;
  brand: string;
  style: string;
}) {
  const links = buildConsignmentLinks(brand, style);
  if (links.length === 0) return null;

  const buyout = links.filter((l) => l.mode === "buyout");
  const consign = links.filter((l) => l.mode === "consign");

  function linkButton(l: (typeof links)[number]) {
    return (
      <a
        key={l.key}
        href={l.url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={() =>
          track(EVENTS.outboundConsignClicked, {
            variant_id: variantId,
            platform: l.key,
            mode: l.mode,
            brand,
            style,
          })
        }
        className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
      >
        {l.mode === "buyout" ? `Get a quote on ${l.name}` : `Consign with ${l.name}`} →
      </a>
    );
  }

  return (
    <section id="where-to-sell" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="mb-2 font-serif text-xl text-foreground">Where to sell</h2>
      <p className="mb-5 text-sm text-muted">
        Two ways to part with a bag:{" "}
        <span className="text-foreground">sell fast for cash</span> (a buyout
        quote, paid up front) or{" "}
        <span className="text-foreground">consign for more</span> (listed by the
        platform, paid when it sells, minus a commission). Quotes, splits, and
        payouts are set by each platform.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {buyout.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold">
            <p className="font-serif text-lg text-foreground">Sell fast for cash</p>
            <p className="mt-1 text-sm text-muted">
              Instant buyout quote — less than top dollar, but paid right away.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">{buyout.map(linkButton)}</div>
          </div>
        )}
        {consign.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold">
            <p className="font-serif text-lg text-foreground">Consign for more</p>
            <p className="mt-1 text-sm text-muted">
              Listed for you and paid on sale, after the platform&rsquo;s
              commission — usually nets more than a buyout.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">{consign.map(linkButton)}</div>
          </div>
        )}
      </div>
    </section>
  );
}
