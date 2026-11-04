# v4.0.9 — Contrast: toast & fonts vs background

## Issue
Pending-change toast ("… pending — press Save") and some secondary labels had poor font-on-background contrast, especially when light-mode rules forced dark text onto a still-dark toast panel.

## Fix
- Force toast to dark panel (`#0f172a`) + light text (`#f8fafc`) in **both** themes.
- Strengthen muted / secondary text on dark panels.
- Ensure `.shc` (shift cells), weekly-off cells, modal body, placeholders, and learn-bar remain readable in dark and light modes.
- Appended final contrast block at end of `css/app.css` so it overrides earlier conflicting rules.

## Files
- `css/app.css`
