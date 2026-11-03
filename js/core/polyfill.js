"undefined"==typeof Notification&&(window.Notification={permission:"denied",requestPermission:()=>Promise.resolve("denied")}),document.addEventListener("keydown",function(e){if("F12"===e.key||e.ctrlKey&&e.shiftKey&&["I","J","C"].includes(e.key)||e.ctrlKey&&"U"===e.key)return e.preventDefault(),!1});var _fbStarted=!1;

/** mp_session is base64 (encodeSession) — never JSON.parse alone */
function _mpParseStoredSession(raw){
  if(!raw) return null;
  try{ if(typeof decodeSession==="function"){ var d=decodeSession(raw); if(d&&d.role) return d; } }catch(e){}
  try{ var d2=JSON.parse(decodeURIComponent(escape(atob(String(raw))))); if(d2&&d2.role) return d2; }catch(e){}
  try{ var d3=JSON.parse(raw); if(d3&&d3.role) return d3; }catch(e){}
  return null;
}
function _mpReadSessionRaw(){
  try{ var a=localStorage.getItem("mp_session"); if(a) return a; }catch(e){}
  try{ var b=sessionStorage.getItem("mp_session_bak"); if(b) return b; }catch(e){}
  try{ var m=document.cookie.match(/mp_sess=([^;]+)/); if(m) return m[1]; }catch(e){}
  return null;
}
function _mpHasUsableSession(){
  try{ if(typeof SESSION!=="undefined"&&SESSION&&SESSION.role) return true; }catch(e){}
  return !!_mpParseStoredSession(_mpReadSessionRaw());
}
function _mpFpScreenVisible(){
  try{
    var fp=document.getElementById("fingerprintScreen");
    if(!fp) return false;
    if(fp.classList&&fp.classList.contains("show")) return true;
    var d=(fp.style&&fp.style.display)||"";
    return d==="flex"||d==="block";
  }catch(e){ return false; }
}
function _mpHideLogin(){
  try{
    var login=document.getElementById("loginScreen");
    if(login){ login.classList.remove("show"); login.style.setProperty("display","none","important"); }
  }catch(e){}
}
function _mpSafeEnterApp(){
  try{
    if(typeof startApp==="function"){ try{ startApp(); }catch(e){} return; }
  }catch(e){}
  try{
    if(typeof initData==="function"){
      Promise.resolve(initData()).catch(function(){}).then(function(){
        try{
          if(typeof checkFingerprintOnStart==="function"){
            Promise.resolve(checkFingerprintOnStart()).then(function(fp){
              if(!fp&&typeof launchApp==="function") launchApp();
            }).catch(function(){ if(typeof launchApp==="function") launchApp(); });
          } else if(typeof launchApp==="function") launchApp();
        }catch(e){}
      });
      return;
    }
  }catch(e){}
  try{ if(typeof launchApp==="function") launchApp(); }catch(e){}
}
function _mpRestoreFromSession(){
  if(!_mpHasUsableSession()) return false;
  try{ if(typeof loadSession==="function") loadSession(); }catch(e){}
  _mpHideLogin();
  if(_mpFpScreenVisible()) return true;
  try{ _mpSafeEnterApp(); }catch(e){}
  return true;
}
function _forceLogin(){
  if(_mpHasUsableSession()){ _mpRestoreFromSession(); return; }
  try{
    var ls=document.getElementById("loadingScreen");
    if(ls){ls.style.cssText="display:none!important;opacity:0;pointer-events:none;visibility:hidden";ls.classList.remove("show");}
  }catch(e){}
  try{
    var login2=document.getElementById("loginScreen");
    if(login2){
      login2.style.display="flex";
      login2.style.visibility="visible";
      login2.style.opacity="1";
      login2.classList.add("show");
    }
    if(typeof showStep==="function"){try{showStep(1);}catch(e){}}
  }catch(e){}
}
setTimeout(function(){
  var ls=document.getElementById("loadingScreen");
  ls&&(ls.style.cssText="display:none!important;opacity:0;pointer-events:none;visibility:hidden");
},800);
if(-1!==window.location.search.indexOf("logout=")){
  try{history.replaceState(null,"",window.location.pathname);}catch(e){}
  try{localStorage.removeItem("mp_session");}catch(e){}
  try{localStorage.removeItem("mp_int_ok");}catch(e){}
  try{localStorage.removeItem("fp_registered");}catch(e){}
  try{sessionStorage.clear();}catch(e){}
  document.cookie="mp_sess=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  _forceLogin();
  setTimeout(_forceLogin,300);
  setTimeout(_forceLogin,1200);
}
function _mpSessionGuardTick(){
  try{
    if(!_mpHasUsableSession()) return;
    var login=document.getElementById("loginScreen");
    var loginVisible=login&&(login.classList.contains("show")||(login.style.display&&login.style.display!=="none"));
    if(loginVisible && !_mpFpScreenVisible()) _mpRestoreFromSession();
  }catch(e){}
}
setInterval(_mpSessionGuardTick, 2000);
setTimeout(_mpSessionGuardTick, 600);
setTimeout(_mpSessionGuardTick, 2500);
setTimeout(function(){
  try{
    if(_mpHasUsableSession()){ if(!_mpFpScreenVisible()) _mpRestoreFromSession(); return; }
    if(_mpFpScreenVisible()) return;
    var hdr2=document.getElementById("mainHdr");
    var appVisible=hdr2&&hdr2.style.display!=="none"&&hdr2.offsetHeight>0;
    if(!appVisible) _forceLogin();
  }catch(e){}
},10000);
