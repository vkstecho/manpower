// Met Train PRO — Quiz & Checklist
// ══════════════════════════════════════════════════════
// QUIZ
// ══════════════════════════════════════════════════════
const Q_ALL=[
  {q:"मेटलाइज़ेशन चेंबर का ऑपरेटिंग वैक्युम प्रेशर कितना होता है?",o:["10⁻² mbar","10⁻⁴ mbar","10⁻¹ mbar","1 bar"],a:1,e:"Vacuum metallisation chamber operates at ~1.4×10⁻⁴ mbar — prevents Al from oxidising before reaching film."},
  {q:"ABM22 सामग्री के लिए AlBond Intensity (O₂) का मान क्या होता है?",o:["3.0–3.5","4.0–4.5","5.0–5.5","6.0–7.0"],a:2,e:"ABM22 requires AlBond Intensity 5.0–5.5 (~400 SCCM). Surface energy >54 Dynes required."},
  {q:"CPP मेटलाइज़ेशन के लिए कोटिंग ड्रम का तापमान क्या होना चाहिए?",o:["0°C","−20°C","−40°C","+20°C"],a:1,e:"CPP requires Coating Drum Temperature -20°C, Rewinder Tension 120-150N, Direction OUT."},
  {q:"रिपल-फ्री स्लिटिंग के लिए रिवाइंडिंग टेंशन क्या होती है?",o:["50 N/M","70 N/M","90 N/M","120 N/M"],a:2,e:"Ripple-free: Tension=90 N/M, Nip=700 N/m², Speed=500 m/min."},
  {q:"SAP में ग्रेड '6' का अर्थ क्या है?",o:["ठीक / A ग्रेड","B ग्रेड","ऑफकट/वेस्ट","कोटिंग को"],a:2,e:"Grade 6 = Offcut/Waste — trim and unusable material handled as scrap."},
  {q:"Export ऑर्डर के लिए एक Slit Roll में अधिकतम कितने Joint होने चाहिए?",o:["0","1","2","3"],a:1,e:"Export: max 1 joint. Domestic: max 2 joints. Exceeding = automatic downgrade."},
  {q:"मेटलाइज़ेशन से पहले बेयर फिल्म की न्यूनतम Surface Energy क्या होनी चाहिए?",o:["42 Dynes","48 Dynes","54 Dynes","60 Dynes"],a:2,e:"Minimum surface energy >54 Dynes required for proper adhesion of aluminium coating."},
  {q:"Boat इंस्टॉलेशन से पहले दोनों सिरों पर क्या लगाया जाता है?",o:["मास्किंग टेप","Graphite Foil","Acetone","Caustic Soda"],a:1,e:"Graphite foil at both ends of each boat before installation. Must be fitted tightly."},
  {q:"Drum Cleaning में Caustic Soda उपयोग करते समय क्या पहनना अनिवार्य है?",o:["सूती दस्ताने","रबर दस्ताने","कोई नहीं","लेदर दस्ताने"],a:1,e:"Rubber gloves mandatory with Caustic Soda. Direct contact causes severe burns."},
  {q:"एल्यूमीनियम धूल और पानी के मिलने पर क्या होता है?",o:["कुछ नहीं","हल्का धुआं","आग/विस्फोट खतरा","रंग परिवर्तन"],a:2,e:"Al dust + Water = Fire/Explosion risk (Class D fire). Never store in open or move in rain."},
  {q:"Slitter में Web Break होने पर सबसे पहले क्या करें?",o:["तुरंत हाथ डालें","Dancer Roller पूरी तरह रुकने का इंतज़ार करें","स्पीड बढ़ाएं","अनदेखा करें"],a:1,e:"Wait until Dancer Roller has COMPLETELY stopped before threading. Major accident risk."},
  {q:"OD 2.2 के लिए Transmittance लगभग कितनी होती है?",o:["10%","5%","1%","0.63%"],a:3,e:"OD = -log₁₀(Transmittance). OD 2.2 → ~0.63% transmittance. Higher OD = thicker coating."},
  {q:"JAYESH और PEPSICO जैसे Critical Customers की width कहाँ रखनी चाहिए?",o:["किनारों पर","जंबो के केंद्र में","Drive Side पर","Operator Side पर"],a:1,e:"Critical customer widths MUST be at CENTRE of jumbo — prevents low OD and crease at edges."},
  {q:"Cork Tape का अनुशंसित Wrapping Angle क्या है?",o:["10°–20°","30°–45°","60°–75°","90°"],a:1,e:"Recommended spiral wrapping angle is 30°–45°. Best at 35°–40° for high-speed slitters."},
  {q:"AlOx फिल्म को Topcoat से पहले कितने दिन Curing करनी होती है?",o:["7 दिन","15 दिन","40 दिन","90 दिन"],a:2,e:"AlOx rolls must be stored 40 days from manufacturing date before topcoat application."},
  {q:"हर cycle में Shield पर क्या लगाया जाता है?",o:["मास्किंग टेप","Graphite Suspension (Release) Paint","Acetone","Al Wire"],a:1,e:"Graphite suspension paint on shields after cleaning — allows easy removal of Al deposits."},
  {q:"Bare Waste का target प्रति Jumbo Roll कितना है?",o:["200m (0.28%)","500m (0.7%)","1000m (1.4%)","कोई limit नहीं"],a:1,e:"Bare Waste target = max 500m per jumbo (0.7% of 72,000m)."},
  {q:"Metalliser-1 के लिए SAP Process Order Type क्या है?",o:["GP01","GP03","GP05","GP07"],a:1,e:"Metalliser-1 (3300mm) = Order Type GP03. Metalliser-2 (3650mm) = GP05."},
  {q:"Standard Metallisation के लिए Plasma Unit Power कितनी होती है?",o:["2 kW","5 kW","10 kW","20 kW"],a:1,e:"Plasma Unit Power = 5 kW for ABM22 and ABM25. Gas flow: 1000 SCCM, O2: 80%."},
  {q:"वैक्युम चेंबर खोलने के बाद अंदर जाने से पहले क्या करना चाहिए?",o:["तुरंत अंदर जाएं","Exhaust Fan ON करके 1 मिनट रुकें","पानी पीएं","चेंबर बंद करें"],a:1,e:"Turn ON exhaust fan, wait 1 minute for hot vapours to clear before entering chamber."},
  {q:"SOP का Full Form क्या है?",o:["Standard Operating Procedure","Standard Output Process","System Operating Plan","Standard Order Protocol"],a:0,e:"SOP = Standard Operating Procedure — किसी task को consistently और correctly करने के लिए documented step-by-step instructions."},
  {q:"5S में पहला S किस शब्द से है?",o:["Shine","Set in Order","Sort","Standardise"],a:2,e:"5S: Sort (Seiri) → Set in Order → Shine → Standardise → Sustain. पहला S = SORT = अनावश्यक वस्तु हटाना."},
  {q:"5S में तीसरा S कौन सा है?",o:["Sort","Set in Order","Shine","Standardise"],a:2,e:"5S का तीसरा S = SHINE (Seiso) — कार्यक्षेत्र, machine, tools को साफ रखना. सफाई = पहली inspection."},
  {q:"5S में पाँचवाँ S क्या है?",o:["Sort","Shine","Standardise","Sustain"],a:3,e:"5S का पाँचवाँ S = SUSTAIN (Shitsuke) — 5S को रोज़ाना की आदत बनाओ, केवल audit के लिए नहीं."},
  {q:"KPI का Full Form क्या है?",o:["Key Performance Indicator","Key Process Input","Known Production Index","Key Plant Information"],a:0,e:"KPI = Key Performance Indicator — measurable value जो बताती है कि objectives कितनी effectively achieve हो रहे हैं."},
  {q:"KPI का उदाहरण क्या है?",o:["मशीन का रंग","Bare Waste % (target max 0.7%)","Operator की उम्र","शिफ्ट का समय"],a:1,e:"KPI examples: Bare Waste max 0.7%, Setup time max 15 min, Rolls per day min 10, OD uniformity. ये measurable targets हैं."},
  {q:"TPM का Full Form क्या है?",o:["Total Productive Maintenance","Total Plant Management","Technical Preventive Method","Total Process Monitoring"],a:0,e:"TPM = Total Productive Maintenance. Goal: Zero Breakdowns + Zero Defects + Zero Accidents."},
  {q:"TPM में कितने Pillars होते हैं?",o:["5","6","8","10"],a:2,e:"TPM में 8 Pillars: Autonomous Maintenance, Planned Maintenance, Quality Maintenance, Focused Improvement, Early Management, Training, Safety, TPM in Admin."},
  {q:"TPM का पहला Pillar कौन सा है?",o:["Planned Maintenance","Autonomous Maintenance","Quality Maintenance","Safety"],a:1,e:"TPM Pillar-1 = Autonomous Maintenance (Jishu Hozen). Operator खुद basic cleaning, inspection, lubrication करता है."},
  {q:"Kaizen का अर्थ क्या है?",o:["बड़ा बदलाव एक बार में","Continuous Improvement (लगातार सुधार)","Machine की मरम्मत","Production बंद करना"],a:1,e:"Kaizen = Kai (change) + Zen (good) = Continuous Improvement. Japanese concept — हर दिन छोटे-छोटे सुधार."},
  {q:"OEE का Full Form क्या है?",o:["Overall Equipment Effectiveness","Output Efficiency Evaluation","Operator Error Estimation","Overall Energy Efficiency"],a:0,e:"OEE = Overall Equipment Effectiveness = Availability x Performance x Quality. World-class OEE = 85%+."},
  {q:"PDCA Cycle में C का क्या मतलब है?",o:["Control","Check","Create","Calculate"],a:1,e:"PDCA = Plan, Do, Check, Act. C = Check — results की जांच करना, plan से तुलना करना."},
  {q:"Poka-Yoke का मतलब क्या है?",o:["Speed बढ़ाना","Mistake-Proofing (गलती रोकना)","Cost कम करना","Record रखना"],a:1,e:"Poka-Yoke = Mistake-Proofing — device या mechanism जो human error को impossible या तुरंत detectable बनाए."},
  {q:"5 Whys technique का उपयोग किसलिए होता है?",o:["Production बढ़ाने के लिए","Root Cause Analysis के लिए","Training देने के लिए","5S audit के लिए"],a:1,e:"5 Whys = problem पर 5 बार WHY पूछो. हर जवाब से deeper cause मिलता है — root cause = permanent solution."},
  {q:"WI का Full Form क्या है?",o:["Work Instruction","Weekly Inspection","Written Information","Work Index"],a:0,e:"WI = Work Instruction — SOP से अधिक detailed, specific task के exact steps. Example: WI-04 Boat Change."},
  {q:"Lean Manufacturing का मुख्य लक्ष्य क्या है?",o:["Maximum Speed","WASTE Elimination (अपव्यय हटाना)","Maximum Manpower","Maximum Production"],a:1,e:"Lean = 8 Wastes eliminate करना (DOWNTIME): Defects, Overproduction, Waiting, Non-utilized talent, Transportation, Inventory, Motion, Extra-processing."},
  {q:"GMP का Full Form क्या है?",o:["Good Manufacturing Practice","General Machine Protocol","Gross Margin Percentage","Good Maintenance Procedure"],a:0,e:"GMP = Good Manufacturing Practice — standards जो ensure करती हैं products consistently और correctly बनें."},
  {q:"CAPA का Full Form क्या है?",o:["Corrective And Preventive Action","Cost And Process Analysis","Check And Perform Audit","Control And Production Activity"],a:0,e:"CAPA = Corrective And Preventive Action. Corrective = तुरंत समाधान. Preventive = दोबारा न हो."},
  {q:"Six Sigma में Sigma क्या represent करता है?",o:["Speed","Standard Deviation (Statistical Variation)","Safety Score","System Grade"],a:1,e:"Sigma = Standard Deviation (σ) — process variation का measure. 6σ = 3.4 defects per million opportunities."},
  {q:"Autonomous Maintenance में operator क्या करता है?",o:["केवल production","Basic Cleaning, Inspection और Lubrication","केवल SAP entry","HR काम"],a:1,e:"Autonomous Maintenance = TPM Pillar-1. Operator खुद machine की daily cleaning, inspection, lubrication करता है."},
  {q:"Planned Maintenance किस system का Pillar है?",o:["5S","Kaizen","TPM","Six Sigma"],a:2,e:"Planned Maintenance = TPM Pillar-2. Scheduled preventive maintenance — breakdown से पहले action."},
  {q:"Focused Improvement (Kobetsu Kaizen) का क्या मतलब है?",o:["सब कुछ एक साथ बदलना","Specific Losses को target करके eliminate करना","Salary बढ़ाना","Audit करना"],a:1,e:"TPM Pillar-4 = team-based approach से specific machine losses को data-driven तरीके से eliminate करना."},
  {q:"NCR का Full Form क्या है?",o:["Non-Conformity Report","New Customer Record","Normal Control Rate","Night Cycle Report"],a:0,e:"NCR = Non-Conformity Report. जब कोई process या product standards को meet नहीं करता. Format: GEN F-02."},
  {q:"FIFO का मतलब क्या है?",o:["First In First Out","Factory Inspection For Output","Fixed Inventory For Operations","Fast Input Fast Output"],a:0,e:"FIFO = First In First Out. जो पहले आया वो पहले use हो. Boats, wire, raw material — सब FIFO follow करें."},
  {q:"Muda का क्या अर्थ है?",o:["सुधार (Hindi)","Waste / अपव्यय (Japanese)","Quality (Chinese)","Efficiency (Korean)"],a:1,e:"Muda = Japanese: Waste. 8 types (DOWNTIME): Defects, Overproduction, Waiting, Non-utilized talent, Transportation, Inventory, Motion, Extra-processing."},
  {q:"Gemba का क्या अर्थ है?",o:["Office","The Real Place जहाँ actual work होता है","Store Room","Management Room"],a:1,e:"Gemba = Japanese: The Real Place. Shop floor, machine area. Gemba Walk = problems को directly observe करना."},
  {q:"Andon किस system को कहते हैं?",o:["Lighting System","Visual Alert / Stop-the-Line System","Attendance System","Inventory System"],a:1,e:"Andon = Visual alert system (lights/sounds) जो production problem तुरंत display करे. Operator line रोक सकता है."},
  {q:"PPM का Full Form क्या है? (Quality context)",o:["Parts Per Machine","Parts Per Million","Production Per Month","Process Per Minute"],a:1,e:"PPM = Parts Per Million. Defect rate measure. 10 PPM = 10 defective per million produced."},
  {q:"SMED का Full Form क्या है?",o:["Single-Minute Exchange of Die","Standard Machine Error Detection","System Monitoring Every Day","Safety Management Every Duty"],a:0,e:"SMED = Single-Minute Exchange of Die. Changeover time को 9 min से कम में लाने की technique. target: max 15 min setup."},
  {q:"Changeover Time कम करने की technique क्या कहलाती है?",o:["5S","SMED","TPM","Kaizen"],a:1,e:"SMED = Single-Minute Exchange of Die. Internal और External setup को separate करके changeover time drastically कम करते हैं."}
];
const Q_GEN_IDX=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49];

