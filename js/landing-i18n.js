/**
 * Man Power marketing landing — EN / HI only
 * Shared preference: localStorage mp_lang (same key as in-app)
 * apply() is fully bidirectional: HI→EN and EN→HI
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
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      coverage: 'Coverage',
      short: 'Short',
      featuresTitle: 'Features',
      featuresSub: 'Everything you need to plan manpower — without buying a full HR stack.',
      howTitle: 'How it works',
      howSub: 'From spreadsheet to live roster',
      whyTitle: 'Why Man Power',
      whySub: 'Specialist rostering vs full HRMS',
      pricingTitle: 'Pricing',
      pricingSub: 'Simple plans for plant teams',
      contactTitle: 'Contact',
      contactSub: 'Customer care & sales',
      faqTitle: 'FAQ',
      faqSub: 'Questions buyers ask',
      ctaTitle: 'Stop rebuilding the roster in Excel every week.',
      ctaSub: 'Start with your existing team sheet. Auto Schedule with coverage. Run the week on mobile.',
      ctaStart: 'Start free on Man Power',
      aboutVks: 'About VKS Tech',
      ctaMeta: 'Mobile OTP login · Hindi & English · Built by VKS Tech',
      openApp: 'Open app',
      footerProduct: 'Product',
      footerCompany: 'Company',
      footerContact: 'Contact',
      footerBlurb: 'Plant shift & manpower scheduling for Indian factories and multi-section teams.',
      footerMade: 'Made for plant operations in India',
      contactSection: 'Contact section',
      websiteLabel: 'VKS Tech',
      talkCustom: 'Talk to us for custom pricing',
      outcomesTitle: 'Outcomes',
      coverageLabel: 'Coverage that HRMS calendars skip',
      fromSheet: 'From spreadsheet to live roster'
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
      mon: 'सोम',
      tue: 'मंगल',
      wed: 'बुध',
      coverage: 'कवरेज',
      short: 'कम',
      featuresTitle: 'विशेषताएँ',
      featuresSub: 'मैनपावर प्लानिंग के लिए ज़रूरी सब कुछ — पूरा HR सॉफ्टवेयर खरीदे बिना।',
      howTitle: 'कैसे काम करता है',
      howSub: 'स्प्रेडशीट से लाइव रोस्टर तक',
      whyTitle: 'Man Power क्यों',
      whySub: 'विशेषज्ञ रोस्टरिंग बनाम पूरा HRMS',
      pricingTitle: 'मूल्य',
      pricingSub: 'प्लांट टीमों के लिए सरल प्लान',
      contactTitle: 'संपर्क',
      contactSub: 'कस्टमर केयर और सेल्स',
      faqTitle: 'सवाल-जवाब',
      faqSub: 'खरीदार अक्सर ये पूछते हैं',
      ctaTitle: 'हर हफ़्ते Excel में रोस्टर दोबारा बनाना बंद करें।',
      ctaSub: 'मौजूदा टीम शीट से शुरू करें। कवरेज के साथ Auto Schedule। हफ़्ता मोबाइल पर चलाएँ।',
      ctaStart: 'Man Power पर मुफ्त शुरू करें',
      aboutVks: 'VKS Tech के बारे में',
      ctaMeta: 'मोबाइल OTP लॉगिन · हिंदी और अंग्रेज़ी · VKS Tech',
      openApp: 'ऐप खोलें',
      footerProduct: 'उत्पाद',
      footerCompany: 'कंपनी',
      footerContact: 'संपर्क',
      footerBlurb: 'भारतीय फैक्टरियों और मल्टी-सेक्शन टीमों के लिए प्लांट शिफ्ट और मैनपावर शेड्यूलिंग।',
      footerMade: 'भारत के प्लांट संचालन के लिए',
      contactSection: 'संपर्क सेक्शन',
      websiteLabel: 'VKS Tech',
      talkCustom: 'कस्टम मूल्य के लिए बात करें',
      outcomesTitle: 'परिणाम',
      coverageLabel: 'कवरेज जो HRMS कैलेंडर छोड़ देते हैं',
      fromSheet: 'स्प्रेडशीट से लाइव रोस्टर तक'
    }
  };

  function getLang() {
    try {
      var l = String(localStorage.getItem(KEY) || 'en').toLowerCase();
      if (l === 'hindi' || l === 'hin') l = 'hi';
      // In-app may store gu/ta/… — landing only has en/hi
      return l === 'hi' ? 'hi' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function setLang(l) {
    l = l === 'hi' || l === 'hindi' ? 'hi' : 'en';
    try {
      localStorage.setItem(KEY, l);
    } catch (e) {}
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

    // Primary path: data-i18n keys (always correct both directions)
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!k) return;
      var val = t(k);
      if (val == null) return;
      if (el.getAttribute('data-i18n-html') === '1') {
        el.innerHTML = t(k + 'Html') || val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll('[data-i18n-html-key]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html-key');
      if (k && t(k)) el.innerHTML = t(k);
    });

    var btn = document.getElementById('landingLangBtn');
    if (btn) btn.textContent = lang === 'hi' ? 'हिं' : 'EN';

    // Mock coverage table headers
    document.querySelectorAll('.ui-table th').forEach(function (th) {
      var v = (th.textContent || '').trim();
      if (
        v === 'Department' ||
        v === 'Section' ||
        v === 'विभाग' ||
        v === 'सेक्शन' ||
        th.getAttribute('data-i18n') === 'department'
      ) {
        th.textContent = t('department');
      }
      if (v === 'Mon' || v === 'सोम') th.textContent = t('mon');
      if (v === 'Tue' || v === 'मंगल') th.textContent = t('tue');
      if (v === 'Wed' || v === 'बुध') th.textContent = t('wed');
      if (v === 'Coverage' || v === 'कवरेज') th.textContent = t('coverage');
    });
    document.querySelectorAll('.ui-table .short, .ui-table td').forEach(function (td) {
      var v = (td.textContent || '').trim();
      if (v === 'Short' || v === 'कम') {
        if (td.classList.contains('short') || v === 'Short' || v === 'कम') {
          // only replace pure Short cells
        }
      }
    });
    document.querySelectorAll('.ui-table .pill, .ui-table span, .ui-table td').forEach(function (el) {
      var v = (el.textContent || '').trim();
      if (v === 'Short' || v === 'कम') el.textContent = t('short');
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
