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
function modelSize(
  model: string,
  size: string,
  siblings: string[],
  notTokens: string[] = []
): (name: string) => boolean {
  const want = new RegExp(`\\b${size}\\b`, "i");
  const others = siblings.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`, "i"));
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes(model) || /charm/.test(n)) return false;
    if (notTokens.some((t) => n.includes(t))) return false; // e.g. exclude Luggage PHANTOM sub-model
    return want.test(n) && !others.some((re) => re.test(n));
  };
}
const ALMA_SIZES = ["bb", "pm", "mm", "gm", "mini", "nano"];
const BOOK_TOTE_SIZES = ["mini", "small", "medium", "large"];
// Chanel Boy: TRR names it Mini / Small / Medium / Large (no Old/New Medium split
// in the feed — it just says "Medium").
const BOY_SIZES = ["mini", "small", "medium", "large"];
// Gucci Jackie 1961: Mini / Small / Medium / Large.
const JACKIE_SIZES = ["mini", "small", "medium", "large"];
// Celine Luggage (Tote): Nano / Micro / Mini / Medium.
const LUGGAGE_SIZES = ["nano", "micro", "mini", "medium"];
// Saint Laurent Loulou: Toy / Small / Medium / Large.
const LOULOU_SIZES = ["toy", "small", "medium", "large"];
// Chanel Vanity Case (#430): Mini / Small / Medium / Large. TRR names many vanities
// without a size (~half) — those drop; non-Vanity Chanel cosmetic/box bags lack the
// "vanity" token so they're excluded by modelSize's model requirement.
const VANITY_SIZES = ["mini", "small", "medium", "large"];
// Chanel Deauville (#429): Mini / Small / Medium / Large.
const DEAUVILLE_SIZES = ["mini", "small", "medium", "large"];
// Gucci Blondie (#453): Mini / Small / Medium / Large.
const BLONDIE_SIZES = ["mini", "small", "medium", "large"];

// ── Gucci curated predicates (Super-Mini-aware; footwear/SLG guarded) ─────────
// A brand-wide Gucci catch-all would mislabel Super Mini Dionysus → Mini (the
// detectSizeLabel word-list hits "mini" first) and pollute the clean FP split, so
// Gucci gets CURATED per-size TRR predicates instead. A broad Gucci search also
// pulls in Gucci footwear/SLGs that carry a model name (Dionysus loafers, Horsebit
// loafers), so both predicates exclude footwear + small leather goods.
const GUCCI_FOOTWEAR_SLG = /loafer|sandal|boot|pump|mule|slide|sneaker|espadrille|wallet|card holder|cardholder|key case|key pouch/;

/**
 * Gucci Dionysus size predicate. "Super Mini" CONTAINS "mini", so the plain Mini
 * bucket rejects any "super mini" name, and the Super Mini bucket requires the
 * "super mini" phrase (TRR may hyphenate or space it). Small/Medium use whole-word
 * sibling exclusion. Footwear/SLGs are dropped up front.
 */
const DIONYSUS_SIZES = ["mini", "small", "medium"];
export function dionysusSize(size: "super mini" | "mini" | "small" | "medium"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("dionysus") || GUCCI_FOOTWEAR_SLG.test(n)) return false;
    if (size === "super mini") return /super[\s-]*mini/.test(n);
    if (size === "mini" && /super[\s-]*mini/.test(n)) return false; // plain Mini ≠ Super Mini
    const want = new RegExp(`\\b${size}\\b`);
    const others = DIONYSUS_SIZES.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

/**
 * Gucci Horsebit 1955 size predicate — Mini / Small / Shoulder (the standard,
 * unsized "Horsebit 1955 Shoulder Bag"). Requires both "horsebit" and "1955" so the
 * Horsebit CHAIN model and the Horsebit loafers/sandals never leak in. A null size
 * is the Shoulder bucket: horsebit-1955 with NO mini/small token.
 */
const HORSEBIT_SIZES = ["mini", "small"];
export function horsebitSize(size: "mini" | "small" | null): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("horsebit") || !n.includes("1955") || GUCCI_FOOTWEAR_SLG.test(n)) return false;
    if (size) {
      const want = new RegExp(`\\b${size}\\b`);
      const others = HORSEBIT_SIZES.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
      return want.test(n) && !others.some((re) => re.test(n));
    }
    return !HORSEBIT_SIZES.some((s) => new RegExp(`\\b${s}\\b`).test(n)); // Shoulder = no size token
  };
}

/**
 * Gucci Ophidia size predicate — Super Mini / Mini / Small / Medium / Large / Jumbo
 * (backbone #448). Like Dionysus, "Super Mini" CONTAINS "mini", so plain Mini rejects
 * any "super mini" name and Super Mini requires the phrase. TRR titles the size at the
 * end ("Web Ophidia Large", "GG Supreme Ophidia Medium"); ~40% of Ophidia listings are
 * UNSIZED ("GG Supreme Ophidia") — those match no size bucket and DROP (the clean
 * per-size pattern; the high-confidence FP load already covers the icon, this TRR pass
 * adds year + a 2nd source per size). Footwear/SLGs and the Ophidia backpack/belt bag
 * (different silhouettes, not backbone size variants) are guarded out.
 */
const OPHIDIA_SIZES = ["mini", "small", "medium", "large", "jumbo"];
const GUCCI_OPHIDIA_NOT = /loafer|sandal|boot|pump|mule|slide|sneaker|wallet|card case|cardholder|card holder|key case|key pouch|belt bag|backpack/;
export function ophidiaSize(size: "super mini" | "mini" | "small" | "medium" | "large" | "jumbo"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("ophidia") || GUCCI_OPHIDIA_NOT.test(n)) return false;
    if (size === "super mini") return /super[\s-]*mini/.test(n);
    if (size === "mini" && /super[\s-]*mini/.test(n)) return false; // plain Mini ≠ Super Mini
    const want = new RegExp(`\\b${size}\\b`);
    const others = OPHIDIA_SIZES.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

/**
 * Gucci Diana size predicate (#451). Backbone sizes Mini / Small / Medium / Maxi.
 * TRR labels the largest tote "Large" (not "Maxi"), so the Maxi bucket matches
 * "maxi" OR "large" — same physical bag, different marketplace label. The Diana
 * "jumbo" token is the GG-monogram SCALE, not a size, so it's never a bucket.
 * Footwear/SLGs guarded; whole-word sibling exclusion.
 */
const DIANA_SIZES = ["mini", "small", "medium", "maxi", "large"];
export function dianaSize(label: "Mini" | "Small" | "Medium" | "Maxi"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("diana") || GUCCI_FOOTWEAR_SLG.test(n)) return false;
    const wants = label === "Maxi" ? ["maxi", "large"] : [label.toLowerCase()];
    const others = DIANA_SIZES.filter((s) => !wants.includes(s)).map((s) => new RegExp(`\\b${s}\\b`));
    if (others.some((re) => re.test(n))) return false;
    return wants.some((w) => new RegExp(`\\b${w}\\b`).test(n));
  };
}

// ── LV Twist (#439) ───────────────────────────────────────────────────────────
// Backbone PM / MM. A broad Twist search pulls in LV "Twist" JEWELRY (bracelet/ring/
// the Idylle Blossom Twist) — guarded out. Letter size whole-word.
const TWIST_NOT = /bracelet|ring|necklace|earring|brooch|pendant|wallet|card/;
export function twistSize(label: "PM" | "MM"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("twist") || TWIST_NOT.test(n) || /charm/.test(n)) return false;
    const want = new RegExp(`\\b${label.toLowerCase()}\\b`);
    const other = label === "PM" ? /\bmm\b/ : /\bpm\b/;
    return want.test(n) && !other.test(n);
  };
}

// ── Gucci Soho Disco (#450) ───────────────────────────────────────────────────
// Backbone Mini / Small. REQUIRE "disco" — a "soho" search returns the broader Soho
// line (Chain tote, Boston in medium/large) which are NOT the Disco. The Disco is a
// single small crossbody, so an unsized "Soho Disco" IS the Small; only a "mini" token
// routes to Mini.
export function sohoDiscoSize(label: "Mini" | "Small"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("disco") || /charm/.test(n)) return false;
    if (label === "Mini") return /\bmini\b/.test(n);
    return !/\bmini\b/.test(n); // Small = any non-mini Disco (labeled "Small" or unsized)
  };
}

// ── Hermès Bolide (#415) ──────────────────────────────────────────────────────
// Mini + numeric 25 / 27 / 31 / 35. Mini checked first; numerics whole-word (the
// "1923" line name can't false-match). Non-Bolide Hermès in a broad search drop.
const BOLIDE_NUMS = ["25", "27", "31", "35"];
export function bolideSize(label: "Mini" | "25" | "27" | "31" | "35"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("bolide") || /charm/.test(n)) return false;
    if (label === "Mini") return /\bmini\b/.test(n);
    if (/\bmini\b/.test(n)) return false;
    const want = new RegExp(`\\b${label}\\b`);
    const others = BOLIDE_NUMS.filter((s) => s !== label).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── LV Coussin (#442) ─────────────────────────────────────────────────────────
// Letter sizes BB / MM / PM. Whole-word (\b) so a letter can't hide in another word;
// require "coussin" to exclude other LV bags in a broad search.
const COUSSIN_SIZES = ["bb", "mm", "pm"];
export function coussinSize(label: "BB" | "MM" | "PM"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("coussin") || /charm/.test(n)) return false;
    const want = new RegExp(`\\b${label.toLowerCase()}\\b`);
    const others = COUSSIN_SIZES.filter((s) => s !== label.toLowerCase()).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── LV Bumbag (#445) ──────────────────────────────────────────────────────────
// Two backbone variants: Mini / Standard. TRR titles it "Bumbag" or "Bum Bag" (both
// matched); other LV belt/utility bags lack "bumbag" so requiring it excludes them.
export function bumbagSize(label: "Mini" | "Standard"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!/bum.?bag/.test(n) || /charm/.test(n)) return false;
    const isMini = /\bmini\b/.test(n);
    return label === "Mini" ? isMini : !isMini;
  };
}

// ── Hermès Herbag (#417) ──────────────────────────────────────────────────────
// Backbone PM / MM. TRR sizes it mostly by NUMERIC cm (31=PM, 39=MM, "Herbag Zip 31")
// with a few literal PM/MM. Map both; the opposite size's tokens exclude. The Garden
// Party and other models in a broad search lack "herbag" so they drop.
export function herbagSize(label: "PM" | "MM"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("herbag") || /charm/.test(n)) return false;
    const wantNum = label === "PM" ? "31" : "39";
    const otherNum = label === "PM" ? "39" : "31";
    const wantLetter = label.toLowerCase();
    const otherLetter = label === "PM" ? "mm" : "pm";
    if (new RegExp(`\\b${otherNum}\\b`).test(n) || new RegExp(`\\b${otherLetter}\\b`).test(n)) return false;
    return new RegExp(`\\b${wantNum}\\b`).test(n) || new RegExp(`\\b${wantLetter}\\b`).test(n);
  };
}

// ── Hermès Lindy (#416) ───────────────────────────────────────────────────────
// Mini + numeric 26 / 30 / 34. Mini is checked first (a "Mini Lindy 26" is the Mini
// variant, not the 26); numerics whole-word. Other Hermès models in a broad Lindy
// search lack "lindy" so they drop.
const LINDY_NUMS = ["26", "30", "34"];
export function lindySize(label: "Mini" | "26" | "30" | "34"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("lindy") || /charm/.test(n)) return false;
    if (label === "Mini") return /\bmini\b/.test(n);
    if (/\bmini\b/.test(n)) return false;
    const want = new RegExp(`\\b${label}\\b`);
    const others = LINDY_NUMS.filter((s) => s !== label).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── LV NéoNoé (#435) ──────────────────────────────────────────────────────────
// Two backbone variants: BB / MM. Requiring the "neonoe"/"néonoé" token (not bare
// "Noé") keeps the regular Noé + Neverfull bucket bags out. Letter size whole-word.
export function neoNoeSize(label: "BB" | "MM"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!/n[eé]o.?no[eé]/.test(n) || /charm/.test(n)) return false;
    const want = new RegExp(`\\b${label.toLowerCase()}\\b`);
    const other = label === "BB" ? /\bmm\b/ : /\bbb\b/;
    return want.test(n) && !other.test(n);
  };
}

// ── LV Capucines (#436) ───────────────────────────────────────────────────────
// Mini + letter sizes BB / MM / GM + East-West. EW is checked first (its own backbone
// variant), then Mini, then the letter buckets (whole-word \b so "mm" can't hide in
// "monogram"). Unsized listings drop.
const CAPUCINES_LETTERS = ["bb", "mm", "gm"];
export function capucinesSize(label: "Mini" | "BB" | "MM" | "GM" | "East-West"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("capucines") || /charm/.test(n)) return false;
    const isEW = /east[\s-]*west|\bew\b/.test(n);
    if (label === "East-West") return isEW;
    if (isEW) return false;
    if (label === "Mini") return /\bmini\b/.test(n);
    if (/\bmini\b/.test(n)) return false;
    const want = new RegExp(`\\b${label.toLowerCase()}\\b`);
    const others = CAPUCINES_LETTERS.filter((s) => s !== label.toLowerCase()).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── LV OnTheGo (#437) ─────────────────────────────────────────────────────────
// Letter sizes PM / MM / GM + East-West. TRR titles it "OnTheGo" or "On The Go" —
// both matched. Letter sizes whole-word (\b, so "mm" can't hide in "monogram"); the
// EW format is checked first so it can't fall into a letter bucket.
const ONTHEGO_SIZES = ["pm", "mm", "gm"];
export function onTheGoSize(label: "PM" | "MM" | "GM" | "East-West"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!/on.?the.?go|onthego/.test(n) || /charm/.test(n)) return false;
    const isEW = /east[\s-]*west|\bew\b/.test(n);
    if (label === "East-West") return isEW;
    if (isEW) return false;
    const want = new RegExp(`\\b${label.toLowerCase()}\\b`);
    const others = ONTHEGO_SIZES.filter((s) => s !== label.toLowerCase()).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── LV Pochette Métis (#438) ──────────────────────────────────────────────────
// Two backbone variants: Standard / East-West. TRR drops the accent ("Pochette
// Metis"); other LV Pochettes (Eva, Félicie, Accessoires, Orsay) lack "metis" so
// requiring it excludes them. East-West = the "East West"/"EW" name; everything else
// metis is Standard (a rare Mini folds into Standard — no Mini backbone variant).
export function pochetteMetisSize(label: "Standard" | "East-West"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!/m[eé]tis/.test(n) || /charm/.test(n)) return false;
    const isEW = /east[\s-]*west|\bew\b/.test(n);
    return label === "East-West" ? isEW : !isEW;
  };
}

// ── Hermès Picotin Lock (#414) ────────────────────────────────────────────────
// Numeric sizes 18 / 22 / 26 (+ a rare Micro). Whole-word (\b) numeric; a seller
// typo ("Pictoin") and the larger 31cm both drop (clean per-size split). Adds year
// + a 2nd source to the FP Picotin rows.
const PICOTIN_SIZES = ["18", "22", "26"];
export function picotinSize(size: "18" | "22" | "26" | "Micro"): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("picotin") || /charm/.test(n)) return false;
    if (size === "Micro") return /\bmicro\b/.test(n);
    if (/\bmicro\b/.test(n)) return false;
    const want = new RegExp(`\\b${size}\\b`);
    const others = PICOTIN_SIZES.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── LV Keepall (#440) ─────────────────────────────────────────────────────────
// Numeric sizes 25 / 45 / 50 / 55 / 60, often with a "Bandoulière" strap that folds
// into its size (the strap detail stays in the row's desc). Whole-word (\b) so a year
// or a "25mm strap" mention can't false-match the size token. Unsized listings drop.
const KEEPALL_SIZES = ["25", "45", "50", "55", "60"];
export function keepallSize(size: string): (name: string) => boolean {
  const want = new RegExp(`\\b${size}\\b`);
  const others = KEEPALL_SIZES.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("keepall") || /charm/.test(n)) return false;
    return want.test(n) && !others.some((re) => re.test(n));
  };
}

// ── Hermès Evelyne (#412) ─────────────────────────────────────────────────────
// TRR sizes the Evelyne by NUMERIC cm, not the letter code: 16=TPM, 29=PM, 33=GM
// ("Clemence Evelyne III 29"). The letter codes appear only on the smallest as
// "TPM 16". TGM 40 is a larger, non-backbone size → dropped. Each numeric is
// whole-word (\b) so a year ("2024 … 29") can't false-match and a "16" can't hide
// inside "2016". Adds year (Evelyne has ~77% year coverage on TRR) + a 2nd source.
const EVELYNE_MAP: Record<"TPM" | "PM" | "GM", string> = { TPM: "16", PM: "29", GM: "33" };
export function evelyneSize(label: "TPM" | "PM" | "GM"): (name: string) => boolean {
  const num = EVELYNE_MAP[label];
  const otherNums = Object.values(EVELYNE_MAP).filter((x) => x !== num);
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("evelyne")) return false;
    if (/\b40\b/.test(n) || /tgm/.test(n)) return false; // TGM 40 ≠ backbone GM
    if (otherNums.some((x) => new RegExp(`\\b${x}\\b`).test(n))) return false;
    const numHit = new RegExp(`\\b${num}\\b`).test(n);
    const letterHit = new RegExp(`\\b${label.toLowerCase()}\\b`).test(n); // \btpm\b ⊅ pm
    return numHit || letterHit;
  };
}

// ── Coach (the viral thrift engine) ───────────────────────────────────────────
// TRR carries Coach's model + numeric size in the JSON-LD name for CONTEMPORARY
// Coach ("Leather Tabby 26", "Rogue 17", "Brooklyn 28"); VINTAGE Coach is
// generic-named ("Leather Shoulder Bag") with a model-less description and is NOT
// curatable from TRR structured data (a real limitation — the model is on the
// visible card but not the JSON-LD). Curated per-model targets share one
// "coach-models" capture (per-model searches: coach tabby / rogue / brooklyn / …).
// A null size = the model's Standard bucket (the model named with NO numeric size).
// Bands are thrift-wide (min ~$40) — low prices are the point for Coach.
const COACH_SLG = /wallet|card case|cardholder|wristlet|belt bag|sandal|loafer|pump|mule/;
export function coachModelSize(
  model: string,
  size: string | null,
  allSizes: string[],
  notTokens: string[] = []
): (name: string) => boolean {
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes(model) || COACH_SLG.test(n)) return false;
    if (notTokens.some((t) => n.includes(t))) return false;
    if (size === null) return !allSizes.some((s) => new RegExp(`\\b${s}\\b`).test(n));
    const want = new RegExp(`\\b${size}\\b`);
    const others = allSizes.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}
/** Pillow Tabby is a distinct backbone style (#500) — require BOTH "pillow" + "tabby". */
export function coachPillowTabby(size: string | null): (name: string) => boolean {
  const allSizes = ["18", "26"];
  return (name: string) => {
    const n = name.toLowerCase();
    if (!n.includes("pillow") || !n.includes("tabby") || COACH_SLG.test(n)) return false;
    if (size === null) return !allSizes.some((s) => new RegExp(`\\b${s}\\b`).test(n));
    const want = new RegExp(`\\b${size}\\b`);
    const others = allSizes.filter((s) => s !== size).map((s) => new RegExp(`\\b${s}\\b`));
    return want.test(n) && !others.some((re) => re.test(n));
  };
}
const TABBY_SIZES = ["12", "20", "26"];
const ROGUE_SIZES = ["17", "25", "30", "39"];
const BROOKLYN_SIZES = ["28", "39"];

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
    minPrice: 600, maxPrice: 4000, rawKey: "gucci-wide",
  },
  "gucci-gg-marmont-medium": {
    brand: "Gucci", style: "GG Marmont", size_label: "Medium",
    namePredicate: predicate(["marmont", "medium"], ["small", "mini", "large"]),
    minPrice: 600, maxPrice: 4000, rawKey: "gucci-wide",
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

  // ── Chanel Boy (backbone Tier-1) — sizes Mini/Small/Medium/Large, one capture ──
  // Resolves to the clean canonical "Boy" style (#424). Wide band keeps real range
  // (quilted lambskin ~$1.2k → exotic python/limited ~$9k+).
  "chanel-boy-mini": {
    brand: "Chanel", style: "Boy", size_label: "Mini",
    namePredicate: modelSize("boy", "mini", BOY_SIZES), minPrice: 800, maxPrice: 20000, rawKey: "chanel-boy",
  },
  "chanel-boy-small": {
    brand: "Chanel", style: "Boy", size_label: "Small",
    namePredicate: modelSize("boy", "small", BOY_SIZES), minPrice: 800, maxPrice: 20000, rawKey: "chanel-boy",
  },
  "chanel-boy-medium": {
    brand: "Chanel", style: "Boy", size_label: "Medium",
    namePredicate: modelSize("boy", "medium", BOY_SIZES), minPrice: 800, maxPrice: 20000, rawKey: "chanel-boy",
  },
  "chanel-boy-large": {
    brand: "Chanel", style: "Boy", size_label: "Large",
    namePredicate: modelSize("boy", "large", BOY_SIZES), minPrice: 800, maxPrice: 20000, rawKey: "chanel-boy",
  },

  // ── Gucci Jackie 1961 (backbone Tier-1) — Mini/Small/Medium/Large. Shares the
  // one broad "gucci-wide" capture with Dionysus / Horsebit / Marmont. ──
  "gucci-jackie-mini": {
    brand: "Gucci", style: "Jackie 1961", size_label: "Mini",
    namePredicate: modelSize("jackie", "mini", JACKIE_SIZES), minPrice: 500, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-jackie-small": {
    brand: "Gucci", style: "Jackie 1961", size_label: "Small",
    namePredicate: modelSize("jackie", "small", JACKIE_SIZES), minPrice: 500, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-jackie-medium": {
    brand: "Gucci", style: "Jackie 1961", size_label: "Medium",
    namePredicate: modelSize("jackie", "medium", JACKIE_SIZES), minPrice: 500, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-jackie-large": {
    brand: "Gucci", style: "Jackie 1961", size_label: "Large",
    namePredicate: modelSize("jackie", "large", JACKIE_SIZES), minPrice: 500, maxPrice: 12000, rawKey: "gucci-wide",
  },

  // ── Gucci Dionysus (backbone Tier-1) — Super Mini / Mini / Small / Medium.
  // CURATED (not catch-all) because Super Mini contains "mini": the catch-all
  // detectSizeLabel would mislabel Super Mini → Mini and pollute the FP split.
  // Shares the "gucci-wide" capture. ──
  "gucci-dionysus-super-mini": {
    brand: "Gucci", style: "Dionysus", size_label: "Super Mini",
    namePredicate: dionysusSize("super mini"), minPrice: 350, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-dionysus-mini": {
    brand: "Gucci", style: "Dionysus", size_label: "Mini",
    namePredicate: dionysusSize("mini"), minPrice: 350, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-dionysus-small": {
    brand: "Gucci", style: "Dionysus", size_label: "Small",
    namePredicate: dionysusSize("small"), minPrice: 350, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-dionysus-medium": {
    brand: "Gucci", style: "Dionysus", size_label: "Medium",
    namePredicate: dionysusSize("medium"), minPrice: 350, maxPrice: 12000, rawKey: "gucci-wide",
  },

  // ── Gucci Horsebit 1955 (backbone Tier-1) — Mini / Small / Shoulder. Requires
  // "horsebit" + "1955" so the Horsebit Chain model + loafers never leak. Shares
  // the "gucci-wide" capture. ──
  "gucci-horsebit-mini": {
    brand: "Gucci", style: "Horsebit 1955", size_label: "Mini",
    namePredicate: horsebitSize("mini"), minPrice: 450, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-horsebit-small": {
    brand: "Gucci", style: "Horsebit 1955", size_label: "Small",
    namePredicate: horsebitSize("small"), minPrice: 450, maxPrice: 12000, rawKey: "gucci-wide",
  },
  "gucci-horsebit-shoulder": {
    brand: "Gucci", style: "Horsebit 1955", size_label: "Shoulder",
    namePredicate: horsebitSize(null), minPrice: 450, maxPrice: 12000, rawKey: "gucci-wide",
  },

  // ── Celine Luggage (backbone Tier-1, canonical "Luggage Tote") — Nano/Micro/Mini/Medium ──
  "celine-luggage-nano": {
    brand: "Celine", style: "Luggage Tote", size_label: "Nano",
    namePredicate: modelSize("luggage", "nano", LUGGAGE_SIZES, ["phantom"]), minPrice: 400, maxPrice: 12000, rawKey: "celine-luggage",
  },
  "celine-luggage-micro": {
    brand: "Celine", style: "Luggage Tote", size_label: "Micro",
    namePredicate: modelSize("luggage", "micro", LUGGAGE_SIZES, ["phantom"]), minPrice: 400, maxPrice: 12000, rawKey: "celine-luggage",
  },
  "celine-luggage-mini": {
    brand: "Celine", style: "Luggage Tote", size_label: "Mini",
    namePredicate: modelSize("luggage", "mini", LUGGAGE_SIZES, ["phantom"]), minPrice: 400, maxPrice: 12000, rawKey: "celine-luggage",
  },
  "celine-luggage-medium": {
    brand: "Celine", style: "Luggage Tote", size_label: "Medium",
    namePredicate: modelSize("luggage", "medium", LUGGAGE_SIZES, ["phantom"]), minPrice: 400, maxPrice: 12000, rawKey: "celine-luggage",
  },

  // ── Saint Laurent Loulou (backbone Tier-1) — Toy/Small/Medium/Large ──
  "ysl-loulou-toy": {
    brand: "Saint Laurent", style: "Loulou", size_label: "Toy",
    namePredicate: modelSize("loulou", "toy", LOULOU_SIZES, ["puffer"]), minPrice: 400, maxPrice: 8000, rawKey: "ysl-loulou",
  },
  "ysl-loulou-small": {
    brand: "Saint Laurent", style: "Loulou", size_label: "Small",
    namePredicate: modelSize("loulou", "small", LOULOU_SIZES, ["puffer"]), minPrice: 400, maxPrice: 8000, rawKey: "ysl-loulou",
  },
  "ysl-loulou-medium": {
    brand: "Saint Laurent", style: "Loulou", size_label: "Medium",
    namePredicate: modelSize("loulou", "medium", LOULOU_SIZES, ["puffer"]), minPrice: 400, maxPrice: 8000, rawKey: "ysl-loulou",
  },
  "ysl-loulou-large": {
    brand: "Saint Laurent", style: "Loulou", size_label: "Large",
    namePredicate: modelSize("loulou", "large", LOULOU_SIZES, ["puffer"]), minPrice: 400, maxPrice: 8000, rawKey: "ysl-loulou",
  },

  // ── Gucci Ophidia (#448) — curated per-size, share one "gucci-ophidia" capture. ──
  // Adds year + a 2nd source to the FP Ophidia rows. Unsized listings drop (clean split).
  "gucci-ophidia-super-mini": { brand: "Gucci", style: "Ophidia", size_label: "Super Mini",
    namePredicate: ophidiaSize("super mini"), minPrice: 350, maxPrice: 6000, rawKey: "gucci-ophidia" },
  "gucci-ophidia-mini": { brand: "Gucci", style: "Ophidia", size_label: "Mini",
    namePredicate: ophidiaSize("mini"), minPrice: 350, maxPrice: 6000, rawKey: "gucci-ophidia" },
  "gucci-ophidia-small": { brand: "Gucci", style: "Ophidia", size_label: "Small",
    namePredicate: ophidiaSize("small"), minPrice: 350, maxPrice: 6000, rawKey: "gucci-ophidia" },
  "gucci-ophidia-medium": { brand: "Gucci", style: "Ophidia", size_label: "Medium",
    namePredicate: ophidiaSize("medium"), minPrice: 350, maxPrice: 6000, rawKey: "gucci-ophidia" },
  "gucci-ophidia-large": { brand: "Gucci", style: "Ophidia", size_label: "Large",
    namePredicate: ophidiaSize("large"), minPrice: 350, maxPrice: 6000, rawKey: "gucci-ophidia" },
  "gucci-ophidia-jumbo": { brand: "Gucci", style: "Ophidia", size_label: "Jumbo",
    namePredicate: ophidiaSize("jumbo"), minPrice: 350, maxPrice: 6000, rawKey: "gucci-ophidia" },

  // ── LV Bumbag (#445) — Mini / Standard, share one "lv-bumbag" capture. ──
  "lv-bumbag-mini": { brand: "Louis Vuitton", style: "Bumbag", size_label: "Mini",
    namePredicate: bumbagSize("Mini"), minPrice: 250, maxPrice: 6000, rawKey: "lv-bumbag" },
  "lv-bumbag-standard": { brand: "Louis Vuitton", style: "Bumbag", size_label: "Standard",
    namePredicate: bumbagSize("Standard"), minPrice: 250, maxPrice: 6000, rawKey: "lv-bumbag" },

  // ── Hermès Herbag (#417) — PM / MM (numeric 31/39), share one "hermes-herbag" capture. ──
  "hermes-herbag-pm": { brand: "Hermès", style: "Herbag", size_label: "PM",
    namePredicate: herbagSize("PM"), minPrice: 500, maxPrice: 12000, rawKey: "hermes-herbag" },
  "hermes-herbag-mm": { brand: "Hermès", style: "Herbag", size_label: "MM",
    namePredicate: herbagSize("MM"), minPrice: 500, maxPrice: 12000, rawKey: "hermes-herbag" },

  // ── Hermès Lindy (#416) — Mini / 26 / 30 / 34, share one "hermes-lindy" capture. ──
  "hermes-lindy-mini": { brand: "Hermès", style: "Lindy", size_label: "Mini",
    namePredicate: lindySize("Mini"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-lindy" },
  "hermes-lindy-26": { brand: "Hermès", style: "Lindy", size_label: "26",
    namePredicate: lindySize("26"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-lindy" },
  "hermes-lindy-30": { brand: "Hermès", style: "Lindy", size_label: "30",
    namePredicate: lindySize("30"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-lindy" },
  "hermes-lindy-34": { brand: "Hermès", style: "Lindy", size_label: "34",
    namePredicate: lindySize("34"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-lindy" },

  // ── LV NéoNoé (#435) — BB / MM, share one "lv-neonoe" capture. ──
  "lv-neonoe-bb": { brand: "Louis Vuitton", style: "NéoNoé", size_label: "BB",
    namePredicate: neoNoeSize("BB"), minPrice: 500, maxPrice: 6000, rawKey: "lv-neonoe" },
  "lv-neonoe-mm": { brand: "Louis Vuitton", style: "NéoNoé", size_label: "MM",
    namePredicate: neoNoeSize("MM"), minPrice: 500, maxPrice: 6000, rawKey: "lv-neonoe" },

  // ── LV Capucines (#436) — Mini/BB/MM/GM/East-West, share one "lv-capucines" capture. ──
  "lv-capucines-mini": { brand: "Louis Vuitton", style: "Capucines", size_label: "Mini",
    namePredicate: capucinesSize("Mini"), minPrice: 1000, maxPrice: 20000, rawKey: "lv-capucines" },
  "lv-capucines-bb": { brand: "Louis Vuitton", style: "Capucines", size_label: "BB",
    namePredicate: capucinesSize("BB"), minPrice: 1000, maxPrice: 20000, rawKey: "lv-capucines" },
  "lv-capucines-mm": { brand: "Louis Vuitton", style: "Capucines", size_label: "MM",
    namePredicate: capucinesSize("MM"), minPrice: 1000, maxPrice: 20000, rawKey: "lv-capucines" },
  "lv-capucines-gm": { brand: "Louis Vuitton", style: "Capucines", size_label: "GM",
    namePredicate: capucinesSize("GM"), minPrice: 1000, maxPrice: 20000, rawKey: "lv-capucines" },
  "lv-capucines-east-west": { brand: "Louis Vuitton", style: "Capucines", size_label: "East-West",
    namePredicate: capucinesSize("East-West"), minPrice: 1000, maxPrice: 20000, rawKey: "lv-capucines" },

  // ── LV OnTheGo (#437) — letter sizes + East-West, share one "lv-onthego" capture. ──
  "lv-onthego-pm": { brand: "Louis Vuitton", style: "OnTheGo", size_label: "PM",
    namePredicate: onTheGoSize("PM"), minPrice: 600, maxPrice: 10000, rawKey: "lv-onthego" },
  "lv-onthego-mm": { brand: "Louis Vuitton", style: "OnTheGo", size_label: "MM",
    namePredicate: onTheGoSize("MM"), minPrice: 600, maxPrice: 10000, rawKey: "lv-onthego" },
  "lv-onthego-gm": { brand: "Louis Vuitton", style: "OnTheGo", size_label: "GM",
    namePredicate: onTheGoSize("GM"), minPrice: 600, maxPrice: 10000, rawKey: "lv-onthego" },
  "lv-onthego-east-west": { brand: "Louis Vuitton", style: "OnTheGo", size_label: "East-West",
    namePredicate: onTheGoSize("East-West"), minPrice: 600, maxPrice: 10000, rawKey: "lv-onthego" },

  // ── LV Pochette Métis (#438) — share one "lv-pochette-metis" capture. ──
  "lv-pochette-metis-standard": { brand: "Louis Vuitton", style: "Pochette Métis", size_label: "Standard",
    namePredicate: pochetteMetisSize("Standard"), minPrice: 500, maxPrice: 8000, rawKey: "lv-pochette-metis" },
  "lv-pochette-metis-east-west": { brand: "Louis Vuitton", style: "Pochette Métis", size_label: "East-West",
    namePredicate: pochetteMetisSize("East-West"), minPrice: 500, maxPrice: 8000, rawKey: "lv-pochette-metis" },

  // ── LV Twist (#439) — PM / MM, share one "lv-twist" capture. ──
  "lv-twist-pm": { brand: "Louis Vuitton", style: "Twist", size_label: "PM",
    namePredicate: twistSize("PM"), minPrice: 800, maxPrice: 12000, rawKey: "lv-twist" },
  "lv-twist-mm": { brand: "Louis Vuitton", style: "Twist", size_label: "MM",
    namePredicate: twistSize("MM"), minPrice: 800, maxPrice: 12000, rawKey: "lv-twist" },

  // ── Gucci Soho Disco (#450) — Mini / Small, share one "gucci-soho-disco" capture. ──
  "gucci-soho-disco-mini": { brand: "Gucci", style: "Soho Disco", size_label: "Mini",
    namePredicate: sohoDiscoSize("Mini"), minPrice: 300, maxPrice: 4000, rawKey: "gucci-soho-disco" },
  "gucci-soho-disco-small": { brand: "Gucci", style: "Soho Disco", size_label: "Small",
    namePredicate: sohoDiscoSize("Small"), minPrice: 300, maxPrice: 4000, rawKey: "gucci-soho-disco" },

  // ── Hermès Bolide (#415) — Mini/25/27/31/35, share one "hermes-bolide" capture. ──
  "hermes-bolide-mini": { brand: "Hermès", style: "Bolide", size_label: "Mini",
    namePredicate: bolideSize("Mini"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-bolide" },
  "hermes-bolide-25": { brand: "Hermès", style: "Bolide", size_label: "25",
    namePredicate: bolideSize("25"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-bolide" },
  "hermes-bolide-27": { brand: "Hermès", style: "Bolide", size_label: "27",
    namePredicate: bolideSize("27"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-bolide" },
  "hermes-bolide-31": { brand: "Hermès", style: "Bolide", size_label: "31",
    namePredicate: bolideSize("31"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-bolide" },
  "hermes-bolide-35": { brand: "Hermès", style: "Bolide", size_label: "35",
    namePredicate: bolideSize("35"), minPrice: 1500, maxPrice: 30000, rawKey: "hermes-bolide" },

  // ── LV Coussin (#442) — BB / MM / PM, share one "lv-coussin" capture. ──
  "lv-coussin-bb": { brand: "Louis Vuitton", style: "Coussin", size_label: "BB",
    namePredicate: coussinSize("BB"), minPrice: 800, maxPrice: 10000, rawKey: "lv-coussin" },
  "lv-coussin-mm": { brand: "Louis Vuitton", style: "Coussin", size_label: "MM",
    namePredicate: coussinSize("MM"), minPrice: 800, maxPrice: 10000, rawKey: "lv-coussin" },
  "lv-coussin-pm": { brand: "Louis Vuitton", style: "Coussin", size_label: "PM",
    namePredicate: coussinSize("PM"), minPrice: 800, maxPrice: 10000, rawKey: "lv-coussin" },

  // ── Gucci Diana (#451) — Mini/Small/Medium/Maxi(=TRR "Large"), one "gucci-diana" capture. ──
  "gucci-diana-mini": { brand: "Gucci", style: "Diana", size_label: "Mini",
    namePredicate: dianaSize("Mini"), minPrice: 400, maxPrice: 8000, rawKey: "gucci-diana" },
  "gucci-diana-small": { brand: "Gucci", style: "Diana", size_label: "Small",
    namePredicate: dianaSize("Small"), minPrice: 400, maxPrice: 8000, rawKey: "gucci-diana" },
  "gucci-diana-medium": { brand: "Gucci", style: "Diana", size_label: "Medium",
    namePredicate: dianaSize("Medium"), minPrice: 400, maxPrice: 8000, rawKey: "gucci-diana" },
  "gucci-diana-maxi": { brand: "Gucci", style: "Diana", size_label: "Maxi",
    namePredicate: dianaSize("Maxi"), minPrice: 400, maxPrice: 8000, rawKey: "gucci-diana" },

  // ── Gucci Blondie (#453) — share one "gucci-blondie" capture. ──
  "gucci-blondie-mini": { brand: "Gucci", style: "Blondie", size_label: "Mini",
    namePredicate: modelSize("blondie", "mini", BLONDIE_SIZES), minPrice: 400, maxPrice: 8000, rawKey: "gucci-blondie" },
  "gucci-blondie-small": { brand: "Gucci", style: "Blondie", size_label: "Small",
    namePredicate: modelSize("blondie", "small", BLONDIE_SIZES), minPrice: 400, maxPrice: 8000, rawKey: "gucci-blondie" },
  "gucci-blondie-medium": { brand: "Gucci", style: "Blondie", size_label: "Medium",
    namePredicate: modelSize("blondie", "medium", BLONDIE_SIZES), minPrice: 400, maxPrice: 8000, rawKey: "gucci-blondie" },
  "gucci-blondie-large": { brand: "Gucci", style: "Blondie", size_label: "Large",
    namePredicate: modelSize("blondie", "large", BLONDIE_SIZES), minPrice: 400, maxPrice: 8000, rawKey: "gucci-blondie" },

  // ── Chanel Deauville (#429) — share one "chanel-deauville" capture. ──
  "chanel-deauville-mini": { brand: "Chanel", style: "Deauville", size_label: "Mini",
    namePredicate: modelSize("deauville", "mini", DEAUVILLE_SIZES), minPrice: 600, maxPrice: 12000, rawKey: "chanel-deauville" },
  "chanel-deauville-small": { brand: "Chanel", style: "Deauville", size_label: "Small",
    namePredicate: modelSize("deauville", "small", DEAUVILLE_SIZES), minPrice: 600, maxPrice: 12000, rawKey: "chanel-deauville" },
  "chanel-deauville-medium": { brand: "Chanel", style: "Deauville", size_label: "Medium",
    namePredicate: modelSize("deauville", "medium", DEAUVILLE_SIZES), minPrice: 600, maxPrice: 12000, rawKey: "chanel-deauville" },
  "chanel-deauville-large": { brand: "Chanel", style: "Deauville", size_label: "Large",
    namePredicate: modelSize("deauville", "large", DEAUVILLE_SIZES), minPrice: 600, maxPrice: 12000, rawKey: "chanel-deauville" },

  // ── Chanel Vanity Case (#430) — share one "chanel-vanity" capture. ──
  "chanel-vanity-mini": { brand: "Chanel", style: "Vanity Case", size_label: "Mini",
    namePredicate: modelSize("vanity", "mini", VANITY_SIZES), minPrice: 1000, maxPrice: 15000, rawKey: "chanel-vanity" },
  "chanel-vanity-small": { brand: "Chanel", style: "Vanity Case", size_label: "Small",
    namePredicate: modelSize("vanity", "small", VANITY_SIZES), minPrice: 1000, maxPrice: 15000, rawKey: "chanel-vanity" },
  "chanel-vanity-medium": { brand: "Chanel", style: "Vanity Case", size_label: "Medium",
    namePredicate: modelSize("vanity", "medium", VANITY_SIZES), minPrice: 1000, maxPrice: 15000, rawKey: "chanel-vanity" },
  "chanel-vanity-large": { brand: "Chanel", style: "Vanity Case", size_label: "Large",
    namePredicate: modelSize("vanity", "large", VANITY_SIZES), minPrice: 1000, maxPrice: 15000, rawKey: "chanel-vanity" },

  // ── Hermès Picotin Lock (#414) — numeric sizes, share one "hermes-picotin" capture. ──
  "hermes-picotin-18": { brand: "Hermès", style: "Picotin Lock", size_label: "18",
    namePredicate: picotinSize("18"), minPrice: 1000, maxPrice: 30000, rawKey: "hermes-picotin" },
  "hermes-picotin-22": { brand: "Hermès", style: "Picotin Lock", size_label: "22",
    namePredicate: picotinSize("22"), minPrice: 1000, maxPrice: 30000, rawKey: "hermes-picotin" },
  "hermes-picotin-26": { brand: "Hermès", style: "Picotin Lock", size_label: "26",
    namePredicate: picotinSize("26"), minPrice: 1000, maxPrice: 30000, rawKey: "hermes-picotin" },
  "hermes-picotin-micro": { brand: "Hermès", style: "Picotin Lock", size_label: "Micro",
    namePredicate: picotinSize("Micro"), minPrice: 1000, maxPrice: 30000, rawKey: "hermes-picotin" },

  // ── LV Keepall (#440) — numeric sizes, share one "lv-keepall" capture. ──
  "lv-keepall-25": { brand: "Louis Vuitton", style: "Keepall", size_label: "25",
    namePredicate: keepallSize("25"), minPrice: 300, maxPrice: 15000, rawKey: "lv-keepall" },
  "lv-keepall-45": { brand: "Louis Vuitton", style: "Keepall", size_label: "45",
    namePredicate: keepallSize("45"), minPrice: 300, maxPrice: 15000, rawKey: "lv-keepall" },
  "lv-keepall-50": { brand: "Louis Vuitton", style: "Keepall", size_label: "50",
    namePredicate: keepallSize("50"), minPrice: 300, maxPrice: 15000, rawKey: "lv-keepall" },
  "lv-keepall-55": { brand: "Louis Vuitton", style: "Keepall", size_label: "55",
    namePredicate: keepallSize("55"), minPrice: 300, maxPrice: 15000, rawKey: "lv-keepall" },
  "lv-keepall-60": { brand: "Louis Vuitton", style: "Keepall", size_label: "60",
    namePredicate: keepallSize("60"), minPrice: 300, maxPrice: 15000, rawKey: "lv-keepall" },

  // ── Hermès Evelyne (#412) — numeric TRR sizes, share one "hermes-evelyne" capture. ──
  "hermes-evelyne-tpm": { brand: "Hermès", style: "Evelyne", size_label: "TPM",
    namePredicate: evelyneSize("TPM"), minPrice: 1000, maxPrice: 12000, rawKey: "hermes-evelyne" },
  "hermes-evelyne-pm": { brand: "Hermès", style: "Evelyne", size_label: "PM",
    namePredicate: evelyneSize("PM"), minPrice: 1000, maxPrice: 12000, rawKey: "hermes-evelyne" },
  "hermes-evelyne-gm": { brand: "Hermès", style: "Evelyne", size_label: "GM",
    namePredicate: evelyneSize("GM"), minPrice: 1000, maxPrice: 12000, rawKey: "hermes-evelyne" },

  // ── Coach (the viral thrift engine) — curated per-model; all share "coach-models". ──
  // Tabby (#3) — sizes 12 / 20 / 26 + Standard. Excludes Pillow Tabby (own style).
  "coach-tabby-12": { brand: "Coach", style: "Tabby", size_label: "12",
    namePredicate: coachModelSize("tabby", "12", TABBY_SIZES, ["pillow"]), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-tabby-20": { brand: "Coach", style: "Tabby", size_label: "20",
    namePredicate: coachModelSize("tabby", "20", TABBY_SIZES, ["pillow"]), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-tabby-26": { brand: "Coach", style: "Tabby", size_label: "26",
    namePredicate: coachModelSize("tabby", "26", TABBY_SIZES, ["pillow"]), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-tabby-standard": { brand: "Coach", style: "Tabby", size_label: "Standard",
    namePredicate: coachModelSize("tabby", null, TABBY_SIZES, ["pillow"]), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },

  // Pillow Tabby (#500) — sizes 18 / 26 + Standard.
  "coach-pillow-tabby-18": { brand: "Coach", style: "Pillow Tabby", size_label: "18",
    namePredicate: coachPillowTabby("18"), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-pillow-tabby-26": { brand: "Coach", style: "Pillow Tabby", size_label: "26",
    namePredicate: coachPillowTabby("26"), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-pillow-tabby-standard": { brand: "Coach", style: "Pillow Tabby", size_label: "Standard",
    namePredicate: coachPillowTabby(null), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },

  // Rogue (#498) — sizes 17 / 25 / 30 / 39 + Standard.
  "coach-rogue-17": { brand: "Coach", style: "Rogue", size_label: "17",
    namePredicate: coachModelSize("rogue", "17", ROGUE_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-rogue-25": { brand: "Coach", style: "Rogue", size_label: "25",
    namePredicate: coachModelSize("rogue", "25", ROGUE_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-rogue-30": { brand: "Coach", style: "Rogue", size_label: "30",
    namePredicate: coachModelSize("rogue", "30", ROGUE_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-rogue-39": { brand: "Coach", style: "Rogue", size_label: "39",
    namePredicate: coachModelSize("rogue", "39", ROGUE_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-rogue-standard": { brand: "Coach", style: "Rogue", size_label: "Standard",
    namePredicate: coachModelSize("rogue", null, ROGUE_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },

  // Brooklyn (#501) — sizes 28 / 39 + Standard (the Brooklyn 'large' folds to Standard).
  "coach-brooklyn-28": { brand: "Coach", style: "Brooklyn", size_label: "28",
    namePredicate: coachModelSize("brooklyn", "28", BROOKLYN_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-brooklyn-39": { brand: "Coach", style: "Brooklyn", size_label: "39",
    namePredicate: coachModelSize("brooklyn", "39", BROOKLYN_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-brooklyn-standard": { brand: "Coach", style: "Brooklyn", size_label: "Standard",
    namePredicate: coachModelSize("brooklyn", null, BROOKLYN_SIZES), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },

  // Willow (#499) — thin on TRR (Small + Standard).
  "coach-willow-small": { brand: "Coach", style: "Willow", size_label: "Small",
    namePredicate: coachModelSize("willow", "small", ["small"]), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
  "coach-willow-standard": { brand: "Coach", style: "Willow", size_label: "Standard",
    namePredicate: coachModelSize("willow", null, ["small"]), minPrice: 40, maxPrice: 3000, rawKey: "coach-models" },
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
