/**
 * Unit tests for the Fashionphile pure parser (src/lib/ingest/fashionphile.ts).
 * No network, no DB — all fixtures are inline.
 *
 * Fixtures are grounded in a real live Fashionphile inspection (2026-06-22):
 *   title  = "Calfskin Archetype Small Shopping Tote Dark Burgundy"
 *   tags   = ["Cardi B"]          ← celebrity tag, NOT colour/material
 *   sku    = "1887484"
 *   price  = "8075.00"
 *   body_html (stripped) starts: "This is an authentic CHANEL Calfskin Archetype Small
 *     Shopping Tote in Dark Burgundy. This tote is crafted with burgundy calfskin
 *     leather. It features gold-tone hardware…"
 *
 * Key lesson: tags are unreliable; spec comes from title + body_html.
 */
import { describe, it, expect } from "vitest";
import {
  parseFashionphileProduct,
  mapFashionphileCondition,
} from "../ingest/fashionphile";
import type { ShopifyProduct } from "../ingest/fashionphile";
import type { PriceObservation } from "../ingest/types";
import { validateObservation } from "../ingest/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Real-world Chanel Calfskin tote — tags hold a celebrity name, NOT spec.
 * Colour + material extracted from title; hardware from body_html.
 */
const realWorldChanelTote: ShopifyProduct = {
  title: "Calfskin Archetype Small Shopping Tote Dark Burgundy",
  handle: "chanel-calfskin-archetype-small-shopping-tote-dark-burgundy-1887484",
  body_html:
    "<p>This is an authentic CHANEL Calfskin Archetype Small Shopping Tote in Dark Burgundy. " +
    "This tote is crafted with burgundy calfskin leather. It features gold-tone hardware " +
    "and a zip closure at the top. Includes Dust Bag.</p>",
  tags: ["Cardi B"],   // NOTE: real-world tag — unrelated to spec
  variants: [
    { price: "8075.00", sku: "1887484" },
  ],
};

/**
 * Chanel Classic Flap — colour in body_html, gold hardware in body_html, season present.
 * Tags are generic brand/style labels with NO colour or hardware.
 */
const chanelFlapProduct: ShopifyProduct = {
  title: "CHANEL Classic Double Flap Quilted Caviar Medium Shoulder Bag",
  handle: "chanel-classic-double-flap-quilted-caviar-medium-shoulder-bag-12345",
  body_html:
    "<p>CHANEL Classic Double Flap Bag in Black Caviar Leather with Gold-Tone Hardware. " +
    "From the 2019 Collection. Interior zip and slip pockets. Includes Dust Bag and Box.</p>",
  tags: ["Chanel", "Flap"],  // NO colour/hardware tags — must fall back to body
  variants: [
    { price: "8950.00", sku: "FP-12345" },
  ],
};

/** Lambskin with silver hardware — colour in title, hardware in body_html. */
const lambskinProduct: ShopifyProduct = {
  title: "CHANEL Classic Flap Beige Lambskin Silver",
  handle: "chanel-classic-flap-beige-lambskin-67890",
  body_html: "<p>Beige Lambskin Leather with Silver-Tone Hardware. Pre-owned.</p>",
  tags: ["Chanel"],
  variants: [{ price: "6200", sku: "FP-67890" }],
};

/** Product with no recognisable colour/material/hardware (should return nulls). */
const minimalProduct: ShopifyProduct = {
  title: "Unknown Designer Bag",
  handle: "unknown-bag",
  body_html: "<p>Beautiful bag.</p>",
  tags: [],
  variants: [{ price: "500", sku: "MIN-001" }],
};

/** Product with no variants (edge case). */
const noVariantsProduct: ShopifyProduct = {
  title: "CHANEL Classic Flap",
  handle: "chanel-classic-flap",
  body_html: "<p>Black Caviar Gold Hardware.</p>",
  tags: [],
  variants: [],
};

// ---------------------------------------------------------------------------
// Real-world fixture tests
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — real-world sample (tags = celebrity name)", () => {
  it("extracts colour from title when tags are unrelated", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    // Title has "Dark Burgundy" — multi-word colour match.
    expect(spec.color).toBe("Dark Burgundy");
  });

  it("extracts calfskin leather material from body_html (body has 'calfskin leather')", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    // body_html says "crafted with burgundy calfskin leather" → "Calfskin Leather" wins
    // over plain "Calfskin" from title because MATERIALS is ordered most-specific-first.
    expect(spec.material).toBe("Calfskin Leather");
  });

  it("extracts gold hardware from body_html", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    expect(spec.hardwareColor).toBe("gold");
  });

  it("parses price as a number", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    expect(spec.price).toBe(8075);
  });

  it("parses SKU from variant", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    expect(spec.sku).toBe("1887484");
  });

  it("extracts inclusions from body_html", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    expect(spec.inclusions).toContain("Dust Bag");
  });
});

