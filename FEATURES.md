# Mentor — Feature list (short)

Use with `AI_INDEX.md` for file paths. Logic lives in `js/mg-*.js` modules.

## User-facing

- Landing: free modules vs paid 1:1 tracks
- Tracks: Career & AI, Flexible Packaging Expert (rates in `mg-config.js`)
- Package discounts, Razorpay links
- Topic catalog, chat, recordings
- Free modules: Met Train Pro, MR Skill, SupSkill, Time Study, Excel Expert, KPI, Met Cost
- Theme toggle, PWA install
- Shared auth bridge with website / Resume / Man Power

## Mentor (admin) mode — `mg-mentor.js`

- OTP unlock, device remember
- Student list, approve payments, realtime guidance data

## Platform

- Firebase Auth + RTDB
- Modules: config, state, auth, data, ui, pwa, tracks, workspace, mentor, app

## Booking & payments (updated)
- Preferred time window on book
- UTR / Payment ID **required** before submit
- Mentor: Approve, Reject, WhatsApp remind (includes slot + UTR)
