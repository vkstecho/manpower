
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, connectDatabaseEmulator, ref, set, get, onValue, push, update, remove, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
  import { getAuth, connectAuthEmulator, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
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
    const functions = getFunctions(app,'us-central1');
    const regionalNames = new Set(['saveShiftBatch','readRosterData','writeEmployee',
      'getMyCommercialEntitlement','getMyRosterIdentity','getMyOwnedProfiles','getScheduleMonthMeta']);
    const regions = new Map([['us-central1',functions]]);
    const callableRegion = name => regionalNames.has(name) &&
      (window.MP_CALLABLE_REGIONS?.[name]==='asia-southeast1' ||
       (window.MP_CALLABLE_REGIONS?.[name]!=='us-central1' && window.MP_CALLABLE_REGIONS?.default==='asia-southeast1')) ? 'asia-southeast1' : 'us-central1';
    function functionsFor(region) {
      if (!regions.has(region)) {
        const client=getFunctions(app,region);
        if (window.MP_FIREBASE_EMULATORS === true) connectFunctionsEmulator(client,'127.0.0.1',5001);
        regions.set(region,client);
      }
      return regions.get(region);
    }
    if (window.MP_FIREBASE_EMULATORS === true) {
      if (!['localhost', '127.0.0.1'].includes(location.hostname) || firebaseConfig.projectId !== 'demo-manpower-612') {
        throw new Error('Use demo-manpower-612 from localhost for Firebase emulators');
      }
      connectDatabaseEmulator(db, '127.0.0.1', 9000);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    }
    // Firebase's default persistence restores IndexedDB before falling back to browser storage.
    const authReady = auth.authStateReady();
    window._fbAuthStateReady = () => authReady;
    const verifiedUser = () => {
      const user = auth.currentUser;
      return user && !user.isAnonymous && user.uid ? user : null;
    };
    onAuthStateChanged(auth, user => {
      if (user && !user.isAnonymous && user.phoneNumber) {
        try {
          localStorage.setItem('mp_device_phone', user.phoneNumber);
          localStorage.setItem('mp_device_uid', user.uid);
        } catch (error) {}
      }
      document.dispatchEvent(new CustomEvent('mp-firebase-auth', {detail:{uid:verifiedUser()?.uid || null}}));
    });

    const requestCollections = new Set(['loginRequests','regRequests','deviceChangeRequests','learnRequests','resignations','teamTransferRequests']);
    const scoped = new Set(['employees','overrides','schedules','leaves','shiftCellMeta','shiftHistory','shiftChangeRequests',
      'reports','leftEmployees','deviceApprovals','mobileUsers','todos','settings',...requestCollections,
      'checklistCompletions','trainingCompletions','shiftHandovers']);
    const snapshot = value => ({exists:() => value != null &&
      (typeof value !== 'object' || Object.keys(value).length > 0), val:() => value});
    const reads = new Map();
    const pollers = new Set();
    const seeds = new Map();
    let queued = [];
    let flushPending = false;
    let pollTimer;

    async function flushReads() {
      flushPending = false;
      const entries = queued;
      queued = [];
      for (let start = 0; start < entries.length; start += 16) {
        await readGroup(entries.slice(start,start+16));
      }
    }
    async function readGroup(group) {
        try {
          if (!group.every(entry => entry.uid === auth.currentUser?.uid)) throw new Error('Firebase account changed');
          const paths = group.map(entry => entry.path);
          const result = await window._fbCall('readRosterData', paths.length === 1 ? {path:paths[0]} : {paths});
          const values = paths.length === 1 ? [result?.value] : result?.values;
          if (!values || values.length !== paths.length || values.some(value => value === undefined)) {
            throw new Error('Incomplete roster response');
          }
          group.forEach((entry,index) => entry.resolve(snapshot(values[index])));
        } catch (error) {
          if (group.length > 1 && error.code === 'functions/resource-exhausted') {
            const middle = Math.ceil(group.length/2);
            await readGroup(group.slice(0,middle));
            await readGroup(group.slice(middle));
            return;
          }
          group.forEach(entry => entry.reject(error));
        }
    }
    function rosterRead(uid,path) {
      const key = JSON.stringify([uid,path]);
      const current = reads.get(key);
      if (current) return current;
      const promise = new Promise((resolve,reject) => queued.push({uid,path,resolve,reject}));
      reads.set(key,promise);
      const remove = () => reads.delete(key);
      promise.then(remove,remove);
      if (!flushPending) {
        flushPending = true;
        queueMicrotask(flushReads);
      }
      return promise;
    }
    async function poll(entry) {
      if (entry.running || document.hidden || auth.currentUser?.uid !== entry.uid) return;
      entry.running = true;
      const revision = entry.revision;
      try {
        const value = await rosterRead(entry.uid,entry.path);
        if (!pollers.has(entry) || auth.currentUser?.uid !== entry.uid || revision !== entry.revision) return;
        const expected = entry.confirmedOverrides;
        entry.confirmedOverrides = null;
        const actual = value.val() || {};
        const alreadyRendered = expected && Object.keys(expected).length === Object.keys(actual).length &&
          Object.keys(expected).every(key=>Object.hasOwn(actual,key) && actual[key] === expected[key]);
        const serialized = JSON.stringify(value.val());
        if (serialized !== entry.previous || (expected && !alreadyRendered)) {
          entry.previous = serialized;
          if (!alreadyRendered) entry.callback(value);
        }
      } catch (error) {
        // A failed poll must never replace an authorized roster with an empty dataset.
        console.warn('[roster polling]',error.code || error.message);
      } finally { entry.running = false; }
    }
    function refreshPollers(branches) {
      if (document.hidden) return;
      for (const entry of pollers) {
        if (!Array.isArray(branches) || branches.includes(entry.path[0])) void poll(entry);
      }
    }
    function watchRoster(uid,path,callback) {
      const key = JSON.stringify([uid,path]);
      const seed = seeds.get(key);
      seeds.delete(key);
      const entry = {uid,path,callback,previous:seed?.value,revision:0};
      pollers.add(entry);
      if (!seed || Date.now()-seed.at > 5000) void poll(entry);
      if (!pollTimer) pollTimer = setInterval(refreshPollers,15000);
      return () => {
        pollers.delete(entry);
        if (!pollers.size) {
          clearInterval(pollTimer);
          pollTimer = undefined;
        }
      };
    }
    window._fbRefreshRoster = refreshPollers;
    window._fbNoteConfirmedShiftOverrides = renderedOverrides => {
      const uid = verifiedUser()?.uid;
      for (const entry of pollers) {
        if (entry.uid !== uid || entry.path[0] !== 'overrides') continue;
        entry.revision++;
        if (entry.path.length === 1) entry.confirmedOverrides = {...renderedOverrides};
      }
    };
    window._fbSeedRosterListeners = data => {
      const uid = verifiedUser()?.uid;
      seeds.clear();
      if (uid) for (const [branch,value] of Object.entries(data)) {
        seeds.set(JSON.stringify([uid,[branch]]),{value:JSON.stringify(value),at:Date.now()});
      }
    };

    // ── SECURITY: Keep Firebase refs in a closure, NOT on window ──
    const _fbStore = { db, ref, set, get, onValue, push, update, remove, runTransaction };
    window._fbSaveOwnedDiary=async (branch,uid,key,expected,value)=>{
      await authReady;
      if (!['workDiary','workNotes'].includes(branch) || uid!==verifiedUser()?.uid ||
          !/^[A-Za-z0-9_-]{1,80}$/.test(key)) throw Error('Verified document owner required');
      const target=ref(db,branch+'/'+uid+'/'+key);
      let unsubscribe=()=>{};
      try {
        await new Promise((resolve,reject)=>{unsubscribe=onValue(target,resolve,reject);});
        const result=await runTransaction(target,current=>{
          if(uid!==verifiedUser()?.uid || (current?.updatedAt || '')!==expected) return;
          return value;
        },{applyLocally:false});
        return result.committed && uid===verifiedUser()?.uid;
      } finally {unsubscribe();}
    };

    // These two fixed writes are also checked by the existing Admin Rules.
    window._fbPublishCommercial = async ({commercial,enabled,trialDays,offer,videos})=>{
      await authReady;
      return update(ref(db),{
        'settings/payment/commercial':commercial,'settings/payment/enabled':enabled,
        'settings/appLicense/freeTrialDays':trialDays,'settings/landingVideos':videos,publicOffer:offer
      });
    };
    window._fbActivateVerifiedPayment = async (digest,receipt)=>{
      await authReady;
      if (!/^[a-f0-9]{64}$/.test(digest) || !/^[A-Za-z0-9_-]{1,128}$/.test(receipt?.accountUid || '') ||
          receipt.verifiedBy!==verifiedUser()?.uid) throw Error('Invalid payment verification');
      const path=ref(db,'verifiedPaymentReceipts/'+digest);
      const prior=(await get(path)).val();
      if (prior) return {existing:true,receipt:prior};
      const {verifiedBy,...entitlement}=receipt;
      try {
        await update(ref(db),{
          ['paymentStatus/'+receipt.accountUid]:{...entitlement,commercialVersion:1,lastVerification:digest,
            maxMembers:receipt.seatLimit,planMaxMembers:receipt.seatLimit},
          ['verifiedPaymentReceipts/'+digest]:receipt
        });
      } catch (error) {
        // The write can already have committed when a response is lost.
        const stored=(await get(path)).val();
        if (stored) return {existing:true,receipt:stored};
        throw error;
      }
      return {existing:false,receipt};
    };

    window._fbAccess = async function(op, path, val){
      await authReady;
      const parts = path.split('/').filter(Boolean);
      const user = verifiedUser();
      if (scoped.has(parts[0]) && (op === 'get' || op === 'onValue')) {
        const uid = user?.uid;
        if (!uid) {
          if (op === 'get') return snapshot(null);
          return () => {};
        }
        return op === 'get' ? rosterRead(uid,parts) : watchRoster(uid,parts,val);
      }
      if (!user && op !== 'get' && op !== 'onValue' &&
          !(auth.currentUser?.isAnonymous && requestCollections.has(parts[0]))) {
        throw new Error('Verified account required');
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
      if (requestCollections.has(parts[0]) && op === 'push') {
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
      await authReady;
      if (auth.currentUser) return auth.currentUser;
      // Only an explicit legacy public registration flow can request anonymous auth.
      if (localStorage.getItem('mp_device_uid') || localStorage.getItem('mp_session')) return null;
      return signInAnonymously(auth);
    };
    window._fbSignOut = () => signOut(auth);
    // ── Phone OTP Auth ──
    window._fbSendOTP = async function(phoneNumber){
      try{
        await authReady;
        // Prefer app.js helper if loaded
        if(typeof window._fbSendPhoneOtp === 'function'){
          const confirmResult = await window._fbSendPhoneOtp(phoneNumber, 'recaptcha-container', '_fbRecaptcha');
          window._fbConfirmOTP = (code) => confirmResult.confirm(code);
          return { success: true };
        }
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
    const callables = new Map();
    window._fbCall = async (name,data) => {
      await authReady;
      const uid = auth.currentUser?.uid;
      const region = callableRegion(name);
      const key = region+'/'+name;
      if (!callables.has(key)) callables.set(key,httpsCallable(functionsFor(region),name,
        ['writeEmployee','saveShiftBatch'].includes(name) ? {timeout:25000} : undefined));
      try {
        const result = await callables.get(key)(data || {});
        if (uid !== auth.currentUser?.uid) throw new Error('Firebase account changed');
        return result.data;
      } catch (error) {
        if (uid && uid === auth.currentUser?.uid && error.code === 'functions/permission-denied' &&
            /session is locked or expired/i.test(error.message || '')) {
          document.dispatchEvent(new CustomEvent('mp-firebase-revoked',{detail:{uid}}));
        }
        throw error;
      }
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
