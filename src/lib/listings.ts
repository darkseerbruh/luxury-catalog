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

import { getSupabase, fetchAllRows } from "./supabase";
import { CACHE_MARKET } from "./cache";
import { affiliateListingUrl } from "./affiliate";
import { PLATFORMS } from "./platforms";
import { colorFamily, materialFamily } from "./listings-taxonomy";
import { displaySizeLabel } from "./variant-label";
import { isNonBagAccessory, titleNamesDifferentStyle } from "./ingest/model-normalize";
import {
  rateListing,
  isConfidentBasis,
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
  /** Product photo for this listing (from listing_image), when the source feed
   * carries one. Null for sources without photos, or pre-0047 migration. */
  imageUrl: string | null;
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
  /** The group's style, for style-level image fallback on the grid. */
  styleId: number;
  /** Distinct listed variants (cheapest's first) — image candidates for the tile,
   *  so one photo-less cheapest listing doesn't blank a tile whose siblings have photos. */
  imageVariantIds: number[];
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  colorCount: number;
  listingCount: number;
  sellerCount: number;
  fromPrice: number;
  currency: string | null;
  /** Deal verdict for the "from" price, only when its market value is a like-for-like
   *  (leather + color) basis; null when we can't honestly assert one. INTERNAL ranking
   *  signal (deals-only filter, best-deal sort) — never rendered on the rollup tile:
   *  the tile is a category representative, so a price verdict there would overclaim
   *  (owner ruled 2026-07-08). Listing-level verdicts live on the bag page. */
  dealBand: DealBand | null;
}

export type ShopSort = "best-deal" | "price-asc" | "price-desc" | "newest";

/** A color/material filter value is either an exact specific (e.g. "Étoupe") or a whole
 *  family, encoded "f:Beige". The matcher and the controls both understand this prefix. */
export const FAMILY_PREFIX = "f:";

export interface ShopFilters {
  brand?: string;
  /** Restrict the grid to these styles — how a text search narrows the market.
   *  Undefined = no text query (show the whole market). Empty array = a query that
   *  matched nothing, so the grid is intentionally empty. */
  styleIds?: number[];
  dealsOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ShopSort;
  /** Per-listing spec filters. color/material accept a specific value or "f:Family". */
  color?: string;
  material?: string;
  hardware?: string;
  condition?: string;
  /** Style-level. "yes" = documented protective feet; "unknown" = not yet documented. */
  protectiveFeet?: "yes" | "unknown";
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
  /**
   * "Protective feet" options (value "yes" | "unknown"), each with a product count.
   * Empty when the style.has_protective_feet column isn't there yet (pre-migration
   * 0044) OR when no listed bag carries a documented answer — the control then
   * renders nothing, so the feature degrades gracefully.
   */
  protectiveFeet: Facet[];
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
  /** Style-level protective-feet flag (migration 0044). Undefined when unread. */
  hasProtectiveFeet?: boolean | null;
  /** Raw marketplace title — reveals a mis-attached accessory/foreign model. */
  notes: string | null;
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
  notes: string | null;
  variant:
    | RawVariant
    | RawVariant[]
    | null;
};

type RawStyle = {
  style_id: number;
  name: string;
  has_protective_feet?: boolean | null;
  brand: { name: string } | { name: string }[] | null;
};

type RawVariant = {
  size_label: string | null;
  exterior_colorway: string | null;
  hardware_color: string | null;
  exterior_material: { name: string } | { name: string }[] | null;
  style: RawStyle | RawStyle[] | null;
};

// The nested style select, with and without the 0044 `has_protective_feet`
// column. We prefer WITH; if the column isn't migrated yet PostgREST errors the
// whole query, so getShopProducts retries WITHOUT and just omits the feet facet.
const STYLE_SELECT_WITH_FEET =
  "style:style_id(style_id, name, has_protective_feet, brand:brand_id(name))";
