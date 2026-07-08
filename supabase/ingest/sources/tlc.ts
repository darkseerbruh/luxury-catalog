/**
 * The Luxury Closet live-listings adapter (CJ product feed, advertiser 5312449,
 * export subscription 319025). Fetches the CJ HTTP export (basic auth) -> unzip
 * -> parse Quoted CSV -> emit one `listed` PriceObservation per in-stock bag we
 * recognise, with the CJ deep affiliate link as source_url. The shared loader
 * (load-prices.ts) resolves each to a catalog variant (or routes it to
 * discovered_listing) and it surfaces in the bag-page "For sale right now" rail.
 *
 * Run: `npm run ingest:tlc` then `npm run ingest:load -- --write`
 *   (needs CJ_FEED_URL + CJ_FEED_USER + CJ_FEED_PASS in .env.local — the owner
 *    gets these from the CJ feed-export email; they also live in Vercel).
 *
 * We keep ONLY rows whose model we can name (canonicalModel != null), so the
 * 71k all-category feed (shoes, jewellery, clothes) never pollutes the pipeline.
 */
import { unzipSync, strFromU8 } from "fflate";
import { parse } from "csv-parse/sync";
import { parseTlcFeedRows } from "../../../src/lib/ingest/tlc-feed";
import { canonicalModel } from "../../../src/lib/ingest/model-normalize";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

const PLATFORM = "The Luxury Closet";
const SOURCE = "tlc";

/** Decode a feed payload (raw CSV/TXT or a .zip, detected by the PK magic bytes)
 * into each member's text. */
function decodeFeed(buf: Uint8Array): string[] {
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
  if (!isZip) return [strFromU8(buf)];
  const files = unzipSync(buf);
  const out: string[] = [];
  for (const name of Object.keys(files)) {
    if (/\.(csv|txt)$/i.test(name)) out.push(strFromU8(files[name]));
  }
  if (!out.length) throw new Error("CJ feed archive had no .csv/.txt member");
  return out;
}

/** Pull the newest Shopping feed archive over SFTP (CJ's stable transport). Lists
 * the account directory, prefers a USD file, picks the newest, downloads + decodes.
 * Credentials come from env; the runner (CI/scheduler) provides them so the
 * password is never handled in the app. */
async function fetchViaSftp(): Promise<string[]> {
  const host = process.env.CJ_FEED_HOST!;
  const user = process.env.CJ_FEED_USER;
  const pass = process.env.CJ_FEED_PASS;
  const dir = process.env.CJ_FEED_PATH || ".";
  if (!user || !pass) throw new Error("CJ SFTP creds missing (CJ_FEED_USER / CJ_FEED_PASS)");
  const Client = (await import("ssh2-sftp-client")).default;
  const sftp = new Client();
  await sftp.connect({
    host,
    port: 22,
    username: user,
    password: pass,
    // CJ's legacy-crypto handshake over the CI link can take longer than the 20s
    // default ("Timed out while waiting for handshake"); give it room.
    readyTimeout: 90000,
    // CJ's server authenticates via keyboard-interactive, not plain password
    // ("All configured authentication methods failed" otherwise). This makes
    // ssh2 answer the interactive prompt with the same password.
    tryKeyboard: true,
    // CJ's datatransfer server offers legacy host-key + kex algorithms that
    // modern ssh2 disables by default ("no matching host key format"). Re-enable
    // the older ones so the handshake succeeds.
    algorithms: {
      serverHostKey: ["ssh-rsa", "rsa-sha2-512", "rsa-sha2-256", "ssh-dss", "ecdsa-sha2-nistp256", "ssh-ed25519"],
      kex: [
        "diffie-hellman-group14-sha1",
        "diffie-hellman-group1-sha1",
        "diffie-hellman-group-exchange-sha1",
        "diffie-hellman-group14-sha256",
        "diffie-hellman-group16-sha512",
        "ecdh-sha2-nistp256",
      ],
    },
  });
  try {
    const list = await sftp.list(dir);
    const zips = list.filter((f) => f.type === "-" && /shopping.*\.zip$/i.test(f.name));
    if (!zips.length) throw new Error(`CJ SFTP: no shopping*.zip in ${dir}`);
    // Prefer a USD-named file, then newest by modify time.
    zips.sort((a, b) => {
      const usd = (n: string) => (/usd/i.test(n) ? 1 : 0);
      return usd(b.name) - usd(a.name) || b.modifyTime - a.modifyTime;
    });
    const pick = zips[0];
    const remote = dir === "." ? pick.name : `${dir.replace(/\/$/, "")}/${pick.name}`;
    const buf = (await sftp.get(remote)) as Buffer;
    console.log(`[tlc] sftp picked ${pick.name} (${buf.length} bytes) from ${host}:${dir}`);
    return decodeFeed(new Uint8Array(buf));
  } finally {
    await sftp.end();
  }
}

