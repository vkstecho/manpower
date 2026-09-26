# Deploy Firebase Realtime Database rules (Man Power)

## File
`database.rules.json` — paste into Firebase Console or deploy via CLI.

## What these rules fix

| Before | After |
|--------|--------|
| Any logged-in user could write almost everything | Default **deny**; writes limited by role |
| Anyone could set `mobileUsers/.../role` to `admin` | **Cannot** self-promote to admin |
| `adminAuth` password hashes readable | **Locked** (read/write false) |
| Admin only via weak client checks | Admin = phone **+918929397949** or **+918929394920**, or `/admins/{uid}` |

## Admin phones (hardcoded in rules)
- `+918929397949` (your OTP admin)
- `+918929394920` (existing / support)

To add another admin phone later, edit both places in the rules (search `9189293`).

## One-time setup after publish

### 1. Create your admin user in Auth
Login once in the app with OTP on **8929397949** so Firebase Auth creates the user.

### 2. Set `mobileUsers` record
In Realtime Database:

```
mobileUsers/8929397949
  name: "Admin"
  role: "admin"
  status: "approved"
  mobile: "8929397949"
```

### 3. Register Auth UID as admin (recommended)
After OTP login, copy **UID** from  
Firebase Console → Authentication → Users.

Then create:

```
admins/<THAT_UID>: true
```

Managers (optional):

```
managers/<MANAGER_UID>: true
```

This lets rules work even when `mobileUsers` keys don’t match `auth.token.phone_number` format.

## Deploy steps

### Option A — Console
1. Open [Firebase Console](https://console.firebase.google.com) → your project  
2. **Realtime Database** → **Rules**  
3. Replace all rules with contents of `database.rules.json`  
4. **Publish**

### Option B — CLI
```bash
firebase deploy --only database
```
(with `database.rules.json` referenced in `firebase.json`)

## After deploy — test
1. Login as **8929397949** → should manage schedules / team  
2. Login as normal member → **cannot** change `employees` or others’ roles  
3. New registration → can create only own `mobileUsers` with `status: pending` and role manager/member  

## Notes
- Password **Admin Login** path that only used client-side session **will not** get elevated DB rights without Phone Auth or an entry under `/admins/{uid}`. Prefer OTP admin.  
- Some paths (`leaves`, `reports`, `attendance`) stay writable by any signed-in user so workers can still apply leave / submit reports. Tighten further later if needed.  
- Rules are not a substitute for validating data shape; add `.validate` rules over time.

## 2026-09-25 update — schedule PERMISSION_DENIED fix

Rules for `overrides`, `schedules`, `employees`, `shiftConfigs` (and related) now also allow writes when:

1. Hardcoded admin phones, or
2. `/admins/{uid} === true`, or
3. `/managers/{uid} === true`, or
4. **Phone OTP user** is an **approved manager** in `mobileUsers` (10-digit key or full phone key)

App also auto-writes `managers/{auth.uid}=true` (or `admins/...`) on login via `_syncAuthRoleNodes()`.

### After uploading this rules file
1. Firebase Console → Realtime Database → Rules → paste `database.rules.json` → **Publish**
2. Managers: **Logout → Login again with Phone OTP** (not anonymous session)
3. Edit a shift → Save — should succeed

### One-time optional (if still denied)
Firebase Console → Authentication → copy manager **UID** → RTDB:
```
managers/<UID>: true
```

### holidayLists path (2026-09-25)
`holidayLists/{companyKey}` — read: any auth user; write: admin phones / admins node / managers node / approved phone manager.
