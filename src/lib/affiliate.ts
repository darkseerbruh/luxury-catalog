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
  NEXT_PUBLIC_AFFILIATE_VIVRELLE: process.env.NEXT_PUBLIC_AFFILIATE_VIVRELLE,
  NEXT_PUBLIC_AFFILIATE_RENTTHERUNWAY: process.env.NEXT_PUBLIC_AFFILIATE_RENTTHERUNWAY,
};

const WRAP_TEMPLATE = process.env.NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE;

// eBay Partner Network needs its own treatment: monetized eBay links carry a fixed
// set of tracking params plus the campaign id, not a single affiliate code. The
// campaign id is NOT a secret (it rides openly in every affiliate URL), so it lives
// in code and works out of the box on deploy — no env config required. An optional
// NEXT_PUBLIC_EBAY_CAMPAIGN_ID env var overrides it (e.g. to swap campaigns) without
// a code change.
const EBAY_CAMPAIGN_ID = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || "5339158071";
/** EPN rotation id for the US marketplace (network 711). */
const EBAY_US_ROTATION = "711-53200-19255-0";

/** True for any eBay domain (ebay.com, ebay.co.uk, …). */
export function isEbayUrl(url: string): boolean {
  try {
    return /(^|\.)ebay\.[a-z.]+$/i.test(new URL(url).hostname);
  } catch {
    return /\bebay\.[a-z.]+/i.test(url);
  }
}

/** CJ (Commission Junction) click-redirect domains. A product-feed link already
 * routes through one of these with attribution baked in, so it must never be
 * re-wrapped. */
const CJ_TRACKING_HOSTS = [
  "anrdoezrs.net", "dpbolvw.net", "tkqlhce.com", "jdoqocy.com", "kqzyfj.com",
  "emjcd.com", "ftjcfx.com", "awltovhc.com", "lduhtrp.net", "tqlkg.com", "qksrv.net",
];
export function isCjTrackingUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return CJ_TRACKING_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return CJ_TRACKING_HOSTS.some((d) => url.toLowerCase().includes(d));
  }
}

// Our CJ publisher website id (PID). NOT a secret — it rides openly in every
// affiliate URL (like the eBay campaign id). Overridable via env.
const CJ_PID = process.env.NEXT_PUBLIC_CJ_PID || "101810137";

/** True for a raw The Luxury Closet product URL (not yet CJ-tracked). */
export function isTheLuxuryClosetUrl(url: string): boolean {
  try {
    return /(^|\.)theluxurycloset\.com$/i.test(new URL(url).hostname);
  } catch {
    return /theluxurycloset\.com/i.test(url);
  }
}

/** Wrap a raw destination URL in a CJ automated deep link so the click is
 * attributed (verified: redirects to the target with a cjevent param).
 * Format: https://www.anrdoezrs.net/links/<PID>/type/dlg/<destination>. */
export function cjDeepLink(url: string): string {
  return `https://www.anrdoezrs.net/links/${CJ_PID}/type/dlg/${url}`;
}

// Awin ids for the myGemma programme (approved 2026-07-14). Neither is a secret —
// both ride openly in every Awin click URL (like the CJ PID and eBay campaign id):
// AWIN_AFFID is our publisher account (the /affiliate/<id>/ id), MYGEMMA_AWIN_MID is
// myGemma's advertiser id (the approval email's "aid"). Overridable via env.
const AWIN_AFFID = process.env.NEXT_PUBLIC_AWIN_AFFID || "2945769";
const MYGEMMA_AWIN_MID = process.env.NEXT_PUBLIC_MYGEMMA_AWIN_MID || "59483";

/** Awin click-redirect host. A link already routed through it has attribution
 * baked in, so it must never be re-wrapped. */
export function isAwinTrackingUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return /(^|\.)awin1\.com$/.test(h);
  } catch {
    return /awin1\.com/i.test(url);
  }
}

/** True for a raw myGemma product URL (not yet Awin-tracked). */
export function isMyGemmaUrl(url: string): boolean {
  try {
    return /(^|\.)mygemma\.com$/i.test(new URL(url).hostname);
  } catch {
    return /mygemma\.com/i.test(url);
  }
}

