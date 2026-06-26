import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "./supabase";
import { getSupabaseAdmin } from "./supabase/admin";
import { getInstagramOEmbed } from "./instagram";

export interface BrandOverview {
  brandId: number;
  name: string;
  tier: "thrift" | "mid" | "ultra-luxury";
  styleCount: number;
  /** Total catalogued variants across the brand's styles — our depth proxy for ranking. */
  variantCount: number;
  isLive: boolean;
  /** Up to 3 most-documented styles (by catalogued variant count), each with a representative variant id to link to its bag page. */
  topStyles: { styleId: number; name: string; variantId: number | null }[];
}

/** Display order for the brand directory: the tiers most people shop for lead. */
export const BRAND_TIER_RANK: Record<BrandOverview["tier"], number> = {
  "ultra-luxury": 0,
  mid: 1,
  thrift: 2,
};

/** Tier groups for the brand directory, in display order, with section labels. */
export const BRAND_TIERS: { key: BrandOverview["tier"]; label: string }[] = [
  { key: "ultra-luxury", label: "Ultra-luxury" },
  { key: "mid", label: "Mid-tier" },
  { key: "thrift", label: "Thrift & contemporary" },
];

export interface HeroCard {
  styleId: number;
  styleName: string;
  brandName: string;
  variantId: number | null;
  sizeLabel: string | null;
  priceFrom: number | null;
  currency: string | null;
}

export interface StyleSearchResult {
  styleId: number;
  styleName: string;
  brandName: string;
  variants: {
    variantId: number;
    sizeLabel: string | null;
    exteriorColorway: string | null;
    hardwareColor: string | null;
  }[];
}

export interface BrandSearchResult {
  brandId: number;
  name: string;
  tier: "thrift" | "mid" | "ultra-luxury";
  variantCount: number;
  /** Styles under the brand, each with a representative variant id to link to its bag page. */
  styles: { styleId: number; name: string; variantId: number | null }[];
}

export interface SearchResults {
  brands: BrandSearchResult[];
  styles: StyleSearchResult[];
  /** Human-readable summary of how a natural-language query was interpreted, for display above results. */
  interpreted: string[];
  /** True when the query was parsed by Claude into structured filters rather than treated as a plain name match. */
  usedNaturalLanguage: boolean;
}

type StyleWithVariants = {
  style_id: number;
  name: string;
  variant: { variant_id: number }[] | null;
};

/** Supabase types parent embeds (e.g. `brand:brand_id(name)`) as an array even though the relation is one-to-one. */
function embeddedName(relation: unknown): string {
  const row = Array.isArray(relation) ? relation[0] : relation;
  return (row as { name?: string } | null | undefined)?.name ?? "";
}

/**
 * Each house's signature styles, in iconic order, from the owner-approved
 * permanent-collection backbone (`supabase/seed/research/catalog-backbone.json`,
 * tier 1 = perennial icons). Used to lead the homepage brand directory with the
 * styles people actually come for (Neverfull, Birkin, Classic Flap) instead of
 * whatever breadth seeding happened to catalogue deepest. This is owner-curated
 * editorial order, not a popularity stat we don't have — so the UI never claims
 * "most popular," it just surfaces the house's signatures first.
 */
const SIGNATURE_STYLES: Record<string, string[]> = {
  Hermès: ["Birkin", "Kelly", "Constance", "Evelyne", "Garden Party", "Picotin Lock", "Bolide", "Lindy", "Herbag"],
  Chanel: ["Classic Flap", "2.55 Reissue", "Boy", "Chanel 19", "Gabrielle", "Wallet on Chain", "Coco Handle"],
  "Louis Vuitton": ["Neverfull", "Speedy", "Alma", "NéoNoé", "Capucines", "OnTheGo", "Pochette Métis", "Twist"],
  Gucci: ["GG Marmont", "Dionysus", "Jackie 1961", "Horsebit 1955", "Ophidia", "Bamboo 1947"],
  Dior: ["Lady Dior", "Saddle", "Book Tote", "30 Montaigne", "Caro"],
  "Saint Laurent": ["Loulou", "Sac de Jour", "Kate", "Niki", "Lou Camera", "College", "Cassandre Envelope"],
  "Bottega Veneta": ["Cassette", "Jodie", "The Pouch", "Andiamo", "Arco", "Loop"],
  Fendi: ["Baguette", "Peekaboo", "Sunshine Shopper", "First", "Mon Trésor"],
  Celine: ["Triomphe", "Luggage Tote", "Belt Bag", "Classic Box", "Ava", "16 (Sixteen)"],
  Prada: ["Galleria", "Re-Edition", "Cleo"],
  Coach: ["Tabby", "Rogue", "Willow", "Pillow Tabby", "Brooklyn"],
  Loewe: ["Puzzle", "Hammock", "Flamenco", "Gate", "Goya", "Amazona"],
};

/** Position of a style within its house's signature list, or Infinity if it isn't a signature. */
function signatureRank(brandName: string, styleName: string): number {
  const icons = SIGNATURE_STYLES[brandName];
  if (!icons) return Infinity;
  const i = icons.findIndex((s) => s.toLowerCase() === styleName.trim().toLowerCase());
  return i === -1 ? Infinity : i;
}

/** Brands with whether they have at least one fully-detailed variant ("live") vs. breadth-only stub styles ("coming soon"). */
export async function getBrandsOverview(): Promise<BrandOverview[]> {
  const { data, error } = await getSupabase()
    .from("brand")
    .select("brand_id, name, tier, style(style_id, name, variant(variant_id))");

  if (error || !data) return [];

  const brands = data.map((brand) => {
    const styles = (brand.style ?? []) as StyleWithVariants[];
    const variantCount = styles.reduce((n, s) => n + (s.variant ?? []).length, 0);
    // "Top" styles = the house's signature icons first (owner-curated backbone
    // order), then the most-documented remaining styles (deepest variant
    // coverage), with name as a stable tiebreak. Surfaces what people come for
    // (Neverfull, Birkin) and what we know best, never a popularity claim.
    const topStyles = [...styles]
      .sort((a, b) => {
        const ra = signatureRank(brand.name, a.name);
        const rb = signatureRank(brand.name, b.name);
        if (ra !== rb) return ra - rb;
        return (
          (b.variant ?? []).length - (a.variant ?? []).length ||
          a.name.localeCompare(b.name)
        );
      })
      .slice(0, 3)
      .map((s) => ({
        styleId: s.style_id,
        name: s.name,
        variantId: (s.variant ?? [])[0]?.variant_id ?? null,
      }));
    return {
      brandId: brand.brand_id,
      name: brand.name,
      tier: brand.tier as BrandOverview["tier"],
      styleCount: styles.length,
      variantCount,
      isLive: styles.some((s) => (s.variant ?? []).length > 0),
      topStyles,
    };
  });

  // Rank by tier (ultra-luxury first), then by catalogue depth, then name — so the
  // brands most people come for lead, not whatever sorts first alphabetically.
  return brands.sort(
    (a, b) =>
      BRAND_TIER_RANK[a.tier] - BRAND_TIER_RANK[b.tier] ||
      b.variantCount - a.variantCount ||
      a.name.localeCompare(b.name)
  );
}

