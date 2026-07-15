import type { ProductionAxis } from "@/lib/production-options";

/**
 * "Made in" — the sourced production range for this style on the axes that aren't a selector
 * yet (material, construction). Shows what the house actually produced, permanent vs seasonal,
 * so collectors see the full range even where we hold no listing (owner 2026-07-12). Not a
 * claim about any single combination; an editorial read of the production record.
 */
export default function ProductionRange({ axes }: { axes: ProductionAxis[] }) {
  const shown = axes.filter((a) => a.axis === "material" || a.axis === "construction" || a.axis === "hardware");
  if (shown.length === 0) return null;

  return (
    <section aria-label="Production range" className="rounded-2xl border border-border bg-surface/50 p-5">
      <h2 className="font-serif text-lg text-foreground">Made in</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        What the house has produced this bag in, from our sourced records.
      </p>

      {/* Read-only reference, NOT the selector. Rendered as quiet inline text (no
          pill chips) so it never reads as a clickable option the way the "Choose
          your …" selector does (owner 2026-07-14: the pill chips looked selectable
          and the "seasonal" label read like another chip). These become real
          selector axes once we hold a variant row per finish. */}
      <div className="mt-4 flex flex-col gap-3">
        {shown.map((axis) => {
          const permanent = axis.options.filter((o) => o.permanence === "permanent");
          const seasonal = axis.options.filter((o) => o.permanence !== "permanent");
          return (
            <div key={axis.axis} className="flex flex-col gap-0.5">
              <p className="text-xs uppercase tracking-wide text-muted/70">{axis.label}</p>
              <p className="text-sm leading-relaxed text-foreground">
                {permanent.map((o, i) => (
                  <span key={o.value} title={o.note ?? undefined}>
                    {i > 0 && <span className="text-muted/50">, </span>}
                    {o.value}
                    {o.isDefault && <span className="ml-1 text-[10px] uppercase tracking-wide text-gold">default</span>}
                  </span>
                ))}
              </p>
              {seasonal.length > 0 && (
                <p className="text-sm leading-relaxed text-muted">
                  <span className="text-[11px] uppercase tracking-wide text-muted/60">Seasonal: </span>
                  {seasonal.map((o, i) => (
                    <span key={o.value} title={o.note ?? undefined}>
                      {i > 0 && <span className="text-muted/40">, </span>}
                      {o.value}
                    </span>
                  ))}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted/70">
        Permanent finishes are offered year-round; seasonal ones rotate and retire. A finish being
        listed here doesn&rsquo;t mean we have one for sale right now.
      </p>
    </section>
  );
}
