/* Shared catalogue contract for Admin, the public offer, and in-app checkout. */
(function (root) {
  'use strict';
  const tiers = Object.freeze([
    Object.freeze({id:'individual',name:'Individual',hi:'व्यक्तिगत',limit:1,monthly:99}),
    Object.freeze({id:'team',name:'Team',hi:'टीम',limit:30,monthly:799}),
    Object.freeze({id:'plant',name:'Plant',hi:'प्लांट',limit:60,monthly:1499}),
    Object.freeze({id:'business',name:'Business',hi:'बिज़नेस',limit:200,monthly:2999})
  ]);
  const trialDays = 15;
  const annualDiscountPct = 12;
  const annualPrice = (monthly, discount) => Math.round(monthly * 12 * (100 - discount) / 100);
  const periods = Object.freeze(['monthly','annual']);
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  function cleanPaymentLink(value) {
    try {
      const url=new URL(value);
      if (url.protocol!=='https:' || url.username || url.password || url.port ||
          !['rzp.io','rzp.link','razorpay.com','pages.razorpay.com'].includes(url.hostname) ||
          url.pathname==='/' || /^\/@/.test(url.pathname)) return '';
      return url.href;
    } catch (_) { return ''; }
  }
  function read(raw) {
    if (raw?.schema!==1 || !Array.isArray(raw.plans) || raw.plans.length!==tiers.length ||
        !integer(raw.annualDiscountPct,0,90)) return null;
    const prices=new Set(), links=new Set(), plans=[];
    for (const tier of tiers) {
      const incoming=raw.plans.find(row=>row?.id===tier.id);
      if (!integer(incoming?.monthly,1,1_000_000) || incoming.limit!==tier.limit ||
          incoming.annual!==annualPrice(incoming.monthly,raw.annualDiscountPct)) return null;
      const plan={...tier,monthly:incoming.monthly,annual:incoming.annual,
        discountPct:raw.annualDiscountPct, maxMembers:tier.limit,label:tier.name,links:{}};
      for (const period of periods) {
        if (prices.has(plan[period])) return null;
        prices.add(plan[period]);
        const link=cleanPaymentLink(incoming.links?.[period]);
        if (incoming.links?.[period] && (!link || links.has(link))) return null;
        if (link) { links.add(link);plan.links[period]=link; }
      }
      plans.push(plan);
    }
    const id=raw.analyticsId;
    return {schema:1,plans,annualDiscountPct:raw.annualDiscountPct,
      taxMode:['included','additional','none'].includes(raw.taxMode)?raw.taxMode:'',
      setupAssistance:raw.setupAssistance===true,
      analyticsId:/^G-[A-Z0-9]{5,20}$/.test(id || '')?id:''};
  }
  function seed() {
    return {schema:1,annualDiscountPct,setupAssistance:true,taxMode:'',analyticsId:'',
      plans:tiers.map(tier=>({id:tier.id,limit:tier.limit,monthly:tier.monthly,
        annual:annualPrice(tier.monthly,annualDiscountPct),links:{}}))};
  }
  const amount=(value,language='en')=>new Intl.NumberFormat(language==='hi'?'hi-IN':'en-IN').format(value);
  function planByAmount(catalog, value) {
    const price=Number(value);
    for (const plan of catalog?.plans || []) for (const period of periods) if (plan[period]===price) return {plan,period};
    return null;
  }
  function taxCopy(mode,hi=false) {
    return ({
      included:['लागू कर मूल्य में शामिल हैं।','Applicable taxes are included.'],
      additional:['लागू कर अलग से लगेंगे।','Applicable taxes are additional.'],
      none:['वर्तमान बिलिंग सेटिंग में कोई कर नहीं लगाया जाता।','No tax is charged under the current billing configuration.']
    }[mode] || ['भुगतान से पहले लागू कर की पुष्टि करें।','Confirm applicable taxes with sales before payment.'])[hi?0:1];
  }
  function httpsURL(value) {
    try { const url=new URL(value); return url.protocol==='https:' && !url.username && !url.password ? url.href : ''; }
    catch (_) { return ''; }
  }
  function contact(raw) {
    const email=String(raw?.supportEmail || '').trim();
    const phone=String(raw?.supportWhatsApp || '').trim().replace(/^[+]/,'').replace(/[ ()-]/g,'');
    const digits=/^[6-9]\d{9}$/.test(phone)?'91'+phone:phone;
    return {email:/^[\w.+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)?email:'',
      whatsapp:/^[1-9]\d{7,14}$/.test(digits)?digits:'', name:String(raw?.supportName || '').slice(0,120),
      refund: String(raw?.refundPolicy || '').slice(0,1500), refundHi:String(raw?.refundPolicyHi || '').slice(0,1500),
      days:integer(raw?.refundDays,1,365)?raw.refundDays:0};
  }
  function project(pay,license,care,videos) {
    const catalog=read(pay?.commercial);
    if (!catalog || !integer(license?.freeTrialDays,1,365)) throw Error('Save a valid catalogue and trial before publishing.');
    const {schema,plans,annualDiscountPct,taxMode,setupAssistance,analyticsId}=catalog;
    const published=contact({supportEmail:care?.email,supportWhatsApp:care?.whatsapp,supportName:care?.name,
      refundDays:care?.refundDays,refundPolicy:care?.refundPolicy,refundPolicyHi:care?.refundPolicyHi});
    const result={schema,annualDiscountPct,taxMode,setupAssistance,analyticsId,trialDays:license.freeTrialDays,
      paymentEnabled:pay.enabled!==false,plans:plans.map(({id,limit,monthly,annual})=>({id,limit,monthly,annual})),
      supportEmail:published.email,supportWhatsApp:published.whatsapp,supportName:published.name,
      refundDays:published.days,refundPolicy:published.refund,refundPolicyHi:published.refundHi};
    for(const word of ['Short','Long']) for(const locale of ['','Hi']) {
      const lower=word.toLowerCase();
      result['video'+word+'Url'+locale]=httpsURL(videos?.[lower+'Url'+locale]).slice(0,500);
      result['video'+word+'Title'+locale]=String(videos?.[lower+'Title'+locale] || '').slice(0,120);
    }
    return result;
  }
  const api=Object.freeze({tiers,periods,trialDays,annualPrice,cleanPaymentLink,read,seed,amount,planByAmount,taxCopy,httpsURL,contact,project});
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.MP_CATALOG=api;
})(globalThis);
