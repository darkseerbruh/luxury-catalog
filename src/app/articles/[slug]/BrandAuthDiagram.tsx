/**
 * Per-house authentication schematics (Hermès, Dior, Prada, Goyard, Saint Laurent,
 * Bottega Veneta, Celine, Balenciaga), data-driven from one component so the new
 * houses share the exact LV/Chanel pattern without eight near-identical files.
 *
 * Original schematic, NOT a photo and NOT a reproduction of any house logo, monogram,
 * or trade dress (those are trademarks), per docs/authentication-standard.md §3 and the
 * image rule in docs/preferences.md. Every marker traces to the sourced brief in
 * docs/research-drafts/authentication-markers-brief.md (checked 2026-06-30). Markers to
 * check, not a verdict; no confidence badge. Good/red-flag pairs carry a check and an X,
 * never color alone.
 */
import type { ComponentType } from "react";

const FG = "#f3ede0";
const MUTED = "#a89c87";
const GOLD = "#e3c785";
const GOOD = "#9bbf6a";
const BAD = "#cf7d59";
const BORDER = "#322c22";

type Kind = "good-bad" | "info" | "flag";
interface Marker {
  name: string;
  where: string;
  body: string;
  kind: Kind;
  good?: string;
  bad?: string;
  note?: string; // for info/flag tiles
}
interface BrandAuth {
  house: string;
  subhead: string;
  markers: Marker[];
  sources: string;
}

