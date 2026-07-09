import { describe, it, expect } from "vitest";
import { canonicalModel } from "./model-normalize";

/**
 * "Timeless" mis-mapping regression (2026-07-09): TLC labels Chanel's whole classic
 * CC-turnlock line "Timeless", so bare `timeless` filed clutches / totes / phone
 * cases under Classic Flap — a $966 handcuff clutch became the Classic Flap hero.
 * Titles below are REAL listing slugs from price_history rows found on variant 199.
 */
describe("canonicalModel — Chanel 'Timeless' line", () => {
  it("does NOT map non-flap Timeless pieces to Classic Flap", () => {
    expect(
      canonicalModel("Chanel", "Chanel Timeless Handcuff Beige/Black Cube Quilted Nubuck Leather Clutch"),
    ).toBeNull();
    expect(canonicalModel("Chanel", "Chanel Yellow Calfskin Timeless Pochette Phone Case")).toBeNull();
    expect(canonicalModel("Chanel", "Chanel CC Black Patent Timeless Shopping Tote GHW")).toBeNull();
    expect(
      canonicalModel("Chanel", "Chanel Black Leather Vintage Timeless Flap Clutch with Chain"),
    ).toBeNull();
    expect(canonicalModel("Chanel", "Chanel Yellow Caviar Leather Timeless Pochette Shoulder Bag")).toBeNull();
  });

  it("still maps flap-shaped Timeless titles to Classic Flap", () => {
    expect(canonicalModel("Chanel", "Chanel Timeless Medium Double Flap Bag Black Caviar")).toBe("Classic Flap");
    expect(canonicalModel("Chanel", "Chanel Vintage Timeless CC Jumbo Flap Bag Black Caviar")).toBe("Classic Flap");
    expect(canonicalModel("Chanel", "Chanel Classic Flap Jumbo Single Flap")).toBe("Classic Flap");
  });

  it("leaves bare 'timeless' without a flap signal unmatched (shape is ambiguous)", () => {
    // TLC's "Timeless CC shoulder bag" is usually a quilted shopper, not the flap.
    expect(canonicalModel("Chanel", "Chanel Red Leather Timeless CC Shoulder Bag")).toBeNull();
    expect(canonicalModel("Chanel", "Chanel Black Calf Leather Timeless Shoulder Bag")).toBeNull();
  });

  it("lets later dictionary models win over the timeless catch-all", () => {
    expect(canonicalModel("Chanel", "Chanel Timeless Wallet on Chain Black Caviar")).toBe("Wallet on Chain");
    expect(canonicalModel("Chanel", "Chanel Timeless Vanity Case Top Handle")).toBe("Vanity Case");
    expect(canonicalModel("Chanel", "Chanel Timeless CC Camera Bag")).toBe("Camera Bag");
  });
});
