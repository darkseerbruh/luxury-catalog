"use client";

import { useMemo, useState } from "react";
import type { VariantDetail } from "@/lib/queries";

type PricePoint = VariantDetail["priceHistory"][number];

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

type RangeKey = "1Y" | "3Y" | "ALL";
const RANGE_YEARS: Record<RangeKey, number | null> = { "1Y": 1, "3Y": 3, ALL: null };

/**
 * Price-history chart for a variant's recorded sales. Inline SVG (no deps).
 * Adds time-range toggles (1Y / 3Y / All — only those covered by the data), a
 * bold % change for the selected range, and a dashed retail reference line when
 * `retailPriceOriginal` exists. Renders nothing useful below 2 points; the
 * detail page lists the raw rows separately.
 */
export default function PriceTrend({
  history,
  retailPrice = null,
}: {
  history: PricePoint[];
  retailPrice?: number | null;
}) {
  const all = useMemo(
    () =>
      history
        .filter((h): h is PricePoint & { salePrice: number } => h.salePrice != null)
        .slice()
        .sort((a, b) => a.dateRecorded.localeCompare(b.dateRecorded)),
    [history],
  );

  // Which toggles are worth showing: a range only appears if it would include
  // earlier data than the next-smaller range (otherwise it's a duplicate view).
  const ranges = useMemo<RangeKey[]>(() => {
    if (all.length < 2) return ["ALL"];
    const newest = new Date(all[all.length - 1].dateRecorded).getTime();
    const cutoff = (years: number) => newest - years * 365 * 24 * 60 * 60 * 1000;
    const out: RangeKey[] = [];
    if (all.some((p) => new Date(p.dateRecorded).getTime() >= cutoff(1))) out.push("1Y");
    if (
      all.some((p) => new Date(p.dateRecorded).getTime() < cutoff(1)) &&
      all.some((p) => new Date(p.dateRecorded).getTime() >= cutoff(3))
    )
      out.push("3Y");
    out.push("ALL");
    return out;
  }, [all]);

  const [range, setRange] = useState<RangeKey>("ALL");
  const activeRange = ranges.includes(range) ? range : "ALL";

  const points = useMemo(() => {
    const years = RANGE_YEARS[activeRange];
    if (years == null || all.length === 0) return all;
    const newest = new Date(all[all.length - 1].dateRecorded).getTime();
    const cutoff = newest - years * 365 * 24 * 60 * 60 * 1000;
    const inRange = all.filter((p) => new Date(p.dateRecorded).getTime() >= cutoff);
    // Keep at least two points so the chart still draws.
    return inRange.length >= 2 ? inRange : all.slice(-2);
  }, [all, activeRange]);

  if (all.length < 2) return null;

  const currency = points[points.length - 1].currency;
  const first = points[0].salePrice;
  const last = points[points.length - 1].salePrice;
  const change = last - first;
  const pct = first !== 0 ? (change / first) * 100 : 0;
  const up = change > 0;
  const flat = change === 0;

  const prices = points.map((p) => p.salePrice);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  const showRetail = retailPrice != null && retailPrice > 0;
  if (showRetail) {
    min = Math.min(min, retailPrice);
    max = Math.max(max, retailPrice);
  }
  const range2 = max - min || 1;

  const W = 280;
  const H = 64;
  const stepX = points.length > 1 ? W / (points.length - 1) : 0;
  const yFor = (price: number) => H - ((price - min) / range2) * (H - 8) - 4;
  const coords = points.map((p, i) => [i * stepX, yFor(p.salePrice)] as const);
  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const lineColor = flat ? "var(--color-muted)" : up ? "#e3c785" : "#7bb67b";
  const trendLabel = flat ? "Flat" : up ? "Up" : "Down";
  const retailY = showRetail ? yFor(retailPrice) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className={`font-serif text-2xl ${flat ? "text-muted" : up ? "text-gold" : "text-green-400"}`}>
            {flat ? "Flat" : `${up ? "+" : ""}${pct.toFixed(0)}%`}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {formatPrice(first, currency)} → {formatPrice(last, currency)} across{" "}
            {points.length} recorded {points.length === 1 ? "sale" : "sales"}
          </p>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted/70">
          {points[0].dateRecorded.slice(0, 7)} – {points[points.length - 1].dateRecorded.slice(0, 7)}
        </p>
      </div>

      {ranges.length > 1 && (
        <div className="mt-3 flex gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                activeRange === r
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted hover:border-gold hover:text-gold"
              }`}
            >
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-16 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Price trend ${trendLabel} ${flat ? "" : `${pct.toFixed(0)} percent`} over ${activeRange}`}
      >
        {showRetail && (
          <line
            x1="0"
            y1={retailY.toFixed(1)}
            x2={W}
            y2={retailY.toFixed(1)}
            stroke="var(--color-muted)"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.6"
          />
        )}
        <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill={lineColor} />
        ))}
      </svg>

      {showRetail && (
        <p className="mt-2 text-xs text-muted/70">
          <span className="mr-1.5 inline-block h-px w-4 border-t border-dashed border-muted align-middle" />
          Dashed line = {formatPrice(retailPrice, currency)} original retail.{" "}
          {last >= retailPrice
            ? `Recent sales trade at or above retail (${last > retailPrice ? "+" : ""}${(((last - retailPrice) / retailPrice) * 100).toFixed(0)}%).`
            : `Recent sales trade ${(((retailPrice - last) / retailPrice) * 100).toFixed(0)}% below retail.`}
        </p>
      )}
    </div>
  );
}
