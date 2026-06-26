import type { ComponentType } from "react";

/**
 * Resale red-flags checklist schematic (brand-neutral, general). Red flags carry an X,
 * smart moves a check, never color alone. Bound by docs/authentication-standard.md:
 * red flags to weigh, not a verdict; send costly bags to a pro. Original SVG/CSS.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#e3c785";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";
const BORDER = "#322c22";

const FLAGS = [
  "A price that is too good to be true",
  "Brags about an authenticity card for a brand that never issues one",
  "Only stock-style photos, or dodges your request for close-ups",
  "Vague or no return policy",
  "Pressure or urgency: someone else is about to buy it",
  "A private, off-platform sale with no authentication",
];
const MOVES = [
  "Buy where authentication is built in (eBay and Poshmark check items over $500; authenticating resellers verify everything)",
  "Ask for the specific shots: stamp or date code, hardware engraving, interior tag, stitching",
  "Check the markers against a brand guide",
  "For anything costly, send it to a professional authenticator",
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
          <div key={t} style={{ display: "flex", gap: 8, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
            <Mark good={good} />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResaleRedFlagsDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Resale listing red flags and smart moves">
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>Reading a resale listing</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Most problems show up in the listing before the bag ever ships. What to flag, and what to do instead.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Col title="Red flags" items={FLAGS} accent={BAD} good={false} />
          <Col title="Smart moves" items={MOVES} accent={GOOD} good={true} />
        </div>
        <div style={{ background: "#1c1708", border: "1px solid #4a3f1f", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" />
          </svg>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#cdbf9e" }}>
            These are red flags to weigh, not a verdict. A clean listing is not proof, and the safest check is a professional authenticator with the bag in hand.
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Resale listing red flags (a too-good price, an authenticity card from a brand that does not issue them, stock-only photos, no returns, pressure, off-platform sales) and smart moves (buy where authentication is built in, ask for specific photos, check the markers, send costly bags to a pro).
      </figcaption>
    </figure>
  );
}

export const resaleRedFlagsDiagramRegistry: Record<string, ComponentType> = {
  "resale-red-flags": ResaleRedFlagsDiagram,
};
