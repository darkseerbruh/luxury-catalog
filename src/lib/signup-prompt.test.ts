import { describe, it, expect } from "vitest";
import {
  COOLDOWN_DAYS,
  VIEW_THRESHOLDS,
  emptyState,
  markDismissed,
  markShown,
  markSilenced,
  parseState,
  recordView,
  shouldPrompt,
} from "./signup-prompt";

const DAY = 86_400_000;
const T0 = 1_800_000_000_000;

/** Walk a fresh state through `n` distinct bag views. */
function viewed(n: number) {
  let s = emptyState();
  for (let i = 1; i <= n; i++) s = recordView(s, i);
  return s;
}

describe("recordView", () => {
  it("counts distinct bags only", () => {
    let s = recordView(emptyState(), 42);
    s = recordView(s, 42);
    s = recordView(s, 42);
    expect(s.seen).toEqual([42]);
  });

  it("ignores non-finite ids", () => {
    const s = recordView(emptyState(), Number.NaN);
    expect(s.seen).toEqual([]);
  });

  it("caps remembered ids so the key can't grow forever", () => {
    let s = emptyState();
    for (let i = 0; i < 500; i++) s = recordView(s, i);
    expect(s.seen.length).toBeLessThanOrEqual(60);
    // Keeps the most recent, drops the oldest.
    expect(s.seen.at(-1)).toBe(499);
  });
});

describe("shouldPrompt", () => {
  it("stays quiet below the first threshold", () => {
    expect(shouldPrompt(viewed(VIEW_THRESHOLDS[0] - 1), T0)).toBe(false);
  });

  it("asks once the first threshold is reached", () => {
    expect(shouldPrompt(viewed(VIEW_THRESHOLDS[0]), T0)).toBe(true);
  });

  it("respects the cooldown after an ask", () => {
    const shown = markShown(viewed(VIEW_THRESHOLDS[1]), T0);
    expect(shouldPrompt(shown, T0 + DAY)).toBe(false);
    expect(shouldPrompt(shown, T0 + (COOLDOWN_DAYS + 1) * DAY)).toBe(true);
  });

  it("requires the higher threshold for the second ask", () => {
    const shown = markShown(viewed(VIEW_THRESHOLDS[0]), T0);
    const later = T0 + (COOLDOWN_DAYS + 1) * DAY;
    // Cooldown is over, but they haven't looked at enough more bags.
    expect(shouldPrompt(shown, later)).toBe(false);

    let deeper = shown;
    for (let i = 100; i < 100 + VIEW_THRESHOLDS[1]; i++) deeper = recordView(deeper, i);
    expect(shouldPrompt(deeper, later)).toBe(true);
  });

  it("stops for good after the last ask", () => {
    let s = viewed(VIEW_THRESHOLDS[1]);
    s = markShown(s, T0);
    s = markShown(s, T0 + 30 * DAY);
    expect(shouldPrompt(s, T0 + 400 * DAY)).toBe(false);
  });

  it("never asks a silenced visitor", () => {
    const s = markSilenced(viewed(VIEW_THRESHOLDS[1]));
    expect(shouldPrompt(s, T0 + 400 * DAY)).toBe(false);
  });
});

describe("markDismissed", () => {
  it("leaves the door open after the first dismissal", () => {
    const s = markDismissed(markShown(viewed(VIEW_THRESHOLDS[0]), T0));
    expect(s.silenced).toBe(false);
  });

  it("silences us when they dismiss the final ask", () => {
    let s = viewed(VIEW_THRESHOLDS[1]);
    s = markShown(s, T0);
    s = markShown(s, T0 + 30 * DAY);
    expect(markDismissed(s).silenced).toBe(true);
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

  it("round-trips a real state", () => {
    const original = markShown(viewed(5), T0);
    expect(parseState(JSON.stringify(original))).toEqual(original);
  });
});
