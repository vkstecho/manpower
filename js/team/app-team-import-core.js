/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-team-import.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */

/** v3.2.1 — enforce Admin-set teamSize / maxMembers for this manager's roster */
async function _getMyTeamSizeLimit(){
  try{
    if(typeof isAdmin==='function' && isAdmin()) return 9999; // admin unrestricted
    const mob = (typeof _normMobileKey==='function')
      ? _normMobileKey((SESSION&&(SESSION.mobile||SESSION.uid))||'')
      : String((SESSION&&SESSION.mobile)||'').replace(/\D/g,'').slice(-10);
    if(!mob) return 25;
    let lim = null;
    let planLim = null;
    for(const path of ['mobileUsers/'+mob,'managers/'+mob,'users/'+mob]){
      try{
        const rec = await fbGet(path);
        if(!rec || typeof rec!=='object') continue;
        // Admin-set team size wins
        if(rec.teamSize!=null || rec.maxMembers!=null){
          const n = parseInt(rec.teamSize!=null ? rec.teamSize : rec.maxMembers, 10);
          if(n>0){ lim = n; break; }
        }
        // Payment / plan band (e.g. Monthly · 200 Members)
        if(planLim==null){
          const p = parseInt(rec.planMaxMembers!=null ? rec.planMaxMembers : (rec.planMembers!=null?rec.planMembers:0), 10);
          if(p>0) planLim = p;
        }
      }catch(e){}
    }
    if(!lim || lim<1) lim = (planLim && planLim>0) ? planLim : 25;
    return lim;
  }catch(e){ return 25; }
}
function _countMyActiveRoster(){
  try{
    const mob = (typeof _normMobileKey==='function')
      ? _normMobileKey((SESSION&&(SESSION.mobile||SESSION.uid))||'')
      : String((SESSION&&SESSION.mobile)||'').replace(/\D/g,'').slice(-10);
    const all = (typeof getEmps==='function' ? getEmps() : []) || [];
    return all.filter(e=>{
      if(!e || e.status==='resigned' || e.status==='left' || e.status==='left_team' || e.status==='removed') return false;
      if(typeof isAdmin==='function' && isAdmin()) return true;
      const mid = (typeof _normMobileKey==='function') ? _normMobileKey(e.managerId||'') : String(e.managerId||'').replace(/\D/g,'').slice(-10);
      // Manager's own record + members under this manager
      if(mid && mob && mid===mob) return true;
      const ePhone = (typeof _normMobileKey==='function') ? _normMobileKey(e.phone||e.mobile||'') : '';
      if(ePhone && mob && ePhone===mob) return true;
      return false;
    }).length;
  }catch(e){ return 0; }
}
async function _assertCanAddToRoster(addCount){
  addCount = addCount || 1;
  try{
    if(typeof isAdmin==='function' && isAdmin()) return true;
    if(SESSION && SESSION.role==='admin') return true;
    const lim = await _getMyTeamSizeLimit();
    const cur = _countMyActiveRoster();
    if(cur + addCount > lim){
      toast((typeof L==='function')
        ? L('❌ Team size limit: अधिकतम '+lim+' members (Admin ने सेट किया). अभी roster में '+cur+' हैं।',
            '❌ Team size limit: max '+lim+' members (set by Admin). Roster now has '+cur+'.')
        : '❌ Team size limit: max '+lim+' members. Current: '+cur);
      return false;
    }
    return true;
  }catch(e){ return true; }
}
window._getMyTeamSizeLimit = _getMyTeamSizeLimit;
window._countMyActiveRoster = _countMyActiveRoster;
window._assertCanAddToRoster = _assertCanAddToRoster;

/**
 * Man Power — Bulk import / ops / schedule builder helpers
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
// ════════════════════════════════════════
// BULK IMPORT TEAM FROM EXCEL (creates NEW employees — unlike Emp Upload which only updates existing)
// ════════════════════════════════════════
let _bulkImportParsed = [];


/** Create missing employee records so Team + Schedule both show the same people.
 *  items: [{ name, empId/code, sec, machine, phone/mobile, designation, resp, woff }]
 *  Returns { created, updated, failed }
 */
