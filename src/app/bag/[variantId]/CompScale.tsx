"use client";

/**
 * CompScale — the one primitive behind every complex price visualization on the
 * bag page: a set of comparable prices ("comps") laid on a shared price axis,
 * optionally grouped into rows by a chosen dimension.
 *
 *   groupBy: none      → the value gauge (M0)         [this file's only use today]
 *   groupBy: condition → the condition ladder (M2)
 *   groupBy: era       → the year lens (M3)
 *   groupBy: colorway  → the flexibility grid (M3)
 *
 * It draws a "typical range" band (low–median–high) and plots each comp as a dot
 * coloured by where it falls: below the band = a deal, inside = around typical,
 * above = rich. The cheapest comp is flagged. Pure presentational + percent-based
 * layout so it fills its container responsively; no chart deps.
 *
 * HONESTY: the band and dots only ever render real recorded prices passed in by
 * the caller. Nothing is fabricated or smoothed; an empty `comps` still draws the
 * range so "what it typically trades at" survives even with no live listings.
 */

export interface Comp {
  /** Asking/sale price in `currency`. */
  price: number;
  platform: string | null;
  /** Raw condition text from the source (un-normalized in M0). */
  condition: string | null;
  /** Link-back to the listing, when we hold one. */
  url: string | null;
}

export interface CompScaleProps {
  /** Low / median / high of the typical resale range. */
  low: number;
  median: number;
  high: number;
  currency: string | null;
  /** Live comps to plot on the axis (current asking listings in M0). */
  comps?: Comp[];
}

function fmt(amount: number, currency: string | null) {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

/** Position of `price` as a 0–100% across the rendered axis domain. */
function pct(price: number, min: number, max: number) {
  if (max <= min) return 50;
  return Math.min(100, Math.max(0, ((price - min) / (max - min)) * 100));
}

/** A comp's standing relative to the typical band, which also picks its colour. */
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

export default function CompScale({ low, median, high, currency, comps = [] }: CompScaleProps) {
  const prices = comps.map((c) => c.price);
  // Domain pads the range so band ends and outlier comps both sit comfortably in-frame.
  const lo = Math.min(low, ...(prices.length ? prices : [low]));
  const hi = Math.max(high, ...(prices.length ? prices : [high]));
  const pad = (hi - lo) * 0.06 || hi * 0.06 || 1;
  const min = lo - pad;
  const max = hi + pad;

  const bestIdx =
    prices.length > 0 ? prices.indexOf(Math.min(...prices)) : -1;

  const bandLeft = pct(low, min, max);
  const bandRight = pct(high, min, max);
  const medianLeft = pct(median, min, max);

  return (
    <div
      role="img"
      aria-label={`Typical resale range ${fmt(low, currency)} to ${fmt(high, currency)}, median ${fmt(median, currency)}${comps.length ? `, with ${comps.length} live listing${comps.length === 1 ? "" : "s"} plotted` : ""}.`}
      className="select-none"
    >
      {/* Best-listed flag, anchored above its dot. */}
      <div className="relative h-6">
        {bestIdx >= 0 && (
          <div
            className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs text-gold"
            style={{ left: `${pct(prices[bestIdx], min, max)}%` }}
          >
            Best {fmt(prices[bestIdx], currency)}
          </div>
        )}
      </div>

      {/* The axis: typical-range band, median tick, and a dot per comp. */}
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gold/30"
          style={{ left: `${bandLeft}%`, width: `${Math.max(0, bandRight - bandLeft)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground/70"
          style={{ left: `${medianLeft}%` }}
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

      {/* Range scale labels under the band. */}
      <div className="relative mt-1 h-4 text-xs text-muted/70">
        <span className="absolute -translate-x-1/2" style={{ left: `${bandLeft}%` }}>
          {fmt(low, currency)}
        </span>
        <span
          className="absolute -translate-x-1/2 text-muted"
          style={{ left: `${medianLeft}%` }}
        >
          {fmt(median, currency)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${bandRight}%` }}>
          {fmt(high, currency)}
        </span>
      </div>
    </div>
  );
}
