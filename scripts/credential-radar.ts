/**
 * Credential radar: turn key expiry from an outage into a calendar item.
 *
 * Credentials are the one category that genuinely cannot be automated away.
 * CJ, Awin, Cloudflare, Vercel and Supabase all sit behind a login with 2FA, so
 * a human must mint the replacement. That is fine. What is NOT fine is finding
 * out at 403, with two affiliate feeds already dark.
 *
 * So this probes every credential we depend on, on a schedule, and reports:
 *   live      — probe succeeded, we verified it right now
 *   dead      — probe failed on auth (401/403). Someone must rotate it.
 *   missing   — the secret is not set at all
 *   unknown   — we could not probe (no probe written, or the network failed)
 *
 * `unknown` is deliberately NOT `live`. Claiming health we did not verify is
 * how you get a green board over a dark system, which is exactly the failure
 * this whole autonomy pass exists to kill.
 *
 * No secret is ever printed. Probes are read-only and cheap (a whoami-shaped
 * call), and every one has a short timeout so a hanging vendor cannot wedge CI.
 *
 * Usage: npx tsx scripts/credential-radar.ts [--write]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Status = "live" | "dead" | "missing" | "unknown";

interface Credential {
  id: string;
  label: string;
  /** Env var(s) that must all be present for a probe to be possible. */
  envs: string[];
  /** What breaks when this credential lapses. Quoted into the issue. */
  blastRadius: string;
  /** Who can replace it. Everything here is human-only by construction. */
  rotation: string;
  probe?: (env: Record<string, string>) => Promise<Status>;
}

const TIMEOUT_MS = 15_000;

async function get(
  url: string,
  headers: Record<string, string>,
): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** 2xx = live, 401/403 = dead, anything else = unknown (their outage, not our key). */
function classify(res: Response): Status {
  if (res.ok) return "live";
  if (res.status === 401 || res.status === 403) return "dead";
  return "unknown";
}

