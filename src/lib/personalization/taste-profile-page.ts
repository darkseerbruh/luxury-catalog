/**
 * Helpers for the /taste page — fetches the taste summary (synthesized by
 * Phase-4 Claude Haiku) and exposes a reset action.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserProfile } from "./user-profile";
import { synthesizeTasteProfile, type TasteSummary } from "./taste-synthesis";
import type { PersonalizationProfile } from "./types";

export interface TastePageData {
  profile: PersonalizationProfile;
  summary: TasteSummary | null;
  topBrands: { name: string; score: number }[];
  topAttributes: { dim: string; value: string; score: number }[];
}

/** Fetch everything the /taste page needs in one call. */
export async function getTastePageData(userId: string): Promise<TastePageData | null> {
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  const summary = await synthesizeTasteProfile(profile);

  const topBrands = Object.entries(profile.brandAffinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, score]) => ({ name, score }));

  const topAttributes = Object.entries(profile.attributeAffinities)
    .flatMap(([dim, vals]) =>
      Object.entries(vals ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([value, score]) => ({ dim, value, score }))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return { profile, summary, topBrands, topAttributes };
}

/** Reset a user's taste profile (wipe user_profile row so it rebuilds fresh). */
export async function resetTasteProfile(userId: string): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admin = getSupabaseAdmin();
  await Promise.all([
    admin.from("user_profile").delete().eq("user_id", userId),
    admin.from("user_recs").delete().eq("user_id", userId),
  ]);
}
