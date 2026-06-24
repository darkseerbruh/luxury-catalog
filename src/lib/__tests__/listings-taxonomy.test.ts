import { describe, it, expect } from "vitest";
import { colorFamily, materialFamily } from "../listings-taxonomy";

describe("colorFamily", () => {
  it("rolls designer-specific names up into a family", () => {
    expect(colorFamily("Étoupe")).toBe("Beige");
    expect(colorFamily("Noir")).toBe("Black");
    expect(colorFamily("Rouge H")).toBe("Red");
    expect(colorFamily("Bleu Nuit")).toBe("Blue");
    expect(colorFamily("Vert Cypres")).toBe("Green");
  });

  it("handles plain English color words", () => {
    expect(colorFamily("Chocolate Brown")).toBe("Brown");
    expect(colorFamily("light pink")).toBe("Pink");
    expect(colorFamily("Beige Clair")).toBe("Beige");
  });

  it("treats gold/silver as metallic, not a hue", () => {
    expect(colorFamily("Gold")).toBe("Metallic");
    expect(colorFamily("Silver")).toBe("Metallic");
  });

  it("uses learned overrides for names the keyword rules can't place", () => {
    // "celadon" is in the committed overrides (a pale green) but has no keyword rule.
    expect(colorFamily("Celadon")).toBe("Green");
    expect(colorFamily("amethyst")).toBe("Purple");
  });

  it("returns null for unknown / empty", () => {
    expect(colorFamily("Sploot")).toBeNull();
    expect(colorFamily(null)).toBeNull();
    expect(colorFamily("")).toBeNull();
  });
});

describe("materialFamily", () => {
  it("rolls specific leathers up into Leather", () => {
    expect(materialFamily("Togo Leather")).toBe("Leather");
    expect(materialFamily("Togo")).toBe("Leather");
    expect(materialFamily("Caviar")).toBe("Leather");
    expect(materialFamily("Lambskin")).toBe("Leather");
    expect(materialFamily("Leather")).toBe("Leather");
  });

  it("separates exotics, suede, canvas, and fabric from smooth leather", () => {
    expect(materialFamily("Niloticus Crocodile")).toBe("Exotic");
    expect(materialFamily("Ostrich")).toBe("Exotic");
    expect(materialFamily("Suede")).toBe("Suede");
    expect(materialFamily("Monogram Coated Canvas")).toBe("Coated canvas");
    expect(materialFamily("Tweed")).toBe("Fabric");
    expect(materialFamily("Patent Leather")).toBe("Patent");
  });

  it("returns null for unknown / empty", () => {
    expect(materialFamily("Unobtanium")).toBeNull();
    expect(materialFamily(null)).toBeNull();
  });
});
