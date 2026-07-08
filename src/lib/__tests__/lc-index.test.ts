import { describe, it, expect } from "vitest";
import {
  computeLcIndex,
  percentileOf,
  boardAround,
  whyNote,
  movementLabel,
  LC_INDEX_MIN_N,
  type StyleSignals,
  type BrandTier,
} from "../lc-index";

// ── Helpers ───────────────────────────────────────────────────────────────────

let nextId = 1;
function sig(overrides: Partial<StyleSignals> = {}): StyleSignals {
  const id = overrides.styleId ?? nextId++;
  return {
    styleId: id,
    styleName: overrides.styleName ?? `Style ${id}`,
    brandId: overrides.brandId ?? id,
    brandName: overrides.brandName ?? `Brand ${id}`,
    tier: (overrides.tier ?? "luxury-placeholder") as BrandTier,
    resaleMedian: overrides.resaleMedian ?? 1000,
    priceCount: overrides.priceCount ?? 100,
    liveCount: overrides.liveCount ?? 10,
    repVariantId: overrides.repVariantId ?? id,
    // apply real overrides last so the defaults above never clobber them
    ...overrides,
  };
}

/** The canonical four bags from the mockup, with signals that should produce 1-2-3-4. */
function canonSignals(): StyleSignals[] {
  return [
    sig({ styleId: 1, styleName: "Birkin", brandName: "Hermès", tier: "ultra-luxury", resaleMedian: 14800, priceCount: 552, liveCount: 6 }),
    sig({ styleId: 2, styleName: "Kelly", brandName: "Hermès", tier: "ultra-luxury", resaleMedian: 13200, priceCount: 418, liveCount: 8 }),
    sig({ styleId: 3, styleName: "Classic Flap", brandName: "Chanel", tier: "ultra-luxury", resaleMedian: 6900, priceCount: 1204, liveCount: 120 }),
    sig({ styleId: 4, styleName: "Neverfull", brandName: "Louis Vuitton", tier: "luxury" as unknown as BrandTier, resaleMedian: 1450, priceCount: 1893, liveCount: 300 }),
  ];
}

// ── percentileOf ────────────────────────────────────────────────────────────────

describe("percentileOf", () => {
  it("puts the max at 100 and shares ties", () => {
    const pop = [10, 20, 30, 40];
    expect(percentileOf(40, pop)).toBe(100);
    expect(percentileOf(10, pop)).toBe(25);
    expect(percentileOf(25, pop)).toBe(50); // two of four at or below 25
  });

  it("returns 0 for an empty population", () => {
    expect(percentileOf(5, [])).toBe(0);
  });
});

// ── computeLcIndex: ordering ────────────────────────────────────────────────────

