import { describe, expect, it } from "vitest";
import {
  deriveMaturityStage,
  motivationsToPersona,
  sanitizeMotivations,
  type Motivation,
} from "../maturity";

describe("sanitizeMotivations", () => {
  it("keeps only recognized slugs", () => {
    expect(sanitizeMotivations(["carry", "bogus", "resell"])).toEqual([
      "carry",
      "resell",
    ]);
  });

  it("de-duplicates and preserves order", () => {
    expect(sanitizeMotivations(["value", "value", "carry"])).toEqual([
      "value",
      "carry",
    ]);
  });

  it("returns empty for no valid input", () => {
    expect(sanitizeMotivations([])).toEqual([]);
    expect(sanitizeMotivations(["nope"])).toEqual([]);
  });
});

describe("motivationsToPersona (legacy back-compat)", () => {
  it("prefers resell -> flipper over weaker signals", () => {
    expect(motivationsToPersona(["carry", "resell"])).toBe("flipper");
  });

  it("maps each verb to its closest legacy persona", () => {
    expect(motivationsToPersona(["collect"])).toBe("collector");
    expect(motivationsToPersona(["authenticate"])).toBe("authentication");
    expect(motivationsToPersona(["value"])).toBe("collector");
    expect(motivationsToPersona(["carry"])).toBe("first-purchase");
  });

  it("returns null when nothing is selected", () => {
    expect(motivationsToPersona([] as Motivation[])).toBeNull();
  });
});

describe("deriveMaturityStage", () => {
  it("appreciates with an empty closet", () => {
    expect(deriveMaturityStage({ owned: 0, wishlist: 0 })).toBe("appreciate");
  });

  it("aspires when only wishlisting", () => {
    expect(deriveMaturityStage({ owned: 0, wishlist: 2 })).toBe("aspire");
  });

  it("is a first-purchaser at one owned bag", () => {
    expect(deriveMaturityStage({ owned: 1, wishlist: 5 })).toBe("first-purchase");
  });

  it("is a collector at three or more owned bags", () => {
    expect(deriveMaturityStage({ owned: 3, wishlist: 0 })).toBe("collector");
    expect(deriveMaturityStage({ owned: 9, wishlist: 1 })).toBe("collector");
  });
});
