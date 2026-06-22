import { describe, it, expect, vi, beforeEach } from "vitest";
import { variantToEmbedText, embedQuery, embedDocuments } from "../voyage";

// ── variantToEmbedText ────────────────────────────────────────────────────────

describe("variantToEmbedText", () => {
  it("includes brand, style, silhouette, colorway, hardware, material", () => {
    const text = variantToEmbedText({
      brand: "Chanel",
      styleName: "Classic Flap",
      silhouette: "structured",
      sizeLabel: "Medium",
      exteriorColorway: "black",
      hardwareColor: "gold",
      materialType: "leather",
    });
    expect(text).toContain("Chanel");
    expect(text).toContain("Classic Flap");
    expect(text).toContain("structured");
    expect(text).toContain("Medium");
    expect(text).toContain("black");
    expect(text).toContain("gold hardware");
    expect(text).toContain("leather");
  });

  it("omits null fields", () => {
    const text = variantToEmbedText({ brand: "Prada", styleName: "Re-Edition" });
    expect(text).toBe("Prada, Re-Edition");
  });

  it("uses sizeLabel over sizeCategory when both present", () => {
    const text = variantToEmbedText({
      brand: "Hermès",
      sizeCategory: "large",
      sizeLabel: "35",
    });
    expect(text).toContain("35");
    expect(text).not.toContain("large");
  });

  it("falls back to sizeCategory when sizeLabel is null", () => {
    const text = variantToEmbedText({ brand: "LV", sizeCategory: "mini", sizeLabel: null });
    expect(text).toContain("mini");
  });
});

// ── embedQuery / embedDocuments (degrade without API key) ────────────────────

describe("embedQuery", () => {
  beforeEach(() => {
    vi.stubEnv("VOYAGE_API_KEY", "");
  });

  it("returns null when VOYAGE_API_KEY is not set", async () => {
    const result = await embedQuery("black Chanel flap");
    expect(result).toBeNull();
  });
});

describe("embedDocuments", () => {
  beforeEach(() => {
    vi.stubEnv("VOYAGE_API_KEY", "");
  });

  it("returns array of nulls when VOYAGE_API_KEY is not set", async () => {
    const result = await embedDocuments(["Chanel Classic Flap", "Hermès Birkin"]);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r === null)).toBe(true);
  });

  it("returns empty array for empty input", async () => {
    const result = await embedDocuments([]);
    expect(result).toHaveLength(0);
  });
});
