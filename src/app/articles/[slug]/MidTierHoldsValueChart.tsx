import type { ComponentType } from "react";
import { getMedians } from "../../../lib/article-data";

/**
 * Which accessible-luxury bags hold value. eBay completed (sold) medians, our capture
 * 2026-06-26, each with n (prod price_history, price_type='sold'). Most sit under the
 * $500 line eBay authenticates at, so these are peer-to-peer market prices. Leather
 * heritage bags (gold) hold; logo/nylon (kelly) does not. Original SVG/CSS.
 *
 * Self-updating: async server component reads each bag's live sold median + n per variant
 * at render (getMedians), falling back per-row to the baked capture when n=0 or the DB is
 * unavailable. Chart-only; prose stays honest via the drift check
 * (docs/article-freshness-report.md).
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const pct = (v: number, max: number) => `${Math.min(100, (v / max) * 100).toFixed(1)}%`;

type Row = { label: string; sub: string; variant: number; v: number; n: number; leather: boolean };
const ROWS: Row[] = [
  { label: "Coach Rogue", sub: "leather", variant: 605, v: 645, n: 88, leather: true },
  { label: "Mulberry Bayswater", sub: "leather", variant: 932, v: 519, n: 93, leather: true },
  { label: "Coach Tabby 26", sub: "coated canvas", variant: 596, v: 198, n: 177, leather: false },
  { label: "Kate Spade Knott", sub: "leather, value brand", variant: 925, v: 114, n: 86, leather: false },
  { label: "Kate Spade Sam", sub: "nylon", variant: 927, v: 100, n: 50, leather: false },
  { label: "Longchamp Le Pliage", sub: "nylon", variant: 930, v: 90, n: 69, leather: false },
  { label: "Michael Kors Jet Set", sub: "coated canvas", variant: 928, v: 70, n: 55, leather: false },
];

export async function MidTierHoldsValueChart() {
  const stats = await getMedians(ROWS.map((r) => r.variant), "sold");
  // Live sold median overrides the baked fallback per-row; a bag with no rows (n=0) keeps its baked number.
  const rows = ROWS.map((r) => {
    const s = stats[r.variant];
    return s && s.n > 0 ? { ...r, v: s.median, n: s.n } : r;
  });
  // Scale to the data (with headroom) so a re-capture past the old 700 ceiling still renders proportionally.
  const max = Math.max(700, ...rows.map((r) => r.v)) * 1.05;
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 580 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What accessible bags actually sell for</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
          Median sold price on eBay, June 2026. Labeled with the number of sales behind each.
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: MUTED, marginBottom: 14 }}>
          <span><span style={{ display: "inline-block", width: 18, height: 8, background: GOLD, borderRadius: 3, verticalAlign: "middle", marginRight: 5 }} />heritage leather</span>
          <span><span style={{ display: "inline-block", width: 18, height: 8, background: KELLY, borderRadius: 3, verticalAlign: "middle", marginRight: 5 }} />logo / nylon / canvas</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {rows.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>
                  {r.label} <span style={{ color: MUTED, fontSize: 11 }}>· {r.sub}</span>
                </span>
                <span style={{ color: r.leather ? "#e3c785" : FG }}>
                  {money(r.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.n} sold</span>
                </span>
              </div>
              <div style={{ height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: pct(r.v, max), height: "100%", background: r.leather ? GOLD : KELLY, borderRadius: 7 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Structured leather (Mulberry Bayswater, Coach Rogue) clears $500 and up. The logo and nylon everyday bags, made in huge numbers and discounted new, sell for a fraction. Our eBay sold capture, June 2026. Most are under $500 so they are peer-to-peer prices, not authenticated comps. Estimate, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Accessible-luxury resale: Coach Rogue sells around $645 and Mulberry Bayswater $519, while Michael Kors Jet Set sells around $70, Longchamp Le Pliage $90, and Kate Spade around $100.
      </figcaption>
    </figure>
  );
}

export const midTierHoldsValueChartRegistry: Record<string, ComponentType> = {
  "midtier-holds-value": MidTierHoldsValueChart,
};
