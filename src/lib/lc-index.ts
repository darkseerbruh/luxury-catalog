/**
 * The LC Index — where a bag stands in the market.
 *
 * One blended score per style, built from four measured signals: price standing,
 * trade volume, scarcity, and house tier. See docs/ux/lc-index-spec.md.
 *
 * This file splits into a PURE core (computeLcIndex + helpers, fully unit-tested,
 * no I/O) and a thin DATA layer (loadStyleSignals + the cached getters) that reads
 * the style_index_signals() RPC. The core is where the ranking logic lives; the
 * data layer only fetches and caches.
 *
 * HONESTY: nothing is fabricated. A style below the n-gate is left UNRANKED (it
 * shows "not enough data yet", never a made-up rank). Scarcity is inverted from
 * live-listing counts, so a widely-available bag reads lower on that axis even when
 * that is unflattering. The composite weights are published on the "How we rank"
 * page; this is our index, not a verdict.
 */

import { unstable_cache } from "next/cache";
import { getSupabase } from "./supabase";

export type BrandTier = "thrift" | "mid" | "premium" | "ultra-luxury";

/** Raw per-style signals as returned by style_index_signals(). */
export interface StyleSignals {
  styleId: number;
  styleName: string;
  brandId: number;
  brandName: string;
  tier: BrandTier | null;
  /** Pooled resale median across the style's variants, or null when unknown. */
  resaleMedian: number | null;
  /** Count of recorded resale prices = trade volume. */
  priceCount: number;
  /** Count of live for-sale listings right now = the scarcity source. */
  liveCount: number;
  /** A representative variant id for the style (photo + link target). */
  repVariantId: number | null;
}

/** One style's computed standing: its rank plus the three why-meter bars (0–100). */
export interface Standing {
  styleId: number;
  styleName: string;
  brandId: number;
  brandName: string;
  tier: BrandTier | null;
  /** 1-based rank among all ranked styles; null when below the n-gate. */
  rank: number | null;
  totalRanked: number;
  /** Composite 0–100 (rounded to 1dp); null when unranked. */
  score: number | null;
  resaleMedian: number | null;
  priceCount: number;
  liveCount: number;
  repVariantId: number | null;
  /** Why-meter bars, each a 0–100 percentile within the ranked set. */
  pricePct: number;
  tradePct: number;
  scarcityPct: number;
  /** The single signal driving this rank most (biggest weighted contribution). */
  lead: "price" | "trade" | "scarcity";
}

export const LC_INDEX_WEIGHTS = {
  price: 0.4,
  trade: 0.25,
  scarcity: 0.2,
  tier: 0.15,
} as const;

/** A style needs at least this many recorded prices to earn a rank. */
export const LC_INDEX_MIN_N = 8;

const TIER_RANK: Record<BrandTier, number> = {
  thrift: 1,
  mid: 2,
  premium: 3,
  "ultra-luxury": 4,
};

/**
 * Percentile of `value` within `population` (both finite numbers): the share of
 * the population at or below `value`, as 0–100. The max of the set is 100; ties
 * share a percentile. Empty population → 0.
 */
export function percentileOf(value: number, population: number[]): number {
  if (population.length === 0) return 0;
  const atOrBelow = population.reduce((n, p) => (p <= value ? n + 1 : n), 0);
  return (atOrBelow / population.length) * 100;
}

function tierPercentile(tier: BrandTier | null): number {
  if (!tier) return 0;
  return ((TIER_RANK[tier] - 1) / 3) * 100;
}

/**
 * A short, plain-words caption for the why-meter: names the signal driving the
 * rank, as a market fact (never a verdict). Decisive, and honest at both ends.
 */
export function whyNote(s: Pick<Standing, "lead" | "pricePct" | "tradePct" | "scarcityPct">): string {
  switch (s.lead) {
    case "price":
      return s.pricePct >= 50 ? "Priced above most of the catalog" : "An accessible price";
    case "trade":
      return s.tradePct >= 50 ? "One of the most-traded bags we track" : "Trades quietly";
    case "scarcity":
      return s.scarcityPct >= 50 ? "Rarely listed right now" : "Widely available today";
  }
}

