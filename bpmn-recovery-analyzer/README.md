# BPMN Recovery Analyzer

Upload a BPMN 2.0 file and get a report on how each task should recover from failure (retry, rollback, compensation or escalation).

## Run
1. Install Node.js 18 or newer.
2. In this folder run `npm install`, then `npm start`.
3. Open http://localhost:3000 and create an account on the sign-in page.

## Structure
- `server.js` Express API. Accounts: `POST /api/register`, `/api/login`, `/api/logout`, `GET /api/me`. Reports (sign-in required, per user): `POST /api/reports`, `GET /api/reports` (5 most recent), `GET /api/reports/:id`, `DELETE /api/reports/:id`
- `src/auth.js` Password hashing (scrypt) and cookie helper
- `src/analyzer.js` BPMN parser, task classifier and recovery-strategy rules
- `src/db.js` SQLite storage (`data/reports.db`, created on first run)
- `public/` Frontend (`login.html`, upload page, report view, recent uploads)
- `sample/order-process.bpmn` Example model

If `better-sqlite3` fails to install, the app falls back to Node's built-in SQLite (Node 22.5 or newer).
