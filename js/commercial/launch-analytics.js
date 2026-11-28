/* Optional marketing events. No form or account values are collected. */
(() => {
  'use strict';
  const events=new Set(['landing_view','demo_click','trial_start','onboarding_complete','first_schedule','checkout_click']);
  const key='mp_launch_analytics_choice';
  let measurement='', loaded=false, pending=[];
  function consent() {
    try { return localStorage.getItem(key) || ''; } catch (_) { return ''; }
  }
  function setConsent(choice) {
    try { localStorage.setItem(key,choice); } catch (_) {}
    if (measurement) window['ga-disable-'+measurement]=choice!=='allow';
    if (choice==='allow') start();
    else pending=[];
  }
  function start() {
    if (!measurement || consent()!=='allow') return;
    window['ga-disable-'+measurement]=false;
    if (!loaded) {
      loaded=true;
      window.dataLayer=window.dataLayer || [];
      window.gtag=window.gtag || function(){window.dataLayer.push(arguments);};
      window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',
        ad_personalization:'denied',analytics_storage:'granted'});
      window.gtag('js',new Date());
      window.gtag('config',measurement,{send_page_view:false,allow_google_signals:false,
        allow_ad_personalization_signals:false,page_location:location.origin+location.pathname,page_referrer:""});
      const script=document.createElement('script');
      script.src='https://www.googletagmanager.com/gtag/js?id='+measurement;
      script.referrerPolicy='no-referrer';
      script.async=true;document.head.append(script);
    }
    const queue=pending;pending=[];
    for (const [name,details] of queue) track(name,details);
  }
  function configure(id) {
    if (!/^G-[A-Z0-9]{5,20}$/.test(id || '')) {
      if(measurement) window['ga-disable-'+measurement]=true;
      pending=[];measurement='';return;
    }
    if (measurement && measurement!==id) {window['ga-disable-'+measurement]=true;loaded=false;}
    measurement=id;start();
  }
  function track(name,options={}) {
    if (!events.has(name)) return false;
    const safe={};
    if (['short','long','setup'].includes(options.kind)) safe.kind=options.kind;
    if (['individual','team','plant','business'].includes(options.plan)) safe.plan=options.plan;
    if (['monthly','annual'].includes(options.period)) safe.period=options.period;
    if (consent()!=='allow') return false;
    if (!loaded || !measurement) {if (pending.length<10) pending.push([name,safe]);return false;}
    window.gtag('event',name,{...safe,send_to:measurement,
      page_location:location.origin+location.pathname,page_referrer:''});
    return true;
  }
  const once=(name,scope='session')=>{
    const marker='mp_launch_'+name+'_'+scope;
    try {
      if(localStorage.getItem(marker)) return false;
      if(consent()!=='allow') return false;
      track(name);localStorage.setItem(marker,'1');return true;
    } catch (_) { return false; }
  };
  window.MP_LAUNCH_ANALYTICS=Object.freeze({configure,track,once,consent,setConsent});
})();
