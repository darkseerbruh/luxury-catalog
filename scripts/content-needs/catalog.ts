/**
 * The DEMAND CATALOG for first-party photography — what the live site actually
 * needs a real photo of, and why. Every entry traces to a real surface in the
 * codebase (see each `provenance` string); this file is the single place to edit
 * when the site adds a new hero list, slideshow pairing, or cutout slot.
 *
 * The ranked "shoot next" list is COMPUTED, not hand-ordered: generate.ts scores
 * each need by how many surfaces it feeds (value) divided by what tier of Vivrelle
 * membership unlocks it (cost) = bang-for-buck. As captures land in captured.csv,
 * closed needs drop off the top automatically.
 *
 * Sources for each need:
 *  - HERO_STYLES ranked canon ............ src/lib/queries.ts:201-208
 *  - protective-feet hero styles ......... supabase/seed/seed-protective-feet.ts:40-155
 *  - compare-slideshow cutouts ........... tools/video-pipeline/scripts/make-compare-slideshow.py PAIRS
 *  - seeded auth-research heroes ......... supabase/seed/seed-hero-styles.ts + research/*.json
 *  - About-page parallax cutouts ......... src/app/about/AboutStory.tsx
 *  - live search demand .................. docs/data-content-worklist.md SEARCH-GAP POINTERS
 */

/** A surface the site renders a bag photo (or cutout) on. Weight = how much a
 *  photo here is worth. A cutout unblocks a BUILT content format with an empty
 *  wired file path, so it scores highest. */
export const SURFACE_WEIGHT = {
  slideshow_cutout: 3,
  seeded_auth: 2,
  protective_feet: 2,
  search_demand: 2,
  about_cutout: 1,
  social_recognition: 1,
} as const;

export type Surface = keyof typeof SURFACE_WEIGHT;

export const SURFACE_LABEL: Record<Surface, string> = {
  slideshow_cutout: "compare-slideshow cutout (wired, empty)",
  seeded_auth: "seeded auth-research hero",
  protective_feet: "protective-feet hero",
  search_demand: "live on-site search demand",
  about_cutout: "About-page cutout",
  social_recognition: "high social recognition",
};

/** Which Vivrelle tier unlocks the bag. Cost factor is the monthly price relative
 *  to Classique (~$139), so bang-for-buck rewards what the cheap tier already gives.
 *  Prices are from 2026 review sources (see doc header); confirm at checkout. */
export type Tier = "Classique" | "Couture" | "Reserve" | "Unconfirmed" | "NotCarried";

export const TIER_COST: Record<Tier, number> = {
  Classique: 1.0, // ~$139/mo
  Couture: 1.7, // ~$239/mo
  Reserve: 5.8, // ~$800/mo, invite-only
  Unconfirmed: 1.3, // brand carried, this model not confirmed live — small uncertainty penalty
  NotCarried: Infinity, // source elsewhere (owned / Fashionphile / UGC)
};

export const TIER_LABEL: Record<Tier, string> = {
  Classique: "Classique (~$139/mo)",
  Couture: "Couture (~$239/mo)",
  Reserve: "Réservé/Privée (~$800/mo, invite only)",
  Unconfirmed: "Brand carried, model unconfirmed",
  NotCarried: "Not via Vivrelle",
};

export interface Need {
  brand: string;
  style: string;
  /** 1-6 position in the homepage "It bags of all time" canon, if present. */
  homepageRank?: number;
  surfaces: Surface[];
  tier: Tier;
  /** The marquee spec a capture must match to FULLY close this need (e.g. the
   *  Neverfull everyone pictures is Monogram/Damier canvas, not Epi). A capture
   *  of an off-marquee variant is logged, but the need stays open. */
  preferredSpec?: RegExp;
  note?: string;
  provenance: string;
}

