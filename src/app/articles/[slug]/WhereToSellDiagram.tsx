import type { ComponentType } from "react";

/**
 * "Where to sell" decision diagram for article #1 (the seller-lever piece).
 *
 * Original schematic, NOT a photo. Deliberately carries NO fee percentages: the
 * owner is cautious about publishing perishable third-party fee figures, so this
 * shows the evergreen TRADEOFF (how much you keep vs how much work you do), not
 * volatile numbers. Each channel TYPE is positioned on two axes; the trend is the
 * point: the more of the work you take on, the more of the sale you keep. Buyout
 * is the instant-but-least corner. Read with the article, which says to check each
 * platform's current terms before selling.
 */

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const LINE = "#7d7259";
const BORDER = "#322c22";

type Point = { x: number; y: number; label: string; sub: string; anchor: "start" | "middle" | "end" };

// Plot area: x 48..330 (work, low to high), y 60..210 (keep, more at top).
const POINTS: Point[] = [
  { x: 78, y: 196, label: "Instant buyout", sub: "least, but paid today", anchor: "start" },
  { x: 150, y: 150, label: "Consignment", sub: "they do the work", anchor: "middle" },
  { x: 232, y: 110, label: "Authenticated marketplace", sub: "they vouch, you ship", anchor: "middle" },
  { x: 312, y: 74, label: "Sell it yourself", sub: "most, all on you", anchor: "end" },
];

export function WhereToSellDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Where to sell a bag, illustrated as a tradeoff">
      <div style={{ maxWidth: 560, margin: "0 auto", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>What you keep versus what you do</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12 }}>
          The more of the selling you take on yourself, the more of the sale you keep. Buyout is the exception: the least money, but cash today.
        </div>

        <svg viewBox="0 0 360 248" preserveAspectRatio="xMidYMid meet" style={{ display: "block", width: "100%", height: "auto" }} role="img"
          aria-label="A tradeoff chart. The vertical axis is how much of the sale you keep, low at the bottom to high at the top. The horizontal axis is how much work you do, none on the left to all of it on the right. Four selling routes sit along a rising line: Instant buyout keeps the least with no work, consignment is next, then an authenticated marketplace, then selling it yourself keeps the most for the most work.">
          {/* axes */}
          <line x1="40" y1="30" x2="40" y2="222" stroke={LINE} strokeWidth="1" />
          <line x1="40" y1="222" x2="344" y2="222" stroke={LINE} strokeWidth="1" />

          {/* axis labels */}
          <text x="14" y="126" fontSize="10.5" fill={MUTED} textAnchor="middle" transform="rotate(-90 14 126)">
            What you keep
          </text>
          <text x="192" y="242" fontSize="10.5" fill={MUTED} textAnchor="middle">
            How much work you do
          </text>

          {/* trend line through the four routes */}
          <path d="M78 196 L150 150 L232 110 L312 74" fill="none" stroke={GOLD} strokeWidth="1.4" strokeDasharray="2 3" opacity="0.6" />

          {/* the four routes */}
          {POINTS.map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r="5" fill={GOLD} stroke="#14120c" strokeWidth="1.5" />
              <text x={p.x} y={p.y - 11} fontSize="11" fill={FG} textAnchor={p.anchor} style={{ fontWeight: 500 }}>
                {p.label}
              </text>
              <text x={p.x} y={p.y + 18} fontSize="9.5" fill={GOLDSOFT} textAnchor={p.anchor}>
                {p.sub}
              </text>
            </g>
          ))}
        </svg>

        <div style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>
          Illustrative, not exact figures. Every route takes a cut, and the size of that cut changes over time, so check each platform&rsquo;s current seller terms before you sell.
        </div>
      </div>
      <figcaption className="sr-only">
        A tradeoff diagram for selling a handbag: Routes that take more of the work off your hands (instant buyout, then consignment) leave you with less of the sale, while routes where you do more (an authenticated marketplace, then selling it yourself) leave you with more. No fee figures are shown because they change over time.
      </figcaption>
    </figure>
  );
}

export const whereToSellDiagramRegistry: Record<string, ComponentType> = {
  "where-to-sell-tradeoff": WhereToSellDiagram,
};
