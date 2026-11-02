/* FEATURE MODULE: app-init-events
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
// ========== Init Flow ==========
MG.isMobileVerified = function(mob) {
  if (!mob) return false;
  try {
    if (localStorage.getItem('vks_mentor_verified_' + mob) === '1') return true;
  } catch {}
  try {
    if (localStorage.getItem(SITE_VERIFIED_KEY) === '1' && localStorage.getItem(SITE_PHONE_KEY) === mob) return true;
  } catch {}
  try {
    const u = window.MentorFB && window.MentorFB.auth && window.MentorFB.auth.currentUser;
    if (u && u.phoneNumber) {
      const digits = String(u.phoneNumber).replace(/\D/g, '').slice(-10);
      if (digits === mob) return true;
    }
  } catch {}
  // Inside Man Power app: parent session = verified (no extra OTP)
  try {
    const pm = MG.parentManPowerMobile();
    if (pm && pm === mob) return true;
    if (window.parent && window.parent !== window) {
      const sess = window.parent.localStorage && window.parent.localStorage.getItem('mp_session');
      if (sess && sess.includes(mob)) return true;
    }
  } catch {}
  // Navigated from Man Power (top-level) with ?from=mp&mobile=...
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'mp') {
      const m = String(params.get('mobile') || '').replace(/\D/g, '').slice(-10);
      if (m && m === mob) return true;
    }
  } catch {}
  return false;
}

MG.init = async function() {
  // Theme
  MG.applyTheme(localStorage.getItem(MG.THEME_KEY) || 'light');
  MG.bindEvents();

  // Site logout (website only — hidden inside Man Power iframe)
  try {
    var lo = document.getElementById('siteLogoutBtn');
    if (lo) {
      if (MG.isInsideManPower()) lo.style.display = 'none';
      else lo.addEventListener('click', function () { MG.doSiteLogout(); });
    }
  } catch (e) {}


  // Wait a moment for Firebase module
  for (let i = 0; i < 15 && !(window.MentorFB && window.MentorFB.ready); i++) {
    await new Promise(r => setTimeout(r, 100));
  }

  // Detect mobile: Man Power parent first (no OTP), then site shared auth, then URL/storage
  let detected = MG.parentManPowerMobile() || MG.getSiteAuthMobile() || MG.detectMobile();
  if (!detected) {
    detected = await MG.requestMobileFromParent();
  }
  // Inside Man Power iframe: always trust parent phone if present
  if (MG.isInsideManPower() && MG.parentManPowerMobile()) {
    detected = MG.parentManPowerMobile();
    MG.setSiteAuth(detected);
    MG.startApp(detected);
    return;
  }
  // Top-level open from Man Power Learn & Grow (?from=mp&mobile=)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'mp') {
      const m = String(params.get('mobile') || detected || '').replace(/\D/g, '').slice(-10);
      if (/^[6-9]\d{9}$/.test(m)) {
        MG.setSiteAuth(m);
        MG.startApp(m);
        return;
      }
    }
  } catch (e) {}

  // Only auto-enter if this mobile was OTP-verified (or Man Power parent session)
  if (detected && MG.isMobileVerified(detected)) {
    MG.startApp(detected);
  } else {
    var _mp = MG.$('#mobilePrompt');
    if (_mp) { _mp.classList.remove('hidden'); _mp.classList.add('flex'); }
    if (detected) {
      const input = MG.$('#mobileInput');
      if (input) input.value = detected;
    }
    MG.$('#mobileInput')?.focus();
  }
}

MG.startApp = async function(mob) {
  MG.state.mobile = mob;
  MG.state.isMentor = false;
  MG.state.data = MG.loadUserData(MG.state.mobile); // instant from cache
  MG.$('#mobileDisplay').textContent = '+91 ' + MG.state.mobile;
    try { MG.refreshProfileButton(); } catch (e) {}
  MG.$('#mentorBadge')?.classList.add('hidden');
  MG.$('#mentorStudentBar')?.classList.add('hidden');
  // Mentor unlock control: only admin number
  try {
    var pinBtn = document.getElementById('mentorPinBtn');
    if (pinBtn) {
      if (String(mob) === MG.MENTOR_MOBILE) {
        pinBtn.style.display = '';
        pinBtn.removeAttribute('hidden');
      } else {
        pinBtn.style.display = 'none';
        pinBtn.setAttribute('hidden', 'true');
      }
    }
  } catch (e) {}
  // Admin mobile: auto Mentor mode (no OTP / no key click) — website or Man Power session
  try {
    if (String(mob) === MG.MENTOR_MOBILE) {
      MG.enableMentorMode({ silent: true });
    }
  } catch (e) {}
  try { MG.loadTrackSettings(); } catch (e) {}
  MG.$('#mobilePrompt').classList.add('hidden');
  MG.$('#mobilePrompt').classList.remove('flex');
  MG.$('#app').classList.remove('hidden');
  MG.renderCatalog();
  // Then refresh from Firebase
  try {
    MG.state.data = await MG.loadUserDataAsync(MG.state.mobile);
    MG.startRealtimeFor(MG.state.mobile);
    MG.renderCatalog();
  } catch (e) {}
}

MG.esc = function(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ========== Events ==========
MG.bindEvents = function() {
  // Mobile prompt
  // ---- Firebase Phone OTP login ----
  let _pendingMobile = null;

  MG.showOtpStep = function(showCode) {
    const phone = MG.$('#otpStepPhone');
    const code = MG.$('#otpStepCode');
    if (phone) phone.classList.toggle('hidden', !!showCode);
    if (code) code.classList.toggle('hidden', !showCode);
    if (showCode) {
      MG.$('#loginTitle').textContent = 'Enter OTP';
      MG.$('#loginSub').textContent = 'OTP sent to +91 ' + _pendingMobile;
      setTimeout(() => MG.$('#otpInput')?.focus(), 100);
    } else {
      MG.$('#loginTitle').textContent = 'Login with Mobile OTP';
      MG.$('#loginSub').textContent = 'Enter mobile number to continue';
    }
  }

  MG.sendMentorOtp = async function() {
    const val = (MG.$('#mobileInput').value || '').trim();
    const m = MG.extractMobileFromString(val) || (/^[6-9]\d{9}$/.test(val) ? val : null);
    if (!m) {
      MG.$('#mobileError')?.classList.remove('hidden');
      return;
    }
    MG.$('#mobileError')?.classList.add('hidden');
    const btn = MG.$('#mobileSubmit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Sending OTP…'; }
    try {
      if (!window.MentorFB || !window.MentorFB.sendPhoneOtp) {
        // Wait briefly for module
        await new Promise(r => setTimeout(r, 800));
      }
      if (!window.MentorFB || !window.MentorFB.sendPhoneOtp) {
        throw new Error('Firebase not ready. Refresh and try again.');
      }
      await window.MentorFB.sendPhoneOtp(m);
      _pendingMobile = m;
      MG.showOtpStep(true);
      MG.showToast('OTP sent to +91 ' + m);
    } catch (e) {
      console.error('[sendMentorOtp]', e);
      var code = (e && e.code) ? String(e.code) : '';
      var msg = (e && e.message) ? String(e.message) : 'Failed to send OTP';
      if (code.indexOf('too-many-requests') >= 0 || /too-many-requests/i.test(msg)) {
        msg = 'Too many OTP attempts. Wait a few minutes and try again.';
      } else if (/invalid-phone/i.test(code + msg)) {
        msg = 'Invalid mobile number.';
      } else if (/captcha|recaptcha|app-credential|invalid-app/i.test(msg + code)) {
        msg = 'Security check failed. Complete reCAPTCHA, and ensure mentor.vkstech.com is in Firebase Authorized domains.';
      } else if (/network|Failed to fetch|offline/i.test(msg)) {
        msg = 'Network error. Check internet and try again.';
      } else if (/Firebase not ready/i.test(msg)) {
        msg = 'App still loading. Wait 2 seconds and tap Send OTP again.';
      }
      MG.showToast(msg);
      var err = MG.$('#mobileError');
      if (err) { err.textContent = msg; err.classList.remove('hidden'); }
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane mr-1.5"></i> Send OTP'; }
    }
  }

  MG.verifyMentorOtp = async function() {
    const code = (MG.$('#otpInput').value || '').trim();
    if (!/^[0-9]{6}$/.test(code)) {
      MG.$('#otpError')?.classList.remove('hidden');
      return;
    }
    MG.$('#otpError')?.classList.add('hidden');
    const btn = MG.$('#otpVerifyBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Verifying…'; }
    try {
      await window.MentorFB.verifyPhoneOtp(code);
      MG.setSiteAuth(_pendingMobile);
      MG.showToast('Login verified');
      MG.startApp(_pendingMobile);
    } catch (e) {
      console.error(e);
      MG.$('#otpError').textContent = 'Invalid OTP. Please try again.';
      MG.$('#otpError')?.classList.remove('hidden');
      MG.showToast('OTP verification failed');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-1.5"></i> Verify & Continue'; }
    }
  }

  MG.$('#mobileSubmit')?.addEventListener('click', function () { MG.sendMentorOtp(); });
  MG.$('#mobileInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') MG.sendMentorOtp();
  });
  MG.$('#otpVerifyBtn')?.addEventListener('click', function () { MG.verifyMentorOtp(); });
  MG.$('#otpInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') MG.verifyMentorOtp();
  });
  MG.$('#otpResendBtn')?.addEventListener('click', async () => {
    if (_pendingMobile) {
      MG.$('#mobileInput').value = _pendingMobile;
      MG.showOtpStep(false);
      await MG.sendMentorOtp();
    }
  });
  MG.$('#otpChangeNumBtn')?.addEventListener('click', () => {
    _pendingMobile = null;
    MG.showOtpStep(false);
    MG.$('#otpInput').value = '';
  });

  // Header
  var _bb = MG.$('#backBtn'); if (_bb) _bb.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.close();
  });
  var _tt = MG.$('#themeToggle'); if (_tt) _tt.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    MG.applyTheme(isDark ? 'light' : 'dark');
  });
  var _ph = MG.$('#paymentHistoryBtn'); if (_ph) _ph.addEventListener('click', function(){ MG.openHistory(); });
  var _ch=MG.$('#closeHistory'); if(_ch) _ch.addEventListener('click', () => {
    MG.$('#historyModal').classList.add('hidden');
    MG.$('#historyModal').classList.remove('flex');
  });
  var _ex = MG.$('#exportCsvBtn'); if (_ex) _ex.addEventListener('click', function(){ MG.exportCsv(); });

  // Mentor OTP (protected)
  var _mpb=MG.$('#mentorPinBtn'); if(_mpb) _mpb.addEventListener('click', () => {
    if (MG.state.isMentor) {
      MG.showToast('Already in Mentor mode');
      return;
    }
    // Must be logged in as the mentor number
    if (MG.state.mobile !== MG.MENTOR_MOBILE) {
      MG.showToast('Switch to admin number +91 ' + MG.MENTOR_MOBILE + ' to request OTP');
      return;
    }
    MG.requestMentorOTP();
  });
  var _ps=MG.$('#pinSubmit'); if(_ps) _ps.addEventListener('click', () => {
    MG.verifyMentorOTP();
  });
  var _mpi=MG.$('#mentorPinInput'); if(_mpi) _mpi.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') MG.verifyMentorOTP();
  });
  var _pc=MG.$('#pinCancel'); if(_pc) _pc.addEventListener('click', () => {
    MG.$('#pinModal').classList.add('hidden');
    MG.$('#pinModal').classList.remove('flex');
  });

  // Student selector
  var _ss=MG.$('#studentSelect'); if(_ss) _ss.addEventListener('change', (e) => {
    MG.switchStudent(e.target.value || null);
  });
  var _rs = MG.$('#refreshStudentsBtn'); if (_rs) _rs.addEventListener('click', function(){ MG.refreshStudentList(); });

  // Booking
  var _cb = MG.$('#closeBooking'); if (_cb) _cb.addEventListener('click', function(){ MG.closeBooking(); });
  MG.$$('.hrs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      MG.state.selectedHours = parseInt(btn.dataset.hrs, 10) || 1;
      MG.selectedPackageDisc = parseInt(btn.dataset.disc, 10) || 0;
      MG.$$('.hrs-btn').forEach(b => b.classList.remove('active-hrs'));
      btn.classList.add('active-hrs');
      MG.updateBookingTotal();
    });
  });
  document.querySelectorAll('.track-card').forEach(function (btn) {
    btn.addEventListener('click', function () {
      MG.selectTrack(btn.getAttribute('data-track'));
    });
  });
  var focusSel = document.getElementById('bookingTopicFocus');
  if (focusSel) {
    focusSel.addEventListener('change', function () {
      var c = document.getElementById('bookingTopicCustom');
      if (c) c.classList.toggle('hidden', focusSel.value !== '__custom__');
    });
  }
  var _pay = MG.$('#payNowBtn'); if (_pay) _pay.addEventListener('click', function(){
    try { if (typeof MG.notifyMentorPayIntent === 'function') MG.notifyMentorPayIntent(); } catch (e) {}
  });
  var _cp = MG.$('#confirmPaidBtn'); if (_cp) _cp.addEventListener('click', function(){ MG.confirmPayment(); });
  var pricingBtn = document.getElementById('pricingAdminBtn');
  if (pricingBtn) {
    pricingBtn.addEventListener('click', function(){ (window.openPricingAdmin||MG.openPricingAdmin)(); });
  }
  var closePr = document.getElementById('closePricingAdmin');
  if (closePr) closePr.addEventListener('click', function () {
    var m = document.getElementById('pricingAdminModal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); m.style.display = 'none'; }
  });
  var pricingModalEl = document.getElementById('pricingAdminModal');
  if (pricingModalEl) {
    pricingModalEl.addEventListener('click', function (e) {
      if (e.target === pricingModalEl) {
        pricingModalEl.classList.add('hidden');
        pricingModalEl.classList.remove('flex');
        pricingModalEl.style.display = 'none';
      }
    });
  }
  var savePr = document.getElementById('savePricingAdmin');
  if (savePr) savePr.addEventListener('click', function(){ (window.savePricingAdmin||MG.savePricingAdmin)(); });

  // Workspace
  var _btc = MG.$('#backToCatalog'); if (_btc) _btc.addEventListener('click', function(){ MG.backToCatalog(); });
  MG.$('#bookMoreBtn').addEventListener('click', () => {
    if (MG.state.currentTopicId) MG.openBooking(MG.state.currentTopicId);
  });
  var _ar = MG.$('#addRecBtn'); if (_ar) _ar.addEventListener('click', function(){ MG.addRecording(); });
  var _sc = MG.$('#sendChatBtn'); if (_sc) _sc.addEventListener('click', function(){ MG.sendChat(); });
  var _ci=MG.$('#chatInput'); if(_ci) _ci.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') MG.sendChat();
  });
}


// Boot
document.addEventListener('DOMContentLoaded', function () {
  try { MG.init(); } catch (e) { console.error('MG.init', e); }
  try {
    var appEl = document.getElementById('app');
    var mp = document.getElementById('mobilePrompt');
    if (mp && appEl && appEl.classList.contains('hidden') && mp.classList.contains('hidden')) {
      mp.classList.remove('hidden'); mp.classList.add('flex');
    }
  } catch (e2) {}
  try { MG.loadTrackSettings(); } catch (e) {}
  try { MG.initMentorPwaUi();
  try { MG.initProfileUi(); } catch (e) {} } catch (e) {}
  try { MG.renderFreePackSection(); } catch (e) {}
});

})(window.MG = window.MG || {});
