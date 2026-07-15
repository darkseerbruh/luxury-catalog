/**
 * The "Shop the market" rating engine — PURE, no IO, unit-tested.
 *
 * A live listing is only useful next to a verdict: is this a good price? The honest
 * way to answer that for a handbag is to compare it to the resale prices we've recorded
 * for THAT bag's exact spec — because color × leather × hardware moves the price far
 * more than condition does (the same Classic Flap runs ~2x apart on leather alone). KBB
 * can grade a car on year/trim/mileage and ignore color; we can't.
 *
 * But full-spec comps are thin (a given color+leather+hardware may have 2 records ever),
 * so we grade against the TIGHTEST spec bucket that has enough comps and BROADEN one
 * dimension at a time when a bucket is too thin — and we always report the basis so the
 * UI can say "rated against 14 black Caviar mediums" or "broadened to Lambskin, limited
 * color data". Never a silent guess. This mirrors the locked value-module principle:
 * "when exact-variant comps are thin, broaden scope but label it."
 *
 * Production year is accepted as a spec dimension but is data-gated today (no resale feed
 * carries a reliable per-listing year); it simply participates when present and is
 * ignored when null, so this engine needs no change once the spec-extract pass lands.
 */

export type DealBand = "great" | "good" | "fair" | "above";

/** A spec dimension we can match comps on, tightest-first by price relevance. */
export type SpecDim = "material" | "color" | "hardware" | "year";

/** The spec of one record (a listing or a comp). Nulls = unknown for that dimension. */
export interface ItemSpec {
  colorway: string | null;
  material: string | null;
  hardwareColor: string | null;
  productionYear: number | null;
}

/** A recorded resale price with its spec, used as a comparable. */
export interface SpecComp extends ItemSpec {
  salePrice: number;
  /** True for a REALIZED price (sold/auction); false/undefined for an asking listing. */
  realized?: boolean;
}

/** The fair value we rated a listing against, plus the basis so the UI can be honest. */
export interface FairValue {
  /** Median sale price of the chosen comp bucket. */
  value: number;
  /** How many comps backed it. */
  compCount: number;
  /** Spec dimensions the bucket matched on (a subset of what the listing actually has). */
  dimsUsed: SpecDim[];
  /** Spec dimensions the listing HAS but we had to drop to reach enough comps. */
  dimsDropped: SpecDim[];
  /** True when we couldn't grade at full applicable spec and broadened. */
  broadened: boolean;
  /** True when we fell all the way back to every resale comp for the variant. */
  variantLevel: boolean;
  /** True when the chosen bucket is REALIZED sold prices (the truth), not asking prices. */
  realized: boolean;
}

export interface DealRating {
  band: DealBand;
  /** Whole-number percent the price sits under fair value (negative = over). */
  pctUnder: number;
  fairValue: FairValue;
}

// Tunable band thresholds (% under fair value). Set against real spread once loaded.
export const GREAT_UNDER_PCT = 10;
export const GOOD_UNDER_PCT = 2;
export const FAIR_OVER_PCT = 8; // up to this far OVER fair value still reads as "fair"

// A spec bucket needs at least this many comps to be trusted; below it we broaden.
export const MIN_SPEC_COMPS = 4;
// The variant-level fallback (every resale comp) needs at least this many to rate at all.
export const MIN_VARIANT_COMPS = 2;

// Tightest → broadest. Each level is the set of dims that must match at that level.
// We drop year first, then hardware, then color, then grade on material alone — matching
// the locked broaden order (year → hardware → color → style/condition).
const SPEC_LEVELS: SpecDim[][] = [
  ["material", "color", "hardware", "year"],
  ["material", "color", "hardware"],
  ["material", "color"],
  ["material"],
];

const ALL_DIMS: SpecDim[] = ["material", "color", "hardware", "year"];

function norm(s: string | null): string | null {
  if (s == null) return null;
  const t = s.toLowerCase().replace(/\s+/g, " ").trim();
  return t.length ? t : null;
}