describe("computeLcIndex ordering", () => {
  it("ranks the canon Birkin > Kelly > Classic Flap > Neverfull", () => {
    const { ranked } = computeLcIndex(canonSignals());
    expect(ranked.map((r) => r.styleName)).toEqual([
      "Birkin",
      "Kelly",
      "Classic Flap",
      "Neverfull",
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(ranked[0].totalRanked).toBe(4);
  });

  it("keeps Kelly above the Classic Flap even though the Flap trades far more", () => {
    // Price is weighted heaviest (0.40), so Kelly's price premium beats the Flap's volume.
    const { ranked } = computeLcIndex(canonSignals());
    const kelly = ranked.find((r) => r.styleName === "Kelly")!;
    const flap = ranked.find((r) => r.styleName === "Classic Flap")!;
    expect(kelly.rank!).toBeLessThan(flap.rank!);
    expect(flap.tradePct).toBeGreaterThan(kelly.tradePct); // the Flap really does trade more
    expect(kelly.score!).toBeGreaterThan(flap.score!); // yet ranks higher on the blend
  });
});

// ── the why-meter bars ──────────────────────────────────────────────────────────

describe("why-meter bars", () => {
  it("gives the top-priced, scarcest bag a full price bar and the set's highest scarcity bar", () => {
    const { ranked } = computeLcIndex(canonSignals());
    const birkin = ranked.find((r) => r.styleName === "Birkin")!;
    expect(birkin.pricePct).toBe(100); // priciest of the set
    // Scarcest of the set (6 live listings), so its scarcity bar tops the field. The
    // absolute value approaches 100 only at real scale; with 4 fixtures it is 100 - 1/4.
    const maxScarcity = Math.max(...ranked.map((r) => r.scarcityPct));
    expect(birkin.scarcityPct).toBe(maxScarcity);
  });

  it("marks the Classic Flap's lead as price and the Neverfull's lead as trade", () => {
    const { ranked } = computeLcIndex(canonSignals());
    expect(ranked.find((r) => r.styleName === "Classic Flap")!.lead).toBe("price");
    expect(ranked.find((r) => r.styleName === "Neverfull")!.lead).toBe("trade");
  });

  it("inverts scarcity: the bag with the most live listings gets the lowest scarcity bar", () => {
    const { ranked } = computeLcIndex(canonSignals());
    const neverfull = ranked.find((r) => r.styleName === "Neverfull")!; // 300 live listings
    const birkin = ranked.find((r) => r.styleName === "Birkin")!; // 6 live listings
    expect(neverfull.scarcityPct).toBeLessThan(birkin.scarcityPct);
  });
});

// ── the n-gate (honesty) ────────────────────────────────────────────────────────

describe("n-gate", () => {
  it("leaves a thin style unranked rather than inventing a rank", () => {
    const signals = [
      sig({ styleId: 1, resaleMedian: 5000, priceCount: 200, liveCount: 10 }),
      sig({ styleId: 2, resaleMedian: 4000, priceCount: LC_INDEX_MIN_N - 1, liveCount: 5 }), // too thin
    ];
    const { ranked, unrankedStyleIds, totalRanked } = computeLcIndex(signals);
    expect(totalRanked).toBe(1);
    expect(ranked.map((r) => r.styleId)).toEqual([1]);
    expect(unrankedStyleIds).toEqual([2]);
  });

  it("leaves a style with no resale median unranked", () => {
    const signals = [
      sig({ styleId: 1, resaleMedian: 5000, priceCount: 200 }),
      sig({ styleId: 2, resaleMedian: null, priceCount: 500 }),
    ];
    const { unrankedStyleIds } = computeLcIndex(signals);
    expect(unrankedStyleIds).toEqual([2]);
  });
});

// ── boards (standing card neighbors) ────────────────────────────────────────────

describe("boardAround", () => {
  it("returns the style flanked by its neighbors in the price ordering", () => {
    const data = computeLcIndex(canonSignals());
    const board = boardAround(data, "price", 2 /* Kelly */);
    expect(board.map((r) => r.styleName)).toEqual(["Birkin", "Kelly", "Classic Flap"]);
    expect(board.find((r) => r.isSelf)!.styleName).toBe("Kelly");
    expect(board[0].position).toBe(1); // Birkin is #1 by price
  });

  it("orders the scarcity board scarcest-first", () => {
    const data = computeLcIndex(canonSignals());
    // Birkin (6 live) is scarcest, so it leads the scarcity board.
    expect(data.order.scarcity[0]).toBe(1);
    const board = boardAround(data, "scarcity", 1);
    expect(board[0].isSelf).toBe(true);
    expect(board.map((r) => r.styleName)).toEqual(["Birkin", "Kelly"]);
  });

  it("returns an empty board for an unranked style", () => {
    const data = computeLcIndex(canonSignals());
    expect(boardAround(data, "price", 999)).toEqual([]);
  });
});

// ── whyNote (row caption) ───────────────────────────────────────────────────────

describe("whyNote", () => {
  it("names the leading signal as a market fact, honest at both ends", () => {
    expect(whyNote({ lead: "price", pricePct: 90, tradePct: 0, scarcityPct: 0 })).toBe(
      "Priced above most of the catalog",
    );
    expect(whyNote({ lead: "price", pricePct: 20, tradePct: 0, scarcityPct: 0 })).toBe(
      "An accessible price",
    );
    expect(whyNote({ lead: "trade", pricePct: 0, tradePct: 88, scarcityPct: 0 })).toBe(
      "One of the most-traded bags we track",
    );
    expect(whyNote({ lead: "scarcity", pricePct: 0, tradePct: 0, scarcityPct: 95 })).toBe(
      "Rarely listed right now",
    );
    expect(whyNote({ lead: "scarcity", pricePct: 0, tradePct: 0, scarcityPct: 10 })).toBe(
      "Widely available today",
    );
  });

  it("never uses an em dash or a verdict word", () => {
    const canon = computeLcIndex(canonSignals());
    for (const r of canon.ranked) {
      const note = whyNote(r);
      expect(note).not.toContain("—");
      expect(note.toLowerCase()).not.toMatch(/\bbest\b|\bworth it\b/);
    }
  });
});

// ── movementLabel (the pill) ────────────────────────────────────────────────────

describe("movementLabel", () => {
  it("reads a drop in rank number as an upward move", () => {
    const m = movementLabel(2, 4)!; // was #4, now #2
    expect(m.dir).toBe("up");
    expect(m.delta).toBe(2);
    expect(m.label).toBe("Up 2 this month");
  });

  it("reads a rise in rank number as a downward move", () => {
    const m = movementLabel(7, 5)!; // was #5, now #7
    expect(m.dir).toBe("down");
    expect(m.delta).toBe(2);
    expect(m.label).toBe("Down 2 this month");
  });

  it("is steady when unchanged", () => {
    expect(movementLabel(3, 3)).toEqual({ dir: "flat", delta: 0, label: "Steady" });
  });

  it("returns null when there is no prior rank, so it never invents motion", () => {
    expect(movementLabel(3, null)).toBeNull();
    expect(movementLabel(3, undefined)).toBeNull();
  });
});

// ── determinism ─────────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("breaks score ties by resale median, then style id", () => {
    // Two styles with identical signals except median → higher median ranks first.
    const signals = [
      sig({ styleId: 10, resaleMedian: 2000, priceCount: 50, liveCount: 5, tier: "premium" }),
      sig({ styleId: 11, resaleMedian: 3000, priceCount: 50, liveCount: 5, tier: "premium" }),
    ];
    const { ranked } = computeLcIndex(signals);
    expect(ranked.map((r) => r.styleId)).toEqual([11, 10]);
  });
});
