// Trials and subscription eligibility come from the verified server account.
let _commercialRequest = null;
function _loadCommercialEntitlement() {
  const user = window._fbAuth?.currentUser;
  if (!user || user.isAnonymous || typeof window._fbCall !== 'function') return Promise.resolve(null);
  if (_commercialRequest?.uid === user.uid) return _commercialRequest.promise;
  const promise = window._fbCall('getMyCommercialEntitlement').then(entitlement => {
    if (window._fbAuth?.currentUser?.uid !== user.uid || !entitlement ||
        typeof entitlement.enabled !== 'boolean') return null;
    const verified = {...entitlement,uid:user.uid,checkedAt:Date.now()};
    window._verifiedCommercialEntitlement = verified;
    SESSION.paymentPaidUntil = verified.paidUntil;
    SESSION.paidUntil = verified.paidUntil;
    SESSION.paymentSource = verified.source;
    window._userPaymentPaidUntil = verified.paidUntil;
    return verified;
  }).catch(() => null).finally(() => {
    if (_commercialRequest?.promise === promise) _commercialRequest = null;
  });
  _commercialRequest = {uid:user.uid,promise};
  return promise;
}
async function _hydrateUserPaymentStatus() {
  const entitlement = _currentCommercialEntitlement() || await _loadCommercialEntitlement();
  return entitlement?.paidUntil ? new Date(entitlement.paidUntil) : null;
}
