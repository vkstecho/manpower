# Improvements 2.4.98 (login flow preserved)

Builds on 2.4.97 hardened package.

## 1. XSS / innerHTML audit (priority #1)

- Short aliases: global `H` = `escHtml`, `A` = `escAttr` in `js/utils.js`
- **~230** high-risk template interpolations wrapped with `escHtml(...)` across:
  - `app-core.js`, `app-login.js`, `app-schedule.js`, `app-team.js`, `app.js`
- Targets: `.name`, `.label`, `.title`, `.empId`, `.company`, `.message`, `e.message`, etc.
- Attribute escapes: company `<option value>`, manager dropdown (`value` / `data-name`), section chips
- Syntax verified with `node --check` on all main modules
- Intentional HTML builders (L() UI strings, nested map HTML) left for later manual review

## 2. Modularization start (priority #2)

- Extracted static `MET_TRAIN_DATA` → `js/train-data.js` (~443 lines)
- `app.js` reduced ~3577 → ~3135 lines
- Loaded before `app.js` in `index.html`; added to SW precache

## Still pending (original roadmap)

3. RTDB rules → Custom Claims (replace repeated phone-number checks)
4. Bundle size (minify, lazy-load Met Train / XLSX / PDF)
5. Automated tests + schedule a11y + App Check / Cloud Functions

## Deploy

1. Deploy files + `database.rules.json` (from 2.4.97 if not already)
2. Hard-refresh clients (SW 2.4.98)
3. Smoke-test: login OTP, manager select, team list names, schedule grid, training hub
