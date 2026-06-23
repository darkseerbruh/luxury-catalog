import { describe, it, expect } from "vitest";
import {
  listingRefFromUrl,
  normalizeDesc,
  recordToObservation,
  detectSizeLabel,
  catchAllStyle,
  recordToCatchAllObservation,
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

// ── Catch-all mode (Feature 1) ───────────────────────────────────────────────

describe("detectSizeLabel", () => {
  it("prefers word sizes and returns canonical casing", () => {
    expect(detectSizeLabel("Louis Vuitton Speedy Nano Monogram")).toBe("Nano");
    expect(detectSizeLabel("Dior Mini Book Tote")).toBe("Mini");
    expect(detectSizeLabel("Chanel Jumbo Classic Flap")).toBe("Jumbo");
  });
  it("detects letter-code sizes as whole words (not inside other words)", () => {
    expect(detectSizeLabel("Louis Vuitton Alma BB")).toBe("BB");
    expect(detectSizeLabel("Neverfull MM Tote")).toBe("MM");
    // "mm"/"pm" must NOT match inside monogram/etc.
    expect(detectSizeLabel("Monogram Canvas Pochette")).toBeNull();
  });
  it("detects numeric sizes by whole word and ignores years", () => {
    expect(detectSizeLabel("Birkin 30 Togo")).toBe("30");
    // A standalone year is not a size (no bare 20/25 inside 2025).
    expect(detectSizeLabel("Speedy Bandoulière 2025 release")).toBeNull();
  });
  it("prefers a letter/word size over a bare numeric in the same name", () => {
    expect(detectSizeLabel("Alma BB 25cm strap")).toBe("BB");
  });
  it("returns null when no size token is present", () => {
    expect(detectSizeLabel("Louis Vuitton Monogram Shoulder Bag")).toBeNull();
  });
});

describe("catchAllStyle", () => {
  it("prefers the operator-supplied guess", () => {
    expect(catchAllStyle("Some Verbose Bag Title", "Speedy")).toBe("Speedy");
    expect(catchAllStyle("Some Verbose Bag Title", "  Alma  ")).toBe("Alma");
  });
  it("falls back to the name (minus a trailing 'Bag') when no guess", () => {
    expect(catchAllStyle("Monogram Speedy Bag", null)).toBe("Monogram Speedy");
    expect(catchAllStyle("Monogram Speedy Bag", "")).toBe("Monogram Speedy");
  });
  it("never returns empty", () => {
    expect(catchAllStyle("Bag", null)).toBe("Bag");
  });
});

describe("recordToCatchAllObservation", () => {
  const rec: TrrRecord = {
    url: "https://www.therealreal.com/products/women/handbags/totes/louis-vuitton-monogram-speedy-30-abc12",
    name: "Louis Vuitton Monogram Speedy 30",
    sku: null,
    price: 1295,
    currency: "USD",
    condition: "UsedCondition",
    desc: "Louis Vuitton Speedy. From the 2018 Collection. Brown Monogram Canvas. Gold-Tone Hardware. Includes Dust Bag.",
  };

  it("emits a low-confidence observation with parsed size + spec + listing_ref", () => {
    const o = recordToCatchAllObservation(rec, "Louis Vuitton", "Speedy", "2026-06-23");
    expect(o).not.toBeNull();
    expect(o!.brand).toBe("Louis Vuitton");
    expect(o!.style).toBe("Speedy");
    expect(o!.attrs.size_label).toBe("30");
    expect(o!.attrs.exterior_material).toBe("Monogram Canvas");
    expect(o!.attrs.exterior_colorway).toBe("Brown");
    expect(o!.attrs.hardware_color).toBe("gold");
    expect(o!.attrs.production_year).toBe(2018);
    expect(o!.attrs.listing_ref).toBe("louis-vuitton-monogram-speedy-30-abc12");
    expect(o!.price_type).toBe("listed");
    expect(o!.platform).toBe("The RealReal");
    expect(o!.confidence).toBe("low");
    expect(o!.condition).toBeNull();
    expect(o!.notes).toBe(rec.name);
    expect(o!.observed_on).toBe("2026-06-23");
  });

  it("never applies a price band — keeps a cheap vintage outlier the curated target would drop", () => {
    const cheap = { ...rec, name: "Louis Vuitton Vintage Speedy", price: 220, desc: "Vintage." };
    const o = recordToCatchAllObservation(cheap, "Louis Vuitton", "Speedy", "2026-06-23");
    expect(o).not.toBeNull();
    expect(o!.sale_price).toBe(220);
    // No size in the title -> null (loader routes it to discovered_listing).
    expect(o!.attrs.size_label).toBeNull();
  });

  it("emits a null size (not a drop) when the name has no size token", () => {
    const o = recordToCatchAllObservation({ ...rec, name: "Louis Vuitton Speedy" }, "Louis Vuitton", "Speedy", "2026-06-23");
    expect(o).not.toBeNull();
    expect(o!.attrs.size_label).toBeNull();
  });

  it("derives the style from the name when no style guess is given", () => {
    const o = recordToCatchAllObservation({ ...rec, name: "Monogram Speedy Bag" }, "Louis Vuitton", null, "2026-06-23");
    expect(o!.style).toBe("Monogram Speedy");
  });

  it("returns null ONLY for a non-positive / invalid price", () => {
    expect(recordToCatchAllObservation({ ...rec, price: 0 }, "Louis Vuitton", "Speedy", "2026-06-23")).toBeNull();
    expect(recordToCatchAllObservation({ ...rec, price: -5 }, "Louis Vuitton", "Speedy", "2026-06-23")).toBeNull();
    expect(recordToCatchAllObservation({ ...rec, price: NaN }, "Louis Vuitton", "Speedy", "2026-06-23")).toBeNull();
  });
});
