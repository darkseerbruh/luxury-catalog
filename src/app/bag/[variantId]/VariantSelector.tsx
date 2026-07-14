"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { StyleVariantOption } from "@/lib/queries";
import { QuickSaveHeart } from "@/components/QuickSaveHeart";

/**
 * Amazon-style dimensional variant selector. Instead of one flat list of every
 * variant (unusable once a style has dozens — 2-5 sizes × 5+ colours × 2-3
 * hardware), the catalogued variants are decomposed into independent dimensions
 * (Size / Colour / Hardware). Picking a value in one dimension keeps the others
 * fixed and resolves to the closest matching variant; values with no variant at
 * all are disabled.
 *
 * STAGE 1: each option is a link to that variant's own /bag/[id] page (kept
 * indexable for GEO), prefetched so the soft-nav is quick. STAGE 2 will swap the
 * page content in place from a JSON payload (no navigation). Renders nothing for
 * single-variant styles.
 */
// Dimension logic (which details become chip rows, target resolution) lives in
// src/lib/variant-dims.ts so it's unit-testable; this file is just the UI.
import { UNKNOWN_LABEL, UNKNOWN_VALUE, dimValue, resolveTarget, visibleDims } from "@/lib/variant-dims";
import { measuredSizeLabel } from "@/lib/variant-label";

export default function VariantSelector({
  styleName,
  variants,
  currentVariantId,
  savedVariantIds = [],
}: {
  styleName: string;
  variants: StyleVariantOption[];
  currentVariantId: number;
  /** Variant ids already on the user's want list, for the pre-filled heart. */
  savedVariantIds?: number[];
}) {
  const saved = new Set(savedVariantIds);
  const router = useRouter();
  const current = variants.find((v) => v.variantId === currentVariantId) ?? variants[0];

  // Dimensions that actually vary (≥2 distinct values) are the ones worth
  // showing — minus any fully implied by a dimension already shown.
  // Also hide the Colour axis on a PRINT-ONLY material (a canvas line like LV Monogram/Damier
  // that never comes in a colour choice): a material is colour-bearing only if some variant
  // pairs it with a colour, so on a material outside that set the colour row is irrelevant.
  const colourBearingMaterials = new Set(
    variants.filter((v) => v.exteriorColorway && v.exteriorMaterial).map((v) => v.exteriorMaterial),
  );
  const colourApplies =
    !current.exteriorMaterial || colourBearingMaterials.size === 0 || colourBearingMaterials.has(current.exteriorMaterial);
  const dims = visibleDims(variants).filter((d) => d.dim.key !== "color" || colourApplies);

  // Prefetch the one-dimension-away neighbours so the common swaps feel instant.
  useEffect(() => {
    for (const { dim, values } of dims) {
      for (const value of values) {
        const target = resolveTarget(variants, current, dim, value);
        if (target && target !== currentVariantId) router.prefetch(`/bag/${target}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariantId]);

  if (variants.length < 2 || dims.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface/50 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg text-foreground">Choose your {styleName}</h2>
        {/* ONE save affordance for the whole selector (the current variant) — a heart
            beside every chip read as noise and made the chips harder to scan. */}
        <QuickSaveHeart
          variantId={currentVariantId}
          initialSaved={saved.has(currentVariantId)}
          source="variant-selector"
        />
      </div>
      <p className="mt-0.5 text-xs text-muted">
        Tap to switch. The heart saves the combination you&rsquo;re viewing.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {dims.map(({ dim, values }) => {
          const currentVal = dimValue(dim, current);
          return (
            <div key={dim.key}>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted/70">
                {dim.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const active = value === currentVal;
                  const isUnknown = value === UNKNOWN_VALUE;
                  // NOTE: no grey-out here yet. Greying a value must mean "the house never made
                  // it" (archivist production record), NOT "we have no listing" (owner 2026-07-11:
                  // absence of a comp ≠ absence of the product). Wire isCombinationAvailable to the
                  // production matrix once it exists; until then every captured value stays live.
                  const target = active ? currentVariantId : resolveTarget(variants, current, dim, value);
                  // Display only: size chips carry the measurement + boutique alias so
                  // "Jumbo" reads "Jumbo (Large) · 30 cm". The raw `value` still keys matching.
                  // The Unknown bucket (owner 2026-07-14) is explicit, selectable state —
                  // dashed so it reads as "not yet documented", never as a value named Unknown.
                  const label = isUnknown
                    ? UNKNOWN_LABEL
                    : dim.key === "size"
                      ? measuredSizeLabel(value) ?? value
                      : value;
                  const unknownTitle = isUnknown
                    ? `${dim.label} not yet documented for this one — tap to view it`
                    : undefined;
                  if (target == null) {
                    return (
                      <span
                        key={value}
                        aria-disabled="true"
                        className="cursor-not-allowed rounded-full border border-border/50 px-4 py-2 text-sm text-muted/40 line-through"
                      >
                        {label}
                      </span>
                    );
                  }
                  return active ? (
                    <span
                      key={value}
                      aria-current="true"
                      title={unknownTitle}
                      className={`rounded-full px-4 py-2 text-sm font-medium text-gold ${
                        isUnknown ? "border border-dashed border-gold/70 bg-gold/5" : "border border-gold bg-gold/10"
                      }`}
                    >
                      {label}
                    </span>
                  ) : (
                    <Link
                      key={value}
                      href={`/bag/${target}`}
                      prefetch
                      scroll={false}
                      title={unknownTitle}
                      className={`rounded-full px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold ${
                        isUnknown ? "border border-dashed border-border" : "border border-border"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
