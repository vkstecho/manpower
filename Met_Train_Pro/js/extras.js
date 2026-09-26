// Met Train PRO — Extras (toast, search, SOS, progress, bookmarks, cert, PDF viewer)
// ══════════════════════════════════════════════════════
// v6 — LOAD PERSISTED STATE
// ══════════════════════════════════════════════════════

// Load persisted state
(function loadPersistedState(){
  // PRO unlock
  if(true) window._proUnlocked = true;
  // Language
  var savedLang = mtLoad('lang', null);
  if(savedLang && savedLang !== LANG){ setLang(savedLang); }
  // Checklist now handled by date-aware system (loadCKData)
  // Quiz best score
  window._bestScore = mtLoad('bestQuizScore', null);
  // Visited modules
  window._visitedModules = mtLoad('visitedModules', {});
  // Bookmarks
  window._bookmarks = mtLoad('bookmarks', []);
  // Study time (in seconds)
  window._studyTime = mtLoad('studyTime', 0);
})();

// Persist PRO unlock
// Pro content always unlocked - no payment needed
window._proUnlocked = true;

// Persist language
var _origSetLang = setLang;
setLang = function(l){
  _origSetLang(l);
  mtSave('lang', l);
};

// Checklist persistence now built into date-aware system

// ══════════════════════════════════════════════════════
// v6 — TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════
function showToast(msg, type, duration){
  type = type || 'success';
  duration = duration || 2500;
  var c = document.getElementById('toastContainer');
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  var icos = {success:'✅', warning:'⚠️', info:'ℹ️'};
  t.innerHTML = '<span style="font-size:16px;flex-shrink:0">' + (icos[type]||'') + '</span>' + msg;
  c.appendChild(t);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.classList.add('show'); }); });
  setTimeout(function(){
    t.classList.remove('show');
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 300);
  }, duration);
}

// ══════════════════════════════════════════════════════
// v6 — SEARCH ENGINE
// ══════════════════════════════════════════════════════
var SEARCH_INDEX = [];
function buildSearchIndex(){
  // SOP/WI items
  var sopCodes = Object.keys(SOP_DETAIL);
  sopCodes.forEach(function(code){
    var d = SOP_DETAIL[code];
    SEARCH_INDEX.push({
      title: code + ' — ' + d.title,
      cat: d.scope || 'SOP/WI',
      keywords: (code + ' ' + d.title + ' ' + (d.resp||[]).join(' ')).toLowerCase(),
      action: function(){ showSOPDetail(code); }
    });
  });

  // Module pages
  var pages = [
    {id:'met', title:'मेटलाइज़र ऑपरेशन', cat:'मॉड्यूल', kw:'metallizer metalliser vacuum chamber boat roll operation'},
    {id:'slit', title:'स्लिटर ऑपरेशन', cat:'मॉड्यूल', kw:'slitter blade cork tape grading customer'},
    {id:'safety', title:'सुरक्षा एवं GMP', cat:'मॉड्यूल', kw:'safety ppe helmet goggles al dust fire gmp hygiene'},
    {id:'sops', title:'SOPs एवं WIs', cat:'मॉड्यूल', kw:'sop wi work instruction standard operating procedure'},
    {id:'sap', title:'SAP प्रविष्टि', cat:'Plant Ops', kw:'sap cor1 zpp_metjumbo zpp_slit transaction production entry'},
    {id:'maint', title:'रखरखाव (PM)', cat:'Plant Ops', kw:'maintenance pm preventive daily weekly monthly quarterly'},
    {id:'genmet', title:'वैक्युम मेटलाइज़ेशन सिद्धांत', cat:'धाकड़ ज्ञान', kw:'vacuum metallisation pvd theory optical density od pinhole'},
    {id:'genslit', title:'स्लिटिंग तकनीक', cat:'धाकड़ ज्ञान', kw:'slitting technique blade tension ripple telescoping'},
    {id:'terms', title:'औद्योगिक शब्दावली', cat:'धाकड़ ज्ञान', kw:'terms glossary 5s tpm kaizen lean oee kpi smed fifo pdca six sigma'},
    {id:'quiz', title:'ज्ञान परीक्षा', cat:'मूल्यांकन', kw:'quiz test exam knowledge check mcq'},
    {id:'check', title:'प्री-स्टार्ट चेकलिस्ट', cat:'मूल्यांकन', kw:'checklist pre start safety machine material process setup'},
  ];
  pages.forEach(function(p){
    SEARCH_INDEX.push({
      title: p.title,
      cat: p.cat,
      keywords: (p.title + ' ' + p.kw).toLowerCase(),
      action: function(){ nav(p.id); }
    });
  });

  // Industrial terms
  var termKeywords = [
    {term:'SOP', desc:'Standard Operating Procedure'},
    {term:'WI', desc:'Work Instruction'},
    {term:'GMP', desc:'Good Manufacturing Practice'},
    {term:'KPI', desc:'Key Performance Indicator'},
    {term:'5S', desc:'Sort Set Shine Standardise Sustain'},
    {term:'TPM', desc:'Total Productive Maintenance'},
    {term:'OEE', desc:'Overall Equipment Effectiveness'},
    {term:'Kaizen', desc:'Continuous Improvement सतत सुधार'},
    {term:'Lean', desc:'Waste elimination अपव्यय रहित'},
    {term:'Muda', desc:'Waste अपव्यय'},
    {term:'Gemba', desc:'Real Place Shop Floor'},
    {term:'SMED', desc:'Single Minute Exchange of Die'},
    {term:'Poka-Yoke', desc:'Mistake Proofing'},
    {term:'Andon', desc:'Visual Alert System'},
    {term:'PDCA', desc:'Plan Do Check Act'},
    {term:'Six Sigma', desc:'3.4 DPMO Quality'},
    {term:'FIFO', desc:'First In First Out'},
    {term:'Kanban', desc:'Visual Scheduling Pull System'},
  ];
  termKeywords.forEach(function(t){
    SEARCH_INDEX.push({
      title: t.term + ' — ' + t.desc,
      cat: 'शब्दावली',
      keywords: (t.term + ' ' + t.desc).toLowerCase(),
      action: function(){ nav('terms'); }
    });
  });
}

