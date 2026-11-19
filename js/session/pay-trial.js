/**
 * Man Power — Payment TRIAL + hydrate SESSION paidUntil
 * Split from app-session-payment.js (v6.0.54 Phase 2)
 * Individual = own paidUntil only; member under live manager may inherit.
 * Load after pay-gate.js.
 */
async function _getAdminFreeTrialDays(){
  let trialDays = 7;
  try{
    let lic = window._appLicenseCache || null;
    if(!lic && typeof fbGet === 'function'){
      try{ lic = await fbGet('settings/appLicense'); if(lic) window._appLicenseCache = lic; }catch(e){}
    }
    if(lic && lic.freeTrialDays != null){
      const n = parseInt(lic.freeTrialDays, 10);
      if(!isNaN(n) && n >= 1 && n <= 365) trialDays = n;
    } else if(window.MP_CFG && window.MP_CFG.defaultTrialDays){
      trialDays = Math.max(1, Math.min(365, parseInt(window.MP_CFG.defaultTrialDays,10)||trialDays));
    }
  }catch(e){}
  return trialDays;
}
/** Defaults for newly registered managers */
async function _newManagerAccessDefaults(){
  const trialDays = await _getAdminFreeTrialDays();
  const end = new Date();
  end.setHours(23,59,59,999);
  end.setDate(end.getDate() + trialDays);
  const iso = end.toISOString();
  return {
    trialDays: trialDays,
    validTill: iso,
    paymentPaidUntil: iso,
    paidUntil: iso,
    teamSize: 200,
    maxMembers: 200,
    planMaxMembers: 200,
    planPeriod: 'monthly',
    planLabel: 'Monthly · Up to 200 members',
    paymentTrialGranted: true,
    paymentTrialDays: trialDays,
    paymentUpdatedBy: 'auto_trial_'+trialDays+'d_reg'
  };
}
try{
  window._getAdminFreeTrialDays = _getAdminFreeTrialDays;
  window._newManagerAccessDefaults = _newManagerAccessDefaults;
}catch(e){}

