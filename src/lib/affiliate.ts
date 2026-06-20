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
