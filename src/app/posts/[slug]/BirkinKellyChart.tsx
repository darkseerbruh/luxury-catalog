import type { ComponentType } from "react";

/**
 * Birkin vs Kelly current-asking comparison for article #5. Grouped bars by size
 * tier show two things: Birkin and Kelly cost about the same size-for-size, and both
 * carry a steep small-size premium. Numbers are current asking medians, date-clean,
 * re-confirmed against prod 2026-06-26, stated with n in-caption per
 * docs/data-analysis-standard.md. Asking ("listing for"), not sold. Original SVG/CSS.
 *
 * Birkin: 25 $25,900 (n=99) · 30 $18,000 (n=121) · 35 $14,000 (n=117) · 40 $14,499 (n=36)
 * Kelly:  25 $25,159 (n=88) · 28 $17,500 (n=99)  · 32 $12,410 (n=112)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 28000;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const TIERS = [
  { label: "Smallest (25 cm)", birkin: 25900, bn: 99, kelly: 25159, kn: 88 },
  { label: "Mid (Birkin 30 / Kelly 28)", birkin: 18000, bn: 121, kelly: 17500, kn: 99 },
  { label: "Larger (Birkin 35 / Kelly 32)", birkin: 14000, bn: 117, kelly: 12410, kn: 112 },
];

function Bar({ label, v, n, color, valColor }: { label: string; v: number; n: number; color: string; valColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 52, fontSize: 11, color: MUTED, textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
        <div style={{ width: pct(v), height: "100%", background: color, borderRadius: 7 }} />
      </div>
      <span style={{ fontSize: 11.5, color: valColor, width: 92, textAlign: "right" }}>
        {money(v)} <span style={{ color: MUTED }}>· {n}</span>
      </span>
    </div>
  );
}

export function BirkinKellyChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 600 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Birkin and Kelly, side by side</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Median asking price by size on premium resale, June 2026 (asking, not sold). Bars labeled with the number of listings behind each.
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: MUTED, marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: GOLD, display: "inline-block" }} /> Birkin
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: KELLY, display: "inline-block" }} /> Kelly
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {TIERS.map((t) => (
            <div key={t.label}>
              <div style={{ fontSize: 12, color: FG, marginBottom: 5 }}>{t.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Bar label="Birkin" v={t.birkin} n={t.bn} color={GOLD} valColor={GOLDSOFT} />
                <Bar label="Kelly" v={t.kelly} n={t.kn} color={KELLY} valColor={FG} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians from our tracking of current listings, June 2026. The Birkin 40 lists around $14,499 (n=36), close to the 35. Estimate from current listings, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Birkin versus Kelly asking prices by size: at 25 cm both list around $25,000; at mid size around $17,500 to $18,000; at the larger size $12,410 (Kelly 32) to $14,000 (Birkin 35). Birkin runs slightly higher size-for-size, and both rise steeply as the bag gets smaller.
      </figcaption>
    </figure>
  );
}

export const birkinKellyChartRegistry: Record<string, ComponentType> = {
  "birkin-kelly-chart": BirkinKellyChart,
};
