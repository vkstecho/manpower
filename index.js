/**
 * Man Power Cloud Functions
 * Deploy: cd functions && npm i && firebase deploy --only functions
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Callable: setRoleClaim({ uid, role })
 * role: 'admin' | 'manager' | 'member'
 *
 * Caller must be admin via claim OR RTDB admins/{uid} === true.
 * After success, target user must refresh ID token (client: getIdToken(true)).
 */
exports.setRoleClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }

  const callerUid = context.auth.uid;
  const token = context.auth.token || {};
  let callerIsAdmin = token.admin === true;

  if (!callerIsAdmin) {
    const snap = await admin.database().ref('admins/' + callerUid).once('value');
    callerIsAdmin = snap.val() === true;
  }
  // Bootstrap: hard-admin phone on token
  if (!callerIsAdmin && token.phone_number) {
    const digits = String(token.phone_number).replace(/\D/g, '').slice(-10);
    if (digits === '8929397949') callerIsAdmin = true;
  }
  if (!callerIsAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const uid = String((data && data.uid) || '').trim();
  const role = String((data && data.role) || 'member').trim();
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid required');
  }
  if (!['admin', 'manager', 'member'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'role must be admin|manager|member');
  }

  const claims = {
    admin: role === 'admin',
    manager: role === 'manager' || role === 'admin',
  };
  await admin.auth().setCustomUserClaims(uid, claims);

  // Mirror RTDB nodes for rules fallback
  const db = admin.database();
  if (claims.admin) {
    await db.ref('admins/' + uid).set(true);
  }
  if (claims.manager || claims.admin) {
    await db.ref('managers/' + uid).set(true);
  }

  return { ok: true, uid, claims };
});

/**
 * Callable: syncMyClaims()
 * Self-service for approved managers/admins already in mobileUsers / hard-admin.
 * Issues claims based on RTDB role so rules can use auth.token.manager/admin.
 */
exports.syncMyClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }
  const uid = context.auth.uid;
  const phone = (context.auth.token && context.auth.token.phone_number) || '';
  const digits = String(phone).replace(/\D/g, '').slice(-10);

  let role = 'member';
  if (digits === '8929397949') {
    role = 'admin';
  } else {
    const mu = await admin.database().ref('mobileUsers/' + digits).once('value');
    const rec = mu.val();
    if (rec && rec.status === 'approved' && rec.role === 'admin') role = 'admin';
    else if (rec && rec.status === 'approved' && rec.role === 'manager') role = 'manager';
    else {
      const adm = await admin.database().ref('admins/' + uid).once('value');
      if (adm.val() === true) role = 'admin';
      else {
        const mgr = await admin.database().ref('managers/' + uid).once('value');
        if (mgr.val() === true) role = 'manager';
      }
    }
  }

  const claims = {
    admin: role === 'admin',
    manager: role === 'manager' || role === 'admin',
  };
  await admin.auth().setCustomUserClaims(uid, claims);
  return { ok: true, uid, role, claims };
});
