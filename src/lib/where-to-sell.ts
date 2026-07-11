/**
 * Where to Sell — the payout + effort registry behind /where-to-sell.
 *
 * Positioning (docs/ux/where-to-sell-spec.md): we don't judge, we equip. Selling
 * is a trade-off curve, not a checkmark: top dollar costs you patience, instant
 * cash costs you margin, keeping it all costs you the safety net. Every factual
 * cell carries the venue's own published source + the date we checked it; a cell
 * without a source renders "not yet verified", never a guess. The tier is OUR
 * TAKE (an informed opinion, framed as one), never a verdict.
 *
 * The signature move is estimateNet(): given the bag's estimated resale value
 * (our data), what would you actually keep at each venue. Consignment/marketplace
 * commissions are published schedules, so we compute them. Buyout amounts are
 * per-item quotes no venue publishes as a percentage, so we never invent one; we
 * route the seller to the live median to compare their quote against. Pure, no IO.
 */

export type SellCategory = "sells-for-you" | "marketplace" | "p2p";
export type SellModel = "consignment" | "buyout" | "marketplace" | "p2p";
export type EffortLevel = "white-glove" | "you-ship-only" | "full-diy";
export type PriceSetter = "venue-sets" | "seller-sets";
/** Our take: the trade each venue makes, framed as opinion. */
export type SellTier = "hands-off" | "keep-more" | "keep-all";

/** A sourced, dated claim. The bar: no source + date, no cell. */
export interface Fact {
  claim: string;
  sourceUrl: string;
  /** ISO date we last confirmed the claim on the venue's own page. */
  checkedAt: string;
}

/** One commission band: while in this band, the seller keeps sellerKeepPct. */
export interface CommissionTier {
  minUsd: number;
  /** null = open-ended top band. */
  maxUsd: number | null;
  sellerKeepPct: number;
}

/**
 * How much of the sale the seller keeps. Four shapes:
 *  - "band": whole sale price times the matching band's keep% (The RealReal, Rebag consign).
 *  - "marginal": each band's keep% applies only to the portion of the sale in that band
 *    (Fashionphile: 70% up to $3,000, 85% on the part above).
 *  - "flat": one keep% across the range that matters for bags (marketplaces).
 *  - "buyout": an instant quote, no published %. estimateNet returns { kind: "quote" }.
 */
export type Payout =
  | { kind: "band"; tiers: CommissionTier[]; flatFeeUsd?: number }
  | { kind: "marginal"; tiers: CommissionTier[]; flatFeeUsd?: number }
  | { kind: "flat"; sellerKeepPct: number; note?: string }
  | { kind: "buyout" };

export interface SellVenueProfile {
  slug: string;
  label: string;
  category: SellCategory;
  models: SellModel[];
  /** The max-value path used by the estimator (consignment or marketplace economics). */
  payout: Payout;
  /** For venues that ALSO buy outright: an instant quote today for less than consignment. */
  buyout: { available: boolean; fact: Fact } | null;
  payoutSpeed: {
    /** Can you get paid without waiting for the bag to sell (buyout / local cash)? */
    instant: boolean;
    detail: string;
    fact: Fact;
  };
  payoutMethods: {
    methods: string[];
    /** Extra % if you take the payout as store credit instead of cash. */
    storeCreditBonusPct: number | null;
    fact: Fact;
  };
  acceptance: {
    /** Minimum list price the venue will take, if published. */
    floorUsd: number | null;
    detail: string;
    fact: Fact;
  };
  effort: { level: EffortLevel; detail: string; fact: Fact };
  /** Who sets the price. On marketplaces this is structural (you make the listing), so the
   *  Fact is optional; on consignors it is a sourced policy. */
  priceControl: { who: PriceSetter; detail: string; fact: Fact | null };
  /** What happens to the seller if the bag fails the venue's authentication check. */
  sellerAuth: { detail: string; fact: Fact };
  ourTake: { tier: SellTier; blurb: string };
  /** Which tips apply when selling here, composed on the profile page. */
  tips: TipKey[];
}

export const TIER_LABELS: Record<SellTier, string> = {
  "hands-off": "Hands-off",
  "keep-more": "Keep more, do more",
  "keep-all": "Keep it all, no net",
};

