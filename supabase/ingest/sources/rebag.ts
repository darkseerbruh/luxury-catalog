/**
 * Rebag live-listings adapter (CJ Product Feed GraphQL API, advertiser 5749848).
 * Rebag joined our CJ account 2026-07-14 (7% commission, 30-day cookie, daily
 * feed). Same transport + shape as The Luxury Closet (see tlc.ts): query CJ's
 * GraphQL products API scoped to Rebag -> emit one `listed` PriceObservation per
 * in-stock bag we recognise, with the CJ deep affiliate link as source_url. The
 * shared loader (load-prices.ts) resolves each to a catalog variant (or routes it
 * to discovered_listing) and it surfaces in the bag-page "For sale right now" rail.
 *
 * Run: `npm run ingest:rebag` then `npm run load:prices -- rebag --write`
 *   (needs CJ_API_TOKEN in .env.local / CI — the same token TLC uses).
 *
 * We keep ONLY rows whose model we can name (canonicalModel != null), so Rebag's
 * huge all-category feed (watches, jewellery, shoes, apparel, SLGs) never
 * pollutes the pipeline. Non-bag accessories are vetoed FIRST via the shared
 * isNonBagAccessory classifier (the standing rule for every source adapter — a
 * per-source regex leaks, see the myGemma/TRR non-bag purges).
 */
import { parseTlcFeedRows } from "../../../src/lib/ingest/tlc-feed";
import { canonicalModel, isNonBagAccessory } from "../../../src/lib/ingest/model-normalize";
import { writeObservations } from "../lib/landing";
import type { PriceObservation } from "../../../src/lib/ingest/types";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

const PLATFORM = "Rebag";
const SOURCE = "rebag";

// Title looks like a handbag (for coverage telemetry only — NOT used for
// matching, which stays on canonicalModel). Bag-ish word present, no footwear.
const BAG_WORDS = /\b(bag|tote|clutch|crossbody|cross body|satchel|hobo|shoulder|backpack|bucket|saddle|flap|top handle|messenger|minaudiere|vanity|duffle|boston|camera)\b/i;
const NOT_BAG_WORDS = /\b(sneaker|pump|sandal|mule|loafer|boot|espadrille|slide|heel|flat|wallet|cardholder|card holder|belt|scarf|sunglass|necklace|earring|bracelet|ring|watch|perfume|shoe)\b/i;
function looksLikeBag(title: string): boolean {
  return BAG_WORDS.test(title) && !NOT_BAG_WORDS.test(title);
}

/** Upgrade a known-http image url to https for rendering (avoids mixed content).
 * Rebag's CDN is https already, but be defensive. */
function toHttps(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http://") ? url.replace(/^http:/, "https:") : url;
}

// --- CJ GraphQL Product Feed API (same transport as TLC; SFTP is dead) --------
const CJ_GRAPHQL_ENDPOINT = "https://ads.api.cj.com/query";
// Publisher company id (CID) — ours, shared with TLC. Non-secret; overridable.
const CJ_CID = process.env.CJ_CID || "7997608";
// Rebag's CJ advertiser id. WITHOUT this the query returns CJ's ENTIRE network
// and mislabels it all as Rebag — always scope it. Sourced from Rebag's CJ
// signup URL (?cid=5749848, which CJ redirects to advertiserId=5749848) and the
// welcome kit's commission terms (2026-07-14). Overridable via env.
const REBAG_ADVERTISER_ID = process.env.CJ_REBAG_ADVERTISER_ID || "5749848";

interface ApiAmount { amount: string | null; currency: string | null }
interface ApiProduct {
  id: string; title: string | null; brand: string | null;
  availability: string | null; condition: string | null; color: string | null; material: string | null;
  link: string | null; imageLink: string | null;
  price: ApiAmount | null; salePrice: ApiAmount | null;
}

/** Pull all USD products for Rebag from CJ's GraphQL API, paginating via
 * `nextPage`. Returns CSV-shaped rows so the shared tested parser
 * (parseTlcFeedRows) handles all normalisation unchanged. */
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
      body: JSON.stringify({ query, variables: { cid: CJ_CID, partner: [REBAG_ADVERTISER_ID], limit: 1000, page } }),
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
  console.log(`[rebag] api fetched ${rows.length} products (totalCount=${total})`);
  return rows;
}

