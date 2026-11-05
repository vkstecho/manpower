# v4.0.22 — Security bar: checkbox actually renders (not empty bar)

## Root cause
`_fbMakeRecaptcha` → `_fbEnsureRecaptchaHost` preferred `#recaptcha-inline` inside the login card.
The fixed bottom yellow bar was created, then the host was **moved** into the card (or a new empty host left in the bar). Result: title-only bar, no tick box, “Sending…” stuck.

Also `z-index: 2147483000` (earlier) covered Google image challenges.

## Fix
1. **Bar-first host rule** in `_fbEnsureRecaptchaHost`: if `#rcDesktopBar` exists, keep host there — never steal to inline.
2. **Desktop visible path** uses a **dedicated container id** `recaptcha-container-desktop-bar` and creates `RecaptchaVerifier` **directly** on that host (skips `_fbEnsureRecaptchaHost` for this path).
3. White 304×78 host + “Loading security check…” placeholder until iframe appears.
4. Style reinforcement after render (no DOM reparent — reparenting kills grecaptcha).
5. `z-index: 100000` (below Google challenge).
6. `SW_VERSION` / `APP_VERSION` → **4.0.22**

## Files
- `js/auth/app-login-device.js`
- `app.html` (CSS)
- `js/config/config.js`
- `sw.js`