function openSearch(){
  buildSearchIndex();
  var ov = document.getElementById('searchOverlay');
  ov.classList.add('open');
  setTimeout(function(){ document.getElementById('searchInput').focus(); }, 100);
}
function closeSearch(){
  document.getElementById('searchOverlay').classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '<div class="search-hint">कम से कम 2 अक्षर टाइप करें...</div>';
}

document.getElementById('searchInput').addEventListener('input', function(){
  var q = this.value.trim().toLowerCase();
  var rEl = document.getElementById('searchResults');
  if(q.length < 2){
    rEl.innerHTML = '<div class="search-hint">कम से कम 2 अक्षर टाइप करें...</div>';
    return;
  }
  var results = SEARCH_INDEX.filter(function(item){
    return item.keywords.indexOf(q) !== -1 || item.title.toLowerCase().indexOf(q) !== -1;
  }).slice(0, 12);

  if(!results.length){
    rEl.innerHTML = '<div class="search-hint">कोई परिणाम नहीं मिला। अलग शब्द आज़माएं।</div>';
    return;
  }
  rEl.innerHTML = results.map(function(r, i){
    return '<div class="search-result" onclick="SEARCH_INDEX_ACTIONS['+i+']()">'
      +'<div class="search-result-cat">'+r.cat+'</div>'
      +'<div class="search-result-title">'+r.title+'</div>'
      +'</div>';
  }).join('');
  // Store actions
  window.SEARCH_INDEX_ACTIONS = results.map(function(r){ return function(){ closeSearch(); r.action(); }; });
});

// Keyboard shortcut
document.addEventListener('keydown', function(e){
  if((e.ctrlKey || e.metaKey) && e.key === 'k'){ e.preventDefault(); openSearch(); }
  if(e.key === 'Escape'){
    closeSearch();
    closeSOS();
  }
});

// ══════════════════════════════════════════════════════
// v6 — SOS EMERGENCY PANEL
// ══════════════════════════════════════════════════════
var _sosOpen = false;
function toggleSOS(){
  _sosOpen = !_sosOpen;
  document.getElementById('sosPanel').classList.toggle('open', _sosOpen);
}
function closeSOS(){
  _sosOpen = false;
  document.getElementById('sosPanel').classList.remove('open');
}
// Hide SOS on landing
function updateSOSVisibility(){
  var show = CUR !== 'landing';
  document.getElementById('sosBtn').style.display = show ? 'flex' : 'none';
  if(!show) closeSOS();
}

