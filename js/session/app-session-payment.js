/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-login-session.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
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
  // Prefer session cache hydrated at login; fallback fields
  try{
    const candidates = [
      SESSION && SESSION.paymentPaidUntil,
      SESSION && SESSION.paidUntil,
      window._userPaymentPaidUntil
    ];
    for(const c of candidates){
      if(!c) continue;
      const d = new Date(c);
      if(!isNaN(d.getTime())) return d;
    }
  }catch(e){}
  return null;
}

function _paymentGateAllows(tab){
  const t = String(tab||'').toLowerCase();
  // Always free tabs (+ Learn & Grow overlay is never paywalled)
  if(!t || t==='home' || t==='myshift' || t==='my-shift' || t==='learn' || t==='learngrow' || t==='train') return true;
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
        var a = p.amount != null ? p.amount : p;
        var lab = (p && p.label) ? p.label : '';
        return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border2)"><span style="font-weight:700">'+ (lab || ('Plan')) +'</span><span style="font-weight:900;color:#ea580c">₹'+a+'</span></div>';
      }).join('');
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
      if (Array.isArray(po.plans) && po.plans.length) plans = po.plans;
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
      plans = [{amount:99,label:'Individual'},{amount:499,label:'Up to 25'},{amount:999,label:'Up to 50'},{amount:1499,label:'Up to 200'}];
    }
  }
  openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="padding:8px 0 4px">
      ${_customerCareHtml(cc, { showRequestBtn: true, plans: plans })}
      <button type="button" class="cancel-btn" style="margin-top:10px;width:100%" onclick="closeModal()">${typeof L==='function'?L('बंद करें','Close'):'Close'}</button>
    </div>`);
}

async function openCustomerCareAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
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
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
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
    toast('✅ Customer Care saved');
    try{ await publishPublicOfferSnapshot(); }catch(e){}
    closeModal();
  }catch(e){
    toast('❌ '+(e && e.message || 'Save failed'));
  }
}


function openPaymentRequiredModal(attemptedTab){
  _loadPaymentSettings(false).then(async cfg=>{
    if(cfg && cfg.enabled === false){
      _goTabDirect(attemptedTab);
      return;
    }
    // Prefer per-user amount; fallback to global
    let amount = null;
    try{
      amount = parseInt(SESSION && SESSION.paymentAmount || window._userPaymentAmount || 0, 10) || null;
    }catch(e){}
    if(!amount){
      try{
        await _hydrateUserPaymentStatus();
        amount = parseInt(SESSION && SESSION.paymentAmount || window._userPaymentAmount || 0, 10) || null;
      }catch(e){}
    }
    if(!amount) amount = (cfg && cfg.amount) || 999;

    const link = (typeof _resolvePaymentLink==='function')
      ? _resolvePaymentLink(cfg, amount)
      : _paymentLinkForAmount((cfg && cfg.link) || '', amount);
    const title = 'Pay ₹'+amount+' / month';
    const msg = (cfg && cfg.message) || 'After payment, WhatsApp UTR + your registered mobile to +91-8929394920. Access is enabled within a few minutes.';
    const until = _getUserPaidUntilDate();
    const untilStr = until ? until.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';
    const linkBtn = link
      ? `<a href="${link.replace(/"/g,'&quot;')}" target="_blank" rel="noopener" class="big-btn" style="display:block;text-align:center;text-decoration:none;margin-top:12px;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;font-weight:900;padding:14px;border-radius:12px">💳 Pay ₹${amount} / month</a>`
      : `<div style="margin-top:12px;padding:12px;border-radius:10px;background:rgba(239,68,68,.1);color:#b91c1c;font-size:12px">Payment link not set — contact Admin</div>`;
    // Load customer care for refund notice (non-blocking defaults)
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
  }).catch(()=>{
    toast('Payment check failed');
  });
}


