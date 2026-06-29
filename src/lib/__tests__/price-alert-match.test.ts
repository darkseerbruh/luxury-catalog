import { describe, it, expect } from "vitest";
import { matchSpecAlert, candidateMatchesSpec, type SpecCandidate } from "../price-alert-match";

const comps = (n: number, base: number): { sale_price: number; date_recorded: string; currency: string | null }[] =>
  Array.from({ length: n }, (_, i) => ({ sale_price: base + i * 10, date_recorded: "2026-06-01", currency: "USD" }));

describe("candidateMatchesSpec", () => {
  it("matches a colour family", () => {
    expect(candidateMatchesSpec("Emerald", { colorFamily: "Green" })).toBe(true);
    expect(candidateMatchesSpec("Noir", { colorFamily: "Green" })).toBe(false);
  });
  it("matches anyColor for everything", () => {
    expect(candidateMatchesSpec("Noir", { anyColor: true })).toBe(true);
  });
});

describe("matchSpecAlert", () => {
  it("fires on a green variant below its median, ignores non-green", () => {
    const green: SpecCandidate = {
      variantId: 1,
      colorway: "Vert Cypres",
      // median 5000-ish; a fresh listing at 3000 is well below
      prices: [...comps(6, 5000), { sale_price: 3000, date_recorded: "2026-06-28", currency: "USD" }],
    };
    const black: SpecCandidate = {
      variantId: 2,
      colorway: "Noir",
      prices: [...comps(6, 5000), { sale_price: 1000, date_recorded: "2026-06-28", currency: "USD" }],
    };
    const hit = matchSpecAlert([green, black], { colorFamily: "Green" }, 10, null);
    expect(hit?.variantId).toBe(1);
    expect(hit?.price).toBe(3000);
  });

  it("returns null when the matching variant has too few comps", () => {
    const green: SpecCandidate = {
      variantId: 1,
      colorway: "Emerald",
      prices: [{ sale_price: 3000, date_recorded: "2026-06-28", currency: "USD" }],
    };
    expect(matchSpecAlert([green], { colorFamily: "Green" }, 10, null)).toBeNull();
  });

  it("respects the cutoff (already notified)", () => {
    const green: SpecCandidate = {
      variantId: 1,
      colorway: "Sage",
      prices: [...comps(6, 5000), { sale_price: 3000, date_recorded: "2026-06-01", currency: "USD" }],
    };
    expect(matchSpecAlert([green], { colorFamily: "Green" }, 10, "2026-06-15")).toBeNull();
  });
});
