"use client";

import Link from "next/link";
import { buildConsignmentLinks } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * "Where to sell" fork for the bag page. Leads into the sourced /where-to-sell
 * estimator pre-loaded with THIS bag (what you'd net at each of the venues, from
 * their real published fees), then the outbound buyout-vs-consignment links. Those
 * links earn nothing today (no sell-side affiliate program exists); they are kept as
 * honest utility, and the plumbing is dormant per affiliate.ts. Client component so
 * outbound clicks still fire the outbound_consign_clicked event (engagement signal).
 */
export default function WhereToSell({
  variantId,
  styleId,
  brand,
  style,
}: {
  variantId: number;
  styleId: number;
  brand: string;
  style: string;
}) {
  const links = buildConsignmentLinks(brand, style);
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
        {l.mode === "buyout" ? `Get a quote on ${l.name}` : `Consign with ${l.name}`} &rarr;
      </a>
    );
  }

  return (
    <section id="where-to-sell" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="mb-2 font-serif text-xl text-foreground">Where to sell</h2>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Selling is a trade: top dollar takes patience, fast cash costs you margin, keeping it
        all costs you the safety net.
      </p>

      {/* Lead: the sourced estimator, pre-loaded with this bag. */}
      <Link
        href={`/where-to-sell?bag=${styleId}`}
        className="group flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-surface p-4 transition-colors hover:border-gold"
      >
        <span>
          <span className="block text-sm font-medium text-foreground">
            See what you&apos;d keep at each venue
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            The {brand} {style}{" "}run through every venue&apos;s real published fees, ranked by
            what lands in your pocket.
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-gold-soft transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </Link>

      {links.length > 0 && (
        <>
          <p className="mb-4 mt-6 text-xs uppercase tracking-wide text-muted/80">Or start a sale now</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {buyout.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold">
                <p className="font-serif text-lg text-foreground">Sell fast for cash</p>
                <p className="mt-1 text-sm text-muted">
                  An instant buyout quote. Less than top dollar, but paid on receipt.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">{buyout.map(linkButton)}</div>
              </div>
            )}
            {consign.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold">
                <p className="font-serif text-lg text-foreground">Consign for more</p>
                <p className="mt-1 text-sm text-muted">
                  Listed for you and paid when it sells, after commission. Usually nets more
                  than a buyout.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">{consign.map(linkButton)}</div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
