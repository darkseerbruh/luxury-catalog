/**
 * The RealReal "JSON-LD" adapter — the proven, full-fidelity TRR flow, generalised
 * into a committed reusable source (was previously a throwaway probe script). Mirrors
 * the simpler trr-paste.ts (search-text paste); this one consumes the richer
 * per-product JSON-LD so each row carries colour / leather / hardware / year /
 * inclusions, not just an asking price.
 *
 * HOW THE DATA IS CAPTURED (semi-manual, by design):
 * TheRealReal is bot-blocked to plain fetch, so capture happens in the real browser
 * via the Claude-in-Chrome extension (docs/data-sourcing-research.md §3.2):
 *   1. Open a TRR search, e.g. https://www.therealreal.com/products?keywords=<query>
 *   2. Collect the product URLs on the results page.
 *   3. same-origin fetch(url, { credentials: "include" }) each product page and
 *      parse its JSON-LD `Product` block.
 *   4. Save an array of { url, name, sku, price, currency, condition, desc } records
 *      to data/ingest/_raw/<targetKey>.json.
 * `desc` is the JSON-LD product description: spec facts separated by "\n"
 * (sometimes whitespace-collapsed to ". " if a capture flattened the newlines —
 * we recover the segment boundaries below before parsing).
 *
 *   npx tsx supabase/ingest/sources/trr-jsonld.ts <targetKey> [--date=YYYY-MM-DD]
 *
 * Writes `listed` resale observations to the landing zone via writeObservations.
 * Each row keeps its per-item URL for attribution and a listing_ref (URL slug) so
 * the 0024 dedup index keeps genuinely-distinct listings distinct.
 */
import fs from "fs";
import path from "path";
import { writeObservations } from "../lib/landing";
import { parseTrrDescription } from "../../../src/lib/ingest/trr";
import type { PriceObservation } from "../../../src/lib/ingest/types";

/** One captured TRR product (JSON-LD Product block, saved by the browser flow). */
export interface TrrRecord {
  url: string;
  name: string;
  sku?: string | null;
  price: number;
  currency?: string | null;
  condition?: string | null;
  desc?: string | null;
}

export interface TrrJsonLdTarget {
  brand: string;
  style: string;
  size_label: string;
  /** True if a listing's `name` is the right style+size for this target. */
  namePredicate: (name: string) => boolean;
  minPrice: number;
  maxPrice: number;
}

/** Build a name predicate: all `must` tokens present, none of the `not` tokens. */
function predicate(must: string[], not: string[] = []): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    return must.every((t) => n.includes(t)) && !not.some((t) => n.includes(t));
  };
}

/**
 * Targets. The Chanel Classic Flap Medium entry is PROVEN (loaded from a real
 * 120-record capture). The rest are SCAFFOLDS — best-effort brand/style/size_label/
 * predicate/bounds to be tuned once each is captured. Brand/style names match the
 * catalog (so the loader's brand→style→variant matcher resolves them).
 */
const TARGETS: Record<string, TrrJsonLdTarget> = {
  // ── PROVEN ────────────────────────────────────────────────────────────────
  "chanel-classic-flap-medium": {
    brand: "Chanel",
    style: "Classic Flap",
    size_label: "Medium",
    // TRR names this many ways ("Medium Classic Double Flap Bag", "Classic Medium
    // Double Flap Bag", "Lambskin Classic Double Flap Bag Medium"…) — require
    // flap+medium, exclude the other sizes.
    namePredicate: predicate(["flap", "medium"], ["jumbo", "maxi", "mini", "small"]),
    minPrice: 1500,
    maxPrice: 20000,
  },

  // ── SCAFFOLD (tune predicate/bounds when captured) ──────────────────────────
  "hermes-birkin-25": {
    brand: "Hermès", style: "Birkin", size_label: "25",
    namePredicate: predicate(["birkin", "25"], ["30", "35", "40"]),
    minPrice: 8000, maxPrice: 80000,
  },
  "hermes-birkin-30": {
    brand: "Hermès", style: "Birkin", size_label: "30",
    namePredicate: predicate(["birkin", "30"], ["25", "35", "40"]),
    minPrice: 8000, maxPrice: 80000,
  },
  "hermes-birkin-35": {
    brand: "Hermès", style: "Birkin", size_label: "35",
    namePredicate: predicate(["birkin", "35"], ["25", "30", "40"]),
    minPrice: 8000, maxPrice: 80000,
  },
  "hermes-birkin-40": {
    brand: "Hermès", style: "Birkin", size_label: "40",
    namePredicate: predicate(["birkin", "40"], ["25", "30", "35"]),
    minPrice: 8000, maxPrice: 80000,
  },
  "hermes-kelly-25": {
    brand: "Hermès", style: "Kelly", size_label: "25",
    namePredicate: predicate(["kelly", "25"], ["28", "32"]),
    minPrice: 7000, maxPrice: 70000,
  },
  "hermes-kelly-28": {
    brand: "Hermès", style: "Kelly", size_label: "28",
    namePredicate: predicate(["kelly", "28"], ["25", "32"]),
    minPrice: 7000, maxPrice: 70000,
  },
  "hermes-kelly-32": {
    brand: "Hermès", style: "Kelly", size_label: "32",
    namePredicate: predicate(["kelly", "32"], ["25", "28"]),
    minPrice: 7000, maxPrice: 70000,
  },
  "lv-neverfull-pm": {
    brand: "Louis Vuitton", style: "Neverfull", size_label: "PM",
    namePredicate: predicate(["neverfull", "pm"], ["mm", "gm"]),
    minPrice: 600, maxPrice: 5000,
  },
  "lv-neverfull-mm": {
    brand: "Louis Vuitton", style: "Neverfull", size_label: "MM",
    namePredicate: predicate(["neverfull", "mm"], ["pm", "gm"]),
    minPrice: 600, maxPrice: 5000,
  },
  "gucci-gg-marmont-small": {
    brand: "Gucci", style: "GG Marmont", size_label: "Small",
    namePredicate: predicate(["marmont", "small"], ["medium", "mini", "large"]),
    minPrice: 600, maxPrice: 4000,
  },
  "gucci-gg-marmont-medium": {
    brand: "Gucci", style: "GG Marmont", size_label: "Medium",
    namePredicate: predicate(["marmont", "medium"], ["small", "mini", "large"]),
    minPrice: 600, maxPrice: 4000,
  },
};

