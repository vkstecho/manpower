/**
 * Man Power — Payment GATE (access check, paywall modal, customer care)
 * Split from app-session-payment.js (v6.0.54 Phase 2)
 * Globals unchanged. Load before pay-trial.js / pay-admin.js.
 */
async function _loadPaymentSettings(force){
  const now = Date.now();
  if(!force && window._paymentSettingsCache && (now - window._paymentSettingsAt) < 60000){
    return window._paymentSettingsCache;
  }
  try{
    const s = await fbGet('settings/payment');
    window._paymentSettingsCache = s || {
      enabled: true,
      amount: 999,
      currency: 'INR',
      link: '',
      title: 'Pay ₹999 / month',
      message: 'Subscribe to continue using Schedule, Team, Leave and other tabs.'
    };
    window._paymentSettingsAt = now;
    return window._paymentSettingsCache;
  }catch(e){
    return window._paymentSettingsCache || { enabled:false, amount:999, link:'' };
  }
}

function _isPaymentExemptUser(){
  try{
    if(typeof isAdmin==='function' && isAdmin()) return true;
    if(typeof _isHardAdminPhone==='function' && _isHardAdminPhone(SESSION && SESSION.mobile)) return true;
  }catch(e){}
  return false;
}

function _getUserPaidUntilDate(){
  // Use the LATEST of all known access-end dates (paymentPaidUntil / paidUntil / validTill).
  // Admin may set any of these; earlier code sometimes kept an old payment date and ignored a newer validTill.
  try{
    const candidates = [
      SESSION && SESSION.paymentPaidUntil,
      SESSION && SESSION.paidUntil,
      SESSION && SESSION.validTill,
      window._userPaymentPaidUntil,
      window._userValidTill
    ];
    let best = null;
    for(const c of candidates){
      if(!c) continue;
      const d = new Date(c);
      if(isNaN(d.getTime())) continue;
      if(!best || d.getTime() > best.getTime()) best = d;
    }
    return best;
  }catch(e){}
  return null;
}

/** Live refresh of paidUntil from paymentStatus / mobileUsers (used when SESSION is stale after Admin sets validity). */
async function _refreshUserPaidUntilFromServer(){
  try{
    if(!SESSION || !SESSION.mobile) return null;
    const mobileKey = (typeof _normMobileKey==='function') ? _normMobileKey(SESSION.mobile) : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
    if(!mobileKey || mobileKey.length < 10) return null;
    const cands = [];
    try{
      const ps = await fbGet('paymentStatus/' + mobileKey).catch(function(){return null;});
      if(ps){
        [ps.paymentPaidUntil, ps.paidUntil, ps.paymentPaidUntilDate, ps.validTill].forEach(function(x){ if(x) cands.push(x); });
      }
    }catch(e){}
    try{
      const rec = await fbGet('mobileUsers/' + mobileKey).catch(function(){return null;});
      if(rec){
        [rec.paymentPaidUntil, rec.paidUntil, rec.validTill].forEach(function(x){ if(x) cands.push(x); });
      }
    }catch(e){}
    let bestIso = null, bestTs = 0;
    cands.forEach(function(c){
      const d = new Date(c);
      if(isNaN(d.getTime())) return;
      if(d.getTime() >= bestTs){ bestTs = d.getTime(); bestIso = (typeof c === 'string' ? c : d.toISOString()); }
    });
    if(bestIso){
      SESSION.paymentPaidUntil = bestIso;
      SESSION.paidUntil = bestIso;
      SESSION.validTill = bestIso;
      window._userPaymentPaidUntil = bestIso;
      window._userValidTill = bestIso;
      return new Date(bestIso);
    }
  }catch(e){}
  return null;
}
window._refreshUserPaidUntilFromServer = _refreshUserPaidUntilFromServer;

