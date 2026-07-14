import { describe, expect, it } from "vitest";
import {
  auditCatalogStructure,
  findAccentDupGroups,
  findListingTitleStyles,
  findSafePseudoStyles,
  foldName,
  type StyleLite,
  type VariantLite,
} from "../catalog-structure";

const s = (styleId: number, name: string, brandId = 1): StyleLite => ({ styleId, name, brandId });
const v = (
  variantId: number,
  styleId: number,
  over: Partial<Omit<VariantLite, "variantId" | "styleId">> = {},
): VariantLite => ({
  variantId,
  styleId,
  sizeLabel: null,
  exteriorColorway: null,
  exteriorMaterialId: null,
  ...over,
});

function counts(styles: StyleLite[], variants: VariantLite[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const row of variants) m.set(row.styleId, (m.get(row.styleId) ?? 0) + 1);
  return m;
}

describe("findSafePseudoStyles", () => {
  const birkin = s(1, "Birkin");
  const togo = s(2, "Togo Birkin 35");
  const vars = [v(10, 1), v(11, 1), v(12, 2)];

  it("catches a material+size pseudo-style over an existing base", () => {
    const hits = findSafePseudoStyles([birkin, togo], counts([birkin, togo], vars));
    expect(hits.map((h) => h.styleId)).toEqual([2]);
  });

  it("never flags a distinct sub-model (silhouette or model word residual)", () => {
    const styles = [
      s(1, "Neverfull"),
      s(2, "Neverfull Pouch"), // silhouette word — distinct product
      s(3, "Birkin"),
      s(4, "Niloticus Novillo Birkin Touch 30"), // "Touch" — distinct model
    ];
    const vv = [v(1, 1), v(2, 2), v(3, 3), v(4, 4)];
    expect(findSafePseudoStyles(styles, counts(styles, vv))).toEqual([]);
  });

  it("skips multi-variant pseudo candidates (judgment, not auto)", () => {
    const styles = [s(1, "Tivoli"), s(2, "Monogram Tivoli GM")];
    const vv = [v(1, 1), v(2, 2), v(3, 2)];
    expect(findSafePseudoStyles(styles, counts(styles, vv))).toEqual([]);
  });

  it("skips a size-only residual (sibling size, not junk)", () => {
    const styles = [s(1, "City Steamer"), s(2, "City Steamer MM")];
    const vv = [v(1, 1), v(2, 2)];
    expect(findSafePseudoStyles(styles, counts(styles, vv))).toEqual([]);
  });

  it("requires the base to hold variants (never merges into an empty shell)", () => {
    const styles = [s(1, "Birkin"), s(2, "Togo Birkin 35")];
    const vv = [v(1, 2)]; // base has none
    expect(findSafePseudoStyles(styles, counts(styles, vv))).toEqual([]);
  });

  it("never matches across brands", () => {
    const styles = [s(1, "Birkin", 1), s(2, "Togo Birkin 35", 2)];
    const vv = [v(1, 1), v(2, 2)];
    expect(findSafePseudoStyles(styles, counts(styles, vv))).toEqual([]);
  });
});

describe("findListingTitleStyles", () => {
  it("catches long descriptor-stuffed seller titles", () => {
    const hits = findListingTitleStyles([
      s(1, "Chanel Pink Tweed 19 Large Flap Bag"),
      s(2, "Louis Vuitton Monogram Canvas Neverfull Pochette Pouch"),
    ]);
    expect(hits).toHaveLength(2);
  });

  it("catches tag artifacts regardless of length", () => {
    expect(findListingTitleStyles([s(1, "Mini Square Flap Bag w/ Tags")])).toHaveLength(1);
  });

  it("leaves real names alone, including brand-prefixed lines", () => {
    const hits = findListingTitleStyles([
      s(1, "Birkin"),
      s(2, "Dior Toujours"),
      s(3, "Fendigraphy"),
      s(4, "Multi Pochette Accessoires"),
      s(5, "Le Chiquito Moyen"),
    ]);
    expect(hits).toEqual([]);
  });
});

describe("findAccentDupGroups", () => {
  it("groups accent-variant spellings within a brand", () => {
    const groups = findAccentDupGroups([s(1, "Belvédère"), s(2, "Belvedere"), s(3, "Belvedère"), s(4, "Saïgon")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((g) => g.styleId).sort()).toEqual([1, 2, 3]);
  });

  it("does not group the same name across brands", () => {
    expect(findAccentDupGroups([s(1, "Bohème", 1), s(2, "Boheme", 2)])).toEqual([]);
  });
});

describe("foldName", () => {
  it("folds accents, case, and punctuation", () => {
    expect(foldName("Bride-à-Brac")).toBe(foldName("Bride-a-Brac"));
    expect(foldName("Locò")).toBe("loco");
  });
});

describe("auditCatalogStructure", () => {
  it("computes variant attribute coverage over all variants", () => {
    const styles = [s(1, "Birkin")];
    const vars = [
      v(1, 1, { sizeLabel: "35", exteriorColorway: "Black", exteriorMaterialId: 7 }),
      v(2, 1, { sizeLabel: "30" }),
      v(3, 1, {}),
      v(4, 1, { exteriorColorway: "Gold" }),
    ];
    const audit = auditCatalogStructure(styles, vars);
    expect(audit.variantCoverage.total).toBe(4);
    expect(audit.variantCoverage.sizePct).toBe(50);
    expect(audit.variantCoverage.colourPct).toBe(50);
    expect(audit.variantCoverage.materialPct).toBe(25);
  });

  it("returns zeroed coverage for an empty catalog", () => {
    const audit = auditCatalogStructure([], []);
    expect(audit.variantCoverage).toEqual({ total: 0, sizePct: 0, colourPct: 0, materialPct: 0 });
    expect(audit.safePseudo).toEqual([]);
    expect(audit.titleJunk).toEqual([]);
    expect(audit.dupGroups).toEqual([]);
  });
});
