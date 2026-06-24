/**
 * Model-name normalizer for discovered_listing triage.
 *
 * The catch-all capture stores each listing's verbose / brand-less marketplace title
 * in `style_guess` (e.g. Fashionphile "Leather Luggage Medium", "Calfskin Floral Print
 * Mini Dionysus Chain Wallet Ivory Pink"). Those don't cluster — every title is near
 * unique, and many are small leather goods that share a bag's model name. This maps a
 * (brand, raw title) to a CLEAN canonical model name so promote-discovered can cluster
 * recurring real bags, or returns null when the title is an accessory/SLG or no known
 * model is found. Honors "never invent": an unrecognised model returns null (stays in
 * discovered for manual triage), it is never guessed.
 *
 * The dictionary is deliberately curated (not derived from the catalog `style` table,
 * which is itself polluted with verbose import names). Extend MODELS per brand as new
 * recurring models surface in the discovered_listing triage.
 */

/** Accessory / small-leather-good / non-bag tokens — these are NOT bags we curate. */
const SLG_TOKENS = [
  "wallet", "card holder", "cardholder", "card case", "card case", "coin", "purse on chain",
  "pouch", "pochette accessoires", "key", "charm", "bracelet", "belt ", "agenda", "passport",
  "cosmetic", "vanity case mini pouch", "compact", "sunglass", "scarf", "twilly", "bandeau",
  "loafer", "sandal", "sneaker", "mule", "pump", "boot", "espadrille", "slide", "shoe",
  "bag charm", "phone", "airpod", "earring", "necklace", "ring ", "brooch", "cuff", "tie ",
];

/** Whole-word-ish presence test (token may contain spaces; word-bounded for single words). */
function has(hay: string, token: string): boolean {
  if (token.includes(" ")) return hay.includes(token);
  return new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(hay);
}

/**
 * Per-brand model dictionary. Each entry: [canonical name, ...match tokens].
 * Tokens are matched case-insensitively against the lowercased title; the FIRST
 * entry (top-to-bottom) whose tokens hit wins, so put more-specific models first
 * (e.g. "Mini Dauphine" handled by size detection, "Pochette Métis" before "Pochette").
 */
type ModelDef = [canonical: string, ...tokens: string[]];