const BRANDS: Record<string, BrandAuth> = {
  "hermes-authentication": {
    house: "Hermès",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (Retyche and others) plus our own Hermès archive, checked June 2026. We do not publish exotic-symbol or date calls as verdicts.",
    markers: [
      { name: "The blind stamp", where: "under the front flap", kind: "good-bad",
        body: "A discreet letter plus a shape, pressed without ink and deliberately small and hard to find. A stamp that is large, inked, or sitting somewhere obvious is worth a closer look.",
        good: "tiny, inkless, hidden", bad: "large, inked, obvious" },
      { name: "The stamp shape, by era", where: "the date system", kind: "info",
        body: "The shape around the letter places the era: no shape before 1971, a circle from 1971 to 1996, a square from 1997 to 2014, then no shape again from late 2014. Hermès uses no serial number, so this is the on-bag record.",
        note: "the shape dates it, it does not authenticate it" },
      { name: "The craftsman mark", where: "near the blind stamp", kind: "flag",
        body: "One artisan builds and repairs the whole bag, and leaves a small separate maker's mark beside the blind stamp. Fakes often leave it off entirely.",
        note: "a missing artisan mark is a red flag" },
      { name: "Saddle stitching", where: "seams and handles", kind: "good-bad",
        body: "Hand saddle-stitch, sewn with two needles through each hole, gives a slightly raised, even, gently left-leaning line in waxed linen thread. Perfectly straight, uniform machine stitching points the other way.",
        good: "raised, slight diagonal", bad: "flat, machine-straight" },
      { name: "Hardware and zip", where: "clasp, pulls, plating", kind: "good-bad",
        body: "HERMÈS PARIS engraving is crisp and evenly spaced, plating should not wear to a different color underneath, and a real zip pull rests parallel to the zip rather than flopping to a right angle.",
        good: "crisp, even, parallel pull", bad: "smudged, peeling, floppy" },
      { name: "Lock and keys", where: "the padlock", kind: "info",
        body: "The padlock is cleanly engraved Hermès, and its number should match both keys. A few lock numbers turn up faked again and again.",
        note: "a matching lock is reassuring, not proof" },
    ],
  },
  "dior-authentication": {
    house: "Dior",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (Fashionica, codogirl and others), checked June 2026. We do not read the microchip ourselves.",
    markers: [
      { name: "Tag and serial, by era", where: "inside pockets and tabs", kind: "info",
        body: "Early-1990s pieces often have a woven label and no date code; the 1990s to 2010s added leather tabs, stampings, and serial stickers on cards; from 2019 many Lady Dior and Book Tote bags carry a microchip. Match the format to the age.",
        note: "a newer bag with no sticker can still be genuine" },
      { name: "Oblique canvas alignment", where: "across the seams", kind: "good-bad",
        body: "On the jacquard the D-I-O-R motif should line up cleanly across seams and curves with a sharp, even repeat. Fakes most often break at the seam, and on the Saddle's curved seam especially.",
        good: "aligned across seams", bad: "broken at the seam" },
      { name: "The D.I.O.R. charms", where: "on the Lady Dior", kind: "good-bad",
        body: "The letter charms are heavy and substantial with sharp, uniform engraving. Hollow, light charms are a warning sign, though the best fakes now add weight, so cross-check it against the rest.",
        good: "heavy, sharp engraving", bad: "hollow, soft engraving" },
      { name: "Cannage quilting", where: "the whole bag", kind: "good-bad",
        body: "The diamond quilting is deep and even in depth and tension across the entire bag. Shallow or uneven sections are worth scrutiny.",
        good: "deep, even tension", bad: "shallow, uneven" },
      { name: "Christian Dior heat stamp", where: "interior leather", kind: "good-bad",
        body: "A crisp serif stamp with consistent spacing, pressed into the leather rather than printed on the surface.",
        good: "pressed in, crisp serif", bad: "surface-printed, soft" },
      { name: "Country of origin", where: "interior label", kind: "flag",
        body: "Authentic Dior is made in France or Italy. A Made in China label is a definitive red flag.",
        note: "Made in China is a definitive red flag" },
    ],
  },
  "prada-authentication": {
    house: "Prada",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (Bag Religion, Fashionica and others), checked June 2026. The triangle is the most-copied element, so a clean plaque alone proves nothing.",
    markers: [
      { name: "The triangle plaque", where: "the front logo", kind: "good-bad",
        body: "The enamel triangle reads PRADA with MILANO, never Milan, and DAL 1913, all evenly spaced and legible.",
        good: "MILANO, even spacing", bad: "Milan, crowded text" },
      { name: "The R notch", where: "on the plaque", kind: "info",
        body: "The R on the plaque usually has a small notch or curl in the leg, but some genuine vintage pieces lack it, so read it as era context rather than a yes or no.",
        note: "some real vintage plaques have no notch" },
      { name: "Interior lining logo", where: "the woven jacquard", kind: "good-bad",
        body: "On the woven interior the PRADA R does not carry the plaque notch, the A does not overhang, the font is sans serif, and the word prints upside-down on alternating rows.",
        good: "alternating rows, sans serif", bad: "wrong font or rows" },
      { name: "The lining material", where: "inside", kind: "good-bad",
        body: "Authentic linings are embossed jacquard nylon or Nappa leather, not a cheap flat synthetic.",
        good: "jacquard nylon or Nappa", bad: "flat thin synthetic" },
      { name: "Angled topstitch", where: "seams and panels", kind: "good-bad",
        body: "Prada uses a neat, even, angled topstitch. Plain horizontal stitching, uneven holes, or thin thread are common tells.",
        good: "neat, even, angled", bad: "horizontal, uneven" },
      { name: "Hardware and QA tag", where: "fittings and pocket seam", kind: "info",
        body: "Hardware stays one consistent tone, Prada does not mix gold and silver on a bag, and zips come from Lampo, YKK, Riri, Opti, or Ipi. A small white QA tag is usually sewn into an interior pocket seam.",
        note: "cross-reference the QA number, do not trust it alone" },
    ],
  },
  "goyard-authentication": {
    house: "Goyard",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (Fashionica, Collectors Cage and others), checked June 2026. Goyard runs no public serial lookup, so the canvas and stamp are the read.",
    markers: [
      { name: "The chevron Y's", where: "the Goyardine print", kind: "good-bad",
        body: "On the hand-screened canvas the interlocking Y's meet, with the end-dots of each Y touching its neighbour. Visible gaps between the Y's are the fastest tell.",
        good: "Y end-dots touch", bad: "gaps between Y's" },
      { name: "Canvas feel and depth", where: "the body", kind: "good-bad",
        body: "Authentic Goyardine is coated linen with a slightly raised, textured hand and depth from layered color. A flat, plasticky, vinyl-like surface is a warning sign.",
        good: "raised, layered texture", bad: "flat, plasticky" },
      { name: "The heat stamp", where: "interior or trim", kind: "good-bad",
        body: "GOYARD, PARIS, MADE IN FRANCE pressed thin, even, and shallow, and easy to read. A stamp pressed too deep, too thick, or crowded is a tell.",
        good: "thin, shallow, even", bad: "deep, thick, crowded" },
      { name: "The weight", where: "the whole bag", kind: "good-bad",
        body: "A genuine Saint Louis is surprisingly light, because it is coated linen. A heavy, stiff tote suggests the vinyl or PVC counterfeiters tend to use.",
        good: "light in the hand", bad: "heavy and stiff" },
      { name: "Serial format", where: "by model", kind: "info",
        body: "Three letters and six digits in a thin, discreet sans serif, placed differently by model. The digits are one data point, not a date you can decode.",
        note: "there is no serial-to-date lookup" },
      { name: "The card myth", where: "what is included", kind: "flag",
        body: "Goyard issues no authenticity card at all. A seller offering one as proof is a red flag in itself.",
        note: "a card offered as proof is a red flag" },
    ],
  },
  "saint-laurent-authentication": {
    house: "Saint Laurent",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (Fashionica, Love that Bag and others), checked June 2026. The 2012 rebrand is a production-era distinction, not by itself a fake indicator.",
    markers: [
      { name: "The name matches the era", where: "interior stamp", kind: "info",
        body: "Bags before 2012 read Yves Saint Laurent, the 2012 rebrand onward reads Saint Laurent Paris, and recent bags read SAINT LAURENT. A name that contradicts the bag's age is the single biggest tell.",
        note: "a post-2012 bag stamped Yves Saint Laurent is a flag" },
      { name: "Cassandre hardware", where: "clasps and turn-locks", kind: "good-bad",
        body: "The interlocking YSL is crisp, deep, symmetrical, and centered. Blurry, over-rounded, or off-centre letters are a warning sign.",
        good: "crisp, deep, centered", bad: "blurry, off-centre" },
      { name: "Serial, embossed", where: "interior leather", kind: "good-bad",
        body: "Serials are pressed into the leather, not printed on the surface. A surface-printed or painted number is a flag, and there is no public lookup to decode it.",
        good: "embossed into leather", bad: "printed on the surface" },
      { name: "Loulou quilting", where: "the quilted face", kind: "good-bad",
        body: "The diamond-quilted leather has consistent depth, even alignment, and identical diamond sizes. Shallow or uneven quilting is a tell.",
        good: "even, identical diamonds", bad: "shallow, uneven" },
      { name: "Hardware and zip", where: "fittings", kind: "good-bad",
        body: "Brass-based hardware feels substantial, and zips come from Lampo, Riri, or Éclair with branded pulls. Hollow or rattling metal points the other way.",
        good: "substantial, branded zip", bad: "hollow, rattling" },
      { name: "Edge finishing", where: "leather edges", kind: "good-bad",
        body: "Clean, painted leather edges. Rough or fraying edges suggest inferior production.",
        good: "clean, painted edges", bad: "rough, fraying" },
    ],
  },
  "bottega-authentication": {
    house: "Bottega Veneta",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (Fashionica and others), checked June 2026. With no monogram, the weave and the leather carry the read.",
    markers: [
      { name: "Intrecciato, held by compression", where: "the woven leather", kind: "good-bad",
        body: "On a genuine bag the woven strips are pressed and held by compression, with no thread running along the edges of the weave. Visible stitching holding the strips is the single most common fake tell.",
        good: "no thread on the weave", bad: "thread holding strips" },
      { name: "Strip uniformity", where: "across corners", kind: "good-bad",
        body: "The strips are even in width and the weave lies flat across corners and seams. Bubbling, lifting, gaps, or a puffy look are warning signs.",
        good: "even width, flat drape", bad: "puffy, lifting, gaps" },
      { name: "The debossed stamp", where: "interior leather", kind: "good-bad",
        body: "BOTTEGA VENETA and MADE IN ITALY are delicately debossed into the leather and almost blend in. A sharp, printed-looking stamp is wrong, as is any loud external logo on a no-logo house.",
        good: "soft, blended deboss", bad: "sharp, printed look" },
      { name: "Leather hand and scent", where: "the body", kind: "good-bad",
        body: "Butter-soft calfskin or lambskin, supple with a slightly matte finish and a real leather scent. A plasticky shine, a board-stiff hand, or a chemical smell are flags.",
        good: "supple, matte, leather scent", bad: "stiff, shiny, chemical" },
      { name: "Serial, by era", where: "interior seam tag", kind: "info",
        body: "A small sewn-in tag carries an era-specific code, and pre-2001 vintage often has no serial at all, which is normal rather than a flag. Match the tag format to the age.",
        note: "a missing serial on vintage is normal" },
      { name: "Made in Italy", where: "interior", kind: "flag",
        body: "Bottega leather bags are made in Italy. Made in China on a leather bag is a strong fake indicator.",
        note: "Made in China on leather is a strong indicator" },
    ],
  },
  "celine-authentication": {
    house: "Celine",
    subhead: "A wrong marker is a red flag. A right marker is never proof.",
    sources: "Sourced from authentication services and reseller guides (TheRealReal and others), checked June 2026. The accent dates the era, it does not prove authenticity.",
    markers: [
      { name: "The accent over the E", where: "the brand stamp", kind: "info",
        body: "Philo-era stamps read CÉLINE with the accent; Hedi Slimane's 2018 rebrand dropped it to CELINE. So a 2010s Luggage or Box should carry the accent, though pieces made just after the 2018 change may not.",
        note: "the accent dates the era, it is not proof" },
      { name: "Date code and place", where: "by model", kind: "info",
        body: "Philo-era codes follow the LV-style alphanumeric format, placed consistently within a style. The format only dates the era and is copyable, so it is one data point.",
        note: "a date code never proves a bag real" },
      { name: "Stamp finish", where: "interior and exterior", kind: "good-bad",
        body: "The brand stamp is foil matched to the hardware color, or a blind deboss, in the correct sans serif and centered. An oversized logo, made to look obvious, is a fake tell.",
        good: "correct size, matched foil", bad: "oversized, mismatched" },
      { name: "Triomphe lettering", where: "the clasp", kind: "good-bad", note: "lower confidence, verify on close photos",
        body: "On the Triomphe the lettering, including the accent and the letterforms, is exact and evenly weighted. Counterfeiters routinely miss the proportions. This one is lower confidence, so verify it on close photos.",
        good: "exact, even weight", bad: "off proportions" },
      { name: "Stamp wording and place", where: "outside vs inside", kind: "good-bad",
        body: "The exterior stamp reads CELINE PARIS and the interior carries the Made in Italy mark. Wording or placement that is swapped or off is a flag.",
        good: "CELINE PARIS outside", bad: "swapped or misplaced" },
      { name: "Logo to hardware match", where: "stamp and fittings", kind: "good-bad",
        body: "The stamp foil should match the hardware tone, a gold stamp with gold hardware and so on.",
        good: "foil matches hardware", bad: "mismatched tones" },
    ],
  },
  "balenciaga-authentication": {
    house: "Balenciaga",
    subhead: "One of the hardest houses to authenticate, with an exception to almost every rule.",
    sources: "Sourced chiefly from the Love that Bag reseller guide, checked June 2026; the post-2017 letter codes and the 2014 zip change are single-source and should be re-confirmed. Every marker here has documented exceptions, so weigh them together.",
    markers: [
      { name: "Lampo zip engraving", where: "back of each zip head", kind: "good-bad",
        body: "On the City and First the moto zips carry the Lampo logo on the back of the zip head, embossed in italics and underlined with a small lightning bolt. From 2014 the Lampo mark was replaced with an uppercase B, so match it to the era.",
        good: "clean Lampo, by era", bad: "thick, clumsy mark" },
      { name: "Notched rivets", where: "strap and tassels", kind: "good-bad",
        body: "From 2005 the rivets are deeply notched, while earlier ones were rounded. Shallow, squarish, or half-moon notches are a common fake tell.",
        good: "deep, clean notch", bad: "shallow or squarish" },
      { name: "The bale shape", where: "the strap ends", kind: "good-bad",
        body: "The metal bale at the strap end has a rounded, organic shape tapering to a smooth flat end. Abrupt, coat-hanger angles are a tell.",
        good: "rounded, tapered", bad: "abrupt angles" },
      { name: "The tag letter code", where: "interior tag", kind: "info",
        body: "The interior tag uses a single letter for the season and year, and the alphabet has reset once, so the same letter can mean two seasons. The style number on the front of the tag should match the back.",
        note: "the letter alone cannot date a bag" },
      { name: "Tag wording, by era", where: "back of the leather tag", kind: "info",
        body: "The tag back moved to an uppercase MADE IN ITALY in 2011, added the season letter in 2012, and added FABRIQUÉ EN ITALIE in 2014. The wording should match the production era.",
        note: "pre-2012 tag-only bags are the hardest to place" },
    ],
  },
};

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

