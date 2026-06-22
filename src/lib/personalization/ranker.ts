/**
 * Phase-2 personalization ranker — pure functions, no DB imports.
 *
 * Pipeline (applied in order):
 *  1. affinityScore   — brand + attribute overlap with the Phase-1 profile
 *  2. bayesianPrior   — shrink toward popularity to handle cold-start
 *  3. combineScores   — weighted blend (affinity 70 / popularity 30)
 *  4. epsilonGreedy   — replace ε of the top-N slots with exploration items
 *  5. mmrRerank       — diversity re-rank via Maximal Marginal Relevance
 *
 * Nothing invented — only real catalogued attributes are scored.
 */

import type { PersonalizationProfile } from "./types";
import type { VariantRow } from "@/lib/recommendations-core";

// ── Attribute extraction helpers ──────────────────────────────────────────────

function one<T>(v: T | T[] | null | undefined): T | null {
  return (Array.isArray(v) ? v[0] : v) ?? null;
}

export function getBrandName(row: VariantRow): string | null {
  const style = one(row.style);
  if (!style) return null;
  const brand = one(style.brand);
  return brand?.name ?? null;
}

function getSilhouette(row: VariantRow): string | null {
  return one(row.style)?.silhouette?.toLowerCase() ?? null;
}

function getMaterial(row: VariantRow): string | null {
  const mat = one(row.exterior_material);
  return mat?.material_type?.toLowerCase() ?? null;
}

// ── 1. Affinity scoring ───────────────────────────────────────────────────────

// Per-attribute contribution weights (must sum to ~1.0).
const BRAND_W      = 0.40;
const SILHOUETTE_W = 0.25;
const MATERIAL_W   = 0.15;
const HARDWARE_W   = 0.12;
const SIZE_W       = 0.08;

/**
 * Score one variant against the user's Phase-1 personalization profile.
 * Returns a raw affinity score ≥ 0; higher = better match.
 * Returns 0 for cold-start (no profile or empty affinities).
 */
export function affinityScore(
  profile: PersonalizationProfile | null,
  row: VariantRow
): number {
  if (!profile) return 0;
  const ba = profile.brandAffinities;
  const aa = profile.attributeAffinities;
  if (Object.keys(ba).length === 0 && Object.keys(aa).length === 0) return 0;

  let score = 0;

  const brand = getBrandName(row);
  if (brand && ba[brand]) score += ba[brand] * BRAND_W;

  const sil = getSilhouette(row);
  if (sil && aa.silhouette?.[sil]) score += aa.silhouette[sil] * SILHOUETTE_W;

  const mat = getMaterial(row);
  if (mat && aa.material?.[mat]) score += aa.material[mat] * MATERIAL_W;

  const hw = row.hardware_color?.toLowerCase();
  if (hw && aa.hardware?.[hw]) score += aa.hardware[hw] * HARDWARE_W;

  const sz = row.size_category?.toLowerCase();
  if (sz && aa.size?.[sz]) score += aa.size[sz] * SIZE_W;

  return score;
}

// ── 2. Bayesian popularity prior ──────────────────────────────────────────────

/**
 * Bayesian-shrunk popularity score.
 *
 * Shrinks the raw count toward zero (the prior) with pseudocount k.
 * Prevents items with 0 saves from ranking identically to items with 1–2 saves
 * (and avoids over-penalising new items in a small catalog).
 *
 * shrunk = count / (count + k)
 *
 * With k=10: an item with 0 saves → 0; 5 saves → 0.33; 50 saves → 0.83.
 */
export function bayesianPopularityScore(count: number, k = 10): number {
  return count / (count + k);
}

// ── 3. Combined score ─────────────────────────────────────────────────────────

const AFFINITY_MIX  = 0.70;
const POPULARITY_MIX = 0.30;

/**
 * Blend affinity and popularity.
 * When the user has no profile signal, affinity = 0 and the score reduces to
 * the popularity prior alone (clean cold-start).
 *
 * Affinity scores can be arbitrarily large (sum of weighted closet counts);
 * normalize against maxAffinity so they're comparable to the 0–1 popularity score.
 */
export function combineScores(
  rawAffinity: number,
  maxAffinity: number,
  popularityScore: number
): number {
  const normAff = maxAffinity > 0 ? rawAffinity / maxAffinity : 0;
  return AFFINITY_MIX * normAff + POPULARITY_MIX * popularityScore;
}

// ── 4. Epsilon-greedy exploration ─────────────────────────────────────────────

export interface ScoredVariant {
  variantId: number;
  row: VariantRow;
  score: number;
  why: string;
  algo: "affinity" | "popularity" | "explore";
}

/**
 * Replace floor(n * ε) slots in the top-N with random unchosen items.
 * Ensures the catalog stays partially explorable even when one brand
 * dominates the user's affinity scores.
 *
 * ε = 0.1 → 1 explore slot in every 10 recs (trivial, low disruption).
 */
export function epsilonGreedy(
  ranked: ScoredVariant[],
  remaining: ScoredVariant[],
  n: number,
  epsilon = 0.1,
  rand = Math.random
): ScoredVariant[] {
  const exploreCount = Math.floor(n * epsilon);
  if (exploreCount === 0 || remaining.length === 0) return ranked.slice(0, n);

  const top = ranked.slice(0, n - exploreCount);

  // Shuffle remaining and take the first exploreCount.
  const pool = [...remaining];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const explores = pool.slice(0, exploreCount).map((sv) => ({
    ...sv,
    algo: "explore" as const,
    why: "Something a little different",
  }));

  return [...top, ...explores];
}

