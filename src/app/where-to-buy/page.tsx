import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import {
  VENUES,
  VENUE_CATEGORIES,
  CATEGORY_LABELS,
  TIER_LABELS,
  type VenueProfile,
} from "@/lib/where-to-buy";
import { SITE_URL } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Where to buy a preloved bag: what each venue protects",
  description:
    "What each resale venue protects: authentication, returns, payment, and what to do yourself when it doesn't. Sourced from each venue's own published policies.",
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

/** Authentication as a stated fact, threshold and all. No input, no toggle. */
function AuthCell({ venue }: { venue: VenueProfile }) {
  const t = venue.authentication.type;
  if (t === "physical-all") return <Mark ok note="any price" />;
  if (t === "physical-threshold") {
    const th = venue.authentication.thresholdUsd;
    return (
      <span className="flex flex-col gap-0.5 text-[13px]">
        <span className="text-emerald-600">
          <span aria-hidden>✓</span> ${th} and up
        </span>
        <span className="text-rose-500">
          <span aria-hidden>✗</span> below ${th}
        </span>
      </span>
    );
  }
  if (t === "photo-optional") return <Mark ok={false} note="photo review only" />;
  return <Mark ok={false} note="none" />;
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

export default async function WhereToBuyPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Where to buy a preloved bag",
    description:
      "Resale venues compared by what protects the buyer: authentication, returns, and payment protection, from each venue's own published policies.",
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
        <h1 className="font-serif text-3xl text-foreground">Where to buy a preloved bag, and what to check</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Every venue protects you differently. Here&apos;s what each one covers, so you
          can shop wherever you like and know exactly what you&apos;re walking into. Every claim
          links to the venue&apos;s own published policy, dated the day we checked it.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted/80">
          One thing to read closely: eBay and Poshmark only physically inspect bags priced
          $500 and up. Below that line, no one checks the bag for you.
        </p>
      </header>

      {/* The protection matrix. */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-3 py-2.5 font-normal">Venue</th>
              <th className="px-3 py-2.5 font-normal">Physical check</th>
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
                        <AuthCell venue={v} />
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
