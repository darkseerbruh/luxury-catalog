/**
 * Chanel authentication schematic diagram (the post→article hero).
 *
 * Original schematic line art, NOT a photo and not a reproduction of the Chanel
 * double-C monogram or any trademarked trade dress, per docs/authentication-standard.md
 * §3 and the image rule in docs/preferences.md. The clasp is drawn as an abstract
 * interlocking-halves schematic (gestures at "the two halves interlock precisely"),
 * never the literal CC logo. Every marker traces to the cited research in
 * docs/research-drafts/chanel-authentication-guide-draft.md.
 *
 * Stacked-tile layout (works at every width): each marker is a tile with a small
 * schematic, a check/X pair (never color alone), the scan text, and a Read-more anchor.
 */

import type { ComponentType } from "react";

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#e3c785";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";

const MARKERS = {
  hologram: {
    name: "Hologram or microchip",
    where: "inside the flap",
    body: "Pre-2021 bags carry a numbered hologram sticker; 2021 and later use an embedded microchip. A missing sticker on a recent bag is normal, not a red flag.",
    anchor: "hologram-or-microchip",
  },
  clasp: {
    name: "The clasp interlock",
    where: "the front turn-lock",
    body: "The two halves of the clasp should interlock cleanly and evenly, one over the other top and bottom. Loose, off-center, or rough casting is the warning sign.",
    anchor: "the-clasp-interlock",
  },
  quilt: {
    name: "Quilt continuity",
    where: "across the seams",
    body: "The diamond pattern should line up across seams and over the flap. A pattern that jumps or breaks at the seam is a tell. Good fakes now match this, so it is necessary, not sufficient.",
    anchor: "quilt-continuity",
  },
  stitch: {
    name: "Stitch run",
    where: "each quilt diamond",
    body: "The stitching runs high and even along each diamond. Low, uneven, or loose stitching is the warning sign. The exact count varies by model and leather, so read it as even and consistent, not a number to count to.",
    anchor: "stitch-run",
  },
} as const;

type MarkerKey = keyof typeof MARKERS;

function CheckMark() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke={GOOD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 7.5l3.2 3.2L12 3.5" />
    </svg>
  );
}
function XMark() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke={BAD} strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  );
}

/** Brand-neutral schematic per marker: a "genuine" sketch and the "red-flag" sketch. */
function Sketch({ marker }: { marker: MarkerKey }) {
  if (marker === "hologram")
    return (
      <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden>
        <rect x="6" y="10" width="40" height="20" rx="2" fill="none" stroke={FG} strokeWidth="1.2" />
        <path d="M12 20h28M12 16h20M12 24h24" stroke={MUTED} strokeWidth="1" />
        <text x="26" y="38" fill={MUTED} fontSize="7" textAnchor="middle">sticker (pre-2021)</text>
        <rect x="72" y="12" width="26" height="16" rx="2" fill="none" stroke={FG} strokeWidth="1.2" />
        <path d="M78 12v-3M86 12v-3M92 12v-3M78 28v3M86 28v3M92 28v3M72 18h-3M72 24h-3M98 18h3M98 24h3" stroke={GOLD} strokeWidth="1" />
        <text x="85" y="38" fill={MUTED} fontSize="7" textAnchor="middle">chip (2021+)</text>
      </svg>
    );
  if (marker === "clasp")
    return (
      <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden>
        <g transform="translate(20,4)">
          <path d="M16 4a12 12 0 1 0 0 24" fill="none" stroke={FG} strokeWidth="1.6" />
          <path d="M16 28a12 12 0 1 0 0-24" fill="none" stroke={GOLD} strokeWidth="1.6" />
        </g>
        <g transform="translate(70,16)"><CheckMarkInline /></g>
        <text x="44" y="38" fill={MUTED} fontSize="7" textAnchor="middle">halves interlock, even</text>
      </svg>
    );
  if (marker === "quilt")
    return (
      <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden>
        <g stroke={FG} strokeWidth="1" fill="none">
          <path d="M2 20l10-10 10 10-10 10zM22 20l10-10 10 10-10 10zM42 20l10-10 10 10-10 10z" />
        </g>
        <line x1="56" y1="6" x2="56" y2="34" stroke={MUTED} strokeWidth="0.8" strokeDasharray="2 2" />
        <g stroke={BAD} strokeWidth="1" fill="none">
          <path d="M62 24l10-10 10 10-10 10zM82 16l10-10 10 10-10 10z" />
        </g>
        <text x="30" y="39" fill={GOOD} fontSize="7" textAnchor="middle">aligned</text>
        <text x="86" y="39" fill={BAD} fontSize="7" textAnchor="middle">broken</text>
      </svg>
    );
  // stitch
  return (
    <svg viewBox="0 0 120 40" width="100%" height="40" aria-hidden>
      <path d="M8 30 L28 8 L48 30" fill="none" stroke={FG} strokeWidth="1.2" />
      <g stroke={GOOD} strokeWidth="1.4" strokeLinecap="round">
        <path d="M11 27l2-2M16 22l2-2M21 17l2-2M26 12l2-2M33 12l2 2M38 17l2 2M43 22l2 2M48 27l-2-2" transform="translate(-1,1)" />
      </g>
      <path d="M72 30 L92 8 L112 30" fill="none" stroke={FG} strokeWidth="1.2" />
      <g stroke={BAD} strokeWidth="1.4" strokeLinecap="round">
        <path d="M78 24l3-3M90 12l4 3M104 24l-4-3" />
      </g>
      <text x="28" y="39" fill={GOOD} fontSize="7" textAnchor="middle">even</text>
      <text x="92" y="39" fill={BAD} fontSize="7" textAnchor="middle">sparse</text>
    </svg>
  );
}

function CheckMarkInline() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke={GOOD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8.5l3 3 7-8" />
    </svg>
  );
}

function Tile({ marker }: { marker: MarkerKey }) {
  const m = MARKERS[marker];
  return (
    <div style={{ border: "1px solid #322c22", borderRadius: 10, padding: 14, background: "#1a1712" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 16, color: FG }}>{m.name}</span>
        <span style={{ fontSize: 11, color: MUTED }}>{m.where}</span>
      </div>
      <div style={{ margin: "10px 0" }}><Sketch marker={marker} /></div>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: "#cdbf9e", margin: 0 }}>{m.body}</p>
      <a href={`#${m.anchor}`} style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: GOLD }}>
        Read more
      </a>
    </div>
  );
}

export function ChanelAuthDiagram() {
  return (
    <figure style={{ margin: "1.5rem 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }} className="sm:[grid-template-columns:1fr_1fr]">
        {(Object.keys(MARKERS) as MarkerKey[]).map((k) => (
          <Tile key={k} marker={k} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, padding: 12, border: "1px solid #322c22", borderRadius: 10, background: "#15120e" }}>
        <CheckMark />
        <XMark />
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#cdbf9e" }}>
          These are markers to check, not a verdict. A good fake passes visual checks, and an authenticity card never proves a bag. Before you buy something costly, or sell or insure it, have a professional examine it in hand.
        </div>
      </div>
      <figcaption className="sr-only">
        Original schematic illustration of Chanel authentication markers. Markers to check, not a verdict.
      </figcaption>
    </figure>
  );
}

/** Registry consumed by the post Body renderer: a body line `[diagram: <id>]`
 * renders the matching component. */
export const chanelDiagramRegistry: Record<string, ComponentType> = {
  "chanel-authentication": ChanelAuthDiagram,
};
