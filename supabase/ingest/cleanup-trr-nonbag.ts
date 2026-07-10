/**
 * Un-promote + de-contaminate TheRealReal NON-bag listings.
 *
 * TRR's Apify capture (sources/trr-apify.ts) is multi-brand AND multi-category, so a
 * "Triomphe" belt / hoodie / wallet, a "Sylvie" shoe, an "Alma" bag-strap etc. share a
 * brand+model token with a real bag. The clustered promoter (promote-safe.ts) groups on
 * (brand_guess, style_guess) and the bag gate (canonicalModel) passes "Triomphe" because
 * a Triomphe *bag* exists — so the garment/accessory got promoted onto the bag's variant
 * and its (much cheaper) asking price was written into price_history, deflating the bag's
 * comps. See [[trr_mismap_sweep_method]] for the sibling title-based sweep.
 *
 * The reliable non-bag signal is TRR's URL department path, not the title — the new
 * isTrrHandbagListing() helper reads it (false for /clothing|shoes|accessories|jewelry|
 * watches|home|kids/). This pass:
 *   1. finds every TRR price_history row whose source_url is a non-bag department  → DELETE
 *      (preserving any row that has no discovered_listing backup first, so nothing is lost),
 *   2. finds every promoted (promoted_variant_id set) TRR discovered_listing row that is a
 *      non-bag → UN-PROMOTE (promoted_variant_id/promoted_at → null, unresolved_reason
 *      'non_bag') so it can never re-seed a bag's comps,
 *   3. refreshes variant_price_summary and prints the affected variants before/after.
 *
 * Historical price observations are permanent data points ([[feedback_historical_price_data]]),
 * so a deleted price_history row is always preserved in discovered_listing as raw evidence
 * first — the un-promoted rows ARE that archive; the few price rows that reached the catalog
 * via direct load-matching (no discovered backup) are banked before deletion.
 *
 *   npx tsx supabase/ingest/cleanup-trr-nonbag.ts            # DRY RUN (report only)
 *   npx tsx supabase/ingest/cleanup-trr-nonbag.ts --write    # apply
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { isTrrHandbagListing } from "../../src/lib/ingest/trr";

const PLATFORM = "The RealReal";
const WRITE = process.argv.includes("--write");

interface PhRow {
  price_id: number;
  variant_id: number;
  source_url: string | null;
  listing_ref: string | null;
  sale_price: number | null;
  currency: string | null;
  price_type: string | null;
  condition: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
  production_year: number | null;
  season: string | null;
  observed_on: string | null;
  notes: string | null;
}
interface DiscRow {
  discovered_id: number;
  source_url: string | null;
  promoted_variant_id: number | null;
}

interface SummaryRow {
  variant_id: number;
  resale_low: number | null;
  resale_median: number | null;
  resale_high: number | null;
  last_sold_price: number | null;
  sample_size: number | null;
  currency: string | null;
}
interface VariantMeta {
  variant_id: number;
  size_label: string | null;
  style: { name: string | null; brand: { name: string | null } | null } | null;
}

/** Page past the PostgREST 1000-row cap ([[postgrest_row_cap]]). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase query builder is chained inside `apply`
type QueryBuilder = any;
async function pageAll<T>(table: string, cols: string, apply: (q: QueryBuilder) => QueryBuilder): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await apply(db.from(table).select(cols).range(from, from + 999));
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Stable per-listing id when a price row carries no listing_ref: the TRR URL slug. */
function refFromUrl(url: string | null): string | null {
  if (!url) return null;
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop();
  return seg || null;
}

async function summaries(variantIds: number[]): Promise<Map<number, SummaryRow>> {
  const map = new Map<number, SummaryRow>();
  for (let i = 0; i < variantIds.length; i += 500) {
    const { data } = await db
      .from("variant_price_summary")
      .select("variant_id, resale_low, resale_median, resale_high, last_sold_price, sample_size, currency")
      .in("variant_id", variantIds.slice(i, i + 500));
    for (const r of (data ?? []) as SummaryRow[]) map.set(r.variant_id, r);
  }
  return map;
}

