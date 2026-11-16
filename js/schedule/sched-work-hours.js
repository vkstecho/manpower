/**
 * Man Power v6.0 — Work-time legend + mobile-primary identity helpers
 *
 * 1) Mobile is the durable person key for schedule continuity across companies.
 *    EmpId / company can change; phone stays. Meta stored under scheduleMeta by phone.
 * 2) Optional time segments on a day (e.g. 09:00–12:00 + 14:00–18:00 → 7h).
 *    When only a shift code is set, hours come from legend start/end.
 * 3) Manager enables time legend from Shift & Min Staff settings (timeLegendEnabled).
 */
(function (global) {
  'use strict';

  var META_PATH = 'scheduleMeta';
  var STATUS_CODES = {
    O: 1, L: 1, 'C/O': 1, CO: 1, H: 1, HLF: 1, Ab: 1, AB: 1, OD: 1, GP: 1, '½': 1
  };

  function _L(hi, en) {
    try {
      if (typeof L === 'function') return L(hi, en);
    } catch (e) {}
    return en || hi;
  }

  function normPhone(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (d.length >= 10) return d.slice(-10);
    return d || '';
  }

  function empPhone(emp) {
    if (!emp) return '';
    return normPhone(emp.phone || emp.mobile || emp.phoneNumber || '');
  }

  function empById(empId) {
    try {
      var list = typeof getEmps === 'function' ? getEmps() : (global._cache && global._cache.employees) || [];
      return (list || []).find(function (e) {
        return e && (String(e.id) === String(empId) || String(e.empId) === String(empId));
      }) || null;
    } catch (e) {
      return null;
    }
  }

  function monthKeyFromDate(dateStr) {
    var d = String(dateStr || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
    return d.slice(0, 4) + '_' + d.slice(5, 7);
  }

  function dayIdxFromDate(dateStr) {
    var d = String(dateStr || '').slice(0, 10);
    var n = parseInt(d.slice(8, 10), 10);
    return isNaN(n) ? -1 : n - 1;
  }

  function parseHHMM(t) {
    if (t == null || t === '') return null;
    var s = String(t).trim();
    if (/^\d{3,4}$/.test(s)) {
      s = s.padStart(4, '0');
      s = s.slice(0, 2) + ':' + s.slice(2);
    }
    var m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function formatHHMM(mins) {
    if (mins == null || isNaN(mins)) return '';
    var h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
    var m = ((mins % 1440) + 1440) % 1440 % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  /** Minutes between from-to; overnight supported (end < start → +24h). */
  function segmentMinutes(from, to) {
    var a = parseHHMM(from);
    var b = parseHHMM(to);
    if (a == null || b == null) return 0;
    var diff = b - a;
    if (diff <= 0) diff += 24 * 60;
    return diff;
  }

  function segmentsHours(segments) {
    if (!Array.isArray(segments) || !segments.length) return 0;
    var total = 0;
    segments.forEach(function (seg) {
      if (!seg) return;
      total += segmentMinutes(seg.from || seg.start, seg.to || seg.end);
    });
    return Math.round((total / 60) * 100) / 100;
  }

  function legendHoursForCode(code) {
    if (!code) return 0;
    var raw = String(code).trim();
    if (raw.indexOf('+') >= 0) {
      return raw.split('+').reduce(function (sum, part) {
        return sum + legendHoursForCode(part.trim());
      }, 0);
    }
    var up = raw.toUpperCase();
    if (STATUS_CODES[raw] || STATUS_CODES[up]) {
      if (up === 'HLF' || raw === '½') return 4;
      return 0;
    }
    try {
      var cfg = typeof getShiftConfigSync === 'function' ? getShiftConfigSync() : null;
      var list = (cfg && cfg.shifts) || [];
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        if (!s || !s.code) continue;
        if (String(s.code).toUpperCase() === up) {
          if (s.start && s.end) return Math.round((segmentMinutes(s.start, s.end) / 60) * 100) / 100;
          break;
        }
      }
    } catch (e) {}
    // Defaults
    if (up === 'D' || up === 'N' || up === 'G') return 12;
    if (up === 'A' || up === 'B' || up === 'C') return 8;
    return 0;
  }

  function isTimeLegendEnabled() {
    try {
      var cfg = typeof getShiftConfigSync === 'function' ? getShiftConfigSync() : null;
      if (cfg && cfg.timeLegendEnabled === true) return true;
      if (cfg && cfg.timeLegendEnabled === false) return false;
    } catch (e) {}
    return false;
  }

  function metaCache() {
    if (!global._cache) global._cache = {};
    if (!global._cache.scheduleMeta) global._cache.scheduleMeta = {};
    return global._cache.scheduleMeta;
  }

  function getDayMeta(empId, dateStr) {
    var mk = monthKeyFromDate(dateStr);
    var di = dayIdxFromDate(dateStr);
    if (!mk || di < 0) return null;
    var emp = empById(empId);
    var phone = empPhone(emp);
    var store = metaCache();
    var month = store[mk] || {};
    // Prefer phone key, fall back to empId
    var byPhone = phone && month['p:' + phone] ? month['p:' + phone] : null;
    var byId = month[empId] || month[String(empId)] || null;
    var row = byPhone || byId;
    if (!row) return null;
    var day = row[di] || row[String(di)] || null;
    return day || null;
  }

  function setDayMetaLocal(empId, dateStr, meta) {
    var mk = monthKeyFromDate(dateStr);
    var di = dayIdxFromDate(dateStr);
    if (!mk || di < 0) return;
    var emp = empById(empId);
    var phone = empPhone(emp);
    var store = metaCache();
    if (!store[mk]) store[mk] = {};
    var keys = [];
    if (phone) keys.push('p:' + phone);
    if (empId) keys.push(String(empId));
    keys.forEach(function (k) {
      if (!store[mk][k]) store[mk][k] = {};
      store[mk][k][di] = meta;
    });
  }

  async function persistDayMeta(empId, dateStr, meta) {
    setDayMetaLocal(empId, dateStr, meta);
    var mk = monthKeyFromDate(dateStr);
    var di = dayIdxFromDate(dateStr);
    var emp = empById(empId);
    var phone = empPhone(emp);
    if (!mk || di < 0) return;
    try {
      if (typeof fbUpdate !== 'function') return;
      var payload = {};
      var node = Object.assign({}, meta || {}, {
        updatedAt: new Date().toISOString(),
        empId: empId,
        phone: phone || '',
        empCode: emp ? String(emp.empId || emp.empCode || '') : '',
        company: emp ? String(emp.company || emp.companyName || emp.companyId || '') : ''
      });
      if (phone) payload[META_PATH + '/' + mk + '/p:' + phone + '/' + di] = node;
      payload[META_PATH + '/' + mk + '/' + empId + '/' + di] = node;
      // fbUpdate may not support multi-path; write sequentially
      if (phone) {
        await fbUpdate(META_PATH + '/' + mk + '/p:' + phone, (function () {
          var o = {};
          o[di] = node;
          return o;
        })());
      }
      await fbUpdate(META_PATH + '/' + mk + '/' + empId, (function () {
        var o = {};
        o[di] = node;
        return o;
      })());
    } catch (e) {
      console.warn('[scheduleMeta persist]', e);
    }
  }

  async function loadMonthMeta(mk) {
    if (!mk) return;
    try {
      if (typeof fbGet !== 'function') return;
      var snap = await fbGet(META_PATH + '/' + mk);
      if (snap && typeof snap === 'object') {
        var store = metaCache();
        store[mk] = Object.assign({}, store[mk] || {}, snap);
      }
    } catch (e) {
      console.warn('[scheduleMeta load]', e);
    }
  }

  function computeDayHours(empId, dateStr, shiftCode) {
    var meta = getDayMeta(empId, dateStr);
    if (meta && Array.isArray(meta.segments) && meta.segments.length) {
      return segmentsHours(meta.segments);
    }
    if (meta && typeof meta.hours === 'number' && !isNaN(meta.hours)) return meta.hours;
    return legendHoursForCode(shiftCode || '');
  }

  function sumMonthHours(empId, monthKey, dayShifts) {
    // dayShifts: array index 0 = day 1
    var total = 0;
    var arr = dayShifts || [];
    for (var i = 0; i < arr.length; i++) {
      var code = arr[i];
      if (!code) continue;
      var y = monthKey.slice(0, 4);
      var m = monthKey.slice(5);
      var ds = y + '-' + m + '-' + String(i + 1).padStart(2, '0');
      total += computeDayHours(empId, ds, code);
    }
    return Math.round(total * 100) / 100;
  }

  /** Identity chip for schedule month row: Company + Emp Code (history-aware). */
  function identityChipHtml(emp) {
    if (!emp) return '';
    var company = emp.company || emp.companyName || emp.companyId || '';
    var code = emp.empId || emp.empCode || emp.code || '';
    var phone = empPhone(emp);
    var bits = [];
    if (company) bits.push('Company-' + String(company));
    if (code) bits.push('Emp Code-' + String(code));
    if (!bits.length && phone) bits.push('📱' + phone);
    if (!bits.length) return '';
    return (
      '<span class="mp-id-chip" title="' +
      (phone ? 'Primary ID: ' + phone : '') +
      '" style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.35);color:#38bdf8;font-size:10px;font-weight:700;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle">' +
      bits.join(', ') +
      '</span>'
    );
  }

  function monthRowAnnotation(emp, monthKey) {
    // Prefer live emp fields; could later merge historical meta from scheduleMeta
    var company = emp && (emp.company || emp.companyName || emp.companyId) || '';
    var code = emp && (emp.empId || emp.empCode || emp.code) || '';
    var label = '';
    try {
      var parts = String(monthKey || '').split('_');
      if (parts.length === 2) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var mi = parseInt(parts[1], 10) - 1;
        label = (months[mi] || parts[1]) + '-' + parts[0];
      }
    } catch (e) {}
    var extra = [];
    if (company) extra.push('Company-' + company);
    if (code) extra.push('Emp Code-' + code);
    if (!extra.length) return label || monthKey || '';
    return (label || monthKey || '') + (extra.length ? ', ' + extra.join(', ') : '');
  }

  /** Build time-segment UI HTML for shift edit modal. */
  function timeSegmentsFormHtml(existingMeta) {
    var segs = (existingMeta && existingMeta.segments) || [{ from: '', to: '' }];
    if (!segs.length) segs = [{ from: '', to: '' }];
    var rows = segs
      .map(function (s, i) {
        return (
          '<div class="mp-time-seg" data-i="' +
          i +
          '" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">' +
          '<input type="text" inputmode="numeric" class="mp-time-from" placeholder="09:00" maxlength="5" value="' +
          (s.from || s.start || '') +
          '" style="width:72px;padding:10px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-weight:800;text-align:center">' +
          '<span style="color:#94a3b8;font-weight:700">→</span>' +
          '<input type="text" inputmode="numeric" class="mp-time-to" placeholder="18:00" maxlength="5" value="' +
          (s.to || s.end || '') +
          '" style="width:72px;padding:10px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-weight:800;text-align:center">' +
          (i > 0
            ? '<button type="button" class="mp-time-del" style="padding:6px 10px;border-radius:8px;border:1px solid #ef4444;background:transparent;color:#ef4444;font-weight:700;cursor:pointer">✕</button>'
            : '') +
          '</div>'
        );
      })
      .join('');
    return (
      '<div id="mpTimeLegendBox" style="margin-top:12px;padding:12px;border-radius:12px;border:1.5px dashed rgba(249,115,22,.45);background:rgba(249,115,22,.06)">' +
      '<div style="font-size:12px;font-weight:800;color:#f97316;margin-bottom:6px">⏱️ ' +
      _L('कार्य समय (24-घंटे)', 'Work time (24-hour clock)') +
      '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:8px;line-height:1.4">' +
      _L(
        'उदा. 09:00–12:00 और 14:00–18:00 = 7 घंटे। खाली छोड़ें तो शिफ्ट लेजेंड समय लगेगा।',
        'e.g. 09:00–12:00 and 14:00–18:00 = 7 hrs. Leave empty to use legend shift times.'
      ) +
      '</div>' +
      '<div id="mpTimeSegList">' +
      rows +
      '</div>' +
      '<button type="button" id="mpTimeAddSeg" style="margin-top:4px;padding:8px 12px;border-radius:10px;border:none;background:#f97316;color:#fff;font-weight:800;cursor:pointer;font-size:12px">+ ' +
      _L('समय जोड़ें', 'Add time range') +
      '</button>' +
      '<div id="mpTimeHoursPreview" style="margin-top:8px;font-size:12px;font-weight:800;color:#22c55e"></div>' +
      '</div>'
    );
  }

  function readTimeSegmentsFromDom() {
    var box = document.getElementById('mpTimeSegList');
    if (!box) return [];
    var segs = [];
    box.querySelectorAll('.mp-time-seg').forEach(function (row) {
      var from = (row.querySelector('.mp-time-from') || {}).value || '';
      var to = (row.querySelector('.mp-time-to') || {}).value || '';
      from = (typeof _mpNormTime24 === 'function' ? _mpNormTime24(from) : from) || from;
      to = (typeof _mpNormTime24 === 'function' ? _mpNormTime24(to) : to) || to;
      if (from && to) segs.push({ from: from, to: to });
    });
    return segs;
  }

  function bindTimeSegmentsUi() {
    var list = document.getElementById('mpTimeSegList');
    var addBtn = document.getElementById('mpTimeAddSeg');
    function refreshPreview() {
      var segs = readTimeSegmentsFromDom();
      var hrs = segmentsHours(segs);
      var el = document.getElementById('mpTimeHoursPreview');
      if (el) {
        el.textContent = segs.length
          ? _L('कुल कार्य घंटे: ', 'Total worked hours: ') + hrs + ' HR'
          : _L('लेजेंड समय उपयोग होगा', 'Legend times will be used');
      }
    }
    if (addBtn) {
      addBtn.onclick = function () {
        if (!list) return;
        var div = document.createElement('div');
        div.className = 'mp-time-seg';
        div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap';
        div.innerHTML =
          '<input type="text" inputmode="numeric" class="mp-time-from" placeholder="09:00" maxlength="5" style="width:72px;padding:10px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-weight:800;text-align:center">' +
          '<span style="color:#94a3b8;font-weight:700">→</span>' +
          '<input type="text" inputmode="numeric" class="mp-time-to" placeholder="18:00" maxlength="5" style="width:72px;padding:10px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--card);color:var(--text);font-weight:800;text-align:center">' +
          '<button type="button" class="mp-time-del" style="padding:6px 10px;border-radius:8px;border:1px solid #ef4444;background:transparent;color:#ef4444;font-weight:700;cursor:pointer">✕</button>';
        list.appendChild(div);
        div.querySelector('.mp-time-del').onclick = function () {
          div.remove();
          refreshPreview();
        };
        div.querySelectorAll('input').forEach(function (inp) {
          inp.addEventListener('input', refreshPreview);
          inp.addEventListener('blur', refreshPreview);
        });
        refreshPreview();
      };
    }
    if (list) {
      list.querySelectorAll('.mp-time-del').forEach(function (btn) {
        btn.onclick = function () {
          var row = btn.closest('.mp-time-seg');
          if (row) row.remove();
          refreshPreview();
        };
      });
      list.querySelectorAll('input').forEach(function (inp) {
        inp.addEventListener('input', refreshPreview);
        inp.addEventListener('blur', refreshPreview);
      });
    }
    refreshPreview();
  }

  function detailHoursHtml(empId, dateStr, shiftCode) {
    var meta = getDayMeta(empId, dateStr);
    var hrs = computeDayHours(empId, dateStr, shiftCode);
    var lines = [];
    if (meta && Array.isArray(meta.segments) && meta.segments.length) {
      meta.segments.forEach(function (s) {
        lines.push((s.from || s.start || '') + ' → ' + (s.to || s.end || ''));
      });
    } else {
      try {
        var cfg = typeof getShiftConfigSync === 'function' ? getShiftConfigSync() : null;
        var up = String(shiftCode || '').toUpperCase();
        ((cfg && cfg.shifts) || []).forEach(function (s) {
          if (s && String(s.code).toUpperCase() === up && s.start && s.end) {
            lines.push(s.start + ' → ' + s.end + ' (' + _L('लेजेंड', 'legend') + ')');
          }
        });
      } catch (e) {}
    }
    if (!hrs && !lines.length) return '';
    return (
      '<div style="margin-top:12px;padding:12px 14px;background:rgba(34,197,94,.08);border-left:3px solid #22c55e;border-radius:0 10px 10px 0">' +
      '<div style="font-size:11px;color:#22c55e;font-weight:800;margin-bottom:4px">⏱️ ' +
      _L('कार्य घंटे', 'Worked hours') +
      '</div>' +
      (lines.length
        ? '<div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.5">' +
          lines.map(function (x) {
            return esc(x);
          }).join('<br>') +
          '</div>'
        : '') +
      '<div style="margin-top:6px;font-size:14px;font-weight:800;color:#22c55e">' +
      hrs +
      ' HR</div></div>'
    );
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  // Colour palette (12 presets — includes +4 beyond classic 8)
  var MP_COLOR_PRESETS = [
    '#ef4444', // red
    '#06b6d4', // cyan
    '#2563eb', // blue
    '#22c55e', // green
    '#ec4899', // magenta/pink
    '#eab308', // yellow
    '#0f172a', // black
    '#f8fafc', // white
    '#f97316', // orange (new)
    '#a855f7', // purple (new)
    '#14b8a6', // teal (new)
    '#78716c'  // stone/brown (new)
  ];

  function colorSwatchPickerHtml(current, onPickExpr) {
    var cur = current || '#334155';
    var swatches = MP_COLOR_PRESETS.map(function (c) {
      var sel = String(c).toLowerCase() === String(cur).toLowerCase();
      return (
        '<button type="button" class="mp-swatch" data-c="' +
        c +
        '" style="width:36px;height:36px;border-radius:10px;border:2px solid ' +
        (sel ? '#38bdf8' : 'rgba(148,163,184,.4)') +
        ';background:' +
        c +
        ';cursor:pointer;box-shadow:' +
        (sel ? '0 0 0 2px rgba(56,189,248,.35)' : 'none') +
        '"></button>'
      );
    }).join('');
    return (
      '<div class="mp-color-picker" style="padding:8px 0">' +
      '<div style="font-size:13px;font-weight:800;margin-bottom:8px">' +
      _L('रंग चुनें', 'Select colour') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,36px);gap:10px;justify-content:start;margin-bottom:10px">' +
      swatches +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<label style="font-size:12px;color:#64748b">' +
      _L('कस्टम', 'Customise') +
      '</label>' +
      '<input type="color" class="mp-swatch-custom" value="' +
      cur +
      '" style="width:40px;height:32px;padding:0;border:1px solid var(--border2);border-radius:8px;background:transparent;cursor:pointer">' +
      '<span style="font-size:12px;color:#64748b">' +
      _L('चुना रंग', 'Chosen colour') +
      '</span>' +
      '<span class="mp-swatch-chosen" style="display:inline-block;width:36px;height:28px;border-radius:8px;border:1px solid var(--border2);background:' +
      cur +
      '"></span>' +
      '</div></div>'
    );
  }

  // Exports
  global.MPWorkHours = {
    normPhone: normPhone,
    empPhone: empPhone,
    parseHHMM: parseHHMM,
    formatHHMM: formatHHMM,
    segmentMinutes: segmentMinutes,
    segmentsHours: segmentsHours,
    legendHoursForCode: legendHoursForCode,
    isTimeLegendEnabled: isTimeLegendEnabled,
    getDayMeta: getDayMeta,
    setDayMetaLocal: setDayMetaLocal,
    persistDayMeta: persistDayMeta,
    loadMonthMeta: loadMonthMeta,
    computeDayHours: computeDayHours,
    sumMonthHours: sumMonthHours,
    identityChipHtml: identityChipHtml,
    getCareerHistory: getCareerHistory,
    careerHistoryHtml: careerHistoryHtml,
    monthRowAnnotation: monthRowAnnotation,
    timeSegmentsFormHtml: timeSegmentsFormHtml,
    readTimeSegmentsFromDom: readTimeSegmentsFromDom,
    bindTimeSegmentsUi: bindTimeSegmentsUi,
    detailHoursHtml: detailHoursHtml,
    MP_COLOR_PRESETS: MP_COLOR_PRESETS,
    colorSwatchPickerHtml: colorSwatchPickerHtml
  };

  // Global shortcuts used by HTML onclick / other modules
  global.mpComputeDayHours = computeDayHours;
  global.mpSumMonthHours = sumMonthHours;
  global.mpIdentityChipHtml = identityChipHtml;
  global.mpCareerHistoryHtml = careerHistoryHtml;
  global.mpGetCareerHistory = getCareerHistory;
  global.mpMonthRowAnnotation = monthRowAnnotation;
  global.mpIsTimeLegendEnabled = isTimeLegendEnabled;
  global.mpDetailHoursHtml = detailHoursHtml;
  global.mpPersistDayMeta = persistDayMeta;
  global.mpLoadMonthMeta = loadMonthMeta;
  global.mpBindTimeSegmentsUi = bindTimeSegmentsUi;
  global.mpReadTimeSegmentsFromDom = readTimeSegmentsFromDom;
  global.mpTimeSegmentsFormHtml = timeSegmentsFormHtml;
  global.MP_COLOR_PRESETS = MP_COLOR_PRESETS;


  /** After schedule renders, annotate name cells with company/emp code chip. */

  /** Career periods: company + emp code ranges (from emp.companyHistory or current). */
  function getCareerHistory(emp) {
    if (!emp) return [];
    var hist = [];
    try {
      if (Array.isArray(emp.companyHistory) && emp.companyHistory.length) {
        emp.companyHistory.forEach(function (h) {
          if (!h) return;
          hist.push({
            company: h.company || h.companyName || h.companyId || '',
            empCode: h.empCode || h.empId || h.code || '',
            from: h.from || h.start || h.joiningDate || '',
            to: h.to || h.end || ''
          });
        });
      }
    } catch (e) {}
    if (!hist.length) {
      var co = emp.company || emp.companyName || emp.companyId || '';
      // Prefer live team company from SESSION / manager profile when member is under a mgr
      try {
        if (typeof SESSION !== 'undefined' && SESSION) {
          if (SESSION.companyLabel) co = SESSION.companyLabel || SESSION.company || co;
          else if (SESSION.company && SESSION.role === 'manager') co = SESSION.company;
        }
        // If viewing another member, use that emp's company but fall back to mgr label
        if (!co && typeof getEmps === 'function') {
          var mgrId = emp.managerId || '';
          var mgr = (getEmps() || []).find(function (x) {
            return x && (String(x.phone || x.mobile || '').replace(/\D/g, '').slice(-10) === String(mgrId).replace(/\D/g, '').slice(-10));
          });
          if (mgr) co = mgr.company || mgr.companyName || mgr.companyLabel || co;
        }
      } catch (e) {}
      hist.push({
        company: co,
        empCode: emp.empId || emp.empCode || emp.code || '',
        from: emp.joiningDate || emp.doj || '',
        to: ''
      });
    } else {
      // Ensure last/current entry reflects latest company if empty
      try {
        var last = hist[hist.length - 1];
        if (last && !last.company && typeof SESSION !== 'undefined' && SESSION.companyLabel)
          last.company = SESSION.companyLabel;
      } catch (e) {}
    }
    // Enrich from scheduleMeta day nodes (phone key) if present
    try {
      var phone = empPhone(emp);
      var meta = metaCache();
      var found = {};
      Object.keys(meta || {}).forEach(function (mk) {
        var month = meta[mk] || {};
        var row = (phone && month['p:' + phone]) || month[emp.id] || month[String(emp.empId || '')] || null;
        if (!row || typeof row !== 'object') return;
        Object.keys(row).forEach(function (di) {
          var node = row[di];
          if (!node || typeof node !== 'object') return;
          var co = node.company || node.companyName || '';
          var code = node.empCode || node.empId || '';
          if (!co && !code) return;
          var key = co + '|' + code;
          var parts = String(mk).split('_');
          var y = parts[0], m = parts[1];
          var day = parseInt(di, 10);
          if (isNaN(day)) day = parseInt(di, 10) + 1;
          else day = day + 1;
          var ds = y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
          if (!found[key]) found[key] = { company: co, empCode: code, from: ds, to: ds };
          else {
            if (ds < found[key].from) found[key].from = ds;
            if (ds > found[key].to) found[key].to = ds;
          }
        });
      });
      Object.keys(found).forEach(function (k) {
        var f = found[k];
        var exists = hist.some(function (h) {
          return String(h.company) === String(f.company) && String(h.empCode) === String(f.empCode);
        });
        if (!exists) hist.push(f);
      });
    } catch (e) {}
    // Append current team company if different from last history row
    try {
      var liveCo = emp.company || emp.companyName || emp.companyLabel || '';
      var liveCode = emp.empId || emp.empCode || emp.code || '';
      try {
        if (typeof SESSION !== 'undefined' && SESSION && SESSION.role === 'manager' && (SESSION.companyLabel || SESSION.company)) {
          // Manager viewing member: show manager's company as current period if emp still on this team
          var mgrKey = (typeof _normMobileKey === 'function') ? _normMobileKey(SESSION.mobile || '') : '';
          var empMgr = (typeof _normMobileKey === 'function') ? _normMobileKey(emp.managerId || emp.managerMobile || '') : '';
          if (mgrKey && empMgr && mgrKey === empMgr) {
            liveCo = SESSION.companyLabel || SESSION.company || liveCo;
          }
        }
      } catch (e) {}
      if (liveCo || liveCode) {
        var last = hist.length ? hist[hist.length - 1] : null;
        if (!last || String(last.company) !== String(liveCo) || String(last.empCode) !== String(liveCode)) {
          hist.push({ company: liveCo, empCode: liveCode, from: '', to: '' });
        } else if (last && !last.to) {
          last.company = liveCo || last.company;
          last.empCode = liveCode || last.empCode;
        }
      }
    } catch (e) {}
    return hist;
  }

  function careerHistoryHtml(emp) {
    var rows = getCareerHistory(emp);
    if (!rows || !rows.length) {
      return (
        '<div style="margin-top:14px;padding:12px;border-radius:12px;border:1px dashed var(--border2);color:var(--muted2);font-size:12px">' +
        _L('अभी Company / Emp Code इतिहास नहीं', 'No company / emp code history yet') +
        '</div>'
      );
    }
    var body = rows
      .map(function (h) {
        var co = h.company ? String(h.company) : '—';
        var code = h.empCode ? String(h.empCode) : '—';
        var from = h.from || '—';
        var to = h.to || _L('अब तक', 'Present');
        return (
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;padding:10px 12px;border-radius:10px;background:var(--card);border:1px solid var(--border);margin-bottom:8px">' +
          '<div style="font-size:11px;color:var(--muted2)">🏢 Company</div><div style="font-size:13px;font-weight:800;color:var(--text)">' +
          esc(co) +
          '</div>' +
          '<div style="font-size:11px;color:var(--muted2)">🪪 Emp Code</div><div style="font-size:13px;font-weight:800;color:var(--text)">' +
          esc(code) +
          '</div>' +
          '<div style="font-size:11px;color:var(--muted2)">📅 ' +
          _L('से', 'From') +
          '</div><div style="font-size:12px;font-weight:700">' +
          esc(from) +
          '</div>' +
          '<div style="font-size:11px;color:var(--muted2)">📅 ' +
          _L('तक', 'To') +
          '</div><div style="font-size:12px;font-weight:700">' +
          esc(to) +
          '</div></div>'
        );
      })
      .join('');
    return (
      '<div class="mp-career-hist" style="margin-top:16px">' +
      '<div style="font-size:14px;font-weight:900;color:var(--text);margin-bottom:8px">🏢 ' +
      _L('Company / Emp Code इतिहास', 'Company / Emp Code history') +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted2);margin-bottom:10px;line-height:1.4">' +
      _L(
        'जब आप Company या Emp Code बदलते हैं, पुरानी अवधि यहाँ सुरक्षित रहती है। Schedule ग्रिड में नहीं दिखती।',
        'When you change company or emp code, past periods stay here. Not shown on the schedule grid.'
      ) +
      '</div>' +
      body +
      '</div>'
    );
  }


  function annotateScheduleIdentity() {
    try {
      var tbl = document.getElementById('schedTbl');
      if (!tbl) return;
      var emps = typeof getEmps === 'function' ? getEmps() : [];
      var byId = {};
      (emps || []).forEach(function (e) {
        if (e && e.id) byId[String(e.id)] = e;
      });
      tbl.querySelectorAll('td[data-empid], th[data-empid], .sched-emp-name, [data-empname]').forEach(function (el) {
        var id = el.getAttribute('data-empid');
        if (!id) return;
        if (el.querySelector('.mp-id-chip')) return;
        var emp = byId[String(id)];
        if (!emp) return;
        var chip = identityChipHtml(emp);
        if (!chip) return;
        // Only on first column-ish name cells
        var text = (el.textContent || '').trim();
        if (text.length > 40) return;
        el.insertAdjacentHTML('beforeend', chip);
      });
    } catch (e) {}
  }

  function hookScheduleRender() {
    try {
      if (global._mpSchedIdHooked) return;
      global._mpSchedIdHooked = true;
      var orig = global.renderSchedule;
      if (typeof orig === 'function') {
        global.renderSchedule = function () {
          var r = orig.apply(this, arguments);
          try {
            var mk = null;
            try {
              var d = new Date();
              mk = d.getFullYear() + '_' + String(d.getMonth() + 1).padStart(2, '0');
            } catch (e) {}
            if (mk && typeof loadMonthMeta === 'function') loadMonthMeta(mk);
            /* v6.0.5: do not inject Company/Emp chips into schedule grid (overspill) */
          } catch (e) {}
          return r;
        };
      }
    } catch (e) {}
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hookScheduleRender);
    } else {
      setTimeout(hookScheduleRender, 0);
    }
  }

  global.mpAnnotateScheduleIdentity = annotateScheduleIdentity;

})(typeof window !== 'undefined' ? window : this);
