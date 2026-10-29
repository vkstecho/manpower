# publicOffer — public landing snapshot (v3.2.7)

## Why
Logged-out landing page cannot read `settings/*` (`auth != null`).  
`publicOffer` is a **sanitized snapshot** readable anonymously for trial/pricing/refund copy only.

## Rules
```
"publicOffer": {
  ".read": true,
  ".write": <same admin-only condition as settings/license>,
  ".validate": numbers/booleans + updatedAt only
}
```

## Shape (written by app, never hand-typed with secrets)
```json
{
  "paymentEnabled": true,
  "trialDays": 30,
  "plans": [{ "name": "₹99", "monthly": 99 }],
  "annualDiscountPct": 17,
  "refundDays": 7,
  "supportWhatsApp": "918929394920",
  "supportEmail": "CareMP@vkstech.com",
  "updatedAt": "2026-10-29T00:00:00.000Z"
}
```

No phone lists, UIDs, payment links, or user data.

## Deploy
1. Publish `database.rules.json` (Console or `firebase deploy --only database`).
2. As Admin, save Payment / License / Customer Care (auto-publishes), or tap **Publish to landing page**.
3. Incognito: landing should show trial/discount/refund only when `paymentEnabled` is true and fields are set.

## Auto-publish
`publishPublicOfferSnapshot()` runs after:
- `savePaymentSettingsAdmin`
- `saveAppLicenseAdmin`
- `saveCustomerCareAdmin`