// ══════════════════════════════════════════════════════
// v6 — MODULE PROGRESS TRACKING
// ══════════════════════════════════════════════════════
function trackModuleVisit(id){
  if(id === 'landing' || id === 'home') return;
  if(!window._visitedModules[id]){
    window._visitedModules[id] = { firstVisit: Date.now(), visits: 0 };
  }
  window._visitedModules[id].visits++;
  window._visitedModules[id].lastVisit = Date.now();
  mtSave('visitedModules', window._visitedModules);
}

function getProgressHTML(){
  var modules = [
    {id:'met',ico:'⚡',name:'मेटलाइज़र'},
    {id:'slit',ico:'✂️',name:'स्लिटर'},
    {id:'safety',ico:'🦺',name:'सुरक्षा'},
    {id:'sops',ico:'📋',name:'SOPs'},
    {id:'quiz',ico:'📝',name:'परीक्षा'},
    {id:'check',ico:'✅',name:'चेकलिस्ट'},
  ];
  if(MODE==='free'){
    modules.push({id:'sap',ico:'💻',name:'SAP'});
    modules.push({id:'maint',ico:'🛠️',name:'PM'});
  }
  var visited = window._visitedModules || {};
  var total = modules.length, done = 0;
  var cardsH = modules.map(function(m){
    var v = visited[m.id];
    if(v) done++;
    var status = v ? '✓ पढ़ा — ' + v.visits + ' बार' : '— अभी नहीं पढ़ा';
    return '<div class="progress-card' + (v?' visited':'') + '" style="--pc:var(--gold);cursor:pointer" onclick="nav(\''+m.id+'\')">'
      +'<div class="pc-ico">' + m.ico + '</div>'
      +'<div class="pc-name">' + m.name + '</div>'
      +'<div class="pc-status' + (v?' done':'') + '">' + status + '</div>'
      +'</div>';
  }).join('');

  var pct = total ? Math.round(done/total*100) : 0;
  var bestH = '';
  if(window._bestScore){
    bestH = '<div class="stat"><div class="stat-v" style="color:'+(window._bestScore.pct>=70?'var(--green)':'var(--red)')+'">'+window._bestScore.pct+'%</div><div class="stat-l">सर्वश्रेष्ठ स्कोर</div></div>';
  }
  var studyMins = Math.round((window._studyTime || 0) / 60);

  return '<div style="margin-bottom:18px">'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--gold);margin-bottom:10px">📊 मेरी प्रगति — Learning Progress</div>'
    +'<div class="stats">'
    +'<div class="stat"><div class="stat-v">'+pct+'%</div><div class="stat-l">मॉड्यूल पूर्ण</div></div>'
    +'<div class="stat"><div class="stat-v">'+done+'/'+total+'</div><div class="stat-l">पढ़े गए</div></div>'
    + bestH
    +'<div class="stat"><div class="stat-v">'+studyMins+'</div><div class="stat-l">मिनट अध्ययन</div></div>'
    +'</div>'
    +'<div class="progress-grid">' + cardsH + '</div>'
    +'</div>';
}

// ══════════════════════════════════════════════════════
// v6 — BOOKMARKS
// ══════════════════════════════════════════════════════
function toggleBookmark(code, title){
  var bm = window._bookmarks || [];
  var idx = bm.findIndex(function(b){ return b.code === code; });
  if(idx >= 0){
    bm.splice(idx, 1);
    showToast('बुकमार्क हटाया: ' + code, 'info');
  } else {
    bm.push({code: code, title: title || code, time: Date.now()});
    showToast('बुकमार्क जोड़ा: ' + code, 'success');
  }
  window._bookmarks = bm;
  mtSave('bookmarks', bm);
  // Re-render current page to update bookmark buttons
  var pg = document.getElementById('pg-' + CUR);
  if(pg){ delete pg.dataset.r; renderPage(CUR, pg); }
}

function isBookmarked(code){
  return (window._bookmarks || []).some(function(b){ return b.code === code; });
}

function getBookmarksStripHTML(){
  var bm = window._bookmarks || [];
  if(!bm.length) return '';
  var h = bm.map(function(b){
    return '<div class="bm-chip" onclick="showSOPDetail(\''+b.code+'\')">'
      +'⭐ ' + b.code
      +'<span class="bm-x" onclick="event.stopPropagation();toggleBookmark(\''+b.code+'\')">✕</span>'
      +'</div>';
  }).join('');
  return '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">⭐ बुकमार्क</div>'
    +'<div class="bm-strip">' + h + '</div>';
}

