import type { ComponentType } from "react";

/**
 * "What the icons cost on resale right now" roundup chart. Current asking medians,
 * date-clean, re-confirmed against prod 2026-07-10 (deduped by listing_ref), stated with n
 * per docs/data-analysis-standard.md. Asking ("listing for"), not sold. Original SVG/CSS.
 *  Gucci Marmont small $1,095 (n=183) · LV Neverfull MM $1,515 (n=345) ·
 *  LV Speedy 30 $1,375 (n=148) · Chanel Classic Flap Medium $6,205 (n=614) ·
 *  Hermès Kelly 32 $12,345 (n=37) · Hermès Birkin 30 $20,335 (n=133)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 21000;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const ROWS = [
  { label: "Gucci GG Marmont", sub: "small", v: 1095, n: 183 },
  { label: "LV Neverfull", sub: "MM", v: 1515, n: 345 },
  { label: "LV Speedy", sub: "30", v: 1375, n: 148 },
  { label: "Chanel Classic Flap", sub: "medium", v: 6205, n: 614 },
  { label: "Hermès Kelly", sub: "32", v: 12345, n: 37 },
  { label: "Hermès Birkin", sub: "30", v: 20335, n: 133 },
];

export function IconicPricesChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 600 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What the icons list for on resale</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Median asking price for one hero size of each, on premium resale, July 2026 (asking, not sold). Labeled with the number of listings behind each.
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
          Asking medians from our tracking of current listings, July 2026, one representative size per bag. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Asking prices for iconic bags on resale: Gucci Marmont small $1,095, Louis Vuitton Neverfull MM $1,515, LV Speedy 30 $1,375, Chanel Classic Flap medium $6,205, Hermès Kelly 32 $12,345, and Hermès Birkin 30 $20,335.
      </figcaption>
    </figure>
  );
}

export const iconicPricesChartRegistry: Record<string, ComponentType> = {
  "iconic-prices-chart": IconicPricesChart,
};
