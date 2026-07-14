/**
 * Apply the archivist's 0714 identifications for the Chanel title-junk styles
 * (research table in docs/catalog-structure-audit-0714.md §2 + the archivist run).
 *
 * - 2 MERGES (high/med-high): #136 → Chanel 19, #150 → Top Handle Rectangular Flap.
 * - 8 RENAMES to the reseller/collector-consensus line name (these are labels,
 *   not official Chanel names — Chanel seasonal has only style codes; hedge lives
 *   in the style description elsewhere, not the name).
 * - 4 LOW-CONFIDENCE rows (#167 #178 #189 #191) held: 3 get clean interim names
 *   (still honest, no seller-title junk), #191 untouched pending the image pass.
 * - Where the archivist sourced a year, style.year_introduced fills IF NULL.
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

const MERGES: { styleId: number; from: string; targetId: number; targetName: string; colour?: string; material?: string; size?: string }[] = [
  { styleId: 136, from: "Chanel Pink Tweed 19 Large Flap Bag", targetId: 425, targetName: "Chanel 19", colour: "Pink", material: "Tweed", size: "Large" },
  { styleId: 150, from: "Chanel Light Blue Quilted Lambskin Leather Mini Top Handle Flap Bag", targetId: 906, targetName: "Top Handle Rectangular Flap", colour: "Light Blue", material: "Lambskin", size: "Mini" },
];

const RENAMES: { styleId: number; from: string; to: string; colour?: string; material?: string; size?: string; year?: number }[] = [
  { styleId: 69, from: "Large Leather Patchwork Brooklyn Cabas", to: "Brooklyn Cabas", colour: "Black", size: "Large", year: 2007 },
  { styleId: 145, from: "Chanel Charcoal Grey Quilted Patent Leather Golden Class Accordion Flap Bag", to: "Golden Class Double CC Flap", colour: "Charcoal Grey", material: "Patent", size: "Medium", year: 2014 },
  { styleId: 153, from: "Chanel Black Quilted Shiny Lambskin Leather Small Bowling Bag", to: "Fashion Therapy Bowling Bag", colour: "Black", material: "Lambskin", size: "Small", year: 2020 },
  { styleId: 185, from: "Chanel Beige Quilted Leather Mademoiselle Lock Shoulder Bag", to: "Mademoiselle Lock Flap", colour: "Beige", material: "Lambskin" },
  { styleId: 50, from: "Printed Denim Large Flap Bag", to: "Denim Graffiti Flap", colour: "Blue", material: "Denim", size: "Large", year: 2022 },
  { styleId: 76, from: "2021 Quilted Sponge Flap Bag", to: "Terrycloth Flap", material: "Terry Cloth", year: 2021 },
  { styleId: 138, from: "Chanel Beige Quilted Leather Button Top Flap Bag", to: "Button On Top Flap", colour: "Beige", material: "Lambskin", year: 2020 },
  { styleId: 158, from: "Chanel Red Quilted Leather CC Waist Bag", to: "Quilted CC Belt Bag", colour: "Red", material: "Lambskin" },
  // Interim names for the image-review rows (clean, honest, no merge):
  { styleId: 167, from: "Chanel Black Leather Chevron Flap Bag", to: "Vintage Chevron Flap", colour: "Black", material: "Lambskin" },
  { styleId: 178, from: "Chanel Leather Beige Quilted Leather Flap Shoulder Bag", to: "Quilted Flap Shoulder Bag", colour: "Beige", material: "Lambskin" },
  { styleId: 189, from: "Chanel Black Caviar Leather Tote Bag", to: "Caviar CC Tote", colour: "Black", material: "Caviar" },
  // #191 left untouched pending the image pass (tentative merge target: style 79).
];

async function matId(name: string): Promise<number | null> {
  const { data } = await db.from("material").select("material_id").ilike("name", name).maybeSingle();
  if (data) return data.material_id;
  if (!APPLY) return -1;
  const type = /denim|terry|tweed|cloth/i.test(name) ? "fabric" : "leather";
  const { data: ins, error } = await db.from("material").insert({ name, material_type: type }).select("material_id").single();
  if (error) { console.warn(`  ! material "${name}": ${error.message}`); return null; }
  return ins.material_id;
}

async function patchVariants(styleId: number, colour?: string, material?: string, size?: string, moveTo?: number, rollback?: { variantId: number; prev: Record<string, unknown> }[]) {
  const { data: vars } = await db.from("variant").select("variant_id, exterior_colorway, exterior_material_id, size_label, style_id").eq("style_id", styleId);
  for (const v of vars ?? []) {
    const patch: Record<string, unknown> = {};
    if (moveTo) patch.style_id = moveTo;
    const fam = colour ? colorFamily(colour) ?? colour : null;
    if (!v.exterior_colorway && fam) patch.exterior_colorway = fam;
    if (!v.size_label && size) patch.size_label = size;
    if (v.exterior_material_id == null && material) {
      const id = await matId(material);
      if (id && id > 0) patch.exterior_material_id = id;
    }
    if (Object.keys(patch).length === 0) continue;
    rollback?.push({ variantId: v.variant_id, prev: { style_id: v.style_id, exterior_colorway: v.exterior_colorway, exterior_material_id: v.exterior_material_id, size_label: v.size_label } });
    if (APPLY) await db.from("variant").update(patch).eq("variant_id", v.variant_id);
  }
}

(async () => {
  const rollback: { renamed: { styleId: number; oldName: string }[]; variants: { variantId: number; prev: Record<string, unknown> }[]; deletedStyles: Record<string, unknown>[]; years: { styleId: number }[] } = { renamed: [], variants: [], deletedStyles: [], years: [] };

  for (const m of MERGES) {
    const { data: junk } = await db.from("style").select("style_id,name").eq("style_id", m.styleId).maybeSingle();
    const { data: target } = await db.from("style").select("style_id,name").eq("style_id", m.targetId).maybeSingle();
    if (!junk || junk.name !== m.from) { console.log(`SKIP merge #${m.styleId}: name ${JSON.stringify(junk?.name)}`); continue; }
    if (!target || target.name !== m.targetName) { console.log(`SKIP merge #${m.styleId}: target #${m.targetId} is ${JSON.stringify(target?.name)}, expected ${JSON.stringify(m.targetName)}`); continue; }
    console.log(`MERGE #${m.styleId} "${m.from}" -> #${m.targetId} "${m.targetName}" (+${[m.colour, m.material, m.size].filter(Boolean).join("/")})`);
    if (APPLY) {
      await patchVariants(m.styleId, m.colour, m.material, m.size, m.targetId, rollback.variants);
      const { data: full } = await db.from("style").select("*").eq("style_id", m.styleId).single();
      const { error } = await db.from("style").delete().eq("style_id", m.styleId);
      if (error) console.warn(`  ! delete #${m.styleId}: ${error.message}`);
      else rollback.deletedStyles.push(full as Record<string, unknown>);
    }
  }

  for (const r of RENAMES) {
    const { data: s } = await db.from("style").select("style_id,name,year_introduced").eq("style_id", r.styleId).maybeSingle();
    if (!s || s.name !== r.from) { console.log(`SKIP rename #${r.styleId}: name ${JSON.stringify(s?.name)}`); continue; }
    console.log(`RENAME #${r.styleId} "${r.from}" -> "${r.to}"${r.year && !s.year_introduced ? ` +year=${r.year}` : ""}`);
    if (APPLY) {
      rollback.renamed.push({ styleId: r.styleId, oldName: s.name });
      const patch: Record<string, unknown> = { name: r.to };
      if (r.year && !s.year_introduced) { patch.year_introduced = r.year; rollback.years.push({ styleId: r.styleId }); }
      await db.from("style").update(patch).eq("style_id", r.styleId);
      await patchVariants(r.styleId, r.colour, r.material, r.size, undefined, rollback.variants);
    }
  }

  if (APPLY) {
    const out = path.resolve(process.cwd(), "scripts/ux-restructure/rollback-archivist-chanel.json");
    writeFileSync(out, JSON.stringify(rollback, null, 2));
    console.log(`\nAPPLIED. Rollback -> ${out}`);
  } else {
    console.log("\nDRY-RUN. Re-run with --apply.");
  }
})();