function rQuiz(pg){
  var g=MODE==='free';
  var set=g?Q_ALL:Q_GEN_IDX.map(function(i){return Q_ALL[i];});
  qState={q:0,score:0,set:set};
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मूल्यांकन — ज्ञान परीक्षा</div>'
    +'<div class="ph-title">ज्ञान <span>परीक्षा</span></div>'
    +'<div class="ph-desc">'+set.length+' प्रश्न — मेटलाइज़ेशन, स्लिटिंग, सुरक्षा, 5S, TPM, Kaizen, KPI और औद्योगिक शब्दावली। उत्तीर्णांक: 70%।</div></div>'
    +'<div class="quiz-wrap">'
    +'<div id="qprog" style="margin-bottom:12px">'
    +'<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);font-family:\'Share Tech Mono\',monospace;margin-bottom:4px">'
    +'<span id="qpl">प्रश्न 1 / '+set.length+'</span><span id="qps">अंक: 0</span></div>'
    +'<div class="prog"><div class="prog-fill" id="qpb" style="width:0%"></div></div></div>'
    +'<div id="qarea"></div>'
    +'<div class="scorebox" id="scorebox">'
    +'<div class="spct" id="spct"></div><div class="smsg" id="smsg"></div><div class="ssub" id="ssub"></div>'
    +'<button class="btn btn-p" onclick="resetQuiz()">↺ दोबारा दें</button>'
    +'</div></div>';
  showQ();
}

