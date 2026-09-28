# Man Power — Multi-Industry Team & Shift Management (v2.4.17)

Generic multi-company, multi-team, multi-industry manpower management PWA (Firebase + offline-capable).

Sections, machines, and staffing rules are driven by the **Manager’s Excel upload** — not hard-coded to any single factory or industry.

## What's new in 2.4.17

### Per-template ON/OFF in Shift Settings
- Each WhatsApp template has a **side-by-side ON** toggle (apply this message or not).
- Manager → Team: General shift, Leave, Absent, GP, Holiday, Comp Off — each independent.
- Member → Manager leave/shift toggles unchanged.
- Master **Notify team on Save** still gates all Manager→Team WhatsApp.
- Flags stored on manager shift config (`waShiftEnabled`, `waLeaveEnabled`, …).

---
## What's new in 2.4.16

### All WhatsApp templates editable in Shift Settings
- Profile → **M/c & Shift Settings** now shows **every** team template:
  - Member → Manager: Leave request, Shift change request
  - Manager → Team: General shift, Leave (L), Absent (Ab), Gate Pass (GP), Holiday (H), Comp Off (C/O)
- Master switch **Notify team on Save** + Max GP / month
- Placeholders listed under each box; values save to each manager’s shift config

---
## What's new in 2.4.15

### Multi-select Cancel — faster / more responsive (esp. zoomed)
- Cancel hides the bar **immediately**, then clears cell highlights off the main paint path.
- Class cleanup scoped to `#schedTbl` (not full document).
- Selection highlight no longer uses heavy `box-shadow` (outline + tint only).
- Cancel button uses `touchstart` + larger tap target + `touch-action: manipulation`.
- Service Worker cache: `manpower-v2415`.

---
## What's new in 2.4.14

### Schedule → Team WhatsApp template visible in Shift Settings
- Profile → **M/c & Shift Settings** now shows the full **Schedule Save → Team** message template (`waShiftTemplate`).
- Managers can edit the exact text members receive when shifts are changed and Saved.
- Placeholders documented: `{name}` `{changes}` `{manager}` `{date}`.

### Manager / self device-login notification fix
- When a Manager (or any user) logs in on a **new device**, the **already logged-in device** now reliably receives:
  - In-app toast
  - Browser notification (if permission granted)
  - Pending list refresh + badge pulse
- Notification fan-out uses empObjId, empId, mobile, and live employee record IDs.
- `loginRequests` listener works for **all** logged-in users (not only managers), so self `device_transfer` is never missed.
- Matching also uses mobile number, not only empObjId.

### Continued multi-industry polish
- Section colours/icons from `getSectionMeta` (v2.4.13) remain in place.
- Shift Settings modal uses CSS variables for muted text; key controls have `aria-label`s.
- Service Worker cache: `manpower-v2414`.

---
## What's new in 2.4.13

### Dynamic section colours & icons (multi-industry polish)
- New `getSectionMeta(sec)` — single source of truth for section display.
- Free-form sections from Excel now get **stable, attractive hash-based colours** (no more dull grey).
- Smart icons: Warehouse → 📦, ICU/Ward → 🏥, Line/Production → ⚙️, Quality → 🔬, Dispatch → 🚚, etc.
- Team page, Left-employees view, Excel preview, and Home group chips all use the new meta.

---
## What's new in 2.4.5

### Mobile Save without OTP (Trusted mode fix)
- On phone, closing the PWA clears `sessionStorage` — older trusted checks failed and asked OTP again.
- **Trusted mode** now treats a valid logged-in **SESSION** as enough (same as laptop / MET).
- Opening the app stamps device write-trust flags so Save works after close/reopen.

---
## What's new in 2.4.4

### MET-like Schedule Save on trusted devices
- **Default: Trusted mode** — after one successful login/OTP on this browser, **Save shifts without OTP every time** (laptop-friendly, like MET Power).
- **Strict mode** — optional: require phone OTP before Save when Phone Auth is missing.
- Toggle in **Profile → App Access Security** (Trusted vs Strict).
- RTDB rules for `overrides`, `schedules`, `shiftConfigs`: write allowed when `auth != null` (must **redeploy** `database.rules.json`).

**Security note:** Trusted mode matches MET Power convenience. Anyone with access to the logged-in browser can save schedule data. Use Strict on shared PCs.

