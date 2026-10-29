# Improvements 2.5.2 — Module split + claims issuance

Login flow unchanged.

## 1. Split modules (no behaviour change)

### Login (was ~7.4k lines)
| File | Scope |
|------|--------|
| `js/app-login.js` | OTP, registration, role pick (~1.8k lines) |
| `js/app-login-device.js` | Device password, other-device, Web OTP (~1.3k) |
| `js/app-login-session.js` | Launch, role sync, logout, claims request (~4.3k) |

### Team (was ~11k lines)
| File | Scope |
|------|--------|
| `js/app-team.js` | Team list, salary, devices, emp upload (~1.3k) |
| `js/app-team-import.js` | Bulk import, ops, builder helpers (~8k) |
| `js/app-team-print-learn.js` | Print, Learn, MetCost, SupSkill (~1.7k) |

Load order fixed in `index.html` + SW precache. All parts pass `node --check`.

## 2. Custom Claims — ready to deploy

- `functions/index.js`: `syncMyClaims` + `setRoleClaim`
- `functions/package.json`
- Client: `_requestRoleClaims` / `adminSetRoleClaim` via `window._fbCall`
- After manager/admin login, `syncMyClaims` is requested automatically
- See `DEPLOY_CLAIMS.md`

**You must run `firebase deploy --only functions`** on your project — this environment cannot deploy to your Firebase.

## Deploy app + functions

1. Host 2.5.2 static assets
2. `firebase deploy --only database,functions` (rules if needed + functions)
3. Hard-refresh clients
4. Manager OTP login → check Auth custom claims in Console
