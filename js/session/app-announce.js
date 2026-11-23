/**
 * Man Power — Admin Announce (v6.0.50)
 * Admin posts message / link / video to one or more registered mobiles.
 * Targets receive an in-app popup and can react (ack / like / ok).
 */
(function(){
  'use strict';

  function _L(hi, en){
    try{ if(typeof L==='function') return L(hi, en); }catch(e){}
    return en || hi;
  }
  function _norm(p){
    if(typeof _normMobileKey==='function') return _normMobileKey(p||'');
    return String(p||'').replace(/\D/g,'').slice(-10);
  }
  function _esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Admin compose UI ──
  window.openAdminAnnounce = function openAdminAnnounce(){
    if(typeof isAdmin==='function' && !isAdmin()){
      try{ toast(_L('❌ सिर्फ Admin','❌ Admin only')); }catch(e){}
      return;
    }
    const html = ''
      + '<div class="modal-handle"></div>'
      + '<div class="modal-title">📢 '+_L('Announce','Announce')+'</div>'
      + '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px;line-height:1.45">'
      + _L('Message / link / video link लिखें। एक या कई registered mobiles पर popup जाएगा।','Write message / link / video. Popup goes to one or more registered mobiles.')
      + '</div>'
      + '<label style="font-size:11px;font-weight:800;color:var(--muted2)">'+_L('Message','Message')+'</label>'
      + '<textarea id="annMsg" class="inp-field" rows="4" placeholder="'+_L('अपना announcement लिखें…','Write your announcement…')+'" style="width:100%;margin:6px 0 12px;box-sizing:border-box;resize:vertical"></textarea>'
      + '<label style="font-size:11px;font-weight:800;color:var(--muted2)">'+_L('Link (optional)','Link (optional)')+'</label>'
      + '<input id="annLink" class="inp-field" type="url" placeholder="https://…" style="width:100%;margin:6px 0 12px;box-sizing:border-box">'
      + '<label style="font-size:11px;font-weight:800;color:var(--muted2)">'+_L('Video link (optional)','Video link (optional)')+'</label>'
      + '<input id="annVideo" class="inp-field" type="url" placeholder="https://youtube.com/… or direct mp4" style="width:100%;margin:6px 0 12px;box-sizing:border-box">'
      + '<label style="font-size:11px;font-weight:800;color:var(--muted2)">'+_L('Target mobiles (comma / space / newline)','Target mobiles (comma / space / newline)')+'</label>'
      + '<textarea id="annMobiles" class="inp-field" rows="3" placeholder="9876543210, 9123456789" style="width:100%;margin:6px 0 8px;box-sizing:border-box;resize:vertical"></textarea>'
      + '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
      + '<button type="button" class="cancel-btn" style="flex:1;min-width:120px" onclick="window._annFillAllManagers&&window._annFillAllManagers()">'+_L('All Managers','All Managers')+'</button>'
      + '<button type="button" class="cancel-btn" style="flex:1;min-width:120px" onclick="window._annFillAllUsers&&window._annFillAllUsers()">'+_L('All Users','All Users')+'</button>'
      + '</div>'
      + '<button type="button" class="submit-btn" style="background:linear-gradient(135deg,#6366f1,#4f46e5)" onclick="window._annPost&&window._annPost()">'
      + '📢 '+_L('Post Announce','Post Announce')+'</button>'
      + '<button type="button" class="cancel-btn" style="margin-top:8px" onclick="closeModal()">'+_L('बंद करें','Close')+'</button>';
    if(typeof openModal==='function') openModal(html);
  };

  window._annFillAllManagers = async function(){
    try{
      const mu = (window._cache && _cache.mobileUsers) || (typeof fbGet==='function' ? await fbGet('mobileUsers') : {}) || {};
      const list = [];
      Object.entries(mu).forEach(function([k,u]){
        if(!u) return;
        if(String(u.role||'').toLowerCase()!=='manager') return;
        if(u.status==='removed'||u.status==='revoked') return;
        const n = _norm(u.mobile||u.phone||k);
        if(n.length===10) list.push(n);
      });
      const el = document.getElementById('annMobiles');
      if(el) el.value = Array.from(new Set(list)).join(', ');
      try{ toast(_L(list.length+' managers',' '+list.length+' managers')); }catch(e){}
    }catch(e){ console.warn('[announce] fill managers', e); }
  };

  window._annFillAllUsers = async function(){
    try{
      const mu = (window._cache && _cache.mobileUsers) || (typeof fbGet==='function' ? await fbGet('mobileUsers') : {}) || {};
      const list = [];
      Object.entries(mu).forEach(function([k,u]){
        if(!u) return;
        if(u.status==='removed'||u.status==='revoked'||u.role==='removed') return;
        const n = _norm(u.mobile||u.phone||k);
        if(n.length===10) list.push(n);
      });
      const el = document.getElementById('annMobiles');
      if(el) el.value = Array.from(new Set(list)).join(', ');
      try{ toast(_L(list.length+' users',' '+list.length+' users')); }catch(e){}
    }catch(e){ console.warn('[announce] fill users', e); }
  };

  window._annPost = async function(){
    if(typeof isAdmin==='function' && !isAdmin()){
      try{ toast(_L('❌ सिर्फ Admin','❌ Admin only')); }catch(e){}
      return;
    }
    const msg = (document.getElementById('annMsg') && document.getElementById('annMsg').value || '').trim();
    const link = (document.getElementById('annLink') && document.getElementById('annLink').value || '').trim();
    const video = (document.getElementById('annVideo') && document.getElementById('annVideo').value || '').trim();
    const raw = (document.getElementById('annMobiles') && document.getElementById('annMobiles').value || '');
    const mobiles = Array.from(new Set(
      raw.split(/[\s,;]+/).map(_norm).filter(function(n){ return n && n.length===10; })
    ));
    if(!msg && !link && !video){
      try{ toast(_L('⚠️ Message या link लिखें','⚠️ Write a message or link')); }catch(e){}
      return;
    }
    if(!mobiles.length){
      try{ toast(_L('⚠️ कम से कम एक mobile डालें','⚠️ Enter at least one mobile')); }catch(e){}
      return;
    }
    try{
      if(typeof _ensureWriteAuth==='function'){
        try{ await _ensureWriteAuth(); }catch(e){}
      }
      const now = new Date().toISOString();
      const annId = 'ann_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
      const payload = {
        id: annId,
        message: msg,
        link: link || null,
        video: video || null,
        targets: mobiles,
        createdAt: now,
        createdBy: (typeof SESSION!=='undefined' && (SESSION.name||SESSION.mobile)) || 'admin',
        reactions: {}
      };
      // Global record for admin history
      // Announcement history is optional: inbox delivery must not be blocked by
      // an older Firebase ruleset that lacks the announcements node.
      let historySaved = false;
      if(typeof fbSet==='function'){
        try { await fbSet('announcements/'+annId, payload); historySaved = true; }
        catch(historyErr){ console.warn('[announce] history unavailable; delivering inbox notifications',historyErr); }
      }
      // Per-user inbox (popup source)
      let ok = 0;
      for(var i=0;i<mobiles.length;i++){
        var m = mobiles[i];
        try{
          await fbPush('userNotifications/'+m, {
            type: 'announce',
            announcementId: annId,
            title: '📢 '+_L('Announcement','Announcement'),
            body: msg || link || video || '',
            link: link || null,
            video: video || null,
            read: false,
            needsPopup: true,
            at: now,
            from: payload.createdBy
          });
          ok++;
        }catch(e){ console.warn('[announce] push', m, e); }
      }
      if(!ok){
        try{ toast(_L('❌ Announcement delivery failed. Check Firebase permissions.','❌ Announcement delivery failed. Check Firebase permissions.')); }catch(e){}
        return;
      }
      try{ closeModal(); }catch(e){}
      try{ toast('📢 Delivered to '+ok+' / '+mobiles.length+' users'+(historySaved?'':' (history not saved)')); }catch(e){}
    }catch(err){
      console.error('[announce] post', err);
      try{ toast(L('❌ ','❌ ')+(err.message||L('पोस्ट विफल','Post failed'))); }catch(e){}
    }
  };

  // ── Client: show popup for unread announce notifications ──
  var _annShown = {};

  function _showAnnouncePopup(n, pathKey){
    if(!n || n.type!=='announce') return;
    var id = n.announcementId || n.at || pathKey;
    if(_annShown[id]) return;
    _annShown[id] = true;

    var body = _esc(n.body || '');
    var linkHtml = n.link
      ? '<div style="margin:10px 0"><a href="'+_esc(n.link)+'" target="_blank" rel="noopener" style="color:#818cf8;font-weight:700;word-break:break-all">🔗 '+_esc(n.link)+'</a></div>'
      : '';
    var videoHtml = n.video
      ? '<div style="margin:10px 0"><a href="'+_esc(n.video)+'" target="_blank" rel="noopener" style="color:#f472b6;font-weight:700;word-break:break-all">🎬 '+_esc(n.video)+'</a></div>'
      : '';

    var html = ''
      + '<div class="modal-handle"></div>'
      + '<div class="modal-title">📢 '+_L('Announcement','Announcement')+'</div>'
      + '<div style="font-size:14px;color:var(--text);line-height:1.55;margin-bottom:8px;white-space:pre-wrap">'+body+'</div>'
      + linkHtml + videoHtml
      + '<div style="font-size:11px;color:var(--muted2);margin-bottom:14px">'
      + _esc(n.from || '')+(n.at ? ' · '+new Date(n.at).toLocaleString() : '')
      + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<button type="button" class="submit-btn" style="flex:1;min-width:90px;background:linear-gradient(135deg,#22c55e,#16a34a)" onclick="window._annReact && window._annReact(\''+_esc(id)+'\',\'ack\',\''+_esc(pathKey||'')+'\')">✅ '+_L('OK / Acknowledge','OK / Acknowledge')+'</button>'
      + '<button type="button" class="cancel-btn" style="flex:1;min-width:90px" onclick="window._annReact && window._annReact(\''+_esc(id)+'\',\'like\',\''+_esc(pathKey||'')+'\')">👍 '+_L('Like','Like')+'</button>'
      + '<button type="button" class="cancel-btn" style="flex:1;min-width:90px" onclick="closeModal()">'+_L('बाद में','Later')+'</button>'
      + '</div>';
    if(typeof openModal==='function') openModal(html);
  }

  window._annReact = async function(annId, reaction, notifPath){
    try{
      var mob = _norm((typeof SESSION!=='undefined' && (SESSION.mobile||SESSION.uid)) || '');
      if(annId && mob && typeof fbUpdate==='function'){
        try{
          await fbUpdate('announcements/'+annId+'/reactions/'+mob, {
            reaction: reaction || 'ack',
            at: new Date().toISOString(),
            name: (typeof SESSION!=='undefined' && SESSION.name) || ''
          });
        }catch(e){}
      }
      // Mark notification read
      if(mob && notifPath && typeof fbUpdate==='function'){
        try{ await fbUpdate('userNotifications/'+mob+'/'+notifPath, { read: true, needsPopup: false, reacted: reaction||'ack' }); }catch(e){}
      } else if(mob && typeof fbGet==='function'){
        // best-effort: find by announcementId
        try{
          var list = await fbGet('userNotifications/'+mob) || {};
          Object.entries(list).forEach(function([k,v]){
            if(v && v.announcementId===annId){
              fbUpdate('userNotifications/'+mob+'/'+k, { read:true, needsPopup:false, reacted: reaction||'ack' }).catch(function(){});
            }
          });
        }catch(e){}
      }
      try{ closeModal(); }catch(e){}
      try{ toast(reaction==='like' ? '👍' : '✅'); }catch(e){}
    }catch(err){ console.warn('[announce] react', err); try{ closeModal(); }catch(e){} }
  };

  function _scanAndShow(list, basePath){
    if(!list || typeof list!=='object') return;
    Object.entries(list).forEach(function([k,v]){
      if(!v || v.type!=='announce') return;
      if(v.read===true || v.needsPopup===false) return;
      _showAnnouncePopup(v, k);
    });
  }

  function _startAnnounceListener(){
    try{
      if(typeof SESSION==='undefined' || !SESSION) return;
      var mob = _norm(SESSION.mobile||SESSION.uid||'');
      if(!mob || mob.length!==10) return;
      if(typeof fbListen!=='function') return;
      fbListen('userNotifications/'+mob, function(v){
        _scanAndShow(v, 'userNotifications/'+mob);
      });
    }catch(e){ console.warn('[announce] listen', e); }
  }

  // Boot after session ready
  if(typeof document!=='undefined'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(_startAnnounceListener, 2500);
    });
  }
  // Also expose manual check
  window._annCheck = function(){
    try{
      var mob = _norm((SESSION&&SESSION.mobile)||'');
      if(!mob||typeof fbGet!=='function') return;
      fbGet('userNotifications/'+mob).then(function(v){ _scanAndShow(v); });
    }catch(e){}
  };
})();
