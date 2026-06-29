import type { ComponentType } from "react";

/**
 * "What the Flap sold for, by where you sold it" for the worth-it piece (#1).
 * A box-and-whisker per marketplace, so the SPREAD and the low end show, not just
 * the median: Fashionphile's box sits high and tight (it rarely sells a Flap under
 * ~$4,000), while eBay and Poshmark stretch down low. That spread is the point.
 *
 * Five-number summaries (June 2026):
 *  - eBay:        min 1500*, Q1 2500, med 3897, Q3 5416, max 13500 (n=76)
 *  - Poshmark:    min 1741*, Q1 3300, med 4292, Q3 6550, max 14335 (n=78)
 *  - Fashionphile: min 3595, Q1 6930, med 7995, Q3 8795, max 13095 (n=229)
 * eBay/Poshmark are completed-sale prices (browser sold-search captures, 2026-06-26);
 * Fashionphile is its fixed list price of sold items (price_history listing_status=
 * 'sold', ~its current ask). *eBay/Poshmark were filtered to >= $1,500 to drop
 * accessories/mislabels, so their true floor runs even lower. Numbers carry date/n/
 * source per docs/data-analysis-standard.md. Original SVG.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const PEER = "#9a8552";
const REF = "#6f6450";
const BORDER = "#322c22";

const money = (n: number) => "$" + n.toLocaleString();
const moneyK = (n: number) => (n === 0 ? "$0" : "$" + n / 1000 + "k");

const X0 = 82;
const X1 = 388;
const MAX = 15000;
const x = (v: number) => X0 + (v / MAX) * (X1 - X0);

type Box = { label: string; n: number; min: number; q1: number; med: number; q3: number; max: number; color: string; y: number };
const SELLERS: Box[] = [
  { label: "eBay", n: 76, min: 1500, q1: 2500, med: 3897, q3: 5416, max: 13500, color: PEER, y: 48 },
  { label: "Poshmark", n: 78, min: 1741, q1: 3300, med: 4292, q3: 6550, max: 14335, color: PEER, y: 86 },
  { label: "Fashionphile", n: 229, min: 3595, q1: 6930, med: 7995, q3: 8795, max: 13095, color: GOLD, y: 124 },
];
const REFS = [
  { v: 6000, label: "typical ask" },
  { v: 11700, label: "new" },
];
const TICKS = [0, 5000, 10000, 15000];

export function FlapVenueChart() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c", color: FG }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>What it sold for, by where you sold it</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>
          Completed sales of a Medium Classic Flap by marketplace, June 2026, all authenticated. Each box is the middle half of sales, the line inside is the median, and the thin line is the full range.
        </div>

        <svg
          viewBox="0 0 400 178"
          width="100%"
          role="img"
          aria-label="A box-and-whisker chart of Chanel Medium Classic Flap sale prices by marketplace, June 2026. eBay (n=76): Middle half $2,500 to $5,416, median $3,897. Poshmark (n=78): Middle half $3,300 to $6,550, median $4,292. Fashionphile (n=229): Middle half $6,930 to $8,795, median $7,995. The typical asking price is $6,000 and the new boutique price is $11,700. Fashionphile's box sits well above the other two, which stretch much lower."
        >
          {/* reference lines */}
          {REFS.map((r) => (
            <g key={r.v}>
              <line x1={x(r.v)} y1={26} x2={x(r.v)} y2={146} stroke={REF} strokeWidth="1" strokeDasharray="2 3" />
              <text x={x(r.v)} y={20} textAnchor={r.v >= 11000 ? "end" : "middle"} fontSize="9" fill={MUTED}>
                {r.label} {money(r.v)}
              </text>
            </g>
          ))}

          {/* x axis ticks */}
          {TICKS.map((t) => (
            <text key={t} x={x(t)} y={162} textAnchor="middle" fontSize="8.5" fill={MUTED}>
              {moneyK(t)}
            </text>
          ))}

          {/* boxes */}
          {SELLERS.map((s) => (
            <g key={s.label}>
              <text x={X0 - 8} y={s.y - 1} textAnchor="end" fontSize="10.5" fill={FG}>{s.label}</text>
              <text x={X0 - 8} y={s.y + 10} textAnchor="end" fontSize="8" fill={MUTED}>n={s.n}</text>
              {/* whisker */}
              <line x1={x(s.min)} y1={s.y} x2={x(s.max)} y2={s.y} stroke={MUTED} strokeWidth="1" />
              <line x1={x(s.min)} y1={s.y - 4} x2={x(s.min)} y2={s.y + 4} stroke={MUTED} strokeWidth="1" />
              <line x1={x(s.max)} y1={s.y - 4} x2={x(s.max)} y2={s.y + 4} stroke={MUTED} strokeWidth="1" />
              {/* box */}
              <rect x={x(s.q1)} y={s.y - 9} width={x(s.q3) - x(s.q1)} height={18} rx={2} fill={s.color} opacity={0.9} stroke={GOLDSOFT} strokeWidth="0.6" />
              {/* median */}
              <line x1={x(s.med)} y1={s.y - 9} x2={x(s.med)} y2={s.y + 9} stroke="#14120c" strokeWidth="2" />
              <text x={x(s.med)} y={s.y - 13} textAnchor="middle" fontSize="9" fill={GOLDSOFT}>{money(s.med)}</text>
            </g>
          ))}
        </svg>

        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 10, lineHeight: 1.5 }}>
          eBay and Poshmark are completed-sale prices; Fashionphile is its fixed list price, which buyers pay with no haggling. June 2026. We dropped sales under $1,500 on eBay and Poshmark to exclude accessories and mislabels, so their true low end runs lower still. Fashionphile rarely sells a Flap under $4,000, which is much of why its prices sit higher: it lists curated, better-kept bags, and there is no offer below the ask. An estimate from market data, not an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        Box-and-whisker chart of Chanel Medium Classic Flap sale prices by marketplace in June 2026. Fashionphile&rsquo;s middle half ($6,930 to $8,795) sits above eBay&rsquo;s ($2,500 to $5,416) and Poshmark&rsquo;s ($3,300 to $6,550), which both stretch much lower, against a $6,000 typical ask and $11,700 new price.
      </figcaption>
    </figure>
  );
}

export const flapVenueChartRegistry: Record<string, ComponentType> = {
  "flap-venue-prices": FlapVenueChart,
};
