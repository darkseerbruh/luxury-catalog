/**
 * Identity fix for Chanel style #79 (0714 audit §11 lane). The row was seeded
 * from a raw 2022 TRR seller dump (ref CHA674812) with the listing text as its
 * "description" and a bare variant. Seed photos pulled from data/raw
 * (therealreal_data-1.csv, Photos column) and LOOKED AT; archivist web pass
 * 2026-07-14 confirmed the reseller-consensus family:
 *
 * - RENAME #79 "Vintage Quilted Shoulder Bag" -> "Vintage CC Charm Tote"
 *   (Rebag carries it as a formal taxonomy family HB.CH.VCCCT.QULA.*; myGemma,
 *   eBay, 1stDibs concur; Chanel has no official name for it — Regime B).
 * - style.closure_type -> "zip top" (photos + seed text: zip closure at top).
 * - v361 from the photos: colorway Red, material Lambskin (photo read),
 *   hardware gold, strap_type "16" -> "chain with leather weave" (the 16 was
 *   the CSV strap-DROP measurement mis-mapped into strap_type).
 * - bag_alias: keep the old TRR title + the short family name searchable.
 * - Description is NOT written here — it goes through the review-gated
 *   apply-style-depth.ts flow (supabase/ingest/data/style-depth-79.json).
 *   The old seller-dump description is preserved in the rollback file.
 * - year fields stay null (era read is seller attribution only). No image_url:
 *   dead-listing TRR photos are identity evidence, not display assets.
 *
 * DRY-RUN default; --apply executes + writes rollback-style-79.json.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

(async () => {
  const rollback: {
    style: Record<string, unknown> | null;
    variants: { variantId: number; prev: Record<string, unknown> }[];
    aliases: Record<string, unknown>[];
  } = { style: null, variants: [], aliases: [] };

  // --- style #79: rename + closure (guarded on the current junk state) ------
  const { data: s79 } = await db.from("style").select("*").eq("style_id", 79).maybeSingle();
  if (!s79) { console.error("style 79 not found — aborting"); process.exit(1); }
  if (s79.name !== "Vintage Quilted Shoulder Bag") {
    console.log(`SKIP style: name is ${JSON.stringify(s79.name)} (already fixed?)`);
  } else {
    console.log(`RENAME #79 "${s79.name}" -> "Vintage CC Charm Tote" + closure_type "zip top"`);
    if (APPLY) {
      rollback.style = s79 as Record<string, unknown>;
      const { error } = await db
        .from("style")
        .update({ name: "Vintage CC Charm Tote", closure_type: "zip top" })
        .eq("style_id", 79);
      if (error) console.warn(`  ! style update: ${error.message}`);
    }
  }

  // --- v361 attributes from the seed photos ---------------------------------
  const { data: lamb } = await db.from("material").select("material_id").eq("name", "Lambskin").maybeSingle();
  const { data: v361 } = await db
    .from("variant")
    .select("variant_id, exterior_colorway, exterior_material_id, hardware_color, strap_type")
    .eq("variant_id", 361)
    .maybeSingle();
  if (v361) {
    const patch: Record<string, unknown> = {};
    if (!v361.exterior_colorway) patch.exterior_colorway = "Red";
    if (v361.exterior_material_id == null && lamb) patch.exterior_material_id = lamb.material_id;
    if (!v361.hardware_color) patch.hardware_color = "gold";
    if (v361.strap_type === "16") patch.strap_type = "chain with leather weave";
    if (Object.keys(patch).length) {
      console.log(`FIX    v361 ${JSON.stringify(patch)} (photos: red quilted lambskin, gold woven chains; 16 = strap drop, not a type)`);
      if (APPLY) {
        rollback.variants.push({
          variantId: 361,
          prev: {
            exterior_colorway: v361.exterior_colorway,
            exterior_material_id: v361.exterior_material_id,
            hardware_color: v361.hardware_color,
            strap_type: v361.strap_type,
          },
        });
        const { error } = await db.from("variant").update(patch).eq("variant_id", 361);
        if (error) console.warn(`  ! variant update: ${error.message}`);
      }
    } else console.log("SKIP v361: nothing to patch");
  }

  // --- aliases: old title + short family name stay searchable ---------------
  const aliasRows = [
    { brand: "Chanel", canonical_model: "Vintage CC Charm Tote", tier: null, alias: "CC Charm Tote", source_type: "reseller", source: "rebag", listing_count: 1 },
    { brand: "Chanel", canonical_model: "Vintage CC Charm Tote", tier: null, alias: "Vintage Quilted Shoulder Bag", source_type: "reseller", source: "therealreal", listing_count: 1 },
  ];
  for (const r of aliasRows) {
    const { data: existing } = await db
      .from("bag_alias")
      .select("id")
      .eq("brand", r.brand)
      .eq("canonical_model", r.canonical_model)
      .eq("alias", r.alias)
      .limit(1);
    if (existing?.length) { console.log(`SKIP alias "${r.alias}" (already present)`); continue; }
    console.log(`ALIAS  ${r.alias} (${r.source}) -> Vintage CC Charm Tote`);
    if (APPLY) {
      const { error } = await db.from("bag_alias").insert([r]);
      if (error) console.warn(`  ! alias insert: ${error.message}`);
      else rollback.aliases.push(r);
    }
  }

  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-style-79.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED. Rollback -> ${out}`);
    console.log("Now run: npx tsx supabase/ingest/apply-style-depth.ts supabase/ingest/data/style-depth-79.json --write");
  } else console.log("\nDRY-RUN. Re-run with --apply.");
})();
