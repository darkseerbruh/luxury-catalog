import { describe, it, expect } from "vitest";
import { isTrrHandbagListing } from "./trr";

/**
 * TRR non-handbag ingest filter (2026-07-10). A broad brand keyword search on TRR
 * returns that house's apparel / shoes / jewelry / watches / accessories alongside its
 * bags; those rows can never resolve to a bag style (the SLG/apparel gate refuses them)
 * so they used to sit unpromotable in discovered_listing forever and bloat the promotion
 * scan. isTrrHandbagListing reads the department out of the product URL path and keeps
 * only bags + carried pouches. URLs below are real TRR product-path shapes.
 */
const P = "https://www.therealreal.com/products";

describe("isTrrHandbagListing — keeps bags", () => {
  it("keeps every handbag subcategory", () => {
    for (const sub of ["shoulder-bags", "crossbody-bags", "totes", "satchels", "top-handle-bags", "clutches", "mini-bags", "handle-bags"]) {
      expect(isTrrHandbagListing(`${P}/women/handbags/${sub}/chanel-quilted-flap-abc12`)).toBe(true);
    }
  });

  it("keeps men's bags (/men/bags/…)", () => {
    expect(isTrrHandbagListing(`${P}/men/bags/messenger-bags/gucci-gg-messenger-xy9`)).toBe(true);
  });

  it("keeps a URL with no department signal (lets the SLG/model gate decide)", () => {
    expect(isTrrHandbagListing(`${P}/chanel-classic-double-flap-abc12`)).toBe(true);
    expect(isTrrHandbagListing("")).toBe(true);
    expect(isTrrHandbagListing(null)).toBe(true);
  });
});

describe("isTrrHandbagListing — drops non-bags", () => {
  it("drops apparel & footwear", () => {
    expect(isTrrHandbagListing(`${P}/women/clothing/tops/celine-graphic-print-crew-neck-t-shirt-u01`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/women/clothing/blazers/gucci-wool-blazer-u02`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/women/shoes/flats/chanel-interlocking-cc-ballet-flats-u03`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/men/shoes/sneakers/saint-laurent-leather-sneakers-u04`)).toBe(false);
  });

  it("drops jewelry (department is gender-less on TRR) and watches", () => {
    expect(isTrrHandbagListing(`${P}/jewelry/bracelets/cartier-love-bracelet-u05`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/jewelry/necklaces/chanel-cc-pendant-u06`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/women/watches/cartier-tank-u07`)).toBe(false);
  });

  it("drops accessories: belts, scarves, sunglasses, straps", () => {
    expect(isTrrHandbagListing(`${P}/men/accessories/belts/hermes-h-belt-kit-u08`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/women/accessories/scarves-and-wraps/hermes-silk-scarf-u09`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/women/accessories/sunglasses/celine-oversize-sunglasses-u10`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/women/accessories/bag-straps/louis-vuitton-strap-u11`)).toBe(false);
  });

  it("drops home & kids", () => {
    expect(isTrrHandbagListing(`${P}/home/decor-and-accessories/hermes-ashtray-u12`)).toBe(false);
    expect(isTrrHandbagListing(`${P}/kids/girls/dresses/dior-girls-dress-u13`)).toBe(false);
  });

  it("does NOT let a bag-word slug false-positive a non-bag category", () => {
    // slug contains "belt-bag" but the department is accessories/belts (a plain belt) —
    // exact-segment matching means the slug text can't override the category.
    expect(isTrrHandbagListing(`${P}/women/accessories/belts/gucci-gg-belt-with-bag-charm-u14`)).toBe(false);
  });
});

describe("isTrrHandbagListing — carried-pouch override keeps ranked pouches", () => {
  it("keeps a WOC / vanity / belt bag even when filed under accessories", () => {
    expect(isTrrHandbagListing(`${P}/women/accessories/wallets/chanel-wallet-on-chain-u15`, "Chanel Caviar Wallet on Chain")).toBe(true);
    expect(isTrrHandbagListing(`${P}/women/accessories/misc/louis-vuitton-belt-bag-u16`, "Louis Vuitton Bumbag Belt Bag")).toBe(true);
  });

  it("still drops a plain wallet (no bag-override token)", () => {
    expect(isTrrHandbagListing(`${P}/women/accessories/wallets/gucci-continental-wallet-u17`, "Gucci GG Continental Wallet")).toBe(false);
  });
});
