// Met Train PRO — Safety, SOPs & WIs
// ══════════════════════════════════════════════════════
// SAFETY — HINDI
// ══════════════════════════════════════════════════════
function rSafety(pg){
  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मॉड्यूल 3 — सुरक्षा एवं GMP</div>'
    +'<div class="ph-title">सुरक्षा एवं <span>GMP</span></div>'
    +'<div class="ph-desc">PPE, मशीनरी सुरक्षा, एल्युमीनियम धूल के खतरे और GMP हाइजीन — सभी कर्मचारियों के लिए अनिवार्य।</div>'
    +'<div class="tags"><span class="tag r">WI-05 / WI-14</span><span class="tag a">SOP-10</span><span class="tag c">GMP F-10</span></div></div>'
    +Al('d','⛔','अत्यंत महत्वपूर्ण: Al धूल + पानी = आग/विस्फोट! बारिश में कंटेनर न चलाएं। खुले क्षेत्र में न रखें।')
    +Al('d','⛔','PPE अनिवार्य: हेलमेट + सेफ्टी शूज़ + दस्ताने + मास्क। बिना PPE के कार्यक्षेत्र में प्रवेश वर्जित।')

    +CB('🦺','PPE आवश्यकताएं','अनिवार्य',
      '<table class="t"><thead><tr><th>PPE वस्तु</th><th>कब पहनें</th><th>मानक</th></tr></thead><tbody>'
      +'<tr><td>Safety Helmet</td><td>Crane संचालन, रोल हैंडलिंग</td><td class="tv g">अनिवार्य</td></tr>'
      +'<tr><td>Safety Shoes</td><td>उत्पादन क्षेत्र में हर समय</td><td class="tv g">अनिवार्य</td></tr>'
      +'<tr><td>रबर दस्ताने</td><td>Caustic Soda, रासायनिक कार्य</td><td class="tv g">अनिवार्य</td></tr>'
      +'<tr><td>Respiratory Mask</td><td>Vacuum Chamber, Al Dust</td><td class="tv g">अनिवार्य</td></tr>'
      +'<tr><td>Safety Goggles</td><td>Chamber सफाई, Al Dust</td><td class="tv g">अनिवार्य</td></tr>'
      +'<tr><td>Cut-Resistant Gloves</td><td>ब्लेड का कोई भी काम</td><td class="tv g">अनिवार्य</td></tr>'
      +'<tr><td>Ear Plugs</td><td>मशीन चलते समय</td><td class="tv">आवश्यक</td></tr>'
      +'</tbody></table>',true)

    +CB('⚙️','मूविंग पार्ट्स के पास काम','WI-05',
      '<ul class="steps">'
      +S(1,'<strong>चलती मशीन के Guards/Grids</strong> कभी न हटाएं।<span class="en">DO NOT remove guards/grids while machine is running.</span>')
      +S(2,'<strong>घूमते रोलर को कभी न छुएं</strong> — उंगली फंसने से गंभीर चोट।<span class="en">DO NOT touch rotating rolls — severe finger trap injury.</span>')
      +S(3,'<strong>रखरखाव कार्य से पहले</strong> घूमने वाले हिस्से हमेशा बंद करें।<span class="en">Always STOP rotating parts before maintenance work.</span>')
      +S(4,'<strong>ढीले कपड़े पहनकर</strong> काम न करें — Moving Parts में फंस सकते हैं।<span class="en">Never work with LOOSE CLOTHING — gets caught in moving parts.</span>')
      +S(5,'<strong>स्लिटर Web Break:</strong> Dancer Roller के पूरी तरह रुकने का इंतज़ार करें — फिर हाथ डालें या थ्रेड करें।<span class="en">SLITTER WEB BREAK: Wait until Dancer Roller COMPLETELY stopped before threading.</span>')
      +S(6,'<strong>स्लिटर ट्रिम लेते समय:</strong> हाथ घूमते रोलर से दूर रखें — दुर्घटना का सबसे बड़ा जोखिम।<span class="en">SLITTER TRIM: Keep hands away from rotating rollers — major accident area.</span>')
      +'</ul>')

    +CB('🌫️','Al धूल, गर्मी और शोर के खतरे','WI-14',
      '<ul class="steps">'
      +S(1,'जब Winding Cart Chamber से बाहर आए — <strong>Exhaust Fan तुरंत चालू करें</strong>।<span class="en">Turn ON exhaust fan when winding cart exits chamber.</span>')
      +S(2,'Chamber में प्रवेश से पहले <strong>1 मिनट प्रतीक्षा करें</strong> — गर्म वाष्प निकलने दें।<span class="en">Wait 1 minute for hot vapours to exhaust before entering.</span>')
      +S(3,'Chamber और Winding Section सफाई करते समय: <strong>Mask + Gloves + Goggles</strong> हमेशा।<span class="en">PPE: Mask + Gloves + Goggles always when cleaning chamber.</span>')
      +S(4,'सभी Al Scrap बैग में इकट्ठा करें। <strong>पानी से बिल्कुल संपर्क न हो।</strong><span class="en">Collect all Al scrap. MUST NOT contact water.</span>')
      +S(5,'यदि Al Scrap पानी में भीग जाए — पैक करने या चलाने से पहले पूरी तरह सुखाएं।<span class="en">If Al scrap gets wet — dry completely before moving.</span>')
      +S(6,'Al Dust कंटेनर को <strong>साप्ताहिक</strong> Stores को सौंपें।<span class="en">Transfer Al dust to stores for disposal weekly.</span>')
      +S(7,'गर्म मशीन के हिस्से दस्ताने के बिना न छुएं। असामान्य आवाज़ Maintenance को बताएं।<span class="en">No bare hands on hot parts. Report abnormal sounds to maintenance.</span>')
      +'</ul>'
      +Al('d','⛔','Al धूल + पानी = Class D आग का खतरा! अनायास आग लग सकती है। भंडारण या परिवहन के नियमों में कोई ढील नहीं।'))

    +CB('🗑️','Al Dust निपटान','SOP-10',
      '<ul class="steps">'
      +S(1,'Metalliser-1 और Metalliser-2 के Source Section से Scrapping Tools से Al Dust खुरचें।<span class="en">Scrape Al dust from Metalliser-1 and Metalliser-2 source section with scrapping tools.</span>')
      +S(2,'Setup समय के दौरान 20-लीटर धातु कंटेनर में इकट्ठा करें।<span class="en">Collect in 20-litre metal container during setup time.</span>')
      +S(3,'Setup के बाद: 20L से Metalliser-2 के पास 500L कंटेनर में स्थानांतरित करें।<span class="en">Transfer from 20L to 500L container near Metalliser-2 after setup.</span>')
      +S(4,'जब 500L में Jumbo Bag भर जाए — Forklift से Scrap Yard भेजें।<span class="en">When 500L Jumbo Bag is full — forklift to scrap yard.</span>')
      +'</ul>'
      +Al('d','⛔','बारिश में Al कंटेनर न चलाएं। खुले क्षेत्र में कभी न रखें। पानी संपर्क = आग का खतरा।'))

    +CB('🧼','GMP — व्यक्तिगत स्वच्छता','GMP F-10',
      '<ul class="steps">'
      +S(1,'उत्पादन क्षेत्र में हमेशा उचित वर्दी और Safety Shoes पहनें।')
      +S(2,'बाल हमेशा दी गई Cap से ढके रहें।')
      +S(3,'नाखून: छोटे, साफ, कोई पॉलिश नहीं। कोई Artificial Nails नहीं।')
      +S(4,'प्लांट में कोई आभूषण नहीं (अंगूठी, चेन, चूड़ी)।')
      +S(5,'बार-बार और Critical Control Points पर हाथ धोएं व Sanitise करें।')
      +S(6,'हाथ पर जलन/घाव हो तो पट्टी बांधें और Disposable Glove पहनें।')
      +S(7,'पूरे प्लांट में कहीं भी खाना, पीना, चबाना, धूम्रपान या तंबाकू बिल्कुल मना है।')
      +'</ul>')

    +CB('🏭','5S हाउसकीपिंग','WI-21',
      Al('i','🏆','5S हर दिन — केवल Audit के लिए नहीं।')
      +'<ul class="steps">'
      +S(1,'Sort (छाँटें), Set in Order (सजाएं), Shine (साफ करें), Standardise (मानकीकृत करें), Sustain (बनाए रखें) — रोज़ाना अनुशासन।')
      +S(2,'फर्श, मशीन और आसपास का क्षेत्र हमेशा चमकदार स्थिति में।')
      +S(3,'Daily 5S Check Sheet भरें — Shift Supervisor जांचें।')
      +S(4,'फर्श पर धूल, टेप के टुकड़े या बेयर बैग न छोड़ें।')
      +'</ul>');
}

// ══════════════════════════════════════════════════════
// SOPs — FULL CONTENT
// ══════════════════════════════════════════════════════