/** A spec dimension's normalized value on a record, or null if unknown. */
function dimValue(spec: ItemSpec, dim: SpecDim): string | number | null {
  switch (dim) {
    case "material":
      return norm(spec.material);
    case "color":
      return norm(spec.colorway);
    case "hardware":
      return norm(spec.hardwareColor);
    case "year":
      return spec.productionYear ?? null;
  }
}

/** Which dims a listing actually knows about (non-null), in tightest-first order. */
function knownDims(spec: ItemSpec): SpecDim[] {
  return ALL_DIMS.filter((d) => dimValue(spec, d) != null);
}

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Comps that match the target on every dim in `dims` (both sides must know the dim). */
function matchComps(target: ItemSpec, comps: SpecComp[], dims: SpecDim[]): SpecComp[] {
  return comps.filter((c) =>
    dims.every((d) => {
      const t = dimValue(target, d);
      const v = dimValue(c, d);
      return t != null && v != null && t === v;
    }),
  );
}

/**
 * Pick the comp pool to price a bucket from, preferring REALIZED sold prices (the truth)
 * over asking listings: if there are enough realized comps use those, else use all comps
 * if there are enough, else null (too thin). `min` is the threshold to clear.
 */
function pickPool(matched: SpecComp[], min: number): { pool: SpecComp[]; realized: boolean } | null {
  const realized = matched.filter((c) => c.realized);
  if (realized.length >= min) return { pool: realized, realized: true };
  if (matched.length >= min) return { pool: matched, realized: false };
  return null;
}

/**
 * Fair value for a listing: the median of the tightest spec bucket with at least
 * MIN_SPEC_COMPS comps; broaden one dimension at a time when thin; finally fall back
 * to every resale comp for the variant (MIN_VARIANT_COMPS). Returns null when even the
 * variant-level pool is too thin to say anything honest.
 */
export function computeFairValue(target: ItemSpec, comps: SpecComp[]): FairValue | null {
  const valid = comps.filter((c) => Number.isFinite(c.salePrice) && c.salePrice > 0);
  if (valid.length === 0) return null;

  const known = knownDims(target);

  // Walk tightest → broadest, considering only dims the listing actually knows. A level
  // that reduces to the same applicable dim set as a tighter one already tried is skipped
  // (same bucket, same result), so we test each distinct bucket once.
  const seen = new Set<string>();
  for (const level of SPEC_LEVELS) {
    const applicable = level.filter((d) => known.includes(d));
    if (applicable.length === 0) continue;
    const key = applicable.join("+");
    if (seen.has(key)) continue;
    seen.add(key);

    const picked = pickPool(matchComps(target, valid, applicable), MIN_SPEC_COMPS);
    if (picked) {
      const dropped = known.filter((d) => !applicable.includes(d));
      return {
        value: median(picked.pool.map((m) => m.salePrice)),
        compCount: picked.pool.length,
        dimsUsed: applicable,
        dimsDropped: dropped,
        broadened: dropped.length > 0,
        variantLevel: false,
        realized: picked.realized,
      };
    }
  }

  // Variant-level fallback: every resale comp for the bag, regardless of spec.
  const pickedAll = pickPool(valid, MIN_VARIANT_COMPS);
  if (pickedAll) {
    return {
      value: median(pickedAll.pool.map((m) => m.salePrice)),
      compCount: pickedAll.pool.length,
      dimsUsed: [],
      dimsDropped: known,
      broadened: true,
      variantLevel: true,
      realized: pickedAll.realized,
    };
  }

  return null;
}

/** Classify a price against a fair value into a deal band + percent under. */
export function classifyDeal(price: number, fair: FairValue): DealRating {
  const pctUnder = Math.round(((fair.value - price) / fair.value) * 100);
  let band: DealBand;
  if (pctUnder >= GREAT_UNDER_PCT) band = "great";
  else if (pctUnder >= GOOD_UNDER_PCT) band = "good";
  else if (pctUnder >= -FAIR_OVER_PCT) band = "fair";
  else band = "above";
  return { band, pctUnder, fairValue: fair };
}

/** Rate a listing in one call: compute fair value, then classify. Null if ungradeable. */
export function rateListing(
  price: number,
  spec: ItemSpec,
  comps: SpecComp[],
): DealRating | null {
  const fair = computeFairValue(spec, comps);
  if (!fair) return null;
  return classifyDeal(price, fair);
}

