"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { StyleVariantOption } from "@/lib/queries";

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
type Dim = { key: string; label: string; get: (v: StyleVariantOption) => string | null };

const DIMS: Dim[] = [
  { key: "size", label: "Size", get: (v) => v.sizeLabel },
  { key: "color", label: "Colour", get: (v) => v.exteriorColorway },
  { key: "hardware", label: "Hardware", get: (v) => v.hardwareColor },
];

/** Distinct, order-preserving values for a dimension. */
function distinct(variants: StyleVariantOption[], dim: Dim): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of variants) {
    const val = dim.get(v);
    if (val && !seen.has(val)) {
      seen.add(val);
      out.push(val);
    }
  }
  return out;
}

/**
 * Best variant to land on when the user picks `value` for `dim`: keep as many of
 * the *other* current dimensions as possible. Returns null if nothing matches.
 */
function resolveTarget(
  variants: StyleVariantOption[],
  current: StyleVariantOption,
  dim: Dim,
  value: string,
): number | null {
  const others = DIMS.filter((d) => d.key !== dim.key);
  let best: StyleVariantOption | null = null;
  let bestScore = -1;
  for (const v of variants) {
    if (dim.get(v) !== value) continue;
    let score = 0;
    for (const d of others) if (d.get(v) != null && d.get(v) === d.get(current)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best?.variantId ?? null;
}

export default function VariantSelector({
  styleName,
  variants,
  currentVariantId,
}: {
  styleName: string;
  variants: StyleVariantOption[];
  currentVariantId: number;
}) {
  const router = useRouter();
  const current = variants.find((v) => v.variantId === currentVariantId) ?? variants[0];

  // Dimensions that actually vary (≥2 distinct values) are the ones worth showing.
  const dims = DIMS.map((dim) => ({ dim, values: distinct(variants, dim) })).filter(
    (d) => d.values.length >= 2,
  );

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
      <h2 className="font-serif text-lg text-foreground">Choose your {styleName}</h2>
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
                  const target = resolveTarget(variants, current, dim, value);
                  if (active) {
                    return (
                      <span
                        key={value}
                        aria-current="true"
                        className="rounded-full border border-gold bg-gold/10 px-4 py-2 text-sm font-medium text-gold"
                      >
                        {value}
                      </span>
                    );
                  }
                  if (target == null) {
                    return (
                      <span
                        key={value}
                        aria-disabled="true"
                        className="cursor-not-allowed rounded-full border border-border/50 px-4 py-2 text-sm text-muted/40 line-through"
                      >
                        {value}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={value}
                      href={`/bag/${target}`}
                      prefetch
                      scroll={false}
                      className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                    >
                      {value}
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
