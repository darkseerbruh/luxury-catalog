/**
 * Minimal, dependency-free HTML helpers for the ingestion adapters. Strip markup
 * to readable text (so price/date extraction works on archived or live pages
 * without a heavyweight DOM lib) and detect a date near some text. Pure +
 * unit-tested; the network fetch lives in supabase/ingest/lib/fetch.ts.
 */

/** Strip tags/scripts/styles and decode the few entities that matter for prices. */
export function stripTags(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&euro;/gi, "€")
    .replace(/&pound;/gi, "£")
    .replace(/&#36;/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  jan: "01", feb: "02", mar: "03", apr: "04", jun: "06", jul: "07", aug: "08",
  sep: "09", sept: "09", oct: "10", nov: "11", dec: "12",
};

/**
 * Best-effort extraction of an ISO date from text. Handles "May 14, 2012",
 * "14 May 2012", "2012-05-14", and "05/14/2012". Returns null if none found.
 */
export function extractDate(text: string): string | null {
  if (!text) return null;
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const mdy = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (mdy && MONTHS[mdy[1].toLowerCase()]) {
    return `${mdy[3]}-${MONTHS[mdy[1].toLowerCase()]}-${mdy[2].padStart(2, "0")}`;
  }
  const dmy = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/);
  if (dmy && MONTHS[dmy[2].toLowerCase()]) {
    return `${dmy[3]}-${MONTHS[dmy[2].toLowerCase()]}-${dmy[1].padStart(2, "0")}`;
  }
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) return `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
  return null;
}
