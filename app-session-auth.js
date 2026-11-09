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
    // Prefer Custom Claims when present (Admin SDK); still mirror to RTDB nodes for rules fallback
    try{ if(typeof _refreshIdTokenClaims==='function') await _refreshIdTokenClaims(); }catch(e){}
    const claims = window.__mpIdTokenClaims || {};
    const phone = (auth.currentUser.phoneNumber || '').replace(/\s/g,'');
    const isHardAdmin = _isHardAdminPhone(phone) || _isHardAdminPhone(SESSION.mobile) || SESSION.role==='admin' || claims.admin === true;
    if(SESSION.role === 'admin' || isHardAdmin || claims.admin === true){
      try{ await fbSet('admins/'+uid, true); }catch(e){ console.warn('[roleSync] admins write:', e.message); }
    }
    if(SESSION.role === 'manager' || isMgr() || isHardAdmin || claims.manager === true || claims.admin === true){
      try{ await fbSet('managers/'+uid, true); }catch(e){ console.warn('[roleSync] managers write:', e.message); }
    }

    // Issue/refresh Custom Claims when Cloud Function is deployed
    try{
      if(SESSION.role === 'admin' || SESSION.role === 'manager' || isHardAdmin){
        setTimeout(function(){ try{ _requestRoleClaims({}); }catch(e){} }, 800);
      }
    }catch(e){}
    return true;
  }catch(e){ console.warn('[roleSync]', e.message); return false; }
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
let _lastWriteRoleSyncAt = 0;
function _kickRoleSyncNonBlocking(){
  try{
    const now = Date.now();
    // At most once per 60s on save path — do not block UI
    if(now - _lastWriteRoleSyncAt < 60000) return;
    _lastWriteRoleSyncAt = now;
    if(typeof _syncAuthRoleNodes === 'function'){
      Promise.resolve(_syncAuthRoleNodes()).catch(function(e){ console.warn('[roleSync bg]', e); });
    }
  }catch(e){}
}

async function _ensureWriteAuth(){
  // If auth already elevated and recent write auth — return immediately (Save hot path)
  try{
    if(window._fbAuth && window._fbAuth.currentUser && _hasElevatedFirebaseAuth()){
      const last = parseInt(localStorage.getItem('mp_write_auth_at')||'0',10);
      if(last && (Date.now()-last) < 15*60*1000){
        _kickRoleSyncNonBlocking();
        return true;
      }
    }
  }catch(e){}

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

  // Fast path: Firebase Phone Auth already active on this tab — do NOT await role sync
  if(_hasElevatedFirebaseAuth()){
    _kickRoleSyncNonBlocking();
    _markDeviceCache();
    return true;
  }

  // Device cache: wait briefly for Phone Auth restore from IndexedDB
  try{
    if(_isTrustedDeviceForWrite()){
      // Short poll only — avoid multi-second lag on every Save
      for(let i=0;i<6;i++){
        if(_hasElevatedFirebaseAuth()) break;
        await new Promise(r=>setTimeout(r, 50));
        try{
          if(typeof window._fbAuthStateReady === 'function') await window._fbAuthStateReady();
        }catch(e){}
      }
    }
  }catch(e){}

  if(_hasElevatedFirebaseAuth()){
    _kickRoleSyncNonBlocking();
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
      for(let i=0;i<5;i++){
        if(window._fbAuth && window._fbAuth.currentUser) break;
        try{
          if(typeof window._fbSignInAnon === 'function') await window._fbSignInAnon();
        }catch(e){}
        await new Promise(r=>setTimeout(r, 60));
      }
    }
    try{ _kickRoleSyncNonBlocking(); }catch(e){}
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
    toast(L('✅ OTP भेज दिया','✅ OTP sent'));
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

