/* Man Power — Profile / leave quota / holidays / analytics (split v5.1.0) */
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
    <div class="field"><label>${L('विभाग','Department')}</label>
      <input class="inp-field" id="profileSecInput" value="${escHtml(esc(emp.sec||''))}" maxlength="40" placeholder="from Excel Department"></div>
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
  window._mpLastDeviceRows = deviceRows;
  window._mpDownloadDeviceExcel = function(){
    var rows = window._mpLastDeviceRows || [];
    if(!rows.length){ toast('No device rows'); return; }
    function csvEsc(v){ v=String(v==null?'':v).replace(/"/g,'""'); return '"'+v+'"'; }
    var header = ['Date','Name','Mobile','Company','Role','Device','EmpCode','Valid'];
    var lines = [header.join(',')];
    rows.forEach(function(r){
      var when = r.lastAt || '';
      try{ if(when) when = new Date(when).toISOString(); }catch(e){}
      lines.push([csvEsc(when),csvEsc(r.name),csvEsc(r.mobile),csvEsc(r.company),csvEsc(r.role),csvEsc(r.deviceName),csvEsc(r.empCode),csvEsc(r.valid?'yes':'no')].join(','));
    });
    var blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='manpower_logged_in_devices_'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();
    toast('✅ Excel/CSV downloaded');
  };

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

    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 8px;flex-wrap:wrap">
      <div style="font-size:13px;font-weight:900;color:var(--text)">📱 Logged-in devices (${deviceRows.length})</div>
      <button type="button" onclick="window._mpDownloadDeviceExcel&&window._mpDownloadDeviceExcel()"
        style="padding:8px 12px;border-radius:10px;border:1px solid var(--border2);background:var(--panel);font-size:12px;font-weight:800;cursor:pointer;color:var(--text)">⬇ Excel</button>
    </div>
    <div style="font-size:11px;color:var(--muted2);margin-bottom:10px">Date · Name · Mobile · Company · Role · Device · Last activity</div>
    <div style="max-height:55vh;min-height:180px;overflow:auto;margin-bottom:12px;border:1px solid var(--border2);border-radius:12px;background:var(--card)">
      <table style="width:100%;border-collapse:collapse;min-width:640px;font-size:12px">
        <thead><tr style="background:var(--panel);position:sticky;top:0;z-index:1">
          <th style="text-align:left;padding:10px 8px;border-bottom:1px solid var(--border2)">Date</th>
          <th style="text-align:left;padding:10px 8px;border-bottom:1px solid var(--border2)">Name</th>
          <th style="text-align:left;padding:10px 8px;border-bottom:1px solid var(--border2)">Mobile</th>
          <th style="text-align:left;padding:10px 8px;border-bottom:1px solid var(--border2)">Company</th>
          <th style="text-align:left;padding:10px 8px;border-bottom:1px solid var(--border2)">Role</th>
          <th style="text-align:left;padding:10px 8px;border-bottom:1px solid var(--border2)">Device</th>
        </tr></thead>
        <tbody>${deviceRows.length ? deviceRows.map(r=>`<tr>
          <td style="padding:10px 8px;border-bottom:1px solid var(--border2);white-space:nowrap">${fmtWhen(r.lastAt)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid var(--border2);font-weight:700">${escHtml(r.name||'—')}</td>
          <td style="padding:10px 8px;border-bottom:1px solid var(--border2);font-family:monospace">${r.mobile||'—'}</td>
          <td style="padding:10px 8px;border-bottom:1px solid var(--border2)">${escHtml(r.company||'—')}</td>
          <td style="padding:10px 8px;border-bottom:1px solid var(--border2)">${escHtml(String(r.role||'—'))}</td>
          <td style="padding:10px 8px;border-bottom:1px solid var(--border2)">${escHtml(r.deviceName||'—')}</td>
        </tr>`).join('') : '<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--muted2)">No devices yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <div style="font-size:11px;color:var(--muted2);line-height:1.5;margin-bottom:12px">
      Live counts from Firebase RTDB. Measurement ID <b>G-DK6JFY33ED</b>.
    </div>
    <a href="https://console.firebase.google.com/project/met-power/analytics" target="_blank" rel="noopener"
      style="display:block;text-align:center;padding:14px;border-radius:12px;background:linear-gradient(135deg,#f97316,#a855f7);color:#fff;font-weight:800;text-decoration:none;margin-bottom:10px">
      📈 Open Google Analytics (Firebase Console)
    </a>
    <button class="cancel-btn" onclick="closeModal()">Close</button>`);
}



