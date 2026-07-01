import { getAttributeStats } from "@/lib/attribute-stats";

/**
 * The bag-nerd delight sections for /data, aggregated from per-listing attributes
 * on price_history (no capture needed, the data is already dense). Gold vs silver,
 * the colors of luxury, the leathers. Each self-hides if its data is missing.
 */

const SWATCH: Record<string, string> = {
  Black: "#151515",
  Brown: "#6b4a2b",
  Beige: "#d8c8a8",
  Blue: "#3b5bdb",
  White: "#f4f1ea",
  Red: "#b83227",
  Pink: "#e08aa8",
  Green: "#3f7a4f",
  Gray: "#8a8a8a",
  Metallic: "#c5a572",
  Orange: "#e08a3c",
  Purple: "#7a5aa8",
  Yellow: "#e8c341",
};

export default async function AttributeFacts() {
  const { hardware, colors, materials } = await getAttributeStats();
  const goldPct = hardware.total > 0 ? Math.round((hardware.gold / hardware.total) * 100) : 0;
  const colorMax = colors[0]?.count ?? 0;
  const matMax = materials[0]?.count ?? 0;

  if (hardware.total === 0 && colors.length === 0 && materials.length === 0) return null;

  return (
    <>
      {hardware.total > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm uppercase tracking-widest text-gold">From the database</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">Gold or silver</h2>
          <p className="mt-1 text-sm text-muted">
            The eternal hardware question, settled across {hardware.total.toLocaleString()} bags.
          </p>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full">
            <div className="bg-gold" style={{ width: `${goldPct}%` }} />
            <div className="bg-muted/50" style={{ width: `${100 - goldPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gold">Gold {goldPct}%</span>
            <span className="text-muted">Silver {100 - goldPct}%</span>
          </div>
        </section>
      )}

      {colors.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm uppercase tracking-widest text-gold">From the database</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">The colors of luxury</h2>
          <p className="mt-1 text-sm text-muted">Every color we have logged, ranked. Black is not close.</p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {colors.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: SWATCH[c.name] ?? "#888" }}
                  aria-hidden
                />
                <span className="w-16 flex-shrink-0 text-sm text-foreground">{c.name}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={{ width: `${colorMax > 0 ? Math.max(2, Math.round((c.count / colorMax) * 100)) : 0}%` }}
                  />
                </span>
                <span className="w-16 flex-shrink-0 text-right text-sm text-muted">{c.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {materials.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm uppercase tracking-widest text-gold">From the database</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">The leathers</h2>
          <p className="mt-1 text-sm text-muted">
            What these bags are actually made of, from calfskin to caviar.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {materials.map((m) => (
              <li key={m.name} className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 truncate text-sm text-foreground">{m.name}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={{ width: `${matMax > 0 ? Math.max(2, Math.round((m.count / matMax) * 100)) : 0}%` }}
                  />
                </span>
                <span className="w-16 flex-shrink-0 text-right text-sm text-muted">{m.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
