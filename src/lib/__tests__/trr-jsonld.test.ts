import { describe, it, expect } from "vitest";
import {
  listingRefFromUrl,
  normalizeDesc,
  recordToObservation,
  type TrrRecord,
  type TrrJsonLdTarget,
} from "../../../supabase/ingest/sources/trr-jsonld";

// Mirror of the proven chanel-classic-flap-medium target (kept inline so the test
// doesn't depend on the private TARGETS map).
const CHANEL_FLAP_MEDIUM: TrrJsonLdTarget = {
  brand: "Chanel",
  style: "Classic Flap",
  size_label: "Medium",
  namePredicate: (name: string) => {
    const n = name.toLowerCase();
    return (
      n.includes("flap") &&
      n.includes("medium") &&
      !["jumbo", "maxi", "mini", "small"].some((t) => n.includes(t))
    );
  },
  minPrice: 1500,
  maxPrice: 20000,
};

describe("trr-jsonld name predicate", () => {
  const p = CHANEL_FLAP_MEDIUM.namePredicate;
  it("accepts a Classic Medium Double Flap", () => {
    expect(p("Classic Medium Double Flap Bag")).toBe(true);
    expect(p("Lambskin Classic Double Flap Bag Medium")).toBe(true);
  });
  it("rejects a Jumbo flap", () => {
    expect(p("Jumbo Classic Double Flap Bag")).toBe(false);
  });
  it("rejects a Mini flap (even if it also says medium-ish)", () => {
    expect(p("Mini Square Flap Bag")).toBe(false);
  });
});

describe("normalizeDesc", () => {
  it("recovers colour/material/hardware from a collapsed '. '-separated desc", () => {
    const collapsed =
      "Chanel Shoulder Bag. From the 2011-2012 Collection. Black Caviar Leather. Gold-Tone Hardware. Includes Dust Bag.";
    // Without normalization the facts run together; with it they split into segments.
    expect(normalizeDesc(collapsed)).toContain("Black Caviar Leather.\n");
  });
});

describe("listingRefFromUrl", () => {
  it("extracts the last path segment as the slug", () => {
    expect(
      listingRefFromUrl(
        "https://www.therealreal.com/products/women/handbags/shoulder-bags/chanel-medium-classic-double-flap-bag-teci7"
      )
    ).toBe("chanel-medium-classic-double-flap-bag-teci7");
  });
  it("strips query/hash before taking the slug", () => {
    expect(listingRefFromUrl("https://www.therealreal.com/products/x-abc123?ref=foo#a")).toBe("x-abc123");
  });
});

describe("recordToObservation", () => {
  const rec: TrrRecord = {
    url: "https://www.therealreal.com/products/women/handbags/shoulder-bags/chanel-medium-classic-double-flap-bag-teci7",
    name: "Medium Classic Double Flap Bag",
    sku: null,
    price: 3040,
    currency: "USD",
    condition: "UsedCondition",
    desc: "Chanel Shoulder Bag. From the 2011-2012 Collection by Karl Lagerfeld. Black Caviar Leather. Gold-Tone Hardware. Includes Dust Bag.",
  };

  it("maps a kept record to a full PriceObservation (spec + listing_ref + null condition)", () => {
    const o = recordToObservation(rec, CHANEL_FLAP_MEDIUM, "2026-06-22");
    expect(o).not.toBeNull();
    expect(o!.brand).toBe("Chanel");
    expect(o!.style).toBe("Classic Flap");
    expect(o!.platform).toBe("The RealReal");
    expect(o!.price_type).toBe("listed");
    expect(o!.sale_price).toBe(3040);
    expect(o!.currency).toBe("USD");
    expect(o!.observed_on).toBe("2026-06-22");
    expect(o!.source_url).toBe(rec.url);
    expect(o!.confidence).toBe("high");
    expect(o!.notes).toBe("Medium Classic Double Flap Bag");
    // Never fake a graded condition from generic "UsedCondition".
    expect(o!.condition).toBeNull();
    // Spec recovered from the collapsed desc.
    expect(o!.attrs.size_label).toBe("Medium");
    expect(o!.attrs.exterior_colorway).toBe("Black");
    expect(o!.attrs.exterior_material).toBe("Caviar Leather");
    expect(o!.attrs.hardware_color).toBe("gold");
    expect(o!.attrs.production_year).toBe(2011);
    expect(o!.attrs.season).toBe("2011-2012");
    expect(o!.attrs.inclusions).toBe("Dust Bag");
    // listing_ref = URL slug.
    expect(o!.attrs.listing_ref).toBe("chanel-medium-classic-double-flap-bag-teci7");
  });

  it("returns null when the name fails the predicate", () => {
    expect(recordToObservation({ ...rec, name: "Jumbo Classic Double Flap Bag" }, CHANEL_FLAP_MEDIUM, "2026-06-22")).toBeNull();
  });

  it("returns null when the price is out of bounds", () => {
    expect(recordToObservation({ ...rec, price: 500 }, CHANEL_FLAP_MEDIUM, "2026-06-22")).toBeNull();
  });
});
