/**
 * Fashionphile live-price adapter (reseller current prices). Reads a public
 * listing/search page for a configured style, extracts in-band prices, and emits
 * `listed` observations stamped with today's date + the page URL for link-back
 * (docs/data-sourcing-research.md §3.1 — prices are facts; we read politely and
 * attribute). Run: `npm run ingest:fashionphile`.
 *
 * NOTE: this parses page text coarsely (lowest in-band price = representative
 * current entry price for the style). Once an affiliate datafeed with per-item
 * price fields is approved, prefer that over page-reading — see the research doc.
 */
import { stripTags } from "../../../src/lib/ingest/html";
import { parseAllPrices } from "../../../src/lib/ingest/price-extract";
import { politeFetchText } from "../lib/fetch";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface ResellerTarget {
  brand: string;
  style: string;
  size_label?: string;
  url: string;
  minPrice: number;
  maxPrice: number;
}

const PLATFORM = "Fashionphile";

const TARGETS: ResellerTarget[] = [
  {
    brand: "Chanel",
    style: "Classic Flap",
    size_label: "Medium",
    url: "https://www.fashionphile.com/shop/chanel/classic-flap",
    minPrice: 1500,
    maxPrice: 25000,
  },
];

async function ingestTarget(t: ResellerTarget): Promise<PriceObservation | null> {
  const text = stripTags(await politeFetchText(t.url));
  const prices = parseAllPrices(text)
    .map((p) => p.amount)
    .filter((a) => a >= t.minPrice && a <= t.maxPrice);
  if (prices.length === 0) {
    console.warn(`fashionphile: no in-band prices for ${t.brand} ${t.style} (page may need JS / selector tuning)`);
    return null;
  }
  const amount = Math.min(...prices);
  return {
    brand: t.brand,
    style: t.style,
    attrs: { size_label: t.size_label },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: amount,
    currency: "USD",
    observed_on: new Date().toISOString().slice(0, 10),
    source_url: t.url,
    confidence: "medium",
    notes: `current entry price; min of ${prices.length} in-band listings`,
  };
}

async function main() {
  const out: PriceObservation[] = [];
  for (const t of TARGETS) {
    const obs = await ingestTarget(t);
    if (obs) out.push(obs);
  }
  const { file, kept, dropped } = writeObservations("fashionphile", out);
  console.log(`fashionphile: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
