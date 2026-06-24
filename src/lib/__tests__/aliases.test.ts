import { describe, it, expect } from "vitest";
import { toAlternateNames, resellerNamesByPlatform, communityNicknames, type BagAlias } from "../aliases";

const A = (alias: string, source_type: BagAlias["source_type"], source: string | null): BagAlias =>
  ({ brand: "Chanel", canonical_model: "Classic Flap", tier: "icon", alias, source_type, source, listing_count: 0 });

const SAMPLE: BagAlias[] = [
  A("Classic Flap", "official", "canonical"),
  A("Timeless", "community", "collector"),
  A("CF", "community", "collector"),
  A("Timeless", "community", "collector"),                    // dup
  A("Classic Medium Double Flap Bag", "reseller", "TheRealReal"),
  A("Caviar Quilted Medium Double Flap Black", "reseller", "Fashionphile"),
];

describe("alias helpers", () => {
  it("alternateName = official + community, deduped, minus the canonical name and reseller titles", () => {
    expect(toAlternateNames(SAMPLE, "Classic Flap")).toEqual(["Timeless", "CF"]);
  });

  it("groups reseller 'also seen as' names by platform", () => {
    expect(resellerNamesByPlatform(SAMPLE)).toEqual({
      TheRealReal: ["Classic Medium Double Flap Bag"],
      Fashionphile: ["Caviar Quilted Medium Double Flap Black"],
    });
  });

  it("returns deduped community nicknames", () => {
    expect(communityNicknames(SAMPLE)).toEqual(["Timeless", "CF"]);
  });
});
