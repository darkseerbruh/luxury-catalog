/**
 * One-off: re-triage the Alexander McQueen "Skull" (#600) catch-all (2026-07-10).
 *
 * #600 lumped 42 mixed listings onto one variant. This ROW-LEVEL pass moves the rows
 * that clearly name a specific existing model onto that model's style, and LEAVES the
 * genuinely-generic skull-motif rows (Skull Shoulder/Crossbody/Clutch/Minaudière/Belt
 * Bag) on #600 as an honest motif bucket. Classification is by the listing title
 * (price_history.notes, falling back to the source_url slug); only the unambiguous
 * shapes move. Also deletes the empty dup #879 "Skull Padlock Tote" (0 prices, same bag
 * as #668 "Padlock"). Name-guarded, dry-run by default.
 *
 *   npx tsx supabase/ingest/retriage-mcqueen-skull.ts           # dry run
 *   npx tsx supabase/ingest/retriage-mcqueen-skull.ts --write   # execute
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

const SOURCE = { styleId: 600, name: "Skull" };
const EMPTY_DUP = { styleId: 879, name: "Skull Padlock Tote" }; // delete (0 prices, == #668)
// NON-BAGS mis-ingested onto a bag style — deleted from price_history (they pollute the
// median and were never this bag). Checked BEFORE the bag routes.
// Separator-tolerant: titles arrive space-formatted (notes) OR hyphen-slugged (source_url).
const NON_BAG = /tank.top|smoking.slipper|\bslippers?\b|phone.cover|phone.case|t.shirt|sneakers?|\bsandals?\b|smoking.slipper/i;
// title regex -> target style. First bag-route match wins; anything unmatched STAYS on
// #600 as an honest generic skull-motif bucket (Skull Shoulder/Crossbody/Minaudière/Clutch).
const ROUTES: { label: string; test: RegExp; targetId: number; targetName: string }[] = [
  { label: "BOX-CLUTCH", test: /box.{0,14}clutch|clutch.{0,14}box/i, targetId: 667, targetName: "Skull Box Clutch" },
  { label: "SKULL-CHAIN", test: /chain (cross|shoulder)|twin skull chain|chain crossbody|small chain crossbody/i, targetId: 665, targetName: "Skull Chain" },
  { label: "PADLOCK-TOTE", test: /padlock|zip around tote/i, targetId: 668, targetName: "Padlock" },
];

const sizeKey = (s: string | null) => (s ?? "").trim().toLowerCase() || " ";
interface VariantRow { variant_id: number; size_label: string | null }
interface PhRow { price_id: number; notes: string | null; source_url: string | null; platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null }

async function styleName(id: number): Promise<string | null> {
  const { data } = await db.from("style").select("name").eq("style_id", id).maybeSingle();
  return data?.name ?? null;
}
async function firstVariant(styleId: number): Promise<VariantRow | null> {
  const { data } = await db.from("variant").select("variant_id,size_label").eq("style_id", styleId).order("variant_id").limit(1);
  return (data?.[0] as VariantRow) ?? null;
}

async function main() {
  console.log(`retriage-mcqueen-skull ${WRITE ? "(WRITE)" : "(DRY RUN)"}`);
  // Name-guard every style we touch.
  for (const s of [SOURCE, EMPTY_DUP, ...ROUTES.map((r) => ({ styleId: r.targetId, name: r.targetName }))]) {
    const got = await styleName(s.styleId);
    if (got !== s.name) { console.error(`  ABORT: #${s.styleId} is "${got}", expected "${s.name}"`); process.exit(1); }
  }

  const src = await firstVariant(SOURCE.styleId);
  if (!src) { console.error("  ABORT: Skull #600 has no variant"); process.exit(1); }
  const { data: rows } = await db.from("price_history")
    .select("price_id,notes,source_url,platform,listing_ref,price_type,observed_on").eq("variant_id", src.variant_id);
  const all = (rows as PhRow[] | null) ?? [];

  const title = (r: PhRow) => (r.notes ?? (r.source_url ?? "").split("/").pop() ?? "");
  const plan = new Map<number, { targetName: string; ids: PhRow[] }>();
  const nonBag: PhRow[] = [];
  const stayRows: PhRow[] = [];
  for (const r of all) {
    if (NON_BAG.test(title(r))) { nonBag.push(r); continue; }
    const route = ROUTES.find((x) => x.test.test(title(r)));
    if (!route) { stayRows.push(r); continue; }
    const b = plan.get(route.targetId) ?? { targetName: route.targetName, ids: [] };
    b.ids.push(r); plan.set(route.targetId, b);
  }
  console.log(`  Skull #600: ${all.length} rows — ${[...plan.values()].reduce((a, b) => a + b.ids.length, 0)} move, ${nonBag.length} delete (non-bag), ${stayRows.length} stay (generic skull-motif bucket)`);
  for (const [tid, b] of plan) console.log(`    → #${tid} "${b.targetName}": ${b.ids.length} rows`);
  if (nonBag.length) { console.log(`    ✗ delete (non-bag):`); for (const r of nonBag) console.log(`        ${title(r)}`); }

  if (WRITE) {
    let moved = 0, dropped = 0, deletedNonBag = 0;
    // delete non-bag rows first
    for (let i = 0; i < nonBag.length; i += 500) {
      const { error } = await db.from("price_history").delete().in("price_id", nonBag.slice(i, i + 500).map((r) => r.price_id));
      if (error) console.error(`  non-bag delete err:`, error.message); else deletedNonBag += Math.min(500, nonBag.length - i);
    }
    if (deletedNonBag) console.log(`  ✗ deleted ${deletedNonBag} non-bag row(s)`);
    for (const [tid, b] of plan) {
      let tv = await firstVariant(tid);
      if (!tv) {
        const { data: ins, error } = await db.from("variant").insert({ style_id: tid, size_label: "Standard", market_availability: "resale" }).select("variant_id,size_label").single();
        if (error || !ins) { console.error(`  variant create failed style ${tid}:`, error?.message); continue; }
        tv = ins as VariantRow;
      }
      // dedup vs rows already on the target
      const { data: tpRows } = await db.from("price_history").select("platform,listing_ref,price_type,observed_on").eq("variant_id", tv.variant_id);
      const key = (r: { platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null }) => `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;
      const targetKeys = new Set(((tpRows as PhRow[] | null) ?? []).map(key));
      const toMove = b.ids.filter((r) => !targetKeys.has(key(r))).map((r) => r.price_id);
      const toDrop = b.ids.filter((r) => targetKeys.has(key(r))).map((r) => r.price_id);
      for (let i = 0; i < toMove.length; i += 500) {
        const { error } = await db.from("price_history").update({ variant_id: tv.variant_id }).in("price_id", toMove.slice(i, i + 500));
        if (error) console.error(`  move err:`, error.message);
      }
      for (let i = 0; i < toDrop.length; i += 500) await db.from("price_history").delete().in("price_id", toDrop.slice(i, i + 500));
      moved += toMove.length; dropped += toDrop.length;
      console.log(`  ✓ #${tid} "${b.targetName}": moved ${toMove.length}, dropped ${toDrop.length} dup`);
    }
    // delete the empty dup #879
    const { data: dupPh } = await db.from("variant").select("variant_id").eq("style_id", EMPTY_DUP.styleId);
    let dupHadPrices = 0;
    for (const v of dupPh ?? []) { const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", v.variant_id); dupHadPrices += count ?? 0; }
    if (dupHadPrices === 0) {
      for (const v of dupPh ?? []) await db.from("variant").delete().eq("variant_id", v.variant_id);
      await db.from("style").delete().eq("style_id", EMPTY_DUP.styleId);
      console.log(`  ✓ deleted empty dup #${EMPTY_DUP.styleId} "${EMPTY_DUP.name}"`);
    } else console.error(`  SKIP delete #${EMPTY_DUP.styleId}: unexpectedly has ${dupHadPrices} prices`);
    console.log(`\nDone. moved ${moved}, dropped ${dropped} dup, deleted ${deletedNonBag} non-bag, ${stayRows.length} rows stay on Skull #600.`);
  } else {
    console.log(`  + would delete empty dup #${EMPTY_DUP.styleId} "${EMPTY_DUP.name}" (0 prices)`);
    console.log("Re-run with --write to execute.");
  }
}
main().catch((e) => { console.error("retriage failed:", e instanceof Error ? e.message : e); process.exit(1); });
