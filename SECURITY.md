# Security setup (v2.4.0)

Client no longer ships admin password hashes or license unlock keys.

## 1. Admin auth (Firebase RTDB)

Path: `adminAuth/{username}`

```
{
  "h": "<sha256 of username:password:MP_ADMIN>",
  "name": "VIVEK"
}
```

Hash formula (same as app):
```js
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(user + ':' + pass + ':MP_ADMIN'));
const h = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
```

Set once in Firebase Console → Realtime Database. Do **not** put hashes in source code.

## 2. License (Firebase RTDB)

Path: `settings/license`

```
{
  "validTill": "2026-12-31T00:00:00.000Z",
  "extendTo": "2027-12-31T00:00:00.000Z",
  "unlockHashes": {
    "master": "<sha256 of master unlock passphrase>",
    "extend": "<sha256 of extend unlock passphrase>"
  }
}
```

Unlock key entered in the app is SHA-256 hashed and compared to `unlockHashes` only.

## 3. RTDB rules (recommended)

- Deny public write to `adminAuth` and `settings/license`
- Allow admin users (custom claims or known admin UIDs) to write
- Reads of `adminAuth` only needed for login; prefer a Cloud Function later

## 4. Removed from client

- Emergency hardcoded admin credentials
- `initAdminAuth()` seeding of hashes
- `CFG.license.masterKey` / `extendKey`


## 5. Hard-admin phones (OTP → Admin)

Bootstrap list may exist in `js/config.js` / `CFG.hardAdminPhones` so known admin mobiles can OTP straight into Admin.

**Preferred (v2.4.97+):** also set in Firebase RTDB:

```
settings/hardAdminPhones: ["8929397949", "+918929397949"]
```

The client merges this list at runtime. **Do not treat client-side phone lists as authorization** — RTDB rules and `adminAuth` remain the authority for privileged writes. Plan: migrate privilege to Firebase Custom Claims (`admin: true`) and drop phone-list checks from rules.

## 6. Manager invite code

Product default: empty invite (any user can self-register as Manager after OTP). To require a code, set Firebase `settings/managerInviteCode` (and keep client `managerInviteCode` empty so the value is not shipped in source).

## 7. Custom Claims (v2.4.99+)

RTDB rules accept JWT claims:

- `auth.token.admin === true`
- `auth.token.manager === true`

These must be set with the **Firebase Admin SDK** (Cloud Function), never from the client. See `CUSTOM_CLAIMS_GUIDE.md`.

Until claims are rolled out, authorization still works via:

1. Bootstrap admin phone
2. `admins/{uid}` / `managers/{uid}` nodes
3. Approved `mobileUsers/{phone}` role

Schedule / employee / report writes are restricted to admin or manager (no longer any signed-in user).
