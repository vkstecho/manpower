# Deploy Firebase Realtime Database rules (Man Power v2.4.0)

## File
`database.rules.json` — paste into Firebase Console or deploy via CLI.

## What changed in v2.4.0 (hardened)

| Path | Before | After |
|------|--------|--------|
| `overrides`, `attendance`, `leaveQuotas` | any `auth` could write | managers / admins only |
| `deviceApprovals` | any `auth` | managers / admins only |
| `loginRequests`, `regRequests`, `leaves` | any `auth` full write | create own pending; approve = manager/admin |
| `deviceChangeRequests`, `learnRequests` | any `auth` | create own; update = manager/admin |
| `userNotifications` | any `auth` | own uid or manager/admin |
| `adminNotifications` write | any `auth` | managers / admins |
| `settings/license` | same as settings | **admins only** |
| `adminAuth` | locked | still locked (read/write false) |

Default root remains **deny**.

## Admin phone (hardcoded in rules)
- `+918929397949` (8929397949) — sole admin login number

Also accepted: `/admins/{uid} === true` and approved managers via `/managers/{uid}` or `mobileUsers` role=manager + status=approved.

To add another admin phone, search the rules for `9189293` and add the new number, **or** set `admins/{uid} = true` after that user logs in with OTP.

## Deploy

### Console
1. Firebase Console → Realtime Database → Rules
2. Paste entire `database.rules.json` contents
3. Publish

### CLI
```bash
firebase deploy --only database
```

## One-time setup after publish

### 1. Create admin Auth user
Login once in the app with OTP on **8929397949**.

### 2. mobileUsers record
```
mobileUsers/8929397949
  name: "Admin"
  role: "admin"
  status: "approved"
  mobile: "8929397949"
```

### 3. Register Auth UID under admins (recommended)
Firebase Console → Authentication → copy UID, then:
```
admins/{UID}: true
```

### 4. License (optional)
```
settings/license
  validTill: "2026-12-31T00:00:00.000Z"
  unlockHashes: { ... }
```
Only hard-admin phones / `admins/{uid}` can write `settings/license`.

## Notes
- Company isolation is still enforced mainly in the **client** (`companyId` filters). Rules do not yet partition every path by company.
- After deploy, test: member leave submit, manager approve, admin login, Excel team upload.
