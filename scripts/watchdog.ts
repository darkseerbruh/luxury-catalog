/**
 * The watchdog: alarms on SILENCE, not on failure.
 *
 * Why this exists (2026-08-27). Every GitHub Action kept running through the
 * owner's month away and failed loudly the whole time. The twelve LOCAL
 * scheduled tasks ran on her Mac, went quiet on 2026-08-17 when the machine
 * closed, and sent nothing at all for ten days. A twice-daily inbox scan missed
 * roughly twenty runs in total silence.
 *
 * Failure alarms cannot catch that, because a job that never starts never
 * fails. So this checks the opposite condition: for every engine we depend on,
 * has it produced a successful run inside its allowed window? Ten dead days and
 * ten quiet days must never look the same again.
 *
 * Two kinds of engine:
 *   - `workflow`  — checked against the GitHub Actions API (last SUCCESSFUL run).
 *                   Needs no cooperation from the engine itself, so it cannot
 *                   drift out of sync with reality.
 *   - `heartbeat` — an engine that runs somewhere we cannot query (an agent run,
 *                   a local task). It writes reports/heartbeat/<id>.json when it
 *                   finishes; we read the timestamp. A missing file is a RED,
 *                   never a pass, so a never-installed heartbeat is loud.
 *
 * Output: reports/watchdog/state.json (redFindings in the data-health shape, so
 * the workflow can reuse the same issue open/close logic) plus a dated report.
 * Exit code is always 0; the findings, not the exit code, drive escalation.
 *
 * Usage: npx tsx scripts/watchdog.ts [--write]
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type Kind = "workflow" | "heartbeat";

interface Engine {
  id: string;
  label: string;
  kind: Kind;
  /** Workflow file name, for kind: "workflow". */
  file?: string;
  /** Hours of silence tolerated before this is RED. */
  maxSilentHours: number;
  /** Why this engine matters, quoted into the issue so the fixer has context. */
  matters: string;
}

/**
 * The cadence registry. maxSilentHours is deliberately ~2.5x the nominal
 * cadence: one missed run is noise (a runner hiccup, a rate limit), two in a
 * row is a real outage. Set it too tight and the watchdog becomes the thing
 * that cries wolf, which is how alarms get muted and how a month goes dark.
 */
