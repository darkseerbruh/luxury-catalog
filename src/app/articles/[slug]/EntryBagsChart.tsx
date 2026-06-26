import type { ComponentType } from "react";

/**
 * Cross-brand entry-tote comparison (Gucci Marmont vs LV Neverfull vs LV Speedy).
 * Current asking medians, date-clean, re-confirmed against prod 2026-06-26, stated with n
 * per docs/data-analysis-standard.md. Asking ("listing for"), not sold. Original SVG/CSS.
 *  Gucci Marmont small $911 (n=130) · LV Neverfull MM $1,245 (n=141) · LV Speedy 30 $1,623 (n=82)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 1800;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const ROWS = [
  { label: "Gucci GG Marmont", sub: "small shoulder", v: 911, n: 130 },
  { label: "LV Neverfull", sub: "MM tote", v: 1245, n: 141 },
  { label: "LV Speedy", sub: "30 handheld", v: 1623, n: 82 },
];

export function EntryBagsChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Three entry icons, same price band</div>
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
                <span style={{ color: GOLDSOFT }}>
                  {money(r.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.n}</span>
                </span>
              </div>
              <div style={{ height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: GOLD, borderRadius: 7 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians from our tracking of current listings, June 2026. All three sit in the same entry band, so the choice is about fit and use, not price. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Three entry-level icons at similar asking prices: Gucci GG Marmont small around $911, Louis Vuitton Neverfull MM around $1,245, and Louis Vuitton Speedy 30 around $1,623.
      </figcaption>
    </figure>
  );
}

export const entryBagsChartRegistry: Record<string, ComponentType> = {
  "entry-bags-chart": EntryBagsChart,
};
