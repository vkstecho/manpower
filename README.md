# MET Power — Manpower Management System (v2.3.20)

GLS Polyfilms metalliser department app (Firebase + PWA-ready).

## What's new in 2.3.20

### Security (hardened)
- **Admin passwords**: client no longer seeds or ships SHA-256 hashes. Configure `adminAuth` in Firebase Console only (see `SECURITY.md`).
- **Emergency offline admin login removed** — fails closed if Firebase is unreachable.
- **License unlock keys** no longer in the JS bundle. Store hashes under `settings/license.unlockHashes` in Firebase.
- Sensitive admin login console logs removed.

### Login friction / stuck pending
- Pending approval UI always has **Retry** and **Refresh** actions.
- Approval poller **auto-timeout after 10 minutes**.
- `cancelLoginRequest` fully clears overlays, poller, and pending flags.
- Boot recovery clears stale pending state older than 30 minutes.
- **Known device + password** within 30 days of phone verify → skip OTP, use password screen.

### Schedule / Leave / Team
- Extra sticky-header resync when opening Schedule tab (orientation / filter desync).
- Leave and Team tab renders wrapped so one failure does not blank the whole tab.

### Architecture
- New modules: `js/config.js`, `js/utils.js` (loaded before `app.js`).
- Further split of `app.js` can continue feature-by-feature without breaking globals.
- SW cache bumped to `metpower-v40`; precaches new modules.

## Folder structure

```
met-power/
├── index.html
├── schedule.html, myshift.html, leave.html, reports.html, todo.html, pending.html, team.html, instructions.html
├── css/app.css
├── js/
│   ├── polyfill.js
│   ├── config.js      # shared config (no secrets)
│   ├── utils.js       # escHtml, hashPass, path sanitize
│   ├── firebase-init.js
│   └── app.js
├── sw.js
├── SECURITY.md
└── README.md
```

Assets on GitHub (not in every zip): `manifest.json`, icons, logos.

## Firebase setup required after deploy

1. Ensure `adminAuth/{user}` entries exist (hash = SHA-256 of `user:pass:MP_ADMIN`).
2. Create `settings/license` with `validTill` and optional `unlockHashes` (see SECURITY.md).
3. Keep RTDB rules denying public write to those paths.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Do **not** open as `file://`.
