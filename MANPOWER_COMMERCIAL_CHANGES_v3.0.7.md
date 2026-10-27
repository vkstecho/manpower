# Man Power — Commercial + UX Changes (v3.0.7)

Apply these changes on your GitHub repo, then push so Vercel deploys to `manpower.vkstech.com`.

**Confirmed rules**
- Managers → full plan selector (₹99 / ₹499 / ₹999 / ₹1,499 + Custom)
- Members → only Individual ₹99
- Annual = monthly × 12 × (1 − discount%). Default discount **17%** (Admin can change per plan)
- Support WhatsApp: **8929394920** · Email: **CareMP@vkstech.com** (already in Admin)
- How-to video URL: **new Admin field** (placeholder until you set it)
- Hide Install button when running as Play Store TWA / already installed
- Share App: familiar icons, Android → Play Store, iOS/Desktop → PWA web URL

---

## A. Landing page (`index.html`) — Login screen

### A1. Replace the top buttons block (Learn + Install)

Find the block with `loginLearnTitle` / `loginPwaBtn` and replace with:

```html
    <!-- How to use video (URL from Admin settings/howToVideoUrl) -->
    <button type="button" id="loginHowToBtn" onclick="openHowToVideo()"
      style="width:100%;max-width:360px;margin-bottom:10px;padding:12px 14px;border-radius:12px;cursor:pointer;
             background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;color:#fff;font-weight:800;font-size:14px;
             display:flex;align-items:center;justify-content:center;gap:8px">
      ▶ <span id="loginHowToLabel">How to use — Shift Management</span>
    </button>

    <!-- Customer Support -->
    <div style="width:100%;max-width:360px;margin-bottom:14px;display:flex;gap:8px">
      <a id="loginWaSupport" href="https://wa.me/918929394920" target="_blank" rel="noopener"
         style="flex:1;padding:11px;border-radius:12px;text-align:center;text-decoration:none;font-weight:800;font-size:13px;
                background:rgba(37,211,102,.15);border:1px solid rgba(37,211,102,.45);color:#16a34a">
        WhatsApp Support
      </a>
      <a id="loginEmailSupport" href="mailto:CareMP@vkstech.com"
         style="flex:1;padding:11px;border-radius:12px;text-align:center;text-decoration:none;font-weight:800;font-size:13px;
                background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.4);color:#2563eb">
        Email Support
      </a>
    </div>

    <!-- Install / Download — Android = Play Store, iOS/Desktop = PWA -->
    <div id="loginInstallRow" style="width:100%;max-width:360px;margin-bottom:14px;display:flex;flex-direction:column;gap:8px">
      <a id="loginAndroidStoreBtn" href="https://play.google.com/store/apps/details?id=com.vkstech.manpower"
         target="_blank" rel="noopener"
         style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;
                background:#01875f;color:#fff;font-weight:800;font-size:14px">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3.18 23.04c-.34-.17-.55-.5-.55-.89V1.85c0-.39.21-.72.55-.89l11.4 11.04L3.18 23.04zM14.53 13.3l2.73 2.64-9.9 5.55 7.17-8.19zM14.53 10.7L7.36 2.51l9.9 5.55-2.73 2.64zM17.86 9.66l2.85 1.6c.9.5.9 1.8 0 2.3l-2.85 1.6-3.12-3.02 3.12-2.48z"/>
        </svg>
        Get it on Google Play
      </a>
      <button type="button" id="loginPwaBtn" onclick="triggerPWAInstall()"
        style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;border-radius:12px;cursor:pointer;
               background:linear-gradient(135deg,rgba(249,115,22,.2),rgba(168,85,247,.2));
               border:1px solid rgba(249,115,22,.4);font-size:14px;font-weight:800;color:#f97316">
        📲 <span id="loginPwaLabel">Install on iPhone / Desktop (PWA)</span>
      </button>
    </div>
```

Keep your existing logo + language + mobile OTP form below this.

### A2. Hide Install when Play Store TWA / already installed

Add this script near the other PWA scripts at the top of `index.html` (after `beforeinstallprompt` block):

