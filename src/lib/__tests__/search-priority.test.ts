import { describe, expect, it } from "vitest";
import {
  normalizeStyleName,
  priorityMatchTier,
  rankPriorityStyles,
  pinStylesFirst,
  priorityChipLabels,
  type StyleNameRow,
} from "../search-priority";
import type { StyleSearchResult } from "../queries";

// Mirrors the real catalog rows the spot-check tripped on (style ids from prod).
const CATALOG: StyleNameRow[] = [
  { styleId: 434, name: "Alma", brandName: "Louis Vuitton" },
  { styleId: 68, name: "Monogram Vernis Alma BB w/ Strap", brandName: "Louis Vuitton" },
  { styleId: 520, name: "Chanel 25", brandName: "Chanel" },
  { styleId: 425, name: "Chanel 19", brandName: "Chanel" },
  { styleId: 431, name: "Chanel 22", brandName: "Chanel" },
  { styleId: 104, name: "2020 Swift Birkin 25", brandName: "Hermès" },
  { styleId: 18, name: "Damier Ebene Speedy 25", brandName: "Louis Vuitton" },
  { styleId: 326, name: "Clemence Picotin 22", brandName: "Hermès" },
  { styleId: 488, name: "16 (Sixteen)", brandName: "Celine" },
  { styleId: 840, name: "Celine 16", brandName: "Celine" },
];

const byId = (id: number) => CATALOG.find((r) => r.styleId === id)!;

describe("normalizeStyleName", () => {
  it("lowercases, strips punctuation and collapses whitespace", () => {
    expect(normalizeStyleName("16 (Sixteen)")).toBe("16 sixteen");
    expect(normalizeStyleName("  Chanel   25 ")).toBe("chanel 25");
  });

  it("strips diacritics so Hermès and hermes compare equal", () => {
    expect(normalizeStyleName("Hermès")).toBe("hermes");
    expect(normalizeStyleName("Céline")).toBe("celine");
  });
});

describe("priorityMatchTier", () => {
  it("tier 3: query exactly matching a style name, case-insensitive", () => {
    expect(priorityMatchTier("alma", byId(434))).toBe(3);
    expect(priorityMatchTier("ALMA", byId(434))).toBe(3);
    expect(priorityMatchTier("chanel 25", byId(520))).toBe(3);
    expect(priorityMatchTier("Chanel 19", byId(425))).toBe(3);
    expect(priorityMatchTier("celine 16", byId(840))).toBe(3);
  });

  it("tier 2: query exactly matching brand + style name", () => {
    expect(priorityMatchTier("louis vuitton alma", byId(434))).toBe(2);
  });

  it("tier 1: brand + line number matches the brand's numeric line style", () => {
    expect(priorityMatchTier("celine 16", byId(488))).toBe(1);
  });

  it("brand gate: a line number never pins another brand's size-suffixed style", () => {
    expect(priorityMatchTier("chanel 25", byId(104))).toBe(0); // Birkin 25
    expect(priorityMatchTier("chanel 25", byId(18))).toBe(0); // Speedy 25
    expect(priorityMatchTier("chanel 22", byId(326))).toBe(0); // Picotin 22
  });

  it("no pin for substring or bare-number queries", () => {
    expect(priorityMatchTier("alma mini", byId(434))).toBe(0);
    expect(priorityMatchTier("25", byId(520))).toBe(0);
    expect(priorityMatchTier("chanel", byId(520))).toBe(0);
    expect(priorityMatchTier("", byId(434))).toBe(0);
  });
});

describe("rankPriorityStyles", () => {
  it("'alma' pins the Alma style family only", () => {
    expect(rankPriorityStyles("alma", CATALOG)).toEqual([434]);
  });

  it("'chanel 25' pins the Chanel 25 line, never size-25 styles", () => {
    expect(rankPriorityStyles("chanel 25", CATALOG)).toEqual([520]);
  });

  it("'celine 16' pins both line entries, exact name first", () => {
    expect(rankPriorityStyles("celine 16", CATALOG)).toEqual([840, 488]);
  });

  it("returns nothing for queries that pin no style", () => {
    expect(rankPriorityStyles("structured black crossbody", CATALOG)).toEqual([]);
  });
});

describe("priorityChipLabels", () => {
  const mk = (styleName: string, brandName: string): StyleSearchResult => ({
    styleId: 1,
    styleName,
    brandName,
    variants: [],
  });

  it("prefixes the brand when the style name doesn't carry it", () => {
    expect(priorityChipLabels([mk("Alma", "Louis Vuitton")])).toEqual(["Louis Vuitton Alma"]);
    expect(priorityChipLabels([mk("16 (Sixteen)", "Celine")])).toEqual(["Celine 16 (Sixteen)"]);
  });

  it("doesn't double the brand when the line name already carries it", () => {
    expect(priorityChipLabels([mk("Chanel 25", "Chanel")])).toEqual(["Chanel 25"]);
  });

  it("dedupes repeated labels", () => {
    expect(priorityChipLabels([mk("Chanel 25", "Chanel"), mk("Chanel 25", "Chanel")])).toEqual([
      "Chanel 25",
    ]);
  });
});

describe("pinStylesFirst", () => {
  const mk = (styleId: number): StyleSearchResult => ({
    styleId,
    styleName: `style-${styleId}`,
    brandName: "b",
    variants: [],
  });

  it("prepends pinned styles and dedupes them from the ranked list", () => {
    const merged = pinStylesFirst([mk(434)], [mk(68), mk(434), mk(18)]);
    expect(merged.map((s) => s.styleId)).toEqual([434, 68, 18]);
  });

  it("returns ranked list untouched when nothing is pinned", () => {
    const ranked = [mk(1), mk(2)];
    expect(pinStylesFirst([], ranked)).toBe(ranked);
  });
});
