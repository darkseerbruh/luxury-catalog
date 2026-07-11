import { describe, expect, it } from "vitest";
import {
  SELL_VENUES,
  SELL_VENUES_BY_SLUG,
  estimateNet,
  rankByNet,
  tipsFor,
  TIPS,
  PRICE_FIRST,
  TIER_LABELS,
} from "../where-to-sell";

describe("where-to-sell registry", () => {
  it("every venue has a unique slug", () => {
    const slugs = SELL_VENUES.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(Object.keys(SELL_VENUES_BY_SLUG).length).toBe(slugs.length);
  });

  it("every factual cell carries a source URL and a checked date (the sourcing bar)", () => {
    for (const v of SELL_VENUES) {
      const facts = [
        v.payoutSpeed.fact,
        v.payoutMethods.fact,
        v.acceptance.fact,
        v.effort.fact,
        v.sellerAuth.fact,
        ...(v.buyout ? [v.buyout.fact] : []),
        ...(v.priceControl.fact ? [v.priceControl.fact] : []),
      ];
      for (const f of facts) {
        expect(f.sourceUrl, `${v.slug} fact missing source`).toMatch(/^https:\/\//);
        expect(f.checkedAt, `${v.slug} fact missing date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("consignment venues that let the venue price it are sourced (a claim, not a guess)", () => {
    for (const v of SELL_VENUES) {
      if (v.priceControl.who === "venue-sets") {
        expect(v.priceControl.fact, `${v.slug} venue-sets price needs a source`).not.toBeNull();
      }
    }
  });

  it("commission tiers never overlap and rise with price", () => {
    for (const v of SELL_VENUES) {
      const p = v.payout;
      if (p.kind !== "band" && p.kind !== "marginal") continue;
      for (let i = 1; i < p.tiers.length; i++) {
        expect(p.tiers[i].minUsd, `${v.slug} tiers must be contiguous`).toBe(p.tiers[i - 1].maxUsd);
      }
    }
  });

  it("every venue has an our-take tier with a label and blurb", () => {
    for (const v of SELL_VENUES) {
      expect(TIER_LABELS[v.ourTake.tier], v.slug).toBeTruthy();
      expect(v.ourTake.blurb.length, v.slug).toBeGreaterThan(0);
    }
  });

  it("user-facing copy contains no em dashes (voice rule)", () => {
    const strings: string[] = [];
    for (const v of SELL_VENUES) {
      strings.push(
        v.ourTake.blurb,
        v.payoutSpeed.detail,
        v.acceptance.detail,
        v.effort.detail,
        v.priceControl.detail,
        v.sellerAuth.detail,
      );
    }
    for (const t of Object.values(TIPS)) {
      strings.push(t.title, ...t.beats);
    }
    strings.push(PRICE_FIRST.title, ...PRICE_FIRST.beats);
    for (const s of strings) {
      expect(s.includes("—"), `em dash in: ${s}`).toBe(false);
    }
  });
});

describe("estimateNet (the signature move)", () => {
  it("flat venues keep a constant share", () => {
    // Mercari: flat 10% fee, keep 90%.
    const est = estimateNet(SELL_VENUES_BY_SLUG.mercari, 1000);
    expect(est).toEqual({ kind: "net", net: 900, keepPct: 90 });
  });

  it("band venues use the whole-sale rate for the matching band", () => {
    // The RealReal: $300-749 keeps 60%, $1500-4999 keeps 70%.
    expect(estimateNet(SELL_VENUES_BY_SLUG.therealreal, 500)).toMatchObject({ net: 300, keepPct: 60 });
    expect(estimateNet(SELL_VENUES_BY_SLUG.therealreal, 2000)).toMatchObject({ net: 1400, keepPct: 70 });
  });

  it("band boundaries are half-open (min inclusive, max exclusive)", () => {
    // TRR: exactly $1500 enters the 70% band.
    expect(estimateNet(SELL_VENUES_BY_SLUG.therealreal, 1499)).toMatchObject({ keepPct: 65 });
    expect(estimateNet(SELL_VENUES_BY_SLUG.therealreal, 1500)).toMatchObject({ keepPct: 70 });
  });

  it("marginal venues apply each rate only to the portion in its band", () => {
    // Fashionphile: 70% up to $3,000, 85% above.
    // A $5,000 bag: 3000*0.70 + 2000*0.85 = 2100 + 1700 = 3800.
    const est = estimateNet(SELL_VENUES_BY_SLUG.fashionphile, 5000);
    expect(est).toMatchObject({ kind: "net", net: 3800 });
    // Under the first cap it behaves like a flat 70%.
    expect(estimateNet(SELL_VENUES_BY_SLUG.fashionphile, 2000)).toMatchObject({ net: 1400 });
  });

  it("rankByNet sorts highest net first and is stable across venues", () => {
    const ranked = rankByNet(1000);
    const nets = ranked.map((r) => (r.est.kind === "net" ? r.est.net : -1));
    for (let i = 1; i < nets.length; i++) {
      expect(nets[i]).toBeLessThanOrEqual(nets[i - 1]);
    }
    // Facebook local keeps 100%, so it tops a same-price ranking.
    expect(ranked[0].venue.slug).toBe("facebook-marketplace");
  });
});

describe("tipsFor", () => {
  it("marketplace venues get the do-it-yourself tip", () => {
    expect(tipsFor(SELL_VENUES_BY_SLUG.mercari).map((t) => t.key)).toContain("do-it-yourself");
  });

  it("consignors get the they-price-it and slow-payout tips", () => {
    expect(tipsFor(SELL_VENUES_BY_SLUG.therealreal).map((t) => t.key)).toEqual([
      "they-price-it",
      "slow-payout",
    ]);
  });

  it("facebook marketplace gets the protect-the-sale tip", () => {
    expect(tipsFor(SELL_VENUES_BY_SLUG["facebook-marketplace"]).map((t) => t.key)).toContain(
      "protect-the-sale",
    );
  });
});
