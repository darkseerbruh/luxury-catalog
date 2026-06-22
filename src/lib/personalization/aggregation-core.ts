/**
 * Pure (no-DB) aggregation logic for the Phase-1 personalization feature store.
 * Mirrors the SQL `rebuild_user_profile` function so both stay in sync.
 * No imports from server-only modules — fully unit-testable.
 */

import type {
  AffinityEntry,
  AttributeAffinities,
  BudgetBand,
  ClosetSignal,
  PersonaIntent,
  RawUserSignals,
  SignalCounts,
  WatchlistSignal,
} from "./types";

// ── Decay weights (days since created_at) ────────────────────────────────────
const STATUS_WEIGHT: Record<string, number> = {
  have: 3.0,
  want: 1.5,
  had: 1.0,
};

const WATCHLIST_WEIGHT = 1.5;

export function decayWeight(daysSince: number): number {
  if (daysSince <= 7) return 1.0;
  if (daysSince <= 30) return 0.8;
  if (daysSince <= 90) return 0.6;
  if (daysSince <= 365) return 0.4;
  return 0.2;
}

export function daysAgo(isoString: string): number {
  const ms = Date.now() - new Date(isoString).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Weight for a single closet item at the given age. */
export function itemWeight(status: string, createdAt: string): number {
  const sw = STATUS_WEIGHT[status] ?? 0;
  const dw = decayWeight(daysAgo(createdAt));
  return sw * dw;
}

// ── Budget band ───────────────────────────────────────────────────────────────

function binPrice(price: number): "entry" | "mid" | "grail" {
  if (price < 1500) return "entry";
  if (price <= 5000) return "mid";
  return "grail";
}

/**
 * Infer a budget band from weighted price signals.
 * Returns null when there are no price signals (cold-start).
 */
export function inferBudgetBand(
  closetItems: ClosetSignal[],
  watchlistItems: WatchlistSignal[]
): BudgetBand | null {
  const weights: Record<"entry" | "mid" | "grail", number> = { entry: 0, mid: 0, grail: 0 };
  let total = 0;

  for (const item of closetItems) {
    const price = item.purchasePrice ?? item.retailPrice;
    if (price == null) continue;
    const w = itemWeight(item.status, item.createdAt);
    const bin = binPrice(Number(price));
    weights[bin] += w;
    total += w;
  }

  for (const w of watchlistItems) {
    if (w.targetPrice == null) continue;
    const bin = binPrice(Number(w.targetPrice));
    const ww = WATCHLIST_WEIGHT * decayWeight(daysAgo(w.createdAt));
    weights[bin] += ww;
    total += ww;
  }

  if (total === 0) return null;

  const entryShare = weights.entry / total;
  const midShare = weights.mid / total;
  const grailShare = weights.grail / total;

  if (entryShare >= 0.6) return "entry";
  if (midShare >= 0.6) return "mid";
  if (grailShare >= 0.6) return "grail";
  return "mixed";
}

// ── Intent ────────────────────────────────────────────────────────────────────

/** Infer lifecycle intent from closet-status counts. */
export function inferIntent(counts: {
  want: number;
  have: number;
  had: number;
  watchlist: number;
}): PersonaIntent {
  const { want, have, had, watchlist } = counts;
  if (want > 0 && had > 0) return "both";
  if (want >= 3 || (want > 0 && watchlist >= 2)) return "buying";
  if (had >= 2) return "selling";
  if (have >= 5) return "collecting";
  return "browsing";
}

// ── Brand affinities ──────────────────────────────────────────────────────────

/**
 * Compute brand → weighted-score map from closet and watchlist signals.
 */
export function computeBrandAffinities(
  closetItems: ClosetSignal[],
  watchlistItems: WatchlistSignal[]
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const item of closetItems) {
    if (!item.brandName) continue;
    const w = itemWeight(item.status, item.createdAt);
    scores[item.brandName] = (scores[item.brandName] ?? 0) + w;
  }

  for (const w of watchlistItems) {
    if (!w.brandName) continue;
    const ww = WATCHLIST_WEIGHT * decayWeight(daysAgo(w.createdAt));
    scores[w.brandName] = (scores[w.brandName] ?? 0) + ww;
  }

  // Round to 3 dp.
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
  );
}

