# Mentor – One-to-One Guidance (VKS Tech)

Professional 1:1 mentorship PWA: **Career & AI** and **Flexible Packaging Expert** tracks, plus free plant modules.

**Firebase:** Same family as Man Power (`metpowervks` / mentor paths below).

## Entry

## Public URLs (important)

| URL | File served |
|-----|-------------|
| `https://mentor.vkstech.com/` | **`index.html`** (marketing landing) |
| `https://mentor.vkstech.com/mentor.html` | Full app (login, booking, workspace) |
| `https://mentor.vkstech.com/landing/` | Redirects to `/` (avoid duplicate index names) |

Do **not** rely on `landing/index.html` as the homepage — hosts always prefer root `index.html`.

| File | Role |
|------|------|
| `index.html` | Light marketing / module cards |
| `mentor.html` | Main app (login, catalog, booking, workspace, mentor mode) |

Deploy folder as `/Mentor/` on manpower.vkstech.com or vkstech.com.

## JS modules (load order — do not reorder)
1. `js/mg-config.js` — rates, tracks, topics, slots, Razorpay links  
2. `js/mg-state.js`  
3. `js/mg-auth.js`  
4. `js/mg-data.js`  
5. `js/mg-ui.js`  
6. `js/mg-pwa.js`  
7. `js/mg-tracks.js` — booking, UTR, preferred time, payment claim  
8. `js/mg-workspace.js` — chat, recordings  
9. `js/mg-mentor.js` — approve/reject, WhatsApp remind, student list  
10. `js/mg-app.js` — boot & events  

AI maps: `AI_INDEX.md`, `AI_README.md`, `FEATURES.md`.  
Legacy monolith backup (not loaded): `archive/guidance.monolith.bak.js`.

## Booking flow
1. Student picks track + hours + focus + **preferred time window**  
2. Pay via Razorpay link  
3. Enter **UTR / Payment ID** (required) → Submit  
4. WhatsApp notify mentor  
5. Mentor **Approve** (unlock) or **Reject**  
6. Session → mentor adds YouTube recording  

## Mentor access
Login mobile **8929397949** → Mentor OTP (key) → Refresh students → Payment history → Approve / WhatsApp.

## Firebase paths
- `mentor_guidance/{mobile}`
- `mentor_guidance_index/{mobile}`
- `mentor_settings/tracks` (optional rate overrides)

Deploy matching `database.rules.json`.

## Free modules
- `Met_Train_Pro/`, `MR_Skill/`, `modules/*.html` (Excel Expert includes quick yield/waste/roster formulas)
