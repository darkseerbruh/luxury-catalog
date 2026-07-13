/**
 * The Care Shelf — the product registry behind /care and the bag-page CareModule.
 *
 * Positioning: this is the OWN state. The rest of the site serves want (coveted),
 * buy (shop / where-to-buy), and sell (where-to-sell); the care shelf is the first
 * surface for the bag you already have. It is a curated, hedged shelf, not a
 * verdict:
 *
 *  - No prices, no held ASINs. Every product links to an Amazon SEARCH
 *    (amazonCareSearchUrl in affiliate.ts), so the live page shows Amazon's real
 *    current price and stock and we never publish a figure that goes stale.
 *  - `lookFor` names well-known category brands as EXAMPLES of what to look at,
 *    framed as an informed opinion ("my take"), never "the best" or "you should".
 *  - `watchOut` is the safety hedge. Leather care can damage the wrong finish, so
 *    anything that touches the bag carries "test on a hidden spot first" or the
 *    finish-specific caution. We equip, we don't guarantee.
 *
 * Materials link the shelf to a bag: CARE_MATERIALS maps a catalog exterior
 * material to the shelf items that matter for it, so the bag page can show the
 * right two or three instead of the whole shelf. Pure data + helpers, no IO.
 */

export type CareGroupKey =
  | "shape-store"
  | "clean-condition"
  | "hardware"
  | "display-use"
  | "travel";

/** A care-need family a bag's material can map to (broad, not brand-specific). */
export type CareMaterial =
  | "smooth-leather"
  | "grained-leather"
  | "patent"
  | "suede"
  | "canvas"
  | "exotic"
  | "hardware";

export interface CareGroup {
  key: CareGroupKey;
  /** A small non-logo glyph for the shelf (per the no-walls-of-text UX rule). */
  icon: string;
  title: string;
  /** One line on the job this group does. */
  blurb: string;
}

export interface CareItem {
  key: string;
  group: CareGroupKey;
  name: string;
  /** What the product does, plainly. */
  whatItDoes: string;
  /** Example brands to look at, framed as our take, never a verdict. */
  lookFor: string;
  /** The safety hedge. Empty only for items that never touch the bag surface. */
  watchOut: string;
  /** The Amazon search we deep-link (affiliate-tagged when the tag is set). */
  searchQuery: string;
  /** Material families this item is most relevant to (drives the bag module). */
  materials: CareMaterial[];
}

export const CARE_GROUPS: CareGroup[] = [
  {
    key: "shape-store",
    icon: "🧳",
    title: "Shape & store",
    blurb: "Keep the silhouette while it sits in the closet. This is where most damage starts.",
  },
  {
    key: "clean-condition",
    icon: "🧴",
    title: "Clean & condition",
    blurb: "Lift the everyday marks and keep the leather from drying out. Gentle and slow beats strong and fast.",
  },
  {
    key: "hardware",
    icon: "🔗",
    title: "Hardware",
    blurb: "Chains, clasps and feet take the wear you can see. A soft touch keeps plating on.",
  },
  {
    key: "display-use",
    icon: "🪝",
    title: "Display & daily use",
    blurb: "The small things that make a bag easier to live with, on the table and off.",
  },
  {
    key: "travel",
    icon: "✈️",
    title: "Travel",
    blurb: "Protect it in transit, when it is furthest from its shelf and closest to a scuff.",
  },
];

