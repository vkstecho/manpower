(() => {
  'use strict';
  const primary='[data-enter-action], button[type="submit"], button.submit-btn, button.wd-primary, button.big-btn';
  const destructive=/\b(?:delete|remove|archive|reset|clear|reject|discard|cancel|logout)|हटाएँ|हटाएं|मिटाएँ/i;
  const visible=node=>node && !node.closest('[hidden],[inert]') && !!node.getClientRects().length &&
    getComputedStyle(node).visibility!=='hidden';
  const safe=node=>visible(node) && !node.disabled && node.getAttribute('aria-disabled')!=='true' &&
    !node.matches('[data-destructive],.danger,.wd-delete') &&
    !destructive.test((node.textContent || '')+' '+(node.getAttribute('onclick') || ''));
  const activated=new WeakMap();
  document.addEventListener('keydown',event=>{
    if (event.key!=='Enter' || event.isComposing || event.keyCode===229) return;
    const target=event.target;
    if (!(target instanceof HTMLElement)) return;
    const confirmation=document.querySelector('[data-mp-confirm]');
    if (confirmation) {
      if (!target.matches('[data-confirm-cancel]')) event.preventDefault();
      return;
    }
    if (target.matches('button') && !safe(target)) {
      if (target.matches('[data-destructive],.danger,.wd-delete') || destructive.test((target.getAttribute('onclick') || '')+' '+target.textContent))
        event.preventDefault();
      return;
    }
    const editor=target.closest('[contenteditable="true"],textarea');
    if (editor) {
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        if (editor.matches('.wd-block-notes')) { event.preventDefault(); if(!event.repeat) window.wdSave?.(); }
        else if (editor.id==='wnBody') { event.preventDefault(); if(!event.repeat) window.wnSave?.(); }
        else if (editor.id==='wcNotes') { event.preventDefault(); if(!event.repeat) window.wcSave?.(); }
      }
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || !target.matches('input:not([type="checkbox"],[type="radio"],[type="button"],[type="file"],[type="range"],[type="color"]), select')) return;
    if (event.repeat) { event.preventDefault(); return; }
    if (!visible(target)) return;
    const modal=document.querySelector('#overlay.open #modalBody .modal');
    if (modal && !modal.contains(target)) { event.preventDefault(); return; }
    const nativeForm=target.form || target.closest('form');
    const workArea=target.closest('#wnEditor,#wcEditor,[data-enter-scope]');
    const scope=nativeForm || workArea || modal || target.closest('.login-card,.tab.on');
    if (!scope) return;
    if (target.matches('input[type="search"]') && !nativeForm && target.id==='wnSearch') return;
    const marked=[...scope.querySelectorAll('[data-enter-action]')].filter(visible);
    const candidates=marked.length?marked:[...scope.querySelectorAll(primary)].filter(visible);
    const explicit=target.id==='loginMobile' ? document.getElementById('sendOtpBtn') : null;
    const button=explicit || (candidates.length===1 ? candidates[0] : null);
    if (!button) return;
    event.preventDefault();
    if (!safe(button) || (activated.get(button) || 0)>Date.now()-450) return;
    for (const field of scope.querySelectorAll('input,select')) {
      if (visible(field) && field.willValidate && !field.reportValidity()) return;
    }
    activated.set(button,Date.now());
    if (nativeForm && button.type==='submit') nativeForm.requestSubmit(button);
    else button.click();
  },true);
})();
