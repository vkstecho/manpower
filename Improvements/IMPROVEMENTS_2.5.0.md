# Improvements 2.5.0 — Bundle / lazy-load

Login flow unchanged.

## Lazy-load (first paint)

| Asset | Before | After |
|-------|--------|--------|
| html2canvas CDN | Eager in `index.html` | On demand via `ensureHtml2Canvas()` before export/print |
| `train-data.js` (~25KB) | Eager script | `ensureTrainData()` when training cards render |
| XLSX CDN | Already on demand in schedule | Unified via `ensureXlsx()` |

Helpers in `js/utils.js`: `loadScriptOnce`, `ensureHtml2Canvas`, `ensureXlsx`, `ensureTrainData`.

## Minify

- Main app modules minified with **terser** (`--keep-fnames`, no top-level name breakage)
- CSS conservative minify (~184KB → ~150KB)
- Approximate JS savings on core modules: **~400KB+** raw (e.g. app-team 565→444KB, app-login 405→328KB, app-core 140→99KB)

`i18n_ml.js` remains large (mostly translation strings) — still required for multi-language.

## SW

- Version **2.5.0**
- `train-data.js` still precached for offline training after first fetch

## Still pending

5. Automated tests + schedule a11y + App Check / Cloud Function for claims minting

## Deploy

Host 2.5.0 assets, hard-refresh clients. Smoke-test: login, schedule export image, Excel upload, training hub cards.
