/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-login-session.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
/**
 * Man Power — Launch / role sync / logout / boot helpers
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
// ════════════════════════════════════════
// LAUNCH
// ════════════════════════════════════════

/** Refresh Firebase claims from server-managed UID grants. */
async function _syncAuthRoleNodes(){
  if (!window._fbAuth?.currentUser) return false;
  try {
    await _requestRoleClaims({});
    return true;
  } catch (error) {
    console.warn('[roleSync]', error.code || error.message);
    return false;
  }
}

/**
 * Request Custom Claims via Cloud Functions (setRoleClaim / syncMyClaims).
 * Uses window._fbCall from firebase-init. No-op until functions are deployed.
 */
async function _requestRoleClaims(opts){
  opts = opts || {};
  try{
    if(typeof window._fbCall !== 'function'){
      console.info('[claims] _fbCall missing — check firebase-init');
      return null;
    }
    const name = (opts.uid && opts.role) ? 'setRoleClaim' : 'syncMyClaims';
    const payload = (name === 'setRoleClaim')
      ? { uid: String(opts.uid), role: String(opts.role) }
      : {};
    const data = await window._fbCall(name, payload);
    try{
      const u = window._fbAuth && window._fbAuth.currentUser;
      if(u) await u.getIdToken(true);
    }catch(e){}
    if(typeof _refreshIdTokenClaims === 'function') await _refreshIdTokenClaims();
    return data;
  }catch(e){
    // Expected until functions are deployed (not-found / failed-precondition)
    console.warn('[claims]', e && (e.message || e.code || e));
    return null;
  }
}

/** Admin: issue claims for another user (requires deployed setRoleClaim). */
async function adminSetRoleClaim(uid, role){
  return _requestRoleClaims({ uid: uid, role: role });
}
try{ window.adminSetRoleClaim = adminSetRoleClaim; window._requestRoleClaims = _requestRoleClaims; }catch(e){}


function getWriteSecurityMode() {
  return localStorage.getItem('mp_write_security_mode') === 'strict' ? 'strict' : 'trusted';
}
function setWriteSecurityMode(mode) {
  localStorage.setItem('mp_write_security_mode',mode === 'strict' ? 'strict' : 'trusted');
}

async function _ensureWriteAuth() {
  try {
    await window._fbAuthStateReady?.();
    const user = window._fbAuth?.currentUser;
    if (!SESSION.authUid || !user || user.isAnonymous || user.uid !== SESSION.authUid || window._mpLoggingOut) return false;
    await user.getIdToken();
    return window._fbAuth?.currentUser === user && SESSION.authUid === user.uid;
  } catch (error) {
    return false;
  }
}

let _reauthConfirm = null;
let _reauthResolve = null;
let _reauthUid = null;
let _reauthBusy = false;

