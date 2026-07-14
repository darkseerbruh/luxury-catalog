/**
 * Market search resolution — the bridge that lets the `/shop` grid narrow to a text
 * query. It reuses the EXACT ranking `/search` uses (priority pins + hybrid/legacy +
 * matched brands), then hands back the matched styleId set (to filter the grid) plus the
 * matched styles (so styles with no live listing can still surface in a fallback strip).
 *
 * One search brain, two surfaces: keeping this in one place is what makes "search and the
 * market are the same thing" true instead of two engines that drift apart.
 */

import {
  searchCatalog,
  type SearchResults,
  type StyleSearchResult,
  type BrandSearchResult,
} from "@/lib/queries";
import { hybridSearch } from "@/lib/hybrid-search";
import { findPriorityStyles, pinStylesFirst, priorityChipLabels } from "@/lib/search-priority";
import type { PersonalizationProfile } from "@/lib/personalization/types";

export interface MarketSearch {
  /** Every style the query matched — the set the market grid narrows to. */
  styleIds: number[];
  /** Matched styles, best first (pins ahead of ranked). Drives the "in the catalog,
   *  not for sale" fallback strip when a match has no live listing. */
  styles: StyleSearchResult[];
  /** Brand cards the query matched (broader context under the grid). */
  brands: BrandSearchResult[];
  /** NL parse chips ("Interpreted as: black · crossbody"), or the pinned-style labels. */
  interpreted: string[];
  usedNaturalLanguage: boolean;
}

/**
 * Resolve a query into the matched-style set + context, mirroring `/search` so both
 * surfaces rank identically. Falls back to plain `searchCatalog` when Voyage isn't
 * configured or the user is logged out.
 */
export async function resolveMarketSearch(
  query: string,
  profile: PersonalizationProfile | null,
): Promise<MarketSearch> {
  const q = query.trim();
  if (!q) return { styleIds: [], styles: [], brands: [], interpreted: [], usedNaturalLanguage: false };

  // Priority pin (exact style / "brand + line number") resolves in parallel with the ranked legs.
  const priorityPromise = findPriorityStyles(q);

  const ranked: SearchResults = process.env.VOYAGE_API_KEY
    ? await hybridSearch(q, profile).then(async (hybridStyles) => {
        const base = await searchCatalog(q);
        return {
          brands: base.brands,
          styles: hybridStyles.length > 0 ? hybridStyles : base.styles,
          interpreted: base.interpreted,
          usedNaturalLanguage: base.usedNaturalLanguage,
        };
      })
    : await searchCatalog(q);

  const pinned = await priorityPromise;
  const styles = pinStylesFirst(pinned, ranked.styles);
  // A fired pin IS the interpretation (the NL chips misread exactly these shapes).
  const interpreted = pinned.length > 0 ? priorityChipLabels(pinned) : ranked.interpreted;

  // The matched styleId set, ordered by relevance (styles first, best match first —
  // a Set preserves insertion order, and getShopProducts reads that order for the
  // "relevance" sort). We only fan out to a matched brand's whole house for a BARE
  // brand query ("Chanel"): when the query pinned or ranked a specific style
  // ("birkin"), pouring in every sibling style buries the bag they asked for under
  // the rest of the house, so we keep the set to the styles that actually matched.
  const ids = new Set<number>();
  for (const s of styles) ids.add(s.styleId);
  if (styles.length === 0) {
    for (const b of ranked.brands) for (const s of b.styles) ids.add(s.styleId);
  }

  return {
    styleIds: [...ids],
    styles,
    brands: ranked.brands,
    interpreted,
    usedNaturalLanguage: ranked.usedNaturalLanguage,
  };
}