async function run(): Promise<void> {
  const observedOn = new Date().toISOString().slice(0, 10);

  // API only (CJ token). A local file (CJ_REBAG_FEED_FILE) can be dropped in for a
  // one-time verify without the token.
  let rows: Record<string, string>[];
  const file = process.env.CJ_REBAG_FEED_FILE;
  if (file) {
    const { parse } = await import("csv-parse/sync");
    rows = parse(fs.readFileSync(file), {
      columns: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true, trim: true,
    }) as Record<string, string>[];
  } else {
    rows = await fetchApiRows();
  }
  const listings = parseTlcFeedRows(rows, { currency: "USD" });

  let skippedUnknownModel = 0;
  let skippedOutOfStock = 0;
  let skippedNonBag = 0;
  // Coverage telemetry: which known-brand, in-stock bags we FAIL to name, so the
  // MODELS dictionary can be extended from evidence (not guesses).
  const unmatchedByBrand = new Map<string, number>();
  const unmatchedSamples = new Map<string, string>();
  const observations: PriceObservation[] = [];
  // Unknown-model BAGS captured to discovered_listing (raw layer) via the
  // discovered-only load instead of being dropped — affiliate data is priority
  // evidence of bags we're missing (see the affiliate-data-not-throwaway rule).
  const discoveredObs: PriceObservation[] = [];
  // Per-listing photos (listing_ref -> https image) for the bag-page rail.
  const images: { listing_ref: string; image_url: string }[] = [];
  for (const l of listings) {
    if (l.availability !== "in_stock") {
      skippedOutOfStock++;
      continue;
    }
    // Veto non-bag accessories FIRST (the standing rule for every source adapter).
    // isNonBagAccessory keeps WOC/Vanity/Pouch but rejects wallets/card holders/
    // charms/belts, which Rebag's feed carries in volume alongside watches/jewellery.
    if (isNonBagAccessory(l.title)) {
      skippedNonBag++;
      continue;
    }
    const price = l.salePrice ?? l.price;
    if (!price || price <= 0) continue;
    const brand = l.brandName;
    const model = brand ? canonicalModel(brand, l.title) : null;
    if (!brand || !model) {
      skippedUnknownModel++;
      if (brand && looksLikeBag(l.title)) {
        unmatchedByBrand.set(brand, (unmatchedByBrand.get(brand) ?? 0) + 1);
        if (!unmatchedSamples.has(brand)) unmatchedSamples.set(brand, l.title);
        discoveredObs.push({
          brand,
          style: l.title,
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
          confidence: "low",
          notes: "unmatched-model (dictionary miss) — captured for triage",
        });
      }
      continue; // named bags -> price_history; unknown-model bags captured above
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
    const img = toHttps(l.imageUrl);
    if (img) images.push({ listing_ref: l.externalId, image_url: img });
  }

  const { file: outFile, kept, dropped } = writeObservations(SOURCE, observations);

  // Unknown-model bags -> their own landing, loaded with --discovered-only.
  const disc = writeObservations(`${SOURCE}-discovered`, discoveredObs);

  // Authoritative "still for sale" snapshot for reconcile-sold: the listing_refs
  // of every in-stock bag in THIS run. Overwrite (not merge) so a ref that drops
  // out = sold. reconcile-sold stamps stored Rebag rows not in this set as sold.
  const liveRefs = [...new Set(observations.map((o) => o.attrs.listing_ref).filter((r): r is string => !!r))];
  const snapDir = path.resolve(__dirname, "../../../data/ingest/_raw");
  fs.mkdirSync(snapDir, { recursive: true });
  fs.writeFileSync(path.join(snapDir, "rebag-live.json"), JSON.stringify(liveRefs));

  // Per-listing photos for load-listing-images.ts (loaded on --write runs only).
  fs.writeFileSync(path.join(snapDir, "rebag-images.json"), JSON.stringify(images));

  const topUnmatched = [...unmatchedByBrand.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([b, n]) => `        ${n}× ${b} — e.g. "${unmatchedSamples.get(b)}"`)
    .join("\n");

  console.log(
    `[rebag] feed rows(USD)=${listings.length} · emitted=${observations.length} · kept=${kept} · dropped=${dropped}\n` +
      `      skipped: non-bag=${skippedNonBag}, unknown-model=${skippedUnknownModel}, out-of-stock=${skippedOutOfStock}\n` +
      `      live snapshot: ${liveRefs.length} refs -> rebag-live.json\n` +
      `      unknown-model bags captured for triage: ${disc.kept} -> ${disc.file}\n` +
      `      -> ${outFile}\n      next: npm run load:prices -- rebag --write` +
      ` && npm run load:prices -- rebag-discovered --discovered-only --write\n` +
      `      TOP UNMATCHED known-brand bags (extend MODELS from these):\n${topUnmatched}`
  );
}

run().catch((err) => {
  console.error("[rebag] ingest failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
