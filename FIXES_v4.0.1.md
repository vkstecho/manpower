# Man Power v4.0.1 + Auth from v3.2.6

## What changed
Login / authentication / fingerprint session restore taken from **ManPower-v3.2.6** (the build where returning users unlocked with fingerprint).

### Files from v3.2.6
- `js/auth/app-login.js`
- `js/auth/app-login-device.js`
- `js/auth/app-login-session.js`
- `js/auth/app-session-auth.js`
- Fingerprint + `startApp` boot path inside `js/core/app.js` (`FP_KEY` … `startApp`)
- Session save/load path inside `js/core/app-core.js` (`encodeSession` … `check45DayLogout`)

### Kept from v4.0.1
- Landing page language fixes (`index.html`, `js/landing-i18n.js`)
- Rest of v4 app features outside the replaced blocks

### Boot behaviour (from 3.2.6)
1. `loadSession()` / IndexedDB restore
2. If session exists → `checkFingerprintOnStart()`
3. Fingerprint unlock → `launchApp()`
4. No session → login screen (OTP)

### Deploy
Upload full folder. Hard-refresh devices (cache-bust `?v=401026` on auth scripts).
Existing `mp_session` + fingerprint keys on device should work again if domain unchanged.
