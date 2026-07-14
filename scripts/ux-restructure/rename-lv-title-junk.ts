/**
 * Hand-authored renames for the 5 LV title-junk styles whose titles contain a REAL
 * model name (0714 audit class 2). A rename keeps the style row, its variant, and
 * every price row — only the identity string is corrected, and the parsed
 * colour/material/size move onto the variant where empty.
 *
 * Sources for the model names (verified against the titles themselves — the model
 * word is IN the seller title, we are not inventing):
 *   #186 "…Monogram Vernis Thompson Street Bag" → Thompson Street (Vernis line)
 *   #161 "…Canvas Antigua Cabas PM Bag"        → Antigua Cabas
 *   #165 "…Monogram Canvas Boetie MM Bag"      → Boétie
 *   #181 "…Epi Leather Pegase 50 Luggage"      → Pégase
 *   #187 "…Cream Suhali Leather Le Majestueux" → Le Majestueux (Suhali line)
 *
 * DRY-RUN default; --apply executes + writes a rollback file.
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { colorFamily } from "@/lib/listings-taxonomy";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const PLAN: { styleId: number; from: string; to: string; colour?: string; material?: string; size?: string }[] = [
  { styleId: 186, from: "Louis Vuitton Mango Monogram Vernis Thompson Street Bag", to: "Thompson Street", colour: "Mango", material: "Vernis" },
  { styleId: 161, from: "Louis Vuitton Brown/Red Canvas Antigua Cabas PM Bag", to: "Antigua Cabas", colour: "Brown", size: "PM" },
  { styleId: 165, from: "Louis Vuitton Monogram Canvas Boetie MM Bag", to: "Boétie", material: "Monogram", size: "MM" },
  { styleId: 181, from: "Louis Vuitton Black Epi Leather Pegase 50 Luggage", to: "Pégase", colour: "Black", material: "Epi", size: "50" },
  { styleId: 187, from: "Louis Vuitton Cream Suhali Leather Le Majestueux Bag", to: "Le Majestueux", colour: "Cream", material: "Suhali" },
];

(async () => {
  const rollback: { styleId: number; oldName: string; variants: { variantId: number; prev: Record<string, unknown> }[] }[] = [];
  for (const p of PLAN) {
    const { data: s } = await db.from("style").select("style_id,name").eq("style_id", p.styleId).single();
    if (!s || s.name !== p.from) {
      console.log(`SKIP #${p.styleId}: name is ${JSON.stringify(s?.name)} (expected ${JSON.stringify(p.from)})`);
      continue;
    }
    console.log(`RENAME #${p.styleId} "${p.from}" -> "${p.to}"` +
      `${p.colour ? ` +colour=${p.colour}` : ""}${p.material ? ` +material=${p.material}` : ""}${p.size ? ` +size=${p.size}` : ""}`);
    if (!APPLY) continue;

    const entry: (typeof rollback)[number] = { styleId: p.styleId, oldName: s.name, variants: [] };
    await db.from("style").update({ name: p.to }).eq("style_id", p.styleId);
    const { data: vars } = await db
      .from("variant")
      .select("variant_id, exterior_colorway, exterior_material_id, size_label")
      .eq("style_id", p.styleId);
    for (const v of vars ?? []) {
      const patch: Record<string, unknown> = {};
      const fam = p.colour ? colorFamily(p.colour) : null;
      if (!v.exterior_colorway && fam) patch.exterior_colorway = fam;
      if (!v.size_label && p.size) patch.size_label = p.size;
      if (v.exterior_material_id == null && p.material) {
        const { data: found } = await db.from("material").select("material_id").ilike("name", p.material).maybeSingle();
        if (found) patch.exterior_material_id = found.material_id;
      }
      if (Object.keys(patch).length > 0) {
        entry.variants.push({ variantId: v.variant_id, prev: { exterior_colorway: v.exterior_colorway, exterior_material_id: v.exterior_material_id, size_label: v.size_label } });
        await db.from("variant").update(patch).eq("variant_id", v.variant_id);
      }
    }
    rollback.push(entry);
  }
  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-lv-renames.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED ${rollback.length} renames. Rollback -> ${out}`);
  } else {
    console.log("\nDRY-RUN. Re-run with --apply.");
  }
})();
