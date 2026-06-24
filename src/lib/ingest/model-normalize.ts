/**
 * Model-name normalizer for discovered_listing triage + alias aggregation.
 *
 * Maps a (brand, raw marketplace title) to a CLEAN canonical model name so listings
 * cluster, returns null when it's an accessory/SLG or no known model is found (honors
 * "never invent"). Also resolves sub-brand / collab / accent variants to one canonical
 * brand, and assigns a Chanel tier (icon / named line / seasonal-runway) per the
 * brand-naming research (docs/brand-naming-research.md).
 *
 * Dictionary is curated (not derived from the polluted catalog `style` table). Extend
 * MODELS / BRAND_ALIASES as new recurring models surface in triage.
 */

/** Accessory / small-leather-good / non-bag tokens — NOT bags we assign a model to. */
const SLG_TOKENS = [
  "wallet", "card holder", "cardholder", "card case", "coin", "purse on chain",
  "pouch", "pochette accessoires", "key pouch", "key case", "agenda", "passport",
  "cosmetic", "compact", "sunglass", "scarf", "twilly", "bandeau",
  "loafer", "sandal", "sneaker", "mule", "pump", "espadrille", "slide", "shoe", "boot",
  "bag charm", "phone holder", "airpod", "earring", "necklace", "brooch", "cuff",
];

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function has(hay: string, token: string): boolean {
  if (token.includes(" ")) return hay.includes(token);
  return new RegExp(`\\b${esc(token)}\\b`).test(hay);
}

/** SLG match, plural-tolerant (so "loafers"/"mules"/"sneakers" are caught, not just singular). */
function hasSlg(hay: string, token: string): boolean {
  if (token.includes(" ")) return hay.includes(token);
  return new RegExp(`\\b${esc(token)}s?\\b`).test(hay);
}

/**
 * Brand-alias map: raw house/sub-brand/collab string → ONE canonical brand. First match
 * wins, so list collabs' PRIMARY house early (e.g. "Gucci x Balenciaga" → Gucci). Covers
 * sub-lines (Christian Dior, DIOR MEN, Dior Homme, Baby Dior), accents (Hermes→Hermès,
 * Céline→Celine), and collab prefixes.
 */
const BRAND_ALIASES: [test: RegExp, canonical: string][] = [
  [/herm[eè]s/i, "Hermès"],
  [/dior/i, "Dior"],                          // Christian Dior, DIOR MEN, Dior Homme, Baby Dior, DIOR x …
  [/chanel/i, "Chanel"],                       // Chanel Pharrell, etc.
  [/gucci/i, "Gucci"],                         // Gucci x Adidas/Disney/Balenciaga
  [/(yves\s+)?saint\s*laurent|\bysl\b/i, "Saint Laurent"],
  [/louis\s*vuitton|^lv\b/i, "Louis Vuitton"],
  [/c[eé]line/i, "Celine"],
  [/bottega/i, "Bottega Veneta"],
  [/prada/i, "Prada"],
  [/fendi/i, "Fendi"],
  [/loewe/i, "Loewe"],
  [/coach/i, "Coach"],
  [/burberry/i, "Burberry"],
  [/kate\s*spade/i, "Kate Spade"],
  [/goyard/i, "Goyard"],
  [/balenciaga/i, "Balenciaga"],
];

/** Resolve any raw brand/sub-brand/collab string to a canonical brand. */
export function canonicalBrand(raw: string | null | undefined): string {
  const r = (raw ?? "").trim();
  for (const [re, name] of BRAND_ALIASES) if (re.test(r)) return name;
  return r;
}

type ModelDef = [canonical: string, ...tokens: string[]];

