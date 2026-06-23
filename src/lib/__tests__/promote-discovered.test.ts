import { describe, it, expect } from "vitest";
import {
  groupDiscovered,
  promotableClusters,
  type DiscoveredRow,
} from "../../../supabase/ingest/promote-discovered";

/** Build a discovered_listing fixture row with sensible defaults. */
function row(p: Partial<DiscoveredRow>): DiscoveredRow {
  return {
    brand_guess: "Louis Vuitton",
    style_guess: "Speedy",
    size_label: null,
    sale_price: 1000,
    ...p,
  };
}

describe("groupDiscovered", () => {
  it("groups by normalized (brand, style, size) and counts occurrences", () => {
    const rows = [
      row({ size_label: "30", sale_price: 1200 }),
      row({ size_label: "30", sale_price: 1400 }),
      row({ size_label: "25", sale_price: 900 }),
    ];
    const clusters = groupDiscovered(rows);
    expect(clusters).toHaveLength(2);
    const s30 = clusters.find((c) => c.sizeLabel === "30")!;
    expect(s30.count).toBe(2);
    expect(s30.minPrice).toBe(1200);
    expect(s30.maxPrice).toBe(1400);
    const s25 = clusters.find((c) => c.sizeLabel === "25")!;
    expect(s25.count).toBe(1);
    expect(s25.minPrice).toBe(900);
    expect(s25.maxPrice).toBe(900);
  });

  it("treats case / whitespace / accent variants as ONE cluster", () => {
    const rows = [
      row({ brand_guess: "Hermès", style_guess: "Birkin", size_label: "30" }),
      row({ brand_guess: "Hermes", style_guess: "  birkin ", size_label: "30" }), // accent + case + spaces
      row({ brand_guess: "HERMÈS", style_guess: "BIRKIN", size_label: "30" }),
    ];
    const clusters = groupDiscovered(rows);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(3);
    // Brand normalized through normalizeDesigner ("Hermes" -> "Hermès").
    expect(clusters[0].brandGuess).toBe("Hermès");
  });

  it("keeps a null size as its own cluster, distinct from a sized one", () => {
    const rows = [
      row({ size_label: null }),
      row({ size_label: null }),
      row({ size_label: "30" }),
    ];
    const clusters = groupDiscovered(rows);
    const noSize = clusters.find((c) => c.sizeLabel === null)!;
    expect(noSize.count).toBe(2);
    expect(clusters.find((c) => c.sizeLabel === "30")!.count).toBe(1);
  });

  it("excludes already-promoted rows", () => {
    const rows = [
      row({ size_label: "30" }),
      row({ size_label: "30", promoted_variant_id: 42 }),
    ];
    const clusters = groupDiscovered(rows);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(1);
  });

  it("skips rows with neither brand nor style guess", () => {
    const rows = [
      row({ brand_guess: null, style_guess: null, size_label: "30" }),
      row({ brand_guess: "", style_guess: "", size_label: "30" }),
      row({ size_label: "30" }),
    ];
    const clusters = groupDiscovered(rows);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(1);
  });

  it("ignores null / non-positive prices in the range but still counts the row", () => {
    const rows = [
      row({ size_label: "30", sale_price: null }),
      row({ size_label: "30", sale_price: 0 }),
      row({ size_label: "30", sale_price: 1500 }),
    ];
    const cluster = groupDiscovered(rows)[0];
    expect(cluster.count).toBe(3);
    expect(cluster.minPrice).toBe(1500);
    expect(cluster.maxPrice).toBe(1500);
  });

  it("carries over the first non-null partial match ids", () => {
    const rows = [
      row({ size_label: "30", matched_brand_id: null, matched_style_id: null }),
      row({ size_label: "30", matched_brand_id: 7, matched_style_id: 99 }),
    ];
    const cluster = groupDiscovered(rows)[0];
    expect(cluster.matchedBrandId).toBe(7);
    expect(cluster.matchedStyleId).toBe(99);
  });

  it("sorts clusters by count descending", () => {
    const rows = [
      row({ style_guess: "Alma", size_label: "PM" }),
      row({ style_guess: "Speedy", size_label: "30" }),
      row({ style_guess: "Speedy", size_label: "30" }),
      row({ style_guess: "Speedy", size_label: "30" }),
    ];
    const clusters = groupDiscovered(rows);
    expect(clusters[0].styleGuess).toBe("Speedy");
    expect(clusters[0].count).toBe(3);
  });
});

describe("promotableClusters", () => {
  function nRows(n: number, over: Partial<DiscoveredRow>): DiscoveredRow[] {
    return Array.from({ length: n }, () => row(over));
  }

  it("flags only clusters at/above the default threshold (5)", () => {
    const rows = [
      ...nRows(5, { style_guess: "Speedy", size_label: "30" }),
      ...nRows(4, { style_guess: "Alma", size_label: "PM" }),
    ];
    const promotable = promotableClusters(rows);
    expect(promotable).toHaveLength(1);
    expect(promotable[0].styleGuess).toBe("Speedy");
    expect(promotable[0].count).toBe(5);
  });

  it("honors a custom threshold", () => {
    const rows = [
      ...nRows(3, { style_guess: "Speedy", size_label: "30" }),
      ...nRows(2, { style_guess: "Alma", size_label: "PM" }),
    ];
    expect(promotableClusters(rows, 3)).toHaveLength(1);
    expect(promotableClusters(rows, 2)).toHaveLength(2);
    expect(promotableClusters(rows, 6)).toHaveLength(0);
  });
});
