/* First-use guidance. The existing signup, import and join flows keep their own permissions. */
(() => {
  'use strict';
  const key='mp_first_setup';

  function readState() {
    try {return JSON.parse(localStorage.getItem(key) || '{}') || {};} catch (_) {return {};}
  }
  function saveState(value) {
    try {localStorage.setItem(key,JSON.stringify(value));} catch (_) {}
  }
  function current() {
    const uid=window._fbAuth?.currentUser?.uid;
    return uid && !window._fbAuth.currentUser.isAnonymous && SESSION.authUid===uid ? uid : '';
  }
  function update(name) {
    const uid=current();
    if (!uid) return;
    const state=readState();
    state[uid]={...state[uid],[name]:true};
    saveState(state);
  }
  function render() {
    const box=document.getElementById('mp-first-setup');
    if (!box) return;
    const uid=current();
    const state=readState()[uid] || {};
    if (!uid || !state.started || state.done || SESSION.role==='admin') {box.hidden=true;return;}
    const manager=SESSION.role==='manager';
    const pending=typeof isPendingMember==='function' && isPendingMember();
    const imported=manager && typeof getEmps==='function' && (getEmps() || []).some(row=>
      row?.managerUid===uid && row.id!==SESSION.empObjId && row._key!==SESSION.empObjId && row.status==='active');
    const title=L('पहला सेटअप','First-time setup');
    box.hidden=false;
    box.replaceChildren();
    const heading=document.createElement('strong');heading.textContent=title;box.append(heading);
    const list=document.createElement('ol');box.append(list);
    function action(label, work, completed=false) {
      const row=document.createElement('li');
      if (completed) row.textContent='✓ '+label;
      else if (work) {
        const button=document.createElement('button');
        button.type='button';button.textContent=label;button.onclick=work;row.append(button);
      } else row.textContent=label;
      list.append(row);
    }
    action(L('मोबाइल सत्यापित और खाता तैयार','Verify mobile and create your account'),null,true);
    if (manager) {
      action(L('Excel से टीम सूची जोड़ें','Import your roster from Excel'),async()=>{
        await window.__sectionsReady;
        if(typeof openBulkImportTeam==='function') openBulkImportTeam();
      },imported);
      action(L('पहला शेड्यूल बनाएँ और सहेजें','Generate and save the first schedule'),async()=>{
        await window.__sectionsReady;
        if(typeof openScheduleBuilder==='function') openScheduleBuilder();
      },state.schedule);
      action(L('सदस्यों को आमंत्रित करें','Invite your members'),()=>{
        openModal('<div class="modal-title">'+L('सदस्यों को आमंत्रित करें','Invite your members')+'</div><p>'+
          L('ManPower ऐप का लिंक और अपना पंजीकृत मैनेजर मोबाइल निजी रूप से साझा करें। सदस्यों से अपने OTP से लॉग इन करके टीम में जुड़ने का अनुरोध भेजने को कहें। टीम में आने वाले अनुरोध की जानकारी जाँचें और तभी मंज़ूर करें।',
            'Share the ManPower app link and your registered Manager mobile privately. Ask members to sign in with their own OTP and request to join. Review their details before approving the request in Team.')+
          '</p><button type="button" class="cancel-btn" onclick="closeModal()">'+L('बंद करें','Close')+'</button>');
      });
    } else {
      if (pending) action(L('मैनेजर की मंज़ूरी की प्रतीक्षा करें','Wait for your Manager to approve the request'));
      action(L('अपनी शिफ्ट देखें','Open My Shift'),()=>{window._goTabDirect('myshift');});
    }
    const footer=document.createElement('div');
    const dismiss=document.createElement('button');
    dismiss.type='button';dismiss.textContent=L('बाद में','Dismiss');
    dismiss.onclick=()=>{update('done');render();};
    footer.append(dismiss);
    if ((!manager && !pending) || (imported && state.schedule)) {
      const done=document.createElement('button');done.type='button';done.textContent=L('सेटअप पूरा','Finish setup');
      done.onclick=()=>{update('done');window.MP_LAUNCH_ANALYTICS?.track('onboarding_complete');render();};
      footer.append(done);
    }
    box.append(footer);
  }
  function start({trial=false}={}) {
    if (!current() || readState()[current()]?.started) return;
    update('started');
    if(trial) window.MP_LAUNCH_ANALYTICS?.track('trial_start');
    render();
  }
  function firstSchedule() {
    const uid=current();
    const value=readState()[uid];
    if (!uid || !value?.started || value.schedule) return;
    update('schedule');window.MP_LAUNCH_ANALYTICS?.track('first_schedule');render();
  }
  window.MP_LAUNCH_ONBOARDING=Object.freeze({start,render,firstSchedule});
  window.MP_PUBLIC_OFFER.load().then(offer=>{
    window.MP_LAUNCH_ANALYTICS?.configure(MP_CATALOG.read(offer)?.analyticsId);
  });
})();
