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

/** Accessory / small-leather-good / non-bag tokens — NOT bags we assign a model to.
 *  Garment/shoe tokens added 2026-07-09 from the residue audit (TRR rows include
 *  apparel; ~1.6k backlog rows were clothing clustering as if they were bags). */
const SLG_TOKENS = [
  "wallet", "card holder", "cardholder", "card case", "coin", "purse on chain",
  "pouch", "pochette accessoires", "pochette accessories", "key pouch", "key case", "agenda", "passport",
  "cosmetic", "compact", "sunglass", "scarf", "twilly", "bandeau",
  "loafer", "sandal", "sneaker", "mule", "pump", "espadrille", "slide", "shoe", "boot",
  "bag charm", "phone holder", "phone case", "airpod", "earring", "necklace", "brooch", "cuff",
  "belt", "watch", "hat", "gloves", "sock", "tights", "swimsuit", "bikini",
  "dress", "blazer", "sweater", "jumper", "jeans", "skirt", "hoodie", "sweatshirt",
  "t-shirt", "t shirt", "tshirt", "tee", "shirt", "jacket", "coat", "pants", "trousers",
  "shorts", "cardigan", "vest", "gown", "blouse", "jumpsuit", "romper", "heels",
  "slingback", "ballerina", "ballet", "derby", "oxford", "bracelet",
];

/** Chain-carry / belted bags whose titles contain an SLG token ("wallet", "pouch",
 *  "belt") but ARE bags the catalog ranks (WOC is an LC-Index style). Checked BEFORE
 *  the SLG gate so those tokens don't dead-end them. */
const BAG_OVERRIDES = [
  "wallet on chain", "woc", "chain wallet", "wallet to go", "to go wallet",
  "easy pouch", "the pouch", "mini pouch", "belt bag", "bum bag", "fanny pack",
  "waist bag", "vanity",
  // LV Multi Pochette Accessoires is a bag (own dictionary def), but its full name
  // contains the "pochette accessoires/accessories" SLG token — override first.
  "multi pochette",
  // BV The Pouch's Teen size, and TLC's unspaced "bumbag" (both are ranked bags).
  "teen pouch", "bumbag",
];

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Space, hyphen, dot and slash are interchangeable separators: URL-slug titles come
 *  back with every separator flattened to a space ("d-lite" -> "d lite") or dropped
 *  entirely between digits ("2.55" -> "255", "24/24" -> "2424"), so a literal token
 *  match under-recognizes exactly the models whose names carry punctuation. The
 *  separator is optional only between digit parts — never between words, so "all-in"
 *  ~ "all in" but not "allin". Word-bounded so it can't fire inside "carryall" or
 *  "chanel 255". Compiled once per token (module-lifetime cache). */
const tokenReCache = new Map<string, RegExp>();
function tokenRegex(token: string, plural: boolean): RegExp {
  const key = plural ? `${token}|s?` : token;
  let re = tokenReCache.get(key);
  if (!re) {
    const parts = token.split(/[\s./-]+/).filter(Boolean);
    const body = parts
      .map((p, i) => {
        if (i === parts.length - 1) return esc(p);
        const sep = /^\d+$/.test(p) && /^\d+$/.test(parts[i + 1]) ? "[\\s./-]*" : "[\\s./-]+";
        return esc(p) + sep;
      })
      .join("");
    re = new RegExp(`\\b${body}${plural ? "s?" : ""}\\b`);
    tokenReCache.set(key, re);
  }
  return re;
}

function has(hay: string, token: string): boolean {
  return tokenRegex(token, false).test(hay);
}