const STYLE_SELECT_NO_FEET = "style:style_id(style_id, name, brand:brand_id(name))";
const VARIANT_SELECT = (styleSelect: string) =>
  `variant:variant_id(size_label, exterior_colorway, hardware_color, exterior_material:exterior_material_id(name), ${styleSelect})`;
const buildSelect = (styleSelect: string) =>
  "variant_id, sale_price, currency, platform, price_type, source_url, observed_on, date_recorded, listing_ref, listing_status, condition, colorway, material, hardware_color, production_year, notes, " +
  VARIANT_SELECT(styleSelect);

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
    sizeLabel: displaySizeLabel(variant?.size_label),
    price,
    currency: r.currency,
    platform: r.platform,
    priceType: r.price_type,
    sourceUrl: r.source_url,
    observedOn: r.observed_on,
    dateRecorded: r.date_recorded,
    listingRef: r.listing_ref ?? null,
    listingStatus: r.listing_status ?? null,
    hasProtectiveFeet: style ? style.has_protective_feet ?? null : null,
    notes: r.notes ?? null,
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
 * A row mis-attached to this variant's style: its raw title is a non-bag accessory
 * (card holder, iPad case, locket) or names a DIFFERENT model than the style. Dropped
 * everywhere — comps, offers, tile price, deal band — so a cheap foreign object can't set
 * a bag's "from" price or win a deal badge. Same classifier the homepage rail and the
 * ingest gate use, so every deal surface agrees on what belongs.
 */
function isForeignListing(r: PriceRow): boolean {
  return isNonBagAccessory(r.notes) || titleNamesDifferentStyle(r.brandName, r.styleName, r.notes);
}

/**
 * Collapse repeat observations of the same listing into one. A re-crawl writes a fresh
 * dated row per listing each time, so a bag live for N crawls would otherwise count N
 * times and surface an older observation as the current price. Keep the most recent per (platform,
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
    imageUrl: null,
    rating: rateListing(r.price, r.spec, comps),
  };
}

/** Photos for a set of listing_refs, keyed by ref. Resilient: returns an empty
 * map if listing_image isn't migrated yet (0047) so the rail never breaks. */
async function fetchListingImages(refs: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(refs.filter(Boolean))];
  if (unique.length === 0) return out;
  try {
    const { data, error } = await getSupabase()
      .from("listing_image")
      .select("listing_ref, image_url")
      .in("listing_ref", unique);
    if (error || !data) return out;
    for (const r of data as { listing_ref: string; image_url: string }[]) out.set(r.listing_ref, r.image_url);
  } catch {
    /* table missing pre-migration — render photo-less */
  }
  return out;
}

/** The live listing BEHIND the bag's already-chosen face image. One source of
 * truth: getVariantImages picks the face every surface shows (best spec match,
 * price-sane); the hero just resolves which live listing owns that photo so the
 * header links to buy it. By construction the hero can never show a different
 * bag than the brand card (owner call 2026-07-09). Resilient: null when the
 * image isn't a live affiliate photo (placeholder/community/sold-out). */
export interface HeroListing {
  imageUrl: string;
  buyUrl: string;
  price: number;
  platformLabel: string;
}

