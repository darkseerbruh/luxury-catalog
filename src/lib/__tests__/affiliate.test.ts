import { describe, it, expect, vi, afterEach } from "vitest";
import { isEbayUrl, applyEbayAffiliate, affiliateListingUrl, buildRentalLinks, isCjTrackingUrl, isTheLuxuryClosetUrl, cjDeepLink, isMyGemmaUrl, isAwinTrackingUrl, awinDeepLink, isAmazonUrl, amazonCareSearchUrl, amazonAffiliateActive, isRebagUrl } from "../affiliate";

const DEFAULT_CAMPID = "5339158071";

describe("isEbayUrl", () => {
  it("matches eBay domains", () => {
    expect(isEbayUrl("https://www.ebay.com/itm/1234567890")).toBe(true);
    expect(isEbayUrl("https://ebay.com/itm/1")).toBe(true);
    expect(isEbayUrl("https://www.ebay.co.uk/itm/9")).toBe(true);
  });
  it("rejects non-eBay domains and garbage", () => {
    expect(isEbayUrl("https://www.fashionphile.com/p/abc")).toBe(false);
    expect(isEbayUrl("https://www.therealreal.com/products/x")).toBe(false);
    expect(isEbayUrl("https://notebay.com/itm/1")).toBe(false); // not a real eBay host
    expect(isEbayUrl("not a url")).toBe(false);
  });
});

describe("eBay EPN attribution (campaign id ships in code by default)", () => {
  it("appends the EPN tracking params + the default campid", () => {
    const out = applyEbayAffiliate("https://www.ebay.com/itm/1234567890");
    const u = new URL(out);
    expect(u.searchParams.get("campid")).toBe(DEFAULT_CAMPID);
    expect(u.searchParams.get("mkcid")).toBe("1");
    expect(u.searchParams.get("mkevt")).toBe("1");
    expect(u.searchParams.get("mkrid")).toBe("711-53200-19255-0");
    expect(u.searchParams.get("toolid")).toBe("10001");
    expect(u.pathname).toBe("/itm/1234567890");
  });

  it("preserves an existing query string and adds a custom sub-id", () => {
    const out = applyEbayAffiliate("https://www.ebay.com/sch/i.html?_nkw=chanel+flap", "bag-199");
    const u = new URL(out);
    expect(u.searchParams.get("_nkw")).toBe("chanel flap");
    expect(u.searchParams.get("campid")).toBe(DEFAULT_CAMPID);
    expect(u.searchParams.get("customid")).toBe("bag-199");
  });

  it("returns an empty string untouched (no URL to attribute)", () => {
    expect(applyEbayAffiliate("")).toBe("");
  });

  it("affiliateListingUrl routes eBay listing URLs through the eBay handler", () => {
    const out = affiliateListingUrl("https://www.ebay.com/itm/42", "ebay");
    expect(new URL(out).searchParams.get("campid")).toBe(DEFAULT_CAMPID);
  });

  it("affiliateListingUrl does NOT give eBay another platform's affiliate param", () => {
    const out = affiliateListingUrl("https://www.ebay.com/itm/42", "ebay");
    const u = new URL(out);
    // eBay scheme only — never the single-code params used for FP/TRR/Vestiaire.
    expect(u.searchParams.get("aff")).toBeNull();
    expect(u.searchParams.get("aid")).toBeNull();
  });
});

describe("buildRentalLinks", () => {
  it("returns Vivrelle + Rent the Runway with the bag in the search URL", () => {
    const links = buildRentalLinks("Chanel", "Classic Flap");
    const keys = links.map((l) => l.key);
    expect(keys).toContain("vivrelle");
    expect(keys).toContain("renttherunway");
    for (const l of links) {
      expect(l.url).toMatch(/Chanel/i);
      expect(l.note.length).toBeGreaterThan(0);
    }
  });
  it("returns nothing without a brand or style", () => {
    expect(buildRentalLinks("", "")).toEqual([]);
  });
});

describe("eBay campaign id is overridable via env without a code change", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses NEXT_PUBLIC_EBAY_CAMPAIGN_ID when set", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_EBAY_CAMPAIGN_ID", "9999999999");
    const mod = await import("../affiliate");
    const out = mod.applyEbayAffiliate("https://www.ebay.com/itm/1");
    expect(new URL(out).searchParams.get("campid")).toBe("9999999999");
  });
});

describe("CJ tracking links (The Luxury Closet product feed)", () => {
  const cjLink = "https://www.anrdoezrs.net/links/101810137/type/dlg/https://theluxurycloset.com/us-en/women/x-p1270103";

  it("recognises CJ redirect domains", () => {
    expect(isCjTrackingUrl(cjLink)).toBe(true);
    expect(isCjTrackingUrl("https://www.tkqlhce.com/click?x")).toBe(true);
    expect(isCjTrackingUrl("https://theluxurycloset.com/us-en/women/x-p1270103")).toBe(false);
    expect(isCjTrackingUrl("not a url")).toBe(false);
  });

  it("passes an already-tracked CJ link through unchanged (no double-wrap)", () => {
    expect(affiliateListingUrl(cjLink, "The Luxury Closet")).toBe(cjLink);
  });
});

