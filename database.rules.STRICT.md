# Stricter Firebase rules (v2.5.76)

## What changed (safe for current app)

### Writes tightened (were: any logged-in user)
- **schedules** → Admin or approved Manager only
- **overrides** → Admin or Manager only
- **shiftConfigs** → Admin or Manager only
- **instructions** → Admin or Manager only
- **attendance** → Admin or Manager only
- **deviceApprovals** → Admin or Manager only

Members still use **shiftChangeRequests** / **leaves** for requests (not full schedule write).

### Paths added (were missing → denied by default root)
- resignations, leftEmployees, workerPasswords
- metcostData, metcostSettings, smsSettings
- subscriptions, securityLog, companies

### Unchanged (required for app to work without rewrite)
- **.read: auth != null** on employees, leaves, todos, reports, schedules, mobileUsers
  - App loads full lists then filters in UI
  - True per-team read isolation needs data restructure + client query changes
- **leaves / todos / reports** write still auth (members must create)
- **mobileUsers** complex write kept (OTP register, handoff, company name)
- **paymentStatus** write Admin only

## Deploy
Firebase Console → Realtime Database → Rules → paste database.rules.json → Publish

## Test after publish
1. Manager: edit schedule, save shifts, approve leave, create todo
2. Member: apply leave, create own todo, shift change request
3. Admin: set payment date, approve manager
4. Member must NOT save full schedule grid

## Fix (v2.5.76 publish)
- Removed **duplicate** `"companies"` key (was listed twice → Firebase: "companies occurs multiple times").
- Kept single `companies` rule: `.read` auth, `.write` Admin or approved Manager.

## v2.5.76.1 package
- **app.js syntax fixed** (same bugs as 2.5.72: missing `async` on `renderTodo`, illegal `const` in `saveTodo`, stray `async` token).
- **STRICT rules** with single `companies` key (publish-safe).
- Includes 2.5.76 features: team scope helpers, schedule multi-select, tighter writes.
