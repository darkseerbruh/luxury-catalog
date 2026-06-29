/**
 * Fashionphile CONDITION enricher (SERVER-SIDE — no browser, 0 Firecrawl credits).
 *
 * The Shopify feed (/collections/.../products.json) does NOT carry a condition grade —
 * it lives only on the product page, as `Condition: <span>Excellent</span>` (verified
 * live 2026-06-29). This pass fetches the product page for raw-dump entries that don't
 * yet have a `conditionGrade`, extracts the grade, and writes it back into the dump so
 * the next `fashionphile.ts --raw/--catch-all` load fills the `condition` column.
 *
 *   npx tsx supabase/ingest/sources/fashionphile-condition.ts [--limit=N] [--all]
 *     --limit=N   max product pages to fetch this run (default 300; keeps runs bounded)
 *     --all       re-fetch grades even for entries that already have one (default: only missing)
 *
 * Incremental + idempotent: cap it, run it repeatedly (CI), and it chips away at the
 * backlog without ever re-fetching what's already graded. Polite pacing + 503 backoff,
 * mirroring fashionphile-crawl.ts. Legal posture: a condition GRADE is a fact (stored);
 * the site's generic grade-definition prose is NOT ingested.
 */
import fs from "fs";
import path from "path";

const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/fashionphile.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_DELAY_MS = 350;
const BACKOFFS = [4000, 12000, 30000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RawDumpEntry {
  product: { handle?: string };
  url?: string;
  conditionGrade?: string | null;
  conditionDetail?: string | null;
}

/** Parse the condition grade out of a Fashionphile product-page HTML. */
export function parseConditionGrade(html: string): string | null {
  // Primary: the labelled spec line "Condition: <span ...>Excellent</span>".
  const m = html.match(/Condition:\s*<span[^>]*>\s*([^<]+?)\s*<\/span>/i);
  if (m) {
    const g = m[1].trim();
    if (g && g.length <= 20) return g;
  }
  return null;
}

async function fetchHtml(url: string): Promise<string | null> {
  for (let attempt = 0; attempt <= BACKOFFS.length; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) return await r.text();
      if ((r.status === 503 || r.status === 429) && attempt < BACKOFFS.length) {
        await sleep(BACKOFFS[attempt]);
        continue;
      }
      return null;
    } catch {
      if (attempt < BACKOFFS.length) { await sleep(BACKOFFS[attempt]); continue; }
      return null;
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = Number((args.find((a) => a.startsWith("--limit=")) ?? "--limit=300").split("=")[1]);
  const all = args.includes("--all");

  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`fashionphile-condition: dump not found at ${RAW_DUMP}. Crawl it first (fashionphile-crawl.ts).`);
    process.exit(1);
  }
  const dump: RawDumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const todo = dump.filter((e) => e.url && (all || !e.conditionGrade)).slice(0, limit);
  console.log(`fashionphile-condition: ${todo.length} of ${dump.length} entries to grade (limit ${limit}${all ? ", --all" : ""}).`);

  let graded = 0, missed = 0;
  for (const e of todo) {
    const html = await fetchHtml(e.url!);
    if (!html) { missed++; await sleep(PAGE_DELAY_MS); continue; }
    const grade = parseConditionGrade(html);
    if (grade) { e.conditionGrade = grade; graded++; }
    else missed++;
    await sleep(PAGE_DELAY_MS);
    if ((graded + missed) % 50 === 0) console.log(`  …${graded + missed}/${todo.length} (graded ${graded}, missed ${missed})`);
  }

  fs.writeFileSync(RAW_DUMP, JSON.stringify(dump));
  console.log(`fashionphile-condition: graded ${graded}, missed ${missed} -> ${RAW_DUMP}`);
  console.log(`Next: npx tsx supabase/ingest/sources/fashionphile.ts --catch-all && npm run load:prices -- fashionphile --discovered-only --write`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
