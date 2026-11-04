# v3.1.9 CRITICAL — stop landing page loop
Bug: polyfill setTimeout(_forceLogin, 10000) ran on EVERY page load and
_forceLogin ALWAYS hid mainApp and showed loginScreen — kicked users to
landing every ~10 seconds while using the app.

Fix: _forceLogin checks mp_session / SESSION.role first and returns without
touching UI if logged in. 10s timer only shows login when there is truly
no session and app chrome is not visible.
