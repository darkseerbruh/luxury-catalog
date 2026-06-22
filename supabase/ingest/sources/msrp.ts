/**
 * MSRP source adapter. No network — emits the curated, cited retail-price
 * history (src/lib/ingest/msrp-data.ts) into the landing zone as retail_msrp
 * observations. Run: `npm run ingest:msrp`.
 */
import { allMsrpObservations } from "../../../src/lib/ingest/msrp-data";
import { writeObservations } from "../lib/landing";

function main() {
  const obs = allMsrpObservations();
  const { file, kept, dropped } = writeObservations("msrp", obs);
  console.log(`msrp: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped} invalid)` : ""} -> ${file}`);
}

main();
