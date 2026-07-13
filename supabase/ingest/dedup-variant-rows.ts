/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Merge EXACT-duplicate variant rows (owner 2026-07-12 cleanup lever): variants sharing the
 * same (style_id, size_label, exterior_colorway, exterior_material_id) are the same bag and
 * should be ONE row. Keeps the canonical (most price_history, then lowest id), moves the others'
 * price_history + discovered_listing onto it, deletes the emptied duplicates. Cleans the
 * faceted selector (e.g. the Neverfull's repeated MM) without touching real distinct variants.
 * Dry-run by default; reversible only by re-import (a merge, like merge-style-pairs).
 *   npx tsx supabase/ingest/dedup-variant-rows.ts            # dry run
 *   npx tsx supabase/ingest/dedup-variant-rows.ts --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

async function allVars() {
  const out: any[] = []; const P = 1000;
  for (let f = 0; ; f += P) {
    const { data } = await db.from("variant").select("variant_id,style_id,size_label,exterior_colorway,exterior_material_id,construction_method,hardware_color,strap_type").order("variant_id").range(f, f + P - 1);
    const r = (data ?? []) as any[]; out.push(...r); if (r.length < P) break;
  }
  return out;
}
async function phCount(vid: number) { return (await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", vid)).count ?? 0; }

async function main() {
  console.log(`\ndedup-variant-rows ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const vs = await allVars();
  const groups = new Map<string, any[]>();
  for (const v of vs) {
    // Key on EVERY selector-facing distinguishing field, not just size/colour/material — else a
    // legit construction (Standard vs Bandoulière), hardware, or strap variant reads as a "dup"
    // and gets merged away, collapsing the faceted selector (Speedy Bandoulière regression, 2026-07-12).
    const norm = (s: any) => (s ?? "").toString().toLowerCase().trim();
    const k = `${v.style_id}|${norm(v.size_label)}|${norm(v.exterior_colorway)}|${v.exterior_material_id ?? ""}|${norm(v.construction_method)}|${norm(v.hardware_color)}|${norm(v.strap_type)}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(v);
  }
  const dups = [...groups.values()].filter((g) => g.length > 1);
  let merged = 0, movedRows = 0, deleted = 0;
  for (const g of dups) {
    // canonical = most listings, then lowest variant_id
    const counts = new Map<number, number>();
    for (const v of g) counts.set(v.variant_id, await phCount(v.variant_id));
    const canonical = [...g].sort((a, b) => (counts.get(b.variant_id)! - counts.get(a.variant_id)!) || (a.variant_id - b.variant_id))[0];
    const losers = g.filter((v) => v.variant_id !== canonical.variant_id);
    console.log(`  style ${canonical.style_id} [${canonical.size_label ?? "∅"}/${canonical.exterior_colorway ?? "∅"}/${canonical.exterior_material_id ?? "∅"}] keep v${canonical.variant_id} (${counts.get(canonical.variant_id)} ph); merge ${losers.map((v: any) => `v${v.variant_id}(${counts.get(v.variant_id)})`).join(",")}`);
    for (const l of losers) {
      if (WRITE) {
        const { count: n } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", l.variant_id);
        if (n) { await db.from("price_history").update({ variant_id: canonical.variant_id }).eq("variant_id", l.variant_id); movedRows += n; }
        try { await db.from("discovered_listing").update({ variant_id: canonical.variant_id }).eq("variant_id", l.variant_id); } catch { /* table may lack the column */ }
        const { error } = await db.from("variant").delete().eq("variant_id", l.variant_id);
        if (error) { console.error(`      delete v${l.variant_id} failed: ${error.message}`); continue; }
      }
      deleted++;
    }
    merged++;
  }
  console.log(`\n${merged} group(s), ${deleted} duplicate variant(s) ${WRITE ? "merged+deleted" : "to merge"}, ${movedRows} listings re-pointed.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
