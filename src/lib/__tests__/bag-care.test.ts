import { describe, it, expect } from "vitest";
import {
  careMaterialsFor,
  careItemsForMaterial,
  careItemsByGroup,
  CARE_ITEMS,
  CARE_GROUPS,
} from "@/lib/bag-care";

describe("careMaterialsFor", () => {
  it("routes patent to patent care, not smooth leather", () => {
    const f = careMaterialsFor("Patent Calfskin");
    expect(f).toContain("patent");
    expect(f).not.toContain("smooth-leather");
  });

  it("routes suede/nubuck to suede", () => {
    expect(careMaterialsFor("Suede")).toContain("suede");
    expect(careMaterialsFor("Nubuck")).toContain("suede");
  });

  it("routes coated canvas / monogram to canvas", () => {
    expect(careMaterialsFor("Monogram Canvas")).toContain("canvas");
    expect(careMaterialsFor("Coated Canvas")).toContain("canvas");
  });

  it("routes exotics to exotic", () => {
    expect(careMaterialsFor("Alligator")).toContain("exotic");
    expect(careMaterialsFor("Python")).toContain("exotic");
  });

  it("routes grained leathers (caviar/togo/epi) to grained", () => {
    expect(careMaterialsFor("Caviar")).toContain("grained-leather");
    expect(careMaterialsFor("Togo")).toContain("grained-leather");
    expect(careMaterialsFor("Epi Leather")).toContain("grained-leather");
  });

  it("routes smooth leathers (lambskin/calf) to smooth", () => {
    expect(careMaterialsFor("Lambskin")).toContain("smooth-leather");
    expect(careMaterialsFor("Smooth Calfskin")).toContain("smooth-leather");
  });

  it("always includes hardware", () => {
    expect(careMaterialsFor("Lambskin")).toContain("hardware");
    expect(careMaterialsFor(null)).toContain("hardware");
  });

  it("falls back to general leather for unknown/null material", () => {
    const f = careMaterialsFor(null);
    expect(f).toContain("smooth-leather");
    expect(f).toContain("grained-leather");
  });
});

describe("careItemsForMaterial", () => {
  it("gives suede a suede-specific item and never a smooth-leather-only conditioner", () => {
    const items = careItemsForMaterial("Suede");
    expect(items.some((i) => i.key === "suede-kit")).toBe(true);
    expect(items.some((i) => i.key === "leather-conditioner")).toBe(false);
  });

  it("gives patent the patent item, not a leather cleaner", () => {
    const items = careItemsForMaterial("Patent");
    expect(items.some((i) => i.key === "patent-wipe")).toBe(true);
    expect(items.some((i) => i.key === "leather-cleaner")).toBe(false);
  });

  it("caps at the requested limit and never returns empty for a leather bag", () => {
    expect(careItemsForMaterial("Caviar").length).toBeLessThanOrEqual(3);
    expect(careItemsForMaterial("Caviar", 2).length).toBe(2);
    expect(careItemsForMaterial(null).length).toBeGreaterThan(0);
  });

  it("orders clean/condition and shape ahead of hardware/display", () => {
    const items = careItemsForMaterial("Lambskin", 5);
    const groups = items.map((i) => i.group);
    const firstHardware = groups.indexOf("hardware");
    const firstClean = groups.indexOf("clean-condition");
    if (firstHardware !== -1 && firstClean !== -1) {
      expect(firstClean).toBeLessThan(firstHardware);
    }
  });
});

describe("care registry integrity", () => {
  it("every item belongs to a defined group", () => {
    const keys = new Set(CARE_GROUPS.map((g) => g.key));
    for (const item of CARE_ITEMS) {
      expect(keys.has(item.group)).toBe(true);
    }
  });

  it("every item has a non-empty search query and item keys are unique", () => {
    const seen = new Set<string>();
    for (const item of CARE_ITEMS) {
      expect(item.searchQuery.trim().length).toBeGreaterThan(0);
      expect(seen.has(item.key)).toBe(false);
      seen.add(item.key);
    }
  });

  it("careItemsByGroup returns only items in that group", () => {
    for (const g of CARE_GROUPS) {
      for (const item of careItemsByGroup(g.key)) {
        expect(item.group).toBe(g.key);
      }
    }
  });
});
