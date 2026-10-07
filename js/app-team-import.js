/**
 * Man Power — Bulk import / ops / schedule builder helpers
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
// ════════════════════════════════════════
// BULK IMPORT TEAM FROM EXCEL (creates NEW employees — unlike Emp Upload which only updates existing)
// ════════════════════════════════════════
let _bulkImportParsed = [];

function openBulkImportTeam(){
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">📊 Import Full Team from Excel</div>
  <div style="font-size:12px;color:#94a3b8;line-height:1.7;margin-bottom:14px">Upload Excel/CSV — columns in <b>any order</b>. Match by header name (case-insensitive).<br>
    <b style="color:var(--text)">Minimum:</b> Name + Emp ID/E Code (2 columns is enough to start).<br>
    <b style="color:var(--text)">Optional:</b> Section, Designation, Machine, Responsibility, Mobile, Salary, Weekly Off, Joining Date, Date of Birth, and daily shift columns (e.g. 01-09-2026).<br>
    Only columns present in your file are updated — you can upload just 3 columns if you want.</div>
  <button class="cancel-btn" style="margin-bottom:12px" onclick="downloadBulkImportTemplate()">⬇️ Sample Template Download करें</button>
  <input type="file" id="bulkImportFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleBulkImportFile(this.files[0])">
  <button class="submit-btn" onclick="document.getElementById('bulkImportFile').click()">📁 Choose Excel/CSV File</button>
  <div id="bulkImportPreview" style="margin-top:14px"></div>
  <button class="cancel-btn" style="margin-top:10px" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

function downloadBulkImportTemplate(){
  const csv='Name,Emp ID,Designation,Weekly Off,Mobile,Section,Machine,Responsibility,Salary (₹/month),Joining Date,Date of Birth\nRAM KUMAR,30001001,Line-1,Operator,M-1,Operation,25000,9876543210,01-04-2024,Sunday,15-06-1995\nSHYAM LAL,30001002,Warehouse,Supervisor,ALL,Quality Check,,,,Monday,\n';
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
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
    _processBulkImportRows(rows);
  };

  const reader=new FileReader();
  reader.onload=e=>{
    try{
      if(typeof XLSX==='undefined'){
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=()=>parseWorkbook(new Uint8Array(e.target.result));
        s.onerror=()=>{ previewEl.innerHTML='<div style="color:var(--lv);padding:12px">❌ Library load नहीं हुई। Internet जांचें।</div>'; };
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
    const sectionCol=(_findCol(row,['section','sec','department section','सेक्शन','area','unit'])||'').toString().trim();
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
  _bulkImportInProgress=true;

  const cid = (typeof myCompanyId==='function') ? myCompanyId() : (SESSION.companyId||'');
  const label = SESSION.company || SESSION.companyLabel || '';
  const mgrId = (SESSION.role==='manager' && SESSION.mobile) ? _normMobileKey(SESSION.mobile) : (SESSION.managerId||'');

  let saved=0, updated=0, created=0, failed=0, registered=0;
  const schedByMonth = {}; // mk -> { empId/internalId: [31] }

  const empIdToInternal = {};
  getEmps().forEach(e=>{ if(e.empId) empIdToInternal[String(e.empId).trim()]=e.id; });

  let skippedPhone=0;
  for(let i=0;i<_bulkImportParsed.length;i++){
    const e=_bulkImportParsed[i];
    if(e._skipSave){ skippedPhone++; continue; }
    try{
      let id = e.existingId;
      // Section from Excel Section column only (already resolved in parse); never designation→MGR
      let sec = e.sec || '';
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
        updated++;
      } else {
        id = 'e'+Date.now().toString(36)+i+Math.random().toString(36).slice(2,5);
        rec.id = id;
        rec.ms = Array(31).fill('');
        await fbSet('employees/'+id, rec);
        created++;
        empIdToInternal[e.code] = id;
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
  toast(`✅ Team import: ${created} new, ${updated} updated` +
    (monthsSaved?`, ${monthsSaved} month(s) schedule`:``) +
    (registered?`, ${registered} login ready`:``) +
    (failed?`, ${failed} failed`:``));
  try{ renderTeam(); }catch(e){}
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
    section: en?'Section':'सेक्शन',
    machine: en?'Machine':'मशीन',
    responsibility: en?'Responsibility':'ज़िम्मेदारी',
    designation: en?'Designation':'पद'
  };
  const placeholders = {
    section: en?'Type section name':'सेक्शन लिखें',
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
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">🎉 कोई भी Left नहीं हुआ</div>';
    return;
  }

  const reasonLabel = { resigned:'खुद छोड़ा', terminated:'हटाया गया', contract_end:'Contract समाप्त', retired:'Retired', other:'अन्य' };

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

  let html = `<div style="font-size:11px;color:var(--muted2);margin-bottom:8px;font-weight:700">कुल ${leftList.length} कर्मचारी · Section-wise:</div>`;
  
  const renderOrder = [...SEC_ORDER, ...Object.keys(secGroups).filter(k => !SEC_ORDER.includes(k))];
  renderOrder.forEach(sec => {
    const members = secGroups[sec];
    if(!members || !members.length) return;
    const s = getSectionMeta(sec);
    html += `<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${s.color};margin:10px 0 6px;display:flex;align-items:center;gap:6px">${s.icon||'👤'} ${s.hi||sec} <span style="background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.2);border-radius:4px;padding:1px 6px;font-size:9px;color:var(--lv)">${members.length}</span></div>`;
    html += members.map(e => {
      const ini = (e.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const leftDate = e.leftAt ? new Date(e.leftAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
      const joinDate = e.joiningDate ? new Date(e.joiningDate+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : null;
      const reason = reasonLabel[e.leftReason] || e.leftReason || 'अज्ञात';

      return `<div class="left-card">
        <div class="left-avatar">${ini}</div>
        <div style="flex:1;min-width:0">
          <div class="left-name">${escHtml(e.name||'—')}</div>
          <div class="left-meta">${escHtml(e.empId||'—')} · ${escHtml(e.mc||'—')} · ${escHtml(e.designation||'—')}</div>
          ${joinDate ? `<div class="left-meta">📅 Joined: ${joinDate}</div>` : ''}
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">
            <span class="left-exit">🚪 Left: ${leftDate}</span>
            <span style="font-size:10px;color:var(--muted2)">कारण: ${escHtml(reason)}</span>
          </div>
        </div>
        ${isAdmin() && !e._fromCache ? `<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
          <button onclick="restoreEmployee('${e.id}','${escHtml(e.name||'')}')" style="padding:6px 9px;font-size:11px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:7px;color:#22c55e;cursor:pointer;font-weight:700">↩️ वापस</button>
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
// TEAM — EXCEL UPLOAD (Bulk Update)
// ════════════════════════════════════════
function openTeamExcelUpload(){
  document.getElementById('teamExcelPreview').style.display='none';
  document.getElementById('teamExcelPreview').innerHTML='';
  const fi=document.getElementById('teamExcelFileInput');
  if(fi) fi.value='';
  document.getElementById('teamExcelOverlay').classList.add('open');
}
function closeTeamExcelUpload(){
  document.getElementById('teamExcelOverlay').classList.remove('open');
}


/** Download sample Team Excel matching Manager snapshot format */

async function _downloadAoAAsXlsx(filename, rows, sheetName){
  try{
    if(typeof ensureXlsx==='function') await ensureXlsx();
    else if(typeof XLSX==='undefined'){
      await new Promise((resolve,reject)=>{
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=resolve; s.onerror=reject;
        document.head.appendChild(s);
      });
    }
  }catch(e){ console.warn('[xlsx load]', e); }
  if(typeof XLSX==='undefined'){
    const esc=v=>{ const s=String(v??''); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
    const csv=rows.map(r=>r.map(esc).join(',')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=String(filename||'template').replace(/\.xlsx$/i,'.csv');
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 500);
    toast(L('⚠️ Excel library नहीं मिली — CSV डाउनलोड','⚠️ Excel library missing — CSV downloaded'));
    return;
  }
  const ws=XLSX.utils.aoa_to_sheet(rows);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName||'Template');
  XLSX.writeFile(wb, filename.endsWith('.xlsx')?filename:(filename+'.xlsx'));
}

function downloadTeamExcelTemplate(){
  // IMPORTANT: Section column is required for Home section-wise view & min staff
  // Order matches Schedule Download Excel (uniform)
  const headers = ['Name','Emp ID','Designation','Weekly Off','Mobile','Section','Machine','Responsibility','Salary(₹/Month)','Joining Date','Date of Birth'];
  const sample = [
    ['RAHUL MEHTA','41001201','Team Member','MON','9810011223','Production A','Line-1','Operation','32000','12-03-2024','15-08-1995'],
    ['PRIYA SHARMA','41001202','Sr. Team Member','WED','9823344556','Production A','Line-1','Setup','38500','01-06-2023','22-11-1992'],
    ['AMIT KUMAR','41001203','Trainee','FRI','9876512340','Production B','Line-2','Assistant','21000','05-01-2026','03-04-2001'],
    ['NEHA GUPTA','41001204','Team Member','TUE','9900112233','Quality','QC-Desk','Inspection','29500','18-09-2024','09-07-1996'],
    ['VIKAS PATEL','41001205','Jr. Team Member','SAT','9911223344','Warehouse','Bay-3','Handling','26000','20-11-2025','11-02-1998'],
  ];
  try{ toast(L('⬇️ Excel template (.xlsx)…','⬇️ Excel template (.xlsx)…')); }catch(e){}
  _downloadAoAAsXlsx('ManPower_Team_Upload_Template.xlsx', [headers, ...sample], 'Team').then(()=>{
    try{ toast(L('✅ Team template Excel डाउनलोड','✅ Team template Excel downloaded')); }catch(e){}
  }).catch(err=>{
    console.warn(err);
    try{ toast('❌ Template download failed'); }catch(e){}
  });
}

async function handleTeamExcelFile(file){
  if(!file) return;
  const preview=document.getElementById('teamExcelPreview');
  preview.style.display='block';
  preview.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted2)">⏳ Reading file…</div>';

  try{
    if(!window.XLSX){
      await new Promise((resolve,reject)=>{
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload=resolve; s.onerror=reject;
        document.head.appendChild(s);
      });
    }

    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});

    if(rows.length<2){
      preview.innerHTML='<div style="color:var(--lv);padding:12px">❌ No data rows found in Excel</div>';
      return;
    }

    const { header, colMap } = _mapExcelColumns(rows[0]);
    // Map legacy names used below
    colMap.name = colMap.name;
    colMap.mobile = colMap.mobile;
    colMap.designation = colMap.designation;
    colMap.machine = colMap.machine;
    colMap.doj = colMap.doj;
    colMap.woff = colMap.woff;
    colMap.salary = colMap.salary;

    if(colMap.code < 0 && colMap.name < 0){
      preview.innerHTML='<div style="color:var(--lv);padding:12px">❌ Need <b>Name</b> and/or <b>Emp ID</b> columns.<br><span style="font-size:11px;color:var(--muted2)">Found: '+rows[0].join(', ')+'</span></div>';
      return;
    }
    if(colMap.code < 0){
      preview.innerHTML='<div style="color:var(--lv);padding:12px">❌ <b>Emp ID</b> / Employee Code column not found.<br><span style="font-size:11px;color:var(--muted2)">Found headers: '+rows[0].join(', ')+'</span><br><span style="font-size:11px">Accepted: Emp ID, EmpID, Employee Code, Code…</span></div>';
      return;
    }

    const emps=getEmps();
    const allEmps = _cache.employees || [];
    const phoneOwners = new Map();
    allEmps.forEach(e=>{
      const p=_normMobileKey(e.phone||e.mobile||'');
      if(p) phoneOwners.set(p, e);
    });

    const parsed=[];
    let matchCount=0, createCount=0, skipCount=0;

    for(let i=1;i<rows.length;i++){
      const r=rows[i];
      if(!r||!r.length) continue;
      const code=(r[colMap.code]||'').toString().trim().toUpperCase();
      if(!code) continue;

      let matched=emps.find(e=>(e.empId||'').trim().toUpperCase()===code)
        || allEmps.find(e=>(e.empId||'').trim().toUpperCase()===code);
      const name=colMap.name>=0?(r[colMap.name]||'').toString().trim():(matched?matched.name:'');
      if(!name && !matched){ skipCount++; continue; }

      const mobile=colMap.mobile>=0?(r[colMap.mobile]||'').toString().trim().replace(/\D/g,'').slice(-10):'';
      const designation=colMap.designation>=0?(r[colMap.designation]||'').toString().trim():'';
      const machine=colMap.machine>=0?(r[colMap.machine]||'').toString().trim():'';
      const sectionCol=colMap.section>=0?(r[colMap.section]||'').toString().trim():'';
      const responsibility=colMap.responsibility>=0?(r[colMap.responsibility]||'').toString().trim():'';
      const doj=colMap.doj>=0?_parseExcelDate(r[colMap.doj]):'';
      const dob=colMap.dob>=0?_parseExcelDate(r[colMap.dob]):'';
      const woff=colMap.woff>=0?_parseWoff((r[colMap.woff]||'').toString().trim()):'';
      const salaryRaw=colMap.salary>=0?(r[colMap.salary]||'').toString().trim().replace(/[^0-9.]/g,''):'';
      const salary=salaryRaw?parseFloat(salaryRaw):null;

      // Section: MUST use Excel "Section" column (Metalliser / Slitter / MetProd …).
      // Never map Designation (Manager→MGR, Engineer→SUP) into Section.
      let sec = sectionCol || '';
      if(!sec && matched){
        // Keep previous real section text if not a role/machine code
        const prev = String(matched.section || matched.sec || '').trim();
        if(prev && !_isMachineLikeValue(prev) && !_isRoleOnlySec(prev)) sec = prev;
      }
      if(!sec) sec = 'General';

      let otherTeam = false, conflictWith = '';
      if(mobile && mobile.length===10){
        const owner = phoneOwners.get(mobile);
        if(owner && (!matched || owner.id !== matched.id)){
          const myKey = SESSION.role==='manager' ? _normMobileKey(SESSION.mobile) : null;
          if(owner.managerId && myKey && owner.managerId !== myKey){
            otherTeam = true; conflictWith = owner.name||owner.empId||'other team';
          } else if(matched && owner.id !== matched.id){
            otherTeam = true; conflictWith = owner.name||owner.empId||'duplicate';
          }
        }
      }

      if(matched) matchCount++; else createCount++;

      parsed.push({
        id: matched ? matched.id : ('emp_'+code.replace(/[^A-Z0-9]/g,'_').toLowerCase()),
        empId: code,
        name: name || matched.name,
        phone: mobile || (matched && (matched.phone||matched.mobile)) || '',
        mobile: mobile || '',
        designation: designation || (matched&&matched.designation) || '',
        machine: machine || (matched&&matched.machine) || '',
        responsibility: responsibility || (matched&&matched.responsibility) || '',
        sec: sec || (matched&&matched.sec) || 'General',
        joiningDate: doj || (matched&&matched.joiningDate) || '',
        dob: dob || (matched&&matched.dob) || '',
        woff: woff || (matched&&matched.woff) || '',
        monthlySalary: (salary!=null && !isNaN(salary)) ? salary : (matched&&matched.monthlySalary) || null,
        salary: (salary!=null && !isNaN(salary)) ? salary : (matched&&(matched.salary||matched.monthlySalary)) || null,
        existing: !!matched,
        otherTeam,
        _conflictWith: conflictWith,
        _skipSave: otherTeam
      });
    }

    if(!parsed.length){
      preview.innerHTML='<div style="color:var(--lv);padding:12px">❌ No valid employee rows (need Emp ID + Name).<br><span style="font-size:11px;color:var(--muted2)">Headers: '+rows[0].join(', ')+'</span></div>';
      return;
    }

    window._teamExcelParsed = parsed;
    const ok = parsed.filter(p=>!p._skipSave);
    const blocked = parsed.filter(p=>p._skipSave);
    preview.innerHTML = `
      <div style="font-size:13px;font-weight:800;color:#22c55e;margin-bottom:8px">
        ✅ ${ok.length} ready · 🔄 ${matchCount} update · 🆕 ${createCount} new
        ${blocked.length?` · <span style="color:#fb7185">🚫 ${blocked.length} blocked</span>`:''}
      </div>
      <div style="font-size:11px;color:var(--muted2);margin-bottom:8px">Columns: ${header.filter(Boolean).slice(0,12).join(' · ')}</div>
      ${blocked.length?`<div style="background:rgba(244,63,94,.1);border-radius:8px;padding:8px;font-size:11px;color:#fda4af;margin-bottom:8px">
        Duplicate / other-team mobile blocked:<br>
        ${blocked.slice(0,5).map(e=>`<b>${escHtml(e.name)}</b> (${escHtml(e.mobile)}) → ${e._conflictWith}`).join('<br>')}
      </div>`:''}
      <div style="max-height:180px;overflow:auto;font-size:12px;border:1px solid var(--border);border-radius:8px;padding:8px;margin-bottom:12px">
        ${parsed.slice(0,15).map(e=>`<div style="${e._skipSave?'opacity:.5;color:#fb7185':''}">${e.existing?'🔄':'🆕'} <b style="color:var(--text)">${escHtml(e.name)}</b> · ${escHtml(e.empId)} · ${escHtml(e.sec||'—')} · ${escHtml(e.phone||'no mobile')}</div>`).join('')}
        ${parsed.length>15?`<div>… +${parsed.length-15} more</div>`:''}
      </div>
      <button class="submit-btn" onclick="confirmTeamExcelUpload()">💾 Save to Team (${ok.length})</button>
    `;
  }catch(err){
    console.error('[teamExcel]', err);
    preview.innerHTML='<div style="color:var(--lv);padding:12px">❌ Error reading file: '+(err.message||err)+'</div>';
  }
}

async function confirmTeamExcelUpload(){
  const parsed = (window._teamExcelParsed||[]).filter(e=>!e._skipSave);
  if(!parsed.length){ toast('❌ Nothing to save'); return; }
  const preview=document.getElementById('teamExcelPreview');
  if(preview) preview.innerHTML='<div style="text-align:center;padding:16px">⏳ Saving…</div>';

  const mgrKey = (SESSION.role==='manager' && SESSION.mobile) ? _normMobileKey(SESSION.mobile) : (SESSION.managerId||'');
  let saved=0, failed=0;
  for(const emp of parsed){
    try{
      const sal = (emp.monthlySalary!=null && !isNaN(emp.monthlySalary)) ? Number(emp.monthlySalary)
        : (emp.salary!=null && !isNaN(emp.salary) ? Number(emp.salary) : null);
      const update = {
        id: emp.id,
        empId: emp.empId,
        name: emp.name,
        sec: emp.sec || emp.section || 'General',
        section: emp.sec || emp.section || 'General',
        mc: emp.machine || emp.mc || '',
        machine: emp.machine || emp.mc || '',
        designation: emp.designation || '',
        resp: emp.responsibility || emp.resp || '',
        responsibility: emp.responsibility || emp.resp || '',
        phone: emp.phone || emp.mobile || '',
        mobile: emp.phone || emp.mobile || '',
        woff: emp.woff || '',
        joiningDate: emp.joiningDate || '',
        dob: emp.dob || '',
        companyId: SESSION.companyId || _normCompanyId(SESSION.company) || 'default',
        companyLabel: SESSION.company || 'Man Power',
        managerId: mgrKey || emp.managerId || '',
        updatedAt: new Date().toISOString(),
        updatedBy: SESSION.name || 'manager',
        excelSyncedAt: new Date().toISOString()
      };
      // Salary from Excel → both keys so Profile + salary reports work
      if(sal!=null){
        update.monthlySalary = sal;
        update.salary = sal;
      }
      if(mgrKey) update.managerId = mgrKey;
      // Manager's own row: mobile must equal login number (cannot change via Excel)
      if(isMgr() && isManagerSelfRecord({...emp, phone: emp.phone||emp.mobile, id: emp.id})){
        update.phone = mgrKey;
        update.mobile = mgrKey;
      } else if(isMgr() && _normMobileKey(emp.phone||emp.mobile||'') === mgrKey && emp.id){
        // Row claiming manager's number for another emp — block later; keep as-is here
      }
      // If this row is the manager (matched by empId to self or phone==login), force login mobile
      const selfMob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
      if(isMgr() && selfMob && (
        _normMobileKey(emp.phone||'')===selfMob ||
        (SESSION.empObjId && emp.id===SESSION.empObjId) ||
        (SESSION.empId && String(emp.empId).toUpperCase()===String(SESSION.empId).toUpperCase())
      )){
        update.phone = selfMob;
        update.mobile = selfMob;
      }
      if(!emp.existing){
        update.createdAt = new Date().toISOString();
        update.createdBy = SESSION.name || 'manager';
      }
      await fbUpdate('employees/' + emp.id, update);
      // Save full profile under mobile number (create or update mobileUsers)
      if(update.phone && update.phone.length===10){
        try{
          const existing = await fbGet('mobileUsers/'+update.phone) || {};
          // Never demote manager/admin role via Excel
          const keepRole = (existing.role==='manager' || existing.role==='admin') ? existing.role : 'member';
          const keepStatus = (existing.status==='approved' || keepRole==='manager') ? 'approved' : (existing.status||'approved');
          const profilePayload = {
            ...existing,
            name: update.name,
            mobile: update.phone,
            phone: update.phone,
            role: keepRole,
            status: keepStatus,
            managerId: existing.managerId || mgrKey || '',
            company: update.companyLabel || existing.company || '',
            companyId: update.companyId || existing.companyId || '',
            empId: update.empId,
            empObjId: update.id,
            designation: update.designation || '',
            sec: update.sec || '',
            section: update.sec || '',
            mc: update.mc || '',
            machine: update.machine || '',
            resp: update.resp || '',
            responsibility: update.responsibility || '',
            woff: update.woff || '',
            joiningDate: update.joiningDate || '',
            dob: update.dob || '',
            salary: update.salary!=null ? update.salary : (existing.salary||null),
            monthlySalary: update.monthlySalary!=null ? update.monthlySalary : (existing.monthlySalary||null),
            excelSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          if(!existing.approvedAt && keepStatus==='approved'){
            profilePayload.approvedAt = new Date().toISOString();
            profilePayload.approvedBy = SESSION.name || 'manager';
          }
          await fbSet('mobileUsers/'+update.phone, profilePayload);
        }catch(ex){ console.warn('mobileUsers profile', update.phone, ex); }
      }
      saved++;
    }catch(e){
      failed++;
      console.error('team excel save', emp.name, e);
    }
  }
  window._teamExcelParsed=null;
  closeTeamExcelUpload();
  toast(failed ? `✅ ${saved} saved, ${failed} failed` : `✅ ${saved} team members saved`);
  try{ renderTeam(); }catch(e){}
  try{ refreshAll(); }catch(e){}
}

function _parseExcelDate(val){
  if(!val) return '';
  const s = val.toString().trim();
  if(!s) return '';

  // Helper: build ISO string directly to avoid timezone offset issues
  const toISO = (dd, mm, yyyy) => {
    const d = parseInt(dd), m = parseInt(mm), y = parseInt(yyyy);
    if(m < 1 || m > 12 || d < 1 || d > 31 || y < 1950 || y > 2050) return '';
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  };

  // 1. Already ISO format YYYY-MM-DD
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0,10);

  // 2. Excel serial number (5 digits, post-1970)
  if(/^\d{5}$/.test(s)){
    const serial = parseInt(s);
    if(serial > 25569){
      const ms = (serial - 25569) * 86400000;
      const d = new Date(ms);
      if(!isNaN(d.getTime())){
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      }
    }
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY (Indian format — most common)
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if(dmyMatch){
    const r = toISO(dmyMatch[1], dmyMatch[2], dmyMatch[3]);
    if(r) return r;
  }

  // 4. MM/DD/YYYY (US format — fallback when day > 12)
  const mdyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if(mdyMatch && parseInt(mdyMatch[1]) <= 12){
    const r = toISO(mdyMatch[2], mdyMatch[1], mdyMatch[3]);
    if(r) return r;
  }

  // 5. "31 Jul 2025" or "31-Jul-2025" text format
  const textMatch = s.match(/^(\d{1,2})[\s\-\/]([A-Za-z]+)[\s\-\/](\d{4})$/);
  if(textMatch){
    const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
    const m = months[textMatch[2].toLowerCase().substring(0,3)];
    if(m) return toISO(textMatch[1], m, textMatch[3]);
  }

  // 6. "Jul 31, 2025" format
  const textMatch2 = s.match(/^([A-Za-z]+)[\s\-\/](\d{1,2})[,\s]+(\d{4})$/);
  if(textMatch2){
    const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
    const m = months[textMatch2[1].toLowerCase().substring(0,3)];
    if(m) return toISO(textMatch2[2], m, textMatch2[3]);
  }

  return '';
}

function _parseWoff(val){
  if(!val) return '';
  const map={'sun':'SUN','mon':'MON','tue':'TUE','wed':'WED','thu':'THU','fri':'FRI','sat':'SAT',
    'sunday':'SUN','monday':'MON','tuesday':'TUE','wednesday':'WED','thursday':'THU','friday':'FRI','saturday':'SAT',
    'रवि':'SUN','सोम':'MON','मंगल':'TUE','बुध':'WED','गुरु':'THU','शुक्र':'FRI','शनि':'SAT'};
  const clean=val.toLowerCase().trim();
  if(map[clean]) return map[clean];
  for(const [k,v] of Object.entries(map)){
    if(clean.includes(k)) return v;
  }
  const upper=val.toUpperCase().trim();
  if(['SUN','MON','TUE','WED','THU','FRI','SAT'].includes(upper)) return upper;
  return '';
}

async function confirmTeamExcelUpdate(){
  const parsed=window._teamExcelParsed;
  if(!parsed||!parsed.length){ toast(L('❌ कोई data नहीं है','❌ No data')); return; }

  const matched=parsed.filter(p=>p.matched);
  if(!matched.length){ toast(L('❌ कोई match नहीं','❌ No matches')); return; }

  const preview=document.getElementById('teamExcelPreview');
  preview.innerHTML='<div style="text-align:center;padding:20px"><div style="font-size:28px;margin-bottom:8px">⏳</div><div style="color:var(--muted2)">'+matched.length+' कर्मचारी update हो रहे हैं...</div></div>';

  let updated=0, errors=0;
  for(const p of matched){
    try{
      const updateObj={};
      if(p.name) updateObj.name=p.name;
      if(p.mobile&&p.mobile.length===10) updateObj.phone=p.mobile;
      if(p.designation) updateObj.designation=p.designation;
      if(p.machine) updateObj.mc=p.machine;
      if(p.doj) updateObj.joiningDate=p.doj;
      if(p.woff) updateObj.woff=p.woff;
      if(p.salary) updateObj.monthlySalary=p.salary;

      if(Object.keys(updateObj).length>0){
        await fbUpdate('employees/'+p.empObjId, updateObj);
        updated++;
      }
    }catch(e){
      errors++;
      console.warn('[TeamExcel] Update error for '+p.code+':', e.message);
    }
  }

  const phoneUpdated=matched.filter(p=>p.mobile&&p.mobile.length===10).length;

  preview.innerHTML=`
    <div style="text-align:center;padding:20px">
      <div style="font-size:40px;margin-bottom:10px">🎉</div>
      <div style="font-size:18px;font-weight:900;color:var(--green);margin-bottom:6px">Update Complete!</div>
      <div style="font-size:13px;color:var(--muted2);line-height:1.8">
        ✅ <b style="color:#fff">${updated}</b> कर्मचारी update हुए<br>
        📱 <b style="color:var(--green)">${phoneUpdated}</b> phone numbers save हुए<br>
        ${errors>0?'❌ <b style="color:var(--lv)">'+errors+'</b> errors<br>':''}
        <span style="color:var(--day)">📲 अब shift change पर WhatsApp भेज सकते हैं!</span>
      </div>
      <button class="submit-btn" style="margin-top:16px" onclick="closeTeamExcelUpload()">👍 बंद करें</button>
    </div>`;

  window._teamExcelParsed=null;
  toast('✅ '+updated+L(' कर्मचारी update हुए!',' employees updated!'));
}

// ════════════════════════════════════════
// INSTRUCTIONS
// ════════════════════════════════════════
function renderInstructions(){
  const inst=getInst();
  const canEdit=canEditInst();

  document.getElementById('instEditBtn').innerHTML = canEdit
    ? `<button class="big-btn blue" style="margin-bottom:14px" onclick="openEditInstructions()">✏️ निर्देश संपादित करें</button>` : '';

  const sections=[
    {key:'safety',   data:inst.safety},
    {key:'shift',    data:inst.shift},
    {key:'leave',    data:inst.leave},
    {key:'ncr',      data:inst.ncr},
    {key:'machine',  data:inst.machine},
  ];

  let html=sections.map((sec,i)=>`
    <div class="inst-section">
      <div class="inst-header" onclick="toggleInst('inst-${i}')">
        <div class="inst-icon" style="background:var(--card2);font-size:22px">${escHtml(sec.data.title.split(' ')[0])}</div>
        <div style="flex:1"><div class="inst-title">${escHtml(sec.data.title.substring(sec.data.title.indexOf(' ')+1))}</div>
        <div class="inst-sub">${sec.data.items?.length||0} नियम</div></div>
        <div style="color:var(--muted);font-size:18px" id="arr-${i}">▼</div>
      </div>
      <div class="inst-body${i===0?' open':''}" id="inst-${i}">
        ${(sec.data.items||[]).map(item=>`
          <div class="inst-item">
            <div class="inst-bullet">${item.icon}</div>
            <div><div class="inst-text">${item.text}</div><div class="inst-note">${item.note||''}</div></div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  // Contact section
  html+=`<div class="inst-section">
    <div class="inst-header" onclick="toggleInst('inst-contact')">
      <div class="inst-icon" style="background:var(--lvbg)">📞</div>
      <div style="flex:1"><div class="inst-title">संपर्क सूत्र</div><div class="inst-sub">Emergency Numbers</div></div>
      <div style="color:var(--muted);font-size:18px" id="arr-contact">▼</div>
    </div>
  <div class="inst-body" id="inst-contact">
      <div class="emergency-card">
        <div class="emergency-name">📞 संपर्क सूत्र</div>
        <div class="emergency-num">+91-8929394920</div>
        <div style="font-size:11px;color:var(--muted2);margin-top:4px">Production Department</div>
        <a href="tel:+918929394920" style="display:block;margin-top:10px">
          <button class="big-btn" style="padding:12px">📞 Call Now</button>
        </a>
      </div>
      ${(inst.contact?.emergency||[]).slice(1).map(c=>`
        <div class="emergency-card">
          <div class="emergency-name">📞 ${escHtml(c.name)}</div>
          <div class="emergency-num">${c.num}</div>
          <div style="font-size:11px;color:var(--muted2);margin-top:4px">${c.role}</div>
          <a href="tel:${c.num.replace(/\s/g,'')}" style="display:block;margin-top:10px">
            <button class="big-btn" style="padding:12px">📞 Call Now</button>
          </a>
        </div>`).join('')}
    </div>
  </div>`;

  document.getElementById('instructionsContent').innerHTML=html;
}

function toggleInst(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.toggle('open');
  const i=id.replace('inst-','');
  const arr=document.getElementById('arr-'+i);
  if(arr) arr.textContent=el.classList.contains('open')?'▲':'▼';
}

function openEditInstructions(){
  const inst = getInst();
  const sections = Object.entries(inst).filter(([k])=>k!=='contact');
  
  let sectionsHTML = sections.map(([key, sec])=>`
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <input value="${escHtml(sec.title||'')}" id="isec_title_${key}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-size:13px;font-weight:700;width:calc(100% - 60px);font-family:inherit">
        <button onclick="deleteInstSection('${key}')" style="background:rgba(244,63,94,.15);border:none;color:#f43f5e;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:16px;flex-shrink:0;margin-left:6px">🗑️</button>
      </div>
      <div id="isec_items_${key}">
        ${(sec.items||[]).map((item,i)=>`
          <div style="display:flex;gap:6px;margin-bottom:6px;align-items:flex-start" id="iitem_${key}_${i}">
            <input value="${item.icon||''}" id="iicon_${key}_${i}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:6px;color:var(--text);font-size:13px;width:44px;text-align:center;flex-shrink:0;font-family:inherit" placeholder="🔧">
            <div style="flex:1">
              <input value="${(item.text||'').replace(/"/g,'&quot;')}" id="itext_${key}_${i}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-size:12px;width:100%;margin-bottom:4px;font-family:inherit" placeholder="नियम लिखें...">
              <input value="${(item.note||'').replace(/"/g,'&quot;')}" id="inote_${key}_${i}" style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:5px 8px;color:var(--muted2);font-size:11px;width:100%;font-family:inherit" placeholder="Note (optional)">
            </div>
            <button onclick="removeInstItem('${key}',${i})" style="background:none;border:none;color:#f43f5e;cursor:pointer;font-size:16px;padding:4px;flex-shrink:0;margin-top:2px">✕</button>
          </div>`).join('')}
      </div>
      <button onclick="addInstItem('${key}')" style="background:rgba(249,115,22,.12);border:1px dashed rgba(249,115,22,.3);border-radius:8px;padding:7px;width:100%;color:#f97316;font-size:12px;font-weight:700;cursor:pointer;margin-top:4px;font-family:inherit">+ नियम जोड़ें</button>
    </div>`).join('');

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">✏️ निर्देश संपादित करें</div>
    <div id="instEditBody" style="max-height:60vh;overflow-y:auto;padding-right:4px">
      ${sectionsHTML}
      <button onclick="addInstSection()" style="background:rgba(56,189,248,.1);border:1.5px dashed rgba(56,189,248,.3);border-radius:10px;padding:10px;width:100%;color:#38bdf8;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit">➕ नया Section जोड़ें</button>
    </div>
    <button class="submit-btn" onclick="saveInstructions()">💾 सहेजें (Save)</button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