export async function getHeroListing(variantId: number, faceImageUrl: string | null): Promise<HeroListing | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !Number.isFinite(variantId) || !faceImageUrl) return null;
  try {
    const sb = getSupabase();
    // Which listing owns this photo?
    const { data: imgRows } = await sb
      .from("listing_image")
      .select("platform, listing_ref")
      .eq("image_url", faceImageUrl)
      .limit(5);
    const owners = (imgRows ?? []) as { platform: string | null; listing_ref: string }[];
    if (owners.length === 0) return null;

    // Its live ask on THIS variant (cheapest observation = the current best ask we hold).
    const { data } = await sb
      .from("price_history")
      .select("sale_price, platform, source_url, listing_ref")
      .eq("variant_id", variantId)
      .eq("price_type", "listed")
      .or("listing_status.is.null,listing_status.eq.available")
      .not("sale_price", "is", null)
      .in("listing_ref", owners.map((o) => o.listing_ref))
      .order("sale_price", { ascending: true })
      .limit(5);
    const row = ((data ?? []) as { sale_price: number; platform: string | null; source_url: string | null; listing_ref: string }[]).find(
      (r) => r.source_url && owners.some((o) => o.listing_ref === r.listing_ref && (o.platform ?? "") === (r.platform ?? "")),
    );
    if (!row) return null;
    return {
      imageUrl: faceImageUrl,
      buyUrl: affiliateListingUrl(row.source_url as string, row.platform),
      price: Math.round(row.sale_price),
      platformLabel: platformLabel(row.platform),
    };
  } catch {
    return null;
  }
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
        `variant_id, size_label, exterior_colorway, exterior_material:exterior_material_id(name), ${STYLE_SELECT_NO_FEET}`,
      )
      .eq("variant_id", variantId)
      .single();
    if (vErr || !v) return null;
    const style = one((v as unknown as RawVariant).style);
    if (!style) return null;

    // All price rows for the style, so comps can span colors of the same size.
    // No-feet select: this rail rates offers, it doesn't need the feet flag, and
    // staying off the 0044 column keeps the bag page working pre-migration.
    const { data, error } = await getSupabase()
      .from("price_history")
      .select(buildSelect(STYLE_SELECT_NO_FEET))
      .eq("variant.style_id", style.style_id)
      .not("sale_price", "is", null)
      .limit(10000);
    if (error || !data) {
      // Style pool unavailable (or pre-0022 columns) — fall back to no offers, not a crash.
      return {
        variantId,
        brandName: embeddedName(style.brand),
        styleName: style.name,
        sizeLabel: displaySizeLabel((v as { size_label: string | null }).size_label),
        colorway: (v as { exterior_colorway: string | null }).exterior_colorway ?? null,
        material: embeddedName((v as unknown as RawVariant).exterior_material) || null,
        offers: [],
      };
    }

    const rows = (data as unknown as RawRow[]).map(mapRow).filter((r): r is PriceRow => r !== null && !isForeignListing(r));

    // The style-wide query above is capped at 1000 rows by PostgREST, so for a
    // style with many listings (e.g. after the TLC feed load) the TARGET
    // variant's own rows can fall outside that window and vanish from `offers`.
    // Fetch this variant's rows directly (its own listings comfortably fit under
    // 1000) so its offers are always complete; the style pool stays for comps.
    const { data: vData } = await getSupabase()
      .from("price_history")
      .select(buildSelect(STYLE_SELECT_NO_FEET))
      .eq("variant_id", variantId)
      .not("sale_price", "is", null)
      .limit(1000);
    const variantRows = ((vData as unknown as RawRow[]) ?? [])
      .map(mapRow)
      .filter((r): r is PriceRow => r !== null && !isForeignListing(r));

    const target = variantRows.find((r) => r.variantId === variantId) ?? rows.find((r) => r.variantId === variantId);
    const sizeLabel = target?.sizeLabel ?? displaySizeLabel((v as { size_label: string | null }).size_label);

    // Comps: resale rows of the same style + size (size controlled here, spec by the core).
    const comps = rows
      .filter((r) => !isRetail(r) && (sizeLabel == null || r.sizeLabel === sizeLabel))
      .map(specComp);

    const listedRows = dedupeByListing(variantRows.filter((r) => isListed(r)));
    const imagesByRef = await fetchListingImages(
      listedRows.map((r) => r.listingRef).filter((x): x is string => !!x),
    );
    const offers = listedRows
      .map((r) => ({ ...toOffer(r, comps), imageUrl: (r.listingRef && imagesByRef.get(r.listingRef)) || null }))
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
  styleId: number;
  brandName: string;
  styleName: string;
  sizeLabel: string | null;
  listed: PriceRow[];
  comps: SpecComp[];
  colors: Set<string>;
  /** Style-level protective-feet flag (0044): true / false / null (unknown). */
  hasProtectiveFeet: boolean | null;
}

