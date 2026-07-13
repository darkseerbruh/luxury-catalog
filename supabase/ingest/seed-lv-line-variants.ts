/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generic LV line splitter (owner 2026-07-13). LV styles name their lines differently (Speedy
 * "Monogram"/"Empreinte"; OnTheGo "Monogram Giant"/"Monogram Empreinte Giant"; Pochette Métis
 * "Monogram"/"Monogram Empreinte"/"Monogram Reverse"), so a fixed classifier can't name them. Here
 * we detect a line CATEGORY from the listing title (reverse/empreinte/epi/vernis/denim/escale/azur/
 * damier/multicolore/monogram) and map it to THIS style's production_option material value that
 * contains that keyword — so the created material always matches the archivist's production names.
 * Splits size bases by line; unidentifiable listings stay on base. Colour-bearing lines (Empreinte/
 * Epi/Vernis) then get seed-lv-empreinte-colors. Reversible, paginated, dry-run.
 *   npx tsx supabase/ingest/seed-lv-line-variants.ts --style=438            # dry run
 *   npx tsx supabase/ingest/seed-lv-line-variants.ts --style=438 --write
 *   npx tsx supabase/ingest/seed-lv-line-variants.ts --style=438 --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "").split("=")[1]);
const FLOOR = 5;

// Ordered category keywords: most-specific first, monogram is the fallback.
const CATEGORIES: { key: string; re: RegExp }[] = [
  { key: "reverse", re: /reverse/ },
  { key: "empreinte", re: /empreinte/ },
  { key: "vernis", re: /vernis/ },
  { key: "epi", re: /\bepi\b/ },
  { key: "escale", re: /escale/ },
  { key: "denim", re: /denim/ },
  { key: "azur", re: /azur/ },
  { key: "damier", re: /damier|ebene|ébène/ },
  { key: "multicolore", re: /multicolore|murakami/ },
  { key: "monogram", re: /monogram|\bmono\b/ },
];
function detectCategory(notes: string | null, url: string | null, material: string | null): string | null {
  const h = `${notes ?? ""} ${url ?? ""} ${material ?? ""}`.toLowerCase();
  for (const c of CATEGORIES) if (c.re.test(h)) return c.key;
  return null;
}
function matType(name: string): string {
  const n = name.toLowerCase();
  if (/empreinte|epi|vernis|calf|leather/.test(n)) return "leather";
  if (/denim/.test(n)) return "fabric";
  return "coated canvas";
}

async function resolveMaterialId(name: string): Promise<number | null> {
  const { data } = await db.from("material").select("material_id").ilike("name", name).limit(1);
  if ((data ?? [])[0]) return data![0].material_id;
  if (!WRITE) return -1;
  const { data: ins, error } = await db.from("material").insert({ name, material_type: matType(name) }).select("material_id").single();
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

async function main() {
  if (!STYLE_ID) { console.error("--style=<id> required"); process.exit(1); }
  console.log(`\nseed-lv-line-variants (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}${REVERSE ? " REVERSE" : ""}\n`);
  const { data: matOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "material");
  const prodMaterials = ((matOpts ?? []) as any[]).map((r) => String(r.value));
  // category -> the production material value containing that keyword (monogram fallback excludes the specific lines)
  const lineFor = (cat: string): string | null => {
    if (cat === "monogram") return prodMaterials.find((m) => /monogram|mono/i.test(m) && !/reverse|empreinte|denim|escale|vernis|epi/i.test(m)) ?? null;
    return prodMaterials.find((m) => new RegExp(cat, "i").test(m)) ?? null;
  };
  const lineNames = new Set(prodMaterials);

  if (REVERSE) {
    const { data: mats } = await db.from("material").select("material_id,name");
    const lineMatIds = new Set(((mats ?? []) as any[]).filter((m) => lineNames.has(m.name)).map((m) => m.material_id));
    const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_material_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).not("exterior_material_id", "is", null);
    for (const k of (kids ?? []) as any[]) {
      if (!lineMatIds.has(k.exterior_material_id)) continue;
      const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).is("exterior_material_id", null).eq("size_label", k.size_label);
      const parent = ((pv ?? []) as any[])[0];
      if (!parent) { console.error(`  no base for ${k.size_label} (v${k.variant_id})`); continue; }
      const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
      console.log(`  v${k.variant_id} [${k.size_label}] → v${parent.variant_id} (${count}), delete`);
      if (WRITE) { await db.from("price_history").update({ variant_id: parent.variant_id }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
    }
    return;
  }

  // Line is orthogonal to size, so split any real-sized base (incl. the "Standard" catch-all that
  // holds the bulk of a single-size style like the Pochette Métis); only skip null/empty-size junk.
  const { data: bs } = await db.from("variant").select("variant_id,size_label,size_category").eq("style_id", STYLE_ID).is("exterior_colorway", null).is("exterior_material_id", null);
  const bases = ((bs ?? []) as any[]).filter((b) => b.size_label && String(b.size_label).trim());
  const matIdCache = new Map<string, number | null>();
  let created = 0, moved = 0, unresolved = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const byLine = new Map<string, number[]>();
    for (const r of rows) {
      const cat = detectCategory(r.notes, r.source_url, r.material);
      const line = cat ? lineFor(cat) : null;
      if (line) (byLine.get(line) ?? byLine.set(line, []).get(line)!).push(r.price_id);
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
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