function addInstItem(sectionKey){
  const inst = getInst();
  const sec = inst[sectionKey];
  if(!sec) return;
  const items = sec.items || [];
  const i = items.length;
  const container = document.getElementById(`isec_items_${sectionKey}`);
  if(!container) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;align-items:flex-start';
  div.id = `iitem_${sectionKey}_${i}`;
  div.innerHTML = `
    <input id="iicon_${sectionKey}_${i}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:6px;color:var(--text);font-size:13px;width:44px;text-align:center;flex-shrink:0;font-family:inherit" placeholder="🔧">
    <div style="flex:1">
      <input id="itext_${sectionKey}_${i}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-size:12px;width:100%;margin-bottom:4px;font-family:inherit" placeholder="नियम लिखें...">
      <input id="inote_${sectionKey}_${i}" style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:5px 8px;color:var(--muted2);font-size:11px;width:100%;font-family:inherit" placeholder="Note (optional)">
    </div>
    <button onclick="this.closest('[id^=iitem_]').remove()" style="background:none;border:none;color:#f43f5e;cursor:pointer;font-size:16px;padding:4px;flex-shrink:0;margin-top:2px">✕</button>`;
  container.appendChild(div);
}

function removeInstItem(sectionKey, idx){
  const el = document.getElementById(`iitem_${sectionKey}_${idx}`);
  if(el) el.remove();
}

function deleteInstSection(key){
  const secDiv = document.querySelector(`#isec_title_${key}`)?.closest('[style*="border-radius:12px"]');
  if(secDiv) secDiv.remove();
}

