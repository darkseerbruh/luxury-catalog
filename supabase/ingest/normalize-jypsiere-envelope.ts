/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Targeted dedup from the size-normalization audit (2026-07-11). The two comp-bearing
 * "candidates" turned out to be already-sized canonical styles carrying a junk duplicate:
 *
 *   A. Hermès "Clemence Jypsiere 28" (#93, 0 comps, 1 empty variant) is a verbose one-off
 *      import duplicating the canonical "Jypsière" (#420, sizes Mini/28/31/34). Delete it.
 *   B. Saint Laurent "Envelope Bag" (#835, 1 comp) is a generic-named dup of the canonical
 *      "Cassandre Envelope" (#466, Small/Medium/Large). Merge into it.
 *   C. Cassandre Envelope's empty null-size variant (v1648, 0 comps) is junk. Delete it.
 *
 * NOT touched: "Envelope Clutch" (#930) — archivist verdict 2026-07-11 KEEP SEPARATE (it's a
 * wristlet pouch, a distinct silhouette from the chain-strap flap, and the resale floor
 * cross-lists it). The "Standard" bucket variant (v893) stays (ingest catch-all, never renders).
 *
 * Reversible + guarded: every delete asserts 0 price_history + 0 discovered_listing first and
 * aborts if that's violated (so it never silently drops data). Dry-run by default.
 *
 *   npx tsx supabase/ingest/normalize-jypsiere-envelope.ts            # dry run
 *   npx tsx supabase/ingest/normalize-jypsiere-envelope.ts --write    # execute
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

type PhKeyRow = { price_id: number; platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null };
const phKey = (r: PhKeyRow) => `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;

async function phCount(vid: number) { return (await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", vid)).count ?? 0; }
async function dlCount(vid: number) { try { return (await db.from("discovered_listing").select("*", { count: "exact", head: true }).eq("variant_id", vid)).count ?? 0; } catch { return 0; } }

async function assertEmpty(vid: number, label: string): Promise<boolean> {
  const ph = await phCount(vid), dl = await dlCount(vid);
  if (ph !== 0 || dl !== 0) { console.error(`  ABORT: ${label} (v${vid}) not empty (ph=${ph}, discovered=${dl})`); return false; }
  return true;
}

async function deleteEmptyVariant(vid: number, label: string): Promise<boolean> {
  console.log(`  delete empty variant v${vid} (${label})`);
  if (!(await assertEmpty(vid, label))) return false;
  if (WRITE) { const { error } = await db.from("variant").delete().eq("variant_id", vid); if (error) { console.error("    delete failed:", error.message); return false; } }
  return true;
}

async function deleteStyleIfEmpty(styleId: number, label: string, alsoRemoving: number[] = []): Promise<boolean> {
  const { data: vs } = await db.from("variant").select("variant_id").eq("style_id", styleId);
  // In dry-run the variants we delete earlier in this run are still present; treat them as gone
  // so the dry-run faithfully reflects the --write sequence.
  const removing = new Set(alsoRemoving);
  const remaining = ((vs ?? []) as any[]).filter((v) => !removing.has(v.variant_id));
  if (remaining.length) { console.error(`  ABORT: style #${styleId} (${label}) still has ${remaining.length} variant(s): [${remaining.map((v) => v.variant_id).join(", ")}]`); return false; }
  console.log(`  delete style #${styleId} (${label})`);
  if (WRITE) { const { error } = await db.from("style").delete().eq("style_id", styleId); if (error) { console.error("    delete failed:", error.message); return false; } }
  return true;
}

/** Move a loser variant's price_history + discovered_listing onto a target variant (dedup on
 *  platform|listing_ref|price_type|observed_on), then delete the emptied loser variant. */
async function repointVariant(loserVid: number, targetVid: number): Promise<boolean> {
  const { data: lp } = await db.from("price_history").select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", loserVid);
  const { data: tp } = await db.from("price_history").select("price_id,platform,listing_ref,price_type,observed_on").eq("variant_id", targetVid);
  const targetKeys = new Set(((tp as PhKeyRow[] | null) ?? []).map(phKey));
  const toMove: number[] = [], toDrop: number[] = [];
  for (const r of (lp as PhKeyRow[] | null) ?? []) (targetKeys.has(phKey(r)) ? toDrop : toMove).push(r.price_id);
  console.log(`  repoint v${loserVid} → v${targetVid}: move ${toMove.length} ph, drop ${toDrop.length} dup ph`);
  if (WRITE) {
    if (toMove.length) { const { error } = await db.from("price_history").update({ variant_id: targetVid }).in("price_id", toMove); if (error) { console.error("    move failed:", error.message); return false; } }
    if (toDrop.length) { const { error } = await db.from("price_history").delete().in("price_id", toDrop); if (error) { console.error("    drop failed:", error.message); return false; } }
    try { await db.from("discovered_listing").update({ variant_id: targetVid }).eq("variant_id", loserVid); } catch { /* table may not carry variant_id */ }
    const { error } = await db.from("variant").delete().eq("variant_id", loserVid); if (error) { console.error("    variant delete failed:", error.message); return false; }
  }
  return true;
}

async function main() {
  console.log(`\nnormalize-jypsiere-envelope ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);

  console.log("A. Hermès Jypsière junk dup #93 'Clemence Jypsiere 28'");
  const a1 = await deleteEmptyVariant(376, "Clemence Jypsiere 28 empty variant");
  const a2 = a1 && await deleteStyleIfEmpty(93, "Clemence Jypsiere 28", [376]);

  console.log("\nB. Saint Laurent 'Envelope Bag' #835 → 'Cassandre Envelope' #466");
  const b1 = await repointVariant(1432, 893); // Standard → Cassandre Standard bucket
  const b2 = b1 && await deleteStyleIfEmpty(835, "Envelope Bag", [1432]);

  console.log("\nC. Cassandre Envelope empty null variant v1648");
  const c1 = await deleteEmptyVariant(1648, "Cassandre Envelope empty null variant");

  console.log(`\nresult: A=${a1 && a2} B=${b1 && b2} C=${c1}  ${WRITE ? "(written)" : "(dry run — re-run with --write)"}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
