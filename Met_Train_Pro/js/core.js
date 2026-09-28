// Met Train PRO — Core (nav, mode, landing, utilities)
var MODE='free',LANG='hi',CUR='home';
var qState={q:0,score:0,set:[]};
var ckState={};
var _tc=0;

// Sidebar labels per language

/** Met Train string helper — uses SB_LABELS then English */
function mtT(key){
  var L = SB_LABELS[LANG]||SB_LABELS.en||SB_LABELS.hi||{};
  if(L[key]) return L[key];
  if(SB_LABELS.en && SB_LABELS.en[key]) return SB_LABELS.en[key];
  if(SB_LABELS.hi && SB_LABELS.hi[key]) return SB_LABELS.hi[key];
  return key;
}
var SB_LABELS={
  hi:{home:'होम',met:'Metalliser',slit:'Slitter',safety:'सुरक्षा प्रशिक्षण',sops:'SOPs & WIs',sap:'SAP Entry',maint:'रखरखाव (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'औद्योगिक शब्दावली',quiz:'ज्ञान परीक्षा',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plan',s1:'संचालन',s2:'प्रशिक्षण मॉड्यूल',s3:'🔥 धाकड़ ज्ञान',s4:'मूल्यांकन'},
  en:{home:'Home',met:'Metalliser',slit:'Slitter',safety:'Safety & GMP',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Maintenance (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Industrial Terms',quiz:'Knowledge Check',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Operations',s2:'Training Modules',s3:'🔥 Dhakad Gyaan',s4:'Assessment'},
  gu:{home:'હોમ',met:'Metalliser',slit:'Slitter',safety:'સુરક્ષા',sops:'SOPs & WIs',sap:'SAP Entry',maint:'જાળવણી (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'ઔદ્યોગિક શબ્દો',quiz:'જ્ઞાન પરીક્ષા',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'સંચાલન',s2:'તાલીમ મોડ્યુલ',s3:'🔥 Dhakad Gyaan',s4:'મૂલ્યાંકન'},
  ta:{home:'முகப்பு',met:'Metalliser',slit:'Slitter',safety:'பாதுகாப்பு',sops:'SOPs & WIs',sap:'SAP Entry',maint:'பராமரிப்பு (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'தொழில் சொற்கள்',quiz:'அறிவுத் தேர்வு',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'செயல்பாடு',s2:'பயிற்சி',s3:'🔥 Dhakad Gyaan',s4:'மதிப்பீடு'},
  te:{home:'హోమ్',met:'Metalliser',slit:'Slitter',safety:'భద్రత',sops:'SOPs & WIs',sap:'SAP Entry',maint:'నిర్వహణ (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'పారిశ్రామిక పదాలు',quiz:'జ్ఞాన పరీక్ష',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'ఆపరేషన్స్',s2:'శిక్షణ',s3:'🔥 Dhakad Gyaan',s4:'మూల్యాంకనం'},
  kn:{home:'ಹೋಮ್',met:'Metalliser',slit:'Slitter',safety:'ಸುರಕ್ಷತೆ',sops:'SOPs & WIs',sap:'SAP Entry',maint:'ನಿರ್ವಹಣೆ (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'ಕೈಗಾರಿಕಾ ಪದಗಳು',quiz:'ಜ್ಞಾನ ಪರೀಕ್ಷೆ',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'ಕಾರ್ಯಾಚರಣೆ',s2:'ತರಬೇತಿ',s3:'🔥 Dhakad Gyaan',s4:'ಮೌಲ್ಯಮಾಪನ'},
  bn:{home:'হোম',met:'Metalliser',slit:'Slitter',safety:'নিরাপত্তা',sops:'SOPs & WIs',sap:'SAP Entry',maint:'রক্ষণাবেক্ষণ (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'শিল্প শব্দ',quiz:'জ্ঞান পরীক্ষা',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'অপারেশন',s2:'প্রশিক্ষণ',s3:'🔥 Dhakad Gyaan',s4:'মূল্যায়ন'},
  or:{home:'ହୋମ',met:'Metalliser',slit:'Slitter',safety:'ସୁରକ୍ଷା',sops:'SOPs & WIs',sap:'SAP Entry',maint:'ରକ୍ଷଣାବେକ୍ଷଣ (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'ଶିଳ୍ପ ଶବ୍ଦ',quiz:'ଜ୍ଞାନ ପରୀକ୍ଷା',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'ସଞ୍ଚାଳନ',s2:'ତାଲିମ',s3:'🔥 Dhakad Gyaan',s4:'ମୂଲ୍ୟାଙ୍କନ'},
  ar:{home:'الرئيسية',met:'Metalliser',slit:'Slitter',safety:'السلامة',sops:'SOPs & WIs',sap:'SAP Entry',maint:'الصيانة (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'مصطلحات صناعية',quiz:'اختبار المعرفة',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'التشغيل',s2:'التدريب',s3:'🔥 Dhakad Gyaan',s4:'التقييم'},
  ur:{home:'ہوم',met:'Metalliser',slit:'Slitter',safety:'سیفٹی',sops:'SOPs & WIs',sap:'SAP Entry',maint:'مینٹیننس (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'صنعتی اصطلاحات',quiz:'علمی ٹیسٹ',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'آپریشنز',s2:'ٹریننگ',s3:'🔥 Dhakad Gyaan',s4:'تشخیص'},
  zh:{home:'首页',met:'Metalliser',slit:'Slitter',safety:'安全培训',sops:'SOPs & WIs',sap:'SAP Entry',maint:'维护 (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'工业术语',quiz:'知识测验',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'操作',s2:'培训模块',s3:'🔥 Dhakad Gyaan',s4:'评估'},
  de:{home:'Start',met:'Metalliser',slit:'Slitter',safety:'Sicherheit & GMP',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Wartung (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Fachbegriffe',quiz:'Wissenstest',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Betrieb',s2:'Schulung',s3:'🔥 Dhakad Gyaan',s4:'Bewertung'},
  it:{home:'Home',met:'Metalliser',slit:'Slitter',safety:'Sicurezza',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Manutenzione (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Termini industriali',quiz:'Verifica conoscenze',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Operazioni',s2:'Formazione',s3:'🔥 Dhakad Gyaan',s4:'Valutazione'},
  es:{home:'Inicio',met:'Metalliser',slit:'Slitter',safety:'Seguridad',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Mantenimiento (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Términos industriales',quiz:'Prueba de conocimientos',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Operaciones',s2:'Formación',s3:'🔥 Dhakad Gyaan',s4:'Evaluación'},
  tr:{home:'Ana Sayfa',met:'Metalliser',slit:'Slitter',safety:'Güvenlik',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Bakım (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Endüstriyel terimler',quiz:'Bilgi testi',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Operasyonlar',s2:'Eğitim',s3:'🔥 Dhakad Gyaan',s4:'Değerlendirme'},
  pt:{home:'Início',met:'Metalliser',slit:'Slitter',safety:'Segurança',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Manutenção (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Termos industriais',quiz:'Teste de conhecimento',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Operações',s2:'Treinamento',s3:'🔥 Dhakad Gyaan',s4:'Avaliação'},
  th:{home:'หน้าหลัก',met:'Metalliser',slit:'Slitter',safety:'ความปลอดภัย',sops:'SOPs & WIs',sap:'SAP Entry',maint:'บำรุงรักษา (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'คำศัพท์อุตสาหกรรม',quiz:'ทดสอบความรู้',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'การดำเนินงาน',s2:'การฝึกอบรม',s3:'🔥 Dhakad Gyaan',s4:'การประเมิน'},
  id:{home:'Beranda',met:'Metalliser',slit:'Slitter',safety:'Keselamatan',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Pemeliharaan (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Istilah industri',quiz:'Tes pengetahuan',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Operasi',s2:'Pelatihan',s3:'🔥 Dhakad Gyaan',s4:'Penilaian'},
  vi:{home:'Trang chủ',met:'Metalliser',slit:'Slitter',safety:'An toàn',sops:'SOPs & WIs',sap:'SAP Entry',maint:'Bảo trì (PM)',genmet:'Vacuum Metallisation',genslit:'Slitting Technique',terms:'Thuật ngữ công nghiệp',quiz:'Kiểm tra kiến thức',check:'Pre-Start Checklist',askai:'AI Expert',manuals:'OEM Manuals',defect:'Defect Action Plans',s1:'Vận hành',s2:'Đào tạo',s3:'🔥 Dhakad Gyaan',s4:'Đánh giá'}
};

function lb(k){
  var L=SB_LABELS[LANG]||SB_LABELS.en||SB_LABELS.hi;
  if(L && L[k]) return L[k];
  if(SB_LABELS.en && SB_LABELS.en[k]) return SB_LABELS.en[k];
  if(SB_LABELS.hi && SB_LABELS.hi[k]) return SB_LABELS.hi[k];
  return k;
}

var SB_CFG=[
  {s:'s2',items:[{id:'home',ico:'🏠'},{id:'defect',ico:'🔴'},{id:'askai',ico:'🤖'},{id:'met',ico:'⚡'},{id:'slit',ico:'✂️'},{id:'safety',ico:'🦺'},{id:'sops',ico:'📋'}]},
  {s:'s1',items:[{id:'sap',ico:'💻',gls:1},{id:'maint',ico:'🛠️',gls:1}]},
  {s:'s3',items:[{id:'genmet',ico:'🔬'},{id:'genslit',ico:'🔧'},{id:'terms',ico:'📚'},{id:'manuals',ico:'📖'}]},
  {s:'s4',items:[{id:'quiz',ico:'📝'},{id:'check',ico:'✅'}]}
];
function renderSB(){
  var h='';
  SB_CFG.forEach(function(sec){
    var si='';
    sec.items.forEach(function(it){
      if(it.gls&&MODE!=='free')return;
      si+='<div class="sb-item'+(CUR===it.id?' on':'')+'" onclick="nav(\''+it.id+'\')"><span class="ico">'+it.ico+'</span><span>'+lb(it.id)+'</span>'+(it.gls?'<span class="sb-dot"></span>':'')+'</div>';
    });
    if(si)h+='<div class="sb-sec"><div class="sb-lbl">'+lb(sec.s)+'</div>'+si+'</div>';
  });
  document.getElementById('sidebar').innerHTML=h;
}
function nav(id){
  CUR=id;
  document.querySelectorAll('.pg').forEach(function(p){
    p.classList.remove('on');
    p.style.cssText='';
  });
  var pg=document.getElementById('pg-'+id);
  if(!pg)return;
  pg.classList.add('on');
  // AI Chatbox = full screen
  if(id==='askai'){document.body.classList.add('ai-fullscreen');}
  else{document.body.classList.remove('ai-fullscreen');}
  if(!pg.dataset.r)renderPage(id,pg);
  renderSB();
  renderMobNav();
  updateTopbar();
  applyLangChrome();
  try{ document.getElementById('content').scrollTo(0,0); }catch(e){}
}
function setMode(m){
  MODE=m;
  if(m==='gen'&&(CUR==='sap'||CUR==='maint'))CUR='home';
  clearR();nav(CUR);
  renderMobNav();
  updateTopbar();
}

// ── Light / Dark theme ──
function getTheme(){
  try{ return localStorage.getItem('mt_theme') || 'dark'; }catch(e){ return 'dark'; }
}
function applyTheme(t){
  t = (t==='light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.body.classList.toggle('light', t==='light');
  try{ localStorage.setItem('mt_theme', t); }catch(e){}
  var btn = document.getElementById('tb-theme-btn');
  if(btn){
    btn.textContent = t==='light' ? '🌙' : '☀️';
    btn.setAttribute('aria-label', t==='light' ? 'Dark mode' : 'Light mode');
    btn.title = t==='light' ? 'Dark mode' : 'Light mode';
  }
  try{
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', t==='light' ? '#f4f6f8' : '#111111');
  }catch(e){}
}
function toggleTheme(){
  applyTheme(getTheme()==='light' ? 'dark' : 'light');
}
function setCountry(c){
  c = mtSetCountry(c || 'IN');
  var langs = mtLangsForCountry(c);
  var cur = LANG;
  var ok = langs.some(function(x){ return x.code===cur; });
  if(!ok) cur = mtDefaultLangForCountry(c);
  renderLangButtons();
  var sel = document.getElementById('tb-country');
  if(sel) sel.value = c;
  setLang(cur, true);
}
function renderLangButtons(){
  var wrap = document.getElementById('tb-langs-wrap');
  if(!wrap) return;
  var c = mtGetCountry();
  var langs = mtLangsForCountry(c);
  wrap.innerHTML = langs.map(function(L){
    var on = (L.code===LANG) ? ' on' : '';
    return '<button type="button" class="lb'+on+'" data-lang="'+L.code+'" onclick="setLang(\''+L.code+'\')" title="'+L.title+'">'+L.label+'</button>';
  }).join('');
}
function setLang(l, silent){
  var c = mtGetCountry();
  var langs = mtLangsForCountry(c);
  var allowed = {};
  langs.forEach(function(x){ allowed[x.code]=1; });
  // Always allow hi/en as fallback
  allowed.hi=1; allowed.en=1;
  if(!allowed[l]) l = mtDefaultLangForCountry(c);
  LANG=l;
  mtSetLang(l);
  applyLangChrome();
  renderLangButtons();
  clearR();
  if(CUR){ nav(CUR); }
  else { renderSB(); if(typeof renderMobNav==='function') renderMobNav(); updateTopbar(); }
  if(!silent){
    try{
      var title = l;
      langs.forEach(function(x){ if(x.code===l) title=x.title; });
      var msg='🌐 '+title;
      if(typeof showToast==='function') showToast(msg);
    }catch(e){}
  }
}
function applyLangChrome(){
  document.documentElement.setAttribute('lang', LANG||'en');
  document.documentElement.setAttribute('dir', (LANG==='ar'||LANG==='ur') ? 'rtl' : 'ltr');
  document.body.classList.toggle('lang-en', LANG==='en');
  document.body.classList.toggle('lang-hi', LANG==='hi');
  document.body.setAttribute('data-lang', LANG||'en');
  // Language buttons: match by data-lang (reliable)
  document.querySelectorAll('.lb').forEach(function(b){
    var code=b.getAttribute('data-lang')||'';
    if(!code){
      var t=b.textContent.trim();
      var map={'हिं':'hi','EN':'en','ଓ':'or','த':'ta','తె':'te','ไท':'th'};
      code=map[t]||'';
      if(code) b.setAttribute('data-lang', code);
    }
    b.classList.toggle('on', code===LANG);
  });
  // Back button label
  var back=document.getElementById('tb-back-btn');
  if(back){
    var backMap={hi:'← वापस',en:'← Back',gu:'← પાછા',ta:'← பின்',te:'← వెనుక',kn:'← ಹಿಂದೆ',bn:'← ফিরে',or:'← ପଛକୁ',ar:'← رجوع',ur:'← واپس',zh:'← 返回',de:'← Zurück',it:'← Indietro',es:'← Atrás',tr:'← Geri',pt:'← Voltar',th:'← กลับ',id:'← Kembali',vi:'← Quay lại'};
    back.textContent = backMap[LANG]||backMap.en;
  }
  // Apply bilingual swap on visible content
  applyBilingualContent(document.getElementById('content')||document.body);

  // Translate [data-mt-key] using SB_LABELS / mtT
  try{
    document.querySelectorAll('[data-mt-key]').forEach(function(el){
      var k = el.getAttribute('data-mt-key');
      if(k && typeof mtT==='function') el.textContent = mtT(k);
    });
  }catch(e){}

}
/** Swap Hindi + <span class="en"> blocks when LANG is en */
function applyBilingualContent(root){
  if(!root) return;
  // Multi-lang: if LANG not hi/en, prefer English blocks already in HTML

  var nodes=root.querySelectorAll('.fs, .st, .ph-desc, .card-desc, .ban-txt, .lock-txt, .gdesc');
  nodes.forEach(function(el){
    var enEl=el.querySelector('.en');
    if(!enEl) return;
    if(!el.getAttribute('data-mt-hi')){
      el.setAttribute('data-mt-hi', el.innerHTML);
      el.setAttribute('data-mt-en', enEl.textContent||enEl.innerHTML);
    }
    if(LANG==='hi'){
      el.innerHTML=el.getAttribute('data-mt-hi');
    } else {
      // English or any other language: prefer English dual text (clean, not mixed)
      el.innerHTML='<span class="en-as-main">'+el.getAttribute('data-mt-en')+'</span>';
    }
  });
  // Page titles with optional data-en
  root.querySelectorAll('[data-en]').forEach(function(el){
    if(!el.getAttribute('data-mt-hi-title')) el.setAttribute('data-mt-hi-title', el.innerHTML);
    if(LANG==='hi') el.innerHTML=el.getAttribute('data-mt-hi-title');
    else el.innerHTML=el.getAttribute('data-en');
  });
}

function clearR(){document.querySelectorAll('.pg').forEach(function(p){delete p.dataset.r;});}
// ── HTML helpers ──
function Al(type,ico,txt){return '<div class="alert '+type+'"><span class="ai">'+ico+'</span><div>'+txt+'</div></div>';}
function S(n,h,b){return '<li class="step"><div class="sn'+(b?' b':'')+'">'+n+'</div><div class="st">'+h+'</div></li>';}
function F(n,t2,d){return '<div class="fi"><div class="fn">'+n+'</div><div class="fb"><div class="ft">'+t2+'</div><div class="fs">'+d+'</div></div></div>';}
function G(num,name,desc,col){return '<div class="gc" style="--gc:'+col+'"><div class="gn">'+num+'</div><div class="gname">'+name+'</div><div class="gdesc">'+desc+'</div></div>';}
function Lock(){
  if(MODE==='free') return '';
  var hi = (LANG==='hi');
  return '<div class="lock"><div class="lock-ico">🔒</div><div class="lock-title">'+(hi?'क्षेत्र — प्रतिबंधित':'Restricted Area')+'</div><div class="lock-txt">'+(hi?'यह जानकारी प्लांट ऑपरेशंस मोड में उपलब्ध है। कृपया फ्री मोड चुनें।':'This content is available in Plant Operations mode. Please switch to Free mode.')+'</div><button class="btn btn-p" onclick="enterFree()">'+(hi?'फ्री मोड चुनें':'Go to Free Mode')+'</button></div>';
}
function GENLock(){return '';}
function CB(ico,title,sub,body,open){
  var id='cb'+(++_tc);
  return '<div class="cb"><div class="cb-h'+(open?' open':'')+'" onclick="tCB(this,\''+id+'\')"><span class="cb-ico">'+ico+'</span><div class="cb-title">'+title+'</div><span class="cb-sub">'+sub+'</span><span class="cb-arr'+(open?' open':'')+'">▼</span></div><div class="cb-body'+(open?' open':'')+'" id="'+id+'">'+body+'</div></div>';
}
function Tabs(tabs,panels){
  var uid='t'+(++_tc);
  var th=tabs.map(function(t,i){return '<button class="tab'+(i===0?' on':'')+'" onclick="tTab(this,\''+uid+'\','+i+')">'+t+'</button>';}).join('');
  var ph=panels.map(function(p,i){return '<div class="tabp'+(i===0?' on':'')+'" id="'+uid+'_'+i+'">'+p+'</div>';}).join('');
  return '<div class="tabs">'+th+'</div>'+ph;
}
function tCB(el,id){
  el.classList.toggle('open');el.querySelector('.cb-arr').classList.toggle('open');
  var b=document.getElementById(id);if(b)b.classList.toggle('open');
}
function tTab(btn,uid,i){
  btn.closest('.tabs').querySelectorAll('.tab').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');
  btn.parentNode.parentNode.querySelectorAll('.tabp').forEach(function(p){if(p.id&&p.id.startsWith(uid+'_'))p.classList.toggle('on',p.id===uid+'_'+i);});
}

/** Page header — Hindi only when LANG=hi, else pure English (no mixed scripts). */
function phHeader(codeHi, titleHi, descHi, codeEn, titleEn, descEn){
  if(LANG==='hi'){
    return '<div class="ph"><div class="ph-code">'+codeHi+'</div><div class="ph-title">'+titleHi+'</div><div class="ph-desc">'+descHi+'</div></div>';
  }
  return '<div class="ph"><div class="ph-code">'+codeEn+'</div><div class="ph-title">'+titleEn+'</div><div class="ph-desc">'+descEn+'</div></div>';
}

function renderPage(id,pg){
  pg.dataset.r='1';
  if(id==='landing')rLanding(pg);
  else if(id==='home')rHome(pg);else if(id==='met')rMet(pg);else if(id==='slit')rSlit(pg);
  else if(id==='safety')rSafety(pg);else if(id==='sops')rSOPs(pg);else if(id==='sap')rSAP(pg);
  else if(id==='maint')rMaint(pg);else if(id==='genmet')rGenMet(pg);else if(id==='genslit')rGenSlit(pg);
  else if(id==='terms')rTerms(pg);else if(id==='quiz')rQuiz(pg);else if(id==='check')rCheck(pg);
  else if(id==='askai')rAskAI(pg);
  else if(id==='manuals')rManuals(pg);
  else if(id==='defect')rDefect(pg);
}

// ══════════════════════════════════════════════════════
// LANDING PAGE — Entry Screen
// ══════════════════════════════════════════════════════
function rLanding(pg){
  var hi = (LANG==='hi');
  // Pure Hindi OR pure English — no mixed phrases
  var sub = hi
    ? 'मेटलाइज़र प्रशिक्षण — OD · Vacuum · Defects · SOPs'
    : 'Metalliser training — OD · Vacuum · Defects · SOPs';
  var pick = hi ? 'शिफ्ट से पहले अपना मोड चुनें' : 'Choose your mode before the shift';
  var empTitle = hi ? 'कर्मचारी' : 'Employee';
  var empSub = hi
    ? 'ऑपरेटर / सुपरवाइज़र — Defect · SOP · PM · SAP · Quiz'
    : 'Operator / Supervisor — Defect · SOP · PM · SAP · Quiz';
  var freeBadge = hi ? '✓ फ्री' : '✓ FREE';
  var dhakTitle = hi ? 'धाकड़ ज्ञान' : 'Dhakad Gyaan';
  var dhakSub = hi
    ? 'उद्योग ज्ञान — Vacuum Metallisation · Slitting · Terms'
    : 'Industry knowledge — Vacuum Metallisation · Slitting · Terms';
  var defSub = hi
    ? '16 defects — Low OD, Pinholes, Wrinkles — चरणबद्ध समाधान'
    : '16 defects — Low OD, Pinholes, Wrinkles — step-by-step fixes';
  var aiTitle = hi ? 'AI विशेषज्ञ' : 'AI Expert';
  var aiSub = hi
    ? 'मेटलाइज़र प्रश्न पूछें — हिंदी या English में उत्तर'
    : 'Ask metalliser questions — answers in clear English';

  function modeBtn(onclick, grad, border, iconBg, icon, titleColor, title, sub, badgeBg, badgeBorder, badgeColor, arrowColor){
    return '<button type="button" onclick="'+onclick+'" style="width:100%;max-width:420px;background:'+grad+';border:2px solid '+border+';border-radius:18px;padding:20px 18px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:14px;transition:all .2s;margin-bottom:16px;font-family:inherit">'
      +'<div style="width:56px;height:56px;border-radius:14px;background:'+iconBg+';display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">'+icon+'</div>'
      +'<div style="flex:1">'
      +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:20px;font-weight:900;color:'+titleColor+';margin-bottom:3px;text-transform:uppercase;letter-spacing:.03em">'+title+'</div>'
      +'<div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.5;font-family:inherit">'+sub+'</div>'
      +'<div style="margin-top:8px;display:inline-block;background:'+badgeBg+';border:1px solid '+badgeBorder+';border-radius:6px;padding:3px 10px;font-size:12px;font-weight:900;color:'+badgeColor+'">'+freeBadge+'</div>'
      +'</div>'
      +'<div style="font-size:26px;color:'+arrowColor+'">›</div>'
      +'</button>';
  }

  pg.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:calc(100vh - 120px);padding:24px 16px 20px;overflow-y:auto">'
    +'<div style="text-align:center;margin-bottom:30px;width:100%">'
    +'<img src="assets/logo-icon.svg" alt="Met Train PRO" width="76" height="76" style="display:block;margin:0 auto 16px;border-radius:18px;box-shadow:0 0 40px rgba(37,211,102,.3)">'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:36px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#fff;line-height:1">Met Train <span style="color:#f0a500">PRO</span></div>'
    +'<div style="font-size:14px;color:#506070;margin-top:6px;font-family:inherit">'+sub+'</div>'
    +'<div style="width:60px;height:3px;background:linear-gradient(90deg,#f0a500,#e06030);border-radius:2px;margin:14px auto 0"></div>'
    +'</div>'
    +'<div style="font-size:15px;color:rgba(204,216,232,.45);text-align:center;margin-bottom:24px;font-family:inherit">'+pick+'</div>'
    +modeBtn('enterFree()',
      'linear-gradient(135deg,rgba(24,201,122,.15),rgba(24,201,122,.06))','rgba(24,201,122,.5)',
      'linear-gradient(135deg,rgba(24,201,122,.3),rgba(24,201,122,.1))','🏭','#18c97a',
      empTitle, empSub,
      'rgba(24,201,122,.2)','rgba(24,201,122,.4)','#18c97a','rgba(24,201,122,.6)')
    +modeBtn('enterGen()',
      'linear-gradient(135deg,rgba(240,165,0,.15),rgba(240,165,0,.06))','rgba(240,165,0,.5)',
      'linear-gradient(135deg,rgba(240,165,0,.3),rgba(240,165,0,.1))','🔥','#f0a500',
      dhakTitle, dhakSub,
      'rgba(240,165,0,.2)','rgba(240,165,0,.4)','#f0a500','rgba(240,165,0,.6)')
    +modeBtn('enterDefect()',
      'linear-gradient(135deg,rgba(229,57,53,.2),rgba(198,40,40,.08))','rgba(229,57,53,.5)',
      'linear-gradient(135deg,rgba(229,57,53,.35),rgba(198,40,40,.15))','🔴','#e53935',
      'Defect Action Plans', defSub,
      'rgba(24,201,122,.2)','rgba(24,201,122,.4)','#18c97a','rgba(229,57,53,.5)')
    +modeBtn('enterFreeAI()',
      'linear-gradient(135deg,rgba(139,92,246,.18),rgba(109,40,217,.08))','rgba(139,92,246,.5)',
      'linear-gradient(135deg,rgba(139,92,246,.3),rgba(109,40,217,.12))','🤖','#a78bfa',
      aiTitle, aiSub,
      'rgba(139,92,246,.2)','rgba(139,92,246,.4)','#a78bfa','rgba(139,92,246,.5)')
    +'</div>';
}



function enterGen(){
  window._proUnlocked = true;
  MODE = 'gen';
  clearR();
  nav('home');
  updateTopbar();
}
function enterDefect(){
  MODE = 'free';
  clearR();
  nav('defect');
  updateTopbar();
}

function enterFree(){
  MODE='free';
  window._proUnlocked = true;
  clearR();
  nav('home');
  updateTopbar();
}

function enterFreeAI(){
  MODE='free';
  clearR();
  nav('askai');
  updateTopbar();
}

function backToLanding(){
  clearR();
  nav('landing');
  updateTopbar();
}

function goHome(){
  if(CUR==='landing') return;
  nav('home');
  updateTopbar();
}

// Update topbar dynamically
function pageName(id){
  return lb(id) || id;
}
function updateTopbar(){
  var onLanding = (CUR==='landing');
  var labelEl  = document.getElementById('tb-mode-label');
  var chipEl   = document.getElementById('tb-mode-chip');
  var titleEl  = document.getElementById('tb-page-title');
  var backBtn  = document.getElementById('tb-back-btn');
  var logoEl   = document.getElementById('tbLogo');

  if(onLanding){
    if(backBtn)  backBtn.style.display  = 'none';
    if(labelEl)  labelEl.style.display  = 'none';
    if(logoEl)   logoEl.style.display   = 'flex';
  } else {
    if(backBtn)  backBtn.style.display  = 'block';
    if(labelEl)  labelEl.style.display  = 'flex';
    if(logoEl)   logoEl.style.display   = 'none';
    if(chipEl){
      if(MODE==='free'){
        chipEl.textContent = 'FREE';
        chipEl.style.cssText = 'font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;font-family:\'Share Tech Mono\',monospace;letter-spacing:.06em;text-transform:uppercase;flex-shrink:0;background:rgba(24,201,122,.15);border:1px solid rgba(24,201,122,.4);color:#18c97a';
      } else {
        chipEl.textContent = (LANG==='hi') ? '🔥 धाकड़' : '🔥 DHAKAD';
        chipEl.style.cssText = 'font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;font-family:\'Mukta\',sans-serif;letter-spacing:.03em;flex-shrink:0;background:rgba(240,165,0,.15);border:1px solid rgba(240,165,0,.4);color:#f0a500';
      }
    }
    if(titleEl) titleEl.textContent = pageName(CUR) || '';
  }
}

// ══════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════

function _homeCards(){
  // Full English card set (technical terms always English)
  var en = [
    {id:'defect',ico:'🔴',t:'Defect Action Plans',d:'Low OD? Pinhole? Web break? — #1 cause + step-by-step fix in 30 seconds.',cc:'#e53935',m:'16 Action Plans'},
    {id:'quiz',ico:'📝',t:'Knowledge Check',d:'50 MCQ — Process · Safety · GMP · 5S. 10 minutes before shift.',cc:'var(--orange)',m:'50 Questions'},
    {id:'met',ico:'⚡',t:'Metalliser Operation',d:'Chamber · Boat · Wire · OD · Plasma · Drum — AlBond / CPP / AlOx floor knowledge.',cc:'var(--gold)',m:'8 Topics'},
    {id:'slit',ico:'✂️',t:'Slitter Operation',d:'Machine setup, blade, cork tape, critical customer, grading and joints.',cc:'var(--cyan)',m:'7 Topics'},
    {id:'safety',ico:'🦺',t:'Safety & GMP',d:'Al dust + water = fire risk. PPE · LOTO · Moving parts — mandatory for every operator.',cc:'var(--red)',m:'Mandatory'},
    {id:'sops',ico:'📋',t:'SOPs & WIs',d:'10 SOPs, 25+ WIs, 15+ Formats — full metallisation and slitting document library.',cc:'var(--blue)',m:'25+ Documents'},
    {id:'terms',ico:'📚',t:'Industrial Terms',d:'SOP, WI, 5S, TPM 8 Pillars, Kaizen, KPI, OEE, Lean — clear explanations.',cc:'var(--purple)',m:'50+ Terms'},
    {id:'check',ico:'✅',t:'Pre-Start Checklist',d:'27 points before shift start — Safety · Machine · Material. Tick and do not forget.',cc:'var(--green)',m:'27 Points'},
    {id:'manuals',ico:'📖',t:'OEM Manual Library',d:'296 Equipment Manuals — Drives, PLC, Sensors, Pumps, Bearings — read in PDF viewer.',cc:'var(--blue)',m:'296 PDF Manuals'}
  ];
  if(LANG!=='hi'){
    // Non-Hindi: full English cards — no mixed/broken words
    return en;
  }
  // Hindi
  return [
    {id:'defect',ico:'🔴',t:'Defect Action Plans',d:'OD कम? Pinhole? Web break? — 30 सेकंड में #1 कारण + Step-by-Step fix।',cc:'#e53935',m:'16 Action Plans'},
    {id:'quiz',ico:'📝',t:'ज्ञान परीक्षा',d:'50 MCQ — Process · Safety · GMP · 5S। शिफ्ट से पहले 10 मिनट।',cc:'var(--orange)',m:'50 प्रश्न'},
    {id:'met',ico:'⚡',t:'Metalliser Operation',d:'Chamber · Boat · Wire · OD · Plasma · Drum — AlBond / CPP / AlOx पूरा फ्लोर ज्ञान।',cc:'var(--gold)',m:'8 विषय'},
    {id:'slit',ico:'✂️',t:'Slitter Operation',d:'मशीन सेटअप, ब्लेड, कॉर्क टेप, क्रिटिकल कस्टमर, ग्रेडिंग और जॉइंट।',cc:'var(--cyan)',m:'7 विषय'},
    {id:'safety',ico:'🦺',t:'सुरक्षा एवं GMP',d:'Al धूल + पानी = आग खतरा। PPE · LOTO · Moving parts — हर ऑपरेटर के लिए अनिवार्य।',cc:'var(--red)',m:'अनिवार्य'},
    {id:'sops',ico:'📋',t:'SOPs एवं WIs',d:'10 SOPs, 25+ WIs, 15+ Formats — मेटलाइज़ेशन और स्लिटिंग दस्तावेज़ लाइब्रेरी।',cc:'var(--blue)',m:'25+ दस्तावेज़'},
    {id:'terms',ico:'📚',t:'औद्योगिक शब्दावली',d:'SOP, WI, 5S, TPM, Kaizen, KPI, OEE, Lean — हिंदी में व्याख्या।',cc:'var(--purple)',m:'50+ शब्द'},
    {id:'check',ico:'✅',t:'Pre-Start Checklist',d:'शिफ्ट स्टार्ट से पहले 27 बिंदु — Safety · Machine · Material।',cc:'var(--green)',m:'27 बिंदु'},
    {id:'manuals',ico:'📖',t:'OEM Manual Library',d:'296 Equipment Manuals — Drives, PLC, Sensors, Pumps, Bearings।',cc:'var(--blue)',m:'296 PDF'}
  ];
}

function rHome(pg){
  var g = MODE==='free';
  var cards = _homeCards();
  var hi = (LANG==='hi');
  if(g){
    cards = cards.slice();
    cards.push({id:'sap',ico:'💻',t:'SAP Entry',d: hi ? 'COR1 + ZPP_METJUMBO और ZPP_SLIT — SAP में production entry।' : 'COR1 + ZPP_METJUMBO and ZPP_SLIT — production entry in SAP.',cc:'#e07800',m:'Free'});
    cards.push({id:'maint',ico:'🛠️',t:'Maintenance (PM)',d: hi ? 'Metalliser-1/2 के लिए daily, weekly, monthly PM checklist।' : 'Daily, weekly, monthly PM checklist for Metalliser-1 and Metalliser-2.',cc:'var(--muted)',m:'Free'});
  }
  var cH = cards.map(function(c){
    return '<div class="card" style="--cc:'+c.cc+'" onclick="nav(\''+c.id+'\')"><div class="card-ico">'+c.ico+'</div><div class="card-title">'+c.t+'</div><div class="card-desc">'+c.d+'</div><div class="card-meta">→ '+c.m+'</div></div>';
  }).join('');
  var phCode = g ? 'DASHBOARD — PLANT OPS' : (hi ? '🔥 धाकड़ ज्ञान' : '🔥 Dhakad Gyaan');
  var phDesc = hi
    ? (g ? 'Vacuum metallisation और slitting का training platform — metalliser plant operators के लिए।' : 'Vacuum metallisation और slitting का general training।')
    : (g ? 'Training platform for vacuum metallisation and slitting — for metalliser plant operators.' : 'General training for vacuum metallisation and slitting.');
  var ban = '';
  if(g){
    ban = '<div class="banner"><div class="ban-ico">🏭</div><div class="ban-txt"><strong>Metalliser Plant</strong><br><span style="opacity:.95">'
      + (hi ? 'Mode active है। Machine data, SAP, KPI और internal SOPs उपलब्ध हैं।' : 'Mode active. Machine data, SAP, KPI and internal SOPs are available.')
      + '</span></div></div>'
      + '<div class="home-quick" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 8px">'
      + '<button type="button" class="btn btn-p" style="width:100%" onclick="nav(\'sops\')">📋 SOPs</button>'
      + '<button type="button" class="btn" style="width:100%" onclick="nav(\'defect\')">🔴 Defect Plans</button></div>';
  }
  var tagLang = hi ? 'हिंदी' : 'English';
  var tagScope = g ? (hi ? 'Internal' : 'Internal') : (hi ? 'Public' : 'Public');
  pg.innerHTML =
    '<div class="ph"><div class="ph-code">'+phCode+'</div>'
    +'<div class="ph-title">Met Train <span>PRO</span></div>'
    +'<div class="ph-desc">'+phDesc+'</div>'
    +'<div class="tags"><span class="tag a">'+tagLang+'</span><span class="tag c">Multi-language</span><span class="tag g">'+tagScope+'</span></div></div>'
    +ban
    +'<div class="card-grid">'+cH+'</div>';
}


function showToast(msg){
  var c=document.getElementById('toastContainer');
  if(!c){
    c=document.createElement('div');
    c.id='toastContainer';
    c.className='toast-container';
    c.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(c);
  }
  var t=document.createElement('div');
  t.className='toast';
  t.style.cssText='background:rgba(15,23,42,.92);color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:700;border:1px solid rgba(37,211,102,.4);box-shadow:0 8px 24px rgba(0,0,0,.35)';
  t.textContent=msg;
  c.appendChild(t);
  setTimeout(function(){ try{t.remove();}catch(e){} }, 2200);
}
