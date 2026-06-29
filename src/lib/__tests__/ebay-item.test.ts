import { describe, it, expect } from "vitest";
import {
  mapEbayCondition, splitEbayCondition, parseEbayItemSpecifics,
  extractEbaySpecificsSection, parseEbayPrice,
} from "../ingest/ebay-item";

describe("mapEbayCondition", () => {
  it("maps eBay's pre-owned tiers to the SaleCondition ladder", () => {
    expect(mapEbayCondition("Pre-owned - Excellent")).toBe("excellent");
    expect(mapEbayCondition("Pre-owned - Good")).toBe("good");
    expect(mapEbayCondition("Pre-owned - Fair")).toBe("fair");
  });

  it("maps the New variants to 'new'", () => {
    expect(mapEbayCondition("New with tags")).toBe("new");
    expect(mapEbayCondition("New without tags")).toBe("new");
    expect(mapEbayCondition("Brand New")).toBe("new");
  });

  it("returns null for ambiguous bare grades (accuracy over completeness)", () => {
    expect(mapEbayCondition("Pre-owned")).toBeNull();
    expect(mapEbayCondition("Used")).toBeNull();
    expect(mapEbayCondition("")).toBeNull();
  });

  it("reads only the grade label, not the explanation after the colon", () => {
    // The detail says "good condition" but the grade is Fair — must not flip to good.
    expect(mapEbayCondition("Pre-owned - Fair: still in good shape overall")).toBe("fair");
  });
});

describe("splitEbayCondition", () => {
  it("splits grade from the written detail", () => {
    const { grade, detail } = splitEbayCondition("Pre-owned - Good: This item has been gently used.");
    expect(grade).toBe("Pre-owned - Good");
    expect(detail).toBe("This item has been gently used.");
  });

  it("returns a grade with null detail when there's no colon", () => {
    expect(splitEbayCondition("New with tags")).toEqual({ grade: "New with tags", detail: null });
  });
});

describe("parseEbayItemSpecifics", () => {
  const md = "Item specifics Condition  Pre-owned - Good: gently used  Brand  Louis Vuitton  Hardware Color  Gold  Pattern  Monogram  Color  Brown  About this item";
  it("pulls clean single-token specifics", () => {
    const s = parseEbayItemSpecifics(md);
    expect(s["Brand"]).toBe("Louis Vuitton");
    expect(s["Hardware Color"]).toBe("Gold");
    expect(s["Pattern"]).toBe("Monogram");
    expect(s["Color"]).toBe("Brown");
  });
  it("returns {} when there is no Item specifics section", () => {
    expect(parseEbayItemSpecifics("just some text")).toEqual({});
  });
});

describe("parseEbayPrice", () => {
  it("takes the first in-band US$ amount", () => {
    expect(parseEbayPrice("Buy It Now US $1,600.00 shipping $35.00", 400, 4000)).toBe(1600);
  });
  it("skips out-of-band amounts (e.g. shipping)", () => {
    expect(parseEbayPrice("shipping $35.00 then price $850.00", 400, 4000)).toBe(850);
  });
  it("returns null when no in-band price", () => {
    expect(parseEbayPrice("no prices here")).toBeNull();
  });
});

describe("extractEbaySpecificsSection", () => {
  it("returns the bounded specifics text or null", () => {
    expect(extractEbaySpecificsSection("Item specifics Condition Pre-owned Brand Gucci About this item rest")).toMatch(/Condition/);
    expect(extractEbaySpecificsSection("nothing relevant")).toBeNull();
  });
});
