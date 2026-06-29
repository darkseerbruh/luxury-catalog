/**
 * The taste "feeling read" generator.
 *
 * Turns a person's quiz answers into a warm, second-person read of what their
 * style *does* (never a label/archetype). Deterministic and hand-authored from
 * the vocabulary below, so it always sounds human and only ever reflects what
 * they actually marked. Source of truth: docs/ux/taste-quiz-spec.md.
 */

export type Mark = "love" | "fine" | "not";

export type Vibe = "structured" | "relaxed" | "edgy" | "boho" | "glam" | "sporty";
export type Logo = "quiet" | "recognizable" | "loud";

export interface TasteAnswers {
  /** Style/vibe marks, keyed by vibe. Absent or "fine" = neutral. */
  vibe?: Partial<Record<Vibe, Mark>>;
  /** The single logo/branding pick. */
  logo?: Logo | null;
  /** Hardware marks, keyed by hardware value (gold, silver, rose-gold, brass, gunmetal). */
  hardware?: Record<string, Mark>;
  /** Finish marks, keyed by finish value. */
  finishes?: Record<string, Mark>;
}

export interface TasteIdentity {
  /** The "You..." screenshot line. */
  headline: string;
  /** The "You feel X. The room feels Y." read. */
  read: string;
  /** Short supporting tags from their "love it" choices. */
  tags: string[];
}

const VIBE_LABEL: Record<Vibe, string> = {
  structured: "Structured",
  relaxed: "Relaxed",
  edgy: "Edgy",
  boho: "Boho",
  glam: "Glam",
  sporty: "Sporty",
};

const VIBE_HEADLINE: Record<Vibe, string> = {
  structured: "You keep it composed.",
  relaxed: "You want it to feel easy.",
  edgy: "You like a little armor.",
  boho: "You want the room to exhale.",
  glam: "You light the place up.",
  sporty: "You want it to keep up.",
};

const VIBE_FEELING: Record<Vibe, { you: string; room: string }> = {
  structured: { you: "composed, in control", room: "that you have it handled" },
  relaxed: { you: "easy, unhurried", room: "calm around you" },
  edgy: { you: "sharp, a little untouchable", room: "it before you speak" },
  boho: { you: "warm, free", room: "welcomed, at ease" },
  glam: { you: "alive, magnetic", room: "drawn in" },
  sporty: { you: "capable, unbothered", room: "that you make it look effortless" },
};

const LOGO_HEADLINE: Record<Logo, string> = {
  quiet: "You don't need it to shout.",
  recognizable: "You're in on it.",
  loud: "You're happy to be appreciated.",
};

const LOGO_MODIFIER: Record<Logo, string> = {
  quiet: "and quietly certain",
  recognizable: "and in on it",
  loud: "and happy to be looked at",
};

const LOGO_TAG: Record<Logo, string> = {
  quiet: "No logos",
  recognizable: "Recognizable",
  loud: "Logo-forward",
};

const HARDWARE_LABEL: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  "rose-gold": "Rose gold",
  brass: "Brass",
  gunmetal: "Gunmetal",
};

const HARDWARE_TEXTURE: Record<string, string> = {
  gold: "warm",
  silver: "cool and clean",
  "rose-gold": "soft and modern",
  brass: "lived-in",
  gunmetal: "with an edge",
};

const FINISH_TEXTURE: Record<string, string> = {
  "smooth-leather": "classic, no fuss",
  suede: "soft and tactile",
  exotic: "daring",
  tweed: "polished",
  embellished: "a little theatrical",
  raffia: "sunlit",
  shearling: "cozy",
};

/**
 * Dominance order when several vibes are loved: lead with the more distinctive
 * one so the read says something, then wink at the runner-up.
 */
const VIBE_PRIORITY: Vibe[] = ["edgy", "glam", "boho", "structured", "sporty", "relaxed"];

const SOFT_STREAK: Partial<Record<Vibe, string>> = {
  structured: "a composed streak",
  relaxed: "an easy streak",
  edgy: "an edge",
  boho: "a soft streak",
  glam: "a bit of sparkle",
  sporty: "an off-duty streak",
};

function lovedKeys(marks: Record<string, Mark> | undefined): string[] {
  if (!marks) return [];
  return Object.keys(marks).filter((k) => marks[k] === "love");
}

/** The loved vibes, ordered by dominance. */
function lovedVibes(answers: TasteAnswers): Vibe[] {
  const marks = answers.vibe ?? {};
  return VIBE_PRIORITY.filter((v) => marks[v] === "love");
}

/** First loved hardware/finish that carries a texture word, in a stable order. */
function lovedTexture(answers: TasteAnswers): string | null {
  for (const k of lovedKeys(answers.hardware)) {
    if (HARDWARE_TEXTURE[k]) return HARDWARE_TEXTURE[k];
  }
  for (const k of lovedKeys(answers.finishes)) {
    if (FINISH_TEXTURE[k]) return FINISH_TEXTURE[k];
  }
  return null;
}

function buildTags(answers: TasteAnswers, primaryVibe: Vibe | null): string[] {
  const tags: string[] = [];
  if (primaryVibe) tags.push(VIBE_LABEL[primaryVibe]);
  if (answers.logo) tags.push(LOGO_TAG[answers.logo]);
  const hw = lovedKeys(answers.hardware).find((k) => HARDWARE_LABEL[k]);
  if (hw) tags.push(HARDWARE_LABEL[hw]);
  return tags;
}

/**
 * Compose the feeling read. Headline leads with the logo line when the logo
 * answer is a decisive pole (quiet/loud); otherwise it leads with the dominant
 * loved vibe. Falls back to a gentle, open read when there is little signal.
 */
export function tasteIdentity(answers: TasteAnswers): TasteIdentity {
  const vibes = lovedVibes(answers);
  const primary = vibes[0] ?? null;
  const second = vibes[1] ?? null;
  const logo = answers.logo ?? null;
  const logoDecisive = logo === "quiet" || logo === "loud";

  // Low signal: nothing loved and no decisive logo pole. Stay warm, never blank.
  if (!primary && !logoDecisive) {
    return {
      headline: "You're open to a lot.",
      read: "You feel easy to please, and that's a good place to start. Here's where we'd begin.",
      tags: logo ? [LOGO_TAG[logo]] : [],
    };
  }

  const headline =
    logoDecisive && logo ? LOGO_HEADLINE[logo] : primary ? VIBE_HEADLINE[primary] : LOGO_HEADLINE[logo as Logo];

  // The "you feel" / "the room feels" lines come from the dominant vibe, with an
  // optional texture word and the logo modifier woven in.
  const feeling = primary ? VIBE_FEELING[primary] : null;
  const texture = lovedTexture(answers);
  const logoMod = logo ? ` ${LOGO_MODIFIER[logo]}` : "";

  let read: string;
  if (feeling) {
    const youParts = [feeling.you];
    if (texture) youParts.push(texture);
    let you = `You feel ${youParts.join(", ")}${logoMod}.`;
    if (second) {
      const streak = SOFT_STREAK[second];
      if (streak) you = `You feel ${youParts.join(", ")}${logoMod}, with ${streak}.`;
    }
    read = `${you} The room feels ${feeling.room}.`;
  } else {
    // Decisive logo with no loved vibe: a short, logo-led read.
    const you = logo === "quiet"
      ? "You feel quietly certain, nothing to prove."
      : "You feel confident, and happy to be looked at.";
    read = `${you} The room notices.`;
  }

  return { headline, read, tags: buildTags(answers, primary) };
}
