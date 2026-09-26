// Met Train PRO — SAP, Maintenance, General training pages
// ══════════════════════════════════════════════════════
// SAP — HINDI
// ══════════════════════════════════════════════════════
function rSAP(pg){
  if(MODE!=='free'){pg.innerHTML=Lock();return;}
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मॉड्यूल 5 — आंतरिक — SAP प्रविष्टि</div>'
    +'<div class="ph-title">SAP प्रविष्टि एवं <span>रिकॉर्ड</span></div>'
    +'<div class="ph-desc">Met Jumbo (COR1+ZPP_METJUMBO (plant SAP T-code)) और Slitting (ZPP_SLIT) के लिए Step-by-Step SAP प्रोडक्शन एंट्री।</div>'
    +'<div class="tags"><span class="tag a">मुक्त / Free</span><span class="tag c">ZPP_METJUMBO (plant SAP T-code)</span><span class="tag g">ZPP_SLIT</span></div></div>'
    +Al('i','💻','Login: POLY_MATEL_E | System: PROD | Plant: 3001 | Controlling Area: 3000 | Semi-Finished: 3SF-G… | Finished: 3FG-G…')
    +Tabs(['Met Jumbo (COR1 + ZPP_METJUMBO (plant SAP T-code))','Slitting (ZPP_SLIT)','Quick Reference'],[
      Al('i','📋','प्रवाह: COR1 (Order बनाएं) → ZPP_METJUMBO (plant SAP T-code) (डेटा भरें) → Ctrl+S')
      +'<ul class="steps">'
      +S(1,'SAP खोलें → <strong>PROD</strong> पर डबल-क्लिक करें → POLY_MATEL_E से Login करें।')
      +S(2,'T-Code: <strong>COR1</strong> → Process Order बनाएं।')
      +S(3,'भरें: Material (3SF-G…), Plant code, Quantity (KG), Order Type: <strong>GP03</strong> (Metalliser-1) या <strong>GP05</strong> (Metalliser-2)।')
      +S(4,'Enter दबाएं → Quantity → Enter → <strong>Green Flag</strong> (Release) → <strong>Ctrl+S → Yes → Order Number नोट करें।</strong>')
      +S(5,'T-Code: <strong>ZPP_METJUMBO (plant SAP T-code)</strong> → Plant: 3001 → Order No. → Execute (Clock Icon)।')
      +S(6,'Logbook से भरें: Posting Date (Auto), Base Roll ID (List से चुनें), Consumed Length, Met Width।')
      +S(7,'सभी TIME भरें: Chamber Closing Time और Vacuum Time (दोनों एक जैसे)।')
      +S(8,'Machine Speed जांचें → Supervisor नाम (Comma से अलग करें) → Downtime (मिनट) → Remark (P/M/E/O)।')
      +S(9,'<strong>Base Film</strong> पर क्लिक करें → मेटलाइज़ किए गए Bare Film का वज़न भरें।')
      +S(10,'<strong>Process Jumbo</strong> → फिर <strong>Raw & Waste</strong> पर क्लिक करें।')
      +S(11,'Excel Formula Sheet खोलें → SAP की Top/Bottom Values भरें → Wire qty (दशमलव नहीं) भरें।')
      +S(12,'Boat qty (दशमलव नहीं) भरें → <strong>Ctrl+S → Controlling Area: 3000 → Save।</strong>')
      +'</ul>',

      Al('i','📋','प्रवाह: ZPP_SLIT → Header → Enter → Grade/Width/Position → Order → Save')
      +'<ul class="steps">'
      +S(1,'T-Code: <strong>ZPP_SLIT</strong>।')
      +S(2,'भरें: Material (3FG-G…), Rolls की संख्या (2/3/4/5), Machine: <strong>3-M1_S</strong> (Metalliser-1) या <strong>3-M2_S</strong> (Metalliser-2)।')
      +S(3,'Core Thickness (13/15/16), Core ID (3/6/8"), Core Type (RC/नई)।')
      +S(4,'Film Thickness (8/10/12/19µ), Length (24000/36000), Treatment, Chemical, Metal Side (I/O)।')
      +S(5,'<strong>Enter</strong> दबाएं → Batch No. Logbook से मिलाएं।')
      +S(6,'हर रोल के लिए: Width (Logbook से), Grade (2/3/5/6/7/8), Position (L/C/R या L/A/B/R)।')
      +S(7,'Joint (संख्या), Joint from Top (मीटर में लंबाई)।')
      +S(8,'ग्रेड 3/5/8 के लिए: Downgrade Reason चुनें + पूरी Remark लिखें। उदाहरण: "Low OD Edge 20mm 1.6-1.9"')
      +S(9,'Posting Date जांचें → <strong>Create Process Order → Ctrl+S → Area 3000 → Save।</strong>')
      +'</ul>',

      '<table class="t"><thead><tr><th>विवरण</th><th>मान</th></tr></thead><tbody>'
      +'<tr><td>SAP Login ID</td><td class="tv">POLY_MATEL_E</td></tr>'
      +'<tr><td>System</td><td class="tv">PROD</td></tr>'
      +'<tr><td>Plant</td><td class="tv">3001</td></tr>'
      +'<tr><td>Controlling Area</td><td class="tv">3000</td></tr>'
      +'<tr><td>Metalliser-1 Machine Code</td><td class="tv">3-M1_W | GP03</td></tr>'
      +'<tr><td>Metalliser-2 Machine Code</td><td class="tv">3-M2_W | GP05</td></tr>'
      +'<tr><td>Slitter-1 Code</td><td class="tv">3-M1_S</td></tr>'
      +'<tr><td>Slitter-2 Code</td><td class="tv">3-M2_S</td></tr>'
      +'<tr><td>T-Code Order बनाने के लिए</td><td class="tv">COR1</td></tr>'
      +'<tr><td>T-Code Met Jumbo</td><td class="tv">ZPP_METJUMBO (plant SAP T-code)</td></tr>'
      +'<tr><td>T-Code Slitting</td><td class="tv">ZPP_SLIT</td></tr>'
      +'<tr><td>Downtime कोड</td><td class="tv">P=Process | M=Mech | E=E&amp;I | O=Others</td></tr>'
      +'</tbody></table>'
    ]);
}

