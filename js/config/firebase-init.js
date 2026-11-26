
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, connectDatabaseEmulator, ref, set, get, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
  import { getAuth, connectAuthEmulator, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

  const firebaseConfig = window.MP_FIREBASE_CONFIG;

  try{
    if (!firebaseConfig) throw new Error("Firebase configuration required");
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
    const functions = getFunctions(app);
    if (window.MP_FIREBASE_EMULATORS === true) {
      if (!['localhost', '127.0.0.1'].includes(location.hostname) || firebaseConfig.projectId !== 'demo-manpower-612') {
        throw new Error('Use demo-manpower-612 from localhost for Firebase emulators');
      }
      connectDatabaseEmulator(db, '127.0.0.1', 9000);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    }
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
      const parts = path.split('/').filter(Boolean);
      const requestCollections = ['loginRequests', 'regRequests', 'deviceChangeRequests', 'learnRequests', 'resignations', 'teamTransferRequests'];
      const scoped = ['employees', 'overrides', 'schedules', 'leaves', 'shiftCellMeta', 'shiftHistory', 'shiftChangeRequests', 'reports', 'leftEmployees', 'deviceApprovals', 'mobileUsers', 'todos', 'settings', ...requestCollections, 'checklistCompletions', 'trainingCompletions', 'shiftHandovers'];
      if (scoped.includes(parts[0]) && (op === 'get' || op === 'onValue')) {
        await _authReadyPromise;
        const read = async () => {
          const value = auth.currentUser && (!auth.currentUser.isAnonymous || parts[0] === 'settings' || requestCollections.includes(parts[0]))
            ? (await window._fbCall('readRosterData', {path: parts})).value : null;
          return {exists: () => value != null && (typeof value !== 'object' || Object.keys(value).length > 0), val: () => value};
        };
        if (op === 'get') return read();
        let stopped = false, timer, previous;
        const poll = async () => {
          try {
            const snap = await read();
            const serialized = JSON.stringify(snap.val());
            if (!stopped && serialized !== previous) { previous = serialized; val(snap); }
          } catch (error) {
            if (!stopped && previous !== 'null') { previous = 'null'; val({exists: () => false, val: () => null}); }
            console.warn('[roster polling]', error.code || error.message);
          } finally {
            if (!stopped) timer = setTimeout(poll, 15000);
          }
        };
        void poll();
        return () => { stopped = true; clearTimeout(timer); };
      }
      if (parts[0] === 'employees') {
        if (op === 'set' || op === 'update') {
          await window._fbCall('writeEmployee', {path: parts.slice(1), value: val, patch: op === 'update'});
          return;
        }
        throw new Error('Employee history must be retained. Update the employee status instead.');
      }
      if(path === 'overrides' && op === 'update'){
        await window._fbCall('saveShiftBatch',{updates:val}); return;
      }
      if (requestCollections.includes(parts[0]) && op === 'push') {
        val = {...val, createdByUid:auth.currentUser?.uid || null};
      }
      if (parts[0] === 'todos' && (op === 'push' || (op === 'set' && parts.length === 2))) {
        val = {...val, createdByUid:val?.createdByUid || auth.currentUser?.uid || null};
      }
      if (parts[0] === 'reports' && (op === 'push' || (op === 'set' && parts.length === 2))) {
        val = {...val, submittedByUid: auth.currentUser?.uid || null};
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
    window._fbUploadSelfie = async (image,path) => {
      try { return (await window._fbCall('putPrivateMedia',{image,path})).reference; }
      catch (error) { console.warn('[Private media]',error.code); return null; }
    };
  }catch(e){ console.error('Firebase init error:',e); }

  const fireEvent = ()=>{ try{ document.dispatchEvent(new Event('firebase-ready')); }catch(e){} };
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', fireEvent);
  } else {
    setTimeout(fireEvent, 50);
  }
