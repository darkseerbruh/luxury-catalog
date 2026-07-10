/**
 * Regression tests for the Fashionphile curated-target SELECTOR
 * (supabase/ingest/sources/fashionphile.ts → selectTarget).
 *
 * Bug (2026-07-10): a product can satisfy more than one target — a size-less
 * generic (require `["wander"]`) and a size-anchored sibling (require
 * `["miu-miu", "small-wander"]`). The adapter used `Array.find` (first match),
 * and because the per-brand sweep-target files are appended AFTER the inline icon
 * targets, the size-less generic won. Every Miu Miu Wander/Aventure size collapsed
 * onto one "Standard" bucket, so the sized variants never got priced. The fix is
 * to pick the MOST SPECIFIC matching target instead of the first.
 *
 * No network / DB — asserts against the real exported TARGETS.
 */
import { describe, it, expect } from "vitest";
import { selectTarget, TARGETS } from "../../../supabase/ingest/sources/fashionphile";
import type { FashionphileTarget } from "../../../supabase/ingest/sources/fashionphile";

/** Convenience: match a real handle against the live TARGETS and return style|size. */
function pick(handle: string): { style: string; size: string } | null {
  const t = selectTarget(handle, "");
  return t ? { style: t.style, size: t.size_label } : null;
}

describe("selectTarget — Miu Miu size buckets (the reported bug)", () => {
  it("routes a small-wander handle to Wander [Small], not the size-less Standard", () => {
    expect(pick("miu-miu-nappa-matelasse-small-wander-hobo-pink-1884589")).toEqual({
      style: "Wander",
      size: "Small",
    });
  });

  it("routes a mini-wander handle to Wander [Mini]", () => {
    expect(pick("miu-miu-nappa-matelasse-mini-wander-hobo-black-1808914")).toEqual({
      style: "Wander",
      size: "Mini",
    });
  });

  it("routes a regular-aventure handle to Aventure [Regular]", () => {
    expect(pick("miu-miu-nappa-aviator-regular-aventure-bag-black-1707413")).toEqual({
      style: "Aventure",
      size: "Regular",
    });
  });

  it("routes a medium-aventure handle to Aventure [Medium]", () => {
    expect(pick("miu-miu-nappa-aviator-medium-aventure-bag-rovere-1912105")).toEqual({
      style: "Aventure",
      size: "Medium",
    });
  });

  it("still routes a size-less wander handle to the Standard bucket", () => {
    // No mini/small anchor → only the size-less generic matches.
    expect(pick("miu-miu-calfskin-softy-piping-wander-hobo-radica-1823840")).toEqual({
      style: "Wander",
      size: "Standard",
    });
  });
});

describe("selectTarget — multi-size brands still bucket correctly (no regression)", () => {
  const cases: Array<[string, string, string]> = [
    // [handle, expected style, expected size]
    ["hermes-togo-birkin-25-gold-ghw-1234567", "Birkin", "25"],
    ["hermes-togo-birkin-30-etoupe-phw-1234567", "Birkin", "30"],
    ["hermes-clemence-birkin-35-black-ghw-1234567", "Birkin", "35"],
    ["hermes-epsom-kelly-sellier-28-black-ghw-1234567", "Kelly", "28"],
    ["hermes-togo-kelly-retourne-32-gold-phw-1234567", "Kelly", "32"],
    ["louis-vuitton-monogram-canvas-neverfull-mm-brown-1234567", "Neverfull", "MM"],
    ["louis-vuitton-damier-ebene-neverfull-pm-brown-1234567", "Neverfull", "PM"],
    ["louis-vuitton-monogram-montsouris-pm-brown-1234567", "Montsouris", "PM"],
    ["louis-vuitton-monogram-montsouris-mm-brown-1234567", "Montsouris", "MM"],
  ];
  it.each(cases)("%s → %s / %s", (handle, style, size) => {
    expect(pick(handle)).toEqual({ style, size });
  });
});

