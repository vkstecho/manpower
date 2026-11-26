'use strict';

const mpSafeImage = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

function mpMediaPath(value) {
  if (value.startsWith('mp-private:')) return value.slice(11);
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com') return null;
    const match = /^\/v0\/b\/([^/]+)\/o\/(.+)$/.exec(url.pathname);
    return match && decodeURIComponent(match[1]) === window.MP_FIREBASE_CONFIG?.storageBucket ?
      decodeURIComponent(match[2]) : null;
  } catch (error) { return null; }
}

function mpMediaAttr(value) {
  if (typeof value !== 'string' || !value) return '';
  const path = mpSafeImage.test(value) ? value : mpMediaPath(value);
  if (!path) return '';
  const reference = mpSafeImage.test(path) ? path : 'mp-private:' + path;
  const encoded = reference.replace(/[&"<>]/g, ch => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'})[ch]);
  return 'data-mp-media="' + encoded + '"';
}

(() => {
  async function render(img) {
    const value = img.dataset.mpMedia;
    if (!value || img.dataset.mpMediaLoaded === value) return;
    img.dataset.mpMediaLoaded = value;
    img.removeAttribute('src');
    if (mpSafeImage.test(value)) { img.src = value; return; }
    const path = mpMediaPath(value);
    if (!path || !window._fbCall) return;
    const uid = window._fbAuth?.currentUser?.uid;
    try {
      const {image} = await window._fbCall('getPrivateMedia',{path});
      if (uid && uid === window._fbAuth?.currentUser?.uid && img.dataset.mpMedia === value && mpSafeImage.test(image)) img.src = image;
    } catch (error) { /* Keep the authorized placeholder if access fails. */ }
  }
  function renderImages() { document.querySelectorAll('img[data-mp-media]').forEach(render); }
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(renderImages).observe(document.body,{childList:true,subtree:true});
    renderImages();
  });
  document.addEventListener('firebase-ready', () => {
    document.querySelectorAll('img[data-mp-media]').forEach(img => delete img.dataset.mpMediaLoaded);
    renderImages();
  });
})();
