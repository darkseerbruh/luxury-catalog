/**
 * Unit tests for the Vestiaire Collective pure parser (src/lib/ingest/vestiaire.ts).
 * No network, no DB — all fixtures are inline.
 */
import { describe, it, expect } from "vitest";
import { parseVestiaireProduct, mapVestiaireCondition } from "../ingest/vestiaire";
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
        condition_detail: chanelFlapNode.condition ?? null,
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
});