/** Scalar price_history columns (no joins) — the SAME field set mapRow reads, minus the
 *  variant embed, which we attach from the tiny metadata map. A per-row join over ~120k
 *  rows took ~50s; splitting it (scalar rows + a ~2k-row variant map) drops it to ~13s. */
const PH_SCALAR_SELECT =
  "price_id, variant_id, sale_price, currency, platform, price_type, source_url, observed_on, date_recorded, listing_ref, listing_status, condition, colorway, material, hardware_color, production_year, notes";
const VARIANT_META_WITH_FEET =
  "variant_id, size_label, exterior_colorway, hardware_color, exterior_material:exterior_material_id(name), " +
  STYLE_SELECT_WITH_FEET;
const VARIANT_META_NO_FEET =
  "variant_id, size_label, exterior_colorway, hardware_color, exterior_material:exterior_material_id(name), " +
  STYLE_SELECT_NO_FEET;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase builder narrows badly on a dynamic select string; fetchAllRows only needs .range()
type Rangeable = any;

/**
 * The FULL, deterministic shop read (owner report 2026-07-11). PostgREST caps every
 * response at 1000 rows regardless of `.limit()` ([[postgrest_row_cap]]), so the old
 * `.limit(50000)` silently saw a DIFFERENT arbitrary 1000-row slice each request — the
 * grid + counts flickered 0/3/4/6 and only ~4 of 1,649 bags ever showed. We page the whole
 * table (ordered), split so the join stays cheap. The 76MB row set is over the 2MB
 * `unstable_cache` limit, so we hold it in a MODULE-level in-memory cache instead: the ~13s
 * read runs once per TTL per server instance, then every request (any filter combo) reuses
 * the same complete, stable set and filters in JS — correct + fast once warm.
 */
async function loadShopRowsRaw(): Promise<{ rows: PriceRow[]; feetAvailable: boolean }> {
  let feetAvailable = true;
  let metaSelect = VARIANT_META_WITH_FEET;
  const probe = await getSupabase().from("variant").select(VARIANT_META_WITH_FEET).limit(1);
  if (probe.error) {
    feetAvailable = false;
    metaSelect = VARIANT_META_NO_FEET;
  }
  const meta = await fetchAllRows<{ variant_id: number }>(
    () => getSupabase().from("variant").select(metaSelect).order("variant_id", { ascending: true }) as Rangeable,
    200000,
  );
  const metaById = new Map<number, unknown>();
  for (const m of meta) metaById.set(m.variant_id, m);

  const scalar = await fetchAllRows<{ variant_id: number }>(
    () =>
      getSupabase()
        .from("price_history")
        .select(PH_SCALAR_SELECT)
        .not("sale_price", "is", null)
        .order("price_id", { ascending: true }) as Rangeable,
    200000,
  );

  const rows: PriceRow[] = [];
  for (const s of scalar) {
    const raw = { ...s, variant: metaById.get(s.variant_id) ?? null } as unknown as RawRow;
    const pr = mapRow(raw);
    if (pr && !isForeignListing(pr)) rows.push(pr);
  }
  return { rows, feetAvailable };
}

let shopRowsCache: { rows: PriceRow[]; feetAvailable: boolean; at: number } | null = null;
let shopRowsInflight: Promise<{ rows: PriceRow[]; feetAvailable: boolean }> | null = null;
const SHOP_ROWS_TTL_MS = CACHE_MARKET * 1000;

/**
 * In-memory STALE-WHILE-REVALIDATE cache for the full shop read (sidesteps the 2MB
 * unstable_cache cap). Once warm, a request NEVER waits on the ~13s read: if the cache is
 * stale, we serve the stale set immediately AND refresh in the background. Only the very
 * first load on a fresh instance (empty cache) awaits. Concurrent requests share one
 * in-flight promise, so a miss triggers a single DB read, not one per request.
 */