function Tile({ m }: { m: Marker }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, background: "#1a1712" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: FG }}>{m.name}</div>
        <div style={{ fontSize: 9.5, color: "#8c8472", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "right", flexShrink: 0 }}>{m.where}</div>
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
      {m.kind === "good-bad" && m.note && (
        <div style={{ marginTop: 7, fontSize: 10, color: MUTED, fontStyle: "italic", display: "flex", gap: 4, alignItems: "center" }}>
          <InfoMark />{m.note}
        </div>
      )}
      {m.kind === "flag" && (
        <div style={{ marginTop: 2, fontSize: 10.5, color: BAD, display: "flex", gap: 4, alignItems: "center" }}>
          <XMark />{m.note}
        </div>
      )}
      {m.kind === "info" && (
        <div style={{ marginTop: 7, fontSize: 10.5, color: MUTED, display: "flex", gap: 4, alignItems: "center" }}>
          <InfoMark />{m.note}
        </div>
      )}
    </div>
  );
}

function makeDiagram(key: string): ComponentType {
  const data = BRANDS[key];
  function BrandAuthDiagram() {
    return (
      <figure style={{ margin: "0.5rem 0 1rem", color: FG }} aria-label={`${data.house} authentication markers, illustrated`}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: "#14120c" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>{data.house}, the markers worth checking</div>
          <div style={{ fontSize: 13, color: "#c9a24c", marginBottom: 12 }}>{data.subhead}</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.markers.map((m) => (
              <Tile key={m.name} m={m} />
            ))}
          </div>

          <div style={{ background: "#1c1708", border: "1px solid #4a3f1f", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" />
            </svg>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#cdbf9e" }}>
              These are markers to check, not a verdict. A good fake passes a visual check, and no single marker confirms a bag. Before a costly purchase, or to sell or insure, have a professional authenticator examine it in hand.
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 10 }}>
            Illustrative guide, not a real bag. {data.sources}
          </div>
        </div>
        <figcaption className="sr-only">
          Original schematic of {data.house} authentication markers. Markers to check, not a verdict.
        </figcaption>
      </figure>
    );
  }
  BrandAuthDiagram.displayName = `BrandAuthDiagram(${key})`;
  return BrandAuthDiagram;
}

export const brandAuthDiagramRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.keys(BRANDS).map((key) => [key, makeDiagram(key)]),
);
