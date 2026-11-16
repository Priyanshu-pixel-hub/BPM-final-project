"use strict";
const express = require("express"), path = require("path");
const { analyzeXml } = require("./src/analyzer"), db = require("./src/db"), auth = require("./src/auth");
const app = express(), PUB = path.join(__dirname, "public"), COOKIE = "sid";
app.use(express.json({ limit: "10mb" }));

const userOf = req => db.sessionUser(auth.cookie(req, COOKIE));
const needLogin = (req, res, next) => { const u = userOf(req); if (!u) return res.status(401).json({ error: "Please sign in." }); req.user = u; next(); };
const setCookie = (res, token, maxAge) => res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`);

// Pages: the app requires a session, the login page does not
app.get(["/", "/index.html"], (req, res) => userOf(req) ? res.sendFile(path.join(PUB, "index.html")) : res.redirect("/login.html"));
app.use(express.static(PUB, { index: false }));

// Accounts
const fails = new Map(); // simple brute-force limit: 5 failed sign-ins per 10 minutes per user and address
app.post("/api/register", (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase(), pw = String(req.body?.password || "");
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) return res.status(400).json({ error: "Username must be 3 to 30 characters: letters, numbers, dots, dashes or underscores." });
  if (pw.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  const id = db.createUser(username, auth.hashPassword(pw));
  if (!id) return res.status(409).json({ error: "That username is taken." });
  setCookie(res, db.createSession(id), db.SESSION_MS / 1000);
  res.status(201).json({ username });
});
app.post("/api/login", (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase(), pw = String(req.body?.password || ""), key = username + "|" + req.ip;
  const f = fails.get(key);
  if (f && f.n >= 5 && Date.now() - f.t < 600000) return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
  const u = db.getUser(username);
  if (!u || !auth.checkPassword(pw, u.pass_hash)) { fails.set(key, { n: (f && Date.now() - f.t < 600000 ? f.n : 0) + 1, t: Date.now() }); return res.status(401).json({ error: "Wrong username or password." }); }
  fails.delete(key);
  setCookie(res, db.createSession(u.id), db.SESSION_MS / 1000);
  res.json({ username: u.username });
});
app.post("/api/logout", (req, res) => { db.deleteSession(auth.cookie(req, COOKIE)); setCookie(res, "", 0); res.json({ ok: true }); });
app.get("/api/me", needLogin, (req, res) => res.json({ username: req.user.username }));

// Reports (each user sees only their own; the list returns the 5 most recent)
app.post("/api/reports", needLogin, (req, res) => {
  const { name, xml } = req.body || {};
  if (typeof xml !== "string" || !xml.trim()) return res.status(400).json({ error: "No BPMN content was received." });
  try {
    const result = analyzeXml(xml), meta = db.save(req.user.id, String(name || "model.bpmn").slice(0, 200), xml, result);
    res.status(201).json({ ...meta, ...result });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get("/api/reports", needLogin, (req, res) => res.json(db.list(req.user.id, 5)));
app.get("/api/reports/:id", needLogin, (req, res) => {
  const r = db.get(req.user.id, +req.params.id);
  r ? res.json(r) : res.status(404).json({ error: "Report not found." });
});
app.delete("/api/reports/:id", needLogin, (req, res) =>
  db.remove(req.user.id, +req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: "Report not found." }));
app.use((err, _req, res, _next) => res.status(400).json({ error: "The request could not be read." }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`BPMN Recovery Analyzer running at http://localhost:${port}`));
