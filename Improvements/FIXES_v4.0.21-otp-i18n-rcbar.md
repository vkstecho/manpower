# v4.0.21 — OTP login: English i18n + security bar (tick box / captcha cover)

## Issues (from screenshots)
1. **Hindi in English UI**: Resend countdown showed `25s में फिर भेजें` even when language was English.
2. **Yellow security bar collapsed**: Fixed bottom "Security check" bar often showed only the title — reCAPTCHA checkbox area had zero height / was missing.
3. **Captcha images covered**: Bar used `z-index: 2147483000`, which sits above Google’s image-challenge iframe, so “select all …” grids were partially or fully covered by the yellow box.

## Fixes
### 1. Resend timer language-aware (`js/auth/app-login.js`)
- `_startResendTimer` no longer hardcodes Hindi.
- Uses `L(hi, en)` (or `_lang` / `mp_lang`) so English (and non-hi) shows e.g. `25s · Resend`.

### 2. Security bar always shows checkbox host (`js/auth/app-login-device.js` + `app.html` CSS)
- Explicit `width/height/min-height: 78px` on the reCAPTCHA host + white background + `flex-shrink:0`.
- Bar itself has `min-height: 120px` so it cannot collapse to title-only.
- After widget create, force iframe visibility with short timeouts (widget can load late).

### 3. Captcha challenge no longer covered
- Lowered bar `z-index` from `2147483000` → `100000` (still above login UI, below Google’s challenge layer).
- Same intent in CSS for `#rcDesktopBar`.

### Version
- `APP_VERSION` → `4.0.21` in `js/config/config.js`

## Files
- `sw.js` — `SW_VERSION` → `4.0.21` (cache bust so clients pick up login/i18n fixes)
- `js/auth/app-login.js` — resend timer i18n
- `js/auth/app-login-device.js` — desktop visible reCAPTCHA bar
- `app.html` — `#rcDesktopBar` CSS
- `js/config/config.js` — `APP_VERSION` → `4.0.21`
- `sw.js` — `SW_VERSION` → `4.0.21`