async function main() {
  console.log(`cleanup-trr-nonbag: ${WRITE ? "WRITE" : "DRY RUN"}\n`);

  // 1) price_history contamination — authoritative scan by URL department path.
  const ph = await pageAll<PhRow>(
    "price_history",
    "price_id, variant_id, source_url, listing_ref, sale_price, currency, price_type, condition, colorway, material, hardware_color, production_year, season, observed_on, notes",
    (q) => q.eq("platform", PLATFORM),
  );
  const phNonBag = ph.filter((r) => !isTrrHandbagListing(r.source_url));
  const affectedVariants = [...new Set(phNonBag.map((r) => r.variant_id))].sort((a, b) => a - b);

  // 2) promoted discovered_listing rows that are non-bags → to un-promote.
  const promoted = await pageAll<DiscRow>(
    "discovered_listing",
    "discovered_id, source_url, promoted_variant_id",
    (q) => q.eq("platform", PLATFORM).not("promoted_variant_id", "is", null),
  );
  const nonBagPromoted = promoted.filter((r) => !isTrrHandbagListing(r.source_url));

  // Variant → style/brand names for the report.
  const { data: vRows } = await db
    .from("variant")
    .select("variant_id, size_label, style:style_id(name, brand:brand_id(name))")
    .in("variant_id", affectedVariants.length ? affectedVariants : [-1]);
  const vName = new Map<number, string>();
  for (const v of (vRows ?? []) as unknown as VariantMeta[]) {
    vName.set(v.variant_id, `${v.style?.brand?.name ?? "?"} ${v.style?.name ?? "?"} [${v.size_label ?? "-"}]`);
  }

  // Which contaminated price rows have NO discovered_listing backup → must preserve before delete.
  const allDiscUrls = new Set(
    (await pageAll<{ source_url: string | null }>("discovered_listing", "source_url", (q) => q.eq("platform", PLATFORM)))
      .map((r) => r.source_url),
  );
  const orphans = phNonBag.filter((r) => !allDiscUrls.has(r.source_url));

  // --- REPORT ---
  console.log(`price_history: ${ph.length} TRR rows; ${phNonBag.length} are NON-bag contamination across ${affectedVariants.length} variant(s).`);
  const perVar = new Map<number, number>();
  for (const r of phNonBag) perVar.set(r.variant_id, (perVar.get(r.variant_id) ?? 0) + 1);
  for (const [v, n] of [...perVar.entries()].sort((a, b) => b[1] - a[1])) {
    const total = ph.filter((r) => r.variant_id === v).length;
    console.log(`   v${v}  ${vName.get(v) ?? "?"}  ${n}/${total} TRR rows are non-bag`);
  }
  console.log(`\ndiscovered_listing: ${nonBagPromoted.length} non-bag rows already promoted onto a bag variant — ${WRITE ? "un-promoting" : "left in place"}.`);
  console.log(`orphan price rows (no discovered_listing backup, will be preserved before delete): ${orphans.length}`);
  if (orphans.length) for (const r of orphans) console.log(`   #${r.price_id} v${r.variant_id} ${r.source_url}`);

  const before = await summaries(affectedVariants);

  if (!WRITE) {
    console.log(`\nDRY RUN — re-run with --write to delete ${phNonBag.length} price row(s), un-promote ${nonBagPromoted.length} discovered row(s), and refresh summaries.`);
    return;
  }

  // --- WRITE ---
  // (a) Preserve orphan price rows as raw evidence (un-promoted, non_bag) before deleting.
  if (orphans.length) {
    const seen = new Set<string>();
    const preserve = orphans
      .map((r) => ({
        platform: PLATFORM,
        listing_ref: r.listing_ref ?? refFromUrl(r.source_url) ?? `ph-${r.price_id}`,
        source_url: r.source_url,
        raw_name: r.notes,
        price_type: r.price_type ?? "listed",
        sale_price: r.sale_price,
        currency: r.currency ?? "USD",
        condition: r.condition,
        colorway: r.colorway,
        material: r.material,
        hardware_color: r.hardware_color,
        production_year: r.production_year,
        season: r.season,
        unresolved_reason: "non_bag",
        observed_on: r.observed_on,
      }))
      .filter((d) => d.sale_price != null && d.observed_on)
      .filter((d) => {
        const k = `${d.listing_ref}|${d.observed_on}|${d.sale_price}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    if (preserve.length) {
      const { error } = await db.from("discovered_listing").upsert(preserve, {
        onConflict: "platform,listing_ref,observed_on,sale_price",
        ignoreDuplicates: true,
      });
      if (error) throw new Error(`preserve upsert failed: ${error.message}`);
      console.log(`\npreserved ${preserve.length} orphan row(s) in discovered_listing (non_bag, un-promoted).`);
    }
  }

  // (b) Delete the contaminated price_history rows.
  const ids = phNonBag.map((r) => r.price_id);
  for (let i = 0; i < ids.length; i += 500) {
    const { error } = await db.from("price_history").delete().in("price_id", ids.slice(i, i + 500));
    if (error) throw new Error(`price_history delete failed: ${error.message}`);
  }
  console.log(`deleted ${ids.length} non-bag price_history row(s).`);

  // (c) Un-promote the non-bag discovered rows so they can't re-seed comps.
  const dids = nonBagPromoted.map((r) => r.discovered_id);
  for (let i = 0; i < dids.length; i += 500) {
    const { error } = await db
      .from("discovered_listing")
      .update({ promoted_variant_id: null, promoted_at: null, unresolved_reason: "non_bag" })
      .in("discovered_id", dids.slice(i, i + 500));
    if (error) throw new Error(`un-promote update failed: ${error.message}`);
  }
  console.log(`un-promoted ${dids.length} non-bag discovered_listing row(s).`);

  // (d) Rebuild the summary MV and show the affected variants before/after.
  const { error: rErr } = await db.rpc("refresh_variant_price_summary");
  if (rErr) throw new Error(`refresh_variant_price_summary failed: ${rErr.message}`);
  const after = await summaries(affectedVariants);
  console.log("\nAffected variant price summaries (before → after):");
  for (const v of affectedVariants) {
    const b = before.get(v);
    const a = after.get(v);
    const fmt = (s: SummaryRow | undefined) =>
      s ? `n=${s.sample_size} med=${s.resale_median ?? "-"} [${s.resale_low ?? "-"}–${s.resale_high ?? "-"}]` : "(no summary)";
    console.log(`   v${v} ${vName.get(v) ?? "?"}\n       before: ${fmt(b)}\n       after:  ${fmt(a)}`);
  }
  console.log("\n✅ done.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("cleanup-trr-nonbag failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
