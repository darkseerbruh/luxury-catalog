import { describe, it, expect } from "vitest";
import {
  decayWeight,
  daysAgo,
  itemWeight,
  inferBudgetBand,
  inferIntent,
  computeBrandAffinities,
  topAffinities,
  computeAttributeAffinities,
  aggregateSignals,
} from "../personalization/aggregation-core";
import type { ClosetSignal, RawUserSignals, WatchlistSignal } from "../personalization/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoAgo(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString();
}

function makeCloset(overrides: Partial<ClosetSignal>): ClosetSignal {
  return {
    variantId: 1,
    status: "have",
    createdAt: isoAgo(0),
    purchasePrice: null,
    retailPrice: null,
    brandName: null,
    silhouette: null,
    sizeCategory: null,
    hardwareColor: null,
    materialType: null,
    ...overrides,
  };
}

function makeWatch(overrides: Partial<WatchlistSignal>): WatchlistSignal {
  return {
    variantId: 1,
    targetPrice: null,
    alertEnabled: true,
    createdAt: isoAgo(0),
    brandName: null,
    ...overrides,
  };
}

// ── decayWeight ───────────────────────────────────────────────────────────────

describe("decayWeight", () => {
  it("returns 1.0 for items added today", () => {
    expect(decayWeight(0)).toBe(1.0);
  });
  it("returns 1.0 for items added 7 days ago", () => {
    expect(decayWeight(7)).toBe(1.0);
  });
  it("returns 0.8 for items added 8 days ago", () => {
    expect(decayWeight(8)).toBe(0.8);
  });
  it("returns 0.6 for items added 31 days ago", () => {
    expect(decayWeight(31)).toBe(0.6);
  });
  it("returns 0.4 for items added 91 days ago", () => {
    expect(decayWeight(91)).toBe(0.4);
  });
  it("returns 0.2 for items added 366 days ago", () => {
    expect(decayWeight(366)).toBe(0.2);
  });
});

// ── daysAgo ───────────────────────────────────────────────────────────────────

describe("daysAgo", () => {
  it("returns 0 for now", () => {
    expect(daysAgo(new Date().toISOString())).toBe(0);
  });
  it("returns ~5 for 5 days ago", () => {
    expect(daysAgo(isoAgo(5))).toBe(5);
  });
});

// ── itemWeight ────────────────────────────────────────────────────────────────

describe("itemWeight", () => {
  it("have item today = 3.0 * 1.0 = 3.0", () => {
    expect(itemWeight("have", isoAgo(0))).toBeCloseTo(3.0);
  });
  it("want item today = 1.5 * 1.0 = 1.5", () => {
    expect(itemWeight("want", isoAgo(0))).toBeCloseTo(1.5);
  });
  it("had item 8 days ago = 1.0 * 0.8 = 0.8", () => {
    expect(itemWeight("had", isoAgo(8))).toBeCloseTo(0.8);
  });
  it("unknown status = 0", () => {
    expect(itemWeight("unknown", isoAgo(0))).toBe(0);
  });
});

// ── inferBudgetBand ───────────────────────────────────────────────────────────

describe("inferBudgetBand", () => {
  it("returns null with no price signals", () => {
    expect(inferBudgetBand([], [])).toBeNull();
  });
  it("infers entry from cheap have items", () => {
    const items = [
      makeCloset({ status: "have", retailPrice: 800 }),
      makeCloset({ status: "have", retailPrice: 600 }),
    ];
    expect(inferBudgetBand(items, [])).toBe("entry");
  });
  it("infers grail from expensive have items", () => {
    const items = [makeCloset({ status: "have", retailPrice: 8000 })];
    expect(inferBudgetBand(items, [])).toBe("grail");
  });
  it("infers mixed from spread", () => {
    const items = [
      makeCloset({ status: "have", retailPrice: 800 }),
      makeCloset({ status: "have", retailPrice: 6000 }),
    ];
    expect(inferBudgetBand(items, [])).toBe("mixed");
  });
  it("watchlist targetPrice contributes", () => {
    const watches = [makeWatch({ targetPrice: 9000 }), makeWatch({ targetPrice: 8500 })];
    expect(inferBudgetBand([], watches)).toBe("grail");
  });
  it("purchase_price overrides retailPrice", () => {
    const items = [makeCloset({ status: "have", purchasePrice: 1200, retailPrice: 6000 })];
    expect(inferBudgetBand(items, [])).toBe("entry");
  });
});

// ── inferIntent ───────────────────────────────────────────────────────────────

describe("inferIntent", () => {
  it("browsing when no signals", () => {
    expect(inferIntent({ want: 0, have: 0, had: 0, watchlist: 0 })).toBe("browsing");
  });
  it("both when want + had", () => {
    expect(inferIntent({ want: 1, have: 0, had: 1, watchlist: 0 })).toBe("both");
  });
  it("buying when want >= 3", () => {
    expect(inferIntent({ want: 3, have: 0, had: 0, watchlist: 0 })).toBe("buying");
  });
  it("selling when had >= 2", () => {
    expect(inferIntent({ want: 0, have: 1, had: 2, watchlist: 0 })).toBe("selling");
  });
  it("collecting when have >= 5 and no want", () => {
    expect(inferIntent({ want: 0, have: 5, had: 0, watchlist: 0 })).toBe("collecting");
  });
  it("buying beats collecting when both want and have", () => {
    // want=1, had=1 → 'both' takes priority
    expect(inferIntent({ want: 1, have: 5, had: 1, watchlist: 0 })).toBe("both");
  });
});

