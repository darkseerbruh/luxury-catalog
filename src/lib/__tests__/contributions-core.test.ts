import { describe, it, expect } from "vitest";
import {
  deriveTier,
  canAutoPublish,
  photoPoints,
  reversalPoints,
  CURATOR_POINTS,
  TIER_META,
  type TierInputs,
} from "../contributions-core";

const base: TierInputs = {
  hasCloset: false,
  approvedPhotos: 0,
  points: 0,
  isAuthenticator: false,
};

describe("deriveTier", () => {
  it("defaults a brand-new signup to aficionado", () => {
    expect(deriveTier(base)).toBe("aficionado");
  });

  it("becomes a collector once they keep a closet", () => {
    expect(deriveTier({ ...base, hasCloset: true })).toBe("collector");
  });

  it("becomes a connoisseur once a photo is approved (outranks collector)", () => {
    expect(deriveTier({ ...base, hasCloset: true, approvedPhotos: 1 })).toBe("connoisseur");
  });

  it("authenticator flag outranks earned progress", () => {
    expect(
      deriveTier({ ...base, hasCloset: true, approvedPhotos: 9, isAuthenticator: true }),
    ).toBe("authenticator");
  });

  it("an authenticator with enough points is a curator", () => {
    expect(
      deriveTier({ ...base, isAuthenticator: true, points: CURATOR_POINTS }),
    ).toBe("curator");
  });

  it("points alone never reach curator without the flag", () => {
    expect(deriveTier({ ...base, points: CURATOR_POINTS * 10 })).toBe("aficionado");
  });

  it("every tier has metadata with a distinct rank", () => {
    const ranks = Object.values(TIER_META).map((m) => m.rank);
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});

describe("canAutoPublish", () => {
  it("only trusted tiers (authenticator/admin) skip the queue", () => {
    expect(canAutoPublish({ isAuthenticator: false })).toBe(false);
    expect(canAutoPublish({ isAuthenticator: true })).toBe(true);
    expect(canAutoPublish({ isAuthenticator: false, isAdmin: true })).toBe(true);
  });
});

describe("photoPoints (rarity weighting)", () => {
  it("rewards the first photo of an uncovered bag the most", () => {
    expect(photoPoints(0)).toBe(20);
  });

  it("decreases monotonically as a bag gets more coverage", () => {
    const series = [0, 1, 3, 6].map(photoPoints);
    for (let i = 1; i < series.length; i++) {
      expect(series[i]).toBeLessThan(series[i - 1]);
    }
  });
});

describe("reversalPoints", () => {
  it("reverses exactly what was awarded", () => {
    expect(reversalPoints(20)).toBe(-20);
  });

  it("never produces a positive reversal", () => {
    expect(reversalPoints(-5)).toBe(0);
    expect(reversalPoints(0)).toBe(0);
  });
});
