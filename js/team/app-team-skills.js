/**
 * Man Power — Skill Matrix / Competency Tracker
 * Multi-industry: managers define their own skills (not locked to metalliser).
 * Low-distortion optional layer on top of roster & coverage.
 *
 * Storage:
 *   settings/skillDefs  → [{ id, label, labelHi?, critical }]
 *   employees/{id}/skills → { [skillId]: { status, updatedAt, updatedBy } }
 *
 * Status: learning | practising | competent | canTrain
 */
(function (global) {
  'use strict';

  // Seed only when a company has never defined skills.
  // Managers can delete/replace these for any industry.
  var SEED_SKILLS = [
    { id: 'boatChange',     label: 'Boat Change',          labelHi: 'बोट चेंज',        critical: true },
    { id: 'wireAlignment',  label: 'Wire Alignment',       labelHi: 'वायर अलाइनमेंट',  critical: true },
    { id: 'vacuumRecovery', label: 'Vacuum Recovery',      labelHi: 'वैक्यूम रिकवरी',  critical: true },
    { id: 'sourceCleaning', label: 'Source Cleaning',      labelHi: 'सोर्स क्लीनिंग',  critical: false },
    { id: 'odControl',      label: 'OD / Current Control', labelHi: 'OD / करंट कंट्रोल', critical: true },
    { id: 'shiftHandover',  label: 'Shift Handover',       labelHi: 'शिफ्ट हैंडओवर',   critical: false }
  ];

  var STATUS = {
    learning:   { label: 'Learning',   labelHi: 'सीख रहा है',       color: '#38bdf8', bg: 'rgba(56,189,248,.15)', order: 1 },
    practising: { label: 'Practising', labelHi: 'प्रैक्टिस',        color: '#f59e0b', bg: 'rgba(245,158,11,.15)', order: 2 },
    competent:  { label: 'Competent',  labelHi: 'सक्षम',           color: '#22c55e', bg: 'rgba(34,197,94,.15)',  order: 3 },
    canTrain:   { label: 'Can Train',  labelHi: 'ट्रेन कर सकता है', color: '#16a34a', bg: 'rgba(22,163,74,.22)', order: 4 }
  };

  var STATUS_ORDER = ['learning', 'practising', 'competent', 'canTrain'];

  var _skillDefsCache = null;
  var _skillDefsLoaded = false;

  function _L(hi, en) {
    try {
      if (typeof L === 'function') return L(hi, en);
    } catch (e) {}
    return en || hi;
  }

  function _esc(s) {
    if (typeof escHtml === 'function') return escHtml(String(s == null ? '' : s));
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _canManageSkills() {
    try {
      if (typeof isAdmin === 'function' && isAdmin()) return true;
      if (typeof isAdminOrMgr === 'function' && isAdminOrMgr()) return true;
      if (typeof isMgr === 'function' && isMgr()) return true;
    } catch (e) {}
    return false;
  }

  function _slugId(label) {
    var base = String(label || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    if (!base) base = 'skill';
    var ids = {};
    (getSkillDefsSync() || []).forEach(function (s) { ids[s.id] = true; });
    var id = base;
    var n = 2;
    while (ids[id]) {
      id = base + '_' + n;
      n++;
    }
    return id;
  }

  function getSkillDefsSync() {
    if (_skillDefsCache && _skillDefsCache.length) return _skillDefsCache.slice();
    return SEED_SKILLS.slice();
  }

  async function loadSkillDefs(force) {
    if (_skillDefsLoaded && !force && _skillDefsCache) return _skillDefsCache.slice();
    try {
      if (typeof fbGet === 'function') {
        var raw = await fbGet('settings/skillDefs');
        if (Array.isArray(raw) && raw.length) {
          _skillDefsCache = raw.map(function (s) {
            return {
              id: String(s.id || _slugId(s.label || 'skill')),
              label: String(s.label || s.id || 'Skill'),
              labelHi: s.labelHi ? String(s.labelHi) : '',
              critical: !!s.critical
            };
          });
          _skillDefsLoaded = true;
          return _skillDefsCache.slice();
        }
      }
    } catch (e) {
      console.warn('[skills] loadSkillDefs', e);
    }
    _skillDefsCache = SEED_SKILLS.map(function (s) { return Object.assign({}, s); });
    _skillDefsLoaded = true;
    return _skillDefsCache.slice();
  }

  async function saveSkillDefs(defs) {
    if (!_canManageSkills()) {
      try { toast(_L('केवल Manager स्किल बदल सकता है', 'Only Manager can edit skills')); } catch (e) {}
      return false;
    }
    defs = (defs || []).map(function (s) {
      return {
        id: String(s.id || _slugId(s.label)),
        label: String(s.label || '').trim() || 'Skill',
        labelHi: s.labelHi ? String(s.labelHi).trim() : '',
        critical: !!s.critical
      };
    }).filter(function (s) { return s.label; });

    _skillDefsCache = defs;
    try {
      if (typeof fbSet === 'function') {
        await fbSet('settings/skillDefs', defs);
      }
      try { toast(_L('✅ स्किल लिस्ट सेव हो गई', '✅ Skill list saved')); } catch (e) {}
      return true;
    } catch (e) {
      console.warn('[skills] saveSkillDefs', e);
      try { toast('❌ ' + (e && e.message || 'Save failed')); } catch (e2) {}
      return false;
    }
  }

  function getEmpSkills(emp) {
    if (!emp) return {};
    return (emp.skills && typeof emp.skills === 'object') ? emp.skills : {};
  }

  function getStatus(emp, skillId) {
    var s = getEmpSkills(emp)[skillId];
    if (!s) return null;
    if (typeof s === 'string') return s;
    return s.status || null;
  }

  function statusMeta(statusKey) {
    return STATUS[statusKey] || {
      label: statusKey || '—',
      labelHi: statusKey || '—',
      color: '#94a3b8',
      bg: 'rgba(148,163,184,.12)',
      order: 0
    };
  }

  function computeCoverage(employees, skillIds) {
    var defs = getSkillDefsSync();
    skillIds = skillIds || defs.filter(function (s) { return s.critical; }).map(function (s) { return s.id; });
    if (!employees || !employees.length || !skillIds.length) return 0;
    var total = 0, good = 0;
    employees.forEach(function (emp) {
      skillIds.forEach(function (sid) {
        total++;
        var st = getStatus(emp, sid);
        if (st === 'competent' || st === 'canTrain') good++;
      });
    });
    return total ? Math.round((good / total) * 100) : 0;
  }

  function _getEmployees() {
    var employees = [];
    try {
      if (typeof getEmps === 'function') employees = getEmps() || [];
      else if (global._cache && Array.isArray(global._cache.employees)) {
        employees = (global._cache.employees || []).filter(function (e) {
          return e && e.status !== 'resigned' && e.status !== 'left' && e.status !== 'left_team';
        });
      }
    } catch (e) {}
    return employees;
  }

  function _findEmp(empKey) {
    var list = _getEmployees();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e) continue;
      if (String(e.id) === String(empKey) || String(e.empId) === String(empKey)) return e;
    }
    try {
      var all = (global._cache && global._cache.employees) || [];
      for (var j = 0; j < all.length; j++) {
        var a = all[j];
        if (a && (String(a.id) === String(empKey) || String(a.empId) === String(empKey))) return a;
      }
    } catch (e2) {}
    return null;
  }

  async function setEmpSkillStatus(empKey, skillId, status) {
    if (!_canManageSkills()) {
      try { toast(_L('केवल Manager स्टेटस बदल सकता है', 'Only Manager can change status')); } catch (e) {}
      return false;
    }
    if (!STATUS[status] && status !== null && status !== '') {
      try { toast('Invalid status'); } catch (e) {}
      return false;
    }

    var emp = _findEmp(empKey);
    if (!emp || !emp.id) {
      try { toast(_L('कर्मचारी नहीं मिला', 'Employee not found')); } catch (e) {}
      return false;
    }

    var skills = Object.assign({}, getEmpSkills(emp));
    if (!status) {
      delete skills[skillId];
    } else {
      var who = '';
      try {
        who = (SESSION && (SESSION.name || SESSION.mobile || SESSION.uid)) || '';
      } catch (e) {}
      skills[skillId] = {
        status: status,
        updatedAt: new Date().toISOString(),
        updatedBy: String(who).slice(0, 40)
      };
    }

    emp.skills = skills;
    try {
      if (global._cache && Array.isArray(global._cache.employees)) {
        var idx = global._cache.employees.findIndex(function (x) { return x && String(x.id) === String(emp.id); });
        if (idx >= 0) global._cache.employees[idx].skills = skills;
      }
    } catch (e3) {}

    try {
      if (typeof fbSet === 'function') {
        await fbSet('employees/' + emp.id + '/skills', skills);
      } else if (typeof fbUpdate === 'function') {
        await fbUpdate('employees/' + emp.id, { skills: skills });
      }
      return true;
    } catch (e) {
      console.warn('[skills] setEmpSkillStatus', e);
      try { toast('❌ ' + (e && e.message || 'Save failed')); } catch (e2) {}
      return false;
    }
  }

  // ─── Skill catalog editor (manager) ─────────────────────────────────────

  function openSkillCatalogEditor() {
    if (!_canManageSkills()) {
      try { toast(_L('केवल Manager स्किल लिस्ट बदल सकता है', 'Only Manager can edit the skill list')); } catch (e) {}
      return;
    }

    var existing = document.getElementById('skillCatalogEditor');
    if (existing) existing.remove();

    var defs = getSkillDefsSync().map(function (s) { return Object.assign({}, s); });

    var overlay = document.createElement('div');
    overlay.id = 'skillCatalogEditor';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:980;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:0;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--panel,#111d2e);width:100%;max-width:560px;max-height:92vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,.4);';

    panel.innerHTML =
      '<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0">' +
        '<div style="flex:1">' +
          '<div style="font-weight:900;font-size:16px;color:var(--text)">' + _L('स्किल लिस्ट एडिट करें', 'Edit Skill List') + '</div>' +
          '<div style="font-size:11px;color:var(--muted2);margin-top:2px">' + _L('किसी भी इंडस्ट्री के लिए अपनी स्किल्स जोड़ें / हटाएँ', 'Add or remove skills for any industry') + '</div>' +
        '</div>' +
        '<button type="button" id="skillCatClose" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-weight:800;cursor:pointer;font-family:inherit">✕</button>' +
      '</div>' +
      '<div id="skillCatList" style="flex:1;overflow:auto;padding:12px 14px;-webkit-overflow-scrolling:touch"></div>' +
      '<div style="padding:12px 14px;border-top:1px solid var(--border);flex-shrink:0;display:flex;flex-direction:column;gap:8px">' +
        '<button type="button" id="skillCatAdd" style="width:100%;padding:12px;border-radius:12px;border:1.5px dashed rgba(56,189,248,.45);background:rgba(56,189,248,.08);color:#38bdf8;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">＋ ' + _L('नई स्किल जोड़ें', 'Add new skill') + '</button>' +
        '<button type="button" id="skillCatSave" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit">' + _L('💾 सेव करें', '💾 Save skill list') + '</button>' +
      '</div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function renderList() {
      var list = document.getElementById('skillCatList');
      if (!list) return;
      if (!defs.length) {
        list.innerHTML = '<div style="text-align:center;padding:28px 12px;color:var(--muted2);font-size:13px">' +
          _L('कोई स्किल नहीं। नीचे से जोड़ें।', 'No skills yet. Add one below.') + '</div>';
        return;
      }
      var html = '';
      defs.forEach(function (sk, i) {
        html +=
          '<div class="skill-cat-row" data-idx="' + i + '" style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">' +
              '<input type="text" class="skill-cat-label" value="' + _esc(sk.label) + '" placeholder="Skill name (English)" ' +
                'style="flex:1;padding:9px 11px;border-radius:9px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-size:13px;font-weight:700;font-family:inherit">' +
              '<button type="button" class="skill-cat-del" data-idx="' + i + '" title="Delete" ' +
                'style="background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.3);border-radius:9px;padding:8px 11px;color:#f43f5e;font-weight:800;cursor:pointer;font-family:inherit">🗑</button>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<input type="text" class="skill-cat-labelhi" value="' + _esc(sk.labelHi || '') + '" placeholder="हिंदी नाम (optional)" ' +
                'style="flex:1;padding:8px 11px;border-radius:9px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-size:12px;font-family:inherit">' +
              '<label style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--muted2);white-space:nowrap;cursor:pointer">' +
                '<input type="checkbox" class="skill-cat-critical" ' + (sk.critical ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:#f97316">' +
                _L('क्रिटिकल', 'Critical') +
              '</label>' +
            '</div>' +
            '<div style="font-size:10px;color:var(--muted);margin-top:6px">id: ' + _esc(sk.id) + '</div>' +
          '</div>';
      });
      list.innerHTML = html;

      list.querySelectorAll('.skill-cat-del').forEach(function (btn) {
        btn.onclick = function () {
          var idx = parseInt(btn.getAttribute('data-idx'), 10);
          if (isNaN(idx)) return;
          if (!confirm(_L('यह स्किल हटाएँ?', 'Remove this skill?'))) return;
          defs.splice(idx, 1);
          renderList();
        };
      });
    }

    function collectFromDom() {
      var rows = panel.querySelectorAll('.skill-cat-row');
      var out = [];
      rows.forEach(function (row, i) {
        var labelEl = row.querySelector('.skill-cat-label');
        var hiEl = row.querySelector('.skill-cat-labelhi');
        var critEl = row.querySelector('.skill-cat-critical');
        var label = (labelEl && labelEl.value || '').trim();
        if (!label) return;
        var prev = defs[i] || {};
        out.push({
          id: prev.id || _slugId(label),
          label: label,
          labelHi: (hiEl && hiEl.value || '').trim(),
          critical: !!(critEl && critEl.checked)
        });
      });
      return out;
    }

    renderList();

    document.getElementById('skillCatClose').onclick = function () { overlay.remove(); };
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) overlay.remove();
    });

    document.getElementById('skillCatAdd').onclick = function () {
      defs = collectFromDom();
      defs.push({
        id: _slugId('new_skill_' + Date.now()),
        label: '',
        labelHi: '',
        critical: false
      });
      renderList();
      var inputs = panel.querySelectorAll('.skill-cat-label');
      var last = inputs[inputs.length - 1];
      if (last) last.focus();
    };

    document.getElementById('skillCatSave').onclick = async function () {
      var next = collectFromDom();
      if (!next.length) {
        try { toast(_L('कम से कम एक स्किल रखें', 'Keep at least one skill')); } catch (e) {}
        return;
      }
      next.forEach(function (s) {
        if (!s.id || String(s.id).indexOf('new_skill_') === 0) s.id = _slugId(s.label);
      });
      var ok = await saveSkillDefs(next);
      if (ok) {
        defs = next;
        overlay.remove();
        var matrix = document.getElementById('skillMatrixView');
        if (matrix) {
          matrix.remove();
          openSkillMatrix();
        }
      }
    };
  }

  // ─── Status picker ──────────────────────────────────────────────────────

  function openStatusPicker(empKey, skillId, currentStatus, cellEl) {
    if (!_canManageSkills()) {
      try { toast(_L('केवल Manager स्टेटस बदल सकता है', 'Only Manager can change status')); } catch (e) {}
      return;
    }

    var old = document.getElementById('skillStatusPicker');
    if (old) old.remove();

    var emp = _findEmp(empKey);
    var skill = getSkillDefsSync().find(function (s) { return s.id === skillId; });
    var empName = emp ? (emp.name || emp.empId || '') : empKey;
    var skillName = skill ? (_L(skill.labelHi || skill.label, skill.label)) : skillId;

    var overlay = document.createElement('div');
    overlay.id = 'skillStatusPicker';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:990;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--panel,#111d2e);width:100%;max-width:420px;border-radius:18px 18px 0 0;padding:16px;box-shadow:0 -8px 32px rgba(0,0,0,.35)';

    var optsHtml = STATUS_ORDER.map(function (k) {
      var m = STATUS[k];
      var on = currentStatus === k;
      return '<button type="button" data-st="' + k + '" style="' +
        'width:100%;text-align:left;padding:14px 14px;margin-bottom:8px;border-radius:12px;cursor:pointer;font-family:inherit;' +
        'border:2px solid ' + (on ? m.color : 'var(--border)') + ';' +
        'background:' + (on ? m.bg : 'var(--card)') + ';' +
        'color:' + m.color + ';font-weight:800;font-size:14px">' +
        (on ? '✓ ' : '') + _L(m.labelHi, m.label) +
        '</button>';
    }).join('');

    panel.innerHTML =
      '<div style="font-weight:900;font-size:15px;color:var(--text);margin-bottom:4px">' + _esc(empName) + '</div>' +
      '<div style="font-size:12px;color:var(--muted2);margin-bottom:14px">' + _esc(skillName) + '</div>' +
      optsHtml +
      '<button type="button" data-st="" style="width:100%;padding:12px;margin-top:4px;border-radius:12px;border:1px solid var(--border2);background:transparent;color:var(--muted);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">' +
        _L('हटाएँ / Clear', 'Clear status') +
      '</button>' +
      '<button type="button" id="skillPickCancel" style="width:100%;padding:12px;margin-top:8px;border-radius:12px;border:none;background:var(--card2);color:var(--text);font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">' +
        _L('रद्द', 'Cancel') +
      '</button>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }

    document.getElementById('skillPickCancel').onclick = close;
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) close(); });

    panel.querySelectorAll('button[data-st]').forEach(function (btn) {
      btn.onclick = async function () {
        var st = btn.getAttribute('data-st') || null;
        if (st === '') st = null;
        btn.disabled = true;
        var ok = await setEmpSkillStatus(empKey, skillId, st);
        if (ok) {
          if (cellEl) {
            cellEl.setAttribute('data-status', st || '');
            if (st) {
              var meta = statusMeta(st);
              cellEl.innerHTML = '<span style="display:inline-block;padding:4px 8px;border-radius:8px;font-size:10px;font-weight:800;background:' +
                meta.bg + ';color:' + meta.color + ';white-space:nowrap;cursor:pointer">' +
                _L(meta.labelHi, meta.label) + '</span>';
            } else {
              cellEl.innerHTML = '<span style="color:var(--muted);font-size:11px;cursor:pointer">—</span>';
            }
          }
          var badge = document.getElementById('skillMatrixCoverage');
          if (badge) {
            badge.textContent = computeCoverage(_getEmployees()) + '% covered';
          }
          close();
        } else {
          btn.disabled = false;
        }
      };
    });
  }

  // ─── Main Skill Matrix view ─────────────────────────────────────────────

  async function openSkillMatrix() {
    var existing = document.getElementById('skillMatrixView');
    if (existing) existing.remove();

    await loadSkillDefs();

    var employees = _getEmployees();
    var skills = getSkillDefsSync();
    var coverage = computeCoverage(employees);
    var canEdit = _canManageSkills();

    var view = document.createElement('div');
    view.id = 'skillMatrixView';
    view.style.cssText = 'position:fixed;inset:0;z-index:1300;background:var(--bg,#0a0f1a);display:flex;flex-direction:column;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg2,#111d2e);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap;';
    header.innerHTML =
      '<button type="button" id="skillMatrixBack" style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;padding:8px 12px;color:var(--text);font-size:13px;font-weight:800;cursor:pointer;font-family:inherit">← Back</button>' +
      '<div style="flex:1;min-width:120px">' +
        '<div style="font-weight:900;font-size:15px;color:var(--text)">' + _L('स्किल मैट्रिक्स', 'Skill Matrix') + '</div>' +
        '<div style="font-size:10px;color:var(--muted2);margin-top:1px">' +
          (canEdit
            ? _L('मैनेजर: स्किल और स्टेटस एडिट कर सकते हैं', 'Manager: edit skills & status')
            : _L('केवल देखने के लिए', 'View only')) +
        '</div>' +
      '</div>' +
      '<div id="skillMatrixCoverage" style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.35);border-radius:20px;padding:5px 11px;font-size:11px;font-weight:800;color:#22c55e;white-space:nowrap">' +
        coverage + '% covered' +
      '</div>' +
      (canEdit
        ? '<button type="button" id="skillMatrixEditList" style="background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.4);border-radius:10px;padding:7px 11px;color:#f97316;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap">✏️ ' +
            _L('स्किल लिस्ट', 'Skill list') + '</button>'
        : '');

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px;';

    if (!employees.length) {
      body.innerHTML =
        '<div style="text-align:center;padding:40px 20px;color:var(--muted2)">' +
          '<div style="font-size:40px;margin-bottom:12px">👷</div>' +
          '<div style="font-weight:800;font-size:15px;margin-bottom:6px">' + _L('कोई टीम मेंबर नहीं', 'No team members loaded') + '</div>' +
          '<div style="font-size:13px;line-height:1.5">' +
            _L('पहले टीम इम्पोर्ट / जोड़ें। स्किल मैट्रिक्स मौजूदा रोस्टर के ऊपर बैठता है।',
               'Import or add operators first. Skill Matrix sits on top of your existing roster.') +
          '</div>' +
        '</div>';
    } else if (!skills.length) {
      body.innerHTML =
        '<div style="text-align:center;padding:40px 20px;color:var(--muted2)">' +
          '<div style="font-size:40px;margin-bottom:12px">📋</div>' +
          '<div style="font-weight:800;font-size:15px;margin-bottom:6px">' + _L('कोई स्किल डिफ़ाइन नहीं', 'No skills defined') + '</div>' +
          '<div style="font-size:13px;line-height:1.5;margin-bottom:16px">' +
            _L('Manager अपनी इंडस्ट्री के अनुसार स्किल लिस्ट बनाएँ।', 'Manager: create a skill list for your industry.') +
          '</div>' +
          (canEdit
            ? '<button type="button" id="skillMatrixEmptyEdit" style="padding:12px 20px;border-radius:12px;border:none;background:#f97316;color:#fff;font-weight:900;cursor:pointer;font-family:inherit">' +
                _L('✏️ स्किल लिस्ट बनाएँ', '✏️ Create skill list') + '</button>'
            : '') +
        '</div>';
    } else {
      var legend = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
      STATUS_ORDER.forEach(function (k) {
        var m = STATUS[k];
        legend += '<span style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;background:' + m.bg + ';color:' + m.color + '">' +
          _L(m.labelHi, m.label) + '</span>';
      });
      if (canEdit) {
        legend += '<span style="font-size:10px;font-weight:600;padding:4px 10px;color:var(--muted2)">' +
          _L('सेल टैप → स्टेटस बदलें', 'Tap cell → change status') + '</span>';
      }
      legend += '</div>';

      var tableWrap = document.createElement('div');
      tableWrap.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:12px;border:1px solid var(--border);';

      var html = '<table style="border-collapse:collapse;width:max-content;min-width:100%;font-size:12px">';
      html += '<thead><tr style="background:var(--bg2)">';
      html += '<th style="position:sticky;left:0;z-index:2;background:var(--bg2);padding:10px 12px;text-align:left;font-weight:800;color:var(--muted2);border-bottom:1px solid var(--border);min-width:140px">' +
        _L('ऑपरेटर', 'Operator') + '</th>';
      skills.forEach(function (sk) {
        html += '<th style="padding:10px 8px;text-align:center;font-weight:800;color:var(--muted2);border-bottom:1px solid var(--border);min-width:92px;white-space:nowrap">' +
          _esc(_L(sk.labelHi || sk.label, sk.label)) +
          (sk.critical ? ' <span style="color:#f97316">*</span>' : '') +
          '</th>';
      });
      html += '</tr></thead><tbody>';

      employees.forEach(function (emp, idx) {
        var name = emp.name || emp.empId || ('#' + idx);
        var sub = [emp.mc, emp.designation || emp.resp].filter(Boolean).join(' · ');
        var empKey = emp.id || emp.empId || idx;
        html += '<tr style="border-bottom:1px solid var(--border)">';
        html += '<td style="position:sticky;left:0;z-index:1;background:var(--card,#162336);padding:10px 12px;font-weight:700;color:var(--text)">' +
          '<div>' + _esc(name) + '</div>' +
          (sub ? '<div style="font-size:10px;color:var(--muted);font-weight:600;margin-top:2px">' + _esc(sub) + '</div>' : '') +
          '</td>';
        skills.forEach(function (sk) {
          var st = getStatus(emp, sk.id);
          var meta = statusMeta(st);
          var pill = st
            ? '<span style="display:inline-block;padding:4px 8px;border-radius:8px;font-size:10px;font-weight:800;background:' + meta.bg +
                ';color:' + meta.color + ';white-space:nowrap' + (canEdit ? ';cursor:pointer' : '') + '">' +
                _L(meta.labelHi, meta.label) + '</span>'
            : '<span style="color:var(--muted);font-size:11px' + (canEdit ? ';cursor:pointer' : '') + '">—</span>';
          html += '<td class="skill-cell" style="padding:8px;text-align:center;vertical-align:middle' +
            (canEdit ? ';cursor:pointer' : '') + '" data-emp="' + _esc(empKey) + '" data-skill="' + _esc(sk.id) + '" data-status="' + _esc(st || '') + '">' +
            pill + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      tableWrap.innerHTML = html;

      body.innerHTML = legend;
      body.appendChild(tableWrap);

      var hint = document.createElement('div');
      hint.style.cssText = 'margin-top:14px;padding:12px;border-radius:10px;background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.25);font-size:12px;color:var(--muted2);line-height:1.5';
      hint.innerHTML = '<b style="color:var(--m1)">' + _L('वैकल्पिक लेयर', 'Optional layer') + '</b> — ' +
        _L('स्किल भरे बिना भी शिफ्ट और कवरेज पहले जैसा चलता रहेगा। Critical (*) स्किल्स पर Competent / Can Train का % ऊपर दिखता है।',
           'Shift & coverage keep working even with no skills filled. Coverage % counts Competent / Can Train on Critical (*) skills.');
      body.appendChild(hint);

      if (canEdit) {
        tableWrap.querySelectorAll('.skill-cell').forEach(function (cell) {
          cell.addEventListener('click', function () {
            var empKey = cell.getAttribute('data-emp');
            var skillId = cell.getAttribute('data-skill');
            var cur = cell.getAttribute('data-status') || null;
            openStatusPicker(empKey, skillId, cur || null, cell);
          });
        });
      }
    }

    view.appendChild(header);
    view.appendChild(body);
    document.body.appendChild(view);

    document.getElementById('skillMatrixBack').onclick = function () { view.remove(); };

    var editBtn = document.getElementById('skillMatrixEditList');
    if (editBtn) editBtn.onclick = function () { openSkillCatalogEditor(); };

    var emptyEdit = document.getElementById('skillMatrixEmptyEdit');
    if (emptyEdit) emptyEdit.onclick = function () { openSkillCatalogEditor(); };
  }

  global.MP_SKILLS = {
    SEED_SKILLS: SEED_SKILLS,
    STATUS: STATUS,
    getSkillDefsSync: getSkillDefsSync,
    loadSkillDefs: loadSkillDefs,
    saveSkillDefs: saveSkillDefs,
    getEmpSkills: getEmpSkills,
    getStatus: getStatus,
    statusMeta: statusMeta,
    computeCoverage: computeCoverage,
    setEmpSkillStatus: setEmpSkillStatus,
    openSkillMatrix: openSkillMatrix,
    openSkillCatalogEditor: openSkillCatalogEditor
  };

  global.openSkillMatrix = openSkillMatrix;
  global.openSkillCatalogEditor = openSkillCatalogEditor;

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () { loadSkillDefs().catch(function () {}); }, 1500);
      });
    } else {
      setTimeout(function () { loadSkillDefs().catch(function () {}); }, 1500);
    }
  } catch (e) {}

})(typeof window !== 'undefined' ? window : globalThis);
