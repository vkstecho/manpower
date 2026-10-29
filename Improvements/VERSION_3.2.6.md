# v3.2.6 — Quality, Accessibility & Sub-app Polish

## Accessibility (A)
- Expanded `js/a11y.js`: skip-to-main link, live region (`mpAnnounce`), modal `role="dialog"` + `aria-modal`
- Schedule grid: arrow-key cell navigation, stronger ARIA labels, MutationObserver re-enhance after rebuild
- Icon-only buttons get `aria-label` from `title` when missing
- Login: improved autocomplete / inputmode / describedby

## Code health (A)
- Single version source remains `js/config.js` → `MP_CFG.APP_VERSION` = **3.2.6**
- Cache-bust query aligned (`?v=300026`)
- Service Worker version + cache name bumped; precache list unchanged (integrity cache kept)

## UX polish (B)
- Resume Builder: Export JSON backup, Import JSON, Clear-all with confirm
- Keyboard: Ctrl/Cmd+S saves progress; print still works with live preview
- Toolbar icons for export / import / clear next to Print

## Performance (D)
- SW network-first HTML + stale-while-revalidate static assets retained
- Lazy script helpers (`ensureXlsx`, `ensureHtml2Canvas`, `ensureTrainData`) already in utils — no regression

## Sub-apps (F)
- **Resume Builder** (ManPower + VKSTech): export/import/clear + a11y-friendly controls
- **Mentor**: identical between packages (synced)
- Learn hub full-screen layers unchanged (stable from 3.2.2–3.2.4)

## Security / commercial (E)
- No client-side admin hashes (existing posture)
- License / hard-admin phone handling unchanged
- Rules docs and claims guides retained

## English UI (B)
- Continues L() preference for EN when language ≠ hi (from 3.2.5)
- Shift labels in `app-core` default English strings for Day/Night/Weekly Off when EN

## Docs
- This file + updated root README summary

See also VERSION_3.2.6b.md for module split, offline queue, i18n, Playwright.
