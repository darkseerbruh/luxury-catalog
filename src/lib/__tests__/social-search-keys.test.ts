import { describe, expect, it } from "vitest";
import {
  SOCIAL_KEYS,
  matchSocialKey,
  normalizeSearchKey,
} from "../social-search-keys";

describe("SOCIAL_KEYS registry", () => {
  it("keys are unique", () => {
    const keys = SOCIAL_KEYS.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("slugs are unique", () => {
    const slugs = SOCIAL_KEYS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keys are speakable: lowercase, 1-3 words, letters/digits/spaces only", () => {
    for (const e of SOCIAL_KEYS) {
      expect(e.key, e.key).toMatch(/^[a-z0-9]+( [a-z0-9]+){0,2}$/);
    }
  });

  it("keys are already in normalized form", () => {
    for (const e of SOCIAL_KEYS) {
      expect(normalizeSearchKey(e.key)).toBe(e.key);
    }
  });

  it("slugs look like article slugs", () => {
    for (const e of SOCIAL_KEYS) {
      expect(e.slug, e.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe("matchSocialKey", () => {
  it("matches a key exactly", () => {
    expect(matchSocialKey("chanel 2026")?.slug).toBe("chanel-in-2026-explained");
  });

  it("forgives case, punctuation, and extra whitespace", () => {
    expect(matchSocialKey("  Chanel   2026! ")?.slug).toBe(
      "chanel-in-2026-explained",
    );
  });

  it("does not match partial or superset queries", () => {
    expect(matchSocialKey("chanel")).toBeNull();
    expect(matchSocialKey("chanel 2026 price")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(matchSocialKey("")).toBeNull();
    expect(matchSocialKey("   ")).toBeNull();
  });
});