async function openPaymentSettingsAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
  const cfg = await _loadPaymentSettings(true);
  const amount = (cfg && cfg.amount) || 999;
  const link = (cfg && cfg.link) || '';
  const enabled = !cfg || cfg.enabled !== false;
  const title = (cfg && cfg.title) || ('Pay ₹'+amount+' / month');
  const message = (cfg && cfg.message) || 'After payment, WhatsApp UTR + your registered mobile to +91-8929394920. Access is enabled within a few minutes.';
  const opts = _getPaymentAmountOptions(cfg);
  window._payAmountOptionsEdit = opts.slice();
  window._payLinksByAmountEdit = Object.assign({}, (cfg && cfg.linksByAmount) || {});

  let userOpts = '<option value="">— Select manager / member —</option>';
  try{
    let mu = _cache.mobileUsers;
    if(!mu) mu = await fbGet('mobileUsers').catch(()=>null);
    if(mu){
      const rows = Object.entries(mu)
        .filter(([k,v])=>v && v.status!=='rejected' && v.status!=='removed')
        .map(([k,v])=>{
          const phone = (typeof _normMobileKey==='function'?_normMobileKey(v.mobile||v.phone||k):String(k).replace(/\D/g,'').slice(-10));
          const role = v.role || 'user';
          const paid = v.paymentPaidUntil || v.paidUntil || '';
          const paidShort = paid ? String(paid).slice(0,10) : 'not set';
          const ua = v.paymentAmount || '';
          return { phone, name: v.name||phone, role, paidShort, ua };
        })
        .sort((a,b)=>String(a.name).localeCompare(String(b.name)));
      userOpts += rows.map(r=>`<option value="${r.phone}">${(r.name||'').replace(/</g,'')} (${r.role}) · ₹${r.ua||'—'} · until ${r.paidShort}</option>`).join('');
    }
  }catch(e){}

  const _trialD = (window._appLicenseCache && parseInt(window._appLicenseCache.freeTrialDays,10)) || 30;
  const defaultPaid = new Date(Date.now()+_trialD*86400000).toISOString().slice(0,10);
  const userAmtOpts = opts.map(a=>`<option value="${a}" ${a===amount?'selected':''}>₹${a}</option>`).join('');

  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">💳 Payment Link & Reminders</div>
  <p style="font-size:12px;color:var(--muted);margin:0 0 12px">Users can open <b>Home</b> and <b>My Shift</b> free. Other tabs show Pay popup after their paid-until date.</p>

  <div class="field"><label>Enable payment gate</label>
    <select id="pay_enabled" class="inp-field">
      <option value="1" ${enabled?'selected':''}>ON — show pay popup</option>
      <option value="0" ${!enabled?'selected':''}>OFF — no payment reminders</option>
    </select>
  </div>
  <div class="field"><label>Default amount (₹ / month)</label>
    <input id="pay_amount" type="number" min="1" class="inp-field" value="${amount}">
  </div>
  <div class="field"><label>Default payment link (fallback)</label>
    <input id="pay_link" type="url" class="inp-field" placeholder="https://rzp.io/i/xxxxx or upi://pay?pa=..." value="${String(link).replace(/"/g,'&quot;')}">
    <div style="font-size:10px;color:var(--muted);margin-top:4px">Used when an amount has no specific link below.</div>
  </div>
  <div class="field"><label>Popup title</label>
    <input id="pay_title" class="inp-field" value="${String(title).replace(/"/g,'&quot;')}">
  </div>
  <div class="field"><label>Popup message</label>
    <textarea id="pay_message" class="inp-field" rows="2">${String(message).replace(/</g,'&lt;')}</textarea>
  </div>

  <div style="margin:14px 0;padding:12px;border-radius:12px;border:1px solid rgba(16,185,129,.35);background:rgba(16,185,129,.08)">
    <div style="font-size:13px;font-weight:900;margin-bottom:6px">📋 Plans · Monthly + Annual payment links</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.45">
      Categorised plans (same as user login):<br>
      <b>₹99</b> Individual (1) · <b>₹499</b> up to 25 · <b>₹999</b> up to 50 · <b>₹1499</b> up to 200<br>
      Also add <b>annual</b> amounts (17% off default): ₹986, ₹4970, ₹9950, ₹14930 — each with its own Razorpay link.
    </div>
    <div id="pay_amount_list" style="margin-bottom:10px"></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <input id="pay_new_amount" type="number" min="1" class="inp-field" style="flex:1;min-width:100px" placeholder="Amount e.g. 999 or 9950">
      <button type="button" class="submit-btn" style="width:auto;padding:10px 14px;margin:0" onclick="payAmountListAdd()">+ Add amount</button>
    </div>
    <div class="field" style="margin-top:10px">
      <label>Default annual discount % (auto-calculates annual price)</label>
      <input id="pay_default_discount" type="number" min="0" max="90" class="inp-field" value="${(cfg&&cfg.defaultDiscountPct!=null)?parseInt(cfg.defaultDiscountPct,10)||17:17}" placeholder="17">
      <div style="font-size:10px;color:var(--muted2);margin-top:4px">Example: ₹99 × 12 × (1−${(cfg&&cfg.defaultDiscountPct!=null)?parseInt(cfg.defaultDiscountPct,10)||17:17}%) = ₹${Math.round(99*12*(1-((cfg&&cfg.defaultDiscountPct!=null)?parseInt(cfg.defaultDiscountPct,10)||17:17)/100))}/year. User sees this % on plan screen.</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
      <button type="button" class="cancel-btn" style="width:auto;padding:8px 10px;margin:0;font-size:11px" onclick="paySeedPlanAmounts()">Seed plan amounts (99/499/999/1499 + annual)</button>
    </div>
  </div>

  <button class="big-btn" style="margin-top:8px" onclick="savePaymentSettingsAdmin()">💾 Save payment settings</button>
  <div style="margin:14px 0;padding:12px;border-radius:12px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.08)">
    <div style="font-size:13px;font-weight:900;margin-bottom:6px">🎬 Landing videos (Admin · 8929397949)</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.45">
      YouTube / Vimeo / direct MP4 links. After Save + <b>Publish to landing page</b>, login screen and marketing page load these videos.
    </div>
    <div class="field"><label>Short video URL (Auto Schedule · one click)</label>
      <input id="pay_video_short" class="inp-field" placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." value="">
    </div>
    <div class="field"><label>Long video URL (Setup + free 15 days)</label>
      <input id="pay_video_long" class="inp-field" placeholder="https://www.youtube.com/watch?v=..." value="">
    </div>
    <div class="field"><label>Optional titles (shown under embeds)</label>
      <input id="pay_video_short_title" class="inp-field" placeholder="Auto Schedule in one click" value="">
      <input id="pay_video_long_title" class="inp-field" style="margin-top:6px" placeholder="Setup + free 15-day trial" value="">
    </div>
  </div>
  <button type="button" class="big-btn" style="margin-top:8px;background:rgba(59,130,246,.2);border:1px solid #3b82f6;color:#93c5fd" onclick="publishPublicOfferSnapshot().then(function(s){if(s){toast('✅ Landing: trial '+ (s.trialDays||0) +'d · videos '+ ((s.videoShortUrl||s.videoLongUrl)?'set':'none') +' · discount '+ (s.annualDiscountPct||0) +'%');try{closeModal();}catch(e){}try{if(typeof goTab==='function')goTab('home');else if(typeof _goTabDirect==='function')_goTabDirect('home');}catch(e2){}}else{toast('⚠️ Publish failed — deploy rules for publicOffer + Admin login');}})">📣 Publish to landing page</button>

  <hr style="margin:18px 0;border:none;border-top:1px solid var(--border2)">
  <div style="font-size:13px;font-weight:900;margin-bottom:8px">📅 Set amount + paid-until for one user</div>
  <div class="field"><label>Manager / Member</label>
    <select id="pay_user" class="inp-field">${userOpts}</select>
  </div>
  <div class="field"><label>Subscription amount</label>
    <select id="pay_user_amount" class="inp-field">${userAmtOpts}</select>
  </div>
  <div class="field"><label>Paid until date</label>
    <input id="pay_until" type="date" class="inp-field" value="${defaultPaid}">
  </div>
  <button class="big-btn" style="margin-top:8px;background:linear-gradient(135deg,#0d9488,#0f766e)" onclick="saveUserPaidUntilAdmin()">✅ Save for user</button>
  <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">Close</button>`);

  try{ payAmountListRender(); }catch(e){}
}

