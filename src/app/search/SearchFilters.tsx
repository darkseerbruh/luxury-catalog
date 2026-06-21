"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  SearchResults,
  BrandSearchResult,
  StyleSearchResult,
} from "@/lib/queries";
import { track, EVENTS } from "@/lib/analytics/events";

type SortKey = "relevance" | "az" | "count";

const TIER_LABEL: Record<string, string> = {
  thrift: "thrift",
  mid: "mid",
  "ultra-luxury": "ultra luxury",
};

/** Result count contributed by a brand card (its variant count). */
function brandWeight(b: BrandSearchResult): number {
  return b.variantCount;
}

/** Result count contributed by a style card (its variant count). */
function styleWeight(s: StyleSearchResult): number {
  return s.variants.length;
}

/**
 * Client-side faceted refinement over the already-fetched search results.
 *
 * Facets are derived ONLY from attributes present in `SearchResults`: brand
 * tier and brand. Sorting (relevance / A–Z / result count) reorders the visible
 * cards. On mobile the controls live in a sticky-triggered tray overlay so
 * results stay partly visible; on desktop they render inline.
 */
export default function SearchFilters({ results }: { results: SearchResults }) {
  const [activeTiers, setActiveTiers] = useState<Set<string>>(new Set());
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("relevance");
  const [trayOpen, setTrayOpen] = useState(false);

  // Brand name -> tier, for filtering style cards (which only carry brandName).
  const brandTierByName = useMemo(() => {
    const map = new Map<string, BrandSearchResult["tier"]>();
    for (const b of results.brands) map.set(b.name, b.tier);
    return map;
  }, [results.brands]);

  // Tier facet values with counts (over brand cards, the only tier-bearing data).
  const tierFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of results.brands) {
      counts.set(b.tier, (counts.get(b.tier) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [results.brands]);

  // Brand facet values with counts (brand cards + brands referenced by styles).
  const brandFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of results.brands) {
      counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
    }
    for (const s of results.styles) {
      if (!s.brandName) continue;
      counts.set(s.brandName, (counts.get(s.brandName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [results.brands, results.styles]);

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function toggleTier(value: string) {
    setActiveTiers((prev) => {
      const next = toggle(prev, value);
      track(EVENTS.catalogFiltered, { filter: "brand_tier", value });
      return next;
    });
  }

  function toggleBrand(value: string) {
    setActiveBrands((prev) => {
      const next = toggle(prev, value);
      track(EVENTS.catalogFiltered, { filter: "brand", value });
      return next;
    });
  }

  function clearAll() {
    setActiveTiers(new Set());
    setActiveBrands(new Set());
  }

  // Apply filters + sort.
  const visible = useMemo(() => {
    const tierFilter = (tier: string | undefined) =>
      activeTiers.size === 0 || (tier != null && activeTiers.has(tier));
    const brandFilter = (name: string) =>
      activeBrands.size === 0 || activeBrands.has(name);

    let brands = results.brands.filter(
      (b) => tierFilter(b.tier) && brandFilter(b.name),
    );
    let styles = results.styles.filter(
      (s) =>
        tierFilter(brandTierByName.get(s.brandName)) && brandFilter(s.brandName),
    );

    if (sort === "az") {
      brands = [...brands].sort((a, b) => a.name.localeCompare(b.name));
      styles = [...styles].sort((a, b) =>
        (a.brandName + a.styleName).localeCompare(b.brandName + b.styleName),
      );
    } else if (sort === "count") {
      brands = [...brands].sort((a, b) => brandWeight(b) - brandWeight(a));
      styles = [...styles].sort((a, b) => styleWeight(b) - styleWeight(a));
    }
    // "relevance" keeps the server order.

    return { brands, styles };
  }, [results.brands, results.styles, activeTiers, activeBrands, sort, brandTierByName]);

  const totalVisible = visible.brands.length + visible.styles.length;
  const activeCount = activeTiers.size + activeBrands.size;
  const hasFacets = tierFacets.length > 0 || brandFacets.length > 0;

  // The controls panel — reused inline (desktop) and inside the tray (mobile).
  const controls = (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted/70">
          Sort
        </label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["relevance", "Relevance"],
              ["az", "A–Z"],
              ["count", "Most results"],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                sort === key
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted hover:border-gold hover:text-gold"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tierFacets.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted/70">
            Brand tier
          </label>
          <div className="flex flex-wrap gap-2">
            {tierFacets.map(({ value, count }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleTier(value)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeTiers.has(value)
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted hover:border-gold hover:text-gold"
                }`}
              >
                {TIER_LABEL[value] ?? value.replace("-", " ")}{" "}
                <span className="text-muted">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {brandFacets.length > 1 && (
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted/70">
            Brand
          </label>
          <div className="flex flex-wrap gap-2">
            {brandFacets.map(({ value, count }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleBrand(value)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeBrands.has(value)
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted hover:border-gold hover:text-gold"
                }`}
              >
                {value} <span className="text-muted">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Sticky filter & sort trigger (mobile) + result count (all sizes). */}
      <div className="sticky top-0 z-20 -mx-5 mb-4 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <span className="text-sm text-muted">
          {totalVisible} {totalVisible === 1 ? "result" : "results"}
        </span>
        {hasFacets && (
          <button
            type="button"
            onClick={() => setTrayOpen(true)}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold sm:hidden"
          >
            Filter &amp; sort{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        )}
      </div>

      {/* Applied-filter chips — one-tap removable. */}
      {activeCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[...activeTiers].map((value) => (
            <button
              key={`tier-${value}`}
              type="button"
              onClick={() => toggleTier(value)}
              className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-sm text-gold transition-colors hover:bg-gold/10"
            >
              {TIER_LABEL[value] ?? value.replace("-", " ")}
              <span aria-hidden>×</span>
            </button>
          ))}
          {[...activeBrands].map((value) => (
            <button
              key={`brand-${value}`}
              type="button"
              onClick={() => toggleBrand(value)}
              className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-sm text-gold transition-colors hover:bg-gold/10"
            >
              {value}
              <span aria-hidden>×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Inline controls (desktop only). */}
      {hasFacets && (
        <div className="mb-6 hidden rounded-2xl border border-border bg-surface p-5 sm:block">
          {controls}
        </div>
      )}

      {/* Mobile tray overlay — results stay partly visible behind it. */}
      {trayOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setTrayOpen(false)}
            className="absolute inset-0 bg-bg/60 backdrop-blur-sm"
          />
          <div className="relative max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface-raised p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Filter &amp; sort</h2>
              <button
                type="button"
                onClick={() => setTrayOpen(false)}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted hover:border-gold hover:text-gold"
              >
                Done
              </button>
            </div>
            {controls}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 w-full rounded-full border border-border py-2 text-sm text-muted hover:border-gold hover:text-foreground"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {totalVisible === 0 && activeCount > 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
          No results match the current filters.{" "}
          <button
            type="button"
            onClick={clearAll}
            className="text-gold hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {visible.brands.map((brand) => (
        <div
          key={brand.brandId}
          className="mb-6 rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl text-foreground">{brand.name}</h2>
            <span className="text-sm text-muted">
              {brand.variantCount}{" "}
              {brand.variantCount === 1 ? "result" : "results"}
            </span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
            {brand.tier.replace("-", " ")}
          </p>
          {brand.styleNames.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {brand.styleNames.map((name) => (
                <Link
                  key={name}
                  href={`/search?q=${encodeURIComponent(name)}`}
                  className="rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  {name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      {visible.styles.map((style) => (
        <div
          key={style.styleId}
          className="mb-6 rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted">
                {style.brandName}
              </p>
              <h2 className="font-serif text-xl text-foreground">
                {style.styleName}
              </h2>
            </div>
            <span className="text-sm text-muted">
              {style.variants.length}{" "}
              {style.variants.length === 1 ? "result" : "results"}
            </span>
          </div>
          {style.variants.length > 0 && (
            <ul className="mt-4 divide-y divide-border">
              {style.variants.map((variant) => (
                <li key={variant.variantId}>
                  <Link
                    href={`/bag/${variant.variantId}`}
                    className="flex items-center justify-between py-2 text-sm transition-colors hover:text-gold"
                  >
                    <span>
                      {[variant.sizeLabel, variant.exteriorColorway]
                        .filter(Boolean)
                        .join(" · ") || "Variant"}
                    </span>
                    {variant.hardwareColor && (
                      <span className="text-muted">
                        {variant.hardwareColor} hardware
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
