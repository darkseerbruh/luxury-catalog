/**
 * Coach authentication schematic diagram (the post→article hero).
 *
 * Original schematic line art, NOT a photo and not a reproduction of the Coach
 * logo or trademark canvas pattern, per docs/authentication-standard.md §3 and the
 * image rule in docs/preferences.md. Every marker traces to the cited research in
 * docs/research-drafts/coach-authentication-guide-draft.md. Confidence governs what
 * we publish and how we word it; no visible reliability badge (owner preference).
 *
 * Two layouts share one set of marker text so copy can never drift:
 *  - desktop (md+): a central bag with leader lines out to each finding.
 *  - mobile: each finding stacked as a tile carrying its own small bag with the
 *    referenced part highlighted (no leader lines needed).
 * Every genuine/red-flag pair carries a check and an X, never color alone.
 */

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#e3c785";
const LINE = "#7d7259";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";

const MARKERS = {
  creed: {
    name: "Creed patch",
    where: "inside",
    body: "The leather tag sewn inside. Lettering pressed into the leather, not flat ink. The serial sits stamped in its center.",
  },
  stitching: {
    name: "Stitching",
    where: "at the seams",
    body: "Even and straight, with steady spacing. Crooked, overlapping, or loose threads are the worry.",
  },
  canvas: {
    name: "Signature canvas",
    where: "on the front",
    body: "Coach's coated canvas printed with the repeating C pattern, instead of plain leather. On the front it looks balanced and centered, with crisp print. It will not line up along the side and bottom seams, and that is fine.",
  },
  materials: {
    name: "Materials and feel",
    where: "the leather",
    body: "Hard to judge from a photo. In your hands it tells you more. Real glove-tanned leather feels soft and substantial, with natural grain you can see: small pores, light creases, slight variation. It smells like leather, and older bags soften and gain a patina. Fakes feel stiff and plastic and can smell chemical. Some newer bags use coated or thinner leather, so stiffness alone is not proof.",
  },
  zipper: {
    name: "The zipper",
    where: "at the top",
    body: "The brand stamped on the zipper proves nothing. Coach used many makers, and fakes use the same ones, like YKK, a common zipper brand. Check the bag, not the zipper.",
  },
} as const;

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

function Pair({ marker }: { marker: keyof typeof MARKERS }) {
  // The good/bad illustration pair for a marker (shared by both layouts).
  const good = (m: keyof typeof MARKERS) => {
    if (m === "creed")
      return <svg viewBox="0 0 80 14" width="100%"><path d="M3 5 L22 5 Q25 5 27 11 Q29 5 32 5 L50 5 Q53 5 55 11 Q57 5 60 5 L77 5" fill="none" stroke={FG} strokeWidth="1.3" /></svg>;
    if (m === "stitching")
      return <svg viewBox="0 0 80 10" width="100%"><line x1="4" y1="5" x2="76" y2="5" stroke={FG} strokeWidth="1.4" strokeDasharray="6 4" /></svg>;
    if (m === "canvas")
      return <svg viewBox="0 0 80 16" width="100%"><g fill={MUTED}><rect x="28" y="5" width="5" height="5" transform="rotate(45 30.5 7.5)" /><rect x="38" y="5" width="5" height="5" transform="rotate(45 40.5 7.5)" /><rect x="48" y="5" width="5" height="5" transform="rotate(45 50.5 7.5)" /></g></svg>;
    return <svg viewBox="0 0 140 16" width="100%"><g fill={MUTED}><circle cx="12" cy="6" r="1" /><circle cx="34" cy="10" r="1.2" /><circle cx="56" cy="5" r="1" /><circle cx="78" cy="11" r="1.3" /><circle cx="100" cy="7" r="1" /><circle cx="122" cy="10" r="1.2" /><circle cx="24" cy="12" r="0.9" /><circle cx="66" cy="12" r="0.9" /><circle cx="110" cy="12" r="0.9" /></g></svg>;
  };
  const bad = (m: keyof typeof MARKERS) => {
    if (m === "creed")
      return <svg viewBox="0 0 80 14" width="100%"><line x1="3" y1="11" x2="77" y2="11" stroke={LINE} strokeWidth="1.3" /><rect x="20" y="6" width="7" height="3" fill={BAD} /><rect x="40" y="6" width="7" height="3" fill={BAD} /><rect x="58" y="6" width="7" height="3" fill={BAD} /></svg>;
    if (m === "stitching")
      return <svg viewBox="0 0 80 10" width="100%"><path d="M4 4 L18 7 L32 4 L46 8 L60 4 L74 7" fill="none" stroke={LINE} strokeWidth="1.4" strokeDasharray="5 4" /></svg>;
    if (m === "canvas")
      return <svg viewBox="0 0 80 16" width="100%"><g fill={LINE}><rect x="8" y="5" width="5" height="5" transform="rotate(45 10.5 7.5)" /><rect x="18" y="5" width="5" height="5" transform="rotate(45 20.5 7.5)" /><rect x="28" y="5" width="5" height="5" transform="rotate(45 30.5 7.5)" /></g></svg>;
    return <svg viewBox="0 0 140 16" width="100%"><line x1="6" y1="6" x2="134" y2="6" stroke={LINE} strokeWidth="1" /><line x1="6" y1="11" x2="134" y2="11" stroke={LINE} strokeWidth="1" /></svg>;
  };
  const labels: Record<keyof typeof MARKERS, [string, string]> = {
    creed: ["pressed in", "on top"],
    stitching: ["even", "crooked"],
    canvas: ["centered", "off-center"],
    materials: ["natural grain", "flat, uniform"],
    zipper: ["", ""],
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1, border: "1px solid #3a4a32", borderRadius: 6, background: "#161a12", padding: 6 }}>
        <div style={{ fontSize: 10, color: GOOD, marginBottom: 4, display: "flex", gap: 3, alignItems: "center" }}><CheckMark />{labels[marker][0]}</div>
        {good(marker)}
      </div>
      <div style={{ flex: 1, border: "1px solid #4a322a", borderRadius: 6, background: "#1a1310", padding: 6 }}>
        <div style={{ fontSize: 10, color: BAD, marginBottom: 4, display: "flex", gap: 3, alignItems: "center" }}><XMark />{labels[marker][1]}</div>
        {bad(marker)}
      </div>
    </div>
  );
}

