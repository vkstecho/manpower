/**
 * Man Power — Print system / Learn / MetCost / SupSkill
 * Split from monolithic module for maintainability. Global scope (no ES modules).
 * Load order must match index.html. Behaviour unchanged.
 */
// ── PRINT SYSTEM ─────────────────────────────────────────
// openPrintModal → user picks sections → _execPrint()
// ─────────────────────────────────────────────────────────
function printSched(){
  // Print modal = ONLY current on-screen view groups (Section / Machine / Resp / Designation)
  const roster = getSchedFilteredEmps().filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length>0);
  const viewGroups = _buildSchedDisplayGroups(roster);
  const mode = _schedGroupMode();
  const modeHint = {section:'Sections', machine:'Machines', responsibility:'Responsibility', designation:'Designation'}[mode]||mode;
  const isEn = (_lang !== 'hi');

  try{ window._printViewGroups = viewGroups; }catch(e){}

  // One checkbox per on-screen subsection (all checked by default)
  let activeGroups = viewGroups.map((g,i)=>({
    id: 'view_'+i,
    label: g.label,
    checked: true,
    filter: g.filter
  }));
  if(!activeGroups.length){
    activeGroups = [{
      id:'current',
      label: L('📋 वर्तमान दृश्य','📋 Current View'),
      checked:true,
      filter:e=>getSchedFilteredEmps().some(x=>x.id===e.id)
    }];
  }

  const rowsHtml = activeGroups.map(g=>`
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;
      background:var(--card);border:1px solid var(--border);border-radius:10px;cursor:pointer;margin-bottom:4px">
      <input type="checkbox" class="prtchk" id="prtchk_${g.id}" data-prtid="${g.id}" ${g.checked?'checked':''}
        style="width:18px;height:18px;accent-color:#0ea5e9;cursor:pointer;flex-shrink:0">
      <span style="font-size:13px;font-weight:700;color:var(--text)">${escHtml(String(g.label).replace(/</g,'&lt;'))}</span>
    </label>`).join('');

  openModal(`<div class="modal-handle"></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="font-size:28px">🖨️</div>
      <div>
        <div style="font-size:17px;font-weight:900;color:var(--text)">${L('Print — वर्तमान दृश्य','Print — Current View')}</div>
        <div style="font-size:11px;color:var(--muted2);margin-top:2px">${L('ग्रुप','Grouped by')}: <b style="color:var(--m1)">${modeHint}</b> — ${L('स्क्रीन जैसा','same as screen')}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button type="button" onclick="document.querySelectorAll('.prtchk').forEach(c=>c.checked=true)"
        style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card2);color:var(--text);font-size:12px;font-weight:700;cursor:pointer">✅ ${L('सभी','All')}</button>
      <button type="button" onclick="document.querySelectorAll('.prtchk').forEach(c=>c.checked=false)"
        style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card2);color:var(--text);font-size:12px;font-weight:700;cursor:pointer">⬜ ${L('कोई नहीं','None')}</button>
    </div>
    <div style="max-height:50vh;overflow-y:auto;margin-bottom:14px">${rowsHtml}</div>
    <div style="display:flex;gap:10px">
      <button type="button" onclick="_execPrint()" style="flex:1;padding:14px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;
        font-family:'Noto Sans Devanagari',sans-serif;font-size:15px;font-weight:800;cursor:pointer">🖨️ ${L('प्रिंट करें','Print')}</button>
      <button type="button" onclick="closeModal()" style="padding:12px 16px;border-radius:12px;
        border:1px solid var(--border2);background:var(--card);color:var(--muted2);
        font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;font-weight:700;cursor:pointer">${L('रद्द','Cancel')}</button>
    </div>`);
}

async function _execPrint(){
  // Gather selected group ids BEFORE closing modal (DOM still present)
  let selectedIds = [...document.querySelectorAll('.prtchk, [id^=prtchk_]')]
    .filter(c=>c.checked)
    .map(c=>c.dataset.prtid || c.id.replace('prtchk_',''));
  // Fallback: if UI had no checkboxes or none checked, print current on-screen filter
  if(!selectedIds.length){
    selectedIds = ['current'];
  }
  if(typeof html2canvas !== 'function'){
    toast(L('❌ Print library load नहीं हुई — page refresh करके फिर try करें','❌ Print library failed to load — refresh and try again'));
    return;
  }
  closeModal();

  // Build print groups from current on-screen subsections (view_0, view_1, …)
  const roster = getSchedFilteredEmps().filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length>0);
  const viewGroups = (window._printViewGroups && window._printViewGroups.length)
    ? window._printViewGroups
    : _buildSchedDisplayGroups(roster);
  const ALL_PRINT_GROUPS = viewGroups.map((g,i)=>({
    id: 'view_'+i,
    label: g.label,
    color: g.color||'#0ea5e9',
    filter: (function(fn){ return function(e){ return getSchedFilteredEmps().some(x=>x.id===e.id) && fn(e); }; })(g.filter)
  }));
  ALL_PRINT_GROUPS.push({
    id:'current',
    label:'📋 CURRENT VIEW',
    color:'#0ea5e9',
    filter:e=>getSchedFilteredEmps().some(x=>x.id===e.id)
  });
  let PRINT_GROUPS = ALL_PRINT_GROUPS.filter(g=>selectedIds.includes(g.id));
  // If nothing checked or only legacy ids — print full current view groups
  if(!PRINT_GROUPS.length){
    PRINT_GROUPS = ALL_PRINT_GROUPS.filter(g=>String(g.id).startsWith('view_'));
  }
  if(!PRINT_GROUPS.length){
    PRINT_GROUPS = [{ id:'current', label:'📋 CURRENT VIEW', color:'#0ea5e9', filter:e=>getSchedFilteredEmps().some(x=>x.id===e.id) }];
  }

  // Date range
  let dates;
  if(_customRangeActive && _customDateFrom && _customDateTo){
    const d=new Date(_customDateFrom),e=new Date(_customDateTo);
    dates=[];let cur=new Date(d);
    while(cur<=e){dates.push(cur.toISOString().split('T')[0]);cur.setDate(cur.getDate()+1);}
  } else {
    dates=Array.from({length:(typeof _schedDayCount==='function'?_schedDayCount():21)},(_,i)=>addDays(TODAY_STR,schedOff+i));
  }

  const allEmps = getEmps().filter(e=>e.status!=='resigned');
  const lbl = document.getElementById('schedLbl').textContent;

  // Auto orientation: >10 date columns → landscape
  const orientation = dates.length > 10 ? 'landscape' : 'portrait';

  // Section label for title
  const sectionLabel = PRINT_GROUPS.map(g=>g.label).join(' · ') || 'Current View';

  // Shift colours
  const SBG={D:'#f59e0b',N:'#4f46e5',A:'#16a34a',B:'#db2777',C:'#0891b2',O:'#dcfce7',L:'#fee2e2','C/O':'#ede9fe',G:'#e0f2fe',H:'#ffedd5',OD:'#ccfbf1',HLF:'#fed7aa',Ab:'#fecaca',GP:'#fdf4ff'};
  const SCL={D:'#000',N:'#fff',A:'#fff',B:'#fff',C:'#fff',O:'#16a34a',L:'#dc2626','C/O':'#7c3aed',G:'#0369a1',H:'#c2410c',OD:'#0d9488',HLF:'#c2410c',Ab:'#991b1b',GP:'#9333ea'};

  // Build tbody
  let tbodyHtml='';
  let totalEmpCount=0;
  PRINT_GROUPS.forEach(grp=>{
    const members=allEmps.filter(grp.filter).sort((a,b)=>getEmpDisplayOrder(a)-getEmpDisplayOrder(b));
    if(!members.length) return;
    totalEmpCount+=members.length;
    tbodyHtml+=`<tr><td colspan="${dates.length+1}" style="background:#1e293b;color:#fff;font-weight:900;font-size:10.5px;padding:5px 10px;text-align:left;letter-spacing:.6px;border:1px solid #334155">${escHtml(grp.label)}</td></tr>`;
    members.forEach(emp=>{
      const isMain=getEmpRole(emp).role==='main';
      tbodyHtml+=`<tr style="background:${isMain?'#fffbeb':'#fff'}">
        <td style="background:${isMain?'#fefce8':'#f8fafc'};text-align:left;padding:3px 6px;white-space:nowrap;border-right:2px solid #334155;border-bottom:1px solid #e2e8f0">
          <div style="font-weight:${isMain?'900':'700'};font-size:10px;color:#000">${isMain?'⭐ ':''}${escHtml(emp.name)}</div>
          <div style="font-size:8px;color:#555;margin-top:1px">${escHtml(emp.empId||'')}</div>
        </td>
        ${dates.map(d=>{
          const sh=getShift(emp,d)||'';
          const isT=d===TODAY_STR;
          const bg=SBG[sh]||'#f1f5f9', cl=SCL[sh]||'#475569';
          const disp=sh==='C/O'?'CO':sh==='HLF'?'½':sh;
          return `<td style="text-align:center;padding:2px;border:1px solid #e2e8f0;${isT?'background:rgba(249,115,22,.07)':''}">
            <span style="display:inline-block;width:22px;height:18px;line-height:18px;border-radius:3px;font-weight:900;font-size:10px;background:${bg};color:${cl};border:1px solid rgba(0,0,0,.15)">${disp}</span>
          </td>`;
        }).join('')}
      </tr>`;
    });
  });

  // Summary rows D/N/L + Total Manpower (filtered roster)
  const printedEmps=PRINT_GROUPS.flatMap(g=>allEmps.filter(g.filter));
  ['D','N','L'].forEach(s=>{
    const lbRow=s==='D'?'☀️ Day':s==='N'?'🌙 Night':'🏖️ Leave';
    const cl=s==='D'?'#b45309':s==='N'?'#3730a3':'#be123c';
    tbodyHtml+=`<tr style="border-top:2px solid #334155">
      <td style="font-size:9px;font-weight:800;color:${cl};padding:3px 6px;background:#f8fafc;border-right:2px solid #334155">${lbRow}</td>
      ${dates.map(d=>{
        const cnt=printedEmps.filter(e=>{const sh=getShift(e,d);return s==='L'?(sh==='L'||sh==='Ab'):sh===s;}).length;
        return `<td style="text-align:center;font-weight:900;font-size:10px;color:${cl};border:1px solid #e2e8f0">${cnt||'—'}</td>`;
      }).join('')}
    </tr>`;
  });
  // Total Manpower row (same roster size under each date — matches on-screen 👥 Total)
  const _printTotalMP = printedEmps.length;
  tbodyHtml+=`<tr style="border-top:2px solid #16a34a">
    <td style="font-size:9px;font-weight:900;color:#15803d;padding:4px 6px;background:#f0fdf4;border-right:2px solid #334155">👥 Total</td>
    ${dates.map(()=>`<td style="text-align:center;font-weight:900;font-size:11px;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0">${_printTotalMP||'—'}</td>`).join('')}
  </tr>`;

  // Date header cells
  const dateHdrCells=dates.map(d=>{
    const dO=new Date(d),isT=d===TODAY_STR;
    return `<th style="text-align:center;padding:4px 2px;background:${isT?'#fff7ed':'#1e293b'};border:1px solid #334155;min-width:30px;max-width:40px">
      <div style="font-size:8px;font-weight:800;color:${isT?'#c2410c':'#94a3b8'};letter-spacing:.3px">${DAYS_EN[dO.getDay()]}</div>
      <div style="font-size:13px;font-weight:900;color:${isT?'#c2410c':'#fff'}">${dO.getDate()}</div>
    </th>`;
  }).join('');

  // Legend
  const _pcfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
  let LI=[{bg:'#f59e0b',c:'#000',t:'D = Day',code:'D'},{bg:'#4f46e5',c:'#fff',t:'N = Night',code:'N'},{bg:'#16a34a',c:'#fff',t:'A = A Shift',code:'A'},{bg:'#db2777',c:'#fff',t:'B = B Shift',code:'B'},{bg:'#0891b2',c:'#fff',t:'C = C Shift',code:'C'},{bg:'#dcfce7',c:'#16a34a',t:'O = Weekly Off'},{bg:'#fee2e2',c:'#dc2626',t:'L = Leave'},{bg:'#ede9fe',c:'#7c3aed',t:'C/O = Comp Off'},{bg:'#e0f2fe',c:'#0369a1',t:'G = General'},{bg:'#ffedd5',c:'#c2410c',t:'H = Holiday'},{bg:'#ccfbf1',c:'#0d9488',t:'OD = Other Dept'},{bg:'#ede9fe',c:'#6d28d9',t:'GP = Gate Pass'},{bg:'#fed7aa',c:'#c2410c',t:'½ = Half Day'},{bg:'#fecaca',c:'#991b1b',t:'Ab = Absent'}];
  LI = LI.filter(i=>{
    if(!i.code) return true;
    const sh = (_pcfg.shifts||[]).find(s=>String(s.code).toUpperCase()===i.code);
    if(sh && sh.active===false) return false;
    return true;
  });
  const legendHtml=LI.map(i=>`<span style="display:inline-flex;align-items:center;gap:3px">
    <span style="display:inline-block;width:19px;height:15px;background:${i.bg};color:${i.c};border-radius:2px;font-weight:900;font-size:9px;text-align:center;line-height:15px;border:1px solid rgba(0,0,0,.2)">${i.t.split(' ')[0]}</span>
    <span style="color:#444;font-size:9px">${i.t.split('= ')[1]}</span>
  </span>`).join('');

  // ── Build printable div for html2canvas JPEG download ──
  const imgWidth = orientation === 'landscape' ? 1400 : 900;

  const printDiv = document.createElement('div');
  printDiv.style.cssText = `position:fixed;top:-99999px;left:0;background:#fff;padding:14px;font-family:Arial,sans-serif;width:${imgWidth}px;`;

  // Title with VKS Tech branding header
  printDiv.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:3px solid #1e293b">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="vkslogo512.png" crossorigin="anonymous" alt="VKS Tech" style="width:52px;height:52px;border-radius:12px;object-fit:contain;background:#fff;border:1px solid #e2e8f0;padding:2px" onerror="this.style.display='none'"/>
        <div>
          <div style="font-size:18px;font-weight:900;color:#1e293b;line-height:1.15;letter-spacing:0.2px">VKS Tech — Technology is power</div>
          <div style="font-size:10px;color:#64748b;font-weight:600">vkstech.com · Made by VKS Tech</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:900;color:#1e293b">Man Power — Shift Schedule</div>
        <div style="font-size:12px;color:#475569;font-weight:700;margin-top:2px">${lbl}</div>
      </div>
    </div>
    <div style="text-align:center;font-size:9px;color:#64748b;margin-bottom:10px">
      Sections: <b>${sectionLabel}</b> &nbsp;·&nbsp; ${totalEmpCount} employees &nbsp;·&nbsp; ${dates.length} days &nbsp;·&nbsp; ${orientation.charAt(0).toUpperCase()+orientation.slice(1)} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead>
        <tr>
          <th style="text-align:left;padding:5px 8px;background:#1e293b;color:#fff;font-size:10px;min-width:110px;border:1px solid #334155;white-space:nowrap">Employee</th>
          ${dateHdrCells}
        </tr>
      </thead>
      <tbody>${tbodyHtml}</tbody>
    </table>
    <div style="display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:8px;padding-top:6px;border-top:2px solid #e2e8f0">${legendHtml}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600">
      <img src="vkslogo512.png" crossorigin="anonymous" alt="VKS Tech" style="width:16px;height:16px;border-radius:4px;object-fit:contain" onerror="this.style.display='none'"/>
      <span>Made by <b style="color:#1e293b">VKS Tech</b> · vkstech.com</span>
    </div>`;

  document.body.appendChild(printDiv);

  toast(L('📸 Image बन रही है... रुकिए','📸 Creating image… please wait'));
  try{
    // Wait for logo images to load before capturing (else they appear blank)
    const imgs = printDiv.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img => {
      if(img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => {
        img.onload = res;
        img.onerror = res;  // don't block on load failure
        setTimeout(res, 2000);  // safety timeout
      });
    }));
    await new Promise(r=>setTimeout(r,300));
    const canvas = await html2canvas(printDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: imgWidth,
      logging: false
    });
    const link = document.createElement('a');
    const safeLbl = lbl.replace(/[^a-zA-Z0-9]/g,'_');
    link.download = `METPower_Schedule_${safeLbl}_${sectionLabel.replace(/[^a-zA-Z0-9]/g,'_')}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    toast(L('✅ Schedule image download हो गई!','✅ Schedule image downloaded!'));
  }catch(e){
    console.error(e);
    toast('❌ Error: '+e.message);
  }finally{
    document.body.removeChild(printDiv);
  }
}