const BAND_LABEL: Record<DealBand, string> = {
  great: "Great price",
  good: "Good price",
  fair: "Fair price",
  above: "Above market",
};

/** Best band among a set, for the product-grid "deal pulse" (great > good > fair > above). */
const BAND_RANK: Record<DealBand, number> = { great: 3, good: 2, fair: 1, above: 0 };

export function bandLabel(band: DealBand): string {
  return BAND_LABEL[band];
}

export function bestBand(bands: DealBand[]): DealBand | null {
  if (bands.length === 0) return null;
  return bands.reduce((best, b) => (BAND_RANK[b] > BAND_RANK[best] ? b : best), bands[0]);
}

/**
 * Whether a fair value is trustworthy enough to SHOW a deal verdict on. "Market value"
 * is only honest when it's a like-for-like comparison: matched on the two biggest price
 * drivers (leather + color). A blended variant-level fallback makes the cheapest colorway
 * look like a steal against pricier ones, so we withhold the verdict there (show the price,
 * not a green badge). This is what stops "every listing is a great deal".
 */
export function isConfidentBasis(fv: FairValue): boolean {
  return !fv.variantLevel && fv.dimsUsed.includes("material") && fv.dimsUsed.includes("color");
}

/* ------------------------------------------------------------------------------------
 * Which live listing should FRONT a variant (hero photo / card photo)?
 * ---------------------------------------------------------------------------------- */

/** The variant spec the listing photo should look like. Nulls = unknown dimension. */
export interface FrontSpec {
  colorway: string | null;
  sizeLabel: string | null;
  hardwareColor: string | null;
  /** The target style's name, so the face scorer can veto a listing whose slug names a
   *  DIFFERENT model (a Coco Handle / Reissue photo must never front a Classic Flap). */
  styleName?: string | null;
}

const SIZE_WORDS = ["micro", "nano", "mini", "small", "medium", "midi", "jumbo", "maxi", "large", "mama", "mamma"];

/** Model-name fragments that, when present in a listing slug but NOT in the target style's
 *  name, mean the listing is a DIFFERENT model mislabeled into the style (owner 2026-07-12:
 *  a listing image that's the wrong bag is not acceptable). Chanel's look-alikes dominate
 *  the mislabels; harmless for other brands (their slugs won't contain these). "2 55" covers
 *  the slugified "2.55". */
const CROSS_MODEL_TOKENS = [
  "coco handle", "reissue", "2 55", "wallet on chain", "woc", "gabrielle",
  "boy", "top handle", "kelly", "diana", "vanity",
  // Fendi sub-models / collabs that are their OWN product, not the plain Baguette
  // they get titled near (a Double Baguette / Baguette Trunk / Fendace is a
  // different bag; it must not front a plain Baguette variant). "double baguette"
  // is the full phrase on purpose — bare "double" would veto Chanel's legit
  // Double Flap.
  "double baguette", "trunk", "fendace",
];

/** Novelty/embellishment listings (charms, sequins, graffiti…) make honest comps but a
 *  misleading FACE for the style — the icon card shouldn't lead with a limited edition. */
const NOVELTY_TOKENS = [
  "charm", "brooch", "embellish", "sequin", "graffiti", "crystal", "strass",
  "patch", "sticker", "pearl", "camellia", "valentine", "lucky",
  "studded", "flowerland", "bloody",
];

/**
 * Score how well a live listing's title/slug matches the variant it would front.
 * Pure text heuristic over reseller slugs ("chanel-black-caviar-double-flap-…"):
 *  +4 colorway word match (the dominant visual signal)
 *  +2 wanted size word present · -2 a DIFFERENT size word present (mediums are often
 *     unlabeled, so a conflicting "maxi"/"mini" is the real tell)
 *  +1 hardware match ("gold"/"ghw")
 *  -3 novelty/embellishment token (don't front an icon with a charm-covered limited)
 * Used to pick the photo that stands in for a variant; comps/pricing never use this.
 */
