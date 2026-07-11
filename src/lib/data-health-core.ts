/**
 * Data health & completeness — the PURE core (no I/O, fully unit-tested).
 *
 * scripts/data-health.ts is the thin DB layer: it gathers raw metrics from
 * Supabase, hands them to these functions, and writes the outputs. Everything
 * that decides anything — per-check scoring, the overall roll-up, trend deltas,
 * the daily→weekly graduation state machine, the markdown report, the
 * worklist section splice — lives here so it can be tested without a database.
 *
 * The routine's contract (owner-locked 2026-07-10):
 *   - runs daily until the overall score has been GREEN for GRADUATION_STREAK
 *     consecutive runs, then graduates itself to weekly (Mondays); any RED on a
 *     weekly run demotes it back to daily,
 *   - every run renders a dated report; red checks also open GitHub issues
 *     (the workflow reads state.json — this core only shapes the payload),
 *   - yellow/red findings feed docs/data-content-worklist.md inside a
 *     marker-delimited section; nothing outside the markers is ever touched.
 */

export type CheckStatus = "green" | "yellow" | "red" | "info";

export interface CheckResult {
  /** Stable id — the worklist dedupe key ([dh:<id>]) and the issue-title key. */
  id: string;
  label: string;
  status: CheckStatus;
  /** Human-readable current value, e.g. "0.4 days old" or "71.2%". */
  value: string;
  /** Numeric form of the value, persisted to state for next-run deltas. */
  metric?: number;
  /** Previous run's metric (null/undefined on the first run). */
  previous?: number | null;
  /** One plain-English sentence saying what is wrong (empty when green/info). */
  plainEnglish: string;
  /** What to do about it (empty when green/info). */
  action?: string;
}

export interface HealthState {
  version: 1;
  cadence: "daily" | "weekly";
  /** ISO day-of-week the weekly run fires on (1 = Monday), read by the workflow gate. */
  weeklyDow: number;
  greenStreak: number;
  lastRun: string; // YYYY-MM-DD
  overall: CheckStatus;
  /** Metric snapshot for next-run deltas, keyed by check id. */
  metrics: Record<string, number>;
  /** Rows-added-per-run history (newest last), for the capture-sanity baseline. */
  rowsAddedHistory: number[];
  /** Open findings and when they first appeared, for worklist lifecycle. */
  findings: Record<string, { firstSeen: string; status: "yellow" | "red" }>;
  /** Red checks of THIS run, read by the workflow's issue step via jq. */
  redFindings: Array<{ id: string; title: string; body: string }>;
}

/** Consecutive green daily runs required before the routine goes weekly. */
export const GRADUATION_STREAK = 7;

export function emptyState(today: string): HealthState {
  return {
    version: 1,
    cadence: "daily",
    weeklyDow: 1,
    greenStreak: 0,
    lastRun: today,
    overall: "green",
    metrics: {},
    rowsAddedHistory: [],
    findings: {},
    redFindings: [],
  };
}

/** Parse persisted state; null on shape/version mismatch (treat as first run). */
export function parseState(raw: string): HealthState | null {
  try {
    const s = JSON.parse(raw) as HealthState;
    if (s == null || typeof s !== "object" || s.version !== 1) return null;
    if (s.cadence !== "daily" && s.cadence !== "weekly") return null;
    return {
      ...s,
      metrics: s.metrics ?? {},
      rowsAddedHistory: Array.isArray(s.rowsAddedHistory) ? s.rowsAddedHistory : [],
      findings: s.findings ?? {},
      redFindings: Array.isArray(s.redFindings) ? s.redFindings : [],
    };
  } catch {
    return null;
  }
}

// ── Source registry ───────────────────────────────────────────────────────────

