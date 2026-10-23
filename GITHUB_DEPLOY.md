# Deploy Man Power v3.0.1 on GitHub

## Play Store vs GitHub
- **Play Store app** only needs an update if the *native shell* changed (package name, icons, offline wrapper).
- Your **login, teams, shifts** live in **Firebase** + files on **GitHub Pages** (or your host).
- Uploading v3 to GitHub updates the **web app** users open. **Not updating Play Store does not cause "new user" login.**

Logout / "new user" after upload is usually:
1. Browser/PWA cleared cache or different URL (www vs non-www)
2. `mobileUsers/{10-digit}` missing or not `status: approved` in Firebase
3. Network/permission so profile could not be read

## Upload to GitHub
1. Extract this zip.
2. Copy **all** files into your repo root (same place as previous `index.html`).
3. Commit and push to the branch GitHub Pages uses (often `main` or `gh-pages`).
4. Wait 1–2 minutes for Pages to update.
5. Open the **exact same URL** users always used.

## After deploy — user login
1. Same mobile number as before (10 digits).
2. OTP → should restore **approved** managers/members from Firebase.
3. If role select (Manager/Member) appears while Firebase still has `approved`, check network and Firebase rules.

## Do NOT
- Do not delete Firebase `mobileUsers` data
- Do not change Firebase project config in `js/firebase-init.js` unless intentional
- Do not require Play Store update for this web fix
