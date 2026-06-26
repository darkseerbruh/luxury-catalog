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

function Bag({ kind }: { kind: Kind }) {
  const id = kind;
  const lines: React.ReactNode[] = [];
  for (let x = -100; x <= 180; x += 15) {
    lines.push(<line key={`a${x}`} x1={x} y1={54} x2={x + 86} y2={140} stroke={QUILT} strokeWidth="1" />);
    lines.push(<line key={`b${x}`} x1={x} y1={140} x2={x + 86} y2={54} stroke={QUILT} strokeWidth="1" />);
  }
  const label =
    kind === "caviar"
      ? "Schematic of a quilted flap bag with a pebbled, grainy caviar surface and crisp, structured corners."
      : "Schematic of a quilted flap bag with a smooth lambskin surface, a soft sheen, and a small scuff at one corner.";
  return (
    <svg viewBox="0 0 180 158" width="100%" role="img" aria-label={label}>
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

function Side({ kind }: { kind: Kind }) {
  const t = TRAITS[kind];
  return (
    <div style={{ minWidth: 0, border: `1px solid ${BORDER}`, borderRadius: 12, background: "#1a1712", padding: 14 }}>
      <div style={{ maxWidth: 170, margin: "0 auto" }}>
        <Bag kind={kind} />
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: FG, marginTop: 6 }}>{t.name}</div>
      <div style={{ fontSize: 12, color: GOLDSOFT, marginBottom: 10 }}>{t.texture}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {t.chips.map((c) => (
          <div key={c} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>
            <span aria-hidden style={{ marginTop: 1, height: 5, width: 5, borderRadius: 999, background: GOLD, flexShrink: 0, alignSelf: "center" }} />
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <Side kind="lamb" />
          <Side kind="caviar" />
        </div>

        <div style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>
          Illustrative schematic, not a real bag. The textures show how each leather looks and behaves, traits that are common to caviar and lambskin.
        </div>
      </div>
      <figcaption className="sr-only">
        Two side-by-side schematics of the same quilted flap bag: lambskin rendered smooth with a soft sheen and a corner scuff, and caviar rendered with a pebbled grain and crisp structure, showing how the two leathers differ in surface, feel, and wear.
      </figcaption>
    </figure>
  );
}

export const leatherDiagramRegistry: Record<string, ComponentType> = {
  "caviar-vs-lambskin-leather": LeatherComparisonDiagram,
};
