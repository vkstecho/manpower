/**
 * Man Power — accessibility enhancements (schedule grid + login)
 * Loaded after app modules. Does not change business logic.
 */
(function (global) {
  'use strict';

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
        headers[j].setAttribute('scope', headers[j].parentElement && headers[j].parentElement.parentElement && headers[j].parentElement.parentElement.tagName === 'THEAD' ? 'col' : 'col');
        if (!headers[j].getAttribute('role')) headers[j].setAttribute('role', 'columnheader');
      }
      // Keyboard: Enter/Space on focused cell opens edit when manager
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

  function runA11yPass() {
    enhanceLoginA11y();
    enhanceScheduleA11y();
    enhanceNavA11y();
  }

  global.enhanceScheduleA11y = enhanceScheduleA11y;
  global.enhanceLoginA11y = enhanceLoginA11y;
  global.runA11yPass = runA11yPass;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(runA11yPass, 100);
    });
  } else {
    setTimeout(runA11yPass, 100);
  }
})(typeof window !== 'undefined' ? window : globalThis);
