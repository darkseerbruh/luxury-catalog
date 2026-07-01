/**
 * Source-agnostic fact extraction from a resale listing DESCRIPTION (Fashionphile
 * body_html, TheRealReal description, eBay seller text…). Resale descriptions carry
 * facts the structured feed fields don't — strap/closure/interior construction,
 * pattern, hardware finish, measurements, date-code presence, and often a colour or
 * condition the feed left null. This pulls those out as STRUCTURED FACTS; the prose
 * itself is never the product.
 *
 * Two companions live alongside this:
 *  - scrubPii(): strips emails / phones / off-platform URLs before any raw description
 *    is stored as a private reference (eBay seller text can carry contact info).
 *  - the LLM pass (enrich.ts) handles the messy free-text eBay cases regex can't.
 *
 * Guardrail (matches enrich.ts): extract ONLY what the text states. Unstated → null.
 * Pure + unit-tested; no network, no DB.
 */

export interface DescriptionFacts {
  /** Colour stated in the description (fallback when the feed field was null). */
  color: string | null;
  /** Surface pattern/print, e.g. "monogram", "dandelion print". */
  pattern: string | null;
  /** Strap description, e.g. "adjustable leather shoulder strap". */
  strap_type: string | null;
  /** Closure mechanism, e.g. "turn-lock", "snap lock", "top zipper". */
  closure: string | null;
  /** Interior lining material, e.g. "leather", "microfiber", "fabric". */
  interior_material: string | null;
  /** Hardware finish (distinct from colour), e.g. "aged gold", "shiny", "matte". */
  hardware_finish: string | null;
  /** Exterior dimensions verbatim from the text, e.g. `10" x 8" x 4"`. */
  measurements: string | null;
  /** True when the text references a date code / serial / authenticity number. */
  has_date_code: boolean;
}

export const EMPTY_DESCRIPTION_FACTS: DescriptionFacts = {
  color: null, pattern: null, strap_type: null, closure: null,
  interior_material: null, hardware_finish: null, measurements: null, has_date_code: false,
};

// Colours the templated "…in <Colour>." phrasing uses. Kept local + small on purpose;
// the adapter parsers own the fuller vocab — this is only the description fallback.
const COLORS = [
  "Dark Brown", "Dark Green", "Dark Blue", "Light Pink", "Rose Gold", "Light Blue",
  "Black", "White", "Beige", "Brown", "Red", "Blue", "Navy", "Pink", "Green",
  "Grey", "Gray", "Burgundy", "Purple", "Yellow", "Orange", "Tan", "Khaki", "Cream",
  "Ivory", "Bordeaux", "Nude", "Taupe", "Multicolor",
];

const PATTERNS = [
  "Monogram", "Damier Ebene", "Damier Azur", "Damier", "GG Supreme", "Matelassé",
  "Matelasse", "Cannage", "Chevron", "Herringbone", "Houndstooth", "Floral",
  "Dandelion Print", "Python", "Croc", "Polka Dot", "Striped", "Plaid", "Quilted",
];

const CLOSURES = [
  "turn-lock", "turnlock", "twist lock", "push lock", "snap lock", "magnetic snap",
  "magnetic closure", "kiss-lock", "kisslock", "drawstring", "flap closure",
  "top zipper", "zip closure", "buckle closure", "toggle closure", "clasp",
];

const HARDWARE_FINISHES = [
  "aged gold", "shiny gold", "matte gold", "brushed gold", "antique gold",
  "aged silver", "shiny silver", "matte silver", "brushed", "polished", "ruthenium",
];

/** First case-insensitive whole-phrase hit from `list` in `text`, returned canonical. */
function firstHit(text: string, list: string[]): string | null {
  for (const term of list) {
    if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) return term;
  }
  return null;
}

/** Extract structured facts from a description's plain text (HTML already stripped). */
export function extractDescriptionFacts(text: string | null | undefined): DescriptionFacts {
  const facts: DescriptionFacts = { ...EMPTY_DESCRIPTION_FACTS };
  if (!text?.trim()) return facts;
  const t = text.replace(/&amp;/g, "&").replace(/\s+/g, " ");

  // Colour: ONLY the explicit "…in <Colour>" phrasing (high precision), since this
  // value backfills a null field — a loose first-token scan guesses wrong too often
  // ("beige interior" on a pink bag), and a wrong backfill is worse than null.
  const inColor = t.match(/\bin\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  if (inColor) facts.color = COLORS.find((c) => c.toLowerCase() === inColor[1].toLowerCase()) ?? null;

  facts.pattern = firstHit(t, PATTERNS);
  facts.closure = firstHit(t, CLOSURES);
  facts.hardware_finish = firstHit(t, HARDWARE_FINISHES);

  // Strap: capture the noun phrase ending in "strap" (e.g. "adjustable leather shoulder strap").
  const strap = t.match(/\b((?:[A-Za-z-]+\s){1,4}strap)\b/i);
  if (strap) facts.strap_type = strap[1].trim().toLowerCase();

  // Interior lining material: "<material> interior" / "<material> lining".
  const interior = t.match(/\b(leather|microfiber|fabric|canvas|suede|textile|nylon|satin)\s+(?:interior|lining)\b/i);
  if (interior) facts.interior_material = interior[1].toLowerCase();

  // Measurements: a dimension run like 10" x 8" x 4"  or  10.5 x 8 x 4 in/cm.
  const dims = t.match(/\b\d{1,2}(?:\.\d)?\s*("|''|in\.?|inches|cm)?\s*[x×]\s*\d{1,2}(?:\.\d)?\s*("|''|in\.?|inches|cm)?\s*(?:[x×]\s*\d{1,2}(?:\.\d)?\s*("|''|in\.?|inches|cm)?)?/i);
  if (dims) facts.measurements = dims[0].replace(/\s+/g, " ").trim();

  facts.has_date_code = /\b(date\s?code|serial\s?(?:number|no)|authenticity\s?(?:code|number))\b/i.test(t);

  return facts;
}

// ---------------------------------------------------------------------------
// PII scrubbing — applied before any raw description is stored as a reference.
// ---------------------------------------------------------------------------

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Phone: 7+ digit runs allowing spaces / dashes / dots / parens (US + intl-ish).
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
// "text/call/whatsapp/dm me" off-platform solicitation lead-ins.
const CONTACT_LEAD_RE = /\b(text|call|whatsapp|dm|message|email|contact)\s+me\b[^.]*/gi;

/**
 * Remove personal / off-platform contact info from listing text before storing it as
 * a private reference. Conservative: redacts to "[redacted]" rather than dropping, so
 * the surrounding factual sentence stays intact for later fact-mining.
 */
export function scrubPii(text: string | null | undefined): string | null {
  if (!text) return null;
  const scrubbed = text
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(URL_RE, "[redacted-url]")
    .replace(CONTACT_LEAD_RE, "[redacted-contact]")
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[redacted-phone]" : m));
  return scrubbed.trim() || null;
}
