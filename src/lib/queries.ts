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
