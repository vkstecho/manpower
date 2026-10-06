# Pay until → PERMISSION_DENIED fix

Error: `PERMISSION_DENIED` on `mobileUsers/8168771239`

## Cause
Firebase RTDB rules only allow **write** on other users' `mobileUsers/{phone}` if the signed-in auth is:

1. Custom claim `admin: true`, **or**
2. Phone `+918929397949` (hard-coded admin), **or**
3. `admins/{auth.uid} === true` in RTDB, **or**
4. `mobileUsers/{your10digit}.role === "admin"`

UI badge "ADMIN" is **not** enough if Firebase Auth does not match one of the above.

## Fix (pick one)

### A) Use hard-admin phone
Login with the admin number that is in the rules (`+918929397949` or your configured hard admin).

### B) Set role admin on your mobileUsers node
In Firebase Console → Realtime Database:

```
mobileUsers/{YOUR_10_DIGIT_PHONE}/role = "admin"
mobileUsers/{YOUR_10_DIGIT_PHONE}/status = "approved"
```

Then logout/login with OTP on that phone.

### C) Mark auth uid as admin
```
admins/{YOUR_FIREBASE_AUTH_UID} = true
```

### D) Custom claims (Cloud Function)
Set `admin: true` on the auth token.

## After fix
1. Admin logout → OTP login again  
2. Team → Pay until → Save  
3. Should show: `Paid-until … saved for N account(s)`