const HERO_STYLES: { brand: string; style: string }[] = [
  { brand: "Chanel", style: "Classic Flap" },
  { brand: "Hermès", style: "Birkin" },
  { brand: "Hermès", style: "Kelly" },
  { brand: "Coach", style: "Tabby" },
  { brand: "Coach", style: "Swagger" },
];

/** "It bags of all time" carousel — real seeded hero styles only, no invented ratings or review counts. */
export async function getHeroCarousel(): Promise<HeroCard[]> {
  const { data, error } = await getSupabase()
    .from("style")
    .select(
      "style_id, name, brand:brand_id(name), variant(variant_id, size_label, retail_price_original, currency)"
    )
    .in(
      "name",
      HERO_STYLES.map((h) => h.style)
    );

  if (error || !data) return [];

  const cards = data
    .filter((row) =>
      HERO_STYLES.some((h) => h.style === row.name && h.brand === embeddedName(row.brand))
    )
    .map((row) => {
      const variants = row.variant ?? [];
      const priced = variants.filter((v) => v.retail_price_original != null);
      const cheapest = priced.sort(
        (a, b) => Number(a.retail_price_original) - Number(b.retail_price_original)
      )[0];
      const primary = cheapest ?? variants[0];
      return {
        styleId: row.style_id,
        styleName: row.name,
        brandName: embeddedName(row.brand),
        variantId: primary?.variant_id ?? null,
        sizeLabel: cheapest?.size_label ?? variants[0]?.size_label ?? null,
        priceFrom: cheapest ? Number(cheapest.retail_price_original) : null,
        currency: cheapest?.currency ?? null,
      };
    });

  const order = HERO_STYLES.map((h) => `${h.brand}:${h.style}`);
  cards.sort(
    (a, b) =>
      order.indexOf(`${a.brandName}:${a.styleName}`) -
      order.indexOf(`${b.brandName}:${b.styleName}`)
  );
  return cards;
}

export interface VariantDetail {
  variantId: number;
  sizeLabel: string | null;
  sizeCategory: string | null;
  constructionMethod: string | null;
  rigidity: string | null;
  exteriorColorway: string | null;
  hardwareColor: string | null;
  hardwareType: string | null;
  strapType: string | null;
  strapAttachmentType: string | null;
  interiorColor: string | null;
  stitchingColor: string | null;
  marketAvailability: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  stillInProduction: boolean;
  retailPriceOriginal: number | null;
  currency: string | null;
  authenticationMarkers: string | null;
  createdAt: string | null;
  style: {
    styleId: number;
    name: string;
    silhouette: string | null;
    closureType: string | null;
    yearIntroduced: number | null;
    description: string | null;
  };
  brand: {
    brandId: number;
    name: string;
    tier: string;
  };
  exteriorMaterial: {
    name: string;
    materialType: string;
    waterResistance: string | null;
    scratchResistance: string | null;
    weatherFriendliness: string | null;
    hardinessOverall: string | null;
    careNotes: string | null;
    authenticationNotes: string | null;
  } | null;
  interiorMaterial: {
    name: string;
    materialType: string;
  } | null;
  productionRecords: {
    productionId: number;
    countryOfManufacture: string | null;
    productionYear: number | null;
    productionSeason: string | null;
    dimensionsHCm: number | null;
    dimensionsWCm: number | null;
    dimensionsDCm: number | null;
    openingWidthCm: number | null;
    dateCodeFormat: string | null;
    stampPlacement: string | null;
    stampFontNotes: string | null;
    knownAuthenticationMarkers: string | null;
    sources: string | null;
    confidenceLevel: string;
  }[];
  knownColorCombinations: {
    combinationId: number;
    exteriorColor: string | null;
    interiorColor: string | null;
    stitchingColor: string | null;
    hardwareColor: string | null;
    produced: boolean;
    yearRange: string | null;
    authenticationNotes: string | null;
    confidenceLevel: string;
  }[];
  carryMethods: {
    carryId: number;
    carryType: string;
    possible: string;
    strapDropLengthCm: number | null;
    strapAdjustable: boolean | null;
    notes: string | null;
    verified: boolean;
  }[];
  fits: {
    fitsId: number;
    itemName: string;
    fits: string;
    notes: string | null;
    verified: boolean;
  }[];
  interiorStorage: {
    storageId: number;
    featureType: string;
    quantity: number;
    placement: string | null;
    sizeNotes: string | null;
    authenticationNotes: string | null;
    verified: boolean;
  }[];
  serialTags: {
    tagId: number;
    tagType: string;
    format: string | null;
    placement: string | null;
    yearRange: string | null;
    howToRead: string | null;
    authenticationNotes: string | null;
    confidenceLevel: string;
    verified: boolean;
  }[];
  lockAndKey: {
    lockId: number;
    includesLock: boolean;
    lockType: string | null;
    lockMaterial: string | null;
    lockEngraving: string | null;
    engravingFormat: string | null;
    numberOfKeys: number | null;
    keyType: string | null;
    clochettIncluded: boolean | null;
    clochetteMaterial: string | null;
    missingLockValueImpact: string | null;
    authenticationNotes: string | null;
    verified: boolean;
  }[];
  provenance: {
    provenanceId: number;
    itemType: string;
    includedNew: boolean | null;
    description: string | null;
    material: string | null;
    color: string | null;
    branding: string | null;
    authenticationNotes: string | null;
    valueImpactIfMissing: string | null;
    verified: boolean;
  }[];
  priceHistory: {
    priceId: number;
    platform: string | null;
    condition: string | null;
    provenanceCompleteness: string | null;
    salePrice: number | null;
    currency: string | null;
    dateRecorded: string;
    priceType: string | null;
    observedOn: string | null;
    sourceUrl: string | null;
  }[];
}