var SOP_DETAIL = {

'SOP-02': {
  code:'MET/SOP/02', title:'Jumbo Roll Movement — Metallised Floor',
  scope:'Metallizer', resp:['Metallizer Operator','Metallizer Trainee Operator'],
  body: function(){
    return CB('📋','उद्देश्य / Purpose','',
      Al('i','ℹ️','Primary Slitter से Metalliser Area तक Jumbo Roll को सुरक्षित रूप से स्थानांतरित करना।'))
    +CB('🔢','चरण-दर-चरण निर्देश','Step-by-Step Instructions',
      '<ul class="steps">'
      +S(1,'<strong>Conveyor से Roll लाएं</strong> — Primary Slitter से Metalliser Area तक Conveyor <span class="tv">conveyor start, 20, 21, 22, 23</span> का उपयोग करें।<span class="en">Bring roll from Primary Slitter to Metalliser using Conveyor conveyor start/20/21/22/23</span>')
      +S(2,'<strong>Core Plug लगाएं</strong> — Roll को Crane से उठाने से पहले दोनों सिरों पर Core Plug लगाएं।<span class="en">Insert Core Plug at both ends before lifting</span>')
      +S(3,'<strong>Overhead Crane और Sling Belt</strong> — Capacity <span class="tv">5 MT से अधिक</span> वाली Sling Belt का उपयोग करें। Safety Helmet अनिवार्य रूप से पहनें।<span class="en">Use Overhead Crane & Sling Belt capacity >5MT. Safety Helmet mandatory.</span>')
      +S(4,'<strong>Sling Belt की जाँच करें</strong> — उठाने से पहले सुनिश्चित करें कि Sling Belt क्षतिग्रस्त नहीं है। क्षतिग्रस्त Belt से गंभीर दुर्घटना हो सकती है।<span class="en">Check Sling Belt is not damaged — damaged belt can cause serious accident.</span>')
      +S(5,'<strong>Foam Sheet लगाएं</strong> — Roll उठाते समय दोनों सिरों पर Foam Sheet लगाएं ताकि Sling Belt से Roll क्षतिग्रस्त न हो।<span class="en">Use Foam Sheet at both ends so roll is not damaged by Sling Belt.</span>')
      +'</ul>'
      +Al('d','⛔','बिना Safety Helmet, बिना Core Plug और क्षतिग्रस्त Sling Belt से Roll कभी न उठाएं।'))
  }
},

'SOP-04': {
  code:'MET/SOP/04', title:'AlBond Metallization — Operating Parameters',
  scope:'Metallizer', resp:['Metallizer Operator','Metallizer Supervisor'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      Al('i','ℹ️','Metallised Finished Rolls में Metal Bond Strength की Quality बनाए रखने के लिए Standard Parameters।'))
    +CB('📊','ABM22 — पैरामीटर तालिका','Material: 3SF-G10301ABM22 / G12301ABM22 | OD: 2.2–2.5',
      '<table class="t"><thead><tr><th>#</th><th>Control Parameter</th><th>Value</th><th>Unit</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td>Alubond Intensity (O₂ Supply)</td><td class="tv g">5.0 – 5.5</td><td>Machine Recipe (~400 SCCM)</td></tr>'
      +'<tr><td class="tv">2</td><td>Speed of Machine</td><td class="tv g">650</td><td>Meter/Min</td></tr>'
      +'<tr><td class="tv">3</td><td>Plasma Unit Power</td><td class="tv">5</td><td>kW</td></tr>'
      +'<tr><td class="tv">4</td><td>Plasma Unit Gas Flow</td><td class="tv">1000</td><td>SCCM</td></tr>'
      +'<tr><td class="tv">5</td><td>Oxygen Gas Supply</td><td class="tv">80</td><td>%</td></tr>'
      +'</tbody></table>',true)
    +CB('📊','ABM25 — पैरामीटर तालिका','Material: 3SF-G10301M22/M25 / G12301M22/M25 | OD: 2.2–2.5',
      '<table class="t"><thead><tr><th>#</th><th>Control Parameter</th><th>Value</th><th>Unit</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td>Alubond Intensity (O₂ Supply)</td><td class="tv g">4.0 – 4.5</td><td>Machine Recipe (~320 SCCM)</td></tr>'
      +'<tr><td class="tv">2</td><td>Speed of Machine</td><td class="tv g">750</td><td>Meter/Min</td></tr>'
      +'<tr><td class="tv">3</td><td>Plasma Unit Power</td><td class="tv">5</td><td>kW</td></tr>'
      +'<tr><td class="tv">4</td><td>Plasma Unit Gas Flow</td><td class="tv">1000</td><td>SCCM</td></tr>'
      +'<tr><td class="tv">5</td><td>Oxygen Gas Supply</td><td class="tv">80</td><td>%</td></tr>'
      +'</tbody></table>',true)
    +Al('w','⚠️','Base Film Surface Energy <strong>>54 Dynes</strong> होनी चाहिए। उपरोक्त Values Maximum हैं — TDS के अनुसार Quality के लिए।')
  }
},

'SOP-05': {
  code:'MET/SOP/05', title:'Met CPP — Standard Operating Parameters',
  scope:'Metallizer', resp:['Metallizer Operator','Metallizer Supervisor'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      Al('i','ℹ️','CPP Metallised Film की Quality बनाए रखना। Waste Target: 5.1% (Sheet 4.1% + Trim 1%)'))
    +CB('📋','सामग्री विवरण','Material Details',
      '<ul class="steps">'
      +S('','<strong>Material Type:</strong> <span class="tv">30 MIC CPP, 20 MIC CPP</span> (COF = 0.2)')
      +S('','<strong>Average Width:</strong> <span class="tv">2090 MM</span>')
      +S('','<strong>Jumbo Length:</strong> <span class="tv">14,500 Meters</span>')
      +S('','<strong>Optical Density:</strong> <span class="tv g">2.2</span>')
      +'</ul>')
    +CB('📊','Standard Operating Parameters','CPP Metallization Parameters',
      '<table class="t"><thead><tr><th>#</th><th>Control Parameter</th><th>Value</th><th>Unit</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td>Coating Drum Temperature</td><td class="tv b">-20</td><td>°C</td></tr>'
      +'<tr><td class="tv">2</td><td>Speed of Machine</td><td class="tv g">660</td><td>Meter/Min</td></tr>'
      +'<tr><td class="tv">3</td><td>Rewinder Tension (2090MM)</td><td class="tv">120 – 150</td><td>Newton</td></tr>'
      +'<tr><td class="tv">4</td><td>Rewinder Winding Direction</td><td class="tv g">OUT</td><td>Threading Direction</td></tr>'
      +'</tbody></table>',true)
    +Al('w','⚠️','COF 0.2 + Anti-Blocking Agent के कारण Tension 120–150N बनाए रखें। Direction हमेशा <strong>OUT</strong>।')
  }
},

'SOP-06': {
  code:'MET/SOP/06', title:'OD Set Parameters',
  scope:'Metalliser-1 & 2', resp:['Met Operators','Supervisor'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      '<ul class="steps">'
      +S('A','Bare Waste Percentage एक Jumbo में <span class="tv r">500m (1%)</span> से अधिक नहीं होनी चाहिए।')
      +S('B','Optical Density Values सख्ती से Range में होनी चाहिए।')
      +'</ul>')
    +CB('📊','OD Set Point तालिका','Hawk Eye Set Points — Customer-wise',
      '<table class="t"><thead><tr><th>Customer OD</th><th>Min (-5%)</th><th>Max (+5%)</th><th>Metalliser-1 Hawkeye Max</th><th>Metalliser-2 Hawkeye Max</th><th>JAYESH/KFLEX/Prakash Pipe (Max)</th></tr></thead><tbody>'
      +'<tr><td class="tv">2.2</td><td>2.09</td><td>2.31</td><td class="tv g">2.2</td><td class="tv g">2.2</td><td class="tv" style="color:var(--orange)">2.4</td></tr>'
      +'<tr><td class="tv">2.5</td><td>2.37</td><td>2.63</td><td class="tv g">2.5</td><td class="tv g">2.5</td><td class="tv" style="color:var(--orange)">2.7</td></tr>'
      +'<tr><td class="tv">2.8</td><td>2.66</td><td>2.94</td><td class="tv g">2.8</td><td class="tv g">2.8</td><td class="tv" style="color:var(--orange)">3.0</td></tr>'
      +'</tbody></table>',true)
    +Al('w','⚠️','Supervisor: Quality और OD Set Points के अनुसार material produce करें ताकि Aluminum Wire Consumption नियंत्रण में रहे।')
  }
},

'SOP-07': {
  code:'MET/SOP/07', title:'Bare Waste Control',
  scope:'Metalliser-1 & 2', resp:['Met Operators','Supervisor'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      '<ul class="steps">'
      +S('A','एक Jumbo में Bare Waste Percentage <span class="tv r">500m (1%)</span> से अधिक नहीं होनी चाहिए।')
      +S('B','Optical Density Values सख्ती से Range में होनी चाहिए।')
      +'</ul>')
    +CB('📊','Unwinder Stop Diameter — Core-wise','Metalliser-1 & Metalliser-2',
      '<table class="t"><thead><tr><th>मशीन</th><th>Core Type</th><th>Core Size</th><th>Stop Diameter</th></tr></thead><tbody>'
      +'<tr><td class="tv">Metalliser-1</td><td>Steel Core</td><td>6"</td><td class="tv g">181 mm</td></tr>'
      +'<tr><td class="tv">Metalliser-1</td><td>Paper Core</td><td>6" (12mm)</td><td class="tv g">184 mm</td></tr>'
      +'<tr><td class="tv">Metalliser-1</td><td>Paper Core</td><td>6" (14mm)</td><td class="tv g">188 mm</td></tr>'
      +'<tr><td class="tv">Metalliser-2</td><td>Steel Core</td><td>8"</td><td class="tv g">222 mm</td></tr>'
      +'<tr><td class="tv">Metalliser-2</td><td>Paper Core</td><td>8" (17mm)</td><td class="tv g">241 mm</td></tr>'
      +'<tr><td class="tv">Metalliser-2</td><td>Paper Core</td><td>8" (19mm)</td><td class="tv g">245 mm</td></tr>'
      +'</tbody></table>',true)
    +Al('w','⚠️','Supervisor: Bare Waste <span class="tv">≤500m per Jumbo</span> — Target <strong>0.7%</strong> के अंदर रखें।')
  }
},

'SOP-08': {
  code:'MET/SOP/08', title:'Source Section Copper Clamp Change (Hindi)',
  scope:'Metallizer', resp:['Metallizer Operator','Metallizer Supervisor'],
  body: function(){
    return CB('🔧','ज़रूरी Spares और Tools','Required Spares & Tools',
      '<ul class="steps">'
      +S('1.1','<strong>Copper Clamp</strong>')
      +S('1.2','<strong>Hex Bolt</strong> और <strong>Torque Wrench / Spanner</strong> (Clamp के बोल्ट कसने के लिए)')
      +S('1.3','<strong>Scotch-Brite Pad</strong> (Bus-bar / Clamp Surface साफ करने के लिए)')
      +'</ul>')
    +CB('🔢','चरण-दर-चरण प्रक्रिया','Step-by-Step Procedure',
      '<ul class="steps">'
      +S(1,'<strong>SCADA स्क्रीन पर जाएं।</strong> Pneumatic Valve के <span class="tv r">RED (लाल)</span> होने का इंतज़ार करें। लाल = Valve पूरा बंद। Valve बंद होने से पहले आगे का कोई स्टेप न करें।')
      +S(2,'<strong>Main Butterfly Valve</strong> ढूंढें और हाथ से पूरा बंद करें — ताकि Evaporation Source में पानी न जाए।')
      +S(3,'जब Main Valve बंद हो जाए, तब <strong>छोटा Butterfly Valve खोलें।</strong> पाइप में बचा सारा पानी पूरी तरह निकलने दें।')
      +S(4,'पानी पूरी तरह drain होने के बाद ही — जला हुआ या खराब सतह वाला <strong>Copper Clamp निकालें।</strong> गर्म सतह या गीले हिस्से को हाथ न लगाएं।')
      +S(5,'<strong>Scotch-Brite Pad</strong> से Bus-bar और Clamp की बैठने वाली सतह को अच्छे से साफ करें। काला Carbon, Dust, या खराब परत पूरी तरह हटाएं।')
      +S(6,'<strong>नया Copper Clamp</strong> सही से Fit करें, Hex Bolt को Torque Wrench/Spanner से कसें। सभी Valve अपनी Original Running Position में करें: ✔ Source की तरफ जाने वाला Valve OPEN करें ✔ Drain Valve CLOSE करें।')
      +'</ul>'
      +Al('d','⛔','पानी पूरी तरह Drain हुए बिना Copper Clamp न बदलें। Hot Surface को बिना Gloves के न छुएं।'))
  }
},

