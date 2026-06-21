import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { type TasteVector, completeness } from "./taste";
import {
  type VariantAttrs,
  VARIANT_ATTR_SELECT,
  foldVariantIntoVector,
} from "./taste-core";

/**
 * Derive a user's taste vector from their persisted quiz vector PLUS their
 * closet and watchlist signals. Reads only catalogued attributes. Returns an
 * empty vector when signed out / no data — recommendations handle the cold start.
 *
 * The pure folding logic lives in taste-core.ts; re-exported here for the
 * existing import sites.
 */
export { VARIANT_ATTR_SELECT, foldVariantIntoVector };
export type { VariantAttrs };

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
