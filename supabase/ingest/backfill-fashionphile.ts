/**
 * Backfill the NEW capture fields onto EXISTING Fashionphile price_history rows.
 *
 * load-prices upserts with ignoreDuplicates, so re-running a load never updates rows that
 * are already there — condition/region/source_description would never reach the ~19k FP
 * rows loaded before those fields existed. This re-parses the FP dump (which the condition
 * pass has been grading) and UPDATEs each matching row by listing_ref, filling ONLY the
 * fields that are currently null (never clobbers an existing value). Idempotent: run it
 * repeatedly as the grade pass progresses; each run fills whatever is newly available.
 *
 *   npx tsx supabase/ingest/backfill-fashionphile.ts [--limit=N] [--write]
 *
 * Fields backfilled: condition, region, hardware_color (where null) + enrichment merge
 * (listed_at, compare_at_price, source_description, desc_facts). Needs .env.local.
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin as db } from "../seed/lib/client";
import { parseFashionphileProduct } from "../../src/lib/ingest/fashionphile";

const RAW_DUMP = path.resolve(__dirname, "../../data/ingest/_raw/fashionphile.json");
const WRITE = process.argv.includes("--write");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1]) || Infinity;

interface DumpEntry { product: Record<string, unknown>; conditionGrade?: string | null }
type PHRow = {
  price_id: number; listing_ref: string | null; condition: string | null;
  region: string | null; hardware_color: string | null; enrichment: Record<string, unknown> | null;
};

/** Page through every Fashionphile row, indexed by listing_ref (its SKU). */
async function loadFpRows(): Promise<Map<string, PHRow>> {
  const byRef = new Map<string, PHRow>();
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("price_history")
      .select("price_id,listing_ref,condition,region,hardware_color,enrichment")
      .eq("platform", "Fashionphile")
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as PHRow[]) if (r.listing_ref) byRef.set(r.listing_ref, r);
    if (data.length < 1000) break;
    from += 1000;
  }
  return byRef;
}

async function main() {
  if (!fs.existsSync(RAW_DUMP)) { console.error(`dump not found at ${RAW_DUMP}`); process.exit(1); }
  const dump: DumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  console.log(`backfill-fashionphile: ${dump.length} dump entries ${WRITE ? "(WRITE)" : "(DRY RUN)"}`);

  const byRef = await loadFpRows();
  console.log(`indexed ${byRef.size} Fashionphile rows by listing_ref.`);

  let updated = 0, skipped = 0, processed = 0;
  const counts = { condition: 0, region: 0, hardware_color: 0, enrichment: 0 };
  for (const e of dump) {
    if (processed >= LIMIT) break;
    const spec = parseFashionphileProduct(e.product, e.conditionGrade);
    const ref = spec.sku;
    if (!ref) continue;
    const row = byRef.get(ref);
    if (!row) continue;
    processed++;

    const patch: Record<string, unknown> = {};
    if (row.condition == null && spec.condition) { patch.condition = spec.condition; counts.condition++; }
    if (row.region == null && spec.region) { patch.region = spec.region; counts.region++; }
    if (row.hardware_color == null && spec.hardwareColor) { patch.hardware_color = spec.hardwareColor; counts.hardware_color++; }

    // Merge enrichment without dropping anything already there.
    const enr: Record<string, unknown> = { ...(row.enrichment ?? {}) };
    let enrChanged = false;
    if (spec.listedAt && enr.listed_at == null) { enr.listed_at = spec.listedAt; enrChanged = true; }
    if (spec.compareAtPrice != null && enr.compare_at_price == null) { enr.compare_at_price = spec.compareAtPrice; enrChanged = true; }
    if (spec.sourceDescription && enr.source_description == null) { enr.source_description = spec.sourceDescription; enrChanged = true; }
    if (spec.descFacts && enr.desc_facts == null && Object.values(spec.descFacts).some((v) => v !== null && v !== false)) {
      enr.desc_facts = spec.descFacts; enrChanged = true;
    }
    if (enrChanged) { patch.enrichment = enr; counts.enrichment++; }

    if (Object.keys(patch).length === 0) { skipped++; continue; }
    if (WRITE) {
      const { error } = await db.from("price_history").update(patch).eq("price_id", row.price_id);
      if (error) { console.error(`  update price_id ${row.price_id}: ${error.message}`); continue; }
    }
    updated++;
    if (updated % 500 === 0) console.log(`  …${updated} updated (${processed} matched)`);
  }

  console.log(`\n${WRITE ? "Updated" : "Would update"} ${updated} row(s); ${skipped} already complete.`);
  console.log(`  field fills:`, JSON.stringify(counts));
  if (!WRITE) console.log("DRY RUN — re-run with --write to persist.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
