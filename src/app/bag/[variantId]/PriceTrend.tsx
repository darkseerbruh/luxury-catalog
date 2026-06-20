import type { VariantDetail } from "@/lib/queries";

type PricePoint = VariantDetail["priceHistory"][number];

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Sparkline + headline trend for a variant's recorded price history. Pure
 * server component (inline SVG). Renders nothing useful below 2 points; the
 * detail page lists the raw rows separately.
 */
export default function PriceTrend({ history }: { history: PricePoint[] }) {
  const points = history
    .filter((h): h is PricePoint & { salePrice: number } => h.salePrice != null)
    .slice()
    .sort((a, b) => a.dateRecorded.localeCompare(b.dateRecorded));

  if (points.length < 2) return null;

  const currency = points[points.length - 1].currency;
  const first = points[0].salePrice;
  const last = points[points.length - 1].salePrice;
  const change = last - first;
  const pct = first !== 0 ? (change / first) * 100 : 0;
  const up = change > 0;
  const flat = change === 0;

  const prices = points.map((p) => p.salePrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const W = 280;
  const H = 64;
  const stepX = points.length > 1 ? W / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = H - ((p.salePrice - min) / range) * (H - 8) - 4;
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const lineColor = flat ? "var(--color-muted)" : up ? "#e3c785" : "#7bb67b";
  const trendLabel = flat ? "Flat" : up ? "Up" : "Down";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted">
            {formatPrice(first, currency)} → {formatPrice(last, currency)}
          </p>
          <p className={`mt-0.5 text-sm ${flat ? "text-muted" : up ? "text-gold" : "text-green-400"}`}>
            {trendLabel} {!flat && `${up ? "+" : ""}${pct.toFixed(0)}%`} across {points.length} recorded
            {points.length === 1 ? " price" : " prices"}
          </p>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted/70">
          {points[0].dateRecorded.slice(0, 7)} – {points[points.length - 1].dateRecorded.slice(0, 7)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-16 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Price trend ${trendLabel}`}
      >
        <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill={lineColor} />
        ))}
      </svg>
    </div>
  );
}