export async function getVariantDetail(variantId: number): Promise<VariantDetail | null> {
  const { data, error } = await getSupabase()
    .from("variant")
    .select(`
      variant_id,
      size_label,
      size_category,
      construction_method,
      rigidity,
      exterior_colorway,
      hardware_color,
      hardware_type,
      strap_type,
      strap_attachment_type,
      interior_color,
      stitching_color,
      market_availability,
      year_start,
      year_end,
      still_in_production,
      retail_price_original,
      currency,
      authentication_markers,
      created_at,
      style:style_id(
        style_id, name, silhouette, closure_type, year_introduced, description,
        brand:brand_id(brand_id, name, tier)
      ),
      exterior_material:exterior_material_id(
        name, material_type, water_resistance, scratch_resistance,
        weather_friendliness, hardiness_overall, care_notes, authentication_notes
      ),
      interior_material:interior_material_id(name, material_type),
      production_record(
        production_id, country_of_manufacture, production_year, production_season,
        dimensions_h_cm, dimensions_w_cm, dimensions_d_cm, opening_width_cm,
        date_code_format, stamp_placement, stamp_font_notes,
        known_authentication_markers, sources, confidence_level
      ),
      known_color_combination(
        combination_id, exterior_color, interior_color, stitching_color,
        hardware_color, produced, year_range, authentication_notes, confidence_level
      ),
      carry_method(
        carry_id, carry_type, possible, strap_drop_length_cm,
        strap_adjustable, notes, verified
      ),
      fits(fits_id, item_name, fits, notes, verified),
      interior_storage(
        storage_id, feature_type, quantity, placement,
        size_notes, authentication_notes, verified
      ),
      serial_tag(
        tag_id, tag_type, format, placement, year_range,
        how_to_read, authentication_notes, confidence_level, verified
      ),
      lock_and_key(
        lock_id, includes_lock, lock_type, lock_material, lock_engraving,
        engraving_format, number_of_keys, key_type, clochette_included,
        clochette_material, missing_lock_value_impact, authentication_notes, verified
      ),
      provenance_packaging(
        provenance_id, item_type, included_new, description, material,
        color, branding, authentication_notes, value_impact_if_missing, verified
      ),
      price_history(
        price_id, platform, condition, provenance_completeness,
        sale_price, currency, date_recorded, price_type, observed_on, source_url
      )
    `)
    .eq("variant_id", variantId)
    .single();

  if (error || !data) return null;

  const style = (Array.isArray(data.style) ? data.style[0] : data.style) as {
    style_id: number; name: string; silhouette: string | null;
    closure_type: string | null; year_introduced: number | null; description: string | null;
    brand: { brand_id: number; name: string; tier: string } | { brand_id: number; name: string; tier: string }[] | null;
  } | null;

  const brand = style ? (Array.isArray(style.brand) ? style.brand[0] : style.brand) : null;

  const extMat = (Array.isArray(data.exterior_material) ? data.exterior_material[0] : data.exterior_material) as {
    name: string; material_type: string; water_resistance: string | null;
    scratch_resistance: string | null; weather_friendliness: string | null;
    hardiness_overall: string | null; care_notes: string | null; authentication_notes: string | null;
  } | null;

  const intMat = (Array.isArray(data.interior_material) ? data.interior_material[0] : data.interior_material) as {
    name: string; material_type: string;
  } | null;

  return {
    variantId: data.variant_id,
    sizeLabel: data.size_label,
    sizeCategory: data.size_category,
    constructionMethod: data.construction_method,
    rigidity: data.rigidity,
    exteriorColorway: data.exterior_colorway,
    hardwareColor: data.hardware_color,
    hardwareType: data.hardware_type,
    strapType: data.strap_type,
    strapAttachmentType: data.strap_attachment_type,
    interiorColor: data.interior_color,
    stitchingColor: data.stitching_color,
    marketAvailability: data.market_availability,
    yearStart: data.year_start,
    yearEnd: data.year_end,
    stillInProduction: data.still_in_production,
    retailPriceOriginal: data.retail_price_original != null ? Number(data.retail_price_original) : null,
    currency: data.currency,
    authenticationMarkers: data.authentication_markers,
    createdAt: data.created_at ?? null,
    style: style ? {
      styleId: style.style_id,
      name: style.name,
      silhouette: style.silhouette,
      closureType: style.closure_type,
      yearIntroduced: style.year_introduced,
      description: style.description,
    } : { styleId: 0, name: "", silhouette: null, closureType: null, yearIntroduced: null, description: null },
    brand: brand ? {
      brandId: brand.brand_id,
      name: brand.name,
      tier: brand.tier,
    } : { brandId: 0, name: "", tier: "" },
    exteriorMaterial: extMat ? {
      name: extMat.name,
      materialType: extMat.material_type,
      waterResistance: extMat.water_resistance,
      scratchResistance: extMat.scratch_resistance,
      weatherFriendliness: extMat.weather_friendliness,
      hardinessOverall: extMat.hardiness_overall,
      careNotes: extMat.care_notes,
      authenticationNotes: extMat.authentication_notes,
    } : null,
    interiorMaterial: intMat ? { name: intMat.name, materialType: intMat.material_type } : null,
    productionRecords: (data.production_record ?? []).map((r) => ({
      productionId: r.production_id,
      countryOfManufacture: r.country_of_manufacture,
      productionYear: r.production_year,
      productionSeason: r.production_season,
      dimensionsHCm: r.dimensions_h_cm != null ? Number(r.dimensions_h_cm) : null,
      dimensionsWCm: r.dimensions_w_cm != null ? Number(r.dimensions_w_cm) : null,
      dimensionsDCm: r.dimensions_d_cm != null ? Number(r.dimensions_d_cm) : null,
      openingWidthCm: r.opening_width_cm != null ? Number(r.opening_width_cm) : null,
      dateCodeFormat: r.date_code_format,
      stampPlacement: r.stamp_placement,
      stampFontNotes: r.stamp_font_notes,
      knownAuthenticationMarkers: r.known_authentication_markers,
      sources: r.sources ?? null,
      confidenceLevel: r.confidence_level,
    })),
    knownColorCombinations: (data.known_color_combination ?? []).map((c) => ({
      combinationId: c.combination_id,
      exteriorColor: c.exterior_color,
      interiorColor: c.interior_color,
      stitchingColor: c.stitching_color,
      hardwareColor: c.hardware_color,
      produced: c.produced,
      yearRange: c.year_range,
      authenticationNotes: c.authentication_notes,
      confidenceLevel: c.confidence_level,
    })),
    carryMethods: (data.carry_method ?? []).map((c) => ({
      carryId: c.carry_id,
      carryType: c.carry_type,
      possible: c.possible,
      strapDropLengthCm: c.strap_drop_length_cm != null ? Number(c.strap_drop_length_cm) : null,
      strapAdjustable: c.strap_adjustable,
      notes: c.notes,
      verified: c.verified,
    })),
    fits: (data.fits ?? []).map((f) => ({
      fitsId: f.fits_id,
      itemName: f.item_name,
      fits: f.fits,
      notes: f.notes,
      verified: f.verified,
    })),
    interiorStorage: (data.interior_storage ?? []).map((s) => ({
      storageId: s.storage_id,
      featureType: s.feature_type,
      quantity: s.quantity,
      placement: s.placement,
      sizeNotes: s.size_notes,
      authenticationNotes: s.authentication_notes,
      verified: s.verified,
    })),
    serialTags: (data.serial_tag ?? []).map((t) => ({
      tagId: t.tag_id,
      tagType: t.tag_type,
      format: t.format,
      placement: t.placement,
      yearRange: t.year_range,
      howToRead: t.how_to_read,
      authenticationNotes: t.authentication_notes,
      confidenceLevel: t.confidence_level,
      verified: t.verified,
    })),
    lockAndKey: (data.lock_and_key ?? []).map((l) => ({
      lockId: l.lock_id,
      includesLock: l.includes_lock,
      lockType: l.lock_type,
      lockMaterial: l.lock_material,
      lockEngraving: l.lock_engraving,
      engravingFormat: l.engraving_format,
      numberOfKeys: l.number_of_keys,
      keyType: l.key_type,
      clochettIncluded: l.clochette_included,
      clochetteMaterial: l.clochette_material,
      missingLockValueImpact: l.missing_lock_value_impact,
      authenticationNotes: l.authentication_notes,
      verified: l.verified,
    })),
    provenance: (data.provenance_packaging ?? []).map((p) => ({
      provenanceId: p.provenance_id,
      itemType: p.item_type,
      includedNew: p.included_new,
      description: p.description,
      material: p.material,
      color: p.color,
      branding: p.branding,
      authenticationNotes: p.authentication_notes,
      valueImpactIfMissing: p.value_impact_if_missing,
      verified: p.verified,
    })),
    priceHistory: (data.price_history ?? []).map((h) => ({
      priceId: h.price_id,
      platform: h.platform,
      condition: h.condition,
      provenanceCompleteness: h.provenance_completeness,
      salePrice: h.sale_price != null ? Number(h.sale_price) : null,
      currency: h.currency,
      dateRecorded: h.date_recorded,
      priceType: h.price_type ?? null,
      observedOn: h.observed_on ?? null,
      sourceUrl: h.source_url ?? null,
    })),
  };
}

