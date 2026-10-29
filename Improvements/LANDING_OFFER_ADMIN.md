# Landing trial / discount chips — Admin steps

Live check: `publicOffer` was **null** until published. Chips only show when this node exists and `paymentEnabled` is true.

## One-time
1. Deploy **database.rules.json** (must include `publicOffer` with `".read": true`).
2. Hard-refresh the app after deploy.

## Publish offer (after Admin OTP login)
1. Profile / Admin → **Payment settings**
   - Payment gate **ON**
   - Set plan amounts
   - Set **annual discount %** (e.g. 17)
   - Save
2. Profile / Admin → **App license**
   - Set **free trial days** (e.g. 30)
   - Save
3. Profile / Admin → **Customer Care**
   - Set **refund days**
   - Save
4. Or open Payment settings → **📣 Publish to landing page**

Toast shows: `Landing: trial Xd · discount Y% · refund Zd`

## Verify
Incognito → https://manpower.vkstech.com  
Should show orange chips for trial / discount / refund (not only “Login with OTP…”).

REST check:
`https://metpowervks-default-rtdb.asia-southeast1.firebasedatabase.app/publicOffer.json`