async function _ensureNewUserPaymentTrial(phone, mu, ps){
  try{
    if(!phone) return null;
    // Admin / hard-admin never need trial
    try{
      if(typeof isAdmin==='function' && isAdmin()) return null;
      if(typeof _isHardAdminPhone==='function' && _isHardAdminPhone(phone)) return null;
    }catch(e){}
    const src = Object.assign({}, mu || {}, ps || {});
    // Resolve Admin freeTrialDays (settings/appLicense)
    let trialDays = 7; // default when Admin has not set (matches common config)
    try{
      let lic = window._appLicenseCache || null;
      if(!lic && typeof fbGet === 'function'){
        try{ lic = await fbGet('settings/appLicense'); if(lic) window._appLicenseCache = lic; }catch(e){}
      }
      if(lic && lic.freeTrialDays != null){
        const n = parseInt(lic.freeTrialDays, 10);
        if(!isNaN(n) && n >= 1 && n <= 365) trialDays = n;
      } else if(window.MP_CFG && window.MP_CFG.defaultTrialDays){
        trialDays = Math.max(1, Math.min(365, parseInt(window.MP_CFG.defaultTrialDays,10)||trialDays));
      }
    }catch(e){ console.warn('[payTrial] freeTrialDays read', e && e.message); }

    const byAuto = String(src.paymentUpdatedBy||'').indexOf('auto_trial') === 0
      || src.paymentTrialGranted === true || src.paymentTrialGranted === 'true' || src.paymentTrialGranted === 1;

    // Already on an auto trial: clamp paidUntil down to Admin freeTrialDays from firstLoginAt
    // (fixes managers who got 30d before Admin set 7d — never lengthen paid Admin grants)
    if(byAuto && (src.paymentPaidUntil || src.paidUntil || src.paymentPaidUntilDate)){
      try{
        const startIso = src.firstLoginAt || src.createdAt || null;
        const start = startIso ? new Date(startIso) : new Date();
        if(!isNaN(start.getTime())){
          const endClamp = new Date(start.getFullYear(), start.getMonth(), start.getDate() + trialDays, 23, 59, 59, 999);
          const cur = new Date(src.paymentPaidUntil || src.paidUntil || src.paymentPaidUntilDate);
          if(!isNaN(cur.getTime()) && endClamp.getTime() < cur.getTime() - 60000){
            const iso = endClamp.toISOString();
            const payload = {
              paymentPaidUntil: iso,
              paidUntil: iso,
              paymentTrialGranted: true,
              paymentTrialDays: trialDays,
              firstLoginAt: start.toISOString(),
              updatedAt: new Date().toISOString(),
              paymentUpdatedBy: 'auto_trial_clamp_'+trialDays+'d'
            };
            try{ await fbSet('paymentStatus/'+phone, Object.assign({}, payload, { mobile: phone, phone: phone })); }catch(e){}
            try{ await fbUpdate('mobileUsers/'+phone, payload); }catch(e){}
            try{
              if(window._cache && window._cache.mobileUsers && window._cache.mobileUsers[phone]){
                Object.assign(window._cache.mobileUsers[phone], payload);
              }
            }catch(e){}
            return payload;
          }
        }
      }catch(e){ console.warn('[payTrial] clamp', e && e.message); }
      return null; // already has trial end — do not extend
    }

    // v6.0.49: sticky / expired paid-until after Delete Account must not block a fresh trial.
    // - forceFreshLogin / cleared_on_delete → always allow new trial
    // - expired paid-until (past calendar day) → allow new trial (rejoin case)
    // - future Admin/manual paid-until → never overwrite
    const forceFresh = !!(src.forceFreshLogin || src.status === 'cleared_on_delete'
      || src.clearedBy === 'self_delete_account' || src.paymentUpdatedBy === 'cleared_on_delete');
    let existingEnd = null;
    try{
      const rawU = src.paymentPaidUntil || src.paidUntil || src.paymentPaidUntilDate;
      if(rawU){
        const d = new Date(rawU);
        if(!isNaN(d.getTime())) existingEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      }
    }catch(e){}
    const existingStillValid = existingEnd && existingEnd.getTime() >= Date.now();
    if(existingStillValid && !forceFresh) return null; // active paid/trial — keep it
    if(!forceFresh && !existingEnd && (src.paymentTrialGranted === true || src.paymentTrialGranted === 'true' || src.paymentTrialGranted === 1))
      return null;

    // Member under a LIVE paying manager → inherit manager paid-until when longer than trial.
    // v6.0.52: Individuals (no manager / status individual / left_team) never inherit — own paid-until only.
    let inheritIso = null;
    try{
      const isIndividual = !!(src.individual === true || src.status === 'individual'
        || src.status === 'left_team' || src.status === 'left'
        || (src.role === 'member' && !src.managerId && !src.managerMobile));
      const mid = (typeof _normMobileKey==='function')
        ? _normMobileKey(src.managerId || src.managerMobile || (mu && (mu.managerId||mu.managerMobile)) || '')
        : String(src.managerId || '').replace(/\D/g,'').slice(-10);
      if(!isIndividual && mid && mid.length===10 && mid !== phone){
        let mgr = null;
        try{ mgr = await fbGet('mobileUsers/'+mid); }catch(e){}
        if(!mgr){ try{ mgr = await fbGet('paymentStatus/'+mid); }catch(e){} }
        // Manager must still be a live manager (not removed)
        const mgrOk = mgr && String(mgr.role||'').toLowerCase()==='manager'
          && mgr.status !== 'removed' && mgr.status !== 'revoked';
        if(mgrOk){
          const muRaw = mgr.paymentPaidUntil || mgr.paidUntil || mgr.validTill || mgr.paymentPaidUntilDate;
          if(muRaw){
            const md = new Date(muRaw);
            if(!isNaN(md.getTime()) && md.getTime() >= Date.now()){
              inheritIso = md.toISOString();
            }
          }
        }
      }
    }catch(eInh){}

    const base = new Date();
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + trialDays, 23, 59, 59, 999);
    let iso = end.toISOString();
    let updatedBy = 'auto_trial_'+trialDays+'d';
    if(inheritIso){
      const inh = new Date(inheritIso);
      if(!isNaN(inh.getTime()) && inh.getTime() > end.getTime()){
        iso = inheritIso;
        updatedBy = 'inherit_manager_paid';
      }
    }
    const payload = {
      paymentPaidUntil: iso,
      paidUntil: iso,
      validTill: iso,
      paymentTrialGranted: updatedBy.indexOf('auto_trial')===0,
      paymentTrialDays: trialDays,
      firstLoginAt: base.toISOString(), // fresh start after rejoin
      updatedAt: base.toISOString(),
      paymentUpdatedBy: updatedBy,
      forceFreshLogin: null,
      // New managers: full trial roster capacity (Admin can lower later)
      teamSize: parseInt(src.teamSize,10) || 200,
      maxMembers: parseInt(src.maxMembers,10) || 200,
      planMaxMembers: parseInt(src.planMaxMembers,10) || 200,
      planPeriod: src.planPeriod || 'monthly',
      planLabel: src.planLabel || ('Monthly · Up to '+(parseInt(src.teamSize,10)||200)+' members')
    };
    try{
      await fbSet('paymentStatus/'+phone, Object.assign({}, payload, { mobile: phone, phone: phone }));
    }catch(e){ console.warn('[payTrial] paymentStatus write', e && e.message); }
    try{
      await fbUpdate('mobileUsers/'+phone, payload);
    }catch(e){ console.warn('[payTrial] mobileUsers write', e && e.message); }
    try{
      if(window._cache && window._cache.mobileUsers && window._cache.mobileUsers[phone]){
        Object.assign(window._cache.mobileUsers[phone], payload);
      }
    }catch(e){}
    return payload;
  }catch(e){
    console.warn('[payTrial]', e && e.message);
    return null;
  }
}

