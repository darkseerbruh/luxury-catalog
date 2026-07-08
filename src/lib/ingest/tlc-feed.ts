/**
 * Parser for The Luxury Closet's CJ product feed (Shopping / Google Format,
 * Quoted CSV). Pure + unit-tested: takes the CSV text, returns typed live
 * listings. No DB, no network, no catalog matching (that happens in the loader,
 * supabase/ingest/load-tlc-listings.ts).
 *
 * The Google Shopping schema is stable, but a given advertiser's exact header
 * casing varies, so column reads go through pickCol() with a list of aliases.
 * CONFIRM the real header row against the first live export (feed id 319025) and
 * extend the alias lists if a field comes back empty — never guess a value.
 *
 * We keep only USD rows (the export can carry several currency feeds) and only
 * rows with the fields a buyable card needs (id + click link).
 */
import { canonicalBrand } from "./model-normalize";

export interface TlcListing {
  /** Advertiser product id, e.g. "p1270103" — unique per source. */
  externalId: string;
  title: string;
  /** Canonicalised house name (via canonicalBrand), or null if unrecognised. */
  brandName: string | null;
  /** Current list price and, when on sale, the reduced price. */
  price: number | null;
  salePrice: number | null;
  currency: string;
  availability: "in_stock" | "out_of_stock";
  /** Feed condition: "used" | "new" | "refurbished" | null. */
  itemCondition: string | null;
  color: string | null;
  material: string | null;
  /** Advertiser CDN image (display + link-back licensed while in stock). */
  imageUrl: string | null;
  /** Un-tracked product page, when the feed carries it separately. */
  productUrl: string | null;
  /** CJ deep affiliate link — the image + price MUST be shown paired with this. */
  clickUrl: string;
}

type Row = Record<string, string>;

/** First non-empty value among the candidate column names (case-insensitive). */
function pickCol(row: Row, names: string[]): string | null {
  for (const n of names) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().trim() === n.toLowerCase()) {
        const v = (row[key] ?? "").trim();
        if (v) return v;
      }
    }
  }
  return null;
}

/** Google feed prices look like "753.00 USD" or "753 USD" or "753". */
export function parsePrice(raw: string | null): { value: number | null; currency: string | null } {
  if (!raw) return { value: null, currency: null };
  const m = raw.trim().match(/([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]{3})?/);
  if (!m) return { value: null, currency: null };
  const value = Number(m[1].replace(",", ""));
  return { value: Number.isFinite(value) ? value : null, currency: m[2] ? m[2].toUpperCase() : null };
}

function normAvailability(raw: string | null): "in_stock" | "out_of_stock" {
  const v = (raw ?? "").toLowerCase().replace(/[\s_-]/g, "");
  // Anything not clearly in stock is treated as out of stock (fail safe: we
  // would rather drop a card than show a dead buy link).
  return v === "instock" || v === "available" || v === "1" ? "in_stock" : "out_of_stock";
}

function normCondition(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("refurb")) return "refurbished";
  if (v.includes("new")) return "new";
  if (v.includes("used") || v.includes("pre") || v.includes("owned")) return "used";
  return null;
}

/** Upgrade a known-http advertiser CDN url to https for rendering (avoids mixed
 * content). Exported so the UI can call it at render time without re-ingesting. */
export function toHttps(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://cdn.theluxurycloset.com")) return url.replace(/^http:/, "https:");
  return url;
}

export interface ParseOptions {
  /** Keep only rows in this currency (default USD). */
  currency?: string;
}

/**
 * Parse an already-decompressed feed CSV into typed listings. Rows missing an id
 * or click link are dropped (can't build a buyable card). `rows` is the output
 * of csv-parse with columns:true.
 */
export function parseTlcFeedRows(rows: Row[], opts: ParseOptions = {}): TlcListing[] {
  const wantCurrency = (opts.currency ?? "USD").toUpperCase();
  const out: TlcListing[] = [];
  for (const row of rows) {
    const externalId = pickCol(row, ["id", "product_id", "sku", "mpn"]);
    const clickUrl = pickCol(row, ["link", "buy_url", "product_url", "clickurl", "click_url"]);
    const title = pickCol(row, ["title", "name", "product_name"]);
    if (!externalId || !clickUrl || !title) continue;

    const priced = parsePrice(pickCol(row, ["price", "regular_price"]));
    const saled = parsePrice(pickCol(row, ["sale_price", "saleprice"]));
    const currency = priced.currency ?? saled.currency ?? wantCurrency;
    if (currency.toUpperCase() !== wantCurrency) continue;

    const brandRaw = pickCol(row, ["brand", "brand_name", "manufacturer"]);
    out.push({
      externalId,
      title,
      brandName: brandRaw ? canonicalBrand(brandRaw) : null,
      price: priced.value,
      salePrice: saled.value,
      currency: wantCurrency,
      availability: normAvailability(pickCol(row, ["availability", "in_stock", "stock"])),
      itemCondition: normCondition(pickCol(row, ["condition", "item_condition"])),
      color: pickCol(row, ["color", "colour"]),
      material: pickCol(row, ["material", "fabric"]),
      imageUrl: pickCol(row, ["image_link", "image_url", "image", "imageurl"]),
      productUrl: pickCol(row, ["product_page_url", "landing_page", "product_url"]),
      clickUrl,
    });
  }
  return out;
}
