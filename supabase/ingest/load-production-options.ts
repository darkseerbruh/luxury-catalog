 
/**
 * Seed the production_option table (migration 0054) from the archivist production matrix
 * (docs/research-drafts/classic-flap-production-matrix.md). One reviewed source of what each
 * style was PRODUCED in; the selector reads it so options reflect production, not our listings.
 *
 * Idempotent per style: deletes that style's rows, re-inserts the reviewed set. Run AFTER the
 * migration is applied (errors clearly otherwise).
 *   npx tsx supabase/ingest/load-production-options.ts            # dry run
 *   npx tsx supabase/ingest/load-production-options.ts --write    # apply
 */
import { supabaseAdmin as db } from "../seed/lib/client";

const WRITE = process.argv.includes("--write");

type Row = {
  axis: "size" | "color" | "material" | "construction" | "hardware";
  value: string;
  permanence?: "permanent" | "seasonal";
  season_code?: string;
  is_default?: boolean;
  note?: string;
  sort_order: number;
};

const SRC = "Archivist 2026-07-11/12/13; classic-flap-production-matrix.md; lv-alma-hermes-birkin-production-matrix.md; onthego-ladydior-saintlouis-jackie-production-matrix.md; cassette-jackie-artois-pochettemetis-production-matrix.md; kelly-woc-saddle-chanel19-dionysus-horsebit-production-matrix.md; booktote-peekaboo-loulou-baguette-chanel22-diana-production-matrix.md; rockstud-kate-jodie-puzzle-bamboo-city-antigona-production-matrix.md; ophidia-triomphe-luggage-tabby-sohodisco-sacdejour-reedition-production-matrix.md; loucamera-le5a7-pochetteacc-hourglass-niki-multipochette-30montaigne-production-matrix.md";

// Chanel Classic Flap (11.12), style_id 1. Sourced axis values; NOT a combination matrix
// (Chanel makes most combos, and seasonal colours have no official names — those are captured
// per-listing as descriptor + season code, never seeded as fake named options here).
const CLASSIC_FLAP: Row[] = [
  // Sizes (all permanent; Maxi CONFIRMED current 2026-07-12, code A58601)
  { axis: "size", value: "Small", permanence: "permanent", sort_order: 1 },
  { axis: "size", value: "Medium (M/L)", permanence: "permanent", is_default: true, note: "most-produced size; ~25.5 cm", sort_order: 2 },
  { axis: "size", value: "Jumbo", permanence: "permanent", note: "boutique word is 'Large'", sort_order: 3 },
  { axis: "size", value: "Maxi", permanence: "permanent", note: "current size, code A58601", sort_order: 4 },
  // Materials
  { axis: "material", value: "Caviar", permanence: "permanent", is_default: true, note: "grained calfskin, holds shape", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", note: "smooth, more delicate", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Denim", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Jersey", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Velvet", permanence: "seasonal", sort_order: 7 },
  { axis: "material", value: "Iridescent", permanence: "seasonal", note: "iridescent/ombré calfskin", sort_order: 8 },
  // Construction / quilting
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "construction", value: "Chevron", permanence: "permanent", note: "genuine seasonal variation, same price", sort_order: 2 },
  // Permanent colour families (seasonal colours are captured per-listing, not seeded)
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black caviar + gold = most requested", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry→bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];

// Chanel Boy (style 424), archivist-sourced 2026-07-12 (Fashionphile/Baghunter/Rebag/SACLÀB).
// Old vs New Medium are two real sizes; XL discontinued; Mini seasonal. Hardware is a real Boy
// axis (ruthenium signature). Same "no official seasonal colour names" regime as the Flap.
const BOY: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~20 cm", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "'Old Medium', ~25 cm", sort_order: 2 },
  { axis: "size", value: "New Medium", permanence: "permanent", is_default: true, note: "~28 cm, most common on the market", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~30 cm, scarce", sort_order: 4 },
  { axis: "size", value: "XL", note: "discontinued, produced 2013-2014 only", sort_order: 5 },
  { axis: "size", value: "Mini", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Calfskin", permanence: "permanent", is_default: true, note: "launch leather, plain or glazed", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", sort_order: 2 },
  { axis: "material", value: "Caviar", permanence: "permanent", sort_order: 3 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Velvet", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Sequin", permanence: "seasonal", sort_order: 7 },
  { axis: "material", value: "Metallic", permanence: "seasonal", sort_order: 8 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / galuchat, historic", sort_order: 9 },
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "construction", value: "Chevron", permanence: "permanent", note: "standard Boy variant, same tier", sort_order: 2 },
  { axis: "construction", value: "Plain", permanence: "seasonal", note: "smooth / unquilted", sort_order: 3 },
  { axis: "hardware", value: "Ruthenium", permanence: "permanent", is_default: true, note: "the Boy's signature antiqued tone", sort_order: 1 },
  { axis: "hardware", value: "Aged gold", permanence: "permanent", sort_order: 2 },
  { axis: "hardware", value: "Gold", permanence: "permanent", sort_order: 3 },
  { axis: "hardware", value: "Silver", permanence: "permanent", sort_order: 4 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "black-on-black hardware, sought after", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor, with ruthenium or antique-gold", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", sort_order: 5 },
];

// Chanel 2.55 Reissue (style 423). Facts from the prior flap-decoder archivist runs
// (Mademoiselle rectangular lock, aged all-metal chain, 2005 reissue of the Feb 1955 original,
// numeric size codes) + Chanel's house-wide permanent palette (archivist-confirmed same as the
// Flap/Boy). Reissue's signature exterior is aged/distressed calfskin; it is diamond-quilted.
const REISSUE: Row[] = [
  { axis: "size", value: "224", permanence: "permanent", note: "small", sort_order: 1 },
  { axis: "size", value: "225", permanence: "permanent", note: "~24 cm", sort_order: 2 },
  { axis: "size", value: "226", permanence: "permanent", is_default: true, note: "~28 cm, most common", sort_order: 3 },
  { axis: "size", value: "227", permanence: "permanent", note: "~28 cm, larger", sort_order: 4 },
  { axis: "size", value: "228", permanence: "permanent", note: "maxi", sort_order: 5 },
  { axis: "size", value: "Mini", permanence: "seasonal", sort_order: 6 },
  { axis: "material", value: "Aged Calfskin", permanence: "permanent", is_default: true, note: "the Reissue's signature distressed leather", sort_order: 1 },
  { axis: "material", value: "Caviar", permanence: "permanent", sort_order: 2 },
  { axis: "material", value: "Lambskin", permanence: "permanent", sort_order: 3 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Metallic", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python etc., historic", sort_order: 6 },
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "hardware", value: "Aged gold", permanence: "permanent", is_default: true, note: "antiqued, with the Mademoiselle lock + aged all-metal chain", sort_order: 1 },
  { axis: "hardware", value: "Aged ruthenium", permanence: "permanent", sort_order: 2 },
  { axis: "hardware", value: "Gold", permanence: "permanent", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", sort_order: 5 },
];

// LV Speedy (style 433), archivist-sourced 2026-07-12 (LV.com / PurseBlog / Yoogi's). LV's
// PRIMARY axis is the CANVAS/material (Monogram default, Damier Ebene/Azur, Empreinte leather);
// colour only varies inside the leather lines (Empreinte/Epi) and LV names are OFFICIAL. Strap
// (Bandoulière) is a construction flag, not a size. Hardware is fixed per line, not an axis.
const LV_SPEEDY: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~16 cm, with strap", sort_order: 1 },
  { axis: "size", value: "20", permanence: "permanent", note: "~20 cm", sort_order: 2 },
  { axis: "size", value: "25", permanence: "permanent", note: "~25 cm, added 1959", sort_order: 3 },
  { axis: "size", value: "30", permanence: "permanent", is_default: true, note: "the original 1930 size, most popular", sort_order: 4 },
  { axis: "size", value: "35", permanence: "permanent", note: "reduced availability", sort_order: 5 },
  { axis: "size", value: "40", permanence: "permanent", note: "travel size, mostly Monogram", sort_order: 6 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated canvas, natural vachetta trim", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin, the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Epi", permanence: "seasonal", note: "textured leather, intermittent runs", sort_order: 5 },
  { axis: "material", value: "Vernis", permanence: "seasonal", note: "patent leather", sort_order: 6 },
  { axis: "material", value: "Denim", permanence: "seasonal", sort_order: 7 },
  { axis: "construction", value: "Standard", permanence: "permanent", is_default: true, note: "handheld", sort_order: 1 },
  { axis: "construction", value: "Bandoulière", permanence: "permanent", note: "adds a detachable strap + two-way zip (since 2011)", sort_order: 2 },
  // Colour applies only to the leather lines (Empreinte/Epi); LV names are official. Noir is the
  // anchor; the rest are the colour families we have Empreinte/Epi resale listings for (n>=5,
  // observed 2026-07-12) — permanence left null because LV's leather palette rotates and we don't
  // source which brights are permanent. Canvas lines (Monogram/Damier) take no colour choice.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte/Epi 'Noir'; the anchor", sort_order: 1 },
  { axis: "color", value: "Beige", note: "Empreinte neutral (observed listings)", sort_order: 2 },
  { axis: "color", value: "Blue", note: "Empreinte (observed listings)", sort_order: 3 },
  { axis: "color", value: "Red", note: "Empreinte/Epi (observed listings)", sort_order: 4 },
  { axis: "color", value: "Green", note: "Empreinte (observed listings)", sort_order: 5 },
  { axis: "color", value: "Purple", note: "Epi (observed listings)", sort_order: 6 },
  { axis: "color", value: "Metallic", note: "Epi (observed listings)", sort_order: 7 },
];

// LV Neverfull (style 218). Same LV canvas-primary model as the Speedy: the core canvases
// (Monogram default, Damier Ebene/Azur, Empreinte leather) are the well-established Neverfull
// lines; sizes PM/MM/GM are universal (MM most popular). Colour applies to Empreinte only.
const LV_NEVERFULL: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", note: "~29 cm", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "~32 cm, the most popular", sort_order: 2 },
  { axis: "size", value: "GM", permanence: "permanent", note: "~39 cm, the largest", sort_order: 3 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated canvas, vachetta trim", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin, the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Vernis", permanence: "seasonal", note: "patent, limited", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte anchor; canvas lines take no colour choice", sort_order: 1 },
];

// LV Alma (style 434), archivist-sourced 2026-07-12 (Rebag size guide / Fashionphile / PurseBlog
// / louisvuitton.com snippet; LV line vocabulary from seasonal-archive/louis-vuitton.md). LV's
// PRIMARY axis is the CANVAS/material (Monogram default); colour varies only inside the leather
// lines (Epi/Vernis/Empreinte) and LV names are OFFICIAL. Strap is decided by SIZE (Nano/BB/PM
// include one, MM/GM do not), so there is NO Bandoulière construction toggle. Hardware is fixed
// per line, not an axis. cm are approximate (converted from reseller inch measurements).
const LV_ALMA: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~16.5 cm, crossbody w/ strap; current but rare", sort_order: 1 },
  { axis: "size", value: "BB", permanence: "permanent", is_default: true, note: "~23.5 cm, the most common on resale; includes removable strap", sort_order: 2 },
  { axis: "size", value: "PM", permanence: "permanent", note: "~32 cm, the original 1934 proportion; includes strap", sort_order: 3 },
  { axis: "size", value: "MM", permanence: "permanent", note: "~34 cm, no strap included", sort_order: 4 },
  { axis: "size", value: "GM", permanence: "permanent", note: "~38 cm, travel size; reduced availability (may be retired from current canvas lineup)", sort_order: 5 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated canvas, natural vachetta trim", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Epi", permanence: "permanent", note: "textured leather; the Alma is a signature Epi shape, the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Vernis", permanence: "permanent", note: "Monogram Vernis patent; the Alma Vernis is the signature, colour-bearing (LV phasing Vernis down)", sort_order: 5 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin, colour-bearing", sort_order: 6 },
  { axis: "material", value: "Multicolore", note: "Murakami screen-print Monogram; discontinued 2015, historic/collectible", sort_order: 7 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / ostrich / Malletage-quilted, limited runs", sort_order: 8 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Epi/Vernis/Empreinte 'Noir'; canvas lines take no colour choice; all other colours rotate seasonally, captured per-listing", sort_order: 1 },
];

