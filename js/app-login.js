/**
 * Man Power — split module (P3). Loaded after app-core.js in global scope.
 * Do not use ES modules here — functions share window globals with app-core.
 */
// MODULE: login / OTP / device password / launch hooks
// ════════════════════════════════════════
// LOGIN — 3-STEP TAP FLOW
// ════════════════════════════════════════
let _step1Company = '';
let _step1Code    = '';
let _step3Dept    = '';

const COMPANY_INFO = {
  // Page 1 — Top 5
  METPOWER:   { ico:'🏭', label:'Man Power',    sub:'Team Management',     color:'#f97316', page:1 },
  UFLEX:      { ico:'📦', label:'UFlex',         sub:'Noida',         color:'#38bdf8', page:1 },
  JINDAL:     { ico:'🎞️', label:'Jindal',        sub:'Poly Films',    color:'#a3e635', page:1 },
  CHIRIPAL:   { ico:'🏬', label:'Chiripal',      sub:'Poly Films',    color:'#e879f9', page:1 },
  COSMO:      { ico:'🌀', label:'Cosmo Films',   sub:'Mumbai',        color:'#818cf8', page:1 },
  // Page 2 — Next 5
  POLYPLEX:   { ico:'🔷', label:'Polyplex',      sub:'PET Films',     color:'#22d3ee', page:2 },
  HUHTAMAKI:  { ico:'🌿', label:'Huhtamaki',     sub:'PPL',           color:'#4ade80', page:2 },
  ESTER:      { ico:'🧪', label:'Ester Films',   sub:'Films',         color:'#fb923c', page:2 },
  GARWARE:    { ico:'🏗️', label:'Garware',       sub:'Poly Films',    color:'#facc15', page:2 },
  TREOFAN:    { ico:'⚙️', label:'Treofan',       sub:'BOPP Films',    color:'#a78bfa', page:2 },
  OTHERS:     { ico:'🌐', label:'Others',        sub:'Any Company',   color:'#94a3b8', page:2 },
};
const DEPT_INFO = {
  MET:     { ico:'🏭', label:'MET',      sub:'Metalliser' },
  PET:     { ico:'🔵', label:'PET Line', sub:'PET Film' },
  ADMIN:   { ico:'🛡️', label:'Admin',    sub:'Management' },
  TRAINEE: { ico:'📚', label:'Trainee',  sub:'New Joinee' },
  OTHERS:  { ico:'🌐', label:'Others',   sub:'' },
};

function showStep(n){
  const allSteps=['loginStep1','loginStep2','loginStep3','adminLoginPanel',
    'loginStepManagerReg','loginStepMemberReg','loginStepPending'];
  allSteps.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  const map={1:'loginStep1',2:'loginStep2',3:'loginStep3','admin':'adminLoginPanel',
    'mgrReg':'loginStepManagerReg','memReg':'loginStepMemberReg','pending':'loginStepPending'};
  // Ensure login shell is visible (prevents black screen after OTP / role select)
  try{
    const ls = document.getElementById('loginScreen');
    if(ls){
      // Full cssText so previous display:none!important / empty styles cannot leave a blank page
      ls.style.cssText = 'display:flex!important;position:fixed;inset:0;z-index:500;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 20px 40px;overflow:auto;background:linear-gradient(160deg,#070c15 0%,#0d1623 45%,#130a24 100%);visibility:visible;opacity:1;pointer-events:auto;';
      ls.classList.add('show');
    }
    const pb = document.getElementById('pendingBox');
    if(pb && n !== 'pendingBox') pb.style.display = 'none';
    const mh = document.getElementById('mainHdr');
    const mc = document.getElementById('mainContent');
    const fp = document.getElementById('fingerprintScreen');
    if(fp){ fp.style.display='none'; fp.classList.remove('show'); }
    // When on login steps, keep main app hidden
    if(n === 1 || n === 2 || n === 3 || n === 'admin' || n === 'mgrReg' || n === 'memReg' || n === 'pending'){
      if(mh) mh.style.display = 'none';
      if(mc) mc.style.display = 'none';
    }
    // Clear any leftover reCAPTCHA host that can cover the UI
    try{
      ['recaptcha-container','recaptcha-container-device','recaptcha-container-delall','reauthRecaptcha'].forEach(function(cid){
        var host = document.getElementById(cid);
        if(host && host.querySelector('iframe')){
          // keep iframe for auth if needed; only shrink empty overlays
        }
      });
    }catch(e){}
  }catch(e){ console.warn('showStep shell', e); }
  const el=document.getElementById(map[n]);
  if(el){
    el.style.display='flex';
    el.style.visibility='visible';
    el.style.opacity='1';
  } else {
    console.warn('[showStep] missing step element for', n, map[n]);
  }
}

/** Full-screen pending overlay (outside loginScreen) — never black */
function showPendingBox(msgHtml){
  try{
    const ls = document.getElementById('loginScreen');
    if(ls){ ls.style.display='none'; ls.classList.remove('show'); }
    const mh = document.getElementById('mainHdr');
    const mc = document.getElementById('mainContent');
    if(mh) mh.style.display='none';
    if(mc) mc.style.display='none';
    let pb = document.getElementById('pendingBox');
    if(!pb){
      pb = document.createElement('div');
      pb.id = 'pendingBox';
      pb.style.cssText = 'display:flex;position:fixed;inset:0;z-index:600;background:linear-gradient(160deg,#070c15 0%,#0d1623 45%,#130a24 100%);flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;';
      document.body.appendChild(pb);
    }
    const defaultMsg = msgHtml || 'आपका registration / login <b>pending</b> है। Manager या Admin approve होने तक प्रतीक्षा करें।';
    pb.innerHTML = `
      <div style="font-size:48px;margin-bottom:12px">⏳</div>
      <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:10px">Approval Pending</div>
      <div data-pending-msg style="font-size:13px;color:#94a3b8;line-height:1.7;max-width:320px;margin-bottom:20px">${defaultMsg}</div>
      <button type="button" onclick="hidePendingBox();showStep(2);"
        style="width:min(280px,90%);padding:12px;border-radius:12px;border:1px solid rgba(249,115,22,.5);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;margin-bottom:10px">
        ← वापस जाएं / Retry Login
      </button>
      <button type="button" onclick="location.reload()"
        style="width:min(280px,90%);padding:10px;border-radius:12px;border:1px solid rgba(148,163,184,.25);background:transparent;color:#94a3b8;font-weight:600;font-size:12px;cursor:pointer;font-family:inherit">
        🔄 Page Refresh
      </button>`;
    pb.style.display = 'flex';
    try{ sessionStorage.setItem('mp_pending_login', String(Date.now())); }catch(e){}
  }catch(e){
    console.error('showPendingBox', e);
    try{ showStep('pending'); }catch(e2){}
  }
}
function hidePendingBox(){
  const pb = document.getElementById('pendingBox');
  if(pb) pb.style.display = 'none';
  try{ sessionStorage.removeItem('mp_pending_login'); }catch(e){}
  const ls = document.getElementById('loginScreen');
  if(ls){ ls.style.display='flex'; ls.classList.add('show'); }
  showStep(1);
}

function backToStep1(){ _stopApprovalWatch(); showStep(1); }
function showAdminLogin(){ showStep('admin'); setTimeout(()=>document.getElementById('aUser')?.focus(),100); }
// Guest multi-company entry removed — mobile OTP is the only login entry
function checkGuestCompany(){ /* removed */ }
function selectCompany(){ /* removed */ }
function showCompanyPage(){ /* removed */ }
function goToStep2(){ try{ showStep(1); }catch(e){} }

let _loginMobile='', _loginConfirmResult=null, _otpResendInterval=null;

function _onMobileInput(val){
  const btn=document.getElementById('sendOtpBtn');
  if(btn){
    const ok=val.length===10;
    btn.disabled=!ok;
    btn.style.opacity=ok?'1':'.5';
    btn.style.pointerEvents=ok?'auto':'none';
    btn.style.cursor=ok?'pointer':'not-allowed';
  }
}
function _onOtpInput(val){
  const btn=document.getElementById('verifyOtpBtn');
  if(btn){ const ok=val.length===6; btn.disabled=!ok; btn.style.opacity=ok?'1':'.5'; }
}

async function _sendOTP(isResend){
  // Device-OTP overlay uses same button id sometimes — route if employee flow active
  if(_otpEmp && document.getElementById('otpLoginOverlay')?.style.display !== 'none'
      && document.getElementById('otpLoginOverlay')?.style.display !== ''){
    return _sendDeviceOTP(!!isResend);
  }
  const mobileEl=document.getElementById('loginMobile');
  const mobile=(mobileEl?.value||'').trim().replace(/\D/g,'');
  if(mobile.length!==10){ toast('⚠️ 10 अंकों का Mobile Number डालें'); return; }
  const fullPhone='+91'+mobile;
  _loginMobile=fullPhone;
  const errEl=document.getElementById('loginErr');
  if(errEl) errEl.textContent='';

  // ── v2.4.2: Returning user with device password → NO OTP ──
  if(!isResend && !window._forceOtpAfterMgrWait && !window._forceOtpAfterPwForgot){
    try{
      const userData = await fbGet('mobileUsers/'+mobile);
      if(userData && userData.status==='approved' &&
         (userData.role==='member' || userData.role==='manager' || userData.role==='worker')){
        if(!(userData.validTill && new Date(userData.validTill)<new Date())){
          const empObjId = userData.empObjId || userData.employeeId || '';
          const savedPw = _getDevicePasswordHash(empObjId, mobile);
          const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';
          let deviceOk = false;
          if(empObjId){
            try{
              const dRec = await fbGet('deviceApprovals/'+empObjId);
              if(dRec && dRec.approvedDeviceId === deviceId && dRec.validTill && new Date(dRec.validTill)>new Date()){
                deviceOk = true;
              }
            }catch(e){}
          }
          // Also accept password if this browser recently verified same phone (90d)
          let recentPhone = false;
          try{
            const had = (localStorage.getItem('mp_device_phone')||'').replace(/\D/g,'').slice(-10);
            const vat = parseInt(localStorage.getItem('mp_device_verified_at')||'0',10);
            recentPhone = (had===mobile && vat && (Date.now()-vat) < 90*24*3600*1000);
          }catch(e){}
          if(savedPw && (deviceOk || recentPhone)){
            showPasswordLoginForMobile(userData, mobile, deviceId);
            return;
          }
          // Trusted device but no password yet → offer set password (optional skip → still need OTP once OR set pw)
          if((deviceOk || recentPhone) && !savedPw){
            const fakeEmp = {
              id: empObjId || ('m_'+mobile),
              empId: userData.empId||userData.empCode||'',
              name: userData.name||'',
              phone: mobile,
              mobile: mobile,
              _userData: userData
            };
            showSetPasswordScreen(fakeEmp, deviceId, false, userData, mobile);
            return;
          }
        }
      }
    }catch(e){ console.warn('[login] password gate', e); }
  }
  window._forceOtpAfterPwForgot = false;

  // Registered member/manager: offer Manager in-app approval first (saves OTP cost)
  // Skip this gate on explicit resend or when force-OTP flag is set
  if(!isResend && !window._forceOtpAfterMgrWait){
    try{
      const _isHard = (typeof _isHardAdminPhone==='function')
        ? _isHardAdminPhone(mobile)
        : ['8929397949'].includes(String(mobile||'').replace(/\D/g,'').slice(-10));
      if(!_isHard){
        const userData = await fbGet('mobileUsers/'+mobile);
        if(userData && userData.status==='approved' &&
           !(userData.validTill && new Date(userData.validTill)<new Date())){
          const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';
          const empObjId = userData.empObjId || userData.employeeId || '';
          let otherDeviceActive = false;
          let dRec = null;
          if(empObjId){
            try{
              dRec = await fbGet('deviceApprovals/'+empObjId);
              if(dRec && dRec.approvedDeviceId && dRec.approvedDeviceId !== deviceId
                  && dRec.validTill && new Date(dRec.validTill) > new Date()){
                otherDeviceActive = true;
              }
            }catch(e){}
          }
          // Registered MANAGER: Notify other device | Send OTP (side by side)
          if(userData.role==='manager'){
            if(otherDeviceActive){
              const emp = {
                id: empObjId,
                empId: userData.empId||userData.empCode||'',
                name: userData.name||'',
                phone: mobile,
                mobile: mobile,
                role: 'manager'
              };
              showOtherDeviceLoginRequest(emp, dRec, deviceId);
              return;
            }
            // No other device — fall through to OTP
          } else if(userData.role==='member' || userData.role==='worker'){
            // Team member: NO manager approval for login — OTP (or password already handled above)
            // If other device active, still offer notify | OTP side by side
            if(otherDeviceActive){
              const emp = {
                id: empObjId,
                empId: userData.empId||userData.empCode||'',
                name: userData.name||'',
                phone: mobile,
                mobile: mobile
              };
              showOtherDeviceLoginRequest(emp, dRec, deviceId);
              return;
            }
            // else fall through → send OTP → login; manager only notified after login
          }
        }
      }
    }catch(e){ console.warn('[login] dual-option check', e); }
  }
  window._forceOtpAfterMgrWait = false;

  try{
    toast(isResend ? '⏳ Resending OTP…' : 'OTP भेजा जा रहा है...');
    _loginConfirmResult = await _fbSendPhoneOtp(fullPhone, 'recaptcha-container', '_fbRecaptchaNew');
    showStep(2);
    const sentEl=document.getElementById('otpSentTo');
    if(sentEl) sentEl.textContent='+91-'+mobile+' पर OTP भेजा गया';
    document.getElementById('otpInput')?.focus();
    _startResendTimer();
    _startWebOtpListen('otpInput', code=>{
      if(code && code.length===6) setTimeout(()=>{ try{ _verifyOTP(); }catch(e){} }, 250);
    });
    toast('✅ OTP भेज दिया!');
  }catch(err){
    console.error('OTP error:',err);
    const msg = '❌ '+_fbOtpErrorMessage(err);
    if(errEl) errEl.textContent=msg; toast(msg);
  }
}

function _startResendTimer(){
  let sec=30;
  const timerEl=document.getElementById('otpResendTimer');
  const resendBtn=document.getElementById('otpResendBtn');
  if(resendBtn) resendBtn.style.display='none';
  if(_otpResendInterval) clearInterval(_otpResendInterval);
  _otpResendInterval=setInterval(()=>{
    sec--;
    if(timerEl) timerEl.textContent=sec>0?sec+'s में फिर भेजें':'';
    if(sec<=0){
      clearInterval(_otpResendInterval);
      if(resendBtn) resendBtn.style.display='inline';
      if(timerEl) timerEl.textContent='';
    }
  },1000);
}

async function _verifyOTP(){
  _stopWebOtpListen();

  // If device OTP overlay is open, use device flow
  const ov = document.getElementById('otpLoginOverlay');
  if(_otpEmp && ov && ov.style.display !== 'none' && ov.style.display !== ''){
    return _verifyDeviceOTP();
  }
  const otp=(document.getElementById('otpInput')?.value||'').trim().replace(/\D/g,'');
  if(otp.length!==6){ toast('⚠️ 6 अंकों का OTP डालें'); return; }
  if(!_loginConfirmResult){ toast('⚠️ OTP पहले भेजें'); return; }
  try{
    toast('⏳ Verify हो रहा है...');
    await _fbVerifyPhoneOtp(_loginConfirmResult, otp);
    toast('✅ Mobile Verified!');
    await _checkUserAfterOTP();
  }catch(err){
    const errEl=document.getElementById('loginErr2');
    const msg='❌ '+_fbOtpErrorMessage(err);
    if(errEl) errEl.textContent=msg; toast(msg);
  }
}


/** Notify manager that a team member logged in (info only — no approval). */
async function _notifyManagerMemberLogin(userData, mobile){
  try{
    const mid = (typeof _normMobileKey==='function')
      ? _normMobileKey(userData.managerId||userData.managerMobile||'')
      : String(userData.managerId||'').replace(/\D/g,'').slice(-10);
    const name = userData.name || mobile || 'Member';
    const notif = {
      type: 'member_login',
      title: '👤 Team member logged in',
      body: name + ' logged in on a device',
      mobile: mobile,
      name: name,
      empObjId: userData.empObjId || userData.employeeId || '',
      empId: userData.empId || userData.empCode || '',
      read: false,
      at: new Date().toISOString()
    };
    if(mid){
      try{ await fbPush('userNotifications/'+mid, notif); }catch(e){}
      try{
        const mgrRec = await fbGet('mobileUsers/'+mid);
        if(mgrRec && (mgrRec.empObjId||mgrRec.employeeId)){
          await fbPush('userNotifications/'+(mgrRec.empObjId||mgrRec.employeeId), notif);
        }
      }catch(e){}
    }
  }catch(e){ console.warn('[notify manager login]', e); }
}

/**
 * Roster member (in employees under a manager) — OTP already verified.
 * Link/create mobileUsers as approved, claim device, launch, notify manager (no approval).
 * Then offer device password / fingerprint so this device is remembered.
 */
async function _loginRosterMemberAfterOtp(mobile, empMatch){
  const mob = (typeof _normMobileKey==='function') ? _normMobileKey(mobile) : String(mobile||'').replace(/\D/g,'').slice(-10);
  if(!mob || mob.length!==10 || !empMatch) return false;
  const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';
  const managerId = (typeof _normMobileKey==='function')
    ? _normMobileKey(empMatch.managerId||empMatch.managerMobile||'')
    : String(empMatch.managerId||'').replace(/\D/g,'').slice(-10);

  let existing = null;
  try{ existing = await fbGet('mobileUsers/'+mob); }catch(e){}

  const userData = {
    role: (existing && existing.role==='manager') ? 'manager' : 'member',
    name: empMatch.name || (existing && existing.name) || '',
    mobile: '+91'+mob,
    phone: mob,
    company: empMatch.company || (existing && existing.company) || '',
    status: 'approved',
    empCode: empMatch.empId || (existing && (existing.empCode||existing.empId)) || '',
    empId: empMatch.empId || (existing && existing.empId) || '',
    empObjId: empMatch.id || (existing && (existing.empObjId||existing.employeeId)) || '',
    employeeId: empMatch.id || (existing && (existing.empObjId||existing.employeeId)) || '',
    managerId: managerId || (existing && existing.managerId) || '',
    managerMobile: managerId || (existing && existing.managerMobile) || '',
    section: empMatch.sec || empMatch.section || (existing && existing.section) || '',
    registeredAt: (existing && existing.registeredAt) || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    linkedVia: 'roster_otp',
    validTill: (existing && existing.validTill) || new Date(Date.now()+365*86400000).toISOString()
  };

  // Write without forcing illegal status transitions that rules reject
  try{
    if(!existing){
      await fbSet('mobileUsers/'+mob, userData);
    } else {
      // Prefer update; keep role if already manager
      const patch = Object.assign({}, userData);
      if(existing.role==='manager') patch.role = 'manager';
      // If existing was pending/left — set approved (rules updated to allow own-phone heal)
      patch.status = 'approved';
      await fbUpdate('mobileUsers/'+mob, patch);
    }
  }catch(e){
    console.warn('[roster login] mobileUsers write', e);
    // Still try launch with in-memory userData if write blocked
  }

  // Claim this device
  const empObjId = userData.empObjId || '';
  if(empObjId && deviceId){
    try{
      await fbUpdate('deviceApprovals/'+empObjId, {
        approvedDeviceId: deviceId,
        approvedAt: new Date().toISOString(),
        validTill: new Date(Date.now()+365*86400000).toISOString(),
        empName: userData.name,
        empId: userData.empId || '',
        mobile: mob,
        deviceName: (typeof _guessDeviceLabel==='function' ? _guessDeviceLabel() : ''),
        via: 'roster_otp'
      });
    }catch(e){}
  }

  await _notifyManagerMemberLogin(userData, mob);
  _launchAsNewUser(userData);

  // Offer device password so next time this device is remembered (like managers)
  try{
    const savedPw = _getDevicePasswordHash(empObjId, mob);
    if(!savedPw && empObjId){
      setTimeout(()=>{
        try{
          showSetPasswordScreen(
            { id: empObjId, name: userData.name, empId: userData.empId, phone: mob, mobile: mob },
            deviceId,
            true,
            userData,
            mob
          );
        }catch(e){}
      }, 900);
    } else if(empObjId && userData.name){
      setTimeout(()=>{ try{ registerFingerprint(userData.name, empObjId); }catch(e){} }, 1200);
    }
  }catch(e){}
  return true;
}

async function _checkUserAfterOTP(){
  const mobile=(typeof _normMobileKey==='function') ? _normMobileKey(_loginMobile) : String(_loginMobile||'').replace(/\D/g,'').slice(-10);
  try{
    // Hard-coded Admin phones → always Admin (full team), not User/Member from mobileUsers
    if(_isHardAdminPhone(mobile) || _isHardAdminPhone(_loginMobile)){
      _launchAsHardAdmin(mobile);
      return;
    }
    const userData=await fbGet('mobileUsers/'+mobile);
    if(userData){
      if(userData.status==='pending'){
        // Team Member pending → limited app (never black, never stuck silent screen)
        if(userData.role==='member'){
          try{
            await _launchAsNewUser(userData);
          }catch(e){
            console.error('[otp] pending member launch', e);
            showPendingBox('आपका Member registration <b>pending</b> है। Manager approve होने तक सीमित access।<br><br>कृपया page refresh करके दोबारा OTP try करें।');
          }
          setTimeout(()=>{ try{ _watchApprovalStatus(mobile); }catch(e){} }, 800);
          return;
        }
        // Manager or other pending → clear waiting UI (not black)
        const rLabel=userData.role==='manager'?'Manager':'Member';
        const name = userData.name || mobile;
        const msg = userData.role==='manager'
          ? ('आपका <b>Manager</b> registration (<b>'+name+'</b>) Admin approval का इंतज़ार कर रहा है।')
          : ('आपका registration (<b>'+name+'</b>) approval का इंतज़ार कर रहा है।');
        try{
          const pendMsg=document.getElementById('pendingMsg');
          if(pendMsg) pendMsg.innerHTML=msg+'<br><br>'+(userData.role==='manager'?'VKS Tech Admin वेरिफाई करेगा।':'आपका Manager अप्रूव करेगा।');
          showStep('pending');
        }catch(e){
          showPendingBox(msg);
        }
        _watchApprovalStatus(mobile);
        return;
      }
      if(userData.status==='rejected'){
        toast('❌ आपका रजिस्ट्रेशन reject हो गया। VKS Tech से संपर्क करें।'); return;
      }
      if(userData.status==='revoked'){
        toast('🚫 आपकी access revoke कर दी गई है। VKS Tech से संपर्क करें: +91-8929394920'); return;
      }
      if(userData.status==='left_team' || userData.status==='left' || userData.status==='removed'){
        try{ await fbRemove('mobileUsers/'+mobile); }catch(e){}
        toast('👋 Team से हटा दिए गए — दोबारा Manager/Member register करें');
        showStep(3);
        return;
      }
      try{
        const allEmp = _cache.employees || [];
        const empHit = allEmp.find(e => _normMobileKey(e.phone||e.mobile||'')===mobile);
        if(empHit && (empHit.status==='resigned'||empHit.status==='left'||empHit.status==='left_team'||empHit.status==='removed')){
          try{ await fbUpdate('mobileUsers/'+mobile, { status:'left_team', managerId:null, leftAt:new Date().toISOString() }); }catch(e){}
          toast('👋 आप team से remove हो चुके हैं — दोबारा register करें');
          showStep(3);
          return;
        }
      }catch(e){}
      if(userData.status==='approved'){
        if(userData.validTill && new Date(userData.validTill)<new Date()){
          toast('⏰ आपकी access expire हो गई है। Admin से validity बढ़वाएं: +91-8929394920'); return;
        }
        // Mobile-first login: never ask Emp Code — but if another device already active, request approve there
        try{
          const deviceId = getDeviceId();
          // Resolve employee by mobile
          let empMatch = null;
          try{
            const all = Object.values(await fbGet('employees')||{}) || (_cache.employees||[]);
            const mobKey = _normMobileKey(mobile);
            empMatch = all.find(e => _normMobileKey(e.phone||e.mobile||'') === mobKey);
            if(!empMatch && userData.empObjId) empMatch = all.find(e=>e.id===userData.empObjId);
            if(!empMatch && (userData.empId||userData.empCode)){
              const code = String(userData.empId||userData.empCode).trim().toUpperCase();
              empMatch = all.find(e=>String(e.empId||'').trim().toUpperCase()===code);
            }
          }catch(e){}
          const empObjId = (empMatch&&empMatch.id) || userData.empObjId || userData.employeeId || '';
          if(empObjId && (userData.role==='member' || userData.role==='worker' || userData.role==='manager')){
            let dRec = null;
            try{ dRec = await fbGet('deviceApprovals/'+empObjId); }catch(e){}
            if(dRec && dRec.approvedDeviceId && dRec.approvedDeviceId !== deviceId
                && dRec.validTill && new Date(dRec.validTill) > new Date()){
              // Already logged in on another device → approve from that device (no OTP again, no Emp Code)
              const emp = empMatch || {
                id: empObjId,
                empId: userData.empId||userData.empCode||'',
                name: userData.name||'',
                phone: mobile
              };
              showOtherDeviceLoginRequest(emp, dRec, deviceId);
              return;
            }
            // First time / same device → claim this device (CURRENT employee name, not stale mobileUsers)
            try{
              const liveName = (empMatch && empMatch.name) || userData.name || '';
              const liveCode = (empMatch && empMatch.empId) || userData.empId || userData.empCode || '';
              await fbUpdate('deviceApprovals/'+empObjId, {
                approvedDeviceId: deviceId,
                approvedAt: new Date().toISOString(),
                validTill: new Date(Date.now()+365*86400000).toISOString(),
                empName: liveName,
                empId: liveCode,
                mobile: _normMobileKey(mobile),
                deviceName: (typeof _guessDeviceLabel==='function'?_guessDeviceLabel():''),
                via: 'mobile_otp'
              });
              // Refresh mobileUsers to current employee identity
              try{
                await _syncMobileUserToCurrentEmployee(mobile, userData, { deviceId, via:'mobile_otp' });
              }catch(e){}
            }catch(e){}
          }
        }catch(e){ console.warn('[mobile login device]', e); }
        // Prefer live employee identity before launch
        try{
          const live = await _resolveEmpByMobile(mobile);
          if(live && live.name){
            userData = Object.assign({}, userData, {
              name: live.name,
              empId: live.empId || userData.empId,
              empCode: live.empId || userData.empCode,
              empObjId: live.id,
              employeeId: live.id,
              managerId: userData.managerId || live.managerId || ''
            });
          }
        }catch(e){}
        // Member/worker login → notify manager (info only, no approval)
        if(userData.role==='member' || userData.role==='worker'){
          try{ await _notifyManagerMemberLogin(userData, mobile); }catch(e){}
        }
        _launchAsNewUser(userData);
        // Remember device: offer password / fingerprint if not set
        try{
          const empObjId = userData.empObjId || userData.employeeId || '';
          const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';
          const savedPw = _getDevicePasswordHash(empObjId, mobile);
          if(!savedPw && empObjId){
            setTimeout(()=>{
              try{
                showSetPasswordScreen(
                  { id: empObjId, name: userData.name, empId: userData.empId, phone: mobile, mobile: mobile },
                  deviceId, true, userData, mobile
                );
              }catch(e){}
            }, 900);
          } else if(empObjId && userData.name){
            setTimeout(()=>{ try{ registerFingerprint(userData.name, empObjId); }catch(e){} }, 1200);
          }
        }catch(e){}
        return;
      }
    }
    // No mobileUsers row — check if phone is already on a manager's team roster
    try{
      const rosterEmp = await _resolveEmpByMobile(mobile);
      if(rosterEmp && rosterEmp.status!=='resigned' && rosterEmp.status!=='left'
          && rosterEmp.status!=='left_team' && rosterEmp.status!=='removed'){
        const ok = await _loginRosterMemberAfterOtp(mobile, rosterEmp);
        if(ok) return;
      }
    }catch(e){ console.warn('[otp] roster resolve', e); }

    // Truly new mobile → role select (Manager / Member). Never leave blank.
    showStep(3);
    setTimeout(function(){
      try{
        var step3 = document.getElementById('loginStep3');
        var login = document.getElementById('loginScreen');
        var visible = step3 && step3.style.display !== 'none' && login &&
          (login.classList.contains('show') || login.style.display === 'flex' || login.style.display === 'flex');
        if(!visible){
          console.warn('[otp] role step not visible — force showStep(3)');
          showStep(3);
        }
      }catch(e){}
    }, 400);
  }catch(err){
    console.error('_checkUserAfterOTP:',err);
    // Last chance: roster login even if mobileUsers read failed
    try{
      const mobile2=(typeof _normMobileKey==='function') ? _normMobileKey(_loginMobile) : String(_loginMobile||'').replace(/\D/g,'').slice(-10);
      const rosterEmp = await _resolveEmpByMobile(mobile2);
      if(rosterEmp){
        const ok = await _loginRosterMemberAfterOtp(mobile2, rosterEmp);
        if(ok) return;
      }
    }catch(e2){}
    showStep(3);
    setTimeout(function(){ try{ showStep(3); }catch(e){} }, 300);
  }
}

let _approvalWatchActive=false;
let _approvalPollTimer=null;
function _watchApprovalStatus(mobile){
  if(_approvalWatchActive) return;
  _approvalWatchActive=true;

  const handleUpdate=userData=>{
    if(!userData) return false;
    if(userData.status==='approved'){
      if(userData.validTill && new Date(userData.validTill)<new Date()) return false;
      _stopApprovalWatch();
      // Already inside app as pending member → unlock full access without full re-login flash
      if(SESSION && SESSION.role==='member' && SESSION.pendingApproval){
        SESSION.status='approved';
        SESSION.pendingApproval=false;
        SESSION.name=userData.name||SESSION.name;
        SESSION.managerId=userData.managerId||SESSION.managerId;
        saveSession();
        toast('✅ Manager ने approve कर दिया — full access!');
        try{ buildNav().then(()=>{ goTab('home'); renderAll(); }); }catch(e){
          try{ location.reload(); }catch(e2){}
        }
        return true;
      }
      toast('✅ Approve हो गया! Login हो रहा है...');
      _launchAsNewUser(userData);
      return true;
    }else if(userData.status==='rejected'){
      _stopApprovalWatch();
      toast('❌ आपका रजिस्ट्रेशन reject हो गया। VKS Tech से संपर्क करें।');
      return true;
    }
    return false;
  };

  // Primary: realtime listener (instant, but can be affected by tab throttling)
  fbListen('mobileUsers/'+mobile, handleUpdate);

  // Backup: poll every 8s in case the realtime connection is stale/throttled
  if(_approvalPollTimer) clearInterval(_approvalPollTimer);
  _approvalPollTimer=setInterval(async()=>{
    if(!_approvalWatchActive){ clearInterval(_approvalPollTimer); return; }
    try{
      const userData=await fbGet('mobileUsers/'+mobile);
      handleUpdate(userData);
    }catch(e){}
  },8000);
}
function _stopApprovalWatch(){
  _approvalWatchActive=false;
  if(_approvalPollTimer){ clearInterval(_approvalPollTimer); _approvalPollTimer=null; }
}

function _selectRole(role){
  ['manager','member'].forEach(r=>{
    const el=document.getElementById('roleCard_'+r);
    if(el){
      el.style.borderColor=r===role?'#f97316':'var(--border2)';
      el.style.background=r===role?'rgba(249,115,22,.08)':'var(--card2)';
    }
  });
  setTimeout(()=>{ if(role==='manager') showStep('mgrReg'); else { showStep('memReg'); _loadManagerOptions(); } },200);
}

async function _loadManagerOptions(){
  const sel=document.getElementById('memManagerSelect');
  const hint=document.getElementById('memNoManagerHint');
  if(!sel) return;
  sel.innerHTML='<option value="">-- Loading... --</option>';
  try{
    const data=await fbGet('mobileUsers');
    const managers=data?Object.entries(data).filter(([k,v])=>v && v.role==='manager'&&v.status==='approved'):[];
    if(!managers.length){
      sel.innerHTML='<option value="">-- No Manager available --</option>';
      if(hint) hint.style.display='block';
      return;
    }
    if(hint) hint.style.display='none';
    // Always use last-10-digit phone as value so member.managerId matches SESSION.mobile
    sel.innerHTML='<option value="">-- Select Manager --</option>'+
      managers.map(([k,v])=>{
        const phoneKey = (typeof _normMobileKey==='function') ? _normMobileKey(k||v.mobile||v.phone||'') : String(k||'').replace(/\D/g,'').slice(-10);
        const nm = String(v.name||phoneKey).replace(/"/g,'&quot;').replace(/</g,'');
        const co = String(v.company||'—').replace(/</g,'');
        return `<option value="${phoneKey}" data-name="${nm}">${nm} (${co})</option>`;
      }).join('');
  }catch(e){
    sel.innerHTML='<option value="">-- Error loading --</option>';
  }
}

function _toggleOtherField(selectId,otherId){
  const sel=document.getElementById(selectId);
  const other=document.getElementById(otherId);
  if(!sel||!other) return;
  other.style.display=sel.value==='Others'?'block':'none';
  if(sel.value==='Others') other.focus();
}

async function _submitManagerReg(){
  const name=(document.getElementById('mgrName')?.value||'').trim();
  const comp=(document.getElementById('mgrCompany')?.value||'').trim();
  let desig=(document.getElementById('mgrDesignation')?.value||'').trim();
  if(desig==='Others') desig=(document.getElementById('mgrDesignationOther')?.value||'').trim();
  let dept=(document.getElementById('mgrDepartment')?.value||'').trim();
  if(dept==='Others') dept=(document.getElementById('mgrDepartmentOther')?.value||'').trim();
  const invite=(document.getElementById('mgrInviteCode')?.value||'').trim();
  const errEl=document.getElementById('mgrRegErr');
  if(!name||!comp||!desig||!dept){
    if(errEl){ errEl.textContent='⚠️ सभी फ़ील्ड अनिवार्य हैं'; errEl.classList.add('show'); } return;
  }
  // Invite code gate (spam protection) — still NO admin approval wait
  let expectedCode = String(CFG.managerInviteCode||'').trim();
  try{
    const remote = await fbGet('settings/managerInviteCode');
    if(remote && String(remote).trim()) expectedCode = String(remote).trim();
  }catch(e){}
  if(!expectedCode){
    if(errEl){ errEl.textContent='❌ Invite Code configured नहीं है — Admin से संपर्क करें'; errEl.classList.add('show'); }
    toast('❌ Manager invite code not set by Admin');
    return;
  }
  if(invite.toUpperCase() !== expectedCode.toUpperCase()){
    if(errEl){ errEl.textContent='❌ गलत Invite Code — Admin से Code माँगें'; errEl.classList.add('show'); }
    toast('❌ Invite Code गलत है');
    return;
  }
  if(!_loginMobile){
    if(errEl){ errEl.textContent='❌ Mobile session lost — OTP दोबारा verify करें'; errEl.classList.add('show'); }
    toast('❌ Mobile session lost — go back and verify OTP again');
    try{ showStep(1); }catch(e){}
    return;
  }
  const mobile=_loginMobile.replace('+91','').replace(/[^0-9]/g,'');
  if(mobile.length!==10){
    if(errEl){ errEl.textContent='❌ Invalid mobile — OTP दोबारा करें'; errEl.classList.add('show'); }
    toast('❌ Invalid mobile');
    try{ showStep(1); }catch(e){}
    return;
  }
  const userData={
    role:'manager',
    name,
    mobile:_loginMobile.startsWith('+') ? _loginMobile : ('+91'+mobile),
    company:comp,
    designation:desig,
    department:dept,
    status:'approved',
    registeredAt:new Date().toISOString(),
    autoApproved:true,
    validTill: new Date(Date.now()+365*86400000).toISOString()
  };
  try{
    await fbSet('mobileUsers/'+mobile, userData);

    const notifBody = name+' joined as Manager\nCompany: '+comp+'\nDept: '+dept+'\nMobile: '+(_loginMobile||mobile);
    try{
      await fbPush('adminNotifications', {
        type:'manager_joined',
        title:'🆕 New Manager joined',
        body: notifBody,
        name, company:comp, department:dept, mobile:_loginMobile||mobile,
        message: name+' ने Manager के रूप में join किया। Company: '+comp,
        read:false,
        at: new Date().toISOString()
      });
    }catch(e){ console.warn('[mgrReg] adminNotifications', e); }
    try{ await notifyAdmin('🆕 New Manager joined', name+' · '+comp+' · '+(_loginMobile||mobile)); }catch(e){}

    const adminPhone = _normMobileKey(CFG.contactAdmin || '8929394920');
    const waText =
      '🆕 *New Manager joined — Man Power*\n\n'+
      '*Name:* '+name+'\n'+
      '*Company:* '+comp+'\n'+
      '*Department:* '+dept+'\n'+
      '*Designation:* '+desig+'\n'+
      '*Mobile:* '+(_loginMobile||('+91'+mobile))+'\n\n'+
      '_Auto-approved — no action required._';
    // Store WA text so Admin can resend from notifications if popup blocked
    try{ sessionStorage.setItem('mp_pending_mgr_wa', JSON.stringify({phone:adminPhone, text:waText})); }catch(e){}

    toast('✅ Manager account ready — logging in...');
    // Do NOT auto-open WhatsApp here (was causing black screen / navigation issues).
    // Admin still gets in-app notification. WA text saved for optional later send.
    try{
      _launchAsNewUser(userData);
    }catch(launchErr){
      console.error('[mgrReg] launch failed', launchErr);
      toast('⚠️ Login shell issue — retrying…');
      setTimeout(function(){ try{ _launchAsNewUser(userData); }catch(e2){ try{ location.reload(); }catch(e3){} } }, 400);
    }
  }catch(e){
    console.error('[mgrReg]', e);
    const msg = (e && e.message) ? e.message : String(e);
    if(errEl){ errEl.textContent='❌ Error: '+msg; errEl.classList.add('show'); }
    toast('❌ Registration failed: '+msg);
    // Keep Manager form visible — never black screen on write failure
    try{ showStep('mgrReg'); }catch(e2){}
  }
}


async function _submitMemberReg(){
  const name=(document.getElementById('memName')?.value||'').trim();
  const comp=(document.getElementById('memCompany')?.value||'').trim();
  const mgrSel=document.getElementById('memManagerSelect');
  let managerId=mgrSel?.value||'';
  const managerName=mgrSel?.selectedOptions?.[0]?.dataset?.name||mgrSel?.selectedOptions?.[0]?.textContent||'';
  const errEl=document.getElementById('memRegErr');
  if(!name||!comp){
    if(errEl){ errEl.textContent=(typeof L==='function'?L('⚠️ नाम और Company अनिवार्य हैं','⚠️ Name and Company are required'):'⚠️ Name and Company required'); errEl.classList.add('show'); } return;
  }
  if(!managerId){
    if(errEl){ errEl.textContent=(typeof L==='function'?L('⚠️ कृपया अपना Manager चुनें','⚠️ Please select your Manager'):'⚠️ Please select your Manager'); errEl.classList.add('show'); } return;
  }
  // Normalize both sides to last-10 digits so Manager Pending always finds this member
  const mobile = (typeof _normMobileKey==='function') ? _normMobileKey(_loginMobile) : String(_loginMobile||'').replace(/\D/g,'').slice(-10);
  managerId = (typeof _normMobileKey==='function') ? _normMobileKey(managerId) : String(managerId).replace(/\D/g,'').slice(-10);
  if(!mobile || mobile.length!==10){
    if(errEl){ errEl.textContent='⚠️ Invalid mobile — login again'; errEl.classList.add('show'); } return;
  }
  // Pending member: enter app immediately with LIMITED access until Manager approves
  const userData={
    role:'member', name,
    mobile: '+91'+mobile,
    company:comp,
    status:'pending', empCode:(document.getElementById('memEmpCode')?.value||'').trim(),
    managerId: managerId,
    managerMobile: managerId,
    managerName: String(managerName).replace(/\s*\(.*\)\s*$/,'').trim(),
    registeredAt: new Date().toISOString()
  };
  try{
    await fbSet('mobileUsers/'+mobile, userData);
    try{
      await fbPush('adminNotifications',{type:'member_registration',...userData,
        message: name+' registered as Member. Manager: '+(userData.managerName||managerId)});
    }catch(e){}
    // Notify manager on phone key AND any empObjId path if resolvable
    const notif = {
      type:'member_pending',
      title:'👤 New team member request',
      body: name+' wants to join your team',
      mobile: '+91'+mobile, name, company:comp, memberMobile: mobile,
      managerId: managerId,
      read:false, at: new Date().toISOString()
    };
    try{ await fbPush('userNotifications/'+managerId, notif); }catch(e){}
    try{
      // Also push under manager mobileUsers record empObjId if present
      const mgrRec = await fbGet('mobileUsers/'+managerId);
      if(mgrRec && (mgrRec.empObjId||mgrRec.employeeId)){
        await fbPush('userNotifications/'+(mgrRec.empObjId||mgrRec.employeeId), notif);
      }
    }catch(e){}
    toast((typeof L==='function')?L('✅ Register हो गया — Manager approve तक limited access','✅ Registered — limited access until Manager approves'):'✅ Registered — limited access until Manager approves');
    _launchAsNewUser(userData);
    setTimeout(()=>{ try{ _watchApprovalStatus(mobile); }catch(e){} }, 800);
  }catch(e){ if(errEl){ errEl.textContent='❌ Error: '+e.message; errEl.classList.add('show'); } }
}

/** Launch session as full Admin from OTP (hard-admin phone list) */
function _launchAsHardAdmin(mobile10){
  const key = _normMobileKey(mobile10||_loginMobile||'');
  SESSION = {
    uid: '+91'+key,
    name: 'ADMIN',
    role: 'admin',
    company: '',
    companyId: 'ALL',
    viewCompanyId: 'ALL',
    managerId: '',
    mobile: '+91'+key,
    empId: '',
    empObjId: '',
    newUser: false,
    loginAt: new Date().toISOString()
  };
  try{ writeIntegrityToken(); localStorage.setItem('mp_int_ok','1'); }catch(e){}
  saveSession();
  try{
    _recordLoginEvent({
      name: 'ADMIN',
      mobile: SESSION.mobile,
      company: '—',
      role: 'admin',
      method: 'admin_otp'
    });
  }catch(e){}
  try{ _syncAuthRoleNodes(); }catch(e){}
  toast('✅ Admin login');
  launchApp();
  setTimeout(()=>{ try{ _syncAuthRoleNodes(); }catch(e){} }, 1500);
}

function _guessDeviceLabel(){
  try{
    const ua = (navigator.userAgent||'');
    if(/iPhone/i.test(ua)) return 'iPhone';
    if(/iPad/i.test(ua)) return 'iPad';
    if(/Android/i.test(ua)){
      const m = ua.match(/Android[^;]*;\s*([^)]+)\)/);
      if(m && m[1]){
        let s = m[1].replace(/\s*Build.*$/i,'').trim();
        if(s && s.length<40) return s;
      }
      return 'Android';
    }
    if(/Windows/i.test(ua)) return 'Windows PC';
    if(/Mac OS/i.test(ua)) return 'Mac';
    if(/Linux/i.test(ua)) return 'Linux';
    return (ua||'Device').substring(0,40);
  }catch(e){ return 'Device'; }
}

/** Prefer live employees/{id} by phone — wipe stale mobileUsers name/emp link */
async function _resolveEmpByMobile(mobile){
  const mob = _normMobileKey(mobile||'');
  if(!mob || mob.length<10) return null;
  let all = (_cache.employees||[]);
  if(!all.length){
    try{
      const snap = await fbGet('employees');
      if(snap && typeof snap==='object'){
        all = Object.entries(snap).map(([k,v])=>({...(v||{}), id:(v&&v.id)||k}));
        _cache.employees = all;
      }
    }catch(e){}
  }
  const active = all.filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
  let match = active.find(e => _normMobileKey(e.phone||e.mobile||'') === mob);
  if(!match) match = all.find(e => _normMobileKey(e.phone||e.mobile||'') === mob);
  return match || null;
}

/** Sync mobileUsers/{mob} to CURRENT employee (or clear old member identity) */
async function _syncMobileUserToCurrentEmployee(mobile, userData, opts){
  opts = opts || {};
  const mob = _normMobileKey(mobile||'');
  if(!mob || mob.length<10) return null;
  try{
    const match = await _resolveEmpByMobile(mob);
    const base = Object.assign({}, userData||{});
    const deviceId = opts.deviceId || (typeof getDeviceId==='function' ? getDeviceId() : '');
    const deviceName = opts.deviceName || _guessDeviceLabel();
    if(match && match.status!=='resigned' && match.status!=='left' && match.status!=='left_team' && match.status!=='removed'){
      const patch = {
        name: match.name || base.name || '',
        empId: match.empId || base.empId || '',
        empCode: match.empId || base.empCode || '',
        empObjId: match.id,
        employeeId: match.id,
        phone: mob,
        mobile: mob,
        company: match.company || base.company || SESSION.company || '',
        section: match.section || match.sec || base.section || '',
        lastLoginAt: new Date().toISOString(),
        lastDeviceId: deviceId || base.lastDeviceId || '',
        lastDeviceName: deviceName || base.lastDeviceName || ''
      };
      // Keep role/status/managerId from existing mobileUsers unless forced
      if(base.role) patch.role = base.role;
      if(base.status) patch.status = base.status;
      if(base.managerId) patch.managerId = base.managerId;
      try{ await fbUpdate('mobileUsers/'+mob, patch); }catch(e){ console.warn('[syncMU]', e); }
      // Fix deviceApprovals under CURRENT emp id
      if(match.id && deviceId){
        try{
          await fbUpdate('deviceApprovals/'+match.id, {
            approvedDeviceId: deviceId,
            approvedAt: new Date().toISOString(),
            validTill: new Date(Date.now()+365*86400000).toISOString(),
            empName: match.name||'',
            empId: match.empId||'',
            mobile: mob,
            deviceName: deviceName,
            via: opts.via || 'login_sync'
          });
        }catch(e){}
      }
      // If mobileUsers still pointed at an OLD empObjId, clear that device approval name
      const oldId = base.empObjId || base.employeeId || '';
      if(oldId && oldId !== match.id){
        try{
          await fbUpdate('deviceApprovals/'+oldId, {
            empName: '(reassigned)',
            note: 'Mobile '+mob+' moved to '+ (match.name||match.id),
            reassignedAt: new Date().toISOString()
          });
        }catch(e){}
      }
      return match;
    }
    // No active employee with this phone — if mobileUsers had an old member name, strip identity
    if(base && (base.name || base.empObjId)){
      try{
        await fbUpdate('mobileUsers/'+mob, {
          name: base.role==='manager' ? (base.name||'') : '',
          empId: null,
          empCode: null,
          empObjId: null,
          employeeId: null,
          staleClearedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          lastDeviceId: deviceId||'',
          lastDeviceName: deviceName||''
        });
      }catch(e){}
    }
    return null;
  }catch(e){
    console.warn('[_syncMobileUserToCurrentEmployee]', e);
    return null;
  }
}

function _launchAsNewUser(userData){
  // Safety: never demote hard-admin phone to member/manager
  const mob = _normMobileKey(userData.mobile||userData.uid||'');
  if(_isHardAdminPhone(mob)){
    _launchAsHardAdmin(mob);
    return;
  }
  SESSION.uid=userData.mobile;
  SESSION.name=userData.name;
  SESSION.role=userData.role;
  if(userData.photoUrl) SESSION.photoUrl = userData.photoUrl;
  SESSION.company=userData.company||'';
  SESSION.companyId=_normCompanyId(userData.company);
  SESSION.managerId=userData.managerId||'';
  SESSION.mobile=userData.mobile;
  SESSION.empId=userData.empId||userData.empCode||'';
  SESSION.empObjId=userData.empObjId||userData.employeeId||'';
  SESSION.status=userData.status||'approved';
  SESSION.pendingApproval=(userData.role==='member' && userData.status==='pending');
  // Sync managerId from employees roster if mobileUsers missing/wrong (fixes 0-member count)
  try{
    if(userData.role==='member' || userData.role==='worker'){
      const mobKey = _normMobileKey(userData.mobile||SESSION.mobile||'');
      const all = (_cache.employees||[]);
      const match = all.find(e => e && _normMobileKey(e.phone||e.mobile||'')===mobKey);
      if(match && match.managerId){
        const mid = _normMobileKey(match.managerId);
        if(mid && _normMobileKey(SESSION.managerId||'')!==mid){
          SESSION.managerId = mid;
          try{ fbUpdate('mobileUsers/'+mobKey, { managerId: mid }); }catch(e){}
        }
      }
    }
  }catch(e){}
  SESSION.newUser=true;
  SESSION.loginAt=new Date().toISOString();
  // ALWAYS prefer current employees/{id} by mobile — never keep old member name
  try{
    const mobKey = _normMobileKey(userData.mobile||'');
    const all = (_cache.employees||[]);
    const active = all.filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
    let match = active.find(e => _normMobileKey(e.phone||e.mobile||'') === mobKey);
    if(!match) match = all.find(e => _normMobileKey(e.phone||e.mobile||'') === mobKey);
    if(!match && SESSION.empId){
      match = active.find(e => String(e.empId||'').trim().toUpperCase() === String(SESSION.empId).trim().toUpperCase())
        || all.find(e => String(e.empId||'').trim().toUpperCase() === String(SESSION.empId).trim().toUpperCase());
    }
    if(match && match.status!=='resigned' && match.status!=='left' && match.status!=='left_team' && match.status!=='removed'){
      SESSION.empObjId = match.id;
      SESSION.empId = match.empId || SESSION.empId;
      SESSION.name = match.name || SESSION.name; // current employee name wins
      if(match.company) SESSION.company = match.company;
      if(match.section||match.sec) SESSION.dept = match.section||match.sec;
      // Avatar: prefer employee photo, else mobileUsers photo
      if(match.photoUrl) SESSION.photoUrl = match.photoUrl;
      else if(userData && userData.photoUrl) SESSION.photoUrl = userData.photoUrl;
    } else if(userData && userData.photoUrl){
      SESSION.photoUrl = userData.photoUrl;
    } else if(match && (match.status==='resigned'||match.status==='left'||match.status==='left_team'||match.status==='removed')){
      // Old member still on phone — do not keep their name
      SESSION.name = userData.role==='manager' ? (userData.name||'') : (SESSION.name||'Member');
      SESSION.empObjId = '';
      SESSION.empId = '';
    }
    // Async sync mobileUsers to current identity (fire-and-forget)
    try{
      _syncMobileUserToCurrentEmployee(mobKey, userData, { deviceId: typeof getDeviceId==='function'?getDeviceId():'', via:'launch' });
    }catch(e){}
  }catch(e){}
  saveSession();
  try{ writeIntegrityToken(); localStorage.setItem('mp_int_ok','1'); }catch(e){}
  try{
    _recordLoginEvent({
      name: SESSION.name,
      mobile: SESSION.mobile,
      company: SESSION.company,
      role: SESSION.role,
      method: (userData && userData.linkedVia) || 'otp'
    });
  }catch(e){}
  // Cache phone verify on this device so Save / edit member mobile skips OTP for ~90 days
  try{
    const m = _normMobileKey(userData.mobile||SESSION.mobile||'');
    if(m){
      localStorage.setItem('mp_device_phone', '+91'+m);
      localStorage.setItem('mp_device_verified_at', String(Date.now()));
      localStorage.setItem('mp_write_auth_at', String(Date.now()));
      sessionStorage.setItem('mp_write_auth','1');
    }
    const u = window._fbAuth && window._fbAuth.currentUser;
    if(u && u.phoneNumber){
      localStorage.setItem('mp_device_phone', u.phoneNumber);
      localStorage.setItem('mp_device_uid', u.uid||'');
    }
  }catch(e){}
  try{
    // Show shell immediately so OTP never ends on a black page
    const _mh = document.getElementById('mainHdr');
    const _mc = document.getElementById('mainContent');
    if(_mh) _mh.style.display='block';
    if(_mc) _mc.style.display='block';
    const ls = document.getElementById('loginScreen');
    if(ls){ ls.style.display='none'; ls.classList.remove('show'); }
    const pb = document.getElementById('pendingBox');
    if(pb) pb.style.display='none';
  }catch(e){}
  Promise.resolve(launchApp()).catch(err=>{
    console.error('[launch] failed', err);
    try{
      document.getElementById('mainHdr').style.display='block';
      document.getElementById('mainContent').style.display='block';
      toast('⚠️ App load issue — pull to refresh if screen is empty');
    }catch(e){}
  });
  setTimeout(()=>{ try{ _syncAuthRoleNodes(); }catch(e){} }, 500);
  setTimeout(()=>{ try{ _resolveSessionEmpLink(); _syncAuthRoleNodes(); }catch(e){} }, 1500);
  setTimeout(()=>{ try{ _resolveSessionEmpLink(); listenUserShiftNotifications(); _syncAuthRoleNodes(); }catch(e){} }, 4000);

  // v2.4.3: After OTP/approval — prefer Fingerprint setup, then device password
  try{
    const m = _normMobileKey(userData.mobile||SESSION.mobile||'');
    const empObjId = SESSION.empObjId || userData.empObjId || userData.employeeId || '';
    const uid = empObjId || ('m_'+m);
    const uname = SESSION.name || userData.name || 'User';
    if(!window._pwPromptShownThisSession){
      window._pwPromptShownThisSession = true;
      setTimeout(async ()=>{
        try{
          // 1) Fingerprint if hardware available and not yet registered
          const fpUserKey = FP_KEY + '_' + uid;
          const alreadyFp = localStorage.getItem(fpUserKey)==='1';
          let didFp = false;
          if(!alreadyFp && typeof registerFingerprint==='function'){
            await registerFingerprint(uname, uid);
            didFp = localStorage.getItem(fpUserKey)==='1';
          }
          // 2) Device password (backup when FP not available / declined)
          const hasPw = typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, m);
          if(!hasPw){
            const fakeEmp = { id: uid, empId: SESSION.empId||'', name: uname, phone:m, mobile:m };
            const did = (typeof getDeviceId==='function')?getDeviceId():'';
            showSetPasswordScreen(fakeEmp, did, true, userData, m);
          }
        }catch(e){ console.warn('[post-login security setup]', e); }
      }, 800);
    }
  }catch(e){}
}

/** Match logged-in mobile user to employees record for notifications */
function _resolveSessionEmpLink(){
  if(SESSION.role!=='member' && SESSION.role!=='manager' && SESSION.role!=='worker') return;
  const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  if(!mob) return;
  const all = (_cache.employees||[]);
  let match = all.find(e => _normMobileKey(e.phone||e.mobile||'') === mob);
  if(!match && SESSION.empId){
    match = all.find(e => String(e.empId||'').trim().toUpperCase() === String(SESSION.empId).trim().toUpperCase());
  }
  if(match && SESSION.empObjId !== match.id){
    SESSION.empObjId = match.id;
    SESSION.empId = match.empId || SESSION.empId;
    saveSession();
    try{ listenUserShiftNotifications(); }catch(e){}
  }
}



function onCodeInput(val){
  const btn=document.getElementById('step2Btn');
  const hint=document.getElementById('codeMatchHint');
  if(val.length>=3){
    if(btn){ btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
    const match=getEmps().find(e=>e.empId&&e.empId.trim().toUpperCase()===val.toUpperCase());
    if(hint){
      if(match)
        hint.innerHTML='<span style="color:var(--green)">✅ '+match.name+' — '+(secName(match.sec)||'Man Power')+'</span>';
      else
        hint.innerHTML='<span style="color:#f97316">🔆 नया Employee — Registration होगा</span>';
    }
  } else {
    if(btn){ btn.style.opacity='.5'; btn.style.pointerEvents='none'; }
    if(hint) hint.innerHTML='';
  }
}

function goToStep3(){ proceedFromCode(); }
function selectDept(dept,el){ _step3Dept=dept; }
function updateStep3Btn(){}
function checkPassStrength(){}
function togglePass(id,btn){
  const inp=document.getElementById(id); if(!inp) return;
  inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'\ud83d\udc41':'\ud83d\ude48';
}

function showLoginErrStep(step,msg){
  const ids={1:'loginErr',2:'loginErr2',3:'loginErr2','admin':'loginErrAdmin'};
  const el=document.getElementById(ids[step]||'loginErr2');
  if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),4000); }
}
function showLoginErr2(msg){ showLoginErrStep(2,msg); }
function showLoginErrAdmin(msg){ showLoginErrStep('admin',msg); }

async function hashPass(str){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function tryAdminLogin(){
  const u=(document.getElementById('aUser')?.value||'').trim().toLowerCase();
  const p=(document.getElementById('aPass')?.value||'').trim();
  if(!u||!p){ showLoginErrAdmin('Username aur Password daalein'); return; }

  const rl = checkRateLimit('admin');
  if(!rl.ok){ showLoginErrAdmin('🔒 ' + rl.msg); return; }

  const btn=document.getElementById('aLoginBtn')||(document.querySelector('#adminLoginPanel .big-btn'));
  if(btn){ btn.innerHTML='⏳ Login ho raha hai...'; btn.style.opacity='0.7'; btn.style.pointerEvents='none'; }
  const restoreBtn=()=>{ if(btn){ btn.innerHTML='🔐 Login करें'; btn.style.opacity='1'; btn.style.pointerEvents='auto'; } };

  try{
    const passHash = await hashPass(u+':'+p+':MP_ADMIN');
    let adminInfo = null;

    // ── STEP 1: Direct Firebase check (fast, reliable, was always working) ──
    try{
      const fbAuthData = await fbGet('adminAuth');
            if(fbAuthData && fbAuthData[u]){
        if(fbAuthData[u].h === passHash){
          adminInfo = {name:fbAuthData[u].name||u.toUpperCase(), role:'Admin'};
        }
      }
    }catch(e){ console.warn('[adminLogin] Firebase read failed:', e.message); }

    // SECURITY: No client-side emergency password fallback (hashes must not ship in the bundle).
    // If Firebase is unreachable, admin login fails closed — use Console / network recovery.

    if(!adminInfo){
      recordFailedAttempt('admin');
      showLoginErrAdmin('❌ Username ya Password galat hai');
      restoreBtn(); return;
    }

    // ── STEP 2: Get Firebase Auth token (Cloud Function or anonymous) ──
    // This runs AFTER password is verified — so login is not blocked by slow CF
    try{
      const result = await Promise.race([
        window._fbCall('adminLogin', { username: u, passHash }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
      ]);
      if(result.data && result.data.token){
        await window._fbSignInWithToken(result.data.token);
      }
    }catch(cfErr){
      console.warn('[adminLogin] CF auth failed, using anonymous:', cfErr.message);
      try{ await window._fbSignInAnon(); }catch(e){}
    }

    resetAttempts('admin');
    SESSION = {
      role:'admin', name:adminInfo.name||u.toUpperCase(),
      empId:u, empObjId:'admin_'+u,
      adminRole:adminInfo.role||'Admin',
      loginAt:new Date().toISOString()
    };
    saveSession();
    restoreBtn();
    writeIntegrityToken();
    localStorage.setItem('mp_int_ok','1');
    // Google Analytics — admin login
    try{
      if(typeof window._fbLogEvent === 'function'){
        window._fbLogEvent('admin_login', {
          method: 'password',
          admin_user: u,
          admin_name: adminInfo.name || u,
          app_name: 'Man Power'
        });
        window._fbLogEvent('login', { method: 'admin_password' });
      }
    }catch(e){ console.warn('[analytics] admin_login', e); }
    try{
      _recordLoginEvent({
        name: adminInfo.name || u.toUpperCase(),
        mobile: '—',
        company: '—',
        role: 'admin',
        method: 'admin_password'
      });
    }catch(e){}
    launchApp();
    listenAdminNotifications();
    setTimeout(()=>registerFingerprint(adminInfo.name||u.toUpperCase(), 'admin_'+u), 1500);
  }catch(err){
    console.error('Admin login error:',err);
    showLoginErrAdmin('❌ Error: '+err.message);
    restoreBtn();
  }
}

async function proceedFromCode(){
  // Emp-code login removed — Mobile Number is the only entry point
  toast('📱 Member login: पहले Mobile Number डालें');
  try{ showStep(1); document.getElementById('loginMobile')?.focus(); }catch(e){}
}

async function tryWorkerLogin(){ await proceedFromCode(); }

// Emp-code + selfie login-approval path removed (mobile OTP is the entry point)
function recoverStuckPendingStates(){
  try{ sessionStorage.removeItem('mp_pending_login'); }catch(e){}
}






// Legacy loginRequests approve/reject (in case old pending rows still exist)

async function approveManagerLoginRequest(reqKey){
  try{
    if(typeof _ensureWriteAuth==='function'){ const ok=await _ensureWriteAuth(); if(!ok){ toast('❌ Auth required'); return; } }
    await fbUpdate('loginRequests/'+reqKey, {
      status:'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: SESSION.name||'manager',
      approvedById: SESSION.empObjId||SESSION.uid||''
    });
    toast('✅ Member can login now (no OTP)');
    try{ renderPending(); }catch(e){}
  }catch(e){ toast('❌ '+e.message); }
}
async function rejectManagerLoginRequest(reqKey){
  try{
    if(typeof _ensureWriteAuth==='function'){ const ok=await _ensureWriteAuth(); if(!ok){ toast('❌ Auth required'); return; } }
    await fbUpdate('loginRequests/'+reqKey, {
      status:'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: SESSION.name||'manager'
    });
    toast('Rejected');
    try{ renderPending(); }catch(e){}
  }catch(e){ toast('❌ '+e.message); }
}
try{ window.approveManagerLoginRequest=approveManagerLoginRequest; window.rejectManagerLoginRequest=rejectManagerLoginRequest; }catch(e){}

try{
  
  
  
  
}catch(e){}

// ════════════════════════════════════════
// OTHER-DEVICE LOGIN — notify other device OR OTP after 30s
// ════════════════════════════════════════
let _odlCtx = null; // { emp, dRec, deviceId, reqKey, timer, poller }

async function showOtherDeviceLoginRequest(emp, dRec, deviceId){
  // Ensure phone is available for OTP fallback
  try{
    if(!(emp.phone||emp.mobile) && emp.id){
      const fe = await fbGet('employees/'+emp.id);
      if(fe){ emp.phone = fe.phone||fe.mobile||emp.phone; emp.mobile = fe.mobile||fe.phone||emp.mobile; }
    }
  }catch(e){}
  _odlCtx = { emp, dRec, deviceId, reqKey:null, timer:null, poller:null };

  let ov = document.getElementById('otherDeviceLoginOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='otherDeviceLoginOverlay'; document.body.appendChild(ov); }
  const phoneHint = (emp.phone||emp.mobile||'').toString().replace(/\D/g,'').slice(-10);
  ov.style.cssText='position:fixed;inset:0;z-index:9600;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto';
  ov.innerHTML=`
    <div style="width:100%;max-width:400px;text-align:center">
      <div style="font-size:44px;margin-bottom:8px">📱↔️📱</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:6px">Login on this device</div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.55;margin-bottom:14px">
        Already logged in on <b style="color:#f97316">another device</b>.<br>
        Choose how to continue:
      </div>
      <div style="background:#1e293b;border-radius:14px;padding:12px;margin-bottom:14px;text-align:left">
        <div style="font-size:11px;color:#64748b;font-weight:800">EMPLOYEE</div>
        <div style="font-size:16px;font-weight:900;color:#f97316">${String(emp.name||'').replace(/</g,'')}</div>
        <div style="font-size:12px;color:#94a3b8">${String(emp.empId||'').replace(/</g,'')}${phoneHint?' · +91-'+phoneHint:''}</div>
      </div>

      <div id="odlStatus" style="font-size:13px;color:#94a3b8;margin-bottom:12px;line-height:1.55;min-height:40px">
        <b style="color:#fff">Notify</b> your other device <b>or</b> <b style="color:#38bdf8">Send OTP</b> on this phone.<br>
        After Notify, OTP stays available again in <b style="color:#fff">15 seconds</b>.
      </div>

      <button id="odlSendBtn" onclick="sendOtherDeviceLoginRequest()"
        style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;margin-bottom:10px">
        📤 Send notification to other device
      </button>

      <div id="odlCountdown" style="display:none;font-size:12px;color:#fbbf24;font-weight:700;margin-bottom:10px"></div>

      <button id="odlOtpBtn" onclick="fallbackOtherDeviceOTP()"
        style="width:100%;padding:14px;border:1.5px solid rgba(56,189,248,.5);border-radius:12px;background:rgba(56,189,248,.1);color:#38bdf8;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;margin-bottom:10px">
        🔐 Send OTP
      </button>

      <button onclick="closeOtherDeviceLogin()"
        style="width:100%;padding:12px;background:none;border:1px solid #334155;border-radius:12px;color:#64748b;font-size:14px;cursor:pointer;font-family:inherit">← Back</button>
    </div>`;
  ov.style.display='flex';
}

function closeOtherDeviceLogin(){
  try{
    if(_odlCtx){
      if(_odlCtx.timer) clearInterval(_odlCtx.timer);
      if(_odlCtx.poller) clearInterval(_odlCtx.poller);
      if(window._odlPoller) clearInterval(window._odlPoller);
    }
  }catch(e){}
  _odlCtx = null;
  const ov=document.getElementById('otherDeviceLoginOverlay');
  if(ov) ov.style.display='none';
}

async function sendOtherDeviceLoginRequest(){
  if(!_odlCtx){ toast('Session expired — try login again'); return; }
  const { emp, deviceId } = _odlCtx;
  const empObjId = emp.id;
  const empId = emp.empId||'';
  const empName = emp.name||'';
  const statusEl = document.getElementById('odlStatus');
  const btn = document.getElementById('odlSendBtn');
  const otpBtn = document.getElementById('odlOtpBtn');
  const cdEl = document.getElementById('odlCountdown');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Sending…'; }
  try{
    try{ await window._fbSignInAnon(); }catch(e){}
    const reqKey = await fbPush('loginRequests', {
      type: 'device_transfer',
      empObjId, empId, empName,
      deviceId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      fromDevice: deviceId,
      note: 'Login from another device — approve without OTP'
    });
    _odlCtx.reqKey = reqKey;

    const notif = {
      type: 'device_login_request',
      title: '📱 New device login request',
      body: (empName||'')+' wants to login on another device. Open Pending → Approve.',
      empObjId, empId, reqKey, deviceId,
      read: false, at: new Date().toISOString()
    };
    // Fan-out to every identity the already-logged-in session may be listening on
    const notifTargets = new Set();
    if(empObjId) notifTargets.add(empObjId);
    if(empId) notifTargets.add(empId);
    try{
      const mob = _normMobileKey(emp.phone||emp.mobile||'');
      if(mob) notifTargets.add(mob);
      // mobileUsers key often equals 10-digit mobile
      if(emp.mobile) notifTargets.add(_normMobileKey(emp.mobile));
      if(emp.phone) notifTargets.add(_normMobileKey(emp.phone));
      if(emp.uid) notifTargets.add(String(emp.uid));
      // Also look up live employee record for alternate ids
      try{
        const live = (typeof getEmps==='function' ? getEmps() : []).find(e=>e && (e.id===empObjId || e.empId===empId));
        if(live){
          if(live.id) notifTargets.add(live.id);
          if(live.empId) notifTargets.add(live.empId);
          if(live.phone) notifTargets.add(_normMobileKey(live.phone));
          if(live.mobile) notifTargets.add(_normMobileKey(live.mobile));
        }
      }catch(e2){}
    }catch(e){}
    for(const t of notifTargets){
      if(!t) continue;
      try{ await fbPush('userNotifications/'+t, notif); }catch(e){}
    }

    if(statusEl) statusEl.innerHTML =
      '✅ Notification sent to your <b style="color:#fff">other device</b>.<br>'+
      'Open app there → <b style="color:#4ade80">Pending</b> → <b style="color:#4ade80">Approve</b>.<br>'+
      '<span style="color:#fbbf24">Waiting… OTP option appears in 15 seconds if not approved.</span>';
    if(btn){ btn.style.display='none'; }

    // After Notify: disable OTP briefly, re-enable after 15 seconds
    let left = 15;
    if(otpBtn){
      otpBtn.disabled = true;
      otpBtn.style.opacity = '0.45';
      otpBtn.style.pointerEvents = 'none';
    }
    if(cdEl){ cdEl.style.display='block'; cdEl.textContent = '⏱ Send OTP available again in '+left+'s…'; }
    if(_odlCtx.timer) clearInterval(_odlCtx.timer);
    _odlCtx.timer = setInterval(()=>{
      left--;
      if(cdEl) cdEl.textContent = left>0 ? ('⏱ Send OTP available again in '+left+'s…') : '';
      if(left <= 0){
        clearInterval(_odlCtx.timer);
        _odlCtx.timer = null;
        if(cdEl){ cdEl.style.display='none'; }
        if(otpBtn){
          otpBtn.style.display='block';
          otpBtn.disabled = false;
          otpBtn.style.opacity = '1';
          otpBtn.style.pointerEvents = 'auto';
        }
        if(statusEl) statusEl.innerHTML =
          '⏳ No approval yet.<br>You can <b style="color:#38bdf8">Send OTP</b> on this device,<br>or keep waiting for other-device approval.';
      }
    }, 1000);

    // Poll approval
    if(_odlCtx.poller) clearInterval(_odlCtx.poller);
    if(window._odlPoller) clearInterval(window._odlPoller);
    _odlCtx.poller = setInterval(async ()=>{
      try{
        const rec = await fbGet('loginRequests/'+reqKey);
        if(rec && rec.status==='approved'){
          clearInterval(_odlCtx.poller);
          if(_odlCtx.timer) clearInterval(_odlCtx.timer);
          const fullEmp = (getEmps()||[]).find(e=>e.id===empObjId) || emp;
          await doLoginAfterApproval(fullEmp, null, deviceId);
          closeOtherDeviceLogin();
        } else if(rec && (rec.status==='rejected'||rec.status==='cancelled')){
          clearInterval(_odlCtx.poller);
          if(_odlCtx.timer) clearInterval(_odlCtx.timer);
          if(statusEl) statusEl.innerHTML='❌ Request rejected on other device.';
          if(otpBtn){ otpBtn.style.display='block'; }
          if(btn){ btn.style.display='block'; btn.disabled=false; btn.textContent='📤 Send notification again'; }
          if(cdEl) cdEl.style.display='none';
        }
      }catch(e){}
    }, 2500);
    window._odlPoller = _odlCtx.poller;
  }catch(e){
    if(statusEl) statusEl.textContent = '❌ '+e.message;
    if(btn){ btn.disabled=false; btn.textContent='📤 Send notification to other device'; }
  }
}

async function fallbackOtherDeviceOTP(){
  if(!_odlCtx || !_odlCtx.emp){ toast('Session expired'); return; }
  const { emp, deviceId, reqKey } = _odlCtx;
  let phone = String(emp.phone||emp.mobile||'').replace(/\D/g,'');
  if(phone.length > 10) phone = phone.slice(-10);
  if(phone.length !== 10){
    toast('⚠️ Mobile number not found on profile — contact Manager');
    return;
  }
  emp.phone = phone;
  // Cancel pending transfer request so it does not stay open
  try{
    if(reqKey) await fbUpdate('loginRequests/'+reqKey, { status:'cancelled', cancelledAt:new Date().toISOString(), reason:'otp_fallback' });
  }catch(e){}
  closeOtherDeviceLogin();
  toast('🔐 Sending OTP to +91-'+phone);
  try{
    await showOTPLoginScreen(emp, deviceId);
    // auto-trigger send
    setTimeout(()=>{ try{ _sendDeviceOTP(false); }catch(e){} }, 400);
  }catch(e){
    toast('❌ OTP screen: '+e.message);
  }
}

/** Logged-in member/manager: show approve buttons for device transfer + login approval requests */
async function renderDeviceTransferRequests(){
  const host = document.getElementById('deviceTransferRequests');
  if(!host) return;
  if(!SESSION || !(SESSION.empObjId || SESSION.mobile || SESSION.uid)){ host.innerHTML=''; return; }
  try{
    const data = await fbGet('loginRequests') || {};
    const mid = SESSION.empObjId || SESSION.uid || '';
    const myEmpId = SESSION.empId || '';
    const myMob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    const mine = Object.entries(data).filter(([k,v])=>{
      if(!v || v.status!=='pending') return false;
      if(v.type==='device_transfer'){
        return v.empObjId===mid || v.empId===myEmpId || v.empObjId===SESSION.empObjId ||
          (myMob && (_normMobileKey(v.phone||'')===myMob || _normMobileKey(v.mobile||'')===myMob));
      }
      // Manager sees ONLY their team's login approvals (managerId match — not same company)
      if(v.type==='manager_login_approval' && (typeof isMgr==='function' && isMgr() || SESSION.role==='manager' || typeof isAdmin==='function' && isAdmin())){
        return _isMyTeamLoginRequest(v);
      }
      return false;
    });
    if(!mine.length){ host.innerHTML=''; host.style.display='none'; return; }
    host.style.display='block';
    host.innerHTML = `<div style="font-size:13px;font-weight:900;color:#f97316;margin:10px 0 8px">📱 Login / Device requests</div>` +
      mine.map(([k,v])=>{
        const isMgrAppr = v.type==='manager_login_approval';
        const name = (v.empName||v.phone||'Member').replace(/</g,'');
        const sub = isMgrAppr
          ? ('Member login approval'+(v.phone?' · 📱 '+String(v.phone).replace(/</g,''):''))
          : ('New device wants to login');
        const approveFn = isMgrAppr
          ? `approveManagerLoginRequest('${k}')`
          : `approveDeviceTransfer('${k}','${v.deviceId||''}')`;
        const rejectFn = isMgrAppr
          ? `rejectManagerLoginRequest('${k}')`
          : `rejectDeviceTransfer('${k}')`;
        return `
        <div class="card" style="margin-bottom:8px;border-left:3px solid #f97316;border-color:rgba(249,115,22,.35)">
          <div class="card-name">${name}</div>
          <div class="card-sub">${sub}</div>
          <div class="card-meta">${v.requestedAt?new Date(v.requestedAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN')):''}</div>
          <div class="action-row" style="margin-top:8px;display:flex;gap:8px">
            <button class="act-btn approve" onclick="${approveFn}">✅ Approve</button>
            <button class="act-btn reject" onclick="${rejectFn}">❌ Reject</button>
          </div>
        </div>`;
      }).join('');
  }catch(e){ host.innerHTML=''; }
}

async function approveDeviceTransfer(reqKey, newDeviceId){
  try{
    await fbUpdate('loginRequests/'+reqKey, { status:'approved', approvedAt:new Date().toISOString(), approvedBy:SESSION.name||'self' });
    await fbUpdate('deviceApprovals/'+SESSION.empObjId, {
      approvedDeviceId: newDeviceId,
      approvedAt: new Date().toISOString(),
      validTill: new Date(Date.now()+365*86400000).toISOString(),
      empName: SESSION.name, empId: SESSION.empId,
      transferredFrom: getDeviceId()
    });
    toast('✅ Other device approved — they can login now');
    renderDeviceTransferRequests();
  }catch(e){ toast('❌ '+e.message); }
}
async function rejectDeviceTransfer(reqKey){
  try{
    await fbUpdate('loginRequests/'+reqKey, { status:'rejected', rejectedAt:new Date().toISOString() });
    toast('Rejected');
    renderDeviceTransferRequests();
  }catch(e){ toast('❌ '+e.message); }
}
try{
  window.showOtherDeviceLoginRequest=showOtherDeviceLoginRequest;
  window.sendOtherDeviceLoginRequest=sendOtherDeviceLoginRequest;
  window.fallbackOtherDeviceOTP=fallbackOtherDeviceOTP;
  window.closeOtherDeviceLogin=closeOtherDeviceLogin;
  window.approveDeviceTransfer=approveDeviceTransfer;
  window.rejectDeviceTransfer=rejectDeviceTransfer;
}catch(e){}


// ── Set Password Screen (first time after approval) ──

// ════════════════════════════════════════
// DEVICE PASSWORD (avoid OTP on every login) — v2.4.2
// Keys: mp_pw_{empObjId} and/or mp_pw_m_{10digit mobile}
// ════════════════════════════════════════
function _pwMobileKey(mobile){
  const m = String(mobile||'').replace(/\D/g,'').slice(-10);
  return m.length===10 ? ('mp_pw_m_'+m) : '';
}
function _getDevicePasswordHash(empId, mobile){
  try{
    if(empId){
      const h = localStorage.getItem('mp_pw_'+empId);
      if(h) return h;
    }
    const mk = _pwMobileKey(mobile);
    if(mk){ const h2 = localStorage.getItem(mk); if(h2) return h2; }
  }catch(e){}
  return null;
}
function _setDevicePasswordHash(empId, mobile, hash){
  try{
    if(empId) localStorage.setItem('mp_pw_'+empId, hash);
    const mk = _pwMobileKey(mobile);
    if(mk) localStorage.setItem(mk, hash);
  }catch(e){}
}
function _clearDevicePassword(empId, mobile){
  try{
    if(empId) localStorage.removeItem('mp_pw_'+empId);
    const mk = _pwMobileKey(mobile);
    if(mk) localStorage.removeItem(mk);
  }catch(e){}
}
function _markWriteAuthFromLogin(mobile){
  try{
    const m = String(mobile||'').replace(/\D/g,'').slice(-10);
    if(m.length===10){
      localStorage.setItem('mp_device_phone', '+91'+m);
      localStorage.setItem('mp_device_verified_at', String(Date.now()));
      localStorage.setItem('mp_write_auth_at', String(Date.now()));
      sessionStorage.setItem('mp_write_auth','1');
    }
  }catch(e){}
}

function showSetPasswordScreen(emp, deviceId, afterApproval=false, userData=null, mobile10=null){
  let ov = document.getElementById('setPasswordOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='setPasswordOverlay'; document.body.appendChild(ov); }
  const empId = emp && emp.id ? emp.id : '';
  const empName = (emp && emp.name) ? String(emp.name).replace(/'/g,"\\'") : '';
  const mob = mobile10 || (emp && (emp.phone||emp.mobile)) || '';
  const mobClean = String(mob||'').replace(/\D/g,'').slice(-10);
  // stash for submit
  window._pwSetupCtx = { emp, deviceId, afterApproval, userData, mobile10: mobClean };
  ov.style.cssText='position:fixed;inset:0;z-index:9500;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto';
  ov.innerHTML=`
    <div style="width:100%;max-width:360px;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">🔐</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;
        background:linear-gradient(135deg,#f97316,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px">
        Device Password
      </div>
      <div style="font-size:13px;color:#94a3b8;margin-bottom:18px;line-height:1.55">
        <b style="color:#f97316">${(emp&&emp.name)||'User'}</b> के लिए इस device पर password सेट करें।<br>
        अगली बार <b style="color:#fff">OTP की जरूरत नहीं</b> — सिर्फ password।
      </div>
      <div style="background:#162032;border:1.5px solid #3b5a8a;border-radius:14px;padding:18px;margin-bottom:14px;text-align:left">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">PASSWORD (कम से कम 5 अंक) *</div>
        <input id="spw1" type="password" inputmode="numeric" placeholder="●●●●●" maxlength="20"
          style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                 padding:14px;color:#fff;-webkit-text-fill-color:#fff;caret-color:#f97316;font-size:22px;text-align:center;outline:none;font-family:inherit;letter-spacing:4px"
          oninput="_spwValidate()">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin:12px 0 8px">PASSWORD दोबारा डालें *</div>
        <input id="spw2" type="password" inputmode="numeric" placeholder="●●●●●" maxlength="20"
          style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                 padding:14px;color:#fff;-webkit-text-fill-color:#fff;caret-color:#f97316;font-size:22px;text-align:center;outline:none;font-family:inherit;letter-spacing:4px"
          oninput="_spwValidate()">
        <div id="spwErr" style="color:#f43f5e;font-size:12px;margin-top:8px;min-height:16px;text-align:center"></div>
      </div>
      <button id="spwBtn" onclick="_submitSetPassword()"
        style="width:100%;padding:16px;background:linear-gradient(135deg,#22c55e,#15803d);border:none;
               border-radius:13px;color:#fff;font-size:17px;font-weight:900;cursor:pointer;margin-bottom:12px;
               opacity:.4;pointer-events:none;font-family:inherit">
        ✅ Password Save करें
      </button>
      <button onclick="_skipSetPassword()"
        style="width:100%;padding:13px;background:none;border:1px solid #334155;border-radius:12px;
               color:#64748b;font-size:13px;cursor:pointer;font-family:inherit">
        अभी नहीं → ${afterApproval ? 'App खोलें' : 'OTP से Login'}
      </button>
    </div>`;
  ov.style.display='flex';
}

function _spwValidate(){
  const p1=(document.getElementById('spw1')?.value||'');
  const p2=(document.getElementById('spw2')?.value||'');
  const btn=document.getElementById('spwBtn');
  const err=document.getElementById('spwErr');
  if(p1.length<5){ if(err) err.textContent='Password कम से कम 5 characters होना चाहिए'; if(btn){btn.style.opacity='.4';btn.style.pointerEvents='none';} return; }
  if(p2.length>0 && p1!==p2){ if(err) err.textContent='Passwords match नहीं हो रहे'; if(btn){btn.style.opacity='.4';btn.style.pointerEvents='none';} return; }
  if(p1!==p2){ if(err) err.textContent=''; if(btn){btn.style.opacity='.4';btn.style.pointerEvents='none';} return; }
  if(err) err.textContent='';
  if(btn){ btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
}

async function _submitSetPassword(){
  const ctx = window._pwSetupCtx || {};
  const p1=(document.getElementById('spw1')?.value||'');
  const p2=(document.getElementById('spw2')?.value||'');
  if(p1.length<5 || p1!==p2){ toast('⚠️ Password check करें'); return; }
  const emp = ctx.emp || {};
  const empId = emp.id || '';
  const mobile = ctx.mobile10 || String(emp.phone||emp.mobile||'').replace(/\D/g,'').slice(-10);
  const h = await hashPass(p1+'mp_salt_v24');
  _setDevicePasswordHash(empId, mobile, h);
  const ov=document.getElementById('setPasswordOverlay'); if(ov) ov.remove();
  toast('✅ Password save हो गया — अगली बार OTP नहीं लगेगा');
  if(ctx.afterApproval){
    // Already logged in — open app
    if(typeof launchApp==='function') launchApp();
    try{ if(emp.name && empId) setTimeout(()=>registerFingerprint(emp.name, empId), 1500); }catch(e){}
  } else if(ctx.userData){
    // Returning device, password just set → login with that account
    await _finishMobilePasswordLogin(ctx.userData, mobile, ctx.deviceId);
  } else {
    // Fall through to password screen for emp-code path
    showPasswordLoginScreen(emp, ctx.deviceId);
  }
}

function _skipSetPassword(){
  const ctx = window._pwSetupCtx || {};
  const ov=document.getElementById('setPasswordOverlay'); if(ov) ov.remove();
  if(ctx.afterApproval){
    // Already authenticated this session — app works; next login may need OTP again
    toast('ℹ️ Password बाद में Profile से सेट कर सकते हैं');
    if(typeof launchApp==='function') launchApp();
  } else {
    // Need OTP once to establish session
    toast('📱 Password नहीं — OTP से login करें');
    window._forceOtpAfterPwForgot = true;
    _sendOTP(false);
  }
}

// ── Password Login (emp-code / worker path) ──
function showPasswordLoginScreen(emp, deviceId){
  let ov = document.getElementById('pwLoginOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='pwLoginOverlay'; document.body.appendChild(ov); }
  const empId = emp.id || '';
  const empName = (emp.name||'').replace(/'/g,"\\'");
  ov.style.cssText='position:fixed;inset:0;z-index:9500;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto';
  ov.innerHTML=`
    <div style="width:100%;max-width:360px;text-align:center">
      <div style="font-size:48px;margin-bottom:10px">🔓</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;
        background:linear-gradient(135deg,#f97316,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px">
        Password Login
      </div>
      <div style="font-size:14px;color:#94a3b8;margin-bottom:20px">
        <b style="color:#f97316">${emp.name||''}</b><br>
        <span style="font-size:12px">OTP नहीं — इस device का password डालें</span>
      </div>
      <div style="background:#162032;border:1.5px solid #3b5a8a;border-radius:14px;padding:20px;margin-bottom:14px;text-align:left">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:10px">DEVICE PASSWORD *</div>
        <input id="pwlInput" type="password" inputmode="numeric" placeholder="●●●●●" maxlength="20"
          style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                 padding:16px;color:#fff;-webkit-text-fill-color:#fff;caret-color:#f97316;
                 font-size:24px;text-align:center;outline:none;font-family:inherit;letter-spacing:6px"
          onkeydown="if(event.key==='Enter')_submitPwLogin('${empId}','${empName}','${deviceId}')">
        <div id="pwlErr" style="color:#f43f5e;font-size:12px;margin-top:8px;min-height:16px;text-align:center"></div>
      </div>
      <button onclick="_submitPwLogin('${empId}','${empName}','${deviceId}')"
        style="width:100%;padding:16px;background:linear-gradient(135deg,#f97316,#c2410c);border:none;
               border-radius:13px;color:#fff;font-size:17px;font-weight:900;cursor:pointer;margin-bottom:10px;font-family:inherit">
        ✅ Login करें
      </button>
      <button onclick="_forgotPw('${empId}','${empName}', '${String((emp.phone||emp.mobile||'')).replace(/\D/g,'').slice(-10)}')"
        style="width:100%;padding:13px;background:none;border:1px solid #334155;border-radius:12px;
               color:#64748b;font-size:12px;cursor:pointer;font-family:inherit">
        🔑 Password भूल गए? OTP से दोबारा verify करें
      </button>
    </div>`;
  ov.style.display='flex';
  setTimeout(()=>{ try{ document.getElementById('pwlInput')?.focus(); }catch(e){} }, 300);
}

async function _submitPwLogin(empId, empName, deviceId){
  const entered=(document.getElementById('pwlInput')?.value||'');
  let emp=null;
  try{ const ed=await fbGet('employees/'+empId); emp=ed||{id:empId,name:empName,empId:empId}; }catch(e){ emp={id:empId,name:empName,empId:empId}; }
  const mobile = String(emp.phone||emp.mobile||'').replace(/\D/g,'').slice(-10);
  const saved=_getDevicePasswordHash(empId, mobile);
  const errEl=document.getElementById('pwlErr');
  const enteredHash = await hashPass(entered+'mp_salt_v24');
  if(!saved || enteredHash!==saved){
    if(errEl) errEl.textContent='❌ गलत Password — दोबारा try करें';
    const inp=document.getElementById('pwlInput');
    if(inp){ inp.style.borderColor='#f43f5e'; setTimeout(()=>{ if(inp) inp.style.borderColor='#475569'; },1500); }
    return;
  }
  const ov=document.getElementById('pwLoginOverlay'); if(ov) ov.remove();

  try{
    const result=await Promise.race([window._fbCall('workerLogin',{empId:emp.empId||empId,deviceId}),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))]);
    if(result.data?.token) await window._fbSignInWithToken(result.data.token);
  }catch(e){ try{ await window._fbSignInAnon(); }catch(e2){} }

  const accessLevel=emp.accessLevel||'worker';
  const isMgrRole=accessLevel==='manager'||emp.sec==='MGR';
  SESSION={role:isMgrRole?'manager':'worker',name:emp.name||empName,empId:emp.empId||empId,
           empObjId:emp.id||empId,dept:emp.sec||'',company:'Man Power',deviceId,
           accessLevel,loginAt:new Date().toISOString()};
  if(mobile.length===10) SESSION.mobile = mobile;
  _markWriteAuthFromLogin(mobile);
  writeIntegrityToken();
  saveSession();
  toast('✅ Login हो गया! Welcome '+(emp.name||empName));
  launchApp();
}

function _forgotPw(empId, empName, mobile){
  _clearDevicePassword(empId, mobile);
  const ov=document.getElementById('pwLoginOverlay'); if(ov) ov.remove();
  const ov2=document.getElementById('pwMobileOverlay'); if(ov2) ov2.remove();
  toast('🔑 Password हटाया — OTP से दोबारा verify करें');
  window._forceOtpAfterPwForgot = true;
  try{
    const el=document.getElementById('loginMobile');
    if(el && mobile && String(mobile).length===10) el.value = mobile;
  }catch(e){}
  try{ showStep(1); }catch(e){}
  setTimeout(()=>{ try{ _sendOTP(false); }catch(e){} }, 400);
}

// ── Mobile-first password login (Man Power primary path) ──
function showPasswordLoginForMobile(userData, mobile10, deviceId){
  let ov = document.getElementById('pwMobileOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='pwMobileOverlay'; document.body.appendChild(ov); }
  window._pwMobileCtx = { userData, mobile10, deviceId };
  const name = (userData.name||'User').replace(/</g,'');
  ov.style.cssText='position:fixed;inset:0;z-index:9500;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto';
  ov.innerHTML=`
    <div style="width:100%;max-width:360px;text-align:center">
      <div style="font-size:48px;margin-bottom:10px">🔓</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;
        background:linear-gradient(135deg,#f97316,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px">
        Password Login
      </div>
      <div style="font-size:14px;color:#94a3b8;margin-bottom:20px">
        <b style="color:#f97316">${name}</b><br>
        <span style="font-size:12px">+91-${mobile10} · OTP नहीं चाहिए</span>
      </div>
      <div style="background:#162032;border:1.5px solid #3b5a8a;border-radius:14px;padding:20px;margin-bottom:14px;text-align:left">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:10px">DEVICE PASSWORD *</div>
        <input id="pwmInput" type="password" inputmode="numeric" placeholder="●●●●●" maxlength="20"
          style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                 padding:16px;color:#fff;-webkit-text-fill-color:#fff;caret-color:#f97316;
                 font-size:24px;text-align:center;outline:none;font-family:inherit;letter-spacing:6px"
          onkeydown="if(event.key==='Enter')_submitMobilePwLogin()">
        <div id="pwmErr" style="color:#f43f5e;font-size:12px;margin-top:8px;min-height:16px;text-align:center"></div>
      </div>
      <button onclick="_submitMobilePwLogin()"
        style="width:100%;padding:16px;background:linear-gradient(135deg,#f97316,#c2410c);border:none;
               border-radius:13px;color:#fff;font-size:17px;font-weight:900;cursor:pointer;margin-bottom:10px;font-family:inherit">
        ✅ Login करें
      </button>
      <button onclick="_forgotMobilePw()"
        style="width:100%;padding:13px;background:none;border:1px solid #334155;border-radius:12px;
               color:#64748b;font-size:12px;cursor:pointer;font-family:inherit">
        🔑 Password भूल गए? OTP से verify करें
      </button>
    </div>`;
  ov.style.display='flex';
  setTimeout(()=>{ try{ document.getElementById('pwmInput')?.focus(); }catch(e){} }, 300);
}

async function _submitMobilePwLogin(){
  const ctx = window._pwMobileCtx || {};
  const entered=(document.getElementById('pwmInput')?.value||'');
  const userData = ctx.userData || {};
  const mobile = ctx.mobile10 || '';
  const empObjId = userData.empObjId || userData.employeeId || '';
  const saved = _getDevicePasswordHash(empObjId, mobile);
  const errEl=document.getElementById('pwmErr');
  const enteredHash = await hashPass(entered+'mp_salt_v24');
  if(!saved || enteredHash!==saved){
    if(errEl) errEl.textContent='❌ गलत Password';
    return;
  }
  const ov=document.getElementById('pwMobileOverlay'); if(ov) ov.remove();
  await _finishMobilePasswordLogin(userData, mobile, ctx.deviceId);
}

async function _finishMobilePasswordLogin(userData, mobile, deviceId){
  try{ await window._fbSignInAnon(); }catch(e){}
  // Bind device for future password logins
  const empObjId = userData.empObjId || userData.employeeId || '';
  if(empObjId){
    try{
      await fbUpdate('deviceApprovals/'+empObjId, {
        approvedDeviceId: deviceId || (typeof getDeviceId==='function'?getDeviceId():''),
        approvedAt: new Date().toISOString(),
        validTill: new Date(Date.now()+365*86400000).toISOString(),
        empName: userData.name||'',
        empId: userData.empId||userData.empCode||'',
        via: 'device_password'
      });
    }catch(e){}
  }
  _markWriteAuthFromLogin(mobile);
  _loginMobile = '+91'+mobile;
  toast('✅ Welcome '+(userData.name||''));
  _launchAsNewUser(userData);
}

function _forgotMobilePw(){
  const ctx = window._pwMobileCtx || {};
  const userData = ctx.userData || {};
  const mobile = ctx.mobile10 || '';
  _clearDevicePassword(userData.empObjId||userData.employeeId||'', mobile);
  const ov=document.getElementById('pwMobileOverlay'); if(ov) ov.remove();
  toast('🔑 Password हटाया — OTP भेजा जा रहा है');
  window._forceOtpAfterPwForgot = true;
  try{
    const el=document.getElementById('loginMobile');
    if(el) el.value = mobile;
  }catch(e){}
  setTimeout(()=>{ try{ _sendOTP(false); }catch(e){} }, 300);
}

// ════════════════════════════════════════

// ════════════════════════════════════════

// ── Web OTP API: auto-read SMS OTP on supported browsers (Chrome Android) ──
// Requires HTTPS. SMS format ideally includes: @your-domain #123456
// iOS/Safari: autocomplete="one-time-code" shows keyboard suggestion from Messages.
let _webOtpAbort = null;
function _stopWebOtpListen(){
  try{ if(_webOtpAbort){ _webOtpAbort.abort(); } }catch(e){}
  _webOtpAbort = null;
}
/**
 * Listen for SMS OTP and fill #otpInput (or given selector).
 * @param {string} inputId
 * @param {function} [onFilled] called with 6-digit code
 */
function _startWebOtpListen(inputId, onFilled){
  _stopWebOtpListen();
  const el = document.getElementById(inputId || 'otpInput');
  if(el){
    try{
      el.setAttribute('autocomplete', 'one-time-code');
      el.setAttribute('inputmode', 'numeric');
      el.setAttribute('name', 'one-time-code');
    }catch(e){}
  }
  // Web OTP API (Chrome Android 84+, secure context)
  if(typeof window.OTPCredential === 'undefined' || !navigator.credentials || !window.isSecureContext){
    return;
  }
  try{
    _webOtpAbort = new AbortController();
    navigator.credentials.get({
      otp: { transport: ['sms'] },
      signal: _webOtpAbort.signal
    }).then(cred=>{
      if(!cred || !cred.code) return;
      const code = String(cred.code).replace(/\D/g,'').slice(0,6);
      if(code.length < 4) return;
      const input = document.getElementById(inputId || 'otpInput');
      if(input){
        input.value = code;
        input.dispatchEvent(new Event('input', { bubbles:true }));
      }
      toast('📲 OTP SMS से auto-fill हो गया');
      if(typeof onFilled === 'function') onFilled(code);
      else if(code.length === 6){
        // Auto-verify after short delay so UI updates
        setTimeout(()=>{
          try{
            if(document.getElementById('otpLoginOverlay')?.style.display && document.getElementById('otpLoginOverlay').style.display !== 'none' && typeof _verifyDeviceOTP==='function')
              _verifyDeviceOTP();
            else if(typeof _verifyOTP==='function')
              _verifyOTP();
          }catch(e){}
        }, 300);
      }
    }).catch(err=>{
      // AbortError = user navigated away / we cancelled — ignore
      if(err && err.name === 'AbortError') return;
      console.warn('[WebOTP]', err && err.message);
    });
  }catch(e){ console.warn('[WebOTP] not available', e.message); }
}


// SHARED FIREBASE PHONE OTP
// ════════════════════════════════════════
function _fbPhoneAuthReady(){
  return !!(window._fbAuth && window._fbRecaptchaVerifierClass && window._fbSignInWithPhoneNumber);
}

function _fbEnsureRecaptchaHost(containerId){
  let el = document.getElementById(containerId);
  if(!el){
    el = document.createElement('div');
    el.id = containerId;
    document.body.appendChild(el);
  }
  // Visible fallback container sits near bottom-center if needed
  el.innerHTML = '';
  el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;min-width:1px;min-height:1px';
  return el;
}

function _fbClearRecaptcha(storeKey){
  try{
    if(window[storeKey]){
      try{ window[storeKey].clear(); }catch(e){}
      window[storeKey] = null;
    }
  }catch(e){}
}

/**
 * Create RecaptchaVerifier. size: 'invisible' | 'normal'
 * Always clears previous instance first.
 */
async function _fbMakeRecaptcha(containerId, storeKey, size){
  _fbClearRecaptcha(storeKey);
  _fbEnsureRecaptchaHost(containerId);
  const params = {
    size: size || 'invisible',
    callback: ()=>{},
    'expired-callback': ()=>{ try{ window[storeKey]=null; }catch(e){} }
  };
  const verifier = new window._fbRecaptchaVerifierClass(window._fbAuth, containerId, params);
  window[storeKey] = verifier;
  // render() is required for reliable phone auth on web
  try{
    if(typeof verifier.render === 'function'){
      await verifier.render();
    }
  }catch(e){
    console.warn('[recaptcha render]', e);
  }
  return verifier;
}

/**
 * Send OTP to E.164 phone. Tries invisible reCAPTCHA, then visible fallback.
 * Clears any existing Firebase Auth session first (avoids auth/internal-error).
 */
async function _fbSendPhoneOtp(e164Phone, containerId, storeKey){
  if(!_fbPhoneAuthReady()){
    throw new Error('Firebase Auth not ready — wait 2 seconds and try again');
  }
  const phone = String(e164Phone||'').trim();
  if(!/^\+\d{10,15}$/.test(phone)){
    throw new Error('Invalid phone number');
  }

  // Only sign out anonymous/stale sessions — keep existing phone auth for same number
  try{
    const cu = window._fbAuth && window._fbAuth.currentUser;
    if(cu){
      const curPhone = (cu.phoneNumber||'').replace(/\D/g,'').slice(-10);
      const wantPhone = phone.replace(/\D/g,'').slice(-10);
      if(cu.phoneNumber && curPhone && wantPhone && curPhone === wantPhone){
        console.log('[otp] already phone-authed as', curPhone, '— skip signOut');
      } else if(cu.isAnonymous || (cu.phoneNumber && curPhone !== wantPhone)){
        if(window._fbSignOut) await window._fbSignOut();
      }
    }
  }catch(e){ console.warn('[otp] signOut before phone', e); }

  const cid = containerId || 'recaptcha-container';
  const key = storeKey || '_fbRecaptchaNew';

  // Attempt 1: invisible
  try{
    const verifier = await _fbMakeRecaptcha(cid, key, 'invisible');
    const confirmation = await window._fbSignInWithPhoneNumber(window._fbAuth, phone, verifier);
    return confirmation;
  }catch(err1){
    console.warn('[otp] invisible failed', err1 && (err1.code||err1.message));
    _fbClearRecaptcha(key);

    // Attempt 2: visible checkbox (more reliable when invisible/internal-error)
    try{
      toast('🔐 Complete the security check…');
      const verifier2 = await _fbMakeRecaptcha(cid, key, 'normal');
      const confirmation2 = await window._fbSignInWithPhoneNumber(window._fbAuth, phone, verifier2);
      return confirmation2;
    }catch(err2){
      console.error('[otp] visible also failed', err2);
      _fbClearRecaptcha(key);
      throw err2;
    }
  }
}

async function _fbVerifyPhoneOtp(confirmationResult, code){
  const otp = String(code||'').replace(/\D/g,'').slice(0,6);
  if(otp.length !== 6) throw new Error('Enter 6-digit OTP');
  if(!confirmationResult || typeof confirmationResult.confirm !== 'function'){
    throw new Error('OTP session expired — send OTP again');
  }
  return await confirmationResult.confirm(otp);
}

function _fbOtpErrorMessage(err){
  const code = (err && err.code) || '';
  const msg = (err && err.message) || String(err||'');
  if(code === 'auth/invalid-verification-code') return 'Wrong OTP — check SMS and try again';
  if(code === 'auth/code-expired') return 'OTP expired — request a new one';
  if(code === 'auth/too-many-requests') return 'Too many attempts — wait a few minutes';
  if(code === 'auth/network-request-failed') return 'Network error — check internet';
  if(code === 'auth/captcha-check-failed') return 'Security check failed — reload page and retry';
  if(code === 'auth/invalid-phone-number') return 'Invalid mobile number';
  if(code === 'auth/missing-phone-number') return 'Enter mobile number';
  if(code === 'auth/quota-exceeded') return 'SMS quota exceeded — try later or enable billing in Firebase';
  if(code === 'auth/billing-not-enabled') return 'Firebase billing not enabled for SMS OTP';
  if(code === 'auth/operation-not-allowed') return 'Phone login disabled in Firebase Console';
  if(code === 'auth/internal-error'){
    return 'OTP service error (auth/internal-error). Check: Phone Auth ON, domain authorized, billing/SMS enabled. Then reload page.';
  }
  if(/Firebase Auth not ready/i.test(msg)) return msg;
  // Strip long Firebase: Error (...) wrappers for toast
  const m = msg.match(/auth\/[a-z0-9-]+/i);
  if(m) return 'OTP error ('+m[0]+') — reload and try again';
  return msg.slice(0,120) || 'OTP failed';
}

// ════════════════════════════════════════
// OTP LOGIN SYSTEM
// ════════════════════════════════════════
let _otpEmp = null;
let _otpDeviceId = null;

async function showOTPLoginScreen(emp, deviceId){
  _otpEmp = emp;
  _otpDeviceId = deviceId;
  const maskedPhone = emp.phone.slice(0,2) + '●●●●●●' + emp.phone.slice(-2);

  let ov = document.getElementById('otpLoginOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='otpLoginOverlay'; document.body.appendChild(ov); }
  ov.style.cssText='position:fixed;inset:0;z-index:9500;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto';
  ov.innerHTML=`
    <div style="width:100%;max-width:360px;text-align:center">
      <div style="font-size:48px;margin-bottom:10px">📲</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;
        background:linear-gradient(135deg,#f97316,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px">
        OTP Verification
      </div>
      <div style="font-size:14px;color:#94a3b8;margin-bottom:24px">
        <b style="color:#f97316">${emp.name}</b><br>
        <span style="font-size:12px">+91 ${maskedPhone} पर OTP भेजा जाएगा</span>
      </div>
      <div id="recaptcha-container-device"></div>
      <div id="otpStep1" style="">
        <button onclick="_sendDeviceOTP()" id="sendOtpBtn"
          style="width:100%;padding:16px;background:linear-gradient(135deg,#22c55e,#15803d);border:none;
                 border-radius:13px;color:#fff;font-size:17px;font-weight:900;cursor:pointer;
                 margin-bottom:12px;font-family:inherit">
          📤 OTP भेजें
        </button>
      </div>
      <div id="otpStep2" style="display:none">
        <div style="font-size:13px;color:#22c55e;margin-bottom:16px;font-weight:700">
          ✅ OTP भेज दिया गया +91 ${maskedPhone} पर
        </div>
        <div style="background:#162032;border:1.5px solid #3b5a8a;border-radius:14px;padding:20px;margin-bottom:14px;text-align:left">
          <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:10px">6-digit OTP डालें *</div>
          <input id="otpInput" type="tel" name="one-time-code" inputmode="numeric" placeholder="● ● ● ● ● ●" maxlength="6"
            autocomplete="one-time-code" enterkeyhint="done" autocapitalize="off" spellcheck="false"
            style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                   padding:16px;color:#fff;-webkit-text-fill-color:#fff;caret-color:#f97316;
                   font-size:28px;text-align:center;outline:none;font-family:inherit;letter-spacing:8px;box-shadow:0 0 0 2px rgba(96,165,250,.3)"
            oninput="this.value=this.value.replace(/\\D/g,'').slice(0,6);_otpValidate()">
          <div id="otpErr" style="color:#f43f5e;font-size:12px;margin-top:8px;min-height:16px;text-align:center"></div>
        </div>
        <button id="verifyOtpBtn" onclick="_verifyDeviceOTP()" disabled
          style="width:100%;padding:16px;background:linear-gradient(135deg,#f97316,#c2410c);border:none;
                 border-radius:13px;color:#fff;font-size:17px;font-weight:900;cursor:pointer;
                 margin-bottom:10px;opacity:.4;pointer-events:none;font-family:inherit">
          ✅ Verify करें
        </button>
        <button onclick="_resendOTP()"
          style="width:100%;padding:12px;background:none;border:1px solid #334155;border-radius:12px;
                 color:#64748b;font-size:13px;cursor:pointer;font-family:inherit">
          🔄 OTP दोबारा भेजें
        </button>
      </div>
      <button onclick="_cancelOTP()"
        style="width:100%;padding:12px;background:none;border:1px solid #334155;border-radius:12px;
               color:#64748b;font-size:13px;cursor:pointer;font-family:inherit;margin-top:8px">
        ← वापस जाएं
      </button>
    </div>`;
  ov.style.display='flex';
}

function _otpValidate(){
  const val=(document.getElementById('otpInput')?.value||'');
  const btn=document.getElementById('verifyOtpBtn');
  if(val.length===6){
    if(btn){ btn.style.opacity='1'; btn.style.pointerEvents='auto'; btn.disabled=false; }
  } else {
    if(btn){ btn.style.opacity='.4'; btn.style.pointerEvents='none'; btn.disabled=true; }
  }
}

let _deviceOtpConfirm = null;
let _deviceOtpBusy = false;

async function _sendDeviceOTP(isResend){
  if(_deviceOtpBusy) return;
  if(!_otpEmp || !_otpEmp.phone){ toast('⚠️ Employee mobile missing'); return; }
  const digits = String(_otpEmp.phone).replace(/\D/g,'');
  const mobile = (digits.length===12 && digits.startsWith('91')) ? digits.slice(2) : digits;
  if(mobile.length!==10){ toast('⚠️ Invalid employee mobile'); return; }
  _deviceOtpBusy = true;
  const btn = document.getElementById('sendOtpBtn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Sending…'; }
  try{
    toast(isResend?'⏳ Resending OTP…':'OTP भेजा जा रहा है...');
    _deviceOtpConfirm = await _fbSendPhoneOtp('+91'+mobile, 'recaptcha-container-device', '_fbRecaptchaDevice');
    const s1=document.getElementById('otpStep1');
    const s2=document.getElementById('otpStep2');
    if(s1) s1.style.display='none';
    if(s2) s2.style.display='block';
    document.getElementById('otpInput')?.focus();
    _startWebOtpListen('otpInput', code=>{ if(code&&code.length===6) setTimeout(()=>{ try{ _verifyDeviceOTP(); }catch(e){} }, 250); });
    toast('✅ OTP भेज दिया!');
  }catch(err){
    console.error('Device OTP send', err);
    toast('❌ '+_fbOtpErrorMessage(err));
  }finally{
    _deviceOtpBusy=false;
    if(btn){ btn.disabled=false; btn.textContent='📤 OTP भेजें'; }
  }
}

async function _verifyDeviceOTP(){
  _stopWebOtpListen();

  if(_deviceOtpBusy) return;
  const otp=(document.getElementById('otpInput')?.value||'').replace(/\D/g,'').slice(0,6);
  if(otp.length!==6){ toast('⚠️ 6 अंकों का OTP डालें'); return; }
  if(!_deviceOtpConfirm){ toast('⚠️ पहले OTP भेजें'); return; }
  _deviceOtpBusy=true;
  const btn=document.getElementById('verifyOtpBtn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Verifying…'; }
  try{
    await _fbVerifyPhoneOtp(_deviceOtpConfirm, otp);
    toast('✅ OTP verified!');
    const emp=_otpEmp;
    const deviceId=_otpDeviceId || (typeof getDeviceId==='function'?getDeviceId():'');
    _deviceOtpConfirm=null;
    // Close overlay
    const ov=document.getElementById('otpLoginOverlay');
    if(ov) ov.style.display='none';
    // Continue same path as approved device login
    if(typeof doLoginAfterApproval==='function'){
      await doLoginAfterApproval(emp, null, deviceId);
    }else if(typeof showSetPasswordScreen==='function'){
      showSetPasswordScreen(emp, deviceId, true);
    }else{
      toast('✅ Verified — continue login');
    }
  }catch(err){
    console.error('Device OTP verify', err);
    toast('❌ '+_fbOtpErrorMessage(err));
  }finally{
    _deviceOtpBusy=false;
    if(btn){ btn.disabled=false; btn.textContent='✅ Verify करें'; btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
  }
}

async function _resendOTP(){
  if(_otpEmp && document.getElementById('otpLoginOverlay')?.style.display!=='none'){
    return _sendDeviceOTP(true);
  }
  return _sendOTP(true);
}

function _cancelOTP(){
  _deviceOtpConfirm=null;
  _otpEmp=null;
  _otpDeviceId=null;
  const ov=document.getElementById('otpLoginOverlay');
  if(ov) ov.style.display='none';
}


// ── OTP Rate Limiting — Firebase server-side (cannot be bypassed by clearing localStorage) ──
// [OLD OTP system replaced by Firebase Phone Auth - see _sendOTP above]

function showNewEmpRegistrationForm(code){
  let ov=document.getElementById('newRegOverlay');
  if(!ov){ov=document.createElement('div');ov.id='newRegOverlay';document.body.appendChild(ov);}
  ov.style.cssText='position:fixed;inset:0;z-index:9000;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
  window._nrSelfieData=null;
  ov.innerHTML=`
    <div style="width:100%;max-width:360px">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:48px">&#128100;</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;
          background:linear-gradient(135deg,#f97316,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
          New Registration
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:4px">
          Employee Code: <b style="color:#f97316">${code}</b>
        </div>
      </div>
      <!-- Mobile -->
      <div style="background:#1e293b;border:1.5px solid #334155;border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">MOBILE NUMBER *</div>
        <input id="nrPhone" type="tel" inputmode="numeric" placeholder="10 digit number" maxlength="10"
          style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;
                 border-radius:10px;padding:13px 12px;color:#fff;font-size:18px;font-weight:700;outline:none;font-family:inherit"
          oninput="this.value=this.value.replace(/\\D/g,'').slice(0,10);_nrValidate()">
      </div>
      <!-- Department -->
      <div style="background:#1e293b;border:1.5px solid #334155;border-radius:14px;padding:16px;margin-bottom:12px;position:relative">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:8px">DEPARTMENT *</div>
        <select id="nrDept" onchange="_nrValidate()"
          style="width:100%;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                 padding:13px 12px;color:#fff;font-size:15px;font-weight:700;outline:none;
                 font-family:inherit;appearance:none;-webkit-appearance:none;cursor:pointer">
          <option value="">-- Select Department --</option>
          <option value="MET">&#127981; MET - Metalliser</option>
          <option value="PET">&#128309; PET - PET Line</option>
          <option value="TRAINEE">&#128218; Trainee - New Joinee</option>
          <option value="OTHERS">&#127760; Guest / Others</option>
        </select>
        <div style="pointer-events:none;position:absolute;right:28px;bottom:20px;color:#f97316;font-size:14px">&#9660;</div>
      </div>
      <!-- Selfie -->
      <div style="background:#1e293b;border:1.5px solid #334155;border-radius:14px;padding:16px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:1px;margin-bottom:10px">SELFIE PHOTO * (Admin verification)</div>
        <div style="width:100%;height:150px;border-radius:10px;background:#0f172a;
          border:2px dashed #334155;display:flex;align-items:center;justify-content:center;
          margin-bottom:10px;overflow:hidden;cursor:pointer"
          onclick="document.getElementById('nrSelfieInput').click()">
          <div id="nrSelfiePlaceholder" style="text-align:center;color:#475569">
            <div style="font-size:36px;margin-bottom:6px">📸</div>
            <div style="font-size:13px;font-weight:700">Tap to take Selfie</div>
          </div>
          <img id="nrSelfieImg" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:10px">
        </div>
        <input id="nrSelfieInput" type="file" accept="image/*" capture="user" style="display:none" onchange="previewNRSelfie(this)">
        <button onclick="document.getElementById('nrSelfieInput').click()"
          style="width:100%;padding:11px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3);
                 border-radius:10px;color:#f97316;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          📷 Selfie लें / बदलें
        </button>
      </div>
      <div id="nrErr" style="color:#f43f5e;font-size:13px;text-align:center;min-height:18px;margin-bottom:8px"></div>
      <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;
        padding:10px 14px;margin-bottom:14px;font-size:12px;color:#94a3b8;line-height:1.8;text-align:center">
        ✅ Submit करने पर Admin को <b style="color:#25D366">WhatsApp</b> notification जाएगी
      </div>
      <button id="nrBtn" onclick="submitNewEmpReg('${code}')"
        style="width:100%;padding:16px;background:linear-gradient(135deg,#f97316,#a855f7);
               border:none;border-radius:13px;color:#fff;font-size:17px;font-weight:900;
               cursor:pointer;margin-bottom:10px;opacity:.4;pointer-events:none;font-family:inherit">
        📲 Submit &rarr; WhatsApp से Admin को जाएगी
      </button>
      <button onclick="document.getElementById('newRegOverlay').style.display='none';showStep(2);"
        style="width:100%;padding:13px;background:none;border:1px solid #334155;
               border-radius:12px;color:#64748b;font-size:14px;cursor:pointer;font-family:inherit">
        &larr; Back
      </button>
    </div>`;
  setTimeout(()=>document.getElementById('nrPhone')?.focus(),200);
}

function previewNRSelfie(input){
  if(!input.files||!input.files[0]) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=document.getElementById('nrSelfieImg');
    const ph=document.getElementById('nrSelfiePlaceholder');
    if(img){img.src=e.target.result;img.style.display='block';}
    if(ph) ph.style.display='none';
    window._nrSelfieData=e.target.result;
    _nrValidate();
  };
  reader.readAsDataURL(input.files[0]);
}

function _nrValidate(){
  const dept=(document.getElementById('nrDept')?.value||'').trim();
  const phone=(document.getElementById('nrPhone')?.value||'').trim();
  const hasSelfie=!!window._nrSelfieData;
  const btn=document.getElementById('nrBtn');
  const ok=dept&&phone.length===10&&hasSelfie;
  if(btn){btn.style.opacity=ok?'1':'.4';btn.style.pointerEvents=ok?'auto':'none';}
}

function _newRegNameChanged(){ _nrValidate(); }

function showForgotPassword(){ toast('Password reset ke liye Admin se sampark karein: +91-8929394920'); }
function startWebOtpListener(){}
function resendOtp(){ return _resendOTP(); }
function checkOtpAutoSubmit(){}
function cancelOtpFlow(){ try{_cancelOTP();}catch(e){} try{closeModal();}catch(e){} }
async function confirmPasswordReset(){ try{closeModal();}catch(e){} }
async function _sendOtpSms(){ return _sendOTP(true); }



async function submitNewEmpReg(code){
  try{ await window._fbSignInAnon(); }catch(e){}
  const dept  =(document.getElementById('nrDept')?.value||'MET').trim();
  const phone =(document.getElementById('nrPhone')?.value||'').trim();
  let deviceId;
  try{ deviceId=(typeof getDeviceId==='function')?getDeviceId():null; }catch(e){}
  if(!deviceId) deviceId='dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const errEl=document.getElementById('nrErr');
  if(!dept){ if(errEl) errEl.textContent='❌ Department चुनें'; return; }
  if(!phone||phone.length<10){ if(errEl) errEl.textContent='❌ 10 digit mobile number डालें'; return; }
  if(!window._nrSelfieData){ if(errEl) errEl.textContent='❌ Selfie लें'; return; }
  const btn=document.getElementById('nrBtn');
  if(btn){btn.innerHTML='⏳ Upload हो रहा है...';btn.style.opacity='0.7';btn.style.pointerEvents='none';}
  if(errEl) errEl.textContent='';
  try{
    // Upload selfie — non-blocking if storage not enabled
    let selfieUrl=null;
    try{
      if(typeof window._fbUploadSelfie==='function'){
        const path='selfies/registrations/'+code+'_'+Date.now()+'.jpg';
        selfieUrl=await window._fbUploadSelfie(window._nrSelfieData, path);
      }
    }catch(e){ console.warn('[selfie upload]',e.message); }

    const passHash=await hashPass(code+':MP_USR');
    const key=await fbPush('regRequests',{
      empId:code, name:code, sec:dept, dept:dept,
      phone:phone, company:'Man Power', status:'pending',
      deviceId:deviceId, passHash:passHash,
      selfieUrl:selfieUrl||'',
      requestedAt:new Date().toISOString()
    });
    await fbUpdate('regRequests/'+key,{_key:key});
    try{ await notifyAdmin('🆕 नया Registration', code+' ('+dept+') ने request भेजी'); }catch(e){}

    // ── Open WhatsApp on user's phone to send message to admin ──
    const appUrl=window.location.href.split('?')[0];
    const waMsg=encodeURIComponent(
      `🆕 *New Employee Registration*\n\n`+
      `👤 Employee Code: *${code}*\n`+
      `📱 Mobile: *${phone}*\n`+
      `🏭 Department: *${dept}*\n`+
      (selfieUrl?`📸 Selfie: ${selfieUrl}\n`:``)+
      `\n✅ App mein approve karein:\n${appUrl}\n`+
      `_(Pending tab > New Registrations)_`
    );
    setTimeout(()=>{ openWA('8929394920', decodeURIComponent(waMsg)); }, 600);

    const ov=document.getElementById('newRegOverlay');
    if(ov) ov.style.display='none';
    showPendingBox();
    toast('✅ Request भेजी! WhatsApp से Admin को notification जाएगी।');
  }catch(e){
    if(errEl) errEl.textContent='❌ Error: '+e.message;
    if(btn){btn.innerHTML='📲 Submit → WhatsApp से Admin को जाएगी';btn.style.opacity='1';btn.style.pointerEvents='auto';}
  }
}

// ── Admin Notification via Firebase ──
async function notifyAdmin(title, body){
  try{
    const key = await fbPush('adminNotifications',{
      title, body, read:false, at:new Date().toISOString()
    });
    // Also try browser notification if admin is online
    if(typeof Notification !== 'undefined' && Notification.permission==='granted'){
      new Notification(title,{body, icon:'/MP-App/icons/icon-192.png'});
    }
  }catch(e){}
}

function listenAdminNotifications(){
  if(!isAdmin()) return;
  // Request browser notification permission
  if(typeof Notification !== 'undefined' && Notification.permission==='default'){
    Notification.requestPermission().catch(()=>{});
  }
  // Listen for new notifications
  fbListen('adminNotifications', v=>{
    if(!v) return;
    const items = Object.entries(v);
    const unread = items.filter(([k,n])=>!n.read);
    // Flash bell if unread
    const bell = document.getElementById('notifBtn');
    if(bell && unread.length>0){
      bell.style.display='flex';
      bell.style.animation='pulse 1s infinite';
      const badge = document.getElementById('notifCount');
      // combine with pending count
      const pendingCount = getRegs().filter(r=>r.status==='pending').length
        + getLeaves().filter(l=>l.status==='pending').length
        + getReports().filter(r=>r.status==='pending').length;
      if(badge) badge.textContent = pendingCount + unread.length;
    }
    // Show browser notification for latest unread
    if(unread.length>0 && typeof Notification !== 'undefined' && Notification.permission==='granted'){
      const [k, latest] = unread[unread.length-1];
      new Notification(latest.title||'Man Power', {
        body:latest.body||'नई activity',
        icon:'/MP-App/icons/icon-192.png',
        tag:'mp-admin-notif'
      });
      // Mark as read
      fbUpdate('adminNotifications/'+k,{read:true}).catch(()=>{});
    }
  });
}

function showDeviceConflict(emp, existingApproval, newDeviceId){
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;padding:10px 0">
    <div style="font-size:44px;margin-bottom:10px">📱</div>
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:8px">नया Device Detected</div>
    <div style="font-size:13px;color:var(--muted2);margin-bottom:6px;line-height:1.6">
      आपका account दूसरे device पर registered है।<br>
      इस नए device पर login के लिए<br>
      <b style="color:#fff">Manager की मंजूरी जरूरी है।</b>
    </div>
    <div style="background:var(--panel);border:1px solid var(--border2);border-radius:10px;padding:12px;margin:12px 0;text-align:left">
      <div style="font-size:11px;color:var(--muted2)">Employee: <b style="color:#fff">${emp.name}</b></div>
      <div style="font-size:11px;color:var(--muted2);margin-top:4px">पिछला Device: <b style="color:#fff">${existingApproval.approvedDeviceId.substring(0,12)}...</b></div>
    </div>
    <div style="font-size:12px;color:var(--day);background:var(--daybg);border-radius:10px;padding:10px;margin-bottom:14px">
      📞 Manager: <b>${(CFG&&CFG.contactVivek)||''}</b><br>
      वो नए device को approve करेंगे
    </div>
    <button class="submit-btn" onclick="requestDeviceChange('${emp.id}','${emp.name}','${newDeviceId}')">
      📤 Approval Request भेजें
    </button>
    <button class="cancel-btn" onclick="closeModal()">बाद में</button>
  </div>`);
}

async function requestDeviceChange(empObjId, empName, newDeviceId){
  const key = await fbPush('deviceChangeRequests', {
    empObjId, empName, newDeviceId,
    status:'pending', requestedAt: new Date().toISOString()
  });
  await fbUpdate('deviceChangeRequests/'+key, {_key:key});
  closeModal();
  toast('✅ Request भेज दी! Manager approve करेंगे।');
}

function showLoginErr(msg){
  // Try to show in whichever error element is visible
  const el = document.getElementById('loginErr2')?.closest('#loginStep2')?.style.display!=='none'
    ? document.getElementById('loginErr2')
    : document.getElementById('loginErr');
  if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3500); }
}

// ════════════════════════════════════════
// LAUNCH
// ════════════════════════════════════════

/** Ensure Firebase RTDB role nodes match SESSION so security rules allow writes.
 *  Managers: managers/{auth.uid}=true when phone-auth user is approved manager.
 *  Admins: admins/{auth.uid}=true for hardcoded admin phones or SESSION.role=admin.
 */
async function _syncAuthRoleNodes(){
  try{
    const auth = window._fbAuth;
    if(!auth || !auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    if(!uid) return false;
    const phone = (auth.currentUser.phoneNumber || '').replace(/\s/g,'');
    const isHardAdmin = _isHardAdminPhone(phone) || _isHardAdminPhone(SESSION.mobile) || SESSION.role==='admin';
    if(SESSION.role === 'admin' || isHardAdmin){
      try{ await fbSet('admins/'+uid, true); }catch(e){ console.warn('[roleSync] admins write:', e.message); }
    }
    if(SESSION.role === 'manager' || isMgr() || isHardAdmin){
      try{ await fbSet('managers/'+uid, true); }catch(e){ console.warn('[roleSync] managers write:', e.message); }
    }
    return true;
  }catch(e){ console.warn('[roleSync]', e.message); return false; }
}

/** True if Firebase Auth can satisfy RTDB write rules (phone OTP user or elevated node). */
function _hasElevatedFirebaseAuth(){
  try{
    const u = window._fbAuth && window._fbAuth.currentUser;
    if(!u) return false;
    // Anonymous has no phoneNumber — cannot write overrides under current rules
    if(u.isAnonymous) return false;
    if(u.phoneNumber) return true;
    // Custom-token admin might lack phone but have providers
    if(SESSION.role === 'admin' && u.uid) return true;
    return false;
  }catch(e){ return false; }
}

/**
 * Write-security mode (per browser):
 *  - "trusted" (default, MET-like): after one successful login/OTP on this device,
 *    schedule Save works without OTP every time (anonymous Firebase + auth != null rules).
 *  - "strict": always require live Phone Auth (or OTP modal) before Save.
 * Toggle in Profile → App Access Security.
 */
function getWriteSecurityMode(){
  try{
    const m = localStorage.getItem('mp_write_security_mode');
    if(m === 'strict' || m === 'trusted') return m;
  }catch(e){}
  return 'trusted'; // MET-like default
}
function setWriteSecurityMode(mode){
  try{ localStorage.setItem('mp_write_security_mode', mode === 'strict' ? 'strict' : 'trusted'); }catch(e){}
}
function _isTrustedDeviceForWrite(){
  try{
    if(!(SESSION && SESSION.role)) return false;
    // v2.4.5: In Trusted mode, a live app session is enough (mobile + laptop).
    // sessionStorage is wiped when the mobile PWA is fully closed — do NOT require it.
    // This matches MET Power: once logged in on this device, Save works without OTP.
    if(getWriteSecurityMode() === 'trusted'){
      if(SESSION.role === 'manager' || SESSION.role === 'admin' || SESSION.role === 'member'
          || SESSION.role === 'worker' || (typeof isMgr==='function' && isMgr())){
        return true;
      }
    }
    // Strict mode (or unknown role): require device verify flags / password / fingerprint
    const _sessMob = _normMobileKey(SESSION.mobile || SESSION.uid || '');
    const verifiedAt = parseInt(localStorage.getItem('mp_device_verified_at')||'0',10);
    const hadPhone = (localStorage.getItem('mp_device_phone')||'').replace(/\D/g,'');
    const recentWrite = parseInt(localStorage.getItem('mp_write_auth_at')||'0',10);
    const phoneMatches = !hadPhone || !_sessMob || hadPhone.slice(-10) === _sessMob;
    const within90d = hadPhone && verifiedAt && (Date.now()-verifiedAt) < 90*24*3600*1000;
    const within14dWrite = recentWrite && (Date.now()-recentWrite) < 14*24*3600*1000;
    const sessionOk = sessionStorage.getItem('mp_write_auth')==='1';
    const empObjId = SESSION.empObjId || '';
    const hasPw = typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, _sessMob);
    const uid = empObjId || (_sessMob ? ('m_'+_sessMob) : '');
    const hasFp = !!(uid && localStorage.getItem('mp_fp_enabled_'+uid)==='1') || localStorage.getItem('mp_fp_enabled')==='1';
    return !!(phoneMatches && (within90d || within14dWrite || sessionOk || hasPw || hasFp || hadPhone));
  }catch(e){ return false; }
}

/**
 * Ensure write-capable auth before schedule save.
 * Trusted mode (default): MET-like — no OTP every Save on this browser after first login.
 * Strict mode: require Phone Auth or quick OTP modal.
 * @returns {Promise<boolean>}
 */
async function _ensureWriteAuth(){
  // Wait for Firebase to restore saved Phone session from this device
  try{
    if(typeof window._fbAuthStateReady === 'function') await window._fbAuthStateReady();
    else if(window._fbAuth && typeof window._fbAuth.authStateReady === 'function') await window._fbAuth.authStateReady();
  }catch(e){}

  const _sessMob = _normMobileKey(SESSION.mobile || SESSION.uid || '');
  const _markDeviceCache = ()=>{
    try{
      localStorage.setItem('mp_write_auth_at', String(Date.now()));
      sessionStorage.setItem('mp_write_auth','1');
      const u = window._fbAuth && window._fbAuth.currentUser;
      if(u && u.phoneNumber){
        localStorage.setItem('mp_device_phone', u.phoneNumber);
        localStorage.setItem('mp_device_uid', u.uid||'');
        if(!localStorage.getItem('mp_device_verified_at'))
          localStorage.setItem('mp_device_verified_at', String(Date.now()));
      } else if(_sessMob){
        localStorage.setItem('mp_device_phone', '+91'+_sessMob);
        if(!localStorage.getItem('mp_device_verified_at'))
          localStorage.setItem('mp_device_verified_at', String(Date.now()));
      }
    }catch(e){}
  };

  // Ensure some Firebase Auth user exists (anonymous is OK in trusted mode + new rules)
  try{
    if(window._fbAuth && !window._fbAuth.currentUser && typeof window._fbSignInAnon === 'function'){
      await window._fbSignInAnon();
    }
  }catch(e){ console.warn('[writeAuth] anon sign-in', e); }

  // Fast path: Firebase Phone Auth already active on this tab
  if(_hasElevatedFirebaseAuth()){
    await _syncAuthRoleNodes();
    _markDeviceCache();
    return true;
  }

  // Device cache: wait briefly for Phone Auth restore from IndexedDB
  try{
    if(_isTrustedDeviceForWrite()){
      for(let i=0;i<20;i++){
        if(_hasElevatedFirebaseAuth()) break;
        await new Promise(r=>setTimeout(r, 100));
        try{
          if(typeof window._fbAuthStateReady === 'function') await window._fbAuthStateReady();
        }catch(e){}
      }
    }
  }catch(e){}

  if(_hasElevatedFirebaseAuth()){
    await _syncAuthRoleNodes();
    _markDeviceCache();
    return true;
  }

  // ── MET-like trusted path (mobile + laptop): session logged in → no OTP on Save ──
  if(getWriteSecurityMode() === 'trusted' && _isTrustedDeviceForWrite()){
    try{
      if(window._fbAuth && !window._fbAuth.currentUser && typeof window._fbSignInAnon === 'function'){
        await window._fbSignInAnon();
      }
    }catch(e){}
    // Brief wait if auth still null (slow mobile network)
    if(!(window._fbAuth && window._fbAuth.currentUser)){
      for(let i=0;i<15;i++){
        if(window._fbAuth && window._fbAuth.currentUser) break;
        try{
          if(typeof window._fbSignInAnon === 'function') await window._fbSignInAnon();
        }catch(e){}
        await new Promise(r=>setTimeout(r, 120));
      }
    }
    try{ await _syncAuthRoleNodes(); }catch(e){}
    _markDeviceCache();
    if(window._fbAuth && window._fbAuth.currentUser){
      return true;
    }
    // Last resort: still skip OTP in trusted mode if session exists — rules need auth;
    // try one more anon sign-in
    try{ if(typeof window._fbSignInAnon === 'function') await window._fbSignInAnon(); }catch(e){}
    if(window._fbAuth && window._fbAuth.currentUser){
      _markDeviceCache();
      return true;
    }
  }

  // Strict mode OR untrusted: OTP for managers
  const mob = _sessMob;
  if(getWriteSecurityMode() === 'strict' && (isMgr() || SESSION.role === 'manager' || SESSION.role === 'admin') && mob && mob.length === 10){
    return await _openQuickPhoneReauth(mob);
  }
  // Trusted mode but flags failed AND no auth user — only then OTP
  if((isMgr() || SESSION.role === 'manager' || SESSION.role === 'admin') && mob && mob.length === 10){
    return await _openQuickPhoneReauth(mob);
  }
  if(SESSION.role === 'admin'){
    await _syncAuthRoleNodes();
    return !!(window._fbAuth && window._fbAuth.currentUser);
  }
  // Members with session: allow if any auth user present
  if(SESSION && SESSION.role && window._fbAuth && window._fbAuth.currentUser){
    _markDeviceCache();
    return true;
  }
  return false;
}

let _reauthConfirm = null;
let _reauthResolve = null;

/** Modal: verify phone OTP without logging out of the app. */
function _openQuickPhoneReauth(mobile10){
  return new Promise((resolve)=>{
    _reauthResolve = resolve;
    _reauthConfirm = null;
    const existing = document.getElementById('quickReauthOverlay');
    if(existing) existing.remove();

    const ov = document.createElement('div');
    ov.id = 'quickReauthOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)';
    ov.innerHTML = `
      <div style="background:var(--bg2,#0d1623);border-radius:20px 20px 0 0;padding:22px 18px 36px;width:100%;max-width:480px;border-top:1px solid var(--border2,#334155)">
        <div style="width:36px;height:4px;background:#475569;border-radius:2px;margin:0 auto 14px"></div>
        <div style="font-size:17px;font-weight:900;color:#fff;margin-bottom:6px">🔐 Phone verify (one time)</div>
        <div style="font-size:13px;color:#94a3b8;line-height:1.5;margin-bottom:14px">
          इस <b>device/browser</b> पर एक बार Phone OTP चाहिए। <b style="color:#e2e8f0">Logout नहीं</b> · Laptop और Mobile दोनों चल सकते हैं (हर device पर अलग से एक बार OTP)।
        </div>
        <div style="font-size:12px;color:#7dd3fc;margin-bottom:10px">📱 +91 ${mobile10}</div>
        <div id="reauthRecaptcha" style="min-height:1px"></div>
        <button type="button" id="reauthSendBtn" onclick="_reauthSendOtp('${mobile10}')"
          style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:15px;cursor:pointer;margin-bottom:10px">
          OTP भेजें
        </button>
        <input id="reauthOtpInput" type="tel" inputmode="numeric" maxlength="6" autocomplete="one-time-code" name="one-time-code"
          placeholder="6-digit OTP" style="display:none;width:100%;box-sizing:border-box;padding:14px;border-radius:12px;border:1.5px solid #60a5fa;background:#1e3251;color:#fff;font-size:22px;letter-spacing:8px;text-align:center;margin-bottom:10px">
        <button type="button" id="reauthVerifyBtn" onclick="_reauthVerifyOtp()" style="display:none;width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:900;font-size:15px;cursor:pointer;margin-bottom:8px">
          Verify &amp; Save
        </button>
        <button type="button" onclick="_reauthCancel()" style="width:100%;padding:12px;border:1px solid #475569;border-radius:12px;background:transparent;color:#94a3b8;font-weight:700;cursor:pointer">
          Cancel
        </button>
        <div id="reauthErr" style="color:#fca5a5;font-size:12px;margin-top:8px;min-height:16px"></div>
      </div>`;
    document.body.appendChild(ov);
  });
}

async function _reauthSendOtp(mobile10){
  const err = document.getElementById('reauthErr');
  const btn = document.getElementById('reauthSendBtn');
  if(err) err.textContent = '';
  try{
    if(btn){ btn.disabled = true; btn.textContent = '⏳ Sending…'; }
    // Sign out anonymous so phone auth can take over
    try{
      if(window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.isAnonymous && window._fbSignOut){
        await window._fbSignOut();
      }
    }catch(e){}
    _reauthConfirm = await _fbSendPhoneOtp('+91'+mobile10, 'reauthRecaptcha', '_fbRecaptchaReauth');
    const inp = document.getElementById('reauthOtpInput');
    const vbtn = document.getElementById('reauthVerifyBtn');
    if(inp){ inp.style.display = 'block'; inp.focus(); }
    if(vbtn) vbtn.style.display = 'block';
    if(btn){ btn.textContent = 'OTP फिर भेजें'; btn.disabled = false; }
    toast('✅ OTP भेज दिया');
    if(typeof _startWebOtpListen === 'function'){
      _startWebOtpListen('reauthOtpInput', code=>{
        if(code && code.length===6) setTimeout(()=>_reauthVerifyOtp(), 200);
      });
    }
  }catch(e){
    if(err) err.textContent = '❌ '+(_fbOtpErrorMessage?_fbOtpErrorMessage(e):(e.message||e));
    if(btn){ btn.disabled = false; btn.textContent = 'OTP भेजें'; }
  }
}

async function _reauthVerifyOtp(){
  const err = document.getElementById('reauthErr');
  const code = (document.getElementById('reauthOtpInput')?.value||'').replace(/\D/g,'').slice(0,6);
  if(code.length!==6){ if(err) err.textContent='⚠️ 6 अंक OTP डालें'; return; }
  if(!_reauthConfirm){ if(err) err.textContent='⚠️ पहले OTP भेजें'; return; }
  try{
    if(err) err.textContent = '⏳ Verify…';
    await _fbVerifyPhoneOtp(_reauthConfirm, code);
    _reauthConfirm = null;
    try{
      sessionStorage.setItem('mp_write_auth','1');
      localStorage.setItem('mp_write_auth_at', String(Date.now()));
      const u = window._fbAuth && window._fbAuth.currentUser;
      if(u && u.phoneNumber){
        localStorage.setItem('mp_device_phone', u.phoneNumber);
        localStorage.setItem('mp_device_uid', u.uid);
        localStorage.setItem('mp_device_verified_at', String(Date.now()));
      }
    }catch(e){}
    try{ await _syncAuthRoleNodes(); }catch(e){}
    toast('✅ Phone verified — this device cached 90 days (OTP only if browser data cleared)');
    const ov = document.getElementById('quickReauthOverlay');
    if(ov) ov.remove();
    const r = _reauthResolve;
    _reauthResolve = null;
    if(r) r(true);
  }catch(e){
    if(err) err.textContent = '❌ '+(_fbOtpErrorMessage?_fbOtpErrorMessage(e):(e.message||e));
  }
}

function _reauthCancel(){
  try{ if(typeof _stopWebOtpListen==='function') _stopWebOtpListen(); }catch(e){}
  const ov = document.getElementById('quickReauthOverlay');
  if(ov) ov.remove();
  const r = _reauthResolve;
  _reauthResolve = null;
  if(r) r(false);
}

async function launchApp(){
  // v2.4.5: stamp this device as write-trusted whenever app opens with a session
  try{
    if(SESSION && SESSION.role && getWriteSecurityMode()==='trusted'){
      const m = _normMobileKey(SESSION.mobile||SESSION.uid||'');
      if(m) localStorage.setItem('mp_device_phone', '+91'+m);
      if(!localStorage.getItem('mp_device_verified_at'))
        localStorage.setItem('mp_device_verified_at', String(Date.now()));
      localStorage.setItem('mp_write_auth_at', String(Date.now()));
      sessionStorage.setItem('mp_write_auth','1');
    }
  }catch(e){}

  try{
  warmShiftConfigCache();
  // ── Restore Firebase Auth: WAIT for IndexedDB restore before any anon sign-in ──
  try{
    if(typeof window._fbAuthStateReady === 'function'){
      await window._fbAuthStateReady();
    } else if(window._fbAuth && typeof window._fbAuth.authStateReady === 'function'){
      await window._fbAuth.authStateReady();
    }
    const cu = window._fbAuth && window._fbAuth.currentUser;
    if(cu && cu.phoneNumber){
      try{
        localStorage.setItem('mp_device_phone', cu.phoneNumber);
        localStorage.setItem('mp_device_uid', cu.uid);
      }catch(e){}
      console.log('[launchApp] Phone auth restored for', cu.phoneNumber);
    } else if(window._fbAuth && !cu && SESSION.role){
      // Only anonymous if this device never did phone verify
      let hadPhone = false;
      try{ hadPhone = !!(localStorage.getItem('mp_device_phone')); }catch(e){}
      if(!hadPhone){
        await window._fbSignInAnon();
      } else {
        console.warn('[launchApp] Waiting for phone auth restore — skip anon');
      }
    } else if(cu && cu.isAnonymous && localStorage.getItem('mp_device_phone')){
      // Had phone before but lost — will prompt OTP on next write only (do NOT stay on anon forever)
      console.warn('[launchApp] Phone session lost; device flag still set');
    }
  }catch(e){ console.warn('[launchApp] Firebase auth restore:', e.message); }
  // Sync managers/{uid} or admins/{uid} so RTDB rules allow schedule writes
  try{ await _syncAuthRoleNodes(); }catch(e){}

  // ── Reset all overlapping screens ──
  const _hide = id => { const el=document.getElementById(id); if(el){ el.style.display='none'; el.classList && el.classList.remove('show'); }};
  _hide('loginScreen');
  _hide('loadingScreen');
  _hide('fingerprintScreen');
  _hide('hardExpiryWall');
  // Remove dynamically created expiry wall
  const ew = document.getElementById('hardExpiryWall');
  if(ew) ew.remove();
  // Close any open modal/overlay
  try{ closeModal(); }catch(e){}

  // ── Show app immediately — do this FIRST before anything else ──
  const _mh = document.getElementById('mainHdr');
  const _mc = document.getElementById('mainContent');
  if(_mh){ _mh.style.display='block'; _mh.style.visibility='visible'; _mh.style.opacity='1'; }
  if(_mc){ _mc.style.display='block'; _mc.style.visibility='visible'; _mc.style.opacity='1'; }
  try{
    const login=document.getElementById('loginScreen');
    if(login){ login.style.display='none'; login.classList.remove('show'); }
    const ls=document.getElementById('loadingScreen');
    if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
    const fp=document.getElementById('fingerprintScreen');
    if(fp){ fp.style.display='none'; fp.classList.remove('show'); }
  }catch(e){}

  // ── Sync header height immediately so sidebar + sticky elements position correctly ──
  try{ syncStickyTop(); }catch(e){}

  try{ updateHeaderProfile(); }catch(e){
    const ini=(SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const userAvEl=document.getElementById('userAv');
    if(userAvEl){
      if(SESSION.photoUrl) userAvEl.innerHTML=`<img src="${SESSION.photoUrl}" alt="">`;
      else { userAvEl.innerHTML=''; userAvEl.textContent=ini; }
    }
  }

  // Hide pending overlay if we successfully entered the app
  try{ const pb=document.getElementById('pendingBox'); if(pb) pb.style.display='none'; }catch(e){}

  const rt=document.getElementById('roleTag');
  if(rt){
  if(isAdmin()){
    rt.textContent='ADMIN';
    rt.className='role-tag admin';
    rt.style.cssText='background:rgba(249,115,22,.2);color:#fb923c;';
  }
  else if(isMgr() || SESSION.role==='manager'){
    rt.textContent='MGR';
    rt.className='role-tag';
    rt.style.cssText='background:rgba(168,85,247,.22);color:#c084fc;';
  }
  else if(isPendingMember()){
    rt.textContent='PEND';
    rt.className='role-tag';
    rt.style.cssText='background:rgba(234,179,8,.2);color:#eab308;';
  }
  else if(SESSION.role==='member' || SESSION.role==='worker'){
    const tp = (typeof myTeamPerms==='function') ? myTeamPerms() : {};
    if(tp.schedule||tp.leave||tp.reports){
      rt.textContent='AUTH';
      rt.className='role-tag';
      rt.style.cssText='background:rgba(168,85,247,.18);color:#c084fc;';
    } else {
      rt.textContent='MEMBER';
      rt.className='role-tag';
      rt.style.cssText='background:rgba(96,165,250,.18);color:#60a5fa;';
    }
  }
  else if(isGuest()){
    rt.textContent='GUEST';
    rt.className='role-tag';
    rt.style.cssText='background:rgba(148,163,184,.18);color:#94a3b8;';
  }
  else {
    rt.textContent='USER';
    rt.className='role-tag user';
    rt.style.cssText='';
  }
  } // end roleTag null-safe
  try{ updateHeaderProfile(); }catch(e){}

  if(isAdmin()){
    document.getElementById('notifBtn').style.display='flex';
    setTimeout(listenAdminNotifications, 800);
    if(typeof Notification !== 'undefined' && Notification.permission==='default'){
      Notification.requestPermission().catch(()=>{});
    }
    renderCompanySwitcher();
  } else {
    const csRow=document.getElementById('companySwitchRow');
    if(csRow) csRow.style.display='none';
  }
  // ── Show notification bell for ALL logged-in users ──
  if(!isGuest()){
    document.getElementById('notifBtn').style.display='flex';
    setTimeout(listenUserShiftNotifications, 1000);
  }
  // Schedule admin row — show for anyone who can edit schedule (admin + manager)
  _updateSchedAdminVisibility();
  // Imp Info button — admin and manager
  const iiBtn = document.getElementById('impInfoBtn');
  if(iiBtn) iiBtn.style.display = (!isGuest() && SESSION && SESSION.role) ? 'inline-flex' : 'none';
  if(isAdmin()) document.getElementById('smsSettingsBtn').style.display='none'; /* moved to profile */
  // OD Records chip — only Admin/Manager can see all OD records
  const odChip = document.getElementById('odChip');
  if(odChip) odChip.style.display = isAdminOrMgr() ? 'flex' : 'none';



  // FIX: await buildNav so nav exists before goTab/renderAll is called
  try { await buildNav(); } catch(e){ console.warn('buildNav error:',e); }
  // Re-sync header height after nav is built (sidebar depends on accurate --hdr-height)
  try{ syncStickyTop(); }catch(e){}
  goTab(_currentTab||'home'); // buildNav() already set _currentTab to the correct role-based landing tab
  renderAll();
  updateSyncTime();
  setTimeout(()=>{ try{syncStickyTop();}catch(e){} }, 1200);

  // Check 45-day expiry for workers (async Firebase check)
  // Skip for admin, guest, and Manager role — they never expire
  if(!isAdmin() && !isGuest() && !isMgr()){
    checkUserExpiry().then(expiry => {
      if(!expiry.valid){
        showHardExpiry();
      } else if(expiry.daysLeft <= 10){
        setTimeout(()=>{ toast('⏳ App access ' + expiry.daysLeft + ' दिनों में expire होगी!'); }, 800);
      }
    }).catch(()=>{}); // swallow — never black screen due to expiry check failure
  }

  }catch(launchErr){
    // Safety net — if launchApp throws, ensure app is still visible
    console.error('[launchApp] error:', launchErr);
    try{ document.getElementById('mainHdr').style.display='block'; }catch(e){}
    try{ document.getElementById('mainContent').style.display='block'; }catch(e){}
    try{ goTab('home'); }catch(e){}
    try{ renderAll(); }catch(e){}
  }
}

async function buildNav(){
  // ── ALL POSSIBLE TABS (master list) ──
  const ALL_TABS = [
    {id:'home',      ico:'🏠', lbl:'होम',       lblEn:'Home',      roles:['worker','guest','manager','supervisor','member','pending_member']},
    {id:'myshift',   ico:'🗓️', lbl:'मेरी शिफ्ट', lblEn:'My Shift',  roles:['worker','manager','supervisor','member','pending_member']},
    {id:'schedule',  ico:'📅', lbl:'शेड्यूल',   lblEn:'Schedule',  roles:['worker','manager','supervisor','member']},
    {id:'leave',     ico:'🏖️', lbl:'अवकाश',    lblEn:'Leave',     roles:['worker','manager','member']},
    {id:'reports',   ico:'📋', lbl:'रिपोर्ट',   lblEn:'Reports',   roles:['worker','manager','supervisor','member']},
    {id:'todo',      ico:'✅', lbl:'कार्य सूची',  lblEn:'To-Do',     roles:['guest','worker','manager','supervisor','member','pending_member']},
    {id:'pending',   ico:'⏳', lbl:'पेंडिंग',   lblEn:'Pending',   roles:['admin','manager']},
    {id:'team',      ico:'👥', lbl:'टीम',        lblEn:'Team',      roles:['admin','manager']},
  ];

  // ── DYNAMIC GUEST TAB VISIBILITY (admin-controlled via Firebase) ──
  let guestVisibility = {};
  try {
    const gv = await fbGet('settings/guestTabs');
    if(gv) guestVisibility = gv;
  } catch(e){}

  // Determine effective role for nav
  // Pending Team Member: only Home (own shift) + To-Do (+ Learn header always on)
  const effectiveRole = isAdmin() ? 'admin'
    : isMgr() ? 'manager'
    : isPendingMember() ? 'pending_member'
    : (SESSION.role==='member') ? 'member'
    : isSupervisor() ? 'supervisor'
    : isGuest() ? 'guest'
    : 'worker';
  let tabs;
  if(effectiveRole === 'admin'){
    // Admin: no Reports tab
    tabs = ALL_TABS.filter(t => (t.roles.includes('admin') || t.roles.includes('manager') || t.roles.includes('worker')) && t.id!=='reports');
    const seen=new Set();
    tabs = tabs.filter(t => { if(seen.has(t.id)) return false; seen.add(t.id); return true; });
  } else if(effectiveRole === 'manager'){
    tabs = ALL_TABS.filter(t => t.roles.includes('manager'));
  } else if(effectiveRole === 'pending_member'){
    tabs = ALL_TABS.filter(t => t.roles.includes('pending_member')); // home + todo only
  } else if(effectiveRole === 'member'){
    tabs = ALL_TABS.filter(t => t.roles.includes('member'));
    try{
      if(myTeamPerms().pending || myTeamPerms().leave){
        if(!tabs.some(t=>t.id==='pending'))
          tabs.push({id:'pending', ico:'⏳', lbl:'पेंडिंग', lblEn:'Pending', roles:['member']});
      }
    }catch(e){}
  } else if(effectiveRole === 'supervisor'){
    tabs = ALL_TABS.filter(t => t.roles.includes('supervisor'));
  } else if(effectiveRole === 'worker'){
    tabs = ALL_TABS.filter(t => t.roles.includes('worker'));
  } else {
    // Guest: show tabs admin has enabled + always show todo
    tabs = ALL_TABS.filter(t => {
      if(t.id === 'todo') return true;
      if(!t.roles.includes('guest') && !guestVisibility[t.id]) return false;
      if(t.roles.includes('guest')) return true;
      return guestVisibility[t.id] === true;
    });
  }

  if(!tabs || !tabs.length){
    tabs = [{id:'home', ico:'🏠', lbl:'होम', lblEn:'Home', roles:['worker']}];
  }
  const firstTab = (effectiveRole==='admin' && tabs.some(t=>t.id==='pending')) ? 'pending' : (tabs[0]&&tabs[0].id) || 'home';
  _currentTab = firstTab;

  // Hide sync row for guest users (irrelevant for guests)
  const learnBar = document.querySelector('.learn-hdr-bar');
  if(learnBar) learnBar.style.display = ''; // Always visible for all roles
  const syncRow = document.getElementById('syncRow');
  if(syncRow) syncRow.style.display = isGuest() ? 'none' : '';

  // Prefer primary tabs; overflow into More sheet (max 5 bottom items)
  const PRIMARY_ORDER = ['home','myshift','schedule','leave','pending','team','todo','reports'];
  tabs = tabs.slice().sort((a,b)=>PRIMARY_ORDER.indexOf(a.id)-PRIMARY_ORDER.indexOf(b.id));
  const maxPrimary = 4;
  const primaryTabs = tabs.length <= 5 ? tabs : tabs.slice(0, maxPrimary);
  const moreTabs = tabs.length <= 5 ? [] : tabs.slice(maxPrimary);
  window._navMoreTabs = moreTabs;

  const _nbHtml = (t, on)=>{
    const label = (typeof mlT === 'function') ? mlT(t.lbl, (typeof _lang!=='undefined'?_lang:'hi')) : (_lang!=='hi' ? (t.lblEn||t.lbl) : t.lbl);
    return `<button class="nb${on?' on':''}" id="nb-${t.id}" onclick="goTab('${t.id}')" aria-label="${label}">
      <span class="nb-ico">${t.ico}</span><span style="font-size:12px;font-weight:800">${label}</span>
      ${t.id==='pending'?'<span class="nb-badge" id="pendingBadge" style="display:none">0</span>':''}
      ${t.id==='todo'?'<span class="nb-badge" id="todoBadge" style="display:none">0</span>':''}
    </button>`;
  };
  let navHtml = primaryTabs.map(t=>_nbHtml(t, t.id===firstTab)).join('');
  if(moreTabs.length){
    const moreOn = moreTabs.some(t=>t.id===firstTab);
    navHtml += `<button class="nb${moreOn?' on':''}" id="nb-more" onclick="openNavMoreSheet()" aria-label="More">
      <span class="nb-ico">☰</span><span style="font-size:12px;font-weight:800">${(typeof mlT==='function')?mlT('और',(typeof _lang!=='undefined'?_lang:'hi')):(L('और','More'))}</span>
    </button>`;
  }
  document.getElementById('mainNav').innerHTML = navHtml;
  // Ensure more sheet host exists
  if(!document.getElementById('navMoreSheet')){
    const sheet = document.createElement('div');
    sheet.id = 'navMoreSheet';
    sheet.className = 'nav-more-sheet';
    sheet.onclick = (e)=>{ if(e.target===sheet) closeNavMoreSheet(); };
    sheet.innerHTML = `<div class="nav-more-panel" onclick="event.stopPropagation()">
      <div class="nav-more-handle"></div>
      <div style="font-weight:900;font-size:16px;margin-bottom:12px;color:var(--text)">More</div>
      <div class="nav-more-grid" id="navMoreGrid"></div>
    </div>`;
    document.body.appendChild(sheet);
  }

  // ── PC Sidebar: mirror the same tabs with sidebar button style ──
  const sidebar = document.getElementById('pcSidebar');
  if(sidebar){
    const divider = document.getElementById('pcSidebar-divider');
    const footer  = document.getElementById('pcSidebar-footer');
    // Remove old buttons (keep divider + footer)
    [...sidebar.querySelectorAll('.pc-nav-btn')].forEach(b=>b.remove());
    // Insert before divider
    tabs.forEach((t,i)=>{
      const btn = document.createElement('button');
      btn.className = 'pc-nav-btn' + (t.id===firstTab?' on':'');
      btn.id = 'pc-nb-'+t.id;
      const sLabel = (typeof mlT === 'function') ? mlT(t.lbl, (typeof _lang!=='undefined'?_lang:'hi')) : (_lang!=='hi' ? (t.lblEn||t.lbl) : t.lbl);
      btn.setAttribute('aria-label', sLabel);
      btn.innerHTML = `<span class="pc-nav-ico">${t.ico}</span><span class="pc-nav-lbl">${sLabel}</span>`
        + (t.id==='pending' ? `<span class="pc-nav-badge" id="pcPendingBadge" style="display:none">0</span>` : '')
        + (t.id==='todo'    ? `<span class="pc-nav-badge" id="pcTodoBadge" style="display:none">0</span>` : '');
      btn.onclick = ()=>goTab(t.id);
      sidebar.insertBefore(btn, divider);
    });
  }

  // Guest - show welcome banner immediately (no setTimeout flash)
  if(isGuest()){
    const mc = document.getElementById('mainContent');
    const banner = document.createElement('div');
    banner.id = 'guestWelcomeBanner';
    banner.innerHTML = `<div style="background:linear-gradient(135deg,rgba(168,85,247,.15),rgba(56,189,248,.1));border:1px solid rgba(168,85,247,.3);border-radius:14px;padding:14px;margin:0 0 14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:28px">👤</span>
      <div>
        <div style="font-size:14px;font-weight:800;color:#fff">Guest Access</div>
        <div style="font-size:12px;color:var(--muted2)">✅ To-Do देखें · 📌 Instructions पढ़ें · 🎓 Learn</div>
      </div>
      <button onclick="openLearnScreen()" style="margin-left:auto;padding:8px 14px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer">🎓 Learn</button>
    </div>`;
    const tab = document.getElementById('tab-instructions');
    if(tab && tab.firstChild) tab.insertBefore(banner.firstChild, tab.firstChild);
  }
}

// ── PROPER LOGOUT — clears ALL storage including IndexedDB ──
function doLogout(){
  // ── 1. Show instant visual feedback ──
  try{
    const logoutBtn = document.querySelector('.profile-action[onclick*="doLogout"]');
    if(logoutBtn){ logoutBtn.style.opacity='.5'; logoutBtn.style.pointerEvents='none'; logoutBtn.querySelector('.pa-label').textContent='Logout हो रहा है...'; }
    toast('🚪 Logout हो रहा है...');
  }catch(e){}

  // ── 2. Clear ALL session stores synchronously — do this FIRST ──
  try{ localStorage.removeItem('mp_session'); }catch(e){}
  try{ localStorage.removeItem('fp_registered'); }catch(e){}
  try{ localStorage.removeItem('mp_int_ok'); }catch(e){}
  try{ localStorage.removeItem('mp_device_phone'); }catch(e){}
  try{ localStorage.removeItem('mp_device_uid'); }catch(e){}
  try{ localStorage.removeItem('mp_device_verified_at'); }catch(e){}
  try{ localStorage.removeItem('mp_write_auth_at'); }catch(e){}
  try{ sessionStorage.removeItem('mp_session_bak'); }catch(e){}
  try{ sessionStorage.removeItem('mp_write_auth'); }catch(e){}
  try{ sessionStorage.removeItem('pwa_banner_shown'); }catch(e){}
  try{ sessionStorage.removeItem('expiry_warned'); }catch(e){}
  document.cookie = 'mp_sess=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';

  // ── 3. Reset in-memory session immediately ──
  SESSION = { role:'', name:'', empId:'', empObjId:'', dept:'', deviceId:'' };

  // ── 4. Clear integrity cache ──
  if('caches' in window){ try{ caches.delete(INTEGRITY_CACHE_NAME).catch(()=>{}); }catch(e){} }

  // ── 5. Firebase sign-out FIRST so Phone session is cleared only on Logout ──
  try{ if(window._fbSignOut) window._fbSignOut().catch(()=>{}); }catch(e){}

  // ── 6. Redirect ──
  window.location.href = window.location.pathname + '?logout=' + Date.now();
  try{
    const req = indexedDB.open('mp_db', 1);
    req.onsuccess = e => {
      try{
        const db = e.target.result;
        if(Array.from(db.objectStoreNames).includes('sess')){
          db.transaction('sess','readwrite').objectStore('sess').delete('mp_session');
        }
        db.close();
      }catch(x){}
    };
  }catch(e){}
}

function updateSyncTime(){
  const el=document.getElementById('syncTime');
  if(el) el.textContent=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}

// ════════════════════════════════════════
// SHIFT & MACHINE SETTINGS UI
// ════════════════════════════════════════
let _shiftDraft=null;

async function openShiftSettings(){
  try{ await _loadWaAppLinkSettings(); }catch(e){}

  if(isAdmin() && (!SESSION.viewCompanyId || SESSION.viewCompanyId==='ALL')){
    toast('⚠️ पहले header से एक Company चुनें');
    return;
  }
  toast('⏳ Loading...');
  const cfg=await getShiftConfig();
  _shiftDraft=JSON.parse(JSON.stringify(cfg)); // deep clone for editing
  _renderShiftSettingsModal();
}

function _renderShiftSettingsModal(){
  const d=_shiftDraft;
  // Merge standard D,N,A,B,C — preserve active/times from saved config
  const std = [
    {code:'D', label:'Day Shift', start:'08:00', end:'20:00', active:true},
    {code:'N', label:'Night Shift', start:'20:00', end:'08:00', active:true},
    {code:'A', label:'A Shift', start:'06:00', end:'14:00', active:false},
    {code:'B', label:'B Shift', start:'14:00', end:'22:00', active:false},
    {code:'C', label:'C Shift', start:'22:00', end:'06:00', active:false}
  ];
  const byCode = {};
  (d.shifts||[]).forEach(s=>{ if(s && s.code) byCode[String(s.code).toUpperCase()]=s; });
  // If saved config only had 2 or 3 codes, mark those active and others inactive
  const hadAnyActive = (d.shifts||[]).some(s=>s && s.active===true);
  const savedCodes = new Set(Object.keys(byCode));
  d.shifts = std.map(s=>{
    const prev = byCode[s.code];
    let active = s.active;
    if(prev){
      if(prev.active===true || prev.active===false) active = !!prev.active;
      else if(!hadAnyActive && savedCodes.size) active = savedCodes.has(s.code); // legacy: codes present = active
    }
    return {
      code: s.code,
      label: (prev && prev.label) || s.label,
      start: (prev && prev.start) || s.start,
      end: (prev && prev.end) || s.end,
      active
    };
  });
  if(d.minAll==null) d.minAll = 4;
  if(d.minMet==null) d.minMet = 5;
  if(d.minSlit==null) d.minSlit = 3;
  if(d.minSup==null) d.minSup = 2;
  if(!d.minBySec || typeof d.minBySec !== 'object') d.minBySec = {};
  if(!d.minByField || typeof d.minByField !== 'object') d.minByField = { section:{}, machine:{}, responsibility:{} };
  ['section','machine','responsibility'].forEach(k=>{ if(!d.minByField[k]) d.minByField[k]={}; });
  // Ensure each machine has an entry (default from group min) — legacy
  (d.metallisers||[]).forEach(m=>{ if(d.minBySec[m]==null) d.minBySec[m]=d.minMet; });
  (d.slitters||[]).forEach(m=>{ if(d.minBySec[m]==null) d.minBySec[m]=d.minSlit; });
    // Seed type-wise WA templates from defaults if missing
  const _d0 = _defaultShiftConfig();
  if(!d.waShiftTemplate) d.waShiftTemplate = _d0.waShiftTemplate;
  if(!d.waLeaveTemplate) d.waLeaveTemplate = _d0.waLeaveTemplate;
  if(!d.waAbsentTemplate) d.waAbsentTemplate = _d0.waAbsentTemplate;
  if(!d.waGPTemplate) d.waGPTemplate = _d0.waGPTemplate;
  if(!d.waHolidayTemplate) d.waHolidayTemplate = _d0.waHolidayTemplate;
  if(!d.waCOffTemplate) d.waCOffTemplate = _d0.waCOffTemplate;
  if(d.gpMaxPerMonth==null) d.gpMaxPerMonth = 2;
  if(d.waMemberLeaveToMgrEnabled==null) d.waMemberLeaveToMgrEnabled = true;
  if(d.waMemberShiftToMgrEnabled==null) d.waMemberShiftToMgrEnabled = true;
  if(!d.waMemberLeaveToMgrTemplate) d.waMemberLeaveToMgrTemplate = _d0.waMemberLeaveToMgrTemplate;
  if(!d.waMemberShiftToMgrTemplate) d.waMemberShiftToMgrTemplate = _d0.waMemberShiftToMgrTemplate;
  if(d.waNotifyOnSave==null) d.waNotifyOnSave = true;
  if(d.waShiftEnabled==null) d.waShiftEnabled = true;
  if(d.waLeaveEnabled==null) d.waLeaveEnabled = true;
  if(d.waAbsentEnabled==null) d.waAbsentEnabled = true;
  if(d.waGPEnabled==null) d.waGPEnabled = true;
  if(d.waHolidayEnabled==null) d.waHolidayEnabled = true;
  if(d.waCOffEnabled==null) d.waCOffEnabled = true;
d.shiftCount = d.shifts.filter(s=>s.active).length;
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">⚙️ ${L('शिफ्ट व मिन स्टाफ़','Shift & Min Staff')}</div>
  <div style="font-size:12px;color:#94a3b8;margin-bottom:14px">
    ${isAdmin()?'Company: <b style="color:var(--text)">'+(SESSION.viewCompanyId||'').toUpperCase()+'</b>':'For your own team'}
  </div>

  <div class="modal-scroll-body">
  <div style="font-size:12px;font-weight:800;color:#f97316;margin:4px 0 6px">⏰ Shifts — for Auto Schedule</div>
  <div style="font-size:11px;color:#64748b;margin-bottom:10px;line-height:1.5">
    ✅ टिक = <b>Auto बनाएं</b> में ये shifts rotate होंगी (जैसे सिर्फ D+N, या सिर्फ A+B+C)।<br>
    सभी codes (D/N/A/B/C) schedule पर manually select हो सकते हैं — timing यहाँ से आती है।
  </div>
  <div id="ss_shiftTimings">${_renderShiftTimingRows()}</div>
  <div style="font-size:11px;color:#64748b;margin:8px 0 14px;line-height:1.45">
    ✅ Ticked shifts only → legend, daily counts, Auto Schedule, and shift picker.<br>
    Unticked codes are hidden everywhere on Schedule.
  </div>

  <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:8px 0 6px">📉 Minimum Staff — from your Team Excel</div>
  <div style="font-size:11px;color:#64748b;margin-bottom:10px;line-height:1.5">
    Schedule red / ⚠️ uses <b>these values</b> when headcount is low.<br>
    From <b>Section / Machine / Responsibility</b> on Team Excel. Empty → upload team Excel first.
  </div>
  <div style="margin-bottom:12px;max-width:160px">
    <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Default (All filter)</div>
    <input type="number" min="0" max="50" value="${d.minAll!=null?d.minAll:4}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" oninput="_shiftDraft.minAll=Number(this.value)||0">
  </div>
  <div style="font-size:11px;font-weight:800;color:#f97316;margin:8px 0 6px">Sections</div>
  <div id="ss_minSections" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('section')}</div>
  <div style="font-size:11px;font-weight:800;color:#38bdf8;margin:8px 0 6px">Machines</div>
  <div id="ss_minMachines" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('machine')}</div>
  <div style="font-size:11px;font-weight:800;color:#a78bfa;margin:8px 0 6px">Responsibility</div>
  <div id="ss_minResp" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('responsibility')}</div>

  <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border2)">
    <div style="font-size:13px;font-weight:900;color:#25D366;margin-bottom:6px">📲 WhatsApp templates (your team)</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:12px;line-height:1.45">
      ${L('अपनी team के लिए messages customise करें। App notification हमेशा चालू रहती है। Placeholders message भेजते समय अपने आप भर जाते हैं।','Customise messages for your team. In-app notifications always stay on. Placeholders are replaced automatically when the message is sent.')}
    </div>

    <!-- ══ Member → Manager ══ -->
    <div style="font-size:12px;font-weight:800;color:#25D366;margin:4px 0 8px">📩 Member → Manager</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25)">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text)">🏖️ Leave request → Manager</div>
        <div style="font-size:11px;color:var(--muted2)">${L('Member leave Save → आपको WhatsApp','Member Save leave → WhatsApp to you')}</div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#25D366">
        <input type="checkbox" id="ss_waMemLeaveOn" ${d.waMemberLeaveToMgrEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Leave request WhatsApp ON"> ON
      </label>
    </div>
    <textarea id="ss_waMemLeaveTpl" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Leave request template">${(d.waMemberLeaveToMgrTemplate||_d0.waMemberLeaveToMgrTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:12px">{name} {dates} {date} {leaveType} {reason} {days}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25)">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text)">📅 Shift change → Manager</div>
        <div style="font-size:11px;color:var(--muted2)">${L('Member shift request → आपको WhatsApp','Member requests shift change → WhatsApp to you')}</div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#25D366">
        <input type="checkbox" id="ss_waMemShiftOn" ${d.waMemberShiftToMgrEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Shift change WhatsApp ON"> ON
      </label>
    </div>
    <textarea id="ss_waMemShiftTpl" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Shift change request template">${(d.waMemberShiftToMgrTemplate||_d0.waMemberShiftToMgrTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:14px">{name} {date} {currentShift} {newShift}</div>

    <!-- ══ Manager → Team (schedule save) ══ -->
    <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:8px 0 8px">📢 Manager → Team (Schedule Save)</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px;line-height:1.45">
      ${L('जब आप shift बदलकर Save करते हैं, members को WhatsApp जा सकता है। Message type mark किए गए code पर निर्भर (L / Ab / GP / H / C-Off / सामान्य shift)।','When you change shifts and Save, each member can get WhatsApp. Message type depends on what you marked (L / Ab / GP / H / C-Off / general shift).')}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.25)">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text)">📢 Notify team on Save</div>
        <div style="font-size:11px;color:var(--muted2)">${L('सभी Manager→Team WhatsApp का master switch','Master switch for all Manager→Team WhatsApp')}</div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8">
        <input type="checkbox" id="ss_waNotifyOnSave" ${d.waNotifyOnSave!==false?'checked':''} style="width:18px;height:18px" aria-label="Notify team on schedule save"> ON
      </label>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🔔 General shift change</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waShiftOn" ${d.waShiftEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply general shift template"> ON
      </label>
    </div>
    <textarea id="ss_waTemplate" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="General shift change template">${(d.waShiftTemplate||_d0.waShiftTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {changes} {manager} {date}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🏖️ Leave (L)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waLeaveOn" ${d.waLeaveEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply leave template"> ON
      </label>
    </div>
    <textarea id="ss_waLeave" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Leave template">${(d.waLeaveTemplate||_d0.waLeaveTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {dates} {date} {manager}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">⚠️ Absent (Ab)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waAbsentOn" ${d.waAbsentEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply absent template"> ON
      </label>
    </div>
    <textarea id="ss_waAbsent" rows="6" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Absent template">${(d.waAbsentTemplate||_d0.waAbsentTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {dates} {date} {manager}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🪪 Gate Pass (GP)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waGPOn" ${d.waGPEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply Gate Pass template"> ON
      </label>
    </div>
    <textarea id="ss_waGP" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Gate Pass template">${(d.waGPTemplate||_d0.waGPTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:6px">{name} {dates} {date} {manager} {gpCount} {gpMax}</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;max-width:200px">
      <div style="font-size:11px;color:var(--muted2);white-space:nowrap">${L('Max GP / महीना','Max GP / month')}</div>
      <input type="number" id="ss_gpMax" min="1" max="31" value="${d.gpMaxPerMonth!=null?d.gpMaxPerMonth:(_d0.gpMaxPerMonth||2)}" style="width:72px;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" aria-label="Max Gate Pass per month">
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🎉 Holiday (H)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waHolidayOn" ${d.waHolidayEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply holiday template"> ON
      </label>
    </div>
    <textarea id="ss_waHoliday" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Holiday template">${(d.waHolidayTemplate||_d0.waHolidayTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {dates} {date} {manager}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🔄 Comp Off (C/O)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waCOffOn" ${d.waCOffEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply Comp Off template"> ON
      </label>
    </div>
    <textarea id="ss_waCOff" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Comp Off template">${(d.waCOffTemplate||_d0.waCOffTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:8px">{name} {date} {manager} {coffDate} {reason}</div>
  </div>

  </div>
  <div class="modal-sticky-actions">
    <button class="submit-btn" onclick="_saveShiftSettings()" aria-label="Save shift settings">✅ Save करें</button>
    <button class="cancel-btn" onclick="closeModal()" aria-label="Cancel">रद्द करें</button>
  </div>`);
}

function _renderShiftTimingRows(){
  return _shiftDraft.shifts.map((s,i)=>`
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;padding:8px;border-radius:10px;border:1px solid var(--border);background:${s.active!==false?'rgba(34,197,94,.06)':'var(--card2)'}">
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0" title="On = Auto Schedule + legend + counts + shift picker">
        <input type="checkbox" ${s.active!==false?'checked':''} style="width:16px;height:16px;accent-color:#22c55e"
          onchange="_shiftDraft.shifts[${i}].active=this.checked;document.getElementById('ss_shiftTimings').innerHTML=_renderShiftTimingRows()">
        <span style="width:28px;height:24px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;font-family:'Barlow Condensed',sans-serif"
          class="shc ${cellClass(s.code)}">${s.code}</span>
      </label>
      <input type="text" value="${s.label}" placeholder="नाम" style="flex:1;min-width:60px;padding:7px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px" oninput="_shiftDraft.shifts[${i}].label=this.value">
      <input type="time" value="${s.start}" style="padding:7px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px" oninput="_shiftDraft.shifts[${i}].start=this.value">
      <span style="color:#64748b;font-size:11px">to</span>
      <input type="time" value="${s.end}" style="padding:7px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px" oninput="_shiftDraft.shifts[${i}].end=this.value">
    </div>`).join('');
}

function _renderMinBySecRows(){
  if(!_shiftDraft.minBySec) _shiftDraft.minBySec = {};
  const machines = [...(_shiftDraft.metallisers||[]), ...(_shiftDraft.slitters||[])];
  // unique preserve order
  const seen = new Set();
  const list = [];
  machines.forEach(m=>{ const k=String(m||'').trim(); if(k && !seen.has(k)){ seen.add(k); list.push(k); } });
  if(!list.length){
    return `<div style="grid-column:1/-1;font-size:11px;color:#94a3b8">Add machines below — min fields will appear here.</div>`;
  }
  return list.map(m=>{
    const val = (_shiftDraft.minBySec[m]!=null) ? _shiftDraft.minBySec[m] : 0;
    return `<div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">${m}</div>
      <input type="number" min="0" max="50" value="${val}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center"
        oninput="if(!_shiftDraft.minBySec)_shiftDraft.minBySec={};_shiftDraft.minBySec['${m.replace(/'/g,"\'")}']=Number(this.value)||0">
    </div>`;
  }).join('');
}

function _renderDynamicMinRows(kind){
  if(!_shiftDraft.minByField || typeof _shiftDraft.minByField!=='object') _shiftDraft.minByField={};
  if(!_shiftDraft.minByField[kind]) _shiftDraft.minByField[kind]={};
  const vals = (typeof _teamFieldValues==='function') ? _teamFieldValues(kind) : [];
  if(!vals.length){
    return '<div style="grid-column:1/-1;font-size:11px;color:#64748b;padding:8px">No values yet — Team Excel upload करें</div>';
  }
  return vals.map(v=>{
    const cur = _shiftDraft.minByField[kind][v];
    const n = (cur!=null)?cur:(_shiftDraft.minAll!=null?_shiftDraft.minAll:4);
    const esc = String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    const keyEsc = String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+esc+'">'+esc+'</div>'+
      '<input type="number" min="0" max="50" value="'+n+'" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" '+
      'oninput="if(!_shiftDraft.minByField) _shiftDraft.minByField={}; if(!_shiftDraft.minByField.'+kind+') _shiftDraft.minByField.'+kind+'={}; _shiftDraft.minByField.'+kind+'[\''+keyEsc+'\']=Number(this.value)||0"></div>';
  }).join('');
}

function _renderMachineRows(field){
  return _shiftDraft[field].map((m,i)=>`
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <input type="text" value="${m}" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px" oninput="_shiftDraft.${field}[${i}]=this.value">
      <button onclick="_removeMachine('${field}',${i})" style="width:32px;height:32px;border-radius:8px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.08);color:#f43f5e;font-size:14px;cursor:pointer">✕</button>
    </div>`).join('');
}

function _onShiftCountChange(val){
  // Legacy no-op: all managers always have D,N,A,B,C; only times are edited in profile settings
  if(document.getElementById('ss_shiftTimings')){
    document.getElementById('ss_shiftTimings').innerHTML=_renderShiftTimingRows();
  }
}

function _addMachine(field){
  const prefix=field==='metallisers'?'Metalliser-':'Slitter-';
  const name = prefix+(_shiftDraft[field].length+1);
  _shiftDraft[field].push(name);
  if(!_shiftDraft.minBySec) _shiftDraft.minBySec = {};
  if(_shiftDraft.minBySec[name]==null){
    _shiftDraft.minBySec[name] = field==='metallisers' ? (Number(_shiftDraft.minMet)||0) : (Number(_shiftDraft.minSlit)||0);
  }
  document.getElementById('ss_'+field).innerHTML=_renderMachineRows(field);
  const minEl = document.getElementById('ss_minBySec');
  if(minEl) minEl.innerHTML = _renderMinBySecRows();
}
function _removeMachine(field,idx){
  const removed = _shiftDraft[field][idx];
  _shiftDraft[field].splice(idx,1);
  if(removed && _shiftDraft.minBySec) delete _shiftDraft.minBySec[removed];
  document.getElementById('ss_'+field).innerHTML=_renderMachineRows(field);
  const minEl = document.getElementById('ss_minBySec');
  if(minEl) minEl.innerHTML = _renderMinBySecRows();
}

async function _saveShiftSettings(){
  // v2.4.1: multi-industry — do not require legacy metallisers/slitters lists
  // Min staff comes from Team Excel sections/machines via minByField
  if(!_shiftDraft.metallisers) _shiftDraft.metallisers = [];
  if(!_shiftDraft.slitters) _shiftDraft.slitters = [];
  for(const s of _shiftDraft.shifts){
    if(!s.code||!s.label){ toast('⚠️ सभी Shift की Code और नाम भरें'); return; }
  }
  const activeCount = (_shiftDraft.shifts||[]).filter(s=>s.active!==false).length;
  if(activeCount < 1){ toast('⚠️ Auto के लिए कम से कम 1 shift tick करें (D/N या A/B/C)'); return; }
  _shiftDraft.shiftCount = activeCount;
  _shiftDraft.minAll = Number(_shiftDraft.minAll)||0;
  _shiftDraft.minMet = Number(_shiftDraft.minMet)||0;
  _shiftDraft.minSlit = Number(_shiftDraft.minSlit)||0;
  _shiftDraft.minSup = Number(_shiftDraft.minSup)||0;
  // Derive legacy hide flags from ticks (compat); display uses active only
  const _act = (c)=> (_shiftDraft.shifts||[]).some(s=>String(s.code).toUpperCase()===c && s.active!==false);
  _shiftDraft.hideSummaryDN = !_act('D') && !_act('N');
  _shiftDraft.hideSummaryABC = !_act('A') && !_act('B') && !_act('C');
  try{
    const onSaveEl = document.getElementById('ss_waNotifyOnSave');
    if(onSaveEl) _shiftDraft.waNotifyOnSave = !!onSaveEl.checked;
    else _shiftDraft.waNotifyOnSave = _shiftDraft.waNotifyOnSave !== false;
    const memLeaveOn = document.getElementById('ss_waMemLeaveOn');
    if(memLeaveOn) _shiftDraft.waMemberLeaveToMgrEnabled = !!memLeaveOn.checked;
    const memShiftOn = document.getElementById('ss_waMemShiftOn');
    if(memShiftOn) _shiftDraft.waMemberShiftToMgrEnabled = !!memShiftOn.checked;
    const memLeaveTpl = document.getElementById('ss_waMemLeaveTpl');
    if(memLeaveTpl) _shiftDraft.waMemberLeaveToMgrTemplate = memLeaveTpl.value;
    const memShiftTpl = document.getElementById('ss_waMemShiftTpl');
    if(memShiftTpl) _shiftDraft.waMemberShiftToMgrTemplate = memShiftTpl.value;
    const ta = document.getElementById('ss_waTemplate');
    if(ta) _shiftDraft.waShiftTemplate = ta.value;
    const map = [
      ['ss_waLeave','waLeaveTemplate'],
      ['ss_waAbsent','waAbsentTemplate'],
      ['ss_waGP','waGPTemplate'],
      ['ss_waHoliday','waHolidayTemplate'],
      ['ss_waCOff','waCOffTemplate']
    ];
    for(const [id,key] of map){
      const el = document.getElementById(id);
      if(el) _shiftDraft[key] = el.value;
    }
    const enMap = [
      ['ss_waShiftOn','waShiftEnabled'],
      ['ss_waLeaveOn','waLeaveEnabled'],
      ['ss_waAbsentOn','waAbsentEnabled'],
      ['ss_waGPOn','waGPEnabled'],
      ['ss_waHolidayOn','waHolidayEnabled'],
      ['ss_waCOffOn','waCOffEnabled']
    ];
    for(const [id,key] of enMap){
      const el = document.getElementById(id);
      if(el) _shiftDraft[key] = !!el.checked;
    }
    const gpEl = document.getElementById('ss_gpMax');
    if(gpEl) _shiftDraft.gpMaxPerMonth = Math.max(1, Number(gpEl.value)||2);
  }catch(e){}
  const _def = (typeof getDefaultShiftConfig==='function' ? getDefaultShiftConfig() : _defaultShiftConfig());
  if(!_shiftDraft.waShiftTemplate) _shiftDraft.waShiftTemplate = _def.waShiftTemplate;
  if(!_shiftDraft.waLeaveTemplate) _shiftDraft.waLeaveTemplate = _def.waLeaveTemplate;
  if(!_shiftDraft.waAbsentTemplate) _shiftDraft.waAbsentTemplate = _def.waAbsentTemplate;
  if(!_shiftDraft.waGPTemplate) _shiftDraft.waGPTemplate = _def.waGPTemplate;
  if(!_shiftDraft.waHolidayTemplate) _shiftDraft.waHolidayTemplate = _def.waHolidayTemplate;
  if(!_shiftDraft.waCOffTemplate) _shiftDraft.waCOffTemplate = _def.waCOffTemplate;
  if(!_shiftDraft.gpMaxPerMonth) _shiftDraft.gpMaxPerMonth = 2;
  if(!_shiftDraft.minBySec) _shiftDraft.minBySec = {};
  // Admin-only: persist WA app-link footer settings
  if(typeof isAdmin==='function' && isAdmin()){
    try{
      const onEl = document.getElementById('ss_waAppLinkOn');
      const tEl = document.getElementById('ss_waAppLinkText');
      const uEl = document.getElementById('ss_waAppLinkUrl');
      if(onEl || tEl || uEl){
        const payload = {
          enabled: onEl ? !!onEl.checked : true,
          text: (tEl && tEl.value.trim()) || 'Check Complete Shift',
          url: (uEl && uEl.value.trim()) || ''
        };
        await fbSet('settings/waAppLink', payload);
        _waAppLinkCache = payload;
      }
    }catch(e){ console.warn('[waAppLink] save', e); }
  }
  const ok=await saveShiftConfig(_shiftDraft);
  if(ok){
    closeModal();
    toast(L('✅ शिफ्ट सेटिंग सेव हो गई','✅ Shift settings saved'));
  }
}



// ════════════════════════════════════════
// PROFILE EDIT — name + photo
// ════════════════════════════════════════
/** Round header avatar: photo if set, else initials; role under circle */
function updateHeaderProfile(){
  try{
    const chip = document.querySelector('.user-chip.user-chip-profile') || document.querySelector('.user-chip');
    if(chip && !chip.classList.contains('user-chip-profile')){
      chip.classList.add('user-chip-profile');
    }
    const ini = (SESSION.name||'?').split(/\s+/).filter(Boolean).map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?';
    const userAvEl = document.getElementById('userAv');
    if(userAvEl){
      userAvEl.style.background = 'linear-gradient(135deg,var(--m1,#f97316),var(--s1,#a855f7))';
      const url = SESSION.photoUrl || '';
      if(url){
        userAvEl.innerHTML = '<img src="'+String(url).replace(/"/g,'&quot;')+'" alt="">';
        userAvEl.setAttribute('data-has-photo','1');
      } else {
        userAvEl.innerHTML = '';
        userAvEl.textContent = ini;
        userAvEl.removeAttribute('data-has-photo');
      }
    }
    const hdrName = document.getElementById('userHdrName');
    if(hdrName){
      hdrName.textContent = (SESSION.name||'Guest').split(' ')[0];
      hdrName.classList.add('user-hdr-name-sr');
    }
    // Role label (short, works in all languages)
    const rt = document.getElementById('roleTag');
    if(rt){
      let role = 'USER';
      try{
        if(typeof isAdmin==='function' && isAdmin()) role = 'ADMIN';
        else if(typeof isMgr==='function' && isMgr()) role = 'MGR';
        else if(SESSION.role==='manager') role = 'MGR';
        else if(SESSION.role==='supervisor') role = 'SUP';
        else if(SESSION.role==='member' || SESSION.role==='worker') role = 'MEMBER';
        else if(SESSION.role==='guest') role = 'GUEST';
      }catch(e){}
      rt.textContent = role;
      rt.className = 'role-tag '+(role==='ADMIN'?'admin': role==='MGR'?'admin':'user');
    }
    try{
      const chip = document.querySelector('.user-chip.user-chip-profile');
      if(chip){ chip.style.display='flex'; chip.style.visibility='visible'; chip.style.opacity='1'; }
    }catch(e){}
  }catch(e){ console.warn('[updateHeaderProfile]', e); }
}

let _profilePhotoData = null;


function openEditProfileModal(){
  _profilePhotoData = null;
  const photo = SESSION.photoUrl || '';
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const emp = myEmp() || {};
  const esc = (s)=> String(s==null?'':s).replace(/"/g,'&quot;');
  const toDateInput = (v)=>{
    if(!v) return '';
    const s = String(v).trim();
    if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if(m) return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    const d = new Date(s);
    if(!isNaN(d.getTime())) return d.toISOString().slice(0,10);
    return '';
  };
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">✏️ ${L('मेरी Profile','My Profile')}</div>
    <div class="modal-scroll-body">
    <div style="text-align:center;margin-bottom:16px">
      <div id="profilePhotoPreview" style="width:96px;height:96px;border-radius:50%;margin:0 auto 10px;background:linear-gradient(135deg,#f97316,#a855f7);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff;overflow:hidden;border:3px solid rgba(249,115,22,.4)">
        ${photo?`<img src="${photo}" style="width:100%;height:100%;object-fit:cover">`:(SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2)}
      </div>
      <input type="file" id="profilePhotoInput" accept="image/*" capture="user" style="display:none" onchange="onProfilePhotoPicked(this)">
      <button type="button" class="cancel-btn" style="display:inline-flex;align-items:center;gap:6px;margin:0 4px" onclick="document.getElementById('profilePhotoInput').click()">📷 ${L('फोटो लगाएं','Set photo')}</button>
      ${photo||_profilePhotoData?`<button type="button" class="cancel-btn" style="display:inline-flex;color:#f43f5e;margin:0 4px" onclick="clearProfilePhoto()">🗑️</button>`:''}
    </div>
    <div class="field"><label>${L('नाम','Name')}</label>
      <input class="inp-field" id="profileNameInput" value="${esc(SESSION.name||emp.name||'')}" maxlength="60"></div>
    <div class="field"><label>${L('जन्म तिथि (DOB)','Date of Birth')}</label>
      <input class="inp-field" type="date" id="profileDobInput" value="${esc(toDateInput(emp.dob||''))}"></div>
    <div class="field"><label>${L('जॉइनिंग डेट','Date of Joining')}</label>
      <input class="inp-field" type="date" id="profileDojInput" value="${esc(toDateInput(emp.joiningDate||emp.doj||''))}"></div>
    <div class="field"><label>${L('सैलरी (मासिक)','Salary (monthly)')}</label>
      <input class="inp-field" type="number" id="profileSalaryInput" value="${esc(emp.salary||emp.monthlySalary||'')}" placeholder="₹"></div>
    <div class="field"><label>${L('वीकली ऑफ','Weekly Off')}</label>
      <select class="inp-field" id="profileWoffInput">
        ${[{v:'',l:'—'},{v:'SUN',l:L('रवि (SUN)','Sunday')},{v:'MON',l:L('सोम (MON)','Monday')},{v:'TUE',l:L('मंगल (TUE)','Tuesday')},{v:'WED',l:L('बुध (WED)','Wednesday')},{v:'THU',l:L('गुरु (THU)','Thursday')},{v:'FRI',l:L('शुक्र (FRI)','Friday')},{v:'SAT',l:L('शनि (SAT)','Saturday')}].map(d=>`<option value="${d.v}" ${(emp.woff||'')===d.v?'selected':''}>${d.l}</option>`).join('')}
      </select></div>
    <div class="field"><label>${L('पद','Designation')}</label>
      <input class="inp-field" id="profileDesigInput" value="${esc(emp.designation||'')}" maxlength="40"></div>
    <div class="field"><label>${L('Emp ID','Emp ID')}</label>
      <input class="inp-field" id="profileEmpIdInput" value="${esc(emp.empId||SESSION.empId||'')}" maxlength="20"></div>
    <div class="field"><label>${L('सेक्शन','Section')}</label>
      <input class="inp-field" id="profileSecInput" value="${esc(emp.sec||'')}" maxlength="40" placeholder="from Excel Section"></div>
    <div class="field"><label>${L('मशीन','Machine')}</label>
      <input class="inp-field" id="profileMcInput" value="${esc(emp.mc||emp.machine||'')}" maxlength="40"></div>
    <div class="field"><label>${L('ज़िम्मेदारी','Responsibility')}</label>
      <input class="inp-field" id="profileRespInput" value="${esc(emp.resp||emp.responsibility||'')}" maxlength="40"></div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      ${L('Manager द्वारा भरी जानकारी यहाँ दिखती है। बदलाव पर Manager को notification जाएगी।','Details from Manager are shown here. Changes notify your Manager.')}
    </div>
    </div>
    <div class="modal-sticky-actions">
    <button class="submit-btn" onclick="saveProfileEdits()">💾 ${L('सेव + Manager को सूचित करें','Save & Notify Manager')}</button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>
    </div>`);
}

function onProfilePhotoPicked(input){
  const file = input.files && input.files[0];
  if(!file) return;
  if(file.size > 5*1024*1024){ toast('⚠️ Max 5 MB image'); return; }
  const reader = new FileReader();
  reader.onload = ()=>{
    const dataUrl = reader.result;
    // Downscale for storage
    const img = new Image();
    img.onload = ()=>{
      const max = 512;
      let w = img.width, h = img.height;
      if(w > max || h > max){
        const r = Math.min(max/w, max/h);
        w = Math.round(w*r); h = Math.round(h*r);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      _profilePhotoData = c.toDataURL('image/jpeg', 0.85);
      const prev = document.getElementById('profilePhotoPreview');
      if(prev) prev.innerHTML = `<img src="${_profilePhotoData}" style="width:100%;height:100%;object-fit:cover">`;
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function clearProfilePhoto(){
  _profilePhotoData = '';
  SESSION.photoUrl = '';
  const prev = document.getElementById('profilePhotoPreview');
  if(prev) prev.innerHTML = (SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2);
  toast('Photo cleared — Save to apply');
}

async function saveProfileEdits(){
  const name = (document.getElementById('profileNameInput')?.value||'').trim();
  if(!name){ toast('⚠️ Name required'); return; }
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast('❌ Phone OTP verify करें — फिर Save दबाएँ'); return; }
    }
  }catch(e){ toast('❌ Auth: '+(e.message||e)); return; }

  const dob = (document.getElementById('profileDobInput')?.value||'').trim();
  const doj = (document.getElementById('profileDojInput')?.value||'').trim();
  const salary = (document.getElementById('profileSalaryInput')?.value||'').trim();
  const woff = (document.getElementById('profileWoffInput')?.value||'').trim();
  const desig = (document.getElementById('profileDesigInput')?.value||'').trim();
    const empIdEdit = (document.getElementById('profileEmpIdInput')?.value||'').trim();
    const secEdit = (document.getElementById('profileSecInput')?.value||'').trim();
    const mcEdit = (document.getElementById('profileMcInput')?.value||'').trim();
    const respEdit = (document.getElementById('profileRespInput')?.value||'').trim();
  const btn = document.querySelector('.modal-box .submit-btn, .modal .submit-btn');
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Saving…'; }

  try{
    const empBefore = myEmp() || {};
    let photoUrl = SESSION.photoUrl || '';
    if(_profilePhotoData === ''){
      photoUrl = '';
    } else if(_profilePhotoData){
      const key = _normMobileKey(SESSION.mobile||SESSION.uid||SESSION.empObjId||'user') || ('u_'+Date.now());
      const path = 'profilePhotos/'+key+'/avatar.jpg';
      if(typeof window._fbUploadSelfie === 'function'){
        const url = await window._fbUploadSelfie(_profilePhotoData, path);
        if(url) photoUrl = url;
        else toast('⚠️ Photo upload failed — other fields will still save');
      } else {
        if(_profilePhotoData.length < 200000) photoUrl = _profilePhotoData;
        else toast('⚠️ Storage not ready — try again');
      }
    }

    SESSION.name = name;
    SESSION.photoUrl = photoUrl;
    try{ saveSession(); }catch(e){}

    const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(mob){
      try{
        await fbUpdate('mobileUsers/'+mob, {
          name,
          photoUrl: photoUrl || null,
          dob: dob || null,
          joiningDate: doj || null,
          salary: salary || null,
          monthlySalary: salary ? Number(salary) : null,
          woff: woff || null,
          designation: desig || null,
          profileUpdatedAt: new Date().toISOString()
        });
      }catch(e){
        console.error('mobileUsers profile', e);
        toast('❌ Profile save failed: '+(e.message||e.code||e));
        throw e;
      }
    }
    const empId = SESSION.empObjId || empBefore.id;
    if(empId){
      try{
        await fbUpdate('employees/'+empId, {
          name: name.toUpperCase(),
          photoUrl: photoUrl || null,
          dob: dob || null,
          joiningDate: doj || null,
          salary: salary || null,
          monthlySalary: salary ? Number(salary) : null,
          woff: woff || null,
          designation: desig || null,
          empId: empIdEdit || empBefore.empId || null,
          sec: secEdit || empBefore.sec || null,
          mc: mcEdit || empBefore.mc || null,
          machine: mcEdit || empBefore.machine || null,
          resp: respEdit || empBefore.resp || null,
          responsibility: respEdit || empBefore.responsibility || null
        });
      }catch(e){ console.warn('emp profile', e); }
    }

    const changes = [];
    if((empBefore.name||'') !== name) changes.push('Name');
    if((empBefore.dob||'') !== dob) changes.push('DOB');
    if((empBefore.joiningDate||empBefore.doj||'') !== doj) changes.push('DOJ');
    if(String(empBefore.salary||empBefore.monthlySalary||'') !== String(salary||'')) changes.push('Salary');
    if((empBefore.woff||'') !== woff) changes.push('Weekly Off');
    if((empBefore.designation||'') !== desig) changes.push('Designation');
    if(changes.length){
      const body = name+' updated: '+changes.join(', ');
      const mgrKey = _normMobileKey(SESSION.managerId||'');
      if(mgrKey){
        try{
          await fbPush('userNotifications/'+mgrKey, {
            type:'profile_update', title:'✏️ Profile update — '+name, body,
            mobile: SESSION.mobile||'', name, changes, read:false, at: new Date().toISOString()
          });
        }catch(e){}
      }
      try{
        await fbPush('adminNotifications', {
          type:'profile_update', title:'✏️ Profile update — '+name, body,
          mobile: SESSION.mobile||'', managerId: SESSION.managerId||'', read:false, at: new Date().toISOString()
        });
      }catch(e){}
    }

    try{
      const userAvEl = document.getElementById('userAv');
      if(userAvEl){
        userAvEl.style.background = 'linear-gradient(135deg,var(--m1,#f97316),var(--s1,#a855f7))';
        if(photoUrl){
          userAvEl.innerHTML = `<img src="${photoUrl}" alt="">`;
          userAvEl.setAttribute('data-has-photo','1');
        } else {
          userAvEl.innerHTML = '';
          userAvEl.textContent = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
          userAvEl.removeAttribute('data-has-photo');
        }
      }
      const userNameEl = document.getElementById('userName');
      if(userNameEl) userNameEl.textContent = name;
    }catch(e){}

    closeModal();
    toast(changes.length ? '✅ Profile saved — Manager notified' : '✅ Profile saved');
  }catch(err){
    console.error(err);
    toast('❌ Save failed: '+(err.message||err));
    if(btn){ btn.disabled = false; btn.textContent = '💾 Save'; }
  }
}



/** Default yearly leave quotas (Manager can override in Profile) */
function _defaultLeaveQuotas(){
  return { CL:12, SL:6, EL:15, CO:0, other:5 };
}
async function openLeaveQuotaSettings(){
  if(!isMgr() && !isAdmin()){ toast('❌ Manager only'); return; }
  const key = 'leaveQuotas/'+(myShiftConfigKey()||_normMobileKey(SESSION.mobile)||'default');
  let q = _defaultLeaveQuotas();
  try{ const r = await fbGet(key); if(r) q = {...q, ...r}; }catch(e){}
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📋 Team Leave Quota (Year)</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Members see remaining balance in Profile. Set leave year range below.</div>
    <div class="grid2" style="margin-bottom:12px">
      <div class="field"><label>Year start</label>
        <input class="inp-field" type="date" id="lq_yearStart" value="${q.yearStart||(new Date().getFullYear()+'-01-01')}"></div>
      <div class="field"><label>Year end</label>
        <input class="inp-field" type="date" id="lq_yearEnd" value="${q.yearEnd||(new Date().getFullYear()+'-12-31')}"></div>
    </div>
    <div id="lq_fields">${['CL','SL','EL','CO','other'].map(t=>`
      <div class="field"><label>${t==='CL'?'Casual Leave (CL)':t==='SL'?'Sick Leave (SL)':t==='EL'?'Earned Leave (EL)':t==='CO'?'Comp Off':'Other'}</label>
        <input class="inp-field" type="number" id="lq_${t}" data-lq-key="${t}" value="${q[t]!=null?q[t]:0}" min="0" max="365"></div>`).join('')}
    </div>
    <div class="field"><label>Add custom leave type</label>
      <div style="display:flex;gap:8px">
        <input class="inp-field" id="lq_new_name" placeholder="e.g. Maternity / RH" style="flex:1">
        <input class="inp-field" id="lq_new_days" type="number" min="0" max="365" placeholder="Days" style="width:90px">
      </div>
    </div>
    <button type="button" class="cancel-btn" style="margin-bottom:8px" onclick="_addCustomLeaveQuotaRow()">＋ Add leave type</button>
    <button class="submit-btn" onclick="saveLeaveQuotas()">✅ Save</button>
    <button class="cancel-btn" onclick="closeModal()">Cancel</button>`);
}

function _addCustomLeaveQuotaRow(){
  const name = (document.getElementById('lq_new_name')?.value||'').trim();
  const days = Number(document.getElementById('lq_new_days')?.value)||0;
  if(!name){ toast('⚠️ Leave type name लिखें'); return; }
  const key = name.replace(/[^a-zA-Z0-9_\u0900-\u097F]+/g,'_').slice(0,24);
  const host = document.getElementById('lq_fields');
  if(!host) return;
  if(document.getElementById('lq_'+key)){ toast('⚠️ Already added'); return; }
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = '<label>'+name.replace(/</g,'')+'</label><input class="inp-field" type="number" id="lq_'+key+'" data-lq-key="'+key+'" value="'+days+'" min="0" max="365">';
  host.appendChild(div);
  const n=document.getElementById('lq_new_name'); if(n) n.value='';
  const d=document.getElementById('lq_new_days'); if(d) d.value='';
  toast('✅ Added '+name);
}
async function saveLeaveQuotas(){
  const key = 'leaveQuotas/'+(myShiftConfigKey()||_normMobileKey(SESSION.mobile)||'default');
  const q = {};
  document.querySelectorAll('[data-lq-key]').forEach(el=>{
    const k = el.getAttribute('data-lq-key');
    if(k) q[k] = Number(el.value)||0;
  });
  // fallback fixed keys
  ['CL','SL','EL','CO','other'].forEach(t=>{
    if(q[t]==null) q[t] = Number(document.getElementById('lq_'+t)?.value)||0;
  });
  q.yearStart = (document.getElementById('lq_yearStart')?.value||'').trim() || (new Date().getFullYear()+'-01-01');
  q.yearEnd = (document.getElementById('lq_yearEnd')?.value||'').trim() || (new Date().getFullYear()+'-12-31');
  q.updatedAt = new Date().toISOString();
  try{
    await fbSet(key, q);
    toast('✅ Leave quotas saved');
    closeModal();
  }catch(e){ toast('❌ '+e.message); }
}
async function openLeaveBalanceModal(){
  let q = _defaultLeaveQuotas();
  try{
    const k2 = 'leaveQuotas/'+(myShiftConfigKey()||_normMobileKey(SESSION.managerId||SESSION.mobile)||'default');
    const r = await fbGet(k2);
    if(r) q = {...q, ...r};
  }catch(e){}
  const emp = myEmp();
  const year = new Date().getFullYear();
  const yStart = q.yearStart || (year+'-01-01');
  const yEnd = q.yearEnd || (year+'-12-31');
  const used = { CL:0, SL:0, EL:0, CO:0, other:0 };
  const calL = new Set(); // dates marked L on calendar
  const calCO = new Set();

  // A) Approved leave applications (primary source by type)
  // CO credits (holiday/double-shift earned) increase balance; CO usage decreases it
  let coCredits = 0;
  try{
    (getLeaves()||[]).forEach(l=>{
      if(!emp || !l || l.status!=='approved') return;
      if(l.empId!==emp.id && l.empId!==emp.empId) return;
      const from = l.from||'';
      if(from && (from < yStart || from > yEnd)) return;
      const days = Number(l.days)||1;
      const typeCode = String(l.type||'').toUpperCase();
      const t = String(l.leaveType||l.type||'').toLowerCase();
      if(typeCode==='SL' || /sick|\bsl\b/.test(t)) used.SL += days;
      else if(typeCode==='EL' || /earned|\bel\b|privilege/.test(t)) used.EL += days;
      else if(typeCode==='CO' || /c-?off|comp|\bc\/o\b|\bco\b/.test(t)){
        // credit:true or autoGenerated holiday/double = EARNED (+balance)
        if(l.credit === true || l.autoGenerated === true){
          coCredits += days;
        } else {
          used.CO += days; // employee took C-Off
        }
      }
      else if(typeCode==='CL' || /casual|\bcl\b/.test(t)) used.CL += days;
      else if(typeCode && typeCode!=='L') { used.other += days; }
      else used.other += days;
    });
  }catch(e){}

  // B) Calendar marks — only for dates not already explained by applications
  try{
    if(emp && emp.id){
      for(let m=0;m<12;m++){
        const mk = year+'_'+String(m+1).padStart(2,'0');
        const sched = (typeof getSchedules==='function' ? getSchedules()[mk] : null) || {};
        const row = sched[emp.id] || sched[emp.empId] || {};
        const vals = Array.isArray(row) ? row : [];
        vals.forEach((sh,i)=>{
          const ds = year+'-'+String(m+1).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');
          const sv = String(sh||'');
          if(sv==='L' || /^L[:\-_]/i.test(sv)){
            calL.add(ds);
            const tm = sv.match(/^L[:\-_](.+)$/i);
            if(tm){
              const tc=tm[1].toUpperCase();
              if(tc==='SL') used.SL++;
              else if(tc==='EL') used.EL++;
              else if(tc==='CO') used.CO++;
              else if(tc==='CL') used.CL++;
              else used.other++;
            }
          }
          if(sv==='C/O'||sv==='CO') calCO.add(ds);
        });
      }
      const ov = (typeof getOverrides==='function'?getOverrides():null)||{};
      Object.keys(ov).forEach(k=>{
        if(!k.startsWith(emp.id+'_')) return;
        const d = k.slice(emp.id.length+1);
        if(d<yStart||d>yEnd) return;
        const ovv = String(ov[k]||'');
        if(ovv==='L' || /^L[:\-_]/i.test(ovv)){
          calL.add(d);
          const tm = ovv.match(/^L[:\-_](.+)$/i);
          if(tm){
            const tc = tm[1].toUpperCase();
            if(tc==='SL') used.SL++;
            else if(tc==='EL') used.EL++;
            else if(tc==='CO') used.CO++;
            else if(tc==='CL') used.CL++;
            else used.other++;
          }
        }
        if(ovv==='C/O'||ovv==='CO') calCO.add(d);
      });
    }
  }catch(e){}

  // If no typed CL apps, fall back to unique calendar L days
  if(used.CL===0 && calL.size) used.CL = calL.size;
  // CO used: calendar C/O added in cards section (not here, to avoid double-count with apps)

  const quotaKeys = Object.keys(q).filter(k=>!['updatedAt','updatedBy'].includes(k) && (typeof q[k]==='number' || !isNaN(Number(q[k]))));
  // Calendar C/O days count as USED (reduce balance)
  if(calCO.size) used.CO += calCO.size;

  const cards = quotaKeys.map(k=>{
    const quota = Number(q[k])||0;
    let u = 0;
    let earned = 0;
    if(k==='CL') u = used.CL;
    else if(k==='SL') u = used.SL;
    else if(k==='EL') u = used.EL;
    else if(k==='CO'||k==='C/O'){ u = used.CO; earned = coCredits; }
    else if(k==='other') u = used.other;
    // C-Off balance = quota + earned (holiday duty etc.) − used (took C/O day)
    const left = Math.max(0, quota + earned - u);
    const label = k==='CL'?'Casual Leave (CL)':k==='SL'?'Sick Leave (SL)':k==='EL'?'Earned Leave (EL)':k==='CO'?'Comp Off (C/O)':k;
    const color = k==='SL'?'#0ea5e9':k==='CO'?'#d97706':k==='EL'?'#7c3aed':'#16a34a';
    const sub = (k==='CO'||k==='C/O')
      ? ('Earned +'+earned+' · Used '+u+' · Base quota '+quota)
      : ('Used (approved): '+u);
    return `<div style="background:var(--panel);border-radius:12px;padding:12px;border:1px solid var(--border2)">
      <div style="font-weight:800;color:var(--text)">${label}</div>
      <div style="font-size:22px;font-weight:900;color:${color}">${left} <span style="font-size:12px;color:var(--muted2)">left</span></div>
      <div style="font-size:11px;color:var(--muted2)">${sub}</div>
    </div>`;
  }).join('');

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🏖️ Leave Balance ${year}</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px">Quota from Manager · Used from approved leave applications (calendar only if no apps)</div>
    <div style="display:grid;gap:10px;margin:12px 0">${cards||'<div style="color:var(--muted2)">No quotas — Manager sets Team Leave Quota</div>'}</div>
    <button class="cancel-btn" onclick="closeModal()">Close</button>`);
}

async function openHolidayListSettings(){
  if(!isMgr() && !isAdmin()){ toast('❌ Manager only'); return; }
  const key = 'holidayLists/'+(myShiftConfigKey()||_normMobileKey(SESSION.mobile)||'default');
  let list = [];
  try{ const r = await fbGet(key); if(Array.isArray(r)) list=r; else if(r&&r.dates) list=r.dates; }catch(e){}
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🎉 Planned Holidays</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:10px">One date per line (YYYY-MM-DD). On save, team gets <b>H</b> and earns C-Off eligibility.</div>
    <textarea class="inp-field" id="holidayListTa" rows="8" style="width:100%;font-family:monospace">${list.join('\n')}</textarea>
    <button class="submit-btn" onclick="saveHolidayList()">✅ Save Holidays</button>
    <button class="cancel-btn" onclick="closeModal()">Cancel</button>`);
}


/** Append one device/mobile login event for Admin audit list */
async function _recordLoginEvent(info){
  try{
    info = info || {};
    const now = new Date();
    const mobile = (typeof _normMobileKey==='function')
      ? _normMobileKey(info.mobile || info.phone || '')
      : String(info.mobile||'').replace(/\D/g,'').slice(-10);
    const entry = {
      at: now.toISOString(),
      date: now.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}),
      time: now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true}),
      name: String(info.name || SESSION.name || '—').slice(0,80),
      mobile: mobile || String(info.mobile||'—').slice(0,20),
      company: String(info.company || SESSION.company || '—').slice(0,80),
      role: String(info.role || SESSION.role || '').slice(0,20),
      deviceId: String(info.deviceId || (typeof getDeviceId==='function' ? getDeviceId() : '') || '').slice(0,64),
      deviceName: String(info.deviceName || (typeof _guessDeviceLabel==='function' ? _guessDeviceLabel() : '') || '').slice(0,40),
      method: String(info.method || 'otp').slice(0,30)
    };
    await fbPush('deviceLoginLogs', entry);
  }catch(e){ console.warn('[login log]', e && e.message); }
}

/** Admin: full list of mobile/device logins — Date, Time, Name, Mobile No, Company */
async function openDeviceLoginList(){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  toast('⏳ Loading login list…');
  let logs = {};
  try{ logs = await fbGet('deviceLoginLogs') || {}; }catch(e){ console.warn(e); }
  const rows = Object.entries(logs).map(([k,v])=>({...(v||{}), _key:k}));
  rows.sort((a,b)=>{
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
  // keep UI usable — show latest 300
  const show = rows.slice(0, 300);
  const esc = (typeof escHtml==='function') ? escHtml : (s)=>String(s||'').replace(/</g,'&lt;');
  const tableRows = show.length ? show.map(r=>{
    let date = r.date || '';
    let time = r.time || '';
    if((!date || !time) && r.at){
      try{
        const d = new Date(r.at);
        date = d.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
        time = d.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});
      }catch(e){}
    }
    const mob = r.mobile ? (String(r.mobile).length===10 ? '+91-'+r.mobile : r.mobile) : '—';
    return `<tr>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);white-space:nowrap;font-size:11px">${esc(date||'—')}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);white-space:nowrap;font-size:11px">${esc(time||'—')}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);font-size:12px;font-weight:700;color:var(--text)">${esc(r.name||'—')}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);font-size:11px;font-family:monospace">${esc(mob)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);font-size:11px">${esc(r.company||'—')}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--muted2)">No login records yet</td></tr>`;

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📱 Device / Mobile Logins</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">
      Each mobile &amp; device login · newest first${rows.length>300?' · showing latest 300 of '+rows.length:''}
    </div>
    <div style="overflow-x:auto;max-height:65vh;border:1px solid var(--border2);border-radius:12px">
      <table style="width:100%;border-collapse:collapse;min-width:480px">
        <thead>
          <tr style="background:var(--panel);position:sticky;top:0;z-index:1">
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">DATE</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">TIME</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">NAME</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">MOBILE NO</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">COMPANY</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <button class="cancel-btn" onclick="closeModal()" style="margin-top:14px">Close</button>`);
}
try{ window.openDeviceLoginList = openDeviceLoginList; window._recordLoginEvent = _recordLoginEvent; }catch(e){}

async function openAdminAnalytics(){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  toast('⏳ Loading analytics…');
  let mobileUsers={}, employees={}, managers={}, deviceApprovals={};
  try{ mobileUsers = await fbGet('mobileUsers') || {}; }catch(e){}
  try{ employees = await fbGet('employees') || {}; }catch(e){}
  try{ managers = await fbGet('managers') || {}; }catch(e){}
  try{ deviceApprovals = await fbGet('deviceApprovals') || {}; }catch(e){}

  const muEntries = Object.entries(mobileUsers||{}).map(([k,u])=>({...(u||{}), _key:k, mobile: (u&& (u.mobile||u.phone)) || k }));
  const mu = muEntries;
  const managersN = mu.filter(u=>u.role==='manager' && u.status==='approved').length;
  const membersN = mu.filter(u=>u.role==='member' && u.status==='approved').length;
  const pendingN = mu.filter(u=>u.status==='pending').length;
  const empN = Object.keys(employees||{}).length;
  const now = Date.now();
  const active30 = mu.filter(u=>{
    const t = u.lastLoginAt || u.loginAt || u.registeredAt || u.approvedAt;
    if(!t) return false;
    return (now - new Date(t).getTime()) < 30*86400000;
  }).length;
  const daEntries = Object.entries(deviceApprovals||{}).map(([k,a])=>({...(a||{}), _key:k}));
  const validDevices = daEntries.filter(a=>{
    try{ return a.validTill && new Date(a.validTill) > new Date(); }catch(e){ return false; }
  }).length;

  const empById = {};
  const empByPhone = {};
  Object.entries(employees||{}).forEach(([id,e])=>{
    if(!e) return;
    const rec = {...e, id: e.id||id};
    empById[rec.id] = rec;
    const ph = _normMobileKey(e.phone||e.mobile||'');
    if(ph) empByPhone[ph] = rec;
  });

  const deviceRows = [];
  const seen = new Set();
  daEntries.forEach(a=>{
    let valid = false;
    try{ valid = !!(a.validTill && new Date(a.validTill) > new Date()); }catch(e){}
    const emp = empById[a._key] || (a.empId ? Object.values(empById).find(e=>String(e.empId)===String(a.empId)) : null);
    const mob = _normMobileKey(a.mobile || (emp&&(emp.phone||emp.mobile)) || '');
    const muRec = mob ? (mobileUsers[mob] || null) : null;
    const name = (emp && emp.name) || a.empName || (muRec && muRec.name) || '—';
    const role = (muRec && muRec.role) || (emp && (emp.accessLevel==='manager'||emp.sec==='MGR') ? 'manager' : 'member') || '—';
    const company = (muRec && muRec.company) || (emp && emp.company) || '—';
    const deviceName = a.deviceName || (muRec && muRec.lastDeviceName) || '—';
    const lastAt = a.approvedAt || (muRec && (muRec.lastLoginAt||muRec.loginAt)) || '';
    const key = (mob||a._key)+'|'+(a.approvedDeviceId||'');
    if(seen.has(key)) return;
    seen.add(key);
    deviceRows.push({
      name, mobile: mob || '—', company, deviceName,
      role, valid, lastAt,
      deviceId: (a.approvedDeviceId||'').substring(0,10),
      empCode: (emp && emp.empId) || a.empId || ''
    });
  });
  mu.forEach(u=>{
    const mob = _normMobileKey(u.mobile||u.phone||u._key||'');
    if(!mob) return;
    const keyPrefix = mob+'|';
    if([...seen].some(s=>s.startsWith(keyPrefix))) return;
    if(!u.lastLoginAt && !u.loginAt && u.status!=='approved') return;
    const emp = empByPhone[mob];
    deviceRows.push({
      name: (emp && emp.name) || u.name || '—',
      mobile: mob,
      company: u.company || (emp && emp.company) || '—',
      deviceName: u.lastDeviceName || '—',
      role: u.role || '—',
      valid: u.status==='approved',
      lastAt: u.lastLoginAt || u.loginAt || u.approvedAt || '',
      deviceId: (u.lastDeviceId||'').substring(0,10),
      empCode: (emp && emp.empId) || u.empId || ''
    });
  });
  deviceRows.sort((a,b)=>{
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });

  const fmtWhen = (iso)=>{
    if(!iso) return '—';
    try{
      const d = new Date(iso);
      if(isNaN(d.getTime())) return '—';
      return d.toLocaleString(typeof mpLocale==='function'?mpLocale():'en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    }catch(e){ return '—'; }
  };

  const rowsHtml = deviceRows.length ? deviceRows.map(r=>{
    const roleColor = r.role==='manager' ? '#a855f7' : (r.role==='admin' ? '#f97316' : '#38bdf8');
    const validBadge = r.valid
      ? '<span style="font-size:10px;font-weight:800;color:#22c55e;background:rgba(34,197,94,.12);padding:2px 7px;border-radius:6px">Valid</span>'
      : '<span style="font-size:10px;font-weight:800;color:#94a3b8;background:rgba(148,163,184,.12);padding:2px 7px;border-radius:6px">Expired/—</span>';
    return `<div style="background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="min-width:0">
          <div style="font-size:14px;font-weight:900;color:var(--text)">${escHtml(r.name)}</div>
          <div style="font-size:12px;color:var(--muted2);margin-top:3px">📱 ${escHtml(r.mobile)}${r.empCode?' · #'+escHtml(String(r.empCode)):''}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <span style="font-size:10px;font-weight:800;color:${roleColor};text-transform:uppercase">${escHtml(String(r.role))}</span>
          <div style="margin-top:4px">${validBadge}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;font-size:11px;color:var(--muted2)">
        <div>🏢 <b style="color:var(--text)">${escHtml(String(r.company||'—'))}</b></div>
        <div>📲 <b style="color:var(--text)">${escHtml(String(r.deviceName||'—'))}</b></div>
        <div>🕒 ${fmtWhen(r.lastAt)}</div>
        <div style="font-family:monospace;font-size:10px">ID ${escHtml(r.deviceId||'—')}</div>
      </div>
    </div>`;
  }).join('') : '<div class="empty"><div class="empty-text">No device login records yet</div></div>';

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📊 App Analytics</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Realtime Database · device logins · Google Analytics on Admin login</div>
    <button type="button" onclick="closeModal();openDeviceLoginList()" style="width:100%;margin-bottom:12px;padding:12px;border-radius:12px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.1);color:#38bdf8;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">📱 Open full login list (Date · Time · Name · Mobile · Company)</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#22c55e">${mu.length}</div>
        <div style="font-size:11px;color:var(--muted2)">Mobile users (OTP)</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#38bdf8">${empN}</div>
        <div style="font-size:11px;color:var(--muted2)">Employees records</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#f97316">${managersN}</div>
        <div style="font-size:11px;color:var(--muted2)">Approved Managers</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#a855f7">${membersN}</div>
        <div style="font-size:11px;color:var(--muted2)">Approved Members</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#fbbf24">${pendingN}</div>
        <div style="font-size:11px;color:var(--muted2)">Pending registrations</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#34d399">${active30}</div>
        <div style="font-size:11px;color:var(--muted2)">Active ~30 days</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2);grid-column:1/-1">
        <div style="font-size:22px;font-weight:900;color:#60a5fa">${validDevices}</div>
        <div style="font-size:11px;color:var(--muted2)">Devices with valid access (not expired)</div>
      </div>
    </div>

    <div style="font-size:13px;font-weight:900;color:var(--text);margin:6px 0 8px">📱 Logged-in devices</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px">Name · Mobile · Company · Device · last activity (from RTDB)</div>
    <div style="max-height:42vh;overflow-y:auto;margin-bottom:12px;padding-right:2px">${rowsHtml}</div>

    <div style="font-size:11px;color:var(--muted2);line-height:1.5;margin-bottom:12px">
      Live counts from Firebase RTDB. Measurement ID <b>G-DK6JFY33ED</b>.
    </div>
    <a href="https://console.firebase.google.com/project/met-power/analytics" target="_blank" rel="noopener"
      style="display:block;text-align:center;padding:14px;border-radius:12px;background:linear-gradient(135deg,#f97316,#a855f7);color:#fff;font-weight:800;text-decoration:none;margin-bottom:10px">
      📈 Open Google Analytics (Firebase Console)
    </a>
    <button class="cancel-btn" onclick="closeModal()">Close</button>`);
}



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
        <div style="font-size:18px;font-weight:900;color:#fff">${SESSION.name}</div>
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
      <button class="profile-action" onclick="closeModal();openAdminAnalytics()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">📊</div>
        <div><div class="pa-label">App Analytics</div><div class="pa-sub">Users, active logins, Managers</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openDeviceLoginList()">
        <div class="pa-icon" style="background:rgba(56,189,248,.12)">📱</div>
        <div><div class="pa-label">Device / Mobile Logins</div><div class="pa-sub">Date · Time · Name · Mobile · Company</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action" onclick="openHolidayListModal()">
        <div class="pa-icon" style="background:rgba(245,158,11,.12)">📅</div>
        <div><div class="pa-label">Holiday List</div><div class="pa-sub">Date + Reason · Excel / Auto-fetch All-India</div></div>
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
      <div style="font-size:18px;font-weight:900;color:#fff">${SESSION.name}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:4px">Guest Access</div>
      <button class="profile-action danger" onclick="doLogout()" style="margin-top:16px;justify-content:center">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div></div>
      </button>
    </div>`);
  } else {
    // Fetch live validity from Firebase
    let daysLeft = 0, expiryStr = '', expiryDate = '', hasExpiry = false;
    try{
      if(SESSION.role==='manager' || SESSION.role==='member'){
        const mobileKey = _normMobileKey(SESSION.mobile);
        const rec = await fbGet('mobileUsers/' + mobileKey);
        if(rec && rec.validTill){
          hasExpiry = true;
          daysLeft = Math.ceil((new Date(rec.validTill) - new Date()) / 86400000);
          expiryDate = new Date(rec.validTill).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
          expiryStr = expiryDate;
        }
      } else {
        const empObjId = myEmp()?.id || SESSION.empObjId;
        if(empObjId){
          const approval = await fbGet('deviceApprovals/' + empObjId);
          if(approval && approval.validTill){
            hasExpiry = true;
            daysLeft = Math.ceil((new Date(approval.validTill) - new Date()) / 86400000);
            expiryDate = new Date(approval.validTill).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
            expiryStr = expiryDate;
          }
        }
      }
    }catch(ex){}
    const color = !hasExpiry?'#22c55e':daysLeft<=7?'#f43f5e':daysLeft<=15?'#f97316':'#22c55e';
    const icon  = !hasExpiry?'🟢':daysLeft<=0?'🔴':daysLeft<=7?'⚠️':'🟢';
    const msg = !hasExpiry
      ? ((typeof L==='function')?L('कोई Expiry तय नहीं है','No expiry set'):'No expiry set')
      : daysLeft<=0
        ? ((typeof L==='function')?L('Validity Expire हो गई — Admin से मिलें','Validity expired — contact Admin'):'Validity expired — contact Admin')
        : daysLeft<=7
          ? ((typeof L==='function')?L('सिर्फ '+daysLeft+' दिन बाकी — जल्दी Admin से मिलें','Only '+daysLeft+' days left — contact Admin soon'):('Only '+daysLeft+' days left'))
          : ((typeof L==='function')?L(daysLeft+' दिन बाकी', daysLeft+' days left'):(daysLeft+' days left'));
    const empRec = myEmp();
    const secLabel = empRec ? (secName(empRec.sec) || empRec.sec) : '';
    const roleLabel = isMgr()?'🏅 Manager':isSupervisor()?'👁️ Supervisor':'👤 User';
    openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="text-align:center;padding:10px 0">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#f97316,#a855f7);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:28px;font-weight:900;color:#fff;font-family:'Barlow Condensed',sans-serif;overflow:hidden">${SESSION.photoUrl?`<img src="${SESSION.photoUrl}" style="width:100%;height:100%;object-fit:cover">`:(SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
      <div style="font-size:20px;font-weight:900;color:#fff">${SESSION.name}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:4px">${(SESSION.role==='manager'||SESSION.role==='member')?(function(){ const s=String(SESSION.mobile||'').replace(/\s/g,''); if(s.startsWith('+91')&&s.length>=13) return '📱 +91 '+s.slice(3,8)+' '+s.slice(8); if(s.length===10) return '📱 +91 '+s.slice(0,5)+' '+s.slice(5); return '📱 '+(SESSION.mobile||'—'); })():(SESSION.empId||'—')+' · '+secLabel}</div>
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
          [L('सेक्शन','Section'), secLabel||er.sec||'—'],
        ];
        return '<div style="background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:12px 14px;margin:14px 0;text-align:left">'
          +'<div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;margin-bottom:8px">'+(L('मेरी जानकारी','MY DETAILS'))+'</div>'
          +rows.map(([k,v])=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px"><span style="color:var(--muted2)">'+k+'</span><span style="color:var(--text);font-weight:700">'+v+'</span></div>').join('')
          +'</div>';
      })()}
      ${(SESSION.role==='manager'||SESSION.role==='member')?`<button class="profile-action" style="margin-top:6px" onclick="openLeaveBalanceModal()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🏖️</div>
        <div><div class="pa-label">${L('छुट्टी बैलेंस','Leave Balance')}</div><div class="pa-sub">${L('सभी प्रकार की छुट्टियाँ व शेष','All leave types & remaining')}</div></div>
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

      <div style="background:var(--panel);border:1.5px solid ${daysLeft<=7?color:'var(--border2)'};border-radius:14px;padding:16px;margin:16px 0;text-align:left">
        <div style="font-size:11px;color:var(--muted2);font-weight:700;letter-spacing:1px;margin-bottom:6px">${L('ऐप एक्सेस वैधता','APP ACCESS VALIDITY')}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:28px">${icon}</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:${color};font-family:'Barlow Condensed',sans-serif">${msg}</div>
            ${expiryStr?`<div style="font-size:11px;color:var(--muted2);margin-top:2px">${L('वैध तक: ','Valid till: ')}${expiryStr}</div>`:''}
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
        <div><div class="pa-label">${L('Company Name बदलें','Change Company Name')}</div><div class="pa-sub">${L('वर्तमान: ','Current: ')}${SESSION.company||'—'}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${isMgr()?`<button type="button" class="profile-action" onclick="openLeaveTeamModal()" style="border-color:rgba(244,63,94,.35)">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">👋</div>
        <div><div class="pa-label">${L('Leave team / Transfer Manager','Leave team / Transfer Manager')}</div><div class="pa-sub">${L('किसी सदस्य को नया Manager बनाकर टीम छोड़ें','Promote a member and leave the team')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
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
     <div style="font-size:18px;font-weight:900;color:#fff">${SESSION.name||'—'}</div>
     <button class="profile-action danger" onclick="doLogout()" style="margin-top:16px;justify-content:center">
       <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
       <div><div class="pa-label">Logout</div></div>
     </button>
   </div>`);
 }
}


// ════════════════════════════════════════
// MANAGER LEAVES TEAM — automated handoff
// ════════════════════════════════════════
/** Rank team members for automatic Manager succession */
function _rankManagerSuccessors(){
  const oldKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const team = getEmps().filter(e => e.status!=='resigned' && e.status!=='left' && !isManagerSelfRecord(e));
  return team.map(e=>{
    const ph = _normMobileKey(e.phone||e.mobile||'');
    let score = 0;
    const reasons = [];
    if(ph.length===10){ score += 50; reasons.push('mobile'); }
    else reasons.push('no-mobile');
    const p = e.perms||{};
    if(p.schedule){ score += 15; reasons.push('schedule'); }
    if(p.leave){ score += 10; reasons.push('leave'); }
    if(p.reports){ score += 10; reasons.push('reports'); }
    if(e.accessLevel==='manager' || e.isTeamManager){ score += 20; reasons.push('access'); }
    const des = String(e.designation||e.resp||'').toLowerCase();
    if(/manager|supervisor|sr\.|senior|incharge|in-charge/.test(des)){ score += 12; reasons.push('title'); }
    if(e.joiningDate){
      const yrs = (Date.now() - new Date(e.joiningDate).getTime()) / (365.25*864e5);
      if(yrs >= 2){ score += 8; reasons.push('senior'); }
      else if(yrs >= 1){ score += 4; }
    }
    return { emp: e, phone: ph, score, reasons, eligible: ph.length===10 };
  }).sort((a,b)=> b.score - a.score || (a.emp.name||'').localeCompare(b.emp.name||''));
}


async function openChangeCompanyModal(){ /* profile */
  if(SESSION.role!=='manager' && !isAdmin()){ toast(L('❌ Manager only','❌ Manager only')); return; }
  const isEn = (_lang !== 'hi');
  const cur = SESSION.company || '';
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🏢 ${L('Company Name बदलें','Change Company Name')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      ${L('वर्तमान:','Current:')} <b style="color:var(--text)">${(cur||'—').replace(/</g,'&lt;')}</b>
    </div>
    <label style="font-size:11px;color:var(--muted2);font-weight:700">${L('नया Company नाम','New company name')}</label>
    <input class="inp-field" id="chgCompanyName" value="${String(cur).replace(/"/g,'&quot;')}" placeholder="${L('जैसे: Man Power','e.g. Man Power / ABC Industries')}" style="margin:8px 0 14px;width:100%;box-sizing:border-box">
    <button class="submit-btn" onclick="saveChangeCompanyName()">✅ ${L('Save करें','Save')}</button>
    <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
  setTimeout(()=>document.getElementById('chgCompanyName')?.focus(), 100);
}

async function saveChangeCompanyName(){
  const isEn = (_lang !== 'hi');
  const name = (document.getElementById('chgCompanyName')?.value||'').trim();
  if(!name || name.length < 2){ toast(L('⚠️ सही Company नाम डालें','⚠️ Enter a valid company name')); return; }
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(L('❌ पहले इस device पर Phone verify करें','❌ Phone verify on this device first')); return; }
    }
    const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(!mob){ toast('❌ Mobile not found in session'); return; }
    await fbUpdate('mobileUsers/'+mob, { company: name, companyUpdatedAt: new Date().toISOString() });
    try{ await fbUpdate('managers/'+mob, { company: name }); }catch(e){}
    SESSION.company = name;
    try{ SESSION.companyId = (typeof _normCompanyId==='function') ? _normCompanyId(name) : name; }catch(e){ SESSION.companyId = name; }
    try{ saveSession(); }catch(e){}
    // Propagate new name to all team employee records so Admin company list is not stale
    let synced = 0;
    try{ if(typeof _syncCompanyLabelToTeam==='function') synced = await _syncCompanyLabelToTeam(name); }catch(e){}
    toast(isEn?('✅ Company name updated'+(synced?' · '+synced+' team records':'')):('✅ Company नाम update'+(synced?' · '+synced+' team':'')));
    closeModal();
    try{ if(typeof renderCompanySwitcher==='function') renderCompanySwitcher(); }catch(e){}
    try{ showProfile(); }catch(e){}
  }catch(e){
    console.error('[saveChangeCompanyName]', e);
    toast('❌ '+(e.message||e)+' — Phone OTP verify करके फिर try करें');
  }
}

try{ window.openChangeCompanyModal = openChangeCompanyModal; window.saveChangeCompanyName = saveChangeCompanyName; }catch(e){}

function openLeaveTeamModal(){
  if(!isMgr()){ toast('❌ Only Manager'); return; }
  const ranked = _rankManagerSuccessors();
  const eligible = ranked.filter(r=>r.eligible);
  if(!eligible.length){
    openModal(`<div class="modal-handle"></div>
      <div class="modal-title">👋 Automated Manager Handoff</div>
      <div style="font-size:13px;color:var(--muted2);line-height:1.65;margin-bottom:14px">
        No team member has a <b style="color:var(--text)">10-digit mobile</b>. Add mobile numbers on Team, then handoff can run automatically.
      </div>
      <button class="cancel-btn" onclick="closeModal()">Close</button>`);
    return;
  }
  const best = eligible[0];
  const opts = eligible.map((r,i)=>
    `<option value="${r.emp.id}"${i===0?' selected':''}>${i===0?'⭐ ':''}${r.emp.name} (${r.emp.empId||'—'}) · ${r.phone} · score ${r.score}</option>`
  ).join('');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">👋 Automated Manager Handoff</div>
    <div style="font-size:13px;color:var(--muted2);line-height:1.65;margin-bottom:12px">
      System recommends the best successor and will:
      <ul style="margin:8px 0 0 18px;padding:0">
        <li>Move <b style="color:var(--text)">entire team</b> under the new Manager</li>
        <li>Promote them to <b style="color:var(--text)">approved Manager</b> (OTP login)</li>
        <li>Copy shift settings</li>
        <li>Mark you as <b style="color:#fbbf24">left_team</b> (next login = fresh user)</li>
        <li>Notify the new Manager (app + WhatsApp if possible)</li>
      </ul>
    </div>
    <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:800;color:#22c55e;margin-bottom:4px">RECOMMENDED</div>
      <div style="font-size:16px;font-weight:900;color:var(--text)">${best.emp.name}</div>
      <div style="font-size:12px;color:var(--muted2)">📱 ${best.phone} · Emp ${best.emp.empId||'—'} · score ${best.score}
        ${best.reasons.length?` · ${best.reasons.join(', ')}`:''}</div>
    </div>
    <div class="field">
      <label>New Manager (auto-ranked — change if needed)</label>
      <select class="inp-field" id="leaveTeamSuccessor">${opts}</select>
    </div>
    <div class="field">
      <label>Double-check — type <b style="color:#f43f5e">LEAVE</b> to confirm</label>
      <input class="inp-field" id="leaveTeamConfirm" placeholder="LEAVE" autocomplete="off"
        style="letter-spacing:2px;font-weight:800;text-transform:uppercase">
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      <button class="big-btn green" onclick="confirmLeaveTeamTransfer(true)">⚡ Handoff recommended (after LEAVE)</button>
      <button class="big-btn red" onclick="confirmLeaveTeamTransfer(false)">Transfer selected & leave</button>
      <button class="cancel-btn" onclick="closeModal()">Cancel</button>
    </div>
    <div id="leaveTeamProgress" style="display:none;margin-top:12px;font-size:12px;color:var(--muted2);line-height:1.5"></div>`);
}

async function confirmLeaveTeamTransfer(useRecommended){
  if(!isMgr()){ toast('❌ Only Manager'); return; }
  const conf = (document.getElementById('leaveTeamConfirm')?.value||'').trim().toUpperCase();
  if(conf !== 'LEAVE'){
    toast('⚠️ Type LEAVE to confirm — prevents accidental handoff');
    try{ document.getElementById('leaveTeamConfirm')?.focus(); }catch(e){}
    return;
  }
  const ranked = _rankManagerSuccessors();
  const eligible = ranked.filter(r=>r.eligible);
  if(!eligible.length){ toast('❌ No eligible successor'); return; }

  let succId = document.getElementById('leaveTeamSuccessor')?.value;
  if(useRecommended) succId = eligible[0].emp.id;
  if(!succId){ toast('⚠️ Select new Manager'); return; }

  const oldKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  if(!oldKey){ toast('❌ Manager mobile missing'); return; }

  const team = getEmps();
  const succ = team.find(e=>e.id===succId) || (_cache.employees||[]).find(e=>e.id===succId);
  if(!succ){ toast('❌ Member not found'); return; }
  const newKey = _normMobileKey(succ.phone||succ.mobile||'');
  if(newKey.length !== 10){
    toast('❌ Selected member needs a valid 10-digit mobile');
    return;
  }

  const prog = document.getElementById('leaveTeamProgress');
  const setProg = (msg)=>{ if(prog){ prog.style.display='block'; prog.textContent = msg; } };
  document.querySelectorAll('.modal-box .big-btn, .modal .big-btn').forEach(b=>{ b.disabled = true; });

  try{
    setProg('1/6 · Transferring team roster…');
    const toTransfer = team.length ? team : (_cache.employees||[]).filter(e=>e.managerId===oldKey);
    let n = 0;
    const updates = {};
    for(const e of toTransfer){
      updates['employees/'+e.id+'/managerId'] = newKey;
      updates['employees/'+e.id+'/previousManagerId'] = oldKey;
      updates['employees/'+e.id+'/managerTransferredAt'] = new Date().toISOString();
      n++;
    }
    updates['employees/'+succ.id+'/managerId'] = newKey;
    updates['employees/'+succ.id+'/accessLevel'] = 'manager';
    updates['employees/'+succ.id+'/isTeamManager'] = true;
    updates['employees/'+succ.id+'/perms'] = { schedule:true, leave:true, reports:true };
    // RTDB multi-path update via root
    try{
      await window._fbAccess('update', '/', updates);
    }catch(batchErr){
      console.warn('batch transfer fallback', batchErr);
      for(const e of toTransfer){
        try{
          await fbUpdate('employees/'+e.id, {
            managerId: newKey,
            previousManagerId: oldKey,
            managerTransferredAt: new Date().toISOString()
          });
        }catch(ex){}
      }
      await fbUpdate('employees/'+succ.id, {
        managerId: newKey,
        accessLevel: 'manager',
        perms: { schedule:true, leave:true, reports:true },
        isTeamManager: true
      });
    }

    setProg('2/6 · Promoting new Manager login…');
    let succUser = null;
    try{ succUser = await fbGet('mobileUsers/'+newKey); }catch(e){}
    await fbSet('mobileUsers/'+newKey, {
      ...(succUser||{}),
      role: 'manager',
      name: succ.name || succUser?.name || 'Manager',
      mobile: newKey,
      company: SESSION.company || succUser?.company || '',
      companyId: SESSION.companyId || succUser?.companyId || '',
      status: 'approved',
      empId: succ.empId || '',
      empObjId: succ.id,
      approvedAt: new Date().toISOString(),
      approvedBy: 'auto_handoff:'+(SESSION.name||oldKey),
      transferredFrom: oldKey,
      managerSince: new Date().toISOString()
    });

    setProg('3/6 · Updating members’ mobile accounts…');
    try{
      const allMU = await fbGet('mobileUsers') || {};
      for(const [mob, rec] of Object.entries(allMU)){
        if(!rec || typeof rec !== 'object') continue;
        if(String(rec.managerId||'') === oldKey || String(rec.managerId||'') === '+91'+oldKey){
          try{
            await fbUpdate('mobileUsers/'+mob, {
              managerId: newKey,
              managerName: succ.name,
              previousManagerId: oldKey
            });
          }catch(ex){}
        }
      }
    }catch(ex){ console.warn('mu transfer', ex); }

    setProg('4/6 · Copying shift settings…');
    try{
      const oldCfgKey = ('mgr:'+oldKey).replace(/[:.#$\[\]]/g,'_');
      const newCfgKey = ('mgr:'+newKey).replace(/[:.#$\[\]]/g,'_');
      const cfg = await fbGet('shiftConfigs/'+oldCfgKey);
      if(cfg){
        await fbSet('shiftConfigs/'+newCfgKey, {
          ...cfg,
          transferredFrom: oldKey,
          updatedAt: new Date().toISOString()
        });
      }
    }catch(ex){ console.warn('cfg transfer', ex); }

    setProg('5/6 · Closing your Manager access…');
    let oldUser = null;
    try{ oldUser = await fbGet('mobileUsers/'+oldKey); }catch(e){}
    await fbSet('mobileUsers/'+oldKey, {
      ...(oldUser||{}),
      status: 'left_team',
      role: 'none',
      leftAt: new Date().toISOString(),
      leftReason: 'auto_manager_handoff',
      transferredTo: newKey,
      transferredToName: succ.name,
      name: oldUser?.name || SESSION.name,
      mobile: oldKey
    });

    setProg('6/6 · Notifying new Manager…');
    try{
      await fbPush('adminNotifications', {
        type: 'manager_left_team',
        message: (SESSION.name||oldKey)+' auto-handoff → '+(succ.name||newKey),
        from: oldKey, to: newKey, at: new Date().toISOString()
      });
    }catch(e){}
    try{
      await fbPush('userNotifications/'+newKey, {
        type: 'became_manager',
        title: '🏅 You are now Manager',
        body: (SESSION.name||'Previous manager')+' transferred the team to you automatically. You manage schedule, leave, and members.',
        read: false,
        at: new Date().toISOString()
      });
      if(succ.id) await fbPush('userNotifications/'+succ.id, {
        type: 'became_manager',
        title: '🏅 You are now Manager',
        body: (SESSION.name||'Previous manager')+' transferred the team to you.',
        read: false,
        at: new Date().toISOString()
      });
    }catch(e){}

    // WhatsApp to new manager (user gesture from button click)
    try{
      const waMsg = `🏅 *Man Power — You are now Manager*\n\n`+
        `नमस्ते *${succ.name}*,\n\n`+
        `*${SESSION.name||'Previous manager'}* ने team आपको transfer कर दी है।\n\n`+
        `📱 Login: +91 ${newKey}\n`+
        `👥 Members transferred: ${n}\n\n`+
        `App खोलकर Manager के रूप में login करें।\n_— MET_`;
      openWA(newKey, waMsg);
    }catch(e){}

    closeModal();
    toast('✅ Handoff complete → '+succ.name+' ('+n+' members). Logging out…');
    setTimeout(()=>{ try{ doLogout(); }catch(e){ location.reload(); } }, 1000);
  }catch(err){
    console.error('leave team', err);
    toast('❌ Handoff failed: '+(err.message||err));
    setProg('Failed: '+(err.message||err));
    document.querySelectorAll('.modal-box .big-btn, .modal .big-btn').forEach(b=>{ b.disabled = false; });
  }
}

function openExtendAccessModal(){
  const emps = getEmps();
  const empOptions = emps.map(e=>`<option value="${e.id}|${e.empId}">${e.name} (${e.empId||'—'})</option>`).join('');
  const defaultDate = new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">⏳ Access Extend / Expiry</div>
  <div class="field"><label>कर्मचारी</label>
    <select class="inp-field" id="ext_emp">${empOptions}</select></div>
  <div class="field"><label>Exact expiry date</label>
    <input type="date" class="inp-field" id="ext_date" value="${defaultDate}">
  </div>
  <div class="field"><label>या कितने दिन?</label>
    <select class="inp-field" id="ext_days" onchange="(function(s){var d=new Date();d.setDate(d.getDate()+parseInt(s.value||365,10));var el=document.getElementById('ext_date');if(el)el.value=d.toISOString().slice(0,10);})(this)">
      <option value="365" selected>365 दिन (1 साल) — Standard</option>
      <option value="180">180 दिन (6 महीने)</option>
      <option value="90">90 दिन</option>
      <option value="45">45 दिन</option>
      <option value="730">730 दिन (2 साल)</option>
    </select></div>
  <button class="submit-btn" onclick="doExtendAccess()">✅ Save Expiry</button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

async function doExtendAccess(){
  const val = document.getElementById('ext_emp').value;
  if(!val){ toast('⚠️ कर्मचारी चुनें'); return; }
  const [empObjId] = val.split('|');
  const dateStr = (document.getElementById('ext_date')||{}).value;
  if(dateStr){
    const ok = await extendUserExpiry(empObjId, dateStr);
    if(ok) closeModal();
    return;
  }
  const days = parseInt(document.getElementById('ext_days').value)||365;
  const ok = await extendUserExpiry(empObjId, days);
  if(ok) closeModal();
}

// ════════════════════════════════════════
// TABS
// ════════════════════════════════════════
let _currentTab='home';

function _goTabDirect(t){
  const prev = _currentTab;
  _currentTab=t;
  document.querySelectorAll('.tab').forEach(e=>e.classList.remove('on'));
  const el=document.getElementById('tab-'+t); if(el) el.classList.add('on');
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('on'));
  const nb=document.getElementById('nb-'+t); if(nb) nb.classList.add('on');
  // Sync PC sidebar active state
  document.querySelectorAll('.pc-nav-btn').forEach(b=>b.classList.remove('on'));
  const pcnb=document.getElementById('pc-nb-'+t); if(pcnb) pcnb.classList.add('on');
  if(t==='home')         renderHome();
  if(t==='myshift')      renderMyShift();
  if(t==='todo')         renderTodo();
  if(t==='schedule')     { schedOff=(typeof _schedDefaultOff==='function'?_schedDefaultOff():-5); _customRangeActive=false; try{ _updateSchedAdminVisibility(); }catch(e){} renderSchedule(); setTimeout(syncStickyTop,100); setTimeout(syncStickyTop,400); }
  if(t==='leave')        { try{ renderLeaves(); }catch(e){ console.warn('[leave]',e); } try{ renderResignations(); }catch(e){ console.warn('[resign]',e); } }
  if(t==='reports')      renderReports();
  if(t==='pending')      renderPending();
  if(t==='team')         { try{ renderTeam(); }catch(e){ console.warn('[team]',e); } try{ renderAdminTeamHierarchy(); }catch(e){ console.warn('[teamHier]',e); } }
  if(t==='instructions') renderInstructions();
  // Re-apply language so any newly-rendered elements get translated.
  // Run twice — once immediately, once after async renders settle.
  try{ if(typeof applyLang === 'function') applyLang(); }catch(e){}
  setTimeout(()=>{ try{ if(typeof _translateDOM === 'function') _translateDOM(); }catch(e){} }, 250);
  // Android/browser Back: keep in-app history instead of closing the app
  if(!_mpHistoryLock && prev !== t){
    try{
      _mpTabStack.push(prev);
      if(_mpTabStack.length > 30) _mpTabStack.shift();
      history.pushState({ mp:true, tab:t, kind:'tab' }, '');
    }catch(e){}
  }
}

// ── Hardware / browser Back button → last screen (not exit app) ──
let _mpTabStack = [];
let _mpHistoryLock = false;
let _mpHistoryReady = false;

function _mpCloseAnyOverlay(){
  // Main modal
  const ov = document.getElementById('overlay');
  if(ov && ov.classList.contains('open')){ closeModal(); return true; }
  // Named overlays used across the app
  const ids = ['customRangeOverlay','excelUploadOverlay','smsSettingsOverlay','warnOverlay','teamExcelOverlay','playerOverlay'];
  for(const id of ids){
    const el = document.getElementById(id);
    if(el && el.classList.contains('open')){
      el.classList.remove('open');
      return true;
    }
  }
  // Dynamically created confirm / WA overlays
  const dyn = document.getElementById('_waSeqOverlay') || document.querySelector('[style*="z-index:99998"]');
  if(dyn && dyn.parentNode){ try{ dyn.parentNode.removeChild(dyn); }catch(e){} return true; }
  // Learn screen
  const learn = document.querySelector('.learn-screen');
  if(learn && learn.style.display === 'block'){ learn.style.display = 'none'; return true; }
  return false;
}

function _mpOnPopState(ev){
  if(!_mpHistoryReady) return;
  // 1) Close open modal / overlay first
  if(_mpCloseAnyOverlay()){
    try{ history.pushState({ mp:true, tab:_currentTab, kind:'guard' }, ''); }catch(e){}
    return;
  }
  // 2) Go to previous in-app tab
  if(_mpTabStack.length){
    const prev = _mpTabStack.pop();
    _mpHistoryLock = true;
    try{ _goTabDirect(prev); } finally { _mpHistoryLock = false; }
    try{ history.pushState({ mp:true, tab:prev, kind:'tab' }, ''); }catch(e){}
    return;
  }
  // 3) If already at root tab — stay in app (re-push guard state so Back does not exit)
  try{ history.pushState({ mp:true, tab:_currentTab, kind:'guard' }, ''); }catch(e){}
}

function _mpInitHistory(){
  if(_mpHistoryReady) return;
  _mpHistoryReady = true;
  try{ history.replaceState({ mp:true, tab:_currentTab||'home', kind:'root' }, ''); }catch(e){}
  try{ history.pushState({ mp:true, tab:_currentTab||'home', kind:'guard' }, ''); }catch(e){}
  window.addEventListener('popstate', _mpOnPopState);
}

// openModal already pushes history (see definition). Dead string patch removed.

function openNavMoreSheet(){
  const sheet = document.getElementById('navMoreSheet');
  const grid = document.getElementById('navMoreGrid');
  if(!sheet || !grid) return;
  const tabs = window._navMoreTabs || [];
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  grid.innerHTML = tabs.map(t=>{
    const label = en ? (t.lblEn||t.lbl) : t.lbl;
    return `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();goTab('${t.id}')" aria-label="${label}">
      <span style="font-size:22px">${t.ico}</span>${label}
    </button>`;
  }).join('') || `<div class="empty-state-sub">${en?'No extra tabs':'और टैब नहीं'}</div>`;
  sheet.classList.add('open');
}
function closeNavMoreSheet(){
  const sheet = document.getElementById('navMoreSheet');
  if(sheet) sheet.classList.remove('open');
}

function goTab(t){
  try{ if(typeof closeNavMoreSheet==='function') closeNavMoreSheet(); }catch(e){}

  if(typeof isPendingMember==='function' && isPendingMember()){
    const allowed = ['home','todo'];
    if(t && !allowed.includes(t)){
      toast('⏳ Manager approve होने तक सिर्फ Home / To-Do / Learn उपलब्ध हैं');
      t = 'home';
    }
  }

  // Warn if leaving schedule tab with unsaved changes
  if(_currentTab==='schedule' && t!=='schedule' && Object.keys(_pendingShiftChanges).length>0){
    const n = Object.keys(_pendingShiftChanges).length;
    confirmModal(
      `${n} बदलाव Unsaved हैं!`,
      `आपने ${n} shift${n>1?'s':''} बदले हैं जो अभी save नहीं हुए।<br><br>क्या बिना save किए जाना चाहते हैं?`,
      '🚪 हाँ, बिना Save जाएं',
      '← Schedule पर रहें'
    ).then(ok => {
      if(ok){
        _pendingShiftChanges = {};
        _updateSaveBar();
        _goTabDirect(t);
      }
    });
    return;
  }
  _goTabDirect(t);
}

function _updateSchedAdminVisibility(){
  const canEdit = (typeof canEditSchedule==='function') ? canEditSchedule() : false;
  // Admin/Manager (or delegated schedule perm): show Create/Upload/Print + View/Edit
  const row = document.getElementById('schedAdminRow');
  if(row) row.style.display = canEdit ? 'flex' : 'none';
  // View/Edit toggle removed — managers always edit; members always view-only
  const modeToggle = document.getElementById('schModeToggle');
  if(modeToggle) modeToggle.style.display = 'none';
  const editBtn = document.getElementById('schModeEdit');
  if(editBtn) editBtn.style.display = 'none';
  const viewBtn = document.getElementById('schModeView');
  if(viewBtn) viewBtn.style.display = 'none';
  const hint = document.getElementById('schedEditHint');
  if(!canEdit){
    window._schedEditMode = false;
    if(hint) hint.style.display = 'none';
  } else {
    window._schedEditMode = true;
    if(hint) hint.style.display = 'none'; // no need — always editable
  }
  // Multi-select only for editors
  const msBtn = document.getElementById('msToggleBtn');
  if(msBtn) msBtn.style.display = canEdit ? '' : 'none';
  // Also update Imp Info button
  const iiBtn = document.getElementById('impInfoBtn');
  if(iiBtn) iiBtn.style.display = (!isGuest() && SESSION && SESSION.role) ? 'inline-flex' : 'none';
}

function renderAll(){
  try{
    goTab(_currentTab);
    updatePendingBadge();
    updateTodoBadge();
    _updateSchedAdminVisibility();
    try{ _mpInitHistory(); }catch(e){}
  }catch(e){
    console.error('[renderAll] error:', e);
    try{ toast('⚠️ Display error — कृपया page refresh करें'); }catch(te){}
  }
}

// ── Reusable confirm modal (replaces native confirm() dialogs) ──
// Usage: confirmModal('Title', 'Message', 'Yes btn label', 'No btn label') → Promise<boolean>
function confirmModal(title, message, yesLabel='✅ हाँ', noLabel='रद्द करें', yesClass='submit-btn'){
  // Auto-translate all visible text via t() helper
  const _t = (typeof t === 'function') ? t : (s=>s);
  // Default labels also need translation
  const _yesLabel = (typeof L==='function'?L(yesLabel,'✅ Yes'):_t(yesLabel));
  const _noLabel  = (typeof L==='function'?L(noLabel,'Cancel'):_t(noLabel));
  const _title    = _t(title);
  const _message  = _t(message);
  return new Promise(resolve=>{
    const overlay = document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)';
    overlay.innerHTML=`
      <div style="background:var(--bg2);border-radius:20px 20px 0 0;padding:24px 20px 40px;width:100%;max-width:480px;border-top:1px solid var(--border2);animation:slideUp .25s cubic-bezier(.32,0,.15,1)">
        <div style="width:32px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 18px"></div>
        <div style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:10px;text-align:center">${_title}</div>
        <div style="font-size:14px;color:var(--muted2);line-height:1.7;text-align:center;margin-bottom:22px">${_message}</div>
        <button id="_cmYes" style="width:100%;padding:16px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--m1),#c2410c);color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 20px rgba(249,115,22,.3)">${_yesLabel}</button>
        <button id="_cmNo"  style="width:100%;padding:14px;border-radius:12px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">${_noLabel}</button>
      </div>`;
    document.body.appendChild(overlay);
    const cleanup = val=>{ document.body.removeChild(overlay); resolve(val); };
    overlay.querySelector('#_cmYes').addEventListener('click',()=>cleanup(true));
    overlay.querySelector('#_cmNo').addEventListener('click', ()=>cleanup(false));
    overlay.addEventListener('click', e=>{ if(e.target===overlay) cleanup(false); });
  });
}

// ── Debounced refreshAll: prevents 5 Firebase listeners firing 5 rerenders ──
// Only renders once after all listeners settle (300ms window)
let _refreshTimer = null;
let _refreshAllTimer = null;
function refreshAll(){
  // Single debounce — coalesces burst of RTDB listener events
  if(_refreshAllTimer) clearTimeout(_refreshAllTimer);
  _refreshAllTimer = setTimeout(()=>{
    _refreshAllTimer = null;
    try{
      const mc = document.getElementById('mainContent');
      if(!mc || mc.style.display==='none') return;
      renderAll();
    }catch(e){ console.warn('refreshAll', e); }
  }, 150);
}
function _refreshAllImpl(){ refreshAll(); }


function updatePendingBadge(){
  // Update pending tab badge (admin and manager)
  if(isAdminOrMgr()){
    const count = getRegs().filter(r=>r.status==='pending').length
                + getLeaves().filter(l=>l.status==='pending').length
                + getReports().filter(r=>r.status==='pending').length;
    const badge=document.getElementById('pendingBadge');
    if(badge){ badge.textContent=count; badge.style.display=count>0?'flex':'none'; }
    const pcBadge=document.getElementById('pcPendingBadge');
    if(pcBadge){ pcBadge.textContent=count; pcBadge.style.display=count>0?'flex':'none'; }
  }
  // Update bell badge (all users)
  _updateUserNotifBadge();
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
const uid = ()=>'_'+Math.random().toString(36).slice(2,8);
const fmtDate  = s => new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const fmtShort = s => new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
function addDays(s,n){ const d=new Date(s);d.setDate(d.getDate()+n);return d.toISOString().split('T')[0]; }
function dateRange(f,t){ const r=[],d=new Date(f),e=new Date(t);while(d<=e){r.push(d.toISOString().split('T')[0]);d.setDate(d.getDate()+1);}return r; }

// ── EXCEL SHIFT SCHEDULES (Aug 2025 – Mar 2026, parsed from official schedule) ──
const EXCEL_SCHEDULES = {"2025_08":{"e06":["N","N","O","D","D","D","D","L","H","N","O","D","N","N","N","N","O","D","D","L","D","D","C/O","O","N","N","N","C/O","N","N","O"],"e05":["O","D","D","D","D","D","D","O","N","N","N","N","N","O","H","H","L","L","L","L","L","O","N","N","N","N","N","N","O","D","L"],"e25":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","L","L","L","N","N","O","N","N","N","N","N","N"],"e19":["O","N","N","N","N","N","N","O","D","D","D","D","D","O","H","N","N","N","N","N","N","O","D","D","D","D","D","D","O","C/O","C/O"],"e24":["C/O","D","O","D","D","L","D","D","D","O","N","N","N","N","N","H","O","D","D","D","D","D","D","O","N","C/O","C/O","L","L","L","O"],"e22":["N","N","N","O","D","D","D","D","H","O","D","D","D","D","H","D","D","O","D","N","N","N","N","N","O","C/O","D","D","D","N","HLF"],"e14":["N","O","D","D","D","D","L","O","H","N","N","N","N","N","N","O","Ab","D","D","D","D","D","O","N","N","N","N","N","N","O","D"],"e15":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","D","D","O","N","N","N","N","N","N"],"e13":["N","N","N","N","N","O","D","D","D","D","D","D","O","C/O","H","H","N","N","N","O","D","D","D","D","D","D","O","N","L","N","N"],"e10":["D","D","D","D","D","O","D","D","H","L","L","L","O","D","D","D","D","D","D","N","N","O","N","N","N","N","N","O","D","D","D"],"e12":["D","D","D","O","N","N","N","N","H","D","D","D","D","D","D","D","D","O","C/O","N","N","N","N","N","O","D","D","D","D","D","D"],"e01":["N","N","N","N","O","D","D","D","D","D","D","O","N","N","H","H","N","N","O","D","D","D","D","D","D","D","O","N","N","N","N"],"e26":["N","O","D","D","D","D","D","D","H","O","L","L","L","L","H","O","N","N","N","N","N","N","O","D","D","D","D","O","D","D","D"],"e21":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","L","C/O","C/O","C/O","L","O","Ab","N","N","N","N","N","O","D","D","D"],"e04":["D","O","N","N","N","N","N","N","H","O","L","N","L","L","H","H","O","L","L","L","N","O","D","D","D","D","D","D","D","O","N"],"e27":["G","O","G","G","G","G","O","G","H","L","L","L","L","O","H","H","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G"],"e18":["D","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","L","L","O","C/O","C/O","C/O","AB","AB","N","O","D","D","D","D","D"],"e23":["N","N","N","N","N","N","N","N","N","N","N","N","N","C/O","N","N","O","C/O","C/O","C/O","C/O","D","N","O","N","N","N","O","N","N","N"],"e03":["","","","","","","","","","","","G","D","N","N","N","N","N","N","N","O","D","D","D","D","D","D","N","N","N","L"],"e08":["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","G","D"]},"2025_09":{"e06":["D","D","D","D","D","D","O","D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D","D","D","D","O","D","D"],"e05":["D","D","D","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e25":["O","D","D","D","C/O","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","L","O","N"],"e19":["L","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N"],"e24":["L","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","N","O"],"e22":["N","N","N","N","N","N","N","O","D","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N","N","O","C/O"],"e14":["D","D","D","C/O","L","O","Ab","Ab","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e15":["O","D","D","D","C/O","C/O","C/O","O","N","N","N","N","N","N","O","D","D","D","D","L","O","N","N","N","N","N","N","N","O","D"],"e13":["N","N","O","D","HLF","L","L","D","HLF","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N"],"e10":["N","N","O","N","N","N","N","C/O","O","D","D","D","D","N","N","N","N","N","N","O","L","L","L","D","D","D","O","N","N","N"],"e12":["O","D","D","D","N","N","N","N","N","N","L","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N"],"e01":["D","D","D","D","D","D","C/O","C/O","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","D","D","C/O","C/O","O","D"],"e26":["D","D","D","O","D","D","D","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","N","N","N"],"e21":["D","D","D","O","D","D","D","D","O","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D"],"e04":["N","N","N","N","O","D","D","D","D","O","N","N","N","N","O","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e18":["L","C/O","C/O","C/O","L","L","L","O","L","D","D","D","D","N","N","N","N","N","Ab","Ab","O","D","D","D","D","D","D","O","N","N"],"e23":["L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","N","N","O","D","D","D","D","D","L","O"],"e03":["N","N","N","N","N","O","N","N","N","N","N","N","N","O","C/O","C/O","D","D","D","D","O","D","D","N","N","O","D","D","D","D"],"e08":["C/O","C/O","C/O","O","L","N","N","N","N","N","N","N","N","O","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e02":["D","O","D","N","N","N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","C/O","O","N","N","N","N","N"],"e09":["D","D","D","D","D","N","O","N","N","N","N","N","N","N","N","O","L","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e16":["G","D","D","D","D","D","D","D","L","O","L","L","L","D","D","D","O","N","N","N","N","N","Ab","O","D","D","D","D","D","D"],"e20":["G","D","D","D","D","D","D","N","N","N","N","N","O","D","D","D","N","N","C/O","O","N","N","N","N","N","N","O","D","D","D"]},"2025_10":{"e06":["D","D","D","D","O","D","C/O","D","D","GP","L","O","D","HLF","N","N","N","N","N","H","H","N","N","O","L","L","L","L","L","L","O"],"e05":["N","H","N","O","D","D","D","D","D","D","O","D","N","N","N","N","N","O","D","H","H","D","D","D","O","N","N","N","N","N","N"],"e25":["N","H","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","H","H","D","D","D","D","D","O","N","N","N","N"],"e19":["N","N","O","D","D","D","HLF","C/O","O","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","O","C/O","N","N","N","N","O"],"e24":["D","H","D","D","O","D","D","N","N","C/O","N","O","N","N","N","N","N","O","D","D","D","D","N","N","N","O","D","D","D","D","D"],"e22":["N","N","N","N","N","O","C/O","D","D","D","D","GP","O","D","D","D","D","D","O","H","H","N","N","N","N","N","O","D","D","D","D"],"e14":["D","D","D","O","C/O","N","N","N","N","N","O","D","D","D","D","D","L","O","N","N","N","N","N","N","O","HLF","C/O","C/O","L","L","L"],"e15":["D","D","D","D","D","O","D","D","D","C/O","D","N","O","GP","D","D","N","N","O","H","H","N","N","N","N","N","O","D","D","D","D"],"e13":["O","D","D","D","D","D","C/O","O","L","L","L","L","L","N","O","D","D","D","D","D","D","D","O","C/O","C/O","N","N","N","O","D","D"],"e10":["N","N","C/O","O","D","D","D","D","D","GP","O","N","N","N","N","N","N","N","O","H","H","C/O","D","D","O","D","D","D","D","D","D"],"e12":["O","D","D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D","H","H","D","D","O","D","D","D","D","L","L","O"],"e01":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","L","L","D","D","HLF","H","O","C/O","N","N","N","N","N","O","D","D","D"],"e26":["O","D","D","D","D","D","D","GP","O","N","N","N","N","N","N","O","D","D","C/O","N","N","N","O","D","D","D","D","D","D","O","N"],"e21":["D","D","HLF","O","C/O","N","N","N","N","N","N","N","N","O","N","N","N","N","N","H","D","GP","D","D","D","D","L","O","C/O","C/O","L"],"e04":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","HLF","O","H","H","L","L","O","C/O","N","N","N","N","N","N"],"e27":["D","H","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","C/O","C/O","L","L","L","L","O"],"e18":["D","D","D","L","L","L","O","GP","L","L","L","L","L","O","L","L","L","L","L","H","O","D","D","D","D","D","D","O","N","N","N"],"e23":["D","H","O","N","N","L","N","N","O","D","D","D","D","D","D","D","D","D","O","H","H","L","L","O","D","D","HLF","L","HLF","D","O"],"e03":["D","D","O","D","N","N","N","N","O","D","D","D","D","D","D","D","D","D","GP","H","H","C/O","C/O","O","N","N","N","N","N","N","O"],"e08":["N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","N","N","N","H","H","L","O","N","N","N","N","N","N","O","D"],"e02":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","N","N","C/O","O","C/O","C/O","C/O"],"e09":["O","N","N","N","N","N","N","O","D","D","D","C/O","D","L","O","N","N","N","N","H","H","O","D","D","D","D","D","D","O","N","N"],"e16":["N","N","N","O","N","N","N","N","N","N","O","D","D","GP","C/O","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e20":["N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e11":["","","","","","","","","","","","","","","","O","","","","","","","O","","","","","","","O",""]},"2025_11":{"e06":["O","N","N","N","N","N","L","N","N","O","D","D","GP","D","D","GP","O","D","D","D","N","N","N","N","N","N","N","N","N","N"],"e05":["O","D","D","D","D","D","D","O","C/O","D","N","N","N","N","N","O","D","D","D","D","D","O","L","N","N","N","N","N","O","D"],"e25":["N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","C/O","L","L","O","N","N","N","N","N","N","L"],"e19":["N","O","D","D","HLF","L","O","L","N","N","N","N","N","O","D","D","D","GP","L","L","O","N","N","N","L","N","N","N","O","D"],"e24":["L","O","C/O","C/O","L","L","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","GP","O"],"e22":["D","D","O","N","N","L","L","N","N","O","D","D","D","D","D","O","D","L","N","N","N","N","N","O","D","L","GP","D","D","D"],"e14":["O","N","N","N","N","N","N","N","O","L","L","L","L","L","O","L","L","L","L","L","Ab","Ab","N","N","N","N","N","N","N","N"],"e15":["D","HLF","O","D","D","D","D","D","D","O","D","D","D","D","N","N","O","N","N","N","N","N","N","O","D","D","D","L","L","L"],"e13":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","O","N","N","N","L","O","L","L","L","L"],"e10":["O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D"],"e12":["L","L","L","D","D","GP","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D"],"e01":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","GP","O"],"e26":["N","N","N","N","N","O","D","D","D","D","D","D","D","O","C/O","C/O","L","L","L","O","L","L","N","N","N","N","O","D","D","D"],"e21":["N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","N","O","D","D","D","D","D","O","D","D","D","N","N"],"e04":["O","D","D","D","D","D","D","O","D","D","D","D","D","C/O","O","N","N","N","N","N","N","O","D","D","D","GP","D","D","HLF","O"],"e27":["G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G"],"e18":["L","L","L","O","L","L","L","L","L","L","O","L","L","L","L","D","D","O","","","","","","","N","N","N","","",""],"e23":["D","D","D","D","D","HLF","O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","O","D","D","D","GP","O"],"e03":["N","N","N","N","N","N","O","D","D","D","D","D","GP","O","L","N","N","N","N","N","O","D","D","D","D","GP","D","O","D","D"],"e08":["D","D","D","D","D","D","D","D","D","D","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","O","C/O"],"e02":["D","D","D","GP","N","N","N","N","O","D","D","D","D","D","O","N","N","N","N","N","N","N","N","C/O","O","D","D","D","L","L"],"e09":["N","N","N","N","O","D","D","D","D","D","GP","O","N","N","N","N","N","N","O","D","D","L","L","L","L","O","N","N","N","N"],"e16":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e20":["D","D","D","D","D","D","O","N","N","N","N","N","N","N","N","O","C/O","D","D","D","D","D","D","D","D","D","D","O","D","D"],"e11":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D"]},"2025_12":{"e06":["N","C/O","C/O","O","Ab","Ab","N","N","N","N","N","N","N","O","N","Ab","D","D","D","N","N","O","D","D","D","D","D","O","D","D","GP"],"e05":["L","D","D","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","L","N","N","N","N","O","L","L","D","D"],"e25":["O","D","D","D","D","GP","D","O","N","N","N","N","N","N","O","GP","D","D","D","D","GP","O","N","N","N","N","N","N","N","O","L"],"e19":["D","D","D","D","D","D","D","D","D","D","GP","O","D","D","D","D","L","C/O","O","N","N","N","N","N","N","N","N","N","N","C/O","L"],"e24":["N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","N","N","C/O","O","D","D","D","D","D","D","O","D","D","D"],"e22":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","L","L","O","GP","L","D","L","L","D","L","L","D","D"],"e14":["N","N","N","N","N","N","N","N","C/O","D","D","D","D","L","O","C/O","N","N","N","N","N","Ab","N","N","N","N","O","D","D","D","D"],"e15":["O","L","L","L","L","L","L","O","D","D","D","D","O","N","N","N","N","N","N","N","N","N","N","N","N","Ab","Ab","Ab","O","N","N"],"e13":["L","L","O","L","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","D","O","D","D","D","D","N","O","N"],"e10":["D","D","D","D","D","O","L","L","N","N","N","N","N","O","D","D","D","D","GP","O","L","N","N","N","N","N","O","D","D","D","D"],"e12":["D","D","D","D","N","N","N","N","N","N","L","O","D","D","D","D","D","N","N","N","N","N","N","N","N","N","N","N","O","D","L"],"e01":["D","D","L","L","N","N","N","N","O","D","D","D","D","D","D","N","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D"],"e26":["D","N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","N","N","N","N","O","N","N","N","N","O","C/O"],"e21":["N","O","D","D","L","L","L","L","O","L","L","L","L","L","L","O","L","L","D","D","N","N","N","O","N","N","N","N","N","N","O"],"e04":["D","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D","D","D","D","GP","D","O","N","N","N","N","N"],"e27":["G","G","G","G","G","G","G","G","G","G","G","G","G","O","C/O","SL","G","G","G","G","G","G","G","G","O","G","G","G","G","G","G"],"e18":["O","D","D","D","D","D","D","D","O","L","D","D","N","O","D","D","D","L","D","D","D","D","O","D","D","D","D","GP","D","D","D"],"e23":["D","D","D","D","O","D","D","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","GP","HLF","O","L","L","L"],"e03":["D","N","N","N","O","D","D","D","D","O","D","D","N","N","N","N","O","D","D","D","D","D","D","D","D","D","D","D","GP","C/O","O"],"e08":["L","L","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","GP","L"],"e02":["L","L","L","O","N","N","N","O","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","N","N","N","N","L","O"],"e09":["O","D","GP","D","D","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","D"],"e16":["N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","O","N","N","N","L","L","C/O","O","L","L","L","L","L","N"],"e20":["D","D","C/O","L","O","L","L","L","L","L","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","D","D","D","D","N","O"],"e11":["D","D","N","N","O","D","D","D","D","D","O","D","D","D","D","D","N","O","N","N","N","N","N","N","O","D","D","GP","L","L","L"]},"2026_01":{"e06":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","L","N","N","N","O","L","GP","N","N","O","N","N","N","N","N","N"],"e05":["L","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","D"],"e25":["L","D","D","GP","O","N","N","N","L","N","N","O","D","GP","D","D","D","D","O","N","N","N","N","N","N","Ab","Ab","Ab","Ab","Ab","Ab"],"e19":["L","O","D","D","D","D","L","O","N","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D"],"e24":["D","D","C/O","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","H","N","N","N","N","N"],"e22":["D","D","D","D","O","N","N","N","N","N","N","O","D","GP","D","HLF","D","D","O","N","N","N","N","N","N","GP","O","D","D","D","D"],"e14":["D","L","O","N","N","N","N","N","N","O","D","D","D","D","D","L","O","N","N","N","N","N","N","N","O","H","N","N","N","N","N"],"e15":["N","N","N","N","O","N","N","N","L","N","N","O","D","D","D","D","D","D","D","D","D","D","D","D","HLF","D","GP","D","D","N","N"],"e13":["N","C/O","N","N","N","O","D","D","D","D","O","N","N","N","N","N","L","O","L","L","L","L","L","O","D","D","D","GP","D","D","O"],"e10":["N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","GP","C/O","N","N","N","O","D","D","D","D","D","C/O","O"],"e12":["L","D","D","D","D","D","N","N","N","N","N","O","D","D","D","D","D","C/O","O","N","N","N","N","N","N","O","D","GP","D","D","D"],"e01":["D","D","GP","C/O","C/O","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","GP","O","C/O","N","N","N"],"e26":["N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","N","N","O","GP","D","D","D","D","D","D","O","D","D","D"],"e21":["L","D","D","D","O","D","D","D","D","D","D","N","O","D","N","N","N","N","N","O","GP","D","D","D","D","D","D","O","D","D","D"],"e04":["N","O","D","D","D","D","D","GP","O","N","N","N","N","N","N","N","N","O","D","D","GP","D","O","N","N","N","N","N","N","O","D"],"e27":["G","O","G","G","G","G","G","G","O","G","G","G","G","G","C/O","O","C/O","G","G","G","G","G","O","L","G","G","G","G","G","O","C/O"],"e18":["D","Ab","D","O","D","D","D","D","D","D","O","L","L","D","N","Ab","Ab","Ab","Ab","N","N","O","D","D","D","GP","D","D","O","D","D"],"e23":["D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","D","H","O","D","D","D","D"],"e03":["L","L","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","GP","L","O","L","L","L","L","L","L","O","L","L","L"],"e08":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","GP","N","N","N","N","N","O","D","D","D","D","D","D","O","L","L"],"e02":["D","D","D","D","D","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","N","N","N","O","D","D","D"],"e09":["N","O","Ab","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","Ab","Ab","Ab","C/O","O"],"e16":["N","N","O","N","N","N","N","N","O","N","N","N","N","N","O","L","N","N","N","N","N","N","N","N","N","N","O","N","N","N","N"],"e20":["D","D","D","L","L","L","O","L","L","L","L","L","L","O","L","L","L","L","L","D","D","D","D","D","O","H","D","D","D","D","D"],"e11":["O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N"],"e17":["","","","","","","","","D","D","D","D","Ab","O","D","D","D","D","D","D","O","Ab","Ab","Ab","Ab","N","N","O","D","D","D"]},"2026_02":{"e06":["O","L","N","N","N","N","N","N","O","N","N","N","N","N","O","D","HLF","D","D","D","D","O","N","N","N","N","N","N"],"e05":["N","C/O","D","D","D","D","O","D","D","D","D","D","D","D","D","O","C/O","D","D","D","D","O","D","D","D","D","D","O"],"e25":["Ab","O","N","N","N","N","N","N","O","D","D","D","D","D","D","GP","O","N","N","N","N","N","O","C/O","GP","D","D","D"],"e19":["D","D","D","C/O","O","N","N","N","N","N","N","N","N","N","N","N","N","N","N","O","N","N","N","N","N","N","O","C/O"],"e24":["D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D","D","D","D","D","GP","N","N","N","N","N","N"],"e22":["N","N","O","D","D","D","D","D","L","O","D","D","D","GP","GP","O","N","N","N","N","N","O","D","D","D","D","D","D"],"e14":["O","GP","L","L","D","D","GP","O","N","N","N","N","N","N","N","O","Ab","N","N","O","N","N","N","N","N","N","O","N"],"e15":["N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","N","O","D","D","D","C/O","D","O","C/O","N","N","N","N"],"e13":["N","N","N","N","N","N","O","D","D","D","D","GP","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D"],"e10":["N","N","N","N","L","L","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D"],"e12":["D","D","D","O","L","L","N","L","O","L","L","L","N","N","N","N","N","N","N","N","N","N","O","C/O","D","D","D","D"],"e01":["N","N","O","D","D","D","D","D","D","D","D","D","D","L","L","O","D","D","D","D","D","D","D","O","N","N","N","N"],"e26":["N","N","N","N","N","N","N","N","N","N","O","D","D","D","N","N","N","O","D","D","HLF","C/O","L","O","L","L","L","L"],"e21":["D","O","D","D","N","N","N","N","O","N","N","N","N","N","O","D","D","D","C/O","D","D","N","N","N","N","N","N","N"],"e04":["HLF","L","D","D","D","D","D","N","N","N","N","N","C/O","C/O","O","L","L","L","N","N","N","N","N","N","N","N","O","D"],"e27":["G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","L","O","L"],"e18":["D","D","D","D","D","D","D","D","D","D","D","D","O","D","D","D","D","D","O","L","L","L","L","L","L","O","L","D"],"e23":["O","D","D","D","D","D","D","D","D","D","D","D","HLF","C/O","O","D","D","D","D","D","D","D","D","D","D","D","D","D"],"e03":["L","L","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e08":["C/O","C/O","N","N","O","D","D","D","L","L","L","N","N","N","N","N","N","N","O","L","L","D","D","D","D","D","O","N"],"e02":["D","D","D","D","N","N","C/O","L","L","L","O","L","L","L","L","L","N","N","N","N","N","N","N","N","N","O","D","L"],"e09":["L","Ab","O","D","D","O","N","N","N","N","N","N","O","D","D","D","D","C/O","C/O","O","N","N","N","N","N","N","N","O"],"e16":["N","N","O","D","D","D","D","D","HLF","O","C/O","C/O","L","N","N","N","O","N","N","N","N","N","N","O","D","N","N","N"],"e20":["O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D"],"e11":["N","N","N","N","N","O","D","D","D","D","C/O","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N"],"e17":["GP","N","N","N","N","O","N","N","N","N","O","D","D","D","HLF","D","D","O","D","D","D","D","D","C/O","O","Ab","Ab","Ab"],"e07":["","","","","","","","","","","","","","","","","","","","D","D","D","D","D","D","D","D","D"]},"2026_03":{"e06":["O","L","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"],"e05":["D","N","N","N","N","N","O","D","D","D","D","L","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e25":["D","O","N","N","N","N","N","N","N","O","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e19":["N","N","N","N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","C/O","O","L","L","N","N","N","N","O","N","N","N","L"],"e24":["O","D","D","H","D","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"],"e22":["D","O","N","N","L","L","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D"],"e14":["N","N","N","N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","L","D","D","D","D","D","D","D","O","N","N"],"e15":["L","O","D","H","D","D","D","D","O","L","L","L","L","L","L","O","L","L","L","L","N","N","O","N","N","N","N","N","N","O","D"],"e13":["D","O","N","N","N","N","O","D","D","D","D","D","N","O","D","D","D","D","D","N","N","N","N","N","N","N","N","O","D","D","N"],"e10":["N","N","C/O","H","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e12":["N","O","N","L","L","L","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e01":["N","N","O","D","D","D","D","D","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","C/O","C/O","C/O","O","D"],"e26":["N","N","N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N"],"e21":["O","D","D","D","D","D","HLF","O","C/O","C/O","L","L","L","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N"],"e04":["D","D","D","D","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e27":["G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G"],"e18":["D","D","GP","D","O","L","L","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D"],"e23":["O","D","D","H","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D"],"e03":["GP","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e08":["N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e02":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e09":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e16":["N","N","O","D","D","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","N","O","D","D","D","D","D","D","O"],"e20":["O","D","D","D","D","D","D","O","D","N","C/O","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D"],"e11":["N","N","N","N","N","O","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e17":["Ab","D","D","D","GP","N","O","D","D","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","N","N","N","N","N","N","N"],"e07":["D","GP","C/O","H","D","D","D","O","D","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"]},"2026_04":{"e06":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e05":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e25":["N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e19":["L","L","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N"],"e24":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e22":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e14":["N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","O","N","N","N","N"],"e15":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e13":["N","N","N","O","D","D","D","D","D","N","O","D","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","N","N","N"],"e10":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e12":["N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e01":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"],"e26":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e21":["N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N"],"e04":["D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e27":["G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G"],"e18":["D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O"],"e23":["D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D"],"e03":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e08":["N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e02":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e09":["D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e16":["D","D","N","N","N","N","O","N","N","N","N","O","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N"],"e20":["D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D"],"e11":["N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e17":["N","N","N","O","D","D","D","D","D","D","D","D","O","D","D","D","D","N","N","N","N","O","N","N","N","N","N","D","D","D"],"e07":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"]}};

const _FIXED_STATUS_CODES=new Set(['O','L','C/O','G','GP','HLF','Ab','H','OD','']);
function _discoverAllShiftCodes(allEmps, cfgShifts){
  const result=[...cfgShifts];
  const known=new Set(cfgShifts.map(s=>s.code));
  const extra=new Set();
  allEmps.forEach(e=>{
    if(Array.isArray(e.ms)){
      e.ms.forEach(v=>{
        if(v && !_FIXED_STATUS_CODES.has(v) && !known.has(v)) extra.add(v);
      });
    }
  });
  extra.forEach(code=>result.push({code,label:code}));
  return result;
}

/** Base roster shift from schedule/Excel only — ignores overrides (used for holiday duty check). */
function getBaseShift(emp, dateStr){
  if(!emp || !dateStr) return '';
  try{ if(typeof _isBeforeJoining==='function' && _isBeforeJoining(emp, dateStr)) return ''; }catch(e){}
  const d=new Date(dateStr+'T12:00:00');
  const monthKey = dateStr.substring(0,7).replace('-','_');
  const dayIdx = d.getDate()-1;
  function rowVal(row){
    if(row == null) return null;
    // Array or Firebase object {0:'D',1:'N',...}
    if(Array.isArray(row)) return row[dayIdx];
    if(typeof row === 'object'){
      const v = row[dayIdx] != null ? row[dayIdx] : row[String(dayIdx)];
      return v;
    }
    return null;
  }
  function fbLookup(sched){
    if(!sched) return null;
    if(emp.id && sched[emp.id] != null) return sched[emp.id];
    if(emp.empId && sched[String(emp.empId).trim()] != null) return sched[String(emp.empId).trim()];
    // loose match on emp code without leading zeros difference
    if(emp.empId){
      const code = String(emp.empId).trim().replace(/^0+/,'');
      for(const k of Object.keys(sched)){
        if(String(k).replace(/^0+/,'') === code) return sched[k];
      }
    }
    return null;
  }
  const fbSched = getSchedules()[monthKey];
  const fbRow = fbLookup(fbSched);
  if(fbRow != null){
    const val = rowVal(fbRow);
    if(val === null || val === undefined || val === '') return '';
    return val;
  }
  if(typeof EXCEL_SCHEDULES!=='undefined' && EXCEL_SCHEDULES[monthKey]){
    const exRow = fbLookup(EXCEL_SCHEDULES[monthKey]);
    if(exRow != null){
      const val = rowVal(exRow);
      if(val === '' || val === null || val === undefined) return '';
      return val;
    }
    return '';
  }
  return '';
}

function _normalizeOverrideShift(val){
  if(val == null || val === '') return '';
  const s = String(val).trim();
  // Leave stored as "L:EL", "L:CL", "L:Emergency" etc. → treat as Leave
  if(/^L([:\-_].*)?$/i.test(s)) return 'L';
  if(/^C\/?O$/i.test(s) || /^CO$/i.test(s)) return 'C/O';
  if(/^HOLIDAY$/i.test(s)) return 'H';
  return s;
}

/** Resolve shift for emp on dateStr.
 * Priority: 1) overrides (Firebase)  2) approved leave  3) Excel/base schedule
 * Override ALWAYS wins — including L — so Manager mark Leave is visible on schedule.
 */
function getShift(emp, dateStr){
  if(!emp || !dateStr) return '';
  const ov = getOverrides() || {};
  const keys = [];
  if(emp.id) keys.push(emp.id+'_'+dateStr);
  if(emp.empId) keys.push(String(emp.empId)+'_'+dateStr);
  // Also try SESSION-style and string id variants
  if(emp._key) keys.push(emp._key+'_'+dateStr);

  for(const k of keys){
    if(ov[k] != null && ov[k] !== ''){
      return _normalizeOverrideShift(ov[k]);
    }
  }
  // Scan all override keys ending with _dateStr matching this emp (id or empCode)
  try{
    const suffix = '_'+dateStr;
    const idSet = new Set([String(emp.id||''), String(emp.empId||''), String(emp._key||'')].filter(Boolean));
    for(const [k,v] of Object.entries(ov)){
      if(!k || !k.endsWith(suffix) || v==null || v==='') continue;
      const prefix = k.slice(0, -suffix.length);
      if(idSet.has(prefix)) return _normalizeOverrideShift(v);
    }
  }catch(e){}

  // 2) Approved leave (match emp.id OR emp.empId — leaves were saved with either)
  // IMPORTANT: skip credit-only C-Off records (holiday duty grants / double-shift earnings).
  // Those increase balance but must NOT paint the calendar day as Leave — the real roster
  // (Excel/Firebase schedule) should still show D/N/G/O/H on that date.
  try{
    const leaves = (typeof getLeaves==='function' ? getLeaves() : []) || [];
    const idSet = new Set([String(emp.id||''), String(emp.empId||'')].filter(Boolean));
    const onLeave = leaves.find(l=>{
      if(!l || l.status!=='approved') return false;
      if(!idSet.has(String(l.empId||'')) && !idSet.has(String(l.empObjId||''))) return false;
      if(!l.from || !l.to) return false;
      if(l.from>dateStr || l.to<dateStr) return false;
      // credit:true = earned C-Off (not a day off taken) — ignore for schedule display
      if(l.credit === true || l.credit === 'true' || l.credit === 1) return false;
      // autoGenerated holiday/double grants sometimes only set reason, still credit-like
      if(l.autoGenerated && (l.type==='CO' || /C-?Off|Comp/i.test(String(l.leaveType||''))) &&
         /Holiday list|worked on|double.?shift|C-Off \+1/i.test(String(l.reason||''))) return false;
      return true;
    });
    if(onLeave){
      // Taken C-Off day should show as C/O when leave type is compensatory
      if(onLeave.type==='CO' || /C-?Off|Comp/i.test(String(onLeave.leaveType||''))) return 'C/O';
      return 'L';
    }
  }catch(e){}

  // 3) Before joining date → no shift (blank, not Off)
  try{
    if(_isBeforeJoining(emp, dateStr)) return '';
  }catch(e){}

  // 4) Base uploaded Excel / Firebase schedules
  return getBaseShift(emp, dateStr) || '';
}

/** Single source of truth — schedule, My Shift, picker */
window.MP_SHIFT_COLORS = {
  D:{bg:'#f59e0b',fg:'#000'}, N:{bg:'#4f46e5',fg:'#fff'},
  A:{bg:'#16a34a',fg:'#fff'}, B:{bg:'#db2777',fg:'#fff'}, C:{bg:'#0891b2',fg:'#fff'},
  O:{bg:'#475569',fg:'#fff'}, L:{bg:'#be123c',fg:'#fff'}, G:{bg:'#0284c7',fg:'#fff'},
  'C/O':{bg:'#92400e',fg:'#fde68a'}, CO:{bg:'#92400e',fg:'#fde68a'},
  H:{bg:'#ea580c',fg:'#fff'}, HLF:{bg:'#ea580c',fg:'#fff'},
  OD:{bg:'#0d9488',fg:'#ccfbf1'}, GP:{bg:'#6d28d9',fg:'#e9d5ff'},
  Ab:{bg:'#7f1d1d',fg:'#fca5a5'}
};


/** Force D/N/G badge colours identical on Home + Schedule (overrides any theme drift) */
function _forceShiftBadgeColors(){
  if(document.getElementById('mpShiftColorLock')) return;
  const s = document.createElement('style');
  s.id = 'mpShiftColorLock';
  s.textContent = `
    /* FONT colours locked to match Schedule exactly */
    .shc.D, .shc.shc-sm.D, .hm-chip .shc.D, .hm-chip-meta .shc.D, .hm-chips .shc.D,
    .sched-tbl .shc.D, .ms-day-sh.shc.D, span.shc.D {
      background: #f59e0b !important;
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
    }
    .shc.N, .shc.shc-sm.N, .hm-chip .shc.N, .hm-chip-meta .shc.N, .hm-chips .shc.N,
    .sched-tbl .shc.N, .ms-day-sh.shc.N, span.shc.N {
      background: #4f46e5 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .shc.G, .shc.shc-sm.G, .hm-chip .shc.G, .hm-chip-meta .shc.G, .hm-chips .shc.G,
    .sched-tbl .shc.G, .ms-day-sh.shc.G, span.shc.G {
      background: #0284c7 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .hm-shift-badge.D, .hm-shift-badge.D .hm-shift-letter, .hm-shift-badge.D .hm-shift-word {
      background: #f59e0b !important; color: #000000 !important; -webkit-text-fill-color: #000000 !important;
    }
    .hm-shift-badge.N, .hm-shift-badge.N .hm-shift-letter, .hm-shift-badge.N .hm-shift-word {
      background: #4f46e5 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;
    }
    .hm-shift-badge.G, .hm-shift-badge.G .hm-shift-letter, .hm-shift-badge.G .hm-shift-word {
      background: #0284c7 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;
    }
    /* Prevent parent .hm-chip-meta muted colour from leaking onto badge letters */
    .hm-chip-meta .shc.D, .hm-chips .shc.D { -webkit-text-fill-color: #000000 !important; color: #000000 !important; }
    .hm-chip-meta .shc.N, .hm-chips .shc.N { -webkit-text-fill-color: #ffffff !important; color: #ffffff !important; }
    .hm-chip-meta .shc.G, .hm-chips .shc.G { -webkit-text-fill-color: #ffffff !important; color: #ffffff !important; }
  `;
  document.head.appendChild(s);
}
try{ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', _forceShiftBadgeColors); else _forceShiftBadgeColors(); }catch(e){}


/** One badge HTML for Home + Schedule + My Shift — identical colours always */
function mpShiftBadgeHtml(code, opts){
  opts = opts || {};
  const disp = (typeof cellDisp==='function' ? cellDisp(code) : code) || '';
  const st = (typeof mpShiftStyle==='function') ? mpShiftStyle(disp||code) : {bg:'#475569',fg:'#fff'};
  const cls = (typeof cellClass==='function' ? cellClass(code) : '') || '';
  const w = opts.w || 28;
  const h = opts.h || 24;
  const fs = opts.fs || 13;
  const extra = opts.extraStyle || '';
  // Font colour MUST match Schedule: D=#000 black, N/G=#fff white (never inherit parent muted colour)
  return '<span class="shc shc-sm '+cls+'" data-shift="'+String(cls).replace(/"/g,'')+'" style="'+
    'background:'+st.bg+' !important;'+
    'color:'+st.fg+' !important;'+
    '-webkit-text-fill-color:'+st.fg+' !important;'+
    'width:'+w+'px !important;height:'+h+'px !important;min-width:'+w+'px !important;'+
    'font-size:'+fs+'px;border-radius:7px;'+
    'display:inline-flex;align-items:center;justify-content:center;font-weight:900;'+
    'font-family:\'Barlow Condensed\',sans-serif;line-height:1;box-sizing:border-box;'+
    'border:1px solid rgba(0,0,0,.12);box-shadow:0 1px 2px rgba(0,0,0,.18);'+
    extra+'">'+
    String(disp).replace(/</g,'&lt;')+'</span>';
}

function mpShiftStyle(code){
  let k = String(code||'').trim();
  if(/^L[:\-_]/i.test(k)) k = 'L';
  if(k==='CO' || k==='C/O') k = 'C/O';
  const c = window.MP_SHIFT_COLORS[k] || window.MP_SHIFT_COLORS[k.toUpperCase()];
  if(c) return c;
  if(String(code||'').indexOf('+')>=0) return {bg:'#7c3aed',fg:'#fff'};
  return {bg:'#1e293b',fg:'#94a3b8'};
}

/** Canonical work/status shift code for display & CSS classes.
 * Fixes corrupt codes (e.g. "To"/"Te" shown for A Shift from bad config/i18n). */
function normalizeShiftCode(code, label){
  let raw = String(code == null ? '' : code).trim();
  const lab = String(label == null ? '' : label).trim();
  if(!raw && lab){
    const L = lab.toUpperCase();
    if(/\bA\s*SHIFT\b/.test(L) || /^A\b/.test(L)) return 'A';
    if(/\bB\s*SHIFT\b/.test(L) || /^B\b/.test(L)) return 'B';
    if(/\bC\s*SHIFT\b/.test(L) || /^C\b/.test(L)) return 'C';
    if(/\bDAY\b/.test(L)) return 'D';
    if(/\bNIGHT\b/.test(L)) return 'N';
  }
  if(!raw) return '';
  if(/^L([:\-_].*)?$/i.test(raw)) return 'L';
  if(raw === 'C/O' || raw.toUpperCase() === 'CO' || raw.toUpperCase() === 'C-OFF') return 'C/O';
  const u = raw.toUpperCase();
  // Standard codes
  if(u === 'D' || u === 'N' || u === 'A' || u === 'B' || u === 'C') return u;
  if(u === 'O' || u === 'G' || u === 'GP' || u === 'H' || u === 'OD' || u === 'HLF') return u === 'HLF' ? 'HLF' : u;
  if(u === 'AB' || raw === 'Ab') return 'Ab';
  // Corrupt / i18n-leaked codes seen for A Shift legend ("To", "Te")
  if(u === 'TO' || u === 'TE' || u === 'TA' || u === 'AS'){
    if(!lab || /\bA\b/i.test(lab) || /SHIFT/i.test(lab)) return 'A';
  }
  // Label overrides bad code
  if(lab){
    const L = lab.toUpperCase();
    if(/\bA\s*SHIFT\b/.test(L)) return 'A';
    if(/\bB\s*SHIFT\b/.test(L)) return 'B';
    if(/\bC\s*SHIFT\b/.test(L)) return 'C';
    if(/\bDAY\s*SHIFT\b/.test(L)) return 'D';
    if(/\bNIGHT\s*SHIFT\b/.test(L)) return 'N';
  }
  return raw;
}

function cellClass(s){
  if(!s) return 'blank';
  const raw0 = String(s).trim();
  if(/^L([:\-_].*)?$/i.test(raw0)) return 'L';
  if(raw0.indexOf('+')>=0 || (typeof parseShiftWorkCodes==='function' && parseShiftWorkCodes(raw0).length>1)) return 'G';
  const raw = normalizeShiftCode(raw0);
  const m={'D':'D','N':'N','A':'A','B':'B','C':'C','O':'O','L':'L','C/O':'CO','CO':'CO','G':'G','GP':'GP','HLF':'HLF','H':'H','Ab':'Ab','OD':'OD'};
  return m[raw]||m[String(raw).toUpperCase()]||'O';
}

function cellDisp(s){
  if(!s) return '';
  const raw0 = String(s).trim();
  if(/^L([:\-_].*)?$/i.test(raw0)) return 'L';
  if(raw0.indexOf('+')>=0) return raw0;
  const raw = normalizeShiftCode(raw0);
  const m={'D':'D','N':'N','A':'A','B':'B','C':'C','O':'O','L':'L','C/O':'CO','CO':'CO','G':'G','GP':'GP','HLF':'½','H':'H','Ab':'Ab','OD':'OD'};
  return m[raw]||m[String(raw).toUpperCase()]||raw||'';
}
try{ window.normalizeShiftCode=normalizeShiftCode; window.cellClass=cellClass; window.cellDisp=cellDisp; }catch(e){}


/** Short word for shift code — Home calendar labels (EN/HI) */
function shiftWord(s){
  if(!s) return '';
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const key = (s === 'C/O') ? 'CO' : s;
  const mapEn = {D:'Day',N:'Night',O:'Off',L:'Leave',G:'Gen',GP:'GP',CO:'C-Off','C/O':'C-Off',H:'Hol',HLF:'Half',Ab:'Abs',OD:'OD',A:'A-Sh',B:'B-Sh',C:'C-Sh'};
  const mapHi = {D:'दिन',N:'रात',O:'ऑफ',L:'छुट्टी',G:'जनरल',GP:'GP',CO:'C-Off','C/O':'C-Off',H:'हॉलिडे',HLF:'आधा',Ab:'अनुप',OD:'OD',A:'A शिफ्ट',B:'B शिफ्ट',C:'C शिफ्ट'};
  return (en ? mapEn : mapHi)[key] || key;
}
/** Colored badge HTML: letter + short word (for Home day cards) — SAME colours as Schedule */
function shiftBadgeHtml(s, size){
  const code = cellDisp(s) || '—';
  const word = shiftWord(s) || (code === '—' ? '—' : code);
  const cls = cellClass(s) || 'blank';
  const sizeCls = size === 'lg' ? ' hm-today-badge' : '';
  const st = (typeof mpShiftStyle === 'function') ? mpShiftStyle(code === '—' ? '' : (s || code)) : {bg:'#475569',fg:'#fff'};
  // Inline colours from MP_SHIFT_COLORS so Home always matches Schedule (ignore CSS drift)
  return `<div class="hm-shift-badge ${cls}${sizeCls}" title="${code} ${word}" style="background:${st.bg} !important;border-color:transparent">
    <span class="hm-shift-letter" style="color:${st.fg} !important">${code}</span>
    <span class="hm-shift-word" style="color:${st.fg} !important;opacity:.95">${word}</span>
  </div>`;
}

function getShiftTimingStripHtml(){
  const cfg=getShiftConfigSync();
  const byCode={};
  (cfg.shifts||[]).forEach(s=>{ if(s&&s.code) byCode[String(s.code).toUpperCase()]=s; });
  const order=['D','N','A','B','C'];
  // Prefer showing only active (Auto) shifts under section; if none flagged, show all configured
  let codes = order.filter(c=>{
    const s=byCode[c];
    return s && s.active!==false;
  });
  if(!codes.length) codes = order.filter(c=>byCode[c]);
  if(!codes.length) codes = getActiveRotationCodes();
  const bits=codes.map(code=>{
    const s=byCode[code]||{code,label:code};
    const t=(s.start&&s.end)?`${s.start}–${s.end}`:'';
    return `<span class="shc ${cellClass(code)}" style="width:auto;min-width:22px;height:18px;padding:0 5px;font-size:10px;margin-right:2px">${code}</span><span style="font-size:10px;color:var(--muted2);margin-right:10px">${s.label||code}${t?' · '+t:''}</span>`;
  }).join('');
  return `<div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:2px 0;opacity:.95">${bits}</div>`;
}


// ── Joining date (YYYY-MM-DD) from employee record ──
function getJoiningDate(emp){
  if(!emp) return null;
  const raw = emp.joiningDate || emp.doj || emp.joinDate || emp.dateOfJoining || '';
  if(!raw) return null;
  try{
    if(/^\d{4}-\d{2}-\d{2}/.test(String(raw))) return String(raw).slice(0,10);
    const d = new Date(raw);
    if(isNaN(d.getTime())) return null;
    // local date parts avoid UTC shift
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    if(y < 1990 || y > 2100) return null;
    return y+'-'+m+'-'+day;
  }catch(e){ return null; }
}

/** True if calendar date is strictly before employee joining date */
function _isBeforeJoining(emp, dateStr){
  const jd = getJoiningDate(emp);
  if(!jd || !dateStr) return false;
  return String(dateStr).slice(0,10) < jd;
}

/**
 * Clear schedule cells before joining date (and optionally blank out bogus continuous empties).
 * Mutates array in place; returns number of cells cleared.
 */
function _sanitizeShiftRow(arr, emp, year, month){
  if(!Array.isArray(arr) && !(arr && typeof arr==='object')) return 0;
  let cleared = 0;
  const jd = getJoiningDate(emp);
  const days = (year && month) ? new Date(year, month, 0).getDate() : (Array.isArray(arr)?arr.length:31);
  for(let i=0;i<days;i++){
    const key = Array.isArray(arr) ? i : String(i);
    const val = arr[key];
    if(val == null || val === '') continue;
    if(jd && year && month){
      const ds = year+'-'+String(month).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');
      if(ds < jd){
        if(Array.isArray(arr)) arr[i] = '';
        else arr[key] = '';
        cleared++;
      }
    }
  }
  return cleared;
}

/** Run joining-date cleanup across all cached month schedules; optionally persist */
async function sanitizeSchedulesBeforeJoining(opts){
  opts = opts || {};
  const emps = (typeof getEmps==='function'?getEmps():[]) || [];
  const byId = {};
  emps.forEach(e=>{
    if(!e) return;
    if(e.id) byId[e.id] = e;
    if(e.empId) byId[String(e.empId)] = e;
  });
  const scheds = (typeof getSchedules==='function'?getSchedules():null) || _cache.schedules || {};
  let total = 0;
  Object.keys(scheds).forEach(mk=>{
    const m = String(mk).match(/(\d{4})[_-](\d{1,2})/);
    if(!m) return;
    const year = +m[1], month = +m[2];
    const monthObj = scheds[mk];
    if(!monthObj || typeof monthObj!=='object') return;
    Object.keys(monthObj).forEach(empKey=>{
      const emp = byId[empKey] || byId[String(empKey)] || emps.find(e=>e.id===empKey||String(e.empId)===String(empKey));
      if(!emp || !getJoiningDate(emp)) return;
      const row = monthObj[empKey];
      total += _sanitizeShiftRow(row, emp, year, month);
    });
  });
  // Also sanitize hardcoded EXCEL_SCHEDULES in memory
  try{
    if(typeof EXCEL_SCHEDULES!=='undefined'){
      Object.keys(EXCEL_SCHEDULES).forEach(mk=>{
        const m = String(mk).match(/(\d{4})[_-](\d{1,2})/);
        if(!m) return;
        const year = +m[1], month = +m[2];
        const monthObj = EXCEL_SCHEDULES[mk];
        Object.keys(monthObj||{}).forEach(empKey=>{
          const emp = byId[empKey] || emps.find(e=>e.id===empKey||String(e.empId)===String(empKey));
          if(!emp || !getJoiningDate(emp)) return;
          total += _sanitizeShiftRow(monthObj[empKey], emp, year, month);
        });
      });
    }
  }catch(e){}
  if(opts.persist && total > 0 && typeof fbSet==='function'){
    try{
      // persist each month key under schedules path used by app
      const root = (_cache && _cache._schedulesPath) || 'schedules';
      for(const mk of Object.keys(scheds)){
        try{ await fbSet(root+'/'+mk, scheds[mk]); }catch(e){}
      }
    }catch(e){ console.warn('[sanitize persist]', e); }
  }
  return total;
}

function isWorking(s){ return ['D','N','G','GP'].includes(s); }
function isManPowerCompanyUser(){ return isAdmin() || SESSION.company === 'Man Power' || SESSION.company === '' || !SESSION.company || SESSION.approved === true; }

// ════════════════════════════════════════
// HOME / OVERVIEW
// ════════════════════════════════════════


/** Normalize shift code for counting */
/** Status / special codes shown in schedule summary under Leave */
function _scheduleStatusLegendDefs(){
  const en = (typeof _lang!=='undefined' && _lang!=='hi');
  return [
    {code:'L',   label: en?'Leave':'Leave',       icon:'🏖️', clr:'#f43f5e', bg:'rgba(244,63,94,.06)'},
    {code:'O',   label: en?'Weekly Off':'W-Off',   icon:'😴', clr:'#64748b', bg:'rgba(100,116,139,.08)'},
    {code:'C/O', label: en?'C-Off':'C-Off',        icon:'🔄', clr:'#92400e', bg:'rgba(146,64,14,.08)'},
    {code:'H',   label: en?'Holiday':'Holiday',    icon:'🎉', clr:'#ea580c', bg:'rgba(234,88,12,.08)'},
    {code:'Ab',  label: en?'Absent':'Absent',      icon:'🚫', clr:'#991b1b', bg:'rgba(153,27,27,.1)'},
    {code:'GP',  label: en?'Gate Pass':'Gate Pass',icon:'🪪', clr:'#9333ea', bg:'rgba(147,51,234,.08)'},
    {code:'OD',  label: en?'Other Dept':'Other Dept', icon:'🏢', clr:'#0d9488', bg:'rgba(13,148,136,.08)'},
    {code:'HLF', label: en?'Half Day':'Half Day',  icon:'½',  clr:'#c2410c', bg:'rgba(194,65,12,.08)'},
    {code:'G',   label: en?'General':'General',    icon:'⚙️', clr:'#0284c7', bg:'rgba(2,132,199,.08)'},
  ];
}

/** Count employees per shift code for one date. Returns {code: count} */
function _countShiftCodesForDate(emps, dateStr){
  const counts = {};
  (emps||[]).forEach(e=>{
    try{
      let sh = (typeof getShift==='function') ? getShift(e, dateStr) : '';
      sh = _normShiftCode(sh);
      if(!sh) return;
      counts[sh] = (counts[sh]||0) + 1;
    }catch(err){}
  });
  return counts;
}

function _shiftCodeMatches(cellSh, code){
  const a = _normShiftCode(cellSh);
  const b = _normShiftCode(code);
  if(!a || !b) return false;
  if(a === b) return true;
  if(typeof shiftCountsToward==='function' && shiftCountsToward(cellSh, code)) return true;
  return false;
}

function _homeTodaySummaryHtml(){
  try{
    const emps = (typeof getEmps==='function' ? getEmps() : []).filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
    let ymd = '';
    try{
      if(typeof TODAY_STR==='string' && TODAY_STR) ymd = TODAY_STR;
      else {
        const today = (typeof TODAY_DATE!=='undefined' && TODAY_DATE) ? TODAY_DATE : new Date();
        ymd = today.toISOString().slice(0,10);
      }
    }catch(e){ ymd = new Date().toISOString().slice(0,10); }

    const counts = _countShiftCodesForDate(emps, ymd);
    const total = emps.length;
    const en = (typeof _lang!=='undefined' && _lang!=='hi');

    // Preferred display order
    const order = ['D','N','G','A','B','C','O','L','C/O','H','Ab','GP','OD','HLF'];
    const labels = {
      D: en?'on D Shift':'D शिफ्ट', N: en?'on N Shift':'N शिफ्ट', G: en?'on G Shift':'G शिफ्ट',
      A: en?'on A Shift':'A शिफ्ट', B: en?'on B Shift':'B शिफ्ट', C: en?'on C Shift':'C शिफ्ट',
      O: en?'on W-Off':'W-Off', L: en?'On Leave':'Leave', 'C/O': en?'on C-Off':'C-Off',
      H: en?'on Holiday':'Holiday', Ab: en?'Absent':'Absent', GP: en?'Gate Pass':'GP',
      OD: en?'Other Dept':'OD', HLF: en?'Half Day':'Half'
    };
    const colors = {
      D:'#f59e0b', N:'#4f46e5', G:'#0284c7', A:'#16a34a', B:'#db2777', C:'#0891b2',
      O:'#64748b', L:'#f43f5e', 'C/O':'#92400e', H:'#ea580c', Ab:'#991b1b', GP:'#9333ea', OD:'#0d9488', HLF:'#c2410c'
    };

    // Collect non-zero codes (known order first, then any extras)
    const seen = new Set();
    const cards = [];
    order.forEach(code=>{
      const n = counts[code] || 0;
      if(n <= 0) return;
      seen.add(code);
      cards.push({code, n, label: labels[code]||code, color: colors[code]||'#64748b'});
    });
    Object.keys(counts).forEach(code=>{
      if(seen.has(code) || !counts[code]) return;
      cards.push({code, n: counts[code], label: code, color:'#64748b'});
    });

    const lblTotal = en ? 'Total Man' : 'कुल';
    const cardStyle = 'flex:1 1 88px;min-width:88px;max-width:140px;padding:10px 12px;border-radius:12px;background:var(--card);border:1px solid var(--border2);text-align:center';
    const valStyle = 'font-size:22px;font-weight:900;line-height:1.15;font-family:Barlow Condensed,sans-serif';
    const lblStyle = 'font-size:11px;font-weight:700;color:var(--muted2);margin-top:2px';
    let html = `<div class="today-summary today-summary-split" style="display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px" aria-label="Today shift split">
      <div class="today-summary-card" style="${cardStyle}"><div class="today-summary-val" style="${valStyle};color:var(--green)">${total}</div><div class="today-summary-lbl" style="${lblStyle}">${lblTotal}</div></div>`;
    cards.forEach(c=>{
      html += `<div class="today-summary-card" style="${cardStyle}"><div class="today-summary-val" style="${valStyle};color:${c.color}">${c.n}</div><div class="today-summary-lbl" style="${lblStyle}">${c.label}</div></div>`;
    });
    html += `</div>`;
    return html;
  }catch(e){ console.warn('[home summary]', e); return ''; }
}


async function renderHome(){
  try{
    let host = document.getElementById('homeTodaySummary');
    if(!host){
      const tab = document.getElementById('tab-home');
      if(tab){
        host = document.createElement('div');
        host.id = 'homeTodaySummary';
        tab.insertBefore(host, tab.firstChild);
      }
    }
    if(host) host.innerHTML = _homeTodaySummaryHtml();
  }catch(e){}

  try{ if(typeof _forceShiftBadgeColors==='function') _forceShiftBadgeColors(); }catch(e){}
  if(typeof isPendingMember==='function' && isPendingMember()){
    try{
      const roster = document.getElementById('homeRoster');
      if(roster) roster.innerHTML = `<div class="hm-empty" style="padding:14px;margin:8px 0;border-radius:12px;border:1px dashed rgba(234,179,8,.5);background:rgba(234,179,8,.08)">
        <div style="font-weight:900;color:var(--text);margin-bottom:6px">⏳ Manager approval pending</div>
        <div style="font-size:12px;color:var(--muted2);line-height:1.5">आप Manager की approval का इंतज़ार कर रहे हैं। अभी सिर्फ <b>अपनी शिफ्ट</b>, <b>Learn &amp; Grow</b> और <b>To-Do</b> उपलब्ध हैं। Team schedule / Leave / Reports Manager approve के बाद खुलेंगे।</div>
      </div>`;
    }catch(e){}
  }

  const emps=getEmps().filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length > 0);
  const stillLoading = _cache.employees === null;
  const en = (_lang !== 'hi');

  // Always show BOTH blocks (same Home for Manager + Individual)
  const adminEl = document.getElementById('homeAdminView');
  const workerEl = document.getElementById('homeWorkerView');
  if(adminEl) adminEl.style.display='block';
  // Personal 3/14 calendar removed — My Shift tab only
  if(workerEl) workerEl.style.display='none';

  document.getElementById('homeDateLbl').textContent =
    TODAY_DATE.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  if(!emps || emps.length===0){
    document.getElementById('homeStats').innerHTML=`
      <div class="stat-card"><div class="stat-val" style="color:var(--muted)">...</div><div class="stat-lbl" id="dayStatLbl">${en?'Day Shift':'दिन शिफ्ट'}</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--muted)">...</div><div class="stat-lbl" id="nightStatLbl">${en?'Night Shift':'रात शिफ्ट'}</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--muted)">...</div><div class="stat-lbl" id="leaveStatLbl">${en?'On Leave':'छुट्टी पर'}</div></div>`;
    if(stillLoading){
      document.getElementById('homeSections').innerHTML='<div style="text-align:center;padding:20px;color:var(--muted2)">🔄 '+(en?'Loading data from Firebase...':'Firebase से डेटा लोड हो रहा है...')+'</div>';
      if(!window._empLoadWatch){
        window._empLoadWatch = setTimeout(()=>{
          if(_cache.employees === null){
            _cache.employees = [];
            console.warn('[home] employees load timeout — showing empty');
            try{ renderHome(); }catch(e){}
          }
        }, 8000);
      }
    } else {
      document.getElementById('homeSections').innerHTML=`<div style="text-align:center;padding:30px 16px;color:var(--muted2)">
        <div style="font-size:36px;margin-bottom:10px">👥</div>
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px">${en?'Team data not available yet':'अभी Team डेटा उपलब्ध नहीं'}</div>
      </div>`;
    }
    document.getElementById('homeRoster').innerHTML='';
    // Still try personal calendar
    try{ _renderHomePersonalCalendar(); }catch(e){}
    try{ updateHomeTodoSummary(); }catch(e){}
    return;
  }

  // ════════════════════════════════════════
  // 1) MANPOWER SUMMARY — same for all users
  // ════════════════════════════════════════
  document.getElementById('homeNotice').innerHTML='';

  const dayE=emps.filter(e=>getShift(e,TODAY_STR)==='D').length;
  const nE  =emps.filter(e=>getShift(e,TODAY_STR)==='N').length;
  const lvE =emps.filter(e=>getShift(e,TODAY_STR)==='L').length;

  // ONE summary only (under date) — coloured shift-split cards, non-zero codes
  try{
    const hs = document.getElementById('homeStats');
    if(hs){
      hs.className = 'today-summary-host';
      hs.innerHTML = (typeof _homeTodaySummaryHtml==='function') ? _homeTodaySummaryHtml() : '';
    }
    const topDup = document.getElementById('homeTodaySummary');
    if(topDup){ topDup.innerHTML = ''; topDup.style.display = 'none'; }
  }catch(e){ console.warn('[homeStats]', e); }


  const isMet = e => { const sec=getEmpSection(e); return /metalliser/i.test(sec) || (SEC[e.sec]||{}).type==='metalliser' || ['M1','M2','MET'].includes(String(e.sec||'').toUpperCase()); };
  const isSlit= e => { const sec=getEmpSection(e); return /slitter/i.test(sec) || (SEC[e.sec]||{}).type==='slitter' || ['S1','S2','SLIT'].includes(String(e.sec||'').toUpperCase()); };
  const isMetProd = e => { const sec=getEmpSection(e); return /met\s*prod|metprod/i.test(sec); };
  const isEng = e => {
    const t=(SEC[e.sec]||{}).type;
    if(t==='sup' || t==='mgr') return true;
    const s=String(e.sec||'').toUpperCase();
    if(s==='SUP'||s==='ALL'||s==='MGR') return true;
    const role=(getEmpRole(e).role||'');
    if(role==='sup_met'||role==='sup_slit'||role==='mgr') return true;
    const des=(e.designation||'').toLowerCase();
    if(des.includes('engineer')||des.includes('supervisor')||des.includes('get')) return true;
    return false;
  };
  const onDuty = sh => isWorking(sh) || sh==='D' || sh==='N' || sh==='G' || sh==='GP';
  const isDay  = sh => sh==='D';
  const isNight= sh => sh==='N';

  const metEmps  = emps.filter(isMet);
  const slitEmps = emps.filter(isSlit);
  const engEmps  = emps.filter(isEng);

  const metDay   = metEmps.filter(e=>isDay(getShift(e,TODAY_STR)));
  const metNight = metEmps.filter(e=>isNight(getShift(e,TODAY_STR)));
  const slitDay  = slitEmps.filter(e=>isDay(getShift(e,TODAY_STR)));
  const slitNight= slitEmps.filter(e=>isNight(getShift(e,TODAY_STR)));
  const engToday = engEmps.filter(e=>onDuty(getShift(e,TODAY_STR)));

  const metDuty  = metDay.length + metNight.length;
  const slitDuty = slitDay.length + slitNight.length;
  const metMin   = (CFG.minShift && CFG.minShift.metalliser) || 0;
  const slitMin  = (CFG.minShift && CFG.minShift.slitter) || 0;
  const metWarn  = metMin>0 && metDuty<metMin;
  const slitWarn = slitMin>0 && slitDuty<slitMin;

  let secNames = _teamFieldValues('section');
  // Members whose Section was never set (machine code only) — show under Unassigned until Excel re-upload
  const unassigned = emps.filter(e=>!getEmpSection(e));
  if(unassigned.length && !secNames.includes('Unassigned')){
    /* do not add fake section name to filters — only list real Excel sections */
  }
  document.getElementById('homeSectionTitle').textContent = en
    ? ("Today's Shift — " + (secNames.join(' · ') || 'All sections'))
    : ('आज की शिफ्ट — ' + (secNames.join(' · ') || 'सभी'));

  // Build one summary card per Excel Section
  document.getElementById('homeSections').innerHTML = secNames.map((secName, idx)=>{
    const list = emps.filter(e=>getEmpSection(e)===secName);
    const dayN = list.filter(e=>isDay(getShift(e,TODAY_STR))).length;
    const nightN = list.filter(e=>isNight(getShift(e,TODAY_STR))).length;
    const duty = dayN + nightN;
    const colors = ['#f97316','#0284c7','#7c3aed','#16a34a','#db2777'];
    const col = colors[idx % colors.length];
    const mcs = [...new Set(list.map(e=>getEmpMachine(e)).filter(Boolean))].slice(0,4).join(' · ') || '—';
    return `<div class="sec-card">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="sec-icon" style="background:${col}22">🏭</div>
        <div>
          <div class="sec-name" style="color:${col}">${secName}</div>
          <div class="sec-machine">${mcs}</div>
        </div>
      </div>
      <div>
        <div class="sec-count" style="color:${col}">${duty}/${list.length}</div>
        <div class="sec-count-lbl" style="font-size:10px">${en?'Duty':'ड्यूटी'} <span style="color:#f59e0b">${dayN}D</span> <span style="color:#4f46e5">${nightN}N</span></div>
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--muted2);padding:12px">Upload team Excel to see sections</div>';

  function _nameChip(emp, sh){
    const role=getEmpRole(emp);
    const isMain=role.role==='main';
    const isSup=role.role==='sup_met'||role.role==='sup_slit';
    const chipCls = 'hm-chip' + (isMain?' main':isSup?' sup':'');
    const badge=isMain?'<span class="hm-chip-badge-main">MAIN</span>'
               :isSup?'<span class="hm-chip-badge-sup">SUP</span>':'';
    const _st = (typeof mpShiftStyle==='function') ? mpShiftStyle(cellDisp(sh)||sh) : {bg:'#475569',fg:'#fff'};
    const shLabel = sh ? mpShiftBadgeHtml(sh, {w:28,h:24,fs:13,extraStyle:'margin-left:6px;'}) : '';
    return `<div class="${chipCls}">
      <div class="hm-chip-name">${emp.name}</div>
      <div class="hm-chip-meta">
        <span>${emp.mc||secName(emp.sec)||'—'}</span>
        ${badge}${shLabel}
      </div>
    </div>`;
  }
  function _groupBlock(title, icon, color, list, emptyMsg){
    const chips = list.length
      ? `<div class="hm-chips">${list.map(e=>_nameChip(e,getShift(e,TODAY_STR))).join('')}</div>`
      : `<div class="hm-empty">${emptyMsg}</div>`;
    return `<div class="hm-group">
      <div class="hm-group-hdr">
        <span class="hm-group-icon">${icon}</span>
        <span class="hm-group-title" style="color:${color}">${title}</span>
        <span class="hm-group-count" style="color:${color}">${list.length}</span>
      </div>
      ${chips}
    </div>`;
  }

  let rosterHtml = `<div class="stitle hm-section-title">${en?'Manpower on Duty — Names':'ड्यूटी पर Manpower — नाम'}</div>`;
  const _secList = secNames.length ? secNames : _teamFieldValues('section');
  _secList.forEach(secName=>{
    const list = emps.filter(e=>getEmpSection(e)===secName);
    const dayList = list.filter(e=>isDay(getShift(e,TODAY_STR)));
    const nightList = list.filter(e=>isNight(getShift(e,TODAY_STR)));
    const genList = list.filter(e=>{ const sh=getShift(e,TODAY_STR); return sh==='G'||sh==='GP'; });
    if(dayList.length) rosterHtml += _groupBlock((en?'Day Shift — ':'दिन — ')+secName, '☀️', '#f59e0b', dayList, '');
    if(nightList.length) rosterHtml += _groupBlock((en?'Night Shift — ':'रात — ')+secName, '🌙', '#4f46e5', nightList, '');
    if(genList.length) rosterHtml += _groupBlock((en?'General — ':'जनरल — ')+secName, '🔵', '#0284c7', genList, '');
  });
  // Engineers / non-operation roles still shown
  if(typeof engToday!=='undefined' && engToday && engToday.length)
    rosterHtml += _groupBlock(en?'Engineers / Others Today':'आज Engineers / अन्य', '👷', '#7c3aed', engToday, '');
  rosterHtml += `<div class="hm-link-sched" onclick="goTab('schedule')">${en?'View full schedule →':'पूरा शेड्यूल देखें →'}</div>`;
  document.getElementById('homeRoster').innerHTML = rosterHtml;

  // ════════════════════════════════════════
  // 2) PERSONAL CALENDAR — previous 3 + upcoming 14 (all users)
  // ════════════════════════════════════════
  try{ _renderHomePersonalCalendar(); }catch(e){ console.warn('[home] personal cal', e); }
  try{ updateHomeTodoSummary(); }catch(e){}
}

/** Personal shift strip: Past 3 days + Upcoming 14 days — used by every role */
function _renderHomePersonalCalendar(){
  const en = (_lang !== 'hi');
  const calEl = document.getElementById('homeShiftCalendar');
  const titleEl = document.getElementById('homeWorkerCalTitle');
  if(titleEl) titleEl.textContent = en ? '📅 My Shift — Past 3 & Next 14 Days' : '📅 मेरी शिफ्ट — पिछले 3 और अगले 14 दिन';
  if(!calEl) return;

  const e = myEmp();
  if(!e){
    calEl.innerHTML = `<div class="hm-empty" style="padding:16px;text-align:center">${en?'Your employee profile is not linked — personal shift not available.':'आपकी employee profile लिंक नहीं है — व्यक्तिगत शिफ्ट उपलब्ध नहीं।'}</div>`;
    return;
  }

  try{
    if(!isAdminOrMgr()){
      fbGet('deviceApprovals/' + e.id).then(approval=>{
        if(approval && approval.validTill){
          const daysLeft = Math.ceil((new Date(approval.validTill) - new Date()) / 86400000);
          if(daysLeft <= 7 && daysLeft > 0 && !sessionStorage.getItem('validity_warned')){
            sessionStorage.setItem('validity_warned','1');
            setTimeout(()=> toast((typeof L==='function')?L('⚠️ App Validity: सिर्फ '+daysLeft+' दिन बाकी! Profile tap करें।','⚠️ App Validity: Only '+daysLeft+' days left! Tap Profile.'):('⚠️ Only '+daysLeft+' days left')), 2500);
          }
        }
      }).catch(()=>{});
    }
  }catch(e2){}

  const todaySh=getShift(e,TODAY_STR);
  const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayName = (dObj) => en ? DAYS_EN[dObj.getDay()] : DAYS[dObj.getDay()];

  function _dayCard(dateStr){
    const dO = new Date(dateStr+'T12:00:00');
    const sh = getShift(e, dateStr);
    const isT = dateStr===TODAY_STR;
    const infoShifts = ['L','CO','C/O','OD','Ab','HLF','H'];
    const click = infoShifts.includes(sh)
      ? `onclick="showShiftInfo('${e.id}','${String(e.name).replace(/'/g,"\\'")}','${dateStr}','${sh}')" style="cursor:pointer"`
      : '';
    return `<div class="hm-day-card${isT?' today':''}" ${click}>
      <div class="hm-day-name">${dayName(dO)}</div>
      <div class="hm-day-num">${dO.getDate()}</div>
      ${shiftBadgeHtml(sh)}
    </div>`;
  }

  const prevDates = [-3,-2,-1].map(n => addDays(TODAY_STR, n));
  const nextDates = Array.from({length:14}, (_,i)=> addDays(TODAY_STR, i+1));

  let calHtml = '';

  const todayLabel = todaySh ? `${cellDisp(todaySh)} · ${shiftWord(todaySh)}` : '—';
  const longLabel = todaySh==='D' ? (en?'Day Shift':'दिन शिफ्ट')
                    : todaySh==='N' ? (en?'Night Shift':'रात शिफ्ट')
                    : todaySh==='A' ? (en?'A Shift (morning)':'A शिफ्ट')
                    : todaySh==='B' ? (en?'B Shift (afternoon)':'B शिफ्ट')
                    : todaySh==='C' ? (en?'C Shift (evening)':'C शिफ्ट')
                    : todaySh==='L' ? (en?'On Leave':'छुट्टी')
                    : todaySh==='O' ? (en?'Weekly Off':'साप्ताहिक छुट्टी')
                    : todaySh==='G' ? (en?'General Shift':'जनरल शिफ्ट')
                    : (shiftWord(todaySh) || cellDisp(todaySh) || '—');

  calHtml += `<div class="hm-today-banner">
    ${shiftBadgeHtml(todaySh, 'lg')}
    <div style="flex:1">
      <div class="hm-today-label">${en?'Today':'आज'}</div>
      <div class="hm-today-shift">${longLabel}</div>
      <div class="hm-today-sub">${e.name||''} · ${secName(e.sec)||''}${e.mc?' · '+e.mc:''}</div>
    </div>
  </div>`;

  calHtml += `<div class="stitle">${en?'Previous 3 Days':'पिछले 3 दिन'}</div>
  <div class="hm-day-row">${prevDates.map(d => _dayCard(d)).join('')}</div>`;

  calHtml += `<div class="stitle">${en?'Upcoming 14 Days':'अगले 14 दिन'}</div>
  <div class="hm-day-row">${nextDates.map(d => _dayCard(d)).join('')}</div>`;

  // Full fixed legend
  const legendItems = en
    ? [['D','Day','#f59e0b','#1a1a2e'],['N','Night','#4f46e5','#fff'],['A','A Shift','#16a34a','#fff'],['B','B Shift','#db2777','#fff'],['C','C Shift','#0891b2','#fff'],['O','Off','#475569','#fff'],['L','Leave','#be123c','#fff'],['G','General','#0284c7','#fff'],['CO','C-Off','#92400e','#fde68a'],['H','Holiday','#ea580c','#fff']]
    : [['D','दिन','#f59e0b','#1a1a2e'],['N','रात','#4f46e5','#fff'],['A','A शिफ्ट','#16a34a','#fff'],['B','B शिफ्ट','#db2777','#fff'],['C','C शिफ्ट','#0891b2','#fff'],['O','ऑफ','#475569','#fff'],['L','छुट्टी','#be123c','#fff'],['G','जनरल','#0284c7','#fff'],['CO','C-Off','#92400e','#fde68a'],['H','हॉलिडे','#ea580c','#fff']];
  calHtml += `<div class="hm-legend">
    ${legendItems.map(([c,l,bg,fg])=>
      `<div class="hm-legend-item"><span class="hm-leg-swatch" style="background:${bg};color:${fg}">${c}</span><span>${l}</span></div>`
    ).join('')}
  </div>`;

  if(todaySh && isWorking(todaySh)){
    const allEmps = getEmps().filter(emp => emp.status !== 'resigned' && emp.id !== e.id);
    const shiftMates = allEmps.filter(emp => {
      const theirShift = getShift(emp, TODAY_STR);
      return theirShift === todaySh || (todaySh === 'G' && isWorking(theirShift));
    });
    if(shiftMates.length > 0){
      const shiftLabel = todaySh === 'D' ? (en?'Day Shift mates':'दिन शिफ्ट साथी') : todaySh === 'N' ? (en?'Night Shift mates':'रात शिफ्ट साथी') : (en?'Shift mates today':'आज के शिफ्ट साथी');
      const shiftColor = todaySh === 'D' ? '#f59e0b' : todaySh === 'N' ? '#4f46e5' : todaySh === 'G' || todaySh === 'GP' ? '#0284c7' : '#38bdf8';
      calHtml += `<div class="stitle" style="margin-top:8px">${shiftLabel}</div>
      <div class="hm-mates">
        <div class="hm-mates-meta">${en?'Total':'कुल'} <b style="color:${shiftColor}">${shiftMates.length}</b></div>
        <div class="hm-chips">
          ${shiftMates.slice(0,24).map(emp => {
            const role=getEmpRole(emp);
            const isMain=role.role==='main';
            const isSup=role.role==='sup_met'||role.role==='sup_slit';
            const chipCls = 'hm-chip' + (isMain?' main':isSup?' sup':'');
            return `<div class="${chipCls}">
              <div class="hm-chip-name">${emp.name}</div>
              <div class="hm-chip-meta">${emp.mc||secName(emp.sec)||'—'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }
  } else if(todaySh === 'O' || todaySh === 'L' || todaySh === 'CO' || todaySh === 'C/O'){
    const offMsg = todaySh === 'L'
      ? (en?'🏖️ You are on leave today — rest well!':'🏖️ आज आपकी छुट्टी है — आराम करें!')
      : (en?'😊 Weekly off today — enjoy!':'😊 आज आपका ऑफ है — मज़े करें!');
    calHtml += `<div class="hm-off-msg">${offMsg}</div>`;
  }

  calEl.innerHTML = calHtml;
}


// ════════════════════════════════════════
// HOME TODO SUMMARY (compact card linking to tab)
// ════════════════════════════════════════

async function updateHomeTodoSummary(){
  try{
    const raw = await fbGetTodos();
    let todos = Object.entries(raw).map(([id,v])=>({...v,id}));
    const myEmpObjId = SESSION.empObjId||'';
    const myEmpId = SESSION.empId||'';
    const myName = (SESSION.name||'').toLowerCase();
    
    // Filter: mine only
    todos = todos.filter(t=>
      t.assignedToEmpId===myEmpObjId ||
      (t.assignedToEmpId===''&&t.assignedTo&&t.assignedTo.toLowerCase()===myName) ||
      t.createdBy===myEmpId || t.createdBy===myEmpObjId
    );
    
    const pending = todos.filter(t=>!t.done).length;
    const done = todos.filter(t=>t.done).length;
    const urgent = todos.filter(t=>!t.done && t.priority==='high').length;
    
    const titleEl = document.getElementById('homeTodoTitle');
    const metaEl = document.getElementById('homeTodoMeta');
    const badgeEl = document.getElementById('homeTodoPendingBadge');
    
    if(titleEl) titleEl.textContent = pending > 0 ? `${pending} काम बाकी` : 'सब काम पूरा!';
    if(metaEl) metaEl.textContent = `${done} done` + (urgent > 0 ? ` · ${urgent} urgent` : '') + ` · Total ${todos.length}`;
    if(badgeEl){
      badgeEl.textContent = pending;
      badgeEl.style.color = pending > 0 ? (urgent > 0 ? 'var(--lv)' : 'var(--day)') : 'var(--green)';
    }
  }catch(e){
    const metaEl = document.getElementById('homeTodoMeta');
    if(metaEl) metaEl.textContent = 'Load error';
  }
}

async function submitHomeTodo(){
  const title=(document.getElementById('htdTitle')?.value||'').trim();
  if(!title){ toast('❌ काम का नाम डालें'); return; }
  const desc=(document.getElementById('htdDesc')?.value||'').trim();
  const priority=document.getElementById('htdPriority')?.value||'medium';
  const dueDate=document.getElementById('htdDue')?.value||'';
  const assigneeVal=document.getElementById('htdAssignee')?.value||'';
  const [assigneeId, assigneeName] = assigneeVal.split('|');

  const todo = {
    title, desc, priority,
    done: false,
    dueDate: dueDate||null,
    assignedToEmpId: assigneeId||SESSION.empObjId||'',
    assignedTo: assigneeName||SESSION.name||'',
    section: SESSION.dept||'',
    createdBy: SESSION.empId||SESSION.empObjId||'',
    createdByName: SESSION.name||'',
    createdAt: Date.now()
  };
  try{
    await fbPush('todos', todo);
    // Notify assignee if different from self
    if(assigneeId && assigneeId !== SESSION.empObjId){
      try{
        await fbPush('userNotifications/'+assigneeId,{
          title:'📌 नया काम assign हुआ',
          body: title + (SESSION.name?' — '+SESSION.name:''),
          read:false, at:new Date().toISOString()
        });
        // WhatsApp notification
        const emp = getEmps().find(e => e.id === assigneeId);
        if(emp && emp.phone && emp.phone.length === 10){
          const prioLabel = priority==='high' ? '🔴 Urgent' : priority==='low' ? '🟢 Low' : '🟡 Normal';
          const dueFmt = dueDate ? (typeof mpFormatDate==='function'?mpFormatDate(dueDate):new Date(dueDate).toLocaleDateString()) : '';
          const waMsg = (typeof buildWAForEmp==='function')
            ? buildWAForEmp('waTaskTemplate', emp, {
                title: title, desc: desc||'', priority: prioLabel,
                assigner: SESSION.name||'Admin',
                due: dueFmt ? (' *'+dueFmt+'*') : ''
              })
            : ('📌 *Task*\n'+title);
          setTimeout(()=>{ openWA(emp.phone, waMsg); }, 400);
        }
      }catch(e2){}
    }
    document.getElementById('htdTitle').value='';
    document.getElementById('htdDesc').value='';
    toast('✅ काम जोड़ा गया!');
    updateHomeTodoSummary();
    goTab('todo');
  }catch(e){ toast('❌ Error: '+e.message); }
}

// ════════════════════════════════════════
// MY SHIFT
// ════════════════════════════════════════

// ════════════════════════════════════════
// MY SHIFT — records + branded calendar download
// ════════════════════════════════════════
function openMyShiftRecordsPanel(){
  const host = document.getElementById('myShiftDlPanel');
  if(!host) return;
  if(host.dataset.open === '1'){
    host.innerHTML = '';
    host.dataset.open = '0';
    return;
  }
  host.dataset.open = '1';
  host.innerHTML = `
    <div style="background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:900;margin-bottom:8px">📥 ${L('Shift Details Download','Shift Details Download')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div>
          <label style="font-size:10px;color:var(--muted2);font-weight:700">${L('प्रकार','Type')}</label>
          <select id="msLdType" class="inp-field" style="width:100%;margin-top:4px">
            <option value="shift_all">All Shift Codes</option>
            <option value="shift_D">Day Shift (D)</option>
            <option value="shift_N">Night Shift (N)</option>
            <option value="shift_O">Weekly Off (O)</option>
            <option value="shift_L">Leave (L)</option>
            <option value="shift_Ab">Absent (Ab)</option>
            <option value="shift_H">Holiday (H)</option>
            <option value="shift_CO">C-Off (C/O)</option>
            <option value="shift_G">General (G)</option>
            <option value="shift_A">A Shift</option>
            <option value="shift_B">B Shift</option>
            <option value="shift_C">C Shift</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted2);font-weight:700">${L('से','From')}</label>
          <input type="date" id="msLdFrom" class="inp-field" style="width:100%;margin-top:4px">
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted2);font-weight:700">${L('तक','To')}</label>
          <input type="date" id="msLdTo" class="inp-field" style="width:100%;margin-top:4px">
        </div>
        <div style="display:flex;align-items:flex-end">
          <button type="button" onclick="downloadMyShiftRecords()" class="submit-btn" style="width:100%;padding:10px;border-radius:10px;font-weight:800;border:none;cursor:pointer;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff">📥 Download Excel</button>
        </div>
      </div>
    </div>`;
  try{
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const iso = d => d.toISOString().slice(0,10);
    document.getElementById('msLdFrom').value = iso(new Date(y, m, 1));
    document.getElementById('msLdTo').value = iso(new Date(y, m+1, 0));
  }catch(e){}
}

async function downloadMyShiftRecords(){
  // Reuse leave/shift download pipeline with My Shift field ids
  const typeEl = document.getElementById('msLdType');
  const fromEl = document.getElementById('msLdFrom');
  const toEl = document.getElementById('msLdTo');
  if(!typeEl || !fromEl || !toEl){ toast('⚠️ Panel open करें'); return; }
  // Temporarily map to ld* ids expected by downloadLeaveOrShiftRecords OR inline
  const type = typeEl.value || 'shift_all';
  const from = fromEl.value || '';
  const to = toEl.value || '';
  if(!from || !to){ toast('⚠️ From / To date चुनें'); return; }
  if(from > to){ toast('⚠️ From date, To से पहले हो'); return; }

  const emp = (typeof myEmp==='function' ? myEmp() : null)
    || (getEmps()||[]).find(e=>e.id===SESSION.empObjId || e.empId===SESSION.empId);
  if(!emp){ toast('⚠️ Employee profile नहीं मिला'); return; }
  const myMobile = String(SESSION.mobile||emp.phone||'').replace(/\D/g,'').slice(-10);
  const genAt = new Date().toLocaleString('en-IN');
  const want = type.replace('shift_','');
  const rows = [];
  rows.push(['Man Power App — Shift History']);
  rows.push(['VKS Tech — Technology is power']);
  rows.push(['Member', emp.name||SESSION.name||'', 'Code', emp.empId||'', 'Mobile', myMobile]);
  rows.push(['Filter', want==='all'?'All codes':want, 'From', from, 'To', to]);
  rows.push(['Generated', genAt]);
  rows.push([]);
  rows.push(['#','Date','Day','Shift Code','Meaning']);
  const meaning = {D:'Day',N:'Night',A:'A',B:'B',C:'C',O:'Weekly Off',L:'Leave','C/O':'Comp Off',CO:'Comp Off',H:'Holiday',Ab:'Absent',G:'General',GP:'Gate Pass',HLF:'Half Day',OD:'Other Dept'};
  let n = 0;
  const cur = new Date(from+'T12:00:00');
  const end = new Date(to+'T12:00:00');
  while(cur <= end){
    const ymd = cur.toISOString().slice(0,10);
    let sh = '';
    try{ sh = (typeof getShift==='function') ? String(getShift(emp, ymd)||'') : ''; }catch(e){}
    const up = sh.toUpperCase();
    let match = false;
    if(want==='all') match = !!sh;
    else if(want==='CO') match = (up==='C/O'||up==='CO'||up==='C-OFF');
    else if(want==='Ab') match = (typeof _isAbsentShift==='function' ? _isAbsentShift(sh) : /^Ab/i.test(sh));
    else match = (up === want.toUpperCase() || sh === want);
    if(match){
      n++;
      rows.push([n, ymd, cur.toLocaleDateString('en-IN',{weekday:'short'}), sh||'—', meaning[sh]||meaning[up]||'']);
    }
    cur.setDate(cur.getDate()+1);
  }
  if(!n) rows.push(['—','No matching shifts in range']);
  const fileBase = 'ManPower_Shifts_'+want+'_'+from+'_to_'+to;
  try{
    try{ await _ensureXlsxLib(); }catch(e){}
    if(window.XLSX){
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Shifts');
      XLSX.writeFile(wb, fileBase + '.xlsx');
      toast('📤 Excel downloaded');
      return;
    }
  }catch(e){ console.warn(e); }
  const csv = rows.map(r=>r.map(c=>{ const s=String(c==null?'':c); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download = fileBase+'.csv'; a.click();
  toast('📤 CSV downloaded');
}

function openShiftCalendarDownload(){
  const emp = (typeof myEmp==='function' ? myEmp() : null);
  if(!emp){ toast('⚠️ Profile not found'); return; }
  const now = new Date();
  const months = [];
  for(let i=-6;i<=3;i++){
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    const label = d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
    const sel = (_myShiftMonth && _myShiftMonth.getFullYear()===d.getFullYear() && _myShiftMonth.getMonth()===d.getMonth()) ? ' selected' : '';
    months.push(`<option value="${key}"${sel}>${label}</option>`);
  }
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📅 ${L('Shift Calendar Download','Shift Calendar Download')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">${L('महीना चुनें — Print जैसा रंग + Man Power / VKS Tech branding','Pick month — same colours as Print + Man Power / VKS Tech branding')}</div>
    <div class="field" style="margin-bottom:14px">
      <label>${L('महीना','Month')}</label>
      <select id="scDlMonth" class="inp-field">${months.join('')}</select>
    </div>
    <button class="submit-btn" onclick="downloadMyShiftCalendar()" style="width:100%">📥 ${L('Download Calendar','Download Calendar')}</button>
    <button class="cancel-btn" onclick="closeModal()" style="width:100%;margin-top:8px">${L('रद्द','Cancel')}</button>`);
}

/** Personal month calendar PNG — same shift colours + branding as Schedule print */
async function downloadMyShiftCalendar(){
  const emp = (typeof myEmp==='function' ? myEmp() : null);
  if(!emp){ toast('⚠️ Profile not found'); return; }
  const mk = (document.getElementById('scDlMonth')||{}).value || '';
  if(!mk){ toast('⚠️ Month चुनें'); return; }
  const [yr, mo] = mk.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const first = new Date(yr, mo-1, 1);
  const startDow = first.getDay();
  const monthName = first.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const genAt = new Date().toLocaleString('en-IN');

  // Same palette as printSched / _execPrint
  const SBG={D:'#f59e0b',N:'#4f46e5',A:'#16a34a',B:'#db2777',C:'#0891b2',O:'#dcfce7',L:'#fee2e2','C/O':'#ede9fe',G:'#e0f2fe',H:'#ffedd5',OD:'#ccfbf1',HLF:'#fed7aa',Ab:'#fecaca',GP:'#fdf4ff'};
  const SCL={D:'#000',N:'#fff',A:'#fff',B:'#fff',C:'#fff',O:'#16a34a',L:'#dc2626','C/O':'#7c3aed',G:'#0369a1',H:'#c2410c',OD:'#0d9488',HLF:'#c2410c',Ab:'#991b1b',GP:'#9333ea'};

  let logoDataUrl = null;
  try{ logoDataUrl = await _loadVksLogoDataUrl(); }catch(e){}

  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let dayCells = '';
  for(let i=0;i<startDow;i++) dayCells += `<div style="min-height:64px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const ds = yr+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    let sh = '';
    try{ sh = String(getShift(emp, ds)||''); }catch(e){}
    const bg = SBG[sh] || '#f1f5f9';
    const cl = SCL[sh] || '#475569';
    const disp = sh==='C/O'?'CO':(sh==='HLF'?'½':(sh||'·'));
    const isToday = (typeof TODAY_STR!=='undefined' && ds===TODAY_STR);
    dayCells += `<div style="min-height:64px;background:#fff;border:1px solid ${isToday?'#f97316':'#e2e8f0'};border-radius:8px;padding:6px;${isToday?'box-shadow:0 0 0 2px rgba(249,115,22,.25)':''}">
      <div style="font-size:11px;font-weight:800;color:#64748b;margin-bottom:4px">${d}</div>
      <div style="display:inline-block;min-width:28px;text-align:center;padding:3px 6px;border-radius:6px;font-weight:900;font-size:12px;background:${bg};color:${cl};border:1px solid rgba(0,0,0,.12)">${disp}</div>
    </div>`;
  }

  const legend = ['D','N','O','L','C/O','H','Ab','G'].map(c=>{
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:10px;color:#334155"><span style="width:14px;height:14px;border-radius:3px;background:${SBG[c]};border:1px solid rgba(0,0,0,.15)"></span>${c}</span>`;
  }).join('');

  const imgWidth = 720;
  const printDiv = document.createElement('div');
  printDiv.style.cssText = `position:fixed;top:-99999px;left:0;background:#fff;padding:18px;font-family:Arial,sans-serif;width:${imgWidth}px;color:#0f172a`;
  printDiv.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;border-bottom:2px solid #ea580c;padding-bottom:12px">
      ${logoDataUrl?`<img src="${logoDataUrl}" width="52" height="52" style="border-radius:12px;object-fit:contain;background:#fff;border:1px solid #e2e8f0;padding:2px"/>`:''}
      <div style="flex:1">
        <div style="font-size:20px;font-weight:900;color:#ea580c;letter-spacing:.3px">Man Power App</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a">My Shift Calendar — ${monthName}</div>
        <div style="font-size:11px;color:#64748b">${emp.name||''}${emp.empId?' · #'+emp.empId:''} · ${SESSION.company||''}</div>
      </div>
      <div style="text-align:right;font-size:10px;color:#64748b">VKS Tech<br/>Technology is power</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px">
      ${dows.map(d=>`<div style="text-align:center;font-size:11px;font-weight:800;color:#64748b;padding:4px 0">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${dayCells}</div>
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0">${legend}</div>
    <div style="margin-top:10px;text-align:center;font-size:10px;color:#94a3b8">
      ${logoDataUrl?`<img src="${logoDataUrl}" width="14" height="14" style="vertical-align:middle;border-radius:3px"/>`:''}
      Generated ${genAt} · Man Power App · VKS Tech — vkstech.com
    </div>`;
  document.body.appendChild(printDiv);

  const finish = ()=>{ try{ document.body.removeChild(printDiv); }catch(e){} };

  try{
    if(typeof html2canvas !== 'function'){
      // Fallback: open print window
      const w = window.open('', '_blank');
      if(w){
        w.document.write('<html><head><title>Shift Calendar</title></head><body>'+printDiv.innerHTML+'</body></html>');
        w.document.close();
        w.focus();
        setTimeout(()=>{ try{ w.print(); }catch(e){} }, 300);
      }
      closeModal();
      finish();
      toast('🖨️ Print dialog opened');
      return;
    }
    const imgs = printDiv.querySelectorAll('img');
    await Promise.all([...imgs].map(img=> img.complete ? Promise.resolve() : new Promise(r=>{ img.onload=img.onerror=r; })));
    const canvas = await html2canvas(printDiv, { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: imgWidth });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'ManPower_ShiftCalendar_'+(emp.name||'member').replace(/\s+/g,'_')+'_'+mk+'.png';
    a.click();
    closeModal();
    toast('📥 Shift calendar downloaded (PNG)');
  }catch(err){
    console.warn('[shift cal dl]', err);
    toast('❌ Download failed');
  }finally{
    finish();
  }
}

function renderMyShift(){
  const el = document.getElementById('myShiftContent');
  if(!el) return;
  const e = myEmp();
  if(!e){ el.innerHTML='<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">Profile not found</div></div>'; return; }
  if(!_myShiftMonth) _myShiftMonth = new Date(TODAY_STR+'T12:00:00');
  const y = _myShiftMonth.getFullYear();
  const m = _myShiftMonth.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const startDow = first.getDay(); // 0 Sun
  const monthName = first.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
  const canSelf = !isPendingMember(); // members can request change

  const shStyle = window.MP_SHIFT_COLORS || {};

  let cells = '';
  for(let i=0;i<startDow;i++) cells += '<div class="ms-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const ds = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const sh = getShift(e, ds) || '';
    const st = (typeof mpShiftStyle==='function' ? mpShiftStyle(sh) : (shStyle[sh]||{bg:'#1e293b',fg:'#94a3b8'}));
    const isToday = ds===TODAY_STR;
    const disp = cellDisp(sh) || '·';
    const click = canSelf
      ? `onclick="editShiftCell('${e.id}','${String(e.name||'').replace(/'/g,"\\'")}','${ds}','${String(sh).replace(/'/g,"\\'")}')"`
      : '';
    const cls = cellClass(sh);
    cells += `<div class="ms-day${isToday?' today':''}" ${click} style="cursor:${canSelf?'pointer':'default'}">
      <div class="ms-day-num">${d}</div>
      <div class="ms-day-sh shc ${cls}">${disp}</div>
    </div>`;
  }

  // Shift mates today
  const todaySh = getShift(e, TODAY_STR);
  const allEmps = (typeof getEmps==='function'?getEmps():[]).filter(x=>x.status!=='resigned'&&x.status!=='left');
  const mates = allEmps.filter(emp=>{
    if(emp.id===e.id) return false;
    const s = getShift(emp, TODAY_STR);
    if(!todaySh||!s) return false;
    if(todaySh===s) return true;
    if(typeof parseShiftWorkCodes==='function'){
      const a=parseShiftWorkCodes(todaySh), b=parseShiftWorkCodes(s);
      return a.some(c=>b.includes(c));
    }
    return false;
  });

  el.innerHTML = `
  <div class="ms-dl-bar" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <button type="button" onclick="openMyShiftRecordsPanel()" style="flex:1;min-width:140px;padding:10px 12px;border-radius:10px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;font-size:12px;cursor:pointer">📥 ${L('Shift Details Download','Shift Details Download')}</button>
    <button type="button" onclick="openShiftCalendarDownload()" style="flex:1;min-width:140px;padding:10px 12px;border-radius:10px;border:1px solid rgba(14,165,233,.4);background:rgba(14,165,233,.12);color:#0ea5e9;font-weight:800;font-size:12px;cursor:pointer">📅 ${L('Shift Calendar Download','Shift Calendar Download')}</button>
  </div>
  <div id="myShiftDlPanel"></div>
  <div class="ms-cal-wrap">
    <div class="ms-cal-nav">
      <button type="button" class="ms-nav-btn" onclick="_myShiftMonth=new Date(${y},${m}-1,1);renderMyShift()">‹</button>
      <div class="ms-cal-title">${monthName}</div>
      <button type="button" class="ms-nav-btn" onclick="_myShiftMonth=new Date(${y},${m}+1,1);renderMyShift()">›</button>
    </div>
    <div class="ms-weekdays">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<div>'+x+'</div>').join('')}</div>
    <div class="ms-grid">${cells}</div>
    <div class="ms-hint">${canEditSchedule()
      ? L('दिन पर टैप करें — यहीं save होगा (अपनी shift पर WhatsApp नहीं)','Tap a day to change shift — saves here (no WhatsApp for your own shift)')
      : L('दिन पर टैप करें — Manager approve करेगा तब schedule अपडेट होगा','Tap a day to request a shift change — your Manager will approve')}</div>
    <div id="myShiftPendingReqs"></div>
  </div>
  <div class="stitle" style="margin-top:18px">👥 ${L('आज के Shift Mates','Shift Mates Today')}</div>
  <div class="ms-mates">
    ${mates.length?mates.slice(0,30).map(emp=>`<div class="ms-mate-chip"><b>${emp.name||''}</b><span>${emp.mc||emp.sec||''}</span></div>`).join('')
      :`<div style="font-size:13px;color:var(--muted2);padding:8px">${L('आज आपकी shift पर कोई mate नहीं','No shift mates for your shift today')}</div>`}
  </div>`;
  // Show member's pending shift-change requests under calendar
  try{ _renderMyShiftPendingReqs(e.id); }catch(ex){}
}
async function _renderMyShiftPendingReqs(empObjId){
  const host = document.getElementById('myShiftPendingReqs');
  if(!host || !empObjId) return;
  try{
    const data = await fbGet('shiftChangeRequests') || {};
    const mine = Object.entries(data).filter(([k,v])=>v && v.empObjId===empObjId && v.status==='pending');
    if(!mine.length){ host.innerHTML=''; return; }
    const isEn = (_lang !== 'hi');
    host.innerHTML = `<div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3)">
      <div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:8px">${L('⏳ Manager approval pending','⏳ Pending Manager approval')}</div>
      ${mine.map(([k,v])=>`<div style="font-size:12px;color:var(--text);margin:4px 0">${v.date}: <b>${v.currentShift||'—'}</b> → <b style="color:#38bdf8">${v.newShift}</b></div>`).join('')}
    </div>`;
  }catch(e){ host.innerHTML=''; }
}
let _myShiftMonth = null;


