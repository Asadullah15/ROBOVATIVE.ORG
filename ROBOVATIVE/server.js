"use strict";
/* =====================================================================
   Lumina Health — web server (no external packages needed)
   Start:  node server.js      (or double-click start.bat)
   Open:   http://localhost:3000
   Data is saved in data.json next to this file (created on first run).
   All roles & permission rules live in lumina-core.js.
   ===================================================================== */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Core = require("./lumina-core.js");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, "data.json");
// Only these files are served to browsers. data.json and server.js are never exposed.
const FILES = {
  "index.html": "text/html", "treatments.html": "text/html", "doctor.html": "text/html", "contact.html": "text/html",
  "login.html": "text/html", "app.html": "text/html", "lumina-core.js": "text/javascript", "lumina-shared.js": "text/javascript", "dr-syed-yousuf-ali.jpg": "image/jpeg",
};
// Sample data profile: "skinshine" (default) or "demo". Set LUMINA_PROFILE=demo for the generic demo clinic.
const SESSION_HOURS = 12;        // website (cookie)
const MOBILE_SESSION_DAYS = 30;  // mobile app (token)

const core = Core.create({
  rand: (n) => crypto.randomBytes(n).toString("hex"),
  hash: (pw) => { const salt = crypto.randomBytes(16).toString("hex"); return salt + ":" + crypto.scryptSync(String(pw), salt, 64).toString("hex"); },
  verify: (pw, stored) => {
    const [salt, h] = String(stored || "").split(":");
    if (!salt || !h || salt === "demo") return false;
    const a = Buffer.from(h, "hex"), b = crypto.scryptSync(String(pw), salt, 64);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },
});

/* ---------------- database ---------------- */
let db;
// OneDrive/antivirus can lock data.json for a moment while syncing; retry instead of failing the request.
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function save() {
  const json = JSON.stringify(db, null, 2), tmp = DB_FILE + ".tmp";
  for (let i = 0; i < 8; i++) {
    try { fs.writeFileSync(tmp, json); fs.renameSync(tmp, DB_FILE); return; }
    catch (e) { if (!["EPERM", "EBUSY", "EACCES"].includes(e.code)) throw e; pause(60 * (i + 1)); }
  }
  fs.writeFileSync(DB_FILE, json); // last resort: write in place
  try { fs.unlinkSync(tmp); } catch {}
}
function load() {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    if (!db.settings || !db.vitals) { // data.json from an older version: upgrade by re-seeding
      fs.renameSync(DB_FILE, DB_FILE.replace(/\.json$/, "-old-" + Date.now() + ".json"));
      db = core.seed(process.env.LUMINA_PROFILE); save(); return true;
    }
    return false;
  }
  db = core.seed(process.env.LUMINA_PROFILE); save(); return true;
}

/* ---------------- sessions & rate limits ----------------
   Sessions are kept in data.json (db.sessions) so phones stay logged in after a restart.
   Only a SHA-256 hash of each token is stored, never the token itself. */
