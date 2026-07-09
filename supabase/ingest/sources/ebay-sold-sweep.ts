/**
 * eBay SOLD sweep — second-source unlock for one-source styles (2026-07-09).
 *
 * Maps raw sold-search captures (data/ingest/_raw/ebay-sweep/*.json, gathered
 * in-session via the Firecrawl MCP; the CLI path needs FIRECRAWL_API_KEY which
 * this env lacks) to PriceObservation landing files for `load:prices ebay`.
 *
 * The calibrated eBay rules (supersede the 2026-06-26 blanket skip):
 * - SOLD >= $500 from covered brands passed eBay's physical Authenticity
 *   Guarantee, so tier 1-3 rows load only at a $500 floor. Tier 5 (no AG
 *   coverage) loads from $25 with junk filters; sub-$25 is parts/noise.
 * - Best-offer MASKED rows (strikethrough price = ceiling, not the paid price)
 *   are NEVER loaded — counted and reported instead, so no median ever blends
 *   a masked number. (eBay shows the listing price struck through, not the
 *   accepted offer.)
 * - Title must carry the brand + style tokens; parts/collab/junk tokens drop.
 *
 * All 49 sweep styles are single-variant, so no size parsing is needed and the
 * pickVariant first-variant fallback cannot mis-place a row.
 *
 *   npx tsx supabase/ingest/sources/ebay-sold-sweep.ts [--write]
 *   # then: npm run load:prices -- ebay --write && npm run summary:refresh
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface RawItem { t: string; p: number; s: boolean; d: string; id: string; auction?: boolean }
interface RawFile { key?: string; brand: string; style: string; items: RawItem[] }

/** Apify ebay-sold-scraper dataset row (auction-only runs; mixed queries). */
interface ApifyItem {
  itemId: string; title: string; soldPrice: number; soldDate: string;
  listingType?: string; bidsCount?: number | null;
}

/** Per-key rules: which catalog style the rows belong to + filters. */
interface Rule {
  brand: string;
  style: string;
  /** Title must include at least one token from EACH group (lowercased). */
  requireGroups: string[][];
  exclude: string[];
  minPrice: number;
}

const JUNK = ["replica", "dust bag only", "box only", "strap only", "insert", "organizer",
  "lot of", "charm", "keychain", "key chain", "wallet only", "for parts", "read desc",
  "perfume", "parfum", "eau de", "fragrance", "cologne", "spray"];
const LV_COLLAB = ["murakami", "x tm", "takashi"];

/** $500 = the AG inspection floor for tier 1-3 brands (verified 2026-07-09). */
const AG_FLOOR = 500;
const MID_FLOOR = 25;

