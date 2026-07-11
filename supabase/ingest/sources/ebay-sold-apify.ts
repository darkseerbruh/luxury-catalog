/**
 * eBay SOLD catch-all adapter — Apify `automation-lab/ebay-sold-scraper` (auction-only).
 *
 * DIFFERENT JOB from ebay-sold-sweep.ts: that one is SCOPED (attributes rows to a hand-
 * curated target-style rule set, drops everything else — precise, for second-sourcing a
 * known thin style). THIS one is CATCH-ALL / BROAD: it maps EVERY auction-sold row to a
 * PriceObservation and lets `load:prices ebay` resolve it to a catalog variant or bank it
 * to discovered_listing (nothing dropped), the same posture as trr-apify.ts / fashionphile.
 * Use it for wide realized-comp coverage; use the sweep when targeting specific styles.
 *
 * Policy (see [[ebay_data_policy]]) is enforced at CAPTURE, so this stays simple:
 *   • AUCTION-ONLY runs → bid-settled finals that CANNOT be best-offer masked (no masked
 *     row can slip into a median — the whole masking problem is sidestepped).
 *   • AG FLOOR: run tier 1-3 brand queries with the actor's `minPrice: 500`; this adapter
 *     also drops sub-floor rows defensively.
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
  soldDate?: string | null;
  condition?: string | null;
  listingType?: string | null;
  bidsCount?: number | null;
  itemId?: string | null;
  title?: string | null;
  url?: string | null;
  // Live-actor (khadinakbar) field aliases — normalized here so one adapter reads both.
  price?: number | null;
  itemUrl?: string | null;
  isSold?: boolean | null;
}

/** Junk/parts/replica/collab-noise tokens — a title carrying one is not a sellable bag comp
 *  (mirrors ebay-sold-sweep.ts; matters most for the low-floor mid-tier where noise is denser). */
const JUNK = [
  "replica", "inspired", "style bag", "dust bag only", "dustbag only", "box only", "strap only",
  "insert", "organizer", "liner", "lot of", "charm", "keychain", "key chain", "key ring",
  "wallet only", "for parts", "repair", "as-is", "read desc", "empty box", "receipt",
  "perfume", "parfum", "eau de", "fragrance", "cologne", "spray", "keyring", "sticker", "print ad",
];
function isJunk(title: string): boolean {
  const t = title.toLowerCase();
  return JUNK.some((j) => t.includes(j));
}

/** eBay coarse condition → SaleCondition. Only "new" is certain; never fake a graded tier. */
function mapCondition(c: string | null | undefined): SaleCondition | null {
  const s = (c ?? "").toLowerCase();
  if (s.includes("new") && !s.includes("pre-owned") && !s.includes("open")) return "new";
  return null;
}

/** Normalize an eBay soldDate ("Jul 5, 2026" / ISO) to YYYY-MM-DD, else null. */
export function soldDateIso(s: string | null | undefined): string | null {
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

export function recordToObservation(rec: EbaySoldRecord, floor: number, fallbackDate: string, live = false): PriceObservation | null {
  const raw = rec.soldPrice ?? rec.price;
  const price = typeof raw === "number" && Number.isFinite(raw) ? raw : NaN;
  if (!Number.isFinite(price) || price < floor) return null; // AG-floor guard
  if (!rec.title?.trim() || !rec.itemId) return null;
  if (isJunk(rec.title)) return null; // parts/replica/collab-noise never enters a median
  // In live mode a "sold" row would be stale noise — only keep active listings.
  if (live && rec.isSold === true) return null;
  const url = (rec.url ?? rec.itemUrl)?.trim() || `https://www.ebay.com/itm/${rec.itemId}`;

  return {
    brand: canonicalBrand(rec.title.trim()),
    style: rec.title.trim(),
    attrs: {
      size_label: null, exterior_colorway: null, exterior_material: null, hardware_color: null,
      production_year: null, season: null,
      condition_detail: rec.condition?.trim() || null, region: "US",
      listing_ref: String(rec.itemId).trim(),
    },
    platform: "eBay",
    // Live = a current asking listing (loader stamps listing_status 'available' +
    // today's observed_on, which the age-based reconcile uses as "last seen").
    price_type: live ? "listed" : "sold",
    sale_price: price,
    currency: "USD",
    condition: mapCondition(rec.condition),
    observed_on: live ? fallbackDate : (soldDateIso(rec.soldDate) || fallbackDate),
    source_url: url,
    confidence: "medium",
    notes: rec.title.trim(),
    enrichment: { bids_count: rec.bidsCount ?? null, listing_type: rec.listingType ?? null },
  };
}

function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const floor = Number((args.find((a) => a.startsWith("--floor=")) || `--floor=${live ? 25 : 500}`).split("=")[1]);
  const fallbackDate = args.find((a) => a.startsWith("--date="))?.slice("--date=".length) || new Date().toISOString().slice(0, 10);
  const rawKey = args.find((a) => !a.startsWith("--"));
  if (!rawKey) { console.error("Usage: tsx ebay-sold-apify.ts <rawKey> [--live] [--floor=N] [--date=YYYY-MM-DD]"); process.exit(1); }

  const file = path.resolve(__dirname, "../../../data/ingest/_raw", `${rawKey}.json`);
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const records: EbaySoldRecord[] = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
  const obs: PriceObservation[] = [];
  let belowFloor = 0;
  for (const rec of records) {
    const o = recordToObservation(rec, floor, fallbackDate, live);
    if (o) obs.push(o); else if (((rec.soldPrice ?? rec.price) ?? 0) < floor) belowFloor++;
  }
  const { file: out, kept, dropped } = writeObservations("ebay", obs);
  console.log(`ebay-sold-apify: ${records.length} record(s) -> ${kept} ${live ? "LIVE (listed)" : "sold"} obs (${dropped} invalid, ${belowFloor} below $${floor}).`);
  console.log(`Wrote ${out}. Next: npm run load:prices -- ebay --write`);
}

if (require.main === module) main();
