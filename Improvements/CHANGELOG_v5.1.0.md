# Man Power v5.1.0 — Module split + claims-first rules

## Module split (P2)
Large files broken into focused scripts (same global functions, classic `<script>` load order):

| Before | After (approx lines) |
|--------|----------------------|
| `app-team-excel-ops.js` ~4.6k | excel-ops ~1.7k + `i18n_dict.js` ~1k + `sched-shift-edit.js` ~2k |
| `app-session-settings.js` ~3.5k | settings ~1.4k + shift/profile/security modules |
| `app-sched-builder.js` ~2.3k | builder ~1.0k + `sched-auto-coverage.js` ~1.3k |

`app.html` deferred loader and `sw.js` precache updated.

## Custom claims–first rules (P2)
- Removed all hard-coded `+918929397949` checks from `database.rules.json` (51 occurrences).
- Authorization remains: `auth.token.admin` / `auth.token.manager`, `admins/{uid}`, `managers/{uid}`, approved `mobileUsers` role.
- Bootstrap admin phone still recognized in Cloud Function `syncMyClaims` / `setRoleClaim` only — not in client-facing rules.
- **Deploy:** `firebase deploy --only database` then ensure every admin/manager runs token refresh (`syncMyClaims` or re-login).

## Tests (P3 start)
- `tests/smoke.js` — module presence, brace balance, rules phone purge, version alignment, HTML includes.
- Run: `node tests/smoke.js`

## Version
- `APP_VERSION` + Service Worker **5.1.0**