// Hermès Birkin (style 4), archivist-sourced 2026-07-12. Leathers + permanent colour core + codes
// reused from seasonal-archive/hermes.md (auction + reference-cross-checked); size/construction/
// hardware confirmed against Christie's "Retourné vs Sellier Birkin" collecting guide (2026-05-14,
// auction-grade) + Sotheby's Gold Birkin guide. LEATHER is the primary spec axis (Togo default);
// the palette rotates by the hundreds seasonally so only house-permanent anchor colours are seeded,
// the rest captured per-listing. Retourné (default) vs Sellier is a genuine construction toggle.
const BIRKIN: Row[] = [
  { axis: "size", value: "25", permanence: "permanent", note: "~25 cm; the current desire-object, scarcer at retail", sort_order: 1 },
  { axis: "size", value: "30", permanence: "permanent", is_default: true, note: "~30 cm; the practical everyday size, most liquid on resale", sort_order: 2 },
  { axis: "size", value: "35", permanence: "permanent", note: "~35 cm; an original 1984 size, abundant in vintage", sort_order: 3 },
  { axis: "size", value: "40", permanence: "permanent", note: "~40 cm; original 1984 travel size, less common now (produced but scarce)", sort_order: 4 },
  { axis: "size", value: "20", permanence: "seasonal", note: "20 cm; Sellier-only, Faubourg + limited editions since 2019", sort_order: 5 },
  { axis: "material", value: "Togo", permanence: "permanent", is_default: true, note: "Veau Togo; fine pebbled calf, the most common Birkin leather; Retourné", sort_order: 1 },
  { axis: "material", value: "Clemence", permanence: "permanent", note: "Veau Taurillon Clemence; soft flat-grained bull calf, relaxed slouch; Retourné", sort_order: 2 },
  { axis: "material", value: "Epsom", permanence: "permanent", note: "Veau Epsom; embossed rigid calf, holds shape; the primary Sellier leather", sort_order: 3 },
  { axis: "material", value: "Swift", permanence: "permanent", note: "Veau Swift; soft near-smooth calf, takes colour brightly; smaller sizes", sort_order: 4 },
  { axis: "material", value: "Box Calf", permanence: "permanent", note: "Veau Box; smooth glossy heritage calf that patinates; vintage + Sellier", sort_order: 5 },
  { axis: "material", value: "Barenia", permanence: "permanent", note: "smooth saddle calf, patinas/darkens; heritage, highly sought", sort_order: 6 },
  { axis: "material", value: "Chevre Mysore", permanence: "seasonal", note: "bright-grained goat; occasional on the Birkin, more common on Kelly/small", sort_order: 7 },
  { axis: "material", value: "Ostrich", permanence: "seasonal", note: "Autruche; quill-bump exotic, cyclical", sort_order: 8 },
  { axis: "material", value: "Niloticus Crocodile", permanence: "seasonal", note: "Nile croc exotic; two-dot blind stamp", sort_order: 9 },
  { axis: "material", value: "Porosus Crocodile", permanence: "seasonal", note: "saltwater croc, smallest/most-prized scales; caret blind stamp", sort_order: 10 },
  { axis: "material", value: "Alligator", permanence: "seasonal", note: "Alligator Mississippiensis exotic; square blind stamp", sort_order: 11 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "GHW; warm-tone, the classic pairing (Palladium is co-equal; default is a judgment call)", sort_order: 1 },
  { axis: "hardware", value: "Palladium", permanence: "permanent", note: "PHW; bright silver-tone, equally standard", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark gunmetal tone; intermittent", sort_order: 3 },
  { axis: "hardware", value: "Brushed", permanence: "seasonal", note: "matte brushed finish of gold/palladium, seasonal", sort_order: 4 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "all-black hardware, limited editions", sort_order: 5 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "limited", sort_order: 6 },
  { axis: "construction", value: "Retourne", permanence: "permanent", is_default: true, note: "stitched inward, soft rounded silhouette; the original/dominant form; Togo/Clemence/Swift; broader size range", sort_order: 1 },
  { axis: "construction", value: "Sellier", permanence: "permanent", note: "stitched outward, crisp architectural silhouette; since 2014; Epsom/Box; 25/30/35 (+20-only). Special builds (Touch/Cargo/Shadow/Faubourg/3-in-1) are per-listing, not seeded", sort_order: 2 },
  { axis: "color", value: "Noir", permanence: "permanent", is_default: true, note: "code 89; true black, the anchor", sort_order: 1 },
  { axis: "color", value: "Etoupe", permanence: "permanent", note: "code 18; grey-brown taupe, the bestselling everyday neutral", sort_order: 2 },
  { axis: "color", value: "Gold", permanence: "permanent", note: "code 06; warm camel-brown, the iconic Birkin tan (Or)", sort_order: 3 },
  { axis: "color", value: "Etain", permanence: "permanent", note: "code 8F; mid-dark cool pewter grey", sort_order: 4 },
  { axis: "color", value: "Craie", permanence: "permanent", note: "code 10; soft chalk off-white", sort_order: 5 },
  { axis: "color", value: "Gris Tourterelle", permanence: "permanent", note: "code 81; soft taupe-grey, a perennial collector neutral", sort_order: 6 },
  { axis: "color", value: "Rouge H", permanence: "permanent", note: "code 46; deep brown-red near-burgundy, since 1925", sort_order: 7 },
  { axis: "color", value: "Orange H", permanence: "permanent", note: "code 93; the signature box orange (Feu); harder to find lately", sort_order: 8 },
];

// LV OnTheGo (style 437), archivist-sourced 2026-07-12 (us.louisvuitton.com product dimensions +
// Spotted Fashion OnTheGo reference guide 2020-06-26; lines from seasonal-archive/louis-vuitton.md,
// OnTheGo SS2019). LV canvas-primary (Monogram Giant default); colour only on the Empreinte leather
// line. Signature is the bicolour "Giant" two-tone. NO construction toggle (fixed handles+straps),
// NO hardware axis (fixed gold-tone per line). cm approximate.
const LV_ONTHEGO: Row[] = [
  { axis: "size", value: "BB", permanence: "permanent", note: "~18 x 15 x 8 cm; the mini, least common", sort_order: 1 },
  { axis: "size", value: "PM", permanence: "permanent", note: "~25 x 19 x 11.5 cm; the compact everyday size", sort_order: 2 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "~35 x 27 x 14 cm; most-carried/most-liquid (default vs GM is soft)", sort_order: 3 },
  { axis: "size", value: "GM", permanence: "permanent", note: "~41 x 34 x 19 cm; the original 2019 launch size, true large tote", sort_order: 4 },
  { axis: "material", value: "Monogram Giant", permanence: "permanent", is_default: true, note: "enlarged-Monogram coated canvas, vachetta trim; SS2019 launch line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte Giant", permanence: "permanent", note: "embossed calfskin, giant Monogram; the bicolour (black/beige) signature; colour-bearing", sort_order: 2 },
  { axis: "material", value: "Monogram Reverse Giant", permanence: "permanent", note: "caramel/brown reverse-Monogram canvas; the other two-tone look", sort_order: 3 },
  { axis: "material", value: "Epi", permanence: "seasonal", note: "textured leather, MM only; intermittent runs", sort_order: 4 },
  { axis: "material", value: "Monogram Denim", permanence: "seasonal", note: "denim Giant Monogram, limited", sort_order: 5 },
  { axis: "material", value: "LV Escale", note: "SS2020 tie-dye print capsule; discontinued/collectible", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir' half of the bicolour; the anchor; canvas lines take no colour choice", sort_order: 1 },
  { axis: "color", value: "Cream", permanence: "permanent", note: "Empreinte 'Crème/Beige'; the pale bicolour, near-permanent (permanence soft)", sort_order: 2 },
];

// Dior Lady Dior (style 208), archivist-sourced 2026-07-12 (Fashionphile + saclab size guides;
// dior.com + banked chrome-com-colors-2026.md for the named colour lexicon; model + Cannage from
// seasonal-archive/dior.md, Lady Dior 1995). COLOUR-PRIMARY like Chanel: Cannage leather uniform,
// size + colour are the axes. Dior names its colours (seed permanent anchors, seasonal per-listing).
// Hardware is a real but colorway-tracking axis (gold default). cm approximate.
const LADY_DIOR: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~12 x 10 x 5 cm; SLG-scale, worn as a charm/mini", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~17 x 15 x 7 cm; the popular crossbody-scale mini", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~20 x 17 x 8 cm; the My ABCDior size, co-most-popular on resale", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~24 x 20 x 11 cm; the classic reference (Small is co-default on resale)", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~32 cm wide; the roomiest, less common now", sort_order: 5 },
  { axis: "material", value: "Cannage Lambskin", permanence: "permanent", is_default: true, note: "the classic softest Lady Dior leather, Cannage-quilted", sort_order: 1 },
  { axis: "material", value: "Cannage Calfskin", permanence: "permanent", note: "grained calfskin, sturdier/more scratch-resistant", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "permanent", note: "patent calfskin, glossy; recurring", sort_order: 3 },
  { axis: "material", value: "Ultramatte", permanence: "seasonal", note: "matte tonal calfskin with tonal hardware; recurring capsule", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "croc / python / ostrich / lizard, limited runs", sort_order: 5 },
  { axis: "material", value: "Embroidered", permanence: "seasonal", note: "beaded/sequined/canvas (Oblique, Toile de Jouy) + Lady Art editions, per-listing", sort_order: 6 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "pale/aged gold-finish D.I.O.R. charms; the classic (hardware largely tracks the colorway)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone charms", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark aged/ruthenium charms; on darker colorways", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black lambskin + gold = the reference Lady Dior", sort_order: 1 },
  { axis: "color", value: "Latte", permanence: "permanent", note: "Dior's signature warm beige/nude, a standing Lady Dior neutral", sort_order: 2 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "deep blue; recurring house neutral (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Dior's recurring red (Garance/Cherry rotate); near-permanent (permanence soft)", sort_order: 4 },
];

// Goyard Saint Louis (style 559), archivist-sourced 2026-07-12 (goyard.com Saint Louis PM/GM pages;
// BagUSeek tote guide mod. 2026-05-11 + goyard.com "11 available colors" PLP). COLOUR-PRIMARY: one
// tote shape, the Goyardine colour is the variant; Goyard keeps a standing named palette. NO hardware
// axis (minimal palladium). cm are Goyard's own.
const GOYARD_SAINT_LOUIS: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", is_default: true, note: "34 x 15 x 28 cm; the everyday core size (Petit Modèle)", sort_order: 1 },
  { axis: "size", value: "GM", permanence: "permanent", note: "40 x 20 x 32 cm; the true carryall (Grand Modèle)", sort_order: 2 },
  { axis: "size", value: "XXL", permanence: "seasonal", note: "~50 x 23 x 40 cm; oversized travel/beach, rarer (dims from resale)", sort_order: 3 },
  { axis: "size", value: "Junior", note: "smaller size, discontinued; resale-only now", sort_order: 4 },
  { axis: "material", value: "Goyardine", permanence: "permanent", is_default: true, note: "coated chevron canvas + Chevroches calfskin trim, unlined/reversible; the one construction", sort_order: 1 },
  { axis: "material", value: "Pearly Goyardine", permanence: "seasonal", note: "pearlescent-finish Goyardine, limited", sort_order: 2 },
  { axis: "material", value: "Claire-Voie", permanence: "seasonal", note: "edge-painted/openwork special edition, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black (natural-tan trim) is the easiest to source", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "natural/tan Goyardine", sort_order: 2 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "standing blue", sort_order: 3 },
  { axis: "color", value: "Grey", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Green", permanence: "permanent", sort_order: 5 },
  { axis: "color", value: "Sky Blue", permanence: "permanent", note: "pale blue, a standing bright", sort_order: 6 },
  { axis: "color", value: "Burgundy", permanence: "permanent", sort_order: 7 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 8 },
  { axis: "color", value: "Orange", permanence: "permanent", sort_order: 9 },
  { axis: "color", value: "Yellow", permanence: "permanent", sort_order: 10 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 11 },
];

// Gucci GG Marmont (style 200), archivist-sourced 2026-07-12 (Fashionphile + Rebag size guides;
// model + matelassé from seasonal-archive/gucci.md, GG Marmont 2016; colour treatment from
// chrome-com-colors-2026.md, which house-confirms GUCCI DOES NOT NAME ITS COLOURS — descriptor
// families only). Faceted size × leather-colour × hardware. Colour anchors are DESCRIPTORS, not house
// names. Antique-gold GG is the signature hardware. cm approximate (shoulder-flap sizing).
const GG_MARMONT: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "permanent", note: "~16.5 x 9.5 x 4 cm; the smallest, evening-scale", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~21 x 14 x 5.5 cm; the popular chain mini", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~26 x 15 x 7.5 cm; the reference flap, most cross-shopped (Mini is co-popular)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~29 x 18 x 7 cm", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~31 x 24 x 9.5 cm; scarcer", sort_order: 5 },
  { axis: "material", value: "Matelasse Chevron", permanence: "permanent", is_default: true, note: "the signature chevron-quilted calfskin with antique-gold Double-G", sort_order: 1 },
  { axis: "material", value: "Matelasse Diagonal", permanence: "permanent", note: "'Torchon' diagonal quilting variant, same leather tier", sort_order: 2 },
  { axis: "material", value: "Velvet", permanence: "seasonal", note: "matelassé velvet, often embellished", sort_order: 3 },
  { axis: "material", value: "Monogram Canvas", permanence: "seasonal", note: "GG Supreme / multicolor matelassé canvas", sort_order: 4 },
  { axis: "material", value: "Raffia", permanence: "seasonal", note: "straw/raffia-effect, summer capsules", sort_order: 5 },
  { axis: "material", value: "Embellished", permanence: "seasonal", note: "embroidered/beaded/pearl-studded editions, per-listing", sort_order: 6 },
  { axis: "hardware", value: "Antique Gold", permanence: "permanent", is_default: true, note: "the signature aged-gold Double-G; on virtually every Marmont", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "seasonal", note: "silver/palladium-tone Double-G; exists but uncommon", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/beige family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the Gucci red (descriptor); recurring (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Dusty Pink", permanence: "permanent", note: "the signature Marmont blush/rose (descriptor); recurring (permanence soft)", sort_order: 5 },
];

// Bottega Veneta Cassette (style 211), archivist-sourced 2026-07-13 (net-a-porter/Mytheresa/Amazon
// PDPs for cm; model + Padded Cassette FW2019 + named-colour lexicon from seasonal-archive/bottega-
// veneta.md). COLOUR-PRIMARY: the Intrecciato weave is the one construction, colour is the variant,
// BV names its colours (Parakeet is the one house-confirmed official; the rest reseller-attributed,
// seeded seasonal + MEDIUM). Material axis = weave/finish. NO hardware axis (Chain Cassette is per-listing).
const BV_CASSETTE: Row[] = [
  { axis: "size", value: "Candy", permanence: "permanent", note: "~9 x 12.5 x 5 cm; the cult mini (formerly 'Mini Cassette'), evening/crossbody scale", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~14 x 23 x 7 cm; the everyday Padded Cassette, most liquid (default vs Candy is soft)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~15 x 28 x 7 cm; the roomier shoulder size", sort_order: 3 },
  { axis: "material", value: "Intrecciato", permanence: "permanent", is_default: true, note: "Maxi Intrecciato woven nappa/lambskin; the base weave (Lee's oversized plait, 2019)", sort_order: 1 },
  { axis: "material", value: "Padded Intrecciato", permanence: "permanent", note: "the puffy padded weave; the FW2019 It-bag finish, the Cassette's signature look", sort_order: 2 },
  { axis: "material", value: "Tech / Nylon", permanence: "seasonal", note: "'Padded Tech Cassette' coated/tech-canvas seasonal runs", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede/other seasonal finishes", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "lizard / crocodile / metallic special editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; nero, the easiest Cassette to source", sort_order: 1 },
  { axis: "color", value: "Parakeet", permanence: "seasonal", note: "BV's signature acid-green house colour (OFFICIAL, reintroduced SS2021); recurs but rotates", sort_order: 2 },
  { axis: "color", value: "Fondant", permanence: "seasonal", note: "deep warm chocolate; reseller-attributed BV name (MEDIUM)", sort_order: 3 },
  { axis: "color", value: "Barolo", permanence: "seasonal", note: "deep burgundy; reseller-attributed BV name (MEDIUM)", sort_order: 4 },
  { axis: "color", value: "Travertine", permanence: "seasonal", note: "light olive; reseller-attributed BV name (MEDIUM)", sort_order: 5 },
  { axis: "color", value: "Porridge", permanence: "seasonal", note: "ivory beige neutral; reseller-attributed BV name (MEDIUM)", sort_order: 6 },
];

// Gucci Jackie 1961 (style 446), archivist-sourced 2026-07-13 (Rebag Feb 2023 + luxbags.fr for sizes;
// model = 1961 crescent hobo w/ piston, reissued FW2020 by Michele, from seasonal-archive/gucci.md;
// colour from chrome-com-colors-2026.md — GUCCI DOES NOT NAME ITS COLOURS, descriptors only). Faceted
// size × material × colour. NO hardware axis (piston fixed, finish tracks the colorway). cm approximate.
const GUCCI_JACKIE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 13 x 3 cm; the tiny crossbody", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~28 x 19 x 4.5 cm; the reference Jackie, most cross-shopped (default vs Medium is soft)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~36.5 x 24 x 4.5 cm; the largest, classic hobo proportion", sort_order: 3 },
  { axis: "size", value: "Notte", permanence: "seasonal", note: "elongated mini evening/baguette variant; recent, scarcer (cm not sourced)", sort_order: 4 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with leather trim; the everyday Jackie", sort_order: 1 },
  { axis: "material", value: "Smooth Leather", permanence: "permanent", note: "calfskin; the polished reissue leather", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Printed / Exotic", permanence: "seasonal", note: "leopard/snakeskin prints + exotics + Hacker Project capsule, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Jackie (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];

// Goyard Artois (style 561), archivist-sourced 2026-07-13 (goyard.com Artois PM/GM pages; leelinebags +
// fashionphile for MM; the standing Goyardine palette reused from the Saint Louis). COLOUR-PRIMARY: one
// structured zip-top tote shape, the Goyardine colour is the variant. NO hardware axis. cm are Goyard's own.
const GOYARD_ARTOIS: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", is_default: true, note: "40 x 14 x 25 cm; the everyday core size (Petit Modèle)", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", note: "~50 x 17 x 30 cm; the mid carryall (cm from reseller charts)", sort_order: 2 },
  { axis: "size", value: "GM", permanence: "permanent", note: "68 x 24 x 37 cm; the large travel tote (Grand Modèle)", sort_order: 3 },
  { axis: "material", value: "Goyardine", permanence: "permanent", is_default: true, note: "coated chevron canvas + Chevroches calfskin trim, structured with a zip top; the one construction", sort_order: 1 },
  { axis: "material", value: "Pearly Goyardine", permanence: "seasonal", note: "pearlescent-finish Goyardine, limited", sort_order: 2 },
  { axis: "material", value: "Claire-Voie", permanence: "seasonal", note: "edge-painted/openwork special edition, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black (natural-tan trim) is the easiest to source", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "natural/tan Goyardine", sort_order: 2 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "standing blue", sort_order: 3 },
  { axis: "color", value: "Grey", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Green", permanence: "permanent", sort_order: 5 },
  { axis: "color", value: "Sky Blue", permanence: "permanent", note: "pale blue, a standing bright", sort_order: 6 },
  { axis: "color", value: "Burgundy", permanence: "permanent", sort_order: 7 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 8 },
  { axis: "color", value: "Orange", permanence: "permanent", sort_order: 9 },
  { axis: "color", value: "Yellow", permanence: "permanent", sort_order: 10 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 11 },
];

// LV Pochette Métis (style 438), archivist-sourced 2026-07-13 (us.louisvuitton.com PDPs + bagreligion;
// lines from seasonal-archive/louis-vuitton.md, Pochette Métis 2012, Reverse 2016). LV canvas-primary
// (Monogram default); colour only on the Empreinte leather line. NO construction toggle (leather + chain
// straps both ship standard, no Bandoulière line). NO hardware axis. cm approximate.
const LV_POCHETTE_METIS: Row[] = [
  { axis: "size", value: "Regular", permanence: "permanent", is_default: true, note: "~25 x 19 x 7 cm; the original 2012 satchel, the resale workhorse", sort_order: 1 },
  { axis: "size", value: "East West", permanence: "permanent", note: "~21.5 x 13.5 x 6 cm; the flatter horizontal reissue", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 14 x 6 cm; the compact version (cm from a reference table)", sort_order: 3 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the 2012 launch line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing line (added after the 2012 launch)", sort_order: 2 },
  { axis: "material", value: "Monogram Reverse", permanence: "permanent", note: "caramel/brown reverse-Monogram canvas (line debuted 2016); the two-tone look", sort_order: 3 },
  { axis: "material", value: "Damier Ebene", permanence: "seasonal", note: "brown check, dark leather trim; intermittent runs (less common here)", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice", sort_order: 1 },
];

// Hermès Kelly (style 5), archivist-sourced 2026-07-13 — leather-primary, encoded exactly like the
// Birkin (leathers + colour anchors + codes reused from hermes.md). Size 20/25/28/32/35/40 (28
// default, most liquid); Sellier vs Retourné construction toggle; Gold/Palladium hardware.
const KELLY: Row[] = [
  { axis: "size", value: "20", permanence: "seasonal", note: "Mini Kelly II, ~20 cm; Sellier-only, crossbody strap; the current grail, tightest allocation", sort_order: 1 },
  { axis: "size", value: "25", permanence: "permanent", note: "~25 cm; Sellier or Retourné; strongest demand centre", sort_order: 2 },
  { axis: "size", value: "28", permanence: "permanent", is_default: true, note: "~28 cm; the most versatile and most liquid Kelly size", sort_order: 3 },
  { axis: "size", value: "32", permanence: "permanent", note: "~32 cm; the classic Grace Kelly proportion, vintage-collector following", sort_order: 4 },
  { axis: "size", value: "35", permanence: "permanent", note: "~35 cm; work/substantial carry, lowest secondary premium of the core sizes", sort_order: 5 },
  { axis: "size", value: "40", permanence: "seasonal", note: "~40 cm; travel size, rare in current production", sort_order: 6 },
  { axis: "material", value: "Togo", permanence: "permanent", is_default: true, note: "Veau Togo; fine pebbled calf, the most common Retourné Kelly leather", sort_order: 1 },
  { axis: "material", value: "Clemence", permanence: "permanent", note: "Veau Taurillon Clemence; soft flat-grained bull calf, relaxed; Retourné", sort_order: 2 },
  { axis: "material", value: "Epsom", permanence: "permanent", note: "Veau Epsom; embossed rigid calf; the primary Sellier Kelly leather (replaced Courchevel 2004)", sort_order: 3 },
  { axis: "material", value: "Swift", permanence: "permanent", note: "Veau Swift; soft near-smooth calf, takes colour brightly; smaller sizes + Kelly Pochette", sort_order: 4 },
  { axis: "material", value: "Box Calf", permanence: "permanent", note: "Veau Box; smooth glossy heritage calf that patinates; the classic vintage Sellier Kelly leather", sort_order: 5 },
  { axis: "material", value: "Chevre Mysore", permanence: "permanent", note: "bright-grained goat; more common on the Kelly (esp. small/Mini) than the Birkin", sort_order: 6 },
  { axis: "material", value: "Barenia", permanence: "seasonal", note: "smooth saddle calf, patinas/darkens; heritage, highly sought", sort_order: 7 },
  { axis: "material", value: "Lizard", permanence: "seasonal", note: "Lézard; tiny fine scales, high shine; mostly the Mini Kelly (cyclical exotic)", sort_order: 8 },
  { axis: "material", value: "Ostrich", permanence: "seasonal", note: "Autruche; quill-bump exotic, cyclical", sort_order: 9 },
  { axis: "material", value: "Niloticus Crocodile", permanence: "seasonal", note: "Nile croc exotic; two-dot blind stamp", sort_order: 10 },
  { axis: "material", value: "Porosus Crocodile", permanence: "seasonal", note: "saltwater croc, smallest/most-prized scales; caret blind stamp", sort_order: 11 },
  { axis: "material", value: "Alligator", permanence: "seasonal", note: "Alligator Mississippiensis exotic; square blind stamp", sort_order: 12 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "GHW; warm-tone (Palladium is co-equal; default is a judgment call)", sort_order: 1 },
  { axis: "hardware", value: "Palladium", permanence: "permanent", note: "PHW; bright silver-tone, equally standard", sort_order: 2 },
  { axis: "hardware", value: "Permabrass", permanence: "seasonal", note: "warm brushed-brass tone; intermittent, small Sellier Kellys", sort_order: 3 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark gunmetal tone; intermittent", sort_order: 4 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "limited", sort_order: 5 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "all-black hardware, limited editions", sort_order: 6 },
  { axis: "construction", value: "Retourne", permanence: "permanent", is_default: true, note: "stitched inward, softer silhouette; more-produced, broader leather+size range (Sellier is co-defining, so default is soft)", sort_order: 1 },
  { axis: "construction", value: "Sellier", permanence: "permanent", note: "stitched outward, rigid trapezoid; the classic Grace Kelly image; Epsom/Box; runs 20-30% above Retourné", sort_order: 2 },
  { axis: "color", value: "Noir", permanence: "permanent", is_default: true, note: "code 89; true black, the anchor", sort_order: 1 },
  { axis: "color", value: "Etoupe", permanence: "permanent", note: "code 18; grey-brown taupe, the bestselling everyday neutral", sort_order: 2 },
  { axis: "color", value: "Gold", permanence: "permanent", note: "code 06; warm camel-brown, the iconic Hermès tan (Or)", sort_order: 3 },
  { axis: "color", value: "Etain", permanence: "permanent", note: "code 8F; mid-dark cool pewter grey", sort_order: 4 },
  { axis: "color", value: "Craie", permanence: "permanent", note: "code 10; soft chalk off-white", sort_order: 5 },
  { axis: "color", value: "Gris Tourterelle", permanence: "permanent", note: "code 81; soft taupe-grey, a perennial collector neutral", sort_order: 6 },
  { axis: "color", value: "Rouge H", permanence: "permanent", note: "code 46; deep brown-red near-burgundy, since 1925", sort_order: 7 },
  { axis: "color", value: "Orange H", permanence: "permanent", note: "code 93; the signature box orange (Feu)", sort_order: 8 },
];

// Chanel Wallet on Chain / WOC (style 427), archivist-sourced 2026-07-13 — colour-primary, one core
// size + Mini. Chanel does NOT name seasonal colours (permanent palette only). Materials/quilting/
// hardware/palette reused from the Classic Flap + chanel.md.
const CHANEL_WOC: Row[] = [
  { axis: "size", value: "Classic", permanence: "permanent", is_default: true, note: "~19 x 12 x 3.5 cm; the one core WOC size (a flap wallet on a long chain)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "seasonal", note: "the smaller Mini WOC; recurring but not the standing core", sort_order: 2 },
  { axis: "material", value: "Caviar", permanence: "permanent", is_default: true, note: "grained calfskin, holds shape; the most-requested WOC leather", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", note: "smooth, more delicate", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / lizard, historic", sort_order: 5 },
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "construction", value: "Chevron", permanence: "permanent", note: "genuine seasonal variation, same tier", sort_order: 2 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "the classic pairing", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "palladium-tone", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark aged tone; intermittent", sort_order: 3 },
  { axis: "hardware", value: "Aged gold", permanence: "seasonal", note: "antiqued, on some seasonal WOCs", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black caviar + gold = most requested", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry to bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];

// Dior Saddle (style 209), archivist-sourced 2026-07-13 — size × material × colour like the Lady Dior.
// Oblique Jacquard signature; Dior NAMES its colours. No "Large" (unsourced, omitted).
const DIOR_SADDLE: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~13.3 x 12 x 3.8 cm; SLG-scale, worn as a mini/charm", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~18.5 x 15 x 5 cm; the popular compact crossbody, comes with a strap", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~24 x 20 x 6.5 cm; the Classic reference Saddle", sort_order: 3 },
  { axis: "size", value: "Saddle Pouch", permanence: "seasonal", note: "the flat pouch on a chain/strap; a per-season format, not a Saddle size", sort_order: 4 },
  { axis: "size", value: "Belt Bag", permanence: "seasonal", note: "the Saddle-shaped belt bag; recurring seasonal format", sort_order: 5 },
  { axis: "material", value: "Oblique Jacquard", permanence: "permanent", is_default: true, note: "the diagonal Dior monogram canvas; the signature Saddle (blue is the reference)", sort_order: 1 },
  { axis: "material", value: "Calfskin", permanence: "permanent", note: "smooth calfskin; the polished leather Saddle, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "grained/textured calfskin, sturdier", sort_order: 3 },
  { axis: "material", value: "Ultramatte", permanence: "seasonal", note: "matte tonal calfskin with tonal hardware; recurring capsule", sort_order: 4 },
  { axis: "material", value: "Toile de Jouy", permanence: "seasonal", note: "the pastoral printed/jacquard toile, from 2019", sort_order: 5 },
  { axis: "material", value: "Embroidered", permanence: "seasonal", note: "Mizza / beaded / sequined editions, per-listing", sort_order: 6 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "croc / python / lizard / ostrich, limited runs", sort_order: 7 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black leather + antique-gold = the reference leather Saddle", sort_order: 1 },
  { axis: "color", value: "Blue", permanence: "permanent", note: "Dior's signature Saddle blue; recurring (permanence soft)", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Latte/nude; a standing Dior neutral (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Dior's recurring red; near-permanent (permanence soft)", sort_order: 4 },
];

// Chanel 19 (style 425), archivist-sourced 2026-07-13 — colour-primary. Soft lambskin/goatskin mixed
// quilt; the signature mixed-metal gourmette chain (house-confirmed). Chanel does NOT name seasonal colours.
const CHANEL_19: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~26 cm; evening/day, crossbody or clutch", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~30 cm; the launch size, everyday reference (resellers also label 'Medium/Large')", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~36 cm; roomier day bag (reseller labels overlap the ~30 cm, verify per listing)", sort_order: 3 },
  { axis: "size", value: "Maxi", permanence: "permanent", note: "~36+ cm; fits a small laptop/tablet", sort_order: 4 },
  { axis: "size", value: "WOC", permanence: "permanent", note: "the 19 Wallet on Chain; the compact 19 format", sort_order: 5 },
  { axis: "material", value: "Lambskin", permanence: "permanent", is_default: true, note: "the soft launch leather; the 19 mixes lambskin + goatskin in its quilt", sort_order: 1 },
  { axis: "material", value: "Goatskin", permanence: "permanent", note: "the more durable co-primary 19 leather, same tier as lambskin", sort_order: 2 },
  { axis: "material", value: "Caviar", permanence: "seasonal", note: "grained calfskin; produced but less common on the 19", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Denim", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Iridescent", permanence: "seasonal", note: "iridescent/metallic calfskin", sort_order: 6 },
  { axis: "construction", value: "Diamond (oversized)", permanence: "permanent", is_default: true, note: "the 19's signature large, puffy diamond quilt (not the tight Classic-Flap diamond)", sort_order: 1 },
  { axis: "hardware", value: "Mixed", permanence: "permanent", is_default: true, note: "the signature 'gourmette' chain combining silver + ruthenium + aged gold; near-universal", sort_order: 1 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "all-black hardware, limited seasonal", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry to bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];

// Gucci Dionysus (style 201), archivist-sourced 2026-07-13 — size × material × colour, DESCRIPTOR
// colours only (Gucci doesn't name). Tiger-head spur clasp fixed (no hardware axis).
const GUCCI_DIONYSUS: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "permanent", note: "~16.5 x 10 x 4 cm; the smallest, chain-strap mini", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 16 x 6 cm; the popular chain mini", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~28 x 17 x 9 cm; the reference Dionysus, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~30 x 21.5 x 9 cm; the roomier shoulder size", sort_order: 4 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with leather trim; the everyday Dionysus", sort_order: 1 },
  { axis: "material", value: "Leather", permanence: "permanent", note: "smooth/pebbled calfskin; the polished leather version", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Velvet", permanence: "seasonal", note: "velvet, often embellished (crystals/pearls)", sort_order: 4 },
  { axis: "material", value: "Embroidered / Print", permanence: "seasonal", note: "Blooms / GG print / embroidered + exotic editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Dionysus (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];

// Gucci Horsebit 1955 (style 447), archivist-sourced 2026-07-13 — size × material × colour, descriptor
// colours only. Gold-tone horsebit fixed (no hardware axis); other 1955 silhouettes are per-listing.
const GUCCI_HORSEBIT_1955: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20.5 x 14.5 x 5 cm; the compact chain/shoulder mini", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~25 x 18 x 8 cm; the reference Horsebit 1955 shoulder bag (two straps), most cross-shopped", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~30 cm; the larger shoulder/tote proportion (less common; cm approximate)", sort_order: 3 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas + Web stripe option; the everyday 1955", sort_order: 1 },
  { axis: "material", value: "Smooth Leather", permanence: "permanent", note: "smooth calfskin; the polished leather 1955, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Exotic / Printed", permanence: "seasonal", note: "lizard / python / print + special editions, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
];

// Dior Book Tote (454), archivist-sourced 2026-07-13 — PRINT-primary (material = the embroidery).
// Dior names colours. Open tote, no hardware axis.
const DIOR_BOOK_TOTE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~23 x 15 x 5 cm; the small/phone-scale mini, comes with a strap", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~26.5 x 21 x 14 cm; the compact everyday tote", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~36 x 27.5 x 16.5 cm; the Classic reference Book Tote", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~41.5 x 35 x 18 cm; the roomiest carryall (cm approximate)", sort_order: 4 },
  { axis: "size", value: "Vertical", permanence: "seasonal", note: "the North-South vertical Book Tote; a recurring format, not a core size", sort_order: 5 },
  { axis: "material", value: "Oblique Embroidery", permanence: "permanent", is_default: true, note: "the diagonal Dior monogram embroidered canvas; the signature (blue is the reference)", sort_order: 1 },
  { axis: "material", value: "Toile de Jouy", permanence: "permanent", note: "the pastoral toile embroidery; a Chiuri signature from ~2019", sort_order: 2 },
  { axis: "material", value: "Plain Canvas / Macrocannage", permanence: "permanent", note: "solid-colour embroidered canvas ('DIOR' or Macrocannage relief), the colour-forward tote", sort_order: 3 },
  { axis: "material", value: "D-Royaume / Animal", permanence: "seasonal", note: "zodiac / animal-motif embroidered editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Embroidered / Beaded", permanence: "seasonal", note: "other seasonal beaded/sequined/print embroideries + personalisation, per-listing", sort_order: 5 },
  { axis: "color", value: "Blue", permanence: "permanent", is_default: true, note: "Dior's signature Oblique blue; the reference (Black is co-anchor, default is soft)", sort_order: 1 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the grey Oblique neutral; a standing anchor", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", note: "black Oblique / plain-canvas; the minimalist anchor", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring Oblique/Toile pink (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Latte/natural on plain canvas; a standing Dior neutral (permanence soft)", sort_order: 5 },
];

// Fendi Peekaboo (205), archivist-sourced 2026-07-13 — size × material × colour, DESCRIPTOR colours
// (Fendi doesn't name). Twin twist-locks + contrasting lining fixed (no hardware axis).
const FENDI_PEEKABOO: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "~19 x 16 x 6 cm; the micro/charm Peekaboo, recent addition", sort_order: 1 },
  { axis: "size", value: "Petite", permanence: "permanent", note: "the ISeeU Petite (~SLG-scale accordion); a centenary-era addition (~2024)", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~23 x 18 x 11 cm; the Iconic Mini, a top-selling size", sort_order: 3 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~27 x 21 x 11 cm; the ISeeU Small (accordion); the popular structured crossbody", sort_order: 4 },
  { axis: "size", value: "Regular", permanence: "permanent", is_default: true, note: "~33 x 25 x 12 cm; the Iconic Medium/Regular, the reference (Mini is co-popular, default is soft)", sort_order: 5 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~43 x 32 x 14 cm; the roomiest Iconic size, less common now", sort_order: 6 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", is_default: true, note: "smooth/soft calf leather; the everyday Peekaboo, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Selleria", permanence: "permanent", note: "hand-saddle-stitched Cuoio Romano leather (contrast stitch, silver 1925 tag); the artisanal Peekaboo", sort_order: 2 },
  { axis: "material", value: "FF / Zucca Canvas", permanence: "seasonal", note: "the interlocking-FF logo canvas / FF 1974 embossed body; recurring logo runs", sort_order: 3 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / python / ostrich / lizard", sort_order: 4 },
  { axis: "material", value: "Fur / Embellished", permanence: "seasonal", note: "shearling/'teddy' fur, beaded, sequined editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "tobacco/chocolate brown family; descriptor", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral (incl. Selleria naturals); descriptor", sort_order: 3 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey family; descriptor (permanence soft)", sort_order: 5 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red family (descriptor); near-permanent (permanence soft)", sort_order: 6 },
];

// YSL Loulou (460), archivist-sourced 2026-07-13 — size × material × colour × hardware-tone. YSL names
// permanents as plain descriptors (Noir/Blanc/Rouge); the Cassandre tone (gold/silver) is the real naming axis.
const YSL_LOULOU: Row[] = [
  { axis: "size", value: "Toy", permanence: "permanent", note: "~20 x 14 x 7 cm; the mini Loulou on a chain, the entry/evening size", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~24 x 14 x 6 cm (ysl.com); the compact everyday shoulder, co-most-popular on resale", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~32 x 21 x 10 cm; the reference Medium Loulou Matelassé (Small is co-popular, default is soft)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~37 x 27 cm; the roomiest Loulou, less common (cm approximate)", sort_order: 4 },
  { axis: "material", value: "Matelasse Lambskin", permanence: "permanent", is_default: true, note: "quilted chevron 'Y' lambskin; the softest/most common Loulou leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Matelasse Calfskin", permanence: "permanent", note: "chevron-quilted grain-de-poudre embossed calfskin; sturdier, holds shape", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Puffer", permanence: "seasonal", note: "the padded/pillow Loulou Puffer; a Vaccarello-era cult variant", sort_order: 4 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed or exotic editions, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone Cassandre; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone Cassandre; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Aged / Brushed", permanence: "seasonal", note: "aged or brushed-tone Cassandre on some seasonal Loulous", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the definitive Loulou colour, the anchor (plain descriptor)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];

// Fendi Baguette (204), archivist-sourced 2026-07-13 — MATERIAL-primary (1,000+ surface variations),
// DESCRIPTOR colours. FF flap clasp fixed (no hardware axis); Chain formats per-listing.
const FENDI_BAGUETTE: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "~11 x 6.5 x 2.5 cm; the micro/charm Baguette, part of the modern revival", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 11.5 x 4 cm; the small crossbody Baguette, a revival-era staple", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~27 x 15 x 6 cm; the Iconic/Regular Baguette, the reference SATC size", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~32 x 17 cm; the oversized 'Baguette Large'/'Grande', less common (cm approximate)", sort_order: 4 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "smooth/soft nappa or calf leather; the everyday Baguette, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "FF / Zucca Canvas", permanence: "permanent", note: "the interlocking-FF 'Zucca' logo canvas / FF 1974 embossed; the heritage logomania Baguette", sort_order: 2 },
  { axis: "material", value: "Selleria", permanence: "seasonal", note: "hand-saddle-stitched Cuoio Romano leather (silver 1925 tag); the artisanal Baguette", sort_order: 3 },
  { axis: "material", value: "Sequins / Embellished", permanence: "seasonal", note: "the famous sequined + beaded + crystal Baguettes", sort_order: 4 },
  { axis: "material", value: "Embroidered", permanence: "seasonal", note: "embroidered / brocade / tapestry editions, per-listing", sort_order: 5 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / python / ostrich / lizard, limited runs", sort_order: 6 },
  { axis: "material", value: "Fur", permanence: "seasonal", note: "shearling / fur-trimmed / 'teddy' editions, per-listing", sort_order: 7 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "tobacco/chocolate brown (incl. the Tobacco Zucca); descriptor", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral; descriptor", sort_order: 3 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring pink Baguette (descriptor); near-permanent (permanence soft)", sort_order: 5 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red family (descriptor); near-permanent (permanence soft)", sort_order: 6 },
];

// Chanel 22 (431), archivist-sourced 2026-07-13 — colour-primary, 2022 Viard drawstring hobo. Chanel
// does NOT name seasonal colours. Signature gold chain + '22' plate; oversized diamond quilt.
const CHANEL_22: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~18 x 20 x 6.5 cm; the compact 22, added after launch; the crossbody format", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~29 x 32 x 7.5 cm; the everyday reference (reseller labels overlap Small/Medium, verify per listing)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~35 x 37 x 7 cm; the mid drawstring hobo (labels overlap the Small)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~42 x 39 x 8 cm; the oversized shopper, the launch statement size (cm approximate)", sort_order: 4 },
  { axis: "material", value: "Shiny Calfskin", permanence: "permanent", is_default: true, note: "the soft shiny (glossy) calfskin; the launch leather + signature look of the 22", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "grained/caviar-like calfskin, sturdier, holds shape", sort_order: 2 },
  { axis: "material", value: "Tweed", permanence: "seasonal", note: "tweed body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Patent", permanence: "seasonal", note: "patent/shiny-crackled seasonal editions", sort_order: 4 },
  { axis: "construction", value: "Diamond (oversized)", permanence: "permanent", is_default: true, note: "the 22's signature large diamond quilt; the defining look", sort_order: 1 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone chain + the '22' metal plate/charm; the signature, near-universal", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone chain + '22' plate; the co-standard finish", sort_order: 2 },
  { axis: "hardware", value: "Aged gold", permanence: "seasonal", note: "antiqued gold on some seasonal 22s", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry to bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];

// Gucci Diana (451), archivist-sourced 2026-07-13 — size × material × colour, DESCRIPTOR colours. Bamboo
// handles + removable belts fixed (no hardware axis).
const GUCCI_DIANA: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 16 x 10 cm; the compact bamboo-handle tote, a popular current size", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~27 x 24 x 11 cm; the reference Diana tote, most cross-shopped (cm approximate)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~35 x 30 x 15 cm; the classic tote proportion (closest to Princess Diana's) (cm approximate)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~40 cm; the roomiest carryall, less common (cm approximate)", sort_order: 4 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "smooth calfskin; the everyday bamboo-handle Diana, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", note: "beige/ebony coated GG Supreme canvas with leather trim; the logo Diana", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body (the 1991 original debuted in beige suede); recurring runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "lizard / python / print + special editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Diana (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];

// Valentino Rockstud (674), archivist-sourced 2026-07-13 — size × material × colour × stud-tone hardware.
// Mostly descriptor colours + two named signatures (Rosso Valentino, Poudre). Spike/Lock/Loco = separate models.
const VALENTINO_ROCKSTUD: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~26 x 21 x 10 cm; the Small Shopper Tote / small crossbody, the entry size", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~33 x 25 x 15 cm; the Medium Shopper Tote, the reference Rockstud", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~51 x 28 x 15 cm; the Large Shopper Tote (often exotic), roomiest, less common (cm from an older guide)", sort_order: 3 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", is_default: true, note: "smooth calfskin; the everyday Rockstud, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", note: "grained/pebbled calfskin, sturdier, holds shape", sort_order: 2 },
  { axis: "material", value: "Denim", permanence: "seasonal", note: "denim-body Rockstud shopper (a recurring seasonal run)", sort_order: 3 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / crocodile; the large shopper's signature exotic runs", sort_order: 4 },
  { axis: "material", value: "Embellished", permanence: "seasonal", note: "crystal-covered / 'Pop' printed / Memetic editions, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Platino (pale gold)", permanence: "permanent", is_default: true, note: "the signature light/pale-gold pyramid studs; near-universal", sort_order: 1 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark gunmetal studs; the edgier finish", sort_order: 2 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "rose-gold studs; intermittent", sort_order: 3 },
  { axis: "hardware", value: "Tonal", permanence: "seasonal", note: "matte tone-on-tone studs matching the leather (the all-black look); recurring", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Nero; the anchor (descriptor)", sort_order: 1 },
  { axis: "color", value: "Poudre", permanence: "permanent", note: "Valentino's signature powder-pink nude; a genuine house name", sort_order: 2 },
  { axis: "color", value: "Rosso Valentino", permanence: "permanent", note: "the house red; a genuine Valentino colour name", sort_order: 3 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral; descriptor", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. ivory; descriptor", sort_order: 5 },
];

// YSL Kate (462), archivist-sourced 2026-07-13 — size × material × colour × hardware-tone (like the Loulou).
// YSL names permanents as plain descriptors; the Cassandre tone (gold/silver) is the naming axis. Tassel = trim, not a size.
const YSL_KATE: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~17 x 11.5 cm; the Kate Mini/Nano on a chain, the evening/entry size", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~20 x 12.5 x 5 cm; the everyday reference Kate, most liquid on resale", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~24 x 14.5 x 5 cm; the roomier shoulder Kate (cm approximate)", sort_order: 3 },
  { axis: "material", value: "Grain de Poudre", permanence: "permanent", is_default: true, note: "the pebbled/embossed grain-de-poudre calfskin; the classic Kate leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth calfskin; the polished Kate", sort_order: 2 },
  { axis: "material", value: "Matelasse", permanence: "permanent", note: "chevron/quilted matelassé lambskin (the Kate Chain quilted version)", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body (incl. the fringe/tassel suede Kates), recurring runs", sort_order: 4 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed or exotic editions, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone Cassandre; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone Cassandre; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Aged / Brushed", permanence: "seasonal", note: "aged or brushed-tone Cassandre on some seasonal Kates", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the definitive Kate colour, the anchor (plain descriptor)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];

// Bottega Jodie (210), archivist-sourced 2026-07-13 — colour-primary, BV NAMES colours. Knotted Intrecciato hobo.
const BV_JODIE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", is_default: true, note: "~28 x 23 x 8 cm; the cult knotted Intrecciato hobo, the most liquid Jodie (default vs Small is soft)", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~36 x 21 x 13 cm; formerly 'Teen Jodie' (BV renamed the run), the mid shoulder size", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger everyday hobo (cm not cleanly pinned this run)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the original oversized knotted hobo (Lee's 2020 launch proportion), less common now (cm not sourced)", sort_order: 4 },
  { axis: "material", value: "Intrecciato", permanence: "permanent", is_default: true, note: "the signature woven nappa/lambskin Intrecciato; the base Jodie weave", sort_order: 1 },
  { axis: "material", value: "Padded Intrecciato", permanence: "permanent", note: "the puffy padded weave; a signature Jodie finish", sort_order: 2 },
  { axis: "material", value: "Nappa", permanence: "permanent", note: "smooth nappa (non-woven) Jodie", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede / other seasonal finishes", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "lizard / crocodile / metallic special editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; Nero, the easiest Jodie to source", sort_order: 1 },
  { axis: "color", value: "Parakeet", permanence: "seasonal", note: "BV's signature acid-green house colour (OFFICIAL, Daniel Lee 2021); recurs but rotates", sort_order: 2 },
  { axis: "color", value: "Fondant", permanence: "seasonal", note: "deep warm chocolate; house-confirmed/reseller-attributed BV name (MEDIUM)", sort_order: 3 },
  { axis: "color", value: "Barolo", permanence: "seasonal", note: "deep burgundy; reseller-attributed BV name (MEDIUM)", sort_order: 4 },
  { axis: "color", value: "Travertine", permanence: "seasonal", note: "light olive-beige; house-confirmed BV name (MEDIUM)", sort_order: 5 },
  { axis: "color", value: "Porridge", permanence: "seasonal", note: "ivory-beige neutral; reseller-attributed BV name (MEDIUM)", sort_order: 6 },
];

// Loewe Puzzle (504), archivist-sourced 2026-07-13 — size × material × colour. Anderson's 2015 origami box.
// Loewe = MIDDLE naming case (publishes seasonal names but mostly descriptively). NO hardware axis.
const LOEWE_PUZZLE: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~12.5 x 8.5 x 5.4 cm; the micro Puzzle, evening/charm scale", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 13 x 8 cm; the compact crossbody Puzzle", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~24 x 16 x 10.5 cm; the reference everyday Puzzle, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28-29 x 19 x 14 cm; the roomier Puzzle", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the largest Puzzle, less common (cm not cleanly pinned this run)", sort_order: 5 },
  { axis: "material", value: "Classic Calfskin", permanence: "permanent", is_default: true, note: "smooth classic calfskin; the original folds-flat Puzzle, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained calfskin, sturdier", sort_order: 2 },
  { axis: "material", value: "Soft Grained", permanence: "permanent", note: "soft-grain calfskin (the lighter, slouchier Puzzle)", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede / satin-calf / metallic seasonal runs", sort_order: 4 },
  { axis: "material", value: "Anagram / Jacquard", permanence: "seasonal", note: "embossed-Anagram or repeat-Anagram jacquard-canvas Puzzles", sort_order: 5 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "lizard / python / croc-embossed editions, per-listing", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor (Loewe names it descriptively 'Black')", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "the natural/tan Puzzle, a standing neutral (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. 'Soft White' (Loewe's house-named soft off-white); descriptor-leaning", sort_order: 3 },
  { axis: "color", value: "Green", permanence: "permanent", note: "the recurring Loewe green (e.g. 'Emerald Green' SS24); descriptive house name (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Burgundy", permanence: "permanent", note: "the recurring oxblood/burgundy (e.g. 'Dark Burgundy' SS24); descriptive house name (permanence soft)", sort_order: 5 },
];

// Gucci Bamboo 1947 (449), archivist-sourced 2026-07-13 — size × material × colour, DESCRIPTOR colours.
// Bamboo handle + piston lock fixed (no hardware axis).
const GUCCI_BAMBOO_1947: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "seasonal", note: "~12 x 10 x 5.5 cm; the micro evening bamboo-handle, recent addition", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~17 x 12 x 7.6 cm; the popular compact top-handle", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~21 x 15 x 7 cm; the reference Bamboo 1947, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger top-handle/tote proportion, less common (cm not cleanly pinned this run)", sort_order: 4 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "smooth calfskin; the everyday bamboo-handle 1947, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body; recurring seasonal runs", sort_order: 2 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "lizard / python / ostrich + print special editions, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/beige neutral family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "the tobacco/chocolate brown family; descriptor (permanence soft)", sort_order: 5 },
];

// Balenciaga City (568), archivist-sourced 2026-07-13 — size × material × colour × moto hardware. FINDING:
// Balenciaga NAMES its colours richly (Bottega camp) — Black/White/Anthracite every season, the rest named-by-year per-listing.
const BALENCIAGA_CITY: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~18.5 x 12 x 7 cm; the smallest City, worn as a mini crossbody", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~24 x 16 x 9 cm; the popular compact City", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", note: "the Small/'Classic City S'; the mid everyday size", sort_order: 3 },
  { axis: "size", value: "City", permanence: "permanent", is_default: true, note: "~38 x 25 x 13 cm; the original/Classic City, the reference moto bag", sort_order: 4 },
  { axis: "size", value: "Work", permanence: "seasonal", note: "the oversized 'Work' City (XL tote), less common", sort_order: 5 },
  { axis: "material", value: "Lambskin", permanence: "permanent", is_default: true, note: "the signature 'Arena' distressed lambskin; the classic soft moto leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Goatskin / Chevre", permanence: "permanent", note: "grained goatskin; the sturdier, more-textured City leather", sort_order: 2 },
  { axis: "material", value: "Grained Calf", permanence: "seasonal", note: "grained calfskin seasonal runs", sort_order: 3 },
  { axis: "hardware", value: "Silver", permanence: "permanent", is_default: true, note: "the aged silver-tone moto studs + buckles (Regular Hardware); the signature", sort_order: 1 },
  { axis: "hardware", value: "Gold", permanence: "permanent", note: "gold-tone moto hardware; a co-standard finish", sort_order: 2 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "rose-gold moto hardware; seasonal", sort_order: 3 },
  { axis: "hardware", value: "Giant", permanence: "seasonal", note: "the oversized 'Giant' studs/buckles (vs 'Regular'); a real stud-size choice, in any tone", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor, produced every season", sort_order: 1 },
  { axis: "color", value: "White", permanence: "permanent", note: "produced every season (Balenciaga names it)", sort_order: 2 },
  { axis: "color", value: "Anthracite", permanence: "permanent", note: "the near-black charcoal grey; a Balenciaga house name, produced every season", sort_order: 3 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey family (e.g. 'Gris'); named seasonally (permanence soft)", sort_order: 4 },
];

// Givenchy Antigona (585), archivist-sourced 2026-07-13 — size × material × colour, DESCRIPTOR colours
// (DEFAULTED, unsourced naming). Structured winged trapezoid satchel. NO hardware axis.
const GIVENCHY_ANTIGONA: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "the micro Antigona (mini crossbody/charm scale), recent addition (cm not cleanly pinned)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~22-26 x 19-20 x 13 cm; the compact crossbody Antigona", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~28 x 24 x 14 cm; the reference Antigona, most cross-shopped (Small/Mini labels overlap)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~33 x 28 x 19 cm; the classic roomy satchel proportion", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the oversized/'Shopper' Antigona, less common now (cm not cleanly pinned)", sort_order: 5 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", is_default: true, note: "grained/pebbled calfskin; the classic structured Antigona, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth calfskin; the polished Antigona", sort_order: 2 },
  { axis: "material", value: "Croc-Embossed", permanence: "seasonal", note: "croc-embossed calfskin; a recurring textured run", sort_order: 3 },
  { axis: "material", value: "Soft", permanence: "seasonal", note: "the 'Antigona Soft' (the slouchier unstructured version); a distinct recurring line", sort_order: 4 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "python / print / embellished special editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor (Givenchy naming defaulted, not sourced this run)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral; descriptor (defaulted)", sort_order: 2 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey family; descriptor (defaulted)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red family; descriptor (defaulted); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor (defaulted)", sort_order: 5 },
];

// Gucci Ophidia (448), archivist-sourced 2026-07-13 — size × material × colour, descriptors. GG Supreme
// Web-stripe signature. Double-G pin + Web stripe fixed (no hardware axis).
const GUCCI_OPHIDIA: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "seasonal", note: "~17 x 12 x 6 cm; the micro GG shoulder/belt-bag scale, recent (cm approximate)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 15 x 8 cm; the popular dome GG mini shoulder/chain bag", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~23.5 x 19 x 8 cm (gucci.com); the reference Ophidia, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~30 cm; the larger shoulder/tote + Boston barrel run here (cm not cleanly pinned)", sort_order: 4 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with the green-red-green Web stripe; the signature Ophidia", sort_order: 1 },
  { axis: "material", value: "Leather", permanence: "permanent", note: "smooth/pebbled calfskin; the all-leather Ophidia, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "python / GG print + collab editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
];

// Celine Triomphe (206), archivist-sourced 2026-07-13 — model/material-primary, DESCRIPTOR colours (Celine
// doesn't name; signature is Tan). Triomphe clasp fixed. Besace = separate model.
const CELINE_TRIOMPHE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~8 x 11 cm face; the tiny chain/crossbody Triomphe, the evening/entry size", sort_order: 1 },
  { axis: "size", value: "Teen", permanence: "permanent", is_default: true, note: "18.5 x 13.5 x 7 cm (celine.com); the smallest box size, the most popular/most liquid", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", note: "the mid box Triomphe, between Teen and Medium (cm not cleanly pinned)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~16.5 x 22.5 cm face; the roomier box Triomphe", sort_order: 4 },
  { axis: "size", value: "Triomphe Shoulder", permanence: "permanent", note: "the elongated soft Shoulder Triomphe (a distinct format on the same clasp)", sort_order: 5 },
  { axis: "material", value: "Shiny Calfskin", permanence: "permanent", is_default: true, note: "smooth 'shiny'/polished calfskin; the classic box Triomphe leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Triomphe Canvas", permanence: "permanent", note: "the coated-canvas Triomphe-link monogram (revived 1972 motif), trimmed in calfskin; a co-signature surface", sort_order: 2 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained 'Drummed' calfskin; sturdier", sort_order: 3 },
  { axis: "material", value: "Textile / Denim", permanence: "seasonal", note: "textile, denim, or seasonal fabric bodies, per-listing", sort_order: 4 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed calfskin or exotic editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; plain descriptor (Celine does not name its colours)", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "Celine's signature Tan/Camel neutral; descriptor, esp. on Triomphe Canvas trim", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. Natural/off-white; descriptor", sort_order: 3 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "the recurring tan-brown/tobacco family; descriptor (permanence soft)", sort_order: 4 },
];

// Celine Luggage Tote (484), archivist-sourced 2026-07-13 — Philo 2010 winged tote, DESCRIPTOR colours.
// WHOLE LINE DISCONTINUED MARCH 2025 (heritage resale icon). Size names counter-intuitive: Nano < Micro < Mini.
const CELINE_LUGGAGE: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~20 x 20 x 10 cm; the smallest winged Luggage, crossbody-scale; line discontinued March 2025", sort_order: 1 },
  { axis: "size", value: "Micro", permanence: "permanent", is_default: true, note: "~26 x 26 x 15 cm; the most cross-shopped/most liquid Luggage size (default vs Nano is soft)", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~30 x 30 x 17 cm; counter-intuitively the BIGGEST of the three core sizes", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger/original Luggage proportion, less common (cm not cleanly pinned)", sort_order: 4 },
  { axis: "size", value: "Phantom", permanence: "permanent", note: "the open-top winged sister (no zip 'face'); a distinct format on the winged silhouette", sort_order: 5 },
  { axis: "material", value: "Smooth Calfskin", permanence: "permanent", is_default: true, note: "smooth/polished calfskin; the classic colour-bearing Luggage surface", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained 'Drummed' calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Suede / Nubuck", permanence: "seasonal", note: "suede or nubuck bodies + suede-wing contrast runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Felt / Textile", permanence: "seasonal", note: "felt, wool, or textile-body seasonal editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / croc / lizard limited runs, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; plain descriptor (Celine does not name its colours)", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "Celine's signature Tan/Camel neutral; descriptor", sort_order: 2 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey/anthracite neutral; descriptor", sort_order: 3 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "incl. Natural/Dune/off-white; descriptor", sort_order: 4 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red/bright family (bi-colour 'smile' wings common); descriptor (permanence soft)", sort_order: 5 },
];

// Coach Tabby (946), archivist-sourced 2026-07-13 — size × material × colour, DESCRIPTOR by product-page
// convention (Coach not yet a banked archive house). Signature C turnlock fixed. Pillow Tabby = material finish.
const COACH_TABBY: Row[] = [
  // size values match the DB variant size_labels (bare numbers) so the colour/material splitters bind
  { axis: "size", value: "12", permanence: "permanent", note: "the micro Tabby 12 (SLG/charm scale), recent (cm not sourced this run)", sort_order: 1 },
  { axis: "size", value: "20", permanence: "permanent", note: "Tabby 20: 18 x 14 x 8.5 cm; the compact top-handle/crossbody, removable strap", sort_order: 2 },
  { axis: "size", value: "26", permanence: "permanent", is_default: true, note: "Tabby 26: 26 x 15 x 7.5 cm; the reference Tabby, most cross-shopped, two detachable straps", sort_order: 3 },
  { axis: "size", value: "Crossbody", permanence: "seasonal", note: "Tabby Crossbody: 19 x 10 x 5 cm; the small chain crossbody/clutch format", sort_order: 4 },
  { axis: "material", value: "Polished Pebble Leather", permanence: "permanent", is_default: true, note: "the standard refined pebble leather (Coach's glovetanned heritage); the colour-bearing Tabby surface", sort_order: 1 },
  { axis: "material", value: "Pillow (soft leather)", permanence: "permanent", note: "the 'Pillow Tabby' plush ultra-soft leather with wrapped Signature C hardware; the TikTok-cult finish (sizes 18/26)", sort_order: 2 },
  { axis: "material", value: "Signature C Canvas", permanence: "permanent", note: "the coated Signature/monogram-print canvas with leather trim; the logo Tabby", sort_order: 3 },
  { axis: "material", value: "Quilted", permanence: "seasonal", note: "quilted (incl. quilted Pillow Tabby) seasonal runs", sort_order: 4 },
  { axis: "material", value: "Exotic / Denim / Embellished", permanence: "seasonal", note: "snakeskin-embossed / denim / sequined / print editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor (Coach product-page convention)", sort_order: 1 },
  { axis: "color", value: "Chalk", permanence: "permanent", note: "Coach's off-white/cream neutral (a standing Coach descriptor name)", sort_order: 2 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "tan/saddle/brown family (incl. Signature canvas browns); descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Coach red/wine family; descriptor (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring blush/pink Tabby; descriptor (permanence soft)", sort_order: 5 },
];

// Gucci Soho Disco (450), archivist-sourced 2026-07-13 — one-core-size × material × colour, descriptors.
// Frida Giannini 2012 round crossbody; DISCONTINUED/heritage. Interlocking-G tassel fixed.
const GUCCI_SOHO_DISCO: Row[] = [
  { axis: "size", value: "Disco", permanence: "permanent", is_default: true, note: "~21 x 15 x 7 cm; the one core round crossbody size; DISCONTINUED/heritage (cm vary 19-21 by listing)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "seasonal", note: "the smaller Mini Disco / chain version, less common (cm not sourced)", sort_order: 2 },
  { axis: "material", value: "Pebbled Leather", permanence: "permanent", is_default: true, note: "the signature soft grained/pebbled calfskin with the embossed interlocking-G; the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "seasonal", note: "beige/ebony coated GG Supreme canvas Disco; the logo version, less common than leather", sort_order: 2 },
  { axis: "material", value: "Guccissima / Metallic", permanence: "seasonal", note: "embossed Guccissima leather or metallic/patent seasonal runs, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/rose-beige family; descriptor", sort_order: 2 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the Gucci red (descriptor); a recurring Disco staple (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring soft-pink/fuchsia Disco; descriptor (permanence soft)", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 5 },
];

// YSL Sac de Jour (461), archivist-sourced 2026-07-13 — size × material × colour × hardware-tone (like Kate).
// Slimane 2013 structured top-handle; padlock hardware makes the gold/silver tone a real axis. BB = Baby.
const YSL_SAC_DE_JOUR: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~22 x 18 x 10.5 cm; the mini top-handle, worn crossbody, the evening/entry size", sort_order: 1 },
  { axis: "size", value: "Baby", permanence: "permanent", note: "~26 x 20.5 cm face; the compact everyday size (resellers also label it 'BB'), co-most-popular", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~32 x 26 x 14 cm; the reference Sac de Jour, most liquid (default vs Baby is soft)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the roomier work tote proportion (cm not cleanly pinned)", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the largest travel/work Sac de Jour, less common now (cm not sourced)", sort_order: 5 },
  { axis: "material", value: "Grained Leather", permanence: "permanent", is_default: true, note: "grained/grain-de-poudre embossed calfskin; the classic structured Sac de Jour, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth polished calfskin; the softer, more delicate Sac de Jour", sort_order: 2 },
  { axis: "material", value: "Croc-Embossed", permanence: "permanent", note: "crocodile-embossed (not exotic) calfskin; a recurring textured finish", sort_order: 3 },
  { axis: "material", value: "Suede / Canvas", permanence: "seasonal", note: "suede or canvas/monogram-panel seasonal runs, per-listing", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / python / lizard limited runs, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone hardware (padlock + fittings); the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone hardware; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Aged / Brushed", permanence: "seasonal", note: "aged or brushed-tone hardware on some seasonal Sac de Jours", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor (plain descriptor)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge (incl. 'Rouge Merlot'); a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];

// Prada Re-Edition 2005 (202), archivist-sourced 2026-07-13 — material/archive-year-primary, DESCRIPTOR colours.
// Re-Nylon signature; one core size (2000/1995 are sibling archive-year models). Triangle plaque fixed.
const PRADA_RE_EDITION_2005: Row[] = [
  // size values match the DB variant size_labels so the colour/material splitters bind (the bag is
  // essentially one size; "Standard" is the DB label for the core Re-Edition 2005 body)
  { axis: "size", value: "Standard", permanence: "permanent", is_default: true, note: "22 x 18 x 6 cm (prada.com); the one core Y2K nylon shoulder bag, woven strap + removable chain + zip pouch", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "seasonal", note: "the smaller mini/'micro' Re-Edition when produced, less common (cm not sourced)", sort_order: 2 },
  { axis: "material", value: "Re-Nylon", permanence: "permanent", is_default: true, note: "recycled regenerated ECONYL nylon; Prada's signature Re-Nylon (2019 relaunch), the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Re-Nylon + Leather Trim", permanence: "permanent", note: "Re-Nylon with Saffiano-leather trim/strap (the leather strap distinguishes the 2005 from the fabric-strap 2000)", sort_order: 2 },
  { axis: "material", value: "Leather", permanence: "seasonal", note: "all-leather (Saffiano/nappa) Re-Edition runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Raffia / Crochet", permanence: "seasonal", note: "woven raffia or crochet summer editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Satin / Sequin / Embellished", permanence: "seasonal", note: "satin, sequined, crystal editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor (Nero); descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the nude/'Cammeo' beige neutral; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. 'Talco'/chalk white; descriptor", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring pink ('Rosa'); a Re-Edition signature bright (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Blue", permanence: "permanent", note: "the recurring cornflower/cerulean blue; a Re-Edition signature bright (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];

// YSL Lou Camera (464), archivist-sourced 2026-07-13 — camera bag, size × material × colour × hardware-tone.
const YSL_LOU_CAMERA: Row[] = [
  { axis: "size", value: "Baby", permanence: "seasonal", note: "~12 x 8.5 x 4 cm; the micro Lou, evening/charm scale", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 11 cm face; the compact crossbody Lou", sort_order: 2 },
  { axis: "size", value: "Lou", permanence: "permanent", is_default: true, note: "23 x 16 x 6 cm (ysl.com); the reference camera bag, also sold as 'Medium Lou', most cross-shopped", sort_order: 3 },
  { axis: "material", value: "Matelasse Quilted", permanence: "permanent", is_default: true, note: "the signature matelassé quilted calfskin/lambskin; the classic Lou surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth/plain calfskin, unquilted; the polished Lou, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "croc-embossed / metallic / studded / raffia editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone metallic YSL Cassandre; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone Cassandre; equally standard", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor (plain descriptor)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];

// Saint Laurent Le 5 à 7 (467) — YSL model (DB already correctly attributes it to brand 398). Archivist-sourced
// 2026-07-13. Clean evening hobo; DESCRIPTOR colours + hardware-tone axis. NOT Celine (Triomphe Canvas/'Teen' excluded).
const YSL_LE_5_A_7: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "19 x 11.5 x 4.5 cm (ysl.com); the small structured evening Le 5 à 7", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~23 x 21.5 x 9 cm (Fashionphile 'regular'); the reference hobo, most cross-shopped", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger hobo proportion (resellers also call it 'Large'; full cm not cleanly pinned)", sort_order: 3 },
  { axis: "material", value: "Smooth Structured Calf", permanence: "permanent", is_default: true, note: "smooth structured calfskin; the classic Le 5 à 7, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Supple Calf", permanence: "permanent", note: "the softer 'supple' Le 5 à 7 hobo (an unstructured version)", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed calfskin or exotic editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone hardware + Cassandre; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone hardware; equally standard", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor and the bag's signature ('the perfect little black bag'); plain descriptor", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
];

// LV Pochette Accessoires (690), archivist-sourced 2026-07-13 — LV canvas-primary (Monogram default); colour only
// on Empreinte. Current standard ships with a removable chain. NO construction/hardware axis.
const LV_POCHETTE_ACCESSOIRES: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~15.5 x 10.5 x 4 cm (louisvuitton.com M58009); the Mini Pochette, the cult small pouch/crossbody", sort_order: 1 },
  { axis: "size", value: "Pochette Accessoires", permanence: "permanent", is_default: true, note: "~23.5 x 13.5 x 4 cm (louisvuitton.com M82766); the standard flat zip pouch-bag; current model ships with a removable chain", sort_order: 2 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the default line", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 5 },
  { axis: "material", value: "Seasonal Print / Vernis", permanence: "seasonal", note: "seasonal Monogram-print capsules, Vernis patent, per-listing", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice", sort_order: 1 },
];

// Balenciaga Hourglass (567), archivist-sourced 2026-07-13 — size × material × colour × hardware. Balenciaga NAMES
// colours (Black/White/Beige permanent + named seasonals per-listing).
const BALENCIAGA_HOURGLASS: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "the tiniest Hourglass (charm/mini top-handle), recent (cm not cleanly sourced)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~12.7 x 9 x 5 cm; the mini top-handle with crossbody strap", sort_order: 2 },
  { axis: "size", value: "XS", permanence: "permanent", is_default: true, note: "~19 x 12 x 7.5 cm; the reference/most-iconic Hourglass top-handle (default vs Small is soft)", sort_order: 3 },
  { axis: "size", value: "Small", permanence: "permanent", note: "the mid Hourglass, between XS and Medium (cm not cleanly pinned)", sort_order: 4 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28 x 18 x 9 cm; the roomier top-handle/shoulder proportion", sort_order: 5 },
  { axis: "material", value: "Shiny Box Calf", permanence: "permanent", is_default: true, note: "the signature shiny box/smooth calfskin; the classic structured Hourglass, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", note: "grained/pebbled calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Croc-Embossed", permanence: "permanent", note: "crocodile-embossed shiny calfskin; a recurring textured Hourglass", sort_order: 3 },
  { axis: "material", value: "Crocodile / Exotic", permanence: "seasonal", note: "genuine crocodile / lizard / rhinestone / denim / Hacker-Project editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone B buckle; the classic (the B-clasp tone often tracks the colorway)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/aged-silver B buckle; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Tonal", permanence: "seasonal", note: "colour-matched/tonal B buckle on some seasonal colorways", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "produced every season (Balenciaga names it); the anchor", sort_order: 1 },
  { axis: "color", value: "White", permanence: "permanent", note: "produced every season (Balenciaga names it)", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the recurring beige/sand neutral (a Balenciaga house name); near-permanent (permanence soft)", sort_order: 3 },
];

// YSL Niki (463), archivist-sourced 2026-07-13 — crinkled-leather quilted chain hobo, size × material × colour × hardware-tone.
const YSL_NIKI: Row[] = [
  { axis: "size", value: "Baby", permanence: "permanent", is_default: true, note: "~21 x 16 x 7.5 cm; the compact everyday Niki, most cross-shopped (resellers also label it 'Small')", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28 x 20 x 8.5 cm; the mid hobo, the roomier everyday size", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~32 x 23 x 9 cm; the biggest Niki, the true shoulder carryall", sort_order: 3 },
  { axis: "material", value: "Crinkled Washed Lambskin", permanence: "permanent", is_default: true, note: "the signature crinkled/washed vintage-effect quilted lambskin; the classic Niki, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Leather", permanence: "permanent", note: "smooth/plain quilted calfskin; the cleaner Niki variant", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "croc-embossed / metallic / denim / studded editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone worn/aged-effect Cassandre; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone worn-effect Cassandre; equally standard", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor (plain descriptor)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];

// LV Multi Pochette Accessoires (444), archivist-sourced 2026-07-13 — the 2019 three-piece; canvas-primary but the
// STRAP colour is the signature variant. One core size. NO hardware/construction axis.
const LV_MULTI_POCHETTE_ACCESSOIRES: Row[] = [
  { axis: "size", value: "One size", permanence: "permanent", is_default: true, note: "the 2019 three-piece set: large Pochette (~21 cm) + round coin purse + card holder on one removable strap", sort_order: 1 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the default line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing leather line", sort_order: 2 },
  { axis: "material", value: "Bicolor / Reverse", permanence: "seasonal", note: "bicolour Empreinte or Monogram Reverse canvas seasonal runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Seasonal Print", permanence: "seasonal", note: "seasonal Monogram-print / By-the-Pool / capsule editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the classic all-black strap + Empreinte 'Noir'; the anchor (the strap is the variant)", sort_order: 1 },
  { axis: "color", value: "Rose Clair", permanence: "permanent", note: "the pale-pink strap — the iconic 2019 launch look; the signature bright strap (permanence soft)", sort_order: 2 },
  { axis: "color", value: "Khaki", permanence: "permanent", note: "the khaki-green strap/round-purse — the other half of the launch bicolour signature (permanence soft)", sort_order: 3 },
];

// Dior 30 Montaigne (455), archivist-sourced 2026-07-13 — CD-clasp flap, colour-primary + size + material. Dior NAMES
// colours. Antique-gold CD clasp fixed (no hardware axis).
const DIOR_30_MONTAIGNE: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~15 x 10 x 3 cm (Fashionphile); the SLG-scale mini flap/crossbody", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "the compact flap between Micro and Small (cm not cleanly pinned)", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~21 cm base x 17 tall (saclab); the reference 30 Montaigne flap, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "East-West", permanence: "permanent", note: "the elongated horizontal flap (a distinct format on the same CD clasp); a newer resale-popular shape", sort_order: 4 },
  { axis: "size", value: "Avenue", permanence: "seasonal", note: "the '30 Montaigne Avenue' chain flap (a distinct format with a chain + CD clasp); newer, per-listing", sort_order: 5 },
  { axis: "material", value: "Box Calf", permanence: "permanent", is_default: true, note: "smooth box calfskin; the classic structured 30 Montaigne, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", note: "grained/pebbled calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Oblique Jacquard", permanence: "permanent", note: "the diagonal 'Dior' Oblique jacquard canvas (Bohan 1967 motif), trimmed in calfskin; the logo 30 Montaigne", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "alligator / ombré / Toile de Jouy / embroidered editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black box calf + antique-gold CD = the reference 30 Montaigne", sort_order: 1 },
  { axis: "color", value: "Latte", permanence: "permanent", note: "Dior's signature warm beige/nude, a standing 30 Montaigne neutral (Dior names it)", sort_order: 2 },
  { axis: "color", value: "Blue", permanence: "permanent", note: "deep/sky blue; a recurring house colour (Dior names it); near-permanent (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Dior's recurring red; near-permanent (permanence soft)", sort_order: 4 },
];

const STYLES: { styleId: number; name: string; rows: Row[] }[] = [
  { styleId: 1, name: "Classic Flap", rows: CLASSIC_FLAP },
  { styleId: 424, name: "Boy", rows: BOY },
  { styleId: 423, name: "2.55 Reissue", rows: REISSUE },
  { styleId: 433, name: "Speedy", rows: LV_SPEEDY },
  { styleId: 218, name: "Neverfull", rows: LV_NEVERFULL },
  { styleId: 434, name: "Alma", rows: LV_ALMA },
  { styleId: 4, name: "Birkin", rows: BIRKIN },
  { styleId: 437, name: "OnTheGo", rows: LV_ONTHEGO },
  { styleId: 208, name: "Lady Dior", rows: LADY_DIOR },
  { styleId: 559, name: "Saint Louis", rows: GOYARD_SAINT_LOUIS },
  { styleId: 200, name: "GG Marmont", rows: GG_MARMONT },
  { styleId: 211, name: "Cassette", rows: BV_CASSETTE },
  { styleId: 446, name: "Jackie 1961", rows: GUCCI_JACKIE },
  { styleId: 561, name: "Artois", rows: GOYARD_ARTOIS },
  { styleId: 438, name: "Pochette Métis", rows: LV_POCHETTE_METIS },
  { styleId: 5, name: "Kelly", rows: KELLY },
  { styleId: 427, name: "Wallet on Chain", rows: CHANEL_WOC },
  { styleId: 209, name: "Saddle", rows: DIOR_SADDLE },
  { styleId: 425, name: "Chanel 19", rows: CHANEL_19 },
  { styleId: 201, name: "Dionysus", rows: GUCCI_DIONYSUS },
  { styleId: 447, name: "Horsebit 1955", rows: GUCCI_HORSEBIT_1955 },
  { styleId: 454, name: "Book Tote", rows: DIOR_BOOK_TOTE },
  { styleId: 205, name: "Peekaboo", rows: FENDI_PEEKABOO },
  { styleId: 460, name: "Loulou", rows: YSL_LOULOU },
  { styleId: 204, name: "Baguette", rows: FENDI_BAGUETTE },
  { styleId: 431, name: "Chanel 22", rows: CHANEL_22 },
  { styleId: 451, name: "Diana", rows: GUCCI_DIANA },
  { styleId: 674, name: "Rockstud", rows: VALENTINO_ROCKSTUD },
  { styleId: 462, name: "Kate", rows: YSL_KATE },
  { styleId: 210, name: "Jodie", rows: BV_JODIE },
  { styleId: 504, name: "Puzzle", rows: LOEWE_PUZZLE },
  { styleId: 449, name: "Bamboo 1947", rows: GUCCI_BAMBOO_1947 },
  { styleId: 568, name: "City", rows: BALENCIAGA_CITY },
  { styleId: 585, name: "Antigona", rows: GIVENCHY_ANTIGONA },
  { styleId: 448, name: "Ophidia", rows: GUCCI_OPHIDIA },
  { styleId: 206, name: "Triomphe", rows: CELINE_TRIOMPHE },
  { styleId: 484, name: "Luggage Tote", rows: CELINE_LUGGAGE },
  { styleId: 946, name: "Tabby", rows: COACH_TABBY },
  { styleId: 450, name: "Soho Disco", rows: GUCCI_SOHO_DISCO },
  { styleId: 461, name: "Sac de Jour", rows: YSL_SAC_DE_JOUR },
  { styleId: 202, name: "Re-Edition 2005", rows: PRADA_RE_EDITION_2005 },
  { styleId: 464, name: "Lou Camera", rows: YSL_LOU_CAMERA },
  { styleId: 467, name: "Le 5 à 7", rows: YSL_LE_5_A_7 },
  { styleId: 690, name: "Pochette Accessoires", rows: LV_POCHETTE_ACCESSOIRES },
  { styleId: 567, name: "Hourglass", rows: BALENCIAGA_HOURGLASS },
  { styleId: 463, name: "Niki", rows: YSL_NIKI },
  { styleId: 444, name: "Multi Pochette Accessoires", rows: LV_MULTI_POCHETTE_ACCESSOIRES },
  { styleId: 455, name: "30 Montaigne", rows: DIOR_30_MONTAIGNE },
];

async function main() {
  console.log(`\nload-production-options ${WRITE ? "(WRITE)" : "(DRY RUN)"}\n`);
  // Guard: table must exist (migration 0054 applied).
  const probe = await db.from("production_option").select("id").limit(1);
  if (probe.error) {
    console.error(`  ABORT: production_option not reachable — apply migration 0054 first. (${probe.error.message})`);
    process.exit(1);
  }
  for (const s of STYLES) {
    console.log(`  ${s.name} (style ${s.styleId}): ${s.rows.length} options`);
    const byAxis = s.rows.reduce<Record<string, number>>((a, r) => ((a[r.axis] = (a[r.axis] || 0) + 1), a), {});
    console.log(`     ${JSON.stringify(byAxis)}`);
    if (!WRITE) continue;
    const { error: delErr } = await db.from("production_option").delete().eq("style_id", s.styleId);
    if (delErr) { console.error(`     delete failed: ${delErr.message}`); continue; }
    const payload = s.rows.map((r) => ({
      style_id: s.styleId,
      axis: r.axis,
      value: r.value,
      permanence: r.permanence ?? null,
      season_code: r.season_code ?? null,
      is_default: r.is_default ?? false,
      note: r.note ?? null,
      source: SRC,
      sort_order: r.sort_order,
    }));
    const { error: insErr } = await db.from("production_option").insert(payload);
    if (insErr) { console.error(`     insert failed: ${insErr.message}`); continue; }
    console.log(`     inserted ${payload.length}`);
  }
  console.log(WRITE ? "\ndone." : "\ndry run — re-run with --write after migration 0054 is applied.");
}
main().then(() => process.exit(0)).catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