// ════════════════════════════════════════
// EXCEL EXPORT — Shift Schedule
// ════════════════════════════════════════
/** Load logo as data-URL for Excel branding (same asset as print). */
async function _loadVksLogoDataUrl(){
  try{
    const res = await fetch('vkslogo512.png', { cache: 'force-cache' });
    if(!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve)=>{
      const fr = new FileReader();
      fr.onload = ()=> resolve(fr.result);
      fr.onerror = ()=> resolve(null);
      fr.readAsDataURL(blob);
    });
  }catch(e){ return null; }
}

/**
 * Download Schedule Excel — same fixed columns & order as Team Import template,
 * then daily shift columns. Branding: VKS Tech – Technology is power + logo (like print).
 */
async function exportSchedExcel(){
  if(!isAdminOrMgr()){ toast('❌ Only Admin/Manager can export'); return; }

  let dates;
  if(_customRangeActive && _customDateFrom && _customDateTo){
    const d=new Date(_customDateFrom), e2=new Date(_customDateTo);
    dates=[]; let cur=new Date(d);
    while(cur<=e2){ dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }
  } else {
    dates=Array.from({length:(typeof _schedDayCount==='function'?_schedDayCount():21)},(_,i)=>addDays(TODAY_STR,schedOff+i));
  }

  const allEmps = getEmps().filter(e=>e.status!=='resigned' && e.status!=='left');
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const lbl = (document.getElementById('schedLbl')||{}).textContent || '';
  const genAt = new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

  // Column sequence matches Manager's working Excel (Name…Section…DOB then dates)
  const FIXED = [
    'Name','Emp ID','Designation','Weekly Off','Mobile','Section',
    'Machine','Responsibility','Salary (₹/month)','Joining Date','Date of Birth'
  ];

  const headerDates = dates.map(d=>{
    const dt = new Date(d+'T00:00:00');
    return String(dt.getDate()).padStart(2,'0')+'-'+dt.toLocaleString('en',{month:'short'})+'-'+String(dt.getFullYear()).slice(2);
  });
  const weekdayRow = dates.map(d=>{
    const dt = new Date(d+'T00:00:00');
    return dayNames[dt.getDay()];
  });

  const sorted = allEmps.slice().sort((a,b)=>{
    const sa = (a.sec||'').toString();
    const sb = (b.sec||'').toString();
    if(sa!==sb) return sa.localeCompare(sb);
    return (a.name||'').localeCompare(b.name||'');
  });

  const dataRows = sorted.map(e=>{
    const mobile = (e.phone||e.mobile||'').toString().replace(/\D/g,'').slice(-10);
    const machine = e.machine || e.mc || '';
    const desig = e.designation || e.desig || '';
    const resp = e.responsibility || e.resp || '';
    const section = (typeof getEmpSection==='function' ? getEmpSection(e) : '') || e.section || e.sec || '';
    const salary = (e.monthlySalary != null && e.monthlySalary !== '') ? e.monthlySalary
      : (e.salary != null && e.salary !== '' ? e.salary : '');
    const shifts = dates.map(d => {
      try{ return getShift(e, d) || ''; }catch(err){ return ''; }
    });
    // Order: Name, Emp ID, Designation, Weekly Off, Mobile, Section, Machine, Responsibility, Salary, Joining Date, Date of Birth, [dates…]
    return [
      e.name||'',
      e.empId||'',
      desig,
      e.woff||'',
      mobile,
      section,
      machine,
      resp,
      salary,
      e.joiningDate||e.doj||'',
      e.dob||'',
      ...shifts
    ];
  });

  toast(L('⏳ Excel तैयार हो रहा है…','⏳ Preparing Excel…'));
  const fileBase = 'VKS-Tech-ManPower-Schedule-'+(dates[0]||'export')+'-to-'+(dates[dates.length-1]||'');

  // Pure .xlsx (no HTML/image objects) so Excel allows free row/column selection
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
  }catch(e){ console.warn('[xlsx]', e); }

  if(typeof XLSX==='undefined'){
    toast('❌ Excel library not loaded');
    return;
  }

  try{
    const aoa = [];
    aoa.push(['Man Power — Shift Schedule']);
    aoa.push([lbl||'', 'Generated: '+genAt]);
    aoa.push(['VKS Tech — Technology is power · vkstech.com']);
    aoa.push([]);
    aoa.push([...FIXED, ...headerDates]);
    aoa.push([...FIXED.map(()=>''), ...weekdayRow]);
    dataRows.forEach(r=> aoa.push(r));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Column widths — do NOT lock cells
    ws['!cols'] = FIXED.map((h,i)=>({ wch: i===0 ? 18 : (i===4?12:12) })).concat(headerDates.map(()=>({ wch: 7 })));
    // Explicitly no protection
    if(ws['!protect']) delete ws['!protect'];
    const wb = XLSX.utils.book_new();
    // Ensure workbook not locked
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Sheets = wb.Workbook.Sheets || [];
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    XLSX.writeFile(wb, fileBase + '.xlsx');
    toast('✅ Excel downloaded ('+sorted.length+' members) — cells selectable');
  }catch(err2){
    console.warn('[exportSchedExcel] xlsx failed', err2);
    toast('❌ Download failed');
  }
}


