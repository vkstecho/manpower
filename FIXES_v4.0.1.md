# Man Power v4.0.1 — Landing & PWA install fixes

## Fixed

### 1. Mixed Indian-language words on EN / HI landing page
- Hero mock table day headers now use `data-i18n` (`mon` / `tue` / `wed` / `coverage`).
- `apply()` always rewrites table headers from keys, so Tamil (or any other language) no longer sticks after switching back to English or Hindi.
- Landing **display language is forced to English or Hindi only**. Other languages (ta, gu, ar, …) are still saved in `localStorage.mp_lang` for the app after login, but marketing copy stays EN/HI.
- Added `data-i18n` for pricing title/lead, plan starts from, custom plan block, contact title, FAQ title + all Q&A, and final CTA.
- Full Hindi strings for the new keys.

### 2. Install · iOS / Windows returned to landing page
- Replaced `_showInstallPlatformModal()` in `js/core/app.js`.
- Modal **never** opens `https://manpower.vkstech.com`.
- iOS → Safari “Add to Home Screen” instructions.
- Android → Play Store.
- Windows / Desktop → native `beforeinstallprompt` when available; otherwise clear Chrome/Edge menu steps.

## Files changed
- `index.html`
- `js/landing-i18n.js`
- `js/core/app.js`

## Deploy note
Clear CDN / browser cache for `js/landing-i18n.js` and `js/core/app.js` after upload.
