/**
 * Wayback historical-price adapter. Reconstructs a long price history for a style
 * (docs/data-sourcing-research.md §3.4). Resellers archived *individual product
 * pages* (Fashionphile's old `/-CHANEL-…-12345` URLs), each carrying one price —
 * so we: list domain captures via the CDX API, keep the ones whose URL names the
 * style, fetch each archived page, and take its price stamped with the capture
 * date. Output: backdated `listed` observations at confidence 'medium' (archived
 * markup varies, so prices are best-effort). Run: `npm run ingest:wayback`.
 */
import {
  cdxQueryUrl,
  parseCdxResponse,
  filterCapturesByKeywords,
  type CdxCapture,
} from "../../../src/lib/ingest/wayback";
import { stripTags } from "../../../src/lib/ingest/html";
import { parseAllPrices } from "../../../src/lib/ingest/price-extract";
import { politeFetchJson, politeFetchText } from "../lib/fetch";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface WaybackTarget {
  brand: string;
  style: string;
  platform: string;
  /** Domain wildcard fed to the CDX API (matchType=domain). */
  domainPattern: string;
  /** All must appear in an archived URL for it to count as this style's page. */
  urlKeywords: string[];
  minPrice: number;
  maxPrice: number;
  /** Cap fetched product pages so one run stays polite. */
  maxPages?: number;
}

const TARGETS: WaybackTarget[] = [
  {
    brand: "Chanel",
    style: "Classic Flap",
    platform: "Fashionphile (archived)",
    domainPattern: "fashionphile.com/*chanel*",
    urlKeywords: ["chanel", "flap"],
    minPrice: 1500,
    maxPrice: 25000,
    maxPages: 60,
  },
];

async function listProductCaptures(t: WaybackTarget): Promise<CdxCapture[]> {
  const cdxUrl = cdxQueryUrl(t.domainPattern, {
    matchType: "domain",
    limit: 5000,
  });
  // collapse=urlkey would drop date variety; we keep all then thin per URL below.
  const all = parseCdxResponse(await politeFetchJson(cdxUrl));
  const matched = filterCapturesByKeywords(all, t.urlKeywords);
  // One capture per distinct product URL (the earliest = closest to listing date).
  const byUrl = new Map<string, CdxCapture>();
  for (const c of matched) {
    const ex = byUrl.get(c.original);
    if (!ex || c.timestamp < ex.timestamp) byUrl.set(c.original, c);
  }
  return [...byUrl.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

async function ingestTarget(t: WaybackTarget): Promise<PriceObservation[]> {
  let captures = await listProductCaptures(t);
  if (t.maxPages) captures = captures.slice(0, t.maxPages);
  console.log(`wayback: ${t.brand} ${t.style} — ${captures.length} archived product page(s)`);

  const out: PriceObservation[] = [];
  for (const cap of captures) {
    try {
      const text = stripTags(await politeFetchText(cap.snapshotUrl));
      const prices = parseAllPrices(text)
        .map((p) => p.amount)
        .filter((a) => a >= t.minPrice && a <= t.maxPrice);
      if (prices.length === 0) continue;
      // A product page's headline price is the lowest in-band figure (vs. larger
      // "retail when new" / financing totals also on the page).
      const amount = Math.min(...prices);
      out.push({
        brand: t.brand,
        style: t.style,
        attrs: {},
        platform: t.platform,
        price_type: "listed",
        sale_price: amount,
        currency: "USD",
        observed_on: cap.date,
        source_url: cap.snapshotUrl,
        confidence: "medium",
        notes: `Wayback ${cap.timestamp}; ${cap.original}`,
      });
    } catch (err) {
      console.warn(`  skip ${cap.date}: ${String(err)}`);
    }
  }
  return out;
}

async function main() {
  const all: PriceObservation[] = [];
  for (const t of TARGETS) all.push(...(await ingestTarget(t)));
  const { file, kept, dropped } = writeObservations("wayback", all);
  console.log(`wayback: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