'SOP-09': {
  code:'MET/SOP/09', title:'Slitting Parameters — Ripple Free Material',
  scope:'Met Slitter-1 & 2', resp:['Slitter Operators','Supervisor'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      Al('i','ℹ️','Ripple और Vertical Line Impression मुक्त Quality Material तैयार करना।'))
    +CB('📊','Standard Operating Parameters','Ripple-Free Slitting',
      '<table class="t"><thead><tr><th>Parameter</th><th>Set Value</th><th>Unit</th></tr></thead><tbody>'
      +'<tr><td>Rewinding Tension</td><td class="tv g">90</td><td>N/M</td></tr>'
      +'<tr><td>Rewinding Nip Pressure</td><td class="tv g">700</td><td>N/m²</td></tr>'
      +'<tr><td>Machine Speed</td><td class="tv g">500</td><td>M/Min</td></tr>'
      +'<tr><td>Unwinder Tension</td><td class="tv g">90</td><td>N/M</td></tr>'
      +'</tbody></table>',true)
    +CB('✅','Operator जिम्मेदारियां','Operator Responsibilities',
      '<ul class="steps">'
      +S(1,'Nip Roll पर कोई <strong>Non-Uniformity या Cut Marks</strong> नहीं होने चाहिए।')
      +S(2,'ऊपर दिए गए <strong>Standard Set Point Values</strong> बनाए रखें।')
      +'</ul>')
    +Al('w','⚠️','Supervisor: Material Ripple Free हो और Finished Roll पर कोई Vertical Line Impression न हो — यह सुनिश्चित करें।')
  }
},

'SOP-10': {
  code:'MET/SOP/10', title:'Aluminum Dust Waste Disposal',
  scope:'Aluminum Dust Waste Disposal', resp:['Metallizer Operator','Metallizer Supervisor'],
  body: function(){
    return CB('🔢','चरण-दर-चरण निर्देश','Step-by-Step Instructions',
      '<ul class="steps">'
      +S(1,'Metalliser-1 और Metalliser-2 के <strong>Source Section</strong> से Scrapping Tools की मदद से Al Dust खुरचें।<span class="en">Scrape Al dust from source section of Metalliser-1 & Metalliser-2 using scrapping tools.</span>')
      +S(2,'Setup Time के दौरान <span class="tv">20-Litre Metal Container</span> में इकट्ठा करें।<span class="en">Collect in 20L metal container during setup time.</span>')
      +S(3,'Setup पूरा होने के बाद 20L Container से <span class="tv">Metalliser-2 के पास रखे 500-Litre Container</span> में स्थानांतरित करें।<span class="en">After setup, transfer from 20L to 500L container near Metalliser-2.</span>')
      +S(4,'जब 500L Container का Jumbo Bag भर जाए — <strong>Forklift</strong> से Scrap Yard भेजें।<span class="en">When Jumbo Bag in 500L container is full — forklift to scrap yard.</span>')
      +'</ul>')
    +CB('📦','Container विवरण','Container Details',
      '<div class="compare"><div class="cbox"><div class="cbox-t">20 Litre Container</div><div class="cr"><span class="ck">उपयोग</span><span class="cv">Setup के दौरान</span></div><div class="cr"><span class="ck">Material</span><span class="cv">Metal</span></div><div class="cr"><span class="ck">Location</span><span class="cv">Source Section</span></div></div>'
      +'<div class="cbox"><div class="cbox-t">500 Litre Container</div><div class="cr"><span class="ck">उपयोग</span><span class="cv">Weekly disposal</span></div><div class="cr"><span class="ck">Location</span><span class="cv">Near Metalliser-2</span></div><div class="cr"><span class="ck">Transfer</span><span class="cv">Forklift to Scrap Yard</span></div></div></div>')
    +Al('d','⛔','<strong>बारिश में Al Dust Container न चलाएं।</strong> खुले क्षेत्र में कभी न रखें। पानी संपर्क = Class D आग का खतरा!')
  }
},

'WI-03': {
  code:'MET/WI/03', title:'Bare Film Selection for Metallizer',
  scope:'Metallizer', resp:['Metallizer Operator','Metallizer Supervisor'],
  body: function(){
    return CB('🔢','चरण-दर-चरण निर्देश','Step-by-Step Instructions',
      '<ul class="steps">'
      +S(1,'<strong>Planning Format MET/F/04</strong> चेक करें।<span class="en">Check Planning Format MET/F/04.</span>')
      +S(2,'Plan के अनुसार Roll Select करें।<span class="en">Select roll as per plan.</span>')
      +S(3,'<strong>किस Side पर Metallization</strong> करनी है, यह चेक करें।<span class="en">Check which side to metallize.</span>')
      +S(4,'Crane की मदद से Roll को Metallizer Machine के पीछे लाएं।<span class="en">Bring roll behind metallizer machine using crane.</span>')
      +S(5,'Roll Width के अनुसार सही <strong>Shield Plate</strong> चुनें।<span class="en">Choose suitable shield plate as per roll width.</span>')
      +S(6,'Al Deposit साफ होने के बाद Shields को बचाने और आसान Removal के लिए <strong>Graphite Suspension Paint</strong> लगाएं।<span class="en">Apply Graphite Suspension Paint to protect shields and ease removal.</span>')
      +S(7,'Shield को ऊपर उठाएं।<span class="en">Take the shield up.</span>')
      +S(8,'Shield Plate को Film End से Tolerance Limit की दूरी पर Adjust करें — Touch नहीं होनी चाहिए।<span class="en">Adjust shield plate at tolerance limit distance from film end — must not touch.</span>')
      +'</ul>')
  }
},

'WI-04': {
  code:'MET/WI/04', title:'Boat Change Programme',
  scope:'Metallizer', resp:['Metallizer Operator'],
  body: function(){
    return CB('🔧','Boat Change कार्यक्रम','Work Instructions',
      '<ul class="steps">'
      +S('A','<strong>Evaporator Side</strong> को पूरी तरह साफ करें।<span class="en">Clean Evaporator side thoroughly.</span>')
      +S('B','<strong>Drum और Shield</strong> को Aluminium Oxide से मुक्त करें।<span class="en">Clean drum and shield free from aluminium oxide.</span>')
      +S('C','Source से सारा Al Dust हटाने के लिए <strong>Vacuum Cleaner</strong> का उपयोग करें।<span class="en">Use vacuum cleaner to remove all Al dust from source.</span>')
      +S('D','सभी Individual Roll Cycle Procedures Follow करें।<span class="en">Follow all individual roll cycle procedures.</span>')
      +S('E','Boat के दोनों सिरों पर <strong>Graphite Foil</strong> लगाएं।<span class="en">Use Graphite Foil at both ends of boat.</span>')
      +S('F','Boats को <strong>कसकर</strong> Fit करें।<span class="en">Boats should be fitted tightly.</span>')
      +S('G','सभी Roller और Plasma साफ करें।<span class="en">Clean all rollers and plasma.</span>')
      +'</ul>'
      +Al('w','⚠️','Boat Change से पहले Chamber Vent करें। Graphite Foil के बिना Boat नहीं लगाएं।'))
  }
},

'WI-05': {
  code:'MET/WI/05', title:'People Working Along with Moving Parts',
  scope:'Metalliser Department', resp:['All Operators'],
  body: function(){
    return CB('⛔','Moving Parts — सुरक्षा नियम','Safety Rules',
      '<ul class="steps">'
      +S(1,'मशीन Running Condition में <strong>Guards/Grids को न हटाएं।</strong><span class="en">Do NOT remove guards/grids while machine is running.</span>')
      +S(2,'<strong>घूमते Rolls को कभी न छुएं</strong> — उंगलियां फंस सकती हैं।<span class="en">Do NOT touch rotating rolls — fingers may get trapped.</span>')
      +S(3,'घूमती या चलती Machinery Parts के पास झुकें या बहुत करीब न जाएं।<span class="en">Do not lean or go very close to rotating/moving machinery parts.</span>')
      +S(4,'मशीन पर काम करने से पहले <strong>हमेशा Rotating Parts बंद करें।</strong><span class="en">Always STOP rotating parts before working on machine.</span>')
      +S(5,'<strong>ढीले कपड़े</strong> पहनकर काम कभी न करें — फंसने का खतरा।<span class="en">Never work with loose clothes — danger of being caught.</span>')
      +S(6,'Production Area में हमेशा <strong>Safety Shoes</strong> पहनें।<span class="en">Always wear safety shoes in production area.</span>')
      +S(7,'Winding Cart को Chamber में/बाहर ले जाते समय रास्ता साफ रखें।<span class="en">Ensure path is free when moving Winding Cart in/out of chamber.</span>')
      +S(8,'<strong>Slitter Web Break:</strong> Dancer Roller पूरी तरह रुकने तक हाथ न डालें और Threading न करें। (Majorly Accident Prone)<span class="en">SLITTER WEB BREAK: Do not put hand or thread until Dancer Roller completely stopped.</span>')
      +S(9,'<strong>Slitter Trim लेते समय:</strong> घूमते Roller के पास हाथ न डालें। (Majorly Accident Prone)<span class="en">SLITTER TRIM: Keep hands away from rotating rollers.</span>')
      +'</ul>'
      +Al('d','⛔','ये Safety Rules अनिवार्य हैं। उल्लंघन पर तुरंत Disciplinary Action लिया जाएगा।'))
  }
},

'WI-06': {
  code:'MET/WI/06', title:'Coating Drum Cleaning',
  scope:'Metallizer Machine', resp:['Metallizer Operator','Metallizer Trainee Operator'],
  body: function(){
    return CB('🔢','Coating Drum Cleaning Procedure','Step-by-Step',
      '<ul class="steps">'
      +S(1,'Drum से सारी Film हटाएं।<span class="en">Remove any film from the drum.</span>')
      +S(2,'Foot Switch से Drum चलाएं।<span class="en">Run the drum using foot switch.</span>')
      +S(3,'Drum Cleaner Tool से Drum की पूरी Surface साफ करें।<span class="en">Use drum cleaner tool to clean entire drum surface.</span>')
      +S(4,'Perfect Cleaning के लिए <strong>Acetone</strong> का उपयोग करें।<span class="en">Use Acetone for perfect cleaning.</span>')
      +S(5,'<strong>Caustic Soda (&lt;20%) Mild Solution</strong> उपयोग कर सकते हैं — लेकिन <span class="tv r">रबर दस्ताने अनिवार्य</span> हैं, नहीं तो कुछ समय बाद हाथ जल जाएंगे।<span class="en">Caustic Soda mild solution can be used — USE RUBBER GLOVES, otherwise hand will burn.</span>')
      +'</ul>'
      +Al('d','⛔','Acetone को Machine के पास न रखें। Closed Container में Store करें।'))
  }
},

'WI-09': {
  code:'MET/WI/09', title:'Shaft Fixed in Bare Roll for Metallization',
  scope:'Metallizer', resp:['Metallizer Operators & Trainee Operators','Met Slitter Operators & Trainee Operators'],
  body: function(){
    return CB('🔢','चरण-दर-चरण निर्देश','Shaft Fixing Procedure',
      '<ul class="steps">'
      +S(1,'<strong>Crane और Belt</strong> का उपयोग करके Shaft लें।<span class="en">Take the shaft using crane and belt.</span>')
      +S(2,'Selected Roll के Core में Shaft डालें।<span class="en">Enter the shaft into the core of selected roll.</span>')
      +S(3,'Shaft को Roll के <strong>Centre</strong> पर Adjust करें।<span class="en">Adjust shaft at centre of roll.</span>')
      +S(4,'<strong>Torque Wrench और Shaft Key</strong> का उपयोग करके Shaft को <span class="tv g">160 NM Torque Value</span> पर कसें।<span class="en">Use Torque Wrench & shaft key to tighten shaft at 160NM torque value.</span>')
      +S(5,'Shaft को Roll में Insert करने के लिए <strong>Electric Trolley</strong> का उपयोग करें।<span class="en">Use electric trolley to insert shaft in the roll.</span>')
      +'</ul>'
      +Al('w','⚠️','Torque Value <span class="tv g">160 NM</span> — इससे कम या अधिक नहीं। Shaft ठीक से Center होनी चाहिए।'))
  }
},

