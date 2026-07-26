/**
 * The signed-out signup moment: when someone has looked at enough bags to be
 * doing real research, we ASK them to create an account. Once, quietly, and
 * never over the content.
 *
 * Owner decision (2026-07-25): the catalog stays free forever, but free is not
 * the same as never asking. Someone building a mental shortlist across several
 * bag pages is exactly who an account helps, so that is when we offer it.
 *
 * Owner correction (2026-07-25, same day): ask EVERY 5 bags, with no ceiling.
 * A reader who would rather leave than ever sign up is not a reader we are
 * trying to keep at this stage, because signup is the only controllable route
 * to owned contacts until ad revenue is on the table. The one-day cooldown is
 * the only brake, so in practice a visitor sees this at most once a day.
 *
 * Two rules still shape everything here:
 *   1. The pitch is THEIR value (keep track of the bags you want, hear about
 *      price drops, build a closet other collectors can find you by), not our
 *      data needs. The community give-back is a secondary line, never the
 *      headline. Nothing in the copy implies they own the bag.
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
 * Ask on every Nth distinct bag page, forever. Ask 1 lands at 5 bags, ask 2 at
 * 10, ask 3 at 15, and so on with no ceiling (owner call, 2026-07-25).
 */
export const VIEW_INTERVAL = 5;

/** Days of quiet after an ask before the next one is allowed. */
export const COOLDOWN_DAYS = 1;

/**
 * Cap on remembered variant ids. Dedupe only looks this far back, which is why
 * the running total is a separate counter: the count must keep climbing past
 * the cap or "every 5" would stall at 60 bags.
 */
const MAX_REMEMBERED = 60;

const DAY_MS = 86_400_000;

export interface PromptState {
  /** Recent distinct variant ids, newest last. Used only to avoid double-counting. */
  seen: number[];
  /** Running total of distinct bag pages opened. Only ever climbs. */
  views: number;
  /** How many times we have shown the ask. */
  shows: number;
  /** Epoch ms of the last ask, or null if we've never asked. */
  lastShownAt: number | null;
  /** Set once they have an account. The only thing that stops the asking. */
  silenced: boolean;
}

export function emptyState(): PromptState {
  return { seen: [], views: 0, shows: 0, lastShownAt: null, silenced: false };
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
    const trimmed = seen.slice(-MAX_REMEMBERED);
    const views =
      typeof parsed.views === "number" && parsed.views >= 0 ? Math.floor(parsed.views) : 0;
    return {
      seen: trimmed,
      // A state written before `views` existed still knows how many bags it
      // saw, so fall back to the list length rather than resetting to zero.
      views: Math.max(views, trimmed.length),
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
  return {
    ...state,
    seen: [...state.seen, variantId].slice(-MAX_REMEMBERED),
    views: state.views + 1,
  };
}

/**
 * Should we ask right now?
 *
 * Ask 1 at 5 distinct bags, ask 2 at 10, ask 3 at 15, with no ceiling. Only two
 * things hold us back: they already have an account, or we asked inside the
 * last day. Dismissing does NOT buy permanent quiet (owner call, 2026-07-25).
 */
export function shouldPrompt(state: PromptState, now: number): boolean {
  if (state.silenced) return false;
  if (state.lastShownAt != null && now - state.lastShownAt < COOLDOWN_DAYS * DAY_MS) return false;
  return state.views >= (state.shows + 1) * VIEW_INTERVAL;
}

/** Mark an ask as shown. */
export function markShown(state: PromptState, now: number): PromptState {
  return { ...state, shows: state.shows + 1, lastShownAt: now };
}

// NOTE: there is deliberately no `markDismissed`. Dismissing changes no state:
// `markShown` already started the one-day cooldown, and "not now" means not
// now, not never. The only thing that stops the asking is having an account.

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
