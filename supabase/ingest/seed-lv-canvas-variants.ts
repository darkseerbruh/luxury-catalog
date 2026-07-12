/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make CANVAS a selectable axis for the LV Speedy (owner 2026-07-12). LV's material field is
 * mostly the generic "Canvas", but the specific line (Monogram / Damier Ebene / Damier Azur /
 * Empreinte / Epi) is recoverable from the listing TITLE/URL for ~92% of rows, so we classify
 * from title+url+material and split the SIZE bases by canvas (canvas is LV's primary axis, so
 * unlike Chanel we split size, not colour). Each (size, canvas) variant carries exterior_material_id;
 * the ~8% unidentifiable listings stay on the size base. Reversible (--reverse), paginated, dry-run.
 *   npx tsx supabase/ingest/seed-lv-canvas-variants.ts            # dry run
 *   npx tsx supabase/ingest/seed-lv-canvas-variants.ts --write
 *   npx tsx supabase/ingest/seed-lv-canvas-variants.ts --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = 433; // LV Speedy
const FLOOR = 5;

/** Specific LV canvas from a listing's text. Checks most-specific first (Azur before bare Damier). */
export function lvCanvas(notes: string | null, url: string | null, material: string | null): string | null {
  const h = `${notes ?? ""} ${url ?? ""} ${material ?? ""}`.toLowerCase();
  if (/azur/.test(h)) return "Damier Azur";
  if (/damier|ebene|ébène/.test(h)) return "Damier Ebene";
  if (/empreinte/.test(h)) return "Empreinte";
  if (/\bepi\b/.test(h)) return "Epi";
  if (/monogram|\bmono\b/.test(h)) return "Monogram";
  return null; // generic canvas / leather with no line named — leave on the base
}

const MAT_TYPE: Record<string, string> = { Monogram: "canvas", "Damier Ebene": "canvas", "Damier Azur": "canvas", Empreinte: "leather", Epi: "leather" };
async function resolveMaterialId(name: string): Promise<number | null> {
  const { data: found } = await db.from("material").select("material_id").ilike("name", `%${name}%`).limit(1);
  if ((found ?? [])[0]) return found![0].material_id;
  if (!WRITE) return -1;
  const { data: ins, error } = await db.from("material").insert({ name, material_type: MAT_TYPE[name] ?? "other" }).select("material_id").single();
  if (error) { console.error(`   material create failed for ${name}: ${error.message}`); return null; }
  return ins!.material_id;
}

async function allPh(variantId: number): Promise<any[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,notes,source_url,material").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}

async function forward() {
  console.log(`\nseed-lv-canvas-variants (Speedy) ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: sizeOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "size");
  const productionSizes = new Set(((sizeOpts ?? []) as any[]).map((r) => String(r.value).toLowerCase().trim()));
  const { data: canvasOpts } = await db.from("production_option").select("value,sort_order").eq("style_id", STYLE_ID).eq("axis", "material").order("sort_order");
  const canvases = ((canvasOpts ?? []) as any[]).map((r) => r.value).filter((v) => MAT_TYPE[v]); // the recoverable lines
  const { data: bs } = await db.from("variant").select("variant_id,size_label,size_category").eq("style_id", STYLE_ID).is("exterior_colorway", null).is("exterior_material_id", null);
  const bases = ((bs ?? []) as any[]).filter((b) => b.size_label && productionSizes.has(String(b.size_label).toLowerCase().trim()));
  console.log(`  canvases: ${canvases.join(", ")}\n  size bases: ${bases.map((b) => b.size_label).join(", ")}`);

  const matIdCache = new Map<string, number | null>();
  let created = 0, moved = 0, unresolved = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const idsByCanvas = new Map<string, number[]>();
    for (const r of rows) {
      const c = lvCanvas(r.notes, r.source_url, r.material);
      if (c && canvases.includes(c)) (idsByCanvas.get(c) ?? idsByCanvas.set(c, []).get(c)!).push(r.price_id);
      else if (!c) unresolved++;
    }
    const chosen = [...idsByCanvas.entries()].filter(([, ids]) => ids.length >= FLOOR);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label} (v${base.variant_id}): ${chosen.map(([c, ids]) => `${c}:${ids.length}`).join(", ")}`);
    for (const [canvas, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      if (!matIdCache.has(canvas)) matIdCache.set(canvas, await resolveMaterialId(canvas));
      const matId = matIdCache.get(canvas);
      if (!matId) continue;
      const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_material_id: matId, market_availability: "resale" }).select("variant_id").single();
      if (error || !nv) { console.error(`      create failed: ${error?.message}`); continue; }
      for (let i = 0; i < ids.length; i += 500) {
        const { error: uerr } = await db.from("price_history").update({ variant_id: nv.variant_id }).in("price_id", ids.slice(i, i + 500));
        if (uerr) { console.error(`      move failed: ${uerr.message}`); continue; }
      }
      moved += ids.length; created++;
    }
  }
  console.log(`\n${created} canvas variant(s) ${WRITE ? "created" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"} (~${unresolved} unidentifiable stay on base).`);
}

async function reverse() {
  console.log(`\nseed-lv-canvas REVERSE ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).not("exterior_material_id", "is", null);
  for (const k of (kids ?? []) as any[]) {
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).is("exterior_material_id", null).eq("size_label", k.size_label);
    const parentId = (pv ?? [])[0]?.variant_id;
    if (!parentId) { console.error(`  no size base for ${k.size_label} (v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} +canvas] → v${parentId} (${count}), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parentId }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
