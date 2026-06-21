import { describe, it, expect } from "vitest";
import {
  scoreVariant,
  buildWhy,
  rowToRec,
  normalizedWeight,
  type VariantRow,
} from "../recommendations-core";
import type { TasteVector } from "../taste";

function variant(over: Partial<VariantRow> = {}): VariantRow {
  return {
    variant_id: 10,
    size_category: "medium",
    hardware_color: "gold",
    exterior_colorway: "tan",
    size_label: "Medium",
    retail_price_original: 2000,
    currency: "USD",
    style: { name: "City", silhouette: "structured", brand: { name: "Coach" } },
    exterior_material: { material_type: "leather" },
    carry_method: [{ carry_type: "shoulder", possible: "yes" }],
    ...over,
  };
}

describe("normalizedWeight", () => {
  it("returns the value's share within its dimension", () => {
    const v: TasteVector = { hardware: { gold: 3, silver: 1 } };
    expect(normalizedWeight(v, "hardware", "gold")).toBe(0.75);
    expect(normalizedWeight(v, "hardware", "GOLD")).toBe(0.75); // case-insensitive
    expect(normalizedWeight(v, "hardware", "bronze")).toBe(0);
    expect(normalizedWeight(v, "brand", "coach")).toBe(0); // unseen dimension
  });
});

describe("scoreVariant", () => {
  it("scores zero when nothing overlaps the user vector", () => {
    const user: TasteVector = { hardware: { silver: 1 } };
    const s = scoreVariant(user, variant({ hardware_color: "gold" }));
    // gold hardware doesn't overlap silver; other attrs aren't in user vector
    expect(s.score).toBe(0);
    expect(s.matches).toEqual([]);
  });

  it("accumulates weighted contributions for overlapping attributes", () => {
    const user: TasteVector = {
      silhouette: { structured: 1 },
      hardware: { gold: 1 },
    };
    const s = scoreVariant(user, variant());
    expect(s.score).toBeGreaterThan(0);
    const dims = s.matches.map((m) => m.dim).sort();
    expect(dims).toContain("silhouette");
    expect(dims).toContain("hardware");
  });

  it("ranks a closer match above a weaker one", () => {
    const user: TasteVector = {
      silhouette: { structured: 1 },
      hardware: { gold: 1 },
      material: { leather: 1 },
      brand: { coach: 1 },
    };
    const strong = scoreVariant(user, variant());
    const weak = scoreVariant(
      user,
      variant({
        style: { name: "Other", silhouette: "hobo", brand: { name: "Unknown" } },
        hardware_color: "silver",
        exterior_material: { material_type: "fabric" },
      })
    );
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("does not crash on fully-null variant attributes", () => {
    const s = scoreVariant(
      { hardware: { gold: 1 } },
      variant({
        size_category: null,
        hardware_color: null,
        retail_price_original: null,
        style: null,
        exterior_material: null,
        carry_method: null,
      })
    );
    expect(s.score).toBe(0);
  });
});

describe("buildWhy", () => {
  it("returns '' when there are no matches", () => {
    expect(buildWhy([], "Because you like")).toBe("");
  });

  it("renders the top-2 contributions with human phrasing", () => {
    const why = buildWhy(
      [
        { dim: "silhouette", value: "structured", contribution: 1.4 },
        { dim: "hardware", value: "gold", contribution: 1.2 },
        { dim: "size", value: "medium", contribution: 0.3 },
      ],
      "Because you like"
    );
    expect(why).toBe("Because you like structured shapes + gold hardware");
  });

  it("honors a custom prefix (similar-bags uses 'Shares')", () => {
    const why = buildWhy(
      [{ dim: "brand", value: "Coach", contribution: 1 }],
      "Shares"
    );
    expect(why).toBe("Shares Coach");
  });
});

describe("rowToRec", () => {
  it("maps a scored row into a recommendation with a label and why", () => {
    const user: TasteVector = { silhouette: { structured: 1 }, hardware: { gold: 1 } };
    const rec = rowToRec(scoreVariant(user, variant()));
    expect(rec.variantId).toBe(10);
    expect(rec.brandName).toBe("Coach");
    expect(rec.styleName).toBe("City");
    expect(rec.label).toBe("Medium · tan");
    expect(rec.retailPrice).toBe(2000);
    expect(rec.why).toContain("Because you like");
  });

  it("falls back to 'Variant' label when size/colorway are absent", () => {
    const user: TasteVector = { hardware: { gold: 1 } };
    const rec = rowToRec(
      scoreVariant(user, variant({ size_label: null, exterior_colorway: null }))
    );
    expect(rec.label).toBe("Variant");
  });

  it("handles array-shaped style/brand joins and missing brand", () => {
    const user: TasteVector = { silhouette: { box: 1 } };
    const rec = rowToRec(
      scoreVariant(
        user,
        variant({ style: [{ name: "Mini", silhouette: "box", brand: null }] })
      )
    );
    expect(rec.styleName).toBe("Mini");
    expect(rec.brandName).toBe("");
  });
});
