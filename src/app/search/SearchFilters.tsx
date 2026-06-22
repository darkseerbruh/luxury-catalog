"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  SearchResults,
  BrandSearchResult,
  StyleSearchResult,
} from "@/lib/queries";
import { track, EVENTS } from "@/lib/analytics/events";
import { BagImage } from "@/components/BagImage";

type SortKey = "relevance" | "az" | "count";
type Variant = StyleSearchResult["variants"][number];

const TIER_LABEL: Record<string, string> = {
  thrift: "thrift",
  mid: "mid",
  "ultra-luxury": "ultra luxury",
};

/** Attribute facets derived from the variants of the style results. */
const VARIANT_FACETS: { key: string; label: string; get: (v: Variant) => string | null }[] = [
  { key: "color", label: "Colour", get: (v) => v.exteriorColorway },
  { key: "hardware", label: "Hardware", get: (v) => v.hardwareColor },
  { key: "size", label: "Size", get: (v) => v.sizeLabel },
];

function brandWeight(b: BrandSearchResult): number {
  return b.variantCount;
}
function styleWeight(s: StyleSearchResult): number {
  return s.variants.length;
}

/** Does a variant satisfy every active attribute facet (OR within a facet, AND across facets)? */
function variantMatches(v: Variant, active: Record<string, Set<string>>): boolean {
  for (const f of VARIANT_FACETS) {
    const sel = active[f.key];
    if (!sel || sel.size === 0) continue;
    const value = f.get(v);
    if (!value || !sel.has(value)) return false;
  }
  return true;
}

/**
 * Client-side faceted refinement over the already-fetched search results.
 *
 * Facets are derived ONLY from attributes present in `SearchResults`: brand tier
 * and brand (over brand/style cards), plus colour / hardware / size (over the
 * variants of the style results). Selecting a facet narrows the visible cards and
 * the variant rows within each style. Sorting reorders the cards. On mobile the
 * controls live in a tray overlay so results stay partly visible; on desktop they
 * render inline. Every facet shows a count and every applied filter is a one-tap
 * removable chip (NN/g faceted-search guidance).
 */
