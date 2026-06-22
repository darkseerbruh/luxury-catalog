/**
 * Server-side `getUserProfile` + `rebuildUserProfile` helpers (Phase 1).
 *
 * getUserProfile: reads the precomputed row from `user_profile` (fast, used
 *   at request time by Phase-2 ranker and future phases).
 *
 * rebuildUserProfile: gathers signals, runs aggregation, and upserts.
 *   Called by the cron endpoint; also called inline if no row exists yet
 *   so the first request still returns something useful.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computeUserProfile } from "./aggregation";
import type { PersonalizationProfile } from "./types";

type UserProfileRow = {
  user_id: string;
  persona: string | null;
  budget_band: string | null;
  intent: string | null;
  top_affinities: { name: string; score: number }[] | null;
  brand_affinities: Record<string, number> | null;
  attribute_affinities: Record<string, Record<string, number>> | null;
  signal_counts: {
    want_count: number;
    have_count: number;
    had_count: number;
    watchlist_count: number;
    review_count: number;
    quiz_completeness: number;
    total_interactions: number;
  } | null;
  taste_vector_snapshot: Record<string, Record<string, number>> | null;
  computed_at: string | null;
};

function rowToProfile(row: UserProfileRow): PersonalizationProfile {
  return {
    userId: row.user_id,
    persona: row.persona,
    budgetBand: (row.budget_band as PersonalizationProfile["budgetBand"]) ?? null,
    intent: (row.intent as PersonalizationProfile["intent"]) ?? null,
    topAffinities: row.top_affinities ?? [],
    brandAffinities: row.brand_affinities ?? {},
    attributeAffinities: row.attribute_affinities ?? {},
    signalCounts: row.signal_counts ?? {
      want_count: 0,
      have_count: 0,
      had_count: 0,
      watchlist_count: 0,
      review_count: 0,
      quiz_completeness: 0,
      total_interactions: 0,
    },
    tasteVectorSnapshot: row.taste_vector_snapshot ?? null,
    computedAt: row.computed_at,
  };
}

/**
 * Read the precomputed personalization profile for a user.
 *
 * Fast path: reads the `user_profile` table (one row, indexed on user_id).
 * If the row doesn't exist yet (new user, migration just applied), triggers
 * a synchronous rebuild so the first call is never empty.
 *
 * Returns null when the DB isn't configured (no SUPABASE_SERVICE_ROLE_KEY).
 */
export async function getUserProfile(
  userId: string
): Promise<PersonalizationProfile | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("user_profile")
    .select(
      "user_id, persona, budget_band, intent, top_affinities, brand_affinities, attribute_affinities, signal_counts, taste_vector_snapshot, computed_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Table doesn't exist yet (migration not applied) — degrade gracefully.
    if (error.code === "42P01") return null;
    console.error("getUserProfile error:", error);
    return null;
  }

  if (data) return rowToProfile(data as UserProfileRow);

  // No row yet — compute synchronously on first access.
  const built = await rebuildUserProfile(userId);
  return built;
}

/**
 * Compute and persist the personalization profile for one user.
 * Uses the service-role client. Called by the cron and on first access.
 * Returns null when the DB isn't configured.
 */
export async function rebuildUserProfile(
  userId: string
): Promise<PersonalizationProfile | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = getSupabaseAdmin();

  const profile = await computeUserProfile(userId);
  if (!profile) return null;

  const { error } = await admin.from("user_profile").upsert(
    {
      user_id: userId,
      persona: profile.persona,
      budget_band: profile.budgetBand,
      intent: profile.intent,
      top_affinities: profile.topAffinities,
      brand_affinities: profile.brandAffinities,
      attribute_affinities: profile.attributeAffinities,
      signal_counts: profile.signalCounts,
      taste_vector_snapshot: profile.tasteVectorSnapshot,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    // Table not yet created — degrade gracefully.
    if (error.code === "42P01") return null;
    console.error("rebuildUserProfile upsert error:", error);
    return null;
  }

  return {
    userId,
    persona: profile.persona,
    budgetBand: profile.budgetBand,
    intent: profile.intent,
    topAffinities: profile.topAffinities,
    brandAffinities: profile.brandAffinities,
    attributeAffinities: profile.attributeAffinities,
    signalCounts: profile.signalCounts,
    tasteVectorSnapshot: profile.tasteVectorSnapshot,
    computedAt: new Date().toISOString(),
  };
}