```html
<script>
// Detect Play Store TWA / installed display-mode → hide install CTAs
(function () {
  function isPlayStoreTwa() {
    try {
      var ua = navigator.userAgent || '';
      // TWA / Android WebView package often exposes related apps or standalone + android
      if (document.referrer && document.referrer.indexOf('android-app://com.vkstech.manpower') === 0) return true;
      if (ua.indexOf('wv') > -1 && /Android/i.test(ua)) {
        // heuristic: standalone WebView from our package
      }
    } catch (e) {}
    return false;
  }
  function isStandalone() {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator.standalone === true) return true; // iOS
    } catch (e) {}
    return false;
  }
  window._mpHideInstallButtons = function () {
    var hide = isStandalone() || isPlayStoreTwa() || window.__pwaInstalled === true;
    ['loginPwaBtn', 'loginAndroidStoreBtn', 'loginInstallRow', 'pwaInstallBtn'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = hide ? 'none' : '';
    });
    // On pure Android TWA, also hide Play button (already installed from store)
    if (isPlayStoreTwa() || (isStandalone() && /Android/i.test(navigator.userAgent || ''))) {
      var a = document.getElementById('loginAndroidStoreBtn');
      if (a) a.style.display = 'none';
      var row = document.getElementById('loginInstallRow');
      if (row && !document.getElementById('loginPwaBtn')) row.style.display = 'none';
    }
  };
  window.addEventListener('appinstalled', function () {
    window.__pwaInstalled = true;
    window._mpHideInstallButtons();
  });
  document.addEventListener('DOMContentLoaded', function () {
    window._mpHideInstallButtons();
    setTimeout(window._mpHideInstallButtons, 500);
  });
})();
</script>
```

Also call `window._mpHideInstallButtons()` from your existing `_mpRefreshInstallButtons` / after login home render.

### A3. How-to video helper (uses Admin field)

Add to a JS file that loads on login (e.g. `app-login-session.js` or `app-core.js`):

```js
async function _loadHowToVideoUrl() {
  try {
    const s = await fbGet('settings/howToVideoUrl');
    const url = (s && (s.url || s)) ? String(s.url || s).trim() : '';
    window._howToVideoUrl = url || '';
    return window._howToVideoUrl;
  } catch (e) {
    return window._howToVideoUrl || '';
  }
}

async function openHowToVideo() {
  let url = window._howToVideoUrl;
  if (!url) url = await _loadHowToVideoUrl();
  if (!url) {
    toast((typeof L === 'function') ? L('वीडियो जल्द आ रहा है — Admin से लिंक सेट करें', 'Video coming soon — Admin will set the link') : 'Video coming soon');
    return;
  }
  try { window.open(url, '_blank', 'noopener'); } catch (e) { location.href = url; }
}

// Same entry from inside-app Customer Support page
window.openHowToVideo = openHowToVideo;
```

**Admin:** add a text field that saves to `settings/howToVideoUrl` = `{ url: "https://youtube.com/..." }`.

Wire Customer Care WhatsApp/Email from existing Admin `settings/customerCare` (you already have this). On login page load, optionally overwrite `loginWaSupport` / `loginEmailSupport` hrefs from that cache.

---

## B. Share App modal (`js/app-core.js` — function `shareApp`)

Replace the modal HTML inside `shareApp()` so Android subtext is the real Play URL and icons are clearer:

