/**
 * "Shop the market" data layer — reads the live resale listings we've recorded and
 * rates each against the fair value for its exact spec (see `listings-core.ts`).
 *
 * Two surfaces, one engine:
 *   - getShopProducts() — the catalog-wide grid. Products are a bag at a size (a style +
 *     size_label); colors are the variants under it. Each shows "from $X", listing/seller
 *     counts, and a deal pulse (best in-stock rating). Comps are scoped to the same
 *     style+size, then spec-matched per listing by the core.
 *   - getListingsForVariant() — one bag's offers, for the bag-page "For sale" rail. Offers
 *     are that exact variant's listings; comps are the style+size pool so a thin color
 *     still grades (broadened, and labeled as such).
 *
 * RESILIENT: any missing env / table / column (e.g. the 0022 spec columns, or the 0021
 * price_type column on an un-migrated DB) is caught and yields an empty result — the
 * pages render their empty state, never an error. No affiliate code is required; outbound
 * links carry the listing's own source_url and `affiliate.ts` adds attribution when set.
 */

import { getSupabase } from "./supabase";
import { PLATFORMS } from "./platforms";
import {
  rateListing,
  bestBand,
  type DealRating,
  type DealBand,
  type ItemSpec,
  type SpecComp,
} from "./listings-core";

const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;

export interface Offer {
  price: number;
  currency: string | null;
  platform: string | null;
  /** Pretty platform name (via the trust model), falls back to the raw string. */
  platformLabel: string;
  condition: string | null;
  colorway: string | null;
  material: string | null;
  hardwareColor: string | null;
  sourceUrl: string | null;
  observedOn: string | null;
  /** Null when the bag has too little recorded resale to rate honestly. */
  rating: DealRating | null;
}

export interface VariantListings {
  variantId: number;
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  /** The variant's own spec, for composing the comp-basis label. */
  colorway: string | null;
  material: string | null;
  offers: Offer[];
}

export interface ShopProduct {
  /** Stable group key (styleId + size). */
  key: string;
  /** Representative variant to link to (the cheapest in-stock one). */
  variantId: number;
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  colorCount: number;
  listingCount: number;
  sellerCount: number;
  fromPrice: number;
  currency: string | null;
  bestBand: DealBand | null;
}

export type ShopSort = "best-deal" | "price-asc" | "price-desc" | "newest";

export interface ShopFilters {
  brand?: string;
  dealsOnly?: boolean;
  maxPrice?: number;
  sort?: ShopSort;
}

export interface ShopResult {
  products: ShopProduct[];
  /** Brand facet (count of products per brand, over the unfiltered set). */
  brands: { name: string; count: number }[];
  totalListings: number;
  totalProducts: number;
}

// ---- Internal row shape after mapping a price_history join ----

interface PriceRow {
  variantId: number;
  styleId: number;
  styleName: string;
  brandName: string;
  sizeLabel: string | null;
  price: number;
  currency: string | null;
  platform: string | null;
  priceType: string | null;
  sourceUrl: string | null;
  observedOn: string | null;
  dateRecorded: string | null;
  condition: string | null;
  spec: ItemSpec;
}

type RawRow = {
  variant_id: number;
  sale_price: number | string | null;
  currency: string | null;
  platform: string | null;
  price_type: string | null;
  source_url: string | null;
  observed_on: string | null;
  date_recorded: string | null;
  condition: string | null;
  colorway: string | null;
  material: string | null;
  hardware_color: string | null;
  production_year: number | null;
  variant:
    | RawVariant
    | RawVariant[]
    | null;
};

type RawVariant = {
  size_label: string | null;
  exterior_colorway: string | null;
  hardware_color: string | null;
  exterior_material: { name: string } | { name: string }[] | null;
  style:
    | { style_id: number; name: string; brand: { name: string } | { name: string }[] | null }
    | { style_id: number; name: string; brand: { name: string } | { name: string }[] | null }[]
    | null;
};

const SELECT =
  "variant_id, sale_price, currency, platform, price_type, source_url, observed_on, date_recorded, condition, colorway, material, hardware_color, production_year, " +
  "variant:variant_id(size_label, exterior_colorway, hardware_color, exterior_material:exterior_material_id(name), style:style_id(style_id, name, brand:brand_id(name)))";

function one<T>(rel: T | T[] | null | undefined): T | null {
  return (Array.isArray(rel) ? rel[0] : rel) ?? null;
}

function embeddedName(rel: unknown): string {
  const row = one(rel as { name?: string } | { name?: string }[] | null);
  return row?.name ?? "";
}

