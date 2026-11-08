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
            _L('कोई अन्य Competent/Can Train नहीं', 'no other Competent / Can Train left') + '</li>';
        }).join('')
      : '';
    var otherHtml = analysis.gaps.filter(function (g) { return !g.underCovered; }).map(function (g) {
      return '<li style="margin:4px 0;color:var(--muted2)">' + _esc(g.label) + ' — ' +
        g.remaining + ' ' + _L('अन्य सक्षम', 'others still skilled') + '</li>';
    }).join('');

    var ov = document.createElement('div');
    ov.id = 'knowledgeLossAlert';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10060;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
    ov.innerHTML =
      '<div style="width:100%;max-width:480px;background:var(--panel,#111d2e);border-radius:18px 18px 0 0;padding:18px 16px 22px;box-shadow:0 -8px 40px rgba(0,0,0,.4);color:var(--text)">' +
        '<div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:4px">⚠️ ' + _L('नॉलेज लॉस अलर्ट', 'Knowledge-loss alert') + '</div>' +
        '<div style="font-weight:900;font-size:16px;margin-bottom:6px">' + _esc(analysis.empName) + '</div>' +
        '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.5">' +
          (reason || _L('यह व्यक्ति Competent / Can Train स्किल्स रखता है।', 'This person holds Competent / Can Train skills.')) +
        '</div>' +
        (underHtml
          ? '<div style="background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.35);border-radius:12px;padding:12px;margin-bottom:10px">' +
              '<div style="font-size:12px;font-weight:800;color:#f87171;margin-bottom:6px">' + _L('अब अंडर-कवर्ड स्किल्स', 'Now under-covered skills') + '</div>' +
              '<ul style="margin:0;padding-left:18px;font-size:13px">' + underHtml + '</ul></div>'
          : '') +
        (otherHtml
          ? '<div style="font-size:12px;margin-bottom:12px"><div style="font-weight:700;margin-bottom:4px">' + _L('अन्य स्किल्स (अभी कवर हैं)', 'Other skills (still covered)') + '</div><ul style="margin:0;padding-left:18px">' + otherHtml + '</ul></div>'
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
      try { toast(_L('✅ चेकलिस्ट पूरी', '✅ Checklist completed')); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  function openChecklistsHub() {
    var existing = document.getElementById('checklistsHub');
    if (existing) existing.remove();

    var ov = document.createElement('div');
    ov.id = 'checklistsHub';
    ov.style.cssText = 'position:fixed;inset:0;z-index:960;background:var(--bg,#0a0f1a);display:flex;flex-direction:column;overflow:hidden';

    ov.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0">' +
        '<button type="button" id="clHubBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← Back</button>' +
        '<div style="flex:1"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('प्रोसेस चेकलिस्ट', 'Process Checklists') + '</div>' +
        '<div style="font-size:10px;color:var(--muted2)">' + _L('शिफ्ट हैंडओवर · क्रिटिकल सेटअप · कस्टम', 'Shift handover · critical setup · custom') + '</div></div>' +
        (_canManage() ? '<button type="button" id="clHubEdit" style="background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.4);border-radius:10px;padding:7px 11px;color:#f97316;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">✏️ ' + _L('एडिट', 'Edit') + '</button>' : '') +
      '</div>' +
      '<div id="clHubBody" style="flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch"></div>';

    document.body.appendChild(ov);
    document.getElementById('clHubBack').onclick = function () { ov.remove(); };

    loadChecklists().then(function (list) {
      var body = document.getElementById('clHubBody');
      if (!body) return;
      if (!list.length) {
        body.innerHTML = '<div style="text-align:center;color:var(--muted2);padding:40px 16px">' + _L('कोई चेकलिस्ट नहीं', 'No checklists yet') + '</div>';
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

  function openChecklistRunner(cl) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:970;background:var(--bg);display:flex;flex-direction:column';
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
        '<div style="margin-top:12px"><label style="font-size:12px;font-weight:700;color:var(--muted2)">' + _L('नोट (optional)', 'Note (optional)') + '</label>' +
        '<textarea id="clRunNote" rows="2" style="width:100%;margin-top:6px;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;font-size:13px"></textarea></div>' +
      '</div>' +
      '<div style="padding:12px;border-top:1px solid var(--border)">' +
        '<button type="button" id="clRunSave" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit">' +
          _L('✅ पूरा करें और सेव', '✅ Complete & save') +
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
        if (!confirm(_L('कुछ आइटम अनटिक्ड हैं। फिर भी सेव करें?', 'Some items unchecked. Save anyway?'))) return;
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
      ov.style.cssText = 'position:fixed;inset:0;z-index:980;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center';
      ov.innerHTML =
        '<div style="width:100%;max-width:520px;max-height:92vh;background:var(--panel);border-radius:18px 18px 0 0;display:flex;flex-direction:column">' +
          '<div style="padding:14px 16px;border-bottom:1px solid var(--border);font-weight:900;font-size:15px;color:var(--text)">' +
            _L('चेकलिस्ट एडिट (किसी भी इंडस्ट्री)', 'Edit checklists (any industry)') +
            '<button type="button" id="clEdClose" style="float:right;background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:4px 10px;cursor:pointer;color:var(--text)">✕</button>' +
          '</div>' +
          '<div id="clEdList" style="flex:1;overflow:auto;padding:12px"></div>' +
          '<div style="padding:12px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px">' +
            '<button type="button" id="clEdAdd" style="padding:12px;border-radius:12px;border:1.5px dashed rgba(56,189,248,.45);background:rgba(56,189,248,.08);color:#38bdf8;font-weight:800;cursor:pointer;font-family:inherit">＋ ' + _L('नई चेकलिस्ट', 'New checklist') + '</button>' +
            '<button type="button" id="clEdSave" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;cursor:pointer;font-family:inherit">💾 ' + _L('सेव', 'Save') + '</button>' +
          '</div></div>';
      document.body.appendChild(ov);

      function render() {
        var box = document.getElementById('clEdList');
        box.innerHTML = defs.map(function (d, i) {
          return '<div class="cl-ed-row" data-i="' + i + '" style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<input class="cl-ed-title" value="' + _esc(d.title) + '" placeholder="Title" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-weight:700;margin-bottom:6px;font-family:inherit">' +
            '<textarea class="cl-ed-items" rows="4" placeholder="One item per line" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-size:12px;font-family:inherit">' + _esc(d.itemsText) + '</textarea>' +
            '<button type="button" class="cl-ed-del" data-i="' + i + '" style="margin-top:6px;padding:6px 10px;border-radius:8px;border:1px solid rgba(244,63,94,.3);background:rgba(244,63,94,.1);color:#f43f5e;font-weight:700;cursor:pointer;font-family:inherit;font-size:11px">🗑</button>' +
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
    { id: 'met_train_pro', title: 'Met Train PRO', url: 'https://mentor.vkstech.com/Met_Train_Pro/met_train_pro.html' },
    { id: 'mentor_home', title: 'Mentor — One-to-One / Free modules', url: 'https://mentor.vkstech.com/mentor.html' },
    { id: 'kpi_dashboard', title: 'KPI Dashboard', url: 'https://mentor.vkstech.com/kpi_dashboard.html' },
    { id: 'excel_expert', title: 'Excel Expert', url: 'https://mentor.vkstech.com/' },
    { id: 'time_study', title: 'Time Study', url: 'https://mentor.vkstech.com/' }
  ];

  async function assignTraining(empId, moduleId) {
    if (!_canManage()) return false;
    var mod = MENTOR_MODULES.find(function (m) { return m.id === moduleId; });
    if (!mod) return false;
    var emp = null;
    try {
      var all = (global._cache && global._cache.employees) || [];
      emp = all.find(function (e) { return e && String(e.id) === String(empId); });
      if (!emp && typeof getEmps === 'function') emp = (getEmps() || []).find(function (e) { return e && String(e.id) === String(empId); });
    } catch (e) {}
    if (!emp || !emp.id) {
      try { toast(_L('कर्मचारी नहीं मिला', 'Employee not found')); } catch (e) {}
      return false;
    }
    var list = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments.slice() : [];
    // avoid duplicate open assignment
    if (list.some(function (t) { return t.moduleId === moduleId && t.status !== 'completed'; })) {
      try { toast(_L('पहले से असाइन है', 'Already assigned')); } catch (e) {}
      return false;
    }
    list.push({
      moduleId: mod.id,
      title: mod.title,
      url: mod.url,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      assignedBy: _who()
    });
    emp.trainingAssignments = list;
    try {
      if (typeof fbUpdate === 'function') await fbUpdate('employees/' + emp.id, { trainingAssignments: list });
      try { toast(_L('✅ ट्रेनिंग असाइन: ', '✅ Training assigned: ') + mod.title); } catch (e) {}
      return true;
    } catch (e) {
      try { toast('❌ ' + (e && e.message)); } catch (e2) {}
      return false;
    }
  }

  async function markTrainingComplete(empId, moduleId) {
    var emp = null;
    try {
      var all = (global._cache && global._cache.employees) || [];
      emp = all.find(function (e) { return e && String(e.id) === String(empId); });
    } catch (e) {}
    if (!emp) return false;
    var list = Array.isArray(emp.trainingAssignments) ? emp.trainingAssignments.slice() : [];
    list = list.map(function (t) {
      if (t.moduleId === moduleId) {
        return Object.assign({}, t, { status: 'completed', completedAt: new Date().toISOString() });
      }
      return t;
    });
    emp.trainingAssignments = list;
    try {
      if (typeof fbUpdate === 'function') await fbUpdate('employees/' + emp.id, { trainingAssignments: list });
      return true;
    } catch (e) { return false; }
  }

  function openTrainingAssign() {
    if (!_canManage()) {
      try { toast(_L('केवल Manager', 'Managers only')); } catch (e) {}
      return;
    }
    var emps = _emps();
    var ov = document.createElement('div');
    ov.id = 'trainingAssignHub';
    ov.style.cssText = 'position:fixed;inset:0;z-index:960;background:var(--bg);display:flex;flex-direction:column';
    ov.innerHTML =
      '<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">' +
        '<button type="button" id="trBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">← Back</button>' +
        '<div style="flex:1"><div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('ट्रेनिंग असाइन (Mentor)', 'Assign training (Mentor)') + '</div>' +
        '<div style="font-size:10px;color:var(--muted2)">' + _L('फ्री Mentor मॉड्यूल्स → ऑपरेटर', 'Free Mentor modules → operators') + '</div></div>' +
      '</div>' +
      '<div style="flex:1;overflow:auto;padding:12px">' +
        emps.map(function (e) {
          var assigns = Array.isArray(e.trainingAssignments) ? e.trainingAssignments : [];
          var assignHtml = assigns.length
            ? assigns.map(function (t) {
                return '<span style="display:inline-block;margin:2px 4px 2px 0;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700;background:' +
                  (t.status === 'completed' ? 'rgba(34,197,94,.15);color:#22c55e' : 'rgba(56,189,248,.15);color:#38bdf8') + '">' +
                  _esc(t.title) + (t.status === 'completed' ? ' ✓' : '') + '</span>';
              }).join('')
            : '<span style="font-size:11px;color:var(--muted)">' + _L('कोई असाइनमेंट नहीं', 'No assignments') + '</span>';
          return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<div style="font-weight:800;color:var(--text)">' + _esc(e.name || '') + '</div>' +
            '<div style="font-size:11px;color:var(--muted2);margin:4px 0 8px">' + assignHtml + '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
              MENTOR_MODULES.map(function (m) {
                return '<button type="button" class="tr-assign" data-emp="' + _esc(e.id) + '" data-mod="' + _esc(m.id) + '" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">＋ ' + _esc(m.title) + '</button>';
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
  }

  // Public API
  global.MP_OPS = {
    skillScore: skillScore,
    skillSortCmp: skillSortCmp,
    analyzeKnowledgeLoss: analyzeKnowledgeLoss,
    onEmployeeLeaving: onEmployeeLeaving,
    showKnowledgeLossAlert: showKnowledgeLossAlert,
    openChecklistsHub: openChecklistsHub,
    openTrainingAssign: openTrainingAssign,
    assignTraining: assignTraining,
    markTrainingComplete: markTrainingComplete,
    MENTOR_MODULES: MENTOR_MODULES
  };

  global.openChecklistsHub = openChecklistsHub;
  global.openTrainingAssign = openTrainingAssign;
  global.mpSkillScore = skillScore;

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
              if (emp) onEmployeeLeaving(emp, 'Long leave ('+days+' days) approved. Check skill coverage.');
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

})(typeof window !== 'undefined' ? window : globalThis);
