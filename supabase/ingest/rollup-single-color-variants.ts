/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Populate `variant.exterior_colorway` ONLY for variants that are genuinely a SINGLE color
 * (2026-07-11). This field is title-facing (it renders in the bag H1 + the "Colorway" spec
 * row), so it must hold one real color, never a rollup of a multi-color size variant. We set
 * it only when a variant's listings are overwhelmingly one color FAMILY (>=90% of colored
 * listings, >=3 colored), which means the bag really is that color; multi-color size variants
 * (e.g. the Classic Flap Medium) correctly stay null. Stored value = the most common raw
 * colorway among the dominant family's listings, title-cased to match existing values.
 *
 * Reversible (only fills nulls). Dry-run by default.
 *   npx tsx supabase/ingest/rollup-single-color-variants.ts            # dry run
 *   npx tsx supabase/ingest/rollup-single-color-variants.ts --write    # execute
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { colorFamily } from "../../src/lib/listings-taxonomy";

const WRITE = process.argv.includes("--write");
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

async function main() {
  console.log(`\nrollup-single-color-variants ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: vs } = await db.from("variant").select("variant_id,style_id,size_label").is("exterior_colorway", null);
  const vids = (vs ?? []).map((v: any) => v.variant_id);
  const meta = new Map<number, any>((vs ?? []).map((v: any) => [v.variant_id, v]));

  const updates: { vid: number; value: string; fam: string; frac: string }[] = [];
  for (let i = 0; i < vids.length; i += 200) {
    const chunk = vids.slice(i, i + 200);
    const { data: ph } = await db.from("price_history").select("variant_id,colorway").in("variant_id", chunk).not("colorway", "is", null);
    const byV = new Map<number, string[]>();
    for (const r of (ph ?? []) as any[]) (byV.get(r.variant_id) ?? byV.set(r.variant_id, []).get(r.variant_id))!.push(r.colorway);
    for (const [vid, cols] of byV) {
      const fam: Record<string, number> = {};
      const rawByFam: Record<string, Record<string, number>> = {};
      for (const c of cols) {
        const f = colorFamily(c);
        if (!f) continue;
        fam[f] = (fam[f] || 0) + 1;
        (rawByFam[f] ??= {})[c.toLowerCase().trim()] = ((rawByFam[f] ??= {})[c.toLowerCase().trim()] || 0) + 1;
      }
      const famTotal = Object.values(fam).reduce((a, b) => a + b, 0);
      if (!famTotal) continue;
      const [topFam, topN] = Object.entries(fam).sort((a, b) => b[1] - a[1])[0];
      if (topN / famTotal < 0.9 || famTotal < 3) continue;
      const topRaw = Object.entries(rawByFam[topFam]).sort((a, b) => b[1] - a[1])[0][0];
      updates.push({ vid, value: titleCase(topRaw), fam: topFam, frac: `${topN}/${famTotal}` });
    }
  }

  for (const u of updates) {
    const m = meta.get(u.vid);
    console.log(`  v${u.vid} style#${m?.style_id} [${m?.size_label ?? "∅"}] -> "${u.value}" (${u.fam} ${u.frac})`);
    if (WRITE) {
      const { error } = await db.from("variant").update({ exterior_colorway: u.value }).eq("variant_id", u.vid);
      if (error) console.error(`    update failed:`, error.message);
    }
  }
  console.log(`\n${updates.length} single-color variant(s) ${WRITE ? "updated" : "would update (dry run)"}.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
