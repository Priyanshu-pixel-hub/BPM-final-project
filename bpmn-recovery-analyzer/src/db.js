"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
// Prefer better-sqlite3; fall back to Node's built-in SQLite (Node 22.5+) if it is not installed.
let Database;
try { Database = require("better-sqlite3"); }
catch { try { Database = require("node:sqlite").DatabaseSync; } catch { throw new Error("No SQLite driver found. Run `npm install`, or use Node 22.5 or newer."); } }

const dir = path.join(__dirname, "..", "data");
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "reports.db"));
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  filename TEXT NOT NULL,
  created_at TEXT NOT NULL,
  readiness INTEGER NOT NULL,
  task_count INTEGER NOT NULL,
  high_risk INTEGER NOT NULL,
  xml TEXT NOT NULL,
  result_json TEXT NOT NULL)`);
// Upgrade databases created before logins existed
if (!db.prepare("PRAGMA table_info(reports)").all().some(c => c.name === "user_id"))
  db.exec("ALTER TABLE reports ADD COLUMN user_id INTEGER");

const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const SESSION_MS = 7 * 24 * 3600 * 1000;

module.exports = {
  createUser(username, passHash) {
    try {
      const r = db.prepare("INSERT INTO users (username,pass_hash,created_at) VALUES (?,?,?)").run(username, passHash, new Date().toISOString());
      return Number(r.lastInsertRowid);
    } catch (e) { if (/UNIQUE/i.test(e.message)) return null; throw e; }
  },
  getUser: username => db.prepare("SELECT id,username,pass_hash FROM users WHERE username=?").get(username),
  createSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
    db.prepare("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)").run(sha(token), userId, Date.now() + SESSION_MS);
    return token;
  },
  sessionUser: token => token && db.prepare("SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").get(sha(token), Date.now()),
  deleteSession: token => token && db.prepare("DELETE FROM sessions WHERE token_hash=?").run(sha(token)),
  SESSION_MS,

  save(userId, filename, xml, result) {
    const a = result.analysis, created = new Date().toISOString();
    const r = db.prepare("INSERT INTO reports (user_id,filename,created_at,readiness,task_count,high_risk,xml,result_json) VALUES (?,?,?,?,?,?,?,?)")
      .run(userId, filename, created, a.ready, a.tasks.length, a.tasks.filter(t => t.lvl === "High").length, xml, JSON.stringify(result));
    return { id: Number(r.lastInsertRowid), filename, created_at: created };
  },
  list: (userId, limit = 5) => db.prepare("SELECT id,filename,created_at,readiness,task_count,high_risk FROM reports WHERE user_id=? ORDER BY id DESC LIMIT ?").all(userId, limit),
  get(userId, id) {
    const row = db.prepare("SELECT id,filename,created_at,result_json FROM reports WHERE id=? AND user_id=?").get(id, userId);
    return row && { id: row.id, filename: row.filename, created_at: row.created_at, ...JSON.parse(row.result_json) };
  },
  remove: (userId, id) => Number(db.prepare("DELETE FROM reports WHERE id=? AND user_id=?").run(id, userId).changes) > 0
};
