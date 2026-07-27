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
  "belt", "watch", "wristwatch", "hat", "gloves", "sock", "tights", "swimsuit", "bikini",
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

/** BAG_OVERRIDES membership, separator-insensitive. Scraped titles keep punctuation
 *  ("multi-pochette") while slug titles flatten every separator to a space
 *  ("multi pochette"), so a literal substring check under-matches exactly the override
 *  names that carry punctuation — LV "Multi-Pochette" (a ranked bag) escaped the
 *  "multi pochette" override, so isNonBagAccessory wrongly SLG-gated it and the read
 *  guards dropped legit Multi Pochette listings (owner report 2026-07-11). Normalize both
 *  sides to a single space before the includes() check so the override fires either way. */
const sepFold = (s: string) => s.replace(/[\s./-]+/g, " ").trim();
const BAG_OVERRIDES_SEP = BAG_OVERRIDES.map(sepFold);
function hasBagOverride(hay: string): boolean {
  const h = sepFold(hay);
  return BAG_OVERRIDES_SEP.some((t) => h.includes(t));
}

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Accent-fold ("Jypsière" -> "jypsiere"). Titles arrive both ways (slugs are ASCII,
 *  scraped names keep the accents) and a non-unicode \b breaks on a trailing accented
 *  char ("noé\b" can never match) — folding BOTH hay and token sides makes every
 *  dictionary entry accent-blind instead of per-entry accent dupes. */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

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
    const parts = fold(token).split(/[\s./-]+/).filter(Boolean);
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

/**
 * True when a raw listing title names a carried pouch the catalog RANKS despite an
 * SLG-ish token — WOC / chain wallet / vanity / belt bag / bum bag, per BAG_OVERRIDES.
 * Used by the ingest category filters as the "keep" escape: a listing TRR files under a
 * non-handbag department (e.g. accessories/wallets) is still banked when its title is
 * one of these. Accent-blind, same fold as canonicalModel. */
