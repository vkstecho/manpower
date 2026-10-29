# Improvements applied (login flow preserved)

## Confirmed product rule
Login flow kept exactly as documented (mobile OTP primary; roster auto-approve; manager self-reg instant; member pending → manager approve; device password / trusted device skip OTP; hard-admin phones → Admin).

## Done in this pass

### 1. Version single source of truth
- `js/config.js` → `MP_CFG.APP_VERSION = '2.4.97'`
- `app-core.js` reads `APP_VERSION` from `MP_CFG`
- `sw.js` header + `SW_VERSION = '2.4.97'`
- `index.html` script cache-bust `?v=2497`

### 2. Shared utilities (`js/utils.js`)
- `escHtml`, `escAttr` (attribute-safe)
- `sanitizeFbPath`, `isValidEmpId`, `hashPass`
- `normMobileKey`, `isValidMobile10`
- `isHardAdminPhone` (config + runtime Firebase list)

### 3. Security hardening (no flow change)
- CFG merges from `MP_CFG`
- `_isHardAdminPhone` uses utils + optional `window.__mpHardAdminPhones`
- `_loadHardAdminPhonesFromFb()` on `initData` reads `settings/hardAdminPhones`
- RTDB rules: `settings/hardAdminPhones` and `settings/managerInviteCode` **admin-only write**
- `SECURITY.md` sections 5–6

## Recommended next (not done yet)
1. Replace repeated phone checks in `database.rules.json` with Custom Claims (`admin` / `manager`).
2. Audit `innerHTML` sites — use `escHtml` / `escAttr` or DOM APIs for Excel/user strings.
3. Split `app-team.js` / `app-login.js` / `app-schedule.js` into domain modules.
4. Code-split Met Train + XLSX/PDF; minify production bundles.
5. Schedule grid keyboard / ARIA pass.

## Deploy notes
1. Deploy updated `database.rules.json` (new settings children).
2. Optionally set RTDB `settings/hardAdminPhones` to your admin mobiles.
3. Host all files; hard-refresh clients so SW updates to 2.4.97.
