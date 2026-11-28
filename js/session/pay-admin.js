/* Admin-only commercial setup and manually verified activation. */
const _commercialText = value => escHtml(String(value ?? ''));

function _getPaymentAmountOptions(cfg) {
  const catalog=MP_CATALOG.read(cfg?.commercial);
  if (catalog) return catalog.plans.flatMap(plan=>[plan.monthly,plan.annual]).sort((a,b)=>a-b);
  const raw=cfg?.amountOptions || cfg?.amounts || [];
  return (Array.isArray(raw)?raw:String(raw).split(',')).map(Number).filter(value=>Number.isSafeInteger(value) && value>0);
}

async function openPaymentSettingsAdmin() {
  if (!isAdmin()) return;
  const data=await Promise.all([
    _loadPaymentSettings(true),fbGet('settings/appLicense'),fbGet('settings/customerCare'),
    fbGet('settings/landingVideos'),fbGet('mobileUsers'),fbGet('verifiedPaymentReceipts')
  ]).catch(()=>null);
  if (!data) {toast(L('भुगतान सेटिंग नहीं मिली। फिर से कोशिश करें।','Unable to load payment settings. Try again.'));return;}
  const [cfg,license,care,videos,profiles,receipts]=data;
  if (!isAdmin()) return;
  const published=MP_CATALOG.read(cfg?.commercial);
  const catalog=published || MP_CATALOG.read(MP_CATALOG.seed());
  const uid=SESSION.authUid;
  const eligible=new Map();
  for (const item of Object.values((profiles || {}))) {
    if (/^[A-Za-z0-9_-]{1,128}$/.test(item?.accountUid || '') && item.status==='approved' &&
        (item.role==='manager' || item.individual===true || (!item.managerUid && String(item.companyId || '').startsWith('individual-')))) eligible.set(item.accountUid,item);
  }
  const label=(hi,en)=>L(hi,en);
  const formField=(id,title,value,type='text',extra='')=>
    `<label class="field" for="${id}">${title}<input id="${id}" class="inp-field" type="${type}" value="${_commercialText(value)}" ${extra}></label>`;
  const cards=catalog.plans.map(plan=>`<fieldset class="mp-commercial-admin-plan">
    <legend>${_commercialText(label(plan.hi,plan.name))} · ${plan.limit}</legend>
    ${formField('catalog-'+plan.id+'-price',label('मासिक मूल्य (₹)','Monthly price (₹)'),plan.monthly,'number','min="1" max="1000000"')}
    ${MP_CATALOG.periods.map(period=>formField('catalog-'+plan.id+'-'+period,
      period==='monthly'?label('मासिक Razorpay लिंक','Monthly Razorpay link'):label('वार्षिक Razorpay लिंक','Annual Razorpay link'),
      plan.links[period],'url','placeholder="https://rzp.io/…"')).join('')}
  </fieldset>`).join('');
  const videoFields=[['short','Short demo','छोटा डेमो'],['long','Full walkthrough','पूरा वॉकथ्रू']].flatMap(([type,en,hi])=>
    ['','Hi'].map(suffix=>formField('catalog-video-'+type+suffix,label(hi,en)+(suffix?' · हिन्दी':' · English'),
      videos?.[type+'Url'+suffix],'url'))).join('');
  const options=(rows,selected)=>rows.map(([id,text])=>`<option value="${id}" ${selected===id?'selected':''}>${text}</option>`).join('');
  openModal(`<div class="modal-handle"></div><h2 class="modal-title">${label('मूल्य और भुगतान सत्यापन','Pricing and payment verification')}</h2>
    <section class="mp-commercial-admin">
      <p>${label('एक ही सूची लैंडिंग पेज और चेकआउट पर उपयोग होती है। हर लिंक की तय राशि Razorpay में जाँचें।',
        'The landing page and checkout use this catalogue. Verify the fixed amount of every link in Razorpay.')}</p>
      <div class="mp-commercial-admin-grid">${cards}</div>
      <div class="mp-commercial-admin-grid">
        ${formField('catalog-discount',label('वार्षिक छूट (%)','Annual discount (%)'),catalog.annualDiscountPct,'number','min="0" max="90"')}
        ${formField('catalog-trial',label('नए खातों के ट्रायल के दिन','Trial days for new accounts'),
          published && license?.freeTrialDays || MP_CATALOG.trialDays,'number','min="1" max="365"')}
        <label class="field">${label('कर व्यवस्था','Tax display')}
          <select id="catalog-tax" class="inp-field">${options([
            ['',label('अभी तय नहीं','Unconfirmed')],['included',label('कर शामिल','Taxes included')],
            ['additional',label('कर अलग','Taxes additional')],['none',label('कोई कर नहीं','No tax charged')]
          ],catalog.taxMode)}</select>
        </label>
        ${formField('catalog-analytics',label('वैकल्पिक GA4 आईडी','Optional GA4 measurement ID'),catalog.analyticsId)}
      </div>
      <label class="check-label"><input id="catalog-enabled" type="checkbox" ${cfg?.enabled!==false?'checked':''}> ${label('सब्सक्रिप्शन लागू करें','Enable subscription access checks')}</label>
      <label class="check-label"><input id="catalog-setup" type="checkbox" ${catalog.setupAssistance?'checked':''}> ${label('मुफ़्त सेटअप सहायता दिखाएँ','Show free setup assistance')}</label>
      <details><summary>${label('चार डेमो वीडियो लिंक','Four demo video links')}</summary>${videoFields}</details>
      <button type="button" class="cancel-btn" onclick="openCustomerCareAdmin()">${label('सहायता और रिफंड सेटिंग','Support and refund settings')}</button>
      <button type="button" id="catalog-publish" class="submit-btn">${label('सहेजें और प्रकाशित करें','Save and publish offer')}</button>
    </section>
    <section class="mp-commercial-admin">
      <h3>${label('सत्यापित भुगतान सक्रिय करें','Activate a verified payment')}</h3>
      <p>${label('पहले Razorpay में भुगतान जाँचें। फिर उसी संदर्भ को यहाँ दर्ज करें।','Verify the captured payment in Razorpay first, then enter that reference here.')}</p>
      <label class="field">${label('सत्यापित खाता','Verified account')}<select id="activate-uid" class="inp-field">
        <option value="">—</option>${[...eligible].map(([id,row])=>`<option value="${id}">${_commercialText(row.name || row.mobile || id)} · ${_commercialText(row.mobile || '')}</option>`).join('')}
      </select></label>
      <label class="field">${label('प्लान और अवधि','Plan and period')}<select id="activate-plan" class="inp-field">
        <option value="">—</option>${catalog.plans.flatMap(plan=>MP_CATALOG.periods.map(period=>`<option value="${plan.id}:${period}">${_commercialText(label(plan.hi,plan.name))} · ${period==='annual'?label('वार्षिक','Annual'):label('मासिक','Monthly')} · ₹${MP_CATALOG.amount(plan[period])}</option>`)).join('')}
      </select></label>
      ${formField('activate-paid-until',label('किस तारीख तक भुगतान','Paid-through date'),'','date')}
      ${formField('activate-reference',label('Razorpay भुगतान संदर्भ','Razorpay payment reference'),'','text','autocomplete="off" placeholder="pay_…"')}
      <label class="check-label"><input type="checkbox" id="activate-confirm"> ${label('मैंने राशि, खाता और भुगतान की पुष्टि की है','I verified the amount, account and captured payment')}</label>
      <button type="button" id="activate-submit" class="submit-btn" ${published?'':'disabled'}>${label('सत्यापन दर्ज कर सक्रिय करें','Record verification and activate')}</button>
      <p role="status" id="catalog-status"></p>
      <p>${label('मैन्युअल रूप से सत्यापित भुगतान','Manually verified payments')} · <strong id="verified-payment-count">${Object.keys(receipts || {}).length}</strong></p>
    </section>
    <button type="button" class="cancel-btn" onclick="closeModal()">${label('बंद करें','Close')}</button>`);
  const field=id=>document.getElementById(id);
  const val=id=>field(id)?.value.trim() || '';
  const status=field('catalog-status');
  const run=async (button,work)=>{
    if (button.disabled || SESSION.authUid!==uid || !isAdmin()) return;
    button.disabled=true;
    status.textContent='';
    try {await work();}
    catch(error){if(status.isConnected)status.textContent=error.message || label('सहेजना विफल।','Unable to save.');}
    finally{button.disabled=false;}
  };
  field('catalog-publish').onclick=event=>run(event.currentTarget,async()=>{
    const discount=Number(val('catalog-discount'));
    const days=Number(val('catalog-trial'));
    const next={schema:1,annualDiscountPct:discount,taxMode:val('catalog-tax'),
      setupAssistance:field('catalog-setup').checked,analyticsId:val('catalog-analytics'),
      plans:MP_CATALOG.tiers.map(tier=>{
        const monthly=Number(val('catalog-'+tier.id+'-price'));
        return {id:tier.id,limit:tier.limit,monthly,annual:MP_CATALOG.annualPrice(monthly,discount),
          links:Object.fromEntries(MP_CATALOG.periods.map(period=>[period,val('catalog-'+tier.id+'-'+period)]))};
      })};
    if (!MP_CATALOG.read(next) || next.analyticsId && !/^G-[A-Z0-9]{5,20}$/.test(next.analyticsId) ||
        !Number.isSafeInteger(days) || days<1 || days>365) {
      throw Error(label('कीमतें, ट्रायल और प्रत्येक अलग Razorpay लिंक जाँचें।','Check prices, trial days and each distinct fixed Razorpay link.'));
    }
    const updateVideos={...((await fbGet('settings/landingVideos')) || {})};
    for(const type of ['short','long']) for(const suffix of ['','Hi']) {
      const url=val('catalog-video-'+type+suffix);
      if(url && !MP_CATALOG.httpsURL(url)) throw Error(label('HTTPS वीडियो लिंक दर्ज करें।','Enter valid HTTPS video links.'));
      updateVideos[type+'Url'+suffix]=url;
    }
    const enabled=field('catalog-enabled').checked;
    const currentCare=await fbGet('settings/customerCare') || {};
    const offer=MP_CATALOG.project({commercial:next,enabled},{freeTrialDays:days},currentCare,updateVideos);
    if(uid!==SESSION.authUid || !isAdmin()) return;
    await window._fbPublishCommercial({commercial:next,enabled,trialDays:days,offer:{...offer,updatedAt:new Date().toISOString()},videos:updateVideos});
    window._paymentSettingsAt=0;
    _invalidateCommercialEntitlement();
    toast(label('ऑफ़र प्रकाशित हो गया।','Offer published.'));
    await openPaymentSettingsAdmin();
  });
  field('activate-submit').onclick=event=>run(event.currentTarget,async()=>{
    const userId=val('activate-uid'), chosen=eligible.get(userId);
    const [planId,planPeriod]=val('activate-plan').split(':');
    const reference=val('activate-reference'), date=val('activate-paid-until');
    const verified=field('activate-confirm').checked;
    const stored=await fbGet('settings/payment');
    const plan=MP_CATALOG.read(stored?.commercial)?.plans.find(row=>row.id===planId);
    const paidUntil=/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(date+'T23:59:59.999+05:30'):null;
    if (!verified || !chosen || !plan || !MP_CATALOG.periods.includes(planPeriod) ||
        (chosen.role==='manager')!==(planId!=='individual') || !/^pay_[A-Za-z0-9]{5,64}$/.test(reference) ||
        !paidUntil || !Number.isFinite(paidUntil.getTime()) || paidUntil.getTime()<=Date.now() ||
        new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) {
      throw Error(label('सत्यापित खाता, प्लान, सही भविष्य की तारीख और Razorpay संदर्भ जाँचें।',
        'Check the verified account, matching plan, future date and Razorpay payment ID.'));
    }
    const identity=await fbGet('identities/'+userId);
    const employeeId=identity?.employeeId;
    if (!employeeId || (planId==='individual' && identity.independent!==true) || ![chosen.empObjId,chosen.employeeId].includes(employeeId)) {
      throw Error(label('इस खाते की स्थायी पहचान की जाँच करें।','Review this account’s verified roster identity.'));
    }
    if(uid!==SESSION.authUid || !isAdmin()) return;
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(reference));
    const digest=Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
    const result=await window._fbActivateVerifiedPayment(digest,{accountUid:userId,employeeId,planId,planPeriod,
      paymentAmount:plan[planPeriod],seatLimit:plan.limit,paidUntil:paidUntil.toISOString(),
      verifiedAt:new Date().toISOString(),verifiedBy:uid});
    if (result.existing && result.receipt.accountUid!==userId) {
      throw Error(label('यह भुगतान संदर्भ पहले से किसी अन्य खाते में दर्ज है।','This payment reference was already recorded for a different account.'));
    }
    if (!result.existing) {
      const count=field('verified-payment-count');
      count.textContent=Number(count.textContent)+1;
    }
    field('activate-reference').value='';field('activate-confirm').checked=false;
    _invalidateCommercialEntitlement();
    status.textContent=result.existing ? label('यह भुगतान पहले दर्ज किया जा चुका है।','This payment is already recorded.') :
      label('सत्यापित भुगतान सक्रिय हो गया।','Verified payment activated.');
  });
}