describe("isAmazonUrl", () => {
  it("matches Amazon and amzn domains", () => {
    expect(isAmazonUrl("https://www.amazon.com/s?k=leather+cleaner")).toBe(true);
    expect(isAmazonUrl("https://amazon.co.uk/dp/B000")).toBe(true);
    expect(isAmazonUrl("https://amzn.to/abc")).toBe(true);
  });
  it("rejects non-Amazon domains and garbage", () => {
    expect(isAmazonUrl("https://www.notamazon.com/x")).toBe(false);
    expect(isAmazonUrl("not a url")).toBe(false);
  });
});

describe("Amazon Associates care search links (dormant until a tag is set)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns a plain, working search link with no tag configured", () => {
    const out = amazonCareSearchUrl("leather conditioner cream handbag");
    const u = new URL(out);
    expect(u.hostname).toBe("www.amazon.com");
    expect(u.searchParams.get("k")).toBe("leather conditioner cream handbag");
    expect(u.searchParams.get("tag")).toBeNull();
    expect(amazonAffiliateActive()).toBe(false);
  });

  it("appends the Associates tag once configured (self-activating)", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG", "luxcat-20");
    const mod = await import("../affiliate");
    const out = mod.amazonCareSearchUrl("suede brush");
    expect(new URL(out).searchParams.get("tag")).toBe("luxcat-20");
    expect(mod.amazonAffiliateActive()).toBe(true);
  });
});

describe("The Luxury Closet deep-link attribution", () => {
  const raw = "https://theluxurycloset.com/us-en/women/bottega-veneta-cassette-p1007702";

  it("detects a raw TLC product URL", () => {
    expect(isTheLuxuryClosetUrl(raw)).toBe(true);
    expect(isTheLuxuryClosetUrl("https://www.theluxurycloset.com/x")).toBe(true);
    expect(isTheLuxuryClosetUrl("https://fashionphile.com/p/x")).toBe(false);
  });

  it("wraps a raw TLC URL in a CJ deep link with our PID", () => {
    const out = affiliateListingUrl(raw, "The Luxury Closet");
    expect(out).toBe(`https://www.anrdoezrs.net/links/101810137/type/dlg/${raw}`);
    expect(cjDeepLink(raw)).toContain("anrdoezrs.net/links/101810137/type/dlg/");
  });

  it("does not double-wrap an already-tracked TLC deep link", () => {
    const wrapped = cjDeepLink(raw);
    expect(affiliateListingUrl(wrapped, "The Luxury Closet")).toBe(wrapped);
  });
});

describe("Rebag deep-link attribution (CJ, like TLC)", () => {
  const raw = "https://www.rebag.com/shop/chanel-classic-flap-medium-black-p1234567";

  it("detects a raw Rebag product URL", () => {
    expect(isRebagUrl(raw)).toBe(true);
    expect(isRebagUrl("https://rebag.com/x")).toBe(true);
    expect(isRebagUrl("https://theluxurycloset.com/x")).toBe(false);
    expect(isRebagUrl("https://notrebag.com/x")).toBe(false);
  });

  it("wraps a raw Rebag URL in a CJ deep link with our PID", () => {
    const out = affiliateListingUrl(raw, "Rebag");
    expect(out).toBe(`https://www.anrdoezrs.net/links/101810137/type/dlg/${raw}`);
  });

  it("does not double-wrap an already-tracked Rebag deep link", () => {
    const wrapped = cjDeepLink(raw);
    expect(affiliateListingUrl(wrapped, "Rebag")).toBe(wrapped);
  });
});

describe("myGemma Awin deep-link attribution", () => {
  const raw = "https://mygemma.com/products/louis-vuitton-neverfull-mm-monogram";

  it("detects a raw myGemma product URL", () => {
    expect(isMyGemmaUrl(raw)).toBe(true);
    expect(isMyGemmaUrl("https://www.mygemma.com/x")).toBe(true);
    expect(isMyGemmaUrl("https://theluxurycloset.com/x")).toBe(false);
  });

  it("wraps a raw myGemma URL in an Awin deep link with our ids", () => {
    const out = affiliateListingUrl(raw, "myGemma");
    expect(out).toContain("https://www.awin1.com/cread.php?");
    expect(out).toContain("awinmid=59483");
    expect(out).toContain("awinaffid=2945769");
    // The destination rides in the URL-encoded `ued` param.
    expect(out).toContain(`ued=${encodeURIComponent(raw)}`);
  });

  it("does not double-wrap an already-tracked Awin deep link", () => {
    const wrapped = awinDeepLink(raw);
    expect(isAwinTrackingUrl(wrapped)).toBe(true);
    expect(affiliateListingUrl(wrapped, "myGemma")).toBe(wrapped);
  });
});