// ══════════════════════════════════════════════════════
// MAINTENANCE — HINDI
// ══════════════════════════════════════════════════════
function rMaint(pg){
  if(MODE!=='free'){pg.innerHTML=Lock();return;}
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मॉड्यूल 6 — आंतरिक — निवारक रखरखाव</div>'
    +'<div class="ph-title">निवारक <span>रखरखाव (PM)</span></div>'
    +'<div class="ph-desc">Metalliser-1 और Metalliser-2 के लिए दैनिक, साप्ताहिक, मासिक और त्रैमासिक PM अनुसूची। फॉर्मेट: MET F-07/08/09/10/11।</div>'
    +'<div class="tags"><span class="tag a">मुक्त / Free</span><span class="tag c">MET F-07 to F-11</span></div></div>'
    +Tabs(['दैनिक (F-07)','साप्ताहिक (F-08)','मासिक (F-09)','त्रैमासिक/वार्षिक'],[
      Al('i','📋','हर Shift — Process Team ज़िम्मेदार। MET F-07 में सभी बिंदु दर्ज करें।')
      +'<ul class="steps">'
      +S('D1','हर Cycle की शुरुआत में Vacuum Level और Pump Performance जांचें।',true)
      +S('D2','Evaporation Source — Boats Area का निरीक्षण और सफाई।',true)
      +S('D3','Wire Feed Mechanism और Al Wire Spool की स्थिति।',true)
      +S('D4','Shield Position और अखंडता की जांच।',true)
      +S('D5','Coating Drum सतह साफ करें — ताज़ी Masking Tape लगाएं।',true)
      +S('D6','Plasma Unit: Power और Gas Flow जांचें।',true)
      +S('D7','Chiller पानी का तापमान और प्रवाह दर।',true)
      +S('D8','सभी Rollers: संदूषण या क्षति की जांच।',true)
      +S('D9','Tension Settings मौजूदा Recipe के अनुसार जांचें।',true)
      +S('D10','Al Dust 20L Container में इकट्ठा करें और सही तरीके से स्थानांतरित करें।',true)
      +'</ul>',

      Al('i','📋','साप्ताहिक — गहरी यांत्रिक और विद्युत जांच। MET F-08।')
      +'<ul class="steps">'
      +S('W1','पूर्ण Vacuum Leak Check: Chamber, Pump Lines, Valves।',true)
      +S('W2','Cork Tape Roller निरीक्षण — घिसे हों तो बदलें।',true)
      +S('W3','Cranes, Sling Belts, Hoists: क्षमता और क्षति जांच।',true)
      +S('W4','Source Section की गहरी सफाई — सभी Al Oxide हटाएं।',true)
      +S('W5','Unwinder/Rewinder Chucks और लॉकिंग Mechanism।',true)
      +S('W6','Nip Rollers: कट के निशान या असमानता जांचें।',true)
      +S('W7','Al Dust 20L से 500L मुख्य Container में स्थानांतरित करें।',true)
      +'</ul>',

      Al('i','📋','मासिक — प्रमुख सिस्टम जांच। MET F-09।')
      +'<ul class="steps">'
      +S('M1','Cryo-Generator Refrigeration Balance Pressure जांच।',true)
      +S('M2','Vacuum Pump Oil Level — जांचें और आवश्यकता पर बदलें।',true)
      +S('M3','Plasma Unit गहरी सफाई — Electrodes, Nozzles।',true)
      +S('M4','सभी Moving Parts का Lubrication — जांच और पुनः Lubricate।',true)
      +S('M5','GRE Chiller Unit — Pressure, Temperature, Flow।',true)
      +S('M6','Electrical Panel — Connections, Terminals, Breakers।',true)
      +'</ul>',

      Al('i','📋','त्रैमासिक और वार्षिक — MET F-10 (Metalliser-1) और MET F-11 (Metalliser-2)।')
      +'<ul class="steps">'
      +S('Q1','Cryo-Generator: HMI से सभी Pressure Data रिकॉर्ड करें।',true)
      +S('Q2','Vacuum System: Helium Leak Test — सभी Seals और Gaskets।',true)
      +S('Q3','GRE Chiller: Suction और Discharge Pressure readings।',true)
      +S('Q4','Feed और Return Water Temperature — Condenser Blockage जांच।',true)
      +S('Q5','Unwinder/Rewinder Shaft और Bearing — घिसे हों तो बदलें।',true)
      +S('Q6','पूर्ण Electrical Audit — Insulation Resistance Testing।',true)
      +S('Q7','Hawk-Eye OD Monitoring System Calibration।',true)
      +'</ul>'
    ]);
}
</script>

