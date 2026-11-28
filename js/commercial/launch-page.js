(() => {
  'use strict';
  const catalogue = window.MP_CATALOG;
  const analytics = window.MP_LAUNCH_ANALYTICS;
  const descriptions = {
    shift:['ManPower shift schedule and machine coverage','ManPower शिफ्ट शेड्यूल और मशीन-वार स्टाफिंग'],
    team:['ManPower team roster and Excel import','ManPower टीम सूची और Excel इम्पोर्ट'],
    myshift:['ManPower personal shift calendar','ManPower व्यक्तिगत शिफ्ट कैलेंडर'],
    diary:['ManPower Work Diary','ManPower कार्य डायरी']
  };
  let lang = 'en', feature = 'shift', period = 'monthly', offer = {}, catalogueData;
  try { if (localStorage.getItem('mp_lang')==='hi') lang='hi'; } catch (_) {}
  const t = (en,hi) => lang==='hi' ? hi : en;
  const id = name => document.getElementById(name);
  const each = (selector, render) => document.querySelectorAll(selector).forEach(render);
  const element = (tag, text, className) => {
    const node=document.createElement(tag);
    if (text) node.textContent=text;
    if (className) node.className=className;
    return node;
  };
  each('[data-hi]', node => {node.dataset.en=node.textContent;});
  function trialLabel() {
    const days = catalogueData && Number.isSafeInteger(offer.trialDays) && offer.trialDays > 0 && offer.trialDays <= 365 ? offer.trialDays : 0;
    return days ? t('Start '+days+'-Day Free Trial',days+' दिन का मुफ़्त ट्रायल शुरू करें') : t('Start Free Trial','मुफ़्त ट्रायल शुरू करें');
  }
  function supportLink(contact) {
    const body=t('Please help me book a ManPower demo or set up my account.','कृपया ManPower डेमो बुक करने या खाता सेट करने में मदद करें।');
    return contact.whatsapp ? 'https://wa.me/'+contact.whatsapp+'?text='+encodeURIComponent(body)
      : 'mailto:'+(contact.email || 'CareMP@vkstech.com')+'?subject='+encodeURIComponent(t('ManPower demo or setup','ManPower डेमो या सेटअप'))+'&body='+encodeURIComponent(body);
  }
  function renderPlans(contact) {
    id('billing-toggle').hidden=!catalogueData;
    id('offer-status').textContent=catalogueData ? '' : t('Contact sales for current pricing and availability.','मौजूदा कीमतों और उपलब्धता के लिए बिक्री टीम से संपर्क करें।');
    each('#billing-toggle [data-period]', node=>node.setAttribute('aria-pressed',String(node.dataset.period===period)));
    id('tax').textContent=catalogueData ? catalogue.taxCopy(catalogueData.taxMode,lang==='hi') : '';
    id('setup-offer').hidden=catalogueData?.setupAssistance!==true;
    const rows=[];
    for (const plan of catalogueData?.plans || []) {
      const row=element('article','','plan');
      row.dataset.plan=plan.id;
      const name=t(plan.name,plan.hi);
      const link=element('a',t('Start trial','ट्रायल शुरू करें'),'button secondary');
      link.href='app.html?setup=1';link.setAttribute('aria-label',trialLabel()+' · '+name);
      row.append(element('h3',name),element('p',plan.limit===1?t('One individual','एक व्यक्ति'):t('Up to '+plan.limit+' members',plan.limit+' सदस्यों तक')),
        element('b','₹'+catalogue.amount(plan[period],lang)),element('p',period==='monthly'?t('per month','प्रति माह'):t('per year · '+catalogueData.annualDiscountPct+'% off','प्रति वर्ष · '+catalogueData.annualDiscountPct+'% छूट')),
        element('p',plan.limit===1?t('Personal scheduling and work tools','व्यक्तिगत शेड्यूल और काम के टूल'):t('Team roster, scheduling and coverage','टीम सूची, शेड्यूल और स्टाफिंग')),link);
      rows.push(row);
    }
    const custom=element('article','','plan');
    const link=element('a',t('Contact sales','बिक्री टीम से संपर्क करें'),'button secondary');
    link.href=supportLink(contact);
    custom.append(element('h3',t('Custom','कस्टम')),element('p',t('Larger teams or tailored rollout','बड़ी टीम या ज़रूरत के अनुसार सेटअप')),link);
    id('plans').replaceChildren(...rows,custom);
  }
  function renderVideos() {
    let count=0;
    for (const type of ['Short','Long']) {
      const prefix='video'+type;
      const local=lang==='hi'?'Hi':'';
      const available=catalogue.httpsURL(offer[prefix+'Url'+local]);
      const english=catalogue.httpsURL(offer[prefix+'Url']);
      const link=id(type.toLowerCase()+'-video');
      const title=offer[prefix+'Title'+(available?local:'')];
      link.hidden=!available&&!english;
      if(link.hidden){link.removeAttribute('href');continue;}
      count++;
      link.href=available||english;
      const label=typeof title==='string'&&title.trim()?title.trim():(type==='Short'?t('Short demo','छोटा डेमो'):t('Full walkthrough','पूरी वीडियो गाइड'));
      link.textContent=label+(!available&&lang==='hi'?' · English':'');
    }
    id('video-note').hidden=Boolean(count);
    id('video-note').textContent=t('Contact us to arrange a live demo.','लाइव डेमो के लिए हमसे संपर्क करें।');
  }
  function renderFeature() {
    each('[data-feature]',button=>button.setAttribute('aria-pressed',String(button.dataset.feature===feature)));
    const hero=document.querySelector('[data-shot]');
    const display=id('feature-img');
    for(const [img,key] of [[hero,'shift'],[display,feature]]) {
      const source='assets/launch/'+key+'-'+lang+'.webp';
      if(img.getAttribute('src')!==source) img.src=source;
      img.alt=t(...descriptions[key]);
    }
  }
  function render() {
    document.documentElement.lang=lang;
    document.title=t('ManPower | Shift planning for Indian factories','ManPower | भारतीय कारखानों के लिए शिफ्ट प्लानिंग');
    id('language').textContent=t('हिन्दी','English');
    id('language').setAttribute('aria-label',t('Switch to Hindi','अंग्रेज़ी चुनें'));
    each('[data-hi]', node=>{node.textContent=node.dataset[lang];});
    each('[data-trial]', node=>{node.textContent=trialLabel();});
    const contact=catalogue.contact(offer);
    each('[data-support]', node=>{node.href=supportLink(contact);});
    const email=contact.email || 'CareMP@vkstech.com';
    id('support-email').href='mailto:'+email;id('support-email').textContent=email;
    id('whatsapp').hidden=!contact.whatsapp;
    if (contact.whatsapp) id('whatsapp').href='https://wa.me/'+contact.whatsapp;
    const refund=t(contact.refund,contact.refundHi||contact.refund);
    id('refund').hidden=!refund;id('refund-policy').textContent=refund;
    id('analytics-choice').hidden=!catalogueData?.analyticsId;
    renderFeature();renderPlans(contact);renderVideos();
  }
  id('language').addEventListener('click',()=>{
    lang=t('hi','en');
    try { localStorage.setItem('mp_lang',lang); } catch (_) {}
    render();
  });
  each('[data-period]',button=>button.addEventListener('click',()=>{period=button.dataset.period;renderPlans(catalogue.contact(offer));}));
  each('[data-feature]',button=>button.addEventListener('click',()=>{feature=button.dataset.feature;renderFeature();}));
  each('[data-demo]',node=>node.addEventListener('click',()=>analytics.track('demo_click',{kind:node.dataset.demo})));
  each('[data-support]',node=>node.addEventListener('click',()=>analytics.track('demo_click',{kind:'setup'})));
  let visitTracked=false;
  function visit() { if(!visitTracked) visitTracked=analytics.track('landing_view'); }
  id('analytics-choice').addEventListener('click',()=>{
    const enabled=window.confirm(t('Allow optional usage measurement? Choose Cancel to turn it off.','क्या आप वैकल्पिक उपयोग विश्लेषिकी की अनुमति देते हैं? बंद करने के लिए Cancel चुनें।'));
    analytics.setConsent(enabled?'allow':'deny');visit();
  });
  render();
  window.MP_PUBLIC_OFFER.load().then(data=>{
    offer=data || {};
    catalogueData=catalogue.read(offer);
    analytics.configure(catalogueData?.analyticsId);
    render();visit();
  });
})();
