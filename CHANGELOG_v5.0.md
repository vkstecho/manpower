# Man Power v5.0.0 — Release notes (sellable build)

## Highlights
- Version **5.0.0** (APP_VERSION + Service Worker cache bump for clean client refresh)
- Excel / bulk import reliability for **Weekly Off** and **Responsibility**
- Team size limit aligned with **Admin teamSize** and **payment planMaxMembers** (not stuck at 25 when plan is 200)
- Account delete cascade uses **full employee cache** (not only filtered getEmps list)
- Schedule keyboard / click paint prefers `data-empid` + `data-date` (fixes wrong-row badge)
- Unsaved-changes leave dialog is **language-aware** (English UI no longer forced Hindi)
- Pending Save bar name/date contrast improved on dark green bar
- Bulk import respects team size when creating **new** members

## Fixes addressed from QA
1. Manager account delete left orphan team members → cascade reads full roster cache + managerId match
2. Excel import set everyone to SUN weekly off / weak responsibility grouping → persist `woff`, `resp`, `responsibility`
3. Team limit toast “max 25” while plan showed 200 members → `_getMyTeamSizeLimit` falls back to `planMaxMembers`
4. Hindi modal on English language → `L()` / `_lang` aware confirm on tab leave
5. Typing shift letter painted wrong employee row → cell query by empId+date first
6. Meena / pending name hard to read → forced light text on save bar chips

## Operator notes (Admin)
- After re-registering a manager, set **Team Size** in Admin to match the sold plan (e.g. 200).
- **Pay until** and **Team Size** should both be set; manager UI reads the same `mobileUsers` / `managers` fields.
- Prefer **Delete Manager + Team** from Admin when fully wiping a test manager.

## Upgrade
1. Deploy this folder (or ZIP contents) over the existing hosting root.
2. Clients pick up SW **5.0.0** automatically (refresh once if schedule looks cached).
3. Re-import team Excel if Weekly Off / Responsibility were wrong under v4.

## Not a full rewrite
Core Firebase schema, OTP login, Auto Schedule engine, and commercial plans are unchanged in behaviour except for the fixes above.


## v5.0.1 (this build)
- **Admin company filter**: selecting GLS / Telecom shows only that company's managers (empty/default company no longer leaks into every company)
- **Upload Schedule Excel**: imports Weekly Off, Responsibility, Mobile, Designation, Machine, Salary, DOJ, DOB the same way as Team import; updates existing members
- **Upload status** messages language-aware (EN/HI)
- **reCAPTCHA**: cleared on logout so re-login is less likely to stick on a broken challenge
- **Delete backups**: before self-delete / Admin Delete Manager+Team / Delete All Members, snapshot roster + schedules to `accountBackups/{mobile}/{id}` (6 months)
- **Admin → Deleted backups**: search by mobile, OTP to that number, download Excel by delete date


## v5.0.2
- Auto Schedule: less top chrome, more rows visible; bottom **A/B/C/D/N shift counts** (live)
- Admin company filter: `_companyMatchesView` strict (no empty/default leak); toast shows company id; hierarchy re-renders on switch
- Manager badge: always show **Team Size · N Members**; days left prefers **Pay until** date (not stale validTill)
- Team Size save also sets planLabel / planMaxMembers for list display
- Cloud Functions `engines.node` → **26** (fixes deploy rejection of Node 20)


## v5.0.3
- **New Manager registration**: auto-grants **Team Size 200** and **free trial days** from Admin → License settings (`settings/appLicense.freeTrialDays`)
- Writes both `mobileUsers` and `paymentStatus` so Team badge + Pay gate match
- `_ensureNewUserPaymentTrial` also sets planMaxMembers/teamSize **200** on first trial grant


## v5.0.4
- **Left Members isolation**: Manager sees only own left members (managerId match); Admin company filter is strict — no cross-manager leak
- **Excel import**: re-activates left/resigned employees with same Emp ID; removes leftEmployees archive row
- **Auto Schedule counts**: **date-wise** A/B/C/D/N/O grid + totals (aligned with Schedule section)
- **Validity permanent**: Admin badge uses `paymentStatus` paid-until as single source of truth; overwrites stale `validTill` (fixes 365d vs 7d)


## v5.0.5
- **OTP Send stuck on "Sending…"**: concurrent-send guard; button shows "Complete security check" while captcha runs; always restores on fail/success
- Desktop invisible reCAPTCHA timeout **8s** then visible checkbox (was 25s hang)
- Visible captcha **render timeout 12s** + clear error if blank white box (domain/cookies)
- Stop warming second verifier during in-flight send (blank/stuck captcha race)


## v5.0.6
- **Delete team OTP wrong number**: `_resolveManagerMobile` treated `+91XXXXXXXXXX` as invalid (length≠10) and fell back to support UPI **8168771239** (`CFG.contactVivek`). Now always uses last-10 of login SESSION / device phone; **never** support contact for security OTP.


## v5.0.7
- **SUNITA validity mismatch**: Admin showed Active 52d while Manager showed expired 29 Oct — `paymentStatus` list read was denied (only `$phone` rule), so Admin used stale `mobileUsers.validTill`. Fixed rules + per-phone paymentStatus fetch + badge uses earliest paid-until.
- **Desktop OTP**: skip invisible captcha; show visible checkbox first (stops endless Sending…)
- Manager profile Paid-till reads `paymentStatus/{mobile}` first
