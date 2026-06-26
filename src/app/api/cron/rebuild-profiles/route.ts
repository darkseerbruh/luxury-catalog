import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rebuildUserProfile } from "@/lib/personalization/user-profile";

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

  return NextResponse.json({ total: ids.length, rebuilt, failed });
}