export function scoreListingFace(titleOrSlug: string, spec: FrontSpec): number {
  const hay = (titleOrSlug ?? "").toLowerCase().replace(/[-_/]+/g, " ");
  let score = 0;

  const colorWords = (spec.colorway ?? "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3);
  if (colorWords.length > 0 && colorWords.some((w) => hay.includes(w))) score += 4;

  // Size only judges when the variant HAS a size on record — otherwise a title's
  // "jumbo" is information we can't contradict, not a conflict. A CONFLICTING size
  // outweighs the colour match (owner 2026-07-12: a Medium page must not show a Jumbo
  // photo just because the colour matched), so the wrong-size penalty is stronger than
  // the +4 colour signal.
  const wantedSizes = SIZE_WORDS.filter((s) => (spec.sizeLabel ?? "").toLowerCase().includes(s));
  if (wantedSizes.length > 0) {
    const presentSizes = SIZE_WORDS.filter((s) => new RegExp(`\\b${s}\\b`).test(hay));
    if (wantedSizes.some((s) => presentSizes.includes(s))) score += 2;
    if (presentSizes.some((s) => !wantedSizes.includes(s))) score -= 5;
  }

  const hw = (spec.hardwareColor ?? "").toLowerCase();
  if (hw) {
    const hwHit =
      (hw.includes("gold") && (/\bgold\b/.test(hay) || /\bghw\b/.test(hay))) ||
      (hw.includes("silver") && (/\bsilver\b/.test(hay) || /\bshw\b/.test(hay))) ||
      (hw.length >= 4 && hay.includes(hw));
    if (hwHit) score += 1;
  }

  if (NOVELTY_TOKENS.some((t) => hay.includes(t))) score -= 3;

  // Cross-model veto: a slug naming a DIFFERENT model than the target style can never front
  // it, no matter the colour match. Only tokens absent from the target style name count.
  const styleHay = (spec.styleName ?? "").toLowerCase();
  if (CROSS_MODEL_TOKENS.some((t) => hay.includes(t) && !styleHay.includes(t))) score -= 10;

  return score;
}

/** Last URL path segment as a readable title ("…/chanel-black-flap-p123" → "chanel black flap"). */
export function slugTitleFromUrl(url: string | null | undefined): string {
  if (!url) return "";
  const seg = url.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  return seg
    .replace(/-p\d+$/i, "")
    .replace(/[-_]+/g, " ")
    // Strip a trailing product-id digit run, incl. Rebag's id glued to the last
    // word ("...canvas mini4156311" → "...canvas mini"), so size words at the end
    // stay detectable by the \bword\b face matcher.
    .replace(/(\D)(\d{4,})$/, "$1")
    .replace(/\s*\d{4,}\s*$/, "")
    .trim();
}

/** Median of a price list (empty → null). */
export function medianPrice(prices: number[]): number | null {
  const ps = prices.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (ps.length === 0) return null;
  const mid = Math.floor(ps.length / 2);
  return ps.length % 2 ? ps[mid] : (ps[mid - 1] + ps[mid]) / 2;
}

/**
 * Low-price-outlier penalty for FACE picking. Line accessories that resellers title
 * as the bag ("boy mini crossbody" zip case, "timeless handcuff clutch") carry no
 * shape word to veto on, but they all sit FAR below the variant's live-ask median —
 * that price gap is the honest tell (2026-07-09: $966 clutch vs ~$5k flaps, $2.3k
 * zip case vs ~$4k+ Boys). Only the low side is penalized: an expensive rare piece
 * is still the right bag. Needs a real distribution — no penalty under 5 asks.
 * Threshold 0.65: Boy Mini live asks (2026-07-09, n≈250) put the accessory band at
 * $599–2.3k vs a $3.7k median, and real mini flaps start ~$2.8k — 0.65 splits them.
 */
export function faceLowPricePenalty(price: number, livePrices: number[]): number {
  if (livePrices.length < 5) return 0;
  const med = medianPrice(livePrices);
  if (med == null || !Number.isFinite(price) || price <= 0) return 0;
  return price < med * 0.65 ? -3 : 0;
}