function _getPaymentAmountOptions(cfg){
  const defaults = [199,499,999,1499,2499];
  try{
    const raw = (cfg && (cfg.amountOptions || cfg.amounts)) || window._payAmountOptionsEdit || defaults;
    const arr = (Array.isArray(raw) ? raw : String(raw).split(','))
      .map(x=>parseInt(x,10)).filter(n=>n>0);
    const uniq = [...new Set(arr)].sort((a,b)=>a-b);
    return uniq.length ? uniq : defaults;
  }catch(e){ return defaults; }
}

function payAmountListRender(){
  const el = document.getElementById('pay_amount_list');
  if(!el) return;
  const opts = window._payAmountOptionsEdit || _getPaymentAmountOptions(window._paymentSettingsCache);
  window._payAmountOptionsEdit = opts.slice();
  if(!window._payLinksByAmountEdit || typeof window._payLinksByAmountEdit !== 'object'){
    window._payLinksByAmountEdit = {};
  }
  const links = window._payLinksByAmountEdit;
  if(!opts.length){
    el.innerHTML = '<span style="font-size:12px;color:var(--muted)">No amounts — add one</span>';
    return;
  }
  function planLabel(a){
    const n = Number(a)||0;
    // Rough bands matching product copy
    if(n===99 || n===199) return 'Monthly · Individual';
    if(n===499) return 'Monthly · up to 25';
    if(n===999) return 'Monthly · up to 50';
    if(n===1499 || n===2499) return 'Monthly · up to 200';
    if(n>=900 && n<2000 && n!==999 && n!==1499) return 'Annual / special';
    if(n>=4000) return 'Annual plan';
    return 'Plan';
  }
  el.innerHTML = opts.map((a,i)=>{
    const url = String(links[String(a)] || links[a] || '').replace(/"/g,'&quot;');
    const short = url ? (url.length>28 ? url.slice(0,28)+'…' : url) : '';
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;padding:10px;border-radius:10px;background:#fff;border:1px solid #cbd5e1">
      <div style="min-width:72px">
        <div style="font-weight:900;font-size:14px;color:#0f172a">₹${a}</div>
        <div style="font-size:10px;font-weight:700;color:#64748b">${planLabel(a)}</div>
      </div>
      <input type="url" class="inp-field" style="flex:1;min-width:160px;margin:0;font-size:12px" placeholder="https://rzp.io/… for ₹${a}"
        value="${url}"
        oninput="if(!window._payLinksByAmountEdit)window._payLinksByAmountEdit={};window._payLinksByAmountEdit['${a}']=this.value.trim()">
      <button type="button" onclick="var u=window._payLinksByAmountEdit&&window._payLinksByAmountEdit['${a}'];if(u)window.open(u,'_blank')" title="Open link" style="border:none;background:rgba(16,185,129,.12);color:#059669;border-radius:6px;padding:8px 10px;cursor:pointer;font-size:12px;font-weight:800">↗</button>
      <button type="button" onclick="payAmountListEdit(${i})" title="Edit amount" style="border:none;background:rgba(59,130,246,.12);color:#2563eb;border-radius:6px;padding:8px 10px;cursor:pointer;font-size:12px;font-weight:800">✎</button>
      <button type="button" onclick="payAmountListRemove(${i})" title="Remove" style="border:none;background:rgba(239,68,68,.12);color:#dc2626;border-radius:6px;padding:8px 10px;cursor:pointer;font-size:12px;font-weight:800">✕</button>
    </div>`;
  }).join('');
  // refresh user amount dropdown if open
  try{
    const sel = document.getElementById('pay_user_amount');
    if(sel){
      const cur = sel.value;
      sel.innerHTML = opts.map(a=>`<option value="${a}">₹${a}</option>`).join('');
      if(opts.map(String).includes(String(cur))) sel.value = cur;
    }
  }catch(e){}
}


function paySeedPlanAmounts(){
  const disc = Math.min(90, Math.max(0, parseInt((document.getElementById('pay_default_discount')||{}).value||'17',10)||17));
  const monthly = [99,499,999,1499];
  const annual = monthly.map(m=>Math.round(m*12*(1-disc/100)));
  const amounts = monthly.concat(annual);
  try{
    // UI list uses _payAmountOptionsEdit + _payLinksByAmountEdit (NOT _payAmountRows)
    const opts = Array.isArray(window._payAmountOptionsEdit) ? window._payAmountOptionsEdit.slice() : [];
    amounts.forEach(a=>{
      const n = parseInt(a,10);
      if(!n) return;
      if(!opts.includes(n) && !opts.includes(String(n))) opts.push(n);
    });
    // sort monthly first then annual
    opts.sort((a,b)=>parseInt(a,10)-parseInt(b,10));
    window._payAmountOptionsEdit = opts;
    if(!window._payLinksByAmountEdit || typeof window._payLinksByAmountEdit !== 'object')
      window._payLinksByAmountEdit = {};
    amounts.forEach(a=>{
      const k = String(a);
      if(window._payLinksByAmountEdit[k] == null) window._payLinksByAmountEdit[k] = '';
    });
    if(typeof payAmountListRender==='function') payAmountListRender();
    else if(typeof renderPayAmountList==='function') renderPayAmountList();
    toast('✅ Seeded monthly + annual (discount '+disc+'%: '+annual.join(', ')+') — paste Razorpay links');
  }catch(e){ toast('⚠️ '+(e.message||e)); }
}
function payAmountListAdd(){
  const inp = document.getElementById('pay_new_amount');
  const n = parseInt((inp && inp.value) || '0', 10);
  if(!n || n < 1){ toast('⚠️ Enter a valid amount'); return; }
  const opts = window._payAmountOptionsEdit || [];
  if(opts.includes(n)){ toast('Already in list'); return; }
  opts.push(n);
  opts.sort((a,b)=>a-b);
  window._payAmountOptionsEdit = opts;
  if(inp) inp.value = '';
  payAmountListRender();
}

function payAmountListEdit(i){
  const opts = window._payAmountOptionsEdit || [];
  const cur = opts[i];
  const v = prompt('Edit amount (₹)', String(cur||''));
  if(v===null) return;
  const n = parseInt(v, 10);
  if(!n || n < 1){ toast('⚠️ Invalid'); return; }
  try{
    if(!window._payLinksByAmountEdit) window._payLinksByAmountEdit = {};
    const prevLink = window._payLinksByAmountEdit[String(cur)] || window._payLinksByAmountEdit[cur] || '';
    if(prevLink && n !== cur){
      window._payLinksByAmountEdit[String(n)] = prevLink;
      delete window._payLinksByAmountEdit[String(cur)];
      delete window._payLinksByAmountEdit[cur];
    }
  }catch(e){}
  opts[i] = n;
  window._payAmountOptionsEdit = [...new Set(opts.map(x=>parseInt(x,10)).filter(x=>x>0))].sort((a,b)=>a-b);
  payAmountListRender();
}

function payAmountListRemove(i){
  const opts = window._payAmountOptionsEdit || [];
  if(opts.length <= 1){ toast('⚠️ Keep at least one amount'); return; }
  const removed = opts[i];
  opts.splice(i, 1);
  window._payAmountOptionsEdit = opts;
  try{
    if(window._payLinksByAmountEdit && removed!=null){
      delete window._payLinksByAmountEdit[String(removed)];
      delete window._payLinksByAmountEdit[removed];
    }
  }catch(e){}
  payAmountListRender();
}



/** Landing video URLs — Admin only (hard admin 8929397949). Stored at settings/landingVideos */
async function loadLandingVideosAdmin(){
  try{
    if(typeof fbGet!=='function') return {};
    const v = await fbGet('settings/landingVideos');
    window._landingVideosCache = v || {};
    return window._landingVideosCache;
  }catch(e){ return window._landingVideosCache || {}; }
}
async function fillLandingVideoFields(){
  try{
    const v = await loadLandingVideosAdmin();
    const s = document.getElementById('pay_video_short');
    const l = document.getElementById('pay_video_long');
    const st = document.getElementById('pay_video_short_title');
    const lt = document.getElementById('pay_video_long_title');
    if(s) s.value = (v && v.shortUrl) || '';
    if(l) l.value = (v && v.longUrl) || '';
    if(st) st.value = (v && v.shortTitle) || '';
    if(lt) lt.value = (v && v.longTitle) || '';
  }catch(e){}
}
async function saveLandingVideosFromPaymentForm(){
  if(typeof isAdmin!=='function' || !isAdmin()) return;
  const shortUrl = String((document.getElementById('pay_video_short')||{}).value||'').trim().slice(0,500);
  const longUrl = String((document.getElementById('pay_video_long')||{}).value||'').trim().slice(0,500);
  const shortTitle = String((document.getElementById('pay_video_short_title')||{}).value||'').trim().slice(0,120);
  const longTitle = String((document.getElementById('pay_video_long_title')||{}).value||'').trim().slice(0,120);
  const payload = {
    shortUrl: shortUrl,
    longUrl: longUrl,
    shortTitle: shortTitle || 'Auto Schedule in one click',
    longTitle: longTitle || 'Setup + free 15-day trial',
    updatedAt: new Date().toISOString(),
    updatedBy: (typeof SESSION!=='undefined' && SESSION && SESSION.mobile) ? String(SESSION.mobile) : 'admin'
  };
  window._landingVideosCache = payload;
  if(typeof fbSet==='function') await fbSet('settings/landingVideos', payload);
  else if(typeof fbUpdate==='function') await fbUpdate('settings/landingVideos', payload);
}
window.loadLandingVideosAdmin = loadLandingVideosAdmin;
window.fillLandingVideoFields = fillLandingVideoFields;
window.saveLandingVideosFromPaymentForm = saveLandingVideosFromPaymentForm;

/** Build + write publicOffer snapshot for anonymous landing (v3.2.7). */
async function publishPublicOfferSnapshot() {
  try {
    if (typeof fbSet !== 'function' && typeof fbUpdate !== 'function') return;
    // ALWAYS force-refresh from Firebase so Publish uses latest trial/discount/refund (not stale cache)
    let pay = {};
    try {
      if (typeof _loadPaymentSettings === 'function') pay = (await _loadPaymentSettings(true)) || {};
      else if (typeof fbGet === 'function') pay = (await fbGet('settings/payment')) || {};
    } catch (e0) { pay = window._paymentSettingsCache || {}; }
    window._paymentSettingsCache = pay;
    let lic = {};
    try {
      if (typeof fbGet === 'function') lic = (await fbGet('settings/appLicense')) || {};
    } catch (e1) { lic = window._appLicenseCache || {}; }
    window._appLicenseCache = lic;
    let cc = {};
    try {
      if (typeof fbGet === 'function') cc = (await fbGet('settings/customerCare')) || {};
    } catch (e2) {
      cc = window._customerCareCache || (typeof _defaultCustomerCare === 'function' ? _defaultCustomerCare() : {}) || {};
    }
    window._customerCareCache = cc;
    const amounts = (typeof _getPaymentAmountOptions === 'function')
      ? _getPaymentAmountOptions(pay)
      : (pay.amountOptions || pay.amounts || []);
    const plans = (Array.isArray(amounts) ? amounts : []).map(function (a) {
      const n = parseInt(a, 10);
      if (!(n > 0)) return null;
      return { name: '₹' + n, monthly: n };
    }).filter(Boolean);
    const waRaw = String(cc.whatsapp || '').replace(/\D/g, '');
    let vids = {};
    try {
      if (typeof fbGet === 'function') vids = (await fbGet('settings/landingVideos')) || {};
      else vids = window._landingVideosCache || {};
    } catch (eV) { vids = window._landingVideosCache || {}; }
    // Prefer form values if Admin is publishing from Payment settings modal
    try {
      const fs = document.getElementById('pay_video_short');
      const fl = document.getElementById('pay_video_long');
      const fst = document.getElementById('pay_video_short_title');
      const flt = document.getElementById('pay_video_long_title');
      if (fs || fl) {
        vids = Object.assign({}, vids, {
          shortUrl: fs ? String(fs.value || '').trim() : (vids.shortUrl || ''),
          longUrl: fl ? String(fl.value || '').trim() : (vids.longUrl || ''),
          shortTitle: fst ? String(fst.value || '').trim() : (vids.shortTitle || ''),
          longTitle: flt ? String(flt.value || '').trim() : (vids.longTitle || '')
        });
        window._landingVideosCache = vids;
        try {
          if (typeof fbSet === 'function') await fbSet('settings/landingVideos', Object.assign({}, vids, { updatedAt: new Date().toISOString() }));
        } catch (eSaveV) {}
      }
    } catch (eForm) {}
    const snapshot = {
      paymentEnabled: pay.enabled !== false,
      trialDays: Math.max(0, parseInt(lic.freeTrialDays, 10) || 0),
      plans: plans,
      annualDiscountPct: Math.max(0, Math.min(90, parseInt(pay.defaultDiscountPct, 10) || 0)),
      refundDays: Math.max(0, parseInt(cc.refundDays, 10) || 0),
      supportWhatsApp: waRaw || '',
      supportEmail: String(cc.email || '').trim().slice(0, 120),
      videoShortUrl: String(vids.shortUrl || '').trim().slice(0, 500),
      videoLongUrl: String(vids.longUrl || '').trim().slice(0, 500),
      videoShortTitle: String(vids.shortTitle || 'Auto Schedule in one click').trim().slice(0, 120),
      videoLongTitle: String(vids.longTitle || 'Setup + free 15-day trial').trim().slice(0, 120),
      updatedAt: new Date().toISOString()
    };
    if (typeof fbSet === 'function') await fbSet('publicOffer', snapshot);
    else await fbUpdate('publicOffer', snapshot);
    window._publicOfferCache = snapshot;
    return snapshot;
  } catch (e) {
    console.warn('[publicOffer] publish failed', e && e.message);
    return null;
  }
}
window.publishPublicOfferSnapshot = publishPublicOfferSnapshot;

async function savePaymentSettingsAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
  const enabled = (document.getElementById('pay_enabled')||{}).value === '1';
  const amount = parseInt((document.getElementById('pay_amount')||{}).value||'999',10) || 999;
  const link = String((document.getElementById('pay_link')||{}).value||'').trim();
  const title = String((document.getElementById('pay_title')||{}).value||'').trim() || ('Pay ₹'+amount+' / month');
  const message = String((document.getElementById('pay_message')||{}).value||'').trim();
  const amountOptions = (window._payAmountOptionsEdit && window._payAmountOptionsEdit.length)
    ? window._payAmountOptionsEdit.slice()
    : _getPaymentAmountOptions(window._paymentSettingsCache);
  // Collect per-amount links (from live inputs + edit map)
  const linksByAmount = {};
  try{
    const map = window._payLinksByAmountEdit || {};
    amountOptions.forEach(a=>{
      const key = String(a);
      let url = String(map[key] || map[a] || '').trim();
      if(url) linksByAmount[key] = url;
    });
  }catch(e){}
  try{
    const defaultDiscountPct = Math.min(90, Math.max(0, parseInt((document.getElementById('pay_default_discount')||{}).value||'17',10)||17));
    const payload = {
      enabled, amount, link, title, message,
      amountOptions,
      linksByAmount,
      defaultDiscountPct,
      currency: 'INR',
      updatedAt: new Date().toISOString(),
      updatedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
    };
    await fbUpdate('settings/payment', payload);
    window._paymentSettingsCache = payload;
    window._paymentSettingsAt = Date.now();
    try{ localStorage.setItem('mp_payment_enabled', payload.enabled ? '1' : '0'); }catch(e){}
    toast('✅ Payment settings saved');
    try{ if(typeof saveLandingVideosFromPaymentForm==='function') await saveLandingVideosFromPaymentForm(); }catch(_lv){};
    try{ await publishPublicOfferSnapshot(); }catch(e){}
    try{ closeModal(); }catch(e){}
    try{
      if(typeof goTab==='function') goTab('home');
      else if(typeof _goTabDirect==='function') _goTabDirect('home');
      else if(typeof showTab==='function') showTab('home');
    }catch(e){}
  }catch(err){
    console.error(err);
    toast('❌ Save failed: '+(err.message||err.code||'permission'));
  }
}

async function saveUserPaidUntilAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
  const phone = String((document.getElementById('pay_user')||{}).value||'').replace(/\D/g,'').slice(-10);
  const until = String((document.getElementById('pay_until')||{}).value||'').trim();
  const amt = parseInt((document.getElementById('pay_user_amount')||{}).value||'0',10) || null;
  if(!phone || phone.length!==10){ toast('⚠️ Select user'); return; }
  if(!until){ toast('⚠️ Select date'); return; }
  try{
    const iso = new Date(until+'T23:59:59.000Z').toISOString();
    const payload = {
      paymentPaidUntil: iso,
      paidUntil: iso,
      updatedAt: new Date().toISOString(),
      paymentUpdatedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
    };
    if(amt) payload.paymentAmount = amt;
    let ok = false, errMsg = '';
    try{
      await fbSet('paymentStatus/'+phone, Object.assign({}, payload, { mobile: phone, phone: phone }));
      ok = true;
    }catch(e1){ errMsg = (e1&&e1.message)||''; }
    try{
      await fbUpdate('mobileUsers/'+phone, payload);
      ok = true;
    }catch(e2){
      if(!ok) errMsg = (e2&&e2.message)||errMsg;
    }
    if(!ok) throw new Error(errMsg || 'PERMISSION_DENIED');
    // If this is current session user, refresh local
    try{
      const my = (typeof _normMobileKey==='function'?_normMobileKey(SESSION.mobile):String(SESSION.mobile||'').replace(/\D/g,'').slice(-10));
      if(my === phone){
        SESSION.paymentPaidUntil = iso;
        window._userPaymentPaidUntil = iso;
      }
    }catch(e){}
    toast('✅ Paid until '+until+' saved for '+phone);
  }catch(err){
    console.error(err);
    toast('❌ Save failed: '+(err.message||err.code||'permission'));
  }
}

// Hydrate paidUntil into SESSION after login
/** New mobile: auto paidUntil = first login + 30 days (once only). */
async function _ensureNewUserPaymentTrial(phone, mu, ps){
  try{
    if(!phone) return null;
    // Admin / hard-admin never need trial
    try{
      if(typeof isAdmin==='function' && isAdmin()) return null;
      if(typeof _isHardAdminPhone==='function' && _isHardAdminPhone(phone)) return null;
    }catch(e){}
    const src = Object.assign({}, mu || {}, ps || {});
    // Already has paid-until or trial was granted before → do not overwrite Admin dates
    if(src.paymentPaidUntil || src.paidUntil || src.paymentPaidUntilDate) return null;
    if(src.paymentTrialGranted === true || src.paymentTrialGranted === 'true' || src.paymentTrialGranted === 1) return null;

    const base = new Date();
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 30, 23, 59, 59, 999);
    const iso = end.toISOString();
    const payload = {
      paymentPaidUntil: iso,
      paidUntil: iso,
      paymentTrialGranted: true,
      paymentTrialDays: 30,
      firstLoginAt: (src.firstLoginAt) || base.toISOString(),
      updatedAt: base.toISOString(),
      paymentUpdatedBy: 'auto_trial_30d'
    };
    try{
      await fbSet('paymentStatus/'+phone, Object.assign({}, payload, { mobile: phone, phone: phone }));
    }catch(e){ console.warn('[payTrial] paymentStatus write', e && e.message); }
    try{
      await fbUpdate('mobileUsers/'+phone, payload);
    }catch(e){ console.warn('[payTrial] mobileUsers write', e && e.message); }
    try{
      if(window._cache && window._cache.mobileUsers && window._cache.mobileUsers[phone]){
        Object.assign(window._cache.mobileUsers[phone], payload);
      }
    }catch(e){}
    return payload;
  }catch(e){
    console.warn('[payTrial]', e && e.message);
    return null;
  }
}

async function _hydrateUserPaymentStatus(){
  try{
    if(!SESSION || !SESSION.mobile) return;
    const phone = (typeof _normMobileKey==='function'?_normMobileKey(SESSION.mobile):String(SESSION.mobile||'').replace(/\D/g,'').slice(-10));
    if(!phone) return;
    let mu = await fbGet('mobileUsers/'+phone).catch(()=>null);
    if(!mu){
      // try scan by normalized phone
      try{
        const all = await fbGet('mobileUsers').catch(()=>null) || {};
        for(const [k,v] of Object.entries(all)){
          if(!v) continue;
          const uk = (typeof _normMobileKey==='function'?_normMobileKey(v.mobile||v.phone||k):String(k).replace(/\D/g,'').slice(-10));
          if(uk===phone){ mu = v; break; }
        }
      }catch(e){}
    }
    // Also load paymentStatus/{phone} (admin may save here when mobileUsers write is denied)
    let ps = null;
    try{ ps = await fbGet('paymentStatus/'+phone).catch(()=>null); }catch(e){}

    // New mobile number → paidUntil = first login + 30 days (once)
    try{
      const trial = await _ensureNewUserPaymentTrial(phone, mu, ps);
      if(trial){
        ps = Object.assign({}, ps || {}, trial);
        mu = Object.assign({}, mu || {}, trial);
      }
    }catch(e){}

    const src = Object.assign({}, mu || {}, ps || {});
    if(mu || ps){
      const until = src.paymentPaidUntil || src.paidUntil || src.paymentPaidUntilDate || null;
      if(until){
        SESSION.paymentPaidUntil = until;
        window._userPaymentPaidUntil = until;
      } else {
        SESSION.paymentPaidUntil = null;
        window._userPaymentPaidUntil = null;
      }
      const amt = parseInt(src.paymentAmount || src.subscriptionAmount || 0, 10);
      SESSION.paymentAmount = (amt > 0) ? amt : null;
      window._userPaymentAmount = SESSION.paymentAmount;
    } else {
      SESSION.paymentPaidUntil = null;
      window._userPaymentPaidUntil = null;
      SESSION.paymentAmount = null;
      window._userPaymentAmount = null;
    }
    await _loadPaymentSettings(false);
  }catch(e){}
}
try{
  // Best-effort: run after app start
  if(typeof window !== 'undefined'){
    setTimeout(()=>{ try{ _hydrateUserPaymentStatus(); }catch(e){} }, 2500);
  }
}catch(e){}


async function openAppLicenseAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
  let lic = {};
  try{ lic = await fbGet('settings/appLicense') || {}; }catch(e){}
  const trialDays = parseInt(lic.freeTrialDays,10) || 30;
  const expiry = lic.expiry || (typeof CFG!=='undefined' && CFG.license && CFG.license.expiry
    ? (CFG.license.expiry instanceof Date ? CFG.license.expiry.toISOString().slice(0,10) : String(CFG.license.expiry).slice(0,10))
    : '2026-12-31');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🔑 App License / Expiry</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Whole-app license and free trial for new users</div>
    <div class="field"><label>App license expiry (YYYY-MM-DD)</label>
      <input id="lic_expiry" type="date" class="inp-field" value="${String(expiry).slice(0,10)}">
    </div>
    <div class="field"><label>Free trial days for each NEW user</label>
      <input id="lic_trial_days" type="number" min="1" max="365" class="inp-field" value="${trialDays}">
      <div style="font-size:10px;color:var(--muted2);margin-top:4px">Currently used when a new Manager/Member is approved. Default was 30.</div>
    </div>
    <button class="big-btn" style="margin-top:12px" onclick="saveAppLicenseAdmin()">💾 Save</button>
    <button class="cancel-btn" style="width:100%;margin-top:8px" onclick="closeModal()">Cancel</button>`);
}
async function saveAppLicenseAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()) return;
  const expiry = String((document.getElementById('lic_expiry')||{}).value||'').trim();
  const freeTrialDays = Math.max(1, Math.min(365, parseInt((document.getElementById('lic_trial_days')||{}).value||'30',10)||30));
  try{
    const payload = { expiry, freeTrialDays, updatedAt: new Date().toISOString() };
    await fbSet('settings/appLicense', payload);
    window._appLicenseCache = payload;
    toast('✅ License settings saved · trial '+freeTrialDays+' days');
    try{ await publishPublicOfferSnapshot(); }catch(e){}
    closeModal();
  }catch(e){ toast('❌ '+(e.message||e)); }
}
window.openAppLicenseAdmin = openAppLicenseAdmin;
window.saveAppLicenseAdmin = saveAppLicenseAdmin;


