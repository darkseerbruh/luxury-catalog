import type { ComponentType } from "react";

/**
 * Rent vs buy decision schematic. Qualitative (no specific subscription prices, per the
 * third-party-fee hedge in docs/preferences.md: teach the framework, tell readers to
 * check current pricing). Original SVG/CSS, brand-neutral.
 */
const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const GOOD = "#9bbf6a";
const BORDER = "#322c22";

const RENT = [
  "You chase trends or want variety",
  "An occasion bag you will carry a few times",
  "You want to try a bag before buying",
  "You would rather skip the resale hassle",
];
const BUY = [
  "You will carry it often, so cost-per-wear drops",
  "You want a classic that holds value",
  "You want to actually own it and can resell later",
  "You found it well-priced on resale",
];

function Check() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke={GOOD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M2 7.5l3.2 3.2L12 3.5" />
    </svg>
  );
}

function Col({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, border: `1px solid ${BORDER}`, borderRadius: 12, background: "#1a1712", padding: 14 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: accent, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((t) => (
          <div key={t} style={{ display: "flex", gap: 8, fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
            <Check />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RentVsBuyDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Rent versus buy, when each makes sense">
      <div style={{ maxWidth: 600, margin: "0 auto", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>Rent or buy: Which fits you</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          The deciding factor is how often you will actually carry it, not which looks cheaper up front.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Col title="Renting makes sense when" items={RENT} accent={GOLDSOFT} />
          <Col title="Buying makes sense when" items={BUY} accent={GOLD} />
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>
          A subscription is a flat cost whether you swap often or not, so it pays off only with real use. Pricing and what is actually in stock vary by service, so check current terms. General information, not financial advice.
        </div>
      </div>
      <figcaption className="sr-only">
        A rent-versus-buy guide: rent when you chase trends, need an occasion bag, want to try before buying, or want to skip reselling; buy when you will carry it often, want a value-holding classic, want to own it, or found it well-priced on resale.
      </figcaption>
    </figure>
  );
}

export const rentVsBuyDiagramRegistry: Record<string, ComponentType> = {
  "rent-vs-buy": RentVsBuyDiagram,
};
