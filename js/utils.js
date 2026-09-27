/**
 * Man Power — shared utilities (XSS, path sanitize, hashing)
 */
(function (global) {
  'use strict';
  function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function sanitizeFbPath(path) {
    return String(path || '').replace(/[.$#\[\]\/\x00-\x1f]/g, '_').substring(0, 256);
  }
  function isValidEmpId(id) {
    return /^[A-Z0-9]{3,20}$/.test(String(id || ''));
  }
  async function hashPass(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  global.MP_UTILS = { escHtml, sanitizeFbPath, isValidEmpId, hashPass };
  // Keep global aliases used by app.js during gradual modularization
  if (typeof global.escHtml !== 'function') global.escHtml = escHtml;
  if (typeof global.sanitizeFbPath !== 'function') global.sanitizeFbPath = sanitizeFbPath;
  if (typeof global.isValidEmpId !== 'function') global.isValidEmpId = isValidEmpId;
  if (typeof global.hashPass !== 'function') global.hashPass = hashPass;
})(typeof window !== 'undefined' ? window : globalThis);
