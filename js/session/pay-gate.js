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
    const settings = await fbGet('settings/payment');
    window._paymentSettingsCache = settings || {};
    window._paymentSettingsAt = now;
    return window._paymentSettingsCache;
  } catch (_) {
    return force ? {} : (window._paymentSettingsCache || {});
  }
}

function _commercialIdentityKey(){
  return JSON.stringify([window._fbAuth?.currentUser?.uid,SESSION.role,SESSION.empObjId,
    SESSION.managerUid,SESSION.companyId,SESSION.rosterLinked]);
}
function _currentCommercialEntitlement(){
  const current = window._verifiedCommercialEntitlement;
  return current?.uid && current.uid === window._fbAuth?.currentUser?.uid && (!current.identity || current.identity === _commercialIdentityKey()) && Date.now() - current.checkedAt < 60000 ? current : null;
}

function _isPaymentExemptUser(){
  return _currentCommercialEntitlement()?.admin === true;
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
  return _hydrateUserPaymentStatus();
}
window._refreshUserPaidUntilFromServer = _refreshUserPaidUntilFromServer;

function _paymentAccessState(tab) {
  const key = String(tab || '').toLowerCase();
  if (['','home','myshift','my-shift','learn','learngrow','train','diary'].includes(key)) return 'allowed';
  const user = window._fbAuth?.currentUser;
  if (!user || user.isAnonymous) return 'unauthenticated';
  const entitlement = _currentCommercialEntitlement();
  if (entitlement?.admin === true || entitlement?.enabled === false ||
      (entitlement?.paidUntil && Date.parse(entitlement.paidUntil) >= Date.now())) return 'allowed';
  if (entitlement) return 'expired';
  return _commercialRequest?.uid === user.uid ? 'loading' : 'unavailable';
}
function _paymentGateAllows(tab) {
  return _paymentAccessState(tab) === 'allowed';
}

