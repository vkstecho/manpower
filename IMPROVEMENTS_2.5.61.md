# 2.5.61 — Remove orphan names not under any manager

## Problem
Old names that were no longer under any live Manager still appeared in Schedule / Team / Admin views.

## Fixes
1. **Admin `getEmps()`** now excludes `left` / `left_team` / `resigned` / `removed` / `revoked` (same as managers). Left Members view still uses its own source.
2. **🧹 Remove orphans** button (Admin hierarchy, next to Repair managers):
   - Finds active employees whose `managerId` is empty or not a live manager (and who are not managers themselves).
   - Marks them `left_team` + archives to `leftEmployees` (shift history kept).
   - Clears orphan `mobileUsers` logins so they do not stay in Admin lists.
3. Toast shows how many names were removed.

## How to use
Admin login → Team hierarchy / Managers block → **🧹 Remove orphans** → confirm.
