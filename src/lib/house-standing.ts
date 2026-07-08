/**
 * House Standing — our own brand-tier formula.
 *
 * One measured 0-100 score per house, cut into numbered bands (Tier 1 highest →
 * Tier 5), for where a brand sits in the resale market. Sibling of the LC Index
 * (src/lib/lc-index.ts): same methodology, but at the HOUSE level. Framed as our
 * standing, not a verdict. Spec: docs/ux/tier-formula-spec.md.
 *
 * This is the PURE core (no I/O, unit-tested). The data layer that reads live
 * brand signals lives in supabase/ingest/house-standing.ts.
 *
 * HONESTY: a house below the n-gate is left UNPLACED (tier null), never a guessed
 * tier. Percentiles are computed WITHIN the placed set so the signals share one
 * 0-100 scale before the weighted blend.
 */

export type TierRank = 1 | 2 | 3 | 4 | 5;

/** Raw per-brand signals (retail/boutique rows excluded upstream). */
export interface BrandSignals {
  brandId: number;
  name: string;
  /** Resale median across the brand's variants; null when unknown. */
  resaleMedian: number | null;
  /** Resale p90 (the brand's hero pieces); null when unknown. */
  ceiling: number | null;
  /** Count of recorded resale prices = trade volume. */
  tradeCount: number;
}

/** One house's computed standing. */
export interface HouseStanding {
  brandId: number;
  name: string;
  /** Composite 0-100 (1dp); null when below the n-gate. */
  score: number | null;
  /** Numbered band 1 (highest) → 5; null when unplaced. */
  tier: TierRank | null;
  pricePct: number;
  ceilingPct: number;
  tradePct: number;
  resaleMedian: number | null;
  ceiling: number | null;
  tradeCount: number;
}

/** DRAFT weights (spec-locked v1): price standing heaviest. */
export const HOUSE_STANDING_WEIGHTS = { median: 0.55, ceiling: 0.25, trade: 0.2 } as const;

/** A house needs at least this many recorded prices to be placed. */
export const HOUSE_STANDING_MIN_N = 30;

/** Score → tier cutoffs (spec-locked; tunable). Ordered high → low. */
export const HOUSE_STANDING_BANDS: { tier: TierRank; min: number }[] = [
  { tier: 1, min: 90 },
  { tier: 2, min: 75 },
  { tier: 3, min: 55 },
  { tier: 4, min: 30 },
  { tier: 5, min: 0 },
];

/** Plain-words gloss shown next to each number (voice-gated draft copy). */
export const TIER_DESCRIPTOR: Record<TierRank, string> = {
  1: "Commands the most, trades the most",
  2: "High standing, deep resale demand",
  3: "Established, active resale",
  4: "Accessible standing, steady resale",
  5: "Entry standing, everyday reach",
};

/** Legacy string tiers → display label, so the transition window (before the
 * numbered backfill lands) still reads cleanly. Removed once every brand is numeric. */
const LEGACY_TIER_LABEL: Record<string, string> = {
  "ultra-luxury": "Ultra-luxury",
  premium: "Premium",
  mid: "Luxury",
  thrift: "Contemporary",
};

export interface TierDisplay {
  rank: TierRank | null;
  label: string;
  descriptor: string | null;
}

/**
 * Display for a brand's stored tier value, tolerant of BOTH schemes during the
 * rollout: numeric "1".."5" → "Tier N" + its plain gloss; a legacy string →
 * its old label (no gloss); null/unknown → an empty, gloss-less display.
 */
export function tierDisplay(tier: string | null | undefined): TierDisplay {
  if (tier == null) return { rank: null, label: "", descriptor: null };
  const n = Number(tier);
  if (Number.isInteger(n) && n >= 1 && n <= 5) {
    const rank = n as TierRank;
    return { rank, label: `Tier ${rank}`, descriptor: TIER_DESCRIPTOR[rank] };
  }
  return { rank: null, label: LEGACY_TIER_LABEL[tier] ?? tier, descriptor: null };
}

/** Band for a score (assumes 0-100). Highest matching cutoff wins. */
export function tierForScore(score: number): TierRank {
  for (const b of HOUSE_STANDING_BANDS) if (score >= b.min) return b.tier;
  return 5;
}

/**
 * Percentile of `value` within `population`: the share at or below `value`, 0-100.
 * Empty population → 0. Ties share a percentile.
 */
export function percentileOf(value: number, population: number[]): number {
  if (population.length === 0) return 0;
  const atOrBelow = population.reduce((n, p) => (p <= value ? n + 1 : n), 0);
  return (atOrBelow / population.length) * 100;
}

/**
 * PURE: turn raw brand signals into placed standings, sorted by score desc. A
 * house is placed only if it has a resale median AND >= MIN_N recorded prices.
 * Ceiling falls back to the median when p90 is missing so it never nulls a placed
 * house. Percentiles are computed within the placed set.
 */
export function computeHouseStanding(signals: BrandSignals[]): HouseStanding[] {
  const placed = signals.filter((s) => s.resaleMedian != null && s.tradeCount >= HOUSE_STANDING_MIN_N);
  const medians = placed.map((s) => s.resaleMedian as number);
  const ceils = placed.map((s) => (s.ceiling ?? s.resaleMedian) as number);
  const trades = placed.map((s) => s.tradeCount);

  const scored: HouseStanding[] = signals.map((s) => {
    const isPlaced = s.resaleMedian != null && s.tradeCount >= HOUSE_STANDING_MIN_N;
    if (!isPlaced) {
      return {
        brandId: s.brandId, name: s.name, score: null, tier: null,
        pricePct: 0, ceilingPct: 0, tradePct: 0,
        resaleMedian: s.resaleMedian, ceiling: s.ceiling, tradeCount: s.tradeCount,
      };
    }
    const pricePct = percentileOf(s.resaleMedian as number, medians);
    const ceilingPct = percentileOf((s.ceiling ?? s.resaleMedian) as number, ceils);
    const tradePct = percentileOf(s.tradeCount, trades);
    const raw =
      HOUSE_STANDING_WEIGHTS.median * pricePct +
      HOUSE_STANDING_WEIGHTS.ceiling * ceilingPct +
      HOUSE_STANDING_WEIGHTS.trade * tradePct;
    const score = Math.round(raw * 10) / 10;
    return {
      brandId: s.brandId, name: s.name, score, tier: tierForScore(score),
      pricePct, ceilingPct, tradePct,
      resaleMedian: s.resaleMedian, ceiling: s.ceiling, tradeCount: s.tradeCount,
    };
  });

  return scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name));
}
