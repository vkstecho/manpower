# Custom Claims migration (v2.4.99)

## Goal
Stop relying on a hard-coded admin phone inside every RTDB rule. Prefer JWT claims:

- `auth.token.admin === true`
- `auth.token.manager === true`

Phone bootstrap (`+918929397949`) and `admins` / `managers` / `mobileUsers` role nodes remain as **fallback** so existing OTP login keeps working.

## Rules (already in database.rules.json)

Admin grant (any of):

1. `auth.token.admin === true` (Custom Claim)
2. `auth.token.phone_number === '+918929397949'` (bootstrap)
3. `root.child('admins').child(auth.uid).val() === true`
4. `mobileUsers/{phone}.role === 'admin'`

Manager grant (any of):

1. `auth.token.manager === true`
2. `root.child('managers').child(auth.uid).val() === true`
3. Approved `mobileUsers/{phone}` with `role === 'manager'`

## How to set claims (Cloud Functions + Admin SDK)

Requires a **trusted** backend (Cloud Function). Example:

```js
// functions/setRoleClaim.js (deploy with firebase-functions)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setRoleClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  const caller = context.auth.token;
  if (!caller.admin) throw new functions.https.HttpsError('permission-denied', 'Admin only');

  const { uid, role } = data; // role: 'admin' | 'manager' | 'member'
  const claims = {
    admin: role === 'admin',
    manager: role === 'manager' || role === 'admin'
  };
  await admin.auth().setCustomUserClaims(uid, claims);
  return { ok: true, uid, claims };
});
```

After setting claims, the user must **refresh the ID token** (sign out/in or `getIdToken(true)`).

## Client note

Phone Auth users have a UID. On successful manager/admin login the app already writes `admins/{uid}` or `managers/{uid}` via `_syncAuthRoleNodes` — that remains valid under the new rules.

Optional later: call `setRoleClaim` from Admin UI after approve.

## Tightened writes (security)

These paths were `auth != null` write and are now **admin or manager** only:

- `schedules`, `overrides`, `shiftConfigs`
- `reports`, `attendance`, `todos`, `instructions`
- `employees`, `holidayLists`, `leaveQuotas`, `supskillAnalysis`, `supskillDowntime`

Still writable by any signed-in user (needed for login / device / leave flows):

- `deviceApprovals`, `leaves`, `loginRequests`, `shiftChangeRequests`, `userNotifications`, `deviceLoginLogs` (create-only)

## Deploy

```bash
firebase deploy --only database
```

Test with a manager OTP session: create/save schedule, approve member, upload team Excel.
