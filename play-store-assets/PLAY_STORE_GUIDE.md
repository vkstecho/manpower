# Man Power — Google Play Store Publish Guide

Your app is a **PWA** (web app). Play Store does not host pure websites; you package it as an **Android app** that opens your live HTTPS site inside a **Trusted Web Activity (TWA)**.

Recommended path: **[PWABuilder](https://www.pwabuilder.com/)** (easiest) or **Bubblewrap** (CLI).

---

## A. Before you start (must-have)

| Requirement | Your status |
|-------------|-------------|
| Live HTTPS URL of the app | e.g. `https://your-domain.com/` (GitHub Pages / Firebase Hosting) |
| Valid `manifest.json` | Present in project |
| Service worker (`sw.js`) | Present |
| Icons 192 + 512 | Present (+ maskable in this folder) |
| Google Play Developer account | **$25 one-time** — [play.google.com/console](https://play.google.com/console) |
| Privacy Policy URL (public page) | Required — use template below or host `privacy.html` |
| Firebase Auth authorized domain | Add your production domain |

### 1. Host the web app on HTTPS
Upload the latest `ManPower` files so they are reachable at a stable URL, e.g.:
`https://metpower.example.com/`

### 2. Update `manifest.json` (if needed)
- `start_url` and `scope` must match your live path
- Prefer absolute icon paths if the app is in a subfolder

### 3. Privacy policy
Host a simple page (example text in `STORE_LISTING.txt`).  
Play Console → App content → Privacy policy → paste that URL.

---

## B. Package the Android app (PWABuilder — recommended)

1. Open **https://www.pwabuilder.com/**
2. Enter your live app URL → **Start**
3. Fix any PWA score issues (icons, manifest, service worker)
4. Click **Package for stores** → **Android**
5. Options to set:
   - Package ID: `com.metpower.app` (or your company id, **cannot change later easily**)
   - App name: `Man Power`
   - Theme color: `#f97316`
   - Background: `#0a0f1a`
   - Display mode: standalone / TWA
   - Signing: let PWABuilder generate a keystore **and download/backup the keystore + passwords**
6. Download the **.aab** (Android App Bundle) — this is what Play Store wants

### Alternative: Bubblewrap (advanced)
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-SITE/manifest.json
bubblewrap build
```
Output: `app-release-bundle.aab`

---

## C. Create the app in Play Console

1. [Google Play Console](https://play.google.com/console) → **Create app**
2. App name: **Man Power**
3. Default language: English (India) or Hindi
4. App / Game: **App**
5. Free / Paid: **Free**
6. Declarations: accept policies

---

## D. Store listing assets (this folder)

Upload from `play-store-assets/`:

| Asset | File | Size |
|-------|------|------|
| App icon | `icon-512.png` | 512 × 512 PNG |
| Feature graphic | `feature-graphic-1024x500.png` | 1024 × 500 PNG (**required**) |
| Phone screenshots | Take 2–8 from a real device | min ~16:9 or phone resolution |
| 7-inch / 10-inch tablet | Optional | |

### How to take screenshots
1. Open the live app on your phone
2. Capture: Login, Schedule, Team, Profile, Reports
3. Crop status bar if you want a cleaner look
4. Upload under **Main store listing → Phone screenshots**

### Texts
Copy from `STORE_LISTING.txt` (short description ≤80 chars, full description).

---

## E. App content / questionnaire (Play Console)

Complete every section or release will stay blocked:

1. **Privacy policy** URL  
2. **App access** — if login required, provide demo credentials for Google reviewers  
3. **Ads** — No (unless you add ads)  
4. **Content rating** — fill questionnaire (Business / Productivity)  
5. **Target audience** — 18+ or all ages as appropriate (workforce tool → typically 18+)  
6. **News app** — No  
7. **COVID** — No  
8. **Data safety** — declare: phone number, name, photos (if any), Firebase analytics if used  
9. **Government apps** — No (unless it is)

---

## F. Release track

1. **Testing → Internal testing** first (add your Gmail as tester)
2. Upload the **.aab**
3. After internal works → **Closed testing** → **Production**
4. Countries: India (or all)
5. Submit for review (first review can take **few days to ~1 week**)

---

## G. Signing & updates

- Keep **keystore + passwords** offline backup forever  
- Losing the keystore = you cannot update the same package id  
- Each update: raise `versionCode`, rebuild AAB, upload to Production

---

## H. Common rejection reasons

| Issue | Fix |
|-------|-----|
| Broken login for reviewer | Provide test phone OTP path or demo account |
| Missing privacy policy | Host public HTTPS page |
| Feature graphic missing | Upload `feature-graphic-1024x500.png` |
| WebView-only policy issues | Use TWA from PWABuilder (not a random WebView wrapper) |
| Permissions unexplained | Only request what you use; document in Data safety |

---

## I. Optional: Firebase / domain for TWA Digital Asset Links

PWABuilder usually gives you an `assetlinks.json` snippet.  
Host it at:
`https://YOUR-DOMAIN/.well-known/assetlinks.json`

Without this, Android may show a browser URL bar inside the app.

---

## Quick checklist

- [ ] App live on HTTPS  
- [ ] Play Developer account ($25)  
- [ ] Privacy policy URL  
- [ ] AAB built via PWABuilder  
- [ ] Icon 512 + Feature graphic uploaded  
- [ ] 2+ phone screenshots  
- [ ] Data safety + content rating done  
- [ ] Internal test install OK  
- [ ] Production submitted  

---

Files in this folder:
- `icon-512.png`, `icon-192.png`, `icon-maskable-512.png`
- `feature-graphic-1024x500.png`
- `adaptive-icon-*.png` (for custom Android builds)
- `STORE_LISTING.txt` — title & descriptions
- `PRIVACY_POLICY_TEMPLATE.html` — host this or adapt
