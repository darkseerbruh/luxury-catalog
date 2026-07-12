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
import { resolveTarget, visibleDims } from "@/lib/variant-dims";
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
  const dims = visibleDims(variants);

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
          const currentVal = dim.get(current);
          return (
            <div key={dim.key}>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted/70">
                {dim.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const active = value === currentVal;
                  const target = active ? currentVariantId : resolveTarget(variants, current, dim, value);
                  // Display only: size chips carry the measurement + boutique alias so
                  // "Jumbo" reads "Jumbo (Large) · 30 cm". The raw `value` still keys matching.
                  const label = dim.key === "size" ? measuredSizeLabel(value) ?? value : value;
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
                      className="rounded-full border border-gold bg-gold/10 px-4 py-2 text-sm font-medium text-gold"
                    >
                      {label}
                    </span>
                  ) : (
                    <Link
                      key={value}
                      href={`/bag/${target}`}
                      prefetch
                      scroll={false}
                      className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
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
