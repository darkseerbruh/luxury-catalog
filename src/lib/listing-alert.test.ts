import { describe, it, expect } from "vitest";
import { pickNewListing, watchCutoff, type ListingRow } from "./listing-alert";

function row(over: Partial<ListingRow> = {}): ListingRow {
  return {
    variant_id: 1,
    sale_price: 4200,
    currency: "USD",
    observed_on: "2026-07-20",
    date_recorded: "2026-07-20",
    listing_ref: "abc",
    platform: "TLC",
    ...over,
  };
}

describe("pickNewListing", () => {
  it("returns null when nothing is newer than the cutoff", () => {
    expect(pickNewListing([row({ observed_on: "2026-07-01" })], "2026-07-10")).toBeNull();
  });

  it("fires on a listing observed after the cutoff", () => {
    const hit = pickNewListing([row({ observed_on: "2026-07-20" })], "2026-07-10");
    expect(hit?.listingRef).toBe("abc");
    expect(hit?.price).toBe(4200);
    expect(hit?.alsoCount).toBe(1);
  });

  it("treats the cutoff as exclusive, so a re-run doesn't re-fire the same day", () => {
    expect(pickNewListing([row({ observed_on: "2026-07-20" })], "2026-07-20")).toBeNull();
  });

  it("counts one listing once however many times it was re-observed", () => {
    const hit = pickNewListing(
      [
        row({ listing_ref: "same", observed_on: "2026-07-18" }),
        row({ listing_ref: "same", observed_on: "2026-07-19" }),
        row({ listing_ref: "same", observed_on: "2026-07-20" }),
      ],
      "2026-07-10",
    );
    expect(hit?.alsoCount).toBe(1);
    // Reports the listing's FIRST sighting, not the latest re-observation.
    expect(hit?.seenOn).toBe("2026-07-18");
  });

  it("counts distinct listings and surfaces the most recent one", () => {
    const hit = pickNewListing(
      [
        row({ listing_ref: "old", observed_on: "2026-07-15", sale_price: 3000 }),
        row({ listing_ref: "new", observed_on: "2026-07-22", sale_price: 5000 }),
      ],
      "2026-07-10",
    );
    expect(hit?.alsoCount).toBe(2);
    expect(hit?.listingRef).toBe("new");
    expect(hit?.price).toBe(5000);
  });

  it("skips rows with no stable listing id (can't tell new from re-observed)", () => {
    expect(pickNewListing([row({ listing_ref: null })], "2026-07-10")).toBeNull();
  });

  it("falls back to date_recorded when observed_on is missing", () => {
    const hit = pickNewListing(
      [row({ observed_on: null, date_recorded: "2026-07-21" })],
      "2026-07-10",
    );
    expect(hit?.seenOn).toBe("2026-07-21");
  });

  it("skips rows with no usable date at all", () => {
    expect(
      pickNewListing([row({ observed_on: null, date_recorded: null })], "2026-07-10"),
    ).toBeNull();
  });

  it("ignores unparseable dates rather than throwing", () => {
    expect(pickNewListing([row({ observed_on: "not-a-date", date_recorded: null })], "2026-07-10"))
      .toBeNull();
  });

  it("handles a null cutoff by treating every dated listing as new", () => {
    const hit = pickNewListing([row({ observed_on: "2026-01-01" })], null);
    expect(hit?.listingRef).toBe("abc");
  });

  it("still fires when the price is missing (availability is the point)", () => {
    const hit = pickNewListing([row({ sale_price: null })], "2026-07-10");
    expect(hit).not.toBeNull();
    expect(hit?.price).toBeNull();
  });

  it("treats a zero or negative price as unknown, not as free", () => {
    expect(pickNewListing([row({ sale_price: 0 })], "2026-07-10")?.price).toBeNull();
    expect(pickNewListing([row({ sale_price: -5 })], "2026-07-10")?.price).toBeNull();
  });

  it("parses a numeric string price", () => {
    expect(pickNewListing([row({ sale_price: "3999.50" })], "2026-07-10")?.price).toBe(3999.5);
  });
});

describe("watchCutoff", () => {
  it("prefers the last availability ping", () => {
    expect(
      watchCutoff({ last_listing_notified_at: "2026-07-20", created_at: "2026-01-01" }),
    ).toBe("2026-07-20");
  });

  it("falls back to when they started watching, so a new watch never floods", () => {
    expect(watchCutoff({ last_listing_notified_at: null, created_at: "2026-07-01" })).toBe(
      "2026-07-01",
    );
  });
});
