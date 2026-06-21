import { type TasteVector, addWeight, priceBand } from "./taste";

/**
 * Pure (no-DB) taste-vector folding, shared by taste-data.ts (which adds the
 * Supabase reads) and recommendations-core.ts. Kept here so it can be unit-tested
 * and imported without pulling in server-only modules (next/headers etc.).
 *
 * Reads only catalogued attributes — silhouette, size_category, hardware_color,
 * material_type, brand name, retail price band, carry types. Nothing invented.
 */

export type VariantAttrs = {
  variant_id: number;
  size_category: string | null;
  hardware_color: string | null;
  style:
    | { silhouette: string | null; brand: { name: string } | { name: string }[] | null; name: string }
    | { silhouette: string | null; brand: { name: string } | { name: string }[] | null; name: string }[]
    | null;
  exterior_material: { material_type: string | null } | { material_type: string | null }[] | null;
  retail_price_original: number | null;
  carry_method: { carry_type: string; possible: string }[] | null;
};

export const VARIANT_ATTR_SELECT =
  "variant_id, size_category, hardware_color, retail_price_original, style:style_id(name, silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(material_type), carry_method(carry_type, possible)";

/** Fold one variant's catalogued attributes into a taste vector (mutating). */
export function foldVariantIntoVector(vec: TasteVector, v: VariantAttrs, weight = 1): void {
  const style = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
  const brand = style ? (Array.isArray(style.brand) ? style.brand[0] : style.brand) : null;
  const material = (Array.isArray(v.exterior_material) ? v.exterior_material[0] : v.exterior_material) ?? null;

  if (style?.silhouette) addWeight(vec, "silhouette", style.silhouette, weight);
  if (v.size_category) addWeight(vec, "size", v.size_category, weight);
  if (v.hardware_color) addWeight(vec, "hardware", v.hardware_color, weight);
  if (material?.material_type) addWeight(vec, "material", material.material_type, weight);
  if (brand?.name) addWeight(vec, "brand", brand.name, weight);
  const band = priceBand(v.retail_price_original != null ? Number(v.retail_price_original) : null);
  if (band) addWeight(vec, "price_band", band, weight);
  for (const c of v.carry_method ?? []) {
    if (c.possible !== "no") addWeight(vec, "carry", c.carry_type, weight * 0.5);
  }
}
