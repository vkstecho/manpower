/**
 * Man Power landing — EN / HI (shared localStorage mp_lang)
 * Videos: when HI selected, uses publicOffer video*Hi URLs (fallback to EN).
 */
(function () {
  'use strict';
  var KEY = 'mp_lang';

  var STR = {
    en: {
      navVideos: 'Videos', navFeatures: 'Features', navHow: 'How it works', navWhy: 'Why Man Power',
      navPricing: 'Pricing', navContact: 'Contact', navFaq: 'FAQ',
      login: 'Login', startFree: 'Start free',
      badge: 'Plant-floor shift & manpower · by VKS Tech',
      heroTitleHtml: 'Shift coverage that works on the <span>shop floor</span> — not another full HRMS.',
      heroSub: 'Upload your Excel. Auto-generate shifts. Check department, machine, and role coverage before the day starts. Built for factories, converting plants, and multi-section teams.',
      startTrial: 'Start free trial', seeHow: 'See how it works',
      metaExcel: 'Excel → roster', metaExcelSub: 'in minutes', metaCov: 'Coverage checks', metaCovSub: 'built-in',
      metaOff: 'Offline-ready', metaOffSub: 'PWA',
      department: 'Department', mon: 'Mon', tue: 'Tue', wed: 'Wed', coverage: 'Coverage', short: 'Short',
      videosWatch: 'WATCH',
      videosTitle: 'See Auto Schedule in action — then full setup',
      videosLead: 'Short clip: one-click magic. Longer video: setup + free 15-day trial offer (Hinglish / English).',
      videoShortTag: 'Short video · 45–90 sec',
      videoShortH3: 'Magical Auto Schedule — one click',
      videoShortP: 'Show Excel team → Auto Schedule → coverage OK in seconds. Best for ads, WhatsApp, and hero social proof.',
      videoShortPhStrong: 'Short · Auto Schedule',
      videoShortPhSpan: 'One click → full shift roster with coverage. ~45–90 sec',
      videoLongTag: 'Long video · 4–8 min',
      videoLongH3: 'How to set up + free 15-day trial',
      videoLongP: 'Hook: “I am ready to manage your shift schedule free for 15 days — mera kaam achha lage to continue rakhna.” Then full setup steps and details.',
      videoLongPhStrong: 'Long · Setup + free 15 days',
      videoLongPhSpan: 'Hook → setup walkthrough → trial offer. ~4–8 min',
      langTipStrong: 'Language tip:',
      langTip: 'Best for Indian plant buyers = Hinglish (spoken Hindi + English product words like Excel, Auto Schedule, coverage). Optional: pure Hindi version for supervisors + English captions, or pure English for corporate buyers.',
      featuresTitle: 'Features',
      featuresSub: 'Everything you need to plan manpower — without buying a full HR stack.',
      featuresLead: 'Competitors sell hire-to-retire HRMS. Man Power focuses on the job your supervisors actually do every week: build a roster that covers the plant.',
      feat1h: 'Excel-driven team setup',
      feat1p: 'Department, machines, designation, responsibility, and weekly offs come from the manager’s Excel — not a long HR configuration project.',
      feat2h: 'Auto Schedule',
      feat2p: 'Generate D/N/O rotations in one pass. Stagger phases so the whole section doesn’t land on the same code on day one.',
      feat3h: 'Coverage validation',
      feat3p: 'After auto-generate, Man Power counts people per shift inside Department, Machine, Designation, and Responsibility groups — and flags gaps.',
      feat4h: 'Mobile PWA + offline',
      feat4p: 'Works on the phone on the floor. Offline queue keeps schedule edits moving when the network drops.',
      feat5h: 'Manager & member flows',
      feat5p: 'OTP login, member pending → approve with emp code / section / machine, then they appear on the schedule immediately.',
      feat6h: 'Leave, OD & reports',
      feat6p: 'Mark OD on the grid and keep OD records in sync. Reports and photos for important shop-floor information.',
      fromSheet: 'From spreadsheet to live roster',
      excelRecordTitle: 'Your Excel is the system of record — we don’t force a new language.',
      excelB1: 'Import team with section, machine, responsibility, designation, weekly off',
      excelB2: 'Approve a member once — they land on Create Schedule without a second “add employee” step',
      excelB3: 'Multi-select filters: Department, Machine, Designation, Responsibility',
      excelB4: 'Hindi + English for supervisors and members',
      flowTitle: 'Typical plant flow',
      flow1: '1. Manager uploads / updates Excel roster',
      flow2: '2. Members join with mobile OTP (pending until approve)',
      flow3: '3. Run Auto Schedule for the week/month',
      flow4: '4. Fix coverage warnings → Save',
      flow5: '5. Team sees My Shift on phone',
      coverageLabel: 'Coverage that HRMS calendars skip',
      coverageTitle: 'Not just “who is on D or N” — is the machine covered?',
      covB1: 'Example: 3 people in one section + 3 active shifts → every working day needs coverage on each shift',
      covB2: 'Same rule machine-wise, responsibility-wise, designation-wise',
      covB3: 'Modal shows which groups/days are short',
      covB4: 'Suggest weekly-off changes, apply, and re-generate',
      whyCareTitle: 'Why plants care',
      whyCareBody: 'Full HRMS tools optimise payroll and attendance. Man Power optimises whether the line can run with the people you actually rostered.',
      coverageOk: 'Coverage OK', gapFlagged: 'Gap flagged',
      howTitle: 'How it works',
      howH2: 'Live in three steps — not a six-month HRMS project.',
      step1h: 'Setup team from Excel',
      step1p: 'Manager uploads the plant roster. Departments and machines stay the way your plant already talks about them.',
      step2h: 'Auto Schedule + coverage',
      step2p: 'Generate shifts, review short groups, adjust weekly offs, and save a roster the floor can trust.',
      step3h: 'Run the week on mobile',
      step3p: 'Members see My Shift. Managers tweak cells, mark OD/leave, and keep working even offline.',
      whyTitle: 'Why Man Power',
      whyH2: 'Specialist rostering vs full HRMS',
      whyLead: 'Use this when buyers compare you with Keka, greytHR, HROne, or SalaryBox.',
      outcomesTitle: 'Outcomes',
      outcomesH2: 'What plant teams want from a roster tool',
      pricingTitle: 'Pricing',
      pricingH2: 'Simple plans for plant teams',
      pricingLead: 'Published prices and trial days come from Admin in the Man Power app. Custom plans with special features are available on request.',
      planStarts: 'PLAN STARTS FROM',
      customPlanTitle: 'Custom plan / special features',
      customPlanBody: 'Need a different amount, multi-plant setup, or features not in standard plans? We can set a custom plan and Razorpay link for your team.',
      talkCustom: 'Talk to us for custom pricing',
      contactTitle: 'Contact',
      contactSub: 'Customer care & sales',
      contactLead: 'WhatsApp, call, or email for demos, custom plans, cancel / refund, and support.',
      faqTitle: 'FAQ',
      faqSub: 'Questions buyers ask',
      ctaTitle: 'Stop rebuilding the roster in Excel every week.',
      ctaSub: 'Start with your existing team sheet. Auto Schedule with coverage. Run the week on mobile.',
      ctaStart: 'Start free on Man Power',
      aboutVks: 'About VKS Tech',
      ctaMeta: 'Mobile OTP login · Hindi & English · Built by VKS Tech',
      openApp: 'Open app',
      footerProduct: 'Product', footerCompany: 'Company', footerContact: 'Contact',
      footerBlurb: 'Plant shift & manpower scheduling for Indian factories and multi-section teams.',
      footerMade: 'Made for plant operations in India',
      contactSection: 'Contact section',
      cmpNeed: 'Need',
      cmpMp: 'Man Power',
      cmpHrms: 'Typical HRMS (Keka / greytHR / HROne)',
      cmpR1a: 'Plant Excel → live roster',
      cmpR1b: 'Core workflow',
      cmpR1c: 'Possible, but heavier setup',
      cmpR2a: 'Auto Schedule + multi-dimension coverage',
      cmpR2b: 'Built for section / machine / role gaps',
      cmpR2c: 'Shift calendars; coverage depth varies',
      cmpR3a: 'Shop-floor codes (D/N/O, OD)',
      cmpR3b: 'First-class',
      cmpR3c: 'Generic attendance-centric',
      cmpR4a: 'Offline schedule edits',
      cmpR4b: 'PWA + offline queue',
      cmpR4c: 'Mostly online mobile apps',
      cmpR5a: 'Payroll, PF/ESI, full HR',
      cmpR5b: 'Not the product (by design)',
      cmpR5c: 'Core strength',
      cmpR6a: 'Time to value for rostering only',
      cmpR6b: 'Days, not a full HR rollout',
      cmpR6c: 'Often weeks with modules you may not need',
      quote1: '“We stopped rebuilding the same Excel every week. Coverage gaps show up before the shift starts — not after a machine sits idle.”',
      quote1who: 'Plant / shift lead',
      quote1role: 'Multi-section converting line',
      quote2: '“Members join on mobile, we approve with section and machine, and they’re on the schedule the same day. No second data entry.”',
      quote2who: 'Operations manager',
      quote2role: 'Flexible packaging unit',
      quote3: '“We didn’t need another full HRMS. We needed the roster to be honest about section and machine coverage.”',
      quote3who: 'Factory admin',
      quote3role: 'Multi-machine plant',
      quoteNote: 'Sample outcome copy — replace with real customer quotes when available.',
      planStarts: 'Plan starts from',
      priceNote: 'Choose a published headcount band, or ask for a custom plan (extra sections, multi-plant, special features).',
      trialNote: 'Free trial · days set by admin',
      refundNote: 'Cancel & refund window via Customer Care (days set by admin).',
      faq1q: 'Is Man Power an HRMS like Keka or HROne?',
      faq1a: 'No. Man Power is a plant manpower and shift system: Excel team setup, Auto Schedule, coverage checks, leave/OD, and mobile roster views. It is not a full hire-to-retire HR + payroll suite.',
      faq2q: 'Who is it for?',
      faq2a: 'Plant managers, shift supervisors, and ops teams in factories, flexible packaging, printing, converting, and any multi-section / multi-machine environment that still runs on Excel rosters.',
      faq3q: 'Does it work offline?',
      faq3a: 'Yes. Man Power is a PWA with an offline queue so schedule work can continue on weak plant networks and sync when connectivity returns.',
      faq4q: 'How is coverage different from a normal shift calendar?',
      faq4a: 'After Auto Schedule, the app counts people per shift inside Department, Machine, Designation, and Responsibility groups. Short days are listed so you can change weekly offs and regenerate — instead of discovering gaps on the floor.',
      faq5q: 'Can we still use greytHR / Keka for payroll?',
      faq5a: 'Yes. Man Power focuses on rostering and coverage. Keep your existing payroll / attendance HRMS if you already use one — they solve different jobs.',
      footerMentor: 'Mentor',
      footerResume: 'Resume tools',
      waCall: 'WhatsApp / Call',
      emailLabel: 'Email',
      websiteLabel: 'VKS Tech'
    },
    hi: {
      navVideos: 'वीडियो', navFeatures: 'विशेषताएँ', navHow: 'कैसे काम करता है', navWhy: 'Man Power क्यों',
      navPricing: 'मूल्य', navContact: 'संपर्क', navFaq: 'सवाल-जवाब',
      login: 'लॉगिन', startFree: 'मुफ्त शुरू करें',
      badge: 'प्लांट-फ्लोर शिफ्ट और मैनपावर · VKS Tech',
      heroTitleHtml: 'शिफ्ट कवरेज जो <span>शॉप फ्लोर</span> पर काम करे — पूरा HRMS नहीं।',
      heroSub: 'अपना Excel अपलोड करें। शिफ्ट अपने-आप बनाएँ। दिन शुरू होने से पहले विभाग, मशीन और भूमिका की कवरेज जाँचें। फैक्टरी, कन्वर्टिंग प्लांट और मल्टी-सेक्शन टीमों के लिए।',
      startTrial: 'मुफ्त ट्रायल शुरू करें', seeHow: 'देखें कैसे काम करता है',
      metaExcel: 'Excel → रोस्टर', metaExcelSub: 'मिनटों में', metaCov: 'कवरेज जाँच', metaCovSub: 'पहले से',
      metaOff: 'ऑफ़लाइन-रेडी', metaOffSub: 'PWA',
      department: 'विभाग', mon: 'सोम', tue: 'मंगल', wed: 'बुध', coverage: 'कवरेज', short: 'कम',
      videosWatch: 'देखें',
      videosTitle: 'Auto Schedule को एक्शन में देखें — फिर पूरा सेटअप',
      videosLead: 'छोटा क्लिप: एक-क्लिक जादू। लंबा वीडियो: सेटअप + मुफ्त 15-दिन ट्रायल ऑफ़र (Hinglish / हिंदी)।',
      videoShortTag: 'छोटा वीडियो · 45–90 सेकंड',
      videoShortH3: 'जादुई Auto Schedule — एक क्लिक',
      videoShortP: 'Excel टीम → Auto Schedule → सेकंडों में कवरेज OK। विज्ञापन, WhatsApp और प्रूफ के लिए बेस्ट।',
      videoShortPhStrong: 'छोटा · Auto Schedule',
      videoShortPhSpan: 'एक क्लिक → पूरा शिफ्ट रोस्टर कवरेज के साथ। ~45–90 सेकंड',
      videoLongTag: 'लंबा वीडियो · 4–8 मिनट',
      videoLongH3: 'सेटअप कैसे करें + मुफ्त 15-दिन ट्रायल',
      videoLongP: 'हुक: “मैं 15 दिन मुफ्त शिफ्ट शेड्यूल मैनेज कर दूँगा — मेरा काम अच्छा लगे तो जारी रखना।” फिर पूरा सेटअप।',
      videoLongPhStrong: 'लंबा · सेटअप + मुफ्त 15 दिन',
      videoLongPhSpan: 'हुक → सेटअप वॉकथ्रू → ट्रायल ऑफ़र। ~4–8 मिनट',
      langTipStrong: 'भाषा टिप:',
      langTip: 'भारतीय प्लांट खरीदारों के लिए Hinglish अच्छा रहता है (बोलचाल की हिंदी + Excel, Auto Schedule, coverage जैसे अंग्रेज़ी शब्द)। सुपरवाइज़र के लिए शुद्ध हिंदी + अंग्रेज़ी कैप्शन, या कॉर्पोरेट के लिए अंग्रेज़ी।',
      featuresTitle: 'विशेषताएँ',
      featuresSub: 'मैनपावर प्लानिंग के लिए ज़रूरी सब कुछ — पूरा HR सॉफ्टवेयर खरीदे बिना।',
      featuresLead: 'प्रतिस्पर्धी hire-to-retire HRMS बेचते हैं। Man Power उस काम पर फोकस करता है जो सुपरवाइज़र हर हफ़्ते करते हैं: ऐसा रोस्टर जो प्लांट को कवर करे।',
      feat1h: 'Excel से टीम सेटअप',
      feat1p: 'विभाग, मशीन, पदनाम, ज़िम्मेदारी और साप्ताहिक छुट्टी मैनेजर के Excel से आती है — लंबा HR कॉन्फ़िगरेशन प्रोजेक्ट नहीं।',
      feat2h: 'Auto Schedule',
      feat2p: 'एक पास में D/N/O रोटेशन बनाएँ। फेज स्टैगर करें ताकि पूरी सेक्शन एक ही दिन एक ही कोड पर न आ जाए।',
      feat3h: 'कवरेज जाँच',
      feat3p: 'ऑटो-जनरेट के बाद विभाग, मशीन, पदनाम और ज़िम्मेदारी समूहों में प्रति शिफ्ट लोगों की गिनती — और कमी फ्लैग।',
      feat4h: 'मोबाइल PWA + ऑफ़लाइन',
      feat4p: 'फ्लोर पर फ़ोन पर चलता है। नेटवर्क गिरने पर भी ऑफ़लाइन कतार शिफ्ट एडिट बचाती है।',
      feat5h: 'मैनेजर और मेंबर फ्लो',
      feat5p: 'OTP लॉगिन, मेंबर पेंडिंग → emp कोड / सेक्शन / मशीन से अप्रूव, फिर तुरंत शेड्यूल पर।',
      feat6h: 'लीव, OD और रिपोर्ट',
      feat6p: 'ग्रिड पर OD मार्क करें और रिकॉर्ड सिंक रखें। महत्वपूर्ण शॉप-फ्लोर जानकारी के लिए रिपोर्ट और फोटो।',
      fromSheet: 'स्प्रेडशीट से लाइव रोस्टर तक',
      excelRecordTitle: 'आपका Excel ही सिस्टम ऑफ़ रिकॉर्ड है — नई भाषा थोपी नहीं जाती।',
      excelB1: 'सेक्शन, मशीन, ज़िम्मेदारी, पदनाम, साप्ताहिक छुट्टी के साथ टीम इम्पोर्ट',
      excelB2: 'मेंबर एक बार अप्रूव — बिना दूसरी “एड एम्प्लॉयी” स्टेप के Create Schedule पर',
      excelB3: 'मल्टी-सेलेक्ट फ़िल्टर: विभाग, मशीन, पदनाम, ज़िम्मेदारी',
      excelB4: 'सुपरवाइज़र और मेंबर के लिए हिंदी + अंग्रेज़ी',
      flowTitle: 'सामान्य प्लांट फ्लो',
      flow1: '1. मैनेजर Excel रोस्टर अपलोड / अपडेट करता है',
      flow2: '2. मेंबर मोबाइल OTP से जॉइन (अप्रूव तक पेंडिंग)',
      flow3: '3. हफ़्ते/महीने के लिए Auto Schedule चलाएँ',
      flow4: '4. कवरेज वार्निंग ठीक करें → Save',
      flow5: '5. टीम फ़ोन पर My Shift देखती है',
      coverageLabel: 'कवरेज जो HRMS कैलेंडर छोड़ देते हैं',
      coverageTitle: 'सिर्फ़ “कौन D या N पर है” नहीं — मशीन कवर है?',
      covB1: 'उदाहरण: एक सेक्शन में 3 लोग + 3 सक्रिय शिफ्ट → हर काम के दिन हर शिफ्ट पर कवरेज',
      covB2: 'वही नियम मशीन, ज़िम्मेदारी, पदनाम के हिसाब से',
      covB3: 'मॉडल दिखाता है कौन से समूह/दिन कम हैं',
      covB4: 'साप्ताहिक छुट्टी सुझाव, लागू करें, फिर से जनरेट',
      whyCareTitle: 'प्लांट क्यों ध्यान देते हैं',
      whyCareBody: 'पूरा HRMS पेरोल और अटेंडेंस ऑप्टिमाइज़ करता है। Man Power देखता है कि आपके रोस्टर किए लोगों से लाइन चल सकती है या नहीं।',
      coverageOk: 'कवरेज OK', gapFlagged: 'गैप फ्लैग',
      howTitle: 'कैसे काम करता है',
      howH2: 'तीन स्टेप में लाइव — छह महीने का HRMS प्रोजेक्ट नहीं।',
      step1h: 'Excel से टीम सेटअप',
      step1p: 'मैनेजर प्लांट रोस्टर अपलोड करता है। विभाग और मशीन वैसे ही रहते हैं जैसे प्लांट में बोले जाते हैं।',
      step2h: 'Auto Schedule + कवरेज',
      step2p: 'शिफ्ट बनाएँ, कम समूह देखें, साप्ताहिक छुट्टी एडजस्ट करें, और फ्लोर पर भरोसेमंद रोस्टर सेव करें।',
      step3h: 'हफ़्ता मोबाइल पर चलाएँ',
      step3p: 'मेंबर My Shift देखते हैं। मैनेजर सेल बदलते हैं, OD/लीव मार्क करते हैं — ऑफ़लाइन भी।',
      whyTitle: 'Man Power क्यों',
      whyH2: 'विशेषज्ञ रोस्टरिंग बनाम पूरा HRMS',
      whyLead: 'जब खरीदार Keka, greytHR, HROne या SalaryBox से तुलना करें तो यह दिखाएँ।',
      outcomesTitle: 'परिणाम',
      outcomesH2: 'रोस्टर टूल से प्लांट टीमें क्या चाहती हैं',
      pricingTitle: 'मूल्य',
      pricingH2: 'प्लांट टीमों के लिए सरल प्लान',
      pricingLead: 'प्रकाशित कीमत और ट्रायल दिन Man Power ऐप में Admin से आते हैं। विशेष सुविधाओं वाले कस्टम प्लान अनुरोध पर।',
      planStarts: 'प्लान शुरू होता है',
      customPlanTitle: 'कस्टम प्लान / विशेष सुविधाएँ',
      customPlanBody: 'अलग राशि, मल्टी-प्लांट, या स्टैंडर्ड में नहीं सुविधाएँ? हम कस्टम प्लान और Razorpay लिंक सेट कर सकते हैं।',
      talkCustom: 'कस्टम मूल्य के लिए बात करें',
      contactTitle: 'संपर्क',
      contactSub: 'कस्टमर केयर और सेल्स',
      contactLead: 'डेमो, कस्टम प्लान, कैंसल / रिफंड और सपोर्ट के लिए WhatsApp, कॉल या ईमेल।',
      faqTitle: 'सवाल-जवाब',
      faqSub: 'खरीदार अक्सर ये पूछते हैं',
      ctaTitle: 'हर हफ़्ते Excel में रोस्टर दोबारा बनाना बंद करें।',
      ctaSub: 'मौजूदा टीम शीट से शुरू करें। कवरेज के साथ Auto Schedule। हफ़्ता मोबाइल पर चलाएँ।',
      ctaStart: 'Man Power पर मुफ्त शुरू करें',
      aboutVks: 'VKS Tech के बारे में',
      ctaMeta: 'मोबाइल OTP लॉगिन · हिंदी और अंग्रेज़ी · VKS Tech',
      openApp: 'ऐप खोलें',
      footerProduct: 'उत्पाद', footerCompany: 'कंपनी', footerContact: 'संपर्क',
      footerBlurb: 'भारतीय फैक्टरियों और मल्टी-सेक्शन टीमों के लिए प्लांट शिफ्ट और मैनपावर शेड्यूलिंग।',
      footerMade: 'भारत के प्लांट संचालन के लिए',
      contactSection: 'संपर्क सेक्शन',
      cmpNeed: 'ज़रूरत',
      cmpMp: 'Man Power',
      cmpHrms: 'सामान्य HRMS (Keka / greytHR / HROne)',
      cmpR1a: 'प्लांट Excel → लाइव रोस्टर',
      cmpR1b: 'मुख्य वर्कफ़्लो',
      cmpR1c: 'संभव, लेकिन सेटअप भारी',
      cmpR2a: 'Auto Schedule + बहु-आयामी कवरेज',
      cmpR2b: 'सेक्शन / मशीन / भूमिका गैप के लिए',
      cmpR2c: 'शिफ्ट कैलेंडर; कवरेज गहराई अलग',
      cmpR3a: 'शॉप-फ्लोर कोड (D/N/O, OD)',
      cmpR3b: 'फर्स्ट-क्लास',
      cmpR3c: 'सामान्य अटेंडेंस-केंद्रित',
      cmpR4a: 'ऑफ़लाइन शेड्यूल एडिट',
      cmpR4b: 'PWA + ऑफ़लाइन कतार',
      cmpR4c: 'ज़्यादातर ऑनलाइन मोबाइल ऐप',
      cmpR5a: 'पेरोल, PF/ESI, पूरा HR',
      cmpR5b: 'प्रोडक्ट नहीं (डिज़ाइन से)',
      cmpR5c: 'मुख्य ताकत',
      cmpR6a: 'सिर्फ़ रोस्टरिंग का समय-मूल्य',
      cmpR6b: 'दिन, पूरा HR रोलआउट नहीं',
      cmpR6c: 'अक्सर हफ़्ते — मॉड्यूल जो न चाहिए',
      quote1: '“हम हर हफ़्ते वही Excel दोबारा नहीं बनाते। कवरेज गैप शिफ्ट से पहले दिखते हैं — मशीन खाली बैठने के बाद नहीं।”',
      quote1who: 'प्लांट / शिफ्ट लीड',
      quote1role: 'मल्टी-सेक्शन कन्वर्टिंग लाइन',
      quote2: '“मेंबर मोबाइल पर जॉइन करते हैं, हम सेक्शन और मशीन से अप्रूव करते हैं, और उसी दिन शेड्यूल पर आ जाते हैं। दूसरी डेटा एंट्री नहीं।”',
      quote2who: 'ऑपरेशंस मैनेजर',
      quote2role: 'फ्लेक्सिबल पैकेजिंग यूनिट',
      quote3: '“हमें दूसरा पूरा HRMS नहीं चाहिए था। रोस्टर को सेक्शन और मशीन कवरेज पर ईमानदार होना था।”',
      quote3who: 'फैक्टरी एडमिन',
      quote3role: 'मल्टी-मशीन प्लांट',
      quoteNote: 'नमूना आउटकम कॉपी — असली ग्राहक कोट उपलब्ध होने पर बदलें।',
      planStarts: 'प्लान शुरू होता है',
      priceNote: 'प्रकाशित हेडकाउंट बैंड चुनें, या कस्टम प्लान माँगें (अतिरिक्त सेक्शन, मल्टी-प्लांट, विशेष सुविधाएँ)।',
      trialNote: 'मुफ्त ट्रायल · दिन Admin सेट करता है',
      refundNote: 'कैंसल और रिफंड विंडो Customer Care से (दिन Admin सेट करता है)।',
      faq1q: 'क्या Man Power, Keka या HROne जैसा HRMS है?',
      faq1a: 'नहीं। Man Power प्लांट मैनपावर और शिफ्ट सिस्टम है: Excel टीम सेटअप, Auto Schedule, कवरेज जाँच, लीव/OD, और मोबाइल रोस्टर। पूरा hire-to-retire HR + पेरोल सूट नहीं।',
      faq2q: 'यह किसके लिए है?',
      faq2a: 'प्लांट मैनेजर, शिफ्ट सुपरवाइज़र, और फैक्टरी, फ्लेक्सिबल पैकेजिंग, प्रिंटिंग, कन्वर्टिंग, तथा किसी भी मल्टी-सेक्शन / मल्टी-मशीन टीम के लिए जो अभी भी Excel रोस्टर चलाती है।',
      faq3q: 'क्या यह ऑफ़लाइन काम करता है?',
      faq3a: 'हाँ। Man Power एक PWA है जिसमें ऑफ़लाइन कतार है, ताकि कमज़ोर प्लांट नेटवर्क पर भी शेड्यूल काम चलता रहे और कनेक्टिविटी आने पर सिंक हो।',
      faq4q: 'कवरेज सामान्य शिफ्ट कैलेंडर से कैसे अलग है?',
      faq4a: 'Auto Schedule के बाद ऐप विभाग, मशीन, पदनाम और ज़िम्मेदारी समूहों में प्रति शिफ्ट लोगों की गिनती करता है। कम दिन सूची में आते हैं ताकि साप्ताहिक छुट्टी बदलकर फिर जनरेट कर सकें — फ्लोर पर गैप मिलने से पहले।',
      faq5q: 'क्या पेरोल के लिए greytHR / Keka रख सकते हैं?',
      faq5a: 'हाँ। Man Power रोस्टरिंग और कवरेज पर फोकस करता है। अगर पहले से पेरोल / अटेंडेंस HRMS है तो रखें — दोनों अलग काम करते हैं।',
      footerMentor: 'Mentor',
      footerResume: 'Resume टूल्स',
      waCall: 'WhatsApp / कॉल',
      emailLabel: 'ईमेल',
      websiteLabel: 'VKS Tech'
    }
  };

  function getLang() {
    try {
      var l = String(localStorage.getItem(KEY) || 'en').toLowerCase();
      if (l === 'hindi' || l === 'hin') l = 'hi';
      return l === 'hi' ? 'hi' : 'en';
    } catch (e) { return 'en'; }
  }
  function setLang(l) {
    l = (l === 'hi' || l === 'hindi') ? 'hi' : 'en';
    try { localStorage.setItem(KEY, l); } catch (e) {}
    return l;
  }
  function t(k) {
    var pack = STR[getLang()] || STR.en;
    if (pack[k] != null) return pack[k];
    if (STR.en[k] != null) return STR.en[k];
    return k;
  }

  function apply() {
    var lang = getLang();
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!k) return;
      var val = t(k);
      if (val == null) return;
      if (el.getAttribute('data-i18n-html') === '1') el.innerHTML = t(k + 'Html') || val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html-key]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html-key');
      if (k && t(k)) el.innerHTML = t(k);
    });
    var btn = document.getElementById('landingLangBtn');
    if (btn) btn.textContent = lang === 'hi' ? 'हिं' : 'EN';
    document.querySelectorAll('.ui-table th').forEach(function (th) {
      var v = (th.textContent || '').trim();
      if (v === 'Department' || v === 'Section' || v === 'विभाग' || v === 'सेक्शन' || th.getAttribute('data-i18n') === 'department')
        th.textContent = t('department');
      if (v === 'Mon' || v === 'सोम') th.textContent = t('mon');
      if (v === 'Tue' || v === 'मंगल') th.textContent = t('tue');
      if (v === 'Wed' || v === 'बुध') th.textContent = t('wed');
      if (v === 'Coverage' || v === 'कवरेज') th.textContent = t('coverage');
    });
    document.querySelectorAll('.ui-table td, .ui-table span, .ui-table .pill').forEach(function (el) {
      var v = (el.textContent || '').trim();
      if (v === 'Short' || v === 'कम') el.textContent = t('short');
    });
    // Refresh videos for current language (EN vs HI URLs)
    try {
      if (typeof window.mpLandingFillVideos === 'function') window.mpLandingFillVideos();
    } catch (e) {}
    try {
      if (typeof window.mpLandingRenderPlans === 'function') window.mpLandingRenderPlans();
    } catch (e2) {}
  }

  window.mpLandingSetLang = function (l) { setLang(l); apply(); };
  window.mpLandingToggleLang = function () { setLang(getLang() === 'hi' ? 'en' : 'hi'); apply(); };
  window.mpLandingApply = apply;
  window.mpLandingGetLang = getLang;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