async function ensureEmployeesFromImport(items){
  items = items || [];
  const out = { created: 0, updated: 0, failed: 0, idsByCode: {}, blocked: false };
  if(!items.length) return out;
  try{
    if(typeof _ensureWriteAuth === 'function' && !(await _ensureWriteAuth())){
      console.warn('[ensureEmployees] write auth failed');
      return out;
    }
  }catch(e){}
  // Pre-count how many NEW rows this import would create (not updates)
  try{
    if(typeof _assertCanAddToRoster === 'function'){
      // Rough upper bound: allow through; exact de-dup happens below. Soft check on length.
      const approxNew = items.length;
      // Only hard-block when roster already over limit and import is pure add-heavy
      const lim = (typeof _getMyTeamSizeLimit==='function') ? await _getMyTeamSizeLimit() : 25;
      const cur = (typeof _countMyActiveRoster==='function') ? _countMyActiveRoster() : 0;
      if(cur > lim){
        // Already over — still allow updates of existing, but toast once
        try{ toast((typeof L==='function')
          ? L('⚠️ Team limit '+lim+' — roster में '+cur+' हैं। नए members skip हो सकते हैं।','⚠️ Team limit '+lim+' — roster has '+cur+'. New members may be skipped.')
          : ('⚠️ Team limit '+lim+', roster '+cur)); }catch(e){}
      }
      out._teamLimit = lim;
      out._teamCurrent = cur;
    }
  }catch(e){}

  let cid = '';
  try{
    cid = (typeof myCompanyId === 'function') ? myCompanyId() : (SESSION.companyId || '');
  }catch(e){}
  if(!cid || String(cid).toUpperCase() === 'ALL'){
    cid = SESSION.companyId || SESSION.company || 'default';
    if(String(cid).toUpperCase() === 'ALL') cid = 'default';
  }
  const label = SESSION.company || SESSION.companyLabel || cid || '';
  const mgrId = (SESSION.role === 'manager' && SESSION.mobile)
    ? (typeof _normMobileKey === 'function' ? _normMobileKey(SESSION.mobile) : String(SESSION.mobile))
    : (SESSION.managerId || '');

  const byCode = {};
  const byMobile = {}; // primary identity: last-10 mobile digits
  const _mobKey = (v) => {
    if(typeof _normMobileKey === 'function') return _normMobileKey(v || '') || '';
    return String(v || '').replace(/\D/g, '').slice(-10);
  };
  const _indexEmp = (e) => {
    if(!e) return;
    if(e.empId) byCode[String(e.empId).trim().toUpperCase()] = e;
    const m = _mobKey(e.phone || e.mobile || '');
    if(m && m.length === 10){
      // Prefer active / same-manager record if collision
      const prev = byMobile[m];
      if(!prev || (e.status !== 'left' && e.status !== 'resigned')) byMobile[m] = e;
    }
  };
  (typeof getEmps === 'function' ? getEmps() : []).forEach(_indexEmp);
  // also scan full cache (admin ALL filter may still miss resigned)
  try{
    (_cache.employees || []).forEach(_indexEmp);
  }catch(e){}

  for(let i = 0; i < items.length; i++){
    const e = items[i] || {};
    const code = String(e.empId || e.code || '').trim();
    if(!code) continue;
    const key = code.toUpperCase();
    const name = String(e.name || code).trim() || code;
    let sec = e.sec || e.section || e.department || '';
    if(!sec) sec = e.machine || 'General';
    const phone10 = _mobKey(e.mobile || e.phone || '');
    try{
      // Strong de-dup: Emp ID OR same mobile under this manager (mobile is primary identity)
      let existing = byCode[key] || null;
      if(!existing && phone10 && phone10.length === 10){
        const byM = byMobile[phone10];
        if(byM && byM.id){
          const sameMgr = !mgrId || !byM.managerId || String(byM.managerId) === String(mgrId);
          if(sameMgr) existing = byM;
        }
      }
      if(existing && existing.id){
        out.idsByCode[code] = existing.id;
        out.idsByCode[key] = existing.id;
        // Update profile fields when re-importing same person (no second row)
        try{
          const patch = {};
          if(name && name !== existing.name) patch.name = name;
          if(sec) { patch.sec = sec; patch.section = sec; }
          if(e.machine || e.mc) { patch.machine = e.machine || e.mc; patch.mc = e.machine || e.mc; }
          if(e.designation) patch.designation = e.designation;
          if(e.resp || e.responsibility){ const rr=e.resp || e.responsibility; patch.resp=rr; patch.responsibility=rr; }
          if(e.woff || e.weeklyOff){ const w=String(e.woff||e.weeklyOff||'').trim(); if(w) patch.woff=w; }
          if(phone10 && phone10.length === 10) { patch.phone = phone10; patch.mobile = phone10; }
          if(e.salary) patch.monthlySalary = Number(e.salary) || 0;
          if(e.joiningDate) patch.joiningDate = e.joiningDate;
          if(e.dob) patch.dob = e.dob;
          if(mgrId) patch.managerId = mgrId;
          // Re-activate left/resigned rows when same Emp ID is imported again
          const st = String(existing.status||'').toLowerCase();
          if(st === 'left' || st === 'left_team' || st === 'resigned' || st === 'removed' || st === 'revoked' || existing.active === false){
            patch.status = 'active';
            patch.active = true;
            patch.leftAt = null;
            patch.leftReason = null;
            patch.returnedAt = new Date().toISOString();
          }
          if(Object.keys(patch).length){
            await fbUpdate('employees/' + existing.id, patch);
            Object.assign(existing, patch);
            try{
              // Drop from leftEmployees archive if present
              if(typeof fbRemove === 'function') await fbRemove('leftEmployees/' + existing.id);
              else if(typeof fbSet === 'function') await fbSet('leftEmployees/' + existing.id, null);
            }catch(_lr){}
          }
        }catch(upErr){ console.warn('[ensureEmployees] update existing', code, upErr); }
        out.updated = (out.updated || 0) + 1;
        continue;
      }
      // Enforce team size for truly new members
      try{
        const lim = out._teamLimit != null ? out._teamLimit : ((typeof _getMyTeamSizeLimit==='function')? await _getMyTeamSizeLimit(): 25);
        const cur = (typeof _countMyActiveRoster==='function') ? _countMyActiveRoster() : 0;
        const alreadyCreated = out.created || 0;
        if(cur + alreadyCreated >= lim){
          out.failed = (out.failed||0)+1;
          out.blocked = true;
          continue;
        }
      }catch(limErr){}
      const id = 'e' + Date.now().toString(36) + i + Math.random().toString(36).slice(2, 5);
      const rec = {
        id: id,
        name: name,
        empId: code,
        sec: sec,
        section: sec,
        mc: e.machine || e.mc || '',
        machine: e.machine || e.mc || '',
        designation: e.designation || '',
        resp: e.resp || e.responsibility || '',
        responsibility: e.resp || e.responsibility || '',
        woff: (function(){ const w=String(e.woff||e.weeklyOff||'').trim(); return w || 'SUN'; })(),
        status: 'active',
        ms: Array(31).fill(''),
        companyId: cid,
        companyLabel: label,
        importedAt: new Date().toISOString(),
        importedBy: (SESSION && SESSION.name) || 'import'
      };
      if(mgrId) rec.managerId = mgrId;
      if(phone10 && phone10.length === 10){ rec.phone = phone10; rec.mobile = phone10; }
      if(e.salary) rec.monthlySalary = Number(e.salary) || 0;
      if(e.joiningDate) rec.joiningDate = e.joiningDate;
      if(e.dob) rec.dob = e.dob;

      await fbSet('employees/' + id, rec);
      try{
        if(!_cache.employees) _cache.employees = [];
        // remove any stale same id / same mobile / same empId
        _cache.employees = _cache.employees.filter(x => {
          if(!x) return false;
          if(x.id === id) return false;
          if(x.empId && String(x.empId).trim().toUpperCase() === key) return false;
          if(phone10 && _mobKey(x.phone || x.mobile) === phone10 && (!mgrId || !x.managerId || String(x.managerId)===String(mgrId))) return false;
          return true;
        });
        _cache.employees.push(rec);
      }catch(ce){}
      byCode[key] = rec;
      if(phone10 && phone10.length === 10) byMobile[phone10] = rec;
      out.idsByCode[code] = id;
      out.idsByCode[key] = id;
      out.created++;
    }catch(err){
      console.error('[ensureEmployees]', code, err);
      out.failed++;
    }
  }
  return out;
}
window.ensureEmployeesFromImport = ensureEmployeesFromImport;


