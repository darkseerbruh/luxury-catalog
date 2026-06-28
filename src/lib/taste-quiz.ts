/**
 * The taste quiz question set. Pure data shared by the quiz UI and (later) the
 * board matcher. Source of truth: docs/ux/taste-quiz-spec.md.
 *
 * Two input shapes:
 *   - "multi": pick any (occasions).
 *   - "mark": the three-way Love it / It's fine / Not for me, default "fine".
 *   - "single": one pick on a spectrum (logo).
 * Houses are a "mark" question whose options are loaded live from the brand
 * directory, so they are not listed here.
 */

import { OCCASIONS } from "./occasions";

export type QuizInput = "multi" | "mark" | "single";

export interface QuizOption {
  /** Stored value (maps to a catalog attribute where one exists). */
  value: string;
  /** What the user reads. */
  label: string;
  /** Optional one-line helper shown under the label. */
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  input: QuizInput;
  prompt: string;
  /** Sub-line under the prompt. */
  sub?: string;
  options: QuizOption[];
  /** For "mark" questions: skippable, default every row to "fine". */
  skippable?: boolean;
}

/** The three-way mark labels (default = "fine"). */
export const MARKS = [
  { value: "love", label: "Love it" },
  { value: "fine", label: "It's fine" },
  { value: "not", label: "Not for me" },
] as const;

export const OCCASION_QUESTION: QuizQuestion = {
  id: "occasions",
  input: "multi",
  prompt: "What do you carry a bag for?",
  sub: "Pick all that fit. We build a board for each.",
  options: OCCASIONS.filter((o) => o.value !== "special").map((o) => ({
    value: o.value,
    label: o.chip,
    hint:
      o.value === "everyday"
        ? "errands, day to day"
        : o.value === "work"
          ? "carries a laptop or papers"
          : o.value === "evening"
            ? "evenings and special occasions"
            : "trips: weekenders and what flies well",
  })),
};

export const VIBE_QUESTION: QuizQuestion = {
  id: "vibe",
  input: "mark",
  skippable: true,
  prompt: "Which of these are you?",
  sub: "Mark only your strong loves and hard nos. Everything else stays “It's fine.”",
  options: [
    { value: "structured", label: "Structured", hint: "stands on its own, crisp" },
    { value: "relaxed", label: "Relaxed", hint: "soft, unstructured, easy" },
    { value: "edgy", label: "Edgy", hint: "studs, chains, a little tough" },
    { value: "boho", label: "Boho", hint: "soft, earthy, romantic" },
    { value: "glam", label: "Glam", hint: "dressed up, statement" },
    { value: "sporty", label: "Sporty", hint: "casual, easy, functional" },
  ],
};

export const LOGO_QUESTION: QuizQuestion = {
  id: "logo",
  input: "single",
  prompt: "How do you feel about logos?",
  options: [
    { value: "quiet", label: "Keep it quiet", hint: "no visible logos" },
    { value: "recognizable", label: "Recognizable, not loud", hint: "the shape says it, not an allover print" },
    { value: "loud", label: "Love the logo", hint: "bring on the print" },
  ],
};

export const CARRY_QUESTION: QuizQuestion = {
  id: "carry",
  input: "mark",
  skippable: true,
  prompt: "How do you like to carry?",
  options: [
    { value: "top-handle", label: "Top handle" },
    { value: "crossbody", label: "Crossbody", hint: "at the hip" },
    { value: "across-front", label: "Across the front", hint: "worn on the chest, like a sling" },
    { value: "shoulder", label: "Over the shoulder" },
    { value: "belt-bag", label: "Belt bag", hint: "at the waist" },
    { value: "backpack", label: "Backpack" },
  ],
};

export const FINISH_QUESTION: QuizQuestion = {
  id: "finishes",
  input: "mark",
  skippable: true,
  prompt: "Which finishes are you?",
  options: [
    { value: "smooth-leather", label: "Smooth leather" },
    { value: "pebbled", label: "Pebbled or grained leather", hint: "the textured kind" },
    { value: "suede", label: "Suede" },
    { value: "fabric", label: "Nylon or fabric", hint: "like Prada's nylon" },
    { value: "exotic", label: "Exotic skins", hint: "like crocodile" },
    { value: "tweed", label: "Tweed" },
    { value: "patent", label: "Patent" },
    { value: "embellished", label: "Embellished or artistic", hint: "crystals, pearls, hand-painted" },
    { value: "woven", label: "Woven or raffia" },
    { value: "fur", label: "Fur or shearling" },
  ],
};

export const HARDWARE_QUESTION: QuizQuestion = {
  id: "hardware",
  input: "mark",
  skippable: true,
  prompt: "Which hardware are you?",
  options: [
    { value: "gold", label: "Gold" },
    { value: "silver", label: "Silver" },
    { value: "rose-gold", label: "Rose gold" },
    { value: "brass", label: "Brass", hint: "the warm vintage tone" },
    { value: "gunmetal", label: "Gunmetal", hint: "dark" },
  ],
};

/** Ordered question flow (houses are inserted by the UI from live brand data). */
export const QUIZ_FLOW: QuizQuestion[] = [
  OCCASION_QUESTION,
  VIBE_QUESTION,
  LOGO_QUESTION,
  CARRY_QUESTION,
  FINISH_QUESTION,
  HARDWARE_QUESTION,
];
