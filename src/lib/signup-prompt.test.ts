import { describe, it, expect } from "vitest";
import {
  COOLDOWN_DAYS,
  VIEW_INTERVAL,
  emptyState,
  markShown,
  markSilenced,
  parseState,
  recordView,
  shouldPrompt,
} from "./signup-prompt";

const DAY = 86_400_000;
const T0 = 1_800_000_000_000;

/** Walk a fresh state through `n` distinct bag views. */
function viewed(n: number, startId = 1) {
  let s = emptyState();
  for (let i = 0; i < n; i++) s = recordView(s, startId + i);
  return s;
}

/** Add `n` further distinct bags to an existing state. */
function plus(state: ReturnType<typeof emptyState>, n: number, startId: number) {
  let s = state;
  for (let i = 0; i < n; i++) s = recordView(s, startId + i);
  return s;
}

describe("recordView", () => {
  it("counts distinct bags only", () => {
    let s = recordView(emptyState(), 42);
    s = recordView(s, 42);
    s = recordView(s, 42);
    expect(s.seen).toEqual([42]);
    expect(s.views).toBe(1);
  });

  it("ignores non-finite ids", () => {
    const s = recordView(emptyState(), Number.NaN);
    expect(s.views).toBe(0);
  });

  it("keeps counting past the dedupe cap, so 'every 5' never stalls", () => {
    const s = viewed(500);
    // The id list is capped...
    expect(s.seen.length).toBeLessThanOrEqual(60);
    // ...but the running total is not. This is the whole point of `views`.
    expect(s.views).toBe(500);
  });
});

describe("shouldPrompt", () => {
  it("stays quiet below the first interval", () => {
    expect(shouldPrompt(viewed(VIEW_INTERVAL - 1), T0)).toBe(false);
  });

  it("asks at the first interval", () => {
    expect(shouldPrompt(viewed(VIEW_INTERVAL), T0)).toBe(true);
  });

  it("asks again every interval, with no ceiling", () => {
    let s = viewed(VIEW_INTERVAL);
    // Ten consecutive asks, each one interval and one day apart.
    for (let ask = 1; ask <= 10; ask++) {
      expect(shouldPrompt(s, T0 + ask * 2 * DAY)).toBe(true);
      s = markShown(s, T0 + ask * 2 * DAY);
      s = plus(s, VIEW_INTERVAL, 1000 * ask);
    }
    expect(s.shows).toBe(10);
    // Still willing to ask an eleventh time.
    expect(shouldPrompt(s, T0 + 100 * DAY)).toBe(true);
  });

  it("holds for one day after an ask", () => {
    const shown = markShown(viewed(VIEW_INTERVAL * 4), T0);
    expect(shouldPrompt(shown, T0 + DAY / 2)).toBe(false);
    expect(shouldPrompt(shown, T0 + DAY + 1)).toBe(true);
  });

  it("needs the next multiple of the interval, not just the cooldown", () => {
    const shown = markShown(viewed(VIEW_INTERVAL), T0);
    const later = T0 + 2 * DAY;
    // Cooldown is over, but they haven't looked at 5 more bags.
    expect(shouldPrompt(shown, later)).toBe(false);
    expect(shouldPrompt(plus(shown, VIEW_INTERVAL, 500), later)).toBe(true);
  });

  it("never asks once they have an account", () => {
    const s = markSilenced(viewed(VIEW_INTERVAL * 20));
    expect(shouldPrompt(s, T0 + 400 * DAY)).toBe(false);
  });

  it("keeps asking a serial dismisser (dismissal changes no state)", () => {
    // Dismissing is a no-op by design, so the only brake is the cooldown.
    let s = markShown(viewed(VIEW_INTERVAL), T0);
    s = plus(s, VIEW_INTERVAL, 900);
    expect(shouldPrompt(s, T0 + COOLDOWN_DAYS * DAY + 1)).toBe(true);
  });
});

describe("parseState", () => {
  it("returns empty state for missing or corrupt storage", () => {
    expect(parseState(null)).toEqual(emptyState());
    expect(parseState("not json")).toEqual(emptyState());
    expect(parseState("[1,2,3]")).toEqual(emptyState());
  });

  it("drops junk entries instead of throwing", () => {
    const s = parseState(
      JSON.stringify({ seen: [1, "two", null, 3], shows: -5, lastShownAt: "nope", silenced: "yes" }),
    );
    expect(s.seen).toEqual([1, 3]);
    expect(s.shows).toBe(0);
    expect(s.lastShownAt).toBeNull();
    // Only a real boolean true silences us; a truthy string must not.
    expect(s.silenced).toBe(false);
  });

  it("recovers a view count from a state written before `views` existed", () => {
    // Shape shipped earlier the same day: seen list, no `views` key.
    const legacy = JSON.stringify({ seen: [1, 2, 3, 4], shows: 0, lastShownAt: null, silenced: false });
    expect(parseState(legacy).views).toBe(4);
  });

  it("round-trips a real state", () => {
    const original = markShown(viewed(7), T0);
    expect(parseState(JSON.stringify(original))).toEqual(original);
  });
});
