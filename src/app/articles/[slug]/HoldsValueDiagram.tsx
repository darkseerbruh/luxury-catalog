import type { ComponentType } from "react";

/**
 * "What tends to hold value vs lose it" qualitative schematic for the honest-investment
 * piece. Deliberately NO numbers and NO appreciation/return claims (those are off-limits:
 * no reliable time series, no investment framing). General resale-market wisdom framed as
 * our take. Brand-neutral. Original SVG/CSS.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";
const BORDER = "#322c22";

const HOLDS = [
  "Classic shapes that stay in the lineup for years",
  "Neutral colors (black, beige, brown)",
  "Heritage houses with tightly managed production",
  "The full set: Box, dust bag, receipt",
  "Excellent, well-kept condition",
];
const LOSES = [
  "Trend-driven shapes and one-season silhouettes",
  "Loud seasonal colors and prints",
  "Heavy seasonal logos that date quickly",
  "Brands that flood the market with stock",
  "Visible wear, missing pieces, no paperwork",
];

function Mark({ good }: { good: boolean }) {
  return good ? (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke={GOOD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M2 7.5l3.2 3.2L12 3.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke={BAD} strokeWidth="2" strokeLinecap="round" aria-hidden style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  );
}

function Col({ title, items, accent, good }: { title: string; items: string[]; accent: string; good: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0, border: `1px solid ${BORDER}`, borderRadius: 12, background: "#1a1712", padding: 14 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: accent, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((t) => (
          <div key={t} style={{ display: "flex", gap: 8, fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
            <Mark good={good} />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HoldsValueDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="What tends to hold value versus lose it">
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>What tends to hold value, and what doesn&rsquo;t</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          General patterns, not a promise. No bag is a guaranteed return, and condition matters as much as the model.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Col title="Tends to hold up" items={HOLDS} accent={GOOD} good={true} />
          <Col title="Tends to fade" items={LOSES} accent={BAD} good={false} />
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>
          We do not publish appreciation or return figures. Any price is where the market sits today, an estimate, not a forecast or an appraisal.
        </div>
      </div>
      <figcaption className="sr-only">
        What tends to hold value (classic shapes, neutral colors, heritage houses, the full set, great condition) versus what tends to fade (trend shapes, loud colors, heavy seasonal logos, flooded brands, wear and missing pieces). General patterns, not a guaranteed return.
      </figcaption>
    </figure>
  );
}

export const holdsValueDiagramRegistry: Record<string, ComponentType> = {
  "holds-value": HoldsValueDiagram,
};
