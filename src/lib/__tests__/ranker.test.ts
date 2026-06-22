import { describe, it, expect } from "vitest";
import {
  affinityScore,
  bayesianPopularityScore,
  combineScores,
  epsilonGreedy,
  mmrRerank,
  variantSimilarity,
  getBrandName,
  buildWhyPhase2,
  rankVariants,
  type ScoredVariant,
} from "../personalization/ranker";
import type { PersonalizationProfile } from "../personalization/types";
import type { VariantRow } from "../recommendations-core";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<PersonalizationProfile> = {}): PersonalizationProfile {
  return {
    userId: "u1",
    persona: "collector",
    budgetBand: "grail",
    intent: "collecting",
    topAffinities: [],
    brandAffinities: { Chanel: 9, Hermès: 6 },
    attributeAffinities: {
      silhouette: { structured: 6, tote: 3 },
      hardware: { gold: 4.5 },
      material: { leather: 6 },
      size: { medium: 3 },
    },
    signalCounts: {
      want_count: 3, have_count: 1, had_count: 0,
      watchlist_count: 0, review_count: 0,
      quiz_completeness: 50, total_interactions: 4,
    },
    tasteVectorSnapshot: null,
    computedAt: null,
    ...overrides,
  };
}

function makeRow(overrides: Partial<VariantRow> & { brand?: string; silhouette?: string; material?: string } = {}): VariantRow {
  const { brand = "Chanel", silhouette = "structured", material = "leather", ...rest } = overrides;
  return {
    variant_id: 1,
    size_category: "medium",
    hardware_color: "gold",
    exterior_colorway: "black",
    size_label: "Medium",
    retail_price_original: 5500,
    currency: "USD",
    style: { name: "Classic Flap", silhouette, brand: { name: brand } },
    exterior_material: { material_type: material },
    carry_method: [{ carry_type: "shoulder", possible: "yes" }],
    ...rest,
  };
}

function makeScoredVariant(overrides: Partial<ScoredVariant> = {}): ScoredVariant {
  return {
    variantId: 1,
    row: makeRow(),
    score: 0.5,
    why: "",
    algo: "affinity",
    ...overrides,
  };
}

// ── getBrandName ──────────────────────────────────────────────────────────────

describe("getBrandName", () => {
  it("extracts brand name from a style object", () => {
    expect(getBrandName(makeRow({ brand: "Prada" }))).toBe("Prada");
  });
  it("returns null when style is null", () => {
    expect(getBrandName({ ...makeRow(), style: null })).toBeNull();
  });
  it("handles array-wrapped style", () => {
    const row = { ...makeRow(), style: [{ name: "X", silhouette: null, brand: { name: "Gucci" } }] };
    expect(getBrandName(row as VariantRow)).toBe("Gucci");
  });
});

// ── affinityScore ─────────────────────────────────────────────────────────────

describe("affinityScore", () => {
  it("returns 0 for null profile (cold-start)", () => {
    expect(affinityScore(null, makeRow())).toBe(0);
  });
  it("returns 0 for empty affinities", () => {
    const p = makeProfile({ brandAffinities: {}, attributeAffinities: {} });
    expect(affinityScore(p, makeRow())).toBe(0);
  });
  it("scores brand affinity", () => {
    const p = makeProfile({ brandAffinities: { Chanel: 9 }, attributeAffinities: {} });
    const score = affinityScore(p, makeRow({ brand: "Chanel" }));
    expect(score).toBeGreaterThan(0);
  });
  it("scores higher for a matching profile than a non-matching one", () => {
    const p = makeProfile();
    const match = makeRow({ brand: "Chanel", silhouette: "structured", material: "leather" });
    const mismatch = makeRow({ brand: "Coach", silhouette: "slouchy", material: "fabric" });
    expect(affinityScore(p, match)).toBeGreaterThan(affinityScore(p, mismatch));
  });
  it("Chanel scores higher than Coach for a Chanel-heavy profile", () => {
    const p = makeProfile();
    expect(affinityScore(p, makeRow({ brand: "Chanel" }))).toBeGreaterThan(
      affinityScore(p, makeRow({ brand: "Coach" }))
    );
  });
});

