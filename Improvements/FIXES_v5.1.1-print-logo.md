# v5.1.1 — Schedule print uses VKS Tech logo

## Problem
Printed schedule JPEG (html2canvas) hid the logo because:
- Image path was `vkslogo512.png` (root) while file lives at `assets/vkslogo512.png`
- `onerror` set `display:none`, so the mark vanished in the export

## Fix
1. `_loadVksLogoDataUrl()` tries `assets/vkslogo512.png` first (then root fallbacks)
2. Print header + footer embed the logo as a **data URL** so capture never depends on relative path/CORS
3. Fallback `src` on error: `assets/vkslogo512.png` (no longer hide the img)
4. Service Worker precache: `./assets/vkslogo512.png`
5. Root copy of logo kept as deploy fallback

## File
- `js/team/app-team-print-learn.js`
- `sw.js`, `js/config/config.js` → **5.1.1**
