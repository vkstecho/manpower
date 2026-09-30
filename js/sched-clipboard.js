/**
 * Schedule grid Excel-like Copy / Paste (Ctrl+C / Ctrl+V, Cmd on Mac)
 * - Multi-select: copy a block
 * - Paste into many cells (same shape) OR into a single cell (origin = top-left of block)
 * - Also uses last-clicked schedule cell as origin if nothing is multi-selected
 */
(function (global) {
  'use strict';

  var _msClipboard = null;
  /** Last clicked schedule cell { empId, date } — enables paste on one cell without multi-select */
  var _msPasteAnchor = null;

  function _canEdit() {
    return typeof canEditSchedule !== 'function' || canEditSchedule();
  }

  function _toast(msg) {
    try {
      if (typeof toast === 'function') toast(msg);
    } catch (e) {}
  }

  function _L(hi, en) {
    try {
      if (typeof L === 'function') return L(hi, en);
    } catch (e) {}
    return en || hi;
  }

  function _empOrderFromTable() {
    var tbl = document.getElementById('schedTbl');
    if (!tbl) return [];
    var order = [];
    var seen = Object.create(null);
    var cells = tbl.querySelectorAll('td[data-empid]');
    for (var i = 0; i < cells.length; i++) {
      var id = cells[i].getAttribute('data-empid');
      if (id && !seen[id]) {
        seen[id] = true;
        order.push(id);
      }
    }
    return order;
  }

  /** Visible date columns in left→right order (from first data row) */
  function _dateOrderFromTable() {
    var tbl = document.getElementById('schedTbl');
    if (!tbl) return [];
    var dates = [];
    var seen = Object.create(null);
    // Prefer first body row with data-date cells for column order
    var rows = tbl.querySelectorAll('tr');
    for (var r = 0; r < rows.length; r++) {
      var tds = rows[r].querySelectorAll('td[data-date]');
      if (tds.length < 2) continue;
      for (var c = 0; c < tds.length; c++) {
        var d = tds[c].getAttribute('data-date');
        if (d && !seen[d]) {
          seen[d] = true;
          dates.push(d);
        }
      }
      if (dates.length) return dates;
    }
    // Fallback: any cells
    var all = tbl.querySelectorAll('td[data-date]');
    for (var i = 0; i < all.length; i++) {
      var dd = all[i].getAttribute('data-date');
      if (dd && !seen[dd]) {
        seen[dd] = true;
        dates.push(dd);
      }
    }
    return dates;
  }

  function _parseSelection() {
    var set = global._msSelected;
    if (!set || !set.size) return null;
    var empOrder = _empOrderFromTable();
    var empIndex = Object.create(null);
    for (var i = 0; i < empOrder.length; i++) empIndex[empOrder[i]] = i;

    var pairs = [];
    set.forEach(function (key) {
      var parts = String(key).split('|');
      if (parts.length >= 2) pairs.push({ empId: parts[0], date: parts[1], key: key });
    });
    if (!pairs.length) return null;

    var empIds = [];
    var empSeen = Object.create(null);
    pairs
      .slice()
      .sort(function (a, b) {
        var ia = empIndex[a.empId];
        var ib = empIndex[b.empId];
        if (ia == null) ia = 99999;
        if (ib == null) ib = 99999;
        if (ia !== ib) return ia - ib;
        return String(a.date).localeCompare(String(b.date));
      })
      .forEach(function (p) {
        if (!empSeen[p.empId]) {
          empSeen[p.empId] = true;
          empIds.push(p.empId);
        }
      });

    var dateOrder = _dateOrderFromTable();
    var dateIndex = Object.create(null);
    for (var di = 0; di < dateOrder.length; di++) dateIndex[dateOrder[di]] = di;

    var dateSet = Object.create(null);
    pairs.forEach(function (p) {
      dateSet[p.date] = true;
    });
    var dates = Object.keys(dateSet).sort(function (a, b) {
      var ia = dateIndex[a];
      var ib = dateIndex[b];
      if (ia != null && ib != null) return ia - ib;
      return String(a).localeCompare(String(b));
    });

    return { pairs: pairs, empIds: empIds, dates: dates };
  }

  function _shiftAt(empId, date) {
    try {
      if (typeof getEmps === 'function' && typeof getShift === 'function') {
        var emp = getEmps().find(function (e) {
          return e && e.id === empId;
        });
        if (emp) return String(getShift(emp, date) || '');
      }
    } catch (e) {}
    var td = document.querySelector(
      'td[data-empid="' + CSS.escape(empId) + '"][data-date="' + CSS.escape(date) + '"]'
    );
    if (!td) {
      td = document.querySelector('td[data-empid="' + empId + '"][data-date="' + date + '"]');
    }
    if (td) {
      return String((td.getAttribute('data-origsh') || td.textContent || '').trim());
    }
    return '';
  }

  function _setAnchorFromTd(td) {
    if (!td) return;
    var empId = td.getAttribute('data-empid');
    var date = td.getAttribute('data-date');
    if (empId && date) {
      _msPasteAnchor = { empId: empId, date: date };
      global._msPasteAnchor = _msPasteAnchor;
    }
  }

  function _resolveOrigin() {
    var sel = _parseSelection();
    if (sel && sel.empIds.length && sel.dates.length) {
      return { empId: sel.empIds[0], date: sel.dates[0], from: 'selection' };
    }
    if (_msPasteAnchor && _msPasteAnchor.empId && _msPasteAnchor.date) {
      return { empId: _msPasteAnchor.empId, date: _msPasteAnchor.date, from: 'anchor' };
    }
    // Focused cell
    try {
      var active = document.activeElement;
      if (active && active.closest) {
        var td = active.closest('td[data-empid][data-date]');
        if (td) {
          _setAnchorFromTd(td);
          return { empId: td.getAttribute('data-empid'), date: td.getAttribute('data-date'), from: 'focus' };
        }
      }
    } catch (e) {}
    return null;
  }

  function copySchedSelection(ev) {
    if (ev) {
      try {
        ev.preventDefault();
      } catch (e) {}
    }
    if (!_canEdit()) {
      _toast(_L('❌ Edit permission नहीं', '❌ No edit permission'));
      return false;
    }
    var sel = _parseSelection();
    // Allow copy of single focused/anchor cell if no multi-select
    if (!sel) {
      var origin = _resolveOrigin();
      if (origin) {
        sel = {
          pairs: [{ empId: origin.empId, date: origin.date, key: origin.empId + '|' + origin.date }],
          empIds: [origin.empId],
          dates: [origin.date],
        };
      }
    }
    if (!sel) {
      _toast(_L('⚠️ पहले cell चुनें', '⚠️ Select a cell first'));
      return false;
    }

    var matrix = [];
    var flat = [];
    for (var r = 0; r < sel.empIds.length; r++) {
      var row = [];
      for (var c = 0; c < sel.dates.length; c++) {
        var key = sel.empIds[r] + '|' + sel.dates[c];
        var selected =
          (global._msSelected && global._msSelected.has(key)) ||
          (sel.pairs.length === 1 && sel.pairs[0].key === key);
        var sh = selected ? _shiftAt(sel.empIds[r], sel.dates[c]) : '';
        row.push(sh);
        if (selected && sh !== '') flat.push(sh);
        else if (selected) flat.push(sh);
      }
      matrix.push(row);
    }

    _msClipboard = {
      matrix: matrix,
      empIds: sel.empIds.slice(),
      dates: sel.dates.slice(),
      flat: flat,
      at: Date.now(),
    };
    global._msClipboard = _msClipboard;

    try {
      var tsv = matrix
        .map(function (row) {
          return row.join('\t');
        })
        .join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tsv).catch(function () {});
      }
    } catch (e) {}

    _toast(
      _L('📋 ', '📋 ') +
        Math.max(flat.length, sel.pairs.length) +
        _L(' cells कॉपी — एक cell पर Ctrl+V से पेस्ट', ' cells copied — click one cell & Ctrl+V')
    );
    return true;
  }

  function _stageChange(empId, date, newShift) {
    if (newShift === '' || newShift == null) return;
    try {
      var emp =
        typeof getEmps === 'function'
          ? getEmps().find(function (e) {
              return e && e.id === empId;
            })
          : null;
      if (!emp) return;
      var orig = typeof getShift === 'function' ? getShift(emp, date) : '';
      if (String(orig) === String(newShift)) return;
      if (typeof stageSingleShiftChange === 'function') {
        stageSingleShiftChange(empId, emp.name, date, orig, newShift);
      }
    } catch (e) {
      console.warn('[paste]', e);
    }
  }

  /**
   * Paste clipboard matrix starting at originEmp/originDate (Excel-style).
   * Works with a single target cell.
   */
  function _pasteFromOrigin(originEmp, originDate, clip) {
    var empOrder = _empOrderFromTable();
    var allDates = _dateOrderFromTable();
    if (!allDates.length && clip.dates) allDates = clip.dates.slice();

    var startRow = empOrder.indexOf(originEmp);
    if (startRow < 0) startRow = 0;
    var startCol = allDates.indexOf(originDate);
    if (startCol < 0) startCol = 0;

    var applied = 0;
    for (var rr = 0; rr < clip.matrix.length; rr++) {
      var empId = empOrder[startRow + rr];
      if (!empId) break;
      for (var cc = 0; cc < clip.matrix[rr].length; cc++) {
        var date = allDates[startCol + cc];
        if (!date) break;
        var val = clip.matrix[rr][cc];
        if (val === '' || val == null) continue;
        _stageChange(empId, date, val);
        applied++;
      }
    }
    return applied;
  }

  function pasteSchedSelection(ev) {
    if (ev) {
      try {
        ev.preventDefault();
      } catch (e) {}
    }
    if (!_canEdit()) {
      _toast(_L('❌ Edit permission नहीं', '❌ No edit permission'));
      return false;
    }

    var clip = _msClipboard || global._msClipboard;
    if (!clip || !clip.matrix || !clip.matrix.length) {
      _toast(_L('⚠️ पहले Ctrl+C से कॉपी करें', '⚠️ Copy cells first (Ctrl+C)'));
      return false;
    }

    var sel = _parseSelection();
    var applied = 0;
    var rows = clip.matrix.length;
    var cols = clip.matrix[0].length;

    // Same-shape multi-select → map 1:1
    if (
      sel &&
      sel.empIds.length === rows &&
      sel.dates.length === cols &&
      sel.pairs.length > 1
    ) {
      for (var r = 0; r < sel.empIds.length; r++) {
        for (var c = 0; c < sel.dates.length; c++) {
          var sh = clip.matrix[r][c];
          if (sh === '' || sh == null) continue;
          var key = sel.empIds[r] + '|' + sel.dates[c];
          if (global._msSelected && global._msSelected.size && !global._msSelected.has(key))
            continue;
          _stageChange(sel.empIds[r], sel.dates[c], sh);
          applied++;
        }
      }
    } else {
      // Single cell (or any selection) = origin for full block paste (Excel)
      var origin = null;
      if (sel && sel.empIds.length && sel.dates.length) {
        origin = { empId: sel.empIds[0], date: sel.dates[0] };
      } else {
        origin = _resolveOrigin();
      }
      if (!origin) {
        _toast(
          _L(
            '⚠️ पेस्ट के लिए एक cell पर क्लिक करें',
            '⚠️ Click one target cell, then Paste'
          )
        );
        return false;
      }
      applied = _pasteFromOrigin(origin.empId, origin.date, clip);
    }

    try {
      if (typeof _updateSaveBar === 'function') _updateSaveBar();
      if (typeof renderSchedule === 'function') renderSchedule();
    } catch (e) {}

    if (applied === 0) {
      _toast(_L('⚠️ पेस्ट नहीं हुआ — cell/date चेक करें', '⚠️ Nothing pasted — check cell/date'));
      return false;
    }

    _toast(
      _L('📌 ', '📌 ') +
        applied +
        _L(' cells पेस्ट (Save दबाएँ)', ' cells pasted — press Save')
    );
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
    var tbl = document.getElementById('schedTbl');
    if (!tbl) return;

    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var key = (e.key || '').toLowerCase();

    if (key === 'c') {
      copySchedSelection(e);
    } else if (key === 'v') {
      pasteSchedSelection(e);
    }
  }

  function _onTableClick(e) {
    var td = e.target && e.target.closest && e.target.closest('td[data-empid][data-date]');
    if (td) _setAnchorFromTd(td);
  }

  function initSchedClipboard() {
    document.addEventListener('keydown', _onKeyDown, true);
    document.addEventListener('click', _onTableClick, true);
    try {
      global.copySchedSelection = copySchedSelection;
      global.pasteSchedSelection = pasteSchedSelection;
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSchedClipboard);
  } else {
    initSchedClipboard();
  }
})(typeof window !== 'undefined' ? window : globalThis);
