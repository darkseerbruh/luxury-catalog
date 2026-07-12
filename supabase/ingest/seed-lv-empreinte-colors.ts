/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Colour within LV's leather lines (owner 2026-07-12). LV's canvas lines (Monogram/Damier)
 * carry a fixed print, but the LEATHER lines (Empreinte, Epi) come in colours, so split those
 * canvas variants by colour family into (size, canvas, colour) variants — preserving the
 * material_id, adding exterior_colorway. Completes the LV Speedy to a Size × Canvas × Colour
 * selector. Reversible, paginated, dry-run.
 *   npx tsx supabase/ingest/seed-lv-empreinte-colors.ts [--write] [--reverse]
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { colorFamily } from "../../src/lib/listings-taxonomy";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = 433;
const FLOOR = 5;
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

async function leatherLineVariants() {
  const { data: mats } = await db.from("material").select("material_id").or("name.ilike.%empreinte%,name.ilike.%epi%");
  const ids = (mats ?? []).map((m: any) => m.material_id);
  const { data: vs } = await db.from("variant").select("variant_id,size_label,size_category,exterior_material_id,exterior_colorway").eq("style_id", STYLE_ID).in("exterior_material_id", ids);
  return ((vs ?? []) as any[]).filter((v) => !v.exterior_colorway); // only the not-yet-colour-split ones
}
async function allPh(variantId: number): Promise<{ price_id: number; colorway: string | null }[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,colorway").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}

async function forward() {
  console.log(`\nseed-lv-empreinte-colors ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const bases = await leatherLineVariants();
  let created = 0, moved = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const idsByFam = new Map<string, number[]>();
    for (const r of rows) {
      const f = r.colorway ? colorFamily(r.colorway) : null;
      if (f) (idsByFam.get(f) ?? idsByFam.set(f, []).get(f)!).push(r.price_id);
    }
    const chosen = [...idsByFam.entries()].filter(([, ids]) => ids.length >= FLOOR).sort((a, b) => b[1].length - a[1].length);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label} (mat ${base.exterior_material_id}, v${base.variant_id}): ${chosen.map(([f, ids]) => `${f}:${ids.length}`).join(", ")}`);
    for (const [fam, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_material_id: base.exterior_material_id, exterior_colorway: titleCase(fam), market_availability: "resale" }).select("variant_id").single();
      if (error || !nv) { console.error(`      create failed: ${error?.message}`); continue; }
      for (let i = 0; i < ids.length; i += 500) {
        const { error: uerr } = await db.from("price_history").update({ variant_id: nv.variant_id }).in("price_id", ids.slice(i, i + 500));
        if (uerr) { console.error(`      move failed: ${uerr.message}`); continue; }
      }
      moved += ids.length; created++;
    }
  }
  console.log(`\n${created} (size,canvas,colour) variant(s) ${WRITE ? "created" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"}.`);
}

async function reverse() {
  console.log(`\nseed-lv-empreinte-colors REVERSE ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: mats } = await db.from("material").select("material_id").or("name.ilike.%empreinte%,name.ilike.%epi%");
  const ids = (mats ?? []).map((m: any) => m.material_id);
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_material_id,exterior_colorway").eq("style_id", STYLE_ID).in("exterior_material_id", ids).not("exterior_colorway", "is", null);
  for (const k of (kids ?? []) as any[]) {
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).eq("exterior_material_id", k.exterior_material_id).is("exterior_colorway", null).eq("size_label", k.size_label);
    const parentId = (pv ?? [])[0]?.variant_id;
    if (!parentId) { console.error(`  no canvas base for ${k.size_label} mat ${k.exterior_material_id} (v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} +${k.exterior_colorway}] → v${parentId} (${count}), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parentId }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
