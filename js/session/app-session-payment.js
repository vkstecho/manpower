/**
 * Man Power — Payment module entry (v6.0.54)
 * Logic lives in:
 *   js/session/pay-gate.js
 *   js/session/pay-trial.js
 *   js/session/pay-admin.js
 * This file keeps non-payment leftovers that were historically bundled here.
 */
function installLeaveReasonHook(){
    if(window._leaveReasonHooked) return;
    if(typeof window.editShiftCell !== 'function') return;
    window._leaveReasonHooked = true;
    const orig = window.editShiftCell;
    window.editShiftCell = function(empId, empName, date, currentShift){
      // If caller set force picker (Change shift from leave details), skip reason modal
      if(window._forceShiftPicker){
        window._forceShiftPicker = false;
        return orig.apply(this, arguments);
      }
      const sh = String(currentShift||'').toUpperCase();
      if(sh==='L' || sh.indexOf('L')===0){
        if(typeof showLeaveReasonForDay === 'function'){
          showLeaveReasonForDay(empId, empName, date, currentShift);
          return;
        }
      }
      return orig.apply(this, arguments);
    };
  }
  installLeaveReasonHook();
  document.addEventListener('firebase-ready', installLeaveReasonHook);
  setTimeout(installLeaveReasonHook, 2000);
  setTimeout(installLeaveReasonHook, 5000);
})();

/* Force G legend text on schedule */
(function mpFixGLegend(){
  function fix(){
    try{
      document.querySelectorAll('.shc, [class*="legend"]').forEach(function(){});
      // text nodes in schedule footer
      document.querySelectorAll('#scheduleScreen, #schedScreen, .sched-wrap, main').forEach(function(root){
        if(!root) return;
        root.querySelectorAll('span, div').forEach(function(el){
          if(el.children.length) return;
          const t = (el.textContent||'').trim();
          if(t === 'General' || t === 'G General' || t === 'General '){
            // find start/end from shift config
            let times = '08:00–20:00';
            try{
              const cfg = typeof getShiftConfigSync==='function' ? getShiftConfigSync() : null;
              const g = (cfg && cfg.shifts||[]).find(s=>s && String(s.code).toUpperCase()==='G');
              if(g && (g.start||g.startTime) && (g.end||g.endTime))
                times = (g.start||g.startTime)+'–'+(g.end||g.endTime);
            }catch(e){}
            el.textContent = 'General Shift · '+times;
          }
        });
      });
    }catch(e){}
  }
  setInterval(fix, 2000);
  document.addEventListener('click', function(){ setTimeout(fix, 400); });
})();

/* OTP step UI: hide learn/install chrome (safe, no MutationObserver) */
(function(){
  function markOtp(on){
    try{
      var ls = document.getElementById('loginScreen');
      if(!ls) return;
      if(on) ls.classList.add('otp-step'); else ls.classList.remove('otp-step');
    }catch(e){}
  }
  var _origShowStep = window.showStep;
  if(typeof _origShowStep === 'function'){
    window.showStep = function(n){
      try{ markOtp(Number(n)===2 || Number(n)===3); }catch(e){}
      return _origShowStep.apply(this, arguments);
    };
  } else {
    // poll lightly until showStep exists
    var t = setInterval(function(){
      if(typeof window.showStep === 'function' && !window.showStep._otpWrapped){
        var o = window.showStep;
        window.showStep = function(n){
          try{ markOtp(Number(n)===2 || Number(n)===3); }catch(e){}
          return o.apply(this, arguments);
        };
        window.showStep._otpWrapped = true;
        clearInterval(t);
      }
    }, 200);
    setTimeout(function(){ clearInterval(t); }, 15000);
  }
})();



(function(){
  // v6.0.48: fill landing video fields ONCE when payment modal appears.
  // Do NOT re-fill on an interval — that was wiping pasted YouTube URLs every 2s.
  var _filledFor = null;
  function _tryFillOnce(){
    var el = document.getElementById('pay_video_short');
    if(!el || typeof fillLandingVideoFields!=='function') return;
    // New modal instance (node replaced) → allow one fill
    if(_filledFor === el) return;
    _filledFor = el;
    try{ fillLandingVideoFields(false); }catch(e){}
  }
  if(typeof MutationObserver!=='undefined'){
    try{
      var _obs = new MutationObserver(function(){ _tryFillOnce(); });
      _obs.observe(document.documentElement,{childList:true,subtree:true});
    }catch(e){}
  }
  // light fallback only while page is settling — not continuous overwrite
  var n = 0;
  var t = setInterval(function(){
    _tryFillOnce();
    if(++n > 8) clearInterval(t);
  }, 400);
})();
