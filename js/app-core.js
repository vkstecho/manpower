window._schedEditMode = true; // managers: always editable (View/Edit toggle removed)

// ════════════════════════════════════════════════════
//  MAN POWER — Multi-Industry Team & Shift Management
//  Firebase Realtime DB · Hindi UI · Mobile First
//  v2.4.0
// ════════════════════════════════════════════════════
// Utilities (escHtml, sanitizeFbPath, isValidEmpId, hashPass) live in js/utils.js
// and are exposed as globals for gradual modularization.

// ── SECURITY: Compress images before storing in Firebase ──
async function compressImage(base64, maxWidth, quality){
  maxWidth = maxWidth || 800;
  quality = quality || 0.6;
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = ()=>resolve(base64); // fallback to original
    img.src = base64;
  });
}

// ── SECURITY: Setup admin hashes in Firebase (run once) ──
async function initAdminAuth(){
  // SECURITY: Never seed admin password hashes from the client.
  // Set adminAuth/{user} = { h: sha256(user+":"+pass+":MP_ADMIN"), name } only via Firebase Console
  // or a trusted admin Cloud Function — never from this app bundle.
  try{
    const existing = await fbGet('adminAuth');
    if(!existing){
      console.warn('[security] adminAuth missing in Firebase — admin login will fail until configured in Console');
    }
  }catch(e){ console.warn('[security] adminAuth check failed', e && e.message); }
}

// ── CONFIG ──
const CFG = {
  license:   {
    // Client only has a soft fallback expiry. Real unlock hashes live in Firebase settings/license only.
    expiry: new Date(2026,11,31),
    warnDays: 15,
    extendTo: new Date(2027,11,31)
  },
  // SECURITY: Admin credentials checked ONLY via Firebase adminAuth — not hardcoded
  adminCreds:[], // Empty — all auth goes through Firebase
  supervisorInstructor: 'MOHIT',
  minShift: { default:2 },
  shiftLabels: { D:'Day (7AM-7PM)', N:'Night (7PM-7AM)', A:'A Shift', B:'B Shift', C:'C Shift', O:'Weekly Off', L:'Leave', G:'General', 'C/O':'Comp Off' },
  // ── Contact numbers (update here, applies everywhere) ──
  contactManagerName: 'Manager',   // shown in device-approval / expiry UI (override in Firebase settings if needed)
  contactVivek:  '+918168771239',   // Manager contact — device approvals, access extensions
  contactAdmin:  '+918929397949',   // Admin — login approvals
  // Phone numbers that must always log in as Admin via OTP (10-digit or +91 form)
  hardAdminPhones: ['+918929397949', '8929397949'],
  // Manager self-registration invite code (not admin approval — spam gate only)
  // Can also override via Firebase settings/managerInviteCode
  managerInviteCode: '',  // set in Firebase settings/managerInviteCode (not shipped in client)
};



const SEC = {
  M1: {label:'Section M1',hi:'सेक्शन M1',color:'var(--m1)',bg:'var(--m1bg)',icon:'🏭',machine:'M-1',type:'metalliser'},
  M2: {label:'Section M2',hi:'सेक्शन M2',color:'var(--m2)',bg:'var(--m2bg)',icon:'🏭',machine:'M-2',type:'metalliser'},
  S1: {label:'Section S1',hi:'सेक्शन S1',color:'var(--s1)',bg:'var(--s1bg)',icon:'✂️',machine:'S-1',type:'slitter'},
  S2: {label:'Section S2',hi:'सेक्शन S2',color:'var(--s2)',bg:'var(--s2bg)',icon:'✂️',machine:'S-2',type:'slitter'},
  SUP:{label:'Supervisor',  hi:'सुपरवाइज़र', color:'var(--sup)',bg:'var(--supbg)',icon:'👷',machine:'S.I.',type:'sup'},
  MGR:{label:'Manager',     hi:'मैनेजर',     color:'var(--mgr)',bg:'var(--mgrbg)',icon:'🎯',machine:'ALL',type:'mgr'},
};

/**
 * secName(secKey) — returns section name in current language.
 * In English mode: "Metalliser-1", "Slitter-1", etc.
 * In Hindi mode: "मेटलाइज़र-1", "स्लिटर-1", etc.
 * Falls back to section key if not found.
 */
function secName(sec){
  if(!sec) return '';
  const s = SEC[sec];
  if(s) return (typeof _lang !== 'undefined' && _lang !== 'hi') ? (s.label||s.en||s.hi) : s.hi;
  // Generic pool categories from Excel imports / free-form section codes
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const key = sec.toString().trim().toUpperCase();
  if(key==='MET')  return L('Section (All)','Section (All)');
  if(key==='SLIT') return L('Section (All)','Section (All)');
  if(key==='ALL')  return L('सुपरवाइज़र','Supervisor');
  return sec;
}

/**
 * getSectionMeta(sec) — single source of truth for section display (v2.4.13).
 * Legacy keys (M1/M2/S1/S2/SUP/MGR) use the classic SEC table.
 * Free-form sections (from Manager Excel) get a stable hash-based colour + sensible icon.
 * Returns: { label, hi, color, bg, icon, type }
 */
