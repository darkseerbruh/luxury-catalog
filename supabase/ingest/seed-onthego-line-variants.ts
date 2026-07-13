/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make the LINE the primary Material axis for the LV OnTheGo (owner 2026-07-12 follow-on). The
 * OnTheGo's lines are "Giant" variants (Monogram Giant / Monogram Empreinte Giant / Monogram
 * Reverse Giant / Epi / Denim / Escale) that the generic LV canvas classifier can't name, so this
 * splits the size bases by an OnTheGo-specific line classifier read from the listing title. The
 * Empreinte + Epi lines are colour-bearing (run seed-lv-empreinte-colors --style=437 after). This
 * makes the OnTheGo material-primary like the Speedy/Alma, not colour-mixed. Reversible, paginated,
 * dry-run.
 *   npx tsx supabase/ingest/seed-onthego-line-variants.ts            # dry run
 *   npx tsx supabase/ingest/seed-onthego-line-variants.ts --write
 *   npx tsx supabase/ingest/seed-onthego-line-variants.ts --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = 437;
const FLOOR = 5;

/** The OnTheGo's specific line from a listing's text. Reverse + Empreinte before the plain-Monogram fallback. */
export function onthegoLine(notes: string | null, url: string | null, material: string | null): string | null {
  const h = `${notes ?? ""} ${url ?? ""} ${material ?? ""}`.toLowerCase();
  if (/reverse/.test(h)) return "Monogram Reverse Giant";
  if (/empreinte/.test(h)) return "Monogram Empreinte Giant";
  if (/escale/.test(h)) return "LV Escale";
  if (/\bepi\b/.test(h)) return "Epi";
  if (/denim/.test(h)) return "Monogram Denim";
  if (/monogram|\bmono\b/.test(h)) return "Monogram Giant";
  return null;
}
// material_category enum (migration 0001): 'leather' | 'exotic' | 'fabric' | 'coated canvas' | 'other'
const MAT_TYPE: Record<string, string> = { "Monogram Giant": "coated canvas", "Monogram Reverse Giant": "coated canvas", "Monogram Empreinte Giant": "leather", Epi: "leather", "Monogram Denim": "fabric", "LV Escale": "coated canvas" };

async function resolveMaterialId(name: string): Promise<number | null> {
  const { data } = await db.from("material").select("material_id").ilike("name", name).limit(1); // exact-ish (ilike, no wildcards)
  if ((data ?? [])[0]) return data![0].material_id;
  if (!WRITE) return -1;
  const { data: ins, error } = await db.from("material").insert({ name, material_type: MAT_TYPE[name] ?? "other" }).select("material_id").single();
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
  console.log(`\nseed-onthego-line-variants ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: sizeOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "size");
  const prodSizes = new Set(((sizeOpts ?? []) as any[]).map((r) => String(r.value).toLowerCase().trim()));
  const { data: bs } = await db.from("variant").select("variant_id,size_label,size_category").eq("style_id", STYLE_ID).is("exterior_colorway", null).is("exterior_material_id", null);
  const bases = ((bs ?? []) as any[]).filter((b) => b.size_label && prodSizes.has(String(b.size_label).toLowerCase().trim()));
  const matIdCache = new Map<string, number | null>();
  let created = 0, moved = 0, unresolved = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const byLine = new Map<string, number[]>();
    for (const r of rows) {
      const l = onthegoLine(r.notes, r.source_url, r.material);
      if (l) (byLine.get(l) ?? byLine.set(l, []).get(l)!).push(r.price_id);
      else unresolved++;
    }
    const chosen = [...byLine.entries()].filter(([, ids]) => ids.length >= FLOOR).sort((a, b) => b[1].length - a[1].length);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label} (v${base.variant_id}): ${chosen.map(([l, ids]) => `${l}:${ids.length}`).join(", ")}`);
    for (const [line, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      if (!matIdCache.has(line)) matIdCache.set(line, await resolveMaterialId(line));
      const matId = matIdCache.get(line);
      if (!matId) continue;
      const targetId = await findOrCreate(base.size_label, base.size_category ?? null, matId);
      if (!targetId || targetId === base.variant_id) continue;
      for (let i = 0; i < ids.length; i += 500) {
        const { error } = await db.from("price_history").update({ variant_id: targetId }).in("price_id", ids.slice(i, i + 500));
        if (error) console.error(`      move failed: ${error.message}`);
      }
      moved += ids.length; created++;
    }
  }
  console.log(`\n${created} (size,line) variant(s) ${WRITE ? "created" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"} (~${unresolved} unidentifiable stay on base).`);
}

async function reverse() {
  console.log(`\nseed-onthego-line REVERSE ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const lineNames = Object.keys(MAT_TYPE);
  const { data: mats } = await db.from("material").select("material_id,name");
  const lineMatIds = new Set(((mats ?? []) as any[]).filter((m) => lineNames.includes(m.name)).map((m) => m.material_id));
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).not("exterior_material_id", "is", null);
  for (const k of (kids ?? []) as any[]) {
    if (!lineMatIds.has(k.exterior_material_id)) continue;
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).is("exterior_material_id", null).eq("size_label", k.size_label);
    const parent = ((pv ?? []) as any[])[0];
    if (!parent) { console.error(`  no size base for ${k.size_label} (v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} +line] → v${parent.variant_id} (${count}), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parent.variant_id }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
