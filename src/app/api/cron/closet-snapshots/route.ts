import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Weekly closet-value snapshot job (vercel.json). For every user with "have"
 * bags it computes the same resale-median value the closet header shows and
 * writes one closet_value_snapshot row (migration 0043), so /closet can chart
 * value over time — the collector persona's named pain point. CRON_SECRET
 * gated; service-role; no-ops (200 with a note) until the migration is applied.
 */

const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const admin = getSupabaseAdmin();

  // Every owned bag, grouped by user.
  const { data: haves, error: hErr } = await admin
    .from("closet_item")
    .select("user_id, variant_id")
    .eq("status", "have")
    .limit(50000);
  if (hErr || !haves || haves.length === 0) {
    return NextResponse.json({ users: 0, note: hErr?.message ?? "no owned bags" });
  }

  const byUser = new Map<string, number[]>();
  const variantIds = new Set<number>();
  for (const row of haves as { user_id: string; variant_id: number }[]) {
    const arr = byUser.get(row.user_id) ?? [];
    arr.push(row.variant_id);
    byUser.set(row.user_id, arr);
    variantIds.add(row.variant_id);
  }

  // Resale medians per variant (dominant currency), mirroring lib/portfolio.ts.
  const { data: prices, error: pErr } = await admin
    .from("price_history")
    .select("variant_id, sale_price, platform, price_type, currency")
    .in("variant_id", [...variantIds])
    .not("sale_price", "is", null)
    .limit(100000);
  if (pErr || !prices) return NextResponse.json({ users: 0, note: pErr?.message ?? "no prices" });

  const perVariant = new Map<number, Map<string, number[]>>();
  for (const row of prices as {
    variant_id: number;
    sale_price: number | string | null;
    platform: string | null;
    price_type: string | null;
    currency: string | null;
  }[]) {
    const price = row.sale_price != null ? Number(row.sale_price) : null;
    if (price == null || !Number.isFinite(price) || price <= 0) continue;
    const isRetail =
      row.price_type === "retail_msrp" ||
      (row.price_type == null && row.platform != null && RETAIL_PLATFORM_RX.test(row.platform));
    if (isRetail) continue;
    const cur = row.currency ?? "USD";
    const perCur = perVariant.get(row.variant_id) ?? new Map<string, number[]>();
    const arr = perCur.get(cur) ?? [];
    arr.push(price);
    perCur.set(cur, arr);
    perVariant.set(row.variant_id, perCur);
  }
  const medians = new Map<number, { median: number; currency: string }>();
  for (const [variantId, perCur] of perVariant) {
    let bestCur = "USD";
    let bestArr: number[] = [];
    for (const [cur, arr] of perCur) {
      if (arr.length > bestArr.length) {
        bestCur = cur;
        bestArr = arr;
      }
    }
    if (bestArr.length >= 2) medians.set(variantId, { median: Math.round(median(bestArr)), currency: bestCur });
  }

  // One snapshot per user; upsert on (user_id, taken_on) so re-runs are safe.
  const rows: { user_id: string; total: number; currency: string | null; valued: number; bag_count: number }[] = [];
  for (const [userId, ids] of byUser) {
    let total = 0;
    let valued = 0;
    const curCounts = new Map<string, number>();
    for (const id of ids) {
      const est = medians.get(id);
      if (est) {
        total += est.median;
        valued += 1;
        curCounts.set(est.currency, (curCounts.get(est.currency) ?? 0) + 1);
      }
    }
    if (valued === 0) continue;
    let currency: string | null = null;
    let best = -1;
    for (const [cur, n] of curCounts) if (n > best) { best = n; currency = cur; }
    rows.push({ user_id: userId, total: Math.round(total), currency, valued, bag_count: ids.length });
  }
  if (rows.length === 0) return NextResponse.json({ users: 0, note: "nothing valued" });

  const { error: insErr } = await admin
    .from("closet_value_snapshot")
    .upsert(
      rows.map((r) => ({ ...r, taken_on: new Date().toISOString().slice(0, 10) })),
      { onConflict: "user_id,taken_on" },
    );
  if (insErr) {
    // Pre-0043 (table missing) or transient: report, don't crash the cron.
    return NextResponse.json({ users: 0, note: insErr.message });
  }
  return NextResponse.json({ users: rows.length });
}
