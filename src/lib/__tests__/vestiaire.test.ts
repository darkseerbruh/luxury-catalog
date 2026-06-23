/**
 * Unit tests for the Vestiaire Collective pure parser (src/lib/ingest/vestiaire.ts).
 * No network, no DB — all fixtures are inline.
 */
import { describe, it, expect } from "vitest";
import { parseVestiaireProduct, mapVestiaireCondition, findVestiaireProductNode } from "../ingest/vestiaire";
import type { VestiaireProductNode } from "../ingest/vestiaire";
import type { PriceObservation } from "../ingest/types";
import { validateObservation } from "../ingest/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Representative __NEXT_DATA__ product node — Chanel Classic Flap Medium, France */
const chanelFlapNode: VestiaireProductNode = {
  id: "42011234",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/black-leather-chanel-handbag-42011234.shtml",
  name: "Chanel Classic Flap Medium Black Caviar",
  brand: { name: "Chanel" },
  color: { name: "Black" },
  material: { name: "Caviar Leather" },
  hardware: "Gold-Tone Hardware",
  condition: "Very good condition",
  price: { cents: 875000, currency: "EUR" },
  country: { name: "France", code: "FR" },
};

/** Node with JSON-LD style fields (offers + string color) */
const jsonLdNode: VestiaireProductNode = {
  id: "99887766",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/beige-lambskin-chanel-handbag-99887766.shtml",
  name: "Chanel Classic Flap Beige Lambskin Silver",
  brand: "Chanel",
  color: "Beige",
  material: "Lambskin",
  hardware: "Silver-Tone Hardware",
  condition: "Excellent condition",
  offers: { price: 6500, priceCurrency: "USD" },
  country: "United States",
};

/** Node representing a UK seller with region, "Never worn" condition */
const newWithTagsNode: VestiaireProductNode = {
  id: "11223344",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-11223344.shtml",
  name: "Chanel Classic Flap Red Patent New",
  brand: { name: "Chanel" },
  color: { name: "Red" },
  material: { name: "Patent Leather" },
  hardware: "Gold-Tone Hardware",
  condition: "Never worn, with tag",
  price: { amount: "9800", currency: "GBP" },
  country: { name: "United Kingdom", code: "GB" },
};

/** Node with ambiguous condition → should return null */
const ambiguousConditionNode: VestiaireProductNode = {
  id: "55667788",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-55667788.shtml",
  brand: { name: "Chanel" },
  color: { name: "Brown" },
  material: { name: "Leather" },
  condition: "Gently used", // not in our mapping → null
  price: { cents: 450000, currency: "EUR" },
  country: { name: "Italy", code: "IT" },
};

/** Minimal node — all optional fields absent */
const minimalNode: VestiaireProductNode = {
  id: "00000001",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-00000001.shtml",
  brand: { name: "Chanel" },
  price: { cents: 550000, currency: "EUR" },
};

/** Node using colors[] and materials[] arrays — alternate __NEXT_DATA__ shape */
const arrayFieldsNode: VestiaireProductNode = {
  id: "77889900",
  url: "https://www.vestiairecollective.com/women-bags/handbags/hermes/birkin-30-77889900.shtml",
  name: "Hermès Birkin 30 Noir Togo",
  brand: { name: "Hermès" },
  colors: [{ name: "Noir" }],
  materials: [{ name: "Togo" }],
  hardware: "Palladium Hardware",
  condition: "Excellent condition",
  price: { cents: 1950000, currency: "EUR" },
  country: { name: "France", code: "FR" },
};

/** Node with Rose Gold hardware */
const roseGoldNode: VestiaireProductNode = {
  id: "12345678",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-12345678.shtml",
  brand: { name: "Chanel" },
  color: { name: "Beige" },
  material: { name: "Caviar Leather" },
  hardware: "Rose Gold Hardware",
  condition: "Very good condition",
  price: { cents: 920000, currency: "EUR" },
  country: { name: "Germany", code: "DE" },
};

