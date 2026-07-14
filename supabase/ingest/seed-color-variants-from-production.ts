/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Production-driven colour variants (owner 2026-07-12). Unlike the reverted listing-derived
 * pilot, the colour axis comes from the PRODUCTION record (production_option, migration 0054):
 * the permanent colour families the house made. For a style we:
 *   - create a (size × permanent-colour) variant for every size × permanent family,
 *   - re-point each size parent's listings whose colour family matches onto them,
 *   - leave seasonal/unknown-colour listings on the size base (the "other colours" entry),
 *   - and KEEP the combos we have no listing for as STUBS (0 listings) — a produced-but-
 *     unlisted colour is still a real, selectable page ("made in this, no photo yet").
 *
 * Reversible: re-point children back to the size base + delete them (--reverse). Paginates
 * price_history (PostgREST 1000-row cap). Dry-run by default.
 *   npx tsx supabase/ingest/seed-color-variants-from-production.ts [--style=1]           # dry run
 *   npx tsx supabase/ingest/seed-color-variants-from-production.ts --style=1 --write     # apply
 *   npx tsx supabase/ingest/seed-color-variants-from-production.ts --style=1 --reverse --write
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { colorFamily } from "../../src/lib/listings-taxonomy";

const WRITE = process.argv.includes("--write");
const REVERSE = process.argv.includes("--reverse");
const STYLE_ID = Number((process.argv.find((a) => a.startsWith("--style=")) ?? "--style=1").split("=")[1]) || 1;
const SEASONAL_FLOOR = 15; // a NON-permanent colour family earns a (data-backed) page at >= this many listings
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

async function allPh(variantId: number): Promise<{ price_id: number; colorway: string | null }[]> {
  const out: any[] = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("price_history").select("price_id,colorway").eq("variant_id", variantId).order("price_id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[]; out.push(...rows); if (rows.length < PAGE) break;
  }
  return out;
}

/** Size variants of the style that carry NO colour (the per-size catch-alls / bases). */
async function sizeBases() {
  const { data } = await db.from("variant").select("variant_id,size_label,exterior_colorway").eq("style_id", STYLE_ID).is("exterior_colorway", null);
  // Keep the "Standard" size-unknown bucket IN: colour is orthogonal to size, "Standard" is hidden
  // from the size chips (visibleDims drops it), and many styles hold their bulk there — so it should
  // still get a colour axis. Only null/empty-size junk is skipped.
  return ((data ?? []) as any[]).filter((v) => v.size_label && String(v.size_label).trim());
}