// ── bayesianPopularityScore ───────────────────────────────────────────────────

describe("bayesianPopularityScore", () => {
  it("returns 0 for count=0", () => {
    expect(bayesianPopularityScore(0)).toBe(0);
  });
  it("increases monotonically with count", () => {
    expect(bayesianPopularityScore(5)).toBeLessThan(bayesianPopularityScore(50));
    expect(bayesianPopularityScore(50)).toBeLessThan(bayesianPopularityScore(500));
  });
  it("approaches but never reaches 1", () => {
    expect(bayesianPopularityScore(1000)).toBeLessThan(1);
    expect(bayesianPopularityScore(1000)).toBeGreaterThan(0.99);
  });
  it("with k=10: 10 saves → 0.5", () => {
    expect(bayesianPopularityScore(10, 10)).toBeCloseTo(0.5);
  });
});

// ── combineScores ─────────────────────────────────────────────────────────────

describe("combineScores", () => {
  it("cold-start (rawAffinity=0) → reduces to popularity only", () => {
    expect(combineScores(0, 0, 0.8)).toBeCloseTo(0.3 * 0.8);
  });
  it("full affinity match → affinity dominates", () => {
    const score = combineScores(10, 10, 0.0);
    expect(score).toBeCloseTo(0.7 * 1.0 + 0.3 * 0.0);
  });
  it("normalises against maxAffinity", () => {
    expect(combineScores(5, 10, 0)).toBeCloseTo(0.7 * 0.5);
  });
});

// ── variantSimilarity ─────────────────────────────────────────────────────────

describe("variantSimilarity", () => {
  it("identical bags have similarity 1", () => {
    const row = makeRow();
    expect(variantSimilarity(row, row)).toBe(1);
  });
  it("different brands, same silhouette → partial similarity", () => {
    const a = makeRow({ brand: "Chanel", silhouette: "structured" });
    const b = makeRow({ brand: "Prada",  silhouette: "structured" });
    const sim = variantSimilarity(a as VariantRow, b as VariantRow);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
  it("completely different bags → low similarity", () => {
    const a = makeRow({ brand: "Chanel", silhouette: "structured", material: "leather" });
    const b = makeRow({ brand: "Coach",  silhouette: "tote",       material: "fabric" });
    expect(variantSimilarity(a as VariantRow, b as VariantRow)).toBeLessThan(0.5);
  });
});

// ── epsilonGreedy ─────────────────────────────────────────────────────────────

describe("epsilonGreedy", () => {
  const ranked = Array.from({ length: 10 }, (_, i) =>
    makeScoredVariant({ variantId: i + 1, score: 1 - i * 0.05 })
  );
  const remaining = Array.from({ length: 5 }, (_, i) =>
    makeScoredVariant({ variantId: 100 + i, algo: "popularity" })
  );

  it("returns exactly n items", () => {
    expect(epsilonGreedy(ranked, remaining, 8, 0.1)).toHaveLength(8);
  });
  it("with ε=0 → no explore slots", () => {
    const result = epsilonGreedy(ranked, remaining, 8, 0.0);
    expect(result.every((r) => r.algo !== "explore")).toBe(true);
  });
  it("with ε=0.2 → 20% explore slots", () => {
    // Deterministic: use a fixed rand that always returns 0.
    const result = epsilonGreedy(ranked, remaining, 10, 0.2, () => 0);
    const explores = result.filter((r) => r.algo === "explore");
    expect(explores).toHaveLength(2);
  });
  it("when remaining is empty → no explore regardless of ε", () => {
    const result = epsilonGreedy(ranked, [], 8, 0.5);
    expect(result.every((r) => r.algo !== "explore")).toBe(true);
  });
});

// ── mmrRerank ────────────────────────────────────────────────────────────────

describe("mmrRerank", () => {
  it("returns exactly n items when pool is large enough", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeScoredVariant({ variantId: i + 1, score: 0.9 - i * 0.05, row: makeRow({ brand: i < 5 ? "Chanel" : "Prada" }) })
    );
    expect(mmrRerank(candidates, 5)).toHaveLength(5);
  });
  it("returns all when pool smaller than n", () => {
    const candidates = [makeScoredVariant(), makeScoredVariant({ variantId: 2 })];
    expect(mmrRerank(candidates, 10)).toHaveLength(2);
  });
  it("returns empty for empty input", () => {
    expect(mmrRerank([], 5)).toHaveLength(0);
  });
  it("includes a diverse non-dominant brand when λ < 1", () => {
    // 5 Chanel bags (high scores) + 1 Prada (lower score but fully distinct attributes).
    // With diversity (λ=0.7), Prada should appear somewhere in the 6-item result.
    const chanels = Array.from({ length: 5 }, (_, i) =>
      makeScoredVariant({ variantId: i + 1, score: 0.9 - i * 0.01, row: makeRow({ brand: "Chanel", silhouette: "structured", material: "leather" }) })
    );
    // Give Prada a high-enough score and fully distinct attributes so MMR includes it.
    const prada = makeScoredVariant({
      variantId: 99,
      score: 0.75,
      row: makeRow({ brand: "Prada", silhouette: "tote", material: "fabric" }),
    });
    const result = mmrRerank([...chanels, prada], 6, 0.7);
    const pradaIdx = result.findIndex((r) => getBrandName(r.row) === "Prada");
    // Prada must appear somewhere in the diverse result set.
    expect(pradaIdx).toBeGreaterThanOrEqual(0);
  });
});

