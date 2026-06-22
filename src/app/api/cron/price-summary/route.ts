import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Rebuilds the `variant_price_summary` materialized view (per-variant
 * low/median/high resale, last-sold, retail-vs-resale retention) so bag pages
 * read one row instead of aggregating price_history on the fly. Intended to be
 * hit by Vercel Cron (see vercel.json); secured by CRON_SECRET when set.
 *
 * The heavy price *fetching* runs out-of-band (GitHub Actions / local CLI) and
 * writes raw rows into price_history; this cheap job just refreshes the
 * derived view. Runs with the service-role client. No-ops without DB env.
 *
 * Requires migration 0021 (the view + refresh_variant_price_summary fn).
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
  const { error } = await admin.rpc("refresh_variant_price_summary");

  if (error) {
    console.error("price-summary refresh error:", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() });
}
