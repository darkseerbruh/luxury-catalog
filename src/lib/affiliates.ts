/**
 * Affiliate / consignor link construction — implements the marketing plan's
 * Decision 3: capture the buyer at the decision point AND route sellers through
 * higher-paying consignor-referral programs, diversified across platforms so no
 * single rate change guts revenue (docs/marketing-plan.md).
 *
 * Real affiliate IDs are injected from env vars once the operator is approved
 * into each program. Until then the links still work (plain deep links); they
 * just aren't yet attributed. All outbound links must render rel="sponsored
 * nofollow".
 */
export interface OutboundLink {
  reseller: string;
  url: string;
}

interface ResellerConfig {
  name: string;
  /** search/deep link for a buyer, given a query string */
  buy: (q: string) => string;
  /** consignor / sell landing page */
  sell: string;
  /** env var holding the affiliate tag; appended as ?aff= when present */
  tagEnv: string;
}

const RESELLERS: ResellerConfig[] = [
  {
    name: "The RealReal",
    buy: (q) => `https://www.therealreal.com/search?keywords=${q}`,
    sell: "https://www.therealreal.com/consign",
    tagEnv: "NEXT_PUBLIC_AFF_THEREALREAL",
  },
  {
    name: "Fashionphile",
    buy: (q) => `https://www.fashionphile.com/shop?q=${q}`,
    sell: "https://www.fashionphile.com/sell",
    tagEnv: "NEXT_PUBLIC_AFF_FASHIONPHILE",
  },
  {
    name: "Vestiaire Collective",
    buy: (q) => `https://www.vestiairecollective.com/search/?q=${q}`,
    sell: "https://www.vestiairecollective.com/sell/",
    tagEnv: "NEXT_PUBLIC_AFF_VESTIAIRE",
  },
  {
    name: "Rebag",
    buy: (q) => `https://www.rebag.com/search/?q=${q}`,
    sell: "https://www.rebag.com/sell/",
    tagEnv: "NEXT_PUBLIC_AFF_REBAG",
  },
];

function withTag(url: string, tagEnv: string): string {
  const tag = process.env[tagEnv];
  if (!tag) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}aff=${encodeURIComponent(tag)}`;
}

/** "Where to buy" links for a given bag. */
export function buyLinks(brand: string, style: string): OutboundLink[] {
  const q = encodeURIComponent(`${brand} ${style}`.trim());
  return RESELLERS.map((r) => ({ reseller: r.name, url: withTag(r.buy(q), r.tagEnv) }));
}

/** "Where to sell what you found" consignor-referral links. */
export function sellLinks(): OutboundLink[] {
  return RESELLERS.map((r) => ({ reseller: r.name, url: withTag(r.sell, r.tagEnv) }));
}
