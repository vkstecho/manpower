# Man Power v3.0.9 — Hotfix (login/session)

## Cause of logout after 3.0.8 upload
Two **syntax errors** in 3.0.8 stopped JS from loading:

1. `async async function saveCustomerCareAdmin` in `app-login-session.js`
2. `async async function openLeaveReasonModal` + broken i18n string in `app-team-import.js`

When those files fail to parse, session restore never runs → app looks **logged out**.
Login OTP flow was **not** intentionally changed.

## This build
- Syntax errors fixed; all critical JS pass `node --check`
- Keeps all 3.0.8 feature fixes (G colour/timing, Paid till, double-tap, leave reason, admin video URL, etc.)

After deploy: log in once with OTP. Session should persist again.
