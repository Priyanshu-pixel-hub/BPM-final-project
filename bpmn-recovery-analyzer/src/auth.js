"use strict";
const crypto = require("crypto");
exports.hashPassword = pw => { const salt = crypto.randomBytes(16); return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex"); };
exports.checkPassword = (pw, stored) => {
  const [s, h] = String(stored).split(":"); if (!s || !h) return false;
  const a = crypto.scryptSync(pw, Buffer.from(s, "hex"), 64), b = Buffer.from(h, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
exports.cookie = (req, name) => {
  const m = (req.headers.cookie || "").split(";").map(c => c.trim().split("=")).find(c => c[0] === name);
  return m ? decodeURIComponent(m.slice(1).join("=")) : null;
};