const tokenHash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const parseCookies = (h) => { const o = {}; (h || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; };
function sessionsMap() { if (!db.sessions || typeof db.sessions !== "object") db.sessions = {}; return db.sessions; }
function createSession(userId, kind) {
  const token = crypto.randomBytes(32).toString("hex");
  const ms = kind === "mobile" ? MOBILE_SESSION_DAYS * 864e5 : SESSION_HOURS * 3600e3;
  const s = sessionsMap(), now = Date.now();
  for (const [h, v] of Object.entries(s)) if (v.exp < now) delete s[h]; // tidy expired
  s[tokenHash(token)] = { userId, exp: now + ms, kind };
  return token;
}
function getAuth(req) {
  const bearer = /^Bearer\s+([a-f0-9]{64})$/i.exec(req.headers.authorization || "");
  const token = bearer ? bearer[1] : parseCookies(req.headers.cookie).lh_sid;
  if (!token) return null;
  const s = sessionsMap()[tokenHash(token)];
  if (!s) return null;
  if (s.exp < Date.now()) { delete sessionsMap()[tokenHash(token)]; return null; }
  const user = db.users.find((x) => x.id === s.userId && x.active);
  return user ? { user, token } : null;
}
const sessionCookie = (token, maxAge) => `lh_sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
const dropSessions = (userId, keepToken) => { const s = sessionsMap(), keep = keepToken && tokenHash(keepToken); for (const [h, v] of Object.entries(s)) if (v.userId === userId && h !== keep) delete s[h]; };
const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const n = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < n) { b = { count: 0, reset: n + windowMs }; buckets.set(key, b); }
  if (++b.count > max) { const e = new Error("Too many attempts. Please wait a few minutes and try again."); e.status = 429; throw e; }
}

/* ---------------- HTTP ---------------- */
function sendJson(res, status, obj) {
  if (res.headersSent) return;
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > 200 * 1024) { const e = new Error("Request too large"); e.status = 413; reject(e); req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      try { const v = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; resolve(v && typeof v === "object" && !Array.isArray(v) ? v : {}); }
      catch { const e = new Error("Invalid JSON"); e.status = 400; reject(e); }
    });
    req.on("error", reject);
  });
}
async function handleApi(req, res, url) {
  const p = url.pathname, ip = req.socket.remoteAddress;
  if (p === "/api/health") return sendJson(res, 200, { ok: true, lumina: true, mode: "server" });
  let body = {};
  if (req.method !== "GET") {
    // Requiring JSON blocks cross-site form posts (CSRF); cookies are also SameSite=Strict.
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) { const e = new Error("Content-Type must be application/json"); e.status = 415; throw e; }
    body = await readBody(req);
  }
  const auth = getAuth(req);
  if (p === "/api/login" && req.method === "POST") {
    rateLimit("login:" + ip, 10, 15 * 60e3);
    const user = core.login(db, body.email, body.password);
    if (body.client === "mobile") { // mobile app: token in the response, sent back as "Authorization: Bearer <token>"
      const token = createSession(user.id, "mobile");
      save();
      return sendJson(res, 200, { user: core.pub(user), token });
    }
    const token = createSession(user.id, "web");
    save();
    res.setHeader("Set-Cookie", sessionCookie(token, SESSION_HOURS * 3600));
    return sendJson(res, 200, { user: core.pub(user) });
  }
  if (p === "/api/logout") {
    if (auth) { delete sessionsMap()[tokenHash(auth.token)]; save(); }
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    return sendJson(res, 200, { ok: true });
  }
  if (p === "/api/leads" && req.method === "POST") rateLimit("lead:" + ip, 20, 60 * 60e3);
  const query = Object.fromEntries(url.searchParams);
  let out;
  try { out = core.handle(db, auth && auth.user, req.method, p, body, query); }
  catch (e) { if (req.method !== "GET") db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); throw e; } // undo any half-applied change
  if (req.method !== "GET") {
    if (out.changedUser) dropSessions(out.changedUser, auth && auth.token); // log out a user whose account was changed/deleted
    if (p === "/api/me/password" && auth) dropSessions(auth.user.id, auth.token);
    save();
  }
  sendJson(res, 200, out.data);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") { const e = new Error("Method not allowed"); e.status = 405; throw e; }
    let name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    if (!name.includes(".")) name += ".html"; // /pricing -> pricing.html
    if (!FILES[name]) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end('<!doctype html><meta charset="utf-8"><title>Not found</title><body style="font-family:system-ui;padding:40px"><h1>Page not found</h1><p><a href="/">Back to the website</a></p>');
    }
    const content = fs.readFileSync(path.join(ROOT, name));
    res.writeHead(200, { "Content-Type": FILES[name].startsWith("image/") ? FILES[name] : FILES[name] + "; charset=utf-8", "Cache-Control": "no-cache" });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (e) {
    if (!e.status) console.error(e);
    sendJson(res, e.status || 500, { error: e.status ? e.message : "Something went wrong on the server" });
  }
});

const fresh = load();
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.error("\n  Port " + PORT + " is already in use. Lumina may already be running. Open http://localhost:" + PORT + "\n");
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, () => {
  console.log("\n  Skin Shine is running at  http://localhost:" + PORT);
  console.log("  Login page:                   http://localhost:" + PORT + "/login.html");
  const lan = Object.values(require("os").networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal).map((i) => i.address);
  if (lan.length) console.log("  Mobile app server address:    " + lan.map((ip) => "http://" + ip + ":" + PORT).join("  or  ") + "   (phone must be on the same Wi-Fi)");
  console.log("");
  if (fresh) console.log("  Created data.json with demo data.\n");
  console.log("  Demo accounts (change these passwords before real use):");
  console.log("    Admin      admin@shabihub.local      Admin@123");
  console.log("    Doctor     doctor@shabihub.local     Doctor@123");
  console.log("    Nurse      nurse@shabihub.local      Nurse@123");
  console.log("    Reception  reception@shabihub.local  Reception@123");
  console.log("    Pharmacy   pharmacy@shabihub.local   Pharmacy@123");
  console.log("    Patient    patient@shabihub.local    Patient@123\n");
  console.log("  Press Ctrl+C to stop.\n");
});
