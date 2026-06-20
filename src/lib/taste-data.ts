import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import {
  type TasteVector,
  addWeight,
  completeness,
  priceBand,
} from "./taste";

/**
 * Derive a user's taste vector from their persisted quiz vector PLUS their
 * closet and watchlist signals. Reads only catalogued attributes. Returns an
 * empty vector when signed out / no data — recommendations handle the cold start.
 */

type VariantAttrs = {
  variant_id: number;
  size_category: string | null;
  hardware_color: string | null;
  style: { silhouette: string | null; brand: { name: string } | { name: string }[] | null; name: string } | { silhouette: string | null; brand: { name: string } | { name: string }[] | null; name: string }[] | null;
  exterior_material: { material_type: string | null } | { material_type: string | null }[] | null;
  retail_price_original: number | null;
  carry_method: { carry_type: string; possible: string }[] | null;
};

export const VARIANT_ATTR_SELECT =
  "variant_id, size_category, hardware_color, retail_price_original, style:style_id(name, silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(material_type), carry_method(carry_type, possible)";

/** Fold one variant's catalogued attributes into a taste vector. */
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

export interface UserTaste {
  vector: TasteVector;
  completeness: number;
  /** True if the user has explicitly taken the quiz (quiz vector present). */
  hasQuiz: boolean;
  /** Variant ids already in the user's closet/watchlist — to exclude from recs. */
  seenVariantIds: number[];
}

/** The current user's blended taste. Empty vector when signed out / no signals. */
export async function getUserTaste(): Promise<UserTaste> {
  const empty: UserTaste = { vector: {}, completeness: 0, hasQuiz: false, seenVariantIds: [] };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  const user = await getCurrentUser();
  if (!user) return empty;

  const supabase = await createServerSupabase();

  // 1. Persisted quiz vector (weighted highest — it's an explicit signal).
  let vector: TasteVector = {};
  let hasQuiz = false;
  const { data: profileRow } = await supabase
    .from("profile")
    .select("taste_vector")
    .eq("id", user.id)
    .maybeSingle();
  const stored = (profileRow?.taste_vector as TasteVector | null) ?? null;
  if (stored && Object.keys(stored).length > 0) {
    vector = structuredClone(stored);
    hasQuiz = true;
  }

  // 2. Closet (have weighted more than want) + 3. watchlist.
  const seen = new Set<number>();
  const [closetRes, watchRes] = await Promise.all([
    supabase.from("closet_item").select(`status, variant:variant_id(${VARIANT_ATTR_SELECT})`).limit(200),
    supabase.from("watchlist").select(`variant:variant_id(${VARIANT_ATTR_SELECT})`).limit(200),
  ]);

  for (const row of (closetRes.data ?? []) as { status: string; variant: VariantAttrs | VariantAttrs[] | null }[]) {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) ?? null;
    if (!v) continue;
    seen.add(v.variant_id);
    foldVariantIntoVector(vector, v, row.status === "have" ? 2 : row.status === "had" ? 1.5 : 1);
  }
  for (const row of (watchRes.data ?? []) as { variant: VariantAttrs | VariantAttrs[] | null }[]) {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) ?? null;
    if (!v) continue;
    seen.add(v.variant_id);
    foldVariantIntoVector(vector, v, 1);
  }

  return {
    vector,
    completeness: completeness(vector),
    hasQuiz,
    seenVariantIds: [...seen],
  };
}
