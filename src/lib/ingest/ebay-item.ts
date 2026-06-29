/**
 * Pure parser for an eBay ITEM page's structured data (captured via Firecrawl, since
 * eBay bot-blocks plain fetch — verified 2026-06-29: item pages 403, browse + item
 * scrape fine via Firecrawl). eBay's "Item specifics" are richer than most resale
 * feeds: Condition (+ a written grade explanation), Exterior Material, Hardware Color,
 * Pattern, Style, Features, plus the seller description.
 *
 * This module owns the bits most likely to be wrong (the condition ladder + grade/detail
 * split); the Firecrawl fetch + observation assembly live in
 * supabase/ingest/sources/firecrawl-ebay.ts. NOTE: descriptions exist only for LIVE
 * listings — eBay purges them once a listing ends, so capture while active.
 *
 * Guardrail (matches the rest of the pipeline): only what the text states; unstated → null.
 */
import type { SaleCondition } from "./types";

/**
 * eBay's bag condition grades → our SaleCondition enum. eBay uses a "Pre-owned - <tier>"
 * scheme plus several New variants. Bare "Pre-owned"/"Used" (no tier) is genuinely
 * ambiguous, so it maps to null (accuracy over completeness) — the written detail is
 * still captured separately.
 */
const EBAY_CONDITION_MAP: Array<[RegExp, SaleCondition]> = [
  [/new\s+with\s+tags/i,            "new"],
  [/new\s+without\s+tags/i,         "new"],
  [/^new\b(?!.*defect)/i,           "new"],
  [/brand\s+new/i,                  "new"],
  [/pre-?owned\s*[-–:]?\s*excellent/i, "excellent"],
  [/pre-?owned\s*[-–:]?\s*very\s+good/i, "very good"],
  [/pre-?owned\s*[-–:]?\s*good/i,   "good"],
  [/pre-?owned\s*[-–:]?\s*fair/i,   "fair"],
  [/\bexcellent\b/i,                "excellent"],
  [/\bvery\s+good\b/i,              "very good"],
  [/\bfair\b/i,                     "fair"],
];

/** Map an eBay condition grade string to SaleCondition, or null when ambiguous/unknown. */
export function mapEbayCondition(grade: string | null | undefined): SaleCondition | null {
  if (!grade?.trim()) return null;
  // Only look at the grade label (before any ":" explanation) so the detail prose
  // ("...gently used but in good condition") can't flip a "Pre-owned - Fair" to good.
  const label = grade.split(":")[0].trim();
  for (const [re, val] of EBAY_CONDITION_MAP) if (re.test(label)) return val;
  return null;
}

/**
 * eBay's Condition field is often "<grade>: <explanation>", e.g.
 * "Pre-owned - Good: This item has been gently used but is in good condition…".
 * Split into the grade label and the written detail (either may be null).
 */
export function splitEbayCondition(raw: string | null | undefined): { grade: string | null; detail: string | null } {
  if (!raw?.trim()) return { grade: null, detail: null };
  // Prefer a colon; otherwise fall back to eBay's standard detail boilerplate lead-in
  // ("…Good This item has been gently used…"), which the markdown renders without a colon.
  let idx = raw.indexOf(":");
  if (idx === -1) {
    const m = raw.match(/\bThis item (?:has been|is)\b/i);
    if (m && m.index !== undefined) idx = m.index - 1;
  }
  if (idx < 0) return { grade: raw.trim(), detail: null };
  const grade = raw.slice(0, idx).replace(/[:\s]+$/, "").trim() || null;
  const detail = raw.slice(idx + 1).replace(/^[:\s]+/, "").trim() || null;
  return { grade, detail };
}

// eBay's bag "Item specifics" labels (longest-first so "Exterior Material" wins over
// "Material", "Hardware Color" over "Color"). Used as split boundaries on the markdown
// "Item specifics" section, which renders as "Label  Value  Label  Value…".
const EBAY_SPEC_LABELS = [
  "Country/Region of Manufacture", "California Prop 65 Warning", "Year Manufactured",
  "Exterior Material", "Interior Material", "Lining Material", "Exterior Color",
  "Hardware Color", "Handle/Strap Drop", "Strap Drop", "Bag Height", "Bag Width",
  "Bag Depth", "Bag Length", "Seller Notes", "Condition", "Brand", "Type", "Style",
  "Department", "Material", "Color", "Pattern", "Theme", "Features", "Character",
  "Size", "Accents", "Closure", "Occasion", "MPN", "Model", "Vintage", "Handmade",
  "Customized", "Personalize", "Item Length", "Item Width", "Item Height",
];

/**
 * Parse the "Item specifics" block out of an eBay item-page MARKDOWN scrape into a
 * label→value map. Empty values (eBay renders these as ".") become null. Returns {}
 * when no Item specifics section is present.
 */
export function parseEbayItemSpecifics(markdown: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!markdown) return out;
  const start = markdown.search(/Item specifics/i);
  if (start === -1) return out;
  // Bound the section so trailing page content can't be parsed as values.
  const rest = markdown.slice(start + "Item specifics".length);
  const endM = rest.search(/About this item|Item description|Seller assumes all responsibility|Shipping and handling/i);
  const section = endM === -1 ? rest : rest.slice(0, endM);

  const labelAlt = EBAY_SPEC_LABELS.map((l) => l.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|");
  const labelRe = new RegExp(`\\b(${labelAlt})\\b`, "g");
  const hits: { label: string; end: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(section)) !== null) hits.push({ label: m[1], start: m.index, end: m.index + m[0].length });

  for (let i = 0; i < hits.length; i++) {
    const valRaw = section.slice(hits[i].end, i + 1 < hits.length ? hits[i + 1].start : undefined);
    const val = valRaw.replace(/\s+/g, " ").trim().replace(/^[.,\s]+|[.,\s]+$/g, "").trim();
    // First occurrence wins; skip empties (eBay's ".") so a real later value isn't lost.
    if (val && !out[hits[i].label]) out[hits[i].label] = val;
  }
  return out;
}

/**
 * Return the eBay "Item specifics" section as a cleaned text blob (bounded the same way
 * as the parser). This is the per-listing fact text we store as a private reference and
 * feed to the LLM description pass — eBay's flat markdown bleeds values together, so the
 * LLM is the reliable extractor for everything except the structurally-clean Condition.
 */
export function extractEbaySpecificsSection(markdown: string | null | undefined): string | null {
  if (!markdown) return null;
  const start = markdown.search(/Item specifics/i);
  if (start === -1) return null;
  const rest = markdown.slice(start);
  const endM = rest.slice("Item specifics".length).search(/About this item|Item description|Seller assumes all responsibility|Shipping and handling/i);
  const section = (endM === -1 ? rest : rest.slice(0, endM + "Item specifics".length))
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // strip markdown links
    .replace(/[#*_>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return section.length > 20 ? section.slice(0, 1500) : null;
}

/**
 * Best-effort price from an eBay item-page markdown. Takes the first in-band
 * "US $X.XX" / "$X.XX" amount (the buy box price leads the page). Returns null if none.
 */
export function parseEbayPrice(markdown: string | null | undefined, minPrice = 1, maxPrice = 1_000_000): number | null {
  if (!markdown) return null;
  const re = /(?:US\s*)?\$\s*([\d,]+(?:\.\d{2})?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= minPrice && n <= maxPrice) return n;
  }
  return null;
}
