# Man Power v4.0.3 — Password contrast + Install always in browser

## Password set / login labels still hard to read
**File:** `js/auth/app-login-device.js`

- Labels forced to **white** with `-webkit-text-fill-color:#ffffff !important` and `opacity:1`
- Slightly larger (12px)
- "Not now → Open App" border/background strengthened, text `#f1f5f9`

## Install button missing after login
**Cause:** `localStorage.mp_pwa_installed` stayed `1` after testing install, so Install stayed hidden even in a normal browser tab.

**Fixes:**
- `app.html` early script + `js/commercial/mp-commercial.js`:
  - Do **not** sticky-write the installed flag from casual detection
  - In `display-mode: browser`, **clear** stale `mp_pwa_installed`
  - Always `display:flex` for `#pwaInstallBtn` when not installed
- Header control is now an orange **📲 Install** chip (text, not icon-only) next to Share
- CSS: `#pwaInstallBtn{display:flex!important}` unless `html.mp-installed`

## Version
`APP_VERSION` / `SW_VERSION` → **4.0.3**

## Deploy
Upload:
- `js/config/config.js`, `sw.js`
- `js/auth/app-login-device.js`
- `app.html`
- `js/commercial/mp-commercial.js`
- `css/app.css`

After deploy: hard refresh (Ctrl+Shift+R). If Install still missing once, DevTools → Application → Local Storage → delete `mp_pwa_installed`.
