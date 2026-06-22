/**
 * The RealReal "browser-paste" adapter. TheRealReal is JS-rendered and bot-blocked
 * to plain fetch, but the Claude-in-Chrome extension renders it like a normal user
 * (docs/data-sourcing-research.md §3.2). Workflow: open a TRR search in the
 * browser, capture the results text to a file under data/ingest/_raw/, then run
 * this to parse current asking prices into `listed` resale observations.
 *
 *   npx tsx supabase/ingest/sources/trr-paste.ts <results.txt> <targetKey>
 *
 * Semi-manual by design (the browser is the un-blocker); good for seeding real
 * resale data on the hero bags. Each row carries the search URL for attribution.
 */
import fs from "fs";
import path from "path";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";

interface TrrTarget {
  brand: string;
  style: string;
  size_label: string;
  sourceUrl: string;
  /** Lowercased tokens that must ALL appear in a listing title to count. */
  requireTokens: string[];
  minPrice: number;
  maxPrice: number;
}

const TARGETS: Record<string, TrrTarget> = {
  "chanel-classic-flap-medium": {
    brand: "Chanel",
    style: "Classic Flap",
    size_label: "Medium",
    sourceUrl: "https://www.therealreal.com/products?keywords=chanel%20classic%20flap%20medium",
    requireTokens: ["classic", "medium", "double", "flap"],
    minPrice: 1500,
    maxPrice: 20000,
  },
};

const PURE_PRICE = /^\$[\d,]+(?:\.\d{2})?$/;
const toNum = (s: string) => Number(s.replace(/[$,]/g, ""));

/** Parse TRR results text into [{title, askingPrice}] listings. */
export function parseTrrResults(text: string, brand: string): { title: string; price: number }[] {
  const lines = text.split("\n").map((l) => l.trim());
  // Listing boundaries = lines that are exactly the brand name.
  const starts: number[] = [];
  lines.forEach((l, i) => l === brand && starts.push(i));
  const out: { title: string; price: number }[] = [];
  for (let s = 0; s < starts.length; s++) {
    const from = starts[s];
    const to = s + 1 < starts.length ? starts[s + 1] : lines.length;
    const block = lines.slice(from + 1, to).filter(Boolean);
    if (block.length === 0) continue;
    const title = block[0];
    // Asking price = the LAST pure "$X" line (the post-discount price); est-retail
    // figures live on lines with text ("Est. Retail $X") so they're excluded.
    const prices = block.filter((l) => PURE_PRICE.test(l)).map(toNum);
    if (prices.length === 0) continue;
    out.push({ title, price: prices[prices.length - 1] });
  }
  return out;
}

function main() {
  const [file, targetKey] = process.argv.slice(2);
  if (!file || !targetKey || !TARGETS[targetKey]) {
    console.error(`Usage: tsx trr-paste.ts <results.txt> <${Object.keys(TARGETS).join("|")}>`);
    process.exit(1);
  }
  const t = TARGETS[targetKey];
  const text = fs.readFileSync(path.resolve(file), "utf8");
  const today = new Date().toISOString().slice(0, 10);

  const listings = parseTrrResults(text, t.brand);
  const obs: PriceObservation[] = listings
    .filter((l) => {
      const title = l.title.toLowerCase();
      return t.requireTokens.every((tok) => title.includes(tok)) && l.price >= t.minPrice && l.price <= t.maxPrice;
    })
    .map((l) => ({
      brand: t.brand,
      style: t.style,
      attrs: { size_label: t.size_label },
      platform: "The RealReal",
      price_type: "listed" as const,
      sale_price: l.price,
      currency: "USD",
      observed_on: today,
      source_url: t.sourceUrl,
      confidence: "high" as const,
      notes: l.title.slice(0, 160),
    }));

  const { file: out, kept, dropped } = writeObservations("therealreal", obs);
  console.log(`trr-paste: ${listings.length} listings parsed, ${kept} kept${dropped ? ` (dropped ${dropped})` : ""} -> ${out}`);
}

main();
