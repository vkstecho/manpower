/**
 * app-team-import.js — SPLIT in v3.2.6+
 *
 * This file is intentionally minimal. Logic lives in:
 *   - app-team-import-core.js   (bulk import, limits, parse helpers)
 *   - app-team-emp-forms.js     (add/edit employee forms)
 *   - app-team-excel-ops.js     (Excel upload / team ops)
 *   - app-sched-builder.js      (Schedule Builder, Auto Gen, coverage, save)
 *
 * index.html loads those modules in order. Keep this file for cache-bust
 * compatibility if any external bookmark still references app-team-import.js.
 */
(function () {
  if (typeof console !== 'undefined' && console.info) {
    console.info('[ManPower] app-team-import split modules loaded via index.html');
  }
})();