/* Leave reason on any L cell open (Schedule + My Shift) */
(function(){
  function installLeaveReasonHook(){
    if(window._leaveReasonHooked) return;
    if(typeof window.editShiftCell !== 'function') return;
    window._leaveReasonHooked = true;
    const orig = window.editShiftCell;
    window.editShiftCell = function(empId, empName, date, currentShift){
      // If caller set force picker (Change shift from leave details), skip reason modal
      if(window._forceShiftPicker){
        window._forceShiftPicker = false;
        return orig.apply(this, arguments);
      }
      const sh = String(currentShift||'').toUpperCase();
      if(sh==='L' || sh.indexOf('L')===0){
        if(typeof showLeaveReasonForDay === 'function'){
          showLeaveReasonForDay(empId, empName, date, currentShift);
          return;
        }
      }
      return orig.apply(this, arguments);
    };
  }
  installLeaveReasonHook();
  document.addEventListener('firebase-ready', installLeaveReasonHook);
  setTimeout(installLeaveReasonHook, 2000);
  setTimeout(installLeaveReasonHook, 5000);
})();

/* Force G legend text on schedule */
(function mpFixGLegend(){
  function fix(){
    try{
      document.querySelectorAll('.shc, [class*="legend"]').forEach(function(){});
      // text nodes in schedule footer
      document.querySelectorAll('#scheduleScreen, #schedScreen, .sched-wrap, main').forEach(function(root){
        if(!root) return;
        root.querySelectorAll('span, div').forEach(function(el){
          if(el.children.length) return;
          const t = (el.textContent||'').trim();
          if(t === 'General' || t === 'G General' || t === 'General '){
            // find start/end from shift config
            let times = '08:00–20:00';
            try{
              const cfg = typeof getShiftConfigSync==='function' ? getShiftConfigSync() : null;
              const g = (cfg && cfg.shifts||[]).find(s=>s && String(s.code).toUpperCase()==='G');
              if(g && (g.start||g.startTime) && (g.end||g.endTime))
                times = (g.start||g.startTime)+'–'+(g.end||g.endTime);
            }catch(e){}
            el.textContent = 'General Shift · '+times;
          }
        });
      });
    }catch(e){}
  }
  setInterval(fix, 2000);
  document.addEventListener('click', function(){ setTimeout(fix, 400); });
})();

