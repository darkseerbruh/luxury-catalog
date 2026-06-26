import type { ComponentType } from "react";

/**
 * Coach resale reality: realized (sold) median vs asking median, per model+size.
 * Our own capture 2026-06-26: eBay completed sales (sold) + TheRealReal/Fashionphile
 * (asking), in prod price_history. Sold is the lead figure; asking shown as a marker.
 * Per docs/data-analysis-standard.md every bar carries its n. Original SVG/CSS.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const KELLY = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();
const MAX = 720;
const pct = (v: number) => `${Math.min(100, (v / MAX) * 100).toFixed(1)}%`;

type Row = { label: string; group: "Tabby" | "Rogue"; sold: number; soldN: number; ask: number };
const ROWS: Row[] = [
  { label: "Tabby 26", group: "Tabby", sold: 198, soldN: 177, ask: 365 },
  { label: "Tabby 20", group: "Tabby", sold: 193, soldN: 25, ask: 303 },
  { label: "Tabby (shoulder)", group: "Tabby", sold: 204, soldN: 73, ask: 309 },
  { label: "Rogue 25", group: "Rogue", sold: 499, soldN: 41, ask: 356 },
  { label: "Rogue (standard)", group: "Rogue", sold: 645, soldN: 88, ask: 420 },
];

export function CoachResaleRealityChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG, maxWidth: 580 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What Coach bags actually sell for</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
          Bar is the realized (sold) median on eBay. The line marker is the asking median on premium resale. June 2026.
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: MUTED, marginBottom: 14 }}>
          <span><span style={{ display: "inline-block", width: 18, height: 8, background: GOLD, borderRadius: 3, verticalAlign: "middle", marginRight: 5 }} />sold median</span>
          <span><span style={{ display: "inline-block", width: 2, height: 12, background: FG, verticalAlign: "middle", marginRight: 6 }} />asking median</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {ROWS.map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: FG }}>
                  {r.label} <span style={{ color: MUTED, fontSize: 11 }}>· {r.group === "Rogue" ? "leather" : "trend bag"}</span>
                </span>
                <span style={{ color: r.group === "Rogue" ? GOLDSOFT : FG }}>
                  {money(r.sold)} <span style={{ color: MUTED, fontSize: 11 }}>· {r.soldN} sold · ask {money(r.ask)}</span>
                </span>
              </div>
              <div style={{ position: "relative", height: 16, background: SURF, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: pct(r.sold), height: "100%", background: r.group === "Rogue" ? GOLD : KELLY, borderRadius: 8 }} />
                <div style={{ position: "absolute", top: -2, left: pct(r.ask), width: 2, height: 20, background: FG }} title={`asking ${money(r.ask)}`} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          The Tabby sells around $200 no matter the asking price. The leather Rogue holds two to three times more. Our capture of eBay sold prices and reseller asks, June 2026. Estimate from market data, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Coach resale: Tabby bags sell near $198 to $204 despite asking prices around $303 to $365, while the leather Rogue sells for $499 to $645.
      </figcaption>
    </figure>
  );
}

export const coachResaleRealityChartRegistry: Record<string, ComponentType> = {
  "coach-resale-reality": CoachResaleRealityChart,
};
