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

/**
 * Slug-reconstructed titles (2026-07-09): titles rebuilt from source_url slugs have
 * every separator flattened to a space ("d-lite" -> "d lite", "2.55" -> "2 55"), which
 * made punctuated model tokens unmatchable and over-flagged the mis-map re-triage.
 * Separators (space/hyphen/dot/slash) are now interchangeable in token matching.
 */
describe("canonicalModel — separator-flattened slug titles", () => {
  it("matches punctuated model tokens with separators flattened to spaces", () => {
    expect(canonicalModel("Dior", "dior lady d lite medium black cannage embroidered tote")).toBe("Lady D-Lite");
    expect(canonicalModel("Chanel", "chanel 2 55 quilted aged calfskin shoulder bag")).toBe("Reissue");
    expect(canonicalModel("Hermès", "hermes bride a brac pm toile case")).toBe("Bride-a-Brac");
    expect(canonicalModel("Louis Vuitton", "louis vuitton pont neuf pm epi leather")).toBe("Pont-Neuf");
  });

  it("still matches the original punctuated forms", () => {
    expect(canonicalModel("Dior", "Dior Lady D-Lite Medium Cannage Tote")).toBe("Lady D-Lite");
    expect(canonicalModel("Chanel", "Chanel 2.55 Reissue 226 Aged Calfskin")).toBe("Reissue");
  });

  it("matches digit tokens whose separators were dropped entirely in the slug", () => {
    // "2.55" -> "255" and "24/24" -> "2424" in TLC slugs.
    expect(canonicalModel("Chanel", "chanel vintage 255 black leather shoulder bag")).toBe("Reissue");
    expect(canonicalModel("Hermès", "hermes sesame canvas swift leather 2424 35 bag")).toBe("24/24");
    // ...but never inside a longer digit run or across letter-digit joins:
    expect(canonicalModel("Chanel", "chanel 2551 style number bag")).toBeNull();
    expect(canonicalModel("Chanel", "chanel 255 flap bag")).not.toBe("Chanel 25");
  });

  it("routes 2.55/reissue Wallet on Chain titles to WOC, not Reissue", () => {
    expect(canonicalModel("Chanel", "chanel 255 wallet on chain black quilted leather")).toBe("Wallet on Chain");
    expect(canonicalModel("Chanel", "Chanel Reissue 2.55 Wallet on Chain So Black")).toBe("Wallet on Chain");
  });

  it("does not SLG-gate the Multi Pochette Accessoires (a bag, not a pochette SLG)", () => {
    expect(
      canonicalModel("Louis Vuitton", "louis vuitton multi pochette accessories khaki monogram canvas bag"),
    ).toBe("Multi Pochette");
  });

  it("keeps word boundaries so flexible separators can't fire inside words", () => {
    // "carry all in ..." must resolve to CarryAll, not have "all in" claim All-In.
    expect(canonicalModel("Louis Vuitton", "louis vuitton carry all mm monogram tote")).toBe("CarryAll");
    expect(canonicalModel("Louis Vuitton", "louis vuitton all in bandouliere gm tote")).toBe("All-In");
  });
});
