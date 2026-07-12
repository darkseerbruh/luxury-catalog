/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * COLOR PHASE 2 PILOT — Chanel Classic Flap (style #1), 2026-07-11.
 *
 * Proves "color as its own selectable variant + indexable /bag URL" on one style, the
 * URL-preserving additive way (owner Option 1):
 *   - Each existing SIZE variant (Small #200 / Medium #199 / Jumbo #201 / Maxi #202) is KEPT
 *     with its /bag URL. It becomes the size's null-color CATCH-ALL, holding the listings whose
 *     color is unknown or below the page floor. (The Medium is ~60% null-color, so this home
 *     matters.) exterior_colorway stays null there, so it contributes no color chip.
 *   - For each color FAMILY on a size with >= FLOOR colored comps, a new (size, color) variant
 *     is created and that family's listings re-pointed to it. exterior_colorway = the family
 *     (title-case), which is title-facing + honest ("Jumbo Red" really is a red Jumbo).
 * The variant selector then auto-derives a Colour axis (variant-dims.ts). The shop grid keys on
 * (style,size), so color variants still collapse into one "Classic Flap Medium" product there.
 *
 * Skips the "Standard" bucket (#873, filtered from the size axis) + the empty null-size #1615.
 * Reversible: re-point every child's price_history back to its parent + delete the children.
 * Dry-run by default.
 *   npx tsx supabase/ingest/pilot-color-variants-classic-flap.ts            # dry run
 *   npx tsx supabase/ingest/pilot-color-variants-classic-flap.ts --write    # execute
 *   npx tsx supabase/ingest/pilot-color-variants-classic-flap.ts --reverse --write  # undo
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { colorFamily } from "../../src/lib/listings-taxonomy";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = 1;
const SIZE_VARIANTS = [200, 199, 201, 202]; // Small, Medium, Jumbo, Maxi
const FLOOR = 15; // colored comps a family needs to earn its own page (GEO thin-content guard)
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Page through ALL price_history rows for a variant — PostgREST caps every response at
 *  1000 rows regardless of filters ([[postgrest_row_cap]]), so .eq() alone silently truncates. */
async function allPh(variantId: number): Promise<{ price_id: number; colorway: string | null }[]> {
  const out: { price_id: number; colorway: string | null }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,colorway").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

async function forward() {
  console.log(`\npilot-color-variants Classic Flap ${WRITE ? "(WRITE)" : "(DRY RUN)"}  floor=${FLOOR}\n`);
  let created = 0, moved = 0;
  for (const parentId of SIZE_VARIANTS) {
    const { data: pv } = await db.from("variant").select("*").eq("variant_id", parentId).single();
    if (!pv) { console.error(`  parent v${parentId} missing`); continue; }
    const rows = await allPh(parentId);
    // group price_ids by color family
    const byFam = new Map<string, number[]>();
    let nullOrBelow = 0;
    for (const r of rows) {
      const f = r.colorway ? colorFamily(r.colorway) : null;
      if (!f) { nullOrBelow++; continue; }
      (byFam.get(f) ?? byFam.set(f, []).get(f)!).push(r.price_id);
    }
    const families = [...byFam.entries()].filter(([, ids]) => ids.length >= FLOOR).sort((a, b) => b[1].length - a[1].length);
    const belowFloor = [...byFam.entries()].filter(([, ids]) => ids.length < FLOOR).reduce((n, [, ids]) => n + ids.length, 0);
    console.log(`  size "${pv.size_label}" (v${parentId}, ${rows.length} listings): ${families.length} color page(s); catch-all keeps ${nullOrBelow} null + ${belowFloor} below-floor`);
    // Invariant: the split parent is the null-color CATCH-ALL, so it must not carry a color
    // (v199 had a stale "black"). Clearing it avoids a case-collision chip + a mislabeled title.
    if (families.length && pv.exterior_colorway != null) {
      console.log(`      (clear stale parent color "${pv.exterior_colorway}" → null)`);
      if (WRITE) await db.from("variant").update({ exterior_colorway: null }).eq("variant_id", parentId);
    }
    for (const [fam, ids] of families) {
      console.log(`      → ${fam}: ${ids.length} listings → new variant`);
      if (!WRITE) { created++; moved += ids.length; continue; }
      const { data: nv, error } = await db.from("variant")
        .insert({ style_id: STYLE_ID, size_label: pv.size_label, size_category: pv.size_category, exterior_colorway: titleCase(fam), market_availability: pv.market_availability ?? "resale" })
        .select("variant_id").single();
      if (error || !nv) { console.error(`      create failed:`, error?.message); continue; }
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { error: uerr } = await db.from("price_history").update({ variant_id: nv.variant_id }).in("price_id", chunk);
        if (uerr) { console.error(`      move failed:`, uerr.message); continue; }
        moved += chunk.length;
      }
      created++;
    }
  }
  console.log(`\n${created} color variant(s) ${WRITE ? "created" : "planned"}, ${moved} listings ${WRITE ? "re-pointed" : "to move"}.`);
}

async function reverse() {
  console.log(`\npilot-color-variants REVERSE ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  // children = variants on this style that carry a color (created by the pilot)
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_colorway").eq("style_id", STYLE_ID).not("exterior_colorway", "is", null);
  for (const k of (kids ?? []) as any[]) {
    const parent = SIZE_VARIANTS.map((id) => id).length ? null : null;
    // match parent by size_label
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).eq("size_label", k.size_label);
    const parentId = (pv ?? [])[0]?.variant_id;
    if (!parentId) { console.error(`  no null-color parent for size "${k.size_label}" (child v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  child v${k.variant_id} [${k.size_label} ${k.exterior_colorway}] → back to v${parentId} (${count} listings), then delete`);
    if (WRITE) {
      await db.from("price_history").update({ variant_id: parentId }).eq("variant_id", k.variant_id);
      await db.from("variant").delete().eq("variant_id", k.variant_id);
    }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
