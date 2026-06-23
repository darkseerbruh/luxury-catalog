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
  /**
   * Optional: read the capture from data/ingest/_raw/<rawKey>.json instead of
   * <targetKey>.json. Lets several size-targets share ONE capture (e.g. all the
   * Speedy sizes come from a single "lv-speedy" search) — each target's predicate
   * selects its own size out of the shared file.
   */
  rawKey?: string;
}

/** Build a name predicate: all `must` tokens present, none of the `not` tokens. */
function predicate(must: string[], not: string[] = []): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    return must.every((t) => n.includes(t)) && !not.some((t) => n.includes(t));
  };
}

// ── Speedy size predicates ──────────────────────────────────────────────────
// The Speedy comes in numeric sizes (20/25/30/35/40/50) plus Nano/HL/Mini, and
// the Bandoulière strap version of each size. We bucket by size with WHOLE-WORD
// matching (\b) so a year in the name ("Speedy 30 2025") never collides with a
// size token ("2025" does not contain a standalone "25"/"20"). Bandoulière folds
// into its numeric size — the per-listing strap detail is kept in the row's desc.
const SPEEDY_SIZES = ["20", "25", "30", "35", "40", "50"];
function speedySize(size: string): (name: string) => boolean {
  const others = SPEEDY_SIZES.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
  const want = new RegExp(`\\b${size}\\b`);
  return (name: string) => {
    const n = name.toLowerCase();
    if (!/speedy/.test(n) || /charm/.test(n)) return false; // exclude bag charms
    return want.test(n) && !others.some((re) => re.test(n));
  };
}
/** Non-numeric Speedy formats (Nano, HL): require "speedy" + the format word. */
function speedyWord(word: string): (name: string) => boolean {
  const want = new RegExp(`\\b${word}\\b`);
  return (name: string) => {
    const n = name.toLowerCase();
    return /speedy/.test(n) && want.test(n) && !/charm/.test(n);
  };
}

/**
 * Generic LV size predicate: a listing is this size of this model when its name
 * contains the model, the size as a WHOLE word (\b, so letter codes like "mm" never
 * match inside "monogram"), and none of the SIBLING sizes — and isn't a bag charm.
 * Reusable across models with letter-code OR word sizes (Alma BB/PM/MM/GM, Book Tote
 * Small/Medium/Large, …). Note TRR sometimes truncates the model name (Book Tote →
 * "Book"), so pass the shortest reliable token as `model`.
 */
