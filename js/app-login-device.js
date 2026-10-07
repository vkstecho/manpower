/**
 * Man Power — Device password / other-device / Web OTP / rate limit
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
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
        <div style="font-size:16px;font-weight:900;color:#f97316">${escHtml(String(emp.name||'').replace(/</g,''))}</div>
        <div style="font-size:12px;color:#94a3b8">${escHtml(String(emp.empId||'').replace(/</g,''))}${phoneHint?' · +91-'+phoneHint:''}</div>
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
    const isAdm = (typeof isAdmin==='function' && isAdmin()) || SESSION.role==='admin';
    const isMgrRole = (typeof isMgr==='function' && isMgr()) || SESSION.role==='manager';
    const mine = Object.entries(data).filter(([k,v])=>{
      if(!v || v.status!=='pending') return false;
      if(v.type==='device_transfer' || v.type==='otp_unavailable' || v.otpBlocked){
        // Own request visible on already-logged-in device
        const own = v.empObjId===mid || v.empId===myEmpId || v.empObjId===SESSION.empObjId ||
          (myMob && (_normMobileKey(v.phone||'')===myMob || _normMobileKey(v.mobile||'')===myMob));
        // Admin sees all SMS-blocked / device transfers so they can Approve
        if(isAdm) return true;
        return own;
      }
      // Manager sees ONLY their team's login approvals (managerId match — not same company)
      if(v.type==='manager_login_approval' && (isMgrRole || isAdm)){
        return _isMyTeamLoginRequest(v);
      }
      return false;
    });
    if(!mine.length){ host.innerHTML=''; host.style.display='none'; return; }
    host.style.display='block';
    host.innerHTML = `<div style="font-size:13px;font-weight:900;color:#f97316;margin:10px 0 8px">📱 Login / Device requests</div>` +
      mine.map(([k,v])=>{
        const isMgrAppr = v.type==='manager_login_approval';
        const isOtpUnavail = v.type==='otp_unavailable';
        const name = (v.empName||v.phone||v.mobile||'Member').replace(/</g,'');
        const sub = isMgrAppr
          ? ('Member login approval'+(v.phone?' · 📱 '+String(v.phone).replace(/</g,''):''))
          : (isOtpUnavail
            ? ('SMS OTP blocked — approve login'+(v.mobile?' · +91-'+String(v.mobile).replace(/</g,''):''))
            : ('New device wants to login'));
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
    let req = null;
    try{ req = await fbGet('loginRequests/'+reqKey); }catch(e){}
    const targetEmpId = (req && (req.empObjId||req.employeeId)) || SESSION.empObjId;
    const targetName = (req && req.empName) || SESSION.name;
    const targetCode = (req && req.empId) || SESSION.empId;
    const devId = newDeviceId || (req && req.deviceId) || '';
    await fbUpdate('loginRequests/'+reqKey, {
      status:'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: SESSION.name||'self'
    });
    if(targetEmpId && devId){
      await fbUpdate('deviceApprovals/'+targetEmpId, {
        approvedDeviceId: devId,
        approvedAt: new Date().toISOString(),
        validTill: new Date(Date.now()+365*86400000).toISOString(),
        empName: targetName,
        empId: targetCode,
        transferredFrom: (typeof getDeviceId==='function'?getDeviceId():''),
        approvedVia: (req && req.type) || 'device_transfer'
      });
    }
    toast('✅ Login approved — they can continue now');
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
        <b style="color:#f97316">${escHtml((emp&&emp.name)||'User')}</b> के लिए इस device पर password सेट करें।<br>
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
  if(p1.length<5 || p1!==p2){ toast(L('⚠️ Password check करें','⚠️ Check password')); return; }
  const emp = ctx.emp || {};
  const empId = emp.id || '';
  const mobile = ctx.mobile10 || String(emp.phone||emp.mobile||'').replace(/\D/g,'').slice(-10);
  const h = await hashPass(p1+'mp_salt_v24');
  _setDevicePasswordHash(empId, mobile, h);
  const ov=document.getElementById('setPasswordOverlay'); if(ov) ov.remove();
  toast(L('✅ Password save हो गया — अगली बार OTP नहीं लगेगा','✅ Password saved — OTP not needed next time'));
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
    toast(L('ℹ️ Password बाद में Profile से सेट कर सकते हैं','ℹ️ You can set password later from Profile'));
    if(typeof launchApp==='function') launchApp();
  } else {
    // Need OTP once to establish session
    toast(L('📱 Password नहीं — OTP से login करें','📱 No password — login with OTP'));
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
        <b style="color:#f97316">${escHtml(emp.name||'')}</b><br>
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
      <button onclick="_forgotPw('${empId}','${empName}', '${escHtml(String((emp.phone||emp.mobile||'')).replace(/\D/g,'').slice(-10))}')"
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
  toast(L('✅ Login हो गया! Welcome ','✅ Login successful! Welcome ')+(emp.name||empName));
  launchApp();
}

function _forgotPw(empId, empName, mobile){
  _clearDevicePassword(empId, mobile);
  const ov=document.getElementById('pwLoginOverlay'); if(ov) ov.remove();
  const ov2=document.getElementById('pwMobileOverlay'); if(ov2) ov2.remove();
  toast(L('🔑 Password हटाया — OTP से दोबारा verify करें','🔑 Password removed — verify with OTP again'));
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
  toast(L('🔑 Password हटाया — OTP भेजा जा रहा है','🔑 Password removed — sending OTP'));
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
      toast(L('📲 OTP SMS से auto-fill हो गया','📲 OTP auto-filled from SMS'));
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

function _fbEnsureRecaptchaHost(containerId, visible){
  // Prefer in-form host for visible checkbox so user can complete the check
  let el = document.getElementById(containerId);
  if(visible){
    const inline = document.getElementById('recaptcha-inline');
    if(inline){
      // Clear and use the visible slot inside the login card
      inline.innerHTML = '';
      inline.style.cssText = 'margin:10px 0 12px;display:flex;justify-content:center;align-items:center;min-height:78px;width:100%';
      // Move/create host as child of inline so it is on-screen and clickable
      if(!el || el.parentElement !== inline){
        if(el && el.parentElement) el.parentElement.removeChild(el);
        el = document.createElement('div');
        el.id = containerId;
        inline.appendChild(el);
      }
      el.className = 'rc-visible';
      el.innerHTML = '';
      el.style.cssText = 'display:block;position:relative;left:auto;bottom:auto;transform:none;z-index:5;width:auto;height:auto;min-width:304px;min-height:78px;opacity:1;pointer-events:auto;overflow:visible';
      return el;
    }
  }
  if(!el){
    el = document.createElement('div');
    el.id = containerId;
    document.body.appendChild(el);
  }
  el.innerHTML = '';
  if(visible){
    el.className = 'rc-visible';
    el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:100000;min-width:304px;min-height:78px;opacity:1;pointer-events:auto;overflow:visible;background:rgba(15,23,42,.95);padding:10px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5)';
  } else {
    el.className = 'rc-invisible';
    el.style.cssText = 'position:fixed;left:-9999px;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;z-index:-1';
  }
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
  // Always create a fresh verifier — Firebase Phone Auth invalidates after each send
  _fbClearRecaptcha(storeKey);
  const wantSize = size || 'invisible';
  const isVisible = (wantSize === 'normal');
  _fbEnsureRecaptchaHost(containerId, isVisible);
  const params = {
    size: wantSize,
    callback: ()=>{},
    'expired-callback': ()=>{ try{ window[storeKey]=null; }catch(e){} }
  };
  const verifier = new window._fbRecaptchaVerifierClass(window._fbAuth, containerId, params);
  window[storeKey] = verifier;
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

function _isDesktopLoginUA(){
  try{
    if(typeof navigator==='undefined') return true;
    return !(/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(navigator.userAgent||''));
  }catch(e){ return true; }
}

/** Show visible reCAPTCHA host immediately (laptop) — call early so user can tick while typing */
function _fbShowRecaptchaSlotNow(containerId){
  try{
    const cid = containerId || 'recaptcha-container';
    const inline = document.getElementById('recaptcha-inline');
    if(inline){
      inline.style.display = 'flex';
      inline.style.minHeight = '78px';
      if(!inline.querySelector('.rc-hint')){
        const hint = document.createElement('div');
        hint.className = 'rc-hint';
        hint.style.cssText = 'width:100%;text-align:center;font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:6px';
        hint.textContent = '🔐 Security check (required on laptop) — tick below, then Send OTP';
        inline.insertBefore(hint, inline.firstChild);
      }
    }
    _fbEnsureRecaptchaHost(cid, true);
  }catch(e){}
}

