/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-team-import.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
function openAddEmpForm(){
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">👤 ${typeof t==='function'?t('नया कर्मचारी'):'New Employee'}</div>
  <div class="grid2">
    <div class="field"><label>${typeof t==='function'?t('नाम'):'Name'}</label><input class="inp-field" id="ne_name" placeholder="FULL NAME" oninput="this.value=this.value.toUpperCase()"></div>
    <div class="field"><label>Employee Code / ID</label><input class="inp-field" id="ne_code" placeholder="30000XXX"></div>
  </div>
  <div class="grid2">
    ${_dynFieldHtml('section','ne_section','ne_section_other','ne_section_other_wrap','',true)}
    ${_dynFieldHtml('designation','ne_designation','ne_desig_other','ne_desig_other_wrap','Team Member',false)}
  </div>
  <div class="grid2">
    ${_dynFieldHtml('machine','ne_mc','ne_mc_other','ne_mc_other_wrap','',false)}
    ${_dynFieldHtml('responsibility','ne_resp','ne_resp_other','ne_resp_other_wrap','Operation',false)}
  </div>
  <div class="grid2">
    <div class="field"><label>Week Off</label>
      <select id="ne_woff" class="inp-field"><option>MON</option><option>TUE</option><option>WED</option><option>THU</option><option>FRI</option><option>SAT</option><option selected>SUN</option></select>
    </div>
    <div class="field"><label>📱 ${typeof t==='function'?t('मोबाइल नंबर'):'Mobile'} (SMS)</label><input class="inp-field" id="ne_phone" placeholder="10-digit number" type="tel" maxlength="10" oninput="this.value=this.value.replace(/\\D/g,'')"></div>
  </div>
  <div class="grid2">
    <div class="field"><label>📅 Joining Date</label><input class="inp-field" id="ne_joining" type="date"></div>
    <div class="field"><label>🎂 Date of Birth</label><input class="inp-field" id="ne_dob" type="date"></div>
  </div>
  <div class="field"><label>💰 Monthly Salary (₹)</label><input class="inp-field" id="ne_salary" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="e.g. 15000"></div>
  <div style="font-size:11px;color:var(--muted2);margin:4px 0 12px">${L('Section = schedule फ़िल्टर के लिए समूह (Machine से अलग)।','Section = team group for schedule filters (not the same as Machine).')}</div>
  <button class="submit-btn" onclick="addEmployee()">✅ ${typeof t==='function'?t('जोड़ें'):'Add'}</button>
  <button class="cancel-btn" onclick="closeModal()">${typeof t==='function'?t('रद्द करें'):'Cancel'}</button>`);
}

async function addEmployee(){
  if(!(await _assertCanAddToRoster(1))) return;
  const name=document.getElementById('ne_name').value.trim().toUpperCase();
  const code=document.getElementById('ne_code').value.trim();
  const mc=_resolveDynField('ne_mc','ne_mc_other');
  const resp=_resolveDynField('ne_resp','ne_resp_other');
  const woff=document.getElementById('ne_woff').value;
  const phone=document.getElementById('ne_phone').value.trim();
  const designation=_resolveDynField('ne_designation','ne_desig_other');
  const joiningDate=document.getElementById('ne_joining')?.value?.trim()||'';
  const dob=document.getElementById('ne_dob')?.value?.trim()||'';
  const salaryRaw=document.getElementById('ne_salary')?.value?.trim();
  const sectionRaw=_resolveDynField('ne_section','ne_section_other');
  const sec = sectionRaw || (typeof _secFromMachine==='function' ? _secFromMachine(mc, designation) : '') || mc || 'General';
  if(!name||!code){ toast(L('नाम और कोड जरूरी है','Name and code are required')); return; }
  if(!sectionRaw){ toast(L('⚠️ Section जरूरी है','⚠️ Section is required')); return; }
  if(!mc){ toast(L('⚠️ मशीन चुनें','⚠️ Select a Machine')); return; }
  // Only Admin can add Manager-section employees
  if(sec==='MGR' && !isAdmin()){ toast(L('❌ Manager department में सिर्फ Admin जोड़ सकते हैं','❌ Only Admin can add to Manager department')); return; }
  // Duplicate employee code
  const codeClash = (getEmps()||[]).find(e => e.status !== 'resigned' && e.empId && String(e.empId).trim().toUpperCase() === code.toUpperCase());
  if(codeClash){
    toast(L('⚠️ Employee code पहले से है: ','⚠️ Employee code already exists: ') + codeClash.name);
    return;
  }
  // Normalize phone and block if already registered anywhere (employees + mobileUsers live)
  const phoneNorm = (typeof _normMobileKey==='function' ? _normMobileKey(phone) : String(phone||'').replace(/\D/g,'').slice(-10));
  if(phoneNorm && phoneNorm.length === 10){
    let clash = null;
    try{
      if(typeof _findPhoneConflictAsync==='function') clash = await _findPhoneConflictAsync(phoneNorm, null, code);
      else if(typeof _findPhoneConflict==='function') clash = _findPhoneConflict(phoneNorm, null, code);
    }catch(ex){ console.warn('[addEmployee] phone check', ex); }
    if(clash){
      try{
        if(typeof openPhoneTransferModal==='function'){
          openPhoneTransferModal({clash, phone:phoneNorm, intended:{name,code,sec,section:sectionRaw||sec,mc,resp,woff,designation,joiningDate,dob,salaryRaw}});
          return;
        }
      }catch(ex){}
      const nm = (clash.emp&&(clash.emp.name||clash.emp.empId)) || phoneNorm;
      toast(L('📱 यह मोबाइल नंबर पहले से registered है। Add नहीं किया।','📱 Mobile already registered. Not added.') + ' ('+nm+')');
      return;
    }
  }
  const id='e'+Date.now().toString(36);
  const emp={id,name,empId:code,sec,section:sectionRaw||sec,mc,resp,woff,status:'active',
    designation,
    companyId:myCompanyId()==='ALL'?'default':myCompanyId(),
    companyLabel:SESSION.company||'Man Power',
    ms:Array(31).fill('D')};
  if(SESSION.role==='manager' && SESSION.mobile){ emp.managerId=_normMobileKey(SESSION.mobile); }
  if(phoneNorm && phoneNorm.length===10) emp.phone=phoneNorm;
  else if(phone) emp.phone=phone;
  if(joiningDate) emp.joiningDate=joiningDate;
  if(dob) emp.dob=dob;
  if(salaryRaw) emp.monthlySalary=parseFloat(salaryRaw);
  await fbUpdate(`employees/${id}`,emp);
  closeModal();
  toast('✅ ' + name + ' ' + L('जोड़ा गया','added'));
}

function openEditEmpForm(empId){
  const e=getEmps().find(x=>x.id===empId); if(!e) return;
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const statusSel = ['active','resigned'].map(s=>`<option value="${s}"${(e.status||'active')===s?' selected':''}>${s}</option>`).join('');
  const curSec = (e.section||e.sec||'');
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">✏️ ${L('संपादित करें','Edit')} ${escHtml(e.name)}</div>
  <div class="grid2">
    <div class="field"><label>${L('नाम','Name')}</label><input class="inp-field" id="ee_name" value="${escHtml(e.name)}"></div>
    <div class="field"><label>Employee Code / ID</label><input class="inp-field" id="ee_code" value="${escHtml(e.empId||'')}"></div>
  </div>
  <div class="grid2">
    ${_dynFieldHtml('section','ee_sec','ee_sec_other','ee_sec_other_wrap',curSec,false)}
    ${_dynFieldHtml('designation','ee_designation','ee_desig_other','ee_desig_other_wrap',e.designation||'',false)}
  </div>
  <div class="grid2">
    ${_dynFieldHtml('machine','ee_mc','ee_mc_other','ee_mc_other_wrap',e.mc||'',false)}
    ${_dynFieldHtml('responsibility','ee_resp','ee_resp_other','ee_resp_other_wrap',e.resp||'',false)}
  </div>
<div class="grid2">
    <div class="field"><label>Week Off</label>
      <select id="ee_woff">${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d=>`<option${(e.woff||'SUN')===d?' selected':''}>${d}</option>`).join('')}</select>
    </div>
    <div class="field"></div>
  </div>
  ${(()=>{
    const lockPhone = isManagerSelfRecord(e);
    const ph = e.phone||e.mobile||'';
    if(lockPhone){
      return `<div class="field"><label>📱 ${L('मोबाइल (लॉगिन — लॉक)','Mobile (login — locked)')}</label>
        <input class="inp-field" id="ee_phone" value="${ph}" readonly style="opacity:.85;cursor:not-allowed;background:rgba(148,163,184,.12)">
        <div style="font-size:11px;color:#fbbf24;margin-top:4px">${L('Manager का मोबाइल लॉगिन नंबर से जुड़ा है — यहाँ नहीं बदल सकते।','Manager mobile must match login number and cannot be changed here.')}</div></div>`;
    }
    return `<div class="field"><label>📱 ${L('मोबाइल नंबर','Mobile')}</label><input class="inp-field" id="ee_phone" value="${ph}" placeholder="10-digit" type="tel" maxlength="10" oninput="this.value=this.value.replace(/\D/g,'')"></div>`;
  })()}
  <div class="grid2">
    <div class="field"><label>📅 Joining Date</label><input class="inp-field" id="ee_joining" type="date" value="${e.joiningDate||''}"></div>
    <div class="field"><label>🎂 Date of Birth</label><input class="inp-field" id="ee_dob" type="date" value="${e.dob||''}"></div>
  </div>
  <div class="grid2">
    <div class="field"><label>💰 Monthly Salary (₹)</label><input class="inp-field" id="ee_salary" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${e.monthlySalary||''}"></div>
    <div class="field"><label>Status</label><select id="ee_status">${statusSel}</select></div>
  </div>
  ${isAdmin()?`<div class="field"><label>Access Level</label><select id="ee_accessLevel"><option value="worker"${(e.accessLevel||'worker')==='worker'?' selected':''}>Worker</option><option value="manager"${e.accessLevel==='manager'?' selected':''}>Manager</option></select></div>`:'<input type="hidden" id="ee_accessLevel" value="'+(e.accessLevel||'worker')+'">'}
  ${(isMgr()||isAdmin()) && !isManagerSelfRecord(e) ? `
  <div style="margin:12px 0;padding:12px;border-radius:12px;border:1px solid rgba(168,85,247,.35);background:rgba(168,85,247,.08)">
    <div style="font-size:12px;font-weight:800;color:#c084fc;margin-bottom:8px">🔐 ${L('टीम अधिकार (सौंपें)','Team authorization (delegate)')}</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px;line-height:1.4">${L('इस सदस्य को टीम मैनेज करने की अनुमति दें:','Allow this member to help manage the team:')}</div>
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;font-weight:700;color:var(--text);cursor:pointer">
      <input type="checkbox" id="ee_perm_schedule" ${(e.perms&&e.perms.schedule)?'checked':''} style="width:18px;height:18px;accent-color:#a855f7">
      📅 ${L('Shift schedule बनाएं / बदलें','Make / edit shift schedule')}
    </label>
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;font-weight:700;color:var(--text);cursor:pointer">
      <input type="checkbox" id="ee_perm_leave" ${(e.perms&&e.perms.leave)?'checked':''} style="width:18px;height:18px;accent-color:#22c55e">
      🏖️ ${L('Leave approve / manage','Approve / manage leave')}
    </label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--text);cursor:pointer">
      <input type="checkbox" id="ee_perm_reports" ${(e.perms&&e.perms.reports)?'checked':''} style="width:18px;height:18px;accent-color:#38bdf8">
      📋 ${L('Team reports manage','Manage team reports')}
    </label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--text);cursor:pointer">
      <input type="checkbox" id="ee_perm_pending" ${(e.perms&&e.perms.pending)?'checked':''} style="width:18px;height:18px;accent-color:#a78bfa">
      ⏳ ${L('Pending approvals (delegate)','See Pending approvals (delegate)')}
    </label>
    <div style="font-size:10px;color:var(--muted2);margin-top:6px">${L('Leave ✓ = team leave / C-Off approve कर सकते हैं','Leave tick = can approve team leave & C-Off')}</div>
  </div>` : ''}
  <div style="font-size:11px;color:var(--muted2);margin:4px 0 12px">${L('Section Excel / form से (Machine से नहीं)।','Section comes from Excel / edit form (not from Machine).')}</div>
  <div class="field"><label>🌐 ${L('WhatsApp भाषा / Preferred language','WhatsApp / Preferred language')}</label>
    <select class="inp-field" id="ee_preferredLang" style="width:100%">
      ${['hi','en','gu','ta','te','kn','bn','or','ar','ur','zh','de','it','es','tr','pt','th','id','vi'].map(c=>{
        const titles={hi:'हिन्दी',en:'English',gu:'ગુજરાતી',ta:'தமிழ்',te:'తెలుగు',kn:'ಕನ್ನಡ',bn:'বাংলা',or:'ଓଡ଼ିଆ',ar:'العربية',ur:'اردو',zh:'中文',de:'Deutsch',it:'Italiano',es:'Español',tr:'Türkçe',pt:'Português',th:'ไทย',id:'Indonesia',vi:'Tiếng Việt'};
        const sel=(e.preferredLang||e.lang||'')===c?'selected':'';
        return '<option value="'+c+'" '+sel+'>'+(titles[c]||c)+'</option>';
      }).join('')}
    </select>
    <div style="font-size:10px;color:var(--muted2);margin-top:4px">${L('इस भाषा में WhatsApp messages जाएंगे','WhatsApp messages will use this language')}</div>
  </div>
  <div class="modal-scroll-spacer" style="height:max(120px,calc(100px + env(safe-area-inset-bottom,0px)));flex-shrink:0" aria-hidden="true"></div>
  <div class="modal-sticky-actions" style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
  <button type="button" class="submit-btn" id="ee_saveBtn" onclick="event.preventDefault();event.stopPropagation();saveEmployee('${empId}')">💾 ${L('सेव करें','Save')}</button>
  <button type="button" class="cancel-btn" onclick="event.preventDefault();closeModal()">${L('रद्द करें','Cancel')}</button>
  </div>`);
}

