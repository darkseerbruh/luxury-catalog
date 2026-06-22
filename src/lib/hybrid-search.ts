/**
 * Phase-3 hybrid search: BM25 (keyword ilike) + dense vector (pgvector cosine),
 * fused with Reciprocal Rank Fusion, then reranked by user taste profile.
 *
 * Degrades gracefully:
 * - No VOYAGE_API_KEY → skip vector leg, return BM25-only results
 * - pgvector extension not enabled (42P01/42704) → skip vector leg
 * - No user profile → skip taste rerank, return fused order
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/supabase";
import { embedQuery } from "@/lib/voyage";
import type { PersonalizationProfile } from "@/lib/personalization/types";
import type { StyleSearchResult } from "@/lib/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VariantHit {
  variant_id: number;
  style_id: number;
  style_name: string;
  brand_name: string;
  size_label: string | null;
  exterior_colorway: string | null;
  hardware_color: string | null;
  score: number; // RRF fused score
}

// ── BM25 leg (keyword ilike, existing approach) ───────────────────────────────

/** Returns variant_id → rank (1-based) from the BM25 leg. */
async function bm25Search(
  query: string,
  limit: number
): Promise<Map<number, number>> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseAdmin()
    : getSupabase();

  const term = `%${query.replace(/[%_\\]/g, "\\$&")}%`;

  const { data } = await supabase
    .from("variant")
    .select(
      "variant_id, style:style_id(name, brand:brand_id(name))"
    )
    .or(
      `exterior_colorway.ilike.${term},hardware_color.ilike.${term},size_label.ilike.${term}`
    )
    .limit(limit);

  // Also query styles/brands by name.
  const { data: styleData } = await supabase
    .from("variant")
    .select("variant_id, style:style_id(name, brand:brand_id(name))")
    .limit(limit);

  // Filter style data client-side for style/brand name matches.
  const q = query.toLowerCase();
  const styleMatches = (styleData ?? []).filter((row) => {
    const style = Array.isArray(row.style) ? row.style[0] : row.style;
    if (!style) return false;
    const styleName = (style as { name?: string }).name?.toLowerCase() ?? "";
    const rawB = (style as { brand: unknown }).brand;
    const brand = Array.isArray(rawB)
      ? ((rawB as { name: string }[])[0]?.name ?? "")
      : ((rawB as unknown as { name: string } | null)?.name ?? "");
    return styleName.includes(q) || brand.toLowerCase().includes(q);
  });

  const ranks = new Map<number, number>();
  const all = [...(data ?? []), ...styleMatches];
  // Dedupe and rank by order found.
  let rank = 1;
  for (const row of all) {
    const vid = row.variant_id as number;
    if (!ranks.has(vid)) {
      ranks.set(vid, rank++);
    }
  }
  return ranks;
}

// ── Vector leg (pgvector cosine) ───────────────────────────────────────────────

/** Returns variant_id → rank from the dense vector leg. Returns empty map on failure/degradation. */
async function vectorSearch(
  queryEmbedding: number[],
  limit: number
): Promise<Map<number, number>> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return new Map();
  const admin = getSupabaseAdmin();

  try {
    // Use pgvector's <=> (cosine distance) operator via rpc.
    const { data, error } = await admin.rpc("match_variants", {
      query_embedding: queryEmbedding,
      match_count: limit,
    });

    if (error) {
      // 42883 = function not found (migration not applied), 42704 = type not found (pgvector not enabled)
      if (error.code === "42883" || error.code === "42704" || error.code === "42P01") {
        return new Map();
      }
      console.error("vectorSearch error:", error);
      return new Map();
    }

    const ranks = new Map<number, number>();
    ((data ?? []) as { variant_id: number }[]).forEach((row, i) => {
      ranks.set(row.variant_id, i + 1);
    });
    return ranks;
  } catch {
    return new Map();
  }
}

// ── Reciprocal Rank Fusion ────────────────────────────────────────────────────

const RRF_K = 60; // standard RRF constant

function rrfScore(rank: number): number {
  return 1 / (RRF_K + rank);
}

/** Fuse BM25 and vector rankings with RRF. Returns variant_ids sorted by fused score desc. */
function rrfFuse(
  bm25: Map<number, number>,
  vector: Map<number, number>
): { variantId: number; score: number }[] {
  const all = new Set([...bm25.keys(), ...vector.keys()]);
  const scores: { variantId: number; score: number }[] = [];

  for (const vid of all) {
    let score = 0;
    if (bm25.has(vid)) score += rrfScore(bm25.get(vid)!);
    if (vector.has(vid)) score += rrfScore(vector.get(vid)!);
    scores.push({ variantId: vid, score });
  }

  return scores.sort((a, b) => b.score - a.score);
}

// ── Taste rerank ──────────────────────────────────────────────────────────────

