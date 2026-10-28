/**
 * Man Power v3.0.7 — Commercial / UX add-on
 * Include AFTER firebase-init and app core scripts:
 *   <script src="js/mp-commercial.js?v=300007"></script>
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
    [
      'loginPwaBtn',
      'loginAndroidStoreBtn',
      'loginInstallRow',
      'pwaInstallBtn',
      'pwaBanner'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = hide ? 'none' : '';
    });
    if (hide) {
      var android = document.getElementById('loginAndroidStoreBtn');
      if (android) android.style.display = 'none';
    }
  }

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

    var html =
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">📤 Share App</div>' +
      '<div style="font-size:12px;color:var(--muted2);margin:0 0 14px;line-height:1.45">Choose platform</div>' +
      '<button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left" onclick="closeModal();_doPlatformShare && _doPlatformShare(\'ios\')">' +
      '<div class="pa-icon" style="background:rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;font-size:22px"></div>' +
      '<div><div class="pa-label">iPhone / iPad / Desktop</div><div class="pa-sub">Web app · Install as PWA</div></div>' +
      '<div class="pa-arrow">›</div></button>' +
      '<button type="button" class="profile-action" style="width:100%;margin-bottom:10px;text-align:left" onclick="closeModal();_doPlatformShare && _doPlatformShare(\'android\')">' +
      '<div class="pa-icon" style="background:rgba(1,135,95,.15);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#01875f">▶</div>' +
      '<div><div class="pa-label">Android</div><div class="pa-sub">Google Play Store</div></div>' +
      '<div class="pa-arrow">›</div></button>' +
      '<button type="button" class="cancel-btn" style="width:100%;margin-top:4px" onclick="closeModal()">Cancel</button>';

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
      { id: 'm1', label: 'Individual (1 member)', maxMembers: 1, monthly: 99, discountPct: 17 },
      { id: 'm25', label: 'Up to 25 members', maxMembers: 25, monthly: 499, discountPct: 17 },
      { id: 'm50', label: 'Up to 50 members', maxMembers: 50, monthly: 999, discountPct: 17 },
      { id: 'm200', label: 'Up to 200 members', maxMembers: 200, monthly: 1499, discountPct: 17 },
      { id: 'custom', label: 'Customized plan', custom: true }
    ];
  }

  function getSubscriptionPlans(cfg) {
    var fromAdmin =
      cfg && Array.isArray(cfg.plans) && cfg.plans.length ? cfg.plans : defaultPlans();
    // Global default discount from Admin (settings/payment.defaultDiscountPct)
    var globalDisc = 17;
    try {
      if (cfg && cfg.defaultDiscountPct != null) globalDisc = parseInt(cfg.defaultDiscountPct, 10) || 17;
      if (cfg && cfg.planDiscounts && typeof cfg.planDiscounts === 'object') {
        /* per-amount override e.g. { "99": 17, "499": 20 } */
      }
    } catch (e) {}
    return fromAdmin.map(function (p) {
      if (p.custom) return p;
      var monthly = parseInt(p.monthly, 10) || 0;
      var discountPct = parseInt(p.discountPct, 10);
      if (isNaN(discountPct)) {
        try {
          if (cfg && cfg.planDiscounts && cfg.planDiscounts[String(monthly)] != null)
            discountPct = parseInt(cfg.planDiscounts[String(monthly)], 10);
        } catch (e2) {}
      }
      if (isNaN(discountPct)) discountPct = globalDisc;
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

    if (monthlyLink) {
      html +=
        '<a class="big-btn" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;font-weight:900;padding:14px;border-radius:12px" target="_blank" rel="noopener" href="' +
        monthlyLink.replace(/"/g, '&quot;') +
        '">Pay ₹' +
        plan.monthly +
        ' / month</a>';
    }
    if (annualLink) {
      html +=
        '<a class="big-btn" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-weight:900;padding:14px;border-radius:12px" target="_blank" rel="noopener" href="' +
        annualLink.replace(/"/g, '&quot;') +
        '">Pay ₹' +
        plan.annual +
        ' / year</a>';
    }
    if (!monthlyLink && !annualLink) {
      html +=
        '<div style="padding:12px;border-radius:10px;background:rgba(239,68,68,.1);color:#b91c1c;font-size:12px;margin-bottom:10px">Payment link not set — contact Admin / WhatsApp ' +
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
    window._paymentSettingsCache = cfg || window._paymentSettingsCache || {};

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