/** Modal: verify phone OTP without logging out of the app. */
function _openQuickPhoneReauth(mobile10){
  if (_reauthResolve || !SESSION.authUid || !/^\d{10}$/.test(mobile10)) return Promise.resolve(false);
  _reauthUid = SESSION.authUid;
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
        <div class="reauth-title">${L('फ़ोन की पुष्टि करें','Verify your phone')}</div>
        <div class="reauth-copy">
          ${typeof L==='function'?L('इस <b>device/browser</b> पर एक बार Phone OTP चाहिए। <b style="color:#e2e8f0">Logout नहीं</b> · Laptop और Mobile दोनों चल सकते हैं (हर device पर अलग से एक बार OTP)।','One-time Phone OTP is required on this <b>device/browser</b>. <b style="color:#e2e8f0">No logout</b> · Laptop and Mobile both work (OTP once per device).'):'One-time Phone OTP is required on this device.'}
        </div>
        <div style="font-size:12px;color:#7dd3fc;margin-bottom:10px">📱 +91 ${mobile10}</div>
        <div id="reauthRecaptcha" style="min-height:1px"></div>
        <button type="button" id="reauthSendBtn" onclick="_reauthSendOtp('${mobile10}')"
          style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:15px;cursor:pointer;margin-bottom:10px">
          ${typeof L==='function'?L('OTP भेजें','Send OTP'):'Send OTP'}
        </button>
        <input id="reauthOtpInput" type="tel" inputmode="numeric" maxlength="6" autocomplete="one-time-code" name="one-time-code"
          placeholder="${L('6 अंकों का OTP','6-digit OTP')}" style="display:none;width:100%;box-sizing:border-box;padding:14px;border-radius:12px;border:1.5px solid #60a5fa;background:#1e3251;color:#fff;font-size:22px;letter-spacing:8px;text-align:center;margin-bottom:10px">
        <button type="button" id="reauthVerifyBtn" onclick="_reauthVerifyOtp()" style="display:none;width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:900;font-size:15px;cursor:pointer;margin-bottom:8px">
          ${L('सत्यापित करें','Verify')}
        </button>
        <button type="button" onclick="_reauthCancel()" style="width:100%;padding:12px;border:1px solid #475569;border-radius:12px;background:transparent;color:#94a3b8;font-weight:700;cursor:pointer">
          ${L('रद्द करें','Cancel')}
        </button>
        <div id="reauthErr" style="color:#fca5a5;font-size:12px;margin-top:8px;min-height:16px"></div>
      </div>`;
    document.body.appendChild(ov);
  });
}

async function _reauthSendOtp(mobile10){
  if (_reauthBusy || !_reauthResolve) return;
  _reauthBusy = true;
  _reauthConfirm = null;
  const err = document.getElementById('reauthErr');
  const btn = document.getElementById('reauthSendBtn');
  if(err) err.textContent = '';
  try{
    if(btn){ btn.disabled = true; btn.textContent = '⏳ Sending…'; }
    const confirmation = await _fbSendPhoneOtp('+91'+mobile10, 'reauthRecaptcha', '_fbRecaptchaReauth');
    if (!_reauthResolve) return;
    _reauthConfirm = confirmation;
    const inp = document.getElementById('reauthOtpInput');
    const vbtn = document.getElementById('reauthVerifyBtn');
    if(inp){ inp.style.display = 'block'; inp.focus(); }
    if(vbtn) vbtn.style.display = 'block';
    if(btn){ btn.textContent = (typeof L==='function'?L('OTP फिर भेजें','Resend OTP'):'Resend OTP'); btn.disabled = false; }
    toast(L('✅ OTP भेज दिया','✅ OTP sent'));
    if(typeof _startWebOtpListen === 'function'){
      _startWebOtpListen('reauthOtpInput', code=>{
        if(code && code.length===6) setTimeout(()=>_reauthVerifyOtp(), 200);
      });
    }
  }catch(e){
    if(err) err.textContent = '❌ '+(_fbOtpErrorMessage?_fbOtpErrorMessage(e):(e.message||e));
    if(btn){ btn.disabled = false; btn.textContent = (typeof L==='function'?L('OTP भेजें','Send OTP'):'Send OTP'); }
  } finally { _reauthBusy = false; }
}

async function _reauthVerifyOtp(){
  if (_reauthBusy || !_reauthResolve) return;
  const err = document.getElementById('reauthErr');
  const code = (document.getElementById('reauthOtpInput')?.value||'').replace(/\D/g,'').slice(0,6);
  if(code.length!==6){ if(err) err.textContent=(typeof L==='function'?L('⚠️ 6 अंक OTP डालें','⚠️ Enter 6-digit OTP'):'⚠️ Enter 6-digit OTP'); return; }
  if(!_reauthConfirm){ if(err) err.textContent=(typeof L==='function'?L('⚠️ पहले OTP भेजें','⚠️ Send OTP first'):'⚠️ Send OTP first'); return; }
  _reauthBusy = true;
  const expectedUid = _reauthUid;
  try {
    const result = await _fbVerifyPhoneOtp(_reauthConfirm,code);
    _reauthConfirm = null;
    if (result.user?.uid !== expectedUid || SESSION.authUid !== expectedUid || !await _ensureWriteAuth()) {
      if (result.user?.uid !== expectedUid) await window._fbSignOut?.();
      _reauthCancel();
      return;
    }
    const resolve = _reauthResolve;
    _reauthResolve = null;
    _reauthCancel();
    toast(L('फ़ोन सत्यापित है।','Phone verified.'));
    resolve?.(true);
  } catch (error) {
    if (['auth/code-expired','auth/session-expired','auth/invalid-verification-id'].includes(error.code)) _reauthConfirm=null;
    if (err) err.textContent = _fbOtpErrorMessage(error);
  } finally { _reauthBusy=false; }
}

function _reauthCancel(){
  _reauthConfirm = null;
  _reauthUid = null;
  try{ if(typeof _stopWebOtpListen==='function') _stopWebOtpListen(); }catch(e){}
  const ov = document.getElementById('quickReauthOverlay');
  if(ov) ov.remove();
  const r = _reauthResolve;
  _reauthResolve = null;
  if(r) r(false);
}

