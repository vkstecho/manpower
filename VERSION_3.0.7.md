# Man Power v3.0.7 — Complete commercial build

Based on v3.0.6 with all requested commercial + UX changes.

## Implemented

1. **Landing / login**
   - How to use — Shift Management (Admin: `settings/howToVideoUrl`)
   - WhatsApp Support (8929394920) + Email (CareMP@vkstech.com)
   - Android: Get it on Google Play
   - iOS/Desktop: Install PWA
   - Install buttons hidden when Play Store TWA / standalone

2. **Share App**
   - Android label: Google Play Store (no “set in Admin”)
   - iPhone / iPad / Desktop: Web app · Install as PWA

3. **My Shift**
   - Vertical scroll no longer multi-selects cells
   - Leave reason already required + shown on cell open (`reasonHtml`)
   - Multi-select still works via intentional drag

4. **Schedule legend**
   - G included in legend order with manager start–end times (same as D/N)

5. **Paid till**
   - Label: Paid till (was APP ACCESS VALIDITY)
   - Card tappable → plan selector (`openMemberPayPlans`)
   - Managers: ₹99 / ₹499 / ₹999 / ₹1499 + Custom
   - Members: ₹99 only
   - Annual = monthly × 12 × (1 − 17% default), Admin can set discountPct per plan
   - Razorpay links via existing Admin payment settings

6. **Module**
   - `js/mp-commercial.js` loaded after app.js

## Version
APP_VERSION / SW_VERSION = 3.0.7 · cache bust ?v=300007

## After deploy
Set in Firebase Admin / settings:
- howToVideoUrl
- payment.plans + links for 99,499,999,1499 and annual amounts
