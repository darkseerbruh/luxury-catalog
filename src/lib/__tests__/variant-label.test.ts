import { describe, expect, it } from "vitest";
import { displaySizeLabel, measuredSizeLabel, variantShortLabel } from "@/lib/variant-label";

describe("displaySizeLabel", () => {
  it("strips the ingest catch-all, passes real sizes", () => {
    expect(displaySizeLabel("Standard")).toBeNull();
    expect(displaySizeLabel("MM")).toBe("MM");
    expect(displaySizeLabel(null)).toBeNull();
    expect(displaySizeLabel(undefined)).toBeNull();
  });
});

describe("measuredSizeLabel", () => {
  it("applies a brand's sourced measurement only for that brand", () => {
    // Chanel's own sizes get their sourced widths + boutique alias.
    expect(measuredSizeLabel("Small", "Chanel")).toBe("Small · 23 cm");
    expect(measuredSizeLabel("Jumbo", "Chanel")).toBe("Jumbo (Large) · 30 cm");
  });
  it("never prints one house's cm on another (the Fendi bleed bug)", () => {
    // Fendi's "Small"/"Maxi" must NOT inherit Chanel's 23/33 cm.
    expect(measuredSizeLabel("Small", "Fendi")).toBe("Small");
    expect(measuredSizeLabel("Maxi", "Fendi")).toBe("Maxi");
    // No brand given → plain label, never a guessed measurement.
    expect(measuredSizeLabel("Small")).toBe("Small");
  });
});

describe("variantShortLabel", () => {
  it("joins size and colourway, never shows Standard", () => {
    expect(variantShortLabel("MM", "Monogram")).toBe("MM · Monogram");
    expect(variantShortLabel("Standard", "Monogram")).toBe("Monogram");
    expect(variantShortLabel("Standard", null)).toBe("Variant");
  });
});
