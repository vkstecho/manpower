/* The published offer contains prices and support information, never checkout links. */
(() => {
  'use strict';
  let request;
  function load() {
    if (request) return request;
    const base = window.MP_FIREBASE_CONFIG?.databaseURL;
    if (!base) return Promise.resolve(null);
    request = fetch(base.replace(/\/$/,'') + '/publicOffer.json', {
      credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', signal:AbortSignal.timeout(3500)
    }).then(response => response.ok ? response.json() : null)
      .then(offer => offer && typeof offer === 'object' && !Array.isArray(offer) ? offer : null)
      .catch(() => null);
    return request;
  }
  window.MP_PUBLIC_OFFER = Object.freeze({load});
})();
