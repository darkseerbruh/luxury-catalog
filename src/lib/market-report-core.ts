/**
 * Market-report core — pure, unit-testable aggregation + rendering helpers for
 * the monthly "State of the Resale Market" report (scripts/market-report.ts).
 *
 * No I/O here: the CLI fetches price_history rows (paged past the PostgREST
 * 1000-row cap via fetchAllRows) and hands plain rows in. Everything in this
 * module is deterministic on its inputs so the n-gating and median math can be
 * tested with fixtures.
 *
 * Factuality rules baked in (docs/preferences.md factuality protocol +
 * docs/data-analysis-standard.md):
 *   - asking prices are ASKING, never presented as sold;
 *   - every figure renders with its n, its date window, and source labels;
 *   - movers are n-gated (>= MIN_MOVER_N in BOTH 30-day windows) so a "mover"
 *     is never reported off thin data;
 *   - medians (never means) as the conservative aggregate.
 */

/** A price observation, flattened for aggregation. */
export interface ReportPriceRow {
  styleId: number;
  styleName: string;
  brandName: string;
  price: number;
  currency: string | null;
  platform: string | null;
  /** price_history.price_type: 'listed' | 'sold' | 'auction' | 'retail_msrp' | 'estimate' | null */
  priceType: string | null;
  /** ISO date the price was true at source (observed_on, falling back to date_recorded). */
  effectiveDate: string;
}

export interface BrandAskingStat {
  brand: string;
  medianAsking: number;
  n: number;
  platforms: string[];
}

export interface StyleMover {
  brand: string;
  style: string;
  priorMedian: number;
  recentMedian: number;
  /** Percent change of the recent 30-day median vs the prior 30-day median. */
  pctChange: number;
  nPrior: number;
  nRecent: number;
}

export interface NewStyle {
  brand: string;
  style: string;
  /** ISO date the style row was created in the catalog. */
  addedOn: string;
}

/** Movers must have at least this many asking observations in BOTH windows. */
export const MIN_MOVER_N = 10;
/** How many movers to report per brand at most. */
export const MOVERS_PER_BRAND = 5;
/** Days per mover comparison window. */
export const MOVER_WINDOW_DAYS = 30;
/** Trailing window for the per-brand median asking table. */
export const BRAND_WINDOW_DAYS = 90;

/** Median of a list. Returns null for an empty list (never fabricates a figure). */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** An asking-price observation = an explicit 'listed' row. Sold/auction/retail rows are excluded. */
export function isAskingRow(row: Pick<ReportPriceRow, "priceType">): boolean {
  return row.priceType === "listed";
}

/**
 * Split rows into the USD set we aggregate and the non-USD set we exclude
 * (and count, so the report can say how many were left out). Rows with no
 * recorded currency are treated as USD: the pipeline's US-marketplace sources
 * predate the currency column, and the scope note states this assumption.
 */
export function splitByCurrency(rows: ReportPriceRow[]): { usd: ReportPriceRow[]; nonUsd: ReportPriceRow[] } {
  const usd: ReportPriceRow[] = [];
  const nonUsd: ReportPriceRow[] = [];
  for (const r of rows) {
    if (r.currency == null || r.currency.toUpperCase() === "USD") usd.push(r);
    else nonUsd.push(r);
  }
  return { usd, nonUsd };
}

