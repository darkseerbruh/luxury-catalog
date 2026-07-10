/**
 * Merge an EXPLICIT list of (loser style → winner style) pairs, with an optional rename
 * of the survivor. For the duplicate clusters merge-style-dupes.ts correctly left alone
 * because there was no single unambiguous clean target (both spellings clean, or neither
 * matches the bare model). The winner here is chosen by the HOUSE's official name (PR /
 * product catalog), per owner direction 2026-07-10.
 *
 * Same re-point + price_history dedup as merge-style-dupes: for each loser variant,
 * find-or-create the matching size-variant on the winner, move price_history (dedup on
 * platform|listing_ref|price_type|observed_on), re-point discovered_listing, delete the
 * emptied loser variant, then delete the loser style. Optional rename applies after.
 *
 *   npx tsx supabase/ingest/merge-style-pairs.ts            # dry run
 *   npx tsx supabase/ingest/merge-style-pairs.ts --write    # execute
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm } from "../../src/lib/image-import-core";

const WRITE = process.argv.includes("--write");

// loser -> winner, winner named by the official house form (verified against hermes.com /
// burberry FW23 launch press, 2026-07-10).
const PAIRS: { loser: number; winner: number; renameWinnerTo?: string }[] = [
  { loser: 753, winner: 543 },                                  // Hermès "In The Loop" → "In-The-Loop"
  { loser: 876, winner: 198, renameWinnerTo: "The Knight Bag" },// Burberry "Knight Bag" → "The Knight" (renamed to house name)
];

type VariantRow = { variant_id: number; style_id: number; size_label: string | null };
type PhKeyRow = { price_id: number; platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null };
const sizeKey = (s: string | null) => norm(s || "").replace(/[()]/g, "").trim();
const phKey = (r: PhKeyRow) => `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;

async function main() {
  console.log(`\nmerge-style-pairs ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  let movedRows = 0, droppedRows = 0, deletedVariants = 0, deletedStyles = 0, renamed = 0;

  for (const p of PAIRS) {
    const { data: ls } = await db.from("style").select("style_id,name").eq("style_id", p.loser).single();
    const { data: ws } = await db.from("style").select("style_id,name").eq("style_id", p.winner).single();
    if (!ls || !ws) { console.error(`  skip: missing style (loser ${p.loser} / winner ${p.winner})`); continue; }
    const { data: lv } = await db.from("variant").select("variant_id,style_id,size_label").eq("style_id", p.loser);
    const { data: wvRaw } = await db.from("variant").select("variant_id,style_id,size_label").eq("style_id", p.winner);
    const wv = (wvRaw ?? []) as VariantRow[];
    console.log(`  #${p.loser} "${ls.name}" → #${p.winner} "${ws.name}"${p.renameWinnerTo ? ` (rename → "${p.renameWinnerTo}")` : ""}`);

    for (const v of (lv ?? []) as VariantRow[]) {
      const { data: lp } = await db.from("price_history").select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", v.variant_id);
      let tv = wv.find((w) => sizeKey(w.size_label) === sizeKey(v.size_label));
      console.log(`      var v${v.variant_id} [${v.size_label ?? "∅"}] (${(lp ?? []).length} ph) → ${tv ? `existing v${tv.variant_id}` : "new variant"}`);
      if (!WRITE) continue;

      if (!tv) {
        const { data: ins, error } = await db.from("variant").insert({ style_id: p.winner, size_label: v.size_label, market_availability: "resale" }).select("variant_id,style_id,size_label").single();
        if (error || !ins) { console.error(`      variant create failed:`, error?.message); continue; }
        tv = ins as VariantRow; wv.push(tv);
      }
      const { data: tp } = await db.from("price_history").select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", tv.variant_id);
      const targetKeys = new Set(((tp as PhKeyRow[] | null) ?? []).map(phKey));
      const toMove: number[] = [], toDrop: number[] = [];
      for (const r of (lp as PhKeyRow[] | null) ?? []) (targetKeys.has(phKey(r)) ? toDrop : toMove).push(r.price_id);
      for (let i = 0; i < toMove.length; i += 500) { const { error } = await db.from("price_history").update({ variant_id: tv.variant_id }).in("price_id", toMove.slice(i, i + 500)); if (error) console.error("      ph move err:", error.message); }
      for (let i = 0; i < toDrop.length; i += 500) { const { error } = await db.from("price_history").delete().in("price_id", toDrop.slice(i, i + 500)); if (error) console.error("      ph drop err:", error.message); }
      await db.from("discovered_listing").update({ promoted_variant_id: tv.variant_id }).eq("promoted_variant_id", v.variant_id);
      const { error: vErr } = await db.from("variant").delete().eq("variant_id", v.variant_id);
      if (vErr) console.error("      variant delete err:", vErr.message); else deletedVariants++;
      movedRows += toMove.length; droppedRows += toDrop.length;
    }
    if (!WRITE) continue;
    const { data: leftover } = await db.from("variant").select("variant_id").eq("style_id", p.loser).limit(1);
    if (leftover && leftover.length) { console.error(`      SKIP style delete #${p.loser}: still has variants`); continue; }
    const { error: sErr } = await db.from("style").delete().eq("style_id", p.loser);
    if (sErr) console.error("      style delete err:", sErr.message); else deletedStyles++;
    if (p.renameWinnerTo && ws.name !== p.renameWinnerTo) {
      const { error: rErr } = await db.from("style").update({ name: p.renameWinnerTo }).eq("style_id", p.winner);
      if (rErr) console.error("      rename err:", rErr.message); else { renamed++; console.log(`      ✓ renamed #${p.winner} → "${p.renameWinnerTo}"`); }
    }
    console.log(`      ✓ merged #${p.loser} → #${p.winner}`);
  }
  console.log(`\n${WRITE ? "Done" : "DRY RUN"}. styles deleted ${deletedStyles}, variants deleted ${deletedVariants}, renamed ${renamed}, ph moved ${movedRows}, ph dups dropped ${droppedRows}.\n`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
