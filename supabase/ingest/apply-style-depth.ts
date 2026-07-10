/**
 * Apply sourced style descriptions + intro years to the `style` table from a
 * reviewed JSON drafts file (produced by the archivist, spot-checked by a human).
 *
 * Factuality gate: this NEVER generates prose — it only writes drafts a human has
 * reviewed. year_introduced is written only when present (sourced); null is skipped
 * so we never overwrite an existing value with a blank.
 *
 *   npx tsx supabase/ingest/apply-style-depth.ts <drafts.json> [--write]
 *
 * drafts.json: array of { style_id, description, year_introduced|null, note? }.
 * Dry-run by default (prints the diff); --write persists.
 */
import { readFileSync } from "node:fs";
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const file = process.argv.find((a) => a.endsWith(".json"));
if (!file) { console.error("usage: apply-style-depth.ts <drafts.json> [--write]"); process.exit(1); }

interface Draft {
  style_id: number;
  description: string | null;
  year_introduced: number | null;
  note?: string | null;
}

async function main() {
  const drafts = JSON.parse(readFileSync(file!, "utf8")) as Draft[];
  console.log(`apply-style-depth: ${drafts.length} drafts ${WRITE ? "(WRITE)" : "(DRY RUN)"}`);

  let applied = 0, skipped = 0;
  for (const d of drafts) {
    if (!d.style_id || !d.description) { console.warn(`  skip: missing style_id/description (${JSON.stringify(d).slice(0, 60)})`); skipped++; continue; }
    const patch: Record<string, unknown> = { description: d.description };
    if (typeof d.year_introduced === "number") patch.year_introduced = d.year_introduced;
    const flag = d.note ? `  ⚠ ${d.note}` : "";
    console.log(`  style ${d.style_id}: desc ${d.description.length} chars${patch.year_introduced ? `, year ${patch.year_introduced}` : ""}${flag}`);
    if (WRITE) {
      const { error } = await db.from("style").update(patch).eq("style_id", d.style_id);
      if (error) { console.error(`    ✗ ${error.message}`); skipped++; continue; }
    }
    applied++;
  }
  console.log(`\n${WRITE ? "Applied" : "Would apply"}: ${applied}, skipped: ${skipped}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