function LocatorBag({ marker }: { marker: keyof typeof MARKERS }) {
  // A small bag with the referenced part highlighted in gold (mobile tiles).
  return (
    <svg viewBox="0 0 56 64" width="44" role="img" aria-hidden>
      <path d="M20 24 Q20 11 28 11 Q36 11 36 24" fill="none" stroke={marker === "materials" ? GOLD : LINE} strokeWidth="1.5" />
      <path d="M13 24 L43 24 L40 56 Q40 59 37 59 L19 59 Q16 59 16 56 Z" fill="none" stroke={marker === "materials" ? GOLD : LINE} strokeWidth={marker === "materials" ? 1.8 : 1.5} />
      {marker === "creed" && (<><circle cx="28" cy="41" r="11" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.5" /><rect x="23" y="37" width="10" height="8" rx="1" fill="#2a230f" stroke={GOLD} strokeWidth="1.6" /></>)}
      {marker === "stitching" && <path d="M14 26 L17 55" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />}
      {marker === "canvas" && <g fill={GOLD}><rect x="23" y="36" width="5" height="5" transform="rotate(45 25.5 38.5)" /><rect x="30" y="36" width="5" height="5" transform="rotate(45 32.5 38.5)" /><rect x="26.5" y="43" width="5" height="5" transform="rotate(45 29 45.5)" /></g>}
      {marker === "materials" && <g fill={GOLD}><circle cx="24" cy="38" r="0.9" /><circle cx="32" cy="42" r="0.9" /><circle cx="28" cy="48" r="0.9" /></g>}
      {marker === "zipper" && <><line x1="14" y1="24" x2="42" y2="24" stroke={GOLD} strokeWidth="2.4" /><line x1="28" y1="24" x2="28" y2="30" stroke={GOLD} strokeWidth="1.4" /><circle cx="28" cy="31" r="1.6" fill="none" stroke={GOLD} strokeWidth="1.2" /></>}
    </svg>
  );
}

function Tile({ marker }: { marker: keyof typeof MARKERS }) {
  const m = MARKERS[marker];
  return (
    <div style={{ border: "1px solid #322c22", borderRadius: 10, padding: 11, background: "#1a1712" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 7 }}>
        <LocatorBag marker={marker} />
        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: FG }}>{m.name}</div>
            <div style={{ fontSize: 10, color: "#8c8472", textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.where}</div>
          </div>
          {marker === "zipper" && <span style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>myth</span>}
        </div>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: MUTED, marginBottom: marker === "zipper" ? 0 : 9 }}>{m.body}</div>
      {marker !== "zipper" && <Pair marker={marker} />}
    </div>
  );
}

export function CoachAuthDiagram() {
  const order: (keyof typeof MARKERS)[] = ["creed", "stitching", "canvas", "materials", "zipper"];
  return (
    <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label="Coach authentication markers, illustrated">
      <div style={{ border: "1px solid #322c22", borderRadius: 14, padding: 18, background: "#14120c" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>Coach, the markers worth checking</div>
        <div style={{ fontSize: 13, color: "#c9a24c", marginBottom: 12 }}>A wrong marker is a red flag. A right marker is never proof.</div>

        {/* Mobile + narrow: stacked tiles, each self-locating. */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {order.map((k) => <Tile key={k} marker={k} />)}
        </div>

        {/* Desktop: tiles around a central bag. (Leader-line ring degrades to this
            grid when narrower; the per-tile locators carry the "where".) */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr 150px 1fr", gap: 14, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Tile marker="creed" />
            <Tile marker="stitching" />
          </div>
          <svg viewBox="0 0 150 170" width="100%" role="img" aria-hidden>
            <g fill="none" stroke={FG} strokeWidth="2" strokeLinejoin="round">
              <path d="M48 60 Q48 34 70 34 Q92 34 92 60" />
              <path d="M92 60 Q92 34 114 34 Q136 34 136 60" />
              <path d="M34 60 L150 60 L140 152 Q140 160 132 160 L52 160 Q44 160 44 152 Z" transform="translate(-12,0)" />
            </g>
            <line x1="34" y1="60" x2="130" y2="60" stroke={MUTED} strokeWidth="1.3" strokeDasharray="4 3" />
            <g fill="#c9a24c"><rect x="68" y="98" width="7" height="7" transform="rotate(45 71.5 101.5)" /><rect x="88" y="98" width="7" height="7" transform="rotate(45 91.5 101.5)" /><rect x="78" y="118" width="7" height="7" transform="rotate(45 81.5 121.5)" /></g>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Tile marker="canvas" />
            <Tile marker="zipper" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Tile marker="materials" />
          </div>
        </div>

        <div style={{ background: "#1c1708", border: "1px solid #4a3f1f", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" />
          </svg>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#cdbf9e" }}>These are markers to check, not a verdict. A good fake passes visual checks. Before you buy something costly, or sell or insure it, have a professional examine it in hand.</div>
        </div>
      </div>
      <figcaption className="sr-only">Original schematic illustration of Coach authentication markers. Markers to check, not a verdict.</figcaption>
    </figure>
  );
}
