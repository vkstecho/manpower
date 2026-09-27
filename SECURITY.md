# Security setup (v2.3.20)

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