export function titleHasBagOverride(title: string | null | undefined): boolean {
  const hay = fold((title ?? "").toLowerCase()).replace(/&amp;/g, "&");
  return hasBagOverride(hay);
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
  // Backlog demand 2026-07-10 (banked no_brand listings, full-spectrum scope).
  [/tumi/i, "Tumi"],
  [/proenza\s*schouler/i, "Proenza Schouler"],
  [/mansur\s*gavriel/i, "Mansur Gavriel"],
  [/furla/i, "Furla"],
  // Backlog demand 2026-07-26: 7,487 DKNY + 3,904 Kate Spade unpromoted rows had no
  // dictionary entry at all. "Donna Karan" and "DONNA KARAN DKNY" both appear in titles.
  [/\bdkny\b|donna\s*karan/i, "DKNY"],
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
    ["Gabrielle", "gabrielle"], ["Coco Handle", "coco handle", "coco top handle"], ["Deauville", "deauville"],
    ["Vanity Case", "vanity"], ["Business Affinity", "business affinity"],
    ["Trendy CC", "trendy cc", "!wallet on chain", "!woc"],
    ["Urban Spirit", "urban spirit"],
    // Top Handle Rectangular Flap = the modern mini/small rectangular flap WITH a top
    // handle — its own catalog style (#906) with FP comps titled literally "Mini Top
    // Handle Rectangular Flap" (0714 comps-remap found them mis-resolving to Classic
    // Flap). Must sit BEFORE Classic Flap so "rectangular flap" doesn't swallow it.
    // Kelly/Coco vetoed: the vintage Kelly and the Coco Handle are also top-handle
    // flaps with their own defs (Coco Handle's def only fires on the exact phrase, so
    // a "coco top handle flap" title needs the veto here). Handle-LESS square /
    // rectangular minis still roll up to Classic Flap (0709 decision, unchanged).
    ["Top Handle Rectangular Flap", "top handle&flap", "handle flap", "!kelly", "!coco"],
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
    // Dictionary-gap report additions (2026-07-15): recurring unmatched models, each
    // backed by real FP/TLC/TRR listing titles (docs/dictionary-gap-report.md). Filigree
    // sits AFTER Vanity Case (line above) on purpose — a "Filigree Vanity Case" stays a
    // Vanity Case; this def catches the Filigree backpack/waist/crossbody/round variants.
    ["Mademoiselle", "mademoiselle"], ["Cambon", "cambon"], ["Filigree", "filigree"],
    ["Accordion", "accordion"], ["Chocolate Bar", "chocolate bar"],
    // Coco Preppy BEFORE Bowling so a "Preppy Coco … Bowling Bag" keeps the line, and
    // Bowling catches the remaining (Coco Beach) bowling-shaped bags.
    ["Coco Preppy", "coco preppy", "preppy coco"], ["Bowling", "bowling"],
    ["Wild Stitch", "wild stitch"], ["CC In Love", "cc in love"],
    ["Coco Cocoon", "coco cocoon"], ["Wavy CC", "wavy cc"],
    ["Paris-Biarritz", "paris biarritz"], ["Funky Town", "funky town"],
    ["Chic Pearls", "chic pearls"], ["Coco Base", "coco base"],
    ["Twist Your Buttons", "twist your buttons"], ["Archetype", "archetype"],
    // "Timeless" is TLC/reseller shorthand for Chanel's whole classic CC-turnlock LINE
    // (clutches, totes, shoppers, pochettes, phone cases), not just the flap bag — bare
    // "timeless" put a $966 handcuff clutch on the Classic Flap hero (2026-07-09). LAST
    // so every named model above wins first; requires a flap signal ("timeless" alone is
    // ambiguous: TLC's "Timeless CC shoulder bag" is usually a shopper), and shape-vetoed
    // so flap-adjacent non-flaps ("flap clutch") still stay out.
    ["Classic Flap", "timeless&flap",
      "!clutch", "!tote", "!pochette", "!phone", "!handcuff", "!bucket", "!hobo",
      "!backpack", "!bowler", "!boston", "!duffel", "!duffle", "!briefcase", "!top handle"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    // RESELLER-CANONICAL, not house-official: Chanel does not name its vintage and
    // seasonal pieces, so these are the names the market settled on for real produced
    // bags. Last in the block so every house-official model above claims its rows first
    // — in particular Kelly Flap / Kelly Shopper, which bare "kelly" would swallow.
    ["Chanel Kelly", "kelly"], ["CC Dome", "cc dome"],
  ],
  "Louis Vuitton": [
    ["Neverfull", "neverfull"], ["Speedy", "speedy"], ["Alma", "alma"], ["Capucines", "capucines"],
    ["OnTheGo", "onthego", "on the go"], ["Pochette Métis", "pochette metis", "métis", "metis"],
    ["Twist", "twist"], ["Coussin", "coussin"], ["Dauphine", "dauphine"], ["Keepall", "keepall"],
    ["Bumbag", "bumbag", "bum bag"], ["NéoNoé", "neonoe", "néonoé", "neo noe"], ["Noé", "noe"],
    // New Wave veto (2026-07-09 round-3 audit): the "New Wave Multi-Pochette" (12 TLC
    // rows) is a quilted-calfskin New Wave line bag, not the monogram Multi Pochette
    // Accessoires — without the veto the earlier token swallows it.
    ["Petite Malle", "petite malle"], ["Boulogne", "boulogne"],
    ["Multi Pochette", "multi pochette", "multi-pochette", "!new wave"],
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
    // Dictionary-gap report additions (2026-07-15): docs/dictionary-gap-report.md.
    ["Melrose Avenue", "melrose"], ["Bellevue", "bellevue"], ["Pleaty", "pleaty"],
    ["Wilshire", "wilshire"], ["Houston", "houston"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Flower Hobo", "flower hobo"], ["Flower Tote", "flower tote", "flower zipped"],
    ["Utility Crossbody", "utility crossbody", "utility harness"],
    // AFTER City Steamer above, which would otherwise be swallowed by bare "steamer".
    ["Steamer", "steamer"],
  ],
  Gucci: [
    // Belt-bag veto (2026-07-09 round-3 audit): "gg marmont … belt bag" / "ophidia …
    // belt bag" are BELT BAGS wearing the line (20 TLC rows priced $518-1,066 with the
    // Belt Bag cohort, vs $1.5k+ Marmont shoulder bags). Shape beats line whenever the
    // shape is its own ranked style (Chanel Boy-WOC precedent); chain wallets still
    // roll into the parent line because no standalone style exists for them.
    ["Dionysus", "dionysus"], ["GG Marmont", "gg marmont", "marmont", "!belt bag"], ["Jackie 1961", "jackie"],
    // Blondie veto (2026-07-10 TRR sweep): TRR titles its Blondies "interlocking g
    // horsebit blondie" / "bamboo blondie" — the model word wins over the hardware
    // token (Diana precedent). Horsebit Chain is its own model, checked first.
    ["Maxi Horsebit Chain", "horsebit chain"],
    ["Horsebit 1955", "horsebit", "!blondie"], ["Ophidia", "ophidia", "!belt bag"],
    // Diana veto (2026-07-09 round-3 audit): the Diana's signature IS its bamboo handle,
    // so "bamboo diana" titles (36 TLC rows, every one a Diana tote) must not be swallowed
    // by the Bamboo 1947 token that happens to be checked first.
    ["Bamboo 1947", "bamboo", "!diana", "!blondie"],
    ["Soho Disco", "soho"], ["Diana", "diana"], ["Attache", "attache"], ["Blondie", "blondie"],
    ["Boston", "boston"], ["Princy", "princy"], ["Jolie", "jolie"], ["Queen Margaret", "queen margaret"],
    ["Zumi", "zumi"], ["Sylvie", "sylvie"], ["Padlock", "padlock"], ["Bree", "bree"], ["Aphrodite", "aphrodite"],
    ["Abbey", "abbey"], ["Sukey", "sukey"], ["Pelham", "pelham"], ["Hysteria", "hysteria"], ["Britt", "britt"],
    ["Emily", "emily"], ["Rajah", "rajah"],
    // Residue-audit additions (2026-07-09)
    ["Neo Vintage", "neo vintage"], ["Belt Bag", "belt bag"], ["Luce", "luce"], ["Emblem", "emblem"],
    ["Retro Interlocking G", "retro interlocking"], ["Day Backpack", "day backpack"], ["Eden", "eden"],
    ["Savoy", "savoy"], ["Dome", "dome"], ["Petite GG", "petite gg"],
    // Dictionary-gap report additions (2026-07-15): docs/dictionary-gap-report.md.
    ["Joy", "joy"], ["Deco", "deco"], ["Eclipse", "eclipse"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Softbit", "softbit"],
  ],
  Hermès: [
    // To Go variants BEFORE the parent models (first match wins).
    ["Kelly To Go", "kelly wallet to go", "kelly to go"], ["Constance To Go", "constance long to go", "constance to go"],
    ["Birkin", "birkin"], ["Kelly", "kelly"], ["Constance", "constance"], ["Evelyne", "evelyne"],
    ["Picotin Lock", "picotin"], ["Lindy", "lindy"], ["Bolide", "bolide"], ["Garden Party", "garden party", "neo garden"],
    ["Herbag", "herbag"], ["Roulis", "roulis"], ["Jypsière", "jypsi", "jypsiere"], ["Halzan", "halzan"],
    ["Steeple", "steeple"], ["Kaba", "kaba"], ["Jige", "jige"], ["Bride-a-Brac", "bride-a-brac", "bride a brac"],
    ["24/24", "24/24", "24 24"], ["Della Cavalleria", "della cavalleria"], ["In-The-Loop", "in-the-loop", "in the loop"],
    ["Geta", "geta"], ["Toolbox", "toolbox"], ["Trim", "trim"], ["Verrou", "verrou"],
    ["Plume", "plume"], ["Victoria", "victoria"], ["Double Sens", "double sens", "double sense"], ["Massai", "massai"],
    ["Berline", "berline"], ["Fourre-Tout", "fourre-tout", "fourre tout"], ["Haut à Courroies", "haut à courroies", "haut a courroies"],
    // Residue-audit additions (2026-07-09)
    ["Herline", "herline"], ["Hac à Dos", "hac a dos"], ["Sac à Dépêches", "sac a depeches"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Cabas H en Biais", "cabas h en biais", "h en biais"],
  ],
  Celine: [
    // Phantom veto (2026-07-09 round-3 audit): the Phantom is its own model (catalog
    // style), but every "phantom luggage" title (12 TLC rows) was filed under Luggage
    // because that token is checked first.
    ["Luggage", "luggage", "!phantom"], ["Trotteur", "trotteur"], ["16 (Sixteen)", "16 bag", "sixteen", "soft 16"],
    // Cabas veto (2026-07-09 round-3 audit): "triomphe cabas" / "cuir triomphe … cabas"
    // titles (12 TLC rows) are Cabas totes wearing the Triomphe canvas/finish — identical
    // titles already sit correctly on Cabas. Shape beats line.
    ["Triomphe", "triomphe", "triumph", "!cabas"], ["Cabas", "cabas"], ["Belt Bag", "belt bag"], ["Ava", "ava"],
    ["Classic Box", "classic box", "box bag", "classic"], ["Sangle", "sangle"], ["Conti", "conti"],
    ["Trio", "trio"], ["Tabou", "tabou"], ["Besace", "besace"],
    ["Trapeze", "trapeze"], ["Nino", "nino"], ["Phantom", "phantom"], ["Boogie", "boogie"],
    ["Frame Bag", "frame bag", "frame"], ["Big Bag", "big bag"], ["Nano Bucket", "nano bucket"],
    // Residue-audit additions (2026-07-09): FP lists the Classic Box as "Leather Classic <size>".
    ["Macadam", "macadam"],
    // Dictionary-gap report addition (2026-07-15): the Camille 16 line (docs/dictionary-gap-report.md).
    ["Camille", "camille"],
  ],
  "Saint Laurent": [
    ["Loulou", "loulou"], ["Niki", "niki"], ["College", "college"], ["Icare", "icare"],
    ["Sac de Jour", "sac de jour"], ["Lou Camera", "lou camera", "lou bag"], ["Cassandre Envelope", "envelope"],
    ["Le 5 à 7", "5 à 7", "5 a 7"], ["Manhattan", "manhattan"], ["Solferino", "solferino"],
    ["Kate", "kate", "classic monogram tassel", "monogram tassel"], ["Sunset", "sunset"], ["Jamie", "jamie"],
    ["Cassandra", "cassandra"], ["Emmanuelle", "emmanuelle"], ["Gaby", "gaby"], ["Muse", "muse"],
    ["Downtown", "downtown"], ["Roady", "roady"], ["Betty", "betty"], ["Puffer", "puffer"],
    // Residue-audit additions (2026-07-09)
    ["Triquilt", "triquilt"], ["Shopping Tote", "shopping tote"], ["Le 37", "le 37"],
    // TRR sweep addition (2026-07-10)
    ["Voltaire", "voltaire"],
    // "bea" is word-bounded so it can't fire inside "beaded"/"beach"/"beauty" — the SL
    // Bea (a north-south tote) is listed both "Bea" bare and "Bea Tote".
    ["Rive Gauche", "rive gauche"], ["Uptown", "uptown"], ["Bea", "bea"], ["Joe Backpack", "joe backpack"],
    ["Nolita", "nolita"], ["Becky", "becky"], ["Le Monogramme", "le monogramme"],
    ["Belle de Jour", "belle de jour"],
    // Dictionary-gap report addition (2026-07-15): the Cabas / Y Cabas / Cabas ChYc line
    // (docs/dictionary-gap-report.md). "y cabas"/"chyc" are the distinctive tokens.
    ["Cabas", "y cabas", "cabas chyc", "chyc"],
  ],
  Dior: [
    ["Lady D-Lite", "d-lite", "lady d-lite"], ["Lady D-Joy", "d-joy", "d joy"], ["Lady Dior", "lady dior"],
    ["Saddle", "saddle"], ["Book Tote", "book tote", "book"], ["30 Montaigne", "30 montaigne", "montaigne"],
    ["Caro", "caro"], ["Bobby", "bobby"], ["Dior Toujours", "toujours"], ["Diorama", "diorama"], ["Dior Key", "dior key"],
    ["Diorissimo", "diorissimo"],
    ["Malice", "malice"], ["Diorever", "diorever"], ["Be Dior", "be dior"], ["Miss Dior", "miss dior"],
    ["Panarea", "panarea"], ["Granville", "granville"], ["Boston", "boston"], ["Dior Vibe", "dior vibe", "d-vibe"], ["Dior Addict", "dior addict"],
    // Dictionary-gap report additions (2026-07-15): docs/dictionary-gap-report.md.
    ["Lady 95.22", "lady 95.22", "95.22"], ["Honeycomb", "honeycomb"],
  ],
  "Bottega Veneta": [
    ["Andiamo", "andiamo"], ["Arco", "arco"], ["Jodie", "jodie"], ["Cassette", "cassette"],
    ["The Pouch", "pouch"], ["Lauren 1980", "lauren"], ["Loop", "loop"], ["Sardine", "sardine"],
    ["Knot", "knot"], ["Hop", "hop"],
    // Residue-audit additions (2026-07-09)
    ["Wallace", "wallace"], ["Cabat", "cabat"],
    // Dictionary-gap report additions (2026-07-15): docs/dictionary-gap-report.md.
    // "the point" (not bare "point") so it can't fire inside unrelated titles.
    ["Nodini", "nodini"], ["Roma", "roma"], ["The Point", "the point"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Olimpia", "olimpia"],
  ],
  Prada: [
    ["Re-Edition 2005", "re-edition 2005", "2005"], ["Galleria", "galleria", "double zip lux", "lux double zip"], ["Cleo", "cleo"],
    ["Symbole", "symbole"], ["Re-Edition", "re-edition", "re edition"], ["Moon", "moon"],
    ["Arqué", "arque", "arqué"], ["Re-Nylon Backpack", "re-nylon backpack"],
    ["Cahier", "cahier"], ["Diagramme", "diagramme"], ["Sidonie", "sidonie"], ["Matinée", "matinee", "matinée"],
    ["Odette", "odette"], ["Promenade", "promenade"], ["Double Bag", "double bag", "cuir double"], ["Panier", "panier"],
    // Residue-audit additions (2026-07-09)
    ["Canapa", "canapa"], ["Triangle", "triangle"],
    // Dictionary-gap report addition (2026-07-15): the nylon Vela line (docs/dictionary-gap-report.md).
    ["Vela", "vela"],
  ],
  Fendi: [
    ["Baguette", "baguette"], ["Peekaboo", "peekaboo"], ["Mon Trésor", "mon tresor", "mon trésor"],
    ["Sunshine Shopper", "sunshine"], ["C'mon", "c'mon", "cmon"], ["First", "first"],
    ["By the Way", "by the way"], ["Fendigraphy", "fendigraphy"],
    ["Kan I", "kan i"], ["Kan U", "kan u"], ["Dotcom", "dotcom"], ["2Jours", "2jours"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["3Jours", "3jours", "3 jours"],
    // Selleria is a CONSTRUCTION line (hand-stitched cuoio romano), not a model —
    // verified 2026-07-09: all 31 "selleria peekaboo/baguette" TLC rows are real
    // Peekaboos/Baguettes and correctly keep the shape model above. Keep this def
    // LAST-ish so it only catches shape-less vintage Selleria pieces (Adele, Anna, Linda).
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
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Macken", "macken"],
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
    // TRR sweep addition (2026-07-10)
    ["Velo", "velo"],
  ],
  // TRR sweep additions (2026-07-10): TRR titles name these verbatim ("leather le
  // chiquito mini") but the brand had no dictionary block. Specific before general.
  Jacquemus: [
    ["Le Chiquito Noeud", "chiquito noeud"], ["Le Grand Chiquito", "grand chiquito"],
    ["Le Chiquito", "chiquito"],
    // Grand Bambino is a distinct, larger model (Grand Chiquito precedent) — veto keeps
    // it out of the plain Bambino so the two don't cluster into one promoted style.
    ["Le Grand Bambino", "grand bambino"], ["Le Bambino", "bambino", "!grand bambino"],
    ["Le Bisou", "bisou"], ["Le Petit Filet", "filet"],
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
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Cynthia", "cynthia"],
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
    // Dictionary-gap report addition (2026-07-15): the Elsie line (docs/dictionary-gap-report.md).
    ["Elsie", "elsie"],
  ],
  Goyard: [
    ["Saint Louis", "saint louis", "st louis", "st. louis"], ["Artois", "artois"], ["Anjou", "anjou"],
    ["Belvedère", "belvedere", "belvedère"], ["Bohème", "boheme", "bohème"], ["Saïgon", "saigon", "saïgon"],
    ["Sac Hardy", "hardy"], ["Rouette", "rouette"], ["Vendôme", "vendome", "vendôme"], ["Alpin", "alpin"],
    ["Petit Flot", "petit flot"],
    ["Sénat", "senat", "sénat"], ["Bellechasse", "bellechasse"], ["Villette", "villette"],
    ["Grenelle", "grenelle"], ["Plumet", "plumet"], ["Cap-Vert", "cap-vert", "cap vert"],
  // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["Hirondelle", "hirondelle"], ["Coursier", "coursier"], ["Beluga", "beluga"],
  ],
  Givenchy: [
    ["Antigona", "antigona"], ["Pandora", "pandora"], ["Nightingale", "nightingale"], ["GV3", "gv3"],
      // Dictionary-gap report additions (2026-07-26), archivist-verified: docs/seller-title-grammar.md.
    ["G Tote", "g-tote", "g tote"],
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
    ["90s", "90s", "90's", "90 s"], ["Banana", "banana"], ["Terrasse", "terrasse"], ["Ascot", "ascot"], ["Peggy", "peggy"],
    ["Sienna", "sienna"], ["Soft Margaux", "soft margaux"],
    // Residue-audit additions (2026-07-09)
    ["India", "india"],
    // TRR sweep additions (2026-07-10)
    ["Astra", "astra"], ["Marlo", "marlo"],
  ],
  // TRR sweep additions (2026-07-10): brands whose catalog styles carried verbatim
  // TRR titles but had no dictionary block at all.
  Mulberry: [
    ["Alexa", "alexa"], ["Bayswater", "bayswater"],
  ],
  Telfar: [
    ["Shopping Bag", "shopping bag", "shopping tote"],
  ],
  Longchamp: [
    ["Le Pliage", "le pliage", "pliage"],
  ],
  "Alexander McQueen": [
    ["Skull Box Clutch", "skull box"], ["Skull", "skull"],
  ],
  Tumi: [
    ["Voyageur", "voyageur"], ["Alpha", "alpha"], ["Harrison", "harrison"], ["19 Degree", "19 degree"],
    ["Georgica", "georgica"], ["Sinclair", "sinclair"], ["Devoe", "devoe"], ["Calais", "calais"],
  ],
  "Proenza Schouler": [
    ["PS1", "ps1"], ["PS11", "ps11"], ["PS1 Keepall", "ps1 keepall"],
  ],
  "Mansur Gavriel": [
    ["Bucket Bag", "bucket bag"], ["Sun Bag", "sun bag"], ["Lady Bag", "lady bag"],
  ],
  Furla: [
    ["Metropolis", "metropolis"], ["1927", "1927"], ["Miastella", "miastella"], ["Sofia", "sofia"],
  ],
  // ── Added 2026-07-26, archivist-verified (docs/seller-title-grammar.md). ──────────
  // DKNY names models directly (<Name> <Silhouette>): "Paige Satchel", "Bryar Large
  // Satchel". Bryant Park and Gansevoort are LINES spanning silhouettes, the same shape
  // as Michael Kors "Jet Set", so they are models here too.
  // REJECTED as non-models: "signature" (the logo coated canvas, and the single biggest
  // string at 727 rows), "pinstripe" (the quilting on the Gansevoort), "lizard" and
  // "saffia" (truncated Saffiano) as materials, plus zip/dome/envelope/turnlock/padlock
  // descriptors. Left out as UNSOURCED: bryant (bare), allen, chelsea, dixie, beekman,
  // greenwhich — several look like cross-brand bleed (Kate Spade owns Allen Street,
  // Coach owns Chelsea, Michael Kors owns Greenwich).
  DKNY: [
    ["Bryant Park", "bryant park"], ["Gansevoort", "gansevoort"], ["Paige", "paige"],
    ["Delphine", "delphine"],
    // Current models straight off dkny.com product/collection pages.
    ["Bryar", "bryar"], ["Willa", "willa"], ["Nell", "nell"], ["Nessa", "nessa"],
    ["Brady", "brady"], ["Hadlee", "hadlee"], ["Paula", "paula"], ["Capri", "capri"],
    ["Jenny", "jenny"], ["Remy", "remy"], ["Giselle", "giselle"], ["Foster", "foster"],
    ["Elicia", "elicia"], ["Tinsley", "tinsley"], ["Avril", "avril"], ["Riona", "riona"],
    ["Josie", "josie"], ["Millie", "millie"], ["Carter", "carter"], ["Barrett", "barrett"],
    ["Raya", "raya"],
  ],
  // Kate Spade has TWO naming eras and needs both shapes.
  //   pre-2018:  <Collection> <Silhouette-name>  e.g. "Cedar Street Maise"
  //   post-2018: a single name                   e.g. "Margaux"
  // The collection (Cedar Street, Cameron Street…) is the MATERIAL line, confirmed on
  // katespade.com: "the Cameron Street collection… wipe-away crosshatched leather".
  // The person name is the SILHOUETTE and travels across collections (Cedar Street Maise
  // / Cameron Street Maise / Matthews Street Maise), so it is structurally LV: Maise is
  // the Speedy, Cedar Street is the Damier.
  // KEY ON THE PAIR, never either half alone: bare "Loden" is a style name that
  // katespade.com sells on an IVORY bag (so it would poison colorway), and bare
  // "Cameron Street" covers six different silhouettes (Candace, Lucie, Maise, Sarah,
  // Lottie, Byrdie). Pairs are listed FIRST so they win; bare collections are a
  // deliberate roll-up fallback LAST, for the titles that carry no person name.
  "Kate Spade": [
    // Pairs (specific) — first.
    ["Grove Street Millie", "grove street millie"],
    ["Cameron Street Candace", "cameron street candace"],
    ["Cameron Street Dody", "cameron street dody"],
    ["Reese Park Marci", "reese park marci"],
    ["Greenwood Place Rita", "greenwood place rita"],
    ["Mulberry Street Pyper", "mulberry street pyper"],
    ["Cedar Street Jensen", "cedar street jensen"],
    ["Cobble Hill Leslie", "cobble hill leslie"],
    ["Cobble Hill Clarke", "cobble hill clarke"],
    ["Hayes Street Hayzel", "hayes street hayzel"],
    ["Newbury Lane Sally", "newbury lane sally"],
    // "Loden" is the STYLE name, not the colour, despite how it reads. Seller
    // misspelling "newberry" carried as an alias token.
    ["Newbury Lane Loden", "newbury lane loden", "newberry lane loden"],
    ["Oliver Street Lilly", "oliver street lilly"],
    ["Elliot Place Carmina", "elliot place carmina"],
    ["Beacon Court Angelica", "beacon court angelica"],
    // Seller strings truncate these two: the collections are GOLD Coast and NEW Bond
    // Street. Both spellings carried.
    ["Gold Coast Maryanne", "gold coast maryanne", "coast maryanne"],
    ["New Bond Street Florence", "new bond street florence", "bond street florence"],
    ["Briar Lane Emelyn", "briar lane emelyn", "emelyn"],
    // Post-2018 single names.
    ["Margaux", "margaux"], ["Knott", "knott"], ["Marti", "marti"], ["Reegan", "reegan"],
    ["Spencer", "spencer"],
    // Bare-collection roll-up — LAST, so every pair above claims its rows first.
    ["Cameron Street", "cameron street"], ["Cedar Street", "cedar street"],
    ["Grove Street", "grove street"], ["Mulberry Street", "mulberry street"],
    ["Cove Street", "cove street"], ["Grand Street", "grand street"],
    ["Jackson Street", "jackson street"], ["Thompson Street", "thompson street"],
    ["Chester Street", "chester street"], ["Matthews Street", "matthews street"],
    ["Allen Street", "allen street"], ["Newbury Lane", "newbury lane"],
    ["Reese Park", "reese park"], ["Greenwood Place", "greenwood place"],
    ["Hayes Street", "hayes street"], ["Cobble Hill", "cobble hill"],
    ["Oliver Street", "oliver street"], ["Elliot Place", "elliot place"],
    ["Beacon Court", "beacon court"], ["Gold Coast", "gold coast"],
    ["New Bond Street", "new bond street"], ["Wellesley", "wellesley"],
    ["Briar Lane", "briar lane"], ["Love Shack", "love shack"],
  ],
};

/**
 * Map a (brand, raw title) → canonical model, or null when it's an accessory/SLG or no
 * known model matches. `brand` may be a raw/sub-brand string — it's canonicalized here.
 */
export function canonicalModel(brand: string, rawName: string | null | undefined): string | null {
  // A trailing " w/ <known extra>" is a bundled add-on, not the item ("herbag zip 31
  // w/ pouch", "lindy 26 w/ twilly scarf") — it must neither trip the SLG gate nor
  // donate a model word. Anchored to an extras vocabulary because a bare " w " is
  // also the slug form of E/W ("e w shopping tote") where truncating would eat the
  // model.
  const hay = fold((rawName ?? "").toLowerCase())
    .replace(/&amp;/g, "&")
    .replace(
      /\s(?:w\/?|with)\s+(?:[a-z0-9'&-]+\s+){0,3}(?:tags?|pouch(?:es)?|straps?|belts?|box|dust\s*bag|charms?|scarf|twilly|mirror|kit|receipt|cards?|chains?|wallet|coin\s*purse|accessories)\b.*$/,
      "",
    );
  if (!hay) return null;
  const isBagOverride = hasBagOverride(hay);
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

/** High-precision non-bag object tokens for the READ-TIME deal / discrepancy guard
 *  only — NOT the ingest canonicalModel gate, so model resolution stays stable. These
 *  are objects that get mis-attached to a bag variant and then WIN the deals rail
 *  because they're cheap: tech cases, jewelry, trinkets. Multi-word (or unambiguous)
 *  where a bare word would risk a real bag ("ring handle", "chain"). */
const EXTRA_NONBAG_TOKENS = [
  "ipad", "tablet case", "kindle", "e-reader", "ereader", "laptop sleeve", "laptop case",
  "locket", "keychain", "key chain", "money clip", "luggage tag", "airpods case",
];

/** Real bag-shape / model HEAD nouns. Their presence RESCUES a title from the accessory
 *  gate: a bag whose description merely contains an accessory-ish word as a colour, print,
 *  or quilt style ("Rose Lipstick" Birkin, "Travel Stickers" Neverfull, "Jacket … Boy
 *  Flap") is still a bag. Deliberately excludes bare "bag" (pouches get called "pouch
 *  bag") — only strong shape words. Read-time / cleanup guard only. */
const BAG_SHAPE_TOKENS = [
  "flap", "tote", "birkin", "kelly", "neverfull", "speedy", "backpack", "satchel",
  "hobo", "shopper", "boston", "bucket bag", "messenger", "drawstring bag", "bowling",
  "duffle", "duffel", "top handle",
  // Explicit bag claims: a title calling itself a handbag / crossbody / shoulder bag is a
  // bag, even if it also lists an included pouch or wristlet (Coach titles do this a lot).
  "handbag", "crossbody", "shoulder bag",
];

/** Unambiguous SLG OBJECT nouns — a title naming one of these is a small leather good even
 *  when it ALSO carries a bag-shape word ("Flap Coin Purse", "Boy Card Holder", "Classic
 *  Flap Wallet"). These BEAT the BAG_SHAPE_TOKENS rescue below, but are still checked AFTER
 *  BAG_OVERRIDES, so a Wallet on Chain / chain wallet (a ranked bag) stays a bag. Mirrors
 *  the object set in detect-listing-discrepancies' STRONG_ACCESSORY_RX. Without this a
 *  "Flap Coin Purse" reads as a bag on the "flap" token alone (owner taxonomy, 2026-07-11). */
const STRONG_SLG_NOUNS = [
  "coin purse", "coin case", "card holder", "cardholder", "card case", "card wallet",
  "key pouch", "key case", "key holder", "wallet",
];

/** Same hay preprocessing canonicalModel uses (fold accents, decode &amp;, drop a
 *  trailing bundled "w/ <extra>" so an add-on never trips the accessory gate). */
function accessoryHay(rawName: string | null | undefined): string {
  return fold((rawName ?? "").toLowerCase())
    .replace(/&amp;/g, "&")
    .replace(
      /\s(?:w\/?|with)\s+(?:[a-z0-9'&-]+\s+){0,3}(?:tags?|pouch(?:es)?|straps?|belts?|box|dust\s*bag|charms?|scarf|twilly|mirror|kit|receipt|cards?|chains?|wallet|coin\s*purse|accessories)\b.*$/,
      "",
    );
}

/**
 * True when a raw listing title is a non-bag accessory / SLG / tech case / trinket that
 * should never sit under a handbag variant (card holder, key pouch, iPad case, locket…).
 * Honors BAG_OVERRIDES so carried pouches the catalog ranks (WOC / vanity / belt bag /
 * the pouch) stay bags. Reuses the SAME SLG token set as the ingest gate so the
 * read-time guard and ingest agree, plus a few high-precision extras ingest omits.
 */
export function isNonBagAccessory(rawName: string | null | undefined): boolean {
  const hay = accessoryHay(rawName);
  if (!hay) return false;
  if (hasBagOverride(hay)) return false;
  const hasAccessoryToken =
    SLG_TOKENS.some((t) => hasSlg(hay, t.trim())) ||
    EXTRA_NONBAG_TOKENS.some((t) => hasSlg(hay, t.trim()));
  if (!hasAccessoryToken) return false;
  // Unambiguous SLG object noun (coin purse, card holder, wallet…) beats the shape rescue:
  // a "Flap Coin Purse" / "Boy Card Holder" is an SLG even though it carries "flap"/"boy".
  // BAG_OVERRIDES already ran above, so a Wallet on Chain never reaches here.
  if (STRONG_SLG_NOUNS.some((t) => hasSlg(hay, t))) return true;
  // Rescue: a strong bag-shape head noun means this is a BAG whose description merely
  // contains an accessory-ish word as a colour / print / quilt style. Real accessories
  // (card holder, camera case, "Boy Pouch") carry no such shape word.
  if (BAG_SHAPE_TOKENS.some((t) => has(hay, t))) return false;
  return true;
}

/**
 * True when a raw listing title clearly names a DIFFERENT canonical model than the style
 * it's attached to (e.g. our dictionary maps the title to "Camera Bag" but it sits under
 * "Boy"). Only asserts when BOTH the title AND the attached style resolve to KNOWN,
 * different models — returns false on any ambiguity (unknown title model, unmatched
 * style), so it never fires on a bag our dictionary simply doesn't cover.
 */
export function titleNamesDifferentStyle(
  brand: string,
  attachedStyleName: string | null | undefined,
  rawName: string | null | undefined,
): boolean {
  const titleModel = canonicalModel(brand, rawName);
  if (!titleModel) return false;
  const styleModel = canonicalModel(brand, attachedStyleName);
  if (!styleModel) return false;
  return titleModel !== styleModel;
}

/** Style names that are THEMSELVES accessories (a catalog entry for a pouch / clutch /
 *  wallet line), so their accessory listings correctly belong and are never contamination.
 *  Accent-folded before test. */
const ACCESSORY_STYLE_RX =
  /(pochette|clutch|wallet|pouch|toiletry|cosmetic|card\s?holder|coin|key\s?pouch|bride.?a.?brac)/;

export type ListingAttachment = "bag" | "accessory" | "wrong_model";

/**
 * THE single source of truth for "does this listing belong on the bag variant it's
 * attached to." The deals rail, the shop, the discrepancy detector, and the data-health
 * check all call this so the answer is decided in exactly one place (owner report
 * 2026-07-11). Returns:
 *   'bag'         — belongs (a real bag of the style, OR a listing on an accessory-style)
 *   'accessory'   — a non-bag SLG / shoe / jewelry mis-filed on a real bag
 *   'wrong_model' — a real bag whose title names a different known model than the style
 */
export function classifyListingAttachment(
  brand: string,
  styleName: string | null | undefined,
  rawName: string | null | undefined,
): ListingAttachment {
  // A style that is itself an accessory (Pochette Accessoires, Caro Pouch, Bride-à-Brac):
  // its accessory listings belong there, so nothing on it is contamination.
  const sn = fold((styleName ?? "").toLowerCase());
  if (isNonBagAccessory(styleName) || ACCESSORY_STYLE_RX.test(sn)) return "bag";

  // Same-model rescue: the title resolves to the SAME model as the style, so it IS the
  // correct bag and a colour/type word merely tripped a token ("Faye Bracelet Bag").
  const titleModel = canonicalModel(brand, rawName);
  const styleModel = canonicalModel(brand, styleName);
  if (titleModel != null && styleModel != null && titleModel === styleModel) return "bag";

  if (isNonBagAccessory(rawName)) return "accessory";
  if (titleNamesDifferentStyle(brand, styleName, rawName)) return "wrong_model";
  return "bag";
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