async function publishPublicOfferSnapshot() {
  if (!isAdmin()) return null;
  const [payment,license,care,videos]=await Promise.all(
    ['settings/payment','settings/appLicense','settings/customerCare','settings/landingVideos'].map(fbGet));
  if(!MP_CATALOG.read(payment?.commercial)) return null;
  const offer={...MP_CATALOG.project(payment,license,care,videos),updatedAt:new Date().toISOString()};
  await fbSet('publicOffer',offer);
  return offer;
}

async function openAppLicenseAdmin() {
  if (!isAdmin()) return;
  const license=await fbGet('settings/appLicense') || {};
  openModal(`<div class="modal-handle"></div><div class="modal-title">${L('ऐप लाइसेंस','App license')}</div>
    <label class="field">${L('लाइसेंस समाप्ति','App license expiry')}<input type="date" id="lic_expiry" class="inp-field" value="${_commercialText(license.expiry || '2026-12-31')}"></label>
    <p>${L('नए खातों का ट्रायल मूल्य सेटिंग में बदलें।','Set trial length for new accounts in Pricing and payment verification.')}</p>
    <button type="button" class="submit-btn" data-enter-action onclick="saveAppLicenseAdmin()">${L('सहेजें','Save')}</button>
    <button type="button" class="cancel-btn" onclick="closeModal()">${L('रद्द करें','Cancel')}</button>`);
}
async function saveAppLicenseAdmin() {
  if (!isAdmin()) return;
  const value=document.getElementById('lic_expiry')?.value;
  if(!value) return;
  await fbUpdate('settings/appLicense',{expiry:value,updatedAt:new Date().toISOString()});
  closeModal();
}
