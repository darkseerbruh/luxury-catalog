/**
 * StandingCard — the LC Index "standing module". A bag's rank as the headline,
 * with the three measures behind it (price / trade volume / scarcity) as small
 * side-by-side leaderboards. House standing rides in the header line so the three
 * boards stay parallel. See docs/ux/lc-index-spec.md.
 *
 * Pure presentational server component: it renders a StandingView built by
 * src/lib/lc-index.ts. Framed as "our index, not a verdict"; every figure carries
 * its sample size and date.
 */

import Link from "next/link";
import type { StandingView, StandingBoardRow } from "@/lib/lc-index";
import MovementPill from "./MovementPill";

const TIER_LABEL: Record<string, string> = {
  "ultra-luxury": "Ultra-luxury",
  premium: "Premium",
  mid: "Luxury",
  thrift: "Contemporary",
};

function Board({
  title,
  scope,
  rows,
}: {
  title: string;
  scope: string;
  rows: StandingBoardRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3">
      <h4 className="mb-2 border-b border-gold/35 pb-1.5 font-serif text-base font-medium text-foreground">
        {title}
        <span className="mt-0.5 block font-sans text-[10px] font-normal text-muted/60">{scope}</span>
      </h4>
      <ol>
        {rows.map((r) => (
          <li
            key={r.styleId}
            className={`grid grid-cols-[34px_1fr] items-baseline gap-1.5 py-0.5 text-[11.5px] ${
              r.isSelf
                ? "-mx-1.5 rounded-md bg-gold/10 px-1.5 font-semibold text-foreground"
                : "text-muted"
            }`}
          >
            <span
              className={`text-right font-serif text-[13px] tabular-nums ${
                r.isSelf ? "text-gold-soft" : "text-muted/60"
              }`}
            >
              #{r.position}
            </span>
            <span className="truncate">
              {r.styleName}
              {r.brandName ? <span className="text-muted/60"> · {r.brandName}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function StandingCard({ view }: { view: StandingView }) {
  const { rank, totalRanked, styleName, brandName, tier, priceCount, boards } = view;
  if (rank == null) return null;
  const totalLabel = totalRanked.toLocaleString();
  const houseLabel = tier ? TIER_LABEL[tier] ?? null : null;

  return (
    <section aria-label={`LC Index standing: ranked ${rank} of ${totalLabel}`}>
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Left: the rank as the headline, with what/why/trust beats. */}
        <div className="flex flex-col border-border md:border-r md:pr-6">
          <div className="font-serif text-6xl leading-none text-gold-soft tabular-nums">#{rank}</div>
          <p className="mt-1 text-[13.5px] text-foreground">
            of <b className="font-semibold text-gold-soft">{totalLabel} styles</b> in the LC Index
          </p>
          <div className="mb-4 mt-1.5">
            <MovementPill rank={rank} previousRank={view.previousRank} />
          </div>
          <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted">
            <li className="grid grid-cols-[18px_1fr] gap-2">
              <span className="text-center text-gold">✦</span>
              <span>One number for where a bag stands in the whole market.</span>
            </li>
            <li className="grid grid-cols-[18px_1fr] gap-2">
              <span className="text-center text-gold">⚖</span>
              <span>Blended from price, trade volume, and scarcity, weighted by house tier.</span>
            </li>
            <li className="grid grid-cols-[18px_1fr] gap-2">
              <span className="text-center text-gold">◷</span>
              <span>Recomputed monthly from recorded market prices.</span>
            </li>
          </ul>
          <p className="mt-auto pt-3 text-xs text-muted">
            Our index, not a verdict.{" "}
            <Link href="/rankings/how-we-rank" className="text-gold-soft underline underline-offset-2">
              How we rank
            </Link>
          </p>
        </div>

        {/* Right: the three measures behind the rank. */}
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted/60">
            The three measures behind <b className="font-semibold text-gold-soft">#{rank}</b>
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Board title="By price" scope={`of ${totalLabel} styles`} rows={boards.price} />
            <Board title="By trade volume" scope={`of ${totalLabel} styles`} rows={boards.trade} />
            <Board title="By scarcity" scope="fewer listings, higher" rows={boards.scarcity} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3.5 text-xs text-muted">
        <span>
          {priceCount.toLocaleString()} recorded {priceCount === 1 ? "price" : "prices"} for {styleName}
          {houseLabel ? ` · ${brandName}, ${houseLabel}` : ""}
        </span>
        <Link href="/rankings" className="text-gold-soft underline underline-offset-2">
          See the full Index →
        </Link>
      </div>
    </section>
  );
}
