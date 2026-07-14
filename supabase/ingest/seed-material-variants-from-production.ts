/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make MATERIAL a selectable axis (owner 2026-07-12: "chanel's material should be selectable").
 * Splits each existing (size, colour) variant by the PRODUCTION materials (production_option,
 * axis 'material') that appear in its listings — so the values are the collector terms
 * (Caviar, Lambskin, Patent, Tweed), not the generic materialFamily chips. Listings whose
 * material is unknown or a generic "leather" stay on the (size, colour) base (the
 * material-unspecified entry). Sets exterior_material_id (find-or-create the material row).
 *
 * Reversible (--reverse): move each material child's listings back to its (size, colour) base
 * + delete it. Paginated. Dry-run by default.
 *   npx tsx supabase/ingest/seed-material-variants-from-production.ts --style=1           # dry run
 *   npx tsx supabase/ingest/seed-material-variants-from-production.ts --style=1 --write
 *   npx tsx supabase/ingest/seed-material-variants-from-production.ts --style=1 --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "--style=1").split("=")[1]) || 1;
const FLOOR = 5; // a material earns its own (size,colour,material) page at >= this many listings

async function allPh(variantId: number): Promise<{ price_id: number; material: string | null }[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,material").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}

const LEATHER = new Set(["caviar", "lambskin", "calfskin", "aged calfskin", "patent", "epi", "monogram", "damier ebene", "damier azur", "empreinte"]);
async function resolveMaterialId(name: string): Promise<number | null> {
  // Match the production value as a WHOLE material name (exact, else a prefix like "Leather" ->
  // "Leather Trim"), never mid-string: a bare "%${name}%" grabbed unrelated rows — production
  // "Leather" matched "Caviar Leather" (wrong house) and a junk "fabric lining...leather versions"
  // row, corrupting the Gucci Dionysus material axis (2026-07-13). Exact -> prefix -> create.
  const { data: exact } = await db.from("material").select("material_id").ilike("name", name).limit(1);
  if ((exact ?? [])[0]) return exact![0].material_id;
  const { data: pref } = await db.from("material").select("material_id").ilike("name", `${name} %`).limit(1);
  if ((pref ?? [])[0]) return pref![0].material_id;
  if (!WRITE) return -1; // placeholder in dry-run
  const material_type = LEATHER.has(name.toLowerCase()) ? "leather" : name.toLowerCase() === "tweed" ? "fabric" : "other";
  const { data: ins, error } = await db.from("material").insert({ name, material_type }).select("material_id").single();
  if (error) { console.error(`   material create failed for ${name}: ${error.message}`); return null; }
  return ins!.material_id;
}

async function forward() {
  console.log(`\nseed-material-variants style ${STYLE_ID} ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: matOpts } = await db.from("production_option").select("value,sort_order").eq("style_id", STYLE_ID).eq("axis", "material").order("sort_order");
  const materials = ((matOpts ?? []) as any[]).map((r) => r.value); // e.g. Caviar, Lambskin, Patent, Tweed
  if (!materials.length) { console.error("  ABORT: no production materials — seed production_option first."); process.exit(1); }
  console.log(`  production materials: ${materials.join(", ")}`);

  // The (size, colour) variants to split (colour set, from the colour seeding).
  const { data: colourVars } = await db.from("variant").select("variant_id,size_label,size_category,exterior_colorway").eq("style_id", STYLE_ID).not("exterior_colorway", "is", null);
  const bases = ((colourVars ?? []) as any[]).filter((v) => !v.exterior_material_id); // don't re-split material variants
  const matIdCache = new Map<string, number | null>();
  let created = 0, moved = 0;

  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    // classify each listing to a production material by substring (Caviar/Lambskin/...); else null (stays).
    const idsByMat = new Map<string, number[]>();
    for (const r of rows) {
      const hay = (r.material ?? "").toLowerCase();
      const mat = materials.find((m) => hay.includes(m.toLowerCase()));
      if (mat) (idsByMat.get(mat) ?? idsByMat.set(mat, []).get(mat)!).push(r.price_id);
    }
    const chosen = [...idsByMat.entries()].filter(([, ids]) => ids.length >= FLOOR);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label} ${base.exterior_colorway} (v${base.variant_id}): ${chosen.map(([m, ids]) => `${m}:${ids.length}`).join(", ")}`);
    for (const [mat, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      if (!matIdCache.has(mat)) matIdCache.set(mat, await resolveMaterialId(mat));
      const matId = matIdCache.get(mat);
      if (!matId) continue;
      const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_colorway: base.exterior_colorway, exterior_material_id: matId, market_availability: "resale" }).select("variant_id").single();
      if (error || !nv) { console.error(`      create failed: ${error?.message}`); continue; }
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { error: uerr } = await db.from("price_history").update({ variant_id: nv.variant_id }).in("price_id", chunk);
        if (uerr) { console.error(`      move failed: ${uerr.message}`); continue; }
        moved += chunk.length;
      }
      created++;
    }
  }
  console.log(`\n${created} material variant(s) ${WRITE ? "created" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"}.`);
}

async function reverse() {
  console.log(`\nseed-material-variants REVERSE style ${STYLE_ID} ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_colorway,exterior_material_id").eq("style_id", STYLE_ID).not("exterior_material_id", "is", null).not("exterior_colorway", "is", null);
  for (const k of (kids ?? []) as any[]) {
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_material_id", null).eq("size_label", k.size_label).eq("exterior_colorway", k.exterior_colorway);
    const parentId = (pv ?? [])[0]?.variant_id;
    if (!parentId) { console.error(`  no colour base for ${k.size_label} ${k.exterior_colorway} (v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} ${k.exterior_colorway} +mat] → v${parentId} (${count}), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parentId }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