async function loadShopRows(): Promise<{ rows: PriceRow[]; feetAvailable: boolean }> {
  if (shopRowsCache) {
    const stale = Date.now() - shopRowsCache.at >= SHOP_ROWS_TTL_MS;
    if (stale && !shopRowsInflight) {
      // Fire-and-forget refresh; keep serving the (stale) cache until it lands.
      shopRowsInflight = loadShopRowsRaw()
        .then((fresh) => {
          shopRowsCache = { ...fresh, at: Date.now() };
          return fresh;
        })
        .catch((e) => {
          console.error("shop rows background refresh failed:", e);
          return shopRowsCache as { rows: PriceRow[]; feetAvailable: boolean };
        })
        .finally(() => {
          shopRowsInflight = null;
        });
    }
    return shopRowsCache;
  }
  // Cold, empty cache — must populate before we can answer.
  if (!shopRowsInflight) {
    shopRowsInflight = loadShopRowsRaw().finally(() => {
      shopRowsInflight = null;
    });
  }
  const fresh = await shopRowsInflight;
  shopRowsCache = { ...fresh, at: Date.now() };
  return shopRowsCache;
}

/**
 * The PRECOMPUTED shop index: the full row set grouped into bags-at-a-size. This grouping
 * is filter-independent and the single biggest per-request cost (~120k rows collapse into
 * ~1.6k groups + a dedupe pass), so we derive it ONCE per rows-cache generation and memoize
 * it, keyed off the rows-cache `at` timestamp. Every request (any filter combo) then reuses
 * the same grouped index and only runs the cheap filter + facet + sort pass. The grouped
 * objects are treated as READ-ONLY downstream (filters build new arrays, never mutate a
 * group), so sharing them across requests is safe. Refreshes exactly when the rows do.
 */
let shopGroupsCache: { groups: Map<string, ProductGroup>; feetAvailable: boolean; at: number } | null = null;

