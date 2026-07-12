import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import {
  SELL_VENUES,
  SELL_CATEGORIES,
  CATEGORY_LABELS,
  TIER_LABELS,
  estimateNet,
  rankByNet,
  type SellVenueProfile,
  type EffortLevel,
} from "@/lib/where-to-sell";
import { getStyleResaleEstimate } from "@/lib/queries";
import { BagValuePicker } from "./BagValuePicker";
import { SITE_URL } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Where to sell your bag, and what you'll actually keep",
  description:
    "What each resale venue takes, how fast it pays, and how much of the work is yours. Enter your bag's value to see what you'd net at each. Sourced from each venue's own published policies.",
};

export const revalidate = 3600;

const EFFORT_SHORT: Record<EffortLevel, string> = {
  "white-glove": "They do it all",
  "you-ship-only": "You just ship it",
  "full-diy": "You do it all",
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** Parse the ?value= param into a sane sale price. Default 1,200; clamp to a real range. */
function parseValue(raw: string | undefined): number {
  const n = Number((raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 1200;
  return Math.min(Math.max(Math.round(n), 20), 200000);
}

function tierChip(v: SellVenueProfile) {
  const styles: Record<string, string> = {
    "hands-off": "border-emerald-600/40 text-emerald-700",
    "keep-more": "border-amber-500/40 text-amber-700",
    "keep-all": "border-rose-500/40 text-rose-600",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-wide ${styles[v.ourTake.tier]}`}
    >
      {TIER_LABELS[v.ourTake.tier]}
    </span>
  );
}

export default async function WhereToSellPage({
  searchParams,
}: {
  searchParams: Promise<{ value?: string; bag?: string }>;
}) {
  const { value, bag } = await searchParams;

  // A picked bag (styleId) resolves to a typical resale value server-side; a manual
  // value is the fallback. The bag lookup wins when it resolves.
  const bagId = Number(bag);
  const picked = Number.isFinite(bagId) && bagId > 0 ? await getStyleResaleEstimate(bagId) : null;
  const sale = picked ? picked.value : parseValue(value);
  const bagUnpriced = Boolean(bag) && !picked;
  const ranked = rankByNet(sale);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Where to sell a preloved bag",
    description:
      "Resale venues compared by what the seller keeps: commission, payout speed, and effort, from each venue's own published policies.",
    numberOfItems: SELL_VENUES.length,
    itemListElement: SELL_VENUES.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.label,
      url: `${SITE_URL}/where-to-sell/${v.slug}`,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <header className="mb-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">Where to sell</p>
        <h1 className="font-serif text-3xl text-foreground">
          Where to sell, and what you&apos;ll keep
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Selling is a trade, not a winner. Top dollar costs you patience, instant cash costs
          you margin, keeping it all costs you the safety net. Here&apos;s what each place takes,
          how fast it pays, and how much of the work is yours.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted/80">
          Every number below links to the venue&apos;s own published policy, with the date we
          checked it.
        </p>
      </header>

      {/* The signature move: what you'd actually net, on YOUR bag's value. */}
      <section className="mb-8 rounded-2xl border border-gold/30 bg-surface p-4 sm:p-5">
        <h2 className="font-serif text-xl text-foreground">What would you actually keep?</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Two ways to start: search your bag and we&apos;ll pull a typical resale value, or type a
          number if you already know it. Either one fills the fee math below.
        </p>

        {/* Path 1: search a bag, we resolve its value. */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted/80">Search your bag</p>
          <BagValuePicker />
        </div>

        {/* Path 2: type a value. */}
        <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="value" className="text-[11px] uppercase tracking-wide text-muted/80">
            Or enter a value
          </label>
          <div className="flex items-center rounded-lg border border-border bg-background px-2">
            <span className="text-sm text-muted">$</span>
            <input
              id="value"
              name="value"
              type="number"
              inputMode="numeric"
              min={20}
              max={200000}
              defaultValue={sale}
              className="w-28 bg-transparent px-1 py-2 text-sm text-foreground outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-gold bg-gold/10 px-3 py-2 text-sm text-foreground transition-colors hover:bg-gold/20"
          >
            See what you keep
          </button>
        </form>

        {picked && (
          <p className="mt-3 rounded-lg border border-gold/30 bg-background/50 px-3 py-2 text-xs leading-relaxed text-muted">
            Based on the <span className="text-foreground">{picked.label}</span>: a typical resale of{" "}
            <span className="text-foreground">{usd(picked.value)}</span>. Our estimate from{" "}
            {picked.n.toLocaleString("en-US")} recent{" "}
            {picked.n === 1 ? "sale or fixed-price listing" : "sales and fixed-price listings"},
            where the listing price is the sale price. Tweak the number above if yours differs by
            size or condition.
          </p>
        )}
        {bagUnpriced && (
          <p className="mt-3 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs leading-relaxed text-muted">
            We don&apos;t have enough price data on that bag yet to estimate a value. Enter a number
            above and the fee math still works.
          </p>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60 text-left text-xs text-muted">
                <th className="px-3 py-2.5 font-normal">Venue</th>
                <th className="px-3 py-2.5 font-normal">You keep on {usd(sale)}</th>
                <th className="px-3 py-2.5 font-normal">How fast</th>
                <th className="px-3 py-2.5 font-normal">Effort</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ venue, est }) => (
                <tr key={venue.slug} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3">
                    <Link
                      href={`/where-to-sell/${venue.slug}`}
                      className="font-medium text-foreground hover:text-gold-soft"
                    >
                      {venue.label}
                    </Link>
                    {venue.buyout?.available && (
                      <span className="ml-1.5 text-[10.5px] text-muted/70">or instant buyout</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {est.kind === "net" ? (
                      <span className="text-foreground">
                        {usd(est.net)}{" "}
                        <span className="text-[11px] text-muted">({est.keepPct}%)</span>
                      </span>
                    ) : (
                      <span className="text-muted">Instant quote</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {venue.payoutSpeed.instant ? (
                      <span aria-hidden className="text-emerald-600">
                        &#9889;{" "}
                      </span>
                    ) : null}
                    {venue.payoutSpeed.instant ? "Can be instant" : "After it sells"}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">{EFFORT_SHORT[venue.effort.level]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted/70">
          Our estimate off each venue&apos;s published rates, before shipping and any state tax.
          Consignment pays only once the bag sells. Facebook keeps you 100% on a local cash
          pickup, and gives you no protection in return. Tap a venue for the full math.
        </p>
      </section>

      {/* The payout matrix. */}
      <h2 className="mb-2 font-serif text-xl text-foreground">The whole picture</h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-3 py-2.5 font-normal">Venue</th>
              <th className="px-3 py-2.5 font-normal">What they take</th>
              <th className="px-3 py-2.5 font-normal">Payout speed</th>
              <th className="px-3 py-2.5 font-normal">Effort</th>
              <th className="px-3 py-2.5 font-normal">Who prices it</th>
            </tr>
          </thead>
          <tbody>
            {SELL_CATEGORIES.map((cat) => (
              <Fragment key={cat}>
                <tr className="border-b border-border bg-surface/50">
                  <td colSpan={5} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted">
                    {CATEGORY_LABELS[cat].title}
                    <span className="ml-2 normal-case tracking-normal text-muted/70">
                      {CATEGORY_LABELS[cat].note}
                    </span>
                  </td>
                </tr>
                {SELL_VENUES.filter((v) => v.category === cat).map((v) => {
                  const est1500 = estimateNet(v, 1500);
                  return (
                    <tr key={v.slug} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3">
                        <Link
                          href={`/where-to-sell/${v.slug}`}
                          className="font-medium text-foreground hover:text-gold-soft"
                        >
                          {v.label}
                        </Link>
                        <div className="mt-1">{tierChip(v)}</div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {est1500.kind !== "net"
                          ? "Instant quote"
                          : 100 - est1500.keepPct === 0
                          ? "Nothing on local"
                          : `They take ~${100 - est1500.keepPct}%`}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {v.payoutSpeed.instant ? "Can be instant" : "After it sells"}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">{EFFORT_SHORT[v.effort.level]}</td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {v.priceControl.who === "venue-sets" ? "They do" : "You do"}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted/70">
        &ldquo;What they take&rdquo; shown on a $1,500 bag, since most rates move with price. Tap a
        venue for its full schedule, sourced, and how to keep more of it. Tiers are our take, not a
        verdict.
      </p>

      {/* Venue cards, grouped, for the scroll reader. */}
      {SELL_CATEGORIES.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="mb-1 font-serif text-xl text-foreground">{CATEGORY_LABELS[cat].title}</h2>
          <p className="mb-3 text-xs text-muted">{CATEGORY_LABELS[cat].note}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SELL_VENUES.filter((v) => v.category === cat).map((v) => (
              <Link
                key={v.slug}
                href={`/where-to-sell/${v.slug}`}
                className="group rounded-xl border border-border p-4 transition-colors hover:border-gold"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground group-hover:text-gold-soft">
                    {v.label}
                  </span>
                  {tierChip(v)}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{v.ourTake.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-8 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-foreground">Buying instead of selling?</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          The sister guide covers what protects you as a buyer at each of these same venues.
        </p>
        <Link
          href="/where-to-buy"
          className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
        >
          Where to buy, honestly &rarr;
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted/70">
        Rates and terms change. Every fact on these pages carries the date we last checked it, and we
        re-verify monthly. Spot something stale? Check the venue&apos;s linked policy for the current
        version.
      </p>
    </main>
  );
}
