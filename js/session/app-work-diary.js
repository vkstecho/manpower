/* Personal Work Diary. Remote paths remain scoped to the verified Firebase UID. */
(() => {
  'use strict';

  const el = id => document.getElementById(id);
  const tx = (hi, en) => typeof L === 'function' ? L(hi, en) : en;
  const uid = () => {
    const user = window._fbAuth?.currentUser;
    return user && !user.isAnonymous && !window._mpLoggingOut ? user.uid : '';
  };
  const localDate = (d = new Date()) => [
    d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')
  ].join('-');
  const parseDate = date => new Date(date + 'T12:00:00');
  const validDate = date => /^\d{4}-\d\d-\d\d$/.test(date || '') && localDate(parseDate(date)) === date;
  const language = () => document.documentElement.lang || 'en';
  const dayName = date => validDate(date) ? parseDate(date).toLocaleDateString(language(), {weekday:'long'}) : '—';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const drawingData = value => typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : '';
  const richTags = new Set(['B','BR','BLOCKQUOTE','DIV','EM','I','IMG','LI','OL','P','S','STRONG','SUB','SUP','U','UL']);
  function safeRichText(value) {
    const input = document.createElement('template');
    input.innerHTML = String(value ?? '');
    const result = document.createElement('div');
    function copy(source, target) {
      for (const child of source.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) { target.append(child.textContent); continue; }
        if (child.nodeType !== Node.ELEMENT_NODE || /^(SCRIPT|STYLE|IFRAME|OBJECT)$/.test(child.tagName)) continue;
        if (!richTags.has(child.tagName)) { copy(child, target); continue; }
        const clean = document.createElement(child.tagName);
        if (child.tagName === 'IMG') {
          const src = drawingData(child.getAttribute('src'));
          if (!src) continue;
          clean.src = src;
          clean.alt = child.getAttribute('alt') || '';
        }
        copy(child, clean);
        target.append(clean);
      }
    }
    copy(input.content, result);
    return result.innerHTML;
  }

  let owner = '';
  let active = false;
  let mode = 'diary';
  let activation = 0;
  let visit = 0;
  let renderedVisit = 0;
  let searchSequence = 0;
  let day = null;
  let editorLoads = null;
  let draftDb;
  const loading = new Map();
  const pending = new Map();
  const writes = new Map();
  const statusText = new Map();
  let autoTimer;
  let copyTimer;
  function showStatus(id, hi = '', en = '') {
    statusText.set(id, [hi,en]);
    if (el(id)) el(id).textContent = tx(hi,en);
  }
  const status = (...message) => showStatus('wdStatus',...message);

  function draftStorage(action, key, value, user = owner) {
    if (!user || !window.indexedDB) return Promise.resolve();
    draftDb ||= new Promise((resolve, reject) => {
      const request = indexedDB.open('mp-work-diary', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = request.onblocked = () => reject(request.error);
    });
    return draftDb.then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', action === 'get' ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('drafts');
      const path = user + '/' + key;
      const request = action === 'get' ? store.get(path) :
        action === 'put' ? store.put(value, path) :
        store.delete(action === 'clear' ? IDBKeyRange.bound(user+'/', user+'/\uffff') : path);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error);
    })).catch(() => {
      draftDb = null;
      if (action === 'put' && key !== 'view' && owner === user && uid() === user) {
        const id = key === 'note' ? 'wnStatus' : key === 'event' ? 'wcStatus' : 'wdStatus';
        showStatus(id,'इस डिवाइस पर मसौदा नहीं सहेजा गया। ऐप बंद करने से पहले सहेजें।',
          'This device could not store the draft. Save before closing the app.');
      }
    });
  }

  function viewport() {
    const vp = window.visualViewport;
    if (!active || !vp || Math.abs(vp.scale - 1) > 0.02) return;
    document.body.style.setProperty('--wd-visible-height', Math.floor(vp.height) + 'px');
    document.body.style.setProperty('--wd-visible-top', Math.round(vp.offsetTop) + 'px');
  }

  function setWorkspace(on) {
    if (active === on) return;
    active = on;
    document.body.classList.toggle('wd-active', on);
    const rail = el('pcSidebar');
    if (on) {
      visit++;
      viewport();
      window.visualViewport?.addEventListener('resize', viewport);
      window.visualViewport?.addEventListener('scroll', viewport);
      window.addEventListener('resize',viewport);
      rail?.setAttribute('aria-label', tx('ऐप नेविगेशन','Application navigation'));
    } else {
      window.visualViewport?.removeEventListener('resize', viewport);
      window.visualViewport?.removeEventListener('scroll', viewport);
      window.removeEventListener('resize',viewport);
      document.body.style.removeProperty('--wd-visible-height');
      document.body.style.removeProperty('--wd-visible-top');
      if (owner && owner === uid()) flushDay();
    }
  }

  function rememberView() {
    if (owner && owner === uid() && validDate(day?.date)) void draftStorage('put', 'view', {mode,date:day.date});
  }

  const originals = new WeakMap();
  function applyLanguage() {
    const root = el('tab-diary');
    if (!root) return;
    const hindi = language().startsWith('hi');
    for (const node of root.querySelectorAll('[data-wd-hi],[data-wd-hi-label],[data-wd-hi-placeholder]')) {
      if (!originals.has(node)) originals.set(node, {
        text:node.textContent, label:node.getAttribute('aria-label'), placeholder:node.getAttribute('placeholder')
      });
      const original = originals.get(node);
      if (node.dataset.wdHi) node.textContent = hindi ? node.dataset.wdHi : original.text;
      if (node.dataset.wdHiLabel) {
        const label = hindi ? node.dataset.wdHiLabel : original.label;
        node.setAttribute('aria-label', label);
        if (node.hasAttribute('title')) node.title = label;
      }
      if (node.dataset.wdHiPlaceholder) node.placeholder = hindi ? node.dataset.wdHiPlaceholder : original.placeholder;
    }
    renumberSlots();
    el('wnBody').dataset.placeholder = tx('यहाँ नोट लिखें…','Write a note…');
    for (const [id,[hi,en]] of statusText) el(id).textContent = tx(hi,en);
    for (const result of root.querySelectorAll('[data-wd-result-date]')) {
      const date = result.dataset.wdResultDate;
      result.textContent = date + ' · ' + dayName(date);
    }
    if (el('wnColorRow')) {
      for (const button of el('wnColorRow').children) {
        const color = colors.find(entry => entry[0] === button.dataset.color);
        if (!color) continue;
        button.title = tx(color[3], color[2]);
        button.setAttribute('aria-label', button.title);
      }
    }
    if (active && day) showDayInfo(day.date);
    if (owner && mode === 'notes') drawNotes();
    if (owner && mode === 'calendar') drawEvents();
  }

  function showDayInfo(date) {
    el('wdDisplayDate').dateTime = date;
    el('wdDisplayDate').textContent = parseDate(date).toLocaleDateString(language(), {day:'numeric',month:'long',year:'numeric'});
    el('wdDay').textContent = dayName(date);
    el('wdShift').textContent = shiftOf(date).label;
  }
  function shiftOf(date) {
    const employee = typeof myEmp === 'function' ? myEmp() : null;
    if (!employee || typeof getShift !== 'function') return {code:'',label:'—'};
    const code = getShift(employee, date) || '';
    const label = (code && typeof cellDisp === 'function' && cellDisp(code)) || code || '—';
    const hours = code && typeof mpComputeDayHours === 'function' && mpComputeDayHours(employee.id, date, code);
    return {code,label:label + (hours ? ' · ' + hours + ' h' : '')};
  }

  function fillSlots(row) {
    const slots = Array.isArray(row?.slots) ? row.slots : [];
    el('wdSlots').replaceChildren();
    if (!slots.length) {
      addSlot({notes:row?.notes,notesHtml:row?.notesHtml});
      return;
    }
    slots.forEach((slot, index) => {
      const legacy = !index && slots.every(item => !item.notes && !item.notesHtml && !item.drawing);
      addSlot(legacy ? {...slot,notes:row.notes,notesHtml:row.notesHtml} : slot);
    });
  }

  function addSlot(slot = {}, focus = false) {
    const block = document.createElement('div');
    block.className = 'wd-block';
    block.innerHTML = `
      <div class="wd-slot-label"></div>
      <div class="wd-block-head">
        <label><span data-wd-hi="से">From</span><input class="wd-from" type="time"></label>
        <label><span data-wd-hi="तक">To</span><input class="wd-to" type="time"></label>
        <button type="button" class="wd-remove wd-screen-only" aria-label="Remove time slot" title="Remove time slot" data-wd-hi-label="समय खंड हटाएँ">×</button>
      </div>
      <div class="wd-block-notes" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true"></div>
      <div class="wd-actions wd-draw-toolbar wd-screen-only">
        <button type="button" class="wd-draw-toggle" aria-expanded="false" data-wd-hi="चित्र बनाएँ">Draw</button>
        <button type="button" class="wd-draw-clear" data-wd-hi="चित्र मिटाएँ">Clear drawing</button>
      </div>
      <div class="wd-draw-wrap" hidden><canvas class="wd-draw-canvas" width="1024" height="320" role="img"></canvas></div>
      <button type="button" class="wd-add-next wd-screen-only" data-wd-hi="＋ अगला समय खंड जोड़ें">＋ Add time slot</button>`;
    block.querySelector('.wd-from').value = slot.from || '';
    block.querySelector('.wd-to').value = slot.to || '';
    const notes = block.querySelector('.wd-block-notes');
    if (slot.notesHtml) notes.innerHTML = safeRichText(slot.notesHtml);
    else notes.textContent = slot.notes || '';
    notes.addEventListener('input', markDirty);
    notes.addEventListener('paste', pasteText);
    block.querySelectorAll('input').forEach(input => input.addEventListener('change', markDirty));
    block.querySelector('.wd-remove').onclick = () => {
      block.remove();
      if (!el('wdSlots').children.length) addSlot();
      renumberSlots();
      markDirty();
    };
    const wrap = block.querySelector('.wd-draw-wrap');
    const toggle = block.querySelector('.wd-draw-toggle');
    const canvas = block.querySelector('canvas');
    const setDrawing = visible => {
      wrap.hidden = !visible;
      toggle.setAttribute('aria-expanded', visible);
    };
    bindDrawing(canvas, slot.drawing);
    if (canvas._wdDrawing) setDrawing(true);
    toggle.onclick = () => setDrawing(wrap.hidden);
    block.querySelector('.wd-draw-clear').onclick = () => {
      canvas._wdClear();
      markDirty();
    };
    block.querySelector('.wd-add-next').onclick = () => addSlot({}, true);
    el('wdSlots').append(block);
    localizeSlot(block);
    if (focus) {
      applyLanguage();
      notes.focus();
    }
  }
  function localizeSlot(block) {
    const notes = block.querySelector('.wd-block-notes');
    notes.dataset.placeholder = tx('यहाँ लिखें…','Write here…');
    notes.setAttribute('aria-label', tx('इस समय खंड में किया गया काम','Work done in this time slot'));
    block.querySelector('canvas').setAttribute('aria-label', tx('हस्तलेखन कैनवास','Handwriting canvas'));
  }
  function renumberSlots() {
    const blocks = el('wdSlots')?.children || [];
    Array.from(blocks).forEach((block, index) => {
      block.querySelector('.wd-slot-label').textContent = tx('समय खंड ','Slot ') + (index + 1);
      block.querySelector('.wd-add-next').hidden = index !== blocks.length - 1;
      localizeSlot(block);
    });
  }
  function pasteText(event) {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') || '');
  }

  function bindDrawing(canvas, stored) {
    const ctx = canvas.getContext('2d');
    const wrap = canvas.parentElement;
    let pointer = null;
    const blank = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    blank();
    canvas._wdDrawing = drawingData(stored);
    let initial = canvas._wdDrawing;
    if (initial) {
      wrap.classList.add('wd-print-drawing');
      const image = new Image();
      image.onload = () => {
        if (initial) ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        initial = '';
      };
      image.onerror = () => { initial = ''; };
      image.src = initial;
    }
    canvas._wdClear = () => {
      initial = '';
      blank();
      canvas._wdDrawing = '';
      wrap.classList.remove('wd-print-drawing');
    };
    function point(event) {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left) * canvas.width / box.width,
        (event.clientY - box.top) * canvas.height / box.height];
    }
    canvas.onpointerdown = event => {
      if (pointer !== null || initial || event.button !== 0) return;
      pointer = event.pointerId;
      canvas.setPointerCapture(pointer);
      const [x, y] = point(event);
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + .1, y + .1);
      ctx.stroke();
    };
    canvas.onpointermove = event => {
      if (event.pointerId !== pointer) return;
      ctx.lineTo(...point(event));
      ctx.stroke();
    };
    const finish = () => {
      if (pointer === null) return;
      pointer = null;
      canvas._wdDrawing = canvas.toDataURL('image/png');
      wrap.classList.add('wd-print-drawing');
      markDirty();
    };
    canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = finish;
    canvas._wdFinish = finish;
  }

  function collectSlots() {
    return Array.from(el('wdSlots').children, block => {
      const notes = block.querySelector('.wd-block-notes');
      const canvas = block.querySelector('canvas');
      return {
        from:block.querySelector('.wd-from').value, to:block.querySelector('.wd-to').value,
        notesHtml:safeRichText(notes.innerHTML), notes:notes.innerText || notes.textContent || '',
        drawing:canvas._wdDrawing || ''
      };
    }).filter(slot => slot.from || slot.to || slot.notes.trim() || slot.drawing || slot.notesHtml.includes('<img'));
  }

  function markDirty() {
    if (!day?.loaded || owner !== uid()) return;
    day.dirty = true;
    status('बदलाव सहेजे जा रहे हैं…','Unsaved changes · autosave pending');
    clearTimeout(copyTimer);
    clearTimeout(autoTimer);
    copyTimer = setTimeout(capture, 220);
    autoTimer = setTimeout(() => void flushDay(), 1200);
  }

  function capture() {
    clearTimeout(copyTimer);
    if (!day?.dirty || owner !== uid()) return;
    const slots = collectSlots();
    day.dirty = false;
    const entry = {date:day.date, base:day.base, slots, needsReview:day.needsReview};
    pending.set(day.date, entry);
    void draftStorage('put', 'day/'+day.date, entry);
  }

  function flushDay(manual = false) {
    clearTimeout(autoTimer);
    el('wdSlots')?.querySelectorAll('canvas').forEach(canvas => canvas._wdFinish());
    capture();
    clearTimeout(autoTimer);
    if (!day?.loaded || owner !== uid()) return Promise.resolve(false);
    if (manual && !pending.has(day.date) && !writes.has(owner+'/'+day.date)) {
      day.dirty = true;
      capture();
    }
    return savePending(day.date, manual);
  }

  function savePending(date, manual) {
    const user = owner;
    const key = user + '/' + date;
    const entry = pending.get(date);
    if (!entry || user !== uid()) return writes.get(key) || Promise.resolve(false);
    if (entry.failed && !manual) return Promise.resolve(false);
    if (writes.has(key)) return writes.get(key).then(saved => saved && pending.has(date) && owner === user
      ? savePending(date, manual) : saved);
    if (entry.needsReview && (!manual || !confirm(tx(
      'डायरी का दूसरा संस्करण मिल सकता है। वर्तमान मसौदे से इस दिन की डायरी बदलें?',
      'A different version of this day may exist. Replace it with this draft?')))) return Promise.resolve(false);
    const show = (...message) => { if (day?.date === date && owner === user && uid() === user) status(...message); };
    const write = (async () => {
      try {
        const shift = shiftOf(date);
        const notes = entry.slots.map(slot => (slot.from || '?')+'–'+(slot.to || '?')+': '+slot.notes).join('\n');
        const payload = {
          date,day:dayName(date),shift:shift.code,shiftLabel:shift.label,slots:entry.slots,notes,notesHtml:'',
          mobile:user,updatedAt:new Date().toISOString(),updatedBy:SESSION?.name || user,...(!manual && {autoSaved:true})
        };
        show('सहेजा जा रहा है…','Saving…');
        await fbSet('workDiary/'+user+'/'+date, payload);
        if (owner !== user || uid() !== user) return true;
        if (day?.date === date) { day.base = payload.updatedAt; day.needsReview = false; }
        const latest = pending.get(date);
        if (latest === entry) {
          pending.delete(date);
          void draftStorage('delete', 'day/'+date);
          if (!day?.dirty || day.date !== date) show('सहेजा गया','Saved');
        } else if (latest) {
          latest.base = payload.updatedAt;
          latest.needsReview = false;
          void draftStorage('put', 'day/'+date, latest);
        }
        return true;
      } catch (error) {
        entry.failed = true;
        console.warn('[workDiary] Save',error.code || error.name);
        show('डायरी सहेजी नहीं गई। फिर से सहेजें।','Diary could not sync. Use Save diary to retry.');
        return false;
      }
    })().finally(() => writes.delete(key));
    writes.set(key, write);
    return write;
  }

  async function openDate(date, refresh = false) {
    if (!validDate(date) || !owner || owner !== uid()) return;
    const user = owner;
    if (day?.date === date && (!refresh || day.dirty || pending.has(date) || writes.has(user+'/'+date))) return;
    if (day?.date !== date) {
      void flushDay();
      day = {date,base:'',needsReview:false,dirty:false,loaded:false};
      fillSlots(null);
    }
    const current = day;
    if (loading.has(current)) return loading.get(current);
    el('wdDate').value = date;
    showDayInfo(date);
    el('wdSlots').setAttribute('aria-busy','true');
    el('wdSlots').inert = !current.loaded;
    el('wdSaveBtn').disabled = !current.loaded;
    if (!current.loaded) status('डायरी लोड हो रही है…','Loading diary…');
    rememberView();
    const task = (async () => {
      const [remote, local] = await Promise.allSettled([
        fbGet('workDiary/'+user+'/'+date), draftStorage('get', 'day/'+date)
      ]);
      if (owner !== user || uid() !== user || day !== current) return;
      const row = remote.status === 'fulfilled' ? remote.value : null;
      const draft = pending.get(date) || local.value;
      if (current.dirty || (refresh && pending.has(date))) return;
      current.base = row?.updatedAt || (remote.status === 'fulfilled' ? '' : draft?.base || '');
      current.needsReview = remote.status === 'rejected';
      if (draft && Array.isArray(draft.slots)) {
        current.needsReview ||= draft.base !== current.base;
        pending.set(date, {...draft,needsReview:current.needsReview});
        fillSlots(draft);
        if (current.needsReview) status('मसौदा वापस मिला। सहेजने से पहले इस दिन की जाँच करें।','Draft recovered. Review this day before saving.');
        else status('मसौदा वापस मिला। सहेजें।','Unsaved draft recovered. Save to sync it.');
      } else {
        fillSlots(row);
        if (current.needsReview) status('डायरी लोड नहीं हुई।','Diary could not load.');
        else if (row) status('सहेजा गया','Saved');
        else status('लिखते ही डायरी अपने आप सहेजी जाती है','Autosaves as you write');
      }
      current.loaded = true;
      applyLanguage();
    })().finally(() => {
      loading.delete(current);
      if (day === current && owner === user) {
        el('wdSlots').setAttribute('aria-busy','false');
        el('wdSlots').inert = false;
        el('wdSaveBtn').disabled = !current.loaded;
      }
    });
    loading.set(current, task);
    return task;
  }

  async function search() {
    const query = el('wdSearchInput').value.trim().toLowerCase();
    const box = el('wdSearchResults');
    const user = owner;
    const sequence = ++searchSequence;
    if (!query || !user || uid() !== user) { box.hidden = true; return; }
    box.hidden = false;
    box.textContent = tx('खोज रहे हैं…','Searching…');
    try {
      const collection = await fbGet('workDiary/'+user) || {};
      if (sequence !== searchSequence || uid() !== user) return;
      const matches = Object.entries(collection).filter(([date, row]) => {
        if (!validDate(date) || !row) return false;
        const slots = Array.isArray(row.slots) ? row.slots : [];
        return [date,row.notes,row.day,row.shiftLabel,...slots.flatMap(slot => [slot.notes,slot.from,slot.to])]
          .join(' ').toLowerCase().includes(query);
      }).sort(([a],[b]) => b.localeCompare(a));
      box.replaceChildren();
      if (!matches.length) { box.textContent = tx('कोई डायरी नहीं मिली','No matching diaries'); return; }
      for (const [date,row] of matches) {
        const hit = document.createElement('button');
        hit.type = 'button';
        hit.className = 'wd-hit';
        hit.innerHTML = '<strong data-wd-result-date="'+escape(date)+'">'+escape(date)+' · '+escape(dayName(date))+'</strong><small>'+
          escape(String(row.notes || '').slice(0,140))+'</small>';
        hit.onclick = async () => {
          await openDate(date);
          el('wdPage').scrollIntoView({block:'start'});
        };
        box.append(hit);
      }
    } catch (error) {
      if (owner === user && sequence === searchSequence) box.textContent = tx('खोज विफल रही','Search failed');
    }
  }

  function wordDay(date, row) {
    const slots = Array.isArray(row.slots) && row.slots.length ? row.slots : [{notes:row.notes,notesHtml:row.notesHtml}];
    return '<section><h2>'+tx('कार्य डायरी','Work Diary')+' — '+escape(date)+'</h2><p>'+
      escape(dayName(date))+' · '+escape(row.shiftLabel || row.shift || '—')+'</p>'+slots.map((slot,index) => {
        const drawing = drawingData(slot.drawing);
        return '<article><h3>'+tx('समय खंड ','Slot ')+(index+1)+' · '+escape(slot.from || '—')+
          ' – '+escape(slot.to || '—')+'</h3><div>'+ (slot.notesHtml ? safeRichText(slot.notesHtml) :
          escape(slot.notes).replace(/\n/g,'<br>'))+'</div>'+
          (drawing ? '<img alt="" src="'+drawing+'">' : '')+'</article>';
      }).join('')+'</section>';
  }

  async function downloadWord(range) {
    const user = owner;
    if (!user || user !== uid()) return;
    await flushDay();
    const date = day?.date;
    let from = range === 'day' ? date : el('wdDocFrom').value;
    let to = range === 'day' ? date : el('wdDocTo').value;
    if (user !== uid() || !validDate(from) || !validDate(to)) {
      toast(tx('से और तक की तारीख चुनें','Select From and To dates'));
      return;
    }
    if (from > to) [from,to] = [to,from];
    try {
      const all = range === 'day' ? {[date]:await fbGet('workDiary/'+user+'/'+date)} : await fbGet('workDiary/'+user) || {};
      if (user !== uid() || owner !== user) return;
      for (const [key, entry] of pending) all[key] = entry;
      const days = Object.entries(all).filter(([key,row]) => validDate(key) && row && key >= from && key <= to).sort(([a],[b]) => a.localeCompare(b));
      if (!days.length) { toast(tx('इस अवधि में कोई डायरी नहीं है','No diary entries in that range')); return; }
      const html = '<!doctype html><html lang="'+escape(language())+'"><meta charset="utf-8"><style>'+
        '@page Diary {size:595.3pt 841.9pt;margin:40pt}body{font:11pt sans-serif}main{page:Diary}'+
        'section+section{page-break-before:always}article{border:1px solid #aaa;padding:8pt;margin-bottom:8pt}img{max-width:100%}'+
        '</style><body><main><h1>'+tx('कार्य डायरी','Work Diary')+' — '+escape(SESSION?.name || '')+'</h1>'+
        days.map(([key,row]) => wordDay(key,row)).join('')+'</main></body></html>';
      const href = URL.createObjectURL(new Blob(['\ufeff'+html], {type:'application/msword'}));
      const link = Object.assign(document.createElement('a'), {href,download:'WorkDiary_'+from+(from === to ? '' : '_to_'+to)+'.doc'});
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1500);
    } catch (e) { toast(tx('Word डाउनलोड नहीं हुआ','Could not export Word')); }
  }

  const colors = [
    ['default','#fff9c4','Yellow','पीला'], ['peach','#f8bbd0','Pink','गुलाबी'],
    ['mint','#c8e6c9','Mint','हरा'], ['sky','#bbdefb','Sky blue','आसमानी'],
    ['lavender','#e1bee7','Lavender','बैंगनी'], ['orange','#ffe0b2','Orange','नारंगी'],
    ['grey','#f5f5f5','Grey','धूसर']
  ];
  const configs = {
    note:{prefix:'wn',branch:'workNotes',fields:['Title','Body','Pinned']},
    event:{prefix:'wc',branch:'workCalendar',fields:['Title','Date','Time','Notes','Remind']}
  };
  const notes = new Map();
  const events = new Map();
  const editors = {};
  const collectionRevision = {note:0,event:0};
  const reminders = new Map();
  const fields = (kind, suffix) => el(configs[kind].prefix+suffix);
  const cache = kind => kind === 'note' ? notes : events;
  const remotePath = (kind, id) => configs[kind].branch+'/'+owner+(id ? '/'+id : '');

  function getEditor(kind) {
    if (kind === 'note') return {
      id:fields(kind,'EditId').value, title:el('wnTitle').value, body:el('wnBody').innerText || el('wnBody').textContent || '',
      bodyHtml:safeRichText(el('wnBody').innerHTML),color:el('wnColorRow').dataset.selected || 'default',pinned:el('wnPinned').checked
    };
    return {
      id:fields(kind,'EditId').value, title:el('wcTitle').value, date:el('wcDate').value,
      time:el('wcTime').value,notes:el('wcNotes').value,remindMinutes:Number(el('wcRemind').value)
    };
  }

  function recordEditor(kind) {
    const editor = editors[kind];
    if (!editor || owner !== uid()) return;
    editor.dirty = true;
    editor.edits++;
    void draftStorage('put', kind, getEditor(kind));
  }

  function paintColors(current) {
    const row = el('wnColorRow');
    row.dataset.selected = current;
    row.replaceChildren(...colors.map(([id,swatch,en,hi]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wd-swatch';
      button.dataset.color = id;
      button.title = tx(hi,en);
      button.setAttribute('aria-label',button.title);
      button.setAttribute('aria-pressed',id === current);
      button.style.setProperty('--wn-color',swatch);
      button.onclick = () => {
        row.dataset.selected = id;
        for (const item of row.children) item.setAttribute('aria-pressed',item === button);
        recordEditor('note');
      };
      return button;
    }));
  }

  function openEditor(kind, row, recovery = false) {
    if (!owner || owner !== uid()) return;
    if (editors[kind]?.writing) return;
    if (editors[kind]?.dirty && !confirm(tx('वर्तमान मसौदा हटाएँ?','Discard this unsaved draft?'))) {
      fields(kind,'Title').focus();
      return;
    }
    if (!recovery) void draftStorage('delete', kind);
    const editor = editors[kind] = {dirty:recovery,writing:false,edits:0};
    fields(kind,'EditId').value = row?.id || '';
    fields(kind,'Title').value = row?.title || '';
    fields(kind,'DeleteBtn').hidden = !row?.id || !cache(kind).has(row.id);
    const hint = fields(kind,'Status');
    hint.textContent = recovery ? tx('मसौदा वापस मिला।','Unsaved draft recovered.') : '';
    if (kind === 'note') {
      if (row?.bodyHtml) el('wnBody').innerHTML = safeRichText(row.bodyHtml);
      else el('wnBody').textContent = row?.body || '';
      el('wnPinned').checked = !!row?.pinned;
      paintColors(row?.color || 'default');
    } else {
      el('wcDate').value = row?.date || localDate();
      el('wcTime').value = row?.time || '09:00';
      el('wcNotes').value = row?.notes || '';
      el('wcRemind').value = String(row?.remindMinutes ?? 15);
    }
    fields(kind,'Editor').hidden = false;
    if (!recovery && editors[kind] === editor) fields(kind,'Title').focus();
  }

  function closeEditor(kind, saved = false) {
    const editor = editors[kind];
    if (!editor || (!saved && (editor.writing ||
      (editor.dirty && !confirm(tx('मसौदा हटाकर बंद करें?','Discard this draft and close?')))))) return;
    fields(kind,'Editor').hidden = true;
    for (const name of ['EditId', ...configs[kind].fields]) {
      const field = fields(kind,name);
      if (field.isContentEditable) field.textContent = '';
      else if (field.type === 'checkbox') field.checked = false;
      else field.value = '';
    }
    delete editors[kind];
    void draftStorage('delete', kind);
  }

  async function saveEditor(kind) {
    const user = owner;
    const editor = editors[kind];
    if (!editor || editor.writing || user !== uid()) return;
    const row = getEditor(kind);
    const note = kind === 'note';
    row.title = row.title.trim();
    const hint = fields(kind,'Status');
    if ((!row.title && (!note || (!row.body.trim() && !row.bodyHtml.includes('<img')))) ||
        (!note && (!validDate(row.date) || !row.time))) {
      hint.textContent = note ? tx('शीर्षक या नोट लिखें','Enter a title or note') :
        tx('शीर्षक, तारीख और समय भरें','Enter a title, date and time');
      return;
    }
    row.id ||= (note ? 'n' : 'c') + crypto.randomUUID();
    fields(kind,'EditId').value = row.id;
    void draftStorage('put',kind,row);
    const updatedAt = new Date().toISOString();
    const payload = {...row,mobile:user,updatedAt,createdAt:cache(kind).get(row.id)?.createdAt || updatedAt};
    const revision = editor.edits;
    editor.writing = true;
    hint.textContent = tx('सहेजा जा रहा है…','Saving…');
    try {
      await fbSet(remotePath(kind,row.id),payload);
      if (user !== uid() || owner !== user || editors[kind] !== editor) return;
      collectionRevision[kind]++;
      cache(kind).set(row.id,payload);
      if (note) drawNotes();
      else {
        scheduleReminder(payload);
        drawEvents();
        if (window.Notification?.permission === 'default') void Notification.requestPermission();
      }
      if (editor.edits === revision) {
        closeEditor(kind,true);
        toast(note ? tx('नोट सहेजा गया','Note saved') : tx('इवेंट सहेजा गया','Event saved'));
      } else {
        fields(kind,'DeleteBtn').hidden = false;
        hint.textContent = tx('नए बदलाव अभी सहेजे नहीं गए हैं।','New changes are still unsaved.');
      }
    } catch (e) {
      if (user === uid() && editors[kind] === editor) hint.textContent = tx('सहेजना विफल रहा। फिर कोशिश करें।','Could not save. Try again.');
    } finally { editor.writing = false; }
  }

  async function deleteEditor(kind) {
    const user = owner;
    const id = fields(kind,'EditId').value;
    const editor = editors[kind];
    if (!editor || editor.writing || user !== uid() || !id ||
        !confirm(tx('इसे हटाएँ?','Delete this item?'))) return;
    editor.writing = true;
    try {
      await fbRemove(remotePath(kind,id));
      if (owner !== user || uid() !== user) return;
      collectionRevision[kind]++;
      cache(kind).delete(id);
      clearTimeout(reminders.get(id));
      reminders.delete(id);
      closeEditor(kind,true);
      if (kind === 'note') drawNotes();
      else drawEvents();
    } catch (error) {
      if (owner === user && uid() === user) fields(kind,'Status').textContent = tx('हटाया नहीं जा सका।','Could not delete.');
    } finally { editor.writing = false; }
  }

  function drawNotes() {
    const q = el('wnSearch').value.trim().toLowerCase();
    const list = [...notes.values()].filter(row => (String(row.title || '')+'\n'+String(row.body || '')).toLowerCase().includes(q))
      .sort((a,b) => Number(!!b.pinned) - Number(!!a.pinned) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    el('wnGrid').replaceChildren(...list.map(row => {
      const button = document.createElement('button');
      button.className = 'wn-card';
      button.type = 'button';
      button.style.setProperty('--wn-color',colors.find(entry => entry[0] === row.color)?.[1] || colors[0][1]);
      button.innerHTML = (row.pinned ? '<small class="wn-card-pin">'+tx('📌 पिन किया गया','📌 Pinned')+'</small>' : '')+
        '<strong>'+escape(row.title || tx('बिना शीर्षक','Untitled'))+'</strong>'+
        '<small class="wn-card-body">'+escape(String(row.body || '').slice(0,280))+'</small>';
      button.onclick = () => openEditor('note',row);
      return button;
    }));
    el('wnEmpty').hidden = !!list.length;
  }

  function drawEvents() {
    const list = [...events.values()].filter(event => validDate(event.date))
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    const cutoff = Date.now() - 3600000;
    const isUpcoming = event => Date.parse(event.date+'T'+event.time) >= cutoff;
    const groups = [[tx('आगामी','Upcoming'), list.filter(isUpcoming)],
      [tx('पिछले','Past'), list.filter(event => !isUpcoming(event)).reverse().slice(0,20)]];
    const box = el('wcList');
    box.replaceChildren();
    for (const [name, items] of groups) {
      if (!items.length) continue;
      const h = document.createElement('h2');
      h.className = 'wd-calendar-group';
      h.textContent = name;
      box.append(h);
      for (const event of items) {
        const item = document.createElement('div');
        item.className = 'wc-item';
        item.innerHTML = '<div class="wc-item-time">'+escape(event.time)+'<time>'+escape(event.date)+'</time></div>'+
          '<div class="wc-item-body"><strong>'+escape(event.title)+'</strong><small>'+escape(dayName(event.date))+
          (event.remindMinutes != null ? ' · '+tx('याद दिलाएँ ','Remind ')+escape(event.remindMinutes)+tx(' मिनट पहले',' min before') : '')+
          (event.notes ? ' · '+escape(event.notes) : '')+'</small></div>';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = tx('संपादित करें','Edit');
        button.onclick = () => openEditor('event',event);
        item.append(button);
        box.append(item);
      }
    }
    el('wcEmpty').hidden = !!list.length;
  }

  function scheduleReminder(event) {
    clearTimeout(reminders.get(event.id));
    reminders.delete(event.id);
    const when = Date.parse(event.date+'T'+event.time);
    const minutes = Math.max(0, Number(event.remindMinutes ?? 15));
    const delay = when - minutes*60000 - Date.now();
    const user = owner;
    if (!Number.isFinite(delay) || delay < -60000 || delay > 20*86400000) return;
    reminders.set(event.id,setTimeout(() => {
      reminders.delete(event.id);
      if (user !== uid() || owner !== user) return;
      const title = '📅 '+(event.title || tx('रिमाइंडर','Reminder'));
      const detail = event.date+' '+event.time+(event.notes ? ' · '+event.notes : '');
      if (window.Notification?.permission === 'granted') {
        try { new Notification(title,{body:detail,tag:'wc-'+event.id}); } catch (e) {}
      }
      toast(title);
      if (typeof showInAppBanner === 'function') showInAppBanner(title,detail);
    },Math.max(500,delay)));
  }

  async function allowNotifications() {
    if (!window.Notification) { toast(tx('इस ब्राउज़र में सूचनाएँ उपलब्ध नहीं हैं','Notifications are unavailable in this browser')); return; }
    const permission = await Notification.requestPermission();
    toast(permission === 'granted' ? tx('सूचनाएँ चालू हैं','Notifications enabled') :
      tx('ब्राउज़र की सेटिंग में सूचनाएँ चालू करें','Allow notifications in browser settings'));
  }

  async function loadEditor(kind, user, fresh = false) {
    const version = collectionRevision[kind];
    const [remote, draft] = await Promise.allSettled([
      fbGet(remotePath(kind)), fresh ? draftStorage('get',kind) : undefined
    ]);
    if (owner !== user || uid() !== user) return;
    if (remote.status === 'fulfilled' && version === collectionRevision[kind]) {
      const collection = cache(kind);
      collection.clear();
      for (const [key,row] of Object.entries(remote.value || {})) {
        if (row && typeof row === 'object' && key !== '_index') collection.set(key,{...row,id:key});
      }
      if (kind === 'event') {
        for (const timer of reminders.values()) clearTimeout(timer);
        reminders.clear();
        for (const event of events.values()) scheduleReminder(event);
      }
    }
    if (draft.value && !editors[kind]) openEditor(kind,draft.value,true);
    if (kind === 'note') drawNotes();
    else drawEvents();
  }

  function selectMode(next, save = true) {
    if (!['diary','notes','calendar'].includes(next)) return;
    if (mode !== next && save) {
      if (mode === 'diary') void flushDay();
      el('wdScroll').scrollTop = 0;
    }
    mode = next;
    for (const button of el('wdModeBar').children) {
      const selected = button.dataset.wdMode === mode;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',selected);
      el(button.getAttribute('aria-controls')).hidden = !selected;
    }
    if (save) rememberView();
    if (active) applyLanguage();
  }

  function reset(discard = false) {
    const previous = owner || window._fbAuth?.currentUser?.uid;
    const cleared = discard && previous ? draftStorage('clear','',null,previous) : Promise.resolve();
    owner = '';
    day = null;
    mode = 'diary';
    activation++;
    searchSequence++;
    editorLoads = null;
    clearTimeout(autoTimer);
    clearTimeout(copyTimer);
    loading.clear();
    pending.clear();
    notes.clear();
    events.clear();
    for (const timer of reminders.values()) clearTimeout(timer);
    reminders.clear();
    statusText.clear();
    setWorkspace(false);
    if (!el('tab-diary')) return cleared;
    for (const kind of ['note','event']) {
      closeEditor(kind,true);
      fields(kind,'Status').textContent = '';
    }
    for (const id of ['wdSlots','wdSearchResults','wnGrid','wcList']) el(id).replaceChildren();
    for (const id of ['wdDate','wdSearchInput','wnSearch','wdDocFrom','wdDocTo']) el(id).value = '';
    el('wdStatus').textContent = '';
    if (el('wdSearchResults')) el('wdSearchResults').hidden = true;
    return cleared;
  }

  async function render() {
    await window.__sectionsReady;
    if (!active || !el('wdDate')) return;
    const user = uid();
    if (!user) {
      reset();
      return;
    }
    if (owner && owner !== user) {
      reset();
      setWorkspace(true);
    }
    owner = user;
    const token = activation;
    const reentered = renderedVisit !== visit;
    renderedVisit = visit;
    const first = !editorLoads;
    if (first) {
      editorLoads = Promise.all(['note','event'].map(kind => loadEditor(kind,user,true)));
      for (const kind of ['note','event']) {
        for (const name of configs[kind].fields) {
          const field = fields(kind,name);
          field.oninput = field.onchange = () => recordEditor(kind);
        }
      }
      el('wnBody').onpaste = pasteText;
      el('wnBody').dataset.placeholder = tx('यहाँ नोट लिखें…','Write a note…');
      const view = await draftStorage('get','view');
      if (activation !== token || owner !== user || uid() !== user) return;
      selectMode(view?.mode || 'diary',false);
      await openDate(validDate(view?.date) ? view.date : localDate());
    } else if (day?.loaded) {
      showDayInfo(day.date);
      applyLanguage();
      if (reentered) {
        void openDate(day.date,true);
        editorLoads = Promise.all(['note','event'].map(kind => loadEditor(kind,user)));
      }
    } else if (!day) {
      selectMode(mode,false);
      await openDate(localDate());
    }
    if (activation !== token || owner !== user || uid() !== user) return;
    const date = day?.date || localDate();
    el('wdDocFrom').value ||= date;
    el('wdDocTo').value ||= date;
  }

  function background() {
    if (owner === uid() && owner) void flushDay();
  }
  window.addEventListener('pagehide',background);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) background();
    else if (active && day && owner === uid()) { viewport(); showDayInfo(day.date); }
  });

  Object.assign(window,{
    wdSetWorkspace:setWorkspace, wdResetWorkspace:reset, wdApplyLanguage:applyLanguage,
    renderWorkDiary:render, wdSetMode:selectMode, wdSave:() => flushDay(true),
    wdOnDateChange:() => openDate(el('wdDate').value, true),
    wdShiftDate:amount => {
      const date = parseDate(day?.date || localDate());
      date.setDate(date.getDate()+amount);
      return openDate(localDate(date));
    },
    wdNewToday:() => openDate(localDate(),true),
    wdRunSearch:search, wdClearSearch:() => {
      ++searchSequence;
      el('wdSearchInput').value = '';
      el('wdSearchResults').hidden = true;
      el('wdSearchResults').replaceChildren();
    },
    wdDownloadWord:downloadWord, wdPrint:() => { background(); window.print(); },
    wnOpenEditor:() => openEditor('note'), wnCloseEditor:() => closeEditor('note'),
    wnRenderList:drawNotes, wnSave:() => saveEditor('note'), wnDelete:() => deleteEditor('note'),
    wnFormat:command => {
      el('wnBody').focus();
      document.execCommand(command, false);
      recordEditor('note');
    },
    wcOpenEditor:() => openEditor('event'), wcCloseEditor:() => closeEditor('event'),
    wcSave:() => saveEditor('event'), wcDelete:() => deleteEditor('event'), wcRequestNotifPermission:allowNotifications
  });
})();
