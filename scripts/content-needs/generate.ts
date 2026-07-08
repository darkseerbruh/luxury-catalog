/**
 * Regenerates docs/content-needs.md — the self-reranking "what to photograph next"
 * list for the Vivrelle rent-and-shoot pipeline, scheduled against the owner's
 * actual plan (PLAN in catalog.ts: 1 Couture + 1 Classique item/month).
 *
 *   Demand (catalog.ts)  minus  captures (captured.csv)  →  two tracks (Couture /
 *   Classique)  →  a month-by-month plan + a check on whether the Couture slot pays.
 *
 * Run:  npm run content:needs
 * Update after a shoot: append a line to captured.csv (status shot|published), rerun.
 * No DB, no creds.
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  NEEDS,
  PARTIAL_CREDIT_FACTOR,
  PLAN,
  SURFACE_LABEL,
  TIER_LABEL,
  valueScore,
  type Need,
} from "./catalog";

interface Capture {
  brand: string;
  style: string;
  colorway: string;
  material: string;
  status: string; // in_hand | shot | published
  source: string;
  date: string;
  notes: string;
}

const DIR = __dirname;
const OUT = path.resolve(DIR, "../../docs/content-needs.md");
const GENERATED_ON = new Date().toISOString().slice(0, 10);

function readCaptures(): Capture[] {
  const csv = fs.readFileSync(path.resolve(DIR, "captured.csv"), "utf8");
  return parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Capture[];
}

const norm = (s: string): string => s.trim().toLowerCase();
const specText = (c: Capture): string => `${c.colorway} ${c.material}`;

function capturesFor(need: Need, captures: Capture[]): Capture[] {
  return captures.filter((c) => norm(c.brand) === norm(need.brand) && norm(c.style) === norm(need.style));
}

function specMatch(need: Need, c: Capture): boolean {
  return need.preferredSpec ? need.preferredSpec.test(specText(c)) : true;
}

type State = "closed" | "in_hand_closing" | "in_hand_partial" | "open";

function stateOf(need: Need, captures: Capture[]): State {
  const rows = capturesFor(need, captures);
  const closed = rows.some((c) => (c.status === "shot" || c.status === "published") && specMatch(need, c));
  if (closed) return "closed";
  const inHand = rows.filter((c) => c.status === "in_hand");
  if (inHand.some((c) => specMatch(need, c))) return "in_hand_closing";
  if (inHand.length > 0) return "in_hand_partial";
  return "open";
}

/** True when a DIFFERENT variant of this silhouette is already shot or in hand
 *  (placeholder filled, shape represented) so the marquee twin gets partial credit. */
function hasVariantCovered(need: Need, captures: Capture[]): boolean {
  if (!need.preferredSpec) return false;
  return capturesFor(need, captures).some(
    (c) => (c.status === "shot" || c.status === "published" || c.status === "in_hand") && !specMatch(need, c),
  );
}

/** Value used for ranking: discounted when a variant is already covered. */
function effValue(need: Need, captures: Capture[]): number {
  return valueScore(need) * (hasVariantCovered(need, captures) ? PARTIAL_CREDIT_FACTOR : 1);
}

const fills = (need: Need): string => need.surfaces.map((s) => SURFACE_LABEL[s]).join(", ");

function valueCell(need: Need, captures: Capture[]): string {
  const v = effValue(need, captures);
  return hasVariantCovered(need, captures)
    ? `${v.toFixed(1)} (×${PARTIAL_CREDIT_FACTOR} variant covered)`
    : `${v}`;
}

function detailRow(need: Need, captures: Capture[], extra?: string): string {
  const rank = need.homepageRank ? ` · homepage #${need.homepageRank}` : "";
  const note = [extra, need.note].filter(Boolean).join(" ");
  return `| ${need.brand} ${need.style}${rank} | ${fills(need)} | ${TIER_LABEL[need.tier]} | ${valueCell(need, captures)} | ${note || "—"} |`;
}

const DETAIL_HEAD = "| Bag | Fills | Vivrelle tier | Value | Note |\n|---|---|---|---|---|";
const short = (need: Need): string => `${need.brand} ${need.style}`;

