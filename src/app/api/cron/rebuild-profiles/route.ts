import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rebuildUserProfile } from "@/lib/personalization/user-profile";
import { deriveMaturityStage } from "@/lib/maturity";

/**
 * Recompute Axis-A maturity_stage for every user from current closet state and
 * write it back. Best-effort: if 0035_persona_model is not applied yet the first
 * update errors on the missing column, so we bail out quietly. Returns the count
 * updated.
 */
async function refreshMaturity(
  admin: ReturnType<typeof getSupabaseAdmin>,
  ids: string[],
): Promise<number> {
  const { data: closet } = await admin
    .from("closet_item")
    .select("user_id, status");
  const counts = new Map<string, { owned: number; wishlist: number }>();
  for (const row of closet ?? []) {
    const c = counts.get(row.user_id) ?? { owned: 0, wishlist: 0 };
    if (row.status === "owned") c.owned++;
    else c.wishlist++;
    counts.set(row.user_id, c);
  }

  let updated = 0;
  for (const userId of ids) {
    const stage = deriveMaturityStage(counts.get(userId) ?? { owned: 0, wishlist: 0 });
    const { error } = await admin
      .from("profile")
      .update({ maturity_stage: stage })
      .eq("id", userId);
    if (error) return updated; // column missing (0037 unapplied) — stop quietly.
    updated++;
  }
  return updated;
}

export const dynamic = "force-dynamic";

/**
 * Personalization profile rebuild job (Phase 1).
 * Runs nightly via Vercel Cron (see vercel.json). Secured by CRON_SECRET.
 *
 * Iterates all rows in `profile`, calls rebuildUserProfile() for each,
 * and upserts into `user_profile`. Errors per-user are logged and skipped
 * so one bad row doesn't abort the batch.
 *
 * No-ops gracefully when:
 *   - SUPABASE_SERVICE_ROLE_KEY is absent (returns 503)
 *   - The user_profile table doesn't exist yet (migration 0018 not applied)
 */
export async function GET(request: NextRequest) {
  // Fail closed: deny unless CRON_SECRET is set AND the bearer token matches.
  // Vercel Cron auto-sends this header when CRON_SECRET is in the env.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = getSupabaseAdmin();

  const { data: users, error } = await admin
    .from("profile")
    .select("id");

  if (error) {
    console.error("rebuild-profiles: profile query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const ids = (users ?? []).map((u: { id: string }) => u.id);
  let rebuilt = 0;
  let failed = 0;

  for (const userId of ids) {
    try {
      const result = await rebuildUserProfile(userId);
      if (result) rebuilt++;
      else failed++;
    } catch (e) {
      console.error(`rebuild-profiles: failed for ${userId}:`, e);
      failed++;
    }
  }

  const maturityUpdated = await refreshMaturity(admin, ids);

  return NextResponse.json({ total: ids.length, rebuilt, failed, maturityUpdated });
}
