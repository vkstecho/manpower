/* FEATURE MODULE: workspace-chat
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
// ========== Workspace ==========
MG.openWorkspace = function(topicId) {
  // SECURITY: Only allow entry if topic is unlocked OR user is mentor
  const isUnlocked = !!(MG.state.data && MG.state.data.unlocked && MG.state.data.unlocked[topicId]);
  if (!isUnlocked && !MG.state.isMentor) {
    MG.showToast('This topic is locked. Please pay & wait for Mentor approval.');
    return;
  }

  MG.state.currentTopicId = topicId;
  const topic = MG.TOPICS.find(t => t.id === topicId);
  MG.$('#wsTopicTitle').textContent = topic.title;
  MG.$('#catalogView').classList.add('hidden');
  MG.$('#workspaceView').classList.remove('hidden');

  // show add-recording form for mentor or if unlocked
  const canAdd = MG.state.isMentor || isUnlocked;
  MG.$('#addRecordingForm').classList.toggle('hidden', !canAdd);

  MG.renderRecordings(); try{MG.renderSessionChecklist();}catch(eCL){};
  MG.renderChat();
}

MG.backToCatalog = function() {
  MG.state.currentTopicId = null;
  MG.$('#workspaceView').classList.add('hidden');
  MG.$('#catalogView').classList.remove('hidden');
  MG.renderCatalog();
}

MG.renderRecordings = function() {
  const list = MG.state.data.recordings[MG.state.currentTopicId] || [];
  MG.$('#recordingCount').textContent = list.length + ' recording' + (list.length !== 1 ? 's' : '');
  const container = MG.$('#recordingsList');
  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No recordings yet. Flow: Book hours → Pay Razorpay → Submit UTR → Mentor approves → Session → Recording appears here.</p>`;
    return;
  }

  list.forEach((rec, idx) => {
    const el = document.createElement('div');
    el.className = 'rec-item';
    el.innerHTML = `
      <div class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center shrink-0">
        <i class="fab fa-youtube"></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium truncate">${MG.esc(rec.title)}</p>
        <p class="text-[10px] text-slate-400">${MG.formatDate(rec.ts)}</p>
      </div>
    `;
    el.addEventListener('click', () => MG.playRecording(rec, el));
    container.appendChild(el);
    if (idx === 0) MG.playRecording(rec, el);
  });
}

MG.playRecording = function(rec, el) {
  MG.$$('.rec-item').forEach(r => r.classList.remove('active'));
  if (el) el.classList.add('active');
  const vid = MG.youtubeId(rec.url);
  const wrap = MG.$('#videoPlayerWrap');
  if (vid) {
    wrap.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${vid}?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    wrap.innerHTML = `<div class="text-center text-slate-400 p-6"><p class="text-sm">Invalid or unsupported video URL</p><a href="${MG.esc(rec.url)}" target="_blank" class="text-brand-500 text-xs underline mt-1 inline-block">Open link</a></div>`;
  }
}

MG.addRecording = function() {
  const title = (MG.$('#recTitle').value || '').trim();
  const url = (MG.$('#recUrl').value || '').trim();
  const notes = (MG.$('#recNotes').value || '').trim();
  if (!title || !url) {
    MG.showToast('Title and YouTube URL required');
    return;
  }
  const targetMobile = MG.state.viewingAs || MG.state.mobile;
  const userData = MG.loadUserData(targetMobile);
  if (!userData.recordings[MG.state.currentTopicId]) userData.recordings[MG.state.currentTopicId] = [];
  userData.recordings[MG.state.currentTopicId].unshift({
    id: 'rec_' + Date.now(),
    title, url, notes, ts: Date.now()
  });
  MG.saveUserData(targetMobile, userData);
  if (targetMobile === (MG.state.viewingAs || MG.state.mobile)) MG.state.data = userData;
  MG.$('#recTitle').value = '';
  MG.$('#recUrl').value = '';
  MG.$('#recNotes').value = '';
  MG.renderRecordings(); try{MG.renderSessionChecklist();}catch(eCL){};
  MG.showToast('Recording added');
}

// ========== Chat ==========
MG.renderChat = function() {
  const msgs = MG.state.data.chats[MG.state.currentTopicId] || [];
  const box = MG.$('#chatMessages');
  box.innerHTML = '';
  if (!msgs.length) {
    box.innerHTML = `<p class="text-sm text-slate-400 text-center py-8">No messages yet. Log your practice or ask a doubt!</p>`;
    return;
  }
  msgs.forEach(m => {
    const div = document.createElement('div');
    const isMe = m.from === 'student' || m.from === MG.state.mobile;
    div.className = `chat-bubble ${isMe ? 'me' : 'them'}`;
    div.innerHTML = `${MG.esc(m.text)}<div class="chat-meta">${MG.formatDate(m.ts)}${m.from === 'mentor' ? ' • Mentor' : ''}</div>`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

MG.sendChat = async function() {
  const text = (MG.$('#chatInput').value || '').trim();
  if (!text) return;
  const targetMobile = String(MG.state.viewingAs || MG.state.mobile || '').replace(/\D/g, '').slice(-10);
  if (!targetMobile || !MG.state.currentTopicId) return;

  // Prefer in-memory state (already merged by realtime), else pull Firebase
  let userData = null;
  if (MG.state.data && String(MG.state.data.mobile || '').replace(/\D/g, '').slice(-10) === targetMobile) {
    try { userData = JSON.parse(JSON.stringify(MG.state.data)); } catch (e) { userData = null; }
  }
  if (!userData) {
    try { userData = await MG.loadUserDataAsync(targetMobile); } catch (e) {
      userData = MG.loadUserData(targetMobile);
    }
  }
  userData.chats = userData.chats || {};
  if (!userData.chats[MG.state.currentTopicId]) userData.chats[MG.state.currentTopicId] = [];

  const from = (MG.state.isMentor && MG.state.viewingAs) ? 'mentor' : 'student';
  const msg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    text: text,
    from: from,
    ts: Date.now()
  };
  userData.chats[MG.state.currentTopicId].push(msg);

  // Optimistic UI
  MG.state.data = userData;
  try { MG.$('#chatInput').value = ''; } catch (e) {}
  try { MG.renderChat(); } catch (e) {}
  try {
    const box = document.getElementById('chatMessages');
    if (box) box.scrollTop = box.scrollHeight;
  } catch (e) {}

  await MG.saveUserData(targetMobile, userData);
  // Ensure listener is on this student so the other side's replies arrive live
  try { MG.startRealtimeFor(targetMobile); } catch (e) {}

  // optional WhatsApp sync (student → mentor contact 8929394920)
  try {
    var syncEl = MG.$('#syncWhatsApp');
    if (syncEl && syncEl.checked && from === 'student') {
      const topic = MG.TOPICS.find(t => t.id === MG.state.currentTopicId);
      const wa = encodeURIComponent(
        '💬 Doubt/Progress from +91' + targetMobile +
        '\nTopic: ' + ((topic && topic.title) || MG.state.currentTopicId) +
        '\n\n' + text
      );
      window.open('https://wa.me/' + MG.WHATSAPP_NUMBER + '?text=' + wa, '_blank');
    }
  } catch (eW) {}
}




MG.DEFAULT_SESSION_CHECKLIST = {
  career_ai: [
    'Share current role + goal for this track',
    'Agree 1–2 focus topics for next session',
    'Practice prompt / Excel homework (if assigned)',
    'Update LinkedIn or portfolio note (optional)',
    'Book next hour when ready'
  ],
  packaging: [
    'Share plant process + bottleneck description',
    'Send sample data (yield / capacity / roster) if needed',
    'Apply one formula or SOP from the session',
    'Note open actions for shop floor',
    'Book follow-up for deep dive'
  ]
};

MG.renderSessionChecklist = function() {
  var el = document.getElementById('sessionChecklist');
  if (!el) return;
  var tid = MG.state.currentTopicId;
  var unlocked = MG.state.data && MG.state.data.unlocked && tid && MG.state.data.unlocked[tid];
  if (!unlocked && !MG.state.isMentor) {
    el.innerHTML = '';
    return;
  }
  var trackId = MG.selectedTrackId || 'career_ai';
  // Prefer track from last payment on this topic
  try {
    var pays = (MG.state.data && MG.state.data.payments) || [];
    var hit = pays.find(function (p) { return p.topicId === tid && p.trackId; });
    if (hit && hit.trackId) trackId = hit.trackId;
  } catch (e) {}
  var items = (MG.DEFAULT_SESSION_CHECKLIST[trackId] || MG.DEFAULT_SESSION_CHECKLIST.career_ai).slice();
  var key = 'checklist_' + (MG.state.viewingAs || MG.state.mobile) + '_' + (tid || 'x');
  var done = {};
  try { done = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e2) { done = {}; }
  el.innerHTML = '<div class="p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80">' +
    '<div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Session checklist</div>' +
    items.map(function (text, i) {
      var id = 'c' + i;
      var checked = done[id] ? 'checked' : '';
      return '<label class="flex items-start gap-2 text-sm py-1 cursor-pointer">' +
        '<input type="checkbox" data-check-id="' + id + '" class="mt-1 session-check" ' + checked + ' />' +
        '<span>' + MG.esc(text) + '</span></label>';
    }).join('') + '</div>';
  el.querySelectorAll('.session-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      done[cb.getAttribute('data-check-id')] = !!cb.checked;
      try { localStorage.setItem(key, JSON.stringify(done)); } catch (e3) {}
    });
  });
};


MG.openPricingAdmin = function() {
  try {
    if (String(MG.state.mobile) !== MG.MENTOR_MOBILE || !MG.state.isMentor) {
      MG.showToast('Admin mentor mode only (+91 ' + MG.MENTOR_MOBILE + ')');
      return;
    }
    var openModal = function () {
      var host = document.getElementById('pricingAdminFields');
      if (!host) {
        MG.showToast('Pricing form not found');
        return;
      }
      var playVal = String(MG._playStoreUrl || '').replace(/"/g, '&quot;');
      host.innerHTML = '<div class="p-3 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2 bg-amber-50/60 dark:bg-amber-900/20">' +
        '<div class="font-bold text-sm">How to set Razorpay</div>' +
        '<ol class="text-[11px] text-slate-600 dark:text-slate-300 list-decimal pl-4 space-y-1">' +
        '<li>In Razorpay → Payment Links: create a link for the amount (e.g. ₹699 / ₹799).</li>' +
        '<li><b>Important:</b> turn ON <b>“Accept multiple payments from a single link”</b> (or create a fresh link after each student pays). A one-time link shows <b>Payment Completed</b> and blocks the next student.</li>' +
        '<li>Copy the link (<code>rzp.io/...</code>) and paste below per track.</li>' +
        '<li>Change <b>hourly rate</b> anytime — booking total recalculates. Link can be a fixed-amount page matching that rate × hours, or one general link.</li>' +
        '<li>Save → all students see new rates &amp; Pay button uses new links.</li>' +
        '</ol></div>' +
        '<div class="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2 bg-emerald-50/50 dark:bg-emerald-900/20">' +
        '<div class="font-bold text-sm">Play Store link (optional)</div>' +
        '<label class="text-xs block">URL<input type="url" id="adminPlayStoreUrl" class="form-input text-sm mt-1" placeholder="https://play.google.com/store/apps/details?id=..." value="' + playVal + '" /></label>' +
        '</div>' + Object.keys(MG.TRACKS).map(function (id) {
        var tr = MG.TRACKS[id];
        var d3 = (tr.packageDisc && tr.packageDisc['3'] != null) ? tr.packageDisc['3'] : 5;
        var d5 = (tr.packageDisc && tr.packageDisc['5'] != null) ? tr.packageDisc['5'] : 10;
        var r = Number(tr.hourlyRate) || 0;
        return '<div class="p-3 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2" data-admin-track="' + id + '">' +
          '<div class="font-bold text-sm flex items-center justify-between gap-2"><span>' + MG.esc(tr.name) + '</span><span class="text-[10px] font-mono text-slate-400">' + id + '</span></div>' +
          '<label class="text-xs block">Hourly rate (₹)<input type="number" class="form-input text-sm admin-rate mt-1" value="' + r + '" min="1" step="1" /></label>' +
          '<p class="text-[10px] text-slate-500 admin-preview">1h ≈ ₹' + r.toLocaleString('en-IN') +
          ' · 3h (−' + d3 + '%) ≈ ₹' + Math.round(r * 3 * (1 - d3 / 100)).toLocaleString('en-IN') +
          ' · 5h (−' + d5 + '%) ≈ ₹' + Math.round(r * 5 * (1 - d5 / 100)).toLocaleString('en-IN') + '</p>' +
          '<label class="text-xs block">Razorpay payment link<input type="url" class="form-input text-sm admin-link mt-1" value="' + MG.esc(tr.paymentLink || '') + '" placeholder="https://rzp.io/rzp/..." /></label>' +
          '<p class="text-[10px] text-slate-400">Paste any Razorpay Payment Link / Page URL for this track. Students tap “Pay Now” → this URL.</p>' +
          '<div class="grid grid-cols-2 gap-2">' +
          '<label class="text-xs block">3h discount %<input type="number" class="form-input text-sm admin-d3 mt-1" value="' + d3 + '" min="0" max="90" /></label>' +
          '<label class="text-xs block">5h discount %<input type="number" class="form-input text-sm admin-d5 mt-1" value="' + d5 + '" min="0" max="90" /></label>' +
          '</div>' +
          '<label class="text-xs block">Suggested topics (one per line)<textarea class="form-input text-sm admin-topics mt-1" rows="4">' + MG.esc((tr.topics || []).join('\n')) + '</textarea></label>' +
          '</div>';
      }).join('');
      var modal = document.getElementById('pricingAdminModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
      }
      host.querySelectorAll('.admin-rate, .admin-d3, .admin-d5').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var box = inp.closest('[data-admin-track]');
          if (!box) return;
          var rate = parseInt(box.querySelector('.admin-rate').value, 10) || 0;
          var d3v = parseInt(box.querySelector('.admin-d3').value, 10) || 0;
          var d5v = parseInt(box.querySelector('.admin-d5').value, 10) || 0;
          var prev = box.querySelector('.admin-preview');
          if (prev) prev.textContent = '1h ≈ ₹' + rate.toLocaleString('en-IN') +
            ' · 3h (−' + d3v + '%) ≈ ₹' + Math.round(rate * 3 * (1 - d3v / 100)).toLocaleString('en-IN') +
            ' · 5h (−' + d5v + '%) ≈ ₹' + Math.round(rate * 5 * (1 - d5v / 100)).toLocaleString('en-IN');
        });
      });
    };
    var p = MG.loadTrackSettings();
    if (p && typeof p.then === 'function') {
      p.then(openModal).catch(function () { openModal(); });
    } else {
      openModal();
    }
  } catch (err) {
    console.error('[openPricingAdmin]', err);
    MG.showToast('Could not open rates: ' + (err && err.message ? err.message : 'error'));
  }
}

MG.savePricingAdmin = async function() {
  if (String(MG.state.mobile) !== MG.MENTOR_MOBILE) return;
  var payload = {};
  document.querySelectorAll('[data-admin-track]').forEach(function (box) {
    var id = box.getAttribute('data-admin-track');
    var rate = parseInt(box.querySelector('.admin-rate').value, 10) || MG.DEFAULT_TRACKS[id].hourlyRate;
    var link = (box.querySelector('.admin-link').value || '').trim();
    var d3 = parseInt(box.querySelector('.admin-d3').value, 10) || 0;
    var d5 = parseInt(box.querySelector('.admin-d5').value, 10) || 0;
    var topics = (box.querySelector('.admin-topics').value || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    payload[id] = {
      name: MG.DEFAULT_TRACKS[id].name,
      hourlyRate: rate,
      paymentLink: link || MG.DEFAULT_TRACKS[id].paymentLink,
      packageDisc: { '1': 0, '3': d3, '5': d5 },
      topics: topics.length ? topics : MG.DEFAULT_TRACKS[id].topics
    };
    MG.TRACKS[id] = Object.assign({}, MG.DEFAULT_TRACKS[id], payload[id]);
  });
  try {
    var playEl = document.getElementById('adminPlayStoreUrl');
    var playUrl = playEl ? String(playEl.value || '').trim() : '';
    MG._playStoreUrl = playUrl;
    if (window.MentorFB && window.MentorFB.set) {
      await window.MentorFB.set('mentor_settings/app', { playStoreUrl: playUrl });
      MG.refreshPlayStoreButton();
    }
    if (window.MentorFB && window.MentorFB.set) {
      await window.MentorFB.set('mentor_settings/tracks', payload);
      MG.showToast('Pricing saved to Firebase');
    } else {
      MG.showToast('Saved locally only (Firebase not ready)');
    }
  } catch (e) {
    var em = (e && e.message) ? String(e.message) : 'Save failed';
    if (/permission|PERMISSION_DENIED|denied/i.test(em)) {
      em = 'Permission denied: login with Phone OTP as +91 8929397949 (not anonymous) then Save rates again. Also deploy database.rules.json.';
    }
    MG.showToast(em);
  }
  MG.refreshTrackRateLabels();
  try { if (typeof MG.updatePayLink === 'function') MG.updatePayLink(); } catch (e0) {}
  var modal = document.getElementById('pricingAdminModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
  }
  // Return to catalog home (category picker)
  try {
    var ws = document.getElementById('workspaceView');
    if (ws) ws.classList.add('hidden');
    var cat = document.getElementById('catalogView') || document.querySelector('#app section');
    if (typeof MG.showCategory === 'function') MG.showCategory(null);
    if (typeof MG.renderCatalog === 'function') MG.renderCatalog();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e1) {}
  } catch (e2) {}
}


window.openPricingAdmin = MG.openPricingAdmin;
window.savePricingAdmin = MG.savePricingAdmin;
})(window.MG = window.MG || {});