/** Add `days` (may be negative) to an ISO date string, in UTC. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive date-window test on ISO date strings (lexicographic compare is safe for YYYY-MM-DD). */
export function inWindow(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/**
 * Per-brand median asking price over the trailing window ending at `asOf`
 * (inclusive). Uses asking rows only. Sorted by median, priciest first.
 */
export function brandAskingStats(
  rows: ReportPriceRow[],
  asOf: string,
  windowDays: number = BRAND_WINDOW_DAYS,
): BrandAskingStat[] {
  const start = addDays(asOf, -(windowDays - 1));
  const byBrand = new Map<string, { prices: number[]; platforms: Set<string> }>();
  for (const r of rows) {
    if (!isAskingRow(r)) continue;
    if (!inWindow(r.effectiveDate, start, asOf)) continue;
    let g = byBrand.get(r.brandName);
    if (!g) {
      g = { prices: [], platforms: new Set() };
      byBrand.set(r.brandName, g);
    }
    g.prices.push(r.price);
    if (r.platform) g.platforms.add(r.platform);
  }
  const out: BrandAskingStat[] = [];
  for (const [brand, g] of byBrand) {
    const med = median(g.prices);
    if (med == null) continue;
    out.push({ brand, medianAsking: med, n: g.prices.length, platforms: [...g.platforms].sort() });
  }
  return out.sort((a, b) => b.medianAsking - a.medianAsking);
}

/**
 * Style-level 30-day median movers, n-gated.
 *
 * Recent window = the `windowDays` days ending at `asOf` (inclusive); prior
 * window = the `windowDays` days immediately before that. A style qualifies
 * ONLY when it has at least `minN` asking observations in BOTH windows, so a
 * "mover" is never an artifact of thin data. Within each brand, movers are
 * ranked by absolute percent change and capped at `topPerBrand`.
 */
export function styleMovers(
  rows: ReportPriceRow[],
  asOf: string,
  opts: { windowDays?: number; minN?: number; topPerBrand?: number } = {},
): StyleMover[] {
  const windowDays = opts.windowDays ?? MOVER_WINDOW_DAYS;
  const minN = opts.minN ?? MIN_MOVER_N;
  const topPerBrand = opts.topPerBrand ?? MOVERS_PER_BRAND;

  const recentStart = addDays(asOf, -(windowDays - 1));
  const priorEnd = addDays(recentStart, -1);
  const priorStart = addDays(priorEnd, -(windowDays - 1));

  const byStyle = new Map<number, { brand: string; style: string; recent: number[]; prior: number[] }>();
  for (const r of rows) {
    if (!isAskingRow(r)) continue;
    let g = byStyle.get(r.styleId);
    if (!g) {
      g = { brand: r.brandName, style: r.styleName, recent: [], prior: [] };
      byStyle.set(r.styleId, g);
    }
    if (inWindow(r.effectiveDate, recentStart, asOf)) g.recent.push(r.price);
    else if (inWindow(r.effectiveDate, priorStart, priorEnd)) g.prior.push(r.price);
  }

  const movers: StyleMover[] = [];
  for (const g of byStyle.values()) {
    if (g.recent.length < minN || g.prior.length < minN) continue;
    const recentMedian = median(g.recent)!;
    const priorMedian = median(g.prior)!;
    if (priorMedian <= 0) continue;
    movers.push({
      brand: g.brand,
      style: g.style,
      priorMedian,
      recentMedian,
      pctChange: ((recentMedian - priorMedian) / priorMedian) * 100,
      nPrior: g.prior.length,
      nRecent: g.recent.length,
    });
  }

  // Cap per brand, biggest absolute move first; then a stable overall order.
  const byBrand = new Map<string, StyleMover[]>();
  for (const m of movers) {
    const list = byBrand.get(m.brand) ?? [];
    list.push(m);
    byBrand.set(m.brand, list);
  }
  const out: StyleMover[] = [];
  for (const brand of [...byBrand.keys()].sort()) {
    const list = byBrand
      .get(brand)!
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, topPerBrand);
    out.push(...list);
  }
  return out;
}

/** Count of distinct styles that have at least one price observation of any type. */
export function stylesWithPrices(rows: ReportPriceRow[]): number {
  return new Set(rows.map((r) => r.styleId)).size;
}

const SOURCE_NOTES: [RegExp, string][] = [
  [/fashionphile/i, "fixed-price marketplace, so asking closely tracks what buyers pay"],
  [/therealreal/i, "consignment marketplace; prices are asking"],
  [/vestiaire/i, "peer-to-peer marketplace; prices are asking"],
  [/ebay/i, "bid/ask marketplace; listed prices are asking, not realized bids"],
];

/** Plain-language note for a platform name, or null if we have none. */
export function platformNote(platform: string): string | null {
  for (const [rx, note] of SOURCE_NOTES) {
    if (rx.test(platform)) return note;
  }
  return null;
}

export function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export interface ReportInput {
  /** Report month, YYYY-MM. */
  month: string;
  /** ISO date the data was read (every figure is as of this date). */
  asOf: string;
  totalPriceRows: number;
  totalStyles: number;
  totalBrands: number;
  stylesCovered: number;
  usdRowCount: number;
  nonUsdRowCount: number;
  brandStats: BrandAskingStat[];
  movers: StyleMover[];
  newStyles: NewStyle[];
}

/**
 * Render the full markdown report. Plain, factual, hedged: asking is labeled
 * asking, every figure carries n + window, and the scope note states the
 * catalog's skew. No em dashes anywhere in the output (voice rule).
 */