function _getLinksByAmountMap(cfg) {
  const links = {};
  for (const plan of MP_CATALOG.read(cfg?.commercial)?.plans || []) {
    for (const period of MP_CATALOG.periods) if (plan.links[period]) links[plan[period]] = plan.links[period];
  }
  return links;
}
function _resolvePaymentLink(cfg, value) {
  const match = MP_CATALOG.planByAmount(MP_CATALOG.read(cfg?.commercial), value);
  return match?.plan.links[match.period] || '';
}
function _planLabelFromAmount(amount, cfg) {
  const match = MP_CATALOG.planByAmount(MP_CATALOG.read(cfg?.commercial), amount);
  return match && {label:match.plan.name, amount:match.plan[match.period], period:match.period, maxMembers:match.plan.limit,
    periodLabel:match.period === 'annual' ? 'Annual' : 'Monthly'};
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

  periodLabel = (period === 'annual') ? 'Annual' : (period === 'monthly' ? 'Monthly' : '');
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



function _looksLikeFixedPaymentLink(url) { return Boolean(MP_CATALOG.cleanPaymentLink(url)); }

function _defaultCustomerCare(){
  return {
    name: 'Man power App Admin',
    email: 'CareMP@vkstech.com',
    whatsapp: '',
    refundDays: 0, refundPolicy: '', refundPolicyHi: '',
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
  const wa = String(cc.whatsapp||'');
  const policy = String((_lang === 'hi' && cc.refundPolicyHi) || cc.refundPolicy || L('भुगतान से पहले रिफंड नीति की पुष्टि के लिए सहायता से संपर्क करें।','Contact support to confirm the refund policy before payment.'));
  const digits = _waDigits(wa);
  const waNum = digits.length === 10 ? '91' + digits : digits;
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
${waNum ? `    <a href="${waLink}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--border2);text-decoration:none;color:var(--text)">
      <span style="display:inline-flex;width:32px;height:32px;border-radius:8px;background:#25D366;align-items:center;justify-content:center;flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.144-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-1.99.491.511-1.93-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span>
      <div>
        <div style="font-size:11px;color:var(--muted2)">WhatsApp</div>
        <div style="font-size:13px;font-weight:800;color:#22c55e">${escHtml(wa)}</div>
      </div>
    </a>` : ''}
  </div>
  <div style="padding:14px;border-radius:14px;border:1px solid rgba(234,88,12,.35);background:rgba(234,88,12,.08);margin-bottom:12px;text-align:left">
    <div style="font-size:13px;font-weight:900;color:#ea580c;margin-bottom:6px">↩️ ${typeof L==='function'?L('रद्दीकरण और रिफंड नीति','Cancellation and refund policy'):(days+'-day cancel & refund')}</div>
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
    if (waNum) body += `<a href="${waLink}" target="_blank" rel="noopener" class="big-btn" style="display:block;text-align:center;text-decoration:none;margin-top:4px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:900;padding:14px;border-radius:12px">💬 ${typeof L==='function'?L('WhatsApp पर Cancel / Refund माँगें','Request Cancel / Refund on WhatsApp'):'Request Cancel / Refund on WhatsApp'}</a>`;
    body += `
    <a href="${mailLink}" class="cancel-btn" style="display:block;text-align:center;text-decoration:none;margin-top:8px;padding:12px">✉️ ${typeof L==='function'?L('Email भेजें','Send Email'):'Send Email'}</a>`;
  }
  return body;
}

async function openCustomerCarePage(){
  try{ if(typeof closeNavMoreSheet==='function') closeNavMoreSheet(); }catch(e){}
  const cc = await _loadCustomerCare(true);
  openModal(_customerCareHtml(cc) + '<button class="cancel-btn" type="button" onclick="closeModal()">'+L('बंद करें','Close')+'</button>');
}

async function openCustomerCareAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const cc = await _loadCustomerCare(true);
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">🎧 Customer Care settings</div>
  <p style="font-size:12px;color:var(--muted);margin:0 0 12px">Shown on Customer Care page and on the subscription pay screen. Publish the cancellation and refund terms you actually offer.</p>
  <div class="field"><label>Name</label>
    <input id="cc_name" class="inp-field" value="${String(cc.name||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>Email</label>
    <input id="cc_email" type="email" class="inp-field" value="${String(cc.email||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>WhatsApp number</label>
    <input id="cc_whatsapp" class="inp-field" placeholder="9000000000" value="${String(cc.whatsapp||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>How to use video URL (YouTube)</label>
    <input id="cc_howto_video" class="inp-field" placeholder="https://youtube.com/watch?v=..." value="${String((cc.howToVideoUrl||cc.videoUrl||window._howToVideoUrl||'')).replace(/"/g,'&quot;')}">
    <div style="font-size:10px;color:var(--muted2);margin-top:4px">Shown on login page + Customer Care tab for all users</div>
  </div>
  <div class="field"><label>Refund window (days)</label>
    <input id="cc_days" type="number" min="1" max="90" class="inp-field" value="${parseInt(cc.refundDays,10)||''}">
  </div>
  <div class="field"><label>Refund / cancel policy text</label>
    <textarea id="cc_policy" class="inp-field" rows="4">${String(cc.refundPolicy||'').replace(/</g,'&lt;')}</textarea>
  </div>
  <div class="field"><label>Refund / cancellation policy (Hindi)</label><textarea id="cc_policy_hi" class="inp-field" rows="4">${escHtml(cc.refundPolicyHi||'')}</textarea></div>
  <button class="submit-btn" onclick="saveCustomerCareAdmin()">💾 Save</button>
  <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">Cancel</button>
  <button type="button" class="cancel-btn" style="margin-top:8px" onclick="closeModal();openCustomerCarePage()">👁 Preview page</button>`);
}

async function saveCustomerCareAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const name = String((document.getElementById('cc_name')||{}).value||'').trim() || 'Man power App Admin';
  const email = String((document.getElementById('cc_email')||{}).value||'').trim() || 'CareMP@vkstech.com';
  const whatsapp = String((document.getElementById('cc_whatsapp')||{}).value||'').trim();
  const howToVideoUrl = String((document.getElementById('cc_howto_video')||{}).value||'').trim();
  const refundDays = Math.max(0, Math.min(90, parseInt(document.getElementById('cc_days')?.value,10)||0));
  const refundPolicy = String((document.getElementById('cc_policy')||{}).value||'').trim() || _defaultCustomerCare().refundPolicy;
  const refundPolicyHi = String(document.getElementById('cc_policy_hi')?.value || '').trim();
  try{
    const payload = {
      name, email, whatsapp, howToVideoUrl, refundDays, refundPolicy, refundPolicyHi,
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
    try{window._customerCareCache=payload;}catch(eC){} toast(L('✅ ग्राहक सेवा सहेजी गई','✅ Customer Care saved'));
    try{ await publishPublicOfferSnapshot(); }catch(e){}
    closeModal();
  }catch(e){
    toast(L('❌ ','❌ ')+(e && e.message || L('सहेजना विफल','Save failed')));
  }
}


async function openPaymentRequiredModal(attemptedTab, stillRequested = () => true) {
  if (!stillRequested() || _paymentAccessState(attemptedTab) !== 'expired') return;
  openModal('<div class="modal-title">'+L('सदस्यता की अवधि पूरी हुई','Subscription access has ended')+'</div>'
    +'<p>'+L('Home और My Shift उपलब्ध हैं। अन्य सुविधाओं के लिए सदस्यता विकल्प देखें।','Home and My Shift remain available. View subscription options for the other features.')+'</p>'
    +'<button type="button" class="submit-btn" onclick="openMemberPayPlans()">'+L('सदस्यता विकल्प','Subscription options')+'</button>'
    +'<button type="button" class="cancel-btn" onclick="closeModal()">'+L('बंद करें','Close')+'</button>');
}
