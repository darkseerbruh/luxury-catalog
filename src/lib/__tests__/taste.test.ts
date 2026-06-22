import { describe, it, expect } from "vitest";
import {
  TASTE_QUESTIONS,
  addWeight,
  buildVectorFromAnswers,
  completeness,
  dimensionsCovered,
  dimensionsRemaining,
  nameTaste,
  priceBand,
  topValue,
  topValuesWithShare,
  type TasteVector,
} from "../taste";
import { foldVariantIntoVector, type VariantAttrs } from "../taste-core";

describe("addWeight", () => {
  it("accumulates weight and lowercases/trims values", () => {
    const v: TasteVector = {};
    addWeight(v, "hardware", "  Gold  ", 2);
    addWeight(v, "hardware", "gold", 1);
    expect(v.hardware).toEqual({ gold: 3 });
  });

  it("ignores empty values", () => {
    const v: TasteVector = {};
    addWeight(v, "hardware", "", 5);
    addWeight(v, "hardware", "   ", 5);
    expect(v.hardware).toBeUndefined();
  });
});

describe("priceBand", () => {
  it("buckets by retail price and handles null", () => {
    expect(priceBand(null)).toBeNull();
    expect(priceBand(900)).toBe("entry");
    expect(priceBand(1499)).toBe("entry");
    expect(priceBand(1500)).toBe("mid");
    expect(priceBand(4999)).toBe("mid");
    expect(priceBand(5000)).toBe("grail");
    expect(priceBand(20000)).toBe("grail");
  });
});

describe("topValue / topValuesWithShare", () => {
  it("returns the strongest value and null for empty dimensions", () => {
    const v: TasteVector = { silhouette: { tote: 1, box: 3, structured: 2 } };
    expect(topValue(v, "silhouette")).toBe("box");
    expect(topValue(v, "brand")).toBeNull();
  });

  it("normalizes shares to sum ~1 and sorts descending", () => {
    const v: TasteVector = { material: { leather: 3, fabric: 1 } };
    const shares = topValuesWithShare(v, "material");
    expect(shares[0]).toEqual({ value: "leather", share: 0.75 });
    expect(shares[1]).toEqual({ value: "fabric", share: 0.25 });
    expect(shares.reduce((a, b) => a + b.share, 0)).toBeCloseTo(1);
  });

  it("returns [] for an unseen dimension", () => {
    expect(topValuesWithShare({}, "carry")).toEqual([]);
  });
});

describe("completeness / dimensionsCovered / dimensionsRemaining", () => {
  it("is 0 for an empty vector and 100 for all 8 dimensions", () => {
    expect(completeness({})).toBe(0);
    expect(dimensionsRemaining({})).toBe(8);
    const full: TasteVector = {
      silhouette: { tote: 1 },
      size: { medium: 1 },
      carry: { shoulder: 1 },
      hardware: { gold: 1 },
      material: { leather: 1 },
      formality: { casual: 1 },
      price_band: { mid: 1 },
      brand: { coach: 1 },
    };
    expect(completeness(full)).toBe(100);
    expect(dimensionsCovered(full)).toBe(8);
    expect(dimensionsRemaining(full)).toBe(0);
  });

  it("rounds the percentage for partial coverage", () => {
    const v: TasteVector = { silhouette: { tote: 1 }, hardware: { gold: 1 } };
    // 2 of 8 = 25
    expect(completeness(v)).toBe(25);
    expect(dimensionsRemaining(v)).toBe(6);
  });

  it("ignores dimensions present but empty", () => {
    const v: TasteVector = { silhouette: {} };
    expect(completeness(v)).toBe(0);
    expect(dimensionsCovered(v)).toBe(0);
  });
});

