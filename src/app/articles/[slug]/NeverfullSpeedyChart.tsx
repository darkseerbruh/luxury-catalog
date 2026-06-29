import type { ComponentType } from "react";
import { getMedians } from "../../../lib/article-data";

/**
 * Neverfull vs Speedy: what each lists for vs what it actually sells for, side by side.
 * The story is a reversal: the Speedy is searched more (Google Trends) and lists higher,
 * but the Neverfull MM sells for more, and both ask far above their realized price.
 *
 * Self-updating: async server component reads live ask (listed) + sold medians per variant
 * at render (getMedians), falling back per-field to the baked June 2026 capture when n=0 or
 * the DB is unavailable. Asking = TheRealReal + Fashionphile (price_type='listed'); sold =
 * eBay completed sales (price_type='sold'). Each figure carries n per
 * docs/data-analysis-standard.md. Chart-only; prose stays honest via the drift check
 * (docs/article-freshness-report.md). Original SVG/CSS.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const SPEEDY = "#6f6450";
const ASKTRACK = "#3a3326";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();

type Bag = { label: string; variant: number; accent: string; ask: number; askN: number; sold: number; soldN: number };
const BAGS: Bag[] = [
  { label: "Neverfull MM", variant: 218, accent: GOLD, ask: 1500, askN: 336, sold: 770, soldN: 87 },
  { label: "Speedy 30", variant: 498, accent: SPEEDY, ask: 1623, askN: 82, sold: 566, soldN: 93 },
];

export async function NeverfullSpeedyChart() {
  const ids = BAGS.map((b) => b.variant);
  const [askStats, soldStats] = await Promise.all([getMedians(ids, "listed"), getMedians(ids, "sold")]);
  const bags = BAGS.map((b) => {
    const a = askStats[b.variant];
    const s = soldStats[b.variant];
    return {
      ...b,
      ask: a && a.n > 0 ? a.median : b.ask,
      askN: a && a.n > 0 ? a.n : b.askN,
      sold: s && s.n > 0 ? s.median : b.sold,
      soldN: s && s.n > 0 ? s.n : b.soldN,
    };
  });
  const max = Math.max(...bags.flatMap((b) => [b.ask, b.sold]));
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 560 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What they ask vs what they sell for</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Median asking (premium resale) vs median sold (eBay completed sales), June 2026. Each bar labeled with the number of listings behind it.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bags.map((b) => (
            <div key={b.label}>
              <div style={{ fontSize: 13, color: FG, marginBottom: 7 }}>{b.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: MUTED, marginBottom: 3 }}>
                    <span>asks</span>
                    <span>{money(b.ask)} <span style={{ fontSize: 10.5 }}>· {b.askN}</span></span>
                  </div>
                  <div style={{ height: 13, background: SURF, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(b.ask / max) * 100}%`, height: "100%", background: ASKTRACK, borderRadius: 6 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: MUTED, marginBottom: 3 }}>
                    <span>sells</span>
                    <span style={{ color: FG }}>{money(b.sold)} <span style={{ color: MUTED, fontSize: 10.5 }}>· {b.soldN}</span></span>
                  </div>
                  <div style={{ height: 13, background: SURF, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(b.sold / max) * 100}%`, height: "100%", background: b.accent, borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 16, lineHeight: 1.5 }}>
          The Speedy lists higher, but the Neverfull MM sells for more, and both close well below their ask. Part of the gap is venue: premium resellers price above peer-to-peer eBay. Our capture, June 2026. Estimate from listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Louis Vuitton Neverfull versus Speedy, asking versus sold: the Neverfull MM asks about $1,500 and sells near $770, while the Speedy 30 asks about $1,623 but sells near $566. The Speedy lists a little higher yet the Neverfull sells for more, and both sell well under their asking price.
      </figcaption>
    </figure>
  );
}

export const neverfullSpeedyChartRegistry: Record<string, ComponentType> = {
  "neverfull-speedy-chart": NeverfullSpeedyChart,
};