const _SEC_PALETTE = [
  {color:'#f97316', bg:'rgba(249,115,22,.12)'},   // orange
  {color:'#3b82f6', bg:'rgba(59,130,246,.12)'},   // blue
  {color:'#22c55e', bg:'rgba(34,197,94,.12)'},    // green
  {color:'#a78bfa', bg:'rgba(167,139,250,.12)'},  // violet
  {color:'#f43f5e', bg:'rgba(244,63,94,.12)'},    // rose
  {color:'#14b8a6', bg:'rgba(20,184,166,.12)'},   // teal
  {color:'#eab308', bg:'rgba(234,179,8,.12)'},    // amber
  {color:'#6366f1', bg:'rgba(99,102,241,.12)'},   // indigo
  {color:'#ec4899', bg:'rgba(236,72,153,.12)'},   // pink
  {color:'#0ea5e9', bg:'rgba(14,165,233,.12)'},   // sky
];
function _hashStr(s){
  let h = 0;
  const str = String(s||'');
  for(let i=0;i<str.length;i++){ h = ((h<<5)-h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function getSectionMeta(sec){
  if(!sec) return {label:'', hi:'', color:'#94a3b8', bg:'rgba(148,163,184,.1)', icon:'👤', type:''};
  const key = String(sec).trim();
  const legacy = SEC[key] || SEC[key.toUpperCase()];
  if(legacy){
    return {
      label: legacy.label,
      hi: legacy.hi,
      color: legacy.color,
      bg: legacy.bg,
      icon: legacy.icon || '👤',
      type: legacy.type || ''
    };
  }
  // Free-form / multi-industry section from Excel
  const pal = _SEC_PALETTE[_hashStr(key) % _SEC_PALETTE.length];
  const display = secName(key) || key;
  // Heuristic icon from common words
  const low = key.toLowerCase();
  let icon = '🏭';
  if(/warehouse|store|godown|inventory/.test(low)) icon = '📦';
  else if(/icu|ward|hospital|clinic|medical/.test(low)) icon = '🏥';
  else if(/office|admin|hr|accounts/.test(low)) icon = '🏢';
  else if(/line|assembly|production|pack/.test(low)) icon = '⚙️';
  else if(/quality|qa|qc|lab/.test(low)) icon = '🔬';
  else if(/dispatch|logistics|transport/.test(low)) icon = '🚚';
  else if(/kitchen|canteen|food/.test(low)) icon = '🍳';
  else if(/security|gate/.test(low)) icon = '🛡️';
  else if(/maintenance|utility|eng/.test(low)) icon = '🔧';
  return {
    label: display,
    hi: display,
    color: pal.color,
    bg: pal.bg,
    icon,
    type: 'custom'
  };
}

const REPORT_TYPES = {
  ncr:          { ico:'⚠️', label:'NCR रिपोर्ट',       color:'#f87171', bg:'rgba(239,68,68,.1)' },
  absent:       { ico:'📵', label:'अनुपस्थिति',         color:'var(--night)', bg:'rgba(129,140,248,.1)' },
  warning:      { ico:'⚡', label:'चेतावनी / अनुशासनहीनता', color:'var(--m1)', bg:'rgba(249,115,22,.1)' },
  indiscipline: { ico:'⚡', label:'चेतावनी / अनुशासनहीनता', color:'var(--m1)', bg:'rgba(249,115,22,.1)' },
  appreciation: { ico:'🌟', label:'प्रशंसा',             color:'var(--green)', bg:'rgba(34,197,94,.1)' },
  imp_info:     { ico:'📢', label:'Imp. Information',    color:'#38bdf8', bg:'rgba(56,189,248,.1)' },
};

// ── SUP COVERAGE RULES ──
// covers: which section types they can cover
/** Supervisor coverage by name removed — use roster roles */
const SUP_COVERAGE = {};

// ── SCHEDULE DISPLAY ORDER ──
// Defines role, display group, and sort order within each section
/** Per-name role order removed — use custom drag order + roster fields */
const EMP_ROLES = {}; // keep empty map for legacy getEmpRole fallbacks / Excel data

// getEmpRole defined below after _customEmpRoles is declared

// ════════════════════════════════════════
// EMPLOYEE DISPLAY ORDER — Custom Drag & Drop
// Saved to Firebase: settings/empDisplayOrder
// Format: { 'empObjId': globalOrder (number) }
// ════════════════════════════════════════
let _customEmpOrder = {}; // { empObjId: number } — loaded from Firebase

// loadCustomEmpOrder defined below (full version loads both order + role overrides)

// Returns effective sort key for an employee in the schedule
// If custom order exists, use it; otherwise fall back to EMP_ROLES order
function getEmpDisplayOrder(emp){
  if(_customEmpOrder[emp.id] !== undefined) return _customEmpOrder[emp.id];
  const role = EMP_ROLES[emp.name];
  if(role) return role.order * 10; // multiply so custom fits between
  return 990;
}

// ── REORDER PANEL ──
// Stores custom role overrides: { empObjId: roleKey } saved to Firebase
let _customEmpRoles = {}; // loaded alongside _customEmpOrder

async function loadCustomEmpOrder(){
  try{
    const data = await fbGet('settings/empDisplayOrder');
    _customEmpOrder = data || {};
  }catch(e){ _customEmpOrder = {}; }
  try{
    const rdata = await fbGet('settings/empRoleOverrides');
    _customEmpRoles = rdata || {};
  }catch(e){ _customEmpRoles = {}; }
}

// Returns effective role for an employee (custom override wins)
function getEmpRole(emp){
  if(_customEmpRoles[emp.id]) return { role:_customEmpRoles[emp.id], section:emp.sec, order:99 };
  return EMP_ROLES[emp.name] || { role:'assist', section:emp.sec, order:99 };
}

async function openEmpReorderPanel(){
  if(!isAdmin() && !isMgr()){ toast('❌ Admin only'); return; }
  await loadCustomEmpOrder();

  // All groups — MET + Slitter + Sup + Mgr
  const GROUPS = [
    { key:'met_main',  label:'⭐ Metalliser — Main Operators', color:'#f97316',
      filter: e => ['M1','M2'].includes(e.sec) && getEmpRole(e).role==='main' },
    { key:'met_rel',   label:'🔄 Metalliser — Relievers',      color:'#fb923c',
      filter: e => ['M1','M2'].includes(e.sec) && getEmpRole(e).role==='reliever' },
    { key:'met_asst',  label:'🏭 Metalliser — Team',           color:'#fdba74',
      filter: e => ['M1','M2'].includes(e.sec) && (getEmpRole(e).role==='assist' || !['main','reliever'].includes(getEmpRole(e).role)) && !['S1','S2','SUP','MGR'].includes(e.sec) },
    { key:'slit_main', label:'⭐ Slitter — Main Operators',    color:'#38bdf8',
      filter: e => ['S1','S2'].includes(e.sec) && getEmpRole(e).role==='main' },
    { key:'slit_rel',  label:'🔄 Slitter — Relievers',         color:'#7dd3fc',
      filter: e => ['S1','S2'].includes(e.sec) && getEmpRole(e).role==='slit_rel' },
    { key:'slit_asst', label:'✂️ Slitter — Team',              color:'#bae6fd',
      filter: e => ['S1','S2'].includes(e.sec) && !['main','slit_rel'].includes(getEmpRole(e).role) },
    { key:'sup',       label:'👷 Supervisors / Engineers',                  color:'#a78bfa',
      filter: e => e.sec==='SUP' },
    { key:'mgr',       label:'🎯 Manager',                      color:'#e879f9',
      filter: e => { const k=_normSecKey(e.sec); return k==='MGR'||k==='MANAGER'; } },
  ];

  const emps = getEmps().filter(e => e.status !== 'resigned');

  // ── Fallback: any employee whose sec isn't one of fixed codes above ──
  const _coveredSecs = new Set(['M1','M2','S1','S2','SUP','MGR']);
  const _extraSecs = Array.from(new Set(emps.map(e=>e.sec).filter(s=>s && !_coveredSecs.has(s))));
  _extraSecs.forEach(secVal=>{
    const meta = getSectionMeta(secVal);
    GROUPS.push({
      key:'dyn_'+secVal,
      label:(meta.icon||'🏭')+' '+(meta.hi||secVal),
      color: meta.color,
      filter: e => e.sec===secVal
    });
  });
  GROUPS.push({
    key:'dyn_none',
    label:'👤 '+(L('अवर्गीकृत','Unassigned')),
    color:'#64748b',
    filter: e => !e.sec
  });

  // Role options per machine section
  const MET_ROLES  = [{v:'main','l':'⭐ Main Operator'},{v:'reliever','l':'🔄 Reliever'},{v:'assist','l':'🏭 Team Member'}];
  const SLIT_ROLES = [{v:'main','l':'⭐ Main Operator'},{v:'slit_rel','l':'🔄 Reliever'},{v:'assist','l':'✂️ Team Member'}];
  let groupsHtml = '';

  GROUPS.forEach(g => {
    const members = emps.filter(g.filter).sort((a,b) => getEmpDisplayOrder(a) - getEmpDisplayOrder(b));
    if(!members.length) return;

    const rowsHtml = members.map((emp, idx) => {
      const ini = emp.name.split(' ').map(n=>n[0]).join('').substring(0,2);
      const isFirst = idx === 0, isLast = idx === members.length - 1;
      const isMet  = ['M1','M2'].includes(emp.sec);
      const isSlit = ['S1','S2'].includes(emp.sec);
      const roleOptions = isMet ? MET_ROLES : isSlit ? SLIT_ROLES : null;
      const currentRole = getEmpRole(emp).role;

      const roleDropdown = roleOptions ? `<select data-roleid="${emp.id}"
          onchange="_roRoleChange('${emp.id}',this.value)"
          style="font-size:11px;font-weight:700;border:1px solid var(--border2);
                 border-radius:8px;padding:4px 6px;background:var(--card2);
                 color:var(--text);cursor:pointer;max-width:130px;flex-shrink:0">
          ${roleOptions.map(r=>`<option value="${r.v}"${currentRole===r.v?' selected':''}>${r.l}</option>`).join('')}
        </select>` : '';

      return `<div class="_ro-row" data-empid="${emp.id}" data-group="${g.key}"
        style="display:flex;align-items:center;gap:8px;padding:10px;
               background:var(--card);border:1px solid var(--border);border-radius:11px;margin-bottom:6px">
        <div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0">
          <button onclick="_roMove('${g.key}','${emp.id}',-1)"
            style="width:32px;height:28px;border-radius:6px;border:1px solid var(--border2);
                   background:${isFirst?'var(--card2)':'rgba(249,115,22,.15)'};
                   color:${isFirst?'var(--muted)':'#f97316'};font-size:15px;cursor:pointer;
                   display:flex;align-items:center;justify-content:center;font-weight:900"
            ${isFirst?'disabled':''}>▲</button>
          <button onclick="_roMove('${g.key}','${emp.id}',1)"
            style="width:32px;height:28px;border-radius:6px;border:1px solid var(--border2);
                   background:${isLast?'var(--card2)':'rgba(249,115,22,.15)'};
                   color:${isLast?'var(--muted)':'#f97316'};font-size:15px;cursor:pointer;
                   display:flex;align-items:center;justify-content:center;font-weight:900"
            ${isLast?'disabled':''}>▼</button>
        </div>
        <div style="width:34px;height:34px;border-radius:9px;background:rgba(249,115,22,.15);
             display:flex;align-items:center;justify-content:center;flex-shrink:0;
             font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;color:#fb923c">${ini}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${emp.name}</div>
          <div style="font-size:10px;color:var(--muted2)">${emp.sec} · ${emp.empId||''}</div>
        </div>
        ${roleDropdown}
        <span style="font-size:12px;color:var(--muted);width:18px;text-align:center;flex-shrink:0">${idx+1}</span>
      </div>`;
    }).join('');

    groupsHtml += `<div style="margin-bottom:18px">
      <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;
           color:${g.color};margin-bottom:8px;display:flex;align-items:center;gap:8px">
        ${g.label}<span style="flex:1;height:1px;background:var(--border)"></span>
      </div>
      <div id="roGroup_${g.key}">${rowsHtml}</div>
    </div>`;
  });

  openModal(`<div class="modal-handle"></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <div style="font-size:26px">↕️</div>
      <div>
        <div style="font-size:17px;font-weight:900;color:var(--text)">कर्मचारी क्रम व Group बदलें</div>
        <div style="font-size:11px;color:var(--muted2);margin-top:2px">▲▼ से क्रम बदलें • Dropdown से Group बदलें • फिर Save करें</div>
      </div>
    </div>
    <div style="max-height:62vh;overflow-y:auto;padding-right:2px">${groupsHtml}</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button onclick="_roSaveOrder()" style="flex:1;padding:14px;border-radius:12px;border:none;
        background:linear-gradient(135deg,#22c55e,#15803d);color:#fff;
        font-family:'Noto Sans Devanagari',sans-serif;font-size:15px;font-weight:800;cursor:pointer">💾 Save करें</button>
      <button onclick="_roResetOrder()" style="padding:12px 14px;border-radius:12px;
        border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.08);color:var(--lv);
        font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;font-weight:700;cursor:pointer">🔄 Reset</button>
      <button onclick="closeModal()" style="padding:12px 14px;border-radius:12px;
        border:1px solid var(--border2);background:var(--card);color:var(--muted2);
        font-family:'Noto Sans Devanagari',sans-serif;font-size:13px;font-weight:700;cursor:pointer">रद्द</button>
    </div>`);
}

// Called when role dropdown changes — moves the row to correct group visually
function _roRoleChange(empId, newRole){
  // Map role → group key
  const emp = getEmps().find(e => e.id === empId);
  if(!emp) return;
  const isSlit = ['S1','S2'].includes(emp.sec);
  const roleToGroup = isSlit
    ? { main:'slit_main', slit_rel:'slit_rel', assist:'slit_asst' }
    : { main:'met_main', reliever:'met_rel', assist:'met_asst' };
  const targetGroupKey = roleToGroup[newRole];
  if(!targetGroupKey) return;

  // Find the row
  const row = document.querySelector(`._ro-row[data-empid="${empId}"]`);
  if(!row) return;
  const currentGroupKey = row.dataset.group;
  if(currentGroupKey === targetGroupKey) return;

  // Move to new container (append at bottom)
  const targetContainer = document.getElementById('roGroup_' + targetGroupKey);
  if(!targetContainer) return;

  // Remove from old group
  const oldContainer = document.getElementById('roGroup_' + currentGroupKey);
  if(oldContainer){ _roRefreshButtons(oldContainer); }

  // Update row's group attr and move
  row.dataset.group = targetGroupKey;
  targetContainer.appendChild(row);
  _roRefreshButtons(targetContainer);

  // Scroll to show new location
  setTimeout(()=> row.scrollIntoView({behavior:'smooth', block:'nearest'}), 50);
  toast('↕️ ' + emp.name + ' → ' + targetGroupKey.replace('_',' '));
}

function _roMove(groupKey, empId, direction){
  const container = document.getElementById('roGroup_' + groupKey);
  if(!container) return;
  const rows = [...container.querySelectorAll('._ro-row')];
  const idx = rows.findIndex(r => r.dataset.empid === empId);
  if(idx === -1) return;
  const newIdx = idx + direction;
  if(newIdx < 0 || newIdx >= rows.length) return;
  if(direction === -1) container.insertBefore(rows[idx], rows[newIdx]);
  else container.insertBefore(rows[newIdx], rows[idx]);
  _roRefreshButtons(container);
}

function _roRefreshButtons(container){
  const rows = [...container.querySelectorAll('._ro-row')];
  rows.forEach((row, idx) => {
    const isFirst = idx === 0, isLast = idx === rows.length - 1;
    const btns = row.querySelectorAll('button');
    [btns[0], btns[1]].forEach((btn, bi) => {
      if(!btn) return;
      const disabled = bi === 0 ? isFirst : isLast;
      btn.disabled = disabled;
      btn.style.background = disabled ? 'var(--card2)' : 'rgba(249,115,22,.15)';
      btn.style.color = disabled ? 'var(--muted)' : '#f97316';
    });
    const numEl = row.querySelector('span:last-of-type');
    if(numEl) numEl.textContent = idx + 1;
  });
}

async function _roSaveOrder(){
  const newOrder = {};
  const newRoles = {};
  let i = 0;
  document.querySelectorAll('[id^="roGroup_"]').forEach(g => {
    g.querySelectorAll('._ro-row').forEach(row => {
      newOrder[row.dataset.empid] = i++;
      // Save role override from dropdown
      const sel = row.querySelector(`[data-roleid="${row.dataset.empid}"]`);
      if(sel) newRoles[row.dataset.empid] = sel.value;
    });
  });
  try{
    await fbSet('settings/empDisplayOrder', newOrder);
    await fbSet('settings/empRoleOverrides', Object.keys(newRoles).length ? newRoles : null);
    _customEmpOrder = newOrder;
    _customEmpRoles = newRoles;
    closeModal();
    toast(L('✅ क्रम & Group save हो गया! Schedule update हो रही है...','✅ Order & groups saved! Updating schedule...'));
    renderSchedule();
  }catch(e){ toast('❌ Save failed: ' + e.message); }
}

async function _roResetOrder(){
  const ok = await confirmModal('Default पर वापस जाएं?', 'Custom order और role assignments हट जाएंगे।<br>यह action undo नहीं होगी।', '🔄 हाँ, Reset करें', 'रद्द करें');
  if(!ok) return;
  try{
    await fbSet('settings/empDisplayOrder', null);
    await fbSet('settings/empRoleOverrides', null);
    _customEmpOrder = {};
    _customEmpRoles = {};
    closeModal();
    toast(L('🔄 Default order restore हो गया','🔄 Default order restored'));
    renderSchedule();
  }catch(e){ toast('❌ Reset failed: ' + e.message); }
}

// ── DEFAULT EMPLOYEES ──
// SECURITY: Phone numbers removed from client source — loaded from Firebase only
// Updated from Excel: MET_Man_Power_and_Shift_MET_MAN_01.xlsx (Mar 2026)
const DEFAULT_EMP = []; // no hardcoded users — Managers upload Excel

// ── LEFT / RESIGNED EMPLOYEES (from Excel: Left_Replaced sheet) ──
const DEFAULT_LEFT_EMP = []; // no hardcoded left/resigned list

// ── NCR RECORDS (Non-Conformance Reports) ──
/** NCR demo data removed — live NCR comes from reports node only */
const NCR_DATA = [];
const NCR_NAME_MAP = {};
function getNcrForEmp(empId){ return []; }


const DEFAULT_INSTRUCTIONS = {
  safety: {
    title:'⛑️ सुरक्षा नियम',
    items:[
      {icon:'🥽', text:'PPE (दस्ताने, चश्मा, जूते) हमेशा पहनें', note:'मशीन पर काम करते समय अनिवार्य'},
      {icon:'📵', text:'मशीन के पास मोबाइल का उपयोग सख्त मना है', note:'पूरे प्रोडक्शन एरिया में'},
      {icon:'🚨', text:'किसी दुर्घटना में तुरंत Safety Team को सूचित करें', note:'तुरंत काम बंद करें'},
      {icon:'🔧', text:'खराब मशीन पर काम बंद करें, Supervisor को बताएं', note:'बिना मंजूरी मशीन न चलाएं'},
      {icon:'🧹', text:'काम खत्म होने पर जगह साफ रखें', note:'5S नियमों का पालन करें'},
    ]
  },
  shift: {
    title:'⏰ शिफ्ट नियम',
    items:[
      {icon:'🌅', text:'दिन शिफ्ट: सुबह 7:00 बजे से शाम 7:00 बजे तक', note:'5 मिनट पहले पहुंचना जरूरी'},
      {icon:'🌙', text:'रात शिफ्ट: शाम 7:00 बजे से सुबह 7:00 बजे तक', note:'5 मिनट पहले पहुंचना जरूरी'},
      {icon:'🔄', text:'शिफ्ट बदलते समय हैंडओवर रिपोर्ट देना जरूरी', note:'अगली शिफ्ट को पूरी जानकारी दें'},
      {icon:'📋', text:'अनुपस्थिति होने पर 2 घंटे पहले Supervisor को बताएं', note:'बिना सूचना अनुपस्थिति मान्य नहीं'},
      {icon:'🏃', text:'समय पर न आने पर Half Day लगेगा', note:'15 मिनट देरी = Half Day'},
    ]
  },
  leave: {
    title:'📅 छुट्टी नियम',
    items:[
      {icon:'✅', text:'पूरे साल में कुल 15 दिन की छुट्टी मिलती है', note:'CL + SL मिलाकर'},
      {icon:'📱', text:'Emergency में उसी दिन Application करें', note:'App में जाकर "छुट्टी आवेदन" करें'},
      {icon:'⏳', text:'Normal छुट्टी के लिए 1 दिन पहले Apply करें', note:'Manager की मंजूरी जरूरी'},
      {icon:'❌', text:'बिना Application छुट्टी पर गए तो वेतन कटेगा', note:'और Absent Report बनेगी'},
      {icon:'👨‍💼', text:'छुट्टी की मंजूरी '+((CFG&&CFG.contactManagerName)||'Manager')+' देंगे', note:'App में Status देख सकते हैं'},
    ]
  },
  ncr: {
    title:'⚠️ NCR प्रक्रिया',
    items:[
      {icon:'🔍', text:'कोई भी खराबी दिखे तो 24 घंटे के अंदर Report करें', note:'App में "रिपोर्ट दर्ज करें" पर जाएं'},
      {icon:'📞', text:'गंभीर खराबी हो तो तुरंत Safety Team को बताएं', note:'Supervisor को सूचित करें'},
      {icon:'📝', text:'NCR में मशीन नंबर, समस्या और फोटो जरूर डालें', note:'जितनी जानकारी देंगे उतनी जल्दी ठीक होगा'},
      {icon:'🚫', text:'खराब मशीन चलाते रहना सख्त मना है', note:'Supervisor को तुरंत बताएं'},
      {icon:'✔️', text:'NCR की मंजूरी के बाद ही मशीन दोबारा चलाएं', note:'Manager की अनुमति जरूरी'},
    ]
  },
  machine: {
    title:'🏭 मशीन नियम',
    items:[
      {icon:'⚡', text:'Metalliser मशीन: बिना Training के ऑपरेट न करें', note:'M-1 और M-2 के लिए'},
      {icon:'✂️', text:'Slitter मशीन: Blade Change केवल Supervisor की निगरानी में', note:'S-1 और S-2 के लिए'},
      {icon:'🔒', text:'मशीन बंद करने से पहले Lock Out / Tag Out करें', note:'सुरक्षा के लिए जरूरी'},
      {icon:'🛢️', text:'Metalliser में Film Loading Supervisor को बताकर करें', note:'Quality के लिए'},
      {icon:'📊', text:'Production Log हर शिफ्ट में भरना जरूरी है', note:'Shift Handover में देंगे'},
    ]
  },
  contact: {
    title:'📞 संपर्क सूत्र',
    emergency: [
      { name:''+((CFG&&CFG.contactManagerName)||'Manager')+'', num:'+91 8168771239', role:'Production Manager' },
      { name:'Mr. GURU', num:'+91 8929394920', role:'Customer Care' },
    ]
  }
};

// ════════════════════════════════════════
// FIREBASE DB LAYER
// ════════════════════════════════════════
let TODAY_DATE = new Date();

// ── WhatsApp opener — forces regular WhatsApp (com.whatsapp) on Android ──
// Prevents WhatsApp Business from intercepting wa.me links
/** Open WhatsApp WITHOUT navigating away from the app (never use location.href).
 *  Same-tab navigation was causing black screen after Manager registration / OTP.
 */

// ── WA App-link footer (Admin-configured only) ──
let _waAppLinkCache = null;
async function _loadWaAppLinkSettings(){
  try{
    const s = await fbGet('settings/waAppLink');
    _waAppLinkCache = s || null;
    return _waAppLinkCache;
  }catch(e){ return _waAppLinkCache; }
}
function _getWaAppLinkSettingsSync(){
  // Prefer live cache; fallback defaults
  const s = _waAppLinkCache || {};
  const enabled = s.enabled !== false;
  const text = (s.text && String(s.text).trim()) || 'Check Complete Shift';
  let url = (s.url && String(s.url).trim()) || '';
  if(!url){
    try{ url = (window.location.origin + window.location.pathname).replace(/\/$/,'') || window.location.href.split('?')[0].split('#')[0]; }catch(e){ url = ''; }
  }
  return { enabled, text, url };
}
function _appendWaAppLink(msg){
  try{
    const { enabled, text, url } = _getWaAppLinkSettingsSync();
    if(!enabled || !url) return msg || '';
    const body = String(msg||'').replace(/\s+$/,'');
    // Avoid double-append
    if(body.includes(url)) return body;
    return body + '\n\n📱 *' + text + '*\n' + url;
  }catch(e){ return msg || ''; }
}
/** True if this employee is the logged-in user (no self-notify) */
function _isSelfEmployee(emp){
  if(!emp) return false;
  try{
    if(SESSION.empObjId && emp.id && SESSION.empObjId === emp.id) return true;
    if(SESSION.empId && emp.empId && String(SESSION.empId)===String(emp.empId)) return true;
    const mine = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    const theirs = _normMobileKey(emp.phone||emp.mobile||'');
    if(mine && theirs && mine.length>=10 && mine === theirs) return true;
  }catch(e){}
  return false;
}

function openWA(phone, text){
  const ph = String(phone||'').replace(/\D/g,'');
  if(!ph) return;
  const encoded = encodeURIComponent(text||'');
  const web = 'https://wa.me/91'+ph+'?text='+encoded;
  try{
    const isAndroid = /android/i.test(navigator.userAgent);
    let opened = null;
    if(isAndroid){
      // intent URL in a NEW window/tab only — never replace this page
      const fallback = encodeURIComponent(web);
      const intentUrl = `intent://send?phone=91${ph}&text=${encoded}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${fallback};end`;
      try{ opened = window.open(intentUrl, '_blank'); }catch(e){}
      if(!opened){
        try{ opened = window.open(web, '_blank'); }catch(e){}
      }
    } else {
      try{ opened = window.open(web, '_blank'); }catch(e){}
    }
    // Popup blocked: show a tappable link toast — do NOT navigate this tab
    if(!opened){
      try{
        const tip = document.createElement('div');
        tip.id = 'waFallbackTip';
        tip.style.cssText = 'position:fixed;left:12px;right:12px;bottom:20px;z-index:99999;background:#0f172a;border:1px solid #22c55e;border-radius:12px;padding:12px 14px;color:#e2e8f0;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.4)';
        tip.innerHTML = 'WhatsApp message ready — <a href="'+web+'" target="_blank" rel="noopener" style="color:#4ade80;font-weight:800">Tap to open WhatsApp</a> <button type="button" style="float:right;background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer" onclick="this.parentElement.remove()">✕</button>';
        const old = document.getElementById('waFallbackTip');
        if(old) old.remove();
        document.body.appendChild(tip);
        setTimeout(()=>{ try{ tip.remove(); }catch(e){} }, 20000);
      }catch(e){ console.warn('[openWA] popup blocked', e); }
    }
  }catch(e){
    console.warn('[openWA]', e);
  }
}
TODAY_DATE.setHours(0,0,0,0);
// FIX: use local date parts (not UTC) to avoid IST timezone showing yesterday
let TODAY_STR = TODAY_DATE.getFullYear()+'-'+String(TODAY_DATE.getMonth()+1).padStart(2,'0')+'-'+String(TODAY_DATE.getDate()).padStart(2,'0');

// ── MIDNIGHT ROLLOVER WATCHDOG ──
// If app is left open past midnight, TODAY_DATE/TODAY_STR were frozen on
// page-load day. This watchdog detects date change and refreshes the view.
function _checkDateRollover(){
  try{
    const now = new Date();
    const nowStr = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    if(nowStr !== TODAY_STR){
      console.log('[rollover] date changed:', TODAY_STR, '→', nowStr);
      TODAY_DATE = new Date();
      TODAY_DATE.setHours(0,0,0,0);
      TODAY_STR = nowStr;
      // Re-render current view if app is ready
      if(typeof renderAll === 'function'){
        try{ renderAll(); }catch(e){ console.error('[rollover] renderAll failed:', e); }
      }
    }
  }catch(e){ console.error('[rollover] check failed:', e); }
}
// Check every 60 seconds
setInterval(_checkDateRollover, 60000);
// Also check immediately when tab becomes visible (laptop resume from sleep)
document.addEventListener('visibilitychange', ()=>{
  if(!document.hidden) _checkDateRollover();
});
const DAYS       = ['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'];
const DAYS_EN    = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let _fbReady = false;
let _cache   = { employees:null, leaves:null, reports:null, overrides:null, regRequests:null, instructions:null, schedules:null };

function fbRef(path){ /* legacy compat — not directly used anymore */ return path; }

async function fbGet(path){
  const snap = await window._fbAccess('get', path);
  return snap.exists() ? snap.val() : null;
}
async function fbSet(path, val){
  await window._fbAccess('set', path, val);
  updateSyncTime();
}
async function fbPush(path, val){
  const r = await window._fbAccess('push', path, val);
  updateSyncTime();
  return r.key;
}
async function fbUpdate(path, val){
  await window._fbAccess('update', path, val);
  updateSyncTime();
}
async function fbRemove(path){
  await window._fbAccess('remove', path);
  updateSyncTime();
}

const _fbListenUnsubs = {};
function fbListen(path, cb){
  // Prevent duplicate onValue subscriptions on the same path
  if(_fbListenUnsubs[path]){
    try{ _fbListenUnsubs[path](); }catch(e){}
    delete _fbListenUnsubs[path];
  }
  const p = window._fbAccess('onValue', path, snap => {
    const val = snap.exists() ? snap.val() : null;
    try{ cb(val); }catch(e){ console.warn('[fbListen]', path, e); }
    const st = document.getElementById('syncTime');
    if(st) st.textContent = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  });
  // onValue returns unsubscribe in modular SDK when used correctly
  if(typeof p === 'function') _fbListenUnsubs[path] = p;
  else if(p && typeof p.then === 'function'){
    p.then(unsub=>{ if(typeof unsub === 'function') _fbListenUnsubs[path] = unsub; }).catch(()=>{});
  }
}

// ════════════════════════════════════════
// DATA INIT
// ════════════════════════════════════════
const APP_VERSION = '2.4.97';

/** Allow phone rotate — unlock any portrait lock from old PWA manifest */
function _unlockOrientation(){
  try{
    if(screen.orientation && typeof screen.orientation.unlock === 'function'){
      screen.orientation.unlock();
    }
  }catch(e){}
  try{
    if(typeof screen.unlockOrientation === 'function') screen.unlockOrientation();
  }catch(e){}
  try{
    if(typeof screen.unlockOrientationWebkit === 'function') screen.unlockOrientationWebkit();
  }catch(e){}
}
try{ _unlockOrientation(); }catch(e){}
document.addEventListener('DOMContentLoaded', function(){ try{ _unlockOrientation(); }catch(e){} try{ if(typeof applyLoginLang==='function') applyLoginLang(); else if(typeof applyLang==='function') applyLang(); }catch(e){} });
window.addEventListener('load', function(){ try{ _unlockOrientation(); }catch(e){} });

 // Bump this to force re-seed

async function initData(){
  // ══ PERFORMANCE: staged RTDB load (this app uses Realtime Database, not Firestore) ══
  // 1) Parallel one-shot get for critical paths → fast first paint
  // 2) Then attach live listeners (deduped)
  // 3) Secondary paths load after UI is interactive

  if(window._mpListenersStarted) {
    console.log('[initData] listeners already active');
    return;
  }

  const mergeEmps = (v) => {
    const fbEmps = v ? Object.values(v) : [];
    // Prefer mobileUsers language so WhatsApp respects profile setting
    let muMap = (_cache && _cache.mobileUsers) || null;
    return fbEmps.map(e => {
      let out = e;
      if(!e.phone){
        const def = DEFAULT_EMP.find(d=>d.id===e.id);
        if(def && def.phone) out = {...e, phone: def.phone};
      }
      if(!(out.preferredLang||out.lang||out.language) && muMap){
        try{
          const mob = String(out.phone||out.mobile||'').replace(/\D/g,'').slice(-10);
          const mu = mob && (muMap[mob] || muMap['+91'+mob]);
          if(mu && (mu.preferredLang||mu.lang||mu.language)){
            out = {...out, preferredLang: mu.preferredLang||mu.lang||mu.language};
          }
        }catch(ex){}
      }
      return out;
    });
  };

  // ── Phase A: parallel bootstrap reads (employees + schedules first) ──
  const t0 = performance.now();
  try{
    const [existing, schedulesSnap, leavesSnap, overridesSnap] = await Promise.all([
      fbGet('employees').catch(()=>null),
      fbGet('schedules').catch(()=>null),
      fbGet('leaves').catch(()=>null),
      fbGet('overrides').catch(()=>null),
    ]);

    if(!existing){
      // Never auto-seed hardcoded roster — Managers upload Excel / add employees
      _cache.employees = [];
      console.warn('[initData] employees empty — upload team Excel or add members');
    } else {
      _cache.employees = mergeEmps(existing);
    }
    if(window._empLoadWatch){ clearTimeout(window._empLoadWatch); window._empLoadWatch=null; }

    _cache.schedules = schedulesSnap || {};
    _cache.leaves = _normalizeLeavesSnap(leavesSnap);
    _cache.overrides = overridesSnap || {};
    // Load mobileUsers for preferredLang (WhatsApp language per member)
    try{
      const mu = await fbGet('mobileUsers').catch(()=>null);
      if(mu && typeof mu==='object'){
        _cache.mobileUsers = mu;
        // Re-merge so preferredLang sticks on emp objects
        if(_cache.employees && _cache.employees.length){
          _cache.employees = mergeEmps(
            Object.fromEntries((_cache.employees||[]).map(e=>[e.id||e.empId, e]))
          );
        }
      }
    }catch(e){}
    // Non-blocking UI update with what we have
    try{ refreshAll(); }catch(e){}

    console.log('[initData] bootstrap ms:', Math.round(performance.now()-t0),
      'emps:', (_cache.employees||[]).length,
      'sched months:', Object.keys(_cache.schedules||{}).length);
  }catch(e){
    console.warn('[initData] bootstrap error', e);
    if(_cache.employees === null) _cache.employees = [];
  }

  // Version bump — fire and forget (don't block UI)
  fbSet('appVersion', APP_VERSION).catch(()=>{});

  // ── Phase B: live listeners (single registration) ──
  window._mpListenersStarted = true;
  let _prevRegCount = 0;

  fbListen('employees', v => {
    if(window._empLoadWatch){ clearTimeout(window._empLoadWatch); window._empLoadWatch=null; }
    _cache.employees = mergeEmps(v);
    try{ if(typeof invalidateShiftCache==='function') invalidateShiftCache(); }catch(e){}
    refreshAll();
  });
  try{
    fbListen('mobileUsers', v => {
      _cache.mobileUsers = v || {};
      // Refresh preferredLang on employees without full re-fetch
      try{
        if(_cache.employees && _cache.employees.length){
          _cache.employees = _cache.employees.map(e=>{
            if(e.preferredLang||e.lang||e.language) return e;
            const mob = String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10);
            const mu = mob && (_cache.mobileUsers[mob]||_cache.mobileUsers['+91'+mob]);
            if(mu && (mu.preferredLang||mu.lang||mu.language)){
              return {...e, preferredLang: mu.preferredLang||mu.lang||mu.language};
            }
            return e;
          });
        }
      }catch(ex){}
    });
  }catch(e){}
  fbListen('schedules', v => {
    _cache.schedules = v || {};
    try{ if(typeof invalidateShiftCache==='function') invalidateShiftCache(); }catch(e){}
    _refreshTabs(['home','schedule','myshift']);
  });
  fbListen('leaves', v => {
    _cache.leaves = _normalizeLeavesSnap(v);
    try{ if(typeof invalidateShiftCache==='function') invalidateShiftCache(); if(typeof _rebuildLeaveIndex==='function') _rebuildLeaveIndex(); }catch(e){}
    _refreshTabs(['home','leave','pending']);
  });
  fbListen('overrides', v => {
    _cache.overrides = v || {};
    try{ if(typeof invalidateShiftCache==='function') invalidateShiftCache(); }catch(e){}
    _refreshTabs(['home','schedule']);
  });
  fbListen('reports', v => {
    _cache.reports = v ? Object.entries(v).map(([k,r])=>({...r, _key: r._key||k})) : [];
    _refreshTabs(['reports','pending','home']);
  });
  fbListen('settings', v => {
    _cache.settings = v || {};
    _customEmpOrder = (v && v.empDisplayOrder) ? v.empDisplayOrder : {};
    _customEmpRoles = (v && v.empRoleOverrides) ? v.empRoleOverrides : {};
  });
  fbListen('instructions', v => {
    _cache.instructions = v || DEFAULT_INSTRUCTIONS;
  });

  // Admin-only / less critical — defer slightly so first paint stays fast
  setTimeout(()=>{
    fbListen('regRequests', v => {
      const list = v ? Object.values(v) : [];
      _cache.regRequests = list;
      const pendingNow = list.filter(r=>r.status==='pending').length;
      if(isAdmin() && pendingNow > _prevRegCount && _prevRegCount >= 0){
        const newest = list.filter(r=>r.status==='pending').slice(-1)[0];
        if(newest && typeof Notification !== 'undefined' && Notification.permission==='granted'){
          try{
            new Notification('🆕 New Login Request!',{
              body: (newest.name||newest.empId)+' registered',
              icon:'/MP-App/icons/icon-192.png', tag:'mp-reg-notif'
            });
          }catch(e){}
        }
        const bell = document.getElementById('notifBtn');
        if(bell){ bell.style.display='flex'; }
      }
      _prevRegCount = pendingNow;
      _refreshTabs(['pending']);
    });
    try{ initLearnListeners(); }catch(e){}
  }, 400);
}

/** Refresh only if current tab is affected (avoids full app redraw) */
// Coalesce RTDB bursts — only re-render the visible tab when possible
let _refreshTabsTimer = null;
let _refreshTabsPending = null;
function _refreshTabs(tabs){
  try{ updatePendingBadge(); }catch(e){}
  _refreshTabsPending = tabs || ['*'];
  if(_refreshTabsTimer) clearTimeout(_refreshTabsTimer);
  _refreshTabsTimer = setTimeout(()=>{
    _refreshTabsTimer = null;
    const want = _refreshTabsPending || ['*'];
    _refreshTabsPending = null;
    try{
      if(typeof invalidateShiftCache === 'function') invalidateShiftCache();
    }catch(e){}
    const cur = (typeof _currentTab !== 'undefined' && _currentTab) ? _currentTab : 'home';
    if(!want || want.includes('*') || want.includes(cur)){
      // Prefer lightweight single-tab refresh over full renderAll when possible
      try{
        if(cur === 'schedule' && typeof renderSchedule === 'function'){ renderSchedule(); return; }
        if(cur === 'team' && typeof renderTeam === 'function'){ renderTeam(); return; }
        if(cur === 'home' && typeof renderHome === 'function'){ renderHome(); return; }
        if(cur === 'myshift' && typeof renderMyShift === 'function'){ renderMyShift(); return; }
      }catch(e){}
      try{ refreshAll(); }catch(e){}
    }
  }, 280);
}

function _normCompanyId(s){
  // Case-insensitive, collapse spaces; empty → default
  let t = (s||'').toString().trim().toLowerCase().replace(/\s+/g, ' ');
  if(!t) return 'default';
  return t;
}
/** True if company fields refer to the same org (case/space insensitive; empty matches any filter for team members). */
function _companyMatchesView(company, viewCid){
  if(!viewCid || viewCid === 'ALL') return true;
  const n = _normCompanyId(company);
  const v = _normCompanyId(viewCid);
  if(n === v) return true;
  // empty / default on record → still show under manager when admin filters a company
  if(!company || n === 'default') return true;
  return false;
}
function _sameCompany(a, b){
  return _normCompanyId(a) === _normCompanyId(b);
}
function myCompanyId(){
  if(isAdmin()) return SESSION.viewCompanyId || 'ALL';
  if(SESSION.companyId) return SESSION.companyId;
  return 'default'; // legacy employee-code workers/managers/supervisors — all pre-existing Man Power staff
}
function listAllCompanies(){
  const ids=new Set();
  const labels={};
  const counts={};
  const addCo = (rawId, rawLabel)=>{
    const cid = _normCompanyId(rawId || rawLabel);
    if(!cid || cid==='all' || cid==='default') return;
    ids.add(cid);
    counts[cid]=(counts[cid]||0)+1;
    const lbl = String(rawLabel||rawId||'').trim();
    if(lbl){
      // Prefer properly cased label (has uppercase) over all-lowercase
      if(!labels[cid] || (lbl !== lbl.toLowerCase() && labels[cid]===labels[cid].toLowerCase()))
        labels[cid]=lbl;
    }
  };
  try{
    (_cache.employees||[]).forEach(e=>{
      addCo(e.companyId, e.companyLabel||e.company||e.companyId);
      const des = String(e.designation||'').toLowerCase();
      if(/manager|mgr/.test(des) && (e.companyLabel||e.company))
        addCo(e.companyId||e.company, e.companyLabel||e.company);
    });
  }catch(e){}
  // Mobile registration managers/members — source of "GLS Polyfilms" on Team tab
  try{
    const mu = (_cache.mobileUsers && typeof _cache.mobileUsers==='object') ? _cache.mobileUsers : null;
    // mobileUsers may only be on demand; also try window cache
    const scan = mu || {};
    Object.values(scan).forEach(u=>{
      if(u && u.company) addCo(u.company, u.company);
    });
  }catch(e){}
  try{
    if(SESSION && (SESSION.companyId || SESSION.company)){
      addCo(SESSION.companyId||SESSION.company, SESSION.company||SESSION.companyId);
    }
  }catch(e){}
  return Array.from(ids).map(cid=>({
    id: cid, // always normalized lowercase — case-insensitive select value
    label: labels[cid] || (cid==='default'?'Man Power':cid)
  })).sort((a,b)=>a.label.localeCompare(b.label, undefined, {sensitivity:'base'}));
}

/** When manager changes company name, update all team employees' companyLabel so Admin list stays in sync. */
async function _syncCompanyLabelToTeam(newName){
  const name = String(newName||'').trim();
  if(!name) return 0;
  const cid = (typeof myCompanyId==='function' ? myCompanyId() : null) || SESSION.companyId || '';
  const mgrKey = SESSION.role==='manager' ? _normMobileKey(SESSION.mobile) : '';
  let n=0;
  const emps = (getEmps()||[]);
  for(const e of emps){
    try{
      if(mgrKey && e.managerId && e.managerId!==mgrKey) continue;
      if(cid && e.companyId && _normCompanyId(e.companyId)!==_normCompanyId(cid)) continue;
      await fbUpdate('employees/'+e.id, { companyLabel: name, company: name });
      e.companyLabel = name; e.company = name;
      n++;
    }catch(err){}
  }
  return n;
}
function renderCompanySwitcher(){
  const row=document.getElementById('companySwitchRow');
  const sel=document.getElementById('companySwitchSel');
  if(!row||!sel) return;
  row.style.display='flex';
  const companies=listAllCompanies();
  const current=SESSION.viewCompanyId||'ALL';
  sel.innerHTML='<option value="ALL">🌐 सभी Companies (All)</option>'+
    companies.map(c=>`<option value="${c.id}"${c.id===current?' selected':''}>🏢 ${c.label}</option>`).join('');
  sel.value=current;
}
function switchViewCompany(companyId){
  // Store normalized id so "GLS" / "gls" / "GLS Polyfilms" comparisons stay consistent
  SESSION.viewCompanyId = (!companyId || companyId==='ALL') ? 'ALL' : _normCompanyId(companyId);
  saveSession();
  toast(companyId==='ALL'?L('🌐 सभी Companies दिख रही हैं','🌐 Showing all companies'):L('🏢 अब सिर्फ इस Company का data दिख रहा है','🏢 Showing only this company'));
  refreshAll();
}
function _normMobileKey(m){
  let d = (m||'').toString().replace(/[^0-9]/g,'');
  // Strip leading country code 91 if 12+ digits
  if(d.length >= 12 && d.startsWith('91')) d = d.slice(2);
  if(d.length > 10) d = d.slice(-10);
  return d;
}
function getEmps(){
  const all=_cache.employees||[];
  const activeOnly = (list)=> list.filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
  if(isAdmin()){
    const cid=SESSION.viewCompanyId||'ALL';
    if(cid==='ALL') return all;
    return all.filter(e=>_normCompanyId(e.companyId)===cid);
  }
  if(SESSION.role==='manager' && SESSION.mobile){
    const key=_normMobileKey(SESSION.mobile);
    return activeOnly(all.filter(e=>e.managerId===key));
  }
  if(SESSION.role==='member'){
    // Left / pending members must NOT see Manager's full team
    if(SESSION.pendingApproval || SESSION.status==='pending' || SESSION.status==='left' || SESSION.status==='left_team' || SESSION.status==='revoked' || SESSION.status==='rejected'){
      const self = _findOwnEmployeeRecord();
      return self ? [self] : [];
    }
    if(SESSION.managerId){
      return activeOnly(all.filter(e=>e.managerId===SESSION.managerId));
    }
    const self = _findOwnEmployeeRecord();
    return self ? [self] : [];
  }
  const cid=myCompanyId();
  if(cid==='ALL') return all;
  return all.filter(e=>_normCompanyId(e.companyId)===cid);
}

function _findOwnEmployeeRecord(){
  const all = _cache.employees||[];
  if(SESSION.empObjId){
    const byId = all.find(e=>e.id===SESSION.empObjId);
    if(byId) return byId;
  }
  const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  if(mob){
    const byPhone = all.find(e=>_normMobileKey(e.phone||e.mobile||'')===mob);
    if(byPhone) return byPhone;
  }
  if(SESSION.empId){
    const code = String(SESSION.empId).trim().toUpperCase();
    const byCode = all.find(e=>String(e.empId||e.code||'').trim().toUpperCase()===code);
    if(byCode) return byCode;
  }
  return null;
}


/**
 * Find active employee who already owns this 10-digit mobile (different emp).
 * Returns { emp, otherTeam } or null.
 * otherTeam = true when owner is under a different manager than current user.
 */
function _findPhoneConflict(phone, excludeEmpId, excludeEmpCode){
  const key = _normMobileKey(phone);
  if(!key || key.length !== 10) return null;
  const myMgr = (typeof SESSION !== 'undefined' && SESSION.role === 'manager' && SESSION.mobile)
    ? _normMobileKey(SESSION.mobile) : null;
  const emps = (typeof getEmps === 'function' ? getEmps() : []) || [];
  for(const e of emps){
    if(!e || e.status === 'resigned') continue;
    if(excludeEmpId && e.id === excludeEmpId) continue;
    if(excludeEmpCode && e.empId && String(e.empId).trim().toUpperCase() === String(excludeEmpCode).trim().toUpperCase()) continue;
    const p = _normMobileKey(e.phone);
    if(p !== key) continue;
    const otherTeam = !!(myMgr && e.managerId && e.managerId !== myMgr);
    // Also treat as other-team if current manager and owner has no managerId but different person
    // or if owner is under any other manager
    const crossTeam = otherTeam || (myMgr && e.managerId && e.managerId !== myMgr) ||
      (myMgr && !e.managerId && e.id); // orphan under admin still blocks reuse by manager
    return { emp: e, otherTeam: !!otherTeam || (myMgr && e.managerId && e.managerId !== myMgr) };
  }
  return null;
}
// ════════════════════════════════════════
// SHIFT & MACHINE CONFIGURATION (per-Manager, Man Power included)
// ════════════════════════════════════════
function myShiftConfigKey(companyIdOverride){
  if(isAdmin()){
    const cid=companyIdOverride||SESSION.viewCompanyId;
    return cid && cid!=='ALL' ? 'company:'+cid : null;
  }
  if(SESSION.role==='manager' && SESSION.mobile) return 'mgr:'+_normMobileKey(SESSION.mobile);
  if(SESSION.role==='member' && SESSION.managerId) return 'mgr:'+SESSION.managerId;
  return 'company:'+myCompanyId(); // legacy employee-code system — shared at company level
}
function getDefaultShiftConfig(){ return _defaultShiftConfig(); }
function _defaultShiftConfig(){
  return {
    shiftCount: 2,
    shifts: [
      {code:'D', label:'Day Shift', start:'08:00', end:'20:00', active:true},
      {code:'N', label:'Night Shift', start:'20:00', end:'08:00', active:true},
      {code:'A', label:'A Shift', start:'06:00', end:'14:00', active:false},
      {code:'B', label:'B Shift', start:'14:00', end:'22:00', active:false},
      {code:'C', label:'C Shift', start:'22:00', end:'06:00', active:false}
    ],
    // Minimum headcount per day — below this, summary cells highlight red
    minAll: 4,
    minMet: 5,
    minSlit: 3,
    minSup: 2,
    minBySec: {},
    minByField: { section:{}, machine:{}, responsibility:{}, designation:{} },
    minFieldActive: { section:true, machine:false, responsibility:false, designation:false },
    hideSummaryDN: false,   // Profile: hide D & N count rows + legend
    hideSummaryABC: false,  // Profile: hide A, B, C count rows + legend
    // WhatsApp message when schedule is saved (placeholders: {name} {changes} {manager} {date})
    waShiftTemplate: '🔔 *Man Power — Shift Update*\n\nनमस्ते *{name}*,\n\nआपकी shift में बदलाव हुआ है:\n{changes}\n\nकोई सवाल हो तो Manager से संपर्क करें।\n_— {manager}_',
    // Per-type notification templates (editable in Shift Settings / Profile)
    // Placeholders: {name} {date} {dates} {manager} {changes} {gpCount} {gpMax}
    waLeaveTemplate: '🏖️ *Man Power — Leave*\n_{date}_\n\nनमस्ते *{name}*,\n\nआपकी *Leave* mark की गई है:\n{dates}\n\nकृपया duty के अनुसार वापसी सुनिश्चित करें।\n_— {manager}_',
    waAbsentTemplate: '⚠️ *Man Power — Absent (अनुशासनहीनता)*\n_{date}_\n\n*ध्यान दें {name}*,\n\nआप *बिना अनुमति / बिना सूचना* अनुपस्थित (Absent) चिह्नित किए गए हैं:\n{dates}\n\nयह *अनुशासनहीन व्यवहार* माना जाता है।\n• बिना अनुमति duty छोड़ना गंभीर उल्लंघन है\n• वेतन कटौती / NCR / अनुशासनात्मक कार्रवाई हो सकती है\n• दोबारा ऐसा होने पर सख्त कार्रवाई की जाएगी\n\nतुरंत Manager से संपर्क करें।\n_— {manager}_',
    waGPTemplate: '🪪 *Man Power — Gate Pass*\n_{date}_\n\nनमस्ते *{name}*,\n\nआपको *Gate Pass (GP)* दिया गया है:\n{dates}\n\n📌 *नियम:* एक महीने में अधिकतम *{gpMax}* Gate Pass ही अनुमत हैं।\nइस महीने आपके GP: *{gpCount}/{gpMax}*\n\nअधिक GP के लिए Manager की विशेष अनुमति आवश्यक है।\n_— {manager}_',
    waHolidayTemplate: '🎉 *Man Power — Holiday*\n_{date}_\n\nनमस्ते *{name}*,\n\nनिम्न तिथि(याँ) *Holiday* चिह्नित की गई हैं:\n{dates}\n\nशुभ अवकाश!\n_— {manager}_',
    waCOffTemplate: '🔄 *Man Power — C-Off*\n_{date}_\n\nनमस्ते *{name}*,\n\nआपको *Compensatory Off (C-Off)* दिया गया है।\n\n📅 *C-Off Date:* {coffDate}\n📝 *कारण:* {reason}\n\nयह आपकी approved C-Off balance में जोड़ दिया गया है।\n_— {manager}_',
    gpMaxPerMonth: 2,
    waNotifyOnSave: true,
    // Per-type Manager→Team WhatsApp (each can be toggled in Shift Settings)
    waShiftEnabled: true,
    waLeaveEnabled: true,
    waAbsentEnabled: true,
    waGPEnabled: true,
    waHolidayEnabled: true,
    waCOffEnabled: true,
    // Member → Manager WhatsApp (after member Save). In-app notifications always on.
    waMemberLeaveToMgrEnabled: true,
    waMemberShiftToMgrEnabled: true,
    waMemberLeaveToMgrTemplate: '🏖️ *Leave Request*\n\n*Employee:* {name}\n*Dates:* {dates}\n*Type:* {leaveType}\n*Reason:* {reason}\n*Days:* {days}\n\nPlease open Man Power → Pending to Approve/Reject.\n_— sent via Man Power_',
    waMemberShiftToMgrTemplate: '📅 *Shift Change Request*\n\n*Employee:* {name}\n*Date:* {date}\n*From:* {currentShift}\n*To:* {newShift}\n\nPlease open Man Power → Pending to Approve/Reject.\n_— sent via Man Power_',
    metallisers: ['M1','M2'],
    slitters: ['S1','S2'],
    updatedAt: null
  };
}
/** Shifts used by Auto-generate (only active ones). Falls back to D+N. */
function getActiveRotationCodes(){
  const cfg = getShiftConfigSync();
  const active = (cfg.shifts||[]).filter(s=>s && s.code && s.active!==false).map(s=>String(s.code).toUpperCase());
  // Prefer only D/N/A/B/C for rotation (exclude status codes if any leaked in)
  const work = active.filter(c=>['D','N','A','B','C'].includes(c));
  if(work.length) return work;
  return ['D','N'];
}

/** Parse shift cell value into work codes. Supports "D+N", "DN", "A+B", "D/N" etc. */
function parseShiftWorkCodes(sh){
  if(!sh) return [];
  const raw = String(sh).trim().toUpperCase().replace(/\s+/g,'');
  if(!raw) return [];
  // Status-only codes (not work shifts)
  const statusOnly = new Set(['O','L','G','GP','HLF','AB','H','OD','C/O','CO','']);
  if(statusOnly.has(raw) || statusOnly.has(sh)) return [];
  // Explicit combo separators
  if(/[+\/&,]/.test(raw)){
    return raw.split(/[+\/&,]+/).map(x=>x.trim()).filter(x=>['D','N','A','B','C'].includes(x));
  }
  // Two-letter combo DN, ND, AB, BA, AC, CA, BC, CB
  if(raw.length===2 && /^[DNABC]{2}$/.test(raw) && raw[0]!==raw[1]){
    return [raw[0], raw[1]];
  }
  if(['D','N','A','B','C'].includes(raw)) return [raw];
  return [];
}
/** Does this cell count toward a given work shift code (for min-staff rows)? */
function shiftCountsToward(sh, code){
  const codes = parseShiftWorkCodes(sh);
  if(codes.length) return codes.includes(String(code).toUpperCase());
  return String(sh).toUpperCase() === String(code).toUpperCase();
}
/** Headcount for total manpower: one person = 1 even on double shift */
function isPresentOnRoster(sh){
  if(!sh) return false;
  const u = String(sh).toUpperCase();
  if(['O','L','AB','H','C/O','CO',''].includes(u)) return false;
  return true;
}

function getMinStaffForFilter(){
  // Profile → minByField + minFieldActive toggles control which mins apply
  const cfg = getShiftConfigSync();
  const n = (v, fallback) => {
    const x = Number(v);
    return (isFinite(x) && x >= 0) ? x : fallback;
  };
  const byField = (cfg.minByField && typeof cfg.minByField === 'object') ? cfg.minByField : {};
  const active = (cfg.minFieldActive && typeof cfg.minFieldActive === 'object')
    ? cfg.minFieldActive
    : { section:true, machine:false, responsibility:false, designation:false };
  const kindOn = (kind)=>{
    if(kind === 'section') return active.section !== false;
    return !!active[kind];
  };
  const s = String(schedSec || 'ALL');

  const pickFieldMin = (kind, val) => {
    if(!kindOn(kind)) return null;
    const map = byField[kind] || {};
    if(val != null && map[val] != null && isFinite(Number(map[val]))) return Math.max(0, Number(map[val]));
    const want = String(val||'').toLowerCase();
    for(const k of Object.keys(map)){
      if(String(k).toLowerCase()===want && isFinite(Number(map[k]))) return Math.max(0, Number(map[k]));
    }
    return null;
  };

  if(s.startsWith('SEC:')){
    const m = pickFieldMin('section', s.slice(4));
    if(m != null) return m;
    return 0; // type on but this value unset → no highlight
  }
  if(s.startsWith('MC:')){
    const m = pickFieldMin('machine', s.slice(3));
    if(m != null) return m;
    return 0;
  }
  if(s.startsWith('RESP:')){
    const m = pickFieldMin('responsibility', s.slice(5));
    if(m != null) return m;
    return 0;
  }
  if(s.startsWith('DESIG:')){
    const m = pickFieldMin('designation', s.slice(6));
    if(m != null) return m;
    return 0;
  }

  // "All" / category: max among active field mins that are > 0
  if(s === 'ALL' || s.startsWith('CAT:')){
    const vals = [];
    ['section','machine','responsibility','designation'].forEach(kind=>{
      if(!kindOn(kind)) return;
      const map = byField[kind] || {};
      Object.values(map).forEach(x=>{
        const num = Number(x);
        if(isFinite(num) && num > 0) vals.push(num);
      });
    });
    if(vals.length) return Math.max(...vals);
    return n(cfg.minAll, 0);
  }

  let m = pickFieldMin('section', s);
  if(m != null) return m;
  m = pickFieldMin('machine', s);
  if(m != null) return m;
  m = pickFieldMin('section', String(s).replace(/-/g,''));
  if(m != null) return m;

  return n(cfg.minAll, 0);
}

function getShiftConfigSync(){
  const key=myShiftConfigKey();
  if(key && _shiftConfigCache[key]){
    // Re-canonicalize in case older cache had corrupt codes like "To" for A
    try{
      const fixed = _canonicalizeShiftConfig(_shiftConfigCache[key]);
      _shiftConfigCache[key] = fixed;
      return fixed;
    }catch(e){ return _shiftConfigCache[key]; }
  }
  return _defaultShiftConfig();
}

/** Resolve manager phone (10 digit) from managerId / empObjId / mobileUsers */
async function _resolveManagerPhone(managerId){
  const mid = String(managerId||'').trim();
  if(!mid) return '';
  const norm = (p)=> String(p||'').replace(/\D/g,'').slice(-10);
  try{
    const emp = (typeof getEmps==='function'?getEmps():[]).find(e=>e && (e.id===mid || e.empId===mid || e.empObjId===mid));
    if(emp){
      const ph = norm(emp.phone||emp.mobile);
      if(ph.length===10) return ph;
    }
  }catch(e){}
  try{
    const rec = await fbGet('employees/'+mid);
    if(rec){
      const ph = norm(rec.phone||rec.mobile);
      if(ph.length===10) return ph;
    }
  }catch(e){}
  try{
    const allMu = await fbGet('mobileUsers') || {};
    for(const [mobKey, u] of Object.entries(allMu)){
      if(!u || u.role!=='manager') continue;
      if(u.empObjId===mid || u.employeeId===mid || mobKey===_normMobileKey(mid) ||
         _normMobileKey(u.mobile||'')===_normMobileKey(mid) || String(u.uid||'')===mid){
        const ph = norm(u.mobile||mobKey);
        if(ph.length===10) return ph;
      }
    }
  }catch(e){}
  // managerId might already be a phone
  const asPh = norm(mid);
  if(asPh.length===10) return asPh;
  return '';
}

/** Load manager's shift config (for member: try mgr keys). Falls back to defaults. */
async function _loadMgrShiftCfgForMember(managerId){
  const def = (typeof _defaultShiftConfig==='function') ? _defaultShiftConfig() : {};
  const keys = [];
  try{
    if(typeof myShiftConfigKey==='function'){
      const k = myShiftConfigKey();
      if(k) keys.push(k);
    }
  }catch(e){}
  if(managerId){
    keys.push('mgr:'+managerId);
    try{ keys.push('mgr:'+_normMobileKey(managerId)); }catch(e){}
  }
  for(const key of keys){
    if(!key) continue;
    try{
      const safe = String(key).replace(/[:.#$\[\]]/g,'_');
      const rec = await fbGet('shiftConfigs/'+safe);
      if(rec && typeof rec==='object') return {...def, ...rec};
    }catch(e){}
  }
  try{
    const sync = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : null;
    if(sync) return {...def, ...sync};
  }catch(e){}
  return def;
}

/**
 * After member leave/shift request: in-app always; WhatsApp to manager if template enabled.
 * type: 'leave' | 'shift'
 */
async function _notifyMappedManagerAfterMemberAction(type, payload){
  payload = payload || {};
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const managerId = payload.managerId || SESSION.managerId || (myEmp()&&myEmp().managerId) || '';
  if(!managerId){
    console.warn('[member→mgr] no managerId');
    return;
  }

  // In-app always (unless already sent by caller)
  if(!payload.skipInApp){
    try{
      const notif = {
        type: type==='leave' ? 'leave_request' : 'shift_change_request',
        title: type==='leave'
          ? (L('🏖️ छुट्टी आवेदन','🏖️ Leave request'))
          : (L('📅 Shift बदलने का अनुरोध','📅 Shift change request')),
        body: payload.notifBody || payload.name || '',
        read: false,
        at: new Date().toISOString(),
        managerId: String(managerId),
        empObjId: payload.empObjId || SESSION.empObjId || '',
        reqKey: payload.reqKey || ''
      };
      const targets = new Set([String(managerId)]);
      try{
        const allMu = await fbGet('mobileUsers') || {};
        Object.entries(allMu).forEach(([mobKey, u])=>{
          if(!u || u.role!=='manager' || u.status!=='approved') return;
          const mid = String(managerId);
          if(u.empObjId===mid || u.employeeId===mid || mobKey===_normMobileKey(mid) ||
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
    }catch(e){ console.warn('[member→mgr in-app]', e); }
  }

  // WhatsApp only if that template is ON
  try{
    const cfg = await _loadMgrShiftCfgForMember(managerId);
    const enabled = type==='leave'
      ? (cfg.waMemberLeaveToMgrEnabled !== false)
      : (cfg.waMemberShiftToMgrEnabled !== false);
    if(!enabled){
      toast(L('✅ सेव — Manager को app में सूचना (इस type का WhatsApp बंद है)','✅ Saved — Manager notified in app (WhatsApp off for this type)'));
      return;
    }
    const phone = await _resolveManagerPhone(managerId);
    if(!phone || phone.length!==10){
      toast(L('✅ सेव — Manager का WhatsApp नंबर नहीं (app सूचना गई)','✅ Saved — Manager has no mobile for WhatsApp (in-app sent)'));
      return;
    }
    const def = _defaultShiftConfig();
    let tpl = type==='leave'
      ? getWATemplate('waMemberLeaveToMgrTemplate', cfg.waMemberLeaveToMgrTemplate)
      : getWATemplate('waMemberShiftToMgrTemplate', cfg.waMemberShiftToMgrTemplate);
    const fill = (s, map)=>{
      let out = String(s||'');
      Object.keys(map).forEach(k=>{
        out = out.replace(new RegExp('\\{'+k+'\\}','g'), map[k]==null?'':String(map[k]));
      });
      return out;
    };
    const msg = fill(tpl, {
      name: payload.name || SESSION.name || '',
      dates: payload.dates || payload.date || '',
      date: payload.date || '',
      leaveType: payload.leaveType || '',
      reason: payload.reason || '',
      days: payload.days != null ? payload.days : '',
      currentShift: payload.currentShift || '',
      newShift: payload.newShift || '',
      manager: payload.managerName || 'Manager'
    });
    if(typeof openWA==='function') openWA(phone, msg);
    else window.open('https://wa.me/91'+phone+'?text='+encodeURIComponent(msg), '_blank');
    toast(L('📲 WhatsApp खुला — Manager को भेजें','📲 WhatsApp opened — send to Manager'));
  }catch(e){
    console.warn('[member→mgr WA]', e);
  }
}


function warmShiftConfigCache(){
  getShiftConfig().catch(()=>{}); // fire-and-forget, populates _shiftConfigCache for sync use
}
function getSchedFilteredEmps(){
  const all=getEmps();
  if(!schedSec || schedSec==='ALL') return all;

  // Multi-select secondary chips (e.g. M-1 + M-2)
  const multi = Array.isArray(schedSubMulti) ? schedSubMulti.filter(Boolean) : [];
  if(multi.length){
    return all.filter(e=>{
      return multi.some(code=>{
        const c = String(code);
        if(c.startsWith('SEC:')){
          const v=c.slice(4);
          const sec = (typeof getEmpSection==='function') ? getEmpSection(e) : (e.section||e.sec||'');
          return sec===v || _normSecKey(sec)===_normSecKey(v) || _normLabelKey(sec)===_normLabelKey(v)
            || String(e.sec||'')===v || _normSecKey(e.sec)===_normSecKey(v);
        }
        if(c.startsWith('MC:')){
          const v=c.slice(3);
          const m=String(e.mc||e.machine||(typeof getEmpMachine==='function'?getEmpMachine(e):'')||'');
          return m===v || _normSecKey(m)===_normSecKey(v) || _normLabelKey(m)===_normLabelKey(v);
        }
        if(c.startsWith('RESP:')){
          const v=c.slice(5);
          return _normLabelKey(e.resp||e.responsibility||'')===_normLabelKey(v);
        }
        if(c.startsWith('DESIG:')){
          const v=c.slice(6);
          return _normLabelKey(e.designation||'')===_normLabelKey(v);
        }
        return false;
      });
    });
  }

  // Category mode: CAT:section | CAT:machine | … — show all until a sub is selected
  if(String(schedSec).startsWith('CAT:')){
    return all;
  }
  // Legacy single sub-filter: SEC:value | MC:value | RESP:value | DESIG:value
  if(String(schedSec).startsWith('SEC:')){
    const v=String(schedSec).slice(4);
    const nv=_normSecKey(v);
    const nl=_normLabelKey(v);
    return all.filter(e=>{
      const sec = getEmpSection(e);
      return sec===v || _normSecKey(sec)===nv || _normLabelKey(sec)===nl
        || String(e.sec||'')===v || _normSecKey(e.sec)===nv || _normLabelKey(e.sec)===nl;
    });
  }
  if(String(schedSec).startsWith('MC:')){
    const v=String(schedSec).slice(3);
    const nl=_normLabelKey(v);
    return all.filter(e=>{
      const m=String(e.mc||e.machine||getEmpMachine(e)||'');
      return m===v || _normSecKey(m)===_normSecKey(v) || _normLabelKey(m)===nl;
    });
  }
  if(String(schedSec).startsWith('RESP:')){
    const v=String(schedSec).slice(5);
    const nl=_normLabelKey(v);
    return all.filter(e=>_normLabelKey(e.resp||e.responsibility||'')===nl);
  }
  if(String(schedSec).startsWith('DESIG:')){
    const v=String(schedSec).slice(6);
    const nl=_normLabelKey(v);
    return all.filter(e=>_normLabelKey(e.designation||'')===nl);
  }
  // Legacy exact sec match + old group codes
  if(schedSec==='M12') return all.filter(e=>e.sec==='M1'||e.sec==='M2');
  if(schedSec==='S12') return all.filter(e=>e.sec==='S1'||e.sec==='S2');
  if(schedSec==='GRP:supervisor') return all.filter(e=>{ const k=_normSecKey(e.sec); return k==='SUP'||k==='ALL'; });
  if(schedSec==='GRP:manager') return all.filter(e=>{ const k=_normSecKey(e.sec); return k==='MGR'||k==='MANAGER'; });
  return all.filter(e=>e.sec===schedSec || String(e.mc||'')===schedSec);
}

/** Unique sorted values from team for a field */

/** True if value looks like a Machine code (must NOT appear under Section filters) */
function _isMachineLikeValue(v){
  const s = String(v||'').trim();
  if(!s) return false;
  // M-1, M1, M-1&2, M1&2, S-1, S-1&2, All (machine assignment)
  if(/^(M|S)\s*[-]?\s*[12]\s*([&+/and]+\s*[12])?$/i.test(s)) return true;
  if(/^(M|S)\s*1\s*&\s*2$/i.test(s)) return true;
  if(/^all$/i.test(s)) return true;
  const k = s.toUpperCase().replace(/[^A-Z0-9&]/g,'');
  if(['M1','M2','M12','M1M2','M1AND2','M1&2','S1','S2','S12','S1S2','S1AND2','S1&2'].includes(k)) return true;
  return false;
}

/**
 * Section = Excel "Section" column only (any text the Manager uploaded).
 * Never invent Metalliser/Slitter from machine codes — different managers use different names.
 * If sec was wrongly saved as machine code, return '' so it does not pollute Section filters.
 */
function getEmpSection(e){
  if(!e) return '';
  // Section = whatever Manager put in Excel "Section" column (free text).
  // Prefer e.section; fall back to e.sec. Never invent Metalliser/Slitter prefixes.
  let raw = String(e.section||'').trim();
  if(!raw) raw = String(e.sec||'').trim();
  if(!raw) return '';
  // Pure machine codes (M-1, S-1) belong to Machine column — not Section
  if(typeof _isMachineLikeValue==='function' && _isMachineLikeValue(raw)) return '';
  return raw;
}
function getEmpMachine(e){
  if(!e) return '';
  return String(e.mc||e.machine||'').trim();
}
function getEmpResp(e){
  if(!e) return '';
  return String(e.resp||e.responsibility||'').trim();
}

function _normLabelKey(s){
  return String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
}

/**
 * Excel / manager-editable field values (Responsibility, Designation, Machine, Section names)
 * must ALWAYS display as stored — never hardcoded translation.
 * Only fixed UI chrome (chip categories like "Responsibility") uses L().
 * If a manager edits "Trainee" → "Trainee-2" in Excel, the UI shows "Trainee-2" in every language.
 */
function _fieldDisplayLabel(val){
  if(val==null || val==='') return '';
  return String(val).trim(); // identity — do not translate user data
}

/** Prefer nicer display label when duplicates differ only by case */
function _preferLabel(a, b){
  if(!a) return b||'';
  if(!b) return a;
  // Prefer mixed-case / Title-like over all-lower
  const score = (s)=>{
    let sc = 0;
    if(/[A-Z]/.test(s)) sc += 2;
    if(s.length > 0 && s[0]===s[0].toUpperCase()) sc += 1;
    if(s !== s.toLowerCase() && s !== s.toUpperCase()) sc += 2;
    return sc;
  };
  return score(a) >= score(b) ? a : b;
}
function _teamFieldValues(field){
  // Case-insensitive unique: "Sr. Team Member" and "Sr. team member" → one chip
  const map = new Map(); // lowerKey -> display label
  (getEmps()||[]).forEach(e=>{
    let v='';
    if(field==='section'){
      v=getEmpSection(e);
      if(v && _isMachineLikeValue(v)) v='';
    } else if(field==='machine') v=getEmpMachine(e);
    else if(field==='responsibility') v=getEmpResp(e);
    else if(field==='designation') v=String(e.designation||'').trim();
    v = String(v||'').trim();
    if(!v) return;
    const k = _normLabelKey(v);
    map.set(k, _preferLabel(map.get(k), v));
  });
  return Array.from(map.values()).sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'}));
}

function _normSecKey(s){ return (s||'').toString().toUpperCase().replace(/[^A-Z0-9]/g,''); }
function _buildMachineChips(kind){
  const cfg=getShiftConfigSync();
  const emps=getEmps();
  const primary=[{code:'ALL',label:L('सभी','All')}];
  const secondary=[];
  const metKeys=new Set((cfg.metallisers||[]).map(_normSecKey));
  const slitKeys=new Set((cfg.slitters||[]).map(_normSecKey));
  const allSecs=Array.from(new Set(emps.map(e=>e.sec).filter(Boolean)));

  const metPoolSecs=allSecs.filter(s=>_normSecKey(s)==='MET');
  const slitPoolSecs=allSecs.filter(s=>_normSecKey(s)==='SLIT');
  const supSecs=allSecs.filter(s=>{ const k=_normSecKey(s); return k==='SUP'||k==='ALL'; });
  const mgrSecs=allSecs.filter(s=>{ const k=_normSecKey(s); return k==='MGR'||k==='MANAGER'; });
  const metMachineSecs=allSecs.filter(s=>metKeys.has(_normSecKey(s)) && _normSecKey(s)!=='MET');
  const slitMachineSecs=allSecs.filter(s=>slitKeys.has(_normSecKey(s)) && _normSecKey(s)!=='SLIT');
  const known=new Set([...metPoolSecs,...slitPoolSecs,...supSecs,...mgrSecs,...metMachineSecs,...slitMachineSecs]);
  const otherSecs=allSecs.filter(s=>!known.has(s));

  if(metPoolSecs.length || metMachineSecs.length)
    primary.push({code:'GRP:metalliser',label:L('सेक्शन ग्रुप','Section Group')});
  if(slitPoolSecs.length || slitMachineSecs.length)
    primary.push({code:'GRP:slitter',label:L('सेक्शन ग्रुप 2','Section Group 2')});
  if(supSecs.length)
    primary.push({code:'GRP:supervisor',label:L('सुपरवाइज़र','Supervisor')});
  if(mgrSecs.length)
    primary.push({code:'GRP:manager',label:L('मैनेजर','Manager')});

  metMachineSecs.sort().forEach(s=>secondary.push({code:s,label:secName(s)||s}));
  slitMachineSecs.sort().forEach(s=>secondary.push({code:s,label:secName(s)||s}));
  otherSecs.forEach(s=>secondary.push({code:s,label:secName(s)||s}));

  if(kind==='team'){
    const all=[...primary];
    secondary.forEach(c=>{ if(!all.some(x=>x.code===c.code)) all.push(c); });
    return all;
  }
  return { primary, secondary };
}
function _buildTeamSectionChips(){
  // Chips = unique Section values from Excel (not hardcoded M1/S1…)
  const primary = [{code:'ALL', label: (typeof L==='function') ? L('सभी','All') : 'All'}];
  const secs = (typeof _teamFieldValues==='function') ? _teamFieldValues('section') : [];
  secs.forEach(v=>{
    if(!v) return;
    primary.push({code:v, label:v});
  });
  return primary;
}
function _toggleTeamFold(hdr){
  try{
    const box = hdr && hdr.parentElement;
    if(!box) return;
    const body = box.querySelector(':scope > .team-fold-body');
    const chev = hdr.querySelector('.team-fold-chev');
    if(!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    if(chev) chev.textContent = open ? '▶' : '▼';
    box.setAttribute('data-open', open ? '0' : '1');
  }catch(e){}
}
function _renderDynamicChips(containerId, chips, activeCode, clickFnName){
  const el=document.getElementById(containerId);
  if(!el) return;
  const list = Array.isArray(chips) ? chips : (chips.primary||[]);
  el.innerHTML=list.map(c=>`<div class="chip${c.code===activeCode?' on':''}" onclick="${clickFnName}('${c.code.replace(/'/g,"\\'")}',this)">${c.label}</div>`).join('');
}
function _renderSchedFilterChips(activeCode){
  const isEn = (_lang !== 'hi');
  const canEdit = (typeof canEditSchedule==='function') ? canEditSchedule() : true;
  const secEl = document.getElementById('schedFilterSecondary');
  const primaryEl = document.getElementById('schedFilter');

  // Members WITHOUT schedule-edit: only section chips, already expanded (no "Sections" category header)
  if(!canEdit){
    if(primaryEl){
      // Single "All" chip only in primary row
      _renderDynamicChips('schedFilter', [{code:'ALL', label: L('सभी','All')}], (String(activeCode||'')==='ALL' || !activeCode) ? 'ALL' : 'ALL', 'setSchedSec');
    }
    // Force section mode when they pick a section; show all section values expanded
    if(secEl){
      const list = (typeof _teamFieldValues==='function' ? _teamFieldValues('section') : []).map(v=>({code:'SEC:'+v, label:v}));
      if(list.length){
        secEl.style.display = 'flex';
        secEl.innerHTML = list.map(c=>{
          const codeEsc = String(c.code).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
          const on = ((typeof schedSubMulti!=='undefined' && (schedSubMulti||[]).includes(c.code)) || String(activeCode)===c.code) ? ' on' : '';
          return '<div class="chip chip-sm'+on+'" onclick="setSchedSec(\''+codeEsc+'\',this)">'+String(c.label).replace(/</g,'&lt;')+'</div>';
        }).join('');
      } else {
        secEl.style.display = 'none';
        secEl.innerHTML = '';
      }
    }
    // If they somehow landed on machine/resp filter, snap to section view
    try{
      if(typeof schedSec!=='undefined'){
        const s = String(schedSec||'');
        if(s.startsWith('CAT:machine') || s.startsWith('MC:') || s.startsWith('CAT:responsibility') || s.startsWith('RESP:') || s.startsWith('CAT:designation') || s.startsWith('DESIG:')){
          schedSec = 'CAT:section';
        }
      }
    }catch(e){}
    return;
  }

  // Managers / schedule-edit: full primary categories
  const primary = [
    {code:'ALL', label: L('सभी','All')},
    {code:'CAT:section', label: L('सेक्शन','Sections')},
    {code:'CAT:machine', label: L('मशीन','Machines')},
    {code:'CAT:responsibility', label: L('ज़िम्मेदारी','Responsibility')},
    {code:'CAT:designation', label: L('पदनाम','Designation')},
  ];
  let primaryActive = activeCode || 'ALL';
  if(String(activeCode).startsWith('SEC:')) primaryActive = 'CAT:section';
  else if(String(activeCode).startsWith('MC:')) primaryActive = 'CAT:machine';
  else if(String(activeCode).startsWith('RESP:')) primaryActive = 'CAT:responsibility';
  else if(String(activeCode).startsWith('DESIG:')) primaryActive = 'CAT:designation';
  _renderDynamicChips('schedFilter', primary, primaryActive, 'setSchedSec');
  if(!secEl) return;
  let list = [];
  const act = String(activeCode||'');
  if(act==='CAT:section' || act.startsWith('SEC:')){
    list = _teamFieldValues('section').map(v=>({code:'SEC:'+v, label:v}));
  } else if(act==='CAT:machine' || act.startsWith('MC:')){
    list = _teamFieldValues('machine').map(v=>({code:'MC:'+v, label:v}));
  } else if(act==='CAT:responsibility' || act.startsWith('RESP:')){
    list = _teamFieldValues('responsibility').map(v=>({code:'RESP:'+v, label:v}));
  } else if(act==='CAT:designation' || act.startsWith('DESIG:')){
    list = _teamFieldValues('designation').map(v=>({code:'DESIG:'+v, label:v}));
  }
  if(list.length){
    secEl.style.display = 'flex';
    secEl.innerHTML = list.map(c=>{
      const codeEsc = String(c.code).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      const on = ((schedSubMulti||[]).includes(c.code)) ? ' on' : '';
      return '<div class="chip chip-sm'+on+'" onclick="setSchedSec(\''+codeEsc+'\',this)">'+String(c.label).replace(/</g,'&lt;')+'</div>';
    }).join('');
  } else {
    secEl.style.display = 'none';
    secEl.innerHTML = '';
  }
}
function toggleSchedMoreMenu(force){
  const menu = document.getElementById('schedMoreMenu');
  const btn = document.getElementById('schedMoreBtn');
  if(!menu) return;
  const open = force === false ? false : force === true ? true : menu.style.display === 'none';
  menu.style.display = open ? 'block' : 'none';
  if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.addEventListener('click', function(e){
  const wrap = document.getElementById('schedMoreWrap');
  if(wrap && !wrap.contains(e.target)) try{ toggleSchedMoreMenu(false); }catch(x){}
});
function _mpSchedShortcuts(e){
  if(!document.getElementById('tab-schedule')||!document.getElementById('tab-schedule').classList.contains('on')) return;
  if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if(e.key==='n' && !e.ctrlKey && !e.metaKey && typeof openScheduleBuilder==='function' && typeof canEditSchedule==='function' && canEditSchedule()) openScheduleBuilder();
  if((e.key==='p'||e.key==='P') && !e.ctrlKey && !e.metaKey && typeof printSched==='function') printSched();
}
document.addEventListener('keydown', _mpSchedShortcuts);

let _shiftConfigCache={};
function _canonicalizeShiftConfig(cfg){
  if(!cfg || typeof cfg !== 'object') return _defaultShiftConfig();
  const std = [
    {code:'D', label:'Day Shift', start:'08:00', end:'20:00', active:true},
    {code:'N', label:'Night Shift', start:'20:00', end:'08:00', active:true},
    {code:'A', label:'A Shift', start:'06:00', end:'14:00', active:false},
    {code:'B', label:'B Shift', start:'14:00', end:'22:00', active:false},
    {code:'C', label:'C Shift', start:'22:00', end:'06:00', active:false}
  ];
  const byCode = {};
  (cfg.shifts||[]).forEach(s=>{
    if(!s) return;
    let code = String(s.code||'').trim();
    // Fix corrupt codes (To/Te shown as A Shift in legend)
    if(typeof normalizeShiftCode==='function'){
      code = normalizeShiftCode(code, s.label);
    } else {
      const u = code.toUpperCase();
      if(u==='TO' || u==='TE') code = 'A';
      else code = u || code;
    }
    code = String(code||'').toUpperCase();
    if(['D','N','A','B','C'].includes(code)){
      byCode[code] = {
        code,
        label: s.label || ({D:'Day Shift',N:'Night Shift',A:'A Shift',B:'B Shift',C:'C Shift'})[code],
        start: s.start,
        end: s.end,
        active: s.active
      };
    }
  });
  const hadAnyActive = Object.values(byCode).some(s=>s && s.active===true);
  const shifts = std.map(s=>{
    const prev = byCode[s.code];
    let active = s.active;
    if(prev){
      if(prev.active===true || prev.active===false) active = !!prev.active;
      else if(!hadAnyActive && Object.keys(byCode).length) active = true;
    }
    return {
      code: s.code,
      label: (prev && prev.label) || s.label,
      start: (prev && prev.start) || s.start,
      end: (prev && prev.end) || s.end,
      active
    };
  });
  return Object.assign({}, cfg, { shifts });
}

async function getShiftConfig(keyOverride){
  const key=keyOverride||myShiftConfigKey();
  if(!key) return _defaultShiftConfig();
  if(_shiftConfigCache[key]) return _shiftConfigCache[key];
  try{
    const rec=await fbGet('shiftConfigs/'+key.replace(/[:.#$\[\]]/g,'_'));
    const cfg=_canonicalizeShiftConfig(rec||_defaultShiftConfig());
    _shiftConfigCache[key]=cfg;
    return cfg;
  }catch(e){ return _defaultShiftConfig(); }
}
async function saveShiftConfig(cfg,keyOverride){
  const key=keyOverride||myShiftConfigKey();
  if(!key){ toast(L('❌ Company select करें पहले','❌ Select a company first')); return false; }
  cfg.updatedAt=new Date().toISOString();
  cfg.updatedBy=SESSION.name;
  try{
    // Ensure managers/{uid} + phone auth so RTDB rules allow the write
    if(typeof _ensureWriteAuth === 'function'){
      const authOk = await _ensureWriteAuth();
      if(!authOk){
        toast('❌ Login/OTP needed to save settings');
        return false;
      }
    }
    try{ await _syncAuthRoleNodes(); }catch(e){}
    // If manager in session but mobileUsers still pending, upgrade to approved (rules allow self-upgrade for manager)
    try{
      if(SESSION.role==='manager' && SESSION.mobile){
        const mob = _normMobileKey(SESSION.mobile);
        if(mob){
          const existing = await fbGet('mobileUsers/'+mob);
          if(existing && existing.role==='manager' && existing.status!=='approved'){
            await fbSet('mobileUsers/'+mob, {...existing, status:'approved', autoApproved:true});
          } else if(!existing){
            await fbSet('mobileUsers/'+mob, {
              role:'manager', name:SESSION.name||'', mobile:SESSION.mobile,
              company:SESSION.company||'', status:'approved', autoApproved:true,
              registeredAt:new Date().toISOString()
            });
          }
          await _syncAuthRoleNodes();
        }
      }
    }catch(e){ console.warn('[saveShiftConfig] mobileUsers ensure', e); }
    await fbSet('shiftConfigs/'+key.replace(/[:.#$\[\]]/g,'_'),cfg);
    _shiftConfigCache[key]=cfg;
    return true;
  }catch(e){ toast('❌ '+(String(e.message||e).includes('PERMISSION_DENIED')||String(e.message||e).includes('Permission denied')?'Permission denied — redeploy database.rules.json (v2.4.6) then retry':e.message)); return false; }
}

function getSchedules(){ return _cache.schedules   || {}; }


/** Always attach Firebase push key as _key (Object.values alone loses keys) */
function _normalizeLeavesSnap(v){
  if(!v || typeof v!=='object') return [];
  return Object.entries(v).map(([k,l])=>{
    if(!l || typeof l!=='object') return null;
    return {...l, _key: l._key || k, id: l.id || l._key || k};
  }).filter(Boolean);
}

function getLeaves(){
  const scopedIds=new Set(getEmps().map(e=>e.id));
  return (_cache.leaves||[]).filter(l=>scopedIds.has(l.empId));
}
function getReports(){
  const scopedIds=new Set(getEmps().map(e=>e.id));
  // Imp Info broadcasts use aboutId:'all' — always include them (and any type imp_info)
  return (_cache.reports||[]).filter(r=>{
    if(!r) return false;
    if(r.type==='imp_info' || r.aboutId==='all' || r.section==='ALL') return true;
    return scopedIds.has(r.aboutId);
  });
}
function getOverrides(){ return _cache.overrides   || {}; }
function getRegs()     { return _cache.regRequests || []; }
function getInst()     { return _cache.instructions|| DEFAULT_INSTRUCTIONS; }

// ════════════════════════════════════════
// DEVICE + SESSION + 45-DAY EXPIRY
// ════════════════════════════════════════
let SESSION = { role:'', name:'', empId:'', empObjId:'', dept:'', deviceId:'' };

// ── Theme Toggle ──
function initTheme(){
  const saved = localStorage.getItem('mp_theme');
  if(saved === 'dark'){ document.body.classList.remove('light'); document.body.classList.add('dark'); }
  else { document.body.classList.add('light'); document.body.classList.remove('dark'); }
  updateThemeIcon();
}
function toggleTheme(){
  const isLight = document.body.classList.contains('light');
  if(isLight){ document.body.classList.remove('light'); document.body.classList.add('dark'); localStorage.setItem('mp_theme','dark'); }
  else { document.body.classList.remove('dark'); document.body.classList.add('light'); localStorage.setItem('mp_theme','light'); }
  updateThemeIcon();
}
function updateThemeIcon(){
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
}
initTheme();

// ══════════════════════════════════════════
// LANGUAGE + COUNTRY (shared with Met Train: mp_country, mp_lang)
// Default: India → Hindi
// ══════════════════════════════════════════
let _lang = localStorage.getItem('mp_lang') || '';
let _country = localStorage.getItem('mp_country') || '';
/** Map browser locale → app lang code */
function _detectBrowserLang(){
  try{
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    var low = String(nav).toLowerCase();
    var map = {
      'hi':'hi','hi-in':'hi','en':'en','en-in':'en','en-us':'en','en-gb':'en',
      'gu':'gu','gu-in':'gu','ta':'ta','ta-in':'ta','te':'te','te-in':'te',
      'kn':'kn','kn-in':'kn','bn':'bn','bn-in':'bn','bn-bd':'bn','or':'or','or-in':'or',
      'ar':'ar','ar-sa':'ar','ar-ae':'ar','ar-eg':'ar','ur':'ur','ur-pk':'ur','ur-in':'ur',
      'zh':'zh','zh-cn':'zh','zh-tw':'zh','de':'de','de-de':'de','it':'it','it-it':'it',
      'es':'es','es-es':'es','es-mx':'es','tr':'tr','tr-tr':'tr','pt':'pt','pt-br':'pt','pt-pt':'pt',
      'th':'th','th-th':'th','id':'id','id-id':'id','vi':'vi','vi-vn':'vi'
    };
    if(map[low]) return map[low];
    var base = low.split('-')[0];
    return map[base] || 'en';
  }catch(e){ return 'en'; }
}
function _detectBrowserCountry(){
  try{
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    var low = String(nav).toLowerCase();
    if(/ar|ur/.test(low) && !/in/.test(low)) return 'GULF';
    if(/^zh/.test(low)) return 'CN';
    if(/de|it|es|tr|fr|nl|pl/.test(low.split('-')[0])) return 'EU';
    if(/pt|es-mx|es-ar|en-us|en-ca/.test(low)) return 'AM';
    if(/th|id|vi|ms/.test(low.split('-')[0])) return 'SEA';
    return 'IN';
  }catch(e){ return 'IN'; }
}
if(!_lang){
  _lang = _detectBrowserLang();
  try{ localStorage.setItem('mp_lang', _lang); }catch(e){}
}
if(!_country){
  _country = _detectBrowserCountry();
  try{ localStorage.setItem('mp_country', _country); }catch(e){}
}



function shareApp(){
  const url = (location.origin + location.pathname).replace(/\/+$/,'') + '/';
  const title = 'Man Power';
  // Do NOT put URL in text — share sheet / WhatsApp already attaches url once
  const text = 'Man Power — A Team Management and Training Application';
  if(navigator.share){
    navigator.share({ title, text, url }).catch(()=>{
      try{ navigator.clipboard.writeText(url); toast('✅ App link copied'); }catch(e){ prompt('Copy:', url); }
    });
  } else {
    try{
      navigator.clipboard.writeText(url);
      toast('✅ App link copied');
    }catch(e){
      prompt('Copy app link:', url);
    }
  }
}
function openLocalePicker(){
  const countries = (typeof MT_COUNTRY_ORDER!=='undefined') ? MT_COUNTRY_ORDER : ['IN','GULF','CN','EU','AM','SEA'];
  const locales = (typeof MT_LOCALES!=='undefined') ? MT_LOCALES : {
    IN:{name:'India',flag:'🇮🇳',langs:[{code:'hi',label:'हिं',title:'हिन्दी'},{code:'en',label:'EN',title:'English'}]}
  };
  let cHtml = countries.map(c=>{
    const L = locales[c]; if(!L) return '';
    const on = (_country===c) ? 'border:2px solid #f97316;background:rgba(249,115,22,.12)' : 'border:1px solid var(--border2);background:var(--card)';
    return `<button type="button" onclick="selectCountry('${c}')" style="padding:10px 8px;border-radius:12px;cursor:pointer;font-family:inherit;text-align:center;${on}">
      <div style="font-size:20px">${L.flag||''}</div>
      <div style="font-size:11px;font-weight:800;color:var(--text);margin-top:4px">${L.name||c}</div>
    </button>`;
  }).join('');
  const langs = (locales[_country]&&locales[_country].langs) ? locales[_country].langs : [{code:'hi',label:'हिं',title:'हिन्दी'},{code:'en',label:'EN',title:'English'}];
  let lHtml = langs.map(L=>{
    const on = (_lang===L.code) ? 'border:2px solid #25d366;background:rgba(37,211,102,.15)' : 'border:1px solid var(--border2);background:var(--card)';
    return `<button type="button" onclick="selectLang('${L.code}')" style="padding:10px 12px;border-radius:12px;cursor:pointer;font-family:inherit;${on}">
      <div style="font-size:16px;font-weight:900;color:var(--text)">${L.label}</div>
      <div style="font-size:10px;color:var(--muted2)">${L.title}</div>
    </button>`;
  }).join('');
  openModal(`
  <div class="modal-title">🌐 Country & Language</div>
  <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Default: <b>India</b> → Hindi / English. Same preference is used in Met Train PRO.</div>
  <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">1. Country</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">${cHtml}</div>
  <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">2. Language</div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">${lHtml}</div>
  <div style="font-size:11px;color:var(--muted2);margin-bottom:12px;line-height:1.4">Full UI languages by region: <b>India</b> (hi/en/gu/ta/te/kn/bn/or), <b>Gulf</b> (en/hi/ar/ur/bn), <b>China</b> (zh/en), <b>EU</b> (en/de/it/es/tr), <b>Americas</b> (en/es/pt), <b>SE Asia</b> (en/th/id/vi). Missing strings → English.</div>
  <div class="modal-sticky-actions">
    <button class="submit-btn" onclick="closeModal()">✅ Done</button>
  </div>`);
}
function selectCountry(c){
  _country = c || 'IN';
  try{ localStorage.setItem('mp_country', _country); }catch(e){}
  const locales = (typeof MT_LOCALES!=='undefined') ? MT_LOCALES : {};
  const langs = (locales[_country]&&locales[_country].langs) ? locales[_country].langs : [];
  if(!langs.some(x=>x.code===_lang)){
    _lang = (langs[0]&&langs[0].code) || 'en';
    try{ localStorage.setItem('mp_lang', _lang); }catch(e){}
  }
  applyLang();
  openLocalePicker();
}
function selectLang(code){
  _lang = code || 'hi';
  try{ localStorage.setItem('mp_lang', _lang); }catch(e){}
  applyLang();
  try{ applyLoginLang(); }catch(e){}
  try{
    if(typeof SESSION!=='undefined' && SESSION && SESSION.role){
      buildNav().then(()=>{ goTab(_currentTab); });
    }
  }catch(e){}
  openLocalePicker();
  toast('🌐 '+String(_lang).toUpperCase()+' · '+(_country||'IN'));
}
function toggleLang(){
  _lang = (_lang === 'hi') ? 'en' : 'hi';
  try{ localStorage.setItem('mp_lang', _lang); }catch(e){}
  applyLang();
  buildNav().then(()=>{ goTab(_currentTab); });
}


/** Refresh login-screen labels for current _lang. Preference is mp_lang (shared with in-app). */
function applyLoginLang(){
  const lang = (typeof _lang !== 'undefined' && _lang) ? _lang : 'hi';
  try{ if(typeof loadLangFont==='function') loadLangFont(lang); }catch(e){}
  const T = (hi, en) => {
    if(typeof L === 'function') return L(hi, en);
    if(typeof mlT === 'function'){
      const v = mlT(hi, lang);
      if(v && v !== hi) return v;
    }
    return lang === 'hi' ? hi : en;
  };
  // Language button
  const langBtn = document.getElementById('loginLangBtnLabel');
  if(langBtn){
    const titles = {hi:'हिन्दी',en:'English',gu:'ગુજરાતી',ta:'தமிழ்',te:'తెలుగు',kn:'ಕನ್ನಡ',bn:'বাংলা',or:'ଓଡ଼ିଆ',ar:'العربية',ur:'اردو',zh:'中文',de:'Deutsch',it:'Italiano',es:'Español',tr:'Türkçe',pt:'Português',th:'ไทย',id:'Indonesia',vi:'Tiếng Việt'};
    const name = titles[lang] || String(lang).toUpperCase();
    langBtn.textContent = name + (lang === 'en' ? '' : ' · English OK');
  }
  // Mobile title — English always primary
  const title = document.getElementById('loginMobileTitle');
  if(title) title.textContent = '📱 Mobile Number';
  const titleHi = document.getElementById('loginMobileTitleHi');
  if(titleHi){
    if(lang === 'en'){ titleHi.style.display = 'none'; }
    else {
      titleHi.style.display = '';
      titleHi.textContent = T('मोबाइल नंबर', 'Mobile Number');
    }
  }
  const hint = document.getElementById('loginMobileHint');
  if(hint){
    hint.innerHTML = lang === 'hi'
      ? 'Member / Manager login — <b style="color:#ffffff">Mobile Number only</b> (no Employee Code)'
      : 'Member / Manager login — <b style="color:#ffffff">Mobile Number only</b> (not Employee Code)';
  }
  const inp = document.getElementById('loginMobile');
  if(inp) inp.placeholder = lang === 'hi' ? '10 अंकों का Mobile Number' : '10-digit Mobile Number';
  const otpBtn = document.getElementById('sendOtpBtn');
  if(otpBtn){
    const dis = otpBtn.disabled;
    otpBtn.innerHTML = T('OTP भेजें', 'Send OTP') + ' &#128172;';
    otpBtn.disabled = dis;
  }
  // OTP step
  const otpTitle = document.getElementById('loginOtpTitle');
  if(otpTitle) otpTitle.textContent = T('OTP डालें', 'Enter OTP');
  const otpTitleHi = document.getElementById('loginOtpTitleHi');
  if(otpTitleHi){
    if(lang === 'en') otpTitleHi.style.display = 'none';
    else { otpTitleHi.style.display = ''; otpTitleHi.textContent = T('OTP डालें', 'Enter OTP'); }
  }
  const verifyBtn = document.getElementById('verifyOtpBtn');
  if(verifyBtn){
    const dis = verifyBtn.disabled;
    verifyBtn.innerHTML = T('Verify करें', 'Verify') + ' &#10003;';
    verifyBtn.disabled = dis;
  }
  const resend = document.getElementById('otpResendBtn');
  if(resend) resend.innerHTML = T('OTP फिर भेजें', 'Resend OTP') + ' &#8635;';
  document.querySelectorAll('#loginBackBtn2, #loginStep2 .back-btn, #loginStep3 .back-btn').forEach(function(b){
    if(b) b.innerHTML = T('&larr; वापस', '&larr; Back');
  });
  // Role step
  const rh = document.getElementById('loginRoleHeading');
  if(rh) rh.textContent = T('आप कौन हैं?', 'Who are you?');
  const rs = document.getElementById('loginRoleSub');
  if(rs) rs.textContent = T('अपनी भूमिका चुनें', 'Choose your role');
  const rm = document.getElementById('loginRoleMgrSub');
  if(rm) rm.textContent = T('मैं एक Manager हूं — अपनी team बनाना चाहता/चाहती हूं', 'I am a Manager — I manage my team');
  const rmem = document.getElementById('loginRoleMemSub');
  if(rmem) rmem.textContent = T('मैं एक Member हूं — अपने Manager की team में शामिल हूं', "I am a Member — I join my Manager's team");
  const learn = document.getElementById('loginLearnTitle');
  if(learn) learn.textContent = lang === 'hi' ? 'सीखें — Learn Now' : 'Learn Now';
  const pwa = document.getElementById('loginPwaLabel');
  if(pwa) pwa.textContent = lang === 'hi' ? 'App Install करें / Download App' : 'Install App / Download App';
}

function applyLang(){
  try{ applyLoginLang(); }catch(e){}
  const isEn = (_lang !== 'hi');
  const lang = _lang || 'hi';

  // HTML lang + RTL dir (Arabic / Urdu)
  try{
    var rtl = (lang === 'ar' || lang === 'ur');
    document.documentElement.setAttribute('lang', lang || 'en');
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.body && document.body.setAttribute('data-lang', lang || 'en');
    if(typeof loadLangFont==='function') loadLangFont(lang);
  }catch(e){}
  // i18n debug: highlight missing translations
  try{
    if(localStorage.getItem('mp_i18n_debug') === '1' && typeof _translateDOM === 'function'){
      setTimeout(function(){
        document.querySelectorAll('[data-i18n]').forEach(function(el){
          var k = el.getAttribute('data-i18n');
          var tr = typeof t === 'function' ? t(k) : k;
          if(tr === k && lang !== 'hi') el.classList.add('i18n-miss');
          else el.classList.remove('i18n-miss');
        });
      }, 100);
    }
  }catch(e){}
  // Multi-lang: hi keeps Hindi chrome; everything else uses selected language (fallback en).
  // Toggle button label
  const btn = document.getElementById('langToggleBtn');
  if(btn){
    const flag = ({IN:'🇮🇳',GULF:'🌴',CN:'🇨🇳',EU:'🇪🇺',AM:'🌎',SEA:'🌏'})[_country]||'🌐';
    btn.textContent = flag+(_lang==='hi'?' हिं':' '+String(_lang).toUpperCase().slice(0,2));
    btn.title = 'Country / Language';
  }

  // Header brand
  const brand = document.querySelector('.hdr-brand');
  if(brand) brand.innerHTML = L('<span>MP</span> Man Power','<span>MP</span> Man Power');

  // Sync row
  const syncLbl = document.getElementById('syncLabel');
  if(syncLbl) syncLbl.textContent = (typeof mlT==='function') ? mlT('लाइव', lang) : (L('लाइव','Live'));

  // Section status heading
  const secTitle = document.getElementById('homeSectionTitle');
  if(secTitle) secTitle.textContent = (lang === 'hi')
    ? 'आज की स्थिति — सेक्शन वार'
    : "Today's Status — By Section";

  // Learn bar
  const learnTitle = document.getElementById('learnBarTitle');
  if(learnTitle) learnTitle.textContent = (typeof mlT==='function') ? mlT('सीखें & Grow करें', lang) : (L('सीखें & Grow करें','Learn & Grow'));

  // Home stat labels
  const statMap = {
    'dayStatLbl':  {hi:'दिन शिफ्ट', en:'Day Shift'},
    'nightStatLbl':{hi:'रात शिफ्ट', en:'Night Shift'},
    'leaveStatLbl':{hi:'छुट्टी पर',  en:'On Leave'}
  };
  Object.entries(statMap).forEach(([id,txt])=>{
    const el = document.getElementById(id);
    if(el) el.textContent = (typeof mlLabel==='function') ? mlLabel(txt, lang) : (_lang==='hi' ? txt.hi : txt.en);
  });

  // ── Page titles ──
  const pageTitleMap = {
    'pageTitleMyShift':       {hi:'मेरी शिफ्ट',          en:'My Shift'},
    'pageTitleLeaves':        {hi:'अवकाश (Leaves)',     en:'Leaves'},
    'pageTitleReports':       {hi:'रिपोर्ट',             en:'Reports'},
    'pageTitlePending':       {hi:'अनुमोदन पेंडिंग',    en:'Approval Pending'},
    'pageTitleTeam':          {hi:'टीम',                  en:'Team'},
    'pageTitleInstructions':  {hi:'महत्वपूर्ण निर्देश',  en:'Important Instructions'}
  };
  Object.entries(pageTitleMap).forEach(([id,txt])=>{
    const el = document.getElementById(id);
    if(el) el.textContent = (typeof mlLabel==='function') ? mlLabel(txt, lang) : (_lang==='hi' ? txt.hi : txt.en);
  });
  // Force English (or non-Hindi) chrome on nav buttons if rebuild hasn't run yet
  try{
    if(lang !== 'hi'){
      document.querySelectorAll('#mainNav .nb, #sideNav .nb, #navMoreSheet button').forEach(function(btn){
        var id = (btn.id||'').replace(/^nb-/, '');
        var map = {home:'Home',myshift:'My Shift',schedule:'Schedule',leave:'Leave',reports:'Reports',resign:'Resign',todo:'To-Do',pending:'Pending',team:'Team',more:'More'};
        if(map[id]){
          var span = btn.querySelector('span:last-child');
          if(span && span.className !== 'nb-ico') span.textContent = map[id];
          else {
            var spans = btn.querySelectorAll('span');
            if(spans.length>=2) spans[spans.length-1].textContent = map[id];
          }
        }
      });
    }
  }catch(e){}


  // ── Schedule admin buttons ──
  const schedBtnMap = {
    'schedBuildBtn':       {hi:'📋 शेड्यूल बनाएं',      en:'📋 Create Schedule'},
    'printBtn':            {hi:'🖨️ प्रिंट',              en:'🖨️ Print'},
    'excelBtn':            {hi:'📥 एक्सेल डाउनलोड',       en:'📥 Download Excel'},
    'uploadSchedBtn':      {hi:'📤 शेड्यूल अपलोड',     en:'📤 Upload Schedule'},
    'empUploadBtn':        {hi:'📤 Shift Upload',         en:'📤 Shift Upload'},
    'empUploadWizardBtn':  {hi:'👤 Emp Upload',           en:'👤 Emp Upload'},
    'empReorderBtn':       {hi:'↕️ क्रम बदलें',         en:'↕️ Reorder'},
    'customRangeBtn':      {hi:'🗓️ कस्टम तारीख', en:'🗓️ Custom dates'},
  };
  Object.entries(schedBtnMap).forEach(([id,txt])=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = (typeof mlLabel==='function') ? mlLabel(txt, lang) : (_lang==='hi' ? txt.hi : txt.en);
  });
  try{
    const cr = document.getElementById('customRangeBtn');
    if(cr){
      cr.textContent = '🗓️';
      cr.setAttribute('title', L('कस्टम तारीख चुनें','Pick custom dates'));
    }
  }catch(e){}

  // Multi-Select button (special — has dynamic states)
  const msBtn = document.getElementById('msToggleBtn');
  if(msBtn && !(typeof _msActive !== 'undefined' && _msActive)){
    msBtn.textContent = L('☑️ Multi-Select','☑️ Multi-Select');
  }

  // Page titles & static chips
  const pageMap = {
    pageTitleLeaves: {hi:'अवकाश (Leaves)', en:'Leaves'},
    pageTitleTeam: {hi:'टीम', en:'Team'},
  };
  Object.entries(pageMap).forEach(([id,txt])=>{
    const el=document.getElementById(id);
    if(el) el.textContent = (typeof mlLabel==='function') ? mlLabel(txt, lang) : (_lang==='hi' ? txt.hi : txt.en);
  });
  // Leave filter chips
  document.querySelectorAll('#tab-leave .chip, [onclick*="setLF"]').forEach(el=>{
    const raw=(el.textContent||'').trim();
    if(!raw) return;
    if(isEn){ const tr=typeof t==='function'?t(raw):raw; if(tr!==raw) el.textContent=tr; }
  });
  // Save bar
  const saveTitle=document.getElementById('saveBarTitle');
  if(saveTitle) saveTitle.textContent = L('📝 बदलाव pending हैं','📝 Changes pending');
  document.querySelectorAll('#schedSaveBar button').forEach(el=>{
    const raw=(el.textContent||'').trim();
    if(isEn && typeof t==='function'){ const tr=t(raw); if(tr!==raw) el.textContent=tr; }
  });
  // Multi-select cancel
  document.querySelectorAll('.ms-cancel').forEach(el=>{
    el.textContent = L('✕ रद्द करें · Cancel','✕ Cancel');
  });

  // ── All "सभी" / "All" filter chips ──
  document.querySelectorAll('[data-i18n-all]').forEach(el => {
    el.textContent = (typeof mlT==='function') ? mlT('सभी', lang) : (L('सभी','All'));
  });

  // ── Cell tap legend in Schedule Builder if open ──
  const sbLegend = document.getElementById('sbCellLegend');
  if(sbLegend) sbLegend.textContent = L('Cell tap करें: D → N → O → L → G → CO → ½ → Ab → साफ','Cell tap: D → N → O → L → G → CO → ½ → Ab → clear');

  // Re-render home if on home tab — wait for it to finish, then re-walk DOM
  if(typeof _currentTab !== 'undefined' && _currentTab === 'home'){
    try{
      const r = renderHome();
      if(r && typeof r.then === 'function'){
        r.then(()=>{ try{ _translateDOM(); }catch(e){} });
      }
    }catch(e){}
  }

  // ── PHASE 3: DOM walker — translate ALL text nodes & placeholders ──
  // Only runs when a translation function exists
  if(typeof _translateDOM === 'function'){
    try{ _translateDOM(); }catch(e){ console.warn('[i18n] DOM walk failed:', e); }
  }
}

/**
 * _translateDOM() — walks the DOM and translates:
 *   - Text nodes (only when their full trimmed text matches a dictionary key)
 *   - Input/textarea placeholders
 *   - Button title attributes
 *
 * Smart caching: stores Hindi original in data-i18n-orig.
 * - If current text matches a Hindi key → cache it as original
 * - If current text matches an English value → look up Hindi key and cache that
 * This way, regardless of which language app loads in, the Hindi original is correct.
 */
let _i18n_EN_HI = null;
function _buildReverseDict(){
  if(_i18n_EN_HI) return _i18n_EN_HI;
  _i18n_EN_HI = {};
  for(const [hi, en] of Object.entries(_i18n_HI_EN)){
    if(!_i18n_EN_HI[en]) _i18n_EN_HI[en] = hi;
  }
  return _i18n_EN_HI;
}

function _translateDOM(){
  if(typeof _i18n_HI_EN !== 'object' && typeof _i18n_ML !== 'object') return;
  const lang = (typeof _lang !== 'undefined') ? _lang : 'hi';
  const enToHi = (typeof _buildReverseDict === 'function') ? _buildReverseDict() : {};

  // Reverse map: never index 1–2 char values.
  // Italian "A" (from Hindi "तक (To)") was matching the A-shift badge and
  // rewriting it to English "To".
  const mlReverse = {};
  if(typeof _i18n_ML === 'object'){
    Object.keys(_i18n_ML).forEach(hi=>{
      const m = _i18n_ML[hi];
      if(!m) return;
      Object.keys(m).forEach(l=>{
        const val = m[l];
        if(!val || String(val).trim().length < 3) return;
        if(!mlReverse[val]) mlReverse[val] = hi;
      });
    });
  }

  function resolveHi(text){
    if(!text) return null;
    if(typeof _i18n_HI_EN === 'object' && _i18n_HI_EN[text]) return text;
    if(typeof _i18n_ML === 'object' && _i18n_ML[text]) return text;
    if(enToHi[text]) return enToHi[text];
    if(mlReverse[text]) return mlReverse[text];
    return null;
  }

  function translateKey(hiKey){
    if(!hiKey) return hiKey;
    if(lang === 'hi') return hiKey;
    if(typeof mlT === 'function'){
      const v = mlT(hiKey, lang);
      if(v !== hiKey) return v;
    }
    if(typeof _i18n_HI_EN === 'object' && _i18n_HI_EN[hiKey]) return _i18n_HI_EN[hiKey];
    return hiKey;
  }

  const SELECTOR = 'button, .chip, .nb, .submit-btn, .act-btn, .sched-admin-btn, .big-btn, .back-btn, label, h1, h2, h3, h4, .modal-title, .page-title, .empty-text, .stat-lbl, .sec-name, .lc-title, .lc-sub, .pc-nav-lbl, span, div, p, td, th, option';
  const nodes = document.querySelectorAll(SELECTOR);
  const SHIFT_TOKEN = /^(A|B|C|D|N|O|L|G|GP|Ab|H|OD|HLF|½|CO|C\/O)$/;
  nodes.forEach(el => {
    if(el.children.length > 0) return;
    if(el.classList && (el.classList.contains('shc') || el.classList.contains('ms-day-sh'))) return;
    if(el.dataset && (el.dataset.noI18n === '1' || el.dataset.shift)) return;
    const current = (el.textContent || '').trim();
    if(!current) return;
    if(SHIFT_TOKEN.test(current)) return;

    let hiOrig = el.dataset.i18nOrig;
    if(hiOrig){
      // Self-heal: cached value might be English or another language
      const healed = resolveHi(hiOrig);
      if(healed && healed !== hiOrig){
        hiOrig = healed;
        el.dataset.i18nOrig = hiOrig;
      }
    }
    if(!hiOrig){
      hiOrig = resolveHi(current);
      if(!hiOrig) return;
      el.dataset.i18nOrig = hiOrig;
    }

    const target = translateKey(hiOrig);
    if(current !== target){
      el.textContent = el.textContent.replace(current, target);
    }
  });

  // Translate placeholder attributes
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    const current = el.getAttribute('placeholder') || '';
    if(!current) return;
    let hiOrig = el.dataset.i18nPh;
    if(hiOrig){
      const healed = resolveHi(hiOrig);
      if(healed && healed !== hiOrig){
        hiOrig = healed;
        el.dataset.i18nPh = hiOrig;
      }
    }
    if(!hiOrig){
      hiOrig = resolveHi(current);
      if(!hiOrig) return;
      el.dataset.i18nPh = hiOrig;
    }
    const target = translateKey(hiOrig);
    if(current !== target) el.setAttribute('placeholder', target);
  });
}
setTimeout(applyLang, 200);
function isAdmin(){
  if(SESSION.role==='admin') return true;
  // OTP hard-admin phones always treated as Admin even if mobileUsers had another role
  if(SESSION.mobile && typeof _isHardAdminPhone==='function' && _isHardAdminPhone(SESSION.mobile)) return true;
  if(SESSION.uid && typeof _isHardAdminPhone==='function' && _isHardAdminPhone(SESSION.uid)) return true;
  return false;
}
function _isHardAdminPhone(mobile){
  const key = (typeof _normMobileKey==='function')
    ? _normMobileKey(mobile)
    : String(mobile||'').replace('+91','').replace(/[^0-9]/g,'');
  if(!key) return false;
  const list = (CFG.hardAdminPhones||[]).map(p =>
    (typeof _normMobileKey==='function') ? _normMobileKey(p) : String(p||'').replace('+91','').replace(/[^0-9]/g,'')
  );
  return list.includes(key);
}

function isMgr(){ 
  if(SESSION.role==='admin') return false;
  if(SESSION.role==='manager') return true; // new mobile self-registration Manager
  const emp = myEmp();
  return emp && (emp.accessLevel==='manager' || emp.sec==='MGR' || emp.designation==='Manager');
}
function isSupervisor(){
  if(SESSION.role==='admin') return false;
  const emp = myEmp();
  return emp && (emp.accessLevel==='supervisor' || emp.designation==='Supervisor');
}
function isAdminOrMgr(){ return isAdmin() || isMgr(); }

/** Banner when Manager has not added any team members yet */
function _managerEmptyTeamHtml(){
  if(!(SESSION.role==='manager' || (typeof isMgr==='function' && isMgr()))) return '';
  const n = (typeof getEmps==='function' ? getEmps() : []).filter(e=>e.status!=='resigned'&&e.status!=='left').length;
  if(n > 0) return '';
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  return `<div class="hm-empty" style="margin:10px 12px;padding:14px;border-radius:12px;border:1px dashed rgba(249,115,22,.45);background:rgba(249,115,22,.08);text-align:left">
    <div style="font-weight:900;color:var(--text);margin-bottom:4px">${en?'Your team is empty':'आपकी Team अभी खाली है'}</div>
    <div style="font-size:12px;color:var(--muted2);line-height:1.5">${en
      ? 'Managers only see staff they add. Open <b>Team</b> → <b>Add employee</b>. This is not a data loss bug.'
      : 'Manager को सिर्फ वही कर्मचारी दिखते हैं जिन्हें वे खुद जोड़ते हैं। <b>Team</b> → <b>नया कर्मचारी जोड़ें</b>। यह data loss नहीं है।'}</div>
  </div>`;
}

function isGuest(){ return SESSION.role==='guest'; }
/** Team Member waiting for Manager approval — limited app access */
function isPendingMember(){
  return SESSION.role==='member' && (SESSION.pendingApproval===true || SESSION.status==='pending');
}


/** Team authorization levels (set by Manager on each member) */
function _myEmployeeRecord(){
  try{
    if(SESSION.empObjId){
      const e = (_cache.employees||[]).find(x=>x.id===SESSION.empObjId);
      if(e) return e;
    }
    const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(mob) return (_cache.employees||[]).find(x=>_normMobileKey(x.phone||x.mobile||'')===mob) || null;
  }catch(e){}
  return null;
}
function myTeamPerms(){
  if(isAdmin() || isMgr()) return { schedule:true, leave:true, reports:true, team:true, pending:true, full:true };
  const e = _myEmployeeRecord();
  const p = (e && e.perms) || {};
  return {
    schedule: !!p.schedule,
    leave: !!p.leave,
    reports: !!p.reports,
    // Pending tab: leave approvers + explicit pending delegate tick if ever stored
    pending: !!(p.pending || p.leave),
    team: false,
    full: false
  };
}
/** Manager of this team OR delegated schedule rights */
function canEditSchedule(){ if(isPendingMember()) return false; return isAdmin() || isMgr() || myTeamPerms().schedule; }
/** Approve leave for team */
function canApproveLeave(){ return isAdmin() || isMgr() || myTeamPerms().leave; }
/** File/act on reports about members */
function canManageReports(){ return isAdmin() || isMgr() || myTeamPerms().reports; }
/** Legacy: many UI spots use isAdminOrMgr — include delegates for operational tools */
function isTeamOperator(){ return isAdmin() || isMgr() || myTeamPerms().schedule || myTeamPerms().leave || myTeamPerms().reports; }
function canEditInst(){ return isAdmin() || SESSION.name===CFG.supervisorInstructor || isMgr(); }
/** True if this employee record is the logged-in manager (same mobile) */
function isManagerSelfRecord(emp){
  if(!emp || !isMgr()) return false;
  const mine = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const theirs = _normMobileKey(emp.phone||emp.mobile||'');
  if(mine && theirs && mine === theirs) return true;
  if(SESSION.empObjId && emp.id === SESSION.empObjId) return true;
  return false;
}
function myEmp(){
  const own = (typeof _findOwnEmployeeRecord==='function') ? _findOwnEmployeeRecord() : null;
  if(own) return own;
  if(SESSION.empObjId) return (_cache.employees||[]).find(e=>e.id===SESSION.empObjId)||null;
  return null;
}

async function _unlinkMobileUserOnLeave(emp){
  try{
    if(!emp) return;
    const mob = _normMobileKey(emp.phone||emp.mobile||'');
    if(!mob || mob.length<10) return;
    await fbUpdate('mobileUsers/'+mob, {
      status: 'left_team',
      managerId: null,
      leftAt: new Date().toISOString(),
      leftReason: emp.status||'removed',
      // Remove old member identity so next login never shows this name
      name: '',
      empId: null,
      empCode: null,
      empObjId: null,
      employeeId: null
    });
  }catch(e){ console.warn('[unlinkMobile]', e); }
}


// ── DEVICE FINGERPRINT ──
function getDeviceId(){
  try{
    let did = localStorage.getItem('mp_device_id');
    if(!did){
      // Generate unique device fingerprint
      const nav = window.navigator;
      const screen = window.screen;
      const fp = [
        nav.userAgent, nav.language, screen.width, screen.height,
        screen.colorDepth, new Date().getTimezoneOffset(),
        nav.hardwareConcurrency||'', nav.platform||''
      ].join('|');
      // Simple hash
      let hash = 0;
      for(let i=0;i<fp.length;i++){ hash = ((hash<<5)-hash)+fp.charCodeAt(i); hash|=0; }
      did = 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
      try{ localStorage.setItem('mp_device_id', did); }catch(e){}
    }
    return did;
  }catch(e){
    // localStorage completely blocked (private browsing, WebView, etc.)
    const nav = window.navigator;
    const screen = window.screen;
    const fp = [nav.userAgent||'', nav.language||'', screen.width||0, screen.height||0, Date.now()].join('|');
    let hash = 0;
    for(let i=0;i<fp.length;i++){ hash = ((hash<<5)-hash)+fp.charCodeAt(i); hash|=0; }
    return 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  }
}


// ══════════════════════════════════════════════════════════════
// CACHE INTEGRITY — ties session to app cache installation
// If user clears app cache/files, session is automatically invalidated.
// Token lives in CacheStorage which is cleared with app cache.
// localStorage/cookies survive cache clear — this bridges the gap.
// ══════════════════════════════════════════════════════════════
const INTEGRITY_CACHE_NAME = 'mp-integrity';
const INTEGRITY_TOKEN_URL  = '/integrity-token';

// Write integrity token into CacheStorage — called at login
async function writeIntegrityToken(){
  if(!('caches' in window)) return;
  try{
    const cache = await caches.open(INTEGRITY_CACHE_NAME);
    await cache.put(INTEGRITY_TOKEN_URL, new Response('1', {
      headers: { 'Content-Type': 'text/plain' }
    }));
  }catch(e){ console.warn('[integrity] write failed:', e); }
}

// Check if token exists in CacheStorage
// Returns: true = token found (cache intact), false = cache was cleared
async function checkIntegrityToken(){
  if(!('caches' in window)) return true; // browser doesn't support CacheStorage — allow
  try{
    const cache = await caches.open(INTEGRITY_CACHE_NAME);
    const resp  = await cache.match(INTEGRITY_TOKEN_URL);
    return !!resp;
  }catch(e){ return true; } // on error, allow — don't block user
}

// Full cache-integrity boot check:
// Simplified: If session exists but cache was cleared → wipe session → show login
// NEVER throws — always recovers gracefully
async function enforceIntegrityOnBoot(){
  try{
    // No session = nothing to protect
    const hasSession = !!(localStorage.getItem('mp_session') ||
                          sessionStorage.getItem('mp_session_bak') ||
                          document.cookie.match(/mp_sess=([^;]+)/));
    if(!hasSession){
      // Clean state — remove stale integrity flags
      try{ localStorage.removeItem('mp_int_ok'); }catch(e){}
      return;
    }

    const tokenOk = await checkIntegrityToken();

    if(!tokenOk){
      // Token missing — common after SW cache version bump (old caches deleted).
      // Keep the user logged in and re-write the token. Only real "Clear site data"
      // wipes localStorage session too; that path already has no session above.
      console.warn('[integrity] Token missing — re-binding session (no logout)');
      await writeIntegrityToken();
      localStorage.setItem('mp_int_ok','1');
      return;
    } else {
      localStorage.setItem('mp_int_ok','1');
    }
  }catch(e){
    if(e.message === 'INTEGRITY_FAIL') throw e;
    // Any other error — allow boot safely, never black screen
    console.warn('[integrity] check error (allowing boot):', e);
  }
}

// ── Helper: Clear all session data synchronously ──
function _clearAllSessionData(){
  try{ localStorage.removeItem('mp_session'); }catch(e){}
  try{ localStorage.removeItem('mp_int_ok'); }catch(e){}
  try{ localStorage.removeItem('fp_registered'); }catch(e){}
  try{ sessionStorage.removeItem('mp_session_bak'); }catch(e){}
  try{ sessionStorage.removeItem('expiry_warned'); }catch(e){}
  document.cookie = 'mp_sess=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  SESSION = { role:'', name:'', empId:'', empObjId:'', dept:'', deviceId:'' };
  try{
    const req = indexedDB.open('mp_db', 1);
    req.onsuccess = ev => {
      try{
        const db = ev.target.result;
        if(Array.from(db.objectStoreNames).includes('sess')){
          db.transaction('sess','readwrite').objectStore('sess').delete('mp_session');
        }
        db.close();
      }catch(x){}
    };
  }catch(e){}
}

// ── Helper: Show login screen safely — NEVER leaves black screen ──
function _showLoginScreenSafely(){
  try{
    var ls=document.getElementById('loadingScreen');
    if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
    var ew=document.getElementById('hardExpiryWall'); if(ew) ew.remove();
    var pb=document.getElementById('pendingBox'); if(pb) pb.style.display='none';
    var fp=document.getElementById('fingerprintScreen');
    if(fp){ fp.style.display='none'; fp.classList.remove('show'); }
    var mh=document.getElementById('mainHdr'); if(mh) mh.style.display='none';
    var mc=document.getElementById('mainContent'); if(mc) mc.style.display='none';
    var login=document.getElementById('loginScreen');
    if(login){
      login.style.cssText='display:flex!important;position:fixed;inset:0;z-index:500;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 20px 40px;overflow:auto;background:linear-gradient(160deg,#070c15 0%,#0d1623 45%,#130a24 100%);';
      login.classList.add('show');
    }
    if(typeof showStep==='function') try{ showStep(1); }catch(e){}
  }catch(e){ console.error('_showLoginScreenSafely', e); }
}

// ── 45-DAY HARD EXPIRY ──
// First login sets a 1-year (365-day) timer in Firebase (device-independent)
// After expiry: app locked until Admin extends validity

async function checkUserExpiry(){
  const empId = SESSION.empObjId || SESSION.empId;
  if(!empId) return { valid:true, daysLeft:365 }; // Guest / admin

  try{
    // Check Firebase for expiry (cross-device)
    const approval = await fbGet('deviceApprovals/' + empId);
    if(!approval) return { valid:true, daysLeft:365 }; // New user — 1 year default until record exists
    
    const validTill = new Date(approval.validTill);
    const now = new Date();
    const daysLeft = Math.ceil((validTill - now) / 86400000);
    
    return { valid: daysLeft > 0, daysLeft: Math.max(0, daysLeft), expiry: approval.validTill };
  } catch(e){
    return { valid:true, daysLeft:365 };
  }
}

function showHardExpiry(){
  // Completely lock the app — but only if expiry wall DOM can be created
  // Safety: never hide content without showing the expiry wall
  try{
  document.getElementById('mainHdr').style.display = 'none';
  document.getElementById('mainContent').style.display = 'none';
  
  const expiryWall = document.createElement('div');
  expiryWall.id = 'hardExpiryWall';
  expiryWall.innerHTML = `
    <div style="position:fixed;inset:0;background:var(--bg);z-index:9998;
      display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center">
      <div style="font-size:64px;margin-bottom:14px">🔒</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;
        background:linear-gradient(135deg,#f97316,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px">
        ACCESS EXPIRED
      </div>
      <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:8px">Access validity समाप्त हो गई</div>
      <div style="font-size:13px;color:var(--muted2);margin-bottom:20px;line-height:1.7">
        आपकी App access समाप्त हो गई है।<br>
        दोबारा access के लिए Manager से<br>
        संपर्क करें।
      </div>
      <div style="background:var(--lvbg);border:1px solid rgba(244,63,94,.3);border-radius:14px;
        padding:16px 20px;margin-bottom:20px;width:100%;max-width:300px">
        <div style="font-size:13px;font-weight:800;color:var(--lv)">'+((CFG&&CFG.contactManagerName)||'Manager')+'</div>
        <a href="tel:+918168771239" style="text-decoration:none">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:1px;margin-top:4px">
            +91 8168771239
          </div>
        </a>
      </div>
      <a href="tel:+918168771239" style="text-decoration:none;width:100%;max-width:300px">
        <button class="big-btn" style="background:linear-gradient(135deg,var(--green),#15803d);box-shadow:0 4px 20px rgba(34,197,94,.3)">
          📞 Manager को Call करें
        </button>
      </a>
      <button onclick="doLogout()" 
        style="margin-top:10px;background:none;border:1px solid var(--border2);border-radius:10px;
        color:var(--muted);padding:12px 24px;cursor:pointer;font-size:13px;width:100%;max-width:300px">
        🔄 दूसरे Account से Login करें
      </button>
    </div>`;
  document.body.appendChild(expiryWall);
  }catch(ex){
    // DOM error — just reload to login
    console.error('showHardExpiry error:', ex);
    location.reload();
  }
}

async function extendUserExpiry(empId, daysOrDate){
  // daysOrDate: number of days OR ISO/date string YYYY-MM-DD
  let validTill;
  if(typeof daysOrDate === 'string' && daysOrDate.length >= 8 && /\d{4}-\d{2}-\d{2}/.test(daysOrDate)){
    const d = new Date(daysOrDate);
    d.setHours(23,59,59,999);
    validTill = d.toISOString();
  } else {
    const days = parseInt(daysOrDate, 10) || 365;
    validTill = new Date(Date.now() + days*86400000).toISOString();
  }
  try{
    if(typeof _ensureWriteAuth === 'function') await _ensureWriteAuth();
    await fbUpdate('deviceApprovals/' + empId, {
      validTill,
      extendedBy: SESSION.name || 'admin',
      extendedAt: new Date().toISOString(),
      daysGranted: daysOrDate
    });
    try{
      const emp = (_cache.employees||[]).find(e=>e.id===empId) || (getEmps()||[]).find(e=>e.id===empId);
      const mob = _normMobileKey(emp && (emp.phone||emp.mobile));
      if(mob) await fbUpdate('mobileUsers/'+mob, { validTill, accessExtendedAt: new Date().toISOString(), extendedBy: SESSION.name||'admin' });
    }catch(e2){}
    toast('✅ Validity set to '+new Date(validTill).toLocaleDateString('en-IN'));
    return true;
  }catch(e){
    console.error('[extendUserExpiry]', e);
    toast(L('❌ Extend failed: ','❌ Extend failed: ')+(e.message||e)+L(' — Admin re-login (OTP/password) try करें',' — try Admin re-login (OTP/password)'));
    return false;
  }
}

// ── DEVICE CHECK via FIREBASE ──
async function checkDeviceApproval(empId){
  try {
    const approval = await fbGet('deviceApprovals/' + empId);
    if(!approval) return { status:'new' };
    const thisDevice = getDeviceId();
    if(approval.approvedDeviceId === thisDevice){
      // Same device - check validity
      const expDate = new Date(approval.validTill);
      if(expDate > new Date()) return { status:'approved', approval };
      return { status:'expired' };
    } else {
      return { status:'different_device', approval };
    }
  } catch(e){ return { status:'new' }; }
}

function encodeSession(obj){ 
  // Base64 encode to prevent casual reading
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); 
}
function decodeSession(str){ 
  try{ return JSON.parse(decodeURIComponent(escape(atob(str)))); }catch(e){ return null; } 
}
function saveSession(){ 
  if(!SESSION.loginAt) SESSION.loginAt = new Date().toISOString();
  const encoded = encodeSession(SESSION);
  // Save in multiple places for maximum persistence
  try{ localStorage.setItem('mp_session', encoded); }catch(e){}
  try{ sessionStorage.setItem('mp_session_bak', encoded); }catch(e){}
  // Cookie backup — expires in 45 days
  try{
    const exp = new Date();
    exp.setDate(exp.getDate()+45);
    document.cookie = 'mp_sess='+encoded+';expires='+exp.toUTCString()+';path=/;SameSite=Lax';
  }catch(e){}
  // IndexedDB backup for iPhone ITP
  try{
    const req = indexedDB.open('mp_db', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('sess');
    req.onsuccess = e => {
      try{
        const tx = e.target.result.transaction('sess','readwrite');
        tx.objectStore('sess').put(encoded, 'mp_session');
      }catch(ex){}
    };
  }catch(e){}
}

function loadSession(){
  try{ 
    // 1. Try localStorage
    let s = localStorage.getItem('mp_session');
    // 2. Fallback: sessionStorage
    if(!s) s = sessionStorage.getItem('mp_session_bak');
    // 3. Fallback: Cookie
    if(!s){
      const match = document.cookie.match(/mp_sess=([^;]+)/);
      if(match) s = match[1];
    }
    if(s){ 
      const d=decodeSession(s); 
      if(d && d.role){ 
        SESSION=d; 
        // Re-save to localStorage if it was missing
        try{ localStorage.setItem('mp_session', s); }catch(e){}
        return true; 
      } 
    }
  }catch(e){}
  return false;
}

// Load session from IndexedDB (iPhone ITP fallback) — async
function loadSessionFromIDB(){
  return new Promise(resolve=>{
    try{
      const req = indexedDB.open('mp_db',1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('sess');
      req.onsuccess = e => {
        try{
          const tx = e.target.result.transaction('sess','readonly');
          const getReq = tx.objectStore('sess').get('mp_session');
          getReq.onsuccess = () => {
            const s = getReq.result;
            if(s){
              const d = decodeSession(s);
              if(d && d.role){
                SESSION = d;
                try{ localStorage.setItem('mp_session', s); }catch(ex){}
                resolve(true); return;
              }
            }
            resolve(false);
          };
          getReq.onerror = () => resolve(false);
        }catch(ex){ resolve(false); }
      };
      req.onerror = () => resolve(false);
    }catch(e){ resolve(false); }
  });
}

// ══ 45-DAY AUTO LOGOUT ══
function check45DayLogout(){
  try{
    const s = localStorage.getItem('mp_session');
    if(!s) return;
    const sess = decodeSession(s);
    if(!sess || !sess.loginAt || sess.role==='admin') return;
    
    const loginDate = new Date(sess.loginAt);
    const now = new Date();
    const daysDiff = Math.floor((now - loginDate)/(1000*60*60*24));
    
    if(daysDiff >= 45){
      // Clear all session storage
      _clearAllSessionData();
      // Show login screen safely
      _showLoginScreenSafely();
      return;
    }
    // Warn 5 days before
    if(daysDiff >= 40 && !sessionStorage.getItem('expiry_warned')){
      sessionStorage.setItem('expiry_warned','1');
      setTimeout(()=> toast(L('⚠️ Session ','⚠️ Session ')+(45-daysDiff)+L(' दिन में expire होगा',' days until session expires')), 3000);
    }
  }catch(e){ console.log('45day check error:',e); }
}

function showExpiryWarning(daysLeft){
  if(daysLeft <= 7 && daysLeft > 0){
    setTimeout(()=>{
      toast(L('⚠️ आपकी App access ','⚠️ Your app access expires in ') + daysLeft + L(' दिनों में expire होगी!',' days!'));
    }, 2000);
  }
}

// ════════════════════════════════════════
// EXPIRY
// ════════════════════════════════════════
// License: unlock hashes are ONLY in Firebase settings/license (not in client bundle).
// settings/license shape: { validTill: ISO, unlockHashes: { master: 'sha256...', extend: 'sha256...' }, extendTo: ISO }
let _licenseFbCache = null;
let _licenseFbCheckedAt = 0;

async function _loadLicenseFromFirebase(force){
  const now = Date.now();
  if(!force && _licenseFbCache && (now - _licenseFbCheckedAt) < 60000) return _licenseFbCache;
  try{
    const lic = await fbGet('settings/license');
    _licenseFbCache = lic || null;
    _licenseFbCheckedAt = now;
    return _licenseFbCache;
  }catch(e){
    console.warn('[license] Firebase read failed', e && e.message);
    return _licenseFbCache; // last known
  }
}

function checkLicense(){
  // Sync path used at boot — uses local unlock flag + soft client expiry fallback.
  // Async re-check runs in startApp via refreshLicenseFromServer().
  try{
    const unlock = localStorage.getItem('mp_license_unlock')||'';
    const verified = localStorage.getItem('mp_license_verified')==='1';
    if(unlock && verified){
      // Previously verified against Firebase — allow offline until async refresh
      const ext = localStorage.getItem('mp_license_extend')==='1';
      if(ext) CFG.license.expiry = CFG.license.extendTo;
      return true;
    }
  }catch(e){}
  const now=new Date();now.setHours(0,0,0,0);
  const exp=new Date(CFG.license.expiry);exp.setHours(0,0,0,0);
  const diff=Math.floor((exp-now)/86400000);
  if(diff<0){
    const el=document.getElementById('expiryScreen');
    if(el) el.classList.add('show');
    return false;
  }
  return true;
}

async function refreshLicenseFromServer(){
  const lic = await _loadLicenseFromFirebase(true);
  if(!lic) return checkLicense();
  try{
    if(lic.validTill){
      const vt = new Date(lic.validTill);
      if(!isNaN(vt.getTime())) CFG.license.expiry = vt;
    }
    if(lic.extendTo){
      const et = new Date(lic.extendTo);
      if(!isNaN(et.getTime())) CFG.license.extendTo = et;
    }
    const unlock = localStorage.getItem('mp_license_unlock')||'';
    const hashes = lic.unlockHashes || {};
    const masterH = hashes.master || hashes.masterKey || '';
    const extendH = hashes.extend || hashes.extendKey || '';
    if(unlock && (unlock === masterH || unlock === extendH)){
      localStorage.setItem('mp_license_verified','1');
      if(unlock === extendH){
        localStorage.setItem('mp_license_extend','1');
        CFG.license.expiry = CFG.license.extendTo;
      }
      const el=document.getElementById('expiryScreen');
      if(el) el.classList.remove('show');
      return true;
    }
    // Server validTill still in future → ok without unlock key
    const now=new Date(); now.setHours(0,0,0,0);
    const exp=new Date(CFG.license.expiry); exp.setHours(0,0,0,0);
    if(exp >= now){
      const el=document.getElementById('expiryScreen');
      if(el) el.classList.remove('show');
      return true;
    }
    const el=document.getElementById('expiryScreen');
    if(el) el.classList.add('show');
    return false;
  }catch(e){
    console.warn('[license] refresh error', e);
    return checkLicense();
  }
}

async function tryUnlock(){
  const k=(document.getElementById('unlockKey').value||'').trim();
  if(!k){ toast(L('❌ Key डालें','❌ Enter key')); return; }
  const kh = await hashPass(k);
  let lic = await _loadLicenseFromFirebase(true);
  const hashes = (lic && lic.unlockHashes) || {};
  const masterH = hashes.master || hashes.masterKey || '';
  const extendH = hashes.extend || hashes.extendKey || '';
  if(!masterH && !extendH){
    toast(L('❌ License server config missing — Admin Firebase में settings/license सेट करें','❌ License server config missing — Admin must set settings/license in Firebase'));
    return;
  }
  if(kh===masterH || kh===extendH){
    if(kh===extendH){
      CFG.license.expiry = CFG.license.extendTo;
      try{ localStorage.setItem('mp_license_extend','1'); }catch(e){}
      if(lic && lic.extendTo){
        try{ await fbUpdate('settings/license', { validTill: new Date(lic.extendTo).toISOString() }); }catch(e){}
      }
    }
    try{
      localStorage.setItem('mp_license_unlock', kh);
      localStorage.setItem('mp_license_verified','1');
    }catch(e){}
    const el=document.getElementById('expiryScreen');
    if(el) el.classList.remove('show');
    toast(L('✅ अनलॉक हो गया','✅ Unlocked'));
  } else { toast(L('❌ गलत Key','❌ Wrong key')); }
}
