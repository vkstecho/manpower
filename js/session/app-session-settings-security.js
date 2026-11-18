/* Man Power — App access security + delete account (split v5.1.0) */
// ════════════════════════════════════════
// APP ACCESS SECURITY (Profile) — password + fingerprint  v2.4.3
// ════════════════════════════════════════
function _sessionSecurityIds(){
  const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const empObjId = SESSION.empObjId || '';
  const uid = empObjId || (mob ? ('m_'+mob) : 'user');
  return { mob, empObjId, uid, name: SESSION.name||'User' };
}

async function openAppAccessSecurity(){
  const { mob, empObjId, uid, name } = _sessionSecurityIds();
  const hasPw = !!(typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, mob));
  const fpOn = localStorage.getItem(FP_KEY+'_'+uid)==='1' || localStorage.getItem(FP_KEY)==='1';
  let bioOk = false;
  try{ bioOk = await isBiometricAvailable(); }catch(e){}
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🔐 ${L('ऐप एक्सेस सुरक्षा','App Access Security')}</div>
    <div class="modal-scroll-body">
      <div style="font-size:12px;color:var(--muted2);line-height:1.55;margin-bottom:14px">
        ${L('ये सेटिंग सिर्फ <b style="color:var(--text)">इस device</b> पर हैं। Fingerprint (बेहतर) या device password से अगली बार OTP की जरूरत नहीं पड़ेगी।','These settings are only on <b style="color:var(--text)">this device</b>. Use fingerprint (preferred) or a device password so you do not need OTP every time.')}
      </div>
      <div style="background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:12px 14px;margin-bottom:12px">
        <div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;margin-bottom:8px">${L('स्थिति','STATUS')}</div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">👆 Fingerprint</span>
          <span style="font-weight:800;color:${fpOn?'#22c55e':'#f97316'}">${fpOn?(L('चालू','ON')):(L('बंद','OFF'))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">🔑 Device Password</span>
          <span style="font-weight:800;color:${hasPw?'#22c55e':'#f97316'}">${hasPw?(L('सेट है','Set')):(L('सेट नहीं','Not set'))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">📱 Biometric hardware</span>
          <span style="font-weight:700;color:var(--text)">${bioOk?(L('उपलब्ध','Available')):(L('नहीं','Not available'))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">💾 Schedule Save security</span>
          <span style="font-weight:800;color:${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?'#f97316':'#22c55e'}">${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?(L('Strict · OTP','Strict (OTP)')):(L('Trusted · बिना OTP','Trusted (No OTP Required)'))}</span>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted2);line-height:1.5;margin:8px 0 10px;padding:10px;border-radius:10px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2)">
        ${L('<b style="color:var(--text)">Trusted</b> = इस device पर Schedule Save बिना बार‑बार OTP (बार‑बार OTP नहीं)। <b style="color:var(--text)">Strict</b> = Phone Auth न हो तो हर Save से पहले OTP।','<b style="color:var(--text)">Trusted</b> = Save shifts on this laptop/phone without OTP every time (no OTP each time). <b style="color:var(--text)">Strict</b> = require phone OTP before each Save when Phone Auth is missing.')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button type="button" onclick="setWriteSecurityMode('trusted');toast(L('✅ Trusted mode — बिना OTP Save','✅ Trusted mode — No OTP Required'));closeModal();setTimeout(()=>openAppAccessSecurity(),200)"
          style="flex:1;padding:12px;border-radius:12px;border:1.5px solid ${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()!=='strict')?'#22c55e':'var(--border2)'};background:${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()!=='strict')?'rgba(34,197,94,.12)':'var(--card)'};color:var(--text);font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">
          ✅ Trusted<br><span style="font-weight:600;opacity:.8;font-size:10px">No OTP Required</span>
        </button>
        <button type="button" onclick="setWriteSecurityMode('strict');toast(L('🔐 Strict mode — Save से पहले OTP','🔐 Strict mode — OTP before Save'));closeModal();setTimeout(()=>openAppAccessSecurity(),200)"
          style="flex:1;padding:12px;border-radius:12px;border:1.5px solid ${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?'#f97316':'var(--border2)'};background:${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?'rgba(249,115,22,.12)':'var(--card)'};color:var(--text);font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">
          🔐 Strict<br><span style="font-weight:600;opacity:.8;font-size:10px">OTP gate</span>
        </button>
      </div>
      <button class="profile-action" style="margin-top:4px;width:100%;text-align:left" onclick="closeModal();setTimeout(()=>openChangeDevicePassword(),200)">
        <div class="pa-icon" style="background:rgba(249,115,22,.12)">🔑</div>
        <div><div class="pa-label">${hasPw?(L('Password बदलें','Change Device Password')):(L('Password सेट करें','Set Device Password'))}</div>
        <div class="pa-sub">${L('इस device पर बिना OTP login','For login without OTP on this device')}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      ${bioOk?`<button class="profile-action" style="margin-top:6px;width:100%;text-align:left" onclick="closeModal();setTimeout(()=>setupFingerprintFromProfile(),200)">
        <div class="pa-icon" style="background:rgba(168,85,247,.12)">👆</div>
        <div><div class="pa-label">${fpOn?(L('Fingerprint दोबारा सेट करें','Re-setup Fingerprint')):(L('Fingerprint Login चालू करें','Enable Fingerprint Login'))}</div>
        <div class="pa-sub">${L('Fingerprint / Face से app खोलें','Unlock app with fingerprint / face')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${fpOn?`<button class="profile-action" style="margin-top:6px;width:100%;text-align:left;border-color:rgba(244,63,94,.3)" onclick="disableFingerprintFromProfile()">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚫</div>
        <div><div class="pa-label">${L('Fingerprint बंद करें','Disable Fingerprint')}</div>
        <div class="pa-sub">${L('Password या OTP इस्तेमाल करें','Use password or OTP instead')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${hasPw?`<button class="profile-action" style="margin-top:6px;width:100%;text-align:left;border-color:rgba(244,63,94,.3)" onclick="clearDevicePasswordFromProfile()">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🗑️</div>
        <div><div class="pa-label">${L('Password हटाएं','Remove Device Password')}</div>
        <div class="pa-sub">${L('अगली बार OTP लग सकता है','Next login may need OTP')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
    </div>
    <div class="modal-sticky-actions">
      <button class="cancel-btn" onclick="closeModal()">${L('बंद करें','Close')}</button>
    </div>`);
}

function openChangeDevicePassword(){
  const { mob, empObjId, uid, name } = _sessionSecurityIds();
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const hasPw = !!(typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, mob));
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🔑 ${hasPw?(L('Password बदलें','Change Password')):(L('Password सेट करें','Set Password'))}</div>
    <div class="modal-scroll-body">
      <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
        ${L('सिर्फ इस device पर सेव होगा। कम से कम 5 अक्षर।','Saved only on this device. Min 5 characters.')}
      </div>
      ${hasPw?`<div class="field"><label>${L('पुराना password (optional)','Current password (optional)')}</label>
        <input class="inp-field" type="password" id="secOldPw" inputmode="numeric" maxlength="20" placeholder="●●●●●"></div>`:''}
      <div class="field"><label>${L('नया password','New password')} *</label>
        <input class="inp-field" type="password" id="secNewPw" inputmode="numeric" maxlength="20" placeholder="●●●●●"></div>
      <div class="field"><label>${L('नया password दोबारा','Confirm new password')} *</label>
        <input class="inp-field" type="password" id="secNewPw2" inputmode="numeric" maxlength="20" placeholder="●●●●●"></div>
      <div id="secPwErr" style="color:#f43f5e;font-size:12px;min-height:16px;margin-bottom:8px"></div>
    </div>
    <div class="modal-sticky-actions">
      <button class="submit-btn" onclick="saveDevicePasswordFromProfile()">💾 ${L('सेव करें','Save')}</button>
      <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>
    </div>`);
}

async function saveDevicePasswordFromProfile(){
  const { mob, empObjId } = _sessionSecurityIds();
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const p1 = (document.getElementById('secNewPw')?.value||'');
  const p2 = (document.getElementById('secNewPw2')?.value||'');
  const old = (document.getElementById('secOldPw')?.value||'');
  const err = document.getElementById('secPwErr');
  if(p1.length < 5){ if(err) err.textContent = L('कम से कम 5 अक्षर','Min 5 characters'); return; }
  if(p1 !== p2){ if(err) err.textContent = L('Password match नहीं हो रहे','Passwords do not match'); return; }
  const existing = _getDevicePasswordHash(empObjId, mob);
  if(existing && old){
    const oldH = await hashPass(old+'mp_salt_v24');
    if(oldH !== existing){ if(err) err.textContent = L('पुराना password गलत','Current password wrong'); return; }
  }
  const h = await hashPass(p1+'mp_salt_v24');
  _setDevicePasswordHash(empObjId, mob, h);
  toast(L('✅ Device password सेव हो गया','✅ Device password saved'));
  closeModal();
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 250);
}

async function setupFingerprintFromProfile(){
  const { uid, name } = _sessionSecurityIds();
  // Force re-register even if already set
  try{ localStorage.removeItem(FP_KEY+'_'+uid); }catch(e){}
  try{
    await registerFingerprint(name, uid);
    // If user declined prompt inside registerFingerprint, still try direct create
    if(localStorage.getItem(FP_KEY+'_'+uid)!=='1'){
      // registerFingerprint already asked; if declined, leave OFF
    }
  }catch(e){ toast('❌ Fingerprint: '+(e.message||e.name||e)); }
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 400);
}

function disableFingerprintFromProfile(){
  const { uid } = _sessionSecurityIds();
  try{
    localStorage.removeItem(FP_KEY);
    localStorage.removeItem(FP_KEY+'_'+uid);
    localStorage.removeItem(FP_CRED_KEY);
  }catch(e){}
  toast(L('Fingerprint बंद कर दिया','Fingerprint disabled'));
  closeModal();
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 250);
}

function clearDevicePasswordFromProfile(){
  const { mob, empObjId } = _sessionSecurityIds();
  _clearDevicePassword(empObjId, mob);
  toast(L('Device password हटा दिया','Device password removed'));
  closeModal();
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 250);
}

async function showProfile(){
 try{
  const e=myEmp();
  if(isAdmin()){
    openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="padding:10px 0">
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:44px;margin-bottom:8px">🛡️</div>
        <div style="font-size:18px;font-weight:900;color:#fff">${escHtml(SESSION.name)}</div>
        <div style="font-size:12px;color:var(--muted2);margin-top:4px">Admin — Full Access</div>
      </div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:10px">Quick Actions</div>
      <button class="profile-action" onclick="closeModal();goTab('pending')">
        <div class="pa-icon" style="background:rgba(56,189,248,.12)">⏳</div>
        <div><div class="pa-label">Pending Approvals</div><div class="pa-sub">Login, Leave, Device requests</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openExtendAccessModal()">
        <div class="pa-icon" style="background:rgba(168,85,247,.12)">🔄</div>
        <div><div class="pa-label">User Access Extend</div><div class="pa-sub">${typeof L==='function'?L('Validity बढ़ाएं','Extend validity'):'Extend validity'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();if(typeof openAppLicenseAdmin==='function')openAppLicenseAdmin();else toast('Update app to latest version');">
        <div class="pa-icon" style="background:rgba(124,58,237,.12)">🔑</div>
        <div><div class="pa-label">${typeof L==='function'?L('App License / Expiry','App License / Expiry'):'App License / Expiry'}</div><div class="pa-sub">${typeof L==='function'?L('पूरी App की expiry date','Whole app expiry date'):'Whole app expiry date'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openPaymentSettingsAdmin()">
        <div class="pa-icon" style="background:rgba(234,88,12,.12)">💳</div>
        <div><div class="pa-label">${typeof L==='function'?L('Payment Link & Reminders','Payment Link & Reminders'):'Payment Link & Reminders'}</div><div class="pa-sub">${typeof L==='function'?L('₹999/month · link · paid-until dates','₹999/month · link · paid-until dates'):'₹999/month · link · paid-until dates'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openShareAppLinkAdmin()">
        <div class="pa-icon" style="background:rgba(59,130,246,.12)">🔗</div>
        <div><div class="pa-label">${typeof L==='function'?L('Share App Link','Share App Link'):'Share App Link'}</div><div class="pa-sub">${typeof L==='function'?L('Play Store / custom link for Share button','Play Store / custom link for Share button'):'Play Store / custom link for Share button'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openCustomerCareAdmin()">
        <div class="pa-icon" style="background:rgba(16,185,129,.12)">🎧</div>
        <div><div class="pa-label">${typeof L==='function'?L('Customer Care','Customer Care'):'Customer Care'}</div><div class="pa-sub">${typeof L==='function'?L('Name · Email · WhatsApp · '+((window._customerCareCache&&window._customerCareCache.refundDays)||7)+'-day refund text','Name · Email · WhatsApp · '+((window._customerCareCache&&window._customerCareCache.refundDays)||7)+'-day refund text'):'Name · Email · WhatsApp · 7-day refund text'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openTabVisibilitySettings()">
        <div class="pa-icon" style="background:rgba(14,116,144,.12)">🔭</div>
        <div><div class="pa-label">Tab Visibility</div><div class="pa-sub">Guest tab access control</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openSecuritySettings()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🔐</div>
        <div><div class="pa-label">Security Status</div><div class="pa-sub">Device & session info</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();setTimeout(function(){openAdminAnalytics()},50)">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">📊</div>
        <div><div class="pa-label">App Analytics</div><div class="pa-sub">Users, active logins, Managers</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action" onclick="openHolidayListModal()">
        <div class="pa-icon" style="background:rgba(245,158,11,.12)">📅</div>
        <div><div class="pa-label">Holiday List</div><div class="pa-sub">Date + Reason · Excel / Auto-fetch All-India</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action danger" onclick="openDeleteAccountModal()" style="border-color:rgba(244,63,94,.45);margin-top:8px">
        <div class="pa-icon" style="background:rgba(244,63,94,.15)">🗑️</div>
        <div><div class="pa-label">${typeof L==='function'?L('Delete Account','Delete Account'):'Delete Account'}</div><div class="pa-sub">${typeof L==='function'?L('इस mobile की registration हटाएं','Remove this mobile registration'):'Remove this mobile registration'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action danger" onclick="doLogout()" style="margin-top:4px">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div><div class="pa-sub">${typeof L==='function'?L('सभी sessions साफ़ करें','Clear all sessions'):'Clear all sessions'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
    </div>`);
  } else if(isGuest()){
    openModal(`<div class="modal-handle"></div>
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:44px;margin-bottom:8px">👤</div>
      <div style="font-size:18px;font-weight:900;color:#fff">${escHtml(SESSION.name)}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:4px">Guest Access</div>
      <button type="button" class="profile-action danger" onclick="openDeleteAccountModal()" style="margin-top:12px;justify-content:center;border-color:rgba(244,63,94,.45)">
        <div class="pa-icon" style="background:rgba(244,63,94,.15)">🗑️</div>
        <div><div class="pa-label">${typeof L==='function'?L('Delete Account','Delete Account'):'Delete Account'}</div></div>
      </button>
      <button class="profile-action danger" onclick="doLogout()" style="margin-top:10px;justify-content:center">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div></div>
      </button>
    </div>`);
  } else {
    // Paid-till = subscription date set by Admin (paymentPaidUntil / paidUntil), NOT App License
    let daysLeft = 0, expiryStr = '', expiryDate = '', hasExpiry = false;
    try{
      let paidIso = '';
      const mobileKey = (typeof _normMobileKey==='function') ? _normMobileKey(SESSION.mobile||'') : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
      // 0) paymentStatus (Admin Pay-until) — single source of truth
      if(mobileKey){
        try{
          const ps = await fbGet('paymentStatus/' + mobileKey).catch(function(){return null;});
          if(ps) paidIso = ps.paymentPaidUntil || ps.paidUntil || ps.paymentPaidUntilDate || ps.validTill || '';
        }catch(ePs){}
      }
      // 1) SESSION cache
      if(!paidIso) paidIso = SESSION.paymentPaidUntil || SESSION.paidUntil || window._userPaymentPaidUntil || '';
      // 2) mobileUsers — prefer payment fields; only then validTill
      if(mobileKey){
        try{
          const rec = await fbGet('mobileUsers/' + mobileKey);
          if(rec){
            const fromMu = rec.paymentPaidUntil || rec.paidUntil || '';
            const vt = rec.validTill || '';
            // Use LATEST of payment vs validTill (Admin extension must unlock access)
            if(fromMu && vt){
              const a=new Date(fromMu).getTime(), b=new Date(vt).getTime();
              const pick = (a&&b ? (a>b?fromMu:vt) : (fromMu||vt));
              if(!paidIso) paidIso = pick;
              else {
                const cur = new Date(paidIso).getTime();
                const p = new Date(pick).getTime();
                if(p > cur) paidIso = pick;
              }
            } else {
              const cand = fromMu || vt || '';
              if(cand){
                if(!paidIso) paidIso = cand;
                else {
                  const cur = new Date(paidIso).getTime(), p = new Date(cand).getTime();
                  if(p > cur) paidIso = cand;
                }
              }
            }
            if(!paidIso && rec.managerId){
              try{
                const mid = String(rec.managerId).replace(/\D/g,'').slice(-10);
                const psM = await fbGet('paymentStatus/'+mid).catch(function(){return null;});
                if(psM) paidIso = psM.paymentPaidUntil || psM.paidUntil || '';
                if(!paidIso){
                  const mgr = await fbGet('mobileUsers/' + mid);
                  if(mgr) paidIso = mgr.paymentPaidUntil || mgr.paidUntil || '';
                }
              }catch(e2){}
            }
          }
        }catch(eMu){}
      }
      // 3) deviceApprovals fallback
      if(!paidIso){
        const empObjId = (typeof myEmp==='function' && myEmp()?.id) || SESSION.empObjId;
        if(empObjId){
          const approval = await fbGet('deviceApprovals/' + empObjId);
          if(approval) paidIso = approval.paymentPaidUntil || approval.paidUntil || approval.validTill || '';
        }
      }
      if(paidIso){
        const d = new Date(paidIso);
        if(!isNaN(d.getTime())){
          hasExpiry = true;
          daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
          expiryDate = d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
          expiryStr = expiryDate;
        }
      }
      // Plan / team-size line for Paid till card (e.g. Monthly · Custom plan · 3 Members)
      try{
        let planSrc = {};
        if(mobileKey){
          const rec2 = await fbGet('mobileUsers/' + mobileKey).catch(function(){return null;});
          if(rec2) planSrc = Object.assign({}, rec2);
          try{
            const ps = await fbGet('paymentStatus/' + mobileKey).catch(function(){return null;});
            if(ps) planSrc = Object.assign({}, planSrc, ps);
          }catch(ePs){}
          // Member inherits manager team size / plan when own missing
          if((!planSrc.teamSize && !planSrc.maxMembers && !planSrc.paymentAmount) && planSrc.managerId){
            try{
              const mid = String(planSrc.managerId).replace(/\D/g,'').slice(-10);
              const mgr = await fbGet('mobileUsers/' + mid).catch(function(){return null;});
              if(mgr) planSrc = Object.assign({}, mgr, { paymentPaidUntil: planSrc.paymentPaidUntil || mgr.paymentPaidUntil });
            }catch(eM){}
          }
        }
        if(SESSION){
          if(SESSION.paymentAmount && !planSrc.paymentAmount) planSrc.paymentAmount = SESSION.paymentAmount;
          if(SESSION.planLabel && !planSrc.planLabel) planSrc.planLabel = SESSION.planLabel;
          if(SESSION.teamSize && !planSrc.teamSize) planSrc.teamSize = SESSION.teamSize;
        }
        window._profilePlanLine = (typeof _formatSubscriptionLine === 'function')
          ? (_formatSubscriptionLine(planSrc, window._paymentSettingsCache || {}) || '')
          : (planSrc.planLabel || '');
      }catch(ePlan){ window._profilePlanLine = ''; }
    }catch(ex){}
    const color = !hasExpiry?'#22c55e':daysLeft<=7?'#f43f5e':daysLeft<=15?'#f97316':'#22c55e';
    const icon  = !hasExpiry?'🟢':daysLeft<=0?'🔴':daysLeft<=7?'⚠️':'🟢';
    const msg = !hasExpiry
      ? ((typeof L==='function')?L('कोई Expiry तय नहीं है','No expiry set'):'No expiry set')
      : daysLeft<=0
        ? ((typeof L==='function')?L('Subscription समाप्त — भुगतान करें','Subscription expired — please pay'):'Subscription expired — please pay')
        : daysLeft<=7
          ? ((typeof L==='function')?L('सिर्फ '+daysLeft+' दिन बाकी','Only '+daysLeft+' days left'):('Only '+daysLeft+' days left'))
          : ((typeof L==='function')?L(daysLeft+' दिन बाकी', daysLeft+' days left'):(daysLeft+' days left'));
    const empRec = myEmp();
    const secLabel = empRec ? (secName(empRec.sec) || empRec.sec) : '';
    const roleLabel = isMgr()?'🏅 Manager':isSupervisor()?'👁️ Supervisor':'👤 User';
    openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="text-align:center;padding:10px 0 48px;min-height:0" data-v="v5.1.13-profile-spacer">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#f97316,#a855f7);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:28px;font-weight:900;color:#fff;font-family:'Barlow Condensed',sans-serif;overflow:hidden">${SESSION.photoUrl?`<img src="${SESSION.photoUrl}" style="width:100%;height:100%;object-fit:cover">`:(SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
      <div style="font-size:20px;font-weight:900;color:#fff">${escHtml(SESSION.name)}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:4px">${(SESSION.role==='manager'||SESSION.role==='member')?(function(){ const s=String(SESSION.mobile||'').replace(/\s/g,''); if(s.startsWith('+91')&&s.length>=13) return '📱 +91 '+s.slice(3,8)+' '+s.slice(8); if(s.length===10) return '📱 +91 '+s.slice(0,5)+' '+s.slice(5); return '📱 '+(SESSION.mobile||'—'); })():escHtml((SESSION.empId||'—')+' · '+secLabel)}</div>
      <div style="margin-top:6px"><span style="background:rgba(249,115,22,.15);color:#f97316;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:800">${roleLabel}</span></div>
      ${(function(){
        const er = empRec||{};
        const rows = [
          [L('Emp Code','Emp Code'), er.empId||er.code||SESSION.empId||'—'],
          [L('जन्म तिथि','DOB'), (function(){ const v=er.dob; if(!v)return '—'; const d=new Date(v); return isNaN(d)?String(v):d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'2-digit',month:'short',year:'numeric'}); })()],
          [L('जॉइनिंग','Date of Joining'), (function(){ const v=er.joiningDate||er.doj; if(!v)return '—'; const d=new Date(v); return isNaN(d)?String(v):d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'2-digit',month:'short',year:'numeric'}); })()],
          [L('सैलरी','Salary'), (function(){ const n=er.salary??er.monthlySalary; if(n==null||n==='')return '—'; const num=Number(String(n).replace(/[^\d.]/g,'')); return isNaN(num)?('₹ '+n):('₹ '+num.toLocaleString('en-IN')); })()],
          [L('वीकली ऑफ','Weekly Off'), er.woff||'—'],
          [L('पद','Designation'), er.designation||'—'],
          [L('विभाग','Department'), secLabel||er.sec||'—'],
        ];
        return '<div style="background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:12px 14px;margin:14px 0;text-align:left">'
          +'<div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;margin-bottom:8px">'+(L('मेरी जानकारी','MY DETAILS'))+'</div>'
          +rows.map(([k,v])=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px"><span style="color:var(--muted2)">'+k+'</span><span style="color:var(--text);font-weight:700">'+v+'</span></div>').join('')
          +'</div>';
      })()}
      ${(SESSION.role==='manager'||SESSION.role==='member')?`<button class="profile-action" style="margin-top:6px" onclick="openLeaveBalanceModal()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🏖️</div>
        <div><div class="pa-label">${L('Leave Balance','Leave Balance')}</div><div class="pa-sub">${L('All leave types & remaining','All leave types & remaining')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${(SESSION.role==='manager'||SESSION.role==='member')?`<button class="profile-action" style="margin-top:6px" onclick="openEditProfileModal()">
        <div class="pa-icon" style="background:rgba(96,165,250,.12)">✏️</div>
        <div><div class="pa-label">${L('Profile Edit करें','Edit Profile')}</div><div class="pa-sub">${L('नाम, DOB, जॉइनिंग, सैलरी, वीकली ऑफ','Name, DOB, DOJ, Salary, Weekly Off')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${(SESSION.role==='manager'||SESSION.role==='member'||SESSION.role==='worker')?`<button class="profile-action" style="margin-top:6px" onclick="openAppAccessSecurity()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🔐</div>
        <div><div class="pa-label">${L('ऐप एक्सेस सुरक्षा','App Access Security')}</div><div class="pa-sub">${L('इस device का Password और Fingerprint','Password & Fingerprint for this device')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}

      <div role="button" tabindex="0" onclick="typeof openMemberPayPlans==='function'&&openMemberPayPlans()" style="cursor:pointer;background:var(--panel);border:1.5px solid ${daysLeft<=7?color:'var(--border2)'};border-radius:14px;padding:16px;margin:16px 0;text-align:left">
        <div style="font-size:11px;color:var(--muted2);font-weight:700;letter-spacing:1px;margin-bottom:6px">${L('भुगतान वैध तक','Paid till')} · ${L('टैप करें भुगतान के लिए','Tap to pay')}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:28px">${icon}</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:${color};font-family:'Barlow Condensed',sans-serif">${msg}</div>
            ${expiryStr?`<div style="font-size:11px;color:var(--muted2);margin-top:2px">${L('भुगतान तक: ','Paid till: ')}${expiryStr}</div>`:''}
            ${(window._profilePlanLine)?`<div style="font-size:12px;font-weight:800;color:#0f172a;margin-top:4px">${String(window._profilePlanLine).replace(/</g,'')}</div>`:''}
          </div>
        </div>
      </div>
      ${isMgr()?`<button type="button" class="profile-action" onclick="openShiftSettings()">
        <div class="pa-icon" style="background:rgba(168,85,247,.12)">⚙️</div>
        <div><div class="pa-label">M/c &amp; Shift Setting</div><div class="pa-sub">${L('Shifts & Section/Machine minimums','Shifts & min staff by Section/Machine')}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action" onclick="openHolidayListModal()">
        <div class="pa-icon" style="background:rgba(245,158,11,.12)">📅</div>
        <div><div class="pa-label">Holiday List</div><div class="pa-sub">${L('Date + Reason · Excel / Auto-fetch All-India','Date + Reason · Excel / Auto-fetch All-India')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${isMgr()?`<button type="button" class="profile-action" onclick="openLeaveQuotaSettings()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">📋</div>
        <div><div class="pa-label">Team Leave Quota</div><div class="pa-sub">Yearly leave types for team</div></div>
        <div class="pa-arrow">›</div>
      </button>
`:''}
      ${(SESSION.role==='manager'||isMgr())?`<button type="button" class="profile-action" onclick="openChangeCompanyModal()">
        <div class="pa-icon" style="background:rgba(96,165,250,.12)">🏢</div>
        <div><div class="pa-label">${L('Company Name बदलें','Change Company Name')}</div><div class="pa-sub">${L('वर्तमान: ','Current: ')}${escHtml(SESSION.company||'—')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${isMgr()?`<button type="button" class="profile-action" onclick="openLeaveTeamModal()" style="border-color:rgba(244,63,94,.35)">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">👋</div>
        <div><div class="pa-label">${L('Leave team / Transfer Manager','Leave team / Transfer Manager')}</div><div class="pa-sub">${L('किसी सदस्य को नया Manager बनाकर टीम छोड़ें','Promote a member and leave the team')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      <button class="profile-action" onclick="closeModal();openCustomerCarePage()">
        <div class="pa-icon" style="background:rgba(16,185,129,.12)">🎧</div>
        <div><div class="pa-label">${typeof L==='function'?L('Customer Care','Customer Care'):'Customer Care'}</div><div class="pa-sub">${typeof L==='function'?L('Help · Cancel · '+((window._customerCareCache&&window._customerCareCache.refundDays)||7)+'-day refund','Help · Cancel · '+((window._customerCareCache&&window._customerCareCache.refundDays)||7)+'-day refund'):'Help · Cancel · 7-day refund'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action danger" onclick="openDeleteAccountModal()" style="border-color:rgba(244,63,94,.45);margin-top:8px">
        <div class="pa-icon" style="background:rgba(244,63,94,.15)">🗑️</div>
        <div><div class="pa-label">${typeof L==='function'?L('Delete Account','Delete Account'):'Delete Account'}</div><div class="pa-sub">${typeof L==='function'?L('इस mobile की registration हमेशा के लिए हटाएं','Permanently remove this mobile registration'):'Permanently remove this mobile registration'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action danger" onclick="doLogout()">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div><div class="pa-sub">${typeof L==='function'?L('सभी sessions साफ़ करें','Clear all sessions'):'Clear all sessions'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
    </div>`);
  }
 }catch(ex){
   console.error('showProfile error:',ex);
   openModal(`<div class="modal-handle"></div>
   <div style="text-align:center;padding:10px 0">
     <div style="font-size:18px;font-weight:900;color:#fff">${escHtml(SESSION.name||'—')}</div>
     <button class="profile-action danger" onclick="doLogout()" style="margin-top:16px;justify-content:center">
       <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
       <div><div class="pa-label">Logout</div></div>
     </button>
   </div>`);
 }
}




// ════════════════════════════════════════
// DELETE ACCOUNT — wipe mobile registration so next login is NEW (role select)
// ════════════════════════════════════════
function openDeleteAccountModal(){
  const mob = (typeof _normMobileKey==='function')
    ? _normMobileKey(SESSION.mobile||SESSION.uid||'')
    : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
  if(!mob || mob.length!==10){
    toast(typeof L==='function'?L('❌ Session में mobile नहीं मिला','❌ Mobile not found in session'):'❌ Mobile not found in session');
    return;
  }
  const role = SESSION.role||'';
  const name = String(SESSION.name||mob).replace(/</g,'');
  const T = function(hi,en){ return typeof L==='function' ? L(hi,en) : en; };
  const warnMgr = (role==='manager')
    ? ('<div style="background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.35);border-radius:10px;padding:10px 12px;font-size:12px;color:#fecdd3;margin-bottom:12px;line-height:1.5">⚠️ '
      + T('Manager: Account delete करने पर आपकी पूरी टीम (employees + linked mobiles) हटा दी जाएगी। यह वापस नहीं होगा।',
          'Manager: deleting your account will remove your FULL team (employees + linked mobiles). This cannot be undone.')
      + '</div>')
    : '';
  openModal('<div class="modal-handle"></div>'
    + '<div class="modal-title">🗑️ ' + T('Delete Account','Delete Account') + '</div>'
    + '<div style="font-size:13px;color:var(--muted2);line-height:1.55;margin-bottom:12px">'
    + '<b style="color:var(--text)">' + name + '</b> · +91-' + mob + '<br>'
    + (role ? ('Role: <b style="color:var(--m1)">' + role + '</b><br>') : '')
    + T('यह action <b style="color:#f43f5e">permanent</b> है। अगली बार इसी number से login पर आपको <b>Manager / Member</b> चुनना पड़ेगा — जैसे नया user।',
        'This is <b style="color:#f43f5e">permanent</b>. Next login with this number will ask <b>Manager / Member</b> again — like a new user.')
    + '</div>'
    + warnMgr
    + '<label style="font-size:11px;font-weight:800;color:var(--muted2)">Type <b style="color:#f43f5e">DELETE</b> to confirm</label>'
    + '<input class="inp-field" id="deleteAccountConfirm" placeholder="DELETE" autocomplete="off"'
    + ' style="margin:8px 0 14px;width:100%;box-sizing:border-box;letter-spacing:2px;font-weight:800;text-align:center">'
    + '<button type="button" class="submit-btn" style="background:linear-gradient(135deg,#f43f5e,#be123c)" onclick="confirmDeleteMyAccount()">'
    + '🗑️ ' + T('हाँ — Account Delete करें','Yes — Delete Account') + '</button>'
    + '<button type="button" class="cancel-btn" style="margin-top:8px" onclick="closeModal()">' + T('रद्द करें','Cancel') + '</button>');
  setTimeout(function(){ try{ document.getElementById('deleteAccountConfirm')?.focus(); }catch(e){} }, 100);
}

async function confirmDeleteMyAccount(){
  const conf = (document.getElementById('deleteAccountConfirm')?.value||'').trim().toUpperCase();
  if(conf !== 'DELETE'){
    toast(typeof L==='function'?L('⚠️ Confirm करने के लिए DELETE लिखें','⚠️ Type DELETE to confirm'):'⚠️ Type DELETE to confirm');
    try{ document.getElementById('deleteAccountConfirm')?.focus(); }catch(e){}
    return;
  }
  const mob = (typeof _normMobileKey==='function')
    ? _normMobileKey(SESSION.mobile||SESSION.uid||'')
    : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
  if(!mob || mob.length!==10){
    toast('❌ Mobile missing');
    return;
  }
  try{
    if(typeof _ensureWriteAuth==='function'){
      try{ await _ensureWriteAuth(); }catch(e){}
    }
    toast(typeof L==='function'?L('⏳ Account delete हो रहा है…','⏳ Deleting account…'):'⏳ Deleting account…');

    const empObjId = SESSION.empObjId || SESSION.empId || '';
    const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';

    // 0) Backup team + schedules before wipe (6-month retention)
    try{
      if(typeof backupBeforeAccountDelete==='function'){
        await backupBeforeAccountDelete({
          mobile: mob,
          deletedBy: SESSION.name || SESSION.role || 'self',
          reason: (String(SESSION.role||'').toLowerCase()==='manager') ? 'manager_self_delete' : 'self_delete_account',
          company: SESSION.company || SESSION.companyId || '',
          managerName: SESSION.name || ''
        });
      }
    }catch(bakErr){ console.warn('[deleteAccount] backup', bakErr); }

    // 1) Remove mobile registration (critical — next login becomes NEW)
    //    Try every key variant; verify read-back so login cannot see approved manager.
    var _muKeys = [mob, '+91'+mob, '91'+mob];
    var _muDeleted = false;
    for (var _ui=0; _ui<_muKeys.length; _ui++){
      var _muk = _muKeys[_ui];
      try{ await fbRemove('mobileUsers/'+_muk); _muDeleted = true; }catch(e){
        try{ await fbSet('mobileUsers/'+_muk, null); _muDeleted = true; }catch(e2){
          try{
            await fbSet('mobileUsers/'+_muk, {
              status: 'removed',
              role: 'removed',
              forceFreshLogin: true,
              deletedAt: new Date().toISOString(),
              deletedBy: 'self'
            });
            _muDeleted = true;
          }catch(e3){ console.warn('[deleteAccount] mobileUsers '+_muk, e3); }
        }
      }
    }
    // Verify — if still approved, force tombstone one more time
    try{
      var _check = await fbGet('mobileUsers/'+mob);
      if(_check && (_check.status==='approved' || _check.role==='manager' || _check.role==='member')){
        try{
          await fbSet('mobileUsers/'+mob, {
            status: 'removed',
            role: 'removed',
            forceFreshLogin: true,
            deletedAt: new Date().toISOString(),
            deletedBy: 'self',
            name: null,
            empObjId: null
          });
        }catch(eV){ console.warn('[deleteAccount] verify tombstone', eV); }
      }
    }catch(eC){}
    try{
      if(window._cache && _cache.mobileUsers){
        _muKeys.forEach(function(k){ try{ delete _cache.mobileUsers[k]; }catch(e){} });
      }
    }catch(e){}

    // 2) Managers node
    try{ await fbRemove('managers/'+mob); }catch(e){
      try{ await fbSet('managers/'+mob, null); }catch(e2){}
    }

    // 3) Device approvals for this employee
    if(empObjId){
      try{ await fbRemove('deviceApprovals/'+empObjId); }catch(e){
        try{ await fbSet('deviceApprovals/'+empObjId, null); }catch(e2){}
      }
    }

    // 4) Manager self-delete → remove FULL team roster + linked mobileUsers under this manager
    //    Member self-delete → only mark own employee record left
    try{
      const all = (window._cache && Array.isArray(_cache.employees) && _cache.employees.length)
        ? _cache.employees.slice()
        : ((typeof getEmps==='function') ? getEmps() : []);
      const role = String(SESSION.role||'').toLowerCase();
      const isMgr = role==='manager' || role==='admin';
      const norm = function(p){
        return (typeof _normMobileKey==='function') ? _normMobileKey(p||'') : String(p||'').replace(/\D/g,'').slice(-10);
      };
      const teamOrSelf = (all||[]).filter(function(e){
        if(!e) return false;
        // always include own record
        if(empObjId && (e.id===empObjId || e.empId===empObjId)) return true;
        const ph = norm(e.phone||e.mobile||'');
        if(ph && ph===mob) return true;
        if(!isMgr) return false;
        // manager cascade: anyone managed by this mobile / emp id
        const mid = norm(e.managerId||e.managerMobile||e.mgrId||'');
        if(mid && (mid===mob || (empObjId && mid===norm(empObjId)))) return true;
        return false;
      });
      for(var i=0;i<teamOrSelf.length;i++){
        var e = teamOrSelf[i];
        if(!e || !e.id) continue;
        try{
          // Prefer hard delete so Team roster does not keep ghosts
          if(typeof fbRemove==='function') await fbRemove('employees/'+e.id);
          else await fbSet('employees/'+e.id, null);
        }catch(err){
          try{
            await fbUpdate('employees/'+e.id, {
              status: 'left_team',
              leftAt: new Date().toISOString(),
              leftReason: isMgr ? 'manager_self_delete_cascade' : 'self_delete_account',
              forceFreshLogin: true
            });
          }catch(err2){ console.warn('[deleteAccount] emp', err2); }
        }
        // Also remove member mobileUsers that pointed at this manager (not the manager's own — already removed)
        try{
          const mph = norm(e.phone||e.mobile||'');
          if(mph && mph.length===10 && mph!==mob){
            if(typeof fbRemove==='function') await fbRemove('mobileUsers/'+mph);
            else await fbSet('mobileUsers/'+mph, null);
          }
        }catch(muErr){}
      }
      // Clear local cache so UI does not keep showing deleted team
      try{
        if(window._cache && Array.isArray(_cache.employees)){
          const drop = new Set(teamOrSelf.map(function(x){ return x && x.id; }).filter(Boolean));
          _cache.employees = _cache.employees.filter(function(x){ return x && !drop.has(x.id); });
        }
      }catch(ce){}
    }catch(e){ console.warn('[deleteAccount] employees', e); }

    // 5) Local device password + auth markers for this mobile/emp
    try{
      if(typeof _clearDevicePassword==='function') _clearDevicePassword(empObjId, mob);
      else {
        if(empObjId) localStorage.removeItem('mp_pw_'+empObjId);
        localStorage.removeItem('mp_pw_m_'+mob);
      }
    }catch(e){}
    try{
      localStorage.removeItem('mp_device_phone');
      localStorage.removeItem('mp_device_verified_at');
      localStorage.removeItem('mp_write_auth_at');
      sessionStorage.removeItem('mp_write_auth');
      localStorage.removeItem('fp_registered');
    }catch(e){}

    // 6) Notify admin (best effort)
    try{
      if(typeof notifyAdmin==='function'){
        await notifyAdmin('🗑️ Account deleted by user', (SESSION.name||'')+' · +91-'+mob+' · role '+(SESSION.role||''));
      } else if(typeof fbPush==='function'){
        await fbPush('adminNotifications', {
          type: 'account_deleted',
          title: 'Account deleted',
          body: (SESSION.name||'')+' · +91-'+mob,
          mobile: mob,
          read: false,
          at: new Date().toISOString()
        });
      }
    }catch(e){}

    closeModal();
    toast(typeof L==='function'
      ? L('✅ Account delete हो गया। अगली बार Manager/Member चुनें।','✅ Account deleted. Next login choose Manager/Member.')
      : '✅ Account deleted. Next login choose Manager/Member.');
    setTimeout(function(){
      try{ doLogout(); }catch(e){ location.href = location.pathname + '?logout=' + Date.now(); }
    }, 900);
  }catch(err){
    console.error('[deleteAccount]', err);
    toast('❌ '+(err && err.message ? err.message : 'Delete failed'));
  }
}
try{
  window.openDeleteAccountModal = openDeleteAccountModal;
  window.confirmDeleteMyAccount = confirmDeleteMyAccount;
}catch(e){}

