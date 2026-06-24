/**
 * Color + material taxonomy for the Shop filters — PURE, no IO, unit-tested.
 *
 * Handbag shoppers think in two layers at once: a broad FAMILY ("show me browns", "show me
 * leather") and a SPECIFIC name they care about ("Étoupe", "Togo"). A flat list loses that —
 * "Leather" and "Togo Leather" sit side by side as if unrelated, and "Étoupe" hides from a
 * shopper browsing browns. These classifiers map a specific value to its family so the UI can
 * group specifics under families (and offer an inclusive "All brown" / "All leather"), while
 * keeping the exact name selectable. Unknowns return null → bucketed under "Other".
 *
 * Keyword-based and deliberately forgiving (designer names are messy and bilingual). Order
 * matters: more specific / compound cues are checked before generic ones.
 */

/** Family label → substrings that imply it. First family with any hit wins (order matters). */
const COLOR_FAMILIES: [string, string[]][] = [
  ["Metallic", ["metallic", "gold", "doré", "dore", "silver", "argent", "bronze", "platine", "champagne", "pewter"]],
  ["Multicolor", ["multicolor", "multicolour", "multi", "rainbow", "tie-dye", "tie dye", "patchwork", "graffiti"]],
  ["White", ["white", "blanc", "craie", "chalk", "ivory", "ivoire", "cream", "crème", "creme", "nata", "off-white", "off white", "pearl", "écru", "ecru"]],
  ["Black", ["black", "noir", "onyx", "jet"]],
  ["Grey", ["grey", "gray", "gris", "graphite", "anthracite", "etain", "étain", "charcoal", "slate", "steel"]],
  ["Beige", ["beige", "tan", "taupe", "etoupe", "étoupe", "sable", "sand", "trench", "argile", "biscuit", "nude", "camel", "fauve", "greige", "poudre"]],
  ["Brown", ["brown", "marron", "chocolate", "chocolat", "cognac", "caramel", "havane", "ebene", "ébène", "noisette", "moka", "mocha", "gold leather", "barenia", "espresso", "chestnut"]],
  ["Red", ["red", "rouge", "burgundy", "bordeaux", "wine", "cherry", "cerise", "scarlet", "garance", "braise", "crimson", "maroon"]],
  ["Pink", ["pink", "rose", "fuchsia", "magenta", "blush", "peony", "pivoine", "sakura"]],
  ["Orange", ["orange", "feu", "coral", "corail", "apricot", "abricot", "terracotta", "rust"]],
  ["Yellow", ["yellow", "jaune", "mustard", "moutarde", "lime", "citron", "soleil"]],
  ["Green", ["green", "vert", "khaki", "kaki", "olive", "emerald", "émeraude", "sapin", "menthe", "mint", "sage"]],
  ["Blue", ["blue", "bleu", "navy", "marine", "denim", "indigo", "turquoise", "teal", "cobalt", "azur", "celeste"]],
  ["Purple", ["purple", "violet", "mauve", "lilac", "lavender", "lavande", "plum", "prune", "aubergine"]],
];

/** Material family → substrings. "Leather" is the catch-all for grained/smooth calf leathers. */
const MATERIAL_FAMILIES: [string, string[]][] = [
  ["Exotic", ["crocodile", "croco", "alligator", "niloticus", "porosus", "ostrich", "autruche", "lizard", "lézard", "lezard", "python", "exotic", "stingray", "galuchat"]],
  ["Suede", ["suede", "suède", "nubuck", "doblis", "veau doblis", "chamois"]],
  ["Patent", ["patent", "vernis", "verni"]],
  ["Coated canvas", ["coated", "monogram", "damier", "gg supreme", "gg canvas", "toile", "coated canvas", "phw canvas"]],
  ["Fabric", ["tweed", "jersey", "wool", "laine", "felt", "feutre", "raffia", "raphia", "straw", "paille", "denim", "satin", "velvet", "velours", "shearling", "fabric", "textile", "mesh", "knit"]],
  [
    "Leather",
    [
      "togo", "clemence", "clémence", "epsom", "caviar", "lambskin", "agneau", "calfskin", "veau", "box calf",
      "box leather", "swift", "chevre", "chèvre", "barenia", "fjord", "evercolor", "evergrain", "taurillon",
      "novillo", "madame", "sombrero", "grained", "smooth leather", "calf", "goatskin", "deerskin", "leather",
    ],
  ],
];

import overrides from "./data/spec-families.json";

/** The controlled vocabulary of families (for the LLM classifier to choose from). */
export const COLOR_FAMILY_NAMES: string[] = COLOR_FAMILIES.map(([f]) => f);
export const MATERIAL_FAMILY_NAMES: string[] = MATERIAL_FAMILIES.map(([f]) => f);

const COLOR_OVERRIDES = (overrides.colors ?? {}) as Record<string, string>;
const MATERIAL_OVERRIDES = (overrides.materials ?? {}) as Record<string, string>;

function classify(
  name: string | null,
  table: [string, string[]][],
  learned: Record<string, string>,
): string | null {
  if (!name) return null;
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  if (!n) return null;
  // Learned overrides (LLM-classified, committed) win over the keyword rules.
  if (learned[n]) return learned[n];
  for (const [family, keys] of table) {
    if (keys.some((k) => n.includes(k))) return family;
  }
  return null;
}

/** The broad color family for a specific colorway (e.g. "Étoupe" → "Beige"), or null. */
export function colorFamily(name: string | null): string | null {
  return classify(name, COLOR_FAMILIES, COLOR_OVERRIDES);
}

/** The broad material family for a specific leather/material (e.g. "Togo" → "Leather"), or null. */
export function materialFamily(name: string | null): string | null {
  return classify(name, MATERIAL_FAMILIES, MATERIAL_OVERRIDES);
}
