import { describe, it, expect } from "vitest";
import { claimScore, isClaimLive } from "../claims";

describe("claimScore", () => {
  it("ranks a clean claim above a contested one with more agrees", () => {
    // 100/90 is contested, not popular. 40/2 is a claim people actually stand behind.
    expect(claimScore(40, 2)).toBeGreaterThan(claimScore(100, 90));
  });

  it("is zero with no votes", () => {
    expect(claimScore(0, 0)).toBe(0);
  });

  it("goes negative when disagreement wins", () => {
    expect(claimScore(2, 20)).toBeLessThan(0);
  });

  it("rewards volume when the ratio holds", () => {
    expect(claimScore(80, 4)).toBeGreaterThan(claimScore(20, 1));
  });
});

describe("isClaimLive", () => {
  it("keeps a claim nobody has voted on", () => {
    expect(isClaimLive({ agree: 0, disagree: 0, stale: 0 })).toBe(true);
  });

  it("retires a decisively rejected claim", () => {
    expect(isClaimLive({ agree: 3, disagree: 12, stale: 0 })).toBe(false);
  });

  it("will not let a couple of grumpy votes bury a claim", () => {
    // Ratio is bad but the sample is tiny, so it stays up.
    expect(isClaimLive({ agree: 1, disagree: 3, stale: 0 })).toBe(true);
  });

  it("retires a claim the crowd flags as out of date", () => {
    expect(isClaimLive({ agree: 4, disagree: 0, stale: 9 })).toBe(false);
  });

  it("keeps a still-endorsed claim despite some stale flags", () => {
    expect(isClaimLive({ agree: 50, disagree: 2, stale: 6 })).toBe(true);
  });
});
