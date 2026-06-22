/**
 * Pure price-text extraction. Resale/auction/archived pages render prices as
 * "$3,450", "USD 3,450.00", "€2.900", etc. These helpers pull a normalised
 * numeric amount + currency out of free text so adapters don't each reinvent it.
 * No IO — unit-tested in src/lib/__tests__.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
};

const CURRENCY_CODES = new Set(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "HKD", "CNY"]);

export interface ExtractedPrice {
  amount: number;
  currency: string;
}

/**
 * Parse a money substring like "$3,450.00" / "USD 3,450" / "2.900 €" into
 * { amount, currency }. Handles US (1,234.56) and EU (1.234,56) grouping.
 * Returns null if no plausible amount is found.
 */
export function parsePrice(text: string, defaultCurrency = "USD"): ExtractedPrice | null {
  if (!text) return null;
  const t = text.trim();

  let currency = defaultCurrency;
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (t.includes(sym)) {
      currency = code;
      break;
    }
  }
  const codeMatch = t.toUpperCase().match(/\b([A-Z]{3})\b/);
  if (codeMatch && CURRENCY_CODES.has(codeMatch[1])) currency = codeMatch[1];

  // Grab the first number-with-separators run.
  const numMatch = t.match(/\d[\d.,\s]*\d|\d/);
  if (!numMatch) return null;
  const amount = normaliseAmount(numMatch[0]);
  if (amount == null || amount <= 0) return null;

  return { amount, currency };
}

/** Convert a grouped numeric string to a number, inferring US vs EU separators. */
export function normaliseAmount(raw: string): number | null {
  let s = raw.replace(/\s/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Whichever comes last is the decimal separator.
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", "."); // EU: 1.234,56
    } else {
      s = s.replace(/,/g, ""); // US: 1,234.56
    }
  } else if (lastComma !== -1) {
    // Only commas: decimal if exactly 2 trailing digits, else thousands.
    s = /,\d{2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot !== -1) {
    // Only dots: thousands if grouped in 3s (e.g. 2.900 / 1.234.000), else decimal.
    const afterDot = s.slice(lastDot + 1);
    if (afterDot.length === 3 && (s.match(/\./g) || []).length >= 1 && !/\.\d{1,2}$/.test(s)) {
      s = s.replace(/\./g, "");
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Pull every distinct money amount from a blob (e.g. a listing grid). */
export function parseAllPrices(text: string, defaultCurrency = "USD"): ExtractedPrice[] {
  const out: ExtractedPrice[] = [];
  const re = /(?:[$€£¥]|\b[A-Z]{3}\b)\s?\d[\d.,\s]*\d/g;
  for (const m of text.match(re) ?? []) {
    const p = parsePrice(m, defaultCurrency);
    if (p) out.push(p);
  }
  return out;
}
