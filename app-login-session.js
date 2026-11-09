/**
 * app-login-session.js — SPLIT in v3.2.6+
 *
 * Logic lives in:
 *   - app-session-auth.js      (write auth, OTP reauth, role claims)
 *   - app-session-nav.js       (launchApp, buildNav, logout)
 *   - app-session-settings.js  (shift settings, profile, leave quotas, devices)
 *   - app-session-home.js      (Home + My Shift)
 *   - app-session-payment.js   (payment gate, license admin, hooks)
 *
 * index.html loads those modules in order.
 */
(function () {
  if (typeof console !== 'undefined' && console.info) {
    console.info('[ManPower] app-login-session split modules loaded via index.html');
  }
})();