/** Load the feed, in priority order: a local file (CJ_FEED_FILE, one-time verify),
 * SFTP (CJ_FEED_HOST, the automated transport), or HTTP (CJ_FEED_URL, legacy). */
async function fetchFeedFiles(): Promise<string[]> {
  const file = process.env.CJ_FEED_FILE;
  if (file) {
    const fs = await import("fs");
    return decodeFeed(new Uint8Array(fs.readFileSync(file)));
  }
  if (process.env.CJ_FEED_HOST) return fetchViaSftp();
  const url = process.env.CJ_FEED_URL;
  const user = process.env.CJ_FEED_USER;
  const pass = process.env.CJ_FEED_PASS;
  if (!url || !user || !pass) {
    throw new Error("CJ feed env missing: set CJ_FEED_FILE (local), CJ_FEED_HOST (SFTP), or CJ_FEED_URL + CJ_FEED_USER + CJ_FEED_PASS");
  }
  const res = await fetch(url, {
    headers: { Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64") },
  });
  if (!res.ok) throw new Error(`CJ feed fetch failed: ${res.status} ${res.statusText}`);
  return decodeFeed(new Uint8Array(await res.arrayBuffer()));
}

// --- CJ GraphQL Product Feed API (the working transport; SFTP is dead, see the
// spec) -----------------------------------------------------------------------
const CJ_GRAPHQL_ENDPOINT = "https://ads.api.cj.com/query";
// Publisher company id (CID). Non-secret (rides in URLs); overridable via env.
const CJ_CID = process.env.CJ_CID || "7997608";
// The Luxury Closet's CJ advertiser id. WITHOUT this the query returns CJ's
// ENTIRE network (266M products) and mislabels them as TLC — always scope it.
const TLC_ADVERTISER_ID = process.env.CJ_ADVERTISER_ID || "5312449";

interface ApiAmount { amount: string | null; currency: string | null }
interface ApiProduct {
  id: string; title: string | null; brand: string | null;
  availability: string | null; condition: string | null; color: string | null; material: string | null;
  link: string | null; imageLink: string | null;
  price: ApiAmount | null; salePrice: ApiAmount | null;
}

/** Pull all USD products for our joined advertisers (TLC) from CJ's GraphQL API,
 * paginating via `nextPage`. Returns CSV-shaped rows so the existing tested
 * parser (parseTlcFeedRows) handles all normalisation unchanged. */
async function fetchApiRows(): Promise<Record<string, string>[]> {
  const token = process.env.CJ_API_TOKEN;
  if (!token) throw new Error("CJ_API_TOKEN not set");
  // `resultList` is the Product INTERFACE; the shopping fields live on the
  // concrete `Shopping` type, so select them via an inline fragment.
  const query = `query($cid: ID!, $partner: [ID!], $limit: Int, $page: String) {
    products(companyId: $cid, partnerIds: $partner, currency: "USD", limit: $limit, page: $page) {
      totalCount count nextPage
      resultList {
        ... on Shopping {
          id title brand availability condition color material link imageLink
          price { amount currency } salePrice { amount currency }
        }
      }
    }
  }`;
  const rows: Record<string, string>[] = [];
  let page: string | null = null;
  let total = 0;
  const amt = (a: ApiAmount | null) => (a && a.amount ? `${a.amount} ${a.currency ?? "USD"}` : "");
  for (let guard = 0; guard < 500; guard++) {
    const res = await fetch(CJ_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { cid: CJ_CID, partner: [TLC_ADVERTISER_ID], limit: 1000, page } }),
    });
    if (!res.ok) throw new Error(`CJ API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as {
      data?: { products?: { totalCount: number; count: number; nextPage: string | null; resultList: ApiProduct[] } };
      errors?: unknown;
    };
    if (json.errors) throw new Error(`CJ API errors: ${JSON.stringify(json.errors).slice(0, 400)}`);
    const p = json.data?.products;
    if (!p) throw new Error("CJ API: no products block in response");
    total = p.totalCount;
    for (const it of p.resultList || []) {
      rows.push({
        id: it.id ?? "",
        title: it.title ?? "",
        brand: it.brand ?? "",
        link: it.link ?? "",
        image_link: it.imageLink ?? "",
        price: amt(it.price),
        sale_price: amt(it.salePrice),
        availability: it.availability ?? "",
        condition: it.condition ?? "",
        color: it.color ?? "",
        material: it.material ?? "",
      });
    }
    if (!p.nextPage || (p.resultList || []).length === 0) break;
    page = p.nextPage;
  }
  console.log(`[tlc] api fetched ${rows.length} products (totalCount=${total})`);
  return rows;
}

async function run(): Promise<void> {
  const observedOn = new Date().toISOString().slice(0, 10);

  // Prefer the CJ API (token) — the only transport that works. Fall back to the
  // file/CSV path (local file) when no token is set.
  let listings;
  if (process.env.CJ_API_TOKEN) {
    listings = parseTlcFeedRows(await fetchApiRows(), { currency: "USD" });
  } else {
    const files = await fetchFeedFiles();
    listings = files.flatMap((csv) => {
      const rows = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        trim: true,
      }) as Record<string, string>[];
      return parseTlcFeedRows(rows, { currency: "USD" });
    });
  }

  let skippedUnknownModel = 0;
  let skippedOutOfStock = 0;
  const observations: PriceObservation[] = [];
  for (const l of listings) {
    if (l.availability !== "in_stock") {
      skippedOutOfStock++;
      continue;
    }
    const price = l.salePrice ?? l.price;
    if (!price || price <= 0) continue;
    const brand = l.brandName;
    const model = brand ? canonicalModel(brand, l.title) : null;
    if (!brand || !model) {
      skippedUnknownModel++;
      continue; // only bags we can name — never guess a style
    }
    observations.push({
      brand,
      style: model,
      attrs: {
        exterior_colorway: l.color,
        exterior_material: l.material,
        condition_detail: l.itemCondition,
        listing_ref: l.externalId,
      },
      platform: PLATFORM,
      price_type: "listed",
      sale_price: price,
      currency: "USD",
      condition: null,
      observed_on: observedOn,
      source_url: l.clickUrl,
      confidence: "high",
      notes: l.salePrice != null && l.price != null && l.salePrice < l.price
        ? `on sale from ${l.price}`
        : null,
    });
  }

  const { file, kept, dropped } = writeObservations(SOURCE, observations);

  // Authoritative "still for sale" snapshot for reconcile-sold: the listing_refs
  // of every in-stock bag in THIS run. Overwrite (not merge) so a ref that drops
  // out = sold. reconcile-sold stamps stored TLC rows not in this set as sold.
  const liveRefs = [...new Set(observations.map((o) => o.attrs.listing_ref).filter((r): r is string => !!r))];
  const snapDir = path.resolve(__dirname, "../../../data/ingest/_raw");
  fs.mkdirSync(snapDir, { recursive: true });
  const snapFile = path.join(snapDir, "tlc-live.json");
  fs.writeFileSync(snapFile, JSON.stringify(liveRefs));

  console.log(
    `[tlc] feed rows(USD)=${listings.length} · emitted=${observations.length} · kept=${kept} · dropped=${dropped}\n` +
      `      skipped: unknown-model=${skippedUnknownModel}, out-of-stock=${skippedOutOfStock}\n` +
      `      live snapshot: ${liveRefs.length} refs -> ${snapFile}\n` +
      `      -> ${file}\n      next: npm run load:prices -- tlc --write`
  );
}

run().catch((err) => {
  console.error("[tlc] ingest failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