// ── 5. MMR diversity re-rank ──────────────────────────────────────────────────

/**
 * Attribute-overlap similarity between two variants (0..1).
 * Shared brand is weighted most; silhouette and material also contribute.
 */
export function variantSimilarity(a: VariantRow, b: VariantRow): number {
  let overlap = 0;
  let total = 0;

  const brandA = getBrandName(a);
  const brandB = getBrandName(b);
  // Brand match is strongest similarity signal.
  total += 3;
  if (brandA && brandA === brandB) overlap += 3;

  total += 1;
  if (getSilhouette(a) && getSilhouette(a) === getSilhouette(b)) overlap += 1;

  total += 1;
  if (getMaterial(a) && getMaterial(a) === getMaterial(b)) overlap += 1;

  return overlap / total;
}

/**
 * Maximal Marginal Relevance re-rank.
 *
 * Greedy: at each step pick the candidate that maximises:
 *   MMR(i) = λ * score(i) - (1-λ) * max_{j ∈ S} similarity(i, j)
 *
 * λ=0.7 → 70% relevance, 30% diversity. Prevents one dominant brand from
 * filling all slots when the user's affinity is brand-concentrated.
 */
export function mmrRerank(
  candidates: ScoredVariant[],
  n: number,
  lambda = 0.7
): ScoredVariant[] {
  if (candidates.length === 0) return [];
  if (candidates.length <= n) return candidates;

  const selected: ScoredVariant[] = [];
  const pool = [...candidates];

  while (selected.length < n && pool.length > 0) {
    let bestIdx = 0;
    let bestMMR = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const relevance = pool[i].score;
      const maxSim =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((s) => variantSimilarity(pool[i].row, s.row)));
      const mmr = lambda * relevance - (1 - lambda) * maxSim;
      if (mmr > bestMMR) {
        bestMMR = mmr;
        bestIdx = i;
      }
    }

    selected.push(pool[bestIdx]);
    pool.splice(bestIdx, 1);
  }

  return selected;
}

// ── "Why" string ──────────────────────────────────────────────────────────────

/**
 * Build a short human-readable reason string grounded in real attributes.
 * Picks the single strongest affinity signal to surface.
 */
export function buildWhyPhase2(
  profile: PersonalizationProfile | null,
  row: VariantRow
): string {
  if (!profile) return "";
  const ba = profile.brandAffinities;
  const aa = profile.attributeAffinities;

  const brand = getBrandName(row);
  if (brand && ba[brand] && ba[brand] >= 1.5) return `Because you love ${brand}`;

  const sil = getSilhouette(row);
  if (sil && aa.silhouette?.[sil] && aa.silhouette[sil] >= 1.5)
    return `Matches your taste for ${sil} bags`;

  const mat = getMaterial(row);
  if (mat && aa.material?.[mat] && aa.material[mat] >= 1.5) return `You tend toward ${mat}`;

  const hw = row.hardware_color?.toLowerCase();
  if (hw && aa.hardware?.[hw] && aa.hardware[hw] >= 1.5) return `${hw} hardware is your pick`;

  return "";
}

// ── Full pipeline ─────────────────────────────────────────────────────────────

/**
 * Run the full Phase-2 ranking pipeline.
 *
 * @param profile   Phase-1 personalization profile (null = cold-start)
 * @param rows      All candidate variants (pre-filtered: exclude already in closet/watch)
 * @param popularity Map of variantId → save count (closet want+have across all users)
 * @param n         Number of recs to return
 */
export function rankVariants(
  profile: PersonalizationProfile | null,
  rows: VariantRow[],
  popularity: Map<number, number>,
  n = 20
): ScoredVariant[] {
  if (rows.length === 0) return [];

  // 1. Raw affinity scores.
  const rawScores = rows.map((row) => ({
    row,
    rawAffinity: affinityScore(profile, row),
    popularityScore: bayesianPopularityScore(popularity.get(row.variant_id) ?? 0),
  }));

  const maxAffinity = Math.max(...rawScores.map((r) => r.rawAffinity), 0);

  // 2. Combine into final score.
  const scored: ScoredVariant[] = rawScores.map(({ row, rawAffinity, popularityScore }) => {
    const score = combineScores(rawAffinity, maxAffinity, popularityScore);
    const hasAffinity = rawAffinity > 0;
    return {
      variantId: row.variant_id,
      row,
      score,
      why: buildWhyPhase2(profile, row),
      algo: hasAffinity ? "affinity" : ("popularity" as const),
    };
  });

  // 3. Sort by combined score descending.
  scored.sort((a, b) => b.score - a.score);

  // 4. Epsilon-greedy exploration (ε=0.1).
  const topN = Math.min(n, scored.length);
  const top = scored.slice(0, topN);
  const rest = scored.slice(topN);
  const withExplore = epsilonGreedy(top, rest, topN);

  // 5. MMR diversity re-rank.
  return mmrRerank(withExplore, n);
}
