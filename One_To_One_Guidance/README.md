# One-to-One Guidance Module

Production-ready plug-in for the **Learn & Grow** section of the parent VKS web app.

## Path
```
One_To_One_Guidance/one_to_one_guidance.html
```

## Features

- **Strict per-mobile isolation** – every user only sees their own unlocked topics, recordings, chat & payment history.
- Auto-detect mobile from:
  1. URL query (`?mobile=`, `?phone=`, `?user=`)
  2. Parent localStorage / sessionStorage (common keys + JSON scan)
  3. `window.parent.postMessage`
  4. Sleek fallback prompt
- LocalStorage key: `vks_guidance_${mobileNumber}`
- Firebase-ready (loads `../js/firebase-init.js` if present)
- **Mentor Mode** (auto for `8929394920` or PIN `vksmentor`)
  - View any student
  - Add YouTube session recordings
  - Reply in chat threads
  - Unlock / verify sessions
- **15 Mentorship tracks** with modern cards (AI + Career + Practical Life Skills)
- ₹699/hr Razorpay booking flow + UTR confirmation + WhatsApp notify
- Dedicated workspace: YouTube playlist + persistent chat
- Payment history + CSV export
- Light / Dark theme (persisted)

### Full List of 15 Tracks
1. Learn Gemini, Cloud, Grok, DeepSeek & ChatGPT
2. Learn to Excel in Career by Using AI Apps
3. Learn Excel with Help of AI
4. Learn Making Songs with AI
5. Learn Making Video with AI
6. Learn AdSense with AI (Google & YouTube Ads)
7. CCTV & Home Automation Setup
8. **Guide to Buy Correctly & Economically** (your request)
9. How to File Income Tax / ITR Easily
10. How to Start Freelancing & Get Clients
11. Get More Local Customers (Google + WhatsApp)
12. Basic Computer & Laptop Troubleshooting
13. Professional Resume + Interview Preparation
14. Government Schemes, Subsidies & Loans
15. Personal Finance Basics (SIP, MF & Budgeting)

## Integration Snippet

Add this button inside the Learn & Grow section of `js/app-team-print-learn.js` (or equivalent):

```javascript
// One-to-One Guidance card / button
{
  id: 'one_to_one_guidance',
  title: 'One-to-One Guidance',
  subtitle: '1-on-1 Mentorship • ₹699/Hr',
  icon: 'fa-user-graduate',          // or your preferred icon
  color: 'from-blue-500 to-indigo-600',
  path: 'One_To_One_Guidance/one_to_one_guidance.html',
  // Optional: pass mobile if already known
  // path: `One_To_One_Guidance/one_to_one_guidance.html?mobile=${currentUserMobile}`
}
```

Or a direct HTML link / button:

```html
<a href="One_To_One_Guidance/one_to_one_guidance.html"
   class="learn-card ...">
  <i class="fas fa-user-graduate"></i>
  <span>One-to-One Guidance</span>
  <small>1-on-1 Mentorship • ₹699/Hr</small>
</a>
```

If the parent already stores the logged-in mobile under any of the scanned keys (`mp_user_phone`, `userPhone`, `loggedInMobile`, etc.), the module will pick it up automatically. You can also append `?mobile=XXXXXXXXXX` to the URL for guaranteed detection.

## Mentor PIN
Default Mentor PIN: **`vksmentor`**  
(Change in `js/guidance.js` → constant `MENTOR_PIN`)

## Files
```
One_To_One_Guidance/
├── one_to_one_guidance.html
├── css/guidance.css
├── js/guidance.js
└── README.md
```

## Razorpay & WhatsApp
- Payment link: https://rzp.io/rzp/RWnisIr
- Mentor WhatsApp: +91-8929394920

Deploy the folder next to `MR_Skill/` and `Met_Train_Pro/` and the module is ready.
