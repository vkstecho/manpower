/* Shared with app-login-device.js — must be var (global), never bare let in another file only */
var _otpEmp = (typeof window !== 'undefined' && window._otpEmp !== undefined) ? window._otpEmp : null;
var _otpDeviceId = (typeof window !== 'undefined' && window._otpDeviceId !== undefined) ? window._otpDeviceId : null;
try { window._otpEmp = _otpEmp; window._otpDeviceId = _otpDeviceId; } catch (e) {}

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
  // Desktop: do NOT pre-render captcha on step 1.
  // Pre-warming caused a second "I'm not a robot" box next to the bottom security bar.
  // Captcha is created once when user taps Send OTP (desktop bar path).
  if(n===1){
    try{
      // Clear any leftover inline/body hosts so the form stays clean
      var inline = document.getElementById('recaptcha-inline');
      if(inline){ inline.innerHTML=''; inline.style.minHeight='0'; inline.style.display='none'; }
      var rc = document.getElementById('recaptcha-container');
      if(rc && !document.getElementById('rcDesktopBar')){
        rc.innerHTML='';
        rc.style.cssText='display:none!important;height:0;min-height:0;overflow:hidden';
      }
    }catch(e){}
  }
}

/** Full-screen pending overlay (outside loginScreen) — never black */
function showPendingBox(msgHtml){
  try{
    const ls = document.getElementById('loginScreen');
    if(ls){
      ls.classList.remove('show');
      ls.style.setProperty('display','none','important');
      ls.style.visibility='hidden';
      ls.style.opacity='0';
      ls.style.pointerEvents='none';
    }
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
      <div data-pending-msg style="font-size:13px;color:#cbd5e1;line-height:1.7;max-width:320px;margin-bottom:20px">${escHtml(defaultMsg)}</div>
      <button type="button" onclick="hidePendingBox();showStep(2);"
        style="width:min(280px,90%);padding:12px;border-radius:12px;border:1px solid rgba(249,115,22,.5);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;margin-bottom:10px">
        ${(typeof L==='function')?L('← वापस जाएं','← Back'):'← Back'}
      </button>
      <button type="button" onclick="location.reload()"
        style="width:min(280px,90%);padding:10px;border-radius:12px;border:1px solid rgba(148,163,184,.25);background:transparent;color:#cbd5e1;font-weight:600;font-size:12px;cursor:pointer;font-family:inherit">
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

function backToStep1(){ if(_loginOtpVerifying)return; _resetLoginOtp(); _stopApprovalWatch(); showStep(1); }
function showAdminLogin(){ showStep('admin'); setTimeout(()=>document.getElementById('aUser')?.focus(),100); }
// Guest multi-company entry removed — mobile OTP is the only login entry
function checkGuestCompany(){ /* removed */ }
function selectCompany(){ /* removed */ }
function showCompanyPage(){ /* removed */ }
function goToStep2(){ try{ showStep(1); }catch(e){} }

let _loginMobile='', _loginConfirmResult=null, _otpResendInterval=null;
let _loginOtpVerifying = false, _otpResendAt = 0, _otpGeneration = 0;
function _resetLoginOtp() {
  _otpGeneration++;
  _loginConfirmResult = null;
  _otpResendAt = 0;
  clearInterval(_otpResendInterval);
  _stopWebOtpListen();
}

/** v6.0.44: sync CTA from live input — never leave button HTML-disabled (blocks all taps on mobile). */
function _registrationPhone(value) {
  if (typeof value !== 'string' || !/^[+0-9 ()-]+$/.test(value.trim())) return '';
  let phone = value.replace(/[ ()-]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^[1-9][0-9]{9}$/.test(phone)) phone = '+91' + phone;
  if (/^91[1-9][0-9]{9}$/.test(phone)) phone = '+' + phone;
  return /^\+[1-9][0-9]{7,14}$/.test(phone) ? phone : '';
}

function _registrationPhoneKey(value) {
  const phone = _registrationPhone(value);
  return /^\+91[0-9]{10}$/.test(phone) ? phone.slice(3) : phone;
}

function mpSyncLoginCta(){
  try{
    var m = document.getElementById('loginMobile');
    const ok = !!_registrationPhone(m?.value);
    var btn = document.getElementById('sendOtpBtn');
    var sticky = document.getElementById('loginStickyCta');
    if(btn){
      // CRITICAL: do not use disabled attribute — Android ignores clicks on disabled buttons
      // even when opacity looks enabled after autofill / offer-label rewrite
      try{ btn.removeAttribute('disabled'); }catch(e){}
      btn.disabled = false;
      btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
      btn.style.opacity = ok ? '1' : '0.55';
      btn.style.pointerEvents = 'auto';
      btn.style.cursor = ok ? 'pointer' : 'not-allowed';
      btn.style.touchAction = 'manipulation';
    }
    if(sticky){
      try{ sticky.removeAttribute('disabled'); }catch(e){}
      sticky.disabled = false;
      sticky.style.opacity = ok ? '1' : '0.55';
      sticky.style.pointerEvents = 'auto';
    }
    return ok;
  }catch(e){ return false; }
}
function _onMobileInput(){ mpSyncLoginCta(); }
try{ window.mpSyncLoginCta = mpSyncLoginCta; window._onMobileInput = _onMobileInput; }catch(e){}

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
  if (_loginOtpVerifying || (isResend && Date.now() < _otpResendAt)) return;
  const attempt = _otpGeneration;
  // v6.0.44: always re-read mobile + unlock CTA before anything else
  try{ if(typeof mpSyncLoginCta==='function') mpSyncLoginCta(); }catch(e){}
  try{
    var _t0 = window._mpOtpSendStartedAt || 0;
    if(window._mpOtpSendInFlight && (!_t0 || (Date.now()-_t0) > 20000)){
      window._mpOtpSendInFlight = false;
    }
  }catch(e){ window._mpOtpSendInFlight = false; }
  if(window._mpOtpSendInFlight){
    try{ toast(L('⏳ OTP पहले से भेज रहे हैं — सुरक्षा जाँच पूरा करें','⏳ OTP already sending — complete the security check')); }catch(e){}
    return;
  }
  // Device-OTP overlay uses same button id sometimes — route if employee flow active
  // v6.0.44: never ReferenceError if device module lag / let-scope miss
  try {
    var __oe = (typeof _otpEmp !== 'undefined') ? _otpEmp : (window._otpEmp || null);
    var __ov = document.getElementById('otpLoginOverlay');
    if(__oe && __ov && __ov.style.display !== 'none' && __ov.style.display !== ''){
      if(typeof _sendDeviceOTP === 'function') return _sendDeviceOTP(!!isResend);
    }
  } catch (e) { console.warn('[otp] device route', e); }

  const fullPhone = _registrationPhone(document.getElementById('loginMobile')?.value);
  if (!fullPhone) { toast(L('देश कोड सहित मोबाइल नंबर डालें।', 'Enter a mobile number with its country code.')); return; }
  const mobile = _registrationPhoneKey(fullPhone);
  const legacyIndianPhone = /^\d{10}$/.test(mobile);
  _loginMobile=fullPhone;
  const errEl=document.getElementById('loginErr');
  if(errEl) errEl.textContent='';

  // v6.0.70: Admin-approved login → skip SMS OTP when bypass stamp / approved request exists
  window._mpOtpSendInFlight = true;
  try{ window._mpOtpSendStartedAt = Date.now(); }catch(e){}
  // Instant UI feedback — was delayed until after several Firebase reads
  const sendBtn = document.getElementById('sendOtpBtn');
  const stickyBtn = document.getElementById('loginStickyCta');
  const _btnPrev = sendBtn ? sendBtn.innerHTML : '';
  if(sendBtn){
    sendBtn.disabled = false;
    try{ sendBtn.removeAttribute('disabled'); }catch(e){}
    sendBtn.style.opacity = '0.85';
    sendBtn.style.pointerEvents = 'auto';
    sendBtn.textContent = L('⏳ भेजा जा रहा है…','⏳ Sending…');
  }
  if(stickyBtn){ stickyBtn.disabled = true; stickyBtn.style.opacity = '0.7'; }
  const _restoreBtn = ()=>{
    window._mpOtpSendInFlight = false;
    try{ window._mpOtpSendStartedAt = 0; }catch(e){}
    try{ if(typeof mpSyncLoginCta==='function') mpSyncLoginCta(); }catch(e){}
    if(!sendBtn) return;
    const ok = !!_registrationPhone(document.getElementById('loginMobile')?.value);
    try{ sendBtn.removeAttribute('disabled'); }catch(e){}
    sendBtn.disabled = false;
    sendBtn.style.opacity = ok ? '1' : '.55';
    sendBtn.style.pointerEvents = 'auto';
    sendBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
    // Prefer current language label over stale HTML
    try{
      sendBtn.innerHTML = (typeof L==='function')
        ? L('OTP भेजें 💬','Send OTP 💬')
        : (_btnPrev || 'Send OTP 💬');
    }catch(e){ sendBtn.innerHTML = _btnPrev || 'Send OTP 💬'; }
    if(stickyBtn){ stickyBtn.disabled = !ok; stickyBtn.style.opacity = ok ? '1' : '.5'; }
  };
  const _setBtnCaptchaWait = ()=>{
    if(!sendBtn) return;
    try{ sendBtn.removeAttribute('disabled'); }catch(e){}
    sendBtn.disabled = false;
    sendBtn.style.opacity = '0.9';
    sendBtn.style.pointerEvents = 'auto';
    sendBtn.innerHTML = (typeof L==='function')
      ? L('🔐 सुरक्षा जाँच पूरा करें','🔐 Complete security check')
      : '🔐 Complete security check';
  };
  try{ window._mpSetOtpBtnCaptchaWait = _setBtnCaptchaWait; }catch(e){}

  // ── One parallel fetch (was 2–4 sequential RTDB reads → slow) ──
  let userData = null, dRec = null;
  if(legacyIndianPhone && !isResend && !window._forceOtpAfterMgrWait && !window._forceOtpAfterPwForgot){
    try{
      const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';
      userData = await Promise.race([
        fbGet('mobileUsers/'+mobile),
        new Promise(r=>setTimeout(()=>r(null), 2000))
      ]);
      if(userData && userData.status==='approved' && !userData.forceFreshLogin &&
         (userData.role==='member' || userData.role==='manager' || userData.role==='worker') &&
         String(userData.role||'').toLowerCase()!=='removed'){
        if(!(userData.validTill && new Date(userData.validTill)<new Date())){
          const empObjId = userData.empObjId || userData.employeeId || '';
          const savedPw = (typeof _getDevicePasswordHash==='function') ? _getDevicePasswordHash(empObjId, mobile) : null;
          if(empObjId){
            try{ dRec = await _mpFbGet('deviceApprovals/'+empObjId); }catch(e){}
          }
          let deviceOk = !!(dRec && dRec.approvedDeviceId === deviceId && dRec.validTill && new Date(dRec.validTill)>new Date());
          let recentPhone = false;
          try{
            const had = (localStorage.getItem('mp_device_phone')||'').replace(/\D/g,'').slice(-10);
            const vat = parseInt(localStorage.getItem('mp_device_verified_at')||'0',10);
            recentPhone = (had===mobile && vat && (Date.now()-vat) < 90*24*3600*1000);
          }catch(e){}
          if(savedPw && (deviceOk || recentPhone)){
            _restoreBtn();
            showPasswordLoginForMobile(userData, mobile, deviceId);
            return;
          }
          if((deviceOk || recentPhone) && !savedPw){
            _restoreBtn();
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
          // Other device active → notify path (members only)
          if((userData.role==='member' || userData.role==='worker') && dRec && dRec.approvedDeviceId && dRec.approvedDeviceId !== deviceId
              && dRec.validTill && new Date(dRec.validTill) > new Date()){
            const _isHard = (typeof _isHardAdminPhone==='function')
              ? _isHardAdminPhone(mobile)
              : false;
            if(!_isHard){
              _restoreBtn();
              showOtherDeviceLoginRequest({
                id: empObjId,
                empId: userData.empId||userData.empCode||'',
                name: userData.name||'',
                phone: mobile,
                mobile: mobile
              }, dRec, deviceId);
              return;
            }
          }
          // Manager login attempt → notify admin in background (do NOT await)
          if(userData.role==='manager'){
            try{ Promise.resolve(_notifyAdminManagerLoginAttempt(mobile, userData.name)).catch(()=>{}); }catch(e){}
          }
        }
      }
    }catch(e){ console.warn('[login] pre-otp checks', e); }
  }
  window._forceOtpAfterPwForgot = false;
  window._forceOtpAfterMgrWait = false;

  try{
    const _desk = (typeof _isDesktopLoginUA==='function') ? _isDesktopLoginUA() : !(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||''));
    // Stay on step 1 until Firebase accepts the send (captcha must be done first on desktop)
    try{ showStep(1); }catch(e){}
    if(_desk){
      try{ _setBtnCaptchaWait(); }catch(e){}
      toast(L('🔐 नीचे सुरक्षा चेकबॉक्स ✓ करें — टिक के बाद ही OTP जाएगा','🔐 Tick the security checkbox below — OTP sends only after that'));
      // Single captcha only: desktop bar is created inside _fbSendPhoneOtp — do not pre-mount another host
    } else {
      toast(isResend ? L('⏳ OTP फिर भेजा जा रहा है…','⏳ Resending OTP…') : L('OTP भेजा जा रहा है...','Sending OTP...'));
    }
    // Do NOT open Enter OTP until captcha + Firebase succeed
    if(typeof _fbSendPhoneOtp!=='function'){
      throw new Error('OTP module not loaded — hard refresh the page (Ctrl+Shift+R)');
    }
    const confirmation = await _fbSendPhoneOtp(fullPhone, 'recaptcha-container', '_fbRecaptchaNew');
    if (attempt !== _otpGeneration) return;
    _loginConfirmResult = confirmation;
    // Only now move to OTP entry
    showStep(2);
    const otpError = document.getElementById('loginErr2');
    if (otpError) otpError.textContent = '';
    const sentEl=document.getElementById('otpSentTo');
    if(sentEl) sentEl.textContent=L(fullPhone+' पर OTP भेजा गया','OTP sent to '+fullPhone);
    const otpEl = document.getElementById('otpInput');
    if(otpEl){
      otpEl.value = '';
      _onOtpInput('');
      try{
        otpEl.setAttribute('autocomplete','one-time-code');
        otpEl.setAttribute('name','one-time-code');
        otpEl.setAttribute('inputmode','numeric');
        otpEl.setAttribute('type','text');
        // Mentor: focus so system can show tappable OTP chip above keyboard
        setTimeout(function(){ try{ otpEl.focus(); }catch(e){} }, 100);
        setTimeout(function(){ try{ otpEl.focus(); }catch(e){} }, 500);
      }catch(e){}
    }
    _startResendTimer();
    try{
      if(typeof _startWebOtpListen==='function'){
        _startWebOtpListen('otpInput', function(code){
          if(code && String(code).replace(/\D/g,'').length===6){
            setTimeout(function(){ try{ _verifyOTP(); }catch(e){} }, 200);
          }
        });
      }
    }catch(e){}
    toast(L('✅ OTP भेज दिया। कीबोर्ड पर कोड दिखे तो उसे चुनें।','✅ OTP sent! Tap the code on your keyboard if shown.'));
    try{ _restoreBtn(); }catch(e){}
  }catch(err){
    console.error('OTP error:',err);
    try{ _restoreBtn(); }catch(e){}
    // Captcha not done / send failed — stay on mobile step, do not leave user on empty OTP screen
    try{ showStep(1); }catch(e){}
    try{
      // Desktop uses bottom security bar on next Send — do not inject a second inline widget
      if(!(typeof _isDesktopLoginUA==='function' && _isDesktopLoginUA())){
        if(typeof _fbShowRecaptchaSlotNow==='function') _fbShowRecaptchaSlotNow('recaptcha-container');
      }
    }catch(e){}
    const msg = '❌ '+(typeof _fbOtpErrorMessage==='function' ? _fbOtpErrorMessage(err) : (err&&err.message)||String(err));
    if(errEl) errEl.textContent=msg; toast(msg);
  }finally{
    // Never leave button stuck on "Sending…"
    try{ _restoreBtn(); }catch(e){}
  }
}

async function doLoginAfterApproval(emp){
  const auth = window._fbAuth?.currentUser;
  if (auth?.phoneNumber && emp?.id && await launchVerifiedRosterSession(auth.phoneNumber, emp.id)) return;
  throw new Error(L('अपने खाते में ओटीपी से प्रवेश करें।', 'Sign in to your account with OTP.'));
}

function _startResendTimer() {
  _otpResendAt = Date.now()+30000;
  const timer = document.getElementById('otpResendTimer');
  const resend = document.getElementById('otpResendBtn');
  clearInterval(_otpResendInterval);
  function renderCountdown() {
    const secs = Math.max(0, Math.ceil((_otpResendAt-Date.now())/1000));
    if (timer) timer.textContent = secs ? L(secs+' सेकंड में फिर भेजें','Resend in '+secs+'s') : '';
    if (resend) resend.style.display = secs ? 'none' : 'inline-flex';
    if (!secs) clearInterval(_otpResendInterval);
  }
  _otpResendInterval = setInterval(renderCountdown,1000);
  renderCountdown();
}

async function _verifyOTP(){
  if (_loginOtpVerifying) return;
  _stopWebOtpListen();

  // If device OTP overlay is open, use device flow
  const ov = document.getElementById('otpLoginOverlay');
  try {
    var __oe2 = (typeof _otpEmp !== 'undefined') ? _otpEmp : (window._otpEmp || null);
    if(__oe2 && ov && ov.style.display !== 'none' && ov.style.display !== ''){
      if(typeof _verifyDeviceOTP === 'function') return _verifyDeviceOTP();
    }
  } catch (e) { console.warn('[otp] device verify route', e); }

  const otp=(document.getElementById('otpInput')?.value||'').trim().replace(/\D/g,'');
  if(otp.length!==6){ toast(L('⚠️ 6 अंकों का OTP डालें','⚠️ Enter the 6-digit OTP')); return; }
  if(!_loginConfirmResult){ toast(L('⚠️ OTP पहले भेजें','⚠️ Send OTP first')); return; }
  _loginOtpVerifying = true;
  try{
    const errEl=document.getElementById('loginErr2');
    if(errEl) errEl.textContent='';
    toast(L('⏳ सत्यापित हो रहा है...','⏳ Verifying...'));
    await _fbVerifyPhoneOtp(_loginConfirmResult, otp);
    _loginConfirmResult = null;
    toast(L('✅ मोबाइल सत्यापित!','✅ Mobile Verified!'));
    await _checkUserAfterOTP();
  }catch(err){
    if (['auth/code-expired','auth/session-expired','auth/invalid-verification-id'].includes(err.code)) {
      _loginConfirmResult = null;
      _otpResendAt = 0;
    }
    const errEl=document.getElementById('loginErr2');
    const msg='❌ '+_fbOtpErrorMessage(err);
    if(errEl) errEl.textContent=msg; toast(msg);
  } finally { _loginOtpVerifying = false; }
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
    await _mpFbPush('adminNotifications', notif);
    // Optional pending loginRequests for Admin Approve without OTP
    try{
      await _mpFbPush('loginRequests', {
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
      try{ await _mpFbPush('userNotifications/'+mid, notif); }catch(e){}
      try{
        const mgrRec = await _mpFbGet('mobileUsers/'+mid);
        if(mgrRec && (mgrRec.empObjId||mgrRec.employeeId)){
          await _mpFbPush('userNotifications/'+(mgrRec.empObjId||mgrRec.employeeId), notif);
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
  // v6.0.66: NEVER auto-rejoin after account delete / manager remove.
  // Removed users must go through Manager/Member registration again.
  // (Old behaviour reactivated left_team rows and skipped registration.)
  try{
    const mob = String(mobile||'').replace(/\D/g,'').slice(-10);
    if(mob.length!==10) return false;
    let mu = null;
    try{ mu = await _mpFbGet('mobileUsers/'+mob); }catch(e){}
    if(mu){
      const st = String(mu.status||'').toLowerCase();
      const role = String(mu.role||'').toLowerCase();
      if(mu.forceFreshLogin === true || st==='removed' || st==='revoked' || st==='left' || st==='left_team'
          || role==='removed' || st==='rejected'){
        return false;
      }
    }
    try{
      if(localStorage.getItem('mp_force_fresh_'+mob)==='1') return false;
    }catch(e){}
    const roster = await _resolveEmpByMobile(mob);
    if(!roster) return false;
    const rst = String(roster.status||'').toLowerCase();
    if(['resigned','left','left_team','removed','revoked','inactive'].indexOf(rst)>=0) return false;
    // Only allow soft rejoin when BOTH mobileUsers is still approved AND employee is still active
    if(!(mu && String(mu.status||'').toLowerCase()==='approved')) return false;
    return false; // disabled: auto-rejoin caused ghost logins; user must register or be re-added by manager
  }catch(e){ console.warn('rejoin preserve', e); }
  return false;
}

async function _loginRosterMemberAfterOtp(mobile, empMatch){
  const mob = (typeof _normMobileKey==='function') ? _normMobileKey(mobile) : String(mobile||'').replace(/\D/g,'').slice(-10);
  if(!mob || mob.length!==10 || !empMatch) return false;
  // v6.0.66: never silent-login removed / left employees
  try{
    const rst = String(empMatch.status||'').toLowerCase();
    if(['resigned','left','left_team','removed','revoked','inactive'].indexOf(rst)>=0) return false;
  }catch(e){}
  try{
    if(localStorage.getItem('mp_force_fresh_'+mob)==='1') return false;
  }catch(e){}
  try{
    const muBlock = await _mpFbGet('mobileUsers/'+mob);
    if(muBlock && (muBlock.forceFreshLogin===true
        || ['removed','revoked','left','left_team'].indexOf(String(muBlock.status||'').toLowerCase())>=0
        || String(muBlock.role||'').toLowerCase()==='removed')){
      return false;
    }
  }catch(e){}
  const deviceId = (typeof getDeviceId==='function') ? getDeviceId() : '';
  const managerId = (typeof _normMobileKey==='function')
    ? _normMobileKey(empMatch.managerId||empMatch.managerMobile||'')
    : String(empMatch.managerId||'').replace(/\D/g,'').slice(-10);

  let existing = null;
  try{ existing = await _mpFbGet('mobileUsers/'+mob); }catch(e){}

  // v6.0.7: if employee row is under another manager as worker/member, FORCE member role
  // (stale mobileUsers.role=manager was causing "only my shift" after joining another team)
  const underOtherMgr = !!(managerId && managerId.length===10 && managerId !== mob);
  const empSaysWorker = (
    String(empMatch.accessLevel||'').toLowerCase()==='worker'
    || String(empMatch.role||'').toLowerCase()==='member'
    || empMatch._forceMemberLogin
  );
  const forceMember = underOtherMgr && (empSaysWorker || empMatch._forceMemberLogin || underOtherMgr);
  const resolvedRole = forceMember ? 'member' : (
    (!underOtherMgr && existing && existing.role==='manager') ? 'manager' : 'member'
  );

  const userData = {
    role: resolvedRole,
    name: empMatch.name || (existing && existing.name) || '',
    mobile: '+91'+mob,
    phone: mob,
    company: empMatch.company || (existing && existing.company) || '',
    status: 'approved',
    empCode: empMatch.empId || (existing && (existing.empCode||existing.empId)) || '',
    empId: empMatch.empId || (existing && existing.empId) || '',
    empObjId: empMatch.id || (existing && (existing.empObjId||existing.employeeId)) || '',
    employeeId: empMatch.id || (existing && (existing.empObjId||existing.employeeId)) || '',
    managerId: managerId || (forceMember ? managerId : (existing && existing.managerId)) || '',
    managerMobile: managerId || (existing && existing.managerMobile) || '',
    section: empMatch.sec || empMatch.section || (existing && existing.section) || '',
    registeredAt: (existing && existing.registeredAt) || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    linkedVia: forceMember ? 'roster_member' : 'roster_otp',
    wasManager: forceMember && existing && existing.role==='manager' ? true : (existing && existing.wasManager) || false,
    validTill: (existing && existing.validTill) || new Date(Date.now()+365*86400000).toISOString()
  };

  // Write without forcing illegal status transitions that rules reject
  try{
    if(!existing){
      await _mpFbSet('mobileUsers/'+mob, userData);
    } else {
      const patch = Object.assign({}, userData);
      // Never keep manager role when joining another manager's roster as member
      if(forceMember) patch.role = 'member';
      patch.status = 'approved';
      await _mpFbUpdate('mobileUsers/'+mob, patch);
    }
  }catch(e){
    console.warn('[roster login] mobileUsers write', e);
    // Still try launch with in-memory userData if write blocked
  }

  // Claim this device
  const empObjId = userData.empObjId || '';
  if(empObjId && deviceId){
    try{
      await _mpFbUpdate('deviceApprovals/'+empObjId, {
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

async function launchVerifiedRosterSession(mobile, expectedEmployeeId = null, restoring = false) {
  await window._fbAuthStateReady?.();
  const user = window._fbAuth?.currentUser;
  const fullPhone = _registrationPhone(mobile);
  mobile = _registrationPhoneKey(fullPhone);
  if (!user || user.isAnonymous || !fullPhone || user.phoneNumber !== fullPhone) return false;
  const identity = await window._fbCall('getMyRosterIdentity',{includeDetails:true});
  if (identity.uid !== user.uid || window._fbAuth?.currentUser?.uid !== user.uid ||
      (expectedEmployeeId && identity.employeeId !== expectedEmployeeId)) return false;
  if (identity.admin) return _launchAsHardAdmin(fullPhone, identity.uid, restoring);
  if (!identity.employeeId) return false;
  const [employee, profiles] = Object.hasOwn(identity,'employee') ? [identity.employee, identity.profiles] : await Promise.all([
    _mpFbGet('employees/' + identity.employeeId),
    window._fbCall('getMyOwnedProfiles')
  ]);
  const approved = Object.entries(profiles || {}).filter(([,row]) => row?.status === 'approved');
  const [profileKey, profile] = profiles?.[mobile] ? [mobile,profiles[mobile]] : approved.length === 1 ? approved[0] : ['',null];
  const profileValues = {};
  if (profile?.profileUpdatedAt) for (const field of ['name','dob','joiningDate','salary','monthlySalary','woff','designation','sec','mc','machine','resp','responsibility','photoUrl']) {
    if (Object.hasOwn(profile,field)) profileValues[field] = profile[field];
  }
  if (window._fbAuth?.currentUser?.uid !== user.uid || !employee || profile?.forceFreshLogin || ['removed','revoked','left','left_team'].includes(profile?.status)) return false;
  _launchAsNewUser({
    ...profile, profileKey, profileValues, name: profileValues.name || employee.name, mobile: fullPhone || '',
    company: employee.companyLabel || profile?.company || employee.companyId,
    companyId: identity.companyKey, managerId: employee.managerId || '',
    managerUid: identity.managerUid || '', empObjId: identity.employeeId, empId: employee.empId,
    role: identity.manager ? 'manager' : 'member', status: 'approved',
    rosterLinked: true, authUid: identity.uid, individual: identity.independent, restoring,
    joinRequestPending: identity.independent && profile?.status === 'pending'
  });
  if (SESSION.joinRequestPending) _watchApprovalStatus(mobile);
  return true;
}

async function _checkUserAfterOTP(){
  let message;
  try {
    const user = window._fbAuth?.currentUser;
    if (!user || user.isAnonymous || user.phoneNumber !== _registrationPhone(_loginMobile)) {
      throw new Error('Verified mobile session required');
    }
    if (await launchVerifiedRosterSession(_loginMobile)) return;
    const profiles = await window._fbCall('getMyOwnedProfiles');
    if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) throw new Error('Account lookup incomplete');
    const pending = Object.entries(profiles).filter(([,row]) => row?.status === 'pending' && row.accountUid === user.uid);
    if (pending.length === 1) {
      const [key, profile] = pending[0];
      _launchAsNewUser({...profile,authUid:user.uid});
      _watchApprovalStatus(key);
      return;
    }
    const existing = Object.values(profiles).some(profile =>
      profile && !(profile.status === 'cancelled' && profile.accountUid === user.uid));
    if (!existing) {
      const identity = await window._fbCall('getMyRosterIdentity', {checkRegistration:true});
      if (identity?.uid !== user.uid || typeof identity.registrationAllowed !== 'boolean') {
        throw new Error('Registration eligibility could not be confirmed');
      }
      if (identity.registrationAllowed === true) return showStep(3);
    }
    message = L('इस मोबाइल नंबर से जुड़ा रिकॉर्ड जाँच के लिए लंबित है। अपने खाते की पहुँच बहाल करने के लिए व्यवस्थापक से संपर्क करें।',
      'This mobile number needs an account review. Contact your administrator to restore access to your account.');
  } catch (error) {
    console.warn('[roster identity]', error?.code || error?.message);
    message = L('खाते की जाँच पूरी नहीं हो सकी। फिर कोशिश करें या व्यवस्थापक से संपर्क करें।',
      'We could not check your account. Try again or contact your administrator.');
  }
  showStep(2);
  document.getElementById('loginErr2').textContent = message;
  toast(message);
}

let _approvalWatchActive=false;
let _approvalPollTimer=null;
let _approvalWatchGeneration=0;
function _watchApprovalStatus(mobile){
  if(_approvalWatchActive) return;
  _approvalWatchActive=true;
  const generation = ++_approvalWatchGeneration;
  const handleUpdate = userData => {
    if (!_approvalWatchActive || generation !== _approvalWatchGeneration || !userData) return;
    const uid = window._fbAuth?.currentUser?.uid;
    if (!uid || userData.accountUid !== uid) return;
    if (userData.status === 'approved' && !userData.individual && userData.empObjId) {
      _stopApprovalWatch();
      launchVerifiedRosterSession(window._fbAuth.currentUser.phoneNumber, userData.empObjId)
        .then(ok => {
          if (ok) toast(L('Manager ने स्वीकृति दे दी।','Manager approved your request.'));
        }).catch(error => toast(error.message));
    } else if (userData.status === 'rejected' || userData.status === 'cancelled') {
      _stopApprovalWatch();
      SESSION.joinRequestPending = false;
      if (!SESSION.rosterLinked) {
        SESSION.pendingApproval = false;
        SESSION.status = userData.status;
      }
      saveSession();
      if (userData.status === 'rejected') toast(L('Manager ने अनुरोध अस्वीकार किया।','Manager rejected your request.'));
    }
  };

  // Primary: realtime listener (instant, but can be affected by tab throttling)
  fbListen('mobileUsers/'+mobile, handleUpdate);

  // Backup: poll every 8s in case the realtime connection is stale/throttled
  if(_approvalPollTimer) clearInterval(_approvalPollTimer);
  _approvalPollTimer=setInterval(async()=>{
    if(!_approvalWatchActive){ clearInterval(_approvalPollTimer); return; }
    try{
      const userData=await _mpFbGet('mobileUsers/'+mobile);
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
  setTimeout(()=>{ if(role==='manager') showStep('mgrReg'); else showStep('memReg'); },200);
}

function _toggleOtherField(selectId,otherId){
  const sel=document.getElementById(selectId);
  const other=document.getElementById(otherId);
  if(!sel||!other) return;
  other.style.display=sel.value==='Others'?'block':'none';
  if(sel.value==='Others') other.focus();
}


/** Ensure Firebase write helpers exist (guards against app-core load/cache issues) */
async function _mpEnsureFb(){
  try{ if(typeof window.__mpBindFbHelpers==='function') window.__mpBindFbHelpers(); }catch(e){}
  if(typeof fbSet==='function' && typeof fbGet==='function') return true;
  if(typeof window.fbSet==='function' && typeof window.fbGet==='function'){
    try{ if(typeof fbSet!=='function') fbSet = window.fbSet; }catch(e){ try{ window.fbSet = window.fbSet; }catch(e2){} }
    return true;
  }
  // Fallback: build from window._fbAccess (firebase-init module)
  if(typeof window._fbAccess==='function'){
    if(typeof window.fbGet!=='function'){
      window.fbGet = async function(path){
        const snap = await window._fbAccess('get', path);
        return snap && snap.exists && snap.exists() ? snap.val() : (snap && snap.val ? snap.val() : snap);
      };
    }
    if(typeof window.fbSet!=='function'){
      window.fbSet = async function(path, val){ return window._fbAccess('set', path, val); };
    }
    if(typeof window.fbUpdate!=='function'){
      window.fbUpdate = async function(path, val){ return window._fbAccess('update', path, val); };
    }
    if(typeof window.fbPush!=='function'){
      window.fbPush = async function(path, val){ return window._fbAccess('push', path, val); };
    }
    if(typeof window.fbRemove!=='function'){
      window.fbRemove = async function(path){ return window._fbAccess('remove', path); };
    }
    // Also expose as globals when possible
    try{ if(typeof fbSet!=='function'){ var g=window; g.fbSet=window.fbSet; g.fbGet=window.fbGet; g.fbUpdate=window.fbUpdate; g.fbPush=window.fbPush; g.fbRemove=window.fbRemove; } }catch(e){}
    return true;
  }
  // Wait briefly for module init
  for(let i=0;i<20;i++){
    await new Promise(r=>setTimeout(r,100));
    try{ if(typeof window.__mpBindFbHelpers==='function') window.__mpBindFbHelpers(); }catch(e){}
    if(typeof fbSet==='function' || typeof window.fbSet==='function' || typeof window._fbAccess==='function'){
      return _mpEnsureFb();
    }
  }
  return false;
}
async function _mpFbSet(path, val){
  const ok = await _mpEnsureFb();
  if(typeof fbSet==='function') return fbSet(path, val);
  if(typeof window.fbSet==='function') return window.fbSet(path, val);
  if(typeof window._fbAccess==='function') return window._fbAccess('set', path, val);
  throw new Error(ok ? 'fbSet unavailable' : 'Firebase not ready — refresh page');
}
async function _mpFbGet(path){
  await _mpEnsureFb();
  if(typeof fbGet==='function') return fbGet(path);
  if(typeof window.fbGet==='function') return window.fbGet(path);
  if(typeof window._fbAccess==='function'){
    const snap = await window._fbAccess('get', path);
    return snap && snap.exists && snap.exists() ? snap.val() : null;
  }
  throw new Error('fbGet unavailable');
}
async function _mpFbPush(path, val){
  await _mpEnsureFb();
  if(typeof fbPush==='function') return fbPush(path, val);
  if(typeof window.fbPush==='function') return window.fbPush(path, val);
  if(typeof window._fbAccess==='function') return window._fbAccess('push', path, val);
  throw new Error('fbPush unavailable');
}
async function _mpFbUpdate(path, val){
  await _mpEnsureFb();
  if(typeof fbUpdate==='function') return fbUpdate(path, val);
  if(typeof window.fbUpdate==='function') return window.fbUpdate(path, val);
  if(typeof window._fbAccess==='function') return window._fbAccess('update', path, val);
  throw new Error('fbUpdate unavailable');
}
try{
  window._mpEnsureFb = _mpEnsureFb;
  window._mpFbSet = _mpFbSet;
  window._mpFbGet = _mpFbGet;
  window._mpFbPush = _mpFbPush;
  window._mpFbUpdate = _mpFbUpdate;
}catch(e){}

async function _submitManagerReg(){
  const field = id => document.getElementById(id)?.value.trim() || '';
  const designation = field('mgrDesignation');
  const section = field('mgrDepartment');
  const errorEl = document.getElementById('mgrRegErr');
  try {
    const result = await window._fbCall('registerManagerCompany', {
      name: field('mgrName'), displayName: field('mgrCompany'),
      designation: designation === 'Others' ? field('mgrDesignationOther') : designation,
      section: section === 'Others' ? field('mgrDepartmentOther') : section
    });
    if (!await launchVerifiedRosterSession(_loginMobile, result.employeeId)) {
      throw Error(L('फिर से मोबाइल सत्यापित करें।', 'Verify your phone again to sign in.'));
    }
    window.MP_LAUNCH_ONBOARDING?.start({trial:result.trialStarted===true});
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.add('show');
  }
}

async function _submitMemberReg(){
  const name=(document.getElementById('memName')?.value||'').trim();
  const comp=(document.getElementById('memCompany')?.value||'').trim();
  const managerId = (document.getElementById('memManagerPhone')?.value || '').trim();
  const errEl = document.getElementById('memRegErr');
  const mobile = _registrationPhoneKey(_loginMobile);
  if (!name || !mobile) {
    errEl.textContent = L('नाम और सत्यापित मोबाइल ज़रूरी हैं।', 'Name and verified mobile are required.');
    errEl.classList.add('show');
    return;
  }
  const _memCode=(document.getElementById('memEmpCode')?.value||'').trim();
  if (!managerId) {
    try {
      const profile = await window._fbCall('registerIndependent', {name, company: comp, code: _memCode});
      if (await launchVerifiedRosterSession(_loginMobile, profile.empObjId)) {
        window.MP_LAUNCH_ONBOARDING?.start({trial:profile.paymentTrialGranted===true && Date.now()-Date.parse(profile.firstLoginAt)<120000});
      }
    } catch (error) {
      if (errEl) { errEl.textContent = error.message; errEl.classList.add('show'); }
    }
    return;
  }
  try {
    const profile = await window._fbCall('manageTeamMembership', {
      action:'request', name, company:comp, code:_memCode, managerPhone:managerId
    });
    toast(L('पंजीकरण पूरा हुआ। प्रबंधक की स्वीकृति बाकी है।','Registered. Manager approval is pending.'));
    _launchAsNewUser(profile);
    window.MP_LAUNCH_ONBOARDING?.start();
    setTimeout(() => { try { _watchApprovalStatus(mobile); } catch (error) {} }, 800);
  } catch (error) {
    if (errEl) { errEl.textContent = error.message; errEl.classList.add('show'); }
  }
}

/** Launch session as full Admin from OTP (hard-admin phone list) */
function _isAdminMobileQuick(m){
  const d = String(m||'').replace(/\D/g,'');
  const last10 = d.slice(-10);
  try{ if(typeof _isHardAdminPhone==='function' && _isHardAdminPhone(m)) return true; }catch(e){}
  try{ if(typeof MP_UTILS!=='undefined' && MP_UTILS.isHardAdminPhone && MP_UTILS.isHardAdminPhone(m)) return true; }catch(e){}
  try{
    const list = (typeof CFG!=='undefined' && CFG.hardAdminPhones) || (typeof MP_CFG!=='undefined' && MP_CFG.hardAdminPhones) || [];
    for(let i=0;i<list.length;i++){
      const x = String(list[i]||'').replace(/\D/g,'').slice(-10);
      if(x && x === last10) return true;
    }
  }catch(e){}
  return false;
}
function _launchAsHardAdmin(mobile10, authUid, restoring = false){
  try{
    const phone = _registrationPhone(mobile10);
    const user = window._fbAuth?.currentUser;
    if (!phone || !authUid || user?.uid !== authUid || user.phoneNumber !== phone) return false;
    SESSION = {
      uid: phone,
      authUid,
      name: 'ADMIN',
      role: 'admin',
      company: '',
      companyId: 'ALL',
      viewCompanyId: 'ALL',
      managerId: '',
      mobile: phone,
      empId: '',
      empObjId: '',
      newUser: false,
      loginAt: new Date().toISOString()
    };
    try{ if(typeof writeIntegrityToken==='function') writeIntegrityToken(); }catch(e){}
    try{ localStorage.setItem('mp_int_ok','1'); }catch(e){}
    try{ if(typeof saveSession==='function') saveSession(); }catch(e){}
    try{
      if(!restoring && typeof _recordLoginEvent==='function') _recordLoginEvent({
        name: 'ADMIN', mobile: SESSION.mobile, company: '—', role: 'admin', method: 'admin_otp'
      });
    }catch(e){}
    if(!restoring) try{ toast(L('✅ व्यवस्थापक लॉगिन','✅ Admin login')); }catch(e){}
    try{
      const ls = document.getElementById('loginScreen');
      if(ls){ ls.style.display='none'; ls.classList.remove('show'); }
      const s3 = document.getElementById('loginStep3');
      if(s3) s3.style.display='none';
    }catch(e){}
    try{
      if(typeof launchApp==='function'){
        const p = launchApp();
        if(p && typeof p.catch==='function') p.catch(err=>{ console.error('[admin launchApp]', err); });
      } else {
        setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 400);
      }
    }catch(e){ console.error('[admin] launchApp', e); }
    return true;
  }catch(e){
    console.error('[admin] _launchAsHardAdmin failed', e);
    return false;
  }
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
      const snap = await _mpFbGet('employees');
      if(snap && typeof snap==='object'){
        all = Object.entries(snap).filter(([k,v])=>k!=='undefined'&&v&&typeof v==='object').map(([k,v])=>({...v, id:k, _key:k, memberUid:k}));
        _cache.employees = all;
      }
    }catch(e){}
  }
  // Always refresh from network once if cache may be manager-scoped empty for this phone
  if(!all.some(e => _normMobileKey(e.phone||e.mobile||'') === mob)){
    try{
      const snap = await _mpFbGet('employees');
      if(snap && typeof snap==='object'){
        all = Object.entries(snap).filter(([k,v])=>k!=='undefined'&&v&&typeof v==='object').map(([k,v])=>({...v, id:k, _key:k, memberUid:k}));
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
      try{ await _mpFbUpdate('mobileUsers/'+mob, patch); }catch(e){ console.warn('[syncMU]', e); }
      // Fix deviceApprovals under CURRENT emp id
      if(match.id && deviceId){
        try{
          await _mpFbUpdate('deviceApprovals/'+match.id, {
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
          await _mpFbUpdate('deviceApprovals/'+oldId, {
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
        await _mpFbUpdate('mobileUsers/'+mob, {
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
  const mob = _registrationPhoneKey(userData.mobile || userData.uid);
  SESSION.uid=userData.mobile;
  SESSION.authUid=userData.authUid || (userData.accountUid === window._fbAuth?.currentUser?.uid ? userData.accountUid : '') || '';
  SESSION.rosterLinked=userData.rosterLinked===true;
  SESSION.name=userData.name;
  SESSION.role=userData.role;
  if (userData.rosterLinked) {
    SESSION.profileKey = userData.profileKey || '';
    SESSION.profileValues = userData.profileValues || {};
    SESSION.photoUrl = userData.photoUrl || '';
  } else if(userData.photoUrl) SESSION.photoUrl = userData.photoUrl;
  SESSION.company=userData.company||'';
  SESSION.companyId=userData.companyId||'default';
  SESSION.managerId=userData.managerId||'';
  SESSION.managerUid=userData.managerUid||'';
  SESSION.mobile=userData.mobile;
  SESSION.empId=userData.empId||userData.empCode||'';
  SESSION.empObjId=userData.empObjId||userData.employeeId||'';
  SESSION.status=userData.status||'approved';
  SESSION.pendingApproval=(userData.role==='member' && userData.status==='pending');
  SESSION.individual=userData.individual===true;
  SESSION.joinRequestPending=userData.joinRequestPending===true;
  // Sync managerId from employees roster if mobileUsers missing/wrong (fixes 0-member count)
  if(!SESSION.rosterLinked && !SESSION.pendingApproval && /^\d{10}$/.test(mob)) try{
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
  SESSION.newUser=!userData.restoring;
  if (!userData.restoring || !SESSION.loginAt) SESSION.loginAt=new Date().toISOString();
  // ALWAYS prefer current employees/{id} by mobile — never keep old member name
  if(!SESSION.rosterLinked && !SESSION.pendingApproval && /^\d{10}$/.test(mob)) try{
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
  if (!userData.restoring) try{
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
  if (userData.restoring) {
    Promise.resolve(checkFingerprintOnStart()).then(shown => {
      if (!shown) return launchApp();
      document.getElementById('loadingScreen')?.style.setProperty('display','none','important');
    }).catch(() => { void launchApp(); });
    return;
  }
  void launchApp();

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
  if(SESSION.rosterLinked) return;
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
        hint.innerHTML='<span style="color:#f97316">'+L('🔆 नया Employee — Registration होगा','🔆 New employee — registration required')+'</span>';
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
  try {
    const user = window._fbAuth?.currentUser;
    const identity = user && !user.isAnonymous && await window._fbCall('getMyRosterIdentity');
    if (identity?.admin && user.phoneNumber && await launchVerifiedRosterSession(user.phoneNumber)) return;
  } catch (error) { console.warn('[admin authentication]', error.code || error.message); }
  showStep(1);
  toast(L('एडमिन खाते में सत्यापित मोबाइल से प्रवेश करें।','Sign in to your verified Admin account.'));
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
    if(typeof _ensureWriteAuth==='function'){ const ok=await _ensureWriteAuth(); if(!ok){ toast(L('❌ प्रमाणीकरण आवश्यक','❌ Auth required')); return; } }
    const now = new Date().toISOString();
    let rec = null;
    try{ rec = await _mpFbGet('loginRequests/'+reqKey); }catch(e){}
    await _mpFbUpdate('loginRequests/'+reqKey, {
      status:'approved',
      approvedAt: now,
      approvedBy: SESSION.name||'admin',
      approvedById: SESSION.empObjId||SESSION.uid||''
    });
    // v6.0.70: also stamp mobileUsers so NEXT login can skip OTP even if client was closed
    try{
      const mob = String((rec && (rec.mobile||rec.phone))||'').replace(/\D/g,'').slice(-10);
      if(mob && mob.length===10){
        const bypassUntil = new Date(Date.now()+5*60*1000).toISOString(); // 5 minutes one-time window
        const patch = {
          allowLoginWithoutOtp: true,
          loginApprovedAt: now,
          loginApprovedBy: SESSION.name||'admin',
          otpBypassUntil: bypassUntil,
          updatedAt: now
        };
        // Keep existing role/status; only add bypass flags
        if(typeof _mpFbUpdate==='function') await _mpFbUpdate('mobileUsers/'+mob, patch);
        else if(typeof fbUpdate==='function') await fbUpdate('mobileUsers/'+mob, patch);
      }
    }catch(muErr){ console.warn('[approveLogin] mobileUsers bypass stamp', muErr); }
    toast(L('✅ 5 मिनट में एक बार बिना OTP लॉगिन करें','✅ One login without OTP within 5 minutes'));
    try{ renderPending(); }catch(e){}
  }catch(e){ toast(L('❌ ','❌ ')+(e&&e.message||e)); }
}
async function rejectManagerLoginRequest(reqKey){
  try{
    if(typeof _ensureWriteAuth==='function'){ const ok=await _ensureWriteAuth(); if(!ok){ toast(L('❌ प्रमाणीकरण आवश्यक','❌ Auth required')); return; } }
    await _mpFbUpdate('loginRequests/'+reqKey, {
      status:'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: SESSION.name||'manager'
    });
    toast(L('अस्वीकृत','Rejected'));
    try{ renderPending(); }catch(e){}
  }catch(e){ toast(L('❌ ','❌ ')+(e&&e.message||e)); }
}
try{ window.approveManagerLoginRequest=approveManagerLoginRequest; window.rejectManagerLoginRequest=rejectManagerLoginRequest; }catch(e){}

try{
  
  
  
  
}catch(e){}

