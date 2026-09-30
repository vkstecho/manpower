# Improvements 2.5.1 — Tests + a11y + App Check / Claims stubs

Login flow unchanged.

## 1. Automated tests

- `tests/run-utils-tests.js` — Node suite for pure helpers
- Covers: `normMobileKey`, `isValidMobile10`, `isValidEmpId`, `sanitizeFbPath`, `escHtml`/`escAttr`, `isHardAdminPhone`, `hashPass`
- Run: `node tests/run-utils-tests.js` → **30 passed**

## 2. Accessibility (schedule + login)

- New `js/a11y.js`:
  - Schedule table: `role="grid"`, cells `role="gridcell"`, `tabindex="0"`, `aria-label` with emp/date/shift
  - Enter/Space activates focused cell
  - Login: mobile/OTP labels, `inputmode`, `autocomplete`, describedby
  - Nav: `role="navigation"`
- Hook after schedule grid paint (`enhanceScheduleA11y`)
- `schedule.html` region/grid landmarks on wrap + Create button label

## 3. App Check (optional)

- `firebase-init.js` enables App Check when `window.MP_APPCHECK_SITE_KEY` is set (reCAPTCHA v3)
- Off by default — no break for current production

## 4. Claims Cloud Function sample

- `functions/setRoleClaim.sample.js` — Admin SDK callable to set `admin`/`manager` claims
- `APP_CHECK_AND_CLAIMS.md` deploy notes

## Full roadmap status

| # | Item | Status |
|---|------|--------|
| 1 | Version + security utils + hard-admin Firebase | Done (2.4.97) |
| 2 | XSS escHtml + train-data extract | Done (2.4.98) |
| 3 | RTDB rules + claims readiness | Done (2.4.99) |
| 4 | Bundle minify + lazy-load | Done (2.5.0) |
| 5 | Tests + a11y + App Check/claims stubs | **Done (2.5.1)** |

## Deploy

1. Host 2.5.1 assets; hard-refresh SW
2. Optional: set `MP_APPCHECK_SITE_KEY` + enable App Check in Console
3. Optional: deploy `setRoleClaim` function when ready
4. Smoke-test: login keyboard, schedule grid focus/Enter, training, schedule save
