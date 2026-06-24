import { describe, it, expect, vi, afterEach } from "vitest";
import { isEbayUrl, applyEbayAffiliate, affiliateListingUrl } from "../affiliate";

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