<script>
// ══════════════════════════════════════════════════════
// GENERAL MET — HINDI
// ══════════════════════════════════════════════════════
function rGenMet(pg){
  if(!window._proUnlocked){pg.innerHTML='<div style="padding:20px">'+GENLock()+'</div>';return;}
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">🔥 धाकड़ ज्ञान — वैक्युम मेटलाइज़ेशन तकनीक</div>'
    +'<div class="ph-title">वैक्युम <span>मेटलाइज़ेशन</span></div>'
    +'<div class="ph-desc">वैक्युम मेटलाइज़ेशन का उद्योग-मानक ज्ञान — किसी भी प्लांट के ऑपरेटर, प्रशिक्षु या इंजीनियर के लिए।</div>'
    +'<div class="tags"><span class="tag a">धाकड़ ज्ञान</span><span class="tag g">उद्योग मानक</span></div></div>'
    +CB('📖','वैक्युम मेटलाइज़ेशन क्या है?','PVD प्रक्रिया',
      '<ul class="steps">'
      +S(1,'वैक्युम मेटलाइज़ेशन एक Physical Vapour Deposition (PVD) प्रक्रिया है जो Plastic Films (PET, BOPP, CPP) पर पतली Aluminium परत चढ़ाती है।')
      +S(2,'यह प्रक्रिया ~10⁻⁴ mbar के Vacuum Chamber में होती है — ताकि Al फिल्म तक पहुंचने से पहले Oxidise न हो।')
      +S(3,'Al Wire को Ceramic Boats में 700–1000°C तक गर्म किया जाता है। Al पिघलता है और वाष्प बन जाता है।')
      +S(4,'फिल्म ठंडे Drum (-20°C) के ऊपर से गुज़रती है। Al वाष्प फिल्म पर 20–50nm की धात्विक परत बनाता है।')
      +S(5,'Optical Density (OD) Al परत की मोटाई नापता है। अधिक OD = मोटी परत = बेहतर Light और Oxygen Barrier।')
      +S(6,'AlBond / AlOx मेटलाइज़ेशन में Plasma Treatment या Oxide Layer जोड़ी जाती है — Adhesion और Barrier बेहतर होता है।')
      +'</ul>',true)
    +CB('📐','Optical Density (OD) को समझना','गुणवत्ता माप',
      '<ul class="steps">'
      +S(1,'OD = -log₁₀(Transmittance)। मेटलाइज़्ड फिल्म की अपारदर्शिता नापता है।')
      +S(2,'OD 2.2 = ~0.63% Transmittance। OD 2.5 = ~0.32%। OD 2.8 = ~0.16%।')
      +S(3,'अधिक OD = मोटा Al = बेहतर Light और Oxygen Barrier।')
      +S(4,'बहुत अधिक OD = अत्यधिक Al खपत, Pinhole की संभावना। बहुत कम OD = खराब Barrier, कस्टमर शिकायत।')
      +S(5,'रोल चौड़ाई में OD की एकरूपता ज़रूरी है — किनारे से किनारे तक ±5% सीमा के अंदर।')
      +'</ul>')
    +CB('⚡','मेटलाइज़्ड फिल्म के सामान्य दोष','गुणवत्ता नियंत्रण',
      '<table class="t"><thead><tr><th>दोष</th><th>कारण</th><th>रोकथाम</th></tr></thead><tbody>'
      +'<tr><td class="tv r">कम OD</td><td>धीमी Wire Feed, Boat खराब, अधिक गति</td><td>Hawk-Eye Monitor करें, Boats पहले जांचें</td></tr>'
      +'<tr><td class="tv r">Pinholes</td><td>Boat Spitting, फिल्म सतह दोष</td><td>Boats साफ करें, फिल्म गुणवत्ता जांचें</td></tr>'
      +'<tr><td class="tv r">खरोंचें</td><td>Roller क्षति, Felt संदूषण</td><td>नियमित Roller निरीक्षण</td></tr>'
      +'<tr><td class="tv r">OD Bands</td><td>असमान वाष्पीकरण</td><td>Boat Position और Shield Setting जांचें</td></tr>'
      +'<tr><td class="tv r">Crease</td><td>Tension भिन्नता, Roller गलत</td><td>Tension और Roller Alignment जांचें</td></tr>'
      +'</tbody></table>');
}

