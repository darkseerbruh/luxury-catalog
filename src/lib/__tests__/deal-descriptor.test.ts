import { describe, it, expect } from "vitest";
import { listingQualifier, slugText } from "../deal-descriptor";

describe("slugText", () => {
  it("extracts human words from a reseller slug, dropping the product id", () => {
    expect(slugText("https://theluxurycloset.com/us-en/women/chanel-navy-blue-leather-gabrielle-clutch-large-p1345322")).toBe(
      "chanel navy blue leather gabrielle clutch large",
    );
    expect(slugText("https://www.fashionphile.com/products/chanel-tweed-medium-gabrielle-hobo-black-1778569")).toBe(
      "chanel tweed medium gabrielle hobo black",
    );
    expect(slugText(null)).toBe("");
  });
});

describe("listingQualifier", () => {
  it("labels a micro-mini flap grouped under Classic Flap (the owner's example)", () => {
    // notes empty; descriptor lives only in the URL slug
    const q = listingQualifier(
      "Classic Flap",
      "",
      "https://theluxurycloset.com/us-en/women/chanel-green-micro-mini-classic-caviar-single-flap-p1318211",
    );
    expect(q).toBe("Micro Mini");
  });

  it("labels a Gabrielle clutch as a clutch (the owner's example)", () => {
    const q = listingQualifier(
      "Gabrielle",
      "",
      "https://theluxurycloset.com/us-en/women/chanel-navy-blue-leather-gabrielle-clutch-large-p1345322",
    );
    expect(q).toContain("Clutch");
  });

  it("uses the title when present", () => {
    expect(listingQualifier("Gabrielle", "Tweed Calfskin Quilted Medium Gabrielle Hobo Black", null)).toBe("Hobo");
  });

  it("returns null when the listing adds nothing beyond the style name", () => {
    expect(listingQualifier("The Pouch", "BV The Pouch Nappa", "https://x.com/bottega-the-pouch-1")).toBeNull();
    expect(listingQualifier("Classic Flap", "Chanel Medium Classic Flap Caviar Black", null)).toBeNull();
  });

  it("does not repeat a type word already in the style name", () => {
    expect(listingQualifier("Camera Bag", "Chanel Camera Bag Black", null)).toBeNull();
  });
});
