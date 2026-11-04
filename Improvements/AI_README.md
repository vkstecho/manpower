# VKS Tech — AI-Friendly Codebase Guide

**Purpose:** Any AI (or human) can locate and edit **one feature** by reading only the mapped file(s), without loading the whole app.

## How an AI should work on these apps

1. Open **only** this file + the relevant app’s `AI_INDEX.md`.
2. Find the feature name in the Feature Map table.
3. Open **only** the listed file(s). Do not read sibling modules unless the map says “depends on”.
4. After edit, update the feature’s row in `AI_INDEX.md` if paths or line ranges changed.

## Apps in this package

| App | Folder | Entry | AI map |
|-----|--------|-------|--------|
| Man Power | `manpower/` | `index.html` + `js/` | [manpower/AI_INDEX.md](manpower/AI_INDEX.md) |
| Mentor | `mentor/` | `mentor.html` + `js/guidance.js` | [mentor/AI_INDEX.md](mentor/AI_INDEX.md) |
| VKS Tech website | `website/` | `index.html` + `js/core/app.js` | [website/AI_INDEX.md](website/AI_INDEX.md) |

## Token-saving rules (for AI tools)

- Prefer feature map over full tree listing.
- Never load all `js/*.js` at once; use the map.
- Large files have **section line ranges** — read only that range when possible.
- Config / rates / admin phones live in dedicated config files — change there first.

## Recommended future folder layout (optional restructure)

See `_shared/RECOMMENDED_FOLDERS.md`. Applying it requires updating HTML script tags and service-worker precache lists.

## Shared concepts across apps

| Concept | Man Power | Mentor | Website |
|---------|-----------|--------|---------|
| Mobile OTP login | `js/app-login*.js` | `guidance.js` OTP section | N/A (links out) |
| Hard-admin phones | `js/config/config.js` | `MENTOR_MOBILE` in guidance.js | — |
| Pricing / offer | `js/commercial/public-offer.js` + RTDB | tracks in guidance.js | marketing copy only |
| Firebase project | metpowervks (typical) | mentor-vkstech (or shared) | hosting only |
| PWA / SW | `sw.js` | `sw.js` | optional |