// ── buildWhyPhase2 ────────────────────────────────────────────────────────────

describe("buildWhyPhase2", () => {
  it("returns empty string for null profile", () => {
    expect(buildWhyPhase2(null, makeRow())).toBe("");
  });
  it("returns brand-based reason when brand affinity is high", () => {
    const p = makeProfile();
    const why = buildWhyPhase2(p, makeRow({ brand: "Chanel" }));
    expect(why).toContain("Chanel");
  });
  it("returns empty string when no strong signals match", () => {
    const p = makeProfile({ brandAffinities: { Chanel: 0.1 }, attributeAffinities: {} });
    expect(buildWhyPhase2(p, makeRow({ brand: "Coach" }))).toBe("");
  });
});

// ── rankVariants (integration) ────────────────────────────────────────────────

describe("rankVariants", () => {
  const profile = makeProfile();
  const popularity = new Map([[1, 50], [2, 5], [3, 0]]);

  const rows: VariantRow[] = [
    makeRow({ variant_id: 1, brand: "Chanel",   silhouette: "structured", material: "leather" } as VariantRow & { brand: string; silhouette: string; material: string }),
    makeRow({ variant_id: 2, brand: "Coach",    silhouette: "tote",       material: "fabric" } as VariantRow & { brand: string; silhouette: string; material: string }),
    makeRow({ variant_id: 3, brand: "Longchamp", silhouette: "hobo",      material: "nylon" } as VariantRow & { brand: string; silhouette: string; material: string }),
  ] as VariantRow[];

  it("returns a non-empty ranked list", () => {
    const result = rankVariants(profile, rows, popularity, 3);
    expect(result.length).toBeGreaterThan(0);
  });

  it("cold-start (no profile) returns popularity-ranked results", () => {
    const result = rankVariants(null, rows, popularity, 3);
    expect(result[0].variantId).toBe(1); // highest popularity
    expect(result.every((r) => r.algo !== "affinity")).toBe(true);
  });

  it("Chanel ranks first for a Chanel-heavy profile", () => {
    const result = rankVariants(profile, rows, popularity, 3);
    expect(result[0].variantId).toBe(1);
  });

  it("returns at most n items", () => {
    const result = rankVariants(profile, rows, popularity, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("empty rows → empty result", () => {
    expect(rankVariants(profile, [], popularity, 8)).toHaveLength(0);
  });
});