export const CARE_ITEMS: CareItem[] = [
  // Shape & store
  {
    key: "base-shaper",
    group: "shape-store",
    name: "Base shaper",
    whatItDoes: "A firm insert that stops the bottom from sagging under its own weight.",
    lookFor: "Cut-to-fit acrylic or felt shapers sized to your model. My take: felt is softer on the lining.",
    watchOut: "Size it to the bag. An oversized shaper pushes the base out of shape instead of holding it.",
    searchQuery: "purse base shaper insert",
    materials: ["smooth-leather", "grained-leather", "patent", "canvas"],
  },
  {
    key: "pillow-insert",
    group: "shape-store",
    name: "Pillow / bag shaper",
    whatItDoes: "A soft stuffed pillow that fills the body so it holds its shape in storage.",
    lookFor: "Model-shaped pillows for icons (Speedy, Neverfull, Birkin); a plain travel pillow works otherwise.",
    watchOut: "Don't overstuff. You want the shape supported, not the seams under tension.",
    searchQuery: "handbag shaper pillow insert",
    materials: ["smooth-leather", "grained-leather", "canvas"],
  },
  {
    key: "organizer-insert",
    group: "shape-store",
    name: "Organizer insert",
    whatItDoes: "A felt liner with pockets that organizes the inside and lifts out to swap bags in seconds.",
    lookFor: "Made-to-measure felt liners (Samorga-style) or a generic sized to your bag's interior.",
    watchOut: "A liner is not a shaper. It organizes; it won't hold a slouchy base on its own.",
    searchQuery: "felt purse organizer insert",
    materials: ["smooth-leather", "grained-leather", "patent", "canvas", "suede"],
  },
  {
    key: "dust-bag",
    group: "shape-store",
    name: "Breathable dust bag",
    whatItDoes: "A soft cotton bag that keeps dust and light off without trapping moisture.",
    lookFor: "Plain cotton or muslin in the right size. My take: breathable only, so it can air out.",
    watchOut: "Never store a leather bag in plastic. Trapped humidity is how mold and sticky coatings start.",
    searchQuery: "cotton dust bag for handbags breathable",
    materials: ["smooth-leather", "grained-leather", "patent", "suede", "canvas", "exotic"],
  },
  {
    key: "anti-humidity",
    group: "shape-store",
    name: "Anti-humidity packs",
    whatItDoes: "Silica or moisture-absorbing packs that keep the closet air dry around the bag.",
    lookFor: "Reusable, indicating silica packs you can dry out and use again.",
    watchOut: "Keep packs off the leather itself. They belong in the closet air, not touching the bag.",
    searchQuery: "reusable silica gel dehumidifier packs closet",
    materials: ["smooth-leather", "grained-leather", "exotic", "suede"],
  },
  // Clean & condition
  {
    key: "leather-cleaner",
    group: "clean-condition",
    name: "Leather cleaner",
    whatItDoes: "A mild cleaner that lifts everyday grime before it sets into the grain.",
    lookFor: "Gentle leather cleaners made for finished bags. Brands people trust: Apple Brand, Cadillac.",
    watchOut: "Test on a hidden spot first, and go light. Strong cleaners can strip color and finish.",
    searchQuery: "gentle leather cleaner for designer handbags",
    materials: ["smooth-leather", "grained-leather"],
  },
  {
    key: "leather-conditioner",
    group: "clean-condition",
    name: "Leather conditioner",
    whatItDoes: "Puts moisture back so the leather stays supple instead of drying and cracking.",
    lookFor: "A light conditioner or leather milk. Brands people trust: Chamberlain's Leather Milk, Apple Brand.",
    watchOut: "Test first, use sparingly, and never on suede or patent. Over-conditioning can darken smooth leather.",
    searchQuery: "leather conditioner cream handbag",
    materials: ["smooth-leather", "grained-leather"],
  },
  {
    key: "suede-kit",
    group: "clean-condition",
    name: "Suede & nubuck brush",
    whatItDoes: "A brush and eraser set that lifts scuffs and revives the nap on suede and nubuck.",
    lookFor: "A suede brush plus a suede eraser block. A protector spray made for suede pairs with it.",
    watchOut: "Never use leather conditioner or oil on suede. It flattens the nap and stains.",
    searchQuery: "suede brush and eraser cleaning kit",
    materials: ["suede"],
  },
  {
    key: "protectant-spray",
    group: "clean-condition",
    name: "Protectant spray",
    whatItDoes: "An invisible barrier that helps the bag shrug off water and light stains.",
    lookFor: "A spray matched to your material. Brands people trust: Apple Garde, Collonil Carbon Pro.",
    watchOut: "Match the spray to the finish and test first. The wrong protectant can haze or darken leather.",
    searchQuery: "leather and suede protector spray water repellent",
    materials: ["smooth-leather", "grained-leather", "suede", "canvas"],
  },
  {
    key: "patent-wipe",
    group: "clean-condition",
    name: "Patent care",
    whatItDoes: "Cleans the glossy coating and helps lift the color transfer patent picks up.",
    lookFor: "A cleaner made for patent, or a soft damp cloth. My take: keep it simple for patent.",
    watchOut: "No solvents, alcohol or conditioner on patent. They dull or crack the coating.",
    searchQuery: "patent leather cleaner handbag",
    materials: ["patent"],
  },
  // Hardware
  {
    key: "hardware-cloth",
    group: "hardware",
    name: "Hardware polishing cloth",
    whatItDoes: "A soft microfiber that buffs chains, clasps and logo plates without scratching.",
    lookFor: "Non-abrasive microfiber or a jeweler's polishing cloth. Gentle is the whole point.",
    watchOut: "Skip metal polishes and dips on plated hardware. They can strip the gold or ruthenium plating.",
    searchQuery: "jewelry polishing cloth microfiber non abrasive",
    materials: ["hardware"],
  },
  {
    key: "hardware-guard",
    group: "hardware",
    name: "Hardware protective film",
    whatItDoes: "A near-invisible film for feet, logo plates and clasps that takes the daily rub for them.",
    lookFor: "Pre-cut protective film sets made for popular models, or a clear sheet you trim.",
    watchOut: "Apply to clean, dry hardware. Trapped grit under the film scratches what you're protecting.",
    searchQuery: "handbag hardware protective film logo plate",
    materials: ["hardware"],
  },
  {
    key: "corner-guard",
    group: "hardware",
    name: "Corner & feet guards",
    whatItDoes: "Small guards for the corners and base feet, the first places a bag wears through.",
    lookFor: "Model-fit corner protectors, or clear film for the feet.",
    watchOut: "Test the adhesive on a hidden spot. Some residues mark light leather when removed.",
    searchQuery: "purse corner protector guard",
    materials: ["smooth-leather", "grained-leather", "canvas"],
  },
  // Display & daily use
  {
    key: "bag-hook",
    group: "display-use",
    name: "Folding bag hook",
    whatItDoes: "A little folding hook that hangs your bag off the table edge, off the floor.",
    lookFor: "A weighted folding purse hook that holds a heavier bag. The one you actually carry.",
    watchOut: "Check the weight it holds. A light hook can tip under a chain bag with hardware.",
    searchQuery: "folding purse hook for table",
    materials: [],
  },
  {
    key: "display-stand",
    group: "display-use",
    name: "Acrylic display stand",
    whatItDoes: "Holds a bag upright on the shelf so it's on show and off its base.",
    lookFor: "Clear acrylic stands sized to your bag, single or tiered.",
    watchOut: "For daily storage a shaper and dust bag beat open display, which lets in dust and light.",
    searchQuery: "acrylic handbag display stand",
    materials: [],
  },
  {
    key: "strap-guard",
    group: "display-use",
    name: "Strap & chain guard",
    whatItDoes: "Cushions a chain or thin strap so it doesn't dig into or mark the leather it rests on.",
    lookFor: "Slip-on leather or silicone chain cushions, or a handle wrap for smooth handles.",
    watchOut: "Make sure it doesn't rub color onto light leather. Test a dyed guard first.",
    searchQuery: "purse chain strap protector cushion",
    materials: ["smooth-leather", "grained-leather"],
  },
  // Travel
  {
    key: "rain-cover",
    group: "travel",
    name: "Rain cover",
    whatItDoes: "A clear sleeve that shields the bag in a downpour without smothering it.",
    lookFor: "A clear plastic rain cover in your bag's size for use in the moment, not for storage.",
    watchOut: "Use it only while it's raining. Long-term plastic traps humidity against the leather.",
    searchQuery: "clear rain cover for handbag",
    materials: [],
  },
  {
    key: "travel-protector",
    group: "travel",
    name: "Padded travel protector",
    whatItDoes: "A padded sleeve that keeps the bag from getting crushed or scuffed in a suitcase.",
    lookFor: "A padded, breathable protector sized to your bag. Breathable so it can double for storage.",
    watchOut: "Confirm it's breathable if you'll store in it. Sealed padded cases can trap moisture.",
    searchQuery: "padded handbag protector storage bag breathable",
    materials: [],
  },
];