function addInstSection(){
  const body = document.getElementById('instEditBody');
  const addBtn = body.querySelector('button[onclick="addInstSection()"]');
  const newKey = 'custom_'+Date.now();
  const div = document.createElement('div');
  div.style.cssText = 'background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px';
  div.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <input placeholder="📌 Section का नाम" id="isec_title_${newKey}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-size:13px;font-weight:700;width:calc(100% - 60px);font-family:inherit">
      <button onclick="this.closest('[style*=border-radius]').remove()" style="background:rgba(244,63,94,.15);border:none;color:#f43f5e;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:16px;flex-shrink:0;margin-left:6px">🗑️</button>
    </div>
    <div id="isec_items_${newKey}"></div>
    <button onclick="addInstItem('${newKey}')" style="background:rgba(249,115,22,.12);border:1px dashed rgba(249,115,22,.3);border-radius:8px;padding:7px;width:100%;color:#f97316;font-size:12px;font-weight:700;cursor:pointer;margin-top:4px;font-family:inherit">+ नियम जोड़ें</button>`;
  body.insertBefore(div, addBtn);
}

async function saveInstructions(){
  const body = document.getElementById('instEditBody');
  if(!body){ toast('Error: form not found'); return; }
  
  const newInst = {};
  // Find all section containers by looking for isec_title_ inputs
  const titleInputs = body.querySelectorAll('[id^="isec_title_"]');
  
  titleInputs.forEach(titleEl => {
    const key = titleEl.id.replace('isec_title_','');
    const title = titleEl.value.trim();
    if(!title) return;
    
    const itemsContainer = document.getElementById(`isec_items_${key}`);
    const items = [];
    if(itemsContainer){
      // Collect all item rows
      let i = 0;
      while(true){
        const iconEl = document.getElementById(`iicon_${key}_${i}`);
        const textEl = document.getElementById(`itext_${key}_${i}`);
        const noteEl = document.getElementById(`inote_${key}_${i}`);
        if(!iconEl && !textEl) {
          // Also try collecting dynamically added items that don't have numeric IDs
          break;
        }
        if(textEl && textEl.value.trim()){
          items.push({
            icon: iconEl?.value?.trim()||'📌',
            text: textEl.value.trim(),
            note: noteEl?.value?.trim()||''
          });
        }
        i++;
        if(i>50) break;
      }
    }
    newInst[key] = { title, items };
  });
  
  // Preserve contact section from current inst
  const existing = getInst();
  if(existing.contact) newInst.contact = existing.contact;
  
  await fbSet('instructions', newInst);
  _cache.instructions = newInst;
  closeModal();
  renderInstructions();
  toast(L('✅ निर्देश सहेज लिए गए!','✅ Instructions saved!'));
}


// ════════════════════════════════════════
// 🔐 SECURITY HARDENING
// ════════════════════════════════════════

// Anti-tamper: Freeze SESSION object after login
// Prevents console hacks like SESSION.role='admin'
function lockSession(){
  try{
    // Proxy-wrap SESSION so writes are logged + blocked
    const _s = {...SESSION};
    const handler = {
      set(target, prop, value){
        // Only allow from trusted internal calls (not console)
        const stack = new Error().stack || '';
        const isInternal = stack.includes('launchApp') || stack.includes('saveSession') ||
          stack.includes('tryAdminLogin') || stack.includes('tryWorkerLogin') ||
          stack.includes('initSession') || stack.includes('tryUnlock');
        if(!isInternal){
          console.warn('🔐 Security: SESSION modification blocked. Contact admin.');
          // Log tampering attempt to Firebase
          try{ fbSet('securityLog/'+Date.now(), {
            type:'session_tamper', prop, value:String(value).substring(0,50),
            time:new Date().toISOString(), ua:navigator.userAgent.substring(0,100)
          }); }catch(e){}
          return false; // Block the write
        }
        target[prop] = value;
        return true;
      },
      get(target, prop){ return target[prop]; }
    };
    // Note: Full proxy lock applied — console SESSION.role='admin' will be blocked
    Object.keys(_s).forEach(k => { if(!(k in SESSION)) SESSION[k]=_s[k]; });
  }catch(e){}
}

// Rate limiter for login attempts
const _loginAttempts = { admin:{count:0,lockUntil:0}, worker:{count:0,lockUntil:0} };
function checkRateLimit(type){
  const a = _loginAttempts[type];
  if(!a) return {ok:true};
  if(a.lockUntil > Date.now()){
    const secs = Math.ceil((a.lockUntil - Date.now())/1000);
    return {ok:false, msg:`Too many attempts. Wait ${secs}s.`};
  }
  return {ok:true};
}
function recordFailedAttempt(type){
  const a = _loginAttempts[type];
  if(!a) return;
  a.count++;
  if(a.count >= 5){ a.lockUntil = Date.now() + 30000; a.count = 0; } // 30s lockout after 5 fails
}
function resetAttempts(type){ if(_loginAttempts[type]) _loginAttempts[type] = {count:0,lockUntil:0}; }

// ════════════════════════════════════════
// 🔭 TAB VISIBILITY — ADMIN CONTROL
// ════════════════════════════════════════

// All tabs that admin can grant to guest/worker
const TAB_META = {
  home:     {ico:'🏠', lbl:'होम',      desc:'Dashboard & Home screen'},
  schedule: {ico:'📅', lbl:'शेड्यूल', desc:'Shift schedule viewer'},
  leave:    {ico:'🏖️', lbl:'अवकाश',  desc:'Leave request & status'},
  reports:  {ico:'📋', lbl:'रिपोर्ट', desc:'NCR, Warning, Appreciation'},
  todo:     {ico:'✅', lbl:'To-Do',    desc:'Task list (always ON for guest)'},
  pending:  {ico:'⏳', lbl:'पेंडिंग', desc:'Pending approvals (admin only)'},
  team:     {ico:'👥', lbl:'टीम',      desc:'Employee team view (admin only)'},
};

// Tabs that can be toggled for guest (non-admin-only tabs)
const GUEST_TOGGLEABLE = ['home','schedule','leave','reports'];
const WORKER_TOGGLEABLE = ['home','schedule','leave','reports'];

async function openTabVisibilitySettings(){
  if(!isAdmin()){ toast('❌ Admin only'); return; }

  // Load current settings
  let guestTabs = {};
  let workerTabsHidden = {};
  try{
    guestTabs = (await fbGet('settings/guestTabs')) || {};
    workerTabsHidden = (await fbGet('settings/workerTabsHidden')) || {};
  }catch(e){}

  const guestRows = GUEST_TOGGLEABLE.map(id => {
    const m = TAB_META[id];
    const on = guestTabs[id] === true;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <span style="font-size:18px">${m.ico}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:800;color:#fff">${m.lbl}</div>
        <div style="font-size:10px;color:var(--muted2)">${m.desc}</div>
      </div>
      <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
        <input type="checkbox" id="gtog_${id}" ${on?'checked':''} style="opacity:0;width:0;height:0"
          onchange="updateTabToggle('guest','${id}',this.checked)">
        <span style="position:absolute;inset:0;border-radius:12px;transition:.2s;background:${on?'#22c55e':'rgba(255,255,255,.15)'};" id="gtog_track_${id}"></span>
        <span style="position:absolute;top:3px;left:${on?'23':'3'}px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s" id="gtog_thumb_${id}"></span>
      </label>
    </div>`;
  }).join('');

  const workerRows = WORKER_TOGGLEABLE.map(id => {
    const m = TAB_META[id];
    const hidden = workerTabsHidden[id] === true;
    const on = !hidden;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <span style="font-size:18px">${m.ico}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:800;color:#fff">${m.lbl}</div>
        <div style="font-size:10px;color:var(--muted2)">${m.desc}</div>
      </div>
      <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
        <input type="checkbox" id="wtog_${id}" ${on?'checked':''} style="opacity:0;width:0;height:0"
          onchange="updateTabToggle('worker','${id}',this.checked)">
        <span style="position:absolute;inset:0;border-radius:12px;transition:.2s;background:${on?'#22c55e':'rgba(255,255,255,.15)'};" id="wtog_track_${id}"></span>
        <span style="position:absolute;top:3px;left:${on?'23':'3'}px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s" id="wtog_thumb_${id}"></span>
      </label>
    </div>`;
  }).join('');

  openModal(`
    <div style="padding:20px 16px">
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:32px">🔭</div>
        <div style="font-size:17px;font-weight:900;color:#fff;margin-top:6px">Tab Visibility Settings</div>
        <div style="font-size:11px;color:var(--muted2);margin-top:3px">Guest & Worker को कौन से tabs दिखें — यहाँ control करें</div>
      </div>

      <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:11px;color:#fbbf24">
        ⚡ Changes instant hote hain — next login pe reflect hoga
      </div>

      <div style="font-size:10px;font-weight:900;color:rgba(34,197,94,.8);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">👤 Guest Access — Extra Tabs</div>
      <div style="background:var(--card);border-radius:12px;padding:0 12px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
          <span style="font-size:18px">✅</span>
          <div style="flex:1"><div style="font-size:13px;font-weight:800;color:#22c55e">To-Do</div>
          <div style="font-size:10px;color:var(--muted2)">Always visible for guest</div></div>
          <span style="font-size:11px;font-weight:800;color:#22c55e;background:rgba(34,197,94,.15);padding:3px 8px;border-radius:6px">ALWAYS ON</span>
        </div>
        ${guestRows}
      </div>

      <div style="font-size:10px;font-weight:900;color:rgba(56,189,248,.8);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">👷 Worker — Tab Visibility</div>
      <div style="background:var(--card);border-radius:12px;padding:0 12px;margin-bottom:16px">
        ${workerRows}
      </div>

      <div style="font-size:10px;font-weight:900;color:rgba(251,191,36,.8);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">🏅 Manager — Data Access</div>
      <div style="background:var(--card);border-radius:12px;padding:0 12px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 0">
          <span style="font-size:22px">💰</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:800;color:#fff">Monthly Salary देख सकें</div>
            <div style="font-size:10px;color:var(--muted2)">Manager को Team card में salary दिखे</div>
          </div>
          <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
            <input type="checkbox" id="mgr_salary_tog" ${(_cache.settings?.showSalaryToManager?'checked':'')} style="opacity:0;width:0;height:0"
              onchange="toggleManagerSalaryAccess(this.checked)">
            <span style="position:absolute;inset:0;border-radius:12px;transition:.2s;background:${(_cache.settings?.showSalaryToManager?'#22c55e':'rgba(255,255,255,.15)')};" id="mgr_salary_track"></span>
            <span style="position:absolute;top:3px;left:${(_cache.settings?.showSalaryToManager?'23':'3')}px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s" id="mgr_salary_thumb"></span>
          </label>
        </div>
      </div>

      <button onclick="closeModal()" style="width:100%;padding:13px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit">✅ Done</button>
    </div>
  `);
}

async function updateTabToggle(role, tabId, isOn){
  const track = document.getElementById(`${role[0]}tog_track_${tabId}`);
  const thumb = document.getElementById(`${role[0]}tog_thumb_${tabId}`);
  if(track){ track.style.background = isOn ? '#22c55e' : 'rgba(255,255,255,.15)'; }
  if(thumb){ thumb.style.left = isOn ? '23px' : '3px'; }

  try{
    if(role === 'guest'){
      await fbSet(`settings/guestTabs/${tabId}`, isOn);
      toast(`✅ Guest: ${TAB_META[tabId]?.lbl} ${isOn?L('दिखेगा','shown'):L('हटाया','hidden')}`);
    } else {
      await fbSet(`settings/workerTabsHidden/${tabId}`, !isOn);
      toast(`✅ Worker: ${TAB_META[tabId]?.lbl} ${isOn?L('दिखेगा','shown'):L('हटाया','hidden')}`);
    }
  }catch(e){ toast('❌ Save failed: '+e.message); }
}

async function toggleManagerSalaryAccess(isOn){
  const track = document.getElementById('mgr_salary_track');
  const thumb = document.getElementById('mgr_salary_thumb');
  if(track) track.style.background = isOn ? '#22c55e' : 'rgba(255,255,255,.15)';
  if(thumb) thumb.style.left = isOn ? '23px' : '3px';
  try{
    await fbSet('settings/showSalaryToManager', isOn);
    if(!_cache.settings) _cache.settings = {};
    _cache.settings.showSalaryToManager = isOn;
    toast(isOn ? L('✅ Manager अब Salary देख सकेंगे','✅ Managers can view Salary now') : L('🔒 Manager से Salary छुपाई गई','🔒 Salary hidden from Managers'));
  }catch(e){ toast('❌ Save failed: '+e.message); }
}

// Open from admin panel
function openSecuritySettings(){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  openModal(`
    <div style="padding:20px 16px">
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:32px">🔐</div>
        <div style="font-size:17px;font-weight:900;color:#fff;margin-top:6px">Security Status</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center">
          <span style="font-size:18px">✅</span>
          <div><div style="font-size:12px;font-weight:800;color:#4ade80">Password SHA-256 Hashed</div>
          <div style="font-size:10px;color:var(--muted2)">Passwords never stored in plain text</div></div>
        </div>
        <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center">
          <span style="font-size:18px">✅</span>
          <div><div style="font-size:12px;font-weight:800;color:#4ade80">Rate Limiting Active</div>
          <div style="font-size:10px;color:var(--muted2)">5 failed attempts → 30s lockout</div></div>
        </div>
        <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center">
          <span style="font-size:18px">✅</span>
          <div><div style="font-size:12px;font-weight:800;color:#4ade80">Session Tamper Detection</div>
          <div style="font-size:10px;color:var(--muted2)">Console SESSION hack attempts blocked + logged</div></div>
        </div>
        <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center">
          <span style="font-size:18px">✅</span>
          <div><div style="font-size:12px;font-weight:800;color:#4ade80">45-Day Access Expiry</div>
          <div style="font-size:10px;color:var(--muted2)">Device approval auto-expires</div></div>
        </div>
        <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center">
          <span style="font-size:18px">⚠️</span>
          <div><div style="font-size:12px;font-weight:800;color:#fbbf24">Firebase Rules — Manual Step</div>
          <div style="font-size:10px;color:var(--muted2)">Firebase Console mein Rules set karo (see below)</div></div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,.4);border-radius:10px;padding:12px;margin-bottom:14px;font-family:monospace;font-size:10px;color:#4ade80;line-height:1.7;overflow-x:auto">
{<br>
&nbsp;"rules": {<br>
&nbsp;&nbsp;".read": "auth != null",<br>
&nbsp;&nbsp;".write": "auth != null"<br>
&nbsp;}<br>
}
      </div>
      <div style="font-size:11px;color:var(--muted2);margin-bottom:14px">Firebase Console → Realtime Database → Rules → Paste above → Publish</div>
      <button onclick="viewSecurityLog()" style="width:100%;padding:12px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:10px;color:#f87171;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:8px">🔍 Tampering Log देखें</button>
      <button onclick="closeModal()" style="width:100%;padding:13px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit">Close</button>
    </div>
  `);
}

async function viewSecurityLog(){
  closeModal();
  let logs = {};
  try{ logs = (await fbGet('securityLog')) || {}; }catch(e){}
  const entries = Object.values(logs).sort((a,b)=>b.time?.localeCompare(a.time)).slice(0,20);
  openModal(`
    <div style="padding:20px 16px">
      <div style="font-size:16px;font-weight:900;color:#f87171;margin-bottom:12px">🔍 Security Tampering Log</div>
      ${entries.length ? entries.map(e=>`
        <div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:8px;padding:8px 10px;margin-bottom:6px">
          <div style="font-size:11px;font-weight:800;color:#f87171">${e.type||'unknown'} — ${e.prop||''}</div>
          <div style="font-size:10px;color:var(--muted2)">${(e.time||'').substring(0,19).replace('T',' ')} | Value: ${e.value||''}</div>
        </div>`).join('') :
        '<div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">✅ Koi tampering log nahi — sab safe hai</div>'
      }
      <button onclick="closeModal()" style="width:100%;margin-top:12px;padding:12px;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:10px;color:var(--muted2);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Close</button>
    </div>
  `);
}

// ════════════════════════════════════════
// MODAL
// ════════════════════════════════════════
function openModal(html){
  document.getElementById('modalBody').innerHTML=`<div class="modal">${html}</div>`;
  document.getElementById('overlay').classList.add('open');
  try{ history.pushState({ mp:true, tab:_currentTab, kind:'modal' }, ''); }catch(e){}
  // Translate all modal text when English is active
  if(typeof _lang !== 'undefined' && _lang !== 'hi'){
    setTimeout(()=>{
      try{
        if(typeof _translateDOM === 'function') _translateDOM();
        // Also walk button labels / plain text leaves inside modal only
        document.querySelectorAll('#modalBody button, #modalBody .modal-title, #modalBody label, #modalBody span, #modalBody div').forEach(el=>{
          if(el.children && el.children.length) return;
          const orig = (el.textContent||'').trim();
          if(!orig || typeof t !== 'function') return;
          const tr = t(orig);
          if(tr !== orig) el.textContent = tr;
        });
        document.querySelectorAll('#modalBody input[placeholder], #modalBody textarea[placeholder]').forEach(el=>{
          const ph = el.getAttribute('placeholder')||'';
          const tr = t(ph);
          if(tr !== ph) el.setAttribute('placeholder', tr);
        });
      }catch(e){}
    }, 40);
  }
}
function closeModal(){
  try{ document.getElementById('overlay').classList.remove('open'); }catch(e){}
  try{ if(document.body.classList.contains('sb-builder-open')) _sbLockLandscape(false); }catch(e){}
}

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════

// ── i18n TRANSLATION DICTIONARY (Hindi → English) ──
// Used by toast(), confirmModal(), and other dynamic UI text
// Key = original Hindi string, Value = English translation
// Strings with ${...} placeholders use the same placeholders
const _i18n_HI_EN = {
  // ── Validation / Required field errors ──
  'Content नहीं मिला':                       'Content not found',
  'Plan चुनें':                              'Select Plan',
  'Title भरें':                              'Enter Title',
  'URL खाली है':                             'URL is empty',
  'अंतिम दिन चुनें':                         'Select end date',
  'इस कर्मचारी का कोई NCR नहीं है':         'No NCR for this employee',
  'कर्मचारी चुनें':                          'Select Employee',
  'कर्मचारी नहीं मिला':                     'Employee not found',
  'कारण चुनें':                              'Select Reason',
  'कोई बदलाव नहीं है':                       'No changes to save',
  'जल्द आ रहा है! ⏳':                       'Coming soon! ⏳',
  'नाम और link दोनों जरूरी हैं':            'Both name and link are required',
  'नाम और कोड जरूरी है':                    'Name and code required',
  'नाम भरें':                                'Enter Name',
  'पहले plan चुनें':                         'Select a plan first',
  'सभी जानकारी भरें':                       'Fill all details',
  'सही price डालें':                         'Enter valid price',
  'सही मोबाइल नंबर डालें':                  'Enter valid mobile number',

  // ── Warnings (⚠️) ──
  '⏳ ${secs} सेकंड बाद भेजें':              '⏳ Send after ${secs} seconds',
  '☑️ Select Mode ON — cells tap करें, फिर shift चुनें': '☑️ Select Mode ON — tap cells, then choose shift',
  '⚠️ 10MB से छोटी फोटो चुनें':              '⚠️ Pick photo smaller than 10MB',
  '⚠️ API Key खाली है':                      '⚠️ API Key is empty',
  '⚠️ App Validity: सिर्फ ${daysLeft} दिन बाकी! Profile tap करें।': '⚠️ App Validity: Only ${daysLeft} days left! Tap Profile.',
  '⚠️ C-Off के लिए Shift Date जरूरी है':     '⚠️ Shift Date required for C-Off',
  '⚠️ Display error — कृपया page refresh करें': '⚠️ Display error — please refresh the page',
  '⚠️ Duplicate Leave! इन dates पर पहले से application है: ': '⚠️ Duplicate Leave! Application already exists for these dates: ',
  '⚠️ EL Limit पार! Available: ':           '⚠️ EL Limit exceeded! Available: ',
  '⚠️ Leave override — D shift set। Save करने पर लागू होगा।': '⚠️ Leave override — D shift set. Will apply on Save.',
  '⚠️ Schedule Builder open नहीं है':       '⚠️ Schedule Builder not open',
  '⚠️ Title जरूरी है':                       '⚠️ Title required',
  '⚠️ अधिकतम 1 साल (366 दिन) का range चुनें': '⚠️ Maximum range is 1 year (366 days)',
  '⚠️ अधिकतम 5 photos':                     '⚠️ Maximum 5 photos',
  '⚠️ आज ${remaining} OTP और भेज सकते हैं':  '⚠️ ${remaining} OTPs left for today',
  '⚠️ आपकी App access ':                     '⚠️ Your App access ',
  '⚠️ कारण लिखना अनिवार्य है':              '⚠️ Reason is required',
  '⚠️ कृपया दोनों तारीखें चुनें':            '⚠️ Please pick both dates',
  '⚠️ कोई data नहीं':                        '⚠️ No data',
  '⚠️ जानकारी (Details) लिखें':              '⚠️ Enter details',
  '⚠️ पहले API Key डालें':                  '⚠️ Enter API Key first',
  '⚠️ पहले Schedule खोलें':                 '⚠️ Open Schedule first',
  '⚠️ पहले month select करें':               '⚠️ Select month first',
  '⚠️ फोटो 10MB से छोटी होनी चाहिए':         '⚠️ Photo must be smaller than 10MB',
  '⚠️ फोटो बहुत बड़ी है':                    '⚠️ Photo too large',
  '⚠️ फोटो बहुत बड़ी है — कृपया छोटी फोटो लें': '⚠️ Photo too large — please take smaller photo',
  '⚠️ महीना चुनें':                          '⚠️ Select month',
  '⚠️ विषय (Title) लिखें':                   '⚠️ Enter Title',
  '⚠️ शुरू की तारीख अंत से पहले होनी चाहिए': '⚠️ Start date must be before end date',
  '⚠️ सही 10 अंक का नंबर डालें':            '⚠️ Enter valid 10-digit number',

  // ── Success (✅) ──
  '✅ ${cells.length} cells में ${shiftVal} लगाया': '✅ ${shiftVal} applied to ${cells.length} cells',
  '✅ ${name} जोड़ा गया':                    '✅ ${name} added',
  '✅ ${savedEntries.length} बदलाव save हुए': '✅ ${savedEntries.length} changes saved',
  '✅ App install हो रही है...':             '✅ App installing...',
  '✅ App पहले से installed है! Home screen पर देखें।': '✅ App already installed! Check your Home screen.',
  '✅ Button जोड़ दिया गया!':                '✅ Button added!',
  '✅ Content add हो गया!':                  '✅ Content added!',
  '✅ Dedication save हो गई!':              '✅ Dedication saved!',
  '✅ Excel (CSV) file download हो गई!':     '✅ Excel (CSV) file downloaded!',
  '✅ Fingerprint login set up हो गया!':     '✅ Fingerprint login set up!',
  '✅ Login हो गया! Welcome ':               '✅ Logged in! Welcome ',
  '✅ Password set हो गया! अगली बार सीधे login करें': '✅ Password set! Next time login directly',
  '✅ Price update हो गई!':                  '✅ Price updated!',
  '✅ Request भेज दी! Manager approve करेंगे।': '✅ Request sent! Manager will approve.',
  '✅ Request भेज दी! Manager verify करेंगे।': '✅ Request sent! Manager will verify.',
  '✅ Request भेजी! WhatsApp से Admin को notification जाएगी।': '✅ Request sent! Admin will get a WhatsApp notification.',
  '✅ SMS Settings save हो गई':              '✅ SMS Settings saved',
  '✅ Schedule image download हो गई!':       '✅ Schedule image downloaded!',
  '✅ Schedule save हो गई!':                 '✅ Schedule saved!',
  '✅ Shift schedule upload हो गया!':        '✅ Shift schedule uploaded!',
  '✅ UPI ID Copy हो गई!':                   '✅ UPI ID copied!',
  '✅ अनलॉक हो गया':                         '✅ Unlocked',
  '✅ काम जोड़ा गया!':                       '✅ Task added!',
  '✅ क्रम & Group save हो गया! Schedule update हो रही है...': '✅ Order & Group saved! Updating schedule...',
  '✅ छुट्टी आवेदन भेज दिया गया!':            '✅ Leave application sent!',
  '✅ छुट्टी मंजूर! शेड्यूल अपडेट हो गया':   '✅ Leave approved! Schedule updated',
  '✅ जानकारी अपडेट हो गई':                  '✅ Information updated',
  '✅ डेटा initialize हो गया':               '✅ Data initialized',
  '✅ निर्देश सहेज लिए गए!':                 '✅ Instructions saved!',
  '✅ रिपोर्ट भेज दी गई!':                   '✅ Report sent!',

  // ── Errors (❌) ──
  '❌ 6-digit OTP डालें':                    '❌ Enter 6-digit OTP',
  '❌ Data नहीं मिला':                       '❌ Data not found',
  '❌ Data नहीं मिला — page refresh करें':   '❌ Data not found — please refresh',
  '❌ Department / Machine चुनें':           '❌ Select Department / Machine',
  '❌ Employee add नहीं हुआ: ':              '❌ Employee not added: ',
  '❌ Manager section की editing सिर्फ Admin कर सकता है': '❌ Only Admin can edit Manager section',
  '❌ Manager section में सिर्फ Admin जोड़ सकते हैं':     '❌ Only Admin can add to Manager section',
  '❌ Password कम से कम 5 characters होना चाहिए':         '❌ Password must be at least 5 characters',
  '❌ Permission नहीं है':                   '❌ No permission',
  '❌ Record नहीं मिला':                     '❌ Record not found',
  '❌ आज की OTP limit पूरी हो गई। कल try करें।': '❌ Today\'s OTP limit reached. Try tomorrow.',
  '❌ कम से कम एक section चुनें':           '❌ Select at least one section',
  '❌ काम का नाम डालें':                     '❌ Enter task name',
  '❌ कोई data नहीं है':                     '❌ No data available',
  '❌ कोई match नहीं':                       '❌ No match',
  '❌ गलत Key':                              '❌ Wrong Key',
  '❌ छुट्टी अस्वीकार की गई':                '❌ Leave rejected',
  '❌ रजिस्ट्रेशन अस्वीकार किया':            '❌ Registration rejected',
  '❌ सिर्फ Admin/Manager export कर सकते हैं': '❌ Only Admin/Manager can export',
  '❌ सिर्फ Admin/Manager कर सकते हैं':       '❌ Only Admin/Manager can do this',

  // ── Misc emojis ──
  '🎉 App install हो गई! Home screen पर देखें': '🎉 App installed! Check Home screen',
  '👆 Fingerprint से login हो गया!':         '👆 Logged in via Fingerprint!',
  '📝 Resignation request भेज दी गई!':       '📝 Resignation request sent!',
  '📢 Information पोस्ट हो गई!':            '📢 Information posted!',
  '📤 CSV export हो गई!':                    '📤 CSV exported!',
  '📲 ${waQueue.length} कर्मचारियों को WhatsApp भेजना है': '📲 WhatsApp to be sent to ${waQueue.length} employees',
  '📲 ${escHtml(waQueue[0].emp.name)} को WhatsApp भेजा': '📲 WhatsApp sent to ${escHtml(waQueue[0].emp.name)}',
  '📸 Image बन रही है... रुकिए':            '📸 Generating image... please wait',
  '🔄 Default order restore हो गया':         '🔄 Default order restored',
  '🔄 Original shift restore हो गई':         '🔄 Original shift restored',
  '🔄 Practice reset — फिर से शुरू करें!':  '🔄 Practice reset — start again!',
  '🔄 दोबारा Login करें':                    '🔄 Please login again',
  '🔄 नया version मिला — refresh हो रहा है...': '🔄 New version available — refreshing...',
  '🔑 Password हटाया गया — Employee Code से दोबारा verify करें': '🔑 Password removed — verify again with Employee Code',
  '🗑️ Button हटा दिया':                      '🗑️ Button removed',
  '🗑️ Content हटा दिया':                     '🗑️ Content removed',
  '🗑️ Delete हो गया':                        '🗑️ Deleted',
  '🗑️ Report delete हो गई':                  '🗑️ Report deleted',
  '🗑️ सभी बदलाव रद्द किए गए':                '🗑️ All changes cancelled',
  '🚪 Logout हो रहा है...':                  '🚪 Logging out...',

  // ── confirmModal titles ──
  '${n} बदलाव Unsaved हैं!':                 '${n} Unsaved changes!',
  '${uncheckedItems.length} Items Incomplete हैं': '${uncheckedItems.length} Items Incomplete',
  'Access Revoke करें?':                     'Revoke Access?',
  'Default पर वापस जाएं?':                   'Reset to Default?',
  'Device हटाएं?':                           'Remove Device?',
  'Report Delete करें?':                     'Delete Report?',
  'Resignation Reject करें?':                'Reject Resignation?',
  'काम Delete करें?':                        'Delete Task?',

  // ── Modal titles ──
  '${editId?\'✏️ काम Edit करें\':\'➕ नया काम जोड़ें\'}': '${editId?\'✏️ Edit Task\':\'➕ Add New Task\'}',
  '${name} का डेटा हमेशा के लिए हटाएं?':     'Delete ${name}\'s data permanently?',
  '${name} को टीम से हटाएं?':                'Remove ${name} from team?',
  '⏳ Access Extend करें':                   '⏳ Extend Access',
  '✏️ ${escHtml(e.name)} संपादित करें':               '✏️ Edit ${escHtml(e.name)}',
  '✏️ Shift चुनें':                          '✏️ Select Shift',
  '✏️ निर्देश संपादित करें':                  '✏️ Edit Instructions',
  '➕ Content Add करें':                      '➕ Add Content',
  '🌴 Leave का कारण':                        '🌴 Leave Reason',
  '🌴 छुट्टी आवेदन':                         '🌴 Leave Application',
  '👁️ Preview — Save करने से पहले देखें':    '👁️ Preview — Review before saving',
  '👤 नया कर्मचारी':                         '👤 New Employee',
  '📋 रिपोर्ट दर्ज करें':                    '📋 File Report',
  '📤 Excel से Shift Schedule अपलोड करें':   '📤 Upload Shift Schedule from Excel',
  '📤 Excel से Team Data Update करें':       '📤 Update Team Data from Excel',
  '📤 कर्मचारी List Upload करें':            '📤 Upload Employee List',
  '📲 App Install करें':                     '📲 Install App',
  '📲 iPhone पर Install करें':               '📲 Install on iPhone',
  '🔗 Quick Links Manage करें':              '🔗 Manage Quick Links',
  '🗓️ कस्टम तारीख सीमा':                     '🗓️ Custom Date Range',

    '30 दिन': '30 days',
  '3 महीने': '3 months',
  '6 महीने': '6 months',
  '1 साल': '1 year',
  'लागू करें': 'Apply',
// ── PHASE 3: Buttons (action labels) ──
  '&larr; वापस जाएं':                        '&larr; Back',
  '+ नई रिपोर्ट दर्ज करें':                  '+ File New Report',
  '+ नया अवकाश आवेदन':                       '+ New Leave Application',
  '+ नया कर्मचारी जोड़ें':                   '+ Add New Employee',
  '+ नियम जोड़ें':                           '+ Add Rule',
  'अभी नहीं → सीधे Login करें':             'Not now → Login directly',
  'आगे बढ़ें →':                             'Continue →',
  'ठीक है':                                  'OK',
  'बंद करें':                                'Close',
  'बाद में':                                 'Later',
  'रद्द':                                    'Cancel',
  'रद्द करें':                               'Cancel',
  'रहने दो — Leave रखो':                    'Keep — leave as is',
  'हाँ, हमेशा के लिए हटाएं':                'Yes, delete permanently',
  '← बदलें':                                 '← Change',
  '← वापस':                                  '← Back',
  '← वापस जाएं':                             '← Back',
  '↕️ क्रम बदलें':                          '↕️ Reorder',
  '↩️ वापस':                                 '↩️ Back',
  '⏳ Pending Approvals देखें':               '⏳ View Pending Approvals',
  '⚠️ फिर भी बदलें (Leave हटेगी)':           '⚠️ Change anyway (Leave will be removed)',
  '✅ Accept करें':                          '✅ Accept',
  '✅ Add करें':                              '✅ Add',
  '✅ Button जोड़ें':                         '✅ Add Button',
  '✅ C-Off Mark करें':                       '✅ Mark C-Off',
  '✅ Confirm करें — Firebase में Save':      '✅ Confirm — Save to Firebase',
  '✅ Extend करें':                           '✅ Extend',
  '✅ Leave Mark करें':                       '✅ Mark Leave',
  '✅ OD Mark करें':                          '✅ Mark OD',
  '✅ Password Save करें':                   '✅ Save Password',
  '✅ Verify करके Login Request भेजें':      '✅ Verify & Send Login Request',
  '✅ Verify करें':                          '✅ Verify',
  '✅ जोड़ें':                                '✅ Add',
  '✅ मंजूर':                                '✅ Approve',
  '✅ मंजूर करें':                           '✅ Approve',
  '✅ मैंने Pay कर दिया':                    '✅ I have paid',
  '✅ लागू करें':                             '✅ Apply',
  '✅ हाँ, हटाएं':                            '✅ Yes, Delete',
  '✏️ निर्देश संपादित करें':                  '✏️ Edit Instructions',
  '✓ सब पढ़ा':                              '✓ Mark All Read',
  '✕ रद्द करें':                             '✕ Cancel',
  '✕ रद्द करें · Cancel':                    '✕ Cancel',
  '❌ Reject करें':                          '❌ Reject',
  '❌ अस्वीकार':                              '❌ Reject',
  '➕ इस Module में Content Add करें':       '➕ Add Content to this Module',
  '➕ नया Content Add करें':                 '➕ Add New Content',
  '➕ नया Section जोड़ें':                   '➕ Add New Section',
  '🎉 Holiday काम किया':                     '🎉 Worked on Holiday',
  '👁 दिखाएं':                                '👁 Show',
  '👆 हाँ, Setup करें':                       '👆 Yes, Set up',
  '👍 बंद करें':                              '👍 Close',
  '💳 अभी Pay करें':                          '💳 Pay Now',
  '💾 Save करें':                             '💾 Save',
  '💾 Settings Save करें':                    '💾 Save Settings',
  '💾 सहेजें (Save)':                         '💾 Save',
  '💾 सेव करें':                              '💾 Save',
  '📋 Schedule खोलें':                       '📋 Open Schedule',
  '📋 Schedule बनाएं':                       '📋 Create Schedule',
  '📞 Manager को Call करें':                   '📞 Call Manager',
  '📢 पोस्ट करें':                           '📢 Post',
  '📤 Approval Request भेजें':                '📤 Send Approval Request',
  '📤 OTP भेजें':                            '📤 Send OTP',
  '📤 Resignation भेजें':                    '📤 Send Resignation',
  '📤 आवेदन भेजें':                          '📤 Send Application',
  '📤 रिपोर्ट भेजें':                        '📤 Send Report',
  '📲 Submit &rarr; WhatsApp से Admin को जाएगी': '📲 Submit &rarr; Will go to Admin via WhatsApp',
  '📷 Selfie लें / बदलें':                  '📷 Take / Change Selfie',
  '📸 Camera से खींचें':                     '📸 Take with Camera',
  '📸 Camera से लें':                         '📸 Take with Camera',
  '🔄 OTP दोबारा भेजें':                    '🔄 Resend OTP',
  '🔄 Original पर Reset करें':                '🔄 Reset to Original',
  '🔄 दूसरे Account से Login करें':          '🔄 Login with Different Account',
  '🔄 दोबारा Practice करें':                 '🔄 Practice Again',
  '🔍 Tampering Log देखें':                  '🔍 View Tampering Log',
  '🔐 Login करें':                            '🔐 Login',
  '🔑 Password भूल गए? Employee Code से दोबारा verify करें': '🔑 Forgot Password? Verify again with Employee Code',
  '🔓 Login करें':                            '🔓 Login',
  '🔓 अनलॉक करें':                            '🔓 Unlock',
  '🔔 W-Off पर बुलाया':                      '🔔 Called on W-Off',
  '🖨️ प्रिंट करें':                           '🖨️ Print',
  '🖨️ प्रिंट':                                '🖨️ Print',
  '🖼️ Gallery से चुनें':                     '🖼️ Pick from Gallery',
  '🗓️ कस्टम तारीख चुनें':                    '🗓️ Pick Custom Date',
  '🤖 Auto बनाएं':                            '🤖 Auto Generate',
  '🧪 Test SMS भेजें':                        '🧪 Send Test SMS',

  // ── PHASE 3: Static labels (≤30 chars) ──
  '(31 दिन की सीमा)':                        '(31 day limit)',
  '(आप)':                                    '(You)',
  'Access validity समाप्त हो गई':                       '45 days completed',
  '6-digit OTP डालें *':                     'Enter 6-digit OTP *',
  'Admin contact करें':                      'Contact Admin',
  'Admin जल्द add करेंगे':                  'Admin will add soon',
  'Admin हैं?':                               'Are you Admin?',
  'App Install करें':                         'Install App',
  'Approval का इंतजार है':                  'Waiting for Approval',
  'Approved Leave है!':                       'Approved Leave exists!',
  'Department / Machine का नाम':              'Department / Machine name',
  'Duration (जैसे: 12 min)':                  'Duration (e.g. 12 min)',
  'Employee Code डालें':                     'Enter Employee Code',
  'Excel Expert लोड हो रहा है...':           'Loading Excel Expert...',
  'File चुनें या यहाँ Drop करें':            'Pick File or Drop here',
  'Fingerprint Login Setup करें?':            'Set up Fingerprint Login?',
  'MetCost Pro लोड हो रहा है...':            'Loading MetCost Pro...',
  'Month चुनें':                             'Select Month',
  'Monthly Salary देख सकें':                 'Can view Monthly Salary',
  'PASSWORD डालें *':                        'Enter PASSWORD *',
  'PASSWORD दोबारा डालें *':                 'Re-enter PASSWORD *',
  'Password बनाएं':                          'Create Password',
  'Password से login करें →':                'Login with Password →',
  'Price Edit करें':                          'Edit Price',
  'Print — Section चुनें':                  'Print — Select Section',
  'Resignation / त्यागपत्र':                 'Resignation',
  'Resignation का कारण':                     'Reason for Resignation',
  'SMS Notifications चालू रखें':            'Keep SMS Notifications on',
  'Seniors (एक लाइन में एक नाम)':           'Seniors (one name per line)',
  'SupSkill लोड हो रहा है...':               'Loading SupSkill...',
  'Test के लिए मोबाइल नंबर':                 'Mobile number for Test',
  'Time Study लोड हो रहा है...':             'Loading Time Study...',
  'Title (नाम)':                              'Title (Name)',
  'Update होंगे':                             'Will be updated',
  'Validity बढ़ाएं':                         'Extend Validity',
  'Verify करें':                              'Verify',
  'Video जल्द upload होगा':                  'Video will be uploaded soon',
  'अंत की तारीख (Date B)':                  'End Date (Date B)',
  'अगले 15 दिन':                             'Next 15 days',
  'अनुमोदन पेंडिंग':                         'Approval Pending',
  'अपना fingerprint लगाएं':                  'Place your fingerprint',
  'अपना कर्मचारी कोड type करें':            'Type your employee code',
  'अभी कोई button नहीं है':                 'No buttons yet',
  'अवकाश (Leaves)':                          'Leaves',
  'आज':                                      'Today',
  'आज का रोस्टर':                            "Today's Roster",
  'आज की स्थिति — सेक्शन वार':              "Today's Status — Section Wise",
  'आप':                                      'You',
  'आपकी Progress':                            'Your Progress',
  'ऊपर Month चुनें':                         'Select Month above',
  'कर्मचारी':                                'Employee',
  'कर्मचारी का नाम':                         'Employee Name',
  'कर्मचारी क्रम व Group बदलें':            'Reorder Employees & Groups',
  'कल':                                      'Yesterday',
  'काम का नाम (Title) *':                   'Task Name (Title) *',
  'कारण (Reason)':                            'Reason',
  'कारण * (अनिवार्य)':                       'Reason * (required)',
  'कारण / Reason *':                          'Reason *',
  'कारण लिखें':                              'Write reason',
  'कार्य सूची — Task List':                  'Task List',
  'कितने दिन के लिए?':                       'For how many days?',
  'किसके लिए (Assign To)':                   'Assign To',
  'किसी भी device से login करें':            'Login from any device',
  'कुछ समय बाद दोबारा try करें।':            'Please try again later.',
  'कुल':                                     'Total',
  'कुल काम':                                 'Total Tasks',
  'कोई OD रिकॉर्ड नहीं':                    'No OD records',
  'कोई device request नहीं':                  'No device requests',
  'कोई notification नहीं':                    'No notifications',
  'कोई कर्मचारी नहीं मिला':                 'No employees found',
  'कोई छुट्टी आवेदन नहीं':                   'No leave applications',
  'कोई छुट्टी नहीं':                         'No leaves',
  'कोई छुट्टी पेंडिंग नहीं':                'No leaves pending',
  'कोई नया रजिस्ट्रेशन नहीं':                'No new registrations',
  'कोई रिपोर्ट नहीं':                        'No reports',
  'कोई रिपोर्ट पेंडिंग नहीं':                'No reports pending',
  'छुट्टी का प्रकार':                        'Leave Type',
  'जल्द आ रहा है!':                          'Coming soon!',
  'ज़िम्मेदारी':                              'Responsibility',
  'जाने का कारण':                             'Reason for leaving',
  'जो कर्मचारी टीम छोड़ चुके हैं':           'Employees who left the team',
  'टीम':                                     'Team',
  'तक तारीख':                                'To Date',
  'तारीख':                                   'Date',
  'नई कीमत (₹)':                             'New Price (₹)',
  'नए कर्मचारी':                             'New Employees',
  'नया Device Detected':                      'New Device Detected',
  'नया Device Login Request':                 'New Device Login Request',
  'नाम':                                     'Name',
  'पूरा शेड्यूल देखें →':                    'View Full Schedule →',
  'प्रोफाइल नहीं मिली':                       'Profile not found',
  'बाकी है':                                  'Remaining',
  'भुगतान राशि':                             'Payment Amount',
  'मशीन':                                    'Machine',
  'महत्वपूर्ण निर्देश':                      'Important Instructions',
  'महीना चुनें':                             'Select Month',
  'विभाग': 'Department',
  'मेरी छुट्टियाँ':                          'My Leaves',
  'मेरी शिफ्ट':                               'My Shift',
  'यह वापस नहीं होगा!':                      'This cannot be undone!',
  'यहाँ Excel फ़ाइल छोड़ें':                 'Drop Excel file here',
  'रिपोर्ट':                                  'Report',
  'रिपोर्ट का प्रकार':                       'Report Type',
  'रिपोर्ट किसके बारे में':                  'Report About Whom',
  'लोड नहीं हो सका':                          'Could not load',
  'वापसी पर स्वागत है!':                     'Welcome Back!',
  'विवरण (Description)':                      'Description',
  'विवरण (Details)':                          'Details',
  'विवरण / टिप्पणी (Optional)':              'Description / Note (Optional)',
  'शिफ्ट में कमी':                            'Shift Shortage',
  'शुरू की तारीख (Date A)':                  'Start Date (Date A)',
  'संपर्क सूत्र':                             'Contact',
  'सब Select करें':                          'Select All',
  'सभी':                                     'All',
  'सभी sessions साफ़ करें':                  'Clear all sessions',
  'सीखें & Grow करें':                       'Learn & Grow',
  'से तारीख':                                'From Date',
  'सेक्शन':                                  'Section',
  'स्थिति':                                  'Status',
  'हो गया':                                   'Done',
  '⏳ Access Extend करें':                    '⏳ Extend Access',
  '⏳ जल्द आ रहा है':                         '⏳ Coming Soon',
  '⏳ प्रतीक्षा में':                         '⏳ Waiting',
  '⏳ फ़ाइल पढ़ रहे हैं...':                 '⏳ Reading file...',
  '⏳ फ़ाइल पढ़ी जा रही है...':              '⏳ Reading file...',
  '⏳ बाकी':                                  '⏳ Remaining',
  '⏳ लोड हो रहा है...':                      '⏳ Loading...',
  '⚠️ Salary column नहीं मिला':              '⚠️ Salary column not found',
  '⚠️ कारण नहीं दिया गया':                  '⚠️ No reason given',
  '⚠️ कोई Selfie नहीं':                       '⚠️ No Selfie',
  '⚠️ कोई उपलब्ध Supervisor नहीं':            '⚠️ No Supervisor available',
  '⚠️ यह कार्रवाई अपरिवर्तनीय है':           '⚠️ This action is irreversible',
  '⚡ चेतावनी':                              '⚡ Warning',
  '✅ दर्ज':                                  '✅ Filed',
  '✅ पूरा':                                  '✅ Complete',
  '✓ FREE — सभी के लिए':                     '✓ FREE — for everyone',
  '❌ फ़ाइल में डेटा नहीं मिला':              '❌ No data found in file',
  '❤️ Family — सबसे बड़ा Support':            '❤️ Family — biggest Support',
  '➕ Content Add करें':                      '➕ Add Content',
  '➕ नया Button जोड़ें':                    '➕ Add New Button',
  '🌟 प्रशंसा':                              '🌟 Praise',
  '🌴 Leave का कारण':                         '🌴 Leave Reason',
  '🌴 छुट्टी आवेदन':                          '🌴 Leave Application',
  '🎉 कोई भी Left नहीं हुआ':                 '🎉 Nobody has left',
  '🎬 Video URL set नहीं है':                 '🎬 Video URL not set',
  '👤 नए रजिस्ट्रेशन':                        '👤 New Registrations',
  '👤 नया कर्मचारी':                          '👤 New Employee',
  '💳 UPI से Pay करें':                       '💳 Pay via UPI',
  '📅 तारीख':                                 '📅 Date',
  '📅 मेरा शिफ्ट कैलेंडर':                   '📅 My Shift Calendar',
  '📋 कारण':                                  '📋 Reason',
  '📋 पूरी जानकारी (Details)':                '📋 Full Details',
  '📋 रिपोर्ट':                              '📋 Report',
  '📋 रिपोर्ट दर्ज करें':                    '📋 File Report',
  '📌 विषय (Title)':                          '📌 Title',
  '📝 C-Off कारण':                           '📝 C-Off Reason',
  '📝 कारण (Reason)':                         '📝 Reason',
  '📝 कोई कारण उपलब्ध नहीं है':              '📝 No reason available',
  '📝 बदलाव pending हैं':                    '📝 Changes pending',
  '📞 संपर्क सूत्र':                          '📞 Contact',
  '📢 महत्वपूर्ण जानकारी':                   '📢 Important Information',
  '📤 कर्मचारी List Upload करें':            '📤 Upload Employee List',
  '📱 नए Device Requests':                    '📱 New Device Requests',
  '📱 मोबाइल नंबर':                          '📱 Mobile Number',
  '📱 मोबाइल नंबर (SMS के लिए)':             '📱 Mobile Number (for SMS)',
  '📵 अनुपस्थित':                            '📵 Absent',
  '📷 Photos जोड़ें (Optional)':              '📷 Add Photos (Optional)',
  '🔄 OD रिकॉर्ड':                            '🔄 OD Records',
  '🔄 लाइव सिंक · अंतिम अपडेट:':              '🔄 Live Sync · Last Update:',
  '🔄 शिफ्ट पुनर्आवंटन':                     '🔄 Shift Reallocation',
  '🔥 आज':                                    '🔥 Today',
  '🙏 Seniors — जिनसे सीखा':                 '🙏 Seniors — who taught me',
  '🤝 Colleagues — साथ काम किया':            '🤝 Colleagues — worked together',

  // ── PHASE 3: Placeholders ──
  '10 अंक का नंबर':                          '10-digit number',
  'Button का नाम (जैसे: Safety Video)':       'Button name (e.g. Safety Video)',
  'Leave का कारण लिखें...':                  'Write leave reason...',
  'UNLOCK KEY डालें':                        'Enter UNLOCK KEY',
  'अपना Fast2SMS API Key यहाँ डालें':       'Enter your Fast2SMS API Key here',
  'अपना remark लिखें...':                    'Write your remark...',
  'इस content के बारे में...':                'About this content...',
  'काम का विवरण...':                         'Task description...',
  'कारण लिखें...':                            'Write reason...',
  'कोई अतिरिक्त जानकारी...':                  'Any additional info...',
  'छुट्टी का कारण लिखें... (अनिवार्य)':      'Write leave reason... (required)',
  'जैसे: M-1 pump check करना है':            'e.g. M-1 pump needs checking',
  'e.g. Safety Training':         'e.g. Metalliser Safety Training',
  'जैसे: कल से नई Shift Timing':             'e.g. New Shift Timing from tomorrow',
  'नाम या कोड से खोजें...':                  'Search by name or code...',
  'नियम लिखें...':                            'Write rule...',
  'पूरा नाम (Full Name)':                    'Full Name',
  'पूरी जानकारी लिखें... (मशीन नंबर, क्या हुआ, कब हुआ)': 'Write full details... (Machine no., what happened, when)',
  'मोबाइल नंबर (10 digits)':                 'Mobile number (10 digits)',
  'या कारण लिखें...':                         'Or write reason...',
  'सभी जरूरी details यहाँ लिखें...':          'Write all required details here...',
  '📌 Section का नाम':                        '📌 Section Name',
  // ── Schedule / Print / Shift settings (UI polish) ──
  '📋 Schedule बनाएं': '📋 Create Schedule',
  '🖨️ प्रिंट': '🖨️ Print',
  '🖨️ प्रिंट करें': '🖨️ Print',
  'प्रिंट करें': 'Print',
  'Print — Section चुनें': 'Print — Choose Sections',
  'जो sections print करनी हों उन्हें tick करें': 'Tick the sections you want to print',
  '✅ सभी': '✅ All',
  '☐ कोई नहीं': '☐ None',
  'रद्द': 'Cancel',
  'रद्द करें': 'Cancel',
  '✕ रद्द करें': '✕ Cancel',
  '✕ रद्द करें · Cancel': '✕ Cancel',
  '💾 Save करें': '💾 Save',
  '✅ Save करें': '✅ Save',
  '📝 बदलाव pending हैं': '📝 Changes pending',
  'बदलाव pending हैं': 'Changes pending',
  'कस्टम तारीख चुनें': 'Pick Custom Date',
  '🗓️ कस्टम तारीख चुनें': '🗓️ Pick Custom Date',
  '↕️ क्रम बदलें': '↕️ Reorder',
  'क्रम बदलें': 'Reorder',
  'साप्ताहिक छुट्टी': 'Weekly Off',
  'लीव': 'Leave',
  'जनरल': 'General',
  'अवकाश (Leaves)': 'Leaves',
  '+ नया अवकाश आवेदन': '+ New Leave Application',
  '⏳ प्रतीक्षा में': '⏳ Pending',
  '✅ मंजूर': '✅ Approved',
  '❌ अस्वीकार': '❌ Rejected',
  'टीम': 'Team',
  'नाम या कोड से खोजें...': 'Search by name or code...',
  'जो कर्मचारी टीम छोड़ चुके हैं': 'Employees who have left the team',
  'ऊपर Month चुनें': 'Select Month above',
  'विभाग': 'Department',
  'संपर्क करें': 'Contact',
  'UNLOCK KEY डालें': 'Enter UNLOCK KEY',
  '🔓 अनलॉक करें': '🔓 Unlock',
  '📲 App Install करें / Download App': '📲 Install / Download App',
  'App Install करें': 'Install App',
  '10 अंकों का Mobile': '10-digit Mobile',
  'Admin हैं? ': 'Admin? ',
  'OTP डालें': 'Enter OTP',
  'OTP भेजा गया': 'OTP sent',
  'वापस': 'Back',
  '← वापस': '← Back',
  '&larr; वापस': '← Back',
  'आप कौन हैं?': 'Who are you?',
  'अपनी भूमिका चुनें': 'Choose your role',
  'मैं एक Manager हूं — अपनी team बनाना चाहता/चाहती हूं': 'I am a Manager — I want to create my team',
  'मैं एक Member हूं — अपने Manager की team में शामिल हूं': 'I am a Member — I belong to my Manager’s team',
  'VKS Tech Admin verify करेगा': 'VKS Tech Admin will verify',
  'पूरा नाम *': 'Full Name *',
  'आपका नाम': 'Your name',
  'Company का नाम *': 'Company Name *',
  'जैसे: ABC Industries': 'e.g. ABC Industries',
  '-- चुनें --': '-- Select --',
  'Shift चुनें': 'Select Shift',
  '✏️ Shift चुनें': '✏️ Select Shift',
  'वर्तमान:': 'Current:',
  '⚙️ Shift & Machine Settings': '⚙️ Shift & Machine Settings',
  '⏰ Shifts — Auto Schedule के लिए': '⏰ Shifts — for Auto Schedule',
  '✅ टिक = Auto बनाएं में ये shifts rotate होंगी (जैसे सिर्फ D+N, या सिर्फ A+B+C)।': '✅ Tick = these shifts will rotate in Auto Generate (e.g. only D+N, or only A+B+C).',
  'सभी codes (D/N/A/B/C) schedule पर manually select हो सकते हैं — timing यहाँ से आती है।': 'All codes (D/N/A/B/C) can still be selected manually on the schedule — timings come from here.',
  '📉 Minimum Staff (संख्या कम होने पर highlight)': '📉 Minimum Staff (highlight when count is low)',
  'दिन की गिनती इस संख्या से कम हो तो summary में लाल/⚠️ दिखेगा।': 'If the day count is below this number, the summary shows red / ⚠️.',
  'Section min': 'Section min',
  'Slitter min': 'Slitter min',
  'Supervisor min': 'Supervisor min',
  '🏭 Machines / Sections': '🏭 Machines / Sections',
  '✂️ Slitter Machines': '✂️ Slitter Machines',
  '+ Section जोड़ें': '+ Add Metalliser',
  '+ SLitter जोड़ें': '+ Add Slitter',
  '+ Slitter जोड़ें': '+ Add Slitter',
  '🤖 Auto बनाएं': '🤖 Auto Generate',
  '← बदलें': '← Change',
  'बदलें': 'Change',
  'Drag करके Cells चुनें · Double-tap करके Copy/Select करें': 'Drag to select cells · Double-tap to Copy/Select',
  'Cell tap करें: D → N → O → L → G → CO → ½ → Ab → साफ': 'Cell tap: D → N → O → L → G → CO → ½ → Ab → clear',
  'कर्मचारी': 'Employee',
  'छुट्टी': 'Off',
  'Save करें।': 'Save.',
  '✅ Shift Settings save हो गईं': '✅ Shift Settings saved',
  '⚠️ कम से कम एक Machine जोड़ें': '⚠️ Add at least one Machine',
  '⚠️ सभी Shift की Code और नाम भरें': '⚠️ Fill code and name for all shifts',
  '⚠️ Auto के लिए कम से कम 1 shift tick करें (D/N या A/B/C)': '⚠️ Tick at least 1 shift for Auto (D/N or A/B/C)',
  '❌ कम से कम एक section चुनें': '❌ Select at least one section',
  '❌ Print library load नहीं हुई — page refresh करके फिर try करें': '❌ Print library failed to load — refresh the page and try again',
  '📸 Image बन रही है... रुकिए': '📸 Creating image… please wait',
  '✅ Schedule image download हो गई!': '✅ Schedule image downloaded!',
  'Company select करें पहले': 'Select a Company first',
  '❌ Company select करें पहले': '❌ Select a Company first',
  '⚠️ पहले header से एक Company चुनें': '⚠️ Select a Company from the header first',
  'आपकी अपनी Team के लिए': 'For your own team',
  '⏳ Loading...': '⏳ Loading...',
  'नया PASSWORD (कम से कम 5 अंक) *': 'New PASSWORD (min 5 characters) *',
  'Password कम से कम 5 characters होना चाहिए': 'Password must be at least 5 characters',
  '❌ Password कम से कम 5 characters होना चाहिए': '❌ Password must be at least 5 characters',
  'क्रम & Group save हो गया! Schedule update हो रही है...': 'Order & group saved! Updating schedule…',
  '✅ क्रम & Group save हो गया! Schedule update हो रही है...': '✅ Order & group saved! Updating schedule…',
  '🔄 Default order restore हो गया': '🔄 Default order restored',
  'Custom order और role assignments हट जाएंगे।': 'Custom order and role assignments will be removed.',
  'यह action undo नहीं होगी।': 'This action cannot be undone.',
  '🔄 हाँ, Reset करें': '🔄 Yes, Reset',
  'कर्मचारी क्रम व Group बदलें': 'Reorder employees & change groups',
  '▲▼ से क्रम बदलें • Dropdown से Group बदलें • फिर Save करें': 'Use ▲▼ to reorder · Dropdown to change group · then Save',
  'MANAGERS & उनकी TEAMS (Mobile Registration)': 'MANAGERS & THEIR TEAMS (Mobile Registration)',
  'कर्मचारी (Employee Code System)': 'Employees (Employee Code System)',
  'सीखें': 'Learn',
  'सीखें — Learn Now': 'Learn Now',
  'Learn & Grow': 'Learn & Grow',
  'दिन शिफ्ट': 'Day Shift',
  'रात शिफ्ट': 'Night Shift',
  'A Shift': 'A Shift',
  'B Shift': 'B Shift',
  'C Shift': 'C Shift',
  'Day Shift': 'Day Shift',
  'Night Shift': 'Night Shift',
  'साप्ताहिक छुट्टी:': 'Weekly Off:',
  'मशीन:': 'Machine:',
  'बाद में': 'Later',
  'बंद करें': 'Close',
  'Close': 'Close',
  'Koi tampering log nahi — sab safe hai': 'No tampering log — all safe',
  '✅ Koi tampering log nahi — sab safe hai': '✅ No tampering log — all safe',
  'डेटा initialize हो गया': 'Data initialized',
  '✅ डेटा initialize हो गया': '✅ Data initialized',
  '🌐 सभी Companies दिख रही हैं': '🌐 Showing all companies',
  '🏢 अब सिर्फ इस Company का data दिख रहा है': '🏢 Showing data for this company only',
  '⚠️ पहले Schedule खोलें': '⚠️ Open the Schedule first',
  '✅ ${generated} कर्मचारियों की Schedule auto-generate हो गई!': '✅ Auto-generated schedule for ${generated} employees!',
  'approved leave दिन सुरक्षित रहे': 'approved leave days protected',
  'Save करें': 'Save',
  'नाम': 'Name',
  'कोड': 'Code',
  'to': 'to',
  'अवर्गीकृत': 'Unassigned',
  'Met (All)': 'Met (All)',
  'Slit (सभी Slitter)': 'Slit (All Slitter)',
  'NCR रिपोर्ट': 'NCR Report',
  'अनुपस्थिति': 'Absence',
  'अनुपस्थित': 'Absentees',
  'W-Off पर': 'on W off',
  'ड्यूटी पर': 'On duty',
  'अवकाश पर': 'On leave',
  'चेतावनी / अनुशासनहीनता': 'Warning / Indiscipline',
  'प्रशंसा': 'Appreciation',
  'Imp. Information': 'Imp. Information',
  'सुपरवाइज़र': 'Supervisor',
  'मैनेजर': 'Manager',
  'मेटलाइज़र-1': 'Metalliser-1',
  'मेटलाइज़र-2': 'Metalliser-2',
  'स्लिटर-1': 'Slitter-1',
  'स्लिटर-2': 'Slitter-2',
  'दिन (7AM-7PM)': 'Day (7AM-7PM)',
  'रात (7PM-7AM)': 'Night (7PM-7AM)',
  'Current View (screen filter)': 'Current View (screen filter)',
  '📋 Current View (screen filter)': '📋 Current View (screen filter)',
  '📋 CURRENT VIEW': '📋 CURRENT VIEW',
  '📋 ALL EMPLOYEES': '📋 ALL EMPLOYEES',
  'All Employees': 'All Employees',
  '📋 All Employees': '📋 All Employees',
  'Shift Trends': 'Shift Trends',
  'SHIFT TRENDS': 'SHIFT TRENDS',
  'Live Sync · Last Update:': 'Live Sync · Last Update:',
  'Pick Custom Date': 'Pick Custom Date',
  'Pending': 'Pending',
  'To-Do': 'To-Do',
  'Reports': 'Reports',
  'Home': 'Home',
  'Schedule': 'Schedule',
  'Leave': 'Leave',
  'Team': 'Team',

  // ── Schedule Builder / mixed labels (EN mode) ──
  'सभी Section': 'All Sections',
  'महीना चुनें': 'Select Month',
  'तारीख रेंज': 'Date Range',
  '📅 पूरा महीना': '📅 Full Month',
  '🗓️ कस्टम तारीख': '🗓️ Custom Dates',
  'से (From)': 'From',
  'तक (To)': 'To',
  'उदा. 11 से 20 — केवल ये दिन Schedule में दिखेंगे': 'e.g. 11 to 20 — only these days will appear in the schedule',
  'कर्मचारी': 'Employee',
  'नए कर्मचारी': 'New employees',
  'कुल': 'Total',
  'नाम और कोड जरूरी है': 'Name and code are required',
  '❌ Manager section में सिर्फ Admin जोड़ सकते हैं': '❌ Only Admin can add Manager-section employees',
  'जोड़ा गया': 'added',
  '📱 यह मोबाइल नंबर पहले से दूसरे team के member के पास है': '📱 This mobile number already belongs to a member of another team',
  '📱 यह मोबाइल नंबर पहले से registered है': '📱 This mobile number is already registered',
  '🚫 Duplicate mobile — other team': '🚫 Duplicate mobile — other team',
  '🚫 Duplicate mobile': '🚫 Duplicate mobile',
  'कर्मचारी List Upload करें': 'Upload Employee List',
  'Preview — Save करने से पहले देखें': 'Preview — review before Save',
  'Confirm करें — Firebase में Save': 'Confirm — Save to Firebase',
  'वापस': 'Back',
  'row(s) skip हुई': 'row(s) skipped',
  'कर्मचारी save हो गए!': 'employees saved!',
  'यह मोबाइल नंबर दूसरे team में पहले से है': 'This mobile is already used in another team',
  'File में Duplicate mobile': 'Duplicate mobile in file',

};

/**
 * t(str) — translate a string based on current language.
 * Supports all Indian languages via _i18n_ML + classic _i18n_HI_EN fallback.
 * Fallback chain: selected lang → en → original (Hindi).
 */

/**
 * L(hi, en) — multi-language UI string helper (replaces isEn ? en : hi).
 * Uses mlT/t when available so gu/ta/kn/ar/de/... all work; never leaves Hindi when lang≠hi if EN exists.
 */

/** BCP47 locale for Intl APIs from app _lang */

/** Load script-specific webfont only when needed (saves bandwidth on shop networks) */
function loadLangFont(lang){
  lang = lang || (typeof _lang!=='undefined'?_lang:'hi');
  var map = {
    ar: 'Noto+Sans+Arabic:wght@400;700',
    ur: 'Noto+Sans+Arabic:wght@400;700',
    gu: 'Noto+Sans+Gujarati:wght@400;700',
    ta: 'Noto+Sans+Tamil:wght@400;700',
    te: 'Noto+Sans+Telugu:wght@400;700',
    kn: 'Noto+Sans+Kannada:wght@400;700',
    bn: 'Noto+Sans+Bengali:wght@400;700',
    or: 'Noto+Sans+Oriya:wght@400;700',
    mr: 'Noto+Sans+Devanagari:wght@400;700',
    ml: 'Noto+Sans+Malayalam:wght@400;700',
    pa: 'Noto+Sans+Gurmukhi:wght@400;700',
    zh: 'Noto+Sans+SC:wght@400;700',
    th: 'Noto+Sans+Thai:wght@400;700'
  };
  var fam = map[lang];
  var link = document.getElementById('mp-fonts-lang');
  if(!link){
    link = document.createElement('link');
    link.id = 'mp-fonts-lang';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if(!fam){
    link.removeAttribute('href');
    return;
  }
  var href = 'https://fonts.googleapis.com/css2?family='+fam+'&display=swap';
  if(link.getAttribute('href') !== href) link.setAttribute('href', href);
}

function mpLocale(lang){
  lang = lang || (typeof _lang !== 'undefined' ? _lang : 'en');
  var map = {hi:'hi-IN',en:'en-IN',gu:'gu-IN',ta:'ta-IN',te:'te-IN',kn:'kn-IN',bn:'bn-IN',or:'or-IN',
    ar:'ar-AE',ur:'ur-PK',zh:'zh-CN',de:'de-DE',it:'it-IT',es:'es-ES',tr:'tr-TR',pt:'pt-BR',th:'th-TH',id:'id-ID',vi:'vi-VN'};
  return map[lang] || 'en-IN';
}
/** Format date for current language */
function mpFormatDate(d, opts){
  try{
    var dt = (d instanceof Date) ? d : new Date(d);
    if(isNaN(dt.getTime())) return String(d||'');
    return dt.toLocaleDateString(mpLocale(), opts || {day:'2-digit',month:'short',year:'numeric'});
  }catch(e){ return String(d||''); }
}
/** Simple plural: mpPlural(n, oneHi, manyHi, oneEn, manyEn) */
function mpPlural(n, oneHi, manyHi, oneEn, manyEn){
  n = Number(n)||0;
  var hi = (n === 1) ? oneHi : manyHi;
  var en = (n === 1) ? oneEn : manyEn;
  if(typeof L === 'function') return L(hi, en).replace('{n}', String(n));
  var lang = (typeof _lang !== 'undefined') ? _lang : 'hi';
  return (lang === 'hi' ? hi : en).replace('{n}', String(n));
}
/** Export i18n table as JSON for translators */
function mpExportI18n(){
  try{
    var data = {lang: _lang, country: _country, supported: window._i18n_SUPPORTED||[], sample: {}};
    if(window._i18n_ML){
      var keys = Object.keys(window._i18n_ML).slice(0, 50);
      keys.forEach(function(k){ data.sample[k] = window._i18n_ML[k]; });
    }
    var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manpower-i18n-export.json';
    a.click();
    if(typeof toast==='function') toast('📥 i18n export downloaded');
  }catch(e){ console.warn(e); }
}
function mpToggleI18nDebug(){
  try{
    var on = localStorage.getItem('mp_i18n_debug') === '1';
    localStorage.setItem('mp_i18n_debug', on ? '0' : '1');
    if(typeof toast==='function') toast(on ? 'i18n debug OFF' : 'i18n debug ON — missing keys highlighted');
    if(typeof applyLang==='function') applyLang();
  }catch(e){}
}


/** Time-of-day greeting in current (or given) language — feels personal */
function mpGreeting(lang){
  lang = lang || (typeof _lang!=='undefined'?_lang:'hi');
  var h = new Date().getHours();
  var map = {
    hi: h<12?'सुप्रभात':h<17?'नमस्कार':'शुभ संध्या',
    en: h<12?'Good morning':h<17?'Good afternoon':'Good evening',
    gu: h<12?'સુપ્રભાત':h<17?'નમસ્કાર':'શુભ સાંજ',
    kn: h<12?'ಶುಭೋದಯ':h<17?'ನಮಸ್ಕಾರ':'ಶುಭ ಸಂಜೆ',
    ta: h<12?'காலை வணக்கம்':h<17?'வணக்கம்':'மாலை வணக்கம்',
    te: h<12?'శుభోదయం':h<17?'నమస్కారం':'శుభ సాయంత్రం',
    bn: h<12?'সুপ্রভাত':h<17?'নমস্কার':'শুভ সন্ধ্যা',
    or: h<12?'ଶୁଭ ସକାଳ':h<17?'ନମସ୍କାର':'ଶୁଭ ସନ୍ଧ୍ୟା',
    ar: h<12?'صباح الخير':h<17?'مرحباً':'مساء الخير',
    ur: h<12?'صبح بخیر':h<17?'السلام علیکم':'شام بخیر',
    zh: h<12?'早上好':h<17?'你好':'晚上好',
    de: h<12?'Guten Morgen':h<17?'Guten Tag':'Guten Abend',
    es: h<12?'Buenos días':h<17?'Buenas tardes':'Buenas noches',
    tr: h<12?'Günaydın':h<17?'Merhaba':'İyi akşamlar',
    pt: h<12?'Bom dia':h<17?'Boa tarde':'Boa noite',
    th: h<12?'อรุณสวัสดิ์':h<17?'สวัสดี':'สวัสดีตอนเย็น',
    id: h<12?'Selamat pagi':h<17?'Selamat siang':'Selamat malam',
    vi: h<12?'Chào buổi sáng':h<17?'Xin chào':'Chào buổi tối',
    it: h<12?'Buongiorno':h<17?'Buon pomeriggio':'Buonasera'
  };
  return map[lang] || map.en;
}

function L(hi, en){
  if(typeof _lang === 'undefined' || _lang === 'hi') return hi;
  if(typeof mlT === 'function'){
    var v = mlT(hi, _lang);
    if(v && v !== hi) return v;
  }
  if(typeof t === 'function'){
    var v2 = t(hi);
    if(v2 && v2 !== hi) return v2;
  }
  if(typeof _i18n_HI_EN === 'object' && _i18n_HI_EN[hi]) return _i18n_HI_EN[hi];
  // Non-Hindi UI: prefer explicit English arg over leftover Hindi
  if(en != null && en !== '') return en;
  return hi;
}

function t(str){
  if(!str || typeof str !== 'string') return str;
  if(typeof _lang === 'undefined' || _lang === 'hi') return str;
  // Multi-lang meaning map + Brahmic script fallback (via mlT)
  if(typeof mlT === 'function'){
    const ml = mlT(str, _lang);
    if(ml !== str) return ml;
  }
  // Classic HI→EN dictionary
  if(typeof _i18n_HI_EN === 'object' && _i18n_HI_EN[str]) return _i18n_HI_EN[str];
  // Prefix match for dynamic suffixes
  if(typeof _i18n_HI_EN === 'object'){
    for(const key of Object.keys(_i18n_HI_EN)){
      if(key.length > 5 && str.startsWith(key)){
        let tail = _i18n_HI_EN[key] + str.slice(key.length);
        // Script-convert leftover Devanagari in dynamic tail when needed
        if(typeof mlScript === 'function') tail = mlScript(tail, _lang);
        return tail;
      }
    }
  }
  // Last resort: script-convert free Hindi text for Brahmic UI languages
  if(typeof mlScript === 'function') return mlScript(str, _lang);
  return str;
}


/** User-facing Firebase / network errors (no raw PERMISSION_DENIED) */
function friendlyFbError(err){
  const msg = String((err && (err.message||err.code)) || err || '');
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  if(/PERMISSION_DENIED|permission_denied/i.test(msg))
    return en
      ? 'Action not allowed. Try Phone verify once on this device, or ask Admin/Manager.'
      : 'यह क्रिया अनुमति नहीं मिली। इस device पर एक बार Phone verify करें, या Admin/Manager से पूछें।';
  if(/network|offline|Failed to fetch|unavailable/i.test(msg))
    return en ? 'Network issue — check internet and retry.' : 'नेटवर्क समस्या — इंटरनेट जाँचें और फिर try करें।';
  if(/too many requests|quota/i.test(msg))
    return en ? 'Too many attempts — wait a minute and try again.' : 'बहुत attempts हो गए — थोड़ा रुककर फिर try करें।';
  return msg.length > 120 ? msg.slice(0,120)+'…' : msg;
}

const _TOAST_HI_EN = {
  '⏳ Manager approve होने तक सिर्फ Home / To-Do / Learn उपलब्ध हैं': '⏳ Until Manager approves, only Home / To-Do / Learn are available',
  'Install रद्द किया — ऊपर address bar में Install भी try करें': 'Install cancelled — try Install in the address bar too',
  '⚠️ Auto के लिए कम से कम 1 shift tick करें (D/N या A/B/C)': '⚠️ Tick at least 1 shift for Auto (D/N or A/B/C)',
  'ℹ️ Password बाद में Profile से सेट कर सकते हैं': 'ℹ️ You can set password later from Profile',
  '⚠️ Display error — कृपया page refresh करें': '⚠️ Display error — please refresh the page',
  '📱 Member login: पहले Mobile Number डालें': '📱 Member login: first Mobile Number',
  '⚠️ शुरू की तारीख अंत से पहले होनी चाहिए': '⚠️ Start date must be before end date',
  '❌ Write auth missing — OTP verify करें': '❌ Write auth missing — verify OTP',
  '⚠️ C-Off के लिए Shift Date जरूरी है': '⚠️ Shift date is required for C-Off',
  '❌ Schedule edit permission नहीं है': '❌ No schedule edit permission',
  '❌ Leave approve permission नहीं है': '❌ Leave approve permission No है',
  '⚠️ 10 अंकों का Mobile Number डालें': '⚠️ Enter a 10-digit mobile number',
  '✅ Fingerprint login set up हो गया!': '✅ Fingerprint login set up done!',
  '❌ Leave delete permission नहीं है': '❌ Leave delete permission No है',
  '⚠️ 10 अंकों का valid mobile डालें': '⚠️ Enter a valid 10-digit mobile',
  '⚠️ Schedule Builder open नहीं है': '⚠️ Schedule Builder open No है',
  '⚠️ C-Off के लिए Shift Date जरूरी': '⚠️ Shift date is required for C-Off',
  '✅ Schedule image download हो गई!': '✅ Schedule image download done!',
  '❌ Leave edit permission नहीं है': '❌ Leave edit permission No है',
  '🔄 Original shift restore हो गई': '🔄 Original shift restore done',
  'इस कर्मचारी का कोई NCR नहीं है': 'No NCR for this employee',
  '🔄 Default order restore हो गया': '🔄 Default order restore done',
  '👆 Fingerprint से login हो गया!': '👆 Fingerprint से login done!',
  '📲 OTP SMS से auto-fill हो गया': '📲 OTP SMS से auto-fill done',
  '⚠️ EL Limit पार! Available: ': '⚠️ EL Limit पार! Available:',
  '⚠️ कृपया दोनों तारीखें चुनें': '⚠️ Please select both dates',
  '⏳ Install तैयार हो रहा है...': '⏳ Preparing install...',
  '❌ Department / Machine चुनें': '❌ Department / Machine',
  '⚠️ सही 10 अंक का नंबर डालें': '⚠️ Enter a correct 10-digit number',
  'नाम और link दोनों जरूरी हैं': 'Name and link are both required',
  '❌ Report permission नहीं है': '❌ Report permission No है',
  '⚠️ 10MB से छोटी फोटो चुनें': '⚠️ Choose a photo under 10MB',
  '✅ SMS Settings save हो गई': '✅ SMS Settings saved',
  '❌ Employee add नहीं हुआ: ': '❌ Employee add No हुआ:',
  '✅ Dedication save हो गई!': '✅ Dedication save done!',
  '✅ Login हो गया! Welcome ': '✅ Login done! Welcome',
  '⏳ Excel तैयार हो रहा है…': '⏳ Preparing Excel…',
  '⚠️ From / To date चुनें': '⚠️ From / To date',
  '⚠️ 6 अंकों का OTP डालें': '⚠️ Enter the 6-digit OTP',
  '✅ Schedule save हो गई!': '✅ Schedule saved!',
  '🗑️ Report delete हो गई': '🗑️ Report delete done',
  '⏳ Verify हो रहा है...': '⏳ Verifying...',
  '✅ Content add हो गया!': '✅ Content add done!',
  '⚠️ पहले API Key डालें': '⚠️ Enter API Key first',
  '✅ Price update हो गई!': '✅ Price update done!',
  'सही मोबाइल नंबर डालें': 'Enter a valid mobile number',
  '⏳ Excel पढ़ रहे हैं…': '⏳ Reading Excel…',
  '❌ Permission नहीं है': '❌ Permission No है',
  '✅ UPI ID Copy हो गई!': '✅ UPI ID Copy done!',
  'नाम और कोड जरूरी है': 'Name and code are required',
  '⚠️ API Key खाली है': '⚠️ API Key is empty',
  'कर्मचारी नहीं मिला': 'Employee not found',
  'Content नहीं मिला': 'Content not found',
  '⚠️ Title जरूरी है': '⚠️ Title is required',
  '⚠️ कर्मचारी चुनें': '⚠️ Select employee',
  'कोई बदलाव नहीं है': 'No changes to save',
  'सभी जानकारी भरें': 'Fill in all details',
  'जल्द आ रहा है! ⏳': 'Coming soon! ⏳',
  '⚠️ कोई data नहीं': '⚠️ कोई data No',
  '❌ कोई match नहीं': '❌ कोई match No',
  '🗑️ Delete हो गया': '🗑️ Delete done',
  'सही price डालें': 'Enter a valid price',
  'पहले plan चुनें': 'Select a plan first',
  'अंतिम दिन चुनें': 'Select end date',
  'कर्मचारी चुनें': 'Select employee',
  '⚠️ महीना चुनें': '⚠️ Select month',
  '⚠️ Column खाली': '⚠️ Column is empty',
  '⚠️ Month चुनें': '⚠️ Month',
  '⚠️ Date चुनें': '⚠️ Select date',
  'URL खाली है': 'URL is empty',
  '❌ Key डालें': '❌ Key',
  '⚠️ Row खाली': '⚠️ Row empty',
  'तारीख भरें': 'Enter date',
  'कारण चुनें': 'Select reason',
  'Plan चुनें': 'Select plan',
  'Title भरें': 'Enter title',
  'Date चुनें': 'Select date',
  'नाम भरें': 'Enter name',
};

function toast(msg){
  let out = msg;
  try{
    if(typeof t === 'function') out = t(String(msg==null?'':msg));
    // Extra toast dictionary for mixed Hindi left in English mode
    if(typeof _lang !== 'undefined' && _lang !== 'hi' && typeof out === 'string'){
      if(typeof _TOAST_HI_EN === 'object' && _TOAST_HI_EN[out]) out = _TOAST_HI_EN[out];
      else if(typeof _TOAST_HI_EN === 'object'){
        // Longest-key prefix / contains replace for dynamic toasts
        const keys = Object.keys(_TOAST_HI_EN).sort((a,b)=>b.length-a.length);
        for(const k of keys){
          if(k.length >= 6 && out.indexOf(k) >= 0){
            out = out.split(k).join(_TOAST_HI_EN[k]);
          }
        }
      }
      // Strip leftover common Hindi fragments in EN mode
      if(/[\u0900-\u097F]/.test(out)){
        const frag = [
          ['नहीं है',' not available'],['नहीं मिला',' not found'],['जरूरी है',' required'],
          ['कृपया','Please'],['डालें',''],['चुनें',''],['भरें',''],
          ['हो गई',' saved'],['हो गया',' done'],['सेव','save'],
          ['रद्द करें','Cancel'],['सेव करें','Save'],['बंद करें','Close'],
          ['permission नहीं','no permission'],['verify करें','verify'],
          ['page refresh करें','refresh the page'],['महीना','month'],
          ['तारीख','date'],['कर्मचारी','employee'],['नाम','name'],
        ];
        for(const [h,e] of frag){ if(out.indexOf(h)>=0) out = out.split(h).join(e); }
        out = out.replace(/\s{2,}/g,' ').trim();
      }
    }
  }catch(e){ out = msg; }
  const t_el = document.getElementById('toast');
  if(!t_el){ console.log('[toast]', out); return; }
  t_el.textContent = out;
  t_el.classList.add('show');
  setTimeout(()=>t_el.classList.remove('show'),3000);
}

// ════════════════════════════════════════
// PRINT
// ════════════════════════════════════════
// ══════════════════════════════════════════════


// ══════════════════════════════════════════════
// HOLIDAY LIST (Manager profile) — Date + Reason
// Stored at: holidayLists/{companyKey}
// Excel columns: Date | Reason
// ══════════════════════════════════════════════
function _holidayListKey(){
  try{
    if(typeof myShiftConfigKey==='function'){
      const k = myShiftConfigKey();
      if(k) return k.replace(/[:.#$\[\]]/g,'_');
    }
  }catch(e){}
  const c = (SESSION.companyId||SESSION.viewCompanyId||SESSION.company||'MET').toString();
  return c.replace(/[:.#$\[\]]/g,'_');
}

async function loadHolidayList(){
  const key = _holidayListKey();
  const lsKey = 'mp_holidayList_'+key;
  // Prefer network; fall back to localStorage for offline viewing
  try{
    const rec = await fbGet('holidayLists/'+key);
    if(rec && (Array.isArray(rec.items) || (rec.items && typeof rec.items==='object'))){
      const out = {
        items: Array.isArray(rec.items) ? rec.items : Object.values(rec.items),
        snapshotUrl: rec.snapshotUrl||null
      };
      try{ localStorage.setItem(lsKey, JSON.stringify(out)); }catch(e){}
      return out;
    }
  }catch(e){ /* offline or network error */ }
  try{
    const raw = localStorage.getItem(lsKey);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && Array.isArray(parsed.items)) return parsed;
    }
  }catch(e){}
  return { items: [], snapshotUrl: null };
}

async function saveHolidayList(data){
  // No-arg: legacy textarea holiday list UI
  if(data == null && document.getElementById('holidayListTa')){
    const key = 'holidayLists/'+(typeof myShiftConfigKey==='function' && myShiftConfigKey() || (typeof _normMobileKey==='function' && _normMobileKey(SESSION.mobile)) || 'default');
    const raw = (document.getElementById('holidayListTa')?.value||'');
    const dates = raw.split(/[\n,]+/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
    try{
      await fbSet(key, { dates, updatedAt: new Date().toISOString(), updatedBy: SESSION.name||'' });
      toast('⏳ Applying H + C-Off for team…');
      const n = typeof applyHolidaysToTeam==='function' ? await applyHolidaysToTeam(dates) : 0;
      toast('✅ '+dates.length+' holidays · '+n+' C-Off requests');
      closeModal();
    }catch(e){ toast('❌ '+e.message); }
    return;
  }
  data = data || { items: [] };
  const key = _holidayListKey();
  const payload = {
    items: (data.items||[]).map(x=>({
      id: x.id || ('h_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      date: String(x.date||'').slice(0,10),
      reason: String(x.reason||'').trim()
    })).filter(x=>x.date),
    snapshotUrl: null, // image upload removed — keep field null for schema compat
    updatedAt: new Date().toISOString(),
    updatedBy: SESSION.name||''
  };
  try{ localStorage.setItem('mp_holidayList_'+key, JSON.stringify({ items: payload.items, snapshotUrl: null })); }catch(e){}
  try{
    await fbSet('holidayLists/'+key, payload);
  }catch(e){
    // Offline: still saved to localStorage above
    console.warn('[HolidayList] Firebase save failed (offline?)', e);
  }
  return payload;
}


let _holidayDraft = { items: [], snapshotUrl: null };

async function openHolidayListModal(){
  // profile menu entry
  if(!isAdmin() && !isMgr()){ toast(L('❌ Manager only','❌ Manager only')); return; }
  try{ closeModal(); }catch(e){}
  try{
    const data = await loadHolidayList();
    _holidayDraft = {
      items: (data.items||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))),
      snapshotUrl: null
    };
  }catch(e){
    _holidayDraft = { items: [], snapshotUrl: null };
  }
  _renderHolidayListModal();
}

function _renderHolidayListModal(){
  const isEn = (_lang !== 'hi');
  const items = _holidayDraft.items||[];
  const rows = items.length ? items.map((it,i)=>{
    const fmt = (()=>{ try{ return new Date(it.date+'T12:00:00').toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return it.date; }})();
    return `<tr>
      <td style="padding:8px 6px;font-weight:800;color:var(--text);white-space:nowrap">${fmt}</td>
      <td style="padding:8px 6px;color:var(--text);font-size:13px">${escHtml((it.reason||'').replace(/</g,'&lt;'))}</td>
      <td style="padding:4px;text-align:right">
        <button type="button" onclick="_removeHolidayItem(${i})" style="background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.35);color:#f43f5e;border-radius:8px;padding:6px 10px;font-weight:800;cursor:pointer;font-size:12px">✕</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="3" style="padding:16px;text-align:center;color:var(--muted2);font-size:13px">${L('अभी कोई holiday नहीं — नीचे जोड़ें, Excel, या Auto-fetch करें','No holidays yet — add below, Excel, or Auto-fetch')}</td></tr>`;

  const yNow = new Date().getFullYear();
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">📅 ${L('Holiday List','Holiday List')}</div>
  <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
    ${L('Manager यहाँ <b>Date + Reason</b> जोड़ सकता है, Excel upload कर सकता है, या <b>Auto-fetch</b> से All-India holidays ला सकता है।','Add <b>Date + Reason</b>, upload Excel (<code>Date | Reason</code>), or <b>Auto-fetch</b> All-India public holidays for a year.')}
  </div>

  <div style="overflow-x:auto;border:1px solid var(--border2);border-radius:12px;margin-bottom:12px">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:var(--card2)">
          <th style="text-align:left;padding:10px 6px;font-size:11px;color:var(--muted2)">${L('Date','Date')}</th>
          <th style="text-align:left;padding:10px 6px;font-size:11px;color:var(--muted2)">${L('Reason','Reason')}</th>
          <th style="width:44px"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div style="font-size:12px;font-weight:800;color:#f59e0b;margin:4px 0 8px">➕ ${L('Add holiday','Add holiday')}</div>
  <div style="display:grid;grid-template-columns:1fr 1.4fr auto;gap:8px;margin-bottom:14px;align-items:end">
    <div>
      <div style="font-size:10px;color:var(--muted2);margin-bottom:4px">${L('Date','Date')}</div>
      <input type="date" id="hl_date" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;box-sizing:border-box">
    </div>
    <div>
      <div style="font-size:10px;color:var(--muted2);margin-bottom:4px">${L('Reason','Reason')}</div>
      <input type="text" id="hl_reason" placeholder="${L('e.g. Diwali / Company holiday','e.g. Diwali / Company holiday')}" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;box-sizing:border-box">
    </div>
    <button type="button" onclick="_addHolidayItem()" style="padding:10px 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;cursor:pointer;font-size:13px">Add</button>
  </div>

  <div style="font-size:12px;font-weight:800;color:#22c55e;margin:4px 0 8px">🇮🇳 ${L('Auto-fetch All-India holidays','Auto-fetch All-India holidays')}</div>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
    <select id="hl_year" style="padding:10px 12px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:700">
      <option value="${yNow-1}">${yNow-1}</option>
      <option value="${yNow}" selected>${yNow}</option>
      <option value="${yNow+1}">${yNow+1}</option>
    </select>
    <button type="button" class="submit-btn" style="margin:0;flex:1;min-width:160px;padding:10px 14px" onclick="_autoFetchIndiaHolidays()">⚡ ${L('Auto Fetch','Auto Fetch')}</button>
  </div>
  <div style="font-size:11px;color:var(--muted2);margin:-6px 0 14px;line-height:1.4">${L('चयनित वर्ष की आधिकारिक सार्वजनिक छुट्टियाँ (Republic Day, Holi, Diwali आदि)। सूची में merge होती हैं। पहले fetch हो चुकी हों तो offline भी चलती हैं।','Fetches official public holidays (Republic Day, Holi, Diwali, etc.) for the selected year. Merges with your list (same date = update). Works offline if previously fetched.')}</div>

  <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:4px 0 8px">📂 ${L('Excel / CSV import','Excel / CSV import')}</div>
  <div style="font-size:11px;color:var(--muted2);margin-bottom:8px">${L('Columns: <b>Date</b> | <b>Reason</b>','Columns: <b>Date</b> | <b>Reason</b>')}</div>
  <input type="file" id="hl_excel" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none" onchange="_importHolidayExcel(this)">
  <button type="button" class="cancel-btn" style="margin-bottom:12px" onclick="document.getElementById('hl_excel').click()">📂 ${L('Choose Excel / CSV','Choose Excel / CSV')}</button>

  <button class="submit-btn" style="margin-top:8px" onclick="_saveHolidayListUI()">✅ ${L('Save Holiday List','Save Holiday List')}</button>
  <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

function _addHolidayItem(){
  const isEn = (_lang !== 'hi');
  const dateEl = document.getElementById('hl_date');
  const reasonEl = document.getElementById('hl_reason');
  const date = (dateEl&&dateEl.value||'').trim();
  const reason = (reasonEl&&reasonEl.value||'').trim();
  if(!date){ toast(L('⚠️ Date चुनें','⚠️ Select a date')); return; }
  if(!reason){ toast(L('⚠️ Reason लिखें','⚠️ Enter reason')); return; }
  _holidayDraft.items = (_holidayDraft.items||[]).filter(x=>x.date!==date);
  _holidayDraft.items.push({ id:'h_'+Date.now(), date, reason });
  _holidayDraft.items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  _renderHolidayListModal();
}

function _removeHolidayItem(idx){
  _holidayDraft.items.splice(idx,1);
  _renderHolidayListModal();
}
try{ window.openHolidayListModal = openHolidayListModal; }catch(e){}


function _parseHolidayDate(raw){
  if(raw == null || raw === '') return '';

  // Native Date (SheetJS cellDates:true + raw cells)
  if(Object.prototype.toString.call(raw) === '[object Date]' && !isNaN(raw.getTime())){
    const y = raw.getFullYear();
    const m = String(raw.getMonth()+1).padStart(2,'0');
    const d = String(raw.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+d;
  }

  // Excel serial number (days since 1899-12-30, with 1900 leap-year bug handled by epoch)
  if(typeof raw === 'number' && isFinite(raw)){
    // Time-of-day fractions ignored; valid holiday serials roughly 30000–60000 (1982–2064)
    if(raw > 20000 && raw < 80000){
      const utc = Date.UTC(1899, 11, 30) + Math.floor(raw) * 86400000;
      const d = new Date(utc);
      // Correct for timezone shift by using UTC components
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth()+1).padStart(2,'0');
      const day = String(d.getUTCDate()).padStart(2,'0');
      return y+'-'+m+'-'+day;
    }
    return '';
  }

  let s = String(raw).trim();
  if(!s) return '';

  // Strip time portion: "2026-01-26 00:00:00" / "26/01/2026 12:00"
  s = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp][Mm])?$/, '').trim();

  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if(m){
    return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (India common)
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if(m){
    const day = parseInt(m[1],10), mon = parseInt(m[2],10), year = parseInt(m[3],10);
    // If first part > 12, treat as DD/MM; if second > 12 treat as MM/DD already swapped unlikely
    if(mon >= 1 && mon <= 12 && day >= 1 && day <= 31){
      return year+'-'+String(mon).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    }
  }

  // "26 Jan 2026" / "Jan 26, 2026" / "26 January 2026"
  const parsed = Date.parse(s);
  if(!isNaN(parsed)){
    const d = new Date(parsed);
    if(!isNaN(d.getTime())){
      // Prefer local date parts for named months
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    }
  }

  // Numeric string that is Excel serial
  if(/^\d+(\.\d+)?$/.test(s)){
    const n = Number(s);
    if(n > 20000 && n < 80000) return _parseHolidayDate(n);
  }

  return '';
}

/** Split a CSV line respecting double-quoted fields. */
function _splitCsvLine(line){
  const out = [];
  let cur = '', inQ = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(inQ){
      if(ch === '"'){
        if(line[i+1] === '"'){ cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if(ch === '"') inQ = true;
      else if(ch === ',' || ch === '\t' || ch === ';'){ out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map(c=>c.trim());
}

/** Load SheetJS once. */
async function _ensureXlsxLib(){
  if(window.XLSX) return;
  await new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = resolve;
    s.onerror = ()=>reject(new Error('SheetJS load failed'));
    document.head.appendChild(s);
  });
}

/**
 * Parse raw sheet rows into holiday items.
 * Supports flexible headers: Date / दिनांक / Holiday Date, Reason / Occasion / त्योहार / Description
 * Returns { items:[{date,reason}], errors:[string], meta:{dateCol,reasonCol,headerRow} }
 */
function parseHolidayExcelRows(rows){
  const result = { items: [], errors: [], meta: { dateCol: 0, reasonCol: 1, headerRow: -1 } };
  if(!rows || !rows.length){
    result.errors.push('File खाली है');
    return result;
  }

  // Normalize each cell to string or Date/number for date parser
  const normRows = rows.map(r=>{
    if(!r) return [];
    if(!Array.isArray(r)) r = Object.values(r);
    return r.map(c => (c == null ? '' : c));
  });

  const DATE_ALIASES = [
    'date','holiday date','holidaydate','hdate','dt','day',
    'दिनांक','तारीख','तिथि','holiday','छुट्टी की तारीख'
  ];
  const REASON_ALIASES = [
    'reason','occasion','festival','name','holiday name','holidayname',
    'description','desc','title','event','remarks','remark','note','notes',
    'कारण','त्योहार','अवसर','नाम','विवरण','छुट्टी','holiday reason'
  ];

  function headerScore(cell){
    const h = String(cell||'').toLowerCase().replace(/[\s_\-]+/g,' ').trim();
    return h;
  }

  // Find header row within first 5 rows
  let headerRow = -1, dateCol = -1, reasonCol = -1;
  for(let i=0;i<Math.min(5, normRows.length);i++){
    const row = normRows[i];
    let dIdx = -1, rIdx = -1;
    row.forEach((cell, ci)=>{
      const h = headerScore(cell);
      if(!h) return;
      if(dIdx < 0 && DATE_ALIASES.some(a => h === a || h.includes(a))) dIdx = ci;
      if(rIdx < 0 && REASON_ALIASES.some(a => h === a || h.includes(a))) rIdx = ci;
    });
    // Prefer a row that matched at least Date
    if(dIdx >= 0){
      headerRow = i;
      dateCol = dIdx;
      reasonCol = rIdx >= 0 ? rIdx : (dIdx === 0 ? 1 : 0);
      break;
    }
  }

  // No header: assume col0=Date, col1=Reason
  if(headerRow < 0){
    headerRow = -1;
    dateCol = 0;
    reasonCol = 1;
  }

  result.meta = { dateCol, reasonCol, headerRow };

  const start = headerRow >= 0 ? headerRow + 1 : 0;
  const seen = new Set();

  for(let i = start; i < normRows.length; i++){
    const row = normRows[i];
    if(!row || !row.length) continue;
    // skip fully empty
    if(row.every(c => c === '' || c == null)) continue;

    const rawDate = row[dateCol];
    const rawReason = row[reasonCol];
    // Sometimes reason is only in next non-empty cell
    let reason = String(rawReason == null ? '' : rawReason).trim();
    if(!reason){
      for(let c=0;c<row.length;c++){
        if(c === dateCol) continue;
        const t = String(row[c]||'').trim();
        if(t){ reason = t; break; }
      }
    }

    const date = _parseHolidayDate(rawDate);
    if(!date && !reason) continue;
    if(!date){
      result.errors.push('Row '+(i+1)+': invalid date "'+String(rawDate)+'"');
      continue;
    }
    if(!reason){
      result.errors.push('Row '+(i+1)+': reason missing ('+date+')');
      continue;
    }

    // Validate calendar date
    const parts = date.split('-').map(Number);
    if(parts.length !== 3 || parts[1] < 1 || parts[1] > 12 || parts[2] < 1 || parts[2] > 31){
      result.errors.push('Row '+(i+1)+': bad date '+date);
      continue;
    }

    if(seen.has(date)){
      // later row wins
      result.items = result.items.filter(x => x.date !== date);
    }
    seen.add(date);
    result.items.push({
      id: 'h_'+date.replace(/-/g,'')+'_'+i,
      date,
      reason: reason.slice(0, 200)
    });
  }

  result.items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  return result;
}

/** Read File → 2D rows array (xlsx / xls / csv). */
async function _readHolidayFileToRows(file){
  const name = (file.name||'').toLowerCase();
  const buf = await file.arrayBuffer();

  if(name.endsWith('.csv') || (file.type||'').includes('csv') || (file.type||'')==='text/plain'){
    // Try UTF-8, fallback latin1 for older Hindi exports
    let text = '';
    try{ text = new TextDecoder('utf-8', {fatal:false}).decode(buf); }
    catch(e){ text = new TextDecoder('windows-1252').decode(buf); }
    // Strip BOM
    if(text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return text.split(/\r?\n/).filter(l=>l.trim().length).map(_splitCsvLine);
  }

  await _ensureXlsxLib();
  // raw:true keeps Date objects & serial numbers for accurate parsing
  const wb = XLSX.read(buf, { type:'array', cellDates:true });
  const sheetName = wb.SheetNames[0];
  if(!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  // header:1 → array of arrays; raw:true → Date/number preserved
  return XLSX.utils.sheet_to_json(sheet, { header:1, raw:true, defval:'' });
}

async function _importHolidayExcel(input){
  const file = input.files && input.files[0];
  if(!file) return;
  try{
    toast(L('⏳ Excel पढ़ रहे हैं…','⏳ Reading Excel…'));
    const rows = await _readHolidayFileToRows(file);
    const parsed = parseHolidayExcelRows(rows);

    if(!parsed.items.length){
      const errHint = parsed.errors.slice(0,3).join(' · ');
      toast(errHint
        ? ('⚠️ कोई valid holiday नहीं · '+errHint)
        : '⚠️ कोई valid row नहीं मिली — columns: Date | Reason');
      input.value = '';
      return;
    }

    // Merge by date (import overwrites same date)
    const map = {};
    (_holidayDraft.items||[]).forEach(it=>{ if(it && it.date) map[it.date]=it; });
    parsed.items.forEach(it=>{ map[it.date]=it; });
    _holidayDraft.items = Object.values(map).sort((a,b)=>String(a.date).localeCompare(String(b.date)));

    let msg = '✅ '+parsed.items.length+' holidays import हुए (total '+_holidayDraft.items.length+')';
    if(parsed.errors.length){
      msg += ' · '+parsed.errors.length+' row skip';
      console.warn('[Holiday Excel]', parsed.errors);
    }
    toast(msg);
    _renderHolidayListModal();
  }catch(e){
    console.error('[Holiday Excel]', e);
    toast('❌ Import failed: '+(e.message||e));
  }
  input.value = '';
}

/* _importHolidayImage removed — replaced by Auto-fetch All-India holidays */


/** Built-in All-India public holidays (used when network/API fails). Fixed + common festival dates. */
const _INDIA_HOLIDAYS_BUILTIN = {
  2025: [
    {date:'2025-01-01',reason:'New Year\'s Day'},
    {date:'2025-01-14',reason:'Makar Sankranti'},
    {date:'2025-01-26',reason:'Republic Day'},
    {date:'2025-02-26',reason:'Maha Shivaratri'},
    {date:'2025-03-14',reason:'Holi'},
    {date:'2025-03-31',reason:'Id-ul-Fitr'},
    {date:'2025-04-10',reason:'Mahavir Jayanti'},
    {date:'2025-04-18',reason:'Good Friday'},
    {date:'2025-05-12',reason:'Buddha Purnima'},
    {date:'2025-06-07',reason:'Id-ul-Zuha (Bakrid)'},
    {date:'2025-07-06',reason:'Muharram'},
    {date:'2025-08-15',reason:'Independence Day'},
    {date:'2025-08-16',reason:'Janmashtami'},
    {date:'2025-09-05',reason:'Milad-un-Nabi'},
    {date:'2025-10-02',reason:'Gandhi Jayanti'},
    {date:'2025-10-02',reason:'Dussehra'},
    {date:'2025-10-21',reason:'Diwali'},
    {date:'2025-11-05',reason:'Guru Nanak Jayanti'},
    {date:'2025-12-25',reason:'Christmas Day'}
  ],
  2026: [
    {date:'2026-01-01',reason:'New Year\'s Day'},
    {date:'2026-01-14',reason:'Makar Sankranti'},
    {date:'2026-01-26',reason:'Republic Day'},
    {date:'2026-02-15',reason:'Maha Shivaratri'},
    {date:'2026-03-03',reason:'Holi'},
    {date:'2026-03-21',reason:'Id-ul-Fitr'},
    {date:'2026-03-31',reason:'Mahavir Jayanti'},
    {date:'2026-04-03',reason:'Good Friday'},
    {date:'2026-05-01',reason:'Buddha Purnima'},
    {date:'2026-05-27',reason:'Id-ul-Zuha (Bakrid)'},
    {date:'2026-06-26',reason:'Muharram'},
    {date:'2026-08-15',reason:'Independence Day'},
    {date:'2026-09-04',reason:'Janmashtami'},
    {date:'2026-09-26',reason:'Milad-un-Nabi'},
    {date:'2026-10-02',reason:'Gandhi Jayanti'},
    {date:'2026-10-20',reason:'Dussehra'},
    {date:'2026-11-08',reason:'Diwali'},
    {date:'2026-11-24',reason:'Guru Nanak Jayanti'},
    {date:'2026-12-25',reason:'Christmas Day'}
  ],
  2027: [
    {date:'2027-01-01',reason:'New Year\'s Day'},
    {date:'2027-01-14',reason:'Makar Sankranti'},
    {date:'2027-01-26',reason:'Republic Day'},
    {date:'2027-03-06',reason:'Maha Shivaratri'},
    {date:'2027-03-22',reason:'Holi'},
    {date:'2027-03-11',reason:'Id-ul-Fitr'},
    {date:'2027-04-09',reason:'Good Friday'},
    {date:'2027-04-19',reason:'Mahavir Jayanti'},
    {date:'2027-05-20',reason:'Buddha Purnima'},
    {date:'2027-05-17',reason:'Id-ul-Zuha (Bakrid)'},
    {date:'2027-06-15',reason:'Muharram'},
    {date:'2027-08-15',reason:'Independence Day'},
    {date:'2027-08-24',reason:'Janmashtami'},
    {date:'2027-09-15',reason:'Milad-un-Nabi'},
    {date:'2027-10-02',reason:'Gandhi Jayanti'},
    {date:'2027-10-09',reason:'Dussehra'},
    {date:'2027-10-29',reason:'Diwali'},
    {date:'2027-11-14',reason:'Guru Nanak Jayanti'},
    {date:'2027-12-25',reason:'Christmas Day'}
  ]
};

async function _autoFetchIndiaHolidays(){
  const isEn = (_lang !== 'hi');
  const yearEl = document.getElementById('hl_year');
  const year = parseInt(yearEl && yearEl.value ? yearEl.value : new Date().getFullYear(), 10);
  const cacheKey = 'mp_india_holidays_'+year;

  function mergeItems(items){
    const map = {};
    (_holidayDraft.items||[]).forEach(it=>{ if(it && it.date) map[it.date]=it; });
    items.forEach(it=>{ if(it && it.date) map[it.date]={ id: it.id||('h_'+it.date), date: String(it.date).slice(0,10), reason: String(it.reason||'Holiday').trim() }; });
    _holidayDraft.items = Object.values(map).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }

  function fromBuiltin(){
    const list = _INDIA_HOLIDAYS_BUILTIN[year];
    if(!list || !list.length) return null;
    return list.map(h=>({ id:'h_builtin_'+h.date, date:h.date, reason:h.reason }));
  }

  toast(isEn ? ('⏳ Fetching All-India holidays for '+year+'…') : ('⏳ '+year+' की All-India holidays ला रहे हैं…'));

  // 1) Network — try Nager.Date (primary)
  try{
    const controller = typeof AbortController!=='undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(()=>controller.abort(), 10000) : null;
    const res = await fetch('https://date.nager.at/api/v3/PublicHolidays/'+year+'/IN', {
      cache: 'no-store',
      mode: 'cors',
      signal: controller ? controller.signal : undefined
    });
    if(timer) clearTimeout(timer);
    if(res.ok){
      const data = await res.json();
      if(Array.isArray(data) && data.length){
        const items = data.map(h=>({
          id: 'h_nager_'+String(h.date||''),
          date: String(h.date||'').slice(0,10),
          reason: String(h.localName || h.name || 'Holiday').trim()
        })).filter(x=>x.date);
        try{ localStorage.setItem(cacheKey, JSON.stringify(items)); }catch(e){}
        mergeItems(items);
        toast('✅ '+items.length+' All-India holidays · total '+_holidayDraft.items.length);
        _renderHolidayListModal();
        return;
      }
    }
  }catch(netErr){
    console.warn('[Holiday AutoFetch] network', netErr);
  }

  // 2) localStorage cache from a previous successful fetch
  try{
    const raw = localStorage.getItem(cacheKey);
    if(raw){
      const items = JSON.parse(raw);
      if(Array.isArray(items) && items.length){
        mergeItems(items);
        toast(isEn ? ('📴 Cached: '+items.length+' holidays for '+year) : ('📴 Cached: '+year+' के '+items.length+' holidays'));
        _renderHolidayListModal();
        return;
      }
    }
  }catch(e){}

  // 3) Built-in offline list (always available for 2025–2027)
  const builtin = fromBuiltin();
  if(builtin && builtin.length){
    try{ localStorage.setItem(cacheKey, JSON.stringify(builtin)); }catch(e){}
    mergeItems(builtin);
    toast(isEn
      ? ('✅ '+builtin.length+' holidays loaded (built-in list for '+year+')')
      : ('✅ '+builtin.length+' holidays (built-in '+year+')'));
    _renderHolidayListModal();
    return;
  }

  toast(isEn
    ? ('❌ No holiday data for '+year+' — try 2025–2027 or add manually')
    : ('❌ '+year+' के holidays नहीं मिले — 2025–2027 चुनें या manual जोड़ें'));
}
try{ window._autoFetchIndiaHolidays = _autoFetchIndiaHolidays; }catch(e){}

async function _saveHolidayListUI(){
  try{
    await saveHolidayList(_holidayDraft);
    const dates = (_holidayDraft.items||[]).map(x=>x.date).filter(Boolean);
    let n = 0;
    if(dates.length && typeof applyHolidaysToTeam==='function'){
      toast('⏳ Checking duty on holidays → C-Off credits…');
      n = await applyHolidaysToTeam(dates);
    }
    toast('✅ Holiday List saved · '+(n? (n+' members got C-Off +1') : 'no duty on holiday dates'));
    closeModal();
  }catch(e){ toast('❌ Save failed: '+(e.message||e)); }
}


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
  // Sync My Shift save bar copy
  try{
    if(listMy && list) listMy.innerHTML = list.innerHTML;
    if(subMy && sub) subMy.textContent = sub.textContent || '';
  }catch(e){}

  // Count unique employees
  const empIds = [...new Set(entries.map(e=>e.empId))];
  const _titleTxt = `📝 ${entries.length} बदलाव pending — ${empIds.length} कर्मचारी`;
  if(title) title.textContent = _titleTxt;
  if(titleMy) titleMy.textContent = _titleTxt;

  // WhatsApp count
  const withPhone = empIds.filter(id=>{
    const emp=getEmps().find(e=>e.id===id);
    return emp && emp.phone && emp.phone.length===10;
  }).length;
  sub.textContent = withPhone
    ? `📲 Save करने पर ${withPhone} कर्मचारी को WhatsApp जाएगा (Free)`
    : '⚠️ किसी कर्मचारी का मोबाइल नंबर नहीं है';

  // List each pending change
  list.innerHTML = entries.map(e=>{
    const fmtD = new Date(e.date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short'});
    const shiftBg = {'D':'#f59e0b','N':'#4f46e5','O':'#334155','L':'#be123c','G':'#0284c7','C/O':'#92400e','HLF':'#ea580c','Ab':'#7f1d1d','H':'#ea580c','OD':'#0d9488','GP':'#6d28d9','A':'#16a34a','B':'#db2777','C':'#0891b2'};
    const bg = shiftBg[e.newShift] || '#444';
    return `<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border-radius:8px;padding:8px 10px">
      <span style="display:inline-flex;width:30px;height:26px;background:${bg};border-radius:5px;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#fff;flex-shrink:0">${cellDisp(e.newShift)}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(e.empName)}</div>
        <div style="font-size:11px;color:var(--muted2)">${fmtD}</div>
      </div>
      <button onclick="removePendingChange('${escHtml(e.empId)}','${e.date}')" style="background:none;border:none;color:var(--lv);font-size:16px;cursor:pointer;padding:4px;flex-shrink:0">✕</button>
    </div>`;
  }).join('');
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
  const origBtnHtml = saveBtn ? saveBtn.innerHTML : '💾 Save करें & WhatsApp भेजें';
  const showSaving = () => { if(saveBtn){ saveBtn.innerHTML='⏳ Save हो रहा है...'; saveBtn.disabled=true; }};
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
      toast(L('❌ Phone verify करें — Logout ज़रूरी नहीं','❌ Verify phone — logout not required'));
      try{
        const list = document.getElementById('saveBarList');
        if(list){
          let errEl = document.getElementById('saveBarPermErr');
          if(!errEl){ errEl=document.createElement('div'); errEl.id='saveBarPermErr'; list.parentNode.insertBefore(errEl, list); }
          errEl.style.cssText='background:rgba(244,63,94,.18);border:1.5px solid #f43f5e;border-radius:10px;padding:10px 12px;margin-bottom:10px;color:#fecdd3;font-size:12px;font-weight:800;line-height:1.45';
          errEl.innerHTML='⛔ Write auth missing<br>एक बार <b>Phone OTP verify</b> करें (app खुला रहेगा)। फिर Save दबाएँ।';
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
      ? '❌ Permission Denied — Phone OTP verify करें (Logout नहीं)'
      : ('❌ Save failed: '+(String(msg).slice(0,120)));
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
          errEl.innerHTML = '⛔ <b>'+friendlyFbError({message:'PERMISSION_DENIED'})+'</b><br>Firebase में anonymous session है। <b>Logout की ज़रूरत नहीं</b> — नीचे से Phone verify करें, फिर Save।'
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
        t = t.replace(/\n?https:\/\/manpower\.vkstech\.com\s*$/i, '').trim();
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
        title: '📋 Shift बदली गई',
        body: changeLines || 'आपकी shift update हुई',
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
        WhatsApp भेजें — ${escHtml(emp.name.split(' ')[0])}
      </button>

      <button id="_waSkipBtn"
        style="width:100%;padding:13px;border-radius:12px;border:1px solid var(--border2);background:var(--card);color:var(--muted2);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
        ${remaining > 0 ? `⏭️ Skip — अगला (${remaining} बाकी)` : '✅ बंद करें'}
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
    <div class="modal-title">🌴 Leave का कारण</div>
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
      <label style="color:var(--lv)">Leave Type / कारण * (अनिवार्य)</label>
      <textarea id="lrReasonText" rows="2"
        style="border-color:rgba(244,63,94,.3);width:100%;padding:10px;background:var(--card);
        border:2px solid rgba(244,63,94,.3);border-radius:10px;color:var(--text);font-size:14px;
        font-family:inherit;resize:none;outline:none"
        placeholder="Leave का कारण लिखें..."
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
      ✅ Leave Mark करें
    </button>
    <button class="cancel-btn" onclick="editShiftCell('${empId}','${empName}','${date}','${currentShift}')">← वापस</button>`);
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
  const leaveData={
    empId, empName,
    section: (getEmps().find(e=>e.id===empId)||{}).sec||'',
    from:date, to:date, days:1,
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

  // Write L to schedule immediately (plain 'L' so cell always shows Leave red badge)
  const shiftVal = 'L';
  const ovPayload = { [empId+'_'+date]: shiftVal };
  // Also key by empCode if available (Excel rows sometimes keyed by code)
  try{
    const empObj = (getEmps()||[]).find(e=>e.id===empId);
    if(empObj && empObj.empId && String(empObj.empId)!==String(empId)){
      ovPayload[empObj.empId+'_'+date] = shiftVal;
    }
  }catch(e){}
  try{
    await fbUpdate('overrides', ovPayload);
    _cache.overrides = {...(getOverrides()||{}), ...ovPayload};
  }catch(e){
    stageSingleShiftChange(empId, empName, date, currentShift, shiftVal, { leaveType: typeCode, reason });
  }
  closeModal();
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
  const _stdCodes = ['D','N','A','B','C'].filter(code=>{
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
      const time=(s.start&&s.end)?` (${s.start}–${s.end})`:'';
      return {v:code, label:(s.label||code)+time, bg:st.bg, color:st.color};
    }),
    ..._dblAll.map(({v,label,bg,color})=>({v,label,bg,color})),
    ...[
      {v:'O',   label:'Weekly Off',       bg:'#475569', color:'#ffffff'},
      {v:'L',   label:'Leave (pick type)', bg:'#be123c', color:'#ffffff'},
      {v:'G',   label:'General Shift',    bg:'#0284c7', color:'#ffffff'},
      {v:'C/O', label:'Comp Off',         bg:'#92400e', color:'#fde68a'},
      {v:'H',   label:'Holiday',          bg:'#ea580c', color:'#ffffff'},
      {v:'OD',  label:'Other Dept/Door',  bg:'#0d9488', color:'#ccfbf1'},
      {v:'GP',  label:'Gate Pass',        bg:'#6d28d9', color:'#e9d5ff'},
      {v:'HLF', label:'Half Day',         bg:'#ea580c', color:'#ffffff'},
      {v:'Ab',  label:'Absent',           bg:'#7f1d1d', color:'#fca5a5'},
    ].filter(opt=>{
      const s = _cfgByCode[String(opt.v).toUpperCase()] || _cfgByCode[opt.v];
      if(s && s.active === false) return false;
      // Prefer custom label from Profile when set
      if(s && s.label) opt.label = s.label;
      return true;
    })
  ];

  const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  const pendingKey = empId+'__'+date;
  const alreadyPending = _pendingShiftChanges[pendingKey];
  const effectiveCurrent = alreadyPending ? alreadyPending.newShift : currentShift;

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">✏️ Shift चुनें</div>
    <div style="text-align:center;padding:6px 0 14px">
      <div style="font-size:17px;font-weight:900;color:#fff">${empName}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:2px">${fmtD}</div>
      <div style="margin-top:6px;font-size:12px;color:var(--muted2)">
        वर्तमान: <span class="shc ${cellClass(currentShift)}" style="display:inline-flex;vertical-align:middle">${cellDisp(currentShift)}</span>
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
      🔄 Original पर Reset करें
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

      <div style="font-size:14px;font-weight:800;color:#e2e8f0;letter-spacing:.5px;margin-bottom:8px">किस दिन काम किया था? * <span style="font-weight:600;color:#f97316">(31 दिन की सीमा)</span></div>
      <div id="coWorkedDateSel" style="margin-bottom:14px">
        ${dateOpts.length===0?'<div style="color:#fca5a5;font-size:14px;padding:10px;background:rgba(244,63,94,.12);border-radius:8px;border:1px solid rgba(244,63,94,.3)">⚠️ पिछले 31 दिनों में कोई W-Off/Holiday पर Duty नहीं मिली जो C-Off के योग्य हो</div>':''}
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

      <div style="font-size:14px;font-weight:800;color:#e2e8f0;letter-spacing:.5px;margin-bottom:8px">कारण / Reason *</div>
      <div id="coReasonArea" style="margin-bottom:14px">
        <div id="coReasonBtns" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:8px">
          <button onclick="selectCoReason(this,'W-Off पर बुलाया गया')" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">🔔 W-Off पर बुलाया</button>
          <button onclick="selectCoReason(this,'Holiday पर काम किया')" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">🎉 Holiday काम किया</button>
          <button onclick="selectCoReason(this,'Extra shift ली')" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">⏰ Extra Shift</button>
          <button onclick="selectCoReason(this,'Emergency duty')" style="padding:10px 14px;border-radius:10px;border:1.5px solid #475569;background:#0f172a;color:#e2e8f0;font-size:14px;font-weight:700;cursor:pointer">🚨 Emergency</button>
        </div>
        <input id="coReasonText" placeholder="या कारण लिखें..." style="width:100%;padding:12px;border-radius:10px;background:#0f172a !important;border:1.5px solid #475569;color:#fff !important;font-size:15px;box-sizing:border-box;font-weight:600">
      </div>

      <div id="coSummary" style="display:none;background:rgba(113,63,18,.15);border:1px solid rgba(253,230,138,.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#fde68a;line-height:1.7"></div>

      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('compOffModal')?.remove()" style="flex:1;padding:13px;border-radius:10px;border:1px solid #334155;background:none;color:#64748b;font-size:14px;cursor:pointer">रद्द करें</button>
        <button onclick="confirmCompOff('${empId}','${empName}','${coDate}','${currentShift}')" style="flex:2;padding:13px;border-radius:10px;border:none;background:linear-gradient(135deg,#713f12,#92400e);color:#fde68a;font-size:14px;font-weight:900;cursor:pointer">✅ C-Off Mark करें</button>
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
    if(re && !re.value) re.value = holiName+' पर काम किया';
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
      if(reasonEl && !reasonEl.value) reasonEl.value = holiName+' पर काम किया';
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
      काम किया: ${isHoli?'🎉 '+holiName+' — ':'📅 W-OFF — '}${wdFmt}<br>
      ${reason?'कारण: '+reason:''}`;
  } else {
    summaryEl.style.display='none';
  }
}

function confirmCompOff(empId, empName, coDate, currentShift){
  const sel = document.getElementById('coWorkedDate');
  let workedDate = sel?.value==='OTHER' ? (document.getElementById('coManualDateInput')?.value||'') : sel?.value||'';
  const reason = document.getElementById('coReasonText')?.value?.trim()||'';
  
  if(!workedDate||workedDate==='OTHER'){
    alert('कृपया वो दिन चुनें जब काम किया था'); return;
  }
  
  // Get holiday name if applicable (stored in hidden field by selectCoDate)
  const holiName = document.getElementById('coWorkedHoliName')?.value || null;
  
  // Close modal
  document.getElementById('compOffModal')?.remove();
  
  // Stage the C/O with metadata
  stageSingleShiftChange(empId, empName, coDate, currentShift, 'C/O', {
    workedDate, reason: reason||(holiName?holiName+' पर काम किया':'W-Off पर काम किया'), holiName
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
      <label>किस Machine / Department में गए? *</label>
      <select class="inp-field" id="odDept">
        <option value="">-- चुनें --</option>
        ${machineOpts}
        <option value="__OTHER__">✏️ Other (type करें)</option>
      </select>
    </div>
    <div id="odCustomDeptWrap" style="display:none" class="field">
      <label>Department / Machine का नाम</label>
      <input class="inp-field" id="odCustomDept" placeholder="e.g. Packing, Store, M-9">
    </div>
    <div class="field">
      <label>कारण (Reason)</label>
      <input class="inp-field" id="odReason" placeholder="e.g. Manpower shortage, Training">
    </div>
    <button class="submit-btn" onclick="submitOD('${empId}','${empName}','${odDate}','${currentShift}')">✅ OD Mark करें</button>
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
  closeModal();
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
    toast(L('⏳ Shift save हो रही है…','⏳ Saving shift…'));
    saveAllShiftChanges({ skipWhatsApp: skipWA, stayOnMyShift: true }).catch(e=>{
      toast('❌ '+(e&&e.message||e));
    });
    return;
  }

  // ── Schedule grid path: stage + save bar ──
  try{ if(typeof pushSchedUndoSnapshot==='function') pushSchedUndoSnapshot(); }catch(e){}
  _pendingShiftChanges[key] = { empId, empName, date, newShift, currentShift, coMeta: coMeta||null };

  const cellEl = document.querySelector(`td[data-cellkey="${empId}_${date}"]`);
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
  toast(`⚡ ${empName}: ${cellDisp(newShift)} pending — ${L('Save दबाएँ','press Save')}`);
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
      : ('✅ Manager को request भेज दी — Approve के बाद shift अपडेट होगी'));
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

function openScheduleBuilder(){
  if(typeof canEditSchedule==='function' && !canEditSchedule()){
    toast(typeof L==='function'?L('❌ Schedule edit permission नहीं है','❌ No schedule edit permission'):'❌ No schedule edit permission');
    return;
  }
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth()+1, 1);
  // FIX: Use local date parts — toISOString() converts to UTC which shifts months in IST
  const defaultKey = nextMonth.getFullYear()+'-'+String(nextMonth.getMonth()+1).padStart(2,'0');
  const months = [];
  for(let i=-1; i<=6; i++){
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    const label = d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
    months.push({key, label});
  }
  const monthOpts = months.map(m=>`<option value="${m.key}"${m.key===defaultKey?' selected':''}>${escHtml(m.label)}</option>`).join('');
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  // Use lb (not L) — must not shadow global L(hi,en)
  const lb = {
    title: (typeof L==='function')?L('📋 Schedule Builder','📋 Schedule Builder'):'📋 Schedule Builder',
    month: (typeof L==='function')?L('महीना चुनें','Select Month'):'Select Month',
    section: (typeof L==='function')?L('Section','Section'):'Section',
    allSec: (typeof L==='function')?L('सभी Section','All Sections'):'All Sections',
    dateRange: (typeof L==='function')?L('तारीख रेंज','Date Range'):'Date Range',
    fullMonth: (typeof L==='function')?L('📅 पूरा महीना','📅 Full Month'):'📅 Full Month',
    customDates: (typeof L==='function')?L('🗓️ कस्टम तारीख','🗓️ Custom Dates'):'🗓️ Custom Dates',
    from: (typeof L==='function')?L('से (From)','From'):'From',
    to: (typeof L==='function')?L('तक (To)','To'):'To',
    hint: (typeof L==='function')?L('उदा. 11 से 20 — केवल ये दिन Schedule में दिखेंगे','e.g. 11 to 20 — only these days will appear in the schedule'):'e.g. 11 to 20 — only these days will appear',
    open: (typeof L==='function')?L('📋 Schedule खोलें','📋 Open Schedule'):'📋 Open Schedule',
    cancel: (typeof L==='function')?L('रद्द करें','Cancel'):'Cancel',
  };
  const secOpts = Object.entries(SEC).map(([k,v])=>{
    const name = isEn ? (v.label||k) : (v.hi||v.label||k);
    return `<option value="${k}">${name}</option>`;
  }).join('');
  
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">${escHtml(lb.title)}</div>
    <div class="field" style="margin-bottom:14px">
      <label>${lb.month}</label>
      <select class="inp-field" id="sb_month" onchange="_sbUpdateDayOptions()">${monthOpts}</select>
    </div>
    <div class="field" style="margin-bottom:14px">
      <label>${escHtml(lb.section)}</label>
      <select class="inp-field" id="sb_sec">
        <option value="ALL">${lb.allSec}</option>
        ${secOpts}
      </select>
    </div>
    <div class="field" style="margin-bottom:10px">
      <label>${lb.dateRange}</label>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" id="sbRangeFull" class="sb-range-btn on" onclick="_sbSetRangeMode('full')"
          style="flex:1;padding:10px 8px;border-radius:10px;border:1.5px solid var(--m1);background:rgba(249,115,22,.12);color:var(--m1);font-size:13px;font-weight:800;cursor:pointer">${lb.fullMonth}</button>
        <button type="button" id="sbRangeCustom" class="sb-range-btn" onclick="_sbSetRangeMode('custom')"
          style="flex:1;padding:10px 8px;border-radius:10px;border:1.5px solid var(--border2);background:var(--card);color:var(--muted2);font-size:13px;font-weight:800;cursor:pointer">${lb.customDates}</button>
      </div>
    </div>
    <div id="sbCustomRangeFields" style="display:none;margin-bottom:14px">
      <div style="display:flex;gap:10px;align-items:flex-end">
        <div class="field" style="flex:1;margin:0">
          <label style="font-size:12px">${lb.from}</label>
          <select class="inp-field" id="sb_dayFrom"></select>
        </div>
        <div style="padding-bottom:12px;color:var(--muted2);font-weight:800">→</div>
        <div class="field" style="flex:1;margin:0">
          <label style="font-size:12px">${lb.to}</label>
          <select class="inp-field" id="sb_dayTo"></select>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted2);margin-top:6px">${lb.hint}</div>
    </div>
    <button type="button" class="submit-btn" id="sbOpenBtn" onclick="event.preventDefault();event.stopPropagation();loadScheduleBuilder()">${lb.open}</button>
    <button type="button" class="cancel-btn" id="sbCancelBtn" onclick="event.preventDefault();closeModal()">${lb.cancel}</button>`);
  setTimeout(_sbUpdateDayOptions, 30);
}