/**
 * Per-source freshness expectations, seeded from each capture workflow's OWN
 * promised cadence (this block and the crons must be tuned together — the
 * cadence audit checks whether the promised cadence still matches how fast the
 * market moves):
 *   Fashionphile  market-refresh.yml  "17 STAR/3 STAR STAR STAR"  (every 3h, free Shopify feed)
 *   TheRealReal   trr-refresh.yml     "31 4 STAR/2 STAR STAR"     (every 2d, paid Apify actor)
 *   TLC           ingest-tlc.yml      "23 8 STAR STAR STAR"       (daily, CJ feed)
 *   eBay          dispatch-only by design — sold comps are permanent historical
 *                 data, so age is reported but never scores.
 */
export interface SourceConfig {
  id: string;
  label: string;
  /** ilike fragment matched against price_history.platform (labels vary, e.g. "The RealReal"). */
  platformMatch: string;
  /** null → info-only source (never scores). */
  greenMaxDays: number | null;
  yellowMaxDays: number | null;
  /** The configured snapshot interval in days, for the cadence audit. */
  configuredIntervalDays: number | null;
  /** Spend consequence of running this source faster (shown with cadence findings). */
  costNote: string;
}

export const SOURCES: SourceConfig[] = [
  {
    id: "fashionphile",
    label: "Fashionphile",
    platformMatch: "%fashionphile%",
    greenMaxDays: 1,
    yellowMaxDays: 2,
    configuredIntervalDays: 0.125,
    costNote: "free Shopify feed, faster costs nothing",
  },
  {
    id: "therealreal",
    label: "TheRealReal",
    platformMatch: "%realreal%",
    greenMaxDays: 3,
    yellowMaxDays: 5,
    configuredIntervalDays: 2,
    costNote: "paid Apify actor, faster raises the monthly Apify spend",
  },
  {
    id: "tlc",
    label: "The Luxury Closet",
    platformMatch: "%luxury closet%",
    greenMaxDays: 2,
    yellowMaxDays: 3,
    configuredIntervalDays: 1,
    costNote: "CJ feed, effectively free to run faster",
  },
  {
    id: "ebay",
    label: "eBay (sold)",
    platformMatch: "%ebay%",
    greenMaxDays: null,
    yellowMaxDays: null,
    configuredIntervalDays: null, // dispatch-only: exempt from the cadence audit
    costNote: "Apify credits per run; sold comps are permanent, cadence is a spend choice",
  },
];

// ── Small math helpers ────────────────────────────────────────────────────────

/** p-th percentile (0–100) of values via nearest-rank; null on empty input. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1];
}

export function median(values: number[]): number | null {
  return percentile(values, 50);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pctStr(n: number): string {
  return `${round1(n)}%`;
}

// ── Per-check scoring (all pure) ──────────────────────────────────────────────

/** A. Freshness: newest observation age vs the source's promised cadence. */
export function scoreFreshness(source: SourceConfig, ageDays: number | null): CheckResult {
  const id = `freshness-${source.id}`;
  if (ageDays == null) {
    return {
      id,
      label: `${source.label} freshness`,
      status: source.greenMaxDays == null ? "info" : "red",
      value: "no rows found",
      plainEnglish:
        source.greenMaxDays == null
          ? ""
          : `No ${source.label} price rows were found at all, so either the platform label changed or the pipe never ran.`,
      action:
        source.greenMaxDays == null
          ? ""
          : `Check the ${source.label} capture workflow's last run in GitHub Actions.`,
    };
  }
  const value = `${round1(ageDays)} day(s) since the newest listing observation`;
  if (source.greenMaxDays == null) {
    return { id, label: `${source.label} freshness`, status: "info", value, metric: ageDays, plainEnglish: "" };
  }
  let status: CheckStatus = "green";
  if (ageDays > (source.yellowMaxDays as number)) status = "red";
  else if (ageDays > source.greenMaxDays) status = "yellow";
  return {
    id,
    label: `${source.label} freshness`,
    status,
    value,
    metric: ageDays,
    plainEnglish:
      status === "green"
        ? ""
        : `${source.label} data is ${round1(ageDays)} days old but its schedule promises a refresh every ${source.configuredIntervalDays} day(s), so the capture likely stopped running.`,
    action: status === "green" ? "" : `Open GitHub Actions and check the ${source.label} refresh workflow's recent runs.`,
  };
}

