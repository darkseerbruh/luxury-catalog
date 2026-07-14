/**
 * Catalog structure audit — the pure half. Detects the three structural defect
 * classes the 2026-07-14 full-catalog sweep established (docs/catalog-structure-
 * audit-0714.md), plus variant attribute-gap tallies:
 *
 *   1. safe pseudo-styles — a style whose name is another existing same-brand
 *      style plus ONLY leather/canvas + size words ("Togo Birkin 35" when
 *      "Birkin" exists). The class merge-pseudo-styles.ts folds in.
 *   2. listing-title styles — a promoted seller title as a style name
 *      ("Chanel Pink Tweed 19 Large Flap Bag", "… w/ Tags").
 *   3. accent-duplicate groups — same brand, same accent-folded name
 *      ("Belvédère" / "Belvedere").
 *
 * Consumed by scripts/data-health.ts (daily action) and the ux-restructure
 * tooling. Pure functions over in-memory rows — no DB, fully testable.
 *
 * IMPORTANT calibration note (learned 0714): "name embeds another style" alone
 * is NOT a defect — 173 hits are mostly genuine sub-models ("Puzzle Edge",
 * "Saddle Pochette"). Only the material-vocabulary-validated subset is junk;
 * everything else is left alone by design.
 */

export interface StyleLite {
  styleId: number;
  name: string;
  brandId: number;
}

export interface VariantLite {
  variantId: number;
  styleId: number;
  sizeLabel: string | null;
  exteriorColorway: string | null;
  exteriorMaterialId: number | null;
  hardwareColor?: string | null;
}

/** Residual tokens that mark a DISTINCT model (never fold into the base). */
const MODEL_QUALIFIERS =
  /\b(touch|sellier|cargo|hac|haut|courroies|shadow|ghillies|club|verso|faubourg|in[- ]?the[- ]?loop|picnic|3in1|so black|casaque)\b/i;

/** Size tokens (Hermès numerics + common word sizes). */
const SIZE_RX = /\b(15|18|20|25|28|29|30|31|32|35|40|45|50|nano|mini|pm|mm|gm|bb|small|medium|large)\b/gi;

/**
 * Leather / canvas-line vocabulary. A pseudo-style is only counted when its residual
 * (base name + size removed) is made ENTIRELY of these words. Silhouettes
 * (tote/pouch/hobo…) are deliberately absent so "Neverfull Pouch" never matches.
 */
const MATERIAL_VOCAB = new Set<string>([
  "togo","clemence","clémence","epsom","swift","box","chevre","chèvre","barenia","fjord","evercolor",
  "evergrain","taurillon","ostrich","niloticus","novillo","tadelakt","guilloche","sombrero","chamonix",
  "ardennes","courchevel","vache","gulliver","doblis","mysore","veau","lizard","alligator","crocodile","porosus",
  "monogram","damier","ebene","ebène","azur","epi","empreinte","vernis","taiga","mahina","escale","reverse",
  "multicolore","multicolor","idylle","eclipse","macassar","infrarouge","giant","antheia","graphite",
  "caviar","lambskin","calfskin","tweed","patent","jersey","velvet","shearling","denim","raffia","canvas",
  "nylon","leather","suede","satin","python","snakeskin","grained","smooth","quilted","chevron","gomma",
  "saffiano","intrecciato","nappa","goatskin","sheepskin","coated","toile","wool","felt","tessuto",
  "exotic","metallic","perforated","embossed","woven","aged","calf","cowhide","pebbled","textured","edition",
]);

const COLOR_RX =
  /\b(black|white|beige|brown|tan|red|blue|navy|green|pink|purple|grey|gray|gold|silver|burgundy|cream|ivory|orange|yellow|multicolor|charcoal|mango)\b/i;
const MATERIAL_WORD_RX =
  /\b(leather|caviar|lambskin|calfskin|suede|canvas|tweed|patent|quilted|smooth|grained|pebbled|shiny|matte|velvet|denim|nylon|satin|python|croc|ostrich|vernis)\b/i;

/** Accent-fold + squash for duplicate detection. */
export function foldName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return foldName(s).split(" ").filter(Boolean);
}

function containsPhrase(name: string, base: string): boolean {
  return ` ${words(name).join(" ")} `.includes(` ${words(base).join(" ")} `);
}

