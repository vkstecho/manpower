"undefined"==typeof Notification&&(window.Notification={permission:"denied",requestPermission:()=>Promise.resolve("denied")}),document.addEventListener("keydown",function(e){if("F12"===e.key||e.ctrlKey&&e.shiftKey&&["I","J","C"].includes(e.key)||e.ctrlKey&&"U"===e.key)return e.preventDefault(),!1});var _fbStarted=!1;

/**
 * mp_session is stored as base64 (encodeSession), NOT raw JSON.
 * JSON.parse(raw) always fails → false "no session" → forced login.
 * Decode the same way as app-core decodeSession.
 */
function _mpParseStoredSession(raw){
  if(!raw) return null;
  try{
    if(typeof decodeSession === "function"){
      var d = decodeSession(raw);
      if(d && d.role) return d;
    }
  }catch(e){}
  try{
    var d2 = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if(d2 && d2.role) return d2;
  }catch(e){}
  try{
    var d3 = JSON.parse(raw);
    if(d3 && d3.role) return d3;
  }catch(e){}
  return null;
}

function _mpHasUsableSession(){
  try{
    if(typeof SESSION !== "undefined" && SESSION && SESSION.role) return true;
  }catch(e){}
  try{
    var raw = localStorage.getItem("mp_session");
    if(_mpParseStoredSession(raw)) return true;
  }catch(e){}
  try{
    var bak = sessionStorage.getItem("mp_session_bak");
    if(_mpParseStoredSession(bak)) return true;
  }catch(e){}
  try{
    var m = document.cookie.match(/mp_sess=([^;]+)/);
    if(m && _mpParseStoredSession(m[1])) return true;
  }catch(e){}
  return false;
}

function _mpFpScreenVisible(){
  try{
    var fp = document.getElementById("fingerprintScreen");
    if(!fp) return false;
    if(fp.classList && fp.classList.contains("show")) return true;
    var d = (fp.style && fp.style.display) || "";
    return d === "flex" || d === "block";
  }catch(e){ return false; }
}

/** Show login ONLY when there is truly no session — never kick logged-in users */
function _forceLogin(){
  try{
    if(_mpHasUsableSession()){
      try{ if(typeof loadSession === "function") loadSession(); }catch(e){}
      try{
        var login = document.getElementById("loginScreen");
        if(login){
          login.classList.remove("show");
          login.style.setProperty("display","none","important");
        }
      }catch(e){}
      // Fingerprint gate in progress — do not steal the screen
      if(_mpFpScreenVisible()) return;
      try{
        var hdr = document.getElementById("mainHdr");
        if(hdr) hdr.style.display = "";
        var main = document.getElementById("mainApp")||document.getElementById("appRoot")||document.getElementById("mainContent");
        if(main) main.style.display = "";
      }catch(e){}
      try{ if(typeof launchApp === "function") launchApp(); }catch(e){}
      return;
    }
  }catch(e){}

  // No session → show login
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

// Hide loader quickly
setTimeout(function(){
  var ls=document.getElementById("loadingScreen");
  ls&&(ls.style.cssText="display:none!important;opacity:0;pointer-events:none;visibility:hidden");
},800);

// Explicit logout URL only
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

// Safety net at 10s: recover stuck black screen — but NEVER kick a logged-in user
// and NEVER interrupt fingerprint unlock
setTimeout(function(){
  try{
    if(_mpHasUsableSession()){
      if(_mpFpScreenVisible()) return; // waiting for fingerprint
      var login=document.getElementById("loginScreen");
      if(login){login.classList.remove("show");login.style.setProperty("display","none","important");}
      var hdr=document.getElementById("mainHdr");
      if(hdr&&(hdr.style.display==="none"||!hdr.offsetParent)){
        if(typeof loadSession==="function")loadSession();
        if(typeof checkFingerprintOnStart==="function"){
          Promise.resolve(checkFingerprintOnStart()).then(function(fpShown){
            if(!fpShown && typeof launchApp==="function") launchApp();
          }).catch(function(){ if(typeof launchApp==="function") launchApp(); });
        } else if(typeof launchApp==="function"){
          launchApp();
        }
      }
      return;
    }
    // No session and still no app chrome → show login once
    if(_mpFpScreenVisible()) return;
    var hdr2=document.getElementById("mainHdr");
    var appVisible=hdr2&&hdr2.style.display!=="none"&&hdr2.offsetHeight>0;
    if(!appVisible) _forceLogin();
  }catch(e){}
},1e4);
