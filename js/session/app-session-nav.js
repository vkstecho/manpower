/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-login-session.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
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
  if(iiBtn) iiBtn.style.display = (typeof canManageReports==='function' && canManageReports()) ? 'inline-flex' : 'none';
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
        setTimeout(()=>{ toast(L('⏳ App access ','⏳ App access expires in ') + expiry.daysLeft + L(' दिनों में expire होगी!',' days!')); }, 800);
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
    {id:'myshift',   ico:'⏰', lbl:'मेरी शिफ्ट', lblEn:'My Shift',  roles:['worker','manager','supervisor','member','pending_member']},
    {id:'schedule',  ico:'📋', lbl:'शेड्यूल',   lblEn:'Schedule',  roles:['worker','manager','supervisor','member']},
    {id:'leave',     ico:'🏖️', lbl:'अवकाश',    lblEn:'Leave',     roles:['worker','manager','member']},
    {id:'reports',   ico:'📋', lbl:'रिपोर्ट',   lblEn:'Reports',   roles:['worker','manager','supervisor','member']},
    // Action (not a tab page) — sits beside Reports in nav / More sheet
    {id:'resign',    ico:'📝', lbl:'त्यागपत्र',  lblEn:'Resign',    roles:['worker','manager','supervisor','member'], action:true},
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
  // Elevated members (schedule/leave/reports) must never get pending_member nav (missing Schedule)
  let _navElevated = false;
  try{
    const e = (typeof _myEmployeeRecord==='function') ? _myEmployeeRecord() : null;
    const raw = (e && e.perms) || {};
    _navElevated = !!(raw.schedule || raw.leave || raw.reports || raw.pending);
  }catch(e){}
  const effectiveRole = isAdmin() ? 'admin'
    : isMgr() ? 'manager'
    : (isPendingMember() && !_navElevated) ? 'pending_member'
    : (SESSION.role==='member' || _navElevated) ? 'member'
    : isSupervisor() ? 'supervisor'
    : isGuest() ? 'guest'
    : 'worker';
  let tabs;
  if(effectiveRole === 'admin'){
    // Admin: no Reports tab — still show Resign beside Team/More
    tabs = ALL_TABS.filter(t => (t.roles.includes('admin') || t.roles.includes('manager') || t.roles.includes('worker') || t.id==='resign') && t.id!=='reports');
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
  const _realTabs = tabs.filter(t=>!(t.action||t.id==='resign'));
  const firstTab = (effectiveRole==='admin' && _realTabs.some(t=>t.id==='pending')) ? 'pending' : (_realTabs[0]&&_realTabs[0].id) || 'home';
  _currentTab = firstTab;

  // Hide sync row for guest users (irrelevant for guests)
  const learnBar = document.querySelector('.learn-hdr-bar');
  if(learnBar) learnBar.style.display = ''; // Always visible for all roles
  const syncRow = document.getElementById('syncRow');
  if(syncRow) syncRow.style.display = isGuest() ? 'none' : '';

  // Prefer primary tabs; overflow into More sheet (max 5 bottom items)
  const PRIMARY_ORDER = ['home','myshift','schedule','leave','pending','team','todo','reports','resign'];
  tabs = tabs.slice().sort((a,b)=>PRIMARY_ORDER.indexOf(a.id)-PRIMARY_ORDER.indexOf(b.id));
  const maxPrimary = 4;
  const primaryTabs = tabs.length <= 5 ? tabs : tabs.slice(0, maxPrimary);
  const moreTabs = tabs.length <= 5 ? [] : tabs.slice(maxPrimary);
  window._navMoreTabs = moreTabs;

  const _nbHtml = (t, on)=>{
    const _lg = (typeof _lang!=='undefined' && _lang) ? _lang : 'hi';
    const label = (_lg === 'hi')
      ? t.lbl
      : (t.lblEn || ((typeof mlT === 'function') ? mlT(t.lbl, _lg) : t.lbl) || t.lbl);
    // Action items (e.g. Resign) sit beside Reports — open form, do not switch tab
    if(t.action || t.id==='resign'){
      return `<button class="nb" id="nb-${t.id}" type="button" onclick="event.preventDefault();try{closeNavMoreSheet&&closeNavMoreSheet()}catch(e){};try{openResignationForm()}catch(e){console.warn(e)}" aria-label="${label}">
      <span class="nb-ico">${t.ico}</span><span style="font-size:12px;font-weight:800">${label}</span>
    </button>`;
    }
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
      <span class="nb-ico">☰</span><span style="font-size:12px;font-weight:800">${(typeof _lang!=='undefined' && _lang==='hi')?('और'):('More')}</span>
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
      btn.className = 'pc-nav-btn' + (t.id===firstTab && !(t.action||t.id==='resign')?' on':'');
      btn.id = 'pc-nb-'+t.id;
      const _lg2 = (typeof _lang!=='undefined' && _lang) ? _lang : 'hi';
      const sLabel = (_lg2 === 'hi')
        ? t.lbl
        : (t.lblEn || ((typeof mlT === 'function') ? mlT(t.lbl, _lg2) : t.lbl) || t.lbl);
      btn.setAttribute('aria-label', sLabel);
      btn.innerHTML = `<span class="pc-nav-ico">${t.ico}</span><span class="pc-nav-lbl">${sLabel}</span>`
        + (t.id==='pending' ? `<span class="pc-nav-badge" id="pcPendingBadge" style="display:none">0</span>` : '')
        + (t.id==='todo'    ? `<span class="pc-nav-badge" id="pcTodoBadge" style="display:none">0</span>` : '');
      if(t.action || t.id==='resign'){
        btn.onclick = ()=>{ try{ openResignationForm(); }catch(e){ console.warn(e); } };
      } else {
        btn.onclick = ()=>goTab(t.id);
      }
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
    if(logoutBtn){ logoutBtn.style.opacity='.5'; logoutBtn.style.pointerEvents='none'; logoutBtn.querySelector('.pa-label').textContent=L('🚪 Logout हो रहा है...','🚪 Logging out...'); }
    toast(L('🚪 Logout हो रहा है...','🚪 Logging out...'));
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

  // ── 6. Hide app UI immediately (avoid white screen) ──
  try{
    var main=document.getElementById('mainApp')||document.getElementById('appRoot');
    if(main) main.style.display='none';
    var hdr=document.getElementById('mainHdr');
    if(hdr) hdr.style.display='none';
    var login=document.getElementById('loginScreen');
    if(login){ login.style.display='flex'; login.classList.add('show'); login.style.visibility='visible'; }
    var ls=document.getElementById('loadingScreen');
    if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
  }catch(e){}
  // ── 7. Redirect ──
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


window.handleCompanyLogoFile = function(input){
  const file = input && input.files && input.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ toast(L('⚠️ File 2MB से छोटी रखें','⚠️ Keep file under 2MB')); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = function(){
    const dataUrl = String(reader.result||'');
    const img = new Image();
    img.onload = function(){
      try{
        const maxW = 400, maxH = 400;
        let w = img.width, h = img.height;
        const scale = Math.min(1, maxW/w, maxH/h);
        w = Math.round(w*scale); h = Math.round(h*scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        let out = canvas.toDataURL('image/png');
        if(out.length > 180000) out = canvas.toDataURL('image/jpeg', 0.72);
        if(out.length > 220000){
          toast(L('⚠️ Logo अभी भी बड़ा है — simpler image try करें','⚠️ Logo still large — try a simpler image'));
          return;
        }
        if(!_shiftDraft) _shiftDraft = {};
        _shiftDraft.companyLogo = out;
        const prev = document.getElementById('ss_logoPreview');
        if(prev) prev.innerHTML = '<img src="'+out+'" alt="logo" style="max-width:100%;max-height:100%;object-fit:contain"/>';
        try{ _applyCompanyLogoToUI(out); }catch(e){}
        toast(L('✅ Logo ready — Save दबाएँ','✅ Logo ready — press Save'));
      }catch(e){ console.warn(e); toast('Logo process failed'); }
    };
    img.onerror = function(){ toast('Invalid image'); };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
};
window.clearCompanyLogo = function(){
  if(_shiftDraft) _shiftDraft.companyLogo = '';
  const prev = document.getElementById('ss_logoPreview');
  if(prev) prev.innerHTML = '<span style="font-size:11px;color:var(--muted2)">No logo</span>';
  const inp = document.getElementById('ss_logoFile');
  if(inp) inp.value = '';
  try{ _applyCompanyLogoToUI(''); }catch(e){}
  toast(L('Logo cleared — Save to apply','Logo cleared — Save to apply'));
};
window._applyCompanyLogoToUI = function(dataUrl){
  const url = dataUrl || '';
  try{
    let el = document.getElementById('hdrCompanyLogo');
    const brand = document.querySelector('.hdr-brand');
    if(url){
      if(!el && brand){
        el = document.createElement('img');
        el.id = 'hdrCompanyLogo';
        el.alt = 'Company';
        el.style.cssText = 'height:28px;max-width:120px;object-fit:contain;margin-right:8px;vertical-align:middle;border-radius:4px';
        brand.insertBefore(el, brand.firstChild);
      }
      if(el){ el.src = url; el.style.display = ''; }
    } else if(el){
      el.style.display = 'none';
      el.removeAttribute('src');
    }
  }catch(e){}
  try{
    const key = (typeof myShiftConfigKey==='function') ? myShiftConfigKey() : null;
    if(key){
      if(url) localStorage.setItem('mp_logo_'+key, url);
      else localStorage.removeItem('mp_logo_'+key);
    }
    if(url) sessionStorage.setItem('mp_logo_session', url);
    else sessionStorage.removeItem('mp_logo_session');
  }catch(e){}
};
window._loadCompanyLogoToUI = function(){
  try{
    const cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : null;
    let url = (cfg && cfg.companyLogo) || '';
    if(!url){
      const key = (typeof myShiftConfigKey==='function') ? myShiftConfigKey() : null;
      if(key) url = localStorage.getItem('mp_logo_'+key) || '';
    }
    _applyCompanyLogoToUI(url||'');
  }catch(e){}
};