```js
async function shareApp(){
  try{ if(typeof _loadShareAppLink==='function') await _loadShareAppLink(); }catch(e){}
  var iosUrl = 'https://manpower.vkstech.com';
  var androidUrl = 'https://play.google.com/store/apps/details?id=com.vkstech.manpower';
  try{
    var c = window._shareAppLinkCache;
    if(c && c.url && String(c.url).trim()) androidUrl = String(c.url).trim();
  }catch(e){}
  window._shareIosUrl = iosUrl;
  window._shareAndroidUrl = androidUrl;
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📤 Share App</div>
    <div style="font-size:12px;color:var(--muted2);margin:0 0 14px;line-height:1.45">Choose platform</div>
    <button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left" onclick="closeModal();_doPlatformShare('ios')">
      <div class="pa-icon" style="background:rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;font-size:22px"></div>
      <div><div class="pa-label">iPhone / iPad / Desktop</div><div class="pa-sub">Open web app · Install as PWA</div></div>
      <div class="pa-arrow">›</div>
    </button>
    <button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left" onclick="closeModal();_doPlatformShare('android')">
      <div class="pa-icon" style="background:rgba(1,135,95,.15);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#01875f">▶</div>
      <div><div class="pa-label">Android</div><div class="pa-sub">Google Play Store</div></div>
      <div class="pa-arrow">›</div>
    </button>
    <button type="button" class="cancel-btn" style="width:100%;margin-top:4px" onclick="closeModal()">Cancel</button>`);
}
```

(`_doPlatformShare` can stay as-is.)

---

## C. App Access Validity → Paid till + pay options

### C1. Profile card text

Where you render **APP ACCESS VALIDITY** / `days left` / `Valid till`, change to:

- Title: **Paid till**
- Main line: `12 May 2027 · 198 days left` (green if >15 days, orange if ≤15, red if expired)
- Whole card is clickable → `openMemberPayPlans()`

Example structure:

```html
<div class="profile-action" onclick="openMemberPayPlans()" style="cursor:pointer">
  <div class="pa-icon" style="background:rgba(34,197,94,.12)">💳</div>
  <div>
    <div class="pa-label">${L('भुगतान वैध तक','Paid till')}</div>
    <div class="pa-sub" style="font-weight:800;color:${color}">
      ${expiryStr} · ${daysLeft} ${L('दिन बाकी','days left')}
    </div>
  </div>
  <div class="pa-arrow">›</div>
