/**
 * Man Power — Team list / salary cost / devices / emp upload
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
/**
 * Man Power — split module (P3). Loaded after app-core.js in global scope.
 * Do not use ES modules here — functions share window globals with app-core.
 */
// MODULE: team / bulk import / instructions / security tabs
// ════════════════════════════════════════
// TEAM
// ════════════════════════════════════════
let _teamSec='ALL';
function setTeamSec(s,el){ _teamSec=s; document.querySelectorAll('#teamFilter .chip').forEach(c=>c.classList.remove('on')); el.classList.add('on'); renderTeam(); document.getElementById('tab-team')?.scrollIntoView({behavior:'smooth',block:'start'}); }

function classifyResponsibility(resp){
  const r=(resp||'').toString().toLowerCase();
  if(/manag/.test(r)) return L('Managers','Managers');
  if(/engineer/.test(r)) return L('Engineers','Engineers');
  if(/assist/.test(r)) return L('Assistants','Assistants');
  if(/operat/.test(r)) return L('Operators','Operators');
  return L('Others','Others');
}

let _renderTeamTimer = null;
let _renderTeamLastSearch = '';
function renderTeam(search){
  if(arguments.length) _renderTeamLastSearch = search;
  else search = _renderTeamLastSearch;
  if(_renderTeamTimer){ clearTimeout(_renderTeamTimer); }
  const s = search;
  // Fast path: if called from input, debounce; from listeners still coalesce
  _renderTeamTimer = setTimeout(()=>{ _renderTeamTimer=null; _renderTeamImpl(s); }, 80);
}
function _renderTeamImpl(search=''){
  try{
    const host = document.getElementById('teamPage') || document.getElementById('teamList') || document.getElementById('teamBody');
    if(host && !document.getElementById('mgrEmptyTeamBanner')){
      const h = _managerEmptyTeamHtml();
      if(h){ const d=document.createElement('div'); d.id='mgrEmptyTeamBanner'; d.innerHTML=h; host.prepend(d); }
    } else if(host && document.getElementById('mgrEmptyTeamBanner')){
      const h = _managerEmptyTeamHtml();
      if(!h) document.getElementById('mgrEmptyTeamBanner').remove();
      else document.getElementById('mgrEmptyTeamBanner').innerHTML=h;
    }
  }catch(e){}

  try{ renderAdminManagerBanner(); }catch(e){}
  _renderDynamicChips('teamFilter', _buildTeamSectionChips(), _teamSec, 'setTeamSec');
  document.getElementById('teamAddBtn').innerHTML = isAdminOrMgr()
    ? `<div style="display:flex;gap:8px;margin-bottom:14px">
        <button class="action-primary team-btn-add" style="flex:1;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;border:none;font-weight:900;font-size:14px;padding:14px 12px;border-radius:12px;box-shadow:0 2px 8px rgba(234,88,12,.35)" onclick="openAddEmpForm()">+ ${L("नया कर्मचारी जोड़ें","Add employee")}</button>
        <button class="action-primary team-btn-import" style="flex:1;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;font-weight:900;font-size:14px;padding:14px 12px;border-radius:12px;box-shadow:0 2px 8px rgba(22,163,74,.35)" onclick="openBulkImportTeam()">${L('📊 Excel से Team Import','📊 Import Team from Excel')}</button>
      </div>
      ${isAdmin()?`<div id="adminMgrBanner" style="margin-bottom:12px"></div>
      <button type="button" onclick="openAppLicenseAdmin()" style="width:100%;margin-bottom:14px;padding:12px;border-radius:12px;border:1px solid rgba(124,58,237,.45);background:rgba(124,58,237,.1);color:#7c3aed;font-weight:900;font-size:13px;cursor:pointer">🔑 ${L('App License / Expiry Date','App License / Expiry Date')}</button>`:''}
      ${SESSION.role==='manager'?`<button class="action-primary team-btn-delete" style="width:100%;margin-bottom:14px;background:linear-gradient(135deg,#e11d48,#be123c);color:#fff;border:none;font-weight:900;font-size:14px;padding:14px 12px;border-radius:12px;box-shadow:0 2px 8px rgba(225,29,72,.3)" onclick="startDeleteAllMembersFlow()">${L('🗑️ सभी Members Delete करें (OTP verify)','🗑️ Delete All Members (OTP verify)')}</button>`:''}` : '';

  // Active employees (not resigned/left). When searching, do NOT require ms[] so name/mobile/code matches still show.
  const q = String(search||'').trim().toLowerCase();
  const qDigits = q.replace(/\D/g,'');
  let list = getEmps().filter(e => {
    if(!e) return false;
    if(e.status === 'resigned' || e.status === 'left' || e.status === 'left_team' || e.status === 'removed') return false;
    // Without search: prefer members present on schedule (ms array); still include those without ms
    return true;
  });
  const totalAll = list.length;
  // Section chip filter only when NOT searching (search should find anyone in team)
  if(!q && _teamSec !== 'ALL') list = list.filter(e => {
    const sec = (typeof getEmpSection==='function') ? getEmpSection(e) : (e.section||e.sec||'');
    return sec === _teamSec || e.sec === _teamSec || e.section === _teamSec;
  });
  if(q){
    list = list.filter(e => {
      const name = String(e.name||'').toLowerCase();
      const code = String(e.empId||e.empCode||'').toLowerCase();
      const phone = String(e.phone||e.mobile||'').replace(/\D/g,'');
      if(name.includes(q)) return true;
      if(code.includes(q)) return true;
      if(qDigits.length >= 3 && phone.includes(qDigits)) return true;
      return false;
    });
  }

  // Show total count
  const totalLabel = _teamSec === 'ALL' 
    ? `${L('कुल','Total')} <b style="color:var(--m1)">${list.length}</b> ${L('कर्मचारी','employees')} (Active — ${L('Schedule में','in Schedule')})` 
    : `${secName(_teamSec)}: <b style="color:var(--m1)">${list.length}</b> / ${totalAll} कुल`;
  
  const countDiv = document.getElementById('teamCount');
  if(countDiv) countDiv.innerHTML = totalLabel;
  else {
    const tc = document.createElement('div');
    tc.id = 'teamCount';
    tc.style.cssText = 'font-size:14px;color:var(--muted2);margin-bottom:12px;padding:4px 2px';
    tc.innerHTML = totalLabel;
    const listEl = document.getElementById('teamList');
    if(listEl && listEl.parentNode) listEl.parentNode.insertBefore(tc, listEl);
  }

  // Build groups: Excel Section → Responsibility → Name (all collapsed by default)
  const secMap = new Map(); // secLabel -> Map(respLabel -> emps[])
  list.forEach(e=>{
    const sec = ((typeof getEmpSection==='function') ? getEmpSection(e) : '') || String(e.section||e.sec||'').trim() || ((typeof L==='function')?L('अन्य','Other'):'Other');
    const resp = ((typeof getEmpResp==='function') ? getEmpResp(e) : '') || String(e.resp||e.responsibility||'').trim() || '—';
    if(!secMap.has(sec)) secMap.set(sec, new Map());
    const rMap = secMap.get(sec);
    if(!rMap.has(resp)) rMap.set(resp, []);
    rMap.get(resp).push(e);
  });
  // Sort each resp group by name
  secMap.forEach(rMap=>{
    rMap.forEach((arr, k)=>{
      arr.sort((a,b)=> String(a.name||'').localeCompare(String(b.name||''), undefined, {sensitivity:'base'}));
    });
  });
  const secKeys = Array.from(secMap.keys()).sort((a,b)=> String(a).localeCompare(String(b), undefined, {sensitivity:'base'}));

  let html = '';
  secKeys.forEach(sec=>{
    const rMap = secMap.get(sec);
    const membersCount = Array.from(rMap.values()).reduce((n,a)=>n+a.length, 0);
    if(!membersCount) return;
    const s = (typeof getSectionMeta==='function') ? getSectionMeta(sec) : {icon:'👤', color:'#94a3b8', bg:'rgba(148,163,184,.1)', hi:sec};
    const secLabel = (s && (s.label||s.hi)) ? (s.label||s.hi) : sec;
    const _searchOpen = !!q;
    html += `<div class="team-fold" data-open="${_searchOpen?'1':'0'}" style="margin-bottom:10px;border:1px solid var(--border2);border-radius:12px;overflow:hidden;background:var(--panel)">
      <div class="team-fold-hdr" onclick="_toggleTeamFold(this)" style="display:flex;align-items:center;gap:8px;padding:12px 14px;cursor:pointer;user-select:none;background:rgba(255,255,255,.02)">
        <span class="team-fold-chev" style="font-size:11px;color:var(--muted2);width:14px">${_searchOpen?'▼':'▶'}</span>
        <span style="font-size:16px">${s.icon||'👤'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:900;color:var(--text)">${secLabel}</div>
          <div style="font-size:10px;color:var(--muted2)">${membersCount} ${(typeof L==='function')?L('सदस्य','members'):'members'}</div>
        </div>
        <span style="font-size:12px;font-weight:800;color:${s.color||'#94a3b8'}">${membersCount}</span>
      </div>
      <div class="team-fold-body" style="display:${(typeof q!=='undefined' && q)?'block':'none'};padding:6px 8px 10px">`;

    const respKeys = Array.from(rMap.keys()).sort((a,b)=>{
      if(a==='—') return 1;
      if(b==='—') return -1;
      return String(a).localeCompare(String(b), undefined, {sensitivity:'base'});
    });
    respKeys.forEach(resp=>{
      const subMembers = rMap.get(resp) || [];
      if(!subMembers.length) return;
      html += `<div class="team-fold" data-open="${(typeof q!=='undefined' && q)?'1':'0'}" style="margin:6px 0;border:1px solid var(--border2);border-radius:10px;overflow:hidden">
        <div class="team-fold-hdr" onclick="_toggleTeamFold(this)" style="display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;user-select:none;background:rgba(148,163,184,.06)">
          <span class="team-fold-chev" style="font-size:10px;color:var(--muted2);width:12px">${(typeof q!=='undefined' && q)?'▼':'▶'}</span>
          <span style="font-size:12px">🎯</span>
          <div style="flex:1;font-size:12px;font-weight:800;color:var(--text)">${resp}</div>
          <span style="font-size:11px;font-weight:800;color:var(--muted2)">${subMembers.length}</span>
        </div>
        <div class="team-fold-body" style="display:${(typeof q!=='undefined' && q)?'block':'none'};padding:6px">
          ${_renderTeamMemberCards(subMembers, s)}
        </div>
      </div>`;
    });

    html += `</div></div>`;
  });

  function _renderTeamMemberCards(members, s){
    return members.map(e=>{
      const ini=e.name.split(' ').map(n=>n[0]).join('').substring(0,2);
      const sh=getShift(e,TODAY_STR);
      const isMe=e.id===SESSION.empObjId;
      const ncrs=getNcrForEmp(e.id);
      const ncrBadge = ncrs.length>0
        ? `<span onclick="showEmpNcrs('${e.id}')" style="font-size:10px;font-weight:900;background:rgba(244,63,94,.15);color:var(--lv);border:1px solid rgba(244,63,94,.35);border-radius:5px;padding:2px 7px;cursor:pointer;flex-shrink:0">⚠️ NCR: ${ncrs.length}</span>` : '';
      const avatarHtml = e.photo
        ? `<img src="${e.photo}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;border:2px solid ${s.color||'rgba(255,255,255,.2)'};flex-shrink:0;cursor:pointer" onclick="window.open('${e.photo}','_blank')">`
        : `<div style="width:44px;height:44px;border-radius:10px;background:${s.bg||'rgba(148,163,184,.1)'};display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:19px;color:${s.color||'#fff'};flex-shrink:0">${ini}</div>`;
      return `<div class="card" id="teamcard_${e.id}" style="${isMe?'border-color:rgba(249,115,22,.4);background:rgba(249,115,22,.04);':''}">
        <div class="card-row">
          ${avatarHtml}
          <div class="card-body">
            <div class="card-name">${escHtml(e.name)}${isMe?(' <span style="font-size:10px;color:var(--m1)">'+L("(आप)","(You)")+'</span>'):''}</div>
            <div class="card-sub">${escHtml(e.empId||'—')}${e.mc&&e.mc!=='—'?(' · '+escHtml(e.mc)):''}${(()=>{const r=String(e.resp||'').trim(),d=String(e.designation||'').trim();const parts=[];if(r&&r!=='—')parts.push(r);if(d&&d!=='—'&&d.toLowerCase()!==r.toLowerCase())parts.push(d);const al=String(e.accessLevel||e.role||'').toLowerCase();if((al==='manager'||e.isTeamManager)&&!parts.some(p=>/manager/i.test(p)))parts.push('Manager');return parts.length?(' · '+parts.map(p=>`<span style="color:var(--desig-color,#7c3aed)">${escHtml(p)}</span>`).join(' · ')):''})()}</div>
            <div style="margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span class="shc ${cellClass(sh)}">${cellDisp(sh)}</span>
              <span style="font-size:10px;color:var(--muted)">W-OFF: ${e.woff||'—'}</span>
              ${e.phone?`<span style="font-size:10px;color:var(--green)">📱 ${escHtml(e.phone)}</span>`:''}
              ${ncrBadge}
            </div>
            ${(()=>{const jd=getJoiningDate(e);return jd?`<div style="font-size:10px;color:var(--muted2);margin-top:3px">📅 Joining: <b style="color:var(--green)">${new Date(jd+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</b></div>`:'';})()}
            ${(()=>{
              const showSalary = isAdmin() || (isMgr() && (_cache.settings?.showSalaryToManager === true));
              return showSalary && e.monthlySalary
                ? `<div style="font-size:10px;color:var(--muted2);margin-top:3px">💰 Salary: <b style="color:var(--salary-color,#d97706)">₹${Number(e.monthlySalary).toLocaleString('en-IN')}/month</b></div>`
                : '';
            })()}
            ${isAdmin()?`<div id="devinfo_${e.id}" style="margin-top:6px;font-size:11px;color:var(--muted2)">⏳ device info...</div>`:(isMgr()?`<div id="devinfo_${e.id}" style="margin-top:6px;font-size:11px;color:var(--muted2)">⏳ device info...</div>`:'')}
          </div>
          ${(isAdmin() || isMgr())?`<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
            <button class="act-btn edit" style="padding:7px 10px;font-size:11px" onclick="openEditEmpForm('${e.id}')" title="Edit">✏️</button>
            ${(()=>{ const ph=String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10); return ph.length===10 ? `<a class="act-btn" href="tel:+91${ph}" style="padding:7px 10px;font-size:11px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);border-radius:7px;color:#22c55e;font-weight:800" title="${L('Call','Call')}" onclick="event.stopPropagation()">📞</a>` : ''; })()}
            ${isAdmin()?`<button style="padding:7px 10px;font-size:11px;background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.35);border-radius:7px;color:#60a5fa;cursor:pointer;font-weight:800" onclick="openTeamMemberExpiryModal('${e.id}','${escHtml(String(e.name||'').replace(/'/g,"\'"))}')" title="App expiry">📅</button>`:''}
            ${isAdminOrMgr()?`<button class="act-btn del"  style="padding:7px 10px;font-size:11px" onclick="confirmDelEmp('${e.id}','${escHtml(e.name)}')">🗑️</button>`:''}
            <button style="padding:7px 10px;font-size:11px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.3);border-radius:7px;color:#38bdf8;cursor:pointer" onclick="openDeviceManager('${e.id}','${escHtml(e.name)}')">📱</button>
          </div>`:''}
        </div>
      </div>`;
    }).join('');
  }

  const el = document.getElementById('teamList');
  el.innerHTML = html || '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">${L("कोई कर्मचारी नहीं मिला","No employees found")}</div></div>';

  // ── Left / Resigned Members Section ──
  // Merge: firebase leftEmployees path + status='resigned' employees from main table
  const leftSec = document.getElementById('leftMembersSection');
  if(leftSec){
    const shouldShow = (isAdmin() || isMgr()) && _teamSec === 'ALL' && !search;
    leftSec.style.display = shouldShow ? 'block' : 'none';
    if(shouldShow){
      // Also collect status='resigned' employees from main employees cache
      const resignedFromCache = getEmps().filter(e => e.status === 'resigned' || e.status === 'left');
      
      // Get count from firebase leftEmployees + cache resigned
      const countEl = document.getElementById('leftMemberCount');
      fbGet('leftEmployees').then(raw => {
        const fbCount = raw ? Object.keys(raw).length : 0;
        // Merged count: firebase left + cache resigned that aren't already in firebase left
        const totalLeft = fbCount + resignedFromCache.filter(e => {
          // Don't double-count if same empId exists in leftEmployees
          const empId = e.empId || e.id;
          return !raw || !Object.values(raw).some(v => v.empId === empId || v.empCode === empId);
        }).length;
        if(countEl) countEl.textContent = totalLeft || resignedFromCache.length;
      }).catch(()=>{ 
        if(countEl) countEl.textContent = resignedFromCache.length;
      });
    }
  }

  // Show Salary Cost section — Admin and Manager
  const scSec = document.getElementById('salaryCostSection');
  if(scSec){
    scSec.style.display = isAdminOrMgr() ? 'block' : 'none';
    if(isAdminOrMgr()){
      const monthInput = document.getElementById('salaryCostMonth');
      if(monthInput && !monthInput.value){
        const now = new Date();
        monthInput.value = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
        renderSalaryCost();
      }
    }
  }

  // Load device info for each employee asynchronously (admin and manager)
  if(isAdminOrMgr()){
    list.forEach(e=>{ loadDeviceInfoForCard(e.id, e.name); });
  }
}


/** True if schedule cell is Absent (Ab / AB / Absent / अनुपस्थित) */
function _isAbsentShift(sh){
  if(sh == null || sh === '') return false;
  const s = String(sh).trim();
  if(s === 'Ab' || s === 'AB') return true;
  if(/^Ab\b/i.test(s)) return true;
  if(/^Absent/i.test(s)) return true;
  if(/अनुपस्थित/i.test(s)) return true;
  return false;
}

/** Resolve monthly salary from employee record (salary or monthlySalary) */
function _empMonthlySalary(emp){
  if(!emp) return 0;
  const raw = emp.monthlySalary != null && emp.monthlySalary !== '' ? emp.monthlySalary : emp.salary;
  const n = Number(String(raw != null ? raw : '').replace(/[^\d.]/g,''));
  return isNaN(n) ? 0 : n;
}

// ════════════════════════════════════════
// SALARY COST CALCULATOR — Admin only
// Formula: Net = Monthly Salary - (Ab days × Monthly Salary ÷ 26)
// window._manpowerCostData exported for future embedded app
// ════════════════════════════════════════
function renderSalaryCost(){
  if(!isAdminOrMgr()) return;
  const monthInput = document.getElementById('salaryCostMonth');
  const tableEl    = document.getElementById('salaryCostTable');
  if(!monthInput || !tableEl) return;

  const monthVal = monthInput.value;
  if(!monthVal){ tableEl.innerHTML='<div style="padding:16px;text-align:center;color:var(--muted2)">${L("Month चुनें","Select month")}</div>'; return; }

  const [yr, mo] = monthVal.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const allDates = [];
  for(let d = 1; d <= daysInMonth; d++){
    allDates.push(`${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  }

  // Include anyone with salary field (monthlySalary OR salary)
  const emps = getEmps().filter(e => {
    if(!e || e.status === 'resigned' || e.status === 'left' || e.status === 'left_team' || e.status === 'removed') return false;
    return _empMonthlySalary(e) > 0;
  });

  // Use getShift() — same source as Schedule grid (overrides + Firebase month grid + Excel)
  // Old bug: looked up schedules[emp.id][date] which does not exist (real path is schedules[YYYY_MM][id][dayIdx])
  const WORKING_DAYS = 26;
  const rows = [];
  let totalGross = 0, totalDeduct = 0, totalNet = 0;

  emps.forEach(emp => {
    const monthlySalary = _empMonthlySalary(emp);
    if(!monthlySalary) return;
    const perDaySalary = monthlySalary / WORKING_DAYS;
    let absentDays = 0;
    const abDates = [];
    allDates.forEach(date => {
      let sh = '';
      try{ sh = (typeof getShift === 'function') ? getShift(emp, date) : ''; }catch(e){ sh = ''; }
      if(_isAbsentShift(sh)){
        absentDays++;
        abDates.push(date);
      }
    });
    const deduction = Math.round(perDaySalary * absentDays);
    const netSalary  = monthlySalary - deduction;
    totalGross  += monthlySalary;
    totalDeduct += deduction;
    totalNet    += netSalary;
    const mobile = String(emp.phone || emp.mobile || '').replace(/\D/g,'').slice(-10);
    rows.push({
      emp, monthlySalary, absentDays, deduction, netSalary, perDaySalary, abDates,
      mobile, name: emp.name || '', empCode: emp.empId || '', section: (typeof getEmpSection==='function'?getEmpSection(emp):'') || emp.section || emp.sec || ''
    });
  });

  rows.sort((a,b) => {
    if(a.emp.sec !== b.emp.sec) return (a.emp.sec||'').localeCompare(b.emp.sec||'');
    return a.emp.name.localeCompare(b.emp.name);
  });

  // ── Export object for future embedded app ──
  window._manpowerCostData = {
    month: monthVal, year: yr, monthNum: mo,
    workingDays: WORKING_DAYS,
    totalGross, totalDeduct, totalNet,
    generatedAt: new Date().toISOString(),
    generatedBy: (SESSION && SESSION.name) || 'Manager',
    company: (SESSION && (SESSION.company || SESSION.companyId)) || '',
    perEmployee: rows.map(r=>({
      empId: r.empCode || (r.emp && r.emp.empId) || '',
      id: r.emp && r.emp.id,
      name: r.name || (r.emp && r.emp.name) || '',
      mobile: r.mobile || '',
      section: r.section || '',
      monthlySalary: r.monthlySalary,
      perDaySalary: Math.round(r.perDaySalary),
      absentDays: r.absentDays,
      abDates: r.abDates || [],
      deduction: r.deduction,
      netSalary: r.netSalary,
      cost: r.netSalary
    }))
  };
  // Archive finished months so historical team roster is preserved for download
  try{ _archiveManpowerCostIfPast(window._manpowerCostData); }catch(e){ console.warn('[cost archive]', e); }

  // ── Summary cards ──
  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const scG = document.getElementById('scTotalGross');
  const scD = document.getElementById('scTotalDeduct');
  const scN = document.getElementById('scTotalNet');
  if(scG) scG.textContent = fmt(totalGross);
  if(scD) scD.textContent = fmt(totalDeduct);
  if(scN) scN.textContent = fmt(totalNet);

  if(rows.length === 0){
    tableEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted2);font-size:13px">
      ⚠️ किसी employee की Monthly Salary upload नहीं है।<br>
      <span style="font-size:11px">Team tab → Excel Update → Monthly Salary column add करें</span>
    </div>`;
    return;
  }

  const monthName = new Date(yr, mo-1, 1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  let html = `
    <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:11px;font-weight:800;color:var(--muted2)">${monthName} · ${rows.length} Employees</div>
      <div style="font-size:10px;color:var(--muted)">26 working days</div>
    </div>
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11px;min-width:480px">
      <thead>
        <tr style="background:var(--card2)">
          <th style="padding:8px 10px;text-align:left;color:var(--muted2);font-size:10px">Employee</th>
          <th style="padding:8px 6px;text-align:right;color:#fbbf24;font-size:10px">Gross</th>
          <th style="padding:8px 6px;text-align:center;color:var(--lv);font-size:10px">Ab Days</th>
          <th style="padding:8px 6px;text-align:right;color:var(--lv);font-size:10px">Deduction</th>
          <th style="padding:8px 10px;text-align:right;color:var(--green);font-size:10px">Net Pay</th>
        </tr>
      </thead>
      <tbody>`;

  let lastSec = '';
  rows.forEach(r => {
    if(r.emp.sec !== lastSec){
      lastSec = r.emp.sec;
      const s = SEC[r.emp.sec] || {hi:r.emp.sec, color:'#94a3b8'};
      html += `<tr style="background:var(--bg2)"><td colspan="5" style="padding:5px 10px;font-size:9px;font-weight:800;color:${s.color};letter-spacing:1.5px;text-transform:uppercase">${escHtml(s.hi||r.emp.sec)}</td></tr>`;
    }
    const ab = r.absentDays > 0;
    html += `<tr style="border-bottom:1px solid var(--border);${ab?'background:rgba(244,63,94,.03)':''}">
      <td style="padding:8px 10px">
        <div style="font-size:11px;font-weight:700;color:var(--text)">${escHtml(r.emp.name)}</div>
        <div style="font-size:9px;color:var(--muted)">${escHtml(r.emp.empId||'—')}</div>
      </td>
      <td style="padding:8px 6px;text-align:right;color:#fbbf24;font-weight:700">₹${r.monthlySalary.toLocaleString('en-IN')}</td>
      <td style="padding:8px 6px;text-align:center" title="${ab && r.abDates && r.abDates.length ? ('Ab: '+r.abDates.map(d=>d.slice(8)).join(', ')) : ''}">${ab?`<span style="background:rgba(244,63,94,.15);color:var(--lv);border-radius:5px;padding:2px 8px;font-weight:800">${r.absentDays}</span>`:`<span style="color:var(--muted)">0</span>`}</td>
      <td style="padding:8px 6px;text-align:right;color:${ab?'var(--lv)':'var(--muted)'}">${ab?`−₹${r.deduction.toLocaleString('en-IN')}`:'—'}</td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;color:${ab?'var(--green)':'var(--muted2)'}">₹${r.netSalary.toLocaleString('en-IN')}</td>
    </tr>`;
  });

  const totalAb = rows.reduce((s,r)=>s+r.absentDays,0);
  html += `</tbody>
    <tfoot>
      <tr style="background:var(--card2);border-top:2px solid var(--border2)">
        <td style="padding:10px 10px;font-size:12px;font-weight:900;color:var(--text)">TOTAL (${rows.length})</td>
        <td style="padding:10px 6px;text-align:right;font-size:12px;font-weight:900;color:#fbbf24">₹${totalGross.toLocaleString('en-IN')}</td>
        <td style="padding:10px 6px;text-align:center;font-size:12px;font-weight:900;color:var(--lv)">${totalAb}</td>
        <td style="padding:10px 6px;text-align:right;font-size:12px;font-weight:900;color:var(--lv)">−₹${totalDeduct.toLocaleString('en-IN')}</td>
        <td style="padding:10px 10px;text-align:right;font-size:12px;font-weight:900;color:var(--green)">₹${totalNet.toLocaleString('en-IN')}</td>
      </tr>
    </tfoot>
    </table></div>`;

  tableEl.innerHTML = html;
}


/** Firebase path for monthly cost snapshot (preserves employees as of that month) */
function _manpowerCostArchivePath(monthKey){
  const cid = (typeof _normCompanyId==='function')
    ? _normCompanyId(SESSION.companyId || SESSION.company || 'default')
    : String(SESSION.companyId || SESSION.company || 'default');
  const mgr = (typeof _normMobileKey==='function')
    ? _normMobileKey(SESSION.mobile || SESSION.uid || 'mgr')
    : String(SESSION.mobile||'mgr').replace(/\D/g,'').slice(-10);
  return 'manpowerCostArchive/'+cid+'/'+mgr+'/'+String(monthKey).replace(/-/g,'_');
}

/** Save snapshot when viewing a past (finished) month */
function _archiveManpowerCostIfPast(data){
  if(!data || !data.month) return;
  if(!isAdminOrMgr()) return;
  const now = new Date();
  const [y,m] = String(data.month).split('-').map(Number);
  // Finished = strictly before current calendar month
  const isPast = (y < now.getFullYear()) || (y === now.getFullYear() && m < (now.getMonth()+1));
  if(!isPast) return;
  const path = _manpowerCostArchivePath(data.month);
  const payload = {
    ...data,
    archivedAt: new Date().toISOString(),
    archivedBy: SESSION.name || '',
    archivedByMobile: SESSION.mobile || ''
  };
  try{
    if(typeof fbSet === 'function'){
      fbSet(path, payload).catch(e=>console.warn('[archive cost]', e));
    }
  }catch(e){}
  try{ localStorage.setItem('mp_cost_'+data.month, JSON.stringify(payload)); }catch(e){}
}

async function _loadManpowerCostArchive(monthKey){
  try{
    const path = _manpowerCostArchivePath(monthKey);
    if(typeof fbGet === 'function'){
      const remote = await fbGet(path);
      if(remote && remote.perEmployee) return remote;
    }
  }catch(e){}
  try{
    const raw = localStorage.getItem('mp_cost_'+monthKey);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return null;
}

/**
 * Manager download — branded Excel (Man Power + VKS Tech)
 * Columns: Name, Mobile, Salary, Ab Days, Deduction, Cost (Net)
 */
async function exportSalaryCost(){
  if(!isAdminOrMgr()){ toast('❌ Only Manager/Admin'); return; }
  let d = window._manpowerCostData;
  if(!d || !d.perEmployee){
    // try archive for selected month
    const monthInput = document.getElementById('salaryCostMonth');
    const mk = monthInput && monthInput.value;
    if(mk) d = await _loadManpowerCostArchive(mk);
  }
  if(!d || !d.perEmployee){ toast(L('⚠️ पहले month select करें / Cost calculate करें','⚠️ Select month / calculate cost first')); return; }

  const monthName = new Date(d.year, d.monthNum-1, 1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const genAt = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const company = d.company || SESSION.company || '';
  const fileBase = 'ManPower_Cost_'+String(d.month).replace(/-/g,'_');

  try{ await _ensureXlsxLib(); }catch(e){}

  // Prefer SheetJS xlsx
  try{
    if(window.XLSX){
      const aoa = [];
      aoa.push(['Man Power App — Manpower Cost Report']);
      aoa.push(['VKS Tech — Technology is power · vkstech.com']);
      aoa.push(['Month', monthName, 'Company', company]);
      aoa.push(['Generated', genAt, 'By', d.generatedBy || SESSION.name || '']);
      aoa.push(['Working days basis', d.workingDays || 26]);
      aoa.push([]);
      aoa.push(['#','Employee Code','Name','Mobile','Section','Monthly Salary (₹)','Per Day (₹)','Ab Days','Ab Deduction (₹)','Cost / Net Payable (₹)']);
      d.perEmployee.forEach((r,i)=>{
        aoa.push([
          i+1,
          r.empId || '',
          r.name || '',
          r.mobile ? ("'"+String(r.mobile)) : '',
          r.section || '',
          r.monthlySalary || 0,
          r.perDaySalary || 0,
          r.absentDays || 0,
          r.deduction || 0,
          r.netSalary != null ? r.netSalary : r.cost || 0
        ]);
      });
      const totalAb = d.perEmployee.reduce((s,r)=>s+(r.absentDays||0),0);
      aoa.push([]);
      aoa.push(['','','TOTAL','','', d.totalGross||0, '', totalAb, d.totalDeduct||0, d.totalNet||0]);
      aoa.push([]);
      aoa.push(['Formula: Net = Monthly Salary − (Ab days × Monthly ÷ 26)']);
      aoa.push(['© Man Power App · Powered by VKS Tech']);

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [
        {wch:4},{wch:12},{wch:20},{wch:12},{wch:14},
        {wch:14},{wch:10},{wch:8},{wch:14},{wch:16}
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Manpower Cost');
      XLSX.writeFile(wb, fileBase + '.xlsx');
      toast('📤 Excel downloaded · Man Power + VKS Tech');
      return;
    }
  }catch(e){ console.warn('[exportSalaryCost xlsx]', e); }

  // HTML .xls fallback with logo
  try{
    let logoDataUrl = null;
    try{ logoDataUrl = await _loadVksLogoDataUrl(); }catch(e){}
    const rowsHtml = d.perEmployee.map((r,i)=>`<tr>
      <td>${i+1}</td>
      <td>${escHtml(r.empId||'')}</td>
      <td>${escHtml(r.name||'')}</td>
      <td>${escHtml(r.mobile||'')}</td>
      <td>${escHtml(r.section||'')}</td>
      <td style="text-align:right">${r.monthlySalary||0}</td>
      <td style="text-align:center">${r.absentDays||0}</td>
      <td style="text-align:right">${r.deduction||0}</td>
      <td style="text-align:right">${r.netSalary!=null?r.netSalary:r.cost||0}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileBase}</title>
<style>body{font-family:Arial,sans-serif;font-size:12px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:6px 8px}th{background:#0f172a;color:#fff}h1{color:#ea580c;margin:0} .sub{color:#64748b;font-size:11px}</style></head><body>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
  ${logoDataUrl?`<img src="${logoDataUrl}" width="48" height="48" style="border-radius:10px"/>`:''}
  <div>
    <h1>Man Power App — Manpower Cost</h1>
    <div class="sub">VKS Tech — Technology is power · ${monthName} · ${company}</div>
  </div>
</div>
<table>
<thead><tr><th>#</th><th>Code</th><th>Name</th><th>Mobile</th><th>Section</th><th>Salary</th><th>Ab Days</th><th>Deduction</th><th>Cost (Net)</th></tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
<p class="sub">Generated ${genAt} by ${d.generatedBy||''} · © Man Power · VKS Tech</p>
</body></html>`;
    const blob = new Blob([html], {type:'application/vnd.ms-excel;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileBase + '.xls';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast('📤 Excel downloaded · Man Power + VKS Tech');
  }catch(e2){
    console.warn(e2);
    toast('❌ Download failed');
  }
}

async function loadDeviceInfoForCard(empId, empName){
  const el=document.getElementById('devinfo_'+empId);
  if(!el) return;
  try{
    const dRec=await fbGet('deviceApprovals/'+empId);
    const revokeRec=await fbGet('userApprovals/'+empId).catch(()=>null);
    // Get access level from employee record
    const emp = getEmps().find(e=>e.id===empId);
    const accessLevel = emp?.accessLevel || 'worker';
    const accessBadge = accessLevel==='manager'?'<span style="color:#a855f7;font-weight:800;font-size:10px">🏅 MANAGER</span>&nbsp;·&nbsp;':
                        accessLevel==='supervisor'?'<span style="color:#38bdf8;font-weight:800;font-size:10px">👁️ SUP</span>&nbsp;·&nbsp;':'';
    if(revokeRec&&revokeRec.status==='revoked'){
      el.innerHTML=`${accessBadge}<span style="color:#f43f5e;font-weight:700">🚫 Access Revoked</span>`;
      return;
    }
    if(!dRec||!dRec.approvedDeviceId){
      el.innerHTML=`${accessBadge}<span style="color:#64748b">📵 No device registered</span>`;
      return;
    }
    const expDate=new Date(dRec.validTill||0);
    const daysLeft=Math.ceil((expDate-Date.now())/86400000);
    const expColor=daysLeft<7?'#f43f5e':daysLeft<30?'#f97316':'#22c55e';
    el.innerHTML=`${accessBadge}<span style="color:#38bdf8">📱 Registered</span>
      &nbsp;·&nbsp;<span style="color:${expColor};font-weight:900">${daysLeft>0?daysLeft+' दिन बाकी':'⚠️ EXPIRED'}</span>
      &nbsp;·&nbsp;<span style="color:#64748b;font-size:10px">${expDate.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>`;
  }catch(e){
    el.innerHTML='<span style="color:#64748b">📵 No device info</span>';
  }
}

async function openDeviceManager(empId, empName){
  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML=`<div style="background:#1e293b;border:1px solid #334155;border-radius:20px;padding:22px;max-width:360px;width:100%;max-height:90vh;overflow-y:auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
      <div style="font-size:32px">📱</div>
      <div>
        <div style="font-size:16px;font-weight:900;color:#fff">${empName}</div>
        <div style="font-size:11px;color:#64748b">Device & Access Manager</div>
      </div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="margin-left:auto;background:none;border:none;color:#64748b;font-size:20px;cursor:pointer">✕</button>
    </div>
    <div id="dmContent_${empId}" style="min-height:80px;display:flex;align-items:center;justify-content:center">
      <div style="width:32px;height:32px;border:2px solid rgba(249,115,22,.2);border-top-color:#f97316;border-radius:50%;animation:spin 1s linear infinite"></div>
    </div>
  </div>`;
  document.body.appendChild(modal);
  await loadDeviceManagerContent(empId, empName);
}

async function loadDeviceManagerContent(empId, empName){
  const el=document.getElementById('dmContent_'+empId);
  if(!el) return;
  try{
    const [dRec, revokeRec, loginReqs] = await Promise.all([
      fbGet('deviceApprovals/'+empId).catch(()=>null),
      fbGet('userApprovals/'+empId).catch(()=>null),
      fbGet('loginRequests').catch(()=>null)
    ]);
    const isRevoked=revokeRec&&revokeRec.status==='revoked';
    const expDate=dRec&&dRec.validTill?new Date(dRec.validTill):null;
    const daysLeft=expDate?Math.ceil((expDate-Date.now())/86400000):null;
    const expColor=daysLeft==null?'#64748b':daysLeft<7?'#f43f5e':daysLeft<30?'#f97316':'#22c55e';
    const myLoginReqs=loginReqs?Object.values(loginReqs).filter(r=>r.empObjId===empId):[];
    const pendingReqs=myLoginReqs.filter(r=>r.status==='pending');
    const approvedReqs=myLoginReqs.filter(r=>r.status==='approved');

    el.innerHTML=`
      <!-- Access Status -->
      <div style="background:${isRevoked?'rgba(244,63,94,.1)':'rgba(34,197,94,.08)'};border:1px solid ${isRevoked?'rgba(244,63,94,.3)':'rgba(34,197,94,.2)'};border-radius:12px;padding:14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:800;color:#64748b;letter-spacing:.5px;margin-bottom:6px">ACCESS STATUS</div>
        <div style="font-size:15px;font-weight:900;color:${isRevoked?'#f43f5e':'#22c55e'}">${isRevoked?'🚫 Revoked':'✅ Active'}</div>
        ${isRevoked?`<div style="font-size:11px;color:#64748b;margin-top:4px">Revoked on ${revokeRec.revokedAt?new Date(revokeRec.revokedAt).toLocaleDateString('en-IN'):'—'}</div>`:''}
        <div style="display:flex;gap:8px;margin-top:10px">
          ${isRevoked
            ? `<button onclick="adminRestoreAccess('${empId}','${empName}')" style="flex:1;padding:10px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);border-radius:9px;color:#22c55e;font-size:13px;font-weight:700;cursor:pointer">✅ Restore Access</button>`
            : `<button onclick="adminRevokeAccess('${empId}','${empName}')" style="flex:1;padding:10px;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:9px;color:#f43f5e;font-size:13px;font-weight:700;cursor:pointer">🚫 Revoke Access</button>`
          }
        </div>
      </div>

      <!-- Device Info -->
      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:800;color:#64748b;letter-spacing:.5px;margin-bottom:8px">REGISTERED DEVICE</div>
        ${dRec&&dRec.approvedDeviceId?`
          <div style="font-size:13px;color:#94a3b8;margin-bottom:6px">Device ID: <span style="color:#fff;font-family:monospace">${dRec.approvedDeviceId.substring(0,18)}...</span></div>
          <div style="font-size:13px;color:#94a3b8">Approved: <span style="color:#fff">${dRec.approvedAt?new Date(dRec.approvedAt).toLocaleDateString('en-IN'):'—'}</span></div>
          <div style="font-size:13px;margin-top:4px">Expiry: <span style="color:${expColor};font-weight:700">${expDate?expDate.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'} (${daysLeft!=null?(daysLeft>0?daysLeft+' days left':'EXPIRED'):'—'})</span></div>
        `:`<div style="color:#64748b;font-size:13px">📵 No device registered yet</div>`}
        ${dRec&&dRec.approvedDeviceId?`
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button onclick="adminExtendExpiry('${empId}','${empName}',30)" style="flex:1;min-width:100px;padding:9px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3);border-radius:9px;color:#f97316;font-size:12px;font-weight:700;cursor:pointer">+30 Days</button>
            <button onclick="adminExtendExpiry('${empId}','${empName}',90)" style="flex:1;min-width:100px;padding:9px;background:rgba(249,115,22,.15);border:1px solid rgba(249,115,22,.4);border-radius:9px;color:#f97316;font-size:12px;font-weight:700;cursor:pointer">+90 Days</button>
            <button onclick="adminExtendExpiry('${empId}','${empName}',365)" style="flex:1;min-width:100px;padding:9px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);border-radius:9px;color:#a855f7;font-size:12px;font-weight:700;cursor:pointer">+1 Year</button>
            <button onclick="adminRemoveDevice('${empId}','${empName}')" style="flex:1;min-width:100px;padding:9px;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:9px;color:#f43f5e;font-size:12px;font-weight:700;cursor:pointer">🗑️ Remove</button>
          </div>`:''}
      </div>

      <!-- Login History -->
      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:14px">
        <div style="font-size:12px;font-weight:800;color:#64748b;letter-spacing:.5px;margin-bottom:8px">LOGIN REQUESTS (${myLoginReqs.length} total · ${pendingReqs.length} pending)</div>
        ${myLoginReqs.length===0?`<div style="color:#64748b;font-size:12px">No login requests yet</div>`:
          myLoginReqs.slice(-5).reverse().map(r=>{
            const statusColor={'approved':'#22c55e','rejected':'#f43f5e','pending':'#f97316','cancelled':'#64748b'}[r.status]||'#94a3b8';
            return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e293b">
              <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-size:12px;color:#fff;font-weight:700">${r.status.toUpperCase()}</div>
                <div style="font-size:11px;color:#64748b">${r.requestedAt?new Date(r.requestedAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</div>
              </div>
            </div>`;
          }).join('')
        }
      </div>`;
  }catch(e){
    el.innerHTML=`<div style="color:#f43f5e;font-size:13px">Error: ${escHtml(e.message)}</div>`;
  }
}

async function adminExtendExpiry(empId, empName, days){
  try{
    const dRec=await fbGet('deviceApprovals/'+empId).catch(()=>null);
    const base=dRec&&dRec.validTill&&new Date(dRec.validTill)>new Date()?new Date(dRec.validTill):new Date();
    const newExp=new Date(base.getTime()+days*86400000);
    await fbUpdate('deviceApprovals/'+empId,{
      validTill:newExp.toISOString(), extendedBy:SESSION.name,
      extendedAt:new Date().toISOString()
    });
    toast('✅ '+empName+L(' की expiry ',' expiry extended by ')+days+L(' दिन बढ़ाई → ',' days → ')+newExp.toLocaleDateString('en-IN'));
    loadDeviceManagerContent(empId, empName);
    loadDeviceInfoForCard(empId, empName);
  }catch(e){ toast('❌ Error: '+e.message); }
}

async function adminRemoveDevice(empId, empName){
  const ok = await confirmModal(L('Device हटाएं?','Remove device?'), `<b>${empName}</b> ${L('का device हटाया जाएगा।<br>Login के लिए Admin approval लेनी होगी।','device will be removed.<br>Admin approval will be needed to login.')}`, L('🗑️ हाँ, हटाएं','🗑️ Yes, Remove'), L('रद्द करें','Cancel'));
  if(!ok) return;
  try{
    await fbUpdate('deviceApprovals/'+empId,{
      approvedDeviceId:null, removedBy:SESSION.name, removedAt:new Date().toISOString()
    });
    toast('✅ '+empName+L(' का device हटाया गया',' device removed'));
    loadDeviceManagerContent(empId, empName);
    loadDeviceInfoForCard(empId, empName);
  }catch(e){ toast('❌ Error: '+e.message); }
}

async function adminRevokeAccess(empId, empName){
  const ok = await confirmModal(L('Access Revoke करें?','Revoke access?'), `<b>${empName}</b> ${L('की App access revoke होगी।<br>वो login नहीं कर पाएंगे।','app access will be revoked.<br>They will not be able to login.')}`, L('🚫 हाँ, Revoke करें','🚫 Yes, Revoke'), L('रद्द करें','Cancel'));
  if(!ok) return;
  try{
    await fbUpdate('userApprovals/'+empId,{
      status:'revoked', revokedBy:SESSION.name, revokedAt:new Date().toISOString()
    });
    toast('🚫 '+empName+L(' की access revoke कर दी',' access revoked'));
    loadDeviceManagerContent(empId, empName);
    loadDeviceInfoForCard(empId, empName);
  }catch(e){ toast('❌ Error: '+e.message); }
}

async function adminRestoreAccess(empId, empName){
  try{
    await fbUpdate('userApprovals/'+empId,{
      status:'active', restoredBy:SESSION.name, restoredAt:new Date().toISOString()
    });
    toast('✅ '+empName+L(' की access restore हो गई',' access restored'));
    loadDeviceManagerContent(empId, empName);
    loadDeviceInfoForCard(empId, empName);
  }catch(e){ toast('❌ Error: '+e.message); }
}

function showEmpNcrs(empId){
  const emp = getEmps().find(e=>e.id===empId);
  if(!emp) return;
  const ncrs = getNcrForEmp(empId);
  if(!ncrs.length){ toast(L('इस कर्मचारी का कोई NCR नहीं है','No NCR for this employee')); return; }

  // Sort newest first
  const sorted = [...ncrs].sort((a,b)=>b.date.localeCompare(a.date));

  const rows = sorted.map(n=>{
    const d = new Date(n.date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
    const yr = n.year||n.date.substring(0,4);
    return `<div style="background:rgba(244,63,94,.05);border:1px solid rgba(244,63,94,.2);border-radius:10px;padding:11px 13px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="background:rgba(244,63,94,.2);color:var(--lv);font-size:11px;font-weight:900;padding:2px 8px;border-radius:5px;flex-shrink:0">NCR #${n.ncr}</span>
        <span style="font-size:11px;color:var(--muted2)">${d}</span>
      </div>
      <div style="font-size:13px;color:var(--text);line-height:1.5">${escHtml(n.reason)}</div>
      ${n.names.length>1?`<div style="font-size:11px;color:var(--muted2);margin-top:5px">👥 साथ: ${escHtml(n.names.filter(nm=>{const id=NCR_NAME_MAP[nm]; return id&&id!==empId;}).join(', ')||'—')}</div>`:''}
    </div>`;
  }).join('');

  openModal(`<div class="modal-handle"></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <div style="width:42px;height:42px;border-radius:10px;background:rgba(244,63,94,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">⚠️</div>
      <div>
        <div style="font-size:17px;font-weight:900;color:#fff">${escHtml(emp.name)}</div>
        <div style="font-size:12px;color:var(--lv)">${L("कुल","Total")} ${ncrs.length} NCR दर्ज हैं</div>
      </div>
    </div>
    <div style="max-height:60vh;overflow-y:auto;padding-right:4px">
      ${rows}
    </div>
    <button class="cancel-btn" onclick="closeModal()" style="margin-top:10px">${L('बंद करें','Close')}</button>`);
}


// ════════════════════════════════════════════════════════════════════════
//  EMPLOYEE UPLOAD WIZARD — Step 1: Guide  →  Step 2: Upload  →  Step 3: Preview & Confirm
//  Supports: .xlsx, .xls, .csv
//  Matches existing employees by empId (Employee Code) — UPDATES them
//  New empId → ADDS as new employee (id = 'eu_' + Date.now())
//  DOES NOT touch: leaves, reports, overrides, schedules, deviceApprovals
// ════════════════════════════════════════════════════════════════════════

// ── Role → section mapping ──
const ROLE_TO_SEC = {
  'operator':   null,         // determined by machine
  'assistant':  null,         // determined by machine
  'supervisor': 'SUP',
  'manager':    'MGR',
  'engineer':   'SUP',
  'get':        'SUP',
};

const MC_TO_SEC = {
  // Metalliser-1
  'm-1':'M1','m1':'M1','metalliser-1':'M1','metalliser 1':'M1','met-1':'M1','m-1&2':'M1','met 1':'M1',
  // Metalliser-2
  'm-2':'M2','m2':'M2','metalliser-2':'M2','metalliser 2':'M2','met-2':'M2','met 2':'M2',
  // Slitter-1
  's-1':'S1','s1':'S1','slitter-1':'S1','slitter 1':'S1',
  // Slitter-2
  's-2':'S2','s2':'S2','slitter-2':'S2','slitter 2':'S2',
  // Slitter both (S-1&2, S-1/2 etc.) — assign S1 as primary
  's-1&2':'S1','s-1/2':'S1','s1&2':'S1','s1/2':'S1','s-1 & 2':'S1','slitter':'S1',
  // Metalliser both (M-1&2 etc.) — assign M1 as primary
  'm-1&2':'M1','m1&2':'M1','m-1/2':'M1','metalliser':'M1',
  // Supervisor / Engineer / Manager
  'sup':'SUP','supervisor':'SUP','engg':'SUP','eng':'SUP','engineer':'SUP',
  'met':'M1','all':'MGR','mgr':'MGR','manager':'MGR',
};

const WOFF_VALUES = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

let _empUploadParsed = []; // holds parsed rows before confirm

function openEmpUploadWizard(){
  _empUploadParsed = [];
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📤 कर्मचारी List Upload करें</div>

    <!-- FORMAT GUIDE -->
    <div style="background:rgba(249,115,22,.07);border:1px solid rgba(249,115,22,.25);border-radius:12px;padding:14px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:10px">📋 File Format Guide</div>
      <div style="font-size:11px;color:var(--muted2);line-height:1.8">
        Excel (.xlsx / .xls) या CSV file में नीचे दिए <b style="color:#fff">Column Headers</b> होने चाहिए:<br>
        <span style="display:inline-block;margin-top:8px;line-height:2">
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#f97316;font-weight:700;font-size:11px">Name</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#f97316;font-weight:700;font-size:11px">Employee Code</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#f97316;font-weight:700;font-size:11px">Machine</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#22c55e;font-weight:700;font-size:11px">Role</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#22c55e;font-weight:700;font-size:11px">Weekly Off</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#22c55e;font-weight:700;font-size:11px">Phone</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#fbbf24;font-weight:700;font-size:11px">Monthly Salary</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#64748b;font-weight:700;font-size:11px">Joining Date</span>
          <span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;color:#64748b;font-weight:700;font-size:11px">Date of Birth</span>
        </span>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--muted2);line-height:1.8">
        <b style="color:#f97316">🟠 Name, Employee Code, Machine:</b> अनिवार्य<br>
        <b style="color:#22c55e">🟢 Role, Weekly Off, Phone:</b> जरूरी (खाली छोड़ सकते हैं, default लगेगा)<br>
        <b style="color:#fbbf24">🟡 Monthly Salary:</b> Optional — Cost calculation के लिए (only numbers, e.g. 15000)<br>
        <b style="color:#64748b">⚫ Joining Date, DOB:</b> Optional<br><br>
        <b style="color:#fff">Role के लिए मान्य values:</b> Operator, Assistant, Supervisor, Manager, Engineer<br>
        <b style="color:#fff">Weekly Off:</b> MON, TUE, WED, THU, FRI, SAT, SUN<br>
        <b style="color:#fff">Machine:</b> M-1, M-2, S-1, S-2, ALL<br><br>
        <b style="color:#22c55e">✅ Existing Employee Code मिलने पर:</b> Details UPDATE होंगी<br>
        <b style="color:#3b82f6">🆕 New Employee Code:</b> नया कर्मचारी ADD होगा
      </div>
    </div>

    <!-- FILE UPLOAD AREA -->
    <div onclick="document.getElementById('empUploadFileInput').click()"
      style="border:2px dashed rgba(249,115,22,.4);border-radius:14px;padding:24px;text-align:center;cursor:pointer;background:rgba(249,115,22,.04);margin-bottom:12px"
      ondragover="event.preventDefault()" ondrop="_empUploadDrop(event)">
      <div style="font-size:32px;margin-bottom:8px">📁</div>
      <div style="font-size:14px;font-weight:800;color:#f97316">${L("File चुनें या यहाँ Drop करें","Choose file or drop here")}</div>
      <div style="font-size:11px;color:var(--muted2);margin-top:4px">.xlsx, .xls, .csv supported</div>
    </div>
    <input type="file" id="empUploadFileInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="_empUploadFileChosen(this)">

    <div id="empUploadStatus" style="display:none;padding:10px;border-radius:10px;font-size:12px;margin-bottom:8px"></div>

    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>
  `);
}

function _empUploadDrop(e){
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if(file) _parseEmpUploadFile(file);
}

function _empUploadFileChosen(input){
  const file = input.files?.[0];
  if(file) _parseEmpUploadFile(file);
}

async function _parseEmpUploadFile(file){
  const statusEl = document.getElementById('empUploadStatus');
  statusEl.style.display = 'block';
  statusEl.style.background = 'rgba(59,130,246,.08)';
  statusEl.style.border = '1px solid rgba(59,130,246,.2)';
  statusEl.innerHTML = '⏳ फ़ाइल पढ़ी जा रही है...';

  try{
    // Load SheetJS if needed
    if(!window.XLSX){
      await new Promise((res,rej)=>{
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=res; s.onerror=rej;
        document.head.appendChild(s);
      });
    }

    const buf = await file.arrayBuffer();
    let rows;

    if(file.name.toLowerCase().endsWith('.csv')){
      // CSV: decode as text
      const text = new TextDecoder('utf-8').decode(buf);
      rows = text.trim().split('\n').map(r =>
        r.split(',').map(c => c.trim().replace(/^"|"$/g,''))
      );
    } else {
      const wb = XLSX.read(buf,{type:'array',cellDates:true});
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
    }

    if(!rows || rows.length < 2){
      statusEl.style.background = 'rgba(239,68,68,.1)';
      statusEl.innerHTML = '❌ File में कोई data नहीं मिला';
      return;
    }

    // ── Map header columns ──
    const rawHeader = rows[0].map(h => String(h||'').toLowerCase().trim());
    const colIdx = {};
    const colAliases = {
      name:          ['name','नाम','employee name','emp name','full name'],
      empId:         ['employee code','emp code','empid','employee id','emp id','code','id'],
      machine:       ['machine','mc','machine/section','section machine'],
      role:          ['role','designation','position','post'],
      woff:          ['weekly off','weekly off day','woff','week off','off day'],
      phone:         ['phone','mobile','mobile no','phone no','contact','ph no'],
      salary:        ['monthly salary','salary','basic salary','ctc','monthly ctc','basic pay','मासिक वेतन','वेतन','sal','gross','gross salary','net salary','net pay','wage','wages','pay'],
      joiningDate:   ['joining date','joining','date of joining','doj'],
      dob:           ['date of birth','dob','birth date','d.o.b'],
    };
    Object.entries(colAliases).forEach(([key, aliases])=>{
      colIdx[key] = rawHeader.findIndex(h => aliases.some(a => h.includes(a)));
    });

    // Validate required columns
    if(colIdx.name < 0 || colIdx.empId < 0){
      statusEl.style.background = 'rgba(239,68,68,.1)';
      statusEl.innerHTML = '❌ "Name" और "Employee Code" columns नहीं मिले। Headers check करें।';
      return;
    }

    // ── Show detected columns feedback ──
    const detectedCols = Object.entries(colIdx).filter(([k,v])=>v>=0).map(([k])=>k);
    const salaryFound = colIdx.salary >= 0;
    statusEl.style.background = 'rgba(34,197,94,.08)';
    statusEl.style.border = '1px solid rgba(34,197,94,.2)';
    statusEl.innerHTML = `✅ Columns मिले: ${detectedCols.join(', ')} ${salaryFound?'<b style="color:#fbbf24">💰 Salary detected!</b>':'<span style="color:#f97316">⚠️ Salary column नहीं मिला</span>'}`;
    const existingEmps = getEmps();
    const parsed = [];
    const errors  = [];

    for(let i = 1; i < rows.length; i++){
      const row = rows[i];
      if(!row || row.every(c=>!c)) continue; // skip blank rows

      const name    = String(row[colIdx.name]||'').trim().toUpperCase();
      const empCode = String(row[colIdx.empId]||'').trim();
      if(!name || !empCode){ errors.push(`Row ${i+1}: Name/Code खाली`); continue; }

      const machineRaw = colIdx.machine >= 0 ? String(row[colIdx.machine]||'').trim() : '';
      const roleRaw    = colIdx.role    >= 0 ? String(row[colIdx.role]||'').trim().toLowerCase() : '';
      const woffRaw    = colIdx.woff    >= 0 ? String(row[colIdx.woff]||'').trim().toUpperCase() : '';
      const phoneRaw   = colIdx.phone   >= 0 ? String(row[colIdx.phone]||'').trim().replace(/\D/g,'') : '';
      const salaryRaw  = colIdx.salary  >= 0 ? String(row[colIdx.salary]||'').trim().replace(/[^0-9.]/g,'') : '';
      const joinRaw    = colIdx.joiningDate >= 0 ? String(row[colIdx.joiningDate]||'').trim() : '';
      const dobRaw     = colIdx.dob     >= 0 ? String(row[colIdx.dob]||'').trim() : '';

      // ── Determine sec from role + machine ──
      let sec = ROLE_TO_SEC[roleRaw] || null;
      if(!sec){
        sec = MC_TO_SEC[machineRaw.toLowerCase()] || 'M1';
      }

      // ── Match existing employee (needed for preserving data) ──
      const existing = existingEmps.find(e =>
        e.empId && e.empId.trim().toUpperCase() === empCode.toUpperCase()
      );

      // ── Determine resp (responsibility) from Machine column ──
      // Rule: Specific machine (M-1, M-2, S-1, S-2) = Main Operator (Operation)
      //       Combined machine (M-1&2, S-1&2) = Reliever/Team Member (Setup)
      //       SUP/ENGG = Supervisor, MGR = Manager
      const mcLower = machineRaw.toLowerCase().trim();
      let resp;
      if(mcLower === 'sup' || mcLower === 'engg' || mcLower === 'engineer'){
        resp = 'P,Q,M';
      } else if(mcLower === 'mgr' || mcLower === 'manager'){
        resp = 'Manager';
      } else if(mcLower === 'm-1' || mcLower === 'm1' || mcLower === 'm-2' || mcLower === 'm2' ||
                mcLower === 's-1' || mcLower === 's1' || mcLower === 's-2' || mcLower === 's2'){
        resp = 'Operation'; // Specific machine = Main Operator
      } else if(mcLower.includes('&') || mcLower.includes('/') || mcLower === 'met' || mcLower === 'slitter'){
        resp = 'Setup'; // Combined machine = Reliever/Team Member
      } else {
        const r = roleRaw.toLowerCase();
        if(r.includes('supervisor') || r.includes('engg') || r.includes('engineer')) resp = 'P,Q,M';
        else if(r.includes('manager')) resp = 'Manager';
        else resp = existing?.resp || 'Operation';
      }

      // ── Joining date — use robust parser ──
      const joiningDate = _parseExcelDate(joinRaw);
      const dob = _parseExcelDate(dobRaw);

      // ── Determine woff ──
      const woff = WOFF_VALUES.includes(woffRaw) ? woffRaw :
                   WOFF_VALUES.includes(woffRaw.substring(0,3)) ? woffRaw.substring(0,3) :
                   (existing?.woff || 'SUN');

      // ── Phone validation ──
      const phone = (phoneRaw.length === 10) ? phoneRaw :
                    (phoneRaw.length === 12 && phoneRaw.startsWith('91')) ? phoneRaw.slice(2) :
                    phoneRaw.replace(/\D/g,'').slice(-10) || '';

      // ── Designation — keep from Excel ──
      const desig = roleRaw ? (roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1)) : (existing?.designation || 'Team Member');

      // ── Duplicate mobile: already used by another employee / other team ──
      let phoneConflict = null;
      if(phone && phone.length === 10){
        phoneConflict = _findPhoneConflict(phone, existing?.id, empCode);
      }

      parsed.push({
        _isNew:    !existing,
        id:        existing ? existing.id : ('eu_' + Date.now() + '_' + Math.random().toString(36).slice(2,5)),
        name, empId: empCode, sec, mc: machineRaw || (existing?.mc || '—'),
        resp,
        woff, phone,
        designation: desig,
        joiningDate, dob,
        monthlySalary: salaryRaw ? parseFloat(salaryRaw) : (existing?.monthlySalary || null),
        status:    existing ? (existing.status || 'active') : 'active',
        ms:        existing ? (existing.ms || Array(31).fill('D')) : Array(31).fill('D'),
        _rowNum:   i + 1,
        _phoneConflict: !!phoneConflict,
        _otherTeam: !!(phoneConflict && phoneConflict.otherTeam),
        _conflictWith: phoneConflict ? (phoneConflict.emp.name || phoneConflict.emp.empId || '') : '',
        _conflictMgr: phoneConflict && phoneConflict.emp.managerId ? phoneConflict.emp.managerId : '',
        _skipSave: !!phoneConflict, // do not add/update if phone belongs to someone else
      });
    }

    // Within-file duplicate phones: mark later rows as conflict
    const seenPhone = new Map();
    parsed.forEach(p => {
      if(!p.phone || p.phone.length !== 10) return;
      if(seenPhone.has(p.phone)){
        p._phoneConflict = true;
        p._otherTeam = p._otherTeam || false;
        p._conflictWith = p._conflictWith || ('Row ' + seenPhone.get(p.phone));
        p._skipSave = true;
        p._fileDup = true;
      } else {
        seenPhone.set(p.phone, p._rowNum);
      }
    });

    _empUploadParsed = parsed;

    if(parsed.length === 0){
      statusEl.style.background = 'rgba(239,68,68,.1)';
      statusEl.innerHTML = `❌ कोई valid row नहीं मिली।${errors.length ? ' Errors: ' + errors.join(', ') : ''}`;
      return;
    }

    // ── Show preview ──
    _showEmpUploadPreview(parsed, errors);

  }catch(err){
    statusEl.style.background = 'rgba(239,68,68,.1)';
    statusEl.innerHTML = '❌ Error: ' + escHtml(err.message);
  }
}

function _showEmpUploadPreview(parsed, errors){
  const okRows = parsed.filter(p => !p._skipSave);
  const conflictRows = parsed.filter(p => p._skipSave);
  const newCount = okRows.filter(p => p._isNew).length;
  const updCount = okRows.length - newCount;
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');

  const rows = parsed.map(p => {
    const conflict = !!p._skipSave;
    const badge = conflict
      ? (p._otherTeam
          ? `<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;background:rgba(244,63,94,.2);color:#fb7185">🚫 ${L('दूसरी team','Other team')}</span>`
          : p._fileDup
            ? `<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;background:rgba(244,63,94,.2);color:#fb7185">🚫 ${L('File में Dup','Dup in file')}</span>`
            : `<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;background:rgba(244,63,94,.2);color:#fb7185">🚫 ${L('Phone लिया','Phone taken')}</span>`)
      : `<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;${p._isNew?'background:rgba(34,197,94,.15);color:#22c55e':'background:rgba(59,130,246,.15);color:#60a5fa'}">${p._isNew ? '🆕 New' : '✏️ Update'}</span>`;
    const tip = conflict
      ? (isEn
          ? `Mobile ${escHtml(p.phone)} already used by ${p._conflictWith||'another member'}${p._otherTeam?' (other team)':''}. Will NOT be saved.`
          : `मोबाइल ${escHtml(p.phone)} पहले से ${p._conflictWith||'दूसरे member'} के पास है${p._otherTeam?' (दूसरी team)':''}. Save नहीं होगा।`)
      : '';
    const secMeta = getSectionMeta(p.sec || p.section);
    return `
    <tr style="border-bottom:1px solid var(--border2);${conflict?'background:rgba(244,63,94,.12);outline:1px solid rgba(244,63,94,.35);':''}" title="${escHtml(tip)}">
      <td style="padding:6px 8px;font-size:11px;font-weight:700;color:${conflict?'#fda4af':'#fff'}">${escHtml(p.name)}${conflict?' ⚠️':''}</td>
      <td style="padding:6px 4px;font-size:10px;color:var(--muted2)">${escHtml(p.empId)}</td>
      <td style="padding:6px 4px;font-size:10px">
        <span style="background:${secMeta.bg};color:${secMeta.color};border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700">${escHtml(p.sec||p.section||'—')}</span>
      </td>
      <td style="padding:6px 4px;font-size:10px;color:var(--muted2)">${escHtml(p.mc)}</td>
      <td style="padding:6px 4px;font-size:10px;color:var(--muted2)">${p.woff}</td>
      <td style="padding:6px 4px;font-size:10px;font-weight:${conflict?'800':'400'};color:${conflict?'#fb7185':'var(--muted2)'}">${escHtml(p.phone||'—')}${conflict?' ⛔':''}</td>
      <td style="padding:6px 4px;font-size:10px;color:${p.monthlySalary?'#fbbf24':'var(--muted2)'};font-weight:${p.monthlySalary?'700':'400'}">${p.monthlySalary?'₹'+Number(p.monthlySalary).toLocaleString('en-IN'):'—'}</td>
      <td style="padding:6px 4px;font-size:10px;color:${p.joiningDate?'#34d399':'var(--muted2)'}">${p.joiningDate ? new Date(p.joiningDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
      <td style="padding:6px 4px;text-align:center">${badge}</td>
    </tr>`;
  }).join('');

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">👁️ Preview — Save करने से पहले देखें</div>

    <!-- Summary strip -->
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <div style="flex:1;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#22c55e">${newCount}</div>
        <div style="font-size:10px;color:var(--muted2)">नए कर्मचारी</div>
      </div>
      <div style="flex:1;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#60a5fa">${updCount}</div>
        <div style="font-size:10px;color:var(--muted2)">Update होंगे</div>
      </div>
      <div style="flex:1;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.2);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#f97316">${okRows.length}</div>
        <div style="font-size:10px;color:var(--muted2)">${L('सेव होंगे','OK to save')}</div>
      </div>
      ${conflictRows.length?`<div style="flex:1;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#fb7185">${conflictRows.length}</div>
        <div style="font-size:10px;color:var(--muted2)">${L('ब्लॉक','Blocked')}</div>
      </div>`:''}
    </div>

    ${errors.length ? `<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:10px;font-size:11px;color:#f87171;margin-bottom:12px">⚠️ ${errors.length} row(s) skip हुई: ${escHtml(errors.slice(0,3).join(', '))}${errors.length>3?' ...':''}</div>` : ''}
    ${conflictRows.length ? `<div style="background:rgba(244,63,94,.12);border:1.5px solid rgba(244,63,94,.4);border-radius:10px;padding:12px;font-size:12px;color:#fda4af;margin-bottom:12px;line-height:1.5">
      <b style="color:#fb7185">🚫 ${conflictRows.length} ${L('row(s) ब्लॉक — मोबाइल पहले से इस्तेमाल','row(s) blocked — mobile already used')}</b><br>
      ${L('ये members <b>add/update नहीं</b> होंगे क्योंकि उनका मोबाइल नंबर दूसरे employee (अक्सर दूसरी team) के पास है। नीचे red में highlight हैं।','These members will <b>not</b> be added/updated because their mobile number belongs to another employee (often another team). Highlighted in red below.')}
      <div style="margin-top:6px;font-size:11px;opacity:.9">${escHtml(conflictRows.slice(0,5).map(p=>escHtml(p.name)+' ('+(p.phone||'')+') → '+escHtml(p._conflictWith||'?')).join('<br>'))}${conflictRows.length>5?'<br>…':''}</div>
    </div>` : ''}

    <!-- Data table -->
    <div style="overflow-x:auto;overflow-y:auto;max-height:280px;border:1px solid var(--border2);border-radius:10px;margin-bottom:14px">
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#1e293b;position:sticky;top:0">
            <th style="padding:8px;text-align:left;color:#94a3b8;font-size:10px">Name</th>
            <th style="padding:8px;text-align:left;color:#94a3b8;font-size:10px">Code</th>
            <th style="padding:8px;text-align:left;color:#94a3b8;font-size:10px">Sec</th>
            <th style="padding:8px;text-align:left;color:#94a3b8;font-size:10px">Machine</th>
            <th style="padding:8px;text-align:left;color:#94a3b8;font-size:10px">Off</th>
            <th style="padding:8px;text-align:left;color:#94a3b8;font-size:10px">Phone</th>
            <th style="padding:8px;text-align:left;color:#fbbf24;font-size:10px">Salary</th>
            <th style="padding:8px;text-align:left;color:#34d399;font-size:10px">Joining</th>
            <th style="padding:8px;text-align:center;color:#94a3b8;font-size:10px">Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="font-size:11px;color:var(--muted2);margin-bottom:12px;background:rgba(0,0,0,.2);border-radius:8px;padding:8px">
      ⚠️ <b>Note:</b> यह action केवल <b>Name, Machine, Role, Phone, Monthly Salary, Joining Date, DOB</b> update करेगी।
      Shift schedule, leaves, reports, device approvals — कोई change नहीं होगा।
    </div>

    <div style="display:flex;gap:8px">
      <button class="submit-btn" style="flex:1" onclick="_confirmEmpUpload()">✅ Confirm करें — Firebase में Save</button>
      <button class="cancel-btn" style="flex:1" onclick="openEmpUploadWizard()">← वापस</button>
    </div>
  `);
}

async function _confirmEmpUpload(){
  if(!_empUploadParsed.length){ toast(L('⚠️ कोई data नहीं','⚠️ No data')); return; }
  const btn = document.querySelector('#overlay .submit-btn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Saving...'; }

  // Fetch current data to preserve blank fields
  const existingEmps = getEmps();

  let saved = 0, failed = 0, skipped = 0;
  for(const emp of _empUploadParsed){
    if(emp._skipSave){ skipped++; continue; }
    try{
      const existing = existingEmps.find(e => e.id === emp.id) || {};

      // ── Only update fields that have actual values from Excel ──
      // Blank column = keep existing Firebase value
      const update = {
        id:     emp.id,
        empId:  emp.empId,
        name:   emp.name || existing.name,
        ms:     existing.ms || emp.ms || Array(31).fill('D'),
        status: existing.status || emp.status || 'active',
      };

      if(emp.mc && emp.mc !== '—')   update.mc          = emp.mc;
      else if(existing.mc)            update.mc          = existing.mc;

      if(emp.sec)                     update.sec         = emp.sec;
      else if(existing.sec)           update.sec         = existing.sec;

      const validResp = ['Operation','Setup','P,Q,M','Manager'];
      if(emp.resp && validResp.includes(emp.resp)) update.resp = emp.resp;
      else if(existing.resp)          update.resp        = existing.resp;
      else if(emp.resp)               update.resp        = emp.resp; // fallback

      if(emp.woff)                    update.woff        = emp.woff;
      else if(existing.woff)          update.woff        = existing.woff;

      if(emp.designation)             update.designation = emp.designation;
      else if(existing.designation)   update.designation = existing.designation;

      if(emp.phone)                   update.phone       = emp.phone;
      else if(existing.phone)         update.phone       = existing.phone;

      if(emp.joiningDate)             update.joiningDate = emp.joiningDate;
      else if(existing.joiningDate)   update.joiningDate = existing.joiningDate;

      if(emp.dob)                     update.dob         = emp.dob;
      else if(existing.dob)           update.dob         = existing.dob;

      if(emp.monthlySalary)           update.monthlySalary = emp.monthlySalary;
      else if(existing.monthlySalary) update.monthlySalary = existing.monthlySalary;

      await fbUpdate('employees/' + emp.id, update);
      saved++;
    }catch(e){
      failed++;
      console.error('Emp upload error:', emp.name, e);
    }
  }

  _empUploadParsed = [];
  closeModal();
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  let msg = isEn ? `✅ ${saved} employees saved!` : `✅ ${saved} कर्मचारी save हो गए!`;
  if(skipped) msg += isEn ? ` ${skipped} blocked (duplicate mobile).` : ` ${skipped} ब्लॉक (duplicate mobile)।`;
  if(failed) msg += isEn ? ` ${failed} failed.` : ` ${failed} failed.`;
  toast(msg);
}




// ── Admin: show current managers on Team page + App license expiry ──
function _listActiveManagers(){
  try{
    const all = (typeof getEmps==='function' ? getEmps() : (_cache.employees||[])) || [];
    return all.filter(e=>{
      if(!e) return false;
      const st = String(e.status||'active').toLowerCase();
      if(st==='left'||st==='left_team'||st==='resigned'||st==='removed'||st==='revoked') return false;
      const role = String(e.role||'').toLowerCase();
      const al = String(e.accessLevel||'').toLowerCase();
      return role==='manager' || al==='manager';
    });
  }catch(e){ return []; }
}
function renderAdminManagerBanner(){
  if(typeof isAdmin!=='function' || !isAdmin()) return;
  const el = document.getElementById('adminMgrBanner');
  if(!el) return;
  const mgrs = _listActiveManagers();
  if(!mgrs.length){
    el.innerHTML = `<div style="padding:10px 12px;border-radius:12px;border:1px dashed #cbd5e1;background:#f8fafc;font-size:12px;color:#64748b">${L('कोई active manager नहीं मिला','No active manager found')} — ${L('किसी member का Access Level = Manager सेट करें','set a member Access Level = Manager')}</div>`;
    return;
  }
  el.innerHTML = `<div style="padding:12px;border-radius:12px;border:1px solid rgba(14,165,233,.35);background:rgba(14,165,233,.08)">
    <div style="font-size:11px;font-weight:900;color:#0369a1;margin-bottom:6px;letter-spacing:.4px">${L('CURRENT MANAGER(S)','CURRENT MANAGER(S)')}</div>
    ${mgrs.map(m=>{
      const ph = String(m.phone||m.mobile||'').replace(/\D/g,'').slice(-10);
      return `<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid rgba(14,165,233,.15);font-size:13px">
        <span style="font-weight:800;color:#0f172a">${(m.name||'—')}</span>
        <span style="font-weight:700;color:#0369a1">${ph?('+91 '+ph):'—'}</span>
      </div>`;
    }).join('')}
  </div>`;
}
async function openAppLicenseAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
  let validTill = '';
  let extendTo = '';
  try{
    const lic = await fbGet('settings/license');
    if(lic && lic.validTill) validTill = String(lic.validTill).slice(0,10);
    if(lic && lic.extendTo) extendTo = String(lic.extendTo).slice(0,10);
  }catch(e){}
  if(!validTill && CFG && CFG.license && CFG.license.expiry){
    const d = new Date(CFG.license.expiry);
    if(!isNaN(d)) validTill = d.toISOString().slice(0,10);
  }
  if(!extendTo && CFG && CFG.license && CFG.license.extendTo){
    const d = new Date(CFG.license.extendTo);
    if(!isNaN(d)) extendTo = d.toISOString().slice(0,10);
  }
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">🔑 ${L('App License / Expiry','App License / Expiry')}</div>
  <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${L('पूरी app की expiry date बदलें (Firebase settings/license)','Change whole-app expiry date (Firebase settings/license)')}</p>
  <div class="field"><label>validTill (App expiry)</label>
    <input id="lic_validTill" type="date" class="inp-field" value="${validTill||''}"></div>
  <div class="field"><label>extendTo (After unlock key)</label>
    <input id="lic_extendTo" type="date" class="inp-field" value="${extendTo||''}"></div>
  <button class="big-btn" style="margin-top:12px" onclick="saveAppLicenseAdmin()">${L('💾 सेव करें','💾 Save')}</button>
  <p style="font-size:11px;color:var(--muted);margin-top:10px">${L('सिर्फ hard-admin Firebase rules से write कर सकता है।','Only hard-admin can write via Firebase rules.')}</p>`);
}
async function saveAppLicenseAdmin(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast('❌ Admin only'); return; }
  const vt = (document.getElementById('lic_validTill')||{}).value || '';
  const et = (document.getElementById('lic_extendTo')||{}).value || '';
  if(!vt){ toast('❌ validTill required'); return; }
  try{
    const payload = {
      validTill: new Date(vt+'T23:59:59.000Z').toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
    };
    if(et) payload.extendTo = new Date(et+'T23:59:59.000Z').toISOString();
    await fbUpdate('settings/license', payload);
    try{
      if(CFG && CFG.license){
        CFG.license.expiry = new Date(payload.validTill);
        if(payload.extendTo) CFG.license.extendTo = new Date(payload.extendTo);
      }
    }catch(e){}
    try{ closeModal(); }catch(e){}
    toast('✅ App expiry saved: '+vt);
  }catch(err){
    console.error(err);
    toast('❌ Save failed: '+(err.message||err.code||'permission'));
  }
}
// Hook banner into team render
(function(){
  const _orig = typeof _renderTeamImpl === 'function' ? _renderTeamImpl : null;
  if(!_orig) return;
  // already defined above; call from end of _renderTeamImpl via patch
})();
