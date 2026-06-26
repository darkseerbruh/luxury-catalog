import type { ComponentType } from "react";

/**
 * "What the Flap sold for, by where you sold it" for the worth-it piece (#1).
 * Realized completed-sale prices by marketplace, with the typical asking price
 * and the new boutique price as dashed reference lines. Numbers carry date/n/
 * source in-caption per docs/data-analysis-standard.md. Original SVG/CSS.
 *
 * eBay $3,897 (n=76) and Poshmark $4,292 (n=78): completed-sale prices (buyers
 * make offers below the ask). Fashionphile $7,995 (n=229): its fixed list price
 * of items that sold, which buyers pay since there is no haggling (empirically
 * ~its $8,195 current ask). All authenticate any bag sold over $500. Re-confirmed
 * against prod 2026-06-26 (eBay/Poshmark from browser sold-search captures;
 * Fashionphile from price_history listing_status='sold'). The premium-reseller
 * gap is partly venue and partly condition (better-kept, full-set bags;
 * condition unrecorded).
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const PEER = "#9a8552";
const REF = "#6f6450";
const BORDER = "#322c22";
const SURF = "#1a1815";

const money = (n: number) => "$" + n.toLocaleString();

const MAX = 12400;
const pct = (v: number) => `${((v / MAX) * 100).toFixed(1)}%`;

const VENUES = [
  { label: "eBay", sub: "peer-to-peer", v: 3897, n: 76, color: PEER },
  { label: "Poshmark", sub: "peer-to-peer", v: 4292, n: 78, color: PEER },
  { label: "Fashionphile", sub: "premium reseller", v: 7995, n: 229, color: GOLD },
];
const REFS = [
  { v: 6000, label: "typical ask" },
  { v: 11700, label: "new" },
];

export function FlapVenueChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What it sold for, by where you sold it</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
          Median completed sale of a Medium Classic Flap by marketplace, June 2026, all authenticated. The dashed lines mark the typical asking price and the new boutique price.
        </div>

        {/* reference labels */}
        <div style={{ position: "relative", height: 13, marginBottom: 3, fontSize: 10, color: MUTED }}>
          {REFS.map((r) => (
            <span
              key={r.v}
              style={{
                position: "absolute",
                left: pct(r.v),
                transform: r.v >= 11000 ? "translateX(-100%)" : "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              {r.label} {money(r.v)}
            </span>
          ))}
        </div>

        {/* bars with reference lines overlaid */}
        <div style={{ position: "relative" }}>
          {REFS.map((r) => (
            <div
              key={r.v}
              aria-hidden
              style={{ position: "absolute", left: pct(r.v), top: 0, bottom: 0, width: 0, borderLeft: `1px dashed ${REF}` }}
            />
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {VENUES.map((x) => (
              <div key={x.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: FG }}>
                    {x.label} <span style={{ color: MUTED, fontSize: 11 }}>· {x.sub}</span>
                  </span>
                  <span style={{ color: GOLDSOFT }}>
                    {money(x.v)} <span style={{ color: MUTED, fontSize: 11 }}>· {x.n} sales</span>
                  </span>
                </div>
                <div style={{ height: 16, background: SURF, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ width: pct(x.v), height: "100%", background: x.color, borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          eBay and Poshmark are completed-sale prices; Fashionphile is its fixed list price, which buyers pay with no haggling (about its current ask). June 2026. Part of the gap to the premium reseller is condition: it carries better-kept, full-set bags, and condition is not recorded. An estimate from market data, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        A bar chart of what the Chanel Medium Classic Flap sold for by marketplace in June 2026: about $3,900 on eBay and $4,300 on Poshmark (peer-to-peer), and about $8,000 through Fashionphile (a premium fixed-price reseller), against a typical asking price of $6,000 and a new boutique price of $11,700.
      </figcaption>
    </figure>
  );
}

export const flapVenueChartRegistry: Record<string, ComponentType> = {
  "flap-venue-prices": FlapVenueChart,
};
