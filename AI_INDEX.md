# Mentor — AI Feature Map (modular)

**Read this file first.** Then open **only** the file listed for the feature you are changing.

App root: `mentor-app/`

Runtime is split into feature modules under `js/mg-*.js` (loaded in order from `mentor.html`). Shared namespace: `window.MG`. Shared state: `MG.state`.

---

## 1. What this app does

**One-to-one mentorship** (Career & AI, Flexible Packaging Expert) with Razorpay booking, chat/recordings, mentor OTP mode, student payment approval, plus **free packaging training modules**. Firebase Auth + RTDB. PWA-capable.

---

## 2. Feature → file map

| Feature / section | File | Notes |
|-------------------|------|-------|
| **Rates, tracks, topics, free-module list** | `js/mg-config.js` | `DEFAULT_TRACKS`, `TOPICS`, `FREE_PACK_MODULES`, phones, Razorpay |
| **Runtime state + DOM `$`/`$$`** | `js/mg-state.js` | `MG.state.*` |
| **Mobile detect + site auth bridge** | `js/mg-auth.js` | Man Power parent, localStorage shared auth |
| **Firebase data layer** | `js/mg-data.js` | `mentor_guidance`, load/save, realtime, chat merge |
| **Theme, toast, catalog UI, free pack render** | `js/mg-ui.js` | `renderCatalog`, `renderFreePackSection` |
| **PWA install / share / Play Store** | `js/mg-pwa.js` | |
| **Track select, pricing override, booking modal** | `js/mg-tracks.js` | packages, confirm payment |
| **Workspace, recordings, chat** | `js/mg-workspace.js` | |
| **Payment history, mentor OTP, student admin** | `js/mg-mentor.js` | approve pay, student switch |
| **Init, login OTP UI, events, boot** | `js/mg-app.js` | `init`, `bindEvents`, DOMContentLoaded |
| **Legacy stub** | `js/guidance.js` | Info only — not used for logic |
| **Styles** | `css/guidance.css` | |
| **Shell HTML** | `mentor.html` | script order at bottom |
| **Landing** | `index.html` | marketing cards |
| **RTDB rules** | `database.rules.json` | |
| **PWA** | `manifest.json`, `sw.js` | SW precaches all `mg-*.js` |

### Free training modules (separate)

| Module | Path |
|--------|------|
| Met Train Pro | `Met_Train_Pro/` |
| MR Skill | `MR_Skill/mr_skill.html` |
| Wrappers | `modules/*.html` |

---

## 3. "I want to change X"

| Goal | Open only |
|------|-----------|
| Hourly rates / track packages / Razorpay link | `js/mg-config.js` |
| Topic catalog content | `js/mg-config.js` (`TOPICS`) |
| Free module links | `js/mg-config.js` (`FREE_PACK_MODULES`) |
| Chat / recordings behavior | `js/mg-workspace.js` |
| Booking / payment confirm | `js/mg-tracks.js` |
| Mentor OTP / student list / approve | `js/mg-mentor.js` |
| Login OTP UI / boot | `js/mg-app.js` |
| Firebase paths / merge logic | `js/mg-data.js` |
| Styles | `css/guidance.css` |

---

## 4. Script load order (do not reorder)

1. `mg-config.js`
2. `mg-state.js`
3. `mg-auth.js`
4. `mg-data.js`
5. `mg-ui.js`
6. `mg-pwa.js`
7. `mg-tracks.js`
8. `mg-workspace.js`
9. `mg-mentor.js`
10. `mg-app.js`

---

## 5. Token tip

Do **not** load every `mg-*.js`. Use this map and open one module. Config + topics live only in `mg-config.js`.


## Recent improvements
| Feature | File |
|---------|------|
| Required UTR / Payment ID | `js/mg-tracks.js` `confirmPayment`, `mentor.html` |
| Preferred time window | `mg-config.js` `PREFERRED_SLOT_OPTIONS`, booking modal |
| Reject payment + WhatsApp remind | `js/mg-mentor.js` |
| Excel Expert mini-lessons | `modules/excel_expert.html` |
| Monolith backup archived | `archive/guidance.monolith.bak.js` |


## Admin rates & Razorpay (8929397949)
| UI | `Rates` button → modal in `mentor.html` |
| Save | `js/mg-workspace.js` `savePricingAdmin` → `mentor_settings/tracks` |
| Fields per track | hourlyRate, paymentLink, packageDisc 3h/5h, topics |
| Booking uses | `mg-tracks.js` `updatePayLink` + `calcBookingAmount` |

## Session checklist
| `renderSessionChecklist` | `js/mg-workspace.js` · host `#sessionChecklist` |

## Marketing landing
| `landing/index.html` | Public page; rates from Firebase if public read allowed |


### Entry files
- **Marketing home (domain root):** `index.html`
- **App shell:** `mentor.html`
- `landing/index.html` → redirect to `/` only
