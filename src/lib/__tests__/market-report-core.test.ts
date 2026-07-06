import { describe, it, expect } from "vitest";

import {
  median,
  addDays,
  splitByCurrency,
  brandAskingStats,
  styleMovers,
  stylesWithPrices,
  platformNote,
  fmtUsd,
  fmtPct,
  renderReport,
  MIN_MOVER_N,
  type ReportPriceRow,
} from "../market-report-core";

const ASOF = "2026-07-06";

function row(over: Partial<ReportPriceRow>): ReportPriceRow {
  return {
    styleId: 1,
    styleName: "Classic Flap",
    brandName: "Chanel",
    price: 5000,
    currency: "USD",
    platform: "Fashionphile",
    priceType: "listed",
    effectiveDate: ASOF,
    ...over,
  };
}

/** n rows for one style, all inside the given window anchor date. */
function batch(n: number, price: number, date: string, over: Partial<ReportPriceRow> = {}): ReportPriceRow[] {
  return Array.from({ length: n }, () => row({ price, effectiveDate: date, ...over }));
}

describe("median", () => {
  it("returns null on empty input rather than fabricating a figure", () => {
    expect(median([])).toBeNull();
  });
  it("handles odd counts", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("averages the middle pair on even counts", () => {
    expect(median([1, 2, 3, 10])).toBe(2.5);
  });
  it("does not mutate its input", () => {
    const input = [5, 1, 3];
    median(input);
    expect(input).toEqual([5, 1, 3]);
  });
});

describe("addDays", () => {
  it("moves across month boundaries in UTC", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
    expect(addDays("2026-07-06", -29)).toBe("2026-06-07");
  });
});

describe("splitByCurrency", () => {
  it("keeps USD and null-currency rows, excludes the rest", () => {
    const rows = [row({ currency: "USD" }), row({ currency: null }), row({ currency: "EUR" }), row({ currency: "usd" })];
    const { usd, nonUsd } = splitByCurrency(rows);
    expect(usd).toHaveLength(3);
    expect(nonUsd).toHaveLength(1);
    expect(nonUsd[0].currency).toBe("EUR");
  });
});

describe("brandAskingStats", () => {
  it("computes per-brand median of asking rows only, with n and sorted platforms", () => {
    const rows = [
      row({ price: 4000, platform: "TheRealReal" }),
      row({ price: 6000, platform: "Fashionphile" }),
      row({ price: 5000, platform: "Fashionphile" }),
      // sold row must NOT count toward asking median
      row({ price: 100, priceType: "sold" }),
      // retail row must NOT count either
      row({ price: 99999, priceType: "retail_msrp" }),
      row({ brandName: "Coach", styleId: 9, styleName: "Tabby", price: 300 }),
    ];
    const stats = brandAskingStats(rows, ASOF);
    expect(stats).toHaveLength(2);
    const chanel = stats.find((s) => s.brand === "Chanel")!;
    expect(chanel.medianAsking).toBe(5000);
    expect(chanel.n).toBe(3);
    expect(chanel.platforms).toEqual(["Fashionphile", "TheRealReal"]);
    // priciest first
    expect(stats[0].brand).toBe("Chanel");
  });

  it("excludes rows outside the trailing window", () => {
    const rows = [
      row({ price: 5000, effectiveDate: ASOF }),
      row({ price: 1, effectiveDate: addDays(ASOF, -90) }), // window is 90 days INCLUSIVE of asOf, so -90 falls out
    ];
    const stats = brandAskingStats(rows, ASOF, 90);
    expect(stats[0].n).toBe(1);
    expect(stats[0].medianAsking).toBe(5000);
  });
});

