// Background removal: turn a bag photo into a transparent PNG cutout so it floats
// in frame instead of sitting on a photo card. Local, via @imgly/background-removal-node
// (downloads its model once on first use). Result is cached next to the source.
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { removeBackground } from "@imgly/background-removal-node";

// inputPath -> transparent PNG path. Cached: skips work if the .cut.png exists.
export const cutout = async (inputPath, outPath) => {
  const out =
    outPath ?? inputPath.replace(/\.[^.]+$/, "") + ".cut.png";
  if (existsSync(out)) return out;
  const blob = await removeBackground(inputPath, {
    output: { format: "image/png" },
  });
  const buf = Buffer.from(await blob.arrayBuffer());
  writeFileSync(out, buf);
  return out;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const inp = process.argv[2];
  if (!inp) {
    console.error("Usage: node scripts/cutout.mjs <image> [out.png]");
    process.exit(1);
  }
  const out = await cutout(path.resolve(inp), process.argv[3]);
  console.log("wrote", out);
}
