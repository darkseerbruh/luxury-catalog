import type { ComponentType } from "react";

/**
 * Neverfull vs Speedy current-asking comparison. Date-clean current listings,
 * re-confirmed against prod 2026-06-26, stated with n per docs/data-analysis-standard.md.
 * Asking ("listing for"), not sold. Original SVG/CSS.
 *  Neverfull MM $1,245 (n=141) · Neverfull PM $1,185 (n=54)
 *  Speedy 30 $1,623 (n=82) · Speedy 25 $1,520 (n=48)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const SPEEDY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 1900;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const ROWS = [
  { label: "Neverfull MM", v: 1245, n: 141, color: GOLD, valColor: GOLDSOFT },
  { label: "Neverfull PM", v: 1185, n: 54, color: GOLD, valColor: GOLDSOFT },
  { label: "Speedy 30", v: 1623, n: 82, color: SPEEDY, valColor: FG },
  { label: "Speedy 25", v: 1520, n: 48, color: SPEEDY, valColor: FG },
];

export function NeverfullSpeedyChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Neverfull and Speedy, side by side</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Median asking price on premium resale, June 2026 (asking, not sold). Labeled with the number of listings behind each.
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: MUTED, marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: GOLD, display: "inline-block" }} /> Neverfull
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: SPEEDY, display: "inline-block" }} /> Speedy
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>{r.label}</span>
                <span style={{ color: r.valColor }}>
                  {money(r.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.n}</span>
                </span>
              </div>
              <div style={{ height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: r.color, borderRadius: 7 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians from our tracking of current listings, June 2026. The Speedy lists a little higher than the Neverfull at a comparable size. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Louis Vuitton Neverfull versus Speedy asking prices: Neverfull MM $1,245 and PM $1,185, Speedy 30 $1,623 and Speedy 25 $1,520. The Speedy lists a little higher size-for-size.
      </figcaption>
    </figure>
  );
}

export const neverfullSpeedyChartRegistry: Record<string, ComponentType> = {
  "neverfull-speedy-chart": NeverfullSpeedyChart,
};
