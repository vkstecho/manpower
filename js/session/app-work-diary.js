/* Work Diary — personal per mobile number. Path: workDiary/{mobile10}/{YYYY-MM-DD} */
(function(){
  'use strict';

  function _wdMobile(){
    try{
      var m = (SESSION && (SESSION.mobile || SESSION.phone)) || '';
      m = String(m).replace(/\D/g,'').slice(-10);
      if(m.length===10) return m;
    }catch(e){}
    return '';
  }

  function _wdPath(dateStr){
    var mob = _wdMobile();
    if(!mob) return null;
    if(dateStr) return 'workDiary/'+mob+'/'+dateStr;
    return 'workDiary/'+mob;
  }

  function _wdToday(){
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function _wdDayName(dateStr){
    try{
      var d = new Date(dateStr+'T12:00:00');
      var names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      var hi = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
      var i = d.getDay();
      if(typeof L==='function') return L(hi[i], names[i]);
      return names[i];
    }catch(e){ return '—'; }
  }

  function _wdFetchShift(dateStr){
    try{
      var emp = null;
      if(typeof myEmp==='function') emp = myEmp();
      if(!emp && typeof getEmps==='function'){
        var list = getEmps()||[];
        var mob = _wdMobile();
        emp = list.find(function(e){
          if(!e) return false;
          var ph = String(e.phone||e.mobile||'').replace(/\D/g,'').slice(-10);
          return (SESSION && e.id===SESSION.empObjId) || (mob && ph===mob);
        }) || null;
      }
      if(!emp || typeof getShift!=='function') return { code:'', label:'—' };
      var sh = getShift(emp, dateStr) || '';
      var disp = sh;
      try{ if(typeof cellDisp==='function') disp = cellDisp(sh)||sh; }catch(e){}
      // hours if time legend
      var hrs = '';
      try{
        if(sh && typeof mpComputeDayHours==='function'){
          var h = mpComputeDayHours(emp.id, dateStr, sh);
          if(h) hrs = ' · '+h+' h';
        }
      }catch(e){}
      return { code: sh, label: (disp||'—')+hrs };
    }catch(e){ return { code:'', label:'—' }; }
  }

  function wdAddSlot(from, to){
    var host = document.getElementById('wdSlots');
    if(!host) return;
    var row = document.createElement('div');
    row.className = 'wd-slot';
    row.innerHTML =
      '<div><label style="font-size:10px;font-weight:700;color:var(--muted2)">From</label>'+
      '<input type="time" class="wd-from" value="'+(from||'')+'"></div>'+
      '<div><label style="font-size:10px;font-weight:700;color:var(--muted2)">To</label>'+
      '<input type="time" class="wd-to" value="'+(to||'')+'"></div>'+
      '<button type="button" title="Remove" onclick="this.parentNode.remove()" style="padding:8px 10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);cursor:pointer;margin-top:14px">✕</button>';
    host.appendChild(row);
  }

  function wdCollectSlots(){
    var slots = [];
    document.querySelectorAll('#wdSlots .wd-slot').forEach(function(row){
      var f = (row.querySelector('.wd-from')||{}).value || '';
      var t = (row.querySelector('.wd-to')||{}).value || '';
      if(f || t) slots.push({ from: f, to: t });
    });
    return slots;
  }

  async function wdLoadDate(dateStr){
    var dayEl = document.getElementById('wdDay');
    var shiftEl = document.getElementById('wdShift');
    var notesEl = document.getElementById('wdNotes');
    var slotsEl = document.getElementById('wdSlots');
    var status = document.getElementById('wdStatus');
    if(dayEl) dayEl.textContent = _wdDayName(dateStr);
    var sh = _wdFetchShift(dateStr);
    if(shiftEl) shiftEl.textContent = sh.label || '—';
    if(slotsEl) slotsEl.innerHTML = '';
    if(notesEl) notesEl.innerHTML = '';
    if(status) status.textContent = '';

    var path = _wdPath(dateStr);
    if(!path){
      if(status) status.textContent = (typeof L==='function'?L('मोबाइल लॉगिन ज़रूरी','Mobile login required'):'Mobile login required');
      wdAddSlot();
      return;
    }
    try{
      var data = await fbGet(path);
      if(data && typeof data==='object'){
        if(notesEl) notesEl.innerHTML = data.notesHtml || (data.notes ? String(data.notes).replace(/</g,'&lt;') : '');
        var slots = Array.isArray(data.slots) ? data.slots : [];
        if(slots.length){
          slots.forEach(function(s){ wdAddSlot(s.from||'', s.to||''); });
        } else {
          wdAddSlot();
        }
        if(status) status.textContent = (typeof L==='function'?L('लोड: ','Loaded: '):'Loaded: ')+dateStr+(data.updatedAt?' · saved ':'');
      } else {
        wdAddSlot();
      }
    }catch(e){
      console.warn('[workDiary] load', e);
      wdAddSlot();
      if(status) status.textContent = '⚠️ '+(e&&e.message?e.message:'Load failed');
    }
  }

  function wdOnDateChange(){
    var inp = document.getElementById('wdDate');
    if(!inp || !inp.value) return;
    wdLoadDate(inp.value);
  }

  function wdNewToday(){
    var inp = document.getElementById('wdDate');
    if(inp) inp.value = _wdToday();
    wdOnDateChange();
  }

  async function wdSave(){
    var mob = _wdMobile();
    var status = document.getElementById('wdStatus');
    if(!mob){
      toast(typeof L==='function'?L('❌ मोबाइल लॉगिन ज़रूरी','❌ Mobile login required'):'❌ Mobile login required');
      return;
    }
    var inp = document.getElementById('wdDate');
    var dateStr = (inp && inp.value) || _wdToday();
    var notesEl = document.getElementById('wdNotes');
    var notesHtml = notesEl ? notesEl.innerHTML : '';
    var notesText = notesEl ? (notesEl.innerText || notesEl.textContent || '') : '';
    var slots = wdCollectSlots();
    var sh = _wdFetchShift(dateStr);
    var payload = {
      date: dateStr,
      day: _wdDayName(dateStr),
      shift: sh.code || '',
      shiftLabel: sh.label || '',
      slots: slots,
      notesHtml: notesHtml,
      notes: notesText,
      mobile: mob,
      updatedAt: new Date().toISOString(),
      updatedBy: (SESSION && SESSION.name) || mob
    };
    var path = _wdPath(dateStr);
    try{
      if(typeof fbSet!=='function') throw new Error('Save unavailable');
      await fbSet(path, payload);
      // light index for search text
      try{
        await fbSet('workDiary/'+mob+'/_index/'+dateStr, {
          date: dateStr,
          preview: notesText.slice(0,120),
          shift: sh.code||'',
          updatedAt: payload.updatedAt
        });
      }catch(ix){}
      toast(typeof L==='function'?L('✅ डायरी सेव','✅ Diary saved'):'✅ Diary saved');
      if(status) status.textContent = '✅ Saved '+dateStr;
    }catch(e){
      console.warn('[workDiary] save', e);
      toast('❌ '+(e&&e.message?e.message:'Save failed'));
      if(status) status.textContent = '❌ Save failed — check Firebase rules for workDiary';
    }
  }

  async function wdRunSearch(){
    var q = (document.getElementById('wdSearchInput')||{}).value || '';
    q = String(q).trim().toLowerCase();
    var box = document.getElementById('wdSearchResults');
    if(!box) return;
    if(!q){
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    var mob = _wdMobile();
    if(!mob){
      toast('Mobile login required');
      return;
    }
    box.style.display = 'block';
    box.innerHTML = '<div style="font-size:12px;color:var(--muted2)">Searching…</div>';
    try{
      var all = await fbGet('workDiary/'+mob) || {};
      var hits = [];
      Object.keys(all).forEach(function(k){
        if(k==='_index') return;
        var row = all[k];
        if(!row || typeof row!=='object') return;
        var hay = ((row.notes||'')+' '+(row.notesHtml||'')+' '+(row.shiftLabel||'')+' '+(row.day||'')+' '+(row.date||'')).toLowerCase();
        if(hay.indexOf(q)>=0) hits.push(row);
      });
      hits.sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); });
      if(!hits.length){
        box.innerHTML = '<div class="empty-text" style="padding:8px">No matching diaries</div>';
        return;
      }
      box.innerHTML = '<div style="font-size:12px;font-weight:800;margin-bottom:8px">'+hits.length+' result(s)</div>' +
        hits.map(function(h){
          var prev = String(h.notes||'').slice(0,140).replace(/</g,'&lt;');
          return '<div class="wd-hit" onclick="wdOpenDate(\''+String(h.date||'').replace(/'/g,'')+'\')">'+
            '<div style="font-weight:800;color:var(--text)">📅 '+(h.date||'')+' · '+(h.day||'')+' · '+(h.shiftLabel||h.shift||'')+'</div>'+
            '<div style="font-size:12px;color:var(--muted2);margin-top:4px">'+prev+'</div></div>';
        }).join('');
    }catch(e){
      box.innerHTML = '<div style="color:var(--lv)">Search failed: '+(e&&e.message?e.message:'')+'</div>';
    }
  }

  function wdClearSearch(){
    var inp = document.getElementById('wdSearchInput');
    if(inp) inp.value = '';
    var box = document.getElementById('wdSearchResults');
    if(box){ box.style.display='none'; box.innerHTML=''; }
  }

  function wdOpenDate(dateStr){
    var inp = document.getElementById('wdDate');
    if(inp) inp.value = dateStr;
    wdLoadDate(dateStr);
    try{ document.getElementById('wdPage').scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
  }

  async function renderWorkDiary(){
    var mob = _wdMobile();
    var status = document.getElementById('wdStatus');
    if(!mob && status) status.textContent = 'Login with mobile to use personal Work Diary';
    var inp = document.getElementById('wdDate');
    if(inp && !inp.value) inp.value = _wdToday();
    if(inp && inp.value) await wdLoadDate(inp.value);
    else wdNewToday();
  }

  // exports
  window.wdAddSlot = wdAddSlot;
  window.wdOnDateChange = wdOnDateChange;
  window.wdNewToday = wdNewToday;
  window.wdSave = wdSave;
  window.wdRunSearch = wdRunSearch;
  window.wdClearSearch = wdClearSearch;
  window.wdOpenDate = wdOpenDate;
  window.renderWorkDiary = renderWorkDiary;
})();