const MODELS: Record<string, ModelDef[]> = {
  Chanel: [
    ["Reissue", "reissue", "2.55"], ["Boy", "boy"],
    ["Chanel 19", "19 flap", "chanel 19"], ["Chanel 22", "chanel 22", "22 bag"], ["Chanel 25", "chanel 25", "25 bag"],
    ["Gabrielle", "gabrielle"], ["Coco Handle", "coco handle"], ["Deauville", "deauville"],
    ["Vanity Case", "vanity"], ["Business Affinity", "business affinity"], ["Trendy CC", "trendy cc"],
    ["Urban Spirit", "urban spirit"],
    ["Classic Flap", "classic flap", "double flap", "single flap", "timeless"],
    ["Wallet on Chain", "wallet on chain", "woc"],
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
    ["Petit Sac Plat", "petit sac plat"], ["Bella", "bella"], ["Diane", "diane"],
    ["CarryAll", "carryall", "carry all"], ["Marellini", "marellini"], ["Loop", "loop"],
  ],
  Gucci: [
    ["Dionysus", "dionysus"], ["GG Marmont", "gg marmont", "marmont"], ["Jackie 1961", "jackie"],
    ["Horsebit 1955", "horsebit"], ["Ophidia", "ophidia"], ["Bamboo 1947", "bamboo"],
    ["Soho Disco", "soho"], ["Diana", "diana"], ["Attache", "attache"], ["Blondie", "blondie"],
    ["Boston", "boston"], ["Princy", "princy"], ["Jolie", "jolie"], ["Queen Margaret", "queen margaret"],
    ["Zumi", "zumi"], ["Sylvie", "sylvie"], ["Padlock", "padlock"], ["Bree", "bree"], ["Aphrodite", "aphrodite"],
  ],
  Hermès: [
    ["Birkin", "birkin"], ["Kelly", "kelly"], ["Constance", "constance"], ["Evelyne", "evelyne"],
    ["Picotin Lock", "picotin"], ["Lindy", "lindy"], ["Bolide", "bolide"], ["Garden Party", "garden party"],
    ["Herbag", "herbag"], ["Roulis", "roulis"], ["Jypsière", "jypsi"], ["Halzan", "halzan"],
    ["Steeple", "steeple"], ["Kaba", "kaba"], ["Jige", "jige"], ["Bride-a-Brac", "bride-a-brac", "bride a brac"],
    ["24/24", "24/24", "24 24"], ["Della Cavalleria", "della cavalleria"], ["In-The-Loop", "in-the-loop", "in the loop"],
    ["Geta", "geta"], ["Toolbox", "toolbox"], ["Trim", "trim"], ["Verrou", "verrou"],
  ],
  Celine: [
    ["Luggage", "luggage"], ["Trotteur", "trotteur"], ["16 (Sixteen)", "16 bag", "sixteen"],
    ["Triomphe", "triomphe"], ["Cabas", "cabas"], ["Belt Bag", "belt bag"], ["Ava", "ava"],
    ["Classic Box", "classic box", "box bag"], ["Sangle", "sangle"], ["Conti", "conti"],
    ["Trio", "trio"], ["Tabou", "tabou"], ["Besace", "besace"],
  ],
  "Saint Laurent": [
    ["Loulou", "loulou"], ["Niki", "niki"], ["College", "college"], ["Icare", "icare"],
    ["Sac de Jour", "sac de jour"], ["Lou Camera", "lou camera", "lou bag"], ["Cassandre Envelope", "envelope"],
    ["Le 5 à 7", "5 à 7", "5 a 7"], ["Manhattan", "manhattan"], ["Solferino", "solferino"],
    ["Kate", "kate"], ["Sunset", "sunset"], ["Jamie", "jamie"],
  ],
  Dior: [
    ["Lady D-Lite", "d-lite", "lady d-lite"], ["Lady D-Joy", "d-joy", "d joy"], ["Lady Dior", "lady dior"],
    ["Saddle", "saddle"], ["Book Tote", "book tote", "book"], ["30 Montaigne", "30 montaigne", "montaigne"],
    ["Caro", "caro"], ["Bobby", "bobby"], ["Dior Toujours", "toujours"], ["Diorama", "diorama"], ["Dior Key", "dior key"],
  ],
  "Bottega Veneta": [
    ["Andiamo", "andiamo"], ["Arco", "arco"], ["Jodie", "jodie"], ["Cassette", "cassette"],
    ["The Pouch", "pouch"], ["Lauren 1980", "lauren"], ["Loop", "loop"], ["Sardine", "sardine"],
    ["Knot", "knot"], ["Hop", "hop"],
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
 * Map a (brand, raw title) → canonical model, or null when it's an accessory/SLG or no
 * known model matches. `brand` may be a raw/sub-brand string — it's canonicalized here.
 */
export function canonicalModel(brand: string, rawName: string | null | undefined): string | null {
  const hay = (rawName ?? "").toLowerCase().replace(/&amp;/g, "&");
  if (!hay) return null;
  if (SLG_TOKENS.some((t) => hasSlg(hay, t.trim()))) return null;
  const defs = MODELS[canonicalBrand(brand)];
  if (!defs) return null;
  for (const [canonical, ...tokens] of defs) {
    if (tokens.some((t) => has(hay, t))) return canonical;
  }
  return null;
}

/** Top-tier permanent icons per house (the rest of the dictionary = "named line"). */
const ICONS: Record<string, Set<string>> = {
  Chanel: new Set(["Classic Flap", "Reissue", "Boy", "Chanel 19", "Chanel 22", "Chanel 25", "Wallet on Chain"]),
  Hermès: new Set(["Birkin", "Kelly", "Constance"]),
  "Louis Vuitton": new Set(["Neverfull", "Speedy", "Alma", "Capucines"]),
  Gucci: new Set(["Dionysus", "GG Marmont", "Jackie 1961"]),
  Dior: new Set(["Lady Dior", "Saddle", "Book Tote"]),
};

/**
 * Bag tier per the naming research:
 *  - "icon"     permanent, universally-known model
 *  - "named"    has a stable recurring model name (e.g. Chanel Business Affinity, Trendy CC)
 *  - "seasonal" Chanel only: no canonical model → seasonal/runway (classify by silhouette + season)
 *  - null       other brands with no model match yet (uncategorised, not necessarily seasonal)
 */
export function bagTier(brand: string, model: string | null): "icon" | "named" | "seasonal" | null {
  const b = canonicalBrand(brand);
  if (model) return ICONS[b]?.has(model) ? "icon" : "named";
  return b === "Chanel" ? "seasonal" : null;
}

export const NORMALIZED_BRANDS = Object.keys(MODELS);
