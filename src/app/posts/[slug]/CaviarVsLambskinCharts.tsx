import type { ComponentType } from "react";

/**
 * Data visualization for the Caviar vs Lambskin piece (#2). Numbers are baked from
 * verified queries and stated with their date, n, and source in-caption, per
 * docs/data-analysis-standard.md and the content-strategy visuals rule. Original
 * SVG, no chart library.
 *
 * Chanel Medium Classic Flap (variant 199), median asking/sold price by leather:
 *  - TheRealReal (asking):  caviar $7,063 (n=26)  lambskin $4,821 (n=33)
 *  - Fashionphile (asking): caviar $8,550 (n=17)  lambskin $6,843 (n=10)
 *  - eBay (sold):           caviar $5,500 (n=20)  lambskin $4,225 (n=30)
 *  - Poshmark (sold):       caviar $9,600 (n=5)   lambskin $3,500 (n=8)
 * Asking medians re-confirmed against prod on 2026-06-25. Sold medians from the
 * verified browser-capture run in docs/research-drafts/caviar-vs-lambskin-analysis.md.
 * Premium = caviar median minus lambskin median, with a 95% bootstrap CI (rounded):
 *  TRR $2,240 [1,100-2,950] · Fashionphile $1,710 [200-3,550] ·
 *  eBay $1,275 [700-2,100] · Poshmark $6,100 [300-10,700] (small n).
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const LAMB = "#6f6450";
const BORDER = "#322c22";

// Texture, not color, separates the two leathers (accessibility: never encode
// meaning by color alone). Caviar is the pebbled leather, so it gets a dot
// stipple; lambskin is smooth, so it gets a fine diagonal weave. The legend
// swatches carry the same fill so the pattern reads as a key.
const CAVIAR_FILL = {
  backgroundColor: GOLD,
  backgroundImage: "radial-gradient(rgba(40,28,4,0.5) 0.9px, transparent 1.1px)",
  backgroundSize: "5px 5px",
} as const;
const LAMBSKIN_FILL = {
  backgroundColor: LAMB,
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(243,237,224,0.22) 0, rgba(243,237,224,0.22) 1.5px, transparent 1.5px, transparent 5px)",
} as const;

const money = (n: number) => "$" + n.toLocaleString();

type Row = {
  mk: string;
  type: "asking" | "sold";
  caviar: number;
  lambskin: number;
  nC: number;
  nL: number;
};
type Prem = { mk: string; diff: number; lo: number; hi: number; small?: boolean };

const ROWS: Row[] = [
  { mk: "TheRealReal", type: "asking", caviar: 7063, lambskin: 4821, nC: 26, nL: 33 },
  { mk: "Fashionphile", type: "asking", caviar: 8550, lambskin: 6843, nC: 17, nL: 10 },
  { mk: "eBay", type: "sold", caviar: 5500, lambskin: 4225, nC: 20, nL: 30 },
  { mk: "Poshmark", type: "sold", caviar: 9600, lambskin: 3500, nC: 5, nL: 8 },
];

const PREM: Prem[] = [
  { mk: "TheRealReal", diff: 2240, lo: 1100, hi: 2950 },
  { mk: "Fashionphile", diff: 1710, lo: 200, hi: 3550 },
  { mk: "eBay", diff: 1275, lo: 700, hi: 2100 },
  { mk: "Poshmark", diff: 6100, lo: 300, hi: 10700, small: true },
];

export function CaviarVsLambskinCharts() {
  // Panel 1 — grouped horizontal bars, median price by leather per marketplace.
  const MAX1 = 10000;
  const barW = (v: number) => `${((v / MAX1) * 100).toFixed(1)}%`;

  // Panel 2 — the premium with its 95% confidence interval, on a shared $ scale.
  const MAX2 = 11000;
  const pos2 = (v: number) => (v / MAX2) * 100;

  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Caviar asks and sells higher, in every market</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Median price of a Medium Classic Flap by leather. TheRealReal and Fashionphile are asking prices (June 2026); eBay and Poshmark are completed sales. Bars labeled with the number of listings behind each.
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: MUTED, marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 13, height: 13, borderRadius: 3, display: "inline-block", ...CAVIAR_FILL }} /> Caviar (dotted)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 13, height: 13, borderRadius: 3, display: "inline-block", ...LAMBSKIN_FILL }} /> Lambskin (striped)
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ROWS.map((r) => (
            <div key={r.mk}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ color: FG }}>{r.mk}</span>
                <span style={{ color: MUTED, fontSize: 11 }}>{r.type === "asking" ? "asking" : "sold"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 15, background: "#1a1815", borderRadius: 7, overflow: "hidden" }}>
                    <div style={{ width: barW(r.caviar), height: "100%", borderRadius: 7, ...CAVIAR_FILL }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: GOLDSOFT, width: 92, textAlign: "right" }}>
                    {money(r.caviar)} <span style={{ color: MUTED }}>· {r.nC}</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 15, background: "#1a1815", borderRadius: 7, overflow: "hidden" }}>
                    <div style={{ width: barW(r.lambskin), height: "100%", borderRadius: 7, ...LAMBSKIN_FILL }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: FG, width: 92, textAlign: "right" }}>
                    {money(r.lambskin)} <span style={{ color: MUTED }}>· {r.nL}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, margin: "18px 0 12px" }} />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>How big the gap is, and how sure</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          The caviar premium at the median, with its margin of error (the band a repeat of the sample would land in 95 times out of 100). Every band sits above zero, so the gap is unlikely to be chance.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {PREM.map((p) => (
            <div key={p.mk}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: FG }}>
                  {p.mk}
                  {p.small ? <span style={{ color: MUTED, fontSize: 10.5 }}> · few sales</span> : null}
                </span>
                <span style={{ color: GOLDSOFT }}>+{money(p.diff)}</span>
              </div>
              <svg viewBox="0 0 300 18" width="100%" height="18" role="img"
                aria-label={`${p.mk}: caviar premium ${money(p.diff)}, 95% interval ${money(p.lo)} to ${money(p.hi)}.`}>
                {/* zero baseline + scale */}
                <line x1="0" y1="9" x2="300" y2="9" stroke="#241f17" strokeWidth="1" />
                {/* CI band */}
                <rect x={pos2(p.lo) * 3} y="5" width={(pos2(p.hi) - pos2(p.lo)) * 3} height="8" rx="4" fill="#3a2f12" />
                {/* whisker caps */}
                <line x1={pos2(p.lo) * 3} y1="3" x2={pos2(p.lo) * 3} y2="15" stroke={MUTED} strokeWidth="1.5" />
                <line x1={pos2(p.hi) * 3} y1="3" x2={pos2(p.hi) * 3} y2="15" stroke={MUTED} strokeWidth="1.5" />
                {/* median marker */}
                <circle cx={pos2(p.diff) * 3} cy="9" r="3.5" fill={GOLD} />
              </svg>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
                range {money(p.lo)} to {money(p.hi)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          Asking medians re-confirmed against our listings on June 25, 2026. Sold medians from completed eBay and Poshmark listings, same period. Leather read from each listing title. Condition is not recorded anywhere, so it is the one factor this cannot rule out.
        </div>
      </div>
      <figcaption className="sr-only">
        Two charts of the Chanel Medium Classic Flap: median price of caviar versus lambskin across TheRealReal, Fashionphile, eBay, and Poshmark; and the caviar premium with its 95 percent confidence interval, which sits above zero in all four marketplaces.
      </figcaption>
    </figure>
  );
}

export const caviarVsLambskinChartsRegistry: Record<string, ComponentType> = {
  "caviar-vs-lambskin-charts": CaviarVsLambskinCharts,
};