'WI-10': {
  code:'MET/WI/10', title:'Loading and Unloading Roll in the Machine',
  scope:'Metallizer Machine', resp:['Metallizer Operator'],
  body: function(){
    return CB('🔢','Unloading (Metallized Roll निकालना)','Unload Steps',
      '<ul class="steps">'
      +S(1,'<strong>Tension Off</strong> करें।<span class="en">Set tension off.</span>')
      +S(2,'Metallized Roll को Free करने के लिए <strong>Film काटें।</strong><span class="en">Cut film to free the metallized roll.</span>')
      +S(3,'दोनों तरफ के <strong>Chucks Unlock</strong> करें।<span class="en">Unlock chucks from both sides.</span>')
      +S(4,'Crane लें और Metallized Roll Shaft पर <strong>Hanger Fix</strong> करें।<span class="en">Take crane and fix hanger on metallized roll shaft.</span>')
      +S(5,'Lift करने से पहले सुनिश्चित करें कि <strong>दोनों तरफ Hanger ठीक से Fixed</strong> है।<span class="en">Ensure both side hangers are properly fixed before lifting.</span>')
      +S(6,'Rewind Roll को Machine से <strong>बहुत धीरे-धीरे</strong> निकालें और Belt पर रखें।<span class="en">Take rewind roll out very slowly and place on belt.</span>')
      +S(7,'Felt पर कोई <strong>Metal Piece, Oil या Grease नहीं</strong> होना चाहिए — Metallized Roll Contaminate हो सकता है।<span class="en">Ensure no metal piece, oil or grease on felt — may contaminate metallized roll.</span>')
      +'</ul>')
    +CB('📥','Loading (नया Roll लगाना)','Load Steps',
      '<ul class="steps">'
      +S(8,'Crane की मदद से Rewind Empty Core Shaft को Rewinder में Shift करें और अगले Metallize Roll के लिए <strong>ठीक से Chuck करें।</strong><span class="en">Shift empty core shaft to rewinder and chuck properly for next roll.</span>')
      +S(9,'Metallization के लिए नया Roll Unwinder में लगाएं और <strong>ठीक से Lock करें।</strong><span class="en">Put new roll in unwinder and lock properly.</span>')
      +'</ul>')
  }
},

'WI-14': {
  code:'MET/WI/14', title:'Release of Aluminium Stray/Dust, Heat & Noise',
  scope:'Metallizer', resp:['Metallizer Operator'],
  body: function(){
    return CB('🌫️','Al Dust और गर्मी — निर्देश','Al Dust & Heat Instructions',
      '<ul class="steps">'
      +S(1,'Winding Cart जब Chamber से बाहर आए — <strong>Exhaust Fan तुरंत ON करें।</strong><span class="en">Turn ON exhaust fan when winding cart exits chamber.</span>')
      +S(2,'Chamber में तुरंत प्रवेश न करें — <strong>1 मिनट प्रतीक्षा करें</strong> जब तक गर्म Vapors Exhaust Fan सोख न लें।<span class="en">Wait 1 minute for hot vapours to exhaust before entering.</span>')
      +S(3,'Vacuum Chamber और Winding Section की सफाई करते समय: <strong>Respiratory Mask + Gloves + Safety Goggles</strong> हमेशा पहनें।<span class="en">Wear PPE: Mask + Gloves + Goggles always when cleaning.</span>')
      +S(4,'Diffusion Pump अंदर सफाई करते समय <strong>Pause लें।</strong> घुटन महसूस हो तो तुरंत बाहर आएं।<span class="en">Take pause while cleaning diffusion pump. If feel congestion, immediately come out.</span>')
      +S(5,'सभी Stray Al Scrap को बैग में इकट्ठा करें। <strong>पानी से बिल्कुल संपर्क न हो।</strong><span class="en">Collect all stray Al scrap in bag. Must NOT contact water.</span>')
      +S(6,'Al Scrap पानी में भीग जाए — <strong>पैक या Move करने से पहले पूरी तरह सुखाएं।</strong><span class="en">If Al scrap gets wet — dry completely before packing/moving.</span>')
      +S(7,'Al Dust और Stray Al <strong>साप्ताहिक आधार</strong> पर Stores को Disposal के लिए सौंपें।<span class="en">Transfer to stores for disposal on weekly basis.</span>')
      +S(8,'Machine के गर्म हिस्सों को बिना Hand Gloves के <strong>न छुएं।</strong><span class="en">Do not touch any machine hot parts without hand gloves.</span>')
      +S(9,'Cleaning Agent (Acetone) को Machine से दूर रखें और <strong>Closed Containers</strong> में Store करें।<span class="en">Acetone must be kept away from machine — store in closed containers.</span>')
      +'</ul>')
    +CB('🔊','Noise — निर्देश','Noise Instructions',
      '<ul class="steps">'
      +S(1,'मशीन Running Condition में हमेशा <strong>Ear Plugs</strong> पहनें।')
      +S(2,'Machinery से कोई असामान्य आवाज़ आए तो तुरंत <strong>Maintenance Department</strong> को सूचित करें।')
      +'</ul>')
    +Al('d','⛔','Al Dust + पानी = <strong>Class D आग!</strong> पानी संपर्क = अनायास आग का खतरा।')
  }
},

'WI-15': {
  code:'MET/WI/15', title:'Releasing and Storage of Used Paper Tape',
  scope:'Metallizer', resp:['Metallizer Supervisor','Metallizer Operator'],
  body: function(){
    return CB('🔢','चरण-दर-चरण निर्देश','Paper Tape Removal & Storage',
      '<ul class="steps">'
      +S(1,'सुनिश्चित करें कि Shields ठीक से Set हैं और Paper Masking Tape अत्यधिक गर्मी के संपर्क में नहीं आई है।<span class="en">Ensure shields are set properly and paper masking tape is not exposed to excess heat.</span>')
      +S(2,'Paper Tape को <strong>धीरे-धीरे हटाएं।</strong> इकट्ठा करते समय Abrasion से बचें।<span class="en">Remove paper tape gently. Avoid abrasion while collecting.</span>')
      +S(3,'Chill Roll को Acetone से साफ करते समय सुनिश्चित करें कि उस पर <strong>कोई Used Paper Tape न बचे।</strong><span class="en">Ensure no used paper tape left on chill roll while cleaning with Acetone.</span>')
      +S(4,'निकाली हुई Paper Tape को <strong>Metallic Dust Bin में डालें</strong> और ठीक से बंद करें।<span class="en">Put peeled paper tape in Metallic Dust Bin and close properly.</span>')
      +S(5,'Paper Tape हटाते समय आंखों की सुरक्षा के लिए <strong>Safety Goggles</strong> पहनें।<span class="en">Wear safety goggles while removing paper tape to avoid eye injury.</span>')
      +S(6,'सुनिश्चित करें कि Paper Tape Acetone के संपर्क में <strong>न आए।</strong><span class="en">Ensure it does not encounter Acetone.</span>')
      +S(7,'<strong>Hand Gloves</strong> पहनें। Acetone-soaked Gloves को Used Paper Tape से दूर रखें।<span class="en">Use hand gloves. Keep Acetone-soaked gloves away from used paper tape.</span>')
      +S(8,'<strong>Respiration Mask</strong> पहनें।<span class="en">Use respiration mask.</span>')
      +'</ul>')
  }
},

'WI-16': {
  code:'MET/WI/16', title:'Metallizer Maintenance Work in Every Cycle',
  scope:'Metallizer', resp:['Metallizer Operator'],
  body: function(){
    return CB('🔧','हर Cycle में Maintenance Checklist','Every-Cycle Maintenance',
      '<ul class="steps">'
      +S('A','<strong>Boats जांचें और साफ करें।</strong><span class="en">Check and Clean Boats.</span>')
      +S('B','<strong>Wire Feed Unit और Wire Position</strong> जांचें और ठीक करें।<span class="en">Check and correct wire feed unit and wire position.</span>')
      +S('C','<strong>Shutter साफ करें।</strong><span class="en">Clean the Shutter.</span>')
      +S('D','Chamber के अंदर <strong>Dust Particles साफ करें।</strong><span class="en">Clean dust particles inside the chamber.</span>')
      +S('E','Shield साफ करें और <strong>Release Paint लगाएं।</strong><span class="en">Clean shield and apply release paint.</span>')
      +S('F','<strong>Drum साफ करें</strong> और नई Masking Tape लगाएं।<span class="en">Clean drum and apply new masking tape.</span>')
      +S('G','Shield Setting जांचें और जरूरत हो तो <strong>Adjust करें।</strong><span class="en">Check shield setting and adjust if required.</span>')
      +S('H','नया Roll Load करें, Rewinder Roll Unload करें और <strong>ठीक से Lock करें।</strong><span class="en">Load new roll, Unload rewinder roll and lock properly.</span>')
      +S('I','Customer की Required Metallise Side के अनुसार <strong>Web Threading</strong> करें।<span class="en">Web threading as per customer required metallise side.</span>')
      +S('J','Rewinder Side पर <strong>सही Core</strong> रखें।<span class="en">Keep proper core at rewinder side.</span>')
      +'</ul>')
  }
},