function _paymentGateAllows(tab){
  const t = String(tab||'').toLowerCase();
  // Always free tabs (+ Learn & Grow overlay is never paywalled)
  if(!t || t==='home' || t==='myshift' || t==='my-shift' || t==='learn' || t==='learngrow' || t==='train' || t==='diary') return true;
  if(_isPaymentExemptUser()) return true;
  const cfg = window._paymentSettingsCache;
  // Only OFF when explicitly disabled
  if(cfg && cfg.enabled === false) return true;
  // paidUntil still valid (end of that calendar day local)
  const until = _getUserPaidUntilDate();
  if(until){
    const end = new Date(until.getFullYear(), until.getMonth(), until.getDate(), 23, 59, 59, 999);
    if(end.getTime() >= Date.now()) return true;
  }
  // SESSION may be stale after Admin sets validity — kick a background live refresh
  // so next navigation / retry unlocks without forcing logout.
  try{
    if(typeof _refreshUserPaidUntilFromServer === 'function'){
      const lastTry = window._paidUntilRefreshAt || 0;
      if(Date.now() - lastTry > 8000){
        window._paidUntilRefreshAt = Date.now();
        _refreshUserPaidUntilFromServer().then(function(d){
          if(d){
            try{
              // Soft-refresh UI that depends on paid status
              if(typeof renderProfileCard === 'function') renderProfileCard();
              if(typeof renderHome === 'function') renderHome();
            }catch(e){}
          }
        }).catch(function(){});
      }
    }
  }catch(e){}
  // Settings not loaded: use last known local flag (default ON after admin saved once)
  if(!cfg){
    try{
      const local = localStorage.getItem('mp_payment_enabled');
      if(local === '0') return true;
      // treat as ON → block until paidUntil set
      try{ _loadPaymentSettings(false).catch(()=>{}); }catch(e){}
      return false;
    }catch(e){ return false; }
  }
  if(cfg.enabled === false) return true;
  // enabled (or missing enabled → ON) and no valid paidUntil → block
  return false;
}

function _getLinksByAmountMap(cfg){
  const out = {};
  try{
    const raw = (cfg && cfg.linksByAmount) || window._payLinksByAmountEdit || {};
    if(raw && typeof raw === 'object' && !Array.isArray(raw)){
      Object.keys(raw).forEach(k=>{
        const n = parseInt(k,10);
        const url = String(raw[k]||'').trim();
        if(n>0 && url) out[String(n)] = url;
      });
    }
  }catch(e){}
  return out;
}
function _resolvePaymentLink(cfg, amount){
  const am = parseInt(amount,10)||999;
  const map = _getLinksByAmountMap(cfg);
  // Exact amount link first, then default link
  let link = (map[String(am)] || (cfg && cfg.link) || '').trim();
  return _paymentLinkForAmount(link, am);
}
function _paymentLinkForAmount(baseLink, amount){
  const am = String(parseInt(amount,10)||999);
  let link = String(baseLink||'').trim();
  if(!link) return '';
  // UPI deep link: set / replace am=
  if(/^upi:\/\//i.test(link) || /^phonepe:\/\//i.test(link) || /^ppe:\/\//i.test(link)){
    if(/[?&]am=/i.test(link)){
      link = link.replace(/([?&])am=[^&]*/i, '$1am='+am);
    } else {
      link += (link.indexOf('?')>=0 ? '&' : '?') + 'am=' + am;
    }
    if(!/[?&]cu=/i.test(link)) link += '&cu=INR';
    return link;
  }
  // Fixed Razorpay / HTTPS links: do NOT rewrite amount query (link is already for that price)
  // Only append am if it looks like a generic template URL
  try{
    if(/^https?:\/\//i.test(link)){
      // Keep rzp.io / razorpay fixed links as-is (per-amount map already chose the right URL)
      if(/rzp\.io|razorpay\.com\/payment|pages\.razorpay/i.test(link)) return link;
      const u = new URL(link);
      u.searchParams.set('amount', am);
      u.searchParams.set('am', am);
      return u.toString();
    }
  }catch(e){}
  return link;
}