describe("styleMovers n-gating", () => {
  const recentDate = ASOF; // inside recent window
  const priorDate = addDays(ASOF, -35); // inside prior window (days 31-60 back)

  it("reports a style with n >= 10 in BOTH windows", () => {
    const rows = [...batch(10, 4000, priorDate), ...batch(10, 4400, recentDate)];
    const movers = styleMovers(rows, ASOF);
    expect(movers).toHaveLength(1);
    expect(movers[0].priorMedian).toBe(4000);
    expect(movers[0].recentMedian).toBe(4400);
    expect(movers[0].pctChange).toBeCloseTo(10);
    expect(movers[0].nPrior).toBe(10);
    expect(movers[0].nRecent).toBe(10);
  });

  it("drops a style with n = 9 in the prior window even if the recent window is deep", () => {
    const rows = [...batch(MIN_MOVER_N - 1, 4000, priorDate), ...batch(50, 8000, recentDate)];
    expect(styleMovers(rows, ASOF)).toHaveLength(0);
  });

  it("drops a style with n = 9 in the recent window even if the prior window is deep", () => {
    const rows = [...batch(50, 4000, priorDate), ...batch(MIN_MOVER_N - 1, 8000, recentDate)];
    expect(styleMovers(rows, ASOF)).toHaveLength(0);
  });

  it("ignores sold rows when counting toward the gate", () => {
    const rows = [
      ...batch(9, 4000, priorDate),
      ...batch(5, 4000, priorDate, { priceType: "sold" }), // does not top up the asking count
      ...batch(10, 4400, recentDate),
    ];
    expect(styleMovers(rows, ASOF)).toHaveLength(0);
  });

  it("caps at 5 movers per brand, ranked by absolute change", () => {
    const rows: ReportPriceRow[] = [];
    // 6 Chanel styles, moves of +1% .. +6%
    for (let i = 1; i <= 6; i++) {
      rows.push(...batch(10, 1000, priorDate, { styleId: i, styleName: `Style ${i}` }));
      rows.push(...batch(10, 1000 + i * 10, recentDate, { styleId: i, styleName: `Style ${i}` }));
    }
    const movers = styleMovers(rows, ASOF);
    expect(movers).toHaveLength(5);
    expect(movers[0].style).toBe("Style 6"); // biggest move first
    expect(movers.map((m) => m.style)).not.toContain("Style 1"); // smallest move cut
  });

  it("ranks a big drop above a small rise (absolute change)", () => {
    const rows = [
      ...batch(10, 1000, priorDate, { styleId: 1, styleName: "Riser" }),
      ...batch(10, 1050, recentDate, { styleId: 1, styleName: "Riser" }),
      ...batch(10, 1000, priorDate, { styleId: 2, styleName: "Faller" }),
      ...batch(10, 800, recentDate, { styleId: 2, styleName: "Faller" }),
    ];
    const movers = styleMovers(rows, ASOF);
    expect(movers[0].style).toBe("Faller");
    expect(movers[0].pctChange).toBeCloseTo(-20);
  });
});

describe("stylesWithPrices", () => {
  it("counts distinct styles across any price type", () => {
    const rows = [row({ styleId: 1 }), row({ styleId: 1 }), row({ styleId: 2, priceType: "sold" })];
    expect(stylesWithPrices(rows)).toBe(2);
  });
});

describe("formatting + source labels", () => {
  it("labels Fashionphile as fixed-price and eBay as bid/ask", () => {
    expect(platformNote("Fashionphile")).toMatch(/fixed-price/);
    expect(platformNote("eBay")).toMatch(/bid\/ask/);
    expect(platformNote("SomeUnknownShop")).toBeNull();
  });
  it("formats dollars and percents", () => {
    expect(fmtUsd(9120.4)).toBe("$9,120");
    expect(fmtPct(8.25)).toBe("+8.3%");
    expect(fmtPct(-3)).toBe("-3.0%");
  });
});

describe("renderReport", () => {
  const base = {
    month: "2026-07",
    asOf: ASOF,
    totalPriceRows: 57000,
    totalStyles: 761,
    totalBrands: 28,
    stylesCovered: 400,
    usdRowCount: 56000,
    nonUsdRowCount: 1000,
    brandStats: brandAskingStats([row({})], ASOF),
    movers: styleMovers([...batch(10, 4000, addDays(ASOF, -35)), ...batch(10, 4400, ASOF)], ASOF),
    newStyles: [{ brand: "Chanel", style: "25 Bag", addedOn: "2026-07-02" }],
  };

  it("leads with the draft banner and contains no em dashes", () => {
    const md = renderReport(base);
    expect(md.split("\n")[0]).toContain("DRAFT - owner reviews all numbers before any publish");
    expect(md).not.toContain("—");
  });

  it("labels prices as asking, carries n + window on figures, and states coverage", () => {
    const md = renderReport(base);
    expect(md).toContain("asking prices, not sold prices");
    expect(md).toContain("(52.6%)"); // 400 of 761 coverage, stated plainly
    expect(md).toContain("| Chanel | $5,000 (thin data; directional only) | 1 | Fashionphile |");
    expect(md).toContain("2026-04-08 to 2026-07-06"); // 90-day brand window, dated
    expect(md).toContain("| Chanel | Classic Flap | $4,000 | $4,400 | +10.0% | 10 / 10 |");
    expect(md).toContain("estimate");
    expect(md).not.toMatch(/sells for/i);
  });

  it("says plainly when no mover cleared the gate instead of lowering the bar", () => {
    const md = renderReport({ ...base, movers: [] });
    expect(md).toContain(`No style cleared the n >= ${MIN_MOVER_N} bar in both windows`);
  });
});