async function saveEmployee(empId){
  // preferredLang captured early via val() after fields exist

  // Instant feedback — Save feels lightning-fast
  const _saveBtn = document.getElementById('ee_saveBtn');
  const _setBusy = (busy, label)=>{
    if(!_saveBtn) return;
    _saveBtn.disabled = !!busy;
    _saveBtn.classList.toggle('is-busy', !!busy);
    if(label) _saveBtn.textContent = label;
  };
  if(_saveBtn && !_saveBtn.dataset.prevLabel){
    _saveBtn.dataset.prevLabel = _saveBtn.textContent || '';
  }
  _setBusy(true, (typeof L==='function') ? L('⏳ सेव हो रहा…','⏳ Saving…') : '⏳ Saving…');

  try{
  const e = (getEmps().find(x=>x.id===empId))
    || ((_cache.employees||[]).find(x=>x.id===empId))
    || null;
  if(!isAdmin() && !isMgr()){ _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel); toast('❌ Only Admin/Manager can edit'); return; }
  if(!empId){ _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel); toast('❌ Missing employee id'); return; }

  // Multi-device: each browser needs Phone Auth once; does NOT log out other devices
  // Fast path: skip long waits when device already verified this session
  if(typeof _ensureWriteAuth === 'function'){
    let ok = false;
    try{
      // Prefer session cache — avoids 1–2s wait loops on every Save
      if(sessionStorage.getItem('mp_write_auth')==='1' && window._fbAuth && window._fbAuth.currentUser){
        ok = true;
      } else {
        ok = await _ensureWriteAuth();
      }
    }catch(authErr){
      console.warn('[saveEmp] auth', authErr);
      ok = false;
    }
    if(!ok){
      _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel);
      toast(L('❌ इस device पर Phone verify करें (दूसरा device logout नहीं होगा)','❌ Phone verify on this device (other devices stay logged in)'));
      return;
    }
  }

  const val = (id) => {
    const el = document.getElementById(id);
    return el ? String(el.value||'').trim() : '';
  };
  const checked = (id) => {
    const el = document.getElementById(id);
    return !!(el && el.checked);
  };

  const mcVal = _resolveDynField('ee_mc','ee_mc_other') || val('ee_mc');
  const desigVal = _resolveDynField('ee_designation','ee_desig_other') || val('ee_designation');
  let phoneVal = val('ee_phone').replace(/\D/g,'').slice(-10);
  // Manager cannot change their own login mobile
  if(e && isManagerSelfRecord(e)){
    phoneVal = _normMobileKey(SESSION.mobile||SESSION.uid||e.phone||e.mobile||'');
  }
  const nameVal = val('ee_name').toUpperCase();
  if(!nameVal){ _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel); toast('⚠️ Name required'); return; }

  const secVal = _resolveDynField('ee_sec','ee_sec_other') || (document.getElementById('ee_sec') ? val('ee_sec') : ((e&&(e.section||e.sec)) || ''));
  const respVal = _resolveDynField('ee_resp','ee_resp_other') || val('ee_resp');
  const update = {
    name:        nameVal,
    empId:       val('ee_code'),
    mc:          mcVal,
    sec:         secVal,
    section:     secVal,
    resp:        respVal,
    woff:        val('ee_woff') || 'SUN',
    status:      val('ee_status') || 'active',
    phone:       phoneVal,
    mobile:      phoneVal,
    designation: desigVal,
    accessLevel: val('ee_accessLevel') || (e && e.accessLevel) || 'worker',
    updatedAt:   new Date().toISOString(),
    updatedBy:   SESSION.name || SESSION.mobile || 'manager'
  };

  // Team authorization (always write when manager/admin edits a member — not self)
  if((isMgr()||isAdmin()) && !(e && isManagerSelfRecord(e))){
    const hasPermUi = !!document.getElementById('ee_perm_schedule');
    if(hasPermUi){
      update.perms = {
        schedule: checked('ee_perm_schedule'),
        leave: checked('ee_perm_leave'),
        reports: checked('ee_perm_reports'),
        pending: checked('ee_perm_pending')
      };
    }
  }

  const joining = val('ee_joining');
  const dob     = val('ee_dob');
  const salary  = val('ee_salary');
  if(joining) update.joiningDate = joining;
  if(dob) update.dob = dob;
  if(salary !== ''){
    const n = parseFloat(salary);
    update.monthlySalary = isFinite(n) ? n : null;
  }

  // Phone clash — live check across all teams + mobileUsers
  if(update.phone){
    update.phone = (typeof _normMobileKey==='function' ? _normMobileKey(update.phone) : String(update.phone).replace(/\D/g,'').slice(-10));
  }
  if(update.phone && update.phone.length === 10){
    const selfPhone = e ? _normMobileKey(e.phone||e.mobile||'') : '';
    if(update.phone !== selfPhone){
      let clash = null;
      try{
        if(typeof _findPhoneConflictAsync==='function') clash = await _findPhoneConflictAsync(update.phone, empId, update.empId);
        else clash = _findPhoneConflict(update.phone, empId, update.empId);
      }catch(ex){}
      if(clash && clash.emp && clash.emp.id !== empId){
        _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel);
        try{
          if(typeof openPhoneTransferModal==='function'){
            openPhoneTransferModal({clash, phone:update.phone, intended:null, editEmpId:empId});
            return;
          }
        }catch(ex){}
        const nm = clash.emp.name || clash.emp.empId || '';
        toast((clash.otherTeam
          ? L('📱 यह मोबाइल नंबर पहले से दूसरे team के member के पास है।','📱 Mobile already belongs to another team\'s member.')
          : L('📱 यह मोबाइल नंबर पहले से registered है।','📱 Mobile already registered.')) + ' ('+nm+')');
        return;
      }
    }
  }

  try{ const pl=document.getElementById('ee_preferredLang'); if(pl) update.preferredLang=pl.value||''; }catch(e){}

  // If Admin/Manager sets Access Level = Manager → promote fully (role + mobileUsers + team managerId)
  const newAccess = String(update.accessLevel||'').toLowerCase();
  const phoneKey = _normMobileKey(update.phone || update.mobile || (e && (e.phone||e.mobile)) || '');
  if(newAccess === 'manager' && phoneKey){
    update.role = 'manager';
    update.accessLevel = 'manager';
    update.isTeamManager = true;
    update.status = (update.status && update.status!=='left_team') ? update.status : 'active';
    // New manager owns the team — members should point at this phone
    update.managerId = phoneKey;
  } else if(newAccess === 'worker' && e && (String(e.role||'').toLowerCase()==='manager' || String(e.accessLevel||'').toLowerCase()==='manager')){
    // Demote only if explicitly set back to worker (admin action)
    if(isAdmin()){
      update.role = 'member';
    }
  }

  // Primary write — only this must complete before UI closes
  try{
    await fbUpdate('employees/'+empId, update);
    // Knowledge-loss alert when marking left/resigned
    try{
      const st = String(update.status||'').toLowerCase();
      if((st==='resigned'||st==='left'||st==='left_team') && e && window.MP_OPS && typeof window.MP_OPS.onEmployeeLeaving==='function'){
        const merged = Object.assign({}, e, update);
        window.MP_OPS.onEmployeeLeaving(merged, (typeof L==='function')
          ? L('स्थिति Left / Resigned पर सेट की गई।','Status set to Left / Resigned.')
          : 'Status set to Left / Resigned.');
      }
    }catch(klErr){ console.warn('[knowledge-loss hook]', klErr); }

    // Manager promotion: only when newly made manager (not every edit of existing manager)
    const wasMgr = e && (String(e.role||'').toLowerCase()==='manager' || String(e.accessLevel||'').toLowerCase()==='manager');
    if(newAccess === 'manager' && phoneKey && !wasMgr){
      try{
        const cid = _normCompanyId((update.companyId || (e && e.companyId) || SESSION.companyId || ''));
        const all = (_cache.employees || []);
        const tasks = [];
        all.forEach(mem => {
          if(!mem || !mem.id || mem.id === empId) return;
          if(String(mem.status||'') === 'left_team' || String(mem.status||'') === 'resigned' || String(mem.status||'') === 'left') return;
          if(cid && _normCompanyId(mem.companyId||'') && _normCompanyId(mem.companyId) !== cid) return;
          // Members of this team (same old manager OR same company without manager)
          const memMgr = _normMobileKey(mem.managerId||'');
          // Only move people who were under the editor's team (current manager session) or under this member's previous managerId
          let oldMgr = '';
          try{
            if(SESSION && SESSION.role==='manager') oldMgr = _normMobileKey(SESSION.mobile||'');
          }catch(ex){}
          if(!oldMgr && e) oldMgr = _normMobileKey(e.managerId||'');
          // STRICT: only same old manager — never whole company
          const should = memMgr && oldMgr && memMgr === oldMgr;
          if(should && memMgr !== phoneKey){
            tasks.push(fbUpdate('employees/'+mem.id, { managerId: phoneKey, updatedAt: new Date().toISOString() }));
            try{ mem.managerId = phoneKey; }catch(ex){}
          }
        });
        // Demote ONLY the outgoing manager(s) — never every manager in the company
        // (multi-manager companies must keep other managers intact)
        const outgoingMgrKeys = new Set();
        try{
          if(SESSION && SESSION.role==='manager'){
            const sk = _normMobileKey(SESSION.mobile||'');
            if(sk) outgoingMgrKeys.add(sk);
          }
        }catch(ex){}
        if(e){
          const op = _normMobileKey(e.managerId||'');
          if(op) outgoingMgrKeys.add(op);
          // If the person being promoted was under a manager, that manager is outgoing for team handoff
        }
        // When a manager edits and promotes a team member, SESSION.mobile is the outgoing manager
        all.forEach(mem => {
          if(!mem || mem.id === empId) return;
          const isOtherMgr = String(mem.role||'').toLowerCase()==='manager' || String(mem.accessLevel||'').toLowerCase()==='manager';
          if(!isOtherMgr) return;
          const memPhone = _normMobileKey(mem.phone||mem.mobile||'');
          // Only demote if this manager is explicitly the outgoing one
          if(!memPhone || !outgoingMgrKeys.has(memPhone)) return;
          if(memPhone === phoneKey) return;
          const leftPayload = {
            role:'member', accessLevel:'worker',
            managerId: phoneKey,
            status: 'left_team',
            leftAt: new Date().toISOString(),
            leftReason: 'manager_transferred',
            updatedAt: new Date().toISOString(),
            active: false
          };
          tasks.push(fbUpdate('employees/'+mem.id, leftPayload));
          try{ Object.assign(mem, leftPayload); }catch(ex){}
          tasks.push(fbSet('leftEmployees/'+mem.id, {
            ...mem,
            ...leftPayload,
            id: mem.id,
            name: mem.name || '',
            phone: mem.phone || mem.mobile || '',
            archivedAt: Date.now(),
            removedBy: SESSION.name || SESSION.mobile || 'system'
          }).catch(()=>{}));
          tasks.push(fbRemove('mobileUsers/'+memPhone).catch(()=>
            fbSet('mobileUsers/'+memPhone, {
              status: 'removed',
              role: 'removed',
              forceFreshLogin: true,
              clearedAt: new Date().toISOString(),
              demotedReason: 'manager_transferred'
            })
          ));
        });
        // mobileUsers: demote only outgoing manager keys (not all managers in company)
        try{
          const muAll = _cache.mobileUsers || {};
          Object.keys(muAll).forEach(mk => {
            const u = muAll[mk];
            if(!u || String(u.role||'').toLowerCase()!=='manager') return;
            const uk = _normMobileKey(u.mobile||u.phone||mk);
            if(!uk || uk === phoneKey) return;
            if(!outgoingMgrKeys.has(uk)) return;
            tasks.push(fbRemove('mobileUsers/'+uk).catch(()=>
              fbSet('mobileUsers/'+uk, {
                status: 'removed',
                role: 'removed',
                forceFreshLogin: true,
                clearedAt: new Date().toISOString(),
                demotedReason: 'manager_transferred'
              })
            ));
          });
        }catch(ex){}
        // Re-point every logged-in member's mobileUsers.managerId → new manager (Admin hierarchy uses this)
        try{
          let muAll = _cache.mobileUsers;
          if(!muAll){ try{ muAll = await fbGet('mobileUsers'); }catch(e){ muAll = {}; } }
          const oldMgrKeys = new Set();
          if(e){
            const op = _normMobileKey(e.managerId||e.phone||e.mobile||'');
            if(op) oldMgrKeys.add(op);
          }
          try{
            const sk = (typeof SESSION!=='undefined' && SESSION.role==='manager') ? _normMobileKey(SESSION.mobile||'') : '';
            if(sk) oldMgrKeys.add(sk);
          }catch(ex){}
          Object.entries(muAll||{}).forEach(([mk,u])=>{
            if(!u) return;
            const uk = _normMobileKey(u.mobile||u.phone||mk);
            if(!uk || uk===phoneKey) return;
            const mid = _normMobileKey(u.managerId||u.managerMobile||'');
            // STRICT: only users whose managerId is the outgoing manager
            if(mid && oldMgrKeys.has(mid)){
              tasks.push(fbUpdate('mobileUsers/'+uk, {
                managerId: phoneKey,
                managerName: update.name || (e && e.name) || '',
                previousManagerId: mid,
                updatedAt: new Date().toISOString()
              }).catch(()=>{}));
            }
          });
        }catch(ex){ console.warn('mu reassign', ex); }

        if(phoneKey.length >= 10){
          const muPath = 'mobileUsers/'+phoneKey;
          const muPayload = {
            role: 'manager',
            name: update.name || (e && e.name) || '',
            mobile: phoneKey,
            phone: phoneKey,
            status: 'approved',
            company: (e && (e.company||e.companyName)) || SESSION.company || '',
            companyId: cid || null,
            empObjId: empId,
            employeeId: empId,
            empId: update.empId || (e && e.empId) || '',
            updatedAt: new Date().toISOString()
          };
          tasks.push(fbUpdate(muPath, muPayload).catch(()=>fbSet(muPath, muPayload)));
        }
        await Promise.all(tasks.map(p => Promise.resolve(p).catch(err => console.warn('mgr transfer', err))));
        // Refresh cache
        try{ if(typeof loadEmployees === 'function') await loadEmployees(); }catch(ex){}
      }catch(xferErr){ console.warn('manager transfer', xferErr); }
    }
  }catch(err1){
    console.warn('saveEmployee fbUpdate failed, retry set merge', err1);
    const flat = {...update};
    if(flat.perms){
      flat.permSchedule = !!flat.perms.schedule;
      flat.permLeave = !!flat.perms.leave;
      flat.permReports = !!flat.perms.reports;
    }
    try{
      await fbUpdate('employees/'+empId, flat);
    }catch(err2){
      console.error('saveEmployee failed', err2);
      _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel);
      toast('❌ Save failed: '+(err2.message||err2.code||'permission/network'));
      return;
    }
  }

  // If Manager granted schedule/leave/reports, auto-approve their mobileUsers so they are not stuck as pending (Home/Schedule locked)
  try{
    const perms = (update && update.perms) || {};
    if(perms.schedule || perms.leave || perms.reports || perms.pending){
      const empRec = (_cache.employees||[]).find(x=>x.id===empId) || {};
      const phone = (typeof _normMobileKey==='function')
        ? _normMobileKey(update.phone || update.mobile || empRec.phone || empRec.mobile || '')
        : String(update.phone || empRec.phone || '').replace(/\D/g,'').slice(-10);
      if(phone && phone.length===10){
        const mu = await fbGet('mobileUsers/'+phone);
        if(mu && mu.role==='member' && mu.status==='pending'){
          await fbUpdate('mobileUsers/'+phone, {
            status: 'approved',
            pendingApproval: false,
            approvedAt: new Date().toISOString(),
            approvedBy: (SESSION && SESSION.mobile) || 'manager'
          });
        } else if(mu && mu.role==='member'){
          // Ensure flags clean
          await fbUpdate('mobileUsers/'+phone, { status: 'approved', pendingApproval: false });
        }
      }
    }
  }catch(apErr){ console.warn('[saveEmployee] auto-approve member', apErr); }

  // Patch local cache so UI updates immediately (before modal closes)
  try{
    if(!_cache.employees) _cache.employees = [];
    const ix = _cache.employees.findIndex(x=>x.id===empId);
    if(ix>=0) _cache.employees[ix] = {..._cache.employees[ix], ...update, id: empId};
    else _cache.employees.push({...update, id: empId});
  }catch(e){}

  // Close + toast NOW — secondary sync runs in background (feels instant)
  closeModal();
  try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
  toast(L('✅ जानकारी अपडेट हो गई','✅ Details updated'));

  // Background: mobileUsers + deviceApprovals — no fbGet (was the slow sequential read)
  (async ()=>{
    try{
      const oldPhone = e ? _normMobileKey(e.phone||e.mobile||'') : '';
      const newPhone = _normMobileKey(update.phone||'');
      const jobs = [];
      if(oldPhone && oldPhone.length===10 && oldPhone !== newPhone){
        jobs.push(
          fbUpdate('mobileUsers/'+oldPhone, {
            name: '',
            empId: null,
            empCode: null,
            empObjId: null,
            employeeId: null,
            status: 'left_team',
            leftAt: new Date().toISOString(),
            leftReason: 'phone_reassigned',
            reassignedToEmp: empId
          }).catch(e2=>console.warn('[saveEmp] clear old mobile', e2))
        );
      }
      if(newPhone && newPhone.length===10){
        jobs.push(
          fbUpdate('mobileUsers/'+newPhone, {
            name: update.name || nameVal,
            empId: update.empId || '',
            empCode: update.empId || '',
            empObjId: empId,
            employeeId: empId,
            phone: newPhone,
            mobile: newPhone,
            company: (e && e.company) || SESSION.company || '',
            section: update.section || update.sec || '',
            syncedAt: new Date().toISOString()
          }).catch(e2=>console.warn('[saveEmp] sync mobileUsers', e2))
        );
        jobs.push(
          fbUpdate('deviceApprovals/'+empId, {
            empName: update.name || nameVal,
            empId: update.empId || '',
            mobile: newPhone,
            updatedAt: new Date().toISOString()
          }).catch(()=>{})
        );
      }
      if(jobs.length) await Promise.all(jobs);
    }catch(eSync){ console.warn('[saveEmp] mobile sync', eSync); }
  })();

  }catch(err){
    console.error('saveEmployee', err);
    _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel);
    toast('❌ Save error: '+(err.message||err));
  }
}

