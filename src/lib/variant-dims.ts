import type { StyleVariantOption } from "@/lib/queries";

/**
 * Dimension logic for the bag page's Amazon-style variant selector.
 *
 * Owner rule (2026-07-02): every captured detail that changes between a
 * style's variants is its own selectable dimension — not just
 * size/colour/hardware. Ordered by how shoppers pick; `visibleDims` keeps
 * pages clean (a dimension only renders when it actually varies AND isn't
 * already implied by an earlier one).
 */
export type Dim = { key: string; label: string; get: (v: StyleVariantOption) => string | null };

/** Collector-facing material label: prefer a parenthetical line name, else drop a trailing
 *  " Leather"/" Canvas". "coated canvas (Monogram)" → "Monogram"; "Caviar Leather" → "Caviar". */
export function cleanMaterialLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const paren = raw.match(/\(([^)]+)\)\s*$/);
  if (paren) return paren[1].trim();
  return raw.replace(/\s+(leather|canvas)$/i, "").trim();
}

export const DIMS: Dim[] = [
  { key: "size", label: "Size", get: (v) => v.sizeLabel },
  { key: "color", label: "Colour", get: (v) => v.exteriorColorway },
  // Clean the material chip label: a parenthetical line wins ("coated canvas (Monogram)" →
  // "Monogram"), else trim a trailing " Leather"/" Canvas" ("Caviar Leather" → "Caviar"), so
  // chips read as the collector term. The cleaned string is the match key too.
  { key: "material", label: "Material", get: (v) => cleanMaterialLabel(v.exteriorMaterial) },
  { key: "trim", label: "Trim", get: (v) => v.trimMaterial },
  { key: "hardware", label: "Hardware", get: (v) => v.hardwareColor },
  { key: "hardwareType", label: "Fittings", get: (v) => v.hardwareType },
  { key: "strap", label: "Strap", get: (v) => v.strapType },
  { key: "strapAttachment", label: "Strap attachment", get: (v) => v.strapAttachmentType },
  { key: "interiorColor", label: "Interior colour", get: (v) => v.interiorColor },
  { key: "interiorMaterial", label: "Lining", get: (v) => v.interiorMaterial },
  { key: "stitching", label: "Stitching", get: (v) => v.stitchingColor },
  { key: "construction", label: "Construction", get: (v) => v.constructionMethod },
  { key: "rigidity", label: "Structure", get: (v) => v.rigidity },
];

/** Distinct, order-preserving values for a dimension. */
export function distinct(variants: StyleVariantOption[], dim: Dim): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of variants) {
    const val = dim.get(v);
    if (val && !seen.has(val)) {
      seen.add(val);
      out.push(val);
    }
  }
  return out;
}

/**
 * True when `candidate` is fully implied by `shown`: every variant's candidate
 * value follows from its shown value (e.g. Neverfull lining colour follows from
 * the canvas). Such a dimension adds no picking power — selecting it could only
 * re-select what an earlier chip row already selects — so it stays a spec, not
 * a selector. A candidate value on a variant where `shown` is null is NOT
 * implied (it varies outside the shown dimension's coverage).
 */
export function impliedBy(
  variants: StyleVariantOption[],
  shown: Dim,
  candidate: Dim,
): boolean {
  const map = new Map<string, string>();
  for (const v of variants) {
    const cv = candidate.get(v);
    if (cv == null || cv === "") continue;
    const sv = shown.get(v);
    if (sv == null || sv === "") return false;
    const prev = map.get(sv);
    if (prev !== undefined && prev !== cv) return false;
    map.set(sv, cv);
  }
  return true;
}

/** Physical size order for NAMED sizes so chips read smallest→largest (owner 2026-07-11:
 *  "Small first, not alphabetical / insertion order"). A label's rank is the smallest rank
 *  of any token it contains, so compounds resolve right ("Jumbo (Large)" → jumbo/large tier).
 *  Unknown named sizes sort last, keeping their original order. */
const SIZE_RANK: Record<string, number> = {
  micro: 0, nano: 1, mini: 2, bb: 3, pm: 4, small: 5,
  medium: 6, "m/l": 6, mm: 6,
  large: 7, jumbo: 7, gm: 7, // Chanel's "Large" is the resale "Jumbo" — same tier
  maxi: 8, xl: 9, travel: 9,
};
function namedSizeRank(v: string): number {
  const low = v.toLowerCase();
  let r = Infinity;
  for (const tok in SIZE_RANK) if (low.includes(tok)) r = Math.min(r, SIZE_RANK[tok]);
  return r;
}

