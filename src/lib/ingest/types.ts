/**
 * Pure, no-DB core for the multi-source price-ingestion pipeline. The shape every
 * source adapter (supabase/ingest/sources/*) emits, plus validation. Extracted
 * here — like image-import-core.ts — so the parsing/normalising logic that's most
 * likely to be wrong is unit-testable without network or Supabase.
 *
 * See docs/data-sourcing-research.md for the source->signal map and the locked
 * legal/attribution posture (every row MUST carry a source_url).
 */

/** Maps to the `price_type` enum added in migration 0021. */
export type PriceType = "listed" | "sold" | "auction" | "retail_msrp" | "estimate";

/** Maps to the `confidence_level` enum (0001). */
export type Confidence = "low" | "medium" | "high" | "verified";

/** Maps to the `sale_condition` enum (0001). */
export type SaleCondition = "new" | "excellent" | "very good" | "good" | "fair";

/** Best-effort attributes used to resolve the row to a catalog variant. */
export interface ObservationAttrs {
  size_label?: string | null;
  exterior_colorway?: string | null;
  hardware_color?: string | null;
  exterior_material?: string | null;
  /** Production/collection start year of the specific listing (resale spec). */
  production_year?: number | null;
  /** Collection/season label, e.g. "2011-2012". */
  season?: string | null;
}

/**
 * One observed price, source-agnostic. Adapters produce these; load-prices.ts
 * resolves `brand`/`style`/`attrs` to a variant and upserts into price_history.
 */
export interface PriceObservation {
  brand: string;
  style: string;
  attrs: ObservationAttrs;
  platform: string;
  price_type: PriceType;
  sale_price: number;
  currency: string;
  condition?: SaleCondition | null;
  observed_on: string; // ISO date (YYYY-MM-DD) the price was true at source
  source_url: string; // REQUIRED — attribution + dedup
  confidence: Confidence;
  notes?: string | null;
}

const PRICE_TYPES: ReadonlySet<string> = new Set([
  "listed",
  "sold",
  "auction",
  "retail_msrp",
  "estimate",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate an observation before it's written/loaded. Returns the list of
 * problems (empty = valid). Enforces the non-negotiables: a positive price, a
 * real source_url, a known price_type, and an ISO observed_on date.
 */
export function validateObservation(o: Partial<PriceObservation>): string[] {
  const errors: string[] = [];
  if (!o.brand?.trim()) errors.push("missing brand");
  if (!o.style?.trim()) errors.push("missing style");
  if (!o.platform?.trim()) errors.push("missing platform");
  if (!o.price_type || !PRICE_TYPES.has(o.price_type)) errors.push(`bad price_type: ${o.price_type}`);
  if (typeof o.sale_price !== "number" || !Number.isFinite(o.sale_price) || o.sale_price <= 0)
    errors.push(`bad sale_price: ${o.sale_price}`);
  if (!o.currency?.trim()) errors.push("missing currency");
  if (!o.observed_on || !ISO_DATE.test(o.observed_on)) errors.push(`bad observed_on: ${o.observed_on}`);
  if (!o.source_url || !/^https?:\/\/\S+$/i.test(o.source_url)) errors.push("missing/invalid source_url");
  return errors;
}

export function isValidObservation(o: Partial<PriceObservation>): o is PriceObservation {
  return validateObservation(o).length === 0;
}