// ═══════════════════════════════════════════════════════════
// Plan label helpers (admin Pay-until + team list)
// ═══════════════════════════════════════════════════════════
function _planLabelFromAmount(amount, cfg) {
  const n = parseInt(amount, 10) || 0;
  if (!n) return null;
  cfg = cfg || window._paymentSettingsCache || {};
  let disc = 12;
  try {
    if (cfg.defaultDiscountPct != null)
      disc = Math.min(90, Math.max(0, parseInt(cfg.defaultDiscountPct, 10) || 12));
  } catch (e) {}
  const amounts = (typeof _getPaymentAmountOptions === 'function')
    ? _getPaymentAmountOptions(cfg)
    : [];
  const mmMap = (cfg && cfg.maxMembersByAmount) || {};
  const overrideMm = parseInt(mmMap[String(n)] != null ? mmMap[String(n)] : mmMap[n], 10) || 0;

  function isAnnualAmt(val) {
    const list = (amounts || []).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0; });
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m > 0 && m < val && Math.round(m * 12 * (1 - disc / 100)) === val) return true;
    }
    if (val >= 4000) return true;
    if (val === 1045 || val === 5269 || val === 10549 || val === 15829 || val === 21109 || val === 8437 || val === 31669) return true;
    if ((val > 900 && val < 1200 && val !== 999 && val !== 799) || (val >= 4800 && val < 6000) || (val >= 9000 && val < 12000) || (val >= 14000 && val < 35000)) return true;
    return false;
  }

  const annual = isAnnualAmt(n);
  let maxMembers = overrideMm;
  let band = '';
  if (maxMembers === 1 || n === 99 || n === 199 || n === 1045) {
    band = 'Individual (1 member)';
    maxMembers = maxMembers || 1;
  } else if (maxMembers > 0) {
    band = 'Up to ' + maxMembers + ' members';
  } else if (n === 499 || n === 799 || n === 8437 || (n >= 4800 && n < 9000)) {
    band = 'Up to 30 members';
    maxMembers = 30;
  } else if (n === 999 || n === 1499 || n === 15829 || (n >= 9000 && n < 20000)) {
    band = 'Up to 60 members';
    maxMembers = 60;
  } else if (n === 1999 || n === 2499 || n === 2999 || n === 31669 || (n >= 1400 && n < 4000) || n >= 20000) {
    band = 'Up to 200 members';
    maxMembers = 200;
  } else {
    band = 'Plan';
  }
  const period = annual ? 'annual' : 'monthly';
  const periodLabel = annual ? 'Annual' : 'Monthly';
  return {
    label: band + ' · ' + periodLabel,
    band: band,
    period: period,
    periodLabel: periodLabel,
    amount: n,
    maxMembers: maxMembers
  };
}
window._planLabelFromAmount = _planLabelFromAmount;

function _formatSubscriptionLine(src, cfg) {
  src = src || {};
  cfg = cfg || window._paymentSettingsCache || {};
  const STANDARD = {1:1, 30:1, 60:1, 200:1};
  let teamSize = parseInt(src.teamSize != null ? src.teamSize : (src.maxMembers != null ? src.maxMembers : src.planMaxMembers), 10) || 0;
  let period = src.planPeriod || '';
  let periodLabel = '';
  const amt = parseInt(src.paymentAmount, 10) || 0;

  // Derive from amount if period/size missing
  let meta = null;
  if (amt && typeof _planLabelFromAmount === 'function') {
    try { meta = _planLabelFromAmount(amt, cfg); } catch (e) {}
  }
  if (!period && meta) period = meta.period;
  if (!teamSize && meta) teamSize = meta.maxMembers || 0;
  if (!teamSize && src.planLabel) {
    const m = String(src.planLabel).match(/(\d+)\s*member/i);
    if (m) teamSize = parseInt(m[1], 10) || 0;
    if (/individual/i.test(src.planLabel)) teamSize = teamSize || 1;
  }

  periodLabel = (period === 'annual') ? 'Annual' : (period === 'monthly' || amt || teamSize ? 'Monthly' : '');
  if (!periodLabel && meta) periodLabel = meta.periodLabel || (meta.period === 'annual' ? 'Annual' : 'Monthly');

  if (!teamSize && !periodLabel) return '';

  const isCustom = teamSize > 0 && !STANDARD[teamSize];
  let sizeBit = '';
  if (teamSize === 1) sizeBit = '1 Member';
  else if (teamSize > 0) sizeBit = teamSize + ' Members';

  const parts = [];
  if (periodLabel) parts.push(periodLabel);
  if (isCustom) parts.push('Custom plan');
  if (sizeBit) parts.push(sizeBit);
  // If standard and no custom, e.g. "Monthly · 30 Members"
  return parts.join(' · ');
}
window._formatSubscriptionLine = _formatSubscriptionLine;



