import { describe, it, expect } from "vitest";
import {
  ARTICLE_WEIGHT,
  COOLDOWN_DAYS,
  READ_DEPTH,
  READ_DWELL_MS,
  VIEW_INTERVAL,
  emptyState,
  hasFinishedReading,
  markShown,
  markSilenced,
  parseState,
  recordArticleRead,
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

// --- Articles (added 2026-08-27) ---------------------------------------------

describe("recordArticleRead", () => {
  it("counts a finished guide as a full interval, so one read earns the ask", () => {
    const s = recordArticleRead(emptyState(), "prada-authentication");
    expect(s.articleReads).toBe(1);
    expect(s.views).toBe(ARTICLE_WEIGHT);
    // The whole point of the change: a single guide read is now askable.
    expect(shouldPrompt(s, T0)).toBe(true);
  });

  it("ignores a re-read of the same guide", () => {
    let s = recordArticleRead(emptyState(), "goyard-authentication");
    s = recordArticleRead(s, "goyard-authentication");
    s = recordArticleRead(s, "goyard-authentication");
    expect(s.seenArticles).toEqual(["goyard-authentication"]);
    expect(s.articleReads).toBe(1);
  });

  it("ignores an empty slug", () => {
    expect(recordArticleRead(emptyState(), "")).toEqual(emptyState());
  });

  it("returns the SAME object on a no-op, so the caller can skip the event", () => {
    const before = recordArticleRead(emptyState(), "dior-authentication");
    expect(recordArticleRead(before, "dior-authentication")).toBe(before);
  });

  it("adds up with bag views on one counter", () => {
    // Three bags is short of the ask alone; a finished guide carries it past.
    let s = viewed(3);
    expect(shouldPrompt(s, T0)).toBe(false);
    s = recordArticleRead(s, "how-to-authenticate-a-coach-bag");
    expect(s.views).toBe(3 + ARTICLE_WEIGHT);
    expect(s.bagViews).toBe(3);
    expect(s.articleReads).toBe(1);
    expect(shouldPrompt(s, T0)).toBe(true);
  });

  it("still respects the one-day cooldown", () => {
    const shown = markShown(recordArticleRead(emptyState(), "a"), T0);
    const second = recordArticleRead(shown, "b");
    expect(shouldPrompt(second, T0 + DAY / 2)).toBe(false);
    expect(shouldPrompt(second, T0 + DAY + 1)).toBe(true);
  });
});

describe("hasFinishedReading", () => {
  it("needs BOTH depth and dwell", () => {
    expect(hasFinishedReading(READ_DEPTH, READ_DWELL_MS)).toBe(true);
    // Deep but instant: the signature of a bot, not a reader.
    expect(hasFinishedReading(1, 200)).toBe(false);
    // Parked a long while at the very top.
    expect(hasFinishedReading(0.1, READ_DWELL_MS * 10)).toBe(false);
  });

  it("rejects non-finite inputs rather than throwing", () => {
    expect(hasFinishedReading(Number.NaN, READ_DWELL_MS)).toBe(false);
    expect(hasFinishedReading(1, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("parseState (articles)", () => {
  it("reads a pre-article state without losing its bag history", () => {
    // Shape shipped before 2026-08-27: no seenArticles, no bagViews.
    const legacy = JSON.stringify({
      seen: [1, 2, 3],
      views: 3,
      shows: 0,
      lastShownAt: null,
      silenced: false,
    });
    const s = parseState(legacy);
    expect(s.views).toBe(3);
    // Every point it holds came from a bag, so bagViews must not read back 0.
    expect(s.bagViews).toBe(3);
    expect(s.articleReads).toBe(0);
    expect(s.seenArticles).toEqual([]);
  });

  it("drops junk slugs", () => {
    const s = parseState(JSON.stringify({ seenArticles: ["ok", "", null, 7, "fine"] }));
    expect(s.seenArticles).toEqual(["ok", "fine"]);
  });

  it("round-trips a mixed bag-and-article state", () => {
    const original = markShown(recordArticleRead(viewed(4), "chanel-guide"), T0);
    expect(parseState(JSON.stringify(original))).toEqual(original);
  });
});
