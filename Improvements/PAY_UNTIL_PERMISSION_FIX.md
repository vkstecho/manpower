# Pay until → PERMISSION_DENIED (v2.5.64)

## Hard-admin
**Only** `+918929397949` is hard-admin in rules + config.  
`8168771239` is a **manager** number (payment target), not admin.

## Why error on 8168771239?
Firebase path was `mobileUsers/8168771239` — that is **Vivek’s record being updated**, not “Vivek is admin”.

Write is allowed only if the **signed-in Admin** is:
1. Phone OTP as `+918929397949`, or
2. `mobileUsers/{adminPhone}/role = "admin"`, or
3. `admins/{uid} = true`, or
4. custom claim `admin: true`

If Admin logged in with device password / wrong phone / no OTP, write to **any** manager path (including 8168771239) fails with PERMISSION_DENIED.

## App behaviour (2.5.63+)
- Saves `paymentStatus/{phone}` first, then best-effort `mobileUsers/{phone}`
- Gate reads both paths
- Manager phones are **not** listed in rules — `$phone` is a wildcard

## Deploy
1. Publish `database.rules.json` from this package
2. Admin: logout → OTP on **8929397949** (or role=admin phone)
3. Team → Pay for manager → Save