/** B. Capture sanity: rows landed since yesterday, vs the recent per-run baseline. */
export function scoreRowsAdded(added: number, history: number[]): CheckResult {
  const base = median(history.slice(-14));
  if (added === 0) {
    return {
      id: "capture-rows",
      label: "New price rows (last ~24h)",
      status: "red",
      value: "0 rows",
      metric: 0,
      plainEnglish:
        "Zero price rows landed since yesterday, but Fashionphile alone should land rows eight times a day, so the ingest pipes look down.",
      action: "Check market-refresh.yml and ingest-tlc.yml runs in GitHub Actions.",
    };
  }
  if (base != null && base > 0 && added > 5 * base) {
    return {
      id: "capture-rows",
      label: "New price rows (last ~24h)",
      status: "yellow",
      value: `${added} rows (recent baseline ~${Math.round(base)}/run)`,
      metric: added,
      plainEnglish: `${added} rows landed since yesterday, over five times the recent baseline of ~${Math.round(base)}; fine if a catalog sweep ran, worth a look if not.`,
      action: "Confirm a deliberate capture sweep ran; if not, inspect the newest price_history rows for a malformed load.",
    };
  }
  return {
    id: "capture-rows",
    label: "New price rows (last ~24h)",
    status: "green",
    value: `${added} rows`,
    metric: added,
    plainEnglish: "",
  };
}

/** C1. Ranked-style count vs last run (the LC Index n-gate survivors). */
export function scoreRankedCount(current: number, previous: number | null): CheckResult {
  let status: CheckStatus = "green";
  if (previous != null && previous > 0) {
    if (current < previous * 0.9) status = "red";
    else if (current < previous) status = "yellow";
  }
  return {
    id: "ranking-count",
    label: "Styles ranked by the LC Index",
    status,
    value: `${current} styles clear the floor (>=20 comps + >=2 sources)`,
    metric: current,
    previous,
    plainEnglish:
      status === "green"
        ? ""
        : `The number of ranked styles fell from ${previous} to ${current}; a data problem may be knocking styles below the ranking floor.`,
    action: status === "green" ? "" : "Compare style_index_signals output with the last report to see which styles dropped and why.",
  };
}

/** C2. lc_index_snapshot age — it is a monthly capture. */
export function scoreSnapshotAge(latestMonth: string | null, today: string): CheckResult {
  const thisMonth = today.slice(0, 7);
  const [y, m] = thisMonth.split("-").map(Number);
  const lastMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  let status: CheckStatus;
  let plain = "";
  if (latestMonth == null) {
    status = "yellow";
    plain = "No LC Index snapshot exists yet, so the ranking movement pills have nothing to compare against.";
  } else {
    const month = latestMonth.slice(0, 7);
    if (month === thisMonth || month === lastMonth) status = "green";
    else {
      const monthsBehind = (y - Number(month.slice(0, 4))) * 12 + (m - Number(month.slice(5, 7)));
      status = monthsBehind >= 2 ? "red" : "yellow";
      plain = `The newest LC Index snapshot is from ${month}, so the monthly snapshot cron has missed at least one month.`;
    }
  }
  return {
    id: "ranking-snapshot",
    label: "LC Index monthly snapshot",
    status,
    value: latestMonth == null ? "none yet" : `latest ${latestMonth.slice(0, 7)}`,
    plainEnglish: plain,
    action: status === "green" ? "" : "The monthly cron fires on the 1st (CRON_SECRET verified set in Vercel prod, 2026-07-10); to backfill now, curl /api/cron/lc-index-snapshot with the Bearer secret.",
  };
}

/**
 * D. Attribute coverage, DELTA-scored (no absolute floors: coverage legitimately
 * dips when a batch of bare styles is promoted). First run baselines green.
 */
