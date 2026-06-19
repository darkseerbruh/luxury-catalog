import { getSupabase } from "./supabase";

export interface BrandOverview {
  brandId: number;
  name: string;
  tier: "thrift" | "mid" | "ultra-luxury";
  styleCount: number;
  isLive: boolean;
}

export interface HeroCard {
  styleId: number;
  styleName: string;
  brandName: string;
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
  styleNames: string[];
}

export interface SearchResults {
  brands: BrandSearchResult[];
  styles: StyleSearchResult[];
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

/** Brands with whether they have at least one fully-detailed variant ("live") vs. breadth-only stub styles ("coming soon"). */
export async function getBrandsOverview(): Promise<BrandOverview[]> {
  const { data, error } = await getSupabase()
    .from("brand")
    .select("brand_id, name, tier, style(style_id, variant(variant_id))")
    .order("name");

  if (error || !data) return [];

  return data.map((brand) => {
    const styles = (brand.style ?? []) as StyleWithVariants[];
    const isLive = styles.some((s) => (s.variant ?? []).length > 0);
    return {
      brandId: brand.brand_id,
      name: brand.name,
      tier: brand.tier,
      styleCount: styles.length,
      isLive,
    };
  });
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
      "style_id, name, brand:brand_id(name), variant(size_label, retail_price_original, currency)"
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
      return {
        styleId: row.style_id,
        styleName: row.name,
        brandName: embeddedName(row.brand),
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
        known_authentication_markers, confidence_level
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
        sale_price, currency, date_recorded
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
    })),
  };
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
    }[];
  }[];
}

export async function getBrandDetail(brandId: number): Promise<BrandDetail | null> {
  const { data, error } = await getSupabase()
    .from("brand")
    .select(
      "brand_id, name, tier, country_of_origin, founded_year, description, style(style_id, name, silhouette, year_introduced, discontinued, variant(variant_id, size_label, exterior_colorway, hardware_color))"
    )
    .eq("brand_id", brandId)
    .single();

  if (error || !data) return null;

  const styles = ((data.style ?? []) as {
    style_id: number; name: string; silhouette: string | null;
    year_introduced: number | null; discontinued: boolean;
    variant: { variant_id: number; size_label: string | null; exterior_colorway: string | null; hardware_color: string | null }[] | null;
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

/** Brand-level and style-level catalog search, matching the two search depths in the design. */
export async function searchCatalog(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { brands: [], styles: [] };

  const [brandRes, styleRes] = await Promise.all([
    getSupabase()
      .from("brand")
      .select("brand_id, name, tier, style(style_id, name, variant(variant_id))")
      .ilike("name", `%${q}%`),
    getSupabase()
      .from("style")
      .select(
        "style_id, name, brand:brand_id(name), variant(variant_id, size_label, exterior_colorway, hardware_color)"
      )
      .ilike("name", `%${q}%`)
      .limit(20),
  ]);

  const brands: BrandSearchResult[] = (brandRes.data ?? []).map((b) => {
    const styles = (b.style ?? []) as { style_id: number; name: string; variant: { variant_id: number }[] | null }[];
    const variantCount = styles.reduce((sum, s) => sum + (s.variant ?? []).length, 0);
    return {
      brandId: b.brand_id,
      name: b.name,
      tier: b.tier,
      variantCount,
      styleNames: styles.map((s) => s.name),
    };
  });

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

  return { brands, styles };
}
