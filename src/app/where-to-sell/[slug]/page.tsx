import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SELL_VENUES,
  SELL_VENUES_BY_SLUG,
  TIER_LABELS,
  CATEGORY_LABELS,
  tipsFor,
  estimateNet,
  PRICE_FIRST,
  type Fact,
  type SellVenueProfile,
} from "@/lib/where-to-sell";
import { SITE_URL } from "@/lib/geo";

export const revalidate = 3600;

export function generateStaticParams() {
  return SELL_VENUES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = SELL_VENUES_BY_SLUG[slug];
  if (!venue) return {};
  const title = `Selling a bag on ${venue.label}: fees, payout, and what you keep`;
  const description = `${venue.label}: what they take, how fast they pay, and how much of the work is yours, from its own published policies, dated. Plus how to keep more of your sale.`;
  const url = `${SITE_URL}/where-to-sell/${venue.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

/** One sourced claim: the fact, its source link, and the checked date. */
function FactRow({ label, detail, fact }: { label: string; detail: string; fact: Fact | null }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
        {fact ? (
          <a
            href={fact.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="shrink-0 text-[10.5px] text-muted/70 underline underline-offset-2 hover:text-gold-soft"
          >
            source &middot; checked {fact.checkedAt}
          </a>
        ) : (
          <span className="shrink-0 text-[10.5px] text-muted/50">structural, no policy cited</span>
        )}
      </div>
      <p className="mt-1 text-sm text-foreground">{detail}</p>
      {fact && <p className="mt-0.5 text-xs text-muted">{fact.claim}</p>}
    </div>
  );
}

/** The commission schedule, when the venue publishes one. */
function ScheduleTable({ venue }: { venue: SellVenueProfile }) {
  const p = venue.payout;
  if (p.kind === "flat") {
    return (
      <p className="text-sm text-foreground">
        A flat rate: you keep {p.sellerKeepPct}% of the sale.
        {p.note ? <span className="mt-1 block text-xs text-muted">{p.note}</span> : null}
      </p>
    );
  }
  if (p.kind === "buyout") {
    return (
      <p className="text-sm text-foreground">
        An upfront quote per item, not a published percentage. Compare the quote to the going
        rate before you accept.
      </p>
    );
  }
  const marginal = p.kind === "marginal";
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-muted">
            <th className="px-3 py-2 font-normal">Sale price</th>
            <th className="px-3 py-2 font-normal">You keep</th>
          </tr>
        </thead>
        <tbody>
          {p.tiers.map((t) => (
            <tr key={t.minUsd} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 text-foreground">
                {t.maxUsd == null
                  ? `Over $${t.minUsd.toLocaleString("en-US")}`
                  : `$${t.minUsd.toLocaleString("en-US")} to $${t.maxUsd.toLocaleString("en-US")}`}
              </td>
              <td className="px-3 py-2 text-foreground">{t.sellerKeepPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
        {marginal
          ? "Each rate applies only to the part of the sale in that band."
          : "The whole sale is paid at the band it lands in."}
        {p.flatFeeUsd ? ` A flat $${p.flatFeeUsd} per item is also deducted.` : ""}
      </p>
    </div>
  );
}

const SAMPLE_PRICES = [500, 1500, 5000];
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export default async function SellVenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = SELL_VENUES_BY_SLUG[slug];
  if (!venue) notFound();

  const tips = tipsFor(venue);
  const samples = SAMPLE_PRICES.map((price) => ({ price, est: estimateNet(venue, price) }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What fee does ${venue.label} take to sell a bag?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            venue.payout.kind === "flat"
              ? `You keep ${venue.payout.sellerKeepPct}% of the sale. ${venue.payout.note ?? ""}`.trim()
              : `${venue.label} pays on a schedule that changes with the sale price. ${venue.ourTake.blurb}`,
        },
      },
      {
        "@type": "Question",
        name: `How fast does ${venue.label} pay you?`,
        acceptedAnswer: { "@type": "Answer", text: venue.payoutSpeed.detail },
      },
      {
        "@type": "Question",
        name: `Is ${venue.label} a good place to sell a bag?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${venue.ourTake.blurb} That is our take based on the venue's published policies, not a verdict.`,
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <nav className="mb-4 text-xs text-muted">
        <Link href="/where-to-sell" className="hover:text-gold-soft">
          Where to sell
        </Link>{" "}
        / {venue.label}
      </nav>

      <header className="mb-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">
          {CATEGORY_LABELS[venue.category].title}
        </p>
        <h1 className="font-serif text-3xl text-foreground">{venue.label}</h1>
        <p className="mt-2 text-sm text-muted">{CATEGORY_LABELS[venue.category].note}</p>
        <div className="mt-3 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            Our take &middot; {TIER_LABELS[venue.ourTake.tier]}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{venue.ourTake.blurb}</p>
          <p className="mt-1 text-[10.5px] text-muted/70">
            An informed opinion from the policies below, not a verdict.
          </p>
        </div>
      </header>

      {/* The math: what you'd keep at three sample prices. */}
      <section className="mb-8">
        <h2 className="mb-2 font-serif text-xl text-foreground">What you keep</h2>
        <div className="mb-3">
          <ScheduleTable venue={venue} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-gold/30 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-normal">If it sells for</th>
                <th className="px-3 py-2 font-normal">You&apos;d keep about</th>
              </tr>
            </thead>
            <tbody>
              {samples.map(({ price, est }) => (
                <tr key={price} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 text-foreground">{usd(price)}</td>
                  <td className="px-3 py-2 text-foreground">
                    {est.kind === "net" ? (
                      <>
                        {usd(est.net)}{" "}
                        <span className="text-[11px] text-muted">({est.keepPct}%)</span>
                      </>
                    ) : (
                      "an instant quote"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
            Our estimate off {venue.label}&apos;s published rates, before shipping and any state
            tax.{" "}
            {venue.category === "sells-for-you" || venue.models.includes("consignment")
              ? "Paid only once the bag sells."
              : "Paid after the sale completes."}
          </p>
        </div>
        {venue.buyout?.available && (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Prefer cash today? {venue.label} will also buy the bag outright for an instant quote,
            which runs lower than consigning. No published percentage, so weigh the offer against
            the going rate.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-serif text-xl text-foreground">The receipts</h2>
        <div className="rounded-2xl border border-border px-4">
          <FactRow label="Payout speed" detail={venue.payoutSpeed.detail} fact={venue.payoutSpeed.fact} />
          <FactRow
            label="How you get paid"
            detail={
              venue.payoutMethods.methods.join(", ") +
              (venue.payoutMethods.storeCreditBonusPct
                ? `. Store credit adds ${venue.payoutMethods.storeCreditBonusPct}%.`
                : ".")
            }
            fact={venue.payoutMethods.fact}
          />
          <FactRow label="What they accept" detail={venue.acceptance.detail} fact={venue.acceptance.fact} />
          <FactRow label="How much work" detail={venue.effort.detail} fact={venue.effort.fact} />
          <FactRow label="Who sets the price" detail={venue.priceControl.detail} fact={venue.priceControl.fact} />
          <FactRow label="If it fails their check" detail={venue.sellerAuth.detail} fact={venue.sellerAuth.fact} />
        </div>
      </section>

      {tips.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 font-serif text-xl text-foreground">Selling here anyway?</h2>
          <p className="mb-4 text-sm text-muted">Fair. Here&apos;s how to keep more of it.</p>
          <div className="flex flex-col gap-4">
            {tips.map((t) => (
              <div key={t.key} className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-foreground">{t.title}</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {t.beats.map((b, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                      <span aria-hidden className="text-gold-soft">
                        &middot;
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                {t.internal && (
                  <Link
                    href={t.internal.href}
                    className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
                  >
                    {t.internal.label} &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 rounded-xl border border-gold/30 bg-surface p-4">
        <h2 className="text-sm font-medium text-foreground">{PRICE_FIRST.title}</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {PRICE_FIRST.beats.map((b, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
              <span aria-hidden className="text-gold-soft">
                &middot;
              </span>
              {b}
            </li>
          ))}
        </ul>
        <Link
          href={PRICE_FIRST.internal.href}
          className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
        >
          {PRICE_FIRST.internal.label} &rarr;
        </Link>
      </section>

      <p className="text-xs text-muted/70">
        Terms above come from {venue.label}&apos;s own published policies on the dates shown, and we
        re-verify monthly. Rates change; the linked source is always the current word.
      </p>
    </main>
  );
}
