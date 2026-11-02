/* FEATURE MODULE: pwa
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';
// ========== PWA Install + Share + Play Store ==========
let _mentorDeferredPrompt = window.__mentorDeferredPrompt || null;
try {
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    _mentorDeferredPrompt = e;
    window.__mentorDeferredPrompt = e;
    try {
      ['mentorInstallDesktopBtn','mentorInstallAndroidBtn','mentorInstallBtn'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) { el.classList.remove('hidden'); el.classList.add('ring-2','ring-offset-1','ring-blue-400'); }
      });
      var bar = document.getElementById('mentorInstallBar');
      if (bar) bar.classList.remove('hidden');
    } catch (err) {}
  });
} catch (e0) {}
// Shared on MG so Rates admin (mg-workspace) can read/write without ReferenceError
MG._playStoreUrl = MG._playStoreUrl || 'https://play.google.com/store/apps/details?id=com.vkstech.mentor';

MG._mentorIsStandalone = function() {
  try {
    var standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches
      || window.navigator.standalone === true;
    if (!standalone) return false;
    // If Chrome still offers install, Mentor is not fully installed as its own app
    if (window.__mentorDeferredPrompt) return false;
    return true;
  } catch (e) { return false; }
}

/** True only when this window is the installed Mentor app (not Man Power shell). */
MG._mentorIsInstalledApp = function() {
  try {
    if (!MG._mentorIsStandalone()) return false;
    var ref = String(document.referrer || '');
    if (/manpower\.vkstech\.com/i.test(ref)) return false;
    return true;
  } catch (e) { return MG._mentorIsStandalone(); }
}

MG._mentorUa = function() {
  var ua = navigator.userAgent || '';
  return {
    android: /android/i.test(ua),
    ios: /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    windows: /windows/i.test(ua),
    mac: /macintosh|mac os x/i.test(ua) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    chrome: /chrome|crios|edg/i.test(ua) && !/opr\//i.test(ua)
  };
}

MG.refreshPlayStoreButton = function() {
  const a = document.getElementById('mentorPlayStoreBtn');
  if (!a) return;
  const url = String(MG._playStoreUrl || '').trim();
  if (/^https?:\/\//i.test(url)) {
    a.href = url;
    a.classList.remove('hidden');
  } else {
    a.classList.add('hidden');
    a.removeAttribute('href');
  }
}

MG.loadAppPublicSettings = async function() {
  try {
    if (!window.MentorFB || typeof window.MentorFB.get !== 'function') return;
    const remote = await window.MentorFB.get('mentor_settings/app');
    if (remote && typeof remote === 'object') {
      if (remote.playStoreUrl) MG._playStoreUrl = String(remote.playStoreUrl);
      MG.refreshPlayStoreButton();
    }
  } catch (e) {}
}

MG._showInstallGuide = function(kind) {
  var title, body;
  if (kind === 'android') {
    title = 'Install on Android';
    body = '1. Open this page in <b>Chrome</b><br>2. Tap the menu (⋮) → <b>Install app</b> or <b>Add to Home screen</b><br>3. Confirm Install<br><br>Or wait for the Chrome install banner and tap Install.';
  } else if (kind === 'ios') {
    title = 'Install on iPhone / iPad';
    body = '1. Open in <b>Safari</b> (required)<br>2. Tap the <b>Share</b> button <span style="font-size:1.1em">⎋</span><br>3. Scroll and tap <b>Add to Home Screen</b><br>4. Tap <b>Add</b><br><br>Mentor will appear like a normal app icon.';
  } else {
    title = 'Install on Windows / Mac (Desktop)';
    body = '1. Open <b>https://mentor.vkstech.com/mentor.html</b> in <b>Chrome</b> or <b>Edge</b> (not inside the Man Power app window)<br>2. Click the <b>install icon</b> in the address bar (monitor / ⊕ icon)<br>3. Or menu ⋮ → <b>Cast, save and share</b> → <b>Install page as app</b><br>4. Confirm — Mentor appears in Start menu as its own app<br><br>Tip: If Install is missing, hard-refresh (Ctrl+Shift+R) on mentor.html first.';
  }
  var existing = document.getElementById('mentorInstallGuideModal');
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = 'mentorInstallGuideModal';
  modal.className = 'fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/50 p-3';
  modal.innerHTML =
    '<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-600">' +
    '<div class="flex items-start justify-between gap-3 mb-3">' +
    '<h3 class="text-base font-bold text-slate-900 dark:text-white">' + title + '</h3>' +
    '<button type="button" id="mentorInstallGuideClose" class="text-slate-400 hover:text-slate-700 text-xl leading-none px-1">&times;</button>' +
    '</div>' +
    '<div class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">' + body + '</div>' +
    '<button type="button" id="mentorInstallGuideOk" class="mt-4 w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">Got it</button>' +
    '</div>';
  document.body.appendChild(modal);
  function close() { try { modal.remove(); } catch (e) {} }
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  var c1 = document.getElementById('mentorInstallGuideClose');
  var c2 = document.getElementById('mentorInstallGuideOk');
  if (c1) c1.addEventListener('click', close);
  if (c2) c2.addEventListener('click', close);
}

