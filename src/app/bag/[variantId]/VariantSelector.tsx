"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { StyleVariantOption } from "@/lib/queries";

/**
 * Amazon-style variant selector: the style is the "product", its catalogued
 * colourways / sizes / hardware are the selectable options.
 *
 * UX vs. GEO: each option keeps its own /bag/[id] URL so every variant stays
 * individually server-rendered and indexable (GEO). To avoid the "whole page
 * reloads" feel, we PREFETCH the sibling variants on mount, so selecting one is an
 * instant client-side soft-swap (no hard reload, no network waterfall), and we
 * navigate with `scroll={false}` so the page shifts in place instead of jumping
 * to the top. Renders nothing for single-variant styles.
 */
function label(v: StyleVariantOption): string {
  return (
    [
      v.sizeLabel ?? v.sizeCategory,
      v.exteriorColorway,
      v.hardwareColor ? `${v.hardwareColor} HW` : null,
    ]
      .filter(Boolean)
      .join(" · ") || `Variant ${v.variantId}`
  );
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

  useEffect(() => {
    // Warm the cache for every sibling so the first click is instant.
    for (const v of variants) {
      if (v.variantId !== currentVariantId) router.prefetch(`/bag/${v.variantId}`);
    }
  }, [variants, currentVariantId, router]);

  if (variants.length < 2) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface/50 px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg text-foreground">Choose a {styleName}</h2>
        <span className="text-xs text-muted">{variants.length} variants catalogued</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Colourway, size &amp; hardware — pick one to see its full specs,
        authentication and value.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((v) => {
          const active = v.variantId === currentVariantId;
          return active ? (
            <span
              key={v.variantId}
              aria-current="true"
              className="rounded-full border border-gold bg-gold/10 px-4 py-2 text-sm font-medium text-gold"
            >
              {label(v)}
            </span>
          ) : (
            <Link
              key={v.variantId}
              href={`/bag/${v.variantId}`}
              prefetch
              scroll={false}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {label(v)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
