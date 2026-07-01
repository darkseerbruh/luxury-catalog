import type { ComponentType } from "react";
import { getMedians } from "../../../lib/article-data";

/**
 * The size-price question, by model. Asking medians from our capture 2026-06-26
 * (TheRealReal + Fashionphile, prod price_history, price_type='listed'), each with n.
 * Each model is scaled to its OWN largest bar so the DIRECTION reads at a glance:
 * Lady Dior and Constance slope down (smaller costs more); Triomphe slopes up.
 * Original SVG/CSS.
 *
 * Self-updating: async server component reads each size's live listed median + n per
 * variant at render (getMedians), falling back per-field to the baked capture when n=0 or
 * the DB is unavailable. Chart-only; prose stays honest via the drift check
 * (docs/article-freshness-report.md).
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const KELLY = "#6f6450";
const BORDER = "#322c22";

const money = (n: number) => "$" + n.toLocaleString();

type Bar = { size: string; variant: number; v: number; n: number };
type Group = { model: string; note: string; inverts: boolean; bars: Bar[] };

const GROUPS: Group[] = [
  {
    model: "Dior Lady Dior", note: "smaller costs more", inverts: true,
    bars: [
      { size: "Mini", variant: 570, v: 3925, n: 146 },
      { size: "Small", variant: 571, v: 3890, n: 105 },
      { size: "Medium", variant: 572, v: 2475, n: 184 },
      { size: "Large", variant: 573, v: 1750, n: 73 },
    ],
  },
  {
    model: "Hermès Constance", note: "smaller costs more", inverts: true,
    bars: [
      { size: "18 cm", variant: 529, v: 11950, n: 183 },
      { size: "24 cm", variant: 530, v: 9995, n: 57 },
    ],
  },
  {
    model: "Celine Triomphe", note: "bigger costs more", inverts: false,
    bars: [
      { size: "Mini", variant: 543, v: 1089, n: 46 },
      { size: "Small", variant: 544, v: 1395, n: 69 },
      { size: "Medium", variant: 545, v: 2295, n: 95 },
      { size: "Teen", variant: 546, v: 2370, n: 46 },
    ],
  },
];

export async function SizePriceCurveChart() {
  const ids = GROUPS.flatMap((g) => g.bars.map((b) => b.variant));
  const stats = await getMedians(ids, "listed");
  // Live listed median overrides the baked fallback per-bar; a size with no rows (n=0) keeps its baked number.
  const groups = GROUPS.map((g) => ({
    ...g,
    bars: g.bars.map((b) => {
      const s = stats[b.variant];
      return s && s.n > 0 ? { ...b, v: s.median, n: s.n } : b;
    }),
  }));
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 22, background: "#14120c", color: FG, maxWidth: 600 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Does a smaller bag cost more?</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Asking median by size, June 2026. Each bag is scaled to its own range so the direction shows. Labeled with the number of listings.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {groups.map((g) => {
            const max = Math.max(...g.bars.map((b) => b.v));
            return (
              <div key={g.model}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 14 }}>
                  <span style={{ color: FG }}>{g.model}</span>
                  <span style={{ color: g.inverts ? GOLD : MUTED, fontSize: 11 }}>{g.note}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  {g.bars.map((b) => (
                    <div key={b.size} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: FG, marginBottom: 6 }}>{money(b.v)}</div>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", height: 60 }}>
                        <div style={{ width: "70%", height: `${(b.v / max) * 100}%`, background: g.inverts ? GOLD : KELLY, borderRadius: "5px 5px 0 0", minHeight: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{b.size}</div>
                      <div style={{ fontSize: 9.5, color: MUTED }}>n={b.n}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          For bags bought as an accessory (Lady Dior, Constance) the smallest size carries a premium. For bags bought to use (Triomphe) size tracks function and bigger costs more. Asking medians from our capture, June 2026. Estimate, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Lady Dior and Hermès Constance get cheaper as they get larger, while the Celine Triomphe gets more expensive with size.
      </figcaption>
    </figure>
  );
}

export const sizePriceCurveChartRegistry: Record<string, ComponentType> = {
  "size-price-curve": SizePriceCurveChart,
};
