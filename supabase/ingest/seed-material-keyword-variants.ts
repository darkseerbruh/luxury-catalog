/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generic keyword-scored MATERIAL splitter (owner 2026-07-13). seed-material-variants-from-production
 * matches a production material value as a substring of the listing's `material` field, so multi-word
 * names ("Oblique Embroidery", "Smooth Calf", "Matelasse Lambskin", "GG Supreme Canvas") never match
 * and the material axis stays empty. Here each production material is turned into a SET of significant
 * keywords (generic words like leather/canvas/the/of dropped); each listing is SCORED against every
 * production material by how many of its keywords appear in the title, and assigned to the highest-
 * scoring one (needs a clear winner: top score >= 1 and strictly beats the runner-up, so an ambiguous
 * "matelasse" that fits two materials equally stays on the base). Splits each (size[,colour]) variant
 * by material. Reversible (--reverse), paginated, dry-run.
 *   npx tsx supabase/ingest/seed-material-keyword-variants.ts --style=454            # dry run
 *   npx tsx supabase/ingest/seed-material-keyword-variants.ts --style=454 --write
 *   npx tsx supabase/ingest/seed-material-keyword-variants.ts --style=454 --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "").split("=")[1]);
const FLOOR = 5;
// words too generic to distinguish one material from another
const STOP = new Set(["leather", "canvas", "the", "of", "de", "and", "/", "", "bag", "calf", "with", "textured", "coated", "grain"]);

function keywords(materialValue: string): string[] {
  return materialValue.toLowerCase().replace(/[^a-z0-9\s/]/g, " ").split(/[\s/]+/).map((w) => w.trim()).filter((w) => w.length >= 2 && !STOP.has(w));
}
/** Best-scoring production material for a listing, or null when there's no clear winner. */
function classify(text: string, kwByMat: Map<string, string[]>): string | null {
  const h = ` ${text.toLowerCase()} `;
  let best: string | null = null, bestScore = 0, tie = false;
  for (const [mat, kws] of kwByMat) {
    const score = kws.reduce((n, k) => n + (h.includes(` ${k} `) || h.includes(`${k} `) || h.includes(` ${k}`) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = mat; tie = false; }
    else if (score === bestScore && score > 0) tie = true;
  }
  return bestScore >= 1 && !tie ? best : null;
}
function matType(name: string): string {
  const n = name.toLowerCase();
  if (/canvas|zucca|jacquard|toile|oblique|gg supreme|monogram/.test(n)) return "coated canvas";
  if (/suede/.test(n)) return "suede";
  if (/tweed|fabric|velvet|denim/.test(n)) return "fabric";
  if (/exotic|croc|python|ostrich|lizard|alligator/.test(n)) return "exotic";
  return "leather";
}
async function resolveMaterialId(name: string): Promise<number | null> {
  const { data: exact } = await db.from("material").select("material_id").ilike("name", name).limit(1);
  if ((exact ?? [])[0]) return exact![0].material_id;
  if (!WRITE) return -1;
  const { data: ins, error } = await db.from("material").insert({ name, material_type: matType(name) }).select("material_id").single();
  if (error) { console.error(`   material create failed for ${name}: ${error.message}`); return null; }
  return ins!.material_id;
}
async function findOrCreate(base: any, matId: number): Promise<number | null> {
  let q = db.from("variant").select("variant_id").eq("style_id", STYLE_ID).eq("exterior_material_id", matId).eq("size_label", base.size_label);
  q = base.exterior_colorway == null ? q.is("exterior_colorway", null) : q.eq("exterior_colorway", base.exterior_colorway);
  const { data: ex } = await q;
  if ((ex ?? [])[0]) return ex![0].variant_id;
  const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_colorway: base.exterior_colorway, exterior_material_id: matId, market_availability: "resale" }).select("variant_id").single();
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
  console.log(`\nseed-material-keyword-variants (style ${STYLE_ID}) ${WRITE ? "(WRITE)" : "(DRY RUN)"}${REVERSE ? " REVERSE" : ""}\n`);
  const { data: matOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "material");
  const prodMaterials = ((matOpts ?? []) as any[]).map((r) => String(r.value));
  const kwByMat = new Map<string, string[]>();
  for (const m of prodMaterials) { const kw = keywords(m); if (kw.length) kwByMat.set(m, kw); }
  console.log("  material keywords:", [...kwByMat.entries()].map(([m, k]) => `${m}=[${k.join(",")}]`).join("  "));

  if (REVERSE) {
    const { data: mats } = await db.from("material").select("material_id,name");
    const matIds = new Set(((mats ?? []) as any[]).filter((m) => prodMaterials.includes(m.name)).map((m) => m.material_id));
    const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_colorway,exterior_material_id").eq("style_id", STYLE_ID).not("exterior_material_id", "is", null);
    for (const k of (kids ?? []) as any[]) {
      if (!matIds.has(k.exterior_material_id)) continue;
      let pq = db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_material_id", null).eq("size_label", k.size_label);
      pq = k.exterior_colorway == null ? pq.is("exterior_colorway", null) : pq.eq("exterior_colorway", k.exterior_colorway);
      const parent = ((await pq).data ?? [])[0];
      if (!parent) { console.error(`  no base for v${k.variant_id}`); continue; }
      const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
      console.log(`  v${k.variant_id} → v${parent.variant_id} (${count})`);
      if (WRITE) { await db.from("price_history").update({ variant_id: parent.variant_id }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
    }
    return;
  }

  // split (size[,colour]) variants that carry NO material yet
  const { data: bs } = await db.from("variant").select("variant_id,size_label,size_category,exterior_colorway").eq("style_id", STYLE_ID).is("exterior_material_id", null);
  const bases = ((bs ?? []) as any[]).filter((b) => b.size_label && String(b.size_label).trim());
  const matIdCache = new Map<string, number | null>();
  let created = 0, moved = 0, unresolved = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    const byMat = new Map<string, number[]>();
    for (const r of rows) {
      const mat = classify(`${r.material ?? ""} ${r.notes ?? ""} ${r.source_url ?? ""}`, kwByMat);
      if (mat) (byMat.get(mat) ?? byMat.set(mat, []).get(mat)!).push(r.price_id);
      else unresolved++;
    }
    const chosen = [...byMat.entries()].filter(([, ids]) => ids.length >= FLOOR).sort((a, b) => b[1].length - a[1].length);
    if (!chosen.length) continue;
    console.log(`  ${base.size_label}${base.exterior_colorway ? "/" + base.exterior_colorway : ""} (v${base.variant_id}): ${chosen.map(([m, ids]) => `${m}:${ids.length}`).join(", ")}`);
    for (const [mat, ids] of chosen) {
      if (!WRITE) { created++; moved += ids.length; continue; }
      if (!matIdCache.has(mat)) matIdCache.set(mat, await resolveMaterialId(mat));
      const matId = matIdCache.get(mat);
      if (!matId) continue;
      const targetId = await findOrCreate(base, matId);
      if (!targetId || targetId === base.variant_id) continue;
      for (let i = 0; i < ids.length; i += 500) {
        const { error } = await db.from("price_history").update({ variant_id: targetId }).in("price_id", ids.slice(i, i + 500));
        if (error) console.error(`      move failed: ${error.message}`);
      }
      moved += ids.length; created++;
    }
  }
  console.log(`\n${created} (…,material) variant(s) ${WRITE ? "created" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"} (~${unresolved} unclear stay on base).`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