'WI-19': {
  code:'MET/WI/19', title:'Cork Tape Layering on Cork Tape Rollers',
  scope:'All Slitters — BOPET, BOPP, CPP Films', resp:['Slitter Operator','Shift In-charge / Slitting Supervisor'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      Al('i','ℹ️','Slitter Rewinder Rollers पर Cork Tape लगाने की Standard Method — Optimum Friction, Uniformity और Roller Surface Longevity सुनिश्चित करना।'))
    +CB('📐','Wrapping Angle','Recommended Angles',
      '<table class="t"><thead><tr><th>#</th><th>Angle</th><th>फायदा</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td class="tv g">30°</td><td>Strongest grip, longest tape life, high-speed ideal</td></tr>'
      +'<tr><td class="tv">2</td><td class="tv">45°</td><td>Apply करना आसान, अच्छा adhesion और smoothness</td></tr>'
      +'<tr><td class="tv r">3</td><td class="tv r">>60° या 90°</td><td>NOT Recommended — edges lift, vibration risk</td></tr>'
      +'</tbody></table>'
      +Al('i','💡','Standard Angle: <strong>30°–45°</strong> Spiral Wrapping। High-Speed Slitters (up to 1000 m/min): <strong>35°–40°</strong>। Angle Width पर निर्भर — e.g. Perimeter 440MM, 50MM Cork Tape = 75° angle।'),true)
    +CB('🔢','चरण-दर-चरण प्रक्रिया','Step-by-Step Procedure',
      '<ul class="steps">'
      +S(1,'<strong>Surface Preparation:</strong> Roller Surface को IPA / Ethyle Compound / Mild Solvent से पूरी तरह साफ करें। Dry, Dust-Free और Oil-Free होनी चाहिए।')
      +S(2,'<strong>Starting Point:</strong> Cork Tape के पहले सिरे को 2 Turns के लिए flat (0°) Fix करें। Air Bubbles हटाने के लिए मजबूती से दबाएं।')
      +S(3,'<strong>Spiral Wrapping:</strong> Tape को <span class="tv g">30°–45°</span> angle पर Roller की Length के साथ Uniformly Wrap करें। Even Tension बनाए रखें — Overstretch न करें। प्रत्येक Turn के बीच <span class="tv">2–3 mm Overlap</span> रखें (न कम, न ज्यादा)।')
      +S(4,'<strong>Finishing:</strong> Wrapping को 0° पर 2 Flat Turns के साथ End करें। End को High-Temperature Adhesive Tape या Epoxy Sealant से Secure करें।')
      +S(5,'<strong>Optional Heat Curing:</strong> Adhesive-Backed Tape होने पर 80–100°C पर Warm Air कुछ मिनट लगाएं — Better Bonding और Air Remove करने के लिए।')
      +'</ul>')
    +CB('✅❌','क्या करें / क्या न करें','Do\'s & Don\'ts',
      '<div class="compare"><div class="cbox"><div class="cbox-t">✅ DO\'S</div>'
      +'<div class="cr"><span class="ck">Spiral angle</span><span class="cv g">30°–45°</span></div>'
      +'<div class="cr"><span class="ck">Tension</span><span class="cv">Even tension</span></div>'
      +'<div class="cr"><span class="ck">Tape</span><span class="cv">Continuous, no joints</span></div>'
      +'<div class="cr"><span class="ck">Ends</span><span class="cv">Seal both ends</span></div>'
      +'</div><div class="cbox"><div class="cbox-t">❌ DON\'TS</div>'
      +'<div class="cr"><span class="ck">Wrap</span><span class="cv r">Straight (90°)</span></div>'
      +'<div class="cr"><span class="ck">Tension</span><span class="cv r">Overstretch tape</span></div>'
      +'<div class="cr"><span class="ck">Gaps</span><span class="cv r">Air gaps or folds</span></div>'
      +'<div class="cr"><span class="ck">Curing</span><span class="cv r">Oil/water contact</span></div>'
      +'</div></div>')
    +Al('s','✅','Expected Results: Smooth balanced roller, Strong friction, No film slippage, Tape life <strong>>6 months</strong>।')
  }
},

'WI-20': {
  code:'MET/WI/20', title:'Evaporation Boats Issuance & Consumption',
  scope:'All Metalliser Machines', resp:['Storekeeper','Operator','Shift Leader/Supervisor','HOD Metalliser'],
  body: function(){
    return CB('🎯','उद्देश्य / Purpose','',
      Al('i','ℹ️','100% Misuse Prevention ✔ Correct & Optimized Consumption ✔ Max Floor Stock Limit Maintained ✔ Inventory Accuracy'))
    +CB('⚠️','Stock Restrictions — सबसे महत्वपूर्ण','MOST IMPORTANT',
      '<div class="compare"><div class="cbox"><div class="cbox-t">Max Floor Stock (New+Old)</div><div class="cr"><span class="ck">Total</span><span class="cv r">400 Boats</span></div></div>'
      +'<div class="cbox"><div class="cbox-t">Max NEW Boats on Floor</div><div class="cr"><span class="ck">New</span><span class="cv r">200 Boats</span></div></div></div>'
      +Al('d','⛔','Total Floor Stock >400 = Major Violation। तुरंत Report करें।'))
    +CB('📏','Issuance Control Rules — Strict SOP','Rules',
      '<ul class="steps">'
      +S('Rule-1','<strong>Old Boats Return किए बिना NEW Boat Issue नहीं होगी।</strong> Required = Returned Old Boats। Example: 8 नई Boats चाहिए → 8 पुरानी Boats पहले Return करें।')
      +S('Rule-2','Store Issuance <strong>केवल HOD-Approved Request Slip</strong> के खिलाफ। No Slip = ZERO Issuance।')
      +'</ul>')
    +CB('🔢','Process Flow — 4 Steps','Boat Issuance Process',
      '<ul class="steps">'
      +S('Step-1','<strong>Boat Requirement Approval:</strong> Operator → Supervisor → HOD Sign। HOD Signature के बिना कोई Boat Issue नहीं।')
      +S('Step-2','<strong>Store से Issuance:</strong> Storekeeper Approved Slip Verify करेगा। Equal Old Boats Return की पुष्टि। तभी New Boats Issue।')
      +S('Step-3','<strong>Machine पर Usage:</strong> Boat Cradle में ठीक से Install करें। Power Trend, OD Trend, Consumption Monitor करें। Short/Crack/Premature Failure → तुरंत Supervisor को बताएं।')
      +S('Step-4','<strong>Old Boat Return (Anti-Theft System):</strong> Shift End पर सभी Used Boats Supervisor को दें। Supervisor Count Verify करके "Used Boat Box" में रखेगा। Daily Store को Return Count भेजें।')
      +'</ul>'
      +Al('d','⛔','Old Boats Return नहीं हुई = अगली बार एक भी New Boat Issue नहीं होगी। Missing/Unaccounted Boat = Suspension + HR Action।'))
    +CB('📊','Responsibilities Table','Responsibility Matrix',
      '<table class="t"><thead><tr><th>जिम्मेदारी</th><th>Shift Leader/Supervisor</th><th>HOD Metalliser</th></tr></thead><tbody>'
      +'<tr><td>Boat Usage Verification</td><td class="tv">✔</td><td>Boat Audit</td></tr>'
      +'<tr><td>Old Boat Return Verification</td><td class="tv">✔</td><td>Variance Investigation</td></tr>'
      +'<tr><td>Daily Consumption Entry</td><td class="tv">✔</td><td>Stock Discipline</td></tr>'
      +'<tr><td>Floor Stock Control</td><td class="tv">≤400 Total</td><td>Enforcement</td></tr>'
      +'</tbody></table>',true)
  }
},

'WI-21': {
  code:'MET/WI/21', title:'GMP & General Instructions for Team',
  scope:'Metallizer Department', resp:['All Team Members'],
  body: function(){
    return CB('🔒','1. Safety Compliance','',
      '<ul class="steps">'
      +S(1,'Conveyor Operate करते समय पूर्ण ध्यान दें। रुकने से पहले हाथ बटन से न हटाएं।')
      +S(2,'Power Failure के बाद Parameters Re-Check करें: <span class="tv">Boat Power, OD, Speed, Tension</span> Verify करें।')
      +S(3,'<span class="tv r">PPE (Helmet, Shoes, Gloves, Mask) अनिवार्य</span> — बिना PPE पकड़े जाने पर Direct Action।')
      +'</ul>')
    +CB('🎖️','2. Quality First — 0% Downgrade Policy','',
      '<ul class="steps">'
      +S(1,'किसी भी कीमत पर <span class="tv r">B-Grade Rolls नहीं</span> बनने चाहिए। हर Roll की Quality जांचें — OD, Pin Hole, Scratch, Crease, OD Bands।')
      +S(2,'OD Set Point से कम या Pin Hole दिखे → <strong>तुरंत मशीन रोकें</strong> और सूचना दें।')
      +S(3,'SAP में Roll Availability बिना जांचे कोई Roll Slit न करें। गलत Slitting पर Penalty।')
      +S(4,'<strong>Jayesh और Critical Customers</strong> का Material हमेशा <span class="tv g">Center Position</span> में लगाएं।')
      +S(5,'Masking Tape <span class="tv r">3mm से अंदर न जाए।</span> Crease/Edge Damage Operator की जिम्मेदारी।')
      +'</ul>')
    +CB('⚡','3. Production Performance Targets','',
      '<table class="t"><thead><tr><th>Target</th><th>Value</th></tr></thead><tbody>'
      +'<tr><td>Metalliser Output</td><td class="tv g">10 Rolls/Day (avg)</td></tr>'
      +'<tr><td>Roll Mix</td><td class="tv">11 Rolls (2.2 OD) + 10 Rolls (High OD)</td></tr>'
      +'<tr><td>Boat Consumption</td><td class="tv">5.6 Lakh / 8 Rolls (current <4.5L = poor)</td></tr>'
      +'<tr><td>Bare Waste Limit</td><td class="tv g">0.7% (500m / 72,000m)</td></tr>'
      +'<tr><td>Setup Time</td><td class="tv g">≤15 Minutes</td></tr>'
      +'</tbody></table>',true)
    +CB('🏭','4. 5S & Cleanliness','',
      '<ul class="steps">'
      +S(1,'5S हर दिन लागू करें — केवल Inspection के लिए नहीं। Floor, Machine, Surrounding हमेशा Shine में।')
      +S(2,'Daily 5S Check Sheet भरना अनिवार्य (Shift Supervisor Verify करेगा)। Current Score 16/26 → <strong>Target 24/26</strong>।')
      +S(3,'Dust, Tape Pieces, Bare Bags Floor पर न छोड़ें।')
      +'</ul>')
    +CB('⚡','7. Power & Energy Saving','',
      '<ul class="steps">'
      +S(1,'Conveyor और Water Pumps बिना Load के न चलाएं।')
      +S(2,'Lights और Equipment Use के बाद तुरंत Switch Off करें।')
      +S(3,'Compressed Air Line में Leakage नहीं होनी चाहिए।')
      +'</ul>')
    +Al('d','⛔','⚡ Quality Error = Entire Team Responsibility | ⚡ SOP Violation = Performance Deduction | ⚡ GMP Follow = Promotion & Appraisal Evaluation')
  }
},

