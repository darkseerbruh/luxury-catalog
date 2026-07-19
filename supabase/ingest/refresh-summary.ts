/**
 * Rebuild the variant_price_summary materialized view from the CLI (the local
 * twin of /api/cron/price-summary). Run after load:prices so newly loaded rows
 * surface in the per-variant summary. Optional [variant_id] prints that row to
 * verify. Needs .env.local with the service-role key. Requires migration 0021.
 *
 *   npx tsx supabase/ingest/refresh-summary.ts [variant_id]
 */
import { supabaseAdmin } from "../seed/lib/client";

/**
 * REFRESH MATERIALIZED VIEW CONCURRENTLY takes an ExclusiveLock on the view, so two
 * refreshes of variant_price_summary can never run at once — the loser is cancelled with
 * SQLSTATE 55P03 ("canceling statement due to lock timeout").
 *
 * Fourteen workflow steps end by calling this script and their crons cluster inside one
 * morning window (06:41 -> 08:43 UTC). Migration 0055 raised this function's
 * statement_timeout to 180s so the rebuild could finish, which also widened the window in
 * which a second caller can collide — hence the 55P03 failures on TLC, Redeluxe, Couture
 * and Rebag (7 runs, 2026-07-12..19).
 *
 * Waiting is the correct response, not failing: the other refresh is rebuilding the very
 * same view, so once it finishes the data is fresh either way. Back off and retry, and
 * treat "someone else already did it" as success rather than erroring the whole workflow.
 */
const LOCK_TIMEOUT = "55P03";
const STATEMENT_TIMEOUT = "57014";
const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [15_000, 30_000, 60_000, 120_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function refreshWithRetry(): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    const { error } = await supabaseAdmin.rpc("refresh_variant_price_summary");
    if (!error) {
      console.log(`Refreshed variant_price_summary${attempt > 1 ? ` (attempt ${attempt})` : ""}.`);
      return;
    }

    const code = (error as { code?: string }).code;
    const contended = code === LOCK_TIMEOUT || code === STATEMENT_TIMEOUT;
    if (!contended || attempt >= MAX_ATTEMPTS) throw error;

    const waitMs = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
    console.log(
      `variant_price_summary busy (${code}) — another refresh holds the view. ` +
        `Attempt ${attempt}/${MAX_ATTEMPTS}, retrying in ${waitMs / 1000}s.`,
    );
    await sleep(waitMs);
  }
}

async function main() {
  const variantId = process.argv[2] ? Number(process.argv[2]) : null;

  await refreshWithRetry();

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