</div>
```

### C2. Plan selector modal

```js
async function openMemberPayPlans() {
  const cfg = await _loadPaymentSettings(true);
  const isManager = (typeof isMgr === 'function' && isMgr()) || (SESSION && SESSION.role === 'manager');
  const plans = _getSubscriptionPlans(cfg); // see C3

  if (!isManager) {
    // Members: only ₹99
    return _showPlanPayConfirm(plans.find(p => p.maxMembers === 1) || plans[0]);
  }

  // Manager: choose team strength
  const rows = plans.map(p => {
    if (p.custom) {
      return `<button type="button" class="profile-action" style="width:100%;margin-bottom:8px;text-align:left"
        onclick="closeModal();_openCustomPlanSupport()">
        <div class="pa-icon">💬</div>
        <div><div class="pa-label">${p.label}</div><div class="pa-sub">WhatsApp support for custom quote</div></div>
        <div class="pa-arrow">›</div>
      </button>`;
    }
    return `<button type="button" class="profile-action" style="width:100%;margin-bottom:8px;text-align:left"
      onclick="closeModal();_showPlanPayConfirm(${JSON.stringify(p).replace(/"/g,'&quot;')})">
      <div class="pa-icon">👥</div>
      <div><div class="pa-label">${p.label}</div>
        <div class="pa-sub">₹${p.monthly}/month · Annual ₹${p.annual} (save ${p.discountPct}%)</div>
      </div>
      <div class="pa-arrow">›</div>
    </button>`;
  }).join('');

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">${L('प्लान चुनें','Choose plan')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">${L('टीम साइज़ के हिसाब से','Based on team size')}</div>
    ${rows}
    <button type="button" class="cancel-btn" style="width:100%;margin-top:8px" onclick="closeModal()">${L('बंद करें','Close')}</button>`);
}

function _openCustomPlanSupport() {
  const wa = '918929394920';
  const text = encodeURIComponent('Hi, I need a custom Man Power plan for my plant.');
  window.open('https://wa.me/' + wa + '?text=' + text, '_blank', 'noopener');
}

function _showPlanPayConfirm(plan) {
  if (typeof plan === 'string') try { plan = JSON.parse(plan.replace(/&quot;/g,'"')); } catch(e) {}
  if (!plan || plan.custom) return _openCustomPlanSupport();
  const monthlyLink = _resolvePaymentLink(window._paymentSettingsCache, plan.monthly) || '';
  const annualLink = _resolvePaymentLink(window._paymentSettingsCache, plan.annual) || monthlyLink;
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">${plan.label}</div>
    <div style="font-size:13px;color:var(--muted2);margin-bottom:14px">
      ${L('मासिक','Monthly')}: <b>₹${plan.monthly}</b><br>
      ${L('वार्षिक','Annual')}: <b>₹${plan.annual}</b> (${plan.discountPct}% ${L('छूट','off')})
    </div>
    ${monthlyLink ? `<a class="big-btn" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none" target="_blank" rel="noopener" href="${monthlyLink}">Pay ₹${plan.monthly} / month</a>` : ''}
    ${annualLink ? `<a class="big-btn" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none;background:linear-gradient(135deg,#059669,#047857)" target="_blank" rel="noopener" href="${annualLink}">Pay ₹${plan.annual} / year</a>` : ''}
    <button type="button" class="cancel-btn" style="width:100%" onclick="closeModal();openMemberPayPlans()">← ${L('वापस','Back')}</button>`);
}
```

### C3. Plans from Admin settings (+ default 17% discount)

Extend `settings/payment` shape:

```js
function _getSubscriptionPlans(cfg) {
  const defaults = [
    { id: 'm1',   label: 'Individual (1 member)', maxMembers: 1,   monthly: 99,   discountPct: 17 },
    { id: 'm25',  label: 'Up to 25 members',      maxMembers: 25,  monthly: 499,  discountPct: 17 },
    { id: 'm50',  label: 'Up to 50 members',      maxMembers: 50,  monthly: 999,  discountPct: 17 },
    { id: 'm200', label: 'Up to 200 members',     maxMembers: 200, monthly: 1499, discountPct: 17 },
    { id: 'custom', label: 'Customized plan', custom: true }
  ];
  const fromAdmin = (cfg && Array.isArray(cfg.plans) && cfg.plans.length) ? cfg.plans : defaults;
  return fromAdmin.map(p => {
    if (p.custom) return p;
    const monthly = parseInt(p.monthly, 10) || 0;
    const discountPct = Math.min(90, Math.max(0, parseInt(p.discountPct, 10) || 17));
    const annual = Math.round(monthly * 12 * (1 - discountPct / 100));
    return Object.assign({}, p, { monthly, discountPct, annual });
  });
}
```

### C4. Admin UI — Payment Link & Reminders

In the Admin “Payment Link & Reminders” panel (screenshot you shared), add:

| Field | Purpose |
|-------|---------|
| Plans list | rows: maxMembers, monthly ₹, discount %, Razorpay/UPI link for monthly, link for annual (or auto-calc amount key) |
| Default discount % | 17 |
| howToVideoUrl | YouTube link |

Save under `settings/payment.plans = [ {...}, ... ]` and keep existing `linksByAmount` map so `_resolvePaymentLink(cfg, amount)` still works for 99, 499, 999, 1499 and annual totals (e.g. 986, 4967, …).

Suggested default annual amounts at 17% off:

| Monthly | Annual (17% off) |
|---------|------------------|
| 99 | 986 |
| 499 | 4,970 |
| 999 | 9,950 |
| 1,499 | 14,930 |

Add Razorpay links for these annual amounts in Admin the same way as monthly.

---

## D. My Shift — scroll vs select + legend colours + Leave reason

### D1. Stop scroll from selecting cells

In the My Shift calendar touch handlers (where you start range select on `touchstart` / `pointerdown`):

```js
// Pseudocode — adapt to your existing listeners
let _msStartY = 0, _msStartX = 0, _msSelecting = false, _msMoved = false;

cell.addEventListener('pointerdown', (e) => {
  _msStartX = e.clientX; _msStartY = e.clientY;
  _msSelecting = false; _msMoved = false;
  // do NOT start selection yet
}, { passive: true });

cell.addEventListener('pointermove', (e) => {
  const dx = Math.abs(e.clientX - _msStartX);
  const dy = Math.abs(e.clientY - _msStartY);
  if (dy > 12 && dy > dx * 1.2) {
    // vertical scroll intent — abort selection
    _msSelecting = false;
    return;
  }
  if (dx > 10 || dy > 10) {
    _msMoved = true;
    if (!_msSelecting && dx >= dy) {
      _msSelecting = true;
      beginRangeSelect(/* day */);
    }
  }
  if (_msSelecting) {
    e.preventDefault();
    extendRangeSelect(/* day under pointer */);
  }
}, { passive: false });

cell.addEventListener('pointerup', (e) => {
  if (_msSelecting) {
    endRangeSelect();
  } else if (!_msMoved) {
    // pure tap → single-day picker / show leave reason
    openSingleDayShiftOrLeaveRemark(/* day */);
  }
  _msSelecting = false; _msMoved = false;
});
```

Key idea: **vertical movement = scroll (ignore select)**; **horizontal / small move after threshold = range select**; **tap = single day**.

### D2. Legend colours same as Schedule

Use one shared colour map (Schedule already has it). Example:

```js
const SHIFT_LEGEND_COLORS = {
  D:  { bg: '#ea580c', fg: '#fff' },      // Day — orange
  N:  { bg: '#7c3aed', fg: '#fff' },      // Night — purple
  G:  { bg: '#2563eb', fg: '#fff' },      // General — blue
  O:  { bg: '#64748b', fg: '#fff' },      // Weekly Off
  L:  { bg: '#fb7185', fg: '#fff' },      // Leave — pink
  H:  { bg: '#f97316', fg: '#fff' },
  // ... keep CO, OD, GP, Ab, ½ consistent with Schedule
};
```

Apply the same map in My Shift cell paint and in the bulk-select chip bar (D / N / Off / Leave / G).

### D3. G shift timing from manager settings

When building legend labels for D / N / G, read manager shift times (from Shift & Min Staff / `settings` or team shift config you already save):

```js
function shiftLegendLabel(code) {
  const times = getManagerShiftTimes(); // { D:['07:00','19:00'], N:['19:00','07:00'], G:['08:00','20:00'], ... }
  const t = times[code];
  const name = (CFG.shiftLabels && CFG.shiftLabels[code]) || code;
  if (t && t[0] && t[1]) return `${code} ${name} (${t[0]}–${t[1]})`;
  return `${code} ${name}`;
}
```

Show **G** the same way as **D** and **N** (name + manager-set window).

### D4. Leave reason

1. When user picks **Leave** (single day or range):
   - Show leave **types** from Team Leave Quota (manager-configured).
   - If type is **Other / Others** → show text input for free reason.
2. Save on the day cell / override object, e.g.  
   `{ shift: 'L', leaveType: 'CL', leaveReason: 'Fever' }`
3. **Single tap** on a day already marked `L`:
   - Open small popover: type + reason (read-only for members if you want; editable for manager).

You already have `leaveReason` references in `app-schedule.js` / session — extend the picker UI to write that field and the tap handler to read it.

---

## E. Inside-app Customer Support page

Wherever Customer Support / Care is rendered after login:

- Button **How to use (Shift Management)** → `openHowToVideo()`
- WhatsApp → `https://wa.me/918929394920` (or Admin override)
- Email → `mailto:CareMP@vkstech.com`

---

## F. Version bump

1. `js/config.js` → `APP_VERSION: "3.0.7"`
2. `sw.js` → `SW_VERSION = '3.0.7'`
3. Cache-bust query on script tags in `index.html` (`?v=300007`)
4. Commit + push to `main` → Vercel production

---

## G. Test checklist

| # | Test |
|---|------|
| 1 | Login page shows How-to, WhatsApp, Email, Play Store, PWA buttons |
| 2 | Open from Play Store TWA → Install buttons hidden |
| 3 | Share App → Android says “Google Play Store”, opens Play link |
| 4 | Manager taps Paid till → 4 plans + Custom; Back works; annual 17% off |
| 5 | Member taps Paid till → only ₹99 monthly + annual |
| 6 | Admin can set discount % and Razorpay links per amount |
| 7 | My Shift: vertical scroll does not multi-select; horizontal drag still selects |
| 8 | D/N/G colours match Schedule; G shows manager timing |
| 9 | Mark Leave with type + Other reason; tap leave day shows reason |
| 10 | How-to opens Admin YouTube URL (or “coming soon” if empty) |

---

## H. What you set in Admin after deploy

1. `settings/howToVideoUrl` = your YouTube link  
2. Payment plans + discount % + Razorpay links for:  
   `99, 499, 999, 1499` and annual amounts  
3. Confirm Customer Care WhatsApp `8929394920` and email `CareMP@vkstech.com`

---

If you want the next step as **actual patched files** (e.g. a modified `index.html` + a small `js/mp-commercial.js` you can include), say so and I will generate those files under `/home/workdir/artifacts` for you to copy into the GitHub repo.
