/**
 * Gucci GG Marmont authentication schematic.
 *
 * Original schematic, NOT a photo and NOT a reproduction of the Gucci Double-G logo,
 * the chevron pattern, or any trademark, per docs/authentication-standard.md §3 and the
 * image rule in docs/preferences.md. Markers trace to the cited research (Fashionphile
 * Academy, Real Authentication, LegitCheck, Bagaholic). Markers to check, not a verdict;
 * no confidence badge; good/red-flag pairs carry a check and an X, never color alone.
 */
import type { ComponentType } from "react";

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#e3c785";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";
const BORDER = "#322c22";

type Kind = "good-bad" | "info";
const MARKERS: { name: string; where: string; body: string; kind: Kind; good?: string; bad?: string }[] = [
  {
    name: "The Double-G clasp",
    where: "the front",
    body: "The interlocking double-G hardware is a matte, aged bronze, not bright or lacquered. The two letters sit snug against each other with no gap, and each stroke is thin at the tips and thicker in the middle, like a calligraphy pen. Too shiny, too saturated, or a visible gap where the letters meet are the common tells.",
    kind: "good-bad",
    good: "matte bronze, snug Gs",
    bad: "shiny, gap between Gs",
  },
  {
    name: "The interior tag",
    where: "inside",
    body: "A rectangular leather tab carries the Gucci name in its proper font, a small registered-trademark R, and lowercase made in Italy. The stamp is subtle and pressed evenly into the leather. Counterfeits tend to over-stamp it, so the letters look too deep, too thick, or have messy edges.",
    kind: "good-bad",
    good: "crisp, even, subtle",
    bad: "over-deep, messy edges",
  },
  {
    name: "The serial number",
    where: "on a leather patch inside",
    body: "Stamped on a patch, usually behind the interior tab. It runs 10 to 13 digits with no letters, often on two lines that do not align perfectly. A correct-looking number does not prove a bag is real, and a wrong one is a red flag.",
    kind: "info",
  },
  {
    name: "The heart on the back",
    where: "the back panel",
    body: "Many Marmonts have a quilted heart on the back. On genuine bags it sits low, around two-thirds of the way down, with a small tail and clean symmetric stitching. A heart that is centered, rounded off, or sloppily stitched is a warning sign.",
    kind: "good-bad",
    good: "low, small tail, even",
    bad: "centered, no tail",
  },
  {
    name: "The chevron quilting",
    where: "the body",
    body: "The matelassé chevron should be even and symmetric, with the points meeting cleanly down the center. Uneven spacing, wandering lines, or points that do not line up are the kind of shortcut a counterfeit takes.",
    kind: "good-bad",
    good: "even, symmetric points",
    bad: "uneven, wandering",
  },
];

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
function InfoMark() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke={MUTED} strokeWidth="1.3" aria-hidden>
      <circle cx="7" cy="7" r="6" /><line x1="7" y1="6.5" x2="7" y2="10" /><circle cx="7" cy="4" r="0.7" fill={MUTED} stroke="none" />
    </svg>
  );
}

function Tile({ m }: { m: (typeof MARKERS)[number] }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, background: "#1a1712" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: FG }}>{m.name}</div>
        <div style={{ fontSize: 9.5, color: "#8c8472", textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.where}</div>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: MUTED, marginBottom: m.kind === "good-bad" ? 9 : 0 }}>{m.body}</div>
      {m.kind === "good-bad" && (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, border: "1px solid #3a4a32", borderRadius: 6, background: "#161a12", padding: "5px 7px", fontSize: 10.5, color: GOOD, display: "flex", gap: 4, alignItems: "center" }}>
            <CheckMark />{m.good}
          </div>
          <div style={{ flex: 1, border: "1px solid #4a322a", borderRadius: 6, background: "#1a1310", padding: "5px 7px", fontSize: 10.5, color: BAD, display: "flex", gap: 4, alignItems: "center" }}>
            <XMark />{m.bad}
          </div>
        </div>
      )}
      {m.kind === "info" && (
        <div style={{ marginTop: 7, fontSize: 10.5, color: MUTED, display: "flex", gap: 4, alignItems: "center" }}>
          <InfoMark />a number alone never proves a bag is real
        </div>
      )}
    </div>
  );
}

export function GucciMarmontAuthDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Gucci GG Marmont authentication markers, illustrated">
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>The GG Marmont, markers worth checking</div>
        <div style={{ fontSize: 13, color: "#c9a24c", marginBottom: 12 }}>A wrong marker is a red flag. A right marker is never proof.</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {MARKERS.map((m) => (
            <Tile key={m.name} m={m} />
          ))}
        </div>

        <div style={{ background: "#1c1708", border: "1px solid #4a3f1f", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" />
          </svg>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#cdbf9e" }}>
            These are markers to check, not a verdict. A good fake passes a visual check. Before a costly purchase, or to sell or insure, have a professional authenticator examine the bag in hand.
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 10 }}>
          Illustrative guide, not a real bag. Sourced from authentication services and reseller guides (Fashionphile, Real Authentication, LegitCheck, Bagaholic).
        </div>
      </div>
      <figcaption className="sr-only">
        Original schematic of Gucci GG Marmont authentication markers: the Double-G clasp, the interior tag, the serial number, the heart on the back, and the chevron quilting. Markers to check, not a verdict.
      </figcaption>
    </figure>
  );
}

export const gucciMarmontAuthDiagramRegistry: Record<string, ComponentType> = {
  "gucci-marmont-authentication": GucciMarmontAuthDiagram,
};