'WI-22': {
  code:'MET/WI/22', title:'Shift In-charge Responsibilities — Metalliser',
  scope:'Metalliser Department Shift In-charges', resp:['Shift Incharge/Supervisor'],
  body: function(){
    return CB('📋','Shift In-charge की मुख्य जिम्मेदारियां','Key Responsibilities',
      '<ul class="steps">'
      +S(1,'<strong>Machine & SCADA Monitoring:</strong> दोनों Machines पर जाकर SCADA में OD, Width, Micron, Spreader Angle, Tension Values Check करें। Operator सही Roll Data दर्ज कर रहा है — सुनिश्चित करें।')
      +S(2,'<strong>Production:</strong> Shift Target = <span class="tv g">10 Rolls</span> पूरा करना।')
      +S(3,'<strong>Planning Execution:</strong> Metalliser और Slitter दोनों में Production Planning लिखित अनुसार सुनिश्चित कराना।')
      +S(4,'<strong>Downgradation:</strong> Target = <span class="tv g">0% Downgradation</span>। कोई Roll Downgrade हो तो पूरा Analysis और Corrective Action।')
      +S(5,'<strong>Raw Material Control:</strong> Evaporation Boats, Aluminium Wire, O₂ Cylinders की उपलब्धता और उपयोग जांचना।')
      +S(6,'<strong>Tools:</strong> Tools List के अनुसार उपलब्धता और स्थिति Check करना।')
      +S(7,'<strong>Conveyor Management:</strong> सभी Conveyors खाली और साफ रखना।')
      +S(8,'<strong>Logbook Compliance:</strong> सभी Logbooks पूर्ण रूप से भरवाना और हस्ताक्षर करवाना।')
      +S(9,'<strong>Polyweb Slings Check:</strong> Slings की Condition और Damage की जांच।')
      +S(10,'<strong>Quality Check with QC:</strong> Low OD, Pin Hole, Crease और Scratches — QC Team के साथ Proper Light में निरीक्षण।')
      +S(11,'<strong>Cleanliness Reporting:</strong> साफ क्षेत्र की Photos Group पर Share करना।')
      +'</ul>')
    +CB('🎯','One Boat Cycle — Target','Production Target per Boat Cycle',
      '<div class="compare"><div class="cbox"><div class="cbox-t">HOD + NOD Mix</div><div class="cr"><span class="ck">Target</span><span class="cv g">8 Rolls</span></div><div class="cr"><span class="ck">Split</span><span class="cv">4 HOD + 4 NOD</span></div></div>'
      +'<div class="cbox"><div class="cbox-t">NOD Only</div><div class="cr"><span class="ck">Target</span><span class="cv g">10 Rolls</span></div><div class="cr"><span class="ck">Type</span><span class="cv">10 NOD</span></div></div></div>')
    +CB('👷','Accountability — Main & Backup Persons','',
      '<table class="t"><thead><tr><th>#</th><th>Main Responsible</th><th>E Code</th><th>Backup Person</th><th>E Code</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td>GHANSHYAM</td><td class="tv">30000201</td><td>MOHIT</td><td class="tv">30000426</td></tr>'
      +'<tr><td class="tv">2</td><td>ANUJ</td><td class="tv">30000227</td><td>AJAB SINGH</td><td class="tv">30000493</td></tr>'
      +'<tr><td class="tv">3</td><td>DISHANT</td><td class="tv">30000506</td><td>—</td><td class="tv">—</td></tr>'
      +'</tbody></table>',true)
  }
},

'WI-23': {
  code:'MET/WI/23', title:'AlOx Film Metallisation & Handling',
  scope:'Metalliser-1 (AlOx Film)', resp:['Main Operator','Assistant Operator','Shift Engineer','E&I Technician','Quality Person'],
  body: function(){
    return CB('📋','प्रक्रिया विवरण','Process Description',
      Al('i','ℹ️','AlOx Film = Specialty Film — अत्यंत सावधानी आवश्यक। Coating ≤40nm। Base Material: G12300 और G12331। Metalliser-1 पर Metallise on Corona Side (G12331) & Plain Side (G12300)।'))
    +CB('🔢','Step-wise Activities','Metalliser Process Steps',
      '<table class="t"><thead><tr><th>#</th><th>Activity</th><th>By Whom</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td>Metalliser Deep Cleaning — White Dust Remove करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">2</td><td>New Boats से Replace करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">3</td><td>सभी Rollers को Air और Wet Cloth से साफ करें</td><td>Asst. Operator</td></tr>'
      +'<tr><td class="tv">4</td><td>Hawkeye Sensors को Air और Wet Cloth से साफ करें</td><td class="tv b">E&I Tech</td></tr>'
      +'<tr><td class="tv">5</td><td>Hawkeye Monitor Calibration</td><td class="tv b">E&I Tech</td></tr>'
      +'<tr><td class="tv">6</td><td>कोई भी Probe Red नहीं दिखनी चाहिए Hawkeye Screen पर</td><td class="tv b">E&I Tech</td></tr>'
      +'<tr><td class="tv">7</td><td>Red Probe हो तो Problem Resolve होने तक Wait करें</td><td class="tv b">E&I Tech</td></tr>'
      +'<tr><td class="tv">8</td><td>O₂ Cylinders पूरी तरह भरे हों (150 bar pressure)</td><td>Shift Engineer</td></tr>'
      +'<tr><td class="tv">9</td><td>New Boats पर पहला Roll Normal OD 2.2 से Start करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">10</td><td>DTR1 Roller Web Path से By-pass करके AlOx Roll Setup</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">11</td><td>Machine में AlOx Recipe Select करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">12</td><td>Roll Start करें, Auto Mode में Metal OD 0.45 Stabilize करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">13</td><td>Metal OD Stabilize होने के बाद AlOx Process Start करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">14</td><td>Wire और Boat Power से Manual Correction करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">15</td><td>OD fluctuate हो तो Monitor करें और Changes करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">16</td><td>Roll End से पहले AlOx Process बंद करने से पहले Shutter Manually Close करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">17</td><td>Machine को AUTO Mode में Vent करें</td><td>Main Operator</td></tr>'
      +'<tr><td class="tv">18</td><td>AlOx Roll निकालें, Foam पर रखें, Ply-Pack सुनिश्चित करें</td><td>Asst. Operator</td></tr>'
      +'<tr><td class="tv">19</td><td>Samples Deform न हों — Quality Lab भेजते समय</td><td>Shift Engineer</td></tr>'
      +'<tr><td class="tv">20</td><td>24 घंटे बाद OD & Barrier Test के लिए Sample Quality Lab को दें</td><td>Shift Engineer</td></tr>'
      +'<tr><td class="tv">21</td><td>Quality: OD Check और Aged Sample 24h बाद Barrier Results</td><td class="tv b">Quality</td></tr>'
      +'<tr><td class="tv">22</td><td>OTR और WVTR Spec के अनुसार हों तो Coating Dept को भेजें</td><td class="tv b">Quality</td></tr>'
      +'</tbody></table>',true)
    +CB('📊','Machine Parameters','AlOx Target Values',
      '<table class="t"><thead><tr><th>Parameter</th><th>Target</th><th>UCL</th><th>LCL</th></tr></thead><tbody>'
      +'<tr><td>Optical Density (Metal)</td><td class="tv g">0.45</td><td class="tv">0.47</td><td class="tv">0.42</td></tr>'
      +'<tr><td>AlOx Target OD</td><td class="tv g">0.11</td><td colspan="2" class="tv">N/A</td></tr>'
      +'<tr><td>Base Film Transmittance</td><td class="tv g">88%</td><td colspan="2" class="tv">±1%</td></tr>'
      +'</tbody></table>'
      +Al('i','📦','Frequency: एक Boat Cycle पर केवल <strong>5 Rolls of 26,000m</strong>। Curing Time: Manufacturing के बाद Topcoat से पहले <strong>40 दिन</strong>।'),true)
    +CB('🤲','AlOx Rolls Handling Care','Handling Instructions',
      '<ul class="steps">'
      +S(1,'Roll को सीधे Floor पर न रखें। Floor पर रखते समय <strong>पर्याप्त Cushion</strong> रखें।')
      +S(2,'Storage में Roll को <strong>End Ply पर Hanging</strong> में रखें।')
      +S(3,'Properties Testing के समय <strong>AlOx Side को Touch न करें।</strong>')
      +S(4,'Slitting के दौरान Path Rollers Machine के समान Speed पर होने चाहिए।')
      +S(5,'Path Rollers पर <strong>Soft Material Cork Tape</strong> लगाएं — Scratches से बचाने के लिए।')
      +'</ul>')
  }
},

'WI-24': {
  code:'MET/WI/24', title:'Metallised Waste Reduction & Control',
  scope:'Metallised Waste Target — ≤1%', resp:['Metalliser Operator','Slitter Operator'],
  body: function(){
    return CB('🎯','Waste Control Targets','MANDATORY TARGETS',
      '<table class="t"><thead><tr><th>Waste Type</th><th>Limit</th><th>% Loss</th></tr></thead><tbody>'
      +'<tr><td>Metalliser Start-Stop</td><td class="tv g">100 Meters</td><td class="tv g">≤0.138%</td></tr>'
      +'<tr><td>Trim Waste</td><td class="tv g">15mm/2900MM</td><td class="tv g">0.54%</td></tr>'
      +'<tr><td>Slitter Sample Waste</td><td class="tv g">60m (7 Layers)</td><td class="tv g">≤0.1%</td></tr>'
      +'<tr><td>B-Grade Waste</td><td class="tv r">0%</td><td class="tv r">COMPULSORY ZERO</td></tr>'
      +'<tr><td><strong>TOTAL WASTE</strong></td><td class="tv g"><strong>≤0.8%</strong></td><td class="tv g"><strong>Target ≤1%</strong></td></tr>'
      +'</tbody></table>',true)
    +CB('⚡','Metalliser Operator — जिम्मेदारियां','Metalliser Waste Control',
      '<ul class="steps">'
      +S('2.1.1','<strong>Start-Stop Waste:</strong> Start = 90m, Stop = 10m, Total = <span class="tv g">100m</span>. Loss = (100×100/72000) = <span class="tv g">0.138%</span>। इससे ऊपर = Operator Responsibility।')
      +S('2.1.2','<strong>Trim Waste:</strong> Total Trim = <span class="tv g">15mm max</span> (दोनों तरफ मिलाकर)। Loss = (15×100/2900) = <span class="tv g">0.535%</span>। Web alignment perfect रखें।')
      +S('2.1.3','<strong>B-Grade Waste = 0%</strong> — Zero Tolerance। No Low OD, No Pinholes, No Scratches, No Crease, No OD Band।')
      +'</ul>')
    +CB('✂️','Slitter Operator — जिम्मेदारियां','Slitter Waste Control',
      '<ul class="steps">'
      +S('2.2','<strong>Sample Cut Discipline:</strong> 3 Samples per Jumbo = <span class="tv g">60m Only, 7 Layers (20m/Set)</span>। Loss = (60×100/72000) = <span class="tv g">0.083%</span>।')
      +S('','Extra Sample Cutting <span class="tv r">सख्त मना।</span> Quality visible हो तो 2 Samples sufficient (Approval के साथ)।')
      +'</ul>')
  }
},

'WI-25': {
  code:'MET/WI/25', title:'Slitting Process for Critical Customers',
  scope:'Slitter Machine', resp:['Slitter Operator','Slitter Trainee Operator'],
  body: function(){
    return CB('🔢','Critical Customer Slitting — Instructions','Step-by-Step',
      '<ul class="steps">'
      +S(1,'Metallization पूरी होने के बाद <strong>Planning File में Slitting Width Check</strong> करें।')
      +S(2,'Planning में <strong>Critical Customers जैसे JAYESH, PEPSICO</strong> के लिए Order है या नहीं, सुनिश्चित करें।')
      +S(3,'Critical Customers की Slitting Widths को <strong>Centre Position में रखें</strong> — Edge पर नहीं। इससे Low OD, Crease जैसे Downgradation से बचाव।')
      +S(4,'Customer Specification के साथ Slitting Dimensions <strong>Cross-Check</strong> करें — कोई Deviation नहीं।')
      +S(5,'<strong>HP Packing Mode के लिए</strong> — M/s AMCOR, UMAX और EXPORT के Customer Rolls पर <strong>Direction Arrow</strong> Paste करें।')
      +S(6,'<span class="tv r">G901 Material को G360 Material में नहीं Divert किया जा सकता</span> — Customer M/S के लिए।')
      +'</ul>'
      +Al('w','⚠️','Critical Customers = JAYESH, PEPSICO, AMCOR, UMAX, EXPORT। इनके लिए Center Position अनिवार्य है।'))
  }
},

