/**
 * Where to Buy — the venue trust registry behind /where-to-buy.
 *
 * Positioning (docs/ux/where-to-buy-spec.md): we don't judge, we equip. Every
 * factual cell carries the venue's own published source + the date we checked
 * it; a cell without a source renders "not yet verified", never a guess. The
 * tier is OUR TAKE (an informed opinion, framed as one), never a verdict.
 *
 * Cost math stays in platforms.ts (estimateLandedCost); this registry covers
 * protection: authentication, returns, fake remedy, payment rails, and the
 * remedy library for closing a venue's gaps yourself. Pure, no IO.
 */

export type VenueCategory = "consignor" | "marketplace" | "p2p";
export type AuthType = "physical-all" | "physical-threshold" | "photo-optional" | "none";
export type TrustTier = "protected" | "know-the-gaps" | "on-your-own";

/** A sourced, dated claim. The bar: no source + date, no cell. */
export interface Fact {
  claim: string;
  sourceUrl: string;
  /** ISO date we last confirmed the claim on the venue's own page. */
  checkedAt: string;
}

export type GapKey = "authentication" | "payment" | "returns" | "unknown-seller";

export interface VenueProfile {
  slug: string;
  label: string;
  category: VenueCategory;
  /** Matches the platforms.ts key when the venue exists there (landed cost). */
  platformKey?: string;
  authentication: {
    type: AuthType;
    /** For physical-threshold: physical inspection starts at this price. */
    thresholdUsd?: number;
    fact: Fact;
  };
  returns: {
    /** Days to start a return/case; null = no standard window. */
    windowDays: number | null;
    detail: string;
    fact: Fact;
  };
  /** What the venue does if an item is proven inauthentic. */
  fakeRemedy: { detail: string; fact: Fact } | null;
  /** Whether money moves through a rail with documented dispute rights. */
  paymentProtection: { covered: boolean; detail: string; fact: Fact };
  /** Our take: opinion, not a verdict. The blurb says why in one line. */
  ourTake: { tier: TrustTier; blurb: string };
  /** Which self-protection remedies apply when buying here. */
  gaps: GapKey[];
}

export const TIER_LABELS: Record<TrustTier, string> = {
  protected: "Protected",
  "know-the-gaps": "Know the gaps",
  "on-your-own": "You're on your own",
};

export const CATEGORY_LABELS: Record<VenueCategory, { title: string; note: string }> = {
  consignor: {
    title: "Consignors",
    note: "The company holds the item and ships it to you.",
  },
  marketplace: {
    title: "Marketplaces",
    note: "A seller ships it to you; the platform sits in the middle.",
  },
  p2p: {
    title: "Person to person",
    note: "You deal with the seller directly. The venue mostly steps back.",
  },
};

const CHECKED = "2026-07-09";

