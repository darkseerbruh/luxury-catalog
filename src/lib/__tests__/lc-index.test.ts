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

// ── the n-gate / floor (honesty + demand-first) ─────────────────────────────────

describe("n-gate", () => {
  it("floor is set from the real distribution to drop thin, contaminated styles", () => {
    // Raised from 8 → 20 after the 2026-07-08 diagnosis: the thin styles that ranked
    // too high (Kelly Pochette at 15 deduped listings) must fall below the floor.
    expect(LC_INDEX_MIN_N).toBe(20);
  });

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

  it("ranks a style exactly at the floor, unranks one just below it (demand-first gate)", () => {
    const signals = [
      sig({ styleId: 1, resaleMedian: 5000, priceCount: LC_INDEX_MIN_N, liveCount: 10 }), // exactly at floor
      sig({ styleId: 2, resaleMedian: 9000, priceCount: LC_INDEX_MIN_N - 1, liveCount: 1 }), // pricey + scarce but thin
    ];
    const { ranked, unrankedStyleIds } = computeLcIndex(signals);
    // The thin style stays out even though its price + scarcity would otherwise rank it high.
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

// ── whyNote (row caption) — the differentiated generator ────────────────────────

describe("whyNote", () => {
  const note = (o: Partial<Parameters<typeof whyNote>[0]>) =>
    whyNote({ rank: 3, brandName: "Hermès", pricePct: 50, tradePct: 50, scarcityPct: 50, ...o });

  it("gives #1 the benchmark line, without a false scarcity claim", () => {
    // The top bag can be the MOST-listed of all (Birkin), so #1 speaks to price + volume only.
    const n = whyNote({ rank: 1, brandName: "Hermès", pricePct: 100, tradePct: 99, scarcityPct: 1 });
    expect(n).toBe("The benchmark. Nothing we rank prices higher, and it trades in real volume.");
  });

  it("leads with scarcity only when the bag really is seldom listed", () => {
    // priceTop + genuinely scarce → a 'rarely surfaces' line.
    expect(note({ pricePct: 98, tradePct: 29, scarcityPct: 83 })).toMatch(/seldom|rarely comes up/i);
    // A top seller (low scarcity percentile) is NEVER told it is scarce.
    const heavy = note({ pricePct: 95, tradePct: 100, scarcityPct: 0 });
    expect(heavy).not.toMatch(/seldom|rarely|hard to find/i);
  });

  it("reserves 'grail' pricing for top-of-index price, not merely-expensive bags", () => {
    // A high-volume but mid-priced bag (a Wallet on Chain) gets a volume story, no 'grail'.
    const woc = note({ rank: 20, brandName: "Chanel", pricePct: 83, tradePct: 86, scarcityPct: 21 });
    expect(woc).toMatch(/liquid|trades constantly/i);
    expect(woc.toLowerCase()).not.toContain("grail");
  });

  it("is honest at the soft end (easy to find, softer price)", () => {
    const easy = note({ rank: 200, pricePct: 15, tradePct: 10, scarcityPct: 10 });
    expect(easy.toLowerCase()).toMatch(/easy to find|priced softly|softer price|accessible|mid-pack/);
  });

  it("is deterministic: same inputs always produce the same line", () => {
    const input = { rank: 7, brandName: "Chanel", pricePct: 91, tradePct: 88, scarcityPct: 12 };
    expect(whyNote(input)).toBe(whyNote(input));
  });

  it("never uses an em dash or a verdict word, across the whole ranked set", () => {
    const canon = computeLcIndex(canonSignals());
    for (const r of canon.ranked) {
      const n = whyNote(r);
      expect(n).not.toContain("—");
      expect(n.toLowerCase()).not.toMatch(/\bbest\b|\bworth it\b|\byou should\b/);
    }
  });

  it("keeps adjacent rows distinct even when their signal profiles are identical", () => {
    // Two neighbors with the SAME profile must not read the same (rank-parity variant).
    const a = whyNote({ rank: 4, brandName: "Hermès", pricePct: 92, tradePct: 90, scarcityPct: 10 });
    const b = whyNote({ rank: 5, brandName: "Hermès", pricePct: 92, tradePct: 90, scarcityPct: 10 });
    expect(a).not.toBe(b);
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
