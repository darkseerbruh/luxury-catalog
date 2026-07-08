import { describe, it, expect } from "vitest";
import {
  computeHouseStanding,
  tierForScore,
  percentileOf,
  HOUSE_STANDING_MIN_N,
  type BrandSignals,
} from "../house-standing";

describe("percentileOf", () => {
  it("returns 0 for an empty population", () => {
    expect(percentileOf(5, [])).toBe(0);
  });
  it("the max of the set is 100; ties share a percentile", () => {
    expect(percentileOf(10, [1, 2, 10])).toBeCloseTo(100);
    expect(percentileOf(2, [2, 2, 2, 2])).toBeCloseTo(100);
    expect(percentileOf(1, [1, 2, 3, 4])).toBeCloseTo(25);
  });
});

describe("tierForScore", () => {
  it("maps scores to numbered bands (highest cutoff wins)", () => {
    expect(tierForScore(98)).toBe(1);
    expect(tierForScore(90)).toBe(1);
    expect(tierForScore(80)).toBe(2);
    expect(tierForScore(60)).toBe(3);
    expect(tierForScore(40)).toBe(4);
    expect(tierForScore(10)).toBe(5);
    expect(tierForScore(0)).toBe(5);
  });
});

describe("computeHouseStanding", () => {
  const many = (n: number) => n; // readability for tradeCount

  it("places only houses at/above the n-gate; others get tier null", () => {
    const signals: BrandSignals[] = [
      { brandId: 1, name: "Placed", resaleMedian: 5000, ceiling: 8000, tradeCount: many(HOUSE_STANDING_MIN_N) },
      { brandId: 2, name: "TooFewPrices", resaleMedian: 4000, ceiling: 6000, tradeCount: HOUSE_STANDING_MIN_N - 1 },
      { brandId: 3, name: "NoMedian", resaleMedian: null, ceiling: null, tradeCount: 500 },
    ];
    const out = computeHouseStanding(signals);
    const byName = Object.fromEntries(out.map((o) => [o.name, o]));
    expect(byName["Placed"].tier).not.toBeNull();
    expect(byName["Placed"].score).not.toBeNull();
    expect(byName["TooFewPrices"].tier).toBeNull();
    expect(byName["TooFewPrices"].score).toBeNull();
    expect(byName["NoMedian"].tier).toBeNull();
  });

  it("orders by score desc, and the highest-median house lands Tier 1", () => {
    const signals: BrandSignals[] = [
      { brandId: 1, name: "Apex", resaleMedian: 8000, ceiling: 25000, tradeCount: 9000 },
      { brandId: 2, name: "High", resaleMedian: 2500, ceiling: 4000, tradeCount: 4000 },
      { brandId: 3, name: "Mid", resaleMedian: 1300, ceiling: 2300, tradeCount: 7000 },
      { brandId: 4, name: "Low", resaleMedian: 200, ceiling: 400, tradeCount: 400 },
      { brandId: 5, name: "Entry", resaleMedian: 100, ceiling: 160, tradeCount: 150 },
    ];
    const out = computeHouseStanding(signals);
    expect(out.map((o) => o.name)).toEqual(["Apex", "High", "Mid", "Low", "Entry"]);
    expect(out[0].tier).toBe(1); // top median + top ceiling → Tier 1
    // scores are monotonic non-increasing
    const scores = out.map((o) => o.score as number);
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
  });

  it("ceiling falls back to median when p90 is missing (never nulls a placed house)", () => {
    const signals: BrandSignals[] = [
      { brandId: 1, name: "A", resaleMedian: 3000, ceiling: null, tradeCount: 100 },
      { brandId: 2, name: "B", resaleMedian: 1000, ceiling: 2000, tradeCount: 100 },
    ];
    const out = computeHouseStanding(signals);
    expect(out.every((o) => o.score != null)).toBe(true);
  });
});