function getPrice(plan){
  const fp = (_cache.learnPrices||{})[plan];
  if(fp && typeof fp.price === 'number') return fp.price;
  return (PLAN_INFO[plan]||{}).price || 399;
}

// Admin: edit price for a plan
function editPlanPrice(plan){
  if(!isAdmin()){ toast('Only admin'); return; }
  const pi = PLAN_INFO[plan]||{};
  const cur = getPrice(plan);
  openModal(`<div class="modal-handle"></div>
  <div style="font-size:20px;margin-bottom:4px">${pi.icon} ${escHtml(pi.name)}</div>
  <div style="font-size:13px;color:var(--muted2);margin-bottom:18px">Price Edit करें</div>
  <div style="font-size:12px;color:var(--muted2);margin-bottom:6px">नई कीमत (₹)</div>
  <input id="editPriceVal" type="number" min="0" value="${cur}"
    style="width:100%;padding:12px;border-radius:10px;background:#0f172a;border:1px solid #334155;color:#fff;font-size:18px;font-weight:900;text-align:center;margin-bottom:16px">
  <button class="submit-btn" onclick="savePlanPrice('${plan}')">💾 Save करें</button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

async function savePlanPrice(plan){
  const val = parseInt(document.getElementById('editPriceVal').value);
  if(isNaN(val)||val<0){ toast(L('सही price डालें','Enter a valid price')); return; }
  await fbSet('learnPrices/'+plan, {price:val, updatedAt:new Date().toISOString(), updatedBy:SESSION.name});
  toast(L('✅ Price update हो गई!','✅ Price updated!'));
  closeModal();
  renderLearnScreen();
}

// Admin: refresh all price displays on plan cards
function refreshPriceDisplays(){
  const ids = ['met_operation','met_maintenance','ms_office','managerial','combo'];
  ids.forEach(plan=>{
    const el = document.getElementById('priceDisp_'+plan);
    if(el) el.textContent = '₹'+getPrice(plan);
  });
  const total = ['met_operation','met_maintenance','ms_office','managerial'].reduce((s,p)=>s+getPrice(p),0);
  const saveEl = document.getElementById('comboSaveDisp');
  if(saveEl) saveEl.textContent = 'Save ₹'+(total-getPrice('combo'))+'!';
}

function openLearnScreen(){
  document.getElementById('learnScreen').classList.add('show');
  renderLearnScreen();
}
function closeLearnScreen(){
  document.getElementById('learnScreen').classList.remove('show');
  // Also close any open section
  closeLearnSection();
}

// ── LEARN SECTION ROUTER ──
function openLearnSection(section){
  document.getElementById('learnMainButtons').style.display='none';
  const metView       = document.getElementById('learnMetTrainView');
  const comingSoonView= document.getElementById('learnComingSoonView');
  const supSkillView  = document.getElementById('learnSupSkillView');
  const metCostView   = document.getElementById('learnMetCostView');
  const mrSkillView   = document.getElementById('learnMRSkillView');
  const excelView     = document.getElementById('learnExcelExpertView');
  const msaiView      = document.getElementById('learnMSAIView');
  // Hide all views
  if(metView)       metView.style.display='none';
  if(comingSoonView)comingSoonView.style.display='none';
  if(supSkillView)  supSkillView.style.display='none';
  if(metCostView)   metCostView.style.display='none';
  if(mrSkillView)   mrSkillView.style.display='none';
  if(excelView)     excelView.style.display='none';
  if(msaiView)      msaiView.style.display='none';

  if(section === 'metrain'){
    metView.style.display='flex';
    const fr = document.getElementById('learnMetTrainIframe');
    const loader = document.getElementById('metTrainLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='Met_Train_Pro/met_train_pro.html'; },100); },50);
    }
  } else if(section === 'supskill'){
    supSkillView.style.display='flex';
    const fr     = document.getElementById('supSkillIframe');
    const loader = document.getElementById('supSkillLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      window.updateSupSkillShiftBadge();
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='supskill.html'; },100); },50);
    }
  } else if(section === 'mrskill'){
    if(!isAdminOrMgr()){ toast('⚠️ Manager access only'); document.getElementById('learnMainButtons').style.display='block'; return; }
    mrSkillView.style.display='flex'; try{ const m=localStorage.getItem('metcost_theme_v1')||'dark'; applyMRSkillTheme(m==='light'?'light':'dark'); }catch(e){}
  } else if(section === 'metcost'){
    if(!isAdminOrMgr()){ toast('⚠️ Manager access only'); document.getElementById('learnMainButtons').style.display='block'; return; }
    metCostView.style.display='flex';
    const fr     = document.getElementById('metCostIframe');
    const loader = document.getElementById('metCostLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      try{ window._generateManpowerForMetCost(); }catch(e){ console.warn('Manpower gen error:', e); }
      // Load iframe immediately — MetCost Pro fetches its own data via REST API
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='MR_Skill/mr_skill.html?mode=metcost'; },100); },50);
    }
  } else if(section === 'kpiDashboard'){
    if(!isAdminOrMgr()){ toast('⚠️ Manager access only'); document.getElementById('learnMainButtons').style.display='block'; return; }
    const kpiView = document.getElementById('learnKPIDashboardView');
    if(kpiView) kpiView.style.display='flex';
    const fr     = document.getElementById('kpiDashboardIframe');
    const loader = document.getElementById('kpiDashboardLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      // Pre-generate manpower data so it's ready when iframe requests it
      try{ window._generateManpowerForMetCost(); }catch(e){ console.warn('Manpower gen error:', e); }
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='kpi_dashboard.html'; },100); },50);
    }
  } else if(section === 'timeStudy'){
    if(!isAdminOrMgr()){ toast('⚠️ Manager access only'); document.getElementById('learnMainButtons').style.display='block'; return; }
    const tsView = document.getElementById('learnTimeStudyView');
    if(tsView) tsView.style.display='flex';
    const fr     = document.getElementById('timeStudyIframe');
    const loader = document.getElementById('timeStudyLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      // Time Study reads raw ZJUMBO from shared IDB / Firebase — no manpower needed
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='time_study.html'; },100); },50);
    }
  } else if(section === 'mrmpres'){
    if(!isAdminOrMgr()){ toast('⚠️ Manager access only'); document.getElementById('learnMainButtons').style.display='block'; return; }
    const mrmView = document.getElementById('learnMRMPresView');
    if(mrmView) mrmView.style.display='flex';
    const fr = document.getElementById('mrmPresIframe');
    const loader = document.getElementById('mrmPresLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='MR_Skill/mr_skill.html?mode=mrm'; },100); },50);
    }
  } else if(section === 'excelexpert'){
    excelView.style.display='flex';
    const fr     = document.getElementById('excelExpertIframe');
    const loader = document.getElementById('excelExpertLoading');
    if(fr){
      fr.style.display='none';
      if(loader) loader.style.display='flex';
      // Send admin info to Excel Expert iframe
      const _sendAdminInfo = function(){
        try{
          const frEl = document.getElementById('excelExpertIframe');
          if(frEl && frEl.contentWindow){
            frEl.contentWindow.postMessage({type:'userInfo', name:SESSION.name||'User', role:isAdminOrMgr()?'admin':'user', isAdmin:isAdminOrMgr()}, '*');
          }
        }catch(e){}
      };
      setTimeout(()=>{ fr.src=''; setTimeout(()=>{ fr.src='excel_expert.html'; },100); },50);
      setTimeout(_sendAdminInfo, 2000);
      setTimeout(_sendAdminInfo, 4000);
    }
  } else if(section === 'msai'){
    msaiView.style.display='flex';
  } else {
    comingSoonView.style.display='block';
    const titles = {
      supervisor: {icon:'👔', title:'Supervisor Skills', color:'#fbbf24', sub:'Shift Mgmt · Manpower · Quality · Reporting'},
      managerial: {icon:'🎯', title:'Managerial Skills', color:'#c084fc', sub:'Planning · KPI · Leadership · Cost Control'}
    };
    const info = titles[section]||{icon:'🚀',title:'Coming Soon',color:'#fff',sub:''};
    document.getElementById('learnCSIcon').textContent = info.icon;
    document.getElementById('learnCSTitle').style.color = info.color;
    document.getElementById('learnCSTitle').textContent = info.title;
    document.getElementById('learnCSSub').textContent = info.sub;
  }
}

function closeLearnSection(){
  const metView = document.getElementById('learnMetTrainView');
  const csView  = document.getElementById('learnComingSoonView');
  const mcView  = document.getElementById('learnMetCostView');
  const mrView  = document.getElementById('learnMRSkillView');
  const exView  = document.getElementById('learnExcelExpertView');
  const msView  = document.getElementById('learnMSAIView');
  const fr = document.getElementById('learnMetTrainIframe');
  const mcFr = document.getElementById('metCostIframe');
  const exFr = document.getElementById('excelExpertIframe');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(mcFr){ mcFr.src=''; mcFr.style.display='none'; }
  if(exFr){ exFr.src=''; exFr.style.display='none'; }
  if(metView) metView.style.display='none';
  if(csView)  csView.style.display='none';
  if(mcView)  mcView.style.display='none';
  if(mrView)  mrView.style.display='none';
  if(exView)  exView.style.display='none';
  if(msView)  msView.style.display='none';
  const mb = document.getElementById('learnMainButtons');
  if(mb) mb.style.display='block';
}

// ── MR SKILL HUB: Close (back to Learn main) ──
window.
// MR Skill Hub light/dark (shared key with mr_skill.html)
window.applyMRSkillTheme = function(mode){
  const view = document.getElementById('learnMRSkillView');
  const btn = document.getElementById('mrSkillThemeBtn');
  if(view){
    if(mode === 'light') view.classList.add('mrSkillHub-light');
    else view.classList.remove('mrSkillHub-light');
  }
  if(btn) btn.textContent = mode === 'light' ? '☀️' : '🌙';
  try{ localStorage.setItem('metcost_theme_v1', mode); }catch(e){}
};
window.toggleMRSkillTheme = function(){
  let mode = 'dark';
  try{ mode = localStorage.getItem('metcost_theme_v1') || 'dark'; }catch(e){}
  mode = (mode === 'light') ? 'dark' : 'light';
  applyMRSkillTheme(mode);
};
(function initMRSkillTheme(){
  let mode = 'dark';
  try{ mode = localStorage.getItem('metcost_theme_v1') || 'dark'; }catch(e){}
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ applyMRSkillTheme(mode === 'light' ? 'light' : 'dark'); });
  } else {
    applyMRSkillTheme(mode === 'light' ? 'light' : 'dark');
  }
})();

closeMRSkill = function(){
  const view = document.getElementById('learnMRSkillView');
  if(view) view.style.display='none';
  const mb = document.getElementById('learnMainButtons');
  if(mb) mb.style.display='block';
};

// ── EXCEL EXPERT: Close (back to MS&AI hub) ──
window.closeExcelExpert = function(){
  const view = document.getElementById('learnExcelExpertView');
  const fr = document.getElementById('excelExpertIframe');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(view) view.style.display='none';
  // Go back to MS&AI hub, not main buttons
  const msView = document.getElementById('learnMSAIView');
  if(msView) msView.style.display='flex';
};

// ── MS & AI HUB: Close (back to Learn main) ──
window.closeMSAI = function(){
  const view = document.getElementById('learnMSAIView');
  if(view) view.style.display='none';
  const mb = document.getElementById('learnMainButtons');
  if(mb) mb.style.display='block';
};

// ── MRM PRESENTATION: Close (back to MR Skill hub) ──
window.closeMRMPres = function(){
  const view = document.getElementById('learnMRMPresView');
  const fr = document.getElementById('mrmPresIframe');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(view) view.style.display='none';
  const mrView = document.getElementById('learnMRSkillView');
  if(mrView) mrView.style.display='flex';
};

// ── MRM PRESENTATION: Send MetCost data to iframe ──
window._sendMetDataToMRM = async function(){
  // MRM reads localStorage directly — just ensure data is there
  try{ await window._loadMetCostFromFirebase(); }catch(e){}
};

// ── METCOST PRO: Close (back to MR Skill hub) ──
window.closeMetCostPro = function(){
  const view   = document.getElementById('learnMetCostView');
  const fr     = document.getElementById('metCostIframe');
  const loader = document.getElementById('metCostLoading');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(loader) loader.style.display='flex';
  if(view)   view.style.display='none';
  // Go back to MR Skill hub (not main buttons)
  const mrView = document.getElementById('learnMRSkillView');
  if(mrView) mrView.style.display='flex';
};

// ── KPI DASHBOARD (Man/Machine KPIs): Close (back to MR Skill hub) ──
window.closeKPIDashboard = function(){
  const view   = document.getElementById('learnKPIDashboardView');
  const fr     = document.getElementById('kpiDashboardIframe');
  const loader = document.getElementById('kpiDashboardLoading');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(loader) loader.style.display='flex';
  if(view)   view.style.display='none';
  // Go back to MR Skill hub (not main buttons)
  const mrView = document.getElementById('learnMRSkillView');
  if(mrView) mrView.style.display='flex';
};

// ── KPI DASHBOARD: Send manpower data to iframe (reuses _metCostManpowerData) ──
window.sendManpowerToKPIDashboard = function(){
  const fr = document.getElementById('kpiDashboardIframe');
  if(fr && fr.contentWindow && window._metCostManpowerData){
    console.log('[KPI Dashboard] Sending manpower data to iframe');
    fr.contentWindow.postMessage({
      type: 'MANPOWER_DATA',
      data: window._metCostManpowerData
    }, '*');
  }else{
    console.warn('[KPI Dashboard] Cannot send: iframe=',!!fr,' data=',!!window._metCostManpowerData);
  }
};

// ── TIME STUDY: Close (back to MR Skill hub) ──
window.closeTimeStudy = function(){
  const view   = document.getElementById('learnTimeStudyView');
  const fr     = document.getElementById('timeStudyIframe');
  const loader = document.getElementById('timeStudyLoading');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(loader) loader.style.display='flex';
  if(view)   view.style.display='none';
  const mrView = document.getElementById('learnMRSkillView');
  if(mrView) mrView.style.display='flex';
};

// ── METCOST PRO: Generate manpower data ──
window._generateManpowerForMetCost = function(){
  try{
  const emps = getEmps().filter(e => {
    if(!e || e.status === 'resigned' || e.status === 'left') return false;
    return (typeof _empMonthlySalary==='function' ? _empMonthlySalary(e) : Number(e.monthlySalary||e.salary||0)) > 0;
  });
  const WORKING_DAYS = 26;
  console.log('[MetCost] Generating manpower: '+emps.length+' employees with salary');

  const getShiftForCalc = (emp, date) => {
    try{
      if(typeof getShift === 'function') return getShift(emp, date) || '';
    }catch(e){}
    return '';
  };

  const months = {};
  for(let i = 0; i < 6; i++){
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yr = d.getFullYear(), mo = d.getMonth() + 1;
    const monthKey = yr + '-' + String(mo).padStart(2,'0');
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const allDates = [];
    for(let dd = 1; dd <= daysInMonth; dd++){
      allDates.push(yr + '-' + String(mo).padStart(2,'0') + '-' + String(dd).padStart(2,'0'));
    }

    const metSections = ['M1','M2','S1','S2','SUP','MGR'];
    const metEmps = emps.filter(e => metSections.includes(e.sec));
    let totalGross = 0, totalDeduct = 0, totalNet = 0;
    const perEmployee = [];

    metEmps.forEach(emp => {
      const monthlySalary = (typeof _empMonthlySalary==='function') ? _empMonthlySalary(emp) : (Number(emp.monthlySalary)||0);
      if(!monthlySalary) return;
      const perDaySalary = monthlySalary / WORKING_DAYS;
      let absentDays = 0;
      // Build shift map: date → D/N/L/O/Ab
      const shifts = {};
      allDates.forEach(date => {
        const sh = getShiftForCalc(emp, date) || '';
        shifts[date] = sh;
        if((typeof _isAbsentShift==='function') ? _isAbsentShift(sh) : (sh==='Ab'||sh==='AB')) absentDays++;
      });
      const deduction = Math.round(perDaySalary * absentDays);
      const netSalary = monthlySalary - deduction;
      totalGross += monthlySalary;
      totalDeduct += deduction;
      totalNet += netSalary;
      perEmployee.push({
        id: emp.id, empId: emp.empId, name: emp.name, section: emp.sec,
        role: (typeof getEmpRole==='function'?getEmpRole(emp):{}).role || 'assist',
        monthlySalary, perDaySalary: Math.round(perDaySalary),
        absentDays, deduction, netSalary,
        shifts, // date → shift code
      });
    });

    months[monthKey] = {
      month: monthKey, year: yr, monthNum: mo,
      workingDays: WORKING_DAYS, daysInMonth,
      totalGross, totalDeduct, totalNet,
      employeeCount: perEmployee.length,
      perEmployee,
      generatedAt: new Date().toISOString(),
    };
  }
  window._metCostManpowerData = months;
  const mk=Object.keys(months);
  console.log('[MetCost] Generated '+mk.length+' months: '+mk.join(', ')+' | Total employees found: '+emps.length);
  }catch(err){ console.error('[MetCost] _generateManpowerForMetCost ERROR:', err); }
};

// ── METCOST PRO: Send data to iframe ──
window.sendManpowerToMetCost = function(){
  const fr = document.getElementById('metCostIframe');
  if(fr && fr.contentWindow && window._metCostManpowerData){
    console.log('[MetCost] Sending manpower data to iframe');
    fr.contentWindow.postMessage({
      type: 'MANPOWER_DATA',
      data: window._metCostManpowerData
    }, '*');
  }else{
    console.warn('[MetCost] Cannot send: iframe=',!!fr,' data=',!!window._metCostManpowerData);
  }
};

// ── METCOST PRO: Listen for refresh requests from iframe ──
// Auto-load saved data from Firebase when iframe opens
window._loadMetCostFromFirebase = async function(){
  try{
    console.log('[MetCost Parent] 📡 Loading from Firebase...');
    const data = await fbGet('metcostData');
    const settings = await fbGet('metcostSettings');
    const dCount = data ? Object.keys(data).length : 0;
    console.log('[MetCost Parent] Firebase: '+dCount+' months, settings='+(settings?'yes':'null'));

    // ═══ WRITE TO LOCALSTORAGE + WINDOW — iframe reads both ═══
    if(data && dCount > 0){
      window._metcostCachedData = data; // direct window access for iframe
      try{ localStorage.setItem('metcost_saved_months', JSON.stringify(data)); }catch(ex){ console.warn('[MetCost Parent] localStorage write error:', ex.message); }
    }
    if(settings){
      window._metcostCachedSettings = settings;
      if(settings.rates) try{ localStorage.setItem('metcost_rates', JSON.stringify(settings.rates)); }catch(ex){}
      try{ localStorage.setItem('metcost_allSettings', JSON.stringify(settings)); }catch(ex){}
      if(settings.bomTargets) try{ localStorage.setItem('metcost_bomTargets', JSON.stringify(settings.bomTargets)); }catch(ex){}
      if(settings.matTargets) try{ localStorage.setItem('metcost_matTargets', JSON.stringify(settings.matTargets)); }catch(ex){}
    }
    console.log('[MetCost Parent] ✅ Written to localStorage: '+dCount+' months');

    // Also try postMessage as backup
    const fr = document.getElementById('metCostIframe');
    if(fr && fr.contentWindow){
      if(data) fr.contentWindow.postMessage({type:'METCOST_LOAD', data:data}, '*');
      if(settings) fr.contentWindow.postMessage({type:'METCOST_LOAD_SETTINGS', data:settings}, '*');
    }
  }catch(ex){
    console.error('[MetCost Parent] ❌ Firebase error:', ex.message||ex);
    setTimeout(function(){try{window._loadMetCostFromFirebase()}catch(e){}}, 3000);
  }
};
window.addEventListener('message', async function(e) {
  if(!e.data||!e.data.type) return;
  if(e.data.type === 'REQUEST_MANPOWER'){
    window._generateManpowerForMetCost();
    setTimeout(function(){
      window.sendManpowerToMetCost();
      try{ window.sendManpowerToKPIDashboard(); }catch(ex){}
    }, 200);
  }
  // Firebase bridge: save MetCost data
  if(e.data.type === 'METCOST_SAVE' && e.data.data){
    try{
      await fbSet('metcostData', e.data.data);
      console.log('[MetCost] ✅ Firebase save SUCCESS: '+Object.keys(e.data.data).length+' months');
      const fr = document.getElementById('metCostIframe');
      if(fr && fr.contentWindow) fr.contentWindow.postMessage({type:'METCOST_SAVE_OK',count:Object.keys(e.data.data).length},'*');
    }catch(ex){
      console.error('MetCost save error:', ex);
      const fr = document.getElementById('metCostIframe');
      if(fr && fr.contentWindow) fr.contentWindow.postMessage({type:'METCOST_SAVE_FAIL',error:ex.message||'Unknown error'},'*');
    }
  }
  // Firebase bridge: save MetCost settings (rates, material targets, BOMs)
  if(e.data.type === 'METCOST_SAVE_SETTINGS' && e.data.data){
    try{
      await fbSet('metcostSettings', e.data.data);
      console.log('[MetCost] ✅ Settings saved to Firebase');
    }catch(ex){ console.error('MetCost settings save error:', ex); }
  }
  // Firebase bridge: load MetCost data (on request or retry)
  if(e.data.type === 'METCOST_REQUEST_LOAD' || e.data.type === 'METCOST_REQUEST_SETTINGS'){
    window._loadMetCostFromFirebase();
  }
  // MRM Presentation: send MetCost data
  if(e.data.type === 'MRM_REQUEST_DATA'){
    window._sendMetDataToMRM();
  }
});

// ── SUPSKILL: Close ──
window.closeSupSkill = function(){
  const view  = document.getElementById('learnSupSkillView');
  const fr    = document.getElementById('supSkillIframe');
  const loader= document.getElementById('supSkillLoading');
  if(fr){ fr.src=''; fr.style.display='none'; }
  if(loader) loader.style.display='flex';
  if(view)   view.style.display='none';
  const mb = document.getElementById('learnMainButtons');
  if(mb) mb.style.display='block';
};

// ── SUPSKILL: Get employees on duty for a given dayIdx + shift ──
// PATCHED: now uses getShift(emp, dateStr) — the single source of truth.
// This correctly handles: Excel schedules, Firebase overrides, approved leaves,
// shift swaps and manual changes. The old e.ms[idx] approach missed all of these.
function getEmployeesOnCurrentShift(dayIdx, shiftCode, targetYear, targetMonth){
  try{
    const now  = new Date();
    const yr   = (targetYear  !== undefined) ? targetYear  : now.getFullYear();
    const mo   = (targetMonth !== undefined) ? targetMonth : now.getMonth(); // 0-indexed
    const idx  = (dayIdx !== undefined)      ? dayIdx      : now.getDate() - 1;
    const day  = idx + 1;

    // Build proper ISO date string so getShift() can look up the right schedule
    const dateStr = yr + '-'
      + String(mo + 1).padStart(2, '0') + '-'
      + String(day).padStart(2, '0');

    // Auto-detect shift if not provided
    const code = shiftCode || ((now.getHours() >= 7 && now.getHours() < 19) ? 'D' : 'N');

    const emps = (typeof getEmps === 'function') ? getEmps() : [];

    return emps
      .filter(e => e.status === 'active')
      .map(e => {
        // getShift() checks: Firebase overrides → Excel schedules → approved leaves → manual changes
        const shiftVal  = getShift(e, dateStr);
        const isWorking = ['D','N','G','GP'].includes(shiftVal);
        const onDuty    = isWorking && (
          shiftVal === code ||   // exact match: D or N
          shiftVal === 'G'  ||   // General shift — always present
          shiftVal === 'GP'      // General Part
        );
        // Look up role type from EMP_ROLES (sup_met, sup_slit, mgr, main, assist, etc.)
        const empRole = (typeof getEmpRole === 'function') ? getEmpRole(e) : (EMP_ROLES[e.name] || null);
        const roleType = empRole ? empRole.role : '';
        return {
          id:          e.id          || '',
          name:        e.name        || '',
          empId:       e.empId       || '',
          section:     e.sec         || '',
          machine:     e.mc          || '',
          designation: e.designation || '',
          resp:        e.resp        || '',
          roleType:    roleType,       // 'sup_met','sup_slit','mgr','main','assist','reliever' etc.
          shiftCode:   shiftVal,      // actual shift from schedule (not raw e.ms[])
          onDuty:      onDuty,        // correctly reflects leaves + swaps + overrides
          dateStr:     dateStr
        };
      })
      // Exclude employees with no shift entry (blank = not yet joined / day off)
      .filter(e => e.shiftCode && e.shiftCode !== '' && e.shiftCode !== 'O');

  }catch(err){ console.warn('[SupSkill] getEmployeesOnCurrentShift error:', err); return []; }
}

// ── SUPSKILL: Update shift count badge ──
window.updateSupSkillShiftBadge = function(){
  try{
    const count = getEmployeesOnCurrentShift().filter(e=>e.onDuty).length;
    const el = document.getElementById('supskillShiftCount');
    if(el) el.textContent = count;
  }catch(e){}
};

// ── SUPSKILL: Send shift data to iframe ──
// PATCHED: now passes correct dateStr, yr, mo so getEmployeesOnCurrentShift()
// can call getShift(emp, dateStr) accurately for any day.
window.sendShiftDataToSupSkill = function(dayIdx, shiftCode){
  try{
    const fr = document.getElementById('supSkillIframe');
    if(!fr||!fr.contentWindow) return;

    const now  = new Date();
    const yr   = now.getFullYear();
    const mo   = now.getMonth(); // 0-indexed
    const idx  = (dayIdx !== undefined) ? dayIdx : now.getDate() - 1;
    const hr   = now.getHours();
    const code = shiftCode || (hr >= 7 && hr < 19 ? 'D' : 'N');
    const currentShift = code === 'D' ? 'DAY' : 'NIGHT';

    // Build proper ISO date string
    const day     = idx + 1;
    const dateStr = yr + '-'
      + String(mo + 1).padStart(2, '0') + '-'
      + String(day).padStart(2, '0');

    // Use patched getEmployeesOnCurrentShift with full year/month context
    const allEmps = getEmployeesOnCurrentShift(idx, code, yr, mo);
    const onDuty  = allEmps.filter(e => e.onDuty);

    // Role of logged-in user
    const role = (typeof isAdmin      === 'function' && isAdmin())      ? 'admin'
               : (typeof isMgr        === 'function' && isMgr())        ? 'manager'
               : (typeof isSupervisor === 'function' && isSupervisor()) ? 'supervisor'
               : 'operator';

    // Determine supervisor's section & machine from employee record or EMP_ROLES
    const myEmpRec = (typeof myEmp === 'function') ? myEmp() : null;
    const supSection = (myEmpRec && myEmpRec.sec) ? myEmpRec.sec
                     : (EMP_ROLES[SESSION.name] ? EMP_ROLES[SESSION.name].section : 'M1');
    const supMachine = (myEmpRec && myEmpRec.mc) ? myEmpRec.mc : 'M-1';

    const payload = {
      type:       'METPOWER_SHIFT_DATA',
      shift:      currentShift,
      shiftCode:  code,                    // raw 'D'/'N' for internal use
      shiftLabel: currentShift === 'DAY' ? '7:00 AM – 7:00 PM' : '7:00 PM – 7:00 AM',
      date:       dateStr,                 // proper YYYY-MM-DD
      dayIndex:   idx,
      year:       yr,
      month:      mo,                      // 0-indexed
      supervisor: { name: SESSION.name || '', empId: SESSION.empId || '', section: supSection, machine: supMachine },
      role:       role,
      section:    supSection,              // supervisor's section (M1, M2, S1, S2, SUP, MGR)
      machineCode: supMachine,             // supervisor's machine code (M-1, M-2, M-1&2 etc.)
      employees:  allEmps,                 // ALL employees with shift info
      onDuty:     onDuty,                  // employees present this shift
      firebaseProject: 'man-power-mp'
    };
    fr.contentWindow.postMessage(payload, '*');
    try{ fr.contentWindow.postMessage({...payload, type:'MP_SHIFT_DATA'}, '*'); }catch(e){}
    window.updateSupSkillShiftBadge();
  }catch(err){ console.warn('[SupSkill] sendShiftDataToSupSkill error:', err); }
};

// ── SUPSKILL: Handle messages from SupSkill iframe ──
// PATCHED: past-date requests now pass yr/mo so getShift() works correctly.
// Also shows richer toast when a report is submitted.
window.addEventListener('message', function(e){
  if(!e.data) return;

  // ── SupSkill requesting employees for a specific past date ──
  if(e.data.type === 'SUPSKILL_REQUEST_SHIFT_DATA'){
    const fr = document.getElementById('supSkillIframe');
    if(!fr || !fr.contentWindow) return;

    const reqDate   = e.data.date;      // 'YYYY-MM-DD'
    const dayIdx    = e.data.dayIndex;  // 0-based day index
    const shiftCode = e.data.shift;     // 'D' or 'N'

    // Parse year and month from the requested date string
    let yr, mo;
    if(reqDate){
      const parts = reqDate.split('-');
      yr = parseInt(parts[0]);
      mo = parseInt(parts[1]) - 1; // convert to 0-indexed
    } else {
      const now = new Date();
      yr = now.getFullYear();
      mo = now.getMonth();
    }

    // Use patched function with full year/month — leaves + overrides respected
    const empsForDate = getEmployeesOnCurrentShift(dayIdx, shiftCode, yr, mo);

    fr.contentWindow.postMessage({
      type:      'METPOWER_SHIFT_DATA_FOR_DATE',
      date:      reqDate,
      dayIndex:  dayIdx,
      shiftCode: shiftCode,
      onDuty:    empsForDate.filter(emp => emp.onDuty),
      employees: empsForDate,
      section:   (typeof myEmp === 'function' && myEmp() && myEmp().sec) ? myEmp().sec
               : (EMP_ROLES[SESSION.name] ? EMP_ROLES[SESSION.name].section : 'M1')
    }, '*');
  }

  // ── SupSkill report submitted — show detailed toast in Man Power ──
  if(e.data.type === 'SUPSKILL_REPORT_SUBMITTED'){
    try{
      const r   = e.data.data || {};
      const msg = '📋 Shift Report: '
        + (r.machine || '') + ' · '
        + (r.shift   || '') + ' · '
        + (r.efficiency || 0) + '% दक्षता · '
        + (r.totalOutputKg || 0).toLocaleString('en-IN') + ' Kgs';
      if(typeof toast === 'function') toast(msg);
    }catch(e2){}
    // Refresh the on-shift badge count
    if(typeof window.updateSupSkillShiftBadge === 'function'){
      window.updateSupSkillShiftBadge();
    }
  }

  // ── SupSkill save monthly analysis to Firebase ──
  if(e.data.type === 'SUPSKILL_SAVE_ANALYSIS'){
    try{
      const key = e.data.key;
      const data = e.data.data;
      if(key && data && window._fbAccess){
        window._fbAccess('set', 'supskillAnalysis/' + key, data)
          .then(function(){ console.log('[METPower] SupSkill analysis saved:', key); })
          .catch(function(err){ console.warn('[METPower] SupSkill analysis save failed:', err); });
      }
    }catch(e2){ console.warn('[METPower] SUPSKILL_SAVE_ANALYSIS error:', e2); }
  }

  // ── SupSkill save downtime data to Firebase ──
  if(e.data.type === 'SUPSKILL_SAVE_DOWNTIME'){
    try{
      const key = e.data.key;
      const data = e.data.data;
      if(key && data && window._fbAccess){
        window._fbAccess('set', 'supskillDowntime/' + key, data)
          .then(function(){ console.log('[METPower] SupSkill downtime saved:', key); })
          .catch(function(err){ console.warn('[METPower] SupSkill downtime save failed:', err); });
      }
    }catch(e2){ console.warn('[METPower] SUPSKILL_SAVE_DOWNTIME error:', e2); }
  }
});

// ── SUPSKILL: Admin video link management ──
window.openSupSkillVideoAdmin = function(){
  const lessons = [
    {key:'lesson_01',label:'Why boats fail early'},
    {key:'lesson_02',label:'What is RCO — 90 min target'},
    {key:'lesson_03',label:'OD values explained'},
    {key:'lesson_04',label:'Reading shift numbers'},
    {key:'lesson_05',label:'Boat target OD × Micron calculator'},
    {key:'lesson_06',label:'5-roll RCO technique'},
    {key:'lesson_07',label:'Close the target gap'},
    {key:'lesson_08',label:'Shift start briefing'},
    {key:'lesson_09',label:'Slit speed — 5 causes'},
    {key:'lesson_10',label:'Crease elimination guide'},
  ];
  const rows = lessons.map(l=>`
    <div style="margin-bottom:11px;">
      <div style="font-size:10px;font-weight:800;color:#00b4a0;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${escHtml(l.label)}</div>
      <div style="display:flex;gap:6px;">
        <input id="vlink_${l.key}" type="url" placeholder="Paste YouTube / Drive / video URL..."
          style="flex:1;background:rgba(0,180,160,.08);border:1.5px solid rgba(0,180,160,.28);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--text);font-family:inherit;outline:none;"
          onfocus="this.style.borderColor='#00b4a0'" onblur="this.style.borderColor='rgba(0,180,160,.28)'">
        <button onclick="window.saveSupSkillVideoLink('${l.key}',document.getElementById('vlink_${l.key}').value,this)"
          style="background:#00b4a0;border:none;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:800;color:#000;cursor:pointer;font-family:inherit;white-space:nowrap;">Save</button>
      </div>
    </div>`).join('');

  // Pre-fill existing links from Firebase
  if(window._fbAccess){
    window._fbAccess('get','supskillVideoLinks').then(snap=>{
      const data = snap.val()||{};
      lessons.forEach(l=>{ const el=document.getElementById('vlink_'+l.key); if(el&&data[l.key]) el.value=data[l.key]; });
    }).catch(()=>{});
  }

  showModal(`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <svg width="22" height="22" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="11" stroke="#00b4a0" stroke-width="1.4" opacity=".5"/><path d="M15 15 L15 6" stroke="#e8a200" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="15" r="2.5" fill="#e8a200"/></svg>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#00d4bc;">SupSkill — Video Links</div>
    </div>
    <div style="font-size:12px;color:rgba(0,180,160,.7);margin-bottom:14px;line-height:1.5;">Paste a YouTube, Google Drive, or direct video URL for each lesson. Workers with paid access will see the video player in SupSkill.</div>
    <div style="max-height:58vh;overflow-y:auto;padding-right:4px;">${rows}</div>
    <div id="vlink_status" style="font-size:12px;color:#22c55e;text-align:center;min-height:16px;margin-top:8px;"></div>
  `);
};

window.saveSupSkillVideoLink = function(key, url, btn){
  if(!url||!url.trim()){ toast(L('URL खाली है','URL is empty')); return; }
  const orig = btn.textContent;
  btn.textContent='...'; btn.disabled=true;
  window._fbAccess('update','supskillVideoLinks',{[key]:url.trim()})
    .then(()=>{
      btn.textContent='✓'; btn.style.background='#22c55e';
      const st=document.getElementById('vlink_status');
      if(st) st.textContent='✓ Saved — SupSkill will use this link immediately';
      setTimeout(()=>{ btn.textContent=orig; btn.style.background='#00b4a0'; btn.disabled=false; },2000);
    })
    .catch(err=>{ btn.textContent=orig; btn.disabled=false; toast('Save failed: '+err.message); });
};


// Get all active subscriptions for current user
function getMySubscriptions(){
  try{
    const s = localStorage.getItem('mp_learn_subs_' + (SESSION.empId||SESSION.name||'guest'));
    if(!s) return [];
    const subs = JSON.parse(s);
    const now = new Date();
    return subs.filter(sub => new Date(sub.validTill) > now);
  }catch(e){ return []; }
}

function hasAccessTo(category){
  const subs = getMySubscriptions();
  return subs.some(s => s.plan === 'combo' || s.plan === category);
}

function saveSubscription(plan){
  const key = 'mp_learn_subs_' + (SESSION.empId||SESSION.name||'guest');
  let subs = [];
  try{ subs = JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){}
  const validTill = new Date();
  validTill.setMonth(validTill.getMonth()+1);
  // Remove old same-plan subscription
  subs = subs.filter(s => s.plan !== plan);
  subs.push({ plan, validTill: validTill.toISOString(), subscribedAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(subs));
}

function renderLearnScreen(){
  // Show/hide admin panel
  const adminPanel = document.getElementById('learnAdminPanel');
  const adminBadge = document.getElementById('learnAdminBadge');
  if(adminPanel) adminPanel.style.display = isAdmin() ? 'block' : 'none';
  if(adminBadge) adminBadge.style.display = isAdmin() ? 'flex' : 'none';
  // Show MR Skill Hub button only for Manager/Admin
  const mcBtn = document.getElementById('mrSkillBtn');
  if(mcBtn) mcBtn.style.display = isAdminOrMgr() ? 'block' : 'none';
  // Render training cards
  renderTrainCards();
  // Update price badges on main buttons
  const priceMap = { met_operation:'ltbPrice_met_operation', met_maintenance:'ltbPrice_met_maintenance',
    supervisor:'ltbPrice_supervisor', managerial:'ltbPrice_managerial' };
  Object.entries(priceMap).forEach(([plan, id])=>{
    const el = document.getElementById(id);
    if(el) el.textContent = '₹'+getPrice(plan);
  });
  // Keep legacy price displays working
  refreshPriceDisplays();
  // Show quick links
  renderLearnButtons();
  // Compatibility: hide old sections if they exist
  const ps = document.getElementById('learnPlansSection');
  if(ps) ps.style.display = 'none';
  const cs = document.getElementById('learnContentSection');
  if(cs) cs.style.display = 'none';
}

function selectPlan(plan){
  _selectedPlan = plan;
  const pi = PLAN_INFO[plan];
  if(!pi) return;

  // Highlight selected
  ['planCombo','planMetOp','planMetMaint','planMsOffice','planManagerial'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.remove('selected');
  });
  const planEls = { combo:'planCombo', met_operation:'planMetOp', met_maintenance:'planMetMaint', ms_office:'planMsOffice', managerial:'planManagerial' };
  const el = document.getElementById(planEls[plan]);
  if(el) el.classList.add('selected');

  // Update proceed button
  const proceedBtn = document.getElementById('proceedBtn');
  proceedBtn.style.display = 'block';
  proceedBtn.innerHTML = `<button class="learn-pay-btn" onclick="proceedToPayment()" style="margin-bottom:8px">
    ${pi.icon} ${escHtml(pi.name)} लें — ₹${getPrice(plan)}/month →
  </button>`;

  document.getElementById('paymentForm').style.display = 'none';
  setTimeout(()=>proceedBtn.scrollIntoView({behavior:'smooth'}),100);
}

function proceedToPayment(){
  if(!_selectedPlan){ toast(L('पहले plan चुनें','Select a plan first')); return; }
  const pi = PLAN_INFO[_selectedPlan];
  document.getElementById('paymentForm').style.display='block';
  document.getElementById('proceedBtn').style.display='none';
  document.getElementById('selectedPlanInfo').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:14px;font-weight:800;color:#fff">${pi.icon} ${escHtml(pi.name)}</div>
        <div style="font-size:11px;color:var(--muted2)">1 महीने की access · Audio + Video</div>
      </div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:${pi.color}">₹${getPrice(_selectedPlan)}</div>
    </div>`;
  document.getElementById('payNowBtn').textContent = `💳 Pay ₹${getPrice(_selectedPlan)} Now`;
  setTimeout(()=>document.getElementById('paymentForm').scrollIntoView({behavior:'smooth'}),100);
}

function cancelPayment(){
  document.getElementById('paymentForm').style.display='none';
  document.getElementById('proceedBtn').style.display = _selectedPlan?'block':'none';
}

function initiatePayment(){
  const name  = (document.getElementById('payName').value||'').trim();
  const phone = (document.getElementById('payPhone').value||'').trim();
  if(!name){ toast(L('नाम भरें','Enter name')); return; }
  if(!phone||phone.length<10){ toast(L('सही मोबाइल नंबर डालें','Enter a valid mobile number')); return; }
  if(!_selectedPlan){ toast(L('Plan चुनें','Select plan')); return; }

  const pi_check = PLAN_INFO[_selectedPlan]||PLAN_INFO.met_operation;
  const amount = getPrice(_selectedPlan) * 100;

  // Razorpay removed — use UPI only
  showUPIFallback(name, phone, amount);
}

function showUPIFallback(name, phone, amount){
  // Show UPI payment option as fallback
  const amtRs = amount/100;
  const pi_upi = PLAN_INFO[_selectedPlan]||PLAN_INFO.met_operation;
  const upiLink = `upi://pay?pa=8168771239-2@ibl&pn=MP+Learn&am=${amtRs}&cu=INR&tn=${escHtml(encodeURIComponent(pi_upi.name))}`;
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;padding:6px 0">
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:2px">💳 UPI से Pay करें</div>
    <div style="font-size:13px;color:var(--muted2);margin-bottom:14px">${pi_upi.icon} ${escHtml(pi_upi.name)}</div>

    <!-- Amount Badge -->
    <div style="background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(56,189,248,.15));border:1px solid rgba(168,85,247,.4);
      border-radius:14px;padding:14px;margin-bottom:14px">
      <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">भुगतान राशि</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:900;
        background:linear-gradient(135deg,#a855f7,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
        ₹${amtRs}
      </div>
    </div>

    <!-- UPI ID Box -->
    <div style="background:var(--panel);border:2px solid rgba(168,85,247,.35);border-radius:14px;padding:14px;margin-bottom:10px">
      <div style="font-size:10px;color:var(--muted2);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">UPI ID</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#a855f7;letter-spacing:1px">
          8168771239-2@ibl
        </div>
        <button onclick="navigator.clipboard.writeText('8168771239-2@ibl').then(()=>toast(L('✅ UPI ID Copy हो गई!','✅ UPI ID copied!')))"
          style="background:rgba(168,85,247,.2);border:1px solid rgba(168,85,247,.4);border-radius:7px;
          color:#a855f7;font-size:12px;padding:5px 10px;cursor:pointer;font-weight:700">
          📋 Copy
        </button>
      </div>
    </div>

    <!-- UPI Apps Buttons -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <a href="${upiLink}" style="text-decoration:none">
        <div style="background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.25);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer">
          <div style="font-size:22px">📱</div>
          <div style="font-size:10px;color:var(--s1);font-weight:700;margin-top:3px">PhonePe</div>
        </div>
      </a>
      <a href="${upiLink}" style="text-decoration:none">
        <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer">
          <div style="font-size:22px">💚</div>
          <div style="font-size:10px;color:var(--green);font-weight:700;margin-top:3px">GPay</div>
        </div>
      </a>
      <a href="${upiLink}" style="text-decoration:none">
        <div style="background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.25);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer">
          <div style="font-size:22px">💙</div>
          <div style="font-size:10px;color:var(--m1);font-weight:700;margin-top:3px">Paytm</div>
        </div>
      </a>
    </div>

    <!-- WhatsApp reminder -->
    <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px;margin-bottom:14px;font-size:12px;color:var(--green);line-height:1.6">
      📸 Payment होने के बाद Screenshot<br>
      WhatsApp करें: <a href="https://wa.me/918168771239" style="color:#fff;font-weight:800">+91 8168771239</a>
    </div>

    <button class="submit-btn" onclick="manualPaymentDone('${name}','${phone}')">
      ✅ मैंने Pay कर दिया
    </button>
    <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>
  </div>`);
}

function manualPaymentDone(name, phone){
  // Save pending subscription - admin will verify
  const pending = {
    name, phone, plan:_selectedPlan,
    amount: _selectedPlan==='basic'?99:399,
    status:'pending_verification',
    requestedAt: new Date().toISOString()
  };
  localStorage.setItem('mp_learn_pending_' + _selectedPlan, JSON.stringify(pending));

  // Also save to Firebase for admin to see
  fbPush('learnRequests', pending).then(key=>{
    fbUpdate('learnRequests/'+key, {_key:key});
  });

  closeModal();
  toast(L('✅ Request भेज दी! Manager verify करेंगे।','✅ Request sent! Manager will verify.'));
  document.getElementById('paymentForm').style.display='none';
}

function onPaymentSuccess(response, plan, name, phone){
  // Save subscription per category
  saveSubscription(plan);

  // Save to Firebase for admin records
  const pi = PLAN_INFO[plan]||{};
  fbPush('subscriptions', {
    plan, name, phone, planName: pi.name||plan, amount: pi.price||399,
    paymentId: response.razorpay_payment_id||'manual',
    subscribedAt: new Date().toISOString(),
    validTill: new Date(Date.now() + 30*86400000).toISOString(),
    userId: SESSION.empObjId||SESSION.empId||phone
  });

  toast('🎉 ' + (pi.icon||'✅') + ' ' + (pi.name||plan) + L(' का access मिल गया!',' access granted!'));
  closeModal();
  renderLearnScreen();
}

// ── CONTENT LIBRARY ──
let _learnCatFilter = 'all';
let _metTopicFilter = null; // sub-topic filter for Met Operation

function filterMetTopic(topic, btn){
  _metTopicFilter = topic;
  document.querySelectorAll('.met-topic-btn').forEach(b=>b.style.outline='none');
  if(btn) btn.style.outline='2px solid var(--m1)';
  const clrBtn = document.getElementById('metTopicClearBtn');
  if(clrBtn) clrBtn.style.display='block';
  renderContentLibrary();
}
function clearMetTopic(){
  _metTopicFilter=null;
  document.querySelectorAll('.met-topic-btn').forEach(b=>b.style.outline='none');
  const clrBtn = document.getElementById('metTopicClearBtn');
  if(clrBtn) clrBtn.style.display='none';
  renderContentLibrary();
}
function setContentFilter(f,el){
  _learnContentFilter=f;
  document.querySelectorAll('#contentFilter .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  renderContentLibrary(getMySubscription()?.plan||'basic');
}
function setContentCat(f,el){
  _learnCatFilter=f;
  _metTopicFilter=null; // reset topic filter when category changes
  document.querySelectorAll('#contentCatFilter .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  // Show Met Op sub-buttons only when Met Operation is selected
  const subBtns = document.getElementById('metOpSubButtons');
  if(subBtns) subBtns.style.display = (f==='met_operation') ? 'block':'none';
  document.querySelectorAll('.met-topic-btn').forEach(b=>b.style.outline='none');
  const clrBtn = document.getElementById('metTopicClearBtn');
  if(clrBtn) clrBtn.style.display='none';
  renderContentLibrary();
}

const CAT_INFO = {
  met_operation:   { icon:'🏭', label:'Met Operation',   color:'var(--m1)',  bg:'rgba(249,115,22,.12)',
    topics:['Machine Start/Stop','Film Loading','Vacuum Process','Quality Check','Production Log'] },
  met_maintenance: { icon:'🔧', label:'Met Maintenance', color:'var(--s1)',  bg:'rgba(56,189,248,.12)',
    topics:['Preventive Maintenance','Oil & Lubrication','Electrical Basics','Fault Diagnosis','Spare Parts'] },
  ms_office:       { icon:'💻', label:'MS Office',       color:'var(--sup)', bg:'rgba(163,230,53,.12)',
    topics:['MS Word Basics','Excel Formulas','PowerPoint Slides','Data Entry','MIS Reports'] },
  managerial:      { icon:'📊', label:'Managerial Skills',color:'#a855f7',   bg:'rgba(168,85,247,.12)',
    topics:['Waste Reduction','Shift Schedule Making','Conversion Cost Reduction','Team Management','5S & Kaizen'] },
};

function renderContentLibrary(){
  const allContent = getLearnContent();
  let list = allContent;
  if(_learnCatFilter!=='all') list=list.filter(c=>c.category===_learnCatFilter);
  if(_learnContentFilter!=='all') list=list.filter(c=>c.type===_learnContentFilter);
  // Met Operation sub-topic filter
  if(_metTopicFilter && _learnCatFilter==='met_operation') list=list.filter(c=>(c.topic||'')=== _metTopicFilter);

  // Admin upload button
  const adminUpload = document.getElementById('adminUploadSection');
  if(adminUpload) adminUpload.innerHTML = isAdmin() ? `
    <div style="margin-top:16px">
      <div class="stitle">Admin — Content Upload</div>
      <button class="big-btn blue" onclick="openContentUpload()" style="margin-bottom:8px">
        ➕ नया Content Add करें
      </button>
      <button class="big-btn" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);margin-bottom:8px" onclick="openManageLearnButtons()">
        🔗 Quick Links Manage करें
      </button>
    </div>` : '';
  renderLearnButtons();

  // Plan badge
  const planBadge = document.getElementById('learnPlanBadge');
  const activeSubs2 = getMySubscriptions();
  if(planBadge) planBadge.innerHTML = activeSubs2.map(s=>{
    const pi3 = PLAN_INFO[s.plan]||{};
    return `<span style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3);border-radius:6px;padding:3px 8px;font-size:10px;color:var(--green);font-weight:700;margin-right:4px">${pi3.icon||''} Active</span>`;
  }).join('');

  const cl = document.getElementById('contentList');
  if(!cl) return;

  if(!list.length){
    cl.innerHTML = '<div class="empty"><div class="empty-icon">📚</div><div class="empty-text">अभी कोई content नहीं है<br><span style="font-size:11px;color:var(--muted)">Admin जल्द add करेंगे</span></div></div>';
    return;
  }

  cl.innerHTML = list.map(item=>{
    const locked = !hasAccessTo(item.category||'met_operation') && !isAdmin();
    const cat = CAT_INFO[item.category]||CAT_INFO.met_operation;
    const catInfo2 = CAT_INFO[item.category]||CAT_INFO.met_operation;
    return `<div class="content-card${locked?' locked':''}" onclick="${locked?`showCatUpgradePrompt('${item.category||'met_operation'}')`:`playContent('${item.id}')`}">
      <div class="content-thumb" style="background:${cat.bg}">
        ${cat.icon}
      </div>
      <div style="flex:1;min-width:0">
        <div class="content-title">${escHtml(item.title)}</div>
        <div class="content-meta">${item.duration||'—'} · <span style="color:${cat.color}">${escHtml(cat.label)}</span></div>
        <div style="display:flex;gap:5px;margin-top:4px">
          <span class="content-type ${item.type==='video'?'video':'audio'}">${item.type==='video'?'🎬 Video':'🎵 Audio'}</span>
          ${item.topic?`<span style="background:rgba(255,255,255,.06);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--muted2)">${item.topic}</span>`:''}
        </div>
      </div>
      ${locked?'<div class="lock-icon">🔒</div>':'<div style="font-size:20px;margin-left:auto">▶️</div>'}
    </div>`;
  }).join('');
}