// ── computeBrandAffinities ────────────────────────────────────────────────────

describe("computeBrandAffinities", () => {
  it("sums weighted scores per brand", () => {
    const items = [
      makeCloset({ brandName: "Chanel", status: "have" }), // 3.0
      makeCloset({ brandName: "Chanel", status: "want" }), // 1.5
      makeCloset({ brandName: "Prada",  status: "have" }), // 3.0
    ];
    const aff = computeBrandAffinities(items, []);
    expect(aff["Chanel"]).toBeCloseTo(4.5);
    expect(aff["Prada"]).toBeCloseTo(3.0);
  });
  it("watchlist adds to brand score", () => {
    const watches = [makeWatch({ brandName: "Hermès" })]; // 1.5
    const aff = computeBrandAffinities([], watches);
    expect(aff["Hermès"]).toBeCloseTo(1.5);
  });
  it("ignores null brand names", () => {
    const items = [makeCloset({ brandName: null })];
    expect(computeBrandAffinities(items, [])).toEqual({});
  });
});

// ── topAffinities ─────────────────────────────────────────────────────────────

describe("topAffinities", () => {
  it("sorts by score descending and caps at n", () => {
    const scores = { A: 10, B: 3, C: 7 };
    const top = topAffinities(scores, 2);
    expect(top.map((t) => t.name)).toEqual(["A", "C"]);
    expect(top[0].score).toBe(10);
  });
  it("returns empty array for empty scores", () => {
    expect(topAffinities({})).toEqual([]);
  });
});

// ── computeAttributeAffinities ────────────────────────────────────────────────

describe("computeAttributeAffinities", () => {
  it("accumulates silhouette, size, hardware, material", () => {
    const items = [
      makeCloset({ silhouette: "structured", sizeCategory: "medium", hardwareColor: "gold", materialType: "leather" }),
      makeCloset({ silhouette: "structured", sizeCategory: "small" }),
    ];
    const aff = computeAttributeAffinities(items);
    expect(aff["silhouette"]?.["structured"]).toBeCloseTo(6.0); // 3+3
    expect(aff["size"]?.["medium"]).toBeCloseTo(3.0);
    expect(aff["size"]?.["small"]).toBeCloseTo(3.0);
    expect(aff["hardware"]?.["gold"]).toBeCloseTo(3.0);
    expect(aff["material"]?.["leather"]).toBeCloseTo(3.0);
  });
  it("lowercases attribute values", () => {
    const items = [makeCloset({ hardwareColor: "Gold" })];
    const aff = computeAttributeAffinities(items);
    expect(aff["hardware"]?.["gold"]).toBeDefined();
    expect(aff["hardware"]?.["Gold"]).toBeUndefined();
  });
});

// ── aggregateSignals (integration) ────────────────────────────────────────────

describe("aggregateSignals", () => {
  const BASE_SIGNALS: RawUserSignals = {
    persona: "collector",
    tasteVectorSnapshot: { brand: { Chanel: 3 } },
    tasteCompleteness: 50,
    closetItems: [
      makeCloset({ brandName: "Chanel", status: "have", retailPrice: 6000 }),
      makeCloset({ brandName: "Chanel", status: "want", retailPrice: 5500 }),
      makeCloset({ brandName: "Chanel", status: "want", retailPrice: 5500 }),
      makeCloset({ brandName: "Chanel", status: "want", retailPrice: 5500 }),
    ],
    watchlistItems: [],
    reviewCount: 2,
  };

  it("passes persona through", () => {
    const p = aggregateSignals(BASE_SIGNALS);
    expect(p.persona).toBe("collector");
  });

  it("infers grail budget band", () => {
    const p = aggregateSignals(BASE_SIGNALS);
    expect(p.budgetBand).toBe("grail");
  });

  it("infers buying intent (3 want items)", () => {
    const p = aggregateSignals(BASE_SIGNALS);
    expect(p.intent).toBe("buying");
  });

  it("populates signal counts", () => {
    const p = aggregateSignals(BASE_SIGNALS);
    expect(p.signalCounts.want_count).toBe(3);
    expect(p.signalCounts.have_count).toBe(1);
    expect(p.signalCounts.quiz_completeness).toBe(50);
    expect(p.signalCounts.review_count).toBe(2);
  });

  it("includes top affinity for the top brand", () => {
    const p = aggregateSignals(BASE_SIGNALS);
    expect(p.topAffinities[0]?.name).toBe("Chanel");
  });

  it("passes taste_vector snapshot through", () => {
    const p = aggregateSignals(BASE_SIGNALS);
    expect(p.tasteVectorSnapshot).toEqual({ brand: { Chanel: 3 } });
  });

  it("returns browsing intent for a cold-start user", () => {
    const cold: RawUserSignals = {
      persona: null,
      tasteVectorSnapshot: null,
      tasteCompleteness: 0,
      closetItems: [],
      watchlistItems: [],
      reviewCount: 0,
    };
    const p = aggregateSignals(cold);
    expect(p.intent).toBe("browsing");
    expect(p.budgetBand).toBeNull();
    expect(p.topAffinities).toEqual([]);
  });
});
