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
  d.shifts = std.map(s=>{
    const prev = _getPrev(s.code);
    let active = s.active;
    if(prev){
      if(prev.active===true || prev.active===false) active = !!prev.active;
      else if(!hadAnyActive && savedCodes.size && s.kind==='work') active = savedCodes.has(String(s.code).toUpperCase());
    }
    return {
      code: s.code,
      label: (prev && prev.label) || s.label,
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
  ['section','machine','responsibility','designation'].forEach(k=>{ if(!d.minByField[k]) d.minByField[k]={}; });
  if(!d.minFieldActive || typeof d.minFieldActive !== 'object'){
    d.minFieldActive = { section:true, machine:false, responsibility:false, designation:false };
  }
  ['section','machine','responsibility','designation'].forEach(k=>{
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
    Manager अपने team के लिए नाम और visibility बदल सकता है।
  </div>
  <div id="ss_shiftTimings">${_renderShiftTimingRows()}</div>
  <div style="font-size:11px;color:#64748b;margin:8px 0 14px;line-height:1.45">
    ✅ Ticked shifts only → legend, daily counts, Auto Schedule, and shift picker.<br>
    Unticked codes are hidden everywhere on Schedule.
  </div>

  <div style="font-size:12px;font-weight:800;color:#38bdf8;margin:8px 0 6px">📉 Minimum Staff — Auto Schedule &amp; warnings</div>
  <div style="font-size:11px;color:#64748b;margin-bottom:10px;line-height:1.5">
    Set min headcount per Excel value (e.g. Xsec, Yres). <b>0 = skip</b> that value.<br>
    Toggle a type <b>OFF</b> so Auto Schedule does not use it for errors.<br>
    Example: only Responsibility ON + min for Xres → only Xres gaps are reported.
  </div>
  <div style="margin-bottom:12px;max-width:160px">
    <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Default (All filter overview)</div>
    <input type="number" min="0" max="50" value="${d.minAll!=null?d.minAll:4}" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:13px;font-weight:800;text-align:center" oninput="_shiftDraft.minAll=Number(this.value)||0">
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    ${(()=>{
      const labels={section:'Section',machine:'Machine',responsibility:'Responsibility',designation:'Designation'};
      const colors={section:'#f97316',machine:'#38bdf8',responsibility:'#a78bfa',designation:'#4ade80'};
      if(!_shiftDraft.minFieldActive) _shiftDraft.minFieldActive={section:true,machine:false,responsibility:false,designation:false};
      return ['section','machine','responsibility','designation'].map(k=>{
        const checked = !!_shiftDraft.minFieldActive[k];
        const c = colors[k];
        return '<label style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;border:1.5px solid '+(checked?c:'var(--border2)')+';background:'+(checked?c+'22':'var(--card)')+';cursor:pointer;font-size:12px;font-weight:800;color:'+(checked?c:'#94a3b8')+'">'+
          '<input type="checkbox" '+(checked?'checked':'')+' style="width:16px;height:16px" onchange="if(!_shiftDraft.minFieldActive)_shiftDraft.minFieldActive={};_shiftDraft.minFieldActive.'+k+'=this.checked;const box=this.closest(\'label\');if(box){box.style.borderColor=this.checked?\''+c+'\':\'var(--border2)\';box.style.background=this.checked?\''+c+'22\':\'var(--card)\';box.style.color=this.checked?\''+c+'\':\'#94a3b8\';}"> '+
          labels[k]+'</label>';
      }).join('');
    })()}
  </div>
  <div style="font-size:11px;font-weight:800;color:#f97316;margin:8px 0 6px">Sections <span style="font-weight:600;color:#64748b">(0 = skip this value)</span></div>
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
    return '<div style="grid-column:1/-1;font-size:11px;color:#64748b;padding:8px">No values yet — Team Excel upload करें</div>';
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
  _shiftDraft.minAll = Number(_shiftDraft.minAll)||0;
  _shiftDraft.minMet = Number(_shiftDraft.minMet)||0;
  _shiftDraft.minSlit = Number(_shiftDraft.minSlit)||0;
  _shiftDraft.minSup = Number(_shiftDraft.minSup)||0;
  if(!_shiftDraft.minFieldActive || typeof _shiftDraft.minFieldActive !== 'object'){
    _shiftDraft.minFieldActive = { section:true, machine:false, responsibility:false, designation:false };
  }
  if(_shiftDraft.minFieldActive.designation == null) _shiftDraft.minFieldActive.designation = false;
  if(_shiftDraft.minByField && typeof _shiftDraft.minByField === 'object'){
    ['section','machine','responsibility','designation'].forEach(k=>{
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



// ════════════════════════════════════════
// PROFILE EDIT — name + photo
// ════════════════════════════════════════
/** Round header avatar: photo if set, else initials; role under circle */
function updateHeaderProfile(){
  try{
    const chip = document.querySelector('.user-chip.user-chip-profile') || document.querySelector('.user-chip');
    if(chip && !chip.classList.contains('user-chip-profile')){
      chip.classList.add('user-chip-profile');
    }
    const ini = (SESSION.name||'?').split(/\s+/).filter(Boolean).map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?';
    const userAvEl = document.getElementById('userAv');
    if(userAvEl){
      userAvEl.style.background = 'linear-gradient(135deg,var(--m1,#f97316),var(--s1,#a855f7))';
      const url = SESSION.photoUrl || '';
      if(url){
        userAvEl.innerHTML = '<img src="'+String(url).replace(/"/g,'&quot;')+'" alt="">';
        userAvEl.setAttribute('data-has-photo','1');
      } else {
        userAvEl.innerHTML = '';
        userAvEl.textContent = ini;
        userAvEl.removeAttribute('data-has-photo');
      }
    }
    const hdrName = document.getElementById('userHdrName');
    if(hdrName){
      hdrName.textContent = (SESSION.name||'Guest').split(' ')[0];
      hdrName.classList.add('user-hdr-name-sr');
    }
    // Role label (short, works in all languages)
    const rt = document.getElementById('roleTag');
    if(rt){
      let role = 'USER';
      try{
        if(typeof isAdmin==='function' && isAdmin()) role = 'ADMIN';
        else if(typeof isMgr==='function' && isMgr()) role = 'MGR';
        else if(SESSION.role==='manager') role = 'MGR';
        else if(SESSION.role==='supervisor') role = 'SUP';
        else if(SESSION.role==='member' || SESSION.role==='worker') role = 'MEMBER';
        else if(SESSION.role==='guest') role = 'GUEST';
      }catch(e){}
      rt.textContent = role;
      rt.className = 'role-tag '+(role==='ADMIN'?'admin': role==='MGR'?'admin':'user');
    }
    try{
      const chip = document.querySelector('.user-chip.user-chip-profile');
      if(chip){ chip.style.display='flex'; chip.style.visibility='visible'; chip.style.opacity='1'; }
    }catch(e){}
  }catch(e){ console.warn('[updateHeaderProfile]', e); }
}

let _profilePhotoData = null;


function openEditProfileModal(){
  _profilePhotoData = null;
  const photo = SESSION.photoUrl || '';
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const emp = myEmp() || {};
  const esc = (s)=> String(s==null?'':s).replace(/"/g,'&quot;');
  const toDateInput = (v)=>{
    if(!v) return '';
    const s = String(v).trim();
    if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if(m) return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    const d = new Date(s);
    if(!isNaN(d.getTime())) return d.toISOString().slice(0,10);
    return '';
  };
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">✏️ ${L('मेरी Profile','My Profile')}</div>
    <div class="modal-scroll-body">
    <div style="text-align:center;margin-bottom:16px">
      <div id="profilePhotoPreview" style="width:96px;height:96px;border-radius:50%;margin:0 auto 10px;background:linear-gradient(135deg,#f97316,#a855f7);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff;overflow:hidden;border:3px solid rgba(249,115,22,.4)">
        ${photo?`<img src="${photo}" style="width:100%;height:100%;object-fit:cover">`:(SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2)}
      </div>
      <input type="file" id="profilePhotoInput" accept="image/*" capture="user" style="display:none" onchange="onProfilePhotoPicked(this)">
      <button type="button" class="cancel-btn" style="display:inline-flex;align-items:center;gap:6px;margin:0 4px" onclick="document.getElementById('profilePhotoInput').click()">📷 ${L('फोटो लगाएं','Set photo')}</button>
      ${photo||_profilePhotoData?`<button type="button" class="cancel-btn" style="display:inline-flex;color:#f43f5e;margin:0 4px" onclick="clearProfilePhoto()">🗑️</button>`:''}
    </div>
    <div class="field"><label>${L('नाम','Name')}</label>
      <input class="inp-field" id="profileNameInput" value="${escHtml(esc(SESSION.name||emp.name||''))}" maxlength="60"></div>
    <div class="field"><label>${L('जन्म तिथि (DOB)','Date of Birth')}</label>
      <input class="inp-field" type="date" id="profileDobInput" value="${esc(toDateInput(emp.dob||''))}"></div>
    <div class="field"><label>${L('जॉइनिंग डेट','Date of Joining')}</label>
      <input class="inp-field" type="date" id="profileDojInput" value="${esc(toDateInput(emp.joiningDate||emp.doj||''))}"></div>
    <div class="field"><label>${L('सैलरी (मासिक)','Salary (monthly)')}</label>
      <input class="inp-field" type="number" id="profileSalaryInput" value="${esc(emp.salary||emp.monthlySalary||'')}" placeholder="₹"></div>
    <div class="field"><label>${L('वीकली ऑफ','Weekly Off')}</label>
      <select class="inp-field" id="profileWoffInput">
        ${[{v:'',l:'—'},{v:'SUN',l:L('रवि (SUN)','Sunday')},{v:'MON',l:L('सोम (MON)','Monday')},{v:'TUE',l:L('मंगल (TUE)','Tuesday')},{v:'WED',l:L('बुध (WED)','Wednesday')},{v:'THU',l:L('गुरु (THU)','Thursday')},{v:'FRI',l:L('शुक्र (FRI)','Friday')},{v:'SAT',l:L('शनि (SAT)','Saturday')}].map(d=>`<option value="${d.v}" ${(emp.woff||'')===d.v?'selected':''}>${d.l}</option>`).join('')}
      </select></div>
    <div class="field"><label>${L('पद','Designation')}</label>
      <input class="inp-field" id="profileDesigInput" value="${escHtml(esc(emp.designation||''))}" maxlength="40"></div>
    <div class="field"><label>${L('Emp ID','Emp ID')}</label>
      <input class="inp-field" id="profileEmpIdInput" value="${escHtml(esc(emp.empId||SESSION.empId||''))}" maxlength="20"></div>
    <div class="field"><label>${L('सेक्शन','Section')}</label>
      <input class="inp-field" id="profileSecInput" value="${escHtml(esc(emp.sec||''))}" maxlength="40" placeholder="from Excel Section"></div>
    <div class="field"><label>${L('मशीन','Machine')}</label>
      <input class="inp-field" id="profileMcInput" value="${esc(emp.mc||emp.machine||'')}" maxlength="40"></div>
    <div class="field"><label>${L('ज़िम्मेदारी','Responsibility')}</label>
      <input class="inp-field" id="profileRespInput" value="${escHtml(esc(emp.resp||emp.responsibility||''))}" maxlength="40"></div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      ${L('Manager द्वारा भरी जानकारी यहाँ दिखती है। बदलाव पर Manager को notification जाएगी।','Details from Manager are shown here. Changes notify your Manager.')}
    </div>
    </div>
    <div class="modal-sticky-actions">
    <button class="submit-btn" onclick="saveProfileEdits()">💾 ${L('सेव + Manager को सूचित करें','Save & Notify Manager')}</button>
    <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>
    </div>`);
}

function onProfilePhotoPicked(input){
  const file = input.files && input.files[0];
  if(!file) return;
  if(file.size > 5*1024*1024){ toast('⚠️ Max 5 MB image'); return; }
  const reader = new FileReader();
  reader.onload = ()=>{
    const dataUrl = reader.result;
    // Downscale for storage
    const img = new Image();
    img.onload = ()=>{
      const max = 512;
      let w = img.width, h = img.height;
      if(w > max || h > max){
        const r = Math.min(max/w, max/h);
        w = Math.round(w*r); h = Math.round(h*r);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      _profilePhotoData = c.toDataURL('image/jpeg', 0.85);
      const prev = document.getElementById('profilePhotoPreview');
      if(prev) prev.innerHTML = `<img src="${_profilePhotoData}" style="width:100%;height:100%;object-fit:cover">`;
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function clearProfilePhoto(){
  _profilePhotoData = '';
  SESSION.photoUrl = '';
  const prev = document.getElementById('profilePhotoPreview');
  if(prev) prev.innerHTML = (SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2);
  toast('Photo cleared — Save to apply');
}

async function saveProfileEdits(){
  const name = (document.getElementById('profileNameInput')?.value||'').trim();
  if(!name){ toast('⚠️ Name required'); return; }
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(L('❌ Phone OTP verify करें — फिर Save दबाएँ','❌ Verify phone OTP — then press Save')); return; }
    }
  }catch(e){ toast('❌ Auth: '+(e.message||e)); return; }

  const dob = (document.getElementById('profileDobInput')?.value||'').trim();
  const doj = (document.getElementById('profileDojInput')?.value||'').trim();
  const salary = (document.getElementById('profileSalaryInput')?.value||'').trim();
  const woff = (document.getElementById('profileWoffInput')?.value||'').trim();
  const desig = (document.getElementById('profileDesigInput')?.value||'').trim();
    const empIdEdit = (document.getElementById('profileEmpIdInput')?.value||'').trim();
    const secEdit = (document.getElementById('profileSecInput')?.value||'').trim();
    const mcEdit = (document.getElementById('profileMcInput')?.value||'').trim();
    const respEdit = (document.getElementById('profileRespInput')?.value||'').trim();
  const btn = document.querySelector('.modal-box .submit-btn, .modal .submit-btn');
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Saving…'; }

  try{
    const empBefore = myEmp() || {};
    let photoUrl = SESSION.photoUrl || '';
    if(_profilePhotoData === ''){
      photoUrl = '';
    } else if(_profilePhotoData){
      const key = _normMobileKey(SESSION.mobile||SESSION.uid||SESSION.empObjId||'user') || ('u_'+Date.now());
      const path = 'profilePhotos/'+key+'/avatar.jpg';
      if(typeof window._fbUploadSelfie === 'function'){
        const url = await window._fbUploadSelfie(_profilePhotoData, path);
        if(url) photoUrl = url;
        else toast('⚠️ Photo upload failed — other fields will still save');
      } else {
        if(_profilePhotoData.length < 200000) photoUrl = _profilePhotoData;
        else toast('⚠️ Storage not ready — try again');
      }
    }

    SESSION.name = name;
    SESSION.photoUrl = photoUrl;
    try{ saveSession(); }catch(e){}

    const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(mob){
      try{
        await fbUpdate('mobileUsers/'+mob, {
          name,
          photoUrl: photoUrl || null,
          dob: dob || null,
          joiningDate: doj || null,
          salary: salary || null,
          monthlySalary: salary ? Number(salary) : null,
          woff: woff || null,
          designation: desig || null,
          profileUpdatedAt: new Date().toISOString()
        });
      }catch(e){
        console.error('mobileUsers profile', e);
        toast('❌ Profile save failed: '+(e.message||e.code||e));
        throw e;
      }
    }
    const empId = SESSION.empObjId || empBefore.id;
    if(empId){
      try{
        await fbUpdate('employees/'+empId, {
          name: name.toUpperCase(),
          photoUrl: photoUrl || null,
          dob: dob || null,
          joiningDate: doj || null,
          salary: salary || null,
          monthlySalary: salary ? Number(salary) : null,
          woff: woff || null,
          designation: desig || null,
          empId: empIdEdit || empBefore.empId || null,
          sec: secEdit || empBefore.sec || null,
          mc: mcEdit || empBefore.mc || null,
          machine: mcEdit || empBefore.machine || null,
          resp: respEdit || empBefore.resp || null,
          responsibility: respEdit || empBefore.responsibility || null
        });
      }catch(e){ console.warn('emp profile', e); }
    }

    const changes = [];
    if((empBefore.name||'') !== name) changes.push('Name');
    if((empBefore.dob||'') !== dob) changes.push('DOB');
    if((empBefore.joiningDate||empBefore.doj||'') !== doj) changes.push('DOJ');
    if(String(empBefore.salary||empBefore.monthlySalary||'') !== String(salary||'')) changes.push('Salary');
    if((empBefore.woff||'') !== woff) changes.push('Weekly Off');
    if((empBefore.designation||'') !== desig) changes.push('Designation');
    if(changes.length){
      const body = name+' updated: '+changes.join(', ');
      const mgrKey = _normMobileKey(SESSION.managerId||'');
      if(mgrKey){
        try{
          await fbPush('userNotifications/'+mgrKey, {
            type:'profile_update', title:'✏️ Profile update — '+name, body,
            mobile: SESSION.mobile||'', name, changes, read:false, at: new Date().toISOString()
          });
        }catch(e){}
      }
      try{
        await fbPush('adminNotifications', {
          type:'profile_update', title:'✏️ Profile update — '+name, body,
          mobile: SESSION.mobile||'', managerId: SESSION.managerId||'', read:false, at: new Date().toISOString()
        });
      }catch(e){}
    }

    try{
      const userAvEl = document.getElementById('userAv');
      if(userAvEl){
        userAvEl.style.background = 'linear-gradient(135deg,var(--m1,#f97316),var(--s1,#a855f7))';
        if(photoUrl){
          userAvEl.innerHTML = `<img src="${photoUrl}" alt="">`;
          userAvEl.setAttribute('data-has-photo','1');
        } else {
          userAvEl.innerHTML = '';
          userAvEl.textContent = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
          userAvEl.removeAttribute('data-has-photo');
        }
      }
      const userNameEl = document.getElementById('userName');
      if(userNameEl) userNameEl.textContent = name;
    }catch(e){}

    closeModal();
    toast(changes.length ? '✅ Profile saved — Manager notified' : '✅ Profile saved');
  }catch(err){
    console.error(err);
    toast('❌ Save failed: '+(err.message||err));
    if(btn){ btn.disabled = false; btn.textContent = '💾 Save'; }
  }
}



/** Default yearly leave quotas (Manager can override in Profile) */
function _defaultLeaveQuotas(){
  return { CL:12, SL:6, EL:15, CO:0, other:5 };
}
async function openLeaveQuotaSettings(){
  if(!isMgr() && !isAdmin()){ toast('❌ Manager only'); return; }
  const key = 'leaveQuotas/'+(myShiftConfigKey()||_normMobileKey(SESSION.mobile)||'default');
  let q = _defaultLeaveQuotas();
  try{ const r = await fbGet(key); if(r) q = {...q, ...r}; }catch(e){}
  try{ window._leaveQuotaLast = q; window._leaveQuotaCache = window._leaveQuotaCache||{}; window._leaveQuotaCache[key.replace(/^leaveQuotas\//,'')] = q; }catch(e){}
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📋 Team Leave Quota (Year)</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Members see remaining balance in Profile. Set leave year range below.</div>
    <div class="grid2" style="margin-bottom:12px">
      <div class="field"><label>Year start</label>
        <input class="inp-field" type="date" id="lq_yearStart" value="${q.yearStart||(new Date().getFullYear()+'-01-01')}"></div>
      <div class="field"><label>Year end</label>
        <input class="inp-field" type="date" id="lq_yearEnd" value="${q.yearEnd||(new Date().getFullYear()+'-12-31')}"></div>
    </div>
    <div id="lq_fields">${['CL','SL','EL','CO','other'].map(t=>`
      <div class="field"><label>${t==='CL'?'Casual Leave (CL)':t==='SL'?'Sick Leave (SL)':t==='EL'?'Earned Leave (EL)':t==='CO'?'Comp Off':'Other'}</label>
        <input class="inp-field" type="number" id="lq_${t}" data-lq-key="${t}" value="${q[t]!=null?q[t]:0}" min="0" max="365"></div>`).join('')}
    </div>
    <div class="field"><label>Add custom leave type</label>
      <div style="display:flex;gap:8px">
        <input class="inp-field" id="lq_new_name" placeholder="e.g. Maternity / RH" style="flex:1">
        <input class="inp-field" id="lq_new_days" type="number" min="0" max="365" placeholder="Days" style="width:90px">
      </div>
    </div>
    <button type="button" class="cancel-btn" style="margin-bottom:8px" onclick="_addCustomLeaveQuotaRow()">＋ Add leave type</button>
    <button class="submit-btn" onclick="saveLeaveQuotas()">✅ Save</button>
    <button class="cancel-btn" onclick="closeModal()">Cancel</button>`);
}

function _addCustomLeaveQuotaRow(){
  const name = (document.getElementById('lq_new_name')?.value||'').trim();
  const days = Number(document.getElementById('lq_new_days')?.value)||0;
  if(!name){ toast(L('⚠️ Leave type name लिखें','⚠️ Enter leave type name')); return; }
  const key = name.replace(/[^a-zA-Z0-9_\u0900-\u097F]+/g,'_').slice(0,24);
  const host = document.getElementById('lq_fields');
  if(!host) return;
  if(document.getElementById('lq_'+key)){ toast('⚠️ Already added'); return; }
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = '<label>'+name.replace(/</g,'')+'</label><input class="inp-field" type="number" id="lq_'+key+'" data-lq-key="'+key+'" value="'+days+'" min="0" max="365">';
  host.appendChild(div);
  const n=document.getElementById('lq_new_name'); if(n) n.value='';
  const d=document.getElementById('lq_new_days'); if(d) d.value='';
  toast('✅ Added '+name);
}
async function saveLeaveQuotas(){
  const key = 'leaveQuotas/'+(myShiftConfigKey()||_normMobileKey(SESSION.mobile)||'default');
  const q = {};
  document.querySelectorAll('[data-lq-key]').forEach(el=>{
    const k = el.getAttribute('data-lq-key');
    if(k) q[k] = Number(el.value)||0;
  });
  // fallback fixed keys
  ['CL','SL','EL','CO','other'].forEach(t=>{
    if(q[t]==null) q[t] = Number(document.getElementById('lq_'+t)?.value)||0;
  });
  q.yearStart = (document.getElementById('lq_yearStart')?.value||'').trim() || (new Date().getFullYear()+'-01-01');
  q.yearEnd = (document.getElementById('lq_yearEnd')?.value||'').trim() || (new Date().getFullYear()+'-12-31');
  q.updatedAt = new Date().toISOString();
  try{
    await fbSet(key, q);
    try{
      window._leaveQuotaLast = q;
      window._leaveQuotaCache = window._leaveQuotaCache || {};
      const ck = (typeof myShiftConfigKey==='function' && myShiftConfigKey()) || '';
      if(ck) window._leaveQuotaCache[ck] = q;
    }catch(e){}
    toast('✅ Leave quotas saved');
    closeModal();
  }catch(e){ toast('❌ '+e.message); }
}
async function openLeaveBalanceModal(empId){
  let q = _defaultLeaveQuotas();
  try{
    const k2 = 'leaveQuotas/'+(myShiftConfigKey()||_normMobileKey(SESSION.managerId||SESSION.mobile)||'default');
    const r = await fbGet(k2);
    if(r) q = {...q, ...r};
  }catch(e){}
  // Optional: view another member's balance (manager / leave-approver / self)
  let emp = null;
  if(empId){
    emp = (typeof getEmps==='function'?getEmps():[]).find(e=>e && (e.id===empId || e.empId===empId)) || null;
  }
  if(!emp) emp = (typeof myEmp==='function'?myEmp():null);

  const year = new Date().getFullYear();
  const yStart = q.yearStart || (year+'-01-01');
  const yEnd = q.yearEnd || (year+'-12-31');
  const used = { CL:0, SL:0, EL:0, CO:0, other:0 };
  const calL = new Set(); // dates marked L on calendar
  const calCO = new Set();

  // A) Approved leave applications (primary source by type)
  // CO credits (holiday/double-shift earned) increase balance; CO usage decreases it
  let coCredits = 0;
  try{
    (getLeaves()||[]).forEach(l=>{
      if(!emp || !l || l.status!=='approved') return;
      if(l.empId!==emp.id && l.empId!==emp.empId) return;
      const from = l.from||'';
      if(from && (from < yStart || from > yEnd)) return;
      const days = Number(l.days)||1;
      const typeCode = String(l.type||'').toUpperCase();
      const t = String(l.leaveType||l.type||'').toLowerCase();
      if(typeCode==='SL' || /sick|\bsl\b/.test(t)) used.SL += days;
      else if(typeCode==='EL' || /earned|\bel\b|privilege/.test(t)) used.EL += days;
      else if(typeCode==='CO' || /c-?off|comp|\bc\/o\b|\bco\b/.test(t)){
        // credit:true or autoGenerated holiday/double = EARNED (+balance)
        if(l.credit === true || l.autoGenerated === true){
          coCredits += days;
        } else {
          used.CO += days; // employee took C-Off
        }
      }
      else if(typeCode==='CL' || /casual|\bcl\b/.test(t)) used.CL += days;
      else if(typeCode && typeCode!=='L') { used.other += days; }
      else used.other += days;
    });
  }catch(e){}

  // B) Calendar marks — only for dates not already explained by applications
  try{
    if(emp && emp.id){
      for(let m=0;m<12;m++){
        const mk = year+'_'+String(m+1).padStart(2,'0');
        const sched = (typeof getSchedules==='function' ? getSchedules()[mk] : null) || {};
        const row = sched[emp.id] || sched[emp.empId] || {};
        const vals = Array.isArray(row) ? row : [];
        vals.forEach((sh,i)=>{
          const ds = year+'-'+String(m+1).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');
          const sv = String(sh||'');
          if(sv==='L' || /^L[:\-_]/i.test(sv)){
            calL.add(ds);
            const tm = sv.match(/^L[:\-_](.+)$/i);
            if(tm){
              const tc=tm[1].toUpperCase();
              if(tc==='SL') used.SL++;
              else if(tc==='EL') used.EL++;
              else if(tc==='CO') used.CO++;
              else if(tc==='CL') used.CL++;
              else used.other++;
            }
          }
          if(sv==='C/O'||sv==='CO') calCO.add(ds);
        });
      }
      const ov = (typeof getOverrides==='function'?getOverrides():null)||{};
      Object.keys(ov).forEach(k=>{
        if(!k.startsWith(emp.id+'_')) return;
        const d = k.slice(emp.id.length+1);
        if(d<yStart||d>yEnd) return;
        const ovv = String(ov[k]||'');
        if(ovv==='L' || /^L[:\-_]/i.test(ovv)){
          calL.add(d);
          const tm = ovv.match(/^L[:\-_](.+)$/i);
          if(tm){
            const tc = tm[1].toUpperCase();
            if(tc==='SL') used.SL++;
            else if(tc==='EL') used.EL++;
            else if(tc==='CO') used.CO++;
            else if(tc==='CL') used.CL++;
            else used.other++;
          }
        }
        if(ovv==='C/O'||ovv==='CO') calCO.add(d);
      });
    }
  }catch(e){}

  // If no typed CL apps, fall back to unique calendar L days
  if(used.CL===0 && calL.size) used.CL = calL.size;
  // CO used: calendar C/O added in cards section (not here, to avoid double-count with apps)

  const quotaKeys = Object.keys(q).filter(k=>!['updatedAt','updatedBy'].includes(k) && (typeof q[k]==='number' || !isNaN(Number(q[k]))));
  // Calendar C/O days count as USED (reduce balance)
  if(calCO.size) used.CO += calCO.size;

  const cards = quotaKeys.map(k=>{
    const quota = Number(q[k])||0;
    let u = 0;
    let earned = 0;
    if(k==='CL') u = used.CL;
    else if(k==='SL') u = used.SL;
    else if(k==='EL') u = used.EL;
    else if(k==='CO'||k==='C/O'){ u = used.CO; earned = coCredits; }
    else if(k==='other') u = used.other;
    // C-Off balance = quota + earned (holiday duty etc.) − used (took C/O day)
    const left = Math.max(0, quota + earned - u);
    const label = k==='CL'?'Casual Leave (CL)':k==='SL'?'Sick Leave (SL)':k==='EL'?'Earned Leave (EL)':k==='CO'?'Comp Off (C/O)':k;
    const color = k==='SL'?'#0ea5e9':k==='CO'?'#d97706':k==='EL'?'#7c3aed':'#16a34a';
    const sub = (k==='CO'||k==='C/O')
      ? ('Earned +'+earned+' · Used '+u+' · Base quota '+quota)
      : ('Used (approved): '+u);
    return `<div style="background:var(--panel);border-radius:12px;padding:12px;border:1px solid var(--border2)">
      <div style="font-weight:800;color:var(--text)">${label}</div>
      <div style="font-size:22px;font-weight:900;color:${color}">${left} <span style="font-size:12px;color:var(--muted2)">left</span></div>
      <div style="font-size:11px;color:var(--muted2)">${sub}</div>
    </div>`;
  }).join('');

  const who = emp ? (emp.name || emp.empId || '') : (SESSION.name||'');
  const titleName = who ? (' — ' + who) : '';
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🏖️ ${L('Leave Balance','Leave Balance')}${titleName} ${year}</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px">${L('Quota Manager से · Approved leave applications से used','Quota from Manager · Used from approved leave applications')}</div>
    <div style="display:grid;gap:10px;margin:12px 0">${cards||`<div style="color:var(--muted2)">${L('No quotas — Manager sets Team Leave Quota','No quotas — Manager sets Team Leave Quota')}</div>`}</div>
    <button class="cancel-btn" onclick="closeModal()">${L('बंद करें','Close')}</button>`);
}

/** Leave tab: pick any team member and show same Leave Balance cards as Profile */
function openCheckMemberLeaveBalance(){
  const emps = (typeof getEmps==='function'?getEmps():[]).filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
  if(!emps.length){ toast(L('⚠️ कोई सदस्य नहीं','⚠️ No members')); return; }
  // Managers / leave approvers / admins can check anyone; members see own team roster if loaded
  const canPick = (typeof isAdmin==='function'&&isAdmin()) || (typeof isMgr==='function'&&isMgr()) || (typeof canApproveLeave==='function'&&canApproveLeave());
  const list = canPick ? emps : emps.filter(e=>{
    try{ return e.id===(typeof myEmp==='function'&&myEmp()&&myEmp().id); }catch(x){ return false; }
  });
  const opts = (canPick?emps:list).map(e=>{
    const sec = (typeof secName==='function'?secName(e.sec||e.section):'') || e.sec||e.section||'';
    return `<option value="${e.id}">${escHtml((e.name||'—'))} (${escHtml(e.empId||'—')}) ${sec?('· '+sec):''}</option>`;
  }).join('');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🏖️ ${L('सदस्य Leave Balance','Member Leave Balance')}</div>
    <div class="field"><label>${L('सदस्य चुनें','Select member')}</label>
      <select class="inp-field" id="lvBal_emp">${opts}</select>
    </div>
    <button type="button" class="submit-btn" onclick="(function(){ var id=document.getElementById('lvBal_emp')&&document.getElementById('lvBal_emp').value; if(id) openLeaveBalanceModal(id); })()">${L('देखें','View')}</button>
    <button type="button" class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}


async function openHolidayListSettings(){
  if(!isMgr() && !isAdmin()){ toast('❌ Manager only'); return; }
  const key = 'holidayLists/'+(myShiftConfigKey()||_normMobileKey(SESSION.mobile)||'default');
  let list = [];
  try{ const r = await fbGet(key); if(Array.isArray(r)) list=r; else if(r&&r.dates) list=r.dates; }catch(e){}
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🎉 Planned Holidays</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:10px">One date per line (YYYY-MM-DD). On save, team gets <b>H</b> and earns C-Off eligibility.</div>
    <textarea class="inp-field" id="holidayListTa" rows="8" style="width:100%;font-family:monospace">${list.join('\n')}</textarea>
    <button class="submit-btn" onclick="saveHolidayList()">✅ Save Holidays</button>
    <button class="cancel-btn" onclick="closeModal()">Cancel</button>`);
}


/** Append one device/mobile login event for Admin audit list */
async function _recordLoginEvent(info){
  try{
    info = info || {};
    const now = new Date();
    const mobile = (typeof _normMobileKey==='function')
      ? _normMobileKey(info.mobile || info.phone || '')
      : String(info.mobile||'').replace(/\D/g,'').slice(-10);
    const entry = {
      at: now.toISOString(),
      date: now.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}),
      time: now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true}),
      name: String(info.name || SESSION.name || '—').slice(0,80),
      mobile: mobile || String(info.mobile||'—').slice(0,20),
      company: String(info.company || SESSION.company || '—').slice(0,80),
      role: String(info.role || SESSION.role || '').slice(0,20),
      deviceId: String(info.deviceId || (typeof getDeviceId==='function' ? getDeviceId() : '') || '').slice(0,64),
      deviceName: String(info.deviceName || (typeof _guessDeviceLabel==='function' ? _guessDeviceLabel() : '') || '').slice(0,40),
      method: String(info.method || 'otp').slice(0,30)
    };
    await fbPush('deviceLoginLogs', entry);
  }catch(e){ console.warn('[login log]', e && e.message); }
}

/** Admin: full list of mobile/device logins — Date, Time, Name, Mobile No, Company */
async function openDeviceLoginList(){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  toast('⏳ Loading login list…');
  let logs = {};
  try{ logs = await fbGet('deviceLoginLogs') || {}; }catch(e){ console.warn(e); }
  const rows = Object.entries(logs).map(([k,v])=>({...(v||{}), _key:k}));
  rows.sort((a,b)=>{
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
  // keep UI usable — show latest 300
  const show = rows.slice(0, 300);
  const esc = (typeof escHtml==='function') ? escHtml : (s)=>String(s||'').replace(/</g,'&lt;');
  const tableRows = show.length ? show.map(r=>{
    let date = r.date || '';
    let time = r.time || '';
    if((!date || !time) && r.at){
      try{
        const d = new Date(r.at);
        date = d.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
        time = d.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});
      }catch(e){}
    }
    const mob = r.mobile ? (String(r.mobile).length===10 ? '+91-'+r.mobile : r.mobile) : '—';
    return `<tr>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);white-space:nowrap;font-size:11px">${esc(date||'—')}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);white-space:nowrap;font-size:11px">${esc(time||'—')}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);font-size:12px;font-weight:700;color:var(--text)">${escHtml(esc(r.name||'—'))}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);font-size:11px;font-family:monospace">${esc(mob)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid var(--border2);font-size:11px">${escHtml(esc(r.company||'—'))}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--muted2)">No login records yet</td></tr>`;

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📱 Device / Mobile Logins</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">
      Each mobile &amp; device login · newest first${rows.length>300?' · showing latest 300 of '+rows.length:''}
    </div>
    <div style="overflow-x:auto;max-height:65vh;border:1px solid var(--border2);border-radius:12px">
      <table style="width:100%;border-collapse:collapse;min-width:480px">
        <thead>
          <tr style="background:var(--panel);position:sticky;top:0;z-index:1">
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">DATE</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">TIME</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">NAME</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">MOBILE NO</th>
            <th style="padding:10px 6px;text-align:left;font-size:10px;font-weight:800;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border2)">COMPANY</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <button class="cancel-btn" onclick="closeModal()" style="margin-top:14px">Close</button>`);
}
try{ window.openDeviceLoginList = openDeviceLoginList; window._recordLoginEvent = _recordLoginEvent; }catch(e){}

async function openAdminAnalytics(){
  if(!isAdmin()){ toast('❌ Admin only'); return; }
  toast('⏳ Loading analytics…');
  let mobileUsers={}, employees={}, managers={}, deviceApprovals={};
  try{ mobileUsers = await fbGet('mobileUsers') || {}; }catch(e){}
  try{ employees = await fbGet('employees') || {}; }catch(e){}
  try{ managers = await fbGet('managers') || {}; }catch(e){}
  try{ deviceApprovals = await fbGet('deviceApprovals') || {}; }catch(e){}

  const muEntries = Object.entries(mobileUsers||{}).map(([k,u])=>({...(u||{}), _key:k, mobile: (u&& (u.mobile||u.phone)) || k }));
  const mu = muEntries;
  const managersN = mu.filter(u=>u.role==='manager' && u.status==='approved').length;
  const membersN = mu.filter(u=>u.role==='member' && u.status==='approved').length;
  const pendingN = mu.filter(u=>u.status==='pending').length;
  const empN = Object.keys(employees||{}).length;
  const now = Date.now();
  const active30 = mu.filter(u=>{
    const t = u.lastLoginAt || u.loginAt || u.registeredAt || u.approvedAt;
    if(!t) return false;
    return (now - new Date(t).getTime()) < 30*86400000;
  }).length;
  const daEntries = Object.entries(deviceApprovals||{}).map(([k,a])=>({...(a||{}), _key:k}));
  const validDevices = daEntries.filter(a=>{
    try{ return a.validTill && new Date(a.validTill) > new Date(); }catch(e){ return false; }
  }).length;

  const empById = {};
  const empByPhone = {};
  Object.entries(employees||{}).forEach(([id,e])=>{
    if(!e) return;
    const rec = {...e, id: e.id||id};
    empById[rec.id] = rec;
    const ph = _normMobileKey(e.phone||e.mobile||'');
    if(ph) empByPhone[ph] = rec;
  });

  const deviceRows = [];
  const seen = new Set();
  daEntries.forEach(a=>{
    let valid = false;
    try{ valid = !!(a.validTill && new Date(a.validTill) > new Date()); }catch(e){}
    const emp = empById[a._key] || (a.empId ? Object.values(empById).find(e=>String(e.empId)===String(a.empId)) : null);
    const mob = _normMobileKey(a.mobile || (emp&&(emp.phone||emp.mobile)) || '');
    const muRec = mob ? (mobileUsers[mob] || null) : null;
    const name = (emp && emp.name) || a.empName || (muRec && muRec.name) || '—';
    const role = (muRec && muRec.role) || (emp && (emp.accessLevel==='manager'||emp.sec==='MGR') ? 'manager' : 'member') || '—';
    const company = (muRec && muRec.company) || (emp && emp.company) || '—';
    const deviceName = a.deviceName || (muRec && muRec.lastDeviceName) || '—';
    const lastAt = a.approvedAt || (muRec && (muRec.lastLoginAt||muRec.loginAt)) || '';
    const key = (mob||a._key)+'|'+(a.approvedDeviceId||'');
    if(seen.has(key)) return;
    seen.add(key);
    deviceRows.push({
      name, mobile: mob || '—', company, deviceName,
      role, valid, lastAt,
      deviceId: (a.approvedDeviceId||'').substring(0,10),
      empCode: (emp && emp.empId) || a.empId || ''
    });
  });
  mu.forEach(u=>{
    const mob = _normMobileKey(u.mobile||u.phone||u._key||'');
    if(!mob) return;
    const keyPrefix = mob+'|';
    if([...seen].some(s=>s.startsWith(keyPrefix))) return;
    if(!u.lastLoginAt && !u.loginAt && u.status!=='approved') return;
    const emp = empByPhone[mob];
    deviceRows.push({
      name: (emp && emp.name) || u.name || '—',
      mobile: mob,
      company: u.company || (emp && emp.company) || '—',
      deviceName: u.lastDeviceName || '—',
      role: u.role || '—',
      valid: u.status==='approved',
      lastAt: u.lastLoginAt || u.loginAt || u.approvedAt || '',
      deviceId: (u.lastDeviceId||'').substring(0,10),
      empCode: (emp && emp.empId) || u.empId || ''
    });
  });
  deviceRows.sort((a,b)=>{
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });

  const fmtWhen = (iso)=>{
    if(!iso) return '—';
    try{
      const d = new Date(iso);
      if(isNaN(d.getTime())) return '—';
      return d.toLocaleString(typeof mpLocale==='function'?mpLocale():'en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    }catch(e){ return '—'; }
  };

  const rowsHtml = deviceRows.length ? deviceRows.map(r=>{
    const roleColor = r.role==='manager' ? '#a855f7' : (r.role==='admin' ? '#f97316' : '#38bdf8');
    const validBadge = r.valid
      ? '<span style="font-size:10px;font-weight:800;color:#22c55e;background:rgba(34,197,94,.12);padding:2px 7px;border-radius:6px">Valid</span>'
      : '<span style="font-size:10px;font-weight:800;color:#94a3b8;background:rgba(148,163,184,.12);padding:2px 7px;border-radius:6px">Expired/—</span>';
    return `<div style="background:var(--panel);border:1px solid var(--border2);border-radius:12px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="min-width:0">
          <div style="font-size:14px;font-weight:900;color:var(--text)">${escHtml(r.name)}</div>
          <div style="font-size:12px;color:var(--muted2);margin-top:3px">📱 ${escHtml(r.mobile)}${escHtml(r.empCode?' · #'+escHtml(String(r.empCode)):'')}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <span style="font-size:10px;font-weight:800;color:${roleColor};text-transform:uppercase">${escHtml(String(r.role))}</span>
          <div style="margin-top:4px">${validBadge}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;font-size:11px;color:var(--muted2)">
        <div>🏢 <b style="color:var(--text)">${escHtml(String(r.company||'—'))}</b></div>
        <div>📲 <b style="color:var(--text)">${escHtml(String(r.deviceName||'—'))}</b></div>
        <div>🕒 ${fmtWhen(r.lastAt)}</div>
        <div style="font-family:monospace;font-size:10px">ID ${escHtml(r.deviceId||'—')}</div>
      </div>
    </div>`;
  }).join('') : '<div class="empty"><div class="empty-text">No device login records yet</div></div>';

  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">📊 App Analytics</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Realtime Database · device logins · Google Analytics on Admin login</div>
    <button type="button" onclick="closeModal();openDeviceLoginList()" style="width:100%;margin-bottom:12px;padding:12px;border-radius:12px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.1);color:#38bdf8;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">📱 Open full login list (Date · Time · Name · Mobile · Company)</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#22c55e">${mu.length}</div>
        <div style="font-size:11px;color:var(--muted2)">Mobile users (OTP)</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#38bdf8">${empN}</div>
        <div style="font-size:11px;color:var(--muted2)">Employees records</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#f97316">${managersN}</div>
        <div style="font-size:11px;color:var(--muted2)">Approved Managers</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#a855f7">${membersN}</div>
        <div style="font-size:11px;color:var(--muted2)">Approved Members</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#fbbf24">${pendingN}</div>
        <div style="font-size:11px;color:var(--muted2)">Pending registrations</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2)">
        <div style="font-size:22px;font-weight:900;color:#34d399">${active30}</div>
        <div style="font-size:11px;color:var(--muted2)">Active ~30 days</div>
      </div>
      <div style="background:var(--panel);border-radius:12px;padding:14px;border:1px solid var(--border2);grid-column:1/-1">
        <div style="font-size:22px;font-weight:900;color:#60a5fa">${validDevices}</div>
        <div style="font-size:11px;color:var(--muted2)">Devices with valid access (not expired)</div>
      </div>
    </div>

    <div style="font-size:13px;font-weight:900;color:var(--text);margin:6px 0 8px">📱 Logged-in devices</div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px">Name · Mobile · Company · Device · last activity (from RTDB)</div>
    <div style="max-height:42vh;overflow-y:auto;margin-bottom:12px;padding-right:2px">${rowsHtml}</div>

    <div style="font-size:11px;color:var(--muted2);line-height:1.5;margin-bottom:12px">
      Live counts from Firebase RTDB. Measurement ID <b>G-DK6JFY33ED</b>.
    </div>
    <a href="https://console.firebase.google.com/project/met-power/analytics" target="_blank" rel="noopener"
      style="display:block;text-align:center;padding:14px;border-radius:12px;background:linear-gradient(135deg,#f97316,#a855f7);color:#fff;font-weight:800;text-decoration:none;margin-bottom:10px">
      📈 Open Google Analytics (Firebase Console)
    </a>
    <button class="cancel-btn" onclick="closeModal()">Close</button>`);
}



// ════════════════════════════════════════
// APP ACCESS SECURITY (Profile) — password + fingerprint  v2.4.3
// ════════════════════════════════════════
function _sessionSecurityIds(){
  const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const empObjId = SESSION.empObjId || '';
  const uid = empObjId || (mob ? ('m_'+mob) : 'user');
  return { mob, empObjId, uid, name: SESSION.name||'User' };
}

async function openAppAccessSecurity(){
  const { mob, empObjId, uid, name } = _sessionSecurityIds();
  const hasPw = !!(typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, mob));
  const fpOn = localStorage.getItem(FP_KEY+'_'+uid)==='1' || localStorage.getItem(FP_KEY)==='1';
  let bioOk = false;
  try{ bioOk = await isBiometricAvailable(); }catch(e){}
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🔐 ${L('ऐप एक्सेस सुरक्षा','App Access Security')}</div>
    <div class="modal-scroll-body">
      <div style="font-size:12px;color:var(--muted2);line-height:1.55;margin-bottom:14px">
        ${L('ये सेटिंग सिर्फ <b style="color:var(--text)">इस device</b> पर हैं। Fingerprint (बेहतर) या device password से अगली बार OTP की जरूरत नहीं पड़ेगी।','These settings are only on <b style="color:var(--text)">this device</b>. Use fingerprint (preferred) or a device password so you do not need OTP every time.')}
      </div>
      <div style="background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:12px 14px;margin-bottom:12px">
        <div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;margin-bottom:8px">${L('स्थिति','STATUS')}</div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">👆 Fingerprint</span>
          <span style="font-weight:800;color:${fpOn?'#22c55e':'#f97316'}">${fpOn?(L('चालू','ON')):(L('बंद','OFF'))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">🔑 Device Password</span>
          <span style="font-weight:800;color:${hasPw?'#22c55e':'#f97316'}">${hasPw?(L('सेट है','Set')):(L('सेट नहीं','Not set'))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">📱 Biometric hardware</span>
          <span style="font-weight:700;color:var(--text)">${bioOk?(L('उपलब्ध','Available')):(L('नहीं','Not available'))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:var(--muted2)">💾 Schedule Save security</span>
          <span style="font-weight:800;color:${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?'#f97316':'#22c55e'}">${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?(L('Strict · OTP','Strict (OTP)')):(L('Trusted · बिना OTP','Trusted (No OTP Required)'))}</span>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted2);line-height:1.5;margin:8px 0 10px;padding:10px;border-radius:10px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2)">
        ${L('<b style="color:var(--text)">Trusted</b> = इस device पर Schedule Save बिना बार‑बार OTP (बार‑बार OTP नहीं)। <b style="color:var(--text)">Strict</b> = Phone Auth न हो तो हर Save से पहले OTP।','<b style="color:var(--text)">Trusted</b> = Save shifts on this laptop/phone without OTP every time (no OTP each time). <b style="color:var(--text)">Strict</b> = require phone OTP before each Save when Phone Auth is missing.')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button type="button" onclick="setWriteSecurityMode('trusted');toast(L('✅ Trusted mode — बिना OTP Save','✅ Trusted mode — No OTP Required'));closeModal();setTimeout(()=>openAppAccessSecurity(),200)"
          style="flex:1;padding:12px;border-radius:12px;border:1.5px solid ${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()!=='strict')?'#22c55e':'var(--border2)'};background:${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()!=='strict')?'rgba(34,197,94,.12)':'var(--card)'};color:var(--text);font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">
          ✅ Trusted<br><span style="font-weight:600;opacity:.8;font-size:10px">No OTP Required</span>
        </button>
        <button type="button" onclick="setWriteSecurityMode('strict');toast(L('🔐 Strict mode — Save से पहले OTP','🔐 Strict mode — OTP before Save'));closeModal();setTimeout(()=>openAppAccessSecurity(),200)"
          style="flex:1;padding:12px;border-radius:12px;border:1.5px solid ${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?'#f97316':'var(--border2)'};background:${(typeof getWriteSecurityMode==='function' && getWriteSecurityMode()==='strict')?'rgba(249,115,22,.12)':'var(--card)'};color:var(--text);font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">
          🔐 Strict<br><span style="font-weight:600;opacity:.8;font-size:10px">OTP gate</span>
        </button>
      </div>
      <button class="profile-action" style="margin-top:4px;width:100%;text-align:left" onclick="closeModal();setTimeout(()=>openChangeDevicePassword(),200)">
        <div class="pa-icon" style="background:rgba(249,115,22,.12)">🔑</div>
        <div><div class="pa-label">${hasPw?(L('Password बदलें','Change Device Password')):(L('Password सेट करें','Set Device Password'))}</div>
        <div class="pa-sub">${L('इस device पर बिना OTP login','For login without OTP on this device')}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      ${bioOk?`<button class="profile-action" style="margin-top:6px;width:100%;text-align:left" onclick="closeModal();setTimeout(()=>setupFingerprintFromProfile(),200)">
        <div class="pa-icon" style="background:rgba(168,85,247,.12)">👆</div>
        <div><div class="pa-label">${fpOn?(L('Fingerprint दोबारा सेट करें','Re-setup Fingerprint')):(L('Fingerprint Login चालू करें','Enable Fingerprint Login'))}</div>
        <div class="pa-sub">${L('Fingerprint / Face से app खोलें','Unlock app with fingerprint / face')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${fpOn?`<button class="profile-action" style="margin-top:6px;width:100%;text-align:left;border-color:rgba(244,63,94,.3)" onclick="disableFingerprintFromProfile()">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚫</div>
        <div><div class="pa-label">${L('Fingerprint बंद करें','Disable Fingerprint')}</div>
        <div class="pa-sub">${L('Password या OTP इस्तेमाल करें','Use password or OTP instead')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${hasPw?`<button class="profile-action" style="margin-top:6px;width:100%;text-align:left;border-color:rgba(244,63,94,.3)" onclick="clearDevicePasswordFromProfile()">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🗑️</div>
        <div><div class="pa-label">${L('Password हटाएं','Remove Device Password')}</div>
        <div class="pa-sub">${L('अगली बार OTP लग सकता है','Next login may need OTP')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
    </div>
    <div class="modal-sticky-actions">
      <button class="cancel-btn" onclick="closeModal()">${L('बंद करें','Close')}</button>
    </div>`);
}

function openChangeDevicePassword(){
  const { mob, empObjId, uid, name } = _sessionSecurityIds();
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const hasPw = !!(typeof _getDevicePasswordHash==='function' && _getDevicePasswordHash(empObjId, mob));
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🔑 ${hasPw?(L('Password बदलें','Change Password')):(L('Password सेट करें','Set Password'))}</div>
    <div class="modal-scroll-body">
      <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
        ${L('सिर्फ इस device पर सेव होगा। कम से कम 5 अक्षर।','Saved only on this device. Min 5 characters.')}
      </div>
      ${hasPw?`<div class="field"><label>${L('पुराना password (optional)','Current password (optional)')}</label>
        <input class="inp-field" type="password" id="secOldPw" inputmode="numeric" maxlength="20" placeholder="●●●●●"></div>`:''}
      <div class="field"><label>${L('नया password','New password')} *</label>
        <input class="inp-field" type="password" id="secNewPw" inputmode="numeric" maxlength="20" placeholder="●●●●●"></div>
      <div class="field"><label>${L('नया password दोबारा','Confirm new password')} *</label>
        <input class="inp-field" type="password" id="secNewPw2" inputmode="numeric" maxlength="20" placeholder="●●●●●"></div>
      <div id="secPwErr" style="color:#f43f5e;font-size:12px;min-height:16px;margin-bottom:8px"></div>
    </div>
    <div class="modal-sticky-actions">
      <button class="submit-btn" onclick="saveDevicePasswordFromProfile()">💾 ${L('सेव करें','Save')}</button>
      <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>
    </div>`);
}

async function saveDevicePasswordFromProfile(){
  const { mob, empObjId } = _sessionSecurityIds();
  const isEn = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const p1 = (document.getElementById('secNewPw')?.value||'');
  const p2 = (document.getElementById('secNewPw2')?.value||'');
  const old = (document.getElementById('secOldPw')?.value||'');
  const err = document.getElementById('secPwErr');
  if(p1.length < 5){ if(err) err.textContent = L('कम से कम 5 अक्षर','Min 5 characters'); return; }
  if(p1 !== p2){ if(err) err.textContent = L('Password match नहीं हो रहे','Passwords do not match'); return; }
  const existing = _getDevicePasswordHash(empObjId, mob);
  if(existing && old){
    const oldH = await hashPass(old+'mp_salt_v24');
    if(oldH !== existing){ if(err) err.textContent = L('पुराना password गलत','Current password wrong'); return; }
  }
  const h = await hashPass(p1+'mp_salt_v24');
  _setDevicePasswordHash(empObjId, mob, h);
  toast(L('✅ Device password सेव हो गया','✅ Device password saved'));
  closeModal();
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 250);
}

async function setupFingerprintFromProfile(){
  const { uid, name } = _sessionSecurityIds();
  // Force re-register even if already set
  try{ localStorage.removeItem(FP_KEY+'_'+uid); }catch(e){}
  try{
    await registerFingerprint(name, uid);
    // If user declined prompt inside registerFingerprint, still try direct create
    if(localStorage.getItem(FP_KEY+'_'+uid)!=='1'){
      // registerFingerprint already asked; if declined, leave OFF
    }
  }catch(e){ toast('❌ Fingerprint: '+(e.message||e.name||e)); }
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 400);
}

function disableFingerprintFromProfile(){
  const { uid } = _sessionSecurityIds();
  try{
    localStorage.removeItem(FP_KEY);
    localStorage.removeItem(FP_KEY+'_'+uid);
    localStorage.removeItem(FP_CRED_KEY);
  }catch(e){}
  toast(L('Fingerprint बंद कर दिया','Fingerprint disabled'));
  closeModal();
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 250);
}

function clearDevicePasswordFromProfile(){
  const { mob, empObjId } = _sessionSecurityIds();
  _clearDevicePassword(empObjId, mob);
  toast(L('Device password हटा दिया','Device password removed'));
  closeModal();
  setTimeout(()=>{ try{ openAppAccessSecurity(); }catch(e){} }, 250);
}

async function showProfile(){
 try{
  const e=myEmp();
  if(isAdmin()){
    openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="padding:10px 0">
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:44px;margin-bottom:8px">🛡️</div>
        <div style="font-size:18px;font-weight:900;color:#fff">${escHtml(SESSION.name)}</div>
        <div style="font-size:12px;color:var(--muted2);margin-top:4px">Admin — Full Access</div>
      </div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:10px">Quick Actions</div>
      <button class="profile-action" onclick="closeModal();goTab('pending')">
        <div class="pa-icon" style="background:rgba(56,189,248,.12)">⏳</div>
        <div><div class="pa-label">Pending Approvals</div><div class="pa-sub">Login, Leave, Device requests</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openExtendAccessModal()">
        <div class="pa-icon" style="background:rgba(168,85,247,.12)">🔄</div>
        <div><div class="pa-label">User Access Extend</div><div class="pa-sub">${typeof L==='function'?L('Validity बढ़ाएं','Extend validity'):'Extend validity'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();if(typeof openAppLicenseAdmin==='function')openAppLicenseAdmin();else toast('Update app to latest version');">
        <div class="pa-icon" style="background:rgba(124,58,237,.12)">🔑</div>
        <div><div class="pa-label">${typeof L==='function'?L('App License / Expiry','App License / Expiry'):'App License / Expiry'}</div><div class="pa-sub">${typeof L==='function'?L('पूरी App की expiry date','Whole app expiry date'):'Whole app expiry date'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openPaymentSettingsAdmin()">
        <div class="pa-icon" style="background:rgba(234,88,12,.12)">💳</div>
        <div><div class="pa-label">${typeof L==='function'?L('Payment Link & Reminders','Payment Link & Reminders'):'Payment Link & Reminders'}</div><div class="pa-sub">${typeof L==='function'?L('₹999/month · link · paid-until dates','₹999/month · link · paid-until dates'):'₹999/month · link · paid-until dates'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openShareAppLinkAdmin()">
        <div class="pa-icon" style="background:rgba(59,130,246,.12)">🔗</div>
        <div><div class="pa-label">${typeof L==='function'?L('Share App Link','Share App Link'):'Share App Link'}</div><div class="pa-sub">${typeof L==='function'?L('Play Store / custom link for Share button','Play Store / custom link for Share button'):'Play Store / custom link for Share button'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openCustomerCareAdmin()">
        <div class="pa-icon" style="background:rgba(16,185,129,.12)">🎧</div>
        <div><div class="pa-label">${typeof L==='function'?L('Customer Care','Customer Care'):'Customer Care'}</div><div class="pa-sub">${typeof L==='function'?L('Name · Email · WhatsApp · 7-day refund text','Name · Email · WhatsApp · 7-day refund text'):'Name · Email · WhatsApp · 7-day refund text'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openTabVisibilitySettings()">
        <div class="pa-icon" style="background:rgba(14,116,144,.12)">🔭</div>
        <div><div class="pa-label">Tab Visibility</div><div class="pa-sub">Guest tab access control</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openSecuritySettings()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🔐</div>
        <div><div class="pa-label">Security Status</div><div class="pa-sub">Device & session info</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openAdminAnalytics()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">📊</div>
        <div><div class="pa-label">App Analytics</div><div class="pa-sub">Users, active logins, Managers</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action" onclick="closeModal();openDeviceLoginList()">
        <div class="pa-icon" style="background:rgba(56,189,248,.12)">📱</div>
        <div><div class="pa-label">Device / Mobile Logins</div><div class="pa-sub">Date · Time · Name · Mobile · Company</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action" onclick="openHolidayListModal()">
        <div class="pa-icon" style="background:rgba(245,158,11,.12)">📅</div>
        <div><div class="pa-label">Holiday List</div><div class="pa-sub">Date + Reason · Excel / Auto-fetch All-India</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action danger" onclick="doLogout()" style="margin-top:4px">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div><div class="pa-sub">${typeof L==='function'?L('सभी sessions साफ़ करें','Clear all sessions'):'Clear all sessions'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
    </div>`);
  } else if(isGuest()){
    openModal(`<div class="modal-handle"></div>
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:44px;margin-bottom:8px">👤</div>
      <div style="font-size:18px;font-weight:900;color:#fff">${escHtml(SESSION.name)}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:4px">Guest Access</div>
      <button class="profile-action danger" onclick="doLogout()" style="margin-top:16px;justify-content:center">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div></div>
      </button>
    </div>`);
  } else {
    // Paid-till = subscription date set by Admin (paymentPaidUntil / paidUntil), NOT App License
    let daysLeft = 0, expiryStr = '', expiryDate = '', hasExpiry = false;
    try{
      let paidIso = '';
      const mobileKey = (typeof _normMobileKey==='function') ? _normMobileKey(SESSION.mobile||'') : String(SESSION.mobile||'').replace(/\D/g,'').slice(-10);
      // 1) SESSION cache
      paidIso = SESSION.paymentPaidUntil || SESSION.paidUntil || window._userPaymentPaidUntil || '';
      // 2) mobileUsers record (manager or member)
      if(!paidIso && mobileKey){
        const rec = await fbGet('mobileUsers/' + mobileKey);
        if(rec){
          paidIso = rec.paymentPaidUntil || rec.paidUntil || rec.validTill || '';
          // Member: fall back to manager's paid-until (team subscription)
          if(!paidIso && rec.managerId){
            try{
              const mgr = await fbGet('mobileUsers/' + String(rec.managerId).replace(/\D/g,'').slice(-10));
              if(mgr) paidIso = mgr.paymentPaidUntil || mgr.paidUntil || '';
            }catch(e2){}
          }
        }
      }
      // 3) deviceApprovals fallback
      if(!paidIso){
        const empObjId = (typeof myEmp==='function' && myEmp()?.id) || SESSION.empObjId;
        if(empObjId){
          const approval = await fbGet('deviceApprovals/' + empObjId);
          if(approval) paidIso = approval.paymentPaidUntil || approval.paidUntil || approval.validTill || '';
        }
      }
      if(paidIso){
        const d = new Date(paidIso);
        if(!isNaN(d.getTime())){
          hasExpiry = true;
          daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
          expiryDate = d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'numeric',month:'short',year:'numeric'});
          expiryStr = expiryDate;
        }
      }
    }catch(ex){}
    const color = !hasExpiry?'#22c55e':daysLeft<=7?'#f43f5e':daysLeft<=15?'#f97316':'#22c55e';
    const icon  = !hasExpiry?'🟢':daysLeft<=0?'🔴':daysLeft<=7?'⚠️':'🟢';
    const msg = !hasExpiry
      ? ((typeof L==='function')?L('कोई Expiry तय नहीं है','No expiry set'):'No expiry set')
      : daysLeft<=0
        ? ((typeof L==='function')?L('Subscription समाप्त — भुगतान करें','Subscription expired — please pay'):'Subscription expired — please pay')
        : daysLeft<=7
          ? ((typeof L==='function')?L('सिर्फ '+daysLeft+' दिन बाकी','Only '+daysLeft+' days left'):('Only '+daysLeft+' days left'))
          : ((typeof L==='function')?L(daysLeft+' दिन बाकी', daysLeft+' days left'):(daysLeft+' days left'));
    const empRec = myEmp();
    const secLabel = empRec ? (secName(empRec.sec) || empRec.sec) : '';
    const roleLabel = isMgr()?'🏅 Manager':isSupervisor()?'👁️ Supervisor':'👤 User';
    openModal(`<div class="modal-handle"></div>
    <div class="modal-scroll-body" style="text-align:center;padding:10px 0">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#f97316,#a855f7);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:28px;font-weight:900;color:#fff;font-family:'Barlow Condensed',sans-serif;overflow:hidden">${SESSION.photoUrl?`<img src="${SESSION.photoUrl}" style="width:100%;height:100%;object-fit:cover">`:(SESSION.name||'?').split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
      <div style="font-size:20px;font-weight:900;color:#fff">${escHtml(SESSION.name)}</div>
      <div style="font-size:12px;color:var(--muted2);margin-top:4px">${(SESSION.role==='manager'||SESSION.role==='member')?(function(){ const s=String(SESSION.mobile||'').replace(/\s/g,''); if(s.startsWith('+91')&&s.length>=13) return '📱 +91 '+s.slice(3,8)+' '+s.slice(8); if(s.length===10) return '📱 +91 '+s.slice(0,5)+' '+s.slice(5); return '📱 '+(SESSION.mobile||'—'); })():escHtml((SESSION.empId||'—')+' · '+secLabel)}</div>
      <div style="margin-top:6px"><span style="background:rgba(249,115,22,.15);color:#f97316;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:800">${roleLabel}</span></div>
      ${(function(){
        const er = empRec||{};
        const rows = [
          [L('Emp Code','Emp Code'), er.empId||er.code||SESSION.empId||'—'],
          [L('जन्म तिथि','DOB'), (function(){ const v=er.dob; if(!v)return '—'; const d=new Date(v); return isNaN(d)?String(v):d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'2-digit',month:'short',year:'numeric'}); })()],
          [L('जॉइनिंग','Date of Joining'), (function(){ const v=er.joiningDate||er.doj; if(!v)return '—'; const d=new Date(v); return isNaN(d)?String(v):d.toLocaleDateString((typeof mpLocale==='function'?mpLocale():'en-IN'),{day:'2-digit',month:'short',year:'numeric'}); })()],
          [L('सैलरी','Salary'), (function(){ const n=er.salary??er.monthlySalary; if(n==null||n==='')return '—'; const num=Number(String(n).replace(/[^\d.]/g,'')); return isNaN(num)?('₹ '+n):('₹ '+num.toLocaleString('en-IN')); })()],
          [L('वीकली ऑफ','Weekly Off'), er.woff||'—'],
          [L('पद','Designation'), er.designation||'—'],
          [L('सेक्शन','Section'), secLabel||er.sec||'—'],
        ];
        return '<div style="background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:12px 14px;margin:14px 0;text-align:left">'
          +'<div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;margin-bottom:8px">'+(L('मेरी जानकारी','MY DETAILS'))+'</div>'
          +rows.map(([k,v])=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px"><span style="color:var(--muted2)">'+k+'</span><span style="color:var(--text);font-weight:700">'+v+'</span></div>').join('')
          +'</div>';
      })()}
      ${(SESSION.role==='manager'||SESSION.role==='member')?`<button class="profile-action" style="margin-top:6px" onclick="openLeaveBalanceModal()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🏖️</div>
        <div><div class="pa-label">${L('Leave Balance','Leave Balance')}</div><div class="pa-sub">${L('All leave types & remaining','All leave types & remaining')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${(SESSION.role==='manager'||SESSION.role==='member')?`<button class="profile-action" style="margin-top:6px" onclick="openEditProfileModal()">
        <div class="pa-icon" style="background:rgba(96,165,250,.12)">✏️</div>
        <div><div class="pa-label">${L('Profile Edit करें','Edit Profile')}</div><div class="pa-sub">${L('नाम, DOB, जॉइनिंग, सैलरी, वीकली ऑफ','Name, DOB, DOJ, Salary, Weekly Off')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${(SESSION.role==='manager'||SESSION.role==='member'||SESSION.role==='worker')?`<button class="profile-action" style="margin-top:6px" onclick="openAppAccessSecurity()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">🔐</div>
        <div><div class="pa-label">${L('ऐप एक्सेस सुरक्षा','App Access Security')}</div><div class="pa-sub">${L('इस device का Password और Fingerprint','Password & Fingerprint for this device')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}

      <div role="button" tabindex="0" onclick="typeof openMemberPayPlans==='function'&&openMemberPayPlans()" style="cursor:pointer;background:var(--panel);border:1.5px solid ${daysLeft<=7?color:'var(--border2)'};border-radius:14px;padding:16px;margin:16px 0;text-align:left">
        <div style="font-size:11px;color:var(--muted2);font-weight:700;letter-spacing:1px;margin-bottom:6px">${L('भुगतान वैध तक','Paid till')} · ${L('टैप करें भुगतान के लिए','Tap to pay')}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:28px">${icon}</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:${color};font-family:'Barlow Condensed',sans-serif">${msg}</div>
            ${expiryStr?`<div style="font-size:11px;color:var(--muted2);margin-top:2px">${L('भुगतान तक: ','Paid till: ')}${expiryStr}</div>`:''}
          </div>
        </div>
      </div>
      ${isMgr()?`<button type="button" class="profile-action" onclick="openShiftSettings()">
        <div class="pa-icon" style="background:rgba(168,85,247,.12)">⚙️</div>
        <div><div class="pa-label">M/c &amp; Shift Setting</div><div class="pa-sub">${L('Shifts & Section/Machine minimums','Shifts & min staff by Section/Machine')}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button type="button" class="profile-action" onclick="openHolidayListModal()">
        <div class="pa-icon" style="background:rgba(245,158,11,.12)">📅</div>
        <div><div class="pa-label">Holiday List</div><div class="pa-sub">${L('Date + Reason · Excel / Auto-fetch All-India','Date + Reason · Excel / Auto-fetch All-India')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${isMgr()?`<button type="button" class="profile-action" onclick="openLeaveQuotaSettings()">
        <div class="pa-icon" style="background:rgba(34,197,94,.12)">📋</div>
        <div><div class="pa-label">Team Leave Quota</div><div class="pa-sub">Yearly leave types for team</div></div>
        <div class="pa-arrow">›</div>
      </button>
`:''}
      ${(SESSION.role==='manager'||isMgr())?`<button type="button" class="profile-action" onclick="openChangeCompanyModal()">
        <div class="pa-icon" style="background:rgba(96,165,250,.12)">🏢</div>
        <div><div class="pa-label">${L('Company Name बदलें','Change Company Name')}</div><div class="pa-sub">${L('वर्तमान: ','Current: ')}${escHtml(SESSION.company||'—')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      ${isMgr()?`<button type="button" class="profile-action" onclick="openLeaveTeamModal()" style="border-color:rgba(244,63,94,.35)">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">👋</div>
        <div><div class="pa-label">${L('Leave team / Transfer Manager','Leave team / Transfer Manager')}</div><div class="pa-sub">${L('किसी सदस्य को नया Manager बनाकर टीम छोड़ें','Promote a member and leave the team')}</div></div>
        <div class="pa-arrow">›</div>
      </button>`:''}
      <button class="profile-action" onclick="closeModal();openCustomerCarePage()">
        <div class="pa-icon" style="background:rgba(16,185,129,.12)">🎧</div>
        <div><div class="pa-label">${typeof L==='function'?L('Customer Care','Customer Care'):'Customer Care'}</div><div class="pa-sub">${typeof L==='function'?L('Help · Cancel · 7-day refund','Help · Cancel · 7-day refund'):'Help · Cancel · 7-day refund'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
      <button class="profile-action danger" onclick="doLogout()">
        <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
        <div><div class="pa-label">Logout</div><div class="pa-sub">${typeof L==='function'?L('सभी sessions साफ़ करें','Clear all sessions'):'Clear all sessions'}</div></div>
        <div class="pa-arrow">›</div>
      </button>
    </div>`);
  }
 }catch(ex){
   console.error('showProfile error:',ex);
   openModal(`<div class="modal-handle"></div>
   <div style="text-align:center;padding:10px 0">
     <div style="font-size:18px;font-weight:900;color:#fff">${escHtml(SESSION.name||'—')}</div>
     <button class="profile-action danger" onclick="doLogout()" style="margin-top:16px;justify-content:center">
       <div class="pa-icon" style="background:rgba(244,63,94,.12)">🚪</div>
       <div><div class="pa-label">Logout</div></div>
     </button>
   </div>`);
 }
}


// ════════════════════════════════════════
// MANAGER LEAVES TEAM — automated handoff
// ════════════════════════════════════════
/** Rank team members for automatic Manager succession */
function _rankManagerSuccessors(){
  const oldKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  const team = getEmps().filter(e => e.status!=='resigned' && e.status!=='left' && !isManagerSelfRecord(e));
  return team.map(e=>{
    const ph = _normMobileKey(e.phone||e.mobile||'');
    let score = 0;
    const reasons = [];
    if(ph.length===10){ score += 50; reasons.push('mobile'); }
    else reasons.push('no-mobile');
    const p = e.perms||{};
    if(p.schedule){ score += 15; reasons.push('schedule'); }
    if(p.leave){ score += 10; reasons.push('leave'); }
    if(p.reports){ score += 10; reasons.push('reports'); }
    if(e.accessLevel==='manager' || e.isTeamManager){ score += 20; reasons.push('access'); }
    const des = String(e.designation||e.resp||'').toLowerCase();
    if(/manager|supervisor|sr\.|senior|incharge|in-charge/.test(des)){ score += 12; reasons.push('title'); }
    if(e.joiningDate){
      const yrs = (Date.now() - new Date(e.joiningDate).getTime()) / (365.25*864e5);
      if(yrs >= 2){ score += 8; reasons.push('senior'); }
      else if(yrs >= 1){ score += 4; }
    }
    return { emp: e, phone: ph, score, reasons, eligible: ph.length===10 };
  }).sort((a,b)=> b.score - a.score || (a.emp.name||'').localeCompare(b.emp.name||''));
}


async function openChangeCompanyModal(){ /* profile */
  if(SESSION.role!=='manager' && !isAdmin()){ toast(L('❌ Manager only','❌ Manager only')); return; }
  const isEn = (_lang !== 'hi');
  const cur = SESSION.company || '';
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">🏢 ${L('Company Name बदलें','Change Company Name')}</div>
    <div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">
      ${L('वर्तमान:','Current:')} <b style="color:var(--text)">${(cur||'—').replace(/</g,'&lt;')}</b>
    </div>
    <label style="font-size:11px;color:var(--muted2);font-weight:700">${L('नया Company नाम','New company name')}</label>
    <input class="inp-field" id="chgCompanyName" value="${String(cur).replace(/"/g,'&quot;')}" placeholder="${L('जैसे: Man Power','e.g. Man Power / ABC Industries')}" style="margin:8px 0 14px;width:100%;box-sizing:border-box">
    <button class="submit-btn" onclick="saveChangeCompanyName()">✅ ${L('Save करें','Save')}</button>
    <button class="cancel-btn" style="margin-top:8px" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
  setTimeout(()=>document.getElementById('chgCompanyName')?.focus(), 100);
}

async function saveChangeCompanyName(){
  const isEn = (_lang !== 'hi');
  const name = (document.getElementById('chgCompanyName')?.value||'').trim();
  if(!name || name.length < 2){ toast(L('⚠️ सही Company नाम डालें','⚠️ Enter a valid company name')); return; }
  try{
    if(typeof _ensureWriteAuth==='function'){
      const ok = await _ensureWriteAuth();
      if(!ok){ toast(L('❌ पहले इस device पर Phone verify करें','❌ Phone verify on this device first')); return; }
    }
    const mob = _normMobileKey(SESSION.mobile||SESSION.uid||'');
    if(!mob){ toast('❌ Mobile not found in session'); return; }
    await fbUpdate('mobileUsers/'+mob, { company: name, companyUpdatedAt: new Date().toISOString() });
    try{ await fbUpdate('managers/'+mob, { company: name }); }catch(e){}
    SESSION.company = name;
    try{ SESSION.companyId = (typeof _normCompanyId==='function') ? _normCompanyId(name) : name; }catch(e){ SESSION.companyId = name; }
    try{ saveSession(); }catch(e){}
    // Propagate new name to all team employee records so Admin company list is not stale
    let synced = 0;
    try{ if(typeof _syncCompanyLabelToTeam==='function') synced = await _syncCompanyLabelToTeam(name); }catch(e){}
    toast(isEn?('✅ Company name updated'+(synced?' · '+synced+' team records':'')):('✅ Company नाम update'+(synced?' · '+synced+' team':'')));
    closeModal();
    try{ if(typeof renderCompanySwitcher==='function') renderCompanySwitcher(); }catch(e){}
    try{ showProfile(); }catch(e){}
  }catch(e){
    console.error('[saveChangeCompanyName]', e);
    toast('❌ '+(e.message||e)+L(' — Phone OTP verify करके फिर try करें',' — verify phone OTP and try again'));
  }
}

try{ window.openChangeCompanyModal = openChangeCompanyModal; window.saveChangeCompanyName = saveChangeCompanyName; }catch(e){}

function openLeaveTeamModal(){
  if(!isMgr()){ toast('❌ Only Manager'); return; }
  const ranked = _rankManagerSuccessors();
  const eligible = ranked.filter(r=>r.eligible);
  if(!eligible.length){
    openModal(`<div class="modal-handle"></div>
      <div class="modal-title">👋 Automated Manager Handoff</div>
      <div style="font-size:13px;color:var(--muted2);line-height:1.65;margin-bottom:14px">
        No team member has a <b style="color:var(--text)">10-digit mobile</b>. Add mobile numbers on Team, then handoff can run automatically.
      </div>
      <button class="cancel-btn" onclick="closeModal()">Close</button>`);
    return;
  }
  const best = eligible[0];
  const opts = eligible.map((r,i)=>
    `<option value="${r.emp.id}"${i===0?' selected':''}>${i===0?'⭐ ':''}${escHtml(r.emp.name)} (${escHtml(r.emp.empId||'—')}) · ${escHtml(r.phone)} · score ${r.score}</option>`
  ).join('');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">👋 Automated Manager Handoff</div>
    <div style="font-size:13px;color:var(--muted2);line-height:1.65;margin-bottom:12px">
      System recommends the best successor and will:
      <ul style="margin:8px 0 0 18px;padding:0">
        <li>Move <b style="color:var(--text)">entire team</b> under the new Manager</li>
        <li>Promote them to <b style="color:var(--text)">approved Manager</b> (OTP login)</li>
        <li>Copy shift settings</li>
        <li>Mark you as <b style="color:#fbbf24">left_team</b> (next login = fresh user)</li>
        <li>Notify the new Manager (app + WhatsApp if possible)</li>
      </ul>
    </div>
    <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-size:11px;font-weight:800;color:#22c55e;margin-bottom:4px">RECOMMENDED</div>
      <div style="font-size:16px;font-weight:900;color:var(--text)">${escHtml(best.emp.name)}</div>
      <div style="font-size:12px;color:var(--muted2)">📱 ${escHtml(best.phone)} · Emp ${escHtml(best.emp.empId||'—')} · score ${best.score}
        ${best.reasons.length?` · ${escHtml(best.reasons.join(', '))}`:''}</div>
    </div>
    <div class="field">
      <label>New Manager (auto-ranked — change if needed)</label>
      <select class="inp-field" id="leaveTeamSuccessor">${opts}</select>
    </div>
    <div class="field">
      <label>Double-check — type <b style="color:#f43f5e">LEAVE</b> to confirm</label>
      <input class="inp-field" id="leaveTeamConfirm" placeholder="LEAVE" autocomplete="off"
        style="letter-spacing:2px;font-weight:800;text-transform:uppercase">
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      <button class="big-btn green" onclick="confirmLeaveTeamTransfer(true)">⚡ Handoff recommended (after LEAVE)</button>
      <button class="big-btn red" onclick="confirmLeaveTeamTransfer(false)">Transfer selected & leave</button>
      <button class="cancel-btn" onclick="closeModal()">Cancel</button>
    </div>
    <div id="leaveTeamProgress" style="display:none;margin-top:12px;font-size:12px;color:var(--muted2);line-height:1.5"></div>`);
}

async function confirmLeaveTeamTransfer(useRecommended){
  if(!isMgr()){ toast('❌ Only Manager'); return; }
  const conf = (document.getElementById('leaveTeamConfirm')?.value||'').trim().toUpperCase();
  if(conf !== 'LEAVE'){
    toast('⚠️ Type LEAVE to confirm — prevents accidental handoff');
    try{ document.getElementById('leaveTeamConfirm')?.focus(); }catch(e){}
    return;
  }
  const ranked = _rankManagerSuccessors();
  const eligible = ranked.filter(r=>r.eligible);
  if(!eligible.length){ toast('❌ No eligible successor'); return; }

  let succId = document.getElementById('leaveTeamSuccessor')?.value;
  if(useRecommended) succId = eligible[0].emp.id;
  if(!succId){ toast('⚠️ Select new Manager'); return; }

  const oldKey = _normMobileKey(SESSION.mobile||SESSION.uid||'');
  if(!oldKey){ toast('❌ Manager mobile missing'); return; }

  const team = getEmps();
  const succ = team.find(e=>e.id===succId) || (_cache.employees||[]).find(e=>e.id===succId);
  if(!succ){ toast('❌ Member not found'); return; }
  const newKey = _normMobileKey(succ.phone||succ.mobile||'');
  if(newKey.length !== 10){
    toast('❌ Selected member needs a valid 10-digit mobile');
    return;
  }

  const prog = document.getElementById('leaveTeamProgress');
  const setProg = (msg)=>{ if(prog){ prog.style.display='block'; prog.textContent = msg; } };
  document.querySelectorAll('.modal-box .big-btn, .modal .big-btn').forEach(b=>{ b.disabled = true; });

  try{
    // Phone Auth required — rules check auth.token.phone_number
    if(typeof _ensureWriteAuth==='function'){
      setProg('0/6 · Verifying phone login…');
      const authOk = await _ensureWriteAuth();
      if(!authOk){
        toast('❌ Phone OTP verify required — Manager must complete OTP, then retry handoff');
        setProg('Failed: need phone OTP (not device-password only)');
        document.querySelectorAll('.modal-box .big-btn, .modal .big-btn').forEach(b=>{ b.disabled = false; });
        return;
      }
    }
    setProg('1/6 · Transferring team roster…');
    const toTransfer = team.length ? team : (_cache.employees||[]).filter(e=>e.managerId===oldKey);
    let n = 0;
    const updates = {};
    for(const e of toTransfer){
      updates['employees/'+e.id+'/managerId'] = newKey;
      updates['employees/'+e.id+'/previousManagerId'] = oldKey;
      updates['employees/'+e.id+'/managerTransferredAt'] = new Date().toISOString();
      n++;
    }
    updates['employees/'+succ.id+'/managerId'] = newKey;
    updates['employees/'+succ.id+'/accessLevel'] = 'manager';
    updates['employees/'+succ.id+'/role'] = 'manager';
    updates['employees/'+succ.id+'/isTeamManager'] = true;
    updates['employees/'+succ.id+'/perms'] = { schedule:true, leave:true, reports:true };
    // RTDB multi-path update via root
    try{
      await window._fbAccess('update', '/', updates);
    }catch(batchErr){
      console.warn('batch transfer fallback', batchErr);
      for(const e of toTransfer){
        try{
          await fbUpdate('employees/'+e.id, {
            managerId: newKey,
            previousManagerId: oldKey,
            managerTransferredAt: new Date().toISOString()
          });
        }catch(ex){}
      }
      await fbUpdate('employees/'+succ.id, {
        managerId: newKey,
        accessLevel: 'manager',
        role: 'manager',
        perms: { schedule:true, leave:true, reports:true },
        isTeamManager: true
      });
    }

    setProg('2/6 · Promoting new Manager login…');
    let succUser = null;
    try{ succUser = await fbGet('mobileUsers/'+newKey); }catch(e){}
    // Employee row is source of truth for team ownership — always promote here
    try{
      await fbUpdate('employees/'+succ.id, {
        role: 'manager',
        accessLevel: 'manager',
        isTeamManager: true,
        managerId: newKey,
        perms: { schedule:true, leave:true, reports:true },
        updatedAt: new Date().toISOString()
      });
    }catch(eEmp){ console.warn('[handoff] emp promote', eEmp); }
    try{
      await fbSet('mobileUsers/'+newKey, {
        ...(succUser||{}),
        role: 'manager',
        name: succ.name || succUser?.name || 'Manager',
        mobile: newKey,
        company: SESSION.company || succUser?.company || '',
        companyId: SESSION.companyId || succUser?.companyId || '',
        status: 'approved',
        empId: succ.empId || '',
        empObjId: succ.id,
        approvedAt: new Date().toISOString(),
        approvedBy: 'auto_handoff:'+(SESSION.name||oldKey),
        transferredFrom: oldKey,
        managerSince: new Date().toISOString()
      });
    }catch(eMu){
      console.warn('[handoff] mobileUsers promote failed — roster still under new manager via employees', eMu);
      toast('⚠️ Manager login role may need Admin → Promote / Repair managers');
    }

    setProg('3/6 · Updating members’ mobile accounts…');
    try{
      const allMU = await fbGet('mobileUsers') || {};
      for(const [mob, rec] of Object.entries(allMU)){
        if(!rec || typeof rec !== 'object') continue;
        if(String(rec.managerId||'') === oldKey || String(rec.managerId||'') === '+91'+oldKey){
          try{
            await fbUpdate('mobileUsers/'+mob, {
              managerId: newKey,
              managerName: succ.name,
              previousManagerId: oldKey
            });
          }catch(ex){}
        }
      }
    }catch(ex){ console.warn('mu transfer', ex); }

    setProg('4/6 · Copying shift settings, logo & leave quotas…');
    try{
      const oldCfgKey = ('mgr:'+oldKey).replace(/[:.#$\[\]]/g,'_');
      const newCfgKey = ('mgr:'+newKey).replace(/[:.#$\[\]]/g,'_');
      const cfg = await fbGet('shiftConfigs/'+oldCfgKey);
      if(cfg){
        await fbSet('shiftConfigs/'+newCfgKey, {
          ...cfg,
          transferredFrom: oldKey,
          transferredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        // Ensure logo is present for new manager profile UI
        if(cfg.companyLogo){
          try{ await fbUpdate('mobileUsers/'+newKey, { companyLogo: cfg.companyLogo, teamLogo: cfg.companyLogo }); }catch(e){}
        }
      }
    }catch(ex){ console.warn('cfg transfer', ex); }
    // Leave quotas (manager settings)
    try{
      const oldLq = 'leaveQuotas/'+(('mgr:'+oldKey).replace(/[:.#$\[\]]/g,'_'));
      const newLq = 'leaveQuotas/'+(('mgr:'+newKey).replace(/[:.#$\[\]]/g,'_'));
      // also try raw mobile keys used by openLeaveQuotaSettings
      const paths = [
        ['leaveQuotas/'+oldKey, 'leaveQuotas/'+newKey],
        [oldLq, newLq]
      ];
      for(const [from,to] of paths){
        try{
          const q = await fbGet(from);
          if(q && typeof q==='object'){
            await fbSet(to, { ...q, transferredFrom: oldKey, transferredAt: new Date().toISOString() });
          }
        }catch(e1){}
      }
    }catch(ex){ console.warn('leaveQuotas transfer', ex); }

    setProg('5/6 · Closing your Manager access…');
    // Mark old manager employee as left_team + archive
    try{
      const selfEmp = (_cache.employees||[]).find(e=>_normMobileKey(e.phone||e.mobile||'')===oldKey)
        || (typeof myEmp==='function' && myEmp()) || null;
      if(selfEmp && selfEmp.id){
        await fbUpdate('employees/'+selfEmp.id, {
          status: 'left_team',
          role: 'member',
          accessLevel: 'worker',
          managerId: newKey,
          leftAt: new Date().toISOString(),
          leftReason: 'auto_manager_handoff',
          active: false,
          updatedAt: new Date().toISOString()
        });
        await fbSet('leftEmployees/'+selfEmp.id, {
          ...selfEmp,
          status: 'left_team',
          leftAt: new Date().toISOString(),
          leftReason: 'auto_manager_handoff',
          transferredTo: newKey,
          transferredToName: succ.name,
          archivedAt: Date.now()
        }).catch(()=>{});
      }
    }catch(ex){ console.warn('old emp leave', ex); }
    // Wipe mobileUsers so next OTP = fresh Manager/Member registration
    try{
      await fbRemove('mobileUsers/'+oldKey);
    }catch(e){
      try{
        await fbSet('mobileUsers/'+oldKey, {
          status: 'removed',
          role: 'removed',
          forceFreshLogin: true,
          leftAt: new Date().toISOString(),
          leftReason: 'auto_manager_handoff',
          transferredTo: newKey,
          transferredToName: succ.name,
          clearedAt: new Date().toISOString()
        });
      }catch(e2){}
    }

    setProg('6/6 · Notifying new Manager…');
    try{
      await fbPush('adminNotifications', {
        type: 'manager_left_team',
        message: (SESSION.name||oldKey)+' auto-handoff → '+(succ.name||newKey),
        from: oldKey, to: newKey, at: new Date().toISOString()
      });
    }catch(e){}
    try{
      await fbPush('userNotifications/'+newKey, {
        type: 'became_manager',
        title: '🏅 You are now Manager',
        body: (SESSION.name||'Previous manager')+' transferred the team to you automatically. You manage schedule, leave, and members.',
        read: false,
        at: new Date().toISOString()
      });
      if(succ.id) await fbPush('userNotifications/'+succ.id, {
        type: 'became_manager',
        title: '🏅 You are now Manager',
        body: (SESSION.name||'Previous manager')+' transferred the team to you.',
        read: false,
        at: new Date().toISOString()
      });
    }catch(e){}

    // WhatsApp to new manager (user gesture from button click)
    try{
      const waMsg = `🏅 *Man Power — You are now Manager*\n\n`+
        `नमस्ते *${escHtml(succ.name)}*,\n\n`+
        `*${escHtml(SESSION.name||'Previous manager')}* ने team आपको transfer कर दी है।\n\n`+
        `📱 Login: +91 ${newKey}\n`+
        `👥 Members transferred: ${n}\n\n`+
        `App खोलकर Manager के रूप में login करें।\n_— MET_`;
      openWA(newKey, waMsg);
    }catch(e){}

    closeModal();
    toast('✅ Handoff complete → '+succ.name+' ('+n+' members). Logging out…');
    setTimeout(()=>{ try{ doLogout(); }catch(e){ location.reload(); } }, 1000);
  }catch(err){
    console.error('leave team', err);
    toast('❌ Handoff failed: '+(err.message||err));
    setProg('Failed: '+(err.message||err));
    document.querySelectorAll('.modal-box .big-btn, .modal .big-btn').forEach(b=>{ b.disabled = false; });
  }
}

function openExtendAccessModal(){
  const emps = getEmps();
  const empOptions = emps.map(e=>`<option value="${e.id}|${escHtml(e.empId)}">${escHtml(e.name)} (${escHtml(e.empId||'—')})</option>`).join('');
  const defaultDate = new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  openModal(`<div class="modal-handle"></div>
  <div class="modal-title">⏳ Access Extend / Expiry</div>
  <div class="field"><label>कर्मचारी</label>
    <select class="inp-field" id="ext_emp">${empOptions}</select></div>
  <div class="field"><label>Exact expiry date</label>
    <input type="date" class="inp-field" id="ext_date" value="${defaultDate}">
  </div>
  <div class="field"><label>या कितने दिन?</label>
    <select class="inp-field" id="ext_days" onchange="(function(s){var d=new Date();d.setDate(d.getDate()+parseInt(s.value||365,10));var el=document.getElementById('ext_date');if(el)el.value=d.toISOString().slice(0,10);})(this)">
      <option value="365" selected>${L('365 दिन (1 साल) — Standard','365 days (1 year) — Standard')}</option>
      <option value="180">${L('180 दिन (6 महीने)','180 days (6 months)')}</option>
      <option value="90">${L('90 दिन','90 days')}</option>
      <option value="45">${L('45 दिन','45 days')}</option>
      <option value="730">${L('730 दिन (2 साल)','730 days (2 years)')}</option>
    </select></div>
  <button class="submit-btn" onclick="doExtendAccess()">✅ ${L('Save Expiry','Save Expiry')}</button>
  <button class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}

async function doExtendAccess(){
  const val = document.getElementById('ext_emp').value;
  if(!val){ toast(L('⚠️ कर्मचारी चुनें','⚠️ Select employee')); return; }
  const [empObjId] = val.split('|');
  const dateStr = (document.getElementById('ext_date')||{}).value;
  if(dateStr){
    const ok = await extendUserExpiry(empObjId, dateStr);
    if(ok) closeModal();
    return;
  }
  const days = parseInt(document.getElementById('ext_days').value)||365;
  const ok = await extendUserExpiry(empObjId, days);
  if(ok) closeModal();
}

// ════════════════════════════════════════
// TABS
// ════════════════════════════════════════
let _currentTab='home';


function _setScheduleSidebarWide(on){
  try{
    const sb = document.getElementById('pcSidebar');
    if(on){
      document.body.classList.add('sched-wide');
      if(sb) sb.classList.add('collapsed');
    }else{
      document.body.classList.remove('sched-wide');
      if(sb) sb.classList.remove('collapsed');
    }
  }catch(e){}
}

function _goTabDirect(t){
  const prev = _currentTab;
  _currentTab=t;
  try{ _setScheduleSidebarWide(t==='schedule'); }catch(e){}
  document.querySelectorAll('.tab').forEach(e=>e.classList.remove('on'));
  const el=document.getElementById('tab-'+t); if(el) el.classList.add('on');
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('on'));
  const nb=document.getElementById('nb-'+t); if(nb) nb.classList.add('on');
  // Sync PC sidebar active state
  document.querySelectorAll('.pc-nav-btn').forEach(b=>b.classList.remove('on'));
  const pcnb=document.getElementById('pc-nb-'+t); if(pcnb) pcnb.classList.add('on');
  if(t==='home')         renderHome();
  if(t==='myshift')      renderMyShift();
  if(t==='todo')         renderTodo();
  if(t==='schedule')     { schedOff=(typeof _schedDefaultOff==='function'?_schedDefaultOff():-5); _customRangeActive=false; try{ _updateSchedAdminVisibility(); }catch(e){} renderSchedule(); setTimeout(syncStickyTop,100); setTimeout(syncStickyTop,400); }
  if(t==='leave')        { try{ renderLeaves(); }catch(e){ console.warn('[leave]',e); } try{ renderResignations(); }catch(e){ console.warn('[resign]',e); } }
  if(t==='reports')      renderReports();
  if(t==='pending')      renderPending();
  if(t==='team')         { try{ renderTeam(); }catch(e){ console.warn('[team]',e); } try{ renderAdminTeamHierarchy(); }catch(e){ console.warn('[teamHier]',e); } }
  if(t==='instructions') renderInstructions();
  // Re-apply language so any newly-rendered elements get translated.
  // Run twice — once immediately, once after async renders settle.
  try{ if(typeof applyLang === 'function') applyLang(); }catch(e){}
  setTimeout(()=>{ try{ if(typeof _translateDOM === 'function') _translateDOM(); }catch(e){} }, 250);
  // Android/browser Back: keep in-app history instead of closing the app
  if(!_mpHistoryLock && prev !== t){
    try{
      _mpTabStack.push(prev);
      if(_mpTabStack.length > 30) _mpTabStack.shift();
      history.pushState({ mp:true, tab:t, kind:'tab' }, '');
    }catch(e){}
  }
}

// ── Hardware / browser Back button → last screen (not exit app) ──
let _mpTabStack = [];
let _mpHistoryLock = false;
let _mpHistoryReady = false;

function _mpCloseAnyOverlay(){
  // Main modal
  const ov = document.getElementById('overlay');
  if(ov && ov.classList.contains('open')){ closeModal(); return true; }
  // Named overlays used across the app
  const ids = ['customRangeOverlay','excelUploadOverlay','smsSettingsOverlay','warnOverlay','teamExcelOverlay','playerOverlay'];
  for(const id of ids){
    const el = document.getElementById(id);
    if(el && el.classList.contains('open')){
      el.classList.remove('open');
      return true;
    }
  }
  // Dynamically created confirm / WA overlays
  const dyn = document.getElementById('_waSeqOverlay') || document.querySelector('[style*="z-index:99998"]');
  if(dyn && dyn.parentNode){ try{ dyn.parentNode.removeChild(dyn); }catch(e){} return true; }
  // Learn screen
  const learn = document.querySelector('.learn-screen');
  if(learn && learn.style.display === 'block'){ learn.style.display = 'none'; return true; }
  return false;
}

function _mpOnPopState(ev){
  if(!_mpHistoryReady) return;
  // 1) Close open modal / overlay first
  if(_mpCloseAnyOverlay()){
    try{ history.pushState({ mp:true, tab:_currentTab, kind:'guard' }, ''); }catch(e){}
    return;
  }
  // 2) Go to previous in-app tab
  if(_mpTabStack.length){
    const prev = _mpTabStack.pop();
    _mpHistoryLock = true;
    try{ _goTabDirect(prev); } finally { _mpHistoryLock = false; }
    try{ history.pushState({ mp:true, tab:prev, kind:'tab' }, ''); }catch(e){}
    return;
  }
  // 3) If already at root tab — stay in app (re-push guard state so Back does not exit)
  try{ history.pushState({ mp:true, tab:_currentTab, kind:'guard' }, ''); }catch(e){}
}

function _mpInitHistory(){
  if(_mpHistoryReady) return;
  _mpHistoryReady = true;
  try{ history.replaceState({ mp:true, tab:_currentTab||'home', kind:'root' }, ''); }catch(e){}
  try{ history.pushState({ mp:true, tab:_currentTab||'home', kind:'guard' }, ''); }catch(e){}
  window.addEventListener('popstate', _mpOnPopState);
}

// openModal already pushes history (see definition). Dead string patch removed.

function openNavMoreSheet(){
  const sheet = document.getElementById('navMoreSheet');
  const grid = document.getElementById('navMoreGrid');
  if(!sheet || !grid) return;
  const tabs = window._navMoreTabs || [];
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  let html = tabs.map(t=>{
    const label = en ? (t.lblEn||t.lbl) : t.lbl;
    if(t.action || t.id==='resign'){
      return `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();try{openResignationForm()}catch(e){}" aria-label="${label}">
      <span style="font-size:22px">${t.ico}</span>${label}
    </button>`;
    }
    return `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();goTab('${t.id}')" aria-label="${label}">
      <span style="font-size:22px">${t.ico}</span>${label}
    </button>`;
  }).join('');
  // Always show Customer Care in More
  const ccLabel = en ? 'Customer Care' : 'Customer Care';
  html += `<button type="button" class="nav-more-item" onclick="closeNavMoreSheet();openCustomerCarePage()" aria-label="${ccLabel}">
      <span style="font-size:22px">🎧</span>${ccLabel}
    </button>`;
  grid.innerHTML = html || `<div class="empty-state-sub">${en?'No extra tabs':'और टैब नहीं'}</div>`;
  sheet.classList.add('open');
}
function closeNavMoreSheet(){
  const sheet = document.getElementById('navMoreSheet');
  if(sheet) sheet.classList.remove('open');
}

function goTab(t){
  try{ if(typeof closeNavMoreSheet==='function') closeNavMoreSheet(); }catch(e){}
  // Resign is an action, not a page tab
  if(t==='resign'){ try{ openResignationForm(); }catch(e){} return; }

  if(typeof isPendingMember==='function' && isPendingMember()){
    // Still pending AND no elevated rights
    const allowed = ['home','myshift','todo'];
    if(t && !allowed.includes(t)){
      toast(L('⏳ Manager approve होने तक सिर्फ Home / My Shift / To-Do / Learn उपलब्ध हैं','⏳ Until Manager approves, only Home / My Shift / To-Do / Learn are available'));
      t = 'home';
    }
  }

  // Warn if leaving schedule tab with unsaved changes
  if(_currentTab==='schedule' && t!=='schedule' && Object.keys(_pendingShiftChanges).length>0){
    const n = Object.keys(_pendingShiftChanges).length;
    confirmModal(
      `${n} बदलाव Unsaved हैं!`,
      `आपने ${n} shift${n>1?'s':''} बदले हैं जो अभी save नहीं हुए।<br><br>क्या बिना save किए जाना चाहते हैं?`,
      '🚪 हाँ, बिना Save जाएं',
      '← Schedule पर रहें'
    ).then(ok => {
      if(ok){
        _pendingShiftChanges = {};
        _updateSaveBar();
        _goTabDirect(t);
      }
    });
    return;
  }
  // Payment gate: block tabs except Home / My Shift when unpaid
  _enforcePaymentGate(t);
}

async function _enforcePaymentGate(tab){
  try{
    if(!_isPaymentExemptUser()){
      try{ await _loadPaymentSettings(true); }catch(e){}
      try{ await _hydrateUserPaymentStatus(); }catch(e){}
    }
  }catch(e){}
  if(!_paymentGateAllows(tab)){
    openPaymentRequiredModal(tab);
    return;
  }
  _goTabDirect(tab);
}

function _updateSchedAdminVisibility(){
  const canEdit = (typeof canEditSchedule==='function') ? canEditSchedule() : false;
  // Admin/Manager (or delegated schedule perm): show Create/Upload/Print + View/Edit
  const row = document.getElementById('schedAdminRow');
  if(row) row.style.display = canEdit ? 'flex' : 'none';
  // View/Edit toggle removed — managers + members with perms.schedule always edit
  const modeToggle = document.getElementById('schModeToggle');
  if(modeToggle) modeToggle.style.display = 'none';
  const editBtn = document.getElementById('schModeEdit');
  if(editBtn) editBtn.style.display = 'none';
  const viewBtn = document.getElementById('schModeView');
  if(viewBtn) viewBtn.style.display = 'none';
  const hint = document.getElementById('schedEditHint');
  if(!canEdit){
    window._schedEditMode = false;
    if(hint) hint.style.display = 'none';
  } else {
    window._schedEditMode = true;
    if(hint) hint.style.display = 'none'; // no need — always editable
  }
  // Multi-select only for editors
  const msBtn = document.getElementById('msToggleBtn');
  if(msBtn) msBtn.style.display = canEdit ? '' : 'none';
  // Also update Imp Info button
  const iiBtn = document.getElementById('impInfoBtn');
  if(iiBtn) iiBtn.style.display = (typeof canManageReports==='function' && canManageReports()) ? 'inline-flex' : 'none';
}

function renderAll(){
  // Each step isolated — one failure must not show generic Display error for whole Home
  try{ goTab(_currentTab); }catch(e){ console.error('[renderAll] goTab', e && (e.stack||e.message||e)); }
  try{ updatePendingBadge(); }catch(e){ console.error('[renderAll] pendingBadge', e && (e.stack||e.message||e)); }
  try{ updateTodoBadge(); }catch(e){ console.error('[renderAll] todoBadge', e && (e.stack||e.message||e)); }
  try{ _updateSchedAdminVisibility(); }catch(e){ console.error('[renderAll] schedAdmin', e && (e.stack||e.message||e)); }
  try{ _mpInitHistory(); }catch(e){}
}

// ── Reusable confirm modal (replaces native confirm() dialogs) ──
// Usage: confirmModal('Title', 'Message', 'Yes btn label', 'No btn label') → Promise<boolean>
function confirmModal(title, message, yesLabel='✅ हाँ', noLabel='रद्द करें', yesClass='submit-btn'){
  // Auto-translate all visible text via t() helper
  const _t = (typeof t === 'function') ? t : (s=>s);
  // Default labels also need translation
  const _yesLabel = (typeof L==='function'?L(yesLabel,'✅ Yes'):_t(yesLabel));
  const _noLabel  = (typeof L==='function'?L(noLabel,'Cancel'):_t(noLabel));
  const _title    = _t(title);
  const _message  = _t(message);
  return new Promise(resolve=>{
    const overlay = document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)';
    overlay.innerHTML=`
      <div style="background:var(--bg2);border-radius:20px 20px 0 0;padding:24px 20px 40px;width:100%;max-width:480px;border-top:1px solid var(--border2);animation:slideUp .25s cubic-bezier(.32,0,.15,1)">
        <div style="width:32px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 18px"></div>
        <div style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:10px;text-align:center">${escHtml(_title)}</div>
        <div style="font-size:14px;color:var(--muted2);line-height:1.7;text-align:center;margin-bottom:22px">${escHtml(_message)}</div>
        <button id="_cmYes" style="width:100%;padding:16px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--m1),#c2410c);color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 20px rgba(249,115,22,.3)">${escHtml(_yesLabel)}</button>
        <button id="_cmNo"  style="width:100%;padding:14px;border-radius:12px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">${escHtml(_noLabel)}</button>
      </div>`;
    document.body.appendChild(overlay);
    const cleanup = val=>{ document.body.removeChild(overlay); resolve(val); };
    overlay.querySelector('#_cmYes').addEventListener('click',()=>cleanup(true));
    overlay.querySelector('#_cmNo').addEventListener('click', ()=>cleanup(false));
    overlay.addEventListener('click', e=>{ if(e.target===overlay) cleanup(false); });
  });
}

// ── Debounced refreshAll: prevents 5 Firebase listeners firing 5 rerenders ──
// Only renders once after all listeners settle (300ms window)
let _refreshTimer = null;
let _refreshAllTimer = null;
function refreshAll(){
  // Single debounce — coalesces burst of RTDB listener events
  if(_refreshAllTimer) clearTimeout(_refreshAllTimer);
  _refreshAllTimer = setTimeout(()=>{
    _refreshAllTimer = null;
    try{
      const mc = document.getElementById('mainContent');
      if(!mc || mc.style.display==='none') return;
      try{ if(typeof invalidateShiftCache==='function') invalidateShiftCache(); }catch(e){}
      renderAll();
    }catch(e){ console.warn('refreshAll', e); }
  }, 220);
}
function _refreshAllImpl(){ refreshAll(); }


function updatePendingBadge(){
  try{ if(typeof _loadCompanyLogoToUI==='function') _loadCompanyLogoToUI(); }catch(e){}

  // Update pending tab badge (admin and manager)
  if(isAdminOrMgr()){
    const count = getRegs().filter(r=>r.status==='pending').length
                + getLeaves().filter(l=>l.status==='pending').length
                + getReports().filter(r=>r.status==='pending').length;
    const badge=document.getElementById('pendingBadge');
    if(badge){ badge.textContent=count; badge.style.display=count>0?'flex':'none'; }
    const pcBadge=document.getElementById('pcPendingBadge');
    if(pcBadge){ pcBadge.textContent=count; pcBadge.style.display=count>0?'flex':'none'; }
  }
  // Update bell badge (all users)
  _updateUserNotifBadge();
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
const uid = ()=>'_'+Math.random().toString(36).slice(2,8);
const fmtDate  = s => new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const fmtShort = s => new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
function addDays(s,n){ const d=new Date(s);d.setDate(d.getDate()+n);return d.toISOString().split('T')[0]; }
function dateRange(f,t){ const r=[],d=new Date(f),e=new Date(t);while(d<=e){r.push(d.toISOString().split('T')[0]);d.setDate(d.getDate()+1);}return r; }

// ── EXCEL SHIFT SCHEDULES (Aug 2025 – Mar 2026, parsed from official schedule) ──
const EXCEL_SCHEDULES = {"2025_08":{"e06":["N","N","O","D","D","D","D","L","H","N","O","D","N","N","N","N","O","D","D","L","D","D","C/O","O","N","N","N","C/O","N","N","O"],"e05":["O","D","D","D","D","D","D","O","N","N","N","N","N","O","H","H","L","L","L","L","L","O","N","N","N","N","N","N","O","D","L"],"e25":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","L","L","L","N","N","O","N","N","N","N","N","N"],"e19":["O","N","N","N","N","N","N","O","D","D","D","D","D","O","H","N","N","N","N","N","N","O","D","D","D","D","D","D","O","C/O","C/O"],"e24":["C/O","D","O","D","D","L","D","D","D","O","N","N","N","N","N","H","O","D","D","D","D","D","D","O","N","C/O","C/O","L","L","L","O"],"e22":["N","N","N","O","D","D","D","D","H","O","D","D","D","D","H","D","D","O","D","N","N","N","N","N","O","C/O","D","D","D","N","HLF"],"e14":["N","O","D","D","D","D","L","O","H","N","N","N","N","N","N","O","Ab","D","D","D","D","D","O","N","N","N","N","N","N","O","D"],"e15":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","D","D","O","N","N","N","N","N","N"],"e13":["N","N","N","N","N","O","D","D","D","D","D","D","O","C/O","H","H","N","N","N","O","D","D","D","D","D","D","O","N","L","N","N"],"e10":["D","D","D","D","D","O","D","D","H","L","L","L","O","D","D","D","D","D","D","N","N","O","N","N","N","N","N","O","D","D","D"],"e12":["D","D","D","O","N","N","N","N","H","D","D","D","D","D","D","D","D","O","C/O","N","N","N","N","N","O","D","D","D","D","D","D"],"e01":["N","N","N","N","O","D","D","D","D","D","D","O","N","N","H","H","N","N","O","D","D","D","D","D","D","D","O","N","N","N","N"],"e26":["N","O","D","D","D","D","D","D","H","O","L","L","L","L","H","O","N","N","N","N","N","N","O","D","D","D","D","O","D","D","D"],"e21":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","L","C/O","C/O","C/O","L","O","Ab","N","N","N","N","N","O","D","D","D"],"e04":["D","O","N","N","N","N","N","N","H","O","L","N","L","L","H","H","O","L","L","L","N","O","D","D","D","D","D","D","D","O","N"],"e27":["G","O","G","G","G","G","O","G","H","L","L","L","L","O","H","H","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G"],"e18":["D","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","L","L","O","C/O","C/O","C/O","AB","AB","N","O","D","D","D","D","D"],"e23":["N","N","N","N","N","N","N","N","N","N","N","N","N","C/O","N","N","O","C/O","C/O","C/O","C/O","D","N","O","N","N","N","O","N","N","N"],"e03":["","","","","","","","","","","","G","D","N","N","N","N","N","N","N","O","D","D","D","D","D","D","N","N","N","L"],"e08":["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","G","D"]},"2025_09":{"e06":["D","D","D","D","D","D","O","D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D","D","D","D","O","D","D"],"e05":["D","D","D","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e25":["O","D","D","D","C/O","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","L","O","N"],"e19":["L","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N"],"e24":["L","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","N","O"],"e22":["N","N","N","N","N","N","N","O","D","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N","N","O","C/O"],"e14":["D","D","D","C/O","L","O","Ab","Ab","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e15":["O","D","D","D","C/O","C/O","C/O","O","N","N","N","N","N","N","O","D","D","D","D","L","O","N","N","N","N","N","N","N","O","D"],"e13":["N","N","O","D","HLF","L","L","D","HLF","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N"],"e10":["N","N","O","N","N","N","N","C/O","O","D","D","D","D","N","N","N","N","N","N","O","L","L","L","D","D","D","O","N","N","N"],"e12":["O","D","D","D","N","N","N","N","N","N","L","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N"],"e01":["D","D","D","D","D","D","C/O","C/O","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","D","D","C/O","C/O","O","D"],"e26":["D","D","D","O","D","D","D","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","N","N","N"],"e21":["D","D","D","O","D","D","D","D","O","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D"],"e04":["N","N","N","N","O","D","D","D","D","O","N","N","N","N","O","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e18":["L","C/O","C/O","C/O","L","L","L","O","L","D","D","D","D","N","N","N","N","N","Ab","Ab","O","D","D","D","D","D","D","O","N","N"],"e23":["L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","N","N","O","D","D","D","D","D","L","O"],"e03":["N","N","N","N","N","O","N","N","N","N","N","N","N","O","C/O","C/O","D","D","D","D","O","D","D","N","N","O","D","D","D","D"],"e08":["C/O","C/O","C/O","O","L","N","N","N","N","N","N","N","N","O","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e02":["D","O","D","N","N","N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","C/O","O","N","N","N","N","N"],"e09":["D","D","D","D","D","N","O","N","N","N","N","N","N","N","N","O","L","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e16":["G","D","D","D","D","D","D","D","L","O","L","L","L","D","D","D","O","N","N","N","N","N","Ab","O","D","D","D","D","D","D"],"e20":["G","D","D","D","D","D","D","N","N","N","N","N","O","D","D","D","N","N","C/O","O","N","N","N","N","N","N","O","D","D","D"]},"2025_10":{"e06":["D","D","D","D","O","D","C/O","D","D","GP","L","O","D","HLF","N","N","N","N","N","H","H","N","N","O","L","L","L","L","L","L","O"],"e05":["N","H","N","O","D","D","D","D","D","D","O","D","N","N","N","N","N","O","D","H","H","D","D","D","O","N","N","N","N","N","N"],"e25":["N","H","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","H","H","D","D","D","D","D","O","N","N","N","N"],"e19":["N","N","O","D","D","D","HLF","C/O","O","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","O","C/O","N","N","N","N","O"],"e24":["D","H","D","D","O","D","D","N","N","C/O","N","O","N","N","N","N","N","O","D","D","D","D","N","N","N","O","D","D","D","D","D"],"e22":["N","N","N","N","N","O","C/O","D","D","D","D","GP","O","D","D","D","D","D","O","H","H","N","N","N","N","N","O","D","D","D","D"],"e14":["D","D","D","O","C/O","N","N","N","N","N","O","D","D","D","D","D","L","O","N","N","N","N","N","N","O","HLF","C/O","C/O","L","L","L"],"e15":["D","D","D","D","D","O","D","D","D","C/O","D","N","O","GP","D","D","N","N","O","H","H","N","N","N","N","N","O","D","D","D","D"],"e13":["O","D","D","D","D","D","C/O","O","L","L","L","L","L","N","O","D","D","D","D","D","D","D","O","C/O","C/O","N","N","N","O","D","D"],"e10":["N","N","C/O","O","D","D","D","D","D","GP","O","N","N","N","N","N","N","N","O","H","H","C/O","D","D","O","D","D","D","D","D","D"],"e12":["O","D","D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D","H","H","D","D","O","D","D","D","D","L","L","O"],"e01":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","L","L","D","D","HLF","H","O","C/O","N","N","N","N","N","O","D","D","D"],"e26":["O","D","D","D","D","D","D","GP","O","N","N","N","N","N","N","O","D","D","C/O","N","N","N","O","D","D","D","D","D","D","O","N"],"e21":["D","D","HLF","O","C/O","N","N","N","N","N","N","N","N","O","N","N","N","N","N","H","D","GP","D","D","D","D","L","O","C/O","C/O","L"],"e04":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","HLF","O","H","H","L","L","O","C/O","N","N","N","N","N","N"],"e27":["D","H","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","C/O","C/O","L","L","L","L","O"],"e18":["D","D","D","L","L","L","O","GP","L","L","L","L","L","O","L","L","L","L","L","H","O","D","D","D","D","D","D","O","N","N","N"],"e23":["D","H","O","N","N","L","N","N","O","D","D","D","D","D","D","D","D","D","O","H","H","L","L","O","D","D","HLF","L","HLF","D","O"],"e03":["D","D","O","D","N","N","N","N","O","D","D","D","D","D","D","D","D","D","GP","H","H","C/O","C/O","O","N","N","N","N","N","N","O"],"e08":["N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","N","N","N","H","H","L","O","N","N","N","N","N","N","O","D"],"e02":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","N","N","C/O","O","C/O","C/O","C/O"],"e09":["O","N","N","N","N","N","N","O","D","D","D","C/O","D","L","O","N","N","N","N","H","H","O","D","D","D","D","D","D","O","N","N"],"e16":["N","N","N","O","N","N","N","N","N","N","O","D","D","GP","C/O","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e20":["N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e11":["","","","","","","","","","","","","","","","O","","","","","","","O","","","","","","","O",""]},"2025_11":{"e06":["O","N","N","N","N","N","L","N","N","O","D","D","GP","D","D","GP","O","D","D","D","N","N","N","N","N","N","N","N","N","N"],"e05":["O","D","D","D","D","D","D","O","C/O","D","N","N","N","N","N","O","D","D","D","D","D","O","L","N","N","N","N","N","O","D"],"e25":["N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","C/O","L","L","O","N","N","N","N","N","N","L"],"e19":["N","O","D","D","HLF","L","O","L","N","N","N","N","N","O","D","D","D","GP","L","L","O","N","N","N","L","N","N","N","O","D"],"e24":["L","O","C/O","C/O","L","L","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","GP","O"],"e22":["D","D","O","N","N","L","L","N","N","O","D","D","D","D","D","O","D","L","N","N","N","N","N","O","D","L","GP","D","D","D"],"e14":["O","N","N","N","N","N","N","N","O","L","L","L","L","L","O","L","L","L","L","L","Ab","Ab","N","N","N","N","N","N","N","N"],"e15":["D","HLF","O","D","D","D","D","D","D","O","D","D","D","D","N","N","O","N","N","N","N","N","N","O","D","D","D","L","L","L"],"e13":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","O","N","N","N","L","O","L","L","L","L"],"e10":["O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D"],"e12":["L","L","L","D","D","GP","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D"],"e01":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","GP","O"],"e26":["N","N","N","N","N","O","D","D","D","D","D","D","D","O","C/O","C/O","L","L","L","O","L","L","N","N","N","N","O","D","D","D"],"e21":["N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","N","O","D","D","D","D","D","O","D","D","D","N","N"],"e04":["O","D","D","D","D","D","D","O","D","D","D","D","D","C/O","O","N","N","N","N","N","N","O","D","D","D","GP","D","D","HLF","O"],"e27":["G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G"],"e18":["L","L","L","O","L","L","L","L","L","L","O","L","L","L","L","D","D","O","","","","","","","N","N","N","","",""],"e23":["D","D","D","D","D","HLF","O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","O","D","D","D","GP","O"],"e03":["N","N","N","N","N","N","O","D","D","D","D","D","GP","O","L","N","N","N","N","N","O","D","D","D","D","GP","D","O","D","D"],"e08":["D","D","D","D","D","D","D","D","D","D","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","O","C/O"],"e02":["D","D","D","GP","N","N","N","N","O","D","D","D","D","D","O","N","N","N","N","N","N","N","N","C/O","O","D","D","D","L","L"],"e09":["N","N","N","N","O","D","D","D","D","D","GP","O","N","N","N","N","N","N","O","D","D","L","L","L","L","O","N","N","N","N"],"e16":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e20":["D","D","D","D","D","D","O","N","N","N","N","N","N","N","N","O","C/O","D","D","D","D","D","D","D","D","D","D","O","D","D"],"e11":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D"]},"2025_12":{"e06":["N","C/O","C/O","O","Ab","Ab","N","N","N","N","N","N","N","O","N","Ab","D","D","D","N","N","O","D","D","D","D","D","O","D","D","GP"],"e05":["L","D","D","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","L","N","N","N","N","O","L","L","D","D"],"e25":["O","D","D","D","D","GP","D","O","N","N","N","N","N","N","O","GP","D","D","D","D","GP","O","N","N","N","N","N","N","N","O","L"],"e19":["D","D","D","D","D","D","D","D","D","D","GP","O","D","D","D","D","L","C/O","O","N","N","N","N","N","N","N","N","N","N","C/O","L"],"e24":["N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","N","N","C/O","O","D","D","D","D","D","D","O","D","D","D"],"e22":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","L","L","O","GP","L","D","L","L","D","L","L","D","D"],"e14":["N","N","N","N","N","N","N","N","C/O","D","D","D","D","L","O","C/O","N","N","N","N","N","Ab","N","N","N","N","O","D","D","D","D"],"e15":["O","L","L","L","L","L","L","O","D","D","D","D","O","N","N","N","N","N","N","N","N","N","N","N","N","Ab","Ab","Ab","O","N","N"],"e13":["L","L","O","L","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","D","O","D","D","D","D","N","O","N"],"e10":["D","D","D","D","D","O","L","L","N","N","N","N","N","O","D","D","D","D","GP","O","L","N","N","N","N","N","O","D","D","D","D"],"e12":["D","D","D","D","N","N","N","N","N","N","L","O","D","D","D","D","D","N","N","N","N","N","N","N","N","N","N","N","O","D","L"],"e01":["D","D","L","L","N","N","N","N","O","D","D","D","D","D","D","N","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D"],"e26":["D","N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","N","N","N","N","O","N","N","N","N","O","C/O"],"e21":["N","O","D","D","L","L","L","L","O","L","L","L","L","L","L","O","L","L","D","D","N","N","N","O","N","N","N","N","N","N","O"],"e04":["D","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D","D","D","D","GP","D","O","N","N","N","N","N"],"e27":["G","G","G","G","G","G","G","G","G","G","G","G","G","O","C/O","SL","G","G","G","G","G","G","G","G","O","G","G","G","G","G","G"],"e18":["O","D","D","D","D","D","D","D","O","L","D","D","N","O","D","D","D","L","D","D","D","D","O","D","D","D","D","GP","D","D","D"],"e23":["D","D","D","D","O","D","D","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","GP","HLF","O","L","L","L"],"e03":["D","N","N","N","O","D","D","D","D","O","D","D","N","N","N","N","O","D","D","D","D","D","D","D","D","D","D","D","GP","C/O","O"],"e08":["L","L","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","GP","L"],"e02":["L","L","L","O","N","N","N","O","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","N","N","N","N","L","O"],"e09":["O","D","GP","D","D","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","D"],"e16":["N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","O","N","N","N","L","L","C/O","O","L","L","L","L","L","N"],"e20":["D","D","C/O","L","O","L","L","L","L","L","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","D","D","D","D","N","O"],"e11":["D","D","N","N","O","D","D","D","D","D","O","D","D","D","D","D","N","O","N","N","N","N","N","N","O","D","D","GP","L","L","L"]},"2026_01":{"e06":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","L","N","N","N","O","L","GP","N","N","O","N","N","N","N","N","N"],"e05":["L","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","D"],"e25":["L","D","D","GP","O","N","N","N","L","N","N","O","D","GP","D","D","D","D","O","N","N","N","N","N","N","Ab","Ab","Ab","Ab","Ab","Ab"],"e19":["L","O","D","D","D","D","L","O","N","N","N","N","N","N","N","O","D","D","D","D","D","D","O","L","N","N","N","N","N","O","D"],"e24":["D","D","C/O","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","H","N","N","N","N","N"],"e22":["D","D","D","D","O","N","N","N","N","N","N","O","D","GP","D","HLF","D","D","O","N","N","N","N","N","N","GP","O","D","D","D","D"],"e14":["D","L","O","N","N","N","N","N","N","O","D","D","D","D","D","L","O","N","N","N","N","N","N","N","O","H","N","N","N","N","N"],"e15":["N","N","N","N","O","N","N","N","L","N","N","O","D","D","D","D","D","D","D","D","D","D","D","D","HLF","D","GP","D","D","N","N"],"e13":["N","C/O","N","N","N","O","D","D","D","D","O","N","N","N","N","N","L","O","L","L","L","L","L","O","D","D","D","GP","D","D","O"],"e10":["N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","GP","C/O","N","N","N","O","D","D","D","D","D","C/O","O"],"e12":["L","D","D","D","D","D","N","N","N","N","N","O","D","D","D","D","D","C/O","O","N","N","N","N","N","N","O","D","GP","D","D","D"],"e01":["D","D","GP","C/O","C/O","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","GP","O","C/O","N","N","N"],"e26":["N","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","N","N","O","GP","D","D","D","D","D","D","O","D","D","D"],"e21":["L","D","D","D","O","D","D","D","D","D","D","N","O","D","N","N","N","N","N","O","GP","D","D","D","D","D","D","O","D","D","D"],"e04":["N","O","D","D","D","D","D","GP","O","N","N","N","N","N","N","N","N","O","D","D","GP","D","O","N","N","N","N","N","N","O","D"],"e27":["G","O","G","G","G","G","G","G","O","G","G","G","G","G","C/O","O","C/O","G","G","G","G","G","O","L","G","G","G","G","G","O","C/O"],"e18":["D","Ab","D","O","D","D","D","D","D","D","O","L","L","D","N","Ab","Ab","Ab","Ab","N","N","O","D","D","D","GP","D","D","O","D","D"],"e23":["D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","D","H","O","D","D","D","D"],"e03":["L","L","N","N","N","N","O","D","D","D","D","D","D","O","D","D","D","D","GP","L","O","L","L","L","L","L","L","O","L","L","L"],"e08":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","GP","N","N","N","N","N","O","D","D","D","D","D","D","O","L","L"],"e02":["D","D","D","D","D","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","N","N","N","O","D","D","D"],"e09":["N","O","Ab","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N","N","Ab","Ab","Ab","C/O","O"],"e16":["N","N","O","N","N","N","N","N","O","N","N","N","N","N","O","L","N","N","N","N","N","N","N","N","N","N","O","N","N","N","N"],"e20":["D","D","D","L","L","L","O","L","L","L","L","L","L","O","L","L","L","L","L","D","D","D","D","D","O","H","D","D","D","D","D"],"e11":["O","L","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N"],"e17":["","","","","","","","","D","D","D","D","Ab","O","D","D","D","D","D","D","O","Ab","Ab","Ab","Ab","N","N","O","D","D","D"]},"2026_02":{"e06":["O","L","N","N","N","N","N","N","O","N","N","N","N","N","O","D","HLF","D","D","D","D","O","N","N","N","N","N","N"],"e05":["N","C/O","D","D","D","D","O","D","D","D","D","D","D","D","D","O","C/O","D","D","D","D","O","D","D","D","D","D","O"],"e25":["Ab","O","N","N","N","N","N","N","O","D","D","D","D","D","D","GP","O","N","N","N","N","N","O","C/O","GP","D","D","D"],"e19":["D","D","D","C/O","O","N","N","N","N","N","N","N","N","N","N","N","N","N","N","O","N","N","N","N","N","N","O","C/O"],"e24":["D","D","D","D","D","D","D","O","N","N","N","N","N","N","N","O","D","D","D","D","D","GP","N","N","N","N","N","N"],"e22":["N","N","O","D","D","D","D","D","L","O","D","D","D","GP","GP","O","N","N","N","N","N","O","D","D","D","D","D","D"],"e14":["O","GP","L","L","D","D","GP","O","N","N","N","N","N","N","N","O","Ab","N","N","O","N","N","N","N","N","N","O","N"],"e15":["N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","N","O","D","D","D","C/O","D","O","C/O","N","N","N","N"],"e13":["N","N","N","N","N","N","O","D","D","D","D","GP","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D"],"e10":["N","N","N","N","L","L","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D"],"e12":["D","D","D","O","L","L","N","L","O","L","L","L","N","N","N","N","N","N","N","N","N","N","O","C/O","D","D","D","D"],"e01":["N","N","O","D","D","D","D","D","D","D","D","D","D","L","L","O","D","D","D","D","D","D","D","O","N","N","N","N"],"e26":["N","N","N","N","N","N","N","N","N","N","O","D","D","D","N","N","N","O","D","D","HLF","C/O","L","O","L","L","L","L"],"e21":["D","O","D","D","N","N","N","N","O","N","N","N","N","N","O","D","D","D","C/O","D","D","N","N","N","N","N","N","N"],"e04":["HLF","L","D","D","D","D","D","N","N","N","N","N","C/O","C/O","O","L","L","L","N","N","N","N","N","N","N","N","O","D"],"e27":["G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","L","O","L"],"e18":["D","D","D","D","D","D","D","D","D","D","D","D","O","D","D","D","D","D","O","L","L","L","L","L","L","O","L","D"],"e23":["O","D","D","D","D","D","D","D","D","D","D","D","HLF","C/O","O","D","D","D","D","D","D","D","D","D","D","D","D","D"],"e03":["L","L","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e08":["C/O","C/O","N","N","O","D","D","D","L","L","L","N","N","N","N","N","N","N","O","L","L","D","D","D","D","D","O","N"],"e02":["D","D","D","D","N","N","C/O","L","L","L","O","L","L","L","L","L","N","N","N","N","N","N","N","N","N","O","D","L"],"e09":["L","Ab","O","D","D","O","N","N","N","N","N","N","O","D","D","D","D","C/O","C/O","O","N","N","N","N","N","N","N","O"],"e16":["N","N","O","D","D","D","D","D","HLF","O","C/O","C/O","L","N","N","N","O","N","N","N","N","N","N","O","D","N","N","N"],"e20":["O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D"],"e11":["N","N","N","N","N","O","D","D","D","D","C/O","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N"],"e17":["GP","N","N","N","N","O","N","N","N","N","O","D","D","D","HLF","D","D","O","D","D","D","D","D","C/O","O","Ab","Ab","Ab"],"e07":["","","","","","","","","","","","","","","","","","","","D","D","D","D","D","D","D","D","D"]},"2026_03":{"e06":["O","L","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"],"e05":["D","N","N","N","N","N","O","D","D","D","D","L","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e25":["D","O","N","N","N","N","N","N","N","O","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e19":["N","N","N","N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","C/O","O","L","L","N","N","N","N","O","N","N","N","L"],"e24":["O","D","D","H","D","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"],"e22":["D","O","N","N","L","L","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D"],"e14":["N","N","N","N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","L","D","D","D","D","D","D","D","O","N","N"],"e15":["L","O","D","H","D","D","D","D","O","L","L","L","L","L","L","O","L","L","L","L","N","N","O","N","N","N","N","N","N","O","D"],"e13":["D","O","N","N","N","N","O","D","D","D","D","D","N","O","D","D","D","D","D","N","N","N","N","N","N","N","N","O","D","D","N"],"e10":["N","N","C/O","H","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e12":["N","O","N","L","L","L","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e01":["N","N","O","D","D","D","D","D","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","C/O","C/O","C/O","O","D"],"e26":["N","N","N","N","N","N","N","N","N","N","N","N","N","N","O","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N"],"e21":["O","D","D","D","D","D","HLF","O","C/O","C/O","L","L","L","L","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N"],"e04":["D","D","D","D","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e27":["G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G"],"e18":["D","D","GP","D","O","L","L","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D"],"e23":["O","D","D","H","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D"],"e03":["GP","D","D","D","O","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e08":["N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e02":["D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e09":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e16":["N","N","O","D","D","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","N","O","D","D","D","D","D","D","O"],"e20":["O","D","D","D","D","D","D","O","D","N","C/O","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D"],"e11":["N","N","N","N","N","O","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e17":["Ab","D","D","D","GP","N","O","D","D","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","N","N","N","N","N","N","N"],"e07":["D","GP","C/O","H","D","D","D","O","D","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"]},"2026_04":{"e06":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e05":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e25":["N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e19":["L","L","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N"],"e24":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"],"e22":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e14":["N","N","O","N","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","D","D","D","D","D","D","O","N","N","N","N"],"e15":["D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D"],"e13":["N","N","N","O","D","D","D","D","D","N","O","D","N","N","N","N","N","O","N","N","N","N","N","N","O","D","D","N","N","N"],"e10":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e12":["N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N"],"e01":["D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D"],"e26":["N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N"],"e21":["N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N"],"e04":["D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e27":["G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G","O","G","G","G","G","G","G"],"e18":["D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O"],"e23":["D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D"],"e03":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e08":["N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e02":["O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N"],"e09":["D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D"],"e16":["D","D","N","N","N","N","O","N","N","N","N","O","D","D","N","N","N","N","N","N","O","D","D","D","D","D","D","D","N","N"],"e20":["D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D","D","D","O","D","D","D","D"],"e11":["N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O"],"e17":["N","N","N","O","D","D","D","D","D","D","D","D","O","D","D","D","D","N","N","N","N","O","N","N","N","N","N","D","D","D"],"e07":["D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D","D","D","O","N","N","N","N","N","N","O","D","D","D","D"]}};

const _FIXED_STATUS_CODES=new Set(['O','L','C/O','G','GP','HLF','Ab','H','OD','']);
function _discoverAllShiftCodes(allEmps, cfgShifts){
  const result=[...cfgShifts];
  const known=new Set(cfgShifts.map(s=>s.code));
  const extra=new Set();
  allEmps.forEach(e=>{
    if(Array.isArray(e.ms)){
      e.ms.forEach(v=>{
        if(v && !_FIXED_STATUS_CODES.has(v) && !known.has(v)) extra.add(v);
      });
    }
  });
  extra.forEach(code=>result.push({code,label:code}));
  return result;
}

// ══ Performance: memoize getShift within a data generation ══
let _shiftResCache = new Map();
let _shiftResGen = 0;
function invalidateShiftCache(){
  _shiftResGen++;
  _shiftResCache = new Map();
}
try{ window.invalidateShiftCache = invalidateShiftCache; }catch(e){}

// Indexed approved leaves (rebuilt when leaves cache changes)
let _leaveIndexByEmp = null; // Map empKey -> [{from,to,type,leaveType,credit,autoGenerated,reason}]
function _rebuildLeaveIndex(){
  const map = new Map();
  try{
    const leaves = (typeof getLeaves==='function' ? getLeaves() : []) || [];
    leaves.forEach(l=>{
      if(!l || l.status!=='approved' || !l.from || !l.to) return;
      if(l.credit === true || l.credit === 'true' || l.credit === 1) return;
      if(l.autoGenerated && (l.type==='CO' || /C-?Off|Comp/i.test(String(l.leaveType||''))) &&
         /Holiday list|worked on|double.?shift|C-Off \+1/i.test(String(l.reason||''))) return;
      [l.empId, l.empObjId, l.empCode].filter(Boolean).forEach(k=>{
        const key = String(k);
        if(!map.has(key)) map.set(key, []);
        map.get(key).push(l);
      });
    });
  }catch(e){}
  _leaveIndexByEmp = map;
}
try{ window._rebuildLeaveIndex = _rebuildLeaveIndex; }catch(e){}

/** Base roster shift from schedule/Excel only — ignores overrides (used for holiday duty check). */
function getBaseShift(emp, dateStr){
  if(!emp || !dateStr) return '';
  try{ if(typeof _isBeforeJoining==='function' && _isBeforeJoining(emp, dateStr)) return ''; }catch(e){}
  const d=new Date(dateStr+'T12:00:00');
  const monthKey = dateStr.substring(0,7).replace('-','_');
  const dayIdx = d.getDate()-1;
  function rowVal(row){
    if(row == null) return null;
    // Array or Firebase object {0:'D',1:'N',...}
    if(Array.isArray(row)) return row[dayIdx];
    if(typeof row === 'object'){
      const v = row[dayIdx] != null ? row[dayIdx] : row[String(dayIdx)];
      return v;
    }
    return null;
  }
  function fbLookup(sched){
    if(!sched) return null;
    if(emp.id && sched[emp.id] != null) return sched[emp.id];
    if(emp.empId && sched[String(emp.empId).trim()] != null) return sched[String(emp.empId).trim()];
    // loose match on emp code without leading zeros difference
    if(emp.empId){
      const code = String(emp.empId).trim().replace(/^0+/,'');
      for(const k of Object.keys(sched)){
        if(String(k).replace(/^0+/,'') === code) return sched[k];
      }
    }
    return null;
  }
  const fbSched = getSchedules()[monthKey];
  const fbRow = fbLookup(fbSched);
  if(fbRow != null){
    const val = rowVal(fbRow);
    if(val === null || val === undefined || val === '') return '';
    return val;
  }
  if(typeof EXCEL_SCHEDULES!=='undefined' && EXCEL_SCHEDULES[monthKey]){
    const exRow = fbLookup(EXCEL_SCHEDULES[monthKey]);
    if(exRow != null){
      const val = rowVal(exRow);
      if(val === '' || val === null || val === undefined) return '';
      return val;
    }
    return '';
  }
  return '';
}

function _normalizeOverrideShift(val){
  if(val == null || val === '') return '';
  const s = String(val).trim();
  // Leave stored as "L:EL", "L:CL", "L:Emergency" etc. → treat as Leave
  if(/^L([:\-_].*)?$/i.test(s)) return 'L';
  if(/^C\/?O$/i.test(s) || /^CO$/i.test(s)) return 'C/O';
  if(/^HOLIDAY$/i.test(s)) return 'H';
  return s;
}

/** Resolve shift for emp on dateStr.
 * Priority: 1) overrides  2) approved leave  3) base schedule
 * Memoized per (emp,date) until invalidateShiftCache().
 */
function getShift(emp, dateStr){
  if(!emp || !dateStr) return '';
  const cacheKey = String(emp.id||'') + '|' + String(emp.empId||'') + '|' + dateStr;
  if(_shiftResCache.has(cacheKey)) return _shiftResCache.get(cacheKey);

  let result = '';
  const ov = getOverrides() || {};
  const keys = [];
  if(emp.id) keys.push(emp.id+'_'+dateStr);
  if(emp.empId) keys.push(String(emp.empId)+'_'+dateStr);
  if(emp._key) keys.push(emp._key+'_'+dateStr);

  for(const k of keys){
    if(ov[k] != null && ov[k] !== ''){
      result = _normalizeOverrideShift(ov[k]);
      _shiftResCache.set(cacheKey, result);
      return result;
    }
  }
  // Full-table scan of overrides removed for speed — keys above cover normal writes.

  // 2) Approved leave via index
  try{
    if(!_leaveIndexByEmp) _rebuildLeaveIndex();
    const idSet = [String(emp.id||''), String(emp.empId||'')].filter(Boolean);
    let onLeave = null;
    for(const id of idSet){
      const arr = _leaveIndexByEmp && _leaveIndexByEmp.get(id);
      if(!arr) continue;
      onLeave = arr.find(l => l.from <= dateStr && l.to >= dateStr) || null;
      if(onLeave) break;
    }
    if(onLeave){
      result = (onLeave.type==='CO' || /C-?Off|Comp/i.test(String(onLeave.leaveType||''))) ? 'C/O' : 'L';
      _shiftResCache.set(cacheKey, result);
      return result;
    }
  }catch(e){}

  try{
    if(_isBeforeJoining(emp, dateStr)){
      _shiftResCache.set(cacheKey, '');
      return '';
    }
  }catch(e){}

  result = getBaseShift(emp, dateStr) || '';
  _shiftResCache.set(cacheKey, result);
  return result;
}

/** Single source of truth — schedule, My Shift, picker */
window.MP_SHIFT_COLORS = {
  D:{bg:'#a16207',fg:'#fff'}, N:{bg:'#4f46e5',fg:'#fff'},
  A:{bg:'#16a34a',fg:'#fff'}, B:{bg:'#db2777',fg:'#fff'}, C:{bg:'#0891b2',fg:'#fff'},
  O:{bg:'#475569',fg:'#fff'}, L:{bg:'#be123c',fg:'#fff'}, G:{bg:'#2563eb',fg:'#fff'},
  'C/O':{bg:'#92400e',fg:'#fde68a'}, CO:{bg:'#92400e',fg:'#fde68a'},
  H:{bg:'#ea580c',fg:'#fff'}, HLF:{bg:'#ea580c',fg:'#fff'},
  OD:{bg:'#0d9488',fg:'#ccfbf1'}, GP:{bg:'#6d28d9',fg:'#e9d5ff'},
  Ab:{bg:'#7f1d1d',fg:'#fca5a5'}
};


/** Force D/N/G badge colours identical on Home + Schedule (overrides any theme drift) */
function _forceShiftBadgeColors(){
  if(document.getElementById('mpShiftColorLock')) return;
  const s = document.createElement('style');
  s.id = 'mpShiftColorLock';
  s.textContent = `
    /* FONT colours locked to match Schedule exactly */
    .shc.D, .shc.shc-sm.D, .hm-chip .shc.D, .hm-chip-meta .shc.D, .hm-chips .shc.D,
    .sched-tbl .shc.D, .ms-day-sh.shc.D, span.shc.D {
      background: #a16207 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .shc.N, .shc.shc-sm.N, .hm-chip .shc.N, .hm-chip-meta .shc.N, .hm-chips .shc.N,
    .sched-tbl .shc.N, .ms-day-sh.shc.N, span.shc.N {
      background: #4f46e5 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .shc.G, .shc.shc-sm.G, .hm-chip .shc.G, .hm-chip-meta .shc.G, .hm-chips .shc.G,
    .sched-tbl .shc.G, .ms-day-sh.shc.G, span.shc.G {
      background: #0284c7 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .hm-shift-badge.D, .hm-shift-badge.D .hm-shift-letter, .hm-shift-badge.D .hm-shift-word {
      background: #f59e0b !important; color: #000000 !important; -webkit-text-fill-color: #000000 !important;
    }
    .hm-shift-badge.N, .hm-shift-badge.N .hm-shift-letter, .hm-shift-badge.N .hm-shift-word {
      background: #4f46e5 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;
    }
    .hm-shift-badge.G, .hm-shift-badge.G .hm-shift-letter, .hm-shift-badge.G .hm-shift-word {
      background: #0284c7 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;
    }
    /* Prevent parent .hm-chip-meta muted colour from leaking onto badge letters */
    .hm-chip-meta .shc.D, .hm-chips .shc.D { -webkit-text-fill-color: #000000 !important; color: #000000 !important; }
    .hm-chip-meta .shc.N, .hm-chips .shc.N { -webkit-text-fill-color: #ffffff !important; color: #ffffff !important; }
    .hm-chip-meta .shc.G, .hm-chips .shc.G { -webkit-text-fill-color: #ffffff !important; color: #ffffff !important; }
  `;
  document.head.appendChild(s);
}
try{ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', _forceShiftBadgeColors); else _forceShiftBadgeColors(); }catch(e){}


/** One badge HTML for Home + Schedule + My Shift — identical colours always */
function mpShiftBadgeHtml(code, opts){
  opts = opts || {};
  const disp = (typeof cellDisp==='function' ? cellDisp(code) : code) || '';
  const st = (typeof mpShiftStyle==='function') ? mpShiftStyle(disp||code) : {bg:'#475569',fg:'#fff'};
  const cls = (typeof cellClass==='function' ? cellClass(code) : '') || '';
  const w = opts.w || 28;
  const h = opts.h || 24;
  const fs = opts.fs || 13;
  const extra = opts.extraStyle || '';
  // Font colour MUST match Schedule: D=#000 black, N/G=#fff white (never inherit parent muted colour)
  return '<span class="shc shc-sm '+cls+'" data-shift="'+String(cls).replace(/"/g,'')+'" style="'+
    'background:'+st.bg+' !important;'+
    'color:'+st.fg+' !important;'+
    '-webkit-text-fill-color:'+st.fg+' !important;'+
    'width:'+w+'px !important;height:'+h+'px !important;min-width:'+w+'px !important;'+
    'font-size:'+fs+'px;border-radius:7px;'+
    'display:inline-flex;align-items:center;justify-content:center;font-weight:900;'+
    'font-family:\'Barlow Condensed\',sans-serif;line-height:1;box-sizing:border-box;'+
    'border:1px solid rgba(0,0,0,.12);box-shadow:0 1px 2px rgba(0,0,0,.18);'+
    extra+'">'+
    String(disp).replace(/</g,'&lt;')+'</span>';
}

function mpShiftStyle(code){
  let k = String(code||'').trim();
  if(/^L[:\-_]/i.test(k)) k = 'L';
  if(k==='CO' || k==='C/O') k = 'C/O';
  const c = window.MP_SHIFT_COLORS[k] || window.MP_SHIFT_COLORS[k.toUpperCase()];
  if(c) return c;
  if(String(code||'').indexOf('+')>=0) return {bg:'#7c3aed',fg:'#fff'};
  return {bg:'#1e293b',fg:'#94a3b8'};
}

/** Canonical work/status shift code for display & CSS classes.
 * Fixes corrupt codes (e.g. "To"/"Te" shown for A Shift from bad config/i18n). */
function normalizeShiftCode(code, label){
  let raw = String(code == null ? '' : code).trim();
  const lab = String(label == null ? '' : label).trim();
  if(!raw && lab){
    const L = lab.toUpperCase();
    if(/\bA\s*SHIFT\b/.test(L) || /^A\b/.test(L)) return 'A';
    if(/\bB\s*SHIFT\b/.test(L) || /^B\b/.test(L)) return 'B';
    if(/\bC\s*SHIFT\b/.test(L) || /^C\b/.test(L)) return 'C';
    if(/\bDAY\b/.test(L)) return 'D';
    if(/\bNIGHT\b/.test(L)) return 'N';
  }
  if(!raw) return '';
  if(/^L([:\-_].*)?$/i.test(raw)) return 'L';
  if(raw === 'C/O' || raw.toUpperCase() === 'CO' || raw.toUpperCase() === 'C-OFF') return 'C/O';
  const u = raw.toUpperCase();
  // Standard codes
  if(u === 'D' || u === 'N' || u === 'A' || u === 'B' || u === 'C') return u;
  if(u === 'O' || u === 'G' || u === 'GP' || u === 'H' || u === 'OD' || u === 'HLF') return u === 'HLF' ? 'HLF' : u;
  if(u === 'AB' || raw === 'Ab') return 'Ab';
  // Corrupt / i18n-leaked codes seen for A Shift legend ("To", "Te")
  if(u === 'TO' || u === 'TE' || u === 'TA' || u === 'AS'){
    if(!lab || /\bA\b/i.test(lab) || /SHIFT/i.test(lab)) return 'A';
  }
  // Label overrides bad code
  if(lab){
    const L = lab.toUpperCase();
    if(/\bA\s*SHIFT\b/.test(L)) return 'A';
    if(/\bB\s*SHIFT\b/.test(L)) return 'B';
    if(/\bC\s*SHIFT\b/.test(L)) return 'C';
    if(/\bDAY\s*SHIFT\b/.test(L)) return 'D';
    if(/\bNIGHT\s*SHIFT\b/.test(L)) return 'N';
  }
  return raw;
}

function cellClass(s){
  if(!s) return 'blank';
  const raw0 = String(s).trim();
  if(/^L([:\-_].*)?$/i.test(raw0)) return 'L';
  if(raw0.indexOf('+')>=0 || (typeof parseShiftWorkCodes==='function' && parseShiftWorkCodes(raw0).length>1)) return 'G';
  const raw = normalizeShiftCode(raw0);
  const m={'D':'D','N':'N','A':'A','B':'B','C':'C','O':'O','L':'L','C/O':'CO','CO':'CO','G':'G','GP':'GP','HLF':'HLF','H':'H','Ab':'Ab','OD':'OD'};
  return m[raw]||m[String(raw).toUpperCase()]||'O';
}

function cellDisp(s){
  if(!s) return '';
  const raw0 = String(s).trim();
  if(/^L([:\-_].*)?$/i.test(raw0)) return 'L';
  if(raw0.indexOf('+')>=0) return raw0;
  const raw = normalizeShiftCode(raw0);
  const m={'D':'D','N':'N','A':'A','B':'B','C':'C','O':'O','L':'L','C/O':'CO','CO':'CO','G':'G','GP':'GP','HLF':'½','H':'H','Ab':'Ab','OD':'OD'};
  return m[raw]||m[String(raw).toUpperCase()]||raw||'';
}
try{ window.normalizeShiftCode=normalizeShiftCode; window.cellClass=cellClass; window.cellDisp=cellDisp; }catch(e){}


/** Short word for shift code — Home calendar labels (EN/HI) */
function shiftWord(s){
  if(!s) return '';
  const en = (typeof _lang !== 'undefined' && _lang !== 'hi');
  const key = (s === 'C/O') ? 'CO' : s;
  const mapEn = {D:'Day',N:'Night',O:'Off',L:'Leave',G:'Gen',GP:'GP',CO:'C-Off','C/O':'C-Off',H:'Hol',HLF:'Half',Ab:'Abs',OD:'OD',A:'A-Sh',B:'B-Sh',C:'C-Sh'};
  const mapHi = {D:'दिन',N:'रात',O:'ऑफ',L:'छुट्टी',G:'जनरल',GP:'GP',CO:'C-Off','C/O':'C-Off',H:'हॉलिडे',HLF:'आधा',Ab:'अनुप',OD:'OD',A:'A शिफ्ट',B:'B शिफ्ट',C:'C शिफ्ट'};
  return (en ? mapEn : mapHi)[key] || key;
}
/** Colored badge HTML: letter + short word (for Home day cards) — SAME colours as Schedule */
function shiftBadgeHtml(s, size){
  const code = cellDisp(s) || '—';
  const word = shiftWord(s) || (code === '—' ? '—' : code);
  const cls = cellClass(s) || 'blank';
  const sizeCls = size === 'lg' ? ' hm-today-badge' : '';
  const st = (typeof mpShiftStyle === 'function') ? mpShiftStyle(code === '—' ? '' : (s || code)) : {bg:'#475569',fg:'#fff'};
  // Inline colours from MP_SHIFT_COLORS so Home always matches Schedule (ignore CSS drift)
  return `<div class="hm-shift-badge ${cls}${sizeCls}" title="${code} ${word}" style="background:${st.bg} !important;border-color:transparent">
    <span class="hm-shift-letter" style="color:${st.fg} !important">${code}</span>
    <span class="hm-shift-word" style="color:${st.fg} !important;opacity:.95">${word}</span>
  </div>`;
}

function getShiftTimingStripHtml(){
  const cfg=getShiftConfigSync();
  const byCode={};
  (cfg.shifts||[]).forEach(s=>{ if(s&&s.code) byCode[String(s.code).toUpperCase()]=s; });
  const order=['D','N','G','A','B','C'];
  // Prefer showing only active (Auto) shifts under section; if none flagged, show all configured
  let codes = order.filter(c=>{
    const s=byCode[c];
    return s && s.active!==false;
  });
  if(!codes.length) codes = order.filter(c=>byCode[c]);
  if(!codes.length) codes = getActiveRotationCodes();
  const bits=codes.map(code=>{
    const s=byCode[code]||{code,label:code};
    const _defTimes={D:['07:00','19:00'],N:['19:00','07:00'],G:['08:00','20:00'],A:['06:00','14:00'],B:['14:00','22:00'],C:['22:00','06:00']};
    let stt=s.start||s.startTime||s.from||'';
    let enn=s.end||s.endTime||s.to||'';
    if((!stt||!enn)&&_defTimes[code]){ stt=_defTimes[code][0]; enn=_defTimes[code][1]; }
    // Always show times for G (and other work codes)
    if(code==='G' && (!stt||!enn)){ stt='08:00'; enn='20:00'; }
    const t=(stt&&enn)?(stt+'–'+enn):'';
    let lab = (s.label && String(s.label).trim()) ? String(s.label).trim() : (code==='G' ? 'General Shift' : code);
    if(code==='G' && (lab==='G' || lab==='General' || lab.toLowerCase()==='general')) lab = 'General Shift';
    return '<span class="shc '+cellClass(code)+'" style="width:auto;min-width:22px;height:18px;padding:0 5px;font-size:10px;margin-right:2px">'+code+'</span><span style="font-size:10px;color:var(--muted2);margin-right:10px">'+escHtml(lab)+(t?' · '+t:'')+'</span>';
  }).join('');
  return `<div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:2px 0;opacity:.95">${bits}</div>`;
}


// ── Joining date (YYYY-MM-DD) from employee record ──
function getJoiningDate(emp){
  if(!emp) return null;
  const raw = emp.joiningDate || emp.doj || emp.joinDate || emp.dateOfJoining || '';
  if(!raw) return null;
  try{
    if(/^\d{4}-\d{2}-\d{2}/.test(String(raw))) return String(raw).slice(0,10);
    const d = new Date(raw);
    if(isNaN(d.getTime())) return null;
    // local date parts avoid UTC shift
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    if(y < 1990 || y > 2100) return null;
    return y+'-'+m+'-'+day;
  }catch(e){ return null; }
}

/** True if calendar date is strictly before employee joining date */
function _isBeforeJoining(emp, dateStr){
  const jd = getJoiningDate(emp);
  if(!jd || !dateStr) return false;
  return String(dateStr).slice(0,10) < jd;
}

/**
 * Clear schedule cells before joining date (and optionally blank out bogus continuous empties).
 * Mutates array in place; returns number of cells cleared.
 */
function _sanitizeShiftRow(arr, emp, year, month){
  if(!Array.isArray(arr) && !(arr && typeof arr==='object')) return 0;
  let cleared = 0;
  const jd = getJoiningDate(emp);
  const days = (year && month) ? new Date(year, month, 0).getDate() : (Array.isArray(arr)?arr.length:31);
  for(let i=0;i<days;i++){
    const key = Array.isArray(arr) ? i : String(i);
    const val = arr[key];
    if(val == null || val === '') continue;
    if(jd && year && month){
      const ds = year+'-'+String(month).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');
      if(ds < jd){
        if(Array.isArray(arr)) arr[i] = '';
        else arr[key] = '';
        cleared++;
      }
    }
  }
  return cleared;
}

/** Run joining-date cleanup across all cached month schedules; optionally persist */
async function sanitizeSchedulesBeforeJoining(opts){
  opts = opts || {};
  const emps = (typeof getEmps==='function'?getEmps():[]) || [];
  const byId = {};
  emps.forEach(e=>{
    if(!e) return;
    if(e.id) byId[e.id] = e;
    if(e.empId) byId[String(e.empId)] = e;
  });
  const scheds = (typeof getSchedules==='function'?getSchedules():null) || _cache.schedules || {};
  let total = 0;
  Object.keys(scheds).forEach(mk=>{
    const m = String(mk).match(/(\d{4})[_-](\d{1,2})/);
    if(!m) return;
    const year = +m[1], month = +m[2];
    const monthObj = scheds[mk];
    if(!monthObj || typeof monthObj!=='object') return;
    Object.keys(monthObj).forEach(empKey=>{
      const emp = byId[empKey] || byId[String(empKey)] || emps.find(e=>e.id===empKey||String(e.empId)===String(empKey));
      if(!emp || !getJoiningDate(emp)) return;
      const row = monthObj[empKey];
      total += _sanitizeShiftRow(row, emp, year, month);
    });
  });
  // Also sanitize hardcoded EXCEL_SCHEDULES in memory
  try{
    if(typeof EXCEL_SCHEDULES!=='undefined'){
      Object.keys(EXCEL_SCHEDULES).forEach(mk=>{
        const m = String(mk).match(/(\d{4})[_-](\d{1,2})/);
        if(!m) return;
        const year = +m[1], month = +m[2];
        const monthObj = EXCEL_SCHEDULES[mk];
        Object.keys(monthObj||{}).forEach(empKey=>{
          const emp = byId[empKey] || emps.find(e=>e.id===empKey||String(e.empId)===String(empKey));
          if(!emp || !getJoiningDate(emp)) return;
          total += _sanitizeShiftRow(monthObj[empKey], emp, year, month);
        });
      });
    }
  }catch(e){}
  if(opts.persist && total > 0 && typeof fbSet==='function'){
    try{
      // persist each month key under schedules path used by app
      const root = (_cache && _cache._schedulesPath) || 'schedules';
      for(const mk of Object.keys(scheds)){
        try{ await fbSet(root+'/'+mk, scheds[mk]); }catch(e){}
      }
    }catch(e){ console.warn('[sanitize persist]', e); }
  }
  return total;
}

function isWorking(s){ return ['D','N','G','GP'].includes(s); }
function isManPowerCompanyUser(){ return isAdmin() || SESSION.company === 'Man Power' || SESSION.company === '' || !SESSION.company || SESSION.approved === true; }

// ════════════════════════════════════════
// HOME / OVERVIEW
// ════════════════════════════════════════


/** Normalize shift code for counting */
/** Status / special codes shown in schedule summary under Leave */
function _scheduleStatusLegendDefs(){
  const en = (typeof _lang!=='undefined' && _lang!=='hi');
  return [
    {code:'L',   label: en?'Leave':'Leave',       icon:'🏖️', clr:'#f43f5e', bg:'rgba(244,63,94,.06)'},
    {code:'O',   label: en?'Weekly Off':'W-Off',   icon:'😴', clr:'#64748b', bg:'rgba(100,116,139,.08)'},
    {code:'C/O', label: en?'C-Off':'C-Off',        icon:'🔄', clr:'#92400e', bg:'rgba(146,64,14,.08)'},
    {code:'H',   label: en?'Holiday':'Holiday',    icon:'🎉', clr:'#ea580c', bg:'rgba(234,88,12,.08)'},
    {code:'Ab',  label: en?'Absent':'Absent',      icon:'🚫', clr:'#991b1b', bg:'rgba(153,27,27,.1)'},
    {code:'GP',  label: en?'Gate Pass':'Gate Pass',icon:'🪪', clr:'#9333ea', bg:'rgba(147,51,234,.08)'},
    {code:'OD',  label: en?'Other Dept':'Other Dept', icon:'🏢', clr:'#0d9488', bg:'rgba(13,148,136,.08)'},
    {code:'HLF', label: en?'Half Day':'Half Day',  icon:'½',  clr:'#c2410c', bg:'rgba(194,65,12,.08)'},
    {code:'G',   label: en?'General Shift':'General Shift',    icon:'⚙️', clr:'#0284c7', bg:'rgba(2,132,199,.08)'},
  ];
}

/** Count employees per shift code for one date. Returns {code: count} */
function _countShiftCodesForDate(emps, dateStr){
  const counts = {};
  (emps||[]).forEach(e=>{
    try{
      let sh = (typeof getShift==='function') ? getShift(e, dateStr) : '';
      sh = _normShiftCode(sh);
      if(!sh) return;
      counts[sh] = (counts[sh]||0) + 1;
    }catch(err){}
  });
  return counts;
}

function _shiftCodeMatches(cellSh, code){
  const a = _normShiftCode(cellSh);
  const b = _normShiftCode(code);
  if(!a || !b) return false;
  if(a === b) return true;
  if(typeof shiftCountsToward==='function' && shiftCountsToward(cellSh, code)) return true;
  return false;
}

function _homeTodaySummaryHtml(){
  try{
    const emps = (typeof getEmps==='function' ? getEmps() : []).filter(e=>e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team' && e.status!=='removed');
    let ymd = '';
    try{
      if(typeof TODAY_STR==='string' && TODAY_STR) ymd = TODAY_STR;
      else {
        const today = (typeof TODAY_DATE!=='undefined' && TODAY_DATE) ? TODAY_DATE : new Date();
        ymd = today.toISOString().slice(0,10);
      }
    }catch(e){ ymd = new Date().toISOString().slice(0,10); }

    const counts = _countShiftCodesForDate(emps, ymd);
    const total = emps.length;
    const en = (typeof _lang!=='undefined' && _lang!=='hi');

    // Preferred display order
    const order = ['D','N','G','A','B','C','O','L','C/O','H','Ab','GP','OD','HLF'];
    const labels = {
      D: en?'on D Shift':'D शिफ्ट', N: en?'on N Shift':'N शिफ्ट', G: en?'on G Shift':'G शिफ्ट',
      A: en?'on A Shift':'A शिफ्ट', B: en?'on B Shift':'B शिफ्ट', C: en?'on C Shift':'C शिफ्ट',
      O: en?'on W-Off':'W-Off', L: en?'On Leave':'Leave', 'C/O': en?'on C-Off':'C-Off',
      H: en?'on Holiday':'Holiday', Ab: en?'Absent':'Absent', GP: en?'Gate Pass':'GP',
      OD: en?'Other Dept':'OD', HLF: en?'Half Day':'Half'
    };
    const colors = {
      D:'#f59e0b', N:'#4f46e5', G:'#0284c7', A:'#16a34a', B:'#db2777', C:'#0891b2',
      O:'#64748b', L:'#f43f5e', 'C/O':'#92400e', H:'#ea580c', Ab:'#991b1b', GP:'#9333ea', OD:'#0d9488', HLF:'#c2410c'
    };

    // Collect non-zero codes (known order first, then any extras)
    const seen = new Set();
    const cards = [];
    order.forEach(code=>{
      const n = counts[code] || 0;
      if(n <= 0) return;
      seen.add(code);
      cards.push({code, n, label: labels[code]||code, color: colors[code]||'#64748b'});
    });
    Object.keys(counts).forEach(code=>{
      if(seen.has(code) || !counts[code]) return;
      cards.push({code, n: counts[code], label: code, color:'#64748b'});
    });

    const lblTotal = en ? 'Total Man' : 'कुल';
    const cardStyle = 'flex:1 1 88px;min-width:88px;max-width:140px;padding:10px 12px;border-radius:12px;background:var(--card);border:1px solid var(--border2);text-align:center';
    const valStyle = 'font-size:22px;font-weight:900;line-height:1.15;font-family:Barlow Condensed,sans-serif';
    const lblStyle = 'font-size:11px;font-weight:700;color:var(--muted2);margin-top:2px';
    let html = `<div class="today-summary today-summary-split" style="display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px" aria-label="Today shift split">
      <div class="today-summary-card" style="${cardStyle}"><div class="today-summary-val" style="${valStyle};color:var(--green)">${total}</div><div class="today-summary-lbl" style="${lblStyle}">${lblTotal}</div></div>`;
    cards.forEach(c=>{
      html += `<div class="today-summary-card" style="${cardStyle}"><div class="today-summary-val" style="${valStyle};color:${c.color}">${c.n}</div><div class="today-summary-lbl" style="${lblStyle}">${escHtml(c.label)}</div></div>`;
    });
    html += `</div>`;
    return html;
  }catch(e){ console.warn('[home summary]', e); return ''; }
}