/** One resale row carrying a per-listing production year (from migration 0022). */
export interface EraComp {
  productionYear: number;
  salePrice: number;
  currency: string | null;
  platform: string | null;
  condition: string | null;
  priceType: string | null;
  sourceUrl: string | null;
}

/**
 * Resale rows that carry a per-listing `production_year` (populated by migration
 * 0022 + the LLM spec-extraction pass). RESILIENT — catches any DB error (including
 * "column does not exist" from a pre-0022 environment) and returns [] so the live
 * page never 404s. The era lens in ValueModule degrades to the gauge when this is
 * empty or has fewer than 2 populated era bands.
 */
export async function getVariantEraComps(variantId: number): Promise<EraComp[]> {
  try {
    const { data, error } = await getSupabase()
      .from("price_history")
      .select("production_year, sale_price, currency, platform, condition, price_type, source_url")
      .eq("variant_id", variantId)
      .not("production_year", "is", null)
      .not("sale_price", "is", null);
    if (error || !data) return [];
    const RETAIL_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;
    return (data as {
      production_year: number | null;
      sale_price: number | string | null;
      currency: string | null;
      platform: string | null;
      condition: string | null;
      price_type: string | null;
      source_url: string | null;
    }[])
      .filter((r) => r.production_year != null && r.sale_price != null)
      .filter((r) => !(r.price_type === "retail_msrp" || (r.price_type == null && r.platform != null && RETAIL_RX.test(r.platform))))
      .map((r) => ({
        productionYear: r.production_year as number,
        salePrice: Number(r.sale_price),
        currency: r.currency,
        platform: r.platform,
        condition: r.condition,
        priceType: r.price_type,
        sourceUrl: r.source_url,
      }));
  } catch {
    // pre-0022: production_year column absent — degrade gracefully
    return [];
  }
}

export interface StyleVariantOption {
  variantId: number;
  sizeLabel: string | null;
  sizeCategory: string | null;
  exteriorColorway: string | null;
  hardwareColor: string | null;
}

/**
 * Sibling variants of a style — powers the Amazon-style variant selector on the
 * bag page (pick a colourway / size / hardware), while each variant keeps its own
 * indexable /bag/[id] URL for GEO.
 */
export async function getStyleVariants(styleId: number): Promise<StyleVariantOption[]> {
  const { data, error } = await getSupabase()
    .from("variant")
    .select("variant_id, size_label, size_category, exterior_colorway, hardware_color")
    .eq("style_id", styleId)
    .order("variant_id");
  if (error || !data) return [];
  return data.map((v) => ({
    variantId: v.variant_id,
    sizeLabel: v.size_label,
    sizeCategory: v.size_category,
    exteriorColorway: v.exterior_colorway,
    hardwareColor: v.hardware_color,
  }));
}

/**
 * Primary image URLs for a set of variants, keyed by variant id. RESILIENT: if the
 * `image_url` column doesn't exist yet (migration 0013 not applied) or the query
 * fails, it returns {} so callers fall back to the BagImage placeholder — it never
 * breaks a page. Real photos appear once 0013 is applied and URLs are populated.
 */
export async function getVariantImages(variantIds: number[]): Promise<Record<number, string>> {
  const ids = Array.from(new Set(variantIds.filter((n) => Number.isFinite(n))));
  if (ids.length === 0) return {};
  try {
    const { data, error } = await getSupabase()
      .from("variant")
      .select("variant_id, image_url")
      .in("variant_id", ids);
    if (error || !data) return {};
    const map: Record<number, string> = {};
    for (const r of data as { variant_id: number; image_url: string | null }[]) {
      if (r.image_url) map[r.variant_id] = r.image_url;
    }
    return map;
  } catch {
    return {};
  }
}

export interface BrandResaleStats {
  highestSale: number | null;
  currency: string | null;
  recordedSales: number;
  avgSale: number | null;
  /** "up" | "down" | "flat" | null — compare oldest half vs newest half of sales */
  trend: "up" | "down" | "flat" | null;
}

/**
 * Brand-level resale market stats from price_history (RESILIENT — returns zeros on
 * any error, e.g. if the embedded filter isn't supported, so the brand page never
 * breaks). Excludes retail/boutique/MSRP rows so "highest sale" is a real
 * secondary-market figure, honestly "the highest we've recorded".
 */
export async function getBrandResaleStats(brandId: number): Promise<BrandResaleStats> {
  const EMPTY: BrandResaleStats = { highestSale: null, currency: null, recordedSales: 0, avgSale: null, trend: null };
  try {
    const { data, error } = await getSupabase()
      .from("price_history")
      .select("sale_price, currency, platform, date_recorded, variant:variant_id!inner(style:style_id!inner(brand_id))")
      .eq("variant.style.brand_id", brandId)
      .not("sale_price", "is", null);
    if (error || !data) return EMPTY;
    const RETAIL = /retail|boutique|msrp|in[-\s]?store|flagship/i;
    const resale = (data as { sale_price: number | string | null; currency: string | null; platform: string | null; date_recorded: string | null }[]).filter(
      (r) => r.sale_price != null && !(r.platform && RETAIL.test(r.platform)),
    );
    if (resale.length === 0) return EMPTY;
    let top = resale[0];
    for (const r of resale) if (Number(r.sale_price) > Number(top.sale_price)) top = r;

    // avgSale
    const sum = resale.reduce((acc, r) => acc + Number(r.sale_price), 0);
    const avgSale = sum / resale.length;

    // trend: split by date_recorded if available
    let trend: "up" | "down" | "flat" | null = null;
    const dated = resale.filter((r) => r.date_recorded != null) as { sale_price: number | string | null; date_recorded: string }[];
    if (dated.length >= 2) {
      dated.sort((a, b) => a.date_recorded.localeCompare(b.date_recorded));
      const half = Math.floor(dated.length / 2);
      const oldHalf = dated.slice(0, half);
      const newHalf = dated.slice(dated.length - half);
      const avgOld = oldHalf.reduce((a, r) => a + Number(r.sale_price), 0) / oldHalf.length;
      const avgNew = newHalf.reduce((a, r) => a + Number(r.sale_price), 0) / newHalf.length;
      if (avgNew > avgOld * 1.05) trend = "up";
      else if (avgNew < avgOld * 0.95) trend = "down";
      else trend = "flat";
    }

    return { highestSale: Number(top.sale_price), currency: top.currency, recordedSales: resale.length, avgSale, trend };
  } catch {
    return EMPTY;
  }
}