/** SLG match, plural-tolerant (so "loafers"/"mules"/"sneakers" are caught, not just singular). */
function hasSlg(hay: string, token: string): boolean {
  return tokenRegex(token, true).test(hay);
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
  [/chlo[eé]/i, "Chloé"],
  [/givenchy/i, "Givenchy"],
  [/miu\s*miu/i, "Miu Miu"],
  [/the\s*row/i, "The Row"],
  [/balenciaga/i, "Balenciaga"],
  [/valentino/i, "Valentino"],
  [/dolce\s*&?\s*gabbana|\bd&g\b/i, "Dolce & Gabbana"],
  [/michael\s*kors|^mk\b/i, "Michael Kors"],   // incl. "MICHAEL Michael Kors" diffusion line
  [/tory\s*burch/i, "Tory Burch"],
  // New houses with recurring backlog demand (2026-07-09). "^christian$"/"^loro$" catch
  // TRUNCATED feed brand_guesses (listed AFTER /dior/ so "Christian Dior" still wins).
  [/louboutin|^christian$/i, "Christian Louboutin"],
  [/loro\s*piana|^loro$/i, "Loro Piana"],
  [/b[uv]lgari/i, "Bulgari"],
  [/\bmcm\b/i, "MCM"],
  [/ferragamo/i, "Salvatore Ferragamo"],
  [/khaite/i, "Khaite"],
  // Round-2 houses (2026-07-09, token-frequency evidence from titled backlog rows).
  [/versace/i, "Versace"],
  [/marc\s*jacobs/i, "Marc Jacobs"],
  [/stella\s*mccartney/i, "Stella McCartney"],
  [/jimmy\s*choo/i, "Jimmy Choo"],
  [/moynat/i, "Moynat"],
  [/ala[iï]a/i, "Alaïa"],
  [/delvaux/i, "Delvaux"],
  [/alexander\s*wang/i, "Alexander Wang"],
  [/judith\s*leiber|^judith$/i, "Judith Leiber"],
  // Catalog brands previously missing here entirely — their feed rows never brand-matched.
  [/mulberry/i, "Mulberry"],
  [/mcqueen/i, "Alexander McQueen"],           // Alexander McQueen, McQ
  [/jacquemus/i, "Jacquemus"],
  [/off[\s-]*white/i, "Off-White"],
  [/longchamp/i, "Longchamp"],
  [/telfar/i, "Telfar"],
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
    // WOC veto: "2.55 wallet on chain" is a Wallet on Chain (its own LC-Index style),
    // not the Reissue flap — without it the 2.55 token claims every reissue-style WOC.
    // Same on Boy / 19 / Trendy CC: a "boy woc" is a WOC wearing the line's styling and
    // a "coco boy camera" is a Camera Bag — the line token must not swallow the shape
    // (2026-07-09 audit: 21 Boy WOCs, 7 19 WOCs, 5 Trendy WOCs, 4 Boy cameras
    // fronted/priced as the wrong model; a red camera case was the Boy page hero).
    ["Reissue", "reissue", "2.55", "!wallet on chain", "!woc"],
    ["Boy", "boy", "!wallet on chain", "!woc", "!camera"],
    ["Chanel 19", "19 flap", "chanel 19", "!wallet on chain", "!woc"],
    ["Chanel 22", "chanel 22", "22 bag", "c22"], ["Chanel 25", "chanel 25", "25 bag"],
    ["Gabrielle", "gabrielle"], ["Coco Handle", "coco handle"], ["Deauville", "deauville"],
    ["Vanity Case", "vanity"], ["Business Affinity", "business affinity"],
    ["Trendy CC", "trendy cc", "!wallet on chain", "!woc"],
    ["Urban Spirit", "urban spirit"],
    ["Classic Flap", "classic flap", "double flap", "single flap", "rectangular flap", "square flap", "mini flap"],
    ["Wallet on Chain", "wallet on chain", "woc"],
    ["Camera Bag", "camera"], ["Diana", "diana"], ["Cerf Tote", "cerf"],
    ["Grand Shopping Tote", "grand shopping", "gst"], ["Petite Shopping Tote", "petite shopping", "pst"],
    ["Kelly Shopper", "kelly shopper"], ["Medallion Tote", "medallion"], ["Chanel 31", "chanel 31", "31 bag"],
    ["Duma Backpack", "duma"], ["Souplissimo", "souplissimo"],
    // Residue-audit additions (2026-07-09). Mini rectangular/square flaps roll up to
    // Classic Flap (size label carries Mini); Kelly Flap = the vintage Chanel Kelly.
    ["Kelly Flap", "kelly flap"], ["Urban Essentials", "urban essentials"],
    ["Pearl Crush", "pearl crush"], ["Uniform", "uniform"],
    // "Timeless" is TLC/reseller shorthand for Chanel's whole classic CC-turnlock LINE
    // (clutches, totes, shoppers, pochettes, phone cases), not just the flap bag — bare
    // "timeless" put a $966 handcuff clutch on the Classic Flap hero (2026-07-09). LAST
    // so every named model above wins first; requires a flap signal ("timeless" alone is
    // ambiguous: TLC's "Timeless CC shoulder bag" is usually a shopper), and shape-vetoed
    // so flap-adjacent non-flaps ("flap clutch") still stay out.
    ["Classic Flap", "timeless&flap",
      "!clutch", "!tote", "!pochette", "!phone", "!handcuff", "!bucket", "!hobo",
      "!backpack", "!bowler", "!boston", "!duffel", "!duffle", "!briefcase", "!top handle"],
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
    // Backlog-verified recurring models (Fashionphile/TRR titles, ≥10 occurrences).
    ["Pallas", "pallas"], ["Lockme", "lockme"], ["Montsouris", "montsouris"], ["Musette", "musette"],
    ["Odéon", "odeon", "odéon"], ["Papillon", "papillon"], ["Boîte Chapeau", "boite chapeau", "boîte chapeau"],
    ["Totally", "totally"], ["Ellipse", "ellipse"], ["Looping", "looping"], ["Pont-Neuf", "pont-neuf", "pont neuf"],
    ["Berri", "berri"], ["Louise", "louise"], ["Luco", "luco"], ["Triana", "triana"],
    ["Grand Palais", "grand palais"], ["Kensington", "kensington"], ["Vivacité", "vivacite", "vivacité"],
    ["All-In", "all-in"], ["Belem", "belem"], ["Vavin", "vavin"], ["Passy", "passy"], ["Trevi", "trevi"],
    ["Tivoli", "tivoli"], ["Galliera", "galliera"], ["Turenne", "turenne"], ["Cluny", "cluny"],
    ["Croisette", "croisette"], ["Palm Springs", "palm springs"], ["Manhattan", "manhattan"],
    ["Tuileries", "tuileries"], ["Estrela", "estrela"], ["Palermo", "palermo"], ["Batignolles", "batignolles"],
    // Residue-audit additions (2026-07-09): each recurred ≥5× in unmatched FP/TRR backlog titles.
    ["Artsy", "artsy"], ["Eva Clutch", "eva"], ["Geronimos", "geronimos"], ["Trouville", "trouville"],
    ["Amazone", "amazone"], ["Vanity", "vanity"], ["Cité", "cite", "cité"], ["Chelsea", "chelsea"],
    ["Cabas Mezzo", "cabas mezzo"], ["Cabas Piano", "cabas piano"], ["Neo Cabas", "neo cabas"],
    ["Saumur", "saumur"], ["Thames", "thames"], ["Cannes", "cannes"], ["Marais", "marais"],
    ["Bucket", "bucket"], ["Slouchy", "slouchy"], ["Pochette Florentine", "florentine"],
    ["Easy Pouch On Strap", "easy pouch"], ["Double Zip Pochette", "double zip"],
    ["Over The Moon", "over the moon"], ["Évasion", "evasion"], ["Nil", "nil"],
    ["Greenwich", "greenwich"], ["Alizé", "alize"], ["Lodge", "lodge"], ["Reporter", "reporter"],
    ["Low Key Hobo", "low key"], ["Stockton", "stockton"], ["Catchy", "catchy"], ["Croissant", "croissant"],
    ["Soft Trunk", "soft trunk"], ["Fold Me Pouch", "fold me"], ["Pochette Marly", "marly"],
    ["Sully", "sully"], ["Evora", "evora"], ["Girolata", "girolata"], ["Hampstead", "hampstead"],
    ["Nolita", "nolita"], ["Verona", "verona"], ["Madeleine", "madeleine"], ["Buci", "buci"],
    ["Sac Plat", "sac plat"], ["Lockit", "lockit", "lock it"], ["Locky BB", "locky"], ["Rivoli", "rivoli"],
    ["Saintonge", "saintonge"], ["Spontini", "spontini"], ["New Wave", "new wave"],
    ["Multipli-Cité", "multipli-cite", "multipli cite"], ["Broadway", "broadway"], ["Belmont", "belmont"],
    ["Brera", "brera"], ["Duomo", "duomo"], ["Ravello", "ravello"], ["South Bank", "south bank"],
    ["Porte-Documents Voyage", "porte-documents voyage", "porte documents voyage"],
    ["Georges", "georges"], ["Maida Hobo", "maida"], ["Carmel Hobo", "carmel"], ["Bel Air", "bel air"],
    ["Excursion", "excursion"], ["Ursula", "ursula"], ["Pochette Gange", "gange"], ["Sirius", "sirius"],
    ["Camera Box", "camera box"], ["Judy", "judy"], ["Saint Cloud", "saint cloud"],
    ["Side Trunk", "side trunk"], ["Tambourin", "tambourin"], ["Reade", "reade"], ["Victoire", "victoire"],
    ["LV Biker", "biker"], ["On My Side", "on my side"], ["Duo Messenger", "duo messenger"],
    ["Trio Messenger", "trio messenger"], ["Bosphore", "bosphore"], ["Clapton", "clapton"],
    ["Parioli", "parioli"], ["Pochette Melville", "melville"], ["Santa Monica", "santa monica"],
    ["Sistina", "sistina"], ["Uzès", "uzes"], ["District", "district"], ["Avenue Sling", "avenue sling"],
    ["Tadao", "tadao"], ["Blanche", "blanche"], ["Mini Moon", "mini moon"], ["Sac Sport", "sac sport"],
    ["Marelle", "marelle"], ["Muria", "muria"], ["Babylone", "babylone"], ["Beverly", "beverly"],
    ["Hudson", "hudson"], ["Iéna", "iena"], ["Griet", "griet"], ["Marceau", "marceau"],
    ["Monceau", "monceau"], ["Annie", "annie"], ["Aurelia", "aurelia"], ["Greta", "greta"],
    ["Sharleen", "sharleen"], ["Pochette Dame", "pochette dame"], ["Pochette Twin", "pochette twin"],
    ["Popincourt", "popincourt"], ["Randonnée", "randonnee"], ["Sac Souple", "sac souple"],
    ["Surène", "surene"], ["Vaugirard", "vaugirard"], ["City Steamer", "city steamer"],
    ["S Lock", "s lock"], ["Brea", "brea"], ["Stresa", "stresa"], ["Aubagne", "aubagne"],
    ["Caissa", "caissa"], ["Brittany", "brittany"], ["Wight", "wight"], ["Riverside", "riverside"],
    ["Pochette Ipanema", "ipanema"], ["Portobello", "portobello"], ["Saleya", "saleya"],
    ["Sarria", "sarria"], ["Illovo", "illovo"], ["Sorbonne", "sorbonne"], ["Soufflot", "soufflot"],
    ["Atlantis", "atlantis"], ["Odyssée", "odyssee"], ["Lexington", "lexington"], ["Tilsitt", "tilsitt"],
    ["Baikal", "baikal"], ["Sunset Boulevard", "sunset boulevard"], ["V Tote", "v tote"],
    ["Westminster", "westminster"], ["Hina", "hina"], ["Abbesses", "abbesses"], ["Blois", "blois"],
    ["Cartouchière", "cartouchiere"], ["Sonatine", "sonatine"], ["Trunk Clutch", "trunk clutch"],
    ["Pop My Heart", "pop my heart"], ["Multipass", "multipass"], ["Danube", "danube"],
    ["Cruiser", "cruiser"], ["Sablons", "sablons"], ["Petit Palais", "petit palais"],
    ["Ribera", "ribera"], ["Naviglio", "naviglio"], ["Berkeley", "berkeley"], ["Siena", "siena"],
    ["Daniel", "daniel"], ["Flore", "flore"], ["Mirage", "mirage"],
  ],
  Gucci: [
    ["Dionysus", "dionysus"], ["GG Marmont", "gg marmont", "marmont"], ["Jackie 1961", "jackie"],
    ["Horsebit 1955", "horsebit"], ["Ophidia", "ophidia"], ["Bamboo 1947", "bamboo"],
    ["Soho Disco", "soho"], ["Diana", "diana"], ["Attache", "attache"], ["Blondie", "blondie"],
    ["Boston", "boston"], ["Princy", "princy"], ["Jolie", "jolie"], ["Queen Margaret", "queen margaret"],
    ["Zumi", "zumi"], ["Sylvie", "sylvie"], ["Padlock", "padlock"], ["Bree", "bree"], ["Aphrodite", "aphrodite"],
    ["Abbey", "abbey"], ["Sukey", "sukey"], ["Pelham", "pelham"], ["Hysteria", "hysteria"], ["Britt", "britt"],
    ["Emily", "emily"], ["Rajah", "rajah"],
    // Residue-audit additions (2026-07-09)
    ["Neo Vintage", "neo vintage"], ["Belt Bag", "belt bag"], ["Luce", "luce"], ["Emblem", "emblem"],
    ["Retro Interlocking G", "retro interlocking"], ["Day Backpack", "day backpack"], ["Eden", "eden"],
    ["Savoy", "savoy"], ["Dome", "dome"], ["Petite GG", "petite gg"],
  ],
  Hermès: [
    // To Go variants BEFORE the parent models (first match wins).
    ["Kelly To Go", "kelly wallet to go", "kelly to go"], ["Constance To Go", "constance long to go", "constance to go"],
    ["Birkin", "birkin"], ["Kelly", "kelly"], ["Constance", "constance"], ["Evelyne", "evelyne"],
    ["Picotin Lock", "picotin"], ["Lindy", "lindy"], ["Bolide", "bolide"], ["Garden Party", "garden party", "neo garden"],
    ["Herbag", "herbag"], ["Roulis", "roulis"], ["Jypsière", "jypsi"], ["Halzan", "halzan"],
    ["Steeple", "steeple"], ["Kaba", "kaba"], ["Jige", "jige"], ["Bride-a-Brac", "bride-a-brac", "bride a brac"],
    ["24/24", "24/24", "24 24"], ["Della Cavalleria", "della cavalleria"], ["In-The-Loop", "in-the-loop", "in the loop"],
    ["Geta", "geta"], ["Toolbox", "toolbox"], ["Trim", "trim"], ["Verrou", "verrou"],
    ["Plume", "plume"], ["Victoria", "victoria"], ["Double Sens", "double sens", "double sense"], ["Massai", "massai"],
    ["Berline", "berline"], ["Fourre-Tout", "fourre-tout", "fourre tout"], ["Haut à Courroies", "haut à courroies", "haut a courroies"],
    // Residue-audit additions (2026-07-09)
    ["Herline", "herline"], ["Hac à Dos", "hac a dos"], ["Sac à Dépêches", "sac a depeches"],
  ],
  Celine: [
    ["Luggage", "luggage"], ["Trotteur", "trotteur"], ["16 (Sixteen)", "16 bag", "sixteen", "soft 16"],
    ["Triomphe", "triomphe"], ["Cabas", "cabas"], ["Belt Bag", "belt bag"], ["Ava", "ava"],
    ["Classic Box", "classic box", "box bag", "classic"], ["Sangle", "sangle"], ["Conti", "conti"],
    ["Trio", "trio"], ["Tabou", "tabou"], ["Besace", "besace"],
    ["Trapeze", "trapeze"], ["Nino", "nino"], ["Phantom", "phantom"], ["Boogie", "boogie"],
    ["Frame Bag", "frame bag", "frame"], ["Big Bag", "big bag"], ["Nano Bucket", "nano bucket"],
    // Residue-audit additions (2026-07-09): FP lists the Classic Box as "Leather Classic <size>".
    ["Macadam", "macadam"],
  ],
  "Saint Laurent": [
    ["Loulou", "loulou"], ["Niki", "niki"], ["College", "college"], ["Icare", "icare"],
    ["Sac de Jour", "sac de jour"], ["Lou Camera", "lou camera", "lou bag"], ["Cassandre Envelope", "envelope"],
    ["Le 5 à 7", "5 à 7", "5 a 7"], ["Manhattan", "manhattan"], ["Solferino", "solferino"],
    ["Kate", "kate"], ["Sunset", "sunset"], ["Jamie", "jamie"],
    ["Cassandra", "cassandra"], ["Emmanuelle", "emmanuelle"], ["Gaby", "gaby"], ["Muse", "muse"],
    ["Downtown", "downtown"], ["Roady", "roady"], ["Betty", "betty"], ["Puffer", "puffer"],
    // Residue-audit additions (2026-07-09)
    ["Triquilt", "triquilt"], ["Shopping Tote", "shopping tote"], ["Le 37", "le 37"],
    ["Rive Gauche", "rive gauche"], ["Uptown", "uptown"], ["Bea", "bea tote"], ["Joe Backpack", "joe backpack"],
    ["Nolita", "nolita"], ["Becky", "becky"], ["Le Monogramme", "le monogramme"],
    ["Belle de Jour", "belle de jour"],
  ],
  Dior: [
    ["Lady D-Lite", "d-lite", "lady d-lite"], ["Lady D-Joy", "d-joy", "d joy"], ["Lady Dior", "lady dior"],
    ["Saddle", "saddle"], ["Book Tote", "book tote", "book"], ["30 Montaigne", "30 montaigne", "montaigne"],
    ["Caro", "caro"], ["Bobby", "bobby"], ["Dior Toujours", "toujours"], ["Diorama", "diorama"], ["Dior Key", "dior key"],
    ["Diorissimo", "diorissimo"],
    ["Malice", "malice"], ["Diorever", "diorever"], ["Be Dior", "be dior"], ["Miss Dior", "miss dior"],
    ["Panarea", "panarea"], ["Granville", "granville"], ["Boston", "boston"], ["Dior Vibe", "dior vibe", "d-vibe"], ["Dior Addict", "dior addict"],
  ],
  "Bottega Veneta": [
    ["Andiamo", "andiamo"], ["Arco", "arco"], ["Jodie", "jodie"], ["Cassette", "cassette"],
    ["The Pouch", "pouch"], ["Lauren 1980", "lauren"], ["Loop", "loop"], ["Sardine", "sardine"],
    ["Knot", "knot"], ["Hop", "hop"],
    // Residue-audit additions (2026-07-09)
    ["Wallace", "wallace"], ["Cabat", "cabat"],
  ],
  Prada: [
    ["Re-Edition 2005", "re-edition 2005", "2005"], ["Galleria", "galleria"], ["Cleo", "cleo"],
    ["Symbole", "symbole"], ["Re-Edition", "re-edition", "re edition"], ["Moon", "moon"],
    ["Arqué", "arque", "arqué"], ["Re-Nylon Backpack", "re-nylon backpack"],
    ["Cahier", "cahier"], ["Diagramme", "diagramme"], ["Sidonie", "sidonie"], ["Matinée", "matinee", "matinée"],
    ["Odette", "odette"], ["Promenade", "promenade"], ["Double Bag", "double bag"], ["Panier", "panier"],
    // Residue-audit additions (2026-07-09)
    ["Canapa", "canapa"], ["Triangle", "triangle"],
  ],
  Fendi: [
    ["Baguette", "baguette"], ["Peekaboo", "peekaboo"], ["Mon Trésor", "mon tresor", "mon trésor"],
    ["Sunshine Shopper", "sunshine"], ["C'mon", "c'mon", "cmon"], ["First", "first"],
    ["By the Way", "by the way"], ["Fendigraphy", "fendigraphy"],
    ["Kan I", "kan i"], ["Kan U", "kan u"], ["Dotcom", "dotcom"], ["2Jours", "2jours"],
    ["Runaway", "runaway"], ["Selleria", "selleria"], ["Origami", "origami"],
    // Residue-audit additions (2026-07-09)
    ["Spy", "spy"],
  ],
  Loewe: [
    ["Puzzle Edge", "puzzle edge"], ["Puzzle", "puzzle"], ["Hammock", "hammock"], ["Flamenco", "flamenco"],
    ["Gate", "gate"], ["Goya", "goya"], ["Amazona", "amazona"], ["Squeeze", "squeeze"],
    ["Basket", "basket"], ["Paseo", "paseo"],
    ["Barcelona", "barcelona"], ["Cushion", "cushion"], ["Pebble", "pebble"], ["Miss Loewe", "miss loewe"],
  ],
  Burberry: [
    ["TB Bag", "tb bag"], ["Lola", "lola"], ["Olympia", "olympia"], ["Catherine", "catherine"],
    ["Knight", "knight"], ["Frances", "frances"], ["Note", "note bag"], ["Pocket Bag", "pocket bag"],
    ["Title", "title bag"], ["Banner", "banner"],
    ["DK88", "dk88"], ["Bridle", "bridle"], ["Elizabeth", "elizabeth"],
    // Residue-audit additions (2026-07-09)
    ["Lorne", "lorne"], ["Sonny", "sonny"],
  ],
  Balenciaga: [
    ["Hourglass", "hourglass"], ["Le Cagole", "cagole"], ["Neo Classic", "neo classic"],
    ["Ville", "ville"], ["Papier", "papier"], ["Rodeo", "rodeo"], ["City", "city bag", "classic city", "le city", "city"],
    ["Hardware", "hardware bag"], ["Downtown", "downtown"],
    ["Bel Air", "bel air"], ["Everyday", "everyday"], ["Monaco", "monaco"], ["Crush", "crush bag"],
    // Residue-audit additions (2026-07-09)
    ["First", "first"], ["Town", "town"],
  ],
  Valentino: [
    ["Rockstud", "rockstud"], ["Roman Stud", "roman stud", "roman studded"], ["VLogo", "vlogo"],
    ["Loco", "loco"], ["One Stud", "one stud"], ["VSling", "vsling"], ["Escape", "escape"],
  ],
  "Dolce & Gabbana": [
    ["Miss Sicily", "miss sicily"], ["Sicily", "sicily"], ["Devotion", "devotion"], ["DG Girls", "dg girls"],
  ],
  "Michael Kors": [
    ["Cassie", "cassie"], ["Jet Set", "jet set"], ["Hamilton", "hamilton"], ["Selma", "selma"],
    ["Mercer", "mercer"], ["Bedford", "bedford"], ["Bradshaw", "bradshaw"], ["Voyager", "voyager"],
    ["Whitney", "whitney"], ["Greenwich", "greenwich"], ["Sloan", "sloan"], ["Soho", "soho"],
  ],
  Coach: [
    ["Tabby", "tabby"], ["Willow", "willow"], ["Rogue", "rogue"], ["Dinky", "dinky"],
    ["Swagger", "swagger"], ["Brooklyn", "brooklyn"], ["Cassie", "cassie"], ["Hutton", "hutton"],
    ["Pillow", "pillow"], ["Nolita", "nolita"], ["Kacey", "kacey"], ["Bandit", "bandit"],
    ["Georgie", "georgie"], ["Lana", "lana"], ["Field Tote", "field tote"],
  ],
  "Tory Burch": [
    ["Reva", "reva"], ["Robinson", "robinson"], ["Fleming", "fleming"], ["Kira", "kira"],
    ["McGraw", "mcgraw"], ["Ella", "ella"], ["Perry", "perry"], ["Lee Radziwill", "lee radziwill"],
    ["Miller", "miller"], ["Britten", "britten"],
  ],
  "Chloé": [
    ["Marcie", "marcie"], ["Paddington", "paddington"], ["Faye", "faye"], ["Tess", "tess"],
    ["Paraty", "paraty"], ["Woody", "woody"], ["Drew", "drew"], ["Nile", "nile"], ["Aby", "aby"],
    ["Edith", "edith"], ["Hudson", "hudson"], ["Darryl", "darryl"], ["Alphabet", "alphabet"],
    ["Juana", "juana"], ["Penelope", "penelope"], ["Marcie Hobo", "marcie hobo"],
  ],
  Goyard: [
    ["Saint Louis", "saint louis", "st louis", "st. louis"], ["Artois", "artois"], ["Anjou", "anjou"],
    ["Belvedère", "belvedere", "belvedère"], ["Bohème", "boheme", "bohème"], ["Saïgon", "saigon", "saïgon"],
    ["Sac Hardy", "hardy"], ["Rouette", "rouette"], ["Vendôme", "vendome", "vendôme"], ["Alpin", "alpin"],
    ["Sénat", "senat", "sénat"], ["Bellechasse", "bellechasse"], ["Villette", "villette"],
    ["Grenelle", "grenelle"], ["Plumet", "plumet"], ["Cap-Vert", "cap-vert", "cap vert"],
  ],
  Givenchy: [
    ["Antigona", "antigona"], ["Pandora", "pandora"], ["Nightingale", "nightingale"], ["GV3", "gv3"],
    ["Whip", "whip"], ["Mystic", "mystic"], ["Kenny", "kenny"], ["Voyou", "voyou"], ["4G", "4g bag", "4g"],
    ["Pocket", "pocket bag"], ["ID", "id bag"], ["Cut Out", "cut out"], ["Moon Cut Out", "moon cut"],
  ],
  "Miu Miu": [
    ["Wander", "wander"], ["Arcadie", "arcadie"], ["Aventure", "aventure"], ["Ivy", "ivy"],
    ["Coffer", "coffer"], ["Miu Miu Pocket", "miu miu pocket"], ["Bow", "bow bag"], ["Dahlia", "dahlia"],
  ],
  Versace: [
    ["La Medusa", "la medusa", "medusa"], ["Virtus", "virtus"], ["Greca Goddess", "greca goddess", "greca"],
  ],
  "Marc Jacobs": [
    ["The Tote Bag", "the tote"], ["Snapshot", "snapshot"], ["The Traveler", "traveler"],
    ["The Sack", "the sack"], ["The Teddy", "teddy"],
  ],
  "Stella McCartney": [
    ["Falabella", "falabella"], ["Ryder", "ryder"],
  ],
  "Jimmy Choo": [
    ["Bon Bon", "bon bon"], ["Varenne", "varenne"], ["Callie", "callie"], ["Candy", "candy"],
  ],
  Moynat: [
    ["Réjane", "rejane", "réjane"], ["Gabrielle", "gabrielle"],
  ],
  "Alaïa": [
    ["Le Teckel", "teckel"], ["Le Click", "le click"], ["Le Coeur", "le coeur"], ["Louise", "louise"],
  ],
  Delvaux: [
    ["Brillant", "brillant"], ["Tempête", "tempete", "tempête"], ["Pin", "pin"],
    ["Lingot", "lingot"], ["Cool Box", "cool box"],
  ],
  "Alexander Wang": [
    ["Rocco", "rocco"], ["Rockie", "rockie"], ["Attica", "attica"], ["Roxy", "roxy"], ["Marti", "marti"],
  ],
  "Judith Leiber": [
    ["Minaudière", "minaudiere", "minaudi"],
  ],
  Bulgari: [
    ["Serpenti Forever", "serpenti"],
  ],
  MCM: [
    ["Liz Tote", "liz"], ["Stark Backpack", "stark"],
  ],
  Khaite: [
    ["Olivia Hobo", "olivia"], ["Lotus Tote", "lotus"],
  ],
  "Salvatore Ferragamo": [
    ["Ginny", "ginny"], ["Hug", "hug"], ["Studio", "studio"],
  ],
  "Christian Louboutin": [
    ["Cabata", "cabata"],
  ],
  "Loro Piana": [
    ["Extra Pocket", "extra pocket"],
  ],
  "The Row": [
    ["Margaux", "margaux"], ["Bindle", "bindle"], ["Half Moon", "half moon"], ["Park Tote", "park tote", "park"],
    ["90s", "90s"], ["Banana", "banana"], ["Terrasse", "terrasse"], ["Ascot", "ascot"], ["Peggy", "peggy"],
    ["Sienna", "sienna"], ["Soft Margaux", "soft margaux"],
    // Residue-audit additions (2026-07-09)
    ["India", "india"],
  ],
};

