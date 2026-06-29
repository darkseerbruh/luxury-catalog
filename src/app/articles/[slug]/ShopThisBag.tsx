"use client";

import { useState } from "react";

/**
 * The visible "money moment" for an article: a data-led shop card for the article's
 * topic bag. Two modes:
 *   - "inline": an in-flow card placed right after the first data point in the body,
 *     so the reader meets it while the price is fresh in mind (not at the bottom).
 *   - "floating": a dismissible bar fixed to the bottom (full width on mobile, a tidy
 *     bottom-right card on desktop) so the path to buy/sell follows the reader without
 *     covering content at 375px.
 * Copy stays informational ("43 listed, from $130"), never "BUY NOW". All outbound
 * links are affiliate-attributed + rel="sponsored nofollow" (built server-side).
 */
type Offer = { price: number; currency: string; sizeLabel: string | null; platformLabel: string; href: string };
type Link = { key: string; name: string; url: string };

export interface ShopThisBagData {
  label: string;
  count: number;
  fromPrice: number;
  currency: string;
  asOf: string | null;
  offers: Offer[];
  sell: Link[]; // consignment / instant-offer (seller side leads on revenue)
  ebayUrl: string; // affiliate search fallback, always valid
}

const money = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

function asOfLabel(asOf: string | null): string | null {
  if (!asOf) return null;
  const d = new Date(asOf);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const PILL =
  "rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold";

export function ShopThisBag({ data, variant }: { data: ShopThisBagData; variant: "inline" | "floating" }) {
  const [dismissed, setDismissed] = useState(false);
  if (variant === "floating" && dismissed) return null;
  const { label, count, fromPrice, currency, asOf, offers, sell, ebayUrl } = data;
  const when = asOfLabel(asOf);
  const summary = count > 0 ? `${count} listed${fromPrice > 0 ? `, from ${money(fromPrice, currency)}` : ""}` : null;

  if (variant === "inline") {
    return (
      <aside className="my-6 rounded-2xl border border-gold/30 bg-gold/[0.03] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-base text-foreground">Shop the {label}</h3>
          {summary && (
            <span className="text-xs text-muted">
              {summary}
              {when ? ` · as of ${when}` : ""}
            </span>
          )}
        </div>
        {offers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {offers.map((o, i) => (
              <a key={i} href={o.href} target="_blank" rel="sponsored nofollow noopener" className={PILL}>
                {money(o.price, o.currency)}
                <span className="text-muted/70">
                  {" "}
                  · {o.platformLabel}
                  {o.sizeLabel ? ` · ${o.sizeLabel}` : ""}
                </span>
              </a>
            ))}
            <a href={ebayUrl} target="_blank" rel="sponsored nofollow noopener" className={PILL}>
              more on eBay
            </a>
          </div>
        )}
        {sell.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Selling yours?{" "}
            {sell.slice(0, 3).map((l, i) => (
              <span key={l.key}>
                {i > 0 ? " · " : ""}
                <a href={l.url} target="_blank" rel="sponsored nofollow noopener" className="text-foreground underline hover:text-gold">
                  {l.name}
                </a>
              </span>
            ))}
          </p>
        )}
        <p className="mt-2 text-[10px] text-muted/60">Affiliate links. We may earn a commission. Prices are from our listing data, an estimate of the market.</p>
      </aside>
    );
  }

  // floating
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm">
      <div className="m-3 rounded-2xl border border-gold/30 bg-surface/95 p-4 shadow-lg backdrop-blur sm:m-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-sm text-foreground">Shop the {label}</p>
            {summary && <p className="mt-0.5 text-xs text-muted">{summary}{when ? ` · as of ${when}` : ""}</p>}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 rounded-full px-2 text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <a
            href={offers[0]?.href ?? ebayUrl}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="flex-1 rounded-full bg-gold px-4 py-2 text-center text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Shop now
          </a>
          {sell[0] && (
            <a
              href={sell[0].url}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="rounded-full border border-border px-4 py-2 text-center text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Sell yours
            </a>
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted/60">Affiliate links. We may earn a commission.</p>
      </div>
    </div>
  );
}
