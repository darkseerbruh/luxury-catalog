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

  it("sorts sizes smallest→largest: numeric ascending, named by physical rank", () => {
    const birkin = [
      v(1, { sizeLabel: "30" }),
      v(2, { sizeLabel: "35" }),
      v(3, { sizeLabel: "25" }),
      v(4, { sizeLabel: "40" }),
    ];
    expect(visibleDims(birkin)[0].values).toEqual(["25", "30", "35", "40"]);
    // Named LV sizes read smallest→largest: BB < PM < MM < GM (owner 2026-07-11).
    expect(visibleDims(neverfull)[0].values).toEqual(["BB", "PM", "MM", "GM"]);
  });

  it("orders Chanel flap sizes Small → Medium → Jumbo → Maxi, not insertion order", () => {
    const flap = [
      v(1, { sizeLabel: "Medium (M/L)" }),
      v(2, { sizeLabel: "Maxi" }),
      v(3, { sizeLabel: "Small" }),
      v(4, { sizeLabel: "Jumbo" }),
    ];
    expect(visibleDims(flap)[0].values).toEqual(["Small", "Medium (M/L)", "Jumbo", "Maxi"]);
  });

  it("never offers the ingest catch-all 'Standard' BY NAME — it surfaces as the Unknown chip", () => {
    const kelly = [
      v(1, { sizeLabel: "28" }),
      v(2, { sizeLabel: "25" }),
      v(3, { sizeLabel: "Standard" }),
    ];
    // Owner 2026-07-14: the size-unknown bucket is explicit, selectable state.
    expect(visibleDims(kelly)[0].values).toEqual(["25", "28", "\u0000unknown"]);
    // Mixed numeric + named: numerics ascending, named after, Unknown trailing.
    const kellyWithMini = [...kelly, v(4, { sizeLabel: "Mini" })];
    expect(visibleDims(kellyWithMini)[0].values).toEqual(["25", "28", "Mini", "\u0000unknown"]);
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

// ── The Unknown bucket (owner 2026-07-14) ────────────────────────────────────
// A null value must be reachable + visible as explicit "Unknown", never silent.
import { UNKNOWN_VALUE, dimValue } from "@/lib/variant-dims";

describe("unknown bucket", () => {
  const styleVars = [
    v(1, { sizeLabel: "35", exteriorColorway: "Black" }),
    v(2, { sizeLabel: "35", exteriorColorway: "Gold" }),
    v(3, { sizeLabel: "30", exteriorColorway: null }),
    v(4, { sizeLabel: "Standard", exteriorColorway: "Black" }),
  ];

  it("dimValue maps null and the Standard size bucket to UNKNOWN_VALUE", () => {
    expect(dimValue(dim("color"), styleVars[2])).toBe(UNKNOWN_VALUE);
    expect(dimValue(dim("size"), styleVars[3])).toBe(UNKNOWN_VALUE);
    expect(dimValue(dim("size"), styleVars[0])).toBe("35");
  });

  it("visibleDims appends a trailing Unknown chip when some variants lack the value", () => {
    const dims = visibleDims(styleVars);
    const colour = dims.find((d) => d.dim.key === "color");
    expect(colour?.values).toEqual(["Black", "Gold", UNKNOWN_VALUE]);
    const size = dims.find((d) => d.dim.key === "size");
    expect(size?.values).toEqual(["30", "35", UNKNOWN_VALUE]); // "Standard" folds into Unknown
  });

  it("never offers Unknown when every variant documents the value", () => {
    // Same size across both so the colour axis isn't implied away by size.
    const full = [
      v(1, { sizeLabel: "35", exteriorColorway: "Black" }),
      v(2, { sizeLabel: "35", exteriorColorway: "Gold" }),
    ];
    const colour = visibleDims(full).find((d) => d.dim.key === "color");
    expect(colour?.values).toEqual(["Black", "Gold"]);
  });

  it("hides a dimension that is ALL unknown (no picking power)", () => {
    const allNull = [
      v(1, { sizeLabel: "35", exteriorColorway: null }),
      v(2, { sizeLabel: "30", exteriorColorway: null }),
    ];
    expect(visibleDims(allNull).find((d) => d.dim.key === "color")).toBeUndefined();
  });

  it("resolveTarget lands on the not-yet-documented variant for UNKNOWN_VALUE", () => {
    expect(resolveTarget(styleVars, styleVars[0], dim("color"), UNKNOWN_VALUE)).toBe(3);
    expect(resolveTarget(styleVars, styleVars[0], dim("size"), UNKNOWN_VALUE)).toBe(4);
  });
});
