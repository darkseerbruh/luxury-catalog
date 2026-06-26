/**
 * Louis Vuitton authentication schematic for article #4.
 *
 * Original schematic, NOT a photo and NOT a reproduction of the LV monogram, Damier
 * pattern, or logo (those are trademarks), per docs/authentication-standard.md §3 and
 * the image rule in docs/preferences.md. Every marker traces to the cited research in
 * docs/research-drafts/lv-authentication-guide-draft.md. Markers to check, not a
 * verdict; no visible confidence badge (owner preference). Good/red-flag pairs carry a
 * check and an X, never color alone.
 */
import type { ComponentType } from "react";

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#e3c785";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";
const BORDER = "#322c22";

type Kind = "good-bad" | "info" | "flag";
const MARKERS: {
  name: string;
  where: string;
  body: string;
  kind: Kind;
  good?: string;
  bad?: string;
}[] = [
  {
    name: "The heat stamp",
    where: "inside, on a leather tab",
    body: "The pressed stamp reads LOUIS VUITTON, a small registered-trademark R, and made in a country. On genuine bags the letters are deep and even, the O in Vuitton is round not oval, the two T's nearly touch, and the small R has space around it. Counterfeiters copy these, so a clean stamp is reassuring, not proof.",
    kind: "good-bad",
    good: "deep, even, round O",
    bad: "shallow, oval O, fused R",
  },
  {
    name: "Date code or microchip",
    where: "hidden inside",
    body: "Bags made before about 2021 carry an embossed date code: A factory and a date, never a serial number. Newer bags hide an NFC microchip instead, which only Louis Vuitton can read. A date code is not proof, since fakes copy them, which is exactly why the brand switched.",
    kind: "info",
  },
  {
    name: "Hardware",
    where: "zippers, clasps, rivets",
    body: "Real hardware is solid brass and feels noticeably heavy, with crisp, sharp engravings. Light or hollow metal, and shallow or smudged engraving, are warning signs.",
    kind: "good-bad",
    good: "heavy, crisp engraving",
    bad: "light, shallow stamp",
  },
  {
    name: "Stitching",
    where: "seams and tabs",
    body: "Even, mustard-yellow waxed thread with a high, regular stitch count. Sparse, crooked, or thin stitching with visible gaps is a red flag.",
    kind: "good-bad",
    good: "even, dense, mustard",
    bad: "sparse, uneven",
  },
  {
    name: "Vachetta leather",
    where: "trim and handles",
    body: "The pale untreated leather darkens to honey then brown with age and handling. A bag sold as old or vintage with bright, flawless, pale trim is worth a second look.",
    kind: "good-bad",
    good: "even, aged patina",
    bad: "fake, painted-on tan",
  },
  {
    name: "An authenticity card",
    where: "the myth",
    body: "Louis Vuitton does not include an authenticity card with its bags. A bag that arrives with one is more suspicious, not less.",
    kind: "flag",
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
      {m.kind === "flag" && (
        <div style={{ marginTop: 2, fontSize: 10.5, color: BAD, display: "flex", gap: 4, alignItems: "center" }}>
          <XMark />a card is a red flag, not a seal
        </div>
      )}
      {m.kind === "info" && (
        <div style={{ marginTop: 7, fontSize: 10.5, color: MUTED, display: "flex", gap: 4, alignItems: "center" }}>
          <InfoMark />neither the code nor the chip proves it is real
        </div>
      )}
    </div>
  );
}

export function LVAuthDiagram() {
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Louis Vuitton authentication markers, illustrated">
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>Louis Vuitton, the markers worth checking</div>
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
            These are markers to check, not a verdict. A good fake passes a visual check, and the microchip cannot be read by you. Before a costly purchase, or to sell or insure, have a professional authenticator examine it in hand.
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 10 }}>
          Illustrative guide, not a real bag. Sourced from authentication services and reseller guides (Fashionphile, Real Authentication, Bagaholic, and others).
        </div>
      </div>
      <figcaption className="sr-only">
        Original schematic of Louis Vuitton authentication markers: heat stamp, date code or microchip, hardware, stitching, vachetta leather, and the authenticity-card myth. Markers to check, not a verdict.
      </figcaption>
    </figure>
  );
}

export const lvAuthDiagramRegistry: Record<string, ComponentType> = {
  "lv-authentication": LVAuthDiagram,
};
