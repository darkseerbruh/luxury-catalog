import { foldVariantIntoVector } from "./taste-core";
import { type TasteVector, type TasteDimension } from "./taste";

/**
 * Pure (no-DB) core of the recommendation engine: candidate scoring, "why"
 * string generation, and row→Recommendation mapping. Kept separate from
 * recommendations.ts (which does the Supabase reads) so this logic is
 * unit-testable without importing server-only modules (next/headers etc.).
 *
 * NON-NEGOTIABLE: only real catalogued attributes are scored — nothing invented.
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
  /** e.g. "Because you like top-handle + gold hardware". Empty if no overlap. */
  why: string;
}

export type VariantRow = {
  variant_id: number;
  size_category: string | null;
  hardware_color: string | null;
  exterior_colorway: string | null;
  size_label: string | null;
  retail_price_original: number | null;
  currency: string | null;
  style:
    | { name: string; silhouette: string | null; brand: { name: string } | { name: string }[] | null }
    | { name: string; silhouette: string | null; brand: { name: string } | { name: string }[] | null }[]
    | null;
  exterior_material: { material_type: string | null } | { material_type: string | null }[] | null;
  carry_method: { carry_type: string; possible: string }[] | null;
};

// Per-dimension importance when scoring overlap. Reflects how strongly each
// catalogued attribute signals taste.
export const DIM_WEIGHT: Record<TasteDimension, number> = {
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
  price_band: (v) =>
    v === "grail" ? "grail pieces" : v === "entry" ? "attainable picks" : "mid-range pieces",
};

/** Normalized weight of a value within its dimension (0..1). */
export function normalizedWeight(vec: TasteVector, dim: TasteDimension, value: string): number {
  const bucket = vec[dim];
  if (!bucket) return 0;
  const total = Object.values(bucket).reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return (bucket[value.toLowerCase()] ?? 0) / total;
}

export interface Scored {
  row: VariantRow;
  score: number;
  matches: { dim: TasteDimension; value: string; contribution: number }[];
}

/** Score one candidate variant against the user's taste vector. */
export function scoreVariant(userVec: TasteVector, row: VariantRow): Scored {
  // Build the candidate's own single-attribute vector, then measure overlap.
  const candVec: TasteVector = {};
  foldVariantIntoVector(
    candVec,
    {
      variant_id: row.variant_id,
      size_category: row.size_category,
      hardware_color: row.hardware_color,
      style: row.style,
      exterior_material: row.exterior_material,
      retail_price_original: row.retail_price_original,
      carry_method: row.carry_method,
    },
    1
  );

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

export function buildWhy(matches: Scored["matches"], prefix: string): string {
  const top = [...matches].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
  const phrases = top
    .map((m) => WHY_PHRASE[m.dim]?.(m.value))
    .filter((p): p is string => Boolean(p));
  if (phrases.length === 0) return "";
  return `${prefix} ${phrases.join(" + ")}`;
}

export function rowToRec(s: Scored, whyPrefix = "Because you like"): Recommendation {
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
