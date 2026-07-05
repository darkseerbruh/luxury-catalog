import { describe, expect, it } from "vitest";
import { productJsonLd, type ObservedOffers } from "../geo";
import type { VariantDetail } from "../queries";

// Minimal fixture covering only the fields productJsonLd/buildLeadAnswer read.
const v = {
  variantId: 42,
  sizeLabel: "MM",
  exteriorColorway: "Monogram",
  hardwareColor: "Gold",
  yearStart: 2007,
  yearEnd: null,
  stillInProduction: true,
  retailPriceOriginal: 2030,
  currency: "USD",
  authenticationMarkers: null,
  style: { name: "Neverfull", silhouette: "tote" },
  brand: { name: "Louis Vuitton" },
  exteriorMaterial: { name: "Coated canvas" },
  productionRecords: [],
  serialTags: [],
  interiorStorage: [],
} as unknown as VariantDetail;

const url = "https://www.luxurycatalog.com/bag/42";

describe("productJsonLd offers (GSC product-snippets requirement)", () => {
  it("emits an AggregateOffer built from observed listings", () => {
    const offers: ObservedOffers = {
      lowPrice: 950,
      highPrice: 2100,
      offerCount: 17,
      priceCurrency: "USD",
    };
    const ld = productJsonLd(v, url, { offers, image: "https://cdn.example.com/neverfull.jpg" });
    expect(ld.offers).toEqual({
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: 950,
      highPrice: 2100,
      offerCount: 17,
    });
    expect(ld.image).toBe("https://cdn.example.com/neverfull.jpg");
  });

  it("omits offers and image entirely when there is no observed data (never invent)", () => {
    const ld = productJsonLd(v, url);
    expect(ld).not.toHaveProperty("offers");
    expect(ld).not.toHaveProperty("image");
    // Core Product fields still present.
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Louis Vuitton Neverfull MM");
    expect(ld.url).toBe(url);
  });

  it("omits offers when explicitly null (page had sold history but no live listings)", () => {
    const ld = productJsonLd(v, url, { offers: null, image: null });
    expect(ld).not.toHaveProperty("offers");
    expect(ld).not.toHaveProperty("image");
  });
});
