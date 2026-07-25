/**
 * The signed-out signup moment: when someone has looked at enough bags to be
 * doing real research, we ASK them to create an account. Once, quietly, and
 * never over the content.
 *
 * Owner decision (2026-07-25): the catalog stays free forever, but free is not
 * the same as never asking. Someone building a mental shortlist across several
 * bag pages is exactly who an account helps, so that is when we offer it.
 *
 * Two rules shape everything here:
 *   1. The pitch is THEIR value (keep the bags you love, hear about price
 *      drops, build a closet other collectors can see), not our data needs.
 *      The community give-back is a secondary line, never the headline.
 *   2. It never blocks. No interstitial, no paywall, no content swap. It is a
 *      dismissible card, so a crawler and a human still get the same page.
 *
 * All state is localStorage on the visitor's own device. Nothing is written
 * server-side for an anonymous visitor, which keeps the bag page's crawler
 * output byte-identical and keeps us out of consent territory.
 */

/** localStorage key holding the serialized {@link PromptState}. */
export const SIGNUP_PROMPT_KEY = "lc:signup-prompt";

/**
 * Distinct bag pages that trigger each successive ask. Four is "they're
 * comparing, not passing through"; the second ask waits until they are clearly
 * deep in a research session. After the second we stop asking, ever.
 */
export const VIEW_THRESHOLDS = [4, 12] as const;

/** Days of quiet after an ask before the next one is allowed. */
export const COOLDOWN_DAYS = 7;

/** Cap on remembered variant ids, so the key can't grow without bound. */
const MAX_REMEMBERED = 60;

const DAY_MS = 86_400_000;

export interface PromptState {
  /** Distinct variant ids this browser has opened, newest last. */
  seen: number[];
  /** How many times we have shown the ask. */
  shows: number;
  /** Epoch ms of the last ask, or null if we've never asked. */
  lastShownAt: number | null;
  /** Set when they dismiss the final ask, or create an account. Stops us for good. */
  silenced: boolean;
}

export function emptyState(): PromptState {
  return { seen: [], shows: 0, lastShownAt: null, silenced: false };
}

/**
 * Parse whatever is in localStorage into a state we can trust. Anything
 * unreadable (hand-edited, from an older shape, corrupted) resets to empty
 * rather than throwing, because a broken counter must never break a bag page.
 */
export function parseState(raw: string | null): PromptState {
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    const seen = Array.isArray(parsed.seen)
      ? parsed.seen.filter((n): n is number => typeof n === "number" && Number.isFinite(n))
      : [];
    return {
      seen: seen.slice(-MAX_REMEMBERED),
      shows: typeof parsed.shows === "number" && parsed.shows >= 0 ? Math.floor(parsed.shows) : 0,
      lastShownAt:
        typeof parsed.lastShownAt === "number" && Number.isFinite(parsed.lastShownAt)
          ? parsed.lastShownAt
          : null,
      silenced: parsed.silenced === true,
    };
  } catch {
    return emptyState();
  }
}

/** Record a bag page view. Repeat views of the same bag don't count twice. */
export function recordView(state: PromptState, variantId: number): PromptState {
  if (!Number.isFinite(variantId) || state.seen.includes(variantId)) return state;
  return { ...state, seen: [...state.seen, variantId].slice(-MAX_REMEMBERED) };
}

/**
 * Should we ask right now?
 *
 * Deliberately conservative: silenced wins over everything, the cooldown is
 * absolute, and we stop after the last threshold. A visitor who ignores us
 * twice is telling us something, so we listen.
 */
export function shouldPrompt(state: PromptState, now: number): boolean {
  if (state.silenced) return false;
  if (state.shows >= VIEW_THRESHOLDS.length) return false;
  if (state.lastShownAt != null && now - state.lastShownAt < COOLDOWN_DAYS * DAY_MS) return false;
  return state.seen.length >= VIEW_THRESHOLDS[state.shows];
}

/** Mark an ask as shown. */
export function markShown(state: PromptState, now: number): PromptState {
  return { ...state, shows: state.shows + 1, lastShownAt: now };
}

/**
 * Mark an ask as dismissed. Dismissing the last available ask silences us for
 * good, so "not now" on the second card means we never ask again.
 */
export function markDismissed(state: PromptState): PromptState {
  return { ...state, silenced: state.shows >= VIEW_THRESHOLDS.length };
}

/** They created an account (or told us to stop). Nothing more to ask. */
export function markSilenced(state: PromptState): PromptState {
  return { ...state, silenced: true };
}

// --- localStorage wrappers. Every one is a no-op when storage is unavailable
// (private mode, blocked cookies), because the prompt is a nice-to-have and a
// storage error must never surface to the reader.

export function readState(): PromptState {
  if (typeof window === "undefined") return emptyState();
  try {
    return parseState(window.localStorage.getItem(SIGNUP_PROMPT_KEY));
  } catch {
    return emptyState();
  }
}

export function writeState(state: PromptState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIGNUP_PROMPT_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: the prompt just won't persist */
  }
}
