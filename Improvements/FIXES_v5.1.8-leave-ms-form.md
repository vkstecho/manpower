# v5.1.8 — Bugs from user snaps/video

## 1. Schedule multi-select Leave → "0 cells set to L" (critical)
- Opening Leave reason modal took `count` from selection, but by confirm time `_msSelected` was often empty.
- Fix: snapshot keys to `window._msLeaveSnapshot` when modal opens; restore before commit; also use snapshot inside `_msCommit`.
- Emp lookup now matches `id` / `empId` / `empCode`.
- `stageSingleShiftChange` no longer `closeModal()` / toast on every cell during bulk (`_msBulkCommit`).

## 2. Hindi "N cells चुने" on multi-select bar
- Uses `L()` for EN: "N cell(s) selected".

## 3. Employee edit Save bar covering Team authorization
- Larger scroll spacer before sticky Save/Cancel.
- Modal scroll CSS simplified so sticky bottom works without covering last fields.
