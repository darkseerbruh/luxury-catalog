import { describe, it, expect, vi, beforeEach } from "vitest";
import { synthesizeTasteProfile, generateWhyStrings } from "../personalization/taste-synthesis";
import type { PersonalizationProfile } from "../personalization/types";
import type { ScoredVariant } from "../personalization/ranker";
import type { VariantRow } from "../recommendations-core";

function makeProfile(overrides: Partial<PersonalizationProfile> = {}): PersonalizationProfile {
  return {
    userId: "u1",
    persona: "collector",
    budgetBand: "grail",
    intent: "collecting",
    topAffinities: [],
    brandAffinities: { Chanel: 9, Hermès: 6 },
    attributeAffinities: {
      silhouette: { structured: 6 },
      hardware: { gold: 4 },
      material: { leather: 5 },
      size: { medium: 3 },
    },
    signalCounts: {
      want_count: 3, have_count: 2, had_count: 1,
      watchlist_count: 1, review_count: 0,
      quiz_completeness: 80, total_interactions: 7,
    },
    tasteVectorSnapshot: null,
    computedAt: null,
    ...overrides,
  };
}

function makeVariant(overrides: Partial<ScoredVariant> = {}): ScoredVariant {
  const row: VariantRow = {
    variant_id: 1,
    size_category: "medium",
    hardware_color: "gold",
    exterior_colorway: "black",
    size_label: "Medium",
    retail_price_original: 5500,
    currency: "USD",
    style: { name: "Classic Flap", silhouette: "structured", brand: { name: "Chanel" } },
    exterior_material: { material_type: "leather" },
    carry_method: [{ carry_type: "shoulder", possible: "yes" }],
  };
  return { variantId: 1, row, score: 0.8, why: "", algo: "affinity", ...overrides };
}

// ── synthesizeTasteProfile ────────────────────────────────────────────────────

describe("synthesizeTasteProfile", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  it("returns null when ANTHROPIC_API_KEY is not set", async () => {
    const result = await synthesizeTasteProfile(makeProfile());
    expect(result).toBeNull();
  });

  it("returns null for a cold-start profile with < 2 interactions", async () => {
    const p = makeProfile({
      signalCounts: {
        want_count: 0, have_count: 0, had_count: 0,
        watchlist_count: 0, review_count: 0,
        quiz_completeness: 0, total_interactions: 1,
      },
    });
    const result = await synthesizeTasteProfile(p);
    expect(result).toBeNull();
  });
});

// ── generateWhyStrings ────────────────────────────────────────────────────────

describe("generateWhyStrings", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  it("returns empty map when ANTHROPIC_API_KEY is not set", async () => {
    const result = await generateWhyStrings(makeProfile(), [makeVariant()]);
    expect(result.size).toBe(0);
  });

  it("returns empty map for empty variants list", async () => {
    const result = await generateWhyStrings(makeProfile(), []);
    expect(result.size).toBe(0);
  });
});