/** Map a raw joined row to our internal shape, or null if it lacks a usable price. */
function mapRow(r: RawRow): PriceRow | null {
  const price = r.sale_price != null ? Number(r.sale_price) : null;
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  const variant = one(r.variant);
  const style = variant ? one(variant.style) : null;
  const materialName = variant ? embeddedName(variant.exterior_material) : "";
  return {
    variantId: r.variant_id,
    styleId: style?.style_id ?? 0,
    styleName: style?.name ?? "",
    brandName: style ? embeddedName(style.brand) : "",
    sizeLabel: variant?.size_label ?? null,
    price,
    currency: r.currency,
    platform: r.platform,
    priceType: r.price_type,
    sourceUrl: r.source_url,
    observedOn: r.observed_on,
    dateRecorded: r.date_recorded,
    condition: r.condition,
    spec: {
      // Prefer the per-listing spec (migration 0022); fall back to the variant's own.
      colorway: r.colorway ?? variant?.exterior_colorway ?? null,
      material: r.material ?? (materialName || null),
      hardwareColor: r.hardware_color ?? variant?.hardware_color ?? null,
      productionYear: r.production_year ?? null,
    },
  };
}

function isRetail(r: PriceRow): boolean {
  return (
    r.priceType === "retail_msrp" ||
    (r.priceType == null && r.platform != null && RETAIL_PLATFORM_RX.test(r.platform))
  );
}

function isListed(r: PriceRow): boolean {
  return r.priceType === "listed";
}

function platformLabel(platform: string | null): string {
  if (!platform) return "Marketplace";
  const key = platform.toLowerCase().replace(/[^a-z]/g, "");
  for (const p of Object.values(PLATFORMS)) {
    if (key.includes(p.key)) return p.label;
  }
  return platform;
}

function specComp(r: PriceRow): SpecComp {
  return { ...r.spec, salePrice: r.price };
}

function toOffer(r: PriceRow, comps: SpecComp[]): Offer {
  return {
    price: Math.round(r.price),
    currency: r.currency,
    platform: r.platform,
    platformLabel: platformLabel(r.platform),
    condition: r.condition,
    colorway: r.spec.colorway,
    material: r.spec.material,
    hardwareColor: r.spec.hardwareColor,
    sourceUrl: r.sourceUrl,
    observedOn: r.observedOn,
    rating: rateListing(r.price, r.spec, comps),
  };
}

/** Order offers: rated deals first (great → above), unrated last; ties by price asc. */
function compareOffers(a: Offer, b: Offer): number {
  const rank: Record<DealBand, number> = { great: 4, good: 3, fair: 2, above: 1 };
  const ra = a.rating ? rank[a.rating.band] : 0;
  const rb = b.rating ? rank[b.rating.band] : 0;
  if (ra !== rb) return rb - ra;
  return a.price - b.price;
}

/**
 * Every live listing for one variant, rated against the style+size comp pool so a thin
 * color still grades (broadened + labeled). Returns null only when the variant itself
 * can't be resolved; an empty `offers` array means "no listings right now".
 */
export async function getListingsForVariant(variantId: number): Promise<VariantListings | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !Number.isFinite(variantId)) return null;
  try {
    // Resolve the variant's style + identity first.
    const { data: v, error: vErr } = await getSupabase()
      .from("variant")
      .select(
        "variant_id, size_label, exterior_colorway, exterior_material:exterior_material_id(name), style:style_id(style_id, name, brand:brand_id(name))",
      )
      .eq("variant_id", variantId)
      .single();
    if (vErr || !v) return null;
    const style = one((v as unknown as RawVariant).style);
    if (!style) return null;

    // All price rows for the style, so comps can span colors of the same size.
    const { data, error } = await getSupabase()
      .from("price_history")
      .select(SELECT)
      .eq("variant.style_id", style.style_id)
      .not("sale_price", "is", null)
      .limit(10000);
    if (error || !data) {
      // Style pool unavailable (or pre-0022 columns) — fall back to no offers, not a crash.
      return {
        variantId,
        brandName: embeddedName(style.brand),
        styleName: style.name,
        sizeLabel: (v as { size_label: string | null }).size_label ?? null,
        colorway: (v as { exterior_colorway: string | null }).exterior_colorway ?? null,
        material: embeddedName((v as unknown as RawVariant).exterior_material) || null,
        offers: [],
      };
    }

    const rows = (data as unknown as RawRow[]).map(mapRow).filter((r): r is PriceRow => r !== null);
    const target = rows.find((r) => r.variantId === variantId);
    const sizeLabel = target?.sizeLabel ?? (v as { size_label: string | null }).size_label ?? null;

    // Comps: resale rows of the same style + size (size controlled here, spec by the core).
    const comps = rows
      .filter((r) => !isRetail(r) && (sizeLabel == null || r.sizeLabel === sizeLabel))
      .map(specComp);

    const offers = rows
      .filter((r) => r.variantId === variantId && isListed(r))
      .map((r) => toOffer(r, comps))
      .sort(compareOffers);

    return {
      variantId,
      brandName: target?.brandName ?? embeddedName(style.brand),
      styleName: target?.styleName ?? style.name,
      sizeLabel,
      colorway: target?.spec.colorway ?? (v as { exterior_colorway: string | null }).exterior_colorway ?? null,
      material: target?.spec.material ?? (embeddedName((v as unknown as RawVariant).exterior_material) || null),
      offers,
    };
  } catch {
    return null;
  }
}

