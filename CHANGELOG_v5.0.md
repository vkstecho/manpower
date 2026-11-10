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
