/**
 * Bag finder — the data layer behind ONE search component used both in the nav
 * and for adding a bag to your closet (see docs/ux/unified-search-and-review-spec.md).
 *
 * Two behaviours the plain nav suggest could not do:
 * - POPULATE ON FOCUS: an empty query returns the top popular MODELS, so the grid
 *   is never a blank box.
 * - MODEL → COLOUR: a query that resolves to one model, or an explicit styleId,
 *   returns that model in its COLOURWAYS, so an owner who does not know the colour
 *   name picks the closest swatch by sight.
 *
 * Pure matching/grouping/ranking is exported and unit-tested; the DB layer is
 * resilient (degrades to empty when Supabase env or a column is absent, mirroring
 * queries.ts / votes.ts) so it never breaks a page.
 */

import { unstable_cache } from "next/cache";
import { getSupabase, fetchAllRows } from "@/lib/supabase";
import { CACHE_CATALOG } from "@/lib/cache";
import { getVariantImages } from "@/lib/queries";
import { displaySizeLabel } from "@/lib/variant-label";
import { normalizeStyleName } from "@/lib/search-priority";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A distinct colourway of one model, with a representative variant to attach to. */
export interface FinderColour {
  colourName: string;
  variantId: number;
  sizeLabel: string | null;
  image: string | null;
}

/** One model tile in the grid (a `style`, shown by its hero colour). */
export interface FinderModel {
  styleId: number;
  name: string;
  brand: string;
  colourCount: number;
  heroVariantId: number | null;
  heroImage: string | null;
}

/** Cached catalog structure per model — names + colourways, no images (resolved
 * per request for only the small visible set). */
export interface FinderIndexRow {
  styleId: number;
  name: string;
  brand: string;
  /** Distinct colourways, representative variant each (image-bearing preferred). */
  colourways: { colourName: string; variantId: number; sizeLabel: string | null }[];
  heroVariantId: number | null;
  hasImage: boolean;
}

// ── Pure helpers (unit-tested) ─────────────────────────────────────────────────

/** Collapse a style's variants into distinct colourways. Representative variant
 * prefers one with an image so the swatch shows a real photo. A variant with no
 * named colourway buckets under "Standard" so a model is never colour-less. */
export function groupColourways(
  variants: {
    variantId: number;
    exteriorColorway: string | null;
    sizeLabel: string | null;
    hasImage: boolean;
  }[],
): { colourName: string; variantId: number; sizeLabel: string | null }[] {
  const byColour = new Map<
    string,
    { colourName: string; variantId: number; sizeLabel: string | null; hasImage: boolean }
  >();
  for (const v of variants) {
    const colourName = (v.exteriorColorway ?? "").trim() || "Standard";
    const cur = byColour.get(colourName.toLowerCase());
    if (!cur || (v.hasImage && !cur.hasImage)) {
      byColour.set(colourName.toLowerCase(), {
        colourName,
        variantId: v.variantId,
        sizeLabel: v.sizeLabel,
        hasImage: v.hasImage,
      });
    }
  }
  return Array.from(byColour.values()).map(({ colourName, variantId, sizeLabel }) => ({
    colourName,
    variantId,
    sizeLabel,
  }));
}

/** Does a query match a model by name, brand, "brand name", or any colourway name? */
export function matchesModel(query: string, row: FinderIndexRow): boolean {
  const q = normalizeStyleName(query);
  if (!q) return true;
  const name = normalizeStyleName(row.name);
  const brand = normalizeStyleName(row.brand);
  if (name.includes(q) || brand.includes(q) || `${brand} ${name}`.includes(q)) return true;
  return row.colourways.some((c) => normalizeStyleName(c.colourName).includes(q));
}

/** Popularity/quality order for the default ("Popular right now") grid: most
 * closet-adds first, then models with a real photo, then more colourways (a proxy
 * for an established line), then id for stability. */
export function rankModels(
  rows: FinderIndexRow[],
  popularity: Record<number, number>,
): FinderIndexRow[] {
  return [...rows].sort(
    (a, b) =>
      (popularity[b.styleId] ?? 0) - (popularity[a.styleId] ?? 0) ||
      Number(b.hasImage) - Number(a.hasImage) ||
      b.colourways.length - a.colourways.length ||
      a.styleId - b.styleId,
  );
}

/** Matched-query order: photo first, then more colourways, then the shorter (cleaner)
 * name, then id. Popularity is not used here — the query already expressed intent. */