export function scoreCoverageDelta(
  id: string,
  label: string,
  pct: number,
  previousPct: number | null,
  action: string,
): CheckResult {
  let status: CheckStatus = "green";
  if (previousPct != null) {
    const drop = previousPct - pct;
    if (drop >= 5) status = "red";
    else if (drop >= 2) status = "yellow";
  }
  return {
    id,
    label,
    status,
    value: pctStr(pct),
    metric: pct,
    previous: previousPct,
    plainEnglish:
      status === "green"
        ? ""
        : `${label} fell from ${pctStr(previousPct as number)} to ${pctStr(pct)} since the last run.`,
    action: status === "green" ? "" : action,
  };
}

/** E. discovered_listing backlog growth. */
export function scoreBacklogGrowth(total: number, previous: number | null): CheckResult {
  let status: CheckStatus = "green";
  if (previous != null && previous > 0) {
    if (total > previous * 1.25) status = "red";
    else if (total > previous * 1.1) status = "yellow";
  }
  return {
    id: "backlog-total",
    label: "Discovered-listing backlog",
    status,
    value: `${total} unpromoted rows`,
    metric: total,
    previous,
    plainEnglish:
      status === "green"
        ? ""
        : `The unpromoted backlog grew from ${previous} to ${total} rows since the last run; capture is outpacing promotion.`,
    action: status === "green" ? "" : "Schedule a promotion session (promote-safe --create-new) or grow the dictionary coverage.",
  };
}

/** F1. Non-bag leak-back: recent TRR rows that fail the handbag gate today. */
export function scoreContamination(failCount: number, sampleSize: number): CheckResult {
  let status: CheckStatus = "green";
  if (failCount > 20) status = "red";
  else if (failCount > 0) status = "yellow";
  return {
    id: "contamination-trr",
    label: "TRR non-bag leak-back (last 7 days)",
    status,
    value: `${failCount} of ${sampleSize} recent TRR rows fail the handbag gate`,
    metric: failCount,
    plainEnglish:
      status === "green"
        ? ""
        : `${failCount} TRR rows captured in the last week would fail today's non-bag filter, so non-bag items are leaking back in.`,
    action: status === "green" ? "" : "Run the TRR non-bag cleanup scripts (cleanup-trr-nonbag.ts) and check the ingest gate.",
  };
}

/** F2. Same-day duplicate observations of one listing (dedupe-key violations). */
export function scoreDuplicates(dupCount: number): CheckResult {
  let status: CheckStatus = "green";
  if (dupCount > 100) status = "red";
  else if (dupCount > 0) status = "yellow";
  return {
    id: "contamination-dupes",
    label: "Same-day duplicate listing rows (last ~24h)",
    status,
    value: `${dupCount} duplicate (listing, day) rows`,
    metric: dupCount,
    plainEnglish:
      status === "green"
        ? ""
        : `${dupCount} listings were written more than once for the same observation day, which contaminates medians until deduped.`,
    action: status === "green" ? "" : "Inspect the newest loads; the loader should upsert on platform|listing_ref|price_type|observed_on.",
  };
}

/** G. variant_price_summary staleness — the one condition the routine may auto-fix. */
export function scoreSummaryStaleness(asOfAgeHours: number | null, rowsAdded: number): CheckResult {
  const stale = asOfAgeHours != null && asOfAgeHours > 36 && rowsAdded > 0;
  return {
    id: "summary-staleness",
    label: "Price summary freshness",
    status: stale ? "yellow" : "green",
    value: asOfAgeHours == null ? "no as_of found" : `refreshed ${round1(asOfAgeHours)}h ago`,
    metric: asOfAgeHours ?? undefined,
    plainEnglish: stale
      ? `New price rows are landing but variant_price_summary was last rebuilt ${round1(asOfAgeHours as number)} hours ago, so pages are reading stale medians.`
      : "",
    action: stale ? "Auto-fixable: refresh_variant_price_summary (the routine runs this itself on --write)." : "",
  };
}

