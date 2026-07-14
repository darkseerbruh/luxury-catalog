/**
 * Second-wave structure fixes (hand-authored, high-confidence only — 0714 triage
 * of the 143 flagged name-embeds):
 *
 *  A. Merges the detector missed mechanically (its size vocab lacked 22/26/36 and
 *     the Sikkim/Negonda leathers; size-only residuals were held for judgment):
 *     each is a plain size/leather variant of its base, verified by hand.
 *  B. Rollback of ONE prior title-junk merge: #160 "…Neverfull Pochette Pouch"
 *     went into Neverfull, but the pouch is an ACCESSORY of the tote, not the
 *     tote — restore it as its own style (accessory-surface lane owns its future).
 *
 * Everything else in the flagged list stays KEEP by design (distinct sub-models).
 * DRY-RUN default; --apply executes + writes a rollback file.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

/** styleId → base style NAME (same brand), + attrs parsed from the junk name. */
const MERGES: { styleId: number; from: string; baseName: string; size?: string; material?: string }[] = [
  { styleId: 326, from: "Clemence Picotin 22", baseName: "Picotin", size: "22", material: "Clemence" },
  { styleId: 338, from: "Sikkim Double Sens 36", baseName: "Double Sens", size: "36", material: "Sikkim" },
  { styleId: 78, from: "Toile & Negonda Garden Party 36", baseName: "Garden Party", size: "36" }, // mixed toile/negonda → material stays null
  { styleId: 323, from: "Toile Herbag Zip 31", baseName: "Herbag", size: "31", material: "Toile" }, // consistent with the class-1 Herbag merges
  { styleId: 20, from: "City Steamer MM", baseName: "City Steamer", size: "MM" },
  { styleId: 65, from: "Medium Travel Ligne Tote", baseName: "Travel Ligne Tote", size: "Medium" },
  { styleId: 30, from: "Vintage Travel Ligne Tote", baseName: "Travel Ligne Tote" }, // "vintage" is not an axis
  { styleId: 83, from: "Vintage Travel Ligne Duffle Bag", baseName: "Travel Ligne Duffle Bag" },
  { styleId: 73, from: "Small Executive Cerf Tote", baseName: "Cerf Tote", size: "Small" }, // Cerf = the "Executive" tote
  { styleId: 82, from: "Large Business Affinity Tote", baseName: "Business Affinity", size: "Large" },
  { styleId: 106, from: "Medium Gabrielle Hobo", baseName: "Gabrielle", size: "Medium" }, // the hobo IS the core Gabrielle; Backpack stays its own
];

(async () => {
  const rollback: { movedVariants: { variantId: number; oldStyleId: number; prev: Record<string, unknown> }[]; deletedStyles: Record<string, unknown>[]; restored: number[] } = { movedVariants: [], deletedStyles: [], restored: [] };
  let merged = 0;

  for (const m of MERGES) {
    const { data: junk } = await db.from("style").select("style_id,name,brand_id").eq("style_id", m.styleId).maybeSingle();
    if (!junk || junk.name !== m.from) {
      console.log(`SKIP #${m.styleId}: name is ${JSON.stringify(junk?.name)} (expected ${JSON.stringify(m.from)})`);
      continue;
    }
    const { data: base } = await db.from("style").select("style_id,name").eq("brand_id", junk.brand_id).eq("name", m.baseName).maybeSingle();
    if (!base) {
      console.log(`SKIP #${m.styleId}: no base style named ${JSON.stringify(m.baseName)} in brand ${junk.brand_id}`);
      continue;
    }
    console.log(`MERGE #${m.styleId} "${m.from}" -> #${base.style_id} "${base.name}"${m.size ? ` +size=${m.size}` : ""}${m.material ? ` +material=${m.material}` : ""}`);
    if (!APPLY) continue;

    const { data: vars } = await db.from("variant").select("variant_id, size_label, exterior_material_id").eq("style_id", m.styleId);
    for (const v of vars ?? []) {
      const patch: Record<string, unknown> = { style_id: base.style_id };
      if (!v.size_label && m.size) patch.size_label = m.size;
      if (v.exterior_material_id == null && m.material) {
        const { data: mat } = await db.from("material").select("material_id").ilike("name", m.material).maybeSingle();
        if (mat) patch.exterior_material_id = mat.material_id;
      }
      rollback.movedVariants.push({ variantId: v.variant_id, oldStyleId: m.styleId, prev: { size_label: v.size_label, exterior_material_id: v.exterior_material_id } });
      await db.from("variant").update(patch).eq("variant_id", v.variant_id);
    }
    for (const table of ["resource", "production_option"]) {
      const { data: kids } = await db.from(table).select("*").eq("style_id", m.styleId);
      for (const k of kids ?? []) {
        const idKey = Object.keys(k).find((c) => c.endsWith("_id") && c !== "style_id") ?? "id";
        await db.from(table).update({ style_id: base.style_id }).eq(idKey, k[idKey]);
      }
    }
    const { data: full } = await db.from("style").select("*").eq("style_id", m.styleId).single();
    const { error } = await db.from("style").delete().eq("style_id", m.styleId);
    if (error) console.warn(`  ! delete #${m.styleId}: ${error.message}`);
    else { rollback.deletedStyles.push(full as Record<string, unknown>); merged++; }
  }

  // ── B. Un-merge #160 (Neverfull Pochette Pouch is an accessory, not the tote) ──
  const rb = JSON.parse(readFileSync(path.resolve(process.cwd(), "scripts/ux-restructure/rollback-title-junk.json"), "utf8"));
  const deleted160 = (rb.deletedStyles ?? []).find((s: { style_id: number }) => s.style_id === 160);
  const moved160 = (rb.movedVariants ?? []).filter((v: { oldStyleId: number }) => v.oldStyleId === 160);
  if (deleted160) {
    console.log(`RESTORE style #160 "${deleted160.name}" (+ ${moved160.length} variant(s) back) — pouch ≠ tote`);
    if (APPLY) {
      const { error: insErr } = await db.from("style").insert(deleted160);
      if (insErr && !/duplicate/i.test(insErr.message)) console.warn(`  ! restore #160: ${insErr.message}`);
      for (const mv of moved160) {
        await db.from("variant").update({ style_id: 160, ...mv.prev }).eq("variant_id", mv.variantId);
        rollback.restored.push(mv.variantId);
      }
    }
  } else {
    console.log("RESTORE #160: not found in rollback-title-junk.json (already restored?)");
  }

  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-second-wave.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED: ${merged} merges + #160 restore. Rollback -> ${out}`);
  } else {
    console.log("\nDRY-RUN. Re-run with --apply.");
  }
})();