export function orderMatches(rows: FinderIndexRow[]): FinderIndexRow[] {
  return [...rows].sort(
    (a, b) =>
      Number(b.hasImage) - Number(a.hasImage) ||
      b.colourways.length - a.colourways.length ||
      a.name.length - b.name.length ||
      a.styleId - b.styleId,
  );
}

// ── DB layer (resilient) ───────────────────────────────────────────────────────

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

type IndexQueryRow = {
  style_id: number;
  name: string;
  brand: { name: string } | { name: string }[] | null;
  variant:
    | { variant_id: number; exterior_colorway: string | null; size_label: string | null; image_url: string | null }[]
    | null;
};

/** The full finder index (~700 models with their colourways) — catalog structure,
 * cached like the other catalog reads. Resilient to a missing image_url column. */
const getFinderIndex = unstable_cache(
  async (): Promise<FinderIndexRow[]> => {
    if (!hasSupabase()) return [];
    try {
      const rows = await fetchAllRows<IndexQueryRow>(() =>
        getSupabase()
          .from("style")
          .select(
            "style_id, name, brand:brand_id(name), variant(variant_id, exterior_colorway, size_label, image_url)",
          ),
      );
      return rows.map((r) => {
        const brand = Array.isArray(r.brand) ? r.brand[0] : r.brand;
        const variants = (r.variant ?? []).map((v) => ({
          variantId: v.variant_id,
          exteriorColorway: v.exterior_colorway,
          sizeLabel: displaySizeLabel(v.size_label),
          hasImage: Boolean(v.image_url),
        }));
        const colourways = groupColourways(variants);
        const hero = variants.find((v) => v.hasImage) ?? variants[0] ?? null;
        return {
          styleId: r.style_id,
          name: r.name,
          brand: brand?.name ?? "",
          colourways,
          heroVariantId: hero?.variantId ?? null,
          hasImage: variants.some((v) => v.hasImage),
        };
      });
    } catch {
      return [];
    }
  },
  ["bag-finder-index"],
  { revalidate: CACHE_CATALOG },
);

/** Closet-add counts per style, for the default grid. Resilient → {} (pre-launch
 * this is sparse, so the grid falls back to photo + colourway order). */
async function getPopularity(index: FinderIndexRow[]): Promise<Record<number, number>> {
  if (!hasSupabase()) return {};
  try {
    const variantToStyle = new Map<number, number>();
    for (const row of index) {
      for (const c of row.colourways) variantToStyle.set(c.variantId, row.styleId);
      if (row.heroVariantId != null) variantToStyle.set(row.heroVariantId, row.styleId);
    }
    const rows = await fetchAllRows<{ variant_id: number }>(() =>
      getSupabase().from("closet_item").select("variant_id"),
    );
    const counts: Record<number, number> = {};
    for (const r of rows) {
      const styleId = variantToStyle.get(r.variant_id);
      if (styleId != null) counts[styleId] = (counts[styleId] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * Models for the grid. Empty query → top popular models (populate on focus).
 * A query → matching models, model-level. Hero images resolved for only the
 * returned slice (cheap, and picks up community photos via getVariantImages).
 */
export async function getFinderModels(query = "", limit = 24): Promise<FinderModel[]> {
  const index = await getFinderIndex();
  if (index.length === 0) return [];

  const q = query.trim();
  let chosen: FinderIndexRow[];
  if (q) {
    chosen = orderMatches(index.filter((row) => matchesModel(q, row))).slice(0, limit);
  } else {
    const popularity = await getPopularity(index);
    chosen = rankModels(index, popularity).slice(0, limit);
  }

  const heroIds = chosen.map((r) => r.heroVariantId).filter((n): n is number => n != null);
  const images = await getVariantImages(heroIds);
  return chosen.map((r) => ({
    styleId: r.styleId,
    name: r.name,
    brand: r.brand,
    colourCount: r.colourways.length,
    heroVariantId: r.heroVariantId,
    heroImage: r.heroVariantId != null ? images[r.heroVariantId] ?? null : null,
  }));
}

/** One model's colourways, with images resolved — the "pick the colour closest to
 * yours" grid. Empty when the style is unknown. */
export async function getFinderColourways(styleId: number): Promise<FinderColour[]> {
  const index = await getFinderIndex();
  const row = index.find((r) => r.styleId === styleId);
  if (!row) return [];
  const images = await getVariantImages(row.colourways.map((c) => c.variantId));
  return row.colourways.map((c) => ({
    colourName: c.colourName,
    variantId: c.variantId,
    sizeLabel: c.sizeLabel,
    image: images[c.variantId] ?? null,
  }));
}