// ══════════════════════════════════════════════════════
// GENERAL SLITTER — HINDI
// ══════════════════════════════════════════════════════
function rGenSlit(pg){
  if(!window._proUnlocked){pg.innerHTML='<div style="padding:20px">'+GENLock()+'</div>';return;}
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">🔥 धाकड़ ज्ञान — स्लिटिंग तकनीक</div>'
    +'<div class="ph-title">स्लिटिंग <span>तकनीक</span></div>'
    +'<div class="ph-desc">स्लिटिंग मशीनों, ब्लेड प्रकार, Tension नियंत्रण और गुणवत्ता पर उद्योग ज्ञान।</div>'
    +'<div class="tags"><span class="tag c">सामान्य</span><span class="tag g">उद्योग मानक</span></div></div>'
    +CB('📖','फिल्म स्लिटिंग क्या है?','उद्योग ज्ञान',
      '<ul class="steps">'
      +S(1,'Film Slitting एक चौड़े "Jumbo" या "Master" Roll को कस्टमर ऑर्डर की विशिष्ट चौड़ाई के संकरे रोल में काटती है।')
      +S(2,'स्लिटर Jumbo को Unwind करता है, Blade Station से pre-set चौड़ाई पर काटता है, और हर चौड़ाई को अलग Rewind करता है।')
      +S(3,'मेटलाइज़्ड फिल्म के लिए गति: 400–800 m/min — फिल्म प्रकार और कस्टमर के अनुसार।')
      +S(4,'मुख्य गुणवत्ता कारक: Edge Quality, OD Uniformity, Winding Tension, Telescoping, Core Seating।')
      +S(5,'Rewinder Rollers पर Cork Tape एकसमान वाइंडिंग के लिए नियंत्रित Friction देता है।')
      +'</ul>',true)
    +CB('🔪','ब्लेड प्रकार और चयन','ब्लेड तकनीक',
      '<table class="t"><thead><tr><th>प्रकार</th><th>उपयोग</th><th>फायदा</th></tr></thead><tbody>'
      +'<tr><td class="tv">Lutz Razor Blade</td><td>PET, BOPP, CPP</td><td>अत्यंत तेज़, साफ किनारा, लंबा जीवन</td></tr>'
      +'<tr><td class="tv">Paper Cutter Blade</td><td>मोटी फिल्में</td><td>उच्च बल काटने के लिए मजबूत</td></tr>'
      +'<tr><td class="tv">Circular Shear</td><td>भारी Gauge फिल्में</td><td>Blade कंपन नहीं</td></tr>'
      +'</tbody></table>'
      +Al('w','⚠️','ब्लेड इंस्टॉल तारीख, Batch Number और मीटर दर्ज करें। नियमित बदलें — घिसे ब्लेड से Edge Defects और Scrap।'))
    +CB('⚡','सामान्य स्लिटिंग दोष','QC संदर्भ',
      '<table class="t"><thead><tr><th>दोष</th><th>कारण</th><th>उपाय</th></tr></thead><tbody>'
      +'<tr><td class="tv r">Ripple (लहर)</td><td>गलत Tension, घिसी Cork Tape</td><td>गति कम करें, Nip और Tension जांचें</td></tr>'
      +'<tr><td class="tv r">Telescoping</td><td>कम Rewinder Tension, असमान Nip</td><td>Tension बढ़ाएं, Roller Alignment जांचें</td></tr>'
      +'<tr><td class="tv r">खराब किनारा</td><td>घिसा ब्लेड, गलत प्रकार</td><td>ब्लेड तुरंत बदलें</td></tr>'
      +'<tr><td class="tv r">चौड़ाई भिन्नता</td><td>Blade Setting खिसकना</td><td>Blade Position रीसेट, मजबूती से Lock करें</td></tr>'
      +'</tbody></table>');
}
</script>

