// Mehfil FitCheck API — designs, QR pieces & lots, scans, consented leads,
// FitCheck orders and size charts. Dependency-free: Node's built-in SQLite.
// Mounted inside Vite in development (vite.config.ts) and by server/index.mjs in production.

import { DatabaseSync } from "node:sqlite";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SESSION_HOURS = 12;
const MAX_BODY = 256 * 1024;

const now = () => new Date().toISOString();
const rid = (n = 9) => randomBytes(n).toString("base64url");
const j = (v) => JSON.stringify(v ?? null);
const pj = (v, d) => {
  try {
    return v == null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, story TEXT, fabric TEXT,
  embroidery TEXT, care TEXT, colours TEXT, sizes TEXT, occasions TEXT, image_url TEXT,
  is_demo INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS lots (
  id TEXT PRIMARY KEY, design_id TEXT NOT NULL, note TEXT, quantity INTEGER, created_at TEXT);
CREATE TABLE IF NOT EXISTS pieces (
  code TEXT PRIMARY KEY, design_id TEXT NOT NULL, lot_id TEXT, colour TEXT, size TEXT,
  status TEXT DEFAULT 'in_stock', created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, design_id TEXT, at TEXT);
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, design_id TEXT, piece_code TEXT, occasion TEXT, style TEXT, budget TEXT,
  mobile TEXT NOT NULL, size TEXT, location_method TEXT, lat REAL, lng REAL, accuracy REAL,
  location_text TEXT, colours TEXT, consent INTEGER NOT NULL, consent_text TEXT, consent_at TEXT,
  status TEXT DEFAULT 'new', is_demo INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, mode TEXT, garment TEXT, unit TEXT, measurements TEXT, spec TEXT,
  confidence INTEGER, verdict TEXT, event_date TEXT, embroidery TEXT, feasibility TEXT,
  contact TEXT, notes TEXT, stylist_requested INTEGER DEFAULT 0, status TEXT, timeline TEXT,
  created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS size_charts (
  id TEXT PRIMARY KEY, name TEXT, region TEXT, unit TEXT, rows TEXT, source TEXT,
  is_sample INTEGER DEFAULT 0, created_at TEXT);
CREATE TABLE IF NOT EXISTS piece_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, at TEXT, action TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS idx_pieces_design ON pieces(design_id);
CREATE INDEX IF NOT EXISTS idx_scans_design ON scans(design_id);
CREATE INDEX IF NOT EXISTS idx_scans_code ON scans(code);
CREATE INDEX IF NOT EXISTS idx_leads_design ON leads(design_id);
CREATE INDEX IF NOT EXISTS idx_events_code ON piece_events(code);
`;

// Columns added after the first release; existing databases get them on start.
const MIGRATIONS = [
  ["scans", "device", "TEXT"],
  ["pieces", "sold_at", "TEXT"],
  ["pieces", "note", "TEXT"],
];

const PIECE_STATUSES = ["in_stock", "reserved", "sold", "void"];
// A sold tag scanned from more phones than this in 30 days may have been copied.
const CLONE_DEVICES = 6;

// ── Seeds: clearly labelled samples the studio replaces ──
const SAMPLE_DESIGNS = [
  {
    id: "MC-BR-001", name: "Zardozi Maroon Bridal Lehenga", category: "Handcrafted Bridal",
    story: "Sample story — replace with the studio's own. Hand-embroidered zardozi vines climb the kalis, finished with a scalloped border that catches the light on every turn.",
    fabric: "Velvet lehenga · net dupatta", embroidery: "Zardozi, dabka and sequin hand-work", care: "Dry clean only. Store folded in muslin, away from direct sunlight.",
    colours: ["Maroon", "Red"], sizes: ["XS", "S", "M", "L", "XL"], occasions: ["Wedding", "Engagement"],
  },
  {
    id: "MC-LP-014", name: "Blush Resham Prêt Lehenga", category: "Luxury Prêt",
    story: "Sample story — replace with the studio's own. Tonal resham florals on a light organza base, made for sangeets and day functions.",
    fabric: "Organza · silk lining", embroidery: "Resham thread-work with mirror accents", care: "Dry clean. Steam on low heat.",
    colours: ["Blush", "Ivory", "Sage"], sizes: ["XS", "S", "M", "L", "XL", "XXL"], occasions: ["Sangeet", "Festive", "Engagement"],
  },
  {
    id: "MC-IW-003", name: "Midnight Indo-Western Gown", category: "Indo-Western",
    story: "Sample story — replace with the studio's own. A fluid gown silhouette with an Indian heart: gold dori-work at the neckline and cuffs.",
    fabric: "Georgette · crepe lining", embroidery: "Dori and cut-dana work", care: "Dry clean only.",
    colours: ["Midnight", "Maroon", "Gold"], sizes: ["S", "M", "L", "XL"], occasions: ["Party", "Reception"],
  },
];

// Common Indian women's size chart values (inches). Marked as a sample to replace.
const SAMPLE_CHART = {
  id: "chart-in-sample", name: "Sample Indian women's chart (replace)", region: "IN", unit: "in",
  rows: [
    { size: "XS", bust: 32, waist: 26, hip: 35 },
    { size: "S", bust: 34, waist: 28, hip: 37 },
    { size: "M", bust: 36, waist: 30, hip: 39 },
    { size: "L", bust: 38, waist: 32, hip: 41 },
    { size: "XL", bust: 40, waist: 34, hip: 43 },
    { size: "XXL", bust: 42, waist: 36, hip: 45 },
  ],
};

export function createApi({
  dbPath = "data/mehfil.db",
  adminPasscode = process.env.ADMIN_PASSCODE || "mehfil-admin-2026",
  mlUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001",
} = {}) {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  for (const [table, col, type] of MIGRATIONS)
    if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  seed(db);

  const sessions = new Map(); // token -> expiry ms
  const hits = new Map(); // ip -> [timestamps] (lead rate limit)

  const q = (sql) => db.prepare(sql);

  function isAdmin(req) {
    const h = req.headers.authorization || "";
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    const exp = sessions.get(t);
    if (!exp) return false;
    if (exp < Date.now()) {
      sessions.delete(t);
      return false;
    }
    return true;
  }
  const requireAdmin = (req) => {
    if (!isAdmin(req)) throw new HttpError(401, "Please sign in to the studio portal again.");
  };

  // ── row mappers ──
  const designOut = (d) => d && {
    id: d.id, name: d.name, category: d.category, story: d.story, fabric: d.fabric, embroidery: d.embroidery, care: d.care,
    colours: pj(d.colours, []), sizes: pj(d.sizes, []), occasions: pj(d.occasions, []), imageUrl: d.image_url || "", isDemo: !!d.is_demo,
    createdAt: d.created_at, updatedAt: d.updated_at,
  };
  const leadOut = (l) => ({
    id: l.id, designId: l.design_id, pieceCode: l.piece_code, occasion: l.occasion, style: l.style, budget: l.budget,
    mobile: l.mobile, size: l.size,
    location: { method: l.location_method, lat: l.lat, lng: l.lng, accuracy: l.accuracy, text: l.location_text },
    colours: pj(l.colours, []), consent: !!l.consent, consentText: l.consent_text, consentAt: l.consent_at,
    status: l.status, isDemo: !!l.is_demo, createdAt: l.created_at,
  });
  const orderOut = (o, admin = false) => ({
    id: o.id, mode: o.mode, garment: o.garment, unit: o.unit, measurements: pj(o.measurements, {}), spec: pj(o.spec, null),
    confidence: o.confidence, verdict: o.verdict, eventDate: o.event_date, embroidery: o.embroidery, feasibility: pj(o.feasibility, null),
    stylistRequested: !!o.stylist_requested, status: o.status, timeline: pj(o.timeline, []), createdAt: o.created_at, updatedAt: o.updated_at,
    ...(admin ? { contact: o.contact, notes: o.notes } : {}),
  });

  function availability(designId) {
    const rows = q(`SELECT colour, size, status, COUNT(*) n FROM pieces WHERE design_id = ? GROUP BY colour, size, status`).all(designId);
    const inStock = rows.filter((r) => r.status === "in_stock");
    return {
      tracked: rows.length > 0,
      inStock: inStock.map((r) => ({ colour: r.colour, size: r.size, count: r.n })),
    };
  }

  // ── pieces: lifecycle history, scan stats, copy / retired-tag flags ──
  const logEvent = (code, action, detail = null) =>
    q("INSERT INTO piece_events (code, at, action, detail) VALUES (?,?,?,?)").run(code, now(), action, detail);

  /** What the customer's passport may say about this tag. Scan counts stay in the portal. */
  const verification = (piece) => {
    if (!piece) return { kind: "design" };
    if (piece.status === "void") return { kind: "void" };
    return { kind: "genuine", soldAt: piece.status === "sold" ? (piece.sold_at || piece.updated_at || "").slice(0, 10) : null };
  };

  const flagOf = (p) =>
    p.status === "void" && p.after_void > 0
      ? "Retired tag is still being scanned"
      : p.status === "sold" && p.devices30 > CLONE_DEVICES
        ? `Sold tag scanned on ${p.devices30} phones in 30 days — it may have been copied`
        : null;

  const pieceOut = (p) => ({
    code: p.code, designId: p.design_id, designName: p.design_name, lotId: p.lot_id, colour: p.colour, size: p.size,
    status: p.status, note: p.note || "", soldAt: p.sold_at, createdAt: p.created_at, updatedAt: p.updated_at,
    scans: p.scans, devices: p.devices, lastScanAt: p.last_scan, leads: p.leads, flag: flagOf(p),
  });

  function listPieces({ status, design, lot, search, codes } = {}) {
    const where = [];
    const args = [new Date(Date.now() - 30 * 86400000).toISOString()];
    if (status) (where.push("p.status = ?"), args.push(status));
    if (design) (where.push("p.design_id = ?"), args.push(design));
    if (lot) (where.push("p.lot_id = ?"), args.push(lot));
    if (search) (where.push("(p.code LIKE ? OR d.name LIKE ? OR p.colour LIKE ? OR p.note LIKE ?)"), args.push(...Array(4).fill(`%${search}%`)));
    if (codes) (where.push(`p.code IN (${codes.map(() => "?").join(",") || "''"})`), args.push(...codes));
    return q(`SELECT p.*, d.name design_name,
                COUNT(s.id) scans, COUNT(DISTINCT s.device) devices, MAX(s.at) last_scan,
                COUNT(DISTINCT CASE WHEN s.at >= ? THEN s.device END) devices30,
                SUM(CASE WHEN p.status = 'void' AND s.at > p.updated_at THEN 1 ELSE 0 END) after_void,
                (SELECT COUNT(*) FROM leads l WHERE l.piece_code = p.code) leads
              FROM pieces p JOIN designs d ON d.id = p.design_id LEFT JOIN scans s ON s.code = p.code
              ${where.length ? "WHERE " + where.join(" AND ") : ""}
              GROUP BY p.code ORDER BY p.created_at DESC, p.design_id, p.colour, p.size, p.code LIMIT 5000`)
      .all(...args)
      .map(pieceOut);
  }

  function setPieceStatus(code, status, note) {
    const p = q("SELECT * FROM pieces WHERE code = ?").get(code);
    if (!p) throw new HttpError(404, `No piece with code ${code}.`);
    if (p.status === status) return false;
    const at = now();
    const soldAt = status === "sold" ? at : null;
    q("UPDATE pieces SET status = ?, sold_at = ?, updated_at = ? WHERE code = ?").run(status, soldAt, at, code);
    logEvent(code, p.status === "sold" && status === "in_stock" ? "returned" : status, note || null);
    return true;
  }

  // ── routes ──
  const routes = [];
  const route = (method, pattern, fn, maxBody = MAX_BODY) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
    routes.push({ method, re, keys, fn, maxBody });
  };

  // Python ML service (ml/app.py): Isolation Forest + PaddleOCR. Optional — the site falls back when it's down.
  async function ml(path, payload, timeoutMs) {
    let res;
    try {
      res = await fetch(mlUrl + path, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new HttpError(503, "The measurement assistant is offline right now.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(res.status === 400 ? 400 : 503, data.detail || "The measurement assistant couldn't handle that.");
    return data;
  }

  // Public
  route("GET", "/api/health", () => ({ ok: true, at: now() }));

  route("GET", "/api/p/:code", ({ params }) => {
    const code = params.code.toUpperCase();
    const piece = q("SELECT * FROM pieces WHERE code = ?").get(code);
    const design = designOut(q("SELECT * FROM designs WHERE id = ?").get(piece ? piece.design_id : code));
    if (!design) throw new HttpError(404, "We couldn't find this outfit. The tag may be from an older collection — please ask the studio.");
    return {
      design,
      piece: piece ? { code: piece.code, colour: piece.colour, size: piece.size, status: piece.status } : null,
      verification: verification(piece),
      availability: availability(design.id),
    };
  });

  route("POST", "/api/scan", ({ body }) => {
    const code = String(body.code || "").toUpperCase().slice(0, 40);
    const piece = q("SELECT design_id FROM pieces WHERE code = ?").get(code);
    const design = q("SELECT id FROM designs WHERE id = ?").get(piece ? piece.design_id : code);
    if (!design) throw new HttpError(404, "Unknown code.");
    // Anonymous random id the passport keeps on the phone — counts distinct phones, identifies no one
    const device = /^[A-Za-z0-9_-]{8,40}$/.test(String(body.device || "")) ? String(body.device) : null;
    if (device && q("SELECT 1 FROM scans WHERE code = ? AND device = ? AND at > ?").get(code, device, new Date(Date.now() - 30 * 60000).toISOString()))
      return { ok: true, counted: false };
    q("INSERT INTO scans (code, design_id, at, device) VALUES (?, ?, ?, ?)").run(code, design.id, now(), device);
    return { ok: true, counted: true };
  });

  route("POST", "/api/leads", ({ body, ip }) => {
    // Simple abuse guard: 10 submissions / hour / IP
    const t = Date.now();
    const recent = (hits.get(ip) || []).filter((x) => t - x < 3600_000);
    if (recent.length >= 10) throw new HttpError(429, "Too many submissions from this device. Please try again later.");
    hits.set(ip, [...recent, t]);

    if (body.consent !== true) throw new HttpError(400, "Please tick the consent box so we can save your details.");
    const mobile = String(body.mobile || "").replace(/[^\d+]/g, "");
    if (!/^\+?\d{10,13}$/.test(mobile)) throw new HttpError(400, "Please enter a valid mobile number (10 digits, or with country code).");
    const code = String(body.code || "").toUpperCase().slice(0, 40);
    const piece = q("SELECT * FROM pieces WHERE code = ?").get(code);
    const design = q("SELECT id FROM designs WHERE id = ?").get(piece ? piece.design_id : code);
    if (!design) throw new HttpError(404, "Unknown outfit code.");
    const str = (v, n) => (v == null ? null : String(v).trim().slice(0, n) || null);
    const loc = body.location || {};
    const method = loc.method === "gps" ? "gps" : loc.method === "manual" ? "manual" : null;
    const num = (v, lo, hi) => (typeof v === "number" && v >= lo && v <= hi ? v : null);
    const lat = method === "gps" ? num(loc.lat, -90, 90) : null;
    const lng = method === "gps" ? num(loc.lng, -180, 180) : null;
    const locText = str(loc.text, 160);
    if (!method || (method === "gps" && (lat == null || lng == null)) || (method === "manual" && !locText))
      throw new HttpError(400, "Please share your location or type your city / area.");
    const colours = Array.isArray(body.colours) ? body.colours.map((c) => String(c).slice(0, 24)).slice(0, 8) : [];
    if (!colours.length) throw new HttpError(400, "Please pick at least one colour you love.");
    const size = str(body.size, 60);
    if (!size) throw new HttpError(400, "Please choose your size.");
    const prefs = body.preferences || {};
    const id = "L-" + rid(6);
    const at = now();
    q(`INSERT INTO leads (id, design_id, piece_code, occasion, style, budget, mobile, size, location_method, lat, lng, accuracy,
        location_text, colours, consent, consent_text, consent_at, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?, 'new', ?, ?)`).run(
      id, design.id, piece ? piece.code : null, str(prefs.occasion, 40), str(prefs.style, 40), str(prefs.budget, 40), mobile, size,
      method, lat, lng, num(loc.accuracy, 0, 100000), locText, j(colours), str(body.consentText, 400), at, at, at,
    );
    return { ok: true, id };
  });

  route("GET", "/api/size-charts", () => ({
    charts: q("SELECT * FROM size_charts ORDER BY is_sample, created_at DESC").all().map((c) => ({
      id: c.id, name: c.name, region: c.region, unit: c.unit, rows: pj(c.rows, []), isSample: !!c.is_sample,
    })),
  }));

  // FitCheck ML: whole-set anomaly check (inches) and tailor-card OCR. Images are read in memory, never stored.
  route("POST", "/api/fitcheck/anomaly", ({ body }) => {
    const inches = Object.fromEntries(
      Object.entries(body.inches || {}).filter(([k, v]) => /^[a-zA-Z]{2,20}$/.test(k) && Number.isFinite(v) && v > 0 && v < 120),
    );
    return ml("/anomaly", { inches }, 4000);
  });
  route("POST", "/api/fitcheck/ocr", ({ body }) => {
    if (typeof body.image !== "string" || !body.image.startsWith("data:image/")) throw new HttpError(400, "Send the card as an image.");
    return ml("/ocr", { image: body.image }, 90000); // first call loads the PaddleOCR models
  }, 6 * 1024 * 1024);

  // FitCheck orders (customer side) — id is unguessable, acts as the resume link
  route("POST", "/api/orders", ({ body }) => {
    const id = "MF-" + rid(7);
    const at = now();
    const timeline = [{ step: "submitted", at, note: "Measurements confirmed by customer" }];
    if (body.stylistRequested) timeline.push({ step: "stylist_review", at, note: "Stylist-assisted review requested" });
    q(`INSERT INTO orders (id, mode, garment, unit, measurements, spec, confidence, verdict, event_date, embroidery, feasibility,
        contact, notes, stylist_requested, status, timeline, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, String(body.mode || "body").slice(0, 20), String(body.garment || "").slice(0, 40), body.unit === "cm" ? "cm" : "in",
      j(body.measurements || {}), j(body.spec || null), Math.max(0, Math.min(100, Number(body.confidence) || 0)), String(body.verdict || "").slice(0, 10),
      body.eventDate ? String(body.eventDate).slice(0, 10) : null, String(body.embroidery || "").slice(0, 20), j(body.feasibility || null),
      body.contact ? String(body.contact).replace(/[^\d+]/g, "").slice(0, 14) : null, body.notes ? String(body.notes).slice(0, 600) : null,
      body.stylistRequested ? 1 : 0, body.stylistRequested ? "stylist_review" : "submitted", j(timeline), at, at,
    );
    return { ok: true, id };
  });

  route("GET", "/api/orders/:id", ({ params }) => {
    const o = q("SELECT * FROM orders WHERE id = ?").get(params.id);
    if (!o) throw new HttpError(404, "We couldn't find that order. Check the link you saved.");
    return { order: orderOut(o) };
  });

  route("POST", "/api/orders/:id/stylist", ({ params }) => {
    const o = q("SELECT * FROM orders WHERE id = ?").get(params.id);
    if (!o) throw new HttpError(404, "Order not found.");
    const tl = pj(o.timeline, []);
    if (!o.stylist_requested) tl.push({ step: "stylist_review", at: now(), note: "Stylist-assisted review requested" });
    q("UPDATE orders SET stylist_requested = 1, status = CASE WHEN status = 'submitted' THEN 'stylist_review' ELSE status END, timeline = ?, updated_at = ? WHERE id = ?").run(j(tl), now(), o.id);
    return { order: orderOut(q("SELECT * FROM orders WHERE id = ?").get(o.id)) };
  });

  // Admin
  route("POST", "/api/admin/login", ({ body }) => {
    const a = Buffer.from(String(body.passcode || ""));
    const b = Buffer.from(adminPasscode);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, "That passcode didn't match.");
    const token = rid(24);
    sessions.set(token, Date.now() + SESSION_HOURS * 3600_000);
    return { token, expiresInHours: SESSION_HOURS };
  });

  route("GET", "/api/admin/summary", ({ req }) => {
    requireAdmin(req);
    const count = (sql, ...a) => q(sql).get(...a).n;
    const leads = q("SELECT * FROM leads").all().map(leadOut);
    const tally = (arr) => Object.entries(arr.reduce((m, k) => (k ? ((m[k] = (m[k] || 0) + 1), m) : m), {})).map(([label, value]) => ({ label, value })).sort((x, y) => y.value - x.value);
    const city = (l) => (l.location.method === "manual" ? (l.location.text || "").split(",")[0].trim() : "Shared via GPS");
    const scansByDesign = q(`SELECT d.id, d.name, COUNT(s.id) scans, (SELECT COUNT(*) FROM leads l WHERE l.design_id = d.id) leads
                             FROM designs d LEFT JOIN scans s ON s.design_id = d.id GROUP BY d.id ORDER BY scans DESC`).all();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({
        day: d,
        scans: count("SELECT COUNT(*) n FROM scans WHERE substr(at,1,10) = ?", d),
        leads: count("SELECT COUNT(*) n FROM leads WHERE substr(created_at,1,10) = ?", d),
      });
    }
    const scans = count("SELECT COUNT(*) n FROM scans");
    const pieces = listPieces();
    const byStatus = (s) => pieces.filter((p) => p.status === s).length;
    return {
      qr: {
        tagged: pieces.length, scanned: pieces.filter((p) => p.scans > 0).length,
        inStock: byStatus("in_stock"), reserved: byStatus("reserved"), sold: byStatus("sold"), void: byStatus("void"),
        topPieces: pieces.filter((p) => p.scans > 0).sort((a, b) => b.scans - a.scans).slice(0, 6),
        flagged: pieces.filter((p) => p.flag),
      },
      totals: {
        scans, leads: leads.length, conversion: scans ? Math.round((leads.length / scans) * 100) : 0,
        designs: count("SELECT COUNT(*) n FROM designs"), pieces: count("SELECT COUNT(*) n FROM pieces"),
        inStock: count("SELECT COUNT(*) n FROM pieces WHERE status = 'in_stock'"), orders: count("SELECT COUNT(*) n FROM orders"),
        demoLeads: leads.filter((l) => l.isDemo).length,
      },
      colours: tally(leads.flatMap((l) => l.colours)),
      sizes: tally(leads.map((l) => l.size)),
      occasions: tally(leads.map((l) => l.occasion)),
      locations: tally(leads.map(city)).slice(0, 8),
      byDesign: scansByDesign,
      daily: days,
    };
  });

  route("GET", "/api/admin/designs", ({ req }) => {
    requireAdmin(req);
    const ds = q("SELECT * FROM designs ORDER BY created_at DESC").all().map(designOut);
    return {
      designs: ds.map((d) => ({
        ...d,
        stats: {
          pieces: q("SELECT COUNT(*) n FROM pieces WHERE design_id = ?").get(d.id).n,
          inStock: q("SELECT COUNT(*) n FROM pieces WHERE design_id = ? AND status = 'in_stock'").get(d.id).n,
          scans: q("SELECT COUNT(*) n FROM scans WHERE design_id = ?").get(d.id).n,
          leads: q("SELECT COUNT(*) n FROM leads WHERE design_id = ?").get(d.id).n,
        },
      })),
    };
  });

  const designFields = (b) => {
    const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean).slice(0, 20);
    const name = String(b.name || "").trim();
    if (!name) throw new HttpError(400, "Give the design a name.");
    return {
      name: name.slice(0, 120), category: String(b.category || "").slice(0, 60), story: String(b.story || "").slice(0, 2000),
      fabric: String(b.fabric || "").slice(0, 200), embroidery: String(b.embroidery || "").slice(0, 200), care: String(b.care || "").slice(0, 400),
      colours: list(b.colours), sizes: list(b.sizes), occasions: list(b.occasions), imageUrl: String(b.imageUrl || "").slice(0, 500),
    };
  };

  route("POST", "/api/admin/designs", ({ req, body }) => {
    requireAdmin(req);
    const f = designFields(body);
    let id = String(body.id || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
    if (!id) id = "MC-" + rid(3).toUpperCase().replace(/[^A-Z0-9]/g, "X");
    if (q("SELECT id FROM designs WHERE id = ?").get(id)) throw new HttpError(409, `Design code ${id} already exists.`);
    const at = now();
    q(`INSERT INTO designs (id, name, category, story, fabric, embroidery, care, colours, sizes, occasions, image_url, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, f.name, f.category, f.story, f.fabric, f.embroidery, f.care, j(f.colours), j(f.sizes), j(f.occasions), f.imageUrl, at, at);
    return { design: designOut(q("SELECT * FROM designs WHERE id = ?").get(id)) };
  });

  route("PUT", "/api/admin/designs/:id", ({ req, params, body }) => {
    requireAdmin(req);
    const f = designFields(body);
    const r = q(`UPDATE designs SET name=?, category=?, story=?, fabric=?, embroidery=?, care=?, colours=?, sizes=?, occasions=?, image_url=?, is_demo=0, updated_at=? WHERE id=?`)
      .run(f.name, f.category, f.story, f.fabric, f.embroidery, f.care, j(f.colours), j(f.sizes), j(f.occasions), f.imageUrl, now(), params.id);
    if (!r.changes) throw new HttpError(404, "Design not found.");
    return { design: designOut(q("SELECT * FROM designs WHERE id = ?").get(params.id)) };
  });

  route("DELETE", "/api/admin/designs/:id", ({ req, params }) => {
    requireAdmin(req);
    const n = q("SELECT COUNT(*) n FROM pieces WHERE design_id = ?").get(params.id).n;
    if (n) throw new HttpError(409, `This design has ${n} QR-tagged pieces. Delete its lots first.`);
    q("DELETE FROM designs WHERE id = ?").run(params.id);
    return { ok: true };
  });

  // QR lots: one lot = a batch of uniquely-coded pieces of one design
  route("POST", "/api/admin/lots", ({ req, body }) => {
    requireAdmin(req);
    const design = q("SELECT * FROM designs WHERE id = ?").get(String(body.designId || ""));
    if (!design) throw new HttpError(404, "Choose a design first.");
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const clean = lines
      .map((l) => ({ colour: String(l.colour || "").slice(0, 24), size: String(l.size || "").slice(0, 10), qty: Math.floor(Number(l.qty) || 0) }))
      .filter((l) => l.colour && l.size && l.qty > 0);
    const total = clean.reduce((s, l) => s + l.qty, 0);
    if (!total) throw new HttpError(400, "Add at least one colour + size line with a quantity.");
    if (total > 500) throw new HttpError(400, "A single lot can have at most 500 pieces.");
    const at = now();
    const lotId = "LOT-" + at.slice(0, 10).replace(/-/g, "") + "-" + rid(2).toUpperCase().replace(/[^A-Z0-9]/g, "Q");
    q("INSERT INTO lots (id, design_id, note, quantity, created_at) VALUES (?,?,?,?,?)").run(lotId, design.id, String(body.note || "").slice(0, 200), total, at);
    const ins = q("INSERT INTO pieces (code, design_id, lot_id, colour, size, status, created_at, updated_at) VALUES (?,?,?,?,?, 'in_stock', ?, ?)");
    const codes = [];
    db.exec("BEGIN");
    try {
      for (const l of clean) {
        for (let i = 0; i < l.qty; i++) {
          let code;
          do code = `${design.id}-${randomBytes(3).toString("hex").toUpperCase()}`;
          while (q("SELECT 1 FROM pieces WHERE code = ?").get(code));
          ins.run(code, design.id, lotId, l.colour, l.size, at, at);
          logEvent(code, "created", lotId);
          codes.push({ code, colour: l.colour, size: l.size });
        }
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return { lot: { id: lotId, designId: design.id, designName: design.name, quantity: total, createdAt: at }, pieces: codes };
  });

  route("GET", "/api/admin/lots", ({ req }) => {
    requireAdmin(req);
    return {
      lots: q(`SELECT l.*, d.name design_name, (SELECT COUNT(*) FROM pieces p WHERE p.lot_id = l.id AND p.status = 'in_stock') in_stock
               FROM lots l JOIN designs d ON d.id = l.design_id ORDER BY l.created_at DESC`).all().map((l) => ({
        id: l.id, designId: l.design_id, designName: l.design_name, note: l.note, quantity: l.quantity, inStock: l.in_stock, createdAt: l.created_at,
      })),
    };
  });

  route("GET", "/api/admin/lots/:id", ({ req, params }) => {
    requireAdmin(req);
    const l = q("SELECT l.*, d.name design_name FROM lots l JOIN designs d ON d.id = l.design_id WHERE l.id = ?").get(params.id);
    if (!l) throw new HttpError(404, "Lot not found.");
    return {
      lot: { id: l.id, designId: l.design_id, designName: l.design_name, note: l.note, quantity: l.quantity, createdAt: l.created_at },
      pieces: q("SELECT code, colour, size, status FROM pieces WHERE lot_id = ? ORDER BY colour, size, code").all(l.id),
    };
  });

  route("DELETE", "/api/admin/lots/:id", ({ req, params }) => {
    requireAdmin(req);
    // Sold pieces are in customers' hands — their passports must keep opening
    const sold = q("SELECT COUNT(*) n FROM pieces WHERE lot_id = ? AND status = 'sold'").get(params.id).n;
    if (sold) throw new HttpError(409, `${sold} piece${sold > 1 ? "s" : ""} in this lot ${sold > 1 ? "are" : "is"} sold, so the lot can't be deleted. Retire unused tags from Pieces instead.`);
    q("DELETE FROM piece_events WHERE code IN (SELECT code FROM pieces WHERE lot_id = ?)").run(params.id);
    q("DELETE FROM pieces WHERE lot_id = ?").run(params.id);
    q("DELETE FROM lots WHERE id = ?").run(params.id);
    return { ok: true };
  });

  route("GET", "/api/admin/pieces", ({ req, query }) => {
    requireAdmin(req);
    const status = PIECE_STATUSES.includes(query.get("status")) ? query.get("status") : null;
    return {
      pieces: listPieces({
        status, design: query.get("design") || null, lot: query.get("lot") || null, search: (query.get("q") || "").trim().slice(0, 60) || null,
      }),
    };
  });

  route("GET", "/api/admin/pieces/:code", ({ req, params }) => {
    requireAdmin(req);
    const code = params.code.toUpperCase();
    const [piece] = listPieces({ codes: [code] });
    if (!piece) {
      if (q("SELECT 1 FROM designs WHERE id = ?").get(code)) throw new HttpError(404, `${code} is a design code, not a piece tag. Piece tags look like ${code}-4F2A9C.`);
      throw new HttpError(404, `No piece with code ${code}. Check the tag, or whether its lot was deleted.`);
    }
    const lot = q("SELECT id, note, created_at FROM lots WHERE id = ?").get(piece.lotId);
    return {
      piece,
      lot: lot && { id: lot.id, note: lot.note, createdAt: lot.created_at },
      events: q("SELECT at, action, detail FROM piece_events WHERE code = ? ORDER BY at, id").all(code),
      scans: q("SELECT at, device FROM scans WHERE code = ? ORDER BY at DESC LIMIT 100").all(code)
        .map((s) => ({ at: s.at, device: s.device ? s.device.slice(0, 6) : null })),
      leads: q("SELECT * FROM leads WHERE piece_code = ? ORDER BY created_at DESC").all(code).map(leadOut),
    };
  });

  route("PATCH", "/api/admin/pieces/:code", ({ req, params, body }) => {
    requireAdmin(req);
    const code = params.code.toUpperCase();
    if (!q("SELECT 1 FROM pieces WHERE code = ?").get(code)) throw new HttpError(404, "Piece not found.");
    if (body.status !== undefined) {
      if (!PIECE_STATUSES.includes(body.status)) throw new HttpError(400, "Status must be in_stock, reserved, sold or void.");
      setPieceStatus(code, body.status, body.reason ? String(body.reason).slice(0, 200) : null);
    }
    if (body.note !== undefined) {
      const note = String(body.note || "").trim().slice(0, 300);
      q("UPDATE pieces SET note = ?, updated_at = ? WHERE code = ?").run(note, now(), code);
      logEvent(code, "note", note || "(cleared)");
    }
    return { piece: listPieces({ codes: [code] })[0] };
  });

  route("POST", "/api/admin/pieces/bulk", ({ req, body }) => {
    requireAdmin(req);
    if (!PIECE_STATUSES.includes(body.status)) throw new HttpError(400, "Status must be in_stock, reserved, sold or void.");
    const codes = Array.from(new Set((Array.isArray(body.codes) ? body.codes : []).map((c) => String(c).toUpperCase().slice(0, 40))));
    if (!codes.length) throw new HttpError(400, "Select at least one piece.");
    if (codes.length > 1000) throw new HttpError(400, "Change at most 1,000 pieces at a time.");
    let changed = 0;
    const missing = [];
    db.exec("BEGIN");
    try {
      for (const c of codes) {
        if (!q("SELECT 1 FROM pieces WHERE code = ?").get(c)) missing.push(c);
        else if (setPieceStatus(c, body.status, body.reason ? String(body.reason).slice(0, 200) : null)) changed++;
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return { changed, missing };
  });

  route("GET", "/api/admin/leads", ({ req }) => {
    requireAdmin(req);
    return { leads: q("SELECT * FROM leads ORDER BY created_at DESC").all().map(leadOut) };
  });

  route("PATCH", "/api/admin/leads/:id", ({ req, params, body }) => {
    requireAdmin(req);
    const status = ["new", "contacted"].includes(body.status) ? body.status : null;
    if (!status) throw new HttpError(400, "Unknown status.");
    q("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), params.id);
    return { ok: true };
  });

  route("DELETE", "/api/admin/leads/:id", ({ req, params }) => {
    requireAdmin(req);
    q("DELETE FROM leads WHERE id = ?").run(params.id);
    return { ok: true };
  });

  route("POST", "/api/admin/demo", ({ req, body }) => {
    requireAdmin(req);
    if (body.action === "clear") {
      q("DELETE FROM leads WHERE is_demo = 1").run();
      q("DELETE FROM scans WHERE code LIKE 'DEMO-%'").run();
      return { ok: true };
    }
    insertDemoLeads(db);
    return { ok: true };
  });

  route("GET", "/api/admin/orders", ({ req }) => {
    requireAdmin(req);
    return { orders: q("SELECT * FROM orders ORDER BY created_at DESC").all().map((o) => orderOut(o, true)) };
  });

  const ORDER_STEPS = ["submitted", "stylist_review", "tailor_review", "in_production", "ready", "delivered", "needs_remeasure"];
  route("PATCH", "/api/admin/orders/:id", ({ req, params, body }) => {
    requireAdmin(req);
    const o = q("SELECT * FROM orders WHERE id = ?").get(params.id);
    if (!o) throw new HttpError(404, "Order not found.");
    const status = ORDER_STEPS.includes(body.status) ? body.status : null;
    if (!status) throw new HttpError(400, "Unknown status.");
    const tl = pj(o.timeline, []);
    tl.push({ step: status, at: now(), note: body.note ? String(body.note).slice(0, 300) : undefined });
    q("UPDATE orders SET status = ?, timeline = ?, updated_at = ? WHERE id = ?").run(status, j(tl), now(), o.id);
    return { order: orderOut(q("SELECT * FROM orders WHERE id = ?").get(o.id), true) };
  });

  route("POST", "/api/admin/size-charts", ({ req, body }) => {
    requireAdmin(req);
    const rows = (Array.isArray(body.rows) ? body.rows : [])
      .map((r) => ({ size: String(r.size || "").slice(0, 10), bust: +r.bust, waist: +r.waist, hip: +r.hip }))
      .filter((r) => r.size && [r.bust, r.waist, r.hip].every((v) => Number.isFinite(v) && v > 0));
    if (rows.length < 2) throw new HttpError(400, "A size chart needs at least two valid rows (size, bust, waist, hip).");
    const id = "chart-" + rid(4);
    q("INSERT INTO size_charts (id, name, region, unit, rows, source, is_sample, created_at) VALUES (?,?,?,?,?,?,0,?)").run(
      id, String(body.name || "Size chart").slice(0, 80), ["IN", "UK", "US"].includes(body.region) ? body.region : "IN",
      body.unit === "cm" ? "cm" : "in", j(rows), String(body.source || "").slice(0, 200), now(),
    );
    return { ok: true, id };
  });

  route("DELETE", "/api/admin/size-charts/:id", ({ req, params }) => {
    requireAdmin(req);
    q("DELETE FROM size_charts WHERE id = ?").run(params.id);
    return { ok: true };
  });

  // ── connect-style handler ──
  return async function handler(req, res, next) {
    const url = new URL(req.url, "http://local");
    if (!url.pathname.startsWith("/api/")) return next ? next() : notFound(res);
    const method = req.method || "GET";
    const r = routes.find((x) => x.method === method && x.re.test(url.pathname));
    try {
      if (!r) throw new HttpError(404, "Not found.");
      const m = url.pathname.match(r.re);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const body = ["POST", "PUT", "PATCH"].includes(method) ? await readJson(req, r.maxBody) : {};
      const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || "local";
      const out = await r.fn({ req, params, body, query: url.searchParams, ip });
      send(res, 200, out);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error("[api]", e);
      send(res, status, { error: status === 500 ? "Something went wrong on our side. Please try again." : e.message });
    }
  };
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
function notFound(res) {
  send(res, 404, { error: "Not found." });
}
function readJson(req, maxBody = MAX_BODY) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBody) {
        reject(new HttpError(413, "Request too large."));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HttpError(400, "Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function seed(db) {
  const has = db.prepare("SELECT COUNT(*) n FROM designs").get().n;
  const at = now();
  if (!has) {
    const ins = db.prepare(`INSERT INTO designs (id, name, category, story, fabric, embroidery, care, colours, sizes, occasions, image_url, is_demo, created_at, updated_at)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`);
    for (const d of SAMPLE_DESIGNS) ins.run(d.id, d.name, d.category, d.story, d.fabric, d.embroidery, d.care, j(d.colours), j(d.sizes), j(d.occasions), "", at, at);
  }
  if (!db.prepare("SELECT COUNT(*) n FROM size_charts").get().n) {
    db.prepare("INSERT INTO size_charts (id, name, region, unit, rows, source, is_sample, created_at) VALUES (?,?,?,?,?,?,1,?)").run(
      SAMPLE_CHART.id, SAMPLE_CHART.name, SAMPLE_CHART.region, SAMPLE_CHART.unit, j(SAMPLE_CHART.rows), "Sample — replace with the studio's chart", at,
    );
  }
}

// Clearly-flagged sample leads so the dashboard can be demonstrated; removable in one click.
function insertDemoLeads(db) {
  const designs = db.prepare("SELECT id, colours, sizes, occasions FROM designs").all();
  if (!designs.length) return;
  const cities = ["South Tukoganj, Indore", "Vijay Nagar, Indore", "Palasia, Indore", "Bhopal", "Ujjain", "Dewas"];
  const styles = ["Royal", "Romantic", "Minimal", "Contemporary"];
  const budgets = ["Under ₹50k", "₹50k–1L", "₹1L–2L", "Above ₹2L"];
  const ins = db.prepare(`INSERT INTO leads (id, design_id, piece_code, occasion, style, budget, mobile, size, location_method, lat, lng, accuracy, location_text,
      colours, consent, consent_text, consent_at, status, is_demo, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?, 'new', 1, ?, ?)`);
  const scan = db.prepare("INSERT INTO scans (code, design_id, at) VALUES (?,?,?)");
  let seedN = 7;
  const rnd = () => ((seedN = (seedN * 9301 + 49297) % 233280) / 233280);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  for (let i = 0; i < 24; i++) {
    const d = pick(designs);
    const colours = pj(d.colours, ["Maroon"]);
    const at = new Date(Date.now() - Math.floor(rnd() * 13) * 86400000 - Math.floor(rnd() * 8) * 3600000).toISOString();
    const gps = rnd() < 0.35;
    ins.run(
      "L-DEMO" + rid(4), d.id, null, pick(pj(d.occasions, ["Wedding"])), pick(styles), pick(budgets), "+9100000" + String(10000 + i).slice(-5),
      pick(pj(d.sizes, ["M"])), gps ? "gps" : "manual", gps ? 22.72 + rnd() * 0.05 : null, gps ? 75.86 + rnd() * 0.05 : null, gps ? 30 : null,
      gps ? null : pick(cities), j([pick(colours), ...(rnd() < 0.5 ? [pick(colours)] : [])].filter((v, k, a) => a.indexOf(v) === k)),
      "DEMO — sample lead, not a real customer", at, at, at,
    );
  }
  for (let i = 0; i < 70; i++) {
    const d = pick(designs);
    scan.run("DEMO-" + d.id, d.id, new Date(Date.now() - Math.floor(rnd() * 13) * 86400000).toISOString());
  }
}
