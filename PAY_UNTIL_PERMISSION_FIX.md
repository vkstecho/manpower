# Pay until → PERMISSION_DENIED fix (v2.5.63)

## What you saw
- Save → `PERMISSION_DENIED` on `mobileUsers/8168771239`
- Modal still said “No paid-until saved yet”
- Manager still got **Pay ₹999** popup

## Cause
Firebase only allows writing **other users’** `mobileUsers/{phone}` if the signed-in **Auth** is:

1. Custom claim `admin: true`, **or**
2. Hard-admin phone (`+918929397949` or `+918168771239`), **or**
3. `admins/{auth.uid} === true`, **or**
4. `mobileUsers/{yourPhone}.role === "admin"`

UI “ADMIN” alone is not enough. Device-password / anonymous session also fails.

## App fix (2.5.63)
1. Saves to **`paymentStatus/{phone}`** first (new rules path), then best-effort `mobileUsers`.
2. Login / payment gate reads **both** paths.
3. Modal prefill reads **both** paths.
4. Rules: `paymentStatus` node + hard-admin phones include Vivek’s number.

## You must deploy rules
In Firebase Console → Realtime Database → Rules, deploy the updated `database.rules.json` from this package (or merge the `paymentStatus` block).

## Then
1. **Logout** → login again with **OTP** on hard-admin or `role=admin` phone  
2. Team → Pay → set date → Save  
3. Manager **logout/login** (or wait for hydrate) → Pay popup should stop until that date  

### Quick Firebase Console check
```
paymentStatus/8168771239/paidUntil = (ISO date)
paymentStatus/8168771239/paymentPaidUntilDate = "2027-11-05"
```
