# v3.2.7 — Conversion landing + publicOffer

## Files touched
- `database.rules.json` — `publicOffer` `.read: true`, admin write
- `FIREBASE_RULES_PUBLIC_OFFER.md` — deploy notes
- `js/public-offer.js` — cache + REST fetch + render (no hardcoded prices)
- `js/app-session-payment.js` — `publishPublicOfferSnapshot` on save + Publish button
- `index.html` — SEO/OG, login layout, sticky bar, deferred heavy scripts
- `js/config.js` — APP_VERSION 3.2.7
- `sw.js` — 3.2.7 + public-offer precache

## Eager scripts (login needs)
polyfill, config, utils, public-offer, i18n_locale, app-core, app-login*, app-session-*, app.js, mp-commercial, a11y

## Deferred after load / mobile focus
i18n_ml, schedule, team*, excel-ops, sched-builder, offline-queue, sched-clipboard/undo/cell-keys

## Manual test checklist
1. **trialDays > 0** published → chip + "Start free trial"
2. **trialDays 0** → no trial chip; CTA "Continue"
3. **annualDiscountPct 0** → no "Save %" chip
4. **paymentEnabled false** → neutral line only, no prices
5. **publicOffer missing** → neutral line, no crash
6. **Offline** → cache if previously loaded; else neutral
7. **Hindi / English** via language picker
8. **360×640** — logo, headline, mobile, primary CTA above fold
9. **Returning user** OTP / device password still works
10. Admin Save Payment / License / Care → auto publish; Publish button works