/** JSON-LD node with schema.org itemCondition — no plain condition string */
const schemaOrgNewNode: VestiaireProductNode = {
  id: "20000001",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-20000001.shtml",
  brand: "Chanel",
  color: "Black",
  material: "Lambskin",
  itemCondition: "https://schema.org/NewCondition",
  offers: { price: 7200, priceCurrency: "USD" },
  country: "United States",
};

/** JSON-LD node with schema.org LikeNewCondition */
const schemaOrgLikeNewNode: VestiaireProductNode = {
  id: "20000002",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-20000002.shtml",
  brand: "Chanel",
  color: "Beige",
  material: "Caviar",
  itemCondition: "https://schema.org/LikeNewCondition",
  offers: { price: 8500, priceCurrency: "EUR" },
  country: "France",
};

/** JSON-LD node with schema.org UsedCondition — too broad, should be null */
const schemaOrgUsedNode: VestiaireProductNode = {
  id: "20000003",
  url: "https://www.vestiairecollective.com/women-bags/handbags/chanel/chanel-handbag-20000003.shtml",
  brand: "Chanel",
  color: "Brown",
  material: "Leather",
  itemCondition: "https://schema.org/UsedCondition",
  offers: { price: 3500, priceCurrency: "GBP" },
  country: "United Kingdom",
};

// ---------------------------------------------------------------------------
// Condition mapping
// ---------------------------------------------------------------------------