'WI-26': {
  code:'MET/WI/26', title:'Met Jumbo Entry Procedure in SAP',
  scope:'Metallisers Metalliser-1 & 2', resp:['Metallizer Operator (Logbook)','Metallizer Supervisor (SAP Entry)'],
  body: function(){
    return CB('🔢','SAP Entry — Step-by-Step','Met Jumbo Production Entry',
      '<ul class="steps">'
      +S(1,'SAP Software Open करें → <strong>PROD</strong> Double Click करें। Login ID: <span class="tv">POLY_MATEL_E</span>')
      +S(2,'T Code: <strong>COR1</strong> Double Click करें — Metalliser Production Order बनाने के लिए।')
      +S(3,'Material Type <span class="tv g">3SF-G.....</span> fill करें। Plant: <span class="tv">3001</span>। Quantity: कितने Jumbo। Process Order Type: Metalliser-2 = <span class="tv">GP05</span>, Metalliser-1 = <span class="tv">GP03</span>।')
      +S(4,'Order Quantity डालने के बाद Enter दबाएं। <strong>Green Flag Click</strong> करके Order Release करें।')
      +S(5,'<strong>Ctrl+S</strong> दबाएं → Order Release हो जाएगा। "Yes" Click करें।')
      +S(6,'Production Order Number Copy/याद करें। T Code: <strong>ZPP_METJUMBO (plant SAP T-code)</strong> Double Click करें। Plant: 3001।')
      +S(7,'<strong>Execute</strong> करें (Clock Symbol)। Logbook से Details भरने की Window खुलेगी।')
      +S(8,'Posting Date (Auto), <span class="tv">Base Roll ID</span> List से Select, <span class="tv">Consumed Length</span>, <span class="tv">Met Width</span> भरें।')
      +S(9,'Logbook से सभी Times भरें — Chamber Closing Time = Vacuum Time। Machine Speed Verify करें।')
      +S(10,'Supervisor Column में Names (Comma के साथ), Downtime Minutes, Remark (P=Process/M=Mech/E=E&I/O=Others)।')
      +S(11,'<strong>Base Film</strong> Option Click करें → Metallise किया गया Bare Jumbo का Weight उठाएं।')
      +S(12,'Weight Copy-Paste करने के बाद <strong>"Process Jumbo"</strong> Click करें।')
      +S(13,'"Raw & Waste" Click करें। Excel Formula Sheet भी खोलें।')
      +S(14,'SAP से Top और Bottom Value Excel Formula में डालें। Wire Quantity दोनों में समान डालें (e.g. 50 Kg)।')
      +S(15,'SAP में Boat Quantity डालें। (Decimal में Value नहीं)। Boat & Wire का Batch "JM" Location से उठाएं।')
      +S(16,'Formula से <span class="tv">3SC-TW, 3SC-AD & 3SC-ALWW</span> की Value SAP में डालें।')
      +S(17,'<strong>Ctrl+S</strong> → Controlling Area: <span class="tv">3000</span>। Settlement Period: Financial Year के हिसाब से (April=01, May=02... Dec=10)।')
      +S(18,'"Test Run" Box <strong>Un-check</strong> करें → Ctrl+S Save।')
      +S(19,'Last Window: Sticker Printout = "Yes" / No Print = "No"।')
      +S(20,'<strong>"Confirmation Saved"</strong> Message आएगा = Entry Complete! T Code <span class="tv">ZJUMBO_PROD</span> से Verify करें।')
      +'</ul>')
  }
},

'SL-WI-09': {
  code:'MET/SL/WI/09', title:'Slitting Supervisor Job Responsibility',
  scope:'Slitting Operations', resp:['Slitter Supervisor / Shift In-charge','Slitter Operator (Main — As per Sequence)'],
  body: function(){
    return CB('📋','Supervisor की मुख्य जिम्मेदारियां','Key Responsibilities',
      '<ul class="steps">'
      +S(1,'Production Entry केवल निर्धारित <strong>3 मुख्य Operators</strong> द्वारा क्रमवार होगी।')
      +S(2,'मुख्य Operator अनुपस्थित हो तो <strong>Alternate Operator</strong> Entry करेगा।')
      +S(3,'प्रत्येक Entry के बाद Operator को निर्धारित <strong>Form पर Sign</strong> करना अनिवार्य।')
      +S(4,'Supervisor द्वारा Entry की <strong>दैनिक जांच</strong>।')
      +S(5,'गलत Entry = <strong>Personal Accountability</strong> + जरूरत होने पर NCR Issue।')
      +S(6,'<strong>Waste Management:</strong> Waste Weight बैग और Register में Entry। Offcut और 6-Grade Rolls अलग-अलग बैग में Shift कराना।')
      +S(7,'<strong>5S Compliance:</strong> कार्यक्षेत्र में 5S मानकों का पालन।')
      +S(8,'<strong>Logbook Compliance:</strong> सभी Logbooks पूर्ण रूप से भरवाना और Sign।')
      +S(9,'<strong>Roll Marking:</strong> AMCOR, UMAX और EXPORT Rolls पर Direction Arrow Marking सुनिश्चित करना।')
      +S(10,'<strong>Slitter Data Sharing:</strong> Slitters Running Data की Photos Group पर Share करना।')
      +'</ul>')
    +CB('👷','Accountability — Main & Backup Persons','',
      '<table class="t"><thead><tr><th>#</th><th>Main Responsible</th><th>E Code</th><th>Backup Person</th><th>E Code</th></tr></thead><tbody>'
      +'<tr><td class="tv">1</td><td>MANJEET</td><td class="tv">30000263</td><td>ISHWAR TIWARI</td><td class="tv">30000361</td></tr>'
      +'<tr><td class="tv">2</td><td>GURPREET</td><td class="tv">30000430</td><td>PARVEZ ALI</td><td class="tv">30000266</td></tr>'
      +'<tr><td class="tv">3</td><td>MOHIT</td><td class="tv">30000426</td><td>SANJAY</td><td class="tv">30000348</td></tr>'
      +'</tbody></table>',true)
  }
},

'SL-WI-10': {
  code:'MET/SL/WI/10', title:'Meta Slitting Production Entry in SAP',
  scope:'Metallisers Met Slitter-1 & 2', resp:['Metallizer Operator (Logbook)','Metallizer Supervisor (SAP Entry)'],
  body: function(){
    return CB('🔢','SAP Slitting Entry — ZPP_SLIT','Step-by-Step',
      '<ul class="steps">'
      +S(1,'SAP Software Open करें → <strong>PROD</strong> Double Click। Login ID: <span class="tv">POLY_MATEL_E</span>')
      +S(2,'T Code: <strong>ZPP_SLIT</strong> (Slitting Process) Double Click करें।')
      +S(3,'नीचे Details Fill करें: <br><span class="tv">Material</span>: 3FG-G.... | <span class="tv">No of Rolls</span>: 2/3/4/5 | <span class="tv">Machine</span>: 3-M1_S (Metalliser-1) / 3-M1_S (Metalliser-2)<br><span class="tv">Core Thickness</span>: 13/15/16 | <span class="tv">Core ID</span>: 3/6/8 | <span class="tv">Core Type</span>: RC/New<br><span class="tv">Film Thickness</span>: 8/10/12/19 | <span class="tv">Length</span>: 24000/36000<br><span class="tv">Treatment</span>: Chemical | <span class="tv">Metal Side</span>: I/O')
      +S(4,'"Enter" Press करें। Batch No. Verify करें — Logbook के अनुसार सही है?')
      +S(5,'अब correct Details Insert करें:<br><span class="tv">Width</span>: Logbook से | <span class="tv">Grade</span>: 2=Okay / 3=B-Grade / 5=Downgraded+Salvageable / 6=Offcut / 7=Coating Dept / 8=Okay Order Awaited<br><span class="tv">Roll Position</span>: L/C/R (3 Rolls) या L/A/B/R (4 Rolls) — Operator Side = L, Drive Side = R<br><span class="tv">Joint</span>: Number of Joints (Domestic ≤2, Export ≤1)<br><span class="tv">Joint from Top</span>: Joint की Length')
      +S(6,'Grade 3/5/8 के लिए: <span class="tv r">Downgrade Reason</span> List से Select। <span class="tv">Remark</span>: Complete Remark (e.g. "Low OD Edge 20mm 1.6 to 1.9")।')
      +S(7,'सभी Details Check करें। Posting Date Correct है? <strong>"Create Process Order"</strong> Click करें।')
      +S(8,'<strong>Ctrl+S</strong> → Controlling Area: <span class="tv">3000</span>। Settlement Period: April=01, May=02... Dec=10।')
      +S(9,'"Test Run" Box <strong>Un-check</strong> → Ctrl+S Save।')
      +S(10,'Sticker Printout: Yes/No। T Code <span class="tv">ZSLIT_PROD</span> से Production Verify करें।')
      +S(11,'<span class="tv r">5-Grade Rolls</span> को Conveyor से Dedicated 5-Grade Area में Move करें।')
      +'</ul>')
  }
}

}; // end SOP_DETAIL

var _sopViewCode = null;

function showSOPDetail(code) {
  _sopViewCode = code;
  var pg = document.getElementById('pg-sops');
  var d = SOP_DETAIL[code];
  if (!d) return;
  var respH = d.resp.map(function(r){return '<span class="tag c">'+r+'</span>';}).join('');
  pg.innerHTML =
    '<div style="margin-bottom:14px">'
    +'<button class="btn btn-s" onclick="rSOPs(document.getElementById(\'pg-sops\'))" style="margin-bottom:12px">← वापस SOPs सूची</button>'
    +'<div class="ph-code">'+d.code+'</div>'
    +'<div class="ph-title" style="font-size:22px">'+d.title+'</div>'
    +'<div style="margin-top:8px;font-size:12px;color:var(--muted)"><strong>Scope:</strong> '+d.scope+'</div>'
    +'<div class="tags" style="margin-top:8px"><span class="tag a">Responsibility:</span>'+respH+'</div>'
    +'</div>'
    + d.body();
}

