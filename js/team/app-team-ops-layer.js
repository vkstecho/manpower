/**
 * Man Power — Ops Layer (blog fix-stack completion)
 * 1) Skill-aware auto-schedule preference (score helper)
 * 2) Knowledge-loss alerts
 * 3) Digital process checklists (manager-editable, multi-industry)
 * 4) Training assignment bridge → Mentor modules
 */
(function (global) {
  'use strict';

  function _L(hi, en) {
    try { if (typeof L === 'function') return L(hi, en); } catch (e) {}
    return en || hi;
  }
  function _esc(s) {
    if (typeof escHtml === 'function') return escHtml(String(s == null ? '' : s));
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _canManage() {
    try {
      if (typeof isAdmin === 'function' && isAdmin()) return true;
      if (typeof isAdminOrMgr === 'function' && isAdminOrMgr()) return true;
      if (typeof isMgr === 'function' && isMgr()) return true;
    } catch (e) {}
    return false;
  }
  function _emps() {
    try {
      if (typeof getEmps === 'function') return getEmps() || [];
      if (global._cache && Array.isArray(global._cache.employees)) {
        return global._cache.employees.filter(function (e) {
          return e && e.status !== 'resigned' && e.status !== 'left' && e.status !== 'left_team';
        });
      }
    } catch (e) {}
    return [];
  }
  function _who() {
    try { return String((SESSION && (SESSION.name || SESSION.mobile || SESSION.uid)) || '').slice(0, 40); } catch (e) { return ''; }
  }

  // ── 1) Skill score for auto-schedule preference ──────────────────────────
  /** Higher = more preferred for critical coverage. Used by autoGenSchedule sort. */
  function skillScore(emp) {
    if (!emp) return 0;
    var skills = (emp.skills && typeof emp.skills === 'object') ? emp.skills : {};
    var defs = [];
    try {
      if (global.MP_SKILLS && typeof global.MP_SKILLS.getSkillDefsSync === 'function') {
        defs = global.MP_SKILLS.getSkillDefsSync() || [];
      }
    } catch (e) {}
    var score = 0;
    var critIds = {};
    defs.forEach(function (d) { if (d.critical) critIds[d.id] = true; });
    Object.keys(skills).forEach(function (sid) {
      var st = skills[sid];
      var status = typeof st === 'string' ? st : (st && st.status);
      var pts = 0;
      if (status === 'canTrain') pts = 4;
      else if (status === 'competent') pts = 3;
      else if (status === 'practising') pts = 1;
      if (critIds[sid]) pts *= 2; // critical skills weigh more
      score += pts;
    });
    return score;
  }

  /** Compare for sort: higher skill first (return negative if a better than b) */
  function skillSortCmp(a, b) {
    return skillScore(b) - skillScore(a);
  }

  // ── 2) Knowledge-loss alert ──────────────────────────────────────────────
  function getStrongSkills(emp) {
    var skills = (emp && emp.skills && typeof emp.skills === 'object') ? emp.skills : {};
    var defs = [];
    try {
      if (global.MP_SKILLS && global.MP_SKILLS.getSkillDefsSync) defs = global.MP_SKILLS.getSkillDefsSync() || [];
    } catch (e) {}
    var labelOf = {};
    defs.forEach(function (d) { labelOf[d.id] = d.labelHi || d.label || d.id; });
    var out = [];
    Object.keys(skills).forEach(function (sid) {
      var st = skills[sid];
      var status = typeof st === 'string' ? st : (st && st.status);
      if (status === 'competent' || status === 'canTrain') {
        out.push({ id: sid, label: labelOf[sid] || sid, status: status });
      }
    });
    return out;
  }

  /** Remaining coverage for a skill among active employees (excluding excludeEmpId) */
  function remainingSkillCoverage(skillId, excludeEmpId) {
    var n = 0;
    _emps().forEach(function (e) {
      if (!e || String(e.id) === String(excludeEmpId)) return;
      var skills = e.skills || {};
      var st = skills[skillId];
      var status = typeof st === 'string' ? st : (st && st.status);
      if (status === 'competent' || status === 'canTrain') n++;
    });
    return n;
  }

  function analyzeKnowledgeLoss(emp) {
    if (!emp) return null;
    var strong = getStrongSkills(emp);
    if (!strong.length) return null;
    var gaps = strong.map(function (s) {
      var left = remainingSkillCoverage(s.id, emp.id);
      return {
        skillId: s.id,
        label: s.label,
        status: s.status,
        remaining: left,
        underCovered: left === 0
      };
    });
    var under = gaps.filter(function (g) { return g.underCovered; });
    return {
      empName: emp.name || emp.empId || '',
      empId: emp.id,
      strongCount: strong.length,
      gaps: gaps,
      underCovered: under,
      hasRisk: under.length > 0 || strong.length > 0
    };
  }

  function showKnowledgeLossAlert(analysis, reason) {
    if (!analysis || !analysis.hasRisk) return;
    var existing = document.getElementById('knowledgeLossAlert');
    if (existing) existing.remove();

    var underHtml = analysis.underCovered.length
      ? analysis.underCovered.map(function (g) {
          return '<li style="margin:6px 0"><b style="color:#f87171">' + _esc(g.label) + '</b> — ' +
            _L('दूसरा सक्षम / ट्रेनर नहीं बचा', 'no other Competent / Can Train left') + '</li>';
        }).join('')
      : '';
    var otherHtml = analysis.gaps.filter(function (g) { return !g.underCovered; }).map(function (g) {
      return '<li style="margin:4px 0;color:var(--muted2)">' + _esc(g.label) + ' — ' +
        g.remaining + ' ' + _L('अन्य लोग अभी सक्षम', 'others still skilled') + '</li>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'knowledgeLossAlert';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10060;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
    ov.innerHTML =
      '<div style="width:100%;max-width:480px;background:var(--panel,#111d2e);border-radius:18px 18px 0 0;padding:18px 16px 22px;box-shadow:0 -8px 40px rgba(0,0,0,.4);color:var(--text)">' +
        '<div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:4px">⚠️ ' + _L('ज्ञान हानि अलर्ट', 'Knowledge-loss alert') + '</div>' +
        '<div style="font-weight:900;font-size:16px;margin-bottom:6px">' + _esc(analysis.empName) + '</div>' +
        '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">' +
          (reason || _L('यह व्यक्ति Competent / Can Train स्किल्स रखता है।', 'This person holds Competent / Can Train skills.')) +
        '</div>' +
        (underHtml
          ? '<div style="background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.35);border-radius:12px;padding:12px;margin-bottom:10px">' +
              '<div style="font-size:12px;font-weight:800;color:#f87171;margin-bottom:6px">' + _L('अब कोई और सक्षम व्यक्ति नहीं — ये स्किल्स', 'Skills with no other Competent person') + '</div>' +
              '<ul style="margin:0;padding-left:18px;font-size:13px">' + underHtml + '</ul></div>'
          : '') +
        (otherHtml
          ? '<div style="font-size:12px;margin-bottom:12px"><div style="font-weight:700;margin-bottom:4px">' + _L('अन्य स्किल्स (अभी सुरक्षित)', 'Other skills (still covered)') + '</div><ul style="margin:0;padding-left:18px">' + otherHtml + '</ul></div>'
          : '') +
        '<div style="font-size:11px;color:var(--muted2);margin-bottom:14px;line-height:1.45">' +
          _L('सुझाव: Skill Matrix में ट्रेनिंग असाइन करें, या PackLink / Mentor से बैकअप तैयार करें।',
             'Suggestion: assign training in Skill Matrix, or prepare backup via PackLink / Mentor.') +
        '</div>' +
        '<button type="button" id="klAlertClose" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit">' +
          _L('समझ गया', 'Got it') +
        '</button>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('klAlertClose').onclick = function () { ov.remove(); };
    ov.addEventListener('click', function (ev) { if (ev.target === ov) ov.remove(); });
  }

  /** Call when employee is marked left / resigned / long leave */
  function onEmployeeLeaving(emp, reasonText) {
    try {
      var analysis = analyzeKnowledgeLoss(emp);
      if (analysis && analysis.hasRisk) showKnowledgeLossAlert(analysis, reasonText);
    } catch (e) { console.warn('[knowledge-loss]', e); }
  }

  // ── 3) Digital process checklists ────────────────────────────────────────
  var SEED_CHECKLISTS = [
    {
      id: 'shift_handover',
      title: 'Shift Handover',
      titleHi: 'शिफ्ट हैंडओवर',
      items: [
        { id: 'i1', text: 'Machine status shared with incoming shift' },
        { id: 'i2', text: 'Open issues / defects noted' },
        { id: 'i3', text: 'Material / film stock confirmed' },
        { id: 'i4', text: 'Safety / PPE check done' },
        { id: 'i5', text: 'Logbook / system entry completed' }
      ]
    },
    {
      id: 'boat_change',
      title: 'Boat Change / Critical Setup',
      titleHi: 'बोट चेंज / क्रिटिकल सेटअप',
      items: [
        { id: 'i1', text: 'Thermal discipline followed' },
        { id: 'i2', text: 'Wire alignment verified' },
        { id: 'i3', text: 'Vacuum / leak check done' },
        { id: 'i4', text: 'Recipe / current confirmed' },
        { id: 'i5', text: 'First roll quality checked' }
      ]
    }
  ];

  var _checklistCache = null;

  async function loadChecklists() {
    try {
      if (typeof fbGet === 'function') {
        var raw = await fbGet('settings/checklists');
        if (Array.isArray(raw) && raw.length) {
          _checklistCache = raw;
          return raw.slice();
        }
      }
    } catch (e) {}
    _checklistCache = SEED_CHECKLISTS.map(function (c) {
      return { id: c.id, title: c.title, titleHi: c.titleHi, items: c.items.map(function (i) { return Object.assign({}, i); }) };
    });
    return _checklistCache.slice();
  }

  async function saveChecklists(list) {
    if (!_canManage()) return false;
    _checklistCache = list;
    try {
      if (typeof fbSet === 'function') await fbSet('settings/checklists', list);
      try { toast(_L('✅ चेकलिस्ट सेव', '✅ Checklists saved')); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  async function saveChecklistCompletion(payload) {
    var id = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    var data = Object.assign({ id: id, completedAt: new Date().toISOString(), completedBy: _who() }, payload);
    try {
      if (typeof fbSet === 'function') await fbSet('checklistCompletions/' + id, data);
      try { toast(_L('✅ चेकलिस्ट सेव हो गई', '✅ Checklist saved')); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  async function loadChecklistCompletions() {
    try {
      if (typeof fbGet === 'function') {
        var raw = await fbGet('checklistCompletions');
        if (!raw || typeof raw !== 'object') return [];
        return Object.keys(raw).map(function (k) {
          var v = raw[k] || {};
          v.id = v.id || k;
          return v;
        }).sort(function (a, b) {
          return String(b.completedAt || '').localeCompare(String(a.completedAt || ''));
        });
      }
    } catch (e) { console.warn('[checklists] history', e); }
    return [];
  }

  function openChecklistsHub() {
    var existing = document.getElementById('checklistsHub');
    if (existing) existing.remove();

    var ov = document.createElement('div');
    ov.id = 'checklistsHub';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1300;background:var(--bg,#0a0f1a);display:flex;flex-direction:column;overflow:hidden';

    ov.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;padding:10px 12px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap">' +
        '<button type="button" id="clHubBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
        '<div style="flex:1;min-width:120px"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('प्रोसेस चेकलिस्ट', 'Process Checklists') + '</div>' +
        '<div style="font-size:10px;color:var(--muted2)">' + _L('शिफ्ट हैंडओवर · क्रिटिकल सेटअप · कस्टम', 'Shift handover · critical setup · custom') + '</div></div>' +
        '<button type="button" id="clHubHistory" style="background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.35);border-radius:10px;padding:7px 10px;color:#38bdf8;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">📋 ' + _L('इतिहास', 'History') + '</button>' +
        (_canManage() ? '<button type="button" id="clHubEdit" style="background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.4);border-radius:10px;padding:7px 11px;color:#f97316;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">✏️ ' + _L('एडिट', 'Edit') + '</button>' : '') +
      '</div>' +
      '<div id="clHubBody" style="flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch"></div>';

    document.body.appendChild(ov);
    document.getElementById('clHubBack').onclick = function () { ov.remove(); };
    document.getElementById('clHubHistory').onclick = function () { openChecklistHistory(); };

    loadChecklists().then(function (list) {
      var body = document.getElementById('clHubBody');
      if (!body) return;
      if (!list.length) {
        body.innerHTML = '<div style="text-align:center;color:var(--muted2);padding:40px 16px">' + _L('अभी कोई चेकलिस्ट नहीं है', 'No checklists yet') + '</div>';
        return;
      }
      body.innerHTML = list.map(function (cl) {
        return '<button type="button" class="cl-run-btn" data-id="' + _esc(cl.id) + '" style="width:100%;text-align:left;padding:16px;margin-bottom:12px;border-radius:14px;border:1.5px solid var(--border2);background:var(--card);color:var(--text);cursor:pointer;font-family:inherit">' +
          '<div style="font-weight:900;font-size:15px">' + _esc(_L(cl.titleHi || cl.title, cl.title)) + '</div>' +
          '<div style="font-size:11px;color:var(--muted2);margin-top:4px">' + (cl.items || []).length + ' ' + _L('आइटम', 'items') + ' · ' + _L('टैप करके भरें', 'tap to fill') + '</div>' +
        '</button>';
      }).join('');
      body.querySelectorAll('.cl-run-btn').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute('data-id');
          var cl = list.find(function (x) { return x.id === id; });
          if (cl) openChecklistRunner(cl);
        };
      });
    });

    var editBtn = document.getElementById('clHubEdit');
    if (editBtn) editBtn.onclick = function () { openChecklistEditor(); };
  }

  function openChecklistHistory() {
    var ov = document.createElement('div');
    ov.id = 'checklistHistory';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1310;background:var(--bg);display:flex;flex-direction:column';
    ov.innerHTML =
      '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">' +
        '<button type="button" id="clHistBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
        '<div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('चेकलिस्ट इतिहास', 'Checklist history') + '</div>' +
      '</div>' +
      '<div id="clHistBody" style="flex:1;overflow:auto;padding:14px;color:var(--muted2);text-align:center;padding-top:40px">' + _L('लोड हो रहा है…', 'Loading…') + '</div>';
    document.body.appendChild(ov);
    document.getElementById('clHistBack').onclick = function () { ov.remove(); };

    loadChecklistCompletions().then(function (rows) {
      var body = document.getElementById('clHistBody');
      if (!body) return;
      if (!rows.length) {
        body.innerHTML = '<div style="padding:40px 16px">' + _L('अभी कोई सेव नहीं हुई', 'No saved checklists yet') + '</div>';
        return;
      }
      // Managers see all; members see own if we can match
      var me = '';
      try { me = String((SESSION && (SESSION.name || SESSION.mobile || SESSION.uid)) || ''); } catch (e) {}
      var filtered = rows;
      if (!_canManage() && me) {
        filtered = rows.filter(function (r) {
          return String(r.completedBy || '').indexOf(me) >= 0 || String(r.empId || '') === me;
        });
      }
      if (!filtered.length) {
        body.innerHTML = '<div style="padding:40px 16px">' + _L('आपकी कोई सेव नहीं मिली', 'No saves found for you') + '</div>';
        return;
      }
      body.style.textAlign = 'left';
      body.style.paddingTop = '14px';
      body.innerHTML = filtered.slice(0, 50).map(function (r) {
        var when = r.completedAt ? new Date(r.completedAt).toLocaleString() : '—';
        var score = (r.done != null && r.total) ? (r.done + '/' + r.total) : '—';
        var title = r.checklistTitle || r.checklistId || 'Checklist';
        return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
          '<div style="font-weight:800;color:var(--text);font-size:14px">' + _esc(title) + '</div>' +
          '<div style="font-size:11px;color:var(--muted2);margin-top:4px">' + _esc(when) + '</div>' +
          '<div style="font-size:12px;margin-top:6px;color:var(--text)">' +
            _L('द्वारा', 'By') + ': <b>' + _esc(r.completedBy || '—') + '</b> · ' +
            _L('पूर्ण', 'Done') + ': <b>' + _esc(score) + '</b>' +
          '</div>' +
          (r.note ? '<div style="font-size:12px;margin-top:6px;color:var(--muted2)">' + _esc(r.note) + '</div>' : '') +
        '</div>';
      }).join('');
    });
  }

  function openChecklistRunner(cl) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:1310;background:var(--bg);display:flex;flex-direction:column';
    var items = (cl.items || []).map(function (it) {
      return '<label style="display:flex;gap:12px;align-items:flex-start;padding:14px;margin-bottom:8px;border-radius:12px;background:var(--card);border:1px solid var(--border);cursor:pointer">' +
        '<input type="checkbox" class="cl-item-check" data-id="' + _esc(it.id) + '" style="width:20px;height:20px;margin-top:2px;accent-color:#22c55e;flex-shrink:0">' +
        '<span style="font-size:14px;font-weight:600;color:var(--text);line-height:1.4">' + _esc(it.text) + '</span></label>';
    }).join('');

    ov.innerHTML =
      '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">' +
        '<button type="button" id="clRunBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">←</button>' +
        '<div style="font-weight:900;font-size:15px;color:var(--text)">' + _esc(_L(cl.titleHi || cl.title, cl.title)) + '</div>' +
      '</div>' +
      '<div style="flex:1;overflow:auto;padding:14px">' + items +
        '<div style="margin-top:12px"><label style="font-size:12px;font-weight:700;color:var(--muted2)">' + _L('नोट (वैकल्पिक)', 'Note (optional)') + '</label>' +
        '<textarea id="clRunNote" rows="2" style="width:100%;margin-top:6px;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;font-size:13px"></textarea></div>' +
      '</div>' +
      '<div style="padding:12px;border-top:1px solid var(--border)">' +
        '<button type="button" id="clRunSave" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit">' +
          _L('✅ पूरा करें और सेव करें', '✅ Complete & save') +
        '</button></div>';

    document.body.appendChild(ov);
    document.getElementById('clRunBack').onclick = function () { ov.remove(); };
    document.getElementById('clRunSave').onclick = async function () {
      var checks = {};
      var done = 0, total = 0;
      ov.querySelectorAll('.cl-item-check').forEach(function (cb) {
        total++;
        checks[cb.getAttribute('data-id')] = !!cb.checked;
        if (cb.checked) done++;
      });
      if (done < total) {
        if (!confirm(_L('कुछ आइटम अभी टिक नहीं हैं। फिर भी सेव करें?', 'Some items are still unchecked. Save anyway?'))) return;
      }
      var note = (document.getElementById('clRunNote') && document.getElementById('clRunNote').value) || '';
      var empId = '';
      try { empId = (SESSION && (SESSION.empId || SESSION.uid || SESSION.mobile)) || ''; } catch (e) {}
      await saveChecklistCompletion({
        checklistId: cl.id,
        checklistTitle: cl.title,
        checks: checks,
        done: done,
        total: total,
        note: note,
        empId: empId
      });
      ov.remove();
    };
  }

  function openChecklistEditor() {
    if (!_canManage()) return;
    loadChecklists().then(function (list) {
      var defs = list.map(function (c) {
        return {
          id: c.id,
          title: c.title,
          titleHi: c.titleHi || '',
          itemsText: (c.items || []).map(function (i) { return i.text; }).join('\n')
        };
      });
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:1320;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center';
      ov.innerHTML =
        '<div style="width:100%;max-width:520px;max-height:92vh;background:var(--panel);border-radius:18px 18px 0 0;display:flex;flex-direction:column">' +
          '<div style="padding:14px 16px;border-bottom:1px solid var(--border);font-weight:900;font-size:15px;color:var(--text)">' +
            _L('चेकलिस्ट एडिट (कोई भी इंडस्ट्री)', 'Edit checklists (any industry)') +
            '<button type="button" id="clEdClose" style="float:right;background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--text)">✕</button>' +
          '</div>' +
          '<div id="clEdList" style="flex:1;overflow:auto;padding:12px"></div>' +
          '<div style="padding:12px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px">' +
            '<button type="button" id="clEdAdd" style="padding:12px;border-radius:12px;border:1.5px dashed rgba(56,189,248,.45);background:rgba(56,189,248,.08);color:#38bdf8;font-weight:800;cursor:pointer;font-family:inherit">＋ ' + _L('नई चेकलिस्ट', 'New checklist') + '</button>' +
            '<button type="button" id="clEdSave" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;cursor:pointer;font-family:inherit">💾 ' + _L('सेव करें', 'Save') + '</button>' +
          '</div></div>';
      document.body.appendChild(ov);

      function render() {
        var box = document.getElementById('clEdList');
        box.innerHTML = defs.map(function (d, i) {
          return '<div class="cl-ed-row" data-i="' + i + '" style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<input class="cl-ed-title" value="' + _esc(d.title) + '" placeholder="' + _L('शीर्षक', 'Title') + '" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-weight:700;margin-bottom:6px;font-family:inherit">' +
            '<textarea class="cl-ed-items" rows="4" placeholder="' + _L('हर लाइन पर एक आइटम', 'One item per line') + '" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-size:12px;font-family:inherit">' + _esc(d.itemsText) + '</textarea>' +
            '<button type="button" class="cl-ed-del" data-i="' + i + '" style="margin-top:6px;padding:6px 10px;border-radius:8px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.1);color:#f43f5e;font-weight:700;cursor:pointer;font-family:inherit;font-size:11px">🗑 ' + _L('हटाएँ', 'Delete') + '</button>' +
          '</div>';
        }).join('') || '<div style="color:var(--muted2);text-align:center;padding:20px">' + _L('खाली', 'Empty') + '</div>';
        box.querySelectorAll('.cl-ed-del').forEach(function (b) {
          b.onclick = function () {
            defs.splice(parseInt(b.getAttribute('data-i'), 10), 1);
            render();
          };
        });
      }
      function collect() {
        var rows = ov.querySelectorAll('.cl-ed-row');
        var out = [];
        rows.forEach(function (row, i) {
          var title = (row.querySelector('.cl-ed-title').value || '').trim();
          if (!title) return;
          var lines = (row.querySelector('.cl-ed-items').value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
          var prev = defs[i] || {};
          out.push({
            id: prev.id || ('cl_' + Date.now() + '_' + i),
            title: title,
            titleHi: prev.titleHi || '',
            items: lines.map(function (text, j) { return { id: 'i' + (j + 1), text: text }; })
          });
        });
        return out;
      }
      render();
      document.getElementById('clEdClose').onclick = function () { ov.remove(); };
      document.getElementById('clEdAdd').onclick = function () {
        defs = collect().map(function (c) {
          return { id: c.id, title: c.title, titleHi: c.titleHi, itemsText: (c.items || []).map(function (i) { return i.text; }).join('\n') };
        });
        defs.push({ id: 'cl_' + Date.now(), title: '', titleHi: '', itemsText: '' });
        render();
      };
      document.getElementById('clEdSave').onclick = async function () {
        var next = collect();
        if (await saveChecklists(next)) {
          ov.remove();
          var hub = document.getElementById('checklistsHub');
          if (hub) { hub.remove(); openChecklistsHub(); }
        }
      };
    });
  }

  // ── 4) Training assignment → Mentor ──────────────────────────────────────
  var MENTOR_MODULES = [
    { id: 'met_train_pro', title: 'Met Train PRO', titleHi: 'मेट ट्रेन प्रो', url: 'https://mentor.vkstech.com/Met_Train_Pro/met_train_pro.html' },
    { id: 'mentor_home', title: 'Mentor — guidance & free modules', titleHi: 'मेंटर — गाइडेंस और फ्री मॉड्यूल', url: 'https://mentor.vkstech.com/mentor.html' },
    { id: 'kpi_dashboard', title: 'KPI Dashboard', titleHi: 'KPI डैशबोर्ड', url: 'https://mentor.vkstech.com/kpi_dashboard.html' },
    { id: 'excel_expert', title: 'Excel Expert', titleHi: 'एक्सेल एक्सपर्ट', url: 'https://mentor.vkstech.com/' },
    { id: 'time_study', title: 'Time Study', titleHi: 'टाइम स्टडी', url: 'https://mentor.vkstech.com/' }
  ];

  function _findEmpById(empId) {
    var emp = null;
    try {
      var all = (global._cache && global._cache.employees) || [];
      emp = all.find(function (e) { return e && String(e.id) === String(empId); });
      if (!emp && typeof getEmps === 'function') emp = (getEmps() || []).find(function (e) { return e && String(e.id) === String(empId); });
    } catch (e) {}
    return emp;
  }

  function _modTitle(mod) {
    if (!mod) return '';
    return _L(mod.titleHi || mod.title, mod.title);
  }

  async function assignTraining(empId, moduleId) {
    if (!_canManage()) return false;
    var mod = MENTOR_MODULES.find(function (m) { return m.id === moduleId; });
    if (!mod) return false;
    var emp = _findEmpById(empId);
    if (!emp || !emp.id) {
      try { toast(_L('कर्मचारी नहीं मिला', 'Employee not found')); } catch (e) {}
      return false;
    }
    var list = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments.slice() : [];
    if (list.some(function (t) { return t.moduleId === moduleId && t.status !== 'completed'; })) {
      try { toast(_L('यह ट्रेनिंग पहले से असाइन है', 'Already assigned')); } catch (e) {}
      return false;
    }
    list.push({
      moduleId: mod.id,
      title: mod.title,
      titleHi: mod.titleHi || '',
      url: mod.url,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      assignedBy: _who()
    });
    emp.trainingAssignments = list;
    try {
      if (typeof fbUpdate === 'function') await fbUpdate('employees/' + emp.id, { trainingAssignments: list });
      try { toast(_L('✅ ट्रेनिंग असाइन: ', '✅ Training assigned: ') + _modTitle(mod)); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  async function removeTrainingAssignment(empId, moduleId) {
    if (!_canManage()) {
      try { toast(_L('केवल मैनेजर हटा सकता है', 'Only manager can remove')); } catch (e) {}
      return false;
    }
    var emp = _findEmpById(empId);
    if (!emp || !emp.id) return false;
    var list = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments.slice() : [];
    var next = list.filter(function (t) { return t.moduleId !== moduleId; });
    if (next.length === list.length) return false;
    emp.trainingAssignments = next;
    try {
      if (typeof fbUpdate === 'function') await fbUpdate('employees/' + emp.id, { trainingAssignments: next });
      try { toast(_L('🗑️ असाइनमेंट हटाया', '🗑️ Assignment removed')); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  async function markTrainingComplete(empId, moduleId) {
    var emp = _findEmpById(empId);
    if (!emp) return false;
    var list = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments.slice() : [];
    var completedAt = new Date().toISOString();
    list = list.map(function (t) {
      if (t.moduleId === moduleId) {
        return Object.assign({}, t, { status: 'completed', completedAt: completedAt });
      }
      return t;
    });
    emp.trainingAssignments = list;
    var ok = false;
    try {
      if (typeof fbUpdate === 'function') {
        await fbUpdate('employees/' + emp.id, { trainingAssignments: list });
        ok = true;
      }
    } catch (e) {
      // Members often cannot write employees/* — fall back to trainingCompletions path
      ok = false;
    }
    try {
      if (typeof fbSet === 'function') {
        await fbSet('trainingCompletions/' + String(emp.id) + '_' + String(moduleId), {
          empId: emp.id,
          moduleId: moduleId,
          status: 'completed',
          completedAt: completedAt,
          completedBy: _who()
        });
        ok = true;
      }
    } catch (e2) {}
    if (ok) {
      try { toast(_L('✅ ट्रेनिंग पूर्ण चिह्नित', '✅ Marked complete')); } catch (e) {}
      return true;
    }
    try { toast(_L('❌ सेव नहीं हो सका — अनुमति जाँचें', '❌ Could not save — check permissions')); } catch (e) {}
    return false;
  }

  async function _mergeTrainingCompletions(emp) {
    if (!emp || !emp.id) return emp;
    try {
      if (typeof fbGet !== 'function') return emp;
      var raw = await fbGet('trainingCompletions');
      if (!raw || typeof raw !== 'object') return emp;
      var list = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments.slice() : [];
      Object.keys(raw).forEach(function (k) {
        var r = raw[k];
        if (!r || String(r.empId) !== String(emp.id)) return;
        if (r.status !== 'completed') return;
        var found = false;
        list = list.map(function (t) {
          if (t.moduleId === r.moduleId) {
            found = true;
            return Object.assign({}, t, { status: 'completed', completedAt: r.completedAt || t.completedAt });
          }
          return t;
        });
        if (!found && r.moduleId) {
          list.push({
            moduleId: r.moduleId,
            title: r.title || r.moduleId,
            status: 'completed',
            completedAt: r.completedAt,
            assignedAt: r.completedAt
          });
        }
      });
      emp.trainingAssignments = list;
    } catch (e) {}
    return emp;
  }

  function _currentEmpForSession() {
    try {
      var phone = '';
      try { phone = String(SESSION && (SESSION.mobile || SESSION.uid || SESSION.phone) || '').replace(/\D/g, '').slice(-10); } catch (e) {}
      var all = (global._cache && global._cache.employees) || [];
      if (typeof getEmps === 'function') {
        try { all = (getEmps() || []).concat(all); } catch (e2) {}
      }
      var seen = {};
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.id || seen[e.id]) continue;
        seen[e.id] = true;
        var ep = String(e.phone || e.mobile || '').replace(/\D/g, '').slice(-10);
        if (phone && ep === phone) return e;
        if (SESSION && SESSION.empId && String(e.empId) === String(SESSION.empId)) return e;
        if (SESSION && SESSION.empKey && String(e.id) === String(SESSION.empKey)) return e;
      }
    } catch (e) {}
    return null;
  }

  /** Member view: my assigned trainings */
  function openMyTraining() {
    var emp = _currentEmpForSession();
    var ov = document.createElement('div');
    ov.id = 'myTrainingHub';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1300;background:var(--bg);display:flex;flex-direction:column';
    // Merge member completions written outside employees/* (permission fallback)
    if (emp) {
      try {
        _mergeTrainingCompletions(emp).then(function (e2) {
          if (!e2) return;
          emp = e2;
          try {
            var body = document.getElementById('myTrainingBody');
            if (!body) return;
            var assigns2 = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments : [];
            // soft refresh list if still open
            if (typeof window._renderMyTrainingBody === 'function') window._renderMyTrainingBody(body, emp, assigns2, ov);
          } catch (eR) {}
        });
      } catch (eM) {}
    }
    var assigns = (emp && Array.isArray(emp.trainingAssignments)) ? emp.trainingAssignments : [];

    var bodyHtml;
    if (!emp) {
      bodyHtml = '<div style="text-align:center;padding:40px 16px;color:var(--muted2)">' +
        _L('आपकी प्रोफ़ाइल टीम से लिंक नहीं मिली। मैनेजर से मोबाइल मैच करवाएँ।', 'Your profile is not linked to the team. Ask manager to match your mobile.') +
        '</div>';
    } else if (!assigns.length) {
      bodyHtml = '<div style="text-align:center;padding:40px 16px;color:var(--muted2)">' +
        '<div style="font-size:40px;margin-bottom:10px">🎓</div>' +
        _L('अभी कोई ट्रेनिंग असाइन नहीं है', 'No training assigned yet') +
        '</div>';
    } else {
      bodyHtml = assigns.map(function (t) {
        var done = t.status === 'completed';
        var title = _L(t.titleHi || t.title, t.title);
        return '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:12px">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
            '<div style="font-weight:900;font-size:15px;color:var(--text);flex:1">' + _esc(title) + '</div>' +
            '<span style="font-size:10px;font-weight:800;padding:4px 8px;border-radius:8px;background:' +
              (done ? 'rgba(34,197,94,.15);color:#22c55e' : 'rgba(56,189,248,.15);color:#38bdf8') + '">' +
              (done ? _L('पूर्ण', 'Done') : _L('असाइन', 'Assigned')) + '</span>' +
          '</div>' +
          (t.assignedAt ? '<div style="font-size:11px;color:var(--muted2);margin-bottom:10px">' + _L('असाइन तिथि', 'Assigned') + ': ' + _esc(new Date(t.assignedAt).toLocaleDateString()) + '</div>' : '') +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            (t.url ? '<button type="button" class="mytr-open" data-url="' + _esc(t.url) + '" style="flex:1;min-width:120px;padding:10px;border-radius:10px;border:none;background:#0ea5e9;color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:13px">' + _L('खोलें', 'Open') + '</button>' : '') +
            (!done ? '<button type="button" class="mytr-done" data-mod="' + _esc(t.moduleId) + '" style="padding:10px 14px;border-radius:10px;border:1px solid rgba(34,197,94,.4);background:rgba(34,197,94,.12);color:#22c55e;font-weight:800;cursor:pointer;font-family:inherit;font-size:13px">' + _L('पूर्ण चिह्नित', 'Mark done') + '</button>' : '') +
          '</div></div>';
      }).join('');
    }

    ov.innerHTML =
      '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">' +
        '<button type="button" id="mytrBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
        '<div style="flex:1"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('मेरी ट्रेनिंग', 'My Training') + '</div>' +
        '<div style="font-size:10px;color:var(--muted2)">' + _L('मैनेजर द्वारा असाइन किए गए मेंटर मॉड्यूल', 'Mentor modules assigned by manager') + '</div></div>' +
      '</div>' +
      '<div style="flex:1;overflow:auto;padding:14px">' + bodyHtml + '</div>';

    document.body.appendChild(ov);
    document.getElementById('mytrBack').onclick = function () { ov.remove(); };
    ov.querySelectorAll('.mytr-open').forEach(function (btn) {
      btn.onclick = function () {
        var u = btn.getAttribute('data-url');
        if (u) try { window.open(u, '_blank', 'noopener'); } catch (e) { location.href = u; }
      };
    });
    ov.querySelectorAll('.mytr-done').forEach(function (btn) {
      btn.onclick = async function () {
        if (!emp) return;
        await markTrainingComplete(emp.id, btn.getAttribute('data-mod'));
        ov.remove();
        openMyTraining();
      };
    });
  }

  function openTrainingAssign() {
    if (!_canManage()) {
      // Members: show their own training instead
      openMyTraining();
      return;
    }
    var emps = _emps();
    var ov = document.createElement('div');
    ov.id = 'trainingAssignHub';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1300;background:var(--bg);display:flex;flex-direction:column';
    ov.innerHTML =
      '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">' +
        '<button type="button" id="trBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
        '<div style="flex:1"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('ट्रेनिंग असाइन (मेंटर)', 'Assign training (Mentor)') + '</div>' +
        '<div style="font-size:10px;color:var(--muted2)">' + _L('फ्री मेंटर मॉड्यूल → ऑपरेटर · चिप टैप = हटाएँ / पूर्ण', 'Free Mentor modules → operators · tap chip = remove / complete') + '</div></div>' +
      '</div>' +
      '<div style="flex:1;overflow:auto;padding:12px">' +
        emps.map(function (e) {
          var assigns = Array.isArray(e.trainingAssignments) ? e.trainingAssignments : [];
          var assignHtml = assigns.length
            ? assigns.map(function (t) {
                var done = t.status === 'completed';
                var label = _L(t.titleHi || t.title, t.title);
                return '<button type="button" class="tr-chip" data-emp="' + _esc(e.id) + '" data-mod="' + _esc(t.moduleId) + '" data-status="' + _esc(t.status || 'assigned') + '" ' +
                  'style="display:inline-block;margin:2px 4px 2px 0;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;border:1px solid transparent;cursor:pointer;font-family:inherit;background:' +
                  (done ? 'rgba(34,197,94,.15);color:#22c55e' : 'rgba(56,189,248,.15);color:#38bdf8') + '">' +
                  _esc(label) + (done ? ' ✓' : ' ✕') + '</button>';
              }).join('')
            : '<span style="font-size:11px;color:var(--muted)">' + _L('कोई असाइनमेंट नहीं', 'No assignments') + '</span>';
          return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<div style="font-weight:800;color:var(--text)">' + _esc(e.name || '') + '</div>' +
            '<div style="font-size:11px;color:var(--muted2);margin:4px 0 8px">' + assignHtml + '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
              MENTOR_MODULES.map(function (m) {
                return '<button type="button" class="tr-assign" data-emp="' + _esc(e.id) + '" data-mod="' + _esc(m.id) + '" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">＋ ' + _esc(_modTitle(m)) + '</button>';
              }).join('') +
            '</div></div>';
        }).join('') +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('trBack').onclick = function () { ov.remove(); };
    ov.querySelectorAll('.tr-assign').forEach(function (btn) {
      btn.onclick = async function () {
        btn.disabled = true;
        await assignTraining(btn.getAttribute('data-emp'), btn.getAttribute('data-mod'));
        ov.remove();
        openTrainingAssign();
      };
    });
    // Tap chip → action sheet: remove or mark complete
    ov.querySelectorAll('.tr-chip').forEach(function (chip) {
      chip.onclick = function () {
        var empId = chip.getAttribute('data-emp');
        var modId = chip.getAttribute('data-mod');
        var st = chip.getAttribute('data-status');
        var sheet = document.createElement('div');
        sheet.style.cssText = 'position:fixed;inset:0;z-index:1330;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center';
        sheet.innerHTML =
          '<div style="width:100%;max-width:400px;background:var(--panel);border-radius:16px 16px 0 0;padding:16px">' +
            '<div style="font-weight:900;font-size:14px;color:var(--text);margin-bottom:12px">' + _L('असाइनमेंट विकल्प', 'Assignment options') + '</div>' +
            (st !== 'completed' ? '<button type="button" id="trChipDone" style="width:100%;padding:12px;margin-bottom:8px;border-radius:12px;border:none;background:rgba(34,197,94,.15);color:#22c55e;font-weight:800;cursor:pointer;font-family:inherit">' + _L('✅ पूर्ण चिह्नित करें', '✅ Mark complete') + '</button>' : '') +
            '<button type="button" id="trChipDel" style="width:100%;padding:12px;margin-bottom:8px;border-radius:12px;border:none;background:rgba(244,63,94,.12);color:#f43f5e;font-weight:800;cursor:pointer;font-family:inherit">' + _L('🗑️ असाइनमेंट हटाएँ', '🗑️ Remove assignment') + '</button>' +
            '<button type="button" id="trChipCancel" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border2);background:var(--card2);color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">' + _L('रद्द', 'Cancel') + '</button>' +
          '</div>';
        document.body.appendChild(sheet);
        function close() { sheet.remove(); }
        sheet.addEventListener('click', function (ev) { if (ev.target === sheet) close(); });
        var c = document.getElementById('trChipCancel');
        if (c) c.onclick = close;
        var d = document.getElementById('trChipDone');
        if (d) d.onclick = async function () {
          await markTrainingComplete(empId, modId);
          close(); ov.remove(); openTrainingAssign();
        };
        var del = document.getElementById('trChipDel');
        if (del) del.onclick = async function () {
          if (!confirm(_L('यह असाइनमेंट हटाएँ?', 'Remove this assignment?'))) return;
          await removeTrainingAssignment(empId, modId);
          close(); ov.remove(); openTrainingAssign();
        };
      };
    });
  }


  // ── 5) Dedicated Shift Handover (manager fields + photo + notify incoming) ─
  var DEFAULT_HANDOVER_FIELDS = [
    { id: 'f1', label: 'Machine / area status', labelHi: 'मशीन / एरिया स्थिति' },
    { id: 'f2', label: 'Open issues / defects', labelHi: 'खुली समस्याएँ / दोष' },
    { id: 'f3', label: 'Material / stock status', labelHi: 'मटेरियल / स्टॉक स्थिति' },
    { id: 'f4', label: 'Safety / PPE notes', labelHi: 'सेफ्टी / PPE नोट्स' },
    { id: 'f5', label: 'Instructions for incoming shift', labelHi: 'अगली शिफ्ट के लिए निर्देश' }
  ];

  var _handoverFieldsCache = null;

  async function loadHandoverFields() {
    try {
      if (typeof fbGet === 'function') {
        var raw = await fbGet('settings/handoverForm');
        if (raw && Array.isArray(raw.fields) && raw.fields.length) {
          _handoverFieldsCache = raw.fields;
          return raw.fields.slice();
        }
      }
    } catch (e) {}
    _handoverFieldsCache = DEFAULT_HANDOVER_FIELDS.map(function (f) { return Object.assign({}, f); });
    return _handoverFieldsCache.slice();
  }

  async function saveHandoverFields(fields) {
    if (!_canManage()) return false;
    _handoverFieldsCache = fields;
    try {
      if (typeof fbSet === 'function') {
        await fbSet('settings/handoverForm', {
          fields: fields,
          updatedAt: new Date().toISOString(),
          updatedBy: _who()
        });
      }
      try { toast(_L('✅ हैंडओवर फ़ील्ड सेव', '✅ Handover fields saved')); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  function _nextShiftCode(code) {
    var c = String(code || '').toUpperCase();
    var map = { D: 'N', N: 'D', A: 'B', B: 'C', C: 'A', G: 'G', GP: 'G' };
    return map[c] || 'N';
  }

  function _todayStr() {
    try {
      if (typeof TODAY_STR === 'string' && TODAY_STR) return TODAY_STR;
    } catch (e) {}
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _addDaysStr(dateStr, n) {
    var p = String(dateStr).split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2] + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _shiftOf(emp, dateStr) {
    try {
      if (typeof getShift === 'function') return getShift(emp, dateStr);
    } catch (e) {}
    return '';
  }

  function _sectionOf(emp) {
    try {
      if (typeof getEmpSection === 'function') return String(getEmpSection(emp) || '');
    } catch (e) {}
    return String((emp && (emp.section || emp.sec)) || '');
  }

  function _currentEmp() {
    return _currentEmpForSession();
  }

  /** Incoming operators: same section, next shift code (same day for D→N, else next day) */
  function findIncomingOperators(outgoingEmp) {
    if (!outgoingEmp) return [];
    var today = _todayStr();
    var mySh = _shiftOf(outgoingEmp, today) || 'D';
    var nextSh = _nextShiftCode(mySh);
    var targetDate = today;
    // Night/C following day shift same calendar day; after N/C → next day D/A
    if (mySh === 'N' || mySh === 'C') targetDate = _addDaysStr(today, 1);
    var sec = _sectionOf(outgoingEmp);
    var list = [];
    _emps().forEach(function (e) {
      if (!e || String(e.id) === String(outgoingEmp.id)) return;
      if (sec && _sectionOf(e) !== sec) return;
      var sh = String(_shiftOf(e, targetDate) || '').toUpperCase();
      if (sh === nextSh || (nextSh === 'G' && (sh === 'G' || sh === 'GP'))) {
        list.push(e);
      }
    });
    return list;
  }

  async function notifyIncomingOperators(incoming, payload) {
    var title = _L('🔄 शिफ्ट हैंडओवर मिला', '🔄 Shift handover received');
    var body = (payload.outgoingName || '') + ' — ' + (payload.section || '') + '\n' +
      (payload.summary || _L('हैंडओवर सबमिट हो गया। विवरण देखें।', 'Handover submitted. Review details.'));
    var count = 0;
    for (var i = 0; i < incoming.length; i++) {
      var e = incoming[i];
      if (!e) continue;
      var notif = {
        title: title,
        body: body,
        type: 'shift_handover',
        handoverId: payload.id || '',
        read: false,
        at: new Date().toISOString()
      };
      try {
        if (typeof fbPush === 'function') {
          if (e.id) { await fbPush('userNotifications/' + e.id, notif); count++; }
          var mob = String(e.phone || e.mobile || '').replace(/\D/g, '').slice(-10);
          if (mob.length === 10) {
            await fbPush('userNotifications/' + mob, notif);
          }
        }
      } catch (err) { console.warn('[handover notify]', err); }
    }
    return count;
  }

  function openHandoverFieldEditor() {
    if (!_canManage()) {
      try { toast(_L('केवल मैनेजर फ़ील्ड सेट कर सकता है', 'Only manager can set fields')); } catch (e) {}
      return;
    }
    loadHandoverFields().then(function (fields) {
      var rows = fields.map(function (f) {
        return { id: f.id, label: f.label || '', labelHi: f.labelHi || '' };
      });
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:1320;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center';
      ov.innerHTML =
        '<div style="width:100%;max-width:520px;max-height:92vh;background:var(--panel);border-radius:18px 18px 0 0;display:flex;flex-direction:column">' +
          '<div style="padding:14px 16px;border-bottom:1px solid var(--border);font-weight:900;font-size:15px;color:var(--text)">' +
            _L('हैंडओवर फ़ील्ड (टीम मैनेजर)', 'Handover fields (team manager)') +
            '<button type="button" id="hoEdClose" style="float:right;background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--text)">✕</button>' +
          '</div>' +
          '<div style="padding:10px 14px;font-size:12px;color:var(--muted2);line-height:1.45">' +
            _L('ये फ़ील्ड आपके विभाग की ज़िम्मेदारी के अनुसार सेट करें। ऑपरेटर शिफ्ट एंड पर यही भरेंगे।',
               'Set these for your department responsibilities. Operators fill them at shift end.') +
          '</div>' +
          '<div id="hoEdList" style="flex:1;overflow:auto;padding:12px"></div>' +
          '<div style="padding:12px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px">' +
            '<button type="button" id="hoEdAdd" style="padding:12px;border-radius:12px;border:1.5px dashed rgba(56,189,248,.45);background:rgba(56,189,248,.08);color:#38bdf8;font-weight:800;cursor:pointer;font-family:inherit">＋ ' + _L('फ़ील्ड जोड़ें', 'Add field') + '</button>' +
            '<button type="button" id="hoEdSave" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;cursor:pointer;font-family:inherit">💾 ' + _L('सेव करें', 'Save') + '</button>' +
          '</div></div>';
      document.body.appendChild(ov);

      function render() {
        var box = document.getElementById('hoEdList');
        box.innerHTML = rows.map(function (r, i) {
          return '<div class="ho-ed-row" data-i="' + i + '" style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<div style="font-size:11px;font-weight:700;color:var(--muted2);margin-bottom:4px">' + _L('फ़ील्ड', 'Field') + ' ' + (i + 1) + '</div>' +
            '<input class="ho-ed-en" value="' + _esc(r.label) + '" placeholder="English label" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);margin-bottom:6px;font-family:inherit">' +
            '<input class="ho-ed-hi" value="' + _esc(r.labelHi) + '" placeholder="हिंदी लेबल (optional)" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);margin-bottom:6px;font-family:inherit">' +
            '<button type="button" class="ho-ed-del" data-i="' + i + '" style="padding:6px 10px;border-radius:8px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.1);color:#f43f5e;font-weight:700;cursor:pointer;font-family:inherit;font-size:11px">🗑</button>' +
          '</div>';
        }).join('') || '<div style="color:var(--muted2);text-align:center;padding:20px">' + _L('खाली — फ़ील्ड जोड़ें', 'Empty — add fields') + '</div>';
        box.querySelectorAll('.ho-ed-del').forEach(function (b) {
          b.onclick = function () {
            rows.splice(parseInt(b.getAttribute('data-i'), 10), 1);
            render();
          };
        });
      }
      function collect() {
        var out = [];
        ov.querySelectorAll('.ho-ed-row').forEach(function (row, i) {
          var en = (row.querySelector('.ho-ed-en').value || '').trim();
          var hi = (row.querySelector('.ho-ed-hi').value || '').trim();
          if (!en && !hi) return;
          var prev = rows[i] || {};
          out.push({ id: prev.id || ('f' + Date.now() + '_' + i), label: en || hi, labelHi: hi || en });
        });
        return out;
      }
      render();
      document.getElementById('hoEdClose').onclick = function () { ov.remove(); };
      document.getElementById('hoEdAdd').onclick = function () {
        rows = collect();
        if (rows.length >= 8) {
          try { toast(_L('अधिकतम 8 फ़ील्ड', 'Max 8 fields')); } catch (e) {}
          return;
        }
        rows.push({ id: 'f_' + Date.now(), label: '', labelHi: '' });
        render();
      };
      document.getElementById('hoEdSave').onclick = async function () {
        var next = collect();
        if (!next.length) {
          try { toast(_L('कम से कम 1 फ़ील्ड', 'At least 1 field')); } catch (e) {}
          return;
        }
        if (await saveHandoverFields(next)) ov.remove();
      };
    });
  }

  function openShiftHandoverForm() {
    var me = _currentEmp();
    var existing = document.getElementById('shiftHandoverForm');
    if (existing) existing.remove();

    loadHandoverFields().then(function (fields) {
      var ov = document.createElement('div');
      ov.id = 'shiftHandoverForm';
      ov.style.cssText = 'position:fixed;inset:0;z-index:1305;background:var(--bg);display:flex;flex-direction:column';

      var sec = me ? _sectionOf(me) : '';
      var mySh = me ? (_shiftOf(me, _todayStr()) || '—') : '—';
      var incoming = me ? findIncomingOperators(me) : [];
      var incomingNames = incoming.map(function (e) { return e.name || e.empId || ''; }).filter(Boolean).slice(0, 6).join(', ');

      var fieldsHtml = fields.map(function (f, i) {
        var lab = _L(f.labelHi || f.label, f.label);
        return '<div style="margin-bottom:12px">' +
          '<label style="font-size:12px;font-weight:800;color:var(--muted2)">' + (i + 1) + '. ' + _esc(lab) + '</label>' +
          '<textarea class="ho-field" data-id="' + _esc(f.id) + '" rows="2" style="width:100%;margin-top:6px;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;font-size:13px" placeholder="' + _esc(lab) + '"></textarea>' +
        '</div>';
      }).join('');

      ov.innerHTML =
        '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<button type="button" id="hoBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
          '<div style="flex:1;min-width:140px"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('शिफ्ट हैंडओवर', 'Shift Handover') + '</div>' +
          '<div style="font-size:10px;color:var(--muted2)">' + _L('शिफ्ट एंड क्विक फॉर्म · फोटो वैकल्पिक', 'Shift-end quick form · photo optional') + '</div></div>' +
          '<button type="button" id="hoHistoryBtn" style="background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.35);border-radius:10px;padding:7px 10px;color:#38bdf8;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">📋 ' + _L('इतिहास', 'History') + '</button>' +
          (_canManage() ? '<button type="button" id="hoEditFields" style="background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.4);border-radius:10px;padding:7px 10px;color:#f97316;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">✏️ ' + _L('फ़ील्ड', 'Fields') + '</button>' : '') +
        '</div>' +
        '<div style="flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch">' +
          '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--text);line-height:1.5">' +
            '<div><b>' + _L('आप', 'You') + ':</b> ' + _esc((me && me.name) || _who() || '—') + ' · ' + _L('शिफ्ट', 'Shift') + ' <b>' + _esc(mySh) + '</b>' +
            (sec ? ' · ' + _L('विभाग', 'Department') + ' <b>' + _esc(sec) + '</b>' : '') + '</div>' +
            '<div style="margin-top:6px;color:var(--muted2)"><b>' + _L('अगली शिफ्ट (सूचना)', 'Incoming (notify)') + ':</b> ' +
              _esc(incomingNames || _L('स्वतः खोज — सेव पर', 'Auto-detect on save')) + '</div>' +
          '</div>' +
          fieldsHtml +
          '<div style="margin-bottom:14px">' +
            '<label style="font-size:12px;font-weight:800;color:var(--muted2)">' + _L('फोटो (वैकल्पिक)', 'Photo (optional)') + '</label>' +
            '<input type="file" id="hoPhoto" accept="image/*" capture="environment" style="display:block;margin-top:8px;font-size:13px;color:var(--text)">' +
            '<div id="hoPhotoPrev" style="margin-top:8px"></div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:12px;border-top:1px solid var(--border)">' +
          '<button type="button" id="hoSubmit" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit">' +
            _L('✅ हैंडओवर सबमिट · अगली शिफ्ट को सूचना', '✅ Submit handover · notify incoming') +
          '</button></div>';

      document.body.appendChild(ov);
      document.getElementById('hoBack').onclick = function () { ov.remove(); };
      var histBtn = document.getElementById('hoHistoryBtn');
      if (histBtn) histBtn.onclick = function () { openHandoverHistory(_canManage() ? 'team' : 'mine'); };
      var editBtn = document.getElementById('hoEditFields');
      if (editBtn) editBtn.onclick = function () { openHandoverFieldEditor(); };

      var photoData = null;
      var photoInput = document.getElementById('hoPhoto');
      if (photoInput) {
        photoInput.onchange = function () {
          var file = photoInput.files && photoInput.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = async function () {
            var raw = reader.result;
            try {
              if (typeof compressImage === 'function') {
                photoData = await compressImage(raw, 900, 0.65);
              } else {
                photoData = raw;
              }
            } catch (e) { photoData = raw; }
            var prev = document.getElementById('hoPhotoPrev');
            if (prev) prev.innerHTML = '<img src="' + photoData + '" alt="" style="max-width:100%;max-height:160px;border-radius:10px;border:1px solid var(--border)">';
          };
          reader.readAsDataURL(file);
        };
      }

      document.getElementById('hoSubmit').onclick = async function () {
        var btn = document.getElementById('hoSubmit');
        if (btn) { btn.disabled = true; btn.textContent = _L('सेव हो रहा है…', 'Saving…'); }
        var answers = {};
        var parts = [];
        ov.querySelectorAll('.ho-field').forEach(function (ta) {
          var id = ta.getAttribute('data-id');
          var val = (ta.value || '').trim();
          answers[id] = val;
          if (val) parts.push(val);
        });
        if (!parts.length && !photoData) {
          try { toast(_L('कम से कम एक फ़ील्ड भरें या फोटो जोड़ें', 'Fill at least one field or add a photo')); } catch (e) {}
          if (btn) { btn.disabled = false; btn.textContent = _L('✅ हैंडओवर सबमिट · अगली शिफ्ट को सूचना', '✅ Submit handover · notify incoming'); }
          return;
        }
        var id = 'ho_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        var record = {
          id: id,
          type: 'shift_handover',
          date: _todayStr(),
          section: sec,
          shift: mySh,
          outgoingEmpId: me && me.id || '',
          outgoingName: (me && me.name) || _who(),
          answers: answers,
          photo: photoData || null,
          incomingIds: incoming.map(function (e) { return e.id; }),
          incomingNames: incoming.map(function (e) { return e.name; }),
          completedAt: new Date().toISOString(),
          completedBy: _who()
        };
        try {
          if (typeof fbSet === 'function') {
            await fbSet('shiftHandovers/' + id, record);
            // Also keep a light copy in checklistCompletions for History
            await fbSet('checklistCompletions/' + id, {
              id: id,
              checklistId: 'shift_handover',
              checklistTitle: 'Shift Handover',
              done: parts.length,
              total: fields.length,
              note: parts.slice(0, 2).join(' · ').slice(0, 120),
              empId: me && me.id || '',
              completedAt: record.completedAt,
              completedBy: record.completedBy,
              type: 'shift_handover'
            });
          }
          var n = await notifyIncomingOperators(incoming, {
            id: id,
            outgoingName: record.outgoingName,
            section: sec,
            summary: parts[0] || ''
          });
          try {
            toast(_L('✅ हैंडओवर सेव', '✅ Handover saved') + (n ? _L(' · ' + n + ' को सूचना', ' · notified ' + n) : _L(' · कोई incoming नहीं मिला', ' · no incoming found')));
          } catch (e) {}
          try { localStorage.setItem('mp_handover_done_' + _todayStr(), id); } catch (e) {}
          ov.remove();
        } catch (err) {
          try { toast('❌ ' + (err && err.message)); } catch (e2) {}
          if (btn) { btn.disabled = false; btn.textContent = _L('✅ हैंडओवर सबमिट · अगली शिफ्ट को सूचना', '✅ Submit handover · notify incoming'); }
        }
      };
    });
  }

  /** Banner near shift end on Home — optional soft prompt */

  async function loadShiftHandovers() {
    try {
      if (typeof fbGet === 'function') {
        var raw = await fbGet('shiftHandovers');
        if (!raw || typeof raw !== 'object') return [];
        return Object.keys(raw).map(function (k) {
          var v = raw[k] || {};
          v.id = v.id || k;
          return v;
        }).sort(function (a, b) {
          return String(b.completedAt || b.date || '').localeCompare(String(a.completedAt || a.date || ''));
        });
      }
    } catch (e) { console.warn('[handovers]', e); }
    return [];
  }

  function openHandoverDetail(rec) {
    if (!rec) return;
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:1315;background:var(--bg);display:flex;flex-direction:column';
    var when = rec.completedAt ? new Date(rec.completedAt).toLocaleString() : (rec.date || '—');
    var fieldsHtml = '';
    loadHandoverFields().then(function (fields) {
      var labelOf = {};
      fields.forEach(function (f) { labelOf[f.id] = _L(f.labelHi || f.label, f.label); });
      var answers = rec.answers || {};
      Object.keys(answers).forEach(function (fid) {
        var lab = labelOf[fid] || fid;
        var val = answers[fid] || '—';
        fieldsHtml += '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
          '<div style="font-size:11px;font-weight:800;color:var(--muted2);margin-bottom:4px">' + _esc(lab) + '</div>' +
          '<div style="font-size:14px;color:var(--text);line-height:1.45;white-space:pre-wrap">' + _esc(val) + '</div></div>';
      });
      if (!Object.keys(answers).length) {
        fieldsHtml = '<div style="color:var(--muted2);padding:20px;text-align:center">' + _L('कोई फ़ील्ड नहीं', 'No field answers') + '</div>';
      }
      var photo = rec.photo
        ? '<div style="margin-top:8px"><div style="font-size:11px;font-weight:800;color:var(--muted2);margin-bottom:6px">' + _L('फोटो', 'Photo') + '</div>' +
          '<img src="' + rec.photo + '" alt="" style="max-width:100%;border-radius:12px;border:1px solid var(--border)"></div>'
        : '';
      ov.innerHTML =
        '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">' +
          '<button type="button" id="hoDetBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
          '<div style="flex:1"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('हैंडओवर विवरण', 'Handover detail') + '</div>' +
          '<div style="font-size:10px;color:var(--muted2)">' + _esc(when) + '</div></div></div>' +
        '<div style="flex:1;overflow:auto;padding:14px">' +
          '<div style="font-size:13px;color:var(--text);margin-bottom:12px;line-height:1.5">' +
            '<b>' + _L('द्वारा', 'By') + ':</b> ' + _esc(rec.outgoingName || rec.completedBy || '—') +
            (rec.section ? ' · <b>' + _L('विभाग', 'Department') + ':</b> ' + _esc(rec.section) : '') +
            (rec.shift ? ' · <b>' + _L('शिफ्ट', 'Shift') + ':</b> ' + _esc(rec.shift) : '') +
          '</div>' +
          fieldsHtml + photo +
          (rec.incomingNames && rec.incomingNames.length
            ? '<div style="margin-top:12px;font-size:12px;color:var(--muted2)"><b>' + _L('सूचित', 'Notified') + ':</b> ' + _esc((rec.incomingNames || []).join(', ')) + '</div>'
            : '') +
        '</div>';
      document.body.appendChild(ov);
      document.getElementById('hoDetBack').onclick = function () { ov.remove(); };
    });
  }

  /** mode: 'mine' | 'team' */
  function openHandoverHistory(mode) {
    mode = mode || (_canManage() ? 'team' : 'mine');
    var ov = document.createElement('div');
    ov.id = 'handoverHistory';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1310;background:var(--bg);display:flex;flex-direction:column';
    var title = mode === 'team'
      ? _L('टीम हैंडओवर इतिहास', 'Team handover history')
      : _L('मेरे हैंडओवर', 'My handovers');
    ov.innerHTML =
      '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button type="button" id="hoHistBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← ' + _L('वापस', 'Back') + '</button>' +
        '<div style="flex:1;min-width:120px"><div style="font-weight:900;font-size:15px;color:var(--text)">' + title + '</div>' +
        '<div style="font-size:10px;color:var(--muted2)">' + _L('पुरानी तारीख का पूरा विवरण देखें', 'View full detail for any past date') + '</div></div>' +
        (_canManage()
          ? '<button type="button" id="hoHistMine" style="padding:7px 10px;border-radius:10px;border:1px solid var(--border2);background:var(--card2);color:var(--text);font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">' + _L('मेरे', 'Mine') + '</button>' +
            '<button type="button" id="hoHistTeam" style="padding:7px 10px;border-radius:10px;border:1px solid rgba(14,165,233,.4);background:rgba(14,165,233,.12);color:#0ea5e9;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">' + _L('टीम', 'Team') + '</button>'
          : '') +
      '</div>' +
      '<div id="hoHistBody" style="flex:1;overflow:auto;padding:14px;color:var(--muted2);text-align:center;padding-top:40px">' + _L('लोड हो रहा है…', 'Loading…') + '</div>';
    document.body.appendChild(ov);
    document.getElementById('hoHistBack').onclick = function () { ov.remove(); };
    var mineBtn = document.getElementById('hoHistMine');
    var teamBtn = document.getElementById('hoHistTeam');
    if (mineBtn) mineBtn.onclick = function () { ov.remove(); openHandoverHistory('mine'); };
    if (teamBtn) teamBtn.onclick = function () { ov.remove(); openHandoverHistory('team'); };

    loadShiftHandovers().then(function (rows) {
      var body = document.getElementById('hoHistBody');
      if (!body) return;
      var me = _currentEmp();
      var meId = me && me.id ? String(me.id) : '';
      var meName = me && me.name ? String(me.name) : '';
      var who = '';
      try { who = String(_who() || ''); } catch (e) {}
      var filtered = rows;
      if (mode !== 'team' || !_canManage()) {
        filtered = rows.filter(function (r) {
          if (meId && String(r.outgoingEmpId || '') === meId) return true;
          if (meName && String(r.outgoingName || '') === meName) return true;
          if (who && String(r.completedBy || '').indexOf(who) >= 0) return true;
          return false;
        });
      }
      if (!filtered.length) {
        body.innerHTML = '<div style="padding:40px 16px">' + _L('कोई हैंडओवर नहीं मिला', 'No handovers found') + '</div>';
        return;
      }
      body.style.textAlign = 'left';
      body.style.paddingTop = '14px';
      body.innerHTML = filtered.slice(0, 80).map(function (r, idx) {
        var when = r.completedAt ? new Date(r.completedAt).toLocaleString() : (r.date || '—');
        var preview = '';
        try {
          var ans = r.answers || {};
          var first = Object.keys(ans).map(function (k) { return ans[k]; }).filter(Boolean)[0];
          preview = first ? String(first).slice(0, 80) : '';
        } catch (e) {}
        return '<button type="button" class="ho-hist-row" data-i="' + idx + '" style="width:100%;text-align:left;padding:14px;margin-bottom:10px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;font-family:inherit">' +
          '<div style="display:flex;justify-content:space-between;gap:8px">' +
            '<div style="font-weight:800;font-size:14px">' + _esc(r.outgoingName || r.completedBy || '—') + '</div>' +
            '<div style="font-size:11px;color:var(--muted2);white-space:nowrap">' + _esc(when) + '</div>' +
          '</div>' +
          '<div style="font-size:11px;color:var(--muted2);margin-top:4px">' +
            (r.section ? _esc(r.section) + ' · ' : '') + (r.shift ? _L('शिफ्ट', 'Shift') + ' ' + _esc(r.shift) : '') +
            (r.photo ? ' · 📷' : '') +
          '</div>' +
          (preview ? '<div style="font-size:12px;margin-top:6px;color:var(--muted2)">' + _esc(preview) + (preview.length >= 80 ? '…' : '') + '</div>' : '') +
        '</button>';
      }).join('');
      body.querySelectorAll('.ho-hist-row').forEach(function (btn) {
        btn.onclick = function () {
          var i = parseInt(btn.getAttribute('data-i'), 10);
          openHandoverDetail(filtered[i]);
        };
      });
    });
  }

  // Feature flags (Admin can turn competence modules on/off)
  var DEFAULT_FEATURE_FLAGS = {
    skillMatrix: true,
    checklists: true,
    shiftHandover: true,
    training: true
  };
  var _featureFlagsCache = null;

  async function loadFeatureFlags() {
    try {
      if (typeof fbGet === 'function') {
        var raw = await fbGet('settings/featureFlags');
        if (raw && typeof raw === 'object') {
          _featureFlagsCache = Object.assign({}, DEFAULT_FEATURE_FLAGS, raw);
          return Object.assign({}, _featureFlagsCache);
        }
      }
    } catch (e) {}
    _featureFlagsCache = Object.assign({}, DEFAULT_FEATURE_FLAGS);
    return Object.assign({}, _featureFlagsCache);
  }

  function getFeatureFlagsSync() {
    return _featureFlagsCache ? Object.assign({}, _featureFlagsCache) : Object.assign({}, DEFAULT_FEATURE_FLAGS);
  }

  async function saveFeatureFlags(flags) {
    _featureFlagsCache = Object.assign({}, DEFAULT_FEATURE_FLAGS, flags || {});
    try {
      if (typeof fbSet === 'function') await fbSet('settings/featureFlags', _featureFlagsCache);
      try { toast(_L('✅ फीचर सेटिंग सेव', '✅ Feature settings saved')); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  function isFeatureOn(key) {
    var f = getFeatureFlagsSync();
    if (f[key] === false) return false;
    return true;
  }

  // Warm cache
  setTimeout(function () { try { loadFeatureFlags(); } catch (e) {} }, 1500);

  function _handoverAllowedTab() {
    try {
      var t = (typeof _currentTab !== 'undefined' && _currentTab) ? String(_currentTab) : '';
      if (t === 'home' || t === 'myshift') return true;
      // Fallback: visible tab class
      var home = document.getElementById('tab-home');
      var ms = document.getElementById('tab-myshift');
      if (home && home.classList.contains('on')) return true;
      if (ms && ms.classList.contains('on')) return true;
      return false;
    } catch (e) { return false; }
  }

  function hideHandoverChip() {
    try {
      var chip = document.getElementById('mpHandoverChip');
      if (chip) chip.style.display = 'none';
    } catch (e) {}
  }

  function maybeShowHandoverPrompt() {
    try {
      if (!_handoverAllowedTab()) {
        hideHandoverChip();
        return;
      }
      var done = localStorage.getItem('mp_handover_done_' + _todayStr());
      if (done) { hideHandoverChip(); return; }
      var me = _currentEmp();
      if (!me) return;
      var mySh = _shiftOf(me, _todayStr());
      if (!mySh || mySh === 'O' || mySh === 'L' || mySh === 'Ab') { hideHandoverChip(); return; }
      var chip = document.getElementById('mpHandoverChip');
      if (!chip) {
        chip = document.createElement('button');
        chip.id = 'mpHandoverChip';
        chip.type = 'button';
        chip.style.cssText = 'position:fixed;right:12px;bottom:72px;z-index:900;padding:12px 14px;border-radius:14px;border:none;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;font-weight:800;font-size:13px;box-shadow:0 8px 24px rgba(3,105,161,.35);cursor:pointer;font-family:inherit';
        chip.textContent = _L('🔄 शिफ्ट हैंडओवर', '🔄 Shift handover');
        chip.onclick = function () { openShiftHandoverForm(); };
        document.body.appendChild(chip);
      }
      chip.style.display = 'block';
    } catch (e) {}
  }

  // Keep chip in sync with tab changes (Home / My Shift only)
  function syncHandoverChipForTab() {
    try {
      if (_handoverAllowedTab()) maybeShowHandoverPrompt();
      else hideHandoverChip();
    } catch (e) {}
  }
  global.syncHandoverChipForTab = syncHandoverChipForTab;
  global.hideHandoverChip = hideHandoverChip;

  setTimeout(function () { try { maybeShowHandoverPrompt(); } catch (e) {} }, 2500);
  setTimeout(function () { try { maybeShowHandoverPrompt(); } catch (e) {} }, 8000);


  // Public API
  global.MP_OPS = {
    skillScore: skillScore,
    skillSortCmp: skillSortCmp,
    analyzeKnowledgeLoss: analyzeKnowledgeLoss,
    onEmployeeLeaving: onEmployeeLeaving,
    showKnowledgeLossAlert: showKnowledgeLossAlert,
    openChecklistsHub: openChecklistsHub,
    openChecklistHistory: openChecklistHistory,
    openTrainingAssign: openTrainingAssign,
    openMyTraining: openMyTraining,
    assignTraining: assignTraining,
    removeTrainingAssignment: removeTrainingAssignment,
    markTrainingComplete: markTrainingComplete,
    openShiftHandoverForm: openShiftHandoverForm,
    openHandoverFieldEditor: openHandoverFieldEditor,
    openHandoverHistory: openHandoverHistory,
    openHandoverDetail: openHandoverDetail,
    findIncomingOperators: findIncomingOperators,
    loadFeatureFlags: loadFeatureFlags,
    saveFeatureFlags: saveFeatureFlags,
    isFeatureOn: isFeatureOn,
    getFeatureFlagsSync: getFeatureFlagsSync,
    MENTOR_MODULES: MENTOR_MODULES
  };

  global.openChecklistsHub = openChecklistsHub;
  global.openChecklistHistory = openChecklistHistory;
  global.openTrainingAssign = openTrainingAssign;
  global.openMyTraining = openMyTraining;
  global.openShiftHandoverForm = openShiftHandoverForm;
  global.openHandoverFieldEditor = openHandoverFieldEditor;
  global.openHandoverHistory = openHandoverHistory;
  global.mpSkillScore = skillScore;
  global.mpIsFeatureOn = isFeatureOn;

  // Wrap approveLeave when available — flag long leaves (3+ days) for knowledge-loss
  (function wrapApproveLeave(){
    function tryWrap(){
      if (typeof global.approveLeave !== 'function' || global.approveLeave._klWrapped) return;
      var orig = global.approveLeave;
      global.approveLeave = async function(leaveKey){
        var leave = null;
        try {
          var leaves = (global._cache && global._cache.leaves) || [];
          leave = leaves.find(function(l){ return l && (l._key===leaveKey || l.id===leaveKey); });
        } catch(e){}
        var result = await orig.apply(this, arguments);
        try {
          if (leave && leave.from && leave.to) {
            var days = Math.round((new Date(leave.to) - new Date(leave.from)) / 86400000) + 1;
            if (days >= 3) {
              var emp = null;
              try {
                var all = (global._cache && global._cache.employees) || [];
                emp = all.find(function(e){ return e && (String(e.id)===String(leave.empId) || String(e.empId)===String(leave.empId)); });
                if (!emp && typeof getEmps==='function') {
                  emp = (getEmps()||[]).find(function(e){ return e && (String(e.id)===String(leave.empId) || String(e.empId)===String(leave.empId)); });
                }
              } catch(e2){}
              if (emp) onEmployeeLeaving(emp, _L('लंबी छुट्टी ('+days+' दिन) मंजूर। स्किल कवरेज जाँचें।','Long leave ('+days+' days) approved. Check skill coverage.'));
            }
          }
        } catch(e3){}
        return result;
      };
      global.approveLeave._klWrapped = true;
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(tryWrap, 2000); });
    else setTimeout(tryWrap, 2000);
    setTimeout(tryWrap, 5000);
  })();


  // ── Notifications: fix Hindi titles/bodies when app language is English ──
  (function notifI18nFix(){
    var PAIRS = [
      // [hindi fragment or full, english]
      ['Shift बदली गई', 'Shift changed'],
      ['📋 Shift बदली गई', '📋 Shift changed'],
      ['Shift बदलने का अनुरोध', 'Shift change request'],
      ['📅 Shift बदलने का अनुरोध', '📅 Shift change request'],
      ['नया काम assign हुआ', 'New task assigned'],
      ['📌 नया काम assign हुआ', '📌 New task assigned'],
      ['नया काम असाइन हुआ', 'New task assigned'],
      ['काम update हुआ', 'Task updated'],
      ['📝 काम update हुआ', '📝 Task updated'],
      ['Registration Approved', 'Registration Approved'],
      ['आपका registration approve हो गया। अब login करें।', 'Your registration was approved. You can log in now.'],
      ['कोई notification नहीं', 'No notifications'],
      ['Pending Approvals देखें', 'View Pending Approvals'],
      ['शेड्यूल से हटाया गया', 'removed from schedule'],
      ['approve हो गया', 'was approved'],
      ['छुट्टी मंजूर', 'Leave approved'],
      ['Leave approved', 'Leave approved'],
      ['ज्ञान हानि अलर्ट', 'Knowledge-loss alert'],
      ['नॉलेज लॉस अलर्ट', 'Knowledge-loss alert']
    ];

    function isHindiLang(){
      try {
        var lang = (typeof _lang !== 'undefined' && _lang) ? String(_lang).toLowerCase() : '';
        if (!lang) lang = String(localStorage.getItem('mp_lang') || '').toLowerCase();
        return lang === 'hi' || lang === 'hindi' || lang === 'hin';
      } catch (e) { return false; }
    }

    function localizeNotifText(text) {
      if (!text || typeof text !== 'string') return text;
      var hi = isHindiLang();
      var out = text;
      for (var i = 0; i < PAIRS.length; i++) {
        var h = PAIRS[i][0], e = PAIRS[i][1];
        if (!hi) {
          // English UI: replace Hindi phrases with English
          if (out.indexOf(h) !== -1) out = out.split(h).join(e);
        } else {
          // Hindi UI: replace English phrases with Hindi when exact-ish
          if (out.indexOf(e) !== -1 && out.indexOf(h) === -1) out = out.split(e).join(h);
        }
      }
      // Extra: "Shift बदली गई" without emoji variants already covered
      if (!hi && /बदली\s*गई/.test(out)) {
        out = out.replace(/Shift\s*बदली\s*गई/g, 'Shift changed');
        out = out.replace(/बदली\s*गई/g, 'changed');
      }
      if (!hi && /असाइन\s*हुआ|assign\s*हुआ/.test(out)) {
        out = out.replace(/नया\s*काम\s*(assign|असाइन)\s*हुआ/g, 'New task assigned');
      }
      return out;
    }

    global.localizeNotifText = localizeNotifText;

    function patchOpenUserNotifications() {
      if (typeof global.openUserNotifications !== 'function') return false;
      if (global.openUserNotifications._i18nPatched) return true;
      var orig = global.openUserNotifications;
      global.openUserNotifications = function () {
        // Localize cached titles/bodies in place for current language
        try {
          if (Array.isArray(global._userNotifCache)) {
            global._userNotifCache.forEach(function (n) {
              if (!n) return;
              if (n.title) n.title = localizeNotifText(n.title);
              if (n.body) n.body = localizeNotifText(n.body);
            });
          }
        } catch (e) {}
        var result = orig.apply(this, arguments);
        // Also fix any residual Hindi in the modal DOM after render
        try {
          setTimeout(function () {
            var modal = document.querySelector('.modal, #modalBox, [class*="modal"]');
            if (!modal) modal = document.body;
            var walk = modal.querySelectorAll('span, div, button');
            for (var i = 0; i < walk.length; i++) {
              var el = walk[i];
              if (el.children && el.children.length > 0 && el.childNodes.length > 1) continue;
              var tx = el.textContent || '';
              if (!tx || tx.length > 200) continue;
              if (/बदली|असाइन|approve हो|देखें|नहीं/.test(tx)) {
                var fixed = localizeNotifText(tx);
                if (fixed !== tx) el.textContent = fixed;
              }
            }
          }, 30);
        } catch (e2) {}
        return result;
      };
      global.openUserNotifications._i18nPatched = true;
      return true;
    }

    function tryPatch() {
      if (patchOpenUserNotifications()) return;
      setTimeout(tryPatch, 800);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(tryPatch, 500); });
    } else {
      setTimeout(tryPatch, 500);
    }
    setTimeout(tryPatch, 2000);
    setTimeout(tryPatch, 5000);
  })();


})(typeof window !== 'undefined' ? window : globalThis);
