/* Man Power — Session settings core (company, leave-team, schedule UI helpers)
 * Companion modules: -shift, -profile, -security (v5.1.0 split)
 */
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
    toast('❌ '+(e.message||e)+L(' — Phone OTP verify करके फिर try करें',' — verify phone OTP and try again'));
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
    `<option value="${r.emp.id}"${i===0?' selected':''}>${i===0?'⭐ ':''}${escHtml(r.emp.name)} (${escHtml(r.emp.empId||'—')}) · ${escHtml(r.phone)} · score ${r.score}</option>`
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
      <div style="font-size:16px;font-weight:900;color:var(--text)">${escHtml(best.emp.name)}</div>
      <div style="font-size:12px;color:var(--muted2)">📱 ${escHtml(best.phone)} · Emp ${escHtml(best.emp.empId||'—')} · score ${best.score}
        ${best.reasons.length?` · ${escHtml(best.reasons.join(', '))}`:''}</div>
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
    // Phone Auth required — rules check auth.token.phone_number
    if(typeof _ensureWriteAuth==='function'){
      setProg('0/6 · Verifying phone login…');
      const authOk = await _ensureWriteAuth();
      if(!authOk){
        toast('❌ Phone OTP verify required — Manager must complete OTP, then retry handoff');
        setProg('Failed: need phone OTP (not device-password only)');
        document.querySelectorAll('.modal-box .big-btn, .modal .big-btn').forEach(b=>{ b.disabled = false; });
        return;
      }
    }
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
    updates['employees/'+succ.id+'/role'] = 'manager';
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
        role: 'manager',
        perms: { schedule:true, leave:true, reports:true },
        isTeamManager: true
      });
    }

    setProg('2/6 · Promoting new Manager login…');
    let succUser = null;
    try{ succUser = await fbGet('mobileUsers/'+newKey); }catch(e){}
    // Employee row is source of truth for team ownership — always promote here
    try{
      await fbUpdate('employees/'+succ.id, {
        role: 'manager',
        accessLevel: 'manager',
        isTeamManager: true,
        managerId: newKey,
        perms: { schedule:true, leave:true, reports:true },
        updatedAt: new Date().toISOString()
      });
    }catch(eEmp){ console.warn('[handoff] emp promote', eEmp); }
    try{
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
    }catch(eMu){
      console.warn('[handoff] mobileUsers promote failed — roster still under new manager via employees', eMu);
      toast('⚠️ Manager login role may need Admin → Promote / Repair managers');
    }

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

    setProg('4/6 · Copying shift settings, logo & leave quotas…');
    try{
      const oldCfgKey = ('mgr:'+oldKey).replace(/[:.#$\[\]]/g,'_');
      const newCfgKey = ('mgr:'+newKey).replace(/[:.#$\[\]]/g,'_');
      const cfg = await fbGet('shiftConfigs/'+oldCfgKey);
      if(cfg){
        await fbSet('shiftConfigs/'+newCfgKey, {
          ...cfg,
          transferredFrom: oldKey,
          transferredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        // Ensure logo is present for new manager profile UI
        if(cfg.companyLogo){
          try{ await fbUpdate('mobileUsers/'+newKey, { companyLogo: cfg.companyLogo, teamLogo: cfg.companyLogo }); }catch(e){}
        }
      }
    }catch(ex){ console.warn('cfg transfer', ex); }
    // Leave quotas (manager settings)
    try{
      const oldLq = 'leaveQuotas/'+(('mgr:'+oldKey).replace(/[:.#$\[\]]/g,'_'));
      const newLq = 'leaveQuotas/'+(('mgr:'+newKey).replace(/[:.#$\[\]]/g,'_'));
      // also try raw mobile keys used by openLeaveQuotaSettings
      const paths = [
        ['leaveQuotas/'+oldKey, 'leaveQuotas/'+newKey],
        [oldLq, newLq]
      ];
      for(const [from,to] of paths){
        try{
          const q = await fbGet(from);
          if(q && typeof q==='object'){
            await fbSet(to, { ...q, transferredFrom: oldKey, transferredAt: new Date().toISOString() });
          }
        }catch(e1){}
      }
    }catch(ex){ console.warn('leaveQuotas transfer', ex); }

    setProg('5/6 · Closing your Manager access…');
    // Mark old manager employee as left_team + archive
    try{
      const selfEmp = (_cache.employees||[]).find(e=>_normMobileKey(e.phone||e.mobile||'')===oldKey)
        || (typeof myEmp==='function' && myEmp()) || null;
      if(selfEmp && selfEmp.id){
        await fbUpdate('employees/'+selfEmp.id, {
          status: 'left_team',
          role: 'member',
          accessLevel: 'worker',
          managerId: newKey,
          leftAt: new Date().toISOString(),
          leftReason: 'auto_manager_handoff',
          active: false,
          updatedAt: new Date().toISOString()
        });
        await fbSet('leftEmployees/'+selfEmp.id, {
          ...selfEmp,
          status: 'left_team',
          leftAt: new Date().toISOString(),
          leftReason: 'auto_manager_handoff',
          transferredTo: newKey,
          transferredToName: succ.name,
          archivedAt: Date.now()
        }).catch(()=>{});
      }
    }catch(ex){ console.warn('old emp leave', ex); }
    // Wipe mobileUsers so next OTP = fresh Manager/Member registration
    try{
      await fbRemove('mobileUsers/'+oldKey);
    }catch(e){
      try{
        await fbSet('mobileUsers/'+oldKey, {
          status: 'removed',
          role: 'removed',
          forceFreshLogin: true,
          leftAt: new Date().toISOString(),
          leftReason: 'auto_manager_handoff',
          transferredTo: newKey,
          transferredToName: succ.name,
          clearedAt: new Date().toISOString()
        });
      }catch(e2){}
    }

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
        `नमस्ते *${escHtml(succ.name)}*,\n\n`+
        `*${escHtml(SESSION.name||'Previous manager')}* ने team आपको transfer कर दी है।\n\n`+
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
  const empOptions = emps.map(e=>`<option value="${e.id}|${escHtml(e.empId)}">${escHtml(e.name)} (${escHtml(e.empId||'—')})</option>`).join('');
  const defaultDate = new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">⏳ Access Extend / Expiry</div>
  <div class="field"><label>${typeof L==='function'?L('कर्मचारी','Employee'):'Employee'}</label>
    <select class="inp-field" id="ext_emp">${empOptions}</select></div>
  <div class="field"><label>Exact expiry date</label>
    <input type="date" class="inp-field" id="ext_date" value="${defaultDate}">
  </div>
  <div class="field"><label>${typeof L==='function'?L('या कितने दिन?','Or how many days?'):'Or how many days?'}</label>
    <select class="inp-field" id="ext_days" onchange="(function(s){var d=new Date();d.setDate(d.getDate()+parseInt(s.value||365,10));var el=document.getElementById('ext_date');if(el)el.value=d.toISOString().slice(0,10);})(this)">
      <option value="365" selected>${L('365 दिन (1 साल) — Standard','365 days (1 year) — Standard')}</option>
      <option value="180">${L('180 दिन (6 महीने)','180 days (6 months)')}</option>
      <option value="90">${L('90 दिन','90 days')}</option>
      <option value="45">${L('45 दिन','45 days')}</option>
      <option value="730">${L('730 दिन (2 साल)','730 days (2 years)')}</option>
    </select></div>
  <button class="submit-btn" onclick="doExtendAccess()">✅ ${L('Save Expiry','Save Expiry')}</button>
  <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

async function doExtendAccess(){
  const val = document.getElementById('ext_emp').value;
  if(!val){ toast(L('⚠️ कर्मचारी चुनें','⚠️ Select employee')); return; }
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


function _setScheduleSidebarWide(on){
  try{
    const sb = document.getElementById('pcSidebar');
    if(on){
      document.body.classList.add('sched-wide');
      if(sb) sb.classList.add('collapsed');
    }else{
      document.body.classList.remove('sched-wide');
      if(sb) sb.classList.remove('collapsed');
    }
  }catch(e){}
}

function _goTabDirect(t){
  const prev = _currentTab;
  _currentTab=t;
  try{ _setScheduleSidebarWide(t==='schedule'); }catch(e){}
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
  try{ if(typeof syncHandoverChipForTab==='function') syncHandoverChipForTab(); }catch(e){}
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
  let html = tabs.map(t=>{
    const label = en ? (t.lblEn||t.lbl) : t.lbl;
    if(t.action || t.id==='resign'){
      return `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();try{openResignationForm()}catch(e){}" aria-label="${label}">
      <span style="font-size:22px">${t.ico}</span>${label}
    </button>`;
    }
    return `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();goTab('${t.id}')" aria-label="${label}">
      <span style="font-size:22px">${t.ico}</span>${label}
    </button>`;
  }).join('');
  // Always show Customer Care in More
  const ccLabel = en ? 'Customer Care' : 'Customer Care';
  html += `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();openCustomerCarePage()" aria-label="${ccLabel}">
      <span style="font-size:22px">🎧</span>${ccLabel}
    </button>`;
  grid.innerHTML = html || `<div class="empty-state-sub">${en?'No extra tabs':'और टैब नहीं'}</div>`;
  sheet.classList.add('open');
}
function closeNavMoreSheet(){
  const sheet = document.getElementById('navMoreSheet');
  if(sheet) sheet.classList.remove('open');
}

function goTab(t){
  try{ if(typeof closeNavMoreSheet==='function') closeNavMoreSheet(); }catch(e){}
  // Resign is an action, not a page tab
  if(t==='resign'){ try{ openResignationForm(); }catch(e){} return; }

  if(typeof isPendingMember==='function' && isPendingMember()){
    // Still pending AND no elevated rights
    const allowed = ['home','myshift','todo'];
    if(t && !allowed.includes(t)){
      toast(L('⏳ Manager approve होने तक सिर्फ Home / My Shift / To-Do / Learn उपलब्ध हैं','⏳ Until Manager approves, only Home / My Shift / To-Do / Learn are available'));
      t = 'home';
    }
  }

  // Warn if leaving schedule tab with unsaved changes (i18n)
  if(_currentTab==='schedule' && t!=='schedule' && Object.keys(_pendingShiftChanges).length>0){
    const n = Object.keys(_pendingShiftChanges).length;
    const _L = (typeof L==='function') ? L : function(hi,en){ return (typeof _lang!=='undefined' && _lang && _lang!=='hi') ? (en||hi) : (hi||en); };
    confirmModal(
      _L(n+' बदलाव Unsaved हैं!', n+' Unsaved change'+(n>1?'s':'')+'!'),
      _L('आपने '+n+' shift'+(n>1?'s':'')+' बदले हैं जो अभी save नहीं हुए।<br><br>क्या बिना save किए जाना चाहते हैं?',
         'You changed '+n+' shift'+(n>1?'s':'')+' that are not saved yet.<br><br>Leave without saving?'),
      _L('🚪 हाँ, बिना Save जाएं','🚪 Yes, leave without Save'),
      _L('← Schedule पर रहें','← Stay on Schedule')
    ).then(ok => {
      if(ok){
        _pendingShiftChanges = {};
        _updateSaveBar();
        _goTabDirect(t);
      }
    });
    return;
  }
  // Payment gate: block tabs except Home / My Shift when unpaid
  _enforcePaymentGate(t);
}

async function _enforcePaymentGate(tab){
  try{
    if(!_isPaymentExemptUser()){
      try{ await _loadPaymentSettings(true); }catch(e){}
      try{ await _hydrateUserPaymentStatus(); }catch(e){}
    }
  }catch(e){}
  if(!_paymentGateAllows(tab)){
    openPaymentRequiredModal(tab);
    return;
  }
  _goTabDirect(tab);
}

function _updateSchedAdminVisibility(){
  const canEdit = (typeof canEditSchedule==='function') ? canEditSchedule() : false;
  // Admin/Manager (or delegated schedule perm): show Create/Upload/Print + View/Edit
  const row = document.getElementById('schedAdminRow');
  if(row) row.style.display = canEdit ? 'flex' : 'none';
  // View/Edit toggle removed — managers + members with perms.schedule always edit
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
  if(iiBtn) iiBtn.style.display = (typeof canManageReports==='function' && canManageReports()) ? 'inline-flex' : 'none';
}

function renderAll(){
  // Each step isolated — one failure must not show generic Display error for whole Home
  try{ goTab(_currentTab); }catch(e){ console.error('[renderAll] goTab', e && (e.stack||e.message||e)); }
  try{ updatePendingBadge(); }catch(e){ console.error('[renderAll] pendingBadge', e && (e.stack||e.message||e)); }
  try{ updateTodoBadge(); }catch(e){ console.error('[renderAll] todoBadge', e && (e.stack||e.message||e)); }
  try{ _updateSchedAdminVisibility(); }catch(e){ console.error('[renderAll] schedAdmin', e && (e.stack||e.message||e)); }
  try{ _mpInitHistory(); }catch(e){}
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
  // Trusted internal messages may include simple HTML (<b>, <br>, style=). Detect and render safely.
  const _msgHasHtml = /<[a-z][\s\S]*>/i.test(String(_message||''));
  const _msgHtml = _msgHasHtml ? String(_message) : escHtml(_message);
  return new Promise(resolve=>{
    const overlay = document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)';
    overlay.innerHTML=`
      <div style="background:var(--bg2);border-radius:20px 20px 0 0;padding:24px 20px 40px;width:100%;max-width:480px;border-top:1px solid var(--border2);animation:slideUp .25s cubic-bezier(.32,0,.15,1)">
        <div style="width:32px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 18px"></div>
        <div style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:10px;text-align:center">${escHtml(_title)}</div>
        <div style="font-size:14px;color:var(--muted2);line-height:1.7;text-align:center;margin-bottom:22px">${_msgHtml}</div>
        <button id="_cmYes" style="width:100%;padding:16px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--m1),#c2410c);color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 20px rgba(249,115,22,.3)">${escHtml(_yesLabel)}</button>
        <button id="_cmNo"  style="width:100%;padding:14px;border-radius:12px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">${escHtml(_noLabel)}</button>
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
      try{ if(typeof invalidateShiftCache==='function') invalidateShiftCache(); }catch(e){}
      renderAll();
    }catch(e){ console.warn('refreshAll', e); }
  }, 220);
}
function _refreshAllImpl(){ refreshAll(); }


function updatePendingBadge(){
  try{ if(typeof _loadCompanyLogoToUI==='function') _loadCompanyLogoToUI(); }catch(e){}

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

// ══ Performance: memoize getShift within a data generation ══
let _shiftResCache = new Map();
let _shiftResGen = 0;
function invalidateShiftCache(){
  _shiftResGen++;
  _shiftResCache = new Map();
}
try{ window.invalidateShiftCache = invalidateShiftCache; }catch(e){}

// Indexed approved leaves (rebuilt when leaves cache changes)
let _leaveIndexByEmp = null; // Map empKey -> [{from,to,type,leaveType,credit,autoGenerated,reason}]
function _rebuildLeaveIndex(){
  const map = new Map();
  try{
    const leaves = (typeof getLeaves==='function' ? getLeaves() : []) || [];
    leaves.forEach(l=>{
      if(!l || l.status!=='approved' || !l.from || !l.to) return;
      if(l.credit === true || l.credit === 'true' || l.credit === 1) return;
      if(l.autoGenerated && (l.type==='CO' || /C-?Off|Comp/i.test(String(l.leaveType||''))) &&
         /Holiday list|worked on|double.?shift|C-Off \+1/i.test(String(l.reason||''))) return;
      [l.empId, l.empObjId, l.empCode].filter(Boolean).forEach(k=>{
        const key = String(k);
        if(!map.has(key)) map.set(key, []);
        map.get(key).push(l);
      });
    });
  }catch(e){}
  _leaveIndexByEmp = map;
}
try{ window._rebuildLeaveIndex = _rebuildLeaveIndex; }catch(e){}

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
 * Priority: 1) overrides  2) approved leave  3) base schedule
 * Memoized per (emp,date) until invalidateShiftCache().
 */
function getShift(emp, dateStr){
  if(!emp || !dateStr) return '';
  const cacheKey = String(emp.id||'') + '|' + String(emp.empId||'') + '|' + dateStr;
  if(_shiftResCache.has(cacheKey)) return _shiftResCache.get(cacheKey);

  let result = '';
  const ov = getOverrides() || {};
  const keys = [];
  if(emp.id) keys.push(emp.id+'_'+dateStr);
  if(emp.empId) keys.push(String(emp.empId)+'_'+dateStr);
  if(emp._key) keys.push(emp._key+'_'+dateStr);

  for(const k of keys){
    if(ov[k] != null && ov[k] !== ''){
      result = _normalizeOverrideShift(ov[k]);
      _shiftResCache.set(cacheKey, result);
      return result;
    }
  }
  // Full-table scan of overrides removed for speed — keys above cover normal writes.

  // 2) Approved leave via index
  try{
    if(!_leaveIndexByEmp) _rebuildLeaveIndex();
    const idSet = [String(emp.id||''), String(emp.empId||'')].filter(Boolean);
    let onLeave = null;
    for(const id of idSet){
      const arr = _leaveIndexByEmp && _leaveIndexByEmp.get(id);
      if(!arr) continue;
      onLeave = arr.find(l => l.from <= dateStr && l.to >= dateStr) || null;
      if(onLeave) break;
    }
    if(onLeave){
      result = (onLeave.type==='CO' || /C-?Off|Comp/i.test(String(onLeave.leaveType||''))) ? 'C/O' : 'L';
      _shiftResCache.set(cacheKey, result);
      return result;
    }
  }catch(e){}

  try{
    if(_isBeforeJoining(emp, dateStr)){
      _shiftResCache.set(cacheKey, '');
      return '';
    }
  }catch(e){}

  result = getBaseShift(emp, dateStr) || '';
  _shiftResCache.set(cacheKey, result);
  return result;
}

/** Single source of truth — schedule, My Shift, picker */
window.MP_SHIFT_COLORS = {
  D:{bg:'#a16207',fg:'#fff'}, N:{bg:'#4f46e5',fg:'#fff'},
  A:{bg:'#16a34a',fg:'#fff'}, B:{bg:'#db2777',fg:'#fff'}, C:{bg:'#0891b2',fg:'#fff'},
  O:{bg:'#475569',fg:'#fff'}, L:{bg:'#be123c',fg:'#fff'}, G:{bg:'#2563eb',fg:'#fff'},
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
      background: #a16207 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
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
  const order=['D','N','G','A','B','C'];
  // Prefer showing only active (Auto) shifts under section; if none flagged, show all configured
  let codes = order.filter(c=>{
    const s=byCode[c];
    return s && s.active!==false;
  });
  if(!codes.length) codes = order.filter(c=>byCode[c]);
  if(!codes.length) codes = getActiveRotationCodes();
  const bits=codes.map(code=>{
    const s=byCode[code]||{code,label:code};
    const _defTimes={D:['07:00','19:00'],N:['19:00','07:00'],G:['08:00','20:00'],A:['06:00','14:00'],B:['14:00','22:00'],C:['22:00','06:00']};
    let stt=s.start||s.startTime||s.from||'';
    let enn=s.end||s.endTime||s.to||'';
    if((!stt||!enn)&&_defTimes[code]){ stt=_defTimes[code][0]; enn=_defTimes[code][1]; }
    // Always show times for G (and other work codes)
    if(code==='G' && (!stt||!enn)){ stt='08:00'; enn='20:00'; }
    const t=(stt&&enn)?(stt+'–'+enn):'';
    let lab = (s.label && String(s.label).trim()) ? String(s.label).trim() : (code==='G' ? 'General Shift' : code);
    if(code==='G' && (lab==='G' || lab==='General' || lab.toLowerCase()==='general')) lab = 'General Shift';
    return '<span class="shc '+cellClass(code)+'" style="width:auto;min-width:22px;height:18px;padding:0 5px;font-size:10px;margin-right:2px">'+code+'</span><span style="font-size:10px;color:var(--muted2);margin-right:10px">'+escHtml(lab)+(t?' · '+t:'')+'</span>';
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
    {code:'G',   label: en?'General Shift':'General Shift',    icon:'⚙️', clr:'#0284c7', bg:'rgba(2,132,199,.08)'},
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
      html += `<div class="today-summary-card" style="${cardStyle}"><div class="today-summary-val" style="${valStyle};color:${c.color}">${c.n}</div><div class="today-summary-lbl" style="${lblStyle}">${escHtml(c.label)}</div></div>`;
    });
    html += `</div>`;
    return html;
  }catch(e){ console.warn('[home summary]', e); return ''; }
}




/* ── Auto rotation sequence boxes (Shift & Min Staff) ── */
function _ssRotActiveCodes(){
  try{
    var d = (typeof _shiftDraft !== 'undefined' && _shiftDraft) ? _shiftDraft : (typeof getShiftConfigSync === 'function' ? getShiftConfigSync() : {});
    var shifts = (d && d.shifts) ? d.shifts : [];
    var work = shifts.filter(function(s){ return s && s.code && s.active !== false; })
      .map(function(s){ return String(s.code).toUpperCase(); })
      .filter(function(c){ return ['D','N','A','B','C'].indexOf(c) >= 0; });
    var abcd = work.filter(function(c){ return ['A','B','C','D'].indexOf(c) >= 0; });
    if (abcd.length >= 2) return abcd;
    var dn = work.filter(function(c){ return c === 'D' || c === 'N'; });
    if (dn.length) return dn;
    return work.length ? work : ['A','B','C'];
  }catch(e){ return ['A','B','C']; }
}
function _ssRotDefaultSeq(preset){
  var codes = _ssRotActiveCodes();
  var n = codes.length;
  if (preset === 'plant' && n >= 3) {
    var out = [codes[0]];
    for (var i = n - 1; i >= 1; i--) out.push(codes[i]);
    return out;
  }
  if (preset === 'adb') {
    var prefer = ['A','D','B','C'].filter(function(c){ return codes.indexOf(c) >= 0; });
    if (prefer.length >= 3) return prefer;
    if (n >= 4) return [codes[0], codes[n-1], codes[1], codes[2]];
  }
  return codes.slice();
}
function _ssRotSeqInit(){
  try{
    var d = (typeof _shiftDraft !== 'undefined' && _shiftDraft) ? _shiftDraft : {};
    var seq = Array.isArray(d.autoRotationSequence)
      ? d.autoRotationSequence.map(function(x){ return String(x).toUpperCase(); }).filter(Boolean)
      : null;
    if (!seq || !seq.length) {
      var mode = String(d.autoRotationMode || 'plant').toLowerCase();
      seq = _ssRotDefaultSeq(mode === 'sequential' ? 'sequential' : (mode === 'custom' ? 'sequential' : 'plant'));
    }
    window._ssRotSeqBoxes = seq.slice();
    _ssRotSeqRender();
  }catch(e){ console.warn('_ssRotSeqInit', e); }
}
function _ssRotSeqRender(){
  var wrap = document.getElementById('ss_rotSeqWrap');
  if (!wrap) return;
  var boxes = (window._ssRotSeqBoxes && window._ssRotSeqBoxes.length)
    ? window._ssRotSeqBoxes.slice()
    : ['A','B','C'];
  if (!boxes.length) boxes = ['A','B','C'];
  var html = '';
  for (var i = 0; i < boxes.length; i++) {
    if (i > 0) {
      html += '<span style="font-weight:900;color:#a78bfa;font-size:18px;user-select:none">→</span>';
    }
    var code = String(boxes[i] || '').replace(/"/g, '');
    html += '<input type="text" class="ss-rot-box" data-rot-i="' + i + '" maxlength="3" value="' + code + '" ' +
      'placeholder="' + (i + 1) + '" ' +
      'style="width:56px;height:44px;text-align:center;font-weight:900;font-size:16px;padding:8px 4px;' +
      'text-transform:uppercase;border-radius:10px;border:2px solid #a78bfa;background:var(--card);color:var(--text);' +
      'box-sizing:border-box" ' +
      'oninput="_ssRotSeqOnInput()" onchange="_ssRotSeqOnInput()" />';
  }
  wrap.innerHTML = html;
  try { _ssRotSeqOnInput(); } catch (e) {}
}
function _ssRotSeqOnInput(){
  try{
    var inputs = document.querySelectorAll('#ss_rotSeqWrap .ss-rot-box');
    var seq = [];
    for (var i = 0; i < inputs.length; i++) {
      var v = String(inputs[i].value || '').trim().toUpperCase();
      if (v) seq.push(v);
    }
    window._ssRotSeqBoxes = [];
    for (var j = 0; j < inputs.length; j++) {
      window._ssRotSeqBoxes.push(String(inputs[j].value || '').trim().toUpperCase());
    }
    if (typeof _shiftDraft !== 'undefined' && _shiftDraft) {
      _shiftDraft.autoRotationSequence = seq.slice();
      _shiftDraft.autoRotationMode = 'custom';
    }
  }catch(e){}
}
function _ssRotSeqRead(){
  _ssRotSeqOnInput();
  return (window._ssRotSeqBoxes || []).map(function(x){ return String(x||'').trim().toUpperCase(); }).filter(Boolean);
}
function _ssRotSeqPreset(kind){
  window._ssRotSeqBoxes = _ssRotDefaultSeq(kind);
  _ssRotSeqRender();
}
function _ssRotSeqAddBox(){
  if (!window._ssRotSeqBoxes) window._ssRotSeqBoxes = [];
  if (window._ssRotSeqBoxes.length >= 6) return;
  window._ssRotSeqBoxes.push('');
  _ssRotSeqRender();
}
function _ssRotSeqRemoveBox(){
  if (!window._ssRotSeqBoxes || window._ssRotSeqBoxes.length <= 2) return;
  window._ssRotSeqBoxes.pop();
  _ssRotSeqRender();
}
try {
  window._ssRotSeqInit = _ssRotSeqInit;
  window._ssRotSeqRender = _ssRotSeqRender;
  window._ssRotSeqRead = _ssRotSeqRead;
  window._ssRotSeqPreset = _ssRotSeqPreset;
  window._ssRotSeqAddBox = _ssRotSeqAddBox;
  window._ssRotSeqRemoveBox = _ssRotSeqRemoveBox;
  window._ssRotSeqOnInput = _ssRotSeqOnInput;
} catch (e) {}