function showQ(){
  var q=qState.q,set=qState.set;
  if(q>=set.length){showScore();return;}
  var d=set[q],pct=Math.round(q/set.length*100);
  document.getElementById('qpl').textContent='प्रश्न '+(q+1)+' / '+set.length;
  document.getElementById('qps').textContent='अंक: '+qState.score;
  document.getElementById('qpb').style.width=pct+'%';
  var oH=d.o.map(function(o,i){
    return '<div class="opt" onclick="ansQ(this,'+i+','+d.a+')">'
      +'<div class="ol">'+String.fromCharCode(65+i)+'</div><div>'+o+'</div></div>';
  }).join('');
  document.getElementById('qarea').innerHTML=
    '<div class="qcard"><div class="qnum">प्रश्न '+(q+1)+' / '+set.length+'</div>'
    +'<div class="qtext">'+d.q+'</div>'
    +'<div class="opts">'+oH+'</div>'
    +'<div class="qfb" id="qfb"></div>'
    +'<div class="qnav"><button class="btn btn-p" id="qnext" onclick="nextQ()" disabled>अगला →</button>'
    +'<span style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:var(--muted);margin-left:auto">उत्तीर्णांक: 70%</span></div></div>';
}

function ansQ(el,i,correct){
  document.querySelectorAll('.opt').forEach(function(o){o.classList.add('dis');o.onclick=null;});
  var ok=i===correct;
  el.classList.add(ok?'ok':'no');
  document.querySelectorAll('.opt')[correct].classList.add('ok');
  if(ok)qState.score++;
  var fb=document.getElementById('qfb');
  fb.className='qfb show '+(ok?'c':'w');
  fb.textContent=(ok?'✅ सही! ':'❌ गलत। ')+qState.set[qState.q].e;
  document.getElementById('qnext').disabled=false;
}

