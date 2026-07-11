/**
 * Daily data health & completeness check — the thin DB + file layer.
 *
 * Gathers raw metrics from Supabase (cheap head-count queries wherever
 * possible), scores them with the pure core (src/lib/data-health-core.ts),
 * and renders:
 *   - reports/data-health/<YYYY-MM-DD>.md   (the owner-facing report)
 *   - reports/data-health/state.json        (machine state: deltas, streak,
 *                                            cadence, red findings for the
 *                                            workflow's issue step)
 *   - the marker-delimited DATA HEALTH section in docs/data-content-worklist.md
 *
 * Dry run (prints report, touches nothing, never auto-fixes):
 *   npx tsx scripts/data-health.ts
 * Write outputs + run the one safe auto-fix (stale variant_price_summary):
 *   npx tsx scripts/data-health.ts --write
 *
 * Scheduled by .github/workflows/data-health.yml (daily; the workflow gate
 * reads state.json's cadence flag and skips non-Monday runs once the routine
 * has graduated itself to weekly — see the core's nextCadence()).
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

import { fetchAllRows } from "../src/lib/supabase";
import { isTrrHandbagListing } from "../src/lib/ingest/trr";
import {
  SOURCES,
  emptyState,
  nextCadence,
  nextFindings,
  nextState,
  overallStatus,
  parseState,
  renderReport,
  renderWorklistSection,
  scoreBacklogGrowth,
  scoreCadenceAudit,
  scoreContamination,
  scoreCoverageDelta,
  scoreDuplicates,
  scoreFreshness,
  scoreRankedCount,
  scoreRowsAdded,
  scoreSnapshotAge,
  scoreSummaryStaleness,
  spliceWorklist,
  type CheckResult,
  type HealthState,
} from "../src/lib/data-health-core";
import { LC_INDEX_MIN_N, LC_INDEX_MIN_SOURCES } from "../src/lib/lc-index";

dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true, quiet: true });

const REPORT_DIR = path.resolve(__dirname, "../reports/data-health");
const STATE_PATH = path.join(REPORT_DIR, "state.json");
const WORKLIST_PATH = path.resolve(__dirname, "../docs/data-content-worklist.md");

const write = process.argv.includes("--write");

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number, from: Date): string {
  return isoDay(new Date(from.getTime() - n * 86_400_000));
}

/** Cheap exact head-count with arbitrary filters. */
async function count(
  sb: SupabaseClient,
  table: string,
  apply: (q: ReturnType<ReturnType<SupabaseClient["from"]>["select"]>) => unknown,
): Promise<number> {
  const q = sb.from(table).select("*", { count: "exact", head: true });
  const { count: n, error } = (await apply(q)) as { count: number | null; error: { message: string } | null };
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return n ?? 0;
}

