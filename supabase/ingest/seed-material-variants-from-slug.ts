/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make MATERIAL a selectable axis by classifying each listing from its TITLE/slug
 * (owner 2026-07-14). The sibling `seed-material-variants-from-production.ts` matches
 * the coarse `price_history.material` column against `production_option` names by
 * substring, which fails when listings carry loose terms ("Canvas") that don't contain
 * the canon name ("FF / Zucca Canvas"). Listing SLUGS are far richer (zucca / selleria /
 * sequin / fur / croc / jacquard), so we classify from those instead.
 *
 * For each (size, colour) base variant, group its listings by the canon material its slug
 * names; where a material has >= FLOOR listings, split it into its own (size, colour,
 * material) variant (reusing an existing child if one already exists — never a duplicate).
 * Unclassified / under-floor listings stay on the base. Values match the canon
 * `production_option` material list so the chips read consistently.
 *
 * Dry-run by default. Reversal: `seed-material-variants-from-production.ts --reverse
 * --style=<id> --write` collapses ALL of a style's material children back (shared shape).
 *   npx tsx supabase/ingest/seed-material-variants-from-slug.ts --style=204          # dry run
 *   npx tsx supabase/ingest/seed-material-variants-from-slug.ts --style=204 --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "--style=204").split("=")[1]) || 204;
const FLOOR = 5; // a material earns its own (size,colour,material) page at >= this many listings

// slug keyword -> canon material name (must match production_option values for clean chips).
const MAP: [RegExp, string][] = [
  [/selleria|cuoio romano/i, "Selleria"],
  [/zucca|zucchino|ff logo|logo canvas|ff canvas|jacquard|monogram canvas/i, "FF / Zucca Canvas"],
  [/sequin|beaded|\bbead\b|crystal|strass|murrine|glitter/i, "Sequins / Embellished"],
  [/embroider/i, "Embroidered"],
  [/shearling|teddy|mink|\bfur\b|\bfox\b|mongolian|sheepskin/i, "Fur"],
  [/croc|crocodile|python|ostrich|lizard|alligator|snakeskin|exotic|karung/i, "Exotic"],
  [/nappa|calfskin|calf leather|vitello|\bleather\b|suede/i, "Leather"],
];
function classify(slug: string): string | null {
  const h = slug.toLowerCase();
  for (const [re, mat] of MAP) if (re.test(h)) return mat;
  return null;
}
function slugOf(u: string | null): string {
  if (!u) return "";
  const s = u.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  return s.replace(/-p\d+$/i, "").replace(/[-_]+/g, " ").replace(/(\D)(\d{4,})$/, "$1").replace(/\s*\d{4,}\s*$/, "").trim();
}

async function allPh(variantId: number): Promise<{ price_id: number; source_url: string | null }[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,source_url").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}

const LEATHER = new Set(["leather", "selleria"]);
async function resolveMaterialId(name: string): Promise<number | null> {
  const { data: exact } = await db.from("material").select("material_id").ilike("name", name).limit(1);
  if ((exact ?? [])[0]) return exact![0].material_id;
  if (!WRITE) return -1;
  // material_category enum members: coated canvas | exotic | fabric | leather | other.
  const n = name.toLowerCase();
  const type = LEATHER.has(n) ? "leather" : /canvas|embroider|sequin/.test(n) ? "coated canvas" : /exotic/.test(n) ? "exotic" : "other";
  const { data: ins, error } = await db.from("material").insert({ name, material_type: type }).select("material_id").single();
  if (error) { console.error(`   material create failed for ${name}: ${error.message}`); return null; }
  return ins!.material_id;
}

async function main() {
  console.log(`\nseed-material-variants-from-slug style ${STYLE_ID} ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: all } = await db.from("variant").select("variant_id,size_label,size_category,exterior_colorway,exterior_material_id").eq("style_id", STYLE_ID);
  const rows = (all ?? []) as any[];
  const bases = rows.filter((v) => !v.exterior_material_id && v.exterior_colorway);
  // existing (size|colour|material_id) children, to reuse instead of duplicating.
  const childByKey = new Map<string, number>();
  for (const v of rows.filter((v) => v.exterior_material_id && v.exterior_colorway)) {
    childByKey.set(`${(v.size_label ?? "").toLowerCase()}|${v.exterior_colorway.toLowerCase()}|${v.exterior_material_id}`, v.variant_id);
  }
  const matIdCache = new Map<string, number | null>();
  let created = 0, reused = 0, moved = 0;

  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const idsByMat = new Map<string, number[]>();
    for (const r of rows) {
      const mat = classify(slugOf(r.source_url));
      if (mat) (idsByMat.get(mat) ?? idsByMat.set(mat, []).get(mat)!).push(r.price_id);
    }
    const chosen = [...idsByMat.entries()].filter(([, ids]) => ids.length >= FLOOR).sort((a, b) => b[1].length - a[1].length);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label} ${base.exterior_colorway} (v${base.variant_id}): ${chosen.map(([m, ids]) => `${m}:${ids.length}`).join(", ")}`);
    for (const [mat, ids] of chosen) {
      if (!matIdCache.has(mat)) matIdCache.set(mat, await resolveMaterialId(mat));
      const matId = matIdCache.get(mat);
      if (!matId) continue;
      const key = `${(base.size_label ?? "").toLowerCase()}|${base.exterior_colorway.toLowerCase()}|${matId}`;
      let targetId = childByKey.get(key);
      if (!WRITE) { targetId ? reused++ : created++; moved += ids.length; continue; }
      if (!targetId) {
        const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_colorway: base.exterior_colorway, exterior_material_id: matId, market_availability: "resale" }).select("variant_id").single();
        if (error || !nv) { console.error(`      create failed: ${error?.message}`); continue; }
        targetId = nv.variant_id; childByKey.set(key, targetId); created++;
      } else reused++;
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { error: uerr } = await db.from("price_history").update({ variant_id: targetId }).in("price_id", chunk);
        if (uerr) { console.error(`      move failed: ${uerr.message}`); continue; }
        moved += chunk.length;
      }
    }
  }
  console.log(`\n${created} created + ${reused} reused material variant(s), ${moved} listings ${WRITE ? "re-pointed" : "to move"}.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
