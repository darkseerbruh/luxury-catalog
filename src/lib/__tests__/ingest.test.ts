import { describe, it, expect } from "vitest";
import { validateObservation, isValidObservation, type PriceObservation } from "../ingest/types";
import { parsePrice, normaliseAmount, parseAllPrices } from "../ingest/price-extract";
import {
  cdxQueryUrl,
  parseCdxResponse,
  snapshotUrl,
  waybackTimestampToDate,
  oneCapturePerYear,
  filterCapturesByKeywords,
} from "../ingest/wayback";
import { allMsrpObservations } from "../ingest/msrp-data";
import { stripTags, extractDate } from "../ingest/html";

const valid: PriceObservation = {
  brand: "Chanel",
  style: "Classic Flap",
  attrs: { size_label: "Medium" },
  platform: "Fashionphile",
  price_type: "listed",
  sale_price: 6500,
  currency: "USD",
  observed_on: "2026-06-22",
  source_url: "https://www.fashionphile.com/p/example",
  confidence: "high",
};

describe("validateObservation", () => {
  it("accepts a well-formed observation", () => {
    expect(validateObservation(valid)).toEqual([]);
    expect(isValidObservation(valid)).toBe(true);
  });

  it("rejects missing source_url", () => {
    expect(validateObservation({ ...valid, source_url: "" })).toContain("missing/invalid source_url");
  });

  it("rejects non-positive price and bad date/type", () => {
    expect(validateObservation({ ...valid, sale_price: 0 })).toContain("bad sale_price: 0");
    expect(validateObservation({ ...valid, observed_on: "2026/06/22" })).toContain("bad observed_on: 2026/06/22");
    // @ts-expect-error testing runtime guard against a bad enum value
    expect(validateObservation({ ...valid, price_type: "guess" })).toContain("bad price_type: guess");
  });
});

describe("price extraction", () => {
  it("parses US-grouped amounts and symbols", () => {
    expect(parsePrice("$3,450.00")).toEqual({ amount: 3450, currency: "USD" });
    expect(parsePrice("USD 12,000")).toEqual({ amount: 12000, currency: "USD" });
    expect(parsePrice("£1,995")).toEqual({ amount: 1995, currency: "GBP" });
  });

  it("parses EU-grouped amounts", () => {
    expect(parsePrice("2.900 €")).toEqual({ amount: 2900, currency: "EUR" });
    expect(parsePrice("1.234,56 €")).toEqual({ amount: 1234.56, currency: "EUR" });
  });

  it("normaliseAmount infers separators", () => {
    expect(normaliseAmount("1,234.56")).toBe(1234.56);
    expect(normaliseAmount("1.234,56")).toBe(1234.56);
    expect(normaliseAmount("2.900")).toBe(2900);
    expect(normaliseAmount("3,450")).toBe(3450);
    expect(normaliseAmount("12,00")).toBe(12); // 2-digit comma = decimal
  });

  it("returns null when no amount present", () => {
    expect(parsePrice("Price on request")).toBeNull();
  });

  it("pulls all prices from a blob", () => {
    const blob = "Black caviar $6,500 · vintage $4,200 · sold";
    expect(parseAllPrices(blob)).toEqual([
      { amount: 6500, currency: "USD" },
      { amount: 4200, currency: "USD" },
    ]);
  });
});

