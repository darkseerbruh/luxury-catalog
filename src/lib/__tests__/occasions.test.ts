import { describe, it, expect } from "vitest";
import {
  OCCASIONS,
  HOMEPAGE_OCCASION_BOARDS,
  isOccasion,
  occasionLabel,
} from "../occasions";

describe("occasions canonical set", () => {
  it("has the five decided buckets", () => {
    expect(OCCASIONS.map((o) => o.value)).toEqual([
      "everyday",
      "work",
      "evening",
      "travel",
      "special",
    ]);
  });

  it("every homepage board is a real occasion", () => {
    const values = new Set(OCCASIONS.map((o) => o.value));
    for (const occ of HOMEPAGE_OCCASION_BOARDS) expect(values.has(occ)).toBe(true);
  });
});

describe("isOccasion", () => {
  it("accepts canonical values", () => {
    expect(isOccasion("evening")).toBe(true);
    expect(isOccasion("work")).toBe(true);
  });

  it("rejects legacy free text, empties, and non-strings", () => {
    expect(isOccasion("date night")).toBe(false);
    expect(isOccasion("")).toBe(false);
    expect(isOccasion(null)).toBe(false);
    expect(isOccasion(undefined)).toBe(false);
    expect(isOccasion(42)).toBe(false);
  });
});

describe("occasionLabel", () => {
  it("maps known values to their chip label", () => {
    expect(occasionLabel("evening")).toBe("Evening");
    expect(occasionLabel("special")).toBe("Special occasion");
  });

  it("falls back to the raw string for legacy values, null for empty", () => {
    expect(occasionLabel("brunch with friends")).toBe("brunch with friends");
    expect(occasionLabel(null)).toBe(null);
  });
});
