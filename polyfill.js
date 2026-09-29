
// Safe Notification polyfill
if(typeof Notification === 'undefined'){ window.Notification = { permission:'denied', requestPermission:()=>Promise.resolve('denied') }; }
// ── Security: Disable devtools shortcuts ──
document.addEventListener('keydown', function(e){
  if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&['I','J','C'].includes(e.key))||(e.ctrlKey&&e.key==='U')){
    e.preventDefault(); return false;
  }
});

// ══ BULLETPROOF STARTUP ══
// Only fires if Firebase hasn't initialized after 4 seconds (true fallback)
var _fbStarted = false;
function _forceLogin(){
  if(_fbStarted) return; // Firebase already handled startup — do nothing
  var ls=document.getElementById('loadingScreen');
  if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
  // Only show login if no app or login is visible
  var appEl=document.getElementById('mainHdr');
  if(appEl && appEl.style.display!=='none') return;
  var login=document.getElementById('loginScreen');
  if(login && (login.style.display==='flex' || login.classList.contains('show'))) return;
  if(login){ login.style.display='flex'; login.classList.add('show'); }
  if(typeof showStep==='function') try{ showStep(1); }catch(e){}
}
// Hide loadingScreen after 1.2s — ensures z-index:9999 doesn't block taps
setTimeout(function(){
  var ls = document.getElementById('loadingScreen');
  if(ls){ ls.style.cssText='display:none!important;opacity:0;pointer-events:none;visibility:hidden'; }
}, 1200);

// ── If we arrived via ?logout= parameter, clean URL and force login ──
if(window.location.search.indexOf('logout=') !== -1){
  try{ history.replaceState(null, '', window.location.pathname); }catch(e){}
  // Ensure all session data is cleared
  try{ localStorage.removeItem('mp_session'); }catch(e){}
  try{ localStorage.removeItem('mp_int_ok'); }catch(e){}
  try{ localStorage.removeItem('fp_registered'); }catch(e){}
  try{ sessionStorage.clear(); }catch(e){}
  document.cookie = 'mp_sess=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
}

// Only trigger if Firebase fails completely (10 seconds)
setTimeout(_forceLogin, 10000);
