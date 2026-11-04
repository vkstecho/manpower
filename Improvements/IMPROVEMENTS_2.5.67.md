# 2.5.67 — Laptop reCAPTCHA immediate + faster OTP

## Changes
1. **Desktop:** visible reCAPTCHA shown as soon as login step opens (not after Send)
2. **Warm-up:** widget pre-renders in background while user types the number
3. **Desktop Send OTP:** only visible path — no 15–20s invisible wait
4. **Faster:** anonymous signOut capped 800ms; pre-OTP mobileUsers fetch max 2s
5. Toast: “Tick the security checkbox — OTP sends right away”

## User flow (laptop)
1. Open login → yellow hint + checkbox appear under mobile field
2. Type number → tick checkbox → Send OTP
3. SMS should send without long “Sending…” hang
