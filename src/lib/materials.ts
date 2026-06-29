/**
 * THE single source of truth for handbag materials.
 *
 * One canonical list, pulled by BOTH the Style-read quiz (the taste finishes) and
 * the Shop material filter, so they can never drift. Anywhere materials are listed
 * on the site, list them from here.
 *
 * Design rules (owner-locked 2026-06-28):
 *  - Brand-neutral. Materials describe style/texture, never a house's leather name
 *    (no "Caviar", "Togo", "Epsom"). Those classify into a generic texture chip.
 *  - A material earns its own CHIP only if it is distinct, recognizable, and
 *    prevalent in our market data. Everything else generic-soft aliases into the
 *    "Fabric" umbrella so a bag is always findable, never dropped to "Other".
 *  - Umbrella chips ("Fabric", "Exotic", "Raffia or woven") carry an `includes`
 *    tooltip so shoppers can see what the bucket covers.
 *
 * `includes` does double duty: it renders the tooltip AND feeds the classifier
 * that maps a raw material string (e.g. "Togo Leather") to its chip.
 *
 * Full rationale + the sync contract: docs/ux/materials-taxonomy.md.
 */

export interface MaterialChip {
  /** Stable slug (the stored value). */
  value: string;
  /** Display label. */
  label: string;
  /** Keyword aliases: classify raw strings here, and render the umbrella tooltip. */
  includes: string[];
  /** True for catch-all buckets that show an "includes" tooltip. */
  umbrella?: boolean;
  /** True if this chip is offered as a Style-read quiz finish (a curated subset). */
  quiz?: boolean;
  /** Short helper shown under the quiz option. */
  hint?: string;
}

/**
 * Display order. Classification checks the distinctive chips first and the two
 * leather chips last (so "patent leather" reads Patent, "togo" reads grained, and
 * a bare "leather" falls to Smooth) — see CLASSIFY_ORDER below.
 */
export const MATERIALS: MaterialChip[] = [
  { value: "smooth-leather", label: "Smooth leather", quiz: true, includes: ["lambskin", "agneau", "calfskin", "calf", "veau", "box calf", "box leather", "swift", "chevre", "chèvre", "barenia", "madame", "nappa", "smooth", "goatskin", "deerskin", "leather", "cuir"] },
  { value: "pebbled", label: "Pebbled or grained leather", quiz: true, hint: "the textured kind", includes: ["caviar", "grained", "grain", "pebbled", "pebble", "togo", "epsom", "clemence", "clémence", "taurillon", "novillo", "fjord", "epi", "saffiano"] },
  { value: "suede", label: "Suede", quiz: true, includes: ["suede", "suède", "nubuck", "doblis", "chamois"] },
  { value: "patent", label: "Patent", quiz: true, includes: ["patent", "vernis", "verni"] },
  { value: "exotic", label: "Exotic", quiz: true, umbrella: true, hint: "like crocodile", includes: ["crocodile", "croco", "alligator", "niloticus", "porosus", "ostrich", "autruche", "lizard", "lézard", "lezard", "python", "exotic", "stingray", "galuchat"] },
  { value: "tweed", label: "Tweed", quiz: true, includes: ["tweed", "bouclé", "boucle"] },
  { value: "raffia", label: "Raffia or woven", quiz: true, umbrella: true, includes: ["raffia", "raphia", "straw", "paille", "wicker", "crochet", "woven", "basket"] },
  { value: "shearling", label: "Shearling or fur", quiz: true, includes: ["shearling", "fur", "fourrure", "mouton", "mongolian", "sherpa", "teddy"] },
  { value: "embellished", label: "Embellished", quiz: true, hint: "crystals, pearls, hand-painted", includes: ["sequin", "crystal", "pearl", "rhinestone", "beaded", "embellish", "embroider", "jeweled"] },
  { value: "nylon", label: "Nylon", quiz: true, hint: "like Prada's", includes: ["nylon", "econyl", "re-nylon", "renylon", "tessuto"] },
  { value: "canvas", label: "Canvas", includes: ["canvas", "coated", "monogram", "damier", "gg supreme", "gg canvas", "toile", "jacquard"] },
  { value: "velvet", label: "Velvet", includes: ["velvet", "velours"] },
  { value: "denim", label: "Denim", includes: ["denim", "jean"] },
  { value: "fabric", label: "Fabric", umbrella: true, includes: ["satin", "jersey", "wool", "laine", "felt", "feutre", "cotton", "coton", "silk", "soie", "mesh", "knit", "cashmere", "fabric", "textile", "terry"] },
];

/** Quiz finishes: the curated subset shown in the Style-read quiz. */
export const QUIZ_FINISHES = MATERIALS.filter((m) => m.quiz);

/** All chip labels, for "list materials anywhere" needs. */
export const MATERIAL_CHIP_LABELS = MATERIALS.map((m) => m.label);

/** Map slug → label. */
const BY_VALUE = new Map(MATERIALS.map((m) => [m.value, m]));
export function materialLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}

/** The umbrella "includes" list for a chip, for the tooltip (capitalized words). */
export function materialIncludes(value: string): string[] {
  const chip = BY_VALUE.get(value);
  if (!chip?.umbrella) return [];
  return chip.includes
    .filter((k) => /^[a-z]/.test(k) && k.length > 2)
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1));
}

// Classification order: distinctive chips first, leather catch-alls (pebbled then
// smooth) last so "patent leather" → Patent and a bare "leather" → Smooth.
const CLASSIFY_ORDER: MaterialChip[] = [
  ...MATERIALS.filter((m) => m.value !== "smooth-leather" && m.value !== "pebbled"),
  BY_VALUE.get("pebbled")!,
  BY_VALUE.get("smooth-leather")!,
];

/** Legacy family names (pre-canonical) → current chip label, for learned overrides. */
const LEGACY: Record<string, string> = {
  Leather: "Smooth leather",
  "Coated canvas": "Canvas",
  Fabric: "Fabric",
  Exotic: "Exotic",
  Suede: "Suede",
  Patent: "Patent",
};

/** The material chip label for a raw material string (e.g. "Togo Leather" → "Pebbled or grained leather"), or null. */
export function materialChip(name: string | null, learned: Record<string, string> = {}): string | null {
  if (!name) return null;
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  if (!n) return null;
  // Keyword rules win: they encode the finer, brand-neutral chips (nylon, tweed,
  // denim split out of the old coarse "Fabric"). Learned overrides — built for the
  // old coarse taxonomy — only fill genuine unknowns, normalised to current chips.
  for (const chip of CLASSIFY_ORDER) {
    if (chip.includes.some((k) => n.includes(k))) return chip.label;
  }
  if (learned[n]) return LEGACY[learned[n]] ?? learned[n];
  return null;
}