let _sbRangeMode = 'full'; // 'full' | 'custom'

function _sbSetRangeMode(mode){
  _sbRangeMode = mode;
  const fullBtn = document.getElementById('sbRangeFull');
  const custBtn = document.getElementById('sbRangeCustom');
  const fields = document.getElementById('sbCustomRangeFields');
  if(!fullBtn || !custBtn || !fields) return;
  if(mode === 'custom'){
    fullBtn.style.borderColor = 'var(--border2)';
    fullBtn.style.background = 'var(--card)';
    fullBtn.style.color = 'var(--muted2)';
    custBtn.style.borderColor = 'var(--m1)';
    custBtn.style.background = 'rgba(249,115,22,.12)';
    custBtn.style.color = 'var(--m1)';
    fields.style.display = 'block';
    _sbUpdateDayOptions();
  } else {
    custBtn.style.borderColor = 'var(--border2)';
    custBtn.style.background = 'var(--card)';
    custBtn.style.color = 'var(--muted2)';
    fullBtn.style.borderColor = 'var(--m1)';
    fullBtn.style.background = 'rgba(249,115,22,.12)';
    fullBtn.style.color = 'var(--m1)';
    fields.style.display = 'none';
  }
}

function _sbUpdateDayOptions(){
  const monthEl = document.getElementById('sb_month');
  const fromEl = document.getElementById('sb_dayFrom');
  const toEl = document.getElementById('sb_dayTo');
  if(!monthEl || !fromEl || !toEl) return;
  const [yr, mo] = monthEl.value.split('-').map(Number);
  const dim = new Date(yr, mo, 0).getDate();
  const curFrom = parseInt(fromEl.value, 10) || 1;
  const curTo = parseInt(toEl.value, 10) || dim;
  fromEl.innerHTML = Array.from({length: dim}, (_,i) => {
    const d = i + 1;
    return `<option value="${d}"${d===Math.min(curFrom,dim)?' selected':''}>${d}</option>`;
  }).join('');
  toEl.innerHTML = Array.from({length: dim}, (_,i) => {
    const d = i + 1;
    return `<option value="${d}"${d===Math.min(Math.max(curTo,1),dim)?' selected':''}>${d}</option>`;
  }).join('');
  // sensible default for custom: mid-month example 11–20 if available
  if(_sbRangeMode === 'custom' && !fromEl.dataset.inited){
    fromEl.value = String(Math.min(11, dim));
    toEl.value = String(Math.min(20, dim));
    fromEl.dataset.inited = '1';
  }
}

