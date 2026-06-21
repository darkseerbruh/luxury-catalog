import { describe, it, expect } from "vitest";
import { sortFeedEvents, bagFrom, type FeedEvent } from "../feed";

function ev(id: string, createdAt: string, over: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id,
    type: "closet_add",
    createdAt,
    actorUserId: "u1",
    actorHandle: "alice",
    actorName: "Alice",
    variantId: 1,
    brandName: "Coach",
    styleName: "Tabby",
    ...over,
  };
}

describe("sortFeedEvents", () => {
  it("orders events newest-first by ISO timestamp", () => {
    const out = sortFeedEvents([
      ev("a", "2026-01-01T00:00:00Z"),
      ev("b", "2026-03-01T00:00:00Z"),
      ev("c", "2026-02-01T00:00:00Z"),
    ]);
    expect(out.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("caps the result to the limit", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      ev(`e${i}`, `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`)
    );
    expect(sortFeedEvents(events, 3)).toHaveLength(3);
  });

  it("does not mutate the input array", () => {
    const input = [ev("a", "2026-01-01T00:00:00Z"), ev("b", "2026-02-01T00:00:00Z")];
    const snapshot = input.map((e) => e.id);
    sortFeedEvents(input);
    expect(input.map((e) => e.id)).toEqual(snapshot);
  });

  it("returns [] for no events", () => {
    expect(sortFeedEvents([])).toEqual([]);
  });

  it("merges mixed event types in one timeline", () => {
    const out = sortFeedEvents([
      ev("closet_1", "2026-01-01T00:00:00Z", { type: "closet_add" }),
      ev("review_1", "2026-05-01T00:00:00Z", { type: "review", rating: 5 }),
      ev("post_1", "2026-03-01T00:00:00Z", { type: "post", postTitle: "Hi" }),
    ]);
    expect(out.map((e) => e.type)).toEqual(["review", "post", "closet_add"]);
  });
});

describe("bagFrom", () => {
  it("extracts variant/brand/style from a nested object join", () => {
    const bag = bagFrom({
      variant_id: 42,
      style: { name: "Marmont", brand: { name: "Gucci" } },
    });
    expect(bag).toEqual({ variantId: 42, brandName: "Gucci", styleName: "Marmont" });
  });

  it("unwraps Supabase array-shaped joins", () => {
    const bag = bagFrom([
      { variant_id: 7, style: [{ name: "Neverfull", brand: [{ name: "Louis Vuitton" }] }] },
    ]);
    expect(bag).toEqual({ variantId: 7, brandName: "Louis Vuitton", styleName: "Neverfull" });
  });

  it("returns all-null for missing / malformed data", () => {
    expect(bagFrom(null)).toEqual({ variantId: null, brandName: null, styleName: null });
    expect(bagFrom({ variant_id: 9, style: null })).toEqual({
      variantId: 9,
      brandName: null,
      styleName: null,
    });
  });
});
