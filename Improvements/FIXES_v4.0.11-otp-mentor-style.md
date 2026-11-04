# v4.0.11 — OTP: Mentor-style visible reCAPTCHA on mobile

## Problem
Mobile OTP used invisible reCAPTCHA first. On many Android Chrome / TWA / WebView sessions this hung on “Sending…” or failed silently before falling back.

## Fix (Mentor pattern)
- Mobile: **visible reCAPTCHA first** (checkbox tappable)
- Fixed bottom white card host on small screens (same UX as Mentor)
- Invisible only as last-resort fallback
- Desktop path unchanged (visible already)

## File
- `js/auth/app-login-device.js` (`_fbSendPhoneOtp`)
- Version `4.0.11` in config + sw.js