function main(): void {
  const captures = readCaptures();
  const tagged = NEEDS.map((need) => ({ need, state: stateOf(need, captures) }));
  const byVal = (a: { need: Need }, b: { need: Need }): number =>
    effValue(b.need, captures) - effValue(a.need, captures);

  const inHandCouture = tagged.filter((x) => x.state !== "closed" && x.need.tier === "Couture" && (x.state === "in_hand_closing" || x.state === "in_hand_partial"));
  const inHandClassique = tagged.filter((x) => x.state !== "closed" && x.need.tier === "Classique" && (x.state === "in_hand_closing" || x.state === "in_hand_partial"));

  // Two rental tracks: bags still needed at each tier, best value first.
  const coutureQueue = tagged.filter((x) => x.need.tier === "Couture" && x.state === "open").sort(byVal);
  const classiqueQueue = tagged.filter((x) => x.need.tier === "Classique" && (x.state === "open" || x.state === "in_hand_partial")).sort(byVal);

  const unconfirmed = tagged.filter((x) => x.state === "open" && x.need.tier === "Unconfirmed").sort(byVal);
  const notCarried = tagged.filter((x) => x.state === "open" && x.need.tier === "NotCarried");
  const archived = captures
    .filter((c) => c.status === "shot" || c.status === "published")
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.style.localeCompare(b.style));

  const L: string[] = [];
  L.push("# Content needs — what to photograph next");
  L.push("");
  L.push(`*Auto-generated by \`npm run content:needs\` (${GENERATED_ON}). Do not hand-edit — edit \`scripts/content-needs/catalog.ts\` (what the site needs / the plan) or \`scripts/content-needs/captured.csv\` (what's shot), then rerun.*`);
  L.push("");
  L.push(`**Plan:** ${PLAN.coutureSlots} Couture + ${PLAN.classiqueSlots} Classique item per month. Each bag is scored by the site surfaces it fills (a wired-but-empty slideshow cutout is worth most, then seeded-auth / protective-feet heroes, then About cutouts and live search demand) plus a homepage-canon bonus. The two tracks below fill your two slots; the plan-check flags when the Couture slot stops earning its keep.`);
  L.push("");
  L.push("> Vivrelle tiers/prices are from 2026 review sources (archivist pull 2026-07-07): Classique ~$139, Couture ~$239, Réservé/Privée ~$800 invite-only. Prices drift; the checkout page is ground truth. Our read, not a Vivrelle quote.");
  L.push("");

  // ---- In hand now ----
  L.push("## In hand now — shoot before you return them");
  L.push("");
  const inHand = [...inHandCouture, ...inHandClassique];
  if (inHand.length === 0) {
    L.push("_Nothing checked out right now._");
  } else {
    L.push(DETAIL_HEAD);
    for (const x of inHand) {
      const tag = x.state === "in_hand_closing" ? "IN HAND — closes this hero." : "IN HAND (off-marquee variant) — shoot it; the marquee spec stays a low-priority future pull.";
      L.push(detailRow(x.need, captures, tag));
    }
  }
  L.push("");

  // ---- Monthly plan ----
  L.push("## Your monthly plan (1 Couture + 1 Classique)");
  L.push("");
  L.push("| Pull | Couture slot | Classique slot |\n|---|---|---|");
  const flapInHand = inHandCouture[0];
  const neverfullInHand = inHandClassique[0];
  L.push(`| 1 · in hand | ${flapInHand ? short(flapInHand.need) : "—"} | ${neverfullInHand ? `${short(neverfullInHand.need)} (Epi)` : "—"} |`);
  const pulls = Math.max(coutureQueue.length, classiqueQueue.length);
  for (let i = 0; i < pulls; i++) {
    const c = coutureQueue[i];
    const q = classiqueQueue[i];
    const coutureCell = c ? `${short(c.need)} (value ${effValue(c.need, captures)})` : "— none needed · wasted slot";
    const classiqueCell = q ? `${short(q.need)} (value ${effValue(q.need, captures).toFixed(q.state === "in_hand_partial" ? 1 : 0)})` : "—";
    L.push(`| ${i + 2} | ${coutureCell} | ${classiqueCell} |`);
  }
  L.push("");

  // ---- Plan check ----
  const coutureLeft = coutureQueue.length;
  const coutureValueLeft = coutureQueue.reduce((s, x) => s + effValue(x.need, captures), 0);
  const classiqueLeft = classiqueQueue.length;
  L.push("## Plan check — is the Couture slot worth it?");
  L.push("");
  L.push(`- **Couture track after the in-hand Classic Flap: ${coutureLeft} bag${coutureLeft === 1 ? "" : "s"} left** (total value ${coutureValueLeft.toFixed(1)}). The Classic Flap in hand is the one bag that clearly earns the Couture slot.`);
  L.push(`- **Classique track: ${classiqueLeft} bags queued**, and that is where nearly all the site's photo needs live.`);
  if (coutureLeft <= 2 && classiqueLeft > coutureLeft) {
    L.push("- **My take (recommended):** shoot the Classic Flap this month on the Couture slot, then **switch to the cheaper 2× Classique plan.** The Couture queue runs dry almost immediately, while the Classique queue is deep, so two Classique pulls a month clears real gaps faster and stops paying the Couture premium for a slot with nothing left to shoot. Keep a one-off Couture month in your pocket only if you later want a rare/seasonal Chanel or the 2.55 Reissue.");
  }
  L.push("");

  // ---- Detailed tracks ----
  L.push("## Classique track — ranked (deep queue)");
  L.push("");
  L.push(DETAIL_HEAD);
  for (const x of classiqueQueue) {
    const tag = x.state === "in_hand_partial" ? "Marquee spec (the in-hand variant does not cover it)." : "";
    L.push(detailRow(x.need, captures, tag));
  }
  L.push("");

  L.push("## Couture track — ranked (thin queue)");
  L.push("");
  if (coutureQueue.length === 0) {
    L.push("_Nothing left that needs Couture. The in-hand Classic Flap was the last one._");
  } else {
    L.push(DETAIL_HEAD);
    for (const x of coutureQueue) L.push(detailRow(x.need, captures));
  }
  L.push("");

  if (unconfirmed.length > 0) {
    L.push("## Rentability unconfirmed — check the live closet first");
    L.push("");
    L.push(DETAIL_HEAD);
    for (const x of unconfirmed) L.push(detailRow(x.need, captures));
    L.push("");
  }

  if (notCarried.length > 0) {
    L.push("## Not via Vivrelle — source elsewhere (owned / Fashionphile / UGC)");
    L.push("");
    L.push(DETAIL_HEAD);
    for (const x of notCarried) L.push(detailRow(x.need, captures));
    L.push("");
  }

  L.push(`## Already captured (${archived.length})`);
  L.push("");
  L.push("| Bag | Spec | Source | Date |\n|---|---|---|---|");
  for (const c of archived) {
    const spec = [c.colorway, c.material].filter((s) => s && s !== "various").join(" ") || "—";
    L.push(`| ${c.brand} ${c.style} | ${spec} | ${c.source} | ${c.date || "—"} |`);
  }
  L.push("");

  L.push("---");
  L.push("");
  L.push("### Update it");
  L.push("1. Shot a bag? Append a line to `scripts/content-needs/captured.csv` (`status` = `shot`; `published` once it's live on the bag page).");
  L.push("2. Run `npm run content:needs`. The tracks re-rank and the bag moves to *Already captured*.");
  L.push("3. Changed your Vivrelle plan? Edit `PLAN` in `scripts/content-needs/catalog.ts`. New hero list / slideshow pairing / cutout slot? Add it to `NEEDS` and rerun.");
  L.push("4. Later: the live 'Most Wanted Photos' want-count signal (`src/lib/photos.ts` `getMostWantedPhotos`) can plug in as another demand source once a service-role key is in the env.");
  L.push("");

  fs.writeFileSync(OUT, L.join("\n"));
  process.stdout.write(`Wrote ${OUT}\n`);
  process.stdout.write(`In hand: ${inHand.length} · Couture queue: ${coutureQueue.length} · Classique queue: ${classiqueQueue.length} · Captured: ${archived.length}\n`);
}

main();
