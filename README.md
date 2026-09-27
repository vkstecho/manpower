# MET Power — Manpower Management System

GLS Polyfilms metalliser department app (Firebase + PWA-ready).

## Folder structure (upload these to GitHub)

```
met-power/
├── index.html           # App shell (login, header, home, modals)
├── schedule.html        # Schedule tab partial
├── myshift.html         # My Shift tab partial
├── leave.html           # Leave tab partial
├── reports.html         # Reports tab partial
├── todo.html            # To-Do tab partial
├── pending.html         # Pending approvals tab partial
├── team.html            # Team tab partial
├── instructions.html    # Instructions tab partial
├── css/
│   └── app.css          # All styles
├── js/
│   ├── app.js           # Main application logic
│   ├── firebase-init.js # Firebase SDK init
│   └── polyfill.js      # Small browser polyfills
├── .gitignore
└── README.md
```

## How sections work

`index.html` loads the other `*.html` files at runtime via `fetch` and injects them into `#mainContent`.  
Keep all HTML files in the **same folder** (repo root).

## Run locally

```bash
# any static server
python3 -m http.server 8080
# open http://localhost:8080
```

Do **not** open `index.html` as `file://` — section loading will fail.

## Assets you still need to add

Copy from your existing deploy (same names, same folder):

- `manifest.json`
- `sw.js` (service worker)
- `MP-logo.svg`
- `icon-192.png`
- `icon-180.png`
- `vkslogo512.png` (if used)

## Firebase

Config lives in `js/firebase-init.js`.  
Project: `metpowervks` (Asia Southeast RTDB).

## GitHub upload

1. Create a new repo on GitHub (e.g. `met-power`).
2. Upload this entire `met-power` folder contents as the repo root.
3. Enable GitHub Pages (Settings → Pages → Deploy from `main` / root) **or** host on Firebase Hosting / Netlify / Cloudflare Pages.
