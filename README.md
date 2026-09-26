# Man Power — Manpower Management System

Man Power app (Firebase + PWA). Hosted at **manpower.vkstech.com**.

GitHub repo: **manpower**

## Folder structure (upload as repo root)

```
manpower/
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
│   └── app.css
├── js/
│   ├── app.js
│   ├── firebase-init.js # Firebase + Google Analytics
│   └── polyfill.js
├── manifest.json
├── sw.js
├── icon-*.png
└── README.md
```

## Domain

- Production: `https://manpower.vkstech.com`
- Firebase project (backend): `metpowervks` (unchanged)
- Analytics measurement ID: `G-DK6JFY33ED`

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Do **not** open `index.html` as `file://`.

## GitHub upload

1. Create repo **manpower** (or use existing).
2. Upload this folder contents as the **repo root**.
3. Point domain **manpower.vkstech.com** to GitHub Pages / Firebase Hosting / Cloudflare Pages as you prefer.
4. In Firebase Console → Authentication → Settings → Authorized domains: add `manpower.vkstech.com`.

## Firebase

Config lives in `js/firebase-init.js` (includes `measurementId` for Google Analytics).  
Admin login logs `admin_login` and `login` events to Analytics.