function openBulkImportTeam(){
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">📊 Import Full Team from Excel</div>
  <div style="font-size:12px;color:#94a3b8;line-height:1.7;margin-bottom:14px">Upload Excel/CSV — columns in <b>any order</b>. Match by header name (case-insensitive).<br>
    <b style="color:var(--text)">Minimum:</b> Name + Emp ID/E Code (2 columns is enough to start).<br>
    <b style="color:var(--text)">Optional:</b> Department, Machine, Designation, Responsibility, Mobile, Salary, Weekly Off, Joining Date, Date of Birth, and daily shift columns (e.g. 01-09-2026).<br>
    Only columns present in your file are updated — you can upload just 3 columns if you want.</div>
  <button class="cancel-btn" style="margin-bottom:12px" onclick="downloadBulkImportTemplate()">⬇️ ${typeof L==='function'?L('Sample Template Download करें','Download Sample Template'):'Download Sample Template'}</button>
  <input type="file" id="bulkImportFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleBulkImportFile(this.files[0])">
  <button class="submit-btn" onclick="document.getElementById('bulkImportFile').click()">📁 Choose Excel/CSV File</button>
  <div id="bulkImportPreview" style="margin-top:14px"></div>
  <button class="cancel-btn" style="margin-top:10px" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

function downloadBulkImportTemplate(){
  const csv='Name,Emp ID,Weekly Off,Mobile,Department,Machine,Designation,Responsibility,Salary (₹/month),Joining Date,Date of Birth\n'+'RAM KUMAR,30001001,Sunday,9876543210,Production,Line-1,Operator,Operation,25000,01-04-2024,15-06-1995\n'+'SHYAM LAL,30001002,Monday,,Warehouse,ALL,Supervisor,Quality Check,,,\n';
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='team_import_template.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleBulkImportFile(file){
  if(!file) return;
  const previewEl=document.getElementById('bulkImportPreview');
  previewEl.innerHTML='<div class="empty-text" style="padding:12px">Reading file...</div>';

  const parseWorkbook=(data)=>{
    const wb=XLSX.read(data,{type:'array',cellDates:true});
    let sheetName=wb.SheetNames[0];
    try{
      const prefer=wb.SheetNames.find(n=>/^(team|roster|employees|members)$/i.test(String(n||'').trim()))
        || wb.SheetNames.find(n=>/team|roster|employee|member/i.test(String(n||'')));
      if(prefer) sheetName=prefer;
    }catch(x){}
    const sheet=wb.Sheets[sheetName];
    // sheet_to_json with header row — if first rows look like instructions (no Name header), try next rows via header:1 path in processor
    let rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
    // If empty or no name-like keys, fall back to header:1 and find header row
    if(!rows.length || !Object.keys(rows[0]||{}).some(k=>/name|emp\s*id|code/i.test(String(k)))){
      const raw=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
      let hi=0;
      for(let i=0;i<Math.min(raw.length,30);i++){
        const cells=(raw[i]||[]).map(c=>String(c||'').trim().toLowerCase());
        if(cells.some(c=>c==='name') && cells.some(c=>/emp\s*id|e\s*code|emp\s*code|^code$/.test(c))){ hi=i; break; }
      }
      const header=raw[hi]||[];
      rows=[];
      for(let r=hi+1;r<raw.length;r++){
        const row=raw[r]||[];
        const obj={};
        header.forEach((h,ci)=>{ if(h!=null && String(h).trim()!=='') obj[String(h).trim()]=row[ci]; });
        if(Object.keys(obj).length) rows.push(obj);
      }
    }
    _processBulkImportRows(rows);
  };

  const reader=new FileReader();
  reader.onload=e=>{
    try{
      if(typeof XLSX==='undefined'){
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=()=>parseWorkbook(new Uint8Array(e.target.result));
        s.onerror=()=>{ previewEl.innerHTML='<div style="color:var(--lv);padding:12px">'+(typeof L==='function'?L('❌ Library load नहीं हुई। Internet जांचें।','❌ Could not load Excel library. Check internet.'):'❌ Could not load Excel library.')+'</div>'; };
        document.head.appendChild(s);
      }else{
        parseWorkbook(new Uint8Array(e.target.result));
      }
    }catch(err){
      previewEl.innerHTML='<div style="color:var(--lv);padding:12px">❌ Error: '+err.message+'</div>';
    }
  };
  reader.readAsArrayBuffer(file);
}

function _findCol(row,names){
  const keys=Object.keys(row);
  for(const n of names){
    const want=String(n).trim().toLowerCase();
    const found=keys.find(k=>k.toString().trim().toLowerCase()===want);
    if(found!==undefined && row[found]!=='' && row[found]!=null) return row[found];
  }
  // soft match: header contains the name token (e.g. Salary(₹/Month) ≈ salary)
  for(const n of names){
    const want=String(n).trim().toLowerCase().replace(/[^a-z0-9]/g,'');
    if(!want) continue;
    const found=keys.find(k=>{
      const kk=k.toString().trim().toLowerCase().replace(/[^a-z0-9]/g,'');
      return kk===want || kk.includes(want) || want.includes(kk);
    });
    if(found!==undefined && row[found]!=='' && row[found]!=null) return row[found];
  }
  return '';
}

function _parseImportDate(val){
  if(!val) return '';
  if(val instanceof Date && !isNaN(val)) return val.toISOString().split('T')[0];
  const s=val.toString().trim();
  if(!s) return '';
  const parsed=new Date(s);
  if(!isNaN(parsed)) return parsed.toISOString().split('T')[0];
  return s; // keep as-is if unparseable, don't block the row
}
const _WOFF_MAP={SUN:'SUN',SUNDAY:'SUN',MON:'MON',MONDAY:'MON',TUE:'TUE',TUESDAY:'TUE',WED:'WED',WEDNESDAY:'WED',THU:'THU',THURSDAY:'THU',FRI:'FRI',FRIDAY:'FRI',SAT:'SAT',SATURDAY:'SAT'};
function _parseImportWoff(val){
  const s=(val||'').toString().trim().toUpperCase();
  return _WOFF_MAP[s]||'SUN';
}

function _isDateHeaderCol(key){
  const s = String(key||'').trim();
  if(!s) return false;
  // Skip known non-date employee columns
  const lower = s.toLowerCase();
  if(/^(name|emp|e\s*code|code|id|designation|weekly|mobile|phone|joining|birth|dob|machine|resp|salary|section)/i.test(lower)) return false;
  // 01-Jan-26, 1-Jan-2026, 01/01/2026, 2026-01-01, 01-Jan-2025 … up to 2+ years of columns
  if(/^\d{1,2}[-/ .](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/ .]\d{2,4}$/i.test(s)) return true;
  if(/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(s)) return true;
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return true;
  if(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/ .]\d{1,2}[, ]+\d{2,4}$/i.test(s)) return true;
  // Excel may emit Date objects stringified
  if(!isNaN(Date.parse(s)) && /\d{4}/.test(s) && (s.includes('-')||s.includes('/')||s.includes(' '))) return true;
  return false;
}

