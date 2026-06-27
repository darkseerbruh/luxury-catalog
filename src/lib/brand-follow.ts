import { createServerSupabase } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";

/**
 * Brand follow state for the brand "artist header" (Phase 2 object-oriented UX).
 *
 * Resilient by contract, so the feature ships behind the migration (0032) and the
 * UI never breaks before it is applied:
 *  - `available` is false when the `brand_follow` table is absent, so the Follow
 *    control renders nothing pre-migration and lights up automatically once applied.
 *  - `following` is read under RLS (a user can only see their own follow rows), so
 *    a non-empty result for this brand means the current user follows it.
 *  - `count` is the public follower count, read via the service-role client (the
 *    rows are otherwise private) and CONTENT-GATED: returned only once it clears
 *    FOLLOWER_GATE, else null. No fabricated social proof.
 */
export interface BrandFollowState {
  available: boolean;
  following: boolean;
  count: number | null;
}

/** Minimum real followers before a count is shown (same spirit as content-gates). */
export const FOLLOWER_GATE = 10;

const OFF: BrandFollowState = { available: false, following: false, count: null };

function isMissingTable(message: string | undefined): boolean {
  return Boolean(message && /does not exist|schema cache|relation .* does not exist/i.test(message));
}

export async function getBrandFollowState(brandId: number): Promise<BrandFollowState> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !Number.isInteger(brandId)) return OFF;
  try {
    const supabase = await createServerSupabase();
    // Probe availability + own-follow in one go. Under RLS this returns only the
    // current user's row for this brand (or nothing): empty when signed out, not
    // following, or the table is missing.
    const probe = await supabase.from("brand_follow").select("brand_id").eq("brand_id", brandId).limit(1);
    if (probe.error) {
      if (isMissingTable(probe.error.message)) return OFF;
      // Table exists but the read errored (e.g. transient): treat as available.
      return { available: true, following: false, count: null };
    }
    const following = (probe.data ?? []).length > 0;

    let count: number | null = null;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { count: c } = await getSupabaseAdmin()
          .from("brand_follow")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandId);
        if (c != null && c >= FOLLOWER_GATE) count = c;
      } catch {
        // count stays null — the button still works, just no proof shown
      }
    }

    return { available: true, following, count };
  } catch {
    return OFF;
  }
}