export default function SearchFilters({
  results,
  images = {},
}: {
  results: SearchResults;
  images?: Record<number, string>;
}) {
  const [activeTiers, setActiveTiers] = useState<Set<string>>(new Set());
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [activeAttrs, setActiveAttrs] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<SortKey>("relevance");
  const [trayOpen, setTrayOpen] = useState(false);

  const brandTierByName = useMemo(() => {
    const map = new Map<string, BrandSearchResult["tier"]>();
    for (const b of results.brands) map.set(b.name, b.tier);
    return map;
  }, [results.brands]);

  const tierFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of results.brands) counts.set(b.tier, (counts.get(b.tier) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [results.brands]);

  const brandFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of results.brands) counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
    for (const s of results.styles) {
      if (s.brandName) counts.set(s.brandName, (counts.get(s.brandName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [results.brands, results.styles]);

  // Colour / hardware / size facet values + counts, over every variant in the
  // style results.
  const attrFacets = useMemo(() => {
    const out: Record<string, { value: string; count: number }[]> = {};
    for (const f of VARIANT_FACETS) {
      const counts = new Map<string, number>();
      for (const s of results.styles) {
        for (const v of s.variants) {
          const value = f.get(v);
          if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      out[f.key] = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    }
    return out;
  }, [results.styles]);

  function toggleIn(set: Set<string> | undefined, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function toggleTier(value: string) {
    setActiveTiers((p) => toggleIn(p, value));
    track(EVENTS.catalogFiltered, { filter: "brand_tier", value });
  }
  function toggleBrand(value: string) {
    setActiveBrands((p) => toggleIn(p, value));
    track(EVENTS.catalogFiltered, { filter: "brand", value });
  }
  function toggleAttr(key: string, value: string) {
    setActiveAttrs((p) => ({ ...p, [key]: toggleIn(p[key], value) }));
    track(EVENTS.catalogFiltered, { filter: key, value });
  }
  function clearAll() {
    setActiveTiers(new Set());
    setActiveBrands(new Set());
    setActiveAttrs({});
  }

  const attrActiveCount = useMemo(
    () => Object.values(activeAttrs).reduce((n, s) => n + (s?.size ?? 0), 0),
    [activeAttrs],
  );

  const visible = useMemo(() => {
    const tierFilter = (tier: string | undefined) =>
      activeTiers.size === 0 || (tier != null && activeTiers.has(tier));
    const brandFilter = (name: string) =>
      activeBrands.size === 0 || activeBrands.has(name);

    // Brand cards can't be attribute-filtered (no variant data) — hide them once
    // any attribute facet is active so the result set stays honest.
    let brands =
      attrActiveCount > 0
        ? []
        : results.brands.filter((b) => tierFilter(b.tier) && brandFilter(b.name));

    let styles = results.styles
      .filter((s) => tierFilter(brandTierByName.get(s.brandName)) && brandFilter(s.brandName))
      .map((s) => ({ ...s, variants: s.variants.filter((v) => variantMatches(v, activeAttrs)) }))
      .filter((s) => s.variants.length > 0);

    if (sort === "az") {
      brands = [...brands].sort((a, b) => a.name.localeCompare(b.name));
      styles = [...styles].sort((a, b) =>
        (a.brandName + a.styleName).localeCompare(b.brandName + b.styleName),
      );
    } else if (sort === "count") {
      brands = [...brands].sort((a, b) => brandWeight(b) - brandWeight(a));
      styles = [...styles].sort((a, b) => styleWeight(b) - styleWeight(a));
    }

    return { brands, styles };
  }, [results.brands, results.styles, activeTiers, activeBrands, activeAttrs, attrActiveCount, sort, brandTierByName]);

  const totalVisible = visible.brands.length + visible.styles.length;
  const activeCount = activeTiers.size + activeBrands.size + attrActiveCount;
  const hasAttrFacets = VARIANT_FACETS.some((f) => attrFacets[f.key]?.length > 1);
  const hasFacets = tierFacets.length > 0 || brandFacets.length > 1 || hasAttrFacets;

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

      <FacetGroup
        label="Brand tier"
        values={tierFacets}
        isActive={(v) => activeTiers.has(v)}
        onToggle={toggleTier}
        display={(v) => TIER_LABEL[v] ?? v.replace("-", " ")}
      />

      <FacetGroup
        label="Brand"
        values={brandFacets}
        isActive={(v) => activeBrands.has(v)}
        onToggle={toggleBrand}
      />

      {VARIANT_FACETS.map((f) => (
        <FacetGroup
          key={f.key}
          label={f.label}
          values={attrFacets[f.key] ?? []}
          isActive={(v) => Boolean(activeAttrs[f.key]?.has(v))}
          onToggle={(v) => toggleAttr(f.key, v)}
        />
      ))}
    </div>
  );

  return (
    <div>
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

      {activeCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[...activeTiers].map((value) => (
            <Chip key={`tier-${value}`} onClick={() => toggleTier(value)}>
              {TIER_LABEL[value] ?? value.replace("-", " ")}
            </Chip>
          ))}
          {[...activeBrands].map((value) => (
            <Chip key={`brand-${value}`} onClick={() => toggleBrand(value)}>
              {value}
            </Chip>
          ))}
          {VARIANT_FACETS.flatMap((f) =>
            [...(activeAttrs[f.key] ?? [])].map((value) => (
              <Chip key={`${f.key}-${value}`} onClick={() => toggleAttr(f.key, value)}>
                {value}
              </Chip>
            )),
          )}
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {hasFacets && (
        <div className="mb-6 hidden rounded-2xl border border-border bg-surface p-5 sm:block">
          {controls}
        </div>
      )}

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

      {totalVisible === 0 && activeCount > 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
          Nothing matches all of those at once. Drop a filter and try again.{" "}
          <button type="button" onClick={clearAll} className="text-gold hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {visible.brands.map((brand) => (
        <div key={brand.brandId} className="mb-6 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl text-foreground">{brand.name}</h2>
            <span className="text-sm text-muted">
              {brand.variantCount} {brand.variantCount === 1 ? "result" : "results"}
            </span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted/70">
            {brand.tier.replace("-", " ")}
          </p>
          {brand.styles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {brand.styles.map((s) => (
                <Link
                  key={s.styleId}
                  href={s.variantId ? `/bag/${s.variantId}` : `/search?q=${encodeURIComponent(s.name)}`}
                  className="rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      {visible.styles.map((style) => (
        <div key={style.styleId} className="mb-6 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <BagImage
                imageUrl={style.variants[0] ? images[style.variants[0].variantId] : null}
                brand={style.brandName}
                className="h-16 w-16 shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-wide text-muted">{style.brandName}</p>
                <h2 className="font-serif text-xl text-foreground">{style.styleName}</h2>
              </div>
            </div>
            <span className="shrink-0 text-sm text-muted">
              {style.variants.length} {style.variants.length === 1 ? "result" : "results"}
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
                      {[variant.sizeLabel, variant.exteriorColorway].filter(Boolean).join(" · ") ||
                        "Variant"}
                    </span>
                    {variant.hardwareColor && (
                      <span className="text-muted">{variant.hardwareColor} hardware</span>
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

function FacetGroup({
  label,
  values,
  isActive,
  onToggle,
  display = (v) => v,
}: {
  label: string;
  values: { value: string; count: number }[];
  isActive: (v: string) => boolean;
  onToggle: (v: string) => void;
  display?: (v: string) => string;
}) {
  if (values.length < 2) return null;
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted/70">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map(({ value, count }) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              isActive(value)
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted hover:border-gold hover:text-gold"
            }`}
          >
            {display(value)} <span className="text-muted">({count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-sm text-gold transition-colors hover:bg-gold/10"
    >
      {children}
      <span aria-hidden>×</span>
    </button>
  );
}
