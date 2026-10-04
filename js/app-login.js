/**
 * Man Power — OTP / registration / role pick
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
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
      <div data-pending-msg style="font-size:13px;color:#94a3b8;line-height:1.7;max-width:320px;margin-bottom:20px">${escHtml(defaultMsg)}</div>
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
  val = String(val||'').replace(/\D/g,'').slice(0,6);
  const btn=document.getElementById('verifyOtpBtn');
  if(btn){
    const ok=val.length===6;
    btn.disabled=!ok;
    btn.style.opacity=ok?'1':'.5';
    btn.style.pointerEvents='auto';
    btn.style.cursor=ok?'pointer':'not-allowed';
  }
  // Keep device overlay in sync if open
  try{ if(typeof _otpValidate==='function') _otpValidate(); }catch(e){}
}

async function _sendOTP(isResend){
  // Device-OTP overlay uses same button id sometimes — route if employee flow active
  if(_otpEmp && document.getElementById('otpLoginOverlay')?.style.display !== 'none'
      && document.getElementById('otpLoginOverlay')?.style.display !== ''){
    return _sendDeviceOTP(!!isResend);
  }
  const mobileEl=document.getElementById('loginMobile');
  const mobile=(mobileEl?.value||'').trim().replace(/\D/g,'');
  if(mobile.length!==10){ toast(L('⚠️ 10 अंकों का Mobile Number डालें','⚠️ Enter a 10-digit mobile number')); return; }
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
          // Registered MANAGER: always allow OTP (and Admin approval as alternate)
          if(userData.role==='manager'){
            try{ await _notifyAdminManagerLoginAttempt(mobile, userData.name); }catch(e){}
            // Fall through to OTP — Admin can also Approve from Pending without waiting for OTP
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
    toast(isResend ? L('⏳ Resending OTP…','⏳ Resending OTP…') : L('OTP भेजा जा रहा है...','Sending OTP...'));
    _loginConfirmResult = await _fbSendPhoneOtp(fullPhone, 'recaptcha-container', '_fbRecaptchaNew');
    showStep(2);
    const sentEl=document.getElementById('otpSentTo');
    if(sentEl) sentEl.textContent=(typeof L==='function'?L('+91-'+mobile+' पर OTP भेजा गया','OTP sent to +91-'+mobile):('OTP sent to +91-'+mobile));
    document.getElementById('otpInput')?.focus();
    _startResendTimer();
    _startWebOtpListen('otpInput', code=>{
      if(code && code.length===6) setTimeout(()=>{ try{ _verifyOTP(); }catch(e){} }, 250);
    });
    toast(L('✅ OTP भेज दिया!','✅ OTP sent!'));
  }catch(err){
    console.error('OTP error:',err);
    const msg = '❌ '+_fbOtpErrorMessage(err);
    if(errEl) errEl.textContent=msg; toast(msg);
    // SMS quota / rate-limit / billing down → fall back to device notify or admin
    try{
      await _fallbackLoginWhenOtpUnavailable(mobile, err);
    }catch(fbErr){
      console.warn('[otp] fallback notify failed', fbErr);
    }
  }
}

/**
 * When Firebase SMS cannot be sent (quota, billing, too-many-requests),
 * offer the same path as other-device login:
 *  1) Notify already-logged-in device of this manager/member (if any)
 *  2) Always notify Admin so they can help
 */