const ENGINES: Engine[] = [
  // ---- capture: the comps the LC Index is built from ----
  {
    id: "market-refresh",
    label: "Fashionphile capture",
    kind: "workflow",
    file: "market-refresh.yml",
    maxSilentHours: 12,
    matters: "Largest single source of price comps. Silence here starves the LC Index.",
  },
  {
    id: "ingest-tlc",
    label: "TLC live listings",
    kind: "workflow",
    file: "ingest-tlc.yml",
    maxSilentHours: 60,
    matters: "Affiliate buy-links on bag pages go stale without it.",
  },
  {
    id: "ingest-rebag",
    label: "Rebag live listings",
    kind: "workflow",
    file: "ingest-rebag.yml",
    maxSilentHours: 60,
    matters: "Affiliate buy-links on bag pages go stale without it.",
  },
  {
    id: "mygemma-refresh",
    label: "myGemma listings",
    kind: "workflow",
    file: "mygemma-refresh.yml",
    maxSilentHours: 60,
    matters: "Licensed photos + buy-links come from this feed.",
  },
  {
    id: "redeluxe-refresh",
    label: "Redeluxe listings",
    kind: "workflow",
    file: "redeluxe-refresh.yml",
    maxSilentHours: 60,
    matters: "Free-tier capture lane.",
  },
  {
    id: "couture-usa-refresh",
    label: "Couture USA listings",
    kind: "workflow",
    file: "couture-usa-refresh.yml",
    maxSilentHours: 60,
    matters: "Free-tier capture lane.",
  },
  {
    id: "anns-refresh",
    label: "Ann's Fabulous Finds listings",
    kind: "workflow",
    file: "anns-refresh.yml",
    maxSilentHours: 60,
    matters: "Free-tier capture lane.",
  },
  {
    id: "trr-refresh",
    label: "TRR capture",
    kind: "workflow",
    file: "trr-refresh.yml",
    maxSilentHours: 120,
    matters: "Scheduled every 2 days; the paid Apify lane.",
  },

  // ---- health + credentials: the things that notice other things breaking ----
  {
    id: "data-health",
    label: "Daily data health",
    kind: "workflow",
    file: "data-health.yml",
    maxSilentHours: 60,
    matters:
      "The scorecard. It graduates to weekly after 7 green runs, so the window allows for that.",
  },
  {
    id: "cj-token-expiry",
    label: "CJ token alarm",
    kind: "workflow",
    file: "cj-token-expiry.yml",
    maxSilentHours: 60,
    matters: "The only warning before TLC + Rebag both 403.",
  },
  {
    id: "indexnow",
    label: "IndexNow submit",
    kind: "workflow",
    file: "indexnow.yml",
    maxSilentHours: 60,
    matters: "Search indexing for Bing, Yandex, Naver.",
  },

  // ---- the agent engines: these are the ones that went dark on 2026-08-17 ----
  {
    id: "vendor-inbox-scan",
    label: "Vendor inbox engine",
    kind: "heartbeat",
    maxSilentHours: 36,
    matters:
      "Twice daily. Reads vendor mail and acts on breakage. BLOCKED on the Gmail connector, which needs a one-time human OAuth consent; it cannot run in CI until then.",
  },
  {
    id: "analyst-daily-scan",
    label: "Analyst daily scan",
    kind: "heartbeat",
    maxSilentHours: 60,
    matters:
      "Daily strategy scan. Cloud-hosted in agent-engines.yml since 2026-08-27; a red here means the Actions run failed, not a closed laptop.",
  },
  {
    id: "analyst-weekly-brief",
    label: "Analyst weekly brief",
    kind: "heartbeat",
    maxSilentHours: 240,
    matters:
      "Weekly brief + auto-implements AUTO-class decisions. BLOCKED on the Gmail connector for delivery; needs a one-time human OAuth consent.",
  },
  {
    id: "social-engine-weekly",
    label: "Social engine (weekly)",
    kind: "heartbeat",
    maxSilentHours: 240,
    matters:
      "Builds the draft runway. BLOCKED on the Metricool + Notion connectors; needs a one-time human OAuth consent.",
  },
  {
    id: "social-engine-pulse",
    label: "Social engine (pulse)",
    kind: "heartbeat",
    maxSilentHours: 240,
    matters:
      "Monday breakout check. BLOCKED on the Metricool + Notion connectors; needs a one-time human OAuth consent.",
  },
  {
    id: "article-engine-weekly",
    label: "Article engine",
    kind: "heartbeat",
    maxSilentHours: 240,
    matters:
      "Writes article drafts. Cloud-hosted in agent-engines.yml since 2026-08-27.",
  },
  {
    id: "dictionary-gap-report",
    label: "Dictionary gap report",
    kind: "heartbeat",
    maxSilentHours: 240,
    matters:
      "Ranks missing models; promotion is the catalog bottleneck. Cloud-hosted in agent-engines.yml since 2026-08-27.",
  },
  {
    id: "archivist-monthly-pull",
    label: "Archivist standing pull",
    kind: "heartbeat",
    maxSilentHours: 408,
    matters:
      "1st + 15th. Feeds the article + social backlogs. Cloud-hosted in agent-engines.yml since 2026-08-27.",
  },
  {
    id: "market-report-monthly",
    label: "Monthly market report",
    kind: "heartbeat",
    maxSilentHours: 816,
    matters: "Monthly. Cloud-hosted in agent-engines.yml since 2026-08-27.",
  },
  {
    id: "venue-terms-refresh-monthly",
    label: "Venue terms refresh",
    kind: "heartbeat",
    maxSilentHours: 816,
    matters:
      "Re-verifies published seller fees; a stale fee is a factual claim going wrong. Cloud-hosted in agent-engines.yml since 2026-08-27.",
  },

  // ---- the autonomy layer watching itself ----
  {
    id: "supervisor",
    label: "Supervisor (self-repair loop)",
    kind: "heartbeat",
    maxSilentHours: 18,
    matters:
      "Runs every 6h and repairs everything else. If IT goes quiet nothing gets fixed and no alarm fires, so this is the tightest window on the board.",
  },
  {
    id: "weekly-digest",
    label: "Weekly digest",
    kind: "heartbeat",
    maxSilentHours: 240,
    matters:
      "The owner's single scheduled contact with the system. Silence here means she hears nothing and assumes fine.",
  },
];

interface Finding {
  id: string;
  title: string;
  body: string;
  silentHours: number | null;
  allowedHours: number;
}

