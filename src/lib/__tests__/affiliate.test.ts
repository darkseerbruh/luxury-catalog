import { describe, it, expect, vi, afterEach } from "vitest";
import { isEbayUrl, applyEbayAffiliate, affiliateListingUrl } from "../affiliate";

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

describe("affiliate attribution with no env configured (default)", () => {
  it("leaves eBay URLs unchanged when no campaign id is set", () => {
    const url = "https://www.ebay.com/itm/1234567890";
    expect(applyEbayAffiliate(url)).toBe(url);
  });
  it("affiliateListingUrl routes eBay through the eBay handler (no generic param applied)", () => {
    const url = "https://www.ebay.com/itm/1234567890";
    // With nothing configured it stays clean — and importantly is NOT given another
    // platform's affiliate param.
    expect(affiliateListingUrl(url, "ebay")).toBe(url);
    expect(affiliateListingUrl(url, "eBay US")).toBe(url);
  });
});

describe("eBay EPN attribution when campaign id is configured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("appends the EPN tracking params + campid", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_EBAY_CAMPAIGN_ID", "5339158071");
    const mod = await import("../affiliate");
    const out = mod.applyEbayAffiliate("https://www.ebay.com/itm/1234567890");
    const u = new URL(out);
    expect(u.searchParams.get("campid")).toBe("5339158071");
    expect(u.searchParams.get("mkcid")).toBe("1");
    expect(u.searchParams.get("mkevt")).toBe("1");
    expect(u.searchParams.get("mkrid")).toBe("711-53200-19255-0");
    expect(u.searchParams.get("toolid")).toBe("10001");
    expect(u.pathname).toBe("/itm/1234567890");
  });

  it("preserves an existing query string and adds a custom sub-id", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_EBAY_CAMPAIGN_ID", "5339158071");
    const mod = await import("../affiliate");
    const out = mod.applyEbayAffiliate("https://www.ebay.com/sch/i.html?_nkw=chanel+flap", "bag-199");
    const u = new URL(out);
    expect(u.searchParams.get("_nkw")).toBe("chanel flap");
    expect(u.searchParams.get("campid")).toBe("5339158071");
    expect(u.searchParams.get("customid")).toBe("bag-199");
  });

  it("affiliateListingUrl wraps an eBay listing url with the campaign id", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_EBAY_CAMPAIGN_ID", "5339158071");
    const mod = await import("../affiliate");
    const out = mod.affiliateListingUrl("https://www.ebay.com/itm/42", "ebay");
    expect(new URL(out).searchParams.get("campid")).toBe("5339158071");
  });
});
