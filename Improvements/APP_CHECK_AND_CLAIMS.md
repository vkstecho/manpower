# App Check + Custom Claims (v2.5.1)

## App Check (optional, recommended for production)

1. Firebase Console → App Check → Register web app → reCAPTCHA v3.
2. Before `firebase-init.js` loads, set:

```html
<script>window.MP_APPCHECK_SITE_KEY = 'YOUR_RECAPTCHA_V3_SITE_KEY';</script>
```

3. Enforce App Check on RTDB / Storage when ready (Console → App Check → APIs).

Until the site key is set, App Check stays **off** (no break for existing installs).

## Custom Claims Cloud Function

See `functions/setRoleClaim.sample.js`.

1. `cd functions && npm i firebase-functions firebase-admin`
2. Deploy `setRoleClaim`
3. From Admin UI (later): `httpsCallable(functions, 'setRoleClaim')({ uid, role: 'manager' })`
4. User refreshes ID token (`getIdToken(true)`) — client already calls `_refreshIdTokenClaims`

RTDB rules already accept `auth.token.admin` / `auth.token.manager`.

## Tests

```bash
node tests/run-utils-tests.js
```

Covers: phone normalize, emp id, path sanitize, escHtml/escAttr, hard-admin list, hashPass.