const ROOT = process.cwd();
const HEARTBEAT_DIR = join(ROOT, "reports", "heartbeat");
const OUT_DIR = join(ROOT, "reports", "watchdog");

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function fmtSilence(hours: number | null): string {
  if (hours === null) return "never";
  if (hours < 48) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

function repoSlug(): string {
  const fromEnv = process.env.GITHUB_REPOSITORY;
  if (fromEnv) return fromEnv;
  // Local fallback so this is runnable by hand without CI env.
  return "darkseerbruh/luxury-catalog";
}

/** Last SUCCESSFUL run of a workflow, or null if it has never succeeded. */
async function lastWorkflowSuccess(file: string): Promise<string | null> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const url =
    `https://api.github.com/repos/${repoSlug()}/actions/workflows/${file}` +
    `/runs?status=success&per_page=1`;
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${file}`);
  }
  const json = (await res.json()) as { workflow_runs?: { updated_at: string }[] };
  const run = json.workflow_runs?.[0];
  return run ? run.updated_at : null;
}

/**
 * Last heartbeat an out-of-band engine wrote for itself, with its verdict.
 *
 * Reading only `at` was the same false-green bug one level up: the runners now
 * write `"result": "failure"` truthfully when an engine crashes or is killed by
 * the job timeout, and a watchdog that looks only at the timestamp is satisfied
 * by a corpse. On 2026-08-28 dictionary-gap-report was cut off at 40 minutes,
 * wrote `result: failure`, and the watchdog reported it green.
 */
function lastHeartbeat(id: string): { at: string | null; result: string | null } {
  const path = join(HEARTBEAT_DIR, `${id}.json`);
  if (!existsSync(path)) return { at: null, result: null };
  try {
    const beat = JSON.parse(readFileSync(path, "utf8")) as {
      at?: unknown;
      result?: unknown;
    };
    return {
      at: typeof beat.at === "string" ? beat.at : null,
      result: typeof beat.result === "string" ? beat.result : null,
    };
  } catch {
    return { at: null, result: null };
  }
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const findings: Finding[] = [];
  const rows: string[] = [];

  for (const engine of ENGINES) {
    let last: string | null = null;
    let beatResult: string | null = null;
    let unreachable = false;

    if (engine.kind === "workflow") {
      try {
        last = await lastWorkflowSuccess(engine.file!);
      } catch (err) {
        // An API failure is NOT silence. Saying "engine dead" because we could
        // not ask would be the same false-alarm problem in a new coat.
        unreachable = true;
        console.error(`  ! ${engine.id}: ${(err as Error).message}`);
      }
    } else {
      const beat = lastHeartbeat(engine.id);
      last = beat.at;
      beatResult = beat.result;
    }

    if (unreachable) {
      rows.push(`| ${engine.label} | unknown | ${engine.maxSilentHours}h | ⚪ unreachable |`);
      continue;
    }

    const silent = last === null ? null : hoursSince(last);
    const silentRed = silent === null || silent > engine.maxSilentHours;
    // A heartbeat inside its window but reporting failure is NOT healthy. It is
    // a different fault from silence and gets its own finding, so the two never
    // mask each other.
    const failedRed = !silentRed && beatResult !== null && beatResult !== "success";
    rows.push(
      `| ${engine.label} | ${fmtSilence(silent)} | ${engine.maxSilentHours}h | ${
        silentRed ? "\u{1F534} SILENT" : failedRed ? "\u{1F534} RAN AND FAILED" : "\u{1F7E2}"
      } |`,
    );

    if (failedRed) {
      findings.push({
        id: `${engine.id}-failed`,
        title: `Watchdog: ${engine.label} ran and failed`,
        body: [
          `**${engine.label}** wrote a heartbeat inside its window, but the heartbeat reports \`${beatResult}\`.`,
          "",
          `- Last heartbeat: ${new Date(last!).toISOString().slice(0, 16).replace("T", " ")} UTC, ${fmtSilence(silent)} ago`,
          `- Reported result: **${beatResult}**`,
          "",
          `Why it matters: ${engine.matters}`,
          "",
          "It is running, so this is not a host problem. Read the run log for the engine's own exit code.",
        ].join("\n"),
        silentHours: silent,
        allowedHours: engine.maxSilentHours,
      });
    }

    if (silentRed) {
      // "Last success" is only true of a workflow, where we query successful
      // runs. A heartbeat records the last time the engine finished, pass or
      // fail, so say what it actually is.
      const seen =
        last === null
          ? engine.kind === "heartbeat"
            ? "It has never written a heartbeat."
            : "It has never had a successful run."
          : engine.kind === "heartbeat"
            ? `Last heartbeat ${new Date(last).toISOString().slice(0, 16).replace("T", " ")} UTC (${beatResult ?? "no result recorded"}), ${fmtSilence(silent)} ago.`
            : `Last success ${new Date(last).toISOString().slice(0, 16).replace("T", " ")} UTC, ${fmtSilence(silent)} ago.`;
      findings.push({
        id: engine.id,
        title: `Watchdog: ${engine.label} has gone silent`,
        body: [
          `**${engine.label}** has produced nothing for longer than its allowed window.`,
          "",
          `- Allowed silence: ${engine.maxSilentHours}h`,
          `- Actual silence: ${fmtSilence(silent)}`,
          `- ${seen}`,
          "",
          `Why it matters: ${engine.matters}`,
          "",
          engine.kind === "heartbeat"
            ? "This engine runs outside GitHub Actions, so nothing here can restart it. If it lives on a laptop, that is the bug, not the symptom."
            : "This is a GitHub workflow, so the supervisor can re-run and repair it.",
        ].join("\n"),
        silentHours: silent,
        allowedHours: engine.maxSilentHours,
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const table = [
    "| Engine | Silent for | Allowed | |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");

  console.log(`\nWatchdog ${today}: ${findings.length} problems across ${ENGINES.length} engines\n`);
  console.log(table);

  if (!write) {
    console.log("\n(dry run; pass --write to record state)");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "state.json"),
    `${JSON.stringify({ lastRun: today, checked: ENGINES.length, redFindings: findings }, null, 2)}\n`,
  );
  writeFileSync(
    join(OUT_DIR, `${today}.md`),
    `# Watchdog ${today}\n\n${findings.length} problems across ${ENGINES.length} engines.\n\n${table}\n`,
  );
  console.log(`\nWrote reports/watchdog/state.json + ${today}.md`);
}

main().catch((err) => {
  console.error("Watchdog failed:", err);
  process.exit(1);
});
