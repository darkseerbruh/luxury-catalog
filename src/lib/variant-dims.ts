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

export const DIMS: Dim[] = [
  { key: "size", label: "Size", get: (v) => v.sizeLabel },
  { key: "color", label: "Colour", get: (v) => v.exteriorColorway },
  { key: "material", label: "Material", get: (v) => v.exteriorMaterial },
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
    // Numeric sizes (Birkin 25/30/35/40, Reissue 224-227) read in ascending
    // order, ahead of named ones (Kelly 25/28/32/35 then Mini); fully named
    // sets keep catalogue order (PM/MM/GM), which no sort could infer.
    if (dim.key === "size" && values.some((v) => /^\d+(\.\d+)?$/.test(v))) {
      const nums = values.filter((v) => /^\d+(\.\d+)?$/.test(v)).sort((a, b) => Number(a) - Number(b));
      values = [...nums, ...values.filter((v) => !/^\d+(\.\d+)?$/.test(v))];
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
