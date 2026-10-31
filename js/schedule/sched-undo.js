/**
 * Ctrl+Z / Ctrl+Y for staged schedule changes (before Save).
 */
(function (global) {
  'use strict';

  var MAX = 50;
  var _undoStack = [];
  var _redoStack = [];
  var _batch = false;
  var _batchPushed = false;

  function _L(hi, en) {
    try {
      if (typeof L === 'function') return L(hi, en);
    } catch (e) {}
    return en || hi;
  }

  function _toast(msg) {
    try {
      if (typeof toast === 'function') toast(msg);
    } catch (e) {}
  }

  function _canEdit() {
    return typeof canEditSchedule !== 'function' || canEditSchedule();
  }

  function _getPending() {
    try {
      if (typeof _pendingShiftChanges !== 'undefined' && _pendingShiftChanges)
        return _pendingShiftChanges;
      if (global._pendingShiftChanges) return global._pendingShiftChanges;
    } catch (e) {}
    return null;
  }

  function _setPending(obj) {
    try {
      if (typeof _pendingShiftChanges !== 'undefined') {
        // clear in place then assign keys
        var p = _pendingShiftChanges;
        Object.keys(p).forEach(function (k) {
          delete p[k];
        });
        Object.keys(obj || {}).forEach(function (k) {
          p[k] = obj[k];
        });
        global._pendingShiftChanges = p;
        return;
      }
    } catch (e) {}
    try {
      global._pendingShiftChanges = obj || {};
    } catch (e2) {}
  }

  function _clonePending() {
    try {
      var p = _getPending() || {};
      return JSON.parse(JSON.stringify(p));
    } catch (e) {
      return {};
    }
  }

  function beginSchedUndoBatch() {
    _batch = true;
    _batchPushed = false;
  }

  function endSchedUndoBatch() {
    _batch = false;
    _batchPushed = false;
  }

  function pushSchedUndoSnapshot() {
    if (!_canEdit()) return;
    if (_batch) {
      if (_batchPushed) return;
      _batchPushed = true;
    }
    try {
      _undoStack.push(_clonePending());
      if (_undoStack.length > MAX) _undoStack.shift();
      _redoStack = [];
    } catch (e) {}
  }

  function clearSchedUndoHistory() {
    _undoStack = [];
    _redoStack = [];
  }

  function _refreshAfterUndo() {
    try {
      if (typeof _updateSaveBar === 'function') _updateSaveBar();
    } catch (e) {}
    try {
      if (typeof renderSchedule === 'function') renderSchedule();
    } catch (e) {}
    // re-apply pending visual markers after render
    setTimeout(function () {
      try {
        var p = _getPending() || {};
        Object.keys(p).forEach(function (key) {
          var e = p[key];
          if (!e) return;
          var cellEl =
            document.querySelector('td[data-cellkey="' + e.empId + '_' + e.date + '"]') ||
            document.querySelector(
              'td[data-empid="' + e.empId + '"][data-date="' + e.date + '"]'
            );
          if (!cellEl) return;
          cellEl.dataset.pending = key;
          cellEl.innerHTML =
            '<span class="shc ' +
            (typeof cellClass === 'function' ? cellClass(e.newShift) : '') +
            '" style="outline:2px solid var(--m1);border-radius:4px">' +
            (typeof cellDisp === 'function' ? cellDisp(e.newShift) : e.newShift) +
            '</span><div style="font-size:7px;color:var(--m1);text-align:center;font-weight:900">NEW</div>';
        });
      } catch (e) {}
    }, 40);
  }

  function undoSchedPending(ev) {
    if (ev) {
      try {
        ev.preventDefault();
      } catch (e) {}
    }
    if (!_canEdit()) return false;
    if (!_undoStack.length) {
      _toast(_L('↩️ Undo करने को कुछ नहीं', '↩️ Nothing to undo'));
      return false;
    }
    try {
      _redoStack.push(_clonePending());
      var prev = _undoStack.pop();
      _setPending(prev);
      _refreshAfterUndo();
      var n = Object.keys(prev || {}).length;
      _toast(
        _L('↩️ Undo — ', '↩️ Undo — ') +
          n +
          _L(' pending', ' pending')
      );
    } catch (e) {
      console.warn('[undo]', e);
    }
    return true;
  }

  function redoSchedPending(ev) {
    if (ev) {
      try {
        ev.preventDefault();
      } catch (e) {}
    }
    if (!_canEdit()) return false;
    if (!_redoStack.length) {
      _toast(_L('↪️ Redo करने को कुछ नहीं', '↪️ Nothing to redo'));
      return false;
    }
    try {
      _undoStack.push(_clonePending());
      var next = _redoStack.pop();
      _setPending(next);
      _refreshAfterUndo();
      var n = Object.keys(next || {}).length;
      _toast(
        _L('↪️ Redo — ', '↪️ Redo — ') +
          n +
          _L(' pending', ' pending')
      );
    } catch (e) {
      console.warn('[redo]', e);
    }
    return true;
  }

  function _isTypingTarget(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function _onKeyDown(e) {
    if (_isTypingTarget(e.target)) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    var k = (e.key || '').toLowerCase();
    // Ctrl+Z undo; Ctrl+Y or Ctrl+Shift+Z redo
    if (k === 'z' && !e.shiftKey) {
      if (document.getElementById('schedTbl') || document.getElementById('schedSaveBar')) {
        undoSchedPending(e);
      }
      return;
    }
    if (k === 'y' || (k === 'z' && e.shiftKey)) {
      if (document.getElementById('schedTbl') || document.getElementById('schedSaveBar')) {
        redoSchedPending(e);
      }
    }
  }

  function init() {
    document.addEventListener('keydown', _onKeyDown, true);
    try {
      global.pushSchedUndoSnapshot = pushSchedUndoSnapshot;
      global.beginSchedUndoBatch = beginSchedUndoBatch;
      global.endSchedUndoBatch = endSchedUndoBatch;
      global.clearSchedUndoHistory = clearSchedUndoHistory;
      global.undoSchedPending = undoSchedPending;
      global.redoSchedPending = redoSchedPending;
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