const WOFF_DOW = {SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};

async function loadScheduleBuilder(){
  try{
  // Instant UI feedback — button feels responsive on whole surface
  const _openBtn = document.getElementById('sbOpenBtn');
  if(_openBtn){
    _openBtn.classList.add('is-busy');
    _openBtn.disabled = true;
    const _prev = _openBtn.textContent;
    _openBtn.dataset.prevLabel = _prev || '';
    _openBtn.textContent = (typeof L==='function') ? L('⏳ खोल रहे हैं…','⏳ Opening…') : '⏳ Opening…';
  }
  _sbSelStart=null; _sbSelEnd=null; _sbSelectedCells=[]; _sbSelecting=false;
  const monthKey = document.getElementById('sb_month') && document.getElementById('sb_month').value;
  const secFilter = document.getElementById('sb_sec').value;
  if(!monthKey){
    const b=document.getElementById('sbOpenBtn');
    if(b){ b.disabled=false; b.classList.remove('is-busy'); if(b.dataset.prevLabel) b.textContent=b.dataset.prevLabel; }
    toast(L('⚠️ महीना चुनें','⚠️ Select month'));return;
  }
  const [yr, mo] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  // Custom date range support (e.g. 11–20 Oct)
  let dayFrom = 1, dayTo = daysInMonth;
  if(typeof _sbRangeMode !== 'undefined' && _sbRangeMode === 'custom'){
    const fEl = document.getElementById('sb_dayFrom');
    const tEl = document.getElementById('sb_dayTo');
    dayFrom = Math.max(1, Math.min(daysInMonth, parseInt(fEl && fEl.value, 10) || 1));
    dayTo   = Math.max(1, Math.min(daysInMonth, parseInt(tEl && tEl.value, 10) || daysInMonth));
    if(dayFrom > dayTo){ const tmp=dayFrom; dayFrom=dayTo; dayTo=tmp; }
  }
  window._sbDayFrom = dayFrom;
  window._sbDayTo = dayTo;
  window._sbDaysInMonth = daysInMonth;
  const dayNums = Array.from({length: dayTo - dayFrom + 1}, (_,i)=> dayFrom + i);

  // Load existing saved schedule if any — guard against null/undefined
  const allScheds = getSchedules() || {};
  const saved = allScheds[monthKey.replace('-','_')] || {};
  
  // Ensure custom order is loaded so sequence matches main Schedule view
  try{ await loadCustomEmpOrder(); }catch(e){}

  let emps = (getEmps() || []).filter(e => e && e.status !== 'resigned');
  if(secFilter !== 'ALL') emps = emps.filter(e => e.sec === secFilter);

  // ── Sort: Excel Section → Responsibility → Weekly Off (MON…SUN) → Name ──
  const _WOFF_ORDER = {MON:0,TUE:1,WED:2,THU:3,FRI:4,SAT:5,SUN:6};
  const _secLabel = (e) => {
    const s = (typeof getEmpSection==='function') ? getEmpSection(e) : '';
    return (s || String(e.section||e.sec||'').trim() || 'zzz').toLowerCase();
  };
  const _respLabel = (e) => {
    const r = (typeof getEmpResp==='function') ? getEmpResp(e) : '';
    return (r || String(e.resp||e.responsibility||'').trim() || 'zzz').toLowerCase();
  };
  const _woffRank = (e) => {
    const w = String(e.woff || 'SUN').toUpperCase().slice(0,3);
    return _WOFF_ORDER[w] != null ? _WOFF_ORDER[w] : 99;
  };
  emps.sort((a,b) => {
    const sCmp = _secLabel(a).localeCompare(_secLabel(b));
    if(sCmp) return sCmp;
    const rCmp = _respLabel(a).localeCompare(_respLabel(b));
    if(rCmp) return rCmp;
    const wA = _woffRank(a), wB = _woffRank(b);
    if(wA !== wB) return wA - wB;
    return String(a.name||'').localeCompare(String(b.name||''), undefined, {sensitivity:'base'});
  });

  // Build grid — IN-TABLE sticky thead (same columns as body = pixel-perfect alignment on laptop)
  const _sbColW = 30; // day column width (CSS must not override without matching)
  const _sbNameW = 100;
  const headerDaysTh = dayNums.map(d=>{
    const dt = new Date(yr, mo-1, d);
    const dayIdx = d - 1;
    const dow = ['S','M','T','W','T','F','S'][dt.getDay()];
    const sun = dt.getDay()===0;
    return `<th data-sb-date-col="${d}" class="sb-date-col" style="width:${_sbColW}px;min-width:${_sbColW}px;max-width:${_sbColW}px;box-sizing:border-box;text-align:center;padding:4px 0 2px;margin:0;border:0;border-right:1px solid rgba(148,163,184,.12);font-size:12px;font-weight:900;color:${sun?'#f87171':'#e2e8f0'};line-height:1.15;font-family:system-ui,-apple-system,sans-serif;background:#1e293b;vertical-align:bottom">
      <div style="font-size:13px;font-weight:900;letter-spacing:-0.02em">${d}</div>
      <div style="font-size:10px;font-weight:700;opacity:.9;margin-top:1px">${dow}</div>
      <button type="button" class="sb-col-cp" data-day="${dayIdx}" onclick="event.stopPropagation();_sbColBtnClick(${dayIdx})"
        title="Copy/Paste column" aria-label="Copy column" style="display:block;margin:3px auto 0;width:22px;height:18px;line-height:16px;padding:0;border-radius:4px;border:1px solid rgba(148,163,184,.45);background:rgba(30,41,59,.9);color:#cbd5e1;font-size:10px;font-weight:900;cursor:pointer">↓</button>
    </th>`;
  }).join('');

  const rows = emps.map((emp,rowIdx) => {
    if(!emp || !emp.id) return '';
    // Ensure empSaved is always an array (Firebase converts arrays to objects)
    // Match getBaseShift lookup: emp.id, emp.empId, empCode (schedules may be keyed by code)
    let empSaved = null;
    if(saved){
      if(emp.id && saved[emp.id] != null) empSaved = saved[emp.id];
      else if(emp.empId && saved[String(emp.empId).trim()] != null) empSaved = saved[String(emp.empId).trim()];
      else if(emp.empCode && saved[String(emp.empCode).trim()] != null) empSaved = saved[String(emp.empCode).trim()];
      else if(emp.empId){
        const code = String(emp.empId).trim().replace(/^0+/,'');
        for(const k of Object.keys(saved)){
          if(String(k).replace(/^0+/,'') === code){ empSaved = saved[k]; break; }
        }
      }
    }
    if(empSaved && !Array.isArray(empSaved)){
      empSaved = Array.from({length: daysInMonth}, (_,i) => empSaved[i] || empSaved[String(i)] || '');
    }
    if(!empSaved) empSaved = Array(daysInMonth).fill('');
    // Also merge any overrides already on calendar (getShift) so existing days show in builder
    try{
      for(let di=0; di<daysInMonth; di++){
        if(empSaved[di]) continue;
        const ds = `${yr}-${String(mo).padStart(2,'0')}-${String(di+1).padStart(2,'0')}`;
        if(typeof getShift === 'function'){
          const gs = getShift(emp, ds);
          if(gs) empSaved[di] = gs;
        }
      }
    }catch(e){}
    
    const empWoffDow = emp.woff ? (WOFF_DOW[emp.woff] ?? -1) : -1;
    
    // Build approved leave dates for this employee in this month (local YMD, match emp.id OR empCode)
    const empLeaves = new Set();
    try{
      const idSet = new Set([String(emp.id||''), String(emp.empId||''), String(emp.empCode||'')].filter(Boolean));
      (getLeaves()||[]).filter(l => l && l.status === 'approved' && l.from && l.to && (
        idSet.has(String(l.empId||'')) || idSet.has(String(l.empObjId||'')) || idSet.has(String(l.empCode||''))
      )).forEach(l => {
        const fromD = new Date(String(l.from).slice(0,10)+'T12:00:00');
        const toD = new Date(String(l.to).slice(0,10)+'T12:00:00');
        if(isNaN(fromD.getTime()) || isNaN(toD.getTime())) return;
        for(let dd = new Date(fromD); dd <= toD; dd.setDate(dd.getDate() + 1)){
          const y=dd.getFullYear(), m=String(dd.getMonth()+1).padStart(2,'0'), da=String(dd.getDate()).padStart(2,'0');
          empLeaves.add(y+'-'+m+'-'+da);
        }
      });
    }catch(leaveErr){ console.warn('Leave parse error for', emp.id, leaveErr); }
    
    const cells = dayNums.map((d,i) => {
      const dayIdx = d - 1; // always 0-based index in full month array
      const dateStr = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isLeaveDate = empLeaves.has(dateStr);
      let val = empSaved[dayIdx] || (function(){
        const mk2 = monthKey.replace('-','_');
        if(typeof EXCEL_SCHEDULES !== 'undefined' && EXCEL_SCHEDULES[mk2] && EXCEL_SCHEDULES[mk2][emp.id]){
          return EXCEL_SCHEDULES[mk2][emp.id][dayIdx] || '';
        }
        if(yr===2026 && mo===3 && emp.ms) return emp.ms[dayIdx]||'';
        return '';
      })();
      // If approved leave exists and cell is empty or not already L, mark as L
      if(isLeaveDate && val !== 'L') val = 'L';
      const cls = val ? cellClass(val) : '';
      const isWoffDay = empWoffDow !== -1 && new Date(yr, mo-1, d).getDay() === empWoffDow;
      const leaveStyle = isLeaveDate ? 'outline:2px solid #f43f5e;border-radius:4px;box-shadow:0 0 4px rgba(244,63,94,.5);' : '';
      const leaveClick = isLeaveDate ? ` onclick="_confirmLeaveOverride(this,'${emp.id}',${dayIdx},'${dateStr}')"` : '';
      return `<td style="padding:0;margin:0;border:0;border-right:1px solid rgba(148,163,184,.06);width:${_sbColW}px;min-width:${_sbColW}px;max-width:${_sbColW}px;box-sizing:border-box;${isWoffDay?'background:rgba(249,115,22,0.06);':''}" title="${isLeaveDate?'🛡️ Approved Leave':isWoffDay?emp.woff+' (Weekly Off)':''}">
        <div class="shc ${cls}" style="width:100%;height:28px;font-size:12px;font-weight:800;cursor:pointer;box-sizing:border-box;touch-action:none;user-select:none;display:flex;align-items:center;justify-content:center;${leaveStyle}${isWoffDay&&!val&&!isLeaveDate?'border:1px dashed rgba(249,115,22,0.3);':''}"${leaveClick}
          data-empid="${emp.id}" data-day="${dayIdx}" data-row="${rowIdx}" data-val="${val}" data-isleave="${isLeaveDate?'1':'0'}">
          ${val ? cellDisp(val) : '—'}
        </div>
      </td>`;
    }).join('');
    const s = SEC[emp.sec] || {};
    return `<tr>
      <td style="padding:3px 4px 3px 6px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;position:sticky;left:0;background:#0f172a;z-index:2;min-width:${_sbNameW}px;width:${_sbNameW}px;max-width:${_sbNameW}px;box-sizing:border-box;border:0;border-right:1px solid rgba(148,163,184,.15)">
        <div style="display:flex;align-items:center;gap:4px">
          <button type="button" class="sb-row-cp" data-row="${rowIdx}" onclick="event.stopPropagation();_sbRowBtnClick(${rowIdx})"
            title="C = Copy row · P = Paste row" style="flex-shrink:0;width:22px;height:28px;line-height:26px;padding:0;border-radius:6px;border:1px solid rgba(148,163,184,.35);background:rgba(148,163,184,.12);color:#94a3b8;font-size:10px;font-weight:900;cursor:pointer">C</button>
          <div style="min-width:0;overflow:hidden;text-overflow:ellipsis">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${s.color||'#fff'};margin-right:3px"></span>${escHtml(emp.name.split(' ')[0])}
            ${emp.woff?`<span style="font-size:9px;color:#fb923c;font-weight:700;display:block;margin-top:2px">${emp.woff} off</span>`:''}
          </div>
        </div>
      </td>
      ${cells}
    </tr>`;
  }).join('');

  const monthLabel = new Date(yr, mo-1, 1).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
  const rangeLabel = (dayFrom === 1 && dayTo === daysInMonth)
    ? monthLabel
    : `${dayFrom}–${dayTo} ${monthLabel}`;

  const totalTableW = _sbNameW + dayNums.length * _sbColW;

  openModal(`<div class="modal-handle"></div>
    <div id="sbStickyHeader" style="position:sticky;top:0;z-index:10;background:var(--bg);padding-bottom:6px;flex-shrink:0">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="modal-title" style="margin:0;font-size:18px;font-weight:900;color:#f8fafc;letter-spacing:-0.01em">📅 ${rangeLabel}</div>
        <button onclick="openScheduleBuilder()" style="background:none;border:1px solid var(--border2);border-radius:8px;color:var(--muted);padding:5px 10px;cursor:pointer;font-size:12px">← ${(typeof L==='function')?L('बदलें','Change'):'Change'}</button>
      </div>
      <div id="sbPrimaryFilterRow" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        <span style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px">Filter</span>
        <button type="button" class="sb-prim-btn" data-prim="section" onclick="_sbSetPrimaryFilter('section')" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">Section</button>
        <button type="button" class="sb-prim-btn" data-prim="designation" onclick="_sbSetPrimaryFilter('designation')" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">Designation</button>
        <button type="button" class="sb-prim-btn" data-prim="machine" onclick="_sbSetPrimaryFilter('machine')" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">Machine</button>
        <button type="button" class="sb-prim-btn" data-prim="responsibility" onclick="_sbSetPrimaryFilter('responsibility')" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">Responsibility</button>
      </div>
      <div id="sbSubFilterRow" style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-bottom:8px;min-height:28px"></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div id="sbCellLegend" style="font-size:12px;color:#94a3b8;flex:1;min-width:120px;line-height:1.35">${(typeof L==='function')?L('🖱️ Drag से चुनें · Double-tap = Copy','🖱️ Drag to select · Double-tap = Copy'):'🖱️ Drag to select · Double-tap = Copy'}</div>
        <button type="button" onclick="clearScheduleBuilderGrid()"
          style="background:rgba(244,63,94,.12);border:1.5px solid rgba(244,63,94,.45);border-radius:10px;
          color:#fb7185;font-size:12px;font-weight:800;padding:8px 12px;cursor:pointer;white-space:nowrap;
          display:flex;align-items:center;gap:5px;font-family:inherit">
          🗑️ ${(typeof L==='function')?L('क्लियर','Clear'):'Clear'}
        </button>
        <select id="sbAutoSort" onchange="window._sbAutoSort=this.value;try{localStorage.setItem('mp_sb_auto_sort',this.value)}catch(e){}"
          title="Auto Generate sequence: Section / Designation / Machine"
          style="font-size:11px;font-weight:700;padding:6px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);max-width:150px">
          <option value="section">Sequence: Section</option>
          <option value="designation">Sequence: Designation</option>
          <option value="machine">Sequence: Machine</option>
        </select>
        <button type="button" onclick="autoGenSchedule('${monthKey}')"
          style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:10px;
          color:#fff;font-size:12px;font-weight:800;padding:8px 14px;cursor:pointer;white-space:nowrap;
          display:flex;align-items:center;gap:5px;font-family:inherit">
          🤖 ${(typeof L==='function')?L('Auto बनाएं','Auto Generate'):'Auto Generate'}
        </button>
      </div>
    </div>
    <div id="sbToolbar" style="display:none"></div>
    <!-- Single scroll container: thead + tbody share columns → no laptop misalignment -->
    <div id="sbBodyScroll" style="flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;margin-bottom:8px;border:1px solid var(--border2);border-radius:8px">
      <table id="sbGridTable" style="border-collapse:collapse;border-spacing:0;table-layout:fixed;width:${totalTableW}px;min-width:${totalTableW}px;max-width:${totalTableW}px">
        <colgroup>
          <col style="width:${_sbNameW}px">
          ${dayNums.map(()=>`<col style="width:${_sbColW}px">`).join('')}
        </colgroup>
        <thead id="sb_thead" class="sb-thead-sticky" style="position:sticky;top:0;z-index:6">
          <tr>
            <th id="sbCornerHeader" style="position:sticky;left:0;z-index:7;width:${_sbNameW}px;min-width:${_sbNameW}px;max-width:${_sbNameW}px;box-sizing:border-box;padding:6px 8px;font-size:12px;font-weight:900;color:#e2e8f0;background:#1e293b;text-align:center;border:0;border-right:1px solid rgba(148,163,184,.15);box-shadow:2px 0 6px rgba(0,0,0,.35)">${(typeof L==='function')?L('कर्मचारी','Employee'):'Employee'}</th>
            ${headerDaysTh}
          </tr>
        </thead>
        <tbody id="sb_tbody">${rows}</tbody>
      </table>
    </div>
    <div id="sbFooterBar" style="display:flex;gap:10px;flex-shrink:0;position:sticky;bottom:0;z-index:10;background:var(--bg);padding-top:8px;padding-bottom:max(4px,env(safe-area-inset-bottom,0px))">
      <button class="submit-btn" style="flex:1" onclick="saveScheduleBuilder('${monthKey}')">💾 ${(typeof L==='function')?L('Save करें','Save'):'Save'}</button>
      <button class="cancel-btn" style="flex:1" onclick="closeModal()">${(typeof L==='function')?L('रद्द करें','Cancel'):'Cancel'}</button>
    </div>`);
  try{ _sbLockLandscape(true); }catch(e){}
  setTimeout(initSBSelection, 50);
  setTimeout(_sbPositionStickyTableHeader, 60);
  setTimeout(()=>{ try{ _sbRefreshRowColButtons(); }catch(e){} }, 80);
  setTimeout(()=>{
    try{
      const sel = document.getElementById('sbAutoSort');
      if(sel){
        const v = window._sbAutoSort || localStorage.getItem('mp_sb_auto_sort') || 'section';
        if(['section','designation','machine'].includes(v)) sel.value = v;
      }
      if(!window._sbPrimaryFilter) window._sbPrimaryFilter = 'section';
      if(!window._sbSubSelected) window._sbSubSelected = new Set();
      _sbRenderPrimaryFilterUI();
      _sbRenderSubFilterChips();
      _sbApplyEmpFilterVisibility();
    }catch(e){}
  }, 90);
  // Keep thead sticky under title bar height
  setTimeout(()=>{
    try{
      const hdr = document.getElementById('sbStickyHeader');
      const thead = document.getElementById('sb_thead');
      if(hdr && thead){
        // thead sticks at top of sbBodyScroll (not under page header)
        thead.style.top = '0px';
      }
    }catch(e){}
  }, 90);
  // Hint rotate if still portrait on phone
  try{
    if(window.matchMedia && window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches){
      toast((typeof L==='function')?L('📱 बेहतर व्यू के लिए फ़ोन Landscape घुमाएँ','📱 Rotate phone to Landscape for best view'):'📱 Rotate to Landscape');
    }
  }catch(e){}
  }catch(err){
    console.error('loadScheduleBuilder error:',err);
    const b=document.getElementById('sbOpenBtn');
    if(b){ b.disabled=false; b.classList.remove('is-busy'); if(b.dataset.prevLabel) b.textContent=b.dataset.prevLabel; }
    toast('❌ Error: '+err.message);
  }
}

