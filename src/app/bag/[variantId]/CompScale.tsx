"use client";

/**
 * CompScale — the one primitive behind every complex price visualization on the
 * bag page: comparable prices ("comps") laid on a shared price axis, optionally
 * split into rows grouped by a chosen dimension.
 *
 *   single gauge (no `rows`)  → the value gauge (M0)
 *   rows by condition tier    → the condition ladder (M2)  [grade within tier]
 *   rows by era / colorway    → year lens / flex grid (later)
 *
 * Each track draws a "typical range" band (low–median–high) and plots each comp
 * as a dot coloured by where it falls *within that track*: below the band = a
 * deal, inside = around typical, above = rich. In ladder mode every row shares
 * one price axis, so a cheaper-but-more-worn bag visibly sits on a lower row —
 * you can't mistake it for a deal. Percent-based layout, no chart deps.
 *
 * HONESTY: bands and dots only ever render real recorded prices passed in by the
 * caller — nothing is fabricated or smoothed.
 */

export interface Comp {
  /** Asking/sale price in `currency`. */
  price: number;
  platform: string | null;
  /** Condition text from the source (canonical sale_condition tier). */
  condition: string | null;
  /** Link-back to the listing, when we hold one. */
  url: string | null;
}

/** One grouped row in ladder mode (e.g. a condition tier). */
export interface CompRow {
  label: string;
  low: number;
  median: number;
  high: number;
  /** Recorded prices the row's range is built from. */
  count: number;
  comps: Comp[];
}

export interface CompScaleProps {
  low: number;
  median: number;
  high: number;
  currency: string | null;
  /** Live comps to plot (single-gauge mode). */
  comps?: Comp[];
  /** When set, render a ladder of grouped rows on one shared axis instead. */
  rows?: CompRow[];
}

function fmt(amount: number, currency: string | null) {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

function pct(price: number, min: number, max: number) {
  if (max <= min) return 50;
  return Math.min(100, Math.max(0, ((price - min) / (max - min)) * 100));
}

function standing(price: number, low: number, high: number): "deal" | "typical" | "rich" {
  if (price <= low) return "deal";
  if (price >= high) return "rich";
  return "typical";
}

const DOT_COLOR: Record<string, string> = {
  deal: "#7bb67b",
  typical: "#e3c785",
  rich: "#d88a85",
};

/** The band + median tick + comp dots for one track, positioned across [min,max]. */
function Track({
  low,
  median,
  high,
  comps,
  currency,
  min,
  max,
}: {
  low: number;
  median: number;
  high: number;
  comps: Comp[];
  currency: string | null;
  min: number;
  max: number;
}) {
  const bandLeft = pct(low, min, max);
  const bandRight = pct(high, min, max);
  return (
    <div className="relative h-5">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gold/30"
        style={{ left: `${bandLeft}%`, width: `${Math.max(0, bandRight - bandLeft)}%` }}
      />
      <div
        className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground/70"
        style={{ left: `${pct(median, min, max)}%` }}
      />
      {comps.map((c, i) => {
        const s = standing(c.price, low, high);
        return (
          <span
            key={i}
            title={`${fmt(c.price, currency)}${c.platform ? ` · ${c.platform}` : ""}${c.condition ? ` · ${c.condition}` : ""}`}
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
            style={{ left: `${pct(c.price, min, max)}%`, backgroundColor: DOT_COLOR[s] }}
          />
        );
      })}
    </div>
  );
}

export default function CompScale({ low, median, high, currency, comps = [], rows }: CompScaleProps) {
  const ladder = rows && rows.length > 0;

  // Domain spans every band bound + comp across whichever mode we're in, padded
  // so band ends and outlier comps both sit comfortably in-frame.
  const allPrices = ladder
    ? rows!.flatMap((r) => [r.low, r.high, ...r.comps.map((c) => c.price)])
    : [low, high, ...comps.map((c) => c.price)];
  const lo = Math.min(...allPrices);
  const hi = Math.max(...allPrices);
  const pad = (hi - lo) * 0.06 || hi * 0.06 || 1;
  const min = lo - pad;
  const max = hi + pad;

  if (ladder) {
    return (
      <div
        role="img"
        aria-label={`Condition ladder: ${rows!.length} tiers on a shared price axis from ${fmt(min, currency)} to ${fmt(max, currency)}.`}
        className="select-none"
      >
        <div className="flex flex-col gap-2.5">
          {rows!.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <div className="text-xs capitalize text-foreground">{r.label}</div>
                <div className="text-[11px] text-muted/60">
                  {r.count} {r.count === 1 ? "price" : "prices"}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <Track
                  low={r.low}
                  median={r.median}
                  high={r.high}
                  comps={r.comps}
                  currency={currency}
                  min={min}
                  max={max}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Shared axis scale (absolute price ticks across all rows). */}
        <div className="relative ml-[7.75rem] mt-1 h-4 text-xs text-muted/60">
          <span className="absolute left-0">{fmt(lo, currency)}</span>
          <span className="absolute right-0">{fmt(hi, currency)}</span>
        </div>
      </div>
    );
  }

  const bestIdx = comps.length > 0 ? comps.map((c) => c.price).indexOf(Math.min(...comps.map((c) => c.price))) : -1;
  const bandLeft = pct(low, min, max);
  const bandRight = pct(high, min, max);
  const medianLeft = pct(median, min, max);

  return (
    <div
      role="img"
      aria-label={`Typical resale range ${fmt(low, currency)} to ${fmt(high, currency)}, median ${fmt(median, currency)}${comps.length ? `, with ${comps.length} live listing${comps.length === 1 ? "" : "s"} plotted` : ""}.`}
      className="select-none"
    >
      <div className="relative h-6">
        {bestIdx >= 0 && (
          <div
            className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs text-gold"
            style={{ left: `${pct(comps[bestIdx].price, min, max)}%` }}
          >
            Best {fmt(comps[bestIdx].price, currency)}
          </div>
        )}
      </div>
      <Track low={low} median={median} high={high} comps={comps} currency={currency} min={min} max={max} />
      <div className="relative mt-1 h-4 text-xs text-muted/70">
        <span className="absolute -translate-x-1/2" style={{ left: `${bandLeft}%` }}>
          {fmt(low, currency)}
        </span>
        <span className="absolute -translate-x-1/2 text-muted" style={{ left: `${medianLeft}%` }}>
          {fmt(median, currency)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${bandRight}%` }}>
          {fmt(high, currency)}
        </span>
      </div>
    </div>
  );
}