export interface BrandDetail {
  brandId: number;
  name: string;
  tier: string;
  countryOfOrigin: string | null;
  foundedYear: number | null;
  description: string | null;
  styles: {
    styleId: number;
    name: string;
    silhouette: string | null;
    yearIntroduced: number | null;
    discontinued: boolean;
    variants: {
      variantId: number;
      sizeLabel: string | null;
      exteriorColorway: string | null;
      hardwareColor: string | null;
      material: string | null;
      retailPrice: number | null;
      currency: string | null;
    }[];
  }[];
}

export async function getBrandDetail(brandId: number): Promise<BrandDetail | null> {
  const { data, error } = await getSupabase()
    .from("brand")
    .select(
      "brand_id, name, tier, country_of_origin, founded_year, description, style(style_id, name, silhouette, year_introduced, discontinued, variant(variant_id, size_label, exterior_colorway, hardware_color, retail_price_original, currency, exterior_material:exterior_material_id(name)))"
    )
    .eq("brand_id", brandId)
    .single();

  if (error || !data) return null;

  const styles = ((data.style ?? []) as {
    style_id: number; name: string; silhouette: string | null;
    year_introduced: number | null; discontinued: boolean;
    variant: {
      variant_id: number; size_label: string | null; exterior_colorway: string | null;
      hardware_color: string | null; retail_price_original: number | null; currency: string | null;
      exterior_material: { name: string } | { name: string }[] | null;
    }[] | null;
  }[]).map((s) => ({
    styleId: s.style_id,
    name: s.name,
    silhouette: s.silhouette,
    yearIntroduced: s.year_introduced,
    discontinued: s.discontinued,
    variants: (s.variant ?? []).map((v) => ({
      variantId: v.variant_id,
      sizeLabel: v.size_label,
      exteriorColorway: v.exterior_colorway,
      hardwareColor: v.hardware_color,
      material:
        (Array.isArray(v.exterior_material) ? v.exterior_material[0] : v.exterior_material)?.name ??
        null,
      retailPrice: v.retail_price_original != null ? Number(v.retail_price_original) : null,
      currency: v.currency,
    })),
  }));

  return {
    brandId: data.brand_id,
    name: data.name,
    tier: data.tier,
    countryOfOrigin: data.country_of_origin,
    foundedYear: data.founded_year,
    description: data.description,
    styles,
  };
}

export interface BrowseVariant {
  variantId: number;
  sizeLabel: string | null;
  exteriorColorway: string | null;
  hardwareColor: string | null;
  styleName: string;
  brandName: string;
  contextNote: string | null;
}

export async function getVariantsByCarry(carrySlug: string): Promise<BrowseVariant[]> {
  const { data, error } = await getSupabase()
    .from("carry_method")
    .select(
      "carry_type, possible, notes, strap_drop_length_cm, variant:variant_id(variant_id, size_label, exterior_colorway, hardware_color, style:style_id(name, brand:brand_id(name)))"
    )
    .ilike("carry_type", `%${carrySlug.replace(/-/g, " ")}%`)
    .neq("possible", "no")
    .limit(50);

  if (error || !data) return [];

  return data.flatMap((row) => {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) as {
      variant_id: number; size_label: string | null; exterior_colorway: string | null; hardware_color: string | null;
      style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
    } | null;
    if (!v) return [];
    const style = (Array.isArray(v.style) ? v.style[0] : v.style) as { name: string; brand: { name: string } | { name: string }[] | null } | null;
    if (!style) return [];
    const brandName = embeddedName(style.brand);
    const note = [
      row.strap_drop_length_cm ? `${row.strap_drop_length_cm} cm drop` : null,
      row.possible === "depends" ? "depends on configuration" : null,
      row.notes,
    ].filter(Boolean).join(" · ");
    return [{
      variantId: v.variant_id,
      sizeLabel: v.size_label,
      exteriorColorway: v.exterior_colorway,
      hardwareColor: v.hardware_color,
      styleName: style.name,
      brandName,
      contextNote: note || null,
    }];
  });
}

export async function getVariantsByFits(itemSlug: string): Promise<BrowseVariant[]> {
  const searchTerm = itemSlug.replace(/-/g, " ");
  const { data, error } = await getSupabase()
    .from("fits")
    .select(
      "item_name, fits, notes, variant:variant_id(variant_id, size_label, exterior_colorway, hardware_color, style:style_id(name, brand:brand_id(name)))"
    )
    .ilike("item_name", `%${searchTerm}%`)
    .neq("fits", "no")
    .limit(50);

  if (error || !data) return [];

  return data.flatMap((row) => {
    const v = (Array.isArray(row.variant) ? row.variant[0] : row.variant) as {
      variant_id: number; size_label: string | null; exterior_colorway: string | null; hardware_color: string | null;
      style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
    } | null;
    if (!v) return [];
    const style = (Array.isArray(v.style) ? v.style[0] : v.style) as { name: string; brand: { name: string } | { name: string }[] | null } | null;
    if (!style) return [];
    const brandName = embeddedName(style.brand);
    const note = [
      row.fits === "tight" ? "tight fit" : null,
      row.notes,
    ].filter(Boolean).join(" · ");
    return [{
      variantId: v.variant_id,
      sizeLabel: v.size_label,
      exteriorColorway: v.exterior_colorway,
      hardwareColor: v.hardware_color,
      styleName: style.name,
      brandName,
      contextNote: note || null,
    }];
  });
}

// ============ Natural-language search ============

/** Structured filters extracted from a free-text query by Claude. */
export interface SearchFilters {
  brands: string[];
  styles: string[];
  silhouettes: string[];
  sizeCategories: string[];
  colors: string[];
  materials: string[];
  hardwareColors: string[];
  carryTypes: string[];
  maxWidthCm: number | null;
  minWidthCm: number | null;
  keywords: string[];
}

