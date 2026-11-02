/* FEATURE MODULE: history-mentor-admin
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
// ========== Payment History ==========
MG.openHistory = async function() {
  const container = MG.$('#historyContent');
  if (container) container.innerHTML = '<p class="text-center text-slate-400 py-10">Loading payments…</p>';
  MG.$('#historyModal')?.classList.remove('hidden');
  MG.$('#historyModal')?.classList.add('flex');

  const viewing = MG.state.viewingAs || null;
  let payments = [];

  async function pullMobile(m) {
    if (!m) return [];
    let list = [];
    try {
      const ud = await MG.loadUserDataAsync(m);
      list = ((ud && ud.payments) || []).map(function(p) {
        return Object.assign({}, p, { _mobile: m });
      });
    } catch (e) {}
    return list;
  }

  try {
    if (MG.state.isMentor && !viewing && window.MentorFB && window.MentorFB.get) {
      // 1) notifications queue (fast pending list)
      try {
        const notifs = await window.MentorFB.get('mentor_notifications/' + (MG.MENTOR_MOBILE || '8929397949'));
        if (notifs && typeof notifs === 'object') {
          Object.keys(notifs).forEach(function(id) {
            const n = notifs[id];
            if (!n) return;
            payments.push({
              id: n.id || id,
              topicTitle: n.topicTitle || 'Session',
              trackName: n.trackName || '',
              amount: n.amount || 0,
              hours: n.hours || 1,
              utr: n.utr || '',
              status: n.status || 'pending',
              ts: n.ts || 0,
              preferredSlot: n.preferredSlot || '',
              topicId: n.topicId || '',
              _mobile: String(n.studentMobile || n.mobile || '').replace(/\D/g, '').slice(-10)
            });
          });
        }
      } catch (eN) { console.warn('notif load', eN); }

      // 2) index of all students
      let mobiles = [];
      try {
        const index = await window.MentorFB.get(MG.FB_INDEX);
        if (index && typeof index === 'object') mobiles = Object.keys(index);
      } catch (eI) {}
      try {
        if (!mobiles.length) {
          const all = await window.MentorFB.get(MG.FB_ROOT);
          if (all && typeof all === 'object') mobiles = Object.keys(all);
        }
      } catch (eR) {}
      // local fallbacks
      try {
        if (typeof MG.listStoredMobiles === 'function') {
          MG.listStoredMobiles().forEach(function(m){ if (mobiles.indexOf(m) < 0) mobiles.push(m); });
        }
      } catch (eL) {}

      for (var i = 0; i < mobiles.length; i++) {
        var m = String(mobiles[i] || '').replace(/\D/g, '').slice(-10);
        if (!m || m.length !== 10) continue;
        var list = await pullMobile(m);
        list.forEach(function(p){ payments.push(p); });
      }
    } else {
      const targetMobile = viewing || MG.state.mobile;
      payments = await pullMobile(targetMobile);
    }
  } catch (eAgg) {
    console.warn('history fb', eAgg);
  }

  // de-dupe by id+mobile — prefer confirmed/rejected over pending/pay_intent
  const byKey = {};
  payments.forEach(function(p) {
    if (!p || !p.id) return;
    const k = String(p.id) + '|' + String(p._mobile || p.studentMobile || p.mobile || '');
    const rank = function(x) {
      if (!x) return 0;
      if (x.status === 'confirmed') return 3;
      if (x.status === 'rejected') return 2;
      if (x.status === 'pending' || x.status === 'pay_intent') return 1;
      return 0;
    };
    if (!byKey[k] || rank(p) > rank(byKey[k]) || (rank(p) === rank(byKey[k]) && (p.ts || 0) > (byKey[k].ts || 0))) {
      byKey[k] = p;
    }
  });
  payments = Object.keys(byKey).map(function(k){ return byKey[k]; })
    .sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });

  if (!payments.length) {
    container.innerHTML = '<p class="text-center text-slate-400 py-10">No payments yet' +
      (MG.state.isMentor && !viewing ? ' from any student' : ' for this mobile number') + '.</p>';
    return;
  }

  container.innerHTML = payments.map(function(p) {
    const targetMobile = p._mobile || p.studentMobile || p.mobile || MG.state.viewingAs || MG.state.mobile;
    const statusClass = p.status === 'confirmed'
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
      : (p.status === 'rejected'
        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300');
    let actionBtns = '';
    if (MG.state.isMentor && (p.status === 'pending' || p.status === 'pay_intent')) {
      actionBtns = '<div class="flex flex-wrap gap-1.5 mt-2">' +
        '<button class="approve-btn flex-1 min-w-[7rem] py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold" data-payid="' + p.id + '" data-mobile="' + targetMobile + '"><i class="fas fa-check mr-1"></i> Approve & Unlock</button>' +
        '<button class="reject-btn px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-xs font-semibold" data-payid="' + p.id + '" data-mobile="' + targetMobile + '">Reject</button>' +
        '<button class="wa-remind-btn px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-semibold" data-payid="' + p.id + '" data-mobile="' + targetMobile + '"><i class="fab fa-whatsapp"></i></button></div>';
    } else if (MG.state.isMentor) {
      actionBtns = '<button class="wa-remind-btn mt-2 w-full py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-semibold" data-payid="' + p.id + '" data-mobile="' + targetMobile + '"><i class="fab fa-whatsapp mr-1"></i> WhatsApp remind</button>';
    }
    return '<div class="hist-card">' +
      '<div class="flex items-start justify-between gap-2"><div>' +
      '<p class="font-semibold text-sm">' + MG.esc(p.topicTitle || 'Session') + '</p>' +
      '<p class="text-xs text-slate-500 mt-0.5">' + (p.trackName ? MG.esc(p.trackName) + ' · ' : '') + MG.formatDate(p.ts) + ' · ' + (p.hours || 1) + ' Hr</p></div>' +
      '<div class="text-right shrink-0"><p class="font-bold text-brand-600">₹' + Number(p.amount || 0).toLocaleString('en-IN') + '</p>' +
      '<span class="text-[10px] px-1.5 py-0.5 rounded font-medium ' + statusClass + '">' + MG.esc(p.status || 'pending') + '</span></div></div>' +
      '<p class="text-[11px] text-slate-500 mt-1">Mobile: +91 ' + MG.esc(String(targetMobile || '')) + '</p>' +
      '<p class="text-[11px] text-slate-400 mt-0.5 font-mono truncate">UTR: ' + MG.esc(p.utr || '') + '</p>' +
      (p.preferredSlot ? '<p class="text-[11px] text-slate-500 mt-0.5">Time pref: ' + MG.esc(p.preferredSlot) + '</p>' : '') +
      actionBtns + '</div>';
  }).join('');

  container.querySelectorAll('.approve-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { MG.approvePayment(btn.dataset.payid, btn.dataset.mobile); });
  });
  container.querySelectorAll('.reject-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { MG.rejectPayment(btn.dataset.payid, btn.dataset.mobile); });
  });
  container.querySelectorAll('.wa-remind-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { MG.copyWhatsAppReminder(btn.dataset.payid, btn.dataset.mobile); });
  });
}

MG.exportCsv = function() {
  const payments = MG.state.data.payments || [];
  if (!payments.length) {
    MG.showToast('No data to export');
    return;
  }
  const header = 'Date,Track,Topic,Focus,Hours,Rate,Amount,UTR,Status\n';
  const rows = payments.map(p =>
    `"${MG.formatDate(p.ts)}","${p.trackName||''}","${p.topicTitle}","${p.focusTopic||''}",${p.hours},${p.hourlyRate||''},${p.amount},"${p.utr}","${p.status}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `guidance_payments_${MG.state.mobile}.csv`;
  a.click();
  MG.showToast('CSV downloaded');
}

// ========== Mentor Mode (OTP Protected) ==========
MG.generateOTP = function() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

MG.requestMentorOTP = async function() {
  if (String(MG.state.mobile || '') !== MG.MENTOR_MOBILE) {
    MG.showToast('Mentor mode only for admin +91 ' + MG.MENTOR_MOBILE);
    return;
  }
  // Already signed in with Firebase as this admin number → unlock without new SMS
  try {
    var u = window.MentorFB && window.MentorFB.auth && window.MentorFB.auth.currentUser;
    var digits = u && u.phoneNumber ? String(u.phoneNumber).replace(/\D/g,'').slice(-10) : '';
    if (digits === MG.MENTOR_MOBILE) {
      MG.enableMentorMode();
      MG.showToast('Mentor unlocked (already verified on this device)');
      return;
    }
    // Parent Man Power Firebase user
    if (window.parent && window.parent !== window && window.parent._fbAuth && window.parent._fbAuth.currentUser) {
      var pu = window.parent._fbAuth.currentUser;
      var pd = pu.phoneNumber ? String(pu.phoneNumber).replace(/\D/g,'').slice(-10) : '';
      if (pd === MG.MENTOR_MOBILE) {
        MG.enableMentorMode();
        MG.showToast('Mentor unlocked via Man Power session');
        return;
      }
    }
  } catch (e) {}
  // Show OTP panel immediately so user always has an input UI
  try {
    var modal = document.getElementById('pinModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.zIndex = '9999';
    }
    var status = document.getElementById('mentorOtpStatus');
    if (status) status.textContent = 'Preparing secure OTP… complete captcha if shown, then wait for SMS.';
    var pin = document.getElementById('mentorPinInput');
    if (pin) { pin.value = ''; pin.placeholder = 'Enter 6-digit OTP'; }
  } catch (e) {}

  try {
    for (let w = 0; w < 30 && !(window.MentorFB && (window.MentorFB.sendOtp || window.MentorFB.sendPhoneOtp)); w++) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (!window.MentorFB || !(window.MentorFB.sendOtp || window.MentorFB.sendPhoneOtp)) {
      MG.showToast('Firebase not ready — close Mentor and open again');
      var st = document.getElementById('mentorOtpStatus');
      if (st) st.textContent = 'Firebase not ready. Close and reopen Mentor, then try again.';
      return;
    }
    MG.showToast('Sending OTP SMS to +91 ' + MG.MENTOR_MOBILE + '…');
    var st2 = document.getElementById('mentorOtpStatus');
    if (st2) st2.textContent = 'Sending SMS… If a captcha appears below, complete it. OTP will arrive on +91 ' + MG.MENTOR_MOBILE;
    const send = window.MentorFB.sendOtp || window.MentorFB.sendPhoneOtp;
    await send.call(window.MentorFB, MG.MENTOR_MOBILE);
    window._mentorUnlockOtpPending = true;
    if (st2) st2.textContent = 'OTP sent. Enter the 6-digit code from SMS.';
    MG.showToast('OTP sent by SMS to +91 ' + MG.MENTOR_MOBILE);
    try { document.getElementById('mentorPinInput')?.focus(); } catch (e) {}
  } catch (e) {
    console.warn('[mentor] requestMentorOTP', e);
    var msg = (e && e.message) ? e.message : 'Failed to send OTP SMS';
    MG.showToast(msg);
    var st3 = document.getElementById('mentorOtpStatus');
    if (st3) st3.textContent = msg + ' — try again in a few seconds.';
  }
}

MG.verifyMentorOTP = async function() {
  const entered = (MG.$('#mentorPinInput').value || '').trim();
  if (!/^[0-9]{6}$/.test(entered)) {
    MG.showToast('Enter the 6-digit OTP from SMS');
    return;
  }
  try {
    if (!window.MentorFB || !(window.MentorFB.confirmOtp || window.MentorFB.verifyPhoneOtp)) {
      MG.showToast('Firebase not ready');
      return;
    }
    const conf = window.MentorFB.confirmOtp || window.MentorFB.verifyPhoneOtp;
    await conf.call(window.MentorFB, entered);
    window._mentorUnlockOtpPending = false;
    try { localStorage.removeItem(MG.OTP_STORAGE_KEY); } catch (e) {}
    MG.$('#pinModal').classList.add('hidden');
    MG.$('#pinModal').classList.remove('flex');
    MG.enableMentorMode();
  } catch (e) {
    console.warn('[mentor] verifyMentorOTP', e);
    MG.showToast((e && e.message) ? e.message : 'Incorrect or expired OTP');
  }
}


MG.mentorModeDeviceKey = function(mob) {
  return MG.MENTOR_MODE_DEVICE_KEY + String(mob || MG.MENTOR_MOBILE);
}

MG.rememberMentorModeOnDevice = function(mob) {
  try {
    var payload = {
      mobile: String(mob || MG.MENTOR_MOBILE),
      at: Date.now(),
      expires: Date.now() + MG.MENTOR_MODE_DEVICE_TTL_MS
    };
    localStorage.setItem(MG.mentorModeDeviceKey(mob), JSON.stringify(payload));
    // Also mirror on parent Man Power origin when embedded (same device)
    try {
      if (window.parent && window.parent !== window && window.parent.localStorage) {
        window.parent.localStorage.setItem(MG.mentorModeDeviceKey(mob), JSON.stringify(payload));
      }
    } catch (e2) {}
  } catch (e) {}
}

MG.isMentorModeRememberedOnDevice = function(mob) {
  mob = String(mob || '');
  if (mob !== MG.MENTOR_MOBILE) return false;
  function read(store) {
    try {
      var raw = store.getItem(MG.mentorModeDeviceKey(mob));
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || String(o.mobile) !== mob) return false;
      if (o.expires && Date.now() > o.expires) {
        try { store.removeItem(MG.mentorModeDeviceKey(mob)); } catch (e) {}
        return false;
      }
      return true;
    } catch (e) { return false; }
  }
  if (read(localStorage)) return true;
  try {
    if (window.parent && window.parent !== window && window.parent.localStorage) {
      if (read(window.parent.localStorage)) {
        // copy into iframe storage for next time
        MG.rememberMentorModeOnDevice(mob);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

MG.clearMentorModeOnDevice = function(mob) {
  try { localStorage.removeItem(MG.mentorModeDeviceKey(mob || MG.MENTOR_MOBILE)); } catch (e) {}
  try {
    if (window.parent && window.parent !== window && window.parent.localStorage) {
      window.parent.localStorage.removeItem(MG.mentorModeDeviceKey(mob || MG.MENTOR_MOBILE));
    }
  } catch (e) {}
}

MG.enableMentorMode = function(opts) {
  opts = opts || {};
  MG.state.isMentor = true;
  MG.rememberMentorModeOnDevice(MG.state.mobile || MG.MENTOR_MOBILE);
  try {
    var pb = document.getElementById('pricingAdminBtn');
    if (pb && String(MG.state.mobile) === MG.MENTOR_MOBILE) {
      pb.classList.remove('hidden');
      pb.style.display = 'flex';
      pb.style.visibility = 'visible';
    }
  } catch (e) {}
  try {
    MG.$('#mentorBadge').classList.remove('hidden');
    MG.$('#mentorStudentBar').classList.remove('hidden');
  } catch (e) {}
  try { MG.refreshStudentList(); } catch (e) {}
  try { MG.renderCatalog(); } catch (e) {}
  try { MG.startMentorNotificationListen(); } catch (eN) {}
  if (!opts.silent) MG.showToast('Mentor mode enabled · remembered on this device');
}

MG.refreshStudentList = async function() {
  const sel = MG.$('#studentSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading students…</option>';
  const mobiles = await MG.getAllStudentMobilesAsync();
  sel.innerHTML = '<option value="">— My own view (Mentor) —</option>' +
    mobiles.map(m => `<option value="${m}">+91 ${m}</option>`).join('');
  if (MG.state.viewingAs) sel.value = MG.state.viewingAs;
  const st = window._mentorFbStatus || {};
  if (mobiles.length) {
    MG.showToast(mobiles.length + ' student(s) found');
  } else if (st.error) {
    var msg = String(st.error || '');
    if (/permission|denied/i.test(msg)) {
      MG.showToast('Student list needs Phone OTP login as +91 8929397949 (anonymous auth cannot read index)');
    } else {
      MG.showToast('Firebase: ' + msg + ' — check rules + Phone auth');
    }
  } else {
    MG.showToast('No students yet. After a student pays, tap Refresh List.');
  }
}

MG.switchStudent = async function(mob) {
  MG.state.viewingAs = mob || null;
  const target = MG.state.viewingAs || MG.state.mobile;
  MG.state.data = await MG.loadUserDataAsync(target);
  MG.startRealtimeFor(target);
  MG.$('#mobileDisplay').textContent = '+91 ' + target + (MG.state.viewingAs ? ' (viewing)' : '');
  if (MG.state.currentTopicId) {
    if (MG.state.data.unlocked[MG.state.currentTopicId] || MG.state.isMentor) {
      MG.openWorkspace(MG.state.currentTopicId);
    } else {
      MG.backToCatalog();
    }
  } else {
    MG.renderCatalog();
  }
}


MG.copyWhatsAppReminder = function(paymentId, studentMobile) {
  studentMobile = String(studentMobile || '').replace(/\D/g, '').slice(-10);
  var userData = MG.loadUserData(studentMobile);
  var pay = (userData.payments || []).find(function(p){ return p && p.id === paymentId; });
  if (!pay) {
    try {
      if (MG.state && MG.state.data && String(MG.state.data.mobile || '') === studentMobile) {
        userData = MG.state.data;
        pay = (userData.payments || []).find(function(p){ return p && p.id === paymentId; });
      }
    } catch (e) {}
  }
  if (!pay) { MG.showToast('Payment details not loaded — open history once'); return; }
  var text =
    'Namaste! Mentor (VKS Tech) here.\n' +
    'Regarding your session claim:\n' +
    'Track: ' + (pay.trackName || '') + '\n' +
    'Focus: ' + (pay.focusTopic || pay.topicTitle || '') + '\n' +
    'Hours: ' + pay.hours + ' · Amount: ₹' + pay.amount + '\n' +
    'UTR: ' + (pay.utr || '') + '\n' +
    'Preferred time: ' + (pay.preferredSlot || 'to confirm') + '\n' +
    'Status: ' + pay.status + '\n\n' +
    (pay.status === 'pending'
      ? 'Please confirm payment details or reply with correct UTR.'
      : 'Please confirm a convenient slot this week for our 1:1.');
  var url = 'https://wa.me/91' + studentMobile + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

MG.rejectPayment = async function(paymentId, studentMobile) {
  if (!MG.state.isMentor) return;
  if (!confirm('Reject this payment claim for +91' + studentMobile + '?')) return;
  studentMobile = String(studentMobile || '').replace(/\D/g, '').slice(-10);
  paymentId = String(paymentId || '');
  var userData = await MG.loadUserDataAsync(studentMobile);
  var pay = (userData.payments || []).find(function(p){ return p && p.id === paymentId; });
  // Recover from notification queue if student node missing
  if (!pay && window.MentorFB && window.MentorFB.get) {
    try {
      var notifs = await window.MentorFB.get('mentor_notifications/' + (MG.MENTOR_MOBILE || '8929397949'));
      var n = notifs && (notifs[paymentId] || null);
      if (n) {
        pay = {
          id: n.id || paymentId,
          topicId: n.topicId || '',
          topicTitle: n.topicTitle || 'Session',
          trackName: n.trackName || '',
          amount: n.amount || 0,
          hours: n.hours || 1,
          utr: n.utr || '',
          status: 'pending',
          mobile: studentMobile,
          studentMobile: studentMobile,
          preferredSlot: n.preferredSlot || '',
          ts: n.ts || Date.now()
        };
        userData.payments = userData.payments || [];
        userData.payments.unshift(pay);
      }
    } catch (eR) {}
  }
  if (!pay) { MG.showToast('Payment not found — refresh history'); return; }
  pay.status = 'rejected';
  await MG.saveUserData(studentMobile, userData);
  try {
    if (window.MentorFB && window.MentorFB.set) {
      await window.MentorFB.set('mentor_notifications/' + (MG.MENTOR_MOBILE || '8929397949') + '/' + paymentId, null);
    }
  } catch (e) {}
  await MG.openHistory();
  MG.showToast('Payment rejected');
};

// Mentor approves a pending payment → unlocks the topic
MG.approvePayment = async function(paymentId, studentMobile) {
  if (!MG.state.isMentor) return;
  studentMobile = String(studentMobile || '').replace(/\D/g, '').slice(-10);
  paymentId = String(paymentId || '');
  if (!studentMobile || !paymentId) {
    MG.showToast('Missing student mobile or payment id');
    return;
  }
  var userData = await MG.loadUserDataAsync(studentMobile);
  var pay = (userData.payments || []).find(function(p){ return p && p.id === paymentId; });

  // Fallback 1: dedicated payments mirror
  if (!pay && window.MentorFB && window.MentorFB.get) {
    try {
      var pays = await window.MentorFB.get('mentor_payments/' + studentMobile);
      if (Array.isArray(pays)) {
        pay = pays.find(function(p){ return p && p.id === paymentId; });
        if (pay) {
          userData.payments = pays;
        }
      }
    } catch (e1) {}
  }

  // Fallback 2: rebuild from mentor_notifications (UI already showed this)
  if (!pay && window.MentorFB && window.MentorFB.get) {
    try {
      var notifs2 = await window.MentorFB.get('mentor_notifications/' + (MG.MENTOR_MOBILE || '8929397949'));
      var n2 = notifs2 && (notifs2[paymentId] || null);
      if (n2) {
        pay = {
          id: n2.id || paymentId,
          topicId: n2.topicId || '',
          topicTitle: n2.topicTitle || 'Session',
          trackId: n2.trackId || '',
          trackName: n2.trackName || '',
          amount: n2.amount || 0,
          hours: n2.hours || 1,
          utr: n2.utr || '',
          status: 'pending',
          mobile: studentMobile,
          studentMobile: studentMobile,
          preferredSlot: n2.preferredSlot || '',
          focusTopic: n2.focusTopic || '',
          ts: n2.ts || Date.now()
        };
        userData.payments = userData.payments || [];
        userData.payments.unshift(pay);
      }
    } catch (e2) {}
  }

  if (!pay) {
    MG.showToast('Payment not found on Firebase — ask student to open app once');
    return;
  }

  pay.status = 'confirmed';
  userData.unlocked = userData.unlocked || {};
  if (pay.topicId) userData.unlocked[pay.topicId] = true;
  // Also unlock by track so workspace opens
  if (pay.trackId) userData.unlocked[pay.trackId] = true;

  var saved = await MG.saveUserData(studentMobile, userData);
  if (saved === false) {
    MG.showToast('Approved locally but Firebase write failed — check rules / re-login OTP');
  }

  try {
    if (window.MentorFB && window.MentorFB.set) {
      await window.MentorFB.set('mentor_notifications/' + (MG.MENTOR_MOBILE || '8929397949') + '/' + paymentId, null);
      await window.MentorFB.set(MG.FB_INDEX + '/' + studentMobile + '/lastPayment', {
        id: pay.id, status: 'confirmed', amount: pay.amount, ts: Date.now(), topicTitle: pay.topicTitle || ''
      });
    }
  } catch (e) {}

  if ((MG.state.viewingAs || MG.state.mobile) === studentMobile) {
    MG.state.data = userData;
  }
  try { MG.renderCatalog(); } catch (e) {}
  await MG.openHistory();
  MG.showToast('Payment approved & topic unlocked for +91' + studentMobile);
};



// ========== Mentor payment notifications ==========
MG.pulseMentorPaymentBadge = function() {
  try {
    var btn = document.getElementById('paymentHistoryBtn');
    if (!btn) return;
    btn.classList.add('ring-2', 'ring-amber-400');
    var dot = document.getElementById('mentorPayDot');
    if (!dot) {
      dot = document.createElement('span');
      dot.id = 'mentorPayDot';
      dot.className = 'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500';
      btn.style.position = 'relative';
      btn.appendChild(dot);
    }
    dot.classList.remove('hidden');
  } catch (e) {}
};

MG.startMentorNotificationListen = function() {
  if (!window.MentorFB || typeof window.MentorFB.listen !== 'function') return;
  var m = MG.MENTOR_MOBILE || '8929397949';
  try {
    if (MG._notifUnsub) MG._notifUnsub();
  } catch (e) {}
  try {
    MG._notifUnsub = window.MentorFB.listen('mentor_notifications/' + m, function(val) {
      if (!val || typeof val !== 'object') return;
      var pending = Object.keys(val).filter(function(k){ return val[k] && val[k].read === false; });
      if (!pending.length) return;
      if (!MG.state.isMentor) return;
      MG.pulseMentorPaymentBadge();
      var last = val[pending[pending.length - 1]];
      if (last && last.studentMobile) {
        var kind = (last.type === 'pay_clicked' || last.status === 'pay_intent' || last.source === 'pay_clicked')
          ? 'Student tapped Pay' : 'Payment pending';
        MG.showToast(kind + ' · +91' + last.studentMobile + ' · ₹' + (last.amount || '') + ' — Approve in Payments', 6000);
      }
    });
  } catch (e2) { console.warn('[notif]', e2); }
};


})(window.MG = window.MG || {});
