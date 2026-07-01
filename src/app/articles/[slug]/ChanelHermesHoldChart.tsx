import type { ComponentType } from "react";

/**
 * "Used vs new" comparison for the Chanel-vs-Hermès article. Two houses, each with
 * a new-retail bar and a used-resale bar, so the crossover is the whole point: the
 * Chanel Classic Flap trades BELOW retail used, the Hermès Birkin 30 trades ABOVE it.
 *
 * Figures (stated + hedged in-caption per docs/data-analysis-standard.md):
 *  - New retail = third-party 2026 price trackers (Hermès prices in EUR → FX caveat).
 *  - Used resale = our own tracking of live listings, June 2026 (Birkin 30 n=121).
 * These are estimates of the market, not a forecast or an appraisal. Original SVG/CSS,
 * never a photo. Same visual language as BirkinKellyChart.
 *
 * Chanel Classic Flap (medium): new ~$11,700 · used ~$6,000  (used ≈ 49% below retail)
 * Hermès Birkin 30:             new ~$14,900 · used ~$18,000 (used ≈ 21% above retail)
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const STONE = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 20000;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const HOUSES = [
  {
    house: "Chanel Classic Flap (medium)",
    retail: 11700,
    resale: 6000,
    resaleN: null as number | null,
    delta: "Used sits about 49% below retail",
    below: true,
  },
  {
    house: "Hermès Birkin 30",
    retail: 14900,
    resale: 18000,
    resaleN: 121,
    delta: "Used sits about 21% above retail",
    below: false,
  },
];

function Bar({
  label,
  v,
  n,
  color,
  valColor,
}: {
  label: string;
  v: number;
  n: number | null;
  color: string;
  valColor: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 88, fontSize: 11, color: MUTED, textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: 15, background: SURF, borderRadius: 7, overflow: "hidden" }}>
        <div style={{ width: pct(v), height: "100%", background: color, borderRadius: 7 }} />
      </div>
      <span style={{ fontSize: 11.5, color: valColor, width: 92, textAlign: "right" }}>
        {money(v)}
        {n ? <span style={{ color: MUTED }}> · {n}</span> : null}
      </span>
    </div>
  );
}

export function ChanelHermesHoldChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 600 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Used vs new: two ways to hold value</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          A used Chanel Flap costs less than a new one. A used Birkin costs more. Same reputation, opposite math.
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: MUTED, marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: STONE, display: "inline-block" }} /> New (2026 retail)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: GOLD, display: "inline-block" }} /> Used (resale, June 2026)
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {HOUSES.map((h) => (
            <div key={h.house}>
              <div style={{ fontSize: 12, color: FG, marginBottom: 5 }}>{h.house}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Bar label="New" v={h.retail} n={null} color={STONE} valColor={FG} />
                <Bar label="Used" v={h.resale} n={h.resaleN} color={GOLD} valColor={GOLDSOFT} />
              </div>
              <div style={{ fontSize: 11, color: h.below ? MUTED : GOLDSOFT, marginTop: 5 }}>{h.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          New retail from third-party 2026 price trackers (Hermès prices in euros, so the dollar figure moves with the exchange rate). Used from our tracking of live listings, June 2026; the Birkin 30 figure rests on 121 listings. An estimate of the market, not a forecast or an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Used versus new prices for two value-stable bags. The Chanel Classic Flap medium retails around $11,700 new and trades around $6,000 used, roughly 49 percent below retail. The Hermès Birkin 30 retails around $14,900 new and trades around $18,000 used, roughly 21 percent above retail. New figures are 2026 third-party trackers; used figures are our June 2026 listing tracking.
      </figcaption>
    </figure>
  );
}

export const chanelHermesHoldChartRegistry: Record<string, ComponentType> = {
  "chanel-hermes-hold": ChanelHermesHoldChart,
};
