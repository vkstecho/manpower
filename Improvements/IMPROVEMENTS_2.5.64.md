# 2.5.64 — Hard-admin only 8929397949

- Removed `8168771239` from hard-admin in Firebase rules (was briefly added in 2.5.63)
- Config `hardAdminPhones`: only `+918929397949` / `8929397949`
- `contactVivek` still `+918168771239` (contact only, not admin)
- paymentStatus path unchanged — any manager phone can receive paid-until when real admin saves
