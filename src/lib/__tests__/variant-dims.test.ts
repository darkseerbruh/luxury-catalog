import { describe, expect, it } from "vitest";
import type { StyleVariantOption } from "@/lib/queries";
import { DIMS, distinct, impliedBy, resolveTarget, visibleDims } from "@/lib/variant-dims";

const blank: Omit<StyleVariantOption, "variantId"> = {
  sizeLabel: null,
  sizeCategory: null,
  exteriorColorway: null,
  hardwareColor: null,
  exteriorMaterial: null,
  trimMaterial: null,
  hardwareType: null,
  strapType: null,
  strapAttachmentType: null,
  interiorColor: null,
  interiorMaterial: null,
  stitchingColor: null,
  constructionMethod: null,
  rigidity: null,
};

function v(variantId: number, fields: Partial<StyleVariantOption>): StyleVariantOption {
  return { ...blank, variantId, ...fields };
}

// The real Neverfull shape (style 218): canvas name is the colourway, the
// material and trim strings follow the canvas 1:1, two size-only stub rows.
const neverfull = [
  v(217, { sizeLabel: "PM", exteriorColorway: "Monogram", exteriorMaterial: "coated canvas (Monogram)", trimMaterial: "Vachetta (natural cowhide)", hardwareColor: "gold-tone / brass" }),
  v(218, { sizeLabel: "MM", exteriorColorway: "Monogram", exteriorMaterial: "coated canvas (Monogram)", trimMaterial: "Vachetta (natural cowhide)", hardwareColor: "gold-tone / brass" }),
  v(219, { sizeLabel: "GM", exteriorColorway: "Monogram", exteriorMaterial: "coated canvas (Monogram)", trimMaterial: "Vachetta (natural cowhide)", hardwareColor: "gold-tone / brass" }),
  v(220, { sizeLabel: "MM", exteriorColorway: "Damier Ebene", exteriorMaterial: "coated canvas (Damier Ebene)", trimMaterial: "smooth dark brown leather", hardwareColor: "gold-tone / brass", interiorColor: "red (classic)" }),
  v(221, { sizeLabel: "MM", exteriorColorway: "Damier Azur", exteriorMaterial: "coated canvas (Damier Azur)", trimMaterial: "Vachetta (natural cowhide)", hardwareColor: "gold-tone / brass" }),
  v(868, { sizeLabel: "MM" }),
  v(920, { sizeLabel: "BB" }),
];

const dim = (key: string) => {
  const d = DIMS.find((d) => d.key === key);
  if (!d) throw new Error(`no dim ${key}`);
  return d;
};

describe("distinct", () => {
  it("dedupes preserving order and skips null/empty", () => {
    expect(distinct(neverfull, dim("size"))).toEqual(["PM", "MM", "GM", "BB"]);
    expect(distinct(neverfull, dim("interiorColor"))).toEqual(["red (classic)"]);
  });
});

describe("impliedBy", () => {
  it("hides a detail that follows 1:1 from an earlier axis", () => {
    expect(impliedBy(neverfull, dim("color"), dim("material"))).toBe(true);
    expect(impliedBy(neverfull, dim("color"), dim("trim"))).toBe(true);
  });

  it("keeps independent axes", () => {
    // MM comes in three canvases: size does not imply colour.
    expect(impliedBy(neverfull, dim("size"), dim("color"))).toBe(false);
  });

  it("a value outside the shown axis's coverage is not implied", () => {
    const vs = [
      v(1, { exteriorColorway: "Black", trimMaterial: "leather" }),
      v(2, { exteriorColorway: null, trimMaterial: "canvas" }),
      v(3, { exteriorColorway: "Beige", trimMaterial: "leather" }),
    ];
    expect(impliedBy(vs, dim("color"), dim("trim"))).toBe(false);
  });
});

describe("visibleDims", () => {
  it("shows exactly the axes a shopper can meaningfully pick on the Neverfull", () => {
    const shown = visibleDims(neverfull).map((d) => d.dim.key);
    // Material and trim follow the canvas; hardware and interior don't vary
    // (≥2 rule); everything else is null.
    expect(shown).toEqual(["size", "color"]);
  });

  it("shows material when it varies independently of colour", () => {
    const chanel = [
      v(1, { sizeLabel: "Medium", exteriorColorway: "black", exteriorMaterial: "Caviar Leather" }),
      v(2, { sizeLabel: "Medium", exteriorColorway: "black", exteriorMaterial: "Lambskin" }),
      v(3, { sizeLabel: "Medium", exteriorColorway: "beige", exteriorMaterial: "Caviar Leather" }),
    ];
    expect(visibleDims(chanel).map((d) => d.dim.key)).toEqual(["color", "material"]);
  });

  it("hides everything for single-value dimensions", () => {
    expect(visibleDims([v(1, { sizeLabel: "MM" }), v(2, { sizeLabel: "MM" })])).toEqual([]);
  });

  it("sorts purely numeric sizes ascending, keeps named sizes in catalogue order", () => {
    const birkin = [
      v(1, { sizeLabel: "30" }),
      v(2, { sizeLabel: "35" }),
      v(3, { sizeLabel: "25" }),
      v(4, { sizeLabel: "40" }),
    ];
    expect(visibleDims(birkin)[0].values).toEqual(["25", "30", "35", "40"]);
    // Named sizes are not alphabetized (PM before MM is correct for LV).
    expect(visibleDims(neverfull)[0].values).toEqual(["PM", "MM", "GM", "BB"]);
  });

  it("never offers the ingest catch-all 'Standard' beside real sizes", () => {
    const kelly = [
      v(1, { sizeLabel: "28" }),
      v(2, { sizeLabel: "25" }),
      v(3, { sizeLabel: "Standard" }),
    ];
    expect(visibleDims(kelly)[0].values).toEqual(["25", "28"]);
    // Mixed numeric + named: numerics ascending, named after.
    const kellyWithMini = [...kelly, v(4, { sizeLabel: "Mini" })];
    expect(visibleDims(kellyWithMini)[0].values).toEqual(["25", "28", "Mini"]);
    // A style captured only as Standard has nothing to pick: no size axis.
    expect(visibleDims([v(1, { sizeLabel: "Standard" }), v(2, { sizeLabel: "Standard" })])).toEqual([]);
  });
});

describe("resolveTarget", () => {
  it("keeps the other dimensions fixed when switching one", () => {
    const current = neverfull[0]; // PM Monogram
    // Switching size to MM should stay Monogram (218), not jump canvas.
    expect(resolveTarget(neverfull, current, dim("size"), "MM")).toBe(218);
    // Switching colour to Damier Azur from MM Monogram keeps MM (221).
    expect(resolveTarget(neverfull, neverfull[1], dim("color"), "Damier Azur")).toBe(221);
  });

  it("returns null when no variant carries the value", () => {
    expect(resolveTarget(neverfull, neverfull[0], dim("size"), "XXL")).toBeNull();
  });
});
