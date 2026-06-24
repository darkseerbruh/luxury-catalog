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

    const matched = matchComps(target, valid, applicable);
    if (matched.length >= MIN_SPEC_COMPS) {
      const dropped = known.filter((d) => !applicable.includes(d));
      return {
        value: median(matched.map((m) => m.salePrice)),
        compCount: matched.length,
        dimsUsed: applicable,
        dimsDropped: dropped,
        broadened: dropped.length > 0,
        variantLevel: false,
      };
    }
  }

  // Variant-level fallback: every resale comp for the bag, regardless of spec.
  if (valid.length >= MIN_VARIANT_COMPS) {
    return {
      value: median(valid.map((m) => m.salePrice)),
      compCount: valid.length,
      dimsUsed: [],
      dimsDropped: known,
      broadened: true,
      variantLevel: true,
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
