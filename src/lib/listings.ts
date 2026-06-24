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
import { colorFamily, materialFamily } from "./listings-taxonomy";
import {
  rateListing,
  isConfidentBasis,
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
  /** Deal verdict for the "from" price, only when its market value is a like-for-like
   *  (leather + color) basis; null when we can't honestly assert one. */
  dealBand: DealBand | null;
}

export type ShopSort = "best-deal" | "price-asc" | "price-desc" | "newest";

/** A color/material filter value is either an exact specific (e.g. "Étoupe") or a whole
 *  family, encoded "f:Beige". The matcher and the controls both understand this prefix. */
export const FAMILY_PREFIX = "f:";

export interface ShopFilters {
  brand?: string;
  dealsOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ShopSort;
  /** Per-listing spec filters. color/material accept a specific value or "f:Family". */
  color?: string;
  material?: string;
  hardware?: string;
  condition?: string;
}

/** A filter option with how many bags carry a matching live listing. */
export interface Facet {
  value: string;
  count: number;
}

/** A family ("Brown", "Leather") with its product count and the specific values under it. */
export interface GroupedFacet {
  family: string;
  count: number;
  options: Facet[];
}

export interface ShopFacets {
  brands: Facet[];
  /** Color specifics grouped under their family (with an inclusive family option). */
  colors: GroupedFacet[];
  /** Material specifics grouped under their family (Leather inclusive of Togo, Caviar…). */
  materials: GroupedFacet[];
  hardware: Facet[];
  conditions: Facet[];
}

export interface ShopResult {
  products: ShopProduct[];
  /** Brand facet (kept top-level for back-compat with the existing grid controls). */
  brands: Facet[];
  /** All filter facets (brand/color/material/hardware/condition), over the unfiltered set. */
  facets: ShopFacets;
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
  /** Stable per-listing id (migration 0024); dedup key across crawl dates. */
  listingRef: string | null;
  /** Live-vs-sold state (migration 0030): 'available' | 'sold' | null (legacy). */
  listingStatus: string | null;
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
  listing_ref: string | null;
  listing_status: string | null;
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
  "variant_id, sale_price, currency, platform, price_type, source_url, observed_on, date_recorded, listing_ref, listing_status, condition, colorway, material, hardware_color, production_year, " +
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
    listingRef: r.listing_ref ?? null,
    listingStatus: r.listing_status ?? null,
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
  // A live offer = a resale listing still for sale. 'sold' rows have been retired by
  // reconcile-sold.ts (the source no longer carries them); legacy rows are null = shown.
  return r.priceType === "listed" && r.listingStatus !== "sold";
}

/**
 * Collapse repeat observations of the same listing into one. A re-crawl writes a fresh
 * dated row per listing each time, so a bag live for N crawls would otherwise count N
 * times and show a stale price. Keep the most recent observation per (platform,
 * listing_ref); rows without a listing_ref are left as-is (can't be safely merged).
 */
