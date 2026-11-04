# v4.0.10 — FP Job → PackLink

## Change
- Replaced **FP Job** with **PackLink** everywhere in Learn & Grow.
- URL: `https://fpjob.vkstech.com/` → `https://packlink.vkstech.com/`
- Icon: real PackLink icon from `https://packlink.vkstech.com/Assets/icon-192.png` → `assets/packlink-icon.png`
- Button id: `learnBtnPacklink`
- Detection still accepts legacy "FP Job" / fpjob titles/URLs so old bookmarks keep working.
- Login strip text: `Resume · Mentor · PackLink · AI tools`

## Files
- `js/team/app-team-print-learn.js`
- `app.html`
- `assets/packlink-icon.png` (new)
- `assets/fpjob-icon.png` (removed)
- `js/config/config.js`, `sw.js` (version 4.0.10)