export function renderReport(input: ReportInput): string {
  const {
    month,
    asOf,
    totalPriceRows,
    totalStyles,
    totalBrands,
    stylesCovered,
    usdRowCount,
    nonUsdRowCount,
    brandStats,
    movers,
    newStyles,
  } = input;

  const coveragePct = totalStyles > 0 ? ((stylesCovered / totalStyles) * 100).toFixed(1) : "0.0";
  const brandWindowStart = addDays(asOf, -(BRAND_WINDOW_DAYS - 1));
  const recentStart = addDays(asOf, -(MOVER_WINDOW_DAYS - 1));
  const priorEnd = addDays(recentStart, -1);
  const priorStart = addDays(priorEnd, -(MOVER_WINDOW_DAYS - 1));
  const monthStart = `${month}-01`;

  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`> **DRAFT - owner reviews all numbers before any publish.**`);
  push();
  push(`# State of the Resale Market: ${month}`);
  push();
  push(`*Generated ${asOf} from the Luxury Catalog price database (${totalPriceRows.toLocaleString("en-US")} price observations across ${totalStyles.toLocaleString("en-US")} styles and ${totalBrands} brands). All prices in USD. Every figure below is an estimate from our own observations, not an appraisal.*`);
  push();
  push(`## How to read this report`);
  push();
  push(`- **These are asking prices, not sold prices.** Unless a line says otherwise, a figure is what sellers are listing at, not what buyers paid. Fashionphile is fixed-price, so its asking closely tracks what buyers pay; other platforms are asking only.`);
  push(`- **Our catalog skews high and is not yet representative of the whole market.** Coverage today: ${stylesCovered.toLocaleString("en-US")} of ${totalStyles.toLocaleString("en-US")} catalog styles (${coveragePct}%) have at least one price observation. Read these numbers as a view into premium US resale, not the global market.`);
  push(`- **Every figure carries its sample size (n) and date window.** Medians with small n are directional at best; we flag n below 10.`);
  push(`- Rows without a recorded currency come from US-marketplace captures and are treated as USD; ${nonUsdRowCount.toLocaleString("en-US")} non-USD rows were excluded from the ${(usdRowCount + nonUsdRowCount).toLocaleString("en-US")} total.`);
  push();

  push(`## Median asking price by brand`);
  push();
  push(`Asking observations from ${brandWindowStart} to ${asOf} (trailing ${BRAND_WINDOW_DAYS} days). Median of listed asking prices per brand; platforms are the sources contributing rows.`);
  push();
  if (brandStats.length === 0) {
    push(`No asking observations in this window.`);
  } else {
    push(`| Brand | Median asking | n | Sources |`);
    push(`| --- | --- | --- | --- |`);
    for (const b of brandStats) {
      const thin = b.n < MIN_MOVER_N ? " (thin data; directional only)" : "";
      push(`| ${b.brand} | ${fmtUsd(b.medianAsking)}${thin} | ${b.n} | ${b.platforms.join(", ") || "unlabeled"} |`);
    }
  }
  push();

  push(`## Biggest 30-day movers by brand`);
  push();
  push(`Style-level change in median asking price: ${recentStart} to ${asOf} vs ${priorStart} to ${priorEnd}. A style is only listed when it has at least ${MIN_MOVER_N} asking observations in BOTH windows, so no mover here rests on thin data. Up to ${MOVERS_PER_BRAND} movers per brand. A move in asking medians can reflect seller repricing or a shift in which items are listed; it is not a realized-price trend.`);
  push();
  if (movers.length === 0) {
    push(`No style cleared the n >= ${MIN_MOVER_N} bar in both windows this month. We report nothing rather than a mover built on thin data.`);
  } else {
    push(`| Brand | Style | Prior median | Recent median | Change | n (prior / recent) |`);
    push(`| --- | --- | --- | --- | --- | --- |`);
    for (const m of movers) {
      push(`| ${m.brand} | ${m.style} | ${fmtUsd(m.priorMedian)} | ${fmtUsd(m.recentMedian)} | ${fmtPct(m.pctChange)} | ${m.nPrior} / ${m.nRecent} |`);
    }
  }
  push();

  push(`## New styles added this month`);
  push();
  push(`Styles first added to the catalog between ${monthStart} and ${asOf}. These are catalog additions on our side, not market launches.`);
  push();
  if (newStyles.length === 0) {
    push(`No new styles were added to the catalog this month.`);
  } else {
    for (const s of newStyles) {
      push(`- ${s.brand} ${s.style} (added ${s.addedOn})`);
    }
  }
  push();

  push(`## Scope and sources`);
  push();
  push(`- Data: ${totalPriceRows.toLocaleString("en-US")} price observations in the Luxury Catalog database as of ${asOf}. Aggregates use the ${usdRowCount.toLocaleString("en-US")} USD rows.`);
  push(`- Asking, not sold: aggregate figures use listed asking prices. We do not present them as realized sale prices.`);
  const platforms = [...new Set(brandStats.flatMap((b) => b.platforms))].sort();
  for (const p of platforms) {
    const note = platformNote(p);
    if (note) push(`- ${p}: ${note}.`);
  }
  push(`- Representativeness: our catalog's price mix currently skews toward higher-priced styles and premium US resale platforms. It is not yet a representative sample of the whole resale market, and these figures should be read with that in mind.`);
  push(`- All figures are estimates from observed listings, not appraisals, and are dated ${asOf}.`);
  push();

  return lines.join("\n");
}
