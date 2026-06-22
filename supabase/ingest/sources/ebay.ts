/**
 * eBay current-resale-price adapter (Browse API). For each hero target, OAuth
 * (client-credentials) then search active listings, emitting one `listed`
 * observation per listing (current asking price) with the item URL for
 * link-back. Feeds the resale side of the bag pages (fair-market range).
 * Run: `npm run ingest:ebay`  (needs EBAY_APP_ID + EBAY_CERT_ID in .env.local).
 *
 * Sold/realized prices need the gated Marketplace Insights API — separate, later.
 */
import {
  EBAY_OAUTH_ENDPOINT,
  EBAY_HANDBAG_CATEGORY,
  buildBrowseSearchUrl,
  parseBrowseItems,
} from "../../../src/lib/ingest/ebay";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

const APP_ID = process.env.EBAY_APP_ID;
const CERT_ID = process.env.EBAY_CERT_ID;

interface EbayTarget {
  brand: string;
  style: string;
  size_label: string;
  query: string;
  minPrice: number;
  maxPrice: number;
}

const TARGETS: EbayTarget[] = [
  { brand: "Chanel", style: "Classic Flap", size_label: "Medium", query: "Chanel Classic Flap Medium caviar", minPrice: 2000, maxPrice: 20000 },
  { brand: "Hermès", style: "Birkin", size_label: "Birkin 30", query: "Hermes Birkin 30", minPrice: 5000, maxPrice: 80000 },
  { brand: "Hermès", style: "Birkin", size_label: "Birkin 35", query: "Hermes Birkin 35", minPrice: 5000, maxPrice: 80000 },
  { brand: "Hermès", style: "Kelly", size_label: "Kelly 28", query: "Hermes Kelly 28", minPrice: 5000, maxPrice: 80000 },
  { brand: "Louis Vuitton", style: "Neverfull", size_label: "Neverfull MM Monogram", query: "Louis Vuitton Neverfull MM Monogram", minPrice: 600, maxPrice: 5000 },
  { brand: "Gucci", style: "GG Marmont", size_label: "GG Marmont Small", query: "Gucci GG Marmont small matelasse flap", minPrice: 700, maxPrice: 5000 },
];

async function getToken(): Promise<string> {
  const basic = Buffer.from(`${APP_ID}:${CERT_ID}`).toString("base64");
  const res = await fetch(EBAY_OAUTH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`eBay OAuth failed: HTTP ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("eBay OAuth: no access_token in response");
  return json.access_token;
}

async function searchTarget(token: string, t: EbayTarget): Promise<PriceObservation[]> {
  const url = buildBrowseSearchUrl(t.query, {
    limit: 50,
    categoryIds: EBAY_HANDBAG_CATEGORY,
    minPrice: t.minPrice,
    maxPrice: t.maxPrice,
    currency: "USD",
  });
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });
  if (!res.ok) {
    console.warn(`  ${t.query}: HTTP ${res.status}`);
    return [];
  }
  const items = parseBrowseItems(await res.json());
  const today = new Date().toISOString().slice(0, 10);
  console.log(`ebay: ${t.brand} ${t.size_label} — ${items.length} listing(s)`);
  return items.map((it) => ({
    brand: t.brand,
    style: t.style,
    attrs: { size_label: t.size_label },
    platform: "eBay",
    price_type: "listed" as const,
    sale_price: it.price,
    currency: it.currency,
    condition: it.condition,
    observed_on: today,
    source_url: it.url,
    confidence: "high" as const,
    notes: it.title.slice(0, 160),
  }));
}

async function main() {
  if (!APP_ID || !CERT_ID) {
    console.error("Missing EBAY_APP_ID / EBAY_CERT_ID in .env.local — add your eBay production keys first.");
    process.exit(1);
  }
  const token = await getToken();
  const all: PriceObservation[] = [];
  for (const t of TARGETS) all.push(...(await searchTarget(token, t)));
  const { file, kept, dropped } = writeObservations("ebay", all);
  console.log(`ebay: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
