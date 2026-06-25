import type { ComponentType } from "react";

/**
 * Data visualizations for the Chanel Classic Flap value piece. Numbers are baked
 * from verified queries and stated with their date, n, and source in-caption, per
 * docs/data-analysis-standard.md and the content-strategy visuals rule. Original
 * SVG, no chart library.
 *
 * Resale: median asking $6,000, IQR $4,500-$7,500, n=163 live listings, June 2026
 * (asking prices, premium resale, not confirmed sales). Retail: $11,700 (April 2026).
 * Retail history sourced from PurseBop / PurseBlog / Sotheby's.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();

export function FlapValueCharts() {
  const MAX = 12000;
  const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;
  const hist = [
    { y: "2019", v: 5800 },
    { y: "2024", v: 10800 },
    { y: "2025", v: 11300 },
    { y: "2026", v: 11700 },
  ];
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>New versus pre-owned</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Median asking price on premium resale against the boutique price. Resale n=163, June 2026 (asking, not sold); retail April 2026.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span>New, today</span>
              <span style={{ color: GOLDSOFT }}>{money(11700)}</span>
            </div>
            <div style={{ height: 16, background: SURF, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: pct(11700), height: "100%", background: GOLD }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span>Pre-owned, typical ask</span>
              <span style={{ color: GOLDSOFT }}>{money(6000)}</span>
            </div>
            <div style={{ position: "relative", height: 16, background: SURF, borderRadius: 8 }}>
              <div style={{ position: "absolute", left: pct(4500), width: pct(3000), top: 0, bottom: 0, background: "#3a2f12", borderRadius: 8 }} />
              <div style={{ position: "absolute", left: 0, width: pct(6000), top: 0, bottom: 0, background: GOLDSOFT, borderRadius: 8 }} />
              <div style={{ position: "absolute", left: pct(6000), top: -2, bottom: -2, width: 2, background: FG }} />
            </div>
            <div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>
              bar marks the median; shaded band is the middle half of listings ({money(4500)} to {money(7500)})
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, margin: "16px 0 12px" }} />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>The boutique price keeps climbing</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>
          Medium Classic Flap retail, USD, by year. Sourced from PurseBop, PurseBlog, and Sotheby&rsquo;s.
        </div>
        <svg viewBox="0 0 320 132" width="100%" role="img" aria-label="Chanel Medium Classic Flap retail price by year: 2019 $5,800, 2024 $10,800, 2025 $11,300, 2026 $11,700.">
          {hist.map((h, i) => {
            const x = 24 + i * 74;
            const bh = (h.v / MAX) * 92;
            const y = 110 - bh;
            return (
              <g key={h.y}>
                <rect x={x} y={y} width={44} height={bh} rx={2} fill={i === hist.length - 1 ? GOLD : "#5a4a1e"} />
                <text x={x + 22} y={y - 4} textAnchor="middle" fontSize="9.5" fill={GOLDSOFT}>{money(h.v)}</text>
                <text x={x + 22} y={124} textAnchor="middle" fontSize="9.5" fill={MUTED}>{h.y}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="sr-only">
        Charts of the Chanel Medium Classic Flap: new versus pre-owned median price, and retail price by year.
      </figcaption>
    </figure>
  );
}

export const flapChartsRegistry: Record<string, ComponentType> = {
  "flap-value-charts": FlapValueCharts,
};
