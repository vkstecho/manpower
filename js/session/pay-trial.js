// Trials and subscription eligibility come from the verified server account.
let _commercialRequest = null;
let _commercialEpoch = 0;
let _commercialUid = null;
function _invalidateCommercialEntitlement() {
  _commercialEpoch++;
  _commercialRequest = null;
  window._verifiedCommercialEntitlement = null;
  window._userPaymentPaidUntil = null;
}
document.addEventListener('mp-firebase-auth',event=>{
  if (_commercialUid !== event.detail?.uid) {
    _commercialUid = event.detail?.uid;
    _invalidateCommercialEntitlement();
  }
});
document.addEventListener('mp-firebase-revoked',_invalidateCommercialEntitlement);
function _loadCommercialEntitlement() {
  const user = window._fbAuth?.currentUser;
  if (!user || user.isAnonymous || typeof window._fbCall !== 'function') return Promise.resolve(null);
  const epoch = _commercialEpoch;
  const identity = _commercialIdentityKey();
  if (_commercialRequest?.identity === identity) return _commercialRequest.promise;
  const promise = window._fbCall('getMyCommercialEntitlement',{includePlan:true}).then(entitlement => {
    if (epoch !== _commercialEpoch || identity !== _commercialIdentityKey() || !entitlement ||
        typeof entitlement.enabled !== 'boolean') return null;
    const verified = {...entitlement,uid:user.uid,identity,checkedAt:Date.now()};
    window._verifiedCommercialEntitlement = verified;
    SESSION.paymentPaidUntil = verified.paidUntil;
    SESSION.paidUntil = verified.paidUntil;
    SESSION.paymentSource = verified.source;
    window._userPaymentPaidUntil = verified.paidUntil;
    return verified;
  }).catch(() => null).finally(() => {
    if (_commercialRequest?.promise === promise) _commercialRequest = null;
  });
  _commercialRequest = {uid:user.uid,identity,promise};
  return promise;
}
async function _hydrateUserPaymentStatus() {
  const entitlement = _currentCommercialEntitlement() || await _loadCommercialEntitlement();
  return entitlement?.paidUntil ? new Date(entitlement.paidUntil) : null;
}
