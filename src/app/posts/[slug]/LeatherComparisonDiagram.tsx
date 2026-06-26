/**
 * Caviar vs lambskin leather schematic for the comparison piece (#2).
 *
 * Original schematic line art, NOT a photo and NOT a reproduction of any brand's
 * logo, clasp, or trademarked quilting, per docs/authentication-standard.md §3 and
 * the image rule in docs/preferences.md. Both bags share one silhouette and one
 * leather color, so the only thing that changes is the hide: caviar reads pebbled
 * and structured, lambskin reads smooth, with a soft sheen and a corner scuff. The
 * traits shown (pebbled vs smooth, firm vs supple, scratch-resistant vs scuffs) are
 * general, well-established properties of the two leathers, not invented markers.
 *
 * The two bags are drawn inside ONE svg (one coordinate system), so they always
 * render at identical scale. Each half is 180 wide; caviar is offset by +180.
 */

import type { ComponentType } from "react";

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#c9a24c";
const GOLDSOFT = "#e3c785";
const LEATHER = "#2a2418";
const QUILT = "#574c30";
const BORDER = "#322c22";

type Kind = "caviar" | "lamb";

function BagGroup({ kind, dx }: { kind: Kind; dx: number }) {
  const id = kind;
  const lines: React.ReactNode[] = [];
  for (let x = -100; x <= 180; x += 15) {
    lines.push(<line key={`a${x}`} x1={x} y1={54} x2={x + 86} y2={140} stroke={QUILT} strokeWidth="1" />);
    lines.push(<line key={`b${x}`} x1={x} y1={140} x2={x + 86} y2={54} stroke={QUILT} strokeWidth="1" />);
  }
  return (
    <g transform={`translate(${dx},0)`}>
      <defs>
        <clipPath id={`body-${id}`}>
          <rect x="34" y="54" width="112" height="86" rx="8" />
        </clipPath>
        {kind === "caviar" && (
          <pattern id={`grain-${id}`} width="3.4" height="3.4" patternUnits="userSpaceOnUse">
            <circle cx="1.7" cy="1.7" r="0.6" fill={GOLDSOFT} opacity="0.5" />
            <circle cx="0" cy="0" r="0.6" fill={GOLDSOFT} opacity="0.5" />
            <circle cx="3.4" cy="3.4" r="0.6" fill={GOLDSOFT} opacity="0.5" />
          </pattern>
        )}
      </defs>

      {/* chain-and-leather strap, suggested with a dashed arc */}
      <path d="M48 56 Q90 10 132 56" fill="none" stroke={GOLDSOFT} strokeWidth="2.5" strokeDasharray="1.5 3.5" strokeLinecap="round" />

      {/* bag body */}
      <rect x="34" y="54" width="112" height="86" rx="8" fill={LEATHER} stroke={GOLDSOFT} strokeWidth="1.6" />

      {/* diamond quilting, clipped to the body */}
      <g clipPath={`url(#body-${id})`} opacity="0.85">{lines}</g>

      {/* the leather texture: pebbled grain for caviar, a soft sheen + scuff for lambskin */}
      {kind === "caviar" ? (
        <rect x="34" y="54" width="112" height="86" rx="8" fill={`url(#grain-${id})`} clipPath={`url(#body-${id})`} />
      ) : (
        <g clipPath={`url(#body-${id})`}>
          {/* a diagonal sheen streak, the way light catches smooth leather */}
          <rect x="56" y="12" width="26" height="172" transform="rotate(-26 90 97)" fill={FG} opacity="0.07" />
          <rect x="72" y="12" width="10" height="172" transform="rotate(-26 90 97)" fill={FG} opacity="0.13" />
          {/* a small scuff at the corner: lambskin marks sooner */}
          <path d="M40 132 q10 -7 20 -2" fill="none" stroke="#b6a986" strokeWidth="1.4" opacity="0.75" strokeLinecap="round" />
          <path d="M44 136 q8 -5 16 -1" fill="none" stroke="#b6a986" strokeWidth="1.1" opacity="0.5" strokeLinecap="round" />
        </g>
      )}

      {/* flap edge + neutral clasp (not a brand mark) */}
      <path d="M34 92 L146 92" stroke={GOLDSOFT} strokeWidth="1.2" opacity="0.8" />
      <rect x="82" y="86" width="16" height="12" rx="2.5" fill={LEATHER} stroke={GOLD} strokeWidth="1.6" />
      <rect x="86" y="90.5" width="8" height="3" rx="1.2" fill={GOLD} />
    </g>
  );
}

function TwoBags() {
  return (
    <svg
      viewBox="0 0 360 150"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", height: "auto" }}
      role="img"
      aria-label="Two side-by-side schematics of the same quilted flap bag at identical size: on the left, lambskin rendered smooth with a soft diagonal sheen and a small corner scuff; on the right, caviar rendered with a fine pebbled grain and crisp structure."
    >
      <BagGroup kind="lamb" dx={0} />
      <BagGroup kind="caviar" dx={180} />
    </svg>
  );
}

const TRAITS: Record<Kind, { name: string; texture: string; chips: string[] }> = {
  lamb: {
    name: "Lambskin",
    texture: "Smooth and glossy",
    chips: ["Soft, supple, drapes", "Delicate sheen", "Scuffs and scratches sooner"],
  },
  caviar: {
    name: "Caviar",
    texture: "Pebbled and grainy",
    chips: ["Firm, holds its shape", "Matte, textured grain", "Resists scratches, wears harder"],
  },
};

function Caption({ kind }: { kind: Kind }) {
  const t = TRAITS[kind];
  return (
    <div style={{ minWidth: 0, padding: "0 4px" }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: FG }}>{t.name}</div>
      <div style={{ fontSize: 12, color: GOLDSOFT, marginBottom: 10 }}>{t.texture}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {t.chips.map((c) => (
          <div key={c} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>
            <span aria-hidden style={{ height: 5, width: 5, borderRadius: 999, background: GOLD, flexShrink: 0 }} />
            <span>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeatherComparisonDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Caviar versus lambskin leather, illustrated">
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>Same bag, two hides</div>
        <div style={{ fontSize: 13, color: GOLD, marginBottom: 14 }}>One is pebbled and tough, the other smooth and delicate.</div>

        {/* Both bags live in one SVG so they always share a scale; the captions sit
            in a matching two-column grid directly beneath each bag. */}
        <TwoBags />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
          <Caption kind="lamb" />
          <Caption kind="caviar" />
        </div>

        <div style={{ fontSize: 11, color: MUTED, marginTop: 14 }}>
          Illustrative schematic, not a real bag. The textures show how each leather looks and behaves, traits that are common to caviar and lambskin.
        </div>
      </div>
      <figcaption className="sr-only">
        Two side-by-side schematics of the same quilted flap bag at identical size: lambskin rendered smooth with a soft sheen and a corner scuff, and caviar rendered with a pebbled grain and crisp structure, showing how the two leathers differ in surface, feel, and wear.
      </figcaption>
    </figure>
  );
}

export const leatherDiagramRegistry: Record<string, ComponentType> = {
  "caviar-vs-lambskin-leather": LeatherComparisonDiagram,
};
