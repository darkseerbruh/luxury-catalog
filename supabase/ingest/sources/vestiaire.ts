/**
 * Vestiaire Collective source adapter.
 *
 * Vestiaire runs on Next.js. Product and search pages embed `__NEXT_DATA__`
 * containing the full product node (brand, colour, material, condition,
 * country/region, price). This is the richest resale source for region/currency
 * data — prioritise for cross-currency fair-market comparisons.
 *
 * Capture step (Claude in Chrome — same-origin, defeats bot-block):
 *   1. Open a Vestiaire search page in Chrome:
 *        https://www.vestiairecollective.com/search/?q=chanel+classic+flap+medium
 *   2. Collect product page URLs from the results.
 *   3. For each URL, fetch the page and extract __NEXT_DATA__:
 *        const r = await fetch(url, {credentials:'include'});
 *        const html = await r.text();
 *        const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
 *        const data = JSON.parse(m[1]);
 *        // The product node lives at: data.props.pageProps.product  (or similar path)
 *        // Also check: data.props.pageProps.initialState.product
 *        return data;
 *   4. Accumulate product nodes + their canonical URLs into an array and save as:
 *        data/ingest/_raw/vestiaire.json  →  [{node:{...}, url:"https://..."}, ...]
 *   5. Run:
 *        npx tsx supabase/ingest/sources/vestiaire.ts
 *
 * Each record maps through parseVestiaireProduct() → PriceObservation with
 * confidence:"high", price_type:"listed", source_url per listing.
 *
 * Legal/attribution: prices are facts; every row carries source_url.
 * Never ingest product photos or verbatim descriptions.
 */
import fs from "fs";
import path from "path";
import { parseVestiaireProduct } from "../../../src/lib/ingest/vestiaire";
import type { VestiaireProductNode } from "../../../src/lib/ingest/vestiaire";
import { writeObservations } from "../lib/landing";
import type { PriceObservation, SaleCondition } from "../../../src/lib/ingest/types";

const PLATFORM = "Vestiaire Collective";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/vestiaire.json");

// ---------------------------------------------------------------------------
// TARGETS — one entry per catalog variant we want to capture.
// ---------------------------------------------------------------------------

interface VestiaireTarget {
  brand: string;
  style: string;
  size_label: string;
  /** Tokens that must ALL appear (case-insensitive) in node.name or node.brand.name. */
  requireTokens: string[];
  minPrice: number;
  maxPrice: number;
}

const TARGETS: VestiaireTarget[] = [
  {
    brand: "Chanel",
    style: "Classic Flap",
    size_label: "Medium",
    requireTokens: ["chanel", "flap"],
    minPrice: 1500,
    maxPrice: 25000,
  },
];

// ---------------------------------------------------------------------------
// Raw dump entry shape
// ---------------------------------------------------------------------------

interface RawDumpEntry {
  /** The __NEXT_DATA__ product node (or JSON-LD Product). */
  node: VestiaireProductNode;
  /** Canonical listing URL — must be captured alongside the node. */
  url?: string;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapRawRecord(entry: RawDumpEntry, today: string): PriceObservation | null {
  const { node, url: entryUrl } = entry;

  // Prefer explicit url in dump entry; fall back to node.url
  const listingUrl = entryUrl ?? node.url;
  if (!listingUrl) {
    console.warn("vestiaire: record missing url — skipping (required for attribution)");
    return null;
  }

  // Match to a TARGETS entry
  const brandName = typeof node.brand === "string" ? node.brand : (node.brand?.name ?? "");
  const nameLower = (node.name ?? "").toLowerCase();
  const brandLower = brandName.toLowerCase();

  const target = TARGETS.find((t) =>
    t.requireTokens.every(
      (tok) => nameLower.includes(tok) || brandLower.includes(tok)
    )
  );
  if (!target) {
    console.warn(`vestiaire: no target matched for listing "${node.name ?? node.id}" — skipping`);
    return null;
  }

  const spec = parseVestiaireProduct(node);

  if (!spec.price) {
    console.warn(`vestiaire: no price for listing "${node.name ?? node.id}" — skipping`);
    return null;
  }
  if (spec.price < target.minPrice || spec.price > target.maxPrice) {
    console.warn(`vestiaire: price ${spec.price} out of band [${target.minPrice}–${target.maxPrice}] for "${node.name ?? node.id}" — skipping`);
    return null;
  }

  const listingRef = node.id != null ? String(node.id) : (node.uuid ?? null);

  return {
    brand: target.brand,
    style: target.style,
    attrs: {
      size_label: target.size_label,
      exterior_colorway: spec.color,
      exterior_material: spec.material,
      hardware_color: spec.hardwareColor,
      condition_detail: node.condition ?? null,
      region: spec.region,
      listing_ref: listingRef,
    },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: spec.price,
    currency: spec.currency,
    condition: spec.condition as SaleCondition | null,
    observed_on: today,
    source_url: listingUrl,
    confidence: "high",
    notes: node.name?.slice(0, 160) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`vestiaire: dump not found at ${RAW_DUMP}`);
    console.error("Capture step: in Chrome on vestiairecollective.com:");
    console.error("  1. Open a search results page for the target bag.");
    console.error("  2. For each product URL, fetch the page and extract __NEXT_DATA__:");
    console.error("     const html = await fetch(url,{credentials:'include'}).then(r=>r.text());");
    console.error("     const m = html.match(/<script id=\"__NEXT_DATA__\"[^>]+>([^<]+)<\\/script>/);");
    console.error("     const data = JSON.parse(m[1]);");
    console.error("     // node = data.props.pageProps.product (check your Vestiaire Next.js version)");
    console.error("  3. Accumulate: [{node, url}, ...] → save to data/ingest/_raw/vestiaire.json");
    process.exit(1);
  }

  const raw: RawDumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const today = new Date().toISOString().slice(0, 10);

  const obs: PriceObservation[] = raw
    .map((e) => mapRawRecord(e, today))
    .filter((o): o is PriceObservation => o !== null);

  const { file, kept, dropped } = writeObservations("vestiaire", obs);
  console.log(`vestiaire: ${raw.length} records, ${kept} kept${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

main();
