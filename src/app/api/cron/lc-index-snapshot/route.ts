import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getLcIndex, currentMonthStart } from "@/lib/lc-index";

export const dynamic = "force-dynamic";

/**
 * Monthly LC Index snapshot job (vercel.json). Writes one row per ranked style for
 * the current month, so the standing module and the Index page can show a movement
 * pill next month (docs/ux/lc-index-spec.md). CRON_SECRET gated; service-role;
 * upsert on (captured_month, style_id) so re-runs within a month are idempotent.
 * No-ops (200 with a note) until migration 0049 is applied.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const data = await getLcIndex();
  if (data.ranked.length === 0) {
    return NextResponse.json({ styles: 0, note: "index empty" });
  }

  const month = currentMonthStart();
  const rows = data.ranked
    .filter((r) => r.rank != null)
    .map((r) => ({ captured_month: month, style_id: r.styleId, rank: r.rank as number }));

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("lc_index_snapshot")
    .upsert(rows, { onConflict: "captured_month,style_id" });
  if (error) {
    // Pre-0049 (table missing) or transient: report, don't crash the cron.
    return NextResponse.json({ styles: 0, note: error.message });
  }
  return NextResponse.json({ styles: rows.length, month });
}
