/**
 * Parse LABELLED dimension rows from a reseller listing into canonical axes.
 *
 * Why this exists and why the previous attempt failed: on 2026-07-26 we wrote 285
 * dimension rows parsed from bare "25 x 7 x 3.2" strings and had to revert all of
 * them, because the axis ORDER was unknowable (a mini bag came out 63.5cm tall,
 * since the first number was a strap length). The fix is not a better guesser. It is
 * refusing to parse anything that is not labelled.
 *
 * THE MAPPING TRAP, verified on a Speedy 25 against Louis Vuitton's published spec:
 *
 *   Fashionphile "Width"  ==  TheRealReal "Depth"   ==  our DEPTH (front to back)
 *   Fashionphile "Base length" / "Length"  ==  TheRealReal "Width"  ==  our WIDTH
 *
 * Taking Fashionphile's "Width" at face value would write a depth into every width
 * in the catalogue. The label alone is not enough; the label has to be interpreted
 * per source.
 *
 * CONVENTION MATTERS TOO. Fashionphile measures length AT THE BASE, which is not the
 * same as an overall span. The archivist pull found Rebag publishing a Classic Flap
 * Small at 20.3cm base against 23cm overall, a 2.7cm gap. So every parse carries the
 * convention it was measured under, and we never average across conventions.
 */

/** Canonical axes. Width is the horizontal span, depth is front to back. */
export interface CanonicalDimensions {
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  strapDropCm: number | null;
  /** How the span was measured. Never average across different conventions. */
  convention: "base" | "overall" | "unknown";
}

export type DimensionSource = "fashionphile" | "therealreal";

const IN_TO_CM = 2.54;

/** A handbag axis outside this range is a parse error or a source-side typo. */
const SANE = { min: 1, max: 120 };

function toCm(value: number, unit: "in" | "cm"): number {
  return +(unit === "in" ? value * IN_TO_CM : value).toFixed(1);
}

/**
 * Read a "10 in" / "8.25\"" / "26 cm" value. Returns null when the unit is absent,
 * because an unlabelled unit is the other half of how the last attempt went wrong.
 */
