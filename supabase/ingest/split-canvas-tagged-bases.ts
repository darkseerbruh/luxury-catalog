/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Split an "impure" canvas-tagged LV base (owner 2026-07-12 follow-on). seed-lv-canvas-variants
 * only processes bases with NULL material; but some size rows carry a canvas material (e.g. the
 * Neverfull PM/GM are tagged Monogram) while still holding OTHER-canvas listings lumped in (PM has
 * Damier Ebene + Azur under a Monogram label). Here we re-home each listing whose detected canvas
 * differs from the base's OWN canvas into the correct (size, canvas) variant; same-canvas + un-
 * identifiable listings stay on the base. Complements seed-lv-canvas-variants. Reversible-by-merge,
 * paginated, dry-run.
 *   npx tsx supabase/ingest/split-canvas-tagged-bases.ts --style=218            # dry run
 *   npx tsx supabase/ingest/split-canvas-tagged-bases.ts --style=218 --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

// Local copy of the LV canvas classifier (importing it from seed-lv-canvas-variants would execute
// that script's top-level run). Keep in sync with seed-lv-canvas-variants.lvCanvas.
function lvCanvas(notes: string | null, url: string | null, material: string | null): string | null {
  const h = `${notes ?? ""} ${url ?? ""} ${material ?? ""}`.toLowerCase();
  if (/azur/.test(h)) return "Damier Azur";
  if (/damier|ebene|ébène/.test(h)) return "Damier Ebene";
  if (/empreinte/.test(h)) return "Empreinte";
  if (/\bepi\b/.test(h)) return "Epi";
  if (/vernis/.test(h)) return "Vernis";
  if (/multicolore|murakami/.test(h)) return "Multicolore";
  if (/monogram|\bmono\b/.test(h)) return "Monogram";
  return null;
}

const WRITE = process.argv.includes("--write");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "--style=218").split("=")[1]) || 218;
const FLOOR = 5;
const CANVAS_LINE: Record<string, string> = { monogram: "Monogram", "damier ebene": "Damier Ebene", "damier azur": "Damier Azur", empreinte: "Empreinte", epi: "Epi", vernis: "Vernis" };

async function allPh(variantId: number): Promise<any[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,notes,source_url,material").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}
async function resolveMaterialId(name: string): Promise<number | null> {
  const { data } = await db.from("material").select("material_id").ilike("name", `%${name}%`).limit(1);
  if ((data ?? [])[0]) return data![0].material_id;
  if (!WRITE) return -1;
  const type = name === "Empreinte" || name === "Epi" || name === "Vernis" ? "leather" : "canvas";
  const { data: ins, error } = await db.from("material").insert({ name, material_type: type }).select("material_id").single();
  if (error) { console.error(`   material create failed for ${name}: ${error.message}`); return null; }
  return ins!.material_id;
}
async function findOrCreate(sizeLabel: string, sizeCat: string | null, matId: number): Promise<number | null> {
  const { data: ex } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).eq("exterior_material_id", matId).is("exterior_colorway", null).eq("size_label", sizeLabel);
  if ((ex ?? [])[0]) return ex![0].variant_id;
  const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: sizeLabel, size_category: sizeCat, exterior_material_id: matId, market_availability: "resale" }).select("variant_id").single();
  if (error || !nv) { console.error(`      create failed: ${error?.message}`); return null; }
  return nv.variant_id;
}

async function main() {
  console.log(`\nsplit-canvas-tagged-bases (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  // materials that are canvas lines
  const { data: mats } = await db.from("material").select("material_id,name");
  const nameById = new Map(((mats ?? []) as any[]).map((m) => [m.material_id, String(m.name)]));
  const ownCanvasOf = (matId: number): string | null => {
    const n = (nameById.get(matId) ?? "").toLowerCase();
    for (const key in CANVAS_LINE) if (n.includes(key)) return CANVAS_LINE[key];
    return null;
  };
  // bases: colour-null variants that carry a canvas-line material
  const { data: vs } = await db.from("variant").select("variant_id,size_label,size_category,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).not("exterior_material_id", "is", null);
  const bases = ((vs ?? []) as any[]).filter((v) => ownCanvasOf(v.exterior_material_id));

  const matIdCache = new Map<string, number | null>();
  let moved = 0, created = 0;
  for (const base of bases) {
    const own = ownCanvasOf(base.exterior_material_id);
    const rows = await allPh(base.variant_id);
    const idsByCanvas = new Map<string, number[]>();
    for (const r of rows) {
      const c = lvCanvas(r.notes, r.source_url, r.material);
      if (c && c !== own) (idsByCanvas.get(c) ?? idsByCanvas.set(c, []).get(c)!).push(r.price_id);
    }
    const chosen = [...idsByCanvas.entries()].filter(([, ids]) => ids.length >= FLOOR);
    if (!chosen.length) continue;
    console.log(`  v${base.variant_id} [${base.size_label}/${own}]: ${chosen.map(([c, ids]) => `${c}:${ids.length}`).join(", ")} (own ${own} stays)`);
    for (const [canvas, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      if (!matIdCache.has(canvas)) matIdCache.set(canvas, await resolveMaterialId(canvas));
      const matId = matIdCache.get(canvas);
      if (!matId) continue;
      const targetId = await findOrCreate(base.size_label, base.size_category ?? null, matId);
      if (!targetId || targetId === base.variant_id) continue;
      for (let i = 0; i < ids.length; i += 500) {
        const { error } = await db.from("price_history").update({ variant_id: targetId }).in("price_id", ids.slice(i, i + 500));
        if (error) { console.error(`      move failed: ${error.message}`); }
      }
      moved += ids.length; created++;
    }
  }
  console.log(`\n${created} (size,canvas) variant(s) ${WRITE ? "created/filled" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"}.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
