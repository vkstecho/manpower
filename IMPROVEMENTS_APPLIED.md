# Man Power v4.0.3 — GitHub publish package

## What’s included

### 1. Landing page (conversion)
- Founder authority block (Vivek Kumar · 9 years · 60-member teams · 818 MT · defects 9%→0.2%)
- Embedded testimonials with photos + career paths (Ajab Singh, N.K. Jena, Keshav Jha, Amit, Ghanshyam, Anuj, …)
- Dual CTAs: **Start free trial** + **Book 15-min setup call** (WhatsApp +91-8168771239)
- Risk-reversal bar under pricing
- FAQ: fit, talk-before-pay, who built Man Power
- Nav link **People** → `#proof`

### 2. Admin pricing fixes (`js/session/app-session-payment.js`)
- Seed button: **Seed annual from current monthly amounts** (not locked to 99/499/999/1499)
- Annual = current monthly × 12 × (1 − discount%)
- Max-members defaults: 799→60, 1499→60, 2999→200 (plus existing bands)
- `planLabel()` supports 799 / 1499 / 2999

### 3. Testimonials pack (`testimonials/`)
- Reusable across Man Power, Mentor, and vkstech.com
- See `testimonials/HOW_TO_USE.md`
- Photos: original uploads (professional passport re-style pending image quota)

## After deploy — fix plan mismatch (from your screenshots)

Your live app still showed old seed text and ₹1999 for 200 members while admin had ₹2999. After publishing this build:

1. Admin → Payment settings  
2. Set amounts + max members (pick **one** consistent set), e.g.  
   - 99 → 1  
   - 499 → 30 **or** 799 → 60  
   - 999 → 60 **or** 1499 → 60  
   - 1999 → 200 **or** 2999 → 200  
3. Default annual discount % = 12  
4. Click **Seed annual from current monthly amounts**  
5. Paste Razorpay links  
6. **Save** → **Publish to landing page**  
7. Hard-refresh app and confirm Choose plan matches admin

## Repo layout suggestion

```
manpower/   (github.com/vkstecho/manpower)
├── index.html
├── app.html
├── js/
├── testimonials/
├── IMPROVEMENTS_APPLIED.md
└── ...
```

Unzip this package and push the **contents of** `ManPower-v4.0.1/` to the repo root (or keep the folder name if that matches your hosting).