const SEARCH_PARSE_PROMPT = `You convert a shopper's natural-language designer-handbag search into structured filters for a catalog query.

Respond with a JSON object ONLY (no markdown, no surrounding text), with exactly these keys:
{
  "brands": ["brand names mentioned, e.g. Chanel, Hermès, Coach"],
  "styles": ["style/model names mentioned, e.g. Birkin, Classic Flap, Tabby"],
  "silhouettes": ["zero or more of: structured, semi-structured, slouchy, box, hobo, clutch, belt bag, tote"],
  "sizeCategories": ["zero or more of: mini, small, medium, large, oversized"],
  "colors": ["plain color words, e.g. black, caramel, gold"],
  "materials": ["zero or more of: leather, exotic, fabric, coated canvas"],
  "hardwareColors": ["e.g. gold, silver, ruthenium, palladium"],
  "carryTypes": ["zero or more of: crossbody, shoulder, crossbody chest, belt bag waist, top handle wrist, top handle crook of arm, hand clutch, backpack"],
  "maxWidthCm": number or null,
  "minWidthCm": number or null,
  "keywords": ["any remaining meaningful descriptive words not captured above"]
}

Rules:
- Only use values from the fixed lists where one is given. If nothing fits a field, use [] (or null for widths).
- Convert any width given in inches to centimeters (1 inch = 2.54 cm) and put it in maxWidthCm/minWidthCm. "under/less than 10 inches wide" -> maxWidthCm 25.4. "at least 12 inches" -> minWidthCm 30.48.
- Do not invent brands or styles that are not implied by the query.
- Lowercase everything except brand and style names.`;

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizeFilters(parsed: Record<string, unknown>): SearchFilters {
  return {
    brands: asStringArray(parsed.brands),
    styles: asStringArray(parsed.styles),
    silhouettes: asStringArray(parsed.silhouettes).map((s) => s.toLowerCase()),
    sizeCategories: asStringArray(parsed.sizeCategories).map((s) => s.toLowerCase()),
    colors: asStringArray(parsed.colors).map((s) => s.toLowerCase()),
    materials: asStringArray(parsed.materials).map((s) => s.toLowerCase()),
    hardwareColors: asStringArray(parsed.hardwareColors).map((s) => s.toLowerCase()),
    carryTypes: asStringArray(parsed.carryTypes).map((s) => s.toLowerCase()),
    maxWidthCm: asNumber(parsed.maxWidthCm),
    minWidthCm: asNumber(parsed.minWidthCm),
    keywords: asStringArray(parsed.keywords).map((s) => s.toLowerCase()),
  };
}

/** Parse a free-text query into structured filters via Claude. Returns null if unavailable so callers can fall back to plain name matching. */
async function parseSearchQuery(query: string): Promise<SearchFilters | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: `${SEARCH_PARSE_PROMPT}\n\nSearch query: "${query}"` }],
    });
    const raw = (message.content[0] as { type: string; text: string }).text;
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    return normalizeFilters(JSON.parse(jsonText) as Record<string, unknown>);
  } catch (err) {
    console.error("Search parse error:", err);
    return null;
  }
}

function hasAttributeFilters(f: SearchFilters): boolean {
  return (
    f.styles.length > 0 || f.silhouettes.length > 0 || f.sizeCategories.length > 0 ||
    f.colors.length > 0 || f.materials.length > 0 || f.hardwareColors.length > 0 ||
    f.carryTypes.length > 0 || f.maxWidthCm != null || f.minWidthCm != null || f.keywords.length > 0
  );
}

function includesAny(haystack: string | null | undefined, needles: string[]): boolean {
  if (!haystack) return false;
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n) || n.includes(h));
}

/** Human-readable summary of the filters that were actually applied. */
function describeFilters(f: SearchFilters): string[] {
  const parts: string[] = [];
  if (f.styles.length) parts.push(f.styles.join(", "));
  if (f.silhouettes.length) parts.push(f.silhouettes.join(", "));
  if (f.sizeCategories.length) parts.push(`${f.sizeCategories.join("/")} size`);
  if (f.colors.length) parts.push(f.colors.join(", "));
  if (f.materials.length) parts.push(f.materials.join(", "));
  if (f.hardwareColors.length) parts.push(`${f.hardwareColors.join("/")} hardware`);
  if (f.carryTypes.length) parts.push(f.carryTypes.join(", "));
  if (f.maxWidthCm != null) parts.push(`under ${f.maxWidthCm.toFixed(1)} cm wide`);
  if (f.minWidthCm != null) parts.push(`over ${f.minWidthCm.toFixed(1)} cm wide`);
  if (f.keywords.length) parts.push(f.keywords.join(", "));
  return parts;
}

type VariantSearchRow = {
  variant_id: number;
  size_label: string | null;
  size_category: string | null;
  exterior_colorway: string | null;
  hardware_color: string | null;
  style: { style_id: number; name: string; silhouette: string | null; brand: { name: string } | { name: string }[] | null } | { style_id: number; name: string; silhouette: string | null; brand: { name: string } | { name: string }[] | null }[] | null;
  exterior_material: { name: string; material_type: string } | { name: string; material_type: string }[] | null;
  production_record: { dimensions_w_cm: number | null }[] | null;
  carry_method: { carry_type: string; possible: string }[] | null;
};

/** Variant-level search using the structured attribute filters, grouped into styles. */
async function searchVariantsByFilters(f: SearchFilters): Promise<StyleSearchResult[]> {
  const { data, error } = await getSupabase()
    .from("variant")
    .select(
      "variant_id, size_label, size_category, exterior_colorway, hardware_color, style:style_id(style_id, name, silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(name, material_type), production_record(dimensions_w_cm), carry_method(carry_type, possible)"
    )
    .limit(500);

  if (error || !data) return [];

  const grouped = new Map<number, StyleSearchResult>();

  for (const raw of data as VariantSearchRow[]) {
    const style = (Array.isArray(raw.style) ? raw.style[0] : raw.style) ?? null;
    if (!style) continue;
    const brandName = embeddedName(style.brand);
    const material = (Array.isArray(raw.exterior_material) ? raw.exterior_material[0] : raw.exterior_material) ?? null;
    const widths = (raw.production_record ?? [])
      .map((p) => (p.dimensions_w_cm != null ? Number(p.dimensions_w_cm) : null))
      .filter((w): w is number => w != null);

    // AND across categories, OR within each category. A variant must satisfy every specified filter.
    if (f.styles.length && !includesAny(style.name, f.styles.map((s) => s.toLowerCase())) && !includesAny(brandName, f.styles.map((s) => s.toLowerCase()))) continue;
    if (f.silhouettes.length && !includesAny(style.silhouette, f.silhouettes)) continue;
    if (f.sizeCategories.length && !includesAny(raw.size_category, f.sizeCategories)) continue;
    if (f.colors.length && !includesAny(raw.exterior_colorway, f.colors)) continue;
    if (f.materials.length && !(includesAny(material?.material_type, f.materials) || includesAny(material?.name, f.materials))) continue;
    if (f.hardwareColors.length && !includesAny(raw.hardware_color, f.hardwareColors)) continue;
    if (f.carryTypes.length) {
      const possibleCarries = (raw.carry_method ?? []).filter((c) => c.possible !== "no");
      if (!possibleCarries.some((c) => includesAny(c.carry_type, f.carryTypes))) continue;
    }
    if (f.maxWidthCm != null && !(widths.length > 0 && widths.some((w) => w <= f.maxWidthCm!))) continue;
    if (f.minWidthCm != null && !(widths.length > 0 && widths.some((w) => w >= f.minWidthCm!))) continue;
    if (
      f.keywords.length &&
      !includesAny(style.name, f.keywords) &&
      !includesAny(raw.exterior_colorway, f.keywords) &&
      !includesAny(brandName, f.keywords) &&
      // Descriptive keywords like "caviar" are material textures, not style names —
      // match them against the material name/type and other attribute fields too,
      // or a "black caviar bag" can never find a "Caviar Leather" variant.
      !includesAny(material?.name, f.keywords) &&
      !includesAny(material?.material_type, f.keywords) &&
      !includesAny(raw.size_label, f.keywords) &&
      !includesAny(style.silhouette, f.keywords)
    )
      continue;

    let entry = grouped.get(style.style_id);
    if (!entry) {
      entry = { styleId: style.style_id, styleName: style.name, brandName, variants: [] };
      grouped.set(style.style_id, entry);
    }
    entry.variants.push({
      variantId: raw.variant_id,
      sizeLabel: raw.size_label,
      exteriorColorway: raw.exterior_colorway,
      hardwareColor: raw.hardware_color,
    });
  }

  return Array.from(grouped.values()).slice(0, 30);
}

