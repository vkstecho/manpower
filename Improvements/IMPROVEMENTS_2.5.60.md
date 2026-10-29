# 2.5.60 — Print button fix + notes on manager transfer

## Print button not working
**Cause:** `html2canvas` is loaded on demand (`ensureHtml2Canvas`), but `_execPrint()` only checked if it existed and never called the loader — so Print did nothing (or showed “library failed”).

**Fix:**
- `_execPrint` now awaits `ensureHtml2Canvas()` / `MP_UTILS.ensureHtml2Canvas()` before capturing.
- Roster filter no longer requires a non-empty `ms` array (left/resigned still excluded).

## Manager transfer (no new login required)
Existing flow in **Team → Edit employee → Access = Manager → Save**:
1. Creates `mobileUsers/{phone}` with `role: manager`, `status: approved` (person does **not** need to have logged in).
2. Re-points all team members with the same old `managerId` to the new manager’s phone.
3. Updates Admin hierarchy so the team appears under the new name/number.

## Orphan members
Members whose `managerId` does not match any live manager appear as uncategorised under Admin hierarchy. Remove via Team left/delete or Admin profile delete; use **Repair managers list** to re-point where ownership is clear.