async function forward() {
  console.log(`\nseed-color-variants-from-production style ${STYLE_ID} ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: colorOpts } = await db.from("production_option").select("value,sort_order").eq("style_id", STYLE_ID).eq("axis", "color").order("sort_order");
  const families = ((colorOpts ?? []) as any[]).map((r) => r.value); // permanent families, in order
  if (!families.length) { console.error("  ABORT: no production colour options — seed production_option first (load-production-options.ts)."); process.exit(1); }
  console.log(`  permanent colour families: ${families.join(", ")}`);

  // Only seed colours onto sizes the PRODUCTION record lists — so junk/mis-parsed size bases
  // ("55", a stray "Jumbo" on the Reissue) never spawn colour variants. If no production sizes
  // are recorded, fall back to every real size base (backward-compatible).
  const { data: sizeOpts } = await db.from("production_option").select("value").eq("style_id", STYLE_ID).eq("axis", "size");
  const productionSizes = new Set(((sizeOpts ?? []) as any[]).map((r) => String(r.value).toLowerCase().trim()));
  const allBases = await sizeBases();
  // "Standard" (size-unknown catch-all) always passes; otherwise the size must be in the production
  // record so a stray/mis-parsed size never spawns colour variants.
  const bases = productionSizes.size === 0 ? allBases : allBases.filter((b: any) => {
    const sz = String(b.size_label).toLowerCase().trim();
    return sz === "standard" || productionSizes.has(sz);
  });
  const skipped = allBases.filter((b: any) => !bases.includes(b)).map((b: any) => b.size_label);
  if (skipped.length) console.log(`  skipping non-production size bases: ${skipped.join(", ")}`);
  let created = 0, moved = 0, stubs = 0;
  for (const base of bases) {
    const rows = await allPh(base.variant_id);
    // price_ids per colour family present on this size (ALL families)
    const idsByFam = new Map<string, number[]>();
    for (const r of rows) {
      const fam = r.colorway ? colorFamily(r.colorway) : null;
      if (fam) (idsByFam.get(fam) ?? idsByFam.set(fam, []).get(fam)!).push(r.price_id);
    }
    // The colour set for this size: every permanent family (stub ok) + any seasonal family
    // with enough listings to back a page (marked seasonal by exclusion from production_option).
    const seasonalFams = [...idsByFam.entries()].filter(([f, ids]) => !families.includes(f) && ids.length >= SEASONAL_FLOOR).map(([f]) => f);
    const selected = [...families, ...seasonalFams];
    const kept = rows.length - selected.reduce((n, f) => n + (idsByFam.get(f)?.length ?? 0), 0);
    console.log(`  size "${base.size_label}" (v${base.variant_id}, ${rows.length} listings): base keeps ${kept} below-floor/unknown`);
    for (const fam of selected) {
      const ids = idsByFam.get(fam) ?? [];
      const isStub = ids.length === 0;
      const seasonal = !families.includes(fam);
      console.log(`      ${fam}${seasonal ? " (seasonal)" : ""}: ${ids.length} listings${isStub ? "  (STUB — produced, no listing yet)" : ""}`);
      if (isStub) stubs++;
      if (!WRITE) { created++; moved += ids.length; continue; }
      // create or find the (size, colour) variant
      const { data: existing } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).eq("size_label", base.size_label).eq("exterior_colorway", titleCase(fam)).limit(1);
      let vid = (existing ?? [])[0]?.variant_id as number | undefined;
      if (!vid) {
        const { data: nv, error } = await db.from("variant").insert({ style_id: STYLE_ID, size_label: base.size_label, size_category: base.size_category ?? null, exterior_colorway: titleCase(fam), market_availability: "resale" }).select("variant_id").single();
        if (error || !nv) { console.error(`        create failed: ${error?.message}`); continue; }
        vid = nv.variant_id; created++;
      }
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { error } = await db.from("price_history").update({ variant_id: vid }).in("price_id", chunk);
        if (error) { console.error(`        move failed: ${error.message}`); continue; }
        moved += chunk.length;
      }
    }
  }
  console.log(`\n${created} colour variant(s) ${WRITE ? "created" : "planned"} (${stubs} stubs), ${moved} listings ${WRITE ? "re-pointed" : "to move"}.`);
}

async function reverse() {
  console.log(`\nseed-color-variants REVERSE style ${STYLE_ID} ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  const { data: kids } = await db.from("variant").select("variant_id,size_label,exterior_colorway").eq("style_id", STYLE_ID).not("exterior_colorway", "is", null);
  for (const k of (kids ?? []) as any[]) {
    const { data: pv } = await db.from("variant").select("variant_id").eq("style_id", STYLE_ID).is("exterior_colorway", null).eq("size_label", k.size_label);
    const parentId = (pv ?? [])[0]?.variant_id;
    if (!parentId) { console.error(`  no base for size "${k.size_label}" (v${k.variant_id}); skip`); continue; }
    const { count } = await db.from("price_history").select("*", { count: "exact", head: true }).eq("variant_id", k.variant_id);
    console.log(`  v${k.variant_id} [${k.size_label} ${k.exterior_colorway}] → v${parentId} (${count} listings), delete`);
    if (WRITE) { await db.from("price_history").update({ variant_id: parentId }).eq("variant_id", k.variant_id); await db.from("variant").delete().eq("variant_id", k.variant_id); }
  }
}

(REVERSE ? reverse() : forward()).then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
