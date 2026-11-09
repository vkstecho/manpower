
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, ref, set, get, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
  import { getAuth, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
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
    // Optional App Check (enable in Firebase Console + set window.MP_APPCHECK_SITE_KEY before this script)
    try {
      if (typeof window !== 'undefined' && window.MP_APPCHECK_SITE_KEY) {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import(
          'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js'
        );
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(window.MP_APPCHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
        console.info('[fb] App Check enabled');
      }
    } catch (acErr) {
      console.warn('[fb] App Check skipped', acErr && acErr.message);
    }
    const db  = getDatabase(app);
    const auth = getAuth(app);
    // Keep Phone OTP session across reloads (until explicit logout)
    try{ setPersistence(auth, browserLocalPersistence).catch(e=>console.warn('[fb] setPersistence', e)); }catch(e){}
    // Resolve when first auth state is known (phone restore from IndexedDB)
    let _authReadyResolve;
    const _authReadyPromise = new Promise((res)=>{ _authReadyResolve = res; });
    let _authReadyDone = false;
    onAuthStateChanged(auth, (u)=>{
      if(!_authReadyDone){ _authReadyDone = true; try{ _authReadyResolve(u); }catch(e){} }
      try{
        if(u && u.phoneNumber){
          localStorage.setItem('mp_device_phone', u.phoneNumber);
          localStorage.setItem('mp_device_uid', u.uid||'');
          localStorage.setItem('mp_device_verified_at', String(Date.now()));
        }
      }catch(e){}
    });
    window._fbAuthStateReady = () => _authReadyPromise;
    const functions = getFunctions(app);
    // ── SECURITY: Keep Firebase refs in a closure, NOT on window ──
    const _fbStore = { db, ref, set, get, onValue, push, update, remove };
    window._fbAccess = async function(op, path, val){
      // Auto-reauthenticate if Firebase Auth expired (prevents rule denials)
      if(op !== 'get' && op !== 'onValue' && !auth.currentUser){
        // Wait for IndexedDB phone restore before creating anonymous (prevents OTP every open)
        let hadPhone = false;
        try{ hadPhone = !!(localStorage.getItem('mp_device_phone') || localStorage.getItem('mp_device_uid')); }catch(e){}
        if(hadPhone){
          try{
            if(window._fbAuthStateReady) await window._fbAuthStateReady();
            for(let i=0;i<12 && !auth.currentUser;i++) await new Promise(r=>setTimeout(r,120));
          }catch(e){}
        }
        if(!auth.currentUser && !hadPhone){
          try{ await signInAnonymously(auth); }catch(e){ console.warn('[fbAccess] re-auth failed:', e.message); }
        }
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
    window._fbSignInAnon = async () => {
      try{
        const u = auth.currentUser;
        if(u && u.phoneNumber){ console.log('[fb] skip anon — phone session active'); return u; }
        if(u && !u.isAnonymous && u.uid){ return u; }
      }catch(e){}
      return signInAnonymously(auth);
    };
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
    window._fbFunctions = functions;
    window._fbCall = async (name, data) => {
      const result = await httpsCallable(functions, name)(data || {});
      return result && result.data;
    };
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
