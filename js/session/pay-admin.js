/**
 * Man Power — Payment ADMIN (settings, Pay until, landing videos, app license)
 * Split from app-session-payment.js (v6.0.54 Phase 2)
 * Load after pay-gate.js (uses _loadPaymentSettings / link helpers).
 */
async function openPaymentSettingsAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const cfg = await _loadPaymentSettings(true);
  const amount = (cfg && cfg.amount) || 999;
  const link = (cfg && cfg.link) || '';
  const enabled = !cfg || cfg.enabled !== false;
  const title = (cfg && cfg.title) || ('Pay ₹'+amount+' / month');
  const message = (cfg && cfg.message) || 'After payment, WhatsApp UTR + your registered mobile to +91-8929394920. Access is enabled within a few minutes.';
  const opts = _getPaymentAmountOptions(cfg);
  window._payAmountOptionsEdit = opts.slice();
  window._payLinksByAmountEdit = Object.assign({}, (cfg && cfg.linksByAmount) || {});
  window._payMaxMembersByAmountEdit = Object.assign({}, (cfg && cfg.maxMembersByAmount) || {});
  // Seed defaults for known monthly bands if not yet set
  (function seedMm(){
    var defaults = { '99':1, '199':1, '499':30, '799':60, '999':60, '1499':60, '1999':200, '2499':200, '2999':200 };
    opts.forEach(function(a){
      var k = String(a);
      if(window._payMaxMembersByAmountEdit[k] == null && defaults[k] != null)
        window._payMaxMembersByAmountEdit[k] = defaults[k];
    });
  })();

  let userOpts = '<option value="">— Select manager / member —</option>';
  try{
    let mu = _cache.mobileUsers;
    if(!mu) mu = await fbGet('mobileUsers').catch(()=>null);
    const byPhone = {};
    if(mu){
      Object.entries(mu).forEach(function(pair){
        const k = pair[0], v = pair[1];
        if(!v || v.status==='rejected' || v.status==='removed' || v.role==='removed') return;
        const phone = (typeof _normMobileKey==='function'?_normMobileKey(v.mobile||v.phone||k):String(k).replace(/\D/g,'').slice(-10));
        if(!phone || phone.length!==10) return;
        const paid = v.paymentPaidUntil || v.paidUntil || '';
        byPhone[phone] = {
          phone: phone,
          name: v.name||phone,
          role: v.role || 'user',
          paidShort: paid ? String(paid).slice(0,10) : 'not set',
          ua: v.paymentAmount || ''
        };
      });
    }
    // v6.0.49: also list paymentStatus-only phones (e.g. after delete, sticky pay record)
    try{
      const allPs = await fbGet('paymentStatus').catch(function(){return null;}) || {};
      Object.entries(allPs).forEach(function(pair){
        const k = pair[0], v = pair[1];
        if(!v || v.status==='cleared_on_delete') return;
        const phone = (typeof _normMobileKey==='function'?_normMobileKey(v.mobile||v.phone||k):String(k).replace(/\D/g,'').slice(-10));
        if(!phone || phone.length!==10) return;
        if(byPhone[phone]){
          if((!byPhone[phone].paidShort || byPhone[phone].paidShort==='not set') && (v.paymentPaidUntil||v.paidUntil)){
            byPhone[phone].paidShort = String(v.paymentPaidUntil||v.paidUntil).slice(0,10);
          }
          return;
        }
        const paid = v.paymentPaidUntil || v.paidUntil || '';
        byPhone[phone] = {
          phone: phone,
          name: v.name || phone,
          role: v.role || 'pay-only',
          paidShort: paid ? String(paid).slice(0,10) : 'not set',
          ua: v.paymentAmount || ''
        };
      });
    }catch(ePs){}
    const rows = Object.keys(byPhone).map(function(p){ return byPhone[p]; })
      .sort(function(a,b){ return String(a.name).localeCompare(String(b.name)); });
    userOpts += rows.map(function(r){
      return '<option value="'+r.phone+'">'+(String(r.name||'').replace(/</g,''))+' ('+r.role+') · ₹'+(r.ua||'—')+' · until '+r.paidShort+'</option>';
    }).join('');
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
      <b>₹99</b> Individual (1) · <b>₹499</b> up to 30 · <b>₹999</b> up to 60 · <b>₹1499</b> up to 200<br>
      Edit <b>Max members</b> next to each amount if you change team size. Annual amounts use the same max.
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
      <button type="button" class="cancel-btn" style="width:auto;padding:8px 10px;margin:0;font-size:11px" onclick="paySeedPlanAmounts()">Seed annual from current monthly amounts</button>
    </div>
  </div>

  <button class="big-btn" style="margin-top:8px" onclick="savePaymentSettingsAdmin()">💾 Save payment settings</button>
  <div style="margin:14px 0;padding:12px;border-radius:12px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.08)">
    <div style="font-size:13px;font-weight:900;margin-bottom:6px">🎬 Landing videos — 4 URLs (Admin · 8929397949)</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.45">
      Set <b>English</b> and <b>Hindi</b> videos. Landing page shows EN or HI set based on language toggle.
      YouTube / youtu.be / MP4. After <b>Save</b> + <b>Publish to landing page</b>.
    </div>
    <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:8px 0 4px">English videos</div>
    <div class="field"><label>EN · Short URL (Auto Schedule · one click)</label>
      <input id="pay_video_short" type="url" inputmode="url" autocomplete="off" class="inp-field" placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." value="">
    </div>
    <div class="field"><label>EN · Long URL (Setup + free trial)</label>
      <input id="pay_video_long" type="url" inputmode="url" autocomplete="off" class="inp-field" placeholder="https://www.youtube.com/watch?v=..." value="">
    </div>
    <div class="field"><label>EN · Optional titles</label>
      <input id="pay_video_short_title" class="inp-field" placeholder="Auto Schedule in one click" value="">
      <input id="pay_video_long_title" class="inp-field" style="margin-top:6px" placeholder="Setup + free 15-day trial" value="">
    </div>
    <div style="font-size:12px;font-weight:800;color:#f97316;margin:12px 0 4px">Hindi videos (हिंदी)</div>
    <div class="field"><label>HI · Short URL (ऑटो शेड्यूल · एक क्लिक)</label>
      <input id="pay_video_short_hi" type="url" inputmode="url" autocomplete="off" class="inp-field" placeholder="https://youtu.be/... or YouTube watch link" value="">
    </div>
    <div class="field"><label>HI · Long URL (सेटअप + मुफ्त ट्रायल)</label>
      <input id="pay_video_long_hi" type="url" inputmode="url" autocomplete="off" class="inp-field" placeholder="https://youtu.be/... or YouTube watch link" value="">
    </div>
    <div class="field"><label>HI · Optional titles</label>
      <input id="pay_video_short_title_hi" class="inp-field" placeholder="ऑटो शेड्यूल — एक क्लिक" value="">
      <input id="pay_video_long_title_hi" class="inp-field" style="margin-top:6px" placeholder="सेटअप + मुफ्त 15 दिन" value="">
    </div>
  </div>
  <button type="button" class="big-btn" style="margin-top:8px;background:rgba(59,130,246,.2);border:1px solid #3b82f6;color:#93c5fd" onclick="(async function(){try{if(typeof saveLandingVideosFromPaymentForm==='function')await saveLandingVideosFromPaymentForm();}catch(e){}var s=await publishPublicOfferSnapshot();if(s){toast(L('✅ लैंडिंग: परीक्षण ','✅ Landing: trial ')+ (s.trialDays||0) +L(' दिन · वीडियो ','d · videos ')+ ((s.videoShortUrl||s.videoLongUrl||s.videoShortUrlHi||s.videoLongUrlHi)?L('सेट','set'):L('नहीं','none')) +L(' · छूट ',' · discount ')+ (s.annualDiscountPct||0) +'%');try{if(typeof closeModal==='function'){closeModal();closeModal();}}catch(e){}try{document.querySelectorAll('.modal-overlay,.modal-bg,#modalRoot .modal').forEach(function(el){el.style.display='none';el.classList&&el.classList.add('hidden');});}catch(e3){}try{if(typeof goTab==='function')goTab('home');else if(typeof _goTabDirect==='function')_goTabDirect('home');else if(typeof showTab==='function')showTab('home');}catch(e2){}try{window.scrollTo(0,0);}catch(e4){}}else{toast(L('⚠️ प्रकाशन विफल — publicOffer नियम और व्यवस्थापक लॉगिन जाँचें','⚠️ Publish failed — deploy rules for publicOffer + Admin login'));}})()">📣 Publish to landing page</button>

  <hr style="margin:18px 0;border:none;border-top:1px solid var(--border2)">
  <div style="font-size:13px;font-weight:900;margin-bottom:8px">📅 Set amount + paid-until for one user</div>
  <div class="field"><label>Manager / Member (from list)</label>
    <select id="pay_user" class="inp-field">${userOpts}</select>
  </div>
  <div class="field"><label>Or type mobile (10 digits) — for users missing from list</label>
    <input id="pay_user_manual" type="tel" inputmode="numeric" maxlength="14" class="inp-field" placeholder="e.g. 8929394920" autocomplete="off">
    <div style="font-size:10px;color:var(--muted2);margin-top:4px">Use this when the number is not in the dropdown (deleted / rejoined / paymentStatus-only).</div>
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
    var opts = window._payAmountOptionsEdit || [];
    var disc = 12;
    try {
      var dEl = document.getElementById('pay_default_discount');
      if (dEl && dEl.value != null) disc = Math.min(90, Math.max(0, parseInt(dEl.value, 10) || 12));
      else if (window._paymentSettingsCache && window._paymentSettingsCache.defaultDiscountPct != null)
        disc = Math.min(90, Math.max(0, parseInt(window._paymentSettingsCache.defaultDiscountPct, 10) || 12));
    } catch (eD) {}
    // Annual if it matches monthly×12×(1−disc) for a smaller amount in the list
    function isAnnualAmt(n) {
      var list = (opts || []).map(function(x){ return parseInt(x,10); }).filter(function(x){ return x>0; });
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m > 0 && m < n && Math.round(m * 12 * (1 - disc / 100)) === n) return true;
      }
      if (n >= 4000) return true;
      // Common seeded annuals
      if (n === 1045 || n === 5269 || n === 10549 || n === 15829 || n === 21109) return true;
      if ((n > 900 && n < 1200 && n !== 999 && n !== 799) || (n >= 4800 && n < 6000) || (n >= 9000 && n < 12000) || (n >= 14000 && n < 25000)) return true;
      return false;
    }
    var annual = isAnnualAmt(n);
    var mmMap = window._payMaxMembersByAmountEdit || {};
    var mm = 0;
    try {
      mm = parseInt(mmMap[String(n)] != null ? mmMap[String(n)] : mmMap[n], 10) || 0;
    } catch (e0) {}
    if (mm > 0) {
      if (mm === 1) return (annual ? 'Annual' : 'Monthly') + ' · Individual (1)';
      return (annual ? 'Annual' : 'Monthly') + ' · up to ' + mm;
    }
    if (annual) {
      if (n === 1045 || (n > 900 && n < 1200 && n !== 999)) return 'Annual · Individual (1)';
      if (n === 5269 || (n >= 4800 && n < 6000)) return 'Annual · up to 30';
      if (n === 10549 || (n >= 9000 && n < 12000)) return 'Annual · up to 60';
      if (n === 15829 || n === 21109 || (n >= 14000 && n < 25000)) return 'Annual · up to 200';
      return 'Annual plan';
    }
    if (n === 99 || n === 199) return 'Monthly · Individual (1)';
    if (n === 499) return 'Monthly · up to 30';
    if (n === 799) return 'Monthly · up to 60';
    if (n === 999) return 'Monthly · up to 60';
    if (n === 1499) return 'Monthly · up to 60';
    if (n === 1999 || n === 2499 || n === 2999) return 'Monthly · up to 200';
    return 'Monthly · Plan';
  }
  if(!window._payMaxMembersByAmountEdit || typeof window._payMaxMembersByAmountEdit !== 'object')
    window._payMaxMembersByAmountEdit = {};
  function defaultMaxForAmount(n){
    n = Number(n)||0;
    if(n===99 || n===199) return 1;
    if(n===499) return 30;
    if(n===799) return 60;
    if(n===999) return 60;
    if(n===1499) return 60;
    if(n===1999 || n===2499 || n===2999 || (n>=1900 && n<4000)) return 200;
    if(n===1045 || (n>900 && n<1200 && n!==999)) return 1;
    if(n===5269 || (n>=4800 && n<6000)) return 30;
    if(n===10549 || (n>=9000 && n<12000)) return 60;
    if(n===15829 || (n>=14000 && n<20000)) return 200;
    return 0;
  }
  el.innerHTML = opts.map((a,i)=>{
    const url = String(links[String(a)] || links[a] || '').replace(/"/g,'&quot;');
    const short = url ? (url.length>28 ? url.slice(0,28)+'…' : url) : '';
    var mmMap = window._payMaxMembersByAmountEdit || {};
    var mmVal = mmMap[String(a)] != null ? mmMap[String(a)] : (mmMap[a] != null ? mmMap[a] : defaultMaxForAmount(a));
    if(mmMap[String(a)] == null && mmMap[a] == null && mmVal)
      window._payMaxMembersByAmountEdit[String(a)] = mmVal;
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;padding:10px;border-radius:10px;background:#fff;border:1px solid #cbd5e1">
      <div style="min-width:72px">
        <div style="font-weight:900;font-size:14px;color:#0f172a">₹${a}</div>
        <div style="font-size:10px;font-weight:700;color:#64748b">${planLabel(a)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:88px">
        <label style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.3px">Max members</label>
        <input type="number" min="1" max="5000" class="inp-field" style="width:88px;margin:0;font-size:13px;font-weight:800;padding:8px 6px"
          value="${mmVal || ''}"
          placeholder="e.g. 30"
          oninput="if(!window._payMaxMembersByAmountEdit)window._payMaxMembersByAmountEdit={};var v=parseInt(this.value,10);window._payMaxMembersByAmountEdit['${a}']=(v>0?v:'');try{var lab=this.closest('div').parentElement.querySelector('div[style*=min-width] div:last-child');if(lab)lab.textContent=planLabel(${a});}catch(e){}">
      </div>
      <input type="url" class="inp-field" style="flex:1;min-width:140px;margin:0;font-size:12px" placeholder="https://rzp.io/… for ₹${a}"
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
  const disc = Math.min(90, Math.max(0, parseInt((document.getElementById('pay_default_discount')||{}).value||'12',10)||12));
  // Use CURRENT monthly amounts already in the list (not hardcoded old bands).
  // Prefer amounts that look monthly (< 4000). If list is empty, fall back to recommended bands.
  let optsNow = Array.isArray(window._payAmountOptionsEdit) ? window._payAmountOptionsEdit.slice() : [];
  let monthly = optsNow.map(a => parseInt(a,10)).filter(n => n > 0 && n < 4000);
  if (!monthly.length) monthly = [99, 799, 1499, 2999]; // recommended current bands
  monthly = [...new Set(monthly)].sort((a,b)=>a-b);
  const annual = monthly.map(m => Math.round(m * 12 * (1 - disc / 100)));
  const amounts = monthly.concat(annual);
  try{
    const opts = monthly.slice(); // start from current monthly
    amounts.forEach(a=>{
      const n = parseInt(a,10);
      if(!n) return;
      if(!opts.includes(n) && !opts.includes(String(n))) opts.push(n);
    });
    opts.sort((a,b)=>parseInt(a,10)-parseInt(b,10));
    window._payAmountOptionsEdit = opts;
    if(!window._payLinksByAmountEdit || typeof window._payLinksByAmountEdit !== 'object')
      window._payLinksByAmountEdit = {};
    amounts.forEach(a=>{
      const k = String(a);
      if(window._payLinksByAmountEdit[k] == null) window._payLinksByAmountEdit[k] = '';
    });
    // Also seed sensible max-members for known bands if missing
    if(!window._payMaxMembersByAmountEdit || typeof window._payMaxMembersByAmountEdit !== 'object')
      window._payMaxMembersByAmountEdit = {};
    const mmDefaults = {'99':1,'199':1,'499':30,'799':60,'999':60,'1499':60,'1999':200,'2499':200,'2999':200};
    monthly.forEach(m=>{
      const k = String(m);
      if(window._payMaxMembersByAmountEdit[k] == null && mmDefaults[k] != null)
        window._payMaxMembersByAmountEdit[k] = mmDefaults[k];
    });
    if(typeof payAmountListRender==='function') payAmountListRender();
    else if(typeof renderPayAmountList==='function') renderPayAmountList();
    toast(L('✅ मासिक से वार्षिक बीज (छूट ','✅ Seeded annual from current monthly (discount ')+disc+'%: '+annual.join(', ')+L(') — रेज़रपे लिंक चिपकाएँ',') — paste Razorpay links'));
  }catch(e){ toast(L('⚠️ ','⚠️ ')+(e.message||e)); }
}
function payAmountListAdd(){
  const inp = document.getElementById('pay_new_amount');
  const n = parseInt((inp && inp.value) || '0', 10);
  if(!n || n < 1){ toast(L('⚠️ वैध राशि दर्ज करें','⚠️ Enter a valid amount')); return; }
  const opts = window._payAmountOptionsEdit || [];
  if(opts.includes(n)){ toast(L('पहले से सूची में','Already in list')); return; }
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
  if(!n || n < 1){ toast(L('⚠️ अमान्य','⚠️ Invalid')); return; }
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
  if(opts.length <= 1){ toast(L('⚠️ कम से कम एक राशि रखें','⚠️ Keep at least one amount')); return; }
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
async function fillLandingVideoFields(force){
  try{
    const v = await loadLandingVideosAdmin();
    const map = {
      pay_video_short: 'shortUrl',
      pay_video_long: 'longUrl',
      pay_video_short_title: 'shortTitle',
      pay_video_long_title: 'longTitle',
      pay_video_short_hi: 'shortUrlHi',
      pay_video_long_hi: 'longUrlHi',
      pay_video_short_title_hi: 'shortTitleHi',
      pay_video_long_title_hi: 'longTitleHi'
    };
    Object.keys(map).forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      // v6.0.48: never wipe what the admin is typing/pasting
      if(!force){
        if(el.dataset && el.dataset.userEdited === '1') return;
        if(document.activeElement === el) return;
        // If user already typed something different from saved, keep it
        const saved = String((v && v[map[id]]) || '');
        const cur = String(el.value || '');
        if(cur && cur !== saved) return;
      }
      el.value = (v && v[map[id]]) || '';
      try{
        if(!el._mpVidBound){
          el._mpVidBound = true;
          var mark = function(){ try{ el.dataset.userEdited = '1'; }catch(e){} };
          el.addEventListener('input', mark);
          el.addEventListener('change', mark);
          el.addEventListener('paste', mark);
        }
      }catch(e){}
    });
  }catch(e){}
}
async function saveLandingVideosFromPaymentForm(){
  if(typeof isAdmin!=='function' || !isAdmin()) return;
  function val(id, max){
    return String((document.getElementById(id)||{}).value||'').trim().slice(0, max||500);
  }
  const payload = {
    shortUrl: val('pay_video_short', 500),
    longUrl: val('pay_video_long', 500),
    shortTitle: val('pay_video_short_title', 120),
    longTitle: val('pay_video_long_title', 120),
    shortUrlHi: val('pay_video_short_hi', 500),
    longUrlHi: val('pay_video_long_hi', 500),
    shortTitleHi: val('pay_video_short_title_hi', 120),
    longTitleHi: val('pay_video_long_title_hi', 120),
    updatedAt: new Date().toISOString()
  };
  window._landingVideosCache = payload;
  if(typeof fbSet==='function') await fbSet('settings/landingVideos', payload);
  else if(typeof fbUpdate==='function') await fbUpdate('settings/landingVideos', payload);
}

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
    function _planMeta(n) {
      n = parseInt(n, 10) || 0;
      var overrideMm = 0;
      try {
        var mmMap = (pay && pay.maxMembersByAmount) || window._payMaxMembersByAmountEdit || {};
        overrideMm = parseInt(mmMap[String(n)] != null ? mmMap[String(n)] : mmMap[n], 10) || 0;
      } catch (eMm) {}
      var disc = Math.min(90, Math.max(0, parseInt(pay && pay.defaultDiscountPct, 10) || 12));
      var amtList = (Array.isArray(amounts) ? amounts : []).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0; });
      var isAnnual = false;
      for (var i = 0; i < amtList.length; i++) {
        var m = amtList[i];
        if (m > 0 && m < n && Math.round(m * 12 * (1 - disc / 100)) === n) { isAnnual = true; break; }
      }
      if (n >= 4000) isAnnual = true;
      if (n === 1045 || n === 5269 || n === 10549 || n === 15829 || n === 21109) isAnnual = true;

      if (isAnnual) {
        var mmA = overrideMm || 0;
        if (n === 1045 || (n > 900 && n < 1200 && n !== 999 && n !== 799)) return { band: 'Individual (1)', period: 'annual', maxMembers: mmA || 1 };
        if (overrideMm > 0) return { band: 'Up to ' + overrideMm, period: 'annual', maxMembers: overrideMm };
        if (n === 5269 || (n >= 4800 && n < 6000)) return { band: 'Up to 30', period: 'annual', maxMembers: 30 };
        if (n === 10549 || (n >= 9000 && n < 12000)) return { band: 'Up to 60', period: 'annual', maxMembers: 60 };
        if (n === 15829 || n === 21109 || (n >= 14000 && n < 25000)) return { band: 'Up to 200', period: 'annual', maxMembers: 200 };
        return { band: overrideMm ? ('Up to ' + overrideMm) : 'Team', period: 'annual', maxMembers: overrideMm || 0 };
      }
      // Monthly
      if (n === 99 || n === 199) return { band: 'Individual (1)', period: 'monthly', maxMembers: overrideMm || 1 };
      if (n === 499) return { band: 'Up to ' + (overrideMm || 30), period: 'monthly', maxMembers: overrideMm || 30 };
      if (n === 799) return { band: 'Up to ' + (overrideMm || 60), period: 'monthly', maxMembers: overrideMm || 60 };
      if (n === 999) return { band: 'Up to ' + (overrideMm || 60), period: 'monthly', maxMembers: overrideMm || 60 };
      if (n === 1499) return { band: 'Up to ' + (overrideMm || 60), period: 'monthly', maxMembers: overrideMm || 60 };
      if (n === 1999 || n === 2499 || n === 2999 || (n >= 1400 && n < 4000)) return { band: 'Up to ' + (overrideMm || 200), period: 'monthly', maxMembers: overrideMm || 200 };
      if (overrideMm > 0) return { band: overrideMm === 1 ? 'Individual (1)' : ('Up to ' + overrideMm), period: 'monthly', maxMembers: overrideMm };
      return { band: 'Plan', period: 'monthly', maxMembers: 0 };
    }

    const plans = (Array.isArray(amounts) ? amounts : []).map(function (a) {
      const n = parseInt(a, 10);
      if (!(n > 0)) return null;
      const meta = _planMeta(n);
      const periodLabel = meta.period === 'annual' ? 'Annual' : 'Monthly';
      return {
        amount: n,
        price: n,
        monthly: meta.period === 'monthly' ? n : null,
        annual: meta.period === 'annual' ? n : null,
        period: meta.period,
        maxMembers: meta.maxMembers,
        band: meta.band,
        label: periodLabel + ' · ' + meta.band,
        name: periodLabel + ' · ' + meta.band
      };
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
      const fsh = document.getElementById('pay_video_short_hi');
      const flh = document.getElementById('pay_video_long_hi');
      const fsth = document.getElementById('pay_video_short_title_hi');
      const flth = document.getElementById('pay_video_long_title_hi');
      if (fs || fl || fsh || flh) {
        vids = Object.assign({}, vids, {
          shortUrl: fs ? String(fs.value || '').trim() : (vids.shortUrl || ''),
          longUrl: fl ? String(fl.value || '').trim() : (vids.longUrl || ''),
          shortTitle: fst ? String(fst.value || '').trim() : (vids.shortTitle || ''),
          longTitle: flt ? String(flt.value || '').trim() : (vids.longTitle || ''),
          shortUrlHi: fsh ? String(fsh.value || '').trim() : (vids.shortUrlHi || ''),
          longUrlHi: flh ? String(flh.value || '').trim() : (vids.longUrlHi || ''),
          shortTitleHi: fsth ? String(fsth.value || '').trim() : (vids.shortTitleHi || ''),
          longTitleHi: flth ? String(flth.value || '').trim() : (vids.longTitleHi || '')
        });
        window._landingVideosCache = vids;
        try {
          if (typeof fbSet === 'function') await fbSet('settings/landingVideos', Object.assign({}, vids, { updatedAt: new Date().toISOString() }));
        } catch (eSaveV) {}
      }
    } catch (eForm) {}
    const snapshot = {
      paymentEnabled: pay.enabled !== false,
      trialDays: Math.max(0, parseInt(lic.freeTrialDays != null ? lic.freeTrialDays : (lic.trialDays != null ? lic.trialDays : (lic.freeDays != null ? lic.freeDays : 0)), 10) || 0),
      plans: plans,
      annualDiscountPct: Math.max(0, Math.min(90, parseInt(pay.defaultDiscountPct, 10) || 0)),
      refundDays: Math.max(0, parseInt(cc.refundDays, 10) || 0),
      supportWhatsApp: waRaw || '',
      supportEmail: String(cc.email || '').trim().slice(0, 120),
      videoShortUrl: String(vids.shortUrl || '').trim().slice(0, 500),
      videoLongUrl: String(vids.longUrl || '').trim().slice(0, 500),
      videoShortTitle: String(vids.shortTitle || 'Auto Schedule in one click').trim().slice(0, 120),
      videoLongTitle: String(vids.longTitle || 'Setup + free 15-day trial').trim().slice(0, 120),
      videoShortUrlHi: String(vids.shortUrlHi || '').trim().slice(0, 500),
      videoLongUrlHi: String(vids.longUrlHi || '').trim().slice(0, 500),
      videoShortTitleHi: String(vids.shortTitleHi || '').trim().slice(0, 120),
      videoLongTitleHi: String(vids.longTitleHi || '').trim().slice(0, 120),
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
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
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
  const badLinks = [];
  try{
    const map = window._payLinksByAmountEdit || {};
    amountOptions.forEach(a=>{
      const key = String(a);
      let url = String(map[key] || map[a] || '').trim();
      if(!url) return;
      if(typeof _looksLikeFixedPaymentLink === 'function' && !_looksLikeFixedPaymentLink(url)){
        badLinks.push('₹' + key);
        return; // do not save broken/incomplete links
      }
      linksByAmount[key] = url;
    });
  }catch(e){}
  if(badLinks.length){
    toast(L('⚠️ अमान्य भुगतान लिंक छोड़ें: ','⚠️ Skipped invalid payment link(s) for ') + badLinks.join(', ') + L(' — पूरा rzp.io / निश्चित-राशि लिंक उपयोग करें',' — use full rzp.io / fixed-amount Razorpay link'));
  }
  // Collect per-amount max members (team size bands)
  const maxMembersByAmount = {};
  try{
    const mm = window._payMaxMembersByAmountEdit || {};
    amountOptions.forEach(a=>{
      const key = String(a);
      let v = parseInt(mm[key] != null ? mm[key] : mm[a], 10);
      if(v > 0) maxMembersByAmount[key] = v;
    });
  }catch(eMm){}
  try{
    const defaultDiscountPct = Math.min(90, Math.max(0, parseInt((document.getElementById('pay_default_discount')||{}).value||'17',10)||17));
    // Build plans[] for user Choose plan (monthly only — skip annual seeded amounts)
    const plans = [];
    try {
      const disc = defaultDiscountPct;
      function isAnn(n) {
        for (let i = 0; i < amountOptions.length; i++) {
          const m = parseInt(amountOptions[i], 10);
          if (m > 0 && m < n && Math.round(m * 12 * (1 - disc / 100)) === n) return true;
        }
        return n >= 4000;
      }
      amountOptions.map(a => parseInt(a, 10)).filter(n => n > 0 && !isAnn(n)).sort((a,b)=>a-b).forEach(m => {
        const mm = parseInt(maxMembersByAmount[String(m)], 10) || 0;
        let label = 'Plan ₹' + m;
        if (mm === 1 || m === 99 || m === 199) label = 'Individual (1 member)';
        else if (mm > 0) label = 'Up to ' + mm + ' members';
        else if (m === 499) label = 'Up to 30 members';
        else if (m === 799 || m === 999 || m === 1499) label = 'Up to 60 members';
        else if (m >= 1999) label = 'Up to 200 members';
        plans.push({ id: 'm' + m, label, maxMembers: mm || (m <= 199 ? 1 : 0), monthly: m, discountPct: null });
      });
      plans.push({ id: 'custom', label: 'Customized plan', custom: true });
    } catch (ePl) {}
    const payload = {
      enabled, amount, link, title, message,
      amountOptions,
      linksByAmount,
      maxMembersByAmount,
      plans,
      defaultDiscountPct,
      currency: 'INR',
      updatedAt: new Date().toISOString(),
      updatedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
    };
    await fbUpdate('settings/payment', payload);
    window._paymentSettingsCache = payload;
    window._paymentSettingsAt = Date.now();
    try{ localStorage.setItem('mp_payment_enabled', payload.enabled ? '1' : '0'); }catch(e){}
    toast(L('✅ भुगतान सेटिंग सहेजी गई','✅ Payment settings saved'));
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
    toast(L('❌ सहेजना विफल: ','❌ Save failed: ')+(err.message||err.code||L('अनुमति','permission')));
  }
}

async function saveUserPaidUntilAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  // v6.0.49: manual mobile overrides dropdown (for deleted/rejoined users missing from list)
  var manual = String((document.getElementById('pay_user_manual')||{}).value||'').replace(/\D/g,'').slice(-10);
  var fromSel = String((document.getElementById('pay_user')||{}).value||'').replace(/\D/g,'').slice(-10);
  const phone = (manual.length===10 ? manual : fromSel);
  const until = String((document.getElementById('pay_until')||{}).value||'').trim();
  const amt = parseInt((document.getElementById('pay_user_amount')||{}).value||'0',10) || null;
  if(!phone || phone.length!==10){ toast(L('⚠️ उपयोगकर्ता चुनें या 10 अंकों का मोबाइल लिखें','⚠️ Select user or type 10-digit mobile')); return; }
  if(!until){ toast(L('⚠️ तिथि चुनें','⚠️ Select date')); return; }
  try{
    const iso = new Date(until+'T23:59:59.000Z').toISOString();
    const payload = {
      paymentPaidUntil: iso,
      paidUntil: iso,
      validTill: iso,
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
    toast(L('✅ भुगतान तक ','✅ Paid until ')+until+L(' सहेजा · ',' saved for ')+phone);
  }catch(err){
    console.error(err);
    toast(L('❌ सहेजना विफल: ','❌ Save failed: ')+(err.message||err.code||L('अनुमति','permission')));
  }
}

// Hydrate paidUntil into SESSION after login
/** New mobile: auto paidUntil = first login + admin freeTrialDays (once only). */

/** Admin free-trial days from settings/appLicense (fallback 7) */
async function openAppLicenseAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
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
    toast(L('✅ लाइसेंस सेटिंग सहेजी · परीक्षण ','✅ License settings saved · trial ')+freeTrialDays+L(' दिन',' days'));
    try{ await publishPublicOfferSnapshot(); }catch(e){}
    closeModal();
  }catch(e){ toast(L('❌ ','❌ ')+(e.message||e)); }
}
window.openAppLicenseAdmin = openAppLicenseAdmin;
window.saveAppLicenseAdmin = saveAppLicenseAdmin;


/* Leave reason on any L cell open (Schedule + My Shift) */
