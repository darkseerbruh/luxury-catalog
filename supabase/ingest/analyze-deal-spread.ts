/**
 * Deal-band threshold analysis for the "Shop the market" rating engine — READ-ONLY.
 *
 * The bands (Great / Good / Fair / Above market) live as tunable constants at the top of
 * src/lib/listings-core.ts. Picking them honestly needs the REAL spread of how listings
 * sit vs. their fair value, which only exists against prod data. This script computes
 * exactly that: it rates every live listing the same way the app does (the shared pure
 * core) and prints the distribution of "percent under fair value" plus what each candidate
 * threshold would label, so the constants can be set from data instead of a guess.
 *
 *   npx tsx supabase/ingest/analyze-deal-spread.ts
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (read-only;
 * writes nothing). Mirrors the app's getShopProducts grouping (style + size), so the
 * numbers match what users see.
 */

import { supabaseAdmin } from "../seed/lib/client";
import {
  computeFairValue,
  classifyDeal,
  type SpecComp,
  type ItemSpec,
  type DealBand,
  GREAT_UNDER_PCT,
  GOOD_UNDER_PCT,
  FAIR_OVER_PCT,
} from "../../src/lib/listings-core";

const RETAIL_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

interface Row {
  styleId: number;
  sizeLabel: string | null;
  price: number;
  priceType: string | null;
  platform: string | null;
  spec: ItemSpec;
}

const one = <T>(rel: T | T[] | null | undefined): T | null => (Array.isArray(rel) ? rel[0] : rel) ?? null;

async function fetchAll(): Promise<Row[]> {
  const SELECT =
    "sale_price, platform, price_type, colorway, material, hardware_color, production_year, " +
    "variant:variant_id(size_label, exterior_colorway, hardware_color, exterior_material:exterior_material_id(name), style:style_id(style_id))";
  const out: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("price_history")
      .select(SELECT)
      .not("sale_price", "is", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as unknown as Record<string, unknown>[]) {
      const price = r.sale_price != null ? Number(r.sale_price) : null;
      if (price == null || !Number.isFinite(price) || price <= 0) continue;
      const variant = one(r.variant as Record<string, unknown> | Record<string, unknown>[] | null);
      const style = variant ? one(variant.style as { style_id: number } | { style_id: number }[] | null) : null;
      const mat = variant ? one(variant.exterior_material as { name: string } | { name: string }[] | null) : null;
      out.push({
        styleId: style?.style_id ?? 0,
        sizeLabel: (variant?.size_label as string | null) ?? null,
        price,
        priceType: (r.price_type as string | null) ?? null,
        platform: (r.platform as string | null) ?? null,
        spec: {
          colorway: (r.colorway as string | null) ?? (variant?.exterior_colorway as string | null) ?? null,
          material: (r.material as string | null) ?? mat?.name ?? null,
          hardwareColor: (r.hardware_color as string | null) ?? (variant?.hardware_color as string | null) ?? null,
          productionYear: (r.production_year as number | null) ?? null,
        },
      });
    }
    if (data.length < PAGE) break;
  }
  return out;
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[i];
}

async function main() {
  console.log("Loading price_history…");
  const rows = await fetchAll();
  console.log(`Loaded ${rows.length} price rows.`);

  // Group by style + size (mirrors getShopProducts).
  const groups = new Map<string, { comps: SpecComp[]; listed: Row[] }>();
  for (const r of rows) {
    if (r.styleId === 0) continue;
    const key = `${r.styleId}::${r.sizeLabel ?? ""}`;
    let g = groups.get(key);
    if (!g) {
      g = { comps: [], listed: [] };
      groups.set(key, g);
    }
    const isRetail = r.priceType === "retail_msrp" || (r.priceType == null && r.platform != null && RETAIL_RX.test(r.platform));
    if (!isRetail) g.comps.push({ ...r.spec, salePrice: r.price, realized: r.priceType === "sold" || r.priceType === "auction" });
    if (r.priceType === "listed") g.listed.push(r);
  }

  // Rate every live listing; collect pctUnder.
  const pctUnders: number[] = [];
  const bandCounts: Record<DealBand, number> = { great: 0, good: 0, fair: 0, above: 0 };
  let ungraded = 0;
  let realizedBasis = 0;
  for (const g of groups.values()) {
    for (const l of g.listed) {
      const fv = computeFairValue(l.spec, g.comps);
      if (!fv) {
        ungraded++;
        continue;
      }
      if (fv.realized) realizedBasis++;
      const rating = classifyDeal(l.price, fv);
      pctUnders.push(rating.pctUnder);
      bandCounts[rating.band]++;
    }
  }

  const graded = pctUnders.length;
  console.log(`\nLive listings: ${graded + ungraded} (graded ${graded}, ungraded ${ungraded})`);
  console.log(`Rated off realized sold prices: ${realizedBasis} / ${graded}`);
  if (graded === 0) {
    console.log("No gradeable listings — load resale data first.");
    return;
  }

  const sorted = pctUnders.slice().sort((a, b) => a - b);
  console.log("\nDistribution of % under fair value (negative = over):");
  for (const p of [5, 10, 25, 50, 75, 90, 95]) {
    console.log(`  p${p.toString().padStart(2)}: ${pct(sorted, p).toString().padStart(5)}%`);
  }

  const sharePct = (n: number) => `${((n / graded) * 100).toFixed(1)}%`;
  console.log(`\nUnder CURRENT thresholds (great≥${GREAT_UNDER_PCT}, good≥${GOOD_UNDER_PCT}, fair≥-${FAIR_OVER_PCT}):`);
  console.log(`  great: ${bandCounts.great} (${sharePct(bandCounts.great)})`);
  console.log(`  good:  ${bandCounts.good} (${sharePct(bandCounts.good)})`);
  console.log(`  fair:  ${bandCounts.fair} (${sharePct(bandCounts.fair)})`);
  console.log(`  above: ${bandCounts.above} (${sharePct(bandCounts.above)})`);

  console.log(
    "\nSuggestion: if you want ~top 15% = 'great' and the next ~25% = 'good', set\n" +
      `  GREAT_UNDER_PCT ≈ ${pct(sorted, 85)}  (the p85 of % under)\n` +
      `  GOOD_UNDER_PCT  ≈ ${pct(sorted, 60)}  (the p60)\n` +
      "  FAIR_OVER_PCT   ≈ keep symmetric to taste\n" +
      "Tune to the share you want in each band, then edit the constants in src/lib/listings-core.ts.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