function getLearnContent(){
  return _cache.learnContent || [];
}

function playContent(id){
  const content = getLearnContent();
  const item = content.find(c=>c.id===id);
  if(!item){ toast(L('Content नहीं मिला','Content not found')); return; }

  let playerHTML = `<div class="modal-handle"></div>
  <div style="font-size:26px;font-weight:900;color:#fff;margin-bottom:14px">${escHtml(item.title)}</div>`;

  if(item.type==='audio'){
    playerHTML += `<div class="audio-player">
      <div style="font-size:48px;margin-bottom:8px">🎵</div>
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px">${escHtml(item.title)}</div>
      <div style="font-size:11px;color:var(--muted2);margin-bottom:12px">${item.topic||''} · ${item.duration||''}</div>
      ${item.url ? `<audio controls style="width:100%;border-radius:8px"><source src="${item.url}" type="audio/mpeg">Audio support नहीं</audio>` :
        `<div style="background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2);border-radius:10px;padding:16px;font-size:12px;color:var(--muted2)">
          🔗 Audio URL: ${item.url||'Set नहीं'}</div>`}
    </div>`;
  } else {
    playerHTML += `<div class="video-player">
      ${item.url ? `<video controls style="width:100%"><source src="${item.url}" type="video/mp4">Video support नहीं</video>` :
        `<div style="background:#000;border-radius:10px;padding:40px;text-align:center;font-size:13px;color:var(--muted2)">
          🎬 Video URL set नहीं है</div>`}
    </div>`;
  }

  if(item.description){
    playerHTML += `<div style="margin-top:14px;font-size:13px;color:var(--text);line-height:1.6">${item.description}</div>`;
  }
  playerHTML += `<button class="cancel-btn" onclick="closePlayer()" style="margin-top:14px">बंद करें</button>`;

  document.getElementById('playerBody').innerHTML = playerHTML;
  document.getElementById('playerOverlay').classList.add('open');
}
function closePlayer(){ document.getElementById('playerOverlay').classList.remove('open'); }

