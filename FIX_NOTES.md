# Mentor desktop PWA install fix (02 Nov 2026)

## Problem
Mentor did not install as a standalone desktop app on laptop; Man Power did.
Toast showed **“Already installed — open from home screen”** while still in a normal browser tab.

## Causes
1. **False “already installed”** — if Mentor is opened inside the **Man Power** PWA window (or any standalone shell), `display-mode: standalone` is true for that window, so Mentor install was blocked.
2. **Manifest not desktop-friendly** — `orientation: portrait-primary`, relative `start_url`/`scope`/`icons`.
3. **Install prompt** sometimes captured late; desktop Chrome needs early `beforeinstallprompt` handling.

## Fixes
| File | Change |
|------|--------|
| `manifest.json` | `start_url`/`scope`/`icons` absolute; `orientation: any`; stable `id: /mentor.html` |
| `sw.js` | Cache bump `v9`; absolute precache; scope-friendly |
| `js/mg-pwa.js` | Don’t block install when opened from Man Power; use deferred prompt from `window.__mentorDeferredPrompt`; clearer desktop guide |
| `mentor.html` | Early install-prompt capture; SW register `/sw.js` scope `/` |

## Deploy
Upload these files to mentor.vkstech.com (same paths), then on the laptop:

1. Open **Chrome or Edge** (normal browser window — **not** the Man Power app window)
2. Go to **https://mentor.vkstech.com/mentor.html**
3. Hard refresh: **Ctrl+Shift+R**
4. Click **Install · iOS / Windows**, or the **install icon in the address bar**
5. Confirm — Mentor should open in its own window and appear in Start menu

If install was dismissed earlier, Chrome may hide the prompt for a while — use address-bar install icon or menu → Install page as app.