describe("mapVestiaireCondition", () => {
  it("maps 'Never worn' variants to 'new'", () => {
    expect(mapVestiaireCondition("Never worn")).toBe("new");
    expect(mapVestiaireCondition("Never worn, with tag")).toBe("new");
    expect(mapVestiaireCondition("New with tags")).toBe("new");
    expect(mapVestiaireCondition("Brand new")).toBe("new");
  });

  it("maps 'Excellent condition' to 'excellent'", () => {
    expect(mapVestiaireCondition("Excellent condition")).toBe("excellent");
    expect(mapVestiaireCondition("Excellent")).toBe("excellent");
  });

  it("maps 'Very good condition' to 'very good'", () => {
    expect(mapVestiaireCondition("Very good condition")).toBe("very good");
    expect(mapVestiaireCondition("Very good")).toBe("very good");
  });

  it("maps 'Good condition' to 'good'", () => {
    expect(mapVestiaireCondition("Good condition")).toBe("good");
    expect(mapVestiaireCondition("Good")).toBe("good");
  });

  it("maps 'Fair condition' to 'fair'", () => {
    expect(mapVestiaireCondition("Fair condition")).toBe("fair");
    expect(mapVestiaireCondition("Fair")).toBe("fair");
  });

  it("returns null for ambiguous / unknown strings", () => {
    expect(mapVestiaireCondition("Gently used")).toBeNull();
    expect(mapVestiaireCondition("Signs of wear")).toBeNull();
    expect(mapVestiaireCondition("Satisfactory condition")).toBeNull();
    expect(mapVestiaireCondition("")).toBeNull();
    expect(mapVestiaireCondition(null)).toBeNull();
    expect(mapVestiaireCondition(undefined)).toBeNull();
  });

  it("maps schema.org NewCondition URL to 'new'", () => {
    expect(mapVestiaireCondition("https://schema.org/NewCondition")).toBe("new");
  });

  it("maps schema.org LikeNewCondition URL to 'excellent'", () => {
    expect(mapVestiaireCondition("https://schema.org/LikeNewCondition")).toBe("excellent");
  });

  it("returns null for schema.org UsedCondition (too broad)", () => {
    expect(mapVestiaireCondition("https://schema.org/UsedCondition")).toBeNull();
    expect(mapVestiaireCondition("https://schema.org/RefurbishedCondition")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Colour / material / hardware extraction
// ---------------------------------------------------------------------------

describe("parseVestiaireProduct — colour extraction", () => {
  it("extracts colour from __NEXT_DATA__ color.name", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    expect(spec.color).toBe("Black");
  });

  it("extracts colour from JSON-LD string field", () => {
    const spec = parseVestiaireProduct(jsonLdNode);
    expect(spec.color).toBe("Beige");
  });

  it("extracts colour from node with Red", () => {
    const spec = parseVestiaireProduct(newWithTagsNode);
    expect(spec.color).toBe("Red");
  });

  it("extracts French colour name (Noir) from colors[] array", () => {
    // Hermès-style: colors is an array of objects
    const spec = parseVestiaireProduct(arrayFieldsNode);
    expect(spec.color).toBe("Noir");
  });

  it("returns null when colour absent", () => {
    const spec = parseVestiaireProduct(minimalNode);
    expect(spec.color).toBeNull();
  });
});

describe("parseVestiaireProduct — material extraction", () => {
  it("recognises 'Caviar Leather'", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    expect(spec.material).toBe("Caviar Leather");
  });

  it("recognises 'Lambskin'", () => {
    const spec = parseVestiaireProduct(jsonLdNode);
    expect(spec.material).toBe("Lambskin");
  });

  it("recognises 'Patent Leather'", () => {
    const spec = parseVestiaireProduct(newWithTagsNode);
    expect(spec.material).toBe("Patent Leather");
  });

  it("recognises Hermès 'Togo' from materials[] array", () => {
    // Hermès-style: materials is an array of objects
    const spec = parseVestiaireProduct(arrayFieldsNode);
    expect(spec.material).toBe("Togo");
  });

  it("returns null when material absent", () => {
    const spec = parseVestiaireProduct(minimalNode);
    expect(spec.material).toBeNull();
  });
});

describe("parseVestiaireProduct — hardware extraction", () => {
  it("extracts 'gold' from 'Gold-Tone Hardware'", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    expect(spec.hardwareColor).toBe("gold");
  });

  it("extracts 'silver' from 'Silver-Tone Hardware'", () => {
    const spec = parseVestiaireProduct(jsonLdNode);
    expect(spec.hardwareColor).toBe("silver");
  });

  it("extracts 'palladium' from 'Palladium Hardware'", () => {
    const spec = parseVestiaireProduct(arrayFieldsNode);
    expect(spec.hardwareColor).toBe("palladium");
  });

  it("extracts 'rose-gold' from 'Rose Gold Hardware' (multi-word, hyphenated)", () => {
    const spec = parseVestiaireProduct(roseGoldNode);
    expect(spec.hardwareColor).toBe("rose-gold");
  });

  it("returns null when hardware absent", () => {
    const spec = parseVestiaireProduct(minimalNode);
    expect(spec.hardwareColor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Condition mapping (through parser)
// ---------------------------------------------------------------------------

describe("parseVestiaireProduct — condition mapping", () => {
  it("maps 'Very good condition' to 'very good'", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    expect(spec.condition).toBe("very good");
  });

  it("maps 'Excellent condition' to 'excellent'", () => {
    const spec = parseVestiaireProduct(jsonLdNode);
    expect(spec.condition).toBe("excellent");
  });

  it("maps 'Never worn, with tag' to 'new'", () => {
    const spec = parseVestiaireProduct(newWithTagsNode);
    expect(spec.condition).toBe("new");
  });

  it("maps schema.org NewCondition URL to 'new' (JSON-LD itemCondition fallback)", () => {
    const spec = parseVestiaireProduct(schemaOrgNewNode);
    expect(spec.condition).toBe("new");
  });

  it("maps schema.org LikeNewCondition URL to 'excellent' (JSON-LD itemCondition fallback)", () => {
    const spec = parseVestiaireProduct(schemaOrgLikeNewNode);
    expect(spec.condition).toBe("excellent");
  });

  it("returns null for schema.org UsedCondition (too broad for a grade)", () => {
    const spec = parseVestiaireProduct(schemaOrgUsedNode);
    expect(spec.condition).toBeNull();
  });

  it("returns null for ambiguous condition string", () => {
    const spec = parseVestiaireProduct(ambiguousConditionNode);
    expect(spec.condition).toBeNull();
  });

  it("returns null when condition absent", () => {
    const spec = parseVestiaireProduct(minimalNode);
    expect(spec.condition).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Region / country extraction
// ---------------------------------------------------------------------------

describe("parseVestiaireProduct — region extraction", () => {
  it("extracts country name from country.name object", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    expect(spec.region).toBe("France");
    expect(spec.country).toBe("France");
  });

  it("extracts region from string country field", () => {
    const spec = parseVestiaireProduct(jsonLdNode);
    expect(spec.region).toBe("United States");
    expect(spec.country).toBe("United States");
  });

  it("extracts country from UK node", () => {
    const spec = parseVestiaireProduct(newWithTagsNode);
    expect(spec.region).toBe("United Kingdom");
  });

  it("returns null region when absent", () => {
    const spec = parseVestiaireProduct(minimalNode);
    expect(spec.region).toBeNull();
    expect(spec.country).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Price extraction
// ---------------------------------------------------------------------------

describe("parseVestiaireProduct — price extraction", () => {
  it("converts cents to decimal EUR", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    expect(spec.price).toBe(8750);
    expect(spec.currency).toBe("EUR");
  });

  it("parses offers.price (JSON-LD) as USD", () => {
    const spec = parseVestiaireProduct(jsonLdNode);
    expect(spec.price).toBe(6500);
    expect(spec.currency).toBe("USD");
  });

  it("parses price.amount string", () => {
    const spec = parseVestiaireProduct(newWithTagsNode);
    expect(spec.price).toBe(9800);
    expect(spec.currency).toBe("GBP");
  });
});

// ---------------------------------------------------------------------------
// PriceObservation mapping (end-to-end)
// ---------------------------------------------------------------------------

describe("parseVestiaireProduct — PriceObservation mapping", () => {
  it("maps a full node to a valid PriceObservation", () => {
    const spec = parseVestiaireProduct(chanelFlapNode);
    const obs: Partial<PriceObservation> = {
      brand: "Chanel",
      style: "Classic Flap",
      attrs: {
        size_label: "Medium",
        exterior_colorway: spec.color,
        exterior_material: spec.material,
        hardware_color: spec.hardwareColor,
        condition_detail:
          typeof chanelFlapNode.condition === "string"
            ? chanelFlapNode.condition
            : chanelFlapNode.condition?.description ?? chanelFlapNode.condition?.name ?? null,
        region: spec.region,
        listing_ref: String(chanelFlapNode.id),
      },
      platform: "Vestiaire Collective",
      price_type: "listed",
      sale_price: spec.price!,
      currency: spec.currency,
      condition: spec.condition,
      observed_on: "2026-06-22",
      source_url: chanelFlapNode.url!,
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });

  it("maps a node with null condition to a valid observation (condition omitted)", () => {
    const spec = parseVestiaireProduct(ambiguousConditionNode);
    const obs: Partial<PriceObservation> = {
      brand: "Chanel",
      style: "Classic Flap",
      attrs: { listing_ref: String(ambiguousConditionNode.id), region: spec.region },
      platform: "Vestiaire Collective",
      price_type: "listed",
      sale_price: spec.price!,
      currency: spec.currency,
      condition: spec.condition, // null — valid per contract
      observed_on: "2026-06-22",
      source_url: ambiguousConditionNode.url!,
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });

  it("maps an array-fields Hermès node to a valid PriceObservation", () => {
    const spec = parseVestiaireProduct(arrayFieldsNode);
    // verify extracted specs before assembling the observation
    expect(spec.color).toBe("Noir");
    expect(spec.material).toBe("Togo");
    expect(spec.hardwareColor).toBe("palladium");
    expect(spec.condition).toBe("excellent");
    expect(spec.region).toBe("France");
    expect(spec.price).toBe(19500);
    expect(spec.currency).toBe("EUR");

    const obs: Partial<PriceObservation> = {
      brand: "Hermès",
      style: "Birkin",
      attrs: {
        size_label: "30",
        exterior_colorway: spec.color,
        exterior_material: spec.material,
        hardware_color: spec.hardwareColor,
        condition_detail:
          typeof arrayFieldsNode.condition === "string"
            ? arrayFieldsNode.condition
            : arrayFieldsNode.condition?.description ?? arrayFieldsNode.condition?.name ?? null,
        region: spec.region,
        listing_ref: String(arrayFieldsNode.id),
      },
      platform: "Vestiaire Collective",
      price_type: "listed",
      sale_price: spec.price!,
      currency: spec.currency,
      condition: spec.condition,
      observed_on: "2026-06-22",
      source_url: arrayFieldsNode.url!,
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });

  it("maps a JSON-LD schema.org node (USD, NewCondition) to a valid PriceObservation", () => {
    const spec = parseVestiaireProduct(schemaOrgNewNode);
    expect(spec.condition).toBe("new");
    expect(spec.price).toBe(7200);
    expect(spec.currency).toBe("USD");

    const obs: Partial<PriceObservation> = {
      brand: "Chanel",
      style: "Classic Flap",
      attrs: {
        exterior_colorway: spec.color,
        exterior_material: spec.material,
        region: spec.region,
        listing_ref: String(schemaOrgNewNode.id),
      },
      platform: "Vestiaire Collective",
      price_type: "listed",
      sale_price: spec.price!,
      currency: spec.currency,
      condition: spec.condition,
      observed_on: "2026-06-22",
      source_url: schemaOrgNewNode.url!,
      confidence: "high",
    };
    expect(validateObservation(obs)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findVestiaireProductNode helper
// ---------------------------------------------------------------------------

describe("findVestiaireProductNode", () => {
  it("finds the product at data.props.pageProps.product (most common path)", () => {
    const product = { id: "123", brand: { name: "Chanel" }, price: { cents: 500000 } };
    const data = { props: { pageProps: { product } } };
    expect(findVestiaireProductNode(data)).toBe(product);
  });

  it("finds the product at data.props.pageProps.initialReduxState.product", () => {
    const product = { id: "456", brand: { name: "Hermès" }, price: { cents: 1800000 } };
    const data = { props: { pageProps: { initialReduxState: { product } } } };
    expect(findVestiaireProductNode(data)).toBe(product);
  });

  it("finds the product via recursive fallback when path is unknown", () => {
    const product = { id: "789", brand: { name: "Chanel" }, price: 4500, condition: "Very good condition" };
    // Wrap in an unexpected nesting that doesn't match any candidate
    const data = { props: { pageProps: { someUnknownKey: { nested: { product } } } } };
    const found = findVestiaireProductNode(data);
    // The recursive search should find it (has brand + price + condition = 3 hits)
    expect(found).not.toBeNull();
    expect((found as Record<string, unknown>)?.["id"]).toBe("789");
  });

  it("returns null when no product-like object exists", () => {
    expect(findVestiaireProductNode(null)).toBeNull();
    expect(findVestiaireProductNode({})).toBeNull();
    expect(findVestiaireProductNode({ page: "home", query: "chanel" })).toBeNull();
  });
});

describe("real __NEXT_DATA__ node shape (live-captured 2026-06-23)", () => {
  it("parses the real Vestiaire product node: object color/material/condition, price.cents", () => {
    // Exactly the shape pageProps.product carries on a live Vestiaire PDP.
    const node = {
      id: "68098591",
      name: "Timeless/Classique leather handbag",
      description: "Blue Chanel Medium Classic Double Flap.",
      brand: { id: "50", name: "Chanel" },
      color: { id: "9", name: "Blue" },
      material: { id: "3", name: "Leather" },
      condition: { id: "3", type: "condition", description: "Very good condition" },
      price: { currency: "USD", cents: 205100 },
    };
    const spec = parseVestiaireProduct(node);
    expect(spec.price).toBe(2051);
    expect(spec.currency).toBe("USD");
    expect(spec.color).toBe("Blue");
    expect(spec.material).toBe("Leather");
    expect(spec.condition).toBe("very good");
  });
});
