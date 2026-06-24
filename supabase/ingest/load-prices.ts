/**
 * Loader: read normalised PriceObservations from the landing zone
 * (data/ingest/<source>/*.json) and upsert them into price_history. Resolves
 * brand -> style -> variant by REUSING the proven matcher in
 * src/lib/image-import-core.ts (no new matching logic). Idempotent via the
 * 0024 dedup index (variant_id, platform, price_type, observed_on, sale_price,
 * listing_ref) — listing_ref is populated with a deterministic fallback below so
 * distinct listings never collapse while re-ingests still dedup.
 *
 * Mirrors supabase/seed/import-variant-images.ts: dry run by default, --write to
 * persist. Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 *   npx tsx supabase/ingest/load-prices.ts [source] [--write] [--limit=N]
 *   # omit [source] to load every source in data/ingest/
 *
 * Requires migration 0021 to be applied (the new price_history columns + index).
 */
import { supabaseAdmin } from "../seed/lib/client";
import { readLandingObservations } from "./lib/landing";
import {
  normalizeDesigner,
  norm,
  scoreStyleMatch,
  pickVariant,
  type VariantAttrs,
} from "../../src/lib/image-import-core";
import type { PriceObservation } from "../../src/lib/ingest/types";

interface Flags {
  source?: string;
  write: boolean;
  limit: number | null;
  /** Route EVERY observation to discovered_listing (skip curated variant resolution).
   *  For low-confidence catch-all loads that must not stamp prices on curated variants. */
  discoveredOnly: boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { write: false, limit: null, discoveredOnly: false };
  for (const a of argv) {
    if (a === "--write") flags.write = true;
    else if (a === "--discovered-only") flags.discoveredOnly = true;
    else if (a.startsWith("--limit=")) flags.limit = Number(a.slice("--limit=".length)) || null;
    else if (!a.startsWith("--")) flags.source = a;
  }
  return flags;
}

type BrandRow = { brand_id: number; name: string };
type StyleRow = { style_id: number; name: string; brand_id: number };

async function loadStylesForBrand(brandId: number): Promise<StyleRow[]> {
  const { data, error } = await supabaseAdmin
    .from("style")
    .select("style_id, name, brand_id")
    .eq("brand_id", brandId);
  if (error) throw error;
  return (data ?? []) as StyleRow[];
}

async function loadVariantsForStyle(styleId: number): Promise<VariantAttrs[]> {
  const { data, error } = await supabaseAdmin
    .from("variant")
    .select("variant_id, size_label, exterior_colorway, hardware_color, hardware_type")
    .eq("style_id", styleId);
  if (error) throw error;
  return (data ?? []) as VariantAttrs[];
}

function pickStyle(styles: StyleRow[], styleName: string): StyleRow | null {
  let best: { s: StyleRow; score: number } | null = null;
  for (const s of styles) {
    const score = scoreStyleMatch(s.name, styleName);
    if (score > 0 && (!best || score > best.score)) best = { s, score };
  }
  return best ? best.s : null;
}

function toRow(o: PriceObservation, variantId: number) {
  return {
    variant_id: variantId,
    platform: o.platform,
    condition: o.condition ?? null,
    sale_price: o.sale_price,
    currency: o.currency,
    price_type: o.price_type,
    observed_on: o.observed_on,
    date_recorded: new Date().toISOString().slice(0, 10),
    source_url: o.source_url,
    confidence_level: o.confidence,
    notes: o.notes ?? null,
    // Per-listing resale spec (migration 0022); harmless nulls for retail rows.
    colorway: o.attrs.exterior_colorway ?? null,
    material: o.attrs.exterior_material ?? null,
    hardware_color: o.attrs.hardware_color ?? null,
    production_year: o.attrs.production_year ?? null,
    season: o.attrs.season ?? null,
    condition_detail: o.attrs.condition_detail ?? null,
    inclusions: o.attrs.inclusions ?? null,
    region: o.attrs.region ?? null,
    // Per-listing dedup key (migration 0024). Deterministic fallback to source_url
    // so listing_ref is NEVER null at write time: distinct listings (distinct
    // listing_ref) stay distinct, while non-listing sources (retail_msrp/wayback)
    // dedup idempotently on their stable source_url.
    listing_ref: o.attrs.listing_ref ?? o.source_url,
    enrichment: o.enrichment ?? null,
    // Live-vs-sold state (migration 0030). Only resale *listings* are "available"
    // and thus reconcilable to 'sold' later; sold/auction/retail rows are historical
    // facts, not live offers, so they stay NULL and are never retired.
    listing_status: o.price_type === "listed" ? "available" : null,
  };
}

/**
 * Build a discovered_listing row for an observation the loader could NOT place on a
 * curated variant (catalog backbone §5 / migration 0026). Keeps the full parsed spec
 * plus whatever partial match we got (brand/style ids), so a later promotion pass can
 * roll recurring models into the clean catalog. Nothing real is dropped.
 */
