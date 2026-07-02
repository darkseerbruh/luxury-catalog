import { describe, expect, it } from "vitest";
import { displaySizeLabel, variantShortLabel } from "@/lib/variant-label";

describe("displaySizeLabel", () => {
  it("strips the ingest catch-all, passes real sizes", () => {
    expect(displaySizeLabel("Standard")).toBeNull();
    expect(displaySizeLabel("MM")).toBe("MM");
    expect(displaySizeLabel(null)).toBeNull();
    expect(displaySizeLabel(undefined)).toBeNull();
  });
});

describe("variantShortLabel", () => {
  it("joins size and colourway, never shows Standard", () => {
    expect(variantShortLabel("MM", "Monogram")).toBe("MM · Monogram");
    expect(variantShortLabel("Standard", "Monogram")).toBe("Monogram");
    expect(variantShortLabel("Standard", null)).toBe("Variant");
  });
});
