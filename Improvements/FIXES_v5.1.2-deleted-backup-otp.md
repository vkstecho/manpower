# v5.1.2 — Deleted Account Backups OTP / Load

## Symptoms
Admin could not send OTP from **Deleted Account Backups** modal; Verify button always visible; download blocked.

## Root causes
1. CSS `.submit-btn { display:flex !important }` overrode inline `display:none` on Verify — both buttons always shown.
2. OTP path called `_fbSendPhoneOtp`, which **signed out** the logged-in Admin (different phone) before send — broke session / modal.
3. OTP was unnecessary for Admin: RTDB rules already allow `auth.token.admin` / `admins/{uid}` to **read** `accountBackups/{mobile}`.

## Fixes
1. Primary action: **Load Backups** (Admin, no OTP).
2. OTP UI wrapped in `<div hidden>` (not `display:none` on `.submit-btn`) so Verify stays hidden until send succeeds.
3. `window._mpSkipOtpSignOut` during backup OTP so Admin session is not force-signed-out.
4. Clearer status/errors (rate limit, captcha, network).
5. Download allowed for Admin after Load even if OTP path unused.

## Files
- `js/session/app-account-backup.js`
- `js/auth/app-login-device.js`