function showCatUpgradePrompt(category){
  const pi = PLAN_INFO[category]||PLAN_INFO.met_operation;
  const ci = CAT_INFO[category]||CAT_INFO.met_operation;
  openModal(`<div class="modal-handle"></div>
  <div style="text-align:center;padding:14px 0">
    <div style="font-size:44px;margin-bottom:10px">🔒</div>
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:6px">${ci.icon} ${escHtml(ci.label)}</div>
    <div style="font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.6">
      यह content देखने के लिए<br>
      <b style="color:#fff">${escHtml(ci.label)}</b> category subscribe करें
    </div>
    <div style="background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:14px;margin-bottom:16px">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:${ci.color}">₹${getPrice(category)}/month</div>
      <div style="font-size:11px;color:var(--muted2)">Audio + Video · 1 month access</div>
    </div>
    <button class="submit-btn" onclick="closeModal();openLearnScreen();setTimeout(()=>selectPlan('${category}'),300)">
      ${ci.icon} Subscribe करें — ₹${getPrice(category)}
    </button>
    <button style="background:linear-gradient(135deg,#f97316,#a855f7);color:#fff;border:none;border-radius:12px;padding:14px;width:100%;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px;font-family:'Noto Sans Devanagari',sans-serif"
      onclick="closeModal();openLearnScreen();setTimeout(()=>selectPlan('combo'),300)">
      🎯 All Access Combo — ₹${getPrice('combo')}
    </button>
    <button class="cancel-btn" onclick="closeModal()">बाद में</button>
  </div>`);
}
function showUpgradePrompt(){ showCatUpgradePrompt('met_operation'); }