function _looksLikeFixedPaymentLink(url) {
  const u = String(url || '').trim();
  if (!u) return false;
  // Incomplete / profile-only pages (common cause of "Amount not valid")
  if (/^https?:\/\/(www\.)?razorpay\.me\/?$/i.test(u)) return false;
  if (/razorpay\.me\/@/i.test(u) && !/\/l\//i.test(u)) return false;
  if (/pay\.me\/@/i.test(u)) return false;
  // Truncated paste
  if (/^[\w.-]*ay\.me\//i.test(u) || /^[\w.-]*azorpay\./i.test(u)) return false;
  // Accept rzp.io short links, payment pages, UPI, generic https
  if (/^https?:\/\//i.test(u) || /^upi:\/\//i.test(u)) return true;
  return false;
}
window._looksLikeFixedPaymentLink = _looksLikeFixedPaymentLink;


// ═══════════════════════════════════════════════════════════
// CUSTOMER CARE + 7-day refund policy (Admin-editable)
// ═══════════════════════════════════════════════════════════
window._customerCareCache = window._customerCareCache || null;

function _defaultCustomerCare(){
  return {
    name: 'Man power App Admin',
    email: 'CareMP@vkstech.com',
    whatsapp: '+91-8929394920',
    refundDays: 7,
    refundPolicy: 'If you are not satisfied with the Man Power subscription, you may request cancellation and a refund within 7 days of payment. Contact Customer Care with your payment reference (UTR / Razorpay payment id) and registered mobile number.',
    updatedAt: null
  };
}

async function _loadCustomerCare(force){
  try{
    if(!force && window._customerCareCache) return window._customerCareCache;
    const s = await fbGet('settings/customerCare').catch(()=>null);
    const d = _defaultCustomerCare();
    const merged = Object.assign({}, d, (s && typeof s === 'object') ? s : {});
    if(!merged.name) merged.name = d.name;
    if(!merged.email) merged.email = d.email;
    if(!merged.whatsapp) merged.whatsapp = d.whatsapp;
    if(!(parseInt(merged.refundDays,10) > 0)) merged.refundDays = d.refundDays;
    if(!merged.refundPolicy) merged.refundPolicy = d.refundPolicy;
    window._customerCareCache = merged;
    return merged;
  }catch(e){
    return window._customerCareCache || _defaultCustomerCare();
  }
}

function _waDigits(wa){
  return String(wa||'').replace(/\D/g,'');
}

function _customerCareHtml(cc, opts){
  opts = opts || {};
  const name = String(cc.name||'Man power App Admin');
  const email = String(cc.email||'CareMP@vkstech.com');
  const wa = String(cc.whatsapp||'+91-8929394920');
  const days = parseInt(cc.refundDays,10) || 7;
  const policy = String(cc.refundPolicy||'');
  const waNum = _waDigits(wa);
  const waLink = waNum ? ('https://wa.me/'+waNum+'?text='+encodeURIComponent('Hi, I need help with Man Power App subscription / refund.')) : '#';
  const mailLink = 'mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('Man Power — Subscription / Refund');
  let body = `
  <div style="text-align:center;margin-bottom:14px">
    <div style="font-size:40px;margin-bottom:6px">🎧</div>
    <div class="modal-title" style="margin-bottom:4px">${opts.title || (typeof L==='function'?L('Customer Care','Customer Care'):'Customer Care')}</div>
    <div style="font-size:12px;color:var(--muted);line-height:1.4">${typeof L==='function'?L('सहायता, रद्द करना और रिफंड','Help, cancel & refund support'):'Help, cancel & refund support'}</div>
  </div>
  <div style="padding:14px;border-radius:14px;border:1px solid var(--border2);background:var(--card);margin-bottom:12px;text-align:left">
    <div style="font-size:11px;font-weight:800;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Contact</div>
    <div style="font-size:15px;font-weight:900;color:var(--text);margin-bottom:10px">${escHtml(name)}</div>
    <a href="${mailLink}" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--border2);text-decoration:none;color:var(--text)">
      <span style="display:inline-flex;width:32px;height:32px;border-radius:8px;background:#2563eb;align-items:center;justify-content:center;flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7l8 5 8-5" stroke="#fff" stroke-width="1.8"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="#fff" stroke-width="1.8"/></svg></span>
      <div>
        <div style="font-size:11px;color:var(--muted2)">Email</div>
        <div style="font-size:13px;font-weight:800;color:#38bdf8">${escHtml(email)}</div>
      </div>
    </a>
    <a href="${waLink}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--border2);text-decoration:none;color:var(--text)">
      <span style="display:inline-flex;width:32px;height:32px;border-radius:8px;background:#25D366;align-items:center;justify-content:center;flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-1.99.491.511-1.93-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span>
      <div>
        <div style="font-size:11px;color:var(--muted2)">WhatsApp</div>
        <div style="font-size:13px;font-weight:800;color:#22c55e">${escHtml(wa)}</div>
      </div>
    </a>
  </div>
  <div style="padding:14px;border-radius:14px;border:1px solid rgba(234,88,12,.35);background:rgba(234,88,12,.08);margin-bottom:12px;text-align:left">
    <div style="font-size:13px;font-weight:900;color:#ea580c;margin-bottom:6px">↩️ ${typeof L==='function'?L(days+' दिन में रद्द / रिफंड', days+'-day cancel & refund'):(days+'-day cancel & refund')}</div>
    <div style="font-size:12px;color:var(--text);line-height:1.55">${escHtml(policy)}</div>
  </div>`;
  // How-to video (from Admin Customer Care / settings/howToVideoUrl)
  const videoUrl = String(cc.howToVideoUrl || cc.videoUrl || window._howToVideoUrl || '').trim();
  if(videoUrl){
    body += `<button type="button" class="big-btn" style="display:block;width:100%;text-align:center;margin:12px 0 4px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:900;padding:14px;border-radius:12px;border:none;cursor:pointer" onclick="window.open('${videoUrl.replace(/'/g,"\'")}',' _blank','noopener')">▶ ${typeof L==='function'?L('How to use — Shift Management','How to use — Shift Management'):'How to use — Shift Management'}</button>`;
  } else {
    body += `<button type="button" class="cancel-btn" style="display:block;width:100%;text-align:center;margin:12px 0 4px;padding:12px" onclick="typeof openHowToVideo==='function'&&openHowToVideo()">▶ ${typeof L==='function'?L('How to use video','How to use video'):'How to use video'}</button>`;
  }
  // Pricing table (admin amounts)
  try {
    var planRows = opts.plansHtml || '';
    if (!planRows && opts.plans && opts.plans.length) {
      planRows = opts.plans.map(function(p){
        var a = null, lab = '';
        if (p != null && typeof p === 'object') {
          a = p.amount != null ? p.amount : (p.price != null ? p.price : (p.monthly != null ? p.monthly : null));
          if (a != null && typeof a === 'object') a = a.amount != null ? a.amount : (a.price != null ? a.price : null);
          lab = p.label || p.name || p.band || '';
          if (lab && typeof lab === 'object') lab = lab.label || lab.name || '';
          if (p.period) lab = (lab ? lab + ' · ' : '') + String(p.period);
        } else {
          a = p;
        }
        a = Number(a);
        if (!(a > 0)) return '';
        lab = String(lab || ('Plan')).replace(/</g,'');
        return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border2)"><span style="font-weight:700">'+ lab +'</span><span style="font-weight:900;color:#ea580c">₹'+a+'</span></div>';
      }).filter(Boolean).join('');
    }
    if (planRows) {
      body += '<div style="padding:14px;border-radius:14px;border:1px solid var(--border2);background:var(--card);margin-bottom:12px;text-align:left">'
        + '<div style="font-size:11px;font-weight:800;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Plans (from Admin)</div>'
        + planRows
        + '<div style="font-size:11px;color:var(--muted2);margin-top:10px;line-height:1.4">Need a custom amount or special features? WhatsApp / Email Customer Care.</div></div>';
    }
  } catch (ePl) {}

    if(opts.showRequestBtn){
    body += `<a href="${waLink}" target="_blank" rel="noopener" class="big-btn" style="display:block;text-align:center;text-decoration:none;margin-top:4px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:900;padding:14px;border-radius:12px">💬 ${typeof L==='function'?L('WhatsApp पर Cancel / Refund माँगें','Request Cancel / Refund on WhatsApp'):'Request Cancel / Refund on WhatsApp'}</a>
    <a href="${mailLink}" class="cancel-btn" style="display:block;text-align:center;text-decoration:none;margin-top:8px;padding:12px">✉️ ${typeof L==='function'?L('Email भेजें','Send Email'):'Send Email'}</a>`;
  }
  return body;
}

async function openCustomerCarePage(){
  try{ if(typeof closeNavMoreSheet==='function') closeNavMoreSheet(); }catch(e){}
  const cc = await _loadCustomerCare(true);
  var plans = [];
  try {
    var po = await fetch('https://metpowervks-default-rtdb.asia-southeast1.firebasedatabase.app/publicOffer.json').then(function(r){ return r.json(); });
    if (po) {
      if (Array.isArray(po.plans) && po.plans.length) {
        plans = po.plans.map(function(p){
          if (p != null && typeof p === 'object') {
            var a = p.amount != null ? p.amount : (p.price != null ? p.price : p.monthly);
            if (a != null && typeof a === 'object') a = a.amount || a.price || a.monthly;
            return { amount: Number(a)||0, label: p.label || p.name || p.band || 'Plan', period: p.period||'' };
          }
          return { amount: Number(p)||0, label: 'Plan' };
        }).filter(function(x){ return x.amount > 0; });
      }
      if (po.refundDays) cc.refundDays = po.refundDays;
    }
  } catch (e0) {}
  if (!plans.length) {
    try {
      var pay = window._paymentSettingsCache;
      if (!pay && typeof fbGet === 'function') {
        try { pay = await fbGet('settings/payment'); window._paymentSettingsCache = pay; } catch (e1) {}
      }
      var amounts = (pay && (pay.amountOptions || pay.amounts)) || [99,499,999,1499];
      plans = (Array.isArray(amounts) ? amounts : [99,499,999,1499]).map(function(a){
        return { amount: a, label: 'Plan' };
      });
    } catch (e2) {
      plans = [{amount:99,label:'Individual'},{amount:499,label:'Up to 30'},{amount:999,label:'Up to 60'},{amount:1499,label:'Up to 200'}];
    }
  }
  openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="padding:8px 0 48px;min-height:0">
      ${_customerCareHtml(cc, { showRequestBtn: true, plans: plans })}
      <button type="button" class="cancel-btn" style="margin-top:10px;width:100%" onclick="closeModal()">${typeof L==='function'?L('बंद करें','Close'):'Close'}</button>
      <div style="height:24px" aria-hidden="true"></div>
    </div>`);
}

async function openCustomerCareAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const cc = await _loadCustomerCare(true);
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">🎧 Customer Care settings</div>
  <p style="font-size:12px;color:var(--muted);margin:0 0 12px">Shown on Customer Care page and on the subscription pay screen. Users can request cancel/refund within the days you set.</p>
  <div class="field"><label>Name</label>
    <input id="cc_name" class="inp-field" value="${String(cc.name||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>Email</label>
    <input id="cc_email" type="email" class="inp-field" value="${String(cc.email||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>WhatsApp number</label>
    <input id="cc_whatsapp" class="inp-field" placeholder="+91-8929394920" value="${String(cc.whatsapp||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>How to use video URL (YouTube)</label>
    <input id="cc_howto_video" class="inp-field" placeholder="https://youtube.com/watch?v=..." value="${String((cc.howToVideoUrl||cc.videoUrl||window._howToVideoUrl||'')).replace(/"/g,'&quot;')}">
    <div style="font-size:10px;color:var(--muted2);margin-top:4px">Shown on login page + Customer Care tab for all users</div>
  </div>
  <div class="field"><label>Refund window (days)</label>
    <input id="cc_days" type="number" min="1" max="90" class="inp-field" value="${parseInt(cc.refundDays,10)||7}">
  </div>
  <div class="field"><label>Refund / cancel policy text</label>
    <textarea id="cc_policy" class="inp-field" rows="4">${String(cc.refundPolicy||'').replace(/</g,'&lt;')}</textarea>
  </div>
  <button class="submit-btn" onclick="saveCustomerCareAdmin()">💾 Save</button>
  <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">Cancel</button>
  <button type="button" class="cancel-btn" style="margin-top:8px" onclick="closeModal();openCustomerCarePage()">👁 Preview page</button>`);
}

async function saveCustomerCareAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const name = String((document.getElementById('cc_name')||{}).value||'').trim() || 'Man power App Admin';
  const email = String((document.getElementById('cc_email')||{}).value||'').trim() || 'CareMP@vkstech.com';
  const whatsapp = String((document.getElementById('cc_whatsapp')||{}).value||'').trim() || '+91-8929394920';
  const howToVideoUrl = String((document.getElementById('cc_howto_video')||{}).value||'').trim();
  const refundDays = Math.max(1, Math.min(90, parseInt((document.getElementById('cc_days')||{}).value||'7',10)||7));
  const refundPolicy = String((document.getElementById('cc_policy')||{}).value||'').trim() || _defaultCustomerCare().refundPolicy;
  try{
    const payload = {
      name, email, whatsapp, howToVideoUrl, refundDays, refundPolicy,
      updatedAt: new Date().toISOString(),
      updatedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
    };
    await fbSet('settings/customerCare', payload);
    window._customerCareCache = payload;
    // Also store dedicated how-to path for login page
    if(howToVideoUrl){
      try{ await fbSet('settings/howToVideoUrl', {url: howToVideoUrl, updatedAt: payload.updatedAt}); }catch(e2){}
      window._howToVideoUrl = howToVideoUrl;
    }
    try{window._customerCareCache={name,email,whatsapp,howToVideoUrl,refundDays,refundPolicy};}catch(eC){} toast(L('✅ ग्राहक सेवा सहेजी गई','✅ Customer Care saved'));
    try{ await publishPublicOfferSnapshot(); }catch(e){}
    closeModal();
  }catch(e){
    toast(L('❌ ','❌ ')+(e && e.message || L('सहेजना विफल','Save failed')));
  }
}


