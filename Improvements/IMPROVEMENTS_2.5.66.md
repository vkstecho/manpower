# 2.5.66 — Laptop OTP stuck on "Sending…"

## Problem
Desktop/laptop: Send OTP stayed on **Sending…**, no SMS, no error.

## Cause
Invisible Firebase reCAPTCHA often never completes on desktop (blocked / hung). Button was not always restored.

## Fix
1. **Desktop:** try **visible checkbox** reCAPTCHA first (shown under the mobile field)
2. **Timeout:** invisible 20s, visible 90s — then clear error instead of infinite wait
3. **Button:** always restore Send OTP in `finally`
4. Wait up to ~4s if Firebase Auth module is still loading

## User tips if still no SMS
- Tick the yellow **security checkbox** on the login card
- Firebase Console → Authentication → Sign-in method → **Phone** enabled
- Authorized domains include your hosting domain (and localhost for local test)
- Billing / SMS quota not exceeded
- Try phone once; laptop needs recaptcha more often
