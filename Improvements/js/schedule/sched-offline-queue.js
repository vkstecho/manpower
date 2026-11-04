/**
 * Man Power — Offline-first schedule edit queue (v3.2.6+)
 *
 * Queues cell-level schedule writes when offline / Firebase write fails.
 * Flushes automatically on online + after successful auth.
 * Does not change online happy-path behaviour.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mp_sched_offline_queue_v1';
  var MAX_ITEMS = 500;
  var _flushing = false;

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function _save(arr) {
    try {
      if (arr.length > MAX_ITEMS) arr = arr.slice(-MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('[offline-queue] save failed', e && e.message);
    }
  }

  function _id() {
    return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Enqueue a schedule cell write.
   * @param {{empId:string, date:string, shift:string, monthKey?:string, meta?:object}} item
   */
  function enqueueScheduleEdit(item) {
    if (!item || !item.empId || !item.date) return null;
    var q = _load();
    // Dedupe same emp+date — latest wins
    q = q.filter(function (x) {
      return !(x.empId === item.empId && x.date === item.date);
    });
    var entry = {
      id: _id(),
      empId: String(item.empId),
      date: String(item.date),
      shift: item.shift != null ? String(item.shift) : '',
      monthKey: item.monthKey || (item.date || '').slice(0, 7),
      meta: item.meta || null,
      ts: Date.now()
    };
    q.push(entry);
    _save(q);
    _updateBadge();
    try {
      if (typeof global.mpAnnounce === 'function') {
        global.mpAnnounce('Schedule change queued offline');
      }
    } catch (e) {}
    return entry.id;
  }

  function queueSize() {
    return _load().length;
  }

  function _updateBadge() {
    try {
      var n = queueSize();
      var el = document.getElementById('mpOfflineQueueBadge');
      if (!el) {
        if (!n) return;
        el = document.createElement('div');
        el.id = 'mpOfflineQueueBadge';
        el.setAttribute('role', 'status');
        el.style.cssText =
          'position:fixed;bottom:72px;right:12px;z-index:9998;background:#f97316;color:#fff;' +
          'font-size:12px;font-weight:700;padding:8px 12px;border-radius:20px;box-shadow:0 4px 12px rgba(0,0,0,.25);' +
          'cursor:pointer;display:none';
        el.addEventListener('click', function () {
          flushOfflineQueue();
        });
        document.body.appendChild(el);
      }
      if (n > 0) {
        el.style.display = 'block';
        el.textContent = '☁ ' + n + ' offline edit' + (n > 1 ? 's' : '') + ' — tap to sync';
      } else {
        el.style.display = 'none';
      }
    } catch (e) {}
  }

  /**
   * Flush queue using existing Firebase helpers if available.
   * Expects global fbUpdate / fbSet / saveSchedule path when online.
   */
  async function flushOfflineQueue() {
    if (_flushing) return { ok: false, reason: 'busy' };
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ok: false, reason: 'offline' };
    }
    var q = _load();
    if (!q.length) {
      _updateBadge();
      return { ok: true, flushed: 0 };
    }
    _flushing = true;
    var flushed = 0;
    var remaining = [];
    try {
      for (var i = 0; i < q.length; i++) {
        var item = q[i];
        try {
          var ok = await _writeOne(item);
          if (ok) flushed++;
          else remaining.push(item);
        } catch (err) {
          remaining.push(item);
        }
      }
      _save(remaining);
      _updateBadge();
      if (flushed && typeof global.toast === 'function') {
        global.toast('✅ Synced ' + flushed + ' offline schedule edit' + (flushed > 1 ? 's' : ''));
      }
      return { ok: true, flushed: flushed, remaining: remaining.length };
    } finally {
      _flushing = false;
    }
  }

  async function _writeOne(item) {
    // Prefer dedicated helper if app exposes one
    if (typeof global.applyOfflineScheduleEdit === 'function') {
      return !!(await global.applyOfflineScheduleEdit(item));
    }
    // Generic path: schedules/{monthKey}/{empId}/days or array style
    var monthKey = item.monthKey || (item.date || '').slice(0, 7);
    if (!monthKey || typeof global.fbUpdate !== 'function') return false;
    var day = parseInt((item.date || '').split('-')[2], 10);
    if (!day) return false;
    // Try common RTDB shapes used by ManPower
    try {
      // Shape A: schedules/{monthKey}/{empId}/{dayIndex0}
      var pathA = 'schedules/' + monthKey + '/' + item.empId + '/' + (day - 1);
      await global.fbUpdate(pathA, item.shift);
      return true;
    } catch (e1) {
      try {
        // Shape B: schedules/{monthKey}/{empId} object with day keys
        var pathB = 'schedules/' + monthKey + '/' + item.empId;
        var patch = {};
        patch[String(day)] = item.shift;
        patch[String(day - 1)] = item.shift;
        await global.fbUpdate(pathB, patch);
        return true;
      } catch (e2) {
        console.warn('[offline-queue] write failed', item, e2 && e2.message);
        return false;
      }
    }
  }

  /** Hook cell edits: call from schedule commit paths when offline. */
  function queueIfOffline(empId, date, shift, monthKey) {
    var offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (!offline) return false;
    enqueueScheduleEdit({ empId: empId, date: date, shift: shift, monthKey: monthKey });
    if (typeof global.toast === 'function') {
      global.toast('📴 Offline — change queued, will sync when online');
    }
    return true;
  }

  // Auto flush
  if (typeof window !== 'undefined') {
    window.addEventListener('online', function () {
      setTimeout(flushOfflineQueue, 800);
    });
    document.addEventListener('DOMContentLoaded', function () {
      _updateBadge();
      setTimeout(flushOfflineQueue, 2500);
    });
  }

  global.MP_OFFLINE_QUEUE = {
    enqueue: enqueueScheduleEdit,
    flush: flushOfflineQueue,
    size: queueSize,
    queueIfOffline: queueIfOffline
  };
  global.enqueueScheduleEdit = enqueueScheduleEdit;
  global.flushOfflineQueue = flushOfflineQueue;
  global.queueScheduleIfOffline = queueIfOffline;
})(typeof window !== 'undefined' ? window : globalThis);