/**
 * Pre-render visible reCAPTCHA as soon as login is shown on desktop.
 * Speeds up Send OTP: widget already loaded when user clicks.
 */
async function _fbWarmDesktopRecaptcha(containerId, storeKey){
  if(!_isDesktopLoginUA()) return null;
  if(!_fbPhoneAuthReady()){
    for(let i=0;i<15 && !_fbPhoneAuthReady();i++) await new Promise(r=>setTimeout(r,150));
  }
  if(!_fbPhoneAuthReady()) return null;
  const cid = containerId || 'recaptcha-container';
  const key = storeKey || '_fbRecaptchaWarm';
  try{
    _fbShowRecaptchaSlotNow(cid);
    // Reuse warm verifier if still valid
    if(window[key] && window._fbRecaptchaWarmReady) return window[key];
    _fbClearRecaptcha(key);
    _fbEnsureRecaptchaHost(cid, true);
    const verifier = new window._fbRecaptchaVerifierClass(window._fbAuth, cid, {
      size: 'normal',
      callback: ()=>{ try{ window._fbRecaptchaWarmSolved = true; }catch(e){} },
      'expired-callback': ()=>{ try{ window._fbRecaptchaWarmSolved = false; window[key]=null; window._fbRecaptchaWarmReady=false; }catch(e){} }
    });
    window[key] = verifier;
    if(typeof verifier.render === 'function') await verifier.render();
    window._fbRecaptchaWarmReady = true;
    return verifier;
  }catch(e){
    console.warn('[otp] warm recaptcha', e);
    return null;
  }
}
try{ window._fbWarmDesktopRecaptcha = _fbWarmDesktopRecaptcha; window._fbShowRecaptchaSlotNow = _fbShowRecaptchaSlotNow; }catch(e){}