/**
 * H. Cadence audit — is each source's PROMISED refresh speed right for how fast
 * its market actually moves? Recommended interval <= the p10 listing lifetime, so
 * at most ~10% of listings can appear and sell entirely between two snapshots.
 * Honest limitation (stated in the report): listings that live shorter than the
 * current interval are invisible to us, so measured churn is a lower bound and
 * the recommendation is conservative. Never auto-changes a cron — cadence has
 * spend implications, so the decision stays with the owner.
 */
export function scoreCadenceAudit(source: SourceConfig, lifetimesDays: number[]): CheckResult {
  const id = `cadence-${source.id}`;
  const label = `${source.label} refresh cadence`;
  if (source.configuredIntervalDays == null) {
    return {
      id,
      label,
      status: "info",
      value: "dispatch-only by design (sold comps are permanent)",
      plainEnglish: "",
    };
  }
  if (lifetimesDays.length < 20) {
    return {
      id,
      label,
      status: "info",
      value: `only ${lifetimesDays.length} retired listings in the last 30 days (need 20+ to estimate churn)`,
      plainEnglish: "",
    };
  }
  const p10 = percentile(lifetimesDays, 10) as number;
  const med = median(lifetimesDays) as number;
  const value = `configured every ${source.configuredIntervalDays}d; observed lifetime median ${round1(med)}d, p10 ${round1(p10)}d (n=${lifetimesDays.length})`;
  const p10Phrase = p10 < 1 ? "within the same day they appeared" : `within ${round1(p10)} day(s) of first being seen`;
  if (source.configuredIntervalDays > p10) {
    // Flag only when there is an ACTIONABLE tightening. Daily is the practical
    // floor for a scheduled capture, so sub-day churn on an already-daily
    // source is an honest known loss, not a recommendation.
    const recommended = Math.max(1, Math.floor(p10));
    if (recommended < source.configuredIntervalDays) {
      return {
        id,
        label,
        status: "yellow",
        value,
        metric: p10,
        plainEnglish: `${source.label} listings churn faster than we snapshot: 10% of retired listings were gone ${p10Phrase}, but we only look every ${source.configuredIntervalDays} days, so our estimate is we miss some listings entirely (${source.costNote}).`,
        action: `Owner call: consider moving ${source.label}'s refresh cron toward every ${recommended} day(s); it can change spend.`,
      };
    }
    return {
      id,
      label,
      status: "info",
      value,
      metric: p10,
      plainEnglish: `Some ${source.label} listings are gone ${p10Phrase}; we already refresh at the practical floor (every ${source.configuredIntervalDays}d), so that slice is a known, accepted loss.`,
    };
  }
  if (source.configuredIntervalDays < p10 / 4) {
    return {
      id,
      label,
      status: "info",
      value,
      metric: p10,
      plainEnglish: `${source.label} refreshes much faster than its market moves; slowing down would lose little (${source.costNote}).`,
    };
  }
  return { id, label, status: "green", value, metric: p10, plainEnglish: "" };
}

// ── Roll-up + graduation ──────────────────────────────────────────────────────

/** Overall = the worst non-info status. */
export function overallStatus(checks: CheckResult[]): CheckStatus {
  const scored = checks.filter((c) => c.status !== "info");
  if (scored.some((c) => c.status === "red")) return "red";
  if (scored.some((c) => c.status === "yellow")) return "yellow";
  return "green";
}

export interface Transition {
  cadence: "daily" | "weekly";
  greenStreak: number;
  /** Human line announcing a cadence change, or null when nothing changed. */
  announcement: string | null;
}

/**
 * The graduation state machine:
 *   green  → streak+1; at GRADUATION_STREAK while daily → weekly
 *   yellow → streak resets (no demotion)
 *   red    → streak resets; while weekly → demote to daily
 */
