/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make the STRAP a selectable Construction toggle for the LV Speedy (owner 2026-07-12). The Speedy
 * comes handheld (Standard) or as the Speedy Bandoulière / "Speedy B" / "NM" with a detachable
 * crossbody strap + two-way zip (since 2011) — a genuine construction variant, so it earns a toggle.
 * Only the CANVAS lines (Monogram / Damier) carry the Bandoulière product, so we split just those
 * (size,canvas) variants: listings whose title names the Bandoulière move to a construction=
 * "Bandoulière" sibling, and the base is stamped construction="Standard" so the dim shows 2 values.
 * Reversible (--reverse), paginated, dry-run.
 *   npx tsx supabase/ingest/seed-lv-strap-variants.ts --style=433            # dry run
 *   npx tsx supabase/ingest/seed-lv-strap-variants.ts --style=433 --write
 *   npx tsx supabase/ingest/seed-lv-strap-variants.ts --style=433 --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "--style=433").split("=")[1]) || 433;
const FLOOR = 5;

/** True when a listing names the Bandoulière / crossbody Speedy. Conservative: only the reliable
 *  tells (bandoulière, "Speedy B", "NM"/nouveau modèle), never a bare "strap". */
export function isBandouliere(notes: string | null, url: string | null): boolean {
  const h = `${notes ?? ""} ${url ?? ""}`.toLowerCase();
  return /bandouli|\bspeedy\s*b\b|\bnm\b|nouveau\s*mod/.test(h);
}

async function strapBases() {
  // All production-size variants for the style (any material/colour) — the Speedy Bandoulière
  // spans the canvas + jacquard lines and its listings mostly sit on the bare size bases, so we
  // can't restrict to canvas here. The junk buckets (Standard/∅ size) are excluded via prod sizes.
  const { data: sizeOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "size");
  const prodSizes = new Set(((sizeOpts ?? []) as any[]).map((r) => String(r.value).toLowerCase().trim()));
  const { data: vs } = await db.from("variant").select("variant_id,size_label,size_category,exterior_material_id,exterior_colorway,construction_method").eq("style_id", STYLE_ID);
  return ((vs ?? []) as any[])
    .filter((v) => v.size_label && prodSizes.has(String(v.size_label).toLowerCase().trim()))
    .filter((v) => v.construction_method !== "Bandoulière"); // don't re-split a Bandoulière child
}
async function findOrCreateBandouliere(base: any): Promise<number | null> {
  let q = db.from("variant").select("variant_id").eq("style_id", STYLE_ID).eq("size_label", base.size_label).eq("construction_method", "Bandoulière");
  q = base.exterior_material_id == null ? q.is("exterior_material_id", null) : q.eq("exterior_material_id", base.exterior_material_id);
  q = base.exterior_colorway == null ? q.is("exterior_colorway", null) : q.eq("exterior_colorway", base.exterior_colorway);
  const { data: ex } = await q;
  if ((ex ?? [])[0]) return ex![0].variant_id;
  const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_material_id: base.exterior_material_id, exterior_colorway: base.exterior_colorway, construction_method: "Bandoulière", market_availability: "resale" }).select("variant_id").single();
  if (error || !nv) { console.error(`     create failed: ${error?.message}`); return null; }
  return nv.variant_id;
}
async function allPh(variantId: number): Promise<any[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,notes,source_url").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}

async function forward() {
  console.log(`\nseed-lv-strap-variants (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const bases = await strapBases();
  let split = 0, wholeBand = 0, moved = 0, standardStamped = 0;
  const splitBaseIds: number[] = [];
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const bIds = rows.filter((r) => isBandouliere(r.notes, r.source_url)).map((r) => r.price_id);
    const b = bIds.length, s = rows.length - b;
    if (b < FLOOR) continue; // not enough Bandoulière evidence — leave the base alone
    const tag = `[${base.size_label}/mat${base.exterior_material_id ?? "∅"}/${base.exterior_colorway ?? "∅"}]`;
    if (s < FLOOR) {
      // essentially all-Bandoulière (e.g. Empreinte Speedy) — stamp the base itself, no empty split
      console.log(`  v${base.variant_id} ${tag}: WHOLESALE Bandoulière (${b}/${rows.length})`);
      if (WRITE) { const { error } = await db.from("variant").update({ construction_method: "Bandoulière" }).eq("variant_id", base.variant_id); if (error) console.error(`     stamp failed: ${error.message}`); }
      wholeBand++;
      continue;
    }
    // genuine mix — split off a Bandoulière sibling, stamp the base Standard
    console.log(`  v${base.variant_id} ${tag}: SPLIT Bandoulière:${b} / Standard:${s}`);
    splitBaseIds.push(base.variant_id);
    if (WRITE) {
      const childId = await findOrCreateBandouliere(base);
      if (!childId) continue;
      for (let i = 0; i < bIds.length; i += 500) {
        const { error: uerr } = await db.from("price_history").update({ variant_id: childId }).in("price_id", bIds.slice(i, i + 500));
        if (uerr) { console.error(`     move failed: ${uerr.message}`); }
      }
    }
    split++; moved += b;
  }
  for (const vid of splitBaseIds) {
    if (WRITE) {
      const { error } = await db.from("variant").update({ construction_method: "Standard" }).eq("variant_id", vid).is("construction_method", null);
      if (error) { console.error(`     stamp failed v${vid}: ${error.message}`); continue; }
    }
    standardStamped++;
  }
  console.log(`\n${split} split (${moved} listings re-pointed) + ${wholeBand} stamped all-Bandoulière; ${standardStamped} base(s) stamped Standard. ${WRITE ? "" : "(dry run)"}`);
}

async function reverse() {
  console.log(`\nseed-lv-strap REVERSE (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_material_id").eq("style_id", STYLE_ID).eq("construction_method", "Bandoulière");
  for (const k of (kids ?? []) as any[]) {
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).eq("size_label", k.size_label).eq("exterior_material_id", k.exterior_material_id).is("exterior_colorway", null).neq("construction_method", "Bandoulière");
    const parent = ((pv ?? []) as any[])[0];
    if (!parent) { console.error(`  no Standard base for v${k.variant_id}; skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} Bandoulière] → v${parent.variant_id} (${count}), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parent.variant_id }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
  // Un-stamp the Standard bases we set.
  if (WRITE) await db.from("variant").update({ construction_method: null }).eq("style_id", STYLE_ID).eq("construction_method", "Standard");
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
