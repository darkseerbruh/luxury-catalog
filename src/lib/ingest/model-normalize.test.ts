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

/**
 * Line-token vs shape collisions (2026-07-09, second owner report): a red Coco Boy
 * CAMERA case was fronting the Boy page. Titles below are real TLC slugs found
 * sitting on Boy / Chanel 19 / Trendy CC variants.
 */
describe("canonicalModel — Chanel line tokens don't swallow the shape", () => {
  it("routes WOCs styled after a line to Wallet on Chain", () => {
    expect(canonicalModel("Chanel", "Chanel Metallic Grey Quilted Patent Leather Classic Boy WOC Bag")).toBe("Wallet on Chain");
    expect(canonicalModel("Chanel", "Chanel 19 Orange Quilted Leather Wallet on Chain")).toBe("Wallet on Chain");
    expect(canonicalModel("Chanel", "Chanel Trendy CC WOC Black Lambskin Leather")).toBe("Wallet on Chain");
  });

  it("routes Coco Boy camera cases to Camera Bag", () => {
    expect(canonicalModel("Chanel", "Chanel Coco Boy Camera Bordeaux Lambskin Leather Shoulder Bag")).toBe("Camera Bag");
  });

  it("keeps real Boy bags on Boy", () => {
    expect(canonicalModel("Chanel", "Chanel Light Blue Patent and Leather Medium Classic Boy Flap Bag")).toBe("Boy");
    expect(canonicalModel("Chanel", "Chanel Black Quilted Lambskin Large Boy Bag Ruthenium Hardware")).toBe("Boy");
  });
});

/**
 * Cross-model title collisions OUTSIDE Chanel (2026-07-09, round-3 audit): titles that
 * carry TWO model names were filed under whichever token the dictionary checks first.
 * Every title below is a real TLC/Fashionphile slug pulled from the mis-filed rows.
 */
describe("canonicalModel — non-Chanel cross-model collisions", () => {
  it("routes 'bamboo diana' titles to Diana (the bamboo handle IS the Diana's signature)", () => {
    expect(canonicalModel("Gucci", "gucci black leather small bamboo diana tote")).toBe("Diana");
    expect(canonicalModel("Gucci", "gucci diana bamboo tote bag brown leather")).toBe("Diana");
    expect(canonicalModel("Gucci", "gucci brown bamboo and coated canvas diana tote and shoulder bag")).toBe("Diana");
  });

  it("keeps Diana-less bamboo bags on Bamboo 1947", () => {
    expect(canonicalModel("Gucci", "gucci bamboo 1947 small red leather top handle bag")).toBe("Bamboo 1947");
  });

  it("routes Marmont/Ophidia belt bags to Belt Bag (shape beats line when the shape is its own style)", () => {
    expect(canonicalModel("Gucci", "gucci gg marmont mini red matelasse leather belt bag")).toBe("Belt Bag");
    expect(canonicalModel("Gucci", "gucci ophidia brown coated canvas and leather flap gg belt bag")).toBe("Belt Bag");
  });

  it("keeps non-belt Marmont and Ophidia bags on their line styles", () => {
    expect(canonicalModel("Gucci", "gucci gg marmont small black matelasse leather shoulder bag")).toBe("GG Marmont");
    expect(canonicalModel("Gucci", "gucci ophidia gg supreme canvas small shoulder bag")).toBe("Ophidia");
  });

  it("keeps Selleria-construction Peekaboos/Baguettes on their shape model (Selleria is a construction, not a model)", () => {
    expect(canonicalModel("Fendi", "fendi selleria peekaboo i see u medium")).toBe("Peekaboo");
    expect(canonicalModel("Fendi", "fendi selleria baguette bag white calf leather size medium")).toBe("Baguette");
    // shape-less vintage Selleria pieces still resolve to the Selleria line style
    expect(canonicalModel("Fendi", "fendi beige selleria leather satchel")).toBe("Selleria");
  });

  it("SLG-gates wristwatches (word-bounded 'watch' missed 'wristwatch')", () => {
    expect(
      canonicalModel("Fendi", "fendi selleria 8100m mother of pearl dial stainless steel leather womens wristwatch 37 mm"),
    ).toBeNull();
  });

  it("routes 'phantom luggage' titles to Phantom (its own model)", () => {
    expect(canonicalModel("Celine", "celine phantom luggage medium black leather tote")).toBe("Phantom");
    expect(canonicalModel("Celine", "celine luggage phantom grey python leather tote bag")).toBe("Phantom");
    expect(canonicalModel("Celine", "celine black leather micro luggage tote")).toBe("Luggage");
  });

  it("routes Triomphe-canvas cabas totes to Cabas", () => {
    expect(canonicalModel("Celine", "celine triomphe cabas tote bag tan pvc leather size medium")).toBe("Cabas");
    expect(canonicalModel("Celine", "celine vertical cabas triomphe canvas leather shoulder bag tote bag brown dark brown")).toBe("Cabas");
    expect(canonicalModel("Celine", "celine triomphe shoulder bag black calfskin leather")).toBe("Triomphe");
  });

  it("routes the New Wave Multi-Pochette to New Wave, not Multi Pochette Accessoires", () => {
    expect(canonicalModel("Louis Vuitton", "louis vuitton black leather new wave multi pochette")).toBe("New Wave");
    expect(
      canonicalModel("Louis Vuitton", "louis vuitton multi pochette accessories khaki monogram canvas bag"),
    ).toBe("Multi Pochette");
  });

  it("does not let 'cowboy' colourways trip the Chanel Boy token (Balenciaga-on-Boy brand mismap)", () => {
    const title = "balenciaga vegetable tanned lambskin mini rodeo top handle handbag tan cowboy 1825943";
    expect(canonicalModel("Chanel", title)).toBeNull();
    expect(canonicalModel("Balenciaga", title)).toBe("Rodeo");
    expect(
      canonicalModel("Balenciaga", "balenciaga vegetable tanned lambskin mini bel air carry all bag tan cowboy 1785540"),
    ).toBe("Bel Air");
  });
});