export function nextCadence(
  prev: Pick<HealthState, "cadence" | "greenStreak">,
  overall: CheckStatus,
): Transition {
  if (overall === "red") {
    const demoted = prev.cadence === "weekly";
    return {
      cadence: "daily",
      greenStreak: 0,
      announcement: demoted
        ? "A red check on a weekly run: the routine has moved itself back to DAILY checks until things are stable again."
        : null,
    };
  }
  if (overall === "yellow") {
    return { cadence: prev.cadence, greenStreak: 0, announcement: null };
  }
  const streak = prev.greenStreak + 1;
  if (prev.cadence === "daily" && streak >= GRADUATION_STREAK) {
    return {
      cadence: "weekly",
      greenStreak: streak,
      announcement: `${GRADUATION_STREAK} green runs in a row: the routine has graduated itself to WEEKLY checks (Mondays). A red check will bring it back to daily.`,
    };
  }
  return { cadence: prev.cadence, greenStreak: streak, announcement: null };
}

// ── Findings lifecycle + renderers ────────────────────────────────────────────

const STATUS_EMOJI: Record<CheckStatus, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
  info: "ℹ️",
};

/**
 * Advance the findings ledger: yellow/red checks are open findings (keeping
 * their original firstSeen); a finding whose check went green is RESOLVED this
 * run (rendered once as ✅, then dropped next run).
 */
export function nextFindings(
  prevFindings: HealthState["findings"],
  checks: CheckResult[],
  today: string,
): { open: HealthState["findings"]; resolved: string[] } {
  const open: HealthState["findings"] = {};
  const resolved: string[] = [];
  const byId = new Map(checks.map((c) => [c.id, c]));
  for (const c of checks) {
    if (c.status === "yellow" || c.status === "red") {
      open[c.id] = { firstSeen: prevFindings[c.id]?.firstSeen ?? today, status: c.status };
    }
  }
  for (const id of Object.keys(prevFindings)) {
    const c = byId.get(id);
    if (c && (c.status === "green" || c.status === "info")) resolved.push(id);
  }
  return { open, resolved };
}

export const WORKLIST_BEGIN =
  "<!-- data-health:begin (auto-managed by scripts/data-health.ts — edit outside the markers only) -->";
export const WORKLIST_END = "<!-- data-health:end -->";

/** Render the auto-managed worklist section body (between the markers). */
export function renderWorklistSection(
  checks: CheckResult[],
  findings: HealthState["findings"],
  resolved: string[],
  today: string,
): string {
  const lines: string[] = ["## DATA HEALTH FINDINGS (auto-updated by the daily data-health run)"];
  const byId = new Map(checks.map((c) => [c.id, c]));
  const openIds = Object.keys(findings);
  for (const id of openIds) {
    const c = byId.get(id);
    if (!c) continue;
    const f = findings[id];
    lines.push(
      `- ⬜ [dh:${id}] ${c.plainEnglish} Action: ${c.action || "see the day's report."} (first seen ${f.firstSeen}, last seen ${today}, ${f.status})`,
    );
  }
  for (const id of resolved) {
    const c = byId.get(id);
    lines.push(`- ✅ [dh:${id}] resolved ${today}${c ? ` (${c.label} is back to normal)` : ""}`);
  }
  if (openIds.length === 0 && resolved.length === 0) {
    lines.push(`- (nothing open — last run ${today} was clean)`);
  }
  return lines.join("\n");
}

/**
 * Splice the section into the worklist file content. Pure string transform:
 * replaces whatever sits between the markers, or appends the whole block at the
 * end when the markers are missing. Never touches anything outside the markers.
 */
export function spliceWorklist(fileContent: string, sectionBody: string): string {
  const block = `${WORKLIST_BEGIN}\n${sectionBody}\n${WORKLIST_END}`;
  const begin = fileContent.indexOf(WORKLIST_BEGIN);
  const end = fileContent.indexOf(WORKLIST_END);
  if (begin !== -1 && end !== -1 && end > begin) {
    return fileContent.slice(0, begin) + block + fileContent.slice(end + WORKLIST_END.length);
  }
  const sep = fileContent.endsWith("\n") ? "\n" : "\n\n";
  return `${fileContent}${sep}${block}\n`;
}