/** Boost fused score by profile affinity (brand + attribute). Keeps RRF ordering for no-profile case. */
function tasteRerank(
  fused: { variantId: number; score: number }[],
  profile: PersonalizationProfile | null,
  variantMeta: Map<number, { brand: string; silhouette: string | null; material: string | null; size: string | null; hardware: string | null }>
): { variantId: number; score: number }[] {
  if (!profile) return fused;

  return fused
    .map(({ variantId, score }) => {
      const meta = variantMeta.get(variantId);
      if (!meta) return { variantId, score };

      let boost = 0;

      const brandAff = profile.brandAffinities[meta.brand] ?? 0;
      if (brandAff > 0) boost += 0.3 * Math.min(brandAff / 10, 1);

      const attrAff = profile.attributeAffinities;
      if (meta.silhouette && attrAff.silhouette?.[meta.silhouette]) {
        boost += 0.15 * Math.min((attrAff.silhouette[meta.silhouette] ?? 0) / 10, 1);
      }
      if (meta.material && attrAff.material?.[meta.material]) {
        boost += 0.1 * Math.min((attrAff.material[meta.material] ?? 0) / 10, 1);
      }
      if (meta.hardware && attrAff.hardware?.[meta.hardware]) {
        boost += 0.07 * Math.min((attrAff.hardware[meta.hardware] ?? 0) / 10, 1);
      }
      if (meta.size && attrAff.size?.[meta.size]) {
        boost += 0.05 * Math.min((attrAff.size[meta.size] ?? 0) / 10, 1);
      }

      return { variantId, score: score + boost };
    })
    .sort((a, b) => b.score - a.score);
}

// ── Main hybrid search function ───────────────────────────────────────────────

/**
 * Run hybrid search for a query string and optional user profile.
 * Returns results in StyleSearchResult format (same shape as existing searchCatalog).
 */
export async function hybridSearch(
  query: string,
  profile: PersonalizationProfile | null,
  limit = 30
): Promise<StyleSearchResult[]> {
  // Run BM25 and (optionally) vector legs in parallel.
  const [bm25Ranks, queryEmbedding] = await Promise.all([
    bm25Search(query, limit * 2),
    embedQuery(query), // null if VOYAGE_API_KEY unset
  ]);

  const vectorRanks = queryEmbedding
    ? await vectorSearch(queryEmbedding, limit * 2)
    : new Map<number, number>();

  // Fuse with RRF.
  const fused = rrfFuse(bm25Ranks, vectorRanks).slice(0, limit * 2);
  if (fused.length === 0) return [];

  // Fetch metadata for all fused variant IDs.
  const variantIds = fused.map((f) => f.variantId);
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseAdmin()
    : getSupabase();

  const { data: rows, error } = await supabase
    .from("variant")
    .select(
      "variant_id, size_label, size_category, exterior_colorway, hardware_color, style:style_id(style_id, name, silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(material_type)"
    )
    .in("variant_id", variantIds);

  if (error || !rows) return [];

  // Build metadata map for taste rerank.
  const metaMap = new Map<
    number,
    { brand: string; silhouette: string | null; material: string | null; size: string | null; hardware: string | null }
  >();

  for (const row of rows) {
    const style = Array.isArray(row.style) ? row.style[0] : row.style;
    const rawB2 = style ? (style as { brand: unknown }).brand : null;
    const brand = rawB2
      ? Array.isArray(rawB2)
        ? ((rawB2 as { name: string }[])[0]?.name ?? "")
        : ((rawB2 as unknown as { name: string } | null)?.name ?? "")
      : "";
    const material = Array.isArray(row.exterior_material)
      ? (row.exterior_material[0] as { material_type: string } | null)?.material_type ?? null
      : (row.exterior_material as { material_type: string } | null)?.material_type ?? null;
    metaMap.set(row.variant_id as number, {
      brand,
      silhouette: (style as { silhouette?: string | null } | null)?.silhouette ?? null,
      material,
      size: row.size_category as string | null,
      hardware: row.hardware_color as string | null,
    });
  }

  // Taste rerank.
  const reranked = tasteRerank(fused, profile, metaMap).slice(0, limit);

  // Build StyleSearchResult[] grouped by style.
  const rowById = new Map(rows.map((r) => [r.variant_id as number, r]));
  const styleMap = new Map<
    number,
    { styleId: number; styleName: string; brandName: string; variants: VariantHit[] }
  >();

  for (const { variantId } of reranked) {
    const row = rowById.get(variantId);
    if (!row) continue;

    const style = Array.isArray(row.style) ? row.style[0] : row.style;
    const styleId: number = (style as { style_id?: number } | null)?.style_id ?? 0;
    const styleName: string = (style as { name?: string } | null)?.name ?? "";
    const rawB3 = style ? (style as { brand: unknown }).brand : null;
    const brand = rawB3
      ? Array.isArray(rawB3)
        ? ((rawB3 as { name: string }[])[0]?.name ?? "")
        : ((rawB3 as unknown as { name: string } | null)?.name ?? "")
      : "";

    if (!styleMap.has(styleId)) {
      styleMap.set(styleId, { styleId, styleName, brandName: brand, variants: [] });
    }

    styleMap.get(styleId)!.variants.push({
      variant_id: variantId,
      style_id: styleId,
      style_name: styleName,
      brand_name: brand,
      size_label: row.size_label as string | null,
      exterior_colorway: row.exterior_colorway as string | null,
      hardware_color: row.hardware_color as string | null,
      score: 0,
    });
  }

  return Array.from(styleMap.values()).map((s) => ({
    styleId: s.styleId,
    styleName: s.styleName,
    brandName: s.brandName,
    variants: s.variants.map((v) => ({
      variantId: v.variant_id,
      sizeLabel: v.size_label,
      exteriorColorway: v.exterior_colorway,
      hardwareColor: v.hardware_color,
    })),
  }));
}
