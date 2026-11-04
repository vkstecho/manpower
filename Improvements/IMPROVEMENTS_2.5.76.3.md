# 2.5.76.3 — Auto 30-day pay-until for new mobiles

## Behaviour
For **every new mobile number** (first time payment fields are empty):

1. On login / payment hydrate
2. If no `paymentPaidUntil` / `paidUntil` and trial not already granted
3. Set **paidUntil = today + 30 days** (valid through end of that day)
4. Save to `paymentStatus/{phone}` and best-effort `mobileUsers/{phone}`
5. Flags: `paymentTrialGranted: true`, `paymentTrialDays: 30`, `firstLoginAt`

## Does not
- Overwrite Admin-set paid-until dates
- Re-grant trial after expiry (trial flag stays)
- Apply to Admin / hard-admin phones

## Prior fixes in this line
- app.js syntax, STRICT rules, todo manager scope, reports manager scope, Home display-error harden