function confirmDelEmp(id, name){
  if(!isAdmin() && !isMgr()){ toast('❌ Admin/Manager only'); return; }
  const safeName = String(name||'').replace(/</g,'').replace(/'/g,"\'");
  const safeId = String(id||'').replace(/'/g,"\'");
  const en = (typeof _lang!=='undefined' && _lang!=='hi');
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;padding:6px 0 10px">
    <div style="font-size:36px;margin-bottom:10px">🚪</div>
    <div class="modal-title">${en?('Remove '+safeName+' from team?'):(safeName+' को टीम से हटाएं?')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:16px">${en?'Member moves to Left Members — data is kept.':'यह कर्मचारी "Left Members" सूची में चला जाएगा — डेटा सुरक्षित रहेगा।'}</div>
    <div class="field" style="text-align:left">
      <label>${en?'Reason for leaving':'जाने का कारण'}</label>
      <select class="inp-field" id="exitReasonSel" onchange="document.getElementById('exitReasonOther').style.display=this.value==='other'?'block':'none'">
        <option value="resigned">🚶 ${en?'Resigned':'खुद छोड़ा (Resigned)'}</option>
        <option value="terminated">❌ ${en?'Terminated':'हटाया गया (Terminated)'}</option>
        <option value="contract_end">📋 ${en?'Contract ended':'Contract समाप्त'}</option>
        <option value="retired">🏖️ Retired</option>
        <option value="other">✏️ ${en?'Other':'अन्य कारण'}</option>
      </select>
    </div>
    <div class="field" id="exitReasonOther" style="text-align:left;display:none">
      <label>${en?'Type reason':'कारण लिखें'}</label>
      <input class="inp-field" id="exitReasonText" placeholder="${en?'Reason…':'कारण लिखें...'}">
    </div>
    <button class="big-btn red" onclick="archiveEmployee('${safeId}','${safeName}')">✅ ${en?'Yes, Delete':'हाँ, हटाएं'}</button>
    <button class="cancel-btn" onclick="closeModal()">${en?'Cancel':'रद्द करें'}</button>
  </div>`);
}

async function archiveEmployee(id, name){
  if(!isAdmin() && !isMgr()){ toast('❌ Admin/Manager only'); return; }
  const reasonSel = document.getElementById('exitReasonSel');
  const reasonOther = document.getElementById('exitReasonText');
  const reason = reasonSel ? (reasonSel.value === 'other' ? ((reasonOther && reasonOther.value) || 'Other') : reasonSel.value) : 'resigned';

  let empData = (typeof getEmps==='function' ? getEmps() : []).find(e => e && e.id === id)
    || ((_cache.employees||[]).find(e => e && e.id === id))
    || {};
  if(!empData.id){ empData = Object.assign({}, empData, { id, name: name || empData.name || '' }); }

  try{
    toast('⏳ Removing…');
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){
        toast((typeof L==='function')?L('❌ इस device पर Phone verify करें','❌ Verify phone on this device first'):'❌ Verify phone first');
        return;
      }
    }

    // Archive copy
    try{
      await fbSet('leftEmployees/' + id, {
        ...empData,
        id,
        name: empData.name || name || '',
        leftAt: new Date().toISOString(),
        leftReason: reason,
        archivedAt: Date.now(),
        removedBy: SESSION.name || SESSION.mobile || 'manager'
      });
    }catch(archErr){ console.warn('[archive] leftEmployees', archErr); }

    // Remove active record (or soft-delete)
    try{
      if(typeof fbRemove==='function') await fbRemove('employees/' + id);
      else await fbSet('employees/' + id, null);
    }catch(remErr){
      console.warn('[archive] hard remove failed → soft', remErr);
      try{
        await fbUpdate('employees/' + id, {
          status: 'resigned',
          leftAt: new Date().toISOString(),
          leftReason: reason,
          removedBy: SESSION.name || SESSION.mobile || 'manager',
          active: false
        });
      }catch(softErr){
        toast('❌ Delete failed: '+(softErr.message||softErr));
        return;
      }
    }

    // Local cache
    try{
      if(Array.isArray(_cache.employees)){
        _cache.employees = _cache.employees.filter(e => e && e.id !== id);
      }
    }catch(e){}

    // Clear mobileUsers identity so next login does not show this old name
    try{
      if(typeof _unlinkMobileUserOnLeave==='function'){
        await _unlinkMobileUserOnLeave({ ...empData, id, status: reason||'removed', phone: empData.phone||empData.mobile });
      }
    }catch(e){}
    try{
      const mob = (typeof _normMobileKey==='function')
        ? _normMobileKey(empData.phone||empData.mobile||'')
        : String(empData.phone||empData.mobile||'').replace(/\D/g,'').slice(-10);
      if(mob && mob.length===10){
        await fbUpdate('mobileUsers/'+mob, {
          name: '',
          empId: null,
          empCode: null,
          empObjId: null,
          employeeId: null,
          status: 'left_team',
          leftAt: new Date().toISOString(),
          leftReason: reason||'removed'
        });
      }
    }catch(e){}
    try{
      await fbUpdate('deviceApprovals/'+id, {
        empName: (name||empData.name||'')+' (left)',
        validTill: new Date(0).toISOString(),
        leftAt: new Date().toISOString()
      });
    }catch(e){}

    closeModal();
    toast('🚪 ' + (name||empData.name||'') + ' → Left Members');
    try{ renderTeam(document.querySelector('#teamSearch, input[oninput*=renderTeam]')?.value || ''); }catch(e){ try{ renderTeam(); }catch(e2){} }
    try{ renderLeftMembers(); }catch(e){}
  }catch(err){
    console.error('[archiveEmployee]', err);
    toast('❌ Delete failed: '+(err.message||err));
  }
}

async function delEmployee(id){
  // Legacy — now calls archive flow
  archiveEmployee(id, '');
}

let _leftMembersOpen = false;

function toggleLeftMembers(){
  _leftMembersOpen = !_leftMembersOpen;
  document.getElementById('leftMembersList').style.display = _leftMembersOpen ? 'block' : 'none';
  document.getElementById('leftMembersToggleIcon').textContent = _leftMembersOpen ? '▲' : '▼';
  if(_leftMembersOpen) renderLeftMembers();
}

async function renderLeftMembers(){
  const listEl = document.getElementById('leftMembersList');
  if(!listEl) return;

  listEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted)"><div style="animation:spin 1s linear infinite;display:inline-block;width:20px;height:20px;border:2px solid rgba(244,63,94,.3);border-top-color:#f43f5e;border-radius:50%"></div></div>';

  // Source 1: Firebase leftEmployees path (properly resigned/archived)
  const raw = await fbGet('leftEmployees').catch(() => null);
  let leftList = raw ? Object.entries(raw).map(([k,v]) => ({...v, _fbKey:k, id:k})) : [];

  // Scope: Manager sees only THEIR left members; Admin sees company-scoped
  const _leftBelongsHere = (rec) => {
    if(!rec) return false;
    try{
      if(typeof isAdmin === 'function' && isAdmin()){
        const cid = (SESSION && SESSION.viewCompanyId) || 'ALL';
        if(!cid || cid === 'ALL') return true;
        const n = (typeof _normCompanyId==='function') ? _normCompanyId(rec.companyId||rec.company||'') : String(rec.companyId||rec.company||'').toLowerCase();
        const want = (typeof _normCompanyId==='function') ? _normCompanyId(cid) : String(cid).toLowerCase();
        // Strict: missing company does not match a specific company filter
        if(!n || n === 'default') return false;
        return n === want;
      }
      if(SESSION && SESSION.role === 'manager' && SESSION.mobile){
        const key = (typeof _normMobileKey==='function') ? _normMobileKey(SESSION.mobile) : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
        const mid = (typeof _normMobileKey==='function') ? _normMobileKey(rec.managerId||rec.managerMobile||rec.mgrId||'') : String(rec.managerId||'').replace(/\D/g,'').slice(-10);
        if(mid && mid === key) return true;
        // Legacy rows without managerId: do NOT show (prevents cross-manager leak)
        return false;
      }
    }catch(e){}
    return false;
  };
  leftList = leftList.filter(_leftBelongsHere);

  // Source 2: full employee cache (NOT getEmps — that hides left/resigned for managers)
  const LEFT_STATUSES = new Set(['resigned','left','left_team','removed','revoked']);
  const allEmps = (_cache.employees || []).concat(
    (typeof getEmps==='function' ? getEmps() : [])
  );
  const seenIds = new Set(leftList.map(l => l.id || l._fbKey).filter(Boolean));
  allEmps.forEach(e => {
    if(!e || !e.id) return;
    if(seenIds.has(e.id)) return;
    const st = String(e.status||'').toLowerCase();
    if(!LEFT_STATUSES.has(st) && e.active !== false) return;
    if(!_leftBelongsHere(e)) return;
    seenIds.add(e.id);
    leftList.push({
      ...e,
      _fromCache: true,
      leftReason: e.leftReason || st || 'left',
      leftAt: e.leftAt || e.updatedAt || e.demotedAt || null
    });
  });

  // Source 3: mobileUsers marked left / demoted-after-transfer (ex-managers who left)
  try{
    let mu = _cache.mobileUsers;
    if(!mu) mu = await fbGet('mobileUsers').catch(()=>null);
    if(mu){
      Object.entries(mu).forEach(([k,v])=>{
        if(!v) return;
        const st = String(v.status||'').toLowerCase();
        // Only if explicitly left — not mere demote to member still active
        if(!LEFT_STATUSES.has(st) && !v.leftAt) return;
        const id = v.empObjId || v.employeeId || ('mu_'+k);
        if(seenIds.has(id) || seenIds.has(k)) return;
        const cand = {
          id,
          name: v.name || k,
          phone: v.mobile || v.phone || k,
          mobile: v.mobile || v.phone || k,
          managerId: v.managerId || v.managerMobile || '',
          companyId: v.company || v.companyId || '',
          company: v.company || ''
        };
        if(!_leftBelongsHere(cand)) return;
        seenIds.add(id);
        leftList.push({
          id,
          name: v.name || k,
          phone: v.mobile || v.phone || k,
          mobile: v.mobile || v.phone || k,
          empId: v.empId || v.empCode || '',
          company: v.company || '',
          leftReason: v.leftReason || st || 'left',
          leftAt: v.leftAt || v.demotedAt || v.updatedAt || null,
          _fromMobileUsers: true
        });
      });
    }
  }catch(e){}

  // If still empty, seed with DEFAULT_LEFT_EMP
  if(leftList.length === 0 && typeof DEFAULT_LEFT_EMP !== 'undefined'){
    leftList = DEFAULT_LEFT_EMP.map(e => ({...e}));
  }

  // Update count badge
  const countEl = document.getElementById('leftMemberCount');
  if(countEl) countEl.textContent = leftList.length;

  if(leftList.length === 0){
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">🎉 '+(typeof L==='function'?L('कोई भी Left नहीं हुआ','No one has left'):'No one has left')+'</div>';
    return;
  }

  const _enLeft = (typeof _lang!=='undefined' && _lang && _lang!=='hi');
  const reasonLabel = _enLeft
    ? { resigned:'Resigned', terminated:'Terminated', contract_end:'Contract ended', retired:'Retired', other:'Other' }
    : { resigned:'खुद छोड़ा', terminated:'हटाया गया', contract_end:'Contract समाप्त', retired:'Retired', other:'अन्य' };

  // Sort by leftAt descending
  leftList.sort((a,b) => new Date(b.leftAt||0) - new Date(a.leftAt||0));

  // Group by section
  const SEC_ORDER = ['M1','M2','S1','S2','SUP','MGR'];
  const secGroups = {};
  leftList.forEach(e => {
    const k = e.sec || 'OTHER';
    if(!secGroups[k]) secGroups[k] = [];
    secGroups[k].push(e);
  });

  let html = `<div style="font-size:11px;color:var(--muted2);margin-bottom:8px;font-weight:700">${typeof L==='function'?L('कुल '+leftList.length+' कर्मचारी · विभाग के अनुसार:','Total '+leftList.length+' employees · Section-wise:'):(leftList.length+' employees · Section-wise:')}</div>`;
  
  const renderOrder = [...SEC_ORDER, ...Object.keys(secGroups).filter(k => !SEC_ORDER.includes(k))];
  renderOrder.forEach(sec => {
    const members = secGroups[sec];
    if(!members || !members.length) return;
    const s = getSectionMeta(sec);
    const secTitle = (typeof secName==='function'?secName(sec):null) || ((_enLeft?(s.label||sec):(s.hi||s.label||sec)));
    html += `<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${s.color};margin:10px 0 6px;display:flex;align-items:center;gap:6px">${s.icon||'👤'} ${secTitle} <span style="background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.2);border-radius:4px;padding:1px 6px;font-size:9px;color:var(--lv)">${members.length}</span></div>`;
    html += members.map(e => {
      const ini = (e.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const leftDate = e.leftAt ? new Date(e.leftAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
      const joinDate = e.joiningDate ? new Date(e.joiningDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : null;
      const reason = reasonLabel[e.leftReason] || e.leftReason || (_enLeft?'Unknown':'अज्ञात');

      return `<div class="left-card">
        <div class="left-avatar">${ini}</div>
        <div style="flex:1;min-width:0">
          <div class="left-name">${escHtml(e.name||'—')}</div>
          <div class="left-meta">${escHtml(e.empId||'—')} · ${escHtml(e.mc||'—')} · ${escHtml(e.designation||'—')}</div>
          ${joinDate ? `<div class="left-meta">📅 Joined: ${joinDate}</div>` : ''}
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">
            <span class="left-exit">🚪 Left: ${leftDate}</span>
            <span style="font-size:10px;color:var(--muted2)">${_enLeft?'Reason: ':'कारण: '}${escHtml(reason)}</span>
          </div>
        </div>
        ${isAdmin() && !e._fromCache ? `<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
          <button onclick="restoreEmployee('${e.id}','${escHtml(e.name||'')}')" style="padding:6px 9px;font-size:11px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:7px;color:#22c55e;cursor:pointer;font-weight:700">↩️ ${_enLeft?'Restore':'वापस'}</button>
          <button onclick="permanentDeleteEmp('${e.id}','${escHtml(e.name||'')}')" style="padding:6px 9px;font-size:11px;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:7px;color:#f43f5e;cursor:pointer;font-weight:700">🗑️</button>
        </div>` : ''}
      </div>`;
    }).join('');
  });

  listEl.innerHTML = html;
}

async function restoreEmployee(id, name){
  const raw = await fbGet('leftEmployees/' + id).catch(()=>null);
  if(!raw){ toast(L('❌ Data नहीं मिला','❌ Data not found')); return; }
  // Remove leftAt/leftReason/archivedAt fields and restore to active employees
  const { leftAt, leftReason, archivedAt, ...empData } = raw;
  empData.status = 'active';
  await fbSet('employees/' + id, empData);
  await fbRemove('leftEmployees/' + id);
  toast('✅ ' + name + L(' वापस टीम में आ गए!',' is back on the team!'));
  renderTeam();
  renderLeftMembers();
}

async function permanentDeleteEmp(id, name){
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;padding:10px 0">
    <div style="font-size:36px;margin-bottom:10px">⚠️</div>
    <div class="modal-title">${name} का डेटा हमेशा के लिए हटाएं?</div>
    <div style="font-size:12px;color:#f43f5e;margin-bottom:20px;font-weight:700">यह वापस नहीं होगा!</div>
    <button class="big-btn red" onclick="doPermDelete('${id}','${name}')">हाँ, हमेशा के लिए हटाएं</button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>
  </div>`);
}

async function doPermDelete(id, name){
  await fbRemove('leftEmployees/' + id);
  closeModal();
  toast('🗑️ ' + name + L(' का डेटा हमेशा के लिए हटाया',' data permanently deleted'));
  renderLeftMembers();
}


// ── Manager: delete ALL team members (OTP verified) ──
let _deleteAllConfirmResult = null;
let _deleteAllInProgress = false;
let _deleteAllMobile = ''; // mobile used for this OTP session

/** Resolve a 10-digit manager mobile from SESSION / emp / known contacts */
function _resolveManagerMobile(){
  // Always last-10 digits. SESSION.mobile is often "+91XXXXXXXXXX" (12 digits) —
  // old length===10 check failed and wrongly fell through to support UPI number.
  const dig10 = (v) => {
    const d = String(v||'').replace(/\D/g,'');
    return d.length >= 10 ? d.slice(-10) : '';
  };
  let m = dig10(SESSION.mobile) || dig10(SESSION.phone);
  if(m) return m;
  // Login-time phone (most reliable for who is actually signed in)
  try{ m = dig10(localStorage.getItem('mp_device_phone')); if(m) return m; }catch(e){}
  try{ m = dig10(localStorage.getItem('mp_login_mobile')); if(m) return m; }catch(e){}
  try{
    const emp = (typeof myEmp==='function') ? myEmp() : null;
    if(emp){
      m = dig10(emp.phone || emp.mobile);
      if(m) return m;
    }
  }catch(e){}
  // NEVER use CFG.contactVivek / support UPI for security OTP
  return '';
}

async function startDeleteAllMembersFlow(){
  if(SESSION.role !== 'manager' && !isMgr()){ toast('⚠️ Only Manager can do this'); return; }
  const team = getEmps().filter(e => e.status !== 'left' && e.status !== 'resigned');
  if(!team.length){ toast('ℹ️ No team members to delete'); return; }

  let mobile = _resolveManagerMobile();

  // If still no mobile — ask manager to enter it
  if(mobile.length !== 10){
    openModal(`<div class="modal-handle"></div>
      <div class="modal-title">📱 Mobile Required for OTP</div>
      <div style="font-size:13px;color:var(--muted2);margin-bottom:14px;line-height:1.5">
        Profile पर mobile number नहीं मिला। OTP भेजने के लिए अपना 10-digit mobile डालें।
        यह number session में save हो जाएगा।
      </div>
      <div class="field">
        <label>Manager Mobile (10 digits)</label>
        <input type="tel" id="delAllMobileInput" maxlength="10" inputmode="numeric" placeholder="10 digit mobile"
          style="width:100%;font-size:18px;font-weight:800;letter-spacing:2px;text-align:center"
          oninput="this.value=this.value.replace(/\\D/g,'').slice(0,10)">
      </div>
      <button class="submit-btn" style="margin-top:12px;background:#e11d48" onclick="_proceedDeleteAllWithEnteredMobile()">📲 Continue — Send OTP</button>
      <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">Cancel</button>`);
    return;
  }

  const ok = await confirmModal(
    '⚠️ Delete entire team?',
    `This will permanently remove <b style="color:#f43f5e">${team.length} members</b> from your team and clear their data from Team list.<br><br>
     <b>Next step:</b> OTP will be sent to your registered mobile <b>+91-${mobile}</b>.`,
    '📲 Continue — Send OTP',
    'Cancel',
    'big-btn red'
  );
  if(!ok) return;

  mobile = String(mobile||'').replace(/\D/g,'').slice(-10);
  _deleteAllMobile = mobile;
  // Always keep session mobile as 10-digit login identity
  SESSION.mobile = mobile;
  try{ saveSession(); }catch(e){}
  try{ localStorage.setItem('mp_login_mobile', mobile); }catch(e){}
  await _openDeleteAllOtpModal(team.length, mobile);
}

async function _proceedDeleteAllWithEnteredMobile(){
  const mobile = String(document.getElementById('delAllMobileInput')?.value||'').replace(/\D/g,'');
  if(mobile.length !== 10){ toast(L('⚠️ 10 अंकों का valid mobile डालें','⚠️ Enter a valid 10-digit mobile')); return; }
  const team = getEmps().filter(e => e.status !== 'left' && e.status !== 'resigned');
  _deleteAllMobile = mobile;
  SESSION.mobile = mobile;
  try{ saveSession(); }catch(e){}
  // Best-effort: update employee record phone
  try{
    if(SESSION.empObjId){
      await fbUpdate('employees/'+SESSION.empObjId, { phone: mobile, mobile: mobile });
    }
  }catch(e){ console.warn('Could not save mobile to emp profile', e); }
  closeModal();
  await _openDeleteAllOtpModal(team.length, mobile);
}

async function _openDeleteAllOtpModal(teamCount, mobile){
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🔐 OTP Verify — Delete All Members</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      OTP will be sent to <b style="color:var(--text)">+91-${mobile}</b>. Enter it below to confirm deletion of <b style="color:#f43f5e">${teamCount}</b> members.
    </div>
    <div id="delAllStatus" style="font-size:12px;color:#f59e0b;margin-bottom:10px">⏳ Sending OTP…</div>
    <div class="field">
      <label>OTP (6 digits)</label>
      <input type="text" id="delAllOtpInput" maxlength="6" inputmode="numeric" autocomplete="one-time-code" name="one-time-code" placeholder="••••••"
        style="width:100%;letter-spacing:6px;font-size:20px;font-weight:900;text-align:center"
        oninput="this.value=this.value.replace(/\\D/g,'').slice(0,6)">
    </div>
    <div id="recaptcha-container-delall"></div>
    <button class="submit-btn" style="margin-top:12px;background:#e11d48" onclick="_confirmDeleteAllWithOtp()">🗑️ Verify OTP & Delete All</button>
    <button class="cancel-btn" style="margin-top:8px" onclick="_resendDeleteAllOtp()">🔄 Resend OTP</button>
    <button class="cancel-btn" style="margin-top:8px" onclick="_cancelDeleteAllFlow()">Cancel</button>`);

  try{
    _deleteAllConfirmResult = await _fbSendPhoneOtp('+91'+mobile, 'recaptcha-container-delall', '_fbRecaptchaDelAll');
    const st = document.getElementById('delAllStatus');
    if(st) st.innerHTML = '✅ OTP sent to +91-'+mobile;
    toast('✅ OTP sent');
  }catch(err){
    console.error('Delete-all OTP error', err);
    const st = document.getElementById('delAllStatus');
    if(st) st.innerHTML = '❌ '+_fbOtpErrorMessage(err);
    toast('❌ '+_fbOtpErrorMessage(err));
  }
}

async function _resendDeleteAllOtp(){
  const mobile = _deleteAllMobile || _resolveManagerMobile();
  if(mobile.length!==10){ toast('⚠️ Manager mobile missing'); return; }
  const st = document.getElementById('delAllStatus');
  if(st) st.textContent = '⏳ Resending OTP…';
  try{
    _deleteAllConfirmResult = await _fbSendPhoneOtp('+91'+mobile, 'recaptcha-container-delall', '_fbRecaptchaDelAll');
    if(st) st.innerHTML = '✅ OTP resent to +91-'+mobile;
    toast('✅ OTP resent');
  }catch(err){
    if(st) st.innerHTML = '❌ '+_fbOtpErrorMessage(err);
    toast('❌ '+_fbOtpErrorMessage(err));
  }
}

function _cancelDeleteAllFlow(){
  _deleteAllConfirmResult = null;
  _deleteAllMobile = '';
  try{ if(window._fbRecaptchaDelAll){ window._fbRecaptchaDelAll.clear(); window._fbRecaptchaDelAll=null; } }catch(e){}
  closeModal();
}

async function _confirmDeleteAllWithOtp(){
  if(_deleteAllInProgress) return;
  const otp = (document.getElementById('delAllOtpInput')?.value||'').trim();
  if(otp.length !== 6){ toast('⚠️ Enter 6-digit OTP'); return; }
  if(!_deleteAllConfirmResult){ toast('⚠️ OTP session expired — start again'); return; }

  _deleteAllInProgress = true;
  const st = document.getElementById('delAllStatus');
  if(st) st.textContent = '⏳ Verifying OTP…';

  try{
    await _fbVerifyPhoneOtp(_deleteAllConfirmResult, otp);
  }catch(err){
    _deleteAllInProgress = false;
    console.error(err);
    const msg = _fbOtpErrorMessage(err);
    toast('❌ '+msg);
    if(st) st.textContent = '❌ '+msg;
    return;
  }

  // OTP OK — delete all team members owned by this manager
  if(st) st.textContent = '⏳ Deleting members…';
  const team = getEmps();
  let removed = 0, failed = 0;
  const mgrKey = (_deleteAllMobile || SESSION.mobile) ? _normMobileKey(_deleteAllMobile || SESSION.mobile) : '';
  try{
    if(typeof backupBeforeAccountDelete==='function'){
      await backupBeforeAccountDelete({
        mobile: mgrKey || (SESSION.mobile||''),
        deletedBy: SESSION.name || 'manager',
        reason: 'delete_all_members',
        company: SESSION.company || SESSION.companyId || '',
        managerName: SESSION.name || '',
        employees: team.slice()
      });
    }
  }catch(_bak){ console.warn('[deleteAll] backup', _bak); }

  const removedIds = new Set();
  const removedCodes = new Set();
  for(const emp of team){
    try{
      // safety: only own team
      if(mgrKey && emp.managerId && emp.managerId !== mgrKey) continue;
      try{
        if(typeof fbRemove === 'function') await fbRemove('employees/'+emp.id);
        else await fbSet('employees/'+emp.id, null);
      }catch(rmErr){
        // fallback null write
        try{ await fbSet('employees/'+emp.id, null); }catch(e2){ throw rmErr; }
      }
      removedIds.add(String(emp.id));
      if(emp.empId) removedCodes.add(String(emp.empId).trim().toUpperCase());
      removed++;
    }catch(e){
      failed++;
      console.error('delete member', emp.id, e);
    }
  }
  // _cache.employees is an ARRAY — must filter, not delete by id key
  try{
    if(_cache && Array.isArray(_cache.employees)){
      _cache.employees = _cache.employees.filter(e => {
        if(!e) return false;
        if(removedIds.has(String(e.id))) return false;
        if(e.empId && removedCodes.has(String(e.empId).trim().toUpperCase())) return false;
        // also drop any remaining roster under this manager
        if(mgrKey && e.managerId && String(e.managerId) === String(mgrKey) && !removedIds.has(String(e.id))){
          // keep only if delete failed for this one
          return true;
        }
        return true;
      });
      // Second pass: drop all that we successfully removed by manager scope
      if(removed > 0 && failed === 0 && mgrKey){
        _cache.employees = _cache.employees.filter(e => {
          if(!e) return false;
          if(removedIds.has(String(e.id))) return false;
          if(e.empId && removedCodes.has(String(e.empId).trim().toUpperCase())) return false;
          const mid = (typeof _normMobileKey==='function'?_normMobileKey(e.managerId||''):String(e.managerId||''));
          if(mid && mid === mgrKey) return false; // full wipe of this manager's roster on total success
          return true;
        });
      }
    } else if(_cache && _cache.employees && typeof _cache.employees === 'object'){
      removedIds.forEach(id => { try{ delete _cache.employees[id]; }catch(e){} });
    }
  }catch(e){ console.warn('[deleteAll] cache cleanup', e); }

  // Optional: strip schedule entries for deleted emp ids (best-effort)
  try{
    const schedules = getSchedules() || {};
    for(const mk of Object.keys(schedules)){
      const month = schedules[mk];
      if(!month || typeof month !== 'object') continue;
      let changed = false;
      const copy = { ...month };
      team.forEach(emp=>{
        if(copy[emp.id]){ delete copy[emp.id]; changed = true; }
        if(emp.empId && copy[emp.empId]){ delete copy[emp.empId]; changed = true; }
      });
      if(changed){
        await fbSet('schedules/'+mk, copy);
        if(_cache && _cache.schedules) _cache.schedules[mk] = copy;
      }
    }
  }catch(e){ console.warn('schedule cleanup', e); }

  _deleteAllConfirmResult = null;
  _deleteAllInProgress = false;
  _deleteAllMobile = '';
  try{ if(window._fbRecaptchaDelAll){ window._fbRecaptchaDelAll.clear(); window._fbRecaptchaDelAll=null; } }catch(e){}
  closeModal();
  toast(`🗑️ Deleted ${removed} members` + (failed ? `, ${failed} failed` : ''));
  try{ renderTeam(); }catch(e){}
  try{ refreshAll(); }catch(e){}
  try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
}



/** Normalize Excel header cell for matching */
function _normHeaderCell(h){
  return String(h||'').toLowerCase().trim()
    .replace(/[₹$]/g,'')
    .replace(/\(.*?\)/g,'')
    .replace(/[_\.\/\-]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
/**
 * Map spreadsheet headers → column indexes.
 * Supports: Emp ID, Employee Code, Mobile, Machine, Salary (₹/month), etc.
 */
function _mapExcelColumns(headerRow){
  const header = (headerRow||[]).map(_normHeaderCell);
  const aliases = {
    name:        ['name','naam','employee name','emp name','full name','worker name'],
    code:        ['emp id','empid','emp code','employee code','employee id','e code','ecode','code','id','emp no','emp number','employee no','e. code','emp. code'],
    mobile:      ['mobile','mobile no','mobile number','phone','phone no','phone number','contact','contact no','मोबाइल','mobile no.'],
    designation: ['designation','desig','role','position','post','पद'],
    machine:     ['machine','mc','machine name','section machine','मशीन'],
    section:     ['department','dept','section','sec','department section','dept section','सेक्शन','विभाग','area','unit'],
    responsibility: ['responsibility','responsibilities','duty','job'],
    doj:         ['joining date','joining','date of joining','doj','join date'],
    dob:         ['date of birth','dob','birth date','d.o.b','birthdate'],
    woff:        ['weekly off','weekly off day','woff','week off','off day','w off','weeklyoff'],
    salary:      ['salary','monthly salary','basic salary','ctc','gross','net pay','wage','pay','वेतन','sal','salary (₹/month)','salary (rs/month)'],
  };
  const colMap = {};
  Object.entries(aliases).forEach(([key, list])=>{
    let idx = -1;
    // Pass 1: exact match any column
    for(const a of list){
      idx = header.findIndex(h => h === a);
      if(idx >= 0) break;
    }
    // Pass 2: header contains alias OR alias contains header (any column position)
    if(idx < 0){
      for(const a of list){
        idx = header.findIndex(h => h && (h.includes(a) || (a.length>=3 && a.includes(h))));
        if(idx >= 0) break;
      }
    }
    // Pass 3: fuzzy tokens
    if(idx < 0 && key === 'code'){
      idx = header.findIndex(h => /emp/.test(h) && /(id|code|no|number)/.test(h));
    }
    if(idx < 0 && key === 'section'){
      idx = header.findIndex(h => /section|sec\b|dept|department|area|unit|सेक्शन/.test(h));
    }
    if(idx < 0 && key === 'mobile'){
      idx = header.findIndex(h => /mobile|phone|contact|whatsapp|मोबाइल/.test(h));
    }
    colMap[key] = idx;
  });
  return { header, colMap };
}

// ════════════════════════════════════════



// ═══════════════════════════════════════════════════════════
// PHONE TRANSFER REQUESTS — already-registered mobile flow
// kinds: manager_with_team | manager_solo | member_other_team | member_same_team
// RULE: manager_with_team MUST pick a successor (another team mobile) before leaving.
// ═══════════════════════════════════════════════════════════

function _teamMembersUnderManager(mgrPhone){
  const key = _normMobileKey(mgrPhone||'');
  const all = (_cache && _cache.employees) || [];
  return all.filter(function(e){
    if(!e || e.status==='resigned' || e.status==='left' || e.status==='removed') return false;
    return _normMobileKey(e.managerId||'') === key;
  });
}

function _isManagerWithTeamNow(){
  try{
    if(typeof isMgr==='function' && !isMgr()) return false;
    const myKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(!myKey) return false;
    const members = _teamMembersUnderManager(myKey).filter(function(e){
      return _normMobileKey(e.phone||e.mobile||'') !== myKey;
    });
    return members.length > 0;
  }catch(e){ return false; }
}

function openPhoneTransferModal(opts){
  opts = opts || {};
  const clash = opts.clash || {};
  const emp = clash.emp || {};
  const kind = clash.kind || (clash.isManager ? 'manager_solo' : 'member_other_team');
  const phone = opts.phone || emp.phone || '';
  const nm = emp.name || emp.empId || phone;
  const title = (typeof L==='function'?L('📱 नंबर पहले से registered','📱 Number already registered'):'📱 Number already registered');
  let body = '';
  let canRequest = true;
  if(kind === 'manager_with_team'){
    body = (typeof L==='function'?L(
      nm+' पहले से Manager है और उनके पास team है। सीधे add नहीं हो सकता। Request भेज सकते हैं। वे accept करने से पहले अपनी team में किसी दूसरे mobile को नया Manager बनाना अनिवार्य है — उसके बाद वे आपकी team में member के रूप में join करेंगे। पुरानी तारीखों के shifts केवल उनको और आपको दिखेंगे।',
      nm+' is already a Manager with a team. They cannot be added directly. You can send a request. Before they accept, they must transfer the Manager role to another mobile number on their team — then they join yours as a member. Old-date shifts stay visible only to them and you.'
    ):'');
  } else if(kind === 'manager_solo'){
    body = (typeof L==='function'?L(
      nm+' Manager account है (individual)। Request accept करने पर उनका पुराना manager account हटेगा और वे आपकी team में member बनेंगे। पुराने shifts transfer होंगे।',
      nm+' has a Manager (individual) account. On accept their manager account is closed and they join your team as a member. Old shifts transfer with them.'
    ):'');
  } else if(kind === 'member_other_team'){
    body = (typeof L==='function'?L(
      nm+' पहले से किसी दूसरी team में member हैं। Request accept करने पर वे पुरानी team छोड़कर आपकी team join करेंगे। पुराने shifts उनके साथ रहेंगे (केवल वे + आप देख सकेंगे)।',
      nm+' is already a member of another team. On accept they leave that team and join yours. Old shifts stay with them (visible only to them + you).'
    ):'');
  } else if(kind === 'member_same_team'){
    body = (typeof L==='function'?L('यह नंबर पहले से आपकी team में है।','This number is already on your team.'):'Already on your team.');
    canRequest = false;
  } else {
    body = (typeof L==='function'?L('यह मोबाइल नंबर पहले से app में registered है।','This mobile is already registered in the app.'):'Already registered.');
  }
  const esc = (typeof escHtml==='function'?escHtml:function(s){return String(s||'').replace(/</g,'&lt;');});
  const html = '<div class="modal-handle"></div>'
    + '<div class="modal-title">'+title+'</div>'
    + '<div style="font-size:13px;color:var(--text);line-height:1.55;margin:8px 0 14px">'+body+'</div>'
    + '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px">📱 '+esc(String(phone))+' · <b>'+esc(String(nm))+'</b></div>'
    + (canRequest
      ? '<button type="button" class="submit-btn" id="mpSendTransferBtn">'+(typeof L==='function'?L('📨 Transfer request भेजें','📨 Send transfer request'):'Send transfer request')+'</button>'
      : '')
    + '<button type="button" class="cancel-btn" onclick="closeModal()">'+(typeof L==='function'?L('ठीक है','OK'):'OK')+'</button>';
  try{ openModal(html); }catch(e){ toast(body); }
  try{
    const btn = document.getElementById('mpSendTransferBtn');
    if(btn){
      btn.onclick = function(){
        sendTeamTransferRequest({phone:String(phone), kind:kind, targetEmpId:emp.id||null, targetName:nm});
      };
    }
  }catch(e){}
}

async function sendTeamTransferRequest(payload){
  try{
    if(!payload||!payload.phone){ toast(typeof L==='function'?L('❌ Phone missing','❌ Phone missing'):'Phone missing'); return; }
    const phone = _normMobileKey(payload.phone);
    const fromMgr = _normMobileKey(SESSION.mobile||'');
    if(!fromMgr){ toast(typeof L==='function'?L('❌ Manager login required','❌ Manager login required'):'Manager login required'); return; }
    const req = {
      phone: phone,
      kind: payload.kind || 'member_other_team',
      targetEmpId: payload.targetEmpId || null,
      targetName: payload.targetName || '',
      fromManagerId: fromMgr,
      fromManagerName: SESSION.name || SESSION.displayName || 'Manager',
      fromCompanyId: (typeof myCompanyId==='function'?myCompanyId():'') || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      shiftVisibility: 'target_and_new_manager',
      // Target manager_with_team must appoint successor before accept
      requiresSuccessor: payload.kind === 'manager_with_team'
    };
    await fbPush('teamTransferRequests', req);
    try{ if(typeof renderTeamPendingTransfers==='function') await renderTeamPendingTransfers(); }catch(e){}
    try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
    try{
      if(payload.targetEmpId){
        await fbPush('userNotifications/'+payload.targetEmpId, {
          title: (typeof L==='function'?L('Team transfer request','Team transfer request'):'Team transfer request'),
          body: (typeof L==='function'?L((SESSION.name||'Manager')+' ने आपको अपनी team में join करने का request भेजा है।','A manager invited you to join their team.'):'Team invite'),
          type: 'team_transfer',
          read: false,
          at: new Date().toISOString()
        });
      }
      // Also notify by mobileUsers path
      await fbPush('userNotifications/'+phone, {
        title: (typeof L==='function'?L('Team transfer request','Team transfer request'):'Team transfer request'),
        body: (typeof L==='function'?L((SESSION.name||'Manager')+' invited you to their team.','A manager invited you to their team.'):'Team invite'),
        type: 'team_transfer',
        read: false,
        at: new Date().toISOString()
      });
    }catch(e){}
    try{ closeModal(); }catch(e){}
    toast(typeof L==='function'?L('✅ Request भेज दी — accept करने पर team transfer होगा','✅ Request sent — transfer completes when they accept'):'Request sent');
  }catch(e){
    console.warn('[transfer req]', e);
    toast('❌ '+(e&&e.message||e));
  }
}

/** Entry: accept transfer. If current user still leads a team, force successor handoff first. */
async function acceptTeamTransferRequest(reqKey, req){
  try{
    if(!reqKey||!req) return;
    const kind = req.kind || '';
    const hasTeam = (kind === 'manager_with_team') || _isManagerWithTeamNow() || !!req.requiresSuccessor;
    if(hasTeam){
      // Only force successor picker when at least one OTHER member has a valid 10-digit mobile
      openTransferAcceptSuccessorModal(reqKey, req);
      return;
    }
    // Solo manager / no other members → join directly
    await _finalizeJoinAsMemberAfterTransfer(reqKey, req, null);
  }catch(e){
    console.warn('[accept transfer]', e);
    toast('❌ '+(e&&e.message||e));
  }
}

/** Mandatory UI: pick who leads the old team before this manager can leave. */
function openTransferAcceptSuccessorModal(reqKey, req){
  const myKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const ranked = (typeof _rankManagerSuccessors==='function')
    ? _rankManagerSuccessors()
    : _teamMembersUnderManager(myKey).map(function(e){
        const ph = _normMobileKey(e.phone||e.mobile||'');
        return { emp:e, phone:ph, eligible: ph.length===10, score: ph.length===10?50:0 };
      }).sort(function(a,b){ return b.score-a.score; });
  const eligible = ranked.filter(function(r){ return r.eligible && r.phone !== myKey; });
  const esc = (typeof escHtml==='function'?escHtml:function(s){return String(s||'').replace(/</g,'&lt;');});
  const fromName = (req && (req.fromManagerName||req.fromManagerId)) || 'Manager';

  if(!eligible.length){
    // No other mobile on roster → do NOT block. Offer accept; remaining members move under the inviting Manager.
    const remaining = _teamMembersUnderManager(myKey).filter(function(e){
      return e && _normMobileKey(e.phone||e.mobile||'') !== myKey;
    });
    const remNames = remaining.slice(0,6).map(function(e){ return esc(e.name||e.empId||'member'); }).join(', ')
      + (remaining.length > 6 ? (' +'+(remaining.length-6)) : '');
    openModal('<div class="modal-handle"></div>'
      +'<div class="modal-title">'+(typeof L==='function'?L('✅ Successor की जरूरत नहीं','✅ No successor needed'):'No successor needed')+'</div>'
      +'<div style="font-size:13px;line-height:1.55;color:var(--text);margin:8px 0 14px">'
      +(typeof L==='function'?L(
        'आपकी team में किसी दूसरे सदस्य के पास valid 10-digit mobile नहीं है, इसलिए नया Manager designate करने की जरूरत नहीं। Accept करने पर:'
        +'<br><br>• आप <b>'+esc(fromName)+'</b> की team में <b>member</b> बनेंगे।'
        +(remaining.length
          ? ('<br>• आपके बाकी members ('+remNames+') भी उसी Manager के नीचे चले जाएंगे — बिना leader नहीं छोड़ेंगे।')
          : '<br>• आपकी team में और member नहीं हैं।'),
        'No other team member has a valid 10-digit mobile, so you do not need to appoint a successor. On Accept:'
        +'<br><br>• You join <b>'+esc(fromName)+'</b>\'s team as a <b>member</b>.'
        +(remaining.length
          ? ('<br>• Your remaining members ('+remNames+') also move under that Manager — they will not be left without a leader.')
          : '<br>• You have no other team members.')
      ):'')
      +'</div>'
      +'<button type="button" class="submit-btn" id="mpAcceptNoSuccBtn">'+(typeof L==='function'?L('✅ Accept — join as member','✅ Accept — join as member'):'Accept')+'</button>'
      +'<button type="button" class="cancel-btn" style="margin-top:8px" onclick="closeModal()">'+(typeof L==='function'?L('अभी नहीं','Not now'):'Not now')+'</button>');
    try{
      const b = document.getElementById('mpAcceptNoSuccBtn');
      if(b) b.onclick = function(){ confirmTransferAcceptWithoutSuccessor(reqKey, req); };
    }catch(e){}
    return;
  }

  const opts = eligible.map(function(r){
    const e = r.emp;
    const lab = esc((e.name||'')+' · '+(r.phone||'')+(e.empId?(' · '+e.empId):''));
    return '<option value="'+esc(e.id)+'">'+lab+'</option>';
  }).join('');

  openModal('<div class="modal-handle"></div>'
    +'<div class="modal-title">'+(typeof L==='function'?L('🏅 नया Manager चुनें (अनिवार्य)','🏅 Choose new Manager (required)'):'Choose new Manager')+'</div>'
    +'<div style="font-size:13px;line-height:1.55;color:var(--text);margin:8px 0 12px">'
    +(typeof L==='function'?L(
      fromName+' की team में join करने से पहले आपको अपनी वर्तमान team का Manager role किसी दूसरे member (mobile) को देना अनिवार्य है। Accept के बाद आप उनकी team में member बनेंगे; पुरानी team नए Manager के अधीन रहेगी।',
      'Before joining '+fromName+'’s team, you must transfer your Manager role to another member (mobile) on your current team. After accept you join as a member; your old team continues under the new Manager.'
    ):'')
    +'</div>'
    +'<label style="font-size:11px;font-weight:800;color:var(--muted2)">'+(typeof L==='function'?L('नया Manager (team member)','New Manager (team member)') : 'New Manager')+'</label>'
    +'<select class="inp-field" id="xferSuccessorSel" style="width:100%;margin:8px 0 14px">'+opts+'</select>'
    +'<button type="button" class="submit-btn" id="xferAcceptWithSuccBtn">'+(typeof L==='function'?L('✅ Handoff करें और join करें','✅ Handoff & join'):'Handoff & join')+'</button>'
    +'<button type="button" class="cancel-btn" onclick="rejectTeamTransferRequest(\''+String(reqKey).replace(/'/g,"\\'")+'\');closeModal()">'+(typeof L==='function'?L('अस्वीकार','Decline'):'Decline')+'</button>');

  try{
    const btn = document.getElementById('xferAcceptWithSuccBtn');
    if(btn){
      btn.onclick = function(){
        const sel = document.getElementById('xferSuccessorSel');
        const succId = sel && sel.value;
        if(!succId){ toast(typeof L==='function'?L('⚠️ Successor चुनें','⚠️ Select a successor'):'Select successor'); return; }
        confirmTransferAcceptWithSuccessor(reqKey, req, succId);
      };
    }
  }catch(e){}
}

/** Handoff old team to successor, then join requesting manager as member. */
async function confirmTransferAcceptWithSuccessor(reqKey, req, succId){
  try{
    const myKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    const all = (_cache && _cache.employees) || [];
    const team = (typeof getEmps==='function'?getEmps():[]) || all.filter(function(e){ return _normMobileKey(e.managerId||'')===myKey; });
    const succ = team.find(function(e){ return e.id===succId; }) || all.find(function(e){ return e.id===succId; });
    if(!succ){ toast('❌ Member not found'); return; }
    const newKey = _normMobileKey(succ.phone||succ.mobile||'');
    if(newKey.length !== 10){
      toast(typeof L==='function'?L('❌ चुने गए member के पास valid mobile होना चाहिए','❌ Selected member needs a valid mobile'):'Need valid mobile');
      return;
    }
    if(newKey === myKey){
      toast(typeof L==='function'?L('❌ खुद को successor नहीं बना सकते','❌ You cannot appoint yourself'):'Cannot appoint yourself');
      return;
    }

    toast(typeof L==='function'?L('⏳ Team handoff…','⏳ Team handoff…'):'Handoff…');
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(typeof L==='function'?L('❌ Phone OTP verify करें','❌ Verify phone OTP'):'OTP required'); return; }
    }

    // 1) Point every member (except leaving manager) at successor
    const toTransfer = team.filter(function(e){
      return e && e.id !== (typeof myEmp==='function' && myEmp() && myEmp().id) && _normMobileKey(e.phone||e.mobile||'') !== myKey;
    });
    // Always include successor in promote set
    const updates = {};
    toTransfer.forEach(function(e){
      updates['employees/'+e.id+'/managerId'] = newKey;
      updates['employees/'+e.id+'/previousManagerId'] = myKey;
      updates['employees/'+e.id+'/managerTransferredAt'] = new Date().toISOString();
    });
    updates['employees/'+succ.id+'/managerId'] = newKey;
    updates['employees/'+succ.id+'/accessLevel'] = 'manager';
    updates['employees/'+succ.id+'/role'] = 'manager';
    updates['employees/'+succ.id+'/isTeamManager'] = true;
    updates['employees/'+succ.id+'/status'] = 'active';
    updates['employees/'+succ.id+'/perms'] = { schedule:true, leave:true, reports:true, pending:true };

    try{
      if(window._fbAccess) await window._fbAccess('update', '/', updates);
      else {
        for(const e of toTransfer){
          await fbUpdate('employees/'+e.id, { managerId:newKey, previousManagerId:myKey, managerTransferredAt:new Date().toISOString() });
        }
        await fbUpdate('employees/'+succ.id, {
          managerId:newKey, accessLevel:'manager', role:'manager', isTeamManager:true, status:'active',
          perms:{ schedule:true, leave:true, reports:true, pending:true }
        });
      }
    }catch(batchErr){
      console.warn('[xfer handoff] batch', batchErr);
      for(const e of toTransfer){
        try{ await fbUpdate('employees/'+e.id, { managerId:newKey, previousManagerId:myKey, managerTransferredAt:new Date().toISOString() }); }catch(ex){}
      }
      await fbUpdate('employees/'+succ.id, {
        managerId:newKey, accessLevel:'manager', role:'manager', isTeamManager:true, status:'active',
        perms:{ schedule:true, leave:true, reports:true, pending:true }
      });
    }

    // 2) Promote successor mobileUsers
    try{
      await fbSet('mobileUsers/'+newKey, Object.assign({}, (await fbGet('mobileUsers/'+newKey))||{}, {
        role: 'manager',
        status: 'approved',
        pendingApproval: false,
        empId: succ.empId || succ.code || '',
        empObjId: succ.id,
        name: succ.name || '',
        managerId: newKey,
        approvedAt: new Date().toISOString(),
        approvedBy: 'transfer_handoff:'+(SESSION.name||myKey),
        transferredFrom: myKey,
        managerSince: new Date().toISOString()
      }));
    }catch(eMu){ console.warn('[xfer] promote mu', eMu); }

    // 3) Re-point mobileUsers.managerId for old team
    try{
      const allMU = await fbGet('mobileUsers') || {};
      for(const mob of Object.keys(allMU)){
        const rec = allMU[mob];
        if(!rec || typeof rec !== 'object') continue;
        if(String(rec.managerId||'') === myKey || String(rec.managerId||'') === '+91'+myKey){
          try{ await fbUpdate('mobileUsers/'+mob, { managerId: newKey, managerName: succ.name, previousManagerId: myKey }); }catch(ex){}
        }
      }
    }catch(ex){}

    // 4) Copy shift config / leave quotas if possible
    try{
      const oldCfgKey = ('mgr:'+myKey).replace(/[:.#$\[\]]/g,'_');
      const newCfgKey = ('mgr:'+newKey).replace(/[:.#$\[\]]/g,'_');
      const cfg = await fbGet('shiftConfigs/'+oldCfgKey);
      if(cfg){
        await fbSet('shiftConfigs/'+newCfgKey, Object.assign({}, cfg, { transferredFrom:myKey, transferredAt:new Date().toISOString() }));
      }
    }catch(ex){}

    // 5) Notify successor
    try{
      await fbPush('userNotifications/'+newKey, {
        type: 'became_manager',
        title: (typeof L==='function'?L('🏅 आप अब Manager हैं','🏅 You are now Manager'):'You are now Manager'),
        body: (typeof L==='function'?L((SESSION.name||'Previous manager')+' ने team आपको transfer की।','Previous manager transferred the team to you.'):'Team transferred to you'),
        read: false,
        at: new Date().toISOString()
      });
      if(succ.id) await fbPush('userNotifications/'+succ.id, {
        type: 'became_manager',
        title: (typeof L==='function'?L('🏅 आप अब Manager हैं','🏅 You are now Manager'):'You are now Manager'),
        body: (typeof L==='function'?L((SESSION.name||'Previous manager')+' ने team आपको transfer की।','Previous manager transferred the team to you.'):'Team transferred to you'),
        read: false,
        at: new Date().toISOString()
      });
    }catch(e){}

    // 6) Join requesting manager as member (this phone)
    await _finalizeJoinAsMemberAfterTransfer(reqKey, req, {
      successorId: succ.id,
      successorPhone: newKey,
      successorName: succ.name || ''
    });
  }catch(e){
    console.warn('[confirmTransferAcceptWithSuccessor]', e);
    toast('❌ '+(e&&e.message||e));
  }
}

async function _finalizeJoinAsMemberAfterTransfer(reqKey, req, handoffMeta){
  const phone = _normMobileKey(req.phone || SESSION.mobile || '');
  const newMgr = _normMobileKey(req.fromManagerId||'');
  if(!phone||!newMgr){ toast('Invalid request'); return; }
  const all = (_cache&&_cache.employees)||[];
  const matches = all.filter(function(e){ return e && _normMobileKey(e.phone||e.mobile||'')===phone; });
  const today = (typeof TODAY_STR!=='undefined'?TODAY_STR:(new Date().toISOString().slice(0,10)));
  for(var i=0;i<matches.length;i++){
    var e = matches[i];
    var patch = {
      managerId: newMgr,
      role: 'member',
      accessLevel: 'worker',
      isTeamManager: false,
      status: 'active',
      transferredAt: new Date().toISOString(),
      previousManagerId: e.managerId || null,
      shiftHistoryPrivateFrom: today,
      shiftHistoryPrivateToMgr: newMgr
    };
    if(handoffMeta){
      patch.handedTeamTo = handoffMeta.successorPhone;
      patch.handedTeamToName = handoffMeta.successorName;
      patch.handedTeamToEmpId = handoffMeta.successorId;
    }
    await fbUpdate('employees/'+e.id, patch);
  }
  try{
    await fbUpdate('mobileUsers/'+phone, {
      role: 'member',
      managerId: newMgr,
      status: 'approved',
      pendingApproval: false,
      transferredAt: new Date().toISOString(),
      previousRole: 'manager'
    });
  }catch(ex){}
  await fbUpdate('teamTransferRequests/'+reqKey, {
    status:'accepted',
    acceptedAt: new Date().toISOString(),
    handoff: handoffMeta || null
  });
  try{ closeModal(); }catch(e){}
  toast(typeof L==='function'?L(
    handoffMeta
      ? ('✅ Team '+ (handoffMeta.successorName||'') +' को दी · आप नई team में member हैं')
      : '✅ Team transfer complete — shifts आपके साथ रहेंगे',
    handoffMeta
      ? ('✅ Team handed to '+(handoffMeta.successorName||'successor')+' · you joined as member')
      : '✅ Team transfer complete — shifts stay with you'
  ):'Transfer complete');
  try{ if(typeof loadAll==='function') await loadAll(); }catch(e){}
  try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
  try{ if(typeof renderHome==='function') renderHome(); }catch(e){}
}

async function rejectTeamTransferRequest(reqKey){
  try{
    await fbUpdate('teamTransferRequests/'+reqKey, { status:'rejected', rejectedAt: new Date().toISOString() });
    toast(typeof L==='function'?L('Request अस्वीकार','Request declined'):'Declined');
  }catch(e){ toast('❌ '+(e&&e.message||e)); }
}

/** Incoming pending: requests targeting my mobile (person being added) */
async function loadMyPendingTeamTransfers(){
  try{
    const phone = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(!phone) return [];
    const all = await fbGet('teamTransferRequests') || {};
    const list = [];
    Object.keys(all).forEach(function(k){
      const r = all[k];
      if(!r || r.status!=='pending') return;
      if(_normMobileKey(r.phone||'')!==phone) return;
      list.push(Object.assign({ _key:k, _direction:'incoming' }, r));
    });
    return list;
  }catch(e){ return []; }
}

/** Outgoing pending: requests I (manager) sent to add someone */
async function loadMyOutgoingTeamTransfers(){
  try{
    const me = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(!me) return [];
    const all = await fbGet('teamTransferRequests') || {};
    const list = [];
    Object.keys(all).forEach(function(k){
      const r = all[k];
      if(!r || r.status!=='pending') return;
      if(_normMobileKey(r.fromManagerId||'')!==me) return;
      list.push(Object.assign({ _key:k, _direction:'outgoing' }, r));
    });
    return list;
  }catch(e){ return []; }
}

/** All pending relevant to me (incoming + outgoing) for Team page tracking */
async function loadTeamPageTransferRequests(){
  try{
    const [inc, out] = await Promise.all([
      loadMyPendingTeamTransfers(),
      loadMyOutgoingTeamTransfers()
    ]);
    // de-dupe by key
    const map = {};
    (inc||[]).concat(out||[]).forEach(function(r){ if(r && r._key) map[r._key] = r; });
    return Object.keys(map).map(function(k){ return map[k]; })
      .sort(function(a,b){ return String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
  }catch(e){ return []; }
}

async function cancelTeamTransferRequest(reqKey){
  try{
    if(!reqKey) return;
    const ok = await (typeof confirmModal==='function'
      ? confirmModal(
          (typeof L==='function'?L('Request रद्द?','Cancel request?'):'Cancel request?'),
          (typeof L==='function'?L('यह transfer request cancel हो जाएगी।','This transfer request will be cancelled.'):'Cancel this request?'),
          (typeof L==='function'?L('हाँ, Cancel','Yes, Cancel'):'Yes, Cancel'),
          (typeof L==='function'?L('वापस','Back'):'Back')
        )
      : confirm('Cancel this transfer request?'));
    if(!ok) return;
    await fbUpdate('teamTransferRequests/'+reqKey, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: _normMobileKey(SESSION.mobile||'')
    });
    toast(typeof L==='function'?L('✅ Request cancel हो गई','✅ Request cancelled'):'Request cancelled');
    try{ if(typeof renderTeamPendingTransfers==='function') await renderTeamPendingTransfers(); }catch(e){}
    try{ if(typeof renderPendingTeamTransferBanner==='function') await renderPendingTeamTransferBanner(); }catch(e){}
    try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
  }catch(e){
    toast('❌ '+(e&&e.message||e));
  }
}

async function renderPendingTeamTransferBanner(){
  const host = document.getElementById('homeTransferBanner') || document.getElementById('homeNotice');
  if(!host) return;
  try{
    const list = await loadMyPendingTeamTransfers();
    if(!list.length){
      if(host.id==='homeTransferBanner') host.innerHTML='';
      return;
    }
    const esc = (typeof escHtml==='function'?escHtml:function(s){return String(s||'');});
    host.innerHTML = list.map(function(r){
      const needSucc = r.kind==='manager_with_team' || r.requiresSuccessor || (typeof _isManagerWithTeamNow==='function' && _isManagerWithTeamNow());
      return '<div style="margin:10px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(168,85,247,.45);background:rgba(168,85,247,.12)">'
        +'<div style="font-size:13px;font-weight:800;color:#c084fc;margin-bottom:6px">'+(typeof L==='function'?L('📨 Team join request','📨 Team join request'):'Team join request')+'</div>'
        +'<div style="font-size:12px;color:var(--text);line-height:1.45;margin-bottom:10px">'
        +esc(r.fromManagerName||r.fromManagerId||'Manager')
        +' '+(typeof L==='function'?L('आपको अपनी team में member के रूप में invite कर रहे हैं।','invites you to join their team as a member.') :'invites you.')
        +(needSucc ? ('<br><span style="color:#fbbf24">'+(typeof L==='function'?L('Accept पर: team में mobile वाले सदस्य हों तो नया Manager चुनें; नहीं तो बाकी members नए Manager के नीचे चले जाएंगे।','On Accept: if a team member has a mobile you pick a new Manager; otherwise remaining members move under the inviting Manager.'):'')+'</span>') : '')
        +'</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
        +'<button type="button" class="submit-btn" style="flex:1;min-width:120px;padding:10px" onclick=\'acceptTeamTransferRequest('+JSON.stringify(r._key)+','+JSON.stringify({kind:r.kind,phone:r.phone,fromManagerId:r.fromManagerId,fromManagerName:r.fromManagerName,requiresSuccessor:r.requiresSuccessor})+')\'>'
        +(typeof L==='function'?L('समीक्षा / Accept','Review / Accept'):'Review / Accept')+'</button>'
        +'<button type="button" class="cancel-btn" style="flex:1;min-width:100px;padding:10px" onclick="rejectTeamTransferRequest(\''+String(r._key).replace(/'/g,"\\'")+'\')">'
        +(typeof L==='function'?L('अस्वीकार','Decline'):'Decline')+'</button>'
        +'</div></div>';
    }).join('');
  }catch(e){ console.warn('[transfer banner]', e); }
}

/** Team page: show pending transfers for BOTH sides (requester + person being added) */
async function renderTeamPendingTransfers(){
  try{
    let host = document.getElementById('teamPendingTransfers');
    if(!host){
      // Insert above Left Members or after teamList
      const left = document.getElementById('leftMembersSection');
      const teamList = document.getElementById('teamList');
      host = document.createElement('div');
      host.id = 'teamPendingTransfers';
      host.style.cssText = 'margin:12px 0 8px';
      if(left && left.parentNode) left.parentNode.insertBefore(host, left);
      else if(teamList && teamList.parentNode) teamList.parentNode.appendChild(host);
      else return;
    }
    const list = await loadTeamPageTransferRequests();
    if(!list.length){
      host.innerHTML = '';
      host.style.display = 'none';
      return;
    }
    host.style.display = 'block';
    const esc = (typeof escHtml==='function'?escHtml:function(s){return String(s||'').replace(/</g,'&lt;');});
    const me = _normMobileKey(SESSION.mobile||'');
    const cards = list.map(function(r){
      const isOut = r._direction==='outgoing' || _normMobileKey(r.fromManagerId||'')===me;
      const isIn = r._direction==='incoming' || _normMobileKey(r.phone||'')===me;
      const statusLbl = (typeof L==='function'?L('Pending — approval wait','Pending — waiting approval'):'Pending — waiting approval');
      const when = r.createdAt ? (function(){
        try{ return new Date(r.createdAt).toLocaleString(typeof mpLocale==='function'?mpLocale():'en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return String(r.createdAt).slice(0,16); }
      })() : '';
      let title, body, actions='';
      if(isOut && !isIn){
        title = (typeof L==='function'?L('⏳ Add request भेजा गया','⏳ Add request sent'):'Add request sent');
        body = (typeof L==='function'?L(
          'आपने <b>'+esc(r.targetName||r.phone)+'</b> (+91 '+esc(r.phone)+') को team में add करने का request भेजा है। वे Accept करें तब join होगा।',
          'You requested to add <b>'+esc(r.targetName||r.phone)+'</b> (+91 '+esc(r.phone)+') to your team. They must Accept before joining.'
        ):'');
        actions = '<button type="button" class="cancel-btn" style="flex:1;min-width:110px;padding:10px;font-size:12px" onclick="cancelTeamTransferRequest(\''+String(r._key).replace(/'/g,"\\'")+'\')">'
          +(typeof L==='function'?L('Request Cancel','Cancel request'):'Cancel request')+'</button>';
      } else if(isIn){
        title = (typeof L==='function'?L('📨 Team join request','📨 Team join request'):'Team join request');
        body = esc(r.fromManagerName||r.fromManagerId||'Manager')
          +' '+(typeof L==='function'?L('आपको अपनी team में invite कर रहे हैं।','invites you to their team.'):'invites you.');
        if(r.kind==='manager_with_team' || r.requiresSuccessor){
          body += '<br><b style="color:#fbbf24">'+(typeof L==='function'?L('Accept से पहले नया Manager चुनना जरूरी।','Appoint a new Manager before Accept.'):'Successor required')+'</b>';
        }
        actions = '<button type="button" class="submit-btn" style="flex:1;min-width:110px;padding:10px;font-size:12px" onclick=\'acceptTeamTransferRequest('+JSON.stringify(r._key)+','+JSON.stringify({kind:r.kind,phone:r.phone,fromManagerId:r.fromManagerId,fromManagerName:r.fromManagerName,requiresSuccessor:r.requiresSuccessor})+')\'>'
          +(typeof L==='function'?L('समीक्षा / Accept','Review / Accept'):'Review / Accept')+'</button>'
          +'<button type="button" class="cancel-btn" style="flex:1;min-width:100px;padding:10px;font-size:12px" onclick="rejectTeamTransferRequest(\''+String(r._key).replace(/'/g,"\\'")+'\')">'
          +(typeof L==='function'?L('अस्वीकार','Decline'):'Decline')+'</button>';
      } else {
        title = statusLbl;
        body = esc(r.targetName||r.phone)+' · '+esc(r.fromManagerName||'');
      }
      return '<div style="margin:0 0 10px;padding:12px 14px;border-radius:12px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.08)">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">'
        +'<div style="font-size:13px;font-weight:800;color:#fb923c">'+title+'</div>'
        +'<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:rgba(251,146,60,.2);color:#fdba74">'+statusLbl+'</span>'
        +'</div>'
        +'<div style="font-size:12px;color:var(--text);line-height:1.45;margin-bottom:8px">'+body+'</div>'
        +(when?('<div style="font-size:10px;color:var(--muted2);margin-bottom:8px">'+when+'</div>'):'')
        +(actions?('<div style="display:flex;gap:8px;flex-wrap:wrap">'+actions+'</div>'):'')
        +'</div>';
    }).join('');
    host.innerHTML = '<div style="font-size:12px;font-weight:800;color:var(--muted2);letter-spacing:.4px;margin:4px 2px 8px">'
      +(typeof L==='function'?L('PENDING TRANSFERS / ADD REQUESTS','PENDING TRANSFERS / ADD REQUESTS'):'PENDING TRANSFERS / ADD REQUESTS')
      +' · '+list.length+'</div>'+cards;
  }catch(e){ console.warn('[team pending transfers]', e); }
}

window.openPhoneTransferModalwindow.openPhoneTransferModal = openPhoneTransferModal;
window.loadMyPendingTeamTransfers = loadMyPendingTeamTransfers;
window.loadMyOutgoingTeamTransfers = loadMyOutgoingTeamTransfers;
window.loadTeamPageTransferRequests = loadTeamPageTransferRequests;
window.renderTeamPendingTransfers = renderTeamPendingTransfers;
window.cancelTeamTransferRequest = cancelTeamTransferRequest;
window.renderPendingTeamTransferBanner = renderPendingTeamTransferBanner;
window.sendTeamTransferRequest = sendTeamTransferRequest;
window.acceptTeamTransferRequest = acceptTeamTransferRequest;
window.confirmTransferAcceptWithoutSuccessor = confirmTransferAcceptWithoutSuccessor;
window.openTransferAcceptSuccessorModal = openTransferAcceptSuccessorModal;
window.confirmTransferAcceptWithSuccessor = confirmTransferAcceptWithSuccessor;
window.rejectTeamTransferRequest = rejectTeamTransferRequest;
window.loadMyPendingTeamTransfers = loadMyPendingTeamTransfers;
window.renderPendingTeamTransferBanner = renderPendingTeamTransferBanner;
window._isManagerWithTeamNow = _isManagerWithTeamNow;