describe("selectTarget — most-specific-match semantics", () => {
  it("prefers the more-anchored target even when it appears LATER in the array", () => {
    // Mirror the real bug shape: generic first, size-anchored second.
    const targets: FashionphileTarget[] = [
      { brand: "Miu Miu", style: "Wander", size_label: "Standard", requireTokens: ["wander"], minPrice: 1, maxPrice: 9e9, searchUrl: "x" },
      { brand: "Miu Miu", style: "Wander", size_label: "Small", requireTokens: ["miu-miu", "small-wander"], minPrice: 1, maxPrice: 9e9, searchUrl: "x" },
    ];
    const t = selectTarget("miu-miu-nappa-matelasse-small-wander-hobo-pink-1884589", "", targets);
    expect(t?.size_label).toBe("Small");
  });

  it("falls back to the generic when only it matches (no size anchor present)", () => {
    const targets: FashionphileTarget[] = [
      { brand: "Miu Miu", style: "Wander", size_label: "Standard", requireTokens: ["wander"], minPrice: 1, maxPrice: 9e9, searchUrl: "x" },
      { brand: "Miu Miu", style: "Wander", size_label: "Small", requireTokens: ["miu-miu", "small-wander"], minPrice: 1, maxPrice: 9e9, searchUrl: "x" },
    ];
    const t = selectTarget("miu-miu-calfskin-softy-piping-wander-hobo-radica-1823840", "", targets);
    expect(t?.size_label).toBe("Standard");
  });

  it("honours excludeTokens and the brand guard", () => {
    // requireTokens present but excluded → no match.
    const excluded: FashionphileTarget[] = [
      { brand: "Miu Miu", style: "Matelassé", size_label: "Standard", requireTokens: ["matelasse"], excludeTokens: ["wander"], minPrice: 1, maxPrice: 9e9, searchUrl: "x" },
    ];
    expect(selectTarget("miu-miu-nappa-matelasse-small-wander-hobo-pink", "", excluded)).toBeNull();
    // Brand guard: a Gucci target must not match a Miu Miu handle on a loose token.
    const crossBrand: FashionphileTarget[] = [
      { brand: "Gucci", style: "Diana", size_label: "Small", requireTokens: ["small"], minPrice: 1, maxPrice: 9e9, searchUrl: "x" },
    ];
    expect(selectTarget("miu-miu-nappa-aviator-small-aventure-bag-rovere", "", crossBrand)).toBeNull();
  });
});

describe("selectTarget — sanity on the live TARGETS array", () => {
  it("exposes a non-trivial TARGETS array including Miu Miu sweep targets", () => {
    expect(TARGETS.length).toBeGreaterThan(100);
    const miuSized = TARGETS.filter(
      (t) => t.brand === "Miu Miu" && (t.size_label === "Small" || t.size_label === "Regular")
    );
    expect(miuSized.length).toBeGreaterThan(0);
  });
});

describe("selectTarget — Miu Miu Matelassé is a BAG bucket, not the material", () => {
  // "matelasse" is a material token carried by many Miu Miu styles' handles, so the
  // Matelassé STYLE target must not swallow siblings / SLGs / non-bags (2026-07-10).
  it("keeps a genuine matelassé bag on Matelassé", () => {
    expect(pick("miu-miu-nappa-matelasse-turnlock-hobo-black-brown-1851996")).toEqual({
      style: "Matelassé",
      size: "Standard",
    });
    expect(pick("miu-miu-nappa-matelasse-dome-crossbody-black-1891463")?.style).toBe("Matelassé");
  });

  it("does NOT route a matelassé Coffer/Bucket onto Matelassé", () => {
    // No Coffer/Bucket target exists, so these fall through (null) rather than polluting.
    expect(pick("miu-miu-nappa-matelasse-coffer-bag-black-1234567")).toBeNull();
    expect(pick("miu-miu-matelasse-bucket-bag-black-1234567")).toBeNull();
  });

  it("does NOT route a matelassé sandal (non-bag) or pouch (SLG) onto Matelassé", () => {
    expect(pick("miu-miu-nappa-matelasse-sporty-sandals-39-black-1739956")).toBeNull();
    expect(pick("miu-miu-nappa-matelasse-pouch-sand-coffee-1865452")).toBeNull();
  });

  it("routes a matelassé Ivy to its own anchored Ivy target, not Matelassé", () => {
    expect(pick("miu-miu-nappa-matelasse-ivy-bag-black-1234567")).toEqual({
      style: "Ivy",
      size: "Standard",
    });
  });
});
