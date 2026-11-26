/**
 * Man Power — Schedule print + Excel export
 * Split from app-team-print-learn.js (v6.0.53)
 */
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
  const roster = getSchedFilteredEmps().filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team');
  const viewGroups = _buildSchedDisplayGroups(roster);
  const mode = _schedGroupMode();
  const modeHint = {section:'Departments', machine:'Machines', responsibility:'Responsibility', designation:'Designation'}[mode]||mode;
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
  // Lazy-load html2canvas (not bundled in index.html)
  try{
    if(typeof ensureHtml2Canvas === 'function'){
      toast(L('⏳ Print library load हो रही है…','⏳ Loading print library…'));
      await ensureHtml2Canvas();
    } else if(typeof MP_UTILS !== 'undefined' && typeof MP_UTILS.ensureHtml2Canvas === 'function'){
      toast(L('⏳ Print library load हो रही है…','⏳ Loading print library…'));
      await MP_UTILS.ensureHtml2Canvas();
    }
  }catch(loadErr){
    console.error(loadErr);
    toast(L('❌ Print library load नहीं हुई — internet check करें या page refresh करें','❌ Print library failed — check internet or refresh'));
    return;
  }
  if(typeof html2canvas !== 'function'){
    toast(L('❌ Print library load नहीं हुई — page refresh करके फिर try करें','❌ Print library failed to load — refresh and try again'));
    return;
  }
  closeModal();

  // Build print groups from current on-screen subsections (view_0, view_1, …)
  const roster = getSchedFilteredEmps().filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team');
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
  // v6.0.35: SBG/SCL from manager Shift Settings (fallback defaults)
  const SBG={D:'#f59e0b',N:'#4f46e5',A:'#16a34a',B:'#db2777',C:'#0891b2',O:'#dcfce7',L:'#fee2e2','C/O':'#ede9fe',G:'#e0f2fe',H:'#ffedd5',OD:'#ccfbf1',HLF:'#fed7aa',Ab:'#fecaca',GP:'#fdf4ff'};
  const SCL={D:'#000',N:'#fff',A:'#fff',B:'#fff',C:'#fff',O:'#16a34a',L:'#dc2626','C/O':'#7c3aed',G:'#0369a1',H:'#c2410c',OD:'#0d9488',HLF:'#c2410c',Ab:'#991b1b',GP:'#9333ea'};
  try{
    if(typeof mpShiftStyle==='function'){
      const _allCodes = new Set(Object.keys(SBG));
      try{
        const _cfgP = (typeof getShiftConfigSync==='function'?getShiftConfigSync():null)||{};
        (_cfgP.shifts||[]).forEach(function(s){ if(s&&s.code) _allCodes.add(String(s.code)); });
      }catch(_e){}
      _allCodes.forEach(function(code){
        try{
          const st = mpShiftStyle(code);
          if(st && st.bg){
            SBG[code] = st.bg;
            SBG[String(code).toUpperCase()] = st.bg;
            SCL[code] = st.fg || '#fff';
            SCL[String(code).toUpperCase()] = st.fg || '#fff';
          }
        }catch(_e2){}
      });
    }
  }catch(_e3){}


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
          let bg=SBG[sh]||SBG[String(sh||'').toUpperCase()]||'#f1f5f9', cl=SCL[sh]||SCL[String(sh||'').toUpperCase()]||'#475569';
          try{
            if(sh && typeof mpShiftStyle==='function'){
              const st=mpShiftStyle(sh);
              if(st&&st.bg){ bg=st.bg; cl=st.fg||'#fff'; }
            }
          }catch(_e){}
          const disp=(typeof cellDisp==='function'?cellDisp(sh):null)||(sh==='C/O'?'CO':sh==='HLF'?'½':sh);
          return `<td style="text-align:center;padding:2px;border:1px solid #e2e8f0;${isT?'background:rgba(249,115,22,.07)':''}">
            <span style="display:inline-block;width:22px;height:18px;line-height:18px;border-radius:3px;font-weight:900;font-size:10px;background:${bg};color:${cl};border:1px solid rgba(0,0,0,.15)">${disp}</span>
          </td>`;
        }).join('')}
      </tr>`;
    });
  });

  // Summary rows — mirror on-screen schedule counts (active work codes + status with counts)
  const printedEmps=PRINT_GROUPS.flatMap(g=>allEmps.filter(g.filter));
  const _pColor = {
    D:{cl:'#b45309', icon:'☀️', lab:'Day'},
    N:{cl:'#3730a3', icon:'🌙', lab:'Night'},
    A:{cl:'#15803d', icon:'🅰️', lab:'A Shift'},
    B:{cl:'#be185d', icon:'🅱️', lab:'B Shift'},
    C:{cl:'#0e7490', icon:'©️', lab:'C Shift'},
    G:{cl:'#1d4ed8', icon:'🔵', lab:'General Shift'},
    O:{cl:'#64748b', icon:'😴', lab:'Weekly Off'},
    L:{cl:'#be123c', icon:'🏖️', lab:'Leave'},
    'C/O':{cl:'#7c3aed', icon:'♻️', lab:'Comp Off'},
    H:{cl:'#c2410c', icon:'🎉', lab:'Holiday'},
    OD:{cl:'#0d9488', icon:'🏢', lab:'Other Dept'},
    GP:{cl:'#6d28d9', icon:'🛂', lab:'Gate Pass'},
    HLF:{cl:'#c2410c', icon:'½', lab:'Half Day'},
    Ab:{cl:'#991b1b', icon:'🚫', lab:'Absent'}
  };
  // v6.0.35: overlay manager legend colours onto summary row palette
  try{
    if(typeof mpShiftStyle==='function'){
      Object.keys(_pColor).forEach(function(code){
        try{
          const st = mpShiftStyle(code);
          if(st && st.bg){ _pColor[code].cl = st.bg; }
        }catch(_e){}
      });
    }
  }catch(_e){}
  // Prefer live shift config order; always include G/O/L when present in grid
  let _pCodes = [];
  try{
    const cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
    const fromCfg = (cfg.shifts||[]).filter(s=>s && s.active!==false).map(s=>String(s.code||'').toUpperCase()).filter(Boolean);
    _pCodes = fromCfg.length ? fromCfg.slice() : ['D','N','G','A','B','C'];
  }catch(e){ _pCodes = ['D','N','G','A','B','C']; }
  // Ensure status codes checked
  ['O','L','G','C/O','H','OD','GP','HLF','Ab'].forEach(c=>{ if(_pCodes.indexOf(c)<0) _pCodes.push(c); });
  // De-dupe
  _pCodes = _pCodes.filter(function(c,i,a){ return a.indexOf(c)===i; });

  function _printShiftMatch(sh, code){
    if(!sh) return false;
    const up = String(sh).toUpperCase();
    const c = String(code).toUpperCase();
    if(c==='L') return up==='L' || up==='AB';
    if(c==='C/O' || c==='CO') return up==='C/O' || up==='CO';
    if(typeof shiftCountsToward==='function'){
      try{ return shiftCountsToward(sh, code) > 0; }catch(e){}
    }
    return up === c;
  }

  let _pFirstSum = true;
  _pCodes.forEach(function(code){
    const dayCounts = dates.map(function(d){
      return printedEmps.filter(function(e){ return _printShiftMatch(getShift(e,d), code); }).length;
    });
    if(!dayCounts.some(function(n){ return n>0; })) return; // skip empty rows (same as on-screen)
    const meta = _pColor[code] || _pColor[String(code).toUpperCase()] || {cl:'#475569', icon:'•', lab:code};
    // Prefer config label for work codes
    let lab = meta.lab;
    try{
      const cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
      const sh = (cfg.shifts||[]).find(s=>String(s.code||'').toUpperCase()===String(code).toUpperCase());
      if(sh && sh.label && String(sh.label).trim()) lab = String(sh.label).trim();
      if(String(code).toUpperCase()==='G' && (!lab || lab==='G' || /^general$/i.test(lab))) lab = 'General Shift';
    }catch(e){}
    const border = _pFirstSum ? 'border-top:2px solid #334155;' : '';
    _pFirstSum = false;
    tbodyHtml += `<tr style="${border}">
      <td style="font-size:9px;font-weight:800;color:${meta.cl};padding:3px 6px;background:#f8fafc;border-right:2px solid #334155">${meta.icon} ${lab}</td>
      ${dayCounts.map(function(cnt){
        return `<td style="text-align:center;font-weight:900;font-size:10px;color:${meta.cl};border:1px solid #e2e8f0">${cnt||'—'}</td>`;
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
  let LI=[{bg:'#f59e0b',c:'#000',t:'D = Day',code:'D'},{bg:'#4f46e5',c:'#fff',t:'N = Night',code:'N'},{bg:'#16a34a',c:'#fff',t:'A = A Shift',code:'A'},{bg:'#db2777',c:'#fff',t:'B = B Shift',code:'B'},{bg:'#0891b2',c:'#fff',t:'C = C Shift',code:'C'},{bg:'#dcfce7',c:'#16a34a',t:'O = Weekly Off',code:'O'},{bg:'#fee2e2',c:'#dc2626',t:'L = Leave',code:'L'},{bg:'#ede9fe',c:'#7c3aed',t:'C/O = Comp Off',code:'C/O'},{bg:'#e0f2fe',c:'#0369a1',t:'G = General',code:'G'},{bg:'#ffedd5',c:'#c2410c',t:'H = Holiday',code:'H'},{bg:'#ccfbf1',c:'#0d9488',t:'OD = Other Dept',code:'OD'},{bg:'#ede9fe',c:'#6d28d9',t:'GP = Gate Pass',code:'GP'},{bg:'#fed7aa',c:'#c2410c',t:'½ = Half Day',code:'HLF'},{bg:'#fecaca',c:'#991b1b',t:'Ab = Absent',code:'Ab'}];
  // v6.0.35: overlay manager colours + add active custom work shifts (A2/B3…)
  try{
    if(typeof mpShiftStyle==='function'){
      LI.forEach(function(item){
        if(!item.code) return;
        try{
          const st = mpShiftStyle(item.code);
          if(st && st.bg){ item.bg = st.bg; item.c = st.fg || item.c || '#fff'; }
        }catch(_e){}
      });
    }
    const seen = {};
    LI.forEach(function(item){ if(item.code) seen[String(item.code).toUpperCase()] = true; });
    ((_pcfg && _pcfg.shifts) || []).forEach(function(s){
      if(!s || !s.code || s.active===false) return;
      const u = String(s.code).toUpperCase();
      if(seen[u]) return;
      if(['O','L','C/O','CO','H','HLF','AB','OD','GP'].indexOf(u)>=0) return;
      let bg = '#334155', c = '#fff', lab = (s.label&&String(s.label).trim())||s.code;
      try{
        if(typeof mpShiftStyle==='function'){
          const st = mpShiftStyle(s.code);
          if(st && st.bg){ bg = st.bg; c = st.fg || '#fff'; }
        }
      }catch(_e){}
      LI.push({bg:bg, c:c, t:s.code+' = '+lab, code:s.code});
      seen[u] = true;
    });
  }catch(_e){}
  LI = LI.filter(i=>{
    if(!i.code) return true;
    const sh = (_pcfg.shifts||[]).find(s=>String(s.code).toUpperCase()===String(i.code).toUpperCase());
    if(sh && sh.active===false) return false;
    return true;
  });
  const legendHtml=LI.map(i=>`<span style="display:inline-flex;align-items:center;gap:3px">
    <span style="display:inline-block;width:19px;height:15px;background:${i.bg};color:${i.c};border-radius:2px;font-weight:900;font-size:9px;text-align:center;line-height:15px;border:1px solid rgba(0,0,0,.2)">${i.t.split(' ')[0]}</span>
    <span style="color:#444;font-size:9px">${i.t.split('= ')[1]}</span>
  </span>`).join('');

  // ── Build printable div for html2canvas JPEG download ──
  // Embed logo as data-URL so html2canvas always captures VKS Tech mark (no path/CORS miss)
  const _vksLogoSrc = (await _loadVksLogoDataUrl()) || 'assets/vkslogo512.png';
  const imgWidth = orientation === 'landscape' ? 1400 : 900;

  const printDiv = document.createElement('div');
  printDiv.style.cssText = `position:fixed;top:-99999px;left:0;background:#fff;padding:14px;font-family:Arial,sans-serif;width:${imgWidth}px;`;

  // Title with VKS Tech branding header
  printDiv.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:3px solid #1e293b">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="${_vksLogoSrc}" crossorigin="anonymous" alt="VKS Tech" style="width:56px;height:56px;border-radius:12px;object-fit:contain;background:#fff;border:1.5px solid #e2e8f0;padding:3px;box-shadow:0 2px 8px rgba(15,23,42,.12)" onerror="this.onerror=null;this.src='assets/vkslogo512.png'"/>
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
      Department: <b>${sectionLabel}</b> &nbsp;·&nbsp; ${totalEmpCount} employees &nbsp;·&nbsp; ${dates.length} days &nbsp;·&nbsp; ${orientation.charAt(0).toUpperCase()+orientation.slice(1)} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
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
      <img src="${_vksLogoSrc}" crossorigin="anonymous" alt="VKS Tech" style="width:18px;height:18px;border-radius:4px;object-fit:contain" onerror="this.onerror=null;this.src='assets/vkslogo512.png'"/>
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
    toast(L('❌ त्रुटि: ','❌ Error: ')+(e.message||e));
  }finally{
    document.body.removeChild(printDiv);
  }
}

// ════════════════════════════════════════
// EXCEL EXPORT — Shift Schedule
// ════════════════════════════════════════
/** Load logo as data-URL for Excel branding (same asset as print). */
async function _loadVksLogoDataUrl(){
  // Prefer assets/ path; fall back to root for older deploys
  const candidates = [
    'assets/vkslogo512.png',
    './assets/vkslogo512.png',
    'vkslogo512.png',
    './vkslogo512.png'
  ];
  for(const url of candidates){
    try{
      const res = await fetch(url, { cache: 'force-cache' });
      if(!res.ok) continue;
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve)=>{
        const fr = new FileReader();
        fr.onload = ()=> resolve(fr.result);
        fr.onerror = ()=> resolve(null);
        fr.readAsDataURL(blob);
      });
      if(dataUrl) return dataUrl;
    }catch(e){}
  }
  return null;
}

/**
 * Download Schedule Excel — same fixed columns & order as Team Import template,
 * then daily shift columns. Branding: VKS Tech – Technology is power + logo (like print).
 */
async function exportSchedExcel(){
  if(!isAdminOrMgr()){ toast(L('❌ निर्यात केवल व्यवस्थापक/प्रबंधक','❌ Only Admin/Manager can export')); return; }

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
    'Name','Emp ID','Weekly Off','Mobile','Department',
    'Machine','Designation','Responsibility','Salary (₹/month)','Joining Date','Date of Birth'
  ];

  const headerDates = dates.slice();
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
      e.woff||'',
      mobile,
      section,
      machine,
      desig,
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
    toast(L('❌ एक्सेल लाइब्रेरी लोड नहीं हुई','❌ Excel library not loaded'));
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
    toast(L('✅ एक्सेल डाउनलोड (','✅ Excel downloaded (')+sorted.length+L(' सदस्य) — सेल चुनने योग्य',' members) — cells selectable'));
  }catch(err2){
    console.warn('[exportSchedExcel] xlsx failed', err2);
    toast(L('❌ डाउनलोड विफल','❌ Download failed'));
  }
}


