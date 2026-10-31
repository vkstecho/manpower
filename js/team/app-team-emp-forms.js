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
  <div class="field"><label>💰 Monthly Salary (₹)</label><input class="inp-field" id="ne_salary" type="number" min="0" step="1" placeholder="e.g. 15000"></div>
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
  if(sec==='MGR' && !isAdmin()){ toast(L('❌ Manager section में सिर्फ Admin जोड़ सकते हैं','❌ Only Admin can add to Manager section')); return; }
  // Duplicate employee code
  const codeClash = (getEmps()||[]).find(e => e.status !== 'resigned' && e.empId && String(e.empId).trim().toUpperCase() === code.toUpperCase());
  if(codeClash){
    toast(L('⚠️ Employee code पहले से है: ','⚠️ Employee code already exists: ') + codeClash.name);
    return;
  }
  // Duplicate mobile (especially other team)
  if(phone && phone.length === 10){
    const clash = _findPhoneConflict(phone, null, code);
    if(clash){
      const nm = clash.emp.name || clash.emp.empId || '';
      if(clash.otherTeam){
        toast(L('📱 यह मोबाइल नंबर पहले से दूसरे team के member के पास है। Add नहीं किया।','📱 Mobile already belongs to another team\'s member. Not added.') + ' ('+nm+')');
      } else {
        toast(L('📱 यह मोबाइल नंबर पहले से registered है। Add नहीं किया।','📱 Mobile already registered. Not added.') + ' ('+nm+')');
      }
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
  if(phone) emp.phone=phone;
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
    <div class="field"><label>💰 Monthly Salary (₹)</label><input class="inp-field" id="ee_salary" type="number" min="0" step="1" value="${e.monthlySalary||''}"></div>
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
  <div style="height:16px;flex-shrink:0"></div>
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

  // Phone clash — exclude self by id AND by same phone already on this record
  if(update.phone && update.phone.length === 10){
    const selfPhone = e ? _normMobileKey(e.phone||e.mobile||'') : '';
    if(update.phone !== selfPhone){
      const clash = _findPhoneConflict(update.phone, empId, update.empId);
      if(clash && clash.emp && clash.emp.id !== empId){
        const nm = clash.emp.name || clash.emp.empId || '';
        _setBusy(false, _saveBtn && _saveBtn.dataset.prevLabel);
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

  // Source 2: full employee cache (NOT getEmps — that hides left/resigned for managers)
  const LEFT_STATUSES = new Set(['resigned','left','left_team','removed','revoked']);
  const allEmps = (_cache.employees || []).concat(
    // getEmps may still hold some in edge cases
    (typeof getEmps==='function' ? getEmps() : [])
  );
  const seenIds = new Set(leftList.map(l => l.id || l._fbKey).filter(Boolean));
  allEmps.forEach(e => {
    if(!e || !e.id) return;
    if(seenIds.has(e.id)) return;
    const st = String(e.status||'').toLowerCase();
    if(!LEFT_STATUSES.has(st) && e.active !== false) return;
    if(!LEFT_STATUSES.has(st) && e.active !== false) return;
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
        const leftish = LEFT_STATUSES.has(st) || v.demotedReason==='manager_transferred' && (st==='left'||st==='left_team'||v.leftAt);
        // Only if explicitly left — not mere demote to member still active
        if(!LEFT_STATUSES.has(st) && !v.leftAt) return;
        const id = v.empObjId || v.employeeId || ('mu_'+k);
        if(seenIds.has(id) || seenIds.has(k)) return;
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

  let html = `<div style="font-size:11px;color:var(--muted2);margin-bottom:8px;font-weight:700">${typeof L==='function'?L('कुल '+leftList.length+' कर्मचारी · सेक्शन के अनुसार:','Total '+leftList.length+' employees · Section-wise:'):(leftList.length+' employees · Section-wise:')}</div>`;
  
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
  let m = String(SESSION.mobile||'').replace(/\D/g,'');
  if(m.length === 10) return m;
  try{
    const emp = myEmp();
    if(emp){
      m = String(emp.phone || emp.mobile || '').replace(/\D/g,'');
      if(m.length === 10) return m;
    }
  }catch(e){}
  // Optional org contact from CFG (no person-specific hardcode)
  m = String((CFG && CFG.contactVivek)||'').replace(/\D/g,'').slice(-10);
  if(m.length === 10) return m;
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

  _deleteAllMobile = mobile;
  // Persist to session if it was resolved from fallback
  if(!SESSION.mobile || String(SESSION.mobile).replace(/\D/g,'').length !== 10){
    SESSION.mobile = mobile;
    try{ saveSession(); }catch(e){}
  }
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

  for(const emp of team){
    try{
      // safety: only own team
      if(mgrKey && emp.managerId && emp.managerId !== mgrKey) continue;
      await fbRemove('employees/'+emp.id);
      // clear from local cache if present
      try{
        if(_cache && _cache.employees && _cache.employees[emp.id]) delete _cache.employees[emp.id];
      }catch(e){}
      removed++;
    }catch(e){
      failed++;
      console.error('delete member', emp.id, e);
    }
  }

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
    section:     ['section','sec','department section','dept section','सेक्शन','area','unit','dept','department'],
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
