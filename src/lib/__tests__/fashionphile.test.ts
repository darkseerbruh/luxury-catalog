/**
 * Unit tests for the Fashionphile pure parser (src/lib/ingest/fashionphile.ts).
 * No network, no DB — all fixtures are inline.
 */
import { describe, it, expect } from "vitest";
import { parseFashionphileProduct } from "../ingest/fashionphile";
import type { ShopifyProduct } from "../ingest/fashionphile";
import type { PriceObservation } from "../ingest/types";
import { validateObservation } from "../ingest/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Representative Shopify product JSON for a Chanel Classic Flap Medium */
const chanelFlapProduct: ShopifyProduct = {
  title: "CHANEL Classic Double Flap Quilted Caviar Medium Shoulder Bag",
  handle: "chanel-classic-double-flap-quilted-caviar-medium-shoulder-bag-12345",
  body_html:
    "<p>CHANEL Classic Double Flap Bag in Black Caviar Leather with Gold-Tone Hardware. " +
    "From the 2019 Collection. Interior zip and slip pockets. Includes Dust Bag and Box.</p>",
  tags: ["Black", "Caviar Leather", "Gold Hardware", "Chanel", "Flap"],
  variants: [
    { price: "8950.00", sku: "FP-12345" },
  ],
};

/** Product with colour only in body_html (no colour tag), silver hardware, no year */
const lambskinProduct: ShopifyProduct = {
  title: "CHANEL Classic Flap Beige Lambskin Silver",
  handle: "chanel-classic-flap-beige-lambskin-67890",
  body_html: "<p>Beige Lambskin Leather with Silver-Tone Hardware. Pre-owned.</p>",
  tags: ["Lambskin Leather", "Silver Hardware", "Chanel"],
  variants: [{ price: "6200", sku: "FP-67890" }],
};

/** Product with no recognisable colour/material/hardware (should return nulls) */
const minimalProduct: ShopifyProduct = {
  title: "Unknown Designer Bag",
  handle: "unknown-bag",
  body_html: "<p>Beautiful bag.</p>",
  tags: [],
  variants: [{ price: "500", sku: "MIN-001" }],
};

/** Product with no variants (edge case) */
const noVariantsProduct: ShopifyProduct = {
  title: "CHANEL Classic Flap",
  handle: "chanel-classic-flap",
  body_html: "<p>Black Caviar Gold Hardware.</p>",
  tags: ["Black"],
  variants: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — colour extraction", () => {
  it("extracts colour from tags (canonical casing)", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.color).toBe("Black");
  });

  it("extracts colour from body_html when not in tags", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.color).toBe("Beige");
  });

  it("returns null when no recognisable colour present", () => {
    const spec = parseFashionphileProduct(minimalProduct);
    expect(spec.color).toBeNull();
  });
});

describe("parseFashionphileProduct — material extraction", () => {
  it("extracts material from tags", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.material).toBe("Caviar Leather");
  });

  it("extracts material from tags (lambskin)", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.material).toBe("Lambskin Leather");
  });

  it("returns null when no recognisable material", () => {
    const spec = parseFashionphileProduct(minimalProduct);
    expect(spec.material).toBeNull();
  });
});

describe("parseFashionphileProduct — hardware extraction", () => {
  it("extracts gold hardware from tags", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.hardwareColor).toBe("gold");
  });

  it("extracts silver hardware from tags", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.hardwareColor).toBe("silver");
  });

  it("extracts hardware from body_html when not in tags", () => {
    const spec = parseFashionphileProduct(noVariantsProduct);
    // body has "Gold Hardware" but no hw tag — falls through to body scan
    expect(spec.hardwareColor).toBe("gold");
  });

  it("returns null when no hardware mentioned", () => {
    const spec = parseFashionphileProduct(minimalProduct);
    expect(spec.hardwareColor).toBeNull();
  });
});

describe("parseFashionphileProduct — year / season", () => {
  it("extracts season + production year from 'YYYY Collection'", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.productionYear).toBe(2019);
    expect(spec.season).toBe("2019"); // single-year season is still stored
  });

  it("extracts season range from 'YYYY-YYYY Collection'", () => {
    const product: ShopifyProduct = {
      ...chanelFlapProduct,
      body_html: "<p>From the 2012-2013 Collection. Black Caviar Gold Hardware.</p>",
    };
    const spec = parseFashionphileProduct(product);
    expect(spec.productionYear).toBe(2012);
    expect(spec.season).toBe("2012-2013");
  });

  it("returns null year when no year present", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.productionYear).toBeNull();
  });
});

describe("parseFashionphileProduct — price / sku / inclusions", () => {
  it("parses price and sku from first variant", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.price).toBe(8950);
    expect(spec.sku).toBe("FP-12345");
    expect(spec.currency).toBe("USD");
  });

  it("returns null price/sku when no variants", () => {
    const spec = parseFashionphileProduct(noVariantsProduct);
    expect(spec.price).toBeNull();
    expect(spec.sku).toBeNull();
  });

  it("extracts inclusions from body_html", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.inclusions).toContain("Dust Bag");
  });

  it("condition is always null (not in Shopify product JSON)", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.condition).toBeNull();
  });
});

describe("parseFashionphileProduct — PriceObservation mapping", () => {
  it("maps a full spec to a valid PriceObservation", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    const obs: Partial<PriceObservation> = {
      brand: "Chanel",
      style: "Classic Flap",
      attrs: {
        size_label: "Medium",
        exterior_colorway: spec.color,
        exterior_material: spec.material,
        hardware_color: spec.hardwareColor,
        production_year: spec.productionYear,
        season: spec.season,
        inclusions: spec.inclusions,
        listing_ref: spec.sku,
      },
      platform: "Fashionphile",
      price_type: "listed",
      sale_price: spec.price!,
      currency: spec.currency,
      condition: spec.condition,
      observed_on: "2026-06-22",
      source_url: "https://www.fashionphile.com/products/chanel-classic-double-flap-quilted-caviar-medium-shoulder-bag-12345.json",
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });
});
