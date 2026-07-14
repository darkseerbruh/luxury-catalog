/**
 * Null out production_year on price_history rows where the "year" is actually part
 * of the bag's MODEL NAME (Jackie 1961, FF 1974, Re-Edition 2005/2000, Lauren 1980)
 * — the 2026-07-14 era-lens contamination. Uses the same MODEL_NAME_YEARS +
 * outside-the-phrase check the extractor guard now applies to new captures
 * (src/lib/ingest/spec-extract.ts). Rollback file records every touched price_id.
 *
 * DRY-RUN default; --apply executes.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { MODEL_NAME_YEARS } from "@/lib/ingest/spec-extract";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

(async () => {
  const rollback: { priceId: number; year: number }[] = [];
  // ilike substring per phrase — pushing BOTH filters down keeps the result tiny and
  // dodges the ~8s statement timeout an unindexed year-only scan trips ([[supabase-
  // statement-timeout]]); the regex still re-checks each row client-side.
  const SUBSTRING: Record<number, string> = { 1961: "%Jackie%1961%", 1974: "%FF%1974%", 2005: "%Re%Edition%2005%", 2000: "%Re%Edition%2000%", 1980: "%Lauren%1980%" };
  for (const m of MODEL_NAME_YEARS) {
    type Row = { price_id: number; notes: string | null; condition_detail: string | null };
    const rows: Row[] = [];
    for (let f = 0; ; f += 1000) {
      const { data, error } = await db
        .from("price_history")
        .select("price_id, notes, condition_detail")
        .eq("production_year", m.year)
        .ilike("notes", SUBSTRING[m.year])
        .range(f, f + 999);
      if (error) throw new Error(error.message);
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < 1000) break;
    }
    let hit = 0;
    for (const r of rows) {
      const text = [r.notes, r.condition_detail].filter(Boolean).join(" — ");
      if (!m.phrase.test(text)) continue;
      // Year stated OUTSIDE the phrase too → genuinely that year, keep.
      const outside = text.replace(new RegExp(m.phrase.source, "gi"), " ");
      if (new RegExp(`\\b${m.year}\\b`).test(outside)) continue;
      hit++;
      rollback.push({ priceId: r.price_id, year: m.year });
      if (APPLY) {
        const { error } = await db.from("price_history").update({ production_year: null }).eq("price_id", r.price_id);
        if (error) console.warn(`  ! price ${r.price_id}: ${error.message}`);
      }
    }
    console.log(`${m.year} ("${m.phrase.source}"): ${rows.length} rows with the year, ${hit} are model-name contamination`);
  }
  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-model-years.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED: nulled ${rollback.length} rows. Rollback -> ${out}`);
  } else {
    console.log(`\nDRY-RUN: would null ${rollback.length} rows. Re-run with --apply.`);
  }
})();
