/**
 * One-off probe: how many catalogued variants can the price alert actually
 * fire on?
 *
 * The `pct_below_median` alert mode returns null unless a variant has at least
 * MIN_MEDIAN_SAMPLE (5) resale comps, so for anything thinner the collector's
 * alert is structurally dead. This counts the split so we are arguing from a
 * number rather than an intuition.
 *
 * Run: npx tsx scripts/probe-alert-coverage.ts
 */
import { createClient } from "@supabase/supabase-js";

const MIN_MEDIAN_SAMPLE = 5;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");

const db = createClient(url, key, { auth: { persistSession: false } });

async function countWhere(filter: (q: ReturnType<typeof db.from>) => unknown): Promise<number> {
  const q = db.from("variant_price_summary").select("variant_id", { count: "exact", head: true });
  const { count, error } = (await filter(
    q as never,
  )) as unknown as { count: number | null; error: unknown };
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  // head:true + count:exact aggregates in the DB, so the 1000-row PostgREST
  // cap never applies (memory: postgrest-row-cap).
  const total = await countWhere((q) => q);
  const alertable = await countWhere((q) =>
    (q as never as { gte: (c: string, v: number) => unknown }).gte("sample_size", MIN_MEDIAN_SAMPLE),
  );
  const zeroComp = await countWhere((q) =>
    (q as never as { eq: (c: string, v: number) => unknown }).eq("sample_size", 0),
  );

  const dead = total - alertable;
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  console.log(JSON.stringify({
    as_of: new Date().toISOString().slice(0, 10),
    total_variants: total,
    can_fire_pct_below_median: alertable,
    cannot_fire: dead,
    cannot_fire_share: pct(dead),
    zero_comps: zeroComp,
    zero_comps_share: pct(zeroComp),
    min_median_sample: MIN_MEDIAN_SAMPLE,
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
