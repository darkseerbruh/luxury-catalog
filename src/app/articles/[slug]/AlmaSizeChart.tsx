import type { ComponentType } from "react";

/**
 * Louis Vuitton Alma median asking price by size. Pure resale data (no retail),
 * re-pulled + deduped by listing_ref against prod 2026-07-10, stated with n per
 * docs/data-analysis-standard.md. Asking ("listing for"), not sold. Original SVG/CSS.
 * Sorted high to low so the "smallest is not the cheapest" read is visible:
 *   Nano $1,695 (n=9) · BB $1,565 (n=197) · Mini $1,381 (n=130) ·
 *   GM $1,033 (n=18) · MM $928 (n=16) · PM $895 (n=179)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 1800;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

// tier: "premium" (small, most-wanted) vs "value" (larger, everyday)
const ROWS = [
  { label: "Nano", sub: "smallest", v: 1695, n: 9, color: GOLD, valColor: GOLDSOFT },
  { label: "BB", sub: "the popular small", v: 1565, n: 197, color: GOLD, valColor: GOLDSOFT },
  { label: "Mini", sub: "market label", v: 1381, n: 130, color: GOLDSOFT, valColor: FG },
  { label: "GM", sub: "the big tote", v: 1033, n: 18, color: KELLY, valColor: FG },
  { label: "MM", sub: "mid tote", v: 928, n: 16, color: KELLY, valColor: FG },
  { label: "PM", sub: "the value size", v: 895, n: 179, color: KELLY, valColor: FG },
];

export function AlmaSizeChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>The smallest Alma is not the cheapest</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Median asking price by size, deduped by listing, our catalog as of 2026-07-10 (asking, not sold). Labeled with the number of listings behind each.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
              <div style={{ height: 15, background: SURF, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: r.color, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          The small, most-photographed sizes (Nano, BB) ask the most; the PM and the larger vintage totes (MM, GM) ask the least. Size tracks desire here, not leather. Ranges are wide within each size because material and condition swing hard. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Louis Vuitton Alma median asking prices by size, 2026-07-10: Nano around $1,695, BB $1,565, Mini $1,381, GM $1,033, MM $928, PM $895. The smaller sizes ask more than the larger totes.
      </figcaption>
    </figure>
  );
}

export const almaSizeChartRegistry: Record<string, ComponentType> = {
  "alma-size-chart": AlmaSizeChart,
};
