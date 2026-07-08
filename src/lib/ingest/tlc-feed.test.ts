import { describe, it, expect } from "vitest";
import { parse } from "csv-parse/sync";
import { parseTlcFeedRows, parsePrice, toHttps, type TlcListing } from "./tlc-feed";

/** Build rows the way the loader will (Quoted CSV, header row → objects). */
function rows(csv: string) {
  return parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true }) as Record<string, string>[];
}

const HEADER =
  "id,title,brand,link,image_link,price,sale_price,availability,condition,color,material";

describe("parsePrice", () => {
  it("reads value + currency from Google-format price strings", () => {
    expect(parsePrice("753.00 USD")).toEqual({ value: 753, currency: "USD" });
    expect(parsePrice("1,145 USD")).toEqual({ value: 1145, currency: "USD" });
    expect(parsePrice("943")).toEqual({ value: 943, currency: null });
    expect(parsePrice("")).toEqual({ value: null, currency: null });
    expect(parsePrice(null)).toEqual({ value: null, currency: null });
  });
});

describe("toHttps", () => {
  it("upgrades the TLC http CDN to https and leaves others alone", () => {
    expect(toHttps("http://cdn.theluxurycloset.com/uploads/x.jpg")).toBe(
      "https://cdn.theluxurycloset.com/uploads/x.jpg"
    );
    expect(toHttps("https://example.com/x.jpg")).toBe("https://example.com/x.jpg");
    expect(toHttps(null)).toBeNull();
  });
});

describe("parseTlcFeedRows", () => {
  const csv = [
    HEADER,
    `"p1270103","Bottega Veneta Green Leather Butter Calf Crossbody Bag","Bottega Veneta","https://www.anrdoezrs.net/click?p1270103","http://cdn.theluxurycloset.com/uploads/products/full/p1270103-001.jpg","753.00 USD","","in stock","used","Green","Leather"`,
    `"p1293884","Louis Vuitton Alma MM Red Monogram Vernis Bag","Louis Vuitton","https://www.anrdoezrs.net/click?p1293884","http://cdn.theluxurycloset.com/uploads/products/full/p1293884-001.jpg","1145.00 USD","943.00 USD","in stock","used","Red","Vernis"`,
    // Out of stock row — kept, but flagged out_of_stock.
    `"p999","Chanel Sold Bag","Chanel","https://www.anrdoezrs.net/click?p999","http://cdn.theluxurycloset.com/uploads/products/full/p999.jpg","830 USD","","out of stock","used","Black","Caviar"`,
    // Non-USD row — dropped.
    `"pEUR","Fendi Euro Bag","Fendi","https://www.anrdoezrs.net/click?pEUR","http://cdn.theluxurycloset.com/uploads/products/full/pEUR.jpg","500.00 EUR","","in stock","used","Brown","Leather"`,
    // Missing click link — dropped (can't build a buyable card).
    `"pNoLink","Prada No Link Bag","Prada","","http://cdn.theluxurycloset.com/uploads/products/full/pNoLink.jpg","400 USD","","in stock","used","Black","Nylon"`,
  ].join("\n");

  const listings = parseTlcFeedRows(rows(csv));
  const byId = (id: string) => listings.find((l) => l.externalId === id) as TlcListing;

  it("keeps only USD rows with an id + click link", () => {
    const ids = listings.map((l) => l.externalId).sort();
    expect(ids).toEqual(["p1270103", "p1293884", "p999"]);
  });

  it("parses price and sale price", () => {
    expect(byId("p1270103").price).toBe(753);
    expect(byId("p1270103").salePrice).toBeNull();
    expect(byId("p1293884").price).toBe(1145);
    expect(byId("p1293884").salePrice).toBe(943);
  });

  it("canonicalises the brand name", () => {
    expect(byId("p1270103").brandName).toBe("Bottega Veneta");
    expect(byId("p1293884").brandName).toBe("Louis Vuitton");
  });

  it("normalises availability (fail-safe to out_of_stock)", () => {
    expect(byId("p1270103").availability).toBe("in_stock");
    expect(byId("p999").availability).toBe("out_of_stock");
  });

  it("captures image, condition, color, material, and the click link", () => {
    const l = byId("p1270103");
    expect(l.imageUrl).toContain("cdn.theluxurycloset.com");
    expect(l.itemCondition).toBe("used");
    expect(l.color).toBe("Green");
    expect(l.material).toBe("Leather");
    expect(l.clickUrl).toContain("anrdoezrs.net");
  });

  it("honours a non-default target currency", () => {
    const eur = parseTlcFeedRows(rows(csv), { currency: "EUR" });
    expect(eur.map((l) => l.externalId)).toEqual(["pEUR"]);
  });
});
