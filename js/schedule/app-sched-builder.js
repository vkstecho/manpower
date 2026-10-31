/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-team-import.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
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

