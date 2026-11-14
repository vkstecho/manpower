/* Man Power — schedule shift edit: pending save bar, leave, C-Off, OD, WhatsApp
 * Extracted from app-team-excel-ops.js (v5.1.0 module split)
 * Depends on: app-core (L, toast, fb*, SESSION, getEmps), schedule page DOM
 */
// ADMIN: SHIFT CELL EDIT
// ══════════════════════════════════════════════
// ════════════════════════════════════════
// PENDING SHIFT CHANGES (multi-user, single Save)
// ════════════════════════════════════════
// Structure: { 'empId__date': { empId, empName, date, newShift, currentShift } }
let _pendingShiftChanges = {};

function _updateSaveBar(){
  const bar   = document.getElementById('schedSaveBar');
  const list  = document.getElementById('saveBarList');
  const title = document.getElementById('saveBarTitle');
  const sub   = document.getElementById('saveBarSub');
  const barMy = document.getElementById('schedSaveBarMyShift');
  const listMy = document.getElementById('saveBarListMy');
  const titleMy = document.getElementById('saveBarTitleMy');
  const subMy = document.getElementById('saveBarSubMy');
  const entries = Object.values(_pendingShiftChanges);
  if(!entries.length){
    if(bar) bar.style.display='none';
    if(barMy) barMy.style.display='none';
    // Also reposition multi-select bar if visible
    if(typeof _msUpdateBar === 'function') setTimeout(_msUpdateBar, 0);
    return;
  }

  if(bar) bar.style.display='block';
  if(barMy) barMy.style.display='block';
  // After Save bar shows, reposition multi-select bar above it
  if(typeof _msUpdateBar === 'function') setTimeout(_msUpdateBar, 50);

  // Count unique employees
  const empIds = [...new Set(entries.map(e=>e.empId))];
  // Pure Hindi / pure English — no mixed "pending" / "Save करने"
  const _titleTxt = L(
    '📝 '+entries.length+' बदलाव लंबित — '+empIds.length+' कर्मचारी',
    '📝 '+entries.length+' changes pending — '+empIds.length+' employee(s)'
  );
  if(title) title.textContent = _titleTxt;
  if(titleMy) titleMy.textContent = _titleTxt;

  // WhatsApp count
  const withPhone = empIds.filter(id=>{
    const emp=getEmps().find(e=>e.id===id);
    return emp && emp.phone && emp.phone.length===10;
  }).length;
  const _subTxt = withPhone
    ? L('📲 सहेजने पर '+withPhone+' कर्मचारी को WhatsApp जाएगा (मुफ़्त)','📲 On Save, WhatsApp will be sent to '+withPhone+' employee(s) (Free)')
    : L('⚠️ किसी कर्मचारी का मोबाइल नंबर नहीं है','⚠️ No employee mobile number available');
  if(sub) sub.textContent = _subTxt;
  if(subMy) subMy.textContent = _subTxt;

  // List each pending change
  if(list){
    list.innerHTML = entries.map(e=>{
      const fmtD = new Date(e.date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'});
      const shiftBg = {'D':'#f59e0b','N':'#4f46e5','O':'#334155','L':'#be123c','G':'#0284c7','C/O':'#92400e','HLF':'#ea580c','Ab':'#7f1d1d','H':'#ea580c','OD':'#0d9488','GP':'#6d28d9','A':'#16a34a','B':'#db2777','C':'#0891b2'};
      const bg = shiftBg[e.newShift] || '#444';
      return `<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border-radius:8px;padding:8px 10px">
      <span style="display:inline-flex;width:30px;height:26px;background:${bg};border-radius:5px;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#fff;flex-shrink:0">${cellDisp(e.newShift)}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:800;color:#f0fdf4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(e.empName)}</div>
        <div style="font-size:11px;color:#bbf7d0">${fmtD}</div>
      </div>
      <button onclick="removePendingChange('${escHtml(e.empId)}','${e.date}')" style="background:none;border:none;color:var(--lv);font-size:16px;cursor:pointer;padding:4px;flex-shrink:0">✕</button>
    </div>`;
    }).join('');
  }

  // Sync My Shift list AFTER schedule list is built (was previously empty)
  try{
    if(listMy && list) listMy.innerHTML = list.innerHTML;
  }catch(e){}

  // Language-aware idle Save / Cancel labels on both bars
  try{
    const saveLabel = L('💾 सहेजें','💾 Save');
    const saveWaLabel = L('💾 सहेजें और WhatsApp भेजें','💾 Save & WhatsApp');
    const cancelLabel = L('✕ रद्द करें','✕ Cancel');
    const discardLabel = L('✕ रद्द करें','✕ Discard');
    const schedSaveBtn = document.querySelector('#schedSaveBar button[onclick*="saveAllShiftChanges"]');
    if(schedSaveBtn && !schedSaveBtn.disabled) schedSaveBtn.innerHTML = saveLabel;
    const mySaveBtn = document.querySelector('#schedSaveBarMyShift button[onclick*="saveAllShiftChanges"]');
    if(mySaveBtn && !mySaveBtn.disabled) mySaveBtn.innerHTML = saveWaLabel;
    const schedCancel = document.querySelector('#schedSaveBar button[onclick*="discardAllShiftChanges"]');
    if(schedCancel) schedCancel.textContent = cancelLabel;
    const myCancel = document.querySelector('#schedSaveBarMyShift button[onclick*="discardAllShiftChanges"]');
    if(myCancel) myCancel.textContent = discardLabel;
  }catch(e){}
}

function removePendingChange(empId, date){
  const key = empId+'__'+date;
  delete _pendingShiftChanges[key];
  // Restore the cell in the table to its original shift color
  const cellEl = document.querySelector(`[data-pending="${key}"]`);
  if(cellEl){
    const orig = cellEl.dataset.origShift || 'O';
    cellEl.innerHTML = `<span class="shc ${cellClass(orig)}">${cellDisp(orig)}</span>`;
    cellEl.removeAttribute('data-pending');
  }
  _updateSaveBar();
}

function discardAllShiftChanges(){
  // Restore all pending cells in table
  Object.keys(_pendingShiftChanges).forEach(key=>{
    const cellEl = document.querySelector(`[data-pending="${key}"]`);
    if(cellEl){
      const orig = cellEl.dataset.origShift || 'O';
      cellEl.innerHTML = `<span class="shc ${cellClass(orig)}">${cellDisp(orig)}</span>`;
      cellEl.removeAttribute('data-pending');
    }
  });
  _pendingShiftChanges = {};
  _updateSaveBar();
  toast(L('🗑️ सभी बदलाव रद्द किए गए','🗑️ All changes cancelled'));
}

async function _retrySaveAfterReauth(){
  const ok = await _ensureWriteAuth();
  if(ok){
    const errEl = document.getElementById('saveBarPermErr');
    if(errEl) errEl.remove();
    await saveAllShiftChanges();
  }
}


async function _requestCompOff(emp, dateStr, reason){
  try{
    if(!emp || !emp.id || !dateStr) return;
    // Deduplicate: skip if already have CO leave for same emp+date
    try{
      const existing = (getLeaves()||[]).find(l=>
        (l.empId===emp.id || l.empId===emp.empId) &&
        l.from===dateStr && (l.type==='CO' || /C-?Off|Comp/i.test(l.leaveType||''))
      );
      if(existing) return;
    }catch(e){}
    // Auto rules: grant APPROVED C-Off (balance +1) — do NOT create pending approval noise
    await _grantApprovedCompOff(emp, dateStr, reason||'Compensatory Off');
  }catch(e){ console.warn('[requestCompOff]', e); }
}
async function _processAutoCompOffRules(savedEntries){
  try{
    const emps = getEmps()||[];
    const byId = {};
    emps.forEach(e=>{ byId[e.id]=e; if(e.empId) byId[e.empId]=e; });
    for(const e of (savedEntries||[])){
      const emp = byId[e.empId];
      if(!emp) continue;
      const sh = String(e.newShift||'');
      // Double shift → C-Off credit (+1 balance)
      if(typeof parseShiftWorkCodes==='function' && parseShiftWorkCodes(sh).length>=2)
        await _requestCompOff(emp, e.date, 'Double shift ('+sh+') — C-Off +1');
      // Manual H on one cell does NOT auto-grant (Holiday List controls C-Off for holidays)
    }
    const affectedIds = [...new Set((savedEntries||[]).map(x=>x.empId))];
    for(const eid of affectedIds){
      const emp = byId[eid];
      if(emp) await _checkWeeklyOffGapAndRequestCO(emp);
    }
  }catch(err){ console.warn('[autoCompOff]', err); }
}
async function _checkWeeklyOffGapAndRequestCO(emp){
  try{
    const today = new Date();
    const offs = [];
    for(let i=0;i<60;i++){
      const d = new Date(today); d.setDate(d.getDate()-i);
      const ds = d.toISOString().slice(0,10);
      const sh = getShift(emp, ds);
      if(sh==='O'||sh==='C/O'||sh==='CO') offs.push(ds);
    }
    offs.sort();
    for(let i=1;i<offs.length;i++){
      const gap = Math.round((new Date(offs[i])-new Date(offs[i-1]))/86400000);
      if(gap > 9){
        const mid = new Date(new Date(offs[i-1]).getTime() + Math.floor(gap/2)*86400000);
        await _requestCompOff(emp, mid.toISOString().slice(0,10), 'Weekly off gap '+gap+' days (>9) — C-Off');
        break;
      }
    }
  }catch(e){ console.warn('[weeklyOffGap]', e); }
}
async function applyHolidaysToTeam(dates){
  /** Does NOT mark H on the schedule.
   *  For each holiday date: if member's base roster was a working shift (D/N/A/B/C/G/GP/…),
   *  grant +1 approved C-Off credit to their balance.
   *  Also clears any previous auto-H overrides on those dates so schedule shows real duty.
   */
  const team = (getEmps()||[]).filter(e=>e.status!=='resigned'&&e.status!=='left');
  let n=0;
  const WORK = new Set(['A','B','C','D','N','GP','G','1','2','OD']);
  const clearH = {}; // remove mistaken auto-H so schedule is not overwritten
  for(const dateStr of dates){
    for(const emp of team){
      const key = emp.id+'_'+dateStr;
      const ov = (getOverrides()||{})[key];
      // Clear auto-H only (leave other overrides like L, C/O alone)
      if(String(ov)===('H') || String(ov)==='Holiday'){
        clearH[key] = null; // Firebase null deletes
      }
      // Duty check uses base schedule (Excel/Firebase), not override
      const prior = String((typeof getBaseShift==='function' ? getBaseShift(emp, dateStr) : getShift(emp, dateStr))||'').toUpperCase();
      const codes = (typeof parseShiftWorkCodes==='function') ? parseShiftWorkCodes(prior) : [prior];
      const wasWorking = codes.some(c=>WORK.has(String(c).toUpperCase())) || WORK.has(prior);
      if(wasWorking){
        await _grantApprovedCompOff(emp, dateStr, 'Holiday list — worked on '+prior+' · C-Off +1', { credit: true });
        n++;
      }
    }
  }
  if(Object.keys(clearH).length){
    try{
      // RTDB: set null to remove keys
      await fbUpdate('overrides', clearH);
      const oc = {...(getOverrides()||{})};
      Object.keys(clearH).forEach(k=>{ delete oc[k]; });
      _cache.overrides = oc;
    }catch(e){ console.warn('[clearH]', e); }
  }
  return n;
}

/** Grant approved C-Off (increases balance) — no pending approval / no manager notification. */
async function _grantApprovedCompOff(emp, dateStr, reason, opts){
  try{
    if(!emp || !emp.id || !dateStr) return;
    try{
      const existing = (getLeaves()||[]).find(l=>
        (l.empId===emp.id || l.empId===emp.empId) &&
        String(l.from)===String(dateStr) &&
        (l.type==='CO' || /C-?Off|Comp/i.test(String(l.leaveType||'')))
      );
      if(existing && !(opts && opts.sendWA)) return;
      if(existing && opts && opts.sendWA){
        // already recorded — only WhatsApp
        const phone = (emp.phone||emp.mobile||'').toString().replace(/\D/g,'').slice(-10);
        if(phone && phone.length===10 && typeof openWA==='function'){
          const cfg = (typeof getShiftConfigSync==='function' ? getShiftConfigSync() : null) || {};
          const def = (typeof _defaultShiftConfig==='function' ? _defaultShiftConfig() : {});
          let tpl = getWATemplate('waCOffTemplate', cfg.waCOffTemplate);
          const fmtD = (()=>{ try{ return new Date(dateStr+'T12:00:00').toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return dateStr; }})();
          const msg = (tpl||'🔄 *C-Off*\n*{name}*\n📅 {coffDate}\n{reason}\n_— {manager}_')
            .replace(/\{name\}/g, emp.name||'')
            .replace(/\{date\}/g, fmtD)
            .replace(/\{coffDate\}/g, fmtD)
            .replace(/\{reason\}/g, reason||'C-Off')
            .replace(/\{manager\}/g, SESSION.name||'Manager');
          if(typeof _isSelfEmployee==='function' && _isSelfEmployee(emp)) return;
          if(typeof _appendWaAppLink==='function') msg = _appendWaAppLink(msg);
          openWA(phone, msg);
        }
        return;
      }
    }catch(e){}
    const payload = {
      empId: emp.id, empName: emp.name||'', empCode: emp.empId||'',
      type:'CO', leaveType:'C/O', from:dateStr, to:dateStr, days:1,
      reason: reason||'Compensatory Off', status:'approved', autoGenerated:true,
      credit: true, // earns +1 C-Off balance (not a used day)
      approvedAt: new Date().toISOString(), approvedBy: SESSION.name||'system',
      requestedAt: new Date().toISOString(),
      coffDate: dateStr
    };
    await fbPush('leaves', payload);
    // WhatsApp only when explicitly requested (manual C-Off mark), not bulk auto
    if(opts && opts.sendWA){
      try{
        const phone = (emp.phone||emp.mobile||'').toString().replace(/\D/g,'').slice(-10);
        if(phone && phone.length===10 && typeof openWA==='function'){
          const cfg = (typeof getShiftConfigSync==='function' ? getShiftConfigSync() : null) || {};
          const def = (typeof _defaultShiftConfig==='function' ? _defaultShiftConfig() : {});
          let tpl = getWATemplate('waCOffTemplate', cfg.waCOffTemplate);
          const fmtD = (()=>{ try{ return new Date(dateStr+'T12:00:00').toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return dateStr; }})();
          const msg = tpl
            .replace(/\{name\}/g, emp.name||'')
            .replace(/\{date\}/g, fmtD)
            .replace(/\{coffDate\}/g, fmtD)
            .replace(/\{reason\}/g, reason||'C-Off')
            .replace(/\{manager\}/g, SESSION.name||'Manager');
          if(typeof _isSelfEmployee==='function' && _isSelfEmployee(emp)) return;
          if(typeof _appendWaAppLink==='function') msg = _appendWaAppLink(msg);
          openWA(phone, msg);
        }
      }catch(e){ console.warn('[coff WA]', e); }
    }
  }catch(e){ console.warn('[grantApprovedCompOff]', e); }
}


function getManagerLeaveTypeLabels(){
  try{
    const q = window._leaveQuotaLast || null;
    return _typesFromLeaveQuota(q).map(t=>t.label);
  }catch(e){
    return ['Casual Leave (CL)','Sick Leave (SL)','Earned Leave (EL)','Other'];
  }
}

async function prefetchLeaveQuotaForChips(){
  try{
    const keys = [];
    try{ if(typeof myShiftConfigKey==='function' && myShiftConfigKey()) keys.push('leaveQuotas/'+myShiftConfigKey()); }catch(e){}
    if(SESSION && SESSION.mobile) keys.push('leaveQuotas/'+(typeof _normMobileKey==='function'?_normMobileKey(SESSION.mobile):SESSION.mobile));
    if(SESSION && SESSION.managerId) keys.push('leaveQuotas/'+(typeof _normMobileKey==='function'?_normMobileKey(SESSION.managerId):SESSION.managerId));
    keys.push('leaveQuotas/default');
    for(const k of keys){
      try{
        const r = await fbGet(k);
        if(r && typeof r==='object' && Object.keys(r).length){
          window._leaveQuotaLast = r;
          const ck = (typeof myShiftConfigKey==='function' && myShiftConfigKey()) || '';
          if(ck){ window._leaveQuotaCache = window._leaveQuotaCache||{}; window._leaveQuotaCache[ck]=r; }
          break;
        }
      }catch(e){}
    }
  }catch(e){}
}

async function saveAllShiftChanges(opts){
  opts = opts || {};
  const skipWhatsApp = !!opts.skipWhatsApp;
  const stayOnMyShift = !!opts.stayOnMyShift;
  const entries = Object.values(_pendingShiftChanges);
  if(!entries.length){ toast(L('कोई बदलाव नहीं है','No changes to save')); return; }

  const saveBtn = document.querySelector('#schedSaveBar button[onclick*="saveAllShiftChanges"]') ||
                  document.querySelector('#schedSaveBar button:last-child');
  const origBtnHtml = saveBtn ? saveBtn.innerHTML : L('💾 सहेजें और WhatsApp भेजें','💾 Save & WhatsApp');
  const showSaving = () => { if(saveBtn){ saveBtn.innerHTML=L('⏳ सहेजा जा रहा है...','⏳ Saving...'); saveBtn.disabled=true; }};
  const restoreBtn = () => { if(saveBtn){ saveBtn.innerHTML=origBtnHtml; saveBtn.disabled=false; }};
  showSaving();

  try{
    // ── 1) CRITICAL PATH: auth + single multi-path update only ──
    const updates = {};
    for(const e of entries){
      updates[e.empId+'_'+e.date] = e.newShift;
    }
    const savedEntries = entries.slice();

    const okAuth = await _ensureWriteAuth();
    if(!okAuth){
      restoreBtn();
      toast(L('❌ फ़ोन OTP सत्यापित करें — लॉगआउट ज़रूरी नहीं','❌ Verify phone — logout not required'));
      try{
        const list = document.getElementById('saveBarList');
        if(list){
          let errEl = document.getElementById('saveBarPermErr');
          if(!errEl){ errEl=document.createElement('div'); errEl.id='saveBarPermErr'; list.parentNode.insertBefore(errEl, list); }
          errEl.style.cssText='background:rgba(244,63,94,.18);border:1.5px solid #f43f5e;border-radius:10px;padding:10px 12px;margin-bottom:10px;color:#fecdd3;font-size:12px;font-weight:800;line-height:1.45';
          errEl.innerHTML=L('⛔ लिखने की अनुमति नहीं<br>एक बार <b>फ़ोन OTP</b> सत्यापित करें (ऐप खुला रहेगा)। फिर <b>सहेजें</b> दबाएँ।','⛔ Write auth missing<br>Verify <b>Phone OTP</b> once (app stays open), then press <b>Save</b>.');
        }
      }catch(e){}
      return;
    }

    // One RTDB update for all pending cells (fast)
    await fbUpdate('overrides', updates);

    // Apply to local cache immediately so UI is consistent without waiting for listeners
    try{
      if(!_cache.overrides || typeof _cache.overrides !== 'object') _cache.overrides = {};
      Object.assign(_cache.overrides, updates);
      for(const e of savedEntries){
        try{
          const emp = (_cache.employees||[]).find(x=>x && x.id===e.empId);
          if(emp && Array.isArray(emp.ms) && e.date){
            // optional: leave ms as-is; overrides drive display
          }
        }catch(e2){}
      }
    }catch(e){}

    // Clear pending + UI RIGHT AWAY (before notifications)
    try{ Object.keys(_pendingShiftChanges).forEach(k=>delete _pendingShiftChanges[k]); }catch(e){ _pendingShiftChanges = {}; }
    try{ if(typeof clearSchedUndoHistory==='function') clearSchedUndoHistory(); }catch(e){}
    restoreBtn();
    try{ _updateSaveBar(); }catch(e){}
    try{ renderSchedule(); }catch(e){}
    try{ if(stayOnMyShift || (typeof _currentTab!=='undefined' && _currentTab==='myshift')) renderMyShift(); }catch(e){}
    toast(`✅ ${savedEntries.length} ${L('बदलाव save हुए','changes saved')}`);

    // ── 2) WhatsApp queue from LOCAL data only (no network) — open ASAP ──
    const onlyOwn = savedEntries.every(e=>{
      const myId = SESSION.empObjId || (typeof myEmp==='function' && myEmp() && myEmp().id);
      return myId && e.empId === myId;
    });

    let waQueue = [];
    if(!skipWhatsApp && !onlyOwn){
      try{ if(typeof _loadWaAppLinkSettings==='function') await _loadWaAppLinkSettings(); }catch(e){}
      try{
        waQueue = _buildShiftSaveWaQueue(savedEntries) || [];
      }catch(waBuildErr){ console.warn('[save] wa build', waBuildErr); waQueue = []; }

      if(waQueue.length === 1){
        try{ openWA(waQueue[0].emp.phone, waQueue[0].msgLines); }catch(e){}
        toast(`📲 ${escHtml(waQueue[0].emp.name)} ${L('को WhatsApp भेजा','— WhatsApp sent')}`);
      } else if(waQueue.length > 1){
        toast(`📲 ${waQueue.length} ${L('कर्मचारियों को WhatsApp भेजना है','employees to message on WhatsApp')}`);
        try{ _sendWASequential(waQueue, 0); }catch(e){}
      }
    }

    // ── 3) BACKGROUND: OD cleanup, auto C-Off, in-app notifications (do not block WA) ──
    setTimeout(function(){
      _saveShiftChangesBackground(savedEntries).catch(function(bgErr){
        console.warn('[save] background', bgErr);
      });
    }, 0);

  }catch(err){
    console.error('saveAllShiftChanges error:', err);
    restoreBtn();
    try{ _updateSaveBar(); }catch(e){}
    const msg = (err && (err.message||err.code)) || 'Network error';
    const isPerm = /permission|PERMISSION_DENIED/i.test(String(msg));
    const friendly = isPerm
      ? L('❌ अनुमति नहीं — फ़ोन OTP सत्यापित करें (लॉगआउट नहीं)','❌ Permission Denied — verify Phone OTP (no logout)')
      : (L('❌ सहेजना विफल: ','❌ Save failed: ')+(String(msg).slice(0,120)));
    toast(friendly);
    try{
      const list = document.getElementById('saveBarList');
      if(list){
        const errId = 'saveBarPermErr';
        let errEl = document.getElementById(errId);
        if(!errEl){
          errEl = document.createElement('div');
          errEl.id = errId;
          list.parentNode.insertBefore(errEl, list);
        }
        errEl.style.cssText = 'background:rgba(244,63,94,.18);border:1.5px solid #f43f5e;border-radius:10px;padding:10px 12px;margin-bottom:10px;color:#fecdd3;font-size:12px;font-weight:800;line-height:1.45';
        if(isPerm){
          errEl.innerHTML = '⛔ <b>'+friendlyFbError({message:'PERMISSION_DENIED'})+'</b><br>'+ (typeof L==='function'?L('Firebase में anonymous session है। Logout की ज़रूरत नहीं — Phone verify करें, फिर Save।','Firebase has an anonymous session. No logout needed — verify phone, then Save.'):'Firebase has an anonymous session. No logout needed — verify phone, then Save.') +''
            + '<br><button type="button" onclick="_retrySaveAfterReauth()" style="margin-top:8px;width:100%;padding:10px;border:none;border-radius:8px;background:#f97316;color:#fff;font-weight:900;cursor:pointer">🔐 Phone verify &amp; retry Save</button>';
        } else {
          errEl.innerHTML = '⛔ Save error: '+String(msg).replace(/</g,'&lt;');
        }
      }
    }catch(e2){}
  }
}

/** Build WhatsApp queue purely from local emp/config cache (no awaits). */
function _buildShiftSaveWaQueue(savedEntries){
  const byEmp = {};
  for(const e of savedEntries){
    if(!byEmp[e.empId]) byEmp[e.empId] = [];
    byEmp[e.empId].push(e);
  }
  const waQueue = [];
  const _waCfg = (typeof getShiftConfigSync==='function' ? getShiftConfigSync() : {}) || {};
  if(_waCfg.waNotifyOnSave === false) return waQueue;

  const todayFmt = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const _fmtDate = (d) => new Date(d).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  const _typeOn = (flag) => flag !== false;
  const emps = (typeof getEmps==='function' ? getEmps() : (_cache && _cache.employees) || []) || [];

  for(const [empId, changes] of Object.entries(byEmp)){
    try{
      const emp = emps.find(em => em && em.id === empId);
      if(!emp) continue;
      if(typeof _isSelfEmployee==='function' && _isSelfEmployee(emp)) continue;
      if(emp.id === SESSION.empObjId) continue;

      const phone = (emp.phone||emp.mobile||'').toString().replace(/\D/g,'').slice(-10);
      if(phone.length !== 10) continue;

      const buckets = { GP:[], CO:[], Ab:[], L:[], H:[], OTHER:[] };
      changes.forEach(c=>{
        const ns = String(c.newShift||'').toUpperCase();
        if(ns==='GP') buckets.GP.push(c);
        else if(ns==='C/O' || ns==='CO' || ns==='C-OFF' || ns==='COFF') buckets.CO.push(c);
        else if(ns==='AB' || ns==='ABSENT' || ns==='ABS') buckets.Ab.push(c);
        else if(ns==='L') buckets.L.push(c);
        else if(ns==='H') buckets.H.push(c);
        else buckets.OTHER.push(c);
      });

      const _msgParts = [];
      const pushMsg = (msgLines) => {
        if(!msgLines) return;
        let t = String(msgLines).trim();
        t = t.replace(/\n?📱\s*Check Complete Shift[\s\S]*$/i, '').trim();
        t = t.replace(/\n?📲\s*\*?Android[\s\S]*?(?=\n\n|$)/gi, '').trim();
        t = t.replace(/\n?🍎💻\s*\*?iPhone[\s\S]*?(?=\n\n|$)/gi, '').trim();
        t = t.replace(/\n?https:\/\/(?:play\.google\.com|manpower\.vkstech\.com)[^\s]*/gi, '').trim();
        t = t.replace(/\n{3,}/g, '\n\n').trim();
        if(t) _msgParts.push(t);
      };

      if(buckets.GP.length && _typeOn(_waCfg.waGPEnabled)){
        const datesList = buckets.GP.map(c=>'• '+_fmtDate(c.date)).join('\n');
        const tpl = (typeof getWATemplate==='function')
          ? getWATemplate('waGPTemplate', _waCfg.waGPTemplate, (typeof getEmpPreferredLang==='function'?getEmpPreferredLang(emp):undefined))
          : '';
        const msgLines = (typeof _fillNotifTemplate==='function')
          ? _fillNotifTemplate(tpl, { name: emp.name, date: todayFmt, dates: datesList, manager: SESSION.name||'Manager', changes: datesList })
          : (`🔔 Gate Pass\n${emp.name}\n${datesList}`);
        pushMsg(msgLines);
      }
      if(buckets.CO.length && _typeOn(_waCfg.waCOEnabled !== undefined ? _waCfg.waCOEnabled : (_waCfg.waCOffEnabled !== undefined ? _waCfg.waCOffEnabled : true))){
        const datesList = buckets.CO.map(c=>'• '+_fmtDate(c.date)).join('\n');
        // C-Off date = actual schedule dates marked C/O (not "today")
        const coffDateStr = buckets.CO.map(c=>_fmtDate(c.date)).join(', ');
        // Reason from pending entry if present, else leave record, else default
        let reasonStr = '';
        try{
          const reasons = [];
          buckets.CO.forEach(c=>{
            if(c.reason) reasons.push(String(c.reason));
            else {
              try{
                const leaves = (_cache && _cache.leaves) || {};
                const arr = Array.isArray(leaves) ? leaves : Object.values(leaves||{});
                const hit = arr.find(l=>l && String(l.empId)===String(empId) && (l.leaveType||'').match(/C-Off|Comp|CO/i) && (l.from===c.date || l.coffDate===c.date || l.to===c.date));
                if(hit && hit.reason) reasons.push(String(hit.reason));
              }catch(e2){}
            }
          });
          reasonStr = [...new Set(reasons.filter(Boolean))].join('; ');
        }catch(e){}
        if(!reasonStr) reasonStr = 'Schedule marked C-Off';
        const tpl = (typeof getWATemplate==='function')
          ? getWATemplate('waCOTemplate', _waCfg.waCOTemplate || _waCfg.waCOffTemplate, (typeof getEmpPreferredLang==='function'?getEmpPreferredLang(emp):undefined))
          : '';
        let msgLines = (typeof _fillNotifTemplate==='function')
          ? _fillNotifTemplate(tpl, {
              name: emp.name,
              date: coffDateStr,
              dates: datesList,
              coffDate: coffDateStr,
              reason: reasonStr,
              manager: SESSION.name||'Manager',
              changes: datesList
            })
          : '';
        if(!msgLines || !String(msgLines).trim()){
          msgLines = '🔄 *Man Power — C-Off*\n_'+coffDateStr+'_\n\nनमस्ते *'+emp.name+'*,\n\nआपको *Compensatory Off (C-Off)* दिया गया है।\n\n📅 *C-Off Date:* '+coffDateStr+'\n📝 *कारण:* '+reasonStr+'\n\n_— '+(SESSION.name||'Manager')+'_';
        }
        // Ensure placeholders not left blank if template used unknown keys
        msgLines = String(msgLines).replace(/\{coffDate\}/g, coffDateStr).replace(/\{reason\}/g, reasonStr).replace(/\{dates\}/g, datesList);
        pushMsg(msgLines);
      }
if(buckets.Ab.length && _typeOn(_waCfg.waAbsentEnabled !== undefined ? _waCfg.waAbsentEnabled : (_waCfg.waAbEnabled !== undefined ? _waCfg.waAbEnabled : true))){
        const datesList = buckets.Ab.map(c=>'• '+_fmtDate(c.date)).join('\n');
        const tpl = (typeof getWATemplate==='function')
          ? getWATemplate('waAbsentTemplate', _waCfg.waAbsentTemplate || _waCfg.waAbTemplate, (typeof getEmpPreferredLang==='function'?getEmpPreferredLang(emp):undefined))
          : (_waCfg.waAbsentTemplate || '');
        let msgLines = (typeof _fillNotifTemplate==='function')
          ? _fillNotifTemplate(tpl, { name: emp.name, date: todayFmt, dates: datesList, manager: SESSION.name||'Manager', changes: datesList })
          : '';
        if(!msgLines || !String(msgLines).trim()){
          msgLines = '⚠️ *Man Power — Absent*\n_'+todayFmt+'_\n\n*ध्यान दें '+emp.name+'*,\n\nआप *बिना अनुमति* अनुपस्थित (Absent) चिह्नित किए गए हैं:\n'+datesList+'\n\nतुरंत Manager से संपर्क करें।\n_— '+(SESSION.name||'Manager')+'_';
        }
        pushMsg(msgLines);
      }
      if(buckets.L.length && _typeOn(_waCfg.waLeaveEnabled !== undefined ? _waCfg.waLeaveEnabled : true)){
        const datesList = buckets.L.map(c=>'• '+_fmtDate(c.date)).join('\n');
        const tpl = (typeof getWATemplate==='function')
          ? getWATemplate('waLeaveTemplate', _waCfg.waLeaveTemplate, (typeof getEmpPreferredLang==='function'?getEmpPreferredLang(emp):undefined))
          : '';
        const msgLines = (typeof _fillNotifTemplate==='function')
          ? _fillNotifTemplate(tpl, { name: emp.name, date: todayFmt, dates: datesList, manager: SESSION.name||'Manager', changes: datesList })
          : (`🔔 Leave\n${emp.name}\n${datesList}`);
        pushMsg(msgLines);
      }
      if(buckets.H.length && _typeOn(_waCfg.waHolidayEnabled)){
        const datesList = buckets.H.map(c=>'• '+_fmtDate(c.date)).join('\n');
        const tpl = (typeof getWATemplate==='function')
          ? getWATemplate('waHolidayTemplate', _waCfg.waHolidayTemplate, (typeof getEmpPreferredLang==='function'?getEmpPreferredLang(emp):undefined))
          : '';
        const msgLines = (typeof _fillNotifTemplate==='function')
          ? _fillNotifTemplate(tpl, { name: emp.name, date: todayFmt, dates: datesList, manager: SESSION.name||'Manager', changes: datesList })
          : (`🔔 Holiday\n${emp.name}\n${datesList}`);
        pushMsg(msgLines);
      }
      if(buckets.OTHER.length && _typeOn(_waCfg.waShiftEnabled)){
        const shiftNames = (typeof getShiftDisplayNames==='function'?getShiftDisplayNames():{}) || {};
        let changeLines = '';
        for(const c of buckets.OTHER){
          const fmtD = _fmtDate(c.date);
          const oldS = c.currentShift || c.oldShift || '—';
          const newS = c.newShift || '—';
          changeLines += `• ${fmtD}: ${shiftNames[oldS]||oldS} → *${shiftNames[newS]||newS}*\n`;
        }
        const tpl = ((typeof getWATemplate==='function')
          ? getWATemplate('waShiftTemplate', _waCfg.waShiftTemplate, (typeof getEmpPreferredLang==='function'?getEmpPreferredLang(emp):undefined))
          : '') || '';
        const msgLines = tpl
          ? tpl.replace(/\{name\}/g, emp.name||'').replace(/\{manager\}/g, SESSION.name||'Manager').replace(/\{date\}/g, todayFmt).replace(/\{changes\}/g, changeLines.trim())
          : (`🔔 *Shift Update*\n\n${emp.name}\n${changeLines}`);
        pushMsg(msgLines);
      }

      if(_msgParts.length){
        let combined = _msgParts.join('\n\n————————\n\n');
        if(typeof _appendWaAppLink==='function') combined = _appendWaAppLink(combined);
        waQueue.push({ emp: Object.assign({}, emp, { phone: phone }), msgLines: combined, changes: changes });
      }
    }catch(ne){ console.warn('wa queue emp', ne); }
  }
  return waQueue;
}

/** Non-blocking post-save work (OD cleanup, auto C-Off, in-app notifs). */
async function _saveShiftChangesBackground(savedEntries){
  // OD cleanup in parallel
  try{
    const odJobs = [];
    for(const e of savedEntries){
      const wasOD = String(e.currentShift||'').toUpperCase() === 'OD';
      const nowOD = String(e.newShift||'').toUpperCase() === 'OD';
      if(wasOD && !nowOD && typeof _removeODRecordsForEmpDate==='function'){
        odJobs.push(_removeODRecordsForEmpDate(e.empId, e.date));
      }
    }
    if(odJobs.length) await Promise.all(odJobs.map(p=>p.catch(err=>{ console.warn('[od]', err); })));
  }catch(odErr){ console.warn('[save] OD cleanup', odErr); }

  try{ if(typeof _processAutoCompOffRules==='function') await _processAutoCompOffRules(savedEntries); }catch(e){ console.warn(e); }
  try{ if(typeof _loadWaAppLinkSettings==='function') await _loadWaAppLinkSettings(); }catch(e){}

  // In-app notifications — parallel pushes
  try{
    const byEmp = {};
    for(const e of savedEntries){
      if(!byEmp[e.empId]) byEmp[e.empId] = [];
      byEmp[e.empId].push(e);
    }
    const shiftNames = {D:'Day Shift',N:'Night Shift',A:'A Shift',B:'B Shift',C:'C Shift',O:'Weekly Off',L:'Leave',G:'General Shift','C/O':'Comp Off',HLF:'Half Day',Ab:'Absent',H:'Holiday',OD:'Other Dept',GP:'Gate Pass'};
    const emps = (typeof getEmps==='function' ? getEmps() : []) || [];
    const pushes = [];
    let inAppCount = 0;
    for(const [empId, changes] of Object.entries(byEmp)){
      const emp = emps.find(em => em && em.id === empId);
      if(!emp) continue;
      if(emp.id === SESSION.empObjId) continue;
      const changeLines = changes.map(c=>{
        const fmtD = new Date(c.date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
        const oldS = c.currentShift || c.oldShift || '—';
        const newS = c.newShift || '—';
        return `${fmtD}: ${shiftNames[oldS]||oldS} → ${shiftNames[newS]||newS}`;
      }).join(' · ');
      const first = changes[0];
      const payload = {
        type: 'shift_change',
        title: L('📋 Shift बदली गई','📋 Shift changed'),
        body: changeLines || L('आपकी shift update हुई','Your shift was updated'),
        date: first.date,
        oldShift: first.currentShift || first.oldShift || '',
        newShift: first.newShift || '',
        changes: changes.map(c=>({
          date: c.date,
          oldShift: c.currentShift||c.oldShift||'',
          newShift: c.newShift
        })),
        changedBy: SESSION.name || 'Manager',
        read: false,
        at: new Date().toISOString()
      };
      pushes.push(
        fbPush('userNotifications/'+emp.id, payload).then(()=>{ inAppCount++; }).catch(()=>{})
      );
      const mob = (typeof _normMobileKey==='function')
        ? _normMobileKey(emp.phone||emp.mobile||'')
        : String(emp.phone||emp.mobile||'').replace(/\D/g,'').slice(-10);
      if(mob && mob !== emp.id){
        pushes.push(fbPush('userNotifications/'+mob, payload).catch(()=>{}));
      }
    }
    if(pushes.length) await Promise.all(pushes);
    if(inAppCount){
      try{ toast(`🔔 ${inAppCount} ${L('सदस्य को app notification भेजी','members notified in app')}`); }catch(e){}
    }
  }catch(ne){ console.warn('[in-app notif bg]', ne); }
}


// ── Sequential WhatsApp sender ──
// Browser popup blocker prevents window.open() from setTimeout/async context.
// Solution: show a modal for each employee with a direct "Send" button.
// Each tap IS a user gesture → window.open() always works.
function _sendWASequential(queue, index){
  if(index >= queue.length) return; // All done

  const { emp, msgLines } = queue[index];
  const current = index + 1;
  const total = queue.length;
  const remaining = total - current;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = '_waSeqOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)';

  const ini = emp.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

  overlay.innerHTML = `
    <div style="background:var(--bg2);border-radius:20px 20px 0 0;padding:24px 20px 40px;width:100%;max-width:480px;border-top:1px solid var(--border2);animation:slideUp .25s cubic-bezier(.32,0,.15,1)">
      <div style="width:32px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 18px"></div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#25D366,#128C7E);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;color:#fff;font-family:'Barlow Condensed',sans-serif;flex-shrink:0">${ini}</div>
        <div>
          <div style="font-size:17px;font-weight:900;color:var(--text)">${escHtml(emp.name)}</div>
          <div style="font-size:12px;color:var(--muted2)">📱 +91 ${escHtml(emp.phone)}</div>
        </div>
        <div style="margin-left:auto;background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.3);border-radius:20px;padding:3px 12px;font-size:12px;font-weight:800;color:#25D366">${current} / ${total}</div>
      </div>

      <div style="background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.2);border-radius:12px;padding:12px;margin:14px 0;font-size:12px;color:var(--muted2);line-height:1.6;max-height:100px;overflow:hidden;text-overflow:ellipsis;white-space:pre-wrap">${msgLines.substring(0,180)}${msgLines.length>180?'...':''}</div>

      <button id="_waSendBtn"
        style="width:100%;padding:16px;border-radius:13px;border:none;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;font-size:17px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 20px rgba(37,211,102,.3)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        ${typeof L==='function'?L('WhatsApp भेजें','Send WhatsApp'):'Send WhatsApp'} — ${escHtml(emp.name.split(' ')[0])}
      </button>

      <button id="_waSkipBtn"
        style="width:100%;padding:13px;border-radius:12px;border:1px solid var(--border2);background:var(--card);color:var(--muted2);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
        ${remaining > 0 ? ((typeof L==='function'?L('⏭️ Skip — अगला','⏭️ Skip — next'):'⏭️ Skip — next')+' ('+remaining+')') : (typeof L==='function'?L('✅ बंद करें','✅ Done'):'✅ Done')}
      </button>
    </div>`;

  document.body.appendChild(overlay);

  const cleanup = () => {
    try{ document.body.removeChild(overlay); }catch(e){}
  };

  document.getElementById('_waSendBtn').addEventListener('click', () => {
    openWA(emp.phone, (typeof _appendWaAppLink==='function'?_appendWaAppLink(msgLines):msgLines)); // gesture
    cleanup();
    if(index + 1 < queue.length){
      setTimeout(() => _sendWASequential(queue, index + 1), 400);
    }
  });

  document.getElementById('_waSkipBtn').addEventListener('click', () => {
    cleanup();
    if(index + 1 < queue.length){
      setTimeout(() => _sendWASequential(queue, index + 1), 200);
    }
  });
}

function handleShiftBtnClick(empId, empName, date, currentShift, shiftVal){
  if(shiftVal === 'C/O'){
    closeModal();
    openCompOffDetails(empId, empName, date, currentShift);
  } else if(shiftVal === 'OD'){
    closeModal();
    openODDetails(empId, empName, date, currentShift);
  } else if(shiftVal === 'L'){
    // Require reason before staging leave
    openLeaveReasonModal(empId, empName, date, currentShift);
  } else {
    stageSingleShiftChange(empId, empName, date, currentShift, shiftVal);
  }
}

function _leaveTypeLabel(code){
  const map={CL:'Casual Leave (CL)',SL:'Sick Leave (SL)',EL:'Earned Leave (EL)',CO:'Comp Off (CO)',ML:'Maternity (ML)',other:'Other',OTHER:'Other'};
  const c=String(code||'');
  return map[c] || map[c.toUpperCase()] || c.replace(/_/g,' ');
}
/** Leave chips = manager quota types with days > 0 (custom types included). */
function _typesFromLeaveQuota(q){
  const skip = new Set(['updatedAt','updatedBy','yearStart','yearEnd','custom']);
  if(!q || typeof q!=='object'){
    // Match _defaultLeaveQuotas: CL12 SL6 EL15 CO0 other5 → hide CO
    return [
      {code:'CL', label:_leaveTypeLabel('CL')},
      {code:'SL', label:_leaveTypeLabel('SL')},
      {code:'EL', label:_leaveTypeLabel('EL')},
      {code:'other', label:_leaveTypeLabel('other')}
    ];
  }
  let codes = Object.keys(q).filter(x=>!skip.has(x) && (typeof q[x]==='number' || !isNaN(Number(q[x]))));
  // custom array: [{name,days,key}]
  try{
    if(Array.isArray(q.custom)){
      q.custom.forEach(ct=>{
        const k = (ct && (ct.key||ct.code||ct.name)) ? String(ct.key||ct.code||ct.name).replace(/\s+/g,'_') : '';
        if(k && !codes.includes(k)) codes.push(k);
      });
    }
  }catch(e){}
  const positive = codes.filter(c=>Number(q[c])>0);
  const use = positive.length ? positive : codes.filter(c=>['CL','SL','EL','other'].includes(c));
  return use.map(c=>({code:c, label:_leaveTypeLabel(c)}));
}
async function _loadManagerLeaveQuota(){
  const keys = [];
  try{ if(typeof myShiftConfigKey==='function' && myShiftConfigKey()) keys.push('leaveQuotas/'+myShiftConfigKey()); }catch(e){}
  try{
    const mob = (typeof _normMobileKey==='function'?_normMobileKey(SESSION&&SESSION.mobile||''):'');
    if(mob){
      keys.push('leaveQuotas/mgr:'+mob);
      keys.push('leaveQuotas/'+mob);
    }
  }catch(e){}
  try{
    const mid = SESSION&&SESSION.managerId;
    if(mid){
      const m = (typeof _normMobileKey==='function'?_normMobileKey(mid):String(mid));
      keys.push('leaveQuotas/mgr:'+m);
      keys.push('leaveQuotas/'+m);
    }
  }catch(e){}
  keys.push('leaveQuotas/default');
  // Prefer memory cache
  try{
    if(window._leaveQuotaLast && typeof window._leaveQuotaLast==='object') return window._leaveQuotaLast;
  }catch(e){}
  for(const k of keys){
    try{
      const r = await fbGet(k);
      if(r && typeof r==='object' && Object.keys(r).length){
        try{
          window._leaveQuotaLast = r;
          window._leaveQuotaCache = window._leaveQuotaCache || {};
          window._leaveQuotaCache[k.replace(/^leaveQuotas\//,'')] = r;
        }catch(e){}
        return r;
      }
    }catch(e){}
  }
  return null;
}

async function openLeaveReasonModal(empId, empName, date, currentShift){
  const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  let typeOpts = _typesFromLeaveQuota(null);
  try{
    const q = await _loadManagerLeaveQuota();
    typeOpts = _typesFromLeaveQuota(q);
  }catch(e){}
  const QUICK_REASONS = typeOpts; // used below as objects

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🌴 ${(typeof L==='function'?L('छुट्टी का कारण','Leave reason'):'Leave reason')}</div>
    <div style="text-align:center;padding:4px 0 12px">
      <div style="font-size:16px;font-weight:900;color:#fff">${empName}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:2px">${fmtD} — Leave (L)</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px" id="lrChips">
      ${QUICK_REASONS.map(r=>{
        const code = (r&&r.code)||r;
        const label = (r&&r.label)||r;
        return `<button type="button"
        onclick="selectLRChip(this,'${String(label).replace(/'/g,"\'")}','${String(code).replace(/'/g,"\'")}')"
        style="padding:7px 12px;border-radius:20px;border:1.5px solid var(--border2);
        background:var(--card);color:var(--muted2);font-size:12px;font-weight:700;
        cursor:pointer;font-family:inherit;white-space:nowrap">${label}</button>`;
      }).join('')}
    </div>
    <input type="hidden" id="lrTypeCode" value="CL">
    <div class="field" style="margin-bottom:4px">
      <label style="color:var(--lv)">${typeof L==='function'?L('Leave Type / कारण * (अनिवार्य)','Leave type / reason * (required)'):'Leave type / reason * (required)'}</label>
      <textarea id="lrReasonText" rows="2"
        style="border-color:rgba(244,63,94,.3);width:100%;padding:10px;background:var(--card);
        border:2px solid rgba(244,63,94,.3);border-radius:10px;color:var(--text);font-size:14px;
        font-family:inherit;resize:none;outline:none"
        placeholder="${typeof L==='function'?L('Leave का कारण लिखें...','Write leave reason...'):'Write leave reason...'}"
        oninput="this.style.borderColor=this.value.trim()?'var(--border2)':'rgba(244,63,94,.3)'"></textarea>
    </div>
    <div class="field" style="margin-bottom:4px">
      <label style="color:var(--muted2);font-size:12px">📎 Document / Photo (Optional)</label>
      <div id="lrImgPreview" style="margin-bottom:6px"></div>
      <div style="display:flex;gap:6px">
        <button type="button" onclick="document.getElementById('lrCamInput').click()"
          style="flex:1;padding:10px;border:1.5px dashed var(--border2);border-radius:10px;
          background:transparent;color:var(--muted2);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          📸 Camera
        </button>
        <button type="button" onclick="document.getElementById('lrFileInput').click()"
          style="flex:1;padding:10px;border:1.5px dashed var(--border2);border-radius:10px;
          background:transparent;color:var(--muted2);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          🖼️ Gallery/File
        </button>
      </div>
      <input type="file" id="lrCamInput" accept="image/*" capture="environment" style="display:none" onchange="previewLeaveImg(this,'lrImgPreview')">
      <input type="file" id="lrFileInput" accept="image/*,.pdf" style="display:none" onchange="previewLeaveImg(this,'lrImgPreview')">
    </div>
    <button class="submit-btn" style="margin-top:10px"
      onclick="confirmLeaveWithReason('${empId}','${empName}','${date}','${currentShift}')">
      ${typeof L==='function'?L('✅ Leave Mark करें','✅ Mark Leave'):'✅ Mark Leave'}
    </button>
    <button class="cancel-btn" onclick="editShiftCell('${empId}','${empName}','${date}','${currentShift}')">← ${typeof L==='function'?L('वापस','Back'):'Back'}</button>`);
}

function selectLRChip(btn, reason, typeCode){
  document.querySelectorAll('#lrChips button').forEach(b=>{
    b.style.background='var(--card)'; b.style.color='var(--muted2)'; b.style.borderColor='var(--border2)';
  });
  btn.style.background='rgba(244,63,94,.12)'; btn.style.color='var(--lv)'; btn.style.borderColor='var(--lv)';
  const ta=document.getElementById('lrReasonText');
  if(ta){ ta.value=reason; ta.style.borderColor='var(--border2)'; }
  const tc=document.getElementById('lrTypeCode');
  if(tc) tc.value = typeCode || 'CL';
}

let _leaveImgBase64=null;
function previewLeaveImg(input, previewId){
  if(!input.files||!input.files[0]) return;
  const file=input.files[0];
  const targetId=previewId||'lrImgPreview';
  const reader=new FileReader();
  reader.onload=function(e){
    if(file.type.startsWith('image/')){
      const img=new Image();
      img.onload=function(){
        const canvas=document.createElement('canvas');
        const maxW=800;
        let w=img.width,h=img.height;
        if(w>maxW){h=h*(maxW/w);w=maxW}
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        _leaveImgBase64=canvas.toDataURL('image/jpeg',0.7);
        const prev=document.getElementById(targetId);
        if(prev) prev.innerHTML=`<div style="position:relative;display:inline-block;margin-top:6px">
          <img src="${_leaveImgBase64}" style="max-width:100%;max-height:150px;border-radius:8px;border:1px solid var(--border2)">
          <button onclick="_leaveImgBase64=null;this.parentElement.remove()" style="position:absolute;top:-6px;right:-6px;background:#ef4444;border:none;color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;font-weight:700">✕</button>
        </div>`;
      };
      img.src=e.target.result;
    }else{
      _leaveImgBase64=e.target.result;
      const prev=document.getElementById(targetId);
      if(prev) prev.innerHTML=`<div style="margin-top:6px;padding:8px;background:var(--card);border:1px solid var(--border2);border-radius:8px;font-size:11px;color:var(--text)">
        📄 ${escHtml(file.name)} <button onclick="_leaveImgBase64=null;this.parentElement.remove()" style="background:#ef4444;border:none;color:#fff;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:10px;margin-left:8px">✕</button>
      </div>`;
    }
  };
  reader.readAsDataURL(file);
}

async function confirmLeaveWithReason(empId, empName, date, currentShift){
  const reason=(document.getElementById('lrReasonText')||{}).value?.trim();
  if(!reason){
    const ta=document.getElementById('lrReasonText');
    if(ta){ ta.style.borderColor='var(--lv)'; ta.focus(); }
    toast(L('⚠️ कारण / Leave Type अनिवार्य है','⚠️ Reason / leave type is required')); return;
  }
  let typeCode = (document.getElementById('lrTypeCode')?.value||'').trim().toUpperCase();
  if(!typeCode){
    const t = reason.toLowerCase();
    if(/sick|\bsl\b/.test(t)) typeCode='SL';
    else if(/earned|\bel\b|privilege/.test(t)) typeCode='EL';
    else if(/matern|\bml\b/.test(t)) typeCode='ML';
    else if(/comp|c-?off|\bco\b/.test(t)) typeCode='CO';
    else if(/casual|\bcl\b/.test(t)) typeCode='CL';
    else typeCode='CL';
  }
  // Manager marks leave → APPROVED immediately (no pending approval notification)
  const _bulkDates = (window._myShiftPendingLeaveDates && window._myShiftPendingLeaveDates.length)
    ? window._myShiftPendingLeaveDates.slice().sort() : [date];
  const leaveData={
    empId, empName,
    section: (getEmps().find(e=>e.id===empId)||{}).sec||'',
    from:_bulkDates[0], to:_bulkDates[_bulkDates.length-1], days:_bulkDates.length,
    leaveType: reason,
    type: typeCode,
    status:'approved',
    appliedAt:new Date().toISOString(),
    approvedAt:new Date().toISOString(),
    markedBy: SESSION.name||'Admin',
    approvedBy: SESSION.name||'Admin',
    reallocations:[]
  };
  if(_leaveImgBase64) leaveData.attachment=_leaveImgBase64;
  try{ await fbPush('leaves',leaveData); }catch(e){ console.warn('leave push',e); }
  _leaveImgBase64=null;

  // Write L to ALL selected dates (bulk multi-select support)
  const shiftVal = 'L';
  const allDates = (window._myShiftPendingLeaveDates && window._myShiftPendingLeaveDates.length)
    ? window._myShiftPendingLeaveDates.slice()
    : [date];
  window._myShiftPendingLeaveDates = null;
  const ovPayload = {};
  try{
    const empObj = (getEmps()||[]).find(e=>e.id===empId);
    allDates.forEach(d=>{
      ovPayload[empId+'_'+d] = shiftVal;
      if(empObj && empObj.empId && String(empObj.empId)!==String(empId))
        ovPayload[empObj.empId+'_'+d] = shiftVal;
    });
  }catch(e){
    allDates.forEach(d=>{ ovPayload[empId+'_'+d] = shiftVal; });
  }
  try{
    await fbUpdate('overrides', ovPayload);
    _cache.overrides = {...(getOverrides()||{}), ...ovPayload};
  }catch(e){
    for(const d of allDates){
      try{ stageSingleShiftChange(empId, empName, d, currentShift, shiftVal, { leaveType: typeCode, reason }); }catch(e2){}
    }
  }
  // Extra leave records for other days (first day already pushed above)
  for(const d of allDates){
    if(d === date) continue;
    try{
      await fbPush('leaves', Object.assign({}, leaveData, { from:d, to:d }));
    }catch(e){}
  }
  closeModal();
  try{ window._myShiftPendingLeaveDates = null; }catch(e){}
  try{ if(window._myShiftMultiSel) window._myShiftMultiSel.clear(); }catch(e){}
  try{ document.querySelectorAll('.ms-day.selected,.ms-day.ms-selected,td.cell-selected').forEach(function(el){ el.classList.remove('selected','ms-selected','cell-selected'); }); }catch(e){}
  try{ var bar=document.getElementById('myShiftBulkBar')||document.getElementById('multiSelectBar'); if(bar) bar.style.display='none'; }catch(e){}
  /*_bulkLeaveCleared314*/

  try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
  try{ if(typeof renderMyShift==='function') renderMyShift(); }catch(e){}

  // WhatsApp leave message — manager Profile template + app link
  try{
    const emp = (getEmps()||[]).find(e=>e.id===empId) || {};
    const phone = (emp.phone||emp.mobile||'').toString().replace(/\D/g,'').slice(-10);
    if(phone && phone.length===10){
      try{ if(typeof _loadWaAppLinkSettings==='function') await _loadWaAppLinkSettings(); }catch(e){}
      const cfg = (typeof getShiftConfigSync==='function' ? getShiftConfigSync() : null) || {};
      const memLang = (typeof getEmpPreferredLang==='function' ? getEmpPreferredLang(emp) : undefined);
      let tpl = (typeof getWATemplate==='function')
        ? getWATemplate('waLeaveTemplate', cfg.waLeaveTemplate, memLang)
        : (cfg.waLeaveTemplate || '');
      if(!tpl || !String(tpl).trim()){
        const def = (typeof _defaultShiftConfig==='function' ? _defaultShiftConfig() : {});
        tpl = def.waLeaveTemplate || '🏖️ *Man Power — Leave*\n_{date}_\n\nनमस्ते *{name}*,\n\nआपकी *Leave* mark की गई है:\n{dates}\n\n_— {manager}_';
      }
      const fmtD = (()=>{ try{ return new Date(date+'T12:00:00').toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return date; }})();
      const datesLine = fmtD + (reason ? (' · ' + reason) : (typeCode ? (' · ' + typeCode) : ''));
      let msg = (typeof _fillNotifTemplate==='function')
        ? _fillNotifTemplate(tpl, { name: empName||emp.name||'', date: fmtD, dates: datesLine, manager: SESSION.name||'Manager', changes: datesLine })
        : String(tpl).replace(/\{name\}/g, empName||'').replace(/\{date\}/g, fmtD).replace(/\{dates\}/g, datesLine).replace(/\{manager\}/g, SESSION.name||'Manager');
      if(typeof _appendWaAppLink==='function') msg = _appendWaAppLink(msg);
      if(typeof openWA==='function') openWA(phone, msg);
      else window.open('https://wa.me/91'+phone+'?text='+encodeURIComponent(msg), '_blank');
      toast('✅ Leave marked · WhatsApp');
    } else {
      toast('✅ Leave marked (no mobile for WhatsApp)');
    }
  }catch(e){ console.warn('[leave WA]', e); toast('✅ Leave marked'); }
}


function editShiftCell(empId, empName, date, currentShift){
  const isOwn = (SESSION.empObjId && empId===SESSION.empObjId) || (myEmp() && myEmp().id===empId);
  if(!canEditSchedule() && !isOwn){ return; }
  // Own shift change still queues like schedule edit if they have rights; members can request via pending
  if(!canEditSchedule() && isOwn){
    // Allow open picker; save uses same pending path if canEdit OR request-to-manager
  }

  const _cfg = getShiftConfigSync();
  const _fixedShiftStyle = {};
  Object.keys(window.MP_SHIFT_COLORS||{}).forEach(k=>{
    const c = MP_SHIFT_COLORS[k];
    _fixedShiftStyle[k] = {bg:c.bg, color:c.fg};
  });
  // Offer only active work shifts (D/N/A/B/C); hide if inactive or profile hide flags
  const _cfgByCode = {};
  (_cfg.shifts||[]).forEach(s=>{ if(s&&s.code) _cfgByCode[String(s.code).toUpperCase()]=s; });
  const _stdCodes = ['D','N','G','A','B','C'].filter(code=>{
    const s = _cfgByCode[code];
    // Profile "Hide D&N" / "Hide A/B/C" controls picker visibility
    // ticked shifts only — inactive already filtered above
    // Explicit inactive in shift timing list
    if(s && s.active === false) return false;
    // If code exists in config as active, or no entry (show all non-hidden)
    return true;
  });
  const _isShiftActive = (code)=>{
    const s = _cfgByCode[code];
    return !s || s.active !== false;
  };
  const _dblAll = [
    {v:'D+N', label:'Double: Day + Night', bg:'#7c3aed', color:'#fff', need:['D','N']},
    {v:'A+B', label:'Double: A + B', bg:'#7c3aed', color:'#fff', need:['A','B']},
    {v:'A+C', label:'Double: A + C', bg:'#7c3aed', color:'#fff', need:['A','C']},
    {v:'B+C', label:'Double: B + C', bg:'#7c3aed', color:'#fff', need:['B','C']},
    {v:'D+A', label:'Double: D + A', bg:'#7c3aed', color:'#fff', need:['D','A']},
    {v:'N+B', label:'Double: N + B', bg:'#7c3aed', color:'#fff', need:['N','B']},
  ].filter(d => d.need.every(c => _stdCodes.includes(c)));
  const SHIFT_OPTIONS = [
    ..._stdCodes.map(code=>{
      const s=_cfgByCode[code]||{code,label:code};
      const st=_fixedShiftStyle[code]||{bg:'#334155',color:'#fff'};
      // Always show times for work shifts (D/N/G/A/B/C); G defaults 08:00–20:00 if manager not set
      const _defTimes={D:['07:00','19:00'],N:['19:00','07:00'],G:['08:00','20:00'],A:['06:00','14:00'],B:['14:00','22:00'],C:['22:00','06:00']};
      let stt=s.start, enn=s.end;
      if((!stt||!enn) && _defTimes[code]){ stt=_defTimes[code][0]; enn=_defTimes[code][1]; }
      const time=(stt&&enn)?` (${stt}–${enn})`:'';
      let lab = (s.label && String(s.label).trim()) ? s.label : (code==='G' ? 'General Shift' : code);
      if(code==='G' && (!s.label || String(s.label).trim()==='G')) lab = 'General Shift';
      return {v:code, label:lab+time, bg:st.bg, color:st.color};
    }),
    ..._dblAll.map(({v,label,bg,color})=>({v,label,bg,color})),
    ...[
      {v:'O',   label:'Weekly Off',       bg:'#64748b', color:'#ffffff'},
      {v:'L',   label:'Leave (pick type)', bg:'#fb7185', color:'#ffffff'},
      {v:'G',   label:'General Shift',    bg:'#2563eb', color:'#ffffff'},
      {v:'C/O', label:'Comp Off',         bg:'#a16207', color:'#ffffff'},
      {v:'H',   label:'Holiday',          bg:'#f97316', color:'#ffffff'},
      {v:'OD',  label:'Other Dept/Door',  bg:'#0d9488', color:'#ffffff'},
      {v:'GP',  label:'Gate Pass',        bg:'#9333ea', color:'#ffffff'},
      {v:'HLF', label:'Half Day',         bg:'#f97316', color:'#ffffff'},
      {v:'Ab',  label:'Absent',           bg:'#b91c1c', color:'#ffffff'},
    ].filter(opt=>{
      const s = _cfgByCode[String(opt.v).toUpperCase()] || _cfgByCode[opt.v] || _cfgByCode[String(opt.v).toLowerCase()];
      if(s && s.active === false) return false;
      if(_stdCodes.includes(opt.v)) return false;
      const base = (s && s.label) ? s.label : opt.label;
      let stt = s && s.start, enn = s && s.end;
      if(opt.v==='G' && (!stt||!enn)){ stt='08:00'; enn='20:00'; }
      const time = (stt&&enn) ? (' ('+stt+'–'+enn+')') : '';
      opt.label = base + time;
      return true;
    })
  ];

  const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  const pendingKey = empId+'__'+date;
  const alreadyPending = _pendingShiftChanges[pendingKey];
  const effectiveCurrent = alreadyPending ? alreadyPending.newShift : currentShift;

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">✏️ ${typeof L==='function'?L('Shift चुनें','Select shift'):'Select shift'}</div>
    <div style="text-align:center;padding:6px 0 14px">
      <div style="font-size:17px;font-weight:900;color:#fff">${empName}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:2px">${fmtD}</div>
      <div style="margin-top:6px;font-size:12px;color:var(--muted2)">
        ${typeof L==='function'?L('वर्तमान','Current'):'Current'}: <span class="shc ${cellClass(currentShift)}" style="display:inline-flex;vertical-align:middle">${cellDisp(currentShift)}</span>
        ${alreadyPending?`<span style="color:var(--day);margin-left:8px">⚡ pending: ${cellDisp(alreadyPending.newShift)}</span>`:''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${SHIFT_OPTIONS.map(s=>`
        <button onclick="handleShiftBtnClick('${empId}','${empName}','${date}','${currentShift}','${s.v}')"
          style="padding:12px 8px;border:2px solid ${s.v===effectiveCurrent?s.bg:'var(--border2)'};
          border-radius:10px;background:${s.v===effectiveCurrent?s.bg+'22':'var(--card)'};
          color:var(--text);cursor:pointer;font-weight:700;font-size:13px;
          display:flex;align-items:center;gap:8px;position:relative">
          <span style="display:inline-flex;width:28px;height:24px;background:${s.bg};color:${s.color};
            border-radius:5px;align-items:center;justify-content:center;font-weight:900;font-size:12px">
            ${s.v==='C/O'?'CO':s.v==='HLF'?'½':s.v}
          </span>
          <span style="font-size:12px;text-align:left;line-height:1.3">${escHtml(s.label)}</span>
          ${''}
        </button>`).join('')}
    </div>
    <button onclick="resetShiftOverride('${empId}','${date}')"
      style="width:100%;padding:11px;background:none;border:1px solid var(--border2);
      border-radius:10px;color:var(--muted);font-size:12px;cursor:pointer;margin:12px 0 4px">
      ${typeof L==='function'?L('🔄 Original पर Reset करें','🔄 Reset to original'):'🔄 Reset to original'}
    </button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

// ── India Public Holidays (Man Power relevant) ──
const MET_HOLIDAYS = {
  // ── 2026 Gazetted + Flexible Packaging Industry Holidays ──
  '2026-01-01': 'New Year\'s Day',
  '2026-01-14': 'Makar Sankranti',
  '2026-01-26': 'Republic Day',
  '2026-02-15': 'Mahashivratri',
  '2026-03-03': 'Holika Dahan',
  '2026-03-04': 'Holi',
  '2026-04-02': 'Ram Navami',
  '2026-04-10': 'Mahavir Jayanti',
  '2026-04-14': 'Dr. Ambedkar Jayanti',
  '2026-04-17': 'Good Friday',
  '2026-04-19': 'Easter Sunday',
  '2026-05-01': 'Labour Day / May Day',
  '2026-05-24': 'Buddha Purnima',
  '2026-06-06': 'Eid ul-Fitr',
  '2026-07-16': 'Eid ul-Adha',
  '2026-08-09': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-08-27': 'Janmashtami',
  '2026-09-07': 'Milad-un-Nabi',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-20': 'Navratri Begins',
  '2026-10-22': 'Dussehra',
  '2026-11-04': 'Diwali (Lakshmi Puja)',
  '2026-11-05': 'Diwali (Govardhan Puja)',
  '2026-11-06': 'Bhai Dooj',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas Day',
  // ── 2025 holidays (for past C-Off claims) ──
  '2025-01-14': 'Makar Sankranti',
  '2025-01-26': 'Republic Day',
  '2025-02-26': 'Mahashivratri',
  '2025-03-13': 'Holika Dahan',
  '2025-03-14': 'Holi',
  '2025-03-31': 'Eid ul-Fitr',
  '2025-04-10': 'Ram Navami',
  '2025-04-14': 'Dr. Ambedkar Jayanti / Baisakhi',
  '2025-04-18': 'Good Friday',
  '2025-05-01': 'Labour Day / May Day',
  '2025-05-12': 'Buddha Purnima',
  '2025-06-07': 'Eid ul-Adha',
  '2025-08-15': 'Independence Day',
  '2025-08-16': 'Janmashtami',
  '2025-10-02': 'Gandhi Jayanti',
  '2025-10-02': 'Dussehra',
  '2025-10-20': 'Diwali',
  '2025-10-21': 'Govardhan Puja',
  '2025-10-22': 'Bhai Dooj',
  '2025-11-05': 'Guru Nanak Jayanti',
  '2025-12-25': 'Christmas Day',
};

// ── Comp Off Details Modal ──
function openCompOffDetails(empId, empName, coDate, currentShift){
  closeModal();
  const emp = getEmps().find(e=>e.id===empId);
  const woff = emp?.woff||'SUN';
  
  // Build last 31 days: show only W-OFF/Holiday dates where emp actually worked (D or N shift)
  const today = new Date();
  const dateOpts = [];
  for(let i=1;i<=31;i++){
    const d = new Date(today);
    d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
    const isWoff = dayName===woff;
    const isHoli = !!MET_HOLIDAYS[ds];
    // Only show if it was a W-off or holiday AND employee actually came to duty (D or N)
    if(isWoff || isHoli){
      const actualShift = getShift(emp, ds);
      if(['D','N','G'].includes(actualShift)){
        dateOpts.push({
          ds, 
          label: d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})+' ('+dayName+')',
          isHoli,
          isWoff,
          holiName: MET_HOLIDAYS[ds]||null,
          shift: actualShift
        });
      }
    }
  }
  
  const coDateFmt = new Date(coDate).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  
  const modalDiv = document.createElement('div');
  modalDiv.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:flex-end;justify-content:center;padding:0';
  modalDiv.id='compOffModal';
  modalDiv.innerHTML=`
    <div style="background:#1e293b;border:1px solid #334155;border-radius:20px 20px 0 0;padding:20px 18px 30px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
      <div style="width:36px;height:4px;background:#334155;border-radius:2px;margin:0 auto 18px"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
        <div style="width:42px;height:42px;background:#713f12;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fde68a;flex-shrink:0">CO</div>
        <div>
          <div style="font-size:18px;font-weight:900;color:#fff">Comp Off Details</div>
          <div style="font-size:14px;color:#94a3b8;font-weight:600">${empName} · ${coDateFmt}</div>
        </div>
      </div>

      <div style="font-size:14px;font-weight:800;color:#e2e8f0;letter-spacing:.5px;margin-bottom:8px">${typeof L==='function'?L('किस दिन काम किया था?','Which day did they work?'):'Which day did they work?'} * <span style="font-weight:600;color:#f97316">${typeof L==='function'?L('(31 दिन की सीमा)','(within 31 days)'):'(within 31 days)'}</span></div>
      <div id="coWorkedDateSel" style="margin-bottom:14px">
        ${dateOpts.length===0?('<div style="color:#fca5a5;font-size:14px;padding:10px;background:rgba(244,63,94,.12);border-radius:8px;border:1px solid rgba(244,63,94,.3)">'+ (typeof L==='function'?L('⚠️ पिछले 31 दिनों में कोई W-Off/Holiday पर Duty नहीं मिली जो C-Off के योग्य हो','⚠️ No eligible W-Off/Holiday duty in the last 31 days for C-Off'):'⚠️ No eligible W-Off/Holiday duty in the last 31 days for C-Off') +'</div>'):''}
        <input type="hidden" id="coWorkedDate" value="">
        <input type="hidden" id="coWorkedIsHoli" value="">
        <input type="hidden" id="coWorkedHoliName" value="">
        <div id="coDateCards" style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;padding:2px">
          ${dateOpts.map(o=>`<div class="co-date-card" onclick="selectCoDate(this,'${o.ds}',${o.isHoli},'${escHtml((o.holiName||'').replace(/'/g,'\\&#39;'))}',${o.isWoff})" data-val="${o.ds}"
            style="padding:14px 16px;border-radius:12px;border:2px solid #475569;background:#0f172a;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all .15s">
            <span style="font-size:22px;flex-shrink:0">${o.isHoli?'🎉':'📅'}</span>
            <div>
              <span style="font-size:16px !important;font-weight:900 !important;color:#fde68a !important;display:block">${escHtml(o.isHoli?o.holiName:'W-OFF')} — ${escHtml(o.label.split('(')[0].trim())}</span>
              <span style="font-size:14px !important;color:#22c55e !important;font-weight:700;display:block;margin-top:3px">✅ ${o.shift} Shift worked</span>
            </div>
          </div>`).join('')}
          <div class="co-date-card" onclick="selectCoDate(this,'OTHER',false,'',false)" data-val="OTHER"
            style="padding:14px 16px;border-radius:12px;border:2px solid #475569;background:#0f172a;cursor:pointer;display:flex;align-items:center;gap:12px">
            <span style="font-size:22px">📝</span>
            <span style="font-size:16px !important;font-weight:800 !important;color:#cbd5e1 !important">Other (manually enter)</span>
          </div>
        </div>
        <div id="coManualDate" style="display:none;margin-top:8px">
          <input type="date" id="coManualDateInput" style="width:100%;padding:12px;border-radius:10px;background:#0f172a !important;border:1.5px solid #475569;color:#fff !important;font-size:15px" max="${new Date().toISOString().slice(0,10)}">
        </div>
      </div>

      <div style="font-size:14px;font-weight:800;color:#e2e8f0;letter-spacing:.5px;margin-bottom:8px">${typeof L==='function'?L('कारण *','Reason *'):'Reason *'}</div>
      <div id="coReasonArea" style="margin-bottom:14px">
        <div id="coReasonBtns" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:8px">
          <button onclick="selectCoReason(this,(typeof L==='function'?L((typeof L==='function'?L('W-Off पर बुलाया गया','Called on weekly off'):'Called on weekly off'),'Called on weekly off'):'Called on weekly off'))" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">🔔 W-Off पर बुलाया</button>
          <button onclick="selectCoReason(this,(typeof L==='function'?L('Holiday पर काम किया','Worked on holiday'):'Worked on holiday'))" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">🎉 Holiday काम किया</button>
          <button onclick="selectCoReason(this,(typeof L==='function'?L('Extra shift ली','Took extra shift'):'Took extra shift'))" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">⏰ Extra Shift</button>
          <button onclick="selectCoReason(this,'Emergency duty')" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">🚨 Emergency</button>
        </div>
        <input id="coReasonText" placeholder="${typeof L==='function'?L('या कारण लिखें...','Or write reason...'):'Or write reason...'}" style="width:100%;padding:12px;border-radius:10px;background:#0f172a !important;border:1.5px solid #475569;color:#fff !important;font-size:15px;box-sizing:border-box;font-weight:600">
      </div>

      <div id="coSummary" style="display:none;background:rgba(113,63,18,.15);border:1px solid rgba(253,230,138,.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#fde68a;line-height:1.7"></div>

      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('compOffModal')?.remove()" style="flex:1;padding:13px;border-radius:10px;border:1px solid #334155;background:none;color:#64748b;font-size:14px;cursor:pointer">रद्द करें</button>
        <button onclick="confirmCompOff('${empId}','${empName}','${coDate}','${currentShift}')" style="flex:2;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#713f12,#92400e);color:#fde68a;font-size:14px;font-weight:900;cursor:pointer">${typeof L==='function'?L('✅ C-Off Mark करें','✅ Mark C-Off'):'✅ Mark C-Off'}</button>
      </div>
    </div>`;
  document.body.appendChild(modalDiv);
}

function selectCoDate(card, val, isHoli, holiName, isWoff){
  // Deselect all
  document.querySelectorAll('.co-date-card').forEach(c=>{
    c.style.borderColor='#334155'; c.style.background='#0f172a';
  });
  // Select this one
  card.style.borderColor='rgba(253,230,138,.6)'; card.style.background='rgba(113,63,18,.25)';
  document.getElementById('coWorkedDate').value = val;
  // Store metadata in hidden fields so confirmCompOff/updateCoSummary can read them
  const ihEl = document.getElementById('coWorkedIsHoli');
  const hnEl = document.getElementById('coWorkedHoliName');
  if(ihEl) ihEl.value = isHoli ? 'true' : 'false';
  if(hnEl) hnEl.value = holiName || '';
  // Show/hide manual date
  document.getElementById('coManualDate').style.display = val==='OTHER' ? 'block' : 'none';
  // Auto-fill reason
  if(isHoli && holiName){
    const re = document.getElementById('coReasonText');
    if(re && !re.value) re.value = (holiName+((typeof L==='function'?L(' पर काम किया',' — worked'):' — worked')));
  }
  updateCoSummary();
}

function onCoWorkedDateChange(){
  const sel = document.getElementById('coWorkedDate');
  const manDiv = document.getElementById('coManualDate');
  if(sel.value==='OTHER'){
    manDiv.style.display='block';
  } else {
    manDiv.style.display='none';
    const isHoli = false;
    const holiName = '';
    if(isHoli && holiName){
      const reasonEl = document.getElementById('coReasonText');
      if(reasonEl && !reasonEl.value) reasonEl.value = (holiName+((typeof L==='function'?L(' पर काम किया',' — worked'):' — worked')));
      // Highlight the Holiday reason button
      document.querySelectorAll('#coReasonBtns button').forEach(b=>{
        if(b.textContent.includes('Holiday')) b.click();
      });
    }
    updateCoSummary();
  }
}

function selectCoReason(btn, reason){
  document.querySelectorAll('#coReasonBtns button').forEach(b=>{
    b.style.background='#0f172a'; b.style.color='#e2e8f0'; b.style.borderColor='#475569';
  });
  btn.style.background='rgba(113,63,18,.5)'; btn.style.color='#fde68a'; btn.style.borderColor='rgba(253,230,138,.5)';
  document.getElementById('coReasonText').value = reason;
  updateCoSummary();
}

function updateCoSummary(){
  const sel = document.getElementById('coWorkedDate');
  const reason = document.getElementById('coReasonText')?.value||'';
  const summaryEl = document.getElementById('coSummary');
  if(!summaryEl) return;
  let workedDate = sel?.value==='OTHER' ? (document.getElementById('coManualDateInput')?.value||'') : sel?.value||'';
  if(workedDate && workedDate!=='OTHER'){
    const isHoli = document.getElementById('coWorkedIsHoli')?.value === 'true';
    const holiName = document.getElementById('coWorkedHoliName')?.value || '';
    const wdFmt = new Date(workedDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
    summaryEl.style.display='block';
    summaryEl.innerHTML=`<b>📋 C-Off Summary:</b><br>
      ${typeof L==='function'?L('काम किया: ','Worked: '):'Worked: '}${isHoli?'🎉 '+holiName+' — ':'📅 W-OFF — '}${wdFmt}<br>
      ${reason?((typeof L==='function'?L('कारण: ','Reason: '):'Reason: ')+reason):''}`;
  } else {
    summaryEl.style.display='none';
  }
}

function confirmCompOff(empId, empName, coDate, currentShift){
  const sel = document.getElementById('coWorkedDate');
  let workedDate = sel?.value==='OTHER' ? (document.getElementById('coManualDateInput')?.value||'') : sel?.value||'';
  const reason = document.getElementById('coReasonText')?.value?.trim()||'';
  
  if(!workedDate||workedDate==='OTHER'){
    alert(typeof L==='function'?L('कृपया वो दिन चुनें जब काम किया था','Please select the day they worked'):'Please select the day they worked'); return;
  }
  
  // Get holiday name if applicable (stored in hidden field by selectCoDate)
  const holiName = document.getElementById('coWorkedHoliName')?.value || null;
  
  // Close modal
  document.getElementById('compOffModal')?.remove();
  
  // Stage the C/O with metadata
  stageSingleShiftChange(empId, empName, coDate, currentShift, 'C/O', {
    workedDate, reason: reason||(holiName?(holiName+((typeof L==='function'?L(' पर काम किया',' — worked'):' — worked'))):(typeof L==='function'?L('W-Off पर काम किया','Worked on weekly off'):'Worked on weekly off')), holiName
  });
}

// Stage a shift change — adds to pending, updates cell in table visually, shows save bar
// ── OD (Other Department) Details Modal ──
function openODDetails(empId, empName, odDate, currentShift){
  const fmtD = new Date(odDate).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  const emps = getEmps().filter(e=>e.status!=='resigned');
  const machines = [...new Set(emps.map(e=>e.mc||'Other'))].sort();
  const machineOpts = machines.map(m=>`<option value="${m}">${m}</option>`).join('');

  openModal(`<div class="modal-handle"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="width:42px;height:42px;background:#0d9488;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#ccfbf1;flex-shrink:0">OD</div>
      <div>
        <div style="font-size:16px;font-weight:900;color:#fff">Other Department</div>
        <div style="font-size:12px;color:var(--muted2)">${empName} · ${fmtD}</div>
      </div>
    </div>
    <div class="field">
      <label>${typeof L==='function'?L('किस Machine / Department में गए? *','Which machine / department? *'):'Which machine / department? *'}</label>
      <select class="inp-field" id="odDept">
        <option value="">${typeof L==='function'?L('-- चुनें --','-- Select --'):'-- Select --'}</option>
        ${machineOpts}
        <option value="__OTHER__">${typeof L==='function'?L('✏️ Other (type करें)','✏️ Other (type)'):'✏️ Other (type)'}</option>
      </select>
    </div>
    <div id="odCustomDeptWrap" style="display:none" class="field">
      <label>${typeof L==='function'?L('Department / Machine का नाम','Department / machine name'):'Department / machine name'}</label>
      <input class="inp-field" id="odCustomDept" placeholder="e.g. Packing, Store, M-9">
    </div>
    <div class="field">
      <label>${typeof L==='function'?L('कारण (Reason)','Reason'):'Reason'}</label>
      <input class="inp-field" id="odReason" placeholder="e.g. Manpower shortage, Training">
    </div>
    <button class="submit-btn" onclick="submitOD('${empId}','${empName}','${odDate}','${currentShift}')">${typeof L==='function'?L('✅ OD Mark करें','✅ Mark OD'):'✅ Mark OD'}</button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
  setTimeout(()=>{
    const sel=document.getElementById('odDept');
    if(sel) sel.addEventListener('change',function(){
      document.getElementById('odCustomDeptWrap').style.display=this.value==='__OTHER__'?'block':'none';
    });
  },100);
}


/**
 * Remove OD report records for an employee on a given date.
 * Called when schedule cell is changed away from OD.
 */
async function _removeODRecordsForEmpDate(empId, date){
  if(!empId || !date) return 0;
  try{
    const all = await fbGet('reports');
    if(!all || typeof all !== 'object') return 0;
    const emp = (typeof getEmps==='function' ? getEmps() : []).find(e=>e && e.id===empId);
    const code = emp ? String(emp.empId||emp.empCode||'') : '';
    const dateKey = String(date).slice(0,10);
    const targets = [];
    Object.entries(all).forEach(([k, r])=>{
      if(!r || r.type !== 'od') return;
      if(r.status === 'removed') return;
      const sameEmp = r.empId === empId
        || (code && (String(r.empCode||'') === code || String(r.empId||'') === code))
        || (r.odKey && r.odKey === empId + '_' + dateKey);
      if(!sameEmp) return;
      const rd = String(r.date||'').slice(0,10);
      if(rd === dateKey) targets.push(k);
    });
    let n = 0;
    for(const k of targets){
      try{
        if(typeof fbRemove==='function') await fbRemove('reports/'+k);
        else await fbSet('reports/'+k, null);
        n++;
      }catch(e){
        try{
          await fbUpdate('reports/'+k, {
            status:'removed',
            removedAt: new Date().toISOString(),
            removedReason:'schedule_changed_from_OD'
          });
          n++;
        }catch(e2){ console.warn('[OD remove]', k, e2); }
      }
    }
    try{
      if(_cache && _cache.reports && typeof _cache.reports==='object'){
        targets.forEach(k=>{ try{ delete _cache.reports[k]; }catch(e){} });
      }
    }catch(e){}
    if(n) console.log('[OD] removed', n, 'record(s) for', empId, dateKey);
    return n;
  }catch(err){
    console.warn('[removeODRecords]', err);
    return 0;
  }
}

async function submitOD(empId, empName, date, currentShift){
  const deptSel = document.getElementById('odDept').value;
  const customDept = (document.getElementById('odCustomDept')?.value||'').trim();
  const reason = (document.getElementById('odReason')?.value||'').trim();
  const toDept = deptSel==='__OTHER__' ? customDept : deptSel;

  if(!toDept){ toast(L('❌ Department / Machine चुनें','❌ Select department / machine')); return; }

  // Save OD record to Firebase under reports (accessible to Manager)
  try{
    await fbPush('reports', {
      type: 'od',
      empId, empName, date,
      odKey: empId + '_' + date,
      toDept, reason,
      markedBy: SESSION.name||'Admin',
      markedAt: new Date().toISOString(),
      status: 'approved',
      aboutName: empName,
      section: (getEmps().find(e=>e.id===empId)||{}).sec || 'M1',
      description: `OD → ${toDept}${reason ? ' | '+reason : ''}`,
      createdAt: new Date().toISOString()
    });
  }catch(e){ console.warn('[OD save]', e.message); }

  // Stage the shift change
  stageSingleShiftChange(empId, empName, date, currentShift, 'OD');
}


/** Count Gate Pass days for emp in YYYY-MM of given dateStr (includes pending GP for same month). */
function _countGPInMonth(empId, dateStr){
  let count = 0;
  try{
    const d0 = new Date(dateStr+'T12:00:00');
    const y = d0.getFullYear(), m = d0.getMonth();
    const emp = getEmps().find(e=>e.id===empId);
    // Walk calendar days of that month
    const daysInMonth = new Date(y, m+1, 0).getDate();
    for(let day=1; day<=daysInMonth; day++){
      const ds = y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      // pending override for this day wins
      const pend = _pendingShiftChanges[empId+'__'+ds];
      let sh = pend ? pend.newShift : (emp ? getShift(emp, ds) : null);
      if(sh === 'GP') count++;
    }
  }catch(e){}
  return count;
}

/** Apply notification template placeholders. */

/** Resolve WhatsApp template in current UI language.
 *  Prefer translated default from _i18n_WA when config still has stock Hindi/English default.
 *  Custom manager-edited templates are left as-is.
 */

/** Normalize any language label/code to short code (hi/en/…). */
function _normPreferredLangCode(raw){
  if(raw==null || raw==='') return '';
  var s = String(raw).trim().toLowerCase();
  if(!s) return '';
  // already a code
  var codes = ['hi','en','gu','ta','te','kn','bn','or','ar','ur','zh','de','it','es','tr','pt','th','id','vi','ml','pa','mr','fr'];
  if(codes.indexOf(s)>=0) return s;
  // common display names / native names
  var map = {
    'hindi':'hi','हिन्दी':'hi','हिंदी':'hi','hin':'hi',
    'english':'en','eng':'en','अंग्रेज़ी':'en','अंग्रेजी':'en',
    'gujarati':'gu','ગુજરાતી':'gu',
    'tamil':'ta','தமிழ்':'ta',
    'telugu':'te','తెలుగు':'te',
    'kannada':'kn','ಕನ್ನಡ':'kn',
    'bengali':'bn','bangla':'bn','বাংলা':'bn',
    'odia':'or','oriya':'or','ଓଡ଼ିଆ':'or',
    'arabic':'ar','العربية':'ar',
    'urdu':'ur','اردو':'ur',
    'chinese':'zh','中文':'zh',
    'german':'de','deutsch':'de',
    'italian':'it','italiano':'it',
    'spanish':'es','español':'es',
    'turkish':'tr','türkçe':'tr',
    'portuguese':'pt','português':'pt',
    'thai':'th','ไทย':'th',
    'indonesian':'id','indonesia':'id',
    'vietnamese':'vi','tiếng việt':'vi'
  };
  if(map[s]) return map[s];
  // Devanagari-only short labels
  if(/[\u0900-\u097F]/.test(String(raw)) && /हिंद|हिन्द/.test(String(raw))) return 'hi';
  return '';
}

/** Preferred language for WhatsApp to this employee.
 *  Order: emp.preferredLang → mobileUsers/{phone}.preferredLang → cache → default hi
 *  NEVER fall back to manager UI language (_lang) — that caused English WA when manager used English UI.
 */
function getEmpPreferredLang(emp){
  var codes = ['hi','en','gu','ta','te','kn','bn','or','ar','ur','zh','de','it','es','tr','pt','th','id','vi','ml','pa','mr','fr'];
  function ok(c){
    if(!c) return '';
    if(typeof _i18n_SUPPORTED!=='undefined' && _i18n_SUPPORTED.indexOf(c)>=0) return c;
    if(codes.indexOf(c)>=0) return c;
    return '';
  }
  if(emp){
    var p = ok(_normPreferredLangCode(emp.preferredLang || emp.lang || emp.language || emp.waLang || ''));
    if(p) return p;
    // Resolve from mobileUsers by phone (often where profile language is saved)
    try{
      var mob = (typeof _normMobileKey==='function')
        ? _normMobileKey(emp.phone||emp.mobile||'')
        : String(emp.phone||emp.mobile||'').replace(/\D/g,'').slice(-10);
      if(mob && mob.length===10){
        var mu = null;
        if(_cache && _cache.mobileUsers){
          mu = _cache.mobileUsers[mob] || _cache.mobileUsers['+91'+mob];
        }
        if(mu){
          p = ok(_normPreferredLangCode(mu.preferredLang || mu.lang || mu.language || ''));
          if(p) return p;
        }
      }
    }catch(e){}
  }
  // Default for WhatsApp: Hindi (India team default) — do NOT use manager UI lang
  return 'hi';
}


/**
 * Build WhatsApp message for an employee in THEIR preferred language.
 * type: waShiftTemplate | waLeaveTemplate | waAbsentTemplate | waGPTemplate |
 *       waHolidayTemplate | waCOffTemplate | waTaskTemplate | waLeaveApproved | waLeaveRejected
 */
function buildWAForEmp(type, emp, vars, cfgVal){
  // Always member preferred language (never manager UI lang)
  const lang = (typeof getEmpPreferredLang==='function') ? getEmpPreferredLang(emp) : 'hi';
  // Pull manager template from shift config when caller omitted cfgVal
  if(cfgVal==null || cfgVal===''){
    try{
      const cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
      if(cfg && cfg[type]) cfgVal = cfg[type];
    }catch(e){}
  }
  let tpl = '';
  if(typeof getWATemplate==='function'){
    tpl = getWATemplate(type, cfgVal, lang) || '';
  }
  if(!tpl && typeof mlWA==='function'){
    tpl = mlWA(type, lang) || '';
  }
  // Last resort: Hindi stock (not English) for India-first teams
  if(!tpl) tpl = (typeof mlWA==='function' && (mlWA(type, 'hi') || mlWA(type, 'en'))) || '';
  const map = Object.assign({
    name: (emp && (emp.name||emp.empId)) || '',
    manager: (typeof SESSION!=='undefined' && SESSION.name) || 'Manager',
    date: '', dates: '', changes: '', gpCount: '', gpMax: '',
    coffDate: '', reason: '', title: '', desc: '', priority: '', assigner: '', due: '',
    leaveType: '', currentShift: '', newShift: ''
  }, vars||{});
  let out = String(tpl||'');
  Object.keys(map).forEach(function(k){
    out = out.replace(new RegExp('\\{'+k+'\\}','g'), map[k]==null?'':String(map[k]));
  });
  // clean empty due fragment
  out = out.replace(/\{due\}/g, '');
  return out;
}

function getWATemplate(key, cfgVal, preferredLang){
  // preferredLang must be the MEMBER language — never default to manager UI
  const lang = preferredLang || 'hi';
  const def = (typeof _defaultShiftConfig === 'function') ? _defaultShiftConfig() : {};
  const stock = def[key] || '';
  // Normalize whitespace for stock comparison (unicode dash variants etc.)
  const _normTpl = (s) => String(s||'').replace(/[\u2013\u2014\u2212]/g,'-').replace(/\s+/g,' ').trim();
  const isCustom = !!(cfgVal && stock && _normTpl(cfgVal) !== _normTpl(stock));
  // Custom manager template: still localize via mlWA when member lang is set and
  // custom text is just a slight edit of stock Hindi — but if clearly customized, keep as-is.
  if(isCustom){
    const isStockEn = (key === 'waMemberLeaveToMgrTemplate' || key === 'waMemberShiftToMgrTemplate');
    if(!isStockEn) return cfgVal;
  }
  // Stock template → multilingual pack for MEMBER language
  if(typeof mlWA === 'function'){
    const tr = mlWA(key, lang);
    if(tr) return tr;
  }
  // Prefer Hindi stock over English when lang is hi
  if(lang === 'hi' && stock) return stock;
  return cfgVal || stock || '';
}

function _fillNotifTemplate(tpl, {name, date, dates, manager, changes, gpCount, gpMax}){
  return String(tpl||'')
    .replace(/\{name\}/g, name||'')
    .replace(/\{date\}/g, date||'')
    .replace(/\{dates\}/g, dates||'')
    .replace(/\{manager\}/g, manager||'')
    .replace(/\{changes\}/g, changes||'')
    .replace(/\{gpCount\}/g, String(gpCount!=null?gpCount:''))
    .replace(/\{gpMax\}/g, String(gpMax!=null?gpMax:''));
}

function stageSingleShiftChange(empId, empName, date, currentShift, newShift, coMeta){
  try{ if(!window._msBulkCommit) closeModal(); }catch(e){}
  const key = empId+'__'+date;
  const isOwn = (SESSION.empObjId && empId===SESSION.empObjId) || (myEmp() && myEmp().id===empId);
  const fromMyShift = (typeof _currentTab!=='undefined' && _currentTab==='myshift');
  const canEdit = (typeof canEditSchedule==='function') && canEditSchedule();

  if(newShift === currentShift){
    delete _pendingShiftChanges[key];
    const cellEl = document.querySelector(`[data-pending="${key}"]`);
    if(cellEl){
      cellEl.innerHTML = `<span class="shc ${cellClass(currentShift)}">${cellDisp(currentShift)}</span>`;
      cellEl.removeAttribute('data-pending');
    }
    _updateSaveBar();
    if(fromMyShift){ try{ renderMyShift(); }catch(e){} }
    return;
  }

  // Gate Pass monthly limit
  if(newShift === 'GP'){
    const cfg = getShiftConfigSync();
    const gpMax = Math.max(1, Number(cfg.gpMaxPerMonth)||2);
    const prev = _pendingShiftChanges[key];
    _pendingShiftChanges[key] = { empId, empName, date, newShift, currentShift, coMeta: coMeta||null };
    const gpCount = _countGPInMonth(empId, date);
    if(gpCount > gpMax){
      if(prev) _pendingShiftChanges[key] = prev;
      else delete _pendingShiftChanges[key];
      toast(`⛔ Gate Pass limit: ${L('महीने में अधिकतम','max per month')} ${gpMax} GP. ${empName} ${L('के पास पहले से limit पूरी है।','already at the limit.')}`);
      return;
    }
  }

  // ── Member (no schedule authority): request manager approval — stay on My Shift ──
  if(isOwn && !canEdit){
    delete _pendingShiftChanges[key];
    _submitOwnShiftChangeRequest(empId, empName, date, currentShift, newShift, coMeta);
    return;
  }

  // ── Manager / authorized: from My Shift → save here (no jump to Schedule) ──
  if(fromMyShift && canEdit){
    _pendingShiftChanges[key] = { empId, empName, date, newShift, currentShift, coMeta: coMeta||null };
    // Auto-save this change in place; skip WhatsApp when only own shift
    const skipWA = isOwn;
    toast(L('⏳ शिफ्ट सहेजी जा रही है…','⏳ Saving shift…'));
    saveAllShiftChanges({ skipWhatsApp: skipWA, stayOnMyShift: true }).catch(e=>{
      toast('❌ '+(e&&e.message||e));
    });
    return;
  }

  // ── Schedule grid path: stage + save bar ──
  try{ if(typeof pushSchedUndoSnapshot==='function') pushSchedUndoSnapshot(); }catch(e){}
  _pendingShiftChanges[key] = { empId, empName, date, newShift, currentShift, coMeta: coMeta||null };

  // Prefer exact empId+date (keyboard + click); fallback to legacy data-cellkey
  let cellEl = document.querySelector(`td[data-empid="${empId}"][data-date="${date}"]`)
    || document.querySelector(`td[data-cellkey="${empId}_${date}"]`);
  if(cellEl){
    cellEl.dataset.pending = key;
    cellEl.dataset.origShift = currentShift;
    cellEl.innerHTML = `
      <span class="shc ${cellClass(newShift)}" style="outline:2px solid var(--m1);border-radius:4px;box-shadow:0 0 6px rgba(249,115,22,.5)">${cellDisp(newShift)}</span>
      <div style="font-size:7px;color:var(--m1);text-align:center;line-height:1;margin-top:1px;font-weight:900">NEW</div>`;
  }
  try{
    if(_currentTab==='myshift' && typeof renderMyShift==='function') renderMyShift();
  }catch(e){}

  _updateSaveBar();
  if(!window._msBulkCommit) toast(`⚡ ${empName}: ${cellDisp(newShift)} pending — ${L('Save दबाएँ','press Save')}`);
}

/** Member requests own shift change → assigned manager only */
async function _submitOwnShiftChangeRequest(empId, empName, date, currentShift, newShift, coMeta){
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  try{
    toast(L('⏳ Manager को request भेजी जा रही है…','⏳ Sending request to Manager…'));
    try{ await window._fbSignInAnon && window._fbSignInAnon(); }catch(e){}
    const me = myEmp() || {};
    const managerId = SESSION.managerId || me.managerId || '';
    if(!managerId){
      toast(L('❌ Manager link नहीं है — Admin से संपर्क करें','❌ No manager linked — ask Admin'));
      return;
    }
    const req = {
      type: 'shift_change_request',
      empObjId: empId,
      empId: me.empId || SESSION.empId || '',
      empName: empName || SESSION.name || '',
      date,
      currentShift,
      newShift,
      coMeta: coMeta || null,
      managerId: String(managerId),
      phone: SESSION.mobile || me.phone || me.mobile || '',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      requestedBy: SESSION.name || empName || ''
    };
    const reqKey = await fbPush('shiftChangeRequests', req);
    await fbUpdate('shiftChangeRequests/'+reqKey, { _key: reqKey });

    // Notify assigned manager only
    const notif = {
      type: 'shift_change_request',
      title: L('📅 Shift बदलने का अनुरोध','📅 Shift change request'),
      body: (empName||'')+' · '+date+' · '+(currentShift||'—')+' → '+(newShift||''),
      reqKey, empObjId: empId, date, newShift, currentShift,
      managerId: String(managerId),
      read: false, at: new Date().toISOString()
    };
    const targets = new Set([String(managerId)]);
    try{
      const allMu = await fbGet('mobileUsers') || {};
      Object.entries(allMu).forEach(([mobKey, u])=>{
        if(!u || u.role!=='manager' || u.status!=='approved') return;
        const mid = String(managerId);
        if(u.empObjId===mid || u.employeeId===mid || mobKey===(typeof _normMobileKey==='function'?_normMobileKey(mid):mid) ||
           (typeof _normMobileKey==='function' && _normMobileKey(u.mobile||'')===_normMobileKey(mid))){
          targets.add(mobKey);
          if(u.empObjId) targets.add(u.empObjId);
          if(u.mobile) targets.add(_normMobileKey(u.mobile));
        }
      });
    }catch(e){}
    for(const t of targets){
      if(!t) continue;
      try{ await fbPush('userNotifications/'+t, notif); }catch(e){}
    }

    toast(isEn
      ? ('✅ Request sent to Manager — wait for approval')
      : (typeof L==='function'?L('✅ Manager को request भेज दी — Approve के बाद shift अपडेट होगी','✅ Request sent to manager — shift updates after approval'):'✅ Request sent to manager — shift updates after approval'));
    // WhatsApp to manager if template enabled (in-app already sent above)
    try{
      await _notifyMappedManagerAfterMemberAction('shift', {
        managerId: managerId,
        empObjId: empId,
        name: empName || SESSION.name,
        date: date,
        dates: date,
        currentShift: currentShift,
        newShift: newShift,
        reqKey: reqKey,
        skipInApp: true,
        notifBody: (empName||'')+' · '+date+' · '+(currentShift||'—')+' → '+(newShift||'')
      });
    }catch(e2){ console.warn('[shift WA]', e2); }
    try{ renderMyShift(); }catch(e){}
  }catch(e){
    console.error('[shift change request]', e);
    toast('❌ '+(e&&e.message||e));
  }
}


async function _renderPendingShiftChangeRequests(){
  if(!(typeof isAdminOrMgr==='function' && isAdminOrMgr()) && !(typeof canEditSchedule==='function' && canEditSchedule())) return;
  let host = document.getElementById('pendingShiftChangeReqs');
  if(!host){
    // Create container above device pending if possible
    const parent = document.getElementById('pendingLoginRequests') || document.getElementById('adminOnlyPendingBlock') || document.getElementById('pendingRegs');
    if(!parent || !parent.parentNode) return;
    host = document.createElement('div');
    host.id = 'pendingShiftChangeReqs';
    parent.parentNode.insertBefore(host, parent.nextSibling);
  }
  try{
    const data = await fbGet('shiftChangeRequests') || {};
    let list = Object.entries(data).filter(([k,v])=>v && v.status==='pending');
    if(typeof isAdmin==='function' && isAdmin()){
      // all
    } else {
      list = list.filter(([k,v])=> _isMyTeamLoginRequest({ managerId: v.managerId, type:'manager_login_approval' }) ||
        (SESSION.empObjId && v.managerId===SESSION.empObjId) || (SESSION.uid && v.managerId===SESSION.uid));
    }
    if(!list.length){ host.innerHTML=''; return; }
    const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
    host.innerHTML = `<div style="font-size:13px;font-weight:900;color:#38bdf8;margin:12px 0 8px">📅 ${L('Shift बदलने के अनुरोध','Shift change requests')}</div>` +
      list.map(([k,v])=>`
        <div class="card" style="margin-bottom:8px;border-left:3px solid #38bdf8">
          <div class="card-name">${escHtml((v.empName||'').replace(/</g,''))}</div>
          <div class="card-sub">${v.date||''} · <b>${v.currentShift||'—'}</b> → <b style="color:#38bdf8">${v.newShift||''}</b></div>
          <div class="card-meta">${v.requestedAt?new Date(v.requestedAt).toLocaleString((typeof mpLocale==='function'?mpLocale():'en-IN')):''}</div>
          <div class="action-row" style="margin-top:8px;display:flex;gap:8px">
            <button class="act-btn approve" onclick="approveShiftChangeRequest('${k}')">✅ Approve</button>
            <button class="act-btn reject" onclick="rejectShiftChangeRequest('${k}')">❌ Reject</button>
          </div>
        </div>`).join('');
  }catch(e){ console.warn('[pending shift reqs]', e); }
}

async function approveShiftChangeRequest(reqKey){
  try{
    const rec = await fbGet('shiftChangeRequests/'+reqKey);
    if(!rec || rec.status!=='pending'){ toast('Already handled'); return; }
    if(!canEditSchedule() && !(typeof isAdmin==='function' && isAdmin())){
      toast(L('❌ Permission नहीं है','❌ Permission denied')); return;
    }
    const okAuth = await _ensureWriteAuth();
    if(!okAuth){ toast(L('❌ Phone verify करें','❌ Verify phone')); return; }
    const ovKey = rec.empObjId+'_'+rec.date;
    await fbUpdate('overrides', { [ovKey]: rec.newShift });
    try{
      _cache.overrides = {...(getOverrides()||{}), [ovKey]: rec.newShift};
    }catch(e){}
    await fbUpdate('shiftChangeRequests/'+reqKey, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: SESSION.name||''
    });
    // Notify member
    try{
      if(rec.empObjId){
        await fbPush('userNotifications/'+rec.empObjId, {
          type: 'shift_change_approved',
          title: '✅ Shift change approved',
          body: (rec.date||'')+' → '+(rec.newShift||''),
          read: false, at: new Date().toISOString()
        });
      }
    }catch(e){}
    toast('✅ Shift updated');
    try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
    try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
    try{ if(typeof renderMyShift==='function') renderMyShift(); }catch(e){}
  }catch(e){ toast('❌ '+(e.message||e)); }
}

async function rejectShiftChangeRequest(reqKey){
  try{
    await fbUpdate('shiftChangeRequests/'+reqKey, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: SESSION.name||''
    });
    toast('Request rejected');
    try{ if(typeof renderPending==='function') renderPending(); }catch(e){}
  }catch(e){ toast('❌ '+(e.message||e)); }
}

// Legacy single-call — now just a wrapper used by resetShiftOverride
async function applyShiftChange(){ /* unused — replaced by stageSingleShiftChange */ }

async function resetShiftOverride(empId, date){
  closeModal();
  try{
    // If current override/display was OD, drop OD report for that day
    try{
      const emp = (typeof getEmps==='function'?getEmps():[]).find(e=>e&&e.id===empId);
      const cur = emp && typeof getShift==='function' ? getShift(emp, date) : '';
      if(String(cur||'').toUpperCase()==='OD' && typeof _removeODRecordsForEmpDate==='function'){
        await _removeODRecordsForEmpDate(empId, date);
      }
    }catch(e){}
    const existing = {...getOverrides()};
    delete existing[empId+'_'+date];
    await fbSet('overrides', existing);
    toast(L('🔄 Original shift restore हो गई','🔄 Original shift restored'));
    renderSchedule();
  }catch(e){ toast('❌ Error: '+e.message); }
}


// ════════════════════════════════════════════════════════
// DYNAMIC SCHEDULE BUILDER — Admin
// ════════════════════════════════════════════════════════

const SHIFT_QUICK = ['D','N','A','B','C','O','L','G','C/O','HLF','Ab'];


/** Active work shifts from Profile (hide unticked A/B/C etc.) */
function _sbActiveShiftCodes(){
  try{
    const cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
    const shifts = (cfg.shifts||[]).filter(s=>s && s.code && s.active!==false);
    let codes = shifts.map(s=>String(s.code).toUpperCase());
    // If Profile hid A/B/C summary, drop those codes even if present
    if(cfg.hideSummaryABC){
      codes = codes.filter(c=>c!=='A' && c!=='B' && c!=='C');
    }
    // Always allow at least D/N if nothing configured
    if(!codes.length) codes = ['D','N'];
    return codes;
  }catch(e){ return ['D','N']; }
}

function _sbLockLandscape(on){
  try{
    if(on){
      document.body.classList.add('sb-builder-open');
      const o = screen.orientation || screen.mozOrientation || screen.msOrientation;
      if(screen.orientation && screen.orientation.lock){
        screen.orientation.lock('landscape').catch(()=>{});
      } else if(screen.lockOrientation){
        try{ screen.lockOrientation('landscape'); }catch(e){}
      }
    } else {
      document.body.classList.remove('sb-builder-open');
      if(screen.orientation && screen.orientation.unlock){
        try{ screen.orientation.unlock(); }catch(e){}
      }
    }
  }catch(e){}
}