/** Age in days of the newest observed_on for a platform match, or null when none. */
async function freshnessAge(sb: SupabaseClient, platformMatch: string, now: Date): Promise<number | null> {
  const { data, error } = await sb
    .from("price_history")
    .select("observed_on")
    .ilike("platform", platformMatch)
    .not("observed_on", "is", null)
    .order("observed_on", { ascending: false })
    .limit(1);
  if (error) throw new Error(`freshness(${platformMatch}) failed: ${error.message}`);
  const newest = data?.[0]?.observed_on as string | undefined;
  if (!newest) return null;
  return (now.getTime() - new Date(`${newest}T00:00:00Z`).getTime()) / 86_400_000;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local): run from a tree with env (or GitHub Actions).",
    );
    process.exit(1);
  }
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  const now = new Date();
  const today = isoDay(now);
  const yesterday = daysAgo(1, now);
  const weekAgo = daysAgo(7, now);
  const monthAgo = daysAgo(30, now);

  // Previous state (deltas + streak); absent/corrupt = first run.
  let prev: HealthState;
  try {
    prev = parseState(await readFile(STATE_PATH, "utf8")) ?? emptyState(today);
  } catch {
    prev = emptyState(today);
  }

  const checks: CheckResult[] = [];

  // ── A. Freshness per source ──────────────────────────────────────────────
  for (const source of SOURCES) {
    checks.push(scoreFreshness(source, await freshnessAge(sb, source.platformMatch, now)));
  }

  // ── B. Capture sanity (date_recorded is a DATE, so ">= yesterday" spans
  //       roughly the last 24-34h depending on run time — documented behavior).
  const rowsAdded = await count(sb, "price_history", (q) => q.gte("date_recorded", yesterday));
  checks.push(scoreRowsAdded(rowsAdded, prev.rowsAddedHistory));

  // ── C. Ranking health ────────────────────────────────────────────────────
  const { data: signals, error: sigErr } = await sb.rpc("style_index_signals");
  if (sigErr) throw new Error(`style_index_signals failed: ${sigErr.message}`);
  type SignalRow = { resale_median: unknown; price_count: unknown; source_count?: unknown };
  const rows = (signals ?? []) as SignalRow[];
  const ranked = rows.filter(
    (r) =>
      r.resale_median != null &&
      Number(r.price_count) >= LC_INDEX_MIN_N &&
      Number(r.source_count ?? LC_INDEX_MIN_SOURCES) >= LC_INDEX_MIN_SOURCES,
  ).length;
  const nearFloor = rows.filter((r) => {
    const n = Number(r.price_count);
    return r.resale_median != null && n >= LC_INDEX_MIN_N && n < LC_INDEX_MIN_N + 5;
  }).length;
  checks.push(scoreRankedCount(ranked, prev.metrics["ranking-count"] ?? null));
  checks.push({
    id: "ranking-near-floor",
    label: "Styles near the ranking floor",
    status: "info",
    value: `${nearFloor} styles at ${LC_INDEX_MIN_N}-${LC_INDEX_MIN_N + 4} comps (could unrank on a data wobble)`,
    metric: nearFloor,
    previous: prev.metrics["ranking-near-floor"] ?? null,
    plainEnglish: "",
  });

  const { data: snap, error: snapErr } = await sb
    .from("lc_index_snapshot")
    .select("captured_month")
    .order("captured_month", { ascending: false })
    .limit(1);
  if (snapErr) throw new Error(`lc_index_snapshot read failed: ${snapErr.message}`);
  checks.push(scoreSnapshotAge((snap?.[0]?.captured_month as string | undefined) ?? null, today));

  // ── D. Attribute coverage (delta-scored) ─────────────────────────────────
  const phTotal = await count(sb, "price_history", (q) => q);
  const listedTotal = await count(sb, "price_history", (q) => q.eq("price_type", "listed"));
  const coverage: Array<{ id: string; label: string; pct: number; action: string }> = [];
  const phPct = async (col: string, base: number, listedOnly: boolean) => {
    const n = await count(sb, "price_history", (q) =>
      listedOnly ? q.eq("price_type", "listed").not(col, "is", null) : q.not(col, "is", null),
    );
    return base === 0 ? 0 : (100 * n) / base;
  };
  coverage.push({
    id: "coverage-condition",
    label: "Condition coverage (listed rows)",
    pct: await phPct("condition", listedTotal, true),
    action: "Run the condition backfill lane (condition-backfill.yml).",
  });
  coverage.push({
    id: "coverage-condition-detail",
    label: "Condition-detail coverage (listed rows)",
    pct: await phPct("condition_detail", listedTotal, true),
    action: "Check the per-listing enrichment paths (eBay item details, FP enrich).",
  });
  coverage.push({
    id: "coverage-region",
    label: "Region coverage (all rows)",
    pct: await phPct("region", phTotal, false),
    action: "Check the feed country-tag mapping in the Fashionphile backfill.",
  });
  coverage.push({
    id: "coverage-production-year",
    label: "Production-year coverage (all rows)",
    pct: await phPct("production_year", phTotal, false),
    action: "Data-limited by sources; investigate only if this DROPPED (a loader regression).",
  });
  coverage.push({
    id: "coverage-hardware",
    label: "Hardware-color coverage (all rows)",
    pct: await phPct("hardware_color", phTotal, false),
    action: "Check the spec-extract vocab (src/lib/ingest/spec-extract.ts) against recent titles.",
  });

  const styleTotal = await count(sb, "style", (q) => q);
  const styleDesc = await count(sb, "style", (q) => q.not("description", "is", null));
  const styleYear = await count(sb, "style", (q) => q.not("year_introduced", "is", null));
  coverage.push({
    id: "coverage-style-description",
    label: "Style descriptions",
    pct: styleTotal === 0 ? 0 : (100 * styleDesc) / styleTotal,
    action: "Queue a page-depth batch (docs/data-content-worklist.md PAGE-DEPTH lane).",
  });
  coverage.push({
    id: "coverage-style-year",
    label: "Style intro years",
    pct: styleTotal === 0 ? 0 : (100 * styleYear) / styleTotal,
    action: "Queue a page-depth batch; hold unsourced years null (never invent).",
  });

  // Image coverage: listing_image is per live listing (platform, listing_ref),
  // populated only by feed sources (TLC today), so measure against live listed
  // rows on the platforms that actually have images.
  const { data: imgPlatformRows, error: imgErr } = await sb.from("listing_image").select("platform").limit(1000);
  if (imgErr) throw new Error(`listing_image read failed: ${imgErr.message}`);
  const imgPlatforms = [...new Set((imgPlatformRows ?? []).map((r) => r.platform as string))];
  if (imgPlatforms.length > 0) {
    const imgTotal = await count(sb, "listing_image", (q) => q);
    let liveOnImgPlatforms = 0;
    for (const p of imgPlatforms) {
      liveOnImgPlatforms += await count(sb, "price_history", (q) =>
        q.eq("price_type", "listed").or("listing_status.is.null,listing_status.eq.available").eq("platform", p),
      );
    }
    coverage.push({
      id: "coverage-listing-images",
      label: `Listing photos (${imgPlatforms.join(", ")})`,
      pct: liveOnImgPlatforms === 0 ? 0 : Math.min(100, (100 * imgTotal) / liveOnImgPlatforms),
      action: "Check the feed ingest's image upsert (listing_image) in the TLC action.",
    });
  }

  for (const c of coverage) {
    checks.push(scoreCoverageDelta(c.id, c.label, c.pct, prev.metrics[c.id] ?? null, c.action));
  }

  // ── E. Backlog ───────────────────────────────────────────────────────────
  const backlogTotal = await count(sb, "discovered_listing", (q) => q.is("promoted_variant_id", null));
  checks.push(scoreBacklogGrowth(backlogTotal, prev.metrics["backlog-total"] ?? null));
  const reasons = ["no_brand", "no_style", "no_variant"];
  const reasonCounts: string[] = [];
  for (const r of reasons) {
    const n = await count(sb, "discovered_listing", (q) => q.is("promoted_variant_id", null).eq("unresolved_reason", r));
    reasonCounts.push(`${r}: ${n}`);
  }
  checks.push({
    id: "backlog-breakdown",
    label: "Backlog by unresolved reason",
    status: "info",
    value: reasonCounts.join(" · "),
    plainEnglish: "",
  });

  // ── F. Contamination sentinels ───────────────────────────────────────────
  type TrrRow = { source_url: string | null; raw_name?: string | null };
  const [trrPh, trrDisc] = await Promise.all([
    fetchAllRows<TrrRow>(
      () =>
        sb
          .from("price_history")
          .select("source_url")
          .ilike("platform", "%realreal%")
          .gte("date_recorded", weekAgo)
          .order("price_id", { ascending: true }),
      20000,
    ),
    fetchAllRows<TrrRow>(
      () =>
        sb
          .from("discovered_listing")
          .select("source_url, raw_name")
          .ilike("platform", "%realreal%")
          .gte("captured_at", `${weekAgo}T00:00:00Z`)
          .order("discovered_id", { ascending: true }),
      20000,
    ),
  ]);
  const trrSample = [...trrPh, ...trrDisc];
  const trrFails = trrSample.filter((r) => r.source_url && !isTrrHandbagListing(r.source_url, r.raw_name ?? null)).length;
  checks.push(scoreContamination(trrFails, trrSample.length));

  type DupRow = { platform: string | null; listing_ref: string | null; price_type: string | null; observed_on: string | null };
  const recent = await fetchAllRows<DupRow>(
    () =>
      sb
        .from("price_history")
        .select("platform, listing_ref, price_type, observed_on")
        .gte("observed_on", yesterday)
        .not("listing_ref", "is", null)
        .order("price_id", { ascending: true }),
    60000,
  );
  const seen = new Map<string, number>();
  for (const r of recent) {
    const key = `${r.platform}|${r.listing_ref}|${r.price_type}|${r.observed_on}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  let dupRows = 0;
  for (const n of seen.values()) if (n > 1) dupRows += n - 1;
  checks.push(scoreDuplicates(dupRows));

  // ── G. Summary staleness (+ the one safe auto-fix) ───────────────────────
  const readSummaryAgeHours = async (): Promise<number | null> => {
    const { data, error } = await sb
      .from("variant_price_summary")
      .select("as_of")
      .order("as_of", { ascending: false })
      .limit(1);
    if (error) throw new Error(`variant_price_summary read failed: ${error.message}`);
    const asOf = data?.[0]?.as_of as string | undefined;
    return asOf ? (now.getTime() - new Date(asOf).getTime()) / 3_600_000 : null;
  };
  let summaryAge = await readSummaryAgeHours();
  const autoFixes: string[] = [];
  let summaryCheck = scoreSummaryStaleness(summaryAge, rowsAdded);
  if (summaryCheck.status === "yellow" && write) {
    const { error } = await sb.rpc("refresh_variant_price_summary");
    if (error) {
      autoFixes.push(`Tried to refresh variant_price_summary but the RPC failed: ${error.message}`);
    } else {
      summaryAge = await readSummaryAgeHours();
      const healed = summaryAge != null && summaryAge <= 36;
      autoFixes.push(
        healed
          ? `variant_price_summary was stale; refreshed it (as_of now ${Math.round((summaryAge as number) * 10) / 10}h old).`
          : "Refreshed variant_price_summary but as_of still reads stale; check the matview.",
      );
      if (healed) summaryCheck = scoreSummaryStaleness(summaryAge, rowsAdded);
    }
  }
  checks.push(summaryCheck);

  // ── H. Cadence audit ─────────────────────────────────────────────────────
  type RetiredRow = { listing_ref: string | null; observed_on: string | null; delisted_on: string | null };
  for (const source of SOURCES) {
    if (source.configuredIntervalDays == null) {
      checks.push(scoreCadenceAudit(source, []));
      continue;
    }
    const retired = await fetchAllRows<RetiredRow>(
      () =>
        sb
          .from("price_history")
          .select("listing_ref, observed_on, delisted_on")
          .ilike("platform", source.platformMatch)
          .eq("listing_status", "sold")
          .gte("delisted_on", monthAgo)
          .order("price_id", { ascending: true }),
      60000,
    );
    // Lifetime per listing = retirement date − FIRST observation.
    const firstSeen = new Map<string, string>();
    const retiredOn = new Map<string, string>();
    for (const r of retired) {
      if (!r.listing_ref || !r.observed_on || !r.delisted_on) continue;
      const cur = firstSeen.get(r.listing_ref);
      if (!cur || r.observed_on < cur) firstSeen.set(r.listing_ref, r.observed_on);
      retiredOn.set(r.listing_ref, r.delisted_on);
    }
    const lifetimes: number[] = [];
    for (const [ref, first] of firstSeen) {
      const end = retiredOn.get(ref);
      if (!end) continue;
      const days = (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${first}T00:00:00Z`).getTime()) / 86_400_000;
      if (days >= 0) lifetimes.push(days);
    }
    checks.push(scoreCadenceAudit(source, lifetimes));
  }

  // ── Score, transition, render ────────────────────────────────────────────
  const overall = overallStatus(checks);
  const transition = nextCadence(prev, overall);
  const state = nextState(prev, today, checks, transition, rowsAdded);
  const { open, resolved } = nextFindings(prev.findings, checks, today);
  const report = renderReport({
    today,
    checks,
    overall,
    cadence: transition.cadence,
    greenStreak: transition.greenStreak,
    announcement: transition.announcement,
    autoFixes,
  });

  if (!write) {
    console.log(report);
    console.log(`\n(dry run: nothing written, no auto-fixes ran. --write to save report + state + worklist.)`);
    return;
  }

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(path.join(REPORT_DIR, `${today}.md`), report, "utf8");
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const worklist = await readFile(WORKLIST_PATH, "utf8");
  const section = renderWorklistSection(checks, open, resolved, today);
  await writeFile(WORKLIST_PATH, spliceWorklist(worklist, section), "utf8");

  console.log(`Data health ${today}: ${overall.toUpperCase()} (streak ${transition.greenStreak}, cadence ${transition.cadence})`);
  console.log(`Wrote reports/data-health/${today}.md, state.json, and the worklist section.`);
  if (state.redFindings.length > 0) {
    console.log(`RED findings for the issue step: ${state.redFindings.map((f) => f.id).join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