export const CATEGORY_LABELS: Record<SellCategory, { title: string; note: string }> = {
  "sells-for-you": {
    title: "They sell it for you",
    note: "You send the bag; they authenticate, photograph, list, and ship it.",
  },
  marketplace: {
    title: "You list it yourself",
    note: "You photograph, price, and ship it; the platform takes a cut when it sells.",
  },
  p2p: {
    title: "You sell it direct",
    note: "You deal with the buyer yourself. No fee, and no safety net either.",
  },
};

const CHECKED = "2026-07-11";

export const SELL_VENUES: SellVenueProfile[] = [
  {
    slug: "fashionphile",
    label: "Fashionphile",
    category: "sells-for-you",
    models: ["buyout", "consignment"],
    payout: {
      kind: "marginal",
      tiers: [
        { minUsd: 0, maxUsd: 3000, sellerKeepPct: 70 },
        { minUsd: 3000, maxUsd: null, sellerKeepPct: 85 },
      ],
    },
    buyout: {
      available: true,
      fact: {
        claim:
          "Fill out our quick online form using a few photos. Send us your items with a complimentary shipping label or a free UPS Pick-Up.",
        sourceUrl: "https://www.fashionphile.com/pages/sell-with-us",
        checkedAt: CHECKED,
      },
    },
    payoutSpeed: {
      instant: true,
      detail:
        "Buyout: an offer today, paid about 2 to 4 days after they receive and authenticate the bag. Consignment pays after it sells and the buyer return window closes.",
      fact: {
        claim:
          "We'll email you with an offer within 7-10 business days. How long does payout take? Estimated 2-4 days after your item is received and authenticated.",
        sourceUrl: "https://www.fashionphile.com/pages/sell-with-us",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Direct deposit", "PayPal", "Wire", "Check", "Store credit", "Neiman Marcus gift card"],
      storeCreditBonusPct: 10,
      fact: {
        claim:
          "Store Credit (plus a 10% bonus!); Neiman Marcus Gift Card (plus a 10% bonus!); Direct Deposit; PayPal (fee applicable); Wire Transfer ($50 fee per transfer applicable); Check sent by US Mail.",
        sourceUrl: "https://help.fashionphile.com/s/article/When-do-I-get-paid-for-my-item",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Specific designers and items only, per their Designer Directory. Some are declined for condition, value, or style.",
      fact: {
        claim:
          "Although we love all things luxury, we only accept specific designers and items, which you can find in our Designer Directory.",
        sourceUrl: "https://help.fashionphile.com/s/article/What-brands-does-FASHIONPHILE-accept-for-Consignment-or-Buyout",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "you-ship-only",
      detail: "You submit a few photos and ship with their label. They authenticate, photograph, price, and list it.",
      fact: {
        claim:
          "Once received and authenticated, your payout will be deposited in your FASHIONPHILE Wallet.",
        sourceUrl: "https://www.fashionphile.com/pages/sell-with-us",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "venue-sets",
      detail: "They set and adjust the price, and discount items unsold after 25 days.",
      fact: {
        claim: "FASHIONPHILE reserves the right to discount the sale price of items that remain unsold after twenty-five (25) days.",
        sourceUrl: "https://help.fashionphile.com/s/article/What-are-FASHIONPHILE-s-consignment-fees",
        checkedAt: CHECKED,
      },
    },
    sellerAuth: {
      detail: "If a bag is found not authentic, they return it only after you pay a $75 authentication fee ($125 for a Hermès Birkin or Kelly).",
      fact: {
        claim:
          "If any item is found to be not authentic, FASHIONPHILE will return the item to the seller upon payment of an authentication fee of $75 (or $125 for an Hermes Birkin or Kelly).",
        sourceUrl: "https://help.fashionphile.com/s/article/What-if-my-item-is-not-authentic",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "hands-off",
      blurb:
        "Take an instant buyout quote today, or consign and keep 70% up to $3,000 plus 85% of anything above. Either way you just ship the bag; they do the rest.",
    },
    tips: ["they-price-it", "slow-payout"],
  },
  {
    slug: "therealreal",
    label: "The RealReal",
    category: "sells-for-you",
    models: ["consignment"],
    payout: {
      kind: "band",
      tiers: [
        { minUsd: 0, maxUsd: 100, sellerKeepPct: 20 },
        { minUsd: 100, maxUsd: 150, sellerKeepPct: 30 },
        { minUsd: 150, maxUsd: 200, sellerKeepPct: 45 },
        { minUsd: 200, maxUsd: 300, sellerKeepPct: 55 },
        { minUsd: 300, maxUsd: 750, sellerKeepPct: 60 },
        { minUsd: 750, maxUsd: 1500, sellerKeepPct: 65 },
        { minUsd: 1500, maxUsd: 5000, sellerKeepPct: 70 },
        { minUsd: 5000, maxUsd: 7500, sellerKeepPct: 75 },
        { minUsd: 7500, maxUsd: null, sellerKeepPct: 80 },
      ],
    },
    buyout: null,
    payoutSpeed: {
      instant: false,
      detail: "Paid only after it sells: commission is issued on the 15th of the month after the sale. A Get Paid Now option pays some bags upfront within 48 hours.",
      fact: {
        claim:
          "Commission payments are issued on the 15th of each month, following the month in which items were sold. For example, for items sold in January you would be paid on February 15th.",
        sourceUrl: "https://www.therealreal.com/faq/consign",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Direct deposit", "Site credit", "Check"],
      storeCreditBonusPct: 5,
      fact: {
        claim:
          "You can receive payment by direct deposit, site credit (+5%) or check after your item sells. There is a $12.50 non-refundable fee deducted from the payment total for each check.",
        sourceUrl: "https://www.therealreal.com/faq/consign",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Only brands on their Designer Directory, in fair-to-pristine condition. No hard price floor.",
      fact: {
        claim: "We only accept items by designers on the Directory.",
        sourceUrl: "https://www.therealreal.com/faq/consign",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "white-glove",
      detail: "The most hands-off option: ship free, drop at a store, or book a home pickup. They authenticate, shoot, price, list, and ship.",
      fact: {
        claim: "Once we receive your items, they will be authenticated, photographed, priced and included in your profile under My Sales.",
        sourceUrl: "https://www.therealreal.com/faq/consign",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "venue-sets",
      detail: "They set the list price. Select high-demand bags (Hermès, Chanel, Louis Vuitton priced $995+) get a Price Review you can approve.",
      fact: {
        claim:
          "TRR sets the initial list price for all items at the highest amount we believe the market will support. For select items of highest demand we offer our Price Review service.",
        sourceUrl: "https://www.therealreal.com/faq/consign",
        checkedAt: CHECKED,
      },
    },
    sellerAuth: {
      detail: "Every item is authenticated in-house by their expert team. Counterfeits are confiscated and not returned.",
      fact: {
        claim: "At The RealReal, we employ 150+ experts including luxury brand authenticators, gemologists, and horologists.",
        sourceUrl: "https://www.therealreal.com/faq/consign",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "hands-off",
      blurb:
        "The most hands-off of all: they do everything. Your cut scales with price, from 60% around $300 to 80% over $7,500, and you're paid the month after it sells.",
    },
    tips: ["they-price-it", "slow-payout"],
  },
  {
    slug: "rebag",
    label: "Rebag",
    category: "sells-for-you",
    models: ["buyout", "consignment"],
    payout: {
      kind: "band",
      tiers: [
        { minUsd: 0, maxUsd: 750, sellerKeepPct: 68 },
        { minUsd: 750, maxUsd: 1500, sellerKeepPct: 73 },
        { minUsd: 1500, maxUsd: 5000, sellerKeepPct: 78 },
        { minUsd: 5000, maxUsd: 7500, sellerKeepPct: 83 },
        { minUsd: 7500, maxUsd: 50000, sellerKeepPct: 85 },
        { minUsd: 50000, maxUsd: null, sellerKeepPct: 90 },
      ],
    },
    buyout: {
      available: true,
      fact: {
        claim: "Easily self-generate an upfront offer and get paid outright.",
        sourceUrl: "https://www.rebag.com/buyout/",
        checkedAt: CHECKED,
      },
    },
    payoutSpeed: {
      instant: true,
      detail: "Buyout: an instant online quote, paid after they inspect the bag. Consignment pays 4 to 5 weeks after it sells.",
      fact: {
        claim: "Get paid 4-5 weeks after your item sells.",
        sourceUrl: "https://www.rebag.com/consign/",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Rebag Wallet", "Bank transfer", "Check", "Store credit (Trade)"],
      storeCreditBonusPct: null,
      fact: {
        claim:
          "Payouts in your Rebag Wallet automatically increase by 1% per month for up to 9 months, generating up to 9% in bonus payouts.",
        sourceUrl: "https://www.rebag.com/consign/",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Over 75 vetted brands across handbags, watches, jewelry, shoes, and more.",
      fact: {
        claim:
          "Rebag brings together an expertly vetted selection of best-in-class handbags, watches, jewelry, shoes, apparel, and more from over 75 of the world's most sought-after brands.",
        sourceUrl: "https://www.rebag.com/buyout/",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "white-glove",
      detail: "You self-generate a quote and ship with a free label. They inspect, authenticate, photograph, and list it.",
      fact: {
        claim: "We inspect, authenticate, photograph, and list your item for you.",
        sourceUrl: "https://www.rebag.com/selling-with-rebag/",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "venue-sets",
      detail: "They set and adjust the price but guarantee a pre-approved payout range, and notify you before any cut that would lower it.",
      fact: {
        claim:
          "Rebag can only change the listing price of the item if the consignor payout will remain in the pre-approved range after the price change.",
        sourceUrl: "https://www.rebag.com/consign/",
        checkedAt: CHECKED,
      },
    },
    sellerAuth: {
      detail: "Every item is authenticated before payout. A bag that does not match the condition you submitted can fail vetting and be returned instead of paid.",
      fact: {
        claim: "If the item we receive does not match the condition detailed in your submission, it may not pass our vetting process.",
        sourceUrl: "https://www.rebag.com/buyout/",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "hands-off",
      blurb:
        "Buyout gives you an instant online quote and cash on receipt. Consign instead and keep 68% to 90% depending on the bag, and leave funds in the Wallet to earn up to 9% more.",
    },
    tips: ["they-price-it", "slow-payout"],
  },
  {
    slug: "ebay",
    label: "eBay",
    category: "marketplace",
    models: ["marketplace"],
    payout: {
      kind: "marginal",
      tiers: [
        { minUsd: 0, maxUsd: 2000, sellerKeepPct: 85 },
        { minUsd: 2000, maxUsd: null, sellerKeepPct: 91 },
      ],
    },
    buyout: null,
    payoutSpeed: {
      instant: false,
      detail: "Paid after it sells, to a linked bank account. Bags sold at $500 and up are held until the authenticator clears them, then funds land about a day after it ships to the buyer.",
      fact: {
        claim:
          "It typically takes 1-2 days from confirming the buyer's payment for the sales proceeds to appear as Available for payout, then another 1-3 business days for the funds to clear in your checking account.",
        sourceUrl: "https://www.ebay.com/help/selling/getting-paid/getting-paid-items-youve-sold?id=4814",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Bank (managed payments)", "Debit card"],
      storeCreditBonusPct: null,
      fact: {
        claim: "As an eBay seller, you'll receive your payouts to your linked checking account or debit card.",
        sourceUrl: "https://www.ebay.com/help/selling/getting-paid/getting-paid-items-youve-sold?id=4814",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Anyone can list, no brand gate. Handbags listed at $500 and up are automatically authenticated before the buyer.",
      fact: {
        claim:
          "If your item is eligible for Authenticity Guarantee, it will be automatically added to the program, free of charge. There is no opt in or opt out option.",
        sourceUrl: "https://www.ebay.com/help/selling/selling-tools/selling-authenticity-guarantee?id=4644",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "full-diy",
      detail: "You create the listing, set the price, and ship it. For $500+ bags you ship to eBay's authenticator first, on a free label.",
      fact: {
        claim: "When you make a sale, you have to send the item to the authenticator's address provided by eBay.",
        sourceUrl: "https://www.ebay.com/help/selling/selling-tools/selling-authenticity-guarantee?id=4644",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "seller-sets",
      detail: "You set the price and the format when you list.",
      fact: null,
    },
    sellerAuth: {
      detail: "Bags $500 and up are auto-enrolled in Authenticity Guarantee. Your payout is held until it passes; if it fails, the buyer is refunded and funds can be held up to 31 days.",
      fact: {
        claim:
          "The funds for items sold with Authenticity Guarantee will be held until the item has been inspected. If the item doesn't pass the inspection, the funds will typically be held for up to 31 days until the refund and return are resolved.",
        sourceUrl: "https://www.ebay.com/help/selling/getting-paid/getting-paid-items-youve-sold/payments-hold?id=4816",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "keep-more",
      blurb:
        "The biggest audience by far. You keep about 85% after the handbag fee, rising toward 91% on the part of a sale above $2,000. Bags at $500 and up are authenticated before the buyer gets them.",
    },
    tips: ["do-it-yourself"],
  },
  {
    slug: "theluxurycloset",
    label: "The Luxury Closet",
    category: "sells-for-you",
    models: ["consignment"],
    payout: {
      kind: "marginal",
      flatFeeUsd: 30,
      tiers: [
        { minUsd: 0, maxUsd: 3000, sellerKeepPct: 65 },
        { minUsd: 3000, maxUsd: null, sellerKeepPct: 80 },
      ],
    },
    buyout: null,
    payoutSpeed: {
      instant: false,
      detail: "Consignment only, so you're paid after it sells and clears the return period. Payouts run twice a month, roughly the 5th or the 20th of the month after you request them.",
      fact: {
        claim:
          "Payouts are processed twice monthly: Requests made between the 1st-15th are paid by the 5th of the following month. Requests made between the 16th-end of the month are paid by the 20th of the following month.",
        sourceUrl: "https://theluxurycloset.com/us-en/sell",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["PayPal", "Bank transfer", "Store credit (My Credits)"],
      storeCreditBonusPct: null,
      fact: {
        claim:
          "You can request a payment via PayPal or bank transfer. PayPal payments are transferred in USD. Bank Transfer payment for sold items that amount to a total value below USD 100 will not be processed.",
        sourceUrl: "https://theluxurycloset.com/us-en/pages/terms-and-conditions",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "A curated brand list, shown in their Sell With Us form. If a brand is not in the dropdown, they are not taking it right now.",
      fact: {
        claim:
          "The most accurate and up-to-date list of approved brands is always available in our Sell With Us form. If a brand does not appear in the dropdown, it means we are not accepting it at this time.",
        sourceUrl: "https://theluxurycloset.com/us-en/sell",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "white-glove",
      detail: "They photograph, price, authenticate, list, and sell it from their Dubai facility. US sellers ship in; the label is covered on items valued $800 and up.",
      fact: {
        claim:
          "We Take Care of Everything: Photography, pricing, listing & selling. Items valued at USD 800 or more: The Luxury Closet covers the cost. Items valued below USD 800: The seller covers the shipping costs to our Dubai facility.",
        sourceUrl: "https://theluxurycloset.com/us-en/sell",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "venue-sets",
      detail: "You pick a price from a range they set. For select high-value brands, a Full Price Control option lets you set and hold the price for 30 days.",
      fact: {
        claim:
          "\"Payout Range\" refers to the suggested price range by TLC, the seller is required to choose a price from the provided payout range. For select high-value brands like Hermes, Chanel, Louis Vuitton, and Rolex, you set the price, we protect it.",
        sourceUrl: "https://theluxurycloset.com/us-en/pages/price-control",
        checkedAt: CHECKED,
      },
    },
    sellerAuth: {
      detail: "They authenticate on your behalf; you never have to. Every item is checked and photographed at their Dubai facility before listing.",
      fact: {
        claim:
          "Your items are authenticated, photographed, and listed to reach millions of buyers worldwide. From our state-of-the-art facility in Dubai, every item undergoes a multi-point authentication.",
        sourceUrl: "https://theluxurycloset.com/us-en/sell",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "hands-off",
      blurb:
        "Full white-glove: they authenticate, shoot, and list it for you. You keep 65% up to $3,000 and 80% above, minus a flat $30 per item, and you ship the bag to Dubai to start.",
    },
    tips: ["they-price-it", "slow-payout"],
  },
  {
    slug: "vestiaire",
    label: "Vestiaire Collective",
    category: "marketplace",
    models: ["marketplace"],
    payout: {
      kind: "flat",
      sellerKeepPct: 85,
      note: "12% selling fee plus a 3% payment fee in the main price band. Thousands of brands now carry 0% commission, leaving only the 3% fee.",
    },
    buyout: null,
    payoutSpeed: {
      instant: false,
      detail: "Paid within 24 hours after the sale is marked complete, which for authenticated shipping is about 2 business days after the bag reaches their warehouse.",
      fact: {
        claim: "Our team will issue your payout within 24 hours after the sale is marked as complete.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/209304765-Seller-When-will-I-receive-my-payment-for-my-sold-item",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Bank transfer", "PayPal", "Venmo"],
      storeCreditBonusPct: null,
      fact: {
        claim: "Bank Transfer, United States (USD): 2 business days. PayPal: Within 24 hours. Venmo: Within 24 hours.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/209304765-Seller-When-will-I-receive-my-payment-for-my-sold-item",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: 18,
      detail: "Coveted luxury and premium brands. Items must list for at least $18.",
      fact: {
        claim: "We cannot accept items listed for sale on Vestiaire Collective for less than $18 USD.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/24659638721425-Seller-Selling-Fees",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "full-diy",
      detail: "You photograph, describe, price, and ship it. A white-glove Concierge service exists for high-value sellers.",
      fact: {
        claim: "Include a minimum of 2 well-lit, quality photographs taken against a plain background. Describe your item precisely and in as much detail as possible.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/209239625-Seller-Creating-the-Perfect-Listing",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "seller-sets",
      detail: "You set the price when you list.",
      fact: {
        claim: "Have a look at similar listings on Vestiaire Collective and set your price accordingly.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/209239625-Seller-Creating-the-Perfect-Listing",
        checkedAt: CHECKED,
      },
    },
    sellerAuth: {
      detail: "On authenticated shipping you send the bag to their warehouse for a physical check. If it differs from your listing, the sale can be cancelled.",
      fact: {
        claim: "If our experts notice your item differs from its listing in regards to authenticity or conformity, your sale could be cancelled.",
        sourceUrl: "https://faq.vestiairecollective.com/hc/en-us/articles/360004811778-Seller-Selling-with-authentication",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "keep-more",
      blurb:
        "You list and price it and keep about 85% after the 12% and 3% fees. Thousands of brands now sell at 0% commission, so check yours; the trade is you do the photos, listing, and shipping.",
    },
    tips: ["do-it-yourself"],
  },
  {
    slug: "poshmark",
    label: "Poshmark",
    category: "marketplace",
    models: ["marketplace"],
    payout: {
      kind: "flat",
      sellerKeepPct: 80,
      note: "Flat 20% on sales of $15 and up. Sales under $15 pay a flat $2.95 fee instead.",
    },
    buyout: null,
    payoutSpeed: {
      instant: false,
      detail: "Your money is released within 3 days of delivery to the buyer.",
      fact: {
        claim: "After the buyer receives the item, we release the money to your Poshmark account within 3 days of delivery.",
        sourceUrl: "https://support.poshmark.com/s/article/773838096",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Direct deposit", "Instant transfer", "PayPal", "Venmo", "Check"],
      storeCreditBonusPct: null,
      fact: {
        claim: "You can withdraw the money via Instant Transfer, PayPal, Venmo, direct deposit to your bank account or request a check.",
        sourceUrl: "https://support.poshmark.com/s/article/773838096",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Anyone can list. Sales of $500 and up route through Posh Authenticate.",
      fact: {
        claim: "Only select luxury items sold for $500 or higher qualify for Posh Authenticate.",
        sourceUrl: "https://poshmark.com/posh_authenticate",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "full-diy",
      detail: "You photograph and list it, then ship with the prepaid label they email you.",
      fact: {
        claim: "Orders must be shipped using the prepaid shipping label sent to your email address linked to your Poshmark account.",
        sourceUrl: "https://support.poshmark.com/s/article/773838096",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "seller-sets",
      detail: "You set the price when you list.",
      fact: null,
    },
    sellerAuth: {
      detail: "Sales of $500 and up are routed to Poshmark for authentication before delivery, free for both sides.",
      fact: {
        claim: "When you make a sale, we will automatically route eligible items to Poshmark for authentication. Posh Authenticate is a free service for qualifying orders for both sellers and buyers.",
        sourceUrl: "https://poshmark.com/posh_authenticate",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "keep-more",
      blurb:
        "Simple and social: list, ship with the prepaid label, keep 80% flat. Sales of $500 and up get authenticated before they reach the buyer, at no cost to you.",
    },
    tips: ["do-it-yourself"],
  },
  {
    slug: "mercari",
    label: "Mercari",
    category: "marketplace",
    models: ["marketplace"],
    payout: {
      kind: "flat",
      sellerKeepPct: 90,
      note: "Flat 10% selling fee on the item price and buyer-paid shipping, since January 2025.",
    },
    buyout: null,
    payoutSpeed: {
      instant: false,
      detail: "Paid after the buyer confirms delivery. Direct deposit lands in about 5 business days, or Instant Pay in minutes for a $3 fee.",
      fact: {
        claim: "$0 fee for each completed Direct Deposit to your bank account. $3 fee for each completed Instant Pay transfer.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/169/",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Direct deposit", "Instant Pay"],
      storeCreditBonusPct: null,
      fact: {
        claim: "$0 fee for each completed Direct Deposit to your bank account. $3 fee for each completed Instant Pay transfer.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/169/",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Anyone can list, and listing is free.",
      fact: {
        claim: "Listing an item is always free on Mercari.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/169/",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "full-diy",
      detail: "You photograph, list from your phone, and ship with a printable label.",
      fact: {
        claim: "With Mercari, listing items is a breeze right from your smartphone. We simplify the process with convenient shipping options like printable labels.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/2517/",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "seller-sets",
      detail: "You set the price when you list.",
      fact: null,
    },
    sellerAuth: {
      detail: "Authentication is an optional photo review by a third party. No physical inspection at any price.",
      fact: {
        claim: "Authentication is completely optional unless you list over the required Authentication dollar amount for that category and brand of item.",
        sourceUrl: "https://www.mercari.com/us/help_center/article/475/",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "keep-more",
      blurb:
        "The simplest DIY option and the lowest fee here at a flat 10%, so you keep 90%. No physical authentication at any price, so your photos and description carry the sale.",
    },
    tips: ["do-it-yourself"],
  },
  {
    slug: "facebook-marketplace",
    label: "Facebook Marketplace",
    category: "p2p",
    models: ["p2p"],
    payout: {
      kind: "flat",
      sellerKeepPct: 100,
      note: "Local pickup has no fee, so you keep everything. Shipped orders take a 10% selling fee (minimum $0.80).",
    },
    buyout: null,
    payoutSpeed: {
      instant: true,
      detail: "Local pickup is cash on the spot. A shipped order's payout can take up to 20 days from when you mark it shipped.",
      fact: {
        claim:
          "In total, it may take up to 20 days from the time you mark the item as shipped for funds to appear in your account.",
        sourceUrl: "https://www.facebook.com/help/620680138523186",
        checkedAt: CHECKED,
      },
    },
    payoutMethods: {
      methods: ["Cash (local pickup)", "Bank (shipped orders)"],
      storeCreditBonusPct: null,
      fact: {
        claim: "Your payout goes to the bank account that you entered when you set up shipping.",
        sourceUrl: "https://www.facebook.com/help/620680138523186",
        checkedAt: CHECKED,
      },
    },
    acceptance: {
      floorUsd: null,
      detail: "Anyone can list. There is no authentication program of any kind.",
      fact: {
        claim: "A selling fee of 10% (or $0.80 minimum per order) is deducted from your payout.",
        sourceUrl: "https://www.facebook.com/help/620680138523186",
        checkedAt: CHECKED,
      },
    },
    effort: {
      level: "full-diy",
      detail: "You do everything: photograph, list, message buyers, and meet them or ship the bag yourself.",
      fact: {
        claim: "The seller ships the item directly to the buyer.",
        sourceUrl: "https://www.facebook.com/help/796066857221106",
        checkedAt: CHECKED,
      },
    },
    priceControl: {
      who: "seller-sets",
      detail: "You set the price when you list.",
      fact: null,
    },
    sellerAuth: {
      detail: "No authentication, and Purchase Protection does not cover local pickup at all.",
      fact: {
        claim: "Local transactions aren't covered by Purchase Protection.",
        sourceUrl: "https://www.facebook.com/help/329122794534612",
        checkedAt: CHECKED,
      },
    },
    ourTake: {
      tier: "keep-all",
      blurb:
        "The only place you keep 100%, on a local cash pickup. There is no authentication and no safety net, so the buyer's trust and your own caution do all the work.",
    },
    tips: ["protect-the-sale", "do-it-yourself"],
  },
];

export const SELL_VENUES_BY_SLUG: Record<string, SellVenueProfile> = Object.fromEntries(
  SELL_VENUES.map((v) => [v.slug, v]),
);

/** Venues grouped for the hub page, in display order. */
export const SELL_CATEGORIES: SellCategory[] = ["sells-for-you", "marketplace", "p2p"];

/* ------------------------------------------------------------------ */
/* The estimator: what you'd actually keep at each venue.              */
/* Consignment/marketplace = computed from published schedules.        */
/* Buyout = an instant quote, never a fabricated %, routed to median.  */
/* ------------------------------------------------------------------ */

export type NetEstimate =
  | { kind: "net"; net: number; keepPct: number }
  | { kind: "quote" };

/** What the seller keeps on a sale of saleUsd, from the venue's published payout. */
export function estimateNet(venue: SellVenueProfile, saleUsd: number): NetEstimate {
  const p = venue.payout;
  switch (p.kind) {
    case "flat": {
      const net = Math.round(saleUsd * (p.sellerKeepPct / 100));
      return { kind: "net", net, keepPct: p.sellerKeepPct };
    }
    case "band": {
      const tier = p.tiers.find(
        (t) => saleUsd >= t.minUsd && (t.maxUsd == null || saleUsd < t.maxUsd),
      );
      const keepPct = tier ? tier.sellerKeepPct : 0;
      const net = Math.max(0, Math.round(saleUsd * (keepPct / 100)) - (p.flatFeeUsd ?? 0));
      return { kind: "net", net, keepPct: Math.round((net / saleUsd) * 100) };
    }
    case "marginal": {
      let gross = 0;
      for (const t of p.tiers) {
        if (saleUsd <= t.minUsd) continue;
        const top = t.maxUsd == null ? saleUsd : Math.min(saleUsd, t.maxUsd);
        gross += (top - t.minUsd) * (t.sellerKeepPct / 100);
      }
      const net = Math.max(0, Math.round(gross) - (p.flatFeeUsd ?? 0));
      return { kind: "net", net, keepPct: Math.round((net / saleUsd) * 100) };
    }
    case "buyout":
      return { kind: "quote" };
  }
}

/** Venues ranked by net payout on a given sale price, highest first. Buyout venues sort last. */
export function rankByNet(saleUsd: number): Array<{ venue: SellVenueProfile; est: NetEstimate }> {
  return SELL_VENUES.map((venue) => ({ venue, est: estimateNet(venue, saleUsd) }))
    .sort((a, b) => {
      const an = a.est.kind === "net" ? a.est.net : -1;
      const bn = b.est.kind === "net" ? b.est.net : -1;
      return bn - an;
    });
}

/* ------------------------------------------------------------------ */
/* The tips library: how to sell smarter at each kind of venue.        */
/* Composed per venue from its `tips` on the profile page.             */
/* ------------------------------------------------------------------ */

export type TipKey = "they-price-it" | "slow-payout" | "do-it-yourself" | "protect-the-sale";

export interface Tip {
  key: TipKey;
  title: string;
  /** Short beats, each one action. Never a wall. */
  beats: string[];
  internal?: { href: string; label: string };
}

export const TIPS: Record<TipKey, Tip> = {
  "they-price-it": {
    key: "they-price-it",
    title: "They set the price, so anchor it before you send",
    beats: [
      "Look up the bag's current resale range first, so you know what a fair list price looks like.",
      "Ask whether your bag qualifies for a price-review or payout-range option before you ship.",
      "A low quote is easy to accept when you don't know the number. Know the number.",
    ],
    internal: { href: "/search", label: "Look up what your bag sells for" },
  },
  "slow-payout": {
    key: "slow-payout",
    title: "Consignment pays after it sells, not today",
    beats: [
      "Your cut is only real once a buyer buys. Plan for weeks, sometimes longer for a slow style.",
      "If you need cash now, compare the instant-buyout quote against the consignment estimate.",
      "Taking store credit often adds a few percent. Worth it only if you were going to buy anyway.",
    ],
  },
  "do-it-yourself": {
    key: "do-it-yourself",
    title: "You're the photographer and the closer",
    beats: [
      "Shoot in daylight against a plain background: every angle, the hardware, the interior, the date code.",
      "Write the flaws in, not out. An accurate listing is the one that doesn't come back as a dispute.",
      "Ship insured and signature-required, and film the packing. It's your proof if a claim comes.",
    ],
  },
  "protect-the-sale": {
    key: "protect-the-sale",
    title: "No platform is protecting this, so you do",
    beats: [
      "Meet in a public place in daylight, ideally a police-station safe-exchange spot.",
      "Take cash or an instant bank transfer you can confirm in the moment. No checks, no 'I'll send it after'.",
      "Screenshot the buyer's profile and your whole message thread before you meet.",
    ],
  },
};

/**
 * The always-on tip, venue-independent: know the number before you sell anywhere.
 * Rendered on every profile; the internal link is the strategic one.
 */
export const PRICE_FIRST = {
  title: "Know the number before you send the bag",
  beats: [
    "Look up your bag's current resale median for its size and material. Our estimate, from recorded market prices.",
    "That number is your floor for judging any offer, quote, or list price. Everything else is negotiation.",
  ],
  internal: { href: "/search", label: "Look up your bag" },
} as const;

/** Tips for one venue, composed from its keys in display order. */
export function tipsFor(venue: SellVenueProfile): Tip[] {
  return venue.tips.map((k) => TIPS[k]);
}