export interface LcIndexData {
  ranked: Standing[];
  unrankedStyleIds: number[];
  totalRanked: number;
  /** Neighbor labels for the standing-card boards. */
  names: Record<number, { styleName: string; brandName: string }>;
  /** Style ids ordered high→low for each single-signal board. */
  order: { price: number[]; trade: number[]; scarcity: number[] };
}

/**
 * PURE: turn raw per-style signals into ranked standings. No I/O.
 *
 * A style is ranked only if it has a resale median AND at least LC_INDEX_MIN_N
 * recorded prices. Percentiles are computed WITHIN the ranked set so the four
 * signals share one 0–100 scale before the weighted blend.
 */
export function computeLcIndex(signals: StyleSignals[]): LcIndexData {
  const names: Record<number, { styleName: string; brandName: string }> = {};
  for (const s of signals) names[s.styleId] = { styleName: s.styleName, brandName: s.brandName };

  const eligible = signals.filter(
    (s) => s.resaleMedian != null && s.priceCount >= LC_INDEX_MIN_N,
  );
  const unrankedStyleIds = signals
    .filter((s) => !(s.resaleMedian != null && s.priceCount >= LC_INDEX_MIN_N))
    .map((s) => s.styleId);

  const medians = eligible.map((s) => s.resaleMedian as number);
  const trades = eligible.map((s) => s.priceCount);
  const lives = eligible.map((s) => s.liveCount);

  const scored = eligible.map((s) => {
    const pricePct = percentileOf(s.resaleMedian as number, medians);
    const tradePct = percentileOf(s.priceCount, trades);
    // Fewer live listings → scarcer → higher. Invert the live-count percentile.
    const scarcityPct = 100 - percentileOf(s.liveCount, lives);
    const tierPct = tierPercentile(s.tier);

    const score =
      LC_INDEX_WEIGHTS.price * pricePct +
      LC_INDEX_WEIGHTS.trade * tradePct +
      LC_INDEX_WEIGHTS.scarcity * scarcityPct +
      LC_INDEX_WEIGHTS.tier * tierPct;

    // Lead = the bar with the biggest weighted contribution (tier is not a bar).
    const contributions: Array<[Standing["lead"], number]> = [
      ["price", LC_INDEX_WEIGHTS.price * pricePct],
      ["trade", LC_INDEX_WEIGHTS.trade * tradePct],
      ["scarcity", LC_INDEX_WEIGHTS.scarcity * scarcityPct],
    ];
    const lead = contributions.reduce((best, c) => (c[1] > best[1] ? c : best))[0];

    return {
      signals: s,
      pricePct,
      tradePct,
      scarcityPct,
      score,
      lead,
    };
  });

  // Sort by score desc; deterministic tie-break by median desc then styleId asc.
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.signals.resaleMedian as number) - (a.signals.resaleMedian as number) ||
      a.signals.styleId - b.signals.styleId,
  );

  const totalRanked = scored.length;
  const ranked: Standing[] = scored.map((row, i) => ({
    styleId: row.signals.styleId,
    styleName: row.signals.styleName,
    brandId: row.signals.brandId,
    brandName: row.signals.brandName,
    tier: row.signals.tier,
    rank: i + 1,
    totalRanked,
    score: Math.round(row.score * 10) / 10,
    resaleMedian: row.signals.resaleMedian,
    priceCount: row.signals.priceCount,
    liveCount: row.signals.liveCount,
    repVariantId: row.signals.repVariantId,
    pricePct: Math.round(row.pricePct),
    tradePct: Math.round(row.tradePct),
    scarcityPct: Math.round(row.scarcityPct),
    lead: row.lead,
  }));

  const order = {
    price: [...eligible].sort((a, b) => (b.resaleMedian as number) - (a.resaleMedian as number)).map((s) => s.styleId),
    trade: [...eligible].sort((a, b) => b.priceCount - a.priceCount).map((s) => s.styleId),
    // Scarcity board: scarcest (fewest live) first.
    scarcity: [...eligible].sort((a, b) => a.liveCount - b.liveCount).map((s) => s.styleId),
  };

  return { ranked, unrankedStyleIds, totalRanked, names, order };
}

