import type { ComponentType } from "react";

/**
 * Chanel Classic Flap: the size run, smallest to largest, with what each size
 * actually asks preloved. Built for the "Chanel in 2026" explainer (owner ask,
 * 2026-07-02: the size run needs a visual, not a spoken list). Pure resale data
 * from prod comps pulled 2026-07-02; thin samples labeled as sketches. The
 * finding IS the chart: price does not climb with size. The small asks the
 * most and the maxi the least. Original SVG/CSS, no logos.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 8200;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

/** Size order = physical order, smallest first. sizePct drives the little
 * silhouette strip so the eye gets the size run without any dimension claims. */
const ROWS = [
  { label: "Mini (rectangular)", sizePct: 34, v: 4240, n: 4, thin: true },
  { label: "Small", sizePct: 46, v: 7595, n: 111, thin: false },
  { label: "Medium", sizePct: 55, v: 7156, n: 1018, thin: false, note: "the default people mean" },
  { label: "Jumbo", sizePct: 74, v: 6620, n: 86, thin: false },
  { label: "Maxi", sizePct: 92, v: 5825, n: 9, thin: true },
];

export function ChanelFlapSizeChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>The Classic Flap size run, and the price twist</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Smallest to largest. Bars are median preloved asking prices (July 2, 2026), and bigger does not mean pricier.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {/* size-run silhouette: a simple flap-bag rectangle scaled by position in the run */}
                  <span aria-hidden style={{ width: `${r.sizePct * 0.4}px`, height: 10, border: `1px solid ${GOLD}`, borderRadius: 2, display: "inline-block", opacity: 0.8 }} />
                  <span style={{ color: FG }}>
                    {r.label}
                    {r.note ? <span style={{ color: MUTED, fontSize: 11 }}> · {r.note}</span> : null}
                  </span>
                </span>
                <span style={{ color: r.thin ? MUTED : GOLDSOFT }}>
                  {money(r.v)}{" "}
                  <span style={{ color: MUTED, fontSize: 11 }}>
                    · {r.n} listing{r.n === 1 ? "" : "s"}{r.thin ? ", thin" : ""}
                  </span>
                </span>
              </div>
              <div style={{ height: 14, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.v), height: "100%", background: r.thin ? KELLY : GOLD, borderRadius: 7, opacity: r.thin ? 0.75 : 1 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians from our tracked listings, July 2, 2026; the square mini is too thin in our comps for a fair bar. The small asks the most and the maxi the least. Estimates from current listings within mixed conditions, never an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Chanel Classic Flap sizes from mini to maxi with median preloved asking prices: mini rectangular about $4,240 (thin sample), small about $7,595, medium about $7,156, jumbo about $6,620, maxi about $5,825 (thin sample). Price does not rise with size.
      </figcaption>
    </figure>
  );
}

export const chanelFlapSizeChartRegistry: Record<string, ComponentType> = {
  "chanel-flap-sizes": ChanelFlapSizeChart,
};
