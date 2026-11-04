# v3.2.8 fixes

## Learn & Grow empty (Resume / Mentor missing)
- Cause: main button list stayed `display:none` after a section open, and/or `app-team-print-learn.js` deferred past first open.
- Fix: `openLearnScreen` always restores `#learnMainButtons`, hides section views, calls `injectLearnModuleButtons` + custom buttons.
- Script loaded **eagerly** (not deferred).

## Publish trial days stuck at 21
- Cause: publish used **stale** `_appLicenseCache` when freeTrialDays was already set (did not re-fetch after typing 15 without relying on cache).
- Fix: Publish **always** reloads payment, appLicense, customerCare from Firebase before writing `publicOffer`.

## Publish → home
- Publish button closes modal and `goTab('home')`.

## Landing
- Max 4 price chips (+N more)
- Stronger text colors; sticky bar only after scroll on phone
- Logo / brand title polish