/**
 * Map a (brand, raw title) → canonical model, or null when it's an accessory/SLG or no
 * known model matches. `brand` may be a raw/sub-brand string — it's canonicalized here.
 */
export function canonicalModel(brand: string, rawName: string | null | undefined): string | null {
  const hay = (rawName ?? "").toLowerCase().replace(/&amp;/g, "&");
  if (!hay) return null;
  const isBagOverride = BAG_OVERRIDES.some((t) => hay.includes(t));
  if (!isBagOverride && SLG_TOKENS.some((t) => hasSlg(hay, t.trim()))) return null;
  const defs = MODELS[canonicalBrand(brand)];
  if (!defs) return null;
  for (const [canonical, ...tokens] of defs) {
    // "!token" = veto: the def only matches when NO veto token is present. "a&b" =
    // co-occurrence: every part must be present (any position). Together they let a
    // loose line-name token ("timeless") claim a model without swallowing other
    // silhouettes that share the line name.
    const positive = tokens.filter((t) => !t.startsWith("!"));
    const vetoes = tokens.filter((t) => t.startsWith("!")).map((t) => t.slice(1));
    const hit = positive.some((t) =>
      t.includes("&") ? t.split("&").every((p) => has(hay, p)) : has(hay, t),
    );
    if (hit && !vetoes.some((t) => has(hay, t))) return canonical;
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
