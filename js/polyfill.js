"undefined"==typeof Notification&&(window.Notification={permission:"denied",requestPermission:()=>Promise.resolve("denied")}),document.addEventListener("keydown",function(e){if("F12"===e.key||e.ctrlKey&&e.shiftKey&&["I","J","C"].includes(e.key)||e.ctrlKey&&"U"===e.key)return e.preventDefault(),!1});var _fbStarted=!1;
function _forceLogin(){
  try{
    var ls=document.getElementById("loadingScreen");
    if(ls){ls.style.cssText="display:none!important;opacity:0;pointer-events:none;visibility:hidden";ls.classList.remove("show");}
  }catch(e){}
  try{
    var main=document.getElementById("mainApp")||document.getElementById("appRoot");
    if(main){main.style.display="none";}
    var hdr=document.getElementById("mainHdr");
    if(hdr){hdr.style.display="none";}
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
setTimeout(function(){var ls=document.getElementById("loadingScreen");ls&&(ls.style.cssText="display:none!important;opacity:0;pointer-events:none;visibility:hidden")},800);
if(-1!==window.location.search.indexOf("logout=")){
  try{history.replaceState(null,"",window.location.pathname);}catch(e){}
  try{localStorage.removeItem("mp_session");}catch(e){}
  try{localStorage.removeItem("mp_int_ok");}catch(e){}
  try{localStorage.removeItem("fp_registered");}catch(e){}
  try{sessionStorage.clear();}catch(e){}
  document.cookie="mp_sess=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  // Immediate login UI — do NOT wait 10s
  _forceLogin();
  setTimeout(_forceLogin,300);
  setTimeout(_forceLogin,1200);
}
setTimeout(_forceLogin,1e4);