// ══════════════════════════════════════════════════════
// v6 — STUDY TIMER
// ══════════════════════════════════════════════════════
var _studyInterval = null;
function startStudyTimer(){
  if(_studyInterval) return;
  _studyInterval = setInterval(function(){
    window._studyTime = (window._studyTime || 0) + 1;
    if(window._studyTime % 30 === 0){
      mtSave('studyTime', window._studyTime);
    }
    // Update timer display
    var el = document.getElementById('studyTimerDisplay');
    if(el){
      var m = Math.floor(window._studyTime / 60);
      var s = window._studyTime % 60;
      el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
  }, 1000);
}
function stopStudyTimer(){
  if(_studyInterval){ clearInterval(_studyInterval); _studyInterval = null; }
  mtSave('studyTime', window._studyTime || 0);
}

// ══════════════════════════════════════════════════════
// v6 — CERTIFICATE
// ══════════════════════════════════════════════════════
var _certData = null;
function showCertificate(score, total){
  _certData = {score: score, total: total, pct: Math.round(score/total*100)};
  document.getElementById('certScoreVal').textContent = _certData.pct + '%';
  document.getElementById('certDetail').textContent = score + ' / ' + total + ' सही — मेटलाइज़ेशन, स्लिटिंग, सुरक्षा, औद्योगिक ज्ञान';
  var now = new Date();
  document.getElementById('certDate').textContent = 'दिनांक: ' + now.toLocaleDateString('hi-IN') + ' | Met Train PRO v7';
  document.getElementById('certModal').classList.add('open');
  // Restore name from storage
  var savedName = mtLoad('certName', '');
  document.getElementById('certNameInput').value = savedName;
}
function closeCert(){
  document.getElementById('certModal').classList.remove('open');
}
function downloadCert(){
  var name = document.getElementById('certNameInput').value.trim() || 'Operator';
  mtSave('certName', name);
  var now = new Date();
  var dateStr = now.toLocaleDateString('hi-IN');

  // Generate SVG-based certificate
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">'
    +'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient>'
    +'<linearGradient id="border" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f0a500"/><stop offset="50%" stop-color="#25d366"/><stop offset="100%" stop-color="#f0a500"/></linearGradient></defs>'
    +'<rect width="800" height="560" rx="20" fill="url(#bg)"/>'
    +'<rect x="4" y="4" width="792" height="552" rx="18" fill="none" stroke="url(#border)" stroke-width="3" opacity=".6"/>'
    +'<text x="400" y="80" text-anchor="middle" font-size="60" font-family="sans-serif" fill="#f0a500">&#x1F3C6;</text>'
    +'<text x="400" y="130" text-anchor="middle" font-size="32" font-weight="900" font-family="sans-serif" fill="#f0a500" letter-spacing="4">CERTIFICATE</text>'
    +'<text x="400" y="160" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#aaa">Met Train PRO — Vacuum Metallisation Training</text>'
    +'<line x1="200" y1="185" x2="600" y2="185" stroke="#f0a500" stroke-width="1" opacity=".4"/>'
    +'<text x="400" y="225" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#aaa">This is to certify that</text>'
    +'<text x="400" y="270" text-anchor="middle" font-size="28" font-weight="700" font-family="sans-serif" fill="#ffffff">' + name.replace(/[<>&"']/g,'') + '</text>'
    +'<line x1="250" y1="285" x2="550" y2="285" stroke="#f0a500" stroke-width="1" opacity=".4"/>'
    +'<text x="400" y="325" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#aaa">has successfully completed the Knowledge Assessment</text>'
    +'<text x="400" y="375" text-anchor="middle" font-size="48" font-weight="900" font-family="monospace" fill="#25d366">' + _certData.pct + '%</text>'
    +'<text x="400" y="405" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#aaa">' + _certData.score + ' / ' + _certData.total + ' correct answers</text>'
    +'<text x="400" y="440" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#666">Metallisation · Slitting · Safety · Industrial Knowledge</text>'
    +'<text x="400" y="500" text-anchor="middle" font-size="11" font-family="monospace" fill="#555">Date: ' + dateStr + ' | © VKS TECH — Vacuum Metallisation Knowledge Platform</text>'
    +'</svg>';

  var blob = new Blob([svg], {type: 'image/svg+xml'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'MetTrainPRO_Certificate_' + name.replace(/\s+/g,'_') + '.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('प्रमाण पत्र डाउनलोड हो गया!', 'success');
}

// ══════════════════════════════════════════════════════
// v6 — PATCH EXISTING FUNCTIONS
// ══════════════════════════════════════════════════════

// Patch nav to track visits, update SOS, start timer
var _navV6 = nav;
nav = function(id){
  _navV6(id);
  trackModuleVisit(id);
  updateSOSVisibility();
  if(id !== 'landing'){
    startStudyTimer();
  }
};

// Patch rHome to include progress dashboard and bookmarks
var _origRHome = rHome;
rHome = function(pg){
  _origRHome(pg);
  // Prepend progress and bookmarks after the banner/header
  var bannerEnd = pg.innerHTML.indexOf('<div class="cards">');
  if(bannerEnd > 0){
    var progressHTML = getProgressHTML() + getBookmarksStripHTML();
    pg.innerHTML = pg.innerHTML.slice(0, bannerEnd) + progressHTML + pg.innerHTML.slice(bannerEnd);
  }
  pg.dataset.r = '1';
};

// Patch showScore to persist best score and show certificate
var _origShowScore = showScore;
showScore = function(){
  _origShowScore();
  var pct = Math.round(qState.score / qState.set.length * 100);
  var pass = pct >= 70;
  // Save best score
  if(!window._bestScore || pct > window._bestScore.pct){
    window._bestScore = {pct: pct, score: qState.score, total: qState.set.length, date: Date.now()};
    mtSave('bestQuizScore', window._bestScore);
    if(pass) showToast('🎉 नया सर्वश्रेष्ठ स्कोर: ' + pct + '%!', 'success', 3000);
  }
  // Show certificate button if passed
  if(pass){
    var sb = document.getElementById('scorebox');
    if(sb && !sb.querySelector('.cert-trigger')){
      var certBtn = document.createElement('button');
      certBtn.className = 'btn btn-p cert-trigger';
      certBtn.style.cssText = 'margin-top:12px;background:linear-gradient(135deg,#f0a500,#e06030)';
      certBtn.innerHTML = '🏆 प्रमाण पत्र प्राप्त करें';
      certBtn.onclick = function(){ showCertificate(qState.score, qState.set.length); };
      var retryBtn = sb.querySelector('.btn-p');
      if(retryBtn) retryBtn.parentNode.insertBefore(certBtn, retryBtn);
    }
  }
};

// Patch showSOPDetail to add bookmark buttons
var _origShowSOPDetail = showSOPDetail;
showSOPDetail = function(code){
  _origShowSOPDetail(code);
  // Add bookmark button to the page
  var pg = document.getElementById('pg-sops');
  if(pg && SOP_DETAIL[code]){
    var bmSaved = isBookmarked(code);
    var bmHTML = '<button class="bm-btn' + (bmSaved ? ' saved' : '') + '" onclick="toggleBookmark(\'' + code + '\',\'' + SOP_DETAIL[code].title.replace(/'/g,"\\'") + '\')" title="बुकमार्क">' + (bmSaved ? '⭐' : '☆') + '</button>';
    var ph = pg.querySelector('.ph');
    if(ph){
      ph.style.position = 'relative';
      ph.insertAdjacentHTML('beforeend', bmHTML);
    }
  }
};

// Add search button to topbar
(function addSearchToTopbar(){
  var langsWrap = document.getElementById('tb-langs-wrap');
  if(langsWrap){
    var searchBtn = document.createElement('button');
    searchBtn.className = 'tb-search';
    searchBtn.innerHTML = '🔍';
    searchBtn.onclick = openSearch;
    searchBtn.title = 'खोजें (Ctrl+K)';
    langsWrap.parentNode.insertBefore(searchBtn, langsWrap);
  }
})();

// Add study timer to topbar
(function addStudyTimerToTopbar(){
  var langsWrap = document.getElementById('tb-langs-wrap');
  if(langsWrap){
    var timerDiv = document.createElement('div');
    timerDiv.className = 'study-timer';
    timerDiv.innerHTML = '<span class="dot"></span><span id="studyTimerDisplay">00:00</span>';
    langsWrap.parentNode.insertBefore(timerDiv, langsWrap);
    // Show accumulated time on load
    var m = Math.floor((window._studyTime||0) / 60);
    var s = (window._studyTime||0) % 60;
    document.getElementById('studyTimerDisplay').textContent = (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }
})();

// Hide SOS on landing initially
updateSOSVisibility();

// Welcome toast
setTimeout(function(){
  var visited = Object.keys(window._visitedModules || {}).length;
  if(visited > 0){
    showToast('वापसी पर स्वागत! ' + visited + ' मॉड्यूल पढ़े हैं।', 'info', 3000);
  }
}, 800);

// Save study time on page unload
window.addEventListener('beforeunload', function(){
  stopStudyTimer();
  mtSave('studyTime', window._studyTime || 0);
});

// Re-render home on every visit to show latest progress
var _navV6b = nav;
nav = function(id){
  if(id === 'home'){
    var pg = document.getElementById('pg-home');
    if(pg) delete pg.dataset.r;
  }
  _navV6b(id);
};


// ══════════════════════════════════════════════════════
// PDF VIEWER MODAL
// ══════════════════════════════════════════════════════
(function(){
  var m=document.createElement('div');
  m.id='pdfModal';m.className='pdf-modal';
  m.innerHTML='<div class="pdf-topbar"><span class="pdf-title" id="pdfTitle">Loading...</span><button class="pdf-btn" onclick="pdfNav(-1)">◀ Prev</button><span class="pdf-nav-info" id="pdfPageInfo">1/1</span><button class="pdf-btn" onclick="pdfNav(1)">Next ▶</button><button class="pdf-btn" onclick="window.open(_pdfUrl,\'_blank\')">⬇️ Download</button><button class="pdf-btn close" onclick="closePDF()">✕ बंद</button></div><div class="pdf-body" id="pdfBody"><div class="pdf-loading">Loading PDF...</div></div>';
  document.body.appendChild(m);
})();
var _pdfDoc=null,_pdfPage=1,_pdfUrl='';
function openPDF(filename,title){
  _pdfUrl='https://glmsmp.vercel.app/MetExp/'+encodeURIComponent(filename);
  document.getElementById('pdfTitle').textContent=title||filename;
  document.getElementById('pdfModal').classList.add('open');
  document.getElementById('pdfBody').innerHTML='<div class="pdf-loading">📄 Loading PDF...<br><span style="font-size:12px;color:#666">'+filename+'</span></div>';
  _pdfPage=1;
  if(window.pdfjsLib){
    pdfjsLib.getDocument(_pdfUrl).promise.then(function(pdf){
      _pdfDoc=pdf;
      document.getElementById('pdfPageInfo').textContent='1/'+pdf.numPages;
      renderPDFPage(1);
    }).catch(function(e){
      document.getElementById('pdfBody').innerHTML='<div class="pdf-loading" style="color:#f28b82">❌ PDF load failed<br><span style="font-size:12px">'+escH(e.message)+'</span><br><br><a href="'+_pdfUrl+'" target="_blank" style="color:#25d366">🔗 Open in new tab</a></div>';
    });
  } else {
    document.getElementById('pdfBody').innerHTML='<div class="pdf-loading">PDF.js not loaded.<br><a href="'+_pdfUrl+'" target="_blank" style="color:#25d366">🔗 Open in new tab</a></div>';
  }
}
function renderPDFPage(num){
  if(!_pdfDoc)return;
  _pdfDoc.getPage(num).then(function(page){
    var vp=page.getViewport({scale:1});
    var maxW=Math.min(window.innerWidth-20,900);
    var scale=maxW/vp.width;
    var scaledVP=page.getViewport({scale:scale});
    var canvas=document.createElement('canvas');
    canvas.width=scaledVP.width;canvas.height=scaledVP.height;
    var ctx=canvas.getContext('2d');
    page.render({canvasContext:ctx,viewport:scaledVP}).promise.then(function(){
      document.getElementById('pdfBody').innerHTML='';
      document.getElementById('pdfBody').appendChild(canvas);
      document.getElementById('pdfPageInfo').textContent=num+'/'+_pdfDoc.numPages;
    });
  });
}
function pdfNav(dir){
  if(!_pdfDoc)return;
  var n=_pdfPage+dir;
  if(n<1||n>_pdfDoc.numPages)return;
  _pdfPage=n;renderPDFPage(n);
}
function closePDF(){
  document.getElementById('pdfModal').classList.remove('open');
  _pdfDoc=null;
  document.getElementById('pdfBody').innerHTML='';
}

// ══════════════════════════════════════════════════════
// OEM MANUAL DATABASE — 296 PDFs Categorized
// ══════════════════════════════════════════════════════
