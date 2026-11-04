# Recommended folder structure (all three apps)

Goal: **one feature ≈ one folder or one file**, so an AI opens 1–2 files max.

## Principles

1. **Feature folders** over “all js in one pile”.
2. **AI_INDEX.md at app root** is the only required entry doc.
3. **Config isolated** — versions, phones, rates, Firebase keys never mixed into UI files.
4. **HTML pages thin** — markup only; behavior in feature JS.
5. **Docs separate** — changelogs, security, deploy under `docs/`.
6. Do not move files in production until:
   - Every `<script src>` path is updated
   - `sw.js` precache list is updated
   - Relative asset paths in CSS/HTML still resolve

---

## Man Power (target)

```
ManPower/
├── AI_INDEX.md
├── README.md
├── config/
│   ├── config.js
│   └── firebase-init.js
├── core/
│   ├── app-core.js
│   ├── app.js
│   ├── utils.js
│   ├── polyfill.js
│   └── a11y.js
├── auth/
│   ├── app-login.js
│   ├── app-login-device.js
│   ├── app-login-session.js
│   └── app-session-auth.js
├── session/
│   ├── app-session-home.js
│   ├── app-session-nav.js
│   ├── app-session-settings.js
│   └── app-session-payment.js
├── team/
│   ├── app-team.js
│   ├── app-team-emp-forms.js
│   ├── app-team-import.js
│   ├── app-team-import-core.js
│   ├── app-team-excel-ops.js
│   └── app-team-print-learn.js
├── schedule/
│   ├── app-schedule.js
│   ├── app-sched-builder.js
│   ├── sched-cell-keys.js
│   ├── sched-clipboard.js
│   ├── sched-undo.js
│   └── sched-offline-queue.js
├── commercial/
│   ├── mp-commercial.js
│   └── public-offer.js
├── i18n/
│   ├── i18n_locale.js
│   └── i18n_ml.js
├── pages/          # all *.html
├── resume-builder/
├── assets/  css/  functions/  tests/
├── docs/           # SECURITY, DESIGN_TOKENS, Improvements, FIREBASE_*.md
├── sw.js
├── manifest.json
├── database.rules.json
└── storage.rules
```

---

## Mentor (target)

```
mentor-app/
├── AI_INDEX.md
├── README.md
├── DEPLOY.md
├── index.html              # marketing landing
├── mentor.html             # app shell
├── config/
│   └── config.js           # MENTOR_MOBILE, rates, tracks defaults
├── js/
│   ├── auth-mobile.js
│   ├── data.js
│   ├── tracks.js
│   ├── booking.js
│   ├── chat.js
│   ├── mentor-admin.js
│   ├── pwa-ui.js
│   ├── ui.js
│   └── guidance-app.js     # boot only
├── css/
│   └── guidance.css
├── modules/                # free HTML wrappers
├── Met_Train_Pro/
├── MR_Skill/
├── assets/  icons/
├── database.rules.json
├── manifest.json
└── sw.js
```

---

## Website (target)

```
vkstech-website/
├── AI_INDEX.md
├── pages/
│   ├── index.html
│   ├── blog.html
│   ├── people.html
│   ├── youtube.html
│   ├── mentor.html
│   ├── resume.html
│   └── admin.html
├── js/
│   ├── tracking.js
│   ├── i18n.js
│   ├── nav.js
│   ├── calculators.js
│   ├── blog.js
│   └── app.js              # boot
├── css/
│   ├── main.css
│   └── app-landing.css
├── seo/
│   ├── robots.txt
│   └── sitemap.xml
├── assets/
├── firebase.json
├── _redirects
└── DEPLOY.md
```

---

## Minimum viable improvement (no path breakage)

If you cannot restructure folders yet, still do this:

1. Keep **AI_INDEX.md** at each app root (already drafted in this package).
2. Add a one-line header comment at the top of every large JS file:
   `// FEATURE: <name> | SEE AI_INDEX.md`
3. In monoliths (`guidance.js`, large Man Power files), keep clear `// ========== Section ==========` banners (Mentor already does this).
4. Never put rates/phones only in HTML — always in config JS or Firebase.

This alone cuts AI token use by letting the model skip unrelated files.