MG._tryNativeInstall = async function(preferLabel) {
  var promptEvent = _mentorDeferredPrompt || window.__mentorDeferredPrompt || null;
  if (promptEvent) {
    try {
      promptEvent.prompt();
      var choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        MG.showToast('Installing Mentor as desktop app…');
        try {
          var hint = document.getElementById('mentorInstallHint');
          if (hint) hint.textContent = 'Installed — open Mentor from Start menu / desktop.';
        } catch (eH) {}
      } else {
        MG.showToast('Install cancelled — use Chrome menu ⋮ → Install Mentor…');
      }
    } catch (e) {
      console.warn('[Mentor PWA] prompt failed', e);
      return false;
    }
    _mentorDeferredPrompt = null;
    window.__mentorDeferredPrompt = null;
    return true;
  }
  if (typeof MG._mentorIsInstalledApp === 'function' ? MG._mentorIsInstalledApp() : MG._mentorIsStandalone()) {
    MG.showToast('Mentor is already installed — open it from Start menu or desktop shortcut');
    return true;
  }
  return false;
}

MG.initMentorPwaUi = function() {
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    _mentorDeferredPrompt = e;
    try {
      var a = document.getElementById('mentorInstallAndroidBtn');
      var d = document.getElementById('mentorInstallDesktopBtn');
      if (a) a.classList.add('ring-2', 'ring-offset-1', 'ring-emerald-400');
      if (d) d.classList.add('ring-2', 'ring-offset-1', 'ring-blue-400');
    } catch (err) {}
  });
  window.addEventListener('appinstalled', function () {
    _mentorDeferredPrompt = null;
    MG.showToast('Mentor installed — check your home screen / app list');
    var hint = document.getElementById('mentorInstallHint');
    if (hint) hint.textContent = 'App installed on this device.';
  });

  var androidBtn = document.getElementById('mentorInstallAndroidBtn');
  if (androidBtn) {
    androidBtn.addEventListener('click', async function () {
      var ua = MG._mentorUa();
      var used = await MG._tryNativeInstall('Android');
      if (used) return;
      if (ua.ios) {
        MG.showToast('This is iPhone — use “Install · iOS / Desktop”');
        MG._showInstallGuide('ios');
        return;
      }
      MG._showInstallGuide('android');
    });
  }

  var desktopBtn = document.getElementById('mentorInstallDesktopBtn');
  if (desktopBtn) {
    desktopBtn.addEventListener('click', async function () {
      var ua = MG._mentorUa();
      if (ua.ios) {
        if (MG._mentorIsStandalone()) {
          MG.showToast('Already on Home Screen');
          return;
        }
        MG._showInstallGuide('ios');
        return;
      }
      var used = await MG._tryNativeInstall('Desktop');
      if (used) return;
      MG._showInstallGuide('desktop');
    });
  }

  // Legacy single button (hidden) still works if referenced
  var installBtn = document.getElementById('mentorInstallBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async function () {
      var ua = MG._mentorUa();
      if (ua.ios) { MG._showInstallGuide('ios'); return; }
      var used = await MG._tryNativeInstall('App');
      if (!used) MG._showInstallGuide(ua.android ? 'android' : 'desktop');
    });
  }

  var shareBtn = document.getElementById('mentorShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async function () {
      var url = 'https://mentor.vkstech.com/';
      var title = 'Mentor — One-to-One Guidance';
      var text = 'Book Career & AI or Flexible Packaging mentorship with VKS Tech.';
      try {
        if (navigator.share) {
          await navigator.share({ title: title, text: text, url: url });
          return;
        }
      } catch (e) {}
      try {
        await navigator.clipboard.writeText(url);
        MG.showToast('Link copied: mentor.vkstech.com');
      } catch (e2) {
        prompt('Copy this link:', url);
      }
    });
  }

  var hasPrompt = !!( _mentorDeferredPrompt || window.__mentorDeferredPrompt );
  var isInstalled = (typeof MG._mentorIsInstalledApp === 'function' ? MG._mentorIsInstalledApp() : MG._mentorIsStandalone()) && !hasPrompt;
  if (isInstalled) {
    var hint = document.getElementById('mentorInstallHint');
    if (hint) hint.textContent = 'Running as installed Mentor app.';
    ['mentorInstallDesktopBtn','mentorInstallAndroidBtn'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  } else {
    var desk = document.getElementById('mentorInstallDesktopBtn');
    if (desk) desk.classList.remove('hidden');
    var bar = document.getElementById('mentorInstallBar');
    if (bar) bar.classList.remove('hidden');
    var hint2 = document.getElementById('mentorInstallHint');
    if (hint2) {
      hint2.textContent = hasPrompt
        ? 'Chrome is ready — click Install · iOS / Windows to add Mentor as a desktop app.'
        : 'Open mentor.vkstech.com/mentor.html in Chrome/Edge (not inside Man Power), then Install or use the address-bar install icon.';
    }
  }
  // Always expose Play Store link (when not hidden above)
  try {
    var a = document.getElementById('mentorPlayStoreBtn');
    if (a && !MG._mentorIsStandalone()) {
      a.href = MG._playStoreUrl || 'https://play.google.com/store/apps/details?id=com.vkstech.mentor';
      a.classList.remove('hidden');
    }
  } catch (e) {}
  MG.loadAppPublicSettings();
}

})(window.MG = window.MG || {});
