# 2.5.76.8 — Shift times 24h, G shift times, Share App Play Store link

## 1. 24-hour clock for shift time editing
- Shift & Min Staff time fields no longer use `type="time"` (which followed device 12h/AM-PM).
- Uses **HH:MM** text inputs (24-hour). Invalid values highlight red on blur.

## 2. G (General) shift times
- **G** is configurable with start/end like D, N, A, B, C in Work shifts.
- Default **08:00–20:00** (editable).
- Schedule bottom legend shows **G** times the same way as D/N/A/B/C when set.
- Auto Schedule rotation still uses only D/N/A/B/C (G is timed, not in rotate set).

## 3. Share App → Play Store link
- Share App button default URL:  
  `https://play.google.com/store/apps/details?id=com.vkstech.manpower`
- No longer shares the current web origin path.

## 4. Admin can change Share link
- Admin profile → **Share App Link**
- Saved to Firebase `settings/shareAppLink`
- Applies for all users on next load / share tap

## Deploy
1. Publish this package (hosting / static files).
2. Hard refresh or wait for SW `2.5.76.8`.
3. Manager: Shift & Min Staff → set G times → Save.
4. Admin (optional): Profile → Share App Link → set custom URL if needed.
