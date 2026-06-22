/**
 * Landing-zone IO for ingestion. Adapters fetch + normalise, then write
 * PriceObservation[] here as JSON; load-prices.ts reads it all back and upserts
 * into price_history. Mirrors the research-JSON -> seed pattern
 * (supabase/seed/research/*.json). Files land in data/ingest/<source>/.
 */
import fs from "fs";
import path from "path";
import { validateObservation, type PriceObservation } from "../../../src/lib/ingest/types";

const INGEST_DIR = path.resolve(__dirname, "../../../data/ingest");

export function sourceDir(source: string): string {
  return path.join(INGEST_DIR, source);
}

/**
 * Write a batch of observations for a source. Invalid rows are dropped (logged
 * by caller) so the loader only ever sees well-formed data. Returns the path
 * written and the kept/dropped counts.
 */
export function writeObservations(
  source: string,
  observations: PriceObservation[]
): { file: string; kept: number; dropped: number } {
  const kept = observations.filter((o) => validateObservation(o).length === 0);
  const dir = sourceDir(source);
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(kept, null, 2));
  return { file, kept: kept.length, dropped: observations.length - kept.length };
}

/** Read every observation across all (or one) source's landing files. */
export function readLandingObservations(source?: string): PriceObservation[] {
  const roots = source ? [sourceDir(source)] : listSources().map(sourceDir);
  const out: PriceObservation[] = [];
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (Array.isArray(parsed)) out.push(...parsed);
    }
  }
  return out;
}

export function listSources(): string[] {
  if (!fs.existsSync(INGEST_DIR)) return [];
  return fs.readdirSync(INGEST_DIR).filter((d) => fs.statSync(path.join(INGEST_DIR, d)).isDirectory());
}
