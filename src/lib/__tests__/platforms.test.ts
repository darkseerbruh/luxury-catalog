import { describe, it, expect } from "vitest";
import { estimateLandedCost, PLATFORMS } from "../platforms";

describe("estimateLandedCost", () => {
  it("fixed-price resale: price + free shipping, no premium", () => {
    const c = estimateLandedCost(5000, "therealreal");
    expect(c).toMatchObject({ price: 5000, buyerPremium: 0, buyerProtection: 0, shipping: 0, total: 5000, excludesSalesTax: true });
  });

  it("Vestiaire adds a buyer-protection fee + shipping", () => {
    const c = estimateLandedCost(5000, "vestiaire");
    expect(c.buyerProtection).toBe(500); // 10%
    expect(c.shipping).toBe(15);
    expect(c.total).toBe(5515);
  });

  it("auction adds a buyer's premium", () => {
    const c = estimateLandedCost(10000, "auction");
    expect(c.buyerPremium).toBe(2600); // 26%
    expect(c.total).toBe(10000 + 2600 + 60);
  });

  it("unknown platform falls back to price only", () => {
    expect(estimateLandedCost(1000, "nope").total).toBe(1000);
  });

  it("every platform declares auth + returns", () => {
    for (const p of Object.values(PLATFORMS)) {
      expect(p.authNote).toBeTruthy();
      expect(p.returns).toBeTruthy();
    }
  });
});
