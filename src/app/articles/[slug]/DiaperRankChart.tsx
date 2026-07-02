import type { ComponentType } from "react";

/**
 * The four ranked diaper-duty totes, by preloved asking median, with the
 * Neverfull's realized-sold contrast. Built per content rule 6.3 (rankings get
 * a chart on OUR data). Numbers re-confirmed against prod 2026-07-02; the
 * Ophidia Medium keeps its late-June family read. Original SVG/CSS, no logos.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 2800;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const ROWS = [
  { label: "Goyard Saint Louis GM", v: 2495, n: 90, date: "Jul 2" },
  { label: "Louis Vuitton OnTheGo GM", v: 2350, n: 263, date: "Jul 2" },
  { label: "Louis Vuitton Neverfull MM", v: 1565, n: 913, date: "Jul 2", sold: 770, soldN: 87 },
  { label: "Gucci Ophidia (Medium)", v: 1250, n: 155, date: "late Jun" },
];

export function DiaperRankChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>The exit numbers, side by side</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Median preloved asking prices, 2026. The Neverfull also shows what our tracked sales actually closed at.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>{r.label}</span>
                <span style={{ color: GOLDSOFT }}>
                  {money(r.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.n} listings, {r.date}</span>
                </span>
              </div>
              <div style={{ height: 14, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: GOLD, borderRadius: 7 }} />
              </div>
              {r.sold ? (
                <div style={{ marginTop: 3 }}>
                  <div style={{ height: 8, background: SURF, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: pct(r.sold), height: "100%", background: KELLY, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
                    actually sold near {money(r.sold)} ({r.soldN} sales, through late Jun)
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians are ceilings, not checks; the Neverfull is the one bag here where we hold realized sales, and the gap it shows is worth remembering when you read the others. Estimates from tracked listings, never an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Preloved asking medians for the four ranked diaper-duty totes: Goyard Saint Louis GM about $2,495, Louis Vuitton OnTheGo GM about $2,350, Louis Vuitton Neverfull MM about $1,565 asking but near $770 in tracked sales, Gucci Ophidia Medium about $1,250.
      </figcaption>
    </figure>
  );
}

export const diaperRankChartRegistry: Record<string, ComponentType> = {
  "diaper-rank": DiaperRankChart,
};
