# Man Power v3.0.0

## Includes
- 24h shift times + G shift in schedule legend
- Share App: Play Store link (Admin-configurable)
- Per-amount payment links (Razorpay / UPI)
- Customer Care page (Name, Email, WhatsApp) — Admin editable
- 7-day cancel & refund policy on pay screen + Customer Care
- Default pay message:

After payment, WhatsApp UTR + your registered mobile to +91-8929394920. Access is enabled within a few minutes.

## After deploy
1. Hard refresh / clear SW so version shows **3.0.0**
2. Admin → Payment Link & Reminders → confirm message → Save (writes to Firebase)
3. Admin → Customer Care → confirm contacts → Save
