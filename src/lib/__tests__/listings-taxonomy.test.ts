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
  it("splits leather into grained vs smooth, brand-neutrally", () => {
    expect(materialFamily("Togo Leather")).toBe("Pebbled or grained leather");
    expect(materialFamily("Togo")).toBe("Pebbled or grained leather");
    expect(materialFamily("Caviar")).toBe("Pebbled or grained leather");
    expect(materialFamily("Lambskin")).toBe("Smooth leather");
    expect(materialFamily("Leather")).toBe("Smooth leather");
  });

  it("separates exotics, suede, canvas, and the distinctive fabrics", () => {
    expect(materialFamily("Niloticus Crocodile")).toBe("Exotic");
    expect(materialFamily("Ostrich")).toBe("Exotic");
    expect(materialFamily("Suede")).toBe("Suede");
    expect(materialFamily("Monogram Coated Canvas")).toBe("Canvas");
    expect(materialFamily("Tweed")).toBe("Tweed");
    expect(materialFamily("Nylon")).toBe("Nylon");
    expect(materialFamily("Denim")).toBe("Denim");
    expect(materialFamily("Satin")).toBe("Fabric");
    expect(materialFamily("Crochet")).toBe("Raffia or woven");
    expect(materialFamily("Patent Leather")).toBe("Patent");
  });

  it("returns null for unknown / empty", () => {
    expect(materialFamily("Unobtanium")).toBeNull();
    expect(materialFamily(null)).toBeNull();
  });
});
