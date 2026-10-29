# v3.2.6b — Module split, offline queue, i18n, sub-app polish, Playwright

## 1. Module split (maintainability)
### From `app-team-import.js` (~8611 lines)
| File | Responsibility |
|------|----------------|
| `app-team-import-core.js` | Bulk import, limits, parse helpers |
| `app-team-emp-forms.js` | Add / edit employee forms |
| `app-team-excel-ops.js` | Excel upload & team ops |
| `app-sched-builder.js` | Schedule Builder, Auto Gen, coverage, save |
| `app-team-import.js` | Thin stub (compat) |

### From `app-login-session.js` (~6067 lines)
| File | Responsibility |
|------|----------------|
| `app-session-auth.js` | Write auth, OTP reauth, role claims |
| `app-session-nav.js` | launchApp, buildNav, logout |
| `app-session-settings.js` | Shift settings, profile, quotas, devices |
| `app-session-home.js` | Home + My Shift |
| `app-session-payment.js` | Payment gate, license admin, hooks |
| `app-login-session.js` | Thin stub (compat) |

`index.html` + `sw.js` precache updated for new modules.

## 2. Offline-first schedule edit queue
- New `js/sched-offline-queue.js`
- Queues cell edits when offline; dedupes emp+date; badge UI; auto-flush on `online`
- APIs: `enqueueScheduleEdit`, `flushOfflineQueue`, `queueScheduleIfOffline`, `MP_OFFLINE_QUEUE`
- Integrate into save paths with `queueScheduleIfOffline(empId, date, shift, monthKey)` when desired

## 3. English string audit
- Converted 16 Hindi-only `toast()` calls in `app.js` to proper `L(hi, en)` pairs
- Confirmed `L()` already prefers English when language ≠ `hi`

## 4. Met Train / MR Skill UX polish
- Skip-to-content links
- `:focus-visible` outlines
- `prefers-reduced-motion` respect (Met Train CSS)

## 5. Playwright smoke tests
- `tests/playwright/` — login shell + offline queue API presence
- See `tests/playwright/README.md` for run instructions

## Deploy notes
1. Upload **all** new `js/*.js` modules (do not keep only the stubs).
2. Hard-refresh / bump SW so clients drop old monolithic caches.
3. Optional: wire `queueScheduleIfOffline` into schedule cell commit in `app-schedule.js` / builder save.

## Mentor realtime + Resume cloud (follow-up)

### Mentor message lag — root cause
- Chat used one-shot `get` / full-object `set` only — **no `onValue` listener**.
- Mentor and student only saw new messages after manual refresh / student switch.
- Full-node overwrite also risked race (last write wins).

### Fix
- `MentorFB.listen(path, cb)` using Firebase `onValue`
- `startRealtimeFor(mobile)` on login + student switch
- Chat merge by message `id` so concurrent writes don't drop messages

### Resume Builder
- **4 templates:** Executive, Minimalist, Creative, Two-Column
- Mobile OTP login (same `metpowervks` Firebase) + Save/Load cloud at `resume_builder/{mobile}`

### Firebase rules (add if missing)
```
"resume_builder": {
  "$mobile": {
    ".read": true,
    ".write": true
  }
}
```
Tighten later to auth.uid / phone claims as with other paths.
