/**
 * eBay LIVE-listing capture via Firecrawl. eBay bot-blocks plain fetch (item pages 403,
 * verified 2026-06-29) but Firecrawl's headless browser defeats it (browse + item pages
 * scrape fine). eBay item pages carry the RICHEST item-specifics of any source: Condition
 * (+ a written grade explanation), Exterior Material, Hardware Color, Pattern, Style,
 * Features, plus measurements — see docs/data-collection-handoff §0e.
 *
 *   npx tsx supabase/ingest/sources/firecrawl-ebay.ts <targetKey> [--limit=N]
 *   # then: npm run load:prices -- ebay --write && npm run summary:refresh
 *   # then (fills material/measurements/etc from the stored text): npm run enrich:descriptions -- --platform=ebay --write
 *
 * COST (metered, owner-gated full run): 1 search scrape (~1-2 cr) + 1 markdown scrape/item
 * (~1 cr). We parse the structurally-clean Condition + price ourselves and store the
 * item-specifics text as a PII-scrubbed reference for the cheap Haiku pass to mine the
 * bleed-prone fields — far cheaper than Firecrawl's 5-credit json extract.
 *
 * LIVE only: eBay purges descriptions once a listing ends, so this captures price_type
 * 'listed'. Our existing 1,641 eBay rows are SOLD and can't be back-enriched.
 */
import { scrape, sleep } from "../lib/firecrawl";
import { writeObservations } from "../lib/landing";
import {
  parseEbayItemSpecifics, splitEbayCondition, mapEbayCondition,
  extractEbaySpecificsSection, parseEbayPrice,
} from "../../../src/lib/ingest/ebay-item";
import { extractDescriptionFacts, scrubPii } from "../../../src/lib/ingest/description-facts";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface EbayTarget {
  brand: string;
  style: string;
  query: string;
  sizes: string[];
  /** A product URL must include ALL of these (lowercased). */
  urlIncludes: string[];
  /** ...and NONE of these (drops wallets / accessories / lots). */
  urlExcludes: string[];
  minPrice: number;
  maxPrice: number;
}

const TARGETS: Record<string, EbayTarget> = {
  "louis-vuitton-neverfull": {
    brand: "Louis Vuitton", style: "Neverfull", query: "louis vuitton neverfull",
    sizes: ["PM", "MM", "GM"],
    urlIncludes: [], urlExcludes: ["wallet", "pouch", "insert", "organizer", "strap", "lot", "charm"],
    minPrice: 400, maxPrice: 4000,
  },
};

const ITEM_RE = /https:\/\/www\.ebay\.com\/itm\/(\d+)/;

function sizeOf(text: string, sizes: string[]): string | null {
  for (const s of sizes) if (new RegExp(`\\b${s}\\b`).test(text)) return s;
  return null;
}

async function main() {
  const key = process.argv[2];
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 25);
  const target = key && TARGETS[key];
  if (!target) {
    console.error(`unknown targetKey "${key}". known: ${Object.keys(TARGETS).join(", ")}`);
    process.exit(1);
  }

  const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(target.query)}&_sop=12`;
  console.log(`search: ${searchUrl}`);
  const search = await scrape(searchUrl, { formats: ["links"], waitFor: 4000 });
  let credits = search.creditsUsed;

  const seen = new Set<string>();
  const items: { url: string; id: string }[] = [];
  for (const raw of search.links ?? []) {
    const m = raw.match(ITEM_RE);
    if (!m) continue;
    const url = m[0];
    const u = url.toLowerCase();
    if (target.urlExcludes.some((t) => u.includes(t)) || !target.urlIncludes.every((t) => u.includes(t))) continue;
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    items.push({ url, id: m[1] });
    if (items.length >= limit) break;
  }
  console.log(`candidates: ${items.length}`);

  const today = new Date().toISOString().slice(0, 10);
  const obs: PriceObservation[] = [];
  let failed = 0;
  for (const it of items) {
    try {
      const page = await scrape(it.url, { formats: ["markdown"], onlyMainContent: true });
      credits += page.creditsUsed;
      const md = page.markdown ?? "";
      const price = parseEbayPrice(md, target.minPrice, target.maxPrice);
      if (!price) continue;

      const specs = parseEbayItemSpecifics(md);
      const { grade, detail } = splitEbayCondition(specs["Condition"]);
      const sectionText = extractEbaySpecificsSection(md);
      const sourceDescription = scrubPii(sectionText);
      const descFacts = extractDescriptionFacts(sectionText ?? "");

      obs.push({
        brand: target.brand,
        style: target.style,
        attrs: {
          size_label: sizeOf(md.slice(0, 400), target.sizes),
          exterior_colorway: specs["Color"] ?? specs["Exterior Color"] ?? descFacts.color,
          hardware_color: (specs["Hardware Color"] ?? "").toLowerCase().split(/[ ,]/)[0] || null,
          condition_detail: detail,
          region: "US",
          listing_ref: it.id,
        },
        platform: "ebay",
        price_type: "listed",
        sale_price: price,
        currency: "USD",
        condition: mapEbayCondition(grade),
        observed_on: today,
        source_url: it.url,
        confidence: "high",
        notes: `Firecrawl eBay capture ${today}`,
        enrichment: {
          ...(sourceDescription ? { source_description: sourceDescription } : {}),
          ...(Object.values(descFacts).some((v) => v !== null && v !== false) ? { desc_facts: descFacts } : {}),
        },
      });
    } catch (e) {
      failed++;
      console.warn(`  skip ${it.url}: ${(e as Error).message}`);
    }
    await sleep(1000);
  }

  const res = writeObservations("ebay", obs);
  console.log(`landing: kept ${res.kept}, dropped ${res.dropped} (${failed} scrape failures) -> ${res.file}`);
  console.log(`Firecrawl credits used this run: ${credits}`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
