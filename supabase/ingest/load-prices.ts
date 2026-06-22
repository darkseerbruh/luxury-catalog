/**
 * Loader: read normalised PriceObservations from the landing zone
 * (data/ingest/<source>/*.json) and upsert them into price_history. Resolves
 * brand -> style -> variant by REUSING the proven matcher in
 * src/lib/image-import-core.ts (no new matching logic). Idempotent via the
 * 0021 dedup index (variant_id, platform, price_type, observed_on, sale_price).
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
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { write: false, limit: null };
  for (const a of argv) {
    if (a === "--write") flags.write = true;
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
  let unresolved = 0;

  for (const o of observations) {
    const brand = brandByNorm.get(norm(normalizeDesigner(o.brand)));
    if (!brand) {
      unresolved++;
      console.warn(`  no brand match: ${o.brand} / ${o.style}`);
      continue;
    }
    if (!stylesCache.has(brand.brand_id)) stylesCache.set(brand.brand_id, await loadStylesForBrand(brand.brand_id));
    const style = pickStyle(stylesCache.get(brand.brand_id)!, o.style);
    if (!style) {
      unresolved++;
      console.warn(`  no style match: ${o.brand} / ${o.style}`);
      continue;
    }
    if (!variantsCache.has(style.style_id)) variantsCache.set(style.style_id, await loadVariantsForStyle(style.style_id));
    const variant = pickVariant(variantsCache.get(style.style_id)!, {
      size: o.attrs.size_label,
      colors: o.attrs.exterior_colorway,
      hardware: o.attrs.hardware_color,
    });
    if (!variant) {
      unresolved++;
      console.warn(`  no variant for style ${style.name}`);
      continue;
    }
    rows.push(toRow(o, variant.variant_id));
  }

  console.log(`Resolved ${rows.length} row(s); ${unresolved} unresolved.`);
  if (!flags.write) {
    console.log("DRY RUN — pass --write to persist. Sample:");
    console.table(rows.slice(0, 8).map((r) => ({ variant_id: r.variant_id, platform: r.platform, type: r.price_type, price: r.sale_price, on: r.observed_on })));
    return;
  }
  if (rows.length === 0) return;

  const { error } = await supabaseAdmin
    .from("price_history")
    .upsert(rows, { onConflict: "variant_id,platform,price_type,observed_on,sale_price", ignoreDuplicates: true });
  if (error) throw error;
  console.log(`Upserted ${rows.length} price row(s). Refresh variant_price_summary to surface them.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
