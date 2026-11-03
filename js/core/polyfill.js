"undefined"==typeof Notification&&(window.Notification={permission:"denied",requestPermission:()=>Promise.resolve("denied")}),document.addEventListener("keydown",function(e){if("F12"===e.key||e.ctrlKey&&e.shiftKey&&["I","J","C"].includes(e.key)||e.ctrlKey&&"U"===e.key)return e.preventDefault(),!1});var _fbStarted=!1;

/** Show login ONLY when there is truly no session — never kick logged-in users */
function _forceLogin(){
  try{
    // If a valid session exists, restore app — do NOT show landing
    var raw = null;
    try{ raw = localStorage.getItem("mp_session"); }catch(e){}
    if(raw){
      try{
        var p = JSON.parse(raw);
        if(p && p.role){
          try{ if(typeof loadSession==="function") loadSession(); }catch(e){}
          try{
            var login = document.getElementById("loginScreen");
            if(login){
              login.classList.remove("show");
              login.style.setProperty("display","none","important");
            }
          }catch(e){}
          try{
            var hdr = document.getElementById("mainHdr");
            if(hdr) hdr.style.display = "";
            var main = document.getElementById("mainApp")||document.getElementById("appRoot")||document.getElementById("mainContent");
            if(main) main.style.display = "";
          }catch(e){}
          try{ if(typeof launchApp==="function") launchApp(); }catch(e){}
          return; // stay in app
        }
      }catch(e){}
    }
    try{
      if(typeof SESSION!=="undefined" && SESSION && SESSION.role){
        return; // in-memory session — do not force landing
      }
    }catch(e){}
  }catch(e){}

  // No session → show login (landing)
  try{
    var ls=document.getElementById("loadingScreen");
    if(ls){ls.style.cssText="display:none!important;opacity:0;pointer-events:none;visibility:hidden";ls.classList.remove("show");}
  }catch(e){}
  try{
    var login=document.getElementById("loginScreen");
    if(login){
      login.style.display="flex";
      login.style.visibility="visible";
      login.style.opacity="1";
      login.classList.add("show");
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
setTimeout(function(){
  try{
    var raw=null;
    try{raw=localStorage.getItem("mp_session");}catch(e){}
    if(raw){
      try{
        var p=JSON.parse(raw);
        if(p&&p.role){
          // Has session — ensure app visible, login hidden
          var login=document.getElementById("loginScreen");
          if(login){login.classList.remove("show");login.style.setProperty("display","none","important");}
          var hdr=document.getElementById("mainHdr");
          if(hdr&&(hdr.style.display==="none"||!hdr.offsetParent)){
            if(typeof loadSession==="function")loadSession();
            if(typeof launchApp==="function")launchApp();
          }
          return;
        }
      }catch(e){}
    }
    // No session and still no app chrome → show login once
    var hdr2=document.getElementById("mainHdr");
    var appVisible=hdr2&&hdr2.style.display!=="none"&&hdr2.offsetHeight>0;
    if(!appVisible) _forceLogin();
  }catch(e){}
},1e4);