function _parseHeaderDate(key){
  const s = String(key||'').trim();
  if(!s) return null;
  // Prefer day-first for dd-MMM-yy / dd-MMM-yyyy
  const m1 = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})$/);
  if(m1){
    const day = parseInt(m1[1],10);
    const monMap = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    const mon = monMap[m1[2].substring(0,3).toLowerCase()];
    let year = parseInt(m1[3],10);
    if(year < 100) year += 2000;
    if(mon==null || day<1 || day>31) return null;
    const d = new Date(year, mon, day);
    if(isNaN(d)) return null;
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  const m2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if(m2){
    let day=parseInt(m2[1],10), mon=parseInt(m2[2],10), year=parseInt(m2[3],10);
    if(year<100) year+=2000;
    // if first number >12 treat as day-month-year else prefer day-month (IN format)
    if(mon>12 && day<=12){ const t=day; day=mon; mon=t; }
    const d=new Date(year, mon-1, day);
    if(isNaN(d)) return null;
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if(!isNaN(d) && d.getFullYear()>2000){
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  return null;
}
function _normShiftCode(val){
  let s = String(val==null?'':val).trim().toUpperCase();
  if(!s) return '';
  // Excel sometimes gives formulas or spaces
  s = s.replace(/\s+/g,'');
  const map = {
    'DAY':'D','D':'D','NIGHT':'N','N':'N',
    'A':'A','B':'B','C':'C',
    'O':'O','OFF':'O','WO':'O','W/OFF':'O','WEEKLYOFF':'O',
    'L':'L','LEAVE':'L','SL':'L','CL':'L','EL':'L',
    'C/O':'C/O','CO':'C/O','C-OFF':'C/O','COMPOFF':'C/O','COMP':'C/O',
    'G':'G','GENERAL':'G','GEN':'G',
    'GP':'GP','GATEPASS':'GP',
    'HLF':'HLF','HALF':'HLF','½':'HLF','1/2':'HLF',
    'AB':'Ab','ABS':'Ab','ABSENT':'Ab',
    'H':'H','HOLIDAY':'H','OD':'OD'
  };
  return map[s] || (s.length<=3 ? s : '');
}
/** True if value is a role code (MGR/SUP) wrongly used as Section — not a real plant section. */
function _isRoleOnlySec(v){
  const k = String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  return k==='MGR'||k==='MANAGER'||k==='SUP'||k==='SUPERVISOR'||k==='STAFF';
}

/**
 * Map machine code only — NEVER map Designation (Manager/Engineer) to Section.
 * Section must come from Excel "Section" column (Metalliser, Slitter, MetProd, …).
 */
function _mapMachineToSec(machine, designation){
  const raw = String(machine||'').trim();
  const u = raw.toUpperCase().replace(/\s+/g,'');
  if(!raw) return '';
  if(/^M-?1$/.test(u) || /METALLISER-?1/.test(u)) return 'M1';
  if(/^M-?2$/.test(u) || /METALLISER-?2/.test(u)) return 'M2';
  if(/^S-?1$/.test(u) || /SLITTER-?1/.test(u)) return 'S1';
  if(/^S-?2$/.test(u) || /SLITTER-?2/.test(u)) return 'S2';
  if(/METALLISER|^MET$/.test(u)) return 'MET';
  if(/SLITTER|^SLIT$/.test(u)) return 'SLIT';
  // Do NOT map designation Manager→MGR or Engineer→SUP — those are Designation, not Section
  if(/SUP|SUPERVISOR|ENGINEER|SHIFTENG/.test(u)) return 'SUP';
  if(/MGR|MANAGER/.test(u)) return 'MGR';
  return raw;
}

function _processBulkImportRows(rows){
  const previewEl=document.getElementById('bulkImportPreview');
  if(!rows || !rows.length){
    previewEl.innerHTML='<div style="color:var(--lv);padding:12px;font-size:12px">❌ No rows found in file.</div>';
    return;
  }

  const existingByCode = {};
  getEmps().forEach(e=>{
    const c=(e.empId||'').toString().trim();
    if(c) existingByCode[c]=e;
  });

  // Detect date columns from first row keys
  const sampleKeys = Object.keys(rows[0]||{});
  const dateCols = [];
  sampleKeys.forEach(k=>{
    if(_isDateHeaderCol(k)){
      const iso = _parseHeaderDate(k);
      if(iso) dateCols.push({ key:k, iso });
    }
  });
  // sort by date
  dateCols.sort((a,b)=>a.iso.localeCompare(b.iso));

  _bulkImportParsed=[];
  let invalidCount=0, updateCount=0, createCount=0;
  const seenInFile=new Set();

  rows.forEach(row=>{
    // skip template note / instruction rows
    try{
      const firstVal=String(Object.values(row||{})[0]||'').trim();
      if(/^---/.test(firstVal)||/^notes?\b/i.test(firstVal)||/^en:/i.test(firstVal)||/^hi:/i.test(firstVal)) return;
    }catch(e){}
    const name=(_findCol(row,['name','naam','नाम'])||'').toString().trim().toUpperCase();
    const code=(_findCol(row,['emp id','empid','e code','ecode','emp code','employee code','employee id','code','id'])||'').toString().trim();
    const designation=(_findCol(row,['designation','position','role','desig'])||'').toString().trim();
    const machine=(_findCol(row,['machine','mc','machine name','मशीन'])||'').toString().trim();
    const sectionCol=(_findCol(row,['department','dept','section','sec','department section','सेक्शन','विभाग','area','unit'])||'').toString().trim();
    const resp=(_findCol(row,['responsibility','resp'])||'').toString().trim();
    const salaryRaw=(_findCol(row,['salary(₹/month)','salary(₹/month)','salary (₹/month)','salary (rs/month)','monthly salary','salary'])||'').toString().trim().replace(/[^0-9.]/g,'');
    let mobile=(_findCol(row,['mobile','mobile number','phone','phone number','contact'])||'').toString().trim().replace(/[^0-9]/g,'');
    if(mobile.length===12 && mobile.startsWith('91')) mobile=mobile.slice(2);
    if(mobile.length!==10) mobile='';
    const joiningDate=_parseImportDate(_findCol(row,['joining date','joining','date of joining','doj']));
    const dob=_parseImportDate(_findCol(row,['date of birth','dob','birth date','birthday']));
    const woff=_parseImportWoff(_findCol(row,['weekly off','week off','weekly holiday','woff','w-off','w off']));

    if(!name || !code){ invalidCount++; return; }
    if(seenInFile.has(code)){ return; }
    seenInFile.add(code);

    // Collect shifts by date
    const shiftsByDate = {};
    dateCols.forEach(dc=>{
      const raw = row[dc.key];
      const sh = _normShiftCode(raw);
      if(sh) shiftsByDate[dc.iso] = sh;
    });

    const existing = existingByCode[code];

    // Block mobiles already used by another employee / other team
    let phoneConflict = null;
    if(mobile){
      phoneConflict = _findPhoneConflict(mobile, existing?.id, code);
    }

    if(phoneConflict){
      invalidCount++;
      _bulkImportParsed.push({
        name, code, designation, machine, resp,
        salary: salaryRaw, mobile, joiningDate, dob, woff,
        sec: (sectionCol || (!_isRoleOnlySec(_mapMachineToSec(machine, designation)) ? _mapMachineToSec(machine, designation) : (machine||'General'))),
        section: sectionCol || '',
        shiftsByDate,
        existingId: existing ? existing.id : null,
        _skipSave: true,
        _phoneConflict: true,
        _otherTeam: !!phoneConflict.otherTeam,
        _conflictWith: phoneConflict.emp.name || phoneConflict.emp.empId || ''
      });
      return;
    }

    if(existing) updateCount++; else createCount++;

    _bulkImportParsed.push({
      name, code, designation, machine, resp,
      salary: salaryRaw, mobile, joiningDate, dob, woff,
      sec: (sectionCol || (!_isRoleOnlySec(_mapMachineToSec(machine, designation)) ? _mapMachineToSec(machine, designation) : (machine||'General'))),
        section: sectionCol || '',
      shiftsByDate,
      existingId: existing ? existing.id : null
    });
  });

  // Within-file mobile dups
  const seenMob = new Map();
  _bulkImportParsed.forEach(p=>{
    if(!p.mobile) return;
    if(seenMob.has(p.mobile)){
      p._skipSave = true; p._phoneConflict = true; p._fileDup = true;
      p._conflictWith = p._conflictWith || ('file:'+seenMob.get(p.mobile));
    } else seenMob.set(p.mobile, p.code);
  });

  if(!_bulkImportParsed.filter(p=>!p._skipSave).length){
    const blocked = _bulkImportParsed.filter(p=>p._skipSave);
    previewEl.innerHTML=`<div style="color:var(--lv);padding:12px;font-size:12px">
      ❌ No valid rows. ${invalidCount?invalidCount+' missing Name/Emp ID or blocked mobile. ':''}
      ${blocked.length?`<br>🚫 ${blocked.length} blocked (duplicate mobile): `+blocked.slice(0,5).map(b=>b.name+' ('+b.mobile+')').join(', '):''}
    </div>`;
    return;
  }

  const okBulk = _bulkImportParsed.filter(e=>!e._skipSave);
  const blockedBulk = _bulkImportParsed.filter(e=>e._skipSave);
  const withShifts = okBulk.filter(e=>Object.keys(e.shiftsByDate||{}).length).length;
  const months = new Set();
  okBulk.forEach(e=>Object.keys(e.shiftsByDate||{}).forEach(d=>months.add(d.substring(0,7))));
  const mobileCount=okBulk.filter(e=>e.mobile).length;

  previewEl.innerHTML=`
    <div style="font-size:13px;font-weight:800;color:#22c55e;margin-bottom:8px">
      ✅ ${okBulk.length} employees ready${blockedBulk.length?` · <span style="color:#fb7185">🚫 ${blockedBulk.length} blocked</span>`:''}
    </div>
    ${blockedBulk.length?`<div style="background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.35);border-radius:8px;padding:10px;font-size:11px;color:#fda4af;margin-bottom:10px;line-height:1.5">
      🚫 Mobile already used (other team / duplicate) — will NOT import:<br>
      ${blockedBulk.slice(0,6).map(e=>`<b style="color:#fb7185">${escHtml(e.name)}</b> (${escHtml(e.mobile)}) → ${e._conflictWith||'?'}`).join('<br>')}
      ${blockedBulk.length>6?'<br>…':''}
    </div>`:''}
    <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:10px">
      🆕 Create: <b>${createCount}</b> &nbsp;·&nbsp; 🔄 Update: <b>${updateCount}</b><br>
      ${dateCols.length?`📅 Shift date columns: <b>${dateCols.length}</b> (${dateCols[0].iso} → ${dateCols[dateCols.length-1].iso})<br>`:''}
      ${months.size?`📆 Months to write: <b>${[...months].sort().join(', ')}</b><br>`:''}
      ${withShifts?`👥 Rows with shifts: <b>${withShifts}</b><br>`:''}
      ${mobileCount?`📱 Mobile (OTP login ready): <b>${mobileCount}</b>`:''}
    </div>
    <div style="max-height:160px;overflow:auto;font-size:11px;color:var(--muted2);margin-bottom:12px;border:1px solid var(--border);border-radius:8px;padding:8px">
      ${_bulkImportParsed.slice(0,12).map(e=>`<div>${e.existingId?'🔄':'🆕'} <b style="color:var(--text)">${escHtml(e.name)}</b> · ${e.code} · ${escHtml(e.sec||'—')} · ${Object.keys(e.shiftsByDate||{}).length} days</div>`).join('')}
      ${_bulkImportParsed.length>12?`<div>… +${_bulkImportParsed.length-12} more</div>`:''}
    </div>
    <button class="submit-btn" onclick="confirmBulkImportTeam()">💾 Import Team + Shifts</button>
  `;
}

let _bulkImportInProgress=false;
async function confirmBulkImportTeam(){
  if(_bulkImportInProgress) return;
  if(!_bulkImportParsed.length) return;
  // Count how many NEW employees would be created (not updates)
  try{
    const existingCodes = new Set((getEmps()||[]).filter(e=>e&&e.status!=='resigned').map(e=>String(e.empId||'').trim().toUpperCase()));
    let newCount = 0;
    (_bulkImportParsed||[]).forEach(r=>{
      const c = String((r&& (r.empId||r.code||''))||'').trim().toUpperCase();
      if(c && !existingCodes.has(c)) newCount++;
    });
    if(newCount>0 && !(await _assertCanAddToRoster(newCount))){
      return;
    }
  }catch(e){}
  _bulkImportInProgress=true;

  let cid = (typeof myCompanyId==='function') ? myCompanyId() : (SESSION.companyId||'');
  if(!cid || String(cid).toUpperCase()==='ALL'){
    cid = SESSION.companyId || SESSION.company || 'default';
    if(String(cid).toUpperCase()==='ALL') cid = 'default';
  }
  const label = SESSION.company || SESSION.companyLabel || cid || '';
  const mgrId = (SESSION.role==='manager' && SESSION.mobile) ? _normMobileKey(SESSION.mobile) : (SESSION.managerId||'');

  try{
    if(typeof _ensureWriteAuth==='function' && !(await _ensureWriteAuth())){
      _bulkImportInProgress=false;
      toast(typeof L==='function'?L('❌ OTP verify करें फिर Import करें','❌ Verify OTP then Import'):'❌ Verify OTP then Import');
      return;
    }
  }catch(e){}

  let saved=0, updated=0, created=0, failed=0, registered=0;
  const schedByMonth = {}; // mk -> { empId/internalId: [31] }

  const empIdToInternal = {};
  const byEmpCode = {};
  const byEmpMobile = {};
  getEmps().forEach(e=>{
    if(!e) return;
    if(e.empId){
      empIdToInternal[String(e.empId).trim()]=e.id;
      byEmpCode[String(e.empId).trim().toUpperCase()] = e;
    }
    const m = (typeof _normMobileKey==='function'?_normMobileKey(e.phone||e.mobile||''):String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10));
    if(m && m.length===10) byEmpMobile[m] = e;
  });

  let skippedPhone=0;
  for(let i=0;i<_bulkImportParsed.length;i++){
    const e=_bulkImportParsed[i];
    if(e._skipSave){ skippedPhone++; continue; }
    try{
      let id = e.existingId;
      // Strong match: Emp ID then mobile (primary identity) — never create a second row
      if(!id){
        const codeKey = String(e.code||e.empId||'').trim().toUpperCase();
        const hit = (codeKey && byEmpCode[codeKey]) || (e.mobile && byEmpMobile[String(e.mobile).replace(/\D/g,'').slice(-10)]) || null;
        if(hit && hit.id) id = hit.id;
      }
      // Section from Excel Section/Department column only (already resolved in parse); never designation→MGR
      let sec = e.sec || e.section || e.department || '';
      if(!sec || (typeof _isRoleOnlySec==='function' && _isRoleOnlySec(sec))){
        const m = (typeof _mapMachineToSec==='function') ? _mapMachineToSec(e.machine, '') : '';
        sec = (m && !(typeof _isRoleOnlySec==='function' && _isRoleOnlySec(m))) ? m : (e.machine || 'General');
      }
      const rec = {
        name: e.name,
        empId: e.code,
        sec: sec,
        section: sec, // keep Section text for filters (Metalliser / Slitter / MetProd)
        mc: e.machine || '',
        machine: e.machine || '',
        designation: e.designation || '',
        resp: e.resp || '',
        monthlySalary: e.salary ? Number(e.salary)||0 : 0,
        woff: e.woff || 'SUN',
        status: 'active',
      };
      if(e.joiningDate) rec.joiningDate=e.joiningDate;
      if(e.dob) rec.dob=e.dob;
      if(e.mobile) rec.phone=e.mobile;
      if(cid){ rec.companyId=cid; rec.companyLabel=label; }
      if(mgrId) rec.managerId=mgrId;

      if(id){
        // Update existing — merge only provided fields
        const patch = { ...rec };
        await fbUpdate('employees/'+id, patch);
        try{
          if(_cache.employees){
            const ix = _cache.employees.findIndex(x => x && x.id === id);
            if(ix >= 0) _cache.employees[ix] = Object.assign({}, _cache.employees[ix], patch);
          }
        }catch(ce){}
        updated++;
      } else {
        id = 'e'+Date.now().toString(36)+i+Math.random().toString(36).slice(2,5);
        rec.id = id;
        rec.ms = Array(31).fill('');
        await fbSet('employees/'+id, rec);
        try{
          if(!_cache.employees) _cache.employees = [];
          _cache.employees = _cache.employees.filter(x => x && x.id !== id);
          _cache.employees.push(Object.assign({}, rec));
        }catch(ce){}
        created++;
        empIdToInternal[e.code] = id;
        try{
          byEmpCode[String(e.code||'').trim().toUpperCase()] = Object.assign({}, rec, {id:id});
          if(e.mobile) byEmpMobile[String(e.mobile).replace(/\D/g,'').slice(-10)] = Object.assign({}, rec, {id:id});
        }catch(_m){}
      }
      saved++;

      // Build schedule arrays per month
      Object.entries(e.shiftsByDate||{}).forEach(([iso, sh])=>{
        const mk = iso.substring(0,7).replace('-','_');
        const dayIdx = parseInt(iso.split('-')[2],10)-1;
        if(dayIdx<0 || dayIdx>30) return;
        if(!schedByMonth[mk]) schedByMonth[mk] = {};
        const daysInMonth = new Date(parseInt(iso.slice(0,4),10), parseInt(iso.slice(5,7),10), 0).getDate();
        if(!schedByMonth[mk][e.code]) schedByMonth[mk][e.code] = new Array(daysInMonth).fill('');
        schedByMonth[mk][e.code][dayIdx] = sh;
        // also by internal id
        if(id){
          if(!schedByMonth[mk][id]) schedByMonth[mk][id] = new Array(daysInMonth).fill('');
          schedByMonth[mk][id][dayIdx] = sh;
        }
      });

      if(e.mobile){
        try{
          const existing=await fbGet('mobileUsers/'+e.mobile);
          if(!existing){
            await fbSet('mobileUsers/'+e.mobile,{
              role:'member', name:e.name, mobile:'+91'+e.mobile, company:label,
              status:'approved', empCode:e.code, managerId:mgrId||'',
              registeredAt:new Date().toISOString(),
              approvedAt:new Date().toISOString(), approvedBy:(SESSION.name||'Manager')+' (Excel Import)'
            });
            registered++;
          }
        }catch(ex){ console.warn('mobileUsers pre-approve skipped',e.mobile,ex); }
      }
    }catch(err){
      failed++;
      console.error('Bulk import error', e.name, err);
    }
  }

  // Save schedules (supports up to 2+ years of daily columns across many months)
  let monthsSaved=0;
  // Clear cells before each employee's joining date
  try{
    const empsAll = (typeof getEmps==='function'?getEmps():[])||[];
    Object.keys(schedByMonth).forEach(mk=>{
      const mm = String(mk).match(/(\d{4})[_-](\d{1,2})/);
      if(!mm) return;
      const year=+mm[1], month=+mm[2];
      const block = schedByMonth[mk];
      Object.keys(block).forEach(empCode=>{
        const emp = empsAll.find(e=>String(e.empId)===String(empCode)||String(e.id)===String(empCode));
        if(emp) _sanitizeShiftRow(block[empCode], emp, year, month);
      });
    });
  }catch(e){ console.warn('[excel join sanitize]', e); }
  const monthKeys = Object.keys(schedByMonth).sort();
  for(const mk of monthKeys){
    try{
      const existing = (getSchedules()[mk]||{});
      const merged = { ...existing };
      Object.entries(schedByMonth[mk]).forEach(([empKey, arr])=>{
        // merge day-by-day so we don't wipe other days already in Firebase
        const prev = Array.isArray(merged[empKey]) ? merged[empKey].slice() : [];
        const out = new Array(Math.max(prev.length, arr.length, 31)).fill('');
        for(let d=0; d<out.length; d++){
          out[d] = (arr[d] != null && arr[d] !== '') ? arr[d] : (prev[d] || '');
        }
        merged[empKey] = out;
      });
      await fbSet('schedules/'+mk, merged);
      // update local cache if present
      try{
        if(_cache && _cache.schedules) _cache.schedules[mk] = merged;
      }catch(e){}
      monthsSaved++;
    }catch(err){
      console.error('Schedule save error', mk, err);
    }
  }

  _bulkImportParsed=[];
  _bulkImportInProgress=false;
  closeModal();
  if(created===0 && updated===0){
    toast(typeof L==='function'
      ? L('❌ कोई member save नहीं हुआ — OTP/permission जाँचें या Console देखें','❌ No members saved — check OTP/permission or Console')
      : '❌ No members saved — check OTP/permission');
  } else {
    toast(`✅ Team import: ${created} new, ${updated} updated` +
      (monthsSaved?`, ${monthsSaved} month(s) schedule`:``) +
      (registered?`, ${registered} login ready`:``) +
      (failed?`, ${failed} failed`:``));
  }
  try{
    if(typeof fbGet==='function'){
      const snap = await fbGet('employees');
      if(snap && typeof snap==='object'){
        const list = Object.keys(snap).map(k => Object.assign({id:k}, snap[k]||{}));
        if(list.length) _cache.employees = list;
      }
    }
  }catch(e){ console.warn('[import] reload employees', e); }
  try{ renderTeam(); }catch(e){}
  try{ if(typeof renderHome==='function') renderHome(); }catch(e){}
  try{ refreshAll(); }catch(e){}
  try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
}

function _normalizeMachineLabel(raw){
  const s = String(raw||'').trim();
  if(!s) return '';
  // M1 / m1 / M-1 → M-1; S2 → S-2
  let m = s.match(/^M[\s\-]?(\d+)$/i);
  if(m) return 'M-'+m[1];
  m = s.match(/^S[\s\-]?(\d+)$/i);
  if(m) return 'S-'+m[1];
  // Metalliser / Slitter umbrella keep title-case
  if(/^metalliser$/i.test(s) || /^met$/i.test(s)) return 'Metalliser';
  if(/^slitter$/i.test(s) || /^slit$/i.test(s)) return 'Slitter';
  if(/^s\.?i\.?$/i.test(s) || /^supervisor$/i.test(s) || /^engg$/i.test(s) || /^engineer$/i.test(s)) return 'S.I.';
  if(/^manager$/i.test(s) || /^mgr$/i.test(s)) return 'Manager';
  return s;
}

/** Derive internal section key (M1, S2, SUP, MGR…) from machine label. */
function _secFromMachine(machine, designation){
  if(typeof _mapMachineToSec === 'function'){
    const s = _mapMachineToSec(machine, designation||'');
    if(s && s !== 'STAFF') return s;
  }
  const u = String(machine||'').trim().toUpperCase().replace(/\s+/g,'');
  if(/^M-?1$/.test(u) || u==='METALLISER' || u==='MET') return 'M1';
  if(/^M-?2$/.test(u)) return 'M2';
  if(/^M-?(\d+)$/.test(u)) return 'M'+RegExp.$1;
  if(/^S-?1$/.test(u) || u==='SLITTER' || u==='SLIT') return 'S1';
  if(/^S-?2$/.test(u)) return 'S2';
  if(/^S-?(\d+)$/.test(u)) return 'S'+RegExp.$1;
  if(/S\.?I|SUP|ENGG|ENGINEER/.test(u)) return 'SUP';
  if(/MGR|MANAGER/.test(u)) return 'MGR';
  return 'M1';
}

function _buildSecOptions(selectedSec){
  const cfg=getShiftConfigSync();
  const opts=[];
  // Kept for edit form fallback / admin — prefer Machine field in Add form
  (cfg.metallisers||[]).forEach(m=>{
    const key = String(m).replace(/^M[\s\-]?(\d+)$/i,'M$1').toUpperCase().replace(/[^A-Z0-9]/g,'') || m;
    opts.push(`<option value="${key}"${selectedSec===key||selectedSec===m?' selected':''}>${secName(key)||_normalizeMachineLabel(m)}</option>`);
  });
  (cfg.slitters||[]).forEach(s=>{
    const key = String(s).replace(/^S[\s\-]?(\d+)$/i,'S$1').toUpperCase().replace(/[^A-Z0-9]/g,'') || s;
    opts.push(`<option value="${key}"${selectedSec===key||selectedSec===s?' selected':''}>${secName(key)||_normalizeMachineLabel(s)}</option>`);
  });
  opts.push(`<option value="SUP"${selectedSec==='SUP'?' selected':''}>${secName('SUP')||'Engineers / Supervisor'}</option>`);
  opts.push(`<option value="MGR"${selectedSec==='MGR'?' selected':''}>${secName('MGR')||'Manager'}</option>`);
  return opts.join('');
}

/**
 * Machine dropdown — ONLY machines from manager Profile (Shift & Machine Settings).
 * Display: M-1, M-2, Metalliser, S-1, S-2, Slitter (no hardcoded S-3/S-4, no M1+M-1 duplicates).
 */

/** Unique values from roster (Excel-uploaded employees) for a field */
function _rosterFieldList(field){
  try{
    if(typeof _teamFieldValues==='function'){
      return (_teamFieldValues(field)||[]).filter(Boolean);
    }
  }catch(e){}
  return [];
}

function _fallbackFieldList(field){
  if(field==='designation')
    return ['Operator','Ass. Operator','Team Member','Sr. Team Member','Jr. Team Member','Trainee','Engineer','Jr. Engineer','Officer','Supervisor','Sr. Supervisor','Manager','Shift Engineer','Admin'];
  if(field==='responsibility')
    return ['Operation','Assistant','Trainee','Engineer','Manager','Setup','5S','P,Q,M','Quality','Maintenance'];
  if(field==='machine')
    return ['M-1','M-2','S-1','S-2','S.I.'];
  return [];
}

function _buildDynamicFieldOptions(field, selected){
  const seen = new Set();
  const ordered = [];
  const add = (v)=>{
    const s = String(v||'').trim();
    if(!s) return;
    const k = s.toLowerCase();
    if(seen.has(k)) return;
    seen.add(k);
    ordered.push(s);
  };
  (_rosterFieldList(field)||[]).forEach(add);
  (_fallbackFieldList(field)||[]).forEach(add);
  if(selected){
    const sel = String(selected).trim();
    if(sel && !seen.has(sel.toLowerCase())){
      ordered.unshift(sel);
      seen.add(sel.toLowerCase());
    }
  }
  ordered.sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'}));
  const en = (typeof _lang!=='undefined' && _lang!=='hi');
  const otherLbl = en ? 'Others (type manually)' : 'अन्य (खुद लिखें)';
  let html = `<option value="">— ${en?'Select':'चुनें'} —</option>`;
  ordered.forEach(v=>{
    const sel = selected && String(selected).trim().toLowerCase()===v.toLowerCase() ? ' selected' : '';
    html += `<option value="${String(v).replace(/"/g,'&quot;')}"${sel}>${v}</option>`;
  });
  html += `<option value="__OTHER__">${otherLbl}</option>`;
  return html;
}

function _onDynFieldChange(selectId, otherWrapId){
  try{
    const sel = document.getElementById(selectId);
    const wrap = document.getElementById(otherWrapId);
    if(!sel || !wrap) return;
    const isOther = sel.value === '__OTHER__';
    wrap.style.display = isOther ? 'block' : 'none';
    if(isOther){
      const inp = wrap.querySelector('input');
      if(inp) inp.focus();
    }
  }catch(e){}
}

function _resolveDynField(selectId, otherInputId){
  const sel = document.getElementById(selectId);
  if(!sel) return '';
  const v = String(sel.value||'').trim();
  if(v === '__OTHER__'){
    const inp = document.getElementById(otherInputId);
    return String((inp && inp.value)||'').trim();
  }
  return v;
}

function _dynFieldHtml(field, selectId, otherInputId, otherWrapId, selected, required){
  const en = (typeof _lang!=='undefined' && _lang!=='hi');
  const labels = {
    section: en?'Department':'विभाग',
    machine: en?'Machine':'मशीन',
    responsibility: en?'Responsibility':'ज़िम्मेदारी',
    designation: en?'Designation':'पद'
  };
  const placeholders = {
    section: en?'Type department name':'विभाग लिखें',
    machine: en?'Type machine name':'मशीन लिखें',
    responsibility: en?'Type responsibility':'ज़िम्मेदारी लिखें',
    designation: en?'Type designation':'पद लिखें'
  };
  const opts = _buildDynamicFieldOptions(field, selected);
  const req = required ? ' <span style="color:var(--lv)">*</span>' : '';
  return `<div class="field">
    <label>${labels[field]||field}${req}</label>
    <select class="inp-field" id="${selectId}" onchange="_onDynFieldChange('${selectId}','${otherWrapId}')">${opts}</select>
    <div id="${otherWrapId}" style="display:none;margin-top:6px">
      <input class="inp-field" id="${otherInputId}" placeholder="${placeholders[field]||''}" maxlength="60">
    </div>
  </div>`;
}

function _buildMachineOptions(selectedMc){
  return _buildDynamicFieldOptions('machine', selectedMc);
}
function _buildDesignationOptions(selected){
  return _buildDynamicFieldOptions('designation', selected);
}
function _buildRespOptions(selected){
  return _buildDynamicFieldOptions('responsibility', selected);
}

