import type { ComponentType } from "react";

/**
 * Neverfull MM vs PM current-asking comparison. Pure resale data (no retail), date-clean
 * current listings re-confirmed against prod 2026-06-26, stated with n per
 * docs/data-analysis-standard.md. Asking ("listing for"), not sold. Original SVG/CSS.
 *  MM $1,245 (n=141) · PM $1,185 (n=54)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 1600;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const ROWS = [
  { label: "Neverfull MM", sub: "the larger one", v: 1245, n: 141, color: GOLD, valColor: GOLDSOFT },
  { label: "Neverfull PM", sub: "the smaller one", v: 1185, n: 54, color: KELLY, valColor: FG },
];

export function NeverfullSizeChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>MM and PM cost about the same</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Median asking price on premium resale, June 2026 (asking, not sold). Labeled with the number of listings behind each.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>
                  {r.label} <span style={{ color: MUTED, fontSize: 11 }}>· {r.sub}</span>
                </span>
                <span style={{ color: r.valColor }}>
                  {money(r.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.n} listings</span>
                </span>
              </div>
              <div style={{ height: 16, background: SURF, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: r.color, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians from our tracking of current listings, June 2026. The MM also turns up far more often (141 listings vs 54), so it is easier to find and to resell. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Louis Vuitton Neverfull asking prices: the larger MM lists around $1,245 and the smaller PM around $1,185, nearly the same, with the MM far more common on the market.
      </figcaption>
    </figure>
  );
}

export const neverfullSizeChartRegistry: Record<string, ComponentType> = {
  "neverfull-size-chart": NeverfullSizeChart,
};
