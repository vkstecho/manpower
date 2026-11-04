# Man Power v4.0.2 — Password / Install / My Shift Copy-Paste

## 1. Password Login label not visible
**File:** `js/auth/app-login-device.js`

- `DEVICE PASSWORD *` label colour `#64748b` → `#e2e8f0` (both emp-code and mobile password screens)
- Hardcoded Hindi subtitles (`OTP नहीं चाहिए`, etc.) now use `L()` for English UI
- Forgot-password link colour brightened; wrong-password message bilingual

## 2. Install App button while logged in (when not installed)
**Files:** `app.html`, `js/commercial/mp-commercial.js`, `js/session/app-session-nav.js`

- Header **📲 Install** sits next to **Share** (📤)
- Opens platform chooser (iPhone / Android / Windows) via `_showInstallPlatformModal`
- Shown with `display:flex` when not standalone / not TWA / not already installed
- Re-evaluated on every `launchApp()` so it appears after login in the browser

## 3. My Shift multi-select: Copy / Paste (shift palette hidden)
**File:** `js/session/app-session-home.js` (uses `js/schedule/sched-clipboard.js`)

When multiple days are selected:
- Shift-select chips (A / B / C / Off / Leave / …) **hidden**
- **Copy** button copies the selected days’ shifts
- After copy, **Paste** appears on the bar
- Tap any day (with clipboard loaded) → green target + **Paste** button
- **Clear** clears selection / bar

## Version
- `APP_VERSION` / `SW_VERSION` → **4.0.2**

## Deploy
Upload at least:
- `js/config/config.js`, `sw.js`
- `js/auth/app-login-device.js`
- `app.html`
- `js/commercial/mp-commercial.js`
- `js/session/app-session-nav.js`
- `js/session/app-session-home.js`

Hard-refresh after deploy.