export const NEEDS: Need[] = [
  {
    brand: "Hermès",
    style: "Birkin",
    homepageRank: 1,
    surfaces: ["slideshow_cutout", "seeded_auth", "protective_feet", "about_cutout"],
    tier: "Reserve",
    provenance: "queries HERO_STYLES #1; slideshow PAIRS; seed-hero-styles; seed-protective-feet; AboutStory",
  },
  {
    brand: "Hermès",
    style: "Kelly",
    homepageRank: 2,
    surfaces: ["slideshow_cutout", "seeded_auth", "protective_feet", "about_cutout"],
    tier: "Reserve",
    provenance: "queries HERO_STYLES #2; slideshow PAIRS; seed-hero-styles; seed-protective-feet; AboutStory",
  },
  {
    brand: "Chanel",
    style: "Classic Flap",
    homepageRank: 3,
    surfaces: ["slideshow_cutout", "seeded_auth", "protective_feet", "about_cutout"],
    tier: "Couture",
    preferredSpec: /black/i,
    note: "Marquee = black caviar + gold hardware (the iridescent detail shot on file is off-marquee).",
    provenance: "queries HERO_STYLES #3; slideshow PAIRS; seed-hero-styles; seed-protective-feet; AboutStory chanel-flap",
  },
  {
    brand: "Louis Vuitton",
    style: "Speedy",
    homepageRank: 4,
    surfaces: ["slideshow_cutout", "about_cutout"],
    tier: "Classique",
    provenance: "queries HERO_STYLES #4; slideshow PAIRS lv-speedy; AboutStory lv-speedy",
  },
  {
    brand: "Dior",
    style: "Lady Dior",
    homepageRank: 5,
    surfaces: ["protective_feet", "about_cutout"],
    tier: "Classique",
    note: "Vivrelle carries Dior; confirm Lady Dior is live at Classique (Book Tote is the best-confirmed Dior).",
    provenance: "queries HERO_STYLES #5; seed-protective-feet; AboutStory lady-dior",
  },
  {
    brand: "Louis Vuitton",
    style: "Neverfull",
    homepageRank: 6,
    surfaces: ["slideshow_cutout", "protective_feet"],
    tier: "Classique",
    preferredSpec: /monogram|damier/i,
    note: "Marquee = Monogram/Damier canvas. Epi is a separate variant slot, not the iconic one.",
    provenance: "queries HERO_STYLES #6; slideshow PAIRS neverfull; seed-protective-feet",
  },
  {
    brand: "Louis Vuitton",
    style: "Alma",
    surfaces: ["protective_feet", "search_demand"],
    tier: "Classique",
    note: "Searched 'alma' ×3 to 2026-07-02 (PostHog) with no dedicated coverage.",
    provenance: "seed-protective-feet; worklist SEARCH-GAP 'alma' ×3",
  },
  {
    brand: "Goyard",
    style: "Saint Louis",
    surfaces: ["search_demand", "social_recognition"],
    tier: "Classique",
    note: "Only recorded search_not_found ('goyard', PostHog 2026-06-28); Vivrelle's Goyard depth is real.",
    provenance: "worklist SEARCH-GAP 'goyard'; archivist Vivrelle pull 2026-07-07 (product-confirmed)",
  },
  {
    brand: "Gucci",
    style: "GG Marmont",
    surfaces: ["seeded_auth"],
    tier: "Classique",
    provenance: "seed-hero-styles research/gucci-gg-marmont.json",
  },
  {
    brand: "Gucci",
    style: "Jackie 1961",
    surfaces: ["protective_feet"],
    tier: "Classique",
    provenance: "seed-protective-feet",
  },
  {
    brand: "Goyard",
    style: "Artois",
    surfaces: ["social_recognition"],
    tier: "Classique",
    provenance: "archivist Vivrelle pull 2026-07-07 (product-confirmed)",
  },
  {
    brand: "Louis Vuitton",
    style: "Pochette Métis",
    surfaces: ["social_recognition"],
    tier: "Classique",
    provenance: "archivist Vivrelle pull 2026-07-07 (product-confirmed)",
  },
  {
    brand: "Louis Vuitton",
    style: "OnTheGo",
    surfaces: ["social_recognition"],
    tier: "Classique",
    provenance: "archivist Vivrelle pull 2026-07-07 (snippet)",
  },
  {
    brand: "Chanel",
    style: "2.55 Reissue",
    surfaces: ["protective_feet"],
    tier: "Couture",
    provenance: "seed-protective-feet",
  },
  {
    brand: "Chanel",
    style: "Boy",
    surfaces: ["protective_feet"],
    tier: "Couture",
    provenance: "seed-protective-feet",
  },
  {
    brand: "Saint Laurent",
    style: "Sac de Jour",
    surfaces: ["protective_feet"],
    tier: "Unconfirmed",
    note: "Vivrelle has YSL Loulou/Kate; Sac de Jour not confirmed in the lineup.",
    provenance: "seed-protective-feet; archivist Vivrelle pull 2026-07-07 (unconfirmed model)",
  },
  {
    brand: "Bottega Veneta",
    style: "Cassette",
    surfaces: ["protective_feet"],
    tier: "Unconfirmed",
    note: "Vivrelle carries Bottega; Cassette model not individually confirmed.",
    provenance: "seed-protective-feet; archivist Vivrelle pull 2026-07-07 (unconfirmed model)",
  },
  {
    brand: "Hermès",
    style: "Bolide",
    surfaces: ["protective_feet"],
    tier: "Unconfirmed",
    provenance: "seed-protective-feet",
  },
  {
    brand: "Hermès",
    style: "Garden Party",
    surfaces: ["protective_feet"],
    tier: "Unconfirmed",
    provenance: "seed-protective-feet",
  },
  {
    brand: "Hermès",
    style: "Constance",
    surfaces: ["protective_feet"],
    tier: "Unconfirmed",
    provenance: "seed-protective-feet",
  },
  {
    brand: "Fendi",
    style: "Peekaboo",
    surfaces: ["about_cutout"],
    tier: "Classique",
    provenance: "AboutStory fendi-peekaboo",
  },
  {
    brand: "Coach",
    style: "Tabby",
    surfaces: ["seeded_auth"],
    tier: "NotCarried",
    note: "Coach not confirmed in Vivrelle; source via eBay/Poshmark or owned.",
    provenance: "seed-hero-styles research/coach-tabby.json",
  },
  {
    brand: "Coach",
    style: "Swagger",
    surfaces: ["seeded_auth"],
    tier: "NotCarried",
    note: "Coach not confirmed in Vivrelle; source via eBay/Poshmark or owned.",
    provenance: "seed-hero-styles (Swagger)",
  },
];

/** Sum of surface weights + a homepage-rank bonus (rank 1 = 6 pts … rank 6 = 1 pt). */
export function valueScore(need: Need): number {
  const surfaceValue = need.surfaces.reduce((sum, s) => sum + SURFACE_WEIGHT[s], 0);
  const rankBonus = need.homepageRank ? 7 - need.homepageRank : 0;
  return surfaceValue + rankBonus;
}

/** Bang-for-buck = value per relative rental dollar. Infinity cost → 0. */
export function bangForBuck(need: Need): number {
  const cost = TIER_COST[need.tier];
  return Number.isFinite(cost) ? valueScore(need) / cost : 0;
}
