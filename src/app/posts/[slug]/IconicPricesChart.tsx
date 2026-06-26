import type { ComponentType } from "react";

/**
 * "What the icons cost on resale right now" roundup chart. Current asking medians,
 * date-clean, re-confirmed against prod 2026-06-26, stated with n per
 * docs/data-analysis-standard.md. Asking ("listing for"), not sold. Original SVG/CSS.
 *  Gucci Marmont small $911 (n=130) · LV Neverfull MM $1,245 (n=141) ·
 *  LV Speedy 30 $1,623 (n=82) · Chanel Classic Flap Medium $6,000 (n=163) ·
 *  Hermès Kelly 32 $12,410 (n=112) · Hermès Birkin 30 $18,000 (n=121)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 19000;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const ROWS = [
  { label: "Gucci GG Marmont", sub: "small", v: 911, n: 130 },
  { label: "LV Neverfull", sub: "MM", v: 1245, n: 141 },
  { label: "LV Speedy", sub: "30", v: 1623, n: 82 },
  { label: "Chanel Classic Flap", sub: "medium", v: 6000, n: 163 },
  { label: "Hermès Kelly", sub: "32", v: 12410, n: 112 },
  { label: "Hermès Birkin", sub: "30", v: 18000, n: 121 },
];

export function IconicPricesChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 600 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What the icons list for on resale</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Median asking price for one hero size of each, on premium resale, June 2026 (asking, not sold). Labeled with the number of listings behind each.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>
                  {r.label} <span style={{ color: MUTED, fontSize: 11 }}>· {r.sub}</span>
                </span>
                <span style={{ color: GOLDSOFT }}>
                  {money(r.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.n}</span>
                </span>
              </div>
              <div style={{ height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: GOLD, borderRadius: 7, minWidth: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians from our tracking of current listings, June 2026, one representative size per bag. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Asking prices for iconic bags on resale: Gucci Marmont small $911, Louis Vuitton Neverfull MM $1,245, LV Speedy 30 $1,623, Chanel Classic Flap medium $6,000, Hermès Kelly 32 $12,410, and Hermès Birkin 30 $18,000.
      </figcaption>
    </figure>
  );
}

export const iconicPricesChartRegistry: Record<string, ComponentType> = {
  "iconic-prices-chart": IconicPricesChart,
};
