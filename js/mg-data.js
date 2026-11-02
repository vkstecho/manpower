/* FEATURE MODULE: data
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
// ========== Data Layer (Firebase primary + localStorage cache) ==========
MG.FB_ROOT = 'mentor_guidance';
MG.FB_INDEX = 'mentor_guidance_index';

MG.storageKey = function(mob) {
  return MG.STORAGE_PREFIX + mob;
}

MG.emptyUserData = function(mob) {
  return {
    mobile: mob,
    unlocked: {},
    payments: [],
    recordings: {},
    chats: {},
    updatedAt: Date.now()
  };
}

MG.loadUserData = function(mob) {
  // Sync cache from localStorage first (instant UI)
  try {
    const raw = localStorage.getItem(MG.storageKey(mob));
    if (raw) return JSON.parse(raw);
  } catch {}
  return MG.emptyUserData(mob);
}

MG.loadUserDataAsync = async function(mob) {
  // Local cache for instant UI — do NOT invent updatedAt until we know Firebase state
  var local = null;
  try {
    var raw = localStorage.getItem(MG.storageKey(mob));
    if (raw) local = JSON.parse(raw);
  } catch (e0) {}
  if (!local || typeof local !== 'object') {
    local = { mobile: mob, unlocked: {}, payments: [], recordings: {}, chats: {}, updatedAt: 0 };
  }
  MG.state.data = local;
  try {
    if (window.MentorFB && window.MentorFB.get) {
      // Prefer full user node; also try mentor_payments mirror
      var remote = await window.MentorFB.get(MG.FB_ROOT + '/' + mob);
      var remotePays = null;
      try { remotePays = await window.MentorFB.get('mentor_payments/' + mob); } catch (eP) {}
      if (remote && typeof remote === 'object') {
        var localTs = Number(local.updatedAt || 0);
        var remoteTs = Number(remote.updatedAt || 0);
        var localPayN = (local.payments && local.payments.length) || 0;
        var remotePayN = (remote.payments && remote.payments.length) || 0;
        // Prefer Firebase when: no local ts, remote is newer, OR local has fewer payments (admin device)
        var takeRemote = !localTs || remoteTs >= localTs || (remotePayN > localPayN);
        if (takeRemote) {
          MG.state.data = Object.assign({}, { mobile: mob, unlocked: {}, payments: [], recordings: {}, chats: {} }, remote, { mobile: mob });
          try { localStorage.setItem(MG.storageKey(mob), JSON.stringify(MG.state.data)); } catch (eS) {}
        }
      } else if (Array.isArray(remotePays) && remotePays.length) {
        // Recovery: payments mirror exists but full node missing
        MG.state.data.payments = remotePays;
        MG.state.data.updatedAt = Date.now();
        try { localStorage.setItem(MG.storageKey(mob), JSON.stringify(MG.state.data)); } catch (eS2) {}
      }
    }
  } catch (e) {
    console.warn('[Mentor] Firebase load failed', e.message || e);
  }
  return MG.state.data;
}

MG.saveUserData = function(mob, userData) {
  userData.updatedAt = Date.now();
  userData.mobile = mob;
  MG.state._lastLocalChatWrite = userData.updatedAt;
  try {
    localStorage.setItem(MG.storageKey(mob), JSON.stringify(userData));
  } catch (eL) {}
  // Returns a Promise so Approve/Reject can await Firebase write
  return (async function() {
    try {
      if (!window.MentorFB || !window.MentorFB.set) return false;
      await window.MentorFB.set(MG.FB_ROOT + '/' + mob, userData);
      if (mob !== MG.MENTOR_MOBILE) {
        await window.MentorFB.set(MG.FB_INDEX + '/' + mob, {
          mobile: mob,
          updatedAt: userData.updatedAt,
          paymentCount: (userData.payments || []).length,
          pendingCount: (userData.payments || []).filter(function(p){ return p && p.status === 'pending'; }).length
        });
        await window.MentorFB.set('mentor_payments/' + mob, userData.payments || []);
      }
      console.info('[Mentor] Firebase saved', mob);
      return true;
    } catch (e) {
      console.warn('[Mentor] Firebase save failed', e.message || e);
      return false;
    }
  })();
}

MG.mergeChatMaps = function(localChats, remoteChats) {
  const out = Object.assign({}, localChats || {});
  const remote = remoteChats || {};
  Object.keys(remote).forEach((topicId) => {
    const rem = Array.isArray(remote[topicId]) ? remote[topicId] : [];
    const loc = Array.isArray(out[topicId]) ? out[topicId] : [];
    const byId = new Map();
    loc.forEach((m) => { if (m && m.id) byId.set(m.id, m); });
    rem.forEach((m) => { if (m && m.id) byId.set(m.id, m); });
    const merged = Array.from(byId.values());
    merged.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    out[topicId] = merged;
  });
  return out;
}

MG.stopRealtime = function() {
  try { if (typeof MG.state._dataUnsub === 'function') MG.state._dataUnsub(); } catch (e) {}
  MG.state._dataUnsub = null;
}

/**
 * Realtime: listen to student's guidance node so mentor <-> student
 * messages appear without refresh.
 */