function openPaymentRequiredModal(attemptedTab){
  // Always re-hydrate before showing paywall — Admin may have just extended validTill / paymentPaidUntil
  Promise.resolve()
    .then(async function(){
      try{ await _hydrateUserPaymentStatus(); }catch(e){}
      try{ await _loadPaymentSettings(false); }catch(e){}
      // If access is now valid, do NOT show paywall — open the requested tab
      if(_paymentGateAllows(attemptedTab || 'home')){
        try{
          if(typeof _goTabDirect === 'function') _goTabDirect(attemptedTab || 'home');
          else if(typeof goTab === 'function') goTab(attemptedTab || 'home');
        }catch(e){}
        return;
      }
      const cfg = await _loadPaymentSettings(true);
      const amount = (SESSION && SESSION.paymentAmount) || (cfg && cfg.amount) || 799;
      const link = (typeof _resolvePaymentLink === 'function')
        ? _resolvePaymentLink(cfg, amount)
        : ((cfg && cfg.link) || '');
      const title = (cfg && cfg.title) || ('Pay ₹' + amount + ' / month');
      const msg = (cfg && cfg.message) || 'Subscribe to continue using Schedule, Team, Leave and other tabs.';
      const until = _getUserPaidUntilDate();
      const untilStr = until ? until.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';
      const linkBtn = link
        ? `<a href="${link.replace(/"/g,'&quot;')}" target="_blank" rel="noopener" class="big-btn" style="display:block;text-align:center;text-decoration:none;margin-top:12px;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;font-weight:900;padding:14px;border-radius:12px">💳 Pay ₹${amount} / month</a>`
        : `<div style="margin-top:12px;padding:12px;border-radius:10px;background:rgba(239,68,68,.1);color:#b91c1c;font-size:12px">Payment link not set — contact Admin</div>`;
      let cc = window._customerCareCache || null;
      try{ cc = await _loadCustomerCare(false); }catch(e){ cc = _defaultCustomerCare(); }
      if(!cc) cc = _defaultCustomerCare();
      const days = parseInt(cc.refundDays,10)||7;
      const refundBox = `<div style="margin-top:12px;padding:12px;border-radius:12px;border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.08);text-align:left">
      <div style="font-size:12px;font-weight:900;color:#16a34a;margin-bottom:4px">↩️ ${days}-day cancel & refund</div>
      <div style="font-size:11px;color:var(--text);line-height:1.45;margin-bottom:8px">${escHtml(String(cc.refundPolicy||'').slice(0,280))}</div>
      <button type="button" onclick="closeModal();openCustomerCarePage()" style="border:none;background:transparent;color:#38bdf8;font-weight:800;font-size:12px;padding:0;cursor:pointer;text-decoration:underline">🎧 Customer Care / Request refund ›</button>
    </div>`;
      openModal(`<div class="modal-handle"></div>
      <div style="text-align:center;padding:8px 0 4px">
        <div style="font-size:42px;margin-bottom:8px">💳</div>
        <div class="modal-title" style="margin-bottom:6px">${title}</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.45;margin-bottom:8px">${String(msg).replace(/</g,'')}</div>
        ${untilStr?`<div style="font-size:12px;color:#b45309;margin-bottom:8px">Previous access till: <b>${untilStr}</b></div>`:''}
        ${linkBtn}
        ${refundBox}
        <button type="button" class="cancel-btn" style="margin-top:10px;width:100%" onclick="closeModal();goTab('home')">← Back to Home</button>
      </div>`);
    })
    .catch(function(){ toast(L('भुगतान जाँच विफल','Payment check failed')); });
}


