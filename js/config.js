/**
 * Man Power — shared config (no secrets)
 * Loaded before app.js. Secrets (admin hashes, license unlock hashes) live ONLY in Firebase.
 * v2.4.0 — multi-industry / multi-team
 */
(function (global) {
  'use strict';
  global.MP_CFG = global.MP_CFG || {
    APP_VERSION: '2.4.0',
    license: {
      expiry: new Date(2026, 11, 31),
      warnDays: 15,
      extendTo: new Date(2027, 11, 31)
    },
    supervisorInstructor: 'MOHIT',
    // Default min-staff hints (overridden by Manager Excel / Profile settings)
    minShift: { default: 2 },
    shiftLabels: {
      D: 'दिन (7AM-7PM)', N: 'रात (7PM-7AM)', A: 'A Shift', B: 'B Shift', C: 'C Shift',
      O: 'साप्ताहिक छुट्टी', L: 'लीव', G: 'जनरल', 'C/O': 'Comp Off'
    },
    contactVivek: '+918168771239',
    contactAdmin: '+918929394920',
    hardAdminPhones: ['+918929397949', '+918929394920', '8929397949', '8929394920'],
    managerInviteCode: 'METMGR'
  };
})(typeof window !== 'undefined' ? window : globalThis);
