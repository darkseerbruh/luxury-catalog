/**
 * StandingGlyph — the "why-meter" from the LC Index. Three tiny bars (Price /
 * Trade / Scarcity) showing where a bag sits on each measured signal, so a list
 * row explains its own rank at a glance. The signal driving the rank most (the
 * `lead`) is brightened. See docs/ux/lc-index-spec.md.
 *
 * Pure presentational server component: it renders whatever percentiles it is
 * handed, computed once by src/lib/lc-index.ts. Colour is never the only cue —
 * every bar is labelled in words, and the exact percentile is in the title.
 */

type Lead = "price" | "trade" | "scarcity";

const BARS: { key: Lead; label: string; hint: string }[] = [
  { key: "price", label: "Price", hint: "resale price vs the catalog" },
  { key: "trade", label: "Trade", hint: "how often it changes hands" },
  { key: "scarcity", label: "Scarcity", hint: "fewer live listings ranks higher" },
];

export default function StandingGlyph({
  pricePct,
  tradePct,
  scarcityPct,
  lead,
  className = "",
}: {
  pricePct: number;
  tradePct: number;
  scarcityPct: number;
  lead: Lead;
  className?: string;
}) {
  const value: Record<Lead, number> = { price: pricePct, trade: tradePct, scarcity: scarcityPct };
  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      role="img"
      aria-label={`Why it ranks here: price ${Math.round(pricePct)} of 100, trade ${Math.round(
        tradePct,
      )} of 100, scarcity ${Math.round(scarcityPct)} of 100. Leading measure: ${lead}.`}
    >
      {BARS.map((bar) => {
        const v = Math.max(0, Math.min(100, value[bar.key]));
        const isLead = bar.key === lead;
        return (
          <div key={bar.key} className="grid grid-cols-[46px_1fr] items-center gap-2">
            <span
              className={`text-right text-[9px] uppercase tracking-wide ${
                isLead ? "text-gold-soft" : "text-muted/60"
              }`}
            >
              {bar.label}
            </span>
            <span
              className="relative block h-[5px] rounded-full bg-border"
              title={`${bar.label}: ${Math.round(v)} of 100 (${bar.hint})`}
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-full ${isLead ? "bg-gold-soft" : "bg-gold"}`}
                style={{ width: `${v}%` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