async function _fbSendPhoneOtp(e164Phone, containerId, storeKey){
  // Wait briefly if Firebase module still loading
  if(!_fbPhoneAuthReady()){
    for(let i=0;i<15 && !_fbPhoneAuthReady();i++) await new Promise(r=>setTimeout(r,150));
  }
  if(!_fbPhoneAuthReady()){
    throw new Error('Firebase Auth not ready — reload page and try again');
  }
  const phone = String(e164Phone||'').trim();
  if(!/^\+\d{10,15}$/.test(phone)){
    throw new Error('Invalid phone number');
  }

  // Fast signOut of anonymous only (cap 800ms) — don't block OTP
  try{
    const cu = window._fbAuth && window._fbAuth.currentUser;
    if(cu && (cu.isAnonymous || (cu.phoneNumber && (cu.phoneNumber||'').replace(/\D/g,'').slice(-10) !== phone.replace(/\D/g,'').slice(-10)))){
      if(window._fbSignOut){
        await Promise.race([window._fbSignOut(), new Promise(r=>setTimeout(r, 800))]);
      }
    }
  }catch(e){ console.warn('[otp] signOut before phone', e); }

  const cid = containerId || 'recaptcha-container';
  const key = storeKey || '_fbRecaptchaNew';
  const isDesktop = _isDesktopLoginUA();

  const withTimeout = (p, ms, label) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(Object.assign(
      new Error(label||'OTP timed out'), { code: 'auth/timeout' })), ms))
  ]);

  // ── LAPTOP/DESKTOP: visible reCAPTCHA ONLY (immediate, no invisible wait) ──
  if(isDesktop){
    _fbShowRecaptchaSlotNow(cid);
    toast('🔐 Tick the security checkbox, then OTP sends instantly');
    try{
      // Prefer already-warmed widget
      let verifier = null;
      if(window._fbRecaptchaWarm && window._fbRecaptchaWarmReady){
        verifier = window._fbRecaptchaWarm;
        window[key] = verifier;
        // clear warm pointers so next send creates fresh (Firebase one-shot)
        window._fbRecaptchaWarm = null;
        window._fbRecaptchaWarmReady = false;
      } else {
        _fbClearRecaptcha(key);
        verifier = await _fbMakeRecaptcha(cid, key, 'normal');
      }
      const confirmation = await withTimeout(
        window._fbSignInWithPhoneNumber(window._fbAuth, phone, verifier),
        60000,
        'Complete the checkbox if shown — OTP timed out'
      );
      try{
        const inline = document.getElementById('recaptcha-inline');
        if(inline){
          inline.querySelectorAll('.rc-hint').forEach(h=>h.remove());
          const host = document.getElementById(cid);
          if(host) host.innerHTML = '';
          inline.style.minHeight = '0';
        }
      }catch(e){}
      return confirmation;
    }catch(err){
      console.warn('[otp] desktop visible failed', err);
      _fbClearRecaptcha(key);
      _fbClearRecaptcha('_fbRecaptchaWarm');
      // One retry with brand-new visible widget
      try{
        _fbShowRecaptchaSlotNow(cid);
        const verifier2 = await _fbMakeRecaptcha(cid, key, 'normal');
        return await withTimeout(
          window._fbSignInWithPhoneNumber(window._fbAuth, phone, verifier2),
          60000,
          'Tick the security checkbox below, then wait for SMS'
        );
      }catch(err2){
        _fbClearRecaptcha(key);
        throw err2;
      }
    }
  }

  // ── MOBILE: invisible first (fast), then visible fallback ──
  try{
    const verifier = await _fbMakeRecaptcha(cid, key, 'invisible');
    return await withTimeout(
      window._fbSignInWithPhoneNumber(window._fbAuth, phone, verifier),
      15000,
      'Invisible check timed out'
    );
  }catch(err1){
    console.warn('[otp] invisible failed', err1 && (err1.code||err1.message));
    _fbClearRecaptcha(key);
    try{
      toast('🔐 Complete the security check below…');
      _fbShowRecaptchaSlotNow(cid);
      const verifier2 = await _fbMakeRecaptcha(cid, key, 'normal');
      return await withTimeout(
        window._fbSignInWithPhoneNumber(window._fbAuth, phone, verifier2),
        60000,
        'OTP timed out — tick checkbox if shown'
      );
    }catch(err2){
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
  if(code === 'auth/too-many-requests') return 'Too many SMS attempts — opening device / Admin approval…';
  if(code === 'auth/network-request-failed') return 'Network error — check internet';
  if(code === 'auth/timeout' || /timed out/i.test(msg)) return 'OTP timed out — on laptop tick the security checkbox, allow popups, then retry';
  if(code === 'auth/captcha-check-failed') return 'Security check failed — reload page and retry';
  if(code === 'auth/invalid-phone-number') return 'Invalid mobile number';
  if(code === 'auth/missing-phone-number') return 'Enter mobile number';
  if(code === 'auth/quota-exceeded') return 'SMS quota exceeded — requesting approval on other device / Admin';
  if(code === 'auth/billing-not-enabled') return 'SMS billing off — requesting approval on other device / Admin';
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
        <b style="color:#f97316">${escHtml(emp.name)}</b><br>
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
          <input id="deviceOtpInput" type="tel" name="one-time-code" inputmode="numeric" placeholder="● ● ● ● ● ●" maxlength="6"
            autocomplete="one-time-code" enterkeyhint="done" autocapitalize="off" spellcheck="false"
            style="width:100%;box-sizing:border-box;background:#1e3251;border:1.5px solid #60a5fa;border-radius:10px;
                   padding:16px;color:#fff;-webkit-text-fill-color:#fff;caret-color:#f97316;
                   font-size:28px;text-align:center;outline:none;font-family:inherit;letter-spacing:8px;box-shadow:0 0 0 2px rgba(96,165,250,.3)"
            oninput="this.value=this.value.replace(/\\D/g,'').slice(0,6);_otpValidate()">
          <div id="otpErr" style="color:#f43f5e;font-size:12px;margin-top:8px;min-height:16px;text-align:center"></div>
        </div>
        <button id="deviceVerifyOtpBtn" type="button" onclick="_verifyDeviceOTP()" disabled
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


function _armDeviceOtpAutofillWatch(){
  try{
    _otpValidate();
    let n = 0;
    const tick = ()=>{
      n++;
      try{ _otpValidate(); }catch(e){}
      const inp = document.getElementById('deviceOtpInput');
      if(inp && (inp.value||'').replace(/\D/g,'').length===6){ _otpValidate(); return; }
      if(n < 40) setTimeout(tick, 250); // ~10s watch for SMS autofill
    };
    setTimeout(tick, 300);
    const inp = document.getElementById('deviceOtpInput');
    if(inp){
      try{ inp.focus(); }catch(e){}
      inp.addEventListener('change', _otpValidate);
      inp.addEventListener('keyup', _otpValidate);
      inp.addEventListener('input', _otpValidate);
    }
  }catch(e){}
}

function _otpValidate(){
  const ov = document.getElementById('otpLoginOverlay');
  const deviceOpen = ov && ov.style.display && ov.style.display !== 'none';
  const inp = document.getElementById(deviceOpen ? 'deviceOtpInput' : 'otpInput')
    || document.getElementById('deviceOtpInput')
    || document.getElementById('otpInput');
  const btn = document.getElementById(deviceOpen ? 'deviceVerifyOtpBtn' : 'verifyOtpBtn')
    || document.getElementById('deviceVerifyOtpBtn')
    || document.getElementById('verifyOtpBtn');
  let val = (inp && inp.value || '').replace(/\D/g,'').slice(0,6);
  if(inp && inp.value !== val) inp.value = val;
  const ok = val.length === 6;
  if(btn){
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '.45';
    btn.style.pointerEvents = ok ? 'auto' : 'auto'; // never block clicks permanently; disabled attr is enough
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
  }
  // Also enable the other pair if both exist (safety)
  try{
    const b2 = document.getElementById(deviceOpen ? 'verifyOtpBtn' : 'deviceVerifyOtpBtn');
    if(b2 && deviceOpen){ /* leave main login alone */ }
  }catch(e){}
  return ok;
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
    toast(isResend?L('⏳ Resending OTP…','⏳ Resending OTP…'):L('OTP भेजा जा रहा है...','Sending OTP...'));
    _deviceOtpConfirm = await _fbSendPhoneOtp('+91'+mobile, 'recaptcha-container-device', '_fbRecaptchaDevice');
    const s1=document.getElementById('otpStep1');
    const s2=document.getElementById('otpStep2');
    if(s1) s1.style.display='none';
    if(s2) s2.style.display='block'; try{ _armDeviceOtpAutofillWatch(); }catch(e){};
    document.getElementById('deviceOtpInput')?.focus(); try{ _armDeviceOtpAutofillWatch(); }catch(e){}
    _startWebOtpListen('otpInput', code=>{ if(code&&code.length===6) setTimeout(()=>{ try{ _verifyDeviceOTP(); }catch(e){} }, 250); });
    toast(L('✅ OTP भेज दिया!','✅ OTP sent!'));
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
  const otp=(document.getElementById('deviceOtpInput')?.value||document.getElementById('otpInput')?.value||'').replace(/\D/g,'').slice(0,6);
  if(otp.length!==6){ toast(L('⚠️ 6 अंकों का OTP डालें','⚠️ Enter the 6-digit OTP')); return; }
  if(!_deviceOtpConfirm){ toast(L('⚠️ पहले OTP भेजें','⚠️ Send OTP first')); return; }
  _deviceOtpBusy=true;
  const btn=document.getElementById('deviceVerifyOtpBtn')||document.getElementById('verifyOtpBtn');
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
    toast(L('✅ Request भेजी! WhatsApp से Admin को notification जाएगी।','✅ Request sent! Admin will get a WhatsApp notification.'));
  }catch(e){
    if(errEl) errEl.textContent='❌ Error: '+e.message;
    if(btn){btn.innerHTML='📲 Submit → WhatsApp से Admin को जाएगी';btn.style.opacity='1';btn.style.pointerEvents='auto';}
  }
}

// ── Admin Notification via Firebase ──
async function notifyAdmin(title, body){
  try{
    await fbPush('adminNotifications',{
      title, body, read:false, at:new Date().toISOString(), type:'admin_alert'
    });
    if(typeof Notification !== 'undefined' && Notification.permission==='granted'){
      try{ new Notification(title,{body, icon:'/MP-App/icons/icon-192.png', tag:'mp-admin'}); }catch(e){}
    }
  }catch(e){
    console.warn('[notifyAdmin] write failed', e);
    throw e;
  }
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
      <div style="font-size:11px;color:var(--muted2)">Employee: <b style="color:#fff">${escHtml(emp.name)}</b></div>
      <div style="font-size:11px;color:var(--muted2);margin-top:4px">पिछला Device: <b style="color:#fff">${existingApproval.approvedDeviceId.substring(0,12)}...</b></div>
    </div>
    <div style="font-size:12px;color:var(--day);background:var(--daybg);border-radius:10px;padding:10px;margin-bottom:14px">
      📞 Manager: <b>${(CFG&&CFG.contactVivek)||''}</b><br>
      वो नए device को approve करेंगे
    </div>
    <button class="submit-btn" onclick="requestDeviceChange('${emp.id}','${escHtml(emp.name)}','${newDeviceId}')">
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
  toast(L('✅ Request भेज दी! Manager approve करेंगे।','✅ Request sent! Manager will approve.'));
}

function showLoginErr(msg){
  // Try to show in whichever error element is visible
  const el = document.getElementById('loginErr2')?.closest('#loginStep2')?.style.display!=='none'
    ? document.getElementById('loginErr2')
    : document.getElementById('loginErr');
  if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3500); }
}