MG.startRealtimeFor = function(mob) {
  MG.stopRealtime();
  mob = String(mob || '').replace(/\D/g, '').slice(-10);
  if (!mob || !window.MentorFB || typeof window.MentorFB.listen !== 'function') {
    console.warn('[Mentor] Realtime unavailable — messages need refresh');
    return;
  }
  const path = MG.FB_ROOT + '/' + mob;
  MG.state._rtMobile = mob;
  MG.state._dataUnsub = window.MentorFB.listen(path, (remote) => {
    try {
      if (!remote || typeof remote !== 'object') return;
      const target = String(MG.state.viewingAs || MG.state.mobile || '').replace(/\D/g, '').slice(-10);
      // Only apply if we are still looking at this student
      if (String(mob) !== target && String(mob) !== String(MG.state.mobile || '').replace(/\D/g, '').slice(-10)) return;

      // Merge chats so concurrent mentor/student writes don't wipe each other
      const prevChats = (MG.state.data && MG.state.data.chats) || {};
      const mergedChats = MG.mergeChatMaps(prevChats, remote.chats || {});
      const prevSnap = JSON.stringify(prevChats);
      const nextSnap = JSON.stringify(mergedChats);

      // Pure echo of our own write with identical chats — skip UI churn
      if (prevSnap === nextSnap && remote.updatedAt && MG.state._lastLocalChatWrite &&
          Math.abs(Number(remote.updatedAt) - Number(MG.state._lastLocalChatWrite)) < 1200) {
        return;
      }

      // CRITICAL: use MG.emptyUserData (bare emptyUserData throws ReferenceError and kills the listener)
      MG.state.data = Object.assign({}, MG.emptyUserData(mob), remote, { mobile: mob, chats: mergedChats });
      try {
        localStorage.setItem(MG.storageKey(mob), JSON.stringify(MG.state.data));
      } catch (e) {}

      if (prevSnap !== nextSnap) {
        try {
          if (MG.state.currentTopicId && typeof MG.renderChat === 'function') {
            MG.renderChat();
            const box = document.getElementById('chatMessages');
            if (box) box.scrollTop = box.scrollHeight;
          }
        } catch (eR) { console.warn('[Mentor] renderChat', eR); }
      }
      // Refresh recordings if mentor added one
      try { if (MG.state.currentTopicId && typeof MG.renderRecordings === 'function') MG.renderRecordings(); } catch (e) {}
    } catch (eCb) {
      console.warn('[Mentor] realtime cb error', eCb && eCb.message);
    }
  });
  console.info('[Mentor] Realtime listening', path);
}

MG.getAllStudentMobiles = function() {
  // Sync from local cache first
  const list = new Set();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(MG.STORAGE_PREFIX)) {
        const m = k.replace(MG.STORAGE_PREFIX, '');
        if (/^[6-9]\d{9}$/.test(m) && m !== MG.MENTOR_MOBILE) list.add(m);
      }
    }
  } catch {}
  return Array.from(list).sort();
}

MG.getAllStudentMobilesAsync = async function() {
  const list = new Set(MG.getAllStudentMobiles());
  let fbOk = false;
  let fbError = null;
  try {
    if (window.MentorFB && window.MentorFB.get) {
      // 1) Dedicated index
      try {
        const index = await window.MentorFB.get(MG.FB_INDEX);
        fbOk = true;
        if (index && typeof index === 'object') {
          Object.keys(index).forEach(m => {
            if (/^[6-9]\d{9}$/.test(m) && m !== MG.MENTOR_MOBILE) list.add(m);
          });
        }
      } catch (e) {
        fbError = e;
        console.warn('[Mentor] index load failed', e.message || e);
      }
      // 2) Fallback: scan all mentor_guidance children
      try {
        const all = await window.MentorFB.get(MG.FB_ROOT);
        fbOk = true;
        if (all && typeof all === 'object') {
          Object.keys(all).forEach(m => {
            if (/^[6-9]\d{9}$/.test(m) && m !== MG.MENTOR_MOBILE) list.add(m);
          });
        }
      } catch (e) {
        fbError = e;
        console.warn('[Mentor] guidance root load failed', e.message || e);
      }
    } else {
      fbError = new Error('MentorFB not ready');
    }
  } catch (e) {
    fbError = e;
    console.warn('[Mentor] student list failed', e.message || e);
  }
  // stash status for UI toast
  window._mentorFbStatus = { ok: fbOk, error: fbError ? (fbError.message || String(fbError)) : null, count: list.size };
  return Array.from(list).sort();
}


})(window.MG = window.MG || {});

MG.listStoredMobiles = function() {
  var out = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      var m = (k.match(/(\d{10})/) || [])[1];
      if (m && out.indexOf(m) < 0) out.push(m);
    }
  } catch (e) {}
  return out;
};
MG.scanAllPaymentsFromStorage = function() {
  var bag = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('vks_mentor') < 0 && k.indexOf('mentor_user') < 0 && k.indexOf('mg_user') < 0) {
        // still try parse user blobs
      }
      try {
        var raw = localStorage.getItem(k);
        if (!raw || raw[0] !== '{') continue;
        var o = JSON.parse(raw);
        var pays = o.payments || (o.data && o.data.payments);
        if (!Array.isArray(pays) || !pays.length) continue;
        var mob = o.mobile || o.phone || (k.match(/(\d{10})/) || [])[1] || '';
        pays.forEach(function(p){ bag.push(Object.assign({}, p, { _mobile: String(mob || '') })); });
      } catch (e1) {}
    }
  } catch (e) {}
  return bag;
};
