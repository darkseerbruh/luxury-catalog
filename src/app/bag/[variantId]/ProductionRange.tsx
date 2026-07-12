import type { ProductionAxis } from "@/lib/production-options";

/**
 * "Made in" — the sourced production range for this style on the axes that aren't a selector
 * yet (material, construction). Shows what the house actually produced, permanent vs seasonal,
 * so collectors see the full range even where we hold no listing (owner 2026-07-12). Not a
 * claim about any single combination; an editorial read of the production record.
 */
export default function ProductionRange({ axes }: { axes: ProductionAxis[] }) {
  const shown = axes.filter((a) => a.axis === "material" || a.axis === "construction");
  if (shown.length === 0) return null;

  return (
    <section aria-label="Production range" className="rounded-2xl border border-border bg-surface/50 p-5">
      <h2 className="font-serif text-lg text-foreground">Made in</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        What the house has produced this bag in, from our sourced records.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {shown.map((axis) => {
          const permanent = axis.options.filter((o) => o.permanence === "permanent");
          const seasonal = axis.options.filter((o) => o.permanence !== "permanent");
          return (
            <div key={axis.axis}>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted/70">{axis.label}</p>
              <div className="flex flex-wrap items-center gap-2">
                {permanent.map((o) => (
                  <span
                    key={o.value}
                    title={o.note ?? undefined}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground"
                  >
                    {o.value}
                    {o.isDefault && <span className="ml-1 text-[10px] uppercase tracking-wide text-gold">default</span>}
                  </span>
                ))}
                {seasonal.length > 0 && (
                  <>
                    <span className="text-[11px] uppercase tracking-wide text-muted/60">seasonal</span>
                    {seasonal.map((o) => (
                      <span
                        key={o.value}
                        title={o.note ?? undefined}
                        className="rounded-full border border-dashed border-border/70 px-3 py-1 text-sm text-muted"
                      >
                        {o.value}
                      </span>
                    ))}
                  </>
                )}
              </div>
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