function openContentUpload(){
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">➕ Content Add करें</div>
  <div class="field"><label>Title (नाम)</label>
    <input class="inp-field" id="ct_title" placeholder="e.g. Safety Training"></div>
  <div class="field"><label>Category</label>
    <select class="inp-field" id="ct_cat">
      <option value="met_operation">🏭 Met Operation</option>
      <option value="met_maintenance">🔧 Met Maintenance</option>
      <option value="ms_office">💻 MS Office</option>
      <option value="managerial">📊 Managerial Skills</option>
    </select></div>
  <div class="field"><label>Type</label>
    <select class="inp-field" id="ct_type">
      <option value="audio">🎵 Audio</option>
      <option value="video">🎬 Video</option>
    </select></div>
  <div class="field"><label>Sub-Topic</label>
    <select class="inp-field" id="ct_topic">
      <option value="General Training">📚 General Training</option>
      <option value="Machine Operation">⚙️ Machine Operation</option>
      <option value="Safety Training">🦺 Safety Training</option>
      <option value="India/Abroad">🌐 India / Abroad</option>
      <option value="Machine Start/Stop">Machine Start/Stop</option>
      <option value="Film Loading">Film Loading</option>
      <option value="Vacuum Process">Vacuum Process</option>
      <option value="Quality Check">Quality Check</option>
      <option value="PM">PM (Preventive Maintenance)</option>
      <option value="Oil & Lubrication">Oil & Lubrication</option>
      <option value="Fault Diagnosis">Fault Diagnosis</option>
      <option value="MS Word">MS Word</option>
      <option value="Excel Formulas">Excel Formulas</option>
      <option value="PowerPoint">PowerPoint Slides</option>
      <option value="Waste Reduction">Waste Reduction</option>
      <option value="Shift Schedule">Shift Schedule Making</option>
      <option value="Other">Other / Custom</option>
    </select></div>
  <div class="field"><label>Duration (जैसे: 12 min)</label>
    <input class="inp-field" id="ct_dur" placeholder="12 min"></div>
  <div class="field"><label>File URL (Firebase Storage / Google Drive link)</label>
    <input class="inp-field" id="ct_url" placeholder="https://...mp3 या .mp4"></div>
  <div class="field"><label>Description (Optional)</label>
    <textarea class="inp-field" id="ct_desc" placeholder="इस content के बारे में..." style="height:70px"></textarea></div>
  <button class="submit-btn" onclick="submitContent()">✅ Add करें</button>
  <button class="cancel-btn" onclick="closeModal()">रद्द करें</button>`);
}

// ── LEARN QUICK BUTTONS (Admin creates named buttons with links) ──
function openManageLearnButtons(){
  fbGet('learnButtons').then(data=>{
    const btns = data ? Object.entries(data).filter(([k,v])=>v&&v.label) : [];
    const listHTML = btns.map(([key,btn])=>`
      <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px">
        <span style="font-size:20px">${btn.icon||'📎'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(btn.label)}</div>
          <div style="font-size:11px;color:var(--muted2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${btn.url}</div>
        </div>
        <button onclick="deleteLearnButton('${key}')" style="background:rgba(244,63,94,.15);border:none;color:#f43f5e;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:14px;flex-shrink:0">🗑️</button>
      </div>`).join('') || '<div style="color:var(--muted2);font-size:13px;text-align:center;padding:12px">अभी कोई button नहीं है</div>';

    openModal(`<div class="modal-handle"></div>
      <div class="modal-title">🔗 Quick Links Manage करें</div>
      <div style="max-height:40vh;overflow-y:auto;margin-bottom:12px">${listHTML}</div>
      <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">
        <div style="font-size:12px;font-weight:800;color:var(--muted2);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">➕ नया Button जोड़ें</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="lb_icon" placeholder="🎬" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:8px;color:var(--text);font-size:18px;width:50px;text-align:center;flex-shrink:0;font-family:inherit">
          <input id="lb_label" placeholder="Button का नाम (जैसे: Safety Video)" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;flex:1;font-family:inherit">
        </div>
        <input id="lb_url" placeholder="https://... (YouTube, Drive, WhatsApp link)" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;width:100%;margin-bottom:8px;font-family:inherit">
        <select id="lb_color" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;width:100%;font-family:inherit">
          <option value="#f97316">🟠 Orange</option>
          <option value="#3b82f6">🔵 Blue</option>
          <option value="#10b981">🟢 Green</option>
          <option value="#8b5cf6">🟣 Purple</option>
          <option value="#ef4444">🔴 Red</option>
          <option value="#f59e0b">🟡 Yellow</option>
        </select>
      </div>
      <button class="submit-btn" onclick="addLearnButton()">✅ Button जोड़ें</button>
      <button class="cancel-btn" onclick="closeModal()">बंद करें</button>`);
  });
}

async function addLearnButton(){
  const icon  = document.getElementById('lb_icon')?.value?.trim()||'🔗';
  const label = document.getElementById('lb_label')?.value?.trim();
  const url   = document.getElementById('lb_url')?.value?.trim();
  const color = document.getElementById('lb_color')?.value||'#f97316';
  if(!label||!url){ toast(L('नाम और link दोनों जरूरी हैं','Name and link are both required')); return; }
  const key = await fbPush('learnButtons',{icon,label,url,color,addedAt:new Date().toISOString(),addedBy:SESSION.name});
  await fbUpdate('learnButtons/'+key,{id:key});
  toast(L('✅ Button जोड़ दिया गया!','✅ Button added!'));
  openManageLearnButtons(); // refresh
  renderLearnButtons();
}

async function deleteLearnButton(key){
  await fbGet('learnButtons/'+key).then(()=>fbSet('learnButtons/'+key,null));
  toast(L('🗑️ Button हटा दिया','🗑️ Button removed'));
  openManageLearnButtons();
  renderLearnButtons();
}

function renderLearnButtons(){
  const container = document.getElementById('learnQuickBtns');
  if(!container) return;
  const btns = _cache.learnButtons || [];
  if(!btns.length){
    container.innerHTML = isAdmin()
      ? `<div style="text-align:center;padding:8px;color:var(--muted2);font-size:12px">कोई Quick Link नहीं — "Manage Links" से जोड़ें</div>`
      : '';
    return;
  }
  container.innerHTML = `
    <div style="margin-bottom:6px;font-size:11px;font-weight:800;color:var(--muted2);text-transform:uppercase;letter-spacing:1px">📌 Quick Links</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;padding:4px 0">
      ${btns.map(btn=>`
        <button onclick="window.open('${btn.url}','_blank')" style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,${btn.color}22,${btn.color}11);border:1.5px solid ${btn.color}55;border-radius:12px;padding:10px 14px;cursor:pointer;color:#fff;font-size:13px;font-weight:700;font-family:inherit;flex:1;min-width:140px;max-width:calc(50% - 5px)">
          <span style="font-size:20px;flex-shrink:0">${btn.icon||'🔗'}</span>
          <span style="text-align:left;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(btn.label)}</span>
        </button>`).join('')}
    </div>`;
}

async function submitContent(){
  const title = document.getElementById('ct_title').value.trim();
  const type  = document.getElementById('ct_type').value;
  const topic = document.getElementById('ct_topic').value;
  const dur   = document.getElementById('ct_dur').value.trim();
  const url   = document.getElementById('ct_url').value.trim();
  const desc  = document.getElementById('ct_desc').value.trim();
  if(!title){ toast(L('Title भरें','Enter title')); return; }
  const cat = document.getElementById('ct_cat')?.value||'met_operation';
  const key = await fbPush('learnContent',{title,type,category:cat,topic,duration:dur,url,description:desc,addedAt:new Date().toISOString(),addedBy:SESSION.name});
  await fbUpdate('learnContent/'+key,{id:key});
  closeModal();
  toast(L('✅ Content add हो गया!','✅ Content added!'));
}


// ════════════════════════════════════════════════════════════════
