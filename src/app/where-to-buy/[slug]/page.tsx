import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  VENUES,
  VENUES_BY_SLUG,
  TIER_LABELS,
  CATEGORY_LABELS,
  remediesFor,
  PRICE_REALITY,
  authAppliesAtPrice,
  type Fact,
} from "@/lib/where-to-buy";
import { SITE_URL } from "@/lib/geo";

export const revalidate = 3600;

export function generateStaticParams() {
  return VENUES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = VENUES_BY_SLUG[slug];
  if (!venue) return {};
  const title = `Is ${venue.label} safe for buying a bag? What actually protects you`;
  const description = `${venue.label}: authentication, returns, and payment protection from its own published policies, dated. Plus how to cover the gaps yourself.`;
  const url = `${SITE_URL}/where-to-buy/${venue.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

/** One sourced claim: the fact, its source link, and the checked date. */
function FactRow({ label, detail, fact }: { label: string; detail: string; fact: Fact }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
        <a
          href={fact.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="shrink-0 text-[10.5px] text-muted/70 underline underline-offset-2 hover:text-gold-soft"
        >
          source · checked {fact.checkedAt}
        </a>
      </div>
      <p className="mt-1 text-sm text-foreground">{detail}</p>
      <p className="mt-0.5 text-xs text-muted">{fact.claim}</p>
    </div>
  );
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = VENUES_BY_SLUG[slug];
  if (!venue) notFound();

  const remedies = remediesFor(venue);
  const authAt500 = authAppliesAtPrice(venue, 800);
  const authAt300 = authAppliesAtPrice(venue, 300);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Does ${venue.label} authenticate bags?`,
        acceptedAnswer: { "@type": "Answer", text: venue.authentication.fact.claim },
      },
      {
        "@type": "Question",
        name: `What is ${venue.label}'s return policy on bags?`,
        acceptedAnswer: { "@type": "Answer", text: venue.returns.detail },
      },
      {
        "@type": "Question",
        name: `Is ${venue.label} safe to buy from?`,
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
        <Link href="/where-to-buy" className="hover:text-gold-soft">
          Where to buy
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
            Our take · {TIER_LABELS[venue.ourTake.tier]}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{venue.ourTake.blurb}</p>
          <p className="mt-1 text-[10.5px] text-muted/70">
            An informed opinion from the policies below, not a verdict.
          </p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 font-serif text-xl text-foreground">The receipts</h2>
        <div className="rounded-2xl border border-border px-4">
          <FactRow
            label="Authentication"
            detail={
              venue.authentication.type === "physical-all"
                ? "Physical check on every item."
                : venue.authentication.type === "physical-threshold"
                ? `Physical check from $${venue.authentication.thresholdUsd}. Below that, none. At $300: ${authAt300 ? "checked" : "not checked"}. At $800: ${authAt500 ? "checked" : "not checked"}.`
                : venue.authentication.type === "photo-optional"
                ? "Photo review only, and only if someone pays for it. No physical inspection at any price."
                : "No authentication program."
            }
            fact={venue.authentication.fact}
          />
          <FactRow label="Returns" detail={venue.returns.detail} fact={venue.returns.fact} />
          {venue.fakeRemedy ? (
            <FactRow label="If it&apos;s fake" detail={venue.fakeRemedy.detail} fact={venue.fakeRemedy.fact} />
          ) : (
            <div className="border-b border-border py-3 last:border-b-0">
              <span className="text-xs uppercase tracking-wide text-muted">If it&apos;s fake</span>
              <p className="mt-1 text-sm text-foreground">
                No venue-level remedy. Your payment rail is your only recourse.
              </p>
            </div>
          )}
          <FactRow
            label="Payment"
            detail={venue.paymentProtection.detail}
            fact={venue.paymentProtection.fact}
          />
        </div>
      </section>

      {remedies.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 font-serif text-xl text-foreground">Buying here anyway?</h2>
          <p className="mb-4 text-sm text-muted">
            Fair. Here&apos;s how to cover the gaps yourself.
          </p>
          <div className="flex flex-col gap-4">
            {remedies.map((r) => (
              <div key={r.gap} className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-medium text-foreground">{r.title}</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {r.beats.map((b, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                      <span aria-hidden className="text-gold-soft">
                        ·
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                {r.internal && (
                  <Link
                    href={r.internal.href}
                    className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
                  >
                    {r.internal.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 rounded-xl border border-gold/30 bg-surface p-4">
        <h2 className="text-sm font-medium text-foreground">{PRICE_REALITY.title}</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {PRICE_REALITY.beats.map((b, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
              <span aria-hidden className="text-gold-soft">
                ·
              </span>
              {b}
            </li>
          ))}
        </ul>
        <Link
          href={PRICE_REALITY.internal.href}
          className="mt-2 inline-block text-xs text-gold-soft underline underline-offset-2 hover:text-gold"
        >
          {PRICE_REALITY.internal.label} →
        </Link>
      </section>

      <p className="text-xs text-muted/70">
        Facts above come from {venue.label}&apos;s own published policies on the dates shown, and we
        re-verify monthly. Policies change; the linked source is always the current word.
      </p>
    </main>
  );
}
