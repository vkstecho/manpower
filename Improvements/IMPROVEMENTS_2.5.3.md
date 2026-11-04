# 2.5.3 — Lightning-fast schedule Save → WhatsApp

## Problem
Save waited for: OD cleanup (sequential), role-node sync, auto C-Off rules, WA settings fetch, **then** sequential in-app `fbPush` for every employee — only after all that did WhatsApp open.

## Fix
1. **Critical path only:** `_ensureWriteAuth` (fast) → single `fbUpdate('overrides', updates)` → clear pending → toast → `renderSchedule`.
2. **WhatsApp immediately** from local emp/config cache (`_buildShiftSaveWaQueue`) — no network before `openWA` / sequential WA modal.
3. **Background (setTimeout 0):** OD cleanup in `Promise.all`, auto C-Off, WA settings refresh, parallel in-app notifications.
4. **Write auth:** if phone/elevated auth already active within 15 min, return true instantly; role sync is non-blocking (max once/60s).

## Expected UX
Save → almost immediate “saved” toast → WhatsApp open/modal right away. In-app bells may arrive a moment later.

## Deploy
Host 2.5.3 assets and hard-refresh SW.
