/**
 * Search priority pins — deterministic style-name routing for /search.
 *
 * The ranked search legs (Claude filter parse + hybrid BM25/vector) both misread
 * two query shapes the catalog actually has names for:
 * - a query that IS a style name ("alma" → should lead with the Alma style
 *   family, not whichever single variant a leg happened to rank first);
 * - a brand + number where the number is a LINE, not a size ("chanel 25" is the
 *   Chanel 25 line, not Classic Flap size 25; same shape: Chanel 19/22, Celine 16).
 *
 * This module resolves those pins from the style table itself (no hardcoded
 * synonym list — a new "Chanel 31" style is picked up the day it's seeded) and
 * the search page prepends them to whatever the ranked legs returned. Video-CTA
 * routing (social-search-keys.ts) is unaffected: it pins articles, this pins
 * catalog styles, and both can appear on the same results page.
 */

import { unstable_cache } from "next/cache";
import { getSupabase, fetchAllRows } from "@/lib/supabase";
import { CACHE_CATALOG } from "@/lib/cache";
import type { StyleSearchResult } from "@/lib/queries";

// ── Pure matching (unit-tested) ───────────────────────────────────────────────

/** Lowercase, strip punctuation/diacritics, collapse whitespace — so a typed
 * query and a catalogued name compare on words alone ("16 (Sixteen)" → "16 sixteen"). */
export function normalizeStyleName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface StyleNameRow {
  styleId: number;
  name: string;
  brandName: string;
}

/**
 * How strongly a query pins a catalogued style. 0 = no pin.
 * 3 — query is exactly the style name ("alma" → "Alma", "chanel 25" → "Chanel 25")
 * 2 — query is exactly brand + style name ("louis vuitton alma" → LV "Alma")
 * 1 — numeric-line rule: query is "<brand> <digits>" and that brand has a style
 *     named for the number ("celine 16" → Celine "16 (Sixteen)"). The brand gate
 *     keeps "chanel 25" from pinning Hermès "Birkin 25" or LV "Speedy 25".
 */
export function priorityMatchTier(query: string, style: StyleNameRow): number {
  const q = normalizeStyleName(query);
  if (!q) return 0;

  const name = normalizeStyleName(style.name);
  const brand = normalizeStyleName(style.brandName);

  if (name === q) return 3;
  if (brand && `${brand} ${name}` === q) return 2;

  if (brand && q.startsWith(`${brand} `)) {
    const rest = q.slice(brand.length + 1);
    if (/^\d+$/.test(rest) && (name === rest || name.startsWith(`${rest} `))) {
      return 1;
    }
  }

  return 0;
}

/** Style ids to pin, strongest match first (ties broken by shorter name = the
 * cleaner line entry, then id for stability). Capped so a pin never floods the page. */
export function rankPriorityStyles(query: string, rows: StyleNameRow[], cap = 3): number[] {
  return rows
    .map((row) => ({ row, tier: priorityMatchTier(query, row) }))
    .filter((m) => m.tier > 0)
    .sort(
      (a, b) =>
        b.tier - a.tier ||
        a.row.name.length - b.row.name.length ||
        a.row.styleId - b.row.styleId,
    )
    .slice(0, cap)
    .map((m) => m.row.styleId);
}

/** Prepend pinned styles to ranked results, deduping the ranked list. */
export function pinStylesFirst(
  pinned: StyleSearchResult[],
  ranked: StyleSearchResult[],
): StyleSearchResult[] {
  if (pinned.length === 0) return ranked;
  const pinnedIds = new Set(pinned.map((s) => s.styleId));
  return [...pinned, ...ranked.filter((s) => !pinnedIds.has(s.styleId))];
}

// ── DB resolution ─────────────────────────────────────────────────────────────

type StyleNameQueryRow = {
  style_id: number;
  name: string;
  brand: { name: string } | { name: string }[] | null;
};

/** The full style-name index (id, name, brand) — small (~700 rows), catalog-
 * structure data, cached like the other catalog reads. */
const getStyleNameIndex = unstable_cache(
  async (): Promise<StyleNameRow[]> => {
    const rows = await fetchAllRows<StyleNameQueryRow>(() =>
      getSupabase().from("style").select("style_id, name, brand:brand_id(name)"),
    );
    return rows.map((r) => {
      const brand = Array.isArray(r.brand) ? r.brand[0] : r.brand;
      return { styleId: r.style_id, name: r.name, brandName: brand?.name ?? "" };
    });
  },
  ["search-priority-style-names"],
  { revalidate: CACHE_CATALOG },
);

/**
 * Resolve the styles a query pins, as full StyleSearchResult entries (with their
 * variants) ready to prepend to the ranked results. Empty array = no pin.
 */
export async function findPriorityStyles(query: string): Promise<StyleSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const index = await getStyleNameIndex();
  const styleIds = rankPriorityStyles(q, index);
  if (styleIds.length === 0) return [];

  const { data } = await getSupabase()
    .from("style")
    .select(
      "style_id, name, brand:brand_id(name), variant(variant_id, size_label, exterior_colorway, hardware_color)",
    )
    .in("style_id", styleIds);
  if (!data) return [];

  const byId = new Map(data.map((s) => [s.style_id as number, s]));
  return styleIds.flatMap((id) => {
    const s = byId.get(id);
    if (!s) return [];
    const brand = Array.isArray(s.brand) ? s.brand[0] : s.brand;
    return [
      {
        styleId: s.style_id as number,
        styleName: s.name as string,
        brandName: (brand as { name: string } | null)?.name ?? "",
        variants: ((s.variant ?? []) as {
          variant_id: number;
          size_label: string | null;
          exterior_colorway: string | null;
          hardware_color: string | null;
        }[]).map((v) => ({
          variantId: v.variant_id,
          sizeLabel: v.size_label,
          exteriorColorway: v.exterior_colorway,
          hardwareColor: v.hardware_color,
        })),
      },
    ];
  });
}
