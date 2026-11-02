/**
 * Man Power marketing landing — EN / HI (professional)
 * Preference: localStorage mp_lang
 */
(function () {
  'use strict';
  var KEY = 'mp_lang';
  var STR = {
    en: {
      navVideos: 'Videos',
      navFeatures: 'Features',
      navHow: 'How it works',
      navWhy: 'Why Man Power',
      navPricing: 'Pricing',
      navContact: 'Contact',
      navFaq: 'FAQ',
      login: 'Login',
      startFree: 'Start free',
      badge: 'Plant-floor shift & manpower · by VKS Tech',
      heroTitle: 'Shift coverage that works on the shop floor — not another full HRMS.',
      heroTitleHtml: 'Shift coverage that works on the <span>shop floor</span> — not another full HRMS.',
      heroSub: 'Upload your Excel. Auto-generate shifts. Check department, machine, and role coverage before the day starts. Built for factories, converting plants, and multi-section teams.',
      startTrial: 'Start free trial',
      seeHow: 'See how it works',
      metaExcel: 'Excel → roster',
      metaExcelSub: 'in minutes',
      metaCov: 'Coverage checks',
      metaCovSub: 'built-in',
      metaOff: 'Offline-ready',
      metaOffSub: 'PWA',
      department: 'Department',
      mon: 'Mon', tue: 'Tue', wed: 'Wed', coverage: 'Coverage',
      short: 'Short',
      featuresTitle: 'Features',
      featuresSub: 'Everything you need to plan manpower — without buying a full HR stack.',
      howTitle: 'From spreadsheet to live roster',
      howSub: 'Your Excel is the system of record — we don’t force a new language.',
      whyTitle: 'Why Man Power',
      whySub: 'Specialist rostering vs full HRMS',
      pricingTitle: 'Simple plans for plant teams',
      contactTitle: 'Contact',
      contactSub: 'Customer care & sales',
      faqTitle: 'FAQ',
      faqSub: 'Questions buyers ask',
      ctaTitle: 'Stop rebuilding the roster in Excel every week.',
      ctaSub: 'Start with your existing team sheet. Auto Schedule with coverage. Run the week on mobile.',
      openApp: 'Open app',
      footerProduct: 'Product',
      footerCompany: 'Company',
      lang: 'Language',
      english: 'English',
      hindi: 'Hindi'
    },
    hi: {
      navVideos: 'वीडियो',
      navFeatures: 'विशेषताएँ',
      navHow: 'कैसे काम करता है',
      navWhy: 'Man Power क्यों',
      navPricing: 'मूल्य',
      navContact: 'संपर्क',
      navFaq: 'सवाल-जवाब',
      login: 'लॉगिन',
      startFree: 'मुफ्त शुरू करें',
      badge: 'प्लांट-फ्लोर शिफ्ट और मैनपावर · VKS Tech',
      heroTitle: 'शिफ्ट कवरेज जो शॉप फ्लोर पर काम करे — पूरा HRMS नहीं।',
      heroTitleHtml: 'शिफ्ट कवरेज जो <span>शॉप फ्लोर</span> पर काम करे — पूरा HRMS नहीं।',
      heroSub: 'अपना Excel अपलोड करें। शिफ्ट अपने-आप बनाएँ। दिन शुरू होने से पहले विभाग, मशीन और भूमिका की कवरेज जाँचें। फैक्टरी, कन्वर्टिंग प्लांट और मल्टी-सेक्शन टीमों के लिए।',
      startTrial: 'मुफ्त ट्रायल शुरू करें',
      seeHow: 'देखें कैसे काम करता है',
      metaExcel: 'Excel → रोस्टर',
      metaExcelSub: 'मिनटों में',
      metaCov: 'कवरेज जाँच',
      metaCovSub: 'पहले से',
      metaOff: 'ऑफ़लाइन-रेडी',
      metaOffSub: 'PWA',
      department: 'विभाग',
      mon: 'सोम', tue: 'मंगल', wed: 'बुध', coverage: 'कवरेज',
      short: 'कम',
      featuresTitle: 'विशेषताएँ',
      featuresSub: 'मैनपावर प्लानिंग के लिए ज़रूरी सब कुछ — पूरा HR सॉफ्टवेयर खरीदे बिना।',
      howTitle: 'स्प्रेडशीट से लाइव रोस्टर तक',
      howSub: 'आपका Excel ही सिस्टम ऑफ़ रिकॉर्ड है — नई भाषा थोपी नहीं जाती।',
      whyTitle: 'Man Power क्यों',
      whySub: 'विशेषज्ञ रोस्टरिंग बनाम पूरा HRMS',
      pricingTitle: 'प्लांट टीमों के लिए सरल प्लान',
      contactTitle: 'संपर्क',
      contactSub: 'कस्टमर केयर और सेल्स',
      faqTitle: 'सवाल-जवाब',
      faqSub: 'खरीदार अक्सर ये पूछते हैं',
      ctaTitle: 'हर हफ़्ते Excel में रोस्टर दोबारा बनाना बंद करें।',
      ctaSub: 'मौजूदा टीम शीट से शुरू करें। कवरेज के साथ Auto Schedule। हफ़्ता मोबाइल पर चलाएँ।',
      openApp: 'ऐप खोलें',
      footerProduct: 'उत्पाद',
      footerCompany: 'कंपनी',
      lang: 'भाषा',
      english: 'English',
      hindi: 'हिंदी'
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
    return pack[k] != null ? pack[k] : (STR.en[k] || k);
  }

  function apply() {
    var lang = getLang();
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!k) return;
      var val = t(k);
      if (el.getAttribute('data-i18n-html') === '1') el.innerHTML = t(k + 'Html') || val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html-key]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html-key');
      if (k && t(k)) el.innerHTML = t(k);
    });
    var btn = document.getElementById('landingLangBtn');
    if (btn) btn.textContent = lang === 'hi' ? 'हिं' : 'EN';

    // Phrase-level replacements for remaining marketing copy (EN ↔ HI, no mix)
    var PH = {
      en: {
        'Features': 'Features',
        'Everything you need to plan manpower — without buying a full HR stack.': STR.en.featuresSub,
        'From spreadsheet to live roster': STR.en.howTitle,
        'Why Man Power': STR.en.whyTitle,
        'Specialist rostering vs full HRMS': STR.en.whySub,
        'Simple plans for plant teams': STR.en.pricingTitle,
        'Contact': STR.en.contactTitle,
        'Customer care & sales': STR.en.contactSub,
        'Customer care &amp; sales': STR.en.contactSub,
        'FAQ': STR.en.faqTitle,
        'Questions buyers ask': STR.en.faqSub,
        'Stop rebuilding the roster in Excel every week.': STR.en.ctaTitle,
        'Start free on Man Power': 'Start free on Man Power',
        'Open app': STR.en.openApp,
        'Product': STR.en.footerProduct,
        'Company': STR.en.footerCompany,
        'Login': STR.en.login,
        'Start free': STR.en.startFree,
        'Start free trial': STR.en.startTrial
      },
      hi: {
        'Features': STR.hi.featuresTitle,
        'Everything you need to plan manpower — without buying a full HR stack.': STR.hi.featuresSub,
        'From spreadsheet to live roster': STR.hi.howTitle,
        'Why Man Power': STR.hi.whyTitle,
        'Specialist rostering vs full HRMS': STR.hi.whySub,
        'Simple plans for plant teams': STR.hi.pricingTitle,
        'Contact': STR.hi.contactTitle,
        'Customer care & sales': STR.hi.contactSub,
        'Customer care &amp; sales': STR.hi.contactSub,
        'FAQ': STR.hi.faqTitle,
        'Questions buyers ask': STR.hi.faqSub,
        'Stop rebuilding the roster in Excel every week.': STR.hi.ctaTitle,
        'Start free on Man Power': 'Man Power पर मुफ्त शुरू करें',
        'Open app': STR.hi.openApp,
        'Product': STR.hi.footerProduct,
        'Company': STR.hi.footerCompany,
        'Login': STR.hi.login,
        'Start free': STR.hi.startFree,
        'Start free trial': STR.hi.startTrial,
        'See how it works': STR.hi.seeHow,
        'Videos': STR.hi.navVideos,
        'How it works': STR.hi.navHow,
        'Pricing': STR.hi.navPricing
      }
    };
    var map = PH[lang] || PH.en;
    var rev = PH.en; // always know English source
    document.querySelectorAll('h2, h3, .section-sub, .hero-sub, .btn, footer a, .cta-band h2, .cta-band p').forEach(function (el) {
      if (el.closest && el.closest('[data-i18n], [data-i18n-html-key]')) return;
      if (el.id === 'landingLangBtn') return;
      var raw = (el.innerHTML || '').trim();
      var tx = (el.textContent || '').trim();
      // Prefer exact text match on textContent for simple nodes
      if (map[tx]) {
        if (el.children.length === 0) el.textContent = map[tx];
      }
    });

    // Department in mock table
    document.querySelectorAll('.ui-table th').forEach(function (th) {
      var v = (th.textContent || '').trim();
      if (v === 'Section' || v === 'Department' || v === 'विभाग' || v === 'सेक्शन') th.textContent = t('department');
      if (v === 'Mon' || v === 'सोम') th.textContent = t('mon');
      if (v === 'Tue' || v === 'मंगल') th.textContent = t('tue');
      if (v === 'Wed' || v === 'बुध') th.textContent = t('wed');
      if (v === 'Coverage' || v === 'कवरेज') th.textContent = t('coverage');
    });
  }

  window.mpLandingSetLang = function (l) {
    setLang(l);
    apply();
  };
  window.mpLandingToggleLang = function () {
    setLang(getLang() === 'hi' ? 'en' : 'hi');
    apply();
  };
  window.mpLandingApply = apply;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