const RULES: Record<string, Rule> = {
  // batch1 (inline file) --------------------------------------------------
  "louis-vuitton-pochette-accessoires": {
    brand: "Louis Vuitton", style: "Monogram Pochette Accessories",
    requireGroups: [["pochette"], ["accessoires", "accessories"]],
    exclude: [...JUNK, ...LV_COLLAB, "multi pochette", "mini pochette"], minPrice: AG_FLOOR,
  },
  "louis-vuitton-new-wave-chain-pm": {
    brand: "Louis Vuitton", style: "Louis Vuitton Pale Blue Leather New Wave Chain PM Bag",
    requireGroups: [["new wave"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "kate-spade-knott": {
    brand: "Kate Spade", style: "Knott",
    requireGroups: [["knott", "knot"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "kate-spade-sam": {
    brand: "Kate Spade", style: "Sam",
    requireGroups: [["sam"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "longchamp-le-pliage": {
    brand: "Longchamp", style: "Le Pliage",
    requireGroups: [["pliage"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  // agent batches ----------------------------------------------------------
  "lv-multi-pochette": {
    brand: "Louis Vuitton", style: "Multi Pochette Accessoires",
    requireGroups: [["multi pochette"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "lv-deauville": {
    brand: "Louis Vuitton", style: "Deauville",
    requireGroups: [["deauville"]], exclude: [...JUNK, ...LV_COLLAB, "mini"], minPrice: AG_FLOOR,
  },
  "goyard-artois": {
    brand: "Goyard", style: "Artois", requireGroups: [["artois"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "therow-soft-margaux": {
    brand: "The Row", style: "Soft Margaux",
    requireGroups: [["margaux"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "jacquemus-le-bambino": {
    brand: "Jacquemus", style: "Le Bambino",
    requireGroups: [["bambino"]], exclude: [...JUNK, "bambimou", "grand"], minPrice: MID_FLOOR,
  },
  "miumiu-matelasse": {
    brand: "Miu Miu", style: "Matelassé",
    requireGroups: [["matelasse", "matelassé"]],
    exclude: [...JUNK, "wander", "arcadie", "aventure"], minPrice: AG_FLOOR,
  },
  "goyard-boheme": {
    brand: "Goyard", style: "Boheme", requireGroups: [["boheme", "bohème"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "goyard-belvedere": {
    brand: "Goyard", style: "Belvedere",
    requireGroups: [["belvedere", "belvédère"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "goyard-saigon": {
    brand: "Goyard", style: "Saigon", requireGroups: [["saigon", "saïgon"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "lv-cosmetic-pouch": {
    brand: "Louis Vuitton", style: "Cosmetic Pouch",
    requireGroups: [["cosmetic"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "lv-felicie-strap-go": {
    brand: "Louis Vuitton", style: "Félicie Strap & Go",
    requireGroups: [["felicie", "félicie"], ["strap"]], exclude: [...JUNK.filter((j) => j !== "strap only"), ...LV_COLLAB],
    minPrice: AG_FLOOR,
  },
  "lv-felicie-pochette": {
    brand: "Louis Vuitton", style: "Félicie Pochette",
    requireGroups: [["felicie", "félicie"]], exclude: [...JUNK, ...LV_COLLAB, "strap & go", "strap and go"],
    minPrice: AG_FLOOR,
  },
  "lv-toiletry-pouch": {
    brand: "Louis Vuitton", style: "Toiletry Pouch",
    requireGroups: [["toiletry"]], exclude: [...JUNK, ...LV_COLLAB, "trousse"], minPrice: AG_FLOOR,
  },
  "lv-trousse-toilette": {
    brand: "Louis Vuitton", style: "Trousse Toilette",
    requireGroups: [["trousse"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "lv-pochette-coussin": {
    brand: "Louis Vuitton", style: "Pochette Coussin",
    requireGroups: [["coussin"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "lv-boite-chapeau": {
    brand: "Louis Vuitton", style: "Boîte Chapeau Souple",
    requireGroups: [["chapeau"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "lv-palm-springs": {
    brand: "Louis Vuitton", style: "Palm Springs Backpack",
    requireGroups: [["palm springs"]], exclude: [...JUNK, ...LV_COLLAB], minPrice: AG_FLOOR,
  },
  "lv-musette-salsa": {
    brand: "Louis Vuitton", style: "Musette Salsa",
    requireGroups: [["musette"]], exclude: [...JUNK, ...LV_COLLAB, "tango"], minPrice: AG_FLOOR,
  },
  "lv-musette-tango": {
    brand: "Louis Vuitton", style: "Musette Tango",
    requireGroups: [["musette"]], exclude: [...JUNK, ...LV_COLLAB, "salsa"], minPrice: AG_FLOOR,
  },
  "bv-bang-bang": {
    brand: "Bottega Veneta", style: "Bang Bang Vanity Case",
    requireGroups: [["bang bang", "vanity"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-gabrielle-backpack": {
    brand: "Chanel", style: "Gabrielle Backpack",
    requireGroups: [["gabrielle"], ["backpack"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-urban-essentials": {
    brand: "Chanel", style: "Urban Essentials",
    requireGroups: [["urban"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-coco-base": {
    brand: "Chanel", style: "Coco Base Shopping Bag",
    requireGroups: [["coco base"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-souplissimo-maxi": {
    brand: "Chanel", style: "Souplissimo Maxi Flap",
    requireGroups: [["souplissimo"], ["maxi"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-souplissimo": {
    brand: "Chanel", style: "Souplissimo",
    requireGroups: [["souplissimo"]], exclude: [...JUNK, "maxi"], minPrice: AG_FLOOR,
  },
  "chanel-cosmetic-case": {
    brand: "Chanel", style: "Cosmetic Case",
    requireGroups: [["cosmetic", "vanity"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-clutch-chain": {
    brand: "Chanel", style: "Clutch with Chain",
    requireGroups: [["clutch"], ["chain"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "chanel-top-handle-flap": {
    brand: "Chanel", style: "Top Handle Rectangular Flap",
    requireGroups: [["top handle"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "gucci-soho-chain": {
    brand: "Gucci", style: "Soho Chain Shoulder",
    requireGroups: [["soho"]], exclude: [...JUNK, "disco"], minPrice: AG_FLOOR,
  },
  "gucci-neo-vintage": {
    brand: "Gucci", style: "Neo Vintage Shoulder",
    requireGroups: [["neo vintage"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "gucci-interlocking-g": {
    brand: "Gucci", style: "Interlocking G Shoulder",
    requireGroups: [["interlocking"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "gucci-padlock": {
    brand: "Gucci", style: "Padlock Shoulder",
    requireGroups: [["padlock"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "balenciaga-hourglass-chain": {
    brand: "Balenciaga", style: "Hourglass Chain",
    requireGroups: [["hourglass"], ["chain"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "sl-loulou-puffer": {
    brand: "Saint Laurent", style: "Loulou Puffer",
    requireGroups: [["loulou", "lou lou"], ["puffer"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "sl-triquilt": {
    brand: "Saint Laurent", style: "Triquilt",
    requireGroups: [["triquilt"]], exclude: JUNK, minPrice: AG_FLOOR,
  },
  "coach-swinger": {
    brand: "Coach", style: "Swinger",
    requireGroups: [["swinger"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "mk-selma": {
    brand: "Michael Kors", style: "Selma",
    requireGroups: [["selma"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "mk-mercer": {
    brand: "Michael Kors", style: "Mercer",
    requireGroups: [["mercer"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "tb-fleming": {
    brand: "Tory Burch", style: "Fleming",
    requireGroups: [["fleming"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "tb-robinson": {
    brand: "Tory Burch", style: "Robinson",
    requireGroups: [["robinson"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
  "mk-bedford": {
    brand: "Michael Kors", style: "Bedford",
    requireGroups: [["bedford"]], exclude: JUNK, minPrice: MID_FLOOR,
  },
};

/** Brand tokens for attributing mixed-query (Apify) rows. Any one must appear. */
function brandTokens(brand: string): string[] {
  const b = brand.toLowerCase();
  const extra: Record<string, string[]> = {
    "louis vuitton": ["louis vuitton", "lv "],
    "saint laurent": ["saint laurent", "ysl"],
    "bottega veneta": ["bottega"],
    "michael kors": ["michael kors", "mk "],
  };
  return extra[b] ?? [b];
}

/**
 * Attribute one mixed-pile title to exactly ONE rule. Ambiguous or unmatched
 * rows are dropped (counted) — never guessed onto a style.
 */
function attribute(title: string): string | null {
  const t = title.toLowerCase();
  const hits: string[] = [];
  for (const [key, rule] of Object.entries(RULES)) {
    if (!brandTokens(rule.brand).some((b) => t.includes(b))) continue;
    if (rule.exclude.some((x) => t.includes(x))) continue;
    if (!rule.requireGroups.every((g) => g.some((tok) => t.includes(tok)))) continue;
    hits.push(key);
  }
  return hits.length === 1 ? hits[0] : null;
}

const MONTHS: Record<string, string> ={ Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

function parseSoldDate(d: string): string | null {
  const m = d.match(/([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})/);
  if (!m || !MONTHS[m[1]]) return null;
  return `${m[3]}-${MONTHS[m[1]]}-${m[2].padStart(2, "0")}`;
}

function main() {
  const write = process.argv.includes("--write");
  const rawDir = path.join(process.cwd(), "data/ingest/_raw/ebay-sweep");
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith(".json"));

  // batch1.json holds 5 keyed targets; per-key files hold one each; apify-*.json
  // are mixed-query auction piles attributed per-title (ambiguous rows dropped).
  const rawByKey: Record<string, RawFile> = {};
  let unattributed = 0;
  const add = (key: string, items: RawItem[]) => {
    const cur = (rawByKey[key] ??= { brand: RULES[key]?.brand ?? "", style: "", items: [] });
    const seenIds = new Set(cur.items.map((i) => i.id));
    for (const it of items) if (!seenIds.has(it.id)) { cur.items.push(it); seenIds.add(it.id); }
  };
  for (const f of files) {
    const parsed = JSON.parse(fs.readFileSync(path.join(rawDir, f), "utf8"));
    if (f === "batch1.json") {
      for (const [key, v] of Object.entries(parsed as Record<string, { brand: string; items: RawItem[] }>)) {
        add(key, v.items);
      }
    } else if (f.startsWith("apify-")) {
      for (const a of (parsed.items ?? []) as ApifyItem[]) {
        const key = attribute(a.title);
        if (!key) { unattributed++; continue; }
        add(key, [{
          t: a.title, p: a.soldPrice, s: false, d: `Sold ${a.soldDate}`,
          id: a.itemId, auction: a.listingType === "Auction",
        }]);
      }
    } else if (parsed.key) {
      add(parsed.key, parsed.items ?? []);
    }
  }
  if (unattributed) console.log(`(apify: ${unattributed} mixed-pile rows unattributed — dropped, never guessed)`);

  const obs: PriceObservation[] = [];
  const stats = { seen: 0, masked: 0, junk: 0, offToken: 0, belowFloor: 0, badDate: 0, kept: 0 };
  const perStyle: Record<string, { kept: number; masked: number; seen: number }> = {};

  for (const [key, raw] of Object.entries(rawByKey)) {
    const rule = RULES[key];
    if (!rule) { console.log(`(no rule for ${key} — skipped)`); continue; }
    const ps = (perStyle[`${rule.brand} ${rule.style}`] ??= { kept: 0, masked: 0, seen: 0 });
    for (const it of raw.items ?? []) {
      stats.seen++; ps.seen++;
      const t = it.t.toLowerCase();
      if (rule.exclude.some((x) => t.includes(x))) { stats.junk++; continue; }
      if (!rule.requireGroups.every((g) => g.some((tok) => t.includes(tok)))) { stats.offToken++; continue; }
      // Masked best-offer rows are ceilings, not prices — never loaded (probe-counted).
      if (it.s) { stats.masked++; ps.masked++; continue; }
      if (!(it.p >= rule.minPrice)) { stats.belowFloor++; continue; }
      const observed = parseSoldDate(it.d);
      if (!observed) { stats.badDate++; continue; }
      obs.push({
        brand: rule.brand,
        style: rule.style,
        attrs: {},
        platform: "eBay",
        price_type: "sold",
        sale_price: it.p,
        currency: "USD",
        condition: null,
        observed_on: observed,
        source_url: `https://www.ebay.com/itm/${it.id}`,
        confidence: it.p >= AG_FLOOR ? "high" : "medium",
        notes: it.auction
          ? "eBay sold sweep 2026-07-09; auction final (bid-settled, unmaskable)"
          : it.p >= AG_FLOOR
          ? "eBay sold sweep 2026-07-09; >=$500 = Authenticity Guarantee band; exact price (best-offer masked rows excluded)"
          : "eBay sold sweep 2026-07-09; below AG band; exact price (best-offer masked rows excluded)",
      });
      stats.kept++; ps.kept++;
    }
  }

  console.log("stats:", stats);
  console.log(`masked share of on-target solds: ${stats.masked}/${stats.masked + stats.kept + stats.belowFloor} = ${Math.round((100 * stats.masked) / Math.max(1, stats.masked + stats.kept + stats.belowFloor))}%`);
  for (const [s, v] of Object.entries(perStyle).sort((a, b) => b[1].kept - a[1].kept)) {
    console.log(`  ${s}: kept ${v.kept} / masked ${v.masked} / seen ${v.seen}`);
  }

  if (write) {
    const res = writeObservations("ebay", obs);
    console.log(`wrote ${res.kept} observations (${res.dropped} dropped) -> ${res.file}`);
  } else {
    console.log(`dry-run: ${obs.length} observations ready (--write to land)`);
  }
}

main();