/**
 * Return top-N brand affinities sorted by score descending.
 */
export function topAffinities(
  brandScores: Record<string, number>,
  n = 10
): AffinityEntry[] {
  return Object.entries(brandScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, score]) => ({ name, score }));
}

// ── Attribute affinities ──────────────────────────────────────────────────────

/** Accumulate one attribute value into the map. */
function accAttr(
  map: Record<string, Record<string, number>>,
  dim: string,
  value: string | null | undefined,
  w: number
): void {
  if (!value) return;
  const v = value.toLowerCase().trim();
  if (!v) return;
  (map[dim] ??= {})[v] = ((map[dim] ??= {})[v] ?? 0) + w;
}

/**
 * Compute attribute affinities from closet items.
 * Dimensions: silhouette, size, hardware, material.
 * (carry and formality are available from the taste_vector_snapshot.)
 */
export function computeAttributeAffinities(
  closetItems: ClosetSignal[]
): AttributeAffinities {
  const map: Record<string, Record<string, number>> = {};

  for (const item of closetItems) {
    const w = itemWeight(item.status, item.createdAt);
    accAttr(map, "silhouette", item.silhouette, w);
    accAttr(map, "size", item.sizeCategory, w);
    accAttr(map, "hardware", item.hardwareColor, w);
    accAttr(map, "material", item.materialType, w);
  }

  // Round all scores.
  for (const dim of Object.keys(map)) {
    for (const val of Object.keys(map[dim])) {
      map[dim][val] = Math.round(map[dim][val] * 1000) / 1000;
    }
  }

  return map;
}

// ── Signal counts ─────────────────────────────────────────────────────────────

export function computeSignalCounts(signals: RawUserSignals): SignalCounts {
  const want = signals.closetItems.filter((i) => i.status === "want").length;
  const have = signals.closetItems.filter((i) => i.status === "have").length;
  const had = signals.closetItems.filter((i) => i.status === "had").length;
  return {
    want_count: want,
    have_count: have,
    had_count: had,
    watchlist_count: signals.watchlistItems.length,
    review_count: signals.reviewCount,
    quiz_completeness: signals.tasteCompleteness,
    total_interactions: want + have + had + signals.watchlistItems.length,
  };
}

// ── Top-level aggregation ────────────────────────────────────────────────────

export interface AggregatedProfile {
  persona: string | null;
  budgetBand: BudgetBand | null;
  intent: PersonaIntent;
  topAffinities: AffinityEntry[];
  brandAffinities: Record<string, number>;
  attributeAffinities: AttributeAffinities;
  signalCounts: SignalCounts;
  tasteVectorSnapshot: Record<string, Record<string, number>> | null;
}

/** Aggregate all signals into a profile row. Pure, no DB. */
export function aggregateSignals(signals: RawUserSignals): AggregatedProfile {
  const counts = computeSignalCounts(signals);
  const brandAff = computeBrandAffinities(signals.closetItems, signals.watchlistItems);

  return {
    persona: signals.persona,
    budgetBand: inferBudgetBand(signals.closetItems, signals.watchlistItems),
    intent: inferIntent({
      want: counts.want_count,
      have: counts.have_count,
      had: counts.had_count,
      watchlist: counts.watchlist_count,
    }),
    topAffinities: topAffinities(brandAff),
    brandAffinities: brandAff,
    attributeAffinities: computeAttributeAffinities(signals.closetItems),
    signalCounts: counts,
    tasteVectorSnapshot: signals.tasteVectorSnapshot,
  };
}