// ---------------------------------------------------------------------------
// Colour extraction
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — colour extraction", () => {
  it("extracts colour from title (no usable tags)", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.color).toBe("Black");
  });

  it("extracts colour from title when body_html would also match", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.color).toBe("Beige");
  });

  it("returns null when no recognisable colour present", () => {
    const spec = parseFashionphileProduct(minimalProduct);
    expect(spec.color).toBeNull();
  });

  it("does not confuse gold hardware with a gold colourway", () => {
    const prod: ShopifyProduct = {
      title: "CHANEL Classic Flap Black Caviar",
      handle: "chanel-black-caviar",
      body_html: "<p>Black Caviar Leather with Gold-Tone Hardware.</p>",
      tags: [],
      variants: [{ price: "7500", sku: "X" }],
    };
    const spec = parseFashionphileProduct(prod);
    expect(spec.color).toBe("Black");
    expect(spec.hardwareColor).toBe("gold");
  });
});

// ---------------------------------------------------------------------------
// Material extraction
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — material extraction", () => {
  it("extracts Calfskin Leather from combined text (body has 'calfskin leather')", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    // body_html says "crafted with burgundy calfskin leather" → "Calfskin Leather" wins
    expect(spec.material).toBe("Calfskin Leather");
  });

  it("extracts Caviar Leather from body_html", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.material).toBe("Caviar Leather");
  });

  it("extracts Lambskin Leather from body_html", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.material).toBe("Lambskin Leather");
  });

  it("returns null when no recognisable material", () => {
    const spec = parseFashionphileProduct(minimalProduct);
    expect(spec.material).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Hardware extraction
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — hardware extraction", () => {
  it("extracts gold hardware from body_html (real-world fixture)", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote);
    expect(spec.hardwareColor).toBe("gold");
  });

  it("extracts gold-tone hardware from body_html when not in title", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.hardwareColor).toBe("gold");
  });

  it("extracts silver-tone hardware", () => {
    const spec = parseFashionphileProduct(lambskinProduct);
    expect(spec.hardwareColor).toBe("silver");
  });

  it("extracts hardware from body_html when no title match", () => {
    const spec = parseFashionphileProduct(noVariantsProduct);
    // body has "Gold Hardware" — falls through to body scan
    expect(spec.hardwareColor).toBe("gold");
  });

  it("returns null when no hardware mentioned", () => {
    const spec = parseFashionphileProduct(minimalProduct);
    expect(spec.hardwareColor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Year / season
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — year / season", () => {
  it("extracts single year from 'YYYY Collection'", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.productionYear).toBe(2019);
    expect(spec.season).toBe("2019");
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
    expect(spec.season).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Price / SKU / inclusions
// ---------------------------------------------------------------------------

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
});

// ---------------------------------------------------------------------------
// Condition mapping
// ---------------------------------------------------------------------------

describe("mapFashionphileCondition", () => {
  it("maps 'New' → 'new'", () => {
    expect(mapFashionphileCondition("New")).toBe("new");
  });

  it("maps 'Giftable' → 'new' (like-new store quality)", () => {
    expect(mapFashionphileCondition("Giftable")).toBe("new");
  });

  it("maps 'Excellent' → 'excellent'", () => {
    expect(mapFashionphileCondition("Excellent")).toBe("excellent");
  });

  it("maps 'Very Good' → 'very good'", () => {
    expect(mapFashionphileCondition("Very Good")).toBe("very good");
  });

  it("maps 'Good' → 'good'", () => {
    expect(mapFashionphileCondition("Good")).toBe("good");
  });

  it("maps 'Fair' → 'fair'", () => {
    expect(mapFashionphileCondition("Fair")).toBe("fair");
  });

  it("maps 'Pre-Owned Fair' → 'fair'", () => {
    expect(mapFashionphileCondition("Pre-Owned Fair")).toBe("fair");
  });

  it("returns null for unrecognised grade", () => {
    expect(mapFashionphileCondition("Pristine")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(mapFashionphileCondition("")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(mapFashionphileCondition(null)).toBeNull();
    expect(mapFashionphileCondition(undefined)).toBeNull();
  });
});

describe("parseFashionphileProduct — condition from grade arg", () => {
  it("condition is null when no grade passed", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct);
    expect(spec.condition).toBeNull();
  });

  it("condition is mapped when grade is passed", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct, "Excellent");
    expect(spec.condition).toBe("excellent");
  });

  it("Giftable grade maps to 'new'", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct, "Giftable");
    expect(spec.condition).toBe("new");
  });

  it("unrecognised grade maps to null", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct, "Like New");
    expect(spec.condition).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// PriceObservation mapping
// ---------------------------------------------------------------------------

describe("parseFashionphileProduct — PriceObservation mapping", () => {
  it("maps real-world fixture to a valid PriceObservation", () => {
    const spec = parseFashionphileProduct(realWorldChanelTote, "Excellent");
    const obs: Partial<PriceObservation> = {
      brand: "Chanel",
      style: "Archetype Shopping Tote",
      attrs: {
        size_label: "Small",
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
      source_url:
        "https://www.fashionphile.com/products/chanel-calfskin-archetype-small-shopping-tote-dark-burgundy-1887484",
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });

  it("maps chanelFlapProduct to a valid PriceObservation", () => {
    const spec = parseFashionphileProduct(chanelFlapProduct, "Very Good");
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
      source_url:
        "https://www.fashionphile.com/products/chanel-classic-double-flap-quilted-caviar-medium-shoulder-bag-12345",
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });
});
