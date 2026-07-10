/**
 * Miu Miu Fashionphile DATA cleanup (DB-only follow-up to the FP-adapter size-bug fix).
 * The adapter code is already fixed on main (selectTarget picks the most-specific target,
 * Matelassé excludes coffer/bucket/softy/beau/ivy/sandal/pouch). This pass cleans the
 * EXISTING rows the code fix could not touch. Miu Miu brand only.
 *
 *   npx tsx supabase/ingest/cleanup-miu-miu-fp-variants.ts            # dry run (prints full plan)
 *   npx tsx supabase/ingest/cleanup-miu-miu-fp-variants.ts --write    # execute
 *
 * THREE messes cleaned (verified from live rows 2026-07-10):
 *  1) STRANDED pre-fix rows on size-less Standard buckets → re-point to the sized variant
 *     the FIXED adapter now targets (SAME STYLE):
 *       Wander Std v1047     → Small v1400 / Mini v1399 (Micro/plain stay Standard).
 *       Aventure Std v1049   → Regular v1402 / Medium v1403 (mini/small/large/plain stay).
 *       Arcadie Std v1048    → Large v1404 (curated single bucket; ALL arcadie fold to Large).
 *  2) DUPLICATE variants across scaffold generations (SAME-STYLE fold, delete emptied loser):
 *       Arcadie Small v2295  → Large v1404
 *       Aventure Mini v2296  → Standard v1049  (no dedicated mini variant → lives on Standard)
 *       Ivy ∅ v1117          → Standard v1401
 *       Beau ∅ v1118         → Large v1406
 *       Coffer ∅ v1119       → Standard v1850
 *  3) Rows MISLABELED onto Matelassé v1050 before the fix (re-point by EXPLICIT token to the
 *     correct existing style — reviewed, not a blind selectTarget sweep):
 *       token "coffer"       → Coffer  v1850
 *       token "bucket"       → Bucket  v1120
 *       token "sandal(s)"    → DELETE  (footwear, never a valid bag comp)
 *       token "pouch"        → discovered_listing (no Miu Miu Pouch style exists → bank as evidence)
 *       eBay sold p426832 "Arcadie Matelassé" → Arcadie Large v1404 (single reviewed row, clear notes)
 *       everything else stays on Matelassé.
 *
 * Re-point + dedup mirrors supabase/ingest/merge-style-pairs.ts:
 *   dedup key = platform|listing_ref|price_type|observed_on. MOVE (re-point variant_id),
 *   never delete a real comp (sole delete exception: the matelassé sandals). Idempotent.
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const MIU_MIU_BRAND_ID = 413;

type Ph = {
  price_id: number; variant_id: number; platform: string | null; listing_ref: string | null;
  price_type: string | null; observed_on: string | null; date_recorded: string | null;
  sale_price: number | null; currency: string | null; source_url: string | null; notes: string | null;
  colorway: string | null; material: string | null; hardware_color: string | null;
  production_year: number | null; season: string | null; inclusions: string | null;
  condition_detail: string | null; region: string | null; size_label?: never;
};
const PH_COLS =
  "price_id,variant_id,platform,listing_ref,price_type,observed_on,date_recorded,sale_price,currency,source_url,notes,colorway,material,hardware_color,production_year,season,inclusions,condition_detail,region";

const phKey = (r: Ph) => `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;
// token set from every text field that can carry the model/size token (handle lives in
// source_url on old rows, in listing_ref on some, in notes on the newer titled rows).
const tokens = (r: Ph) =>
  new Set(
    `${r.listing_ref ?? ""} ${r.source_url ?? ""} ${r.notes ?? ""}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );

type Action =
  | { kind: "keep" }
  | { kind: "move"; to: number; why: string }
  | { kind: "delete"; why: string }
  | { kind: "discovered"; why: string };

// Per SOURCE-variant row classifier. Returns where each row should go.
function classify(sourceVariant: number, r: Ph): Action {
  const t = tokens(r);
  switch (sourceVariant) {
    case 1047: // Wander Standard → Small / Mini (Micro & plain stay Standard)
      if (t.has("small")) return { kind: "move", to: 1400, why: "small→Small v1400" };
      if (t.has("mini")) return { kind: "move", to: 1399, why: "mini→Mini v1399" };
      return { kind: "keep" }; // micro / softy / wicker / plain / regular
    case 1049: // Aventure Standard → Regular / Medium (mini/small/large/plain stay)
      if (t.has("regular")) return { kind: "move", to: 1402, why: "regular→Regular v1402" };
      if (t.has("medium")) return { kind: "move", to: 1403, why: "medium→Medium v1403" };
      return { kind: "keep" };
    case 1048: // Arcadie Standard → Large (curated single bucket; every arcadie folds to Large)
      return { kind: "move", to: 1404, why: "arcadie→Large v1404" };
    case 2295: // Arcadie Small (dup) → Large
      return { kind: "move", to: 1404, why: "dup Small→Large v1404" };
    case 2296: // Aventure Mini (dup) → Standard (no dedicated mini variant)
      return { kind: "move", to: 1049, why: "dup Mini→Standard v1049" };
    case 1117: // Ivy ∅ (dup) → Standard
      return { kind: "move", to: 1401, why: "dup ∅→Standard v1401" };
    case 1118: // Beau ∅ (dup) → Large
      return { kind: "move", to: 1406, why: "dup ∅→Large v1406" };
    case 1119: // Coffer ∅ (dup) → Standard
      return { kind: "move", to: 1850, why: "dup ∅→Standard v1850" };
    case 1050: // Matelassé mislabels
      if (r.price_id === 426832) return { kind: "move", to: 1404, why: "eBay 'Arcadie Matelassé' sold→Arcadie v1404" };
      if (t.has("sandal") || t.has("sandals")) return { kind: "delete", why: "footwear (not a handbag)" };
      if (t.has("coffer")) return { kind: "move", to: 1850, why: "coffer→Coffer v1850" };
      if (t.has("bucket")) return { kind: "move", to: 1120, why: "bucket→Bucket v1120" };
      if (t.has("pouch")) return { kind: "discovered", why: "matelassé Pouch (no style) → discovered_listing" };
      return { kind: "keep" };
    default:
      return { kind: "keep" };
  }
}

// Source variants to scan, in order. Variants that fully empty are deleted afterwards.
const SOURCE_VARIANTS = [1047, 1049, 1048, 2295, 2296, 1117, 1118, 1119, 1050];
const DELETE_IF_EMPTY = [1048, 2295, 2296, 1117, 1118, 1119]; // full folds → loser removed

async function targetKeySet(variantId: number): Promise<Set<string>> {
  const { data } = await db.from("price_history").select(PH_COLS).eq("variant_id", variantId);
  return new Set(((data as Ph[] | null) ?? []).map(phKey));
}

async function main() {
  console.log(`\nMiu Miu FP variant cleanup ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);

  // guard: only touch Miu Miu variants
  const { data: mmVariants } = await db
    .from("variant")
    .select("variant_id, style:style_id(brand_id,name)")
    .in("style_id",
      (await db.from("style").select("style_id").eq("brand_id", MIU_MIU_BRAND_ID)).data?.map((s) => s.style_id) ?? []);
  const mmVariantIds = new Set((mmVariants ?? []).map((v) => v.variant_id));
  // Only touch variants that (a) still exist and (b) are Miu Miu. Already-deleted dup losers
  // from a prior run are simply skipped, so re-running is idempotent (no-op).
  const liveSources = SOURCE_VARIANTS.filter((v) => mmVariantIds.has(v));
  const skipped = SOURCE_VARIANTS.filter((v) => !mmVariantIds.has(v));
  if (skipped.length) console.log(`(skipping already-removed source variants: ${skipped.map((v) => `v${v}`).join(", ")})\n`);

  let moved = 0, dropped = 0, deletedRows = 0, deletedVariants = 0, banked = 0, kept = 0;
  const targetKeys = new Map<number, Set<string>>(); // lazily-loaded, updated as we move

  for (const sv of liveSources) {
    const { data: rowsRaw } = await db.from("price_history").select(PH_COLS).eq("variant_id", sv).order("price_id");
    const rows = (rowsRaw as Ph[] | null) ?? [];
    console.log(`── source v${sv}: ${rows.length} rows`);

    // bucket the actions for a compact plan
    const tally: Record<string, number> = {};
    const moveByTarget = new Map<number, Ph[]>();
    const toDelete: Ph[] = [];
    const toBank: Ph[] = [];
    for (const r of rows) {
      const a = classify(sv, r);
      const label = a.kind === "move" ? `move ${a.why}` : a.kind === "keep" ? "keep" : a.kind === "delete" ? `delete (${a.why})` : `discovered (${a.why})`;
      tally[label] = (tally[label] ?? 0) + 1;
      if (a.kind === "move") (moveByTarget.get(a.to) ?? moveByTarget.set(a.to, []).get(a.to)!).push(r);
      else if (a.kind === "delete") toDelete.push(r);
      else if (a.kind === "discovered") toBank.push(r);
      else kept++;
    }
    for (const [k, n] of Object.entries(tally)) console.log(`     ${n.toString().padStart(3)} × ${k}`);

    // MOVES — re-point with dedup against target (+ dedup among movers themselves)
    for (const [to, movers] of moveByTarget) {
      if (!targetKeys.has(to)) targetKeys.set(to, await targetKeySet(to));
      const seen = targetKeys.get(to)!;
      const doMove: number[] = [], doDrop: number[] = [];
      for (const r of movers) {
        const k = phKey(r);
        if (seen.has(k)) doDrop.push(r.price_id);
        else { doMove.push(r.price_id); seen.add(k); }
      }
      console.log(`       → v${to}: ${doMove.length} re-point, ${doDrop.length} drop-as-dup`);
      if (WRITE) {
        for (let i = 0; i < doMove.length; i += 500) {
          const { error } = await db.from("price_history").update({ variant_id: to }).in("price_id", doMove.slice(i, i + 500));
          if (error) console.error("       move err:", error.message);
        }
        for (let i = 0; i < doDrop.length; i += 500) {
          const { error } = await db.from("price_history").delete().in("price_id", doDrop.slice(i, i + 500));
          if (error) console.error("       drop err:", error.message);
        }
      }
      moved += doMove.length; dropped += doDrop.length;
    }

    // DELETES — true non-handbags only
    if (toDelete.length) {
      console.log(`       ✗ delete ${toDelete.length}: ${toDelete.map((r) => `#${r.price_id}`).join(", ")}`);
      if (WRITE) {
        const ids = toDelete.map((r) => r.price_id);
        for (let i = 0; i < ids.length; i += 500) {
          const { error } = await db.from("price_history").delete().in("price_id", ids.slice(i, i + 500));
          if (error) console.error("       delete err:", error.message);
        }
      }
      deletedRows += toDelete.length;
    }

    // DISCOVERED — bank as evidence (no style fits), then remove the price_history row
    for (const r of toBank) {
      const observed_on = r.observed_on ?? r.date_recorded;
      if (!observed_on || r.sale_price == null || !r.platform || !r.listing_ref) {
        console.error(`       skip bank #${r.price_id}: missing required field`); continue;
      }
      console.log(`       ⇢ discovered #${r.price_id} «${(r.notes ?? "").slice(0, 40)}»`);
      if (WRITE) {
        const { error: insErr } = await db.from("discovered_listing").upsert(
          {
            platform: r.platform, listing_ref: r.listing_ref, source_url: r.source_url, raw_name: r.notes,
            brand_guess: "Miu Miu", style_guess: null, matched_brand_id: MIU_MIU_BRAND_ID, matched_style_id: null,
            colorway: r.colorway, material: r.material, hardware_color: r.hardware_color,
            production_year: r.production_year, season: r.season, inclusions: r.inclusions,
            condition_detail: r.condition_detail, region: r.region,
            price_type: r.price_type ?? "listed", sale_price: r.sale_price, currency: r.currency ?? "USD",
            unresolved_reason: "no_style", observed_on,
          },
          { onConflict: "platform,listing_ref,observed_on,sale_price", ignoreDuplicates: true }
        );
        if (insErr) { console.error(`       bank err #${r.price_id}:`, insErr.message); continue; }
        const { error: delErr } = await db.from("price_history").delete().eq("price_id", r.price_id);
        if (delErr) { console.error(`       bank-delete err #${r.price_id}:`, delErr.message); continue; }
      }
      banked++;
    }
  }

  // delete emptied loser variants
  console.log(`\n── empty-variant cleanup`);
  for (const v of DELETE_IF_EMPTY) {
    if (!mmVariantIds.has(v)) continue; // already removed by a prior run
    const { count } = await db.from("price_history").select("price_id", { count: "exact", head: true }).eq("variant_id", v);
    if ((count ?? 0) > 0) { console.log(`     v${v}: ${count} rows remain — NOT deleting`); continue; }
    console.log(`     v${v}: empty → delete variant`);
    if (WRITE) {
      // re-point any discovered_listing promotions off the dying variant first
      await db.from("discovered_listing").update({ promoted_variant_id: null }).eq("promoted_variant_id", v);
      const { error } = await db.from("variant").delete().eq("variant_id", v);
      if (error) console.error(`     variant delete err v${v}:`, error.message); else deletedVariants++;
    }
  }

  console.log(
    `\n${WRITE ? "DONE" : "DRY RUN"} — moved ${moved}, dropped-as-dup ${dropped}, deleted rows ${deletedRows}, banked→discovered ${banked}, kept ${kept}, variants deleted ${deletedVariants}.\n`
  );
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
