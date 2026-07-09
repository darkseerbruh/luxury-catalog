import { describe, expect, it } from "vitest";
import {
  VENUES,
  VENUES_BY_SLUG,
  authAppliesAtPrice,
  remediesFor,
  REMEDIES,
  TIER_LABELS,
} from "../where-to-buy";

describe("where-to-buy registry", () => {
  it("every venue has a unique slug", () => {
    const slugs = VENUES.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(Object.keys(VENUES_BY_SLUG).length).toBe(slugs.length);
  });

  it("every factual cell carries a source URL and a checked date (the sourcing bar)", () => {
    for (const v of VENUES) {
      const facts = [
        v.authentication.fact,
        v.returns.fact,
        v.paymentProtection.fact,
        ...(v.fakeRemedy ? [v.fakeRemedy.fact] : []),
      ];
      for (const f of facts) {
        expect(f.sourceUrl, `${v.slug} fact missing source`).toMatch(/^https:\/\//);
        expect(f.checkedAt, `${v.slug} fact missing date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("threshold venues require a thresholdUsd", () => {
    for (const v of VENUES) {
      if (v.authentication.type === "physical-threshold") {
        expect(v.authentication.thresholdUsd, v.slug).toBeGreaterThan(0);
      }
    }
  });

  it("every venue has an our-take tier with a label", () => {
    for (const v of VENUES) {
      expect(TIER_LABELS[v.ourTake.tier], v.slug).toBeTruthy();
      expect(v.ourTake.blurb.length, v.slug).toBeGreaterThan(0);
    }
  });

  it("user-facing copy contains no em dashes (voice rule)", () => {
    const strings: string[] = [];
    for (const v of VENUES) {
      strings.push(
        v.ourTake.blurb,
        v.returns.detail,
        v.paymentProtection.detail,
        v.authentication.fact.claim,
        ...(v.fakeRemedy ? [v.fakeRemedy.detail] : []),
      );
    }
    for (const r of Object.values(REMEDIES)) {
      strings.push(r.title, ...r.beats);
    }
    for (const s of strings) {
      expect(s.includes("—"), `em dash in: ${s}`).toBe(false);
    }
  });
});

describe("authAppliesAtPrice (the price-aware flip)", () => {
  it("physical-all venues authenticate at any price", () => {
    expect(authAppliesAtPrice(VENUES_BY_SLUG.fashionphile, 50)).toBe(true);
  });

  it("threshold venues flip at their line", () => {
    const ebay = VENUES_BY_SLUG.ebay;
    expect(authAppliesAtPrice(ebay, 150)).toBe(false);
    expect(authAppliesAtPrice(ebay, 350)).toBe(false);
    expect(authAppliesAtPrice(ebay, 500)).toBe(true);
    expect(authAppliesAtPrice(ebay, 800)).toBe(true);
  });

  it("photo-optional and none venues never flip to covered", () => {
    expect(authAppliesAtPrice(VENUES_BY_SLUG.mercari, 5000)).toBe(false);
    expect(authAppliesAtPrice(VENUES_BY_SLUG["facebook-marketplace"], 5000)).toBe(false);
  });

  it("the $500 threshold brackets both sides (the fact the matrix states inline)", () => {
    const ebay = VENUES_BY_SLUG.ebay;
    expect(authAppliesAtPrice(ebay, 499)).toBe(false);
    expect(authAppliesAtPrice(ebay, 500)).toBe(true);
  });
});

describe("remediesFor", () => {
  it("a venue with no gaps composes no remedies", () => {
    expect(remediesFor(VENUES_BY_SLUG.fashionphile)).toHaveLength(0);
  });

  it("facebook-marketplace composes the full library", () => {
    const r = remediesFor(VENUES_BY_SLUG["facebook-marketplace"]);
    expect(r.map((x) => x.gap)).toEqual([
      "authentication",
      "payment",
      "returns",
      "unknown-seller",
    ]);
  });
});
