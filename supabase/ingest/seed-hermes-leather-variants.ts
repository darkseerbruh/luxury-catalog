/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Make LEATHER a selectable axis for a Hermès style (owner 2026-07-12). Hermès faceting differs
 * from LV: the leather (Togo / Clemence / Epsom / Swift / Box / Barenia / Chèvre / exotics) is the
 * PRIMARY spec axis, recoverable from the listing material + title. Split each production-size base
 * by leather into (size, leather) variants carrying exterior_material_id; unidentifiable listings
 * stay on the size base. Colour + hardware are follow-on splits (Hermès colour is a named-anchor
 * palette, handled separately). Reversible (--reverse), paginated, dry-run.
 *   npx tsx supabase/ingest/seed-hermes-leather-variants.ts --style=4            # dry run
 *   npx tsx supabase/ingest/seed-hermes-leather-variants.ts --style=4 --write
 *   npx tsx supabase/ingest/seed-hermes-leather-variants.ts --style=4 --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "--style=4").split("=")[1]) || 4;
const FLOOR = 5;

/** Canonical Hermès leather from a listing's material + text. Specific/exotic before generic;
 *  croc species before bare "crocodile"; Togo (the most common) is an explicit match, not a fallback. */
export function hermesLeather(material: string | null, notes: string | null, url: string | null): string | null {
  const h = `${material ?? ""} ${notes ?? ""} ${url ?? ""}`.toLowerCase();
  if (/porosus/.test(h)) return "Porosus Crocodile";
  if (/niloticus/.test(h)) return "Niloticus Crocodile";
  if (/crocodile|\bcroc\b/.test(h)) return "Crocodile";
  if (/alligator/.test(h)) return "Alligator";
  if (/ostrich|autruche/.test(h)) return "Ostrich";
  if (/barenia|barénia/.test(h)) return "Barenia";
  if (/\bbox\b/.test(h)) return "Box Calf";
  if (/epsom/.test(h)) return "Epsom";
  if (/swift/.test(h)) return "Swift";
  if (/clemence|clémence/.test(h)) return "Clemence";
  if (/chevre|chèvre|goatskin/.test(h)) return "Chevre Mysore";
  if (/fjord/.test(h)) return "Fjord";
  if (/togo/.test(h)) return "Togo";
  return null; // no leather named — leave on the size base
}

const EXOTIC = new Set(["Porosus Crocodile", "Niloticus Crocodile", "Crocodile", "Alligator", "Ostrich"]);
async function resolveMaterialId(name: string): Promise<number | null> {
  const { data: found } = await db.from("material").select("material_id").ilike("name", `%${name}%`).limit(1);
  if ((found ?? [])[0]) return found![0].material_id;
  if (!WRITE) return -1;
  const { data: ins, error } = await db.from("material").insert({ name, material_type: EXOTIC.has(name) ? "exotic" : "leather" }).select("material_id").single();
  if (error) { console.error(`   material create failed for ${name}: ${error.message}`); return null; }
  return ins!.material_id;
}
async function findOrCreateVariant(sizeLabel: string, sizeCat: string | null, matId: number): Promise<number | null> {
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
  console.log(`\nseed-hermes-leather-variants (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: sizeOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "size");
  const productionSizes = new Set(((sizeOpts ?? []) as any[]).map((r) => String(r.value).toLowerCase().trim()));
  // bases = production-size variants with no colour set (may already carry a generic leather material)
  const { data: bs } = await db.from("variant").select("variant_id,size_label,size_category,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null);
  const bases = ((bs ?? []) as any[]).filter((b) => b.size_label && productionSizes.has(String(b.size_label).toLowerCase().trim()));
  console.log(`  size bases: ${bases.map((b) => b.size_label).join(", ")}`);

  const matIdCache = new Map<string, number | null>();
  let created = 0, moved = 0, unresolved = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const idsByLeather = new Map<string, number[]>();
    for (const r of rows) {
      const lea = hermesLeather(r.material, r.notes, r.source_url);
      if (lea) (idsByLeather.get(lea) ?? idsByLeather.set(lea, []).get(lea)!).push(r.price_id);
      else unresolved++;
    }
    const chosen = [...idsByLeather.entries()].filter(([, ids]) => ids.length >= FLOOR).sort((a, b) => b[1].length - a[1].length);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label} (v${base.variant_id}): ${chosen.map(([l, ids]) => `${l}:${ids.length}`).join(", ")}`);
    for (const [leather, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      if (!matIdCache.has(leather)) matIdCache.set(leather, await resolveMaterialId(leather));
      const matId = matIdCache.get(leather);
      if (!matId) continue;
      const targetId = await findOrCreateVariant(base.size_label, base.size_category ?? null, matId);
      if (!targetId) continue;
      if (targetId === base.variant_id) continue; // base already this leather — listings stay put
      for (let i = 0; i < ids.length; i += 500) {
        const { error: uerr } = await db.from("price_history").update({ variant_id: targetId }).in("price_id", ids.slice(i, i + 500));
        if (uerr) { console.error(`      move failed: ${uerr.message}`); continue; }
      }
      moved += ids.length; created++;
    }
  }
  console.log(`\n${created} (size,leather) variant(s) ${WRITE ? "created/filled" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"} (~${unresolved} unidentifiable stay on base).`);
}

async function reverse() {
  console.log(`\nseed-hermes-leather REVERSE (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  // Only removes rows this script would have CREATED: (size,leather) variants with colorway null and
  // a material_id, that are NOT one of the original size bases. Merge listings back to the size base.
  const { data: sizeOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "size");
  const productionSizes = new Set(((sizeOpts ?? []) as any[]).map((r) => String(r.value).toLowerCase().trim()));
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).not("exterior_material_id", "is", null);
  for (const k of (kids ?? []) as any[]) {
    if (!productionSizes.has(String(k.size_label ?? "").toLowerCase().trim())) continue;
    // parent = same-size base with NULL material, else same-size null-colour lowest id
    const { data: pv } = await db.from("variant").select("variant_id,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).eq("size_label", k.size_label).order("variant_id");
    const parent = ((pv ?? []) as any[]).find((p) => p.variant_id !== k.variant_id && p.exterior_material_id == null);
    if (!parent) { console.error(`  no null-material base for ${k.size_label} (v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} +leather] → v${parent.variant_id} (${count}), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parent.variant_id }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
