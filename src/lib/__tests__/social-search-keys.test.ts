import { describe, expect, it } from "vitest";
import {
  SOCIAL_KEYS,
  keysForPlatform,
  resolveTiles,
  matchSocialKey,
  normalizeSearchKey,
  type SocialKeyEntry,
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

describe("resolveTiles (per-platform divergence)", () => {
  // Fixture covering every shape: shared, tiktok-only, instagram-only, and a
  // post floated to the top of TikTok but left in place on Instagram.
  const fixture: SocialKeyEntry[] = [
    { key: "shared one", slug: "shared-one" },
    { key: "tt only", slug: "tt-only", platforms: { tiktok: {} } },
    { key: "ig only", slug: "ig-only", platforms: { instagram: {} } },
    {
      key: "floated",
      slug: "floated",
      platforms: { tiktok: { order: 0 }, instagram: {} },
      cover: "/social-covers/floated.jpg",
    },
  ];

  it("generic (no platform) keeps every entry in registry order", () => {
    expect(resolveTiles(fixture).map((t) => t.key)).toEqual([
      "shared one",
      "tt only",
      "ig only",
      "floated",
    ]);
  });

  it("tiktok grid excludes instagram-only entries", () => {
    const keys = resolveTiles(fixture, "tiktok").map((t) => t.key);
    expect(keys).toContain("shared one");
    expect(keys).toContain("tt only");
    expect(keys).not.toContain("ig only");
  });

  it("instagram grid excludes tiktok-only entries", () => {
    const keys = resolveTiles(fixture, "instagram").map((t) => t.key);
    expect(keys).toContain("ig only");
    expect(keys).not.toContain("tt only");
  });

  it("explicit order floats a post to the top of that platform only", () => {
    expect(resolveTiles(fixture, "tiktok")[0].key).toBe("floated");
    // Instagram left it unordered, so it stays in registry order (last).
    const ig = resolveTiles(fixture, "instagram").map((t) => t.key);
    expect(ig[ig.length - 1]).toBe("floated");
  });

  it("shared cover applies until a platform overrides it", () => {
    const [floatedTt] = resolveTiles(fixture, "tiktok");
    expect(floatedTt.cover).toBe("/social-covers/floated.jpg");
  });
});

describe("live registry per-platform invariants", () => {
  it("every tile resolves to a real slug + speakable key", () => {
    for (const p of ["tiktok", "instagram", undefined] as const) {
      for (const t of keysForPlatform(p)) {
        expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(t.key).toMatch(/^[a-z0-9]+( [a-z0-9]+){0,2}$/);
      }
    }
  });

  it("platform placements only reference known platforms", () => {
    for (const e of SOCIAL_KEYS) {
      if (!e.platforms) continue;
      for (const p of Object.keys(e.platforms)) {
        expect(["tiktok", "instagram"]).toContain(p);
      }
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
