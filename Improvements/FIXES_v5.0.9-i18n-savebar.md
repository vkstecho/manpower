# v5.0.9 — Save bar i18n + My Shift sync

## Snapshot bug (screenshot)
English UI still showed **Save हो रहा है...** on the green Save button because the saving state was hardcoded Hinglish (not passed through `L()`).

## Fixes
1. **Saving label** uses `L('⏳ सहेजा जा रहा है...','⏳ Saving...')`.
2. **Pending title** pure Hindi: `बदलाव लंबित` (no English word `pending` inside Hindi string).
3. **WhatsApp subtitle** pure Hindi: `सहेजने पर … (मुफ़्त)` instead of `Save करने पर … (Free)`.
4. **Idle Save / Cancel / Discard** labels updated language-aware when the bar opens.
5. **My Shift list sync** moved *after* the schedule list is built (previously copied empty HTML).
6. Permission / verify-phone messages on the save path use `L()`.
7. Related login toasts cleaned (verify / approve / upload).
8. **Version aligned**: `APP_VERSION` + Service Worker both **5.0.9** (was 5.0.8 config vs 5.0.15 SW drift).

## Files
- `js/team/app-team-excel-ops.js`
- `js/auth/app-login.js`
- `js/auth/app-login-device.js`
- `js/config/config.js`
- `sw.js`
