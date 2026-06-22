import { getSupabase } from "./supabase";
import { getSupabaseAdmin } from "./supabase/admin";
import { getCurrentUser } from "./auth";
import { getUserTaste } from "./taste-data";
import { foldVariantIntoVector, VARIANT_ATTR_SELECT } from "./taste-core";
import { type TasteVector, topValue } from "./taste";
import {
  type Recommendation,
  type VariantRow,
  scoreVariant,
  rowToRec,
} from "./recommendations-core";

export type { Recommendation };

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
 *
 * The pure scoring core (scoreVariant / buildWhy / rowToRec) lives in
 * recommendations-core.ts so it is unit-testable without server-only imports.
 */

export interface RecommendationResult {
  recommendations: Recommendation[];
  /** False when the user has no taste signal yet — callers show the quiz stub. */
  hasTaste: boolean;
}

/**
 * Collaborative signal (build-order #7): "collectors who have X also want Y".
 * For each bag the current user HAS, find what OTHER owners of that same bag
 * also `want`, and tally those wants. Same shape as the closet_stats demand
 * calc, item-item co-occurrence — no ML.
 *
 * Reads the cross-user closet graph, which RLS shields, so this runs via the
 * read-only service-role client and only when it's configured. Returns an empty
 * map otherwise — content-based recs stand alone. Returns variantId -> co-occur
 * score (excluding bags the user already has/wants/watches).
 */
async function getCollaborativeScores(seenVariantIds: number[]): Promise<Map<number, number>> {
  const scores = new Map<number, number>();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return scores;
  const user = await getCurrentUser();
  if (!user) return scores;

  try {
    const admin = getSupabaseAdmin();

    // Bags the current user HAS (the anchor set).
    const { data: mine } = await admin
      .from("closet_item")
      .select("variant_id")
      .eq("user_id", user.id)
      .eq("status", "have");
    const myHave = (mine ?? []).map((r) => r.variant_id as number);
    if (myHave.length === 0) return scores;

    // Other users who HAVE any of those same bags.
    const { data: peers } = await admin
      .from("closet_item")
      .select("user_id")
      .in("variant_id", myHave)
      .eq("status", "have")
      .neq("user_id", user.id)
      .limit(2000);
    const peerIds = [...new Set((peers ?? []).map((r) => r.user_id as string))];
    if (peerIds.length === 0) return scores;

    // What those peers WANT — tally co-occurrence.
    const { data: peerWants } = await admin
      .from("closet_item")
      .select("variant_id")
      .in("user_id", peerIds)
      .eq("status", "want")
      .limit(5000);

    const seen = new Set(seenVariantIds);
    for (const row of peerWants ?? []) {
      const vid = row.variant_id as number;
      if (seen.has(vid)) continue;
      scores.set(vid, (scores.get(vid) ?? 0) + 1);
    }
  } catch (err) {
    console.error("collaborative scores error:", err);
  }
  return scores;
}

/** Whether collaborative recs are even possible (service-role configured). */
export function collaborativeAvailable(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
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

  const [{ data, error }, collab] = await Promise.all([
    getSupabase().from("variant").select(SELECT).limit(500),
    getCollaborativeScores(taste.seenVariantIds),
  ]);
  if (error || !data) return { recommendations: [], hasTaste: true };

  // Normalize the collaborative tally to a 0..1 boost so it blends BEHIND the
  // content-based score rather than overpowering it (content-based first, per spec).
  const maxCollab = Math.max(0, ...collab.values());

  const seen = new Set(taste.seenVariantIds);
  const scored = (data as VariantRow[])
    .filter((r) => !seen.has(r.variant_id))
    .map((r) => {
      const s = scoreVariant(taste.vector, r);
      const co = collab.get(r.variant_id) ?? 0;
      const coBoost = maxCollab > 0 ? (co / maxCollab) * 0.5 : 0;
      return { scored: s, total: s.score + coBoost, co };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((x) => {
      const rec = rowToRec(x.scored);
      rec.score = x.total;
      // If a co-occurrence signal exists but no attribute "why", explain it.
      if (!rec.why && x.co > 0) rec.why = "Collectors who share your taste are after this one too";
      return rec;
    });

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
    .map((s) => rowToRec(s, "Shares its"));
}

/** A compact, presentational summary of the user's dominant taste, for headers. */
export function tasteHeadline(vec: TasteVector): string | null {
  const sil = topValue(vec, "silhouette");
  const hw = topValue(vec, "hardware");
  const parts = [sil, hw && `${hw} hardware`].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
