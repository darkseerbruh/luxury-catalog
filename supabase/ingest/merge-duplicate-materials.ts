/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Merge duplicate material rows that differ only by a " Leather"/" Canvas" suffix or letter case
 * (owner 2026-07-12 follow-on): e.g. "Togo Leather" (#7) vs "Togo leather" (#34), "Lambskin" vs
 * "Lambskin Leather". The display already collapses them via cleanMaterialLabel, but they spawn
 * duplicate variant rows. Canonical = the row with the most variants (then lowest id); repoint the
 * duplicates' variants (exterior + interior material) onto it, delete the empties. Follow with
 * dedup-variant-rows.ts to collapse any now-identical variants. Dry-run by default.
 *   npx tsx supabase/ingest/merge-duplicate-materials.ts            # dry run
 *   npx tsx supabase/ingest/merge-duplicate-materials.ts --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");
const norm = (s: string) => s.toLowerCase().replace(/\s+(leather|canvas|goatskin|calf)$/, "").replace(/\s+/g, " ").trim();

async function varCount(matId: number, col: "exterior_material_id" | "interior_material_id") {
  return (await db.from("variant").select("*", { count: "exact", head: true }).eq(col, matId)).count ?? 0;
}

async function main() {
  console.log(`\nmerge-duplicate-materials ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data } = await db.from("material").select("material_id,name,material_type").order("material_id");
  const groups = new Map<string, any[]>();
  for (const m of (data ?? []) as any[]) (groups.get(norm(m.name)) ?? groups.set(norm(m.name), []).get(norm(m.name))!).push(m);

  let merged = 0, deleted = 0;
  for (const [k, g] of groups) {
    if (g.length < 2) continue;
    // canonical = most exterior variants, then lowest id
    const withCounts = await Promise.all(g.map(async (m) => ({ m, c: await varCount(m.material_id, "exterior_material_id") })));
    withCounts.sort((a, b) => b.c - a.c || a.m.material_id - b.m.material_id);
    const canon = withCounts[0].m;
    const losers = withCounts.slice(1).map((x) => x.m);
    console.log(`  [${k}] keep #${canon.material_id} "${canon.name}"; merge ${losers.map((l) => `#${l.material_id}"${l.name}"`).join(", ")}`);
    for (const l of losers) {
      if (WRITE) {
        await db.from("variant").update({ exterior_material_id: canon.material_id }).eq("exterior_material_id", l.material_id);
        await db.from("variant").update({ interior_material_id: canon.material_id }).eq("interior_material_id", l.material_id);
        const { error } = await db.from("material").delete().eq("material_id", l.material_id);
        if (error) { console.error(`     delete #${l.material_id} failed: ${error.message}`); continue; }
      }
      deleted++;
    }
    merged++;
  }
  console.log(`\n${merged} group(s), ${deleted} duplicate material(s) ${WRITE ? "merged+deleted" : "to merge"}. ${WRITE ? "Now run dedup-variant-rows.ts." : ""}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
