# 2.5.76.9 — Per-amount payment links (Admin)

## What
Admin can set a **different payment link for each subscription amount**.

## Where
Admin profile → **Payment Link & Reminders**

- **Default payment link** — fallback if an amount has no specific link
- **Amounts + payment links** — each ₹ amount has its own Razorpay/UPI URL field

## Storage (`settings/payment`)
```json
{
  "enabled": true,
  "amount": 999,
  "link": "https://rzp.io/i/default",
  "amountOptions": [999, 1499, 2499],
  "linksByAmount": {
    "999": "https://rzp.io/i/xxx999",
    "1499": "https://rzp.io/i/xxx1499"
  }
}
```

## User flow
1. User has `paymentAmount` 1499 (set by Admin)
2. Pay popup opens
3. App uses `linksByAmount["1499"]` (else default `link`)
4. Razorpay fixed links are opened as-is (amount not rewritten on rzp.io URLs)

## Setup
1. Create one Razorpay Payment Link per price (₹999, ₹1499, …)
2. Admin → add amounts → paste each rzp.io link next to the amount → Save
