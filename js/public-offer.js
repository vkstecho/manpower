/**
 * Man Power — publicOffer landing reader (v3.2.7)
 * Anonymous RTDB read + localStorage cache. No hardcoded prices/trial.
 */
(function (global) {
  'use strict';
  var CACHE_KEY = 'mp_public_offer_v1';
  var CACHE_TTL_MS = 10 * 60 * 1000;

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.data) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, at: Date.now() }));
    } catch (e) {}
  }

  function fetchWithTimeout(ms) {
    ms = ms || 3000;
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, ms);
      function finish(val) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(val);
      }
      // Prefer Firebase REST (works without auth for publicOffer)
      try {
        var url =
          'https://metpowervks-default-rtdb.asia-southeast1.firebasedatabase.app/publicOffer.json';
        fetch(url, { method: 'GET', cache: 'no-store' })
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(function (j) {
            finish(j && typeof j === 'object' ? j : null);
          })
          .catch(function () {
            finish(null);
          });
      } catch (e) {
        finish(null);
      }
    });
  }

  function safeOffer(o) {
    if (!o || typeof o !== 'object') return null;
    return o;
  }

  function isHi() {
    try {
      var lang = (typeof _lang !== 'undefined' && _lang) || localStorage.getItem('mp_lang') || '';
      lang = String(lang).toLowerCase();
      return lang === 'hi' || lang === 'hindi' || lang === 'hin';
    } catch (e) {
      return false;
    }
  }

  function t(hi, en) {
    return isHi() ? hi : en;
  }

  function renderOffer(offer) {
    var showCommercial =
      offer &&
      offer.paymentEnabled === true &&
      (parseInt(offer.trialDays, 10) > 0 ||
        parseInt(offer.annualDiscountPct, 10) > 0 ||
        (Array.isArray(offer.plans) && offer.plans.length) ||
        parseInt(offer.refundDays, 10) > 0);

    var headline = document.getElementById('loginOutcomeHeadline');
    if (headline) {
      headline.textContent = t(
        'मिनटों में पूरी टीम का शिफ्ट रोस्टर',
        'Full team shift roster in minutes'
      );
    }

    var offerBox = document.getElementById('loginOfferSnapshot');
    var primaryBtn = document.getElementById('sendOtpBtn');
    var stickyBtn = document.getElementById('loginStickyCta');
    var neutral = document.getElementById('loginNeutralLine');
    var faq = document.getElementById('loginFaq');

    var trialDays = offer ? parseInt(offer.trialDays, 10) || 0 : 0;
    var pct = offer ? parseInt(offer.annualDiscountPct, 10) || 0 : 0;
    var refundDays = offer ? parseInt(offer.refundDays, 10) || 0 : 0;
    var plans = offer && Array.isArray(offer.plans) ? offer.plans : [];

    var primaryLabel =
      showCommercial && trialDays > 0
        ? t('मुफ़्त ट्रायल शुरू करें', 'Start free trial')
        : t('जारी रखें', 'Continue');

    if (primaryBtn) {
      primaryBtn.innerHTML = primaryLabel + ' &#128172;';
    }
    if (stickyBtn) {
      stickyBtn.textContent = primaryLabel;
    }

    if (!showCommercial) {
      if (offerBox) offerBox.innerHTML = '';
      if (neutral) {
        neutral.style.display = 'block';
        neutral.textContent = t('OTP से लॉगिन करके शुरू करें', 'Login with OTP to get started');
      }
      if (faq) faq.innerHTML = '';
      return;
    }

    if (neutral) neutral.style.display = 'none';

    var parts = [];
    if (trialDays > 0) {
      parts.push(
        '<span class="mp-offer-chip">' +
          t(trialDays + ' दिन मुफ़्त ट्रायल', trialDays + '-day free trial') +
          '</span>'
      );
    }
    if (pct > 0) {
      parts.push(
        '<span class="mp-offer-chip">' +
          t('वार्षिक पर ' + pct + '% बचत', 'Save ' + pct + '% on annual') +
          '</span>'
      );
    }
    if (refundDays > 0) {
      parts.push(
        '<span class="mp-offer-chip mp-offer-muted">' +
          t(
            refundDays + ' दिन में Customer Care से रद्द व रिफंड',
            refundDays + '-day cancel & refund via Customer Care'
          ) +
          '</span>'
      );
    }
    if (plans.length) {
      var chips = plans
        .map(function (p) {
          var name = (p && (p.name || p.label)) || '';
          var monthly = p && (p.monthly != null ? p.monthly : p.amount);
          var label =
            name ||
            (monthly != null ? '₹' + monthly : '');
          if (!label) return '';
          return '<span class="mp-plan-chip">' + String(label).replace(/</g, '') + '</span>';
        })
        .filter(Boolean)
        .join('');
      if (chips) parts.push('<div class="mp-plan-row">' + chips + '</div>');
    }
    if (offerBox) offerBox.innerHTML = parts.join('');

    // FAQ — hide answers with no data
    if (faq) {
      var items = [];
      if (trialDays > 0) {
        items.push({
          q: t('ट्रायल कैसे काम करता है?', 'How does the trial work?'),
          a: t(
            'नए यूज़र को ' + trialDays + ' दिन का मुफ़्त ट्रायल मिलता है (Admin सेटिंग के अनुसार)।',
            'New users get a ' + trialDays + '-day free trial (as set by Admin).'
          )
        });
      }
      if (plans.length && offer.paymentEnabled) {
        items.push({
          q: t('कीमत क्या है?', 'What does it cost?'),
          a: t(
            'प्लान Admin द्वारा सेट होते हैं। लॉगिन के बाद पेमेंट स्क्रीन पर देखें।' +
              (pct > 0 ? ' वार्षिक पर ' + pct + '% छूट।' : ''),
            'Plans are set by Admin. See the payment screen after login.' +
              (pct > 0 ? ' Save ' + pct + '% on annual.' : '')
          )
        });
      }
      if (refundDays > 0) {
        items.push({
          q: t('रद्द / रिफंड?', 'Cancel / refund?'),
          a: t(
            refundDays +
              ' दिनों के अंदर Customer Care से अनुरोध करें। तुरंत ऑटो-कैंसिल नहीं है।',
            'Request cancel & refund via Customer Care within ' +
              refundDays +
              ' days. Not instant auto-cancel.'
          )
        });
      }
      items.push({
        q: t('डेटा सुरक्षित है?', 'Is my data safe?'),
        a: t(
          'लॉगिन OTP से होता है। शिफ्ट/टीम डेटा आपके संगठन के अकाउंट में रहता है।',
          'Login uses OTP. Shift and team data stays in your organisation account.'
        )
      });
      faq.innerHTML = items
        .map(function (it) {
          return (
            '<details class="mp-faq-item"><summary>' +
            it.q +
            '</summary><p>' +
            it.a +
            '</p></details>'
          );
        })
        .join('');
    }

    // Optional support links from snapshot (digits/email only)
    try {
      var wa = offer.supportWhatsApp ? String(offer.supportWhatsApp).replace(/\D/g, '') : '';
      var em = offer.supportEmail ? String(offer.supportEmail).trim() : '';
      var waA = document.getElementById('loginWaSupport');
      var emA = document.getElementById('loginEmailSupport');
      if (waA && wa.length >= 10) waA.href = 'https://wa.me/' + wa;
      if (emA && em.indexOf('@') > 0) emA.href = 'mailto:' + em;
    } catch (e) {}
  }

  function apply(offer) {
    global.__mpPublicOffer = offer || null;
    renderOffer(offer);
  }

  async function loadPublicOffer() {
    var cached = readCache();
    if (cached && cached.data) {
      apply(safeOffer(cached.data));
    } else {
      apply(null);
    }
    var fresh = await fetchWithTimeout(3000);
    if (fresh) {
      writeCache(fresh);
      apply(safeOffer(fresh));
    } else if (!cached) {
      apply(null);
    }
    return global.__mpPublicOffer;
  }

  global.loadPublicOffer = loadPublicOffer;
  global.renderPublicOffer = renderOffer;
  global.MP_PUBLIC_OFFER = { load: loadPublicOffer, render: renderOffer, cacheKey: CACHE_KEY };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadPublicOffer();
    });
  } else {
    loadPublicOffer();
  }
})(typeof window !== 'undefined' ? window : globalThis);