/** Brand cards matching any of the named brands. */
async function searchBrandsByName(names: string[]): Promise<BrandSearchResult[]> {
  if (!names.length) return [];
  const orFilter = names.map((n) => `name.ilike.%${n.replace(/[%,]/g, "")}%`).join(",");
  const { data } = await getSupabase()
    .from("brand")
    .select("brand_id, name, tier, style(style_id, name, variant(variant_id))")
    .or(orFilter);
  return mapBrandRows(data ?? []);
}

function mapBrandRows(
  rows: { brand_id: number; name: string; tier: "thrift" | "mid" | "ultra-luxury"; style: { style_id: number; name: string; variant: { variant_id: number }[] | null }[] | null }[]
): BrandSearchResult[] {
  return rows.map((b) => {
    const styles = b.style ?? [];
    return {
      brandId: b.brand_id,
      name: b.name,
      tier: b.tier,
      variantCount: styles.reduce((sum, s) => sum + (s.variant ?? []).length, 0),
      styles: styles.map((s) => ({
        styleId: s.style_id,
        name: s.name,
        variantId: (s.variant ?? [])[0]?.variant_id ?? null,
      })),
    };
  });
}

/** Plain substring search over brand and style names — the fallback when Claude parsing is unavailable. */
async function legacySearch(q: string): Promise<SearchResults> {
  const [brandRes, styleRes] = await Promise.all([
    getSupabase()
      .from("brand")
      .select("brand_id, name, tier, style(style_id, name, variant(variant_id))")
      .ilike("name", `%${q}%`),
    getSupabase()
      .from("style")
      .select("style_id, name, brand:brand_id(name), variant(variant_id, size_label, exterior_colorway, hardware_color)")
      .ilike("name", `%${q}%`)
      .limit(20),
  ]);

  const brands = mapBrandRows(brandRes.data ?? []);
  const styles: StyleSearchResult[] = (styleRes.data ?? []).map((s) => ({
    styleId: s.style_id,
    styleName: s.name,
    brandName: embeddedName(s.brand),
    variants: (s.variant ?? []).map((v) => ({
      variantId: v.variant_id,
      sizeLabel: v.size_label,
      exteriorColorway: v.exterior_colorway,
      hardwareColor: v.hardware_color,
    })),
  }));

  return { brands, styles, interpreted: [], usedNaturalLanguage: false };
}

/** Records a search that returned nothing so the team can see what users want that isn't in the catalog yet. */
async function logMiss(query: string): Promise<void> {
  try {
    await getSupabase().from("searched_not_found").insert({ search_query: query, result_count: 0 });
  } catch (err) {
    console.error("Failed to log searched_not_found:", err);
  }
}

/**
 * Catalog search. Parses the query with Claude into structured filters and runs a
 * brand + attribute-aware variant search; falls back to plain name matching when
 * Claude is unavailable. Searches that find nothing are logged to `searched_not_found`.
 */
export async function searchCatalog(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { brands: [], styles: [], interpreted: [], usedNaturalLanguage: false };

  const filters = await parseSearchQuery(q);

  // Fallback: no structured parse available — behave like a plain name search.
  if (!filters) {
    const result = await legacySearch(q);
    if (result.brands.length === 0 && result.styles.length === 0) await logMiss(q);
    return result;
  }

  const [brands, styles] = await Promise.all([
    searchBrandsByName(filters.brands),
    hasAttributeFilters(filters) ? searchVariantsByFilters(filters) : Promise.resolve([] as StyleSearchResult[]),
  ]);

  // If the structured search found nothing, fall back to a plain name match over
  // the raw text before giving up. A query that's literally a catalogued brand or
  // style name must always resolve — even when Claude over-extracts attributes
  // (e.g. "tweed" -> material fabric) that exclude breadth-seeded variants missing
  // that attribute data. Without this, clicking a catalogued style name (which
  // re-searches by name) could dead-end at "no results".
  if (brands.length === 0 && styles.length === 0) {
    const result = await legacySearch(q);
    if (result.brands.length > 0 || result.styles.length > 0) {
      return {
        ...result,
        interpreted: hasAttributeFilters(filters) ? describeFilters(filters) : [],
        usedNaturalLanguage: hasAttributeFilters(filters),
      };
    }
    await logMiss(q);
    return { brands, styles, interpreted: describeFilters(filters), usedNaturalLanguage: true };
  }

  return { brands, styles, interpreted: describeFilters(filters), usedNaturalLanguage: true };
}

/** A search query that returned no catalog results, aggregated for the admin dashboard. */
export interface SearchedNotFound {
  query: string;
  count: number;
  lastSearched: string;
  source: "camera" | "search";
  resolved: boolean;
}

/** Aggregated view of searches that returned nothing — the data roadmap for what to research next. */
export async function getSearchedNotFound(limit = 200): Promise<SearchedNotFound[]> {
  // Reads via the service-role client: searched_not_found has RLS on with no
  // public SELECT policy (anon may only INSERT misses). Admin-only surface.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("searched_not_found")
    .select("search_query, date, resolved")
    .order("date", { ascending: false })
    .limit(1000);

  if (error || !data) return [];

  const byQuery = new Map<string, SearchedNotFound>();
  for (const row of data as { search_query: string; date: string; resolved: boolean }[]) {
    const isCamera = row.search_query.startsWith("[camera] ");
    const cleanQuery = isCamera ? row.search_query.replace(/^\[camera\]\s*/, "") : row.search_query;
    const key = `${isCamera ? "camera" : "search"}:${cleanQuery.toLowerCase()}`;
    const existing = byQuery.get(key);
    if (existing) {
      existing.count += 1;
      if (row.date > existing.lastSearched) existing.lastSearched = row.date;
      existing.resolved = existing.resolved && row.resolved;
    } else {
      byQuery.set(key, {
        query: cleanQuery,
        count: 1,
        lastSearched: row.date,
        source: isCamera ? "camera" : "search",
        resolved: row.resolved,
      });
    }
  }

  return Array.from(byQuery.values())
    .sort((a, b) => b.count - a.count || b.lastSearched.localeCompare(a.lastSearched))
    .slice(0, limit);
}

/** A user-submitted feedback record about a catalog variant, enriched with the bag it refers to. */
export interface UserFeedbackEntry {
  feedbackId: number;
  recordType: string;
  recordId: number;
  feedbackType: string;
  note: string | null;
  date: string;
  resolved: boolean;
  resolutionNotes: string | null;
  /** Populated for variant feedback so the dashboard can link to and label the bag. */
  variant: { variantId: number; brandName: string; styleName: string; label: string } | null;
}

