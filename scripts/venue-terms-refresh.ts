/**
 * Venue-terms freshness runner. The seller fees on /where-to-sell and the buyer
 * protections on /where-to-buy are HARD, dated facts; this keeps them from going
 * stale by reporting which cells are past the re-verify cadence, with the exact
 * source URL to re-check. Deterministic, no network: it produces the worklist the
 * monthly re-verify agent (and a human) act on. See docs/venue-terms-refresh.md.
 *
 *   npx tsx scripts/venue-terms-refresh.ts            # print a summary
 *   npx tsx scripts/venue-terms-refresh.ts --report   # + write reports/venue-terms/<date>.md
 *   npx tsx scripts/venue-terms-refresh.ts --check     # exit 1 if anything is due (CI guard)
 *
 * Flags: --cadence=<days> (default 30).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { assessFreshness, dueByVenue } from "../src/lib/venue-terms-freshness";

const args = process.argv.slice(2);
const cadence = Number((args.find((a) => a.startsWith("--cadence=")) ?? "").split("=")[1]) || 30;
const asOf = new Date().toISOString().slice(0, 10);

const result = assessFreshness(asOf, cadence);
const groups = dueByVenue(result);

const summary =
  `Venue terms freshness as of ${asOf} (cadence ${cadence}d): ` +
  `${result.total} cells, ${result.due.length} due, oldest ${result.oldestAgeDays ?? 0}d.`;
console.log(summary);
for (const g of groups) {
  console.log(`  [${g.surface}] ${g.venueLabel}: ${g.cells.length} cell(s), oldest ${g.oldestAgeDays}d`);
}

if (args.includes("--report")) {
  const lines: string[] = [];
  lines.push(`# Venue terms refresh report`);
  lines.push("");
  lines.push(`Generated ${asOf}. Cadence: ${cadence} days. ${result.total} dated cells total.`);
  lines.push("");
  if (result.due.length === 0) {
    lines.push(`All cells are current. Oldest is ${result.oldestAgeDays ?? 0} days. Nothing to re-verify.`);
  } else {
    lines.push(`## ${result.due.length} cell(s) due for re-verification`);
    lines.push("");
    lines.push(`Re-check each source below against the stored value, then bump its \`checkedAt\` (and the value if it changed) in \`src/lib/where-to-sell.ts\` or \`src/lib/where-to-buy.ts\`.`);
    lines.push("");
    for (const g of groups) {
      lines.push(`### ${g.venueLabel} (${g.surface}, oldest ${g.oldestAgeDays}d)`);
      for (const c of g.cells) {
        lines.push(`- \`${c.field}\` - last checked ${c.checkedAt} (${c.ageDays}d ago) - ${c.sourceUrl}`);
      }
      lines.push("");
    }
  }
  const dir = "reports/venue-terms";
  mkdirSync(dir, { recursive: true });
  const path = `${dir}/${asOf}.md`;
  writeFileSync(path, lines.join("\n") + "\n");
  console.log(`wrote ${path}`);
}

if (args.includes("--check") && result.due.length > 0) {
  process.exit(1);
}