describe("buildVectorFromAnswers", () => {
  it("returns an empty vector for no answers", () => {
    expect(buildVectorFromAnswers({})).toEqual({});
  });

  it("weights an explicit answer at 3 on its primary dimension", () => {
    const v = buildVectorFromAnswers({ hardware: "gold" });
    expect(v.hardware).toEqual({ gold: 3 });
  });

  it("applies secondary `also` hints at weight 1.5", () => {
    // 'structured' silhouette also informs formality=formal (see TASTE_QUESTIONS)
    const v = buildVectorFromAnswers({ silhouette: "structured" });
    expect(v.silhouette).toEqual({ structured: 3 });
    expect(v.formality).toEqual({ formal: 1.5 });
  });

  it("ignores unknown question ids and invalid option values", () => {
    const v = buildVectorFromAnswers({ nope: "x", hardware: "purple" });
    expect(v).toEqual({});
  });

  it("only ever references catalogued option values from TASTE_QUESTIONS", () => {
    // Build using every first option; result keys must be a subset of the
    // declared option values (the 'never invent' guarantee).
    const answers: Record<string, string> = {};
    const allowed = new Set<string>();
    for (const q of TASTE_QUESTIONS) {
      answers[q.id] = q.options[0].value;
      for (const o of q.options) {
        allowed.add(o.value);
        for (const a of o.also ?? []) allowed.add(a.value);
      }
    }
    const v = buildVectorFromAnswers(answers);
    for (const dim of Object.keys(v) as (keyof TasteVector)[]) {
      for (const value of Object.keys(v[dim] ?? {})) {
        expect(allowed.has(value)).toBe(true);
      }
    }
  });
});

describe("nameTaste", () => {
  it("produces a deterministic name + tagline from top values", () => {
    const v: TasteVector = {
      silhouette: { structured: 3 },
      formality: { formal: 3 },
      carry: { "top handle": 2 },
      hardware: { gold: 2 },
    };
    const named = nameTaste(v);
    expect(named.name).toBe("Structured Classicist");
    expect(named.tagline).toContain("top handle carry");
    expect(named.tagline).toContain("gold hardware");
  });

  it("falls back gracefully for an empty vector", () => {
    const named = nameTaste({});
    expect(named.name).toBe("Eclectic Collector");
    expect(named.tagline).toMatch(/sharpen/i);
  });
});

describe("foldVariantIntoVector (taste-core)", () => {
  const variant: VariantAttrs = {
    variant_id: 1,
    size_category: "medium",
    hardware_color: "gold",
    retail_price_original: 6000,
    style: { name: "City", silhouette: "structured", brand: { name: "Coach" } },
    exterior_material: { material_type: "leather" },
    carry_method: [
      { carry_type: "shoulder", possible: "yes" },
      { carry_type: "crossbody", possible: "no" },
    ],
  };

  it("folds only catalogued attributes, never inventing", () => {
    const v: TasteVector = {};
    foldVariantIntoVector(v, variant, 2);
    expect(v.silhouette).toEqual({ structured: 2 });
    expect(v.size).toEqual({ medium: 2 });
    expect(v.hardware).toEqual({ gold: 2 });
    expect(v.material).toEqual({ leather: 2 });
    expect(v.brand).toEqual({ coach: 2 });
    expect(v.price_band).toEqual({ grail: 2 }); // 6000 -> grail
    // carry weight is halved; 'no' carry methods are excluded
    expect(v.carry).toEqual({ shoulder: 1 });
    expect(v.carry?.crossbody).toBeUndefined();
    // formality is not a catalogued variant attribute -> never set here
    expect(v.formality).toBeUndefined();
  });

  it("skips null attributes without crashing (sparse data)", () => {
    const v: TasteVector = {};
    foldVariantIntoVector(
      v,
      {
        variant_id: 2,
        size_category: null,
        hardware_color: null,
        retail_price_original: null,
        style: null,
        exterior_material: null,
        carry_method: null,
      },
      1
    );
    expect(v).toEqual({});
  });

  it("unwraps Supabase array-shaped joins", () => {
    const v: TasteVector = {};
    foldVariantIntoVector(
      v,
      {
        variant_id: 3,
        size_category: "small",
        hardware_color: "silver",
        retail_price_original: 1000,
        style: [{ name: "Mini", silhouette: "box", brand: [{ name: "Polene" }] }],
        exterior_material: [{ material_type: "leather" }],
        carry_method: null,
      },
      1
    );
    expect(v.silhouette).toEqual({ box: 1 });
    expect(v.brand).toEqual({ polene: 1 });
    expect(v.price_band).toEqual({ entry: 1 });
  });
});
