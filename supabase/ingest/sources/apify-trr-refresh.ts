/**
 * The RealReal — headless live refresh via the Apify API (no browser, cron-safe).
 *
 * Runs the `lulzasaur/therealreal-scraper` actor over TRR's handbag categories,
 * waits for it, and writes TWO files:
 *   1. data/ingest/_raw/trr-apify-live.json  — the raw actor array (adapter input
 *      for `trr-apify.ts` → load:prices therealreal).
 *   2. data/ingest/_raw/trr-live-refs.json   — a plain listing_ref array computed
 *      as (sku ?? url) PER RECORD, i.e. exactly what the loader stores as
 *      price_history.listing_ref. reconcile:sold reads this as the authoritative
 *      "still for sale" set. Writing refs explicitly (not the flat actor record)
 *      is deliberate: reconcile's entry reducer only finds sku inside the raw-dump
 *      {product:{variants:[{sku}]}} shape, so a flat record would silently reduce
 *      to url and make every sku-keyed live listing look sold. This file removes
 *      that trap.
 *
 * Needs APIFY_TOKEN in the env (GitHub Actions secret). Pay-per-result actor
 * (~$0.005/listing); a full handbag sweep is ~800-960 results (~$4-5).
 *
 *   APIFY_TOKEN=... npx tsx supabase/ingest/sources/apify-trr-refresh.ts
 */
import fs from "fs";
import path from "path";

const ACTOR = "lulzasaur~therealreal-scraper";

/** TRR handbag categories. Mirrors the bag-only universe our TRR rows came from,
 *  so reconcile's live set is comprehensive for what's in the DB. */
const CATEGORIES = [
  "women/handbags/shoulder-bags",
  "women/handbags/crossbody-bags",
  "women/handbags/totes",
  "women/handbags/satchels",
  "women/handbags/top-handle-bags",
  "women/handbags/clutches",
  "women/handbags/mini-bags",
  "men/bags",
];

interface TrrRecord { sku?: string | null; url?: string | null }

async function main() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set (GitHub Actions secret).");

  const rawDir = path.join(process.cwd(), "data/ingest/_raw");
  fs.mkdirSync(rawDir, { recursive: true });

  // 1. Start the run.
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ searchQueries: CATEGORIES, maxResults: 0 }),
    },
  );
  if (!startRes.ok) throw new Error(`Apify start failed: ${startRes.status} ${await startRes.text()}`);
  const run = (await startRes.json()) as { data: { id: string; defaultDatasetId: string } };
  const runId = run.data.id;
  const datasetId = run.data.defaultDatasetId;
  console.log(`started run ${runId} (dataset ${datasetId})`);

  // 2. Poll until terminal (cap ~12 min; the actor is fast but proxies vary).
  const started = Date.now();
  let status = "READY";
  for (;;) {
    if (Date.now() - started > 12 * 60_000) throw new Error(`run ${runId} did not finish within 12 min`);
    await new Promise((r) => setTimeout(r, 10_000));
    const s = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    if (!s.ok) continue; // transient; keep polling
    status = ((await s.json()) as { data: { status: string } }).data.status;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
  }
  if (status !== "SUCCEEDED") throw new Error(`run ${runId} ended ${status}`);

  // 3. Download the full dataset (page in 1000s).
  const items: TrrRecord[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&limit=1000&offset=${offset}`,
    );
    if (!res.ok) throw new Error(`dataset fetch failed: ${res.status}`);
    const page = (await res.json()) as TrrRecord[];
    if (page.length === 0) break;
    items.push(...page);
    if (page.length < 1000) break;
  }
  console.log(`fetched ${items.length} TRR records`);
  if (items.length === 0) throw new Error("empty dataset — refusing to write (would falsely retire everything)");

  // 4a. Raw array for the adapter.
  const rawFile = path.join(rawDir, "trr-apify-live.json");
  fs.writeFileSync(rawFile, JSON.stringify(items, null, 2));

  // 4b. Reconcile snapshot: listing_ref = sku ?? url, exactly the loader's rule.
  const refs = items
    .map((r) => (r.sku?.trim() ? r.sku.trim() : r.url?.trim() || null))
    .filter((r): r is string => !!r);
  const refsFile = path.join(rawDir, "trr-live-refs.json");
  fs.writeFileSync(refsFile, JSON.stringify(refs, null, 2));

  console.log(`wrote ${items.length} records -> ${rawFile}`);
  console.log(`wrote ${refs.length} live listing_refs -> ${refsFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
