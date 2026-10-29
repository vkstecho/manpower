# Man Power — Playwright smoke tests (v3.2.6)

## What these cover
- Login shell renders (mobile field visible)
- Accessibility attributes present on login
- Offline schedule queue API available
- Schedule-related globals load without crash

## What they do **not** cover (needs real Firebase + OTP)
- Full OTP login
- Live schedule save to RTDB
- Manager approve flows

## Run

```bash
cd tests/playwright
npm install
# Serve the app root (parent of js/, index.html):
#   npx serve ../.. -p 4173
# Or set MP_BASE_URL to a deployed host:
#   MP_BASE_URL=https://manpower.example.com npm test
npm test
```

For authenticated flows, set env vars (future):
- `MP_TEST_MOBILE`
- `MP_TEST_OTP` (or use Firebase emulator)
