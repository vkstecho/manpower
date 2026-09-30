# Deploy Custom Claims (v2.5.2)

## 1. Deploy Cloud Functions

From the project root (where `firebase.json` lives, or create one):

```bash
# If needed: firebase init functions  (use existing functions/ folder)
cd functions
npm install
cd ..
firebase deploy --only functions
```

Functions provided:

| Name | Who calls | Purpose |
|------|-----------|---------|
| `syncMyClaims` | Logged-in manager/admin | Sets claims from mobileUsers / admins / managers / hard-admin phone |
| `setRoleClaim` | Admin only | Sets claims for another `uid` + `role` |

## 2. Client behaviour (already wired)

After login, `_syncAuthRoleNodes()` schedules `_requestRoleClaims({})` → calls **`syncMyClaims`**.

Admin UI can call:

```js
await adminSetRoleClaim(targetUid, 'manager'); // or 'admin' | 'member'
```

If Functions are not deployed, calls fail quietly (console warn) and RTDB role nodes still authorize writes.

## 3. Verify

1. Deploy functions.
2. Login as manager with OTP.
3. Firebase Console → Authentication → user → Custom claims should show `{ "manager": true }` (or admin).
4. RTDB rules already accept `auth.token.manager` / `auth.token.admin`.

## 4. firebase.json snippet

```json
{
  "functions": { "source": "functions" },
  "database": { "rules": "database.rules.json" }
}
```