const CREDENTIALS: Credential[] = [
  {
    id: "anthropic",
    label: "Anthropic API key",
    envs: ["ANTHROPIC_API_KEY"],
    blastRadius:
      "The supervisor itself, plus every LLM enrich step. If this dies the autonomy layer is the first thing to stop.",
    rotation: "console.anthropic.com, then update the repo secret.",
    probe: async (env) =>
      classify(
        await get("https://api.anthropic.com/v1/models?limit=1", {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        }),
      ),
  },
  {
    id: "supabase-service",
    label: "Supabase service role key",
    envs: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    blastRadius: "Every ingest, every read. Total outage.",
    rotation: "Supabase dashboard, API settings.",
    probe: async (env) =>
      classify(
        await get(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?select=1`, {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        }),
      ),
  },
  {
    id: "cj",
    label: "CJ API token",
    envs: ["CJ_API_TOKEN"],
    blastRadius:
      "TLC + Rebag live listings both 403 together. Affiliate buy-links on bag pages go dark.",
    rotation:
      "developers.cj.com personal access token. Opaque, so expiry is unreadable and only a live probe catches it.",
    probe: async (env) => {
      // CJ's GraphQL endpoint answers 200 with an error body for a bad query but
      // 401/403 for a bad token, which is exactly the distinction we want.
      const res = await get("https://ads.api.cj.com/query", {
        authorization: `Bearer ${env.CJ_API_TOKEN}`,
      });
      // A GET on a POST-only endpoint returns 405 when auth passed.
      if (res.status === 405 || res.ok) return "live";
      return classify(res);
    },
  },
  {
    id: "apify",
    label: "Apify token",
    envs: ["APIFY_TOKEN"],
    blastRadius: "TRR capture and the eBay sold lane. The paid capture tier.",
    rotation: "console.apify.com integrations.",
    probe: async (env) =>
      classify(
        await get("https://api.apify.com/v2/users/me", {
          authorization: `Bearer ${env.APIFY_TOKEN}`,
        }),
      ),
  },
  {
    id: "firecrawl",
    label: "Firecrawl API key",
    envs: ["FIRECRAWL_API_KEY"],
    blastRadius: "Free-tier capture lanes and research scrapes.",
    rotation: "firecrawl.dev dashboard.",
    probe: async (env) =>
      classify(
        await get("https://api.firecrawl.dev/v2/team/credit-usage", {
          authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        }),
      ),
  },
  {
    id: "awin-mygemma",
    label: "Awin myGemma feed URL",
    envs: ["AWIN_MYGEMMA_FEED_URL"],
    blastRadius: "myGemma listings + the LICENSED photos that come with the feed.",
    rotation: "ui.awin.com, regenerate the datafeed URL.",
    probe: async (env) => classify(await get(env.AWIN_MYGEMMA_FEED_URL, {})),
  },
  {
    id: "supabase-access",
    label: "Supabase access token",
    envs: ["SUPABASE_ACCESS_TOKEN"],
    blastRadius: "Migration runs. Schema changes stop landing.",
    rotation: "Supabase account tokens page.",
    probe: async (env) =>
      classify(
        await get("https://api.supabase.com/v1/projects", {
          authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
        }),
      ),
  },
  {
    id: "supabase-db-password",
    label: "Supabase DB password",
    envs: ["SUPABASE_DB_PASSWORD"],
    blastRadius: "Direct psql paths used by migrations.",
    rotation: "Supabase dashboard, database settings.",
    // No safe read-only probe: the only test is opening a connection, which we
    // will not do on a schedule. Reports `unknown` by design rather than a
    // comforting green we did not earn.
  },
];

interface Finding {
  id: string;
  title: string;
  body: string;
  status: Status;
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const findings: Finding[] = [];
  const rows: string[] = [];

  for (const cred of CREDENTIALS) {
    const env: Record<string, string> = {};
    let missing = false;
    for (const key of cred.envs) {
      const val = (process.env[key] || "").trim();
      if (!val) missing = true;
      env[key] = val;
    }

    let status: Status;
    if (missing) {
      status = "missing";
    } else if (!cred.probe) {
      status = "unknown";
    } else {
      try {
        status = await cred.probe(env);
      } catch {
        status = "unknown";
      }
    }

    const icon =
      status === "live" ? "🟢" : status === "dead" ? "🔴" : status === "missing" ? "🟠" : "⚪";
    rows.push(`| ${cred.label} | ${icon} ${status} |`);

    if (status === "dead" || status === "missing") {
      findings.push({
        id: cred.id,
        status,
        title: `Credential: ${cred.label} is ${status}`,
        body: [
          status === "dead"
            ? `**${cred.label}** failed its liveness probe with an auth error. It has stopped working.`
            : `**${cred.label}** is not set. Expected env: \`${cred.envs.join("`, `")}\`.`,
          "",
          `What breaks: ${cred.blastRadius}`,
          "",
          `How to fix: ${cred.rotation}`,
          "",
          "This is one of the genuinely human-only items. A third party requires a person to authenticate, so no automation can replace it. Everything up to the rotation is already handled.",
        ].join("\n"),
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const table = ["| Credential | State |", "| --- | --- |", ...rows].join("\n");
  const dead = findings.length;

  console.log(`\nCredential radar ${today}: ${dead} needing a human of ${CREDENTIALS.length}\n`);
  console.log(table);

  if (!write) {
    console.log("\n(dry run; pass --write to record state)");
    return;
  }

  const outDir = join(process.cwd(), "reports", "credentials");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "state.json"),
    `${JSON.stringify({ lastRun: today, checked: CREDENTIALS.length, redFindings: findings }, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, `${today}.md`),
    `# Credential radar ${today}\n\n${dead} needing a human of ${CREDENTIALS.length}.\n\n${table}\n`,
  );
  console.log(`\nWrote reports/credentials/state.json + ${today}.md`);
}

main().catch((err) => {
  console.error("Credential radar failed:", err);
  process.exit(1);
});
