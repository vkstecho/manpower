# 2.5.59 — Pay until modal remembers last saved date

## Problem
After saving **Paid until** for a Manager, reopening the Pay until section always showed **today + 30 days**, not the date that was just saved. That caused confusion about whether the save worked.

## Fix
- `openAdminSetPaymentModal` now loads the account’s last `paymentPaidUntilDate` / `paymentPaidUntil` / `paidUntil` (and `paymentAmount`) from `_cache.mobileUsers` or Firebase.
- Date input and amount select are **pre-filled** with the last saved values.
- A green hint shows **Currently set: YYYY-MM-DD · ₹N/mo** when a value exists.
- After a successful save, `_cache.mobileUsers` is updated so the next open shows the new date immediately (no full refresh required).

## Deploy
Host 2.5.59 assets and hard-refresh (or update SW).