/** A single board (by price / trade / scarcity) around one style. */
export interface StandingBoardRow {
  position: number;
  styleId: number;
  styleName: string;
  brandName: string;
  isSelf: boolean;
}

/** The style's ±1 neighbors in one single-signal ordering. */
export function boardAround(
  data: LcIndexData,
  signal: keyof LcIndexData["order"],
  styleId: number,
): StandingBoardRow[] {
  const ids = data.order[signal];
  const idx = ids.indexOf(styleId);
  if (idx === -1) return [];
  const from = Math.max(0, idx - 1);
  const to = Math.min(ids.length - 1, idx + 1);
  const rows: StandingBoardRow[] = [];
  for (let i = from; i <= to; i++) {
    const id = ids[i];
    rows.push({
      position: i + 1,
      styleId: id,
      styleName: data.names[id]?.styleName ?? "",
      brandName: data.names[id]?.brandName ?? "",
      isSelf: id === styleId,
    });
  }
  return rows;
}

// ── Data layer ────────────────────────────────────────────────────────────────

interface RawSignalRow {
  style_id: number | string;
  style_name: string | null;
  brand_id: number | string;
  brand_name: string | null;
  tier: string | null;
  resale_median: number | string | null;
  price_count: number | string | null;
  live_count: number | string | null;
  rep_variant_id: number | string | null;
}

const VALID_TIERS: BrandTier[] = ["thrift", "mid", "premium", "ultra-luxury"];

/** Fetch raw per-style signals from the RPC. Resilient: [] on any missing env / error. */
async function loadStyleSignals(): Promise<StyleSignals[]> {
  try {
    const { data, error } = await getSupabase().rpc("style_index_signals");
    if (error || !Array.isArray(data)) return [];
    return (data as RawSignalRow[]).map((r) => {
      const tier = r.tier && VALID_TIERS.includes(r.tier as BrandTier) ? (r.tier as BrandTier) : null;
      const median = r.resale_median == null ? null : Number(r.resale_median);
      return {
        styleId: Number(r.style_id),
        styleName: r.style_name ?? "",
        brandId: Number(r.brand_id),
        brandName: r.brand_name ?? "",
        tier,
        resaleMedian: median != null && Number.isFinite(median) ? median : null,
        priceCount: Number(r.price_count ?? 0),
        liveCount: Number(r.live_count ?? 0),
        repVariantId: r.rep_variant_id == null ? null : Number(r.rep_variant_id),
      };
    });
  } catch {
    return [];
  }
}

/** The whole computed index, cached hourly (the underlying signals move slowly). */
export const getLcIndex = unstable_cache(
  async (): Promise<LcIndexData> => computeLcIndex(await loadStyleSignals()),
  ["lc-index"],
  { revalidate: 3600 },
);

/** One style's standing, or null when the style is unranked / unknown. */
export async function getStyleStanding(styleId: number): Promise<Standing | null> {
  const data = await getLcIndex();
  return data.ranked.find((r) => r.styleId === styleId) ?? null;
}

/** The self-contained view model the StandingCard renders. */
export interface StandingView extends Standing {
  boards: {
    price: StandingBoardRow[];
    trade: StandingBoardRow[];
    scarcity: StandingBoardRow[];
  };
}

/** Assemble a style's full StandingCard view (standing + the three neighbor boards). */
export async function getStyleStandingView(styleId: number): Promise<StandingView | null> {
  const data = await getLcIndex();
  const standing = data.ranked.find((r) => r.styleId === styleId);
  if (!standing) return null;
  return {
    ...standing,
    boards: {
      price: boardAround(data, "price", styleId),
      trade: boardAround(data, "trade", styleId),
      scarcity: boardAround(data, "scarcity", styleId),
    },
  };
}
