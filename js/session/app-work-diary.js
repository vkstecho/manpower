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
})();