/** Colour chips read neutrals→brights, roughly matching a house's permanent palette
 *  (Black/White/Beige/Navy/Red) before the seasonal colours (owner 2026-07-11 size-order
 *  precedent). Unknown colours sort last, keeping their order. */
const COLOR_RANK = ["black", "white", "beige", "brown", "grey", "gray", "navy", "red", "blue", "green", "pink", "purple", "orange", "yellow", "metallic", "multicolor"];
function colourRank(v: string): number {
  const i = COLOR_RANK.indexOf(v.toLowerCase().trim());
  return i < 0 ? Infinity : i;
}

/** The dimensions worth rendering: vary (≥2 values), not implied by an earlier one. */
export function visibleDims(
  variants: StyleVariantOption[],
): { dim: Dim; values: string[] }[] {
  const varying = DIMS.map((dim) => {
    let values = distinct(variants, dim);
    // "Standard" is the ingest catch-all for size-not-stated captures
    // (promote-safe.ts et al), NOT a house size — never offer it as a pick
    // beside real sizes. Its variant keeps its /bag/[id] page and price rows.
    if (dim.key === "size" && values.length > 1) {
      values = values.filter((v) => v !== "Standard");
    }
    // Sizes read smallest→largest: numeric first (Birkin 25/30/35/40, Reissue 224-227),
    // then NAMED by physical rank (Small, Medium, Jumbo, Maxi), unknowns last in place.
    if (dim.key === "size" && values.length > 1) {
      const isNum = (v: string) => /^\d+(\.\d+)?$/.test(v);
      const nums = values.filter(isNum).sort((a, b) => Number(a) - Number(b));
      const named = values
        .filter((v) => !isNum(v))
        .map((v, i) => ({ v, i, r: namedSizeRank(v) }))
        .sort((a, b) => a.r - b.r || a.i - b.i)
        .map((x) => x.v);
      values = [...nums, ...named];
    }
    // Colour reads neutrals→brights (permanent palette first), unknowns last in place.
    if (dim.key === "color" && values.length > 1) {
      values = values
        .map((v, i) => ({ v, i, r: colourRank(v) }))
        .sort((a, b) => a.r - b.r || a.i - b.i)
        .map((x) => x.v);
    }
    return { dim, values };
  }).filter((d) => d.values.length >= 2);
  const out: typeof varying = [];
  for (const d of varying) {
    if (!out.some((s) => impliedBy(variants, s.dim, d.dim))) out.push(d);
  }
  return out;
}

/**
 * Faceted availability (owner 2026-07-11): a value is selectable only if a real variant
 * exists for it given the choices ALREADY made in the dimensions ranked ABOVE it (size →
 * colour → material → …). So picking Maxi greys out any colour/material never recorded in
 * Maxi; the top dimension (size) always stays fully selectable, so you never dead-end.
 * Directional (only prior dims constrain) matches the owner's example and avoids the sparse-
 * data trap of graying out the primary axis.
 *
 * CRITICAL (owner 2026-07-11): feed this the PRODUCTION record (what the house made, per the
 * archivist), NOT our listing-derived variants. "No listing" ≠ "never made", so greying a
 * value must trace to production evidence, never to a gap in our comps. A produced-but-
 * unlisted combo stays selectable (its page just says we don't have a photo/price yet).
 * Not yet wired into the selector for that reason.
 */
export function isCombinationAvailable(
  variants: StyleVariantOption[],
  current: StyleVariantOption,
  dim: Dim,
  value: string,
  shownDims: { dim: Dim }[],
): boolean {
  const idx = shownDims.findIndex((d) => d.dim.key === dim.key);
  const priors = idx <= 0 ? [] : shownDims.slice(0, idx).map((d) => d.dim);
  return variants.some(
    (v) =>
      dim.get(v) === value &&
      priors.every((d) => {
        const cur = d.get(current);
        return cur == null || d.get(v) === cur;
      }),
  );
}

/**
 * Best variant to land on when the user picks `value` for `dim`: keep as many of
 * the *other* current dimensions as possible. Returns null if nothing matches.
 */
export function resolveTarget(
  variants: StyleVariantOption[],
  current: StyleVariantOption,
  dim: Dim,
  value: string,
): number | null {
  const others = DIMS.filter((d) => d.key !== dim.key);
  let best: StyleVariantOption | null = null;
  let bestScore = -1;
  for (const v of variants) {
    if (dim.get(v) !== value) continue;
    let score = 0;
    for (const d of others) if (d.get(v) != null && d.get(v) === d.get(current)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best?.variantId ?? null;
}
