/**
 * The RealReal — Apify actor adapter.
 *
 * TheRealReal is bot-blocked to plain fetch and its logged-in browser session drops
 * constantly (see [[trr_capture_sessions]]), so the durable capture path is the cloud
 * Apify actor `lulzasaur/therealreal-scraper`, which reads TRR's server-rendered
 * product JSON through a residential proxy (bypasses PerimeterX) and returns clean,
 * structured, multi-brand records — no local browser, nothing to get kicked out of.
 *
 * This adapter maps that actor's dataset (saved to data/ingest/_raw/<rawKey>.json as a
 * plain array) into PriceObservation[] in the landing zone, so `load:prices therealreal`
 * resolves each to a curated variant or banks it to discovered_listing (catch-all).
 * Unlike trr-jsonld.ts (single --brand, JSON-LD desc parsing), this keeps the actor's
 * already-structured colour / material / condition / size and is inherently multi-brand.
 *
 *   npx tsx supabase/ingest/sources/trr-apify.ts <rawKey> [--date=YYYY-MM-DD]
 *     <rawKey>  basename (no .json) under data/ingest/_raw/ (default: newest trr-apify-*)
 *
 * Actor record shape (fields we use):
 *   { brand, title, price, originalPrice, msrp, size, condition, color, material,
 *     availability, sku, url, scrapedAt }
 */
import fs from "fs";
import path from "path";
import { writeObservations } from "../lib/landing";
import type { PriceObservation, PriceType, SaleCondition } from "../../../src/lib/ingest/types";

interface ApifyTrrRecord {
  brand?: string | null;
  title?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  msrp?: number | null;
  size?: string | null;
  condition?: string | null;
  color?: string | null;
  material?: string | null;
  availability?: string | null;
  sku?: string | null;
  url?: string | null;
  scrapedAt?: string | null;
}

/** TRR graded condition string → catalog SaleCondition enum. */
function mapCondition(c: string | null | undefined): SaleCondition | null {
  switch ((c ?? "").trim().toLowerCase()) {
    case "pristine":
    case "excellent":
      return "excellent";
    case "very good":
      return "very good";
    case "good":
      return "good";
    case "fair":
    case "as is":
      return "fair";
    default:
      return null;
  }
}

/** availability → price_type. SOLD is realized (a completed sale at that price). */
function priceTypeFor(availability: string | null | undefined): PriceType {
  return (availability ?? "").trim().toUpperCase() === "SOLD" ? "sold" : "listed";
}

/** Best-effort size token from the listing title (the actor's `size` is usually null). */
const SIZE_TOKENS = [
  "nano", "micro", "mini", "small", "medium", "large", "maxi", "jumbo",
  "pm", "mm", "gm", "bb", "east west", "east-west",
];
function detectSize(title: string | null | undefined, sizeField: string | null | undefined): string | null {
  const s = (sizeField ?? "").trim();
  if (s) return s;
  const hay = (title ?? "").toLowerCase();
  for (const t of SIZE_TOKENS) {
    const re = t.includes(" ") || t.includes("-") ? new RegExp(t.replace(/[-\s]/g, "[-\\s]")) : new RegExp(`\\b${t}\\b`);
    if (re.test(hay)) return t.toUpperCase().length <= 3 ? t.toUpperCase() : t.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

/** Map one actor record to a PriceObservation, or null when it can't be a valid row. */
export function recordToObservation(rec: ApifyTrrRecord, observedOn: string): PriceObservation | null {
  const price = typeof rec.price === "number" && Number.isFinite(rec.price) ? rec.price : NaN;
  if (!Number.isFinite(price) || price <= 0) return null;
  if (!rec.brand?.trim() || !rec.title?.trim() || !rec.url?.trim()) return null;

  return {
    brand: rec.brand.trim(),
    style: rec.title.trim(),
    attrs: {
      size_label: detectSize(rec.title, rec.size),
      exterior_colorway: rec.color?.trim() || null,
      exterior_material: rec.material?.trim() || null,
      hardware_color: null,
      production_year: null,
      season: null,
      condition_detail: rec.condition?.trim() || null,
      region: "US",
      listing_ref: rec.sku?.trim() || null,
    },
    platform: "The RealReal",
    price_type: priceTypeFor(rec.availability),
    sale_price: price,
    currency: "USD",
    condition: mapCondition(rec.condition),
    observed_on: observedOn,
    source_url: rec.url.trim(),
    confidence: "medium",
    notes: rec.title.trim(),
    // TRR "Est. Retail" is the site's estimate, not a verified MSRP — keep it as a
    // sub-signal, never asserted as an MSRP price row.
    enrichment: {
      est_retail_trr: typeof rec.msrp === "number" ? rec.msrp : null,
      availability: rec.availability ?? null,
    },
  };
}

function newestRawKey(): string | null {
  const dir = path.resolve(__dirname, "../../../data/ingest/_raw");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.startsWith("trr-apify-") && f.endsWith(".json")).sort();
  return files.length ? files[files.length - 1].replace(/\.json$/, "") : null;
}

function main() {
  const args = process.argv.slice(2);
  const dateArg = args.find((a) => a.startsWith("--date="))?.slice("--date=".length);
  const rawKey = args.find((a) => !a.startsWith("--")) ?? newestRawKey();
  if (!rawKey) {
    console.error("Usage: tsx trr-apify.ts <rawKey> [--date=YYYY-MM-DD]  (no trr-apify-* file found)");
    process.exit(1);
  }
  const file = path.resolve(__dirname, "../../../data/ingest/_raw", `${rawKey}.json`);
  const records = JSON.parse(fs.readFileSync(file, "utf8")) as ApifyTrrRecord[];

  // Observed-on: the actor's scrapedAt (fallback to the CLI date / today).
  const fallback = dateArg || new Date().toISOString().slice(0, 10);
  const obs: PriceObservation[] = [];
  for (const rec of records) {
    const observedOn = (rec.scrapedAt || "").slice(0, 10) || fallback;
    const o = recordToObservation(rec, observedOn);
    if (o) obs.push(o);
  }

  const sold = obs.filter((o) => o.price_type === "sold").length;
  const { file: out, kept, dropped } = writeObservations("therealreal", obs);
  console.log(`trr-apify: ${records.length} record(s) -> ${kept} observation(s) (${dropped} dropped), ${sold} SOLD/realized.`);
  console.log(`Wrote ${out}. Next: npm run load:prices -- therealreal --write`);
}

if (require.main === module) main();
