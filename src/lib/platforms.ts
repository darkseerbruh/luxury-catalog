/**
 * Per-platform trust + cost model. "Best price" is dishonest without two things
 * the sticker hides: (1) what you actually pay (shipping, buyer's premium,
 * protection fees — sales tax varies by state so it's noted, not computed), and
 * (2) whether the source authenticates / lets you return (a fake or final-sale
 * bargain isn't a bargain). Lets the UI weight "best value" by trust, not price.
 *
 * Figures are honest ESTIMATES and change — tune as programs update. Pure, no IO.
 */

export type AuthLevel = "all" | "optional" | "varies" | "auction-house";

export interface PlatformInfo {
  key: string;
  label: string;
  /** How the platform handles authentication. */
  authenticates: AuthLevel;
  authNote: string;
  returns: string;
  /** Auction buyer's premium (fraction of hammer); 0 for fixed-price resale. */
  buyerPremiumPct: number;
  /** Buyer protection fee as a fraction of price (e.g. Vestiaire). */
  buyerProtectionPct: number;
  /** Typical buyer-paid shipping in USD (0 = usually free). */
  typicalShippingUsd: number;
}

export const PLATFORMS: Record<string, PlatformInfo> = {
  fashionphile: {
    key: "fashionphile", label: "Fashionphile", authenticates: "all",
    authNote: "Authenticates every item in-house",
    returns: "30-day returns (refund or credit)",
    buyerPremiumPct: 0, buyerProtectionPct: 0, typicalShippingUsd: 0,
  },
  therealreal: {
    key: "therealreal", label: "The RealReal", authenticates: "all",
    authNote: "Brand-authenticated by in-house experts",
    returns: "Returns for site credit (some items final sale)",
    buyerPremiumPct: 0, buyerProtectionPct: 0, typicalShippingUsd: 0,
  },
  vestiaire: {
    key: "vestiaire", label: "Vestiaire Collective", authenticates: "optional",
    authNote: "Physical authentication available (sometimes included on high-value)",
    returns: "Limited — final sale unless not as described",
    buyerPremiumPct: 0, buyerProtectionPct: 0.1, typicalShippingUsd: 15,
  },
  ebay: {
    key: "ebay", label: "eBay", authenticates: "varies",
    authNote: "Authenticity Guarantee on eligible bags (typically >$500)",
    returns: "Varies by seller; eBay Money Back Guarantee",
    buyerPremiumPct: 0, buyerProtectionPct: 0, typicalShippingUsd: 0,
  },
  auction: {
    key: "auction", label: "Auction house", authenticates: "auction-house",
    authNote: "Specialist-vetted; lot condition reports",
    returns: "Final sale",
    buyerPremiumPct: 0.26, buyerProtectionPct: 0, typicalShippingUsd: 60,
  },
};

export interface LandedCost {
  price: number;
  buyerPremium: number;
  buyerProtection: number;
  shipping: number;
  total: number;
  excludesSalesTax: true;
}

/**
 * Estimate all-in cost for a sticker price on a platform (excludes state sales
 * tax, which varies). Returns the breakdown so the UI can be transparent.
 */
export function estimateLandedCost(price: number, platformKey: string): LandedCost {
  const p = PLATFORMS[platformKey];
  const buyerPremium = p ? Math.round(price * p.buyerPremiumPct) : 0;
  const buyerProtection = p ? Math.round(price * p.buyerProtectionPct) : 0;
  const shipping = p ? p.typicalShippingUsd : 0;
  return {
    price,
    buyerPremium,
    buyerProtection,
    shipping,
    total: price + buyerPremium + buyerProtection + shipping,
    excludesSalesTax: true,
  };
}
