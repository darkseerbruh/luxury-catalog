/**
 * eBay SOLD-comp adapter — Apify `automation-lab/ebay-sold-scraper` (auction-only).
 *
 * eBay's value to us is REALIZED sold prices, not live asks (see [[ebay_data_policy]]).
 * Two policy rules are enforced at capture, not here, so this adapter stays simple:
 *   1. AUCTION-ONLY (`listingType: "auction"`): auction finals settle by bid and CANNOT
 *      be best-offer masked, so every row is a true realized price. This sidesteps the
 *      masked-row problem entirely (masked best-offer rows must never enter a median).
 *   2. AG FLOOR: run tier 1-3 brand queries with `minPrice: 500` (eBay's Authenticity
 *      Guarantee physically inspects eligible handbags at $500+). This adapter also drops
 *      sub-$500 rows defensively so a mis-set run can't leak below the floor.
 *
 * Brand is parsed from the eBay title (luxury titles lead with the house) via
 * canonicalBrand; the loader resolves brand+title to a variant or banks it.
 *
 *   npx tsx supabase/ingest/sources/ebay-sold-apify.ts <rawKey> [--floor=500] [--date=YYYY-MM-DD]
 */
import fs from "fs";
import path from "path";
import { writeObservations } from "../lib/landing";
import { canonicalBrand } from "../../../src/lib/ingest/model-normalize";
import type { PriceObservation, SaleCondition } from "../../../src/lib/ingest/types";

interface EbaySoldRecord {
  soldPrice?: number | null;
  soldPriceString?: string | null;
  soldDate?: string | null;
  condition?: string | null;
  listingType?: string | null;
  bidsCount?: number | null;
  itemId?: string | null;
  title?: string | null;
  url?: string | null;
  shippingCost?: string | null;
}

/** eBay coarse condition → SaleCondition enum. Only "new" is certain; never fake a graded tier. */
function mapCondition(c: string | null | undefined): SaleCondition | null {
  const s = (c ?? "").toLowerCase();
  if (s.includes("new") && !s.includes("open")) return "new";
  return null;
}

/** Normalize an eBay soldDate ("Sold Jul 5, 2026" / ISO) to YYYY-MM-DD, else null. */
function soldDateIso(s: string | null | undefined): string | null {
  if (!s) return null;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const m = s.match(/([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) {
    const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    const mo = months[m[1].toLowerCase()];
    if (mo) return `${m[3]}-${mo}-${m[2].padStart(2, "0")}`;
  }
  return null;
}

export function recordToObservation(rec: EbaySoldRecord, floor: number, fallbackDate: string): PriceObservation | null {
  const price = typeof rec.soldPrice === "number" && Number.isFinite(rec.soldPrice) ? rec.soldPrice : NaN;
  if (!Number.isFinite(price) || price < floor) return null; // AG floor guard
  if (!rec.title?.trim() || !rec.url?.trim()) return null;

  const brand = canonicalBrand(rec.title.trim());
  return {
    brand,
    style: rec.title.trim(),
    attrs: {
      size_label: null,
      exterior_colorway: null,
      exterior_material: null,
      hardware_color: null,
      production_year: null,
      season: null,
      condition_detail: rec.condition?.trim() || null,
      region: "US",
      listing_ref: rec.itemId?.trim() || null,
    },
    platform: "eBay",
    price_type: "sold",
    sale_price: price,
    currency: "USD",
    condition: mapCondition(rec.condition),
    observed_on: soldDateIso(rec.soldDate) || fallbackDate,
    source_url: rec.url.trim(),
    confidence: "medium",
    notes: rec.title.trim(),
    enrichment: { bids_count: rec.bidsCount ?? null, listing_type: rec.listingType ?? null },
  };
}

function main() {
  const args = process.argv.slice(2);
  const floor = Number((args.find((a) => a.startsWith("--floor=")) || "--floor=500").split("=")[1]);
  const fallbackDate = args.find((a) => a.startsWith("--date="))?.slice("--date=".length) || new Date().toISOString().slice(0, 10);
  const rawKey = args.find((a) => !a.startsWith("--"));
  if (!rawKey) { console.error("Usage: tsx ebay-sold-apify.ts <rawKey> [--floor=500] [--date=YYYY-MM-DD]"); process.exit(1); }

  const file = path.resolve(__dirname, "../../../data/ingest/_raw", `${rawKey}.json`);
  const records = JSON.parse(fs.readFileSync(file, "utf8")) as EbaySoldRecord[];
  const obs: PriceObservation[] = [];
  let belowFloor = 0;
  for (const rec of records) {
    const o = recordToObservation(rec, floor, fallbackDate);
    if (o) obs.push(o); else if ((rec.soldPrice ?? 0) < floor) belowFloor++;
  }
  const { file: out, kept, dropped } = writeObservations("ebay", obs);
  console.log(`ebay-sold-apify: ${records.length} record(s) -> ${kept} sold obs (${dropped} invalid, ${belowFloor} below $${floor} floor).`);
  console.log(`Wrote ${out}. Next: npm run load:prices -- ebay --write`);
}

if (require.main === module) main();