function toDiscovered(
  o: PriceObservation,
  reason: "no_brand" | "no_style" | "no_variant" | "catch_all",
  matchedBrandId: number | null,
  matchedStyleId: number | null
) {
  return {
    platform: o.platform,
    listing_ref: o.attrs.listing_ref ?? o.source_url,
    source_url: o.source_url,
    raw_name: o.notes ?? null,
    brand_guess: o.brand,
    style_guess: o.style,
    matched_brand_id: matchedBrandId,
    matched_style_id: matchedStyleId,
    size_label: o.attrs.size_label ?? null,
    colorway: o.attrs.exterior_colorway ?? null,
    material: o.attrs.exterior_material ?? null,
    hardware_color: o.attrs.hardware_color ?? null,
    production_year: o.attrs.production_year ?? null,
    season: o.attrs.season ?? null,
    inclusions: o.attrs.inclusions ?? null,
    price_type: o.price_type,
    sale_price: o.sale_price,
    currency: o.currency,
    condition: o.condition ?? null,
    unresolved_reason: reason,
    observed_on: o.observed_on,
  };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  let observations = readLandingObservations(flags.source);
  if (flags.limit) observations = observations.slice(0, flags.limit);
  console.log(`Loaded ${observations.length} observation(s) from landing${flags.source ? ` (${flags.source})` : ""}.`);
  if (observations.length === 0) return;

  const { data: brandData, error: brandErr } = await supabaseAdmin.from("brand").select("brand_id, name");
  if (brandErr) throw brandErr;
  const brands = (brandData ?? []) as BrandRow[];
  const brandByNorm = new Map(brands.map((b) => [norm(b.name), b]));

  const stylesCache = new Map<number, StyleRow[]>();
  const variantsCache = new Map<number, VariantAttrs[]>();

  const rows: ReturnType<typeof toRow>[] = [];
  const discovered: ReturnType<typeof toDiscovered>[] = [];

  for (const o of observations) {
    const brand = brandByNorm.get(norm(normalizeDesigner(o.brand)));
    // discovered-only: never place on a curated variant (avoids loose-match price
    // pollution); keep the brand id when known so promote-discovered can cluster.
    if (flags.discoveredOnly) {
      discovered.push(toDiscovered(o, "catch_all", brand?.brand_id ?? null, null));
      continue;
    }
    if (!brand) {
      discovered.push(toDiscovered(o, "no_brand", null, null));
      continue;
    }
    if (!stylesCache.has(brand.brand_id)) stylesCache.set(brand.brand_id, await loadStylesForBrand(brand.brand_id));
    const style = pickStyle(stylesCache.get(brand.brand_id)!, o.style);
    if (!style) {
      discovered.push(toDiscovered(o, "no_style", brand.brand_id, null));
      continue;
    }
    if (!variantsCache.has(style.style_id)) variantsCache.set(style.style_id, await loadVariantsForStyle(style.style_id));
    const variant = pickVariant(variantsCache.get(style.style_id)!, {
      size: o.attrs.size_label,
      colors: o.attrs.exterior_colorway,
      hardware: o.attrs.hardware_color,
    });
    if (!variant) {
      discovered.push(toDiscovered(o, "no_variant", brand.brand_id, style.style_id));
      continue;
    }
    rows.push(toRow(o, variant.variant_id));
  }

  console.log(`Resolved ${rows.length} row(s); ${discovered.length} unresolved -> discovered_listing.`);
  if (!flags.write) {
    console.log("DRY RUN — pass --write to persist. Sample:");
    console.table(rows.slice(0, 8).map((r) => ({ variant_id: r.variant_id, platform: r.platform, type: r.price_type, price: r.sale_price, on: r.observed_on })));
    if (discovered.length) {
      const byReason = discovered.reduce<Record<string, number>>((m, d) => ((m[d.unresolved_reason] = (m[d.unresolved_reason] ?? 0) + 1), m), {});
      console.log(`  would capture ${discovered.length} to discovered_listing:`, byReason);
    }
    return;
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("price_history")
      .upsert(rows, { onConflict: "variant_id,platform,price_type,observed_on,sale_price,listing_ref", ignoreDuplicates: true });
    if (error) throw error;
    console.log(`Upserted ${rows.length} price row(s). Refresh variant_price_summary to surface them.`);
  }

  // Two-tier raw layer (migration 0026). Resilient: if the table isn't there yet,
  // the loader keeps working (the unresolved rows are simply not captured this run,
  // as before) so merging this ahead of the migration never breaks a load.
  if (discovered.length > 0) {
    const { error } = await supabaseAdmin
      .from("discovered_listing")
      .upsert(discovered, { onConflict: "platform,listing_ref,observed_on,sale_price", ignoreDuplicates: true });
    if (error) {
      if (error.code === "42P01") {
        console.warn(`  discovered_listing not found — apply migration 0026, then re-run to capture ${discovered.length} unresolved listing(s).`);
      } else {
        throw error;
      }
    } else {
      console.log(`Captured ${discovered.length} unresolved listing(s) to discovered_listing.`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
