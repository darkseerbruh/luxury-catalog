import type { Metadata } from "next";
import Link from "next/link";
import { LC_INDEX_WEIGHTS, LC_INDEX_MIN_N } from "@/lib/lc-index";

export const metadata: Metadata = {
  title: "How we rank — the LC Index method",
  description:
    "The LC Index blends four measured market signals into one rank: resale price, trade volume, scarcity, and house tier. Here is exactly how, and what it does not claim.",
};

const SIGNALS: { label: string; weight: number; body: string }[] = [
  {
    label: "Price standing",
    weight: LC_INDEX_WEIGHTS.price,
    body: "The style's resale median, pooled across its colours and sizes, ranked against every other style we track. Weighted heaviest, because price is the clearest read on where a bag sits.",
  },
  {
    label: "Trade volume",
    weight: LC_INDEX_WEIGHTS.trade,
    body: "How many resale prices we have on record for the style. A bag that changes hands constantly is a bigger presence in the market than one that rarely surfaces.",
  },
  {
    label: "Scarcity",
    weight: LC_INDEX_WEIGHTS.scarcity,
    body: "How few are listed for sale right now. Fewer live listings ranks higher. This one can read low even for a famous bag, which is the honest point.",
  },
  {
    label: "House standing",
    weight: LC_INDEX_WEIGHTS.tier,
    body: "The tier of the house that makes it, on our four-tier scale (Ultra-luxury, Luxury, Premium, Contemporary). A light thumb on the scale, not the story.",
  },
];

export default function HowWeRankPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-gold">The LC Index</p>
      <h1 className="font-serif text-3xl text-foreground">How we rank</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        One number for where a bag stands in the market, built from four measured signals. Here is
        the recipe, in the open.
      </p>

      <section className="mt-8 flex flex-col gap-3">
        {SIGNALS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-lg text-foreground">{s.label}</h2>
              <span className="font-serif text-lg text-gold-soft tabular-nums">
                {Math.round(s.weight * 100)}%
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-foreground">The honest parts</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-[13px] leading-relaxed text-muted">
          <li className="grid grid-cols-[18px_1fr] gap-2">
            <span className="text-gold">✦</span>
            <span>
              Each signal becomes a percentile across all styles first, so they combine on one scale
              before the blend.
            </span>
          </li>
          <li className="grid grid-cols-[18px_1fr] gap-2">
            <span className="text-gold">✦</span>
            <span>
              A style needs at least {LC_INDEX_MIN_N} recorded prices to earn a rank. Below that it
              stays unranked, never a made-up number.
            </span>
          </li>
          <li className="grid grid-cols-[18px_1fr] gap-2">
            <span className="text-gold">✦</span>
            <span>
              We recompute monthly from recorded prices. The rank is our reading of the market, an
              informed opinion, not an appraisal or a verdict on any single bag.
            </span>
          </li>
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/rankings" className="text-gold-soft underline underline-offset-2">
          See the full Index →
        </Link>
      </p>
    </main>
  );
}
