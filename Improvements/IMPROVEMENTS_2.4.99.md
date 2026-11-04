# Improvements 2.4.99 — RTDB rules + Custom Claims readiness

Login flow unchanged.

## RTDB rules (`database.rules.json`)

- **Custom Claims aware:** `auth.token.admin === true` and `auth.token.manager === true` accepted everywhere privilege is checked.
- **Fallback preserved:** bootstrap admin phone, `admins/{uid}`, `managers/{uid}`, approved `mobileUsers` manager/admin roles.
- **mobileUsers write:** original complex rule kept; hard-admin checks also accept `auth.token.admin`.
- **Trusted-device safe:** `schedules`, `overrides`, `shiftConfigs`, `attendance`, `reports`, `todos`, `instructions` remain `auth != null` write so anonymous/trusted save still works.
- **Still tightened:** `employees`, `settings/license`, `settings/hardAdminPhones`, `settings/managerInviteCode`, `companies`, `adminLogs`, learn admin content, etc. → admin and/or manager expressions with claims.

## Client

- `isAdmin()` / `isMgr()` honor `window.__mpIdTokenClaims`
- `_refreshIdTokenClaims()` loads JWT claims (non-blocking)
- `_syncAuthRoleNodes()` mirrors claims into `admins`/`managers` nodes for rules fallback

## Docs

- `CUSTOM_CLAIMS_GUIDE.md` — how to mint claims with Cloud Functions
- `SECURITY.md` §7

## Not done yet (roadmap)

4. Bundle minify / lazy-load
5. Tests + a11y + App Check / deployed Cloud Function for claims

## Deploy

```bash
firebase deploy --only database
```

Then host 2.4.99 assets and hard-refresh clients.

Smoke-test: manager OTP → save schedule (trusted mode), approve member, admin paths.