function dedupeByListing(rows: PriceRow[]): PriceRow[] {
  const latest = new Map<string, PriceRow>();
  const out: PriceRow[] = [];
  for (const r of rows) {
    if (!r.listingRef) {
      out.push(r);
      continue;
    }
    const key = `${r.platform ?? ""}|${r.listingRef}`;
    const prev = latest.get(key);
    if (!prev || (r.observedOn ?? "") > (prev.observedOn ?? "")) latest.set(key, r);
  }
  return out.concat([...latest.values()]);
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
  // Realized = an actual sale (sold/auction). Asking listings are aspirational, so the
  // rating engine prefers realized comps for fair value when it has enough of them.
  return { ...r.spec, salePrice: r.price, realized: r.priceType === "sold" || r.priceType === "auction" };
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

    const offers = dedupeByListing(rows.filter((r) => r.variantId === variantId && isListed(r)))
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
  const emptyFacets: ShopFacets = { brands: [], colors: [], materials: [], hardware: [], conditions: [] };
  const EMPTY: ShopResult = { products: [], brands: [], facets: emptyFacets, totalListings: 0, totalProducts: 0 };
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

    // Collapse repeat crawl observations so each live listing counts once, at its most
    // recent price — otherwise a bag re-seen across N crawls would inflate every count.
    for (const g of groups.values()) g.listed = dedupeByListing(g.listed);

    // Facet accumulators (count distinct PRODUCTS carrying each value, over the unfiltered
    // set — like the brand facet). Spec facets count only over groups with live listings.
    const facetAcc = {
      brands: new Map<string, Facet>(),
      colors: new Map<string, Facet>(),
      materials: new Map<string, Facet>(),
      hardware: new Map<string, Facet>(),
      conditions: new Map<string, Facet>(),
    };
    // Family-level product counts (for the inclusive "All Brown" / "All Leather" option).
    const colorFamCount = new Map<string, number>();
    const materialFamCount = new Map<string, number>();
    const bump = (acc: Map<string, Facet>, raw: string | null) => {
      if (!raw) return;
      const k = raw.toLowerCase().trim();
      if (!k) return;
      const e = acc.get(k);
      if (e) e.count += 1;
      else acc.set(k, { value: raw.trim(), count: 1 });
    };
    const bumpFam = (acc: Map<string, number>, fams: Set<string>) => {
      for (const f of fams) acc.set(f, (acc.get(f) ?? 0) + 1);
    };

    const bandRank: Record<DealBand, number> = { great: 4, good: 3, fair: 2, above: 1 };
    // A color/material filter is either an exact specific or a whole family ("f:Beige").
    const matchOne = (
      val: string | null,
      want: string | undefined,
      fam: (s: string | null) => string | null,
    ): boolean => {
      if (!want) return true;
      if (want.startsWith(FAMILY_PREFIX)) return fam(val) === want.slice(FAMILY_PREFIX.length);
      return val != null && val.toLowerCase().trim() === want.toLowerCase().trim();
    };
    const eq = (val: string | null, want?: string) =>
      !want || (val != null && val.toLowerCase().trim() === want.toLowerCase().trim());
    const matchesSpec = (r: PriceRow): boolean =>
      matchOne(r.spec.colorway, filters.color, colorFamily) &&
      matchOne(r.spec.material, filters.material, materialFamily) &&
      eq(r.spec.hardwareColor, filters.hardware) &&
      eq(r.condition, filters.condition);

    let products: ShopProduct[] = [];
    let totalListings = 0;
    for (const g of groups.values()) {
      if (g.listed.length === 0) continue;

      // Facets: count this product once per distinct value among its listed rows.
      if (g.brandName) bump(facetAcc.brands, g.brandName);
      const colorVals = new Set(g.listed.map((r) => r.spec.colorway).filter((s): s is string => !!s));
      const materialVals = new Set(g.listed.map((r) => r.spec.material).filter((s): s is string => !!s));
      for (const v of colorVals) bump(facetAcc.colors, v);
      for (const v of materialVals) bump(facetAcc.materials, v);
      for (const v of new Set(g.listed.map((r) => r.spec.hardwareColor).filter(Boolean))) bump(facetAcc.hardware, v);
      for (const v of new Set(g.listed.map((r) => r.condition).filter(Boolean))) bump(facetAcc.conditions, v);
      // Count the product once per distinct FAMILY it spans (for the "All Brown" option).
      bumpFam(colorFamCount, new Set([...colorVals].map(colorFamily).filter((f): f is string => !!f)));
      bumpFam(materialFamCount, new Set([...materialVals].map(materialFamily).filter((f): f is string => !!f)));

      // The listings that survive the active per-listing spec filters.
      const matching = g.listed.filter(matchesSpec);
      if (matching.length === 0) continue;
      totalListings += matching.length;

      const cheapest = matching.reduce((lo, c) => (c.price < lo.price ? c : lo), matching[0]);
      const sellers = new Set(matching.map((r) => platformLabel(r.platform)));
      const colors = new Set(matching.map((r) => r.spec.colorway?.toLowerCase()).filter(Boolean));

      // Rate EACH listing against its OWN spec's market value, and keep only verdicts on a
      // like-for-like basis (leather + color) — a blended fallback would falsely call a
      // cheap colorway a steal. The thumbnail then shows the best deal among the items
      // behind it: if any one item is genuinely a great deal for its spec, badge the tile.
      const confidentBands = matching
        .map((r) => rateListing(r.price, r.spec, g.comps))
        .filter((rt): rt is DealRating => rt != null && isConfidentBasis(rt.fairValue))
        .map((rt) => rt.band);
      const dealBand = bestBand(confidentBands);

      products.push({
        key: g.key,
        variantId: cheapest.variantId,
        brandName: g.brandName,
        styleName: g.styleName,
        sizeLabel: g.sizeLabel,
        colorCount: colors.size,
        listingCount: matching.length,
        sellerCount: sellers.size,
        fromPrice: Math.round(cheapest.price),
        currency: cheapest.currency,
        dealBand,
      });
    }

    const sortFacet = (acc: Map<string, Facet>, top: number): Facet[] =>
      [...acc.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)).slice(0, top);

    // Group color/material specifics under their family, biggest family first, and put an
    // "Unknown" bucket last so unclassified values are still browsable.
    const groupByFamily = (
      acc: Map<string, Facet>,
      famCount: Map<string, number>,
      fam: (s: string | null) => string | null,
      perFamily: number,
    ): GroupedFacet[] => {
      const byFam = new Map<string, Facet[]>();
      for (const f of acc.values()) {
        const family = fam(f.value) ?? "Other";
        (byFam.get(family) ?? byFam.set(family, []).get(family)!).push(f);
      }
      return [...byFam.entries()]
        .map(([family, options]) => ({
          family,
          count: famCount.get(family) ?? options.reduce((s, o) => s + o.count, 0),
          options: options.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)).slice(0, perFamily),
        }))
        .sort((a, b) =>
          a.family === "Other" ? 1 : b.family === "Other" ? -1 : b.count - a.count || a.family.localeCompare(b.family),
        );
    };

    const facets: ShopFacets = {
      brands: sortFacet(facetAcc.brands, 50),
      colors: groupByFamily(facetAcc.colors, colorFamCount, colorFamily, 20),
      materials: groupByFamily(facetAcc.materials, materialFamCount, materialFamily, 20),
      hardware: sortFacet(facetAcc.hardware, 16),
      conditions: sortFacet(facetAcc.conditions, 12),
    };

    // Product-level filters (brand/price/deals) on top of the listing-level spec filters.
    if (filters.brand) products = products.filter((p) => p.brandName === filters.brand);
    if (filters.minPrice != null) products = products.filter((p) => p.fromPrice >= filters.minPrice!);
    if (filters.maxPrice != null) products = products.filter((p) => p.fromPrice <= filters.maxPrice!);
    if (filters.dealsOnly)
      products = products.filter((p) => p.dealBand === "great" || p.dealBand === "good");

    const totalProducts = products.length;

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
          const ra = a.dealBand ? bandRank[a.dealBand] : 0;
          const rb = b.dealBand ? bandRank[b.dealBand] : 0;
          if (ra !== rb) return rb - ra;
          return a.fromPrice - b.fromPrice;
        }
      }
    });

    return {
      products: products.slice(0, Math.max(0, limit)),
      brands: facets.brands,
      facets,
      totalListings,
      totalProducts,
    };
  } catch {
    return EMPTY;
  }
}
