# Man Power — AI Feature Map (feature folders)

**Read this file first.** Open only the file under the listed folder.

App root: `ManPower-v3.2.6/`

---

## 1. What this app does

Multi-industry **team & shift management PWA**. Excel-driven sections/machines, OTP login, Auto Schedule with coverage, leave/OD, reports, payments/license, resume builder, offline queue. Firebase + Hindi/English.

---

## 2. Feature → file map

| Feature | File |
|---------|------|
| **Version, shift labels, hard-admin phones, license dates** | `js/config/config.js` |
| **Firebase project init** | `js/config/firebase-init.js` |
| **Utils (phone norm, esc, loadScript)** | `js/core/utils.js` |
| **Polyfill** | `js/core/polyfill.js` |
| **App core / boot helpers** | `js/core/app-core.js` |
| **Main app / PWA register** | `js/core/app.js` |
| **Accessibility** | `js/core/a11y.js` |
| **Train module data** | `js/core/train-data.js` |
| **Login OTP** | `js/auth/app-login.js` |
| **Device password / remember** | `js/auth/app-login-device.js` |
| **Session restore** | `js/auth/app-login-session.js` |
| **Auth gate / roles** | `js/auth/app-session-auth.js` |
| **Home dashboard** | `js/session/app-session-home.js` |
| **Navigation** | `js/session/app-session-nav.js` |
| **Settings** | `js/session/app-session-settings.js` |
| **Payment / license UI** | `js/session/app-session-payment.js` |
| **Team roster** | `js/team/app-team.js` |
| **Employee forms** | `js/team/app-team-emp-forms.js` |
| **Excel import UI** | `js/team/app-team-import.js` |
| **Excel import core** | `js/team/app-team-import-core.js` |
| **Excel ops (large)** | `js/team/app-team-excel-ops.js` |
| **Print / Learn links** | `js/team/app-team-print-learn.js` |
| **Schedule page** | `js/schedule/app-schedule.js` |
| **Auto Schedule / builder / coverage** | `js/schedule/app-sched-builder.js` |
| **Cell keys** | `js/schedule/sched-cell-keys.js` |
| **Clipboard** | `js/schedule/sched-clipboard.js` |
| **Undo** | `js/schedule/sched-undo.js` |
| **Offline queue** | `js/schedule/sched-offline-queue.js` |
| **Commercial / paywall** | `js/commercial/mp-commercial.js` |
| **Public offer (login prices)** | `js/commercial/public-offer.js` |
| **i18n base** | `js/i18n/i18n_locale.js` |
| **i18n multi-lang** | `js/i18n/i18n_ml.js` |
| **HTML shells** | `index.html`, `team.html`, `schedule.html`, … |
| **Resume builder (separate)** | `resume-builder/` |
| **Service worker** | `sw.js` |
| **RTDB rules** | `database.rules.json` |

---

## 3. "I want to change X"

| Goal | Open only |
|------|-----------|
| Version / admin phones / shift labels | `js/config/config.js` (+ SW version if needed) |
| Login OTP | `js/auth/app-login.js` |
| Auto Schedule / coverage | `js/schedule/app-sched-builder.js` |
| Excel mapping | `js/team/app-team-excel-ops.js` + `app-team-import-core.js` |
| Public login prices | Firebase `publicOffer` + `js/commercial/public-offer.js` |
| Hindi strings | `js/i18n/i18n_ml.js` |
| Home cards | `js/session/app-session-home.js` |

---

## 4. Folder map

```
js/
  config/      commercial/   core/
  auth/        session/      team/
  schedule/    i18n/
```

Script load order is fixed in `index.html` (eager + deferred heavy list). Do not reorder without checking dependencies.

---

## 5. Token tip

Largest files: `js/team/app-team-excel-ops.js`, `js/session/app-session-settings.js`, `js/schedule/app-sched-builder.js`. Grep the function name, then read a small range.

### Landing videos
- Admin UI + publish: `js/session/app-session-payment.js` (`settings/landingVideos`, `publicOffer.video*`)
- Login chips: `js/commercial/public-offer.js` + `#loginVideos` in `index.html`
- Marketing: `landing/index.html`
- Guide: `Improvements/LANDING_VIDEOS_ADMIN.md`

### Resume Builder AI docs
- `resume-builder/AI_INDEX.md` — feature map for layouts/wizard
- `resume-builder/AI_README.md` — purpose + edit rules
