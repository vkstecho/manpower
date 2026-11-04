# v4.0.9 — Font / background contrast (Light + Dark)

## Problem
Many labels used dark-theme slate (`#94a3b8`, `#64748b`) that stays weak on light backgrounds, and some secondary text was too dim in dark mode. Save bar / sidebar / chips were hard to read in screenshots.

## Fix (css/app.css)
Global contrast pass:

### Dark
- Stronger `--muted` / `--muted2`
- Nav, chips, and hardcoded slate bumped toward readable gray-blue

### Light
- Body/card text forced to `#0f172a`
- Hardcoded `#94a3b8` / `#64748b` / pale grays → `#334155` / `#0f172a`
- Nav / sidebar inactive: `#475569`, active: orange
- Chips: dark text on gray; active white on orange
- Tables, modals, inputs, learn strip, pending cards

### Save / pending bar
- Always light-on-green (`#ecfdf5` / `#86efac` / `#bbf7d0`)
- Saving state stays visible (no washed opacity)

## Deploy
- `css/app.css`
- `schedule.html` (save bar title/sub colors)
- `js/config/config.js`, `sw.js`
