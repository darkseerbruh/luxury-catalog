/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fix the pre-production-model LV rows that stuffed the CANVAS LINE into exterior_colorway
 * (owner 2026-07-12, "Neverfull dup MM rows"). Those old rows (e.g. Neverfull MM with
 * colorway="Monogram") duplicate the newer canvas-split rows (same size + material_id, colorway
 * NULL, canvas in the material) — so a canvas shows up as BOTH a Material chip and a bogus
 * Colour chip in the selector. For each such row:
 *   - if a colourless sibling with the same (style_id, size_label, exterior_material_id) exists
 *     → MERGE: move its price_history + discovered_listing onto the sibling, delete the row.
 *   - else → NORMALIZE: null the bogus colorway (it's a canvas name, not a colour), keep the row.
 * Matches on exterior_material_id (not name). Reversible only by re-import (merge). Dry-run default.
 *   npx tsx supabase/ingest/merge-lv-canvas-colorway.ts [--style=218]          # dry run
 *   npx tsx supabase/ingest/merge-lv-canvas-colorway.ts --style=218 --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const STYLE = process.argv.find((a) => a.startsWith("--style="));
const STYLE_ID = STYLE ? Number(STYLE.split("=")[1]) : null; // null = all LV canvas styles

// Colorway values that are actually a CANVAS/print LINE, never a colour. Lowercased match.
const CANVAS_AS_COLOUR = new Set([
  "monogram", "damier", "damier ebene", "damier ébène", "damier azur", "azur",
  "monogram canvas", "damier canvas",
]);

async function phCount(vid: number) {
  return (await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", vid)).count ?? 0;
}

async function main() {
  console.log(`\nmerge-lv-canvas-colorway ${WRITE ? "(WRITE)" : "(DRY RUN)"}${STYLE_ID ? ` style ${STYLE_ID}` : " (all styles)"}\n`);
  let q = db.from("variant").select("variant_id,style_id,size_label,exterior_colorway,exterior_material_id").not("exterior_colorway", "is", null);
  if (STYLE_ID) q = q.eq("style_id", STYLE_ID);
  const { data: vs } = await q;
  const targets = ((vs ?? []) as any[]).filter((v) => CANVAS_AS_COLOUR.has(String(v.exterior_colorway).toLowerCase().trim()));
  if (!targets.length) { console.log("  no canvas-in-colorway rows found."); return; }

  let merged = 0, normalized = 0, moved = 0;
  for (const t of targets) {
    // colourless sibling, same size + material
    let sq = db.from("variant").select("variant_id").eq("style_id", t.style_id).is("exterior_colorway", null);
    sq = t.exterior_material_id == null ? sq.is("exterior_material_id", null) : sq.eq("exterior_material_id", t.exterior_material_id);
    sq = t.size_label == null ? sq.is("size_label", null) : sq.eq("size_label", t.size_label);
    const { data: sib } = await sq;
    const sibling = ((sib ?? []) as any[]).filter((s) => s.variant_id !== t.variant_id)[0];
    const n = await phCount(t.variant_id);

    if (sibling) {
      console.log(`  MERGE v${t.variant_id} [${t.size_label}/${t.exterior_colorway}/mat${t.exterior_material_id}] (${n} ph) -> v${sibling.variant_id}`);
      if (WRITE) {
        if (n) await db.from("price_history").update({ variant_id: sibling.variant_id }).eq("variant_id", t.variant_id);
        try { await db.from("discovered_listing").update({ variant_id: sibling.variant_id }).eq("variant_id", t.variant_id); } catch { /* no col */ }
        const { error } = await db.from("variant").delete().eq("variant_id", t.variant_id);
        if (error) { console.error(`     delete failed: ${error.message}`); continue; }
      }
      merged++; moved += n;
    } else {
      console.log(`  NORMALIZE v${t.variant_id} [${t.size_label}/${t.exterior_colorway}/mat${t.exterior_material_id}] (${n} ph) -> colorway NULL`);
      if (WRITE) {
        const { error } = await db.from("variant").update({ exterior_colorway: null }).eq("variant_id", t.variant_id);
        if (error) { console.error(`     update failed: ${error.message}`); continue; }
      }
      normalized++;
    }
  }
  console.log(`\n${merged} merged (${moved} listings re-pointed), ${normalized} normalized ${WRITE ? "" : "(dry run)"}.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
