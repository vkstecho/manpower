/* Man Power — Schedule Builder UI (grid, selection, filters, save)
 * Auto-gen + coverage → js/schedule/sched-auto-coverage.js (v5.1.0)
 */
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
    section: (typeof L==='function')?L('विभाग','Department'):'Department',
    allSec: (typeof L==='function')?L('सभी विभाग','All Departments'):'All Departments',
    dateRange: (typeof L==='function')?L('तारीख रेंज','Date Range'):'Date Range',
    fullMonth: (typeof L==='function')?L('📅 पूरा महीना','📅 Full Month'):'📅 Full Month',
    customDates: (typeof L==='function')?L('🗓️ कस्टम तारीख','🗓️ Custom Dates'):'🗓️ Custom Dates',
    from: (typeof L==='function')?L('से (From)','From'):'From',
    to: (typeof L==='function')?L('तक (To)','To'):'To',
    hint: (typeof L==='function')?L('उदा. 11 से 20 — केवल ये दिन Schedule में दिखेंगे','e.g. 11 to 20 — only these days will appear in the schedule'):'e.g. 11 to 20 — only these days will appear',
    open: (typeof L==='function')?L('📋 Schedule खोलें','📋 Open Schedule'):'📋 Open Schedule',
    cancel: (typeof L==='function')?L('रद्द करें','Cancel'):'Cancel',
  };
  // Real departments from team roster (Excel), not hardcoded M1/M2 SEC map
  let teamSecs = [];
  try{
    if(typeof _teamFieldValues==='function') teamSecs = _teamFieldValues('section') || [];
  }catch(e){ teamSecs = []; }
  if(!teamSecs.length){
    try{
      const seen = new Set();
      (typeof getEmps==='function'?getEmps():[]).forEach(e=>{
        if(!e || e.status==='resigned' || e.status==='left' || e.status==='left_team') return;
        const s = (typeof getEmpSection==='function'?getEmpSection(e):'') || e.section || e.sec || '';
        if(s && String(s).trim()) seen.add(String(s).trim());
      });
      teamSecs = [...seen].sort((a,b)=>a.localeCompare(b));
    }catch(e){}
  }
  const secOpts = teamSecs.map(s=>{
    const v = String(s).replace(/"/g,'&quot;');
    return `<option value="${v}">${typeof escHtml==='function'?escHtml(s):v}</option>`;
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
function _sbEmpKey(emp){
  if(!emp) return '';
  return String(emp.id || emp.empId || emp._key || emp.empCode || emp.code || '').trim();
}
function _sbNormWoff(w){
  const s = String(w||'').trim().toUpperCase();
  if(!s) return '';
  if(WOFF_DOW[s] != null) return s;
  const three = s.slice(0,3);
  if(WOFF_DOW[three] != null) return three;
  const map = {SUNDAY:'SUN',MONDAY:'MON',TUESDAY:'TUE',WEDNESDAY:'WED',THURSDAY:'THU',FRIDAY:'FRI',SATURDAY:'SAT'};
  return map[s] || three;
}


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
  if(secFilter && secFilter !== 'ALL'){
    const want = String(secFilter).trim();
    const wantN = (typeof _normLabelKey==='function'?_normLabelKey(want):want.toLowerCase());
    emps = emps.filter(e=>{
      const s = ((typeof getEmpSection==='function'?getEmpSection(e):'') || e.section || e.sec || '').toString().trim();
      if(!s) return false;
      if(s === want) return true;
      const sn = (typeof _normLabelKey==='function'?_normLabelKey(s):s.toLowerCase());
      return sn === wantN;
    });
  }

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
    return `<th data-sb-date-col="${d}" class="sb-date-col" style="width:${_sbColW}px;min-width:${_sbColW}px;max-width:${_sbColW}px;box-sizing:border-box;text-align:center;padding:4px 0 2px;margin:0;border:0;border-right:1px solid rgba(148,163,184,.12);font-size:12px;font-weight:900;color:${sun?'#fda4af':'#f8fafc'};line-height:1.15;font-family:system-ui,-apple-system,sans-serif;background:#1e293b;vertical-align:bottom">
      <div style="font-size:13px;font-weight:900;letter-spacing:-0.02em">${d}</div>
      <div style="font-size:10px;font-weight:700;opacity:.9;margin-top:1px">${dow}</div>
      <button type="button" class="sb-col-cp" data-day="${dayIdx}" onclick="event.stopPropagation();_sbColBtnClick(${dayIdx})"
        title="Copy/Paste column" aria-label="Copy column" style="display:block;margin:3px auto 0;width:22px;height:18px;line-height:16px;padding:0;border-radius:4px;border:1px solid rgba(148,163,184,.45);background:rgba(30,41,59,.9);color:#cbd5e1;font-size:10px;font-weight:900;cursor:pointer">↓</button>
    </th>`;
  }).join('');

  const rows = emps.map((emp,rowIdx) => {
    if(!emp) return '';
    if(!emp.id && !emp.empId && !emp._key) return '';
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
      const leaveClick = isLeaveDate ? ` onclick="_confirmLeaveOverride(this,'${_sbEmpKey(emp)}',${dayIdx},'${dateStr}')"` : '';
      return `<td style="padding:0;margin:0;border:0;border-right:1px solid rgba(148,163,184,.06);width:${_sbColW}px;min-width:${_sbColW}px;max-width:${_sbColW}px;box-sizing:border-box;${isWoffDay?'background:rgba(249,115,22,0.06);':''}" title="${isLeaveDate?'🛡️ Approved Leave':isWoffDay?emp.woff+' (Weekly Off)':''}">
        <div class="shc ${cls}" style="width:100%;height:28px;font-size:12px;font-weight:800;cursor:pointer;box-sizing:border-box;touch-action:none;user-select:none;display:flex;align-items:center;justify-content:center;${leaveStyle}${isWoffDay&&!val&&!isLeaveDate?'border:1px dashed rgba(249,115,22,0.3);':''}"${leaveClick}
          data-empid="${_sbEmpKey(emp)}" data-day="${dayIdx}" data-row="${rowIdx}" data-val="${val}" data-isleave="${isLeaveDate?'1':'0'}">
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
    <div id="sbStickyHeader" class="sb-sticky-header" style="position:sticky;top:0;z-index:10;background:var(--bg);padding:0 0 4px;flex-shrink:0">
      <!-- Compact: month + Change -->
      <div class="sb-row-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <div class="modal-title" style="margin:0;font-size:15px;font-weight:900;color:#f8fafc;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0">📅 ${rangeLabel}</div>
        <button type="button" onclick="openScheduleBuilder()" class="sb-change-btn"
          style="background:var(--card);border:1px solid var(--border2);border-radius:8px;color:var(--muted2);padding:6px 10px;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0">← ${(typeof L==='function')?L('बदलें','Change'):'Change'}</button>
      </div>
      <!-- Primary filters: swipe row -->
      <div id="sbPrimaryFilterRow" class="sb-hscroll" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:6px;padding-bottom:2px">
        <button type="button" class="sb-prim-btn" data-prim="section" onclick="_sbSetPrimaryFilter('section')">Department</button>
        <button type="button" class="sb-prim-btn" data-prim="machine" onclick="_sbSetPrimaryFilter('machine')">Machines</button>
        <button type="button" class="sb-prim-btn" data-prim="designation" onclick="_sbSetPrimaryFilter('designation')">Designation</button>
        <button type="button" class="sb-prim-btn" data-prim="responsibility" onclick="_sbSetPrimaryFilter('responsibility')">Responsibility</button>
      </div>
      <!-- Sub filters: swipe row -->
      <div id="sbSubFilterRow" class="sb-hscroll" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:2px;padding-bottom:2px;min-height:34px"></div>
    </div>
    <div id="sbToolbar" style="display:none"></div>
    <!-- Single scroll container: thead + tbody share columns → no laptop misalignment -->
    <div id="sbBodyScroll" style="flex:1 1 auto;min-height:180px;overflow:auto;-webkit-overflow-scrolling:touch;margin-bottom:4px;border:1px solid var(--border2);border-radius:8px">
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
    <!-- Collapsible A/B/C/G/O/Σ counts row -->
    <div id="sbShiftCountsWrap" style="flex-shrink:0;border-top:1px solid var(--border2)">
      <button type="button" id="sbCountsToggle" onclick="window._sbToggleShiftCounts && window._sbToggleShiftCounts()"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 4px;background:transparent;border:none;cursor:pointer;color:var(--muted2);font-size:11px;font-weight:800">
        <span>${(typeof L==='function')?L('शिफ्ट काउंट (A/B/C/Σ)','Shift counts (A/B/C/Σ)'):'Shift counts (A/B/C/Σ)'}</span>
        <span id="sbCountsToggleIcon">▼</span>
      </button>
      <div id="sbShiftCounts" style="display:none;flex-wrap:wrap;gap:6px;align-items:center;padding:2px 2px 6px;font-size:11px;font-weight:800"></div>
    </div>
    <!-- Bottom action bar — thumb zone (Save / Auto) -->
    <div id="sbFooterBar" class="sb-footer-bar modal-sticky-actions" style="position:sticky;bottom:0;z-index:12;flex-shrink:0;background:var(--bg);border-top:1px solid var(--border2);padding:8px 0 calc(8px + env(safe-area-inset-bottom,0px));margin-top:4px">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <select id="sbAutoSort" onchange="window._sbAutoSort=this.value;try{localStorage.setItem('mp_sb_auto_sort',this.value)}catch(e){}"
          title="Auto Generate sequence"
          style="flex:1;min-width:0;font-size:12px;font-weight:700;padding:9px 10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);min-height:42px">
          <option value="section">Sequence: Department</option>
          <option value="machine">Sequence: Machine</option>
          <option value="designation">Sequence: Designation</option>
          <option value="responsibility">Sequence: Responsibility</option>
        </select>
        <button type="button" onclick="clearScheduleBuilderGrid()" class="sb-clear-btn"
          style="flex:0 0 auto;background:rgba(244,63,94,.12);border:1.5px solid rgba(244,63,94,.45);border-radius:10px;
          color:#fb7185;font-size:12px;font-weight:800;padding:9px 12px;cursor:pointer;white-space:nowrap;min-height:42px">
          🗑️ ${(typeof L==='function')?L('क्लियर','Clear'):'Clear'}
        </button>
      </div>
      <div style="display:flex;gap:6px;align-items:stretch">
        <button type="button" id="sbCancelBtn" onclick="closeModal()"
          style="flex:0 0 auto;background:var(--card);border:1px solid var(--border2);border-radius:10px;
          color:var(--muted2);font-size:13px;font-weight:800;padding:12px 14px;cursor:pointer;min-height:48px">
          ${(typeof L==='function')?L('रद्द','Cancel'):'Cancel'}
        </button>
        <button type="button" onclick="autoGenSchedule('${monthKey}')"
          style="flex:1.15;background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:10px;
          color:#fff;font-size:13px;font-weight:800;padding:12px 8px;cursor:pointer;min-height:48px;white-space:nowrap">
          🤖 ${(typeof L==='function')?L('Auto बनाएं','Auto Generate'):'Auto Generate'}
        </button>
        <button type="button" id="sbSaveBtn" onclick="saveScheduleBuilder('${monthKey}')"
          style="flex:1;background:linear-gradient(135deg,#ea580c,#c2410c);border:none;border-radius:10px;
          color:#fff;font-size:13px;font-weight:800;padding:12px 8px;cursor:pointer;min-height:48px">
          💾 ${(typeof L==='function')?L('Save','Save'):'Save'}
        </button>
      </div>
      <div id="sbCellLegend" style="font-size:10px;color:#94a3b8;margin-top:4px;text-align:center">${(typeof L==='function')?L('🖱️ Drag · Double-tap = Copy','🖱️ Drag · Double-tap = Copy'):'🖱️ Drag · Double-tap = Copy'}</div>
    </div>`);
  try{ if(typeof _sbUpdateShiftCounts==='function') _sbUpdateShiftCounts(); }catch(e){}
  try{ document.body.classList.add('sb-builder-open'); /* no orientation lock — portrait UI is primary */ }catch(e){}
  setTimeout(initSBSelection, 50);
  setTimeout(function(){ try{ _sbUpdateShiftCounts(); }catch(e){} }, 100);

  try{
    const tb = document.getElementById('sb_tbody');
    if(tb && !tb._sbCountObs){
      tb._sbCountObs = true;
      const mo = new MutationObserver(function(){ try{ _sbUpdateShiftCounts(); }catch(e){} });
      mo.observe(tb, {childList:true, subtree:true, characterData:true, attributes:true});
    }
  }catch(e){}

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
    // Portrait is usable after mobile toolbar redesign; hint only on very small screens
    if(window.matchMedia && window.matchMedia('(orientation: portrait) and (max-width: 360px)').matches){
      toast((typeof L==='function')?L('📱 ग्रिड के लिए Landscape बेहतर है','📱 Landscape is better for the grid'):'📱 Landscape is better for the grid');
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



/** Count A/B/C/D/N (and G/O) in Auto Schedule grid — same codes as main Schedule */
/** Date-wise shift counts (same idea as main Schedule totals row) */
function _sbUpdateShiftCounts(){
  try{
    const box = document.getElementById('sbShiftCounts');
    if(!box) return;
    const dayNums = [];
    document.querySelectorAll('#sb_tbody .shc').forEach(function(el){
      const d = parseInt(el.getAttribute('data-day'), 10);
      if(!isNaN(d) && dayNums.indexOf(d) < 0) dayNums.push(d);
    });
    dayNums.sort(function(a,b){ return a-b; });
    const codes = ['A','B','C','D','N','O'];
    const colors = {A:'#16a34a',B:'#db2777',C:'#0891b2',D:'#f59e0b',N:'#4f46e5',O:'#64748b'};
    // Per-day counts
    const byDay = {};
    dayNums.forEach(function(d){ byDay[d] = {A:0,B:0,C:0,D:0,N:0,O:0}; });
    document.querySelectorAll('#sb_tbody .shc').forEach(function(el){
      const d = parseInt(el.getAttribute('data-day'), 10);
      if(isNaN(d) || !byDay[d]) return;
      let v = (el.getAttribute('data-shift') || el.textContent || '').toString().trim().toUpperCase();
      if(!v || v==='—' || v==='-' || v==='0') return;
      if(v==='C/O'||v==='CO') return;
      if(v.length>1){ const m=v.match(/[ABCDNO]/); if(m) v=m[0]; }
      if(byDay[d][v] != null) byDay[d][v]++;
    });
    // Compact UI: show day chips for work totals + summary of A/B/C like schedule footer
    let html = '<div style="width:100%;overflow:auto;-webkit-overflow-scrolling:touch">';
    html += '<div style="display:flex;gap:4px;align-items:flex-end;min-width:max-content;padding-bottom:2px">';
    // Header labels column
    html += '<div style="position:sticky;left:0;background:var(--bg);z-index:2;padding-right:6px;font-size:10px;font-weight:800;color:var(--muted2);line-height:1.35">'
      + '<div style="height:16px"></div>'
      + codes.map(function(c){ return '<div style="color:'+colors[c]+'">'+c+'</div>'; }).join('')
      + '<div style="color:var(--text)">Σ</div></div>';
    dayNums.forEach(function(d){
      const c = byDay[d];
      const total = (c.A||0)+(c.B||0)+(c.C||0)+(c.D||0)+(c.N||0);
      html += '<div style="text-align:center;min-width:28px;font-size:10px;font-weight:800;line-height:1.35">'
        + '<div style="color:var(--muted2);height:16px">'+d+'</div>'
        + codes.map(function(code){
            const n = c[code]||0;
            return '<div style="color:'+colors[code]+'">'+(n||'·')+'</div>';
          }).join('')
        + '<div style="color:var(--text)">'+total+'</div></div>';
    });
    html += '</div></div>';
    // Also keep global totals strip
    const g={A:0,B:0,C:0,D:0,N:0,O:0};
    dayNums.forEach(function(d){ codes.forEach(function(code){ g[code]+=(byDay[d][code]||0); }); });
    const work=g.A+g.B+g.C+g.D+g.N;
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;align-items:center">'
      + '<span style="color:var(--muted2);font-size:11px;font-weight:800">'+(typeof L==='function'?L('कुल','Total'):'Total')+'</span>'
      + codes.filter(function(c){return c!=='O'||g.O;}).map(function(c){
          return '<span style="display:inline-flex;gap:3px;padding:2px 7px;border-radius:999px;background:'+colors[c]+'22;color:'+colors[c]+';border:1px solid '+colors[c]+'55;font-size:11px;font-weight:800"><b>'+c+'</b> '+g[c]+'</span>';
        }).join('')
      + '<span style="font-size:11px;font-weight:800;color:var(--text)">Σ Work: '+work+'</span></div>';
    box.innerHTML = html;
  }catch(e){ console.warn('[sb counts]', e); }
}

// Default: collapsed (user can expand when needed)
window._sbCountsOpen = false;
window._sbToggleShiftCounts = function(){
  try{
    window._sbCountsOpen = !window._sbCountsOpen;
    const box = document.getElementById('sbShiftCounts');
    const icon = document.getElementById('sbCountsToggleIcon');
    if(box) box.style.display = window._sbCountsOpen ? 'flex' : 'none';
    if(icon) icon.textContent = window._sbCountsOpen ? '▲' : '▼';
    try{ localStorage.setItem('mp_sb_counts_open', window._sbCountsOpen ? '1' : '0'); }catch(e){}
  }catch(e){}
};
try{
  const pref = localStorage.getItem('mp_sb_counts_open');
  // Only expand if user previously chose open ('1'). Default / missing / '0' → collapsed
  if(pref === '1'){
    window._sbCountsOpen = true;
  } else {
    window._sbCountsOpen = false;
  }
  setTimeout(function(){
    const box = document.getElementById('sbShiftCounts');
    const icon = document.getElementById('sbCountsToggleIcon');
    if(box) box.style.display = window._sbCountsOpen ? 'flex' : 'none';
    if(icon) icon.textContent = window._sbCountsOpen ? '▲' : '▼';
  }, 50);
}catch(e){}

try{ window._sbUpdateShiftCounts = _sbUpdateShiftCounts; }catch(e){}