const MODELS: Record<string, ModelDef[]> = {
  Chanel: [
    ["Reissue", "reissue", "2.55"], ["Boy", "boy"], ["Chanel 19", "19 flap", "chanel 19"],
    ["Gabrielle", "gabrielle"], ["Coco Handle", "coco handle"], ["Deauville", "deauville"],
    ["Vanity Case", "vanity"], ["Business Affinity", "business affinity"], ["Trendy CC", "trendy cc"],
    ["Classic Flap", "classic flap", "double flap", "single flap", "timeless flap"],
    ["22 Bag", "chanel 22", "22 bag"], ["Wallet on Chain", "wallet on chain", "woc"],
    ["Camera Bag", "camera"], ["Diana", "diana"], ["Cerf Tote", "cerf"],
    ["Grand Shopping Tote", "grand shopping", "gst"], ["Petite Shopping Tote", "petite shopping", "pst"],
  ],
  "Louis Vuitton": [
    ["Neverfull", "neverfull"], ["Speedy", "speedy"], ["Alma", "alma"], ["Capucines", "capucines"],
    ["OnTheGo", "onthego", "on the go"], ["Pochette Métis", "pochette metis", "métis", "metis"],
    ["Twist", "twist"], ["Coussin", "coussin"], ["Dauphine", "dauphine"], ["Keepall", "keepall"],
    ["Bumbag", "bumbag", "bum bag"], ["NéoNoé", "neonoe", "néonoé", "neo noe"], ["Noé", "noe"],
    ["Petite Malle", "petite malle"], ["Boulogne", "boulogne"], ["Multi Pochette", "multi pochette", "multi-pochette"],
    ["Montaigne", "montaigne"], ["Favorite", "favorite"], ["Félicie", "felicie", "félicie"],
    ["Graceful", "graceful"], ["Delightful", "delightful"], ["Bagatelle", "bagatelle"],
    ["Petit Sac Plat", "petit sac plat"], ["Nano Noé", "nano noe"], ["Diane", "diane"],
    ["CarryAll", "carryall", "carry all"], ["Marellini", "marellini"], ["Loop", "loop"],
  ],
  Gucci: [
    ["Dionysus", "dionysus"], ["GG Marmont", "gg marmont", "marmont"], ["Jackie 1961", "jackie"],
    ["Horsebit 1955", "horsebit"], ["Ophidia", "ophidia"], ["Bamboo 1947", "bamboo"],
    ["Soho Disco", "soho"], ["Diana", "diana"], ["Attache", "attache"], ["Blondie", "blondie"],
    ["Bree", "bree"], ["Aphrodite", "aphrodite"], ["Padlock", "padlock"],
  ],
  Hermès: [
    ["Birkin", "birkin"], ["Kelly", "kelly"], ["Constance", "constance"], ["Evelyne", "evelyne"],
    ["Picotin Lock", "picotin"], ["Lindy", "lindy"], ["Bolide", "bolide"], ["Garden Party", "garden party"],
    ["Herbag", "herbag"], ["Roulis", "roulis"], ["Jypsière", "jypsi"], ["Halzan", "halzan"],
    ["Toolbox", "toolbox"], ["Trim", "trim"], ["Verrou", "verrou"],
  ],
  Celine: [
    ["Luggage", "luggage"], ["Trotteur", "trotteur"], ["16 (Sixteen)", "16 bag", "sixteen"],
    ["Triomphe", "triomphe"], ["Cabas", "cabas"], ["Belt Bag", "belt bag"], ["Ava", "ava"],
    ["Classic Box", "classic box", "box bag"], ["Sangle", "sangle"], ["Conti", "conti"],
    ["Trio", "trio"], ["Nano", "nano"], ["Tabou", "tabou"], ["Besace", "besace"],
  ],
  "Saint Laurent": [
    ["Loulou", "loulou"], ["Niki", "niki"], ["College", "college"], ["Icare", "icare"],
    ["Sac de Jour", "sac de jour"], ["Lou Camera", "lou camera", "lou bag"], ["Cassandre Envelope", "envelope"],
    ["Le 5 à 7", "5 à 7", "5 a 7"], ["Manhattan", "manhattan"], ["Solferino", "solferino"],
    ["Kate", "kate"], ["Sunset", "sunset"], ["Jamie", "jamie"], ["Puffer", "puffer"],
  ],
  Dior: [
    ["Lady Dior", "lady dior"], ["Saddle", "saddle"], ["Lady D-Joy", "d-joy", "d joy"],
    ["Book Tote", "book tote"], ["30 Montaigne", "30 montaigne", "montaigne"], ["Caro", "caro"],
    ["Bobby", "bobby"], ["Dior Toujours", "toujours"], ["Diorama", "diorama"], ["Dior Key", "dior key"],
  ],
  "Bottega Veneta": [
    ["Andiamo", "andiamo"], ["Arco", "arco"], ["Jodie", "jodie"], ["Cassette", "cassette"],
    ["The Pouch", "pouch"], ["Lauren 1980", "lauren"], ["Loop", "loop"], ["Sardine", "sardine"],
    ["Knot", "knot"], ["Hop", "hop"], ["Andiamo", "andiamo"],
  ],
  Prada: [
    ["Re-Edition 2005", "re-edition 2005", "2005"], ["Galleria", "galleria"], ["Cleo", "cleo"],
    ["Symbole", "symbole"], ["Re-Edition", "re-edition", "re edition"], ["Moon", "moon"],
    ["Arqué", "arque", "arqué"], ["Re-Nylon Backpack", "re-nylon backpack"],
  ],
  Fendi: [
    ["Baguette", "baguette"], ["Peekaboo", "peekaboo"], ["Mon Trésor", "mon tresor", "mon trésor"],
    ["Sunshine Shopper", "sunshine"], ["C'mon", "c'mon", "cmon"], ["First", "first"],
    ["By the Way", "by the way"], ["Fendigraphy", "fendigraphy"],
  ],
  Loewe: [
    ["Puzzle Edge", "puzzle edge"], ["Puzzle", "puzzle"], ["Hammock", "hammock"], ["Flamenco", "flamenco"],
    ["Gate", "gate"], ["Goya", "goya"], ["Amazona", "amazona"], ["Squeeze", "squeeze"],
    ["Basket", "basket"], ["Paseo", "paseo"],
  ],
};

/**
 * Map a (brand, raw title) → canonical model name, or null when it's an accessory/SLG
 * or no known model matches. `brand` must already be the canonical brand string.
 */
export function canonicalModel(brand: string, rawName: string | null | undefined): string | null {
  const hay = (rawName ?? "").toLowerCase().replace(/&amp;/g, "&");
  if (!hay) return null;
  if (SLG_TOKENS.some((t) => hay.includes(t.trim()) && (t.includes(" ") || has(hay, t.trim())))) return null;
  const defs = MODELS[brand];
  if (!defs) return null;
  for (const [canonical, ...tokens] of defs) {
    if (tokens.some((t) => has(hay, t))) return canonical;
  }
  return null;
}

/** Brands the dictionary covers (for reporting). */
export const NORMALIZED_BRANDS = Object.keys(MODELS);