/**
 * Map a catalog exterior material name to the care-need families that matter for
 * it. Best-effort keyword match on the material label; unknowns fall back to the
 * general smooth/grained set so a bag always gets sensible picks.
 */
export function careMaterialsFor(materialName: string | null | undefined): CareMaterial[] {
  const m = (materialName ?? "").toLowerCase();
  const out = new Set<CareMaterial>(["hardware"]);
  if (/patent|vernis/.test(m)) out.add("patent");
  else if (/suede|nubuck|daim/.test(m)) out.add("suede");
  else if (/canvas|coated|monogram|damier|jacquard|toile|nylon|gg supreme|denim/.test(m)) out.add("canvas");
  else if (/croc|alligator|python|lizard|ostrich|exotic|snake/.test(m)) out.add("exotic");
  else if (/caviar|grained|epi|togo|clemence|epsom|saffiano|pebble|taurillon/.test(m)) out.add("grained-leather");
  else if (/lamb|calf|box|smooth|nappa|leather/.test(m)) out.add("smooth-leather");
  else {
    // Unknown / null material: assume a general leather bag.
    out.add("smooth-leather");
    out.add("grained-leather");
  }
  return [...out];
}

/**
 * The care items to surface for a bag, given its exterior material. Returns the
 * items whose material families intersect the bag's, capped and ordered for a
 * compact module (clean/condition and shape first, they matter most).
 */
export function careItemsForMaterial(materialName: string | null | undefined, limit = 3): CareItem[] {
  const fams = new Set(careMaterialsFor(materialName));
  const ordered: CareGroupKey[] = ["clean-condition", "shape-store", "hardware", "display-use", "travel"];
  return CARE_ITEMS.filter((it) => it.materials.some((f) => fams.has(f)))
    .sort((a, b) => ordered.indexOf(a.group) - ordered.indexOf(b.group))
    .slice(0, limit);
}

export function careItemsByGroup(group: CareGroupKey): CareItem[] {
  return CARE_ITEMS.filter((it) => it.group === group);
}