function modelSize(model: string, size: string, siblings: string[]): (name: string) => boolean {
  const want = new RegExp(`\\b${size}\\b`, "i");
  const others = siblings.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`, "i"));
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes(model) || /charm/.test(n)) return false;
    return want.test(n) && !others.some((re) => re.test(n));
  };
}
const ALMA_SIZES = ["bb", "pm", "mm", "gm", "mini", "nano"];
const BOOK_TOTE_SIZES = ["mini", "small", "medium", "large"];

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

  // ── LV Speedy (backbone Tier-1) — all sizes share the one "lv-speedy" capture ─
  // Resolves to the clean canonical "Speedy" style (backbone); size_label routes
  // each listing to the matching variant. Wide price band keeps real outliers
  // (vintage canvas ~$440 → exotic/collab Bandoulière ~$15k) — the value module
  // grades within condition, so genuine listings should not be pre-filtered out.
  "lv-speedy-20": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "20",
    namePredicate: speedySize("20"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },
  "lv-speedy-25": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "25",
    namePredicate: speedySize("25"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },
  "lv-speedy-30": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "30",
    namePredicate: speedySize("30"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },
  "lv-speedy-35": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "35",
    namePredicate: speedySize("35"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },
  "lv-speedy-40": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "40",
    namePredicate: speedySize("40"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },
  "lv-speedy-nano": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "Nano",
    namePredicate: speedyWord("nano"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },
  "lv-speedy-hl": {
    brand: "Louis Vuitton", style: "Speedy", size_label: "HL",
    namePredicate: speedyWord("hl"), minPrice: 300, maxPrice: 16000, rawKey: "lv-speedy",
  },

  // ── LV Alma (backbone Tier-1) — sizes BB/PM/MM/GM + Mini/Nano, one capture ────
  "lv-alma-bb": {
    brand: "Louis Vuitton", style: "Alma", size_label: "BB",
    namePredicate: modelSize("alma", "bb", ALMA_SIZES), minPrice: 250, maxPrice: 12000, rawKey: "lv-alma",
  },
  "lv-alma-pm": {
    brand: "Louis Vuitton", style: "Alma", size_label: "PM",
    namePredicate: modelSize("alma", "pm", ALMA_SIZES), minPrice: 250, maxPrice: 12000, rawKey: "lv-alma",
  },
  "lv-alma-mm": {
    brand: "Louis Vuitton", style: "Alma", size_label: "MM",
    namePredicate: modelSize("alma", "mm", ALMA_SIZES), minPrice: 250, maxPrice: 12000, rawKey: "lv-alma",
  },
  "lv-alma-gm": {
    brand: "Louis Vuitton", style: "Alma", size_label: "GM",
    namePredicate: modelSize("alma", "gm", ALMA_SIZES), minPrice: 250, maxPrice: 12000, rawKey: "lv-alma",
  },
  "lv-alma-mini": {
    brand: "Louis Vuitton", style: "Alma", size_label: "Mini",
    namePredicate: modelSize("alma", "mini", ALMA_SIZES), minPrice: 250, maxPrice: 12000, rawKey: "lv-alma",
  },
  "lv-alma-nano": {
    brand: "Louis Vuitton", style: "Alma", size_label: "Nano",
    namePredicate: modelSize("alma", "nano", ALMA_SIZES), minPrice: 250, maxPrice: 12000, rawKey: "lv-alma",
  },

  // ── Dior Book Tote (backbone Tier-1) — cross-brand; TRR truncates name to "Book" ─
  "dior-book-tote-mini": {
    brand: "Dior", style: "Book Tote", size_label: "Mini",
    namePredicate: modelSize("book", "mini", BOOK_TOTE_SIZES), minPrice: 800, maxPrice: 8000, rawKey: "dior-book-tote",
  },
  "dior-book-tote-small": {
    brand: "Dior", style: "Book Tote", size_label: "Small",
    namePredicate: modelSize("book", "small", BOOK_TOTE_SIZES), minPrice: 800, maxPrice: 8000, rawKey: "dior-book-tote",
  },
  "dior-book-tote-medium": {
    brand: "Dior", style: "Book Tote", size_label: "Medium",
    namePredicate: modelSize("book", "medium", BOOK_TOTE_SIZES), minPrice: 800, maxPrice: 8000, rawKey: "dior-book-tote",
  },
  "dior-book-tote-large": {
    brand: "Dior", style: "Book Tote", size_label: "Large",
    namePredicate: modelSize("book", "large", BOOK_TOTE_SIZES), minPrice: 800, maxPrice: 8000, rawKey: "dior-book-tote",
  },
};

/** Last path segment of a TRR product URL — the stable per-listing slug. */
export function listingRefFromUrl(url: string): string {
  return url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? url;
}

// ── Catch-all size detection ─────────────────────────────────────────────────
// Best-effort size token parser for the catch-all mode. Unlike the curated
// per-size predicates (which DROP non-matching listings), this NEVER drops — it
// just labels what it can and returns null when no size is recognisable, letting
// the loader route the listing (curated variant if the size lands, else
// discovered_listing). Order matters: word-sizes before bare numerics so
// "Mini" / "Nano" win over a stray number, and we use whole-word (\b) matching so
// a year ("2025") never reads as a "25" size and a letter code ("mm") never
// matches inside "monogram".
//
// Word sizes are matched case-insensitively and emitted in their canonical
// catalog casing (Mini, BB, …). Numeric sizes (20/25/30/35/40/45/50/55) cover the
// LV Speedy / Hermès Birkin·Kelly families. Letter codes (BB/PM/MM/GM/MM) cover
// LV Alma/Neverfull/Speedy etc.
const CATCH_ALL_WORD_SIZES: Array<{ token: string; label: string }> = [
  { token: "nano", label: "Nano" },
  { token: "micro", label: "Micro" },
  { token: "mini", label: "Mini" },
  { token: "small", label: "Small" },
  { token: "medium", label: "Medium" },
  { token: "large", label: "Large" },
  { token: "jumbo", label: "Jumbo" },
  { token: "maxi", label: "Maxi" },
];
const CATCH_ALL_LETTER_SIZES = ["BB", "PM", "MM", "GM", "HL"];
const CATCH_ALL_NUMERIC_SIZES = ["20", "25", "28", "30", "32", "35", "40", "45", "50", "55"];

/**
 * Best-effort: pull a single size token out of a listing name, or null if none.
 * Letter codes and word sizes are preferred over bare numerics (a name like
 * "Alma BB 25cm" is a BB, not a "25"); among numerics the FIRST whole-word match
 * wins. Returns the canonical catalog label (Mini, BB, "30", …).
 */
export function detectSizeLabel(name: string): string | null {
  const n = name.toLowerCase();
  for (const { token, label } of CATCH_ALL_WORD_SIZES) {
    if (new RegExp(`\\b${token}\\b`, "i").test(n)) return label;
  }
  for (const code of CATCH_ALL_LETTER_SIZES) {
    if (new RegExp(`\\b${code}\\b`, "i").test(n)) return code;
  }
  for (const size of CATCH_ALL_NUMERIC_SIZES) {
    if (new RegExp(`\\b${size}\\b`).test(n)) return size;
  }
  return null;
}

/**
 * Best-guess style for catch-all mode: prefer the operator-supplied guess; if
 * none, fall back to the raw listing name (stripped of a trailing "Bag"), so the
 * loader's style matcher still has something to score against. Never empty.
 */
export function catchAllStyle(name: string, styleGuess?: string | null): string {
  const guess = styleGuess?.trim();
  if (guess) return guess;
  const fallback = name.replace(/\bbag\b/i, "").replace(/\s+/g, " ").trim();
  return fallback || name.trim();
}

/**
 * Catch-all mapping: emit EVERY captured record as a best-guess PriceObservation
 * (no curated size predicate, no narrow price band). The loader places what it can
 * on curated variants and routes the rest into discovered_listing — nothing is
 * dropped at the adapter stage. `brand` and `styleGuess` come from the CLI; the
 * size is parsed from the name (null when unrecognisable). A non-positive/absent
 * price is the ONLY drop (it can't be a valid observation) — returns null then.
 */
export function recordToCatchAllObservation(
  rec: TrrRecord,
  brand: string,
  styleGuess: string | null | undefined,
  observedOn: string
): PriceObservation | null {
  if (typeof rec.price !== "number" || !Number.isFinite(rec.price) || rec.price <= 0) return null;

  const spec = parseTrrDescription(normalizeDesc(rec.desc ?? ""));
  return {
    brand,
    style: catchAllStyle(rec.name, styleGuess),
    attrs: {
      size_label: detectSizeLabel(rec.name),
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
    condition: null,
    observed_on: observedOn,
    source_url: rec.url,
    confidence: "low", // best-guess identity — lower confidence than a curated target
    notes: rec.name,
  };
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

/** Per-target coverage/spread line so the operator can sanity-check a capture. */
function report(targetKey: string, capturedFrom: number, obs: PriceObservation[], skipped: number) {
  const cov = (pick: (o: PriceObservation) => unknown) =>
    obs.length ? Math.round((obs.filter((o) => pick(o) != null).length / obs.length) * 100) : 0;
  const prices = obs.map((o) => o.sale_price).sort((a, b) => a - b);
  console.log(`  [${targetKey}]: ${capturedFrom} captured -> ${obs.length} kept, ${skipped} skipped`);
  if (obs.length) {
    console.log(
      `    spec coverage: colour ${cov((o) => o.attrs.exterior_colorway)}% · material ${cov((o) => o.attrs.exterior_material)}% · hardware ${cov((o) => o.attrs.hardware_color)}% · year ${cov((o) => o.attrs.production_year)}%`
    );
    console.log(`    price spread: min $${prices[0]} · median $${median(prices)} · max $${prices[prices.length - 1]}`);
  }
}

/** Read a raw capture file (array of TrrRecord) or exit with a clear message. */
function readRawCapture(rawKey: string): TrrRecord[] {
  const file = rawFile(rawKey);
  if (!fs.existsSync(file)) {
    console.error(`No capture at ${file}. Capture it in the browser first (see file header).`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Pull an option value out of argv. Supports BOTH `--flag value` (space) and
 * `--flag=value` (equals) forms, so `--brand "Louis Vuitton"` and
 * `--brand=Louis\ Vuitton` both work.
 */
function optValue(args: string[], flag: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const i = args.indexOf(flag);
  if (i >= 0 && i + 1 < args.length && !args[i + 1].startsWith("--")) return args[i + 1];
  return undefined;
}

/**
 * Catch-all run: emit one PriceObservation per record from <rawKey>.json with a
 * best-guess brand/style/size, no curated predicate and no narrow price band, so
 * the loader routes everything (curated variant or discovered_listing). Mode:
 *   tsx trr-jsonld.ts --catch-all --brand "<Brand>" [--style-guess "<style>"] <rawKey>
 */
function runCatchAll(args: string[], observedOn: string) {
  const brand = optValue(args, "--brand");
  const styleGuess = optValue(args, "--style-guess") ?? null;
  // Positional rawKeys = non-flag tokens that aren't the VALUE of a space-form
  // option (`--brand "Louis Vuitton"` → "Louis Vuitton" is consumed, not a key).
  const spaceFormFlags = new Set(["--brand", "--style-guess", "--date"]);
  const rawKeys = args.filter(
    (a, idx) => !a.startsWith("--") && !(idx > 0 && spaceFormFlags.has(args[idx - 1]))
  );
  if (!brand || rawKeys.length === 0) {
    console.error(`Usage: tsx trr-jsonld.ts --catch-all --brand "<Brand>" [--style-guess "<style>"] <rawKey> [<rawKey> ...]`);
    console.error(`  Emits EVERY captured record (best-guess style/size) — nothing dropped at the adapter.`);
    process.exit(1);
  }
  console.log(`trr-jsonld: CATCH-ALL — brand="${brand}"${styleGuess ? ` style-guess="${styleGuess}"` : ""}, ${rawKeys.length} capture(s)`);

  const allObs: PriceObservation[] = [];
  for (const rawKey of rawKeys) {
    const records = readRawCapture(rawKey);
    let skipped = 0;
    const obs: PriceObservation[] = [];
    for (const rec of records) {
      const o = recordToCatchAllObservation(rec, brand, styleGuess, observedOn);
      if (o) obs.push(o);
      else skipped++;
    }
    const withSize = obs.filter((o) => o.attrs.size_label != null).length;
    console.log(`  [${rawKey}]: ${records.length} captured -> ${obs.length} emitted (${withSize} with a size), ${skipped} skipped (no/invalid price)`);
    allObs.push(...obs);
  }

  const { file: out, kept, dropped } = writeObservations("therealreal", allObs);
  console.log(`-> ${kept} observation(s) written${dropped ? `, ${dropped} dropped (invalid)` : ""} -> ${out}`);
}

function main() {
  const args = process.argv.slice(2);
  const dateFlag = args.find((a) => a.startsWith("--date="));
  const observedOnDefault = dateFlag ? dateFlag.slice("--date=".length) : new Date().toISOString().slice(0, 10);

  if (args.includes("--catch-all")) {
    runCatchAll(args, observedOnDefault);
    return;
  }

  const targetKeys = args.filter((a) => !a.startsWith("--"));
  const unknown = targetKeys.filter((k) => !TARGETS[k]);
  if (targetKeys.length === 0 || unknown.length) {
    if (unknown.length) console.error(`Unknown target(s): ${unknown.join(", ")}`);
    console.error(`Usage: tsx trr-jsonld.ts <targetKey> [<targetKey> ...] [--date=YYYY-MM-DD]`);
    console.error(`  Pass several keys to combine shared-capture sizes (e.g. all lv-speedy-*)`);
    console.error(`  into ONE landing batch — each adapter run clears the source's landing dir.`);
    console.error(`  targetKey: ${Object.keys(TARGETS).join(" | ")}`);
    process.exit(1);
  }
  const observedOn = observedOnDefault;

  // Accumulate across ALL requested targets, then write the landing batch ONCE —
  // writeObservations() clears the source dir per call, so multiple targets that
  // share a source (the Speedy sizes) must be produced together.
  const rawCache = new Map<string, TrrRecord[]>();
  const allObs: PriceObservation[] = [];
  console.log(`trr-jsonld: ${targetKeys.length} target(s)`);
  for (const targetKey of targetKeys) {
    const target = TARGETS[targetKey];
    const rawKey = target.rawKey ?? targetKey;
    if (!rawCache.has(rawKey)) {
      rawCache.set(rawKey, readRawCapture(rawKey));
    }
    const records = rawCache.get(rawKey)!;
    const obs: PriceObservation[] = [];
    let skipped = 0;
    for (const rec of records) {
      const o = recordToObservation(rec, target, observedOn);
      if (o) obs.push(o);
      else skipped++;
    }
    report(targetKey, records.length, obs, skipped);
    allObs.push(...obs);
  }

  const { file: out, kept, dropped } = writeObservations("therealreal", allObs);
  console.log(`-> ${kept} observation(s) written${dropped ? `, ${dropped} dropped (invalid)` : ""} -> ${out}`);
}

// Run only as a CLI (keep importable for tests).
if (require.main === module) main();
