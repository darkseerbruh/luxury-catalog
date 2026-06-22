/**
 * Pure helpers for the eBay Browse API adapter (current resale listing prices —
 * docs/data-sourcing-research.md §3.2). Build the search URL, parse the
 * item_summary response, and map eBay's condition strings to our sale_condition
 * enum. No network/secrets here — the OAuth + fetch live in
 * supabase/ingest/sources/ebay.ts. Unit-tested in src/lib/__tests__.
 *
 * Browse returns ACTIVE listings (asking prices) → price_type 'listed'. Realized
 * sold prices need the gated Marketplace Insights API (separate, later).
 */
import type { SaleCondition } from "./types";

export const EBAY_BROWSE_ENDPOINT =
  "https://api.ebay.com/buy/browse/v1/item_summary/search";
export const EBAY_OAUTH_ENDPOINT = "https://api.ebay.com/identity/v1/oauth2/token";
/** eBay "Women's Bags & Handbags" leaf category — narrows out unrelated hits. */
export const EBAY_HANDBAG_CATEGORY = "169291";

export interface BrowseSearchOptions {
  limit?: number;
  categoryIds?: string;
  /** Inclusive price band in the marketplace currency, filters noise. */
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
}

/** Build a Browse item_summary search URL with an optional price/category filter. */
export function buildBrowseSearchUrl(query: string, opts: BrowseSearchOptions = {}): string {
  const params = new URLSearchParams({ q: query, limit: String(opts.limit ?? 50) });
  if (opts.categoryIds) params.set("category_ids", opts.categoryIds);
  const filters: string[] = [];
  if (opts.minPrice != null || opts.maxPrice != null) {
    filters.push(`price:[${opts.minPrice ?? ""}..${opts.maxPrice ?? ""}]`);
    filters.push(`priceCurrency:${opts.currency ?? "USD"}`);
  }
  if (filters.length) params.set("filter", filters.join(","));
  return `${EBAY_BROWSE_ENDPOINT}?${params.toString()}`;
}

export interface EbayItem {
  title: string;
  price: number;
  currency: string;
  condition: SaleCondition | null;
  url: string;
  itemId: string | null;
}

/** Map eBay's free-text condition to our resale grade (unknowns → null). */
export function normalizeEbayCondition(raw: string | null | undefined): SaleCondition | null {
  if (!raw) return null;
  const c = raw.toLowerCase();
  if (c.includes("new")) return "new";
  if (c.includes("excellent")) return "excellent";
  if (c.includes("very good")) return "very good";
  if (c.includes("pre-owned") || c.includes("preowned") || c.includes("used") || c.includes("good"))
    return "good";
  return null;
}

/**
 * Parse a Browse item_summary/search response into normalised items, keeping
 * only rows with a usable numeric price and a listing URL.
 */
export function parseBrowseItems(json: unknown): EbayItem[] {
  const summaries = (json as { itemSummaries?: unknown[] })?.itemSummaries;
  if (!Array.isArray(summaries)) return [];
  const out: EbayItem[] = [];
  for (const raw of summaries) {
    const it = raw as {
      title?: string;
      price?: { value?: string | number; currency?: string };
      condition?: string;
      itemWebUrl?: string;
      itemId?: string;
    };
    const value = it.price?.value != null ? Number(it.price.value) : NaN;
    const url = it.itemWebUrl;
    if (!Number.isFinite(value) || value <= 0 || !url) continue;
    out.push({
      title: it.title ?? "",
      price: value,
      currency: it.price?.currency ?? "USD",
      condition: normalizeEbayCondition(it.condition),
      url,
      itemId: it.itemId ?? null,
    });
  }
  return out;
}