async function _fallbackLoginWhenOtpUnavailable(mobile10, err){
  const code = (err && err.code) || '';
  const raw = String((err && err.message) || err || '');
  // Treat most phone-auth send failures as "SMS unavailable" so Admin/other device still get a request
  const isSmsBlocked =
    code === 'auth/quota-exceeded' ||
    code === 'auth/too-many-requests' ||
    code === 'auth/billing-not-enabled' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/internal-error' ||
    code === 'auth/captcha-check-failed' ||
    /quota|billing|too.?many|sms|rate.?limit|unavailable|blocked|internal-error|captcha/i.test(code + ' ' + raw);
  // Network-only: still notify so user is not stuck, but mark reason clearly
  const isNetwork = code === 'auth/network-request-failed' || /network|offline|Failed to fetch/i.test(raw);
  if(!isSmsBlocked && !isNetwork) return;

  const mobile = String(mobile10||'').replace(/\D/g,'').slice(-10);
  if(mobile.length !== 10) return;

  // Must have auth for RTDB read/write under current rules
  try{ await window._fbSignInAnon(); }catch(e){ console.warn('[otp-fallback] anon', e); }

  let userData = null;
  try{ userData = await fbGet('mobileUsers/'+mobile); }catch(e){ console.warn('[otp-fallback] mobileUsers', e); }

  const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : ('web_'+Date.now());
  const empObjId = (userData && (userData.empObjId || userData.employeeId)) || '';
  const empName = (userData && userData.name) || ('+91-'+mobile);
  const empId = (userData && (userData.empId || userData.empCode)) || '';
  const role = (userData && userData.role) || 'member';
  const approved = userData && userData.status === 'approved';

  let dRec = null;
  let otherDeviceActive = false;
  if(empObjId){
    try{
      dRec = await fbGet('deviceApprovals/'+empObjId);
      if(dRec && dRec.approvedDeviceId && dRec.approvedDeviceId !== deviceId
          && dRec.validTill && new Date(dRec.validTill) > new Date()){
        otherDeviceActive = true;
      }
    }catch(e){}
  }

  const emp = {
    id: empObjId || ('m_'+mobile),
    empId, name: empName, phone: mobile, mobile: mobile, role
  };

  // Always notify Admin (best-effort) — do not swallow silently without log
  try{
    await notifyAdmin(
      '⚠️ Login needs approval (SMS blocked)',
      empName+' · +91-'+mobile+' · '+(role||'')+
      ' — '+(code|| (isNetwork?'network':'sms_blocked'))+
      (otherDeviceActive ? ' · other device online' : '')
    );
  }catch(e){ console.warn('[otp-fallback] notifyAdmin', e); }

  // Create login request + fan-out notifications
  // Prefer device_transfer when another device is active so the other device listener matches;
  // always also tag otpBlocked so Admin UI can filter.
  let reqKey = null;
  const reqType = otherDeviceActive ? 'device_transfer' : 'otp_unavailable';
  try{
    reqKey = await fbPush('loginRequests', {
      type: reqType,
      otpBlocked: true,
      reason: code || (isNetwork ? 'network' : 'sms_blocked'),
      empObjId: emp.id || empObjId || '',
      empId: emp.empId || empId || '',
      empName: emp.name,
      mobile,
      phone: mobile,
      role: role,
      deviceId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      fromDevice: deviceId,
      note: 'SMS OTP blocked — approve login without OTP'
    });
  }catch(e){
    console.error('[otp-fallback] loginRequests write failed', e);
    toast('⚠️ Cannot create login request — enable Anonymous Auth in Firebase, then retry');
  }

  if(reqKey){
    const notif = {
      type: 'device_login_request',
      title: '📱 Login request (SMS OTP blocked)',
      body: empName+' wants to login. SMS unavailable. Open Pending → Approve.',
      empObjId: emp.id || empObjId || '',
      empId: emp.empId || empId || '',
      reqKey,
      deviceId,
      mobile,
      read: false,
      at: new Date().toISOString()
    };
    const targets = new Set([emp.id, emp.empId, mobile, empObjId].filter(Boolean));
    // Normalize mobile key variants
    targets.add(String(mobile).replace(/\D/g,'').slice(-10));
    for(const t of targets){
      try{ await fbPush('userNotifications/'+t, notif); }catch(e){ console.warn('[otp-fallback] notif', t, e); }
    }
    // Extra adminNotifications entry with reqKey for Pending deep-link style
    try{
      await fbPush('adminNotifications', {
        title: '📱 SMS blocked — approve login',
        body: empName+' · +91-'+mobile+' · open Pending → Login requests',
        type: 'otp_unavailable',
        reqKey,
        mobile,
        read: false,
        at: new Date().toISOString()
      });
    }catch(e){ console.warn('[otp-fallback] adminNotifications', e); }
  }

  // Show waiting UI (always — even if writes partially failed)
  _odlCtx = { emp, dRec: dRec||{}, deviceId, reqKey, timer:null, poller:null, userData: userData||null };
  let ov = document.getElementById('otherDeviceLoginOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='otherDeviceLoginOverlay'; document.body.appendChild(ov); }
  const hasReq = !!reqKey;
  ov.style.cssText='position:fixed;inset:0;z-index:9600;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto';
  ov.innerHTML=`
    <div style="width:100%;max-width:400px;text-align:center">
      <div style="font-size:44px;margin-bottom:8px">⚠️📱</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:6px">SMS OTP blocked</div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.55;margin-bottom:14px">
        Firebase rate-limit / quota reached for this number.<br>
        ${hasReq
          ? ('A <b style="color:#f97316">login request</b> was sent to <b style="color:#fff">Admin</b>'+(otherDeviceActive?' and your other device':'')+'.')
          : 'Could not write request — enable <b>Anonymous Auth</b> in Firebase, then retry.'}
      </div>
      <div style="background:#1e293b;border-radius:12px;padding:12px;margin-bottom:14px;text-align:left">
        <div style="font-size:11px;color:#64748b;font-weight:800">ACCOUNT</div>
        <div style="font-size:16px;font-weight:900;color:#f97316">${String(empName).replace(/</g,'')}</div>
        <div style="font-size:12px;color:#94a3b8">+91-${mobile}${empId?' · '+String(empId).replace(/</g,''):''}${approved?'':' · not in mobileUsers'}</div>
      </div>
      <div id="odlStatus" style="font-size:13px;color:#94a3b8;margin-bottom:12px;line-height:1.55;min-height:40px">
        ${hasReq
          ? '⏳ Waiting for approval…<br>On the other device / Admin app → <b style="color:#4ade80">Pending</b> → <b style="color:#4ade80">Approve</b>.'
          : '⚠️ Fix Firebase Anonymous Auth, then tap Retry below.'}
      </div>
      <button type="button" onclick="closeOtherDeviceLogin();setTimeout(()=>{try{_sendOTP(false);}catch(e){}},200)"
        style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;margin-bottom:10px">
        🔄 Retry OTP
      </button>
      <button type="button" onclick="closeOtherDeviceLogin()"
        style="width:100%;padding:12px;background:none;border:1px solid #334155;border-radius:12px;color:#64748b;font-size:14px;cursor:pointer;font-family:inherit">← Back</button>
    </div>`;
  ov.style.display='flex';

  if(reqKey){
    if(window._odlPoller) clearInterval(window._odlPoller);
    _odlCtx.poller = setInterval(async ()=>{
      try{
        const rec = await fbGet('loginRequests/'+reqKey);
        if(rec && rec.status==='approved'){
          clearInterval(_odlCtx.poller);
          try{ await doLoginAfterApproval(emp, userData, deviceId); }catch(e){
            console.error('[otp-fallback] doLoginAfterApproval', e);
            toast('❌ Approval received but login failed: '+(e.message||e));
          }
          closeOtherDeviceLogin();
        } else if(rec && (rec.status==='rejected'||rec.status==='cancelled')){
          clearInterval(_odlCtx.poller);
          const st = document.getElementById('odlStatus');
          if(st) st.innerHTML='❌ Request was rejected. Contact Admin.';
        }
      }catch(e){}
    }, 2500);
    window._odlPoller = _odlCtx.poller;
    toast('✅ Approval request sent — waiting…');
  }
}

/** Complete login after device/Admin approved a loginRequests row (no SMS OTP). */
async function doLoginAfterApproval(emp, userData, deviceId){
  const mobile = String((emp && (emp.phone||emp.mobile)) || (userData && (userData.phone||userData.mobile)) || '')
    .replace(/\D/g,'').slice(-10);
  if(!mobile || mobile.length!==10){
    throw new Error('Mobile missing on approved request');
  }
  try{ await window._fbSignInAnon(); }catch(e){}

  let ud = userData;
  if(!ud || !ud.status){
    try{ ud = await fbGet('mobileUsers/'+mobile); }catch(e){}
  }
  if(!ud){
    // Build minimal record from emp if needed
    ud = {
      role: (emp && emp.role) || 'member',
      name: (emp && emp.name) || '',
      mobile: '+91'+mobile,
      phone: mobile,
      status: 'approved',
      empId: (emp && emp.empId) || '',
      empCode: (emp && emp.empId) || '',
      empObjId: (emp && emp.id) || '',
      employeeId: (emp && emp.id) || ''
    };
  }
  if(ud.status && ud.status !== 'approved' && ud.status !== 'pending'){
    throw new Error('Account status: '+ud.status);
  }

  const empObjId = ud.empObjId || ud.employeeId || (emp && emp.id) || '';
  const devId = deviceId || (typeof getDeviceId==='function' ? getDeviceId() : '');
  if(empObjId && devId){
    try{
      await fbUpdate('deviceApprovals/'+empObjId, {
        approvedDeviceId: devId,
        approvedAt: new Date().toISOString(),
        validTill: new Date(Date.now()+365*86400000).toISOString(),
        empName: ud.name||'',
        empId: ud.empId||ud.empCode||'',
        via: 'login_request_approval'
      });
    }catch(e){ console.warn('[doLoginAfterApproval] deviceApprovals', e); }
  }

  _loginMobile = '+91'+mobile;
  try{ _markWriteAuthFromLogin(mobile); }catch(e){}
  try{
    localStorage.setItem('mp_device_phone', mobile);
    localStorage.setItem('mp_device_verified_at', String(Date.now()));
  }catch(e){}

  toast('✅ Login approved — Welcome '+(ud.name||mobile));
  if(typeof _launchAsNewUser === 'function'){
    await _launchAsNewUser(ud);
  } else {
    throw new Error('Launch function missing');
  }
}
try{ window._fallbackLoginWhenOtpUnavailable = _fallbackLoginWhenOtpUnavailable; window.doLoginAfterApproval = doLoginAfterApproval; }catch(e){}



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
  if(otp.length!==6){ toast(L('⚠️ 6 अंकों का OTP डालें','⚠️ Enter the 6-digit OTP')); return; }
  if(!_loginConfirmResult){ toast(L('⚠️ OTP पहले भेजें','⚠️ Send OTP first')); return; }
  try{
    toast(L('⏳ Verify हो रहा है...','⏳ Verifying...'));
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

/** Approved Manager login: notify Admin (approval optional — OTP still works alone) */
async function _notifyAdminManagerLoginAttempt(mobile, name){
  try{
    const mob = (typeof _normMobileKey==='function')?_normMobileKey(mobile):String(mobile||'').replace(/\D/g,'').slice(-10);
    const notif = {
      type: 'manager_login_attempt',
      title: '🔑 Manager login (OTP sent)',
      body: (name||mob)+' is logging in — OTP works; Admin can also Approve from Pending',
      mobile: mob,
      name: name||'',
      read: false,
      needsApproval: true,
      at: new Date().toISOString()
    };
    await fbPush('adminNotifications', notif);
    // Optional pending loginRequests for Admin Approve without OTP
    try{
      await fbPush('loginRequests', {
        type: 'manager_login_approval',
        status: 'pending',
        role: 'manager',
        mobile: mob,
        phone: mob,
        empName: name||mob,
        requestedAt: new Date().toISOString(),
        note: 'Manager OTP login — Admin may Approve as alternate to OTP'
      });
    }catch(e){}
  }catch(e){ console.warn('[admin mgr login notify]', e); }
}

async function _notifyManagerMemberLogin(userData, mobile){
  try{
    const mid = (typeof _normMobileKey==='function')
      ? _normMobileKey(userData.managerId||userData.managerMobile||'')
      : String(userData.managerId||'').replace(/\D/g,'').slice(-10);
    const name = userData.name || mobile || 'Member';
    const notif = {
      type: 'member_login',
      title: '👤 Team member logged in',
      body: name + ' logged in (OTP verified — no action needed)',
      mobile: mobile,
      name: name,
      empObjId: userData.empObjId || userData.employeeId || '',
      empId: userData.empId || userData.empCode || '',
      read: false,
      needsApproval: false,
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

/** If this mobile left/was removed earlier but employee record still has shifts, relink & restore access */
async function _tryRejoinPreserveShifts(mobile){
  try{
    const mob = String(mobile||'').replace(/\D/g,'').slice(-10);
    if(mob.length!==10) return false;
    let mu = null;
    try{ mu = await fbGet('mobileUsers/'+mob); }catch(e){}
    const st = (mu && mu.status) ? String(mu.status) : '';
    // Only auto-rejoin for previously linked left/removed users (not first-time)
    const wasAway = ['left_team','removed','revoked','left','inactive'].indexOf(st)>=0
      || (mu && mu.leftAt);
    // Find employee by phone still on roster (not permanently deleted)
    const roster = await _resolveEmpByMobile(mob);
    if(!roster) return false;
    if(['resigned'].indexOf(String(roster.status||''))>=0) return false;
    // Preserve ms / shiftMap — employee record is the source of truth
    const hasShifts = (Array.isArray(roster.ms) && roster.ms.length) || (roster.shiftMap && Object.keys(roster.shiftMap).length);
    if(wasAway || hasShifts){
      await fbSet('mobileUsers/'+mob, {
        ...(mu||{}),
        status: 'approved',
        role: (mu && mu.role==='manager') ? 'member' : (mu && mu.role) || 'member',
        name: roster.name || mu?.name || '',
        empId: roster.empId || mu?.empId || '',
        empObjId: roster.id,
        mobile: mob,
        managerId: roster.managerId || mu?.managerId || '',
        rejoinedAt: new Date().toISOString(),
        rejoinPreserveShifts: true,
        leftAt: null,
        leftReason: null
      });
      // Reactivate employee if marked left/removed
      if(roster.status==='left' || roster.status==='removed' || roster.status==='left_team'){
        try{
          await fbUpdate('employees/'+roster.id, {
            status: 'active',
            rejoinedAt: new Date().toISOString()
          });
        }catch(e){}
      }
      return true;
    }
  }catch(e){ console.warn('rejoin preserve', e); }
  return false;
}

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
    // Rejoin: same mobile left/removed earlier → restore mobileUsers link to existing employee (keeps ms/shifts)
    try{
      if(typeof _tryRejoinPreserveShifts==='function'){
        const rejoined = await _tryRejoinPreserveShifts(mobile);
        if(rejoined){
          const roster = await _resolveEmpByMobile(mobile);
          if(roster){
            const ok = await _loginRosterMemberAfterOtp(mobile, roster);
            if(ok){
              try{ toast(L('✅ वापस join — पुरानी shifts बहाल','✅ Rejoined — previous shifts restored')); }catch(e){}
              return;
            }
          }
        }
      }
    }catch(e){ console.warn('[otp] rejoin', e); }
    // Roster auto-link ONLY when mobileUsers already marks them as approved member/worker.
    // Brand-new numbers (no mobileUsers) always see Manager / Team Member choice — even if
    // the same phone appears on someone's Excel roster (that was the registration gap).
    try{
      const earlyRoster = await _resolveEmpByMobile(mobile);
      if(earlyRoster && earlyRoster.status!=='resigned' && earlyRoster.status!=='left'
          && earlyRoster.status!=='left_team' && earlyRoster.status!=='removed'){
        const mu = await fbGet('mobileUsers/'+mobile);
        const canAutoRoster = mu && (
          (mu.status==='approved' && (mu.role==='member' || mu.role==='worker'))
          || (mu.linkedVia==='roster' && mu.status!=='rejected' && mu.status!=='revoked')
        );
        if(canAutoRoster && !(mu.role==='manager' && mu.status==='approved')){
          const ok = await _loginRosterMemberAfterOtp(mobile, earlyRoster);
          if(ok) return;
        }
        // Stash roster hit so Member registration can pre-fill / one-tap join
        try{ window._otpRosterEmp = earlyRoster; }catch(e){}
      }
    }catch(e){ console.warn('[otp] early roster', e); }

    let userData=await fbGet('mobileUsers/'+mobile);
    if(userData){
      if(userData.status==='pending'){
        // Team Member pending → if on roster, already handled above; else limited app
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
        // Allow fresh re-registration after rejection (clear old record)
        try{ await fbRemove('mobileUsers/'+mobile); }catch(e){
          try{ await fbSet('mobileUsers/'+mobile, null); }catch(e2){}
        }
        toast(L('👋 पिछला registration clear — दोबारा Manager/Member चुनें','👋 Previous registration cleared — choose Manager/Member again'));
        showStep(3);
        return;
      }
      // Revoked / removed / left — treat as deleted: wipe node so next reg is fresh
      if(userData.status==='revoked' || userData.status==='left_team' || userData.status==='left' || userData.status==='removed' || userData.forceFreshLogin){
        try{ await fbRemove('mobileUsers/'+mobile); }catch(e){
          try{ await fbSet('mobileUsers/'+mobile, null); }catch(e2){
            // Last resort: overwrite with tombstone that registration can replace
            try{ await fbSet('mobileUsers/'+mobile, { status:'removed', role:'removed', forceFreshLogin:true, clearedAt:new Date().toISOString() }); }catch(e3){}
          }
        }
        // Also clear device approval so no sticky device lock
        try{
          const n = (typeof _normMobileKey==='function')?_normMobileKey(mobile):String(mobile||'').replace(/\D/g,'').slice(-10);
          if(n){ try{ await fbRemove('deviceApprovals/'+n); }catch(x){} }
          if(userData.empObjId){ try{ await fbRemove('deviceApprovals/'+userData.empObjId); }catch(x){} }
        }catch(e){}
        toast(L('👋 Account clear हो गया — दोबारा Manager या Member register करें','👋 Account cleared — register again as Manager or Member'));
        showStep(3);
        return;
      }
      try{
        const allEmp = _cache.employees || [];
        const empHit = allEmp.find(e => _normMobileKey(e.phone||e.mobile||'')===mobile);
        if(empHit && (empHit.status==='resigned'||empHit.status==='left'||empHit.status==='left_team'||empHit.status==='removed')){
          try{ await fbRemove('mobileUsers/'+mobile); }catch(e){
            try{ await fbUpdate('mobileUsers/'+mobile, { status:'removed', role:'removed', managerId:null, forceFreshLogin:true, leftAt:new Date().toISOString() }); }catch(e2){}
          }
          toast(L('👋 आप team से remove हो चुके हैं — दोबारा register करें','👋 You were removed from the team — register again'));
          showStep(3);
          return;
        }
      }catch(e){}
      if(userData.status==='approved'){
        if(userData.validTill && new Date(userData.validTill)<new Date()){
          toast(L('⏰ आपकी access expire हो गई है। Admin से validity बढ़वाएं: +91-8929394920','⏰ Your access has expired. Ask Admin to extend: +91-8929394920')); return;
        }
        // Notify Admin when approved Manager logs in (OTP already verified here — info + optional Approve for future)
        if(userData.role==='manager'){
          try{ await _notifyAdminManagerLoginAttempt(mobile, userData.name); }catch(e){}
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
              // OTP already verified on this device → auto-claim (no manager/other-device approval)
              // Manager only gets an info notification later via _notifyManagerMemberLogin
              try{
                await fbUpdate('deviceApprovals/'+empObjId, {
                  approvedDeviceId: deviceId,
                  approvedAt: new Date().toISOString(),
                  validTill: new Date(Date.now()+365*86400000).toISOString(),
                  empName: (empMatch&&empMatch.name)||userData.name||'',
                  empId: (empMatch&&empMatch.empId)||userData.empId||userData.empCode||'',
                  mobile: _normMobileKey(mobile),
                  deviceName: (typeof _guessDeviceLabel==='function'?_guessDeviceLabel():''),
                  previousDeviceId: dRec.approvedDeviceId||'',
                  via: 'otp_device_switch'
                });
              }catch(e){ console.warn('[device switch]', e); }
              // continue login below (do not return / do not open approval UI)
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
    // No mobileUsers row → always role select (Manager / Member).
    // Do not force roster auto-login here; user may want to register as Manager.
    try{
      const rosterEmp = await _resolveEmpByMobile(mobile);
      if(rosterEmp) window._otpRosterEmp = rosterEmp;
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
        toast(L('✅ Manager ने approve कर दिया — full access!','✅ Manager approved — full access!'));
        try{ buildNav().then(()=>{ goTab('home'); renderAll(); }); }catch(e){
          try{ location.reload(); }catch(e2){}
        }
        return true;
      }
      toast(L('✅ Approve हो गया! Login हो रहा है...','✅ Approved! Logging in...'));
      _launchAsNewUser(userData);
      return true;
    }else if(userData.status==='rejected'){
      _stopApprovalWatch();
      toast(L('❌ आपका रजिस्ट्रेशन reject हो गया। VKS Tech से संपर्क करें।','❌ Your registration was rejected. Contact VKS Tech.'));
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
        return `<option value="${escAttr(phoneKey)}" data-name="${escAttr(nm)}">${escHtml(nm)} (${escHtml(co)})</option>`;
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
  const errEl=document.getElementById('mgrRegErr');
  if(!name||!comp||!desig||!dept){
    if(errEl){ errEl.textContent=L('⚠️ सभी फ़ील्ड अनिवार्य हैं','⚠️ All fields are required'); errEl.classList.add('show'); } return;
  }
  // No invite code — any new manager can self-register after OTP (auto-approved)
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
    validTill: new Date(Date.now()+365*86400000).toISOString(),
    forceFreshLogin: null,
    removedAt: null,
    removedBy: null
  };
  try{
    // Overwrite any leftover deleted/removed tombstone so re-login works
    await fbSet('mobileUsers/'+mobile, userData);

    const notifBody = name+' joined as Manager\nCompany: '+comp+'\nDept: '+dept+'\nMobile: '+(_loginMobile||mobile);
    try{
      await fbPush('adminNotifications', {
        type:'manager_joined',
        title:'🆕 New Manager joined',
        body: notifBody,
        name, company:comp, department:dept, mobile:_loginMobile||mobile,
        message: name+' joined as Manager · '+comp,
        read:false,
        at: new Date().toISOString()
      });
    }catch(e){ console.warn('[mgrReg] adminNotifications', e); }
    try{ await notifyAdmin('🆕 New Manager joined', name+' · '+comp+' · '+(_loginMobile||mobile)); }catch(e){}
    // Browser push for Admin if they allowed notifications on this device earlier (best-effort)
    try{
      if(typeof Notification!=='undefined' && Notification.permission==='granted'){
        new Notification('🆕 New Manager joined', { body: name+' · '+comp, tag:'mgr-join-'+mobile });
      }
    }catch(e){}

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
  // Always refresh from network once if cache may be manager-scoped empty for this phone
  if(!all.some(e => _normMobileKey(e.phone||e.mobile||'') === mob)){
    try{
      const snap = await fbGet('employees');
      if(snap && typeof snap==='object'){
        all = Object.entries(snap).map(([k,v])=>({...(v||{}), id:(v&&v.id)||k}));
        _cache.employees = all;
      }
    }catch(e){}
  }
  const normPhone = (e)=>{
    const a = _normMobileKey(e.phone||'');
    const b = _normMobileKey(e.mobile||'');
    const c = _normMobileKey(e.whatsapp||e.wa||'');
    return [a,b,c].filter(x=>x && x.length===10);
  };
  const active = all.filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
  let match = active.find(e => normPhone(e).includes(mob));
  if(!match) match = all.find(e => normPhone(e).includes(mob));
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
  toast(L('📱 Member login: पहले Mobile Number डालें','📱 Member login: enter mobile number first'));
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