// _sbData holds current edits: { empId: [array of shifts] }
let _sbData = {};

function cycleSBCell(el, empId, dayIdx, monthKey){
  const work = (typeof _sbActiveShiftCodes==='function') ? _sbActiveShiftCodes() : ['D','N'];
  const order = [...work, 'O','L','G','C/O','H','OD','HLF','Ab',''];
  const cur = el.dataset.val || '';
  const next = order[(order.indexOf(cur)+1) % order.length];
  _sbSetCellValue(el, next);
}

// ════════════════════════════════════════════════════════════════
// SCHEDULE BUILDER — Excel-like drag-select, copy, paste, quick-fill
// ════════════════════════════════════════════════════════════════
let _sbSelecting=false;
let _sbSelStart=null;   // {row,day}
let _sbSelEnd=null;     // {row,day}
let _sbSelectedCells=[];
let _sbClipboard=null;  // {grid:[[val,...],...], rows, cols}

function _sbSetCellValue(cell, val){
  const empId=cell.dataset.empid;
  const dayIdx=+cell.dataset.day;
  cell.dataset.val=val;
  const selected=cell.classList.contains('sb-selected');
  cell.className='shc '+(val?cellClass(val):'')+(selected?' sb-selected':'');
  cell.textContent=val?cellDisp(val):'—';
  const dim = window._sbDaysInMonth || 31;
  if(!_sbData[empId] || _sbData[empId].length < dim){
    const base = Array.isArray(_sbData[empId]) ? _sbData[empId].slice() : new Array(dim).fill('');
    while(base.length < dim) base.push('');
    // Seed from visible cells (data-day is full-month index)
    const sbTbody=document.getElementById('sb_tbody');
    const allCells=sbTbody?sbTbody.querySelectorAll(`[data-empid="${empId}"]`):[];
    allCells.forEach(c=>{
      const di=+c.dataset.day;
      if(!isNaN(di) && di>=0 && di<dim) base[di]=c.dataset.val||'';
    });
    _sbData[empId]=base;
  }
  if(dayIdx>=0 && dayIdx < _sbData[empId].length) _sbData[empId][dayIdx]=val;
}

function _sbPositionStickyTableHeader(){
  // Title + selection toolbar stick at top of modal; date thead sticks inside #sbBodyScroll
  const headerEl=document.getElementById('sbStickyHeader');
  const toolbarEl=document.getElementById('sbToolbar');
  if(!headerEl) return;
  const headerH=headerEl.offsetHeight || 0;
  if(toolbarEl){
    toolbarEl.style.position='sticky';
    toolbarEl.style.top=headerH+'px';
    toolbarEl.style.zIndex='9';
    toolbarEl.style.background='var(--bg)';
  }
  // thead is inside the table — sticky top:0 of body scroll is correct
  const thead = document.getElementById('sb_thead');
  if(thead){ thead.style.top = '0px'; thead.style.zIndex = '6'; }
}

function _sbSyncDateHdrScroll(){
  // No-op: date header is now in-table thead (#sb_thead) — single scroll, always aligned.
}

function initSBSelection(){
  const tbody=document.getElementById('sb_tbody');
  if(!tbody) return;
  // Inject selection highlight style once
  if(!document.getElementById('sbSelectionStyle')){
    const style=document.createElement('style');
    style.id='sbSelectionStyle';
    style.textContent='.sb-selected{outline:2px solid #3b82f6 !important;box-shadow:0 0 0 2px rgba(59,130,246,.3) !important;position:relative;z-index:2;}';
    document.head.appendChild(style);
  }
  tbody.querySelectorAll('.shc[data-isleave="0"]').forEach(cell=>{
    cell.addEventListener('pointerdown', e=>{
      e.preventDefault();
      _sbSelecting=true;
      _sbSelStart={row:+cell.dataset.row, day:+cell.dataset.day};
      _sbSelEnd={row:+cell.dataset.row, day:+cell.dataset.day};
      _sbUpdateSelectionVisual();
    });
    cell.addEventListener('dblclick', e=>{
      e.preventDefault();
      _sbHandleDoubleClick(cell);
    });
  });
  tbody.addEventListener('pointermove', e=>{
    if(!_sbSelecting) return;
    const el=document.elementFromPoint(e.clientX, e.clientY);
    const cellEl=el?.closest('.shc[data-isleave="0"]');
    if(cellEl){
      const r=+cellEl.dataset.row, d=+cellEl.dataset.day;
      if(!_sbSelEnd || _sbSelEnd.row!==r || _sbSelEnd.day!==d){
        _sbSelEnd={row:r, day:d};
        _sbUpdateSelectionVisual();
      }
    }
  });
  document.addEventListener('pointerup', _sbFinishSelection);
}

function _sbFinishSelection(){
  if(!_sbSelecting) return;
  _sbSelecting=false;
  _sbShowToolbar();
}

function _sbUpdateSelectionVisual(){
  if(!_sbSelStart || !_sbSelEnd) return;
  const r1=Math.min(_sbSelStart.row,_sbSelEnd.row), r2=Math.max(_sbSelStart.row,_sbSelEnd.row);
  const d1=Math.min(_sbSelStart.day,_sbSelEnd.day), d2=Math.max(_sbSelStart.day,_sbSelEnd.day);
  const tbody=document.getElementById('sb_tbody');
  if(!tbody) return;
  _sbSelectedCells=[];
  tbody.querySelectorAll('.shc').forEach(cell=>{
    const row=+cell.dataset.row, day=+cell.dataset.day;
    if(row>=r1&&row<=r2&&day>=d1&&day<=d2){
      cell.classList.add('sb-selected');
      _sbSelectedCells.push(cell);
    }else{
      cell.classList.remove('sb-selected');
    }
  });
}

function _sbClearSelectionOnly(){
  _sbSelStart=null; _sbSelEnd=null;
  document.querySelectorAll('#sb_tbody .sb-selected').forEach(c=>c.classList.remove('sb-selected'));
  _sbSelectedCells=[];
  _sbShowToolbar();
}

function _sbShowToolbar(){
  const bar=document.getElementById('sbToolbar');
  if(!bar) return;
  if(!_sbSelectedCells.length){ bar.innerHTML=''; bar.style.display='none'; setTimeout(_sbPositionStickyTableHeader,10); return; }
  const activeCodes = (typeof _sbActiveShiftCodes==='function') ? _sbActiveShiftCodes() : ['D','N'];
  const clearLbl = (typeof L==='function')?L('✖ साफ','✖ Clear'):'✖ Clear';
  const values=[
    ...activeCodes.map(c=>({v:c,l:c})),
    {v:'O',l:'O'},{v:'L',l:'L'},
    {v:'G',l:'G'},{v:'C/O',l:'CO'},{v:'H',l:'H'},{v:'OD',l:'OD'},
    {v:'HLF',l:'½'},{v:'Ab',l:'Ab'},{v:'',l:clearLbl}
  ];
  const selLbl = (typeof L==='function')
    ? L(_sbSelectedCells.length+' Cell चुने गए', _sbSelectedCells.length+' cells selected')
    : (_sbSelectedCells.length+' cells selected');
  const fillLbl = (typeof L==='function')?L('Tap to fill:','Tap to fill:'):'Tap to fill:';
  bar.style.display='block';
  bar.innerHTML=`
    <div class="sb-sel-bar" style="background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.3);border-radius:10px;padding:6px 8px;margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:800;color:var(--text)">${selLbl}</span>
        <div style="display:flex;gap:5px;align-items:center">
          <button type="button" onclick="_sbCopySelection()" style="background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer">📋 Copy</button>
          ${_sbClipboard?`<button type="button" onclick="_sbPasteSelection()" style="background:rgba(96,165,250,.12);color:#60a5fa;border:1px solid rgba(96,165,250,.3);border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer">📥 Paste (${_sbClipboard.rows}×${_sbClipboard.cols})</button>`:''}
          <button type="button" onclick="_sbClearSelectionOnly()" style="background:none;color:#64748b;border:1px solid var(--border2);border-radius:8px;padding:4px 8px;font-size:11px;cursor:pointer">✕</button>
        </div>
      </div>
      <div style="font-size:9px;color:#64748b;margin:4px 0 2px">${fillLbl}</div>
      <div class="sb-fill-chips" style="display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;flex-wrap:nowrap">
        ${values.map(o=>`<button type="button" onclick="_sbFillSelection('${o.v}')" style="flex-shrink:0;min-width:32px;padding:5px 7px;border-radius:6px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:11px;font-weight:800;cursor:pointer">${o.l}</button>`).join('')}
      </div>
    </div>`;
  setTimeout(_sbPositionStickyTableHeader,10);
}


function _sbFillSelection(val){
  _sbSelectedCells.forEach(cell=>_sbSetCellValue(cell,val));
  toast(val?`✅ ${_sbSelectedCells.length} ${L("cells में",'cells set to')} '${cellDisp(val)}'`:L('✅ Cells साफ हो गए','✅ Cells cleared'));
}

function _sbCopySelection(){
  if(!_sbSelStart || !_sbSelEnd || !_sbSelectedCells.length) return;
  const r1=Math.min(_sbSelStart.row,_sbSelEnd.row), r2=Math.max(_sbSelStart.row,_sbSelEnd.row);
  const d1=Math.min(_sbSelStart.day,_sbSelEnd.day), d2=Math.max(_sbSelStart.day,_sbSelEnd.day);
  const grid=[];
  for(let r=r1;r<=r2;r++){
    const rowVals=[];
    for(let d=d1;d<=d2;d++){
      const cell=document.querySelector(`#sb_tbody .shc[data-row="${r}"][data-day="${d}"]`);
      rowVals.push(cell?cell.dataset.val||'':'');
    }
    grid.push(rowVals);
  }
  _sbClipboard={grid, rows:r2-r1+1, cols:d2-d1+1, source:'cells', sourceRow:null, sourceCol:null};
  toast(`📋 ${_sbClipboard.rows}×${_sbClipboard.cols} ${L('Cells Copy हुए','cells copied')}`);
  try{ _sbRefreshRowColButtons(); }catch(e){}
  _sbShowToolbar();
}

function _sbPasteSelection(){
  // Excel-style: paste full clipboard from top-left of current selection (even 1 cell)
  if(!_sbClipboard || !_sbClipboard.grid || !_sbClipboard.grid.length){
    toast(L('⚠️ पहले Copy करें','⚠️ Copy first')); return;
  }
  if(!_sbSelStart){ toast(L('⚠️ जहाँ Paste करना है वहाँ cell चुनें','⚠️ Select the cell where you want to paste')); return; }
  const end = _sbSelEnd || _sbSelStart;
  const r0 = Math.min(_sbSelStart.row, end.row);
  const d0 = Math.min(_sbSelStart.day, end.day);
  const rows = _sbClipboard.rows || _sbClipboard.grid.length;
  const cols = _sbClipboard.cols || (_sbClipboard.grid[0]||[]).length;
  let filled = 0;
  for(let ri=0; ri<rows; ri++){
    for(let ci=0; ci<cols; ci++){
      const srcVal = (_sbClipboard.grid[ri] && _sbClipboard.grid[ri][ci] != null) ? _sbClipboard.grid[ri][ci] : '';
      const cell = document.querySelector(`#sb_tbody .shc[data-row="${r0+ri}"][data-day="${d0+ci}"][data-isleave="0"]`);
      if(cell){ _sbSetCellValue(cell, srcVal); filled++; }
    }
  }
  _sbSelStart = {row:r0, day:d0};
  _sbSelEnd = {row:r0+rows-1, day:d0+cols-1};
  try{ _sbUpdateSelectionVisual(); }catch(e){}
  try{ _sbShowToolbar(); }catch(e){}
  toast(filled ? ('✅ Paste · '+rows+'×'+cols) : L('⚠️ Paste target नहीं मिला','⚠️ Paste target not found'));
}

/** Copy entire employee row */
function _sbCopyEntireRow(rowIdx){
  const cells = [...document.querySelectorAll('#sb_tbody .shc[data-row="'+rowIdx+'"]')];
  if(!cells.length){ toast(L('⚠️ Row खाली','⚠️ Row is empty')); return; }
  cells.sort((a,b)=> (+a.dataset.day) - (+b.dataset.day));
  const grid = [cells.map(c=>c.dataset.val||'')];
  _sbClipboard = { grid, rows:1, cols:grid[0].length, source:'row', sourceRow:rowIdx, sourceCol:null };
  _sbSelStart = {row:rowIdx, day:+cells[0].dataset.day};
  _sbSelEnd = {row:rowIdx, day:+cells[cells.length-1].dataset.day};
  try{ _sbUpdateSelectionVisual(); }catch(e){}
  try{ _sbRefreshRowColButtons(); }catch(e){}
  try{ _sbShowToolbar(); }catch(e){}
  toast('📋 Row Copy · '+grid[0].length+' days');
}

/** Paste clipboard into entire target row (from first day) */
function _sbPasteEntireRow(rowIdx){
  if(!_sbClipboard || !_sbClipboard.grid){ toast((typeof L==='function')?L('⚠️ पहले कोई Row/Cells Copy करें','⚠️ Copy a row/cells first'):'⚠️ Copy first'); return; }
  const srcRow = _sbClipboard.grid[0] || [];
  const srcHasData = srcRow.some(v => v && String(v).trim());
  if(!srcHasData){
    const ok = confirm((typeof L==='function')
      ? L('Copied row खाली है — फिर भी paste करें? (मौजूदा shifts हट सकते हैं)','Copied row is empty — paste anyway? (may clear existing shifts)')
      : 'Copied row is empty — paste anyway?');
    if(!ok) return;
  }
  const cells = [...document.querySelectorAll('#sb_tbody .shc[data-row="'+rowIdx+'"][data-isleave="0"]')];
  if(!cells.length) return;
  cells.sort((a,b)=> (+a.dataset.day) - (+b.dataset.day));
  const srcCols = _sbClipboard.cols || (_sbClipboard.grid[0]||[]).length || srcRow.length;
  // If clipboard is multi-row, paste only first row of clipboard into this employee row
  cells.forEach((cell, i)=>{
    const srcVal = srcRow[i % srcCols] != null ? srcRow[i % srcCols] : '';
    _sbSetCellValue(cell, srcVal);
  });
  _sbSelStart = {row:rowIdx, day:+cells[0].dataset.day};
  _sbSelEnd = {row:rowIdx, day:+cells[cells.length-1].dataset.day};
  try{ _sbUpdateSelectionVisual(); }catch(e){}
  try{ _sbRefreshRowColButtons(); }catch(e){}
  toast('✅ Row Paste');
}

function _sbRowBtnClick(rowIdx){
  // Already source? second tap clears clipboard
  if(_sbClipboard && _sbClipboard.source==='row' && +_sbClipboard.sourceRow === +rowIdx){
    _sbClipboard = null;
    _sbRefreshRowColButtons();
    try{ toast((typeof L==='function')?L('Clipboard साफ़','Clipboard cleared'):'Clipboard cleared'); }catch(e){}
    return;
  }
  // Another row already copied → paste into this row
  if(_sbClipboard && _sbClipboard.source==='row' && _sbClipboard.sourceRow != null && +_sbClipboard.sourceRow !== +rowIdx){
    _sbPasteEntireRow(rowIdx);
    return;
  }
  // Default: copy this row
  _sbCopyEntireRow(rowIdx);
}

/** Copy entire day column */
function _sbCopyEntireCol(dayIdx){
  dayIdx = +dayIdx;
  const cells = [...document.querySelectorAll('#sb_tbody .shc[data-day="'+dayIdx+'"]')];
  if(!cells.length){ toast(L('⚠️ Column खाली','⚠️ Column is empty')); return; }
  cells.sort((a,b)=> (+a.dataset.row) - (+b.dataset.row));
  const grid = cells.map(c=>[c.dataset.val||'']);
  _sbClipboard = { grid, rows:grid.length, cols:1, source:'col', sourceCol:dayIdx, sourceRow:null };
  _sbSelStart = {row:+cells[0].dataset.row, day:dayIdx};
  _sbSelEnd = {row:+cells[cells.length-1].dataset.row, day:dayIdx};
  try{ _sbUpdateSelectionVisual(); }catch(e){}
  try{ _sbRefreshRowColButtons(); }catch(e){}
  try{ _sbShowToolbar(); }catch(e){}
  toast('📋 Column Copy · '+grid.length+' emp');
}

function _sbPasteEntireCol(dayIdx){
  dayIdx = +dayIdx;
  if(!_sbClipboard || !_sbClipboard.grid){ toast(L('⚠️ पहले Copy करें','⚠️ Copy first')); return; }
  const cells = [...document.querySelectorAll('#sb_tbody .shc[data-day="'+dayIdx+'"][data-isleave="0"]')];
  if(!cells.length) return;
  cells.sort((a,b)=> (+a.dataset.row) - (+b.dataset.row));
  // Prefer first column of clipboard
  cells.forEach((cell, i)=>{
    const ri = i % (_sbClipboard.rows || _sbClipboard.grid.length);
    const srcVal = (_sbClipboard.grid[ri] && _sbClipboard.grid[ri][0] != null) ? _sbClipboard.grid[ri][0] : '';
    _sbSetCellValue(cell, srcVal);
  });
  try{ _sbRefreshRowColButtons(); }catch(e){}
  toast('✅ Column Paste');
}

function _sbColBtnClick(dayIdx){
  if(_sbClipboard && _sbClipboard.source==='col' && +_sbClipboard.sourceCol === +dayIdx){
    _sbClipboard = null;
    _sbRefreshRowColButtons();
    try{ toast((typeof L==='function')?L('Clipboard साफ़','Clipboard cleared'):'Clipboard cleared'); }catch(e){}
    return;
  }
  if(_sbClipboard && _sbClipboard.source==='col' && _sbClipboard.sourceCol != null && +_sbClipboard.sourceCol !== +dayIdx){
    _sbPasteEntireCol(dayIdx);
    return;
  }
  _sbCopyEntireCol(dayIdx);
}

