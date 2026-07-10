/**
 * eBay LIVE-listing capture via Firecrawl. eBay bot-blocks plain fetch (item pages 403,
 * verified 2026-06-29) but Firecrawl's headless browser defeats it (browse + item pages
 * scrape fine). eBay item pages carry the RICHEST item-specifics of any source: Condition
 * (+ a written grade explanation), Exterior Material, Hardware Color, Pattern, Style,
 * Features, plus measurements — see docs/data-collection-handoff §0e.
 *
 *   npx tsx supabase/ingest/sources/firecrawl-ebay.ts <targetKey> [--limit=N] [--sold]
 *   # then: npm run load:prices -- ebay --write && npm run summary:refresh
 *   # then (fills material/measurements/etc from the stored text): npm run enrich:descriptions -- --platform=ebay --write
 *
 * COST (metered, owner-gated full run): 1 search scrape (~1-2 cr) + 1 markdown scrape/item
 * (~1 cr). We parse the structurally-clean Condition + price ourselves and store the
 * item-specifics text as a PII-scrubbed reference for the cheap Haiku pass to mine the
 * bleed-prone fields — far cheaper than Firecrawl's 5-credit json extract.
 *
 * TWO MODES:
 *  - default (live): eBay `_sop=12` live listings, price_type 'listed' (fresh asks + rich
 *    item-specifics). eBay purges descriptions once a listing ends, so enrich while live.
 *  - --sold: eBay `LH_Sold=1&LH_Complete=1` completed listings, price_type 'sold' (realized
 *    comps for the weekly sold-sweep lane, see docs/priority-reseller-capture-runbook.md).
 *    MASKED best-offer rows are dropped (accepted amount hidden; the exposed number is the
 *    pre-offer ask, never the sale). observed_on falls back to the ingest date for now; the
 *    sold-date parse is the refinement to land before trusting exact sold-date history.
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

// Hero styles (docs §3). One target per style; size is auto-detected per listing.
// eBay relevance comes from the search query; the curated matcher in load-prices resolves
// brand→style→variant. NOTE: eBay Hermès is counterfeit-noisy (handoff §0a) — treat its
// data as lower-trust until an authenticity filter is added.
const COMMON_EXCLUDES = ["wallet", "pouch", "insert", "organizer", "strap", "lot", "charm", "keychain", "card-holder", "replica"];
const TARGETS: Record<string, EbayTarget> = {
  "louis-vuitton-neverfull": {
    brand: "Louis Vuitton", style: "Neverfull", query: "louis vuitton neverfull",
    sizes: ["PM", "MM", "GM"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES,
    minPrice: 400, maxPrice: 4000,
  },
  "chanel-classic-flap": {
    brand: "Chanel", style: "Classic Flap", query: "chanel classic flap caviar",
    sizes: ["Maxi", "Jumbo", "Medium", "Small", "Mini"], urlIncludes: [],
    urlExcludes: [...COMMON_EXCLUDES, "woc", "clutch"], minPrice: 2500, maxPrice: 15000,
  },
  "gucci-gg-marmont": {
    brand: "Gucci", style: "GG Marmont", query: "gucci gg marmont matelasse bag",
    sizes: ["Small", "Medium", "Mini"], urlIncludes: [],
    urlExcludes: [...COMMON_EXCLUDES, "belt", "shoe"], minPrice: 700, maxPrice: 3500,
  },
  "hermes-birkin": {
    brand: "Hermès", style: "Birkin", query: "hermes birkin",
    sizes: ["25", "30", "35", "40"], urlIncludes: [],
    urlExcludes: [...COMMON_EXCLUDES, "twilly", "inspired", "dupe"], minPrice: 6000, maxPrice: 80000,
  },
  "hermes-kelly": {
    brand: "Hermès", style: "Kelly", query: "hermes kelly bag",
    sizes: ["25", "28", "32"], urlIncludes: [],
    urlExcludes: [...COMMON_EXCLUDES, "pochette", "depeche", "inspired", "dupe"], minPrice: 6000, maxPrice: 80000,
  },
  // Thrift-tier brands (2026-07-02 completion run): Fashionphile carries ZERO
  // inventory for these, so eBay live listings are the primary price surface.
  // Counterfeit noise guarded by minPrice floors + exclude tokens; rows land as
  // 'listed' asks with source_url, same as every other observation.
  "coach-tabby": {
    brand: "Coach", style: "Tabby Shoulder Bag", query: "coach tabby shoulder bag 26",
    sizes: ["26", "20"], urlIncludes: [], urlExcludes: [...COMMON_EXCLUDES, "pillow"], minPrice: 100, maxPrice: 600,
  },
  "coach-pillow-tabby": {
    brand: "Coach", style: "Pillow Tabby", query: "coach pillow tabby",
    sizes: ["26", "18"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 100, maxPrice: 600,
  },
  "coach-willow": {
    brand: "Coach", style: "Willow Tote", query: "coach willow tote",
    sizes: ["Standard"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 80, maxPrice: 500,
  },
  "coach-brooklyn": {
    brand: "Coach", style: "Brooklyn", query: "coach brooklyn shoulder bag",
    sizes: ["28", "39"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 100, maxPrice: 600,
  },
  "coach-rogue": {
    brand: "Coach", style: "Rogue", query: "coach rogue bag",
    sizes: ["Standard"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 150, maxPrice: 900,
  },
  "coach-swinger": {
    brand: "Coach", style: "Swinger", query: "coach swinger vintage",
    sizes: ["Standard"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 50, maxPrice: 400,
  },
  "kate-spade-knott": {
    brand: "Kate Spade", style: "Knott", query: "kate spade knott satchel",
    sizes: ["Standard"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 60, maxPrice: 400,
  },
  "longchamp-le-pliage": {
    brand: "Longchamp", style: "Le Pliage", query: "longchamp le pliage tote",
    sizes: ["Small", "Medium", "Large"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 40, maxPrice: 300,
  },
  "michael-kors-hamilton": {
    brand: "Michael Kors", style: "Hamilton", query: "michael kors hamilton satchel",
    sizes: ["Standard"], urlIncludes: [], urlExcludes: COMMON_EXCLUDES, minPrice: 40, maxPrice: 300,
  },
};

const ITEM_RE = /https:\/\/www\.ebay\.com\/itm\/(\d+)/;

function sizeOf(text: string, sizes: string[]): string | null {
  for (const s of sizes) if (new RegExp(`\\b${s}\\b`).test(text)) return s;
  return null;
}

/** Capture one target's listings into observations. `sold` switches live asks -> sold comps. */
async function captureTarget(target: EbayTarget, limit: number, today: string, sold: boolean): Promise<{ obs: PriceObservation[]; credits: number; failed: number }> {
  // Live: newly-listed asks (_sop=12). Sold: completed+sold, most-recently-ended first (_sop=13).
  const searchUrl = sold
    ? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(target.query)}&LH_Sold=1&LH_Complete=1&_sop=13`
    : `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(target.query)}&_sop=12`;
  console.log(`  search: ${searchUrl}`);
  const search = await scrape(searchUrl, { formats: ["links"], waitFor: 4000 });
  let credits = search.creditsUsed;

  const seen = new Set<string>();
  const items: { url: string; id: string }[] = [];
  for (const raw of search.links ?? []) {
    const m = raw.match(ITEM_RE);
    if (!m) continue;
    const u = m[0].toLowerCase();
    if (target.urlExcludes.some((t) => u.includes(t)) || !target.urlIncludes.every((t) => u.includes(t))) continue;
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    items.push({ url: m[0], id: m[1] });
    if (items.length >= limit) break;
  }
  console.log(`  candidates: ${items.length}`);

  const obs: PriceObservation[] = [];
  let failed = 0;
  for (const it of items) {
    try {
      const page = await scrape(it.url, { formats: ["markdown"], onlyMainContent: true });
      credits += page.creditsUsed;
      const md = page.markdown ?? "";
      // Masked best-offer (sold only): the accepted amount is hidden, so any number on the
      // page is the pre-offer ask, not the sale. Never load it as a comp (eBay data policy).
      if (sold && /best\s*offer\s*accepted/i.test(md)) continue;
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
        price_type: sold ? "sold" : "listed",
        sale_price: price,
        currency: "USD",
        condition: mapEbayCondition(grade),
        observed_on: today,
        source_url: it.url,
        confidence: "high",
        notes: `Firecrawl eBay ${sold ? "sold-comp" : "live"} capture ${today}`,
        enrichment: {
          ...(sourceDescription ? { source_description: sourceDescription } : {}),
          ...(Object.values(descFacts).some((v) => v !== null && v !== false) ? { desc_facts: descFacts } : {}),
        },
      });
    } catch (e) {
      failed++;
      console.warn(`    skip ${it.url}: ${(e as Error).message}`);
    }
    await sleep(1000);
  }
  return { obs, credits, failed };
}

async function main() {
  const key = process.argv[2];
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 25);
  const sold = process.argv.includes("--sold");
  const keys = key === "all" ? Object.keys(TARGETS) : [key];
  if (!key || keys.some((k) => !TARGETS[k])) {
    console.error(`usage: firecrawl-ebay.ts <targetKey|all> [--limit=N] [--sold]. known: ${Object.keys(TARGETS).join(", ")}`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  console.log(`mode: ${sold ? "SOLD comps (LH_Sold+Complete, price_type=sold)" : "LIVE asks (price_type=listed)"}`);
  const all: PriceObservation[] = [];
  let credits = 0, failed = 0;
  for (const k of keys) {
    console.log(`target: ${k}`);
    const r = await captureTarget(TARGETS[k], limit, today, sold);
    all.push(...r.obs);
    credits += r.credits;
    failed += r.failed;
  }

  const res = writeObservations("ebay", all);
  console.log(`landing: kept ${res.kept}, dropped ${res.dropped} (${failed} scrape failures) -> ${res.file}`);
  console.log(`Firecrawl credits used this run: ${credits}`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
