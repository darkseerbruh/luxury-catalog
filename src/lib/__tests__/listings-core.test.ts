import { describe, it, expect } from "vitest";
import {
  computeFairValue,
  classifyDeal,
  rateListing,
  bestBand,
  bandLabel,
  isConfidentBasis,
  type SpecComp,
  type ItemSpec,
} from "../listings-core";

/** A comp fixture with sensible defaults. */
function comp(p: Partial<SpecComp>): SpecComp {
  return {
    salePrice: 5000,
    colorway: "black",
    material: "caviar",
    hardwareColor: "gold",
    productionYear: null,
    ...p,
  };
}

const blackCaviarGold: ItemSpec = {
  colorway: "black",
  material: "caviar",
  hardwareColor: "gold",
  productionYear: null,
};

describe("computeFairValue", () => {
  it("grades against the tightest spec bucket when it has enough comps", () => {
    const comps = [
      comp({ salePrice: 6800 }),
      comp({ salePrice: 7000 }),
      comp({ salePrice: 7200 }),
      comp({ salePrice: 7400 }),
      // a different spec that should NOT pull the median
      comp({ material: "lambskin", hardwareColor: "silver", salePrice: 4000 }),
    ];
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv).not.toBeNull();
    expect(fv.value).toBe(7100); // median of the four matching caviar/gold/black comps
    expect(fv.compCount).toBe(4);
    expect(fv.dimsUsed).toEqual(["material", "color", "hardware"]);
    expect(fv.broadened).toBe(false);
    expect(fv.variantLevel).toBe(false);
  });

  it("broadens by dropping hardware when the full bucket is too thin, and reports it", () => {
    // Only 2 black caviar GOLD comps (below MIN_SPEC_COMPS=4), but plenty of black caviar
    // across hardware → should broaden to material+color and flag hardware dropped.
    const comps = [
      comp({ hardwareColor: "gold", salePrice: 7000 }),
      comp({ hardwareColor: "gold", salePrice: 7200 }),
      comp({ hardwareColor: "silver", salePrice: 6600 }),
      comp({ hardwareColor: "silver", salePrice: 6800 }),
      comp({ hardwareColor: "ruthenium", salePrice: 6400 }),
    ];
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv.dimsUsed).toEqual(["material", "color"]);
    expect(fv.dimsDropped).toContain("hardware");
    expect(fv.broadened).toBe(true);
    expect(fv.variantLevel).toBe(false);
    expect(fv.compCount).toBe(5);
  });

  it("falls back to variant-level (every comp) when no spec bucket is dense enough", () => {
    const comps = [
      comp({ material: "lambskin", colorway: "burgundy", hardwareColor: "silver", salePrice: 4500 }),
      comp({ material: "tweed", colorway: "ecru", hardwareColor: "gold", salePrice: 5500 }),
      comp({ material: "jersey", colorway: "navy", hardwareColor: "silver", salePrice: 5000 }),
    ];
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv.variantLevel).toBe(true);
    expect(fv.broadened).toBe(true);
    expect(fv.dimsUsed).toEqual([]);
    expect(fv.value).toBe(5000);
  });

  it("returns null when even the variant-level pool is too thin", () => {
    expect(computeFairValue(blackCaviarGold, [comp({})])).toBeNull();
    expect(computeFairValue(blackCaviarGold, [])).toBeNull();
  });

  it("ignores comps with non-positive prices", () => {
    const comps = [
      comp({ salePrice: 0 }),
      comp({ salePrice: -10 }),
      comp({ salePrice: 7000 }),
      comp({ salePrice: 7000 }),
    ];
    // Only 2 valid matching comps — below MIN_SPEC_COMPS, but variant-level fallback
    // also sees only the 2 valid ones → still rates at variant level.
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv.value).toBe(7000);
    expect(fv.variantLevel).toBe(true);
  });

  it("uses production year as the tightest dimension when present on both sides", () => {
    const target: ItemSpec = { ...blackCaviarGold, productionYear: 2020 };
    const comps = [
      comp({ productionYear: 2020, salePrice: 8000 }),
      comp({ productionYear: 2020, salePrice: 8200 }),
      comp({ productionYear: 2020, salePrice: 8400 }),
      comp({ productionYear: 2020, salePrice: 8600 }),
      comp({ productionYear: 2010, salePrice: 5000 }),
    ];
    const fv = computeFairValue(target, comps)!;
    expect(fv.dimsUsed).toEqual(["material", "color", "hardware", "year"]);
    expect(fv.value).toBe(8300);
  });

  it("matches spec values case- and whitespace-insensitively", () => {
    const comps = [
      comp({ material: "Caviar", colorway: "Black", hardwareColor: "Gold", salePrice: 7000 }),
      comp({ material: " caviar ", colorway: "black", hardwareColor: "gold", salePrice: 7100 }),
      comp({ material: "CAVIAR", colorway: "BLACK", hardwareColor: "GOLD", salePrice: 7200 }),
      comp({ material: "caviar", colorway: "black", hardwareColor: "gold", salePrice: 7300 }),
    ];
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv.compCount).toBe(4);
    expect(fv.value).toBe(7150);
  });
});

