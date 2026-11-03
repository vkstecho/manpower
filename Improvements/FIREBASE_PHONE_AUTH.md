# Firebase Phone Auth (Mentor OTP + Resume OTP)

SMS OTP is **Firebase Authentication**, not Realtime Database rules.

## Required in Firebase Console
1. Authentication → Sign-in method → **Phone** enabled
2. Authentication → Settings → **Authorized domains** must include:
   - `manpower.vkstech.com`
   - `vkstech.com`
   - `www.vkstech.com`
   - `localhost` (dev)
3. Blaze plan / SMS quota available for India numbers

## App behaviour (v3.2.17)
- If admin is already signed in with Firebase Phone as +91 8929397949 (or parent Man Power session), Mentor unlock **skips** a second SMS.
- Otherwise OTP modal opens first; complete reCAPTCHA if shown; then SMS is sent.

## Database rules
- `resume_builder/$mobile` and `mentor_guidance/$mobile` require `auth != null` and matching phone token for read/write.
- Redeploy `database.rules.json` after upload.