interface ProductGroup {
  key: string;
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  listed: PriceRow[];
  comps: SpecComp[];
  colors: Set<string>;
}

/**
 * The catalog-wide grid: bags-at-a-size with at least one live listing, each carrying a
 * "from" price, listing/seller counts and a best-in-stock deal band. Filtered + sorted
 * server-side from one resilient read. Always returns an (possibly empty) result.
 */
export async function getShopProducts(filters: ShopFilters = {}, limit = 60): Promise<ShopResult> {
  const EMPTY: ShopResult = { products: [], brands: [], totalListings: 0, totalProducts: 0 };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;

  try {
    const { data, error } = await getSupabase()
      .from("price_history")
      .select(SELECT)
      .not("sale_price", "is", null)
      .limit(50000);
    if (error || !data) return EMPTY;

    const rows = (data as unknown as RawRow[]).map(mapRow).filter((r): r is PriceRow => r !== null);

    // Group into bags-at-a-size.
    const groups = new Map<string, ProductGroup>();
    for (const r of rows) {
      if (r.styleId === 0) continue;
      const key = `${r.styleId}::${r.sizeLabel ?? ""}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          key,
          brandName: r.brandName,
          styleName: r.styleName,
          sizeLabel: r.sizeLabel,
          listed: [],
          comps: [],
          colors: new Set(),
        };
        groups.set(key, g);
      }
      if (r.spec.colorway) g.colors.add(r.spec.colorway.toLowerCase());
      if (isListed(r)) g.listed.push(r);
      if (!isRetail(r)) g.comps.push(specComp(r));
    }

    // Build products from groups that have at least one live listing.
    let products: ShopProduct[] = [];
    let totalListings = 0;
    for (const g of groups.values()) {
      if (g.listed.length === 0) continue;
      totalListings += g.listed.length;

      const cheapest = g.listed.reduce((lo, c) => (c.price < lo.price ? c : lo), g.listed[0]);
      const bands = g.listed
        .map((r) => rateListing(r.price, r.spec, g.comps)?.band)
        .filter((b): b is DealBand => b != null);
      const sellers = new Set(g.listed.map((r) => platformLabel(r.platform)));

      products.push({
        key: g.key,
        variantId: cheapest.variantId,
        brandName: g.brandName,
        styleName: g.styleName,
        sizeLabel: g.sizeLabel,
        colorCount: g.colors.size,
        listingCount: g.listed.length,
        sellerCount: sellers.size,
        fromPrice: Math.round(cheapest.price),
        currency: cheapest.currency,
        bestBand: bestBand(bands),
      });
    }

    const totalProducts = products.length;

    // Brand facet over the unfiltered product set.
    const brandCounts = new Map<string, number>();
    for (const p of products) {
      if (!p.brandName) continue;
      brandCounts.set(p.brandName, (brandCounts.get(p.brandName) ?? 0) + 1);
    }
    const brands = [...brandCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    // Apply filters.
    if (filters.brand) products = products.filter((p) => p.brandName === filters.brand);
    if (filters.maxPrice != null) products = products.filter((p) => p.fromPrice <= filters.maxPrice!);
    if (filters.dealsOnly)
      products = products.filter((p) => p.bestBand === "great" || p.bestBand === "good");

    // Sort.
    const bandRank: Record<DealBand, number> = { great: 4, good: 3, fair: 2, above: 1 };
    const sort = filters.sort ?? "best-deal";
    products.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.fromPrice - b.fromPrice;
        case "price-desc":
          return b.fromPrice - a.fromPrice;
        case "newest":
          return 0; // grid rows aren't dated at the product level; keep group order
        case "best-deal":
        default: {
          const ra = a.bestBand ? bandRank[a.bestBand] : 0;
          const rb = b.bestBand ? bandRank[b.bestBand] : 0;
          if (ra !== rb) return rb - ra;
          return a.fromPrice - b.fromPrice;
        }
      }
    });

    return {
      products: products.slice(0, Math.max(0, limit)),
      brands,
      totalListings,
      totalProducts,
    };
  } catch {
    return EMPTY;
  }
}