export const VENUES: VenueProfile[] = [
  {
    slug: "fashionphile",
    label: "Fashionphile",
    category: "consignor",
    platformKey: "fashionphile",
    authentication: {
      type: "physical-all",
      fact: {
        claim: "Guarantees the authenticity of every item it sells, backed by a lifetime guarantee.",
        sourceUrl: "https://www.fashionphile.com/pages/authenticity",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: 15,
      detail: "Eligible returns within 15 days of delivery.",
      fact: {
        claim: "Accepts eligible returns within fifteen (15) days of the order delivery date.",
        sourceUrl: "https://help.fashionphile.com/s/returns",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Lifetime return with full refund if an item proves non-authentic.",
      fact: {
        claim: "Offers a lifetime return policy should any item it sells prove non-authentic.",
        sourceUrl:
          "https://help.fashionphile.com/s/article/Is-there-a-money-back-guarantee-if-an-item-turns-out-to-be-fake",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "You pay the platform at checkout, with card dispute rights on top.",
      fact: {
        claim: "Purchases run through Fashionphile's own checkout.",
        sourceUrl: "https://www.fashionphile.com",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "protected",
      blurb: "Every item physically checked before sale, a real return window, and a lifetime authenticity remedy.",
    },
    gaps: [],
  },
  {
    slug: "therealreal",
    label: "The RealReal",
    category: "consignor",
    platformKey: "therealreal",
    authentication: {
      type: "physical-all",
      fact: {
        claim: "States it physically examines every item as part of its authentication process.",
        sourceUrl: "https://www.therealreal.com/authentication",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: null,
      detail:
        "Handbags are final sale as a category, at any price. The one exception is a bag The RealReal itself described incorrectly, which routes through customer service.",
      fact: {
        claim:
          "Handbags, swimwear, luggage, beauty, items sold at 40% off or more, and items listed As Is are final sale and not eligible for return; the sole exception is an item The RealReal identifies as incorrectly described.",
        sourceUrl: "https://www.therealreal.com/returns",
        checkedAt: "2026-07-11",
      },
    },
    fakeRemedy: {
      detail: "Authenticity claims are handled through its buyer support process.",
      fact: {
        claim: "Publishes a brand-specific authentication process combining experts with AI tooling.",
        sourceUrl: "https://www.therealreal.com/faq",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "You pay the platform at checkout, with card dispute rights on top.",
      fact: {
        claim: "Purchases run through The RealReal's own checkout.",
        sourceUrl: "https://www.therealreal.com",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "know-the-gaps",
      blurb: "Strong authentication, but know this before you tap buy: handbags are final sale.",
    },
    gaps: ["returns"],
  },
  {
    slug: "rebag",
    label: "Rebag",
    category: "consignor",
    authentication: {
      type: "physical-all",
      fact: {
        claim: "States it only accepts fully authentic products, vetted by its team of experts.",
        sourceUrl: "https://www.rebag.com/terms/",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: 5,
      detail: "5-day standard window. Outlet items are final sale.",
      fact: {
        claim: "Standard returns run 5 days; items sold in Outlet condition are final sale.",
        sourceUrl: "https://www.rebag.com/terms/",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Authentication disputes are handled under its terms of service.",
      fact: {
        claim: "Terms address handling when a product is deemed unauthentic.",
        sourceUrl: "https://www.rebag.com/terms/",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "You pay the platform at checkout, with card dispute rights on top.",
      fact: {
        claim: "Purchases run through Rebag's own checkout.",
        sourceUrl: "https://www.rebag.com",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "protected",
      blurb: "Expert-checked inventory. The 5-day window is short, so inspect fast.",
    },
    gaps: [],
  },
  {
    slug: "vestiaire",
    label: "Vestiaire Collective",
    category: "marketplace",
    platformKey: "vestiaire",
    authentication: {
      type: "photo-optional",
      fact: {
        claim: "Authentication and examination services exist with costs addressed in its buyer terms; not every order is physically checked.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/8977898341905-Buyer-Terms-Conditions",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: null,
      detail: "Largely final sale unless the item is not as described.",
      fact: {
        claim: "Buyer service fee typically ranges between 5% and 28% of the item price.",
        sourceUrl:
          "https://faq.vestiairecollective.com/hc/en-us/articles/18378951869585-Buyer-What-is-the-Buyer-Service-Fee",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Not-as-described claims run through its buyer service process.",
      fact: {
        claim: "Buyer terms set out the process for authentication issues and claims.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/8977898341905-Buyer-Terms-Conditions",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "You pay the platform at checkout; a buyer service fee applies.",
      fact: {
        claim: "Payments run through Vestiaire's checkout with a disclosed buyer service fee.",
        sourceUrl:
          "https://faq.vestiairecollective.com/hc/en-us/articles/18378951869585-Buyer-What-is-the-Buyer-Service-Fee",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "know-the-gaps",
      blurb: "Good marketplace bones, but check whether YOUR order gets a physical check, and price in the buyer fee.",
    },
    gaps: ["authentication", "returns"],
  },
  {
    slug: "theluxurycloset",
    label: "The Luxury Closet",
    category: "consignor",
    platformKey: "theluxurycloset",
    authentication: {
      type: "physical-all",
      fact: {
        claim: "Sells with a lifetime authenticity guarantee; items are evaluated before listing.",
        sourceUrl: "https://theluxurycloset.com/pages/authenticity",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: 3,
      detail: "3-day return policy from delivery.",
      fact: {
        claim: "Publishes a 3-day return policy.",
        sourceUrl: "https://theluxurycloset.com/pages/delivery-and-returns",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Lifetime authenticity guarantee with refund if an item is proven inauthentic.",
      fact: {
        claim: "States buyers are protected by a lifetime authenticity guarantee.",
        sourceUrl: "https://theluxurycloset.com/pages/delivery-and-returns",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "You pay the platform at checkout, with card dispute rights on top.",
      fact: {
        claim: "Purchases run through The Luxury Closet's own checkout.",
        sourceUrl: "https://theluxurycloset.com",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "protected",
      blurb: "Authenticated inventory and a lifetime remedy, but the 3-day window means inspect the day it arrives.",
    },
    gaps: [],
  },
  {
    slug: "ebay",
    label: "eBay",
    category: "marketplace",
    platformKey: "ebay",
    authentication: {
      type: "physical-threshold",
      thresholdUsd: 500,
      fact: {
        claim: "Authenticity Guarantee physically inspects eligible-brand handbags listed or sold at $500 or more before the buyer receives them; $200 to $499.99 has an optional paid add-on.",
        sourceUrl: "https://www.ebay.com/help/selling/selling-tools/ebay-authenticity-guarantee?id=4644",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: null,
      detail: "Return terms vary by seller; the Money Back Guarantee covers items that never arrive or don't match the listing.",
      fact: {
        claim: "Seller return policies vary; eBay Money Back Guarantee applies to eligible orders.",
        sourceUrl: "https://www.ebay.com/help/buying/buying-authenticity-guarantee/buying-authenticity-guarantee?id=5470",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Money Back Guarantee case for not-as-described items; inspected orders carry the Authenticity Guarantee.",
      fact: {
        claim: "Authenticity Guarantee items are inspected by experts before shipping to the buyer.",
        sourceUrl: "https://www.ebay.com/help/selling/selling-tools/ebay-authenticity-guarantee?id=4644",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "Pay through eBay checkout only. Off-platform payment forfeits every protection.",
      fact: {
        claim: "eBay Money Back Guarantee applies to purchases completed through eBay checkout.",
        sourceUrl: "https://www.ebay.com/help/buying/buying-authenticity-guarantee/buying-authenticity-guarantee?id=5470",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "know-the-gaps",
      blurb: "Above $500 an expert physically checks the bag before you get it. Below $500 nobody does, and that's most mid-tier listings.",
    },
    gaps: ["authentication", "returns", "unknown-seller"],
  },
  {
    slug: "poshmark",
    label: "Poshmark",
    category: "marketplace",
    authentication: {
      type: "physical-threshold",
      thresholdUsd: 500,
      fact: {
        claim: "Posh Authenticate routes orders of $500 or more through expert review at no extra cost.",
        sourceUrl: "https://support.poshmark.com/s/article/663399974",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: null,
      detail: "All sales final. Posh Protect refunds items that never ship or don't match the listing.",
      fact: {
        claim: "All sales are final; a full refund applies if the item never ships or does not match the listing description.",
        sourceUrl: "https://poshmark.com/posh_protect",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Open a Posh Protect case before accepting the order; payment is held until you accept.",
      fact: {
        claim: "Buyers may open a case if the item received is not as described; sales are final once payment releases.",
        sourceUrl: "https://support.poshmark.com/s/article/873327429",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "Payment is held by the platform until you accept the order.",
      fact: {
        claim: "Once payment is released to the seller, all sales are final.",
        sourceUrl: "https://support.poshmark.com/s/article/404894010",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "know-the-gaps",
      blurb: "Same $500 line as eBay: real inspection above it, nothing below. Inspect before you hit accept, because that tap ends your window.",
    },
    gaps: ["authentication", "returns", "unknown-seller"],
  },
  {
    slug: "mercari",
    label: "Mercari",
    category: "marketplace",
    authentication: {
      type: "photo-optional",
      fact: {
        claim: "Authentication is an optional $5 photo-review service by a third party; no automatic physical inspection at any price.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/475/",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: 3,
      detail: "Return requests must be made within 72 hours of delivery.",
      fact: {
        claim: "All returns must be requested within 72 hours of delivery.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/56/",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: {
      detail: "Buyer Protection refunds eligible not-as-described claims made within the 72-hour window.",
      fact: {
        claim: "If the item is not as described, buyers have 72 hours to report it for a full refund on eligible returns.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/235/",
        checkedAt: CHECKED,
      },
    },
    paymentProtection: {
      covered: true,
      detail: "Pay in the app only; the window to dispute is short.",
      fact: {
        claim: "Buyer Protection applies to purchases completed through Mercari.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/235/",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "know-the-gaps",
      blurb: "No physical check at any price, and 72 hours to act. Photos-only review is a screen, not an inspection.",
    },
    gaps: ["authentication", "returns", "unknown-seller"],
  },
  {
    slug: "facebook-marketplace",
    label: "Facebook Marketplace",
    category: "p2p",
    authentication: {
      type: "none",
      fact: {
        claim: "No authentication program exists for Marketplace listings.",
        sourceUrl: "https://www.facebook.com/policies/purchase_protection",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: null,
      detail: "No standard returns. Whatever you agree with the seller is the policy.",
      fact: {
        claim: "Only transactions completed with onsite checkout are eligible for Purchase Protection.",
        sourceUrl: "https://www.facebook.com/policies/purchase_protection",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: null,
    paymentProtection: {
      covered: false,
      detail: "Purchase Protection covers onsite-checkout shipped orders ONLY. Local pickup and Messenger deals are explicitly excluded.",
      fact: {
        claim: "Purchases made through third-party sites, local pickups, or Messenger transactions don't qualify for Purchase Protection.",
        sourceUrl: "https://www.facebook.com/help/228307904608701",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "on-your-own",
      blurb: "The typical Marketplace deal (local pickup, cash or Zelle) carries zero platform protection. Every safeguard is one you bring yourself.",
    },
    gaps: ["authentication", "payment", "returns", "unknown-seller"],
  },
  {
    slug: "indie-sellers",
    label: "Instagram + indie sellers",
    category: "p2p",
    authentication: {
      type: "none",
      fact: {
        claim: "Independent sellers set their own practices; there is no platform-level authentication on Instagram or a private site.",
        sourceUrl: "https://www.facebook.com/policies/purchase_protection",
        checkedAt: CHECKED,
      },
    },
    returns: {
      windowDays: null,
      detail: "Seller-by-seller. Many offer no return window at all; get the policy in writing before paying.",
      fact: {
        claim: "No platform-standard return policy exists for direct or DM sales.",
        sourceUrl: "https://www.facebook.com/policies/purchase_protection",
        checkedAt: CHECKED,
      },
    },
    fakeRemedy: null,
    paymentProtection: {
      covered: false,
      detail: "Depends entirely on the rail you pay with. PayPal Goods and Services or a credit card carries dispute rights; Zelle, Venmo friends-and-family, and wires carry none.",
      fact: {
        claim: "DM and direct sales settle on whatever payment rail buyer and seller choose.",
        sourceUrl: "https://www.paypal.com/us/legalhub/buyer-protection",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "on-your-own",
      blurb: "Some indie dealers are excellent. The point is the venue gives you nothing, so the seller's track record and your payment rail do all the work.",
    },
    gaps: ["authentication", "payment", "returns", "unknown-seller"],
  },
];

export const VENUES_BY_SLUG: Record<string, VenueProfile> = Object.fromEntries(
  VENUES.map((v) => [v.slug, v]),
);

/** Venues grouped for the hub page, in display order. */
export const VENUE_CATEGORIES: VenueCategory[] = ["consignor", "marketplace", "p2p"];

/**
 * Whether a physical authentication check actually applies at a given price.
 * The hub's signature move: protection that looks like a checkmark in general
 * flips to an x at the price you're actually paying.
 */
export function authAppliesAtPrice(venue: VenueProfile, priceUsd: number): boolean {
  switch (venue.authentication.type) {
    case "physical-all":
      return true;
    case "physical-threshold":
      return priceUsd >= (venue.authentication.thresholdUsd ?? Infinity);
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/* The remedy library: how to close each gap yourself.                 */
/* Composed per venue from its `gaps` on the profile page.             */
/* ------------------------------------------------------------------ */

export interface Remedy {
  gap: GapKey;
  title: string;
  /** Short beats, each one action. Never a wall. */
  beats: string[];
  /** Internal link that does part of the job for the reader. */
  internal?: { href: string; label: string };
}

export const REMEDIES: Record<GapKey, Remedy> = {
  authentication: {
    gap: "authentication",
    title: "No one is checking the bag, so you check it",
    beats: [
      "Paid photo-review services authenticate from your photos, typically $10 to $50. Make the deal contingent on the result.",
      "Ask the seller for a photo of the bag with a handwritten note and today's date in frame. Stolen listing photos can't produce one.",
      "Reverse-image-search the listing photos. If they appear on other sites, walk.",
      "Pull up the markers for this exact style before you pay, not after.",
    ],
    internal: { href: "/identify", label: "Check the markers for your bag" },
  },
  payment: {
    gap: "payment",
    title: "The payment rail is the protection",
    beats: [
      "PayPal Goods and Services carries documented dispute rights. A credit card carries chargeback rights.",
      "Zelle, Venmo friends-and-family, wire, and gift cards carry nothing. A seller who insists on one is telling you something.",
      "Meeting in person? Inspect before money moves, in a public place.",
    ],
  },
  returns: {
    gap: "returns",
    title: "No return window, so build your own paper trail",
    beats: [
      "Get condition and the return terms in writing before paying. The message thread is your record.",
      "Ask for photos against a checklist: corners, straps, hardware, interior, date code.",
      "Film the unboxing. A not-as-described dispute with video is a different conversation.",
    ],
  },
  "unknown-seller": {
    gap: "unknown-seller",
    title: "Vet the seller like it's your job",
    beats: [
      "Search the seller's name plus reviews, and check the Better Business Bureau if they operate as a business.",
      "Look for a track record on other platforms; sellers with history protect it.",
      "Ask for a live video walkthrough of the bag. Two minutes on camera filters out most bad actors.",
    ],
  },
};

/**
 * The always-on remedy, venue-independent: check the going rate before buying
 * anywhere. Rendered on every profile; the internal link is the strategic one.
 */
export const PRICE_REALITY = {
  title: "Check the going rate before you commit",
  beats: [
    "Look up the bag's current resale median for its size and material. Our estimate, updated from recorded market prices.",
    "A price far below the going rate is not proof of anything, but it is the single strongest marker to slow down on.",
  ],
  internal: { href: "/search", label: "Look up the bag" },
} as const;

/** Remedies for one venue, composed from its gaps in display order. */
export function remediesFor(venue: VenueProfile): Remedy[] {
  return venue.gaps.map((g) => REMEDIES[g]);
}
