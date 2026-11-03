/**
 * Schedule cell keyboard:
 * - Single-click focus; type D/N/Ab/CO/1/2/GP/H…
 * - Tab / Shift+Tab → next / previous cell
 * - Shift+Arrows → multi-select range
 * - Double-click / Enter → full picker
 * Manager shift legends are per-manager (shiftConfigs/mgr:phone) — not shared across managers.
 */
(function (global) {
  'use strict';

  var _focus = null;
  var _lastTap = { t: 0, key: '' };
  var _buf = '';
  var _bufTimer = null;
  var BUF_MS = 900;
  var _anchor = null; // for shift+arrow range: { empId, date }

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

  function _clearHighlight() {
    try {
      document.querySelectorAll('td.sched-kb-focus').forEach(function (el) {
        el.classList.remove('sched-kb-focus');
      });
    } catch (e) {}
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

  function _dateOrderFromTable() {
    var tbl = document.getElementById('schedTbl');
    if (!tbl) return [];
    var dates = [];
    var seen = Object.create(null);
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
    return dates;
  }

  function _findTd(empId, date) {
    try {
      return document.querySelector(
        'td[data-empid="' + empId + '"][data-date="' + date + '"]'
      );
    } catch (e) {
      return null;
    }
  }

  function _focusCell(empId, date, opts) {
    opts = opts || {};
    var td = _findTd(empId, date);
    if (!td) return false;
    var empName =
      td.getAttribute('data-empname') ||
      (typeof getEmps === 'function'
        ? (getEmps().find(function (e) {
            return e && e.id === empId;
          }) || {}).name
        : '') ||
      '';
    var origSh = td.getAttribute('data-origsh') || '';
    _clearHighlight();
    _focus = {
      td: td,
      empId: empId,
      empName: empName,
      date: date,
      origSh: origSh,
    };
    td.classList.add('sched-kb-focus');
    try {
      td.setAttribute('tabindex', '0');
      td.focus({ preventScroll: false });
    } catch (e) {
      try {
        td.focus();
      } catch (e2) {}
    }
    try {
      td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch (e) {}
    if (!opts.keepAnchor) {
      _anchor = { empId: empId, date: date };
    }
    return true;
  }

  function _neighbor(empId, date, dRow, dCol) {
    var emps = _empOrderFromTable();
    var dates = _dateOrderFromTable();
    var ri = emps.indexOf(empId);
    var ci = dates.indexOf(date);
    if (ri < 0 || ci < 0) return null;
    var nr = ri + dRow;
    var nc = ci + dCol;
    if (nr < 0 || nr >= emps.length || nc < 0 || nc >= dates.length) return null;
    return { empId: emps[nr], date: dates[nc] };
  }

  function _moveFocus(dRow, dCol, withSelect) {
    if (!_focus) return false;
    var n = _neighbor(_focus.empId, _focus.date, dRow, dCol);
    if (!n) return false;
    if (withSelect && _canEdit()) {
      if (!_anchor) _anchor = { empId: _focus.empId, date: _focus.date };
      _selectRange(_anchor.empId, _anchor.date, n.empId, n.date);
      _focusCell(n.empId, n.date, { keepAnchor: true });
    } else {
      _focusCell(n.empId, n.date);
    }
    return true;
  }

  function _selectRange(empA, dateA, empB, dateB) {
    if (typeof _msSelected === 'undefined' || !_msSelected) return;
    var emps = _empOrderFromTable();
    var dates = _dateOrderFromTable();
    var r1 = emps.indexOf(empA);
    var r2 = emps.indexOf(empB);
    var c1 = dates.indexOf(dateA);
    var c2 = dates.indexOf(dateB);
    if (r1 < 0 || r2 < 0 || c1 < 0 || c2 < 0) return;
    var rMin = Math.min(r1, r2);
    var rMax = Math.max(r1, r2);
    var cMin = Math.min(c1, c2);
    var cMax = Math.max(c1, c2);

    try {
      if (typeof clearMultiSelect === 'function' && !_msActive) {
        // enter multi mode without clearing later
      }
      global._msActive = true;
      if (typeof _msActive !== 'undefined') {
        try {
          _msActive = true;
        } catch (e) {}
      }
      _msSelected.clear();
      document.querySelectorAll('td.cell-selected').forEach(function (el) {
        el.classList.remove('cell-selected');
      });
      for (var r = rMin; r <= rMax; r++) {
        for (var c = cMin; c <= cMax; c++) {
          var eid = emps[r];
          var dt = dates[c];
          var key = eid + '|' + dt;
          _msSelected.add(key);
          var td = _findTd(eid, dt);
          if (td) td.classList.add('cell-selected');
        }
      }
      if (typeof _msUpdateBar === 'function') _msUpdateBar();
      var btn = document.getElementById('msToggleBtn');
      if (btn) {
        btn.classList.add('ms-on');
        btn.textContent =
          typeof L === 'function' ? L('✕ Cancel Select', '✕ Cancel Select') : '✕ Cancel Select';
      }
    } catch (e) {
      console.warn('[range select]', e);
    }
  }

  function _activeShiftCodes() {
    try {
      var cfg = typeof getShiftConfigSync === 'function' ? getShiftConfigSync() : {};
      var by = {};
      (cfg.shifts || []).forEach(function (s) {
        if (s && s.code) by[String(s.code).toUpperCase()] = s;
      });
      var std = ['D', 'N', 'A', 'B', 'C'].filter(function (code) {
        var s = by[code];
        if (s && s.active === false) return false;
        return true;
      });
      var extra = ['O', 'L', 'G', 'C/O', 'CO', 'HLF', 'Ab', 'AB', 'H', 'OD', 'GP'].filter(
        function (code) {
          var s = by[code] || by[String(code).replace('/', '')];
          if (s && s.active === false) return false;
          return true;
        }
      );
      return std.concat(extra);
    } catch (e) {
      return ['D', 'N', 'A', 'B', 'C', 'O', 'L', 'G', 'C/O', 'HLF', 'Ab', 'H', 'OD', 'GP'];
    }
  }

  /** Known double-shift combos (must match shift picker) */
  var _COMBO_CODES = ['D+N', 'A+B', 'A+C', 'B+C', 'D+A', 'N+B', 'D+B', 'D+C', 'N+A', 'N+C', 'A+N', 'B+N'];

  function _normalizeTyped(raw) {
    var t = String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
    if (!t) return null;
    // Normalize separators: A B, A-B, A/B → A+B
    t = t.replace(/[\-\/&,]/g, '+').replace(/\+\+/g, '+');
    if (t === '1/2' || t === '½' || t === 'HALF' || t === 'HAL' || t === 'HL' || t === 'HLF')
      return 'HLF';
    if (t === 'CO' || t === 'C/O' || t === 'C-OFF' || t === 'COFF') return 'C/O';
    if (t === 'AB' || t === 'ABS' || t === 'ABSENT') return 'Ab';
    if (t === 'GP' || t === 'GATE') return 'GP';
    if (t === 'OD' || t === 'OTHER') return 'OD';
    // Double shifts: A+B, D+N, …
    if (t.indexOf('+') >= 0) {
      var parts = t.split('+').filter(Boolean);
      if (parts.length === 2) {
        var a = parts[0];
        var b = parts[1];
        // Canonical order: prefer known combo list order
        var c1 = a + '+' + b;
        var c2 = b + '+' + a;
        if (_COMBO_CODES.indexOf(c1) >= 0) return c1;
        if (_COMBO_CODES.indexOf(c2) >= 0) return c2;
        // Allow any D/N/A/B/C pair
        var work = { D:1, N:1, A:1, B:1, C:1 };
        if (work[a] && work[b] && a !== b) return c1;
      }
    }
    if (t === 'D' || t === 'N' || t === 'A' || t === 'B' || t === 'C') return t;
    if (t === 'O' || t === '0') return 'O';
    if (t === 'L' || t === 'G' || t === 'H') return t;
    return t;
  }

  function _isPrefixOfMulti(buf) {
    var u = String(buf).toUpperCase().replace(/[\-\/&,]/g, '+');
    var multis = [
      'AB',
      'ABS',
      'ABSENT',
      'CO',
      'C/O',
      'HLF',
      'HALF',
      'HAL',
      'HL',
      '1/',
      '1/2',
      'GP',
      'OD',
      'D+',
      'N+',
      'A+',
      'B+',
      'C+',
      'D+N',
      'A+B',
      'A+C',
      'B+C',
      'D+A',
      'N+B',
      'D+B',
      'D+C',
      'N+A',
      'N+C',
    ];
    for (var i = 0; i < multis.length; i++) {
      if (multis[i].indexOf(u) === 0 && multis[i] !== u) return true;
    }
    if (u === 'C/' || u === '1') return true;
    // "A+" waiting for second letter
    if (/^[DNABC]\+$/.test(u)) return true;
    return false;
  }

  function selectSchedCellForKeyboard(td, empId, empName, date, origSh) {
    if (!_canEdit()) return;
    try {
      var key = empId + '|' + date;
      var now = Date.now();
      if (_lastTap.key === key && now - _lastTap.t < 350) {
        _lastTap = { t: 0, key: '' };
        _buf = '';
        if (typeof editShiftCell === 'function') {
          editShiftCell(empId, empName, date, origSh);
        }
        return;
      }
      _lastTap = { t: now, key: key };
    } catch (e) {}

    _buf = '';
    _anchor = { empId: empId, date: date };
    _clearHighlight();
    _focus = {
      td: td,
      empId: empId,
      empName: empName,
      date: date,
      origSh: origSh || (td && td.getAttribute('data-origsh')) || '',
    };
    try {
      if (td) {
        td.classList.add('sched-kb-focus');
        td.setAttribute('tabindex', '0');
        td.focus();
      }
    } catch (e) {}
    try {
      if (!sessionStorage.getItem('mp_kb_hint3')) {
        sessionStorage.setItem('mp_kb_hint3', '1');
        _toast(
          _L(
            '⌨️ Tab=अगला · Shift+Tab=पिछला · Shift+↑↓←→=सेलेक्ट',
            '⌨️ Tab=next · Shift+Tab=prev · Shift+Arrows=select'
          )
        );
      }
    } catch (e) {}
  }

  function _applyKeyShift(code) {
    if (!_focus) return false;
    if (!_canEdit()) return false;
    var up = _normalizeTyped(code);
    if (!up) return false;

    var allowed = _activeShiftCodes().map(function (c) {
      return String(c).toUpperCase();
    });
    var check = up.toUpperCase();
    var ok =
      allowed.indexOf(check) >= 0 ||
      allowed.indexOf(up) >= 0 ||
      (check === 'C/O' && (allowed.indexOf('C/O') >= 0 || allowed.indexOf('CO') >= 0)) ||
      (check === 'AB' && allowed.indexOf('AB') >= 0);
    // Combo A+B: both legs must be active work shifts in Profile
    if (!ok && check.indexOf('+') > 0) {
      var legs = check.split('+');
      ok =
        legs.length === 2 &&
        allowed.indexOf(legs[0]) >= 0 &&
        allowed.indexOf(legs[1]) >= 0 &&
        legs[0] !== legs[1];
    }
    if (check === 'AB') up = 'Ab';
    if (!ok) {
      _toast(_L('⚠️ Shift Profile में बंद है: ', '⚠️ Shift hidden in Profile: ') + up);
      return true;
    }

    try {
      var empId = _focus.empId;
      var date = _focus.date;
      var emp =
        typeof getEmps === 'function'
          ? getEmps().find(function (e) {
              return e && e.id === empId;
            })
          : null;
      if (!emp) return false;
      var orig =
        typeof getShift === 'function' ? getShift(emp, date) : _focus.origSh;
      if (typeof stageSingleShiftChange === 'function') {
        stageSingleShiftChange(empId, emp.name || _focus.empName, date, orig, up);
      }
      _focus.origSh = up;
      try {
        if (typeof _updateSaveBar === 'function') _updateSaveBar();
        if (typeof renderSchedule === 'function') renderSchedule();
        setTimeout(function () {
          _focusCell(empId, date);
        }, 30);
      } catch (e) {}
      _toast('✅ ' + (emp.name || '') + ' → ' + up);
    } catch (e) {
      console.warn('[kb shift]', e);
    }
    return true;
  }

  function _flushBuf() {
    if (!_buf) return;
    var typed = _buf;
    _buf = '';
    if (_bufTimer) {
      clearTimeout(_bufTimer);
      _bufTimer = null;
    }
    _applyKeyShift(typed);
  }

  function _pushBuf(ch) {
    _buf += ch;
    if (_bufTimer) clearTimeout(_bufTimer);
    var bu = String(_buf).toUpperCase().replace(/\s/g, '').replace(/[\-\/&,]/g, '+');
    var exactMulti =
      ['AB', 'CO', 'C/O', 'HLF', '1/2', 'GP', 'OD', 'HALF'].indexOf(bu) >= 0 ||
      /^[DNABC]\+[DNABC]$/.test(bu);
    if (exactMulti || (_normalizeTyped(_buf) && !_isPrefixOfMulti(_buf) && _buf.length >= 2)) {
      _flushBuf();
      return;
    }
    if (_buf.length === 1) {
      var u = _buf.toUpperCase();
      // Wait: may continue as Ab, CO, GP, or D+N / A+B
      if (
        u === 'A' ||
        u === 'B' ||
        u === 'C' ||
        u === 'D' ||
        u === 'N' ||
        u === 'H' ||
        u === '1' ||
        u === 'G' ||
        u === 'O'
      ) {
        _bufTimer = setTimeout(_flushBuf, BUF_MS);
        return;
      }
      _flushBuf();
      return;
    }
    _bufTimer = setTimeout(_flushBuf, BUF_MS);
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
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    var tbl = document.getElementById('schedTbl');
    if (!tbl) return;

    // Allow Tab even to start from first cell if none focused but table visible
    var k = e.key || '';

    if (k === 'Tab' && _canEdit()) {
      if (!_focus) {
        var first = tbl.querySelector('td[data-empid][data-date]');
        if (first) {
          e.preventDefault();
          selectSchedCellForKeyboard(
            first,
            first.getAttribute('data-empid'),
            first.getAttribute('data-empname') || '',
            first.getAttribute('data-date'),
            first.getAttribute('data-origsh') || ''
          );
          return;
        }
      } else {
        e.preventDefault();
        _buf = '';
        // Tab = next column; at end of row → next row first col
        if (e.shiftKey) {
          if (!_moveFocus(0, -1)) {
            // prev row last col
            var emps = _empOrderFromTable();
            var dates = _dateOrderFromTable();
            var ri = emps.indexOf(_focus.empId);
            if (ri > 0 && dates.length) {
              _focusCell(emps[ri - 1], dates[dates.length - 1]);
            }
          }
        } else {
          if (!_moveFocus(0, 1)) {
            var emps2 = _empOrderFromTable();
            var dates2 = _dateOrderFromTable();
            var ri2 = emps2.indexOf(_focus.empId);
            if (ri2 >= 0 && ri2 < emps2.length - 1 && dates2.length) {
              _focusCell(emps2[ri2 + 1], dates2[0]);
            }
          }
        }
        return;
      }
    }

    if (!_focus) return;
    if (typeof _msActive !== 'undefined' && _msActive && !e.shiftKey && (k.startsWith('Arrow'))) {
      // plain arrows while multi-active: move focus without clearing unless we want
    }

    // Shift + Arrows = range select
    if (e.shiftKey && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown')) {
      if (!_canEdit()) return;
      e.preventDefault();
      _buf = '';
      var dr = 0;
      var dc = 0;
      if (k === 'ArrowLeft') dc = -1;
      if (k === 'ArrowRight') dc = 1;
      if (k === 'ArrowUp') dr = -1;
      if (k === 'ArrowDown') dr = 1;
      _moveFocus(dr, dc, true);
      return;
    }

    // Plain arrows = move focus
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
      e.preventDefault();
      _buf = '';
      var dr2 = 0;
      var dc2 = 0;
      if (k === 'ArrowLeft') dc2 = -1;
      if (k === 'ArrowRight') dc2 = 1;
      if (k === 'ArrowUp') dr2 = -1;
      if (k === 'ArrowDown') dr2 = 1;
      _moveFocus(dr2, dc2, false);
      return;
    }

    if (k === 'Enter') {
      e.preventDefault();
      _buf = '';
      if (_focus && typeof editShiftCell === 'function') {
        editShiftCell(_focus.empId, _focus.empName, _focus.date, _focus.origSh);
      }
      return;
    }
    if (k === 'Escape') {
      e.preventDefault();
      _buf = '';
      _clearHighlight();
      _focus = null;
      _anchor = null;
      return;
    }
    if (k === 'Backspace') {
      e.preventDefault();
      _buf = _buf.slice(0, -1);
      return;
    }
    if (k === '/' || k === '÷') {
      e.preventDefault();
      _pushBuf('/');
      return;
    }
    if (k === '+' || k === '=') {
      // = is unshifted + on many keyboards
      e.preventDefault();
      _pushBuf('+');
      return;
    }
    if (k.length === 1 && k >= '0' && k <= '9') {
      e.preventDefault();
      _pushBuf(k);
      return;
    }
    if (k.length === 1 && /[a-zA-Z]/.test(k)) {
      e.preventDefault();
      _pushBuf(k);
      return;
    }
  }

  function init() {
    document.addEventListener('keydown', _onKeyDown, true);
    try {
      global.selectSchedCellForKeyboard = selectSchedCellForKeyboard;
    } catch (e) {}
  }

  try {
    var st = document.createElement('style');
    st.textContent =
      'td.sched-kb-focus{outline:2px solid #22c55e!important;outline-offset:-2px;box-shadow:inset 0 0 0 2px rgba(34,197,94,.45)!important;z-index:2}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