/** Wrap a raw destination URL in an Awin deep link so the click is commission-
 * tracked. Format: https://www.awin1.com/cread.php?awinmid=<MID>&awinaffid=<AFFID>
 * &ued=<encoded destination>. `ued` is URL-encoded by URLSearchParams. */
export function awinDeepLink(url: string, awinmid: string = MYGEMMA_AWIN_MID): string {
  const params = new URLSearchParams({ awinmid, awinaffid: AWIN_AFFID, ued: url });
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/**
 * Add eBay Partner Network attribution to an eBay URL (listing or search). With no
 * campaign id configured this returns the URL unchanged, so eBay links always work
 * and monetization is purely additive. `customId` (≤256 chars) is EPN's free-form
 * sub-id for our own click attribution (e.g. the bag/page it came from).
 */
export function applyEbayAffiliate(url: string, customId?: string): string {
  if (!url || !EBAY_CAMPAIGN_ID) return url;
  const params = new URLSearchParams({
    mkcid: "1", // eBay Partner Network
    mkrid: EBAY_US_ROTATION,
    siteid: "0", // US
    campid: EBAY_CAMPAIGN_ID,
    toolid: "10001",
    mkevt: "1", // link-click event
  });
  if (customId) params.set("customid", customId.slice(0, 256));
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${params.toString()}`;
}

// Amazon Associates for the care shelf (/care). The store/tracking id is NOT a
// secret — it rides openly in every affiliate URL as the `tag` param — but unlike
// eBay it is account-specific, so it stays env-configured and the channel is
// DORMANT until it lands. With no tag set, every care link is a plain Amazon
// search that still works; monetization is purely additive and self-activating on
// deploy once NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG is set.
const AMAZON_ASSOCIATES_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG;

/** True for any Amazon domain (amazon.com, amazon.co.uk, amzn.to, …). */
export function isAmazonUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return /(^|\.)amazon\.[a-z.]+$/.test(h) || /(^|\.)amzn\.(to|com)$/.test(h);
  } catch {
    return /\bamazon\.[a-z.]+|\bamzn\./i.test(url);
  }
}

/**
 * Build an Amazon SEARCH deep link for a care product, attributed to our
 * Associates tag when configured. We link searches (like "Where to buy"), not
 * held ASINs, so the live page always shows Amazon's current price and stock and
 * we never publish a price that can go stale. Returns a plain search URL when no
 * tag is set, so the link is never broken.
 */
export function amazonCareSearchUrl(query: string): string {
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  return AMAZON_ASSOCIATES_TAG
    ? `${base}&tag=${encodeURIComponent(AMAZON_ASSOCIATES_TAG)}`
    : base;
}

/** True once an Amazon Associates tag is configured (the care shelf earns). */
export function amazonAffiliateActive(): boolean {
  return Boolean(AMAZON_ASSOCIATES_TAG);
}

/**
 * Product image for a care item, when we have one. Returns null TODAY by design:
 * the care shelf ships as clean text with NO placeholder image (owner call
 * 2026-07-13: an abstract icon "means nothing", so we show nothing until we can
 * show a real product photo). This is the single seam where real photos plug in.
 *
 * The source is Amazon's Product Advertising API (PA-API). It unlocks only after
 * the account clears 3 qualifying sales in its first 180 days, and access is
 * revoked if sales lapse, so it cannot render on a pre-launch site. When it lands,
 * implement here: resolve `searchQuery` to the top product via PA-API SearchItems
 * server-side and return its image URL (cache it; PA-API is rate-limited). The
 * card already reserves the slot, and img-src permits https image hosts, so this
 * one function is the whole switch. Until then every care card renders text-only.
 */
export function careItemImageUrl(searchQuery: string): string | null {
  // No image source wired yet (PA-API is gated on approval). Touch the arg so the
  // seam stays lint-clean and future-ready; the real impl resolves it to a photo.
  void searchQuery;
  return null;
}

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
  // eBay uses EPN's multi-param scheme, not a single affiliate code — route it first.
  if (isEbayUrl(url) || (platformRaw ?? "").toLowerCase().includes("ebay")) {
    return applyEbayAffiliate(url);
  }
  // Already a CJ- or Awin-tracked deep link: attribution is baked in, return untouched.
  if (isCjTrackingUrl(url) || isAwinTrackingUrl(url)) return url;
  // Raw The Luxury Closet product URL (from the CJ API feed): wrap in a CJ deep
  // link so the click is commission-tracked.
  if (isTheLuxuryClosetUrl(url)) return cjDeepLink(url);
  // Raw myGemma product URL (from the Shopify feed): wrap in an Awin deep link.
  if (isMyGemmaUrl(url)) return awinDeepLink(url);
  const key = (platformRaw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const platform = PLATFORMS.find((p) => key.includes(p.key));
  if (platform) return applyAffiliate(url, platform);
  if (WRAP_TEMPLATE && WRAP_TEMPLATE.includes("{url}")) {
    return WRAP_TEMPLATE.replace("{url}", encodeURIComponent(url));
  }
  return url;
}

/**
 * eBay SOLD-comps search for a bag — the off-catalog fallback on the identify
 * tool. When a scanned bag isn't in our catalog (mall brands dominate thrift
 * racks), realized eBay sales are the honest comp source we can hand the user
 * in one tap. EPN attribution rides along via applyEbayAffiliate, so this link
 * monetizes from day one with no env config.
 */
export function buildEbaySoldCompsLink(
  brand: string,
  style: string,
  customId?: string
): ResaleLink | null {
  const q = [brand, style].filter(Boolean).join(" ").trim();
  if (!q) return null;
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`;
  return {
    key: "ebay-sold",
    name: "eBay sold listings",
    url: applyEbayAffiliate(url, customId),
  };
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
 * "Where to sell" consignment destinations. NOTE: there is no sell-side affiliate
 * program today (none of these resellers pay for referring sellers, as of 2026-07-11),
 * so these are plain, useful outbound links and we earn nothing on them. The affiliate
 * plumbing mirrors the buy side (per-platform param + wrap template) and is kept dormant
 * on purpose: if a program ever lands, set the platform's code and it activates, including
 * the commission disclosure (see sellLinksAffiliated). Mirrors the buy-side `PLATFORMS`.
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

/**
 * Whether the sell/consign links currently carry REAL affiliate attribution (an env
 * code is set for a consign platform, or a wrap template applies). There is no sell
 * affiliate program today, so this returns false and the UI shows no sell-commission
 * disclosure. The plumbing stays in place: set a consign platform's NEXT_PUBLIC_AFFILIATE_*
 * code (or the wrap template) the day a program lands and the disclosure activates itself.
 */
export function sellLinksAffiliated(): boolean {
  if (WRAP_TEMPLATE && WRAP_TEMPLATE.includes("{url}")) return true;
  return CONSIGN_PLATFORMS.some((p) => Boolean(AFFILIATE_CODES[p.paramEnv]));
}

/**
 * Rental — the third transaction fork (buy / sell / RENT), mapped to the "want"
 * intent ("not ready to buy? try it first"). Both players are reachable via
 * networks already held (Vivrelle on Awin; Rent the Runway on Skimlinks/FlexOffers).
 * Links work now (useful "rent it first" routing) and pick up affiliate attribution
 * when the codes land, exactly like buy/sell. URLs are best-effort search deep-links;
 * verify the exact format against each affiliate dashboard once approved.
 */
interface RentalPlatform extends Platform {
  /** Short model note for the UI (e.g. how the rental works). */
  note: string;
}

const RENTAL_PLATFORMS: RentalPlatform[] = [
  {
    key: "vivrelle",
    name: "Vivrelle",
    note: "membership",
    search: (q) => `https://vivrelle.com/search?q=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_VIVRELLE",
    paramName: "utm_source",
  },
  {
    key: "renttherunway",
    name: "Rent the Runway",
    note: "membership + single rentals",
    search: (q) => `https://www.renttherunway.com/search?query=${q}`,
    paramEnv: "NEXT_PUBLIC_AFFILIATE_RENTTHERUNWAY",
    paramName: "utm_source",
  },
];

export interface RentalLink extends ResaleLink {
  note: string;
}

/** Rental search links for a bag, with affiliate attribution applied when configured. */
export function buildRentalLinks(brand: string, style: string): RentalLink[] {
  const q = encodeURIComponent([brand, style].filter(Boolean).join(" ").trim());
  if (!q) return [];
  return RENTAL_PLATFORMS.map((p) => ({
    key: p.key,
    name: p.name,
    note: p.note,
    url: applyAffiliate(p.search(q), p),
  }));
}
