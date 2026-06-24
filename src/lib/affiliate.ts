/**
 * "Where to buy" resale links — the catalog's primary (passive) revenue stream.
 *
 * We don't hold specific listing URLs, so each link is a search deep-link into a
 * reseller pre-filled with the bag's brand + style. Affiliate attribution is
 * applied two optional ways, both configured via public env vars so nothing is
 * hard-coded:
 *   - A per-platform query param (e.g. an affiliate/partner code).
 *   - A network wrapper template (e.g. Skimlinks/Rakuten) via
 *     NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE, where "{url}" is the encoded target.
 *
 * With no env set, these are plain (non-monetized) search links — still useful,
 * never broken.
 */

export interface ResaleLink {
  key: string;
  name: string;
  url: string;
}

interface Platform {
  key: string;
  name: string;
  /** Builds the platform search URL for a query. */
  search: (q: string) => string;
  /** Env suffix for an optional affiliate query param, e.g. AFFILIATE_FASHIONPHILE. */
  paramEnv: string;
  /** Name of the query param the platform/affiliate code goes in. */
  paramName: string;
}

const PLATFORMS: Platform[] = [
  {
    key: "fashionphile",
    name: "Fashionphile",
    search: (q) => `https://www.fashionphile.com/shop?q=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_FASHIONPHILE",
    paramName: "aff",
  },
  {
    key: "therealreal",
    name: "The RealReal",
    search: (q) => `https://www.therealreal.com/search?keywords=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_THEREALREAL",
    paramName: "aid",
  },
  {
    key: "vestiaire",
    name: "Vestiaire Collective",
    search: (q) => `https://www.vestiairecollective.com/search/?q=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_VESTIAIRE",
    paramName: "utm_source",
  },
];

// process.env access must use static keys to be inlined for the browser, so map
// the platform env names explicitly.
const AFFILIATE_CODES: Record<string, string | undefined> = {
  NEXT_PUBLIC_AFFILIATE_FASHIONPHILE: process.env.NEXT_PUBLIC_AFFILIATE_FASHIONPHILE,
  NEXT_PUBLIC_AFFILIATE_THEREALREAL: process.env.NEXT_PUBLIC_AFFILIATE_THEREALREAL,
  NEXT_PUBLIC_AFFILIATE_VESTIAIRE: process.env.NEXT_PUBLIC_AFFILIATE_VESTIAIRE,
};

const WRAP_TEMPLATE = process.env.NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE;

function applyAffiliate(url: string, platform: Platform): string {
  const code = AFFILIATE_CODES[platform.paramEnv];
  let finalUrl = url;
  if (code) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}${platform.paramName}=${encodeURIComponent(code)}`;
  }
  if (WRAP_TEMPLATE && WRAP_TEMPLATE.includes("{url}")) {
    finalUrl = WRAP_TEMPLATE.replace("{url}", encodeURIComponent(finalUrl));
  }
  return finalUrl;
}

/**
 * Apply affiliate attribution to a SPECIFIC listing URL (not a search link), matching
 * the platform by the raw platform string we recorded. With no env set this returns the
 * URL unchanged, so a "Shop the market" offer always links straight to the seller —
 * monetization is purely additive and flips on when codes land. If we can't match a
 * known platform, the network wrap template (if any) still applies.
 */
export function affiliateListingUrl(url: string, platformRaw: string | null): string {
  if (!url) return url;
  const key = (platformRaw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const platform = PLATFORMS.find((p) => key.includes(p.key));
  if (platform) return applyAffiliate(url, platform);
  if (WRAP_TEMPLATE && WRAP_TEMPLATE.includes("{url}")) {
    return WRAP_TEMPLATE.replace("{url}", encodeURIComponent(url));
  }
  return url;
}

/** Resale search links for a bag, with affiliate attribution applied when configured. */
export function buildResaleLinks(brand: string, style: string): ResaleLink[] {
  const q = encodeURIComponent([brand, style].filter(Boolean).join(" ").trim());
  if (!q) return [];
  return PLATFORMS.map((p) => ({
    key: p.key,
    name: p.name,
    url: applyAffiliate(p.search(q), p),
  }));
}

/**
 * "Where to sell" consignment destinations — the highest-upside (consignor
 * referral) revenue stream. Mirrors the buy-side `PLATFORMS`: each entry points
 * at a reseller's sell/consign landing page and carries the same optional
 * affiliate attribution (per-platform param + wrap template), so with no env set
 * these are plain, never-broken sell links.
 *
 * `mode` lets the UI present the buyout-vs-consignment fork honestly: a "buyout"
 * destination pays cash fast; a "consign" destination lists for more, later.
 */
export interface ConsignLink extends ResaleLink {
  /** "buyout" = sell fast for cash; "consign" = list for more, paid on sale. */
  mode: "buyout" | "consign";
}

interface ConsignPlatform extends Platform {
  mode: "buyout" | "consign";
}

const CONSIGN_PLATFORMS: ConsignPlatform[] = [
  {
    key: "fashionphile",
    name: "Fashionphile",
    mode: "buyout",
    // Fashionphile leads with an instant buyout quote (cash fast).
    search: (q) => `https://www.fashionphile.com/sell?q=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_FASHIONPHILE",
    paramName: "aff",
  },
  {
    key: "therealreal",
    name: "The RealReal",
    mode: "consign",
    // TheRealReal is consignment-first (tiered commission, paid on sale).
    search: (q) => `https://www.therealreal.com/consign?keywords=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_THEREALREAL",
    paramName: "aid",
  },
  {
    key: "vestiaire",
    name: "Vestiaire Collective",
    mode: "consign",
    // Vestiaire is peer-to-peer consignment (you list, they take a cut on sale).
    search: (q) => `https://www.vestiairecollective.com/sell-online/?q=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_VESTIAIRE",
    paramName: "utm_source",
  },
];

/** Consignment/sell search links for a bag, with affiliate attribution applied when configured. */
export function buildConsignmentLinks(brand: string, style: string): ConsignLink[] {
  const q = encodeURIComponent([brand, style].filter(Boolean).join(" ").trim());
  if (!q) return [];
  return CONSIGN_PLATFORMS.map((p) => ({
    key: p.key,
    name: p.name,
    mode: p.mode,
    url: applyAffiliate(p.search(q), p),
  }));
}
