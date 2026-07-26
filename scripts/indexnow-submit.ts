/**
 * IndexNow submission: tell Bing, Yandex, Seznam and Naver which pages changed.
 *
 * Why this and not Google: Google has no equivalent open endpoint (its Indexing
 * API is officially limited to job postings and livestreams). IndexNow needs no
 * account and no credentials, only a key hosted on our own domain, so it is the
 * one indexing lever that can run unattended. Bing also feeds ChatGPT's web
 * results, which is the GEO channel we actually care about.
 *
 * Modes
 *   (default)  changed  — bag pages whose price data moved in the last N days,
 *                         plus the always-fresh hub pages. This is what the
 *                         daily workflow runs, and it is what the protocol is
 *                         designed for.
 *   --all               — every URL in the sitemap. For first-time discovery or
 *                         after a bulk catalogue change. Do not run daily:
 *                         re-submitting unchanged URLs is what gets a site
 *                         throttled.
 *   --dry-run           — print what would be sent, send nothing.
 *
 * Usage:
 *   npx tsx scripts/indexnow-submit.ts --dry-run
 *   npx tsx scripts/indexnow-submit.ts --all
 *   npx tsx scripts/indexnow-submit.ts --days 2
 */
import { createClient } from "@supabase/supabase-js";

/** Must match the filename in public/ or the endpoint rejects the batch. */
const INDEXNOW_KEY = "5d71a78cea72415bef8846bdee172401";
const HOST = "www.luxurycatalog.com";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

/** Protocol cap per request. */
const MAX_URLS = 10_000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const daysArg = args.indexOf("--days");
const days = daysArg >= 0 ? Number(args[daysArg + 1]) || 1 : 1;

/** Pages worth re-announcing whenever anything moved. */
const HUB_PAGES = ["/", "/shop", "/brands", "/coveted", "/articles", "/data", "/where-to-buy"];

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function changedUrls(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env for changed-URL mode");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  // observed_on is indexed; date_recorded got its own index in 0058. Keep this
  // on observed_on so the read stays inside the statement timeout.
  const { data, error } = await db
    .from("price_history")
    .select("variant_id")
    .gte("observed_on", since)
    .limit(MAX_URLS);
  if (error) throw error;

  const ids = [...new Set((data ?? []).map((r) => (r as { variant_id: number }).variant_id))];
  return [...HUB_PAGES.map((p) => `${ORIGIN}${p}`), ...ids.map((id) => `${ORIGIN}/bag/${id}`)];
}

async function main() {
  const urls = (all ? await sitemapUrls() : await changedUrls()).slice(0, MAX_URLS);

  console.log(`mode: ${all ? "all (sitemap)" : `changed (last ${days}d)`}`);
  console.log(`urls: ${urls.length}`);
  console.log(`sample: ${urls.slice(0, 3).join(", ")}`);

  if (urls.length === 0) {
    console.log("nothing to submit");
    return;
  }

  // Fail loudly if the key file is not actually reachable: IndexNow verifies it
  // on every request, and a 404 here means the whole batch is silently refused.
  const keyRes = await fetch(`${ORIGIN}/${INDEXNOW_KEY}.txt`);
  const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
  if (keyBody !== INDEXNOW_KEY) {
    throw new Error(
      `key file not live at ${ORIGIN}/${INDEXNOW_KEY}.txt (status ${keyRes.status}). Deploy before submitting.`,
    );
  }
  console.log("key file: verified live");

  if (dryRun) {
    console.log("dry run, nothing sent");
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: urls }),
  });

  const text = await res.text();
  console.log(`response: ${res.status} ${res.statusText}${text ? ` ${text}` : ""}`);
  // 200 accepted, 202 accepted-pending-key-validation. Anything else is a real
  // failure and should fail the workflow rather than pass quietly.
  if (res.status !== 200 && res.status !== 202) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
