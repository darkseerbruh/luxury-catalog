/**
 * Image pass for the 4 interim-named Chanel rows (0714 audit §6, "image first").
 * Seed photos recovered from the 2022 TLC export (data/raw, Photos column) and
 * LOOKED AT (owner rule: verify visually, never by slug alone). Verdicts:
 *
 * - #167 "Vintage Chevron Flap" → MERGE into Classic Flap (#1). Photo: chevron-
 *   quilted classic double flap, CC turnlock, leather-woven gold chain. Chevron
 *   is a quilting OPTION of the Classic Flap (FP/TRR file these under Classic/
 *   Double Flap; the dictionary agrees) — a variant-level trait wearing a style name.
 * - #178 "Quilted Flap Shoulder Bag" → KEEP style, FIX variant material: photo
 *   shows grained CAVIAR (not the recorded lambskin), Mademoiselle TURNLOCK, flat
 *   leather crossbody strap. NOT the same bag as #185 (push-lock + chain strap) —
 *   no merge, and no confident model name yet (needs archivist web research; the
 *   interim name stays honest). Its one kept eBay comp ("…Lambskin…Chain Shoulder
 *   Bag") contradicts the sharpened identity → preserve-then-delete to discovered.
 * - #189 "Caviar CC Tote" → RENAME "Vintage Front Pocket Tote". Photo: 90s caviar
 *   open-top shopper, front slip pocket with CC-turnlock flap, double woven chains.
 *   None of the audit's four guesses (GST/Medallion/PST/Cerf). New name also stops
 *   baking the material into the style name (class-1 hygiene).
 * - #191 "Chanel Black Leather Shoulder Flap Bag" → RENAME "Vintage Full Flap"
 *   (+ variant colour/material from the photo: black lambskin, flap covers the
 *   whole front, CC turnlock at the bottom edge). The tentative merge → #79 is
 *   REFUSED: #79's own description is a RED zip-top chain bag — different bag.
 *   This clears the LAST seller-title row in the daily structure check.
 *
 * DRY-RUN default; --apply executes + writes rollback-image-pass.json.
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
    renamed: { styleId: number; oldName: string }[];
    variants: { variantId: number; prev: Record<string, unknown> }[];
    deletedStyles: Record<string, unknown>[];
    movedComps: Record<string, unknown>[];
  } = { renamed: [], variants: [], deletedStyles: [], movedComps: [] };

  // --- #167 → merge into Classic Flap (#1) ---------------------------------
  const { data: s167 } = await db.from("style").select("style_id,name").eq("style_id", 167).maybeSingle();
  const { data: s1 } = await db.from("style").select("style_id,name").eq("style_id", 1).maybeSingle();
  if (s167?.name === "Vintage Chevron Flap" && s1?.name === "Classic Flap") {
    console.log(`MERGE  #167 "Vintage Chevron Flap" -> #1 "Classic Flap" (v470 rides over, chevron = quilting option)`);
    if (APPLY) {
      const { data: vars } = await db.from("variant").select("variant_id, style_id").eq("style_id", 167);
      for (const v of vars ?? []) {
        rollback.variants.push({ variantId: v.variant_id, prev: { style_id: v.style_id } });
        await db.from("variant").update({ style_id: 1 }).eq("variant_id", v.variant_id);
      }
      const { data: full } = await db.from("style").select("*").eq("style_id", 167).single();
      const { error } = await db.from("style").delete().eq("style_id", 167);
      if (error) console.warn(`  ! delete #167: ${error.message}`);
      else rollback.deletedStyles.push(full as Record<string, unknown>);
    }
  } else console.log(`SKIP #167 merge: names ${JSON.stringify(s167?.name)} / ${JSON.stringify(s1?.name)}`);

  // --- #178 → variant material fix + evict the contradicted comp ------------
  const { data: mat } = await db.from("material").select("material_id").ilike("name", "Caviar").maybeSingle();
  const { data: v480 } = await db.from("variant").select("variant_id, exterior_material_id").eq("variant_id", 480).maybeSingle();
  if (v480 && mat) {
    console.log(`FIX    v480 (#178) material -> Caviar (photo: grained caviar, was ${v480.exterior_material_id})`);
    if (APPLY) {
      rollback.variants.push({ variantId: 480, prev: { exterior_material_id: v480.exterior_material_id } });
      await db.from("variant").update({ exterior_material_id: mat.material_id }).eq("variant_id", 480);
    }
  }
  const { data: comp } = await db.from("price_history").select("*").eq("price_id", 402048).maybeSingle();
  if (comp && comp.variant_id === 480) {
    console.log(`EVICT  comp #402048 off v480 ("…Lambskin…Chain Shoulder Bag" ≠ caviar flat-strap turnlock flap)`);
    if (APPLY) {
      await db.from("discovered_listing").upsert(
        [{
          platform: comp.platform, listing_ref: comp.listing_ref, source_url: comp.source_url,
          raw_name: comp.notes, brand_guess: "Chanel", style_guess: null,
          colorway: comp.colorway, material: comp.material, hardware_color: comp.hardware_color,
          production_year: comp.production_year, season: comp.season,
          price_type: comp.price_type ?? "listed", sale_price: comp.sale_price,
          currency: comp.currency ?? "USD", condition: comp.condition,
          unresolved_reason: "no_style", observed_on: comp.observed_on,
        }],
        { onConflict: "platform,listing_ref,observed_on,sale_price", ignoreDuplicates: true },
      );
      const { error } = await db.from("price_history").delete().eq("price_id", 402048);
      if (error) console.warn(`  ! delete comp: ${error.message}`);
      else rollback.movedComps.push(comp as Record<string, unknown>);
    }
  }

  // --- #189 + #191 renames ---------------------------------------------------
  const RENAMES = [
    { styleId: 189, from: "Caviar CC Tote", to: "Vintage Front Pocket Tote" },
    { styleId: 191, from: "Chanel Black Leather Shoulder Flap Bag", to: "Vintage Full Flap" },
  ];
  for (const r of RENAMES) {
    const { data: s } = await db.from("style").select("style_id,name").eq("style_id", r.styleId).maybeSingle();
    if (!s || s.name !== r.from) { console.log(`SKIP rename #${r.styleId}: name ${JSON.stringify(s?.name)}`); continue; }
    console.log(`RENAME #${r.styleId} "${r.from}" -> "${r.to}"`);
    if (APPLY) {
      rollback.renamed.push({ styleId: r.styleId, oldName: s.name });
      await db.from("style").update({ name: r.to }).eq("style_id", r.styleId);
    }
  }

  // --- #191 variant attributes from the photo -------------------------------
  const { data: lamb } = await db.from("material").select("material_id").ilike("name", "Lambskin").maybeSingle();
  const { data: v492 } = await db.from("variant").select("variant_id, exterior_colorway, exterior_material_id").eq("variant_id", 492).maybeSingle();
  if (v492 && (!v492.exterior_colorway || v492.exterior_material_id == null)) {
    const patch: Record<string, unknown> = {};
    if (!v492.exterior_colorway) patch.exterior_colorway = "Black";
    if (v492.exterior_material_id == null && lamb) patch.exterior_material_id = lamb.material_id;
    console.log(`FIX    v492 (#191) ${JSON.stringify(patch)} (photo: black lambskin)`);
    if (APPLY) {
      rollback.variants.push({ variantId: 492, prev: { exterior_colorway: v492.exterior_colorway, exterior_material_id: v492.exterior_material_id } });
      await db.from("variant").update(patch).eq("variant_id", 492);
    }
  }

  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-image-pass.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED. Rollback -> ${out}`);
  } else console.log("\nDRY-RUN. Re-run with --apply.");
})();
