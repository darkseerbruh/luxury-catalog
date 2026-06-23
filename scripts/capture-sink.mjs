// Tiny localhost sink for browser-captured JSON (see docs/catalog-backbone-handoff.md §3
// "TRANSPORT GOTCHA"). The logged-in browser POSTs window.__data here; we write it to
// data/ingest/_raw/<key>.json. Chrome exempts http://localhost from mixed-content blocking,
// so an https resale page can POST to it. Permissive CORS because the POST is cross-origin.
// CAVEAT: only works from origins whose Content-Security-Policy allows connect-src to
// localhost. TheRealReal's CSP blocks it — for TRR use the get_page_text body-transport
// (handoff §3). Useful for looser-CSP origins; verify per site before relying on it.
// Usage: node scripts/capture-sink.mjs [port]   (default 7777). Ctrl-C to stop.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.argv[2]) || 7777;
const RAW_DIR = path.resolve(process.cwd(), "data/ingest/_raw");
fs.mkdirSync(RAW_DIR, { recursive: true });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  if (req.method !== "POST") { res.writeHead(405, cors); return res.end("POST only"); }
  // ?key=<name> -> data/ingest/_raw/<name>.json (sanitised)
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const key = (url.searchParams.get("key") || "capture").replace(/[^a-z0-9_-]/gi, "");
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    try {
      const parsed = JSON.parse(body); // validate it's JSON
      const count = Array.isArray(parsed) ? parsed.length : 1;
      const out = path.join(RAW_DIR, `${key}.json`);
      fs.writeFileSync(out, JSON.stringify(parsed));
      console.log(`[sink] wrote ${count} records (${body.length} bytes) -> ${out}`);
      res.writeHead(200, cors);
      res.end(JSON.stringify({ ok: true, key, count, bytes: body.length }));
    } catch (e) {
      console.error(`[sink] bad payload: ${e.message}`);
      res.writeHead(400, cors);
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  });
}).listen(PORT, "127.0.0.1", () => console.log(`[sink] listening on http://localhost:${PORT}`));
