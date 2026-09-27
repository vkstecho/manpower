
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, ref, set, get, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
  import { getAuth, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";
  import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

  const firebaseConfig = {
    apiKey: "AIzaSyAG3xE_Bfj7VuA3hg5ClUAKUy7S6TNExGs",
    authDomain: "metpowervks.firebaseapp.com",
    databaseURL: "https://metpowervks-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "metpowervks",
    storageBucket: "metpowervks.firebasestorage.app",
    messagingSenderId: "953633730980",
    appId: "1:953633730980:web:3b5dfc28f0d8778cb3d131"
  };

  try{
    const app = initializeApp(firebaseConfig);
    const db  = getDatabase(app);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    // ── SECURITY: Keep Firebase refs in a closure, NOT on window ──
    const _fbStore = { db, ref, set, get, onValue, push, update, remove };
    window._fbAccess = async function(op, path, val){
      // Auto-reauthenticate if Firebase Auth expired (prevents rule denials)
      if(op !== 'get' && op !== 'onValue' && !auth.currentUser){
        try{ await signInAnonymously(auth); }catch(e){ console.warn('[fbAccess] re-auth failed:', e.message); }
      }
      
      const _sessionCheck = ()=>{
        try{ return !!(localStorage.getItem('mp_session') || sessionStorage.getItem('mp_session_bak') || auth.currentUser); }catch(e){ return false; }
      };
      // Block writes only if NO session exists at all (complete stranger)
      if(!_sessionCheck() && op !== 'get' && op !== 'onValue'){
        console.warn('[SECURITY] Unauthorized write blocked:', path);
        return Promise.reject(new Error('Not authenticated'));
      }
      const r = ref(db, path);
      switch(op){
        case 'get': return get(r);
        case 'set': return set(r, val);
        case 'push': return push(r, val);
        case 'update': return update(r, val);
        case 'remove': return remove(r);
        case 'onValue': return onValue(r, val);
        default: return Promise.reject(new Error('Invalid op'));
      }
    };
    // ── Firebase Auth exposed for login/logout ──
    window._fbAuth = auth;
    window._fbRecaptchaVerifierClass = RecaptchaVerifier;
    window._fbSignInWithPhoneNumber = signInWithPhoneNumber;
    window._fbSignInWithToken = (token) => signInWithCustomToken(auth, token);
    window._fbSignInAnon = () => signInAnonymously(auth);
    window._fbSignOut = () => signOut(auth);
    // ── Phone OTP Auth ──
    window._fbSendOTP = async function(phoneNumber){
      try{
        // Prefer app.js helper if loaded
        if(typeof window._fbSendPhoneOtp === 'function'){
          const confirmResult = await window._fbSendPhoneOtp(phoneNumber, 'recaptcha-container', '_fbRecaptcha');
          window._fbConfirmOTP = (code) => confirmResult.confirm(code);
          return { success: true };
        }
        try{ if(auth.currentUser) await signOut(auth); }catch(e){}
        if(window._fbRecaptcha){ try{ window._fbRecaptcha.clear(); }catch(e){} window._fbRecaptcha=null; }
        let host = document.getElementById('recaptcha-container');
        if(!host){ host=document.createElement('div'); host.id='recaptcha-container'; document.body.appendChild(host); }
        host.innerHTML='';
        window._fbRecaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: ()=>{},
          'expired-callback': ()=>{ window._fbRecaptcha = null; }
        });
        try{ if(window._fbRecaptcha.render) await window._fbRecaptcha.render(); }catch(e){}
        const confirmResult = await signInWithPhoneNumber(auth, phoneNumber, window._fbRecaptcha);
        window._fbConfirmOTP = (code) => confirmResult.confirm(code);
        return { success: true };
      }catch(e){
        try{ if(window._fbRecaptcha){ window._fbRecaptcha.clear(); } }catch(x){}
        window._fbRecaptcha = null;
        return { success: false, error: e.message, code: e.code };
      }
    };
    // ── Cloud Functions exposed for secure server calls ──
    window._fbCall = (name, data) => httpsCallable(functions, name)(data);
    window._fbReady = true;
    // ── Firebase Storage for selfie uploads ──
    const _storage = getStorage(app);
    window._fbUploadSelfie = async function(base64Data, path){
      try{
        const sr = storageRef(_storage, path);
        await uploadString(sr, base64Data, 'data_url');
        return await getDownloadURL(sr);
      }catch(e){
        console.warn('[Storage upload failed]', e.message);
        return null; // Never block login flow
      }
    };
  }catch(e){ console.error('Firebase init error:',e); }

  const fireEvent = ()=>{ try{ document.dispatchEvent(new Event('firebase-ready')); }catch(e){} };
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', fireEvent);
  } else {
    setTimeout(fireEvent, 50);
  }
