/**
 * Honest item descriptor for a deal card. The "Priced well today" rail groups by variant
 * and shows the canonical brand + style name, which HID what the listing actually is: a
 * Micro Mini single flap surfaced as "Chanel Classic Flap", a clutch surfaced as "Chanel
 * Gabrielle" (owner report 2026-07-11). This derives a short, honest qualifier (size and
 * distinct type) from the listing's OWN title + source-url slug so the card can say
 * "Classic Flap · Micro Mini" / "Gabrielle · Clutch".
 *
 * Conservative by design: emits ONLY recognised size / type tokens, and never repeats a
 * word already in the style name, so it adds information or nothing at all.
 */

import { materialFamily } from "./listings-taxonomy";

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Title + slug, separators flattened, for token matching ("double-flap" -> "double flap"). */
function specText(notes: string | null | undefined, sourceUrl: string | null | undefined): string {
  return fold(`${notes ?? ""} ${slugText(sourceUrl)}`).replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Pull the human words out of a reseller listing URL slug (the last path segment, minus
 *  a trailing product-id like "-p1318211" / "-1778569"). Many rows carry the descriptor
 *  ONLY here (their notes are blank), e.g. ".../chanel-navy-gabrielle-clutch-large-p...". */
export function slugText(url: string | null | undefined): string {
  if (!url) return "";
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  return seg
    .replace(/-p?\d{4,}$/i, "") // trailing product id
    .replace(/[-_]+/g, " ")
    .trim();
}

/** Size table: matcher → normalized bucket key (for like-for-like comps) + display form.
 *  Ordered longest/most-specific first so "micro mini" wins over "mini". "medium"/"m/l"
 *  ARE bucketed (needed for the size-aware median) but omitted from the display qualifier
 *  since a plain "Medium" adds little to the card. */
const SIZE_TABLE: [test: RegExp, bucket: string, display: string | null][] = [
  [/\bmicro mini\b/, "micro", "Micro Mini"],
  [/\bmicro\b/, "micro", "Micro"],
  [/\bnano\b/, "nano", "Nano"],
  [/\bmini\b/, "mini", "Mini"],
  [/\bsmall\b/, "small", "Small"],
  [/\bmedium large\b|\bm\/l\b|\bmedium\/large\b/, "medium", null],
  [/\bjumbo\b/, "jumbo", "Jumbo"],
  [/\bmaxi\b/, "maxi", "Maxi"],
  [/\blarge\b/, "large", "Large"],
  [/\bmedium\b/, "medium", null],
];

/**
 * Normalized size bucket for a listing, from its title + source-url slug, or null when no
 * size is stated. Used by the deals rail to compare a listing only against SAME-SIZE comps
 * (a micro-mini flap must not be graded against a medium-flap median).
 */
export function parseSizeBucket(notes: string | null | undefined, sourceUrl: string | null | undefined): string | null {
  const hay = fold(`${notes ?? ""} ${slugText(sourceUrl)}`);
  return SIZE_TABLE.find(([re]) => re.test(hay))?.[1] ?? null;
}

/** Distinct TYPE words that change what the item IS (not flap sub-shapes, which stay under
 *  the flap style). Each maps a matcher to a display word. */
const TYPES: [test: RegExp, display: string][] = [
  [/\bwallet on chain\b|\bwoc\b/, "Wallet on Chain"],
  [/\bclutch\b/, "Clutch"],
  [/\bhobo\b/, "Hobo"],
  [/\bcamera\b/, "Camera Bag"],
  [/\bvanity\b/, "Vanity Case"],
  [/\bbelt bag\b|\bbum bag\b|\bwaist bag\b/, "Belt Bag"],
  [/\bbackpack\b/, "Backpack"],
  [/\btote\b/, "Tote"],
  [/\bbucket\b/, "Bucket"],
  [/\bpouch\b/, "Pouch"],
];

/**
 * A short honest qualifier for the card heading (size + distinct type), or null when the
 * listing adds nothing beyond the style name. `styleName` is the canonical name already
 * shown, so any token it already contains is suppressed (no "Gabrielle Pouch Pouch").
 */
export function listingQualifier(
  styleName: string | null | undefined,
  notes: string | null | undefined,
  sourceUrl: string | null | undefined,
): string | null {
  const hay = fold(`${notes ?? ""} ${slugText(sourceUrl)}`).replace(/\s+/g, " ").trim();
  if (!hay) return null;
  const style = fold(styleName ?? "");

  const size = SIZE_TABLE.find(([re, , display]) => display && re.test(hay))?.[2] ?? null;
  const type = TYPES.find(([re, display]) => re.test(hay) && !style.includes(fold(display)))?.[1] ?? null;

  // Suppress a size we already imply, and a type word already in the style name.
  const parts = [size && !style.includes(fold(size)) ? size : null, type].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/**
 * Chanel-flap STRUCTURE — the axis resellers muddle with their size word (owner report
 * 2026-07-11): a "Small … single flap" on Fashionphile is usually the Mini Rectangular
 * (elongated single-flap crossbody, ~$4-5k), NOT the Small Classic (structured double
 * flap, ~$8-10k). Grading one against the other's median invents a fake discount. Returns
 * the structural class so the deals engine only compares single-to-single, double-to-double.
 * null for non-flap bags (structure doesn't differentiate them — size + material do).
 */
export function parseFlapStructure(
  notes: string | null | undefined,
  sourceUrl: string | null | undefined,
): "single" | "double" | "reissue" | null {
  const h = specText(notes, sourceUrl);
  if (/\bmini rectangular\b|\brectangular\b|\bsingle flap\b|\beast west\b|\bwallet on chain\b|\bwoc\b/.test(h)) return "single";
  if (/\bdouble flap\b|\bclassic double\b|\bclassic single\b|\bsmall classic\b|\bmedium classic\b|\bjumbo\b|\bmaxi\b/.test(h)) return "double";
  if (/\breissue\b|\b2 55\b|\b255\b|\b226\b|\b227\b|\b228\b/.test(h)) return "reissue";
  return null;
}

/** Material FAMILY for a listing — the structured `material` column first, else a keyword
 *  read from the title/slug (many rows carry material only there). */
export function parseMaterialFamily(
  notes: string | null | undefined,
  sourceUrl: string | null | undefined,
  material: string | null | undefined,
): string | null {
  const fromCol = materialFamily(material ?? null);
  if (fromCol) return fromCol;
  const h = specText(notes, sourceUrl);
  const keys = [
    "caviar", "lambskin", "calfskin", "tweed", "canvas", "patent", "jersey", "denim",
    "suede", "python", "alligator", "lizard", "wool", "felt", "raffia", "shearling",
  ];
  const hit = keys.find((k) => h.includes(k));
  return hit ? hit[0].toUpperCase() + hit.slice(1) : null;
}

/**
 * A like-for-like SPEC key for grading a deal: size bucket + material family + flap
 * structure. The deals engine scopes a listing's median to comps that share this key, so a
 * canvas Mini Rectangular is never graded against a caviar Small Classic. Empty segments
 * where a facet is unknown.
 */
export function dealSpecKey(
  notes: string | null | undefined,
  sourceUrl: string | null | undefined,
  material: string | null | undefined,
): string {
  return [
    parseSizeBucket(notes, sourceUrl) ?? "",
    parseMaterialFamily(notes, sourceUrl, material) ?? "",
    parseFlapStructure(notes, sourceUrl) ?? "",
  ].join("|");
}

/** True when a listing states at least one comparability facet (size / material /
 *  structure). With none, we can't establish a like-for-like median, so the deals engine
 *  skips it rather than grade against a blended, meaningless population. */
export function hasUsableSpec(
  notes: string | null | undefined,
  sourceUrl: string | null | undefined,
  material: string | null | undefined,
): boolean {
  return Boolean(
    parseSizeBucket(notes, sourceUrl) ||
      parseMaterialFamily(notes, sourceUrl, material) ||
      parseFlapStructure(notes, sourceUrl),
  );
}
