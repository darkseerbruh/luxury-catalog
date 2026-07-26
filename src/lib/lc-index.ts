/**
 * The LC Index — where a bag stands in the market.
 *
 * One blended score per style, built from three measured signals: price standing,
 * trade volume, and scarcity. House tier is NOT an input (it is itself resale-
 * derived, so it would double-count); the house's own standing is a separate index.
 * See docs/ux/lc-index-spec.md.
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
import { fetchAllRows, getSupabase } from "./supabase";

// Legacy string tiers + the numbered House Standing tiers ("1" highest → "5").
// Both are tolerated through the rollout; see docs/ux/tier-formula-spec.md.
export type BrandTier =
  | "thrift" | "mid" | "premium" | "ultra-luxury"
  | "1" | "2" | "3" | "4" | "5";

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
  /** Distinct resale platforms the style has been seen on = evidence independence. */
  sourceCount: number;
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
  /** This style's rank in the most recent prior-month snapshot, if any. */
  previousRank?: number | null;
}

/** The movement pill: how a rank changed since last month. Null = no prior data. */
export interface RankMovement {
  dir: "up" | "down" | "flat";
  /** Positive magnitude of the change (0 when flat). */
  delta: number;
  label: string;
}

/**
 * PURE: describe a rank's month-over-month movement. A smaller rank is better, so
 * a drop in rank number is an "up" move. Returns null when there is no prior rank,
 * so the pill never invents motion on a style we have not tracked across a month.
 */
export function movementLabel(rank: number, previousRank: number | null | undefined): RankMovement | null {
  if (previousRank == null) return null;
  const delta = previousRank - rank;
  if (delta > 0) return { dir: "up", delta, label: `Up ${delta} this month` };
  if (delta < 0) return { dir: "down", delta: -delta, label: `Down ${-delta} this month` };
  return { dir: "flat", delta: 0, label: "Steady" };
}

// Three measured signals, no house-tier input. Tier (House Standing) is itself
// resale-derived now (median + ceiling + volume), so feeding it back in would
// double-count price/trade the index already holds. The LC Index ranks the BAG;
// House Standing ranks the HOUSE; the two indices stay independent and are shown
// side by side. Old weights (price .40 / trade .25 / scarcity .20 / tier .15) are
// renormalised proportionally over the surviving three. See docs/ux/lc-index-spec.md.
export const LC_INDEX_WEIGHTS = {
  price: 0.47,
  trade: 0.29,
  scarcity: 0.24,
} as const;

/**
 * A style needs at least this many recorded prices (distinct listings, after the
 * v2 RPC dedupes re-observations) to earn a rank. Set from the real distribution
 * (scripts/diagnose-lc-index.ts, 2026-07-08): the deduped per-style count has a
 * median of ~14, and the contaminated thin styles that ranked too high sat at 15
 * (Kelly Pochette). 20 clears them with margin while keeping ~220 legitimate
 * styles ranked. This is the "demand first" gate: a style proves real market
 * activity before scarcity is even measured among the survivors.
 */
export const LC_INDEX_MIN_N = 20;

/**
 * A style must have been seen on at least this many distinct resale platforms to
 * earn a rank. A market STANDING built on one merchant is that merchant's asking
 * price, not the market's. Added 2026-07-08 after the owner flagged single-source
 * styles (Coco Base Shopping Bag, Souplissimo Maxi Flap: ~33-42 listings, all
 * Fashionphile) ranking too high. Independence, not just quantity: the demand-first
 * gate now also requires the demand to have been seen by more than one market.
 */
export const LC_INDEX_MIN_SOURCES = 2;

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

/**
 * A short, plain-words caption for the why-meter: one line naming what actually
 * distinguishes THIS bag, keyed off its standout signal(s), its comparative
 * position, and its house. A market fact, never a verdict, and honest at both
 * ends (a widely-available bag is told it is easy to find).
 *
 * Deterministic: the same inputs always produce the same line, so ranks are
 * stable across renders. Differentiated: the line is composed from the bag's
 * band profile rather than three canned strings, and where two bags share an
 * identical profile a rank-parity variant keeps adjacent rows from reading the
 * same. Constraints (owner voice): no em dashes, no verdict words ("best",
 * "worth it"), no unbacked value-retention claims, as short as it can be.
 *
 * Percentiles are within the ranked set, so "priced with the grails" means
 * against the other ranked bags, not the whole world.
 */
