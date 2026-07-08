import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/geo";
import {
  TIER_DESCRIPTOR,
  HOUSE_STANDING_WEIGHTS,
  HOUSE_STANDING_MIN_N,
  type TierRank,
} from "@/lib/house-standing";

export const metadata: Metadata = {
  title: "How we tier houses: House Standing",
  description:
    "How Luxury Catalog tiers handbag houses: House Standing, a measured resale-market score (price, ceiling, trade volume) cut into numbered tiers. Our standing, not a verdict.",
};

const SIGNALS: { label: string; weight: number; note: string }[] = [
  { label: "Price standing", weight: HOUSE_STANDING_WEIGHTS.median, note: "the house's median resale price" },
  { label: "Ceiling", weight: HOUSE_STANDING_WEIGHTS.ceiling, note: "what its top pieces reach" },
  { label: "Trade volume", weight: HOUSE_STANDING_WEIGHTS.trade, note: "how actively its bags change hands" },
];

const TIERS = [1, 2, 3, 4, 5] as TierRank[];

/** A small, non-logo tier glyph: a stack of bars, the top N filled for Tier N-from-top. */
function TierGlyph({ tier }: { tier: TierRank }) {
  const filled = 6 - tier; // Tier 1 → 5 bars, Tier 5 → 1 bar
  return (
    <span aria-hidden className="inline-flex items-end gap-0.5" style={{ height: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= filled ? "bg-gold" : "bg-border"}
          style={{ width: 3, height: 4 + i * 2.2, borderRadius: 1 }}
        />
      ))}
    </span>
  );
}

export default function HowWeTierPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Luxury Catalog tier handbag brands?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "By House Standing, a measured resale-market score blending a house's median resale price (55%), its ceiling (25%), and its trade volume (20%), cut into five numbered tiers (Tier 1 highest to Tier 5). It is our standing, not a verdict, and it is recomputed as the market moves.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <p className="text-sm uppercase tracking-widest text-muted">Our method</p>
      <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">How we tier houses</h1>
      <p className="mt-4 text-lg text-foreground">
        One measured number decides where a house sits, not its reputation.
      </p>
      <p className="mt-2 text-muted">
        We call it <strong className="text-foreground">House Standing</strong>. It reads the resale
        market, the same data behind <Link href="/rankings" className="text-gold hover:underline">the LC Index</Link>,
        and places every house on a five-tier spectrum. This is our standing, not a verdict.
      </p>

      <h2 className="mt-10 font-serif text-2xl text-foreground">What it measures</h2>
      <ul className="mt-4 space-y-3">
        {SIGNALS.map((s) => (
          <li key={s.label} className="flex items-baseline gap-3">
            <span className="min-w-14 font-serif text-xl text-gold">{Math.round(s.weight * 100)}%</span>
            <span>
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="text-muted">: {s.note}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-serif text-2xl text-foreground">The tiers</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {TIERS.map((t) => (
              <tr key={t} className="border-b border-border">
                <td className="py-3 pr-4 align-middle">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <TierGlyph tier={t} /> Tier {t}
                  </span>
                </td>
                <td className="py-3 text-muted">{TIER_DESCRIPTOR[t]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-serif text-2xl text-foreground">How we keep it honest</h2>
      <ul className="mt-4 space-y-2 text-muted">
        <li>
          ◆ Each signal is scored against every other house first, so the tiers reflect the market, not a hunch.
        </li>
        <li>
          ◆ A house needs at least {HOUSE_STANDING_MIN_N} recorded resale prices to be placed. Below that it stays unplaced, never guessed.
        </li>
        <li>◆ We recompute as the market moves, so a house can rise or fall.</li>
        <li>◆ Numbers, not labels, on purpose. No house is a &ldquo;knock,&rdquo; and none is above the data.</li>
      </ul>

      <p className="mt-10 text-sm text-muted">
        Want to see it in motion? Browse <Link href="/rankings" className="text-gold hover:underline">the LC Index</Link> or
        any <Link href="/search" className="text-gold hover:underline">bag&rsquo;s page</Link>, where a house&rsquo;s tier sits next to its name.
      </p>
      <link rel="canonical" href={`${SITE_URL}/how-we-tier`} />
    </main>
  );
}