/* OTP step UI: hide learn/install chrome (safe, no MutationObserver) */
(function(){
  function markOtp(on){
    try{
      var ls = document.getElementById('loginScreen');
      if(!ls) return;
      if(on) ls.classList.add('otp-step'); else ls.classList.remove('otp-step');
    }catch(e){}
  }
  var _origShowStep = window.showStep;
  if(typeof _origShowStep === 'function'){
    window.showStep = function(n){
      try{ markOtp(Number(n)===2 || Number(n)===3); }catch(e){}
      return _origShowStep.apply(this, arguments);
    };
  } else {
    // poll lightly until showStep exists
    var t = setInterval(function(){
      if(typeof window.showStep === 'function' && !window.showStep._otpWrapped){
        var o = window.showStep;
        window.showStep = function(n){
          try{ markOtp(Number(n)===2 || Number(n)===3); }catch(e){}
          return o.apply(this, arguments);
        };
        window.showStep._otpWrapped = true;
        clearInterval(t);
      }
    }, 200);
    setTimeout(function(){ clearInterval(t); }, 15000);
  }
})();



(function(){
  var _obs = null;
  function _tryFill(){
    if(document.getElementById('pay_video_short') && typeof fillLandingVideoFields==='function'){
      fillLandingVideoFields();
    }
  }
  if(typeof MutationObserver!=='undefined'){
    _obs = new MutationObserver(function(){ _tryFill(); });
    try{ _obs.observe(document.documentElement,{childList:true,subtree:true}); }catch(e){}
  }
  setInterval(_tryFill, 2000);
})();
