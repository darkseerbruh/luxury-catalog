import { describe, expect, it } from "vitest";
import {
  groupColourways,
  matchesModel,
  rankModels,
  orderMatches,
  type FinderIndexRow,
} from "../bag-finder";

function row(partial: Partial<FinderIndexRow> & { styleId: number; name: string }): FinderIndexRow {
  return {
    brand: "Chanel",
    colourways: [{ colourName: "Black", variantId: partial.styleId * 10, sizeLabel: null }],
    heroVariantId: partial.styleId * 10,
    hasImage: true,
    ...partial,
  };
}

describe("groupColourways", () => {
  it("collapses variants to distinct colourways", () => {
    const out = groupColourways([
      { variantId: 1, exteriorColorway: "Black", sizeLabel: "Small", hasImage: false },
      { variantId: 2, exteriorColorway: "Black", sizeLabel: "Medium", hasImage: false },
      { variantId: 3, exteriorColorway: "Red", sizeLabel: "Small", hasImage: false },
    ]);
    expect(out.map((c) => c.colourName)).toEqual(["Black", "Red"]);
  });

  it("prefers an image-bearing variant as the colourway representative", () => {
    const out = groupColourways([
      { variantId: 1, exteriorColorway: "Black", sizeLabel: null, hasImage: false },
      { variantId: 2, exteriorColorway: "Black", sizeLabel: null, hasImage: true },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].variantId).toBe(2);
  });

  it("is case-insensitive on colour name and keeps the first casing seen", () => {
    const out = groupColourways([
      { variantId: 1, exteriorColorway: "Beige Clair", sizeLabel: null, hasImage: false },
      { variantId: 2, exteriorColorway: "beige clair", sizeLabel: null, hasImage: false },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].colourName).toBe("Beige Clair");
  });

  it("buckets an unnamed colourway under Standard so a model is never colour-less", () => {
    const out = groupColourways([
      { variantId: 1, exteriorColorway: null, sizeLabel: null, hasImage: false },
      { variantId: 2, exteriorColorway: "  ", sizeLabel: null, hasImage: false },
    ]);
    expect(out).toEqual([{ colourName: "Standard", variantId: 1, sizeLabel: null }]);
  });
});

describe("matchesModel", () => {
  const lady = row({
    styleId: 2,
    name: "Lady Dior",
    brand: "Dior",
    colourways: [
      { colourName: "Latte", variantId: 21, sizeLabel: null },
      { colourName: "Sky blue", variantId: 22, sizeLabel: null },
    ],
  });

  it("returns everything for an empty query (populate on focus)", () => {
    expect(matchesModel("", lady)).toBe(true);
  });
  it("matches on model name", () => {
    expect(matchesModel("lady dior", lady)).toBe(true);
    expect(matchesModel("LADY", lady)).toBe(true);
  });
  it("matches on brand and on 'brand name'", () => {
    expect(matchesModel("dior", lady)).toBe(true);
    expect(matchesModel("dior lady", lady)).toBe(true);
  });
  it("matches on a colourway name (owner types the colour)", () => {
    expect(matchesModel("sky blue", lady)).toBe(true);
  });
  it("does not match an unrelated query", () => {
    expect(matchesModel("birkin", lady)).toBe(false);
  });
});

describe("rankModels", () => {
  it("orders by closet-add popularity first", () => {
    const rows = [row({ styleId: 1, name: "A" }), row({ styleId: 2, name: "B" })];
    const out = rankModels(rows, { 2: 5, 1: 1 });
    expect(out.map((r) => r.styleId)).toEqual([2, 1]);
  });

  it("falls back to photo, then colourway count, then id when popularity ties", () => {
    const noPhoto = row({ styleId: 1, name: "A", hasImage: false });
    const photoFewColours = row({ styleId: 2, name: "B", hasImage: true });
    const photoManyColours = row({
      styleId: 3,
      name: "C",
      hasImage: true,
      colourways: [
        { colourName: "Black", variantId: 31, sizeLabel: null },
        { colourName: "Red", variantId: 32, sizeLabel: null },
      ],
    });
    const out = rankModels([noPhoto, photoFewColours, photoManyColours], {});
    expect(out.map((r) => r.styleId)).toEqual([3, 2, 1]);
  });
});

describe("orderMatches", () => {
  it("prefers photo, then more colourways, then the shorter name", () => {
    const longName = row({ styleId: 1, name: "Classic Flap Jumbo Caviar", hasImage: true });
    const shortName = row({ styleId: 2, name: "Classic Flap", hasImage: true });
    const out = orderMatches([longName, shortName]);
    expect(out[0].styleId).toBe(2);
  });
});