function nextQ(){qState.q++;if(qState.q>=qState.set.length)showScore();else showQ();}

function showScore(){
  document.getElementById('qarea').style.display='none';
  document.getElementById('qprog').style.display='none';
  var sb=document.getElementById('scorebox');sb.classList.add('show');
  var pct=Math.round(qState.score/qState.set.length*100),pass=pct>=70;
  document.getElementById('spct').textContent=pct+'%';
  document.getElementById('spct').className='spct '+(pass?'pass':'fail');
  document.getElementById('smsg').textContent=pass?'उत्तीर्ण! 🎉':'अधिक अध्ययन करें 📚';
  document.getElementById('ssub').textContent=qState.score+' / '+qState.set.length+' सही — '+(pass?'शानदार! आपने सामग्री में महारत हासिल कर ली।':'प्रशिक्षण मॉड्यूल दोबारा पढ़ें और फिर प्रयास करें।');
}

function resetQuiz(){var pg=document.getElementById('pg-quiz');delete pg.dataset.r;rQuiz(pg);}

// ══════════════════════════════════════════════════════
// PERSISTENCE — localStorage helpers (needed early for checklist)
// ══════════════════════════════════════════════════════
var MT_STORAGE_KEY = 'mettrain_pro_v6_';
function mtSave(key, val){ try{ localStorage.setItem(MT_STORAGE_KEY + key, JSON.stringify(val)); }catch(e){} }
function mtLoad(key, fallback){ try{ var v = localStorage.getItem(MT_STORAGE_KEY + key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
function mtRemove(key){ try{ localStorage.removeItem(MT_STORAGE_KEY + key); }catch(e){} }

// ══════════════════════════════════════════════════════
// PRE-START CHECKLIST — DATE-SPECIFIC PERSISTENT
// ══════════════════════════════════════════════════════
var CK=[
  {cat:'🔒 सुरक्षा (Safety)',items:['Safety Helmet पहना हुआ और अच्छी स्थिति में','Safety Shoes पहने — Toe-Cap सही','Respiratory Mask उपलब्ध और Fit-Tested','Safety Goggles उपलब्ध और साफ','Ear Plugs कार्यस्थल पर उपलब्ध','कोई ढीले कपड़े नहीं — वर्दी ठीक से पहनी','Emergency Stop Buttons सुलभ और काम करते हुए','First Aid Kit की जगह मालूम है और स्टॉक है']},
  {cat:'🏭 मशीन स्थिति (Machine Condition)',items:['Machine क्षेत्र साफ — कोई तेल, धूल या अवरोध नहीं','सभी Guards और Grids Moving Parts पर लगे हैं','Crane और Sling Belt जांचे — कोई नुकसान नहीं','Felt Belt साफ — कोई धातु के टुकड़े या तेल नहीं','सभी Rollers साफ और संदूषण-मुक्त','Vacuum Pump Oil Level जांचा','Chiller पानी का प्रवाह और तापमान सामान्य','Al Dust Container भरा नहीं — जगह उपलब्ध']},
  {cat:'📋 रोल एवं मटेरियल (Roll & Material)',items:['प्लानिंग फॉर्मेट MET F-04 के अनुसार Bare Roll चुना','Surface Energy >54 Dynes जांची','रोल चौड़ाई के लिए सही Shield Plate चुनी','दोनों रोल सिरों पर Core Plug लगाया','SAP में सही Material Code की पुष्टि']},
  {cat:'⚙️ प्रक्रिया सेटअप (Process Setup)',items:['Boats जांचे — कोई दृश्य क्षति नहीं','Graphite Foil Boat सिरों के लिए तैयार','Masking Tape और Drum Cleaning सामग्री तैयार','Unwinder Stop Diameter Core Type के अनुसार सेट','Web Threading दिशा (I/O) की पुष्टि','कस्टमर के अनुसार OD Set Point लोड किया','SAP Production Order Number नोट किया']}
];

// Date helpers
function getTodayStr(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function formatDateHindi(ds){
  var d=new Date(ds+'T00:00:00');
  var days=['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'];
  var months=['जन','फर','मार्च','अप्रै','मई','जून','जुला','अग','सित','अक्टू','नव','दिस'];
  return {day:days[d.getDay()], date:d.getDate(), month:months[d.getMonth()], full:d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear()};
}

// Checklist data store: { "2026-03-11": {items:{0_0:true,...}, shift:'A', completedAt:null, startedAt:timestamp}, ... }
var ckAllData = {};
var ckViewDate = ''; // currently viewed date
var ckShowHistory = false;

function loadCKData(){
  ckAllData = mtLoad('checklistDates', {});
  // Migrate old single checklistState if exists
  var oldCK = mtLoad('checklistState', null);
  if(oldCK && !ckAllData[getTodayStr()]){
    ckAllData[getTodayStr()] = {items: oldCK, shift:'A', startedAt: Date.now(), completedAt: null};
    saveCKData();
    mtRemove('checklistState');
  }
}
function saveCKData(){ mtSave('checklistDates', ckAllData); }

function getCKForDate(ds){
  return ckAllData[ds] || null;
}
function ensureTodayCK(){
  var today = getTodayStr();
  if(!ckAllData[today]){
    var items = {};
    CK.forEach(function(cat,ci){ cat.items.forEach(function(_,ii){ items[ci+'_'+ii]=false; }); });
    ckAllData[today] = {items:items, shift:'A', startedAt:Date.now(), completedAt:null};
    saveCKData();
  }
  return ckAllData[today];
}

function getCKTotal(){
  var t=0; CK.forEach(function(c){t+=c.items.length;}); return t;
}
function getCKChecked(data){
  if(!data||!data.items)return 0;
  return Object.values(data.items).filter(function(v){return v;}).length;
}

// Also keep ckState in sync for backward compat
function syncCkState(){
  var today = getTodayStr();
  if(ckAllData[today]) ckState = ckAllData[today].items;
}

loadCKData();

function rCheck(pg){
  if(!ckViewDate) ckViewDate = getTodayStr();
  var today = getTodayStr();
  var isToday = (ckViewDate === today);
  if(isToday) ensureTodayCK();

  var viewData = getCKForDate(ckViewDate);
  var total = getCKTotal();

  // ── DATE STRIP (last 14 days) ──
  var dateStripH = '';
  for(var i=13;i>=0;i--){
    var d = new Date(); d.setDate(d.getDate()-i);
    var ds = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var info = formatDateHindi(ds);
    var data = getCKForDate(ds);
    var checked = getCKChecked(data);
    var statusClass = '';
    if(data && checked === total) statusClass = ' complete';
    else if(data && checked > 0) statusClass = ' partial';
    var activeClass = (ds === ckViewDate) ? ' active' : '';
    dateStripH += '<div class="ck-date-chip'+statusClass+activeClass+'" onclick="switchCKDate(\''+ds+'\')">'
      +'<div class="ck-date-day">'+info.day+'</div>'
      +'<div class="ck-date-num">'+info.date+'</div>'
      +'<div class="ck-date-mon">'+info.month+'</div>'
      +'</div>';
  }

  // ── SHIFT SELECTOR (only for today) ──
  var shiftH = '';
  if(isToday && viewData){
    var curShift = viewData.shift || 'A';
    shiftH = '<div class="ck-shift-wrap">'
      +'<span class="ck-shift-label">शिफ्ट:</span>'
      +'<button class="ck-shift-btn'+(curShift==='A'?' on':'')+'" onclick="setCKShift(\'A\')">A शिफ्ट</button>'
      +'<button class="ck-shift-btn'+(curShift==='B'?' on':'')+'" onclick="setCKShift(\'B\')">B शिफ्ट</button>'
      +'<button class="ck-shift-btn'+(curShift==='C'?' on':'')+'" onclick="setCKShift(\'C\')">C शिफ्ट</button>'
      +'</div>';
  }

  // ── READONLY BANNER (for past dates) ──
  var readonlyH = '';
  if(!isToday && viewData){
    var fdate = formatDateHindi(ckViewDate);
    var shiftLabel = viewData.shift ? viewData.shift + ' शिफ्ट' : '';
    readonlyH = '<div class="ck-readonly-banner">📋 '+fdate.full+' — '+shiftLabel+' — केवल देखने के लिए (Read Only)</div>';
  } else if(!isToday && !viewData){
    readonlyH = '<div class="ck-readonly-banner">📋 '+formatDateHindi(ckViewDate).full+' — इस दिन कोई चेकलिस्ट नहीं भरी गई।</div>';
  }

  // ── CHECKLIST ITEMS ──
  var catH = '';
  if(viewData){
    var checked = getCKChecked(viewData);
    var pct = total ? Math.round(checked/total*100) : 0;

    CK.forEach(function(cat,ci){
      var iH = cat.items.map(function(item,ii){
        var key = ci+'_'+ii;
        var chk = viewData.items[key];
        if(isToday){
          return '<div class="cli'+(chk?' chk':'')+'" onclick="toggleCK(\''+key+'\')">'
            +'<div class="clbox">'+(chk?'✓':'')+'</div><div class="cltxt">'+item+'</div></div>';
        } else {
          return '<div class="cli'+(chk?' chk':'')+'" style="cursor:default;opacity:'+(chk?'1':'.5')+'">'
            +'<div class="clbox">'+(chk?'✓':'')+'</div><div class="cltxt">'+item+'</div></div>';
        }
      }).join('');
      catH += '<div style="margin-bottom:14px">'
        +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">'+cat.cat+'</div>'
        +iH+'</div>';
    });

    // Progress bar
    var progH = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
      +'<div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);font-family:\'Share Tech Mono\',monospace;margin-bottom:4px">'
      +'<span>जांचे गए: '+checked+' / '+total+'</span><span>'+pct+'%</span></div>'
      +'<div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div></div>'
      +(isToday?'<button class="btn btn-s" onclick="resetCK()">↺ रीसेट</button>':'')
      +'</div>';

    var completeAlert = '';
    if(checked===total && total>0){
      completeAlert = Al('s','✅','सभी बिंदु जांचे गए! '+(isToday?'मशीन शुरू करने के लिए तैयार है। Shift Supervisor को सूचित करें और आगे बढ़ें।':'इस दिन चेकलिस्ट पूरी हुई थी।'));
    }

    catH = completeAlert
      +(isToday?Al('w','⚠️','कोई भी बिंदु अधूरा हो तो <strong>मशीन शुरू न करें।</strong> Shift Supervisor को तुरंत सूचित करें।'):'')
      + progH + shiftH + readonlyH + catH;
  } else {
    catH = readonlyH;
  }

  // ── HISTORY SECTION ──
  var histBtnH = '<div class="ck-history-btn" onclick="toggleCKHistory()">📅 '+(ckShowHistory?'इतिहास छुपाएं':'पिछली चेकलिस्ट देखें — इतिहास')+'</div>';
  var histH = '';
  if(ckShowHistory){
    var dates = Object.keys(ckAllData).sort().reverse();
    if(dates.length){
      histH = '<div style="font-family:\'Rajdhani\',sans-serif;font-size:14px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">📜 चेकलिस्ट इतिहास</div>';
      dates.forEach(function(ds){
        var data = ckAllData[ds];
        var info = formatDateHindi(ds);
        var checked = getCKChecked(data);
        var pct = total ? Math.round(checked/total*100) : 0;
        var pctClass = pct===100?'full':(pct>0?'part':'none');
        var isT = (ds===today);
        histH += '<div class="ck-history-row" onclick="switchCKDate(\''+ds+'\')">'
          +'<div class="ck-history-date">'+(isT?'⚡ आज':info.full)+'</div>'
          +'<div class="ck-history-shift">'+(data.shift||'A')+' शिफ्ट</div>'
          +'<div style="flex:1;margin-left:8px"><div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div></div>'
          +'<div class="ck-history-pct '+pctClass+'">'+pct+'%</div>'
          +'</div>';
      });
    } else {
      histH = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:16px;font-family:\'Mukta\',\'Hind\',sans-serif">अभी तक कोई चेकलिस्ट नहीं भरी गई।</div>';
    }
  }

  // ── RENDER ──
  var dateInfo = formatDateHindi(ckViewDate);
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मूल्यांकन — प्री-स्टार्ट ऑपरेटर चेकलिस्ट</div>'
    +'<div class="ph-title">प्री-स्टार्ट <span>चेकलिस्ट</span></div>'
    +'<div class="ph-desc">हर Metalliser Cycle शुरू करने से पहले पूरा करें। '+total+' बिंदु — सुरक्षा, मशीन, मटेरियल और सेटअप।<br>'
    +'<span style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:var(--gold)">📅 तारीख चुनें → पुरानी चेकलिस्ट देखें</span></div></div>'
    +'<div class="ck-date-strip" id="ckDateStrip">'+dateStripH+'</div>'
    +catH
    +histBtnH
    +histH;

  // Scroll date strip to show active date
  setTimeout(function(){
    var strip = document.getElementById('ckDateStrip');
    if(strip){
      var active = strip.querySelector('.ck-date-chip.active');
      if(active) active.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    }
  },50);
}

function initCK(){ ensureTodayCK(); syncCkState(); }

function toggleCK(key){
  var today = getTodayStr();
  if(ckViewDate !== today) return; // can't edit past dates
  ensureTodayCK();
  ckAllData[today].items[key] = !ckAllData[today].items[key];
  // Check if all complete
  var total = getCKTotal();
  var checked = getCKChecked(ckAllData[today]);
  if(checked === total && total > 0 && !ckAllData[today].completedAt){
    ckAllData[today].completedAt = Date.now();
    showToast('✅ चेकलिस्ट पूर्ण! — '+formatDateHindi(today).full, 'success', 3000);
  }
  saveCKData();
  syncCkState();
  var pg=document.getElementById('pg-check'); delete pg.dataset.r; rCheck(pg);
}

function resetCK(){
  var today = getTodayStr();
  if(ckViewDate !== today) return;
  ensureTodayCK();
  Object.keys(ckAllData[today].items).forEach(function(k){ ckAllData[today].items[k]=false; });
  ckAllData[today].completedAt = null;
  saveCKData();
  syncCkState();
  var pg=document.getElementById('pg-check'); delete pg.dataset.r; rCheck(pg);
}

function switchCKDate(ds){
  ckViewDate = ds;
  var pg=document.getElementById('pg-check'); delete pg.dataset.r; rCheck(pg);
}

function setCKShift(s){
  var today = getTodayStr();
  ensureTodayCK();
  ckAllData[today].shift = s;
  saveCKData();
  var pg=document.getElementById('pg-check'); delete pg.dataset.r; rCheck(pg);
}

function toggleCKHistory(){
  ckShowHistory = !ckShowHistory;
  var pg=document.getElementById('pg-check'); delete pg.dataset.r; rCheck(pg);
}

// ══════════════════════════════════════════════════════
// AI EXPERT — पूछो कुछ भी (Ask Anything) Chat Module
// ══════════════════════════════════════════════════════
var _aiHistory=[];
var _aiLoading=false;
var _aiAPIKey='';
// ★ Obfuscated API Key — not visible as plain text in source code
// ★ Key is XOR-encoded. Set via ⚙️ in app.
var _AI_KEY_ENC='DCwONSEYKx0YAjRxf2cbfjVCZzw7MCkkBDkDA1YEIC8GIQYYAQIe';
