/**
 * Transcribed retail (MSRP) price history from published, citable secondary
 * sources (docs/data-sourcing-research.md §3.5). This is curated reference data,
 * NOT a live scrape — each figure carries the URL it was read from and is loaded
 * as price_type 'retail_msrp' at confidence 'medium' (secondary source).
 *
 * Rules (per the catalog's "never invent" guardrail): only figures actually
 * found in a real source go here; cross-checked against >=2 sources where noted.
 * Add a style by appending a record; the loader turns it into observations.
 */
import type { PriceObservation } from "./types";

export interface MsrpYear {
  year: number;
  price: number;
  currency: string;
  source_url: string;
  note?: string;
}

export interface MsrpRecord {
  brand: string;
  style: string;
  size_label: string;
  /** Platform label stored on the row, e.g. "Chanel (retail)". */
  platform: string;
  history: MsrpYear[];
}

/**
 * Chanel Classic Flap (Medium / "Timeless CC", US retail), PRE-2016 history.
 * The hero-style seed (supabase/seed/research/chanel-classic-flap.json) already
 * carries the 2016->2025 MSRP series, so this only extends the timeline earlier
 * (the 2005->2012 appreciation) to avoid duplicating those rows. Figures
 * corroborated across LuxuryEvermore and Miloura price-history write-ups; the
 * 2016 figure ($4,900) matches the seed, a useful cross-check.
 */
const CHANEL_CLASSIC_FLAP_MEDIUM: MsrpRecord = {
  brand: "Chanel",
  style: "Classic Flap",
  size_label: "Medium",
  platform: "Chanel (retail)",
  history: [
    { year: 2005, price: 1650, currency: "USD", source_url: "https://miloura.com/blogs/news/chanel-classic-flap-bag-price-history-then-vs-now-what-you-need-to-know" },
    { year: 2010, price: 2850, currency: "USD", source_url: "https://luxuryevermore.com/blogs/article/chanel-classic-flap-price-history" },
    { year: 2012, price: 4400, currency: "USD", source_url: "https://luxuryevermore.com/blogs/article/chanel-classic-flap-price-history" },
  ],
};

/**
 * Hermès Birkin / Kelly (US retail, Togo/standard leather). Figures from
 * Sotheby's price-increase articles, PurseBop guides and BagUSeek's 2026 guide.
 * Hermès paused increases ~2016–2019 then resumed; series are intentionally
 * sparse (only firmly-cited, size-attributed points) per "accuracy over
 * completeness". size_label matches the catalog hero variants exactly so they
 * resolve cleanly.
 */
const HERMES_BIRKIN_35: MsrpRecord = {
  brand: "Hermès",
  style: "Birkin",
  size_label: "Birkin 35",
  platform: "Hermès (retail)",
  history: [
    { year: 2015, price: 10900, currency: "USD", source_url: "https://www.sothebys.com/en/articles/hermes-raises-the-birkin-bag-price-what-you-need-to-know" },
    { year: 2018, price: 11900, currency: "USD", source_url: "https://www.pursebop.com/the-hermes-birkin-price-guide-2026/" },
    { year: 2026, price: 16300, currency: "USD", source_url: "https://baguseek.com/hermes-birkin-price-guide-2026" },
  ],
};

const HERMES_BIRKIN_30: MsrpRecord = {
  brand: "Hermès",
  style: "Birkin",
  size_label: "Birkin 30",
  platform: "Hermès (retail)",
  history: [
    { year: 2025, price: 13900, currency: "USD", source_url: "https://priveporter.com/blogs/blog/prive-porter-s-guide-to-the-2026-u-s-hermes-price-increase-real-numbers-real-impact" },
    { year: 2026, price: 14900, currency: "USD", source_url: "https://baguseek.com/hermes-birkin-price-guide-2026" },
  ],
};

const HERMES_KELLY_28: MsrpRecord = {
  brand: "Hermès",
  style: "Kelly",
  size_label: "Kelly 28",
  platform: "Hermès (retail)",
  history: [
    { year: 2023, price: 10200, currency: "USD", source_url: "https://www.sothebys.com/en/articles/hermes-raises-kelly-bag-prices-what-you-need-to-know", note: "pre-Feb-2024" },
    { year: 2024, price: 11560, currency: "USD", source_url: "https://www.sothebys.com/en/articles/hermes-raises-kelly-bag-prices-what-you-need-to-know", note: "post-Feb-2024 +~$1,360" },
    { year: 2026, price: 15400, currency: "USD", source_url: "https://www.pursebop.com/the-hermes-kelly-price-guide-2026/", note: "Togo/Epsom" },
  ],
};

export const MSRP_HISTORY: MsrpRecord[] = [
  CHANEL_CLASSIC_FLAP_MEDIUM,
  HERMES_BIRKIN_35,
  HERMES_BIRKIN_30,
  HERMES_KELLY_28,
];

/** Expand one MSRP record into per-year retail_msrp observations. */
export function msrpObservations(record: MsrpRecord): PriceObservation[] {
  return record.history.map((h) => ({
    brand: record.brand,
    style: record.style,
    attrs: { size_label: record.size_label },
    platform: record.platform,
    price_type: "retail_msrp" as const,
    sale_price: h.price,
    currency: h.currency,
    observed_on: `${h.year}-01-01`,
    source_url: h.source_url,
    confidence: "medium" as const,
    notes: h.note ? `MSRP ${h.year}: ${h.note}` : `MSRP ${h.year}`,
  }));
}

/** All MSRP observations across every record. */
export function allMsrpObservations(): PriceObservation[] {
  return MSRP_HISTORY.flatMap(msrpObservations);
}
