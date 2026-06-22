/**
 * Pure helpers for the Internet Archive Wayback CDX Server API
 * (docs/data-sourcing-research.md §3.4). Build a CDX query, parse the JSON
 * response into captures, derive snapshot URLs, and convert the 14-digit
 * timestamp to an ISO date. No IO — the fetching lives in
 * supabase/ingest/sources/wayback.ts.
 */

const CDX_ENDPOINT = "http://web.archive.org/cdx/search/cdx";

export interface CdxQueryOptions {
  /** "prefix" matches all URLs under the path; "exact" only the URL itself. */
  matchType?: "exact" | "prefix" | "domain";
  /** Collapse to ~1 capture per timestamp prefix length (10 = hourly, 6 = monthly, 4 = yearly). */
  collapseTimestamp?: number;
  /** Only 200 OK captures by default (filter out errors/redirects). */
  onlyOk?: boolean;
  limit?: number;
}

/** Build a CDX Server API query URL returning JSON. */
export function cdxQueryUrl(url: string, opts: CdxQueryOptions = {}): string {
  const params = new URLSearchParams({ url, output: "json" });
  if (opts.matchType) params.set("matchType", opts.matchType);
  if (opts.collapseTimestamp) params.set("collapse", `timestamp:${opts.collapseTimestamp}`);
  if (opts.onlyOk !== false) params.set("filter", "statuscode:200");
  if (opts.limit) params.set("limit", String(opts.limit));
  return `${CDX_ENDPOINT}?${params.toString()}`;
}

export interface CdxCapture {
  timestamp: string; // 14-digit YYYYMMDDhhmmss
  original: string; // original captured URL
  statuscode: string;
  /** Replay URL that returns the raw archived bytes (the `id_` flag = no IA chrome). */
  snapshotUrl: string;
  /** ISO date (YYYY-MM-DD) of the capture. */
  date: string;
}

/**
 * Parse a CDX JSON response. The first array is the header row; remaining rows
 * are captures. Tolerates the header naming the columns in any order.
 */
export function parseCdxResponse(json: unknown): CdxCapture[] {
  if (!Array.isArray(json) || json.length < 2) return [];
  const header = (json[0] as string[]).map((h) => h.toLowerCase());
  const tsIdx = header.indexOf("timestamp");
  const origIdx = header.indexOf("original");
  const codeIdx = header.indexOf("statuscode");
  if (tsIdx === -1 || origIdx === -1) return [];

  const out: CdxCapture[] = [];
  for (let i = 1; i < json.length; i++) {
    const row = json[i] as string[];
    const timestamp = row[tsIdx];
    const original = row[origIdx];
    if (!timestamp || !original) continue;
    out.push({
      timestamp,
      original,
      statuscode: codeIdx === -1 ? "" : row[codeIdx] ?? "",
      snapshotUrl: snapshotUrl(timestamp, original),
      date: waybackTimestampToDate(timestamp),
    });
  }
  return out;
}

/** Build the raw-bytes replay URL for a capture. */
export function snapshotUrl(timestamp: string, original: string): string {
  return `http://web.archive.org/web/${timestamp}id_/${original}`;
}

/** "20120514031245" -> "2012-05-14". Returns "" for malformed input. */
export function waybackTimestampToDate(ts: string): string {
  if (!/^\d{8}/.test(ts)) return "";
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

/** Host + path of a URL, lowercased, with the query string dropped. */
export function urlPathKey(url: string): string {
  const noQuery = url.split("?")[0].split("#")[0];
  return noQuery.replace(/^https?:\/\//i, "").toLowerCase();
}

/**
 * Keep only captures whose URL PATH (query string ignored) contains every
 * keyword — picks the per-product archived pages for a style out of a domain-wide
 * capture list. Matching the path, not the query, avoids false positives from
 * marketing UTM params (e.g. a homepage tagged `?utm_content=chanel-flap-guide`).
 */
export function filterCapturesByKeywords(captures: CdxCapture[], keywords: string[]): CdxCapture[] {
  const kw = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  if (kw.length === 0) return captures;
  return captures.filter((c) => {
    const key = urlPathKey(c.original);
    return kw.every((k) => key.includes(k));
  });
}

/**
 * Keep at most one capture per calendar year (the earliest in each year), so a
 * 20-year backfill stays a couple-dozen fetches rather than thousands.
 */
export function oneCapturePerYear(captures: CdxCapture[]): CdxCapture[] {
  const byYear = new Map<string, CdxCapture>();
  for (const c of captures) {
    const year = c.date.slice(0, 4);
    if (!year) continue;
    const existing = byYear.get(year);
    if (!existing || c.timestamp < existing.timestamp) byYear.set(year, c);
  }
  return [...byYear.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
