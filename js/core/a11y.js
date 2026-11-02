/**
 * Man Power — accessibility enhancements (schedule grid + login + nav + live regions)
 * Loaded after app modules. Does not change business logic.
 * v3.2.6 — expanded coverage, skip-link, focus management, announcements
 */
(function (global) {
  'use strict';

  function ensureSkipLink() {
    try {
      if (document.getElementById('mp-skip-main')) return;
      var a = document.createElement('a');
      a.id = 'mp-skip-main';
      a.href = '#mainContent';
      a.className = 'mp-skip-link';
      a.textContent = 'Skip to main content';
      a.style.cssText =
        'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000';
      a.addEventListener('focus', function () {
        a.style.cssText =
          'position:fixed;left:8px;top:8px;width:auto;height:auto;overflow:visible;padding:10px 14px;background:#0f172a;color:#fff;border-radius:8px;z-index:10000;text-decoration:none;font-weight:600';
      });
      a.addEventListener('blur', function () {
        a.style.cssText =
          'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000';
      });
      document.body.insertBefore(a, document.body.firstChild);
      var main = document.getElementById('mainContent') || document.querySelector('main') || document.getElementById('app');
      if (main && !main.id) main.id = 'mainContent';
      if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    } catch (e) {}
  }

  function ensureLiveRegion() {
    try {
      if (document.getElementById('mp-live-region')) return;
      var lr = document.createElement('div');
      lr.id = 'mp-live-region';
      lr.setAttribute('role', 'status');
      lr.setAttribute('aria-live', 'polite');
      lr.setAttribute('aria-atomic', 'true');
      lr.className = 'sr-only';
      lr.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
      document.body.appendChild(lr);
    } catch (e) {}
  }

  /** Announce short message to screen readers. */
  function announce(msg) {
    try {
      ensureLiveRegion();
      var lr = document.getElementById('mp-live-region');
      if (!lr) return;
      lr.textContent = '';
      setTimeout(function () {
        lr.textContent = String(msg || '');
      }, 40);
    } catch (e) {}
  }

  function enhanceScheduleA11y() {
    try {
      var tbl = document.getElementById('schedTbl');
      if (!tbl) return;
      tbl.setAttribute('role', 'grid');
      if (!tbl.getAttribute('aria-label')) {
        tbl.setAttribute('aria-label', 'Shift schedule');
      }
      var wrap = document.getElementById('schedWrap');
      if (wrap) {
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'Schedule grid');
        if (!wrap.hasAttribute('tabindex')) wrap.setAttribute('tabindex', '0');
      }
      var cells = tbl.querySelectorAll('td[data-empid]');
      for (var i = 0; i < cells.length; i++) {
        var td = cells[i];
        var emp = td.getAttribute('data-empid') || '';
        var date = td.getAttribute('data-date') || '';
        var sh = (td.textContent || '').trim() || td.getAttribute('data-origsh') || '';
        td.setAttribute('role', 'gridcell');
        td.setAttribute('tabindex', '0');
        td.setAttribute(
          'aria-label',
          'Employee ' + emp + (date ? ', date ' + date : '') + (sh ? ', shift ' + sh : '')
        );
      }
      var headers = tbl.querySelectorAll('th');
      for (var j = 0; j < headers.length; j++) {
        headers[j].setAttribute('scope', 'col');
        if (!headers[j].getAttribute('role')) headers[j].setAttribute('role', 'columnheader');
      }
      if (!tbl._a11yKey) {
        tbl._a11yKey = true;
        tbl.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          var td = e.target.closest && e.target.closest('td[data-empid]');
          if (!td) return;
          e.preventDefault();
          try {
            if (typeof td.click === 'function') td.click();
          } catch (err) {}
        });
        tbl.addEventListener('keydown', function (e) {
          if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
          var cell = e.target.closest && e.target.closest('td[data-empid]');
          if (!cell) return;
          var row = cell.parentElement;
          if (!row) return;
          var cellsInRow = Array.prototype.slice.call(row.querySelectorAll('td[data-empid]'));
          var colIdx = cellsInRow.indexOf(cell);
          var rows = Array.prototype.slice.call(tbl.querySelectorAll('tr'));
          var rowIdx = rows.indexOf(row);
          var next = null;
          if (e.key === 'ArrowLeft' && colIdx > 0) next = cellsInRow[colIdx - 1];
          if (e.key === 'ArrowRight' && colIdx < cellsInRow.length - 1) next = cellsInRow[colIdx + 1];
          if (e.key === 'ArrowUp' && rowIdx > 0) {
            var prevRowCells = rows[rowIdx - 1].querySelectorAll('td[data-empid]');
            next = prevRowCells[Math.min(colIdx, prevRowCells.length - 1)] || null;
          }
          if (e.key === 'ArrowDown' && rowIdx < rows.length - 1) {
            var nextRowCells = rows[rowIdx + 1].querySelectorAll('td[data-empid]');
            next = nextRowCells[Math.min(colIdx, nextRowCells.length - 1)] || null;
          }
          if (next) {
            e.preventDefault();
            next.focus();
          }
        });
      }
    } catch (e) {
      console.warn('[a11y] schedule', e && e.message);
    }
  }

  function enhanceLoginA11y() {
    try {
      var mobile = document.getElementById('loginMobile');
      if (mobile) {
        mobile.setAttribute('aria-label', '10-digit mobile number');
        mobile.setAttribute('autocomplete', 'tel');
        mobile.setAttribute('inputmode', 'numeric');
        if (!mobile.getAttribute('aria-describedby')) {
          var hint = document.getElementById('loginMobileHint');
          if (hint) {
            if (!hint.id) hint.id = 'loginMobileHint';
            mobile.setAttribute('aria-describedby', 'loginMobileHint');
          }
        }
      }
      var otp = document.getElementById('otpInput');
      if (otp) {
        otp.setAttribute('aria-label', '6-digit OTP');
        otp.setAttribute('inputmode', 'numeric');
        otp.setAttribute('autocomplete', 'one-time-code');
      }
      var sendBtn = document.getElementById('sendOtpBtn');
      if (sendBtn && !sendBtn.getAttribute('aria-label')) sendBtn.setAttribute('aria-label', 'Send OTP');
      var verifyBtn = document.getElementById('verifyOtpBtn');
      if (verifyBtn && !verifyBtn.getAttribute('aria-label')) verifyBtn.setAttribute('aria-label', 'Verify OTP');
      var loginScreen = document.getElementById('loginScreen');
      if (loginScreen && !loginScreen.getAttribute('role')) {
        loginScreen.setAttribute('role', 'main');
        loginScreen.setAttribute('aria-label', 'Login');
      }
    } catch (e) {
      console.warn('[a11y] login', e && e.message);
    }
  }

  function enhanceNavA11y() {
    try {
      var nav = document.querySelector('.nav-bottom, #bottomNav, nav.nb');
      if (nav) {
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main');
      }
      var tabs = document.querySelectorAll('.nav-bottom button, .nav-bottom .nav-item, .nb button');
      for (var i = 0; i < tabs.length; i++) {
        if (!tabs[i].getAttribute('aria-label') && tabs[i].textContent) {
          tabs[i].setAttribute('aria-label', (tabs[i].textContent || '').trim());
        }
      }
    } catch (e) {}
  }

  function enhanceModalsA11y() {
    try {
      var modals = document.querySelectorAll('.modal, [role="dialog"], .overlay-panel, .full-layer');
      for (var i = 0; i < modals.length; i++) {
        var m = modals[i];
        if (!m.getAttribute('role')) m.setAttribute('role', 'dialog');
        if (!m.getAttribute('aria-modal')) m.setAttribute('aria-modal', 'true');
      }
    } catch (e) {}
  }

  function enhanceButtonsA11y() {
    try {
      var iconBtns = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      for (var i = 0; i < iconBtns.length; i++) {
        var b = iconBtns[i];
        var t = (b.textContent || '').trim();
        var title = b.getAttribute('title');
        if (!t && title) b.setAttribute('aria-label', title);
      }
    } catch (e) {}
  }

  function runA11yPass() {
    ensureSkipLink();
    ensureLiveRegion();
    enhanceLoginA11y();
    enhanceScheduleA11y();
    enhanceNavA11y();
    enhanceModalsA11y();
    enhanceButtonsA11y();
  }

  global.enhanceScheduleA11y = enhanceScheduleA11y;
  global.enhanceLoginA11y = enhanceLoginA11y;
  global.runA11yPass = runA11yPass;
  global.mpAnnounce = announce;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(runA11yPass, 100);
    });
  } else {
    setTimeout(runA11yPass, 100);
  }

  try {
    var obs = new MutationObserver(function () {
      if (document.getElementById('schedTbl')) enhanceScheduleA11y();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        obs.observe(document.body, { childList: true, subtree: true });
      });
    }
  } catch (e) {}
})(typeof window !== 'undefined' ? window : globalThis);
