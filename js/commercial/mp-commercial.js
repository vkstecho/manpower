/**
 * Man Power v3.0.7 — Commercial / UX add-on
 * Include AFTER firebase-init and app core scripts:
 *   <script src="js/commercial/mp-commercial.js?v=300007"></script>
 *
 * Features:
 * - How-to video (Admin: settings/howToVideoUrl)
 * - Support links (WhatsApp 8929394920, CareMP@vkstech.com; Admin override)
 * - Hide Install when Play Store TWA / standalone
 * - Share App modal (Play Store + PWA)
 * - Paid-till plans: Managers full tiers, Members ₹99 only
 * - Annual = monthly × 12 × (1 − discount%), default 17%
 * - Leave reason helpers + shift legend colours/timings helpers
 */
(function (global) {
  'use strict';

  var PLAY_STORE =
    'https://play.google.com/store/apps/details?id=com.vkstech.manpower';
  var WEB_APP = 'https://manpower.vkstech.com';
  var DEFAULT_WA = '918929394920';
  var DEFAULT_EMAIL = 'CareMP@vkstech.com';

  // ─── Install / TWA detection ───────────────────────────────────────────
  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
        return true;
      if (navigator.standalone === true) return true;
    } catch (e) {}
    return false;
  }

  function isPlayStoreTwa() {
    try {
      if (
        document.referrer &&
        document.referrer.indexOf('android-app://com.vkstech.manpower') === 0
      )
        return true;
      // Android WebView / TWA heuristic when already installed
      var ua = navigator.userAgent || '';
      if (isStandalone() && /Android/i.test(ua)) return true;
    } catch (e) {}
    return false;
  }

  function hideInstallButtons() {
    var hide = isStandalone() || isPlayStoreTwa() || window.__pwaInstalled === true;
    try {
      if (hide) document.documentElement.classList.add('mp-installed');
      else document.documentElement.classList.remove('mp-installed');
      if (document.body) {
        if (hide) document.body.classList.add('mp-installed');
        else document.body.classList.remove('mp-installed');
      }
    } catch (eCls) {}
    try {
      // Clear stale flag when user is in a normal browser tab so Install reappears
      if (!hide && window.matchMedia && window.matchMedia('(display-mode: browser)').matches) {
        localStorage.removeItem('mp_pwa_installed');
      }
    } catch (e) {}
    [
      'loginPwaBtn',
      'loginAndroidStoreBtn',
      'loginInstallRow',
      'pwaInstallBtn',
      'pwaBanner'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (hide) {
        el.style.display = 'none';
      } else if (id === 'pwaInstallBtn') {
        el.style.display = 'flex';
      } else {
        el.style.display = '';
      }
    });
    if (hide) {
      var android = document.getElementById('loginAndroidStoreBtn');
      if (android) android.style.display = 'none';
    }
  }

  
  // Ensure Play Store link always points to official listing
  try {
    var _ps = document.getElementById('loginAndroidStoreBtn');
    if (_ps) {
      _ps.href = PLAY_STORE;
      _ps.setAttribute('href', PLAY_STORE);
    }
  } catch (e) {}

  window._mpHideInstallButtons = hideInstallButtons;
  window.addEventListener('appinstalled', function () {
    window.__pwaInstalled = true;
    hideInstallButtons();
  });
  document.addEventListener('DOMContentLoaded', function () {
    hideInstallButtons();
    setTimeout(hideInstallButtons, 400);
    setTimeout(hideInstallButtons, 1500);
    wireLoginSupportLinks();
  });

  // ─── How-to video ──────────────────────────────────────────────────────
  async function loadHowToVideoUrl(force) {
    if (!force && window._howToVideoUrl) return window._howToVideoUrl;
    try {
      if (typeof fbGet === 'function') {
        var s = await fbGet('settings/howToVideoUrl');
        var url = '';
        if (typeof s === 'string') url = s.trim();
        else if (s && s.url) url = String(s.url).trim();
        window._howToVideoUrl = url;
        return url;
      }
    } catch (e) {}
    return window._howToVideoUrl || '';
  }

  async function openHowToVideo() {
    var url = await loadHowToVideoUrl(false);
    if (!url) {
      if (typeof toast === 'function') {
        toast(
          typeof L === 'function'
            ? L('वीडियो जल्द आ रहा है — Admin लिंक सेट करें', 'Video coming soon — Admin will set the link')
            : 'Video coming soon — Admin will set the link'
        );
      }
      return;
    }
    try {
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      location.href = url;
    }
  }
  window.openHowToVideo = openHowToVideo;
  window._loadHowToVideoUrl = loadHowToVideoUrl;

  // ─── Support links ─────────────────────────────────────────────────────
  async function loadCustomerCare() {
    try {
      if (typeof _loadCustomerCare === 'function') return await _loadCustomerCare(false);
      if (typeof fbGet === 'function') {
        var c = await fbGet('settings/customerCare');
        if (c) return c;
      }
    } catch (e) {}
    return { whatsapp: DEFAULT_WA, email: DEFAULT_EMAIL };
  }

  async function wireLoginSupportLinks() {
    try {
      var c = await loadCustomerCare();
      var wa = String((c && (c.whatsapp || c.wa || c.phone)) || DEFAULT_WA).replace(/\D/g, '');
      if (wa.length === 10) wa = '91' + wa;
      var email = (c && (c.email || c.mail)) || DEFAULT_EMAIL;
      var aWa = document.getElementById('loginWaSupport');
      var aEm = document.getElementById('loginEmailSupport');
      if (aWa) aWa.href = 'https://wa.me/' + wa;
      if (aEm) aEm.href = 'mailto:' + email;
    } catch (e) {}
  }
  window._wireLoginSupportLinks = wireLoginSupportLinks;

  // ─── Share App (override if core already defined — call this from UI) ─
  async function shareAppCommercial() {
    try {
      if (typeof _loadShareAppLink === 'function') await _loadShareAppLink();
    } catch (e) {}
    var iosUrl = WEB_APP;
    var androidUrl = PLAY_STORE;
    try {
      var c = window._shareAppLinkCache;
      if (c && c.url && String(c.url).trim()) androidUrl = String(c.url).trim();
    } catch (e) {}
    window._shareIosUrl = iosUrl;
    window._shareAndroidUrl = androidUrl;

    var html = [
      '<div class="modal-handle"></div>',
      '<div class="modal-title">📤 Share App</div>',
      '<div style="font-size:12px;color:var(--muted2);margin:0 0 14px;line-height:1.45">Choose platform</div>',
      '<button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left;display:flex;align-items:center;gap:12px;padding:12px 14px" onclick="closeModal();_doPlatformShare&&_doPlatformShare(\'ios\')">',
      '<div class="pa-icon" style="background:rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;border-radius:12px;overflow:hidden">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#1d1d1f"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 15 2.94 10.53 4.7 7.5c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
      '</div>',
      '<div style="flex:1;min-width:0;text-align:left"><div class="pa-label" style="font-weight:800">iPhone / iPad</div><div class="pa-sub" style="font-size:11px;color:var(--muted2)">Apple · Web app · Add to Home Screen</div></div>',
      '<div class="pa-arrow">›</div></button>',
      '<button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left;display:flex;align-items:center;gap:12px;padding:12px 14px" onclick="closeModal();_doPlatformShare&&_doPlatformShare(\'android\')">',
      '<div class="pa-icon" style="background:rgba(1,135,95,.12);display:flex;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;border-radius:12px;overflow:hidden">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 512 512"><path fill="#00A0FF" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"/><path fill="#00F076" d="M325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z"/><path fill="#FFD500" d="M104.6 13L325.3 234.3 385.4 174.2 465.3 128 104.6 13z"/><path fill="#FF3A44" d="M104.6 499l360.7-115.2-79.9-46.1-60.1 60.1L104.6 499z"/><path fill="#00D6FF" d="M104.6 13v486L325.3 256 104.6 13z"/></svg>',
      '</div>',
      '<div style="flex:1;min-width:0;text-align:left"><div class="pa-label" style="font-weight:800">Android</div><div class="pa-sub" style="font-size:11px;color:var(--muted2)">Google Play Store</div></div>',
      '<div class="pa-arrow">›</div></button>',
      '<button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left;display:flex;align-items:center;gap:12px;padding:12px 14px" onclick="closeModal();_doPlatformShare&&_doPlatformShare(\'desktop\')">',
      '<div class="pa-icon" style="background:rgba(0,120,212,.12);display:flex;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;border-radius:12px;overflow:hidden">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><path fill="#0078D4" d="M3 5.1L10.5 4v7.2H3V5.1zm0 13.8v-6.3h7.5V20L3 18.9zM11.4 4L21 2.7v8.5h-9.6V4zM21 21.3L11.4 20v-7.2H21v8.5z"/></svg>',
      '</div>',
      '<div style="flex:1;min-width:0;text-align:left"><div class="pa-label" style="font-weight:800">Windows / Desktop</div><div class="pa-sub" style="font-size:11px;color:var(--muted2)">Web app · Install as PWA</div></div>',
      '<div class="pa-arrow">›</div></button>',
      '<button type="button" class="cancel-btn" style="width:100%;margin-top:4px" onclick="closeModal()">Cancel</button>'
    ].join('');

    if (typeof openModal === 'function') openModal(html);
    else alert('Open: Android ' + androidUrl + ' | iOS ' + iosUrl);
  }

  // Prefer commercial share when this file loads last
  window.shareAppCommercial = shareAppCommercial;
  if (!window._shareAppOriginal && typeof window.shareApp === 'function') {
    window._shareAppOriginal = window.shareApp;
  }
  window.shareApp = shareAppCommercial;

  if (!window._doPlatformShare) {
    window._doPlatformShare = function (kind) {
      if (kind === 'desktop') {
        try {
          if (typeof triggerPWAInstall === 'function') {
            triggerPWAInstall();
            return;
          }
        } catch (e) {}
        try {
          if (typeof _showInstallInstructions === 'function') {
            _showInstallInstructions();
            return;
          }
        } catch (e2) {}
      }
      var url =
        kind === 'ios'
          ? window._shareIosUrl || WEB_APP
          : window._shareAndroidUrl || PLAY_STORE;
      var text =
        kind === 'ios'
          ? 'Man Power — Team Management (iOS / Web)'
          : 'Man Power — Install from Play Store';
      try {
        if (navigator.share) {
          navigator.share({ title: 'Man Power', text: text, url: url }).catch(function () {
            try {
              window.open(url, '_blank', 'noopener');
            } catch (e) {
              location.href = url;
            }
          });
          return;
        }
      } catch (e) {}
      try {
        window.open(url, '_blank', 'noopener');
      } catch (e2) {
        location.href = url;
      }
    };
  }

  // ─── Subscription plans ────────────────────────────────────────────────
  function defaultPlans() {
    return [
      { id: 'm1', label: 'Individual (1 member)', maxMembers: 1, monthly: 99, discountPct: null },
      { id: 'm30', label: 'Up to 30 members', maxMembers: 30, monthly: 499, discountPct: null },
      { id: 'm60', label: 'Up to 60 members', maxMembers: 60, monthly: 999, discountPct: null },
      { id: 'm200', label: 'Up to 200 members', maxMembers: 200, monthly: 1999, discountPct: null },
      { id: 'custom', label: 'Customized plan', custom: true }
    ];
  }

  function getSubscriptionPlans(cfg) {
    var globalDisc = 12;
    try {
      if (cfg && cfg.defaultDiscountPct != null && cfg.defaultDiscountPct !== '')
        globalDisc = parseInt(cfg.defaultDiscountPct, 10);
      if (isNaN(globalDisc)) globalDisc = 12;
    } catch (e) {}
    globalDisc = Math.min(90, Math.max(0, globalDisc));

    // Build from admin amountOptions + maxMembersByAmount when available
    // (this is what Admin edits — not the old hardcoded 499/999/1999 defaults)
    function plansFromAmounts(cfg) {
      if (!cfg) return null;
      var raw = cfg.amountOptions || cfg.amounts || [];
      var amounts = (Array.isArray(raw) ? raw : String(raw).split(','))
        .map(function (x) { return parseInt(x, 10); })
        .filter(function (n) { return n > 0; });
      if (!amounts.length) return null;
      var mmMap = cfg.maxMembersByAmount || {};
      // Treat as annual if it matches monthly×12×(1−disc) for some smaller monthly in the list
      function isAnnualAmt(n) {
        for (var i = 0; i < amounts.length; i++) {
          var m = amounts[i];
          if (m > 0 && m < n && Math.round(m * 12 * (1 - globalDisc / 100)) === n) return true;
        }
        if (n >= 4000) return true;
        return false;
      }
      var monthlyOnly = amounts.filter(function (n) { return !isAnnualAmt(n); });
      monthlyOnly.sort(function (a, b) { return a - b; });
      if (!monthlyOnly.length) return null;
      var out = monthlyOnly.map(function (m) {
        var mm = parseInt(mmMap[String(m)] != null ? mmMap[String(m)] : mmMap[m], 10) || 0;
        var label;
        if (mm === 1 || m === 99 || m === 199) label = 'Individual (1 member)';
        else if (mm > 0) label = 'Up to ' + mm + ' members';
        else if (m === 499) label = 'Up to 30 members';
        else if (m === 799 || m === 999 || m === 1499) label = 'Up to 60 members';
        else if (m >= 1999) label = 'Up to 200 members';
        else label = 'Plan ₹' + m;
        return {
          id: 'm' + m,
          label: label,
          maxMembers: mm || (m === 99 || m === 199 ? 1 : 0),
          monthly: m,
          discountPct: null
        };
      });
      out.push({ id: 'custom', label: 'Customized plan', custom: true });
      return out;
    }

    var fromAmounts = plansFromAmounts(cfg);
    var fromAdmin =
      (cfg && Array.isArray(cfg.plans) && cfg.plans.length ? cfg.plans : null) ||
      fromAmounts ||
      defaultPlans();

    return fromAdmin.map(function (p) {
      if (p.custom) return p;
      var monthly = parseInt(p.monthly, 10) || 0;
      var discountPct = globalDisc;
      try {
        if (cfg && cfg.planDiscounts && cfg.planDiscounts[String(monthly)] != null) {
          var o = parseInt(cfg.planDiscounts[String(monthly)], 10);
          if (!isNaN(o)) discountPct = o;
        }
      } catch (e2) {}
      discountPct = Math.min(90, Math.max(0, discountPct));
      var annual = Math.round(monthly * 12 * (1 - discountPct / 100));
      return Object.assign({}, p, { monthly: monthly, discountPct: discountPct, annual: annual });
    });
  }
  window._getSubscriptionPlans = getSubscriptionPlans;

  function isManagerUser() {
    try {
      if (typeof isMgr === 'function' && isMgr()) return true;
      if (window.SESSION && String(SESSION.role || '').toLowerCase() === 'manager') return true;
    } catch (e) {}
    return false;
  }

  function openCustomPlanSupport() {
    var text = encodeURIComponent('Hi, I need a custom Man Power plan for my plant.');
    window.open('https://wa.me/' + DEFAULT_WA + '?text=' + text, '_blank', 'noopener');
  }
  window._openCustomPlanSupport = openCustomPlanSupport;

  function resolveLink(cfg, amount) {
    if (typeof _resolvePaymentLink === 'function') return _resolvePaymentLink(cfg, amount);
    try {
      var map = (cfg && cfg.linksByAmount) || {};
      var am = String(parseInt(amount, 10) || 0);
      if (map[am]) return map[am];
      if (cfg && cfg.link) return cfg.link;
    } catch (e) {}
    return '';
  }

  function showPlanPayConfirm(plan) {
    if (typeof plan === 'string') {
      try {
        plan = JSON.parse(plan);
      } catch (e) {
        plan = null;
      }
    }
    if (!plan || plan.custom) return openCustomPlanSupport();

    var cfg = window._paymentSettingsCache || {};
    var monthlyLink = resolveLink(cfg, plan.monthly) || '';
    var annualLink = resolveLink(cfg, plan.annual) || '';

    var Lfn = typeof L === 'function' ? L : function (a, b) {
      return b || a;
    };
    var html =
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">' +
      (plan.label || 'Plan') +
      '</div>' +
      '<div style="font-size:13px;color:var(--muted2);margin-bottom:14px;line-height:1.5">' +
      Lfn('मासिक', 'Monthly') +
      ': <b>₹' +
      plan.monthly +
      '</b><br>' +
      Lfn('वार्षिक', 'Annual') +
      ': <b>₹' +
      plan.annual +
      '</b> (' +
      plan.discountPct +
      '% ' +
      Lfn('छूट', 'off') +
      ')' +
      '</div>';

    function linkOk(u) {
      if (typeof _looksLikeFixedPaymentLink === 'function') return _looksLikeFixedPaymentLink(u);
      return !!(u && /^https?:\/\//i.test(u));
    }
    var monthlyOk = monthlyLink && linkOk(monthlyLink);
    var annualOk = annualLink && linkOk(annualLink);
    if (monthlyOk) {
      html +=
        '<a class="big-btn" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;font-weight:900;padding:14px;border-radius:12px" target="_blank" rel="noopener" href="' +
        monthlyLink.replace(/"/g, '&quot;') +
        '">Pay ₹' +
        plan.monthly +
        ' / month</a>';
    } else if (monthlyLink) {
      html +=
        '<div style="padding:10px;border-radius:10px;background:rgba(249,115,22,.1);color:#c2410c;font-size:12px;margin-bottom:10px">Monthly link looks invalid (use full fixed-amount rzp.io link for ₹' +
        plan.monthly +
        ')</div>';
    }
    if (annualOk) {
      html +=
        '<a class="big-btn" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-weight:900;padding:14px;border-radius:12px" target="_blank" rel="noopener" href="' +
        annualLink.replace(/"/g, '&quot;') +
        '">Pay ₹' +
        plan.annual +
        ' / year</a>';
    } else if (annualLink) {
      html +=
        '<div style="padding:10px;border-radius:10px;background:rgba(249,115,22,.1);color:#c2410c;font-size:12px;margin-bottom:10px">Annual link looks invalid or incomplete — Admin must paste a <b>fixed-amount</b> Razorpay Payment Link created for exactly ₹' +
        plan.annual +
        ' (not razorpay.me/@username). "Amount not valid" means the link was made for a different amount.</div>';
    }
    if (!monthlyOk && !annualOk) {
      html +=
        '<div style="padding:12px;border-radius:10px;background:rgba(239,68,68,.1);color:#b91c1c;font-size:12px;margin-bottom:10px">Payment link not set or invalid — contact Admin / WhatsApp ' +
        DEFAULT_WA +
        '</div>';
    }
    html +=
      '<button type="button" class="cancel-btn" style="width:100%" onclick="closeModal();openMemberPayPlans()">← ' +
      Lfn('वापस', 'Back') +
      '</button>';

    if (typeof openModal === 'function') openModal(html);
  }
  window._showPlanPayConfirm = showPlanPayConfirm;

  async function openMemberPayPlans() {
    var cfg = null;
    try {
      if (typeof _loadPaymentSettings === 'function') cfg = await _loadPaymentSettings(true);
      else if (typeof fbGet === 'function') cfg = await fbGet('settings/payment');
    } catch (e) {}
    // Always merge freshest Firebase settings so defaultDiscountPct is current
    window._paymentSettingsCache = Object.assign({}, window._paymentSettingsCache || {}, cfg || {});
    if (cfg && cfg.defaultDiscountPct != null) window._paymentSettingsCache.defaultDiscountPct = cfg.defaultDiscountPct;

    var plans = getSubscriptionPlans(window._paymentSettingsCache);
    var Lfn = typeof L === 'function' ? L : function (a, b) {
      return b || a;
    };

    if (!isManagerUser()) {
      var ind = plans.filter(function (p) {
        return !p.custom && p.maxMembers === 1;
      })[0] || plans[0];
      return showPlanPayConfirm(ind);
    }

    var rows = plans
      .map(function (p) {
        if (p.custom) {
          return (
            '<button type="button" class="profile-action" style="width:100%;margin-bottom:8px;text-align:left" onclick="closeModal();_openCustomPlanSupport()">' +
            '<div class="pa-icon" style="background:rgba(37,211,102,.12)">💬</div>' +
            '<div><div class="pa-label">' +
            p.label +
            '</div><div class="pa-sub">WhatsApp support for custom quote</div></div>' +
            '<div class="pa-arrow">›</div></button>'
          );
        }
        var payload = encodeURIComponent(JSON.stringify(p));
        return (
          '<button type="button" class="profile-action" style="width:100%;margin-bottom:8px;text-align:left" onclick="closeModal();_showPlanPayConfirm(JSON.parse(decodeURIComponent(\'' +
          payload +
          '\')))">' +
          '<div class="pa-icon" style="background:rgba(249,115,22,.12)">👥</div>' +
          '<div><div class="pa-label">' +
          p.label +
          '</div><div class="pa-sub">₹' +
          p.monthly +
          '/month · Annual ₹' +
          p.annual +
          ' (save ' +
          p.discountPct +
          '%)</div></div>' +
          '<div class="pa-arrow">›</div></button>'
        );
      })
      .join('');

    var html =
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">' +
      Lfn('प्लान चुनें', 'Choose plan') +
      '</div>' +
      '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px">' +
      Lfn('टीम साइज़ के हिसाब से', 'Based on team size') +
      '</div>' +
      rows +
      '<button type="button" class="cancel-btn" style="width:100%;margin-top:8px" onclick="closeModal()">' +
      Lfn('बंद करें', 'Close') +
      '</button>';

    if (typeof openModal === 'function') openModal(html);
  }
  window.openMemberPayPlans = openMemberPayPlans;

  // Helper: build Paid-till profile row HTML
  function paidTillRowHtml(untilDate) {
    var Lfn = typeof L === 'function' ? L : function (a, b) {
      return b || a;
    };
    var color = '#16a34a';
    var daysLeft = 0;
    var expiryStr = '—';
    if (untilDate) {
      var end = new Date(
        untilDate.getFullYear(),
        untilDate.getMonth(),
        untilDate.getDate(),
        23,
        59,
        59,
        999
      );
      daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
      expiryStr = untilDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      if (daysLeft <= 0) color = '#dc2626';
      else if (daysLeft <= 15) color = '#ea580c';
    }
    return (
      '<div class="profile-action" onclick="openMemberPayPlans()" style="cursor:pointer">' +
      '<div class="pa-icon" style="background:rgba(34,197,94,.12)">💳</div>' +
      '<div><div class="pa-label">' +
      Lfn('भुगतान वैध तक', 'Paid till') +
      '</div>' +
      '<div class="pa-sub" style="font-weight:800;color:' +
      color +
      '">' +
      expiryStr +
      ' · ' +
      daysLeft +
      ' ' +
      Lfn('दिन बाकी', 'days left') +
      '</div></div>' +
      '<div class="pa-arrow">›</div></div>'
    );
  }
  window._paidTillRowHtml = paidTillRowHtml;

  // ─── Shift legend colours (align My Shift with Schedule) ───────────────
  var SHIFT_LEGEND_COLORS = {
    D: { bg: '#ea580c', fg: '#fff' },
    N: { bg: '#7c3aed', fg: '#fff' },
    G: { bg: '#2563eb', fg: '#fff' },
    O: { bg: '#64748b', fg: '#fff' },
    L: { bg: '#fb7185', fg: '#fff' },
    H: { bg: '#f97316', fg: '#fff' },
    CO: { bg: '#a16207', fg: '#fff' },
    'C/O': { bg: '#a16207', fg: '#fff' },
    OD: { bg: '#0d9488', fg: '#fff' },
    GP: { bg: '#9333ea', fg: '#fff' },
    '½': { bg: '#f97316', fg: '#fff' },
    Ab: { bg: '#b91c1c', fg: '#fff' },
    A: { bg: '#0284c7', fg: '#fff' },
    B: { bg: '#4f46e5', fg: '#fff' },
    C: { bg: '#0f766e', fg: '#fff' }
  };
  window.SHIFT_LEGEND_COLORS = SHIFT_LEGEND_COLORS;

  function getManagerShiftTimes() {
    // Prefer live manager shift settings if app exposes them
    try {
      if (window._managerShiftTimes && typeof window._managerShiftTimes === 'object')
        return window._managerShiftTimes;
      if (window._cache && window._cache.shiftTimes) return window._cache.shiftTimes;
      if (window.SESSION && SESSION.shiftTimes) return SESSION.shiftTimes;
    } catch (e) {}
    // Fallback defaults matching common plant hours
    return {
      D: ['07:00', '19:00'],
      N: ['19:00', '07:00'],
      G: ['08:00', '20:00'],
      A: ['06:00', '14:00'],
      B: ['14:00', '22:00'],
      C: ['22:00', '06:00']
    };
  }
  window.getManagerShiftTimes = getManagerShiftTimes;

  function shiftLegendLabel(code) {
    var times = getManagerShiftTimes();
    var t = times[code];
    var name = code;
    try {
      if (window.CFG && CFG.shiftLabels && CFG.shiftLabels[code]) name = CFG.shiftLabels[code];
    } catch (e) {}
    if (t && t[0] && t[1]) return code + ' ' + name + ' (' + t[0] + '–' + t[1] + ')';
    return code + ' ' + name;
  }
  window.shiftLegendLabel = shiftLegendLabel;

  // ─── My Shift: reduce scroll-as-select (helper for calendar cells) ─────
  /**
   * Attach to each day cell element.
   * onTap(dayKey), onRangeStart(dayKey), onRangeExtend(dayKey), onRangeEnd()
   */
  function bindMyShiftCellGestures(cell, dayKey, hooks) {
    hooks = hooks || {};
    var startX = 0,
      startY = 0,
      selecting = false,
      moved = false;

    function pd(e) {
      var p = e.touches ? e.touches[0] : e;
      startX = p.clientX;
      startY = p.clientY;
      selecting = false;
      moved = false;
    }
    function pm(e) {
      var p = e.touches ? e.touches[0] : e;
      if (!p) return;
      var dx = Math.abs(p.clientX - startX);
      var dy = Math.abs(p.clientY - startY);
      // Vertical scroll intent → do not select
      if (dy > 12 && dy > dx * 1.2) {
        selecting = false;
        return;
      }
      if (dx > 10 || dy > 10) {
        moved = true;
        if (!selecting && dx >= dy) {
          selecting = true;
          if (hooks.onRangeStart) hooks.onRangeStart(dayKey);
        }
      }
      if (selecting) {
        if (e.cancelable) e.preventDefault();
        if (hooks.onRangeExtend) hooks.onRangeExtend(dayKey);
      }
    }
    function pu() {
      if (selecting) {
        if (hooks.onRangeEnd) hooks.onRangeEnd();
      } else if (!moved) {
        if (hooks.onTap) hooks.onTap(dayKey);
      }
      selecting = false;
      moved = false;
    }

    cell.addEventListener('pointerdown', pd, { passive: true });
    cell.addEventListener('pointermove', pm, { passive: false });
    cell.addEventListener('pointerup', pu, { passive: true });
    cell.addEventListener('pointercancel', pu, { passive: true });
  }
  window.bindMyShiftCellGestures = bindMyShiftCellGestures;

  /**
   * Leave mark payload helper
   * leaveType from Team Leave Quota; if Other → leaveReason free text
   */
  function buildLeavePayload(leaveType, leaveReason) {
    var t = String(leaveType || 'L').trim();
    var r = String(leaveReason || '').trim();
    var isOther = /^other/i.test(t) || t === 'अन्य' || t === 'Others';
    return {
      shift: 'L',
      leaveType: t,
      leaveReason: isOther ? r : r || t
    };
  }
  window.buildLeavePayload = buildLeavePayload;

  function formatLeaveRemark(cellData) {
    if (!cellData) return '';
    var type = cellData.leaveType || '';
    var reason = cellData.leaveReason || cellData.remark || '';
    if (type && reason && reason !== type) return type + ' — ' + reason;
    return reason || type || 'Leave';
  }
  window.formatLeaveRemark = formatLeaveRemark;

  console.info('[mp-commercial] v3.0.7 helpers loaded');
})(typeof window !== 'undefined' ? window : globalThis);
