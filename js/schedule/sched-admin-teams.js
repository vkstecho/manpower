/**
 * Man Power — Admin teams / mobileUsers hierarchy / approve / payment / delete
 * Extracted from app-schedule.js (v6.0.53) for AI navigability.
 * Globals unchanged — load after app-schedule core helpers, before Min Manpower UI.
 */
async function openApproveMemberModal(mobile){const key="function"==typeof _normMobileKey?_normMobileKey(mobile):String(mobile||"").replace(/\D/g,"").slice(-10);let u=null;try{u=await fbGet("mobileUsers/"+key)}catch(e){}
if(!u){try{const all=await fbGet("mobileUsers")||{};const hit=Object.entries(all).find(([k,v])=>("function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10))===key);if(hit)u=hit[1];}catch(e2){}}
if(!u)return void toast(L('❌ सदस्य डेटा नहीं मिला','❌ Member data not found'));
// v6.0.60: prefer real name — never prefill phone digits as "Name"
function _apprPickName(rec, fallbackKey){
  if(!rec) return '';
  const cands=[rec.name,rec.displayName,rec.fullName,rec.memberName,rec.userName];
  for(const c of cands){
    const s=String(c||'').trim();
    if(!s) continue;
    const digits=s.replace(/\D/g,'');
    // skip if value is basically the mobile number
    if(digits.length>=10 && digits.slice(-10)===(fallbackKey||'').slice(-10)) continue;
    if(/^\+?91?\d{10}$/.test(s.replace(/\s/g,''))) continue;
    return s.replace(/</g,'');
  }
  return '';
}
function _apprPickCode(rec){
  if(!rec) return '';
  const cands=[rec.empCode,rec.empId,rec.code,rec.employeeCode,rec.emp_code,rec.EmpCode,rec.EMP_ID];
  for(const c of cands){
    const s=String(c||'').trim();
    if(!s) continue;
    // skip pure phone-looking values
    const digits=s.replace(/\D/g,'');
    if(digits.length>=10 && digits.slice(-10)===String(key||'').slice(-10)) continue;
    return s.replace(/</g,'');
  }
  return '';
}
let name=_apprPickName(u,key);
let preCode=_apprPickCode(u);
// Fallback 1: employees roster by this phone
if(!preCode || !name){
  try{
    const all=(window._cache&&Array.isArray(_cache.employees)?_cache.employees:null)
      || (typeof getEmps==='function'?getEmps():null) || [];
    const hit=(all||[]).find(function(e){
      if(!e) return false;
      const ph=(typeof _normMobileKey==='function'?_normMobileKey(e.phone||e.mobile||''):String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10));
      return ph===key;
    });
    if(hit){
      if(!preCode) preCode=_apprPickCode(hit)||String(hit.empId||hit.empCode||'').trim();
      if(!name) name=_apprPickName(hit,key)||String(hit.name||'').trim();
    }
  }catch(_e){}
}
// Fallback 2: manager notifications (join / pending)
if(!name || !preCode){
  try{
    const mgrKey=(typeof _normMobileKey==='function'?_normMobileKey(SESSION.mobile||SESSION.uid||''):String(SESSION.mobile||'').replace(/\D/g,'').slice(-10));
    if(mgrKey){
      const notifs=await fbGet('userNotifications/'+mgrKey)||{};
      const list=Object.values(notifs||{}).filter(Boolean);
      list.sort((a,b)=>String(b.at||b.createdAt||'').localeCompare(String(a.at||a.createdAt||'')));
      for(const n of list.slice(0,40)){
        const nmob=(typeof _normMobileKey==='function'?_normMobileKey(n.fromMobile||n.memberMobile||n.mobile||''):String(n.fromMobile||n.memberMobile||n.mobile||'').replace(/\D/g,'').slice(-10));
        if(nmob!==key) continue;
        if(!name) name=_apprPickName(n,key)||String(n.name||'').trim();
        if(!preCode) preCode=_apprPickCode(n);
        if(name && preCode) break;
      }
    }
  }catch(_n){}
}
// Fallback 3: adminNotifications (member_registration)
if(!preCode || !name){
  try{
    const an=await fbGet('adminNotifications')||{};
    const list=Object.values(an||{}).filter(Boolean);
    list.sort((a,b)=>String(b.at||b.registeredAt||'').localeCompare(String(a.at||a.registeredAt||'')));
    for(const n of list.slice(0,50)){
      const nmob=(typeof _normMobileKey==='function'?_normMobileKey(n.mobile||n.memberMobile||n.phone||''):String(n.mobile||n.memberMobile||n.phone||'').replace(/\D/g,'').slice(-10));
      if(nmob!==key && nmob!==('91'+key) && String(n.mobile||'').replace(/\D/g,'').slice(-10)!==key) continue;
      if(!name) name=_apprPickName(n,key)||String(n.name||'').trim();
      if(!preCode) preCode=_apprPickCode(n);
      if(name && preCode) break;
    }
  }catch(_a){}
}
// Fallback 4: parse "CODE" from body text if member wrote it in message (rare)
if(!preCode){
  try{
    const blob=String((u&& (u.notes||u.message||u.body))||'');
    const m=blob.match(/\b([A-Za-z0-9]{3,16})\b/);
  }catch(_b){}
}
if(!name) name=''; // leave blank for manager to type — do NOT put phone in Name field
if(!preCode) preCode='';
// If we recovered empCode from fallbacks, persist back onto mobileUsers so next open is instant
if(preCode && u && !String(u.empCode||u.empId||'').trim()){
  try{
    if(typeof fbUpdate==='function'){
      fbUpdate('mobileUsers/'+key, { empCode: preCode, empId: preCode }).catch(function(){});
    }
  }catch(_w){}
}
const phone=String(u.mobile||u.phone||key).replace(/</g,"");
const secs=("function"==typeof _teamFieldValues?_teamFieldValues("section"):[])||[];
const mcs=("function"==typeof _teamFieldValues?_teamFieldValues("machine"):[])||[];
const resps=("function"==typeof _teamFieldValues?_teamFieldValues("responsibility"):[])||[];
const desigs=("function"==typeof _teamFieldValues?_teamFieldValues("designation"):[])||[];
const opt=(arr,ph)=>'<option value="">'+ph+"</option>"+arr.map(v=>'<option value="'+String(v).replace(/"/g,"&quot;")+'">'+String(v).replace(/</g,"")+"</option>").join("")+'<option value="__other__">Other…</option>';
const html=`<div class="modal-handle"></div>\n    <div class="modal-title">✅ ${L("Member Approve + Roster","Approve Member + Add to roster")}</div>\n    <div style="font-size:13px;color:var(--muted2);margin-bottom:12px;line-height:1.5">\n      <b style="color:var(--text)">${name}</b> · ${phone}<br>\n      ${L("Schedule में दिखने के लिए विभाग / Machine आदि भरें — Teams में अलग से add करने की जरूरत नहीं।","Fill Department / Machine etc. so they appear on Schedule — no need to add again under Team.")}\n    </div>\n    <div class="field"><label>Name *</label>\n      <input class="inp-field" id="appr_name" value="${name}" placeholder="Full name"></div>\n    <div class="field"><label>Employee Code / Emp ID *</label>\n      <input class="inp-field" id="appr_empCode" value="${preCode}" placeholder="e.g. 30000422"></div>\n    <div class="field"><label>Department *</label>\n      <select class="inp-field" id="appr_section" onchange="_apprToggleOther('appr_section','appr_section_other')">${opt(secs,"— Select Department —")}</select>\n      <input class="inp-field" id="appr_section_other" placeholder="Department name" style="display:none;margin-top:6px"></div>\n    <div class="field"><label>Machine *</label>\n      <select class="inp-field" id="appr_machine" onchange="_apprToggleOther('appr_machine','appr_machine_other')">${opt(mcs,"— Select Machine —")}</select>\n      <input class="inp-field" id="appr_machine_other" placeholder="Machine name" style="display:none;margin-top:6px"></div>\n    <div class="field"><label>Responsibility</label>\n      <select class="inp-field" id="appr_resp" onchange="_apprToggleOther('appr_resp','appr_resp_other')">${opt(resps,"— Select —")}</select>\n      <input class="inp-field" id="appr_resp_other" placeholder="Responsibility" style="display:none;margin-top:6px"></div>\n    <div class="field"><label>Designation</label>\n      <select class="inp-field" id="appr_desig" onchange="_apprToggleOther('appr_desig','appr_desig_other')">${opt(desigs,"— Select —")}</select>\n      <input class="inp-field" id="appr_desig_other" placeholder="Designation" style="display:none;margin-top:6px"></div>\n    <div class="field"><label>Weekly Off</label>\n      <select class="inp-field" id="appr_woff">\n        <option value="SUN">SUN</option><option value="MON">MON</option><option value="TUE">TUE</option>\n        <option value="WED">WED</option><option value="THU">THU</option><option value="FRI">FRI</option><option value="SAT">SAT</option>\n      </select></div>\n    <div id="appr_err" style="display:none;color:#f87171;font-size:12px;font-weight:700;margin-bottom:8px"></div>\n    <button class="submit-btn" onclick="confirmApproveMember('${key}')">${L("✅ Approve + Schedule में जोड़ें","✅ Approve + Add to Schedule")}</button>\n    <button class="cancel-btn" onclick="closeModal()">${L("रद्द","Cancel")}</button>`;openModal(html)}function _apprToggleOther(selId,otherId){const sel=document.getElementById(selId),o=document.getElementById(otherId);sel&&o&&(o.style.display="__other__"===sel.value?"block":"none","__other__"===sel.value&&o.focus())}function _apprResolve(selId,otherId){const sel=document.getElementById(selId);return sel?"__other__"===sel.value?(document.getElementById(otherId)?.value||"").trim():(sel.value||"").trim():""}async function confirmApproveMember(mobileKey){const key="function"==typeof _normMobileKey?_normMobileKey(mobileKey):String(mobileKey||"").replace(/\D/g,"").slice(-10),err=document.getElementById("appr_err"),showErr=t=>{err?(err.style.display="block",err.textContent=t):toast(t)},displayName=(document.getElementById("appr_name")?.value||"").trim(),empCode=(document.getElementById("appr_empCode")?.value||"").trim(),section=_apprResolve("appr_section","appr_section_other"),machine=_apprResolve("appr_machine","appr_machine_other"),resp=_apprResolve("appr_resp","appr_resp_other"),desig=_apprResolve("appr_desig","appr_desig_other"),woff=(document.getElementById("appr_woff")?.value||"SUN").toUpperCase().slice(0,3);if(!displayName)return void showErr(L("⚠️ Name जरूरी है","⚠️ Name is required"));if(!empCode)return void showErr(L("⚠️ Employee Code जरूरी है","⚠️ Employee Code is required"));if(!section)return void showErr(L("⚠️ विभाग जरूरी है","⚠️ Department is required"));if(!machine)return void showErr(L("⚠️ Machine जरूरी है","⚠️ Machine is required"));let u=null;try{u=await fbGet("mobileUsers/"+key)}catch(e){}if(!u)return void showErr("❌ Member not found");try{const clash=(getEmps()||[]).find(e=>e&&"resigned"!==e.status&&e.empId&&String(e.empId).trim().toUpperCase()===empCode.toUpperCase()&&_normMobileKey(e.phone||e.mobile||"")!==key);if(clash)return void showErr(L("⚠️ Emp Code पहले से है: ","⚠️ Emp Code already used by: ")+(clash.name||""))}catch(e){}const mgrId="function"==typeof _normMobileKey?_normMobileKey(SESSION.mobile||SESSION.uid||""):String(SESSION.mobile||"").replace(/\D/g,"").slice(-10),sec=section||machine||"General",phone10=key;let empId=null,existing=null;try{existing=(getEmps()||[]).find(e=>e&&_normMobileKey(e.phone||e.mobile||"")===phone10),existing&&(empId=existing.id)}catch(e){}empId||(empId="e"+Date.now().toString(36));const emp={id:empId,name:String(displayName||u.name||"").trim(),empId:empCode,sec:sec,section:section,mc:machine,machine:machine,resp:resp||"",responsibility:resp||"",designation:desig||"",woff:woff,status:"active",phone:phone10,mobile:phone10,managerId:mgrId,companyId:"function"==typeof myCompanyId&&"ALL"!==myCompanyId()?myCompanyId():(SESSION.companyId||"default"),companyLabel:SESSION.company||SESSION.companyLabel||u.company||"",company:SESSION.company||SESSION.companyLabel||u.company||"",ms:Array(31).fill(""),addedVia:"member_approve",addedAt:(new Date).toISOString()};try{"function"==typeof _ensureWriteAuth&&await _ensureWriteAuth()}catch(e){}try{await fbUpdate("employees/"+empId,emp)}catch(e){try{await fbSet("employees/"+empId,emp)}catch(e2){return void showErr("❌ Roster save failed: "+(e2.message||e.message))}}try{_cache.employees||(_cache.employees=[]);const ix=_cache.employees.findIndex(e=>e&&e.id===empId);ix>=0?_cache.employees[ix]=Object.assign({},_cache.employees[ix],emp):_cache.employees.push(emp)}catch(e){}try{await fbUpdate("mobileUsers/"+key,{status:"approved",role:"member",approvedAt:(new Date).toISOString(),approvedBy:SESSION.name||"Manager",empCode:empCode,empId:empCode,empObjId:empId,employeeId:empId,managerId:mgrId,section:section,machine:machine,responsibility:resp,designation:desig,woff:woff,company:SESSION.company||SESSION.companyLabel||"",companyLabel:SESSION.company||SESSION.companyLabel||"",companyId:("function"==typeof myCompanyId&&"ALL"!==myCompanyId()?myCompanyId():(SESSION.companyId||"default"))})}catch(e){return void showErr("❌ Approve failed: "+e.message)}try{await fbPush("userNotifications/"+key,{type:"member_approved",title:"✅ Approved",body:"Manager approved you and added you to the team schedule roster",read:!1,at:(new Date).toISOString()})}catch(e){}closeModal(),toast("function"==typeof L?L("✅ Approve + Schedule roster में जोड़ दिया","✅ Approved and added to schedule roster"):"✅ Approved and added to schedule roster");try{renderMyTeamApprovals()}catch(e){}try{renderManagerApprovals()}catch(e){}try{"function"==typeof renderPending&&renderPending()}catch(e){}try{"function"==typeof renderTeam&&renderTeam()}catch(e){}try{"function"==typeof renderSchedule&&renderSchedule()}catch(e){}}async function approveMobileUser(mobile){return openApproveMemberModal(mobile)}async function rejectMobileUser(mobile,name){if(await confirmModal("Reject करें?","<b>"+name+"</b> का registration reject करें?","❌ Reject","रद्द"))try{await fbUpdate("mobileUsers/"+mobile,{status:"rejected",rejectedAt:(new Date).toISOString(),rejectedBy:SESSION.name}),toast("❌ "+name+L(" का registration reject हो गया"," registration rejected")),renderManagerApprovals(),renderMyTeamApprovals()}catch(e){toast(L("❌ त्रुटि: ","❌ Error: ")+(e.message||e))}}function renderMyTeamApprovals(){const block=document.getElementById("myTeamApprovalsBlock"),el=document.getElementById("myTeamApprovalsSection");if(!block||!el)return;if(!((typeof isMgr==='function'&&isMgr())||SESSION.role==='manager'))return void(block.style.display="none");block.style.display="block";const myKey="function"==typeof _normMobileKey?_normMobileKey(SESSION.mobile||SESSION.uid||SESSION.phone||""):String(SESSION.mobile||"").replace(/\D/g,"").slice(-10),myIds=new Set([myKey,String(SESSION.uid||""),String(SESSION.empObjId||""),String(SESSION.mobile||"")].filter(Boolean).map(s=>{try{return"function"==typeof _normMobileKey?_normMobileKey(s):String(s).replace(/\D/g,"").slice(-10)}catch(e){return String(s)}}));fbGet("mobileUsers").then(data=>{if(!data)return void(el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">No pending members</div>');const entries=Object.entries(data).filter(([k,v])=>{if(!v||"pending"!==v.status)return!1;if(v.role&&"member"!==v.role&&"pending_member"!==v.role)return!1;const midRaw=v.managerId||v.managerMobile||v.mgrId||"",mid="function"==typeof _normMobileKey?_normMobileKey(midRaw):String(midRaw).replace(/\D/g,"").slice(-10);const kNorm="function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10);return!(!mid||!(myIds.has(mid)||mid===myKey||String(midRaw)===String(SESSION.uid)||String(midRaw)===String(SESSION.empObjId)||String(midRaw)===String(SESSION.mobile)))});entries.length?el.innerHTML=entries.map(([mobile,u])=>`\n      <div class="card" style="margin-bottom:10px">\n        <div class="card-row">\n          <div class="card-ico" style="background:rgba(96,165,250,.12)">👤</div>\n          <div class="card-body">\n            <div class="card-name">${escHtml(u.name)} <span style="font-size:10px;background:rgba(96,165,250,.15);color:#60a5fa;padding:2px 6px;border-radius:4px;margin-left:4px">MEMBER</span></div>\n            <div class="card-sub">📱 ${escHtml(u.mobile)} &nbsp;·&nbsp; 🏢 ${escHtml(u.company||"—")}${(u.empCode||u.empId)?(' &nbsp;·&nbsp; ID: '+escHtml(String(u.empCode||u.empId))):''}</div>\n            <div class="card-meta">${new Date(u.registeredAt).toLocaleString("function"==typeof mpLocale?mpLocale():"en-IN")}</div>\n          </div>\n        </div>\n        <div class="action-row">\n          <button class="act-btn approve" onclick="openApproveMemberModal('${mobile}')">✅ Approve</button>\n          <button class="act-btn reject"  onclick="rejectMobileUser('${mobile}','${escHtml(u.name)}')">❌ Reject</button>\n        </div>\n      </div>`).join(""):el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+L("कोई pending member नहीं","No pending members")+"</div>"})}function confirmDeleteManagerWithTeam(mgrKey,mgrName,memberCount){
  if(!isAdmin())return void toast(L("❌ Admin only","❌ Admin only"));
  const safeName = String(mgrName||'').replace(/</g,'');
  const title = L("🗑️ Manager Delete Options","🗑️ Manager Delete Options");
  const html = '<div class="modal-handle"></div>'
    + '<div class="modal-title">'+title+'</div>'
    + '<div style="font-size:13px;color:var(--muted2);line-height:1.55;margin-bottom:14px">'
    + L('Manager <b>'+safeName+'</b> · Team members: <b>'+memberCount+'</b>','Manager <b>'+safeName+'</b> · Team members: <b>'+memberCount+'</b>')
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:10px">'
    + '<button type="button" class="submit-btn" style="background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff!important;font-weight:800;font-size:14px;padding:14px 16px;text-align:left;line-height:1.35;min-height:48px" onclick="closeModal();deleteManagerWithTeam(\''+String(mgrKey).replace(/'/g,"\\'")+'\',\''+safeName.replace(/'/g,"\\'")+'\',\'manager_only\')">'
    + ('<span style="color:#fff!important;font-weight:800">'+L('👤 सिर्फ Manager Delete (Members → Individual)','👤 Manager only (Members → Individual)')+'</span>')+'</button>'
    + '<div style="font-size:11px;color:var(--muted2);margin:-4px 0 4px 4px">'+L('Members रहेंगे individual users — अपना schedule देख सकेंगे','Members stay as individual users — can see their own schedule')+'</div>'
    + '<button type="button" class="submit-btn" style="background:linear-gradient(135deg,#f43f5e,#be123c);color:#ffffff!important;font-weight:800;font-size:14px;padding:14px 16px;text-align:left;line-height:1.35;min-height:48px" onclick="closeModal();deleteManagerWithTeam(\''+String(mgrKey).replace(/'/g,"\\'")+'\',\''+safeName.replace(/'/g,"\\'")+'\',\'full_team\')">'
    + ('<span style="color:#fff!important;font-weight:800">'+L('🗑️ Manager + पूरी Team Delete','🗑️ Manager + Full Team Delete')+'</span>')+'</button>'
    + '<div style="font-size:11px;color:var(--muted2);margin:-4px 0 4px 4px">'+L('सब कुछ हट जाएगा — next login fresh user','Everything removed — next login is fresh user')+'</div>'
    + '<button type="button" class="cancel-btn" onclick="closeModal()">'+L('रद्द करें','Cancel')+'</button>'
    + '</div>';
  if(typeof openModal==='function') openModal(html);
  else if(confirm(L('Manager only? OK = manager only, Cancel = full team','Manager only? OK = manager only, Cancel = full team')))
    deleteManagerWithTeam(mgrKey,mgrName,'manager_only');
  else deleteManagerWithTeam(mgrKey,mgrName,'full_team');
}

async function deleteManagerWithTeam(mgrKey,mgrName,mode){if(isAdmin())try{ mode = mode || "full_team";if(toast(L("⏳ Deleting…","⏳ Deleting…")),"function"==typeof _ensureWriteAuth&&!await _ensureWriteAuth())return void toast(L("❌ Phone ओटीपी सत्यापन करें — फिर Delete दबाएँ","❌ Verify phone OTP — then press Delete"));try{"function"==typeof _syncAuthRoleNodes&&await _syncAuthRoleNodes()}catch(e){}const data=await fbGet("mobileUsers")||{},mk="function"==typeof _normMobileKey?_normMobileKey(mgrKey):String(mgrKey||"").replace(/\D/g,"").slice(-10);
// Backup before wipe
try{if(typeof backupBeforeAccountDelete==="function"){await backupBeforeAccountDelete({mobile:mk,deletedBy:(SESSION&&SESSION.name)||"admin",reason:"admin_delete_manager_team",company:"",managerName:mgrName||""});}}catch(_bak){console.warn("[deleteManager] backup",_bak)}
// v6.0.50: manager_only → convert members to individual; full_team → wipe all
if(mode === "manager_only"){
  try{
    const nowIso = new Date().toISOString();
    const norm = function(p){ return (typeof _normMobileKey==="function") ? _normMobileKey(p||"") : String(p||"").replace(/\D/g,"").slice(-10); };
    // Remove manager mobileUsers / managers (hard null so number can re-register)
    for(const k of [mk, mgrKey, "+91"+mk, "91"+mk]){
      try{ await fbRemove("mobileUsers/"+k); }catch(e){ try{ await fbSet("mobileUsers/"+k, null); }catch(e2){
        try{ await fbSet("mobileUsers/"+k, {status:"removed",role:"removed",forceFreshLogin:true,deletedAt:nowIso,deletedBy:"admin"}); }catch(e3){}
      }}
      try{ await fbRemove("managers/"+k); }catch(e){ try{ await fbSet("managers/"+k, null); }catch(e2){} }
      try{ if(window._cache && _cache.mobileUsers){ delete _cache.mobileUsers[k]; } }catch(e){}
    }
    try{ await fbRemove("paymentStatus/"+mk); }catch(e){}
    // Convert team employees to individual
    const emps = await fbGet("employees") || {};
    let converted = 0;
    for(const [id, e] of Object.entries(emps)){
      if(!e) continue;
      const em = norm(e.phone||e.mobile||"");
      const mid = norm(e.managerId||e.managerMobile||e.mgrId||"");
      const isMgrRow = (em && (em===mk || em===norm(mgrKey))) || String(e.role||"").toLowerCase()==="manager" && mid===mk;
      if(isMgrRow && em===mk){
        try{ await fbRemove("employees/"+id); }catch(e){ try{ await fbUpdate("employees/"+id, {status:"removed", leftAt:nowIso, leftReason:"admin_delete_manager_only", phone:null, mobile:null}); }catch(e2){} }
        continue;
      }
      if(mid===mk || mid===norm(mgrKey)){
        try{
          await fbUpdate("employees/"+id, {
            status: "individual",
            managerId: null,
            managerMobile: null,
            previousManagerId: mk,
            leftAt: nowIso,
            leftReason: "admin_delete_manager_only",
            individualSince: nowIso,
            forceFreshLogin: false,
            active: true,
            updatedAt: nowIso
          });
          converted++;
        }catch(e){ console.warn("[deleteMgr] individual emp", e); }
        if(em && em.length===10){
          try{
            await fbUpdate("mobileUsers/"+em, {
              role: "member",
              status: "approved",
              individual: true,
              managerId: null,
              managerMobile: null,
              previousManagerId: mk,
              forceFreshLogin: false,
              empObjId: id,
              phone: em,
              mobile: em,
              updatedAt: nowIso,
              individualSince: nowIso,
              paymentSource: 'self',
              paymentUpdatedBy: 'individual_after_admin_manager_only'
            });
          }catch(e){ console.warn("[deleteMgr] individual mu", e); }
        }
      }
    }
    try{ if(typeof renderAdminTeamHierarchy==="function") renderAdminTeamHierarchy(); }catch(e){}
    try{ if(typeof renderTeam==="function") renderTeam(); }catch(e){}
    toast(L("✅ Manager delete · "+converted+" members → individual","✅ Manager deleted · "+converted+" members → individual"));
    return;
  }catch(err){
    console.error("[deleteMgr manager_only]", err);
    toast(L("❌ ","❌ ")+(err.message||err));
    return;
  }
}

let mgrRec=data[mgrKey]||data[mk]||null;if(!mgrRec){const hit=Object.entries(data).find(([k])=>("function"==typeof _normMobileKey?_normMobileKey(k):k)===mk);hit&&(mgrRec=hit[1])}const mgrMob="function"==typeof _normMobileKey?_normMobileKey(mgrRec&&(mgrRec.mobile||mgrRec.phone)||mk):mk,toDelete=new Set;Object.entries(data).forEach(([k,v])=>{if(!v)return;const keyN="function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10);if(keyN===mk||keyN===mgrMob||k===mgrKey)return void toDelete.add(k);const mid="function"==typeof _normMobileKey?_normMobileKey(v.managerId||v.managerMobile||v.mgrId||""):String(v.managerId||"").replace(/\D/g,"").slice(-10);!mid||mid!==mk&&mid!==mgrMob||toDelete.add(k)});const empKeys=[];try{const emps=await fbGet("employees")||{};Object.entries(emps).forEach(([id,e])=>{if(!e)return;const em="function"==typeof _normMobileKey?_normMobileKey(e.phone||e.mobile||""):String(e.phone||e.mobile||"").replace(/\D/g,"").slice(-10),mid="function"==typeof _normMobileKey?_normMobileKey(e.managerId||e.managerMobile||e.mgrId||""):String(e.managerId||"").replace(/\D/g,"").slice(-10);(!em||em!==mk&&em!==mgrMob)&&(!mid||mid!==mk&&mid!==mgrMob)||empKeys.push(id)})}catch(e){console.warn("[deleteMgr] employees scan",e)}const extraPaths=[];for(const k of toDelete){const n="function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10);n&&10===n.length&&(extraPaths.push("deviceApprovals/"+n),extraPaths.push("pendingMembers/"+n),extraPaths.push("userNotifications/"+n))}let ok=0,fail=0;const failKeys=[];try{if("function"!=typeof fbUpdate||!toDelete.size)throw new Error("no multipath");{const patch={};toDelete.forEach(k=>{patch["mobileUsers/"+k]=null}),empKeys.forEach(id=>{patch["employees/"+id]=null}),extraPaths.forEach(path=>{patch[path]=null}),await fbUpdate("/",patch),ok=toDelete.size}}catch(multiErr){console.warn("[deleteMgr] multipath failed, per-key",multiErr&&multiErr.message);for(const k of toDelete)try{"function"==typeof fbRemove?await fbRemove("mobileUsers/"+k):await fbSet("mobileUsers/"+k,null),ok++}catch(e){try{await fbUpdate("mobileUsers/"+k,{status:"removed",role:"removed",name:null,removedAt:(new Date).toISOString(),removedBy:SESSION.name||"admin",forceFreshLogin:!0}),ok++}catch(e2){fail++,failKeys.push(k),console.warn("[deleteMgr] fail",k,e2&&e2.message)}}for(const id of empKeys)try{"function"==typeof fbRemove?await fbRemove("employees/"+id):await fbSet("employees/"+id,null)}catch(e){console.warn("[deleteMgr] emp",id,e)}for(const path of extraPaths)try{"function"==typeof fbRemove?await fbRemove(path):await fbSet(path,null)}catch(e){}}try{if(_cache&&_cache.mobileUsers&&toDelete.forEach(k=>{try{delete _cache.mobileUsers[k]}catch(e){}}),_cache&&Array.isArray(_cache.employees)&&empKeys.length){const drop=new Set(empKeys);_cache.employees=_cache.employees.filter(e=>e&&!drop.has(e.id)&&!drop.has(e.empId))}}catch(e){}ok&&!fail?toast(L("✅ ","✅ ")+(mgrName||"Manager")+L(" + team हटाए — अगली बार fresh login"," + team removed — next login is fresh")):ok&&fail?toast(L("⚠️ आंशिक delete: ","⚠️ Partial delete: ")+ok+L(" ok, "," ok, ")+fail+L(" failed (Firebase rules)"," failed (Firebase rules)")):(toast(L("❌ Delete failed — Admin phone ओटीपी से लॉगिन करें, या Firebase rules deploy करें","❌ Delete failed — login with Admin phone OTP, or deploy Firebase rules")),failKeys.length&&console.warn("[deleteMgr] failed keys",failKeys));try{renderAdminTeamHierarchy()}catch(e){}try{"function"==typeof renderTeam&&renderTeam()}catch(e){}}catch(err){console.error(err),toast(L("❌ Delete failed: ","❌ Delete failed: ")+(err.message||err))}else toast(L("❌ Admin only","❌ Admin only"))}function renderAdminTeamHierarchy(){
  const block=document.getElementById("adminTeamHierarchyBlock");
  const el=document.getElementById("adminTeamHierarchySection");
  if(!block||!el) return;
  if(typeof isAdmin!=="function"||!isAdmin()){ try{block.style.display="none";}catch(e){} return; }
  block.style.display="block";

  function _showHierError(msg){
    try{
      el.innerHTML='<div class="empty-text" style="padding:12px;color:#f43f5e;font-size:12px;line-height:1.4">'+(msg||"Failed to load managers")+'</div>'
        +'<button type="button" onclick="renderAdminTeamHierarchy()" style="margin:8px 12px;padding:10px 14px;border-radius:10px;border:1px solid rgba(249,115,22,.45);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;cursor:pointer">🔄 Retry</button>';
    }catch(e){}
  }

  function _getCacheMU(){
    try{
      if(typeof _cache!=="undefined"&&_cache&&_cache.mobileUsers&&typeof _cache.mobileUsers==="object"){
        var k=Object.keys(_cache.mobileUsers);
        if(k.length) return _cache.mobileUsers;
      }
    }catch(e){}
    return null;
  }

  function _deriveManagersFromEmployees(){
    var out={};
    try{
      var emps=[];
      try{ emps=(typeof getEmps==="function"?getEmps():null)||[]; }catch(e){}
      if(!emps.length){ try{ emps=(_cache&&_cache.employees)||[]; }catch(e){} }
      var norm=function(p){ try{ return typeof _normMobileKey==="function"?_normMobileKey(p):String(p||"").replace(/\D/g,"").slice(-10);}catch(e){return String(p||"").replace(/\D/g,"").slice(-10);} };
      (emps||[]).forEach(function(e){
        if(!e) return;
        var st=String(e.status||"active").toLowerCase();
        if(st==="left"||st==="left_team"||st==="resigned"||st==="removed"||st==="revoked") return;
        var role=String(e.role||"").toLowerCase();
        var al=String(e.accessLevel||"").toLowerCase();
        if(role!=="manager"&&al!=="manager") return;
        var ph=norm(e.phone||e.mobile||"");
        if(!ph||ph.length!==10) return;
        out[ph]={
          role:"manager", status:"approved", name:e.name||ph, mobile:ph, phone:ph,
          company:e.company||e.companyId||"", companyId:e.companyId||e.company||"",
          teamSize:e.teamSize||e.maxMembers||e.planMaxMembers||null,
          maxMembers:e.maxMembers||null, planMaxMembers:e.planMaxMembers||null,
          empObjId:e.id||e.empId||"", _fromRoster:true
        };
      });
    }catch(e){ console.warn("[hierarchy] derive", e); }
    return out;
  }

  function _mergePayment(data, payMap){
    if(!data||!payMap||typeof payMap!=="object") return;
    try{
      window._paymentStatusCache=window._paymentStatusCache||{};
      var norm=function(p){ return typeof _normMobileKey==="function"?_normMobileKey(p):String(p||"").replace(/\D/g,"").slice(-10); };
      Object.keys(payMap).forEach(function(pk){
        var pv=payMap[pk]; if(!pv||typeof pv!=="object") return;
        window._paymentStatusCache[pk]=pv;
        var ph=norm(pk);
        Object.keys(data).forEach(function(mk){
          var mu=data[mk]; if(!mu) return;
          var mph=norm(mk)||norm(mu.mobile||mu.phone);
          if(!(mph&&ph&&mph===ph)) return;
          try{
            if(pv.paymentAmount) mu.paymentAmount=pv.paymentAmount;
            if(pv.planLabel) mu.planLabel=pv.planLabel;
            if(pv.planPeriod) mu.planPeriod=pv.planPeriod;
            if(pv.planMaxMembers!=null){ mu.planMaxMembers=pv.planMaxMembers; if(!mu.teamSize) mu.teamSize=pv.planMaxMembers; }
            if(pv.teamSize!=null) mu.teamSize=pv.teamSize;
            if(pv.maxMembers!=null) mu.maxMembers=pv.maxMembers;
            var until=pv.paymentPaidUntil||pv.paidUntil||pv.paymentPaidUntilDate;
            if(until){ mu.paymentPaidUntil=until; mu.paidUntil=until; mu.validTill=until; }
          }catch(e1){}
        });
      });
    }catch(e){ console.warn("[hierarchy] merge pay", e); }
  }

  function _paint(data){
    try{
      if(!data||typeof data!=="object"){
        el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+(typeof L==="function"?L("कोई registered Manager नहीं","No registered managers"):"No registered managers")+"</div>";
        return;
      }
      var keyCount=0;
      try{ keyCount=Object.keys(data).length; }catch(e){}
      if(!keyCount){
        el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+(typeof L==="function"?L("कोई registered Manager नहीं","No registered managers"):"No registered managers")+"</div>";
        return;
      }
      try{ if(typeof _cache!=="undefined") _cache.mobileUsers=data; }catch(e){}
      // safe stubs if helpers missing
      var _badge = typeof _mobileStatusBadge==="function" ? _mobileStatusBadge : function(){return "";};
      var _btns = typeof _mobileActionButtons==="function" ? _mobileActionButtons : function(){return "";};
      var _esc = typeof escHtml==="function" ? escHtml : function(s){return String(s==null?"":s).replace(/</g,"&lt;");};

      if(typeof _mobileStatusBadge!=="function"){ window._mobileStatusBadge=function(u){u=u||{};var ts=parseInt(u.teamSize!=null?u.teamSize:(u.maxMembers!=null?u.maxMembers:u.planMaxMembers),10)||0;return '<span style="font-size:10px;background:rgba(34,197,94,.15);color:#16a34a;padding:3px 8px;border-radius:6px;font-weight:700">Active'+(ts?(' · '+ts+' Members'):'')+'</span>';}; }
      if(typeof _mobileActionButtons!=="function"){ window._mobileActionButtons=function(){return "";}; }
      if(typeof escHtml!=="function"){ window.escHtml=function(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}; }
      if(typeof SESSION==="undefined"||!SESSION){ window.SESSION=window.SESSION||{viewCompanyId:"ALL"}; }
const allRaw=Object.entries(data),viewCid=SESSION.viewCompanyId||"ALL",mgrKeyNorm=k=>"function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10);let managers=allRaw.filter(([k,v])=>{if(!v||"manager"!==v.role||"rejected"===v.status||"removed"===v.status||"left"===v.status||"left_team"===v.status||"demoted"===v.status)return!1;if(v.demotedReason==="manager_transferred")return!1;if(String(v.wasManager||"")==="true"&&v.managerId&&String(v.role||"").toLowerCase()==="member")return!1;/* v6.0.11: demoted under another manager — not independent */const selfPh=mgrKeyNorm(k||v.mobile||v.phone||"");const reportsTo=mgrKeyNorm(v.managerId||v.managerMobile||"");if(reportsTo&&reportsTo.length===10&&selfPh&&reportsTo!==selfPh)return!1;/* employee row says worker under other mgr */try{const emps=(_cache.employees||[]);const me=emps.find(e=>mgrKeyNorm(e.phone||e.mobile||"")===selfPh);if(me){const al=String(me.accessLevel||me.role||"").toLowerCase();const mid=mgrKeyNorm(me.managerId||"");if((al==="worker"||al==="member")&&mid&&mid!==selfPh)return!1;}}catch(ex){}if(!viewCid||"ALL"===viewCid)return!0;const n=_normCompanyId(v.company||v.companyId||v.companyLabel||"");const want=_normCompanyId(viewCid);if(!want||want==="ALL")return!0;return n&&n===want;});
// After handoff: also treat roster-owners as managers even if mobileUsers.role was not updated (PERMISSION partial fail)
try{
  const _empsFull=(_cache.employees||[]).length?(_cache.employees||[]):((typeof getEmps==='function'?getEmps():[])||[]);
  const _LEFT=new Set(['left','left_team','resigned','removed','revoked']);
  const _rosterCount=ph=>{
    const p=mgrKeyNorm(ph);
    let n=0;
    _empsFull.forEach(e=>{
      if(!e)return;
      const st=String(e.status||'active').toLowerCase();
      if(_LEFT.has(st))return;
      if(mgrKeyNorm(e.managerId||'')===p)n++;
    });
    return n;
  };
  // Re-apply strict company filter after roster-owner promotions
try{
  if(viewCid && viewCid!=='ALL'){
    const want=_normCompanyId(viewCid);
    const filtered=[];
    managers.forEach(function(pair){
      const v=pair[1]||{};
      const n=_normCompanyId(v.company||v.companyId||v.companyLabel||'');
      if(n && n===want) filtered.push(pair);
    });
    managers.length=0;
    filtered.forEach(function(p){ managers.push(p); });
  }
}catch(_cf){}
const managerPhoneSet=new Set(managers.map(([k,v])=>mgrKeyNorm(k||v.mobile||v.phone)));
  // Promote display: any active mobileUser who owns active employees via managerId
  allRaw.forEach(([k,v])=>{
    if(!v)return;
    const st=String(v.status||'').toLowerCase();
    if(['rejected','removed','left','left_team','revoked'].includes(st))return;
    const role=String(v.role||'').toLowerCase();
    if(role==='admin')return;
    const p=mgrKeyNorm(k||v.mobile||v.phone);
    if(!p||p.length!==10)return;
    if(managerPhoneSet.has(p))return;
    if(_rosterCount(p)>0){
      // synthetic manager entry for hierarchy (Keshav after partial handoff)
      managers.push([k, Object.assign({}, v, { role:'manager', _rosterDerived:true })]);
      managerPhoneSet.add(p);
    }
  });
  // Drop stale managers with zero roster AND no active self employee as manager
  managers=managers.filter(([k,v])=>{
    const p=mgrKeyNorm(k||v.mobile||v.phone);
    const n=_rosterCount(p);
    if(n>0)return true;
    if(v._rosterDerived)return false;
    const self=_empsFull.find(e=>mgrKeyNorm(e.phone||e.mobile||'')===p);
    if(self&&!_LEFT.has(String(self.status||'').toLowerCase())){
      const isM=String(self.role||'').toLowerCase()==='manager'||String(self.accessLevel||'').toLowerCase()==='manager';
      if(isM)return true;
    }
    // Keep explicit approved managers even with empty team (new managers)
    if(String(v.role||'').toLowerCase()==='manager'&&(v.status==='approved'||!v.status))return true;
    return false;
  });
}catch(ex){console.warn('[hierarchy] roster-derive',ex)}
let managerKeys=new Set(managers.map(([k])=>mgrKeyNorm(k))); let managerKeySet=new Set(managers.map(([k])=>k)); let uncategorised=allRaw.filter(([k,v])=>{if(!v||"rejected"===v.status||"removed"===v.status)return!1;const role=String(v.role||"").toLowerCase();if("manager"===role||"admin"===role)return!1;if(viewCid&&"ALL"!==viewCid&&!_companyMatchesView(v.company,viewCid))return!1;const p=mgrKeyNorm(k||v.mobile||v.phone);if(managerKeys.has(p))return!1;const mk=mgrKeyNorm(v.managerId||v.managerMobile||"");return!v.managerId&&!v.managerMobile||!managerKeys.has(mk)&&!managerKeySet.has(v.managerId)});if(!managers.length&&!uncategorised.length)return void(el.innerHTML='<div class="empty-text" style="font-size:12px;padding:12px">'+("function"==typeof L?L("कोई registered Manager/Member नहीं","No registered Manager/Member"):"No registered Manager/Member")+"</div>");let html=`<div style="display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px;margin-bottom:8px"><button type="button" onclick="adminRepairManagerHierarchy()" style="font-size:11px;padding:8px 12px;border-radius:8px;border:1px solid rgba(124,58,237,.4);background:rgba(124,58,237,.12);color:#7c3aed;font-weight:800;cursor:pointer">🔧 Repair managers list</button><button type="button" onclick="adminRemoveOrphanMembers()" style="font-size:11px;padding:8px 12px;border-radius:8px;border:1px solid rgba(244,63,94,.4);background:rgba(244,63,94,.1);color:#f43f5e;font-weight:800;cursor:pointer">🧹 Remove orphans</button><button type="button" onclick="typeof openDeletedAccountsBackupModal===\'function\'&&openDeletedAccountsBackupModal()" style="font-size:11px;padding:8px 12px;border-radius:8px;border:1px solid rgba(14,165,233,.45);background:rgba(14,165,233,.12);color:#0ea5e9;font-weight:800;cursor:pointer">💾 Deleted backups</button></div>`+managers.map(([mgrKey,mgr])=>{const mk=mgrKeyNorm(mgrKey),mgrMob=mgrKeyNorm(mgr.mobile||mgr.phone||mk),members=allRaw.filter(([k,v])=>{if(!v)return!1;const st=String(v.status||"").toLowerCase();if("rejected"===st||"removed"===st||"left"===st||"left_team"===st||"demoted"===st)return!1;const role=String(v.role||"").toLowerCase();if("manager"===role||"admin"===role)return!1;const mid=mgrKeyNorm(v.managerId||v.managerMobile||v.mgrId||"");if((!mid||mid!==mk&&mid!==mgrMob)&&(!v.managerId||String(v.managerId)!==String(mgrKey)&&mgrKeyNorm(v.managerId)!==mk))return!1;if(viewCid&&"ALL"!==viewCid){const mc=_normCompanyId(v.company||"");if(mc&&"default"!==mc&&mc!==_normCompanyId(viewCid))return!1}return!0});let rosterCount=0;try{const empsAll=("function"==typeof getEmps?getEmps():_cache.employees||[])||[],seenMob=new Set(members.map(([k,v])=>mgrKeyNorm(v.mobile||v.phone||k)));empsAll.forEach(e=>{if(!e||"resigned"===e.status||"left"===e.status||"left_team"===e.status||"removed"===e.status)return;const emid=mgrKeyNorm(e.managerId||"");if(!emid||emid!==mk&&emid!==mgrMob)return;if(viewCid&&"ALL"!==viewCid){const mc=_normCompanyId(e.companyId||e.company||"");if(mc&&"default"!==mc&&mc!==_normCompanyId(viewCid))return}const emMob=mgrKeyNorm(e.phone||e.mobile||"");emMob&&seenMob.has(emMob)||rosterCount++})}catch(e){}const statusBadge=_mobileStatusBadge(mgr),noMemLbl="function"==typeof L?L("इस Manager के अंतर्गत कोई Member नहीं","No members under this Manager"):"No members under this Manager",membersHtml=members.length?members.map(([memKey,mem])=>`\n          <div class="adm-mem-row" style="padding:10px 12px;border-top:1px solid var(--border2);display:flex;align-items:center;gap:8px;flex-wrap:wrap">\n            <div style="flex:1;min-width:120px">\n              <div style="font-size:13px;font-weight:700;color:var(--text)">👤 ${escHtml(String(mem.name||"").replace(/</g,""))}</div>\n              <div style="font-size:11px;color:#64748b">📱 ${escHtml(mem.mobile||mem.phone||memKey)}</div>\n            </div>\n            ${_mobileStatusBadge(mem)}\n            ${_mobileActionButtons(memKey,mem.name,mem.status)}\n          </div>`).join(""):`<div style="padding:10px 12px;border-top:1px solid var(--border2);font-size:11px;color:#64748b">${noMemLbl}</div>`,expLbl="function"==typeof L?L("📅 Expiry (team)","📅 Expiry (team)"):"📅 Expiry (team)",delLbl="function"==typeof L?L("🗑️ Delete Manager + Team","🗑️ Delete Manager + Team"):"🗑️ Delete Manager + Team",safeName=("function"==typeof L&&L("members","members"),String(mgr.name||"").replace(/'/g,"\\'").replace(/</g,"")),safeKey=String(mgrKey).replace(/'/g,"\\'");return`\n      <div class="card adm-mgr-card team-fold" data-open="0" style="margin-bottom:12px;padding:0;overflow:hidden">\n        <div class="team-fold-hdr" style="padding:12px;background:rgba(249,115,22,.06);cursor:pointer;user-select:none"\n          onclick="if(!event.target.closest('button,a,input')){ const b=this.parentElement; const body=b.querySelector('.team-fold-body'); const chev=this.querySelector('.team-fold-chev'); if(!body)return; const open=body.style.display!=='none'; body.style.display=open?'none':'block'; if(chev)chev.textContent=open?'▶':'▼'; b.setAttribute('data-open',open?'0':'1'); }">\n          <div style="display:flex;align-items:flex-start;gap:8px">\n            <span class="team-fold-chev" style="font-size:12px;color:var(--muted2);width:14px;line-height:22px">▶</span>\n            <div style="flex:1;min-width:0">\n              <div style="font-size:15px;font-weight:900;color:var(--text);line-height:1.25">👔 ${safeName}</div>\n              <div style="font-size:12px;font-weight:700;color:var(--m1,#f97316);margin-top:2px">${members.length} ${"function"==typeof L?L("मोबाइल","mobile"):"mobile"}${void 0!==rosterCount&&rosterCount?" · "+rosterCount+" "+("function"==typeof L?L("रोस्टर में","in roster"):"in roster"):""}</div>\n              <div style="font-size:11px;color:#64748b;margin-top:3px;word-break:break-all">📱 ${escHtml(mgr.mobile||mgr.phone||mgrKey)}</div>\n              <div style="font-size:11px;color:#64748b">🏢 ${escHtml(mgr.company||"—")}</div>\n            </div>\n            <div style="flex-shrink:0">${statusBadge}</div>\n          </div>\n          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px" onclick="event.stopPropagation()">\n            ${_mobileActionButtons(mgrKey,mgr.name,mgr.status)}\n            ${members.length?`<button type="button" onclick="event.stopPropagation();openAdminSetExpiryModal('${safeKey}','${safeName}',true)" style="font-size:11px;padding:7px 10px;border-radius:8px;border:1px solid rgba(249,115,22,.4);background:rgba(249,115,22,.12);color:#f97316;font-weight:800;cursor:pointer">${expLbl}</button>`:""}\n            <button type="button" onclick="event.stopPropagation();openAdminSetPaymentModal('${safeKey}','${safeName}',true)" style="font-size:11px;padding:7px 10px;border-radius:8px;border:1px solid rgba(16,185,129,.45);background:rgba(16,185,129,.12);color:#059669;font-weight:800;cursor:pointer">💳 Pay until</button>\n            <button type="button" onclick="event.stopPropagation();confirmDeleteManagerWithTeam('${safeKey}','${safeName}',${members.length})" style="font-size:11px;padding:7px 10px;border-radius:8px;border:1px solid rgba(244,63,94,.5);background:rgba(244,63,94,.14);color:#f43f5e;font-weight:800;cursor:pointer;position:relative;z-index:2">${delLbl}</button>\n          </div>\n        </div>\n        <div class="team-fold-body" style="display:none">${membersHtml}</div>\n      </div>`}).join("");uncategorised.length&&(html+=`\n      <div style="font-size:12px;font-weight:800;color:#f97316;letter-spacing:.5px;margin:18px 0 8px">\n        👤 INDIVIDUALS / NO MANAGER <span style="color:#64748b;font-weight:600">(${uncategorised.length})</span>\n      </div>\n      <div class="card" style="margin-bottom:12px;padding:0;overflow:hidden;border-color:rgba(249,115,22,.3)">\n        ${uncategorised.map(([memKey,mem])=>`\n          <div style="padding:10px 12px;border-top:1px solid var(--border2);display:flex;align-items:center;gap:8px;flex-wrap:wrap">\n            <div style="flex:1;min-width:120px">\n              <div style="font-size:13px;font-weight:700;color:var(--text)">👤 ${escHtml(String(mem.name||"").replace(/</g,""))}</div>\n              <div style="font-size:11px;color:#64748b">📱 ${escHtml(mem.mobile||mem.phone||memKey)} · 🏢 ${escHtml(mem.company||"—")}</div>\n            </div>\n            ${_mobileStatusBadge(mem)}\n            ${_mobileActionButtons(memKey,mem.name,mem.status)}\n            <button type="button" data-k="${memKey}" data-n="${escHtml(String(mem.name||''))}" onclick="event.stopPropagation();openAdminSetPaymentModal(this.getAttribute('data-k'),this.getAttribute('data-n'))" style="font-size:11px;padding:7px 10px;border-radius:8px;border:1px solid rgba(16,185,129,.45);background:rgba(16,185,129,.12);color:#059669;font-weight:800;cursor:pointer">💳 Pay until</button>\n          </div>`).join("")}\n      </div>`),
      el.innerHTML=html;
    }catch(err){
      console.error("[renderAdminTeamHierarchy] paint", err);
      var msg="Failed to load managers";
      try{ if(err&&err.message) msg=msg+": "+String(err.message).slice(0,120); }catch(e){}
      _showHierError(msg);
    }
  }

  function _loadWithTimeout(path, ms){
    ms=ms||5000;
    return new Promise(function(resolve){
      var settled=false;
      function done(v){ if(settled) return; settled=true; resolve(v); }
      setTimeout(function(){ done(null); }, ms);
      try{
        if(typeof fbGet!=="function"){ done(null); return; }
        Promise.resolve(fbGet(path)).then(function(d){ done(d); }).catch(function(e){ console.warn("[hierarchy] fbGet",path,e); done(null); });
      }catch(e){ done(null); }
    });
  }

  // --- IMMEDIATE: paint from listener cache if available (no wait) ---
  var cached=_getCacheMU();
  if(cached){
    try{ _paint(Object.assign({}, cached)); }catch(e){ console.warn("[hierarchy] cache paint", e); }
  } else {
    el.innerHTML='<div class="empty-text" style="padding:12px;font-size:12px">Loading...</div>';
  }

  // safety timer only if still loading
  try{
    if(window._hierSafetyTimer) clearTimeout(window._hierSafetyTimer);
    window._hierSafetyTimer=setTimeout(function(){
      try{
        if(el&&/Loading/i.test(el.textContent||"")){
          var d=_getCacheMU()||_deriveManagersFromEmployees();
          if(d&&Object.keys(d).length) _paint(d);
          else _showHierError("Manager list timeout — check connection and Retry");
        }
      }catch(e){}
    },10000);
  }catch(e){}

  // Poll cache while waiting (fbListen may fill it)
  try{
    var _pollN=0;
    var _pollId=setInterval(function(){
      _pollN++;
      try{
        var c=_getCacheMU();
        if(c&&Object.keys(c).length){
          clearInterval(_pollId);
          try{ _paint(Object.assign({}, c)); }catch(e){}
        }
      }catch(e){}
      if(_pollN>=20) try{ clearInterval(_pollId); }catch(e){}
    }, 400);
    window._hierPollId=_pollId;
  }catch(e){}

  // --- ASYNC refresh: fbGet with timeout, then payment, then repaint ---
  _loadWithTimeout("mobileUsers", 5000).then(function(data){
    try{ if(window._hierPollId){ clearInterval(window._hierPollId); window._hierPollId=null; } }catch(e){}

    if(!data||typeof data!=="object"||!Object.keys(data).length){
      data=_getCacheMU();
      if(data) data=Object.assign({}, data);
    }
    if(!data||typeof data!=="object"||!Object.keys(data).length){
      data=_deriveManagersFromEmployees();
    }
    return _loadWithTimeout("paymentStatus", 1200).then(function(payMap){
      return { data: data, payMap: payMap };
    }).catch(function(){ return { data: data, payMap: null }; });
  }).then(function(pack){
    try{ if(window._hierSafetyTimer){ clearTimeout(window._hierSafetyTimer); window._hierSafetyTimer=null; } }catch(e){}
    var data=pack&&pack.data;
    var payMap=pack&&pack.payMap;
    if(payMap&&typeof payMap==="object") _mergePayment(data, payMap);
    else if(window._paymentStatusCache) _mergePayment(data, window._paymentStatusCache);
    if(data&&typeof data==="object"&&Object.keys(data).length){
      _paint(data);
    } else if(!_getCacheMU()){
      // only show error if we never painted anything useful
      if(/Loading/i.test(el.textContent||"")||/Failed/i.test(el.textContent||"")){
        _showHierError("No manager data found (mobileUsers empty)");
      }
    }
  }).catch(function(err){
    console.error("[renderAdminTeamHierarchy]", err);
    try{ if(window._hierSafetyTimer){ clearTimeout(window._hierSafetyTimer); window._hierSafetyTimer=null; } }catch(e){}
    var data=_getCacheMU()||_deriveManagersFromEmployees();
    if(data&&Object.keys(data).length) _paint(data);
    else {
      var msg="Failed to load managers";
      try{ if(err&&err.message) msg+=": "+String(err.message).slice(0,100); }catch(e){}
      if(/Loading/i.test(el.textContent||"")) _showHierError(msg);
    }
  });
}
/** Single source of truth for plan end date (Admin badge + Manager pay card). */
function _resolvePaidUntilMs(u){
  if(!u || typeof u !== 'object') return 0;
  const parse = (v)=>{
    if(!v) return 0;
    // YYYY-MM-DD → end of that day local
    const s = String(v).trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
      const t = new Date(s+'T23:59:59').getTime();
      return isNaN(t)?0:t;
    }
    const t = new Date(s).getTime();
    return isNaN(t)?0:t;
  };
  const candidates = [
    u.paymentPaidUntil, u.paidUntil, u.paymentPaidUntilDate,
    u.validTill, u.validUntil, u.expiry, u.expiresAt
  ].map(parse).filter(x=>x>0);
  if(!candidates.length) return 0;
  // Strictest = earliest end date (expired wins over stale long validTill)
  return Math.min.apply(null, candidates);
}
try{ window._resolvePaidUntilMs = _resolvePaidUntilMs; }catch(e){}
function _mobileStatusBadge(u){u=u||{};let[color,label]={approved:["#22c55e","Active"],revoked:["#f43f5e","Revoked"],pending:["#f97316","Pending"]}[u.status]||["#64748b",u.status||"—"];
let planBit="";
try{
  // Always prefer explicit teamSize / maxMembers on the manager record
  const ts=parseInt(u.teamSize!=null?u.teamSize:(u.maxMembers!=null?u.maxMembers:u.planMaxMembers),10)||0;
  const amt=parseInt(u.paymentAmount,10)||0;
  let periodLabel="";
  if(u.planPeriod==="annual") periodLabel="Annual";
  else if(u.planPeriod==="monthly") periodLabel="Monthly";
  else if(amt&&typeof _planLabelFromAmount==="function"){
    const p=_planLabelFromAmount(amt,window._paymentSettingsCache||{});
    if(p) periodLabel=p.periodLabel||(p.period==="annual"?"Annual":"Monthly");
  } else if(amt||ts) periodLabel="Monthly";
  if(typeof _formatSubscriptionLine==="function"){
    planBit=_formatSubscriptionLine(u,window._paymentSettingsCache||{})||"";
  }
  // Force team size into badge when admin set it (even if subscription line omitted it)
  if(ts>0){
    const STANDARD={1:1,30:1,60:1,200:1};
    const custom=!STANDARD[ts];
    const sizeBit=ts===1?"1 Member":(ts+" Members");
    const forced=[periodLabel, custom?"Custom plan":"", sizeBit].filter(Boolean).join(" · ");
    // Prefer forced size line when format line has no member count
    if(!planBit || !/\d+\s*Member/i.test(planBit)) planBit=forced;
  }else if(!planBit){
    if(u.planLabel) planBit=String(u.planLabel);
    else if(amt&&typeof _planLabelFromAmount==="function"){
      const p=_planLabelFromAmount(amt,window._paymentSettingsCache||{});
      if(p&&p.label) planBit=p.label;
    }
  }
}catch(_e){}
let extra="";
const _untilMs = (typeof _resolvePaidUntilMs==='function') ? _resolvePaidUntilMs(u) : 0;
if(_untilMs){
  const daysLeft=Math.ceil((_untilMs - Date.now())/864e5);
  if(daysLeft>=0){
    extra=` · ${daysLeft}d left`;
  } else {
    // Force Expired label when paid-until / validTill already passed
    label = 'Expired';
    color = '#ef4444';
    extra = '';
  }
}
const planPrefix=planBit?`${planBit} · `:"";
return`<span style="font-size:10px;background:${color}22;color:${color};padding:3px 7px;border-radius:5px;font-weight:700;white-space:nowrap">${planPrefix}${label}${extra}</span>`}
function _mobileActionButtons(key,name,status){const safeName=String(name||"").replace(/'/g,"'"),safeKey=String(key||"").replace(/'/g,"'");
let _tsShow="";
try{
  const norm=function(p){return typeof _normMobileKey==="function"?_normMobileKey(p):String(p||"").replace(/\D/g,"").slice(-10)};
  const ph=norm(key);
  let rec=null;
  if(typeof _cache!=="undefined"&&_cache.mobileUsers){
    rec=_cache.mobileUsers[ph]||_cache.mobileUsers[key]||null;
    if(!rec){for(const k of Object.keys(_cache.mobileUsers)){if(norm(k)===ph){rec=_cache.mobileUsers[k];break;}}}
  }
  if(!rec&&window._paymentStatusCache){rec=window._paymentStatusCache[ph]||window._paymentStatusCache[key]||null;}
  const ts=parseInt(rec&&(rec.teamSize!=null?rec.teamSize:(rec.maxMembers!=null?rec.maxMembers:rec.planMaxMembers)),10)||0;
  if(ts>0)_tsShow=" · "+ts;
}catch(_e){}
const delBtn=`<button type="button" onclick="event.stopPropagation();confirmDeleteMobileUser('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(244,63,94,.45);background:rgba(244,63,94,.12);color:#f43f5e;font-weight:800;cursor:pointer;white-space:nowrap">🗑️ Delete</button>`;return"revoked"===status?`<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">\n      <button onclick="adminRestoreMobileUser('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.08);color:#22c55e;font-weight:700;cursor:pointer;white-space:nowrap">↺ Restore</button>\n      ${delBtn}\n    </div>`:"approved"===status||"pending"===status?`<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">\n      <button onclick="openAdminSetExpiryModal('${safeKey}','${safeName}',false)" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(96,165,250,.3);background:rgba(96,165,250,.08);color:#60a5fa;font-weight:700;cursor:pointer;white-space:nowrap">📅 Expiry</button>\n      <button type="button" onclick="event.stopPropagation();if(typeof openAdminTeamSizeModal==='function')openAdminTeamSizeModal('${safeKey}','${safeName}');else toast(L('टीम आकार लोड…','Team Size loading...'));" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(99,102,241,.4);background:rgba(99,102,241,.1);color:#4f46e5;font-weight:700;cursor:pointer;white-space:nowrap">👥 Team Size${_tsShow}</button>\n      <button onclick="adminExtendMobileValidity('${safeKey}','${safeName}',30)" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(56,189,248,.3);background:rgba(56,189,248,.08);color:#38bdf8;font-weight:700;cursor:pointer;white-space:nowrap">+30d</button>\n      <button onclick="adminSetAsManager('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(34,197,94,.35);background:rgba(34,197,94,.1);color:#16a34a;font-weight:700;cursor:pointer;white-space:nowrap">👑 Manager</button>\n      <button onclick="adminRevokeMobileUser('${safeKey}','${safeName}')" style="font-size:10px;padding:5px 8px;border-radius:6px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.08);color:#f43f5e;font-weight:700;cursor:pointer;white-space:nowrap">🚫 Revoke</button>\n      ${delBtn}\n    </div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${delBtn}</div>`}function confirmDeleteMobileUser(mobileKey,name){if(!isAdmin())return void toast(L("❌ Admin only","❌ Admin only"));const title=L("🗑️ User Delete","🗑️ Delete user"),msg=L("<b>"+(name||mobileKey||"")+"</b> को पूरी तरह delete करें?<br><br>Mobile registration हट जाएगी — अगली बार <b>fresh person</b> की तरह login होगा।","Permanently delete <b>"+(name||mobileKey||"")+"</b>?<br><br>Mobile registration will be removed — next login will be treated as a <b>fresh</b> user.");"function"!=typeof confirmModal?confirm(String(msg).replace(/<[^>]+>/g," "))&&deleteMobileUserCompletely(mobileKey,name):confirmModal(title,msg,L("🗑️ हाँ, Delete","🗑️ Yes, Delete"),L("रद्द करें","Cancel")).then(ok=>{ok&&deleteMobileUserCompletely(mobileKey,name)})}async function deleteMobileUserCompletely(mobileKey,name){if(isAdmin())try{if(toast(L("⏳ Deleting…","⏳ Deleting…")),"function"==typeof _ensureWriteAuth&&!await _ensureWriteAuth())return void toast(L("❌ Phone ओटीपी सत्यापन करें — फिर Delete दबाएँ","❌ Verify phone OTP — then press Delete"));try{"function"==typeof _syncAuthRoleNodes&&await _syncAuthRoleNodes()}catch(e){}const data=await fbGet("mobileUsers")||{},mk="function"==typeof _normMobileKey?_normMobileKey(mobileKey):String(mobileKey||"").replace(/\D/g,"").slice(-10),toDelete=new Set;Object.keys(data).forEach(k=>{const keyN="function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10);k!==mobileKey&&keyN!==mk||toDelete.add(k)}),!toDelete.size&&mobileKey&&toDelete.add(mobileKey);const empKeys=[];try{const emps=await fbGet("employees")||{};Object.entries(emps).forEach(([id,e])=>{if(!e)return;const em="function"==typeof _normMobileKey?_normMobileKey(e.phone||e.mobile||""):String(e.phone||e.mobile||"").replace(/\D/g,"").slice(-10);em&&em===mk&&empKeys.push(id)})}catch(e){}
// Keep shift history: mark roster rows left_team (do not delete schedule data)
try{
  for(const eid of empKeys){
    try{
      const eRow = (_cache.employees||[]).find(x=>x&&x.id===eid) || {id:eid};
      await fbUpdate('employees/'+eid, {
        status: 'left_team',
        active: false,
        leftAt: new Date().toISOString(),
        leftReason: 'profile_deleted',
        role: 'member',
        accessLevel: 'worker',
        updatedAt: new Date().toISOString()
      });
      await fbSet('leftEmployees/'+eid, {
        ...eRow,
        status: 'left_team',
        leftAt: new Date().toISOString(),
        leftReason: 'profile_deleted',
        archivedAt: Date.now(),
        removedBy: (SESSION&&SESSION.name)||'admin'
      }).catch(()=>{});
    }catch(ex){}
  }
}catch(e){}
const extraPaths=[];for(const k of toDelete){const n="function"==typeof _normMobileKey?_normMobileKey(k):String(k||"").replace(/\D/g,"").slice(-10);n&&10===n.length&&(extraPaths.push("deviceApprovals/"+n),extraPaths.push("pendingMembers/"+n),extraPaths.push("userNotifications/"+n),extraPaths.push("mobileUsers/"+n)),extraPaths.push("mobileUsers/"+k)}let ok=0,fail=0;try{if("function"!=typeof fbUpdate)throw new Error("no multipath");{const patch={};toDelete.forEach(k=>{patch["mobileUsers/"+k]=null}),empKeys.forEach(id=>{patch["employees/"+id]=null}),extraPaths.forEach(path=>{patch[path]=null}),await fbUpdate("/",patch),ok=toDelete.size||1}}catch(multiErr){for(const k of toDelete)try{"function"==typeof fbRemove?await fbRemove("mobileUsers/"+k):await fbSet("mobileUsers/"+k,null),ok++}catch(e){try{await fbUpdate("mobileUsers/"+k,{status:"removed",role:"removed",removedAt:(new Date).toISOString(),removedBy:SESSION.name||"admin",forceFreshLogin:!0}),ok++}catch(e2){fail++}}for(const id of empKeys)try{"function"==typeof fbRemove?await fbRemove("employees/"+id):await fbSet("employees/"+id,null)}catch(e){}for(const path of extraPaths)try{"function"==typeof fbRemove?await fbRemove(path):await fbSet(path,null)}catch(e){}}try{_cache&&_cache.mobileUsers&&toDelete.forEach(k=>{try{delete _cache.mobileUsers[k]}catch(e){}})}catch(e){}ok&&!fail?toast(L("✅ ","✅ ")+(name||mk||"User")+L(" हटाया — अगली बार fresh login"," removed — next login is fresh")):ok?toast(L("⚠️ आंशिक delete","⚠️ Partial delete")):toast(L("❌ Delete failed — Admin phone ओटीपी से लॉगिन करें / rules deploy करें","❌ Delete failed — use Admin phone OTP / deploy rules"));try{renderAdminTeamHierarchy()}catch(e){}}catch(err){console.error(err),toast(L("❌ Delete failed: ","❌ Delete failed: ")+(err.message||err))}else toast(L("❌ Admin only","❌ Admin only"))}async function adminRevokeMobileUser(mobile,name){if(await confirmModal("Access Revoke करें?",`<b>${name}</b> की App access revoke होगी। वो login नहीं कर पाएंगे।`,L("🚫 हाँ, Revoke करें","🚫 Yes, Revoke"),L("रद्द करें","Cancel")))try{await fbUpdate("mobileUsers/"+mobile,{status:"revoked",revokedBy:SESSION.name,revokedAt:(new Date).toISOString()}),toast("🚫 "+name+L(" की पहुँच रद्द कर दी"," access revoked")),renderAdminTeamHierarchy()}catch(e){toast(L("❌ त्रुटि: ","❌ Error: ")+(e.message||e))}}async function adminRestoreMobileUser(mobile,name){try{await fbUpdate("mobileUsers/"+mobile,{status:"approved",restoredBy:SESSION.name,restoredAt:(new Date).toISOString()}),toast("✅ "+name+L(" की access restore हो गई"," access restored")),renderAdminTeamHierarchy()}catch(e){toast(L("❌ त्रुटि: ","❌ Error: ")+(e.message||e))}}async function adminExtendMobileValidity(mobile,name,days){try{const rec=await fbGet("mobileUsers/"+mobile).catch(()=>null),base=rec&&rec.validTill&&new Date(rec.validTill)>new Date?new Date(rec.validTill):new Date,newExp=new Date(base.getTime()+864e5*days);await fbUpdate("mobileUsers/"+mobile,{validTill:newExp.toISOString(),extendedBy:SESSION.name,extendedAt:(new Date).toISOString()});try{const empObjId=rec&&rec.empObjId||"";empObjId&&await fbUpdate("deviceApprovals/"+empObjId,{validTill:newExp.toISOString(),extendedBy:SESSION.name,extendedAt:(new Date).toISOString()})}catch(e2){}toast("✅ "+name+L(" की expiry "," expiry extended by ")+days+L(" दिन बढ़ाई → "," days → ")+newExp.toLocaleDateString("en-IN")),renderAdminTeamHierarchy()}catch(e){toast(L("❌ त्रुटि: ","❌ Error: ")+(e.message||e))}}function openAdminSetExpiryModal(key,name,bulkForManager){if(!isAdmin())return void toast(L('❌ केवल व्यवस्थापक','❌ Admin only'));const safeKey=String(key||""),defaultDate=new Date(Date.now()+31536e6).toISOString().slice(0,10),sub=bulkForManager?"This Manager की पूरी team के members की app expiry date एक साथ बदलें।":"इस user की app access expiry date set करें।";openModal(`<div class="modal-handle"></div>\n  <div class="modal-title">${escHtml(bulkForManager?"📅 All members under "+name+" — set Expiry":"📅 Set Expiry — "+name)}</div>\n  <div style="font-size:12px;color:var(--muted2);margin-bottom:12px">${sub}</div>\n  <div class="field"><label>Expiry date</label>\n    <input type="date" class="inp-field" id="adm_exp_date" value="${defaultDate}">\n  </div>\n  <div class="field"><label>या days जोड़ें (optional quick)</label>\n    <select class="inp-field" id="adm_exp_days" onchange="(function(s){var d=new Date();d.setDate(d.getDate()+parseInt(s.value||365,10));var el=document.getElementById('adm_exp_date');if(el)el.value=d.toISOString().slice(0,10);})(this)">\n      <option value="30">+30 days</option>\n      <option value="90">+90 days</option>\n      <option value="180">+180 days</option>\n      <option value="365" selected>+365 days (1 year)</option>\n      <option value="730">+730 days (2 years)</option>\n    </select>\n  </div>\n  <button class="submit-btn" onclick="adminApplyExpiryDate('${safeKey.replace(/'/g,"'")}','${String(name||"").replace(/'/g,"'")}',${bulkForManager?"true":"false"})">💾 Save Expiry</button>\n  <button class="cancel-btn" onclick="closeModal()">Cancel</button>`)}async function adminApplyExpiryDate(key,name,bulkForManager){if(!isAdmin())return void toast(L('❌ केवल व्यवस्थापक','❌ Admin only'));const dateStr=(document.getElementById("adm_exp_date")||{}).value;if(!dateStr)return void toast(L("⚠️ Date चुनें","⚠️ Select date"));const d=new Date(dateStr);if(isNaN(d.getTime()))return void toast(L('⚠️ अमान्य तिथि','⚠️ Invalid date'));d.setHours(23,59,59,999);const validTill=d.toISOString();try{if("function"==typeof _ensureWriteAuth&&!await _ensureWriteAuth())return void toast(L("❌ Phone/auth verify करें","❌ Verify phone/auth"))}catch(e){}if(bulkForManager)try{const allMu=await fbGet("mobileUsers")||{},mk=_normMobileKey(key),targets=Object.entries(allMu).filter(([k,v])=>!(!v||"member"!==v.role)&&("rejected"!==v.status&&"left_team"!==v.status&&(_normMobileKey(v.managerId||"")===mk||v.managerId===key)));if(!targets.length)return void toast(L("⚠️ इस Manager के under कोई member नहीं","⚠️ No members under this Manager"));let okN=0,failN=0;for(const[memKey,mem]of targets)try{await fbUpdate("mobileUsers/"+memKey,{validTill:validTill,extendedBy:SESSION.name||"admin",extendedAt:(new Date).toISOString(),bulkExpiryFromManager:key});const empObjId=mem.empObjId||"";empObjId&&await fbUpdate("deviceApprovals/"+empObjId,{validTill:validTill,extendedBy:SESSION.name||"admin",extendedAt:(new Date).toISOString()});try{const emp=(getEmps()||[]).find(e=>_normMobileKey(e.phone||e.mobile||"")===_normMobileKey(memKey));emp&&emp.id&&await fbUpdate("deviceApprovals/"+emp.id,{validTill:validTill,extendedBy:SESSION.name||"admin",extendedAt:(new Date).toISOString()})}catch(e2){}okN++}catch(e){failN++}closeModal(),toast(L("✅ ","✅ ")+okN+L(" सदस्यों की समाप्ति → "," members expiry → ")+d.toLocaleDateString("en-IN")+(failN?L(" · ❌ "," · ❌ ")+failN+L(" विफल"," failed"):""));try{renderAdminTeamHierarchy()}catch(e){}try{"function"==typeof renderTeam&&renderTeam()}catch(e){}}catch(err){toast(L("❌ बल्क विफल: ","❌ Bulk failed: ")+(err.message||err))}else try{await fbUpdate("mobileUsers/"+key,{validTill:validTill,extendedBy:SESSION.name||"admin",extendedAt:(new Date).toISOString()});const rec=await fbGet("mobileUsers/"+key).catch(()=>null),empObjId=rec&&rec.empObjId||"";empObjId&&await fbUpdate("deviceApprovals/"+empObjId,{validTill:validTill,extendedBy:SESSION.name||"admin",extendedAt:(new Date).toISOString()});try{const emp=(getEmps()||[]).find(e=>_normMobileKey(e.phone||e.mobile||"")===_normMobileKey(key));emp&&emp.id&&await fbUpdate("deviceApprovals/"+emp.id,{validTill:validTill,extendedBy:SESSION.name||"admin",extendedAt:(new Date).toISOString()})}catch(e2){}closeModal(),toast("✅ "+name+L(" समाप्ति → "," expiry → ")+d.toLocaleDateString("en-IN"));try{renderAdminTeamHierarchy()}catch(e){}try{"function"==typeof renderTeam&&renderTeam()}catch(e){}}catch(err){toast(L("❌ ","❌ ")+(err.message||err))}}function openTeamMemberExpiryModal(empId,empName){if(!isAdmin())return void toast(L('❌ केवल व्यवस्थापक','❌ Admin only'));const emp=(getEmps()||[]).find(e=>e.id===empId),mob=emp?_normMobileKey(emp.phone||emp.mobile||""):"";if(mob)return void openAdminSetExpiryModal(mob,empName||emp?.name||"",!1);const defaultDate=new Date(Date.now()+31536e6).toISOString().slice(0,10);openModal(`<div class="modal-handle"></div>\n  <div class="modal-title">📅 Set Expiry — ${escHtml(empName||"")}</div>\n  <div class="field"><label>Expiry date</label>\n    <input type="date" class="inp-field" id="adm_exp_date" value="${defaultDate}">\n  </div>\n  <button class="submit-btn" onclick="(async()=>{const ds=(document.getElementById('adm_exp_date')||{}).value;if(!ds){toast(L('Date चुनें','Select date'));return;}const ok=await extendUserExpiry('${empId}',ds);if(ok){closeModal();try{renderTeam();}catch(e){}}})()">💾 Save</button>\n  <button class="cancel-btn" onclick="closeModal()">Cancel</button>`)}async function approveLoginRequest(reqKey,empObjId,deviceId,empName){try{if("function"==typeof _ensureWriteAuth&&!await _ensureWriteAuth())return void toast(L('❌ लॉगिन/प्रमाणीकरण आवश्यक — पुनः प्रयास करें','❌ Login/auth required — try again'));let selfieUrl="",phone="";try{const req=await fbGet("loginRequests/"+reqKey);selfieUrl=req?.selfieUrl||"",phone=req?.phone||""}catch(e2){}if(await fbUpdate("loginRequests/"+reqKey,{status:"approved",approvedBy:SESSION.name,approvedAt:(new Date).toISOString()}),empObjId&&deviceId&&await fbUpdate("deviceApprovals/"+empObjId,{approvedDeviceId:deviceId,approvedAt:(new Date).toISOString(),validTill:new Date(Date.now()+31536e6).toISOString(),empName:empName,approvedBy:SESSION.name}),empObjId&&selfieUrl)try{await fbUpdate("employees/"+empObjId,{photo:selfieUrl})}catch(e2){}if(empObjId&&phone&&10===phone.length)try{await fbUpdate("employees/"+empObjId,{phone:phone})}catch(e2){}toast("✅ "+empName+L(" का लॉगिन स्वीकृत!"," — login approved!")),renderPending()}catch(e){toast(L("❌ त्रुटि: ","❌ Error: ")+(e.message||e))}}async function rejectLoginRequest(reqKey,empName){try{if("function"==typeof _ensureWriteAuth&&!await _ensureWriteAuth())return void toast(L('❌ प्रमाणीकरण आवश्यक','❌ Auth required'));await fbUpdate("loginRequests/"+reqKey,{status:"rejected",rejectedBy:SESSION.name,rejectedAt:(new Date).toISOString()}),toast("❌ "+empName+L(" का लॉगिन अस्वीकृत"," — login rejected")),renderPending()}catch(e){toast(L("❌ त्रुटि: ","❌ Error: ")+(e.message||e))}}function renderPending(){try{const _tt=document.getElementById("myTeamPendingTitle");if(_tt)_tt.textContent=L("मेरी TEAM — PENDING MEMBERS","My TEAM — PENDING MEMBERS")}catch(e){}try{"function"==typeof renderDeviceTransferRequests&&renderDeviceTransferRequests()}catch(e){}try{const adminBlock=document.getElementById("adminOnlyPendingBlock");adminBlock&&(adminBlock.style.display=isAdmin()||isMgr()?"block":"none")}catch(e){}try{const mgrRegs=document.getElementById("adminMgrRegsBlock");mgrRegs&&(mgrRegs.style.display=isAdmin()?"block":"none")}catch(e){}try{const regTitle=document.querySelector("#pendingRegs");if(regTitle){const wrap=regTitle.previousElementSibling;wrap&&wrap.classList&&wrap.classList.contains("pending-group-title")&&(wrap.style.display=isAdmin()?"":"none"),regTitle.style.display=isAdmin()?"":"none"}}catch(e){}try{const teamBlock=document.getElementById("myTeamApprovalsBlock");teamBlock&&(teamBlock.style.display=isMgr()&&!isAdmin()?"block":"none")}catch(e){}if(isAdmin())try{renderManagerApprovals()}catch(e){}if(isAdminOrMgr()){const lrEl=document.getElementById("pendingLoginRequests");fbGet("loginRequests").then(data=>{let reqs=data?Object.entries(data).filter(([k,v])=>v&&"pending"===v.status):[];isMgr()&&!isAdmin()&&(reqs=reqs.filter(([k,v])=>"manager_login_approval"===v.type?_isMyTeamLoginRequest(v):(v.type,!1))),lrEl&&(reqs.length?lrEl.innerHTML=reqs.map(([k,v])=>{const isMgrAppr="manager_login_approval"===v.type;return`\n        <div class="card" style="border-left:3px solid #f97316">\n          <div class="card-row">\n            <div class="card-ico" style="background:rgba(249,115,22,.15)">&#128241;</div>\n            <div class="card-body">\n              <div class="card-name">${escHtml(v.empName||v.phone||"Member")}</div>\n              <div class="card-sub">${escHtml(isMgrAppr?"Manager login approval":"Code: "+(v.empId||"—"))}${escHtml(v.phone?" · 📱 "+v.phone:"")}</div>\n              <div class="card-meta">${v.requestedAt?new Date(v.requestedAt).toLocaleString("function"==typeof mpLocale?mpLocale():"en-IN"):""}</div>\n              ${isMgrAppr?'<div style="font-size:11px;color:#38bdf8;font-weight:700">Registered member — approve to login without OTP</div>':""}\n              ${v.isNewReg?'<div style="font-size:11px;color:#f97316;font-weight:700">&#128100; Newly Registered Employee</div>':""}\n              ${v.selfieUrl?`<div style="margin-top:8px;display:flex;align-items:center;gap:8px"><img src="${v.selfieUrl}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid rgba(249,115,22,.5);cursor:pointer" onclick="window.open('${v.selfieUrl}','_blank')"><span style="font-size:11px;color:#94a3b8">📸 Selfie</span></div>`:""}\n            </div>\n          </div>\n          <div class="action-row">\n            <button class="act-btn approve" onclick="${isMgrAppr?`approveManagerLoginRequest('${k}')`:`approveLoginRequest('${k}','${v.empObjId||""}','${v.deviceId||""}','${escHtml((v.empName||"").replace(/'/g,"'"))}')`}">&#9989; Approve</button>\n            <button class="act-btn reject"  onclick="${isMgrAppr?`rejectManagerLoginRequest('${k}')`:`rejectLoginRequest('${k}','${escHtml((v.empName||"").replace(/'/g,"'"))}')`}">&#10060; Reject</button>\n          </div>\n        </div>`}).join(""):`<div class="empty" style="padding:16px"><div class="empty-text" style="font-size:12px">${L("👤 कोई Login Request नहीं","👤 No Login Requests")}</div></div>`)}).catch(()=>{lrEl&&(lrEl.innerHTML="")})}try{_renderPendingShiftChangeRequests()}catch(e){}renderPendingDevices();const regs=getRegs().filter(r=>"pending"===r.status);document.getElementById("pendingRegs").innerHTML=regs.length?regs.map(r=>`\n    <div class="card">\n      <div class="card-row">\n        <div class="card-ico" style="background:${r.isExternal?"rgba(56,189,248,.12)":"var(--daybg)"}">${escHtml(r.isExternal?r.companyIco||"🏢":"👤")}</div>\n        <div class="card-body">\n          <div class="card-name">${escHtml(r.name||r.empId)}</div>\n          <div class="card-sub">Code: ${escHtml(r.empId)} · ${secName(r.sec)||r.dept||""} ${escHtml(r.phone?"· 📱 "+r.phone:"")}</div>\n          <div class="card-meta">${new Date(r.requestedAt).toLocaleString("function"==typeof mpLocale?mpLocale():"en-IN")}</div>\n          ${r.selfieUrl?`<div style="margin-top:8px;display:flex;align-items:center;gap:8px"><img src="${r.selfieUrl}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid rgba(249,115,22,.5);cursor:pointer" onclick="window.open('${r.selfieUrl}','_blank')"><span style="font-size:11px;color:#94a3b8">📸 Selfie<br><span style="font-size:10px;color:#64748b">Tap to zoom</span></span></div>`:`<div style="margin-top:6px;font-size:11px;color:#f43f5e">${L("⚠️ कोई Selfie नहीं","⚠️ No Selfie")}</div>`}\n        </div>\n      </div>\n      <div class="action-row">\n        <button class="act-btn approve" onclick="actReg('${r._key||r.id}','approved')">✅ मंजूर करें</button>\n        <button class="act-btn reject"  onclick="actReg('${r._key||r.id}','rejected')">❌ ${L('अस्वीकार','Reject')}</button>\n      </div>\n    </div>`).join(""):`<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">${L("कोई नया रजिस्ट्रेशन नहीं","No new registrations")}</div></div>`;const leaves=getLeaves().filter(l=>"pending"===l.status),_pgLeave=document.getElementById("pendingLeaves");if(_pgLeave&&!_pgLeave.previousElementSibling?.classList?.contains("pending-group-title")){const h=document.createElement("div");h.className="pending-group-title",h.textContent="Leave requests",_pgLeave.parentNode.insertBefore(h,_pgLeave)}document.getElementById("pendingLeaves").innerHTML=leaves.length?leaves.map(l=>`\n    <div class="card">\n      <div class="card-row">\n        <div class="card-ico" style="background:var(--daybg)">📅</div>\n        <div class="card-body">\n          <div class="card-name">${escHtml(l.empName)}${(()=>{const c=l.empCode||l.empNo||"";if(c)return` <span style="font-size:12px;font-weight:700;color:var(--muted2)">· #${escHtml(String(c))}</span>`;const emp=(getEmps()||[]).find(e=>e.id===l.empId||e.empId===l.empId),code=emp&&emp.empId?emp.empId:"";return code?` <span style="font-size:12px;font-weight:700;color:var(--muted2)">· #${escHtml(String(code))}</span>`:""})()}</div>\n          <div class="card-sub">${l.leaveType} · ${l.days} दिन${l.coffDate?` · <span style="color:#f97316">📅 Shift था: ${l.coffDate}</span>`:""}</div>\n          <div class="card-meta">${fmtDate(l.from)}${l.from!==l.to?" → "+fmtDate(l.to):""}</div>\n          ${l.reason?`<div style="margin-top:6px;padding:7px 10px;background:var(--card2);border-left:3px solid var(--day);border-radius:0 8px 8px 0;font-size:12px;color:var(--text);font-weight:600">📝 ${escHtml(l.reason)}</div>`:'<div style="margin-top:4px;font-size:11px;color:var(--lv);font-weight:600">⚠️ कारण नहीं दिया गया</div>'}\n        </div>\n      </div>\n      <div class="action-row">\n        <button type="button" class="act-btn approve" data-leave-key="${l._key||l.id||""}" onclick="event.stopPropagation();actLeave(this.getAttribute('data-leave-key')||'','approved')">✅ Approve</button>\n        <button type="button" class="act-btn reject"  data-leave-key="${l._key||l.id||""}" onclick="event.stopPropagation();actLeave(this.getAttribute('data-leave-key')||'','rejected')">❌ Reject</button>\n        <button type="button" class="act-btn edit" data-leave-key="${l._key||l.id||""}" onclick="event.stopPropagation();openEditLeaveForm(this.getAttribute('data-leave-key')||'')">✏️ Edit</button>\n        <button type="button" class="act-btn reject" data-leave-key="${l._key||l.id||""}" onclick="event.stopPropagation();deleteLeaveRecord(this.getAttribute('data-leave-key')||'')">🗑️ Delete</button>\n      </div>\n    </div>`).join(""):`<div class="empty"><div class="empty-icon">🌴</div><div class="empty-text">${L("कोई छुट्टी पेंडिंग नहीं","No pending leaves")}</div></div>`;const reports=getReports().filter(r=>"pending"===r.status);document.getElementById("pendingReports").innerHTML=reports.length?reports.map(r=>{const rt=REPORT_TYPES[r.type]||REPORT_TYPES.ncr;return`<div class="card">\n      <div class="card-row">\n        <div class="card-ico" style="background:${rt.bg}">${rt.ico}</div>\n        <div class="card-body">\n          <div class="card-name">${r.aboutName}</div>\n          <div class="card-sub">${escHtml(rt.label)} · ${fmtDate(r.date)}</div>\n          <div class="card-meta">${r.description}</div>\n          <div class="card-meta">${L('रिपोर्ट','Report')}: ${r.reportedByName}</div>\n        </div>\n      </div>\n      <div class="action-row">\n        <button class="act-btn approve" onclick="actReport('${r._key}','approved')">✅ ${L('मंजूर','Approve')}</button>\n        <button class="act-btn reject"  onclick="actReport('${r._key}','rejected')">❌ ${L('अस्वीकार','Reject')}</button>\n      </div>\n    </div>`}).join(""):`<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">${L("कोई रिपोर्ट पेंडिंग नहीं","No reports pending")}</div></div>`,updatePendingBadge()}async function actReg(key,status){let reg=getRegs().find(r=>r._key===key||r.id===key);if(!reg)try{const snap=await fbGet("regRequests/"+key);snap&&(reg={...snap,_key:key})}catch(e){}if("approved"===status){if(!reg)return void toast(L("❌ Data नहीं मिला — page refresh करें","❌ Data not found — refresh the page"));const displayName=reg.name&&reg.name!==reg.empId?reg.name:reg.empId,newId="e"+Date.now().toString(36),newEmp={id:newId,name:displayName,empId:reg.empId,sec:reg.sec||reg.dept||"MET",mc:reg.mc||"—",resp:"Operation",woff:"SUN",status:"active",phone:reg.phone||"",ms:Array(31).fill("D")};try{await fbUpdate("employees/"+newId,newEmp)}catch(e){return void toast(L("❌ Employee add नहीं हुआ: ","❌ Could not add employee: ")+e.message)}if(reg.passHash)try{await fbSet("workerPasswords/"+newId,reg.passHash)}catch(e){}await fbUpdate("regRequests/"+key,{status:"approved",actionAt:(new Date).toISOString(),linkedEmpId:newId,approvedBy:SESSION.name||"admin"});try{await fbPush("userNotifications/"+newId,{title:"✅ Registration Approved!",body:"आपका registration approve हो गया। अब login करें।",read:!1,at:(new Date).toISOString()})}catch(e){}toast("✅ "+displayName+" ("+reg.empId+") "+L("approved! Team में add हो गए।","approved! Added to team."))}else await fbUpdate("regRequests/"+key,{status:status,actionAt:(new Date).toISOString(),actionBy:SESSION.name||"admin"}),toast(L("❌ रजिस्ट्रेशन अस्वीकार किया","❌ Registration rejected"));renderPending()}

/** Admin: set this mobile user as the active Manager; demote other managers in same company */
async function adminSetAsManager(phone, name){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const key = (typeof _normMobileKey==='function'?_normMobileKey(phone):String(phone||'').replace(/\D/g,'').slice(-10));
  if(!key || key.length!==10){ toast(L('⚠️ अमान्य मोबाइल','⚠️ Invalid mobile')); return; }
  try{
    toast(L('⏳ प्रबंधक बनाया जा रहा है…','⏳ Promoting to Manager…'));
    const muAll = await fbGet('mobileUsers').catch(()=>null) || {};
    const me = muAll[key] || Object.values(muAll).find(u=>_normMobileKey(u.mobile||u.phone||'')===key) || {};
    // ONLY promote this person — do NOT demote other managers or steal other teams
    await fbUpdate('mobileUsers/'+key, {
      role: 'manager',
      status: 'approved',
      name: name || me.name || key,
      mobile: key,
      phone: key,
      company: me.company || '',
      companyId: me.companyId || '',
      updatedAt: new Date().toISOString(),
      promotedBy: (SESSION && SESSION.name) || 'admin'
    }).catch(()=>fbSet('mobileUsers/'+key, {
      role: 'manager',
      status: 'approved',
      name: name || me.name || key,
      mobile: key,
      phone: key,
      updatedAt: new Date().toISOString()
    }));
    // Align employee row if exists
    try{
      const emps = _cache.employees || [];
      const emp = emps.find(e=>_normMobileKey(e.phone||e.mobile||'')===key);
      if(emp && emp.id){
        await fbUpdate('employees/'+emp.id, {
          role: 'manager',
          accessLevel: 'manager',
          isTeamManager: true,
          status: 'active',
          managerId: key,
          updatedAt: new Date().toISOString()
        });
      }
    }catch(ex){}
    toast('✅ '+(name||key)+L(' अब प्रबंधक हैं (अन्य टीमें अपरिवर्तित)',' is Manager (other teams unchanged)'));
    try{ if(typeof renderAdminTeamHierarchy==='function') renderAdminTeamHierarchy(); }catch(e){}
  }catch(err){
    console.error(err);
    toast(L('❌ ','❌ ')+(err.message||err.code||L('विफल','failed')));
  }
}



/** Admin: set payment paid-until date for one user (or all members under a manager)
 * Prefills last saved paid-until date + amount so reopening is not confusing.
 */
async function openAdminSetPaymentModal(key, name, bulkForManager){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const safeKey = String(key||'');
  const safeName = String(name||'').replace(/</g,'');
  const norm = (p)=> (typeof _normMobileKey==='function'?_normMobileKey(p):String(p||'').replace(/\D/g,'').slice(-10));
  const ph = norm(safeKey);

  // Load last saved paid-until + amount for this account (manager self for bulk)
  let existingDate = '';
  let existingAmt = null;
  try{
    let rec = null;
    if(ph && _cache && _cache.mobileUsers){
      const mu = _cache.mobileUsers;
      rec = mu[ph] || mu[safeKey] || null;
      if(!rec){
        for(const [k,v] of Object.entries(mu)){
          if(norm(k)===ph || norm(v&&(v.mobile||v.phone))===ph){ rec = v; break; }
        }
      }
    }
    if(!rec && ph && typeof fbGet==='function'){
      rec = await fbGet('mobileUsers/'+ph).catch(()=>null);
    }
    // paymentStatus path (works even when mobileUsers write is denied)
    if(ph && typeof fbGet==='function'){
      try{
        const ps = await fbGet('paymentStatus/'+ph).catch(()=>null);
        if(ps && typeof ps==='object'){
          if(!rec) rec = {};
          // prefer explicit paymentStatus dates if mobileUsers empty
          if(!rec.paymentPaidUntilDate && !rec.paymentPaidUntil && !rec.paidUntil){
            rec = Object.assign({}, rec, ps);
          } else {
            // merge amount if missing
            if(!rec.paymentAmount && ps.paymentAmount) rec.paymentAmount = ps.paymentAmount;
          }
        }
      }catch(_ps){}
    }
    if(rec && typeof rec==='object'){
      const raw = rec.paymentPaidUntilDate || rec.paymentPaidUntil || rec.paidUntil || '';
      if(raw){
        const s = String(raw);
        // Accept YYYY-MM-DD or ISO datetime
        const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
        if(m) existingDate = m[1];
        else {
          const d = new Date(s);
          if(!isNaN(d.getTime())) existingDate = d.toISOString().slice(0,10);
        }
      }
      const a = parseInt(rec.paymentAmount, 10);
      if(a > 0) existingAmt = a;
    }
  }catch(e){}

  const fallbackDate = new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  const defaultDate = existingDate || fallbackDate;
  const amounts = (typeof _getPaymentAmountOptions==='function')
    ? _getPaymentAmountOptions(window._paymentSettingsCache)
    : [199,499,999,1499,2499];
  let defAmt = existingAmt;
  if(defAmt == null || !(defAmt > 0)){
    defAmt = (amounts && amounts.length) ? parseInt(amounts[0],10) : 999;
  }
  // Load payment settings for plan list
  let payCfg = window._paymentSettingsCache || {};
  try{
    if(typeof _loadPaymentSettings === 'function'){
      payCfg = (await _loadPaymentSettings(true)) || payCfg;
    }
  }catch(_pc){}

  // Build labelled plan options (monthly + annual) like user "Choose plan"
  let planRows = [];
  try{
    let plans = [];
    if(typeof window._getSubscriptionPlans === 'function'){
      plans = window._getSubscriptionPlans(payCfg) || [];
    } else if(payCfg && Array.isArray(payCfg.plans) && payCfg.plans.length){
      plans = payCfg.plans;
    }
    // Ensure annual computed
    const disc = Math.min(90, Math.max(0, parseInt(payCfg.defaultDiscountPct, 10) || 12));
    plans.forEach(function(p){
      if(!p || p.custom) return;
      const monthly = parseInt(p.monthly, 10) || 0;
      if(!monthly) return;
      const d = (p.discountPct != null ? parseInt(p.discountPct,10) : disc) || disc;
      const annual = parseInt(p.annual, 10) || Math.round(monthly * 12 * (1 - d / 100));
      const label = p.label || ('Plan ₹' + monthly);
      planRows.push({ label: label, amount: monthly, period: 'monthly', periodLabel: 'Monthly', maxMembers: p.maxMembers || 0 });
      if(annual > 0){
        planRows.push({ label: label, amount: annual, period: 'annual', periodLabel: 'Annual', maxMembers: p.maxMembers || 0 });
      }
    });
  }catch(_pl){}

  // Fallback: raw amounts list
  if(!planRows.length){
    const amtList0 = (amounts || []).map(function(a){ return parseInt(a,10); }).filter(function(a){ return a > 0; });
    amtList0.forEach(function(a){
      const meta = (typeof _planLabelFromAmount === 'function') ? _planLabelFromAmount(a, payCfg) : null;
      planRows.push({
        label: meta ? meta.band : ('₹' + a),
        amount: a,
        period: meta ? meta.period : 'monthly',
        periodLabel: meta ? meta.periodLabel : 'Monthly',
        maxMembers: meta ? meta.maxMembers : 0
      });
    });
  }

  // Ensure current amount is in the list
  if(defAmt && !planRows.some(function(r){ return r.amount === defAmt; })){
    const meta = (typeof _planLabelFromAmount === 'function') ? _planLabelFromAmount(defAmt, payCfg) : null;
    planRows.unshift({
      label: meta ? meta.band : ('₹' + defAmt),
      amount: defAmt,
      period: meta ? meta.period : 'monthly',
      periodLabel: meta ? meta.periodLabel : 'Monthly',
      maxMembers: meta ? meta.maxMembers : 0
    });
  }

  const currentPlan = (defAmt && typeof _planLabelFromAmount === 'function')
    ? _planLabelFromAmount(defAmt, payCfg)
    : null;

  const planChipsHtml = planRows.map(function(r){
    const selected = r.amount === defAmt;
    const border = selected ? '2px solid #059669' : '1px solid #cbd5e1';
    const bg = selected ? 'rgba(16,185,129,.12)' : '#fff';
    const badge = selected
      ? '<span style="font-size:9px;font-weight:800;color:#059669;background:rgba(16,185,129,.15);padding:2px 6px;border-radius:4px;margin-left:4px">Current</span>'
      : '';
    return '<button type="button" data-amt="'+r.amount+'" onclick="(function(b){var sel=document.getElementById(\'adm_pay_amount\');if(sel){sel.value=b.getAttribute(\'data-amt\');}document.querySelectorAll(\'[data-amt]\').forEach(function(x){x.style.border=\'1px solid #cbd5e1\';x.style.background=\'#fff\';var c=x.querySelector(\'.cur-badge\');if(c)c.style.display=\'none\';});b.style.border=\'2px solid #059669\';b.style.background=\'rgba(16,185,129,.12)\';var c2=b.querySelector(\'.cur-badge\');if(c2)c2.style.display=\'inline\';})(this)" style="text-align:left;padding:10px 12px;border-radius:10px;border:'+border+';background:'+bg+';cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:2px;min-width:140px;flex:1 1 140px">'
      + '<div style="font-size:12px;font-weight:800;color:#0f172a">'+String(r.label||'').replace(/</g,'')+badge.replace('Current','Current').replace('<span','<span class="cur-badge"')+'</div>'
      + '<div style="font-size:11px;color:#64748b">'+r.periodLabel+' · ₹'+r.amount+'</div>'
      + '</button>';
  }).join('');

  // Hidden select kept for adminApplyPaymentDate
  const amtOpts = planRows.map(function(r){
    return '<option value="'+r.amount+'" '+(r.amount===defAmt?'selected':'')+'>₹'+r.amount+' · '+(r.periodLabel||'')+' · '+String(r.label||'').replace(/</g,'')+'</option>';
  }).join('');

  const sub = bulkForManager
    ? (typeof L==='function'?L('इस Manager + team की subscription plan और paid-until date सेट करें।','Set subscription plan & paid-until for this Manager + team.'):'Set plan & paid-until for Manager + team')
    : (typeof L==='function'?L('इस user का subscription plan और paid-until','Subscription plan & paid-until for this user'):'Plan & paid-until for this user');

  const currentHint = currentPlan
    ? '<div style="font-size:12px;color:#059669;margin:-4px 0 10px;font-weight:700;padding:8px 10px;border-radius:8px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25)">📌 Current plan: <b>'+String(currentPlan.label).replace(/</g,'')+'</b> (₹'+currentPlan.amount+')'+(existingDate?(' · until <b>'+existingDate+'</b>'):'')+'</div>'
    : (existingDate
      ? '<div style="font-size:11px;color:var(--ok,#16a34a);margin:-4px 0 10px;font-weight:600">📌 Currently set: <b>'+existingDate+'</b>'+(existingAmt!=null?(' · ₹'+existingAmt):'')+'</div>'
      : '<div style="font-size:11px;color:var(--muted2);margin:-4px 0 10px">'+(typeof L==='function'?L('अभी कोई plan/paid-until सेव नहीं — नीचे चुनें','No plan/paid-until saved yet — pick below'):'No plan/paid-until saved yet — pick below')+'</div>');

  openModal('<div class="modal-handle"></div>'
  + '<div class="modal-title">💳 '+(bulkForManager?('Pay — team of '+safeName):('Pay — '+safeName))+'</div>'
  + '<div style="font-size:12px;color:var(--muted2);margin-bottom:8px">'+sub+'</div>'
  + currentHint
  + '<div class="field"><label>Choose plan (same as user plans)</label>'
  + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px">'+planChipsHtml+'</div>'
  + '<select class="inp-field" id="adm_pay_amount" style="margin-top:4px">'+amtOpts+'</select>'
  + '</div>'
  + '<div class="field"><label>Paid until date</label>'
  + '<input type="date" class="inp-field" id="adm_pay_until" value="'+defaultDate+'">'
  + '</div>'
  + '<div class="field"><label>Quick days</label>'
  + '<select class="inp-field" id="adm_pay_days" onchange="(function(s){var d=new Date();d.setDate(d.getDate()+parseInt(s.value||30,10));var el=document.getElementById(\'adm_pay_until\');if(el)el.value=d.toISOString().slice(0,10);})(this)">'
  + '<option value="30"'+(!existingDate?' selected':'')+'>30 days</option>'
  + '<option value="90">90 days</option>'
  + '<option value="180">180 days</option>'
  + '<option value="365">365 days</option>'
  + '</select>'
  + '</div>'
  + '<button class="submit-btn" onclick="adminApplyPaymentDate(\''+safeKey.replace(/'/g,"\\'")+'\',\''+safeName.replace(/'/g,"\\'")+'\','+(bulkForManager?'true':'false')+')">💾 Save plan + paid-until</button>'
  + '<button class="cancel-btn" onclick="closeModal()">Cancel</button>');
}

async function adminApplyPaymentDate(key, name, bulkForManager){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const ds = (document.getElementById('adm_pay_until')||{}).value || '';
  const amt = parseInt((document.getElementById('adm_pay_amount')||{}).value||'999',10) || 999;
  if(!ds){ toast(typeof L==='function'?L('Date चुनें','Select date'):'Select date'); return; }
  // Local end-of-day so timezone does not push date back a day
  const localEnd = new Date(ds + 'T23:59:59');
  const iso = isNaN(localEnd.getTime()) ? new Date(ds+'T23:59:59.000Z').toISOString() : localEnd.toISOString();
  const norm = (p)=> (typeof _normMobileKey==='function'?_normMobileKey(p):String(p||'').replace(/\D/g,'').slice(-10));
  const mgrKey = norm(key);
  if(!mgrKey || mgrKey.length!==10){
    toast(L('⚠️ अमान्य प्रबंधक मोबाइल: ','⚠️ Invalid manager mobile: ')+String(key));
    return;
  }
  // Resolve plan metadata for team list + Pay-until display
  let planMeta = null;
  try{
    if(typeof _planLabelFromAmount === 'function'){
      planMeta = _planLabelFromAmount(amt, window._paymentSettingsCache || {});
    }
  }catch(_pm){}
  const payload = {
    paymentAmount: amt,
    paymentPaidUntil: iso,
    paidUntil: iso,
    paymentPaidUntilDate: ds,
    updatedAt: new Date().toISOString(),
    paymentUpdatedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
  };
  if(planMeta){
    payload.planLabel = planMeta.label || '';
    payload.planPeriod = planMeta.period || '';
    payload.planMaxMembers = planMeta.maxMembers || 0;
    // Also keep validTill in sync so Active · Xd left works on managers list
    payload.validTill = iso;
  } else {
    payload.validTill = iso;
  }

  async function writeMu(phone){
    const ph = norm(phone);
    if(!ph || ph.length!==10) return {ok:false, ph, err:'bad phone'};
    let payOk = false, muOk = false, lastErr = '';
    // 1) paymentStatus/{phone} — dedicated path (rules allow admin / hard-admin)
    try{
      await fbSet('paymentStatus/'+ph, Object.assign({}, payload, {
        mobile: ph, phone: ph, name: name || ph
      }));
      payOk = true;
      try{
        window._paymentStatusCache = window._paymentStatusCache || {};
        window._paymentStatusCache[ph] = Object.assign({}, payload, { mobile: ph });
      }catch(_c){}
    }catch(ePay){
      lastErr = (ePay && (ePay.message||ePay.code)) || 'paymentStatus write failed';
    }
    // 2) mobileUsers/{phone} — best-effort (same fields; may PERMISSION_DENIED)
    try{
      await fbUpdate('mobileUsers/'+ph, payload);
      muOk = true;
    }catch(e1){
      try{
        const prev = await fbGet('mobileUsers/'+ph).catch(()=>null) || {};
        await fbSet('mobileUsers/'+ph, Object.assign({}, prev, payload, {
          mobile: ph, phone: ph,
          name: prev.name || name || ph
        }));
        muOk = true;
      }catch(e2){
        lastErr = (e2&&(e2.message||e2.code))||(e1&&(e1.message||e1.code))||lastErr||'write failed';
      }
    }
    if(muOk || payOk){
      try{
        if(typeof _cache!=='undefined'){
          _cache.mobileUsers = _cache.mobileUsers || {};
          const prev = _cache.mobileUsers[ph] || {};
          _cache.mobileUsers[ph] = Object.assign({}, prev, payload, { mobile: ph, phone: ph });
        }
      }catch(_c){}
      return {ok:true, ph, payOk, muOk};
    }
    return {ok:false, ph, err: lastErr || 'PERMISSION_DENIED'};
  }

  try{
    toast(L('⏳ भुगतान-अवधि सहेज रहे हैं…','⏳ Saving paid-until…'));
    // Phone Auth must be active — rules only allow admin / hard-admin / managers(member-only)
    if(typeof _ensureWriteAuth==='function'){
      const authOk = await _ensureWriteAuth();
      if(!authOk){
        toast(L('❌ फ़ोन सत्यापन आवश्यक — इस डिवाइस पर व्यवस्थापक ओटीपी पूरा करें, फिर भुगतान-अवधि आज़माएँ','❌ Phone verify required — Admin must complete OTP on this device, then retry Pay until'));
        return;
      }
    }
    let okN = 0, failN = 0, fails = [];
    // Always write manager self first
    const r0 = await writeMu(mgrKey);
    if(r0.ok) okN++; else { failN++; fails.push(r0.ph+': '+(r0.err||'')); }

    if(bulkForManager){
      const muAll = await fbGet('mobileUsers').catch(()=>null) || {};
      const targets = new Set();
      Object.entries(muAll).forEach(([k,u])=>{
        if(!u) return;
        const uk = norm(u.mobile||u.phone||k);
        if(!uk || uk===mgrKey) return;
        const mid = norm(u.managerId||u.managerMobile||'');
        // Team under this manager OR same transferredFrom / previousManager
        if(mid===mgrKey) targets.add(uk);
        if(norm(u.transferredFrom||'')===mgrKey) targets.add(uk);
      });
      // Also employees with managerId = this manager → their phones
      try{
        const emps = (_cache.employees||[]);
        emps.forEach(e=>{
          if(!e) return;
          if(norm(e.managerId||'')!==mgrKey) return;
          const ep = norm(e.phone||e.mobile||'');
          if(ep.length===10) targets.add(ep);
        });
      }catch(ex){}

      for(const ph of targets){
        const r = await writeMu(ph);
        if(r.ok) okN++; else { failN++; fails.push(r.ph+': '+(r.err||'')); }
      }
    }

    if(okN>0){
      toast(L('✅ भुगतान-अवधि ','✅ Paid-until ')+ds+' · ₹'+amt+L('/माह सहेजा · ','/mo saved for ')+okN+L(' खाते',' account(s)')+(failN?L(' · ',' · ')+failN+L(' विफल',' failed'):''));
    } else {
      const hint = (typeof L==='function'
        ? L('❌ सहेजना विफल (PERMISSION_DENIED).\n1) Firebase में rules deploy करें (paymentStatus)\n2) Admin OTP login: हार्ड-एडमिन phone या mobileUsers/{phone}/role=admin\n3) Logout → OTP फिर Save','❌ Save failed (PERMISSION_DENIED).\n1) Deploy RTDB rules (paymentStatus)\n2) Admin OTP login: hard-admin phone or role=admin\n3) Logout → OTP → Save again')
        : '❌ PERMISSION_DENIED — deploy paymentStatus rules + Admin OTP login');
      toast(hint+' '+(fails[0]||''));
    }
    try{ closeModal(); }catch(e){}
    try{ if(typeof renderAdminTeamHierarchy==='function') renderAdminTeamHierarchy(); }catch(e){}
  }catch(err){
    console.error(err);
    toast(L('❌ ','❌ ')+(err.message||err.code||L('विफल','failed')));
  }
}




/**
 * One-time / anytime repair for ALREADY transferred teams:
 * - Promote current employees with role/accessLevel manager into mobileUsers.manager
 * - Remove mobileUsers manager role from left_team / removed / stale managers
 * - Re-point mobileUsers.managerId to the live manager for each company
 */
async function adminRepairManagerHierarchy(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  try{
    toast(L('⏳ वास्तविक टीम स्वामित्व से सुधार…','⏳ Repairing from real team ownership…'));
    const norm = (p)=> (typeof _normMobileKey==='function' ? _normMobileKey(p) : String(p||'').replace(/\D/g,'').slice(-10));
    const LEFT = new Set(['left','left_team','resigned','removed','revoked']);
    const muAll = await fbGet('mobileUsers').catch(()=>null) || {};
    let emps = _cache.employees || [];
    if(!emps.length){
      try{
        const raw = await fbGet('employees');
        if(raw && typeof raw==='object'){
          emps = Object.entries(raw).map(([id,v])=>({...(v||{}), id:(v&&v.id)||id}));
          _cache.employees = emps;
        }
      }catch(e){}
    }
    const tasks = [];
    const activeEmps = emps.filter(e=>{
      if(!e) return false;
      const st = String(e.status||'active').toLowerCase();
      return !LEFT.has(st);
    });

    // Count roster size by managerId (source of truth for "who owns the team")
    const rosterByMgr = {}; // phone -> [emps]
    activeEmps.forEach(e=>{
      const mid = norm(e.managerId||'');
      if(mid.length!==10) return;
      if(!rosterByMgr[mid]) rosterByMgr[mid] = [];
      rosterByMgr[mid].push(e);
    });

    // Phones that should be managers: have roster OR employee self flagged manager with a phone
    const shouldBeMgr = new Set(Object.keys(rosterByMgr).filter(k=>rosterByMgr[k].length>0));
    activeEmps.forEach(e=>{
      const isMgr = String(e.role||'').toLowerCase()==='manager'
        || String(e.accessLevel||'').toLowerCase()==='manager'
        || e.isTeamManager===true;
      if(!isMgr) return;
      const ph = norm(e.phone||e.mobile||'');
      if(ph.length===10) shouldBeMgr.add(ph);
    });

    const liveNames = [];

    // Promote / ensure mobileUsers for real managers
    for(const ph of shouldBeMgr){
      const roster = rosterByMgr[ph] || [];
      const self = activeEmps.find(e=>norm(e.phone||e.mobile||'')===ph);
      const name = (self && self.name) || (muAll[ph] && muAll[ph].name) || ph;
      liveNames.push(name+(roster.length?` (${roster.length})`:''));
      const existing = muAll[ph] || {};
      tasks.push(fbUpdate('mobileUsers/'+ph, {
        role: 'manager',
        status: 'approved',
        name: name,
        mobile: ph,
        phone: ph,
        empId: (self && self.empId) || existing.empId || '',
        empObjId: (self && self.id) || existing.empObjId || '',
        company: (self && (self.company||self.companyName)) || existing.company || '',
        companyId: (self && self.companyId) || existing.companyId || '',
        repairedAt: new Date().toISOString()
      }).catch(()=>fbSet('mobileUsers/'+ph, {
        role:'manager', status:'approved', name, mobile:ph, phone:ph
      })));
      if(self && self.id){
        tasks.push(fbUpdate('employees/'+self.id, {
          role: 'manager',
          accessLevel: 'manager',
          isTeamManager: true,
          managerId: ph,
          status: 'active',
          updatedAt: new Date().toISOString()
        }).catch(()=>{}));
      }
    }

    // v6.0.11: demote mobileUsers who are employees under ANOTHER manager (joined as member)
    activeEmps.forEach(e=>{
      const ph = norm(e.phone||e.mobile||'');
      if(ph.length!==10) return;
      const mid = norm(e.managerId||'');
      const al = String(e.accessLevel||e.role||'').toLowerCase();
      const isWorkerish = (al==='worker'||al==='member');
      if(isWorkerish && mid && mid.length===10 && mid!==ph){
        // Must not appear as independent manager
        tasks.push(fbUpdate('mobileUsers/'+ph, {
          role: 'member',
          status: 'approved',
          managerId: mid,
          wasManager: true,
          demotedReason: 'joined_other_team',
          demotedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch(()=>{}));
        // paymentStatus: keep validity but role member
        tasks.push(fbUpdate('paymentStatus/'+ph, {
          role: 'member',
          managerId: mid,
          wasManager: true,
          updatedAt: new Date().toISOString()
        }).catch(()=>{}));
        // employee already worker — ensure flags
        if(e.id){
          tasks.push(fbUpdate('employees/'+e.id, {
            role: 'member',
            accessLevel: 'worker',
            isTeamManager: false,
            managerId: mid,
            updatedAt: new Date().toISOString()
          }).catch(()=>{}));
        }
      }
    });

    // Demote mobileUsers who are "manager" but own ZERO roster and are not shouldBeMgr
    Object.entries(muAll).forEach(([k,u])=>{
      if(!u) return;
      const uk = norm(u.mobile||u.phone||k);
      if(!uk) return;
      const role = String(u.role||'').toLowerCase();
      const st = String(u.status||'').toLowerCase();
      if(role!=='manager' && st!=='left_team' && st!=='removed') return;
      if(shouldBeMgr.has(uk)) return;
      // Stale manager (e.g. Vivek after handoff) — remove manager login
      const rosterN = (rosterByMgr[uk]||[]).length;
      if(role==='manager' && rosterN===0){
        // Prefer demote-to-member if still an active employee under someone
        const stillEmp = activeEmps.find(e=>norm(e.phone||e.mobile||'')===uk);
        if(stillEmp && norm(stillEmp.managerId||'') && norm(stillEmp.managerId||'')!==uk){
          tasks.push(fbUpdate('mobileUsers/'+uk, {
            role:'member', status:'approved', managerId:norm(stillEmp.managerId),
            wasManager:true, demotedReason:'joined_other_team', demotedAt:new Date().toISOString()
          }).catch(()=>{}));
          return;
        }
        tasks.push(fbRemove('mobileUsers/'+uk).catch(()=>
          fbSet('mobileUsers/'+uk, {
            status: 'removed',
            role: 'removed',
            forceFreshLogin: true,
            clearedAt: new Date().toISOString(),
            demotedReason: 'repair_no_roster'
          })
        ));
      }
    });

    await Promise.all(tasks.map(p=>Promise.resolve(p).catch(err=>console.warn(err))));
    try{ _cache.mobileUsers = await fbGet('mobileUsers'); }catch(e){}
    try{ if(typeof renderAdminTeamHierarchy==='function') renderAdminTeamHierarchy(); }catch(e){}
    toast(L('✅ रोस्टर से प्रबंधक: ','✅ Managers from roster: ')+(liveNames.join(', ')||L('कोई नहीं','none')));
  }catch(err){
    console.error(err);
    toast(L('❌ सुधार विफल: ','❌ Repair failed: ')+(err.message||err.code||L('त्रुटि','error')));
  }
}

/**
 * Admin: remove names not under any live manager roster.
 * - Active employees with empty/unknown managerId (and not themselves a manager) → left_team
 * - mobileUsers members whose managerId is not a live manager → removed (fresh login next time)
 * Keeps shift history on employee row (status left_team).
 */
async function adminRemoveOrphanMembers(){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const ok = confirm(
    (typeof L==='function'
      ? L('जो नाम किसी भी live Manager की roster में नहीं हैं — उन्हें app से हटाएँ?\n\n• Schedule / Team से गायब हो जाएँगे\n• Shift history सुरक्षित (left_team)\n• Login हटेगा अगर mobileUsers orphan है','Remove names that are NOT under any live Manager roster?\n\n• They disappear from Schedule / Team\n• Shift history kept (left_team)\n• Orphan logins cleared')
      : 'Remove names not under any live Manager?')
  );
  if(!ok) return;

  try{
    toast(L('⏳ अनाथ रिकॉर्ड खोज…','⏳ Finding orphans…'));
    const norm = (p)=> (typeof _normMobileKey==='function' ? _normMobileKey(p) : String(p||'').replace(/\D/g,'').slice(-10));
    const LEFT = new Set(['left','left_team','resigned','removed','revoked']);
    const muAll = await fbGet('mobileUsers').catch(()=>null) || {};
    let emps = _cache.employees || [];
    if(!emps.length){
      try{
        const raw = await fbGet('employees');
        if(raw && typeof raw==='object'){
          emps = Object.entries(raw).map(([id,v])=>({...(v||{}), id:(v&&v.id)||id}));
          _cache.employees = emps;
        }
      }catch(e){}
    }

    // Live managers = mobileUsers role manager (not left/removed) + employee rows flagged manager
    const liveMgr = new Set();
    Object.entries(muAll).forEach(([k,u])=>{
      if(!u) return;
      const st = String(u.status||'').toLowerCase();
      const role = String(u.role||'').toLowerCase();
      if(LEFT.has(st) || st==='rejected' || st==='demoted') return;
      if(role==='manager' || role==='admin'){
        const ph = norm(u.mobile||u.phone||k);
        if(ph.length===10) liveMgr.add(ph);
      }
    });
    const liveMgrIds = new Set(); // emp object ids of live managers
    emps.forEach(e=>{
      if(!e) return;
      const st = String(e.status||'active').toLowerCase();
      if(LEFT.has(st)) return;
      const isMgr = String(e.role||'').toLowerCase()==='manager'
        || String(e.accessLevel||'').toLowerCase()==='manager'
        || e.isTeamManager===true;
      if(!isMgr) return;
      const ph = norm(e.phone||e.mobile||'');
      if(ph.length===10) liveMgr.add(ph);
      if(e.id) liveMgrIds.add(String(e.id));
      if(e.empId) liveMgrIds.add(String(e.empId));
    });
    // mobileUsers managers may point empObjId
    Object.entries(muAll).forEach(([k,u])=>{
      if(!u) return;
      if(String(u.role||'').toLowerCase()!=='manager') return;
      if(u.empObjId) liveMgrIds.add(String(u.empObjId));
      if(u.employeeId) liveMgrIds.add(String(u.employeeId));
    });

    const tasks = [];
    const orphanNames = [];
    const now = new Date().toISOString();

    // 1) Employees not under any live manager (and not themselves a manager)
    emps.forEach(e=>{
      if(!e || !e.id) return;
      const st = String(e.status||'active').toLowerCase();
      if(LEFT.has(st)) return;
      const isMgr = String(e.role||'').toLowerCase()==='manager'
        || String(e.accessLevel||'').toLowerCase()==='manager'
        || e.isTeamManager===true;
      if(isMgr) return; // keep managers
      const midRaw = String(e.managerId||'').trim();
      const mid = norm(midRaw);
      if(mid.length===10 && liveMgr.has(mid)) return; // under live manager (phone)
      if(midRaw && liveMgrIds.has(midRaw)) return; // under live manager (emp id)
      // Orphan: no managerId or manager not live
      orphanNames.push(e.name || e.empId || e.id);
      const leftPayload = {
        status: 'left_team',
        leftAt: now,
        leftReason: 'orphan_no_manager',
        active: false,
        updatedAt: now
      };
      tasks.push(fbUpdate('employees/'+e.id, leftPayload).catch(()=>{}));
      try{ Object.assign(e, leftPayload); }catch(ex){}
      tasks.push(fbSet('leftEmployees/'+e.id, {
        ...e,
        ...leftPayload,
        id: e.id,
        name: e.name || '',
        phone: e.phone || e.mobile || '',
        archivedAt: Date.now(),
        removedBy: (SESSION && (SESSION.name||SESSION.mobile)) || 'admin'
      }).catch(()=>{}));
      const ph = norm(e.phone||e.mobile||'');
      if(ph.length===10 && !liveMgr.has(ph)){
        tasks.push(fbRemove('mobileUsers/'+ph).catch(()=>
          fbSet('mobileUsers/'+ph, {
            status: 'removed',
            role: 'removed',
            forceFreshLogin: true,
            clearedAt: now,
            demotedReason: 'orphan_no_manager'
          })
        ));
      }
    });

    // 2) mobileUsers members (not manager/admin) whose managerId is missing or not live
    Object.entries(muAll).forEach(([k,u])=>{
      if(!u) return;
      const role = String(u.role||'').toLowerCase();
      const st = String(u.status||'').toLowerCase();
      if(role==='manager' || role==='admin') return;
      if(LEFT.has(st) || st==='rejected' || st==='removed') return;
      const uk = norm(u.mobile||u.phone||k);
      if(!uk || liveMgr.has(uk)) return;
      const mid = norm(u.managerId||u.managerMobile||'');
      if(mid.length===10 && liveMgr.has(mid)) return;
      // Orphan mobile registration
      if(!orphanNames.includes(u.name||uk)) orphanNames.push(u.name||uk);
      tasks.push(fbRemove('mobileUsers/'+uk).catch(()=>
        fbSet('mobileUsers/'+uk, {
          status: 'removed',
          role: 'removed',
          forceFreshLogin: true,
          clearedAt: now,
          demotedReason: 'orphan_no_manager'
        })
      ));
    });

    if(!tasks.length){
      toast(typeof L==='function'?L('✅ कोई orphan नहीं मिला','✅ No orphans found'):'✅ No orphans found');
      return;
    }

    await Promise.all(tasks.map(p=>Promise.resolve(p).catch(err=>console.warn(err))));
    try{ _cache.mobileUsers = await fbGet('mobileUsers'); }catch(e){}
    try{
      // keep local cache consistent
      if(_cache.employees){
        _cache.employees = _cache.employees.map(e=>{
          if(!e) return e;
          const st = String(e.status||'').toLowerCase();
          return e;
        });
      }
    }catch(e){}
    try{ if(typeof renderAdminTeamHierarchy==='function') renderAdminTeamHierarchy(); }catch(e){}
    try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
    try{ if(typeof renderSchedule==='function') renderSchedule(); }catch(e){}
    const n = orphanNames.length;
    const sample = orphanNames.slice(0,8).join(', ') + (n>8?'…':'');
    toast(L('✅ ','✅ ')+n+L(' अनाथ नाम हटाए',' orphan name(s) removed')+(sample?': '+sample:''));
  }catch(err){
    console.error(err);
    toast(L('❌ अनाथ सफाई विफल: ','❌ Orphan cleanup failed: ')+(err.message||err.code||L('त्रुटि','error')));
  }
}


/** Admin: fully delete one mobile login profile (keeps shift history; marks left_team on roster) */
async function adminDeleteMobileProfile(phone, name){
  if(typeof isAdmin!=='function' || !isAdmin()){ toast(L('❌ केवल व्यवस्थापक','❌ Admin only')); return; }
  const key = (typeof _normMobileKey==='function'?_normMobileKey(phone):String(phone||'').replace(/\D/g,'').slice(-10));
  if(!key || key.length!==10){ toast(L('⚠️ अमान्य मोबाइल','⚠️ Invalid mobile')); return; }
  const label = name || key;
  const ok = confirm('Delete profile for '+label+' ('+key+')?\n\n• Removes app login (mobileUsers)\n• Clears device approval\n• Marks team member left_team (shifts kept for schedule history)\n\nThis cannot be undone easily.');
  if(!ok) return;
  try{
    toast(L('⏳ प्रोफ़ाइल हट रही है…','⏳ Deleting profile…'));
    const tasks = [];
    // Remove login
    tasks.push(fbRemove('mobileUsers/'+key).catch(()=>
      fbSet('mobileUsers/'+key, {
        status:'removed', role:'removed', forceFreshLogin:true,
        deletedAt:new Date().toISOString(), deletedBy:(SESSION&&SESSION.name)||'admin'
      })
    ));
    // Device approvals by phone key and by empObjId
    tasks.push(fbRemove('deviceApprovals/'+key).catch(()=>{}));
    const emps = (_cache.employees||[]);
    const emp = emps.find(e=>_normMobileKey(e.phone||e.mobile||'')===key);
    if(emp && emp.id){
      tasks.push(fbRemove('deviceApprovals/'+emp.id).catch(()=>{}));
      // Mark left_team — keep row for schedule history
      tasks.push(fbUpdate('employees/'+emp.id, {
        status: 'left_team',
        active: false,
        leftAt: new Date().toISOString(),
        leftReason: 'profile_deleted',
        role: 'member',
        accessLevel: 'worker',
        updatedAt: new Date().toISOString(),
        deletedProfileAt: new Date().toISOString()
      }));
      tasks.push(fbSet('leftEmployees/'+emp.id, {
        ...emp,
        status: 'left_team',
        leftAt: new Date().toISOString(),
        leftReason: 'profile_deleted',
        archivedAt: Date.now(),
        removedBy: (SESSION&&SESSION.name)||'admin'
      }).catch(()=>{}));
    }
    await Promise.all(tasks.map(p=>Promise.resolve(p).catch(e=>console.warn(e))));
    try{ _cache.mobileUsers = await fbGet('mobileUsers'); }catch(e){}
    try{ if(typeof renderAdminTeamHierarchy==='function') renderAdminTeamHierarchy(); }catch(e){}
    try{ if(typeof renderTeam==='function') renderTeam(); }catch(e){}
    toast(L('✅ प्रोफ़ाइल हटाई: ','✅ Profile deleted: ')+label);
  }catch(err){
    console.error(err);
    toast(L('❌ ','❌ ')+(err.message||err.code||L('विफल','failed')));
  }
}


/* Team Size admin v3.1.4 */
async function openAdminTeamSizeModal(mgrKey, mgrName){
  let cur = 25;
  try{
    let m=null;
    for (const p of ['mobileUsers/'+mgrKey,'managers/'+mgrKey,'users/'+mgrKey]){
      try{ const r=await fbGet(p); if(r&&typeof r==='object'&&(r.teamSize!=null||r.maxMembers!=null)){ m=r; break; } }catch(e){}
    }
    if(m) cur = parseInt(m.teamSize!=null?m.teamSize:m.maxMembers,10)||25;
  }catch(e){}
  const opts = [1,25,50,200];
  const chips = opts.map(n=>`<button type="button" onclick="document.getElementById('admTeamSizeVal').value='${n}'"
    style="padding:10px 14px;border-radius:10px;border:1.5px solid ${n===cur?'#4f46e5':'var(--border2)'};background:${n===cur?'rgba(79,70,229,.12)':'var(--card)'};font-weight:800;cursor:pointer">${n}</button>`).join('');
  openModal(`<div class="modal-handle"></div>
    <div class="modal-title">👥 Team Size — ${String(mgrName||'').replace(/</g,'')}</div>
    <div style="font-size:13px;color:var(--muted2);margin-bottom:12px">Max members this manager can add to roster / shift schedule.</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">${chips}
      <button type="button" style="padding:10px 14px;border-radius:10px;border:1.5px solid var(--border2);background:var(--card);font-weight:800;cursor:pointer">Other</button>
    </div>
    <div class="field"><label>Team size (number)</label>
      <input id="admTeamSizeVal" class="inp-field" type="number" min="1" max="5000" value="${cur}">
    </div>
    <button class="big-btn" onclick="saveAdminTeamSize('${String(mgrKey).replace(/'/g,"\\'")}')">💾 Save Team Size</button>
    <button class="cancel-btn" style="width:100%;margin-top:8px" onclick="closeModal()">Cancel</button>`);
}
async function saveAdminTeamSize(mgrKey){
  const n = parseInt((document.getElementById('admTeamSizeVal')||{}).value, 10);
  if(!n || n < 1){ toast(L('❌ वैध आकार दर्ज करें','❌ Enter a valid size')); return; }
  try{
    mgrKey=String(mgrKey||'').replace(/\D/g,'').slice(-10)||String(mgrKey||'');
    const STANDARD = {1:1,30:1,60:1,200:1};
    const isCustom = !STANDARD[n];
    const payload = {
      teamSize: n,
      maxMembers: n,
      planMaxMembers: n,
      teamSizeUpdatedAt: new Date().toISOString(),
      planLabel: (n===1?'Individual (1 member)':('Up to '+n+' members'))
    };
    // Keep plan label in sync when admin sets a custom roster cap
    try {
      let period = 'monthly';
      let existing = null;
      try { existing = await fbGet('mobileUsers/'+mgrKey); } catch(e0){}
      if (existing && existing.planPeriod) period = existing.planPeriod;
      else if (existing && existing.paymentAmount && typeof _planLabelFromAmount === 'function') {
        const meta = _planLabelFromAmount(existing.paymentAmount, window._paymentSettingsCache||{});
        if (meta && meta.period) period = meta.period;
      }
      const periodLabel = period === 'annual' ? 'Annual' : 'Monthly';
      const sizeBit = n === 1 ? '1 Member' : (n + ' Members');
      payload.planPeriod = period;
      payload.planLabel = isCustom
        ? (periodLabel + ' · Custom plan · ' + sizeBit)
        : (periodLabel + ' · ' + sizeBit);
    } catch (eLab) {}
    for (const p of ['mobileUsers/'+mgrKey,'managers/'+mgrKey,'users/'+mgrKey]){
      try{
        const ex=await fbGet(p);
        if(ex&&typeof ex==='object') await fbUpdate(p,payload);
        else if(typeof fbSet==='function') await fbSet(p,Object.assign({mobile:mgrKey},payload));
        else await fbUpdate(p,Object.assign({mobile:mgrKey},payload));
      }catch(e){console.warn(e);}
    }
    // paymentStatus path so hierarchy merge + badge see it
    try {
      if (typeof fbSet === 'function') {
        const prev = await fbGet('paymentStatus/'+mgrKey).catch(function(){return null;}) || {};
        await fbSet('paymentStatus/'+mgrKey, Object.assign({}, prev, {
          mobile: mgrKey,
          teamSize: n,
          maxMembers: n,
          planMaxMembers: n,
          planLabel: payload.planLabel || prev.planLabel,
          planPeriod: payload.planPeriod || prev.planPeriod
        }));
      }
    } catch (ePay) {}
    try {
      if (typeof _cache !== 'undefined' && _cache.mobileUsers && _cache.mobileUsers[mgrKey]) {
        Object.assign(_cache.mobileUsers[mgrKey], payload);
      }
    } catch (eC) {}
    toast(L('✅ टीम आकार ','✅ Team size set to ')+n+L(' · ',' for ')+mgrKey);
    closeModal();
    try { if (typeof renderAdminTeamHierarchy === 'function') renderAdminTeamHierarchy(); } catch (eR) {}
  }catch(e){ toast(L('❌ ','❌ ')+(e.message||e)); }
}
window.openAdminTeamSizeModal = openAdminTeamSizeModal;
window.saveAdminTeamSize = saveAdminTeamSize;

/* v3.1.6 force G legend label+times from manager shift config */
(function(){
  function gCfg(){
    try{
      var cfg = (typeof getShiftConfigSync==='function' && getShiftConfigSync()) || {};
      var shifts = cfg.shifts || cfg.shiftList || [];
      var g = null;
      for(var i=0;i<shifts.length;i++){
        var s = shifts[i];
        if(s && String(s.code||s.id||'').toUpperCase()==='G'){ g=s; break; }
      }
      var lab = (g && (g.label||g.name||g.title)) || 'General Shift';
      lab = String(lab).trim();
      if(!lab || lab==='G' || /^general$/i.test(lab)) lab = 'General Shift';
      var st = (g && (g.start||g.startTime||g.from)) || '08:00';
      var en = (g && (g.end||g.endTime||g.to)) || '20:00';
      return {lab:lab, st:String(st).slice(0,5), en:String(en).slice(0,5)};
    }catch(e){ return {lab:'General Shift', st:'08:00', en:'20:00'}; }
  }
  function apply(){
    try{
      var c = gCfg();
      var want = c.lab + ' ' + c.st + '-' + c.en;
      // Legend chips at bottom of schedule
      document.querySelectorAll('[data-shift="G"], .leg-G, .legend-G, .ms-btn[data-shift="G"]').forEach(function(el){
        // don't overwrite button letter-only chips that should stay "G"
      });
      // Text nodes next to G color chip in legend row
      var legends = document.querySelectorAll('.sched-legend, .legend-row, #schedLegend, [class*="legend"]');
      legends.forEach(function(row){
        var txt = row.textContent || '';
        if(/\bG\b/.test(txt) && /General/.test(txt) && txt.indexOf(c.st) < 0){
          // replace trailing General without times
          row.innerHTML = row.innerHTML.replace(/>\s*General\s*</g, '>'+c.lab+' '+c.st+'-'+c.en+'<');
          row.innerHTML = row.innerHTML.replace(/(G<\/[^>]+>)\s*General\b/g, '$1 '+c.lab+' '+c.st+'-'+c.en);
        }
      });
      // Bottom legend line like: "L Leave  G General"
      document.querySelectorAll('span, div, label, p').forEach(function(el){
        if(el.children && el.children.length > 2) return;
        var t = (el.textContent||'').trim();
        if(t === 'General' || t === 'G General' || t === 'General '){
          el.textContent = c.lab + ' ' + c.st + '-' + c.en;
        }
      });
    }catch(e){}
  }
  window.mpForceGLegend316 = apply;
  setInterval(apply, 2000);
  document.addEventListener('click', function(){ setTimeout(apply, 200); });
  if(document.readyState==='complete') setTimeout(apply, 500);
  else window.addEventListener('load', function(){ setTimeout(apply, 500); });
})();


/* ── Minimum Manpower Calculator (Schedule toolbar) ── */
/* ── Minimum Manpower Calculator — guided wizard ──
 * Steps: Plant shifts/offs/running days → Machines (process) → Designation
 *        → Department review → Engineering team → Summary
 * Process team = machine operators + shared designations + dept adjustments
 * Engineering team = separate support/maintenance headcount
 */
var _mpCalcState = null;

function _mpT(hi, en){ if(typeof L==='function') return L(hi, en); try{ var lang=(typeof _lang!=='undefined'&&_lang)?String(_lang).toLowerCase():''; if(lang==='hi'||lang==='hindi') return hi; }catch(e){} return (en!=null&&en!=='')?en:hi; }

function _mpCalcDefaults(){
  var defShifts = 2;
  try{
    var cfg = (typeof getShiftConfigSync==='function') ? getShiftConfigSync() : {};
    var skip = {O:1,L:1,'C/O':1,CO:1,HLF:1,AB:1,H:1,OD:1};
    var active = (cfg.shifts||[]).filter(function(s){
      if(!s || s.active===false) return false;
      var c = String(s.code||'').toUpperCase();
      return c && !skip[c];
    });
    if(active.length >= 1) defShifts = active.length;
  }catch(e){}
  var machines = [], designations = [], departments = [], responsibilities = [];
  try{
    if(typeof _teamFieldValues==='function'){
      machines = _teamFieldValues('machine') || [];
      designations = _teamFieldValues('designation') || [];
      departments = _teamFieldValues('section') || [];
      responsibilities = _teamFieldValues('responsibility') || [];
    }
  }catch(e){}
  var currentTeam = 0;
  try{
    currentTeam = (typeof getEmps==='function'?getEmps():[]).filter(function(e){
      return e && e.status!=='resigned' && e.status!=='left' && e.status!=='left_team';
    }).length;
  }catch(e){}
  return {
    step: 0,
    shifts: defShifts,
    weeklyOffs: 1,
    runningDays: 7,
    bufferPct: 10,
    machines: machines.map(function(m){ return { name: m, count: 1, perShift: 1 }; }),
    designations: designations.map(function(d){ return { name: d, count: 0 }; }),
    departments: departments.map(function(d){ return { name: d, extra: 0 }; }),
    responsibilities: responsibilities,
    engBase: 0,
    engPerMachine: 0,
    currentTeam: currentTeam
  };
}