describe("wayback CDX helpers", () => {
  it("builds a JSON query URL with options", () => {
    const u = cdxQueryUrl("fashionphile.com/shop/chanel*", {
      matchType: "prefix",
      collapseTimestamp: 4,
      limit: 100,
    });
    expect(u).toContain("output=json");
    expect(u).toContain("matchType=prefix");
    expect(u).toContain("collapse=timestamp%3A4");
    expect(u).toContain("filter=statuscode%3A200");
    expect(u).toContain("limit=100");
  });

  it("converts timestamps and builds snapshot URLs", () => {
    expect(waybackTimestampToDate("20120514031245")).toBe("2012-05-14");
    expect(waybackTimestampToDate("bad")).toBe("");
    expect(snapshotUrl("20120514031245", "http://x.com/a")).toBe(
      "http://web.archive.org/web/20120514031245id_/http://x.com/a"
    );
  });

  it("parses a CDX response regardless of column order", () => {
    const json = [
      ["original", "timestamp", "statuscode"],
      ["http://x.com/a", "20120101000000", "200"],
      ["http://x.com/b", "20150601000000", "200"],
    ];
    const caps = parseCdxResponse(json);
    expect(caps).toHaveLength(2);
    expect(caps[0].date).toBe("2012-01-01");
    expect(caps[1].original).toBe("http://x.com/b");
  });

  it("returns nothing for an empty/headers-only response", () => {
    expect(parseCdxResponse([["timestamp", "original"]])).toEqual([]);
    expect(parseCdxResponse([])).toEqual([]);
  });

  it("filters captures by URL keywords (all must match)", () => {
    const caps = parseCdxResponse([
      ["timestamp", "original", "statuscode"],
      ["20140101000000", "http://www.fashionphile.com/-CHANEL-Black-Classic-Flap-12345", "200"],
      ["20150101000000", "http://www.fashionphile.com/-CHANEL-Boy-Bag-67890", "200"],
      ["20160101000000", "http://www.fashionphile.com/-GUCCI-Marmont-111", "200"],
    ]);
    const flaps = filterCapturesByKeywords(caps, ["chanel", "flap"]);
    expect(flaps).toHaveLength(1);
    expect(flaps[0].original).toContain("Classic-Flap");
    expect(filterCapturesByKeywords(caps, [])).toHaveLength(3);
  });

  it("ignores query-string keyword matches (UTM false positives)", () => {
    const caps = parseCdxResponse([
      ["timestamp", "original", "statuscode"],
      ["20230101000000", "https://www.fashionphile.com/?utm_content=chanel-flap-guide", "200"],
    ]);
    expect(filterCapturesByKeywords(caps, ["chanel", "flap"])).toHaveLength(0);
  });

  it("keeps the earliest capture per year", () => {
    const caps = parseCdxResponse([
      ["timestamp", "original", "statuscode"],
      ["20120301000000", "http://x.com/a", "200"],
      ["20120101000000", "http://x.com/a", "200"],
      ["20150601000000", "http://x.com/a", "200"],
    ]);
    const yearly = oneCapturePerYear(caps);
    expect(yearly.map((c) => c.date)).toEqual(["2012-01-01", "2015-06-01"]);
  });
});

describe("html helpers", () => {
  it("strips tags/scripts and decodes price entities", () => {
    const html = "<div><style>x{}</style><script>1</script>Black caviar &#36;6,500 &amp; gold</div>";
    expect(stripTags(html)).toBe("Black caviar $6,500 & gold");
  });

  it("extracts dates in several formats", () => {
    expect(extractDate("Sold May 14, 2012 for")).toBe("2012-05-14");
    expect(extractDate("14 May 2012")).toBe("2012-05-14");
    expect(extractDate("on 2012-05-14")).toBe("2012-05-14");
    expect(extractDate("05/14/2012")).toBe("2012-05-14");
    expect(extractDate("no date here")).toBeNull();
  });
});

describe("MSRP dataset", () => {
  it("produces valid, cited retail_msrp observations", () => {
    const obs = allMsrpObservations();
    expect(obs.length).toBeGreaterThan(0);
    for (const o of obs) {
      expect(isValidObservation(o)).toBe(true);
      expect(o.price_type).toBe("retail_msrp");
      expect(o.source_url).toMatch(/^https?:\/\//);
    }
    // Documented Chanel Medium flap pre-2016 trajectory (seed covers 2016+).
    const flap2005 = obs.find((o) => o.observed_on.startsWith("2005"));
    const flap2012 = obs.find((o) => o.observed_on.startsWith("2012"));
    expect(flap2005?.sale_price).toBe(1650);
    expect(flap2012?.sale_price).toBe(4400);
  });
});