describe("computeFairValue — realized prices preferred", () => {
  it("prices off sold comps when there are enough, ignoring asking listings", () => {
    const comps = [
      comp({ realized: true, salePrice: 6000 }),
      comp({ realized: true, salePrice: 6200 }),
      comp({ realized: true, salePrice: 6400 }),
      comp({ realized: true, salePrice: 6600 }),
      // higher ASKING listings that should NOT pull the fair value up
      comp({ realized: false, salePrice: 9000 }),
      comp({ realized: false, salePrice: 9500 }),
    ];
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv.realized).toBe(true);
    expect(fv.value).toBe(6300); // median of the four sold comps only
    expect(fv.compCount).toBe(4);
  });

  it("falls back to asking listings when sold comps are too thin, and flags it", () => {
    const comps = [
      comp({ realized: true, salePrice: 6000 }),
      comp({ realized: false, salePrice: 7000 }),
      comp({ realized: false, salePrice: 7200 }),
      comp({ realized: false, salePrice: 7400 }),
    ];
    const fv = computeFairValue(blackCaviarGold, comps)!;
    expect(fv.realized).toBe(false);
    expect(fv.compCount).toBe(4);
  });
});

describe("classifyDeal", () => {
  const fair = { value: 5000, compCount: 10, dimsUsed: [], dimsDropped: [], broadened: false, variantLevel: false, realized: false };

  it("rates a clearly-under listing as great", () => {
    const r = classifyDeal(4000, fair); // 20% under
    expect(r.band).toBe("great");
    expect(r.pctUnder).toBe(20);
  });

  it("rates a slightly-under listing as good", () => {
    expect(classifyDeal(4750, fair).band).toBe("good"); // 5% under
  });

  it("rates an at-or-slightly-over listing as fair", () => {
    expect(classifyDeal(5000, fair).band).toBe("fair"); // at value
    expect(classifyDeal(5300, fair).band).toBe("fair"); // 6% over
  });

  it("rates a well-over listing as above market", () => {
    const r = classifyDeal(6000, fair); // 20% over
    expect(r.band).toBe("above");
    expect(r.pctUnder).toBe(-20);
  });
});

describe("rateListing", () => {
  it("returns null when ungradeable, a rating otherwise", () => {
    expect(rateListing(5000, blackCaviarGold, [])).toBeNull();
    const comps = [comp({ salePrice: 7000 }), comp({ salePrice: 7000 }), comp({ salePrice: 7000 }), comp({ salePrice: 7000 })];
    expect(rateListing(6000, blackCaviarGold, comps)!.band).toBe("great");
  });
});

describe("bestBand", () => {
  it("picks the strongest band present", () => {
    expect(bestBand(["above", "fair", "good"])).toBe("good");
    expect(bestBand(["fair", "great", "above"])).toBe("great");
    expect(bestBand([])).toBeNull();
  });
});

describe("bandLabel", () => {
  it("maps bands to human labels", () => {
    expect(bandLabel("great")).toBe("Great price");
    expect(bandLabel("above")).toBe("Above market");
  });
});

describe("isConfidentBasis", () => {
  const base = { value: 5000, compCount: 6, broadened: false, variantLevel: false, realized: false };

  it("is confident only when matched like-for-like on leather AND color", () => {
    expect(isConfidentBasis({ ...base, dimsUsed: ["material", "color"], dimsDropped: [] })).toBe(true);
    expect(isConfidentBasis({ ...base, dimsUsed: ["material", "color", "hardware"], dimsDropped: [] })).toBe(true);
  });

  it("is not confident when color was dropped (blended across colors)", () => {
    expect(isConfidentBasis({ ...base, broadened: true, dimsUsed: ["material"], dimsDropped: ["color"] })).toBe(false);
  });

  it("is never confident at the blended variant level", () => {
    expect(
      isConfidentBasis({ ...base, variantLevel: true, dimsUsed: [], dimsDropped: ["material", "color"] }),
    ).toBe(false);
  });
});
