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

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

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

/** Notable size tokens → display form. Ordered longest-first so "micro mini" wins over
 *  "mini". Generic "medium"/"standard" are intentionally omitted (they add no signal). */
const SIZES: [test: RegExp, display: string][] = [
  [/\bmicro mini\b/, "Micro Mini"],
  [/\bnano\b/, "Nano"],
  [/\bmini\b/, "Mini"],
  [/\bsmall\b/, "Small"],
  [/\bmedium large\b|\bm\/l\b/, "Medium Large"],
  [/\bjumbo\b/, "Jumbo"],
  [/\bmaxi\b/, "Maxi"],
  [/\blarge\b/, "Large"],
];

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

  const size = SIZES.find(([re]) => re.test(hay))?.[1] ?? null;
  const type = TYPES.find(([re, display]) => re.test(hay) && !style.includes(fold(display)))?.[1] ?? null;

  // Suppress a size we already imply, and a type word already in the style name.
  const parts = [size && !style.includes(fold(size)) ? size : null, type].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}
