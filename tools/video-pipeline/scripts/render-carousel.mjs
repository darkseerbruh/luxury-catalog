// render-carousel.mjs — faceless brand slide decks -> PNG carousels (no footage).
//
// The gap this fills: our faceless Hero/data posts are swipeable SLIDES (IG carousel,
// TikTok photo post), not montage reels. This turns a JSON deck spec into on-brand
// 1080x1350 PNG slides, screenshotting HTML with the Chromium that @remotion/renderer
// already bundles. Type-led only: no bag photos, no logos illustrated (brand rule).
//
// Usage:  node scripts/render-carousel.mjs carousel-decks/<deck>.json
//         renders to carousel-decks/out/<deck-name>/slide-01.png ...
//
// Brand tokens mirror tools/video-pipeline/src/brand.ts + docs/video-accessibility.md:
// cream #f3ede0 on warm charcoal, gold #c9a24c accent, Playfair serif, gold-diamond
// footer, on-screen text floors (headline >=56px, body >=46px, hint >=34px).

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PIPELINE = join(HERE, "..");
const REL = "node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell";
// node_modules is per-checkout and gitignored, so a git worktree won't have it.
// Look in this pipeline, then the primary checkout, then an env override.
const SHELL = [
  process.env.CHROME_SHELL,
  join(PIPELINE, REL),
  `/Users/ariellecoambes/Documents/luxury-catalog/tools/video-pipeline/${REL}`,
].find((p) => p && existsSync(p));
if (!SHELL) throw new Error("chrome-headless-shell not found; set CHROME_SHELL or run npm i in tools/video-pipeline");

const W = 1080;
const H = 1350; // 4:5, the IG carousel + TikTok photo canvas
const CREAM = "#f3ede0";
const GOLD = "#c9a24c";
const INK = "#171310"; // warm near-black
const INK2 = "#241d17";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// wrap the words listed in `accent` in a gold span (case-insensitive, whole word)
function accentize(text, accent = []) {
  let out = esc(text);
  for (const a of accent) {
    const re = new RegExp(`\\b(${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi");
    out = out.replace(re, `<span style="color:${GOLD}">$1</span>`);
  }
  return out;
}

const FOOTER = `
  <div style="position:absolute;left:0;right:0;bottom:96px;display:flex;flex-direction:column;align-items:center;gap:18px">
    <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:34px;color:${CREAM};opacity:.82">
      <span style="color:${GOLD};font-style:normal">&#9670;</span>&nbsp; know the facts on every bag</div>
    <div style="display:flex;align-items:center;gap:22px">
      <span style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:30px;letter-spacing:4px;color:${CREAM};opacity:.9">FOLLOW ALONG</span>
      <span style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:30px;color:${INK};background:${GOLD};padding:10px 22px;border-radius:999px;letter-spacing:1px">luxurycatalog.com</span>
    </div>
  </div>`;

function slideHTML(s, idx, total) {
  const kicker = s.kicker
    ? `<div style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:32px;letter-spacing:6px;text-transform:uppercase;color:${GOLD};margin-bottom:40px">${esc(s.kicker)}</div>`
    : "";
  const headSize = s.type === "cover" ? 108 : 82;
  const headline = s.headline
    ? `<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:${headSize}px;line-height:1.08;margin:0;color:${CREAM};max-width:860px">${accentize(s.headline, s.accent)}</h1>`
    : "";
  const body = s.body
    ? `<p style="font-family:Georgia,'Times New Roman',serif;font-size:50px;line-height:1.34;margin:44px 0 0;color:${CREAM};opacity:.92;max-width:820px">${accentize(s.body, s.accent)}</p>`
    : "";
  const bullets = s.bullets
    ? `<ul style="list-style:none;padding:0;margin:48px 0 0;max-width:840px">${s.bullets
        .map(
          (b) =>
            `<li style="font-family:Georgia,'Times New Roman',serif;font-size:50px;line-height:1.28;color:${CREAM};margin:0 0 30px;padding-left:52px;position:relative"><span style="position:absolute;left:0;top:6px;color:${GOLD};font-size:38px">&#9670;</span>${accentize(b, s.accent)}</li>`,
        )
        .join("")}</ul>`
    : "";
  const hint = s.hint
    ? `<div style="position:absolute;left:0;right:0;bottom:200px;text-align:center;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:36px;color:${CREAM};opacity:.7">( ${esc(s.hint)} )</div>`
    : "";
  const pageno = `<div style="position:absolute;top:80px;right:96px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:30px;letter-spacing:3px;color:${CREAM};opacity:.5">${idx}/${total}</div>`;
  const align = s.type === "cover" ? "center" : "flex-start";
  const textAlign = s.type === "cover" ? "center" : "left";
  return `<!doctype html><html><head><meta charset="utf-8">
<body style="margin:0;width:${W}px;height:${H}px;background:${INK};overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 120% 90% at 50% 8%, ${INK2} 0%, ${INK} 60%)"></div>
  ${pageno}
  <div style="position:absolute;top:150px;left:110px;right:110px;bottom:340px;display:flex;flex-direction:column;justify-content:${align};align-items:${s.type === "cover" ? "center" : "flex-start"};text-align:${textAlign}">
    ${kicker}${headline}${body}${bullets}
  </div>
  ${hint}${FOOTER}
</body></html>`;
}

function main() {
  const specPath = process.argv[2];
  if (!specPath) throw new Error("usage: node render-carousel.mjs <deck.json>");
  const deck = JSON.parse(readFileSync(specPath, "utf8"));
  const outDir = join(dirname(specPath), "out", deck.name);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const tmp = join(outDir, "_tmp.html");
  const total = deck.slides.length;
  deck.slides.forEach((s, i) => {
    const n = String(i + 1).padStart(2, "0");
    writeFileSync(tmp, slideHTML(s, i + 1, total));
    const png = join(outDir, `slide-${n}.png`);
    execFileSync(
      SHELL,
      [
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--window-size=${W},${H}`,
        `--screenshot=${png}`,
        pathToFileURL(resolve(tmp)).href,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    process.stdout.write(`  slide ${n}\n`);
  });
  rmSync(tmp, { force: true });
  console.log(`rendered ${total} slides -> ${outDir}`);
}

main();
