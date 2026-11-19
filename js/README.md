# Man Power JS layout (feature folders) — v6.0.53

Edit **one folder** for one concern. See `Improvements/AI_INDEX.md`.

| Folder | Responsibility |
|--------|----------------|
| `config/` | App version, shift labels, admin phones, Firebase init |
| `core/` | Boot, utils, polyfill, a11y, role helpers, hard expiry |
| `auth/` | Login OTP, device password, session restore, auth gate |
| `session/` | Home, nav, settings, **pay-gate / pay-trial / pay-admin**, announce, diary |
| `team/` | Roster, Excel, forms, **print**, **learn**, skills |
| `schedule/` | Schedule grid, **admin teams**, builder, offline, clipboard, undo, work-hours |
| `commercial/` | License/paywall UI, public offer |
| `i18n/` | Locale strings |

## Important splits (v6.0.53–6.0.54)

| File | Holds |
|------|--------|
| `schedule/app-schedule.js` | Grid, multi-select, excel upload UI, min manpower entry |
| `schedule/sched-admin-teams.js` | Approve member, admin hierarchy, Pay until, manager delete, orphans |
| `team/app-team-print.js` | `printSched`, `exportSchedExcel` |
| `team/app-learn.js` | Learn & Grow UI, content, module buttons |
| `team/app-team-print-learn.js` | **Shim only** — do not add code |

## Adding a new module

1. Create file under the correct folder.
2. Register in `app.html` (eager or deferred list) with a cache-bust `?v=`.
3. Add path to `sw.js` precache if offline-needed.
4. Document in `Improvements/AI_INDEX.md`.

Do not put new feature code in a flat `js/*.js` at this level (except `landing-i18n.js`).


| `session/pay-gate.js` | Access gate + paywall modal + customer care |
| `session/pay-trial.js` | Free trial grant + SESSION paidUntil hydrate |
| `session/pay-admin.js` | Admin payment settings / Pay until / landing videos |
| `session/app-session-payment.js` | Residual only (v6.0.54) |
