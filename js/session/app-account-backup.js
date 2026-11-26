/**
 * Man Power v5.0 — Account delete backup (6-month retention)
 * Stores roster + schedules snapshot under accountBackups/{mobile}/{backupId}
 * Admin can search by mobile, verify OTP to that number, download Excel by date.
 */
(function(global){
  'use strict';
  var RETENTION_MS = 183 * 24 * 60 * 60 * 1000; // ~6 months

  function _norm(m){
    if(typeof _normMobileKey==='function') return _normMobileKey(m||'');
    return String(m||'').replace(/\D/g,'').slice(-10);
  }
  function _L(hi,en){
    try{ if(typeof L==='function') return L(hi,en); }catch(e){}
    return (typeof _lang!=='undefined' && _lang && _lang!=='hi') ? (en||hi) : (hi||en);
  }

  /** Build snapshot of team + schedules for a manager mobile / emp list */
  async function buildAccountBackupPayload(opts){
    opts = opts || {};
    var mob = _norm(opts.mobile || (SESSION && (SESSION.mobile||SESSION.uid)) || '');
    var empList = opts.employees || [];
    if(!empList.length){
      try{
        var all = (window._cache && Array.isArray(_cache.employees)) ? _cache.employees.slice() : ((typeof getEmps==='function'?getEmps():[])||[]);
        empList = all.filter(function(e){
          if(!e) return false;
          if(opts.empIds && opts.empIds.length){
            return opts.empIds.indexOf(e.id)>=0 || opts.empIds.indexOf(e.empId)>=0;
          }
          var mid = _norm(e.managerId||e.managerMobile||'');
          var ph = _norm(e.phone||e.mobile||'');
          if(mob && (mid===mob || ph===mob)) return true;
          if(opts.includeAllRoster) return true;
          return false;
        });
      }catch(e){}
    }
    // Profile rows
    var members = empList.map(function(e){
      return {
        id: e.id || '',
        name: e.name || '',
        empId: e.empId || e.code || '',
        mobile: e.phone || e.mobile || '',
        phone: e.phone || e.mobile || '',
        department: e.sec || e.section || e.department || '',
        section: e.sec || e.section || '',
        machine: e.machine || e.mc || '',
        designation: e.designation || '',
        responsibility: e.responsibility || e.resp || '',
        resp: e.resp || e.responsibility || '',
        woff: e.woff || e.weeklyOff || '',
        weeklyOff: e.woff || e.weeklyOff || '',
        joiningDate: e.joiningDate || e.doj || '',
        dob: e.dob || e.dateOfBirth || '',
        salary: e.monthlySalary || e.salary || '',
        status: e.status || 'active',
        managerId: e.managerId || mob || ''
      };
    });
    // Schedules: last 4 months + current keys from cache
    var schedules = {};
    try{
      var schedCache = (window._cache && _cache.schedules) || (typeof getSchedules==='function' ? getSchedules() : {}) || {};
      var now = new Date();
      var keys = {};
      for(var i=-1;i<=3;i++){
        var d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        var k = d.getFullYear()+'_'+String(d.getMonth()+1).padStart(2,'0');
        keys[k]=1;
      }
      Object.keys(schedCache).forEach(function(k){ keys[k]=1; });
      var idSet = {};
      members.forEach(function(m){ if(m.id) idSet[m.id]=1; if(m.empId) idSet[String(m.empId)]=1; });
      Object.keys(keys).forEach(function(mk){
        var monthData = schedCache[mk];
        if(!monthData || typeof monthData!=='object') return;
        var slice = {};
        Object.keys(monthData).forEach(function(eid){
          if(idSet[eid] || idSet[String(eid).trim().toUpperCase()]){
            slice[eid] = monthData[eid];
          }
        });
        if(Object.keys(slice).length) schedules[mk] = slice;
      });
      // Try live fetch for missing current month
      if(typeof fbGet==='function'){
        var curKey = now.getFullYear()+'_'+String(now.getMonth()+1).padStart(2,'0');
        if(!schedules[curKey]){
          try{
            var live = await fbGet('schedules/'+curKey);
            if(live && typeof live==='object'){
              var slice2 = {};
              Object.keys(live).forEach(function(eid){
                if(idSet[eid] || idSet[String(eid).trim().toUpperCase()]) slice2[eid]=live[eid];
              });
              if(Object.keys(slice2).length) schedules[curKey]=slice2;
            }
          }catch(e){}
        }
      }
    }catch(e){}
    return {
      version: 1,
      mobile: mob,
      deletedAt: new Date().toISOString(),
      deletedBy: opts.deletedBy || (SESSION && (SESSION.name||SESSION.role)) || 'self',
      reason: opts.reason || 'account_delete',
      company: opts.company || (SESSION && (SESSION.company||SESSION.companyId)) || '',
      managerName: opts.managerName || (SESSION && SESSION.name) || '',
      memberCount: members.length,
      members: members,
      schedules: schedules
    };
  }

  async function saveAccountBackup(payload){
    if(!payload || !payload.mobile) return null;
    var mob = _norm(payload.mobile);
    if(!mob || mob.length!==10) return null;
    var id = 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    var owner = typeof isAdmin === 'function' && isAdmin() ? mob : window._fbAuth?.currentUser?.uid;
    if (!owner) return null;
    var path = 'accountBackups/'+owner+'/'+id;
    var rec = Object.assign({}, payload, {
      backupId: id,
      expiresAt: new Date(Date.now()+RETENTION_MS).toISOString(),
      createdAt: new Date().toISOString()
    });
    try{
      if(typeof fbSet==='function') await fbSet(path, rec);
      else if(typeof fbUpdate==='function') await fbUpdate(path, rec);
      else return null;
    }catch(e){
      console.warn('[accountBackup] save failed', e);
      return null;
    }
    // index for admin search
    try{
      if(typeof fbUpdate==='function'){
        await fbUpdate('accountBackupIndex/'+owner, {
          lastBackupId: id,
          lastDeletedAt: rec.deletedAt,
          managerName: rec.managerName||'',
          company: rec.company||'',
          memberCount: rec.memberCount||0,
          expiresAt: rec.expiresAt
        });
      }
    }catch(e){}
    return id;
  }

  async function purgeExpiredBackupsForMobile(mob){
    mob = _norm(mob);
    if(!mob || typeof fbGet!=='function') return 0;
    var removed = 0;
    try{
      var all = await fbGet('accountBackups/'+mob);
      if(!all || typeof all!=='object') return 0;
      var now = Date.now();
      var keys = Object.keys(all);
      for(var i=0;i<keys.length;i++){
        var b = all[keys[i]];
        if(!b) continue;
        var exp = b.expiresAt ? Date.parse(b.expiresAt) : (b.deletedAt ? Date.parse(b.deletedAt)+RETENTION_MS : 0);
        if(exp && exp < now){
          try{
            if(typeof fbRemove==='function') await fbRemove('accountBackups/'+mob+'/'+keys[i]);
            else if(typeof fbSet==='function') await fbSet('accountBackups/'+mob+'/'+keys[i], null);
            removed++;
          }catch(e){}
        }
      }
    }catch(e){}
    return removed;
  }

  function backupToSheetRows(payload){
    var members = (payload && payload.members) || [];
    var schedules = (payload && payload.schedules) || {};
    // Collect sorted date columns from schedules
    var dateCols = [];
    Object.keys(schedules).sort().forEach(function(mk){
      var parts = String(mk).split('_');
      if(parts.length<2) return;
      var y = parseInt(parts[0],10), m = parseInt(parts[1],10);
      if(!y||!m) return;
      var dim = new Date(y,m,0).getDate();
      var monthData = schedules[mk]||{};
      // find max length
      var maxD = dim;
      Object.keys(monthData).forEach(function(eid){
        var arr = monthData[eid];
        if(Array.isArray(arr) && arr.length > maxD) maxD = arr.length;
      });
      for(var d=1; d<=Math.min(dim, maxD||dim); d++){
        dateCols.push({
          key: mk+'|'+d,
          label: y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),
          mk: mk,
          dayIdx: d-1
        });
      }
    });
    var headers = ['Name','Emp ID','Weekly Off','Mobile','Department','Machine','Designation','Responsibility','Salary(₹/Month)','Joining Date','Date of Birth','Status'];
    dateCols.forEach(function(c){ headers.push(c.label); });
    var rows = [headers];
    members.forEach(function(mem){
      var row = [
        mem.name||'',
        mem.empId||'',
        mem.woff||mem.weeklyOff||'',
        mem.mobile||mem.phone||'',
        mem.department||mem.section||'',
        mem.machine||'',
        mem.designation||'',
        mem.responsibility||mem.resp||'',
        mem.salary||'',
        mem.joiningDate||'',
        mem.dob||'',
        mem.status||''
      ];
      dateCols.forEach(function(c){
        var monthData = schedules[c.mk]||{};
        var arr = monthData[mem.id] || monthData[mem.empId] || monthData[String(mem.empId||'').trim()] || [];
        var val = Array.isArray(arr) ? (arr[c.dayIdx]||'') : '';
        row.push(val);
      });
      rows.push(row);
    });
    return rows;
  }

  async function downloadBackupExcel(payload, filename){
    if(typeof ensureXlsx==='function') await ensureXlsx();
    if(!global.XLSX) throw new Error('XLSX not loaded');
    var rows = backupToSheetRows(payload);
    var ws = XLSX.utils.aoa_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Backup');
    var meta = [
      ['Backup ID', payload.backupId||''],
      ['Mobile', payload.mobile||''],
      ['Deleted At', payload.deletedAt||''],
      ['Deleted By', payload.deletedBy||''],
      ['Company', payload.company||''],
      ['Manager', payload.managerName||''],
      ['Members', payload.memberCount||0],
      ['Expires', payload.expiresAt||'']
    ];
    var ws2 = XLSX.utils.aoa_to_sheet(meta);
    XLSX.utils.book_append_sheet(wb, ws2, 'Meta');
    var fname = filename || ('MP_Backup_'+(payload.mobile||'')+'_'+(payload.deletedAt||'').slice(0,10)+'.xlsx');
    XLSX.writeFile(wb, fname);
    return fname;
  }

  /** Hook: call before deleting employees */
  async function backupBeforeAccountDelete(opts){
    try{
      var payload = await buildAccountBackupPayload(opts||{});
      if(!payload.members || !payload.members.length){
        // still save empty marker for audit
        payload.memberCount = 0;
      }
      var id = await saveAccountBackup(payload);
      try{ if(typeof toast==='function') toast(_L('💾 Team backup save हो गया','💾 Team backup saved')+(id?(' · '+id):'')); }catch(e){}
      return id;
    }catch(e){
      console.warn('[accountBackup] before delete', e);
      return null;
    }
  }

  // ── Admin UI: search deleted backups by mobile ──
  // Admin JWT / admins/{uid} can read accountBackups without OTP (see database.rules).
  function openDeletedAccountsBackupModal(){
    if(typeof isAdmin==='function' && !isAdmin()){
      try{ toast(_L('❌ सिर्फ Admin','❌ Admin only')); }catch(e){}
      return;
    }
    var html = ''
      + '<div class="modal-title">'+_L('🗑️ Deleted Account Backups','🗑️ Deleted Account Backups')+'</div>'
      + '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.45">'
      + _L('एडमिन: मोबाइल डालकर सीधे Load करें (OTP ज़रूरी नहीं)। Backup 6 महीने तक उपलब्ध।','Admin: enter the account UID or the original backup key.')
      + '</div>'
      + '<label style="font-size:11px;font-weight:800;color:var(--muted2)">Account UID or original key</label>'
      + '<input class="inp-field" id="delBakMobile" placeholder="Account UID or legacy mobile key" maxlength="128" style="width:100%;margin:6px 0 12px;box-sizing:border-box">'
      + '<button type="button" class="submit-btn" id="delBakLoadBtn" style="margin-bottom:10px" onclick="window._delBakLoadAsAdmin && window._delBakLoadAsAdmin()">'
      + _L('📂 Backup Load करें','📂 Load Backups')+'</button>'
      + '<div id="delBakStatus" style="font-size:12px;color:var(--muted2);min-height:18px;margin-bottom:6px"></div>'
      + '<div id="delBakList" style="margin-top:8px"></div>'
      + '<button type="button" class="cancel-btn" style="margin-top:10px" onclick="closeModal()">'+_L('बंद करें','Close')+'</button>';
    if(typeof openModal==='function') openModal(html);
    else alert('openModal missing');
  }

  function backupKey(value){ return /^[A-Za-z0-9_+-]{1,128}$/.test(value || '') ? value : ''; }

  function _delBakSetStatus(msg, isErr){
    try{
      var el = document.getElementById('delBakStatus');
      if(!el) return;
      el.textContent = msg || '';
      el.style.color = isErr ? '#f43f5e' : 'var(--muted2)';
    }catch(e){}
  }

  /** Admin-only: load backups without OTP (rules allow admin read). */
  async function _delBakLoadAsAdmin(){
    var mob = backupKey(document.getElementById('delBakMobile') && document.getElementById('delBakMobile').value);
    if(!mob){
      try{ toast(_L('❌ सही मोबाइल डालें','❌ Enter a valid UID or original backup key')); }catch(e){}
      return;
    }
    if(typeof isAdmin==='function' && !isAdmin()){
      try{ toast(_L('❌ सिर्फ Admin','❌ Admin only')); }catch(e){}
      return;
    }
    _delBakSetStatus(_L('⏳ Backup लोड हो रहे हैं…','⏳ Loading backups…'), false);
    try{
      await _delBakLoadList(mob);
      _delBakSetStatus('', false);
    }catch(e){
      _delBakSetStatus((e&&e.message)?e.message:'Load failed', true);
    }
  }

  async function _delBakLoadList(mob){
    mob = backupKey(mob);
    if (!mob || typeof isAdmin !== 'function' || !isAdmin()) return;
    var box = document.getElementById('delBakList');
    if(!box) return;
    box.innerHTML = '<div style="padding:10px;color:var(--muted2)">Loading…</div>';
    try{
      var all = await fbGet('accountBackups/'+mob);
      if(!all || typeof all!=='object'){
        box.innerHTML = '<div style="padding:12px;color:var(--muted2)">'+_L('कोई backup नहीं','No backups found')+'</div>';
        return;
      }
      var list = Object.keys(all).map(function(k){ var o=all[k]||{}; o._key=k; return o; });
      list.sort(function(a,b){ return String(b.deletedAt||'').localeCompare(String(a.deletedAt||'')); });
      if(!list.length){
        box.innerHTML = '<div style="padding:12px;color:var(--muted2)">'+_L('कोई backup नहीं','No backups found')+'</div>';
        return;
      }
      box.innerHTML = list.map(function(b){
        var when = (b.deletedAt||'').replace('T',' ').slice(0,19);
        var exp = (b.expiresAt||'').slice(0,10);
        var label = when+' · '+(b.memberCount||0)+' members · '+(b.managerName||'')+' · exp '+exp;
        return '<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border2);border-radius:10px;margin-bottom:8px;flex-wrap:wrap">'
          + '<div style="flex:1;min-width:160px;font-size:12px;font-weight:700;color:var(--text)">'+label.replace(/</g,'')+'</div>'
          + '<button type="button" class="submit-btn" style="padding:8px 12px;font-size:12px" data-bak="'+(b.backupId||b._key)+'" onclick="window._delBakDownload && window._delBakDownload(\''+mob+'\',\''+(b.backupId||b._key)+'\')">'
          + _L('⬇️ Excel','⬇️ Excel')+'</button></div>';
      }).join('');
    }catch(e){
      box.innerHTML = '<div style="color:#f43f5e;padding:10px">Failed: '+(e&&e.message?e.message:e)+'</div>';
    }
  }

  async function _delBakDownload(mob, backupId){
    mob = backupKey(mob);
    if (!mob || typeof isAdmin !== 'function' || !isAdmin()) return;
    try{
      var rec = await fbGet('accountBackups/'+mob+'/'+backupId);
      if(!rec){ toast(L('नहीं मिला','Not found')); return; }
      await downloadBackupExcel(rec);
      try{ toast(_L('✅ Download शुरू','✅ Download started')); }catch(e){}
    }catch(e){
      try{ toast(L('❌ ','❌ ')+(e&&e.message?e.message:e)); }catch(x){}
    }
  }

  global.buildAccountBackupPayload = buildAccountBackupPayload;
  global.saveAccountBackup = saveAccountBackup;
  global.backupBeforeAccountDelete = backupBeforeAccountDelete;
  global.purgeExpiredBackupsForMobile = purgeExpiredBackupsForMobile;
  global.downloadBackupExcel = downloadBackupExcel;
  global.openDeletedAccountsBackupModal = openDeletedAccountsBackupModal;
  global._delBakLoadAsAdmin = _delBakLoadAsAdmin;
  global._delBakDownload = _delBakDownload;
})(typeof window!=='undefined'?window:globalThis);