<script>
// ══════════════════════════════════════════════════════
// TERMS — HINDI
// ══════════════════════════════════════════════════════
function rTerms(pg){
  if(!window._proUnlocked&&MODE!=='free'){pg.innerHTML='<div style="padding:20px">'+GENLock()+'</div>';return;}
  var sections=[
    {t:'📋 दस्तावेज़ एवं गुणवत्ता प्रणाली',c:'var(--gold)',items:[
      {a:'SOP',f:'Standard Operating Procedure',d:'किसी task को consistently और correctly करने के लिए documented step-by-step instructions। में 10 SOPs हैं।'},
      {a:'WI',f:'Work Instruction',d:'SOP से अधिक detailed — specific task के exact steps। उदाहरण: WI-04 Boat Change, WI-10 Roll Loading।'},
      {a:'GMP',f:'Good Manufacturing Practice',d:'Manufacturing standards जो ensure करती हैं कि products consistently और correctly बनें — Hygiene, Safety, Quality के साथ।'},
      {a:'NCR',f:'Non-Conformity Report',d:'जब कोई process या product standards को meet नहीं करता। Format: GEN F-02।'},
      {a:'CAPA',f:'Corrective And Preventive Action',d:'Corrective = तुरंत समाधान। Preventive = same problem दोबारा न हो। Quality System की backbone।'},
      {a:'KPI',f:'Key Performance Indicator',d:'Measurable targets जो performance track करते हैं। उदाहरण: Bare Waste ≤0.7%, Setup ≤15 min, Rolls/Day ≥10।'},
    ]},
    {t:'🏭 5S कार्यप्रणाली',c:'var(--cyan)',items:[
      {a:'1S — Sort (Seiri)',f:'छाँटना',d:'अनावश्यक वस्तुओं को कार्यक्षेत्र से हटाओ। जो काम का नहीं — remove करो।'},
      {a:'2S — Set in Order (Seiton)',f:'सजाना / व्यवस्थित करना',d:'हर चीज़ की जगह तय करो। "A place for everything, everything in its place."'},
      {a:'3S — Shine (Seiso)',f:'साफ करना',d:'कार्यक्षेत्र, Machine, Tools को साफ रखो। सफाई = पहली Inspection।'},
      {a:'4S — Standardise (Seiketsu)',f:'मानकीकृत करना',d:'पहले 3S को maintain करने के लिए Standards बनाओ। Checklists, Visual Standards।'},
      {a:'5S — Sustain (Shitsuke)',f:'बनाए रखना',d:'5S को रोज़ाना की आदत बनाओ — केवल Audit के लिए नहीं। Discipline = Culture।'},
    ]},
    {t:'🔧 TPM — 8 Pillars',c:'var(--green)',items:[
      {a:'TPM',f:'Total Productive Maintenance',d:'Goal: Zero Breakdowns + Zero Defects + Zero Accidents। Operators और Maintenance मिलकर Machine की देखभाल।'},
      {a:'Pillar 1 — Autonomous Maint.',f:'Jishu Hozen — स्वायत्त रखरखाव',d:'Operator खुद basic Cleaning, Inspection, Lubrication करे। "मेरी machine, मेरी ज़िम्मेदारी।"'},
      {a:'Pillar 2 — Planned Maint.',f:'Keikaku Hozen — नियोजित रखरखाव',d:'Scheduled Preventive Maintenance — Breakdown से पहले action। Plant: Daily/Weekly/Monthly/Quarterly PM।'},
      {a:'Pillar 3 — Quality Maint.',f:'Hinshitsu Hozen — गुणवत्ता रखरखाव',d:'Machine conditions जो Zero Defects produce करें। Defect Prevention at source।'},
      {a:'Pillar 4 — Focused Improvement',f:'Kobetsu Kaizen — केंद्रित सुधार',d:'Team-based approach से specific Machine losses को Data-driven तरीके से eliminate करो।'},
      {a:'Pillar 5 — Early Management',f:'Sho Ki Kanri — शुरुआती प्रबंधन',d:'नई Equipment और Products की Design Stage से Maintenance plan करो।'},
      {a:'Pillar 6 — Training & Education',f:'Kyouiku Kunren — प्रशिक्षण',d:'Operators और Technicians की Skills develop करो। Knowledge = Foundation।'},
      {a:'Pillar 7 — Safety, Health & Env.',f:'Anzen Eisei — सुरक्षा एवं स्वास्थ्य',d:'Zero Accidents, Zero Health Hazards, Zero Environmental Damage। Safety = पहली प्राथमिकता।'},
      {a:'Pillar 8 — TPM in Admin',f:'Jimusho TPM — प्रशासन में TPM',d:'Office और Admin Functions में भी TPM Principles apply करो।'},
      {a:'OEE',f:'Overall Equipment Effectiveness — समग्र उपकरण प्रभावशीलता',d:'OEE = Availability × Performance × Quality। World-class = 85%+। Machine Productivity का ultimate measure।'},
    ]},
    {t:'🌱 Kaizen एवं Lean',c:'var(--purple)',items:[
      {a:'Kaizen',f:'Kai (बदलाव) + Zen (अच्छा) = सतत सुधार',d:'हर दिन छोटे-छोटे सुधार — हर level के employees द्वारा। Masaaki Imai (Japan) का concept।'},
      {a:'Lean Manufacturing',f:'अपव्यय-रहित उत्पादन',d:'8 Wastes (DOWNTIME) eliminate करो: Defects, Overproduction, Waiting, Non-utilized talent, Transportation, Inventory, Motion, Extra-processing।'},
      {a:'Muda (मुदा)',f:'अपव्यय — Waste (Japanese)',d:'वो activity जो Value नहीं add करती। 3M: Muda (Waste), Mura (असमानता), Muri (अत्यधिक बोझ)।'},
      {a:'Gemba',f:'असली जगह (Japanese: The Real Place)',d:'जहाँ actual work होता है — Shop Floor, Machine Area। Gemba Walk = problems को directly observe करना।'},
      {a:'Poka-Yoke',f:'Mistake-Proofing — गलती रोकना',d:'Device या Mechanism जो Human Error को impossible या तुरंत detectable बनाए।'},
      {a:'5 Whys',f:'Root Cause Analysis तकनीक',d:'Problem पर 5 बार "क्यों?" पूछो। हर जवाब से deeper cause मिलता है। Root Cause = Permanent Solution।'},
      {a:'Andon',f:'Visual Alert System — दृश्य चेतावनी प्रणाली',d:'Lights/Sounds जो Production Problem तुरंत display करें। Operator Line रोक सकता है — Quality First।'},
      {a:'SMED',f:'Single-Minute Exchange of Die — त्वरित Changeover',d:'Changeover/Setup time को 9 minutes से कम में लाने की technique। target: ≤15 min Setup।'},
      {a:'Kanban',f:'Visual Scheduling — Pull System (Japanese: Signboard)',d:'Production तभी हो जब Downstream process demand करे। Overproduction eliminate करता है।'},
    ]},
    {t:'📊 गुणवत्ता एवं सांख्यिकीय शब्द',c:'var(--blue)',items:[
      {a:'PDCA',f:'Plan → Do → Check → Act',d:'Continuous Improvement Cycle। W. Edwards Deming द्वारा popularise। हर Improvement Project इसी framework follow करती है।'},
      {a:'Six Sigma',f:'6σ = 3.4 Defects Per Million',d:'Statistical approach to Quality। Sigma = Standard Deviation (σ)। Near-Zero Defects का goal।'},
      {a:'PPM',f:'Parts Per Million — प्रति दस लाख भाग',d:'Defect Rate measure। 10 PPM = 10 defective per million produced। Customer Quality Standards में use।'},
      {a:'FIFO',f:'First In First Out — पहले आया, पहले जाए',d:'जो पहले आया वो पहले use हो। Boats, Wire, Raw Material — सब FIFO follow करें।'},
      {a:'UCL / LCL',f:'Upper / Lower Control Limit',d:'Statistical Process Control boundaries। Plant: AlOx OD UCL=0.47, LCL=0.42। बाहर = Out of Control।'},
      {a:'RCA',f:'Root Cause Analysis — मूल कारण विश्लेषण',d:'Problem की असली वजह खोजने की systematic process। Tools: 5 Whys, Fishbone, Pareto।'},
      {a:'DPMO',f:'Defects Per Million Opportunities',d:'Six Sigma metric। 3.4 DPMO = Six Sigma level।'},
    ]},
    {t:'🏭 उत्पादन एवं संचालन',c:'var(--orange)',items:[
      {a:'Changeover / Setup',f:'उत्पाद बदलाव — एक product से दूसरे में जाना',d:'SMED technique से Setup time कम करते हैं। target: ≤15 minutes।'},
      {a:'Downtime',f:'Machine रुकने का समय',d:'Planned: Maintenance। Unplanned: Breakdown। codes: P=Process, M=Mechanical, E=E&I, O=Others।'},
      {a:'MTBF',f:'Mean Time Between Failures',d:'दो Breakdowns के बीच average time। अधिक MTBF = अधिक reliable Machine।'},
      {a:'MTTR',f:'Mean Time To Repair',d:'Repair में average time। कम MTTR = तेज़ recovery।'},
      {a:'Takt Time',f:'Customer Demand Rate — ग्राहक मांग दर',d:'Available Time ÷ Customer Demand = Takt Time। Production इस rate पर होनी चाहिए।'},
    ]}
  ];

  var flashItems=['SOP','WI','KPI','GMP','CAPA','NCR','TPM','OEE','PDCA','PPM','SMED','FIFO','UCL','LCL','RCA','DPMO','MTBF','MTTR'];
  var allItems={};
  sections.forEach(function(s){s.items.forEach(function(i){allItems[i.a]=i.f;});});
  var flashH=flashItems.map(function(a){
    return '<div class="fcard" onclick="var ans=this.querySelector(\'.fcard-ans\');ans.style.display=ans.style.display===\'none\'?\'block\':\'none\'">'
      +'<div class="fcard-term">'+a+'</div><div class="fcard-hint">टैप करें → Full Form देखें</div>'
      +'<div class="fcard-ans">'+(allItems[a]||'')+'</div></div>';
  }).join('');

  var sectH=sections.map(function(s){
    var rows=s.items.map(function(i){
      return '<tr><td style="min-width:130px"><span style="font-family:\'Share Tech Mono\',monospace;font-weight:600;color:'+s.c+';font-size:11px">'+i.a+'</span></td>'
        +'<td style="font-size:11px;font-style:italic;color:var(--txt);min-width:160px">'+i.f+'</td>'
        +'<td style="font-size:11px;color:var(--muted);line-height:1.6">'+i.d+'</td></tr>';
    }).join('');
    return CB(s.t.split(' ')[0],s.t.replace(/^.\s/,''),s.items.length+' शब्द',
      '<table class="t"><thead><tr><th>शब्द / संक्षिप्ति</th><th>Full Form / अर्थ</th><th>हिंदी में व्याख्या</th></tr></thead><tbody>'+rows+'</tbody></table>');
  }).join('');

  pg.innerHTML=
    '<div class="ph"><div class="ph-code">संदर्भ — औद्योगिक शब्दावली</div>'
    +'<div class="ph-title">औद्योगिक <span>शब्दावली</span></div>'
    +'<div class="ph-desc">SOP, WI, 5S, TPM के 8 Pillars, Kaizen, KPI, OEE, Lean और अन्य — Full Forms, अर्थ और हिंदी में पूर्ण व्याख्या।</div>'
    +'<div class="tags"><span class="tag a">5S</span><span class="tag c">TPM 8 Pillars</span><span class="tag g">Kaizen</span><span class="tag">Lean</span></div></div>'
    +Al('i','💡','नीचे दिए गए Cards पर टैप करके Full Form देखें। खुद को Test करें — फिर विस्तृत जानकारी नीचे देखें!')
    +Al('w','📝','इन सभी शब्दों पर ज्ञान परीक्षा में प्रश्न हैं! Quiz में जाएं और अपनी तैयारी जांचें।')
    +'<div style="margin-bottom:20px">'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--gold);margin-bottom:10px">⚡ Full-Form Flash Cards — टैप करके देखें</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px">'+flashH+'</div></div>'
    +sectH;
}
