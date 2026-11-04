# v4.0.8 — My Shift multi-select: shift palette + Copy/Paste

## Issue
Multi-select on My Shift only showed Copy / Paste / Clear. Shift codes (D/N/A/B/C/L/G/…) were hidden.

## Fix
`_showMyShiftBulkBar` now shows **both**:
1. **Copy · Paste · Clear** (clipboard)
2. **Shift palette** — D N A B C O L G CO ½ Ab H (same as Schedule)

Tapping a shift code runs `applyMyShiftBulk` on all selected days.
Inactive A/B/C/D/N/G codes from shift config are hidden when configured.

## Deploy
- `js/session/app-session-home.js`
