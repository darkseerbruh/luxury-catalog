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
  DECISIONS,
  GENERIC_SHOTLIST,
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

  const coutureSlots: number = PLAN.coutureSlots;
  const classiqueSlots: number = PLAN.classiqueSlots;
  const planLabel = coutureSlots > 0
    ? `${coutureSlots} Couture + ${classiqueSlots} Classique per month`
    : `${classiqueSlots} Classique items per month (Classique+)`;

  // Rental tracks: bags still needed at each tier, best value first. Bags tagged
  // plannedVia "premier" are swept via the add-on, so they leave the Classique slot queue.
  const coutureQueue = tagged.filter((x) => x.need.tier === "Couture" && x.state === "open").sort(byVal);
  const classiqueQueue = tagged.filter((x) => x.need.tier === "Classique" && x.need.plannedVia !== "premier" && (x.state === "open" || x.state === "in_hand_partial")).sort(byVal);
  const premierSweep = tagged.filter((x) => x.need.plannedVia === "premier" && x.state !== "closed").sort(byVal);

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
  L.push(`**Plan:** ${planLabel}, plus a short-term Premier add-on to sweep the Premier-closet bags (see below). Each bag is scored by the site surfaces it fills (a wired-but-empty slideshow cutout is worth most, then seeded-auth / protective-feet heroes, then About cutouts and live search demand) plus a homepage-canon bonus. The queue below fills your slots best value first.`);
  L.push("");
  L.push("> Vivrelle prices from 2026 review sources: Classique ~$139, Classique+ ~$249 (2 items), Premier add-on ~$49/mo recurring (Vivrelle How It Works, 2026-07-08), Réservé/Privée ~$800 invite-only. Prices drift; the checkout page is ground truth. Our read, not a Vivrelle quote.");
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

  // ---- Shoot list: what's in hand + the next pull ----
  const shotListNeeds = [...inHand.map((x) => x.need)];
  if (classiqueQueue[0]) shotListNeeds.push(classiqueQueue[0].need);
  if (shotListNeeds.length > 0) {
    L.push("## Shoot list — in hand + next up");
    L.push("");
    L.push("_Spec: square, >=1000px source, plain even-lit background. The primary is both the bag-page hero and the cutout source._");
    L.push("");
    for (const need of shotListNeeds) {
      L.push(`**${need.brand} ${need.style}**`);
      for (const s of GENERIC_SHOTLIST) L.push(`- ${s}`);
      for (const s of need.detailShots ?? []) L.push(`- ${s}`);
      L.push("");
    }
  }

  // ---- Monthly plan (driven by PLAN) ----
  L.push(`## Your monthly plan — ${planLabel}`);
  L.push("");
  const cols: string[] = [
    ...Array.from({ length: coutureSlots }, () => "Couture slot"),
    ...Array.from({ length: classiqueSlots }, () => "Classique slot"),
  ];
  L.push(`| Pull | ${cols.join(" | ")} |`);
  L.push(`|---|${cols.map(() => "---").join("|")}|`);
  const cell = (x: { need: Need; state: State } | undefined): string =>
    x ? `${short(x.need)} (v${effValue(x.need, captures).toFixed(x.state === "in_hand_partial" ? 1 : 0)})` : "—";
  let ci = 0;
  let qi = 0;
  const pulls = Math.max(
    coutureSlots > 0 ? Math.ceil(coutureQueue.length / coutureSlots) : 0,
    classiqueSlots > 0 ? Math.ceil(classiqueQueue.length / classiqueSlots) : 0,
  );
  for (let p = 0; p < pulls; p++) {
    const cells: string[] = [];
    for (let k = 0; k < coutureSlots; k++) cells.push(cell(coutureQueue[ci++]));
    for (let k = 0; k < classiqueSlots; k++) cells.push(cell(classiqueQueue[qi++]));
    L.push(`| ${p + 1} | ${cells.join(" | ")} |`);
  }
  L.push("");
  L.push(`_In hand this cycle (separate from the plan above): ${[...inHandCouture, ...inHandClassique].map((x) => short(x.need)).join(", ") || "nothing"}. Shoot them before returning._`);
  L.push("");

  // ---- Plan check ----
  const classiqueLeft = classiqueQueue.length;
  const months = classiqueSlots > 0 ? Math.ceil(classiqueLeft / classiqueSlots) : 0;
  L.push("## Plan check");
  L.push("");
  if (coutureSlots === 0) {
    L.push("- **Plan set: Classique+ (2 items/mo).** The in-hand Classic Flap was the last Couture-worthy shot; the only remaining Couture-only need is the 2.55 Reissue (value 2), which would take a one-off Couture month, not a standing slot.");
    L.push(`- **Classique queue: ${classiqueLeft} bags → ~${months} months at ${classiqueSlots}/mo.**`);
    L.push("- **Premier add-on:** a short-term $49/mo add grabs Marmont + Cassette as extra items without spending a Classique slot (one per 30-day cycle, then cancel). See the sweep below.");
  } else {
    const coutureLeft = coutureQueue.length;
    L.push(`- **Couture track: ${coutureLeft} bag${coutureLeft === 1 ? "" : "s"} left.** **Classique track: ${classiqueLeft} bags.**`);
    if (coutureLeft <= 2 && classiqueLeft > coutureLeft) {
      L.push("- **My take:** the Couture queue is nearly dry while Classique is deep. Consider switching to 2× Classique.");
    }
  }
  L.push("");

  // ---- Premier add-on sweep ----
  if (premierSweep.length > 0) {
    L.push("## Premier add-on sweep — short-term, then cancel");
    L.push("");
    L.push("_These sit in Vivrelle's Premier closet, so a ~$49/mo Premier add-on grabs each as an EXTRA item without spending a Classique slot (one per 30-day cycle, then cancel the add-on). ~$49 per bag vs ~$124 for a Classique slot. Confirm both are in the Premier closet in-app (medium confidence)._");
    L.push("");
    L.push(DETAIL_HEAD);
    for (const x of premierSweep) L.push(detailRow(x.need, captures));
    L.push("");
  }

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

  if (DECISIONS.length > 0) {
    L.push("## Decisions (logged)");
    L.push("");
    for (const d of DECISIONS) L.push(`- **${d.date}:** ${d.text}`);
    L.push("");
  }

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
