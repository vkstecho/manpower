/**
 * Man Power — publicOffer landing reader (v3.2.9)
 * Anonymous RTDB read + localStorage cache. No hardcoded prices/trial.
 */
(function (global) {
  'use strict';
  var CACHE_KEY = 'mp_public_offer_v1';

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && o.data ? o : null;
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
        if (!done) {
          done = true;
          resolve(null);
        }
      }, ms);
      function finish(val) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(val);
      }
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

  function isHi() {
    try {
      var lang =
        (typeof _lang !== 'undefined' && _lang) || localStorage.getItem('mp_lang') || '';
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
    var refundLine = document.getElementById('loginRefundLine');
    var langLabel = document.getElementById('loginLangBtnLabel');

    if (langLabel) {
      langLabel.textContent = isHi() ? 'हिन्दी' : 'English';
    }

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
      if (refundLine) {
        refundLine.style.display = 'none';
        refundLine.textContent = '';
      }
      if (faq) faq.innerHTML = '';
      return;
    }

    if (neutral) neutral.style.display = 'none';

    // Row 1: trial + discount only
    var top = [];
    if (trialDays > 0) {
      top.push(
        '<span class="mp-offer-chip">' +
          t(trialDays + ' दिन मुफ़्त ट्रायल', trialDays + '-day free trial') +
          '</span>'
      );
    }
    if (pct > 0) {
      top.push(
        '<span class="mp-offer-chip">' +
          t('वार्षिक पर ' + pct + '% बचत', 'Save ' + pct + '% on annual') +
          '</span>'
      );
    }

    // Row 2: max 3 plans
    var planHtml = '';
    if (plans.length) {
      var shown = plans.slice(0, 3);
      var chips = shown
        .map(function (p) {
          var name = (p && (p.name || p.label)) || '';
          var monthly = p && (p.monthly != null ? p.monthly : p.amount);
          var label = name || (monthly != null ? '₹' + monthly : '');
          if (!label) return '';
          return '<span class="mp-plan-chip">' + String(label).replace(/</g, '') + '</span>';
        })
        .filter(Boolean)
        .join('');
      if (plans.length > 3) {
        chips +=
          '<span class="mp-plan-chip mp-plan-more">' +
          t('+' + (plans.length - 3) + ' और', '+' + (plans.length - 3) + ' more') +
          '</span>';
      }
      if (chips) planHtml = '<div class="mp-plan-row">' + chips + '</div>';
    }

    
    // Landing videos (from Admin publish)
    var videoBox = document.getElementById('loginVideos');
    if (videoBox) {
      var shortU = offer && offer.videoShortUrl ? String(offer.videoShortUrl).trim() : '';
      var longU = offer && offer.videoLongUrl ? String(offer.videoLongUrl).trim() : '';
      var shortT = (offer && offer.videoShortTitle) || 'Auto Schedule · one click';
      var longT = (offer && offer.videoLongTitle) || 'Setup + free trial';
      function toEmbed(url) {
        if (!url) return '';
        var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);
        if (m) return 'https://www.youtube.com/embed/' + m[1];
        if (/\.mp4($|\?)/i.test(url)) return url;
        return url;
      }
      var htmlV = '';
      if (shortU || longU) {
        htmlV += '<div class="mp-login-videos">';
        if (shortU) {
          var e1 = toEmbed(shortU);
          htmlV += '<a class="mp-vid-chip" href="' + shortU.replace(/"/g,'') + '" target="_blank" rel="noopener">' +
            '▶ ' + String(shortT).replace(/</g,'') + '</a>';
        }
        if (longU) {
          htmlV += '<a class="mp-vid-chip mp-vid-long" href="' + longU.replace(/"/g,'') + '" target="_blank" rel="noopener">' +
            '▶ ' + String(longT).replace(/</g,'') + '</a>';
        }
        htmlV += '</div>';
      }
      videoBox.innerHTML = htmlV;
    }

    if (offerBox) {
      var html = '';
      if (top.length) html += '<div class="mp-offer-row">' + top.join('') + '</div>';
      if (planHtml) html += planHtml;
      offerBox.innerHTML = html;
    }

    if (refundLine) {
      if (refundDays > 0) {
        refundLine.style.display = 'block';
        refundLine.textContent = t(
          refundDays + ' दिन में Customer Care से रद्द व रिफंड',
          refundDays + '-day cancel & refund via Customer Care'
        );
      } else {
        refundLine.style.display = 'none';
        refundLine.textContent = '';
      }
    }

    // FAQ under fold
    if (faq) {
      var items = [];
      if (trialDays > 0) {
        items.push({
          q: t('ट्रायल कैसे काम करता है?', 'How does the trial work?'),
          a: t(
            'नए यूज़र को ' + trialDays + ' दिन का मुफ़्त ट्रायल मिलता है (Admin सेटिंग)।',
            'New users get a ' + trialDays + '-day free trial (as set by Admin).'
          )
        });
      }
      if (plans.length && offer.paymentEnabled) {
        items.push({
          q: t('कीमत क्या है?', 'What does it cost?'),
          a: t(
            'प्लान Admin सेट करता है। पूरी सूची लॉगिन के बाद दिखती है।' +
              (pct > 0 ? ' वार्षिक पर ' + pct + '% छूट।' : ''),
            'Plans are set by Admin. Full list after login.' +
              (pct > 0 ? ' Save ' + pct + '% on annual.' : '')
          )
        });
      }
      if (refundDays > 0) {
        items.push({
          q: t('रद्द / रिफंड?', 'Cancel / refund?'),
          a: t(
            refundDays +
              ' दिनों के अंदर Customer Care से अनुरोध करें। ऑटो-कैंसिल नहीं है।',
            'Request via Customer Care within ' +
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
    if (cached && cached.data) apply(cached.data);
    else apply(null);
    var fresh = await fetchWithTimeout(3000);
    if (fresh) {
      writeCache(fresh);
      apply(fresh);
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