---
## What's new in 2.4.3

### Fingerprint login (like MET Power)
- On app open, if fingerprint was set up for this device, show **Touch to Login** (WebAuthn).
- After first OTP login: offer **Fingerprint setup**, then optional **device password** as backup.
- Skip fingerprint → password login if set, else mobile OTP.

### Profile → App Access Security
- Every member/manager can **set / change / remove device password**.
- **Enable / re-setup / disable fingerprint** from Profile.
- Status shown: Fingerprint ON/OFF, Password set or not, biometric hardware available.

---
## What's new in 2.4.2

### Device password (no OTP every time)
- After first OTP/approval login, app offers a **device password**.
- Next logins on the same phone/browser: **password only** (no SMS OTP).
- Password stored only on device (`localStorage`); Forgot password → OTP once.
- Skip password still opens the app; edits work via write-auth cache (same as MET Power).

---
## What's new in 2.4.1

### Modal / mobile fixes
- Profile sheet scrolls correctly (`modal-scroll-body`).
- Edit Profile: scroll body + sticky Save/Cancel.
- Shift Settings rows wrap on narrow phones (no right-side crop).
- CSS fallback: modals without scroll-body still scroll.

### Shift Settings
- Save no longer requires legacy Metalliser/Slitter lists (multi-industry).
- Clearer bilingual title and save toast.

### Profile polish
- Bilingual labels; formatted dates & Indian salary grouping; phone spacing.
- Weekly Off select with Hindi day names; date inputs accept DD/MM and ISO.

---
## What’s new in 2.4.0

### Branding & scope
- Removed all GLS / Polyfilms / fixed “Metalliser department” branding.
- App is industry-agnostic: manufacturing, logistics, services, healthcare, etc.
- Default company id is generic (`default`), not `gls`.

### Multi-industry sections
- Sections come from the Manager Excel “Section” column.
- Display labels, filters, min-staff, and schedule grouping use dynamic section data.
- Legacy fixed keys (M1/M2/S1/S2…) kept only as migration fallbacks.

### P0 clean-up
- Single source of truth for utilities (`js/utils.js`).
- Version strings aligned to **2.4.0**.
- Service Worker cache bumped; integrity cache renamed to `mp-integrity`.
- README & SECURITY updated for multi-tenant use.

### Architecture notes
- Modules: `js/config.js`, `js/utils.js`, `js/firebase-init.js`, `js/app.js`.
- Further feature-by-feature split of `app.js` is ongoing.
- SW precaches tab partials for offline viewing.

## Folder structure

```
manpower/
├── index.html
├── schedule.html, myshift.html, leave.html, reports.html, todo.html,
│   pending.html, team.html, instructions.html, privacy.html
├── css/app.css
├── js/
│   ├── polyfill.js
│   ├── config.js      # shared config (no secrets)
│   ├── utils.js       # escHtml, hashPass, path sanitize
│   ├── firebase-init.js
│   └── app.js
├── sw.js
├── SECURITY.md
└── README.md
```

## Recommended Excel columns (Team upload)

| Column (any of these headers) | Purpose |
|-------------------------------|---------|
| Name / Employee Name          | Full name |
| Emp ID / Employee Code / Code | Unique employee code |
| Mobile / Phone                | 10-digit mobile |
| Section                       | **Section key** (e.g. Line-1, Warehouse, ICU, Store) |
| Machine / MC                  | Optional machine or work-centre |
| Designation / Role            | Job title |
| Responsibility                | Optional duty group |
| Joining Date / DOJ            | Date of joining |
| Date of Birth / DOB           | Optional |
| Weekly Off / WOff             | Optional |
| Salary                        | Optional |

Sections discovered from the Excel become the filters, colour groups, and min-staff rows automatically.

## Firebase setup after deploy

1. Create `adminAuth/{username}` entries (hash = SHA-256 of `username:password:MP_ADMIN`). See `SECURITY.md`.
2. Create `settings/license` with `validTill` and optional `unlockHashes`.
3. Keep RTDB rules that deny public write to `adminAuth` and `settings/license`.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Do **not** open as `file://`.

## License / contact

Configure admin phones and manager invite code via Firebase `settings` or `js/config.js` (non-secret values only).