function _sbRefreshRowColButtons(){
  try{
    document.querySelectorAll('.sb-row-cp').forEach(btn=>{
      const r = +btn.getAttribute('data-row');
      const isSrc = _sbClipboard && _sbClipboard.source==='row' && +_sbClipboard.sourceRow === r;
      const canPaste = _sbClipboard && _sbClipboard.source==='row' && _sbClipboard.sourceRow != null && +_sbClipboard.sourceRow !== r;
      btn.textContent = isSrc ? 'C' : (canPaste ? 'P' : 'C');
      btn.style.background = isSrc ? 'rgba(34,197,94,.25)' : (canPaste ? 'rgba(96,165,250,.2)' : 'rgba(148,163,184,.12)');
      btn.style.color = isSrc ? '#22c55e' : (canPaste ? '#60a5fa' : '#94a3b8');
      btn.title = isSrc ? 'Copied row' : (canPaste ? 'Paste here' : 'Copy entire row');
    });
    document.querySelectorAll('.sb-col-cp').forEach(btn=>{
      const d = +btn.getAttribute('data-day');
      const isSrc = _sbClipboard && _sbClipboard.source==='col' && +_sbClipboard.sourceCol === d;
      const canPaste = _sbClipboard && _sbClipboard.source==='col' && _sbClipboard.sourceCol != null && +_sbClipboard.sourceCol !== d;
      btn.textContent = isSrc ? 'C' : (canPaste ? 'P' : 'C');
      btn.style.background = isSrc ? 'rgba(34,197,94,.25)' : (canPaste ? 'rgba(96,165,250,.2)' : 'rgba(148,163,184,.12)');
      btn.style.color = isSrc ? '#22c55e' : (canPaste ? '#60a5fa' : '#94a3b8');
      btn.title = isSrc ? 'Copied column' : (canPaste ? 'Paste here' : 'Copy entire column');
    });
  }catch(e){}
}


function _sbHandleDoubleClick(cell){
  const row=+cell.dataset.row, day=+cell.dataset.day;
  _sbSelStart={row,day};
  _sbSelEnd={row,day};
  _sbUpdateSelectionVisual();
  if(cell.dataset.val){
    _sbCopySelection(); // has a value — copy it for quick reuse elsewhere
  }else{
    _sbShowToolbar(); // empty — show quick-value picker
  }
}


// ════════════════════════════════════════════════════════════════
// AUTO SCHEDULE GENERATOR
// Logic: Each employee gets weekly off on their woff day (every week).
// Between off days: 6 working days alternating D ↔ N per block.
// Manager / General-only employees get G between weekly offs (never D/N/A/B/C).
// Starting shift is determined from last known D/N before the month.
// ════════════════════════════════════════════════════════════════

function findLastShiftBeforeMonth(emp, targetYr, targetMo, validShiftCodes){
  // Compatibility wrapper — day 1 of target month
  return findLastWorkShiftBeforeDate(emp, targetYr, targetMo, 1, validShiftCodes);
}

/**
 * Walk backwards from (yr, mo, day 1-based) exclusive to find last working shift
 * (D/N/A/B/C…). Skips O, L, empty, C/O, Ab, H, etc.
 * Returns { shift, dateStr } so rotation continues correctly across month/range boundaries.
 */
