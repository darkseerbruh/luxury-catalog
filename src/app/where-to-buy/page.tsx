import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import {
  VENUES,
  VENUE_CATEGORIES,
  CATEGORY_LABELS,
  TIER_LABELS,
  PRICE_BANDS,
  authAppliesAtPrice,
  type PriceBandKey,
  type VenueProfile,
} from "@/lib/where-to-buy";
import { SITE_URL } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Where to buy a preloved bag, honestly",
  description:
    "What each resale venue actually protects: authentication, returns, payment, and what to do yourself when it doesn't. Sourced from each venue's own published policies.",
};

export const revalidate = 3600;

/** Small sourced-cell glyphs. Text glyphs keep the matrix legible at 375px. */
function Mark({ ok, note }: { ok: boolean; note?: string }) {
  return (
    <span className={ok ? "text-emerald-600" : "text-rose-500"}>
      <span aria-hidden>{ok ? "✓" : "✗"}</span>
      <span className="sr-only">{ok ? "yes" : "no"}</span>
      {note && <span className="ml-1 text-[10.5px] text-muted">{note}</span>}
    </span>
  );
}

function tierChip(v: VenueProfile) {
  const styles: Record<string, string> = {
    protected: "border-emerald-600/40 text-emerald-700",
    "know-the-gaps": "border-amber-500/40 text-amber-700",
    "on-your-own": "border-rose-500/40 text-rose-600",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-wide ${styles[v.ourTake.tier]}`}
    >
      {TIER_LABELS[v.ourTake.tier]}
    </span>
  );
}

export default async function WhereToBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ price?: string }>;
}) {
  const { price } = await searchParams;
  const band = PRICE_BANDS.find((b) => b.key === (price as PriceBandKey)) ?? PRICE_BANDS[2];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Where to buy a preloved bag",
    description:
      "Resale venues compared by what actually protects the buyer: authentication, returns, and payment protection, from each venue's own published policies.",
    numberOfItems: VENUES.length,
    itemListElement: VENUES.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.label,
      url: `${SITE_URL}/where-to-buy/${v.slug}`,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <header className="mb-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">Where to buy</p>
        <h1 className="font-serif text-3xl text-foreground">Where to buy, honestly</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          What each venue actually protects, at your price. No judgment, just the receipts:
          every claim below links to the venue&apos;s own published policy, with the date we
          checked it.
        </p>
      </header>

      {/* The signature move: protection depends on price. */}
      <section className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">I&apos;m spending</p>
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map((b) => (
            <Link
              key={b.key}
              href={b.key === "500-plus" ? "/where-to-buy" : `/where-to-buy?price=${b.key}`}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                b.key === band.key
                  ? "border-gold text-gold"
                  : "border-border text-muted hover:border-gold-soft"
              }`}
            >
              {b.label}
            </Link>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted/80">
          eBay and Poshmark physically inspect bags from $500. Below that line the checkmark
          you may be picturing does not exist.
        </p>
      </section>

      {/* The protection matrix. */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-3 py-2.5 font-normal">Venue</th>
              <th className="px-3 py-2.5 font-normal">Physical check at {band.label.toLowerCase()}</th>
              <th className="px-3 py-2.5 font-normal">Returns</th>
              <th className="px-3 py-2.5 font-normal">If it&apos;s fake</th>
              <th className="px-3 py-2.5 font-normal">Payment held safe</th>
            </tr>
          </thead>
          <tbody>
            {VENUE_CATEGORIES.map((cat) => (
              <Fragment key={cat}>
                <tr className="border-b border-border bg-surface/50">
                  <td colSpan={5} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted">
                    {CATEGORY_LABELS[cat].title}
                    <span className="ml-2 normal-case tracking-normal text-muted/70">
                      {CATEGORY_LABELS[cat].note}
                    </span>
                  </td>
                </tr>
                {VENUES.filter((v) => v.category === cat).map((v) => {
                  const auth = authAppliesAtPrice(v, band.probe);
                  return (
                    <tr key={v.slug} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3">
                        <Link
                          href={`/where-to-buy/${v.slug}`}
                          className="font-medium text-foreground hover:text-gold-soft"
                        >
                          {v.label}
                        </Link>
                        <div className="mt-1">{tierChip(v)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <Mark
                          ok={auth}
                          note={
                            v.authentication.type === "physical-threshold"
                              ? `from $${v.authentication.thresholdUsd}`
                              : v.authentication.type === "photo-optional"
                              ? "photo review only"
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        {v.returns.windowDays != null ? (
                          <span className="text-foreground">{v.returns.windowDays} days</span>
                        ) : (
                          <Mark ok={false} note={v.slug === "ebay" ? "varies" : "final sale"} />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Mark ok={v.fakeRemedy != null} />
                      </td>
                      <td className="px-3 py-3">
                        <Mark ok={v.paymentProtection.covered} />
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
        Tap a venue for the full picture: sources for every cell, and how to cover the gaps
        yourself if you&apos;re buying there anyway. Tiers are our take, not a verdict.
      </p>

      {/* Venue cards, grouped, for the scroll reader. */}
      {VENUE_CATEGORIES.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="mb-1 font-serif text-xl text-foreground">{CATEGORY_LABELS[cat].title}</h2>
          <p className="mb-3 text-xs text-muted">{CATEGORY_LABELS[cat].note}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {VENUES.filter((v) => v.category === cat).map((v) => (
              <Link
                key={v.slug}
                href={`/where-to-buy/${v.slug}`}
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

      <p className="mt-8 text-xs text-muted/70">
        Policies change. Every fact on these pages carries the date we last checked it, and we
        re-verify monthly. Spot something stale? It probably changed this week; check the
        venue&apos;s linked policy for the current version.
      </p>
    </main>
  );
}
