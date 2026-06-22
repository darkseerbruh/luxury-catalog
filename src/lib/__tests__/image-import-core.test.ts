import { describe, it, expect } from "vitest";
import {
  normalizeDesigner,
  firstImageUrl,
  isHttpUrl,
  scoreStyleMatch,
  scoreVariantMatch,
  pickVariant,
  type VariantAttrs,
} from "../image-import-core";

describe("normalizeDesigner", () => {
  it("restores the Hermès accent and trims", () => {
    expect(normalizeDesigner("Hermes")).toBe("Hermès");
    expect(normalizeDesigner("  Chanel ")).toBe("Chanel");
  });
});

describe("firstImageUrl", () => {
  it("extracts the first http(s) URL from a multi-photo cell", () => {
    expect(firstImageUrl('"https://img.example/a.jpg https://img.example/b.jpg"')).toBe(
      "https://img.example/a.jpg"
    );
    expect(firstImageUrl("https://img.example/a.jpg,https://img.example/b.jpg")).toBe(
      "https://img.example/a.jpg"
    );
  });
  it("returns null for empty or url-less cells", () => {
    expect(firstImageUrl("")).toBeNull();
    expect(firstImageUrl(undefined)).toBeNull();
    expect(firstImageUrl("no link here")).toBeNull();
  });
});

describe("isHttpUrl", () => {
  it("accepts http/https and rejects everything else", () => {
    expect(isHttpUrl("https://x.com/a.jpg")).toBe(true);
    expect(isHttpUrl("http://x.com")).toBe(true);
    expect(isHttpUrl("ftp://x.com")).toBe(false);
    expect(isHttpUrl("/local/path.jpg")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
  });
});

describe("scoreStyleMatch", () => {
  it("ranks exact > contains > token-overlap > none", () => {
    const exact = scoreStyleMatch("Classic Flap", "classic flap");
    const contains = scoreStyleMatch("Classic Flap", "Classic Double Flap");
    const overlap = scoreStyleMatch("Classic Flap", "Flap Wallet On Chain");
    const none = scoreStyleMatch("Classic Flap", "Birkin");
    expect(exact).toBe(100);
    expect(exact).toBeGreaterThan(contains);
    expect(contains).toBeGreaterThan(overlap);
    expect(overlap).toBeGreaterThan(0);
    expect(none).toBe(0);
  });
});

describe("scoreVariantMatch / pickVariant", () => {
  const variants: VariantAttrs[] = [
    {
      variant_id: 1,
      size_label: "Medium",
      exterior_colorway: "Black",
      hardware_color: "Gold",
      hardware_type: "CC turnlock",
    },
    {
      variant_id: 2,
      size_label: "Jumbo",
      exterior_colorway: "Beige",
      hardware_color: "Silver",
      hardware_type: "CC turnlock",
    },
  ];

  it("weights size over colour over hardware", () => {
    const s = scoreVariantMatch(variants[0], { size: "Medium", colors: "Black", hardware: "Gold" });
    expect(s).toBe(3 + 2 + 1); // size*3 + colour*2 + hardware_color*1
  });

  it("picks the best-matching variant from several", () => {
    const v = pickVariant(variants, { size: "Jumbo", colors: "Beige", hardware: "Silver" });
    expect(v?.variant_id).toBe(2);
  });

  it("returns the only variant without scoring", () => {
    const v = pickVariant([variants[0]], { size: "nonsense" });
    expect(v?.variant_id).toBe(1);
  });

  it("falls back to the first variant when no attributes match", () => {
    const v = pickVariant(variants, {});
    expect(v?.variant_id).toBe(1);
  });

  it("returns null for an empty variant list", () => {
    expect(pickVariant([], { size: "Medium" })).toBeNull();
  });
});
