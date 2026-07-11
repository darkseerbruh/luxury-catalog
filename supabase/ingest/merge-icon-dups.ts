/**
 * One-off: merge 3 duplicate ICON style rows surfaced during the core-icon page-depth
 * pass (2026-07-10, owner-approved). Same class as merge-mcqueen-dups.ts: short/near-
 * synonym style rows that name the SAME bag, invisible to merge-style-dupes.ts (which only
 * collapses verbose >=4-word junk names). Each pair is verified by the listing source_urls
 * sitting on both rows (identical product) and guarded by the expected style names, so a
 * stale style_id can never merge the wrong bag.
 *
 * Winner = the official house name in each case:
 *   537 "Reissue"                 -> 423 "2.55 Reissue"                (Chanel 2005 re-edition)
 *   992 "Palm Springs"            -> 709 "Palm Springs Backpack"       (LV Cruise-2016 backpack)
 *   518 "Multi Pochette"          -> 444 "Multi Pochette Accessoires"  (LV 2019 modular bag)
 *
 * Re-point mechanics mirror merge-mcqueen-dups exactly: for each loser variant, find-or-
 * create the matching size-variant on the winner, move new-key price rows, drop dup-key
 * rows, re-point discovered_listing pointers, delete the emptied variant, then delete the
 * emptied loser style. Dry-run by default.
 *
 *   npx tsx supabase/ingest/merge-icon-dups.ts           # dry run (review the plan)
 *   npx tsx supabase/ingest/merge-icon-dups.ts --write   # execute
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

// loserId "loserName" -> targetId "targetName". Verified 2026-07-10 against the listing
// source_urls on each style (both rows name the same product).
// Round 2 (2026-07-10): tail duplicates found during the page-depth tail pass, verified
// same-bag by identical listing source_urls. (Round-1 icon pairs already merged + deleted.)
const PAIRS: { junkId: number; junkName: string; targetId: number; targetName: string }[] = [
  { junkId: 802, junkName: "Fendi First", targetId: 479, targetName: "First" },
  { junkId: 529, junkName: "Monogram Artsy MM", targetId: 716, targetName: "Artsy" },
  { junkId: 544, junkName: "LV Monogram Pochette Accessoires", targetId: 690, targetName: "Pochette Accessoires" },
];

const sizeKey = (s: string | null) => (s ?? "").trim().toLowerCase() || " ";

interface VariantRow { variant_id: number; style_id: number; size_label: string | null }
interface PhKeyRow { price_id: number; platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null }

async function styleName(id: number): Promise<string | null> {
  const { data } = await db.from("style").select("name").eq("style_id", id).maybeSingle();
  return data?.name ?? null;
}

async function main() {
  console.log(`merge-icon-dups: ${PAIRS.length} pair(s) ${WRITE ? "(WRITE)" : "(DRY RUN)"}`);

  // Name-guard: abort the whole run if any style_id no longer holds its expected name.
  for (const p of PAIRS) {
    const [jn, tn] = [await styleName(p.junkId), await styleName(p.targetId)];
    if (jn !== p.junkName || tn !== p.targetName) {
      console.error(`  ABORT: guard mismatch — #${p.junkId} is "${jn}" (want "${p.junkName}"), #${p.targetId} is "${tn}" (want "${p.targetName}")`);
      process.exit(1);
    }
  }

  let movedRows = 0, droppedRows = 0, deletedVariants = 0, deletedStyles = 0;
  for (const p of PAIRS) {
    const { data: jvs } = await db.from("variant").select("variant_id,style_id,size_label").eq("style_id", p.junkId);
    const { data: tvsData } = await db.from("variant").select("variant_id,style_id,size_label").eq("style_id", p.targetId);
    const targetVars = (tvsData as VariantRow[] | null) ?? [];

    let planMove = 0, planDrop = 0;
    for (const jv of (jvs as VariantRow[] | null) ?? []) {
      let tv = targetVars.find((v) => sizeKey(v.size_label) === sizeKey(jv.size_label));
      const { data: jpRows } = await db.from("price_history")
        .select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", jv.variant_id);
      const { data: tpRows } = tv
        ? await db.from("price_history").select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", tv.variant_id)
        : { data: [] as PhKeyRow[] };
      const key = (r: PhKeyRow) => `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;
      const targetKeys = new Set(((tpRows as PhKeyRow[] | null) ?? []).map(key));
      const toMove: number[] = [], toDrop: number[] = [];
      for (const r of (jpRows as PhKeyRow[] | null) ?? []) (targetKeys.has(key(r)) ? toDrop : toMove).push(r.price_id);
      planMove += toMove.length; planDrop += toDrop.length;

      if (WRITE) {
        if (!tv) {
          const { data: ins, error } = await db.from("variant")
            .insert({ style_id: p.targetId, size_label: jv.size_label, market_availability: "resale" })
            .select("variant_id,style_id,size_label").single();
          if (error || !ins) { console.error(`  variant create failed:`, error?.message); continue; }
          tv = ins as VariantRow; targetVars.push(tv);
        }
        if (tv.variant_id === jv.variant_id) continue;
        for (let i = 0; i < toMove.length; i += 500) {
          const { error } = await db.from("price_history").update({ variant_id: tv.variant_id }).in("price_id", toMove.slice(i, i + 500));
          if (error) console.error(`  ph move err:`, error.message);
        }
        for (let i = 0; i < toDrop.length; i += 500) {
          const { error } = await db.from("price_history").delete().in("price_id", toDrop.slice(i, i + 500));
          if (error) console.error(`  ph drop err:`, error.message);
        }
        await db.from("discovered_listing").update({ promoted_variant_id: tv.variant_id }).eq("promoted_variant_id", jv.variant_id);
        const { error: vErr } = await db.from("variant").delete().eq("variant_id", jv.variant_id);
        if (!vErr) deletedVariants++;
      }
      movedRows += toMove.length; droppedRows += toDrop.length;
    }
    console.log(`  ${WRITE ? "merged" : "would merge"} #${p.junkId} "${p.junkName}" → #${p.targetId} "${p.targetName}"  (move ${planMove}, drop ${planDrop} ph rows)`);

    if (WRITE) {
      const { data: leftover } = await db.from("variant").select("variant_id").eq("style_id", p.junkId).limit(1);
      if (leftover && leftover.length) { console.error(`  SKIP style delete #${p.junkId}: still has variants`); continue; }
      const { error: sErr } = await db.from("style").delete().eq("style_id", p.junkId);
      if (!sErr) deletedStyles++;
    }
  }
  console.log(`\n${WRITE ? "Done" : "DRY RUN"}. styles ${WRITE ? "deleted" : "to delete"} ${WRITE ? deletedStyles : PAIRS.length}, variants deleted ${deletedVariants}, ph rows moved ${movedRows}, ph dup dropped ${droppedRows}.`);
  if (!WRITE) console.log("Re-run with --write to execute.");
}

main().catch((e) => { console.error("merge-icon-dups failed:", e instanceof Error ? e.message : e); process.exit(1); });
