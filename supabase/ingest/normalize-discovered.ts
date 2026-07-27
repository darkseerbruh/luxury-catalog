/**
 * Normalize discovered_listing.style_guess to a CLEAN canonical model name.
 *
 * The catch-all capture stores each listing's verbose / brand-less marketplace title
 * in style_guess, which doesn't cluster (every title is near-unique) and mixes in
 * small leather goods. This pass rewrites style_guess to canonicalModel(brand, raw_name)
 * for rows where a known bag model is confidently detected, so promote-discovered can
 * cluster recurring real bags. raw_name is left untouched (keeps the original title).
 *
 * SLG/accessory rows (canonicalModel → null) are left as-is (stay in triage); rows
 * whose model isn't in the dictionary yet are left as-is too (extend the dictionary).
 *
 *   npx tsx supabase/ingest/normalize-discovered.ts [--write]
 *     (dry-run by default: reports conversion rate + the clusters it would create)
 *
 * After --write, run:  npm run promote:discovered   to see the clean clusters.
 */
import { supabaseAdmin as db } from "../seed/lib/client";
import { norm } from "../../src/lib/image-import-core";
import { canonicalModel, canonicalBrand } from "../../src/lib/ingest/model-normalize";

const WRITE = process.argv.includes("--write");

interface Row {
  discovered_id: number;
  brand_guess: string | null;
  style_guess: string | null;
  raw_name: string | null;
  size_label: string | null;
}

async function loadAll(): Promise<Row[]> {
  const out: Row[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from("discovered_listing")
      .select("discovered_id, brand_guess, style_guess, raw_name, size_label")
      .is("promoted_variant_id", null)
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as Row[]));
    if (data.length < page) break;
  }
  return out;
}

/**
 * The seller's ACTUAL title.
 *
 * raw_name is documented as "the listing title, verbatim", and for Fashionphile / TRR /
 * eBay it is. But the catch-all ingest parks a placeholder there — "unmatched-model
 * (dictionary miss) — captured for triage" — and puts the real title in style_guess.
 * Measured 2026-07-26: that placeholder covers 97.2% of The Luxury Closet rows and 99.3%
 * of Rebag, i.e. 60.4% of the whole 316,986-row backlog.
 *
 * Reading raw_name first therefore ran canonicalModel() against literal boilerplate for
 * most of the backlog, so those rows could never match no matter what the dictionary
 * said. That makes this a PRECONDITION for dictionary work: without it, adding "matelasse"
 * to Chanel does nothing for the 149k Luxury Closet rows that need it.
 *
 * Ann's Fabulous Finds parks its own placeholder ("… discovered") the same way.
 */
const PLACEHOLDER_RX = /^unmatched-model|captured for triage|fabulous finds discovered/i;
export function sellerTitle(r: Pick<Row, "raw_name" | "style_guess">): string | null {
  const raw = r.raw_name;
  if (raw && !PLACEHOLDER_RX.test(raw)) return raw;
  return r.style_guess ?? raw;
}

async function main() {
  const rows = await loadAll();
  console.log(`normalize-discovered: ${rows.length} unpromoted rows${WRITE ? " (WRITE)" : " (DRY RUN)"}`);

  const updates: { id: number; style: string }[] = [];
  const clusters = new Map<string, { brand: string; model: string; size: string; count: number; min: number; max: number }>();
  let matched = 0;

  for (const r of rows) {
    const brand = canonicalBrand((r.brand_guess ?? "").trim());
    const model = canonicalModel(brand, sellerTitle(r));
    if (!model) continue;
    matched++;
    if (norm(r.style_guess) !== norm(model)) updates.push({ id: r.discovered_id, style: model });
    const size = r.size_label?.trim() || "(no size)";
    const key = `${brand}|${model}|${size}`;
    const c = clusters.get(key) ?? { brand, model, size, count: 0, min: Infinity, max: 0 };
    c.count++;
    clusters.set(key, c);
  }

  console.log(`Canonical model detected for ${matched}/${rows.length} (${Math.round((matched / rows.length) * 100)}%).`);
  const promotable = [...clusters.values()].filter((c) => c.count >= 5).sort((a, b) => b.count - a.count);
  console.log(`${clusters.size} (brand|model|size) clusters; ${promotable.length} ≥ 5 (promotable after normalize):`);
  for (const c of promotable.slice(0, 40)) {
    console.log(`  ${String(c.count).padStart(4)}  ${c.brand} / ${c.model} / ${c.size}`);
  }
  if (promotable.length > 40) console.log(`  …and ${promotable.length - 40} more`);

  if (!WRITE) {
    console.log(`\nDRY RUN — ${updates.length} style_guess values would be rewritten. Pass --write to persist.`);
    return;
  }

  let written = 0;
  for (let i = 0; i < updates.length; i += 200) {
    const chunk = updates.slice(i, i + 200);
    await Promise.all(
      chunk.map((u) => db.from("discovered_listing").update({ style_guess: u.style }).eq("discovered_id", u.id))
    );
    written += chunk.length;
  }
  console.log(`Rewrote style_guess on ${written} row(s). Run: npm run promote:discovered`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
