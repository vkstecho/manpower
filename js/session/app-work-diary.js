/* Work Diary — personal per mobile. Each time slot has its own notes underneath. */
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


  // ── Realtime auto-save (debounced) so notes are not lost ──
  var _wdAutoTimer = null;
  var _wdAutoBusy = false;

  function wdScheduleAutoSave(){
    try{
      var st = document.getElementById('wdStatus');
      if(st) st.textContent = '… editing — auto-save soon';
    }catch(e){}
    if(_wdAutoTimer) clearTimeout(_wdAutoTimer);
    _wdAutoTimer = setTimeout(function(){ wdAutoSave(); }, 1200);
  }

  async function wdAutoSave(){
    if(_wdAutoBusy) return;
    var mob = _wdMobile();
    if(!mob) return;
    var inp = document.getElementById('wdDate');
    var dateStr = (inp && inp.value) || _wdToday();
    var slots = wdCollectSlots();
    // Skip empty brand-new page
    var has = slots.some(function(s){ return (s.notes&&s.notes.trim()) || s.drawing || s.from || s.to; });
    if(!has) return;
    _wdAutoBusy = true;
    var st = document.getElementById('wdStatus');
    try{
      if(st) st.textContent = '💾 Auto-saving…';
      var sh = _wdFetchShift(dateStr);
      var allNotes = slots.map(function(s){
        return (s.from||'?')+'–'+(s.to||'?')+': '+(s.notes||'');
      }).join('\n');
      var payload = {
        date: dateStr,
        day: _wdDayName(dateStr),
        shift: sh.code || '',
        shiftLabel: sh.label || '',
        slots: slots,
        notes: allNotes,
        notesHtml: '',
        mobile: mob,
        updatedAt: new Date().toISOString(),
        updatedBy: (SESSION && SESSION.name) || mob,
        autoSaved: true
      };
      var path = _wdPath(dateStr);
      if(path && typeof fbSet==='function'){
        await fbSet(path, payload);
        try{
          await fbSet('workDiary/'+mob+'/_index/'+dateStr, {
            date: dateStr, preview: allNotes.slice(0,160),
            shift: sh.code||'', updatedAt: payload.updatedAt
          });
        }catch(ix){}
        if(st) st.textContent = '✅ Auto-saved '+new Date().toLocaleTimeString();
      }
    }catch(e){
      console.warn('[wdAutoSave]', e);
      if(st) st.textContent = '⚠️ Auto-save failed — use Save';
    }
    _wdAutoBusy = false;
  }

  function wdBindAutoSave(block){
    if(!block || block._wdAutoBound) return;
    block._wdAutoBound = true;
    var notes = block.querySelector('.wd-block-notes');
    if(notes){
      notes.addEventListener('input', wdScheduleAutoSave);
      notes.addEventListener('blur', function(){ wdScheduleAutoSave(); });
    }
    block.querySelectorAll('.wd-from, .wd-to').forEach(function(inp){
      inp.addEventListener('change', wdScheduleAutoSave);
    });
    var canvas = block.querySelector('.wd-draw-canvas');
    if(canvas){
      ['mouseup','touchend'].forEach(function(ev){
        canvas.addEventListener(ev, function(){ wdScheduleAutoSave(); });
      });
    }
  }

  /** One block = From–To + type notes + finger/mouse draw pad */
  function wdAddSlot(from, to, notesHtml, notesText, drawDataUrl){
    var host = document.getElementById('wdSlots');
    if(!host) return;
    var n = host.querySelectorAll('.wd-block').length + 1;
    var block = document.createElement('div');
    block.className = 'wd-block';
    block.innerHTML =
      '<div class="wd-slot-label" style="font-size:11px;font-weight:800;color:var(--muted2);margin-bottom:6px">Slot '+n+'</div>'+
      '<div class="wd-block-head">'+
        '<div><label style="font-size:10px;font-weight:700;color:var(--muted2)">From</label>'+
        '<input type="time" class="wd-from" value="'+(from||'')+'"></div>'+
        '<div><label style="font-size:10px;font-weight:700;color:var(--muted2)">To</label>'+
        '<input type="time" class="wd-to" value="'+(to||'')+'"></div>'+
        '<button type="button" title="Remove slot" onclick="this.closest(\'.wd-block\').remove();wdRenumberSlots();" '+
          'style="padding:8px 10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);cursor:pointer;margin-bottom:2px">✕</button>'+
      '</div>'+
      '<label style="font-size:11px;font-weight:800;color:var(--muted2);display:block;margin-bottom:4px">Work done in this time slot</label>'+
      '<div class="wd-block-notes" contenteditable="true" spellcheck="true" '+
        'data-placeholder="Type here… or use Draw below with finger / mouse">'+
        (notesHtml || '')+
      '</div>'+
      '<div class="wd-draw-toolbar" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center">'+
        '<button type="button" class="wd-draw-toggle" onclick="wdToggleDraw(this)" '+
          'style="padding:7px 12px;border-radius:10px;border:1.5px solid #f97316;background:rgba(249,115,22,.12);color:#ea580c;font-weight:800;cursor:pointer;font-size:12px">✏️ Draw (finger / mouse)</button>'+
        '<button type="button" class="wd-draw-clear" onclick="wdClearDraw(this)" '+
          'style="padding:7px 10px;border-radius:10px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-weight:700;cursor:pointer;font-size:12px">Clear drawing</button>'+
        '<span style="font-size:11px;color:var(--muted2)">Finger or mouse — hold and write</span>'+
      '</div>'+
      '<div class="wd-draw-wrap" style="display:none;margin-top:8px;border:1.5px solid var(--border2);border-radius:12px;overflow:hidden;background:#fff;touch-action:none">'+
        '<canvas class="wd-draw-canvas" width="640" height="220" style="width:100%;height:220px;display:block;cursor:crosshair;touch-action:none"></canvas>'+
      '</div>'+
      '<button type="button" class="wd-add-next" onclick="wdAddSlot()" '+
        'style="display:none;margin-top:10px;padding:10px 14px;border-radius:12px;border:1.5px dashed rgba(249,115,22,.55);background:transparent;color:#ea580c;font-weight:800;cursor:pointer;width:100%">＋ Add next time slot</button>';
    host.appendChild(block);
    if(!notesHtml && notesText){
      var ne = block.querySelector('.wd-block-notes');
      if(ne) ne.textContent = notesText;
    }
    wdInitDrawCanvas(block, drawDataUrl||'');
    wdBindAutoSave(block);
    wdRenumberSlots();
    try{
      block.scrollIntoView({behavior:'smooth', block:'nearest'});
      var notes = block.querySelector('.wd-block-notes');
      if(notes) notes.focus();
    }catch(e){}
  }

  function wdToggleDraw(btn){
    var block = btn && btn.closest('.wd-block');
    if(!block) return;
    var wrap = block.querySelector('.wd-draw-wrap');
    if(!wrap) return;
    var on = wrap.style.display === 'none' || !wrap.style.display;
    wrap.style.display = on ? 'block' : 'none';
    btn.style.background = on ? '#ea580c' : 'rgba(249,115,22,.12)';
    btn.style.color = on ? '#fff' : '#ea580c';
    btn.textContent = on ? '✏️ Drawing on — finger / mouse' : '✏️ Draw (finger / mouse)';
    if(on){
      try{ wdResizeCanvas(block.querySelector('.wd-draw-canvas')); }catch(e){}
    }
  }

  function wdClearDraw(btn){
    var block = btn && btn.closest('.wd-block');
    if(!block) return;
    var canvas = block.querySelector('.wd-draw-canvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    canvas._wdHasInk = false;
  }

  function wdResizeCanvas(canvas){
    if(!canvas) return;
    var wrap = canvas.parentNode;
    var w = Math.max(280, (wrap && wrap.clientWidth) || 640);
    var h = 220;
    // Preserve existing ink when resizing
    var prev = null;
    try{ if(canvas._wdHasInk) prev = canvas.toDataURL('image/png'); }catch(e){}
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,w,h);
    if(prev){
      var img = new Image();
      img.onload = function(){ ctx.drawImage(img,0,0,w,h); canvas._wdHasInk = true; };
      img.src = prev;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
  }

  function wdInitDrawCanvas(block, dataUrl){
    var canvas = block.querySelector('.wd-draw-canvas');
    if(!canvas) return;
    wdResizeCanvas(canvas);
    var ctx = canvas.getContext('2d');
    if(dataUrl){
      var img = new Image();
      img.onload = function(){
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        canvas._wdHasInk = true;
        var wrap = block.querySelector('.wd-draw-wrap');
        if(wrap) wrap.style.display = 'block';
      };
      img.src = dataUrl;
    }
    var drawing = false;
    function pos(e){
      var r = canvas.getBoundingClientRect();
      var src = (e.touches && e.touches[0]) ? e.touches[0] : e;
      return {
        x: (src.clientX - r.left) * (canvas.width / r.width),
        y: (src.clientY - r.top) * (canvas.height / r.height)
      };
    }
    function start(e){
      e.preventDefault();
      drawing = true;
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
    function move(e){
      if(!drawing) return;
      e.preventDefault();
      var p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      canvas._wdHasInk = true;
    }
    function end(e){
      if(!drawing) return;
      drawing = false;
      try{ e.preventDefault(); }catch(x){}
    }
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, {passive:false});
    canvas.addEventListener('touchmove', move, {passive:false});
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);
  }

  function wdGetDrawDataUrl(block){
    var canvas = block.querySelector('.wd-draw-canvas');
    if(!canvas || !canvas._wdHasInk) return '';
    try{ return canvas.toDataURL('image/png'); }catch(e){ return ''; }
  }

  function wdRenumberSlots(){
    var host = document.getElementById('wdSlots');
    if(!host) return;
    var blocks = host.querySelectorAll('.wd-block');
    blocks.forEach(function(b, i){
      var lab = b.querySelector('.wd-slot-label');
      if(lab) lab.textContent = 'Slot '+(i+1);
      // Only the LAST slot shows "Add next" under its notes
      var btn = b.querySelector('.wd-add-next');
      if(btn) btn.style.display = (i === blocks.length-1) ? 'block' : 'none';
    });
  }

  function wdCollectSlots(){
    var slots = [];
    document.querySelectorAll('#wdSlots .wd-block').forEach(function(block){
      var f = (block.querySelector('.wd-from')||{}).value || '';
      var t = (block.querySelector('.wd-to')||{}).value || '';
      var ne = block.querySelector('.wd-block-notes');
      var notesHtml = ne ? ne.innerHTML : '';
      var notesText = ne ? (ne.innerText || ne.textContent || '') : '';
      var draw = wdGetDrawDataUrl(block);
      if(f || t || (notesText && notesText.trim()) || draw){
        slots.push({ from: f, to: t, notesHtml: notesHtml, notes: notesText, drawing: draw || '' });
      }
    });
    return slots;
  }

  async function wdLoadDate(dateStr){
    var dayEl = document.getElementById('wdDay');
    var shiftEl = document.getElementById('wdShift');
    var slotsEl = document.getElementById('wdSlots');
    var status = document.getElementById('wdStatus');
    if(dayEl) dayEl.textContent = _wdDayName(dateStr);
    var sh = _wdFetchShift(dateStr);
    if(shiftEl) shiftEl.textContent = sh.label || '—';
    if(slotsEl) slotsEl.innerHTML = '';
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
        var slots = Array.isArray(data.slots) ? data.slots : [];
        if(slots.length){
          slots.forEach(function(s){
            // New format: notes per slot; legacy: shared notes only on first slot
            wdAddSlot(s.from||'', s.to||'', s.notesHtml||'', s.notes||'', s.drawing||'');
          });
          // Legacy: page-level notesHtml when slots had no per-slot notes
          if(data.notesHtml || data.notes){
            var first = document.querySelector('#wdSlots .wd-block .wd-block-notes');
            if(first && !(first.innerText||'').trim()){
              if(data.notesHtml) first.innerHTML = data.notesHtml;
              else first.textContent = data.notes || '';
            }
          }
        } else {
          // Legacy single notes only
          wdAddSlot('', '', data.notesHtml||'', data.notes||'');
        }
        if(status) status.textContent = (typeof L==='function'?L('लोड: ','Loaded: '):'Loaded: ')+dateStr+(data.updatedAt?' · saved':'');
      } else {
        wdAddSlot();
      }
    }catch(e){
      console.warn('[workDiary] load', e);
      wdAddSlot();
      if(status) status.textContent = '⚠️ '+(e&&e.message?e.message:'Load failed');
    }
  }

  function wdShiftDate(deltaDays){
    try{
      var inp = document.getElementById('wdDate');
      if(!inp) return;
      var base = inp.value || _wdToday();
      var d = new Date(base + 'T12:00:00');
      if(isNaN(d.getTime())) d = new Date();
      d.setDate(d.getDate() + (deltaDays || 0));
      var y = d.getFullYear();
      var m = String(d.getMonth()+1).padStart(2,'0');
      var day = String(d.getDate()).padStart(2,'0');
      inp.value = y + '-' + m + '-' + day;
      wdOnDateChange();
    }catch(e){ console.warn('[workDiary] shiftDate', e); }
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
    var slots = wdCollectSlots();
    var sh = _wdFetchShift(dateStr);
    // Flatten notes for search / preview
    var allNotes = slots.map(function(s){
      var label = (s.from||'?')+'–'+(s.to||'?');
      return label+': '+(s.notes||'');
    }).join('\n');
    var payload = {
      date: dateStr,
      day: _wdDayName(dateStr),
      shift: sh.code || '',
      shiftLabel: sh.label || '',
      slots: slots,
      notes: allNotes,
      notesHtml: '',
      mobile: mob,
      updatedAt: new Date().toISOString(),
      updatedBy: (SESSION && SESSION.name) || mob
    };
    var path = _wdPath(dateStr);
    try{
      if(typeof fbSet!=='function') throw new Error('Save unavailable');
      await fbSet(path, payload);
      try{
        await fbSet('workDiary/'+mob+'/_index/'+dateStr, {
          date: dateStr,
          preview: allNotes.slice(0,160),
          shift: sh.code||'',
          updatedAt: payload.updatedAt
        });
      }catch(ix){}
      toast(typeof L==='function'?L('✅ डायरी सेव','✅ Diary saved'):'✅ Diary saved');
      if(status) status.textContent = '✅ Saved '+dateStr+' · '+slots.length+' slot(s)';
    }catch(e){
      console.warn('[workDiary] save', e);
      toast(L('❌ ','❌ ')+(e&&e.message?e.message:L('सहेजना विफल','Save failed')));
      if(status) status.textContent = '❌ Save failed — deploy workDiary Firebase rules if needed';
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
    if(!mob){ toast(L('मोबाइल लॉगिन आवश्यक','Mobile login required')); return; }
    box.style.display = 'block';
    box.innerHTML = '<div style="font-size:12px;color:var(--muted2)">Searching…</div>';
    try{
      var all = await fbGet('workDiary/'+mob) || {};
      var hits = [];
      Object.keys(all).forEach(function(k){
        if(k==='_index') return;
        var row = all[k];
        if(!row || typeof row!=='object') return;
        var parts = [row.notes||'', row.day||'', row.date||'', row.shiftLabel||''];
        if(Array.isArray(row.slots)){
          row.slots.forEach(function(s){
            parts.push(s.notes||'', s.notesHtml||'', s.from||'', s.to||'');
          });
        }
        var hay = parts.join(' ').toLowerCase();
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



  function _wdEsc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _wdDayHtml(row){
    if(!row) return '';
    var slots = Array.isArray(row.slots) ? row.slots : [];
    var slotsHtml = slots.length ? slots.map(function(s, i){
      var notes = s.notesHtml || _wdEsc(s.notes||'').replace(/\n/g,'<br>');
      var drawImg = s.drawing ? '<div style="margin-top:8px"><img src="'+s.drawing+'" style="max-width:100%;border:1px solid #ddd"/></div>' : '';
      return '<div style="margin:12px 0;padding:10px;border:1px solid #ccc;border-radius:6px">'+
        '<div style="font-weight:700">Slot '+(i+1)+' · '+(s.from||'?')+' – '+(s.to||'?')+'</div>'+
        '<div style="margin-top:6px">'+notes+'</div>'+drawImg+'</div>';
    }).join('') : '<div style="color:#666">'+(row.notesHtml||_wdEsc(row.notes||'')||'—')+'</div>';
    return '<div style="page-break-after:always;margin-bottom:24px">'+
      '<h2 style="margin:0 0 8px 0">Work Diary — '+_wdEsc(row.date||'')+'</h2>'+
      '<div><b>Day:</b> '+_wdEsc(row.day||'')+' &nbsp; <b>Shift:</b> '+_wdEsc(row.shiftLabel||row.shift||'')+'</div>'+
      slotsHtml+
      '</div>';
  }

  async function wdDownloadWord(mode){
    var mob = _wdMobile();
    if(!mob){ toast(L('मोबाइल लॉगिन आवश्यक','Mobile login required')); return; }
    var from, to;
    var dateInp = document.getElementById('wdDate');
    if(mode==='day'){
      from = to = (dateInp && dateInp.value) || _wdToday();
    } else {
      from = (document.getElementById('wdDocFrom')||{}).value || '';
      to = (document.getElementById('wdDocTo')||{}).value || '';
      if(!from || !to){
        toast(L('से और तक तिथियाँ चुनें','Select From and To dates'));
        return;
      }
      if(from > to){ var t=from; from=to; to=t; }
    }
    toast(L('वर्ड तैयार हो रहा है…','Preparing Word…'));
    try{
      var all = await fbGet('workDiary/'+mob) || {};
      var days = [];
      Object.keys(all).forEach(function(k){
        if(k==='_index') return;
        var row = all[k];
        if(!row || typeof row!=='object') return;
        var d = row.date || k;
        if(d >= from && d <= to) days.push(row);
      });
      days.sort(function(a,b){ return String(a.date||'').localeCompare(String(b.date||'')); });
      if(!days.length){
        // try load single day path
        if(mode==='day'){
          var one = await fbGet(_wdPath(from));
          if(one) days = [one];
        }
      }
      if(!days.length){
        toast(L('उस सीमा में कोई डायरी प्रविष्टि नहीं','No diary entries in that range'));
        return;
      }
      var name = (SESSION && SESSION.name) || mob;
      var body = days.map(_wdDayHtml).join('');
      var html = '<!DOCTYPE html><html><head><meta charset="utf-8">'+
        '<title>Work Diary '+from+(from!==to?' to '+to:'')+'</title></head><body>'+
        '<h1>Work Diary — '+_wdEsc(name)+'</h1>'+
        '<p>Mobile: '+_wdEsc(mob)+' · '+_wdEsc(from)+(from!==to?' → '+_wdEsc(to):'')+' · '+days.length+' day(s)</p>'+
        body+
        '</body></html>';
      // Word opens HTML saved as .doc
      var blob = new Blob(['\ufeff'+html], { type: 'application/msword' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'WorkDiary_'+from+(from!==to?'_to_'+to:'')+'.doc';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ try{ URL.revokeObjectURL(url); a.remove(); }catch(e){} }, 1500);
      toast(L('✅ वर्ड डाउनलोड: ','✅ Word download: ')+days.length+L(' दिन',' day(s)'));
    }catch(e){
      console.warn('[wdDownloadWord]', e);
      toast(L('❌ ','❌ ')+(e&&e.message?e.message:L('डाउनलोड विफल','Download failed')));
    }
  }

  // Prefill doc range when diary opens
  var _wdOldRender = renderWorkDiary;
  renderWorkDiary = async function(){
    await _wdOldRender();
    try{
      var d = (document.getElementById('wdDate')||{}).value || _wdToday();
      var f = document.getElementById('wdDocFrom');
      var t = document.getElementById('wdDocTo');
      if(f && !f.value) f.value = d;
      if(t && !t.value) t.value = d;
    }catch(e){}
  };
  window.renderWorkDiary = renderWorkDiary;
  window.wdShiftDate = wdShiftDate;
  window.wdOnDateChange = wdOnDateChange;
  window.wdDownloadWord = wdDownloadWord;

  window.wdAddSlot = wdAddSlot;
  window.wdRenumberSlots = wdRenumberSlots;
  window.wdOnDateChange = wdOnDateChange;
  window.wdNewToday = wdNewToday;
  window.wdSave = wdSave;
  window.wdRunSearch = wdRunSearch;
  window.wdClearSearch = wdClearSearch;
  window.wdOpenDate = wdOpenDate;
  window.renderWorkDiary = renderWorkDiary;


  // ═══════════════════════════════════════════
  // MODE SWITCH: Diary | Notes | Calendar
  // ═══════════════════════════════════════════
  var _wdMode = 'diary';

  function wdSetMode(mode){
    _wdMode = mode || 'diary';
    try{
      document.querySelectorAll('.wd-mode-btn').forEach(function(b){
        var on = b.getAttribute('data-wd-mode') === _wdMode;
        b.classList.toggle('active', on);
        if(on){
          b.style.borderColor = 'rgba(249,115,22,.45)';
          b.style.background = 'rgba(249,115,22,.12)';
          b.style.color = '#ea580c';
        } else {
          b.style.borderColor = '';
          b.style.background = '';
          b.style.color = '';
        }
      });
      var d = document.getElementById('wdDiaryPanel');
      var n = document.getElementById('wdNotesPanel');
      var c = document.getElementById('wdCalPanel');
      if(d) d.style.display = (_wdMode==='diary') ? '' : 'none';
      if(n) n.style.display = (_wdMode==='notes') ? '' : 'none';
      if(c) c.style.display = (_wdMode==='calendar') ? '' : 'none';
    }catch(e){}
    if(_wdMode==='notes') wnLoad();
    if(_wdMode==='calendar') wcLoad();
  }

  // ═══════════════════════════════════════════
  // NOTES — Google Keep style (personal per mobile)
  // Path: workNotes/{mobile}/{noteId}
  // ═══════════════════════════════════════════
  var _wnColors = [
    {id:'default', bg:'#fff9c4'},
    {id:'peach', bg:'#f8bbd0'},
    {id:'mint', bg:'#c8e6c9'},
    {id:'sky', bg:'#bbdefb'},
    {id:'lavender', bg:'#e1bee7'},
    {id:'orange', bg:'#ffe0b2'},
    {id:'grey', bg:'#f5f5f5'}
  ];
  var _wnCache = {};

  function _wnPath(id){
    var mob = _wdMobile();
    if(!mob) return null;
    if(id) return 'workNotes/'+mob+'/'+id;
    return 'workNotes/'+mob;
  }

  function wnOpenEditor(note){
    try{
      var ed = document.getElementById('wnEditor');
      if(!ed) return;
      ed.style.display = 'block';
      document.getElementById('wnEditId').value = (note && note.id) || '';
      document.getElementById('wnTitle').value = (note && note.title) || '';
      document.getElementById('wnBody').value = (note && note.body) || '';
      document.getElementById('wnPinned').checked = !!(note && note.pinned);
      var del = document.getElementById('wnDeleteBtn');
      if(del) del.style.display = (note && note.id) ? '' : 'none';
      var row = document.getElementById('wnColorRow');
      if(row){
        var cur = (note && note.color) || 'default';
        row.innerHTML = _wnColors.map(function(c){
          var sel = c.id===cur ? 'outline:2px solid #0f172a;outline-offset:2px' : '';
          return '<button type="button" data-wn-color="'+c.id+'" onclick="wnPickColor(\''+c.id+'\')" title="'+c.id+'" style="width:28px;height:28px;border-radius:50%;border:1px solid rgba(0,0,0,.12);background:'+c.bg+';cursor:pointer;'+sel+'"></button>';
        }).join('');
        row.setAttribute('data-selected', cur);
      }
      document.getElementById('wnStatus').textContent = '';
      try{ document.getElementById('wnTitle').focus(); }catch(e){}
    }catch(e){ console.warn('[wnOpenEditor]', e); }
  }

  function wnPickColor(id){
    var row = document.getElementById('wnColorRow');
    if(!row) return;
    row.setAttribute('data-selected', id||'default');
    row.querySelectorAll('button').forEach(function(b){
      var on = b.getAttribute('data-wn-color') === id;
      b.style.outline = on ? '2px solid #0f172a' : '';
      b.style.outlineOffset = on ? '2px' : '';
    });
  }

  function wnCloseEditor(){
    try{
      var ed = document.getElementById('wnEditor');
      if(ed) ed.style.display = 'none';
      document.getElementById('wnEditId').value = '';
      document.getElementById('wnTitle').value = '';
      document.getElementById('wnBody').value = '';
      document.getElementById('wnPinned').checked = false;
    }catch(e){}
  }

  async function wnSave(){
    var mob = _wdMobile();
    var st = document.getElementById('wnStatus');
    if(!mob){
      toast(typeof L==='function'?L('❌ मोबाइल लॉगिन ज़रूरी','❌ Mobile login required'):'❌ Mobile login required');
      return;
    }
    var title = (document.getElementById('wnTitle')?.value||'').trim();
    var body = (document.getElementById('wnBody')?.value||'').trim();
    if(!title && !body){
      toast(typeof L==='function'?L('⚠️ Title या note लिखें','⚠️ Enter a title or note'):'⚠️ Enter a title or note');
      return;
    }
    var id = (document.getElementById('wnEditId')?.value||'').trim();
    if(!id) id = 'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    var color = 'default';
    try{ color = document.getElementById('wnColorRow')?.getAttribute('data-selected') || 'default'; }catch(e){}
    var pinned = !!(document.getElementById('wnPinned')?.checked);
    var payload = {
      id: id,
      title: title,
      body: body,
      color: color,
      pinned: pinned,
      updatedAt: new Date().toISOString(),
      createdAt: (_wnCache[id] && _wnCache[id].createdAt) || new Date().toISOString(),
      mobile: mob
    };
    try{
      if(typeof fbSet!=='function') throw new Error('Save unavailable');
      await fbSet(_wnPath(id), payload);
      _wnCache[id] = payload;
      if(st) st.textContent = '✅ Saved';
      toast(typeof L==='function'?L('✅ नोट सेव','✅ Note saved'):'✅ Note saved');
      wnRenderList();
      wnCloseEditor();
    }catch(e){
      console.warn('[wnSave]', e);
      if(st) st.textContent = '❌ '+(e&&e.message?e.message:'Save failed');
      toast(L('❌ ','❌ ')+(e&&e.message?e.message:'Save failed'));
    }
  }

  async function wnDelete(){
    var id = (document.getElementById('wnEditId')?.value||'').trim();
    if(!id) return;
    if(!confirm(typeof L==='function'?L('यह नोट डिलीट करें?','Delete this note?'):'Delete this note?')) return;
    try{
      var path = _wnPath(id);
      if(typeof fbRemove==='function') await fbRemove(path);
      else await fbSet(path, null);
      delete _wnCache[id];
      wnCloseEditor();
      wnRenderList();
      toast(typeof L==='function'?L('🗑️ नोट हटाया','🗑️ Note deleted'):'🗑️ Note deleted');
    }catch(e){
      toast(L('❌ ','❌ ')+(e&&e.message?e.message:'Delete failed'));
    }
  }

  async function wnLoad(){
    var mob = _wdMobile();
    _wnCache = {};
    if(!mob){
      wnRenderList();
      return;
    }
    try{
      var data = await fbGet(_wnPath()) || {};
      Object.keys(data).forEach(function(k){
        var n = data[k];
        if(!n || typeof n!=='object') return;
        if(k==='_index') return;
        n.id = n.id || k;
        _wnCache[n.id] = n;
      });
    }catch(e){ console.warn('[wnLoad]', e); }
    wnRenderList();
  }

  function wnRenderList(){
    var grid = document.getElementById('wnGrid');
    var empty = document.getElementById('wnEmpty');
    if(!grid) return;
    var q = String((document.getElementById('wnSearch')||{}).value||'').trim().toLowerCase();
    var list = Object.keys(_wnCache).map(function(k){ return _wnCache[k]; }).filter(Boolean);
    if(q){
      list = list.filter(function(n){
        return (String(n.title||'')+'\n'+String(n.body||'')).toLowerCase().indexOf(q)>=0;
      });
    }
    list.sort(function(a,b){
      if(!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));
    });
    if(!list.length){
      grid.innerHTML = '';
      if(empty) empty.style.display = '';
      return;
    }
    if(empty) empty.style.display = 'none';
    var colorMap = {};
    _wnColors.forEach(function(c){ colorMap[c.id]=c.bg; });
    grid.innerHTML = list.map(function(n){
      var bg = colorMap[n.color] || colorMap.default;
      var title = _wdEsc(n.title||'(Untitled)');
      var body = _wdEsc((n.body||'').slice(0,280));
      var pin = n.pinned ? '<div class="wn-card-pin">📌 Pinned</div>' : '';
      return '<div class="wn-card" style="background:'+bg+'" onclick="wnEdit(\''+String(n.id).replace(/'/g,"\\'")+'\')">'+
        pin+'<div class="wn-card-title">'+title+'</div><div class="wn-card-body">'+body+'</div></div>';
    }).join('');
  }

  function wnEdit(id){
    var n = _wnCache[id];
    if(n) wnOpenEditor(n);
  }

  // ═══════════════════════════════════════════
  // CALENDAR — events + timed reminders
  // Path: workCalendar/{mobile}/{eventId}
  // ═══════════════════════════════════════════
  var _wcCache = {};
  var _wcTimers = {};

  function _wcPath(id){
    var mob = _wdMobile();
    if(!mob) return null;
    if(id) return 'workCalendar/'+mob+'/'+id;
    return 'workCalendar/'+mob;
  }

  function wcRequestNotifPermission(){
    try{
      if(!('Notification' in window)){
        toast(typeof L==='function'?L('⚠️ इस ब्राउज़र में notification नहीं','⚠️ Notifications not supported here'):'⚠️ Notifications not supported');
        return;
      }
      Notification.requestPermission().then(function(p){
        if(p==='granted') toast(typeof L==='function'?L('✅ Notifications on','✅ Notifications on'):'✅ Notifications on');
        else toast(typeof L==='function'?L('Notifications बंद हैं — browser settings में allow करें','Notifications blocked — allow in browser settings'):'Notifications blocked');
      });
    }catch(e){ toast(String(e&&e.message||e)); }
  }

  function _wcFireNotif(ev){
    try{
      var title = ev.title || 'Reminder';
      var body = (ev.date||'')+' '+(ev.time||'')+(ev.notes?(' · '+ev.notes):'');
      if('Notification' in window && Notification.permission==='granted'){
        try{ new Notification('📅 '+title, { body: body, tag: 'wc-'+ev.id }); }catch(e){}
      }
      try{
        if(typeof toast==='function') toast('📅 '+title+(ev.time?(' · '+ev.time):''));
      }catch(e){}
      // In-app banner if available
      try{
        if(typeof showInAppBanner==='function') showInAppBanner('📅 '+title, body);
      }catch(e){}
    }catch(e){ console.warn('[wcFireNotif]', e); }
  }

  function _wcScheduleLocal(ev){
    try{
      if(_wcTimers[ev.id]){ clearTimeout(_wcTimers[ev.id]); delete _wcTimers[ev.id]; }
      if(!ev || !ev.date || !ev.time) return;
      var remindMin = parseInt(ev.remindMinutes, 10);
      if(!isFinite(remindMin) || remindMin<0) remindMin = 15;
      var when = new Date(ev.date+'T'+ev.time+':00');
      if(isNaN(when.getTime())) return;
      var fireAt = when.getTime() - remindMin*60*1000;
      var delay = fireAt - Date.now();
      if(delay < -60000) return; // already past by >1 min
      if(delay < 0) delay = 500; // due now
      // setTimeout max ~24 days; only schedule if within ~20 days
      if(delay > 20*24*3600*1000) return;
      _wcTimers[ev.id] = setTimeout(function(){
        _wcFireNotif(ev);
        delete _wcTimers[ev.id];
      }, delay);
    }catch(e){ console.warn('[wcScheduleLocal]', e); }
  }

  function _wcRescheduleAll(){
    Object.keys(_wcTimers).forEach(function(k){ try{ clearTimeout(_wcTimers[k]); }catch(e){} });
    _wcTimers = {};
    Object.keys(_wcCache).forEach(function(k){ _wcScheduleLocal(_wcCache[k]); });
  }

  function wcOpenEditor(ev){
    try{
      var ed = document.getElementById('wcEditor');
      if(!ed) return;
      ed.style.display = 'block';
      document.getElementById('wcEditId').value = (ev && ev.id) || '';
      document.getElementById('wcTitle').value = (ev && ev.title) || '';
      document.getElementById('wcDate').value = (ev && ev.date) || _wdToday();
      document.getElementById('wcTime').value = (ev && ev.time) || '09:00';
      document.getElementById('wcNotes').value = (ev && ev.notes) || '';
      var rem = document.getElementById('wcRemind');
      if(rem) rem.value = String((ev && ev.remindMinutes!=null)?ev.remindMinutes:15);
      var del = document.getElementById('wcDeleteBtn');
      if(del) del.style.display = (ev && ev.id) ? '' : 'none';
      document.getElementById('wcStatus').textContent = '';
      try{ document.getElementById('wcTitle').focus(); }catch(e){}
    }catch(e){ console.warn('[wcOpenEditor]', e); }
  }

  function wcCloseEditor(){
    try{
      var ed = document.getElementById('wcEditor');
      if(ed) ed.style.display = 'none';
      document.getElementById('wcEditId').value = '';
    }catch(e){}
  }

  async function wcSave(){
    var mob = _wdMobile();
    var st = document.getElementById('wcStatus');
    if(!mob){
      toast(typeof L==='function'?L('❌ मोबाइल लॉगिन ज़रूरी','❌ Mobile login required'):'❌ Mobile login required');
      return;
    }
    var title = (document.getElementById('wcTitle')?.value||'').trim();
    var date = (document.getElementById('wcDate')?.value||'').trim();
    var time = (document.getElementById('wcTime')?.value||'').trim();
    var notes = (document.getElementById('wcNotes')?.value||'').trim();
    var remindMinutes = parseInt((document.getElementById('wcRemind')||{}).value, 10);
    if(!isFinite(remindMinutes)) remindMinutes = 15;
    if(!title){
      toast(typeof L==='function'?L('⚠️ Title लिखें','⚠️ Enter a title'):'⚠️ Enter a title');
      return;
    }
    if(!date || !time){
      toast(typeof L==='function'?L('⚠️ Date और Time चुनें','⚠️ Pick date and time'):'⚠️ Pick date and time');
      return;
    }
    var id = (document.getElementById('wcEditId')?.value||'').trim();
    if(!id) id = 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    var payload = {
      id: id,
      title: title,
      date: date,
      time: time,
      notes: notes,
      remindMinutes: remindMinutes,
      updatedAt: new Date().toISOString(),
      createdAt: (_wcCache[id] && _wcCache[id].createdAt) || new Date().toISOString(),
      mobile: mob
    };
    try{
      if(typeof fbSet!=='function') throw new Error('Save unavailable');
      await fbSet(_wcPath(id), payload);
      _wcCache[id] = payload;
      _wcScheduleLocal(payload);
      if(st) st.textContent = '✅ Saved';
      toast(typeof L==='function'?L('✅ इवेंट सेव','✅ Event saved'):'✅ Event saved');
      // Prompt notification permission once
      try{
        if('Notification' in window && Notification.permission==='default'){
          Notification.requestPermission();
        }
      }catch(e){}
      wcRenderList();
      wcCloseEditor();
    }catch(e){
      console.warn('[wcSave]', e);
      if(st) st.textContent = '❌ '+(e&&e.message?e.message:'Save failed');
      toast(L('❌ ','❌ ')+(e&&e.message?e.message:'Save failed'));
    }
  }

  async function wcDelete(){
    var id = (document.getElementById('wcEditId')?.value||'').trim();
    if(!id) return;
    if(!confirm(typeof L==='function'?L('यह इवेंट डिलीट करें?','Delete this event?'):'Delete this event?')) return;
    try{
      var path = _wcPath(id);
      if(typeof fbRemove==='function') await fbRemove(path);
      else await fbSet(path, null);
      if(_wcTimers[id]){ clearTimeout(_wcTimers[id]); delete _wcTimers[id]; }
      delete _wcCache[id];
      wcCloseEditor();
      wcRenderList();
      toast(typeof L==='function'?L('🗑️ इवेंट हटाया','🗑️ Event deleted'):'🗑️ Event deleted');
    }catch(e){
      toast(L('❌ ','❌ ')+(e&&e.message?e.message:'Delete failed'));
    }
  }

  async function wcLoad(){
    var mob = _wdMobile();
    _wcCache = {};
    if(!mob){
      wcRenderList();
      return;
    }
    try{
      var data = await fbGet(_wcPath()) || {};
      Object.keys(data).forEach(function(k){
        var n = data[k];
        if(!n || typeof n!=='object') return;
        n.id = n.id || k;
        _wcCache[n.id] = n;
      });
    }catch(e){ console.warn('[wcLoad]', e); }
    _wcRescheduleAll();
    wcRenderList();
  }

  function wcRenderList(){
    var box = document.getElementById('wcList');
    var empty = document.getElementById('wcEmpty');
    if(!box) return;
    var list = Object.keys(_wcCache).map(function(k){ return _wcCache[k]; }).filter(Boolean);
    list.sort(function(a,b){
      var ka = String(a.date||'')+'T'+String(a.time||'');
      var kb = String(b.date||'')+'T'+String(b.time||'');
      return ka.localeCompare(kb);
    });
    var now = Date.now();
    // show upcoming first (including today), then past collapsed at bottom
    var upcoming = [];
    var past = [];
    list.forEach(function(ev){
      var t = new Date((ev.date||'')+'T'+(ev.time||'00:00')+':00').getTime();
      if(isNaN(t) || t >= now - 3600000) upcoming.push(ev);
      else past.push(ev);
    });
    if(!list.length){
      box.innerHTML = '';
      if(empty) empty.style.display = '';
      return;
    }
    if(empty) empty.style.display = 'none';
    function row(ev){
      var dayName = '';
      try{ dayName = _wdDayName(ev.date); }catch(e){}
      return '<div class="wc-item">'+
        '<div class="wc-item-time">'+_wdEsc(ev.time||'')+'<div style="font-size:11px;color:var(--muted2);font-weight:700;margin-top:2px">'+_wdEsc(ev.date||'')+'</div></div>'+
        '<div class="wc-item-body">'+
          '<div class="wc-item-title">'+_wdEsc(ev.title||'')+'</div>'+
          '<div class="wc-item-sub">'+_wdEsc(dayName)+(ev.remindMinutes!=null?(' · remind '+ev.remindMinutes+' min before'):'')+(ev.notes?(' · '+_wdEsc(String(ev.notes).slice(0,80))):'')+'</div>'+
        '</div>'+
        '<button type="button" onclick="wcEdit(\''+String(ev.id).replace(/'/g,"\\'")+'\')" style="padding:8px 10px;border-radius:10px;border:1.5px solid var(--border2);background:var(--bg2);font-weight:700;cursor:pointer">Edit</button>'+
      '</div>';
    }
    var html = '';
    if(upcoming.length){
      html += upcoming.map(row).join('');
    }
    if(past.length){
      html += '<div style="font-size:12px;font-weight:800;color:var(--muted2);margin:14px 0 8px">Past</div>';
      html += past.slice().reverse().slice(0,20).map(row).join('');
    }
    box.innerHTML = html;
  }

  function wcEdit(id){
    var n = _wcCache[id];
    if(n) wcOpenEditor(n);
  }

  // Hook mode into diary render
  var _wdOldRender2 = renderWorkDiary;
  renderWorkDiary = async function(){
    await _wdOldRender2();
    try{ wdSetMode(_wdMode || 'diary'); }catch(e){}
    // Warm notes/calendar schedules in background
    try{ wnLoad(); }catch(e){}
    try{ wcLoad(); }catch(e){}
  };

  window.wdSetMode = wdSetMode;
  window.wnOpenEditor = wnOpenEditor;
  window.wnCloseEditor = wnCloseEditor;
  window.wnSave = wnSave;
  window.wnDelete = wnDelete;
  window.wnPickColor = wnPickColor;
  window.wnEdit = wnEdit;
  window.wnRenderList = wnRenderList;
  window.wcOpenEditor = wcOpenEditor;
  window.wcCloseEditor = wcCloseEditor;
  window.wcSave = wcSave;
  window.wcDelete = wcDelete;
  window.wcEdit = wcEdit;
  window.wcRequestNotifPermission = wcRequestNotifPermission;
  window.renderWorkDiary = renderWorkDiary;


})();
