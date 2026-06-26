import type { ComponentType } from "react";

/**
 * Most-searched vs most-expensive icons. Search = Google Trends 12-mo US interest
 * (relative 0-100, set 1 of docs/research-drafts/trends-keyword-pull.md, run 2026-06-26).
 * Price = our asking median (TheRealReal + Fashionphile, price_type='listed', prod
 * price_history, 2026-06-26, n stated). Bars are the comparable search metric; the
 * dollar labels are price and deliberately do NOT track the bars. Original SVG/CSS.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const SMAX = 30; // search index ceiling (values run ~14-26)
const pct = (v: number) => `${(v / SMAX) * 100}%`;

type Row = { label: string; search: number; ask: number; askN: number };
const ROWS: Row[] = [
  { label: "Hermès Kelly", search: 26.2, ask: 18000, askN: 289 },
  { label: "Hermès Birkin", search: 25.4, ask: 19995, askN: 356 },
  { label: "LV Neverfull", search: 18.5, ask: 1500, askN: 336 },
  { label: "Gucci GG Marmont", search: 17.2, ask: 1095, askN: 304 },
  { label: "Chanel Classic Flap", search: 14.4, ask: 6995, askN: 556 },
];

export function SearchVsPriceChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 580 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Most searched is not most expensive</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Bar = Google search interest (relative, last 12 months, US). Dollar figure = median asking price.
          Sorted by search. Notice the prices do not follow the bars.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>{r.label}</span>
                <span style={{ color: GOLD }}>{money(r.ask)} <span style={{ color: MUTED, fontSize: 11 }}>· ask, n={r.askN}</span></span>
              </div>
              <div style={{ height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.search), height: "100%", background: GOLD, borderRadius: 7 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          The Birkin and Kelly top both lists. The Classic Flap is the least-searched of the five yet the third
          priciest, while the affordable Neverfull and Marmont draw more searches than the Flap. Search interest is
          relative (not volume); prices are asking medians from our June 2026 capture, an estimate, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Hermès Kelly and Birkin are the most searched and most expensive icons. The Chanel Classic Flap is the least
        searched of the five yet the third most expensive at about $6,995, while the cheaper Neverfull and Gucci Marmont
        are searched more than the Flap.
      </figcaption>
    </figure>
  );
}

export const searchVsPriceChartRegistry: Record<string, ComponentType> = {
  "search-vs-price": SearchVsPriceChart,
};
