import { getSupabase } from "./supabase";
import { getUserTaste, foldVariantIntoVector, VARIANT_ATTR_SELECT } from "./taste-data";
import {
  type TasteVector,
  type TasteDimension,
  topValue,
} from "./taste";

/**
 * Content-based "Bags you might like" (build-order #4).
 *
 * Each variant is represented as an attribute vector (its catalogued silhouette,
 * size, hardware, material, brand, price band, carry methods). The user is a
 * taste vector (quiz + closet + watchlist, from getUserTaste). We score each
 * candidate by weighted overlap and return a ranked list with a deterministic,
 * human-readable "why" string.
 *
 * NON-NEGOTIABLE: only real catalogued attributes are ever used. No fabricated
 * attributes. When the user has no taste signal, we return a graceful empty
 * result (callers show a "take the quiz" stub).
 */

export interface Recommendation {
  variantId: number;
  brandName: string;
  styleName: string;
  label: string;
  hardwareColor: string | null;
  retailPrice: number | null;
  currency: string | null;
  score: number;
  /** e.g. "because you like top-handle + gold hardware". Empty if no overlap. */
  why: string;
}

type VariantRow = {
  variant_id: number;
  size_category: string | null;
  hardware_color: string | null;
  exterior_colorway: string | null;
  size_label: string | null;
  retail_price_original: number | null;
  currency: string | null;
  style: { name: string; silhouette: string | null; brand: { name: string } | { name: string }[] | null } | { name: string; silhouette: string | null; brand: { name: string } | { name: string }[] | null }[] | null;
  exterior_material: { material_type: string | null } | { material_type: string | null }[] | null;
  carry_method: { carry_type: string; possible: string }[] | null;
};

// Per-dimension importance when scoring overlap. Reflects how strongly each
// catalogued attribute signals taste.
const DIM_WEIGHT: Record<TasteDimension, number> = {
  silhouette: 1.4,
  carry: 1.3,
  hardware: 1.2,
  material: 1.1,
  brand: 1.0,
  size: 0.9,
  price_band: 0.8,
  formality: 0.7,
};

// Human phrasing for the strongest matched dimensions.
const WHY_PHRASE: Partial<Record<TasteDimension, (v: string) => string>> = {
  silhouette: (v) => `${v} shapes`,
  carry: (v) => `${v} carry`,
  hardware: (v) => `${v} hardware`,
  material: (v) => v,
  brand: (v) => v,
  size: (v) => `${v} sizes`,
  price_band: (v) => (v === "grail" ? "grail pieces" : v === "entry" ? "attainable picks" : "mid-range pieces"),
};

/** Normalized weight of a value within its dimension (0..1). */
function normalizedWeight(vec: TasteVector, dim: TasteDimension, value: string): number {
  const bucket = vec[dim];
  if (!bucket) return 0;
  const total = Object.values(bucket).reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return (bucket[value.toLowerCase()] ?? 0) / total;
}

interface Scored {
  row: VariantRow;
  score: number;
  matches: { dim: TasteDimension; value: string; contribution: number }[];
}

/** Score one candidate variant against the user's taste vector. */
function scoreVariant(userVec: TasteVector, row: VariantRow): Scored {
  // Build the candidate's own single-attribute vector, then measure overlap.
  const candVec: TasteVector = {};
  foldVariantIntoVector(candVec, {
    variant_id: row.variant_id,
    size_category: row.size_category,
    hardware_color: row.hardware_color,
    style: row.style,
    exterior_material: row.exterior_material,
    retail_price_original: row.retail_price_original,
    carry_method: row.carry_method,
  }, 1);

  let score = 0;
  const matches: Scored["matches"] = [];
  for (const dimKey of Object.keys(candVec) as TasteDimension[]) {
    const candBucket = candVec[dimKey];
    if (!candBucket) continue;
    for (const value of Object.keys(candBucket)) {
      const uw = normalizedWeight(userVec, dimKey, value);
      if (uw <= 0) continue;
      const contribution = uw * (DIM_WEIGHT[dimKey] ?? 1);
      score += contribution;
      matches.push({ dim: dimKey, value, contribution });
    }
  }
  return { row, score, matches };
}

function buildWhy(matches: Scored["matches"], prefix: string): string {
  const top = [...matches].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
  const phrases = top
    .map((m) => WHY_PHRASE[m.dim]?.(m.value))
    .filter((p): p is string => Boolean(p));
  if (phrases.length === 0) return "";
  return `${prefix} ${phrases.join(" + ")}`;
}

function rowToRec(s: Scored, whyPrefix = "Because you like"): Recommendation {
  const row = s.row;
  const style = (Array.isArray(row.style) ? row.style[0] : row.style) ?? null;
  const brand = style ? (Array.isArray(style.brand) ? style.brand[0] : style.brand) : null;
  const label = [row.size_label, row.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
  return {
    variantId: row.variant_id,
    brandName: brand?.name ?? "",
    styleName: style?.name ?? "",
    label,
    hardwareColor: row.hardware_color,
    retailPrice: row.retail_price_original != null ? Number(row.retail_price_original) : null,
    currency: row.currency,
    score: s.score,
    why: buildWhy(s.matches, whyPrefix),
  };
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  /** False when the user has no taste signal yet — callers show the quiz stub. */
  hasTaste: boolean;
}

const SELECT = `${VARIANT_ATTR_SELECT}, exterior_colorway, size_label, currency`;

/**
 * Ranked recommendations for the current user. Excludes bags already in their
 * closet/watchlist. Returns hasTaste:false (and []) when there's no signal yet.
 */
export async function getRecommendations(limit = 8): Promise<RecommendationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { recommendations: [], hasTaste: false };

  const taste = await getUserTaste();
  // Cold start: no signal at all -> graceful empty (caller prompts the quiz).
  if (Object.keys(taste.vector).length === 0) {
    return { recommendations: [], hasTaste: false };
  }

  const { data, error } = await getSupabase()
    .from("variant")
    .select(SELECT)
    .limit(500);
  if (error || !data) return { recommendations: [], hasTaste: true };

  const seen = new Set(taste.seenVariantIds);
  const scored = (data as VariantRow[])
    .filter((r) => !seen.has(r.variant_id))
    .map((r) => scoreVariant(taste.vector, r))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => rowToRec(s));

  return { recommendations: scored, hasTaste: true };
}

/**
 * "Similar bags" for a given bag, for the bag detail page. Content-based over
 * the bag's own catalogued attributes (works for logged-out visitors too).
 */
export async function getSimilarBags(variantId: number, limit = 6): Promise<Recommendation[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const { data: anchorData } = await getSupabase()
    .from("variant")
    .select(SELECT)
    .eq("variant_id", variantId)
    .maybeSingle();
  if (!anchorData) return [];

  // The anchor bag's attributes become the "taste" to match against.
  const anchorVec: TasteVector = {};
  foldVariantIntoVector(anchorVec, anchorData as VariantRow, 1);
  if (Object.keys(anchorVec).length === 0) return [];

  const { data, error } = await getSupabase().from("variant").select(SELECT).limit(500);
  if (error || !data) return [];

  return (data as VariantRow[])
    .filter((r) => r.variant_id !== variantId)
    .map((r) => scoreVariant(anchorVec, r))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => rowToRec(s, "Shares"));
}

/** A compact, presentational summary of the user's dominant taste, for headers. */
export function tasteHeadline(vec: TasteVector): string | null {
  const sil = topValue(vec, "silhouette");
  const hw = topValue(vec, "hardware");
  const parts = [sil, hw && `${hw} hardware`].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
