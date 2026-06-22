/**
 * Phase-2 personalization recs DB layer.
 *
 * computeAndStoreRecs  — full pipeline: gather candidates, score with Phase-1
 *   profile, rank, store in user_recs. Called by the nightly cron.
 *
 * getPersonalizedRecs  — read from user_recs (fast); falls back to computing
 *   synchronously on first access so the first request is never empty.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserProfile } from "./user-profile";
import { rankVariants, type ScoredVariant } from "./ranker";
import { generateWhyStrings } from "./taste-synthesis";
import type { Recommendation } from "@/lib/recommendations-core";
import type { VariantRow } from "@/lib/recommendations-core";

// ── Candidate fetching ────────────────────────────────────────────────────────

const CANDIDATE_SELECT =
  "variant_id, size_category, hardware_color, exterior_colorway, size_label, retail_price_original, currency, style:style_id(name, silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(material_type), carry_method(carry_type, possible)";

/** Fetch up to 500 catalog variants to score. */
async function fetchCandidates(): Promise<VariantRow[]> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("variant")
    .select(CANDIDATE_SELECT)
    .limit(500);
  return (data ?? []) as unknown as VariantRow[];
}

/** Get the set of variant IDs the user already has in closet or watchlist. */
async function getUserSeenIds(userId: string): Promise<Set<number>> {
  const admin = getSupabaseAdmin();
  const [closet, watch] = await Promise.all([
    admin.from("closet_item").select("variant_id").eq("user_id", userId),
    admin.from("watchlist").select("variant_id").eq("user_id", userId),
  ]);
  const ids = new Set<number>();
  for (const r of closet.data ?? []) ids.add(r.variant_id as number);
  for (const r of watch.data ?? []) ids.add(r.variant_id as number);
  return ids;
}

/** Catalog-wide popularity: total want+have closet saves per variant. */
async function fetchPopularity(): Promise<Map<number, number>> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("closet_item")
    .select("variant_id")
    .in("status", ["want", "have"]);
  const counts = new Map<number, number>();
  for (const r of data ?? []) {
    const vid = r.variant_id as number;
    counts.set(vid, (counts.get(vid) ?? 0) + 1);
  }
  return counts;
}

// ── Compute + store ───────────────────────────────────────────────────────────

const REC_LIMIT = 30;

/**
 * Run the full Phase-2 ranking pipeline for one user and upsert into user_recs.
 * No-ops when DB isn't configured. Returns the number of recs stored.
 */
export async function computeAndStoreRecs(userId: string): Promise<number> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 0;
  const admin = getSupabaseAdmin();

  const [profile, allCandidates, popularity, seenIds] = await Promise.all([
    getUserProfile(userId),
    fetchCandidates(),
    fetchPopularity(),
    getUserSeenIds(userId),
  ]);

  // Exclude bags already in the user's closet/watchlist.
  const candidates = allCandidates.filter((r) => !seenIds.has(r.variant_id));
  if (candidates.length === 0) return 0;

  const ranked: ScoredVariant[] = rankVariants(profile, candidates, popularity, REC_LIMIT);
  if (ranked.length === 0) return 0;

  // Phase-4: enrich the top recs with LLM-generated why strings (Haiku, fire-and-forget on failure).
  const whyMap = profile
    ? await generateWhyStrings(profile, ranked.slice(0, 12))
    : new Map<number, string>();

  const now = new Date().toISOString();
  const rows = ranked.map((r, i) => ({
    user_id: userId,
    variant_id: r.variantId,
    rank: i + 1,
    score: r.score,
    why: whyMap.get(r.variantId) ?? r.why ?? null,
    algo: r.algo,
    computed_at: now,
  }));

  // Replace all existing recs for this user atomically.
  await admin.from("user_recs").delete().eq("user_id", userId);
  const { error } = await admin.from("user_recs").insert(rows);
  if (error) {
    if (error.code === "42P01") return 0; // table not yet migrated — degrade
    console.error("computeAndStoreRecs insert error:", error);
    return 0;
  }

  return rows.length;
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Convert a stored user_recs row to the Recommendation interface used by the
 * existing RecommendationCard component.
 */
function storedRowToRec(row: {
  variant_id: number;
  rank: number;
  score: number;
  why: string | null;
  variant?: unknown;
}): Recommendation | null {
  // The variant data is joined in the read query.
  const v = row.variant as {
    size_category: string | null;
    hardware_color: string | null;
    exterior_colorway: string | null;
    size_label: string | null;
    retail_price_original: number | null;
    currency: string | null;
    style: { name: string; brand: { name: string } | null } | { name: string; brand: { name: string } | null }[] | null;
  } | null;
  if (!v) return null;

  const style = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
  const rawBrand = style ? (style as { brand: unknown }).brand : null;
  const brand = rawBrand ? (Array.isArray(rawBrand) ? (rawBrand as {name:string}[])[0] : rawBrand as {name:string}) : null;
  const label = [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";

  return {
    variantId: row.variant_id,
    brandName: (brand as {name:string}|null)?.name ?? "",
    styleName: style?.name ?? "",
    label,
    hardwareColor: v.hardware_color,
    retailPrice: v.retail_price_original != null ? Number(v.retail_price_original) : null,
    currency: v.currency,
    score: Number(row.score),
    why: row.why ?? "",
  };
}

const STORED_REC_SELECT =
  "variant_id, rank, score, why, variant:variant_id(size_category, hardware_color, exterior_colorway, size_label, retail_price_original, currency, style:style_id(name, brand:brand_id(name)))";

/**
 * Read precomputed recs for a user. Returns null when none stored yet (triggers
 * a synchronous compute on the caller's side) or when the table doesn't exist.
 */
export async function getStoredRecs(
  userId: string,
  limit = 8
): Promise<Recommendation[] | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("user_recs")
    .select(STORED_REC_SELECT)
    .eq("user_id", userId)
    .order("rank")
    .limit(limit);

  if (error) {
    if (error.code === "42P01") return null; // table not migrated yet
    console.error("getStoredRecs error:", error);
    return null;
  }
  if (!data || data.length === 0) return null;

  return data.map((r) => storedRowToRec(r as Parameters<typeof storedRowToRec>[0])).filter((r): r is Recommendation => r !== null);
}

/**
 * Get personalized recs for a user: reads from user_recs, triggers a
 * synchronous compute on first access, degrades gracefully when unconfigured.
 */
export async function getPersonalizedRecs(
  userId: string,
  limit = 8
): Promise<Recommendation[] | null> {
  const stored = await getStoredRecs(userId, limit);
  if (stored && stored.length > 0) return stored;

  // Nothing stored yet — compute synchronously (first access or post-migration).
  await computeAndStoreRecs(userId);
  return getStoredRecs(userId, limit);
}