/** Class 1: safe pseudo-styles (material+size residual over an existing base). */
export function findSafePseudoStyles(styles: StyleLite[], variantCountByStyle: Map<number, number>): StyleLite[] {
  const byBrand = new Map<number, StyleLite[]>();
  for (const s of styles) {
    const list = byBrand.get(s.brandId) ?? [];
    list.push(s);
    byBrand.set(s.brandId, list);
  }
  const out: StyleLite[] = [];
  for (const [, brandStyles] of byBrand) {
    for (const s of brandStyles) {
      if ((variantCountByStyle.get(s.styleId) ?? 0) > 1) continue; // multi-variant → judgment, not auto
      const bases = brandStyles
        .filter(
          (b) =>
            b.styleId !== s.styleId &&
            words(b.name).length < words(s.name).length &&
            containsPhrase(s.name, b.name) &&
            (variantCountByStyle.get(b.styleId) ?? 0) > 0,
        )
        .sort((a, b) => words(b.name).length - words(a.name).length);
      const base = bases[0];
      if (!base) continue;
      const baseWords = new Set(words(base.name));
      const residual = words(s.name).filter((w) => !baseWords.has(w));
      if (residual.length === 0) continue;
      if (MODEL_QUALIFIERS.test(residual.join(" "))) continue;
      const nonSize = residual.filter((w) => {
        SIZE_RX.lastIndex = 0;
        return !SIZE_RX.test(` ${w} `);
      });
      if (nonSize.length === 0) continue; // size-only residual → sibling size, judgment call
      if (!nonSize.every((w) => MATERIAL_VOCAB.has(w))) continue;
      out.push(s);
    }
  }
  return out;
}

/** Class 2: seller-title styles (long + colour/material descriptor, or tag artifacts). */
export function findListingTitleStyles(styles: StyleLite[]): StyleLite[] {
  return styles.filter((s) => {
    const wc = s.name.trim().split(/\s+/).length;
    return (wc >= 5 && (COLOR_RX.test(s.name) || MATERIAL_WORD_RX.test(s.name))) || /w\/|\bNWT\b|\bBNIB\b/i.test(s.name);
  });
}

/** Class 3: accent-duplicate groups (same brand, same folded name). Returns extra rows (group size − 1 each). */
export function findAccentDupGroups(styles: StyleLite[]): StyleLite[][] {
  const byKey = new Map<string, StyleLite[]>();
  for (const s of styles) {
    const k = `${s.brandId}:${foldName(s.name)}`;
    const list = byKey.get(k) ?? [];
    list.push(s);
    byKey.set(k, list);
  }
  return [...byKey.values()].filter((g) => g.length > 1);
}

export interface StructureAudit {
  safePseudo: StyleLite[];
  titleJunk: StyleLite[];
  dupGroups: StyleLite[][];
  /** Variant attribute coverage, percentages 0-100 against all variants. */
  variantCoverage: { sizePct: number; colourPct: number; materialPct: number; hardwarePct: number; total: number };
}

export function auditCatalogStructure(styles: StyleLite[], variants: VariantLite[]): StructureAudit {
  const variantCountByStyle = new Map<number, number>();
  for (const v of variants) variantCountByStyle.set(v.styleId, (variantCountByStyle.get(v.styleId) ?? 0) + 1);
  const total = variants.length;
  const withSize = variants.filter((v) => v.sizeLabel).length;
  const withColour = variants.filter((v) => v.exteriorColorway).length;
  const withMaterial = variants.filter((v) => v.exteriorMaterialId != null).length;
  const withHardware = variants.filter((v) => v.hardwareColor).length;
  return {
    safePseudo: findSafePseudoStyles(styles, variantCountByStyle),
    titleJunk: findListingTitleStyles(styles),
    dupGroups: findAccentDupGroups(styles),
    variantCoverage: {
      total,
      sizePct: total === 0 ? 0 : (100 * withSize) / total,
      colourPct: total === 0 ? 0 : (100 * withColour) / total,
      materialPct: total === 0 ? 0 : (100 * withMaterial) / total,
      hardwarePct: total === 0 ? 0 : (100 * withHardware) / total,
    },
  };
}
