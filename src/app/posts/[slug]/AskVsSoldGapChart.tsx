import type { ComponentType } from "react";

/**
 * The asking-price illusion: median asking vs median sold, per bag, sorted by gap.
 * Our capture 2026-06-26: asking = TheRealReal + Fashionphile (price_type='listed'),
 * sold = eBay completed sales (price_type='sold'), each with n. Coach Rogue is the
 * exception (sold above ask). Per docs/data-analysis-standard.md every row carries n.
 * Original SVG/CSS.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();

type Row = { label: string; ask: number; askN: number; sold: number; soldN: number; note?: string };
const ROWS: Row[] = [
  { label: "Lady Dior mini", ask: 3925, askN: 146, sold: 1789, soldN: 11, note: "thin sold n" },
  { label: "LV Neverfull MM", ask: 1500, askN: 336, sold: 770, soldN: 87 },
  { label: "Coach Tabby 26", ask: 365, askN: 43, sold: 198, soldN: 177 },
  { label: "Chanel Classic Flap Medium", ask: 6995, askN: 556, sold: 3846, soldN: 78 },
  { label: "Dior Saddle (medium)", ask: 2895, askN: 254, sold: 1652, soldN: 82 },
  { label: "Gucci GG Marmont small", ask: 1095, askN: 304, sold: 771, soldN: 46 },
  { label: "Coach Rogue (the exception)", ask: 420, askN: 16, sold: 645, soldN: 88, note: "sold above ask" },
];

export function AskVsSoldGapChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 600 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What it lists for vs what it sells for</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
          Median asking (premium resale) vs median sold (eBay completed sales), June 2026. Each bar scaled to its own bag.
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: MUTED, marginBottom: 14 }}>
          <span><span style={{ display: "inline-block", width: 18, height: 8, background: KELLY, borderRadius: 3, verticalAlign: "middle", marginRight: 5 }} />asking</span>
          <span><span style={{ display: "inline-block", width: 18, height: 8, background: GOLD, borderRadius: 3, verticalAlign: "middle", marginRight: 5 }} />sold</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROWS.map((r) => {
            const max = Math.max(r.ask, r.sold);
            return (
              <div key={r.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: FG }}>{r.label}{r.note ? <span style={{ color: MUTED, fontSize: 10.5 }}> · {r.note}</span> : null}</span>
                  <span style={{ color: MUTED, fontSize: 11 }}>ask {money(r.ask)} · sold {money(r.sold)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ height: 11, background: SURF, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(r.ask / max) * 100}%`, height: "100%", background: KELLY, borderRadius: 6 }} />
                  </div>
                  <div style={{ height: 11, background: SURF, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(r.sold / max) * 100}%`, height: "100%", background: GOLD, borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Across six bags the asking median runs roughly 75 to 120% above the sold median. The Coach Rogue is the exception, selling above its (thin) asking sample. Part of the gap is venue: premium resellers price above peer-to-peer eBay. Our capture, June 2026. Estimate, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Designer bags list far above what they sell for: Lady Dior mini asks $3,925 but sells near $1,789, Neverfull MM asks $1,500 sells $770, Chanel Flap asks $6,995 sells $3,846, while the Coach Rogue sells above its asking price.
      </figcaption>
    </figure>
  );
}

export const askVsSoldGapChartRegistry: Record<string, ComponentType> = {
  "ask-vs-sold-gap": AskVsSoldGapChart,
};
