// Production server: the built site (dist/) + the FitCheck API on one port.
// Usage: npm run build && npm start   (PORT, ADMIN_PASSCODE, DB_PATH via env)

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createApi } from "./api.mjs";

const PORT = Number(process.env.PORT) || 8080;
const DIST = resolve("dist");
const api = createApi({ dbPath: process.env.DB_PATH || "data/mehfil.db" });

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".txt": "text/plain", ".xml": "application/xml", ".woff2": "font/woff2",
};

createServer((req, res) => {
  api(req, res, () => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([\\/])+/, "");
    let file = join(DIST, path);
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html"); // SPA fallback
    res.setHeader("Content-Type", TYPES[extname(file)] || "application/octet-stream");
    if (file.includes(`${join("dist", "assets")}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    createReadStream(file).pipe(res);
  });
}).listen(PORT, () => console.log(`Mehfil Couture running on http://localhost:${PORT}`));