/** Shape the red-check payload the workflow's issue step reads from state.json. */
export function redIssuePayload(checks: CheckResult[], today: string): HealthState["redFindings"] {
  return checks
    .filter((c) => c.status === "red")
    .map((c) => ({
      id: c.id,
      title: `Data health: ${c.id} is RED`,
      body: `${c.plainEnglish}\n\nCurrent value: ${c.value}\nSuggested action: ${c.action || "see the report."}\nReport: reports/data-health/${today}.md`,
    }));
}

export interface ReportInput {
  today: string;
  checks: CheckResult[];
  overall: CheckStatus;
  cadence: "daily" | "weekly";
  greenStreak: number;
  announcement: string | null;
  /** Lines describing auto-fixes the runner performed (empty on dry runs). */
  autoFixes: string[];
}

/** Render the dated markdown report. Leads with the score + plain-English asks. */
export function renderReport(input: ReportInput): string {
  const { today, checks, overall, cadence, greenStreak, announcement, autoFixes } = input;
  const streakNote =
    cadence === "daily" ? ` (green streak ${greenStreak}/${GRADUATION_STREAK} toward weekly)` : " (weekly cadence)";
  const lines: string[] = [
    `# Data health — ${today} — ${STATUS_EMOJI[overall]} ${overall.toUpperCase()}${streakNote}`,
    "",
  ];
  if (announcement) {
    lines.push(`> ${announcement}`, "");
  }

  const attention = checks.filter((c) => c.status === "yellow" || c.status === "red");
  lines.push("## What needs attention", "");
  if (attention.length === 0) {
    lines.push("Nothing. Every scored check is green.", "");
  } else {
    for (const c of attention) {
      lines.push(`- ${STATUS_EMOJI[c.status]} **${c.label}** — ${c.plainEnglish}${c.action ? ` → ${c.action}` : ""}`);
    }
    lines.push("");
  }

  if (autoFixes.length > 0) {
    lines.push("## Auto-fixed this run", "");
    for (const f of autoFixes) lines.push(`- ${f}`);
    lines.push("");
  }

  lines.push("## All checks", "", "| Check | Status | Value | Trend |", "|---|---|---|---|");
  for (const c of checks) {
    let trend = "";
    if (c.metric != null && c.previous != null) {
      const d = Math.round((c.metric - c.previous) * 10) / 10;
      trend = d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : "→ flat";
    }
    lines.push(`| ${c.label} | ${STATUS_EMOJI[c.status]} ${c.status} | ${c.value} | ${trend} |`);
  }
  lines.push(
    "",
    "*Scope notes: coverage checks are delta-scored (a drop flags, an absolute level does not, because promoting bare styles legitimately dips coverage). " +
      "Cadence-audit lifetimes only see listings that lived long enough to be observed at least once, so churn is a lower bound and recommendations are our conservative estimate, not a verdict. " +
      "eBay sold comps are permanent historical data and never flag on age.*",
    "",
  );
  return lines.join("\n");
}

/** Compose next state from this run's outcome. */
export function nextState(
  prev: HealthState,
  today: string,
  checks: CheckResult[],
  transition: Transition,
  rowsAdded: number,
): HealthState {
  const metrics: Record<string, number> = {};
  for (const c of checks) {
    if (c.metric != null && Number.isFinite(c.metric)) metrics[c.id] = c.metric;
  }
  const { open } = nextFindings(prev.findings, checks, today);
  return {
    version: 1,
    cadence: transition.cadence,
    weeklyDow: prev.weeklyDow,
    greenStreak: transition.greenStreak,
    lastRun: today,
    overall: overallStatus(checks),
    metrics,
    rowsAddedHistory: [...prev.rowsAddedHistory, rowsAdded].slice(-30),
    findings: open,
    redFindings: redIssuePayload(checks, today),
  };
}