function rSOPs(pg){
  _sopViewCode = null;
  var g=MODE==='free';
  var sopCards = [
    
    {code:'SOP-01',ico:'🏭',title:'Main Metallization Process',sub:'Master 10-Step Cycle — Film to SAP Entry',cat:'SOP',cc:'var(--gold)'},
    {code:'SOP-02',ico:'🏗️',title:'Jumbo Roll Movement',sub:'Metallised Floor — Conveyor, Crane, Safety Helmet',cat:'SOP',cc:'var(--gold)'},
    {code:'SOP-03',ico:'🌀',title:'Vacuum System Operation',sub:'Pump Down Sequence — Roughing→Booster→DP→Cryo',cat:'SOP',cc:'var(--gold)'},
    {code:'SOP-04',ico:'⚗️',title:'AlBond Metallization Parameters',sub:'ABM22: 650m/min | ABM25: 750m/min | Intensity 4.0–5.5',cat:'SOP',cc:'var(--orange)'},
    {code:'SOP-05',ico:'🌡️',title:'Met CPP Parameters',sub:'Drum -20°C | 660 m/min | Tension 120–150N | OUT',cat:'SOP',cc:'var(--cyan)'},
    {code:'SOP-06',ico:'📏',title:'OD Set Parameters',sub:'2.2 / 2.5 / 2.8 — Customer-wise Hawkeye Set Points',cat:'SOP',cc:'var(--blue)'},
    {code:'SOP-07',ico:'♻️',title:'Bare Waste Control',sub:'Unwinder Stop Diameter — Metalliser-1 & Metalliser-2 Core-wise',cat:'SOP',cc:'var(--green)'},
    {code:'SOP-08',ico:'🔩',title:'Copper Clamp Change (Hindi)',sub:'6 Steps — SCADA, Valve, Drain, Clean, Replace',cat:'SOP',cc:'var(--purple)'},
    {code:'SOP-09',ico:'〰️',title:'Slitting — Ripple Free Parameters',sub:'Tension 90 N/M | Nip 700 N/m² | Speed 500 M/Min',cat:'SOP',cc:'var(--cyan)'},
    {code:'SOP-10',ico:'🗑️',title:'Aluminum Dust Disposal',sub:'20L → 500L Container → Forklift → Scrap Yard',cat:'SOP',cc:'var(--red)'},
,
    {code:'WI-07',ico:'🛡️',title:'Shield & Shutter Cleaning',sub:'Copper Rod, Scrapper, BN Paint, Gap Adjustment',cat:'WI',cc:'var(--blue)'},
    {code:'WI-08',ico:'🧵',title:'Film Threading',sub:'Double Face Tape, Driven Belt, Pivot Arm, Tension',cat:'WI',cc:'var(--green)'},
    {code:'WI-11',ico:'⚡',title:'Metallization Process',sub:'Computer Input, SOP, Boat Heat, Wire Feed, Shutter',cat:'WI',cc:'var(--gold)'},
    {code:'WI-12',ico:'🚪',title:'Open Metallizer Chamber',sub:'Vent Complete, Area Free, Rail Clear, Enable+Open',cat:'WI',cc:'var(--blue)'},
    {code:'WI-13',ico:'🔍',title:'Quality Inspection During Met',sub:'Top 10 Layers, Defect Control, Logbook, Job Card',cat:'WI',cc:'var(--green)'},
    {code:'WI-17',ico:'🗑️',title:'Film Waste Disposal',sub:'Bare→Erema, Met→D-Met, Cores→Scrap, Shift End',cat:'WI',cc:'var(--gold)'},
    {code:'WI-18',ico:'🔧',title:'Source Area Clean & Fix Boats',sub:'Remove Old, Clean Clamps, BN Paint, Graphite Tape',cat:'WI',cc:'var(--blue)'}
  ];
  var wiCards = [
    {code:'WI-01',ico:'⛑️',title:'General Safety Rules',sub:'PPE, E-Stop, LOTO, Al Dust, Confined Space',cat:'WI',cc:'var(--blue)'},
    {code:'WI-02',ico:'📋',title:'Slitter Machine Setup',sub:'Planning Sheet, Blade, Tension, Nip Roller',cat:'WI',cc:'var(--green)'},
    {code:'WI-03',ico:'🎞️',title:'Bare Film Selection',sub:'Planning MET/F/04, Shield Plate, Graphite Paint',cat:'WI',cc:'var(--gold)'},
    {code:'WI-04',ico:'⚡',title:'Boat Change Programme',sub:'Evaporator, Drum, Shield, Graphite Foil, Tight Fit',cat:'WI',cc:'var(--orange)'},
    {code:'WI-05',ico:'⛔',title:'Moving Parts Safety',sub:'Guards, No Loose Clothes, Slitter Dancer Roller',cat:'WI',cc:'var(--red)'},
    {code:'WI-06',ico:'🥁',title:'Coating Drum Cleaning',sub:'Foot Switch, Drum Cleaner, Acetone, Rubber Gloves',cat:'WI',cc:'var(--cyan)'},
    {code:'WI-09',ico:'🔧',title:'Shaft in Bare Roll',sub:'Crane, Centre Adjust, Torque 160NM, Electric Trolley',cat:'WI',cc:'var(--blue)'},
    {code:'WI-10',ico:'🔄',title:'Roll Loading & Unloading',sub:'Tension Off, Chucks, Crane Hanger, Felt Clean',cat:'WI',cc:'var(--green)'},
    {code:'WI-14',ico:'🌫️',title:'Al Dust / Heat / Noise',sub:'Exhaust Fan, 1 Min Wait, PPE, No Water Contact',cat:'WI',cc:'var(--orange)'},
    {code:'WI-15',ico:'📰',title:'Paper Tape Releasing & Storage',sub:'Gentle Remove, Metallic Bin, Goggles, No Acetone',cat:'WI',cc:'var(--muted)'},
    {code:'WI-16',ico:'🛠️',title:'Maintenance Every Cycle',sub:'Boats, Wire, Shutter, Drum, Shield, Thread, Core',cat:'WI',cc:'var(--cyan)'},
    {code:'WI-19',ico:'🍾',title:'Cork Tape Layering',sub:'30°–45° Spiral, IPA Clean, 2–3mm Overlap, Seal Ends',cat:'WI',cc:'var(--gold)'},
    {code:'WI-20',ico:'⚗️',title:'Boats Issuance & Consumption',sub:'Max 400 Floor | HOD Slip | Old Return = New Issue',cat:'WI',cc:'var(--purple)'},
    {code:'WI-21',ico:'🏭',title:'GMP & General Instructions',sub:'Safety, 0% B-Grade, 10 Rolls Target, 5S, Energy',cat:'WI',cc:'var(--blue)'},
    {code:'WI-22',ico:'👨‍💼',title:'Shift In-charge Responsibilities',sub:'SCADA, 10 Rolls/Shift, 0% Downgrade, Logbook',cat:'WI',cc:'var(--gold)'},
    {code:'WI-23',ico:'🔬',title:'AlOx Film Metallisation',sub:'OD 0.45, 40-Day Curing, Deep Clean, Foam Cushion',cat:'WI',cc:'var(--cyan)'},
    {code:'WI-24',ico:'📉',title:'Metallised Waste Reduction',sub:'100m Start-Stop | 15mm Trim | 60m Sample | 0% B-Grade',cat:'WI',cc:'var(--green)'},
    {code:'WI-25',ico:'⭐',title:'Critical Customers Slitting',sub:'JAYESH/PEPSICO — Center Position, Direction Arrow',cat:'WI',cc:'var(--orange)'},
    {code:'WI-26',ico:'💻',title:'SAP Met Jumbo Entry',sub:'COR1 → ZPP_METJUMBO (plant SAP T-code) → Logbook → Confirm',cat:'WI',cc:'var(--blue)'},
    {code:'SL-WI-09',ico:'📋',title:'Slitting Supervisor Responsibilities',sub:'Entry Sequence, Waste, 5S, Logbook, Roll Marking',cat:'SL-WI',cc:'var(--purple)'},
    {code:'SL-WI-10',ico:'💾',title:'SAP Slitting Entry (ZPP_SLIT)',sub:'Grade, Width, Position, Joint, Downgrade Reason',cat:'SL-WI',cc:'var(--cyan)'},
  ];

  function makeCards(cards){
    return cards.map(function(c){
      return '<div class="card" style="--cc:'+c.cc+'" onclick="showSOPDetail(\''+c.code+'\')">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        +'<span style="font-size:20px">'+c.ico+'</span>'
        +'<span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(240,165,0,.12);color:var(--gold);border:1px solid rgba(240,165,0,.25)">'+c.code+'</span>'
        +'</div>'
        +'<div class="card-title">'+c.title+'</div>'
        +'<div class="card-desc">'+c.sub+'</div>'
        +'<div class="card-meta">→ पूरा SOP देखें</div>'
        +'</div>';
    }).join('');
  }

  pg.innerHTML=
    '<div class="ph"><div class="ph-code">मॉड्यूल 4 — SOPs, WIs एवं फॉर्मेट</div>'
    +'<div class="ph-title">SOPs, WIs एवं <span>फॉर्मेट</span></div>'
    +'<div class="ph-desc">सम्पूर्ण दस्तावेज़ लाइब्रेरी — प्रत्येक SOP/WI का पूरा विवरण देखने के लिए Card पर Click करें।</div>'
    +'<div class="tags"><span class="tag a">8 SOPs</span><span class="tag c">17 WIs</span><span class="tag g">पूरी जानकारी उपलब्ध</span></div></div>'
    +(!g?Al('i','ℹ️','सामान्य सारांश दिखाए जा रहे हैं। कोड और आंतरिक KPI मोड में दिखेंगे।'):'')
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;letter-spacing:.15em;color:var(--gold);text-transform:uppercase;margin-bottom:10px;padding:4px 0;border-bottom:1px solid var(--bdr)">📄 Standard Operating Procedures (SOPs)</div>'
    +'<div class="cards">'+makeCards(sopCards)+'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;letter-spacing:.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px;margin-top:6px;padding:4px 0;border-bottom:1px solid var(--bdr)">📝 Work Instructions (WIs) — Metalliser</div>'
    +'<div class="cards">'+makeCards(wiCards.filter(function(c){return c.cat==='WI';}))+'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;letter-spacing:.15em;color:var(--purple);text-transform:uppercase;margin-bottom:10px;margin-top:6px;padding:4px 0;border-bottom:1px solid var(--bdr)">✂️ Work Instructions — Slitter (SL-WI)</div>'
    +'<div class="cards">'+makeCards(wiCards.filter(function(c){return c.cat==='SL-WI';}))+'</div>'
    +CB('📊','फॉर्मेट एवं रिकॉर्ड','MET F श्रृंखला',
      '<table class="t"><thead><tr><th>कोड</th><th>शीर्षक</th><th>कब भरें</th></tr></thead><tbody>'
      +'<tr><td class="tv">MET F-01</td><td>मेटलाइज़र Logbook</td><td>हर Cycle</td></tr>'
      +'<tr><td class="tv">MET F-02</td><td>Met Slitter Logbook</td><td>हर Order</td></tr>'
      +'<tr><td class="tv">MET F-04</td><td>Secondary Slitter Planning</td><td>दैनिक</td></tr>'
      +'<tr><td class="tv">MET F-07</td><td>Daily PM Checklist</td><td>हर Shift</td></tr>'
      +'<tr><td class="tv">MET F-08</td><td>Weekly PM Checklist</td><td>साप्ताहिक</td></tr>'
      +'<tr><td class="tv">MET F-09</td><td>Monthly PM Checklist</td><td>मासिक</td></tr>'
      +'<tr><td class="tv">MET F-10/11</td><td>Quarterly/Annual PM Metalliser-1/2</td><td>त्रैमासिक</td></tr>'
      +'<tr><td class="tv">F-PRD-07</td><td>Metallised Roll Job Card</td><td>हर Roll</td></tr>'
      +'<tr><td class="tv">PS F-05</td><td>Blade Record</td><td>मासिक</td></tr>'
      +'<tr><td class="tv">GMP F-10</td><td>व्यक्तिगत स्वच्छता Checklist</td><td>दैनिक</td></tr>'
      +'</tbody></table>');
}
