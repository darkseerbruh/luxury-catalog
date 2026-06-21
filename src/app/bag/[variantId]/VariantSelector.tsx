import Link from "next/link";
import type { StyleVariantOption } from "@/lib/queries";

/**
 * Amazon-style variant selector: the style is the "product", its catalogued
 * colourways / sizes / hardware are the selectable options. Each option links to
 * that variant's own /bag/[id] page (so every variant stays individually
 * indexable for GEO), with the current variant highlighted. Renders nothing for
 * single-variant styles.
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
  if (variants.length < 2) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface/50 px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg text-foreground">
          Choose a {styleName}
        </h2>
        <span className="text-xs text-muted">
          {variants.length} variants catalogued
        </span>
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
