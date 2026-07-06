/**
 * Monthly "State of the Resale Market" report generator (B2B data-product seed
 * + monthly GEO/email asset).
 *
 * Reads the live price database and renders a markdown DRAFT for owner review:
 *   - median asking price by brand (n + window + source labels),
 *   - the biggest 30-day style-level median movers per brand (n >= 10 in BOTH
 *     windows; never a mover off thin data),
 *   - styles newly added to the catalog this month,
 *   - a plain scope note (asking not sold, catalog skew, coverage %).
 *
 * Dry run (prints to stdout):   npx tsx scripts/market-report.ts
 * Save the file:                npx tsx scripts/market-report.ts --write
 * Pin a month:                  npx tsx scripts/market-report.ts --month=2026-07 [--write]
 *
 * Output: docs/research-drafts/market-reports/<YYYY-MM>.md
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Exits with one clear line when they are missing (worktree sessions have no
 * env; the main session runs it for real).
 *
 * All aggregation logic is pure and unit-tested in src/lib/market-report-core.ts;
 * this file is the thin DB + file layer. Whole-table reads page past the
 * PostgREST 1000-row cap via fetchAllRows (src/lib/supabase.ts).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

import { fetchAllRows } from "../src/lib/supabase";
import {
  renderReport,
  stylesWithPrices,
  splitByCurrency,
  brandAskingStats,
  styleMovers,
  type NewStyle,
  type ReportPriceRow,
} from "../src/lib/market-report-core";

// override: true so a real .env.local wins over any ambient placeholder vars
// the execution environment may pre-set (same pattern as supabase/seed/lib/client.ts).
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true, quiet: true });

interface Flags {
  write: boolean;
  month: string; // YYYY-MM
}

function parseFlags(argv: string[]): Flags {
  const today = new Date().toISOString().slice(0, 10);
  const flags: Flags = { write: false, month: today.slice(0, 7) };
  for (const a of argv) {
    if (a === "--write") flags.write = true;
    else if (a.startsWith("--month=")) {
      const m = a.slice("--month=".length);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) {
        console.error(`Invalid --month "${m}" (expected YYYY-MM).`);
        process.exit(1);
      }
      flags.month = m;
    }
  }
  return flags;
}

/** First day of the month after `month` (YYYY-MM), as an ISO date. */
function nextMonthStart(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/** The as-of date: today for the current month, the month's last day for a past month. */
function asOfFor(month: string, today: string): string {
  if (month === today.slice(0, 7)) return today;
  const lastDay = new Date(new Date(`${nextMonthStart(month)}T00:00:00Z`).getTime() - 86400000);
  return lastDay.toISOString().slice(0, 10);
}

type BrandRel = { name: string } | { name: string }[] | null;
type StyleRel =
  | { style_id: number; name: string; brand: BrandRel }
  | { style_id: number; name: string; brand: BrandRel }[]
  | null;

interface RawPriceRow {
  sale_price: number | string | null;
  currency: string | null;
  platform: string | null;
  price_type: string | null;
  observed_on: string | null;
  date_recorded: string | null;
  variant: { style: StyleRel } | { style: StyleRel }[] | null;
}

function styleOf(row: RawPriceRow): { styleId: number; styleName: string; brandName: string } | null {
  const v = Array.isArray(row.variant) ? row.variant[0] : row.variant;
  const s = v ? (Array.isArray(v.style) ? v.style[0] : v.style) : null;
  if (!s) return null;
  const b = Array.isArray(s.brand) ? s.brand[0] : s.brand;
  if (!b) return null;
  return { styleId: s.style_id, styleName: s.name, brandName: b.name };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local): this worktree has no env, run the report from the main session.",
    );
    process.exit(1);
  }

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);
  const asOf = asOfFor(flags.month, today);
  const monthStart = `${flags.month}-01`;
  const monthEnd = nextMonthStart(flags.month);

  // Whole-table price read, paged past the 1000-row PostgREST cap. Ordered by
  // primary key so .range() pages are deterministic.
  const [rawRows, stylesRes, brandsRes, newStylesRes] = await Promise.all([
    fetchAllRows<RawPriceRow>(
      () =>
        sb
          .from("price_history")
          .select(
            "sale_price, currency, platform, price_type, observed_on, date_recorded, variant:variant_id!inner(style:style_id!inner(style_id, name, brand:brand_id!inner(name)))",
          )
          .not("sale_price", "is", null)
          .order("price_id", { ascending: true }),
      200000,
    ),
    sb.from("style").select("*", { count: "exact", head: true }),
    sb.from("brand").select("*", { count: "exact", head: true }),
    sb
      .from("style")
      .select("name, created_at, brand:brand_id(name)")
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)
      .order("created_at", { ascending: true }),
  ]);

  if (stylesRes.error) throw stylesRes.error;
  if (brandsRes.error) throw brandsRes.error;
  if (newStylesRes.error) throw newStylesRes.error;
  if (rawRows.length === 0) {
    console.error("price_history read returned 0 rows: check credentials/network before trusting an empty report.");
    process.exit(1);
  }

  const rows: ReportPriceRow[] = [];
  for (const r of rawRows) {
    const rel = styleOf(r);
    const price = r.sale_price != null ? Number(r.sale_price) : NaN;
    const effectiveDate = r.observed_on ?? r.date_recorded;
    if (!rel || !Number.isFinite(price) || price <= 0 || !effectiveDate) continue;
    rows.push({
      ...rel,
      price,
      currency: r.currency,
      platform: r.platform,
      priceType: r.price_type,
      effectiveDate,
    });
  }

  const { usd, nonUsd } = splitByCurrency(rows);
  const newStyles: NewStyle[] = (newStylesRes.data ?? []).map((s) => {
    const b = Array.isArray(s.brand) ? s.brand[0] : s.brand;
    return {
      brand: (b as { name: string } | null)?.name ?? "Unknown",
      style: s.name as string,
      addedOn: String(s.created_at).slice(0, 10),
    };
  });

  const report = renderReport({
    month: flags.month,
    asOf,
    totalPriceRows: rows.length,
    totalStyles: stylesRes.count ?? 0,
    totalBrands: brandsRes.count ?? 0,
    stylesCovered: stylesWithPrices(rows),
    usdRowCount: usd.length,
    nonUsdRowCount: nonUsd.length,
    brandStats: brandAskingStats(usd, asOf),
    movers: styleMovers(usd, asOf),
    newStyles,
  });

  if (flags.write) {
    const dir = path.resolve(__dirname, "../docs/research-drafts/market-reports");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${flags.month}.md`);
    await writeFile(file, report + "\n", "utf8");
    console.log(`Wrote ${path.relative(path.resolve(__dirname, ".."), file)}`);
  } else {
    console.log(report);
    console.log("\n[dry run: pass --write to save to docs/research-drafts/market-reports/]");
  }
}

main().catch((err) => {
  console.error("market-report failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
