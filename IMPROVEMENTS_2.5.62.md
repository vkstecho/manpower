# 2.5.62 — Code review fixes

## Critical
### Manager promote no longer demotes ALL managers in company
**Bug:** Editing an employee → Access = Manager ran a block that demoted **every other manager in the same company** (employees + mobileUsers). Multi-manager companies lost other managers on one promotion.

**Fix:** Only the **outgoing** manager is demoted (session manager / previous managerId of the person being promoted). Other managers in the company are left unchanged. Team members still re-point only when their managerId matched the outgoing manager.

## Medium
### Orphan cleanup matches managerId as phone **or** emp id
Some rows store `managerId` as employee object id. Remove-orphans now treats both live manager phones and live manager emp ids as valid owners.

### Service Worker PRECACHE
Removed duplicate `./MR_Skill/mr_skill.html` entry.

## Already solid (2.5.59–61)
- Pay-until modal prefill
- Print loads html2canvas
- Admin getEmps hides left/resigned
- Remove orphans button

## Still recommended (not changed this build)
1. Dedicated **Transfer team** UI (pick new manager + confirm) instead of only via Edit → Manager.
2. Payment gate path in login-session could also `await ensureHtml2Canvas()` before calendar image export.
3. Consider App Check + custom claims for all admin writes (documented in PAY_UNTIL / SECURITY).
4. Large JS bundles — further split already started; continue if load time matters on 2G.