/** Last path segment of a TRR product URL — the stable per-listing slug. */
export function listingRefFromUrl(url: string): string {
  return url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? url;
}

/**
 * Recover fact-segment boundaries before parsing: a capture that flattened the
 * JSON-LD newlines leaves ". " between facts, but parseTrrDescription splits on
 * "\n"/" | ". Turning ". " back into ".\n" restores the per-fact segments so
 * colour/material/hardware land in their own segment. Already-newline'd descs are
 * unaffected (no ". " run to rewrite).
 */
export function normalizeDesc(desc: string): string {
  return desc.replace(/\.\s+/g, ".\n");
}

/** Map one captured record to a PriceObservation (or null if it fails the target). */
export function recordToObservation(
  rec: TrrRecord,
  target: TrrJsonLdTarget,
  observedOn: string
): PriceObservation | null {
  if (!target.namePredicate(rec.name)) return null;
  if (typeof rec.price !== "number" || rec.price < target.minPrice || rec.price > target.maxPrice) return null;

  const spec = parseTrrDescription(normalizeDesc(rec.desc ?? ""));
  return {
    brand: target.brand,
    style: target.style,
    attrs: {
      size_label: target.size_label,
      exterior_colorway: spec.color,
      exterior_material: spec.material,
      hardware_color: spec.hardwareColor,
      production_year: spec.productionYear,
      season: spec.season,
      inclusions: spec.includes,
      listing_ref: listingRefFromUrl(rec.url),
    },
    platform: "The RealReal",
    price_type: "listed",
    sale_price: rec.price,
    currency: rec.currency ?? "USD",
    // TRR JSON-LD only exposes a generic "UsedCondition" — never fake a graded
    // SaleCondition tier; leave it null (the enrichment pass fills real condition).
    condition: null,
    observed_on: observedOn,
    source_url: rec.url,
    confidence: "high",
    notes: rec.name,
  };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function rawFile(targetKey: string): string {
  return path.resolve(__dirname, "../../../data/ingest/_raw", `${targetKey}.json`);
}

function main() {
  const args = process.argv.slice(2);
  const targetKey = args.find((a) => !a.startsWith("--"));
  const dateFlag = args.find((a) => a.startsWith("--date="));
  if (!targetKey || !TARGETS[targetKey]) {
    console.error(`Usage: tsx trr-jsonld.ts <targetKey> [--date=YYYY-MM-DD]`);
    console.error(`  targetKey: ${Object.keys(TARGETS).join(" | ")}`);
    process.exit(1);
  }
  const target = TARGETS[targetKey];
  const observedOn = dateFlag ? dateFlag.slice("--date=".length) : new Date().toISOString().slice(0, 10);

  const file = rawFile(targetKey);
  if (!fs.existsSync(file)) {
    console.error(`No capture at ${file}. Capture it in the browser first (see file header).`);
    process.exit(1);
  }
  const records: TrrRecord[] = JSON.parse(fs.readFileSync(file, "utf8"));

  const obs: PriceObservation[] = [];
  let skipped = 0;
  for (const rec of records) {
    const o = recordToObservation(rec, target, observedOn);
    if (o) obs.push(o);
    else skipped++;
  }

  const { file: out, kept, dropped } = writeObservations("therealreal", obs);

  // Spec coverage + price spread, so the operator can sanity-check a capture.
  const cov = (pick: (o: PriceObservation) => unknown) =>
    obs.length ? Math.round((obs.filter((o) => pick(o) != null).length / obs.length) * 100) : 0;
  const prices = obs.map((o) => o.sale_price).sort((a, b) => a - b);
  console.log(`trr-jsonld [${targetKey}]: ${records.length} captured -> ${kept} kept, ${skipped} skipped${dropped ? `, ${dropped} dropped (invalid)` : ""} -> ${out}`);
  if (obs.length) {
    console.log(
      `  spec coverage: colour ${cov((o) => o.attrs.exterior_colorway)}% · material ${cov((o) => o.attrs.exterior_material)}% · hardware ${cov((o) => o.attrs.hardware_color)}% · year ${cov((o) => o.attrs.production_year)}%`
    );
    console.log(`  price spread: min $${prices[0]} · median $${median(prices)} · max $${prices[prices.length - 1]}`);
  }
}

// Run only as a CLI (keep importable for tests).
if (require.main === module) main();
