import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computeAndStoreRecs } from "@/lib/personalization/recs";

export const dynamic = "force-dynamic";

/**
 * Phase-2 precomputed recs rebuild job. Runs nightly via Vercel Cron (vercel.json).
 * Secured by CRON_SECRET. For each user in `profile`, runs the full Phase-2
 * ranking pipeline and upserts into `user_recs`.
 *
 * No-ops gracefully when SUPABASE_SERVICE_ROLE_KEY is absent.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const { data: users, error } = await admin.from("profile").select("id");
  if (error) {
    console.error("rebuild-recs: profile query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const ids = (users ?? []).map((u: { id: string }) => u.id);
  let rebuilt = 0;
  let failed = 0;

  for (const userId of ids) {
    try {
      const n = await computeAndStoreRecs(userId);
      if (n > 0) rebuilt++;
      else failed++;
    } catch (e) {
      console.error(`rebuild-recs: failed for ${userId}:`, e);
      failed++;
    }
  }

  return NextResponse.json({ total: ids.length, rebuilt, failed });
}
