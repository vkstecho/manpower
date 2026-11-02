/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-login-session.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
async function renderHome(){
  try{
    let host = document.getElementById('homeTodaySummary');
    if(!host){
      const tab = document.getElementById('tab-home');
      if(tab){
        host = document.createElement('div');
        host.id = 'homeTodaySummary';
        tab.insertBefore(host, tab.firstChild);
      }
    }
    if(host) host.innerHTML = _homeTodaySummaryHtml();
  }catch(e){}

  try{ if(typeof _forceShiftBadgeColors==='function') _forceShiftBadgeColors(); }catch(e){}
  if(typeof isPendingMember==='function' && isPendingMember()){
    try{
      const roster = document.getElementById('homeRoster');
      if(roster) roster.innerHTML = `<div class="hm-empty" style="padding:14px;margin:8px 0;border-radius:12px;border:1px dashed rgba(234,179,8,.5);background:rgba(234,179,8,.08)">
        <div style="font-weight:900;color:var(--text);margin-bottom:6px">⏳ Manager approval pending</div>
        <div style="font-size:12px;color:var(--muted2);line-height:1.5">आप Manager की approval का इंतज़ार कर रहे हैं। अभी सिर्फ <b>अपनी शिफ्ट</b>, <b>Learn &amp; Grow</b> और <b>To-Do</b> उपलब्ध हैं। Team schedule / Leave / Reports Manager approve के बाद खुलेंगे।</div>
      </div>`;
    }catch(e){}
  }

  const emps=getEmps().filter(e=>e.status!=='resigned' && Array.isArray(e.ms) && e.ms.length > 0);
  const stillLoading = _cache.employees === null;
  const en = (_lang !== 'hi');

  // Always show BOTH blocks (same Home for Manager + Individual)
  const adminEl = document.getElementById('homeAdminView');
  const workerEl = document.getElementById('homeWorkerView');
  if(adminEl) adminEl.style.display='block';
  // Personal 3/14 calendar removed — My Shift tab only
  if(workerEl) workerEl.style.display='none';

  const _hdl=document.getElementById('homeDateLbl');
  if(_hdl) _hdl.textContent =
    TODAY_DATE.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  if(!emps || emps.length===0){
    const _hs0=document.getElementById('homeStats');
    if(_hs0) _hs0.innerHTML=`
      <div class="stat-card"><div class="stat-val" style="color:var(--muted)">...</div><div class="stat-lbl" id="dayStatLbl">${en?'Day Shift':'दिन शिफ्ट'}</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--muted)">...</div><div class="stat-lbl" id="nightStatLbl">${en?'Night Shift':'रात शिफ्ट'}</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--muted)">...</div><div class="stat-lbl" id="leaveStatLbl">${en?'On Leave':'छुट्टी पर'}</div></div>`;
    if(stillLoading){
      (document.getElementById('homeSections')||{innerHTML:''}).innerHTML='<div style="text-align:center;padding:20px;color:var(--muted2)">🔄 '+(en?'Loading data from Firebase...':'Firebase से डेटा लोड हो रहा है...')+'</div>';
      if(!window._empLoadWatch){
        window._empLoadWatch = setTimeout(()=>{
          if(_cache.employees === null){
            _cache.employees = [];
            console.warn('[home] employees load timeout — showing empty');
            try{ renderHome(); }catch(e){}
          }
        }, 8000);
      }
    } else {
      (document.getElementById('homeSections')||{innerHTML:''}).innerHTML=`<div style="text-align:center;padding:30px 16px;color:var(--muted2)">
        <div style="font-size:36px;margin-bottom:10px">👥</div>
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px">${en?'Team data not available yet':'अभी Team डेटा उपलब्ध नहीं'}</div>
      </div>`;
    }
    (document.getElementById('homeRoster')||{innerHTML:''}).innerHTML='';
    // Still try personal calendar
    try{ _renderHomePersonalCalendar(); }catch(e){}
    try{ updateHomeTodoSummary(); }catch(e){}
    return;
  }

  // ════════════════════════════════════════
  // 1) MANPOWER SUMMARY — same for all users
  // ════════════════════════════════════════
  (document.getElementById('homeNotice')||{innerHTML:''}).innerHTML='';

  const dayE=emps.filter(e=>getShift(e,TODAY_STR)==='D').length;
  const nE  =emps.filter(e=>getShift(e,TODAY_STR)==='N').length;
  const lvE =emps.filter(e=>getShift(e,TODAY_STR)==='L').length;

  // ONE summary only (under date) — coloured shift-split cards, non-zero codes
  try{
    const hs = document.getElementById('homeStats');
    if(hs){
      hs.className = 'today-summary-host';
      hs.innerHTML = (typeof _homeTodaySummaryHtml==='function') ? _homeTodaySummaryHtml() : '';
    }
    const topDup = document.getElementById('homeTodaySummary');
    if(topDup){ topDup.innerHTML = ''; topDup.style.display = 'none'; }
  }catch(e){ console.warn('[homeStats]', e); }


  const isMet = e => { const sec=getEmpSection(e); return /metalliser/i.test(sec) || (SEC[e.sec]||{}).type==='metalliser' || ['M1','M2','MET'].includes(String(e.sec||'').toUpperCase()); };
  const isSlit= e => { const sec=getEmpSection(e); return /slitter/i.test(sec) || (SEC[e.sec]||{}).type==='slitter' || ['S1','S2','SLIT'].includes(String(e.sec||'').toUpperCase()); };
  const isMetProd = e => { const sec=getEmpSection(e); return /met\s*prod|metprod/i.test(sec); };
  const isEng = e => {
    const t=(SEC[e.sec]||{}).type;
    if(t==='sup' || t==='mgr') return true;
    const s=String(e.sec||'').toUpperCase();
    if(s==='SUP'||s==='ALL'||s==='MGR') return true;
    const role=(getEmpRole(e).role||'');
    if(role==='sup_met'||role==='sup_slit'||role==='mgr') return true;
    const des=(e.designation||'').toLowerCase();
    if(des.includes('engineer')||des.includes('supervisor')||des.includes('get')) return true;
    return false;
  };
  const onDuty = sh => isWorking(sh) || sh==='D' || sh==='N' || sh==='G' || sh==='GP';
  const isDay  = sh => sh==='D';
  const isNight= sh => sh==='N';

  const metEmps  = emps.filter(isMet);
  const slitEmps = emps.filter(isSlit);
  const engEmps  = emps.filter(isEng);

  const metDay   = metEmps.filter(e=>isDay(getShift(e,TODAY_STR)));
  const metNight = metEmps.filter(e=>isNight(getShift(e,TODAY_STR)));
  const slitDay  = slitEmps.filter(e=>isDay(getShift(e,TODAY_STR)));
  const slitNight= slitEmps.filter(e=>isNight(getShift(e,TODAY_STR)));
  const engToday = engEmps.filter(e=>onDuty(getShift(e,TODAY_STR)));

  const metDuty  = metDay.length + metNight.length;
  const slitDuty = slitDay.length + slitNight.length;
  const metMin   = (CFG.minShift && CFG.minShift.metalliser) || 0;
  const slitMin  = (CFG.minShift && CFG.minShift.slitter) || 0;
  const metWarn  = metMin>0 && metDuty<metMin;
  const slitWarn = slitMin>0 && slitDuty<slitMin;

  let secNames = _teamFieldValues('section');
  // Members whose Section was never set (machine code only) — show under Unassigned until Excel re-upload
  const unassigned = emps.filter(e=>!getEmpSection(e));
  if(unassigned.length && !secNames.includes('Unassigned')){
    /* do not add fake section name to filters — only list real Excel sections */
  }
  const _hst = document.getElementById('homeSectionTitle');
  if(_hst) _hst.textContent = en
    ? ("Today's Shift — " + (secNames.join(' · ') || 'All sections'))
    : ('आज की शिफ्ट — ' + (secNames.join(' · ') || 'सभी'));

  // Build one summary card per Excel Section
  (document.getElementById('homeSections')||{innerHTML:''}).innerHTML = secNames.map((secName, idx)=>{
    const list = emps.filter(e=>getEmpSection(e)===secName);
    const dayN = list.filter(e=>isDay(getShift(e,TODAY_STR))).length;
    const nightN = list.filter(e=>isNight(getShift(e,TODAY_STR))).length;
    const duty = dayN + nightN;
    const colors = ['#f97316','#0284c7','#7c3aed','#16a34a','#db2777'];
    const col = colors[idx % colors.length];
    const mcs = [...new Set(list.map(e=>getEmpMachine(e)).filter(Boolean))].slice(0,4).join(' · ') || '—';
    return `<div class="sec-card">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="sec-icon" style="background:${col}22">🏭</div>
        <div>
          <div class="sec-name" style="color:${col}">${secName}</div>
          <div class="sec-machine">${mcs}</div>
        </div>
      </div>
      <div>
        <div class="sec-count" style="color:${col}">${duty}/${list.length}</div>
        <div class="sec-count-lbl" style="font-size:10px">${en?'Duty':'ड्यूटी'} <span style="color:#f59e0b">${dayN}D</span> <span style="color:#4f46e5">${nightN}N</span></div>
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--muted2);padding:12px">Upload team Excel to see sections</div>';

  function _nameChip(emp, sh){
    const role=(typeof getEmpRole==='function'?getEmpRole(emp):null)||{role:'assist'};
    const isMain=role.role==='main';
    const isSup=role.role==='sup_met'||role.role==='sup_slit';
    const chipCls = 'hm-chip' + (isMain?' main':isSup?' sup':'');
    const badge=isMain?'<span class="hm-chip-badge-main">MAIN</span>'
               :isSup?'<span class="hm-chip-badge-sup">SUP</span>':'';
    const _st = (typeof mpShiftStyle==='function') ? mpShiftStyle(cellDisp(sh)||sh) : {bg:'#475569',fg:'#fff'};
    const shLabel = sh ? mpShiftBadgeHtml(sh, {w:28,h:24,fs:13,extraStyle:'margin-left:6px;'}) : '';
    return `<div class="${chipCls}">
      <div class="hm-chip-name">${escHtml(emp.name)}</div>
      <div class="hm-chip-meta">
        <span>${emp.mc||(typeof secName==='function'?secName(emp.sec):'')||'—'}</span>
        ${badge}${shLabel}
      </div>
    </div>`;
  }
  function _groupBlock(title, icon, color, list, emptyMsg){
    const chips = list.length
      ? `<div class="hm-chips">${list.map(e=>_nameChip(e,getShift(e,TODAY_STR))).join('')}</div>`
      : `<div class="hm-empty">${emptyMsg}</div>`;
    return `<div class="hm-group">
      <div class="hm-group-hdr">
        <span class="hm-group-icon">${icon}</span>
        <span class="hm-group-title" style="color:${color}">${title}</span>
        <span class="hm-group-count" style="color:${color}">${list.length}</span>
      </div>
      ${chips}
    </div>`;
  }

  let rosterHtml = `<div class="stitle hm-section-title">${en?'Manpower on Duty — Names':'ड्यूटी पर Manpower — नाम'}</div>`;
  const _secList = secNames.length ? secNames : _teamFieldValues('section');
  _secList.forEach(secName=>{
    const list = emps.filter(e=>getEmpSection(e)===secName);
    const dayList = list.filter(e=>isDay(getShift(e,TODAY_STR)));
    const nightList = list.filter(e=>isNight(getShift(e,TODAY_STR)));
    const genList = list.filter(e=>{ const sh=getShift(e,TODAY_STR); return sh==='G'||sh==='GP'; });
    if(dayList.length) rosterHtml += _groupBlock((en?'Day Shift — ':'दिन — ')+secName, '☀️', '#f59e0b', dayList, '');
    if(nightList.length) rosterHtml += _groupBlock((en?'Night Shift — ':'रात — ')+secName, '🌙', '#4f46e5', nightList, '');
    if(genList.length) rosterHtml += _groupBlock((en?'General — ':'जनरल — ')+secName, '🔵', '#0284c7', genList, '');
  });
  // Engineers / non-operation roles still shown
  if(typeof engToday!=='undefined' && engToday && engToday.length)
    rosterHtml += _groupBlock(en?'Engineers / Others Today':'आज Engineers / अन्य', '👷', '#7c3aed', engToday, '');
  rosterHtml += `<div class="hm-link-sched" onclick="goTab('schedule')">${en?'View full schedule →':'पूरा शेड्यूल देखें →'}</div>`;
  (document.getElementById('homeRoster')||{innerHTML:''}).innerHTML = rosterHtml;

  // ════════════════════════════════════════
  // 2) PERSONAL CALENDAR — previous 3 + upcoming 14 (all users)
  // ════════════════════════════════════════
  try{ _renderHomePersonalCalendar(); }catch(e){ console.warn('[home] personal cal', e); }
  try{ updateHomeTodoSummary(); }catch(e){}
}

/** Personal shift strip: Past 3 days + Upcoming 14 days — used by every role */
function _renderHomePersonalCalendar(){
  const en = (_lang !== 'hi');
  const calEl = document.getElementById('homeShiftCalendar');
  const titleEl = document.getElementById('homeWorkerCalTitle');
  if(titleEl) titleEl.textContent = en ? '📅 My Shift — Past 3 & Next 14 Days' : '📅 मेरी शिफ्ट — पिछले 3 और अगले 14 दिन';
  if(!calEl) return;

  const e = myEmp();
  if(!e){
    calEl.innerHTML = `<div class="hm-empty" style="padding:16px;text-align:center">${en?'Your employee profile is not linked — personal shift not available.':'आपकी employee profile लिंक नहीं है — व्यक्तिगत शिफ्ट उपलब्ध नहीं।'}</div>`;
    return;
  }

  try{
    if(!isAdminOrMgr()){
      fbGet('deviceApprovals/' + e.id).then(approval=>{
        if(approval && approval.validTill){
          const daysLeft = Math.ceil((new Date(approval.validTill) - new Date()) / 86400000);
          if(daysLeft <= 7 && daysLeft > 0 && !sessionStorage.getItem('validity_warned')){
            sessionStorage.setItem('validity_warned','1');
            setTimeout(()=> toast((typeof L==='function')?L('⚠️ Paid till: सिर्फ '+daysLeft+' दिन बाकी! Profile tap करें।','⚠️ Paid till: Only '+daysLeft+' days left! Tap Profile.'):('⚠️ Only '+daysLeft+' days left')), 2500);
          }
        }
      }).catch(()=>{});
    }
  }catch(e2){}

  const todaySh=getShift(e,TODAY_STR);
  const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayName = (dObj) => en ? DAYS_EN[dObj.getDay()] : DAYS[dObj.getDay()];

  function _dayCard(dateStr){
    const dO = new Date(dateStr+'T12:00:00');
    const sh = getShift(e, dateStr);
    const isT = dateStr===TODAY_STR;
    const infoShifts = ['L','CO','C/O','OD','Ab','HLF','H'];
    const click = infoShifts.includes(sh)
      ? `onclick="showShiftInfo('${e.id}','${escHtml(String(e.name).replace(/'/g,"\\'"))}','${dateStr}','${sh}')" style="cursor:pointer"`
      : '';
    return `<div class="hm-day-card${isT?' today':''}" ${click}>
      <div class="hm-day-name">${dayName(dO)}</div>
      <div class="hm-day-num">${dO.getDate()}</div>
      ${shiftBadgeHtml(sh)}
    </div>`;
  }

  const prevDates = [-3,-2,-1].map(n => addDays(TODAY_STR, n));
  const nextDates = Array.from({length:14}, (_,i)=> addDays(TODAY_STR, i+1));

  let calHtml = '';

  const todayLabel = todaySh ? `${cellDisp(todaySh)} · ${shiftWord(todaySh)}` : '—';
  const longLabel = todaySh==='D' ? (en?'Day Shift':'दिन शिफ्ट')
                    : todaySh==='N' ? (en?'Night Shift':'रात शिफ्ट')
                    : todaySh==='A' ? (en?'A Shift (morning)':'A शिफ्ट')
                    : todaySh==='B' ? (en?'B Shift (afternoon)':'B शिफ्ट')
                    : todaySh==='C' ? (en?'C Shift (evening)':'C शिफ्ट')
                    : todaySh==='L' ? (en?'On Leave':'छुट्टी')
                    : todaySh==='O' ? (en?'Weekly Off':'साप्ताहिक छुट्टी')
                    : todaySh==='G' ? (en?'General Shift':'जनरल शिफ्ट')
                    : (shiftWord(todaySh) || cellDisp(todaySh) || '—');

  calHtml += `<div class="hm-today-banner">
    ${shiftBadgeHtml(todaySh, 'lg')}
    <div style="flex:1">
      <div class="hm-today-label">${en?'Today':'आज'}</div>
      <div class="hm-today-shift">${longLabel}</div>
      <div class="hm-today-sub">${escHtml(e.name||'')} · ${secName(e.sec)||''}${e.mc?' · '+e.mc:''}</div>
    </div>
  </div>`;

  calHtml += `<div class="stitle">${en?'Previous 3 Days':'पिछले 3 दिन'}</div>
  <div class="hm-day-row">${prevDates.map(d => _dayCard(d)).join('')}</div>`;

  calHtml += `<div class="stitle">${en?'Upcoming 14 Days':'अगले 14 दिन'}</div>
  <div class="hm-day-row">${nextDates.map(d => _dayCard(d)).join('')}</div>`;

  // Full fixed legend
  const legendItems = en
    ? [['D','Day','#f59e0b','#1a1a2e'],['N','Night','#4f46e5','#fff'],['A','A Shift','#16a34a','#fff'],['B','B Shift','#db2777','#fff'],['C','C Shift','#0891b2','#fff'],['O','Off','#475569','#fff'],['L','Leave','#be123c','#fff'],['G','General Shift','#0284c7','#fff'],['CO','C-Off','#92400e','#fde68a'],['H','Holiday','#ea580c','#fff']]
    : [['D','दिन','#f59e0b','#1a1a2e'],['N','रात','#4f46e5','#fff'],['A','A शिफ्ट','#16a34a','#fff'],['B','B शिफ्ट','#db2777','#fff'],['C','C शिफ्ट','#0891b2','#fff'],['O','ऑफ','#475569','#fff'],['L','छुट्टी','#be123c','#fff'],['G','जनरल','#0284c7','#fff'],['CO','C-Off','#92400e','#fde68a'],['H','हॉलिडे','#ea580c','#fff']];
  calHtml += `<div class="hm-legend">
    ${legendItems.map(([c,l,bg,fg])=>
      `<div class="hm-legend-item"><span class="hm-leg-swatch" style="background:${bg};color:${fg}">${c}</span><span>${l}</span></div>`
    ).join('')}
  </div>`;

  if(todaySh && isWorking(todaySh)){
    const allEmps = getEmps().filter(emp => emp.status !== 'resigned' && emp.id !== e.id);
    const shiftMates = allEmps.filter(emp => {
      const theirShift = getShift(emp, TODAY_STR);
      return theirShift === todaySh || (todaySh === 'G' && isWorking(theirShift));
    });
    if(shiftMates.length > 0){
      const shiftLabel = todaySh === 'D' ? (en?'Day Shift mates':'दिन शिफ्ट साथी') : todaySh === 'N' ? (en?'Night Shift mates':'रात शिफ्ट साथी') : (en?'Shift mates today':'आज के शिफ्ट साथी');
      const shiftColor = todaySh === 'D' ? '#f59e0b' : todaySh === 'N' ? '#4f46e5' : todaySh === 'G' || todaySh === 'GP' ? '#0284c7' : '#38bdf8';
      calHtml += `<div class="stitle" style="margin-top:8px">${shiftLabel}</div>
      <div class="hm-mates">
        <div class="hm-mates-meta">${en?'Total':'कुल'} <b style="color:${shiftColor}">${shiftMates.length}</b></div>
        <div class="hm-chips">
          ${shiftMates.slice(0,24).map(emp => {
            const role=getEmpRole(emp);
            const isMain=role.role==='main';
            const isSup=role.role==='sup_met'||role.role==='sup_slit';
            const chipCls = 'hm-chip' + (isMain?' main':isSup?' sup':'');
            return `<div class="${chipCls}">
              <div class="hm-chip-name">${escHtml(emp.name)}</div>
              <div class="hm-chip-meta">${emp.mc||secName(emp.sec)||'—'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }
  } else if(todaySh === 'O' || todaySh === 'L' || todaySh === 'CO' || todaySh === 'C/O'){
    const offMsg = todaySh === 'L'
      ? (en?'🏖️ You are on leave today — rest well!':'🏖️ आज आपकी छुट्टी है — आराम करें!')
      : (en?'😊 Weekly off today — enjoy!':'😊 आज आपका ऑफ है — मज़े करें!');
    calHtml += `<div class="hm-off-msg">${offMsg}</div>`;
  }

  calEl.innerHTML = calHtml;
}


// ════════════════════════════════════════
// HOME TODO SUMMARY (compact card linking to tab)
// ════════════════════════════════════════

async function updateHomeTodoSummary(){
  try{
    const raw = await fbGetTodos();
    let todos = Object.entries(raw).map(([id,v])=>({...v,id}));
    const myEmpObjId = SESSION.empObjId||'';
    const myEmpId = SESSION.empId||'';
    const myName = (SESSION.name||'').toLowerCase();
    
    // Scope same as To-Do tab (manager = own team only)
    todos = todos.filter(t=> typeof _todoBelongsToMe==='function' ? _todoBelongsToMe(t) : (
      t.assignedToEmpId===myEmpObjId ||
      (t.assignedToEmpId===''&&t.assignedTo&&t.assignedTo.toLowerCase()===myName) ||
      t.createdBy===myEmpId || t.createdBy===myEmpObjId
    ));
    
    const pending = todos.filter(t=>!t.done).length;
    const done = todos.filter(t=>t.done).length;
    const urgent = todos.filter(t=>!t.done && t.priority==='high').length;
    
    const titleEl = document.getElementById('homeTodoTitle');
    const metaEl = document.getElementById('homeTodoMeta');
    const badgeEl = document.getElementById('homeTodoPendingBadge');
    
    if(titleEl) titleEl.textContent = pending > 0 ? `${pending} काम बाकी` : 'सब काम पूरा!';
    if(metaEl) metaEl.textContent = `${done} done` + (urgent > 0 ? ` · ${urgent} urgent` : '') + ` · Total ${todos.length}`;
    if(badgeEl){
      badgeEl.textContent = pending;
      badgeEl.style.color = pending > 0 ? (urgent > 0 ? 'var(--lv)' : 'var(--day)') : 'var(--green)';
    }
  }catch(e){
    const metaEl = document.getElementById('homeTodoMeta');
    if(metaEl) metaEl.textContent = 'Load error';
  }
}

async function submitHomeTodo(){
  const title=(document.getElementById('htdTitle')?.value||'').trim();
  if(!title){ toast(L('❌ काम का नाम डालें','❌ Enter task name')); return; }
  const desc=(document.getElementById('htdDesc')?.value||'').trim();
  const priority=document.getElementById('htdPriority')?.value||'medium';
  const dueDate=document.getElementById('htdDue')?.value||'';
  const assigneeVal=document.getElementById('htdAssignee')?.value||'';
  const [assigneeId, assigneeName] = assigneeVal.split('|');

  const todo = {
    title, desc, priority,
    done: false,
    dueDate: dueDate||null,
    assignedToEmpId: assigneeId||SESSION.empObjId||'',
    assignedTo: assigneeName||SESSION.name||'',
    section: SESSION.dept||'',
    createdBy: SESSION.empId||SESSION.empObjId||'',
    createdByName: SESSION.name||'',
    createdAt: Date.now()
  };
  try{
    await fbPush('todos', todo);
    // Notify assignee if different from self
    if(assigneeId && assigneeId !== SESSION.empObjId){
      try{
        await fbPush('userNotifications/'+assigneeId,{
          title:'📌 नया काम assign हुआ',
          body: title + (SESSION.name?' — '+SESSION.name:''),
          read:false, at:new Date().toISOString()
        });
        // WhatsApp notification
        const emp = getEmps().find(e => e.id === assigneeId);
        if(emp && emp.phone && emp.phone.length === 10){
          const prioLabel = priority==='high' ? '🔴 Urgent' : priority==='low' ? '🟢 Low' : '🟡 Normal';
          const dueFmt = dueDate ? (typeof mpFormatDate==='function'?mpFormatDate(dueDate):new Date(dueDate).toLocaleDateString()) : '';
          const waMsg = (typeof buildWAForEmp==='function')
            ? buildWAForEmp('waTaskTemplate', emp, {
                title: title, desc: desc||'', priority: prioLabel,
                assigner: SESSION.name||'Admin',
                due: dueFmt ? (' *'+dueFmt+'*') : ''
              })
            : ('📌 *Task*\n'+title);
          setTimeout(()=>{ openWA(emp.phone, waMsg); }, 400);
        }
      }catch(e2){}
    }
    document.getElementById('htdTitle').value='';
    document.getElementById('htdDesc').value='';
    toast(L('✅ काम जोड़ा गया!','✅ Task added!'));
    updateHomeTodoSummary();
    goTab('todo');
  }catch(e){ toast('❌ Error: '+e.message); }
}

// ════════════════════════════════════════
// MY SHIFT
// ════════════════════════════════════════

// ════════════════════════════════════════
// MY SHIFT — records + branded calendar download
// ════════════════════════════════════════
function openMyShiftRecordsPanel(){
  const host = document.getElementById('myShiftDlPanel');
  if(!host) return;
  if(host.dataset.open === '1'){
    host.innerHTML = '';
    host.dataset.open = '0';
    return;
  }
  host.dataset.open = '1';
  host.innerHTML = `
    <div style="background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:900;margin-bottom:8px">📥 ${L('Shift Details Download','Shift Details Download')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div>
          <label style="font-size:10px;color:var(--muted2);font-weight:700">${L('प्रकार','Type')}</label>
          <select id="msLdType" class="inp-field" style="width:100%;margin-top:4px">
            <option value="shift_all">All Shift Codes</option>
            <option value="shift_D">Day Shift (D)</option>
            <option value="shift_N">Night Shift (N)</option>
            <option value="shift_O">Weekly Off (O)</option>
            <option value="shift_L">Leave (L)</option>
            <option value="shift_Ab">Absent (Ab)</option>
            <option value="shift_H">Holiday (H)</option>
            <option value="shift_CO">C-Off (C/O)</option>
            <option value="shift_G">General (G)</option>
            <option value="shift_A">A Shift</option>
            <option value="shift_B">B Shift</option>
            <option value="shift_C">C Shift</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted2);font-weight:700">${L('से','From')}</label>
          <input type="date" id="msLdFrom" class="inp-field" style="width:100%;margin-top:4px">
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted2);font-weight:700">${L('तक','To')}</label>
          <input type="date" id="msLdTo" class="inp-field" style="width:100%;margin-top:4px">
        </div>
        <div style="display:flex;align-items:flex-end">
          <button type="button" onclick="downloadMyShiftRecords()" class="submit-btn" style="width:100%;padding:10px;border-radius:10px;font-weight:800;border:none;cursor:pointer;background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff">📥 Download Excel</button>
        </div>
      </div>
    </div>`;
  try{
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const iso = d => d.toISOString().slice(0,10);
    document.getElementById('msLdFrom').value = iso(new Date(y, m, 1));
    document.getElementById('msLdTo').value = iso(new Date(y, m+1, 0));
  }catch(e){}
}

async function downloadMyShiftRecords(){
  // Reuse leave/shift download pipeline with My Shift field ids
  const typeEl = document.getElementById('msLdType');
  const fromEl = document.getElementById('msLdFrom');
  const toEl = document.getElementById('msLdTo');
  if(!typeEl || !fromEl || !toEl){ toast(L('⚠️ Panel open करें','⚠️ Open the panel')); return; }
  // Temporarily map to ld* ids expected by downloadLeaveOrShiftRecords OR inline
  const type = typeEl.value || 'shift_all';
  const from = fromEl.value || '';
  const to = toEl.value || '';
  if(!from || !to){ toast(L('⚠️ From / To date चुनें','⚠️ Select From / To dates')); return; }
  if(from > to){ toast(L('⚠️ From date, To से पहले हो','⚠️ From date must be before To')); return; }

  const emp = (typeof myEmp==='function' ? myEmp() : null)
    || (getEmps()||[]).find(e=>e.id===SESSION.empObjId || e.empId===SESSION.empId);
  if(!emp){ toast(L('⚠️ Employee profile नहीं मिला','⚠️ Employee profile not found')); return; }
  const myMobile = String(SESSION.mobile||emp.phone||'').replace(/\D/g,'').slice(-10);
  const genAt = new Date().toLocaleString('en-IN');
  const want = type.replace('shift_','');
  const rows = [];
  rows.push(['Man Power App — Shift History']);
  rows.push(['VKS Tech — Technology is power']);
  rows.push(['Member', emp.name||SESSION.name||'', 'Code', emp.empId||'', 'Mobile', myMobile]);
  rows.push(['Filter', want==='all'?'All codes':want, 'From', from, 'To', to]);
  rows.push(['Generated', genAt]);
  rows.push([]);
  rows.push(['#','Date','Day','Shift Code','Meaning']);
  const meaning = {D:'Day',N:'Night',A:'A',B:'B',C:'C',O:'Weekly Off',L:'Leave','C/O':'Comp Off',CO:'Comp Off',H:'Holiday',Ab:'Absent',G:'General Shift',GP:'Gate Pass',HLF:'Half Day',OD:'Other Dept'};
  let n = 0;
  const cur = new Date(from+'T12:00:00');
  const end = new Date(to+'T12:00:00');
  while(cur <= end){
    const ymd = cur.toISOString().slice(0,10);
    let sh = '';
    try{ sh = (typeof getShift==='function') ? String(getShift(emp, ymd)||'') : ''; }catch(e){}
    const up = sh.toUpperCase();
    let match = false;
    if(want==='all') match = !!sh;
    else if(want==='CO') match = (up==='C/O'||up==='CO'||up==='C-OFF');
    else if(want==='Ab') match = (typeof _isAbsentShift==='function' ? _isAbsentShift(sh) : /^Ab/i.test(sh));
    else match = (up === want.toUpperCase() || sh === want);
    if(match){
      n++;
      rows.push([n, ymd, cur.toLocaleDateString('en-IN',{weekday:'short'}), sh||'—', meaning[sh]||meaning[up]||'']);
    }
    cur.setDate(cur.getDate()+1);
  }
  if(!n) rows.push(['—','No matching shifts in range']);
  const fileBase = 'ManPower_Shifts_'+want+'_'+from+'_to_'+to;
  try{
    try{ await _ensureXlsxLib(); }catch(e){}
    if(window.XLSX){
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Shifts');
      XLSX.writeFile(wb, fileBase + '.xlsx');
      toast('📤 Excel downloaded');
      return;
    }
  }catch(e){ console.warn(e); }
  const csv = rows.map(r=>r.map(c=>{ const s=String(c==null?'':c); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download = fileBase+'.csv'; a.click();
  toast('📤 CSV downloaded');
}

function openShiftCalendarDownload(){
  const emp = (typeof myEmp==='function' ? myEmp() : null);
  if(!emp){ toast('⚠️ Profile not found'); return; }
  const now = new Date();
  const months = [];
  for(let i=-6;i<=3;i++){
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    const label = d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
    const sel = (_myShiftMonth && _myShiftMonth.getFullYear()===d.getFullYear() && _myShiftMonth.getMonth()===d.getMonth()) ? ' selected' : '';
    months.push(`<option value="${key}"${sel}>${label}</option>`);
  }
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📅 ${L('Shift Calendar Download','Shift Calendar Download')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">${L('महीना चुनें — Print जैसा रंग + Man Power / VKS Tech branding','Pick month — same colours as Print + Man Power / VKS Tech branding')}</div>
    <div class="field" style="margin-bottom:14px">
      <label>${L('महीना','Month')}</label>
      <select id="scDlMonth" class="inp-field">${months.join('')}</select>
    </div>
    <button class="submit-btn" onclick="downloadMyShiftCalendar()" style="width:100%">📥 ${L('Download Calendar','Download Calendar')}</button>
    <button class="cancel-btn" onclick="closeModal()" style="width:100%;margin-top:8px">${L('रद्द','Cancel')}</button>`);
}

/** Personal month calendar PNG — same shift colours + branding as Schedule print */
async function downloadMyShiftCalendar(){
  const emp = (typeof myEmp==='function' ? myEmp() : null);
  if(!emp){ toast('⚠️ Profile not found'); return; }
  const mk = (document.getElementById('scDlMonth')||{}).value || '';
  if(!mk){ toast(L('⚠️ Month चुनें','⚠️ Select month')); return; }
  const [yr, mo] = mk.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const first = new Date(yr, mo-1, 1);
  const startDow = first.getDay();
  const monthName = first.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const genAt = new Date().toLocaleString('en-IN');

  // Same palette as printSched / _execPrint
  const SBG={D:'#f59e0b',N:'#4f46e5',A:'#16a34a',B:'#db2777',C:'#0891b2',O:'#dcfce7',L:'#fee2e2','C/O':'#ede9fe',G:'#e0f2fe',H:'#ffedd5',OD:'#ccfbf1',HLF:'#fed7aa',Ab:'#fecaca',GP:'#fdf4ff'};
  const SCL={D:'#000',N:'#fff',A:'#fff',B:'#fff',C:'#fff',O:'#16a34a',L:'#dc2626','C/O':'#7c3aed',G:'#0369a1',H:'#c2410c',OD:'#0d9488',HLF:'#c2410c',Ab:'#991b1b',GP:'#9333ea'};

  let logoDataUrl = null;
  try{ logoDataUrl = await _loadVksLogoDataUrl(); }catch(e){}

  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let dayCells = '';
  for(let i=0;i<startDow;i++) dayCells += `<div style="min-height:64px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const ds = yr+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    let sh = '';
    try{ sh = String(getShift(emp, ds)||''); }catch(e){}
    const bg = SBG[sh] || '#f1f5f9';
    const cl = SCL[sh] || '#475569';
    const disp = sh==='C/O'?'CO':(sh==='HLF'?'½':(sh||'·'));
    const isToday = (typeof TODAY_STR!=='undefined' && ds===TODAY_STR);
    dayCells += `<div style="min-height:64px;background:#fff;border:1px solid ${isToday?'#f97316':'#e2e8f0'};border-radius:8px;padding:6px;${isToday?'box-shadow:0 0 0 2px rgba(249,115,22,.25)':''}">
      <div style="font-size:11px;font-weight:800;color:#64748b;margin-bottom:4px">${d}</div>
      <div style="display:inline-block;min-width:28px;text-align:center;padding:3px 6px;border-radius:6px;font-weight:900;font-size:12px;background:${bg};color:${cl};border:1px solid rgba(0,0,0,.12)">${disp}</div>
    </div>`;
  }

  const legend = ['D','N','O','L','C/O','H','Ab','G'].map(c=>{
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:10px;color:#334155"><span style="width:14px;height:14px;border-radius:3px;background:${SBG[c]};border:1px solid rgba(0,0,0,.15)"></span>${c}</span>`;
  }).join('');

  const imgWidth = 720;
  const printDiv = document.createElement('div');
  printDiv.style.cssText = `position:fixed;top:-99999px;left:0;background:#fff;padding:18px;font-family:Arial,sans-serif;width:${imgWidth}px;color:#0f172a`;
  printDiv.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;border-bottom:2px solid #ea580c;padding-bottom:12px">
      ${logoDataUrl?`<img src="${logoDataUrl}" width="52" height="52" style="border-radius:12px;object-fit:contain;background:#fff;border:1px solid #e2e8f0;padding:2px"/>`:''}
      <div style="flex:1">
        <div style="font-size:20px;font-weight:900;color:#ea580c;letter-spacing:.3px">Man Power App</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a">My Shift Calendar — ${monthName}</div>
        <div style="font-size:11px;color:#64748b">${escHtml(emp.name||'')}${escHtml(emp.empId?' · #'+emp.empId:'')} · ${escHtml(SESSION.company||'')}</div>
      </div>
      <div style="text-align:right;font-size:10px;color:#64748b">VKS Tech<br/>Technology is power</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px">
      ${dows.map(d=>`<div style="text-align:center;font-size:11px;font-weight:800;color:#64748b;padding:4px 0">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${dayCells}</div>
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0">${legend}</div>
    <div style="margin-top:10px;text-align:center;font-size:10px;color:#94a3b8">
      ${logoDataUrl?`<img src="${logoDataUrl}" width="14" height="14" style="vertical-align:middle;border-radius:3px"/>`:''}
      Generated ${genAt} · Man Power App · VKS Tech — vkstech.com
    </div>`;
  document.body.appendChild(printDiv);

  const finish = ()=>{ try{ document.body.removeChild(printDiv); }catch(e){} };

  try{
    if(typeof html2canvas !== 'function'){
      // Fallback: open print window
      const w = window.open('', '_blank');
      if(w){
        w.document.write('<html><head><title>Shift Calendar</title></head><body>'+printDiv.innerHTML+'</body></html>');
        w.document.close();
        w.focus();
        setTimeout(()=>{ try{ w.print(); }catch(e){} }, 300);
      }
      closeModal();
      finish();
      toast('🖨️ Print dialog opened');
      return;
    }
    const imgs = printDiv.querySelectorAll('img');
    await Promise.all([...imgs].map(img=> img.complete ? Promise.resolve() : new Promise(r=>{ img.onload=img.onerror=r; })));
    const canvas = await html2canvas(printDiv, { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: imgWidth });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'ManPower_ShiftCalendar_'+(emp.name||'member').replace(/\s+/g,'_')+'_'+mk+'.png';
    a.click();
    closeModal();
    toast('📥 Shift calendar downloaded (PNG)');
  }catch(err){
    console.warn('[shift cal dl]', err);
    toast('❌ Download failed');
  }finally{
    finish();
  }
}

var _myShiftViewEmpId=null;

/* ── My Shift: manager edit member calendar (click + multi-select) ── */
window._myShiftMultiSel = window._myShiftMultiSel || new Set();
window._myShiftMultiEmp = window._myShiftMultiEmp || null;
window._myShiftLastTap = window._myShiftLastTap || {ds:null, t:0};

function setMyShiftViewEmp(id){
  try{
    _myShiftViewEmpId = id || null;
    window._myShiftMultiSel = new Set();
    window._myShiftMultiEmp = id || null;
    _hideMyShiftBulkBar();
    renderMyShift();
  }catch(e){}
}

/** Single tap = toggle multi-select; double-tap (or long-press path) = open picker for one day */
function handleMyShiftDayClick(ev, empId, empName, date, currentShift){
  try{
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    if(!canEditSchedule()){
      toast(L('❌ Schedule edit permission नहीं है','❌ No schedule edit permission'));
      return;
    }
    // Multi-select mode: toggle cells and show bulk bar
    if(window._myShiftMultiMode){
      if(window._myShiftMultiEmp && window._myShiftMultiEmp !== empId){
        window._myShiftMultiSel = new Set();
      }
      window._myShiftMultiEmp = empId;
      if(!window._myShiftMultiSel) window._myShiftMultiSel = new Set();
      if(window._myShiftMultiSel.has(date)) window._myShiftMultiSel.delete(date);
      else window._myShiftMultiSel.add(date);
      const cell = document.querySelector('.ms-day[data-ms-date="'+date+'"][data-ms-empid="'+empId+'"]');
      if(cell){
        if(window._myShiftMultiSel.has(date)){
          cell.classList.add('ms-multi-on');
          cell.style.outline = '2px solid #f97316';
          cell.style.background = 'rgba(249,115,22,.12)';
        } else {
          cell.classList.remove('ms-multi-on');
          cell.style.outline = '';
          cell.style.background = '';
        }
      }
      if(window._myShiftMultiSel.size === 0){ _hideMyShiftBulkBar(); return; }
      _showMyShiftBulkBar(empId, empName);
      return;
    }
    // If day is Leave, show saved reason first (tap again / Edit opens picker)
    const isLeave = String(currentShift||'').toUpperCase()==='L' || String(currentShift||'').toUpperCase().startsWith('L');
    if(isLeave){
      showLeaveReasonForDay(empId, empName, date, currentShift);
      return;
    }
    if(typeof editShiftCell === 'function'){
      editShiftCell(empId, empName, date, currentShift);
    } else {
      toast('Edit picker unavailable');
    }
  }catch(e){ console.warn('[handleMyShiftDayClick]', e); }
}

async function showLeaveReasonForDay(empId, empName, date, currentShift){
  let reason = '', typeCode = '', status = '';
  try{
    const day = String(date).slice(0,10);
    // 1) leaves collection
    const leaves = await fbGet('leaves') || {};
    Object.keys(leaves).forEach(k=>{
      const lv = leaves[k];
      if(!lv) return;
      const matchEmp = (lv.empId===empId || lv.employeeId===empId || String(lv.empObjId||'')===String(empId));
      const from = String(lv.from||lv.date||lv.start||'').slice(0,10);
      const to = String(lv.to||lv.from||lv.date||lv.end||from).slice(0,10);
      if(matchEmp && from && day >= from && day <= to){
        reason = lv.leaveType || lv.reason || lv.leaveReason || lv.remark || reason;
        typeCode = lv.type || lv.leaveCode || typeCode;
        status = lv.status || status;
      }
    });
    // 2) schedule cell meta
    if(!reason){
      try{
        const y = day.slice(0,4), m = day.slice(5,7);
        const path = 'schedules/'+y+'/'+m+'/'+empId+'/'+day;
        const cell = await fbGet(path);
        if(cell && typeof cell === 'object'){
          reason = cell.leaveReason || cell.reason || cell.remark || cell.leaveType || reason;
          typeCode = cell.leaveCode || cell.type || typeCode;
        } else if(typeof cell === 'string' && cell.length>1 && cell!=='L'){
          reason = cell;
        }
      }catch(e2){}
    }
    // 3) in-memory cache
    if(!reason && window._cache && window._cache.leaves){
      Object.values(window._cache.leaves).forEach(lv=>{
        if(!lv) return;
        if((lv.empId===empId||lv.employeeId===empId) && String(lv.from||'').slice(0,10)<=day && String(lv.to||lv.from||'').slice(0,10)>=day)
          reason = lv.leaveType||lv.reason||reason;
      });
    }
  }catch(e){}
  const fmtD = new Date(date).toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
  const body = reason
    ? `<div style="padding:12px;background:rgba(244,63,94,.08);border-radius:12px;border:1px solid rgba(244,63,94,.25)">
         <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">${typeCode?('Type: '+typeCode):'Leave'}${status?(' · '+status):''}</div>
         <div style="font-size:15px;font-weight:700;color:var(--text)">${String(reason).replace(/</g,'')}</div>
       </div>`
    : `<div style="padding:12px;color:var(--muted2);font-size:13px">${typeof L==='function'?L('कोई कारण सुरक्षित नहीं','No reason saved'):'No reason saved'}</div>`;
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🌴 ${typeof L==='function'?L('Leave विवरण','Leave details'):'Leave details'}</div>
    <div style="text-align:center;margin-bottom:10px">
      <div style="font-weight:900">${String(empName||'').replace(/</g,'')}</div>
      <div style="font-size:12px;color:var(--muted2)">${fmtD}</div>
    </div>
    ${body}
    <button class="big-btn" style="margin-top:14px" onclick="closeModal();window._forceShiftPicker=true;if(typeof editShiftCell==='function')editShiftCell('${empId}','${String(empName||'').replace(/'/g,"\'")}','${date}','${currentShift||'L'}')">${typeof L==='function'?L('शिफ्ट बदलें','Change shift'):'Change shift'}</button>
    <button class="cancel-btn" style="width:100%;margin-top:8px" onclick="closeModal()">${typeof L==='function'?L('बंद करें','Close'):'Close'}</button>`);
}
window.showLeaveReasonForDay = showLeaveReasonForDay;


function toggleMyShiftMultiMode(){
  window._myShiftMultiMode = !window._myShiftMultiMode;
  if(!window._myShiftMultiMode){
    window._myShiftMultiSel = new Set();
    _hideMyShiftBulkBar();
  }
  try{ renderMyShift(); }catch(e){}
  toast(window._myShiftMultiMode
    ? L('☑️ Multi-Select ON — क्लिक+ड्रैग या टैप','☑️ Multi-Select ON — click-drag or tap days')
    : L('Multi-Select OFF','Multi-Select OFF'));
}

function _hideMyShiftBulkBar(){
  const bar = document.getElementById('myShiftBulkBar');
  if(bar) bar.remove();
}


/** Click-drag multi-select on My Shift calendar (manager + member) */
window._msDrag = window._msDrag || { active:false, empId:null, empName:null, moved:false, startDate:null };

function _msMarkCell(cell, on){
  if(!cell || cell.classList.contains('empty')) return;
  const ds = cell.getAttribute('data-ms-date');
  if(!ds) return;
  if(on){
    window._myShiftMultiSel.add(ds);
    cell.classList.add('ms-multi-on');
    cell.style.outline = '2px solid #f97316';
    cell.style.background = 'rgba(249,115,22,.12)';
  } else {
    window._myShiftMultiSel.delete(ds);
    cell.classList.remove('ms-multi-on');
    cell.style.outline = '';
    cell.style.background = '';
  }
}

function _msSelectRange(grid, dateA, dateB){
  if(!grid || !dateA || !dateB) return;
  const a = dateA < dateB ? dateA : dateB;
  const b = dateA < dateB ? dateB : dateA;
  grid.querySelectorAll('.ms-day[data-ms-date]').forEach(cell=>{
    const ds = cell.getAttribute('data-ms-date');
    if(ds >= a && ds <= b) _msMarkCell(cell, true);
  });
}

function bindMyShiftDragSelect(root){
  try{
    const grids = (root || document).querySelectorAll('.ms-grid');
    grids.forEach(grid=>{
      if(grid._msDragBound) return;
      grid._msDragBound = true;
      grid.style.touchAction = 'pan-y';
      grid.style.userSelect = 'none';
      let lastTapAt = 0, lastTapKey = '';

      const onDown = (ev)=>{
        const cell = ev.target.closest && ev.target.closest('.ms-day[data-ms-date]');
        if(!cell || cell.classList.contains('empty')) return;
        const empId = cell.getAttribute('data-ms-empid');
        const empName = cell.getAttribute('data-ms-empname') || '';
        const ds = cell.getAttribute('data-ms-date');
        if(!empId || !ds) return;
        if(ev.pointerType === 'mouse' && ev.button !== 0) return;
        window._msDrag = {
          active:false, pending:true, empId, empName, moved:false, startDate:ds,
          pointerId:ev.pointerId, x:ev.clientX, y:ev.clientY, cell, curShift: cell.getAttribute('data-ms-shift')||''
        };
      };

      const onMove = (ev)=>{
        const drag = window._msDrag;
        if(!drag || (!drag.pending && !drag.active)) return;
        const dx = Math.abs(ev.clientX - drag.x);
        const dy = Math.abs(ev.clientY - drag.y);
        if(drag.pending && dy > 12 && dy > dx * 1.2){
          window._msDrag = null;
          return;
        }
        if(drag.pending && (dx > 10 || dy > 10) && dx >= dy * 0.85){
          drag.pending = false;
          drag.active = true;
          drag.moved = true;
          try{ grid.setPointerCapture(ev.pointerId); }catch(e){}
          window._myShiftMultiMode = true;
          if(window._myShiftMultiEmp && window._myShiftMultiEmp !== drag.empId){
            window._myShiftMultiSel = new Set();
            grid.querySelectorAll('.ms-day.ms-multi-on').forEach(c=>{
              c.classList.remove('ms-multi-on');
              c.style.outline=''; c.style.background='';
            });
          }
          window._myShiftMultiEmp = drag.empId;
          if(!window._myShiftMultiSel) window._myShiftMultiSel = new Set();
          if(typeof _msMarkCell==='function') _msMarkCell(drag.cell, true);
          try{ ev.preventDefault(); }catch(e){}
        }
        if(!drag.active) return;
        try{ ev.preventDefault(); }catch(e){}
        drag.moved = true;
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const over = el && el.closest && el.closest('.ms-day[data-ms-date]');
        if(!over || over.classList.contains('empty')) return;
        if(over.getAttribute('data-ms-empid') !== drag.empId) return;
        if(typeof _msMarkCell==='function') _msMarkCell(over, true);
        if(typeof _showMyShiftBulkBar==='function') _showMyShiftBulkBar(drag.empId, drag.empName);
      };

      const onUp = (ev)=>{
        const drag = window._msDrag;
        window._msDrag = null;
        if(!drag) return;
        try{ grid.releasePointerCapture(drag.pointerId); }catch(e){}
        if(drag.active){
          if(typeof _showMyShiftBulkBar==='function') _showMyShiftBulkBar(drag.empId, drag.empName);
          return;
        }
        // Tap (no drag): double-tap opens single-day Select Shift picker
        if(drag.pending && !drag.moved){
          const key = drag.empId + '|' + drag.startDate;
          const now = Date.now();
          if(lastTapKey === key && (now - lastTapAt) < 350){
            lastTapAt = 0; lastTapKey = '';
            try{
              if(typeof editShiftCell === 'function'){
                editShiftCell(drag.empId, drag.empName, drag.startDate, drag.curShift || '');
              } else if(typeof openLeaveReasonModal === 'function' && drag.curShift === 'L'){
                openLeaveReasonModal(drag.empId, drag.empName, drag.startDate, 'L');
              }
            }catch(e){ console.warn('[myShift double-tap]', e); }
          } else {
            lastTapAt = now; lastTapKey = key;
            // single tap on Leave day: show reason if any
            try{
              if(drag.curShift === 'L' && typeof editShiftCell === 'function'){
                // short delay so double-tap can cancel
                setTimeout(()=>{
                  if(lastTapKey === key && Date.now() - lastTapAt >= 340){
                    editShiftCell(drag.empId, drag.empName, drag.startDate, 'L');
                  }
                }, 360);
              }
            }catch(e){}
          }
        }
      };

      grid.addEventListener('pointerdown', onDown, {passive:true});
      grid.addEventListener('pointermove', onMove, {passive:false});
      grid.addEventListener('pointerup', onUp);
      grid.addEventListener('pointercancel', onUp);
    });
  }catch(e){ console.warn('[bindMyShiftDragSelect]', e); }
}
try{ window.bindMyShiftDragSelect = bindMyShiftDragSelect; }catch(e){}


function _showMyShiftBulkBar(empId, empName){
  _hideMyShiftBulkBar();
  const n = (window._myShiftMultiSel && window._myShiftMultiSel.size) || 0;
  if(!n) return;
  const cfg = (typeof getShiftConfigSync === 'function' ? getShiftConfigSync() : {}) || {};
  // Work shifts only (D/N/A/B/C) that are ticked active in M/c & Shift Setting
  const WORK = new Set(['D','N','A','B','C']);
  const codes = [];
  (cfg.shifts || []).forEach(s=>{
    if(!s || !s.code || s.active === false) return;
    const c = String(s.code).toUpperCase();
    if(WORK.has(c) && !codes.includes(c)) codes.push(c);
  });
  // defaults if empty
  if(!codes.length) codes.push('D','N');
  // Status options always available in bulk bar (incl. G)
  const extra = [
    {v:'O', label:'Off'},
    {v:'L', label:'Leave'},
    {v:'G', label:'G'},
    {v:'D+N', label:'D+N'}
  ];
  const _legC = (window.MP_SHIFT_COLORS||window.SHIFT_LEGEND_COLORS||{
    D:{bg:'#a16207',fg:'#fff'},N:{bg:'#4f46e5',fg:'#fff'},G:{bg:'#2563eb',fg:'#fff'},
    O:{bg:'#64748b',fg:'#fff'},L:{bg:'#be123c',fg:'#fff'},'D+N':{bg:'#7c3aed',fg:'#fff'}
  });
  const shiftBtns = codes.slice(0,8).map(code=>{
    const c=_legC[code]||{bg:'#334155',fg:'#fff'};
    return `<button type="button" onclick="applyMyShiftBulk('${empId}','${String(empName||'').replace(/'/g,"\\'")}','${code}')"
      style="padding:8px 12px;border-radius:10px;border:none;background:${c.bg};color:${c.fg};font-weight:800;font-size:13px;cursor:pointer">${code}</button>`;
  }).join('') + extra.map(x=>{
    const c=_legC[x.v]||{bg:'#334155',fg:'#fff'};
    return `<button type="button" onclick="applyMyShiftBulk('${empId}','${String(empName||'').replace(/'/g,"\\'")}','${x.v}')"
      style="padding:8px 12px;border-radius:10px;border:none;background:${c.bg};color:${c.fg};font-weight:800;font-size:13px;cursor:pointer">${x.label}</button>`;
  }).join('');

  const bar = document.createElement('div');
  bar.id = 'myShiftBulkBar';
  // Prefer top if selection is in lower half of viewport (so cells stay visible)
  let placeTop = false;
  try{
    const cells = document.querySelectorAll('.ms-day.ms-multi-on, .ms-day[style*="f97316"]');
    let maxBottom = 0;
    cells.forEach(c=>{ const r=c.getBoundingClientRect(); if(r.bottom>maxBottom) maxBottom=r.bottom; });
    if(maxBottom > window.innerHeight * 0.55) placeTop = true;
  }catch(e){}
  bar.style.cssText = placeTop
    ? 'position:fixed;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top,0px));z-index:400;max-width:min(96vw,420px);width:auto;padding:12px 14px;border-radius:16px;background:var(--bg2);border:1.5px solid rgba(249,115,22,.45);box-shadow:0 8px 28px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:8px;'
    : 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:400;max-width:min(96vw,420px);width:auto;padding:12px 14px;border-radius:16px;background:var(--bg2);border:1.5px solid rgba(249,115,22,.45);box-shadow:0 8px 28px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:8px;';
  bar.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="font-size:12px;font-weight:800;color:#f97316">${n} day${n>1?'s':''} selected · ${escHtml(empName||'')}</div>
      <button type="button" onclick="clearMyShiftMulti()" style="border:none;background:transparent;color:var(--muted2);font-size:12px;cursor:pointer;font-weight:700">${L('Clear','Clear')}</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${shiftBtns}</div>
    <div style="font-size:11px;color:var(--muted2)">${L('Shift चुनें → saves now','Pick shift → saves immediately')} · ${L('Double-tap cell = single day picker','Double-tap cell = single day picker')}</div>
  `;
  document.body.appendChild(bar);
}

function clearMyShiftMulti(){
  window._myShiftMultiSel = new Set();
  _hideMyShiftBulkBar();
  try{ renderMyShift(); }catch(e){}
}

async function applyMyShiftBulk(empId, empName, shiftVal){
  if(!canEditSchedule()){ toast(L('❌ Permission नहीं','❌ No permission')); return; }
  const dates = Array.from(window._myShiftMultiSel || []).sort();
  if(!dates.length){ toast(L('कोई दिन चुना नहीं','No days selected')); return; }
  if(shiftVal === 'L' && typeof openLeaveReasonModal === 'function'){
    try{
      window._myShiftPendingLeaveDates = dates.slice();
      window._myShiftPendingLeaveEmp = {id:empId, name:empName};
      // Open reason modal for first date; on confirm, apply L+reason to all pending dates
      openLeaveReasonModal(empId, empName, dates[0], 'L');
      return;
    }catch(e){ console.warn(e); }
  }
  let n=0;
  for(const ds of dates){
    try{
      const emp = (typeof getEmps==='function'?getEmps():[]).find(x=>x.id===empId);
      const cur = emp ? (getShift(emp, ds)||'') : '';
      if(typeof stageSingleShiftChange === 'function'){
        stageSingleShiftChange(empId, empName, ds, cur, shiftVal);
        n++;
      } else if(typeof handleShiftBtnClick === 'function'){
        handleShiftBtnClick(empId, empName, ds, cur, shiftVal);
        n++;
      }
    }catch(e){ console.warn('bulk day', ds, e); }
  }
  window._myShiftMultiSel = new Set();
  _hideMyShiftBulkBar();
  toast('✅ '+n+' '+L('दिन staged — नीचे Save दबाएँ','days staged — tap Save below'));
  try{ renderMyShift(); }catch(e){}
  try{ if(typeof _updateSaveBar==='function') _updateSaveBar(); }catch(e){}
}


function renderMyShift(){
  const el = document.getElementById('myShiftContent');
  if(!el) return;
  const e = myEmp();
  if(!e){ el.innerHTML='<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">Profile not found</div></div>'; return; }
  if(!_myShiftMonth) _myShiftMonth = new Date(TODAY_STR+'T12:00:00');
  const y = _myShiftMonth.getFullYear();
  const m = _myShiftMonth.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const startDow = first.getDay(); // 0 Sun
  const monthName = first.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{month:'long',year:'numeric'});
  const canSelf = !isPendingMember(); // members can request change

  const shStyle = window.MP_SHIFT_COLORS || {};

  let cells = '';
  for(let i=0;i<startDow;i++) cells += '<div class="ms-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const ds = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const sh = getShift(e, ds) || '';
    const st = (typeof mpShiftStyle==='function' ? mpShiftStyle(sh) : (shStyle[sh]||{bg:'#1e293b',fg:'#94a3b8'}));
    const isToday = ds===TODAY_STR;
    const disp = cellDisp(sh) || '·';
    const nm = String(e.name||'').replace(/'/g,"\\'");
    const shEsc = String(sh).replace(/'/g,"\\'");
    const selected = !!(window._myShiftMultiSel && window._myShiftMultiEmp===e.id && window._myShiftMultiSel.has(ds));
    const cls = cellClass(sh);
    cells += `<div class="ms-day${isToday?' today':''}${selected?' ms-multi-on':''}" data-ms-date="${ds}" data-ms-shift="${sh}" data-ms-empid="${e.id}" data-ms-empname="${nm}" data-ms-sh="${shEsc}"
      style="cursor:${canSelf?'pointer':'default'};touch-action:none;user-select:none;${selected?'outline:2px solid #f97316;background:rgba(249,115,22,.12);':''}">
      <div class="ms-day-num">${d}</div>
      <div class="ms-day-sh shc ${cls}">${disp}</div>
    </div>`;
  }

  // Shift mates today
  const todaySh = getShift(e, TODAY_STR);
  const allEmps = (typeof getEmps==='function'?getEmps():[]).filter(x=>x.status!=='resigned'&&x.status!=='left');
  const mates = allEmps.filter(emp=>{
    if(emp.id===e.id) return false;
    const s = getShift(emp, TODAY_STR);
    if(!todaySh||!s) return false;
    if(todaySh===s) return true;
    if(typeof parseShiftWorkCodes==='function'){
      const a=parseShiftWorkCodes(todaySh), b=parseShiftWorkCodes(s);
      return a.some(c=>b.includes(c));
    }
    return false;
  });

  el.innerHTML = `
  <div class="ms-dl-bar" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <button type="button" onclick="openMyShiftRecordsPanel()" style="flex:1;min-width:140px;padding:10px 12px;border-radius:10px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;font-size:12px;cursor:pointer">📥 ${L('Shift Details Download','Shift Details Download')}</button>
    <button type="button" onclick="openShiftCalendarDownload()" style="flex:1;min-width:140px;padding:10px 12px;border-radius:10px;border:1px solid rgba(14,165,233,.4);background:rgba(14,165,233,.12);color:#0ea5e9;font-weight:800;font-size:12px;cursor:pointer">📅 ${L('Shift Calendar Download','Shift Calendar Download')}</button>
  </div>
  <div id="myShiftDlPanel"></div>
  <div class="ms-cal-wrap">
    <div class="ms-cal-nav">
      <button type="button" class="ms-nav-btn" onclick="_myShiftMonth=new Date(${y},${m}-1,1);renderMyShift()">‹</button>
      <div class="ms-cal-title">${monthName}</div>
      <button type="button" class="ms-nav-btn" onclick="_myShiftMonth=new Date(${y},${m}+1,1);renderMyShift()">›</button>
    </div>
    <div class="ms-weekdays">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<div>'+x+'</div>').join('')}</div>
    <div class="ms-grid">${cells}</div>
    <div class="ms-hint">${canEditSchedule()
      ? L('दिन पर टैप करें — यहीं save होगा (अपनी shift पर WhatsApp नहीं)','Tap a day to change shift — saves here (no WhatsApp for your own shift)')
      : L('दिन पर टैप करें — Manager approve करेगा तब schedule अपडेट होगा','Tap a day to request a shift change — your Manager will approve')}</div>
    <div id="myShiftPendingReqs"></div>
  </div>
  <div class="stitle" style="margin-top:18px">👥 ${L('आज के Shift Mates','Shift Mates Today')}</div>
  <div class="ms-mates">
    ${mates.length?mates.slice(0,30).map(emp=>`<div class="ms-mate-chip"><b>${escHtml(emp.name||'')}</b><span>${escHtml(emp.mc||emp.sec||'')}</span></div>`).join('')
      :`<div style="font-size:13px;color:var(--muted2);padding:8px">${L('आज आपकी shift पर कोई mate नहीं','No shift mates for your shift today')}</div>`}
  </div>`;

  // Manager: select team member + their monthly calendar (edits → schedule + WhatsApp)
  try{
    const isMgrView = (typeof isMgr==='function' && isMgr()) || (typeof isAdmin==='function' && isAdmin()) || (typeof canEditSchedule==='function' && canEditSchedule() && SESSION.role==='manager');
    if(isMgrView){
      const team = allEmps.filter(x=>x && x.id !== e.id).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'en',{sensitivity:'base'}));
      const selId = _myShiftViewEmpId && team.some(t=>t.id===_myShiftViewEmpId) ? _myShiftViewEmpId : '';
      const selEmp = selId ? team.find(t=>t.id===selId) : null;
      let opts = `<option value="">— ${L('सदस्य चुनें','Select member')} —</option>` + team.map(t=>{
        const lab = escHtml((t.name||'') + (t.empId||t.code ? (' · '+(t.empId||t.code)) : ''));
        return `<option value="${escHtml(t.id)}" ${t.id===selId?'selected':''}>${lab}</option>`;
      }).join('');
      let memberCal = '';
      if(selEmp){
        let mcells = '';
        for(let i=0;i<startDow;i++) mcells += '<div class="ms-day empty"></div>';
        for(let d=1;d<=daysInMonth;d++){
          const ds = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
          const sh = getShift(selEmp, ds) || '';
          const isToday = ds===TODAY_STR;
          const disp = cellDisp(sh) || '·';
          const cls = cellClass(sh);
          const nm = String(selEmp.name||'').replace(/'/g,"\\'");
          const shEsc = String(sh).replace(/'/g,"\\'");
          const selected = (window._myShiftMultiSel && window._myShiftMultiSel.has(ds));
          mcells += `<div class="ms-day${isToday?' today':''}${selected?' ms-multi-on':''}" data-ms-date="${ds}" data-ms-shift="${sh}" data-ms-empid="${selEmp.id}" data-ms-empname="${nm}" data-ms-sh="${shEsc}"
            style="cursor:pointer;touch-action:none;user-select:none;${selected?'outline:2px solid #f97316;background:rgba(249,115,22,.12);':''}">
            <div class="ms-day-num">${d}</div>
            <div class="ms-day-sh shc ${cls}">${disp}</div>
          </div>`;
        }
        memberCal = `
        <div class="ms-cal-wrap" style="margin-top:10px;border-color:rgba(249,115,22,.35)">
          <div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:8px">📅 ${escHtml(selEmp.name||'')} · ${monthName}</div>
          <div class="ms-weekdays">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<div>'+x+'</div>').join('')}</div>
          <div class="ms-grid">${mcells}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center">
            <button type="button" onclick="toggleMyShiftMultiMode()" id="myShiftMultiBtn"
              style="padding:8px 12px;border-radius:10px;border:1.5px solid ${window._myShiftMultiMode?'#f97316':'var(--border2)'};background:${window._myShiftMultiMode?'rgba(249,115,22,.2)':'var(--card)'};color:${window._myShiftMultiMode?'#f97316':'var(--text)'};font-weight:800;font-size:12px;cursor:pointer">
              ${window._myShiftMultiMode?L('✕ Cancel Multi','✕ Cancel Multi'):L('☑️ Multi-Select','☑️ Multi-Select')}
            </button>
            <span class="ms-hint" style="margin:0">${window._myShiftMultiMode
              ? L('दिन टैप करें → नीचे से shift चुनें','Tap days → pick shift on bar')
              : L('दिन टैप करें → shift चुनें (Save से commit)','Tap a day → pick shift (then Save)')}</span>
          </div>
        </div>`;
      }
      el.innerHTML += `
      <div class="stitle" style="margin-top:22px">👥 ${L('सदस्य की Shift देखें / बदलें','View / edit member shift')}</div>
      <div style="margin:8px 0 12px">
        <label style="font-size:11px;font-weight:800;color:var(--muted2);display:block;margin-bottom:4px">${L('सदस्य','Member')}</label>
        <select id="myShiftMemberSel" onchange="setMyShiftViewEmp(this.value)"
          style="width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid var(--border2);background:var(--card);color:var(--text);font-size:14px;font-weight:700">
          ${opts}
        </select>
      </div>
      ${memberCal}`;
    }
  }catch(mgrEx){ console.warn('[myShift member]', mgrEx); }

  // Show member's pending shift-change requests under calendar
  try{ _renderMyShiftPendingReqs(e.id); }catch(ex){}
  // Enable click-drag multi-select on calendar grids
  try{ bindMyShiftDragSelect(el); }catch(ex){}
}

async function _renderMyShiftPendingReqs(empObjId){
  const host = document.getElementById('myShiftPendingReqs');
  if(!host || !empObjId) return;
  try{
    const data = await fbGet('shiftChangeRequests') || {};
    const mine = Object.entries(data).filter(([k,v])=>v && v.empObjId===empObjId && v.status==='pending');
    if(!mine.length){ host.innerHTML=''; return; }
    const isEn = (_lang !== 'hi');
    host.innerHTML = `<div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3)">
      <div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:8px">${L('⏳ Manager approval pending','⏳ Pending Manager approval')}</div>
      ${mine.map(([k,v])=>`<div style="font-size:12px;color:var(--text);margin:4px 0">${v.date}: <b>${v.currentShift||'—'}</b> → <b style="color:#38bdf8">${v.newShift}</b></div>`).join('')}
    </div>`;
  }catch(e){ host.innerHTML=''; }
}
let _myShiftMonth = null;





// ═══════════════════════════════════════════════════════════
// PAYMENT GATE — ₹999/month (Admin sets link + per-user paidUntil)
// Tabs Home + My Shift always free; other tabs require payment or paidUntil in future
// ═══════════════════════════════════════════════════════════
window._paymentSettingsCache = window._paymentSettingsCache || null;
window._paymentSettingsAt = 0;