async function _hydrateUserPaymentStatus(){
  try{
    if(!SESSION || !SESSION.mobile) return;
    const phone = (typeof _normMobileKey==='function'?_normMobileKey(SESSION.mobile):String(SESSION.mobile||'').replace(/\D/g,'').slice(-10));
    if(!phone) return;
    let mu = await fbGet('mobileUsers/'+phone).catch(()=>null);
    if(!mu){
      // try scan by normalized phone
      try{
        const all = await fbGet('mobileUsers').catch(()=>null) || {};
        for(const [k,v] of Object.entries(all)){
          if(!v) continue;
          const uk = (typeof _normMobileKey==='function'?_normMobileKey(v.mobile||v.phone||k):String(k).replace(/\D/g,'').slice(-10));
          if(uk===phone){ mu = v; break; }
        }
      }catch(e){}
    }
    // Also load paymentStatus/{phone} (admin may save here when mobileUsers write is denied)
    let ps = null;
    try{ ps = await fbGet('paymentStatus/'+phone).catch(()=>null); }catch(e){}

    // New mobile number → paidUntil = first login + 30 days (once)
    try{
      const trial = await _ensureNewUserPaymentTrial(phone, mu, ps);
      if(trial){
        ps = Object.assign({}, ps || {}, trial);
        mu = Object.assign({}, mu || {}, trial);
      }
    }catch(e){}

    // Merge sources; prefer LATEST access date across paymentPaidUntil / paidUntil / validTill
    const src = Object.assign({}, mu || {}, ps || {});
    if(mu || ps){
      const dateCands = [
        src.paymentPaidUntil, src.paidUntil, src.paymentPaidUntilDate, src.validTill,
        mu && mu.paymentPaidUntil, mu && mu.paidUntil, mu && mu.validTill,
        ps && ps.paymentPaidUntil, ps && ps.paidUntil, ps && ps.validTill
      ];
      let bestIso = null, bestTs = 0;
      dateCands.forEach(function(c){
        if(!c) return;
        const d = new Date(c);
        if(isNaN(d.getTime())) return;
        if(d.getTime() >= bestTs){ bestTs = d.getTime(); bestIso = (typeof c === 'string' ? c : d.toISOString()); }
      });
      if(bestIso){
        SESSION.paymentPaidUntil = bestIso;
        SESSION.paidUntil = bestIso;
        SESSION.validTill = bestIso;
        window._userPaymentPaidUntil = bestIso;
        window._userValidTill = bestIso;
      } else {
        SESSION.paymentPaidUntil = null;
        SESSION.paidUntil = null;
        window._userPaymentPaidUntil = null;
      }
      const amt = parseInt(src.paymentAmount || src.subscriptionAmount || 0, 10);
      SESSION.paymentAmount = (amt > 0) ? amt : null;
      window._userPaymentAmount = SESSION.paymentAmount;
    } else {
      SESSION.paymentPaidUntil = null;
      window._userPaymentPaidUntil = null;
      SESSION.paymentAmount = null;
      window._userPaymentAmount = null;
    }

    // v6.0.52: Individuals use ONLY their own paid-until (Admin sets on their mobile).
    // Active members under a live manager may still inherit manager paid-until into SESSION for gate checks.
    try{
      const st = String((mu && mu.status) || SESSION.status || '').toLowerCase();
      const ind = !!(SESSION.individual || (mu && mu.individual) || st === 'individual' || st === 'left_team' || st === 'left'
        || ((SESSION.role === 'member' || SESSION.role === 'worker') && !SESSION.managerId && !(mu && (mu.managerId || mu.managerMobile))));
      if(ind){
        // Prefer paymentStatus/{phone} then mobileUsers own fields only — already merged above as src
        // If nothing set, leave null so paywall + trial grant can apply
        SESSION.paymentSource = 'self';
      } else {
        // Under manager: if own date missing/expired, inherit live manager paid-until for gate only
        const mid = (typeof _normMobileKey==='function')
          ? _normMobileKey(SESSION.managerId || (mu && (mu.managerId||mu.managerMobile)) || '')
          : String(SESSION.managerId || '').replace(/\D/g,'').slice(-10);
        const until = SESSION.paymentPaidUntil || SESSION.paidUntil;
        let ownOk = false;
        if(until){
          const d = new Date(until);
          ownOk = !isNaN(d.getTime()) && d.getTime() >= Date.now();
        }
        if(!ownOk && mid && mid.length === 10){
          let mgr = null;
          try{ mgr = await fbGet('mobileUsers/'+mid); }catch(e){}
          if(!mgr){ try{ mgr = await fbGet('paymentStatus/'+mid); }catch(e){} }
          if(mgr && String(mgr.role||'').toLowerCase()==='manager' && mgr.status !== 'removed'){
            const mr = mgr.paymentPaidUntil || mgr.paidUntil || mgr.validTill;
            if(mr){
              const md = new Date(mr);
              if(!isNaN(md.getTime()) && md.getTime() >= Date.now()){
                SESSION.paymentPaidUntil = typeof mr === 'string' ? mr : md.toISOString();
                SESSION.paidUntil = SESSION.paymentPaidUntil;
                SESSION.validTill = SESSION.paymentPaidUntil;
                window._userPaymentPaidUntil = SESSION.paymentPaidUntil;
                SESSION.paymentSource = 'manager_inherit';
              }
            }
          }
        }
      }
    }catch(eInd){}

    await _loadPaymentSettings(false);
  }catch(e){}
}
try{
  // Best-effort: run after app start
  if(typeof window !== 'undefined'){
    setTimeout(()=>{ try{ _hydrateUserPaymentStatus(); }catch(e){} }, 2500);
  }
}catch(e){}