function findLastWorkShiftBeforeDate(emp, targetYr, targetMo, targetDay, validShiftCodes){
  const shiftSet = new Set(validShiftCodes || ['D','N']);
  const fbScheds = getSchedules() || {};
  const empId = emp && emp.id;

  const getMonthArr = (yr, mo)=>{
    const mk = `${yr}_${String(mo).padStart(2,'0')}`;
    let arr = null;
    if(fbScheds[mk] && empId && fbScheds[mk][empId]){
      arr = fbScheds[mk][empId];
      if(arr && !Array.isArray(arr)) arr = Array.from({length: new Date(yr, mo, 0).getDate()}, (_,i)=> arr[i]||arr[String(i)]||'');
    }
    if(!arr && typeof EXCEL_SCHEDULES !== 'undefined' && EXCEL_SCHEDULES[mk] && EXCEL_SCHEDULES[mk][empId]){
      arr = EXCEL_SCHEDULES[mk][empId];
    }
    if(!arr && yr===2026 && mo===3 && emp && emp.ms) arr = emp.ms;
    return arr || null;
  };

  // Also read live grid values if Schedule Builder is open (same month)
  const gridVals = {};
  try{
    const sbTbody = document.getElementById('sb_tbody');
    if(sbTbody && empId){
      sbTbody.querySelectorAll(`[data-empid="${empId}"]`).forEach(cell=>{
        const d = parseInt(cell.dataset.day, 10);
        if(Number.isFinite(d)) gridVals[d] = cell.dataset.val || '';
      });
    }
  }catch(e){}

  let yr = targetYr, mo = targetMo, day = targetDay - 1; // start at day before target
  if(day < 1){
    mo--;
    if(mo < 1){ mo = 12; yr--; }
    day = new Date(yr, mo, 0).getDate();
  }

  for(let attempt = 0; attempt < 400; attempt++){
    const daysInMo = new Date(yr, mo, 0).getDate();
    if(day > daysInMo) day = daysInMo;
    while(day >= 1){
      const dateStr = `${yr}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      let sh = '';
      // Prefer grid if same month as target (partial fills)
      if(yr===targetYr && mo===targetMo && gridVals[day-1] != null && gridVals[day-1] !== ''){
        sh = gridVals[day-1];
      } else {
        const arr = getMonthArr(yr, mo);
        if(arr) sh = arr[day-1] || '';
      }
      sh = String(sh||'').trim();
      // normalize common aliases
      if(sh==='CO' || sh==='C-OFF') sh = 'C/O';
      if(shiftSet.has(sh)){
        return { shift: sh, dateStr, offsAfter: 0 };
      }
      // skip O, L, blank, Ab, H, C/O, G for managers etc. — keep walking back
      day--;
    }
    // previous month
    mo--;
    if(mo < 1){ mo = 12; yr--; }
    if(yr < 2024) break;
    day = new Date(yr, mo, 0).getDate();
  }
  return { shift: (validShiftCodes && validShiftCodes[0]) || 'D', dateStr: '', offsAfter: 0 };
}


/** Clear all (non-leave-protected) cells in the open Schedule Builder grid for the visible date range */
function clearScheduleBuilderGrid(){
  const sbTbody = document.getElementById('sb_tbody');
  if(!sbTbody){ toast(L('⚠️ पहले Schedule खोलें','⚠️ Open Schedule Builder first')); return; }
  const msg = (typeof L==='function')
    ? L('सभी visible dates की shifts क्लियर करें? (Approved Leave सुरक्षित रहेगी)','Clear shifts on all visible dates? (Approved leaves stay protected)')
    : 'Clear all visible shifts? (Approved leaves stay protected)';
  if(!confirm(msg)) return;
  let n = 0;
  sbTbody.querySelectorAll('.shc').forEach(cell=>{
    if(cell.dataset.isleave === '1') return; // keep leave
    const prev = cell.dataset.val || '';
    if(!prev) return;
    if(typeof _sbSetCellValue==='function') _sbSetCellValue(cell, '');
    else {
      cell.dataset.val = '';
      cell.textContent = '—';
      cell.className = 'shc';
    }
    n++;
  });
  toast((typeof L==='function')?L('🗑️ '+n+' cells क्लियर','🗑️ '+n+' cells cleared'):('🗑️ '+n+' cells cleared'));
}


/**
 * True when this person must stay on General (G) only between weekly offs —
 * never rotated into D/N/A/B/C.
 * Detects: managers, employees whose existing/saved work shifts are G-only,
 * or whose last work shift before the range was G.
 */
function _empIsGeneralOnly(emp, schedule, dayFrom, dayTo, yr, mo, configShiftCodes){
  if(!emp) return false;
  try{
    if(emp.sec === 'MGR'
      || emp.isTeamManager === true
      || String(emp.accessLevel||'').toLowerCase()==='manager'
      || String(emp.role||'').toLowerCase()==='manager'
      || (typeof isManagerSelfRecord==='function' && isManagerSelfRecord(emp))){
      return true;
    }
  }catch(e){}
  // Explicit field on employee (if set)
  try{
    const fixed = String(emp.fixedShift || emp.defaultShift || emp.shiftType || emp.shift || '').trim().toUpperCase();
    if(fixed === 'G' || fixed === 'GENERAL' || fixed === 'GEN') return true;
  }catch(e){}

  const rot = new Set((configShiftCodes || ['D','N']).map(String));
  let gCount = 0, rotCount = 0;

  // 1) Current month schedule array (builder / loaded)
  if(Array.isArray(schedule)){
    const from = Math.max(0, (dayFrom||1)-1);
    const to = Math.min(schedule.length-1, (dayTo||schedule.length)-1);
    for(let i = from; i <= to; i++){
      const sh = String(schedule[i]||'').trim().toUpperCase();
      if(!sh || sh === '—' || sh === 'O' || sh === 'L' || sh === 'H' || sh === 'AB' || sh === 'C/O' || sh === 'CO' || sh === 'HLF' || sh === 'OD') continue;
      if(sh === 'G' || sh === 'GP') gCount++;
      else if(rot.has(sh) || rot.has(schedule[i])) rotCount++;
    }
  }

  // 2) Saved schedules: this month + previous month
  try{
    const fb = (typeof getSchedules==='function' ? getSchedules() : {}) || {};
    const keys = [];
    if(emp.id) keys.push(emp.id);
    if(emp.empId) keys.push(String(emp.empId).trim());
    const months = [
      yr+'_'+String(mo).padStart(2,'0'),
      (mo===1 ? (yr-1)+'_12' : yr+'_'+String(mo-1).padStart(2,'0'))
    ];
    months.forEach(mk=>{
      const sched = fb[mk];
      if(!sched) return;
      let row = null;
      for(const k of keys){ if(k && sched[k] != null){ row = sched[k]; break; } }
      if(!row) return;
      const len = Array.isArray(row) ? row.length : 31;
      for(let i=0;i<len;i++){
        const sh = String((Array.isArray(row)?row[i]:(row[i]!=null?row[i]:row[String(i)]))||'').trim().toUpperCase();
        if(!sh || sh==='—' || sh==='O' || sh==='L' || sh==='H' || sh==='AB' || sh==='C/O' || sh==='CO') continue;
        if(sh==='G' || sh==='GP') gCount++;
        else if(rot.has(sh)) rotCount++;
      }
    });
  }catch(e){}

  // Pure G worker: has G and no D/N/A/B/C history
  if(gCount > 0 && rotCount === 0) return true;

  // Last work shift before range was G (include G in the search set)
  try{
    const codesWithG = ['G'].concat(configShiftCodes || ['D','N']);
    const lastInfo = findLastWorkShiftBeforeDate(emp, yr, mo, dayFrom||1, codesWithG);
    if(lastInfo && String(lastInfo.shift||'').toUpperCase() === 'G'){
      // Only lock to G if they were not also on rotation recently
      if(rotCount === 0) return true;
    }
  }catch(e){}

  return false;
}


/** Primary filter: section | designation | machine | responsibility */
function _sbSetPrimaryFilter(prim){
  window._sbPrimaryFilter = prim || 'section';
  window._sbSubSelected = new Set();
  try{ localStorage.setItem('mp_sb_primary_filter', window._sbPrimaryFilter); }catch(e){}
  _sbRenderPrimaryFilterUI();
  _sbRenderSubFilterChips();
  _sbApplyEmpFilterVisibility();
}
function _sbEmpFieldValue(emp, field){
  if(!emp) return '';
  if(field==='section') return (typeof getEmpSection==='function'?getEmpSection(emp):'')||emp.section||emp.sec||'';
  if(field==='designation') return String(emp.designation||emp.desig||'').trim();
  if(field==='machine') return (typeof getEmpMachine==='function'?getEmpMachine(emp):'')||emp.machine||emp.mc||'';
  if(field==='responsibility') return (typeof getEmpResp==='function'?getEmpResp(emp):'')||emp.responsibility||emp.resp||'';
  return '';
}
function _sbRenderPrimaryFilterUI(){
  const prim = window._sbPrimaryFilter || 'section';
  document.querySelectorAll('.sb-prim-btn').forEach(btn=>{
    const on = btn.getAttribute('data-prim') === prim;
    btn.style.background = on ? 'rgba(124,58,237,.2)' : 'var(--card)';
    btn.style.borderColor = on ? 'rgba(124,58,237,.55)' : 'var(--border2)';
    btn.style.color = on ? '#c4b5fd' : 'var(--text)';
  });
}
/** Sub-filters = unique values from Excel for the primary field */
function _sbRenderSubFilterChips(){
  const row = document.getElementById('sbSubFilterRow');
  if(!row) return;
  const prim = window._sbPrimaryFilter || 'section';
  let values = [];
  try{ if(typeof _teamFieldValues==='function') values = _teamFieldValues(prim) || []; }catch(e){}
  if(!values.length){
    const seen = new Map();
    (typeof getEmps==='function'?getEmps():[]).forEach(e=>{
      const v = _sbEmpFieldValue(e, prim);
      if(!v) return;
      const k = String(v).toLowerCase();
      if(!seen.has(k)) seen.set(k, v);
    });
    values = Array.from(seen.values()).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  if(!window._sbSubSelected) window._sbSubSelected = new Set();
  const allOn = window._sbSubSelected.size === 0;
  let html = '<button type="button" onclick="_sbToggleSubFilter(\'__ALL__\')" style="font-size:10px;font-weight:800;padding:4px 9px;border-radius:999px;border:1px solid '+(allOn?'rgba(34,197,94,.5)':'var(--border2)')+';background:'+(allOn?'rgba(34,197,94,.15)':'var(--card)')+';color:'+(allOn?'#4ade80':'var(--muted)')+';cursor:pointer">All</button>';
  values.forEach(v=>{
    const key = String(v);
    const on = window._sbSubSelected.has(key);
    const safe = key.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    html += '<button type="button" onclick="_sbToggleSubFilter(\''+safe+'\')" style="font-size:10px;font-weight:700;padding:4px 9px;border-radius:999px;border:1px solid '+(on?'rgba(96,165,250,.55)':'var(--border2)')+';background:'+(on?'rgba(96,165,250,.18)':'var(--card)')+';color:'+(on?'#93c5fd':'var(--text)')+';cursor:pointer;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+key.replace(/</g,'')+'</button>';
  });
  if(!values.length) html += '<span style="font-size:11px;color:#64748b">No '+prim+' values from Excel yet</span>';
  row.innerHTML = html;
}
function _sbToggleSubFilter(val){
  if(!window._sbSubSelected) window._sbSubSelected = new Set();
  if(val === '__ALL__') window._sbSubSelected = new Set();
  else {
    if(window._sbSubSelected.has(val)) window._sbSubSelected.delete(val);
    else window._sbSubSelected.add(val);
  }
  _sbRenderSubFilterChips();
  _sbApplyEmpFilterVisibility();
}
function _sbApplyEmpFilterVisibility(){
  const prim = window._sbPrimaryFilter || 'section';
  const subs = window._sbSubSelected || new Set();
  const all = !subs.size;
  const tbody = document.getElementById('sb_tbody');
  if(!tbody) return;
  tbody.querySelectorAll('tr').forEach(tr=>{
    const cell = tr.querySelector('.shc[data-empid]');
    const empId = (cell && cell.getAttribute('data-empid')) || tr.getAttribute('data-empid');
    if(!empId){ tr.style.display = ''; return; }
    if(all){ tr.style.display = ''; return; }
    const emp = (typeof getEmps==='function'?getEmps():[]).find(e=>e && (e.id===empId || String(e.empId)===String(empId)));
    if(!emp){ tr.style.display = ''; return; }
    const val = _sbEmpFieldValue(emp, prim);
    const match = [...subs].some(s => String(s).toLowerCase() === String(val).toLowerCase());
    tr.style.display = match ? '' : 'none';
  });
}
function _sbFilteredEmps(list){
  const emps = (list||[]).slice();
  const prim = window._sbPrimaryFilter || 'section';
  const subs = window._sbSubSelected || new Set();
  if(!subs.size) return emps;
  return emps.filter(e=>{
    const val = _sbEmpFieldValue(e, prim);
    return [...subs].some(s => String(s).toLowerCase() === String(val).toLowerCase());
  });
}

function _isSeniorEmp(emp){
  if(!emp) return false;
  try{
    // Managers are G-only, not "senior rotation"
    if(emp.sec==='MGR' || emp.isTeamManager===true
      || String(emp.accessLevel||'').toLowerCase()==='manager'
      || String(emp.role||'').toLowerCase()==='manager') return false;
  }catch(e){}
  const des = String(emp.designation||emp.desig||emp.role||emp.resp||'').toLowerCase();
  const nameHint = String(emp.name||'').toLowerCase();
  // Senior Engineer / Sr. Engineer / Sr Team Member / Lead / Supervisor (shop floor)
  if(/\bsenior\b/.test(des) || /\bsr\.?\b/.test(des) || /\blead\b/.test(des)) return true;
  if(/senior\s*engineer/.test(des) || /sr\.?\s*engineer/.test(des)) return true;
  if(/sr\.?\s*team\s*member/.test(des) || /senior\s*team/.test(des)) return true;
  if(/\bsupervisor\b/.test(des) && !/trainee/.test(des)) return true;
  // Explicit flag if set on employee
  if(emp.isSenior===true || emp.senior===true || String(emp.level||'').toLowerCase()==='senior') return true;
  return false;
}
/** Preferred day-shift code for seniors: D if available, else A, else first rotation code */
function _seniorPreferredShift(rotationOrder){
  const codes = rotationOrder || [];
  if(codes.indexOf('D')>=0) return 'D';
  if(codes.indexOf('A')>=0) return 'A';
  return codes[0] || 'D';
}
/**
 * Pick shift for a new work block.
 * Seniors: prefer Day (D/A) on new blocks; still rotate after weekly off if last block was already preferred day
 *   → after O: if lastWork was preferred day → give next (N/C); if last was night → back to preferred day
 * Juniors: normal nextShiftAfter(lastWork)
 */
function _pickBlockShift(emp, lastWork, rotationOrder, nextShiftAfter){
  if(!_isSeniorEmp(emp)) return nextShiftAfter(lastWork);
  const pref = _seniorPreferredShift(rotationOrder);
  if(!lastWork) return pref;
  // After a full block of preferred day, rotate to next (night / other)
  if(String(lastWork).toUpperCase()===String(pref).toUpperCase()){
    return nextShiftAfter(pref);
  }
  // Coming off night/other → prefer day again
  return pref;
}

function autoGenSchedule(monthKey){
  // ── Last 3 calendar days of month → build NEXT month ──
  // remainingIncludingToday = daysInMonth - day + 1  (e.g. 29 Oct of 31 → 3)
  try{
    if(!window._autoGenSkipMonthNudge){
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth(); // 0-based
      const daysInCur = new Date(y, m+1, 0).getDate();
      const remainingIncludingToday = daysInCur - now.getDate() + 1;
      if(remainingIncludingToday <= 3){
        const nm = new Date(y, m+1, 1);
        const nextKey = nm.getFullYear()+'-'+String(nm.getMonth()+1).padStart(2,'0');
        if(String(monthKey) !== nextKey){
          const sel = document.getElementById('sb_month');
          if(sel){
            let has = false;
            for(let i=0;i<sel.options.length;i++){ if(sel.options[i].value===nextKey){ has=true; break; } }
            if(!has){
              const opt=document.createElement('option');
              opt.value=nextKey;
              opt.textContent=nm.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
              sel.appendChild(opt);
            }
            sel.value=nextKey;
            try{ if(typeof _sbUpdateDayOptions==='function') _sbUpdateDayOptions(); }catch(e){}
          }
          toast((typeof L==='function')
            ? L('📅 महीने के अंतिम 3 दिन — अगले महीने ('+nextKey+') की Schedule','📅 Last 3 days of month — building next month ('+nextKey+')')
            : ('📅 Last 3 days — building '+nextKey));
          window._autoGenSkipMonthNudge = true;
          window._autoGenPendingKey = nextKey;
          const tryGen = function(attempt){
            attempt = attempt||0;
            const tbody = document.getElementById('sb_tbody');
            const ready = tbody && tbody.querySelector('[data-empid]');
            if(ready || attempt>=12){
              try{
                const k = window._autoGenPendingKey || nextKey;
                window._autoGenPendingKey = null;
                autoGenSchedule(k);
              }finally{
                window._autoGenSkipMonthNudge = false;
              }
              return;
            }
            setTimeout(function(){ tryGen(attempt+1); }, 250);
          };
          try{
            if(typeof loadScheduleBuilder==='function'){
              loadScheduleBuilder();
              setTimeout(function(){ tryGen(0); }, 300);
              return;
            }
          }catch(e){ window._autoGenSkipMonthNudge = false; }
          monthKey = nextKey;
        }
      }
    }
  }catch(e){ console.warn('[autoGen month nudge]', e); window._autoGenSkipMonthNudge = false; }

  const [yr, mo] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  let emps = getEmps().filter(e => e.status !== 'resigned');
  // Sequence for Auto Generate: Section | Designation | Machine (then name)
  const sortMode = (window._sbAutoSort || localStorage.getItem('mp_sb_auto_sort') || 'section');
  const _sec = (e)=> (typeof getEmpSection==='function'?getEmpSection(e):'')||e.section||e.sec||'';
  const _des = (e)=> (e.designation||e.desig||e.role||'');
  const _mac = (e)=> (e.machine||e.mc||'');
  emps = emps.slice().sort((a,b)=>{
    let primary = 0;
    if(sortMode === 'designation') primary = String(_des(a)).localeCompare(String(_des(b)));
    else if(sortMode === 'machine') primary = String(_mac(a)).localeCompare(String(_mac(b)));
    else primary = String(_sec(a)).localeCompare(String(_sec(b))); // section (default)
    if(primary !== 0) return primary;
    if(sortMode === 'section'){
      const d = String(_des(a)).localeCompare(String(_des(b)));
      if(d !== 0) return d;
      const m = String(_mac(a)).localeCompare(String(_mac(b)));
      if(m !== 0) return m;
    } else if(sortMode === 'designation'){
      const s = String(_sec(a)).localeCompare(String(_sec(b)));
      if(s !== 0) return s;
      const m = String(_mac(a)).localeCompare(String(_mac(b)));
      if(m !== 0) return m;
    } else if(sortMode === 'machine'){
      const s = String(_sec(a)).localeCompare(String(_sec(b)));
      if(s !== 0) return s;
      const d = String(_des(a)).localeCompare(String(_des(b)));
      if(d !== 0) return d;
    }
    const nameCmp = (a.name||'').localeCompare(b.name||'');
    if(nameCmp !== 0) return nameCmp;
    return 0;
  });
  // Within same section: Senior engineers first (preferred day blocks assigned earlier for coverage)
  try{
    emps = emps.slice().sort((a,b)=>{
      const sa = String((typeof getEmpSection==='function'?getEmpSection(a):'')||a.section||a.sec||'');
      const sb = String((typeof getEmpSection==='function'?getEmpSection(b):'')||b.section||b.sec||'');
      if(sa!==sb) return sa.localeCompare(sb);
      const senA = _isSeniorEmp(a)?0:1, senB = _isSeniorEmp(b)?0:1;
      if(senA!==senB) return senA-senB;
      return (a.name||'').localeCompare(b.name||'');
    });
  }catch(e){}
  // Apply primary + sub filters (Excel values) before Auto Generate
  try{ emps = _sbFilteredEmps(emps); }catch(e){}
  if(!emps.length){
    toast(L('⚠️ Filter में कोई member नहीं — Sub-filter बदलें','⚠️ No members in filter — change sub-filter'));
    return;
  }

  const sbTbody = document.getElementById('sb_tbody');
  if(!sbTbody){ toast(L('⚠️ पहले Schedule खोलें','⚠️ Open schedule first')); return; }

  const firstEmp = emps[0];
  const testCells = firstEmp ? sbTbody.querySelectorAll(`[data-empid="${firstEmp.id}"]`) : [];
  if(!testCells.length){ toast(L('⚠️ पहले Schedule खोलें','⚠️ Open schedule first')); return; }

  // Full month by default (Auto Generate fills every day to month-end).
  // Custom Open-Schedule range still limits visible columns, but Auto fills whole month unless _sbAutoFullMonth===false
  let dayFrom = 1;
  let dayTo = daysInMonth;
  if(window._sbAutoFullMonth === false){
    dayFrom = (typeof window._sbDayFrom === 'number') ? window._sbDayFrom : 1;
    dayTo   = (typeof window._sbDayTo === 'number') ? window._sbDayTo : daysInMonth;
  }
  dayFrom = Math.max(1, Math.min(daysInMonth, dayFrom));
  dayTo   = Math.max(1, Math.min(daysInMonth, dayTo));
  if(dayFrom > dayTo){ const tmp=dayFrom; dayFrom=dayTo; dayTo=tmp; }

  // Approved leave map
  const leaveMap = {};
  const _addLeaveKey = (key, dateStr)=>{
    if(!key) return;
    if(!leaveMap[key]) leaveMap[key] = new Set();
    leaveMap[key].add(dateStr);
  };
  const _localYmd = (d)=>{
    try{
      const x = (d instanceof Date) ? d : new Date(d);
      if(isNaN(x.getTime())) return '';
      return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
    }catch(e){ return ''; }
  };
  (getLeaves()||[]).filter(l => l && l.status === 'approved' && l.from && l.to).forEach(l => {
    const fromD = new Date(String(l.from).slice(0,10)+'T12:00:00');
    const toD = new Date(String(l.to).slice(0,10)+'T12:00:00');
    if(isNaN(fromD.getTime()) || isNaN(toD.getTime())) return;
    const keys = [l.empId, l.empCode, l.empObjId, l.employeeId, l.mobile, l.phone].filter(Boolean).map(String);
    try{
      const hit = (getEmps()||[]).find(e=>e && (
        e.id===l.empId || e.empId===l.empId || e.empCode===l.empId ||
        (l.empCode && (e.empId===l.empCode || e.empCode===l.empCode)) ||
        (l.mobile && String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10)===String(l.mobile).replace(/\D/g,'').slice(-10))
      ));
      if(hit){ keys.push(hit.id, hit.empId, hit.empCode, hit.phone, hit.mobile); }
    }catch(e){}
    for(let d = new Date(fromD); d <= toD; d.setDate(d.getDate() + 1)){
      const ds = _localYmd(d);
      if(!ds) continue;
      keys.forEach(k=>_addLeaveKey(k, ds));
    }
  });
  const _empLeaveSet = (emp)=>{
    const set = new Set();
    [emp.id, emp.empId, emp.empCode, emp.phone, emp.mobile].filter(Boolean).map(String).forEach(k=>{
      const s = leaveMap[k];
      if(s) s.forEach(d=>set.add(d));
    });
    return set;
  };

  // Active rotation codes from Shift Settings (e.g. D+N or A+B+C)
  const configShiftCodes = (typeof getActiveRotationCodes==='function') ? getActiveRotationCodes() : ['D','N'];
  // 2-shift: D→N→D…  3-shift: 1st→3rd→2nd (A→C→B) as before
  const rotationOrder = configShiftCodes.length===3
    ? [configShiftCodes[0], configShiftCodes[2], configShiftCodes[1]]
    : configShiftCodes.slice();
  if(!rotationOrder.length){ toast(L('⚠️ Auto के लिए कम से कम 1 shift tick करें (D/N या A/B/C)','⚠️ Tick at least 1 shift for Auto (D/N or A/B/C)')); return; }

  const nextShiftAfter = (lastSh)=>{
    if(!lastSh) return rotationOrder[0];
    let idx = rotationOrder.indexOf(lastSh);
    if(idx < 0){
      // try case-insensitive / aliases
      idx = rotationOrder.findIndex(c => String(c).toUpperCase()===String(lastSh).toUpperCase());
    }
    if(idx < 0) return rotationOrder[0];
    return rotationOrder[(idx + 1) % rotationOrder.length];
  };

  let generated = 0;
  let leaveProtected = 0;
  let preserved = 0;

  emps.forEach(emp => {
    const cells = sbTbody.querySelectorAll(`[data-empid="${emp.id}"]`);
    if(!cells.length) return;
    const cellsArr = Array.from(cells).sort((a,b)=>(+a.dataset.day)-(+b.dataset.day));

    const woffDow = (emp.woff && WOFF_DOW[emp.woff] !== undefined) ? WOFF_DOW[emp.woff] : -1;
    const isMgrEmp = emp.sec === 'MGR'
      || emp.isTeamManager === true
      || String(emp.accessLevel||'').toLowerCase()==='manager'
      || String(emp.role||'').toLowerCase()==='manager'
      || (typeof isManagerSelfRecord==='function' && isManagerSelfRecord(emp));
    const empLeaves = _empLeaveSet(emp);

    // Full-month schedule array (index 0 = day 1)
    const schedule = Array.from({length: daysInMonth}, (_, i) => {
      const cell = cellsArr.find(c => +c.dataset.day === i);
      return cell ? (cell.dataset.val || '') : '';
    });

    // General-only (Manager OR person whose schedule is G): G on work days, O on weekly off
    // Never put D/N/A/B/C on a G person.
    const isGOnly = isMgrEmp || _empIsGeneralOnly(emp, schedule, dayFrom, dayTo, yr, mo, configShiftCodes);
    if(isGOnly){
      for(let d = dayFrom; d <= dayTo; d++){
        const dateStr = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dow = new Date(yr, mo-1, d).getDay();
        const existing = schedule[d-1] || '';
        if(empLeaves.has(dateStr) || existing === 'L'){ schedule[d-1] = 'L'; leaveProtected++; continue; }
        if(typeof _isBeforeJoining==='function' && _isBeforeJoining(emp, dateStr)){ schedule[d-1] = ''; continue; }
        // Keep special marks (Ab, H, C/O…) if already set
        if(existing && existing !== '—' && existing !== 'G' && existing !== 'O'
            && !configShiftCodes.includes(existing)){
          preserved++;
          continue;
        }
        schedule[d-1] = (woffDow !== -1 && dow === woffDow) ? 'O' : 'G';
      }
      _applyScheduleToGrid(emp.id, schedule, cells, empLeaves, yr, mo);
      generated++;
      return;
    }

    // ── Block rotation: same shift for all work days between Weekly Offs ──
    // Pattern: [6 work days of D] [O] [6 work days of N] [O] [D]… (or A→C→B for 3-shift)
    // Start shift from previous month/range history so continuity is correct.
    let lastInfo = findLastWorkShiftBeforeDate(emp, yr, mo, dayFrom, configShiftCodes);
    let lastWork = lastInfo.shift || rotationOrder[0];

    // If the day immediately before range was still a work shift (mid-block), continue that shift
    // until the next Weekly Off; otherwise start a NEW block with nextShiftAfter(lastWork).
    let continueBlock = false;
    try{
      if(lastInfo && lastInfo.dateStr){
        const prevD = new Date(yr, mo-1, dayFrom);
        prevD.setDate(prevD.getDate() - 1);
        const prevStr = prevD.getFullYear()+'-'+String(prevD.getMonth()+1).padStart(2,'0')+'-'+String(prevD.getDate()).padStart(2,'0');
        // last work shift date equals day-before, or falls in the open work stretch before dayFrom
        if(lastInfo.dateStr === prevStr) continueBlock = true;
        else {
          // walk forward from lastInfo.dateStr+1 to day before: only O/L/blank → new block
          // if any work day in between without O boundary, still mid-cycle only if no O after lastWork
          const parts = lastInfo.dateStr.split('-').map(Number);
          let y=parts[0], m=parts[1], dd=parts[2]+1;
          let hitO = false;
          const endPrev = new Date(yr, mo-1, dayFrom);
          endPrev.setDate(endPrev.getDate()-1);
          while(true){
            const cur = new Date(y, m-1, dd);
            if(cur > endPrev) break;
            const ds = y+'-'+String(m).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
            const dowP = cur.getDay();
            if(woffDow !== -1 && dowP === woffDow){ hitO = true; break; }
            // check stored shift if available
            let shP = '';
            try{
              if(typeof getBaseShift==='function') shP = getBaseShift(emp, ds) || '';
            }catch(e){}
            if(configShiftCodes.includes(shP)){ /* still work */ }
            dd++;
            if(dd > new Date(y, m, 0).getDate()){ dd=1; m++; if(m>12){ m=1; y++; } }
            if(y>yr+1) break;
          }
          continueBlock = !hitO && !!lastInfo.dateStr;
        }
      }
    }catch(e){ continueBlock = false; }

    // currentBlockShift: active code for the current 6-day work slot (null = need new block after O)
    let currentBlockShift = continueBlock ? lastWork : null;

    for(let d = dayFrom; d <= dayTo; d++){
      const dateStr = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(yr, mo-1, d).getDay();
      const existing = schedule[d-1] || '';

      // Approved leave — never overwrite
      if(empLeaves.has(dateStr) || existing === 'L'){
        schedule[d-1] = 'L';
        leaveProtected++;
        // leave breaks mid-block continuity the same as a work gap but does not rotate
        continue;
      }
      if(typeof _isBeforeJoining==='function' && _isBeforeJoining(emp, dateStr)){
        schedule[d-1] = '';
        continue;
      }
      // Preserve non-empty special codes (Ab, H, C/O…)
      if(existing && existing !== '—' && !configShiftCodes.includes(existing) && existing !== 'O' && existing !== 'G'){
        preserved++;
        continue;
      }
      // Preserve existing work shift / O / G if user did not Clear first
      if(existing && (configShiftCodes.includes(existing) || existing === 'O' || existing === 'G')){
        if(configShiftCodes.includes(existing)){
          lastWork = existing;
          currentBlockShift = existing;
        }
        if(existing === 'O') currentBlockShift = null; // next work day starts new block
        preserved++;
        continue;
      }

      // Weekly off day → O; next work day starts a NEW block with rotated shift
      if(woffDow !== -1 && dow === woffDow){
        schedule[d-1] = 'O';
        currentBlockShift = null;
        continue;
      }

      // Working day: keep same shift for entire block between Weekly Offs
      // Seniors prefer Day (D/A) on alternate blocks; juniors use normal rotation
      if(!currentBlockShift){
        currentBlockShift = (typeof _pickBlockShift==='function')
          ? _pickBlockShift(emp, lastWork, rotationOrder, nextShiftAfter)
          : nextShiftAfter(lastWork);
        lastWork = currentBlockShift;
      }
      schedule[d-1] = currentBlockShift;
    }

    _applyScheduleToGrid(emp.id, schedule, cells, empLeaves, yr, mo);
    generated++;
  });

  let msg = `✅ ${generated} कर्मचारियों की Schedule auto-generate हो गई!`;
  if(leaveProtected > 0) msg += ` · 🛡️ ${leaveProtected} approved leave दिन सुरक्षित`;
  if(preserved > 0) msg += ` · ${preserved} मौजूदा shifts रखीं`;
  try{
    const nSen = emps.filter(e=>_isSeniorEmp(e)).length;
    if(nSen) msg += (typeof L==='function'?L(` · 👔 ${nSen} Senior → Day (D/A) priority`,` · 👔 ${nSen} Senior → Day (D/A) priority`):'');
  }catch(e){}
  msg += ' Save करें।';
  toast(msg);

  try{
    setTimeout(()=> _runCoverageCheckAfterAutoGen(monthKey, yr, mo, daysInMonth), 80);
  }catch(e){ console.warn('coverage check', e); }
}

/**
 * After Auto Schedule: validate that each group (section / machine / resp / desig)
 * has at least one person on every active work-shift when the group is large enough.
 * Example: Section X has 3 people + 3 shifts (A,B,C) → each shift must have ≥1 person
 * on every working day (people not on weekly-off / leave).
 * If gaps → modal: Skip | Suggest weekly-off changes.
 */
function _runCoverageCheckAfterAutoGen(monthKey, yr, mo, daysInMonth){
  const report = _buildCoverageReport(yr, mo, daysInMonth);
  if(!report || !report.gaps.length){
    // Soft success hint when everything is balanced
    try{
      if(report && report.groupsChecked > 0){
        toast(L('✅ Coverage OK — Section/Machine/Resp में हर शिफ्ट पर लोग उपलब्ध','✅ Coverage OK — people available on every shift per group'));
      }
    }catch(e){}
    return;
  }
  _showCoverageGapModal(monthKey, yr, mo, daysInMonth, report);
}

function _empGroupKey(emp, kind){
  if(!emp) return '';
  if(kind === 'section') return _normLabelKey(typeof getEmpSection==='function' ? getEmpSection(emp) : (emp.sec||emp.section||''));
  if(kind === 'machine') return _normLabelKey(typeof getEmpMachine==='function' ? getEmpMachine(emp) : (emp.mc||emp.machine||''));
  if(kind === 'responsibility') return _normLabelKey(typeof getEmpResp==='function' ? getEmpResp(emp) : (emp.resp||emp.responsibility||''));
  if(kind === 'designation') return _normLabelKey(emp.designation||'');
  return '';
}
function _empGroupLabel(emp, kind){
  if(!emp) return '';
  if(kind === 'section') return (typeof getEmpSection==='function' ? getEmpSection(emp) : (emp.sec||emp.section||'')) || '';
  if(kind === 'machine') return (typeof getEmpMachine==='function' ? getEmpMachine(emp) : (emp.mc||emp.machine||'')) || '';
  if(kind === 'responsibility') return (typeof getEmpResp==='function' ? getEmpResp(emp) : (emp.resp||emp.responsibility||'')) || '';
  if(kind === 'designation') return String(emp.designation||'').trim();
  return '';
}

/** Read shift value currently in Schedule Builder grid for emp on day index 0-based */
function _sbCellVal(empId, dayIdx){
  try{
    if(window._sbData && window._sbData[empId] && window._sbData[empId][dayIdx] != null)
      return String(window._sbData[empId][dayIdx]||'').trim().toUpperCase();
    const sbTbody = document.getElementById('sb_tbody');
    if(!sbTbody) return '';
    const cell = sbTbody.querySelector(`[data-empid="${empId}"][data-day="${dayIdx}"]`);
    return cell ? String(cell.dataset.val||'').trim().toUpperCase() : '';
  }catch(e){ return ''; }
}

/**
 * Build coverage gaps across section / machine / responsibility / designation.
 * Rule: if a group has N members (non-manager) and S active rotation shifts,
 * and N >= S, then on every day where at least S people are "available" (not O/L/blank),
 * each shift code should have at least 1 person.
 * Also flag when available people < S on a day (usually weekly-off clustering).
 * minByField thresholds (when set) require count >= min for that group.
 */
function _buildCoverageReport(yr, mo, daysInMonth){
  const shiftCodes = (typeof getActiveRotationCodes==='function' ? getActiveRotationCodes() : ['D','N']);
  const S = shiftCodes.length || 2;
  const empsAll = (typeof getEmps==='function' ? getEmps() : []).filter(e => e && e.status !== 'resigned');
  const cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
  const byField = (cfg.minByField && typeof cfg.minByField === 'object') ? cfg.minByField : {};

  // Only dimensions toggled ON in Profile → minFieldActive (and that have min>0 values).
  const fieldActive = (cfg.minFieldActive && typeof cfg.minFieldActive === 'object')
    ? cfg.minFieldActive
    : { section:true, machine:false, responsibility:false, designation:false };
  const kinds = [];
  const kindMeta = [
    {kind:'section', title: L('सेक्शन','Section')},
    {kind:'machine', title: L('मशीन','Machine')},
    {kind:'responsibility', title: L('ज़िम्मेदारी','Responsibility')},
    {kind:'designation', title: L('पद','Designation')}
  ];
  kindMeta.forEach(meta=>{
    const on = fieldActive[meta.kind];
    // Default: section ON if never saved; machine/resp/designation only if explicitly true
    const enabled = (meta.kind === 'section')
      ? (on !== false)
      : !!on;
    if(!enabled) return;
    const map = byField[meta.kind] || {};
    // Only check a dimension if at least one value has min > 0 (0 = skip)
    const hasMin = Object.keys(map).some(k => Number(map[k]) > 0);
    if(hasMin) kinds.push(meta);
  });
  if(!kinds.length){
    // No positive mins configured — zero coverage errors
    return { gaps: [], groupsChecked: 0, shiftCodes, S };
  }

  const gaps = [];
  let groupsChecked = 0;

  // Respect Schedule Builder visible range (partial month) — do not score empty days outside range
  let dayFrom = 1, dayTo = daysInMonth;
  try{
    if(typeof window._sbDayFrom === 'number') dayFrom = Math.max(1, Math.min(daysInMonth, window._sbDayFrom));
    if(typeof window._sbDayTo === 'number') dayTo = Math.max(1, Math.min(daysInMonth, window._sbDayTo));
    if(dayFrom > dayTo){ const t=dayFrom; dayFrom=dayTo; dayTo=t; }
  }catch(e){}

  const isMgr = (emp)=>{
    return emp.sec === 'MGR'
      || emp.isTeamManager === true
      || String(emp.accessLevel||'').toLowerCase()==='manager'
      || String(emp.role||'').toLowerCase()==='manager'
      || (typeof isManagerSelfRecord==='function' && isManagerSelfRecord(emp));
  };

  // G / General workers are present on site but are NOT D/N/A/B/C rotation slots
  const isGeneralVal = (val)=>{
    const v = String(val||'').trim().toUpperCase();
    return v === 'G' || v === 'GP' || v === 'GENERAL';
  };

  kinds.forEach(({kind, title})=>{
    const map = new Map();
    empsAll.forEach(emp=>{
      if(isMgr(emp)) return;
      const key = _empGroupKey(emp, kind);
      if(!key) return;
      const label = _empGroupLabel(emp, kind) || key;
      if(!map.has(key)) map.set(key, {label, members:[]});
      map.get(key).members.push(emp);
    });

    map.forEach((g, key)=>{
      const N = g.members.length;
      if(N < 1) return;
      const gl = String(g.label||'').trim().toLowerCase();
      if(!gl || gl==='all' || gl==='सभी' || gl==='—' || gl==='-' || gl==='n/a' || gl==='na') return;

      let minReq = 0;
      try{
        const fmap = byField[kind] || {};
        if(fmap[g.label] != null && isFinite(Number(fmap[g.label]))) minReq = Math.max(0, Number(fmap[g.label]));
        else {
          const want = String(g.label||'').toLowerCase();
          for(const k of Object.keys(fmap)){
            if(String(k).toLowerCase()===want && isFinite(Number(fmap[k]))){ minReq = Math.max(0, Number(fmap[k])); break; }
          }
        }
      }catch(e){}

      // Profile: min 0 (or unset) = SKIP this value entirely — no empty-shift, no below_min
      // Only values with min > 0 participate in Auto Schedule coverage errors.
      if(minReq <= 0) return;

      // Per-shift "every code must have ≥1" only when group is large enough to
      // support staggered blocks (≈ 2 people per shift). Block rotation intentionally
      // keeps the same person on one shift for 6 days — small sections cannot fill
      // every code every day without breaking that rule.
      const enforcePerShift = N >= (S * 2);
      groupsChecked++;

      for(let d = dayFrom - 1; d < dayTo; d++){
        const dateStr = `${yr}-${String(mo).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`;
        const counts = {};
        shiftCodes.forEach(c => counts[c] = 0);
        let available = 0;      // on a rotation work shift (D/N/A/B/C…)
        let generalOn = 0;      // G present (counts for min staff, not per-shift slots)
        let offOrLeave = 0;
        let scheduledAny = 0;   // any non-blank cell

        g.members.forEach(emp=>{
          if(typeof _isBeforeJoining==='function' && _isBeforeJoining(emp, dateStr)) return;
          const val = _sbCellVal(emp.id, d);
          if(!val || val === '—' || val === '-'){ offOrLeave++; return; }
          scheduledAny++;
          const up = String(val).trim().toUpperCase();
          if(up === 'O' || up === 'L' || up === 'AB' || up === 'H' || up === 'C/O' || up === 'CO' || up === 'HLF'){
            offOrLeave++;
            return;
          }
          if(isGeneralVal(up)){
            generalOn++;
            return;
          }
          available++;
          let matched = false;
          if(typeof parseShiftWorkCodes==='function'){
            const codes = parseShiftWorkCodes(val);
            codes.forEach(c=>{
              if(counts[c] != null){ counts[c]++; matched = true; }
            });
          }
          if(!matched && counts[up] != null) counts[up]++;
        });

        // Skip days where nobody in the group has any schedule yet (partial fill / not generated)
        if(scheduledAny === 0) return;

        const headcount = available + generalOn; // bodies on site
        const emptyShifts = shiftCodes.filter(c => counts[c] === 0);
        const problems = [];

        // empty_shift: only when group is big enough for staggered coverage AND
        // enough people are working that day that a missing shift is a real imbalance
        if(enforcePerShift && available >= S && emptyShifts.length){
          problems.push({
            type: 'empty_shift',
            emptyShifts,
            counts: {...counts},
            available
          });
        }
        // too_few_available: only for large groups where weekly-off clash leaves fewer
        // rotation workers than number of shifts (G workers do not fill rotation slots)
        if(enforcePerShift && available < S && N >= (S * 2) && headcount < S){
          problems.push({
            type: 'too_few_available',
            available: headcount,
            need: S,
            counts: {...counts}
          });
        }
        // Configured minimum manpower for this section/machine
        if(minReq > 0 && headcount < minReq){
          problems.push({
            type: 'below_min',
            available: headcount,
            minReq,
            counts: {...counts}
          });
        }
        if(problems.length){
          gaps.push({
            kind, kindTitle: title, groupKey: key, groupLabel: g.label,
            day: d+1, dateStr, N, S, members: g.members.map(e=>({id:e.id, name:e.name, woff:e.woff||''})),
            problems, counts, available: headcount, offOrLeave
          });
        }
      }
    });
  });

  return { gaps, groupsChecked, shiftCodes, S };
}

function _showCoverageGapModal(monthKey, yr, mo, daysInMonth, report){
  const gaps = report.gaps || [];
  // Summarize by group
  const byGroup = new Map();
  gaps.forEach(g=>{
    const k = g.kind + '|' + g.groupKey;
    if(!byGroup.has(k)) byGroup.set(k, {kind:g.kind, kindTitle:g.kindTitle, label:g.groupLabel, N:g.N, S:g.S, days:[], members:g.members});
    byGroup.get(k).days.push(g.day);
  });

  const dayList = (days)=>{
    const u = [...new Set(days)].sort((a,b)=>a-b);
    if(u.length <= 8) return u.join(', ');
    return u.slice(0,6).join(', ') + '… (+' + (u.length-6) + ')';
  };

  let rows = '';
  byGroup.forEach(g=>{
    const uniqDays = [...new Set(g.days)];
    rows += `<div style="padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--card)">
      <div style="font-size:13px;font-weight:800;color:var(--text)">${g.kindTitle}: <span style="color:#f97316">${escHtml(String(g.label).replace(/</g,'&lt;'))}</span>
        <span style="font-size:11px;font-weight:600;color:var(--muted2)"> · ${g.N} ${L('लोग','people')} · ${g.S} ${L('शिफ्ट','shifts')}</span>
      </div>
      <div style="font-size:12px;color:#f87171;margin-top:4px">⚠️ ${uniqDays.length} ${L('दिन कवरेज कम / शिफ्ट खाली','days with low coverage / empty shift')}: ${dayList(uniqDays)}</div>
    </div>`;
  });

  const totalDays = gaps.length;
  const html = `<div class="modal-handle"></div>
    <div class="modal-title">⚠️ ${L('Coverage जाँच — शिफ्ट खाली / कम स्टाफ़','Coverage check — empty shift / low staff')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      ${L('Auto Schedule के बाद कुछ ग्रुप में हर शिफ्ट पर कम से कम 1 व्यक्ति नहीं मिला।','After Auto Schedule, some groups do not have at least 1 person on every shift.')}
      <br>${L('उदाहरण: 3 लोग + 3 शिफ्ट → हर शिफ्ट पर 1 होना चाहिए।','Example: 3 people + 3 shifts → 1 person on each shift.')}
    </div>
    <div style="max-height:40vh;overflow-y:auto;margin-bottom:12px">${rows || '<div style="color:var(--muted2)">—</div>'}</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:12px">
      ${L('कुल समस्या दिन','Total problem days')}: <b style="color:#f87171">${totalDays}</b>
      · ${L('आप Skip कर सकते हैं या Weekly Off बदलने का सुझाव ले सकते हैं।','You can Skip or get Weekly-Off change suggestions.')}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button type="button" onclick="_coverageSkipAndKeep()" style="padding:14px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#64748b,#475569);color:#fff;font-size:14px;font-weight:800;cursor:pointer">
        ⏭️ ${L('त्रुटि छोड़ें — Schedule रखें','Skip errors — keep schedule')}
      </button>
      <button type="button" onclick="_coverageSuggestWeeklyOffs('${monthKey}',${yr},${mo},${daysInMonth})" style="padding:14px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;font-size:14px;font-weight:800;cursor:pointer">
        💡 ${L('Weekly Off बदलने का सुझाव','Suggest Weekly Off changes')}
      </button>
      <button type="button" onclick="_closeCoverageLayer()" style="padding:12px;border-radius:12px;border:1px solid var(--border2);
        background:var(--card);color:var(--muted2);font-size:13px;font-weight:700;cursor:pointer">${L('बंद करें','Close')}</button>
    </div>`;
  // stash report for suggestion step
  try{ window._lastCoverageReport = report; window._lastCoverageMonthKey = monthKey; }catch(e){}
  // CRITICAL: do NOT openModal() — that destroys the Schedule Builder and loses the grid.
  // Show a layered overlay on top of the still-open builder instead.
  _openCoverageLayer(html);
}

function _openCoverageLayer(innerHtml){
  let ov = document.getElementById('coverageLayerOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'coverageLayerOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(2,6,23,.72);display:flex;align-items:flex-end;justify-content:center;padding:12px;box-sizing:border-box;';
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div id="coverageLayerPanel" style="width:100%;max-width:520px;max-height:88dvh;overflow:auto;background:var(--bg2,#1e293b);border-radius:16px 16px 12px 12px;padding:16px 14px 18px;box-shadow:0 -8px 40px rgba(0,0,0,.45);color:var(--text,#f8fafc)">${innerHtml}</div>`;
  ov.style.display = 'flex';
  ov.onclick = (e)=>{ if(e.target === ov) _closeCoverageLayer(); };
}

function _closeCoverageLayer(){
  const ov = document.getElementById('coverageLayerOverlay');
  if(ov){ ov.style.display = 'none'; ov.innerHTML = ''; }
}

function _coverageSkipAndKeep(){
  // Keep generated schedule in the still-open builder — only close coverage layer
  _closeCoverageLayer();
  // Re-paint from _sbData in case anything was lost visually
  try{
    const sbTbody = document.getElementById('sb_tbody');
    if(sbTbody && window._sbData){
      Object.keys(_sbData).forEach(empId=>{
        const sched = _sbData[empId];
        if(!Array.isArray(sched)) return;
        const cells = sbTbody.querySelectorAll(`[data-empid="${empId}"]`);
        if(cells.length) _applyScheduleToGrid(empId, sched, cells, null, null, null);
      });
    }
  }catch(e){ console.warn('skip repaint', e); }
  toast(L('⏭️ Coverage errors skip — Schedule ग्रिड में बनी हुई है · Save दबाएँ','⏭️ Coverage skipped — schedule is on the grid · press Save'));
}

/**
 * Suggest staggered weekly offs so group members don't all off on same day,
 * then optionally re-run auto-gen for affected employees.
 */
function _coverageSuggestWeeklyOffs(monthKey, yr, mo, daysInMonth){
  const report = window._lastCoverageReport;
  if(!report || !report.gaps || !report.gaps.length){
    toast(L('कोई gap नहीं','No gaps'));
    return;
  }
  const shiftCodes = report.shiftCodes || (typeof getActiveRotationCodes==='function' ? getActiveRotationCodes() : ['D','N']);
  const S = shiftCodes.length || 2;
  const DOW_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  // Unique groups that had gaps
  const groupMap = new Map();
  report.gaps.forEach(g=>{
    const k = g.kind + '|' + g.groupKey;
    if(!groupMap.has(k)) groupMap.set(k, {kind:g.kind, kindTitle:g.kindTitle, label:g.groupLabel, N:g.N, members:g.members});
  });

  // For each group, propose staggered woffs
  // Strategy: assign woffs cycling through weekdays so at most ceil(N/7) off same day;
  // prefer spreading so that on any day available >= S when N >= S.
  const suggestions = []; // {empId, name, oldWoff, newWoff, groupLabel, kindTitle}
  const usedEmp = new Set();

  groupMap.forEach(g=>{
    const members = (g.members || []).slice();
    // Prefer keeping existing woff if already unique within group; reassign only clashes
    const byWoff = {};
    members.forEach(m=>{
      const w = (m.woff || '').toUpperCase() || '';
      if(!byWoff[w]) byWoff[w] = [];
      byWoff[w].push(m);
    });
    // Target: distribute across 7 days, ideally different days when N <= 7
    const targetDays = DOW_NAMES.slice(); // SUN..SAT
    // Count how many should be on each day ideally
    const assignment = []; // {emp, newWoff}
    // Sort members: those sharing a woff with others first (need change)
    const sorted = members.slice().sort((a,b)=>{
      const ca = (byWoff[(a.woff||'').toUpperCase()]||[]).length;
      const cb = (byWoff[(b.woff||'').toUpperCase()]||[]).length;
      return cb - ca;
    });
    const dayLoad = {SUN:0,MON:0,TUE:0,WED:0,THU:0,FRI:0,SAT:0};
    // First pass: keep unique woffs
    const remaining = [];
    sorted.forEach(m=>{
      if(usedEmp.has(m.id)) return;
      const w = (m.woff||'').toUpperCase();
      const clash = w && (byWoff[w]||[]).length > 1;
      if(w && DOW_NAMES.includes(w) && !clash && dayLoad[w] < Math.ceil(members.length/7)){
        dayLoad[w]++;
        assignment.push({emp:m, newWoff:w, changed:false});
        usedEmp.add(m.id);
      } else {
        remaining.push(m);
      }
    });
    // Assign remaining to least-loaded days
    remaining.forEach(m=>{
      if(usedEmp.has(m.id)) return;
      let best = 'SUN', bestLoad = 999;
      DOW_NAMES.forEach(d=>{
        if(dayLoad[d] < bestLoad){ bestLoad = dayLoad[d]; best = d; }
      });
      dayLoad[best]++;
      const old = (m.woff||'').toUpperCase();
      assignment.push({emp:m, newWoff:best, changed: old !== best});
      usedEmp.add(m.id);
    });
    assignment.forEach(a=>{
      if(a.changed){
        suggestions.push({
          empId: a.emp.id,
          name: a.emp.name || a.empId,
          oldWoff: a.emp.woff || '—',
          newWoff: a.newWoff,
          groupLabel: g.label,
          kindTitle: g.kindTitle
        });
      }
    });
  });

  if(!suggestions.length){
    _openCoverageLayer(`<div class="modal-handle"></div>
      <div class="modal-title">💡 ${L('Weekly Off सुझाव','Weekly Off suggestions')}</div>
      <div style="font-size:13px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
        ${L('Weekly Off पहले से अलग-अलग हैं। Coverage gap शिफ्ट रोटेशन से हो सकता है — Schedule में मैन्युअल adjust करें, या Skip करें।','Weekly offs are already spread. Gap may be from shift rotation — adjust manually in Schedule, or Skip.')}
      </div>
      <button type="button" onclick="_coverageSkipAndKeep()" style="width:100%;padding:14px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#64748b,#475569);color:#fff;font-weight:800;cursor:pointer">⏭️ ${L('Skip — Schedule रखें','Skip — keep schedule')}</button>
      <button type="button" onclick="_closeCoverageLayer()" style="width:100%;margin-top:8px;padding:12px;border-radius:12px;border:1px solid var(--border2);
        background:var(--card);color:var(--muted2);font-weight:700;cursor:pointer">${L('बंद','Close')}</button>`);
    return;
  }

  try{ window._coverageWoffSuggestions = suggestions; }catch(e){}

  const rows = suggestions.map((s,i)=>`
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;background:var(--card);cursor:pointer">
      <input type="checkbox" class="cov-woff-chk" data-idx="${i}" checked style="width:18px;height:18px;accent-color:#0ea5e9;flex-shrink:0">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:800;color:var(--text)">${escHtml(String(s.name).replace(/</g,'&lt;'))}</div>
        <div style="font-size:11px;color:var(--muted2)">${s.kindTitle}: ${String(s.groupLabel).replace(/</g,'&lt;')}</div>
        <div style="font-size:12px;margin-top:2px">
          <span style="color:#f87171">${s.oldWoff}</span>
          <span style="color:var(--muted2)"> → </span>
          <span style="color:#22c55e;font-weight:800">${s.newWoff}</span>
        </div>
      </div>
    </label>`).join('');

  _openCoverageLayer(`<div class="modal-handle"></div>
    <div class="modal-title">💡 ${L('Weekly Off बदलने का सुझाव','Suggested Weekly Off changes')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:10px;line-height:1.5">
      ${L('एक ही दिन कई लोगों की छुट्टी होने से शिफ्ट खाली रह जाती है। नीचे सुझाए गए अलग-अलग Weekly Off चुनें — Apply पर employees अपडेट होंगे और Auto Schedule फिर चलेगा।','Same-day offs empty a shift. Select suggested offs below — Apply updates employees and re-runs Auto Schedule.')}
    </div>
    <div style="max-height:42vh;overflow-y:auto;margin-bottom:12px">${rows}</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button type="button" onclick="_coverageApplyWoffSuggestions('${monthKey}')" style="padding:14px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#22c55e,#15803d);color:#fff;font-size:14px;font-weight:800;cursor:pointer">
        ✅ ${L('Apply करें + Schedule फिर बनाएँ','Apply + re-generate schedule')}
      </button>
      <button type="button" onclick="_coverageSkipAndKeep()" style="padding:12px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#64748b,#475569);color:#fff;font-size:13px;font-weight:800;cursor:pointer">
        ⏭️ ${L('Skip — बिना बदले रखें','Skip — keep without changes')}
      </button>
      <button type="button" onclick="_closeCoverageLayer()" style="padding:12px;border-radius:12px;border:1px solid var(--border2);
        background:var(--card);color:var(--muted2);font-size:13px;font-weight:700;cursor:pointer">${L('रद्द','Cancel')}</button>
    </div>`);
}

async function _coverageApplyWoffSuggestions(monthKey){
  const all = window._coverageWoffSuggestions || [];
  const checked = [...document.querySelectorAll('.cov-woff-chk:checked')].map(c=>+c.dataset.idx);
  const toApply = checked.map(i=>all[i]).filter(Boolean);
  if(!toApply.length){
    toast(L('कोई सुझाव चुना नहीं','No suggestion selected'));
    return;
  }
  _closeCoverageLayer();
  toast(L('Weekly Off अपडेट हो रहे हैं…','Updating Weekly Offs…'));

  let updated = 0;
  const emps = (typeof getEmps==='function' ? getEmps() : []);
  for(const s of toApply){
    try{
      const emp = emps.find(e=>e && e.id===s.empId);
      if(!emp) continue;
      emp.woff = s.newWoff;
      // Persist if possible
      try{
        if(typeof fbUpdate==='function'){
          await fbUpdate('employees/'+s.empId, {woff: s.newWoff});
        } else if(typeof fbSet==='function'){
          // merge-style set of single field when path supports it
          await fbSet('employees/'+s.empId+'/woff', s.newWoff);
        }
      }catch(e){
        console.warn('woff save', e);
      }
      updated++;
    }catch(e){}
  }

  toast(`✅ ${updated} ${L('कर्मचारियों का Weekly Off अपडेट','employees Weekly Off updated')}`);

  // Clear grid filled state for affected so auto-gen regenerates full month for them
  try{
    const sbTbody = document.getElementById('sb_tbody');
    toApply.forEach(s=>{
      if(window._sbData) delete window._sbData[s.empId];
      if(sbTbody){
        sbTbody.querySelectorAll(`[data-empid="${escHtml(s.empId)}"]`).forEach(c=>{
          c.dataset.val = '';
          c.textContent = '—';
          c.className = 'shc';
        });
      }
    });
  }catch(e){}

  // Re-run auto schedule
  setTimeout(()=>{
    try{ autoGenSchedule(monthKey); }catch(e){ toast('❌ '+e.message); }
  }, 200);
}


function _applyScheduleToGrid(empId, schedule, cells, empLeaves, yr, mo){
  // Always map by data-day (0-based month index) — never by NodeList order alone
  const list = Array.from(cells || []);
  list.forEach((cell) => {
    const dayIdx = parseInt(cell.dataset.day, 10);
    const i = Number.isFinite(dayIdx) ? dayIdx : list.indexOf(cell);
    const val = (schedule && schedule[i] != null) ? String(schedule[i]) : '';
    const dateStr = (yr && mo && i >= 0) ? `${yr}-${String(mo).padStart(2,'0')}-${String(i+1).padStart(2,'0')}` : '';
    const isLeaveProtected = empLeaves && dateStr && empLeaves.has(dateStr);

    cell.dataset.val = val;
    cell.className = 'shc ' + (val ? cellClass(val) : '');
    // Prefer CSS classes for colours — only set size/layout inline
    cell.style.width = '30px';
    cell.style.height = '28px';
    cell.style.minWidth = '30px';
    cell.style.maxWidth = '30px';
    cell.style.fontSize = '12px';
    cell.style.fontWeight = '800';
    cell.style.cursor = 'pointer';
    cell.style.boxSizing = 'border-box';
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.justifyContent = 'center';
    cell.style.touchAction = 'none';
    cell.style.userSelect = 'none';
    if(isLeaveProtected){
      cell.style.outline = '2px solid #f43f5e';
      cell.style.borderRadius = '4px';
      cell.style.boxShadow = '0 0 4px rgba(244,63,94,.5)';
    } else {
      cell.style.outline = '';
      cell.style.boxShadow = '';
    }
    cell.textContent = val ? cellDisp(val) : '—';

    if(isLeaveProtected){
      cell.onclick = function(){ _confirmLeaveOverride(this, empId, i, dateStr); };
    } else {
      cell.onclick = null;
    }
  });
  // Store in _sbData memory (full month array)
  if(Array.isArray(schedule)) _sbData[empId] = [...schedule];
}

function _confirmLeaveOverride(cell, empId, dayIdx, dateStr){
  const fmtD = new Date(dateStr).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  const empName = (getEmps().find(e=>e.id===empId)||{}).name || empId;

  openModal(`<div class="modal-handle"></div>
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:40px;margin-bottom:10px">⚠️</div>
      <div style="font-size:18px;font-weight:900;color:var(--lv);margin-bottom:6px">Approved Leave है!</div>
      <div style="font-size:13px;color:var(--muted2);margin-bottom:4px"><b style="color:#fff">${empName}</b></div>
      <div style="font-size:13px;color:var(--muted2);margin-bottom:16px">${fmtD} को approved छुट्टी है</div>
      <div style="background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--lv);line-height:1.6">
        🛡️ इस दिन की approved leave है।<br>
        अगर बदलना है तो पहले <b>Leave Section</b> में reject करें,<br>
        फिर यहाँ shift change करें।
      </div>
      <button class="big-btn" onclick="closeModal();_forceOverrideLeaveCell('${empId}',${dayIdx})" style="margin-bottom:8px;background:linear-gradient(135deg,#dc2626,#9f1239)">
        ⚠️ फिर भी बदलें (Leave हटेगी)
      </button>
      <button class="cancel-btn" onclick="closeModal()">रहने दो — Leave रखो</button>
    </div>`);
}

function _forceOverrideLeaveCell(empId, dayIdx){
  // Re-enable normal cycling on this cell — scope to modal tbody only
  const sbTbody = document.getElementById('sb_tbody');
  const queryRoot = sbTbody || document;
  const cell = queryRoot.querySelectorAll(`[data-empid="${empId}"]`)[dayIdx];
  if(!cell) return;
  cell.style.outline = 'none';
  cell.style.boxShadow = 'none';
  cell.onclick = null;
  // Set to first non-leave option
  cell.dataset.val = 'D';
  cell.className = 'shc ' + cellClass('D');
  cell.textContent = cellDisp('D');
  if(!_sbData[empId]){
    const allCells = queryRoot.querySelectorAll(`[data-empid="${empId}"]`);
    _sbData[empId] = Array.from(allCells).map(c => c.dataset.val || '');
  }
  _sbData[empId][dayIdx] = 'D';
  toast(L('⚠️ Leave override — D shift set। Save करने पर लागू होगा।','⚠️ Leave override — D shift set. Applies on Save.'));
}

async function saveScheduleBuilder(monthKey){
  const [yr, mo] = monthKey.split('-').map(Number);
  const daysInMonth = (window._sbDaysInMonth) || new Date(yr, mo, 0).getDate();
  
  // FIX: scope to modal tbody only — background schedule grid also has
  // cells with [data-empid] which would corrupt saved data
  const sbTbody = document.getElementById('sb_tbody');
  if(!sbTbody){ toast(L('⚠️ Schedule Builder open नहीं है','⚠️ Schedule Builder is not open')); return; }

  // Merge with existing saved data (for sections / days not loaded)
  const existing = (getSchedules() || {})[monthKey.replace('-','_')] || {};
  const merged = {...existing};
  const emps = getEmps().filter(e => e.status !== 'resigned');

  const odRemovals = []; // {empId, date} when cell was OD and is no longer
  emps.forEach(emp => {
    const cells = Array.from(sbTbody.querySelectorAll(`[data-empid="${emp.id}"]`));
    if(!cells.length) return;
    // Start from existing full-month array (or blank)
    const prevArr = Array.isArray(merged[emp.id]) ? merged[emp.id].slice() : [];
    const arr = Array.isArray(merged[emp.id])
      ? merged[emp.id].slice()
      : new Array(daysInMonth).fill('');
    // Ensure length covers full month
    while(arr.length < daysInMonth) arr.push('');
    cells.forEach(c => {
      const dayIdx = parseInt(c.dataset.day, 10);
      if(!isNaN(dayIdx) && dayIdx >= 0 && dayIdx < daysInMonth){
        const newVal = (c.dataset.val || '').trim(); // blank stays blank — do NOT default to O
        const oldVal = String(prevArr[dayIdx] || '').trim().toUpperCase();
        if(oldVal === 'OD' && newVal.toUpperCase() !== 'OD'){
          const ds = yr + '-' + String(mo).padStart(2,'0') + '-' + String(dayIdx+1).padStart(2,'0');
          odRemovals.push({ empId: emp.id, date: ds });
        }
        arr[dayIdx] = newVal;
      }
    });
    merged[emp.id] = arr;
  });
  
  try{
    // Remove OD report records for cells no longer OD
    for(const item of odRemovals){
      try{ await _removeODRecordsForEmpDate(item.empId, item.date); }catch(e){}
    }
    await fbSet('schedules/' + monthKey.replace('-','_'), merged);
    const from = window._sbDayFrom || 1;
    const to = window._sbDayTo || daysInMonth;
    const rangeMsg = (from === 1 && to === daysInMonth) ? '' : ` (${from}–${to})`;
    toast(L('✅ Schedule save हो गई!','✅ Schedule saved!') + rangeMsg);
    closeModal();
    renderSchedule();
  } catch(e){
    toast('❌ Error: ' + e.message);
  }
}

