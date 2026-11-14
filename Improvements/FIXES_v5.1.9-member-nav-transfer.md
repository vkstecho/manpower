# v5.1.9 — Member calendar UX + registered-mobile transfer

## My Shift → View/Edit member
- Month **‹ ›** arrows directly above the selected member calendar (no need to scroll to own calendar).
- **Single tap** on a member day opens the shift picker for managers (double-tap was unreliable on mobile).

## Already-registered mobile (major)
- `_findPhoneConflict` now scans **full employee cache + mobileUsers**, not only the current team (root cause of adding another Manager by number).
- On conflict, modal explains case:
  - Manager with team
  - Manager individual
  - Member on another team
  - Already on same team
- Manager can **Send transfer request** → `teamTransferRequests` + notification.
- Accept moves person to new manager as member; flags old shifts private to target + new manager.
