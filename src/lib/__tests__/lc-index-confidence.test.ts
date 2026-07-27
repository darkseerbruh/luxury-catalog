import { describe, it, expect } from "vitest";
import { LC_INDEX_CONFIDENCE_K, LC_INDEX_WEIGHTS } from "../lc-index";

/**
 * The shrinkage is the fix for a ranking that put a 24-observation bag above the
 * Birkin. These pin the behaviour that matters rather than the arithmetic.
 */
function shrink(rawScore: number, n: number): number {
  const c = n / (n + LC_INDEX_CONFIDENCE_K);
  return rawScore * c + 50 * (1 - c);
}

describe("LC Index confidence shrinkage", () => {
  it("pulls a thin-evidence high scorer down toward the middle", () => {
    // The Souplissimo case: a near-perfect score on 24 observations.
    expect(shrink(95, 24)).toBeLessThan(70);
  });

  it("barely touches a deeply observed bag", () => {
    // The Classic Flap sits at 2,705 observations, so its score is its own.
    expect(shrink(80, 2705)).toBeGreaterThan(78);
  });

  it("lets deep evidence beat thin evidence at the same raw score", () => {
    // This is the whole point: percentiles alone could not tell these apart.
    expect(shrink(90, 1529)).toBeGreaterThan(shrink(90, 24));
  });

  it("does not let shrinkage flip a genuinely better bag", () => {
    // A far better bag with decent evidence still wins. Shrinkage damps, never inverts.
    expect(shrink(90, 400)).toBeGreaterThan(shrink(60, 3000));
  });

  it("keeps the midpoint neutral, so shrinking never invents standing", () => {
    expect(shrink(50, 1)).toBeCloseTo(50, 5);
  });

  it("keeps the weights summing to 1, so the score stays a percentile", () => {
    const sum = LC_INDEX_WEIGHTS.price + LC_INDEX_WEIGHTS.trade + LC_INDEX_WEIGHTS.scarcity;
    expect(sum).toBeCloseTo(1, 5);
  });
});
