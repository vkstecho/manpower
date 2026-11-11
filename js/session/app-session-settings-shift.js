/* Man Power — Shift settings modal (split from app-session-settings.js v5.1.0) */
/* ensure refund days label */
async function _mpEnsureCareCache(){try{if(!window._customerCareCache&&typeof _loadCustomerCare==='function')window._customerCareCache=await _loadCustomerCare(false);}catch(e){}}
/**
 * Man Power — extracted module (v3.2.6+)
 * Split from app-login-session.js for maintainability.
 * Global function names unchanged — load order matters (see index.html).
 */
async function openShiftSettings(){
  try{ await _loadWaAppLinkSettings(); }catch(e){}

  if(isAdmin() && (!SESSION.viewCompanyId || SESSION.viewCompanyId==='ALL')){
    toast(L('⚠️ पहले header से एक Company चुनें','⚠️ Select a company from the header first'));
    return;
  }
  toast('⏳ Loading...');
  const cfg=await getShiftConfig();
  _shiftDraft=JSON.parse(JSON.stringify(cfg)); // deep clone for editing
  _renderShiftSettingsModal();
}

function _renderShiftSettingsModal(){
  const d=_shiftDraft;
  // Merge standard D,N,A,B,C — preserve active/times from saved config
  const std = [
    {code:'D', label:'Day Shift', start:'08:00', end:'20:00', active:true, kind:'work'},
    {code:'N', label:'Night Shift', start:'20:00', end:'08:00', active:true, kind:'work'},
    {code:'A', label:'A Shift', start:'06:00', end:'14:00', active:false, kind:'work'},
    {code:'B', label:'B Shift', start:'14:00', end:'22:00', active:false, kind:'work'},
    {code:'C', label:'C Shift', start:'22:00', end:'06:00', active:false, kind:'work'},
    {code:'O', label:'Weekly Off', start:'', end:'', active:true, kind:'status'},
    {code:'L', label:'Leave', start:'', end:'', active:true, kind:'status'},
    {code:'G', label:'General Shift', start:'08:00', end:'20:00', active:true, kind:'work'},
    {code:'C/O', label:'Comp Off', start:'', end:'', active:true, kind:'status'},
    {code:'HLF', label:'Half Day', start:'', end:'', active:true, kind:'status'},
    {code:'Ab', label:'Absent', start:'', end:'', active:true, kind:'status'},
    {code:'H', label:'Holiday', start:'', end:'', active:true, kind:'status'},
    {code:'OD', label:'Other Dept', start:'', end:'', active:true, kind:'status'},
    {code:'GP', label:'Gate Pass', start:'', end:'', active:true, kind:'status'}
  ];
  const byCode = {};
  (d.shifts||[]).forEach(s=>{ if(s && s.code) byCode[String(s.code).toUpperCase()]=s; });
  // Also match Ab / C/O case variants
  const _getPrev = (code)=>{
    const u = String(code).toUpperCase();
    if(byCode[u]) return byCode[u];
    if(u==='C/O' && byCode['CO']) return byCode['CO'];
    if(u==='AB' && byCode['AB']) return byCode['AB'];
    return null;
  };
  const hadAnyActive = (d.shifts||[]).some(s=>s && s.active===true);
  const savedCodes = new Set(Object.keys(byCode));
  // When UI language is English, map known Hindi default labels → English
  const _langEn = (typeof _lang !== 'undefined' && _lang && String(_lang).toLowerCase() !== 'hi');
  const _hiToEnLabel = {
    'दिन शिफ्ट':'Day Shift','दिन':'Day Shift','दिन (7AM-7PM)':'Day Shift',
    'रात शिफ्ट':'Night Shift','रात':'Night Shift','रात (7PM-7AM)':'Night Shift',
    'साप्ताहिक छुट्टी':'Weekly Off','साप्ताहिक अवकाश':'Weekly Off',
    'लीव':'Leave','छुट्टी':'Leave','जनरल':'General Shift','जनरल शिफ्ट':'General Shift',
    'कम्प ऑफ':'Comp Off','हाफ डे':'Half Day','अनुपस्थित':'Absent','हॉलिडे':'Holiday',
    'अन्य विभाग':'Other Dept','गेट पास':'Gate Pass'
  };
  d.shifts = std.map(s=>{
    const prev = _getPrev(s.code);
    let active = s.active;
    if(prev){
      if(prev.active===true || prev.active===false) active = !!prev.active;
      else if(!hadAnyActive && savedCodes.size && s.kind==='work') active = savedCodes.has(String(s.code).toUpperCase());
    }
    let label = (prev && prev.label) || s.label;
    if(_langEn && label){
      const mapped = _hiToEnLabel[String(label).trim()];
      if(mapped) label = mapped;
      // pure Devanagari default for D/N → English std
      else if(/[\u0900-\u097F]/.test(String(label)) && (s.code==='D'||s.code==='N'||s.code==='O'||s.code==='L'||s.code==='G')){
        label = s.label;
      }
    }
    return {
      code: s.code,
      label: label,
      start: (prev && prev.start) || s.start,
      end: (prev && prev.end) || s.end,
      active,
      kind: s.kind || 'work'
    };
  });
  if(d.minAll==null) d.minAll = 4;
  if(d.minMet==null) d.minMet = 5;
  if(d.minSlit==null) d.minSlit = 3;
  if(d.minSup==null) d.minSup = 2;
  if(!d.minBySec || typeof d.minBySec !== 'object') d.minBySec = {};
  if(!d.minByField || typeof d.minByField !== 'object') d.minByField = { section:{}, machine:{}, responsibility:{}, designation:{} };
  ['section','machine','designation','responsibility'].forEach(k=>{ if(!d.minByField[k]) d.minByField[k]={}; });
  if(!d.minFieldActive || typeof d.minFieldActive !== 'object'){
    d.minFieldActive = { section:true, machine:false, responsibility:false, designation:false };
  }
  ['section','machine','designation','responsibility'].forEach(k=>{
    if(d.minFieldActive[k] == null) d.minFieldActive[k] = (k === 'section');
  });
  // Ensure each machine has an entry (default from group min) — legacy
  (d.metallisers||[]).forEach(m=>{ if(d.minBySec[m]==null) d.minBySec[m]=d.minMet; });
  (d.slitters||[]).forEach(m=>{ if(d.minBySec[m]==null) d.minBySec[m]=d.minSlit; });
    // Seed type-wise WA templates from defaults if missing
  const _d0 = _defaultShiftConfig();
  if(!d.waShiftTemplate) d.waShiftTemplate = _d0.waShiftTemplate;
  if(!d.waLeaveTemplate) d.waLeaveTemplate = _d0.waLeaveTemplate;
  if(!d.waAbsentTemplate) d.waAbsentTemplate = _d0.waAbsentTemplate;
  if(!d.waGPTemplate) d.waGPTemplate = _d0.waGPTemplate;
  if(!d.waHolidayTemplate) d.waHolidayTemplate = _d0.waHolidayTemplate;
  if(!d.waCOffTemplate) d.waCOffTemplate = _d0.waCOffTemplate;
  if(d.gpMaxPerMonth==null) d.gpMaxPerMonth = 2;
  if(d.waMemberLeaveToMgrEnabled==null) d.waMemberLeaveToMgrEnabled = true;
  if(d.waMemberShiftToMgrEnabled==null) d.waMemberShiftToMgrEnabled = true;
  if(!d.waMemberLeaveToMgrTemplate) d.waMemberLeaveToMgrTemplate = _d0.waMemberLeaveToMgrTemplate;
  if(!d.waMemberShiftToMgrTemplate) d.waMemberShiftToMgrTemplate = _d0.waMemberShiftToMgrTemplate;
  if(d.waNotifyOnSave==null) d.waNotifyOnSave = true;
  if(d.waShiftEnabled==null) d.waShiftEnabled = true;
  if(d.waLeaveEnabled==null) d.waLeaveEnabled = true;
  if(d.waAbsentEnabled==null) d.waAbsentEnabled = true;
  if(d.waGPEnabled==null) d.waGPEnabled = true;
  if(d.waHolidayEnabled==null) d.waHolidayEnabled = true;
  if(d.waCOffEnabled==null) d.waCOffEnabled = true;
d.shiftCount = d.shifts.filter(s=>s.active).length;
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">⚙️ ${L('शिफ्ट व मिन स्टाफ़','Shift & Min Staff')}</div>
  <div style="font-size:12px;color:#94a3b8;margin-bottom:14px">
    ${isAdmin()?'Company: <b style="color:var(--text)">'+(SESSION.viewCompanyId||'').toUpperCase()+'</b>':'For your own team'}
  </div>

  <div class="modal-scroll-body">
  <div style="font-size:12px;font-weight:800;color:#f97316;margin:4px 0 6px">⏰ Shifts — for Auto Schedule</div>
  <div style="font-size:11px;color:#64748b;margin-bottom:10px;line-height:1.5">
    ✅ <b>Work shifts</b> tick = Auto Schedule rotate + legend.<br>
    ✅ <b>Status legends</b> (O L CO Ab ½ H GP…) tick = keyboard, picker & schedule legend.<br>
    ${L('Manager अपने team के लिए नाम और visibility बदल सकता है।','Manager can change names and visibility for their own team.')}
  </div>
  <div id="ss_shiftTimings">${_renderShiftTimingRows()}</div>
  <div style="font-size:11px;color:#64748b;margin:8px 0 14px;line-height:1.45">
    ✅ Ticked shifts only → legend, daily counts, Auto Schedule, and shift picker.<br>
    Unticked codes are hidden everywhere on Schedule.
  </div>

  <div style="font-size:12px;font-weight:800;color:#a78bfa;margin:4px 0 6px">🔄 Auto Schedule — Rotation Sequence</div>
  <div style="font-size:11px;color:#64748b;margin-bottom:8px;line-height:1.5">
    Your team only. After each Weekly Off, Auto moves to the <b>next code in this order</b>.
    Type codes in the boxes below (e.g. A → D → B → C).
  </div>
  <div style="margin-bottom:14px;padding:12px;border-radius:12px;border:1px solid rgba(167,139,250,.35);background:rgba(167,139,250,.06)">
    <div style="font-size:10px;font-weight:700;color:#7c3aed;margin-bottom:8px;text-transform:uppercase;letter-spacing:.03em">Your sequence</div>
    <div id="ss_rotSeqWrap" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;min-height:48px;margin-bottom:10px"></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;margin-bottom:6px">
      <span style="font-size:10px;color:#94a3b8;width:100%;text-align:center;margin-bottom:2px">Quick fill (optional)</span>
      <button type="button" onclick="_ssRotSeqPreset('sequential')" style="width:auto;padding:6px 10px;font-size:11px;font-weight:700;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">A→B→C→D</button>
      <button type="button" onclick="_ssRotSeqPreset('plant')" style="width:auto;padding:6px 10px;font-size:11px;font-weight:700;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">A→D→C→B</button>
      <button type="button" onclick="_ssRotSeqPreset('adb')" style="width:auto;padding:6px 10px;font-size:11px;font-weight:700;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer">A→D→B→C</button>
      <button type="button" onclick="_ssRotSeqAddBox()" style="width:auto;padding:6px 10px;font-size:11px;font-weight:700;border-radius:8px;border:1px dashed #a78bfa;background:rgba(167,139,250,.1);color:#7c3aed;cursor:pointer">+ box</button>
      <button type="button" onclick="_ssRotSeqRemoveBox()" style="width:auto;padding:6px 10px;font-size:11px;font-weight:700;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:#94a3b8;cursor:pointer">− box</button>
    </div>
    <div style="font-size:10px;color:#94a3b8;line-height:1.4;text-align:center">
      Examples: <b>A,B,C</b> · <b>A,C,B</b> · <b>A,D,B,C</b> · <b>D,N</b><br>
      Only ticked work shifts are used by Auto Schedule.
    </div>
  </div>

  <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:8px 0 6px">📉 Minimum Staff — Auto Schedule &amp; warnings</div>
  <div style="font-size:11px;color:#64748b;margin-bottom:10px;line-height:1.5">
    Set min headcount per Excel value (e.g. Xsec, Yres). <b>0 = skip</b> that value.<br>
    Toggle a type <b>OFF</b> so Auto Schedule does not use it for errors.<br>
    Example: only Responsibility ON + min for Xres → only Xres gaps are reported.
  </div>
  <div style="margin-bottom:12px;max-width:160px">
    <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Default for All chip (whole team overview)</div>
    <input type="number" min="0" max="50" value="${d.minAll!=null?d.minAll:4}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" oninput="_shiftDraft.minAll=Number(this.value)||0">
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    ${(()=>{
      const labels={section:'Department',machine:'Machine',designation:'Designation',responsibility:'Responsibility'};
      const colors={section:'#f97316',machine:'#38bdf8',responsibility:'#a78bfa',designation:'#4ade80'};
      if(!_shiftDraft.minFieldActive) _shiftDraft.minFieldActive={section:true,machine:false,responsibility:false,designation:false};
      return ['section','machine','designation','responsibility'].map(k=>{
        const checked = !!_shiftDraft.minFieldActive[k];
        const c = colors[k];
        return '<label style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;border:1.5px solid '+(checked?c:'var(--border2)')+';background:'+(checked?c+'22':'var(--card)')+';cursor:pointer;font-size:12px;font-weight:800;color:'+(checked?c:'#94a3b8')+'">'+
          '<input type="checkbox" '+(checked?'checked':'')+' style="width:16px;height:16px" onchange="if(!_shiftDraft.minFieldActive)_shiftDraft.minFieldActive={};_shiftDraft.minFieldActive.'+k+'=this.checked;const box=this.closest(\'label\');if(box){box.style.borderColor=this.checked?\''+c+'\':\'var(--border2)\';box.style.background=this.checked?\''+c+'22\':\'var(--card)\';box.style.color=this.checked?\''+c+'\':\'#94a3b8\';}"> '+
          labels[k]+'</label>';
      }).join('');
    })()}
  </div>
  <div style="font-size:11px;font-weight:800;color:#f97316;margin:8px 0 6px">Departments <span style="font-weight:600;color:#64748b">(0 = skip this value)</span></div>
  <div id="ss_minSections" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('section')}</div>
  <div style="font-size:11px;font-weight:800;color:#38bdf8;margin:8px 0 6px">Machines <span style="font-weight:600;color:#64748b">(0 = skip this value)</span></div>
  <div id="ss_minMachines" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('machine')}</div>
  <div style="font-size:11px;font-weight:800;color:#a78bfa;margin:8px 0 6px">Responsibility <span style="font-weight:600;color:#64748b">(0 = skip this value)</span></div>
  <div id="ss_minResp" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('responsibility')}</div>
  <div style="font-size:11px;font-weight:800;color:#4ade80;margin:8px 0 6px">Designation <span style="font-weight:600;color:#64748b">(0 = skip this value)</span></div>
  <div id="ss_minDesig" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">${_renderDynamicMinRows('designation')}</div>


  <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border2)">
    <div style="font-size:13px;font-weight:900;color:#f97316;margin-bottom:6px">🏢 ${L('Company Logo (केवल आपकी team)','Company Logo (your team only)')}</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px;line-height:1.45">
      ${L('यह logo सिर्फ आपके login और आपकी team को दिखेगा — दूसरे Manager को नहीं।','Shown only for your login and your team — not other Managers.')}
    </div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">
      <div id="ss_logoPreview" style="width:72px;height:72px;border-radius:12px;border:1.5px solid var(--border2);background:var(--card);display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${d.companyLogo ? `<img src="${d.companyLogo}" alt="logo" style="max-width:100%;max-height:100%;object-fit:contain"/>` : '<span style="font-size:11px;color:var(--muted2)">No logo</span>'}
      </div>
      <div style="flex:1;min-width:160px">
        <input type="file" id="ss_logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="font-size:12px;max-width:100%" onchange="handleCompanyLogoFile(this)"/>
        <div style="font-size:10px;color:var(--muted2);margin-top:4px">PNG / JPG / WebP · max ~150 KB after compress</div>
        <button type="button" onclick="clearCompanyLogo()" style="margin-top:6px;padding:6px 10px;border-radius:8px;border:1px solid rgba(244,63,94,.4);background:rgba(244,63,94,.08);color:var(--lv);font-size:11px;font-weight:700;cursor:pointer">${L('Logo हटाएँ','Remove logo')}</button>
      </div>
    </div>
  </div>

  <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border2)">
    <div style="font-size:13px;font-weight:900;color:#25D366;margin-bottom:6px">📲 WhatsApp templates (your team)</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:12px;line-height:1.45">
      ${L('अपनी team के लिए messages customise करें। App notification हमेशा चालू रहती है। Placeholders message भेजते समय अपने आप भर जाते हैं।','Customise messages for your team. In-app notifications always stay on. Placeholders are replaced automatically when the message is sent.')}
    </div>

    <!-- ══ Member → Manager ══ -->
    <div style="font-size:12px;font-weight:800;color:#25D366;margin:4px 0 8px">📩 Member → Manager</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25)">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text)">🏖️ Leave request → Manager</div>
        <div style="font-size:11px;color:var(--muted2)">${L('Member leave Save → आपको WhatsApp','Member Save leave → WhatsApp to you')}</div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#25D366">
        <input type="checkbox" id="ss_waMemLeaveOn" ${d.waMemberLeaveToMgrEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Leave request WhatsApp ON"> ON
      </label>
    </div>
    <textarea id="ss_waMemLeaveTpl" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Leave request template">${(d.waMemberLeaveToMgrTemplate||_d0.waMemberLeaveToMgrTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:12px">{name} {dates} {date} {leaveType} {reason} {days}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25)">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text)">📅 Shift change → Manager</div>
        <div style="font-size:11px;color:var(--muted2)">${L('Member shift request → आपको WhatsApp','Member requests shift change → WhatsApp to you')}</div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#25D366">
        <input type="checkbox" id="ss_waMemShiftOn" ${d.waMemberShiftToMgrEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Shift change WhatsApp ON"> ON
      </label>
    </div>
    <textarea id="ss_waMemShiftTpl" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Shift change request template">${(d.waMemberShiftToMgrTemplate||_d0.waMemberShiftToMgrTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:14px">{name} {date} {currentShift} {newShift}</div>

    <!-- ══ Manager → Team (schedule save) ══ -->
    <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:8px 0 8px">📢 Manager → Team (Schedule Save)</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px;line-height:1.45">
      ${L('जब आप shift बदलकर Save करते हैं, members को WhatsApp जा सकता है। Message type mark किए गए code पर निर्भर (L / Ab / GP / H / C-Off / सामान्य shift)।','When you change shifts and Save, each member can get WhatsApp. Message type depends on what you marked (L / Ab / GP / H / C-Off / general shift).')}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.25)">
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text)">📢 Notify team on Save</div>
        <div style="font-size:11px;color:var(--muted2)">${L('सभी Manager→Team WhatsApp का master switch','Master switch for all Manager→Team WhatsApp')}</div>
      </div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8">
        <input type="checkbox" id="ss_waNotifyOnSave" ${d.waNotifyOnSave!==false?'checked':''} style="width:18px;height:18px" aria-label="Notify team on schedule save"> ON
      </label>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🔔 General shift change</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waShiftOn" ${d.waShiftEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply general shift template"> ON
      </label>
    </div>
    <textarea id="ss_waTemplate" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="General shift change template">${(d.waShiftTemplate||_d0.waShiftTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {changes} {manager} {date}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🏖️ Leave (L)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waLeaveOn" ${d.waLeaveEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply leave template"> ON
      </label>
    </div>
    <textarea id="ss_waLeave" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Leave template">${(d.waLeaveTemplate||_d0.waLeaveTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {dates} {date} {manager}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">⚠️ Absent (Ab)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waAbsentOn" ${d.waAbsentEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply absent template"> ON
      </label>
    </div>
    <textarea id="ss_waAbsent" rows="6" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Absent template">${(d.waAbsentTemplate||_d0.waAbsentTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {dates} {date} {manager}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🪪 Gate Pass (GP)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waGPOn" ${d.waGPEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply Gate Pass template"> ON
      </label>
    </div>
    <textarea id="ss_waGP" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Gate Pass template">${(d.waGPTemplate||_d0.waGPTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:6px">{name} {dates} {date} {manager} {gpCount} {gpMax}</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;max-width:200px">
      <div style="font-size:11px;color:var(--muted2);white-space:nowrap">${L('Max GP / महीना','Max GP / month')}</div>
      <input type="number" id="ss_gpMax" min="1" max="31" value="${d.gpMaxPerMonth!=null?d.gpMaxPerMonth:(_d0.gpMaxPerMonth||2)}" style="width:72px;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" aria-label="Max Gate Pass per month">
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🎉 Holiday (H)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waHolidayOn" ${d.waHolidayEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply holiday template"> ON
      </label>
    </div>
    <textarea id="ss_waHoliday" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Holiday template">${(d.waHolidayTemplate||_d0.waHolidayTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:10px">{name} {dates} {date} {manager}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;margin:8px 0 6px;background:var(--card2);border:1px solid var(--border2)">
      <div style="font-size:12px;font-weight:800;color:var(--text)">🔄 Comp Off (C/O)</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:800;color:#38bdf8;flex-shrink:0">
        <input type="checkbox" id="ss_waCOffOn" ${d.waCOffEnabled!==false?'checked':''} style="width:18px;height:18px" aria-label="Apply Comp Off template"> ON
      </label>
    </div>
    <textarea id="ss_waCOff" rows="5" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;font-family:inherit;margin-bottom:6px;resize:vertical" aria-label="Comp Off template">${(d.waCOffTemplate||_d0.waCOffTemplate||'').replace(/`/g,"'")}</textarea>
    <div style="font-size:10px;color:var(--muted2);margin-bottom:8px">{name} {date} {manager} {coffDate} {reason}</div>
  </div>

  </div>
  <div class="modal-sticky-actions">
    <button class="submit-btn" onclick="_saveShiftSettings()" aria-label="Save shift settings">✅ Save करें</button>
    <button class="cancel-btn" onclick="closeModal()" aria-label="Cancel">${L('रद्द करें','Cancel')}</button>
  </div>`);
  setTimeout(function(){ try{ if(typeof _ssRotSeqInit==='function') _ssRotSeqInit(); }catch(e){} }, 50);
}


// Global so inline oninput/onblur on shift time fields can update _shiftDraft
window._mpNormTime24 = function(v){
  v = String(v||'').trim();
  if(!v) return '';
  var m = v.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if(!m) return v;
  return (m[1].length===1?'0':'')+m[1]+':'+m[2];
};
window._mpOnTime24Input = function(el){
  var v = String(el.value||'').replace(/[^0-9:]/g,'').slice(0,5);
  if(v.length===2 && v.indexOf(':')<0) v = v+':';
  el.value = v;
  return v;
};

function _renderShiftTimingRows(){
  const isWorkCode = (code)=>['D','N','A','B','C'].includes(String(code||'').toUpperCase())
  const isTimedCode = (code)=>['D','N','A','B','C','G'].includes(String(code||'').toUpperCase())

  var _normTime24 = window._mpNormTime24;
  var _onTime24Input = window._mpOnTime24Input;
  let html = '';
  html += `<div style="font-size:11px;font-weight:800;color:#f97316;margin:0 0 6px">⏰ ${L('कार्य शिफ्ट','Work shifts')} (D/N/A/B/C/G)</div>`;
  (_shiftDraft.shifts||[]).forEach((s,i)=>{
    if(!isTimedCode(s.code)) return;
    html += `<div style="margin-bottom:10px;padding:10px;border-radius:12px;border:1px solid var(--border);background:${s.active!==false?'rgba(34,197,94,.06)':'var(--card2)'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0" title="On = Auto + legend + picker + keyboard">
          <input type="checkbox" ${s.active!==false?'checked':''} style="width:16px;height:16px;accent-color:#22c55e"
            onchange="_shiftDraft.shifts[${i}].active=this.checked;document.getElementById('ss_shiftTimings').innerHTML=_renderShiftTimingRows()">
          <span style="width:32px;height:24px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:11px" class="shc ${cellClass(s.code)}">${escHtml(s.code)}</span>
        </label>
        <input type="text" value="${escHtml(s.label)}" style="flex:1;min-width:0;padding:8px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px;box-sizing:border-box" oninput="_shiftDraft.shifts[${i}].label=this.value">
      </div>
      <div style="display:flex;align-items:center;gap:8px;width:100%">
        <input type="text" inputmode="numeric" placeholder="HH:MM" maxlength="5" value="${s.start||''}" title="Start 24-hour HH:MM" style="flex:1;min-width:0;width:0;padding:10px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;text-align:center;box-sizing:border-box" oninput="_shiftDraft.shifts[${i}].start=_mpOnTime24Input(this)" onblur="var v=_mpNormTime24(this.value);this.value=v;_shiftDraft.shifts[${i}].start=v;this.style.borderColor=(v&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))?'#ef4444':''">
        <span style="color:#64748b;font-size:12px;font-weight:700;flex-shrink:0">to</span>
        <input type="text" inputmode="numeric" placeholder="HH:MM" maxlength="5" value="${s.end||''}" title="End 24-hour HH:MM" style="flex:1;min-width:0;width:0;padding:10px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;text-align:center;box-sizing:border-box" oninput="_shiftDraft.shifts[${i}].end=_mpOnTime24Input(this)" onblur="var v=_mpNormTime24(this.value);this.value=v;_shiftDraft.shifts[${i}].end=v;this.style.borderColor=(v&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))?'#ef4444':''">
      </div>
    </div>`;
  });
  html += `<div style="font-size:11px;font-weight:800;color:#a855f7;margin:12px 0 6px">📋 ${L('स्टेटस / लेजेंड','Status / Legends')} (O L CO ½ Ab H OD GP)</div>`;
  html += `<div style="font-size:10px;color:#64748b;margin-bottom:8px;line-height:1.4">${L('टिक = Schedule मेनू, कीबोर्ड और लेजेंड में दिखेगा। नाम बदल सकते हैं।','Tick = show in schedule menu, keyboard & legend. Labels are editable.')}</div>`;
  (_shiftDraft.shifts||[]).forEach((s,i)=>{
    if(isTimedCode(s.code)) return;
    html += `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;padding:8px;border-radius:10px;border:1px solid var(--border);background:${s.active!==false?'rgba(168,85,247,.08)':'var(--card2)'}">
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0">
        <input type="checkbox" ${s.active!==false?'checked':''} style="width:16px;height:16px;accent-color:#a855f7"
          onchange="_shiftDraft.shifts[${i}].active=this.checked;document.getElementById('ss_shiftTimings').innerHTML=_renderShiftTimingRows()">
        <span style="width:36px;height:24px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:11px" class="shc ${cellClass(s.code)}">${escHtml(s.code==='HLF'?'½':s.code)}</span>
      </label>
      <input type="text" value="${escHtml(s.label)}" style="flex:1;min-width:80px;padding:7px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px" oninput="_shiftDraft.shifts[${i}].label=this.value">
      <span style="font-size:10px;color:#94a3b8">${L('टाइप','type')} <b>${escHtml(s.code)}</b></span>
    </div>`;
  });
  return html;
}

function _renderMinBySecRows(){
  if(!_shiftDraft.minBySec) _shiftDraft.minBySec = {};
  const machines = [...(_shiftDraft.metallisers||[]), ...(_shiftDraft.slitters||[])];
  // unique preserve order
  const seen = new Set();
  const list = [];
  machines.forEach(m=>{ const k=String(m||'').trim(); if(k && !seen.has(k)){ seen.add(k); list.push(k); } });
  if(!list.length){
    return `<div style="grid-column:1/-1;font-size:11px;color:#94a3b8">Add machines below — min fields will appear here.</div>`;
  }
  return list.map(m=>{
    const val = (_shiftDraft.minBySec[m]!=null) ? _shiftDraft.minBySec[m] : 0;
    return `<div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">${m}</div>
      <input type="number" min="0" max="50" value="${val}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center"
        oninput="if(!_shiftDraft.minBySec)_shiftDraft.minBySec={};_shiftDraft.minBySec['${m.replace(/'/g,"\'")}']=Number(this.value)||0">
    </div>`;
  }).join('');
}

function _renderDynamicMinRows(kind){
  if(!_shiftDraft.minByField || typeof _shiftDraft.minByField!=='object') _shiftDraft.minByField={};
  if(!_shiftDraft.minByField[kind]) _shiftDraft.minByField[kind]={};
  const vals = (typeof _teamFieldValues==='function') ? _teamFieldValues(kind) : [];
  if(!vals.length){
    return '<div style="grid-column:1/-1;font-size:11px;color:#64748b;padding:8px">'+(typeof L==='function'?L('अभी कोई value नहीं — Team Excel upload करें','No values yet — upload Team Excel first'):'No values yet — upload Team Excel first')+'</div>';
  }
  return vals.map(v=>{
    const cur = _shiftDraft.minByField[kind][v];
    const n = (cur!=null && cur!=='') ? (Number(cur)||0) : 0; // 0 = not enforced
    const esc = String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    const keyEsc = String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<div><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+esc+'">'+esc+(n>0?' <span style="color:#4ade80">· check</span>':' <span style="color:#64748b">· skip</span>')+'</div>'+
      '<input type="number" min="0" max="50" value="'+n+'" style="width:100%;padding:8px;border-radius:8px;border:1px solid '+(n>0?'rgba(74,222,128,.5)':'var(--border2)')+';background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" '+
      'oninput="if(!_shiftDraft.minByField) _shiftDraft.minByField={}; if(!_shiftDraft.minByField.'+kind+') _shiftDraft.minByField.'+kind+'={}; _shiftDraft.minByField.'+kind+'[\''+keyEsc+'\']=Number(this.value)||0"></div>';
  }).join('');
}

function _renderMachineRows(field){
  return _shiftDraft[field].map((m,i)=>`
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <input type="text" value="${m}" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:12px" oninput="_shiftDraft.${field}[${i}]=this.value">
      <button onclick="_removeMachine('${field}',${i})" style="width:32px;height:32px;border-radius:8px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.08);color:#f43f5e;font-size:14px;cursor:pointer">✕</button>
    </div>`).join('');
}

function _onShiftCountChange(val){
  // Legacy no-op: all managers always have D,N,A,B,C; only times are edited in profile settings
  if(document.getElementById('ss_shiftTimings')){
    document.getElementById('ss_shiftTimings').innerHTML=_renderShiftTimingRows();
  }
}

function _addMachine(field){
  const prefix=field==='metallisers'?'Metalliser-':'Slitter-';
  const name = prefix+(_shiftDraft[field].length+1);
  _shiftDraft[field].push(name);
  if(!_shiftDraft.minBySec) _shiftDraft.minBySec = {};
  if(_shiftDraft.minBySec[name]==null){
    _shiftDraft.minBySec[name] = field==='metallisers' ? (Number(_shiftDraft.minMet)||0) : (Number(_shiftDraft.minSlit)||0);
  }
  document.getElementById('ss_'+field).innerHTML=_renderMachineRows(field);
  const minEl = document.getElementById('ss_minBySec');
  if(minEl) minEl.innerHTML = _renderMinBySecRows();
}
function _removeMachine(field,idx){
  const removed = _shiftDraft[field][idx];
  _shiftDraft[field].splice(idx,1);
  if(removed && _shiftDraft.minBySec) delete _shiftDraft.minBySec[removed];
  document.getElementById('ss_'+field).innerHTML=_renderMachineRows(field);
  const minEl = document.getElementById('ss_minBySec');
  if(minEl) minEl.innerHTML = _renderMinBySecRows();
}

async function _saveShiftSettings(){
  // v2.4.1: multi-industry — do not require legacy metallisers/slitters lists
  // Min staff comes from Team Excel sections/machines via minByField
  if(!_shiftDraft.metallisers) _shiftDraft.metallisers = [];
  if(!_shiftDraft.slitters) _shiftDraft.slitters = [];
  for(const s of _shiftDraft.shifts){
    if(!s.code||!s.label){ toast(L('⚠️ सभी Shift की Code और नाम भरें','⚠️ Fill code and name for every shift')); return; }
  }
  const activeCount = (_shiftDraft.shifts||[]).filter(s=>s.active!==false).length;
  const workActive=(_shiftDraft.shifts||[]).filter(s=>s.active!==false&&['D','N','A','B','C'].includes(String(s.code||'').toUpperCase())).length; if(workActive < 1){ toast(L('⚠️ कम से कम 1 कार्य shift tick करें (D/N/A/B/C)','⚠️ Tick at least 1 work shift (D/N/A/B/C)')); return; }
  _shiftDraft.shiftCount = activeCount;
  try{
    // Read custom rotation sequence from boxes
    if(typeof window._ssRotSeqRead==='function'){
      const seq = window._ssRotSeqRead();
      if(seq && seq.length){
        _shiftDraft.autoRotationSequence = seq;
        _shiftDraft.autoRotationMode = 'custom';
      }
    }
    const m = String(_shiftDraft.autoRotationMode||'custom').toLowerCase();
    if(m!=='custom' && m!=='sequential' && m!=='plant'){
      _shiftDraft.autoRotationMode = 'custom';
    }
  }catch(e){ /* keep existing sequence */ }
  _shiftDraft.minAll = Number(_shiftDraft.minAll)||0;
  _shiftDraft.minMet = Number(_shiftDraft.minMet)||0;
  _shiftDraft.minSlit = Number(_shiftDraft.minSlit)||0;
  _shiftDraft.minSup = Number(_shiftDraft.minSup)||0;
  if(!_shiftDraft.minFieldActive || typeof _shiftDraft.minFieldActive !== 'object'){
    _shiftDraft.minFieldActive = { section:true, machine:false, responsibility:false, designation:false };
  }
  if(_shiftDraft.minFieldActive.designation == null) _shiftDraft.minFieldActive.designation = false;
  if(_shiftDraft.minByField && typeof _shiftDraft.minByField === 'object'){
    ['section','machine','designation','responsibility'].forEach(k=>{
      if(!_shiftDraft.minByField[k]) _shiftDraft.minByField[k] = {};
      Object.keys(_shiftDraft.minByField[k]).forEach(v=>{
        _shiftDraft.minByField[k][v] = Math.max(0, Number(_shiftDraft.minByField[k][v])||0);
      });
    });
  }
  // Derive legacy hide flags from ticks (compat); display uses active only
  const _act = (c)=> (_shiftDraft.shifts||[]).some(s=>String(s.code).toUpperCase()===c && s.active!==false);
  _shiftDraft.hideSummaryDN = !_act('D') && !_act('N');
  _shiftDraft.hideSummaryABC = !_act('A') && !_act('B') && !_act('C');
  try{
    const onSaveEl = document.getElementById('ss_waNotifyOnSave');
    if(onSaveEl) _shiftDraft.waNotifyOnSave = !!onSaveEl.checked;
    else _shiftDraft.waNotifyOnSave = _shiftDraft.waNotifyOnSave !== false;
    const memLeaveOn = document.getElementById('ss_waMemLeaveOn');
    if(memLeaveOn) _shiftDraft.waMemberLeaveToMgrEnabled = !!memLeaveOn.checked;
    const memShiftOn = document.getElementById('ss_waMemShiftOn');
    if(memShiftOn) _shiftDraft.waMemberShiftToMgrEnabled = !!memShiftOn.checked;
    const memLeaveTpl = document.getElementById('ss_waMemLeaveTpl');
    if(memLeaveTpl) _shiftDraft.waMemberLeaveToMgrTemplate = memLeaveTpl.value;
    const memShiftTpl = document.getElementById('ss_waMemShiftTpl');
    if(memShiftTpl) _shiftDraft.waMemberShiftToMgrTemplate = memShiftTpl.value;
    const ta = document.getElementById('ss_waTemplate');
    if(ta) _shiftDraft.waShiftTemplate = ta.value;
    const map = [
      ['ss_waLeave','waLeaveTemplate'],
      ['ss_waAbsent','waAbsentTemplate'],
      ['ss_waGP','waGPTemplate'],
      ['ss_waHoliday','waHolidayTemplate'],
      ['ss_waCOff','waCOffTemplate']
    ];
    for(const [id,key] of map){
      const el = document.getElementById(id);
      if(el) _shiftDraft[key] = el.value;
    }
    const enMap = [
      ['ss_waShiftOn','waShiftEnabled'],
      ['ss_waLeaveOn','waLeaveEnabled'],
      ['ss_waAbsentOn','waAbsentEnabled'],
      ['ss_waGPOn','waGPEnabled'],
      ['ss_waHolidayOn','waHolidayEnabled'],
      ['ss_waCOffOn','waCOffEnabled']
    ];
    for(const [id,key] of enMap){
      const el = document.getElementById(id);
      if(el) _shiftDraft[key] = !!el.checked;
    }
    const gpEl = document.getElementById('ss_gpMax');
    if(gpEl) _shiftDraft.gpMaxPerMonth = Math.max(1, Number(gpEl.value)||2);
  }catch(e){}
  const _def = (typeof getDefaultShiftConfig==='function' ? getDefaultShiftConfig() : _defaultShiftConfig());
  if(!_shiftDraft.waShiftTemplate) _shiftDraft.waShiftTemplate = _def.waShiftTemplate;
  if(!_shiftDraft.waLeaveTemplate) _shiftDraft.waLeaveTemplate = _def.waLeaveTemplate;
  if(!_shiftDraft.waAbsentTemplate) _shiftDraft.waAbsentTemplate = _def.waAbsentTemplate;
  if(!_shiftDraft.waGPTemplate) _shiftDraft.waGPTemplate = _def.waGPTemplate;
  if(!_shiftDraft.waHolidayTemplate) _shiftDraft.waHolidayTemplate = _def.waHolidayTemplate;
  if(!_shiftDraft.waCOffTemplate) _shiftDraft.waCOffTemplate = _def.waCOffTemplate;
  if(!_shiftDraft.gpMaxPerMonth) _shiftDraft.gpMaxPerMonth = 2;
  if(!_shiftDraft.minBySec) _shiftDraft.minBySec = {};
  // Admin-only: persist WA app-link footer settings
  if(typeof isAdmin==='function' && isAdmin()){
    try{
      const onEl = document.getElementById('ss_waAppLinkOn');
      const tEl = document.getElementById('ss_waAppLinkText');
      const uEl = document.getElementById('ss_waAppLinkUrl');
      if(onEl || tEl || uEl){
        const payload = {
          enabled: onEl ? !!onEl.checked : true,
          text: (tEl && tEl.value.trim()) || 'Check Complete Shift',
          url: (uEl && uEl.value.trim()) || ''
        };
        await fbSet('settings/waAppLink', payload);
        _waAppLinkCache = payload;
      }
    }catch(e){ console.warn('[waAppLink] save', e); }
  }
  // Sync start/end from visible inputs (fixes draft not updating if oninput failed)
  try{
    var wrap = document.getElementById('ss_shiftTimings');
    if(wrap){
      var blocks = wrap.querySelectorAll('[data-shift-idx]');
      // fallback: pair time inputs in order of timed shifts
      var timedIdx = [];
      (_shiftDraft.shifts||[]).forEach(function(s,i){
        if(['D','N','A','B','C','G'].includes(String(s.code||'').toUpperCase())) timedIdx.push(i);
      });
      var timeInputs = wrap.querySelectorAll('input[placeholder="HH:MM"]');
      for(var ti=0; ti<timeInputs.length; ti+=2){
        var si = timedIdx[ti/2];
        if(si==null || !_shiftDraft.shifts[si]) continue;
        var st = window._mpNormTime24 ? window._mpNormTime24(timeInputs[ti].value) : String(timeInputs[ti].value||'').trim();
        var en = window._mpNormTime24 ? window._mpNormTime24(timeInputs[ti+1].value) : String(timeInputs[ti+1].value||'').trim();
        if(st) { _shiftDraft.shifts[si].start = st; _shiftDraft.shifts[si].startTime = st; }
        if(en) { _shiftDraft.shifts[si].end = en; _shiftDraft.shifts[si].endTime = en; }
      }
    }
  }catch(e){ console.warn('[shift times] DOM sync', e); }

  // Ensure G keeps user label+times in draft before save
  try{
    (_shiftDraft.shifts||[]).forEach(function(s){
      if(s && String(s.code).toUpperCase()==='G'){
        if(!s.label || String(s.label).trim()==='G') s.label='General Shift';
        s.start = s.start || s.startTime || '08:00';
        s.end = s.end || s.endTime || '20:00';
        if(s.active===undefined) s.active=true;
      }
    });
  }catch(e){}
  const ok=await saveShiftConfig(_shiftDraft);
  if(ok){
    try{ _applyCompanyLogoToUI(_shiftDraft.companyLogo||''); }catch(e){}
    try{
      if(typeof myShiftConfigKey==='function' && typeof _shiftConfigCache!=='undefined'){
        const k=myShiftConfigKey();
        const fixed = (typeof _canonicalizeShiftConfig==='function') ? _canonicalizeShiftConfig(_shiftDraft) : _shiftDraft;
        if(k) _shiftConfigCache[k]=fixed;
      }
    }catch(e){}
    closeModal();
    toast(L('✅ शिफ्ट सेटिंग सेव हो गई','✅ Shift settings saved'));
    try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
    try{ if(typeof renderScheduleLegend==='function') renderScheduleLegend(); }catch(e){}
  }
}



