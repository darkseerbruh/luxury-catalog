/**
 * Auction-archive adapter (historical realized prices). Reads a public auction
 * results page and extracts realized prices + sale dates into `auction`
 * observations (docs/data-sourcing-research.md §3.3). Strongest for Hermès and
 * rare exotics, which actually trade at auction; common bags rarely appear, so
 * this is primarily a Phase-3 (Hermès) source. Run: `npm run ingest:auction`.
 *
 * Archived results markup is house-specific; this does coarse text extraction
 * (price + nearby date) and lands rows at confidence 'medium'. Tune the target
 * URLs / parsing per house as coverage expands.
 */
import { stripTags, extractDate } from "../../../src/lib/ingest/html";
import { parsePrice } from "../../../src/lib/ingest/price-extract";
import { politeFetchText } from "../lib/fetch";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface AuctionTarget {
  brand: string;
  style: string;
  platform: string;
  url: string;
  minPrice: number;
  maxPrice: number;
}

const TARGETS: AuctionTarget[] = [
  // Example: a Heritage Auctions results URL for Hermès Birkin. Replace with the
  // specific archive/search result pages to harvest.
  {
    brand: "Hermès",
    style: "Birkin",
    platform: "Heritage Auctions",
    url: "https://www.ha.com/c/search-results.zx?N=0&Nty=1&Ntk=SI_Titles&Ntt=hermes+birkin",
    minPrice: 3000,
    maxPrice: 500000,
  },
];

/** Split stripped page text into rough lot chunks around price tokens. */
function lotChunks(text: string): string[] {
  // Break before each currency token so each chunk carries one price + context.
  return text.split(/(?=(?:Realized|Sold|Hammer|USD|\$)\s)/i).filter((c) => c.length > 20);
}

async function ingestTarget(t: AuctionTarget): Promise<PriceObservation[]> {
  const text = stripTags(await politeFetchText(t.url));
  const out: PriceObservation[] = [];
  for (const chunk of lotChunks(text)) {
    const price = parsePrice(chunk);
    if (!price || price.amount < t.minPrice || price.amount > t.maxPrice) continue;
    const date = extractDate(chunk);
    if (!date) continue; // an undated realized price isn't useful for a timeline
    out.push({
      brand: t.brand,
      style: t.style,
      attrs: {},
      platform: t.platform,
      price_type: "auction",
      sale_price: price.amount,
      currency: price.currency,
      observed_on: date,
      source_url: t.url,
      confidence: "medium",
      notes: "auction realized price (coarse archive parse)",
    });
  }
  console.log(`auction: ${t.brand} ${t.style} — ${out.length} realized price(s)`);
  return out;
}

async function main() {
  const all: PriceObservation[] = [];
  for (const t of TARGETS) all.push(...(await ingestTarget(t)));
  const { file, kept, dropped } = writeObservations("auction", all);
  console.log(`auction: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
