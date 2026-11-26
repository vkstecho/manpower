// Trials are assigned by the backend when a verified account is registered.
async function _hydrateUserPaymentStatus(){
  try{
    const uid = window._fbAuth?.currentUser?.uid;
    if (!uid || typeof window._fbCall !== 'function') return null;
    const entitlement = await window._fbCall('getMyCommercialEntitlement');
    if (window._fbAuth?.currentUser?.uid !== uid) return null;
    window._verifiedCommercialEntitlement = {...entitlement, uid, checkedAt:Date.now()};
    SESSION.paymentPaidUntil = entitlement.paidUntil;
    SESSION.paidUntil = entitlement.paidUntil;
    SESSION.paymentSource = entitlement.source;
    window._userPaymentPaidUntil = entitlement.paidUntil;
    return entitlement.paidUntil ? new Date(entitlement.paidUntil) : null;
  }catch(error){
    return null;
  }
}

setTimeout(()=>{ _hydrateUserPaymentStatus(); }, 2500);
