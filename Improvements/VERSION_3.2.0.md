# Man Power v3.2.0 — Production stability audit

## Critical fixes confirmed / strengthened
1. Landing page loop — polyfill no longer forces login every 10s when session exists
2. Desktop login overlay — CSS only shows #loginScreen.show (not bare #loginScreen)
3. _showLoginScreenSafely — refuses to show login if mp_session has a role; relaunches app instead
4. G shift legend — canonicalize keeps G; status list no longer hardcodes "General"
5. Payment discount example uses live %; save payment navigates Home
6. _userNotifUnread uses var (no TDZ crash)
7. Self-WhatsApp skip when editing own shift
8. SW_VERSION 3.2.0 for hard cache bust

## Residual risk (not bugs, product rules)
- 45-day session re-login (check45DayLogout) — intentional security
- Fingerprint gate on start — expected; password fallback available
- Admin approval for new managers — by design

## Deploy checklist
1. Upload full zip to hosting
2. Users must hard-refresh once (or clear site data) so SW 3.2.0 activates
3. Smoke test: login → stay 2+ minutes → no landing bounce
4. Schedule: set G label/times → save → legend matches
5. Admin: save payment settings → returns Home
