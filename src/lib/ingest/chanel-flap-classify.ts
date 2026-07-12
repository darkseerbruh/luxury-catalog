/**
 * Chanel flap classifier — routes a reseller listing to the right MODEL so look-alikes never
 * get lumped into the Classic Flap (owner 2026-07-12: "listings being wrong is not acceptable").
 * Decodes the per-reseller title conventions in `docs/research-drafts/chanel-flap-reseller-decode.md`.
 *
 * Cleanest discriminator: the Classic Flap uses size WORDS (Small/Medium/Jumbo/Maxi); the 2.55
 * Reissue uses NUMBERS (224-228). "Turn-lock" alone is not diagnostic; only TLC/VC write
 * "Mademoiselle" (= Reissue). Pure + unit-tested; feed it a Chanel listing's title (+ desc).
 */

export type ChanelFlapModel = "Boy" | "Coco Handle" | "2.55 Reissue" | "Classic Flap" | "seasonal flap";

/**
 * Classify a Chanel listing's flap MODEL from its title (and optional description), or null when
 * the text names no flap at all. Apply only to Chanel listings.
 */
export function classifyChanelFlap(title: string | null | undefined, desc?: string | null): ChanelFlapModel | null {
  const hay = `${title ?? ""} ${desc ?? ""}`.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
  if (!hay) return null;

  // 1. Boy — distinct lock/line.
  if (/\bboy\b/.test(hay)) return "Boy";

  // 2. Coco Handle — top handle + rounded flap (2015+). "Timeless/Classique Top Handle" (VC) too.
  if (/coco handle/.test(hay) || (/top handle/.test(hay) && /flap|classique|timeless/.test(hay))) return "Coco Handle";

  // 3. 2.55 Reissue — the word "reissue"/"2.55", a bare reissue size code (224-228), or an explicit
  //    "Mademoiselle" lock (TLC/VC). The numeric code beats the word "Classic" when both appear.
  if (/reissue|2\.?55|\b2 55\b/.test(hay) || /\b22[4-8]\b/.test(hay) || /mademoiselle/.test(hay)) return "2.55 Reissue";

  // 4. Classic Flap 11.12 — "classic" + "flap", the "double flap" construction, "11.12", or VC's
  //    "Timeless/Classique" model taxon.
  if (
    (/\bclassic\b/.test(hay) && /flap/.test(hay)) ||
    /double flap/.test(hay) ||
    /\b11 ?12\b/.test(hay) ||
    /timeless ?classique|classique|timeless/.test(hay)
  ) {
    return "Classic Flap";
  }

  // 5. Some other flap — a seasonal/unresolved flap, not one of the named lines.
  if (/flap/.test(hay)) return "seasonal flap";

  return null;
}

/**
 * Given a listing's text and the style name it's CURRENTLY attached to, return the model it should
 * be (per the classifier) when that disagrees, else null. Only fires when the classifier is
 * confident AND the current style is a Chanel flap line, so it never second-guesses non-flap styles.
 */
const FLAP_LINE_STYLES = ["classic flap", "2.55 reissue", "coco handle", "boy"];
export function flapMislabel(
  title: string | null | undefined,
  desc: string | null | undefined,
  currentStyleName: string | null | undefined,
): ChanelFlapModel | null {
  const cur = (currentStyleName ?? "").toLowerCase().trim();
  if (!FLAP_LINE_STYLES.some((s) => cur.includes(s))) return null; // only audit flap-line styles
  const model = classifyChanelFlap(title, desc);
  if (!model || model === "seasonal flap") return null; // only act on a confident, named model
  // Map the model to how the style name reads, then compare.
  const target = model.toLowerCase();
  if (cur.includes(target) || (target === "classic flap" && cur.includes("classic"))) return null;
  return model;
}