async function loadShopGroups(): Promise<{ groups: Map<string, ProductGroup>; feetAvailable: boolean }> {
  const { rows, feetAvailable } = await loadShopRows();
  const at = shopRowsCache?.at ?? 0;
  if (shopGroupsCache && shopGroupsCache.at === at) {
    return { groups: shopGroupsCache.groups, feetAvailable: shopGroupsCache.feetAvailable };
  }

  const groups = new Map<string, ProductGroup>();
  for (const r of rows) {
    if (r.styleId === 0) continue;
    const key = `${r.styleId}::${r.sizeLabel ?? ""}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        styleId: r.styleId,
        brandName: r.brandName,
        styleName: r.styleName,
        sizeLabel: r.sizeLabel,
        listed: [],
        comps: [],
        colors: new Set(),
        hasProtectiveFeet: r.hasProtectiveFeet ?? null,
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

  shopGroupsCache = { groups, feetAvailable, at };
  return { groups, feetAvailable };
}

/**
 * The catalog-wide grid: bags-at-a-size with at least one live listing, each carrying a
 * "from" price, listing/seller counts and a best-in-stock deal band. Filtered + sorted
 * server-side from the precomputed index. Always returns an (possibly empty) result.
 */
export async function getShopProducts(filters: ShopFilters = {}, limit = 60): Promise<ShopResult> {
  const emptyFacets: ShopFacets = { brands: [], colors: [], materials: [], hardware: [], conditions: [], protectiveFeet: [] };
  const EMPTY: ShopResult = { products: [], brands: [], facets: emptyFacets, totalListings: 0, totalProducts: 0 };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;

  try {
    const { groups, feetAvailable } = await loadShopGroups();

    // Facet accumulators (count distinct PRODUCTS carrying each value, over the unfiltered
    // set — like the brand facet). Spec facets count only over groups with live listings.
    const facetAcc = {
      brands: new Map<string, Facet>(),
      colors: new Map<string, Facet>(),
      materials: new Map<string, Facet>(),
      hardware: new Map<string, Facet>(),
      conditions: new Map<string, Facet>(),
    };
    // Protective-feet product counts: one bucket for documented "yes", one for
    // "unknown" (null or column absent). "No" bags aren't offered as a facet —
    // shoppers filter FOR feet, not against them — but count toward "unknown"? No:
    // a documented "false" is a real answer, so it's neither "yes" nor "unknown".
    let feetYes = 0;
    let feetUnknown = 0;
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
      // Protective feet (style-level): one product → yes, false, or unknown.
      if (feetAvailable) {
        if (g.hasProtectiveFeet === true) feetYes += 1;
        else if (g.hasProtectiveFeet == null) feetUnknown += 1;
      }

      // Apply the active protective-feet filter (style-level). "yes" keeps only
      // documented-feet bags; "unknown" keeps only those we haven't documented yet
      // (null). Facets above already counted this product, so the counts stay honest.
      if (filters.protectiveFeet === "yes" && g.hasProtectiveFeet !== true) continue;
      if (filters.protectiveFeet === "unknown" && g.hasProtectiveFeet != null) continue;

      // The listings that survive the active per-listing spec filters.
      const matching = g.listed.filter(matchesSpec);
      if (matching.length === 0) continue;
      totalListings += matching.length;

      const cheapest = matching.reduce((lo, c) => (c.price < lo.price ? c : lo), matching[0]);
      const sellers = new Set(matching.map((r) => platformLabel(r.platform)));
      const colors = new Set(matching.map((r) => r.spec.colorway?.toLowerCase()).filter(Boolean));

      // Rate the tile by the price the tile SHOWS: the cheapest listing against its own
      // spec's market value, kept only on a like-for-like basis (leather + color). The
      // old best-band-of-all-listings badge saturated — over 50+ listings, at least one
      // always sits 10% under its bucket's median, so every tile read "Great deal" and
      // the signal meant nothing (owner flagged it 2026-07-08). One listing, one verdict.
      const cheapestRating = rateListing(cheapest.price, cheapest.spec, g.comps);
      const dealBand =
        cheapestRating != null && isConfidentBasis(cheapestRating.fairValue)
          ? cheapestRating.band
          : null;

      // Image candidates: the cheapest listing's variant first (it's the price shown),
      // then the group's other listed variants, newest observation first.
      const imageVariantIds = [
        cheapest.variantId,
        ...[...matching]
          .sort((a, b) => (b.observedOn ?? "").localeCompare(a.observedOn ?? ""))
          .map((r) => r.variantId),
      ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 6);

      products.push({
        key: g.key,
        variantId: cheapest.variantId,
        styleId: g.styleId,
        imageVariantIds,
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

    // Feet facet: only surface options that actually have products behind them, so
    // the control hides itself when the column is absent OR nothing is documented.
    const protectiveFeetFacet: Facet[] = [];
    if (feetAvailable && feetYes > 0) protectiveFeetFacet.push({ value: "yes", count: feetYes });
    if (feetAvailable && feetUnknown > 0)
      protectiveFeetFacet.push({ value: "unknown", count: feetUnknown });

    const facets: ShopFacets = {
      brands: sortFacet(facetAcc.brands, 50),
      colors: groupByFamily(facetAcc.colors, colorFamCount, colorFamily, 20),
      materials: groupByFamily(facetAcc.materials, materialFamCount, materialFamily, 20),
      hardware: sortFacet(facetAcc.hardware, 16),
      conditions: sortFacet(facetAcc.conditions, 12),
      protectiveFeet: protectiveFeetFacet,
    };

    // Product-level filters (search/brand/price/deals) on top of the listing-level spec filters.
    // Text search narrows to the matched styleId set (resolved by the same search engine
    // /search uses), so the market grid, the query, and every facet compose on one surface.
    if (filters.styleIds != null) {
      const wanted = new Set(filters.styleIds);
      products = products.filter((p) => wanted.has(p.styleId));
    }
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