export function whyNote(
  s: Pick<Standing, "rank" | "brandName" | "pricePct" | "tradePct" | "scarcityPct">,
): string {
  const { rank, brandName, pricePct, tradePct, scarcityPct } = s;

  // #1 is the benchmark the rest of the index is read against. Scarcity-honest:
  // the top bag can be the most-listed of all, so we claim price + volume only.
  if (rank === 1) return "The benchmark. Nothing we rank prices higher, and it trades in real volume.";

  const priceTop = pricePct >= 90; // grail-tier pricing language allowed only here
  const priceHi = pricePct >= 70;
  const priceMid = pricePct >= 40;
  const tradeHeavy = tradePct >= 85;
  const tradeActive = tradePct >= 55;
  const tradeQuiet = tradePct < 30;
  const scarce = scarcityPct >= 75;
  const open = scarcityPct <= 25;
  // Deterministic lexical variety. Adjacent ranks always differ in parity, so
  // giving every branch a base + alt phrasing guarantees two bags with an
  // identical profile never read the same when they sit next to each other.
  const alt = rank != null && rank % 2 === 0;

  // Most distinctive trait leads. Scarcity is only ever claimed when the bag
  // really is seldom-listed (high scarcity percentile), never for a top seller.
  // "Grail pricing" is reserved for priceTop; a merely-expensive bag is not called a grail.
  if (scarce && priceTop)
    return alt
      ? "Seldom surfaces, and priced with the grails when it does."
      : "Grail-level pricing on a bag that rarely comes up for sale.";
  if (priceTop && tradeHeavy)
    return alt
      ? "Grail pricing at real trading volume."
      : `${brandName}'s blue chip: grail pricing at real volume.`;
  if (tradeHeavy)
    return alt
      ? "The liquid one. Changes hands more than almost anything here."
      : "Trades constantly, one of the easiest names here to buy or sell.";
  if (scarce)
    return alt ? "Hard to find listed right now." : "Rarely surfaces on the market.";
  if (priceTop)
    return alt
      ? "Among the highest medians we rank."
      : "Sits near the top of the index on price.";
  if (priceHi && tradeQuiet)
    return alt
      ? "Expensive, and it seldom comes up."
      : "Among the pricier names, and rarely listed.";
  if (priceHi)
    return alt ? "Priced above most of the index." : "One of the pricier names we rank.";
  if (priceMid && tradeActive)
    return alt ? "Mid-market pricing at steady volume." : "A steady mid-market trader.";
  if (open && tradeQuiet) return alt ? "Easy to find, and priced to match." : "Common on the market, and priced softly.";
  if (open) return alt ? "Widely available today." : "Easy to come by right now.";
  if (priceMid) return alt ? "Holds a mid-market price." : "Sits mid-pack on price.";
  return alt ? "An accessible entry into the index." : "One of the softer prices we rank.";
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
 * A style is ranked only if it has a resale median, at least LC_INDEX_MIN_N
 * recorded prices, AND at least LC_INDEX_MIN_SOURCES distinct platforms (so its
 * standing is not one merchant's asking price). Percentiles are computed WITHIN
 * the ranked set so the three signals share one 0–100 scale before the weighted blend.
 */
export function computeLcIndex(signals: StyleSignals[]): LcIndexData {
  const names: Record<number, { styleName: string; brandName: string }> = {};
  for (const s of signals) names[s.styleId] = { styleName: s.styleName, brandName: s.brandName };

  const isEligible = (s: StyleSignals) =>
    s.resaleMedian != null && s.priceCount >= LC_INDEX_MIN_N && s.sourceCount >= LC_INDEX_MIN_SOURCES;
  const eligible = signals.filter(isEligible);
  const unrankedStyleIds = signals.filter((s) => !isEligible(s)).map((s) => s.styleId);

  const medians = eligible.map((s) => s.resaleMedian as number);
  const trades = eligible.map((s) => s.priceCount);
  const lives = eligible.map((s) => s.liveCount);

  const scored = eligible.map((s) => {
    const pricePct = percentileOf(s.resaleMedian as number, medians);
    const tradePct = percentileOf(s.priceCount, trades);
    // Fewer live listings → scarcer → higher. Invert the live-count percentile.
    const scarcityPct = 100 - percentileOf(s.liveCount, lives);

    const score =
      LC_INDEX_WEIGHTS.price * pricePct +
      LC_INDEX_WEIGHTS.trade * tradePct +
      LC_INDEX_WEIGHTS.scarcity * scarcityPct;

    // Lead = the bar with the biggest weighted contribution.
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
  source_count?: number | string | null;
  rep_variant_id: number | string | null;
}

const VALID_TIERS: BrandTier[] = ["thrift", "mid", "premium", "ultra-luxury", "1", "2", "3", "4", "5"];

/**
 * Fetch raw per-style signals from the RPC. Resilient: [] on any missing env / error.
 *
 * PAGED. Every PostgREST response caps at 1000 rows, and a bare .rpc() takes that cap
 * silently — the board would just stop at style 1000 with no error. 928 styles priced as
 * of 2026-07-26, so this was about to start truncating.
 */
async function loadStyleSignals(): Promise<StyleSignals[]> {
  try {
    const data = await fetchAllRows<RawSignalRow>(() => getSupabase().rpc("style_index_signals"));
    return data.map((r) => {
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
        // Missing on the pre-0051 RPC: default to the minimum so the source gate is a
        // no-op until the migration lands (floor-only behaviour), never unranks everything.
        sourceCount: r.source_count == null ? LC_INDEX_MIN_SOURCES : Number(r.source_count),
        repVariantId: r.rep_variant_id == null ? null : Number(r.rep_variant_id),
      };
    });
  } catch {
    return [];
  }
}

/** First day of the current month, as an ISO date string (YYYY-MM-01). */
export function currentMonthStart(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/**
 * Prior-month rank per style, from the most recent snapshot strictly BEFORE this
 * month. Powers the movement pill. Resilient: {} when the table is absent (pre-0049)
 * or empty, so no pill renders.
 */
async function loadPreviousRanks(): Promise<Record<number, number>> {
  try {
    const supa = getSupabase();
    const before = currentMonthStart();
    const { data: latest, error: mErr } = await supa
      .from("lc_index_snapshot")
      .select("captured_month")
      .lt("captured_month", before)
      .order("captured_month", { ascending: false })
      .limit(1);
    if (mErr || !Array.isArray(latest) || latest.length === 0) return {};
    const month = (latest[0] as { captured_month: string }).captured_month;
    const { data, error } = await supa
      .from("lc_index_snapshot")
      .select("style_id, rank")
      .eq("captured_month", month);
    if (error || !Array.isArray(data)) return {};
    const out: Record<number, number> = {};
    for (const r of data as { style_id: number | string; rank: number | string }[]) {
      out[Number(r.style_id)] = Number(r.rank);
    }
    return out;
  } catch {
    return {};
  }
}

/** The whole computed index, cached hourly (the underlying signals move slowly). */
export const getLcIndex = unstable_cache(
  async (): Promise<LcIndexData> => {
    const [signals, previous] = await Promise.all([loadStyleSignals(), loadPreviousRanks()]);
    const data = computeLcIndex(signals);
    if (Object.keys(previous).length > 0) {
      for (const r of data.ranked) {
        const prev = previous[r.styleId];
        if (prev != null) r.previousRank = prev;
      }
    }
    return data;
  },
  ["lc-index"],
  { revalidate: 3600 },
);

/** One style's standing, or null when the style is unranked / unknown. */
export async function getStyleStanding(styleId: number): Promise<Standing | null> {
  const data = await getLcIndex();
  return data.ranked.find((r) => r.styleId === styleId) ?? null;
}

/** Bulk styleId → rank lookup for card surfaces (Concept C, the inline rank link). */
export async function getStyleRanks(styleIds: number[]): Promise<Record<number, number>> {
  if (styleIds.length === 0) return {};
  const data = await getLcIndex();
  const want = new Set(styleIds);
  const out: Record<number, number> = {};
  for (const r of data.ranked) {
    if (r.rank != null && want.has(r.styleId)) out[r.styleId] = r.rank;
  }
  return out;
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