/** Feedback submitted from bag detail pages, newest first, with the referenced bag resolved for display. */
export async function getUserFeedback(limit = 200): Promise<UserFeedbackEntry[]> {
  // Reads via the service-role client: user_feedback has RLS on with no public
  // SELECT policy (anon may only INSERT feedback). Admin-only surface.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("user_feedback")
    .select("feedback_id, record_type, record_id, feedback_type, user_note, date, resolved, resolution_notes")
    .order("date", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as {
    feedback_id: number; record_type: string; record_id: number; feedback_type: string;
    user_note: string | null; date: string; resolved: boolean; resolution_notes: string | null;
  }[];

  // Resolve the referenced variants in one query so each row can show "Brand · Style · size".
  const variantIds = [...new Set(rows.filter((r) => r.record_type === "variant").map((r) => r.record_id))];
  const variantsById = new Map<number, { variantId: number; brandName: string; styleName: string; label: string }>();

  if (variantIds.length > 0) {
    const { data: vData } = await getSupabase()
      .from("variant")
      .select("variant_id, size_label, exterior_colorway, style:style_id(name, brand:brand_id(name))")
      .in("variant_id", variantIds);

    for (const v of (vData ?? []) as {
      variant_id: number; size_label: string | null; exterior_colorway: string | null;
      style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
    }[]) {
      const style = (Array.isArray(v.style) ? v.style[0] : v.style) ?? null;
      const label = [v.size_label, v.exterior_colorway].filter(Boolean).join(" · ") || "Variant";
      variantsById.set(v.variant_id, {
        variantId: v.variant_id,
        brandName: style ? embeddedName(style.brand) : "",
        styleName: style?.name ?? "",
        label,
      });
    }
  }

  return rows.map((r) => ({
    feedbackId: r.feedback_id,
    recordType: r.record_type,
    recordId: r.record_id,
    feedbackType: r.feedback_type,
    note: r.user_note,
    date: r.date,
    resolved: r.resolved,
    resolutionNotes: r.resolution_notes,
    variant: r.record_type === "variant" ? variantsById.get(r.record_id) ?? null : null,
  }));
}

/** A user request to add a bag the catalog doesn't have yet. */
export interface BagRequestEntry {
  requestId: number;
  brand: string | null;
  style: string | null;
  searchQuery: string | null;
  details: string | null;
  date: string;
  resolved: boolean;
}

/** Bag-addition requests, newest first. Reads via the service-role client (RLS has no public SELECT). */
export async function getBagRequests(limit = 200): Promise<BagRequestEntry[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("bag_request")
    .select("request_id, brand, style, search_query, details, created_at, resolved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((r) => ({
    requestId: r.request_id,
    brand: r.brand,
    style: r.style,
    searchQuery: r.search_query,
    details: r.details,
    date: r.created_at,
    resolved: r.resolved,
  }));
}

/** A logged thrift-store / estate-sale find. */
export interface ThriftFindEntry {
  findId: number;
  brand: string | null;
  style: string | null;
  whereFound: string | null;
  pricePaid: number | null;
  currency: string | null;
  condition: string | null;
  note: string | null;
  date: string;
}

/** Logged thrift finds, newest first. Reads via the service-role client. */
export async function getThriftFinds(limit = 200): Promise<ThriftFindEntry[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("thrift_find")
    .select("find_id, brand, style, where_found, price_paid, currency, condition, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((r) => ({
    findId: r.find_id,
    brand: r.brand,
    style: r.style,
    whereFound: r.where_found,
    pricePaid: r.price_paid != null ? Number(r.price_paid) : null,
    currency: r.currency,
    condition: r.condition,
    note: r.note,
    date: r.created_at,
  }));
}

// ============ Sitemap targets (programmatic SEO/GEO) ============

/** All indexable entity IDs for sitemap.xml — bag variants + brands. */
export async function getSitemapTargets(): Promise<{
  variantIds: number[];
  brandIds: number[];
}> {
  const [variants, brands] = await Promise.all([
    getSupabase().from("variant").select("variant_id").limit(50000),
    getSupabase().from("brand").select("brand_id").limit(5000),
  ]);
  return {
    variantIds: (variants.data ?? []).map((r) => r.variant_id as number),
    brandIds: (brands.data ?? []).map((r) => r.brand_id as number),
  };
}

// ============ Curated resources (embedded video reviews) ============

export interface CuratedResource {
  resourceId: number;
  resourceType: string;
  title: string;
  url: string;
  youtubeVideoId: string | null;
  description: string | null;
  isFeatured: boolean;
  creatorName: string | null;
  creatorChannelUrl: string | null;
  creatorTrusted: boolean;
  // Instagram embed fields (null for non-instagram resources). embedHtml is the
  // official Meta oEmbed Read markup; it powers the click-to-load facade.
  embedHtml: string | null;
  thumbnailUrl: string | null;
  authorName: string | null;
}

/**
 * Curated resources for a bag — videos attached to this variant or rolled up
 * from its style. Returns [] if the table isn't present yet (migration for
 * resources not applied), so the bag page degrades gracefully.
 */
export async function getResourcesForStyle(
  styleId: number,
  variantId?: number
): Promise<CuratedResource[]> {
  const { data, error } = await getSupabase()
    .from("resource")
    .select(
      "resource_id, resource_type, title, url, youtube_video_id, description, is_featured, embed_html, thumbnail_url, author_name, style_id, variant_id, creator:creator_id(name, channel_url, is_trusted)"
    )
    .eq("published", true)
    .or(`style_id.eq.${styleId}${variantId ? `,variant_id.eq.${variantId}` : ""}`)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(12);

  if (error || !data) return [];

  const resources = data.map((r) => {
    const c = (Array.isArray(r.creator) ? r.creator[0] : r.creator) as
      | { name: string; channel_url: string | null; is_trusted: boolean }
      | null;
    return {
      resourceId: r.resource_id,
      resourceType: r.resource_type,
      title: r.title,
      url: r.url,
      youtubeVideoId: r.youtube_video_id ?? null,
      description: r.description ?? null,
      isFeatured: !!r.is_featured,
      creatorName: c?.name ?? null,
      creatorChannelUrl: c?.channel_url ?? null,
      creatorTrusted: !!c?.is_trusted,
      embedHtml: (r.embed_html as string | null) ?? null,
      thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
      authorName: (r.author_name as string | null) ?? null,
    };
  });

  // Enrich Instagram rows that lack a cached embed via the official Meta oEmbed
  // Read API (server-only token). Cached for a week; degrades to attribution
  // link-out when the token is missing. YouTube rows are untouched.
  await Promise.all(
    resources.map(async (r) => {
      if (r.resourceType !== "instagram" || r.embedHtml) return;
      const oembed = await getInstagramOEmbed(r.url);
      if (oembed) {
        r.embedHtml = oembed.html;
        r.thumbnailUrl = r.thumbnailUrl ?? oembed.thumbnailUrl;
        r.authorName = r.authorName ?? oembed.authorName;
      }
    })
  );

  return resources;
}