export function parseMeasure(raw: string): { value: number; unit: "in" | "cm" } | null {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(in\b|inch|"|''|cm\b)/i);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = /cm/i.test(m[2]) ? "cm" : "in";
  return { value, unit };
}

/**
 * Map a source's own label to a canonical axis.
 *
 * Returns null for labels we do not understand, which is deliberate: an unmapped
 * label must drop out rather than land on a guessed axis.
 */
export function mapLabel(
  source: DimensionSource,
  label: string,
): { axis: "width" | "height" | "depth" | "strapDrop"; convention: "base" | "overall" } | null {
  const l = label.trim().toLowerCase();

  if (source === "fashionphile") {
    // FP's first axis is the horizontal span, stated at the base.
    if (l === "base length" || l === "length") return { axis: "width", convention: "base" };
    if (l === "height") return { axis: "height", convention: "base" };
    // THE TRAP: FP "Width" is front-to-back, i.e. our depth.
    if (l === "width" || l === "depth") return { axis: "depth", convention: "base" };
    if (l === "drop" || l === "strap drop" || l === "handle drop") {
      return { axis: "strapDrop", convention: "base" };
    }
    return null;
  }

  // TheRealReal states axes conventionally and also ships a machine `type` key.
  if (l === "width" || l === "length") return { axis: "width", convention: "overall" };
  if (l === "height") return { axis: "height", convention: "overall" };
  if (l === "depth") return { axis: "depth", convention: "overall" };
  if (l.includes("strap drop") || l === "handle drop" || l === "drop") {
    return { axis: "strapDrop", convention: "overall" };
  }
  return null;
}

export interface LabelledRow {
  label: string;
  value: string;
}

/**
 * Turn a source's labelled rows into canonical centimetres.
 *
 * Returns null unless at least height and width resolved. A lone depth is not worth
 * storing, and a partial parse usually means the layout changed under us.
 */
export function parseLabelledDimensions(
  source: DimensionSource,
  rows: LabelledRow[],
): CanonicalDimensions | null {
  const out: CanonicalDimensions = {
    widthCm: null,
    heightCm: null,
    depthCm: null,
    strapDropCm: null,
    convention: "unknown",
  };

  // Fashionphile ships two rows both labelled "Drop" on some pages (handle and
  // shoulder). Without a machine type we cannot tell them apart, so we keep the
  // SMALLER, which is the handle drop, and never silently average the two.
  const drops: number[] = [];

  for (const row of rows) {
    const mapped = mapLabel(source, row.label);
    if (!mapped) continue;
    const measure = parseMeasure(row.value);
    if (!measure) continue;

    const cm = toCm(measure.value, measure.unit);
    if (cm < SANE.min || cm > SANE.max) continue;

    out.convention = mapped.convention;
    if (mapped.axis === "strapDrop") drops.push(cm);
    else if (mapped.axis === "width") out.widthCm = cm;
    else if (mapped.axis === "height") out.heightCm = cm;
    else out.depthCm = cm;
  }

  if (drops.length) out.strapDropCm = Math.min(...drops);
  if (out.widthCm === null || out.heightCm === null) return null;
  return out;
}

/**
 * Agree a dimension across several listings of the same bag.
 *
 * Needed because the same bag genuinely measures differently listing to listing: the
 * probe found a Speedy 30 at 8.25in on one site and 10.75in on another, one slumped
 * and one stood up. And sources publish real garbage (a bucket bag listed at 0.25in
 * deep, confirmed in the source's own JSON rather than an extraction artefact).
 *
 * So: require agreement, take the median, and refuse when the spread is too wide to
 * call. Same discipline that is already protecting `closure_type`.
 */
export function agreeDimension(
  values: number[],
  opts: { minAgreeing?: number; tolerance?: number } = {},
): number | null {
  const minAgreeing = opts.minAgreeing ?? 2;
  const tolerance = opts.tolerance ?? 0.2; // 20% spread around the median
  const clean = values.filter((v) => Number.isFinite(v) && v >= SANE.min && v <= SANE.max);
  if (clean.length < minAgreeing) return null;

  const sorted = [...clean].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  if (median <= 0) return null;

  // Step 1: drop outliers relative to the median. This is what removes a source-side
  // typo (a bucket bag published as 0.25in deep) without discarding the good rows.
  const agreeing = clean.filter((v) => Math.abs(v - median) / median <= tolerance);
  if (agreeing.length < minAgreeing) return null;

  const s = [...agreeing].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const result = +(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2).toFixed(1);

  // Step 2: the survivors must also agree with EACH OTHER, not merely with the
  // median. With two values the median sits exactly between them, so a pair 30%
  // apart would both pass step 1 and we would publish their midpoint as though it
  // were a measurement. That is the slumped-versus-stood-up case the probe found on
  // a Speedy 30 (8.25in against 10.75in), and it is not a measurement, it is two
  // different photographs.
  if (result <= 0) return null;
  const spread = (s[s.length - 1] - s[0]) / result;
  if (spread > tolerance) return null;

  return result;
}

/**
 * Pull the labelled rows out of a Fashionphile product page.
 *
 * The figures live in a Shopify metafield inside the "Size" accordion, as plain
 * `Label: value` lines separated by `<br />`:
 *
 *   <span class="metafield-multi_line_text_field">Length: 8 in<br />
 *   Width: 3.5 in<br />Height: 6 in<br />Drop: 3.5 in<br />Drop: 21.5 in</span>
 *
 * SCOPED ON PURPOSE. The page also ships storefront JavaScript containing the bare
 * words `Width`, `Height`, `Depth` and `Drop` (things like `Width >= 768`), so a
 * document-wide search for a label matches minified script and produces nonsense.
 * We read only inside the metafield spans.
 *
 * The Shopify `/products/<handle>.js` endpoint does NOT carry these, so the page
 * itself has to be fetched. That is free for us: grade-condition-fashionphile.ts
 * already downloads this exact HTML daily for condition grading.
 */
export function extractFashionphileRows(html: string): LabelledRow[] {
  const rows: LabelledRow[] = [];
  const spans = html.matchAll(
    /<span class="metafield-multi_line_text_field">([\s\S]*?)<\/span>/gi,
  );
  for (const span of spans) {
    const text = span[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Za-z][A-Za-z ]{2,20}?)\s*:\s*(.+?)\s*$/);
      if (!m) continue;
      // Only keep lines whose value actually looks like a measurement, so a
      // "Material: Lambskin" row in the same metafield never reaches the mapper.
      if (!/\d/.test(m[2])) continue;
      rows.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  return rows;
}
