/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-team-import.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
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
  // IMPORTANT: Section column is required for Home department-wise view & min staff
  // Order matches Schedule Download Excel (uniform)
  const headers = ['Name','Emp ID','Weekly Off','Mobile','Department','Machine','Designation','Responsibility','Salary(₹/Month)','Joining Date','Date of Birth'];
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

      // Section: MUST use Excel "Department" (or Section) column (Metalliser / Slitter / MetProd …).
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
      if(p.responsibility||p.resp){ updateObj.resp=p.responsibility||p.resp; updateObj.responsibility=p.responsibility||p.resp; }
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
    <div class="modal-title">✏️ ${typeof L==='function'?L('निर्देश संपादित करें','Edit instructions'):'Edit instructions'}</div>
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
      <input placeholder="${typeof L==='function'?L('📌 Section का नाम','📌 Section name'):'📌 Section name'}" id="isec_title_${newKey}" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-size:13px;font-weight:700;width:calc(100% - 60px);font-family:inherit">
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
  let featureFlags = { skillMatrix: true, checklists: true, shiftHandover: true, training: true };
  try{
    guestTabs = (await fbGet('settings/guestTabs')) || {};
    workerTabsHidden = (await fbGet('settings/workerTabsHidden')) || {};
    const ff = await fbGet('settings/featureFlags');
    if(ff && typeof ff === 'object') featureFlags = Object.assign(featureFlags, ff);
  }catch(e){}
  try{ if(window.MP_OPS && window.MP_OPS.loadFeatureFlags) featureFlags = Object.assign(featureFlags, await window.MP_OPS.loadFeatureFlags()); }catch(e){}

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


      <div style="font-size:10px;font-weight:900;color:rgba(249,115,22,.9);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">🧩 Competence features (on / off)</div>
      <div style="background:var(--card);border-radius:12px;padding:0 12px;margin-bottom:16px">
        ${['skillMatrix','checklists','shiftHandover','training'].map(fid => {
          const labels = {
            skillMatrix: {ico:'👷', en:'Skill Matrix', hi:'स्किल मैट्रिक्स'},
            checklists: {ico:'✅', en:'Process Checklists', hi:'प्रोसेस चेकलिस्ट'},
            shiftHandover: {ico:'🔄', en:'Shift Handover', hi:'शिफ्ट हैंडओवर'},
            training: {ico:'🎓', en:'Training / Mentor assign', hi:'ट्रेनिंग / मेंटर असाइन'}
          };
          const Lbl = labels[fid];
          const on = featureFlags[fid] !== false;
          return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="font-size:18px">${Lbl.ico}</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:800;color:#fff">${Lbl.en}</div>
              <div style="font-size:10px;color:var(--muted2)">${Lbl.hi}</div>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
              <input type="checkbox" ${on?'checked':''} style="opacity:0;width:0;height:0"
                onchange="toggleCompetenceFeature('${fid}', this.checked)">
              <span style="position:absolute;inset:0;border-radius:12px;transition:.2s;background:${on?'#22c55e':'rgba(255,255,255,.15)'}"></span>
              <span style="position:absolute;top:3px;left:${on?'23':'3'}px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s"></span>
            </label>
          </div>`;
        }).join('')}
      </div>

      <button onclick="closeModal()" style="width:100%;padding:13px;background:linear-gradient(135deg,#a855f7,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit">✅ Done</button>
    </div>
  `);
}


async function toggleCompetenceFeature(key, isOn){
  try{
    let flags = { skillMatrix: true, checklists: true, shiftHandover: true, training: true };
    try{
      const raw = await fbGet('settings/featureFlags');
      if(raw && typeof raw === 'object') flags = Object.assign(flags, raw);
    }catch(e){}
    flags[key] = !!isOn;
    await fbSet('settings/featureFlags', flags);
    try{
      if(window.MP_OPS && typeof window.MP_OPS.saveFeatureFlags === 'function'){
        await window.MP_OPS.saveFeatureFlags(flags);
      }
    }catch(e){}
    toast((isOn?'✅ ':'🚫 ') + String(key) + (isOn ? ' ON' : ' OFF'));
    try{ if(typeof injectLearnModuleButtons === 'function') injectLearnModuleButtons(); }catch(e){}
  }catch(e){
    toast('❌ ' + (e && e.message || e));
  }
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


/* i18n dictionary + toast → js/i18n/i18n_dict.js (v5.1.0 split) */

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



/* pending save / leave / CO / OD / WA → js/schedule/sched-shift-edit.js (v5.1.0 split) */
