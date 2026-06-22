/**
 * Rebuild the variant_price_summary materialized view from the CLI (the local
 * twin of /api/cron/price-summary). Run after load:prices so newly loaded rows
 * surface in the per-variant summary. Optional [variant_id] prints that row to
 * verify. Needs .env.local with the service-role key. Requires migration 0021.
 *
 *   npx tsx supabase/ingest/refresh-summary.ts [variant_id]
 */
import { supabaseAdmin } from "../seed/lib/client";

async function main() {
  const variantId = process.argv[2] ? Number(process.argv[2]) : null;

  const { error } = await supabaseAdmin.rpc("refresh_variant_price_summary");
  if (error) throw error;
  console.log("Refreshed variant_price_summary.");

  if (variantId != null) {
    const { data, error: qErr } = await supabaseAdmin
      .from("variant_price_summary")
      .select("variant_id, retail_current, resale_low, resale_median, resale_high, last_sold_price, last_sold_on, retention_pct, sample_size, currency, as_of")
      .eq("variant_id", variantId)
      .single();
    if (qErr) throw qErr;
    console.log(`\nSummary for variant ${variantId}:`);
    console.table([data]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
